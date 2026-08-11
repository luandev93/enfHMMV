import React from 'react';
import { ShiftReport, User } from '../types/nursing';
import { CheckCircle2, Clock, FileCheck, X, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface PendingSignaturesModalProps {
  currentUser: User;
  reports: ShiftReport[];
  onValidateReport: (reportId: string, userId: string) => void;
  onOpenReportDetail: (report: ShiftReport) => void;
  onClose: () => void;
}

export const PendingSignaturesModal: React.FC<PendingSignaturesModalProps> = ({
  currentUser,
  reports,
  onValidateReport,
  onOpenReportDetail,
  onClose
}) => {
  // Find reports where currentUser is listed as coAuthor and needs to validate
  const pendingForUser = reports.filter((rep) =>
    rep.coAuthors.some((ca) => ca.userId === currentUser.id && !ca.validated)
  );

  return (
    <div className="fixed inset-0 z-50 bg-azul-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-borda overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-azul-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-azul-900/80 rounded-lg text-azul-200 border border-azul-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Painel de Pendências de Assinatura</h2>
              <p className="text-xs text-azul-200">Coautoria e Ciência de Plantão (Workflow RBAC)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-azul-700 text-azul-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {pendingForUser.length === 0 ? (
            <div className="text-center py-8 px-4 bg-azul-050 rounded-xl border border-dashed border-borda-forte">
              <CheckCircle2 className="w-12 h-12 text-entrada mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-tinta">Sem pendências para {currentUser.name}</p>
              <p className="text-xs text-tinta-fraca mt-1 max-w-xs mx-auto">
                Você validou todas as suas participações em relatórios de plantão como coautor(a).
              </p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Atenção Coautor(a):</span> Você foi incluído(a) como profissional presente nos relatórios abaixo. A homologação do turno exige sua confirmação digital.
                </div>
              </div>

              {pendingForUser.map((rep) => {
                const shiftLabel = rep.shift === 'diurno' ? 'Diurno (07:00h às 19:00h)' : 'Noturno (19:00h às 07:00h)';
                const dateFmt = new Date(rep.date + 'T12:00:00').toLocaleDateString('pt-BR');

                return (
                  <div
                    key={rep.id}
                    className="bg-white border border-borda hover:border-amber-300 rounded-xl p-3.5 shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-tinta">{dateFmt}</span>
                          <span className="text-[10px] font-semibold bg-azul-100 text-azul-800 px-2 py-0.5 rounded-full uppercase">
                            {shiftLabel}
                          </span>
                        </div>
                        <p className="text-xs text-tinta-fraca mt-1">
                          <span className="font-semibold text-tinta">Autor Principal:</span> {rep.authorName} ({rep.authorRole})
                        </p>
                      </div>
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-1 rounded-md shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Pendente
                      </span>
                    </div>

                    {/* Report Excerpt */}
                    <div className="mt-2.5 bg-azul-050 p-2.5 rounded-lg border border-borda text-xs text-tinta line-clamp-2 italic">
                      "{rep.recebimentoPlantao || 'Sem observações no recebimento.'}"
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-borda gap-2">
                      <button
                        onClick={() => onOpenReportDetail(rep)}
                        className="text-xs font-medium text-azul-800 hover:text-azul-900 hover:underline flex items-center gap-1"
                      >
                        Visualizar Relatório
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onValidateReport(rep.id, currentUser.id)}
                        className="bg-azul-700 hover:bg-azul-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-azul-200" />
                        Assinar / Confirmar Ciência
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-azul-050 border-t border-borda text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-borda hover:bg-borda-forte text-tinta font-bold text-xs rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
