import {clone,uid,validateCatalog,validateRecord,recordKey} from './model.js';
const PREFIX=`ecp-piloto:v1:${new URL('../',import.meta.url).pathname}:`;
const CKEY=PREFIX+'catalog',RKEY=PREFIX+'records';
let channel;try{channel=new BroadcastChannel(PREFIX+'events')}catch{}
const listeners=new Set();
function emit(type){listeners.forEach(fn=>fn(type))}
channel?.addEventListener('message',e=>emit(e.data.type));
window.addEventListener('storage',e=>{if(e.key?.startsWith(PREFIX))emit(e.key===CKEY?'catalog':'records')});
export const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn)};
function get(key){const s=localStorage.getItem(key);if(!s)return null;try{return JSON.parse(s)}catch{throw new Error('El almacenamiento local contiene JSON dañado. Exporte o restablezca los datos de la demo.')}}
function set(key,value,type){try{localStorage.setItem(key,JSON.stringify(value))}catch{throw new Error('No se pudo guardar: almacenamiento bloqueado o lleno. Exporte una copia antes de cerrar.')}channel?.postMessage({type});emit(type)}
export async function loadBase(){const r=await fetch(new URL('../data/ecp-variables.json',import.meta.url));if(!r.ok)throw new Error('No se pudo cargar el catálogo. Abra el sitio con un servidor HTTP o GitHub Pages.');return validateCatalog(await r.json())}
export async function loadDemo(){const r=await fetch(new URL('../data/demo-data.json',import.meta.url));if(!r.ok)throw new Error('No se pudieron cargar los datos demo.');return r.json()}
export function catalog(base){const saved=get(CKEY);return saved?validateCatalog(saved):clone(base)}
export function saveCatalog(c){validateCatalog(c);const next={...c,updatedAt:new Date().toISOString(),revision:uid()};set(CKEY,next,'catalog');return next}
export function readData(){return get(RKEY)||{schemaVersion:1,records:[],history:[],updatedAt:null}}
export function reviewComment(record,history=readData().history){
 if(record.validacion?.trim())return record.validacion;
 return history.find(h=>h.entity===record.id&&['Estado: observado','Estado: validado'].includes(h.action)&&h.after?.validacion?.trim())?.after.validacion||'';
}
async function transaction(fn){
 const run=()=>{const data=readData();const result=fn(data);data.updatedAt=new Date().toISOString();set(RKEY,data,'records');return result};
 // Web Locks serializes updates across tabs; the synchronous fallback rereads on every action.
 return navigator.locks?.request?navigator.locks.request(PREFIX+'write',run):run();
}
function log(data,action,before,after,actor){data.history.unshift({id:uid(),at:new Date().toISOString(),actor,action,entity:after?.id||before?.id||'demo',canton:after?.canton||before?.canton||null,result:'correcto',before:before?clone(before):null,after:after?clone(after):null})}
export async function initialize(demo){if(readData().seeded)return;await transaction(d=>{if(!d.seeded){d.records=clone(demo.records);d.seeded=true;log(d,'Inicio de datos ficticios',null,null,'Sistema demo')}})}
export async function upsert(r,c,actor,expectedRevision){return transaction(d=>{const at=d.records.findIndex(x=>x.id===r.id);const before=at>=0?d.records[at]:null;if(before&&before.revision!==expectedRevision)throw new Error('El registro cambió en otra ventana. Cierre la ficha y vuelva a abrirlo antes de guardar.');if(!before&&expectedRevision)throw new Error('El registro fue eliminado en otra ventana.');if(d.records.some(x=>x.id!==r.id&&recordKey(x)===recordKey(r)))throw new Error('Ya existe un registro de esta variable, período, sector y escenario. Edítelo desde la tabla.');const now=new Date().toISOString();r={...clone(r),validacion:before?reviewComment(before,d.history):r.validacion,createdAt:before?.createdAt||now,updatedAt:now,revision:(before?.revision||0)+1};validateRecord(r,c);if(at>=0)d.records[at]=r;else d.records.push(r);log(d,before?'Editar registro':'Crear registro',before,r,actor);return r})}
export async function removeRecord(id,actor,revision){return transaction(d=>{const r=d.records.find(x=>x.id===id);if(!r)return;if(r.revision!==revision)throw new Error('El registro cambió en otra ventana. Revise la versión actual.');d.records=d.records.filter(x=>x.id!==id);log(d,'Eliminar registro',r,null,actor)})}
export async function changeStatus(id,status,note,c,actor,revision){return transaction(d=>{
 const r=d.records.find(x=>x.id===id);if(!r||r.revision!==revision)throw new Error('El registro cambió. Abra de nuevo su ficha.');
 const comment=typeof note==='string'?note.trim():'';
 if(status==='observado'&&!comment)throw new Error('Indique el motivo de la observación.');
 const next={...r,estado:status,validacion:['observado','validado'].includes(status)?comment:reviewComment(r,d.history),revision:r.revision+1,updatedAt:new Date().toISOString()};
 validateRecord(next,c,{historical:true});d.records=d.records.map(x=>x.id===id?next:x);log(d,`Estado: ${status}`,r,next,actor);return next;
})}
export async function importRecords(records,c,actor){return transaction(d=>{const existingIds=new Set(d.records.map(r=>r.id)),existingKeys=new Set(d.records.map(recordKey));const duplicate=records.filter(r=>existingIds.has(r.id)||existingKeys.has(recordKey(r)));const accepted=records.filter(r=>!existingIds.has(r.id)&&!existingKeys.has(recordKey(r)));for(const r of accepted){const next={...clone(r),definicion:clone(c.nodes.find(n=>n.id===r.variableId)),revision:1,updatedAt:new Date().toISOString()};validateRecord(next,c);d.records.push(next);log(d,'Importar registro',null,next,actor)}return {aceptados:accepted.length,duplicados:duplicate.length,rechazados:0,advertencias:duplicate.map(r=>`${r.id}: duplicado omitido; la importación no sobrescribe registros.`)}})}
export async function resetDemo(demo,actor){return transaction(d=>{const before=d.records.length;d.records=clone(demo.records);d.seeded=true;log(d,`Restablecer demo (${before} registros anteriores reemplazados)`,null,null,actor)})}
