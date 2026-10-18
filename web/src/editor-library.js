/* Item library and focused editing. Public add-ons are copied locally, never updated here. */
(function(root){
const kinds=['rigs','boxes','pouches','packs','items'];
let scope='mod',focused=null;const filters={};
const clone=x=>JSON.parse(JSON.stringify(x));
function label(item){const names={itm_backpack:'Starter backpack',equ_small_pack:'Small backpack',equ_small_military_pack:'Small military backpack',equ_military_pack:'Military backpack',equ_tourist_pack:'Tourist backpack'};return (!item.name||item.name===item.id)?names[item.id]||item.id:item.name;}
function token(item){return item.addonItemId||item.id;}
function entries(source=scope){return kinds.flatMap(kind=>(DB[kind]||[]).filter(item=>{
 const baseline=Workbench.isBaseline?Workbench.isBaseline(kind,item.id):(SEED[kind]||[]).some(x=>x.id===item.id);
 const adapted=AdaptationExport.isUserAdaptation(SEED,kind,item);
 return source==='adaptations'?adapted:source==='mod'?baseline:(!baseline||!!item.communitySource||item.optionalLibrarySaved)&&!adapted;
}).map(item=>({kind,id:item.id,key:token(item),item,local:true,source:item.communitySource?.name||item.communitySource?.id||(source==='mod'?'Squared Away':source==='adaptations'?'My adaptations':'My creations'),status:Workbench.status(kind,item)})));}
function adapt(kind,id,name,drops=false){
 if(!['rigs','boxes','pouches','packs'].includes(kind))throw Error('Choose an item type.');
 id=String(id||'').trim();if(!/^[a-z][a-z0-9_]*$/.test(id))throw Error('Enter the exact item section ID, using lowercase letters, numbers and underscores.');
 if(kinds.some(k=>(DB[k]||[]).some(x=>x.id===id)))throw Error('This item is already in your project. Find adaptations under Editor → Edit existing items → Adapted items library; mod items are under Edit mod items.');
 Workbench.record();const item=addItem(true,kind,false);item.id=id;item.name=String(name||'').trim()||id;item.addonItemId=crypto.randomUUID();item.adaptationId=crypto.randomUUID();item.adaptationSaved=false;item.own={...(item.own||{}),drops:!!drops&&['rigs','pouches'].includes(kind)};
 if(kind==='rigs'){item.slots={'2x2':1,'3x1':0,'2x1':0,'1x1':0};item.pins=[{kind:'2x2',col:1,row:1}];}
 touch();open({kind,item},'adaptations');return item;
}
function choose(source){scope=['addons','adaptations'].includes(source)?source:'mod';focused=null;Site.go('itemlibrary');}
function select(source,kind,key){scope=['addons','adaptations'].includes(source)?source:'mod';focused=kinds.includes(kind)?{kind,key}:null;}
function resolve(){if(!focused)return null;const item=(DB[focused.kind]||[]).find(x=>token(x)===focused.key);if(item)SEL[focused.kind]=item.id;return item;}
function open(entry,source=scope){root.LibraryWorkflow?.remember({...entry,local:true});if(AdaptationExport.isUserAdaptation(SEED,entry.kind,entry.item))source='adaptations';select(source,entry.kind,entry.key||token(entry.item));resolve();Site.go(entry.kind);}
function route(){return focused?'#editor/edit/'+scope+'/'+focused.kind+'/'+encodeURIComponent(focused.key):'#editor/library/'+scope;}
async function importPack(result,kind,id,navigate=true){
 ZB.validateAddon(result.pack);
 const selected=result.pack.items.find(x=>x.kind===kind&&x.item.id===id);if(!selected)throw Error('This item is no longer available in the add-on.');
 const existing=DB[kind]?.find(x=>x.communitySource?.id===result.listing.id&&x.communitySource.originalId===id);
 if(existing){if(navigate)open({kind,item:existing},'addons');return existing;}
 const used=new Set(kinds.flatMap(k=>(DB[k]||[]).map(x=>x.id))),mapping=new Map(),incoming=[];
 for(const entry of result.pack.items){
  const old=DB[entry.kind]?.find(x=>x.communitySource?.id===result.listing.id&&x.communitySource.originalId===entry.item.id);
  if(entry.item.adopt&&!old&&used.has(entry.item.id))throw Error('This patch targets an item already in your project. Open the add-on in Browse add-ons and choose Open in editor to review replacing it.');
  let next=old?.id||entry.item.id,n=2;while(!old&&used.has(next))next=entry.item.id+'_'+n++;
  used.add(next);mapping.set(entry.item.id,next);if(old)continue;
  const item=clone(entry.item);item.id=next;item.new=true;item.addonItemId=await CommunityDownload.identity(result.listing.id+'/'+entry.kind+'/'+entry.item.id);
  item.communitySource={id:result.listing.id,name:result.listing.name,version:result.listing.version,revision:result.listing.revision,originalId:entry.item.id};
  incoming.push({kind:entry.kind,item});
 }
 // Resolve every incoming reference before touching the project.
 const families=clone(DB.families||{}),familyMap=new Map();
 for(const [name,value] of Object.entries(result.pack.families||{})){
  let next=name,n=2;while(families[next]&&JSON.stringify(families[next])!==JSON.stringify(value))next=name+'_'+n++;
  families[next]=clone(value);familyMap.set(name,next);
 }
 for(const entry of incoming){const item=entry.item;if(item.craft?.parts)item.craft.parts=item.craft.parts.map(([part,count])=>[mapping.get(part)||part,count]);if(familyMap.has(item.takes))item.takes=familyMap.get(item.takes);}
 Workbench.record();DB.families=families;for(const entry of incoming)(DB[entry.kind]||(DB[entry.kind]=[])).push(entry.item);
 touch();const item=DB[kind].find(x=>x.id===mapping.get(id));if(navigate)open({kind,item},'addons');return item;
}
function dialog(title){
 const d=document.createElement('dialog');d.className='addon-dialog';d.setAttribute('aria-label',title);
 const head=document.createElement('div');head.className='addon-dialog-header';const h=document.createElement('strong');h.textContent=title;
 const close=document.createElement('button');close.className='tool';close.textContent='Back to editor';close.onclick=()=>d.close();head.append(h,close);
 const body=document.createElement('div');body.className='addon-dialog-body';d.append(head,body);d.addEventListener('close',()=>d.remove());document.body.appendChild(d);d.showModal();return {d,body};
}
function focusedFindings(){
 const item=resolve();
 if(item&&root.LibraryWorkflow){const findings={bad:[],soft:[]};try{LibraryWorkflow.check({kind:focused.kind,item,local:true});}catch(e){findings.bad.push(esc(e.message));}return findings;}
 if(!item||!AdaptationExport.isUserAdaptation(SEED,focused.kind,item))return checkFindings();
 const findings={bad:[],soft:[]};try{AdaptationExport.plan(DB,SEED,focused.kind,item);}catch(e){findings.bad.push(esc(label(item)+': '+e.message));}return findings;
}
function inspect(mode){
 const item=resolve(),adapted=item&&AdaptationExport.isUserAdaptation(SEED,focused.kind,item);
 const {d,body}=dialog(mode==='changes'?'Review changes':adapted?'Check this adaptation':'Check project');
 if(mode==='changes'){
  if(adapted){try{const p=AdaptationExport.plan(DB,SEED,focused.kind,item);const intro=document.createElement('p');intro.textContent='Overrides for '+item.id+' only. Unselected source properties are preserved.';body.appendChild(intro);for(const file of p.files){const section=document.createElement('details'),title=document.createElement('summary'),text=document.createElement('pre');title.textContent=file.name;text.textContent=new TextDecoder().decode(file.bytes);section.append(title,text);body.appendChild(section);}}catch(e){body.textContent=e.message;}}
  else if(item&&root.LibraryWorkflow){Workbench.compare(body,focused.kind,Workbench.baseline(focused.kind,item.id),item,'Mod default','Current item');}
  else{Workbench.changes(body);body.addEventListener('click',e=>{if(e.target.closest('button'))d.close();});}return;
 }
 const findings=focusedFindings();
 const title=document.createElement('p');title.textContent=findings.bad.length?findings.bad.length+' issue(s) to fix.':'No blocking issues found. In-game compatibility still needs testing.';body.appendChild(title);
 for(const [messages,cls] of [[findings.bad,'warn'],[findings.soft,'hint']])for(const message of messages){const p=document.createElement('p');p.className=cls;p.innerHTML=message;body.appendChild(p);}
}
function packageDialog(){
 const {body}=dialog('Create an adaptation package'),all=AdaptationExport.entries(DB,SEED),settings=DB.adaptationPackage||{name:'My compatibility patch',version:'1.0',excluded:[]};
 if(!all.length){body.textContent='Save an adaptation to the adapted items library first. Only saved adaptations appear here.';return;}
 const field=(text,value)=>{const label=document.createElement('label');label.textContent=text;const input=document.createElement('input');input.value=value;label.appendChild(input);body.appendChild(label);return input;};
 const name=field('Package name',settings.name),version=field('Version',settings.version),checks=[];
 const note=document.createElement('p');note.textContent='Select adapted items from any category. Install this one ZIP below Squared Away and all source mods.';body.appendChild(note);
 for(const entry of all){const row=document.createElement('label');row.style.display='block';const check=document.createElement('input');check.type='checkbox';check.checked=!(settings.excluded||[]).includes(entry.item.id);row.append(check,document.createTextNode(' '+label(entry.item)+' · '+entry.kind+' · '+entry.item.id));body.appendChild(row);checks.push({entry,check});}
 const save=()=>{DB.adaptationPackage={name:name.value,version:version.value,excluded:checks.filter(x=>!x.check.checked).map(x=>x.entry.item.id)};touch();};
 body.addEventListener('change',save);
 const status=document.createElement('p');status.setAttribute('role','status');const button=document.createElement('button');button.className='tool primary';button.textContent='Download package ZIP';body.append(button,status);
 button.onclick=async()=>{button.disabled=true;status.textContent='Checking and packing selected items…';try{save();await AdaptationExport.downloadPackage(DB,SEED,checks.filter(x=>x.check.checked).map(x=>x.entry),DB.adaptationPackage);status.textContent='Package downloaded.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
}
function remoteKey(row){const source=row.item?.communitySource;return source?source.id+'/'+row.kind+'/'+source.originalId:row.result?row.result.listing.id+'/'+row.kind+'/'+row.id:row.key;}
function isHidden(row){return (DB.libraryHidden||[]).includes(remoteKey(row));}
function removeEntry(row){
 if(row.local&&row.item.optionalLibrarySaved){Workbench.record();const original=Workbench.baseline?.(row.kind,row.item.id)||(SEED[row.kind]||[]).find(x=>x.id===row.item.id);if(!original)throw Error('Mod default unavailable.');DB[row.kind][DB[row.kind].indexOf(row.item)]=clone(original);if(DB.packEdited)delete DB.packEdited[row.item.id];touch();return;}
 if(row.local&&(Workbench.isBaseline?.(row.kind,row.item.id)||(SEED[row.kind]||[]).some(x=>x.id===row.item.id)))throw Error('Built-in mod items cannot be deleted from this library.');
 Workbench.record();
 if(!row.local||row.item.communitySource){DB.libraryHidden=[...new Set([...(DB.libraryHidden||[]),remoteKey(row)])];}
 if(row.local){const list=DB[row.kind]||[],index=list.indexOf(row.item);if(index<0)throw Error('This item is no longer in the library.');list.splice(index,1);
  if(DB.packEdited)delete DB.packEdited[row.item.id];
  DB.removed=(DB.removed||[]).filter(x=>!(x.kind===row.kind&&x.id===row.item.id));
  if(SEL[row.kind]===row.item.id)SEL[row.kind]=list[0]?.id;
  if(focused?.kind===row.kind&&focused.key===token(row.item))focused=null;
 }
 touch();
}
function addonPackageProject(selected,options){
 if(!selected.length)throw Error('Select at least one item.');
 if(!String(options.name||'').trim()||!String(options.version||'').trim())throw Error('Enter a package name and version.');
 AddonExport.ensure(DB,SEED);const allowed=new Set(AddonExport.custom(DB,SEED));
 if(selected.some(item=>!allowed.has(item)))throw Error('This package supports custom rigs, containers, pouches and backpacks. Adaptations belong in the adapted items library.');
 const project=clone(DB),ids=new Set(selected.map(item=>item.addonItemId));
 project.independentAddon={id:options.id,name:options.name.trim(),version:options.version.trim(),excluded:AddonExport.custom(project,SEED).filter(item=>!ids.has(item.addonItemId)).map(item=>item.addonItemId)};
 return project;
}
function saveModItem(){
 const item=resolve();if(!item||scope!=='mod')throw Error('Open a mod item first.');
 Workbench.record();item.optionalLibrarySaved=true;item.modOverrideId=item.modOverrideId||crypto.randomUUID();touch();choose('addons');
}
function modOverridePlan(item,reference=id=>id){
 const kind=kinds.find(k=>(DB[k]||[]).includes(item));if(!kind||!item.optionalLibrarySaved)throw Error('Select a saved mod edit.');
 const base=Workbench.baseline?.(kind,item.id)||(SEED[kind]||[]).find(x=>x.id===item.id)||{};
 const source=modOverrideSource(kind,item,base);
 if(source.craft?.parts)source.craft.parts=source.craft.parts.map(([id,count])=>[reference(id),count]);
 for(const key of ['parts','yield'])if(Array.isArray(source[key]))source[key]=source[key].map(reference);
 return AdaptationExport.plan(DB,SEED,kind,source);
}
function modOverrideSource(kind,item,base){
 if(item.patchOnly)return clone(item);
 const source=clone(item);
 const comparable=(value,key)=>key==='fit'?{zoom:value?.zoom??1,dx:value?.dx||0,dy:value?.dy||0}:value;
 const changed=keys=>keys.some(key=>JSON.stringify(comparable(item[key],key))!==JSON.stringify(comparable(base[key],key)));
 source.adopt=true;source.patchOnly=true;source.adaptationId=item.modOverrideId;
 source.own={size:changed(['size']),storage:changed(['slots','pins','band','grants','tier','inw','inh','stack','takes','snd','kg']),name:changed(['name','descr']),price:changed(['cost','weight']),look:!!item.icon&&changed(['icon','fit','cellw','cellh']),craft:!!item.craft&&changed(['craft']),repair:kind==='rigs'&&changed(['parts','yield','repair','repairBonus','slots']),shelves:changed(['shelves']),drops:false};
 return source;
}
function planLibraryPackage(selected,settings){
 if(!selected.length)throw Error('Select at least one item.');
 if(!String(settings.name||'').trim()||!String(settings.version||'').trim())throw Error('Enter a package name and version.');
 const edits=selected.filter(item=>item.optionalLibrarySaved),custom=selected.filter(item=>!item.optionalLibrarySaved),files=[],overrides=[];
 // Validate every saved edit before building textures or assembling a download.
 const project=custom.length?addonPackageProject(custom,settings):null,customPlan=project?AddonExport.plan(project,SEED):null;
 const mapping=new Map((customPlan?.manifest.items||[]).map(x=>[x.sourceId,x.id])),customIds=new Set(AddonExport.custom(DB,SEED).map(x=>x.id));
 const reference=id=>{if(customIds.has(id)&&!mapping.has(id))throw Error('Select the custom ingredient used by a saved mod edit: '+id);return mapping.get(id)||id;};
 const plans=edits.map(item=>modOverridePlan(item,reference));
 return {project,plans,files:[...(customPlan?.manifest.files||[]),...plans.flatMap(p=>p.manifest.files)],requiredAddons:customPlan?.manifest.requiredAddons||[]};
}
async function buildLibraryPackage(selected,settings){
 const {project,plans}=planLibraryPackage(selected,settings),files=[],overrides=[];
 if(project){const result=await AddonExport.build(project,SEED);files.push(...result.files.filter(f=>f.name!=='INSTALL.txt'));}
 for(const plan of plans){await AdaptationExport.materialize(plan);files.push(...plan.files);overrides.push(plan.manifest);}
 const paths=files.map(f=>f.name);if(new Set(paths).size!==paths.length)throw Error('Package has conflicting filenames.');
 files.push({name:'library-package.json',bytes:BUILD.utf8(JSON.stringify({name:settings.name,version:settings.version,overrides},null,2))},{name:'INSTALL.txt',bytes:BUILD.utf8('Install below Squared Away and required source add-ons in MO2. Saved mod edits override their original item IDs; custom items use this package namespace. Other patches for the same mod item may conflict. Replace the previous package when updating.\n')});
 return {blob:BUILD.zip(files),files};
}
function addonPackageDialog(rows){
 const {body}=dialog('Create an add-on package'),all=rows.filter(row=>(row.item.optionalLibrarySaved||['rigs','boxes','pouches','packs'].includes(row.kind)&&!row.item.adopt)&&(row.local||row.result));
 if(!all.length){body.textContent='Create or import an add-on item first.';return;}
 DB.libraryPackage=DB.libraryPackage||{id:crypto.randomUUID(),name:'My add-on package',version:'1.0',excluded:[]};const settings=DB.libraryPackage;
 const field=(text,value)=>{const label=document.createElement('label');label.textContent=text;const input=document.createElement('input');input.value=value;label.appendChild(input);body.appendChild(label);return input;};
 const name=field('Package name',settings.name),version=field('Version',settings.version),checks=[];
 const note=document.createElement('p');note.textContent='Choose items for one new add-on ZIP. Include custom ingredients used by their recipes too. Custom items get package IDs. Saved mod edits retain their original IDs and override those items.';body.appendChild(note);
 for(const row of all){const labelNode=document.createElement('label');labelNode.style.display='block';const check=document.createElement('input');check.type='checkbox';check.checked=!(settings.excluded||[]).includes(row.key);labelNode.append(check,document.createTextNode(' '+label(row.item)+' · '+row.kind));body.appendChild(labelNode);checks.push({row,check});}
 const save=()=>{Object.assign(settings,{name:name.value,version:version.value,excluded:checks.filter(x=>!x.check.checked).map(x=>x.row.key)});touch();};body.addEventListener('change',save);
 const status=document.createElement('p');status.setAttribute('role','status');const button=document.createElement('button');button.className='tool primary';button.textContent='Download package ZIP';body.append(button,status);
 button.onclick=async()=>{button.disabled=true;try{save();const selected=[];for(const {row,check} of checks)if(check.checked)selected.push(row.local?row.item:await importPack(row.result,row.kind,row.id,false));const result=await buildLibraryPackage(selected,settings);touch();const url=URL.createObjectURL(await result.blob),link=document.createElement('a');link.href=url;link.download=root.ZonebenchAddonFilename(settings.name,settings.version);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Package downloaded.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
}
function saveAdaptation(){const item=resolve();if(!item||!AdaptationExport.isUserAdaptation(SEED,focused.kind,item))throw Error('Choose an adapted item first.');AdaptationExport.plan(DB,SEED,focused.kind,item);item.adaptationSaved=true;touch();choose('adaptations');}
async function exportFocused(){
 const item=resolve();if(!item)throw Error('Select an item first.');
 if(scope==='mod'){saveModItem();return;}
 if(item.optionalLibrarySaved){addonPackageDialog(entries('addons'));return;}
 if(item.adopt){await AdaptationExport.download(DB,SEED,focused.kind,item);return;}
 if(!item.communitySource?.id&&!item.builderAddonId){Site.go('addonexport');return;}
 const project=clone(DB),source=item.communitySource;
 const addonId=source?await CommunityDownload.identity(source.id):item.builderAddonId;
 project.independentAddon={...project.independentAddon,id:addonId,name:source?.name||item.name,version:source?.version||'1.0',excluded:[]};
 project.independentAddon.excluded=AddonExport.custom(project,SEED).filter(x=>source?x.communitySource?.id!==source.id:x.builderAddonId!==item.builderAddonId).map(x=>x.addonItemId);
 const result=await AddonExport.build(project,SEED),blob=await result.blob,url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=root.ZonebenchAddonFilename(project.independentAddon.name,project.independentAddon.version);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
root.EditorLibrary={icon:item=>root.ItemIcons?.source(item)||item?.icon||null,modOverrideSource,planLibraryPackage,saveModItem,modOverridePlan,buildLibraryPackage,removeEntry,isHidden,addonPackageDialog,addonPackageProject,focusedFindings,saveAdaptation,inspect,packageDialog,adapt,label,exportFocused,getFilters:source=>filters[source]||{},saveFilters:(source,value)=>filters[source]=value,entries,choose,select,resolve,open,importPack,route,get scope(){return scope;},get focused(){return focused;},clear(){focused=null;},isFocused:kind=>!!focused&&focused.kind===kind};
})(globalThis);
