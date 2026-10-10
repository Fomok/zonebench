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
 return {tag:release.tag_name,name:release.name||release.tag_name,preview:!!release.prerelease,date:release.published_at,notes:release.body||'',url:'https://github.com/'+repo+'/releases/tag/'+encodeURIComponent(release.tag_name),mod:mod[0],engine:engine[0],bodycam:bodycam.length===1?bodycam[0]:null};
}
function compatible(raw){
 const previous=raw.find(r=>r.tag_name==='v2.0.3'&&!r.draft);
 return raw.map(r=>['v2.0.4','v2.0.5','v2.0.6','v2.0.6-hotfix','v2.0.6-hotfix2','v2.0.6-hotfix3'].includes(r.tag_name)&&previous?{...r,assets:[...r.assets,...previous.assets.filter(a=>/Engine|Developers/i.test(a.name))]}:r);
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
