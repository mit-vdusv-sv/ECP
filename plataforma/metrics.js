import {captureVariables} from '../shared/model.js';
export function summary(c,records,cantons,eligible=captureVariables(c)){
 const ids=new Set(eligible.map(v=>v.id)),pairs=new Set(records.filter(r=>ids.has(r.variableId)).map(r=>r.canton+'|'+r.variableId));
 const denominator=eligible.length*cantons.length;
 const fields=['valor','periodo','ambito','sector','fuente','responsable','calidad','evidencia','metodo','definicion'];
 const filled=records.reduce((a,r)=>a+fields.filter(k=>r[k]!==null&&r[k]!==undefined&&r[k]!=='').length,0);
 const valid=records.filter(r=>r.estado==='validado').length;
 return {coverage:denominator?100*pairs.size/denominator:0,covered:pairs.size,denominator,validated:records.length?100*valid/records.length:0,valid,completeness:records.length?100*filled/(records.length*fields.length):0,records:records.length,missing:denominator-pairs.size};
}
export function compatibleComparison(records,variableId,period,sector,scenario,cantons){
 const rows=records.filter(r=>r.variableId===variableId&&r.periodo===period&&r.sector===sector&&r.escenario===scenario);
 const units=new Set(rows.map(r=>r.unidad)),methods=new Set(rows.map(r=>r.metodo)),versions=new Set(rows.map(r=>JSON.stringify(r.definicion)));
 // No averaging of mixed methods, unit changes or versions.
 if(units.size>1||methods.size>1||versions.size>1)return {error:'Estos registros usan unidades, métodos o versiones de definición diferentes. Consulta las fichas; no se presentan como comparables.'};
 if(cantons.some(c=>rows.filter(r=>r.canton===c.id).length>1))return {error:'Hay más de un registro por cantón para esta selección. Consulta la tabla por grupo; no se promedian automáticamente.'};
 return {rows:cantons.map(c=>({canton:c.nombre,valor:rows.find(r=>r.canton===c.id)?.valor??null})),unit:rows[0]?.unidad||'',count:rows.length};
}
