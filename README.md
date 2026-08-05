# enfHMMV — migração da base

Este pacote troca a fundação do app de relatório de enfermagem. As telas
continuam as mesmas; muda o que está embaixo delas.

## Por que a migração

O projeto anterior tinha três problemas somados:

1. As regras do Firestore estavam abertas — `allow read, write: if true` em
   `users`, `shift_reports` e `schedules`. Qualquer pessoa na internet podia ler
   e reescrever tudo, sem login.
2. O `projectId` e a `apiKey` estavam commitados num repositório público, então
   o endereço do banco estava publicado junto com a porta destrancada.
3. O PIN ficava em texto puro na coleção `users`, com padrão igual ao dia e mês
   de nascimento — que também estava gravado ali.

Fechar apenas as regras não resolveria: o app não tinha login de verdade para as
regras conferirem. Por isso a autenticação passa a ser do Firebase Auth.

## O que muda

| Antes | Agora |
|---|---|
| Login por usuário e PIN comparados no navegador | Firebase Auth com e-mail e senha |
| PIN em texto puro no Firestore | Senha nunca trafega nem é gravada |
| `users`, `shift_reports`, `schedules` abertos | `usuarios`, `plantoes`, `escalas` com regras por cargo |
| Projeto Firebase próprio | Mesmo projeto do estoque (`farmhmmv`) |
| Autocadastro possível | Acesso criado pela coordenação |

Compartilhar o projeto com o estoque tem uma consequência boa: **um login só**.
A mesma conta serve para o relatório de plantão e para solicitar medicamento à
farmácia.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `src/lib/firebase.ts` | conexão, coleções e leitura por período |
| `src/lib/sessao.tsx` | sessão, cargos e troca de senha |
| `src/components/AuthScreen.tsx` | nova tela de entrada |
| `firestore-enfermagem.rules` | trecho a colar nas regras do estoque |
| `firebase.json` / `.firebaserc` | publicação no segundo site do projeto |

**Apague** do projeto antigo: `src/lib/supabase.ts`, `src/components/SupabaseModal.tsx`,
`src/components/FirebaseModal.tsx`, `firebase-applet-config.json`,
`supabase_schema.sql`, `dist.zip`, `projeto_completo.zip` e `src/data/mockUsers.ts`.
Os três primeiros expõem configuração na interface; os demais são resíduo.

## Passo a passo

### 1. Repositório novo

```bash
cd ~
mkdir enfHMMV && cd enfHMMV
git init -b main
```

Copie do projeto antigo apenas: `src/components/` (menos os modais citados),
`src/types/`, `src/data/defaultChecklist.ts`, `src/index.css`, `src/main.tsx`,
`index.html`, `tsconfig.json`, `vite.config.ts`, `package.json`.
Depois copie por cima os arquivos deste pacote.

### 2. Chaves

`cp .env.example .env` e preencha com as mesmas seis chaves do projeto de
estoque — é o mesmo Firebase.

### 3. Regras

Abra `firestore.rules` **no repositório do estoque**, cole o conteúdo de
`firestore-enfermagem.rules` dentro do bloco principal e publique:

```bash
cd ~/estoque-farmacia
firebase deploy --only firestore:rules
```

As regras são do projeto, não do app: existe um arquivo só, no repositório do
estoque. Manter cópia nos dois lugares levaria a versões divergentes.

### 4. Segundo site de hospedagem

```bash
cd ~/enfHMMV
firebase hosting:sites:create enfhmmv
firebase target:apply hosting enfermagem enfhmmv
npm install
npm run build
firebase deploy --only hosting:enfermagem
```

O app fica em `https://enfhmmv.web.app`, com o estoque intacto em
`https://farmhmmv.web.app`.

### 5. Acessos da equipe

Cada pessoa da enfermagem passa a ter um documento em `usuarios/{uid}` com:

```json
{
  "nome": "Maria da Silva",
  "email": "maria@hmmv.local",
  "ativo": true,
  "nascimento": "1990-05-12",
  "funcao": "enfermagem",
  "enfermagem": {
    "ativo": true,
    "cargo": "Enfermeiro(a)",
    "coren": "COREN-PE 123456",
    "setorPadrao": "Pronto-Socorro"
  }
}
```

O campo `funcao: "enfermagem"` libera a solicitação de medicamentos à farmácia.
O bloco `enfermagem` libera o app de plantão. Quem for da farmácia e também da
enfermagem pode ter `funcao: "farmaceutico"` com o bloco `enfermagem` preenchido.

Cadastre pelo app do estoque, em **Mais › Pessoas**, e depois complete o bloco
`enfermagem` — a tela de gestão de equipe do app de enfermagem faz isso na
sequência da migração.

### 6. Dados antigos

Os relatórios que estão no projeto `relatorio-hmmv` **não vêm sozinhos**. Se
precisar deles, exporte antes de apagar o projeto antigo: no Console do Firebase,
Firestore → Importar/Exportar. Depois é possível carregar em `plantoes` com
ajuste dos campos `authorId`, que passam a apontar para o `uid` do Firebase Auth.

Se o histórico não for necessário, comece limpo — é mais simples e não arrasta o
formato antigo.

## Limite de anexos

Anexos são gravados como base64 dentro do documento do relatório, e o Firestore
corta em 1 MiB por documento. `salvarPlantao` recusa acima de 700 kB somados,
com aviso claro. Se a equipe precisar anexar fotos com frequência, o caminho é
comprimir antes de gravar ou migrar para o Cloud Storage — que hoje exige o
plano Blaze.

## Sobre o plano gratuito

O Spark dá 50.000 leituras e 20.000 escritas de documento por dia, 1 GiB de banco
e 360 MB de tráfego diário. O volume do hospital fica bem abaixo disso. O que
consome leitura à toa é carregar todo o histórico a cada abertura — por isso
`listarPlantoesRecentes` traz os últimos 60 dias, e as consultas maiores pedem
período explícito.
