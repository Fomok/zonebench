const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base='https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/';
const tag='verified-fg-fixture';
const names={engine:'Squared.Away.Bodycam.DLSS.FG.Runtime.zip',gamma:'Bodycam.GAMMA.Patch.1.1.0.zip',shaders:'Bodycam.DLSS.Grass.Motion.Shader.Patch.zip',ui:'Squared.Away.FG.UI.Scope.Patch.zip'};
const spec={tag,assets:Object.fromEntries(Object.entries(names).map(([key,name])=>[key,{tag,name}]))};
const release={tag_name:tag,assets:Object.values(names).map(name=>({name,browser_download_url:base+tag+'/'+name}))};
async function load(extra,{fallback=false,config=spec}={}){
 const raw=JSON.parse(fs.readFileSync('web/data/releases.json','utf8')).filter(r=>r.tag_name!==tag);
 const c=vm.createContext({URL,AbortSignal,fetch:async url=>({ok:!fallback||url==='data/releases.json',json:async()=>[extra,...raw]})});
 const code=fs.readFileSync('web/src/releases.js','utf8').replace(/const fgReleaseSpec=[^;]+;/,'const fgReleaseSpec='+JSON.stringify(config)+';');vm.runInContext(code,c);return c.Releases.load();
}
test('verified FG release attaches only to current mod and preserves every existing engine choice',async()=>{
 const {items}=await load(release),current=items.find(r=>r.tag==='v2.1.0');assert(current.bodycamFg);assert(current.bodycamFg.ui);assert(current.bodycamDlss);assert(current.bodycam);assert(current.engine);
 assert(!current.engine.browser_download_url.includes(tag));assert(!current.bodycam.browser_download_url.includes(tag));assert(!current.bodycamDlss.engine.browser_download_url.includes(tag));assert(items.filter(r=>!['v2.1.0','v2.1.0-hotfix1'].includes(r.tag)).every(r=>!r.bodycamFg));
});
test('unverified, draft, incomplete, duplicate or unsafe FG assets never produce a download choice',async()=>{
 assert(!(await load(release,{config:null})).items.find(r=>r.tag==='v2.1.0').bodycamFg);
 for(const candidate of [{...release,draft:true},{...release,prerelease:true},{...release,assets:release.assets.slice(0,3)},{...release,assets:[...release.assets,release.assets[0]]},{...release,assets:release.assets.map(a=>({...a,browser_download_url:'https://invalid.example/'+a.name}))}])assert(!(await load(candidate)).items.find(r=>r.tag==='v2.1.0').bodycamFg);
});
test('verified cached FG release works offline while developer/merge payloads stay unlinked',async()=>{
 const result=await load({...release,assets:[...release.assets,{name:'Developer.Merge.Kit.zip',browser_download_url:base+tag+'/Developer.Merge.Kit.zip'}]},{fallback:true});assert(result.cached);const fg=result.items.find(r=>r.tag==='v2.1.0').bodycamFg;assert(fg);assert(!JSON.stringify(fg).includes('Merge.Kit'));
});

test('only explicitly approved experimental FG releases are selectable',async()=>{
 const result=await load({...release,prerelease:true},{config:{...spec,allowPrerelease:true}});assert(result.items.find(r=>r.tag==='v2.1.0').bodycamFg);assert(!result.items.find(r=>r.tag==='v2.1.0').preview);
});
test('optional NR reinstall asset is exact and its absence does not hide the engine',async()=>{
 const name='Squared.Away.Optional.DLSS5.NR.Runtime.zip',config={...spec,assets:{...spec.assets,optionalNr:{tag,name}}};
 const withNr=await load({...release,assets:[...release.assets,{name,browser_download_url:base+tag+'/'+name}]},{config});assert(withNr.items.find(r=>r.tag==='v2.1.0').bodycamFg.optionalNr);
 const withoutNr=await load(release,{config});assert(withoutNr.items.find(r=>r.tag==='v2.1.0').bodycamFg);assert(!withoutNr.items.find(r=>r.tag==='v2.1.0').bodycamFg.optionalNr);
});
