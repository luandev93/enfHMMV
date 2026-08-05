import React, { useState } from 'react';
import { User } from '../types/nursing';
import { Cake, Calendar, Search, UserCheck, Heart } from 'lucide-react';

interface BirthdaysTabProps {
  users: User[];
}

export const BirthdaysTab: React.FC<BirthdaysTabProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const months = [
    { value: 1, name: 'Janeiro' },
    { value: 2, name: 'Fevereiro' },
    { value: 3, name: 'Março' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Maio' },
    { value: 6, name: 'Junho' },
    { value: 7, name: 'Julho' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Setembro' },
    { value: 10, name: 'Outubro' },
    { value: 11, name: 'Novembro' },
    { value: 12, name: 'Dezembro' }
  ];

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;

  // Process users birth dates
  const processedUsers = users.map((u) => {
    let day = 0;
    let month = 0;
    let year = 0;

    if (u.birthDate) {
      const parts = u.birthDate.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
    }

    const isToday = day === todayDay && month === todayMonth;
    return {
      ...u,
      birthDay: day,
      birthMonth: month,
      birthYear: year,
      isToday
    };
  });

  const todayBirthdays = processedUsers.filter((u) => u.isToday);

  const filteredUsers = processedUsers.filter((u) => {
    if (selectedMonth !== 0 && u.birthMonth !== selectedMonth) return false;
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(query);
      const matchRole = u.role.toLowerCase().includes(query);
      return matchName || matchRole;
    }
    return true;
  }).sort((a, b) => a.birthDay - b.birthDay);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Agenda de Aniversários
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Cake className="w-5 h-5 text-emerald-600" />
            Aniversariantes da Equipe
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe e celebre a data de nascimento dos profissionais de enfermagem.
          </p>
        </div>

        {todayBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-3.5 rounded-xl shadow-sm flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Heart className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-pink-100">
                Hoje é Aniversário! 🎉
              </div>
              <div className="text-xs font-bold">
                {todayBirthdays.map((u) => u.name).join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar profissional..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedMonth(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedMonth === 0
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Meses
          </button>
          {months.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelectedMonth(m.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedMonth === m.value
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Birthdays Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <Cake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Nenhum aniversariante encontrado neste mês</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Selecione outro mês no filtro superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredUsers.map((u) => {
            const dayFormatted = String(u.birthDay).padStart(2, '0');
            const monthObj = months.find((m) => m.value === u.birthMonth);
            const monthName = monthObj ? monthObj.name : '';

            return (
              <div
                key={u.id}
                className={`p-4 rounded-2xl border transition-all ${
                  u.isToday
                    ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300 shadow-md ring-2 ring-pink-400'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold text-sm shrink-0">
                    {dayFormatted}
                  </div>
                  {u.isToday && (
                    <span className="bg-pink-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-bounce">
                      Hoje! 🎉
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{u.name}</h4>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{u.role}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dayFormatted} de {monthName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
