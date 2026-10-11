/* Independent additive items. No baseline files are exported. */
(function(root){
'use strict';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const clone=x=>JSON.parse(JSON.stringify(x));
function freshId(){if(!root.crypto?.randomUUID)throw Error('A secure browser connection is required to create an add-on ID.');return root.crypto.randomUUID();}
const categories={rigs:{code:'r',label:'rig'},boxes:{code:'b',label:'container'},pouches:{code:'p',label:'pouch'},packs:{code:'k',label:'backpack'}};
function customEntries(db,seed){return Object.keys(categories).flatMap(kind=>{const stock=new Set((seed[kind]||[]).map(r=>r.id));return (db[kind]||[]).filter(r=>!stock.has(r.id)&&!r.adopt&&!r.borrowed&&(kind!=='packs'||r.newItem)).map(item=>({kind,item}));});}
function custom(db,seed){return customEntries(db,seed).map(e=>e.item);}
function ensure(db,seed){
 if(!db.independentAddon)db.independentAddon={id:freshId(),name:'My add-on',version:'1.0',excluded:[]};
 const a=db.independentAddon;if(!uuid.test(a.id))throw Error('Invalid saved add-on ID.');
 a.excluded=a.excluded||[];const seen=new Set();
 for(const r of custom(db,seed)){if(!uuid.test(r.addonItemId||'')||seen.has(r.addonItemId))r.addonItemId=freshId();seen.add(r.addonItemId);}
 return a;
}
// Lossless base-36 encoding preserves BOTH UUIDs, including their full entropy.
// Fixed-width fields prevent ambiguous concatenation; 55 ASCII bytes including prefix.
function compact(hex){return BigInt('0x'+hex).toString(36).padStart(25,'0');}
function legacySectionId(a,r,kind='rigs'){return 'zb_'+a.id.replaceAll('-','')+'_'+categories[kind].code+r.addonItemId.replaceAll('-','');}
function safeReference(id){const m=/^zb_([a-f0-9]{32})_([rbpk])([a-f0-9]{32})$/.exec(id);return m?'zb_'+m[2]+compact(m[1])+'_'+compact(m[3]):id;}
function sectionId(a,r,kind='rigs'){
 if(!uuid.test(a.id)||!uuid.test(r.addonItemId)||!categories[kind])throw Error('Invalid add-on item identity.');
 return safeReference(legacySectionId(a,r,kind));
}
function upsert(text,id,key,value){if(EMIT.hasKey(text,id,key))return EMIT.setKey(text,id,key,value);return text.trimEnd()+'\r\n'+key+' = '+value+'\r\n';}
function plan(db,seed){
 const a=ensure(db,seed),chosen=customEntries(db,seed).filter(e=>!a.excluded.includes(e.item.addonItemId));
 if(!chosen.length)throw Error('Create and select at least one new item. Existing-item edits are not included.');
 if(chosen.length>20)throw Error('Select at most 20 new items per add-on.');
 const map=Object.fromEntries(chosen.map(({kind,item})=>[item.id,sectionId(a,item,kind)]));
 if(Object.keys(map).length!==chosen.length)throw Error('Two selected items use the same source ID. Rename one before exporting.');
 const migration=Object.fromEntries(chosen.map(({kind,item})=>[legacySectionId(a,item,kind),map[item.id]]));
 const allCustom=new Set(custom(db,seed).map(r=>r.id));
 const reference=id=>{if(allCustom.has(id)&&!map[id])throw Error('Select the custom item used by another item: '+id);return map[id]||safeReference(id);};
 const mini={rigs:[],boxes:[],pouches:[],packs:[],items:[],families:{},removed:[]};
 const families={...EMIT.readFamilies(seed.files['configs/items/amp_boxes.ltx']),...(db.families||{})};
 const entries=chosen.map(({kind,item:source})=>{
  const r=clone(source);r.id=map[source.id];
  r.name=String(r.name||'').trim()||'Custom '+categories[kind].label;
  r.descr=String(r.descr||'').trim()||(kind==='rigs'?'A chest rig with storage compartments. Equip it in the rig slot to use its storage.':'A custom '+categories[kind].label+' for carrying equipment and supplies.');
  if(!r.icon)throw Error(r.name+': add an icon before exporting.');
  r.cellw=r.cellw||2;r.cellh=r.cellh||(kind==='rigs'?3:2);
  for(const k of ['cellw','cellh'])if(r[k]>20)throw Error('Item icons can be at most 20 cells wide or tall.');
  if(r.craft?.parts)r.craft.parts=r.craft.parts.map(([id,n])=>[reference(id),n]);
  for(const k of ['parts','yield'])if(Array.isArray(r[k]))r[k]=r[k].map(reference);
  if(r.parent)r.parent=reference(r.parent);
  if(kind==='rigs'){
   if(!EMIT.cellsOf(r.slots))throw Error(r.name+': add at least one storage slot.');
   if(r.pins?.length){const occupied=new Set(),counts=Object.fromEntries(EMIT.KINDS.map(k=>[k,0]));
    if(!Number.isInteger(r.band)||r.band<1||r.band>100)throw Error('Invalid rig layout width.');
    for(const p of r.pins){counts[p.kind]++;const [h,w]=p.kind.split('x').map(Number);if(p.col+w-1>r.band)throw Error('A rig pocket extends beyond its layout width.');for(let y=p.row;y<p.row+h;y++)for(let x=p.col;x<p.col+w;x++){const key=x+','+y;if(occupied.has(key))throw Error('Rig pockets overlap.');occupied.add(key);}}
    for(const k of EMIT.KINDS)if(counts[k]!==Number(r.slots[k]||0))throw Error('Rig layout and slot counts disagree. Recheck the layout.');
   }
  }else if(kind==='pouches'){
   if(!EMIT.cellsOf(r.grants||{}))throw Error(r.name+': add at least one pouch storage slot.');
   if(!Number.isInteger(r.tier)||r.tier<1||r.tier>5)throw Error('Pouch tier must be from 1 to 5.');
  }else if(kind==='boxes'){
   for(const k of ['inw','inh','stack'])if(!Number.isInteger(r[k])||r[k]<1||r[k]>(k==='stack'?999:100))throw Error('Invalid container '+k+'.');
   const used=new Set();for(const p of r.slots||[]){for(const k of ['c','r','w','h'])if(!Number.isInteger(p[k])||p[k]<1)throw Error('Invalid container compartment.');if(p.c+p.w-1>r.inw||p.r+p.h-1>r.inh)throw Error('Container compartment extends beyond its layout.');for(let y=p.r;y<p.r+p.h;y++)for(let x=p.c;x<p.c+p.w;x++){const key=x+','+y;if(used.has(key))throw Error('Container compartments overlap.');used.add(key);}}
   const family=families[r.takes];
   if(family&&r.takes!=='any'){
    const key=r.id+'_rules',f=clone(family);
    for(const field of ['kinds','also','never'])f[field]=Array.isArray(f[field])?f[field]:EMIT.famList(f[field]);
    f.also=f.also.map(reference);f.never=f.never.map(reference);
    f.no=String(f.no||'That does not go in this container').replace(/[\r\n;]+/g,' ');
    mini.families[key]=f;r.takes=key;
   }else if(r.takes==='any'||r.takes==='anything'){r.takes=r.id+'_unrestricted';}
   else throw Error('Unknown container rule: '+r.takes);
  }else if(kind==='packs'){
   if(!/^[a-z][a-z0-9_]*$/.test(r.parent||''))throw Error('Choose a valid existing backpack parent section.');
   const size=EMIT.packSize(r.size);if(!size||size.cells>10000)throw Error('Enter a valid backpack storage size.');r.size=size.text;
  }
  if(r.craft?.parts?.length>4)throw Error(r.name+': crafting supports at most four ingredients.');
  for(const row of Object.values(r.shelves||{}))if(!Number.isInteger(row.count)||row.count<0||row.count>999||!Number.isFinite(row.chance)||row.chance<0||row.chance>100)throw Error('Invalid trader stock quantity or chance.');
  mini[kind].push(r);return {kind,item:r};
 });
 ZB.validate(mini);
 ZB.validateSpawnIds(mini);
 const existing=new Set(Object.keys(categories).flatMap(k=>(seed[k]||[]).map(r=>r.id)));
 for(const id of Object.values(map))if(existing.has(id))throw Error('Generated item ID collides with an existing item: '+id);
 for(const r of mini.rigs)if(EMIT.craftFields(r)>10)throw Error(r.name+': crafting supports at most four ingredients.');
 const items=entries.map(e=>e.item),suffix='zba_'+a.id.replaceAll('-',''),sheet='ui\\zonebench\\'+suffix;
 const packed=BUILD.itemSheetPlan({items},{});if(packed.overflow.length)throw Error('Selected icons do not fit on one texture sheet.');
 const files=[];const put=(path,text)=>files.push({name:'gamedata/'+path,bytes:BUILD.utf8(text)});
 let system='; Independent ZoneBench items. Requires Squared Away 2.0.4.\r\n';
 const pending=entries.slice(),done=new Set();
 while(pending.length){const i=pending.findIndex(e=>!items.some(x=>x.id===e.item.parent)||done.has(e.item.parent));if(i<0)throw Error('Backpack parents form an inheritance loop.');
  const {kind,item:r}=pending.splice(i,1)[0];let text='';
  if(kind==='rigs')text=EMIT.rigSystem({...mini,rigs:[r]},EMIT.cloneSection(seed.files['configs/mod_system_amp_rigs.ltx'],seed.rigs[0].id,r.id),packed.rects);
  else if(kind==='boxes'){
   const base=seed.boxes.find(b=>!b.borrowed&&!!b.fan===!!r.fan&&!!b.case===!!r.case)||seed.boxes.find(b=>!b.borrowed);
   text=EMIT.boxSystem({...mini,boxes:[r]},EMIT.cloneSection(seed.files['configs/mod_system_amp_boxes.ltx'],base.id,r.id),packed.rects);
  }else if(kind==='pouches')text=EMIT.pouchSystem({...mini,pouches:[r]},'',packed.rects);
  else text=EMIT.itemSystem({...mini,items:[],packs:[r]},'',packed.rects);
  if(!text.trim())throw Error('Item template unavailable: '+r.name);
  const keys={icons_texture:sheet,inv_grid_scale:2,inv_name:'st_'+r.id+'_name',inv_name_short:'st_'+r.id+'_name',description:'st_'+r.id+'_descr'};
  if(kind==='rigs'||kind==='boxes')Object.assign(keys,{class:'II_CONTR',dont_stack:'true'});
  if(kind==='rigs')Object.assign(keys,{slot:15,restore_slot_from_config:'true'});
  const model=r.model||(kind==='rigs'?'rig':kind==='boxes'?'box':'original');
  if(model==='custom')keys.visual=r.modelPath.replaceAll('/','\\');else if(ZB.models[model])keys.visual=ZB.models[model].visual;
  for(const [k,v] of Object.entries(keys))text=upsert(text,r.id,k,v);
  system+=text+'\r\n';done.add(r.id);
 }
 put('configs/mod_system_'+suffix+'.ltx',system);
 put('configs/mod_sqa_addons_'+suffix+'.ltx',['rigs','pouches'].map(kind=>'!['+kind+']\r\n'+mini[kind].map(r=>r.id+' = true').join('\r\n')).join('\r\n\r\n')+'\r\n');
 let craft='![2]\r\n'+mini.rigs.map(EMIT.craftLine).join('\r\n')+'\r\n';craft=EMIT.pouchCraft(mini,craft);
 const generic=entries.filter(e=>!['rigs','pouches'].includes(e.kind)&&e.item.craft?.parts?.length).map(e=>({...e.item,newItem:true}));
 if(generic.length){const groups={'2':[craft.replace(/^!\[2\]\s*/, '')]};const extra=EMIT.itemCraft({items:generic,packs:[]},'');
  for(const section of extra.trim().split(/(?=^!\[)/m).filter(Boolean)){const match=section.match(/^!\[(\d+)\]([\s\S]*)/);if(match)(groups[match[1]] ||= []).push(match[2].trim());}
  craft=Object.keys(groups).sort().map(k=>'!['+k+']\r\n'+groups[k].join('\r\n')).join('\r\n\r\n')+'\r\n';
 }
 if(entries.some(e=>e.kind==='rigs'||e.kind==='pouches')||generic.length)put('configs/items/settings/mod_craft_'+suffix+'.ltx',craft);
 if(mini.rigs.length)put('configs/items/settings/mod_parts_'+suffix+'.ltx',EMIT.parts(mini,'![con_parts_list]\r\n\r\n![nor_parts_list]\r\n'));
 put('configs/items/settings/mod_death_items_'+suffix+'.ltx','![keep_items]\r\n'+items.map(r=>r.id+' = true').join('\r\n')+'\r\n');
 const loot=entries.filter(e=>e.kind==='rigs'||e.kind==='pouches').map(e=>({r:e.item,tier:e.kind==='rigs'?EMIT.tierOf(e.item.slots):e.item.tier}));
 if(loot.length)put('configs/items/settings/mod_grok_items_tier_'+suffix+'.ltx',loot.map(({r,tier})=>'['+r.id+']\r\ntier = '+(r.stash==='none'?5:tier)).join('\r\n\r\n')+'\r\n');
 const stash=loot.filter(({r,tier})=>r.stash!=='none'&&tier<5);
 if(stash.length)put('configs/items/settings/mod_grok_treasure_manager_'+suffix+'.ltx','![possible_items]\r\n'+stash.map(({r})=>r.id).join('\r\n')+'\r\n');
 put('configs/mod_sortingplus_'+suffix+'.ltx','![kind_overrides]\r\n'+entries.map(({kind,item:r})=>r.id+' = '+(kind==='rigs'?'o_light':kind==='packs'?'i_backpack':'i_attach')).join('\r\n')+'\r\n');
 if(Object.keys(mini.families).length)put('configs/items/mod_amp_boxes_'+suffix+'.ltx',EMIT.boxRules(mini,''));
 if(mini.packs.length)put('configs/items/settings/mod_zzz_grid_packs_'+suffix+'.ltx','![grid_pack_section]\r\n'+mini.packs.map(r=>r.id+' = '+r.size).join('\r\n')+'\r\n');
 for(const [shelf,traders] of Object.entries(EMIT.SHELF_FILES)){
  const stocked=items.filter(r=>r.shelves?.[shelf]?.count>0&&r.shelves[shelf].chance>0);
  if(stocked.length)for(const trader of traders)put('configs/items/trade/mod_'+trader+'_'+suffix+'.ltx','![supplies_1]\r\n'+stocked.map(r=>r.id+' = '+r.shelves[shelf].count+', '+r.shelves[shelf].chance/100).join('\r\n')+'\r\n');
 }
 for(const lang of ['eng','rus','spa','ukr']){
  const text=EMIT.textFile(mini,'<?xml version="1.0" encoding="utf-8"?>\n<string_table>\n</string_table>\n',{},[]);
  files.push({name:'gamedata/configs/text/'+lang+'/'+suffix+'.xml',bytes:BUILD.stringTable(text,lang)});
 }
 const pictures=items.map(r=>({icon:r.icon,fit:r.fit,rect:packed.rects[r.id]}));
 const pow=n=>2**Math.ceil(Math.log2(Math.max(4,n)));
 const width=pow(Math.max(...pictures.map(e=>(e.rect.x+e.rect.w)*50))),height=pow(Math.max(...pictures.map(e=>(e.rect.y+e.rect.h)*50)));
 const texture='gamedata/textures/ui/zonebench/'+suffix+'.dds';
 const manifest={format:'zonebench-independent-addon',version:1,exportRevision:Math.max(2,globalThis.ZonebenchExportRevision||0),sectionIdFormat:2,sectionMigration:migration,id:a.id,name:a.name,addonVersion:a.version,requires:'Squared Away 2.0.4',items:chosen.map(({kind,item:r},i)=>({sourceId:r.id,id:entries[i].item.id,name:entries[i].item.name,kind})),texture:{path:texture,width,height},files:[...files.map(f=>f.name),texture]};
 const dependencies=new Map();for(const {item:r} of chosen)for(const [id] of r.craft?.parts||[]){const dep=r.recipeDependencies?.[id];if(dep?.id)dependencies.set(dep.id,{id:dep.id,name:String(dep.name||dep.id),version:String(dep.version||'')});}if(dependencies.size)manifest.requiredAddons=[...dependencies.values()];
 return {files,entries:pictures,width,height,texture,manifest};
}
async function build(db,seed){const p=plan(db,seed),canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;const ctx=canvas.getContext('2d');
 for(const e of p.entries){const r=e.rect,img=await BUILD.fitPicture(e.icon,r.w*50,r.h*50,e.fit,false);ctx.putImageData(img,r.x*50,r.y*50);}
 p.files.push({name:p.texture,bytes:BUILD.ddsFrom(ctx.getImageData(0,0,p.width,p.height))});
 p.files.push({name:'SECTION-MIGRATION.json',bytes:BUILD.utf8(JSON.stringify(p.manifest.sectionMigration,null,2))});
 p.files.push({name:'SAVE-COMPATIBILITY.txt',bytes:BUILD.utf8('This export uses save-safe item section IDs. If replacing an older ZoneBench export, existing saves containing its old IDs need offline migration BEFORE loading. Re-downloading alone does not repair those saves. Keep the original save and add-on backup. SECTION-MIGRATION.json maps old sections to new sections. Do not keep the old add-on enabled alongside this replacement. Dependencies created by the old exporter must also be re-exported and migrated together. New playthroughs do not need save migration.\n')});
 p.files.push({name:'addon.json',bytes:BUILD.utf8(JSON.stringify(p.manifest,null,2))});
 if(p.manifest.requiredAddons?.length)p.files.push({name:'REQUIRED-ADDONS.txt',bytes:BUILD.utf8('Enable these add-ons alongside this item. Its crafting recipe uses their items.\n'+p.manifest.requiredAddons.map(x=>x.name+' ('+x.version+') - '+x.id).join('\n'))});
 p.files.push({name:'INSTALL.txt',bytes:BUILD.utf8('SQUARED AWAY INDEPENDENT ADD-ON\nInstall below Squared Away 2.0.4 in MO2. Multiple independent add-ons may be enabled together. Keep the Squared Away 2.0.3 engine.\nReplace this add-on to update it; keep its ID. Save your ZoneBench project before making another add-on.\nExports selected NEW rigs, containers, pouches and backpacks. Existing-item edits and global settings are excluded. Models are supplied by Squared Away. Custom model paths require their own assets.\nDo not remove an add-on while that save still contains its items.\n')});
 return {blob:BUILD.zip(p.files),manifest:p.manifest,files:p.files};
}
function render(P,db,seed,save,legacy){
 const a=ensure(db,seed),node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 P.appendChild(node('h1','Export independent add-on'));
 P.appendChild(node('p','Export selected new rigs, containers, pouches and backpacks with their own files. Requires Squared Away 2.0.4. Existing-item edits and global settings are not included.'));
 const card=node('section');card.className='card';P.appendChild(card);
 for(const [key,label] of [['name','Add-on name'],['version','Version']]){const wrap=node('label',label+' '),input=node('input');input.type='text';input.value=a[key];input.maxLength=80;input.setAttribute('aria-label',label);input.onchange=()=>{a[key]=input.value.trim()|| (key==='name'?'My add-on':'1.0');save();};wrap.appendChild(input);card.appendChild(wrap);}
 card.appendChild(node('p','Permanent ID: '+a.id));
 const candidates=custom(db,seed);card.appendChild(node('h2','New items to include'));
 if(!candidates.length)card.appendChild(node('p','Create a new rig, container, pouch or backpack in the editor first. Base-mod items are never included.'));
 for(const r of candidates){const label=node('label'),check=node('input');check.type='checkbox';check.checked=!a.excluded.includes(r.addonItemId);check.onchange=()=>{a.excluded=a.excluded.filter(id=>id!==r.addonItemId);if(!check.checked)a.excluded.push(r.addonItemId);save();preview();};label.style.display='block';label.append(check,node('span',' '+(r.name||r.id)));card.appendChild(label);}
 const info=node('details');info.appendChild(node('summary','Files in this add-on'));const listing=node('pre');listing.style.whiteSpace='pre-wrap';listing.style.overflowWrap='anywhere';info.appendChild(listing);P.appendChild(info);
 const status=node('p');status.setAttribute('role','status');P.appendChild(status);
 const button=node('button','Download independent add-on ZIP');button.className='tool primary';P.appendChild(button);
 function preview(){try{const p=plan(db,seed);listing.textContent=p.manifest.files.join('\n')+'\naddon.json\nINSTALL.txt';status.textContent=p.manifest.items.length+' item(s); texture '+p.width+' × '+p.height+' px. No base-mod files are replaced.';button.disabled=false;}catch(e){listing.textContent='';status.textContent=e.message;button.disabled=true;}}
 button.onclick=async()=>{button.disabled=true;try{await save();const result=await build(db,seed);const blob=await result.blob,link=node('a');link.href=URL.createObjectURL(blob);link.download=root.ZonebenchAddonFilename?root.ZonebenchAddonFilename(a.name,a.version):'ZoneBench-'+a.id+'.zip';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),8000);status.textContent='Downloaded. Install this ZIP below Squared Away 2.0.4 in MO2.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
 const duplicate=node('button','Start a separate add-on ID');duplicate.className='tool';duplicate.onclick=async()=>{if(!confirm('Save your project first if you want to update this add-on later. Start a separate add-on using the current items and a new ID?'))return;a.id=freshId();await save();renderPane();};P.appendChild(duplicate);
 const old=node('details');old.appendChild(node('summary','Legacy full-project export'));old.appendChild(node('p','The older exporter replaces shared files and cannot be stacked with other full-project exports. It is not used for this test.'));const b=node('button','Open legacy exporter');b.className='tool';b.onclick=()=>{P.replaceChildren();legacy(P);};old.appendChild(b);P.appendChild(old);preview();
}
root.AddonExport={ensure,custom,plan,build,render,sectionId,safeReference};
})(globalThis);

