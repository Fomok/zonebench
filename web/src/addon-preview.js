/* Read-only views of the actual pack payload. Never edit the project here. */
(function(root){
'use strict';
const labels={rigs:'Rig',boxes:'Container',pouches:'Pouch',packs:'Backpack',items:'Item'};
const names={id:'Item section',weight:'Weight (kg)',cost:'Price (RU)',kg:'Maximum contents weight (kg)',cellw:'Inventory width',cellh:'Inventory height',inw:'Storage width',inh:'Storage height',takes:'Allowed item group',snd:'Opening sound',stack:'Stack limit',fan:'Fan items',case:'Case',repair:'Repair category',repairBonus:'Condition restored per part',parts:'Repair parts',yield:'Dismantling returns',shelves:'Trader supplies',count:'Quantity',chance:'Chance (%)',kit:'Required toolkit',book:'Required recipe book',cat:'Crafting category',stash:'Stash distribution',drop:'NPC drop chances',tier:'Tier',model:'Dropped model',modelPath:'Custom model path',own:'Enabled overrides',fit:'Icon fitting',zoom:'Scale',dx:'Horizontal offset',dy:'Vertical offset',band:'Layout width',rows:'Layout height',slots:'Pocket counts',grants:'Added pockets',pins:'Pocket positions',new:'Custom item',adopt:'Adopted item',borrowed:'Borrowed item',rect:'Source texture rectangle'};
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const button=(label,fn)=>{const b=node('button','tool',label);b.type='button';b.onclick=fn;return b;};
function coverItems(pack){return pack.items.slice(0,4);}
function geometry(entry){
 const it=entry.item;let rects=[],automatic=false;
 if(entry.kind==='boxes')rects=it.slots?.length?it.slots.map(s=>({x:s.c-1,y:s.r-1,w:s.w,h:s.h})):[{x:0,y:0,w:it.inw||1,h:it.inh||1}];
 else if(entry.kind==='rigs'&&it.pins?.length)rects=it.pins.map(p=>{const [h,w]=p.kind.split('x').map(Number);return {x:p.col-1,y:p.row-1,w,h};});
 else if(entry.kind==='rigs'||entry.kind==='pouches'){
  automatic=true;let x=0,y=0,line=0;
  for(const [shape,count] of Object.entries(it.grants||it.slots||{})){
   const [h,w]=shape.split('x').map(Number);if(!Number.isFinite(h)||!Number.isFinite(w))continue;
   for(let i=0;i<Math.min(100,count);i++){if(x+w>8){x=0;y+=line;line=0;}rects.push({x,y,w,h});x+=w;line=Math.max(line,h);}
  }
 }
 rects=rects.filter(r=>[r.x,r.y,r.w,r.h].every(Number.isFinite)&&r.x>=0&&r.y>=0&&r.w>0&&r.h>0&&r.x+r.w<=200&&r.y+r.h<=400);
 const width=Math.max(1,entry.kind==='boxes'?it.inw||1:0,...rects.map(r=>r.x+r.w));
 const height=Math.max(1,entry.kind==='boxes'?it.inh||1:0,...rects.map(r=>r.y+r.h));
 return {rects,width,height,automatic};
}
function picture(entry,large=false){
 const wrap=node('div','addon-picture'+(large?' large':''));const it=entry.item,original=root.ItemIcons?.original(it);
 if(it.icon&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(it.icon)){
  const img=node('img');img.src=it.icon;img.alt=it.name+' inventory icon';img.decoding='async';wrap.appendChild(img);
 }else if(original){const img=node('img');img.src=original;img.alt=(it.name||it.id)+' in-game icon';img.decoding='async';wrap.appendChild(img);}
 else wrap.appendChild(node('span','hint','No icon supplied'));
 return wrap;
}
function valueView(value,depth=0){
 if(value===null||value===undefined)return node('span',null,'Not set');
 if(typeof value!=='object')return node('span',null,typeof value==='boolean'?(value?'Yes':'No'):value);
 if(depth>8)return node('pre',null,JSON.stringify(value,null,2));
 if(Array.isArray(value)){
  if(!value.length)return node('span',null,'None');
  const list=node('ul','addon-values');for(const v of value){const li=node('li');li.appendChild(valueView(v,depth+1));list.appendChild(li);}return list;
 }
 const dl=node('dl','addon-settings');for(const [k,v] of Object.entries(value)){dl.appendChild(node('dt',null,names[k]||k));const dd=node('dd');dd.appendChild(valueView(v,depth+1));dl.appendChild(dd);}return dl;
}
function layoutView(entry){
 const {rects,width,height,automatic}=geometry(entry);const section=node('section','addon-section');section.appendChild(node('h3',null,entry.kind==='pouches'?'Pockets this pouch adds':'Storage layout'));
 if(!rects.length){section.appendChild(node('p','hint','No storage layout supplied.'));return section;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`-1 -1 ${width*32+2} ${height*32+2}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${width} columns by ${height} rows, ${rects.length} pockets`);svg.classList.add('addon-layout');svg.style.maxWidth=Math.min(720,width*40)+'px';
 for(const r of rects){const box=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v] of Object.entries({x:r.x*32+1,y:r.y*32+1,width:r.w*32-2,height:r.h*32-2}))box.setAttribute(k,String(v));box.setAttribute('class','addon-pocket');svg.appendChild(box);
  for(let x=1;x<r.w;x++)line(r.x*32+x*32,r.y*32+1,r.x*32+x*32,(r.y+r.h)*32-1);
  for(let y=1;y<r.h;y++)line(r.x*32+1,r.y*32+y*32,(r.x+r.w)*32-1,r.y*32+y*32);
 }
 function line(x1,y1,x2,y2){const l=document.createElementNS(svg.namespaceURI,'line');for(const [k,v] of Object.entries({x1,y1,x2,y2}))l.setAttribute(k,String(v));svg.appendChild(l);}
 section.appendChild(svg);section.appendChild(node('p','hint',automatic?'Pocket sizes shown; the game arranges their positions automatically.':`${width} columns × ${height} rows · ${rects.reduce((n,r)=>n+r.w*r.h,0)} usable cells`));return section;
}
function details(parent,entry,pack){
 const it=entry.item;const top=node('div','addon-item-heading');top.appendChild(picture(entry,true));const text=node('div');text.appendChild(node('h2',null,it.name||it.id));text.appendChild(node('p','hint',labels[entry.kind]||entry.kind));text.appendChild(node('p','addon-description',it.descr||'No description supplied.'));top.appendChild(text);parent.appendChild(top);
 if(['rigs','boxes','pouches'].includes(entry.kind))parent.appendChild(layoutView(entry));
 const facts={};for(const k of ['id','cost','weight','cellw','cellh','kg','takes','stack','model','modelPath'])if(it[k]!==undefined)facts[k]=it[k];parent.appendChild(valueView(facts));
 const craft=it.craft?.parts?.length?it.craft:entry.kind==='rigs'?EMIT.rigRecipe(it):entry.kind==='pouches'&&EMIT.ourPouch(it)?EMIT.pouchCraftOf(it):null;
 parent.appendChild(node('h3',null,'Crafting'));
 if(craft){parent.appendChild(node('p','hint',it.craft?.parts?.length?'Recipe supplied by the creator.':'Recipe calculated from this item’s pockets using the current editor.'));parent.appendChild(valueView({kit:craft.kit,book:craft.book,...(craft.cat?{cat:craft.cat}:{}),Ingredients:Object.fromEntries(craft.parts||[])}));}
 else parent.appendChild(node('p','hint','No crafting override in this add-on. Existing game recipes, if any, stay in effect.'));
 if(it.takes&&pack.families?.[it.takes]){parent.appendChild(node('h3',null,'Allowed contents'));parent.appendChild(valueView(pack.families[it.takes]));}
 const rest={};for(const [k,v] of Object.entries(it))if(!['icon','name','descr','craft','communitySource','iconNew',...Object.keys(facts)].includes(k))rest[k]=v;
 if(Object.keys(rest).length){parent.appendChild(node('h3',null,'Other supplied settings'));parent.appendChild(valueView(rest));}
 if(it.adopt)parent.appendChild(node('p','hint','This item comes from another mod. Only its enabled overrides are exported.'));
}
function dialog(title){
 const d=node('dialog','addon-dialog');d.setAttribute('aria-label',title);const head=node('div','addon-dialog-header');head.appendChild(node('strong',null,title));head.appendChild(button('Close preview',()=>d.close()));d.appendChild(head);const body=node('div','addon-dialog-body');d.appendChild(body);d.addEventListener('close',()=>d.remove(),{once:true});document.body.appendChild(d);return {d,body};
}
function openItem(entry,pack){const {d,body}=dialog(entry.item.name||entry.item.id);details(body,entry,pack);d.showModal();}
function openPack(result,onImport){
 ZB.validateAddon(result.pack);const {d,body}=dialog(result.listing.name||'Add-on contents');const pack=result.pack;
 body.appendChild(node('h2',null,result.listing.name||'Add-on contents'));body.appendChild(node('p','hint',`${pack.items.length} ${pack.items.length===1?'item':'items'} · ${result.listing.version||''}`));if(result.listing.description)body.appendChild(node('p','addon-description',result.listing.description));
 body.appendChild(node('p','hint','Click an item to inspect its texture, layout and settings. Your project stays unchanged until you confirm an import.'));
 const tiles=node('div','addon-tiles');for(const entry of pack.items){const tile=button('',()=>openItem(entry,pack));tile.className='addon-tile';tile.appendChild(picture(entry));tile.appendChild(node('strong',null,entry.item.name||entry.item.id));tile.appendChild(node('span','hint',labels[entry.kind]||entry.kind));tiles.appendChild(tile);}body.appendChild(tiles);
 if(onImport){const go=button('Choose items to import',()=>{d.close();onImport(result);});go.classList.add('primary');body.appendChild(go);}d.showModal();
}
// Limit concurrent full-pack downloads. A pack is loaded once per visible catalog render.
let active=0;const queue=[];
function schedule(fn){return new Promise((resolve,reject)=>{queue.push({fn,resolve,reject});pump();});}
function pump(){while(active<2&&queue.length){const job=queue.shift();active++;Promise.resolve().then(job.fn).then(job.resolve,job.reject).finally(()=>{active--;pump();});}}
function card(parent,listing,load,onImport){
 const cover=button('Loading item previews…',()=>show());cover.className='addon-cover';cover.setAttribute('aria-label','View '+listing.name);parent.parentElement.prepend(cover);
 let pending=null;
 const get=()=>pending||(pending=schedule(async()=>{const r=await load();ZB.validateAddon(r.pack);return r;}).catch(e=>{pending=null;throw e;}));
 const paint=async()=>{try{const r=await get();if(!cover.isConnected)return;cover.replaceChildren();cover.dataset.count=String(Math.min(4,r.pack.items.length));for(const entry of coverItems(r.pack))cover.appendChild(picture(entry));cover.appendChild(node('span','addon-count',`${r.pack.items.length} ${r.pack.items.length===1?'item':'items'}`));}catch{cover.textContent='Preview unavailable · click to retry';}};
 async function show(){try{const r=await get();if(parent.isConnected)openPack(r,onImport);}catch(e){cover.textContent=e.message+' · click to retry';}}
 const observer=new IntersectionObserver(entries=>{if(!cover.isConnected){observer.disconnect();return;}if(entries.some(x=>x.isIntersecting)){observer.disconnect();paint();}},{rootMargin:'150px'});observer.observe(cover);
 return show;
}
root.AddonPreview={coverItems,geometry,picture,layoutView,openItem,openPack,card};
})(globalThis);
