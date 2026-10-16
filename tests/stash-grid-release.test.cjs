const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('stash grid is an optional download and cannot replace the mod or engine',async()=>{
 const raw=JSON.parse(fs.readFileSync('web/data/releases.json'));
 const release=raw.find(r=>r.tag_name==='v2.1.0');
 release.assets=release.assets.filter(a=>!/Stash[ .]Grid/.test(a.name));
 const asset={name:'Squared.Away.Stash.Grid.Optional.Test.zip',browser_download_url:'https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/v2.1.0/Squared.Away.Stash.Grid.Optional.Test.zip'};
 release.assets.push(asset);
 const c=vm.createContext({URL,AbortSignal,fetch:async()=>({ok:true,json:async()=>raw})});vm.runInContext(fs.readFileSync('web/src/releases.js','utf8'),c);
 const items=(await c.Releases.load()).items,r=items.find(r=>r.tag==='v2.1.0');
 assert.equal(r.stashGrid.name,asset.name);assert(!/Stash/.test(r.mod.name));assert(r.engine);
 const {updatePlan}=await import('../svelte/lib/update-plan.mjs');assert(!updatePlan(items,'v2.1.0','standard','engine-2026.10.11').engineNeeded);
 assert(!c.Releases.pick({...release,assets:[...release.assets.filter(a=>a!==asset),r.engine,{...asset,browser_download_url:'https://invalid.example/test.zip'}]}).stashGrid);
});
