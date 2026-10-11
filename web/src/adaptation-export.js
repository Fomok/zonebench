/* Existing sections keep their identity. Export only this compatibility patch. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const kinds=['rigs','boxes','pouches','packs','items'];
const idPattern=/^[a-z][a-z0-9_]*$/;
function plan(db,seed,kind,source){
 if(!kinds.includes(kind)||!source?.adopt)throw Error('Select an adapted item.');
 if(!idPattern.test(source.id||''))throw Error('Enter the exact existing item section ID.');
 ZB.spawnId(source.id);
 if(kinds.flatMap(k=>db[k]||[]).filter(x=>x.id===source.id).length>1)throw Error('More than one project item uses this section ID.');
 const r=clone(source),own=r.own||{},mini={rigs:[],boxes:[],pouches:[],packs:[],items:[],families:{},removed:[]};
 if(!source.adaptationId)source.adaptationId=crypto.randomUUID();
 if(!/^[a-f0-9-]{36}$/.test(source.adaptationId))throw Error('Invalid adaptation ID.');
 const suffix='zbad_'+source.adaptationId.replaceAll('-',''),files=[];
 const put=(path,text)=>{if(text.trim())files.push({name:'gamedata/'+path,bytes:BUILD.utf8(text)});};
 const block=(section,keys)=>'!['+section+']\r\n'+Object.entries(keys).map(([k,v])=>k+' = '+v).join('\r\n')+'\r\n';
 // Reuse the current item validator, including geometric validation, without exporting its generated identities/artwork.
 const check=clone(r);delete check.adopt;delete check.borrowed;check.new=true;check.icon=check.icon||seed.rigs.find(x=>x.icon).icon;check.name=check.name||check.id;
 if(kind==='packs'){check.newItem=true;check.parent='equ_military_pack';check.id='zb_validation_'+suffix;}
 if(!own.craft)delete check.craft;
 const checkdb={...mini,[kind]:[check],families:db.families||{}};
 if(kind!=='items')AddonExport.plan(checkdb,{...seed,[kind]:(Array.isArray(seed[kind])?seed[kind]:[]).filter(item=>item.id!==check.id)});
 mini[kind].push(r);
 ZB.validateSpawnIds(mini);
 let keys={};
 if(kind==='rigs'||kind==='pouches')keys=Object.fromEntries(EMIT.adoptKeys(r));
 if(kind==='boxes'){
  keys={amp_box:true,amp_box_takes:r.takes||'any',amp_box_snd:r.snd||'chest',amp_box_w:r.inw,amp_box_h:r.inh,amp_box_stack:r.stack||1,amp_box_cells:false,amp_box_slots:'',amp_box_noweight:r.kg==null,amp_box_kg:r.kg==null?0:r.kg};
  if(r.slots?.length)keys.amp_box_slots=r.slots.map(x=>[x.c,x.r,x.w,x.h].join(',')).join(' | ');
  const family={...EMIT.readFamilies(seed.files['configs/items/amp_boxes.ltx']),...(db.families||{})}[r.takes];
  if(r.takes==='any'||r.takes==='anything')keys.amp_box_takes=suffix+'_unrestricted';
  else if(family){keys.amp_box_takes=suffix+'_rules';mini.families[keys.amp_box_takes]=clone(family);put('configs/items/mod_amp_boxes_'+suffix+'.ltx',EMIT.boxRules(mini,''));}
  else throw Error('Unknown container rule: '+r.takes);
 }
 if(['rigs','boxes','pouches'].includes(kind)){
  Object.assign(keys,{class:kind==='pouches'?'II_ATTCH':'II_CONTR',belt:false,dont_stack:true,amp_rig:kind==='rigs',amp_box:kind==='boxes',amp_pouch:kind==='pouches',slot:kind==='rigs'?15:-1,restore_slot_from_config:true});
  if(kind==='rigs'&&!r.pins?.length)keys.amp_layout='';
  const use='zzz_armor_mag_pouches.'+(kind==='pouches'?'pouch_no_install':'rig_no_install');keys.use1_functor=use;keys.use1_action_functor=use;
 }
 if(own.name){keys.inv_name='st_'+r.id+'_name';keys.inv_name_short=keys.inv_name;keys.description='st_'+r.id+'_descr';if(!r.descr)r.descr='An adapted '+({rigs:'chest rig',boxes:'container',pouches:'expansion pouch',packs:'backpack'}[kind])+'.';}
 if(own.price){keys.cost=Math.round(r.cost||0);keys.inv_weight=r.weight||0;}
 let picture;
 if(own.look){
  if(!r.icon)throw Error('Add a replacement picture, or turn off the picture override.');
  const packed=BUILD.itemSheetPlan({items:[r]},{}),rect=packed.rects[r.id];
  if(!rect||packed.overflow.length)throw Error('Replacement icon does not fit.');
  Object.assign(keys,{icons_texture:'ui\\zonebench\\'+suffix,inv_grid_scale:2,inv_grid_x:rect.x,inv_grid_y:rect.y,inv_grid_width:rect.w,inv_grid_height:rect.h});
  picture={icon:r.icon,fit:r.fit,rect};
 }
 if(Object.keys(keys).length)put('configs/mod_system_zzz_'+suffix+'.ltx',block(r.id,keys));
 if(kind==='packs'&&own.size)put('configs/items/settings/mod_zzz_grid_packs_'+suffix+'.ltx',block('grid_pack_section',{[r.id]:r.size}));
 if(own.drops&&['rigs','pouches'].includes(kind)){
  put('configs/mod_sqa_addons_'+suffix+'.ltx',block(kind,{[r.id]:true}));
  put('configs/items/settings/mod_death_items_'+suffix+'.ltx',block('keep_items',{[r.id]:true}));
 }
 if(own.drops&&!['rigs','pouches'].includes(kind))throw Error('NPC drop registration is available for rigs and pouches. Use the source mod distribution or trader settings for this item.');
 if(own.craft){
  let craft;
  if(kind==='rigs')craft='![2]\r\n'+EMIT.craftLine(r)+'\r\n';
  else if(kind==='pouches')craft=EMIT.pouchCraft(mini,'![2]\r\n');
  else craft=EMIT.itemCraft({items:[r],packs:[]},'');
  put('configs/items/settings/mod_craft_'+suffix+'.ltx',craft);
 }
 if(kind==='rigs'&&own.repair)put('configs/items/settings/mod_parts_'+suffix+'.ltx',EMIT.parts(mini,'![con_parts_list]\r\n\r\n![nor_parts_list]\r\n'));
 if(own.shelves)for(const [shelf,traders] of Object.entries(EMIT.SHELF_FILES)){
  const row=r.shelves?.[shelf];if(row?.count>0&&row.chance>0)for(const trader of traders)put('configs/items/trade/mod_'+trader+'_'+suffix+'.ltx',block('supplies_1',{[r.id]:row.count+', '+row.chance/100}));
 }
 if(own.name)for(const lang of ['eng','rus','spa','ukr'])files.push({name:'gamedata/configs/text/'+lang+'/'+suffix+'.xml',bytes:BUILD.stringTable(EMIT.textFile(mini,'<?xml version="1.0" encoding="utf-8"?><string_table></string_table>',{},[]),lang)});
 if(!files.length)throw Error('Choose at least one property to adapt.');
 const manifest={format:'zonebench-adaptation',version:1,id:source.adaptationId,name:r.name||r.id,addonVersion:'1.0',sourceSection:r.id,kind,requires:'Squared Away 2.0.6 and the mod that defines '+r.id,files:files.map(f=>f.name)};
 return {files,picture,texture:'gamedata/textures/ui/zonebench/'+suffix+'.dds',manifest};
}
async function materialize(p){
 if(p.picture){const e=p.picture,w=2**Math.ceil(Math.log2(Math.max(4,(e.rect.x+e.rect.w)*50))),h=2**Math.ceil(Math.log2(Math.max(4,(e.rect.y+e.rect.h)*50))),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),im=await BUILD.fitPicture(e.icon,e.rect.w*50,e.rect.h*50,e.fit,false);ctx.putImageData(im,e.rect.x*50,e.rect.y*50);p.files.push({name:p.texture,bytes:BUILD.ddsFrom(ctx.getImageData(0,0,w,h))});p.manifest.files.push(p.texture);}
 return p;
}
async function build(db,seed,kind,item){
 const p=await materialize(plan(db,seed,kind,item));
 p.files.push({name:'adaptation.json',bytes:BUILD.utf8(JSON.stringify(p.manifest,null,2))},{name:'INSTALL.txt',bytes:BUILD.utf8('SQUARED AWAY ITEM ADAPTATION\nRequires the installed source item: '+item.id+'\nInstall below Squared Away and the mod defining that item in MO2. This changes the existing section, not a new item. Different patches for the same item can conflict.\nRigs and containers change engine class. Test with newly spawned items on a separate save; existing instances may not convert safely. Other mods may require script compatibility changes.\nNo source textures are bundled unless explicitly replaced. Only selected overrides are included. NPC drops use Squared Away rank/tier settings when opted in.\n')});
 return {blob:BUILD.zip(p.files),manifest:p.manifest};
}
async function download(db,seed,kind,item){const result=await build(db,seed,kind,item);touch();const url=URL.createObjectURL(await result.blob),link=document.createElement('a');link.href=url;link.download=root.ZonebenchAddonFilename((item.name||item.id)+' adaptation','1.0');document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function isUserAdaptation(seed,kind,item){
 if(!item.adopt)return false;
 const baseline=Array.isArray(seed[kind])?seed[kind]:[];
 if(baseline.some(base=>base.id===item.id))return false;
 if(kind==='packs'&&EMIT.readPacks(seed.files?.['configs/items/settings/zzz_grid_packs.ltx']||'').sec[item.id]!==undefined)return false;
 return !!(item.adaptationId||item.new);
}
function entries(db,seed,{includeDrafts=false}={}){return kinds.flatMap(kind=>(db[kind]||[]).filter(item=>isUserAdaptation(seed,kind,item)&&(includeDrafts||item.adaptationSaved!==false)).map(item=>({kind,item})));}
function packagePlan(db,seed,selected,options={}){
 if(!selected.length)throw Error('Select at least one adapted item.');
 const name=String(options.name||'').trim(),version=String(options.version||'').trim();
 if(!name||!version)throw Error('Enter a package name and version.');
 const seen=new Set(),paths=new Set(),plans=[];
 for(const entry of selected){
  if(!isUserAdaptation(seed,entry.kind,entry.item)||entry.item.adaptationSaved===false)throw Error('Save this adaptation to the adapted items library first.');
  if(!(db[entry.kind]||[]).includes(entry.item))throw Error('Selected item is no longer in this project.');
  if(seen.has(entry.item.id))throw Error('The same source item is selected more than once.');seen.add(entry.item.id);
  const p=plan(db,seed,entry.kind,entry.item);
  for(const path of [...p.manifest.files,...(p.picture?[p.texture]:[])]){if(paths.has(path))throw Error('Two adaptations have the same file identity. Recreate one adaptation before exporting.');paths.add(path);}
  plans.push(p);
 }
 return {plans,manifest:{format:'zonebench-adaptation-package',version:1,name,addonVersion:version,items:plans.map(p=>p.manifest),requires:'Squared Away 2.0.6 and all source mods',files:[...paths]}};
}
async function buildPackage(db,seed,selected,options){
 const result=packagePlan(db,seed,selected,options),files=[];
 for(const p of result.plans){await materialize(p);files.push(...p.files);}
 files.push({name:'adaptation.json',bytes:BUILD.utf8(JSON.stringify(result.manifest,null,2))},{name:'INSTALL.txt',bytes:BUILD.utf8('SQUARED AWAY ADAPTATION PACKAGE\nInstall below Squared Away and ALL source mods in MO2.\nRequired original item sections:\n'+selected.map(e=>e.item.id).join('\n')+'\nThis changes existing items. Patches targeting the same item can conflict. Test converted rigs and containers with newly spawned items on a separate save.\n')});
 return {blob:BUILD.zip(files),manifest:result.manifest};
}
async function downloadPackage(db,seed,selected,options){const result=await buildPackage(db,seed,selected,options);touch();const url=URL.createObjectURL(await result.blob),link=document.createElement('a');link.href=url;link.download=root.ZonebenchAddonFilename(result.manifest.name,result.manifest.addonVersion);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
root.AdaptationExport={materialize,plan,build,download,isUserAdaptation,entries,packagePlan,buildPackage,downloadPackage};
})(globalThis);
