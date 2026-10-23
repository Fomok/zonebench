(function(root){
'use strict';
const repo='Fomok/xray-monolith-inventory-edits';
// Verified full FOMOD release; inherits existing compatible engines.
const modHotfixSpec={"tag":"v2.1.0-hotfix1","name":"Squared.Away.2.1.0.Hotfix.1.zip","url":"https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/v2.1.0-hotfix1/Squared.Away.2.1.0.Hotfix.1.zip"};
const currentMod=r=>r.tag_name==='v2.1.0'||(modHotfixSpec&&r.tag_name===modHotfixSpec.tag);

// Explicitly approved experimental release; never promoted to the default engine.
const fgReleaseSpec={"tag":"bodycam-dlss-fg-2026.10.18","allowPrerelease":true,"assets":{"engine":{"tag":"bodycam-dlss-fg-2026.10.18","name":"Squared.Away.Engine.Bodycam.DLSS.FG.DX11.AVX.zip"},"gamma":{"tag":"bodycam-dlss-2026.10.18","name":"Bodycam.GAMMA.Patch.1.1.0.zip"},"shaders":{"tag":"bodycam-dlss-2026.10.18","name":"Bodycam.DLSS.Grass.Motion.Shader.Patch.zip"},"ui":{"tag":"bodycam-dlss-fg-2026.10.18","name":"Squared.Away.FG.UI.Scope.Patch.zip"},"optionalNr":{"tag":"bodycam-dlss-fg-2026.10.18","name":"Squared.Away.Optional.DLSS5.NR.Runtime.zip"}}};
function frameGeneration(raw){
 if(!fgReleaseSpec)return null;
 const release=raw.find(r=>r.tag_name===fgReleaseSpec.tag&&!r.draft&&(!r.prerelease||fgReleaseSpec.allowPrerelease===true));if(!release)return null;
 const result={tag:release.tag_name,version:'Bodycam + DLSS + Frame Generation',url:'https://github.com/'+repo+'/releases/tag/'+encodeURIComponent(release.tag_name)};
 for(const key of ['engine','gamma','shaders','ui','optionalNr']){
  const spec=fgReleaseSpec.assets[key];if(!spec){if(key==='optionalNr')continue;return null;}
  const source=raw.find(r=>r.tag_name===spec.tag&&!r.draft&&(!r.prerelease||(spec.tag===fgReleaseSpec.tag&&fgReleaseSpec.allowPrerelease===true)));
  const matches=source?.assets?.filter(a=>a.name===spec.name&&a.browser_download_url==='https://github.com/'+repo+'/releases/download/'+spec.tag+'/'+spec.name)||[];
  if(matches.length!==1||/merge|developer|source/i.test(matches[0].name)){if(key==='optionalNr')continue;return null;}result[key]=matches[0];
 }
 return result;
}
function pick(release){
 if(!release||release.draft||!Array.isArray(release.assets))return null;
 const mod=release.assets.filter(a=>/^Squared[-_ .]*Away[-_ .]+(?:\d|FOMOD)/i.test(a.name)&&/\.zip$/i.test(a.name)&&!/engine|source|model[-_ .]*test|for[-_ .]*developers|all[-_ .]*dx|dx(?:8|9|10|11)/i.test(a.name));
 const engine=release.assets.filter(a=>!/bodycam/i.test(a.name)&&/\.zip$/i.test(a.name)&&(/Squared[-_ .]*Away.*(?:DX11.*AVX|All[-_ .]*DX)/i.test(a.name)||/STALKER-Anomaly-modded-exes.*SquaredAway/i.test(a.name)));
 if(mod.length!==1||engine.length!==1)return null;
 const safe=a=>{try{const u=new URL(a.browser_download_url);return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.startsWith('/'+repo+'/releases/download/');}catch{return false;}};
 if(!safe(mod[0])||!safe(engine[0]))return null;
 const bodycam=release.assets.filter(a=>/bodycam/i.test(a.name)&&/engine/i.test(a.name)&&/\.zip$/i.test(a.name)&&safe(a));
 return {tag:release.tag_name,name:release.name||release.tag_name,preview:!!release.prerelease,date:release.published_at,notes:release.body||'',url:'https://github.com/'+repo+'/releases/tag/'+encodeURIComponent(release.tag_name),mod:mod[0],modOnlyUpdate:!!release.modOnlyUpdate,engine:engine[0],engineUpdate:release.engineUpdate||null,bodycamUpdate:release.bodycamUpdate||null,bodycamDlss:release.bodycamDlss||null,bodycamFg:release.bodycamFg||null,bodycam:bodycam.length===1?bodycam[0]:null,stashGrid:currentMod(release)?(release.assets.find(a=>a.name==='Squared.Away.Stash.Grid.Optional.Test.2.zip'&&safe(a))||release.assets.find(a=>/^Squared[ .]Away[ .]Stash[ .]Grid[ .]Optional[ .]Test\.zip$/.test(a.name)&&safe(a)))||null:null};
}
function compatible(raw){
 if(modHotfixSpec)raw=raw.filter(r=>r.tag_name!==modHotfixSpec.tag||(!r.draft&&!r.prerelease&&r.assets?.filter(a=>a.name===modHotfixSpec.name&&a.browser_download_url===modHotfixSpec.url).length===1));
 const previous=raw.find(r=>r.tag_name==='v2.0.3'&&!r.draft);
 const update=raw.find(r=>r.tag_name==='engine-2026.10.11'&&!r.draft&&!r.prerelease);
 const updated=update&&previous&&pick({...update,assets:[...update.assets,...previous.assets.filter(a=>/^Squared.*2\.0\.3\.zip$/i.test(a.name))]});
 const paired = raw.map(r=>(currentMod(r)||r.tag_name==='v2.0.6-hotfix4')&&updated?{...r,assets:[...r.assets,...update.assets],engineUpdate:{tag:update.tag_name,version:'2026.10.11',url:updated.url}}:['v2.1.0','v2.0.4','v2.0.5','v2.0.6','v2.0.6-hotfix','v2.0.6-hotfix2','v2.0.6-hotfix3','v2.0.6-hotfix4'].includes(r.tag_name)&&previous?{...r,assets:[...r.assets,...previous.assets.filter(a=>/Engine|Developers/i.test(a.name))]}:r);
 const dlssRelease=raw.find(r=>r.tag_name==='bodycam-dlss-2026.10.18'&&!r.draft&&!r.prerelease);
 const dlssAsset=name=>dlssRelease?.assets.find(a=>a.name===name&&a.browser_download_url==='https://github.com/'+repo+'/releases/download/'+dlssRelease.tag_name+'/'+name);
 const dlssEngine=dlssAsset('Squared.Away.Engine.Bodycam.DLSS.DX11.AVX.zip'),dlssShaders=dlssAsset('Bodycam.DLSS.Grass.Motion.Shader.Patch.zip'),dlssGamma=dlssAsset('Bodycam.GAMMA.Patch.1.1.0.zip');
 if(dlssEngine&&dlssShaders&&dlssGamma){for(const current of paired.filter(currentMod))current.bodycamDlss={engine:dlssEngine,shaders:dlssShaders,gamma:dlssGamma};}
 const fg=frameGeneration(raw);if(fg){for(const current of paired.filter(currentMod))current.bodycamFg=fg;}
 const base=raw.find(r=>r.tag_name==='v2.1.0'&&!r.draft);
 if(modHotfixSpec&&base){for(const current of paired.filter(r=>r.tag_name===modHotfixSpec.tag)){current.modOnlyUpdate=true;current.assets=[...current.assets,...base.assets.filter(a=>a.name==='Squared.Away.Stash.Grid.Optional.Test.2.zip')];}}
 const bodycamRelease=raw.find(r=>r.tag_name==='bodycam-0.3-2026.10.16'&&!r.draft&&!r.prerelease);
 return paired.map(r=>{
  if(!currentMod(r)||!bodycamRelease)return r;
  const candidate={...r,assets:[...r.assets.filter(a=>!/bodycam/i.test(a.name)),...bodycamRelease.assets.filter(a=>/engine/i.test(a.name))]};
  if(!pick(candidate)?.bodycam)return r;
  const patch=bodycamRelease.assets.find(a=>a.name==='Bodycam.GAMMA.Patch.1.1.0.zip'&&a.browser_download_url==='https://github.com/'+repo+'/releases/download/'+bodycamRelease.tag_name+'/'+a.name);
  return {...candidate,bodycamUpdate:{tag:bodycamRelease.tag_name,version:'Bodycam 0.3',patch:patch?.browser_download_url||null}};
 });
}
let pending;
async function load(){
 if(!pending)pending=(async()=>{
  try{const response=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=20',{signal:AbortSignal.timeout(10000),headers:{Accept:'application/vnd.github+json'}});if(!response.ok)throw Error('Release lookup unavailable');const raw=await response.json();if(!Array.isArray(raw))throw Error('Invalid release response');return {items:compatible(raw).map(pick).filter(Boolean).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)),cached:false};}
  catch{const response=await fetch('data/releases.json');if(!response.ok)throw Error('Downloads are temporarily unavailable. Please retry.');const raw=await response.json();return {items:compatible(raw).map(pick).filter(Boolean).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)),cached:true};}
 })();return pending;
}
root.Releases={pick,load};
})(globalThis);
