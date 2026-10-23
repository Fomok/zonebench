const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const spec={tag:'fixture-2.1.0-hotfix1',name:'Squared.Away.2.1.0.Hotfix.1.zip',url:'https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/fixture-2.1.0-hotfix1/Squared.Away.2.1.0.Hotfix.1.zip'};
const hotfix={tag_name:spec.tag,name:'Squared Away 2.1.0 Hotfix 1',published_at:'2026-10-23T10:00:00Z',assets:[{name:spec.name,browser_download_url:spec.url}]};
async function load(release=hotfix,fallback=false){const raw=JSON.parse(fs.readFileSync('web/data/releases.json','utf8')).filter(r=>r.tag_name!=='v2.1.0-hotfix1');const c=vm.createContext({URL,AbortSignal,fetch:async url=>({ok:!fallback||url==='data/releases.json',json:async()=>[release,...raw]})});vm.runInContext(fs.readFileSync('web/src/releases.js','utf8').replace(/const modHotfixSpec=[^;]+;/,'const modHotfixSpec='+JSON.stringify(spec)+';'),c);return c.Releases.load();}
test('full hotfix inherits existing engine options and stash test without becoming an engine release',async()=>{
 const {items}=await load();const newest=items[0],previous=items.find(r=>r.tag==='v2.1.0');assert.equal(newest.tag,spec.tag);assert(newest.modOnlyUpdate);assert.equal(newest.mod.browser_download_url,spec.url);
 for(const key of ['engine','bodycam','stashGrid'])assert.equal(newest[key].browser_download_url,previous[key].browser_download_url);
 for(const key of ['bodycamDlss','bodycamFg'])assert.equal(newest[key].engine.browser_download_url,previous[key].engine.browser_download_url);
 const {updatePlan}=await import('../svelte/lib/update-plan.mjs');for(const [variant,installed] of [['standard',previous.engineUpdate.tag],['bodycam',previous.bodycamUpdate.tag],['bodycam-fg',previous.bodycamFg.tag]]){const p=updatePlan(items,'v2.1.0',variant,installed);assert(p.modNeeded);assert(!p.engineNeeded);assert(!p.newGame);const kept=updatePlan(items,'v2.1.0',variant,'compatible');assert(!kept.engineNeeded);assert(updatePlan(items,'v2.1.0',variant,'previous').engineNeeded);}
});
test('hotfix selection rejects unpublished or incorrect assets and works with verified cache',async()=>{
 for(const candidate of [{...hotfix,draft:true},{...hotfix,prerelease:true},{...hotfix,assets:[]},{...hotfix,assets:[{name:spec.name,browser_download_url:'https://invalid.example/archive.zip'}]}])assert(!(await load(candidate)).items.some(r=>r.tag===spec.tag));
 const cached=await load(hotfix,true);assert(cached.cached);assert.equal(cached.items[0].tag,spec.tag);
});
test('editor baseline contains no grid or corpse script payload to overwrite hotfixes',()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync('web/data/baseline.js','utf8')+';globalThis.seed=SEED;',c);assert(Object.keys(c.seed.files).every(name=>!name.endsWith('.script')));
 const importer=fs.readFileSync('web/src/archive.js','utf8');const wanted=importer.slice(importer.indexOf('var WANTED ='),importer.indexOf('var SHEETS ='));assert(!/zone_grid|corpse/.test(wanted));
});
