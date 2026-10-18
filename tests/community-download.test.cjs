const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){const c=vm.createContext({crypto,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob});for(const file of ['web/src/emit.js','web/src/archive.js','web/data/baseline.js','web/src/compatibility.js','web/src/independent-addon.js','web/src/adaptation-export.js','web/src/community-download.js','web/src/editor-library.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);return c;}
test('community download IDs stay stable across versions and differ between listings',async()=>{const c=setup();assert.equal(await c.CommunityDownload.identity('one'),await c.CommunityDownload.identity('one'));assert.notEqual(await c.CommunityDownload.identity('one'),await c.CommunityDownload.identity('two'));});
test('community export isolates the editor and keeps update IDs stable',async()=>{const c=setup(),seed=vm.runInContext('SEED',c),before=JSON.stringify(seed);const item=JSON.parse(JSON.stringify(seed.boxes.find(x=>!x.borrowed)));item.id='custom_field_box';item.new=true;const result={listing:{id:'listing-one',name:'Field box',version:'1'},pack:{bench:'zonebench-items',version:1,items:[{kind:'boxes',item}],families:{}}};const db=await c.CommunityDownload.project(result,seed),one=c.AddonExport.plan(db,seed);result.listing.version='2';const two=c.AddonExport.plan(await c.CommunityDownload.project(result,seed),seed);assert.equal(one.manifest.items[0].id,two.manifest.items[0].id);assert.equal(two.manifest.addonVersion,'2');assert.equal(JSON.stringify(seed),before);assert.equal(one.manifest.items.length,1);assert(!one.files.some(f=>/amp_boxes\.ltx$/.test(f.name)));});
test('existing-item modifications are directed to the editor, not independent downloads',()=>{const c=setup(),seed=vm.runInContext('SEED',c),pack={bench:'zonebench-items',version:1,items:[{kind:'boxes',item:seed.boxes[0]}],families:{}};assert.equal(c.CommunityDownload.eligibility(pack).ok,false);});
test('catalog searches actual item names and filters recorded downloads without changing input',async()=>{const {filterListings}=await import('../svelte/lib/addon-browser.mjs');const rows=[{listing:{id:'b',name:'Bravo',author:'Zed'},result:{pack:{items:[{kind:'boxes',item:{name:'Food case'}}]}}},{listing:{id:'a',name:'Alpha',author:'Ann'},result:{pack:{items:[{kind:'rigs',item:{name:'Field rig'}}]}}}];assert.equal(filterListings(rows,{query:'food'})[0].listing.id,'b');assert.equal(filterListings(rows,{kind:'rigs'})[0].listing.id,'a');assert.equal(filterListings(rows,{downloadedOnly:true,downloads:[{listingId:'b'}]}).length,1);assert.equal(filterListings(rows,{sort:'name'})[0].listing.id,'a');assert.equal(rows[0].listing.id,'b');});

test('publishing includes saved mod edits and adaptations across all types but excludes untouched stock and drafts',()=>{
 const c=setup(),seed=vm.runInContext('SEED',c),db=JSON.parse(JSON.stringify(seed));
 assert.equal(c.CommunityDownload.candidates(db,seed).length,0);
 db.rigs[0].optionalLibrarySaved=true;
 db.packs=[];db.packs.push({id:'external_pack',adopt:true,adaptationSaved:true},{id:'draft_pack',adopt:true,adaptationSaved:false});
 db.items=[];db.items.push({id:'external_item',adopt:true,adaptationSaved:true});
 assert.deepEqual(Array.from(c.CommunityDownload.candidates(db,seed),x=>x.item.id),[db.rigs[0].id,'external_pack','external_item']);
});
test('published rebalance patch survives server validation and builds original-section DLTX without unrelated settings',async()=>{
 const c=setup(),seed=vm.runInContext('SEED',c),item=JSON.parse(JSON.stringify(seed.rigs[0]));
 item.optionalLibrarySaved=true;item.cost+=123;
 const published=c.CommunityDownload.publishItem('rigs',item,seed);
 assert.equal(published.adopt,true);assert.equal(published.patchOnly,true);assert.equal(published.own.price,true);assert.equal(published.own.look,false);
 const {cleanPack}=await import('../backend/community/src/service.mjs');
 const pack=cleanPack({bench:'zonebench-items',version:1,items:[{kind:'rigs',item:published}]});
 const result={listing:{id:'rebalance',name:'Rebalance',version:'1'},pack},before=JSON.stringify(seed);
 const build=await c.CommunityDownload.build(result),text=build.files.map(f=>new TextDecoder().decode(f.bytes)).join('\n');
 assert.match(text,new RegExp('cost = '+item.cost));assert(text.includes('!['+item.id+']'));
 assert(!text.includes('amp_slot_'));assert(!text.includes('use1_functor'));assert(!text.includes('icons_texture'));
 assert.equal(build.manifest.patches[0].sourceSection,item.id);assert.equal(JSON.stringify(seed),before);
 const updated=await c.CommunityDownload.validateExport({...result,listing:{...result.listing,version:'2'}});
 assert.equal(updated.plans[0].manifest.id,build.manifest.patches[0].id);
});
test('texture-only patch plans a separate sheet and no balance or storage overrides',async()=>{
 const c=setup(),seed=vm.runInContext('SEED',c),item=JSON.parse(JSON.stringify(seed.rigs[0]));
 item.optionalLibrarySaved=true;item.fit={zoom:0.8,dx:1,dy:0};
 const patch=c.CommunityDownload.publishItem('rigs',item,seed);
 const {plans}=await c.CommunityDownload.validateExport({listing:{id:'textures',name:'Textures',version:'1'},pack:{bench:'zonebench-items',version:1,items:[{kind:'rigs',item:patch}]}});
 const text=plans[0].files.map(f=>new TextDecoder().decode(f.bytes)).join('\n');
 assert(plans[0].picture);assert.match(text,/icons_texture/);assert(!text.includes('cost ='));assert(!text.includes('amp_slot_'));assert(!text.includes('class ='));
});
test('mixed created and adapted package rewrites recipe references to exported custom IDs',async()=>{
 const c=setup(),seed=vm.runInContext('SEED',c),custom=JSON.parse(JSON.stringify(seed.boxes.find(x=>!x.borrowed)));
 custom.id='custom_ingredient';custom.new=true;
 const adapted=JSON.parse(JSON.stringify(seed.rigs[0]));Object.assign(adapted,{id:'external_rig',adopt:true,own:{craft:true},craft:{...adapted.craft,parts:[['custom_ingredient',2]]}});
 const {db,plans}=await c.CommunityDownload.validateExport({listing:{id:'mixed',name:'Mixed',version:'1'},pack:{bench:'zonebench-items',version:1,items:[{kind:'boxes',item:custom},{kind:'rigs',item:adapted}]}});
 const id=c.AddonExport.plan(db,seed).manifest.items[0].id,text=plans[0].files.map(f=>new TextDecoder().decode(f.bytes)).join('\n');
 assert(text.includes(id));assert(!text.includes('custom_ingredient'));
});

test('republishing a patch preserves its chosen overrides instead of diffing against a newer baseline',()=>{
 const c=setup(),seed=vm.runInContext('SEED',c),item={...JSON.parse(JSON.stringify(seed.rigs[0])),optionalLibrarySaved:true,patchOnly:true,adopt:true,own:{price:true},cost:123};
 const changedSeed=JSON.parse(JSON.stringify(seed));changedSeed.rigs[0].cost=123;
 const copy=c.CommunityDownload.publishItem('rigs',item,changedSeed);
 assert.equal(copy.own.price,true);assert.equal(copy.own.storage,undefined);
 assert.equal(c.EditorLibrary.modOverrideSource('rigs',item,changedSeed.rigs[0]).own.price,true);
});
