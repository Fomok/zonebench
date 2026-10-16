(function(root){
'use strict';
const repo='Fomok/xray-monolith-inventory-edits';
function pick(release){
 if(!release||release.draft||!Array.isArray(release.assets))return null;
 const mod=release.assets.filter(a=>/^Squared[-_ .]*Away[-_ .]+(?:\d|FOMOD)/i.test(a.name)&&/\.zip$/i.test(a.name)&&!/engine|source|model[-_ .]*test|for[-_ .]*developers|all[-_ .]*dx|dx(?:8|9|10|11)/i.test(a.name));
 const engine=release.assets.filter(a=>!/bodycam/i.test(a.name)&&/\.zip$/i.test(a.name)&&(/Squared[-_ .]*Away.*(?:DX11.*AVX|All[-_ .]*DX)/i.test(a.name)||/STALKER-Anomaly-modded-exes.*SquaredAway/i.test(a.name)));
 if(mod.length!==1||engine.length!==1)return null;
 const safe=a=>{try{const u=new URL(a.browser_download_url);return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.startsWith('/'+repo+'/releases/download/');}catch{return false;}};
 if(!safe(mod[0])||!safe(engine[0]))return null;
 const bodycam=release.assets.filter(a=>/bodycam/i.test(a.name)&&/engine/i.test(a.name)&&/\.zip$/i.test(a.name)&&safe(a));
 return {tag:release.tag_name,name:release.name||release.tag_name,preview:!!release.prerelease,date:release.published_at,notes:release.body||'',url:'https://github.com/'+repo+'/releases/tag/'+encodeURIComponent(release.tag_name),mod:mod[0],engine:engine[0],engineUpdate:release.engineUpdate||null,bodycamUpdate:release.bodycamUpdate||null,bodycam:bodycam.length===1?bodycam[0]:null,stashGrid:release.tag_name==='v2.1.0'?release.assets.find(a=>/^Squared[ .]Away[ .]Stash[ .]Grid[ .]Optional[ .]Test\.zip$/.test(a.name)&&safe(a))||null:null};
}
function compatible(raw){
 const previous=raw.find(r=>r.tag_name==='v2.0.3'&&!r.draft);
 const update=raw.find(r=>r.tag_name==='engine-2026.10.11'&&!r.draft&&!r.prerelease);
 const updated=update&&previous&&pick({...update,assets:[...update.assets,...previous.assets.filter(a=>/^Squared.*2\.0\.3\.zip$/i.test(a.name))]});
 const paired = raw.map(r=>['v2.1.0','v2.0.6-hotfix4'].includes(r.tag_name)&&updated?{...r,assets:[...r.assets,...update.assets],engineUpdate:{tag:update.tag_name,version:'2026.10.11',url:updated.url}}:['v2.1.0','v2.0.4','v2.0.5','v2.0.6','v2.0.6-hotfix','v2.0.6-hotfix2','v2.0.6-hotfix3','v2.0.6-hotfix4'].includes(r.tag_name)&&previous?{...r,assets:[...r.assets,...previous.assets.filter(a=>/Engine|Developers/i.test(a.name))]}:r);
 const bodycamRelease=raw.find(r=>r.tag_name==='bodycam-0.3-2026.10.16'&&!r.draft&&!r.prerelease);
 return paired.map(r=>{
  if(r.tag_name!=='v2.1.0'||!bodycamRelease)return r;
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
