# SerTech — Apoio à decisão na produtividade leiteira

Protótipo acadêmico do TCC “Aplicação de Aprendizado de Máquina para apoio à tomada de decisão na produtividade leiteira utilizando dados reais de propriedades rurais”. Esta cópia adapta o aplicativo React existente para consultar a Fazenda Escola da UENP e a propriedade de Cerqueira César, sem alterar o banco remoto ou os resultados científicos.

## Arquitetura

```text
React/Vite ── token de sessão ──> FastAPI ── consultas REST ──> Supabase/PostgreSQL
    └── Supabase Auth                 └── chave privada somente no servidor
```

Frontend: React 19, Vite 8, JavaScript e Tailwind 4; gráficos SVG responsivos com pontos nas datas reais. Backend: Python 3.13 (ambiente verificado), FastAPI, Pydantic, urllib e python-dotenv. PostgreSQL é acessado pela API REST do Supabase; não é necessária senha PostgreSQL.

```text
src/
  components/       AppShell, tabelas, estados de carregamento/erro e gráficos
  hooks/            sessão, navegação e consultas HTTP canceláveis
  screens/          painel, animais, detalhes, acompanhamento, histórico e relatórios
  services/api.js   cliente HTTP autenticado
  utils/            formatação, máscaras e colunas das tabelas
backend/
  app/
    main.py         aplicação, CORS e health check
    config.py       variáveis de ambiente
    routers/api.py  endpoints privados
    schemas/        validação dos registros e de novas solicitações
    services/       autenticação, leitura do banco e cálculos
    ml/             inferência manual e inspeção offline do artefato
  tests/            dados isolados; nenhuma conexão com o banco remoto
```

## Configuração local no Windows / PowerShell

Abra a pasta interna `App-SerTech-main` no VS Code. Na estrutura entregue, seu caminho completo é `C:\Users\anand\Downloads\App-SerTech-main\App-SerTech-main`.

Frontend (primeiro terminal):

```powershell
cd C:\Users\anand\Downloads\App-SerTech-main\App-SerTech-main
npm.cmd ci
# Apenas se .env ainda não existir:
Copy-Item .env.example .env
# Preencha as variáveis no editor, sem colocar segredos no frontend.
npm.cmd run dev -- --host localhost
```

Se já existir `.env`, preserve seu conteúdo e adicione os campos faltantes. O arquivo existente foi preservado e recebeu somente `VITE_API_URL=/` se ausente. Use `npm.cmd` para evitar o bloqueio de `npm.ps1` pela política do PowerShell.

Variáveis públicas em `.env`:

| Variável | Valor esperado |
|---|---|
| `VITE_SUPABASE_URL` | URL HTTPS do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon apropriada para autenticação, ou publishable key |
| `VITE_API_URL` | `/` (proxy local do Vite para a API) |

`VITE_USE_SUPABASE` deixou de ser necessário. Não há entrada demonstrativa quando a configuração está ausente.

Backend (segundo terminal):

```powershell
cd C:\Users\anand\Downloads\App-SerTech-main\App-SerTech-main
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
# Preencha backend/.env no editor antes de iniciar.
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Variáveis privadas em `backend/.env`:

| Variável | Valor esperado |
|---|---|
| `SUPABASE_URL` | Mesmo projeto HTTPS usado na autenticação |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada service_role/secret válida para a API do projeto |
| `AUTHORIZED_USER_IDS` | UUIDs dos usuários autorizados, separados por vírgula |
| `CORS_ORIGINS` | Origens exatas separadas por vírgula; inicialmente `http://localhost:5173` |

Crie/confirme um usuário pelo Supabase Auth e inclua seu UUID na lista privada. Uma conta recém-cadastrada não recebe automaticamente acesso aos dados. Lista vazia nega acesso a todos. Não use metadados editáveis pelo usuário para autorização. Se o Vite escolher outra porta, ajuste a origem explicitamente ou libere a porta 5173.

Não coloque service_role, secret key ou senha em variáveis `VITE_*`. Os dois arquivos `.env` são ignorados; os exemplos não contêm credenciais. O backend envia o token a `/auth/v1/user`, onde o Supabase verifica a autenticidade e validade da sessão; não apenas decodifica o JWT. Depois verifica a lista de UUIDs. A chave privada permite leituras de servidor sem alterar RLS ou suas políticas; por isso todos os endpoints de dados exigem autenticação e autorização. Todos os usuários autorizados desta versão consultam a mesma base acadêmica, sem isolamento por propriedade. Publique frontend e API com HTTPS quando fora do ambiente local.

Abra `http://localhost:5173`. Documentação da API: `http://localhost:8000/docs`. O botão Authorize recebe o access token da sessão para chamadas manuais. `GET /health` verifica somente a execução da API, não a conexão ao banco.

## Acesso pelo celular na rede local

O Vite escuta em `0.0.0.0:5173`, mantém essa porta fixa e encaminha `/api` para `http://127.0.0.1:8000` pelo proxy nativo ([documentação](https://vite.dev/config/server-options.html#server-proxy)). O `.env` local usa `VITE_API_URL=/`. O navegador do celular usa a mesma origem para o site e as chamadas da API; não é necessário expor a porta 8000 nem adicionar o IP do Wi-Fi ao CORS.

Na raiz do aplicativo, execute `npm.cmd run dev` (sem `--host localhost`). Em outro terminal, entre em `backend` e execute `..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.

Com celular e computador na mesma rede Wi-Fi, abra o endereço **Network** mostrado pelo Vite. Na configuração verificada, o endereço é `http://10.1.1.151:5173`. O IP pode mudar ao reconectar à rede; o proxy dispensa alterar o `.env` quando isso ocorrer. Os processos precisam continuar em execução. Se o Firewall do Windows solicitar acesso ao Node.js, permita para a rede local utilizada.

O proxy é uma configuração do servidor de desenvolvimento. Para publicação com `dist/`, configure também o encaminhamento de `/api` no servidor de hospedagem ou use uma URL HTTPS explícita em `VITE_API_URL` no build.

## Funcionalidades implementadas

- Autenticação real, cadastro no Supabase Auth, restauração de sessão e logout; acesso acadêmico sem assinaturas.
- Consulta e indicadores por propriedade; lista pesquisável e paginada de animais; filtros por propriedade.
- Detalhes com identificador global preservado, nome, raça, nascimento e idade quando disponíveis.
- Histórico dos controles ordenado por data, produção anterior e DEL conforme indicadores de disponibilidade; variação entre controles válidos.
- Pesagens, partos, lactações e diagnósticos documentados. Ausência de registros aparece explicitamente, sem inferir condição clínica ou reprodutiva.
- Consulta às previsões existentes, com finalidade e versão; comparação com o controle vinculado por `controle_id`; desvios assinado, absoluto e percentual. Denominador zero retorna percentual nulo.
- Painel com totais, média por controle, período e maiores desvios; acompanhamento descritivo das reduções de produção.
- Gráficos de produção, real versus previsto, desvios e peso no detalhe; gráfico produtivo por animal no histórico/relatórios.
- Cinco relatórios: animais, controles, previsões, desvios e resumo por propriedade; filtros por propriedade, animal, período e finalidade das previsões; CSV da consulta exibida, com proteção contra fórmulas de planilha.
- Loading, erros de configuração/conexão, dados incompletos e listas vazias. Cadastro/edição de animais indisponível; nenhuma rota de escrita no banco foi criada.

Datas filtram controles, previsões e pesagens; não filtram a existência cadastral de animais/propriedades. Finalidade filtra apenas previsões, mantendo explícito que a média produtiva considera todos os controles no filtro. Os gráficos não fabricam observações intermediárias. A seleção de animais nos relatórios comporta os 177 animais informados (limite atual de 200 opções).

### Endpoints

Todos os caminhos `/api` exigem Bearer token e usuário autorizado:

| Método | Caminho | Conteúdo |
|---|---|---|
| GET | `/api/propriedades` | Propriedades |
| GET | `/api/propriedades/{id}` | Dados básicos e indicadores |
| GET | `/api/animais` | Busca, filtro e paginação |
| GET | `/api/animais/{id}` | Dados e históricos completos |
| GET | `/api/animais/{id}/controles` | Controles ordenados e variações |
| GET | `/api/animais/{id}/pesagens` | Pesagens |
| GET | `/api/animais/{id}/previsoes` | Previsões associadas |
| GET | `/api/previsoes` | Previsões filtradas |
| GET | `/api/relatorios` | Dados, indicadores, distribuição e escopo |
| GET | `/api/modelo` | Disponibilidade e motivo |
| POST | `/api/previsoes/nova` | Previsão manual real, sem persistência |

Filtros de relatório: `propriedade_id`, `animal_id`, `inicio` e `fim` (`AAAA-MM-DD`), `finalidade` (`teste` ou `aplicacao`). Lista de animais também aceita `busca`, `pagina` (a partir de 1) e `tamanho` (até 200).

A leitura percorre as páginas do Supabase até esgotar os registros, inclusive quando o servidor limita o tamanho das páginas. Não usa totais fixos. O protótipo carrega e calcula a base selecionada em memória; é adequado à base informada, mas bases maiores precisarão de agregação e filtros no servidor, com migração revisada. Leituras de várias tabelas não constituem uma transação única; a base científica deve permanecer estável durante a consulta.

## Modelo científico e limitações

O artefato original `backend/modelos/gradient_boosting_c2_modelo_avaliado.joblib` foi inspecionado. O backend carrega uma única cópia por processo e verifica o SHA-256, o contrato das seis colunas, as categorias e as versões científicas: scikit-learn 1.9.1, pandas 3.0.6, numpy 2.5.3, scipy 1.18.1 e joblib 1.6.0. O pipeline preserva a imputação pela mediana, codificação one-hot e Gradient Boosting já ajustados. Não há treinamento, upload nem substituição automática do modelo.

Na tela do animal, informe a data do próximo controle e clique em **Gerar previsão**. A API autenticada retorna a estimativa em kg, as variáveis utilizadas, a origem do DEL e avisos de indisponibilidade. A previsão fica apenas na tela; não é adicionada aos gráficos científicos ou ao Supabase. As 189 previsões científicas permanecem intactas.

O endpoint `POST /api/previsoes/nova` recebe `animal_id` e `data_prova` (`AAAA-MM-DD`); aceita também `del` opcional não negativo, sem expor esse campo na interface inicial. Os campos extras são rejeitados. O backend consulta o animal e a propriedade e filtra os controles, partos e inícios de lactação por animal e data **estritamente anterior** ao alvo no PostgREST. Não consulta a produção ou o DEL do controle alvo.

As entradas, em ordem, são `propriedade`, `mes_controle`, `producao_anterior`, `producao_anterior_disponivel`, `del_harmonizado` e `del_disponivel`. O código CC é convertido para a categoria científica `Cerqueira César`, e UENP para `UENP`; outras categorias são recusadas. A produção anterior é a produção positiva do controle imediatamente anterior, sem buscar um controle mais antigo para preencher uma ausência. Um novo início de lactação conhecido após esse controle invalida a produção anterior. O DEL usa um início de lactação/parto anterior conhecido ou avança o DEL disponível no último controle pelo intervalo de dias, informando explicitamente a suposição de continuidade. Sem informação válida, o valor permanece ausente e seu indicador é zero; o pipeline aplica a imputação aprendida no treinamento. O mês é extraído da data solicitada.

O resultado identifica finalidade `aplicacao`, versão do artefato e `salva_no_banco: false`. Não há gravações, migrações ou geração automática para o rebanho. A extrapolação do DEL pressupõe que não houve nova lactação não registrada. A avaliação científica por animal não demonstra desempenho em controles futuros; a interface mantém essa limitação explícita.

Inspeção offline, a partir de `backend`:

```powershell
..\.venv\Scripts\python.exe -m app.ml.inspect_model .\modelos\gradient_boosting_c2_modelo_avaliado.joblib
```

Os testes incluem uma cópia das seis entradas históricas e saídas esperadas das 189 previsões científicas em `backend/tests/fixtures/scientific_predictions.json`, para conferir a inferência com tolerância absoluta de `1e-10` kg. A fixture é somente de teste e não alimenta a interface nem o banco.

Produção é sempre **kg por controle leiteiro periódico**; não equivale a litros/dia nem a total semanal/mensal. Os resultados informados do experimento (936 observações, 177 animais, treino 747, teste 189 controles/37 animais; MAE ≈ 3,685 kg, RMSE ≈ 5,075 kg, R² ≈ 0,749) são contexto científico fixo, separado dos indicadores consultados. A avaliação separou animais, não períodos. Essas métricas não validam novas previsões nem um eventual modelo retreinado com todos os dados. Desvios não estabelecem doença, causa nutricional ou urgência clínica.

## Verificação

```powershell
# Na raiz interna
npm.cmd run lint
npm.cmd run build
cd backend
..\.venv\Scripts\python.exe -m pytest -q
```

Verificados na integração de ML: 26 testes do backend aprovados, ESLint e build de produção aprovados. A regressão das 189 entradas históricas confere a saída real do pipeline com tolerância absoluta de `1e-10` kg. Em leitura direta do Supabase, as 189 saídas científicas foram reproduzidas com diferença máxima de **0,0 kg**; o hash do conteúdo da tabela de previsões permaneceu idêntico antes e depois da consulta e de uma previsão manual pela API. Nenhuma escrita foi executada.

O formulário foi testado no Edge com o pipeline real e histórico isolado: POST com token, animal e data; bloqueio durante carregamento; resultado em kg; informações ausentes e imputação; mudança de data/animal sem resultado antigo; erro e nova tentativa; layout em 375 e 1366 px. Sem exceções JavaScript. O cenário de navegador usa um servidor exclusivo de teste, sem conexão ao banco. Instruções reproduzíveis em [tests/ML_INTEGRATION.md](tests/ML_INTEGRATION.md).

A refatoração visual posterior foi verificada no Edge em 375, 768, 1366 e 1920 px: 52 cenários de navegação/layout com dados isolados, busca, filtro por propriedade, exportação CSV e espaço para navegação inferior; sem falhas ou exceções JavaScript nos cenários executados. Capturas de telas desktop/mobile também foram inspecionadas. A configuração e o escopo estão em [tests/VISUAL_REVIEW.md](tests/VISUAL_REVIEW.md).

A integração de ML verificou consultas reais à base remota e uma chamada manual ao endpoint com dados reais. O login interativo com conta real não foi automatizado: os testes de API e navegador isolam a sessão, enquanto testes separados verificam autenticação ausente/inválida e usuário sem autorização. Os arquivos `.env` foram preservados.

Pendências para funcionamento completo: preencher `backend/.env`, autorizar UUIDs, confirmar configuração pública e conta do Supabase, iniciar os dois processos e conferir os registros reais. Recuperação de senha e edição de perfil não estão implementadas; cadastro/edição/exclusão de animais estão indisponíveis. A inferência manual utiliza o artefato científico avaliado; mantenha o arquivo original e as versões fixadas.

## Arquivos da adaptação

Criados: `.env.example`; `backend/.env.example`, `backend/requirements.txt`, `backend/app/__init__.py`, `backend/app/main.py`, `backend/app/config.py`, `backend/app/routers/api.py`, `backend/app/schemas/records.py`, `backend/app/services/{auth,database,analytics}.py`, `backend/app/ml/{service,inspect_model}.py`, `backend/tests/test_api.py`; `src/services/api.js`, `src/hooks/useApi.js`, `src/components/DataView.jsx` e `src/utils/dataFormat.js`.

Modificados: `README.md`, `.gitignore`, `src/hooks/useAppController.js`, `src/lib/supabaseClient.js`, `src/components/AppShell.jsx`, `src/index.css`, telas `Home`, `Cows`, `CowDetails`, `Alerts`, `Urgent`, `WeeklyData`, `Reports`, `Login` e `Signup`; `.env` local recebeu somente a URL da API se ausente. Removido `src/domain/cowRules.js`, que continha animais e estados fictícios. Componentes antigos `Register.jsx` e `Profile.jsx` permanecem no disco, sem rotas ou importações na aplicação, para preservar a referência visual; não executam gravações locais. O perfil ativo permite consultar email e sair.
