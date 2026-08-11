import React, { useMemo, useState } from 'react'
import { Users, X, Search, ShieldCheck } from 'lucide-react'
import type { User } from '../types/nursing'

interface Props {
  users: User[]
  currentUser: User
  onClose: () => void
  /* Mantidos por compatibilidade com o App; não são mais usados. */
  onAddUser?: unknown
  onEditUser?: unknown
  onDeleteUser?: unknown
}

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const COR_CARGO: Record<string, string> = {
  'Admin': 'bg-purple-100 text-purple-700',
  'Coordenador(a) de Enfermagem': 'bg-emerald-100 text-emerald-700',
  'Enfermeiro(a)': 'bg-sky-100 text-sky-700',
  'Técnico(a) de Enfermagem': 'bg-slate-200 text-slate-700'
}

/**
 * Consulta da equipe. O cadastro de acesso não acontece aqui: quem cria conta,
 * define cargo e COREN é a coordenação, pelo sistema do hospital, para que
 * exista um lugar só com essa responsabilidade.
 */
export const UserManagementModal: React.FC<Props> = ({ users, currentUser, onClose }) => {
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    const t = semAcento(busca).trim()
    return users
      .filter(u => !t || semAcento(`${u.name} ${u.role} ${u.coren || ''}`).includes(t))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [users, busca])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-azul-900/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <header className="flex items-center gap-3 bg-azul-800 px-5 py-4 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Users size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-tight">Equipe de Enfermagem</h2>
            <p className="text-xs text-azul-200">Hospital Municipal Maria Veneri</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <div className="border-b border-borda p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3.5 text-tinta-fraca" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, cargo ou COREN"
              className="w-full rounded-lg border-2 border-borda-forte py-3 pl-10 pr-3 text-base focus:border-azul-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-tinta-fraca">
            {lista.length} profissional{lista.length === 1 ? '' : 'is'}
          </p>

          {lista.map(u => (
            <div
              key={u.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                u.id === currentUser.id ? 'border-azul-500 bg-azul-050' : 'border-borda'
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-azul-100 font-bold text-azul-800">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tinta">{u.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${COR_CARGO[u.role] || 'bg-slate-200 text-slate-700'}`}>
                    {u.role}
                  </span>
                  {u.coren && <span className="text-[11px] text-tinta-fraca">{u.coren}</span>}
                  {u.id === currentUser.id && (
                    <span className="text-[11px] font-bold text-azul-700">você</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {lista.length === 0 && (
            <p className="py-8 text-center text-sm text-tinta-fraca">
              Ninguém encontrado com esse termo.
            </p>
          )}
        </div>

        <footer className="flex items-start gap-2 border-t border-borda bg-azul-050 p-4 text-xs text-tinta-fraca">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-tinta-fraca" />
          <p>
            Acessos, cargos e COREN são definidos pela coordenação no sistema do hospital,
            em <b>Pessoas</b>. Assim existe um único lugar responsável por quem entra e com
            qual permissão.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default UserManagementModal
