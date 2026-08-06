import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, Trash2, X, Send, PackageCheck, CheckCircle2 } from 'lucide-react'
import type { User } from '../types/nursing'
import {
  carregarCatalogo, carregarPrescritores, enviarSolicitacao, exigeIdentificacao,
  mascaraCPF, registroDe, validarSolicitacao,
  type ItemFarmacia, type LinhaSolicitacao, type Prescritor
} from '../lib/estoque'
import { listarSetoresComEstoque, type SetorEstoque } from '../lib/firebase'

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const SETORES = ['Pronto-Socorro', 'Clínica Médica', 'Sala de Parto', 'UTI']

/**
 * Pedido de medicamento e material à farmácia. Nada sai do estoque aqui:
 * a solicitação entra numa fila e só baixa depois que a farmácia libera.
 */
export function SolicitarFarmacia ({ currentUser }: { currentUser: User }) {
  const [catalogo, setCatalogo] = useState<ItemFarmacia[]>([])
  const [prescritores, setPrescritores] = useState<Prescritor[]>([])
  const [carregando, setCarregando] = useState(true)

  const [setor, setSetor] = useState(currentUser.setor || '')
  const [paraConsumo, setParaConsumo] = useState(true)
  const [setoresComEstoque, setSetoresComEstoque] = useState<SetorEstoque[]>([])
  const [busca, setBusca] = useState('')
  const [escolhido, setEscolhido] = useState<ItemFarmacia | null>(null)
  const [qtd, setQtd] = useState('')
  const [linhas, setLinhas] = useState<LinhaSolicitacao[]>([])

  const [pacienteNome, setPacienteNome] = useState('')
  const [pacienteCPF, setPacienteCPF] = useState('')
  const [prescritorNome, setPrescritorNome] = useState('')
  const [prescritorConselho, setPrescritorConselho] = useState('')
  const [buscaPrescritor, setBuscaPrescritor] = useState('')
  const [observacao, setObservacao] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const campoQtd = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([carregarCatalogo(), carregarPrescritores(), listarSetoresComEstoque()])
      .then(([c, p, s]) => { setCatalogo(c); setPrescritores(p); setSetoresComEstoque(s) })
      .catch(e => setErro(e?.message || 'Não foi possível carregar o catálogo da farmácia.'))
      .finally(() => setCarregando(false))
  }, [])

  const resultados = useMemo(() => {
    const t = semAcento(busca).trim()
    if (!t) return []
    return catalogo
      .filter(i => semAcento(`${i.descricao} ${i.principioAtivo} ${i.codigo}`).includes(t))
      .slice(0, 25)
  }, [busca, catalogo])

  const prescritoresFiltrados = useMemo(() => {
    const t = semAcento(buscaPrescritor).trim()
    return prescritores.filter(p => !t || semAcento(`${p.nome} ${p.numero || ''}`).includes(t)).slice(0, 15)
  }, [buscaPrescritor, prescritores])

  const precisaIdentificar = paraConsumo && linhas.some(exigeIdentificacao)
  const soUsoColetivo = linhas.length > 0 && linhas.every(l => l.consumoInterno)
  const estoqueDoSetor = setoresComEstoque.find(s => s.setor === setor)

  function adicionar () {
    setErro('')
    if (!escolhido) return setErro('Escolha o item.')
    const n = Number(qtd)
    if (!(n > 0)) return setErro('Informe a quantidade.')

    setLinhas(a => {
      const i = a.findIndex(l => l.itemId === escolhido.id)
      if (i >= 0) {
        const c = [...a]
        c[i] = { ...c[i], qtdSolicitada: c[i].qtdSolicitada + n }
        return c
      }
      return [...a, {
        itemId: escolhido.id,
        codigo: escolhido.codigo,
        descricao: escolhido.descricao,
        unidade: escolhido.unidade,
        tipo: escolhido.tipo,
        controlado: escolhido.controlado || '',
        exigePaciente: escolhido.exigePaciente,
        consumoInterno: escolhido.consumoInterno,
        qtdSolicitada: n
      }]
    })
    setEscolhido(null); setBusca(''); setQtd('')
  }

  async function enviar () {
    const dados = {
      setor,
      setorEstoqueId: estoqueDoSetor?.id,
      paraConsumo,
      linhas,
      pacienteNome: paraConsumo ? pacienteNome : '',
      pacienteCPF: paraConsumo ? pacienteCPF : '',
      prescritorNome: paraConsumo ? prescritorNome : '',
      prescritorConselho: paraConsumo ? prescritorConselho : '',
      observacao,
      solicitanteNome: currentUser.name,
      solicitanteConselho: currentUser.coren
    }
    const problema = validarSolicitacao(dados)
    if (problema) return setErro(problema)

    setEnviando(true); setErro('')
    try {
      await enviarSolicitacao(dados)
      setEnviado(true)
      setLinhas([]); setPacienteNome(''); setPacienteCPF('')
      setPrescritorNome(''); setPrescritorConselho(''); setObservacao('')
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível enviar.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center">
        <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
        <h2 className="mt-3 text-lg font-bold text-slate-900">Solicitação enviada</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          A farmácia vai conferir e liberar. O item só sai do estoque depois que
          eles aceitarem — você não precisa acompanhar por aqui.
        </p>
        <button
          onClick={() => setEnviado(false)}
          className="mt-5 rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white"
        >Nova solicitação</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
          <PackageCheck size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">Solicitar à farmácia</h2>
          <p className="text-xs text-slate-500">
            {currentUser.name}{currentUser.coren ? ` · ${currentUser.coren}` : ''}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Setor</label>
        <select
          value={setor} onChange={e => setSetor(e.target.value)}
          className="w-full rounded-lg border-2 border-slate-300 p-3 text-base focus:border-emerald-600 focus:outline-none"
        >
          <option value="">Escolha o setor…</option>
          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox" checked={paraConsumo}
            onChange={e => setParaConsumo(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700"
          />
          <span className="text-sm">
            O item será consumido agora
            <span className="mt-0.5 block text-xs text-slate-500">
              {paraConsumo
                ? 'A farmácia dá baixa definitiva ao liberar.'
                : `O item entra no estoque de ${estoqueDoSetor?.nome || 'do setor'} e é baixado quando for usado.`}
            </span>
          </span>
        </label>

        {!paraConsumo && setor && !estoqueDoSetor && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {setor} ainda não tem estoque próprio no sistema. Peça à farmácia para vincular
            o setor a um local, ou marque que o item será consumido agora.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Item</label>

        {escolhido ? (
          <div className="flex items-start gap-2 rounded-lg border-2 border-emerald-600 bg-emerald-50 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{escolhido.descricao}</p>
              <p className="mt-1 text-xs text-slate-500">
                {escolhido.codigo} · {escolhido.unidade?.toLowerCase()}
                {escolhido.controlado && (
                  <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 font-bold text-purple-700">
                    controle especial {escolhido.controlado}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setEscolhido(null)} className="text-slate-400"><X size={18} /></button>
          </div>
        ) : (
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              disabled={carregando}
              placeholder={carregando ? 'Carregando catálogo…' : 'Nome, princípio ativo ou código'}
              className="w-full rounded-lg border-2 border-slate-300 py-3 pl-10 pr-3 text-base focus:border-emerald-600 focus:outline-none"
            />
            {resultados.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg">
                {resultados.map(i => (
                  <li key={i.id}>
                    <button
                      onClick={() => { setEscolhido(i); setBusca(''); setTimeout(() => campoQtd.current?.focus(), 60) }}
                      className="block w-full border-b border-slate-100 p-3 text-left hover:bg-slate-50"
                    >
                      <p className="text-sm font-semibold leading-tight">{i.descricao}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {i.codigo}
                        {i.controlado && <span className="ml-2 font-bold text-purple-700">controlado</span>}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {escolhido && (
          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Quantidade em {escolhido.unidade?.toLowerCase()}
              </label>
              <input
                ref={campoQtd} value={qtd} inputMode="numeric"
                onChange={e => setQtd(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') adicionar() }}
                className="w-full rounded-lg border-2 border-slate-300 p-3 text-base tabular-nums focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <button
              onClick={adicionar}
              className="flex items-center gap-1 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white"
            ><Plus size={18} /> Incluir</button>
          </div>
        )}
      </section>

      {linhas.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Itens da solicitação ({linhas.length})
          </h3>
          {linhas.map(l => (
            <div key={l.itemId} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{l.descricao}</p>
                <p className="text-xs text-slate-500">
                  {l.codigo}
                  {l.controlado && <span className="ml-2 font-bold text-purple-700">controle especial</span>}
                  {l.consumoInterno && <span className="ml-2 text-slate-500">uso coletivo</span>}
                  {!l.controlado && l.exigePaciente && (
                    <span className="ml-2 font-bold text-amber-700">exige paciente</span>
                  )}
                </p>
              </div>
              <span className="text-base font-bold tabular-nums">{l.qtdSolicitada}</span>
              <button
                onClick={() => setLinhas(a => a.filter(x => x.itemId !== l.itemId))}
                className="rounded p-2 text-slate-400 hover:bg-slate-100"
              ><Trash2 size={16} /></button>
            </div>
          ))}
        </section>
      )}

      {paraConsumo && !soUsoColetivo && (
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">
          {precisaIdentificar
            ? 'Há item que só é dispensado com paciente e prescritor identificados.'
            : 'Preenchimento opcional.'}
        </p>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Paciente {precisaIdentificar && <span className="text-red-600">*</span>}
          </label>
          <input
            value={pacienteNome} onChange={e => setPacienteNome(e.target.value)}
            className="w-full rounded-lg border-2 border-slate-300 p-3 text-base focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">CPF</label>
          <input
            value={pacienteCPF} inputMode="numeric" placeholder="000.000.000-00"
            onChange={e => setPacienteCPF(mascaraCPF(e.target.value))}
            className="w-full rounded-lg border-2 border-slate-300 p-3 text-base tabular-nums focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Médico prescritor {precisaIdentificar && <span className="text-red-600">*</span>}
          </label>
          <select
            value={prescritorNome}
            onChange={e => {
              const p = prescritores.find(x => x.nome === e.target.value)
              setPrescritorNome(e.target.value)
              setPrescritorConselho(p ? registroDe(p) : '')
            }}
            className="w-full rounded-lg border-2 border-slate-300 p-3 text-base focus:border-emerald-600 focus:outline-none"
          >
            <option value="">
              {prescritores.length ? 'Selecionar prescritor…' : 'Nenhum prescritor cadastrado'}
            </option>
            {prescritores.map(p => (
              <option key={p.id} value={p.nome}>
                {p.nome}{registroDe(p) ? ` — ${registroDe(p)}` : ''}
              </option>
            ))}
          </select>
          {prescritorConselho && (
            <p className="mt-1 text-xs text-slate-500">{prescritorConselho}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Outros detalhes
          </label>
          <textarea
            value={observacao} onChange={e => setObservacao(e.target.value)} rows={2}
            placeholder="Leito, urgência, o que for útil para a farmácia"
            className="w-full rounded-lg border-2 border-slate-300 p-3 text-base focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </section>
      )}

      {erro && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>
      )}

      <button
        onClick={enviar}
        disabled={enviando || linhas.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 p-4 text-base font-bold text-white disabled:opacity-40"
      >
        <Send size={18} />
        {enviando ? 'Enviando…' : `Enviar solicitação${linhas.length ? ` (${linhas.length})` : ''}`}
      </button>
    </div>
  )
}

export default SolicitarFarmacia
