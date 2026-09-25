import {LearningNetwork} from './graph.js';
import {createSearchIndex,findMatches,highlightMatches,searchTerms} from './search.js?v=5';

const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pagesLabel=pages=>`Guía ${pages.length===1?'p.':'pp.'} ${pages.join(', ')}`;
const typeLabel={sistema:'Estrategia',grupo:'Tema',clave:'Clave de implementación',eje:'Enfoque',fase:'Fase del ciclo de vida',principio:'Principio',criterio:'Criterio',instrumento:'Instrumento',producto:'Producto',actor:'Actor',dimension:'Dimensión',mecanismo:'Mecanismo',tipologia:'Tipología',referencia:'Referencia',orientacion:'Orientación',habilitante:'Condición habilitante',concepto:'Concepto'};
let catalog,byId,network,current='sentido',section='sentido',pageTexts,pageRequest,searchIndex,searchRevision=0,selectedQuery='';
const children=id=>catalog.nodes.filter(n=>n.parentId===id);
const sectionInfo=id=>catalog.sections.find(s=>s.id===id);
const pdfUrl=page=>`${catalog.fuente.url}#page=${Number(page)+3}`;

function dialog(title,html){
  $('#reader-dialog')?.remove();
  const d=document.createElement('dialog');d.id='reader-dialog';d.className='source-dialog';
  d.innerHTML=`<header class="dialog-head"><h2>${esc(title)}</h2><button data-close aria-label="Cerrar ventana">✕</button></header><div class="dialog-body">${html}</div>`;
  document.body.append(d);$('[data-close]',d).onclick=()=>d.close();
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});
  d.showModal();return d;
}

async function loadPages(){
  if(pageTexts)return pageTexts;
  if(!pageRequest)pageRequest=fetch('../data/guia-paginas.json').then(response=>{
    if(!response.ok)throw new Error('No se pudo abrir el texto de la Guía.');return response.json();
  }).then(pages=>{pageTexts=pages;searchIndex=createSearchIndex(catalog,pages);return pages}).finally(()=>{pageRequest=null});
  return pageRequest;
}

function sourceParagraphs(text,query){
  // PDF line endings are visual wraps; keep paragraph spacing at sentence endings.
  return text.split(/(?<=[.!?])(?=\s*\n)/u).map(part=>`<p>${highlightMatches(part,query)}</p>`).join('');
}

async function readPage(page,query=selectedQuery){
  const d=dialog(`Guía · página ${page}`,'<p>Abriendo página…</p>');
  try{
    await loadPages();
    const render=p=>{
      const entry=pageTexts[p];if(!entry)throw new Error('Esta página no está disponible en la lectura de texto.');
      $('.dialog-head h2',d).textContent=`Guía · página ${p}`;
      $('.dialog-body',d).innerHTML=`<div class="source-toolbar"><label for="source-page">Página impresa <select id="source-page">${Object.keys(pageTexts).map(k=>`<option value="${k}" ${Number(k)===Number(p)?'selected':''}>${k}</option>`).join('')}</select></label><a class="button" href="${pdfUrl(p)}" target="_blank" rel="noopener">Ver página en el PDF original ↗</a></div><p class="source-caveat">Texto extraído del documento. Para consultar imágenes, tablas y diagramación, abre el PDF original (página ${entry.paginaPDF} del archivo).</p>${query?`<p class="source-search-note">Coincidencias de «${esc(query)}» resaltadas en el texto.</p>`:''}<div class="original-text" id="source-text">${sourceParagraphs(entry.texto||'Página sin texto extraíble. Consulta el PDF original.',query)}</div><div class="source-pager"><button id="source-prev" ${Number(p)<=5?'disabled':''}>← Página anterior</button><button id="source-next" ${Number(p)>=104?'disabled':''}>Página siguiente →</button></div>`;
      $('#source-page',d).onchange=e=>render(Number(e.target.value));
      $('#source-prev',d).onclick=()=>render(Number(p)-1);$('#source-next',d).onclick=()=>render(Number(p)+1);d.scrollTop=0;
      if(query)requestAnimationFrame(()=>{if(d.open)$('#source-text mark',d)?.scrollIntoView({block:'center',behavior:'instant'})});
    };render(Number(page));
  }catch(error){$('.dialog-body',d).innerHTML=`<p>${esc(error.message)}</p><a class="button" href="${pdfUrl(page)}" target="_blank" rel="noopener">Abrir PDF original</a>`}
}

function attachButtons(root=document){
  $$('[data-node]',root).forEach(b=>b.onclick=()=>navigate(b.dataset.node));
  $$('[data-page]',root).forEach(b=>b.onclick=()=>readPage(Number(b.dataset.page)));
  $$('[data-relation]',root).forEach(b=>b.onclick=()=>showRelation(b.dataset.relation));
}
function pageButtons(pages){return pages.map(p=>`<button data-page="${p}" aria-label="Leer página ${p} de la Guía">p. ${p}</button>`).join('')}

function showRelation(id){
  const e=catalog.edges.find(e=>e.id===id);if(!e)return;
  const d=dialog(e.tipo==='estructura'?'Agrupación de lectura':'Relación en la Guía',`<p><strong>${esc(byId.get(e.source).nombre)}</strong> → <strong>${esc(byId.get(e.target).nombre)}</strong></p><p>${esc(e.descripcion)}</p>${e.tipo==='estructura'?'<p class="small muted">Esta línea permite recorrer los contenidos del documento. No expresa causalidad ni una ponderación entre conceptos.</p>':''}<div class="source-pages">${pageButtons(e.paginas)}</div><button data-node="${esc(e.target)}" id="relation-target">Consultar concepto</button>`);
  attachButtons(d);$('#relation-target',d).onclick=()=>{d.close();navigate(e.target)};
}

function renderDetail(n){
  const marked=value=>highlightMatches(value,selectedQuery);
  const explicit=catalog.edges.filter(e=>e.tipo!=='estructura'&&(e.source===n.id||e.target===n.id));
  const explanation=n.descripcion?`<p>${marked(n.descripcion)}</p>`:`<p class="context-label">Contexto en ${esc(byId.get(n.contextoId)?.nombre||'la Guía')}</p><p>${marked(n.contexto)}</p><p class="small muted">Consulta este elemento en la página indicada.</p>`;
  $('#detail').innerHTML=`<span class="concept-type">${esc(typeLabel[n.nivel]||'Concepto')}</span><h2>${marked(n.nombre)}</h2>${explanation}<p class="context-label">Fuente documental</p><div class="source-pages">${pageButtons(n.paginas)}</div><button class="read-source primary" data-page="${n.paginas[0]}">Leer en la Guía</button>${explicit.length?`<div class="related"><h3>Relaciones explicadas en la Guía</h3>${explicit.map(e=>{const other=byId.get(e.source===n.id?e.target:e.source);return `<button data-relation="${esc(e.id)}">${esc(other.nombre)}<small>${esc(e.descripcion)}</small></button>`}).join('')}</div>`:''}`;
  attachButtons($('#detail'));
}

function render(){
  const n=byId.get(current);section=n.id==='ecp'?'ecp':n.seccion;
  const info=sectionInfo(section),index=catalog.sections.indexOf(info),color=info?.color||'#176b76';
  document.documentElement.style.setProperty('--topic-color',color);
  $('#section-nav').innerHTML=catalog.sections.map((s,i)=>`<button data-node="${s.id}" aria-current="${s.id===section}"><span>${String(i+1).padStart(2,'0')}</span><span>${esc(s.titulo)}</span></button>`).join('');
  attachButtons($('#section-nav'));
  $('#lesson-number').textContent=info?String(index+1).padStart(2,'0'):'ECP';
  $('#lesson-title').textContent=info?.titulo||'Mapa general de la Guía';
  $('#lesson-pages').textContent=info?pagesLabel(info.paginas):'Estructura de lectura';
  $('#lesson-summary').textContent=info?.resumen||'Selecciona un tema para recorrer sus conceptos, explicaciones y páginas fuente.';
  const note=$('#special-note');note.hidden=section!=='epe'&&section!=='ciclo';
  note.innerHTML=section==='epe'?'<div class="guide-note"><strong>Principio de simultaneidad.</strong> Las cuatro condiciones deben concurrir. <button data-page="53">Leer p. 53</button></div>':section==='ciclo'?'<div class="guide-note"><strong>Participación durante todo el ciclo.</strong> Es incidente, continua, sostenida y trazable. <button data-page="68">Leer p. 68</button></div>':'';
  attachButtons(note);
  const sub=children(current),siblings=n.parentId?children(n.parentId):[],related=catalog.edges.filter(e=>e.tipo!=='estructura'&&(e.source===current||e.target===current));
  let visible=[n,...sub];if(n.parentId&&n.parentId!=='ecp')visible.push(byId.get(n.parentId));
  if(!sub.length)visible.push(...siblings);
  for(const e of related)visible.push(byId.get(e.source),byId.get(e.target));
  if(current==='ecp')visible=[n,...catalog.sections.map(s=>byId.get(s.id))];
  const map=new Map(visible.map(n=>[n.id,n]));
  const edges=catalog.edges.filter(e=>map.has(e.source)&&map.has(e.target));
  network.show([...map.values()],edges,current,color);renderDetail(n);
  const items=current==='ecp'?catalog.sections.map(s=>byId.get(s.id)):sub.length?sub:siblings;
  $('#directory-title').textContent=sub.length?`Contenido de «${n.nombre}»`:'Conceptos del mismo apartado';
  $('#counts').textContent=`${items.length} conceptos · ${catalog.nodes.length} en el recorrido completo`;
  $('#concept-list').innerHTML=`<div class="concept-cards">${items.map(x=>`<button class="concept-card" data-node="${esc(x.id)}" aria-current="${x.id===current}"><strong>${esc(x.nombre)}</strong><small>${esc(pagesLabel(x.paginas))}${children(x.id).length?` · ${children(x.id).length} contenidos`:''}</small></button>`).join('')}</div>`;
  const trail=[];let ancestor=n;while(ancestor){trail.unshift(ancestor);ancestor=byId.get(ancestor.parentId)}
  $('#breadcrumbs').innerHTML=trail.map(x=>`<button data-node="${esc(x.id)}" ${x.id===current?'aria-current="location"':''}>${esc(x.id==='ecp'?'Guía':x.nombre)}</button>`).join('<span aria-hidden="true">/</span>');
  attachButtons($('#concept-list'));attachButtons($('#breadcrumbs'));
  const prev=catalog.sections[index-1],next=catalog.sections[index+1];
  $('#prev-lesson').textContent=prev?`← ${prev.titulo}`:'Inicio del recorrido';$('#prev-lesson').disabled=!prev;$('#prev-lesson').onclick=()=>navigate(prev.id);
  $('#next-lesson').textContent=next?`${next.titulo} →`:'Mapa general →';$('#next-lesson').onclick=()=>navigate(next?.id||'ecp');
  $('#lesson-progress').textContent=info?`${index+1} de ${catalog.sections.length}`:'';
}

function conceptPath(node){
  const names=[];let ancestor=byId.get(node.parentId);
  while(ancestor&&ancestor.id!=='ecp'){names.unshift(ancestor.nombre);ancestor=byId.get(ancestor.parentId)}
  return names.join(' › ')||'Guía ECP';
}

async function search(){
  const revision=++searchRevision,query=$('#search').value.trim(),active=searchTerms(query).length>0;
  $('#search-results').hidden=!active;$('#lesson').hidden=active;
  if(!active){selectedQuery='';$('#search-context').hidden=true;renderDetail(byId.get(current));network.fit();return}
  const renderResults=()=>{
    const matches=findMatches(searchIndex,query);
    $('#search-title').textContent=`Resultados de «${query}»`;
    $('#search-status').textContent=`${matches.concepts.length} conceptos de la red${pageTexts?` · ${matches.pages.length} páginas de la Guía`:''}`;
    $('#results-list').innerHTML=matches.concepts.length?matches.concepts.map(({node:n,excerpt,isContext})=>`<button class="search-result" data-node="${esc(n.id)}"><span class="result-path">${esc(conceptPath(n))}</span><strong>${highlightMatches(n.nombre,query)}</strong>${excerpt?`<p>${isContext?'<span class="context-label">Contexto del apartado: </span>':''}${highlightMatches(excerpt,query)}</p>`:''}<small>${esc(pagesLabel(n.paginas))}</small><span class="result-action">Ver concepto en la red →</span></button>`).join(''):'<p class="search-empty">No hay coincidencias en los conceptos de la red.</p>';
    $$('[data-node]',$('#results-list')).forEach(b=>b.onclick=()=>navigate(b.dataset.node,false,query));
    $('#page-results').innerHTML=pageTexts?(matches.pages.length?matches.pages.map(p=>`<button class="search-result" data-search-page="${p.number}"><strong>Guía · página ${p.number}</strong><p>${highlightMatches(p.excerpt,query)}</p><span class="result-action">Leer coincidencia en la Guía →</span></button>`).join(''):'<p class="search-empty">No hay coincidencias en el texto de la Guía. Prueba otra palabra.</p>'):'<p>Buscando en el texto de la Guía…</p>';
    $$('[data-search-page]').forEach(b=>b.onclick=()=>readPage(Number(b.dataset.searchPage),query));
  };
  renderResults();$('#page-results').setAttribute('aria-busy',String(!pageTexts));
  if(!pageTexts){
    try{await loadPages();if(revision===searchRevision)renderResults()}
    catch{if(revision===searchRevision)$('#page-results').innerHTML='<p>No se pudo consultar el texto de la Guía. <button id="retry-search">Volver a intentar</button></p>';if($('#retry-search'))$('#retry-search').onclick=search}
    finally{if(revision===searchRevision)$('#page-results').setAttribute('aria-busy','false')}
  }
}
function navigate(id,replace=false,query=''){
  ++searchRevision;selectedQuery=query;
  if(!byId.has(id))id='sentido';current=id;
  $('#search').value=query;$('#search-results').hidden=true;$('#lesson').hidden=false;
  $('#search-context').hidden=!query;$('#selected-query').textContent=query;
  $('.contents').classList.remove('open');$('#toggle-index').setAttribute('aria-expanded','false');
  const hash='#concepto='+encodeURIComponent(id);if(location.hash!==hash)history[replace?'replaceState':'pushState']({},'',hash);
  render();
  if(!replace){
    const heading=$('#detail h2');heading.tabIndex=-1;heading.focus({preventScroll:true});
    const target=sectionInfo(id)||id==='ecp'?$('.lesson-heading'):$('#detail');
    if(query||matchMedia('(max-width:760px)').matches||target.getBoundingClientRect().top<0)target.scrollIntoView({block:'start',behavior:'instant'});
  }
}
function fromHash(){try{return decodeURIComponent(location.hash.replace(/^#concepto=/,''))}catch{return 'sentido'}}

async function start(){
  const response=await fetch('../data/ecp-guia.json');if(!response.ok)throw new Error('No se pudo cargar el contenido de la Guía.');
  catalog=await response.json();byId=new Map(catalog.nodes.map(n=>[n.id,n]));
  searchIndex=createSearchIndex(catalog);
  network=new LearningNetwork($('#cy'),navigate,showRelation);
  $('#search').oninput=search;$('#clear-search').onclick=()=>{$('#search').value='';search();$('#search').focus()};
  $('#keyword-search').onsubmit=e=>{e.preventDefault();search();if(!$('#search-results').hidden){$('#search-title').focus({preventScroll:true});$('#search-results').scrollIntoView({block:'start',behavior:'instant'})}};
  $('#back-to-results').onclick=()=>{search();$('#search-title').focus({preventScroll:true});$('#search-results').scrollIntoView({block:'start',behavior:'instant'})};
  $('#toggle-index').onclick=()=>{const open=$('.contents').classList.toggle('open');$('#toggle-index').setAttribute('aria-expanded',String(open))};
  $('#overview').onclick=()=>navigate('ecp');$('#reset-view').onclick=()=>navigate(section);
  $('#fit').onclick=()=>network.fit();$('#zoom-in').onclick=()=>network.zoom(1.3);$('#zoom-out').onclick=()=>network.zoom(1/1.3);
  $('#about').onclick=()=>dialog('Sobre esta lectura',`<p>Esta herramienta organiza los contenidos de la Guía Estratégica ECP para su consulta y aprendizaje.</p><ul class="about-list"><li>Las explicaciones son síntesis. Cada concepto remite a las páginas impresas y al documento original.</li><li>Las líneas de agrupación organizan el recorrido de lectura; no representan relaciones causales. Las relaciones de secuencia, participación y retroalimentación incluyen su propia explicación documental.</li><li>${esc(catalog.criterios.enfoques)}</li><li>El apartado de mecanismos conserva su carácter de propuesta en construcción, tal como lo presenta la Guía.</li></ul><p>${catalog.nodes.length} conceptos · ${catalog.sections.length} temas de aprendizaje.</p><a class="button" href="${catalog.fuente.url}" target="_blank" rel="noopener">Abrir Guía original ↗</a>`);
  window.addEventListener('popstate',()=>navigate(fromHash(),true));
  navigate(fromHash(),true);
}
start().catch(e=>{$('.lesson-area').innerHTML=`<div class="load-error"><h2>No se pudo abrir la Guía</h2><p>${esc(e.message)}</p><button onclick="location.reload()">Volver a intentar</button></div>`});
