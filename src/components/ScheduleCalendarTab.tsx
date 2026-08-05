import React, { useState } from 'react';
import { User, ScheduleEntry, ShiftType } from '../types/nursing';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  Printer,
  Shield,
  Hospital,
  X
} from 'lucide-react';

interface ScheduleCalendarTabProps {
  currentUser: User;
  users: User[];
  schedule: ScheduleEntry[];
  onAddScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onRemoveScheduleEntry: (id: string) => void;
}

// Preset vibrant colors for professional stamps
const STAMP_COLORS = [
  '#059669', // Emerald
  '#d97706', // Amber
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#ec4899', // Pink
  '#0891b2', // Cyan
  '#dc2626', // Red
  '#4f46e5'  // Indigo
];

export const ScheduleCalendarTab: React.FC<ScheduleCalendarTabProps> = ({
  currentUser,
  users,
  schedule,
  onAddScheduleEntry,
  onRemoveScheduleEntry
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for adding entry to schedule
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('diurno');
  const [selectedColor, setSelectedColor] = useState<string>(STAMP_COLORS[0]);

  // Check if current user is Coordinator or Admin
  const isCoordinatorOrAdmin =
    currentUser.role === 'Coordenador(a) de Enfermagem' || currentUser.role === 'Admin';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day of week offset (0 = Sunday, 1 = Monday, etc.)
  let startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun

  // Days array
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Handle open add modal for a specific day string (YYYY-MM-DD)
  const handleDayClick = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(dateStr);
    setIsAddModalOpen(true);
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr || !selectedUserId) return;

    const targetUser = users.find((u) => u.id === selectedUserId);
    if (!targetUser) return;

    onAddScheduleEntry({
      date: selectedDateStr,
      userId: targetUser.id,
      userName: targetUser.name,
      shift: selectedShift,
      color: selectedColor
    });

    setIsAddModalOpen(false);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  // Helper to get initial letter
  const getInitial = (name: string) => {
    if (!name) return 'P';
    const cleaned = name.replace(/^(Enfª|Enfº|Téc\.|Dr\.|Dra\.)\s+/i, '').trim();
    return cleaned.charAt(0).toUpperCase();
  };

  // Filter entries for current selected month
  const currentMonthEntries = schedule.filter((s) => {
    if (!s.date) return false;
    const parts = s.date.split('-');
    if (parts.length === 3) {
      return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month + 1;
    }
    return false;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Escala de Plantão Unificada
            </span>
            {isCoordinatorOrAdmin ? (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-700" />
                Acesso de Gestão da Coordenação
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Modo de Visualização
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-700" />
            Calendário de Escala de Serviço
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCoordinatorOrAdmin
              ? 'Clique em qualquer dia do calendário para adicionar ou remover colaboradores do plantão.'
              : 'Escala oficial compartilhada com toda a equipe. Turnos fixos de 12h (07:00-19:00 / 19:00-07:00).'}
          </p>
        </div>

        {/* Action Button: Print Schedule */}
        <button
          onClick={handlePrintSchedule}
          className="w-full sm:w-auto bg-[#003865] hover:bg-[#00284d] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 text-sky-200" />
          <span>Imprimir escala de {monthNames[month].toLowerCase()} de {year}</span>
        </button>
      </div>

      {/* Month Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between print:hidden">
        <button
          onClick={prevMonth}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Mês Anterior</span>
        </button>

        <h3 className="text-lg font-black text-slate-800">
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <span>Próximo Mês</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Screen Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs print:hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Days matrix */}
        <div className="grid grid-cols-7 gap-1.5 mt-2">
          {daysArray.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 rounded-xl border border-transparent"></div>;
            }

            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(dayNum).padStart(2, '0');
            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

            // Get entries for this date
            const dateEntries = schedule.filter((s) => s.date === dateStr);
            const isToday =
              new Date().toISOString().slice(0, 10) === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => isCoordinatorOrAdmin && handleDayClick(dayNum)}
                className={`min-h-[100px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                  isCoordinatorOrAdmin ? 'cursor-pointer hover:border-emerald-400 hover:shadow-xs' : ''
                } ${
                  isToday
                    ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-400/40'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Top Day Bar */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold rounded-md px-1.5 py-0.2 ${
                      isToday ? 'bg-emerald-700 text-white' : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isCoordinatorOrAdmin && (
                    <span className="text-[10px] text-slate-400 opacity-0 hover:opacity-100 font-bold">
                      +
                    </span>
                  )}
                </div>

                {/* Stamp Badges (Initial of Colaborador) */}
                <div className="my-1.5 flex flex-wrap gap-1 items-center justify-start max-h-[64px] overflow-y-auto scrollbar-none">
                  {dateEntries.map((entry) => {
                    const initial = getInitial(entry.userName);
                    return (
                      <div
                        key={entry.id}
                        title={`${entry.userName} (${entry.shift === 'diurno' ? 'Diurno' : 'Noturno'})`}
                        style={{ backgroundColor: entry.color || '#059669' }}
                        className="w-6 h-6 rounded-full text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs border border-white/40 transform hover:scale-110 transition-transform"
                      >
                        {initial}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom count badge */}
                <div className="text-[9px] font-semibold text-slate-400 text-right">
                  {dateEntries.length > 0 ? `${dateEntries.length} em plantão` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen List of Current Month Entries */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print:hidden">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Escala Atual da Equipe ({monthNames[month]} {year})</span>
          <span className="text-xs text-slate-500 font-normal">Total: {currentMonthEntries.length} plantões</span>
        </h3>

        {currentMonthEntries.length === 0 ? (
          <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
            Nenhuma escala cadastrada para o mês de {monthNames[month]} de {year}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentMonthEntries.map((entry) => {
              const [y, m, d] = entry.date.split('-');
              const dateFormatted = `${d}/${m}/${y}`;
              return (
                <div
                  key={entry.id}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: entry.color || '#059669' }}
                      className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                    >
                      {getInitial(entry.userName)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {dateFormatted} • <span className="capitalize text-emerald-800">{entry.shift}</span>
                      </div>
                      <div className="text-slate-600 font-medium">{entry.userName}</div>
                    </div>
                  </div>

                  {isCoordinatorOrAdmin && (
                    <button
                      onClick={() => onRemoveScheduleEntry(entry.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir da escala"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coordinator Add/Manage Schedule Modal */}
      {isAddModalOpen && selectedDateStr && isCoordinatorOrAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Gerenciar Plantão da Data
                </h3>
                <p className="text-xs text-emerald-800 font-semibold font-mono mt-0.5">
                  Data: {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing entries on this day */}
            <div className="my-4 space-y-2">
              <div className="text-xs font-bold text-slate-700">Profissionais Escalados nesta data:</div>
              {schedule.filter((s) => s.date === selectedDateStr).length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 text-center">
                  Nenhum profissional agendado para este dia.
                </div>
              ) : (
                schedule
                  .filter((s) => s.date === selectedDateStr)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: entry.color }}
                          className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center"
                        >
                          {getInitial(entry.userName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{entry.userName}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            Turno: {entry.shift}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveScheduleEntry(entry.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remover da escala"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* Add new entry form */}
            <form onSubmit={handleCreateEntry} className="space-y-3 pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 uppercase">Adicionar Novo Colaborador</div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Selecionar Colaborador</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Turno</label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="diurno">Diurno (07-19h)</option>
                    <option value="noturno">Noturno (19-07h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cor do Carimbo</label>
                  <div className="flex items-center gap-1 pt-1">
                    {STAMP_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          selectedColor === c ? 'ring-2 ring-slate-900 scale-110' : 'opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Concluir
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Carimbar na Escala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL SCHEDULE DOCUMENT (Visible ONLY when printing) */}
      <div className="hidden print:block printable-schedule-area font-sans text-slate-900 p-2">
        <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hospital className="w-6 h-6 text-slate-900" />
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight">
                Hospital Municipal Maria Veneri
              </h1>
              <h2 className="text-xs font-bold text-emerald-900 uppercase">
                Escala de Serviço da Equipe de Enfermagem
              </h2>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="font-extrabold uppercase bg-slate-100 px-2 py-1 rounded border border-slate-300">
              Mês: {monthNames[month]} / {year}
            </span>
            <div className="text-[9px] text-slate-500 mt-1">Turnos 12h: Diurno (07:00-19:00) / Noturno (19:00-07:00)</div>
          </div>
        </div>

        {/* Printable Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-7 border border-slate-400 text-center font-bold text-[10px] uppercase bg-slate-100 divide-x divide-slate-400">
            <div className="py-1">Dom</div>
            <div className="py-1">Seg</div>
            <div className="py-1">Ter</div>
            <div className="py-1">Qua</div>
            <div className="py-1">Qui</div>
            <div className="py-1">Sex</div>
            <div className="py-1">Sáb</div>
          </div>

          <div className="grid grid-cols-7 border-x border-b border-slate-400 divide-x divide-y divide-slate-300">
            {daysArray.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`p-empty-${idx}`} className="h-16 bg-slate-50"></div>;
              }

              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
              const dateEntries = schedule.filter((s) => s.date === dateStr);

              return (
                <div key={`p-${dateStr}`} className="h-16 p-1 flex flex-col justify-between text-[9px]">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">{dayNum}</div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dateEntries.map((e) => (
                      <div key={e.id} className="truncate font-semibold text-slate-800 leading-none">
                        <span className="font-bold text-slate-900">{e.shift === 'diurno' ? 'D:' : 'N:'}</span> {e.userName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* List of Escalated Professionals */}
        <div className="space-y-1 mt-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Relação Detalhada da Escala Mensal ({monthNames[month]}/{year})
          </h3>
          <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase">
                <th className="p-1 border-r border-slate-300">Data</th>
                <th className="p-1 border-r border-slate-300">Turno</th>
                <th className="p-1 border-r border-slate-300">Profissional Escalado</th>
              </tr>
            </thead>
            <tbody>
              {currentMonthEntries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-2 text-center text-slate-500 italic">
                    Sem registros para este mês.
                  </td>
                </tr>
              ) : (
                currentMonthEntries.map((e) => {
                  const [y, m, d] = e.date.split('-');
                  return (
                    <tr key={e.id} className="border-b border-slate-200">
                      <td className="p-1 border-r border-slate-300 font-bold">{d}/{m}/{y}</td>
                      <td className="p-1 border-r border-slate-300 uppercase font-semibold">{e.shift}</td>
                      <td className="p-1 border-r border-slate-300 font-medium">{e.userName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Signature */}
        <div className="pt-8 mt-6 border-t border-slate-400 text-center text-[10px] break-inside-avoid">
          <div className="w-64 mx-auto border-b border-slate-800 pb-0.5 font-bold">
            Coordenação de Enfermagem
          </div>
          <div className="text-[9px] text-slate-600 mt-0.5">
            Hospital Municipal Maria Veneri
          </div>
        </div>
      </div>
    </div>
  );
};

