const {chromium,firefox,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TEST_BASE_URL||'http://localhost:8000';
const engine=process.env.QA_ENGINE||'chrome';
const out=process.env.TEST_OUTPUT_DIR||`.test-results/search-${engine}`;
fs.mkdirSync(out,{recursive:true});
const report={engine,checks:[],errors:[]};
const check=name=>{report.checks.push(name);console.log('PASS',name)};
async function ready(page){await page.goto(base+'/red-ecp/');await page.waitForSelector('#detail h2')}
async function complete(page){await page.waitForSelector('#page-results[aria-busy="false"]')}
async function noOverflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))}
(async()=>{
  let browser;
  try{
    browser=await (engine==='firefox'?firefox:engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chrome'?{channel:'chrome'}:engine==='edge'?{channel:'msedge'}:{})});
    const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
    page.on('pageerror',error=>report.errors.push(error.message));
    await ready(page);
    await page.fill('#search','permeable');await complete(page);
    assert.equal(await page.locator('#results-list [data-node]').count(),2);
    assert.equal(await page.locator('#page-results [data-search-page]').count(),4);
    assert.equal(await page.locator('#results-list .search-result').first().getAttribute('data-node'),'eco-desempeno-pavimentos-permeables');
    assert((await page.locator('#results-list mark').count())>=2);
    await page.screenshot({path:out+'/keyword-desktop.png',fullPage:true});
    await page.click('#results-list [data-node="eco-desempeno-pavimentos-permeables"]');
    assert(page.url().endsWith('#concepto=eco-desempeno-pavimentos-permeables'));
    assert.equal(await page.locator('#detail h2').innerText(),'Pavimentos permeables');
    assert.equal(await page.locator('#detail h2 mark').innerText(),'permeable');
    assert(await page.locator('#detail h2').evaluate(el=>document.activeElement===el));
    await page.click('#back-to-results');await complete(page);
    assert.equal(await page.locator('#search').inputValue(),'permeable');
    check('Término parcial, resultados ordenados, salto al concepto, resaltado y regreso a resultados');

    await page.click('[data-search-page="47"]');await page.waitForSelector('#source-text mark');
    assert.equal(await page.locator('#source-page').inputValue(),'47');
    assert((await page.locator('.source-toolbar a').getAttribute('href')).endsWith('#page=50'));
    assert((await page.locator('#source-text mark').first().innerText()).toLowerCase().includes('permeable'));
    await page.keyboard.press('Escape');
    await page.fill('#search','plantas bajas transparentes');await complete(page);
    assert.equal(await page.locator('#results-list [data-node]').count(),0);
    assert.equal(await page.locator('[data-search-page="24"]').count(),1);
    check('Coincidencias exclusivas del texto original, página correcta y resaltado en el lector');

    await page.fill('#search','ISÓCRONAS');await complete(page);
    const withAccents=await page.locator('#results-list').innerText();
    await page.fill('#search','isocronas');await complete(page);
    assert.equal(await page.locator('#results-list').innerText(),withAccents);
    await page.fill('#search','suelo permeable');await complete(page);
    assert.equal(await page.locator('[data-search-page="25"]').count(),1);
    await page.fill('#search','zzzzsincoincidencia');await complete(page);
    assert((await page.locator('#results-list').innerText()).includes('No hay coincidencias'));
    await page.fill('#search','"><img src=x onerror=alert(1)>');await complete(page);
    assert.equal(await page.locator('#search-results img').count(),0);
    await page.click('#clear-search');assert(await page.locator('#lesson').isVisible());
    check('Mayúsculas y tildes, varias palabras, consulta inexistente, HTML seguro y cierre');

    await page.setViewportSize({width:360,height:800});await ready(page);
    assert.equal(await page.locator('#toggle-index').getAttribute('aria-expanded'),'false');
    assert(await page.locator('#search').isVisible());
    assert((await page.locator('#search').boundingBox()).y<800);
    await page.fill('#search','permeable');await page.press('#search','Enter');await complete(page);
    await noOverflow(page);
    await page.screenshot({path:out+'/keyword-mobile.png',fullPage:true});
    await page.locator('#results-list [data-node]').first().focus();await page.keyboard.press('Enter');
    assert(await page.locator('#detail h2').evaluate(el=>document.activeElement===el&&el.getBoundingClientRect().top>=0&&el.getBoundingClientRect().top<innerHeight));
    await page.click('#back-to-results');await page.evaluate(()=>document.documentElement.style.fontSize='32px');await noOverflow(page);
    await page.evaluate(()=>document.documentElement.style.fontSize='');
    check('Buscador visible con menú cerrado, teclado, móvil 360 px y texto al 200 %');

    const slow=await context.newPage();let release;const gate=new Promise(resolve=>{release=resolve});
    await slow.route('**/data/guia-paginas.json',async route=>{await gate;await route.continue()});
    await ready(slow);await slow.fill('#search','permeable');
    await slow.click('#results-list [data-node="eco-desempeno-pavimentos-permeables"]');release();
    await slow.waitForResponse(response=>response.url().includes('guia-paginas.json'));
    assert(await slow.locator('#lesson').isVisible());assert(await slow.locator('#search-results').isHidden());
    await slow.click('#back-to-results');await complete(slow);await slow.close();
    check('Una respuesta tardía de búsqueda no reemplaza el concepto seleccionado');

    const retry=await context.newPage();let fail=true;
    await retry.route('**/data/guia-paginas.json',route=>fail?route.fulfill({status:503,body:'Unavailable'}):route.continue());
    await ready(retry);await retry.fill('#search','permeable');await retry.waitForSelector('#retry-search');
    assert.equal(await retry.locator('#results-list [data-node]').count(),2);
    fail=false;await retry.click('#retry-search');await complete(retry);
    assert.equal(await retry.locator('#page-results [data-search-page]').count(),4);
    await retry.close();check('Si falla la Guía, los conceptos siguen disponibles y la lectura se puede reintentar');
    assert.equal(await page.evaluate(()=>localStorage.length),0);
    assert.deepEqual(report.errors,[]);check('Sin errores de JavaScript ni cambios en el almacenamiento del piloto');
    await context.close();
  }catch(error){report.failure=error.stack;console.error(error.stack);process.exitCode=1}
  finally{await browser?.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2))}
})();
