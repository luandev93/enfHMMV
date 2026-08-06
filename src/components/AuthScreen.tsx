import { useState, type FormEvent, type ReactNode } from 'react'
import { Stethoscope, Lock } from 'lucide-react'
import { useSessao, traduzirErro } from '../lib/sessao'
import { firebaseConfigurado } from '../lib/firebase'

const VERSAO = '1.2'

/**
 * Entrada do app. Não existe autocadastro: o acesso é criado pela
 * coordenação de enfermagem, junto com o cadastro no sistema do hospital.
 */
export default function AuthScreen () {
  const { entrar, recuperarSenha } = useSessao()
  const [modo, setModo] = useState<'entrar' | 'recuperar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [recado, setRecado] = useState('')
  const [ocupado, setOcupado] = useState(false)

  if (!firebaseConfigurado) {
    return (
      <Moldura titulo="Falta configurar o Firebase">
        <p className="text-sm text-slate-300">
          Preencha as chaves <code>VITE_FB_*</code> no arquivo <code>.env</code> e
          recompile o projeto.
        </p>
      </Moldura>
    )
  }

  async function enviar (e: FormEvent) {
    e.preventDefault()
    setErro(''); setRecado(''); setOcupado(true)
    try {
      if (modo === 'entrar') await entrar(email, senha)
      else {
        await recuperarSenha(email)
        setRecado('Se existir conta com esse e-mail, o link de redefinição já está a caminho.')
      }
    } catch (err) {
      setErro(traduzirErro(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Moldura
      titulo={modo === 'entrar' ? 'Relatório de Enfermagem' : 'Recuperar a senha'}
      subtitulo={modo === 'entrar'
        ? 'Hospital Municipal Maria Veneri'
        : 'Enviamos um link para o seu e-mail.'}
    >
      <form onSubmit={enviar} className="mt-6 space-y-3">
        <input
          type="text" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Usuário ou e-mail" autoCapitalize="none" autoCorrect="off"
          autoComplete="username" required
          className="w-full rounded-lg border-2 border-transparent bg-white/95 p-3.5 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
        />

        {modo === 'entrar' && (
          <input
            type="password" value={senha} onChange={e => setSenha(e.target.value)}
            placeholder="Senha" autoComplete="current-password" required
            className="w-full rounded-lg border-2 border-transparent bg-white/95 p-3.5 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
          />
        )}

        {erro && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-200">{erro}</p>}
        {recado && <p className="rounded-lg bg-sky-500/15 p-3 text-sm text-sky-100">{recado}</p>}

        <button
          disabled={ocupado}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white p-4 text-base font-bold text-slate-900 disabled:opacity-50"
        >
          <Lock size={18} />
          {ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar link'}
        </button>

        <button
          type="button"
          onClick={() => { setModo(modo === 'entrar' ? 'recuperar' : 'entrar'); setErro(''); setRecado('') }}
          className="mx-auto block p-2 text-sm text-sky-200 underline"
        >
          {modo === 'entrar' ? 'Esqueci minha senha' : 'Voltar para a entrada'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        versão {VERSAO} · {new Date().getFullYear()}
      </p>
    </Moldura>
  )
}

function Moldura ({ titulo, subtitulo, children }: {
  titulo: string; subtitulo?: string; children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-900 bg-[radial-gradient(900px_420px_at_50%_-10%,#0e4a7b,transparent_65%)] p-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white text-sky-800">
            <Stethoscope size={30} />
          </div>
          <h1 className="text-xl font-bold text-white">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-slate-300">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
