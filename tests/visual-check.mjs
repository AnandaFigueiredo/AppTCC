// Isolated visual review. Fixtures exist only in this browser session, never in the app/API.
// Start Vite on port 5173 and a headless Edge with --remote-debugging-port=9225.
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = 'http://127.0.0.1:5173';
const output = join(tmpdir(), 'sertech-visual-results');
await mkdir(output, { recursive: true });
const target = await (await fetch(`http://127.0.0.1:9225/json/new?${origin}`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(Error(message.error.message)); else resolve(message.result);
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const call = ++id;
    pending.set(call, { resolve, reject });
    socket.send(JSON.stringify({ id: call, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: origin });
await pause(1200);
await evaluate(`(async () => {
  const {default: React} = await import('/node_modules/.vite/deps/react.js');
  const {default: ReactDOM} = await import('/node_modules/.vite/deps/react-dom_client.js');
  const {default: AppShell} = await import('/src/components/AppShell.jsx');
  const {supabase} = await import('/src/lib/supabaseClient.js');
  if (!supabase) throw Error('A configuração pública já existente é necessária para este teste.');
  supabase.auth.getSession = async () => ({data:{session:{access_token:'isolated-visual-session'}}});
  const properties = [{id:1,nome:'Propriedade de teste visual A'},{id:2,nome:'Propriedade de teste visual B'}];
  const animals = [{id:1,id_animal_global:'VISUAL_IDENTIFICADOR-LONGO-001',nome:'Animal isolado A',propriedade:properties[0],raca:{nome:'Raça de teste'},data_nascimento:'2020-02-12'}, {id:2,id_animal_global:'VISUAL_002',nome:null,propriedade:properties[1],raca:null}];
  const controls = Array.from({length:7}, (_,i)=>({id:i+1,animal_id:1,data_prova:'2026-'+String(i+1).padStart(2,'0')+'-12',kg_leite:20+i,producao_anterior:i?19+i:null,producao_anterior_disponivel:i>0,del_harmonizado:100+i*30,del_disponivel:true,variacao_kg:i?1:null}));
  const predictions = controls.map((c,i)=>({...c,id:i+20,controle_id:c.id,kg_previsto:c.kg_leite+4,desvio_kg:-4,desvio_absoluto_kg:4,desvio_percentual:-4/(c.kg_leite+4)*100,finalidade:'teste',versao_modelo:'isolated-visual-model'}));
  const weights = [{id:1,data_pesagem:'2026-01-12',peso_kg:450},{id:2,data_pesagem:'2026-04-12',peso_kg:470}];
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/')) return originalFetch(input,init);
    const q=url.searchParams;
    let selected=animals.filter(a=>(!q.get('propriedade_id')||String(a.propriedade.id)===q.get('propriedade_id'))&&(!q.get('animal_id')||String(a.id)===q.get('animal_id')));
    const search=(q.get('busca')||'').toLowerCase();if(search)selected=selected.filter(a=>a.id_animal_global.toLowerCase().includes(search));
    const ids=new Set(selected.map(a=>a.id));
    const cs=controls.filter(c=>ids.has(c.animal_id)&&(!q.get('inicio')||c.data_prova>=q.get('inicio'))&&(!q.get('fim')||c.data_prova<=q.get('fim')));
    const ps=predictions.filter(p=>cs.some(c=>c.id===p.controle_id)&&(!q.get('finalidade')||p.finalidade===q.get('finalidade')));
    const data={animais:selected,controles:cs,previsoes:ps,pesagens:ids.has(1)?weights:[],partos:[],lactacoes:[],diagnosticos:[],indicadores:{animais:selected.length,propriedades:new Set(selected.map(a=>a.propriedade.id)).size,controles:cs.length,controles_com_previsao:ps.length,pesagens:ids.has(1)?2:0,animais_com_previsao:ps.length?1:0,media_kg:cs.length?cs.reduce((s,c)=>s+c.kg_leite,0)/cs.length:null,inicio:cs[0]?.data_prova,fim:cs.at(-1)?.data_prova,distribuicao:properties.map(p=>({...p,animais:selected.filter(a=>a.propriedade.id===p.id).length,controles:p.id===1?cs.length:0,media_kg:p.id===1&&cs.length?23:null}))}};
    let body=data;
    if(url.pathname==='/api/propriedades')body=properties;
    if(url.pathname==='/api/animais')body={items:selected,total:selected.length};
    if(url.pathname.startsWith('/api/animais/'))body={...data,animais:[animals[0]]};
    if(url.pathname==='/api/modelo')body={disponivel:false,motivo:'Modelo indisponível neste cenário isolado de teste visual.'};
    return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const mount=document.createElement('div');mount.id='visual-review-root';document.body.replaceChildren(mount);
  function Review(){
    const [view,setView]=React.useState('home');
    const [animal,setAnimal]=React.useState(1);
    window.__show=setView;
    return React.createElement(AppShell,{activeView:view,setView,user:{email:'visual-test@example.invalid'},selectedCow:animal,openCowDetails:id=>{setAnimal(id);setView('cowDetails');},handleLogout:()=>{},authError:''});
  }
  ReactDOM.createRoot(mount).render(React.createElement(Review));
})()`);
await pause(500);
const results = [];
for (const width of [375, 768, 1366, 1920]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 960, deviceScaleFactor: 1, mobile: false });
  for (const view of ['home', 'cows', 'cowDetails', 'alerts', 'weekly', 'reports', 'profile', 'urgent']) {
    await evaluate(`window.__show('${view}')`);
    await pause(200);
    const layout = await evaluate(`(() => ({
      width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
      charts:[...document.querySelectorAll('.chart-container')].every(e=>e.getBoundingClientRect().right<=innerWidth+1&&e.scrollWidth<=e.clientWidth+1),
      headings:document.querySelector('h1')?.textContent,
      tables:[...document.querySelectorAll('.table-container')].every(e=>getComputedStyle(e).display==='none'||(e.getBoundingClientRect().right<=innerWidth+1&&e.clientWidth>0)),
      mobileCards:document.querySelector('.mobile-records')?getComputedStyle(document.querySelector('.mobile-records')).display:null,
      pageErrors:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent)
    }))()`);
    const pass = layout.scrollWidth <= width && layout.charts && layout.tables && layout.pageErrors.length === 0;
    results.push({ width, view, pass, ...layout });
    if ([375,1366].includes(width) && ['home','cowDetails','reports'].includes(view)) {
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(join(output, `${view}-${width}.png`), Buffer.from(data, 'base64'));
    }
    if (view === 'weekly') {
      await evaluate(`(() => {const e=document.querySelectorAll('select')[1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'1');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await pause(200);
      const historyChart = await evaluate(`document.querySelector('.chart-container svg')!==null && document.documentElement.scrollWidth<=innerWidth`);
      results.push({width,view:'weekly-selected-animal',pass:historyChart});
      if (width === 375) {
        await evaluate(`document.querySelector('.chart-panel').scrollIntoView({block:'start'})`);
        const {data} = await send('Page.captureScreenshot', {format:'png'});
        await writeFile(join(output,'history-chart-375.png'),Buffer.from(data,'base64'));
      }
    }
    if (view === 'reports') {
      for(const kind of ['controles','previsoes','desvios','propriedades']) {
        await evaluate(`(() => {const e=[...document.querySelectorAll('select')].at(-1);Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'${kind}');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        await pause(100);
        const reportLayout = await evaluate(`document.documentElement.scrollWidth<=innerWidth && document.querySelectorAll('.data-table tbody tr').length>0`);
        results.push({width,view:'report-'+kind,pass:reportLayout});
      }
    }
  }
}
// Exercise the existing filters and CSV action at mobile width.
await evaluate(`window.__show('cows')`); await pause(200);
await evaluate(`(() => {const e=document.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'SEM_RESULTADO');e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(250);
const searchPassed = await evaluate(`document.querySelector('.empty-state')?.textContent.includes('Sem registros')`);
await evaluate(`window.__show('home')`); await pause(200);
await evaluate(`(() => {const e=document.querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'2');e.dispatchEvent(new Event('change',{bubbles:true}));})()`); await pause(250);
const filterPassed = await evaluate(`document.querySelector('.empty-state')?.textContent.includes('Sem registros')`);
await evaluate(`window.__show('reports')`); await pause(200);
await evaluate(`window.__csvCaptured=false;HTMLAnchorElement.prototype.click=function(){window.__csvCaptured=this.download.startsWith('sertech-')};[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Exportar CSV')).click()`);
const csvPassed = await evaluate('window.__csvCaptured');
await send('Emulation.setDeviceMetricsOverride',{width:375,height:960,deviceScaleFactor:1,mobile:false});
await evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await pause(100);
const safeFooterPassed = await evaluate(`document.querySelector('.page-footer').getBoundingClientRect().bottom <= document.querySelector('.bottom-navigation').getBoundingClientRect().top`);
const report = { results, searchPassed, filterPassed, csvPassed, safeFooterPassed, errors };
await writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ scenarios:results.length, failed:results.filter(r=>!r.pass), searchPassed, filterPassed, csvPassed, safeFooterPassed, errors, output }, null, 2));
await send('Page.close'); socket.close();
if(results.some(r=>!r.pass)||!searchPassed||!filterPassed||!csvPassed||!safeFooterPassed||errors.length) process.exitCode=1;
