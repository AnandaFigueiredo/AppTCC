import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const output = join(tmpdir(), 'sertech-manual-prediction');
await mkdir(output, {recursive:true});
const target = await (await fetch('http://127.0.0.1:9226/json/new?http://localhost:5173', {method:'PUT'})).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let id=0; const pending=new Map(), errors=[];
socket.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(100);}throw Error('Timed out: '+expression);}
function check(condition,description){if(!condition)throw Error(description); console.log('PASS',description);}
await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:'http://localhost:5173'});await pause(1500);
await evaluate(`(async()=>{
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {default:Manual}=await import('/src/components/ManualPrediction.jsx');
 const {useApi}=await import('/src/hooks/useApi.js');
 const {supabase}=await import('/src/lib/supabaseClient.js');
 supabase.auth.getSession=async()=>({data:{session:{access_token:'isolated-browser-session'}}});
 const original=window.fetch;window.__calls=[];
 window.fetch=async(input,init)=>{
  const u=new URL(typeof input==='string'?input:input.url,location.href);
  if(!u.pathname.startsWith('/api/'))return original(input,init);
  if(u.pathname==='/api/previsoes/nova'){
   window.__calls.push({body:JSON.parse(init.body),authorization:init.headers.Authorization,method:init.method});
   if(window.__fail){init={...init,body:JSON.stringify({...JSON.parse(init.body),animal_id:999})};window.__fail=false;}
   await new Promise(r=>setTimeout(r,250));
  }
  return original('http://localhost:8011'+u.pathname+u.search,init);
 };
 const mount=document.createElement('main');mount.className='page-content';document.body.replaceChildren(mount);
 function Review(){const [animal,setAnimal]=React.useState(1);window.__animal=setAnimal;const model=useApi('/modelo');return React.createElement(Manual,{key:animal,animalId:animal,model});}
 ReactDOM.createRoot(mount).render(React.createElement(Review));
 window.__setDate=value=>{const e=document.querySelector('input[type=date]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
})()`);
await until(`document.querySelector('button[type=submit]')!==null`);
check(await evaluate(`document.querySelector('button[type=submit]').disabled`),'empty date disabled');
await evaluate(`window.__setDate('2026-02-10')`);
await until(`!document.querySelector('button[type=submit]').disabled`);
await evaluate(`document.querySelector('button[type=submit]').click()`);
await until(`document.querySelector('form').getAttribute('aria-busy')==='true'`);
check(await evaluate(`document.querySelector('button[type=submit]').disabled`),'loading prevents duplicate submit');
await until(`document.body.textContent.includes('Produção estimada em')`);
check(await evaluate(`document.body.textContent.includes('kg')&&document.body.textContent.includes('não foi salva')&&document.body.textContent.includes('continuidade')`),'real model result, units, no-save and DEL assumption shown');
const calls=await evaluate(`window.__calls`);
check(calls[0].method==='POST'&&calls[0].authorization==='Bearer isolated-browser-session'&&calls[0].body.animal_id===1&&calls[0].body.data_prova==='2026-02-10','authenticated POST has selected animal and date');
for(const width of [375,1366]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:false});
 await pause(150);
 check(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'no overflow '+width);
 const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,'manual-'+width+'.png'),Buffer.from(data,'base64'));
}
await evaluate(`window.__setDate('2026-03-10')`);
await until(`!document.body.textContent.includes('Produção estimada em')`);
check(true,'changing date clears stale prediction');
await evaluate(`window.__fail=true;document.querySelector('button[type=submit]').click()`);
await until(`document.querySelector('[role=alert]')!==null`);
check(await evaluate(`document.querySelector('[role=alert]').textContent.includes('Animal não encontrado')`),'API error displayed');
await evaluate(`document.querySelector('button[type=submit]').click()`);
await until(`document.body.textContent.includes('Produção estimada em')`);
check(true,'retry recovers');
await evaluate(`window.__animal(2)`);
await until(`document.querySelector('input[type=date]').value===''`);
check(await evaluate(`!document.body.textContent.includes('Produção estimada em')`),'animal switch clears result');
await evaluate(`window.__setDate('2026-02-10')`);
await until(`!document.querySelector('button[type=submit]').disabled`);
await evaluate(`document.querySelector('button[type=submit]').click()`);
await until(`document.body.textContent.includes('Produção estimada em')`);
check(await evaluate(`document.body.textContent.includes('Produção anterior indisponível')&&document.body.textContent.includes('DEL indisponível')`),'missing history uses real fitted imputation and displays warnings');
check(errors.length===0,'no JavaScript exceptions');
console.log('Screenshots:',output);
await send('Page.close');socket.close();
