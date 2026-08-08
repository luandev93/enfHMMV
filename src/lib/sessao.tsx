/**
 * Sessão do app de enfermagem.
 *
 * Substitui o antigo login por usuário e PIN. Agora quem autentica é o
 * Firebase Auth: a senha nunca trafega nem fica guardada no banco, e o
 * acesso é criado pela coordenação, não por autocadastro.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updatePassword, EmailAuthProvider,
  reauthenticateWithCredential, type User as ContaFirebase
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { doc as docRef, setDoc } from 'firebase/firestore'
import { auth, db, COL, completarLogin, paraUsuarioDaTela, type PerfilUsuario } from './firebase'
import type { User } from '../types/nursing'

interface Sessao {
  conta: ContaFirebase | null
  perfil: PerfilUsuario | null
  /** O mesmo perfil no formato que as telas antigas já usam. */
  usuario: User | null
  carregando: boolean
  ehCoordenacao: boolean
  ehEnfermeiro: boolean
  precisaTrocarSenha: boolean
  /** Motivo pelo qual o acesso foi negado (null quando liberado ou sem conta). */
  motivoBloqueio: 'sem-cadastro' | 'inativo' | 'enfermagem-inativa' | 'sem-enfermagem' | null
  concluirTrocaDeSenha: () => Promise<void>
  entrar: (email: string, senha: string) => Promise<unknown>
  sair: () => Promise<void>
  recuperarSenha: (email: string) => Promise<void>
  trocarSenha: (atual: string, nova: string) => Promise<void>
}

const Contexto = createContext<Sessao | null>(null)

export function ProvedorSessao ({ children }: { children: ReactNode }) {
  const [conta, setConta] = useState<ContaFirebase | null>(null)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => onAuthStateChanged(auth, c => {
    setConta(c)
    if (!c) { setPerfil(null); setCarregando(false) }
  }), [])

  useEffect(() => {
    if (!conta) return
    setCarregando(true)
    return onSnapshot(
      doc(db, COL.usuarios, conta.uid),
      s => {
        setPerfil(s.exists() ? ({ id: s.id, ...s.data() } as PerfilUsuario) : null)
        setCarregando(false)
      },
      err => {
        // Erro de permissão ao ler o perfil: o usuário existe no Auth mas
        // as regras do Firestore negaram a leitura. Armazenamos um perfil
        // mínimo para que a tela possa exibir a mensagem correta.
        console.error('Erro ao carregar perfil:', err)
        setPerfil(null)
        setCarregando(false)
      }
    )
  }, [conta])

  const liberado = Boolean(perfil?.ativo && perfil?.enfermagem?.ativo)
  const cargo = liberado ? perfil!.enfermagem!.cargo : null

  /** Razão do bloqueio quando o usuário tem conta mas não pode entrar. */
  const motivoBloqueio: Sessao['motivoBloqueio'] = (() => {
    if (!conta || liberado) return null
    if (!perfil) return 'sem-cadastro'
    if (!perfil.ativo) return 'inativo'
    if (!perfil.enfermagem) return 'sem-enfermagem'
    if (!perfil.enfermagem.ativo) return 'enfermagem-inativa'
    return null
  })()

  const valor: Sessao = {
    conta,
    perfil,
    usuario: liberado ? paraUsuarioDaTela(perfil!) : null,
    carregando,
    ehCoordenacao: cargo === 'Admin' || cargo === 'Coordenador(a) de Enfermagem',
    ehEnfermeiro: cargo === 'Enfermeiro(a)' || cargo === 'Admin' || cargo === 'Coordenador(a) de Enfermagem',
    precisaTrocarSenha: Boolean(perfil?.senhaProvisoria),
    motivoBloqueio,
    async concluirTrocaDeSenha () {
      await setDoc(docRef(db, COL.usuarios, conta!.uid), { senhaProvisoria: false }, { merge: true })
    },
    entrar: (email, senha) => signInWithEmailAndPassword(auth, completarLogin(email), senha),
    sair: () => signOut(auth),
    recuperarSenha: email => sendPasswordResetEmail(auth, completarLogin(email)),
    async trocarSenha (atual, nova) {
      const cred = EmailAuthProvider.credential(auth.currentUser!.email!, atual)
      await reauthenticateWithCredential(auth.currentUser!, cred)
      await updatePassword(auth.currentUser!, nova)
    }
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSessao () {
  const s = useContext(Contexto)
  if (!s) throw new Error('useSessao precisa estar dentro de ProvedorSessao.')
  return s
}

export function traduzirErro (e: any): string {
  const mapa: Record<string, string> = {
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/user-not-found': 'Não existe conta com esse e-mail.',
    'auth/invalid-email': 'Esse e-mail não é válido.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns minutos.',
    'auth/network-request-failed': 'Sem conexão. Verifique a internet.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/requires-recent-login': 'Por segurança, saia e entre de novo antes de trocar a senha.',
    'permission-denied': 'Seu acesso não tem permissão para esta área.'
  }
  return mapa[e?.code] || e?.message || 'Não foi possível concluir.'
}
