import React, { useState } from 'react';
import { ShiftReport, User, ScheduleEntry } from '../types/nursing';
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  Calendar,
  Cake,
  Lock,
  Share2,
  ShieldCheck,
  Check,
  Trash2,
  Filter,
  X
} from 'lucide-react';
import { BirthdaysTab } from './BirthdaysTab';
import { SolicitarFarmacia } from './SolicitarFarmacia';
import { ScheduleCalendarTab } from './ScheduleCalendarTab';
import { PackageCheck } from 'lucide-react';
import { getDayOfWeekName } from './ShiftReportForm';

interface DashboardProps {
  reports: ShiftReport[];
  currentUser: User;
  allUsers: User[];
  schedule: ScheduleEntry[];
  onNewReport: () => void;
  onOpenReportDetail: (report: ShiftReport) => void;
  onEditReport: (report: ShiftReport) => void;
  onDeleteReport?: (reportId: string) => void;
  onValidateReport: (reportId: string, userId: string) => void;
  onAddScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onRemoveScheduleEntry: (id: string) => void;
  onAtualizarEquipe?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  reports,
  currentUser,
  allUsers,
  schedule,
  onNewReport,
  onOpenReportDetail,
  onEditReport,
  onDeleteReport,
  onValidateReport,
  onAddScheduleEntry,
  onRemoveScheduleEntry,
  onAtualizarEquipe
}) => {
  /* O técnico usa o app para pedir à farmácia e ver aniversários; o registro
     do plantão é responsabilidade do enfermeiro que assina. */
  const soFarmacia = currentUser.role === 'Técnico(a) de Enfermagem';

  const [activeTab, setActiveTab] = useState<'relatorios' | 'escala' | 'aniversarios' | 'farmacia'>(
    soFarmacia ? 'farmacia' : 'relatorios'
  );
  
  // Minimalist UX Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'recentes' | 'antigos'>('recentes');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = currentUser.username === 'admin' || currentUser.role === 'Admin';

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedShift !== 'todos' ||
    selectedStatus !== 'todos' ||
    selectedPeriod !== 'todos';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedShift('todos');
    setSelectedStatus('todos');
    setSelectedPeriod('todos');
  };

  // Helper for Period Filter
  const isWithinPeriod = (reportDateStr: string, period: string) => {
    if (period === 'todos') return true;
    const repDate = new Date(reportDateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === 'hoje') {
      return repDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
    }

    if (period === 'semana') {
      const diffDays = (today.getTime() - repDate.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    if (period === 'mes') {
      return (
        repDate.getMonth() === today.getMonth() &&
        repDate.getFullYear() === today.getFullYear()
      );
    }

    return true;
  };

  // Filter & Sort Reports
  const filteredReports = reports
    .filter((rep) => {
      // Shift filter
      if (selectedShift !== 'todos' && rep.shift !== selectedShift) return false;

      // Status filter
      if (selectedStatus === 'concluido' && rep.status !== 'concluido') return false;
      if (selectedStatus === 'rascunho' && rep.status !== 'rascunho') return false;
      if (selectedStatus === 'conferido' && !rep.coordinatorConference) return false;

      // Period filter
      if (!isWithinPeriod(rep.date, selectedPeriod)) return false;

      // Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchAuthor = rep.authorName.toLowerCase().includes(query);
        const matchRecebimento = rep.recebimentoPlantao.toLowerCase().includes(query);
        const matchDate = rep.date.includes(query);
        return matchAuthor || matchRecebimento || matchDate;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recentes') return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });

  const handleQuickWhatsAppShare = (rep: ShiftReport, e: React.MouseEvent) => {
    e.stopPropagation();
    const shiftLabel = rep.shift === 'diurno' ? 'Diurno (07-19h)' : 'Noturno (19-07h)';
    const dateFmt = new Date(rep.date + 'T12:00:00').toLocaleDateString('pt-BR');
    
    let text = `*🏥 RELATÓRIO DE ENFERMAGEM - HMMV*\n`;
    text += `📅 *Data:* ${dateFmt} | *Turno:* ${shiftLabel}\n`;
    text += `👤 *Autor:* ${rep.authorName} (${rep.authorRole})\n`;
    text += `----------------------------------\n`;
    text += `📋 *RECEBIMENTO:* ${rep.recebimentoPlantao || 'Sem observações'}\n`;

    navigator.clipboard.writeText(text);
    setCopiedId(rep.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-borda shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('farmacia')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'farmacia'
                ? 'bg-azul-800 text-white shadow-xs'
                : 'text-tinta-fraca hover:bg-azul-100'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Farmácia</span>
          </button>

          {!soFarmacia && <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'relatorios'
                ? 'bg-azul-800 text-white shadow-xs'
                : 'text-tinta-fraca hover:bg-azul-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Relatórios ({reports.length})</span>
          </button>}

          {!soFarmacia && <button
            onClick={() => setActiveTab('escala')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'escala'
                ? 'bg-azul-800 text-white shadow-xs'
                : 'text-tinta-fraca hover:bg-azul-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Escala de Plantão</span>
          </button>}

          <button
            onClick={() => setActiveTab('aniversarios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'aniversarios'
                ? 'bg-azul-800 text-white shadow-xs'
                : 'text-tinta-fraca hover:bg-azul-100'
            }`}
          >
            <Cake className="w-4 h-4" />
            <span>Aniversários ({allUsers.length})</span>
          </button>
        </div>

        {!soFarmacia && <button
          onClick={onNewReport}
          className="bg-azul-800 hover:bg-azul-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-azul-200" />
          <span>Adicionar novo relatório</span>
        </button>}
      </div>

      {/* Tab Contents */}
      {activeTab === 'farmacia' && (
        <SolicitarFarmacia currentUser={currentUser} />
      )}

      {activeTab === 'escala' && !soFarmacia && (
        <ScheduleCalendarTab
          currentUser={currentUser}
          users={allUsers}
          schedule={schedule}
          onAddScheduleEntry={onAddScheduleEntry}
          onRemoveScheduleEntry={onRemoveScheduleEntry}
        />
      )}

      {activeTab === 'aniversarios' && (
        <BirthdaysTab users={allUsers} onAtualizar={onAtualizarEquipe} />
      )}

      {activeTab === 'relatorios' && !soFarmacia && (
        <div className="space-y-4">
          {/* Minimalist UX Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-borda shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por profissional, texto, data..."
                  className="w-full bg-azul-050 border border-borda-forte rounded-xl pl-9 pr-8 py-2 text-xs text-tinta outline-none focus:bg-white focus:ring-2 focus:ring-azul-500 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-tinta-fraca hover:text-tinta"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Minimalist Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Shift */}
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="bg-azul-050 border border-borda-forte rounded-xl px-3 py-1.5 text-xs text-tinta outline-none font-medium hover:bg-azul-100"
                >
                  <option value="todos">Turno: Todos</option>
                  <option value="diurno">Diurno (07-19h)</option>
                  <option value="noturno">Noturno (19-07h)</option>
                </select>

                {/* Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-azul-050 border border-borda-forte rounded-xl px-3 py-1.5 text-xs text-tinta outline-none font-medium hover:bg-azul-100"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="concluido">Concluído</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="conferido">Conferido Coordenação</option>
                </select>

                {/* Period */}
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-azul-050 border border-borda-forte rounded-xl px-3 py-1.5 text-xs text-tinta outline-none font-medium hover:bg-azul-100"
                >
                  <option value="todos">Período: Todos</option>
                  <option value="hoje">Hoje</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mês</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recentes' | 'antigos')}
                  className="bg-azul-050 border border-borda-forte rounded-xl px-3 py-1.5 text-xs text-tinta outline-none font-medium hover:bg-azul-100"
                >
                  <option value="recentes">Mais Recentes</option>
                  <option value="antigos">Mais Antigos</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 bg-saida-bg hover:bg-saida-bg text-saida border border-saida rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results counter indicator */}
            <div className="flex items-center justify-between text-[11px] text-tinta-fraca pt-1 border-t border-borda">
              <span>
                Exibindo <strong className="text-tinta">{filteredReports.length}</strong> de {reports.length} relatório(s) registrados
              </span>
              {hasActiveFilters && (
                <span className="text-azul-800 font-semibold bg-azul-050 px-2 py-0.5 rounded-md border border-azul-200">
                  Filtros Ativos
                </span>
              )}
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-borda shadow-xs space-y-2">
              <FileText className="w-10 h-10 text-tinta-fraca mx-auto" />
              <p className="text-sm font-bold text-tinta">
                {hasActiveFilters ? 'Nenhum relatório encontrado para esses filtros' : 'Nenhum relatório registrado ainda'}
              </p>
              <p className="text-xs text-tinta-fraca max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Tente alterar os termos de busca ou remover os filtros aplicados.'
                  : 'Clique no botão "Adicionar novo relatório" para registrar o primeiro plantão.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-bold text-azul-800 hover:underline inline-block"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            filteredReports.map((rep) => {
              const shiftLabel = rep.shift === 'diurno' ? 'Diurno (07-19h)' : 'Noturno (19-07h)';
              const dateFmt = new Date(rep.date + 'T12:00:00').toLocaleDateString('pt-BR');
              const dayName = getDayOfWeekName(rep.date);

              const alertsCount = rep.checklist.filter(
                (c) => c.status === 'nao_conforme' || c.status === 'alerta'
              ).length;

              const isAuthor = rep.authorId === currentUser.id;
              const hasViews = rep.viewReceipts && rep.viewReceipts.length > 0;

              return (
                <div
                  key={rep.id}
                  onClick={() => onOpenReportDetail(rep)}
                  className="bg-white rounded-2xl border border-borda hover:border-azul-500 hover:shadow-md p-4 transition-all space-y-3 cursor-pointer group"
                >
                  {/* Top Status Badges Row - Matches user sketch layout */}
                  <div className="flex flex-col gap-2.5 pb-2.5 border-b border-borda">
                    <div className="flex flex-wrap items-stretch gap-2">
                      {/* Box 1: Visualizações ✓✓ / Count */}
                      <div
                        className="bg-azul-050 border border-azul-200 rounded-xl px-2.5 py-1 flex flex-col items-center justify-center min-w-[42px] shrink-0"
                        title={hasViews ? `Visualizado por ${rep.viewReceipts?.length} pessoa(s)` : 'Ainda não registrado'}
                      >
                        <span className="text-azul-600 font-mono font-black text-xs leading-none">✓✓</span>
                        <span className="text-azul-800 font-mono font-extrabold text-[11px] leading-tight mt-0.5">
                          {rep.viewReceipts?.length || 1}
                        </span>
                      </div>

                      {/* Box 2: Data (ex: 23/07/2026) */}
                      <div className="bg-white border border-borda-forte rounded-xl px-3 py-1.5 flex items-center justify-center font-extrabold text-tinta text-xs sm:text-sm shrink-0 shadow-2xs">
                        {dateFmt}
                      </div>

                      {/* Box 3: Dia da Semana (ex: QUINTA-FEIRA) */}
                      {dayName && (
                        <div className="bg-entrada-bg border border-entrada text-entrada rounded-xl px-3 py-1.5 flex items-center justify-center font-extrabold text-xs uppercase tracking-wide shrink-0">
                          {dayName}
                        </div>
                      )}

                      {/* Box 4: Turno (ex: DIURNO) */}
                      <div
                        className={`border rounded-xl px-3 py-1.5 flex items-center justify-center font-extrabold text-xs uppercase tracking-wide shrink-0 ${
                          rep.shift === 'diurno'
                            ? 'bg-entrada-bg/90 border-entrada text-entrada'
                            : 'bg-indigo-100/90 border-indigo-300 text-indigo-950'
                        }`}
                      >
                        {rep.shift.toUpperCase()}
                      </div>

                      {/* Box 5: Visto da Coordenadora */}
                      {rep.coordinatorConference ? (
                        <div className="bg-entrada-bg border-2 border-entrada text-entrada rounded-xl px-3 py-1.5 flex items-center gap-1.5 font-black text-xs uppercase tracking-wide shrink-0 shadow-2xs">
                          <span>VISTO DA COORDENADORA</span>
                          <span className="text-entrada text-sm font-black">✓</span>
                        </div>
                      ) : (
                        <div className="bg-azul-050 border border-dashed border-borda-forte text-tinta-fraca rounded-xl px-2.5 py-1.5 flex items-center gap-1 font-semibold text-[11px] shrink-0">
                          <Clock className="w-3.5 h-3.5 text-tinta-fraca" />
                          <span>Pendente Visto Coordenação</span>
                        </div>
                      )}

                      {/* Optional Status Alert Badges */}
                      {alertsCount > 0 && (
                        <div className="bg-saida-bg border border-saida text-saida rounded-xl px-2.5 py-1.5 flex items-center gap-1 font-bold text-[11px] shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-saida" />
                          <span>{alertsCount} Alerta(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-tinta-fraca font-medium px-0.5">
                      <div>
                        Autor: <span className="font-bold text-tinta">{rep.authorName}</span> ({rep.authorRole})
                      </div>
                      {rep.status === 'rascunho' ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          📝 Rascunho
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-entrada bg-entrada-bg px-2 py-0.5 rounded border border-entrada">
                          ✓ Concluído
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recebimento Excerpt */}
                  <div className="bg-azul-050 p-3 rounded-xl border border-borda text-xs">
                    <div className="font-bold text-tinta mb-0.5">Recebimento do Plantão:</div>
                    <p className="text-tinta line-clamp-2 italic">
                      "{rep.recebimentoPlantao || 'Sem observações escritas.'}"
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end pt-1">
                    <div className="flex items-center gap-2">
                      {/* Quick WhatsApp Share */}
                      <button
                        onClick={(e) => handleQuickWhatsAppShare(rep, e)}
                        className="p-1.5 text-tinta-fraca hover:text-entrada hover:bg-entrada-bg rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Copiar texto simples para WhatsApp"
                      >
                        {copiedId === rep.id ? (
                          <span className="text-entrada font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Copiado!
                          </span>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 text-entrada" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button - Author Only */}
                      {isAuthor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditReport(rep);
                          }}
                          className="p-1.5 text-tinta-fraca hover:text-azul-800 hover:bg-azul-050 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Editar Relatório"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                      )}

                      {/* Delete Button - Admin Only */}
                      {isAdmin && onDeleteReport && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Deseja apagar este relatório permanentemente?')) {
                              onDeleteReport(rep.id);
                            }
                          }}
                          className="p-1.5 text-saida hover:text-saida hover:bg-saida-bg rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Apagar Relatório (Apenas Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Apagar</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReportDetail(rep);
                        }}
                        className="bg-azul-800 hover:bg-azul-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
