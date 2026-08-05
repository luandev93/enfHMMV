/**
 * Conexão única com o projeto Firebase do HMMV (`farmhmmv`).
 *
 * O app de enfermagem e o de estoque dividem o mesmo projeto: mesmo banco,
 * mesma base de usuários. Quem entra aqui usa a mesma conta que usa lá, e as
 * permissões de cada área saem das regras do Firestore.
 */

import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy,
  limit, serverTimestamp, writeBatch, Timestamp
} from 'firebase/firestore'
import type { ShiftReport, ScheduleEntry, User } from '../types/nursing'

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID
}

export const firebaseConfigurado = Boolean(config.apiKey && config.projectId)

const app = getApps().length ? getApp() : initializeApp(config)
export const auth = getAuth(app)

// Cache local: o plantão continua funcionando quando a rede oscila no corredor.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})

/* =========================================================
   Nomes das coleções
   ========================================================= */

export const COL = {
  usuarios: 'usuarios',      // compartilhada com o estoque
  plantoes: 'plantoes',      // antigos shift_reports
  escalas: 'escalas',        // antigos schedules
  solicitacoes: 'solicitacoes'
} as const

/* =========================================================
   Usuários
   ========================================================= */

/** Documento de usuário como está no banco, com a parte de enfermagem. */
export interface PerfilUsuario {
  id: string
  nome: string
  email: string
  ativo: boolean
  nascimento?: string
  telefone?: string
  /** Papel no estoque: adm, farmaceutico, auxiliar, enfermagem ou vazio. */
  funcao?: string
  enfermagem?: {
    ativo: boolean
    cargo: User['role']
    coren?: string
    setorPadrao?: string
  }
}

export async function lerPerfil (uid: string): Promise<PerfilUsuario | null> {
  const s = await getDoc(doc(db, COL.usuarios, uid))
  return s.exists() ? ({ id: s.id, ...s.data() } as PerfilUsuario) : null
}

/** Só quem tem a parte de enfermagem ativa aparece nas listas do app. */
export async function listarEquipe (): Promise<PerfilUsuario[]> {
  const snap = await getDocs(query(collection(db, COL.usuarios), where('enfermagem.ativo', '==', true)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as PerfilUsuario))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Converte o perfil do banco para o formato que as telas já esperam. */
export function paraUsuarioDaTela (p: PerfilUsuario): User {
  return {
    id: p.id,
    name: p.nome,
    role: p.enfermagem?.cargo || 'Técnico(a) de Enfermagem',
    coren: p.enfermagem?.coren,
    birthDate: p.nascimento || '',
    username: p.email,
    pin: '',
    setor: p.enfermagem?.setorPadrao || ''
  }
}

/* =========================================================
   Relatórios de plantão
   ========================================================= */

/**
 * Busca por período. Carregar tudo a cada abertura consome leitura à toa e,
 * com o passar dos meses, chega no limite diário do plano gratuito.
 */
export async function listarPlantoes (opcoes: {
  desde?: string
  ate?: string
  autorId?: string
  maximo?: number
} = {}): Promise<ShiftReport[]> {
  const restricoes: any[] = []
  if (opcoes.desde) restricoes.push(where('date', '>=', opcoes.desde))
  if (opcoes.ate) restricoes.push(where('date', '<=', opcoes.ate))
  if (opcoes.autorId) restricoes.push(where('authorId', '==', opcoes.autorId))

  const snap = await getDocs(query(
    collection(db, COL.plantoes),
    ...restricoes,
    orderBy('date', 'desc'),
    limit(opcoes.maximo || 200)
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShiftReport))
}

/** Últimos N dias — é o que o painel abre por padrão. */
export function listarPlantoesRecentes (dias = 60, maximo = 120) {
  const d = new Date(Date.now() - dias * 86400000)
  const iso = d.toISOString().slice(0, 10)
  return listarPlantoes({ desde: iso, maximo })
}

const LIMITE_ANEXOS = 700 * 1024   // folga dentro do teto de 1 MiB do documento

export async function salvarPlantao (relatorio: ShiftReport) {
  const peso = (relatorio.attachments || [])
    .reduce((s, a) => s + (a.dataUrl?.length || 0), 0)
  if (peso > LIMITE_ANEXOS) {
    throw new Error(
      'Os anexos deste relatório passam do tamanho permitido. ' +
      'Remova ou reduza alguma imagem antes de salvar.'
    )
  }

  const id = relatorio.id || doc(collection(db, COL.plantoes)).id
  await setDoc(doc(db, COL.plantoes, id), {
    ...relatorio,
    id,
    updatedAt: Date.now(),
    atualizadoEm: serverTimestamp()
  }, { merge: true })
  return id
}

export async function excluirPlantao (id: string) {
  await deleteDoc(doc(db, COL.plantoes, id))
}

/* =========================================================
   Escalas
   ========================================================= */

export async function listarEscalas (mes?: string): Promise<ScheduleEntry[]> {
  const restricoes: any[] = []
  if (mes) {
    restricoes.push(where('date', '>=', `${mes}-01`))
    restricoes.push(where('date', '<=', `${mes}-31`))
  }
  const snap = await getDocs(query(collection(db, COL.escalas), ...restricoes, orderBy('date')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry))
}

export async function salvarEscalas (entradas: ScheduleEntry[]) {
  let lote = writeBatch(db)
  let n = 0
  for (const e of entradas) {
    const id = e.id || doc(collection(db, COL.escalas)).id
    lote.set(doc(db, COL.escalas, id), { ...e, id }, { merge: true })
    if (++n >= 400) { await lote.commit(); lote = writeBatch(db); n = 0 }
  }
  if (n) await lote.commit()
}

export async function excluirEscala (id: string) {
  await deleteDoc(doc(db, COL.escalas, id))
}

export { serverTimestamp, Timestamp }
