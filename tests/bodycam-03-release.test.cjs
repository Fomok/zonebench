const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base='https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/';
const tag='bodycam-0.3-2026.10.16';
const extra={tag_name:tag,draft:false,assets:['Squared.Away.Engine.Bodycam.0.3.DX11.AVX.zip','Bodycam.GAMMA.Patch.1.1.0.zip'].map(name=>({name,browser_download_url:base+tag+'/'+name}))};
async function load(extraRelease){const raw=JSON.parse(fs.readFileSync('web/data/releases.json')).filter(r=>r.tag_name!==tag);const c=vm.createContext({URL,AbortSignal,fetch:async()=>({ok:true,json:async()=>[extraRelease,...raw]})});vm.runInContext(fs.readFileSync('web/src/releases.js','utf8'),c);return(await c.Releases.load()).items;}
test('Bodycam 0.3 attaches only to current mod, with separate standard engine and GAMMA patch',async()=>{
 const items=await load(extra),r=items.find(r=>r.tag==='v2.1.0');assert(r.bodycam.browser_download_url.includes(tag));assert(r.engine.browser_download_url.includes('engine-2026.10.11'));assert(r.bodycamUpdate.patch.endsWith('Bodycam.GAMMA.Patch.1.1.0.zip'));assert(items.find(r=>r.tag==='v2.0.6-hotfix4').bodycam.browser_download_url.includes('engine-2026.10.11'));
 const {updatePlan}=await import('../svelte/lib/update-plan.mjs');assert(!updatePlan(items,'v2.1.0','standard','engine-2026.10.11').engineNeeded);assert(updatePlan(items,'v2.1.0','bodycam','engine-2026.10.11').engineNeeded);assert(!updatePlan(items,'v2.1.0','bodycam',tag).engineNeeded);
});
test('draft or unsafe Bodycam downloads never replace the current safe package',async()=>{
 for(const variant of [{...extra,draft:true},{...extra,assets:extra.assets.map(a=>({...a,browser_download_url:'https://invalid.example/file.zip'}))}]){const r=(await load(variant)).find(r=>r.tag==='v2.1.0');assert(!r.bodycamUpdate);assert(r.bodycam.browser_download_url.includes('engine-2026.10.11'));}
});
