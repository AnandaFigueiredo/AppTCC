# Verificação da previsão manual

O teste de backend usa o `.joblib` original e as 189 entradas científicas em `backend/tests/fixtures/scientific_predictions.json`. Não há treinamento, banco de teste remoto ou escrita no Supabase.

Na raiz do aplicativo:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
npm.cmd run lint
npm.cmd run build
cd backend
..\.venv\Scripts\python.exe -m pytest -q
```

Resultado verificado: 26 testes aprovados; ESLint e build aprovados. A consulta de leitura ao banco real também reproduziu as 189 previsões com diferença máxima de 0,0 kg. O conteúdo integral da tabela de previsões foi comparado antes/depois e permaneceu inalterado. O endpoint manual respondeu com histórico real e `salva_no_banco: false`.

## Navegador com inferência real e histórico isolado

Em terminais separados, na raiz (portas 5173, 8011 e 9226 livres):

```powershell
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

```powershell
.\.venv\Scripts\python.exe tests\manual_prediction_server.py
```

```powershell
$mlProfile = Join-Path $env:TEMP 'sertech-ml-edge'
Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -WindowStyle Hidden -ArgumentList '--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9226',"--user-data-dir=$mlProfile",'about:blank'
node tests\manual-prediction.mjs
```

O servidor `manual_prediction_server.py` é exclusivamente de teste: usa autorização simulada, histórico sintético e o modelo real, escutando somente em loopback. Não o utilize como servidor da aplicação. A aplicação normal continua usando `app.main:app` e a autenticação real.

O teste do navegador mantém a configuração pública já existente; substitui somente a sessão no processo de teste e direciona as chamadas para o servidor isolado. Não precisa de credenciais reais. Confere envio autenticado, data e animal, bloqueio de duplicatas durante carregamento, resultado, ausência de variáveis, erro e repetição, limpeza do resultado ao mudar a data/animal e layout em 375/1366 px. Capturas ficam na pasta temporária `sertech-manual-prediction`. Encerre os servidores e o Edge de teste ao concluir.

O teste não automatiza login interativo com uma conta real. As métricas científicas por animal não validam a extrapolação para controles futuros. A interface informa essa limitação e a hipótese de continuidade quando o DEL é extrapolado do controle anterior.
