(function(root){
const kinds=['rigs','boxes','pouches','packs'];
let selected=null;
function select(kind,id){selected=kinds.includes(kind)?{kind,id}:null;}
function current(){if(!selected)return null;const item=(DB[selected.kind]||[]).find(x=>x.addonItemId===selected.id);return item?{kind:selected.kind,item:JSON.parse(JSON.stringify(item))}:null;}
function drafts(){return kinds.flatMap(kind=>(DB[kind]||[]).filter(x=>x.new&&!x.adopt&&x.addonItemId).map(x=>({kind,id:x.addonItemId,name:x.name||'Untitled item',icon:x.icon})));}
function create(kind){if(!kinds.includes(kind))return;const item=addItem(false,kind,false);if(kind==='rigs'){item.slots={'2x2':1,'3x1':0,'2x1':0,'1x1':0};item.pins=[{kind:'2x2',col:1,row:1}];}item.cellw=2;item.cellh=2;item.builderAddonId=crypto.randomUUID();item.builderStep=0;item.libraryDraft=true;select(kind,item.addonItemId);touch();Site.go('builder');}
function removeDraft(kind,id){if(!kinds.includes(kind))return false;const index=(DB[kind]||[]).findIndex(x=>x.addonItemId===id&&x.new&&!x.adopt);if(index<0)return false;Workbench.record();const [removed]=DB[kind].splice(index,1);if(SEL[kind]===removed.id)SEL[kind]=DB[kind][0]?.id;if(selected?.id===id)selected=null;DB.independentAddon.excluded=DB.independentAddon.excluded.filter(x=>x!==id);touch();return true;}
function open(kind,id){select(kind,id);Site.go('builder');}
function save(data){const found=current();if(!found)return;const target=DB[found.kind].find(x=>x.addonItemId===selected.id);const copy=JSON.parse(JSON.stringify(data));delete copy.id;delete copy.addonItemId;Object.assign(target,copy);touch();}
function project(){const found=current();if(!found)throw Error('This item is no longer in the current project.');const copy=JSON.parse(JSON.stringify(DB));if(found.item.builderAddonId)copy.independentAddon.id=found.item.builderAddonId;copy.independentAddon.name=found.item.name||'My item';copy.independentAddon.excluded=AddonExport.custom(copy,SEED).filter(x=>x.addonItemId!==selected.id).map(x=>x.addonItemId);return copy;}
function review(){try{const p=AddonExport.plan(project(),SEED);return {ok:true,count:p.manifest.files.length,files:p.manifest.files,width:p.width,height:p.height};}catch(e){return {ok:false,error:e.message};}}
async function download(){await flushKeep();return AddonExport.build(project(),SEED);}
function advanced(){const found=current();if(found){EditorLibrary.open({kind:found.kind,item:DB[found.kind].find(x=>x.addonItemId===selected.id)},'addons');}}
function pictures(){return Object.fromEntries(kinds.map(kind=>[kind,(SEED[kind]||DB[kind]||[]).find(x=>x.icon)?.icon||null]));}
function rules(){return Object.keys(DB.families||{}).filter(x=>x!=='any').map(id=>({id,name:id.replaceAll('_',' ')}));}
function recipe(kind,item){if(kind==='rigs')return EMIT.rigRecipe({...item,craft:null});if(kind==='pouches')return EMIT.pouchRecipe(item);return {kit:1,book:'recipe_basic_0',cat:2,parts:[]};}
function ingredient(id){for(const kind of kinds){const it=(DB[kind]||SEED[kind]||[]).find(x=>x.id===id);if(it)return {id,name:it.name,icon:root.ItemIcons?.source(it)||it.icon};}return null;}
root.EditorFlow={saveToLibrary(){const found=current();if(!found)throw Error('Draft not found.');LibraryWorkflow.save({kind:found.kind,item:DB[found.kind].find(x=>x.addonItemId===selected.id),local:true});},repairDefaults:item=>({parts:EMIT.partsDefault(item.slots),bonus:EMIT.bonusFor(item.slots)}),removeDraft,undoRemoval:()=>Workbench.undo(),recipe,ingredient,select,current,drafts,create,open,save,review,download,advanced,pictures,rules,route:()=>selected?'#editor/new/'+selected.kind+'/'+selected.id:'#editor/create'};
})(globalThis);
