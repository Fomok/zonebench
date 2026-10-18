const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const DB={rigs:[{id:'base',name:'Base rig'}],boxes:[{id:'box',takes:'meds'}],pouches:[],packs:[],items:[],families:{meds:{allow:['old']}}};
 const context=vm.createContext({crypto:require('node:crypto'),DB,SEED:JSON.parse(JSON.stringify(DB)),SEL:{},Workbench:{status:()=> 'Default',record(){}},ZB:{validateAddon(pack){if(!pack.items?.length)throw Error('Invalid pack');}},CommunityDownload:{identity:async x=>'stable-'+x},touch(){},Site:{go(tab){context.tab=tab;}}});
 vm.runInContext(fs.readFileSync('web/src/emit.js','utf8'),context);vm.runInContext(fs.readFileSync('web/src/adaptation-export.js','utf8'),context);
 vm.runInContext(fs.readFileSync('web/src/editor-library.js','utf8'),context);return {db:DB,context,library:context.EditorLibrary};
}
test('item source lists separate baseline and local creations; focused selection stays on its item',()=>{
 const {db,context,library}=setup();db.rigs.push({id:'mine',addonItemId:'uuid',name:'Mine'});
 assert.equal(library.entries('mod').length,2);assert.equal(library.entries('addons').length,1);
 library.open(library.entries('addons')[0],'addons');assert.equal(context.SEL.rigs,'mine');assert.equal(library.route(),'#editor/edit/addons/rigs/uuid');
 db.rigs[1].id='renamed';library.resolve();assert.equal(context.SEL.rigs,'renamed');
 db.rigs.splice(1,1);assert.equal(library.resolve(),undefined);
});
test('downloaded add-ons import without overwriting items or shared rules and preserve recipe references',async()=>{
 const {db,library}=setup();
 const result={listing:{id:'pack',name:'Test pack',version:'1.0',revision:1},pack:{items:[{kind:'rigs',item:{id:'base',name:'New rig',craft:{parts:[['box',2]]}}},{kind:'boxes',item:{id:'box',name:'New box',takes:'meds'}}],families:{meds:{allow:['new']}}}};
 await library.importPack(result,'rigs','base');
 assert.equal(db.rigs[0].name,'Base rig');assert.equal(db.rigs[1].id,'base_2');assert.equal(db.rigs[1].craft.parts[0][0],'box_2');
 assert.equal(db.boxes[1].takes,'meds_2');assert.equal(db.families.meds.allow[0],'old');assert.equal(db.families.meds_2.allow[0],'new');
 assert.equal(db.rigs[1].communitySource.originalId,'base');
 db.rigs[1].name='My edit';await library.importPack(result,'rigs','base');assert.equal(db.rigs.length,2);assert.equal(db.rigs[1].name,'My edit');
});
test('invalid add-on selection leaves the current project untouched',async()=>{
 const {db,library}=setup();const before=JSON.stringify(db);
 await assert.rejects(library.importPack({listing:{id:'x'},pack:{items:[{kind:'rigs',item:{id:'other'}}]}},'rigs','missing'),/no longer available/);
 assert.equal(JSON.stringify(db),before);
});
test('backpacks derived from shipped configs belong to mod items rather than My creations',()=>{
 const {db,context,library}=setup();db.packs.push({id:'equ_small_pack',name:'equ_small_pack'});
 context.Workbench.isBaseline=(kind,id)=>id==='equ_small_pack'||id==='base'||id==='box';
 assert.equal(library.entries('addons').length,0);
 assert.equal(library.entries('mod').length,3);
 assert.equal(library.label(db.packs[0]),'Small backpack');
});
test('focused add-on export retains the listing namespace and excludes unrelated local items',async()=>{
 const {db,context,library}=setup();
 const source={id:'listing',name:'My downloaded pack',version:'1.2',revision:2};
 db.rigs.push({id:'custom',addonItemId:'item-id',communitySource:source},{id:'unrelated',addonItemId:'other-id'});
 let exported;
 context.AddonExport={custom:project=>project.rigs.filter(x=>x.addonItemId),build:async project=>{exported=project;return {blob:{}};}};
 context.URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};context.setTimeout=()=>{};
 context.ZonebenchAddonFilename=(name,version)=>name+'-'+version+'.zip';
 context.document={createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}};
 library.open(library.entries('addons')[0],'addons');await library.exportFocused();
 assert.equal(exported.independentAddon.id,'stable-listing');
 assert.equal(exported.independentAddon.version,'1.2');
 assert.deepEqual(Array.from(exported.independentAddon.excluded),['other-id']);
 assert.equal(db.independentAddon,undefined);
});

test('adaptations have their own source and focused validation never checks unrelated defaults',()=>{
 const {db,context,library}=setup();const item={id:'zona_rig',adopt:true,adaptationId:'adaptation',name:'ZONA rig'};db.rigs.push(item);
 assert.equal(library.entries('addons').length,0);assert.equal(library.entries('adaptations').length,1);
 library.open(library.entries('adaptations')[0]);assert.equal(library.route(),'#editor/edit/adaptations/rigs/zona_rig');
 context.checkFindings=()=>{throw Error('Unrelated project validation called');};context.esc=x=>x;
 context.AdaptationExport.plan=(project,seed,kind,current)=>{assert.equal(current,item);};
 assert.equal(library.focusedFindings().bad.length,0);
});

test('removing an adaptation erases its entry without creating a game deletion override',()=>{
 const {db,library}=setup();const item={id:'zona_pack',adopt:true,adaptationId:'id',name:'Pack'};db.packs=[item];db.packEdited={zona_pack:true};
 library.removeEntry(library.entries('adaptations')[0]);
 assert.equal(db.packs.length,0);assert.equal(db.packEdited.zona_pack,undefined);assert.equal(db.removed.length,0);assert.equal(library.entries('adaptations').length,0);
 assert.throws(()=>library.removeEntry(library.entries('mod')[0]),/Built-in/);
});
test('removing a downloaded working copy hides its remote row without deleting other items',()=>{
 const {db,library}=setup();const source={id:'listing',originalId:'source_rig'};db.rigs.push({id:'downloaded',communitySource:source});
 library.removeEntry(library.entries('addons')[0]);assert.equal(db.rigs.length,1);
 const row={kind:'rigs',id:'source_rig',result:{listing:{id:'listing'}}};assert(library.isHidden(row));assert(!library.isHidden({...row,id:'other'}));
});
test('library package exports exactly the selected local items using its own stable namespace',()=>{
 const {db,context,library}=setup();const first={id:'one',addonItemId:'one'},second={id:'two',addonItemId:'two'};db.rigs.push(first,second);
 context.AddonExport={ensure(){},custom:project=>project.rigs.filter(x=>x.addonItemId)};
 const opts={id:'package-id',name:'Mixed gear',version:'1.2'},project=library.addonPackageProject([second],opts);
 assert.deepEqual(Array.from(project.independentAddon.excluded),['one']);assert.equal(project.independentAddon.id,'package-id');assert.equal(db.independentAddon,undefined);
 assert.throws(()=>library.addonPackageProject([],opts),/Select/);assert.throws(()=>library.addonPackageProject([db.rigs[0]],opts),/custom rigs/);
});

test('saving a mod edit adds it to optional library with original ID and removing it restores default',()=>{
 const {db,library}=setup();const item=db.rigs[0];item.name='Edited rig';library.open(library.entries('mod')[0],'mod');library.saveModItem();
 assert.equal(item.id,'base');assert(item.modOverrideId);assert.equal(library.entries('addons').length,1);assert.equal(library.entries('mod').length,2);
 const uuid=item.modOverrideId;library.open(library.entries('mod')[0],'mod');library.saveModItem();assert.equal(item.modOverrideId,uuid);assert.equal(db.rigs.length,1);
 library.removeEntry(library.entries('addons')[0]);assert.equal(db.rigs[0].name,'Base rig');assert.equal(library.entries('addons').length,0);
});

test('importing a patch never silently renames the original item section',async()=>{
 const {db,library}=setup(),before=JSON.stringify(db);
 const result={listing:{id:'patch',name:'Patch',version:'1',revision:1},pack:{items:[{kind:'rigs',item:{id:'base',name:'Rebalanced',adopt:true,patchOnly:true,own:{price:true},cost:123}}]}};
 await assert.rejects(library.importPack(result,'rigs','base',false),/review replacing/);assert.equal(JSON.stringify(db),before);
});
