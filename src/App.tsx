import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ShiftReport, ScheduleEntry, User, ReportAddendum } from './types/nursing'
import { DEFAULT_CHECKLIST } from './data/defaultChecklist'
import { Header } from './components/Header'
import AuthScreen from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { ShiftReportForm } from './components/ShiftReportForm'
import { ReportDetailModal } from './components/ReportDetailModal'
import { PendingSignaturesModal } from './components/PendingSignaturesModal'
import { UserManagementModal } from './components/UserManagementModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { ProvedorSessao, useSessao, traduzirErro } from './lib/sessao'

export const VERSAO = '1.6'
import {
  listarPlantoesRecentes, salvarPlantao, excluirPlantao,
  listarEscalas, salvarEscalas, excluirEscala,
  listarEquipe, ouvirEquipe, paraUsuarioDaTela
} from './lib/firebase'

export default function App () {
  return (
    <ProvedorSessao>
      <Aplicacao />
    </ProvedorSessao>
  )
}

/** Primeiro acesso: a senha entregue pela chefia precisa ser substituída. */
function TrocaObrigatoria () {
  const sessao = useSessao()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const campo = 'w-full rounded-lg border-2 border-borda-forte p-3 text-base focus:border-azul-600 focus:outline-none'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-lg font-bold text-tinta">Crie a sua senha</h1>
      <p className="mb-2 text-sm text-tinta-fraca">
        {sessao.perfil?.nome}, a senha que você recebeu é provisória e outras pessoas
        podem conhecê-la. Escolha uma senha só sua para continuar.
      </p>

      <input type="password" className={campo} placeholder="Senha atual"
        value={atual} onChange={e => setAtual(e.target.value)} />
      <input type="password" className={campo} placeholder="Senha nova"
        value={nova} onChange={e => setNova(e.target.value)} />
      <input type="password" className={campo} placeholder="Repita a senha nova"
        value={confirma} onChange={e => setConfirma(e.target.value)} />

      {erro && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      <button
        disabled={ocupado}
        onClick={async () => {
          setErro('')
          if (nova.length < 6) return setErro('A senha nova precisa ter pelo menos 6 caracteres.')
          if (nova === atual) return setErro('A senha nova precisa ser diferente da provisória.')
          if (nova !== confirma) return setErro('As duas senhas novas não coincidem.')
          setOcupado(true)
          try {
            await sessao.trocarSenha(atual, nova)
            await sessao.concluirTrocaDeSenha()
          } catch (e: any) {
            setErro(traduzirErro(e))
          } finally {
            setOcupado(false)
          }
        }}
        className="rounded-lg bg-azul-800 p-4 font-bold text-white disabled:opacity-50"
      >{ocupado ? 'Salvando…' : 'Salvar e entrar'}</button>

      <button onClick={sessao.sair} className="p-2 text-sm text-tinta-fraca underline">Sair</button>
    </div>
  )
}

function Aplicacao () {
  const sessao = useSessao()
  const currentUser = sessao.usuario

  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<ShiftReport[]>([])
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [erro, setErro] = useState('')

  const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard')
  const [editingReport, setEditingReport] = useState<ShiftReport | null>(null)
  const [viewingReport, setViewingReport] = useState<ShiftReport | null>(null)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  /* ---------------------------------------------------------
     Carga dos dados
     --------------------------------------------------------- */

  const carregar = useCallback(async () => {
    setCarregandoDados(true)
    setErro('')
    try {
      const [plantoes, escalas] = await Promise.all([
        listarPlantoesRecentes(60),
        listarEscalas()
      ])
      setReports(plantoes)
      setSchedule(escalas)
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar os dados.')
    } finally {
      setCarregandoDados(false)
    }
  }, [])

  // Listener em tempo real para a equipe (popula o select e os aniversários)
  useEffect(() => {
    if (!currentUser) {
      setUsers([])
      return
    }
    const unsub = ouvirEquipe(
      equipe => {
        setUsers(equipe.filter(p => p.enfermagem?.cargo !== 'Admin').map(paraUsuarioDaTela))
      },
      e => {
        console.error('Erro ao ouvir equipe:', e)
      }
    )
    return unsub
  }, [currentUser])

  const recarregarEquipe = useCallback(() => {
    if (!currentUser) return
    listarEquipe()
      .then(equipe => setUsers(equipe.filter(p => p.enfermagem?.cargo !== 'Admin').map(paraUsuarioDaTela)))
      .catch(e => console.error('Erro ao recarregar equipe:', e))
  }, [currentUser])

  useEffect(() => {
    if (currentUser) carregar()
    else { setReports([]); setSchedule([]) }
  }, [currentUser, carregar])

  /* ---------------------------------------------------------
     Relatórios
     --------------------------------------------------------- */

  const gravar = async (relatorio: ShiftReport) => {
    const id = await salvarPlantao(relatorio, sessao.conta?.uid)
    const completo = { ...relatorio, id }
    setReports(a => {
      const i = a.findIndex(r => r.id === id)
      if (i >= 0) { const c = [...a]; c[i] = completo; return c }
      return [completo, ...a]
    })
    return completo
  }

  const handleSaveReport = async (savedReport: ShiftReport) => {
    try {
      await gravar({ ...savedReport, updatedAt: Date.now() })
      setEditingReport(null)
      setCurrentView('dashboard')
    } catch (e: any) {
      alert(e?.message || 'Não foi possível salvar o relatório.')
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      await excluirPlantao(reportId)
      setReports(a => a.filter(r => r.id !== reportId))
      setViewingReport(null)
    } catch (e: any) {
      alert(e?.message || 'Não foi possível excluir. Só a coordenação pode apagar relatórios.')
    }
  }

  /** Aplica uma mudança pontual num relatório e grava. */
  const alterarRelatorio = async (reportId: string, mudar: (r: ShiftReport) => ShiftReport) => {
    const atual = reports.find(r => r.id === reportId)
    if (!atual) return
    try {
      await gravar(mudar(atual))
    } catch (e: any) {
      alert(e?.message || 'Não foi possível registrar a alteração.')
    }
  }

  const handleRegisterView = (reportId: string, user: User) =>
    alterarRelatorio(reportId, r => {
      const jaViu = (r.viewReceipts || []).some(v => v.userId === user.id)
      if (jaViu) return r
      return {
        ...r,
        viewReceipts: [
          ...(r.viewReceipts || []),
          { userId: user.id, userName: user.name, userRole: user.role, timestamp: Date.now() }
        ]
      }
    })

  const handleCoordinatorConference = (reportId: string, notes?: string) =>
    alterarRelatorio(reportId, r => ({
      ...r,
      coordinatorConference: {
        userId: currentUser!.id,
        userName: currentUser!.name,
        userRole: currentUser!.role,
        timestamp: Date.now(),
        notes
      },
      auditLogs: [
        ...(r.auditLogs || []),
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          editorId: currentUser!.id,
          editorName: currentUser!.name,
          editorRole: currentUser!.role,
          summary: 'Conferência da coordenação'
        }
      ]
    }))

  const handleValidateReport = (reportId: string, userId: string) =>
    alterarRelatorio(reportId, r => {
      const coAuthors = (r.coAuthors || []).map(c =>
        c.userId === userId ? { ...c, validated: true, validatedAt: Date.now() } : c
      )
      const todosAssinaram = coAuthors.length > 0 && coAuthors.every(c => c.validated)
      return {
        ...r,
        coAuthors,
        status: todosAssinaram ? 'concluido' : r.status
      }
    })

  const handleAddComplement = (reportId: string, text: string) =>
    alterarRelatorio(reportId, r => {
      const adendo: ReportAddendum = {
        id: `add-${Date.now()}`,
        authorId: currentUser!.id,
        authorName: currentUser!.name,
        authorRole: currentUser!.role,
        timestamp: Date.now(),
        text
      }
      return { ...r, complements: [...(r.complements || []), adendo] }
    })

  /* ---------------------------------------------------------
     Escala
     --------------------------------------------------------- */

  const handleAddScheduleEntry = async (nova: Omit<ScheduleEntry, 'id'>) => {
    const entrada = { ...nova, id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
    try {
      await salvarEscalas([entrada])
      setSchedule(a => [...a, entrada])
    } catch (e: any) {
      alert(e?.message || 'Só a coordenação pode alterar a escala.')
    }
  }

  const handleRemoveScheduleEntry = async (id: string) => {
    try {
      await excluirEscala(id)
      setSchedule(a => a.filter(e => e.id !== id))
    } catch (e: any) {
      alert(e?.message || 'Só a coordenação pode alterar a escala.')
    }
  }

  /* ---------------------------------------------------------
     Equipe — o cadastro de acesso é feito no sistema do hospital
     --------------------------------------------------------- */

  const aviso = () => alert(
    'O cadastro de pessoas é feito no sistema do hospital, em Pessoas. ' +
    'Ali é criado o acesso com e-mail e senha; aqui só se ajusta o cargo de enfermagem.'
  )

  const pendingSignaturesCount = useMemo(
    () => reports.filter(r =>
      (r.coAuthors || []).some(c => c.userId === currentUser?.id && !c.validated)
    ).length,
    [reports, currentUser]
  )

  /* ---------------------------------------------------------
     Telas
     --------------------------------------------------------- */

  if (sessao.carregando) {
    return (
      <div className="grid min-h-dvh place-items-center bg-azul-100 text-tinta-fraca">
        Entrando…
      </div>
    )
  }

  if (!sessao.conta) return <AuthScreen />

  if (sessao.precisaTrocarSenha) return <TrocaObrigatoria />

  if (!currentUser) {
    const mensagens: Record<string, string> = {
      'sem-cadastro': 'Sua conta de acesso existe, mas não foi encontrado um cadastro de funcionário vinculado a ela. Procure a coordenação.',
      'inativo': 'Sua conta foi desativada. Entre em contato com a coordenação para reativá-la.',
      'enfermagem-inativa': 'Seu acesso à enfermagem foi desativado. Procure a coordenação para reativação.',
      'sem-enfermagem': 'Sua conta existe, mas o cargo de enfermagem não foi definido. Procure a coordenação para liberar o acesso ao relatório de plantão.'
    }
    const msg = sessao.motivoBloqueio
      ? mensagens[sessao.motivoBloqueio]
      : 'Procure a coordenação para liberar o acesso ao relatório de plantão.'
    return (
      <div className="grid min-h-dvh place-items-center bg-azul-100 p-8 text-center">
        <div>
          <h1 className="text-lg font-bold text-tinta">Acesso ainda não liberado</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-fraca">{msg}</p>
          <button
            onClick={sessao.sair}
            className="mt-5 rounded-lg border-2 border-borda-forte px-5 py-3 font-semibold"
          >Sair</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-azul-050 font-sans text-tinta print:min-h-0 print:h-auto print:bg-white">
      <div className="flex flex-1 flex-col print:hidden">
        <Header
          currentUser={currentUser}
          pendingSignaturesCount={pendingSignaturesCount}
          onOpenPendingModal={() => setShowPendingModal(true)}
          onOpenUserManagement={() => setShowUserManagement(true)}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
          onNewReport={() => { setEditingReport(null); setCurrentView('form') }}
          onLogout={sessao.sair}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {erro && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </p>
          )}
          {carregandoDados && (
            <p className="mb-4 text-sm text-tinta-fraca">Carregando plantões…</p>
          )}

          {currentView === 'dashboard' ? (
            <Dashboard
              reports={reports}
              currentUser={currentUser}
              allUsers={users}
              schedule={schedule}
              onNewReport={() => { setEditingReport(null); setCurrentView('form') }}
              onOpenReportDetail={report => setViewingReport(report)}
              onEditReport={report => { setEditingReport(report); setCurrentView('form') }}
              onDeleteReport={handleDeleteReport}
              onValidateReport={handleValidateReport}
              onAddScheduleEntry={handleAddScheduleEntry}
              onRemoveScheduleEntry={handleRemoveScheduleEntry}
              onAtualizarEquipe={recarregarEquipe}
            />
          ) : (
            <ShiftReportForm
              initialReport={editingReport}
              currentUser={currentUser}
              allUsers={users}
              defaultChecklist={DEFAULT_CHECKLIST}
              onSaveReport={handleSaveReport}
              onCancel={() => { setEditingReport(null); setCurrentView('dashboard') }}
            />
          )}
        </main>

        <footer className="mt-auto border-t border-azul-800 bg-azul-900 px-4 py-4 text-center text-xs text-azul-200 print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
            <span>Hospital Municipal Maria Veneri • Relatório da Equipe de Enfermagem</span>
            <span>versão {VERSAO} · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>

      {viewingReport && (
        <ReportDetailModal
          report={viewingReport}
          currentUser={currentUser}
          onRegisterView={handleRegisterView}
          onCoordinatorConference={handleCoordinatorConference}
          onAddComplement={handleAddComplement}
          onEditReport={rep => { setEditingReport(rep); setCurrentView('form') }}
          onDeleteReport={handleDeleteReport}
          onClose={() => setViewingReport(null)}
        />
      )}

      {showPendingModal && (
        <PendingSignaturesModal
          currentUser={currentUser}
          reports={reports}
          onValidateReport={handleValidateReport}
          onOpenReportDetail={report => setViewingReport(report)}
          onClose={() => setShowPendingModal(false)}
        />
      )}

      {showUserManagement && (
        <UserManagementModal
          users={users}
          currentUser={currentUser}
          onAddUser={aviso}
          onEditUser={aviso}
          onDeleteUser={aviso}
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          currentUser={currentUser}
          onUpdatePassword={async (_id: string, novaSenha: string) => {
            const atual = window.prompt('Para trocar a senha, digite a senha atual:')
            if (!atual) return
            try {
              await sessao.trocarSenha(atual, novaSenha)
              alert('Senha trocada.')
              setShowChangePasswordModal(false)
            } catch (e: any) {
              alert(e?.message || 'Não foi possível trocar a senha.')
            }
          }}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  )
}
