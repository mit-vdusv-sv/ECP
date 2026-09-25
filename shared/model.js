export const STATES={MEDIBLE_TDR_ACTUAL:{label:'Medible en el alcance TdR',short:'Medible TdR',color:'#087f78'},MEDIBLE_CON_METODOLOGIA_O_LEVANTAMIENTO:{label:'Requiere metodología o levantamiento',short:'Requiere método',color:'#c17c16'},NO_OPERACIONALIZADA_ACTUALMENTE:{label:'No operacionalizada actualmente',short:'No operacionalizada',color:'#708298'}};
export const A='MEDIBLE_TDR_ACTUAL';
export const ROLES=['ibarra','riobamba','loja','portoviejo'];
export const STATUS=['borrador','enviado','validado','observado'];
export const clone=x=>JSON.parse(JSON.stringify(x));
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const fail=m=>{throw new Error(m)};
function text(v,name,max=5000){if(typeof v!=='string'||v.length>max)fail(`${name}: texto inválido (máximo ${max} caracteres).`)}
function safeTree(x,depth=0){if(depth>20)fail('JSON demasiado anidado.');if(x&&typeof x==='object'){for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))fail('JSON contiene una propiedad no permitida.');safeTree(x[k],depth+1)}}}
export function parseJSON(s){if(s.length>6000000)fail('El archivo supera 6 MB.');const x=JSON.parse(s);safeTree(x);return x}
export function validateCatalog(c){
 if(c?.schemaVersion!==1||!Array.isArray(c.nodes)||!Array.isArray(c.edges))fail('Se requiere schemaVersion 1, nodes y edges.');
 if(!c.nodes.length||c.nodes.length>3000||c.edges.length>12000)fail('Catálogo fuera de límites (1–3000 nodos, hasta 12000 conexiones).');
 const ids=new Set();
 for(const n of c.nodes){
  if(!/^[a-zA-Z0-9][\w-]{0,100}$/.test(n.id)||ids.has(n.id))fail(`Identificador de nodo inválido o duplicado: ${n.id}`);ids.add(n.id);
  for(const k of ['nombre','descripcion','nivel','categoria','naturalezaMedicion','notas'])text(n[k],k,k==='nombre'?180:5000);
  if(!n.nombre.trim()||!STATES[n.estadoMedicion])fail('Nombre o estado de medición inválido.');
  for(const k of ['claveECP','ejeECP','fuenteDocumento'])if(!Array.isArray(n[k])||n[k].some(v=>typeof v!=='string'||v.length>200))fail(`${k}: se requiere una lista de textos.`);
  if(n.claveECP.some(v=>!['k1','k2','k3','k4'].includes(v))||n.ejeECP.some(v=>!['e1','e2','e3','e4','e5','e6'].includes(v)))fail('Clave o eje desconocido.');
  for(const k of ['paginaGuia','paginaTdR'])if(n[k]!==null&&(!Number.isInteger(n[k])||n[k]<1||n[k]>10000))fail(`${k}: use página entera o null.`);
  for(const k of ['fuenteMedicion','unidad','formula','periodicidad'])if(n[k]!==null)text(n[k],k);
  if(n.captura){if(!['number','text'].includes(n.captura.tipo)||typeof n.captura.geografica!=='boolean')fail('Configuración de captura inválida.');for(const f of ['minimo','maximo'])if(n.captura[f]!=null&&!Number.isFinite(n.captura[f]))fail('Límite de captura inválido.');if(n.captura.minimo!=null&&n.captura.maximo!=null&&n.captura.minimo>n.captura.maximo)fail('Rango de captura invertido.');if(n.captura.unidadDemo!=null)text(n.captura.unidadDemo,'Unidad demo',100)}
  if(n.estadoMedicion===A&&!n.captura)fail(`El nodo ${n.nombre} requiere configuración de captura para ser habilitado.`);
 }
 const edgeIds=new Set(),pairs=new Set();
 for(const r of c.edges){if(!/^[\w-]{1,120}$/.test(r.id)||edgeIds.has(r.id)||ids.has(r.id))fail('ID de conexión inválido o duplicado.');edgeIds.add(r.id);if(!ids.has(r.source)||!ids.has(r.target)||r.source===r.target)fail('Conexión con extremo inexistente o consigo misma.');for(const k of ['tipoRelacion','descripcion','fuenteDocumento'])text(r[k],k);if(!r.tipoRelacion.trim())fail('Defina el tipo de relación.');if(r.paginaFuente!==null&&(!Number.isInteger(r.paginaFuente)||r.paginaFuente<1))fail('Página de relación inválida.');const sig=`${r.source}|${r.target}|${r.tipoRelacion}`;if(pairs.has(sig))fail('Conexión duplicada.');pairs.add(sig)}
 for(const n of c.nodes){const seen=new Set([n.id]);let p=n.parentId;while(p){if(!ids.has(p)||seen.has(p))fail('La jerarquía contiene un padre inexistente o un ciclo.');seen.add(p);p=c.nodes.find(v=>v.id===p).parentId}}
 return c;
}
export const captureVariables=c=>c.nodes.filter(n=>n.estadoMedicion===A&&n.captura);
export function validateGeometry(g){if(g==null)return;if(!g||!['Point','Polygon','LineString'].includes(g.type))fail('Geometría: use Point, LineString o Polygon GeoJSON.');let count=0;const coord=p=>{if(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))||Math.abs(p[0])>180||Math.abs(p[1])>90)fail('Coordenadas inválidas: longitud, latitud en EPSG:4326.');count++};if(g.type==='Point')coord(g.coordinates);else{const lines=g.type==='Polygon'?g.coordinates:[g.coordinates];if(!Array.isArray(lines)||!lines.length)fail('Geometría vacía.');for(const l of lines){if(!Array.isArray(l)||l.length<(g.type==='Polygon'?4:2))fail('Geometría incompleta.');l.forEach(coord);if(g.type==='Polygon'&&JSON.stringify(l[0])!==JSON.stringify(l.at(-1)))fail('El anillo del polígono debe estar cerrado.')}}if(count>1000)fail('Máximo 1000 vértices por geometría.')}
export function validateRecord(r,c,{historical=false}={}){
 if(!/^[\w-]{1,120}$/.test(r.id)||!ROLES.includes(r.canton)||!STATUS.includes(r.estado))fail('ID, cantón o estado de registro inválido.');
 const current=c.nodes.find(n=>n.id===r.variableId);const n=historical?r.definicion:current;
 if(!n||n.id!==r.variableId||n.estadoMedicion!==A||!n.captura)fail('Variable no habilitada para captura.');
 if(r.definicion){validateCatalog({schemaVersion:1,nodes:[{...r.definicion,parentId:null}],edges:[]})}
 if(n.captura.tipo==='number'){if(typeof r.valor!=='number'||!Number.isFinite(r.valor))fail('Ingrese un valor numérico finito.');if(n.captura.minimo!=null&&r.valor<n.captura.minimo||n.captura.maximo!=null&&r.valor>n.captura.maximo)fail('Valor fuera del rango de captura.');if(r.unidad!==n.captura.unidadDemo)fail('Unidad incompatible con la ficha de captura.')}else{text(r.valor,'Valor',3000);if(!r.valor.trim())fail('Ingrese una observación.');if(r.unidad!==null)fail('Una observación descriptiva no utiliza unidad numérica.')}
 for(const k of ['periodo','ambito','sector','fuente','responsable','observacion','evidencia','metodo','validacion'])text(r[k],k,k==='periodo'?10:3000);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.periodo)||Number.isNaN(Date.parse(r.periodo))||new Date(r.periodo).toISOString().slice(0,10)!==r.periodo)fail('Fecha de referencia inválida.');
 if(!r.fuente.trim()||!r.responsable.trim()||!r.sector.trim()||!r.ambito.trim())fail('Complete fuente, responsable, ámbito y sector.');
 if(!['alta','media','baja'].includes(r.calidad)||!['actual','propuesto'].includes(r.escenario))fail('Calidad o escenario inválido.');
 if(['enviado','validado'].includes(r.estado)&&(!r.evidencia.trim()||!r.metodo.trim()))fail('Para enviar o validar se requieren evidencia y método.');
 if(n.captura.grupoPoblacional&&(!r.grupoPoblacional||typeof r.grupoPoblacional!=='string'))fail('Indique el grupo poblacional del conteo.');
 validateGeometry(r.geometria);if(!n.captura.geografica&&r.geometria)fail('Esta variable administrativa no requiere geometría.');
 return r;
}
export const recordKey=r=>[r.canton,r.variableId,r.periodo,normalize(r.sector.trim()),r.escenario,normalize(r.grupoPoblacional||'')].join('|');
export function validateImport(x,c,canton){if(x?.schemaVersion!==1||!Array.isArray(x.records)||x.records.length>5000)fail('JSON de registros inválido (schemaVersion 1 y hasta 5000 registros).');const ids=new Set(),keys=new Set();for(const r of x.records){validateRecord(r,c);if(canton&&r.canton!==canton)fail('El archivo contiene otro cantón. Cambie al cantón correcto o importe desde MIT.');if(ids.has(r.id)||keys.has(recordKey(r)))fail('El archivo contiene registros duplicados.');ids.add(r.id);keys.add(recordKey(r))}return x.records}
export function audit(c){return {nodos:c.nodes.length,conexiones:c.edges.length,porClave:Object.fromEntries(['k1','k2','k3','k4'].map(k=>[k,c.nodes.filter(n=>n.claveECP.includes(k)).length])),porEje:Object.fromEntries(['e1','e2','e3','e4','e5','e6'].map(k=>[k,c.nodes.filter(n=>n.ejeECP.includes(k)).length])),porEstado:Object.fromEntries(Object.keys(STATES).map(s=>[s,c.nodes.filter(n=>n.estadoMedicion===s).length])),conPagina:c.nodes.filter(n=>(n.paginaGuia||n.paginaTdR)&&n.fuenteDocumento.length).length,sinReferencia:c.nodes.filter(n=>!(n.paginaGuia||n.paginaTdR)||!n.fuenteDocumento.length).map(n=>n.id),relacionesSinReferencia:c.edges.filter(e=>!e.paginaFuente||!e.fuenteDocumento).map(e=>e.id)}}
