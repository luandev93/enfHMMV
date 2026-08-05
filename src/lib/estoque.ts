/**
 * Farmácia, vista de dentro do app de enfermagem.
 *
 * Como os dois sistemas dividem o mesmo projeto Firebase, aqui não há ponte
 * nem segunda conexão: é o mesmo banco, com as regras controlando o que cada
 * pessoa alcança. A enfermagem lê o catálogo enxuto e cria solicitações; saldo
 * e preço ficam em coleções que ela não pode ler.
 */

import {
  collection, getDocs, addDoc, query, where, serverTimestamp
} from 'firebase/firestore'
import { db, auth, COL } from './firebase'

export interface ItemFarmacia {
  id: string
  codigo: string
  descricao: string
  unidade: string
  tipo: string
  principioAtivo: string
  /** Classe da Portaria 344 (A1, B1, C1...). Vazio quando não é controlado. */
  controlado: string
  ativo: boolean
}

export async function carregarCatalogo (): Promise<ItemFarmacia[]> {
  const snap = await getDocs(collection(db, 'catalogoPublico'))
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<ItemFarmacia, 'id'>) }))
    .filter(i => i.ativo !== false)
    .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'))
}

export interface Prescritor {
  id: string
  nome: string
  conselho?: string
  numero?: string
  uf?: string
  especialidade?: string
}

export async function carregarPrescritores (): Promise<Prescritor[]> {
  const snap = await getDocs(query(collection(db, 'profissionais'), where('tipo', '==', 'prescritor')))
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<Prescritor, 'id'>) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export const registroDe = (p: Prescritor) =>
  [p.conselho, p.numero, p.uf].filter(Boolean).join(' ')

export interface LinhaSolicitacao {
  itemId: string
  codigo: string
  descricao: string
  unidade: string
  tipo: string
  controlado: string
  qtdSolicitada: number
}

export interface NovaSolicitacao {
  setor: string
  linhas: LinhaSolicitacao[]
  pacienteNome?: string
  pacienteCPF?: string
  prescritorNome?: string
  prescritorConselho?: string
  observacao?: string
  solicitanteNome: string
  solicitanteConselho?: string
}

/** Item de controle especial exige paciente e prescritor identificados. */
export function validarSolicitacao (s: NovaSolicitacao): string | null {
  if (!s.linhas.length) return 'Adicione pelo menos um item.'
  if (s.linhas.some(l => !(l.qtdSolicitada > 0))) return 'Há item sem quantidade.'
  if (!s.setor?.trim()) return 'Informe o setor.'

  const controlado = s.linhas.find(l => l.controlado)
  if (controlado) {
    if (!s.pacienteNome?.trim()) {
      return `"${controlado.descricao}" é de controle especial: o nome do paciente é obrigatório.`
    }
    if (!s.prescritorNome?.trim()) {
      return `"${controlado.descricao}" é de controle especial: o prescritor é obrigatório.`
    }
  }
  return null
}

export async function enviarSolicitacao (s: NovaSolicitacao) {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('Sessão expirada. Entre de novo.')

  const erro = validarSolicitacao(s)
  if (erro) throw new Error(erro)

  await addDoc(collection(db, COL.solicitacoes), {
    origem: 'enfermagem',
    status: 'pendente',
    setor: s.setor.trim(),
    linhas: s.linhas.map(l => ({ ...l, qtdSolicitada: Number(l.qtdSolicitada), qtdAtendida: 0 })),
    pacienteNome: s.pacienteNome?.trim() || '',
    pacienteCPF: s.pacienteCPF?.trim() || '',
    prescritorNome: s.prescritorNome?.trim() || '',
    prescritorConselho: s.prescritorConselho || '',
    motivo: '',
    observacao: s.observacao?.trim() || '',
    solicitanteUid: usuario.uid,
    solicitanteNome: s.solicitanteNome,
    solicitanteConselho: s.solicitanteConselho || '',
    criadoEm: serverTimestamp()
  })
}

export const mascaraCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
