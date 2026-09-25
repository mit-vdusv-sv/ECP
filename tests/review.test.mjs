import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
globalThis.window={addEventListener(){}};
globalThis.BroadcastChannel=class{addEventListener(){}postMessage(){}};
Object.defineProperty(globalThis,'navigator',{value:{locks:{request:async(name,run)=>run()}},configurable:true});
const {initialize,readData,changeStatus,upsert,reviewComment}=await import('../shared/storage.js');
const catalog=JSON.parse(readFileSync(new URL('../data/ecp-variables.json',import.meta.url)));
const demo=JSON.parse(readFileSync(new URL('../data/demo-data.json',import.meta.url)));
const comment='Completar la evidencia del taller.\nAdjuntar la matriz de aportes.';
async function observed(){memory.clear();await initialize(demo);const r=readData().records.find(r=>r.estado==='enviado');await changeStatus(r.id,'observado',comment,catalog,'MIT',r.revision);return readData().records.find(x=>x.id===r.id)}

test('La observación del MIT persiste con su comentario y bitácora',async()=>{
  const r=await observed();assert.equal(r.validacion,comment);assert.equal(r.estado,'observado');
  const event=readData().history.find(h=>h.entity===r.id);assert.equal(event.after.validacion,comment);assert.equal(event.actor,'MIT');
});
test('Reenviar desde GADM conserva el comentario del MIT',async()=>{
  const r=await observed();await changeStatus(r.id,'enviado','',catalog,'GADM',r.revision);
  assert.equal(readData().records.find(x=>x.id===r.id).validacion,comment);
});
test('Una corrección GADM no puede borrar la revisión del MIT',async()=>{
  const r=await observed();await upsert({...r,estado:'borrador',observacion:'Se adjunta evidencia.',validacion:''},catalog,'GADM',r.revision);
  const saved=readData().records.find(x=>x.id===r.id);assert.equal(saved.validacion,comment);assert.equal(saved.observacion,'Se adjunta evidencia.');
});
test('Rechaza una observación vacía sin modificar el registro',async()=>{
  const r=await observed(),before=JSON.stringify(readData());await assert.rejects(changeStatus(r.id,'observado','  ',catalog,'MIT',r.revision),/motivo/);
  assert.equal(JSON.stringify(readData()),before);
});
test('Rechaza una revisión obsoleta sin sustituir el comentario',async()=>{
  const r=await observed();await assert.rejects(changeStatus(r.id,'observado','Nota obsoleta',catalog,'MIT',r.revision-1),/cambió/);
  assert.equal(readData().records.find(x=>x.id===r.id).validacion,comment);
});
test('Recupera de la bitácora un comentario borrado por la versión anterior',async()=>{
  const r=await observed();const key=[...memory.keys()].find(k=>k.endsWith(':records')),data=readData();
  data.records.find(x=>x.id===r.id).validacion='';memory.set(key,JSON.stringify(data));
  const legacy=readData().records.find(x=>x.id===r.id);assert.equal(reviewComment(legacy),comment);
  await changeStatus(legacy.id,'enviado','',catalog,'GADM',legacy.revision);
  assert.equal(readData().records.find(x=>x.id===r.id).validacion,comment);
});
