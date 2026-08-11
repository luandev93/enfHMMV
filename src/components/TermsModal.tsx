import React from 'react';
import { ShieldCheck, X, FileText, Lock } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-azul-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-borda overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-azul-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-azul-900 rounded-lg text-azul-200 border border-azul-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Termos e Condições de Uso
              </h2>
              <p className="text-xs text-azul-200">
                Sistema de Relatório de Enfermagem • HMMV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-azul-700 text-azul-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-tinta leading-relaxed">
          <div className="bg-slate-50 border border-borda p-3 rounded-xl flex items-center gap-2 text-slate-800 font-medium">
            <FileText className="w-5 h-5 text-azul-800 shrink-0" />
            <span>
              Por favor, leia atentamente as condições e diretrizes de utilização da plataforma de registros de enfermagem do Hospital Municipal Maria Veneri.
            </span>
          </div>

          <div className="space-y-3">
            <section className="space-y-1">
              <h3 className="font-bold text-tinta text-xs uppercase tracking-wide text-azul-800">
                1. Finalidade e Escopo do Sistema
              </h3>
              <p>
                Este sistema destina-se exclusivamente ao registro digital interno, controle de passagem de plantão, conferência de checklist de equipamentos e acompanhamento da movimentação de leitos pelos profissionais de enfermagem do Hospital Municipal Maria Veneri (HMMV).
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-bold text-tinta text-xs uppercase tracking-wide text-azul-800">
                2. Proteção de Dados de Pacientes e LGPD (Lei nº 13.709/2018)
              </h3>
              <p>
                Em estrito cumprimento à Lei Geral de Proteção de Dados (LGPD), é proibido registrar nomes completos, números de documentos pessoais (CPF/RG) ou dados sensíveis identificáveis dos pacientes nos relatórios de plantão. Os pacientes devem ser identificados exclusivamente através de suas iniciais de nome (ex: J.S.O.), número do leito ou prontuário interno.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-bold text-tinta text-xs uppercase tracking-wide text-azul-800">
                3. Responsabilidade pelas Credenciais e Acesso
              </h3>
              <p>
                O acesso à plataforma é individual e intransferível. Cada profissional é integralmente responsável pelo guarda, sigilo e utilização de suas credenciais de acesso (Login e PIN/Senha). Todas as assinaturas registradas e alterações realizadas sob um login específico serão legal e administrativamente vinculadas ao respectivo titular.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-bold text-tinta text-xs uppercase tracking-wide text-azul-800">
                4. Isenção e Limitação de Responsabilidade dos Desenvolvedores
              </h3>
              <p>
                A solução tecnológica é disponibilizada como ferramenta de auxílio operacional no modelo de licenciamento de uso. Os desenvolvedores e mantenedores do software não possuem qualquer responsabilidade sobre:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1 text-tinta-fraca">
                <li>O conteúdo, exatidão ou omissão de dados clínicos e administrativos inseridos pelos profissionais de saúde;</li>
                <li>Uso indevido, compartilhamento não autorizado de senhas ou negligência por parte dos usuários cadastrados;</li>
                <li>Decisões médicas ou assistenciais tomadas com base nas informações registradas nos relatórios;</li>
                <li>Interrupções temporárias de serviço decorrentes de manutenções técnicas, falhas de conectividade de rede local do usuário ou fatores externos imprevisíveis.</li>
              </ul>
            </section>

            <section className="space-y-1">
              <h3 className="font-bold text-tinta text-xs uppercase tracking-wide text-azul-800">
                5. Alterações e Validade dos Termos
              </h3>
              <p>
                Os presentes termos podem ser atualizados periodicamente para adequação às normas técnicas ou regulatórias. A continuidade do uso do sistema após eventuais atualizações constitui concordância expressa com os novos termos estabelecidos.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-borda flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-tinta-fraca font-medium">
            <Lock className="w-3.5 h-3.5 text-azul-600" />
            <span>Ambiente Interno Seguro • HMMV</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-azul-800 hover:bg-azul-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Entendido e Ciente
          </button>
        </div>
      </div>
    </div>
  );
};
