const {chromium,firefox,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TEST_BASE_URL||'http://localhost:8000';
const engine=process.env.QA_ENGINE||'chrome'; const out='.test-results/'+engine;fs.mkdirSync(out,{recursive:true});const report={checks:[],errors:[],requests:[]};
const check=(name)=>{report.checks.push(name);console.log('PASS',name)};
const readRecords=p=>p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith(':records')))).records);
async function ready(p,url){p.on('pageerror',e=>report.errors.push(e.stack));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))report.requests.push(r.url()+': '+r.status())});await p.goto(base+url);await p.waitForFunction(()=>document.querySelector('#metrics')?.innerText.includes('%')||document.querySelector('#capture-variable')||document.querySelector('.concept-card'));}
async function syncFlow(browser,fallback=false){const ctx=await browser.newContext({viewport:{width:1440,height:1000}});if(fallback)await ctx.addInitScript(()=>{window.BroadcastChannel=undefined});const gadm=await ctx.newPage(),mit=await ctx.newPage();await ready(gadm,'/plataforma/?role=gadm&canton=ibarra');await ready(mit,'/plataforma/?role=mit');await mit.selectOption('#filter-canton','ibarra');await gadm.selectOption('#capture-variable','v-ancho-acera');await gadm.click('#start-record');await gadm.fill('#r-valor','2.15');await gadm.fill('#r-periodo','2026-09-24');await gadm.fill('#r-sector','Sector prueba automatizada');await gadm.fill('#r-fuente','Fuente ficticia de QA');await gadm.fill('#r-responsable','Equipo de prueba');await gadm.fill('#r-evidencia','QA-001');await gadm.fill('#r-metodo','Medición ficticia con cinta, tramo de ensayo; solo demostración.');await gadm.fill('#r-lat','0.351');await gadm.fill('#r-lng','-78.122');await gadm.click('button[value="enviado"]');await gadm.waitForSelector('#modal',{state:'hidden'});await mit.waitForFunction(()=>document.querySelector('#record-table')?.textContent.includes('2.15'));const record=(await readRecords(gadm)).find(r=>r.sector==='Sector prueba automatizada');assert(record);assert.equal(record.estado,'enviado');check((fallback?'storage fallback':'BroadcastChannel')+' · creación visible en MIT sin recargar');
await gadm.click(`[data-open-record="${record.id}"]`);await gadm.click('#edit-record');await gadm.fill('#r-valor','2.65');await gadm.click('button[value="enviado"]');await gadm.waitForSelector('#modal',{state:'hidden'});await mit.waitForFunction(()=>document.querySelector('#record-table')?.textContent.includes('2.65'));assert.equal((await readRecords(mit)).find(r=>r.id===record.id).valor,2.65);check('Edición GADM → MIT inmediata '+(fallback?'storage':'BroadcastChannel'));
await mit.click(`[data-open-record="${record.id}"]`);await mit.click('#validate-record');await mit.waitForSelector('#modal',{state:'hidden'});await gadm.waitForFunction(id=>{const d=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith(':records'))));return d.records.find(r=>r.id===id).estado==='validado'},record.id);check('Validación MIT reflejada en GADM');
if(!fallback){await mit.screenshot({path:out+'/mit-desktop.png',fullPage:true});await gadm.screenshot({path:out+'/gadm-desktop.png',fullPage:true});
// Historical snapshot and conflict protection are checked against real storage service.
await gadm.evaluate(async id=>{const m=await import('../shared/storage.js');const c=await m.loadBase();const r=m.readData().records.find(r=>r.id===id);await m.upsert({...r,valor:2.8,estado:'borrador'},c,'QA',r.revision);try{await m.upsert({...r,valor:9},c,'QA',r.revision);throw new Error('CONFLICT_NOT_REJECTED')}catch(e){if(!e.message.includes('otra ventana'))throw e}},record.id);check('Revisión obsoleta rechazada sin perder la versión nueva');
await gadm.evaluate(async()=>{const m=await import('../shared/storage.js');const c=await m.loadBase();const d=await m.loadDemo();const x=await m.importRecords(d.records,c,'QA');if(x.duplicados!==62||x.aceptados!==0)throw new Error('Incorrect duplicate handling')});check('Importación repetida omite 62 duplicados');
await gadm.click('[data-tab="reference"]');await gadm.selectOption('#ref-mode','pending');await gadm.fill('#ref-search','confort térmico percibido');assert(await gadm.locator('[data-capture]').first().isDisabled());check('Metodología pendiente no permite captura');
await gadm.setViewportSize({width:390,height:844});await mit.setViewportSize({width:390,height:844});await gadm.click('[data-tab="capture"]');await gadm.waitForTimeout(150);await gadm.screenshot({path:out+'/gadm-mobile.png',fullPage:true});await mit.screenshot({path:out+'/mit-mobile.png',fullPage:true});for(const [name,p] of [['GADM',gadm],['MIT',mit]]){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');check(name+' móvil 390 px sin scroll horizontal')}
await gadm.selectOption('#capture-variable','v-barreras');await gadm.click('#start-record');await gadm.fill('#r-valor','<img src=x onerror="window.XSS=1">');await gadm.fill('#r-sector','XSS prueba');await gadm.fill('#r-fuente','QA');await gadm.fill('#r-responsable','QA');await gadm.click('button[value="borrador"]');await gadm.waitForSelector('#modal',{state:'hidden'});assert.equal(await gadm.evaluate(()=>window.XSS),undefined);assert((await gadm.locator('#record-table').innerText()).includes('<img'));check('Texto con HTML se muestra escapado');
await gadm.click('[data-tab="history"]');assert((await gadm.locator('#view').innerText()).includes('Crear registro'));check('Bitácora incluye autor, acción e historial');
await gadm.evaluate(async()=>{const m=await import('../shared/storage.js');await m.resetDemo(await m.loadDemo(),'QA')});await mit.waitForFunction(()=>document.querySelector('#record-table')?.textContent.includes('24'));check('Restablecimiento demo entre ventanas');}
await ctx.close()}
async function networkFlow(browser){
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage(),networkRequests=[];
 p.on('request',r=>networkRequests.push(r.url()));
 await ready(p,'/red-ecp/');
 assert((await p.locator('h1').innerText()).includes('Comprender el cambio de paradigma'));
 assert(!networkRequests.some(u=>u.includes('ecp-variables')||u.includes('demo-data')));
 assert(!/TdR|medible|Estado de medición|Agregar nodo/.test(await p.locator('body').innerText()));
 assert.equal(await p.evaluate(()=>localStorage.length),0);
 check('Red: fuente exclusiva Guía, sin clasificación ni almacenamiento del piloto');
 for(const id of ['sentido','uso-guia','contexto','claves','enfoques','epe','aplicacion','ciclo','mecanismos','glosario']){
   await p.click(`#section-nav [data-node="${id}"]`);
   assert.equal(await p.locator(`#section-nav [data-node="${id}"]`).getAttribute('aria-current'),'true');
   assert((await p.locator('#detail').innerText()).includes('Fuente documental'));
 }
 await p.click('#section-nav [data-node="claves"]');assert.equal(await p.locator('#concept-list .concept-card').count(),4);
 await p.click('#section-nav [data-node="enfoques"]');assert.equal(await p.locator('#concept-list .concept-card').count(),6);
 await p.click('#section-nav [data-node="ciclo"]');assert.equal(await p.locator('#concept-list .concept-card').count(),5);
 await p.click('#concept-list [data-node="fase5"]');assert((await p.locator('#detail').innerText()).includes('retroaliment'));
 await p.click('[data-relation="retroalimentacion-ciclo"]');assert((await p.locator('#reader-dialog').innerText()).includes('planificación'));await p.click('[data-close]');
 check('Diez temas; cuatro claves, seis enfoques, cinco fases y retroalimentación documental');
 await p.fill('#search','simultaneidad');await p.click('#results-list [data-node="simultaneidad"]');
 assert((await p.locator('#detail').innerText()).includes('concurren las cuatro'));
 await p.click('#detail .read-source');await p.waitForSelector('#source-text');assert((await p.locator('#source-text').innerText()).includes('PRINCIPIO DE SIMULTANEIDAD'));
 assert((await p.locator('.source-toolbar a').getAttribute('href')).endsWith('#page=56'));
 await p.click('#source-next');assert.equal(await p.locator('#source-page').inputValue(),'54');await p.click('#source-prev');
 await p.selectOption('#source-page','104');assert((await p.locator('#source-text').innerText()).includes('WalkScore'));
 await p.keyboard.press('Escape');
 check('Búsqueda y lectura de páginas originales, paginación impresa/PDF y navegación del lector');
 await p.fill('#search','Isócronas');assert((await p.locator('#results-list').innerText()).includes('Isócronas'));
 await p.fill('#search','zzzzsincoincidencia');assert((await p.locator('#results-list').innerText()).includes('No hay coincidencias'));await p.click('#clear-search');
 await p.click('#section-nav [data-node="claves"]');await p.click('#concept-list [data-node="k3"]');await p.reload();await p.waitForSelector('#detail h2');assert.equal(await p.locator('#detail h2').innerText(),'Crecimiento justo');
 await p.click('#section-nav [data-node="enfoques"]');await p.goBack();assert.equal(await p.locator('#detail h2').innerText(),'Crecimiento justo');
 await p.click('#overview');assert.equal(await p.locator('#concept-list .concept-card').count(),10);
 await p.click('#zoom-in');await p.click('#zoom-out');await p.click('#fit');
 check('Glosario, búsqueda vacía, enlaces a conceptos, recarga y botón Atrás');
 await p.click('#section-nav [data-node="enfoques"]');await p.screenshot({path:out+'/network-desktop.png',fullPage:true});
 await p.setViewportSize({width:360,height:800});await p.click('#toggle-index');await p.click('#section-nav [data-node="epe"]');assert.equal(await p.locator('#toggle-index').getAttribute('aria-expanded'),'false');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:out+'/network-mobile.png',fullPage:true});
 await p.click('#detail .read-source');await p.waitForSelector('#source-text');assert(await p.locator('#reader-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await p.keyboard.press('Escape');
 await p.evaluate(()=>document.documentElement.style.fontSize='32px');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 check('Red móvil 360 px, menú, lectura y texto aumentado al 200% sin desbordamiento');
 await p.goto(base+'/plataforma/');await p.waitForSelector('#login-gadm');assert.equal(await p.locator('h1').innerText(),'Plataforma piloto GADM / MIT');assert(!/Una mirada compartida|Registrar y comprender/.test(await p.locator('body').innerText()));
 await p.screenshot({path:out+'/login-mobile.png',fullPage:true});
 check('Plataforma con encabezados funcionales y sin frases promocionales');
 await ctx.close();
}

(async()=>{let browser;try{browser=await (engine==='firefox'?firefox:engine==='webkit'?webkit:chromium).launch({...(engine==='chrome'?{channel:'chrome'}:engine==='edge'?{channel:'msedge'}:{}),headless:true});report.engine=engine;report.version=browser.version();await syncFlow(browser);await syncFlow(browser,true);await networkFlow(browser);assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);check('Consola sin errores y recursos locales sin 404');}catch(e){report.failure=e.stack;console.error(e.stack);process.exitCode=1}finally{await browser?.close();fs.writeFileSync(out+'/e2e-report.json',JSON.stringify(report,null,2))}})();
