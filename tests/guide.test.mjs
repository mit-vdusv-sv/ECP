import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const guide=json('../data/ecp-guia.json'),pages=json('../data/guia-paginas.json');
test('La red usa exclusivamente la Guía y no contiene la clasificación del piloto',()=>{
  assert.equal(guide.sections.length,10);
  assert.equal(guide.nodes.length,476);
  assert.doesNotMatch(JSON.stringify(guide),/TdR|TDR|MEDIBLE_|estadoMedicion|naturalezaMedicion|"captura"|paginaTdR/);
  for(const n of [...guide.nodes,...guide.edges])assert.equal(n.fuente,'guia-paradigma-DIGITAL.pdf');
});
test('Todos los conceptos y relaciones tienen páginas consultables y extremos válidos',()=>{
  const ids=new Set(guide.nodes.map(n=>n.id));assert.equal(ids.size,guide.nodes.length);
  for(const item of [...guide.nodes,...guide.edges]){assert(item.paginas.length);for(const page of item.paginas)assert(pages[page])}
  for(const e of guide.edges){assert(ids.has(e.source));assert(ids.has(e.target))}
  for(const n of guide.nodes){const seen=new Set();let node=n;while(node){assert(!seen.has(node.id));seen.add(node.id);node=guide.nodes.find(x=>x.id===node.parentId)}}
});
test('Claves, enfoques y fases conservan su estructura documental',()=>{
  const count=parent=>guide.nodes.filter(n=>n.parentId===parent).length;
  assert.equal(count('claves'),4);assert.equal(count('enfoques'),6);assert.equal(count('ciclo'),5);
  assert.equal(guide.edges.filter(e=>e.tipo==='transversal').length,5);
  assert(guide.edges.some(e=>e.source==='fase5'&&e.target==='fase1'&&e.tipo==='retroalimenta'));
  assert(!guide.edges.some(e=>e.tipo==='asociacion-tematica'));
});
test('El PDF original se conserva sin alteraciones y la paginación coincide',()=>{
  const hash=createHash('sha256').update(readFileSync(new URL('../assets/documentos/guia-ecp.pdf',import.meta.url))).digest('hex');
  assert.equal(hash,guide.fuente.sha256);
  assert.equal(Object.keys(pages).length,100);
  for(const [number,value] of Object.entries(pages))assert.equal(value.paginaPDF,Number(number)+3);
});
