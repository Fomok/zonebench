/* Build community downloads in an isolated project with stable identities. */
(function(root){
const kinds=['rigs','boxes','pouches','packs'];
const clone=x=>JSON.parse(JSON.stringify(x));
function candidates(db,seed){
 return [...kinds,'items'].flatMap(kind=>(db[kind]||[]).filter(item=>{
  const baseline=(seed[kind]||[]).some(x=>x.id===item.id)||kind==='packs'&&EMIT.readPacks(seed.files?.['configs/items/settings/zzz_grid_packs.ltx']||'').sec[item.id]!==undefined;
  return !item.libraryDraft&&item.adaptationSaved!==false&&(item.optionalLibrarySaved||!baseline&&(item.new||item.adopt||item.addonItemId||item.communitySource));
 }).map(item=>({kind,item})));
}
function publishItem(kind,item,seed){
 if(item.optionalLibrarySaved&&!item.patchOnly){
  const base=root.Workbench?.baseline?.(kind,item.id)||(seed[kind]||[]).find(x=>x.id===item.id)||{};
  return EditorLibrary.modOverrideSource(kind,item,base);
 }
 return clone(item);
}
function eligibility(pack,seed){
 ZB.validateAddon(pack);
 const reason=pack.items.find(({kind,item})=>!item.adopt&&(!kinds.includes(kind)||item.borrowed||(seed[kind]||[]).some(x=>x.id===item.id)));
 return reason?{ok:false,reason:'Save existing-item edits to your library and publish them as patches before downloading.'}:{ok:true,patches:pack.items.some(x=>x.item.adopt)};
}
async function identity(text){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('zonebench-community-v1:'+text)));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes.slice(0,16),x=>x.toString(16).padStart(2,'0')).join('');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');}
async function project(result,seed){
 const eligible=eligibility(result.pack,seed);if(!eligible.ok)throw Error(eligible.reason);
 const db=JSON.parse(JSON.stringify(seed));for(const kind of kinds)db[kind]=[];db.items=[];db.removed=[];db.families={...db.families,...result.pack.families};
 db.independentAddon={id:await identity(result.listing.id),name:result.listing.name,version:result.listing.version,excluded:[]};
 for(const {kind,item} of result.pack.items.filter(x=>!x.item.adopt)){const copy=JSON.parse(JSON.stringify(item));copy.new=true;copy.addonItemId=await identity(result.listing.id+'/'+kind+'/'+item.id);if(kind==='packs'){copy.newItem=true;copy.parent=copy.parent||'equ_military_pack';copy.own={...copy.own,size:true,look:true,price:true};}db[kind].push(copy);}
 return db;
}
async function validateExport(result,seed=SEED){
 const db=await project(result,seed),custom=result.pack.items.some(x=>!x.item.adopt);
 const customPlan=custom?AddonExport.plan(db,seed):null;
 const mapping=new Map((customPlan?.manifest.items||[]).map(x=>[x.sourceId,x.id]));
 const plans=[];
 for(const {kind,item} of result.pack.items.filter(x=>x.item.adopt)){
  const copy=clone(item);copy.adaptationId=await identity(result.listing.id+'/patch/'+kind+'/'+item.id);
  if(copy.craft?.parts)copy.craft.parts=copy.craft.parts.map(([id,n])=>[mapping.get(id)||id,n]);
  for(const field of ['parts','yield'])if(Array.isArray(copy[field]))copy[field]=copy[field].map(id=>mapping.get(id)||id);
  plans.push(AdaptationExport.plan(db,seed,kind,copy));
 }
 return {db,custom,plans};
}
async function build(result){
 const {db,custom,plans}=await validateExport(result),files=[];
 let manifest={format:'zonebench-community-package',version:1,id:db.independentAddon.id,name:result.listing.name,addonVersion:result.listing.version,items:[],files:[]};
 if(custom){const output=await AddonExport.build(db,SEED);files.push(...output.files.filter(f=>f.name!=='INSTALL.txt'));manifest=output.manifest;}
 for(const plan of plans){await AdaptationExport.materialize(plan);files.push(...plan.files);}
 manifest.patches=plans.map(p=>p.manifest);manifest.files=files.map(f=>f.name);
 if(new Set(manifest.files).size!==manifest.files.length)throw Error('Package has conflicting filenames.');
 files.push({name:'community-package.json',bytes:BUILD.utf8(JSON.stringify(manifest,null,2))},{name:'INSTALL.txt',bytes:BUILD.utf8('SQUARED AWAY COMMUNITY ADD-ON\n'+result.listing.name+' '+result.listing.version+'\nInstall below Squared Away and all required source mods in MO2. Replace the previous version of this package when updating.\nRequired mods: '+(result.listing.dependencies||'Squared Away and the mods defining the original sections below.')+'\nExisting sections patched: '+plans.map(p=>p.manifest.sourceSection).join(', ')+'\nPatches retain existing item IDs. Other patches for the same properties may conflict. Test converted equipment with newly spawned items on a separate save.\n')});
 return {blob:BUILD.zip(files),files,manifest};
}
root.CommunityDownload={candidates,publishItem,eligibility:pack=>eligibility(pack,SEED),identity,project,validateExport,build};
})(globalThis);
