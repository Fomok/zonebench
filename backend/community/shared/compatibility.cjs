(function(root){
'use strict';
const ranks=['novice','trainee','experienced','professional','veteran','expert','master','legend'];
const stock=['af_magpouch_s','af_magpouch_m','af_magpouch_l'];
const shapes=['2x2','3x1','2x1','1x1'];
const idPattern=/^[a-z][a-z0-9_]*$/;
const models={
 rig:{label:'Shared chest rig',visual:'squared_away\\rig_shared',files:['meshes/squared_away/rig_shared.ogf','textures/squared_away/rig_import_v4.dds']},
 box:{label:'Shared storage case',visual:'squared_away\\box_shared',files:['meshes/squared_away/box_shared.ogf','textures/squared_away/box_import_v1.dds']}
};
function walk(value,depth=0,key=''){
 if(depth>24)throw new Error('Project nesting is too deep.');
 if(typeof value==='number' && !Number.isFinite(value))throw new Error('Project contains an invalid number.');
 if(typeof value==='string'){
  if(value.length>6000000)throw new Error('A project field is too large.');
  if(key==='icon' && value && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value))throw new Error('Item pictures must be embedded PNG, JPEG or WebP images.');
 }
 if(value && typeof value==='object') for(const [k,v] of Object.entries(value)){
  if(['__proto__','constructor','prototype'].includes(k))throw new Error('Invalid project key.');
  if(!['files','uibase'].includes(k))walk(v,depth+1,k);
 }
}
function identifier(id){if(!idPattern.test(id||''))throw new Error('Invalid item section: '+String(id).slice(0,80));}
// Keep import validation permissive so old projects can be opened and repaired.
// Apply this at export boundaries, never to localization keys or texture paths.
function spawnId(id){identifier(id);if(id.length>63)throw Error('Item section exceeds the engine save limit of 63 ASCII bytes: '+id);}
function validateSpawnIds(db){
 const seen=new Set();
 for(const kind of ['rigs','boxes','pouches','packs','items'])for(const it of db[kind]||[]){
  spawnId(it.id);if(seen.has(it.id))throw Error('Duplicate exported item section: '+it.id);seen.add(it.id);
  if(it.parent)spawnId(it.parent);
  for(const [id] of it.craft?.parts||[])spawnId(id);
  for(const field of ['parts','yield'])for(const id of it[field]||[])spawnId(id);
 }
 return db;
}
function whole(n,min,max,label){if(!Number.isInteger(n)||n<min||n>max)throw new Error(label+' must be a whole number from '+min+' to '+max+'.');}
function item(it,kind){
 if(!it || typeof it!=='object')throw new Error('Invalid item.');
 identifier(it.id);
 if(!['rigs','boxes','pouches','packs','items'].includes(kind))throw new Error('Unknown item category.');
 if(it.model==='custom' && !/^[a-zA-Z0-9_\-/\\]+$/.test(it.modelPath||''))throw new Error('Use a game-relative model path without an extension.');
 if(it.model && !['rig','box','custom','original'].includes(it.model))throw new Error('Unknown world model.');
 for(const field of ['weight','cost','kg'])if(it[field]!=null && (!Number.isFinite(it[field])||it[field]<0))throw new Error(it.id+': '+field+' must be non-negative.');
 for(const field of ['cellw','cellh','inw','inh'])if(it[field]!=null)whole(it[field],1,40,it.id+' '+field);
 for(const field of ['slots','grants'])if(it[field] && !Array.isArray(it[field]))for(const [key,n] of Object.entries(it[field])){if(!shapes.includes(key))throw new Error('Unsupported pocket shape.');whole(n,0,100,'Pocket count');}
 if(it.pins)for(const pin of it.pins){if(!shapes.includes(pin.kind))throw new Error('Unsupported pocket shape.');whole(pin.col,1,100,'Pocket column');whole(pin.row,1,100,'Pocket row');}
 for(const field of ['takes','repair','snd'])if(it[field]!=null && !/^[a-zA-Z0-9_]+$/.test(it[field]))throw new Error('Invalid '+field+' value.');
 if(it.craft && it.craft.parts)for(const part of it.craft.parts){identifier(part[0]);whole(part[1],1,999,'Ingredient count');}
 if(it.craft && it.craft.book)identifier(it.craft.book);
 for(const field of ['parts','yield'])if(Array.isArray(it[field]))for(const id of it[field])identifier(id);
}
function validate(db){
 walk(db);const seen=new Set();
 for(const kind of ['rigs','boxes','pouches']){
  if(!Array.isArray(db[kind])||db[kind].length>400)throw new Error('Project needs a valid '+kind+' list (maximum 400).');
  for(const it of db[kind]){item(it,kind);if(seen.has(it.id))throw new Error('Duplicate item section: '+it.id);seen.add(it.id);}
 }
 for(const kind of ['packs','items'])if(Array.isArray(db[kind]))for(const it of db[kind])item(it,kind);
 for(const entry of db.removed||[])identifier(entry.id);
 for(const [name,family] of Object.entries(db.families||{})){
  identifier(name);
  for(const field of ['kinds','also','never'])for(const value of family[field]||[])identifier(value);
 }
 for(const rank of ranks){
  const row=db.drops?.[rank];if(row){if(row.tier?.length!==5||row.pouch?.length!==3)throw new Error('Invalid drop table.');for(const n of [...row.tier,...row.pouch])whole(n,0,100,'Drop chance');}
  const cond=db.cond?.[rank];if(cond){if(cond.length!==2)throw new Error('Invalid condition range.');cond.forEach(n=>whole(n,0,100,'Condition'));if(cond[0]>cond[1])throw new Error('Worst condition exceeds best condition for '+rank+'.');}
 }
 return db;
}
function validateAddon(pack){
 walk(pack);if(pack?.bench!=='zonebench-items'||pack.version!==1||!Array.isArray(pack.items)||pack.items.length>100)throw new Error('This is not a supported item pack.');
 const db={rigs:[],boxes:[],pouches:[],packs:[],items:[],families:pack.families||{}};
 for(const entry of pack.items){item(entry.item,entry.kind);db[entry.kind].push(entry.item);}validate(db);return pack;
}
function lua(value){
 if(value===null||value===undefined)return 'nil';
 if(typeof value==='boolean'||typeof value==='number')return String(value);
 if(typeof value==='string')return '"'+value.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r')+'"';
 if(Array.isArray(value))return '{'+value.map(lua).join(',')+'}';
 return '{'+Object.entries(value).map(([k,v])=>'['+lua(k)+']='+lua(v)).join(',')+'}';
}
function compatibilityFiles(db){
 validate(db);validateSpawnIds(db);
 const removed=Object.fromEntries((db.removed||[]).map(x=>[x.id,true]));
 const rigs=db.rigs.filter(x=>!x.adopt||root.EMIT.owns(x,'drops')).map(x=>({id:x.id,tier:root.EMIT.tierOf(x.slots)}));
 const pouches=db.pouches.filter(x=>!stock.includes(x.id)&&(!x.adopt||root.EMIT.owns(x,'drops'))).map(x=>x.id);
 const drops={};for(const rank of ranks)if(db.drops?.[rank])drops[rank]=[...db.drops[rank].tier,...db.drops[rank].pouch];
 const data={rigs,pouches,removed,drops,condition:db.cond||{}};
 const script=`-- ZoneBench registration only. Requires Squared Away 2.0.
local settings = ${lua(data)}
function on_game_start()
 local mod = zzz_armor_mag_pouches
 if not (mod and mod.amp_wd_seam) then
  if printf then printf("! ZoneBench: matching Squared Away runtime is required") end
  return
 end
 local A = mod.amp_wd_seam()
 if not A or A.zonebench_registered then return end
 A.zonebench_registered = true
 local original_rigs = A.rigs_at
 A.rigs_at = function(tier)
  local list, seen = {}, {}
  for _, id in ipairs(original_rigs(tier) or {}) do
   if not settings.removed[id] then list[#list+1]=id; seen[id]=true end
  end
  for _, rig in ipairs(settings.rigs) do
   if rig.tier == tier and not seen[rig.id] and not settings.removed[rig.id] then list[#list+1]=rig.id; seen[rig.id]=true end
  end
  return list
 end
 local seen = {}
 A.POUCHES = A.POUCHES or {}
 for _, id in ipairs(A.POUCHES) do seen[id]=true end
 for _, id in ipairs(settings.pouches) do
  if not seen[id] then A.POUCHES[#A.POUCHES+1]=id; seen[id]=true end
 end
 A.pouches_by_col = nil
 local original_pouches = A.pouches_at
 A.pouches_at = function(col)
  local list = {}
  for _, id in ipairs(original_pouches(col) or {}) do
   if not settings.removed[id] then list[#list+1]=id end
  end
  return list
 end
 for rank, row in pairs(settings.drops) do A.DROP_DEF[rank]=row end
 for rank, row in pairs(settings.condition) do A.DROP_COND[rank]=row end
end
`;
 const lines=['; ZoneBench native slots, pouch grants and dropped models.'];
 for(const [kind,items] of [['rigs',db.rigs],['boxes',db.boxes],['pouches',db.pouches]])for(const it of items){
  lines.push('', '!['+it.id+']');
  if(kind==='rigs' || kind==='boxes')lines.push('class = II_CONTR','dont_stack = true');
  if(kind==='rigs')lines.push('slot = 15','restore_slot_from_config = true');
  if(kind==='pouches'){
   lines.push('amp_pouch = true','amp_pouch_tier = '+Math.max(1,Math.min(5,it.tier||3)));
   for(const shape of shapes)lines.push('amp_pgrant_'+shape+' = '+(it.grants?.[shape]||0));
  }
  const model=it.model||(kind==='rigs'?'rig':kind==='boxes'?'box':'original');
  if(models[model])lines.push('visual = '+models[model].visual);
  else if(model==='custom')lines.push('visual = '+it.modelPath.replaceAll('/','\\'));
 }
 return [{name:'scripts/zzz_amp_zonebench.script',text:script},{name:'configs/mod_system_zzzzzz_zonebench.ltx',text:lines.join('\r\n')+'\r\n'}];
}
async function modelFiles(db){
 const paths=new Set();for(const kind of ['rigs','boxes'])for(const it of db[kind]){
  const model=it.model||(kind==='rigs'?'rig':'box');for(const path of models[model]?.files||[])paths.add(path);
 }
 return Promise.all([...paths].map(async path=>{const response=await fetch('assets/models/'+path);if(!response.ok)throw new Error('Could not load model '+path+'. Retry when connected.');return {name:'gamedata/'+path,bytes:new Uint8Array(await response.arrayBuffer())};}));
}
root.ZB={spawnId,validateSpawnIds,validate,validateAddon,compatibilityFiles,modelFiles,models,installNotes:`ZONEBENCH EXPORT\nRequires Squared Away 2.0 or a compatible later build, its custom engine, and the selected item dependencies.\nInstall this ZIP as a separate MO2 mod after Squared Away and its patches. Enable only one ZoneBench export; combine item packs in one project.\nDeleted stock items are removed from distribution, but their definitions remain to keep existing references valid.\nDrop and condition values are MCM defaults; existing saved MCM choices take precedence.\nCustom model paths refer to assets you must install separately.\nBack up saves and test a disposable new game before using a custom add-on in a playthrough.\n`};
})(globalThis);
