# enfHMMV — Módulo de Enfermagem do HMMV ERP

Sistema de apoio à operação de enfermagem do Hospital Municipal, concebido como módulo integrante do **HMMV ERP**.

O `enfHMMV` não deve ser tratado como um sistema isolado. Seu papel é participar do fluxo hospitalar integrado, compartilhando informações por meio de **contratos internos bem definidos**, sem acoplamento direto entre módulos.

---

## 1. VISÃO DO PRODUTO

O `enfHMMV` representa a camada operacional da enfermagem dentro do ERP Hospitalar.

Seu objetivo é apoiar a equipe de enfermagem na organização da assistência, plantões, equipe, registros operacionais e comunicação com os demais setores do hospital.

Arquitetura conceitual:

```text
                    HMMV ERP
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   recepHMMV       medHMMV       FarmHMMV
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                    enfHMMV
                       │
             Operação da Enfermagem
                       │
                       ↓
              Contratos Internos
                       │
                       ↓
              integra_SUS_HMMV

O enfHMMV não deve possuir integração direta com RNDS ou outros serviços governamentais.


---

2. PAPEL DO ENFHMMV NO ERP

Dentro do HMMV ERP, o módulo de enfermagem deverá participar principalmente dos seguintes fluxos:

PACIENTE
   ↓
RECEPÇÃO
   ↓
ATENDIMENTO / INTERNAÇÃO
   ↓
MÉDICO
   ↓
PRESCRIÇÃO
   ↓
ENFERMAGEM
   ↓
ADMINISTRAÇÃO DA ASSISTÊNCIA
   ↓
CONSUMO / FARMÁCIA
   ↓
AUDITORIA

O módulo deverá funcionar como ponto operacional entre a prescrição médica, a execução da assistência e os demais setores envolvidos no cuidado.


---

3. ESTADO ATUAL

🟢 Funcionalidades já presentes na base atual

O repositório já possui uma base técnica funcional relacionada à operação de enfermagem, incluindo:

aplicação web em React;

TypeScript;

Vite;

autenticação;

Firebase;

Firestore;

persistência local;

usuários e equipe;

escalas;

relatórios de plantão;

estruturas para registros operacionais;

integração com dados relacionados à Farmácia;

solicitações da enfermagem relacionadas ao estoque;

identificação de locais habilitados para solicitações;

regras de segurança do Firestore;

configuração de ambiente;

automações de deploy;

estrutura preparada para evolução do módulo.


Estas funcionalidades representam o estado conhecido da base atual e não devem ser interpretadas automaticamente como cobertura completa do workflow hospitalar.


---

4. O QUE ESTÁ PARCIAL

A base atual ainda precisa evoluir para representar um módulo completo de enfermagem integrado ao ERP.

Principais áreas de consolidação:

workflow assistencial;

vínculo entre paciente e atendimento;

vínculo entre paciente e internação;

integração estruturada com prescrição médica;

administração de medicamentos;

registros de enfermagem;

observações clínicas;

evolução de enfermagem;

controle de procedimentos;

controle de pendências;

integração estruturada com FarmHMMV;

auditoria completa;

contratos internos;

validação de dados;

testes automatizados;

controle de permissões por função;

rastreabilidade das alterações.



---

5. O QUE AINDA PRECISA SER IMPLEMENTADO

As funcionalidades abaixo fazem parte do roadmap do produto e não devem ser consideradas implementadas apenas por estarem documentadas.

Paciente

identificação única do paciente;

vínculo com cadastro central;

histórico de atendimentos;

vínculo com internação;

localização hospitalar;

setor;

leito;

status assistencial.


Atendimento

identificação do atendimento;

data e hora;

origem;

setor;

profissional responsável;

situação do atendimento;

vínculo com prescrição;

vínculo com registros de enfermagem.


Internação

admissão;

transferência;

alta;

setor;

leito;

histórico de movimentação;

responsável pelo atendimento.


Enfermagem

avaliação de enfermagem;

evolução de enfermagem;

registros assistenciais;

sinais vitais;

observações;

procedimentos;

cuidados realizados;

pendências;

intercorrências;

registro temporal dos eventos.


Administração de medicamentos

Fluxo planejado:

PRESCRIÇÃO MÉDICA
       ↓
VALIDAÇÃO
       ↓
DISPENSAÇÃO
       ↓
ENFERMAGEM
       ↓
ADMINISTRAÇÃO
       ↓
REGISTRO
       ↓
AUDITORIA

O registro deverá permitir rastrear, quando aplicável:

paciente;

medicamento;

dose;

via;

horário;

profissional;

situação;

observação;

data e hora;

origem da prescrição.



---

6. INTEGRAÇÃO COM FARMHMMV

O enfHMMV já possui relação técnica com estruturas da Farmácia.

A arquitetura definitiva deverá evitar dependência direta de implementação interna.

Modelo desejado:

enfHMMV
   ↓
CONTRATO INTERNO
   ↓
FarmHMMV

Exemplo conceitual:

Solicitação de material/medicamento
        ↓
Contrato de requisição
        ↓
FarmHMMV
        ↓
Validação
        ↓
Atendimento da solicitação
        ↓
Registro da movimentação

O módulo de enfermagem não deve manipular diretamente saldos internos da Farmácia.

A responsabilidade pelo estoque permanece no FarmHMMV.


---

7. INTEGRAÇÃO COM MEDHMMV

Fluxo planejado:

medHMMV
   ↓
PRESCRIÇÃO
   ↓
CONTRATO INTERNO
   ↓
enfHMMV
   ↓
EXECUÇÃO / ADMINISTRAÇÃO
   ↓
REGISTRO

O enfHMMV não deve depender da implementação interna do medHMMV.

A comunicação deverá ocorrer por contratos de domínio.


---

8. INTEGRAÇÃO COM RECEPÇÃO

Fluxo planejado:

recepHMMV
   ↓
PACIENTE
   ↓
ATENDIMENTO / INTERNAÇÃO
   ↓
CONTRATO INTERNO
   ↓
enfHMMV

O módulo de enfermagem deverá receber somente os dados necessários para executar suas responsabilidades.

Não deverá duplicar o cadastro mestre do paciente.


---

9. CONTRATOS INTERNOS

Os módulos do HMMV ERP devem compartilhar contratos estáveis.

Entidades relevantes:

PATIENT
ORGANIZATION
PRACTITIONER
PRACTITIONERROLE
ENCOUNTER
INTERNAÇÃO
BED
PRESCRIPTION
MEDICATION
MEDICATIONREQUEST
MEDICATIONDISPENSE
MEDICATIONADMINISTRATION
OBSERVATION
PROCEDURE
NURSINGRECORD
NURSINGEVOLUTION
STOCKREQUEST
AUDIT

A implementação deverá evoluir de forma incremental:

ENTIDADE
   ↓
MODELO
   ↓
CONTRATO
   ↓
VALIDAÇÃO
   ↓
SERVIÇO
   ↓
TESTE


---

10. AUDITORIA

Dados hospitalares exigem rastreabilidade.

Eventos relevantes deverão possuir, quando aplicável:

usuário;

função;

data;

hora;

ação;

entidade;

identificador;

valor anterior;

novo valor;

origem;

correlação da operação.


Exemplo:

PROFISSIONAL
     ↓
ALTERAÇÃO
     ↓
REGISTRO DE ENFERMAGEM
     ↓
AUDITORIA

Registros críticos não devem ser simplesmente apagados sem rastreabilidade.


---

11. SEGURANÇA

Requisitos gerais:

autenticação;

autorização;

RBAC;

segregação de funções;

validação de entrada;

regras de acesso;

auditoria;

logs;

tratamento seguro de erros;

proteção de credenciais;

secrets fora do código;

ambientes separados;

princípio do menor privilégio.


Credenciais e chaves privadas nunca devem ser versionadas.

Arquivos .env devem permanecer fora do controle de versão quando contiverem segredos.


---

12. DADOS SENSÍVEIS

O módulo poderá manipular informações hospitalares e assistenciais.

Portanto:

evitar exposição desnecessária de dados;

limitar acesso conforme função;

registrar acessos e alterações relevantes;

não armazenar informações sensíveis em logs sem necessidade;

proteger credenciais;

aplicar segregação de permissões;

manter rastreabilidade.


A conformidade legal e regulatória deverá ser validada separadamente antes de qualquer declaração formal de conformidade.


---

13. ARQUITETURA

Arquitetura desejada:

┌─────────────────────┐
│     recepHMMV       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│      medHMMV        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│      enfHMMV        │
│                     │
│  Operação da        │
│  Enfermagem         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│     FarmHMMV        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ integra_SUS_HMMV    │
└─────────────────────┘

A representação acima é conceitual.

A arquitetura definitiva deverá utilizar contratos internos para reduzir acoplamento entre os módulos.


---

14. INTEROPERABILIDADE

O enfHMMV não deverá integrar diretamente com RNDS.

Arquitetura:

enfHMMV
   ↓
CONTRATO INTERNO
   ↓
integra_SUS_HMMV
   ↓
MAPPER
   ↓
FHIR
   ↓
ADAPTER GOVERNAMENTAL
   ↓
RNDS / SERVIÇO GOVERNAMENTAL

Responsabilidade do enfHMMV:

produzir dados internos consistentes.


Responsabilidade do integra_SUS_HMMV:

interoperabilidade;

transformação;

validação;

adapters;

comunicação externa.



---

15. SAAS

A evolução futura deverá permitir:

multi-tenant;

múltiplos estabelecimentos;

isolamento de dados;

usuários;

RBAC;

configuração por hospital;

backup;

recuperação;

observabilidade;

suporte;

implantação controlada.


O modelo SaaS deverá ser introduzido sem comprometer a separação de responsabilidades do módulo.


---

16. RELATÓRIOS

O módulo deverá evoluir para relatórios operacionais e assistenciais, incluindo potencialmente:

plantões;

equipe;

escalas;

registros;

pendências;

procedimentos;

administração de medicamentos;

intercorrências;

indicadores assistenciais;

auditoria.


Os relatórios deverão respeitar as permissões do usuário.


---

17. WORKFLOW HOSPITALAR

Workflow alvo:

PACIENTE
   ↓
RECEPÇÃO
   ↓
ATENDIMENTO
   ↓
MÉDICO
   ↓
PRESCRIÇÃO
   ↓
FARMÁCIA
   ↓
DISPENSAÇÃO
   ↓
ENFERMAGEM
   ↓
ADMINISTRAÇÃO
   ↓
REGISTRO
   ↓
CONSUMO
   ↓
AUDITORIA
   ↓
INTEROPERABILIDADE

O enfHMMV ocupa principalmente a etapa de execução e registro da assistência.


---

18. RELAÇÃO COM O FARMHMMV

HMMV ERP
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
    enfHMMV                  FarmHMMV
        │                         │
        │ solicitação             │ estoque
        │                         │
        └────── CONTRATO ─────────┘

A enfermagem solicita.

A Farmácia controla o estoque.

O ERP registra a operação.


---

19. DEFINIÇÃO DO MVP

Para considerar o enfHMMV parte do MVP do ERP, deverá existir pelo menos:

Núcleo

autenticação;

usuários;

permissões;

equipe;

pacientes;

atendimentos;

setores;

leitos;

registros de enfermagem.


Assistência

avaliação;

evolução;

sinais vitais;

procedimentos;

intercorrências;

pendências.


Medicamentos

recebimento de prescrição;

visualização;

validação;

registro de administração;

integração com FarmHMMV.


Integração

contratos internos;

integração com recepHMMV;

integração com medHMMV;

integração com FarmHMMV;

eventos auditáveis.


Segurança

RBAC;

auditoria;

proteção de dados;

validação;

tratamento seguro de erros.



---

20. CRITÉRIOS DE ACEITAÇÃO DO MVP

O módulo será considerado funcionalmente integrado quando:

1. um paciente puder ser identificado no fluxo hospitalar;


2. o atendimento puder ser associado ao paciente;


3. a enfermagem puder acessar o contexto necessário do atendimento;


4. uma prescrição puder chegar ao fluxo de enfermagem por contrato;


5. a administração puder ser registrada;


6. registros de enfermagem puderem ser auditados;


7. solicitações à Farmácia utilizarem contrato definido;


8. o saldo de estoque permanecer sob responsabilidade do FarmHMMV;


9. alterações críticas forem rastreáveis;


10. permissões impedirem acesso indevido;


11. os módulos não dependerem diretamente da RNDS;


12. os dados destinados à interoperabilidade possam posteriormente ser enviados ao integra_SUS_HMMV.




---

21. ROADMAP

Fase 1 — Consolidação

estabilizar aplicação;

revisar estrutura;

revisar autenticação;

revisar Firestore;

revisar permissões;

revisar persistência;

consolidar documentação.


Fase 2 — Domínio hospitalar

paciente;

atendimento;

internação;

setor;

leito;

registros assistenciais.


Fase 3 — Assistência

avaliação;

evolução;

sinais vitais;

procedimentos;

intercorrências;

pendências.


Fase 4 — Integração

contrato com recepHMMV;

contrato com medHMMV;

contrato com FarmHMMV;

eventos;

auditoria.


Fase 5 — ERP

workflow ponta a ponta;

indicadores;

relatórios;

RBAC avançado;

multi-tenant.


Fase 6 — Interoperabilidade

integração com integra_SUS_HMMV;

mappers;

FHIR;

adapters;

validação dos requisitos externos.



---

22. DEPENDÊNCIAS

O desenvolvimento completo depende da evolução coordenada de:

recepHMMV
medHMMV
enfHMMV
FarmHMMV
integra_SUS_HMMV

Nenhum módulo deve assumir que outro sistema possui determinada funcionalidade sem que exista um contrato definido.


---

23. REGRA DE ARQUITETURA

A regra central do HMMV ERP é:

MÓDULO
   ↓
CONTRATO INTERNO
   ↓
SERVIÇO
   ↓
INTEGRAÇÃO

E não:

MÓDULO
   ↓
BANCO DO OUTRO MÓDULO

ou:

MÓDULO
   ↓
RNDS

A independência modular é requisito arquitetural do produto.


---

24. GOVERNMENT READY

O projeto tem como objetivo futuro alcançar uma arquitetura preparada para requisitos governamentais.

Entretanto, este repositório não declara conformidade governamental.

Qualquer declaração de conformidade dependerá de validação efetiva de:

requisitos técnicos;

segurança;

proteção de dados;

infraestrutura;

documentação;

contratos;

requisitos das integrações;

homologações;

requisitos específicos do órgão comprador.



---

25. DEFINIÇÃO DE PRONTO

Uma funcionalidade somente deverá ser considerada concluída quando:

estiver implementada;

estiver validada;

possuir tratamento de erro;

respeitar permissões;

possuir rastreabilidade quando necessária;

não quebrar contratos existentes;

possuir testes quando aplicável;

estiver documentada;

estiver integrada ao workflow correto.


Documentação não significa implementação.

Planejamento não significa funcionalidade existente.


---

26. POSIÇÃO DO PROJETO

O enfHMMV encontra-se em DESENVOLVIMENTO ATIVO.

A base técnica já permite evolução do módulo, mas ainda existe trabalho para transformar o projeto em um módulo completo de enfermagem integrado ao HMMV ERP.

O objetivo não é apenas possuir um sistema de enfermagem.

O objetivo é construir:

um ERP Hospitalar integrado, modular, auditável e orientado a workflow.


---

HMMV ERP

RECEPÇÃO
    ↓
ATENDIMENTO
    ↓
MÉDICO
    ↓
PRESCRIÇÃO
    ↓
FARMÁCIA
    ↓
ENFERMAGEM
    ↓
ADMINISTRAÇÃO
    ↓
AUDITORIA
    ↓
INTEROPERABILIDADE

Status: DESENVOLVIMENTO ATIVO

Objetivo: MVP SaaS ERP Hospitalar HMMV — arquitetura modular, workflow hospitalar ponta a ponta, segurança, auditoria e interoperabilidade.

---

## Log de Alterações Operacionais

> Seção viva: cada execução real (correção, deploy, CI) é registrada aqui de forma aditiva. Nunca remover entradas anteriores — apenas acrescentar.

### 2026-08-21
- fix(security): `firestore-enfermagem.rules` mesclado com sucesso no `firestore.rules` do FarmHMMV (mesmo projeto Firebase `farmhmmv`, confirmado via `.firebaserc`). `/plantoes` e `/escalas` voltaram a funcionar em produção.
