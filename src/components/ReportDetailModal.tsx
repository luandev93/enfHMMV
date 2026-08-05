import React, { useEffect, useState } from 'react';
import { ShiftReport, User, ReportAddendum } from '../types/nursing';
import {
  X,
  Printer,
  FileCheck,
  CheckCircle2,
  Clock,
  Paperclip,
  Hospital,
  AlertTriangle,
  Lock,
  Share2,
  Check,
  ShieldCheck,
  Edit,
  Trash2,
  Eye,
  History,
  Send,
  MessageSquare,
  Plus,
  ArrowRightLeft,
  Skull,
  Baby,
  HeartPulse,
  BedDouble
} from 'lucide-react';
import { getDayOfWeekName } from './ShiftReportForm';

interface ReportDetailModalProps {
  report: ShiftReport;
  currentUser: User;
  onRegisterView?: (reportId: string, user: User) => void;
  onCoordinatorConference?: (reportId: string, notes?: string) => void;
  onAddComplement?: (reportId: string, text: string) => void;
  onEditReport?: (report: ShiftReport) => void;
  onDeleteReport?: (reportId: string) => void;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  currentUser,
  onRegisterView,
  onCoordinatorConference,
  onAddComplement,
  onEditReport,
  onDeleteReport,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'relatorio' | 'logs'>('relatorio');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [conferenceNotes, setConferenceNotes] = useState<string>('');
  const [showConferencePrompt, setShowConferencePrompt] = useState<boolean>(false);

  // State for Complement dialogue
  const [showAddComplementModal, setShowAddComplementModal] = useState<boolean>(false);
  const [newComplementText, setNewComplementText] = useState<string>('');

  // Auto register view receipt when user opens report
  useEffect(() => {
    if (onRegisterView) {
      onRegisterView(report.id, currentUser);
    }
  }, [report.id, currentUser]);

  const isCoAuthor = report.coAuthors.some((ca) => ca.userId === currentUser.id);
  const isAuthor = currentUser.id === report.authorId;
  const isAdmin = currentUser.username === 'admin' || currentUser.role === 'Admin';
  const isCoordinator = currentUser.role === 'Coordenador(a) de Enfermagem' || isAdmin;
  const isShiftMember = isAuthor || isCoAuthor || isAdmin;

  const handlePrint = () => {
    window.print();
  };

  const shiftLabel = report.shift === 'diurno' ? 'Diurno (07:00h às 19:00h)' : 'Noturno (19:00h às 07:00h)';
  const dateFmt = new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR');
  const dayName = getDayOfWeekName(report.date);

  const sectors = ['Pronto-Socorro', 'Clínica Médica', 'Sala de Parto', 'UTI'] as const;

  // WhatsApp Formatter Function
  const generateWhatsAppText = (): string => {
    let text = `*🏥 RELATÓRIO DE ENFERMAGEM - HMMV*\n`;
    text += `📅 *Data:* ${dateFmt} (${dayName})\n`;
    text += `⏰ *Turno:* ${shiftLabel}\n`;
    text += `👤 *Autor:* ${report.authorName} (${report.authorRole})\n`;

    if (report.coAuthors.length > 0) {
      text += `👥 *Equipe de Plantão:* ${report.coAuthors.map((ca) => ca.userName).join(', ')}\n`;
    }

    text += `----------------------------------\n`;
    text += `📋 *RECEBIMENTO DE PLANTÃO:*\n`;
    text += `${report.recebimentoPlantao || 'Sem registros'}\n\n`;

    text += `🛌 *MOVIMENTAÇÃO DE LEITOS:*\n`;
    text += `• Altas: ${report.movement.altas} (${report.movement.altasObs || 'N/A'})\n`;
    text += `• Admissões: ${report.movement.admissoes} (${report.movement.admissoesObs || 'N/A'})\n`;
    text += `• Transferências: ${report.movement.transferenciasEnviadas} (${report.movement.transferenciasObs || 'N/A'})\n`;
    text += `• Óbitos: ${report.movement.obitos} (${report.movement.obitosObs || 'N/A'})\n`;
    text += `• Nascimentos: ${report.movement.nascimentos} (${report.movement.nascimentosObs || 'N/A'})\n`;
    text += `• Gestantes Acompanhadas: ${report.movement.gestantesAcompanhamento}\n\n`;

    if (report.passagemPlantaoSintese) {
      text += `🔄 *PASSAGEM DE PLANTÃO:*\n`;
      text += `${report.passagemPlantaoSintese}\n\n`;
    }

    if (report.complements && report.complements.length > 0) {
      text += `💬 *COMPLEMENTOS DE INFORMAÇÃO:*\n`;
      report.complements.forEach((c) => {
        text += `• ${c.authorName}: ${c.text}\n`;
      });
      text += `\n`;
    }

    if (report.coordinatorConference) {
      text += `✅ *CONFERIDO PELA COORDENAÇÃO:* ${report.coordinatorConference.userName} em ${new Date(report.coordinatorConference.timestamp).toLocaleDateString('pt-BR')}\n`;
    }

    return text;
  };

  const handleCopyWhatsApp = () => {
    const waText = generateWhatsAppText();
    navigator.clipboard.writeText(waText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handleOpenWhatsAppDeepLink = () => {
    const waText = generateWhatsAppText();
    const encoded = encodeURIComponent(waText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleConfirmConference = () => {
    if (onCoordinatorConference) {
      onCoordinatorConference(report.id, conferenceNotes.trim());
      setShowConferencePrompt(false);
    }
  };

  const handleSubmitComplement = () => {
    if (!isShiftMember) {
      alert('Apenas profissionais vinculados a este plantão possuem permissão para adicionar complementos.');
      return;
    }
    if (!newComplementText.trim()) return;

    if (onAddComplement) {
      onAddComplement(report.id, newComplementText.trim());
    }
    setNewComplementText('');
    setShowAddComplementModal(false);
  };

  const handleDeleteWithConfirm = () => {
    if (confirm('Tem certeza de que deseja apagar este relatório permanentemente? Apenas o administrador possui essa permissão.')) {
      if (onDeleteReport) {
        onDeleteReport(report.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:block print:overflow-visible print:inset-auto print:z-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none printable-area print:rounded-none print:block">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-300" />
              <h2 className="font-bold text-sm">Relatório de Enfermagem</h2>
            </div>

            {/* Admin Tabs */}
            {isAdmin && (
              <div className="flex items-center bg-emerald-900/80 p-0.5 rounded-lg border border-emerald-700/60 ml-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('relatorio')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'relatorio'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  📄 Relatório
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'logs'
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Logs (Admin)
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleCopyWhatsApp}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Copiar texto formatado para o WhatsApp"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  Copiado!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Copiar WhatsApp
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-xl hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 print:overflow-visible print:p-1">
          {activeTab === 'logs' && isAdmin ? (
            /* ABA EXCLUSIVA DE LOGS E AUDITORIA (ADMIN) */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center justify-between text-amber-900">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <History className="w-4 h-4 text-amber-700" />
                  <span>Aba de Controle e Logs de Auditoria do Administrador</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-mono font-bold px-2 py-0.5 rounded">
                  Restrito a Administradores
                </span>
              </div>

              {/* Seção Estilo WhatsApp: Visualizações / Confirmação de Leitura (✓✓) */}
              <div className="bg-sky-50/70 border border-sky-200 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#003865]">
                    <span className="text-sky-500 font-mono font-bold text-sm">✓✓</span>
                    <span>Visualizações no Sistema (Confirmação de Leitura)</span>
                  </div>
                  <span className="text-[11px] font-bold bg-sky-200 text-sky-900 px-2 py-0.5 rounded-md">
                    {report.viewReceipts?.length || 1} visualização(ões)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {report.viewReceipts && report.viewReceipts.length > 0 ? (
                    report.viewReceipts.map((vr) => (
                      <div
                        key={`${vr.userId}-${vr.timestamp}`}
                        className="bg-white border border-sky-200 text-slate-800 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="text-sky-500 font-bold">✓✓</span>
                        <span className="font-semibold">{vr.userName}</span>
                        <span className="text-[10px] text-slate-500">
                          ({new Date(vr.timestamp).toLocaleDateString('pt-BR')} {new Date(vr.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      Visualizado por {currentUser.name} agora.
                    </div>
                  )}
                </div>
              </div>

              {/* Log de Auditoria (Histórico de Edições) */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <History className="w-4 h-4 text-slate-600" />
                  <span>Histórico Geral de Ações e Alterações</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {report.auditLogs && report.auditLogs.length > 0 ? (
                    report.auditLogs.map((log) => (
                      <div key={log.id} className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-medium">{log.summary}</span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">Nenhuma alteração de auditoria registrada.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ABA RELATÓRIO OFICIAL (MINIMALISTA E COMPACTO PARA CABER EM 1 PÁGINA) */
            <div className="space-y-2.5 print:space-y-1.5 text-[11px] print:text-[10px] leading-tight text-slate-800">
              {/* Printable Hospital Header Compacto */}
              <div className="border-b-2 border-slate-800 pb-2 print:pb-1 space-y-1.5 print:space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 print:w-6 print:h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold print:border print:border-slate-800 shrink-0">
                      <Hospital className="w-4 h-4 print:w-3.5 print:h-3.5 text-emerald-300 print:text-slate-900" />
                    </div>
                    <div>
                      <h1 className="text-xs sm:text-sm print:text-xs font-black text-slate-900 tracking-tight uppercase leading-none">
                        Hospital Municipal Maria Veneri
                      </h1>
                      <p className="text-[10px] print:text-[9px] text-slate-600 font-bold uppercase mt-0.5">
                        Relatório Oficial de Enfermagem
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] print:text-[10px] text-slate-800">
                    <div className="font-bold text-slate-900">{dateFmt} {dayName && `• ${dayName}`}</div>
                    <div className="font-extrabold text-emerald-800 uppercase text-[10px] print:text-[9px]">{shiftLabel}</div>
                  </div>
                </div>

                {/* Grid Compacto de Autor e Equipe */}
                <div className="bg-slate-100 p-2 print:p-1 rounded-lg border border-slate-300 text-[11px] print:text-[9.5px] grid grid-cols-1 sm:grid-cols-2 gap-1.5 print:gap-1">
                  <div>
                    <span className="text-[9px] print:text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Autor do Relatório
                    </span>
                    <span className="font-bold text-slate-900">{report.authorName}</span>
                    <span className="text-[10px] print:text-[9px] text-slate-600 block">
                      {report.authorRole} {report.authorCoren && `• ${report.authorCoren}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] print:text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Equipe Presente
                    </span>
                    <span className="text-slate-800 font-medium">
                      {report.coAuthors.length > 0
                        ? report.coAuthors.map((ca) => `${ca.userName} (${ca.role})`).join(', ')
                        : 'Apenas o autor registrado.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner de Conferência da Coordenação */}
              {report.coordinatorConference ? (
                <div className="bg-emerald-50 border border-emerald-500 p-1.5 print:p-1 rounded-lg flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-emerald-950">
                      Conferido pela Coordenação: {report.coordinatorConference.userName} em {new Date(report.coordinatorConference.timestamp).toLocaleDateString('pt-BR')}
                      {report.coordinatorConference.notes && ` • "${report.coordinatorConference.notes}"`}
                    </span>
                  </div>
                </div>
              ) : isCoordinator ? (
                <div className="bg-sky-50 border border-sky-300 p-2 rounded-lg flex items-center justify-between gap-2 print:hidden text-xs">
                  <span className="text-sky-950 font-medium">Você pode realizar a conferência deste relatório.</span>
                  <button
                    onClick={() => setShowConferencePrompt(!showConferencePrompt)}
                    className="bg-[#003865] hover:bg-[#00284d] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shrink-0"
                  >
                    Conferir
                  </button>
                </div>
              ) : null}

              {/* Form de Conferência do Coordenador */}
              {showConferencePrompt && (
                <div className="bg-sky-100/80 border border-sky-300 p-3 rounded-xl space-y-2 print:hidden">
                  <div className="text-xs font-bold text-sky-950 uppercase">Observação da Coordenação</div>
                  <textarea
                    rows={2}
                    value={conferenceNotes}
                    onChange={(e) => setConferenceNotes(e.target.value)}
                    placeholder="Observações (opcional)..."
                    className="w-full bg-white border border-sky-300 rounded-lg p-2 text-xs text-slate-800 outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowConferencePrompt(false)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmConference}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* 1. RECEBIMENTO DE PLANTÃO */}
              <div>
                <h3 className="text-[10px] print:text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-0.5">
                  1. Recebimento de Plantão
                </h3>
                <div className="bg-slate-50 p-1.5 print:p-1 rounded-lg border border-slate-200 text-[11px] print:text-[9.5px] text-slate-800 whitespace-pre-wrap leading-tight">
                  {report.recebimentoPlantao || 'Sem registros no recebimento.'}
                </div>

                {report.attachments.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {report.attachments.map((att) => (
                      <span key={att.id} className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                        📎 {att.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. MOVIMENTAÇÃO DE LEITOS E PACIENTES (AGLOMERADO EM GRID COMPACTO) */}
              <div>
                <h3 className="text-[10px] print:text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-0.5">
                  2. Movimentação de Leitos e Pacientes
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 print:gap-0.5 text-[11px] print:text-[9.5px]">
                  <div className="bg-slate-50 p-1 print:p-0.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9px] print:text-[8px] font-bold text-slate-500 uppercase block">Altas</span>
                    <span className="font-extrabold text-emerald-700 text-sm print:text-xs">{report.movement.altas}</span>
                    {report.movement.altasObs && (
                      <span className="text-[9px] print:text-[8px] text-slate-600 block truncate leading-none mt-0.5">{report.movement.altasObs}</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-1 print:p-0.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9px] print:text-[8px] font-bold text-slate-500 uppercase block">Admissões</span>
                    <span className="font-extrabold text-blue-700 text-sm print:text-xs">{report.movement.admissoes}</span>
                    {report.movement.admissoesObs && (
                      <span className="text-[9px] print:text-[8px] text-slate-600 block truncate leading-none mt-0.5">{report.movement.admissoesObs}</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-1 print:p-0.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9px] print:text-[8px] font-bold text-slate-500 uppercase block">Transf.</span>
                    <span className="font-extrabold text-indigo-700 text-sm print:text-xs">{report.movement.transferenciasEnviadas}</span>
                    {report.movement.transferenciasObs && (
                      <span className="text-[9px] print:text-[8px] text-slate-600 block truncate leading-none mt-0.5">{report.movement.transferenciasObs}</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-1 print:p-0.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9px] print:text-[8px] font-bold text-slate-500 uppercase block">Óbitos</span>
                    <span className="font-extrabold text-slate-800 text-sm print:text-xs">{report.movement.obitos}</span>
                    {report.movement.obitosObs && (
                      <span className="text-[9px] print:text-[8px] text-slate-600 block truncate leading-none mt-0.5">{report.movement.obitosObs}</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-1 print:p-0.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9px] print:text-[8px] font-bold text-slate-500 uppercase block">Nascim.</span>
                    <span className="font-extrabold text-pink-700 text-sm print:text-xs">{report.movement.nascimentos}</span>
                    {report.movement.nascimentosObs && (
                      <span className="text-[9px] print:text-[8px] text-slate-600 block truncate leading-none mt-0.5">{report.movement.nascimentosObs}</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-1 print:p-0.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9px] print:text-[8px] font-bold text-slate-500 uppercase block">Gestantes</span>
                    <span className="font-extrabold text-rose-700 text-sm print:text-xs">{report.movement.gestantesAcompanhamento}</span>
                    {report.movement.gestantesObs && (
                      <span className="text-[9px] print:text-[8px] text-slate-600 block truncate leading-none mt-0.5">{report.movement.gestantesObs}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. CHECKLIST POR SETOR (APENAS INCONFORMIDADES E ALERTAS) */}
              <div>
                <h3 className="text-[10px] print:text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-0.5">
                  3. Inconformidades e Alertas de Equipamentos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 print:gap-1">
                  {sectors.map((sec) => {
                    const allItems = report.checklist.filter((i) => i.sector === sec);
                    if (allItems.length === 0) return null;
                    const nonCompliantItems = allItems.filter((i) => i.status !== 'conforme');

                    return (
                      <div key={sec} className="bg-slate-50 rounded-md p-1.5 print:p-1 border border-slate-200 break-inside-avoid">
                        <div className="font-bold text-slate-800 text-[10px] print:text-[9px] flex items-center justify-between border-b border-slate-200 pb-0.5">
                          <span>{sec}</span>
                          {nonCompliantItems.length === 0 && (
                            <span className="text-[9px] print:text-[8px] text-emerald-700 font-bold">✅ Conforme</span>
                          )}
                        </div>

                        {nonCompliantItems.length === 0 ? (
                          <div className="text-[9.5px] print:text-[8.5px] text-slate-500 italic py-0.5">Sem inconformidades.</div>
                        ) : (
                          nonCompliantItems.map((it) => (
                            <div key={it.id} className="flex items-center justify-between text-[10px] print:text-[8.5px] py-0.5 border-b border-slate-100 last:border-0">
                              <span className="text-slate-800 font-medium truncate">{it.name}</span>
                              <span className="font-bold shrink-0 ml-1">
                                {it.status === 'nao_conforme'
                                  ? '❌ Não Conf.'
                                  : it.status === 'alerta'
                                  ? '⚠️ Alerta'
                                  : 'ℹ️ Em uso'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. PASSAGEM DE PLANTÃO E COMPLEMENTOS */}
              <div>
                <div className="flex items-center justify-between border-b border-emerald-200 pb-0.5 mb-0.5">
                  <h3 className="text-[10px] print:text-[9px] font-extrabold uppercase tracking-wider text-emerald-900">
                    4. Passagem de Plantão
                  </h3>

                  <button
                    onClick={() => {
                      if (!isShiftMember) {
                        alert('Restrito aos integrantes deste plantão.');
                        return;
                      }
                      setShowAddComplementModal(true);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 print:hidden"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-700" />
                    + Complemento
                  </button>
                </div>

                <div className="bg-slate-50 p-1.5 print:p-1 rounded-lg border border-slate-200 text-[11px] print:text-[9.5px] text-slate-800 whitespace-pre-wrap leading-tight">
                  {report.passagemPlantaoSintese || 'Sem síntese de passagem de plantão registrada.'}
                </div>

                {report.complements && report.complements.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {report.complements.map((comp) => (
                      <div key={comp.id} className="bg-emerald-50/70 border border-emerald-200 p-1 rounded-lg text-[9.5px] print:text-[8.5px]">
                        <div className="font-bold text-emerald-950 flex items-center justify-between">
                          <span>💬 {comp.authorName} ({comp.authorRole}):</span>
                          <span className="text-[9px] print:text-[8px] text-slate-500 font-mono">
                            {new Date(comp.timestamp).toLocaleDateString('pt-BR')} {new Date(comp.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-tight mt-0.5">{comp.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AVISO LGPD COMPACTO */}
              <div className="text-[9px] print:text-[8px] text-slate-500 font-medium italic border-t border-slate-200 pt-0.5">
                * Conforme a LGPD (Lei 13.709/2018), os dados dos pacientes são representados exclusivamente por iniciais e leito.
              </div>

              {/* 5. ASSINATURA DIGITAL DO AUTOR */}
              <div className="pt-2 mt-1 print:pt-1.5 print:mt-1 border-t border-slate-300 flex flex-col items-center justify-center text-center text-[11px] print:text-[9.5px] break-inside-avoid">
                <div className="w-64 border-b border-slate-800 pb-0.5 font-bold text-slate-900">
                  {report.authorName}
                </div>
                <div className="text-[10px] print:text-[9px] font-semibold text-slate-800 mt-0.5">
                  {report.authorRole} {report.authorCoren ? `• ${report.authorCoren}` : ''}
                </div>
                <div className="text-[9px] print:text-[8px] text-slate-500 uppercase tracking-wider">
                  Assinatura Digital do Responsável Técnico
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            {/* Direct WhatsApp Send Button */}
            <button
              onClick={handleOpenWhatsAppDeepLink}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Enviar para WhatsApp
            </button>

            {/* Edit Button - Author only */}
            {isAuthor && onEditReport && (
              <button
                onClick={() => {
                  onEditReport(report);
                  onClose();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar Relatório
              </button>
            )}

            {/* Delete Button - Admin only */}
            {isAdmin && onDeleteReport && (
              <button
                onClick={handleDeleteWithConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Apagar (Admin)
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Caixa de Diálogo (Modal) para Adicionar Complemento */}
      {showAddComplementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-sm text-slate-900">
                  Complementar Informações do Plantão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddComplementModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950">
              ℹ️ Apenas profissionais vinculados como integrantes deste plantão possuem permissão para registrar complementos.
              <div className="font-bold mt-1">Autor do Complemento: {currentUser.name} ({currentUser.role})</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Novo Complemento de Informação
              </label>
              <textarea
                rows={4}
                value={newComplementText}
                onChange={(e) => setNewComplementText(e.target.value)}
                placeholder="Escreva a informação adicional referente à passagem de plantão..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddComplementModal(false)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitComplement}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                Adicionar Complemento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
