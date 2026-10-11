const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
function setup(){
 const c=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob,crypto});
 for(const f of ['src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js','src/independent-addon.js'])vm.runInContext(fs.readFileSync('web/'+f,'utf8'),c);
 const seed=vm.runInContext('SEED',c),db=JSON.parse(JSON.stringify(seed));
 const r={...JSON.parse(JSON.stringify(seed.rigs[0])),id:'my_new_rig',new:true,name:'Test rig',descr:'One test rig',stash:'none'};
 db.rigs.push(r);return {...c,seed,db,r};
}
const text=f=>new TextDecoder().decode(f.bytes);
function mixed(){const a=setup(),icon=a.r.icon;
 a.db.boxes.push({...JSON.parse(JSON.stringify(a.seed.boxes[0])),id:'custom_box',new:true,name:'Box',descr:'',takes:'medical_rule',kg:null,slots:[{c:1,r:1,w:2,h:2}],inw:3,inh:3,icon,shelves:{}});
 a.db.pouches.push({...JSON.parse(JSON.stringify(a.seed.pouches[0])),id:'custom_pouch',new:true,name:'Pouch',descr:'',icon,grants:{'2x2':0,'3x1':2,'2x1':0,'1x1':0}});
 a.db.packs=[{id:'custom_pack',new:true,newItem:true,parent:'equ_military_pack',size:'12x11',name:'Backpack',descr:'',icon,cellw:2,cellh:3,weight:2,cost:6000,craft:{cat:1,kit:1,book:'recipe_basic_1',parts:[['custom_pouch',1]]}}];
 a.db.families={medical_rule:{kinds:['i_medical'],also:['my_new_rig'],never:['medkit_army'],rigs:true,no:'Medical kit only'}};
 return a;
}
test('mixed add-ons define only their own items, rules and backpack sizes',()=>{
 const a=mixed(),p=a.AddonExport.plan(a.db,a.seed),b=mixed(),q=b.AddonExport.plan(b.db,b.seed);
 assert.equal(p.entries.length,4);assert.equal(p.manifest.items.length,4);
 assert(!p.manifest.files.some(f=>q.manifest.files.includes(f)));
 const ids=Object.fromEntries(p.manifest.items.map(x=>[x.kind,x.id]));
 const system=text(p.files.find(f=>f.name.includes('/mod_system_')));
 for(const id of Object.values(ids))assert(system.includes('['+id+']'));
 assert.match(system,/amp_pgrant_3x1\s*=\s*2/);assert.match(system,/amp_box_noweight\s*=\s*true/);
 assert.match(system,/amp_box_slots\s*=\s*1,1,2,2/);assert(system.includes('['+ids.packs+']:equ_military_pack'));
 const rule=text(p.files.find(f=>f.name.includes('/mod_amp_boxes_')));
 assert(rule.includes('[amp_box_'+ids.boxes+'_rules]'));assert(rule.includes(ids.rigs));assert(!rule.includes('[amp_box_medical_rule]'));
 const packs=text(p.files.find(f=>f.name.includes('/mod_zzz_grid_packs_')));assert.equal(packs.trim(),'![grid_pack_section]\r\n'+ids.packs+' = 12x11');
 const registry=text(p.files.find(f=>f.name.includes('/mod_sqa_addons_')));assert(registry.includes('![pouches]\r\n'+ids.pouches+' = true'));
 const craft=text(p.files.find(f=>f.name.includes('/mod_craft_')));
 const category1=craft.split('![1]')[1].split('![')[0],category2=craft.split('![2]')[1];
 assert(category1.includes('x_'+ids.packs));assert(category1.includes(ids.pouches));assert(category2.includes('x_'+ids.pouches));assert(category2.includes('x_'+ids.rigs));
 for(const f of p.files.filter(f=>f.name.endsWith('.xml'))){const xml=a.BUILD.decodeStringTable(f.bytes);assert.equal((xml.match(/<string id=/g)||[]).length,8);assert(!/<text>\s*<\/text>/.test(xml));}
});
test('each additional category can be exported alone and rejects malformed storage',()=>{
 for(const kind of ['boxes','pouches','packs']){const a=mixed();a.AddonExport.ensure(a.db,a.seed);a.db.independentAddon.excluded=a.AddonExport.custom(a.db,a.seed).filter(r=>!a.db[kind].includes(r)).map(r=>r.addonItemId);
  if(kind==='boxes')a.db.families.medical_rule.also=[];
  if(kind==='packs')a.db.packs[0].craft.parts=[['sewing_thread',4]];
  assert.equal(a.AddonExport.plan(a.db,a.seed).manifest.items.length,1);
 }
 const a=mixed();a.db.boxes.at(-1).slots.push({c:1,r:1,w:1,h:1});assert.throws(()=>a.AddonExport.plan(a.db,a.seed),/overlap/);
 const b=mixed();b.db.packs[0].parent='bad\n[parent]';assert.throws(()=>b.AddonExport.plan(b.db,b.seed),/parent section/);
});
test('blank or missing names and descriptions never emit empty game text entries',()=>{
 for(const value of ['', '  \r\n\t ', undefined]){
  const a=setup();a.r.name=value;a.r.descr=value;
  const p=a.AddonExport.plan(a.db,a.seed);
  for(const file of p.files.filter(f=>f.name.endsWith('.xml'))){
   const xml=a.BUILD.decodeStringTable(file.bytes);
   assert(xml.includes('Custom rig'));assert(xml.includes('A chest rig with storage compartments.'));
   assert(!/<text>\s*<\/text>|<text\s*\/>/.test(xml));
  }
  assert.equal(a.r.descr,value,'export must not overwrite project text');
 }
});
test('two offline projects have no overlapping game files or item IDs',()=>{
 const a=setup(),b=setup(),pa=a.AddonExport.plan(a.db,a.seed),pb=b.AddonExport.plan(b.db,b.seed);
 assert.equal(pa.manifest.items.length,1);assert.equal(pa.entries.length,1);
 assert(!pa.manifest.files.some(f=>pb.manifest.files.includes(f)));
 assert.notEqual(pa.manifest.items[0].id,pb.manifest.items[0].id);
 assert(pa.width<2048&&pa.height<2048);
 assert(!pa.files.some(f=>/\.script$|\/ui\//.test(f.name)));
 const system=text(pa.files.find(f=>f.name.includes('/mod_system_')));
 assert.match(system,/slot\s*=\s*15/);assert.match(system,/icons_texture\s*=\s*ui\\zonebench\\zba_/);
 assert(!system.includes('[amprig_bandolier]'));assert(system.includes('['+pa.manifest.items[0].id+']'));
 for(const r of a.seed.rigs)assert(!system.includes('['+r.id+']'));
});
test('save/reload, item rename and version updates preserve identity; duplicates get a new item ID',()=>{
 const a=setup(),p=a.AddonExport.plan(a.db,a.seed),db=JSON.parse(JSON.stringify(a.db));
 const r=db.rigs.at(-1);r.name='Renamed';r.id='renamed_source';db.independentAddon.version='1.1';
 const q=a.AddonExport.plan(db,a.seed);assert.equal(p.manifest.items[0].id,q.manifest.items[0].id);assert.equal(p.texture,q.texture);
 db.rigs.push({...r,id:'another_rig'});a.AddonExport.ensure(db,a.seed);
 assert.notEqual(r.addonItemId,db.rigs.at(-1).addonItemId);
});
test('crafting and dismantling references between new rigs are namespaced',()=>{
 const a=setup();a.db.rigs.push({...a.r,id:'second_new_rig',craft:{kit:1,book:'recipe_basic_1',parts:[['my_new_rig',1]]},parts:['my_new_rig']});
 const p=a.AddonExport.plan(a.db,a.seed),id=p.manifest.items[0].id;
 const craft=text(p.files.find(f=>f.name.includes('/mod_craft_')));
 assert(craft.includes(id));assert(!craft.includes('my_new_rig'));
 const parts=text(p.files.find(f=>f.name.includes('/mod_parts_')));assert(parts.includes(id));assert(!parts.includes('my_new_rig'));
 a.db.independentAddon.excluded=[a.r.addonItemId];assert.throws(()=>a.AddonExport.plan(a.db,a.seed),/Select the custom item/);
});
test('existing-item edits alone cannot produce an independent add-on',()=>{
 const a=setup();a.db.rigs.pop();a.db.rigs[0].cost=999;assert.throws(()=>a.AddonExport.plan(a.db,a.seed),/at least one new item/);
});
test('new localized text and selected traders contain only the new item',()=>{
 const a=setup();a.r.name='Rig & test';const shelf=Object.keys(a.EMIT.SHELF_FILES)[0];a.r.shelves={[shelf]:{count:2,chance:50}};
 const p=a.AddonExport.plan(a.db,a.seed),id=p.manifest.items[0].id;
 for(const f of p.files.filter(f=>f.name.endsWith('.xml'))){const xml=a.BUILD.decodeStringTable(f.bytes);assert(xml.includes('Rig &amp; test'));assert(xml.includes('st_'+id+'_name'));assert(!xml.includes('st_amprig_bandolier_name'));}
 const trader=p.files.find(f=>f.name.includes('/trade/'));assert(text(trader).includes(id+' = 2, 0.5'));
});

test('manual modpack references survive independent export and project validation',()=>{
 const a=setup();a.r.craft={kit:2,book:'zona_recipe_book',cat:2,parts:[['zona_custom_fabric',3],['zona_custom_plate',2]]};a.r.parts=['zona_repair_fabric'];a.r.yield=['zona_scrap'];a.r.repair='zona_light_armour';
 assert.doesNotThrow(()=>a.ZB.validate(a.db));
 const p=a.AddonExport.plan(a.db,a.seed),all=p.files.map(text).join('\n');
 for(const id of ['zona_recipe_book','zona_custom_fabric','zona_custom_plate','zona_repair_fabric','zona_scrap','zona_light_armour'])assert(all.includes(id),id);
});


test('save-safe IDs losslessly preserve both UUIDs and remain stable offline',()=>{
 const a=setup();a.AddonExport.ensure(a.db,a.seed);
 a.db.independentAddon.id='72bb0903-c26b-4164-a77c-837ab2225358';a.r.addonItemId='335f43e0-d3e0-4391-a267-0a64f8c1cfe7';
 const p=a.AddonExport.plan(a.db,a.seed),id=p.manifest.items[0].id;
 assert.equal(Buffer.byteLength(id),55);assert.match(id,/^zb_r[0-9a-z]{25}_[0-9a-z]{25}$/);
 const decode=s=>[...s].reduce((n,c)=>n*36n+BigInt(parseInt(c,36)),0n).toString(16).padStart(32,'0');
 assert.equal(decode(id.slice(4,29)),'72bb0903c26b4164a77c837ab2225358');
 assert.equal(decode(id.slice(30)),'335f43e0d3e04391a2670a64f8c1cfe7');
 assert.equal(Object.values(p.manifest.sectionMigration)[0],id);assert.equal(p.manifest.exportRevision,2);
 const old=Object.keys(p.manifest.sectionMigration)[0];
 assert.equal(a.AddonExport.safeReference(old),id);
 const previous=id;a.db.independentAddon.id='72bb0903-c26b-4164-a77c-837ab2225359';
 assert.notEqual(a.AddonExport.plan(a.db,a.seed).manifest.items[0].id,previous);
});
test('old external addon recipe references are converted consistently',()=>{
 const a=setup(),old='zb_72bb0903c26b4164a77c837ab2225358_p67a0e41c4b724773b54a7ebc03f4b4cd';
 a.r.craft={kit:1,book:'recipe_basic_1',parts:[[old,1]]};a.r.parts=[old];a.r.yield=[old];
 const p=a.AddonExport.plan(a.db,a.seed),all=p.files.map(text).join('\n');
 assert(!all.includes(old));assert(all.includes(a.AddonExport.safeReference(old)));
});
test('export rejects overlong spawnable IDs and cross-category collisions but imports stay readable',()=>{
 const a=setup(),long='a'.repeat(64);
 assert.doesNotThrow(()=>a.ZB.validate({...a.db,rigs:[{...a.r,id:long}]}));
 assert.throws(()=>a.ZB.validateSpawnIds({rigs:[{id:long}]}),/63 ASCII/);
 assert.throws(()=>a.ZB.validateSpawnIds({rigs:[{id:'same'}],packs:[{id:'same'}]}),/Duplicate/);
 assert.doesNotThrow(()=>a.ZB.validateSpawnIds({rigs:[{id:'a'.repeat(63)}]}));
 a.r.craft={parts:[[long,1]]};assert.throws(()=>a.AddonExport.plan(a.db,a.seed),/63 ASCII/);
});
