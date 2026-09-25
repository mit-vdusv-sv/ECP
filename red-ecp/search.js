const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const searchTerms=query=>[...new Set(fold(query).match(/[\p{L}\p{N}]+/gu)||[])];
const containsAll=(text,terms)=>terms.every(term=>text.includes(term));

export function createSearchIndex(catalog,pages={}){
  return {
    concepts:catalog.nodes.map(node=>{
      const body=node.descripcion||node.contexto||'';
      return {node,body,name:fold(node.nombre),text:fold(`${node.nombre} ${body}`)};
    }),
    pages:Object.entries(pages).map(([number,page])=>({number:Number(number),text:page.texto||'',folded:fold(page.texto)}))
  };
}

// Track offsets in the original text so accents and HTML-like source text stay intact.
function matchRanges(text,terms){
  let normalized='',offset=0;const starts=[],ends=[];
  for(const char of text){
    const part=fold(char);
    for(let i=0;i<part.length;i++){starts.push(offset);ends.push(offset+char.length)}
    normalized+=part;offset+=char.length;
    if(!part&&ends.length)ends[ends.length-1]=offset;
  }
  const ranges=[];
  for(const term of terms){
    for(let at=normalized.indexOf(term);at!==-1;at=normalized.indexOf(term,at+term.length)){
      ranges.push([starts[at],ends[at+term.length-1]]);
    }
  }
  ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
  for(const range of ranges){
    const last=merged.at(-1);
    if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);
  }
  return merged;
}

export function highlightMatches(value,query){
  const text=String(value??'');let from=0,html='';
  for(const [start,end] of matchRanges(text,searchTerms(query))){
    html+=escapeHtml(text.slice(from,start))+`<mark>${escapeHtml(text.slice(start,end))}</mark>`;from=end;
  }
  return html+escapeHtml(text.slice(from));
}

function excerpt(value,terms){
  const text=value.replace(/\s+/g,' ').trim();
  const ranges=matchRanges(text,terms),first=ranges[0]?.[0]||0;
  let start=Math.max(0,first-75),end=Math.min(text.length,start+270);
  if(start){const space=text.indexOf(' ',start);if(space<first&&space!==-1)start=space+1}
  if(end<text.length){const space=text.lastIndexOf(' ',end);if(space>first)end=space}
  return `${start?'… ':''}${text.slice(start,end)}${end<text.length?' …':''}`;
}

export function findMatches(index,query){
  const terms=searchTerms(query);if(!terms.length)return {concepts:[],pages:[]};
  const phrase=fold(query.trim());
  const concepts=index.concepts.filter(item=>containsAll(item.text,terms)).map(item=>({
    node:item.node,
    excerpt:excerpt(item.body,terms),
    isContext:!item.node.descripcion&&!!item.node.contexto,
    score:(containsAll(item.name,terms)?100:0)+(item.name===phrase?50:item.name.includes(phrase)?20:0)
  })).sort((a,b)=>b.score-a.score||a.node.nombre.localeCompare(b.node.nombre,'es'));
  const pages=index.pages.filter(page=>containsAll(page.folded,terms)).map(page=>({number:page.number,excerpt:excerpt(page.text,terms)}));
  return {concepts,pages};
}
