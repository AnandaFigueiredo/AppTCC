# Revisão visual do frontend

Refatoração restrita à apresentação. Backend, contratos HTTP, autenticação, arquivos `.env`, banco e modelo não foram modificados.

## Componentes

- `src/components/UI.jsx`: ícones SVG, cabeçalhos de página e seção, indicadores e filtro de propriedade.
- `src/components/DataView.jsx`: tabelas no desktop e cards no mobile, estados vazios/carregamento/erro e gráficos ajustados por ResizeObserver.
- `src/utils/presentation.js`: identificação dos animais e propriedades a partir da própria resposta da API, colunas do acompanhamento e legendas dos gráficos.

Telas modificadas: AppShell, Home, Cows, CowDetails, Alerts, Reports e WeeklyData; estilos centralizados em `src/index.css`. Urgent mantém o redirecionamento existente ao acompanhamento. O histórico agora apresenta as previsões associadas sem remover o controle real ou seus campos. Havendo mais de uma previsão por controle, todas aparecem na tabela e a primeira é usada no gráfico, com essa limitação indicada no texto.

## Validação visual isolada

`visual-check.mjs` usa o protocolo de depuração do Edge via WebSocket, sem dependências adicionais. Requer Node com WebSocket nativo (testado com Node 24), Vite em `127.0.0.1:5173` e Edge com depuração em `9225`.

```powershell
# Terminal 1, raiz do projeto:
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort

# Terminal 2:
$reviewProfile = Join-Path $env:TEMP 'sertech-visual-review'
Start-Process -FilePath 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9225',('--user-data-dir=' + $reviewProfile),'about:blank')
node tests/visual-check.mjs
```

O teste monta o AppShell em uma sessão isolada do navegador e intercepta as consultas com fixtures identificadas como teste visual. Nenhum fixture é usado pela aplicação normal, gravado no banco ou incluído no build de produção. O teste usa a configuração pública já existente e substitui somente a sessão em memória; não lê ou altera credenciais privadas. Resultados e capturas ficam em `%TEMP%\sertech-visual-results`.

São verificadas as larguras 375, 768, 1366 e 1920 px, as oito rotas de apresentação, todos os tipos de relatório e o gráfico do histórico com animal selecionado. São conferidos o limite horizontal da página e dos gráficos, os estados de busca sem resultados, o filtro por propriedade, a ação de exportar CSV, a ausência de exceções JavaScript e o espaço reservado para a navegação inferior. Capturas de dashboard, detalhes, relatórios e gráfico móvel permitem inspeção visual.

Os fixtures cobrem identificador longo, campos ausentes, ausência de registros complementares e desvios negativos. Esta revisão não valida os dados remotos, o login real ou diferenças específicas de Safari/Firefox. Tabelas com muitas colunas mantêm rolagem dentro da própria tabela no desktop; até 800 px são substituídas por cards com todos os campos. No celular, a navegação usa áreas seguras e o conteúdo reserva espaço ao final da página.
