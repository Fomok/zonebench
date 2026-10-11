import editorRelease from '../editor-release.json' with {type:'json'};
export function addonLink(id){return /^[a-zA-Z0-9_-]+$/.test(id||'')?'#addons/view/'+id:null;}
export function recipeRequirements(pack,downloads=[]){
 const requirements=new Map();
 for(const {item} of pack?.items||[]){
  for(const [ingredient] of item.craft?.parts||[]){
   const dependency=item.recipeDependencies?.[ingredient];
   if(!dependency?.id)continue;
   let row=requirements.get(dependency.id);
   if(!row){const saved=downloads.find(d=>d.id===dependency.id);row={id:dependency.id,name:dependency.name||dependency.id,version:dependency.version||'',downloadedVersion:saved?.version||'',link:addonLink(saved?.listingId),items:[]};requirements.set(row.id,row);}
   if(!row.items.includes(item.name||item.id))row.items.push(item.name||item.id);
  }
 }
 return [...requirements.values()];
}
export function downloadStatus(download,listings,checked){
 if(editorRelease.exportRevision>1&&(Number(download.exportRevision)||0)<editorRelease.exportRevision)return {label:'Re-export required - existing saves may need migration',kind:'update'};
 if(!checked)return {label:'Update status not checked',kind:'unknown'};
 const listing=listings.find(l=>l.id===download.listingId);
 if(!listing)return {label:'No longer publicly listed',kind:'unavailable'};
 if(listing.revision>download.revision)return {label:'Update available · '+listing.version,kind:'update'};
 return {label:'Latest listed version',kind:'current'};
}


