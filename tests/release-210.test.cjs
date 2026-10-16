const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({});vm.runInContext(fs.readFileSync('web/data/baseline.js','utf8'),c);
const seed=vm.runInContext('JSON.parse(JSON.stringify(SEED))',c);
const source=fs.readFileSync('web/src/editor.js','utf8');
vm.runInContext(source.slice(source.indexOf('function upgradeBaselineItems('),source.indexOf('function adoptSave(')),c);
test('2.1.0 adds four native items with shared atlas icons and matching definitions',()=>{
 assert.equal(seed.introducedItems.boxes.length,2);assert.equal(seed.introducedItems.pouches.length,2);
 for(const kind of ['boxes','pouches'])for(const id of seed.introducedItems[kind]){
  const item=seed[kind].find(i=>i.id===id);assert(item.icon.startsWith('data:image/png;base64,'));assert(id.length<=63);
  assert(seed.files['configs/mod_system_amp_'+kind+'.ltx'].includes('['+id+']'));
  assert(seed.files['configs/text/eng/zzz_amp_text.xml'].includes('st_'+id+'_name'));
 }
 assert(!JSON.stringify(seed.files).includes('ui\\\\zonebench\\\\'));
});
test('baseline upgrades add new stock items and refresh untouched fields without replacing custom work',()=>{
 const db=JSON.parse(JSON.stringify(seed));db.modVersion='2.0.6';
 for(const kind of ['rigs','boxes','pouches']){
  db[kind]=db[kind].filter(i=>!seed.introducedItems[kind].includes(i.id));
  for(const prior of seed.previousDefaults[kind])Object.assign(db[kind].find(i=>i.id===prior.id),prior.fields);
 }
 const rig=db.rigs.find(i=>i.id==='amprig_bandolier');rig.name='My personal rig';rig.cost=12345;
 c.upgradeBaselineItems(db,seed);
 assert.equal(rig.name,'My personal rig');assert.equal(rig.cost,12345);
 assert.equal(rig.icon,seed.rigs.find(i=>i.id===rig.id).icon);
 for(const kind of ['boxes','pouches'])for(const id of seed.introducedItems[kind])assert(db[kind].some(i=>i.id===id));
 const lengths=[db.boxes.length,db.pouches.length];c.upgradeBaselineItems(db,seed);
 assert.deepEqual([db.boxes.length,db.pouches.length],lengths);
});
test('baseline upgrades honor deliberately removed items',()=>{
 const id=seed.introducedItems.boxes[0],db={modVersion:'2.0.6',rigs:[],boxes:[],pouches:[],removed:[{kind:'boxes',id}]};
 c.upgradeBaselineItems(db,seed);assert(!db.boxes.some(i=>i.id===id));
});
test('2.1.0 pairs with existing October engines and keeps earlier downloads',async()=>{
 const raw=JSON.parse(fs.readFileSync('web/data/releases.json','utf8'));
 const old=raw.find(r=>r.tag_name==='v2.0.6-hotfix4');
 const fresh={...old,tag_name:'v2.1.0',name:'Squared Away 2.1.0 Minor Update',published_at:'2026-10-16T06:00:00Z',assets:[{...old.assets[0],name:'Squared Away 2.1.0 Minor Update.zip',browser_download_url:'https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/v2.1.0/Squared.Away.2.1.0.Minor.Update.zip'}]};
 const ctx=vm.createContext({URL,AbortSignal,fetch:async()=>({ok:true,json:async()=>[fresh,...raw.filter(r=>r.tag_name!=='v2.1.0')]})});
 vm.runInContext(fs.readFileSync('web/src/releases.js','utf8'),ctx);
 const result=await ctx.Releases.load();assert.equal(result.items[0].tag,'v2.1.0');assert(result.items[0].engine.browser_download_url.includes('engine-2026.10.11'));assert(result.items[0].bodycam);assert(result.items.some(r=>r.tag==='v2.0.6-hotfix4'));
 const {updatePlan}=await import('../svelte/lib/update-plan.mjs');
 for(const variant of ['standard','bodycam']){
  const upgrade=updatePlan(result.items,'v2.0.6-hotfix4',variant,'engine-2026.10.11');assert.equal(upgrade.modNeeded,true);assert.equal(upgrade.engineNeeded,false);
  const current=updatePlan(result.items,'v2.1.0',variant,'engine-2026.10.11');assert.equal(current.modNeeded,false);assert.equal(current.engineNeeded,false);
 }
});
