import { ChecklistItem } from '../types/nursing';

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // 🚑 PRONTO-SOCORRO - Kit Adulto
  {
    id: 'ps-adulto-1',
    sector: 'Pronto-Socorro',
    category: 'Kit Adulto',
    name: 'Laringoscópio (Lâmina 3 engatada; lâminas 2, 3, 4 e 5 testadas em bolsa)',
    status: 'conforme',
    observation: 'Lâminas 2, 3, 4 e 5 testadas em bolsa e operacionais'
  },
  {
    id: 'ps-adulto-2',
    sector: 'Pronto-Socorro',
    category: 'Kit Adulto',
    name: 'Cânulas Endotraqueais / Tubos (Nº 7.0 | 7.5 | 8.0)',
    status: 'conforme',
    observation: 'Numerações conferidas'
  },
  {
    id: 'ps-adulto-3',
    sector: 'Pronto-Socorro',
    category: 'Kit Adulto',
    name: 'Fio Guia Introdutor Adulto',
    status: 'conforme',
    observation: 'Integridade mantida'
  },
  {
    id: 'ps-adulto-4',
    sector: 'Pronto-Socorro',
    category: 'Kit Adulto',
    name: 'Kit de Medicamentos para Sequência Rápida de Intubação (SRI)',
    status: 'conforme',
    observation: 'Estoque de SRI completo'
  },

  // 🚑 PRONTO-SOCORRO - Kit Pediátrico
  {
    id: 'ps-pedia-1',
    sector: 'Pronto-Socorro',
    category: 'Kit Pediátrico',
    name: 'Laringoscópio Pediátrico (Lâmina 0 engatada; lâminas 00 e 1 testadas em bolsa)',
    status: 'alerta',
    observation: 'Luminosidade fraca na lâmina 0 — pilhas solicitadas para troca'
  },
  {
    id: 'ps-pedia-2',
    sector: 'Pronto-Socorro',
    category: 'Kit Pediátrico',
    name: 'Cânulas Endotraqueais / Tubos Pediátricos (Nº 2.5 | 3.5 | 4.0 | 4.5 | 5.0 | 5.5)',
    status: 'conforme',
    observation: 'Todas as numerações organizadas'
  },
  {
    id: 'ps-pedia-3',
    sector: 'Pronto-Socorro',
    category: 'Kit Pediátrico',
    name: 'Fio Guia Introdutor Pediátrico',
    status: 'conforme',
    observation: 'OK'
  },
  {
    id: 'ps-pedia-4',
    sector: 'Pronto-Socorro',
    category: 'Kit Pediátrico',
    name: 'Kit de Medicamentos para SRI Pediátrica',
    status: 'conforme',
    observation: 'Maleta de ampolas completa'
  },

  // 🚑 PRONTO-SOCORRO - Equipamentos Gerais
  {
    id: 'ps-geral-1',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Desfibrilador Externo Automático (DEA)',
    status: 'conforme',
    observation: 'Checado e com bateria carregada'
  },
  {
    id: 'ps-geral-2',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Carrinho de Parada Cardiorrespiratória (PCR)',
    status: 'conforme',
    observation: 'Checado e Lacrado'
  },
  {
    id: 'ps-geral-3',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Aspirador de Secreções elétrico/portátil',
    status: 'alerta',
    observation: 'Localização atual: UPA (solicitada devolução ao PS)'
  },
  {
    id: 'ps-geral-4',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Nebulizador (1 unidade)',
    status: 'conforme',
    observation: 'Testado e limpo'
  },
  {
    id: 'ps-geral-5',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Bomba de Infusão Contínua (BIC)',
    status: 'conforme',
    observation: 'Testada e funcional'
  },
  {
    id: 'ps-geral-6',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Reanimador Manual (Ambu) Pediátrico (2 unidades)',
    status: 'conforme',
    observation: 'Testados'
  },
  {
    id: 'ps-geral-7',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Reanimador Manual (Ambu) Adulto (1 unidade)',
    status: 'conforme',
    observation: 'Testado'
  },
  {
    id: 'ps-geral-8',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Oxímetro de Pulso Portátil',
    status: 'alerta',
    observation: 'Status: Recolhido pela manutenção preventiva'
  },
  {
    id: 'ps-geral-9',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Eletrocardiógrafo (ECG)',
    status: 'conforme',
    observation: 'Com papel térmico e cabos intactos'
  },
  {
    id: 'ps-geral-10',
    sector: 'Pronto-Socorro',
    category: 'Equipamentos Gerais',
    name: 'Monitor Multiparamétrico',
    status: 'em_uso',
    observation: 'Em uso continuo em leito com paciente grave'
  },

  // 🏥 CLÍNICA MÉDICA
  {
    id: 'cm-1',
    sector: 'Clínica Médica',
    category: 'Equipamentos',
    name: 'Aspirador de Secreções de grande porte',
    status: 'em_uso',
    observation: 'Em uso no leito 12 com paciente'
  },
  {
    id: 'cm-2',
    sector: 'Clínica Médica',
    category: 'Equipamentos',
    name: 'Nebulizadores (3 unidades)',
    status: 'conforme',
    observation: 'Checados e higienizados'
  },

  // 🤱 SALA DE PARTO
  {
    id: 'sp-1',
    sector: 'Sala de Parto',
    category: 'Rede & Mobiliário',
    name: 'Rede de Oxigênio (O2)',
    status: 'conforme',
    observation: 'Pressão normal e manômetros checados'
  },
  {
    id: 'sp-2',
    sector: 'Sala de Parto',
    category: 'Rede & Mobiliário',
    name: 'Cama de Parto / Posição',
    status: 'conforme',
    observation: 'Testada mecânica e movimentos'
  },
  {
    id: 'sp-3',
    sector: 'Sala de Parto',
    category: 'Iluminação',
    name: 'Foco Cirúrgico / Iluminação (com extensão elétrica)',
    status: 'conforme',
    observation: 'Lâmpadas operacionais e extensão testada'
  },
  {
    id: 'sp-4',
    sector: 'Sala de Parto',
    category: 'Monitores e Sonar',
    name: 'Sonar Doppler Fetal 01',
    status: 'nao_conforme',
    observation: 'Status: Pilha Fraca / Não atinge volume ideal'
  },
  {
    id: 'sp-5',
    sector: 'Sala de Parto',
    category: 'Monitores e Sonar',
    name: 'Sonar Doppler Fetal 02 (Modelo antigo)',
    status: 'alerta',
    observation: 'Status: Bateria Fraca (necessita recarga na base)'
  },
  {
    id: 'sp-6',
    sector: 'Sala de Parto',
    category: 'Monitores e Sonar',
    name: 'Oxímetro de Pulso Neonatal / Adulto',
    status: 'conforme',
    observation: 'Testado e operacional'
  },
  {
    id: 'sp-7',
    sector: 'Sala de Parto',
    category: 'Recém-Nascido',
    name: 'Berço Aquecido para RN',
    status: 'conforme',
    observation: 'Conferido (Liga e aquecendo dentro dos padrões)'
  },

  // 🏥 UNIDADE DE TERAPIA INTENSIVA (UTI)
  {
    id: 'uti-1',
    sector: 'UTI',
    category: 'Cilindros / Manifold de O2',
    name: 'Cilindro 01 (O2) - 100 psi (Libras)',
    status: 'conforme',
    observation: 'Pressão nominal em 100 psi'
  },
  {
    id: 'uti-2',
    sector: 'UTI',
    category: 'Cilindros / Manifold de O2',
    name: 'Cilindro 02 (O2) - Reserva',
    status: 'nao_conforme',
    observation: 'Status: Despressurizado / Zerado — recolha solicitada ao almoxarifado'
  },
  {
    id: 'uti-3',
    sector: 'UTI',
    category: 'Aparelhagem Geral',
    name: 'Ventiladores / Monitores da UTI',
    status: 'conforme',
    observation: 'Conferidos e operacionais nos leitos atCrowd'
  },
  {
    id: 'uti-4',
    sector: 'UTI',
    category: 'Infraestrutura / Higienização',
    name: 'Higienização do Piso / Estrutura',
    status: 'nao_conforme',
    observation: 'Sujidade identificada no piso no box 03 — acionada higienização de emergência'
  },
  {
    id: 'uti-5',
    sector: 'UTI',
    category: 'Infraestrutura / Higienização',
    name: 'Painel de Controle da UTI',
    status: 'nao_conforme',
    observation: 'Botão do painel de controle avariado/quebrado — Ordem de serviço aberta'
  },
  {
    id: 'uti-6',
    sector: 'UTI',
    category: 'Infraestrutura / Higienização',
    name: 'Maca para Transporte Interno',
    status: 'alerta',
    observation: 'Maca improvisada em uso temporário devido à manutenção da principal'
  }
];
