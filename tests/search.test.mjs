import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSearchIndex,findMatches,highlightMatches} from '../red-ecp/search.js';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const guide=read('../data/ecp-guia.json'),pages=read('../data/guia-paginas.json');
const index=createSearchIndex(guide,pages);

test('Permeable localiza los conceptos y las páginas reales, sin atribuir toda una página a cada nodo',()=>{
  const hits=findMatches(index,'permeable');
  assert.deepEqual(hits.concepts.map(hit=>hit.node.nombre),['Pavimentos permeables','SUDS']);
  assert.deepEqual(hits.pages.map(hit=>hit.number),[24,25,47,104]);
  assert(hits.pages.every(hit=>hit.excerpt.toLowerCase().includes('permeable')));
});
test('Las consultas ignoran tildes y mayúsculas y admiten varias palabras en distinto orden',()=>{
  assert.deepEqual(findMatches(index,'ISÓCRONAS'),findMatches(index,'isocronas'));
  assert(findMatches(index,'isocronas').concepts.length>0);
  assert(findMatches(index,'vivo suelo').concepts.some(hit=>hit.node.nombre==='Permeabilidad y suelo vivo'));
  assert(findMatches(index,'suelo permeable').pages.some(hit=>hit.number===25));
});
test('Encuentra contexto y texto original que no figura en las descripciones',()=>{
  const contextNode=guide.nodes.find(node=>node.contexto&&!node.descripcion);
  const local=createSearchIndex({nodes:[contextNode]});
  const result=findMatches(local,contextNode.contexto);
  assert.equal(result.concepts[0].node.id,contextNode.id);
  assert.equal(result.concepts[0].isContext,true);
  const pageOnly=findMatches(index,'plantas bajas transparentes');
  assert.equal(pageOnly.concepts.length,0);
  assert(pageOnly.pages.some(hit=>hit.number===24));
});
test('Los términos vacíos y las consultas inexistentes no devuelven falsos resultados',()=>{
  for(const query of ['', '  ', '???', 'zzzzsincoincidencia'])assert.deepEqual(findMatches(index,query),{concepts:[],pages:[]});
});
test('El resaltado conserva acentos y escapa HTML sin ejecutar texto del documento o la consulta',()=>{
  assert.equal(highlightMatches('ISÓCRONAS e isócronas','isocronas'),'<mark>ISÓCRONAS</mark> e <mark>isócronas</mark>');
  assert.equal(highlightMatches('<img src=x> permeables & suelo','permeable'), '&lt;img src=x&gt; <mark>permeable</mark>s &amp; suelo');
  assert.equal(highlightMatches('Sin coincidencia','<script>'), 'Sin coincidencia');
});
