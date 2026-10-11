const {test}=require('node:test');
const assert=require('node:assert/strict');
const asset=url=>({browser_download_url:url});
const releases=[{tag:'v2.0.4',mod:asset('mod4'),engine:asset('engine3'),bodycam:asset('bodycam3')},{tag:'v2.0.3',mod:asset('mod3'),engine:asset('engine3'),bodycam:asset('bodycam3')},{tag:'v2.0.2',mod:asset('mod2'),engine:asset('engine2'),bodycam:asset('bodycam2')}];
test('2.0.3 to 2.0.4 requires only the mod for both engine variants',async()=>{const {updatePlan}=await import('../svelte/lib/update-plan.mjs');for(const variant of ['standard','bodycam']){const p=updatePlan(releases,'v2.0.3',variant);assert.equal(p.modNeeded,true);assert.equal(p.engineNeeded,false);}});
test('older versions require their selected new engine',async()=>{const {updatePlan}=await import('../svelte/lib/update-plan.mjs');const p=updatePlan(releases,'v2.0.2','bodycam');assert.equal(p.engineNeeded,true);assert.equal(p.engine.browser_download_url,'bodycam3');assert.equal(p.newGame,false);});
test('current version needs no files; unknown and legacy remain conservative',async()=>{const {updatePlan}=await import('../svelte/lib/update-plan.mjs');const current=updatePlan(releases,'v2.0.4');assert.equal(current.modNeeded,false);assert.equal(current.engineNeeded,false);assert.equal(updatePlan(releases,'unknown').engineNeeded,true);assert.equal(updatePlan(releases,'legacy').newGame,true);assert.equal(updatePlan(releases,''),null);});
test('future changed engines are detected and prereleases skipped',async()=>{const {updatePlan}=await import('../svelte/lib/update-plan.mjs');const rows=[{...releases[0],tag:'v2.0.6',preview:true},{...releases[0],tag:'v2.0.5',engine:asset('engine5')},...releases];const p=updatePlan(rows,'v2.0.4');assert.equal(p.latest.tag,'v2.0.5');assert.equal(p.engineNeeded,true);});

test('engine-only update keeps the latest mod and updates either engine variant',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');const raw=JSON.parse(fs.readFileSync('web/data/releases.json','utf8'));
 const context=vm.createContext({URL,fetch:async()=>({ok:true,json:async()=>raw}),AbortSignal});vm.runInContext(fs.readFileSync('web/src/releases.js','utf8'),context);
 const {items}=await context.Releases.load();assert.equal(items[0].tag,'v2.0.6-hotfix4');assert(items.some(r=>r.tag==='v2.0.6'));const {updatePlan}=await import('../svelte/lib/update-plan.mjs');
 for(const installed of ['v2.0.4','v2.0.6','v2.0.6-hotfix','v2.0.6-hotfix2','v2.0.6-hotfix3'])for(const variant of ['standard','bodycam']){const plan=updatePlan(items,installed,variant);assert(plan.modNeeded);assert(plan.engineNeeded);assert.match(plan.engine.browser_download_url,/engine-2026\.10\.11/);}
});

test('current hotfix users can update only the engine or keep the already updated engine',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');const raw=JSON.parse(fs.readFileSync('web/data/releases.json','utf8'));
 const c=vm.createContext({URL,AbortSignal,fetch:async()=>({ok:true,json:async()=>raw})});vm.runInContext(fs.readFileSync('web/src/releases.js','utf8'),c);
 const {items}=await c.Releases.load();const {updatePlan}=await import('../svelte/lib/update-plan.mjs');
 for(const variant of ['standard','bodycam']){
  const p=updatePlan(items,'v2.0.6-hotfix4',variant,'previous');assert.equal(p.modNeeded,false);assert.equal(p.engineNeeded,true);
  const current=updatePlan(items,'v2.0.6-hotfix4',variant,'engine-2026.10.11');assert.equal(current.modNeeded,false);assert.equal(current.engineNeeded,false);
 }
 const old=items.find(r=>r.tag==='v2.0.3');assert.match(old.engine.browser_download_url,/v2\.0\.3/);assert.match(old.bodycam.browser_download_url,/v2\.0\.3/);
});
