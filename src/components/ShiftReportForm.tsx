import React, { useState } from 'react';
import { ShiftReport, User, ChecklistItem, StatusEquipment, Attachment, PatientMovement, AuditLog, ReportAddendum, ReportStatus } from '../types/nursing';
import {
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Save,
  Users,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  X,
  Upload,
  HeartPulse,
  Baby,
  BedDouble,
  UserX,
  Send,
  MessageSquare,
  Lock,
  Plus,
  Trash2,
  FileEdit,
  ArrowRightLeft,
  Skull
} from 'lucide-react';

interface ShiftReportFormProps {
  initialReport?: ShiftReport | null;
  currentUser: User;
  allUsers: User[];
  defaultChecklist: ChecklistItem[];
  onSaveReport: (report: ShiftReport) => void;
  onCancel: () => void;
}

// Function to get Day of Week in Portuguese
export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + 'T12:00:00');
  if (isNaN(dateObj.getTime())) return '';

  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  return days[dateObj.getDay()];
}

export const ShiftReportForm: React.FC<ShiftReportFormProps> = ({
  initialReport,
  currentUser,
  allUsers,
  defaultChecklist,
  onSaveReport,
  onCancel
}) => {
  // Check if editing is allowed (only author or initial creation)
  const isAuthor = !initialReport || initialReport.authorId === currentUser.id;

  // Form State
  const [date, setDate] = useState<string>(
    initialReport?.date || new Date().toISOString().slice(0, 10)
  );
  const [shift, setShift] = useState<'diurno' | 'noturno'>(initialReport?.shift || 'diurno');

  // Responsáveis pelo plantão (Lista suspensa) - inclui por padrão o usuário logado
  const [coAuthorIds, setCoAuthorIds] = useState<string[]>(
    initialReport
      ? initialReport.coAuthors.map((ca) => ca.userId)
      : [currentUser.id]
  );
  const [selectedToAddUserId, setSelectedToAddUserId] = useState<string>('');

  // 3.1 Recebimento
  const [recebimentoPlantao, setRecebimentoPlantao] = useState<string>(
    initialReport?.recebimentoPlantao || ''
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialReport?.attachments || []
  );

  // 3.2 Ocorrências / Leitos (Altas, Admissões, Transferências, Óbitos, Nascimentos, Gestantes)
  const [movement, setMovement] = useState<PatientMovement>(
    initialReport?.movement || {
      altas: 0,
      altasObs: '',
      admissoes: 0,
      admissoesObs: '',
      transferenciasEnviadas: 0,
      transferenciasRecebidas: 0,
      transferenciasObs: '',
      obitos: 0,
      obitosObs: '',
      gestantesAcompanhamento: 0,
      gestantesObs: '',
      nascimentos: 0,
      nascimentosObs: ''
    }
  );

  // 4. Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialReport?.checklist ? [...initialReport.checklist] : [...defaultChecklist]
  );
  const [activeSector, setActiveSector] = useState<string>('Pronto-Socorro');

  // 5. Passagem de Plantão & Complementos
  const [passagemPlantaoSintese, setPassagemPlantaoSintese] = useState<string>(
    initialReport?.passagemPlantaoSintese || ''
  );
  const [complements, setComplements] = useState<ReportAddendum[]>(
    initialReport?.complements || []
  );

  // Modal para Caixa de Diálogo de Complementar Informações
  const [showComplementModal, setShowComplementModal] = useState<boolean>(false);
  const [newComplementText, setNewComplementText] = useState<string>('');

  // Seções Privadas por Perfil
  const [tecnicoPrivateNotes, setTecnicoPrivateNotes] = useState<string>(
    initialReport?.tecnicoPrivateNotes || ''
  );
  const [enfermeiroPrivateNotes, setEnfermeiroPrivateNotes] = useState<string>(
    initialReport?.enfermeiroPrivateNotes || ''
  );

  // Day of week calculated automatically
  const dayOfWeek = getDayOfWeekName(date);

  // Verifica se o usuário atual é integrante adicionado ao plantão (ou admin)
  const isAdmin = currentUser.username === 'admin' || currentUser.role === 'Admin';
  const isShiftMember =
    (initialReport ? initialReport.authorId === currentUser.id : true) ||
    coAuthorIds.includes(currentUser.id) ||
    isAdmin;

  // Handle adding user from dropdown list
  const handleAddResponsible = (uId: string) => {
    if (!uId) return;
    if (!coAuthorIds.includes(uId)) {
      setCoAuthorIds([...coAuthorIds, uId]);
    }
    setSelectedToAddUserId('');
  };

  const handleRemoveResponsible = (uId: string) => {
    setCoAuthorIds(coAuthorIds.filter((id) => id !== uId));
  };

  // Helper function to compress images using Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Attachment upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files) as File[]) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`O arquivo "${file.name}" excede 5MB. Por favor, escolha um arquivo menor.`);
        continue;
      }

      let dataUrl = '';
      if (file.type.startsWith('image/')) {
        dataUrl = await compressImage(file);
      } else {
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newAttachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: Math.round(dataUrl.length * 0.75), // aproximadamente em bytes
        type: file.type.startsWith('image/') ? 'image/jpeg' : file.type,
        dataUrl,
        uploadedAt: Date.now()
      };
      setAttachments((prev) => [...prev, newAttachment]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Checklist Item updates
  const handleStatusChange = (itemId: string, newStatus: StatusEquipment) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );
  };

  // Adicionar complemento de informação (Caixa de diálogo restrita aos membros do plantão)
  const handleAddComplement = () => {
    if (!isShiftMember) {
      alert('Apenas profissionais integrantes do plantão possuem permissão para adicionar complementos.');
      return;
    }
    if (!newComplementText.trim()) return;

    const newAddendum: ReportAddendum = {
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      timestamp: Date.now(),
      text: newComplementText.trim()
    };

    setComplements([...complements, newAddendum]);
    setNewComplementText('');
    setShowComplementModal(false);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSave = (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    if (date > todayStr) {
      alert('Não é permitido registrar relatórios com datas futuras.');
      return;
    }

    if (!isAuthor) {
      alert('Apenas o criador do relatório pode editá-lo.');
      return;
    }

    // Assinatura vinculada ao usuário logado
    const coAuthorObjects = coAuthorIds.map((id) => {
      const u = allUsers.find((user) => user.id === id);
      return {
        userId: id,
        userName: u ? u.name : 'Profissional',
        role: u ? u.role : 'Enfermagem',
        validated: true,
        validatedAt: Date.now()
      };
    });

    let reportStatus: ReportStatus = 'rascunho';
    if (!isDraft) {
      reportStatus = 'concluido';
    }

    const now = Date.now();
    const newAuditLog: AuditLog = {
      id: `audit-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      editorId: currentUser.id,
      editorName: currentUser.name,
      editorRole: currentUser.role,
      summary: isDraft
        ? `Rascunho salvo por ${currentUser.name} (${currentUser.role})`
        : initialReport
        ? `Relatório alterado e finalizado por ${currentUser.name} (${currentUser.role})`
        : `Relatório registrado por ${currentUser.name} (${currentUser.role})`
    };

    const existingAuditLogs = initialReport?.auditLogs || [];

    const newReport: ShiftReport = {
      id: initialReport?.id || `rep-${now}`,
      date,
      shift,
      authorId: initialReport?.authorId || currentUser.id,
      authorName: initialReport?.authorName || currentUser.name,
      authorRole: initialReport?.authorRole || currentUser.role,
      authorCoren: initialReport?.authorCoren || currentUser.coren || '',
      coAuthors: coAuthorObjects,
      status: reportStatus,
      recebimentoPlantao,
      attachments,
      movement,
      checklist,
      feedback: {
        sugestoes: ''
      },
      passagemPlantaoSintese,
      complements,
      tecnicoPrivateNotes,
      enfermeiroPrivateNotes,
      coordinatorConference: initialReport?.coordinatorConference,
      viewReceipts: initialReport?.viewReceipts || [],
      auditLogs: [newAuditLog, ...existingAuditLogs],
      createdAt: initialReport?.createdAt || new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString()
    };

    onSaveReport(newReport);
  };

  const sectors = ['Pronto-Socorro', 'Clínica Médica', 'Sala de Parto', 'UTI'] as const;

  // Filter available users for selection in responsible dropdown list
  const availableStaff = allUsers.filter(
    (u) => u.id !== currentUser.id && !coAuthorIds.includes(u.id)
  );

  return (
    <form onSubmit={(e) => handleSave(e, false)} className="space-y-5 pb-20">
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            {initialReport ? 'Editar Relatório' : 'Adicionar Novo Relatório'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hospital Municipal Maria Veneri (HMMV) • Relatório da Equipe de Enfermagem
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          
          {/* Opção para Salvar Rascunho */}
          <button
            type="button"
            onClick={(e) => handleSave(e, true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <FileEdit className="w-4 h-4 text-slate-300" />
            Salvar Rascunho
          </button>

          {/* Botão Finalizar e Salvar */}
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            Finalizar e Salvar
          </button>
        </div>
      </div>

      {/* SECTION 1: DATA E RESPONSÁVEIS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-700" />
          1. Data e Responsáveis do Plantão
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data do Plantão
            </label>
            <div className="space-y-1">
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
              {dayOfWeek && (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span>Dia: {dayOfWeek}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Turno</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShift('diurno')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  shift === 'diurno'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Diurno (07-19h)
              </button>
              <button
                type="button"
                onClick={() => setShift('noturno')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  shift === 'noturno'
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Noturno (19-07h)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assinatura do Autor (Login Atual)
            </label>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-950">
              <div>{currentUser.name}</div>
              <div className="text-[10px] text-emerald-800 font-normal">
                {currentUser.role} {currentUser.coren && `• ${currentUser.coren}`}
              </div>
            </div>
          </div>
        </div>

        {/* Lista suspensa para selecionar responsáveis */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Plantonistas Presentes
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select
              value={selectedToAddUserId}
              onChange={(e) => {
                setSelectedToAddUserId(e.target.value);
                handleAddResponsible(e.target.value);
              }}
              className="w-full sm:w-80 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">-- Selecionar profissional na lista --</option>
              {availableStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
            </select>
          </div>

          {/* Selected responsibles list */}
          <div className="flex flex-wrap gap-2 mt-3">
            {coAuthorIds.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                Nenhum integrante adicional vinculado.
              </span>
            ) : (
              coAuthorIds.map((id) => {
                const u = allUsers.find((user) => user.id === id);
                if (!u) return null;
                const isCreator = id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="bg-slate-100 border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-xl flex items-center gap-2 shadow-xs"
                  >
                    <span className="font-bold">{u.name}</span>
                    <span className="text-[10px] text-slate-500">({u.role})</span>
                    {!isCreator && (
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsible(u.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: RECEBIMENTO DE PLANTÃO & LGPD */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileText className="w-4 h-4 text-emerald-700" />
          2. Recebimento de Plantão
        </h3>

        {/* Quadro LGPD com "i" em itálico */}
        <div className="bg-slate-50 border border-emerald-300 rounded-xl p-3 flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
            <span className="italic font-serif font-black text-emerald-800 text-sm">i</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Aviso LGPD</div>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
              Inicie o primeiro preenchimento informando o recebimento do turno. Utilize <i>apenas as iniciais</i> dos nomes dos pacientes para preservação de dados sensíveis (Lei nº 13.709/2018).
            </p>
          </div>
        </div>

        <div>
          <textarea
            rows={4}
            value={recebimentoPlantao}
            onChange={(e) => setRecebimentoPlantao(e.target.value)}
            placeholder="Descreva o recebimento do plantão, intercorrências e estado geral dos leitos (use iniciais dos pacientes ex: 'Leito 04 - Pac. A.B.S. em O2 contínuo')..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
          />
        </div>

        {/* Anexos */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              Anexos do Relatório
            </label>
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              Anexar
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="bg-slate-100 border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-2"
                >
                  <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: MOVIMENTAÇÃO DE LEITOS (Incluindo Altas, Admissões, Transferências, Óbitos, Nascimentos, Gestantes) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <BedDouble className="w-4 h-4 text-emerald-700" />
          3. Movimentação de Leitos e Pacientes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Altas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Altas Hospitalares
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, altas: Math.max(0, movement.altas - 1) })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{movement.altas}</span>
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, altas: movement.altas + 1 })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Iniciais dos pacientes de alta"
              value={movement.altasObs || ''}
              onChange={(e) => setMovement({ ...movement, altasObs: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          {/* 2. Admissões */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Admissões
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, admissoes: Math.max(0, movement.admissoes - 1) })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{movement.admissoes}</span>
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, admissoes: movement.admissoes + 1 })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Iniciais dos pacientes admitidos"
              value={movement.admissoesObs || ''}
              onChange={(e) => setMovement({ ...movement, admissoesObs: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          {/* 3. Transferências */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                Transferências
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, transferenciasEnviadas: Math.max(0, movement.transferenciasEnviadas - 1) })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{movement.transferenciasEnviadas}</span>
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, transferenciasEnviadas: movement.transferenciasEnviadas + 1 })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Iniciais e destino/origem da transferência"
              value={movement.transferenciasObs || ''}
              onChange={(e) => setMovement({ ...movement, transferenciasObs: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          {/* 4. Óbitos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Skull className="w-3.5 h-3.5 text-slate-700" />
                Óbitos
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, obitos: Math.max(0, movement.obitos - 1) })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{movement.obitos}</span>
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, obitos: movement.obitos + 1 })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Iniciais, horário e declaração de óbito"
              value={movement.obitosObs || ''}
              onChange={(e) => setMovement({ ...movement, obitosObs: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          {/* 5. Nascimentos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Baby className="w-3.5 h-3.5 text-pink-600" />
                Nascimentos
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, nascimentos: Math.max(0, movement.nascimentos - 1) })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{movement.nascimentos}</span>
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, nascimentos: movement.nascimentos + 1 })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Iniciais do RN, sexo, Apgar ou observações"
              value={movement.nascimentosObs || ''}
              onChange={(e) => setMovement({ ...movement, nascimentosObs: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          {/* 6. Gestantes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                Gestantes Acompanhadas
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, gestantesAcompanhamento: Math.max(0, movement.gestantesAcompanhamento - 1) })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{movement.gestantesAcompanhamento}</span>
                <button
                  type="button"
                  onClick={() => setMovement({ ...movement, gestantesAcompanhamento: movement.gestantesAcompanhamento + 1 })}
                  className="w-5 h-5 bg-white border rounded text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Iniciais / Sala de Parto / Acompanhamento"
              value={movement.gestantesObs || ''}
              onChange={(e) => setMovement({ ...movement, gestantesObs: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: CHECKLIST */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <Stethoscope className="w-4 h-4 text-emerald-700" />
          4. Checklist de Equipamentos e Cautela por Setor
        </h3>

        {/* Sector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {sectors.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSector(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeSector === sec
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Sector Items */}
        <div className="space-y-2 pt-1">
          {checklist
            .filter((item) => item.sector === activeSector)
            .map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{item.name}</div>
                  {item.category && <div className="text-[10px] text-slate-500">{item.category}</div>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'conforme')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                      item.status === 'conforme'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    ✅ Conforme
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'alerta')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                      item.status === 'alerta'
                        ? 'bg-amber-500 text-amber-950 border-amber-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    ⚠️ Alerta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'nao_conforme')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                      item.status === 'nao_conforme'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    ❌ Não Conf.
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* SECTION 5: PASSAGEM DE PLANTÃO & CAIXA DE DIÁLOGO DE COMPLEMENTAÇÃO RESTREITA */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-700" />
            5. Passagem de Plantão
          </h3>

          {/* Opção de Complementar Informações (Caixa de Diálogo) */}
          <button
            type="button"
            onClick={() => {
              if (!isShiftMember) {
                alert('Restrito: Apenas os profissionais integrantes vinculados ao plantão possuem permissão para adicionar complementos de informação.');
                return;
              }
              setShowComplementModal(true);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            Complementar Informações
          </button>
        </div>

        {/* Único campo principal de preenchimento para Passagem de Plantão */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Síntese da Passagem de Plantão e Orientações para a Próxima Equipe
          </label>
          <textarea
            rows={4}
            value={passagemPlantaoSintese}
            onChange={(e) => setPassagemPlantaoSintese(e.target.value)}
            placeholder="Descreva a passagem de plantão, síntese das condutas, pendências de exames, medicamentos agendados e avisos para a equipe que assume..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
          />
        </div>

        {/* Exibição dos Complementos de Informações Cadastrados */}
        {complements.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              Complementos Adicionados à Passagem de Plantão ({complements.length}):
            </div>
            <div className="space-y-2">
              {complements.map((comp) => (
                <div key={comp.id} className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>{comp.authorName} ({comp.authorRole})</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(comp.timestamp).toLocaleDateString('pt-BR')} às {new Date(comp.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{comp.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Caixa de Diálogo (Modal) para Complementar Informações */}
      {showComplementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                onClick={() => setShowComplementModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950">
              ℹ️ Apenas profissionais adicionados como integrantes deste plantão possuem permissão para registrar complementos.
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
                placeholder="Escreva as informações adicionais ou atualizações relevantes para a passagem de plantão..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowComplementModal(false)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddComplement}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                Adicionar Complemento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={(e) => handleSave(e, true)}
          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
        >
          <FileEdit className="w-4 h-4 text-slate-300" />
          Salvar Rascunho
        </button>

        <button
          type="submit"
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          Finalizar e Salvar Relatório
        </button>
      </div>
    </form>
  );
};
