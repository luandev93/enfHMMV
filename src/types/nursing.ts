export type UserRole = 'Admin' | 'Coordenador(a) de Enfermagem' | 'Enfermeiro(a)' | 'Técnico(a) de Enfermagem';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  coren?: string;
  birthDate: string; // YYYY-MM-DD
  username: string;
  pin: string; // Password (defaults to DDMM, customizable)
}

export interface ScheduleEntry {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  shift: ShiftType;
  color: string;
}

export type ShiftType = 'diurno' | 'noturno';

export type StatusEquipment = 'conforme' | 'nao_conforme' | 'alerta' | 'em_uso';

export interface ChecklistItem {
  id: string;
  sector: 'Pronto-Socorro' | 'Clínica Médica' | 'Sala de Parto' | 'UTI';
  category?: string; // e.g. "Kit Adulto", "Kit Pediátrico", "Equipamentos Gerais", "Infraestrutura"
  name: string;
  status: StatusEquipment;
  observation?: string;
}

export interface PatientMovement {
  altas: number;
  altasObs?: string;
  admissoes: number;
  admissoesObs?: string;
  transferenciasEnviadas: number;
  transferenciasRecebidas: number;
  transferenciasObs?: string;
  obitos: number;
  obitosObs?: string;
  gestantesAcompanhamento: number;
  gestantesObs?: string;
  nascimentos: number;
  nascimentosObs?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: number;
}

export interface CoAuthorValidation {
  userId: string;
  userName: string;
  role: UserRole;
  validated: boolean;
  validatedAt?: number;
}

export interface FeedbackData {
  sugestoes?: string;
  ocorrenciasAdmin?: string;
  reclamacoes?: string;
}

export type ReportStatus = 'concluido' | 'aguardando_assinatura' | 'rascunho';

export interface AuditLog {
  id: string;
  timestamp: number;
  editorId: string;
  editorName: string;
  editorRole: UserRole;
  summary: string;
}

export interface ViewReceipt {
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: number;
}

export interface CoordinatorConference {
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: number;
  notes?: string;
}

export interface ReportAddendum {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: number;
  text: string;
}

export interface ShiftReport {
  id: string;
  date: string; // ISO YYYY-MM-DD
  shift: ShiftType; // 'diurno' | 'noturno'
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorCoren?: string;
  coAuthors: CoAuthorValidation[];
  status: ReportStatus;
  
  // 3.1 Recebimento de Plantão & LGPD
  recebimentoPlantao: string;
  attachments: Attachment[];
  
  // 3.2 Ocorrências e Leitos
  movement: PatientMovement;
  
  // 4. Checklist de Cautela e Equipamentos
  checklist: ChecklistItem[];
  
  // 5. Passagem de Plantão
  feedback: FeedbackData;
  passagemPlantaoSintese: string;
  complements?: ReportAddendum[];
  
  // Seções Privadas por Perfil
  tecnicoPrivateNotes?: string;
  enfermeiroPrivateNotes?: string;

  // Conferência do Coordenador, Visualizações WhatsApp e Auditoria
  coordinatorConference?: CoordinatorConference;
  viewReceipts?: ViewReceipt[];
  auditLogs?: AuditLog[];

  createdAt: number | string;
  updatedAt: number | string;
}
