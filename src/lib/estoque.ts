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

/** O Firestore recusa campos indefinidos. */
function semIndefinidos (valor: any): any {
  if (Array.isArray(valor)) return valor.map(semIndefinidos)
  if (valor && typeof valor === 'object' && !valor.toDate) {
    const saida: any = {}
    Object.entries(valor).forEach(([k, v]) => {
      if (v === undefined) return
      saida[k] = semIndefinidos(v)
    })
    return saida
  }
  return valor
}

export interface ItemFarmacia {
  id: string
  codigo: string
  descricao: string
  unidade: string
  tipo: string
  principioAtivo: string
  /** Classe da Portaria 344 (A1, B1, C1...). Vazio quando não é controlado. */
  controlado: string
  /** Item que só sai com paciente e prescritor identificados. */
  exigePaciente?: boolean
  /** Item de uso coletivo: nunca sai em nome de paciente. */
  consumoInterno?: boolean
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
  const snap = await getDocs(query(collection(db, COL.usuarios), where('medico.ativo', '==', true)))
  return snap.docs
    .map(d => {
      const p = d.data() as any
      return {
        id: d.id,
        nome: p.nome,
        conselho: p.conselho?.sigla || '',
        numero: p.conselho?.numero || '',
        uf: p.conselho?.uf || '',
        especialidade: p.medico?.especialidade || ''
      }
    })
    .filter(p => p.nome)
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
  exigePaciente?: boolean
  consumoInterno?: boolean
  qtdSolicitada: number
}

export interface NovaSolicitacao {
  setor: string
  /** Local de estoque do setor, para onde vai a reposição. */
  setorEstoqueId?: string
  /** Marcado: o item é consumido agora. Desmarcado: entra no estoque do setor. */
  paraConsumo: boolean
  linhas: LinhaSolicitacao[]
  pacienteNome?: string
  pacienteCPF?: string
  prescritorNome?: string
  prescritorConselho?: string
  observacao?: string
  solicitanteNome: string
  solicitanteConselho?: string
}

/** Precisa identificar paciente e prescritor? Item de uso coletivo nunca precisa. */
export const exigeIdentificacao = (l: LinhaSolicitacao) =>
  !l.consumoInterno && Boolean(l.controlado || l.exigePaciente)

export function validarSolicitacao (s: NovaSolicitacao): string | null {
  if (!s.linhas.length) return 'Adicione pelo menos um item.'
  if (s.linhas.some(l => !(l.qtdSolicitada > 0))) return 'Há item sem quantidade.'
  if (!s.setor?.trim()) return 'Informe o setor.'

  if (!s.paraConsumo && !s.setorEstoqueId) {
    return 'Este setor ainda não tem estoque próprio no sistema. Peça à farmácia para vincular, ou marque que o item será consumido agora.'
  }

  // Reposição de estoque não sai em nome de paciente.
  if (!s.paraConsumo) return null

  const exigente = s.linhas.find(exigeIdentificacao)
  if (exigente) {
    if (!s.pacienteNome?.trim()) {
      return `"${exigente.descricao}" só é dispensado com o nome do paciente.`
    }
    if (!s.prescritorNome?.trim()) {
      return `"${exigente.descricao}" só é dispensado com o prescritor identificado.`
    }
  }
  return null
}

export async function enviarSolicitacao (s: NovaSolicitacao) {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('Sessão expirada. Entre de novo.')

  const erro = validarSolicitacao(s)
  if (erro) throw new Error(erro)

  await addDoc(collection(db, COL.solicitacoes), semIndefinidos({
    origem: 'enfermagem',
    status: 'pendente',
    setor: s.setor.trim(),
    setorEstoqueId: s.setorEstoqueId || '',
    paraConsumo: s.paraConsumo !== false,
    linhas: s.linhas.map(l => ({
      itemId: l.itemId,
      codigo: l.codigo,
      descricao: l.descricao,
      unidade: l.unidade,
      tipo: l.tipo || '',
      controlado: l.controlado || '',
      exigePaciente: Boolean(l.exigePaciente),
      consumoInterno: Boolean(l.consumoInterno),
      qtdSolicitada: Number(l.qtdSolicitada),
      qtdAtendida: 0
    })),
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
  }))
}

export const mascaraCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
