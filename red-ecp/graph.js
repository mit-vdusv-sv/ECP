export class LearningNetwork {
  constructor(element,onNode,onEdge){
    this.element=element;
    this.cy=cytoscape({container:element,elements:[],minZoom:.15,maxZoom:2.5,wheelSensitivity:.15,style:[
      {selector:'node',style:{label:'data(label)',shape:'round-rectangle',width:178,height:68,'background-color':'#edf5f3','border-color':'#b8d5cc','border-width':1.5,color:'#163f49','font-family':'Segoe UI, Arial','font-size':14,'text-wrap':'wrap','text-max-width':158,'text-valign':'center','text-halign':'center','text-justification':'center'}},
      {selector:'node[role="selected"]',style:{'background-color':'data(color)','border-color':'data(color)',color:'#fff','font-weight':700,width:206,height:78,'text-max-width':182}},
      {selector:'node[role="parent"]',style:{'background-color':'#f0f3f5','border-color':'#c8d6de','font-size':13}},
      {selector:'edge',style:{width:1.5,'line-color':'#b2c8ce','curve-style':'bezier','target-arrow-shape':'none'}},
      {selector:'edge[kind!="estructura"]',style:{'line-color':'#ad792d','line-style':'dashed','target-arrow-color':'#ad792d','target-arrow-shape':'triangle','arrow-scale':.8,width:2}},
      {selector:'.hover',style:{'border-width':3,'border-color':'#c48d2f'}},
      {selector:':selected',style:{'border-color':'#c48d2f','border-width':3}}
    ]});
    this.cy.on('tap','node',e=>onNode(e.target.id()));this.cy.on('tap','edge',e=>onEdge(e.target.id()));
    this.cy.on('mouseover','node',e=>e.target.addClass('hover'));this.cy.on('mouseout','node',e=>e.target.removeClass('hover'));
    this.observer=new ResizeObserver(()=>{this.cy.resize();this.fit()});this.observer.observe(element);
  }
  show(nodes,edges,selected,color){
    const current=nodes.find(n=>n.id===selected),parent=nodes.find(n=>n.id===current?.parentId),rest=nodes.filter(n=>n.id!==selected&&n!==parent);
    const columns=rest.length<=4?2:3,span=(columns-1)*212;
    const position=n=>n.id===selected?{x:span/2,y:parent?124:26}:n===parent?{x:span/2,y:14}:{x:(rest.indexOf(n)%columns)*212,y:(parent?242:145)+Math.floor(rest.indexOf(n)/columns)*104};
    this.cy.batch(()=>{this.cy.elements().remove();this.cy.add(nodes.map(n=>({data:{id:n.id,label:n.nombre,color,role:n.id===selected?'selected':n===parent?'parent':'concept'},position:position(n)})));this.cy.add(edges.map(e=>({data:{id:e.id,source:e.source,target:e.target,kind:e.tipo}})))});this.fit();
  }
  fit(){if(this.cy.nodes().length)this.cy.fit(undefined,28)}
  zoom(factor){const size=this.element.getBoundingClientRect();this.cy.zoom({level:Math.max(.15,Math.min(2.5,this.cy.zoom()*factor)),renderedPosition:{x:size.width/2,y:size.height/2}})}
}
