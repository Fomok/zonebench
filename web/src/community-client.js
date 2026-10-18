(function(root){
'use strict';
let account=null,functions=null,current=null,pending=null;
function init(){if(account)return;const client=new Appwrite.Client().setEndpoint(COMMUNITY_CONFIG.endpoint).setProject(COMMUNITY_CONFIG.project);account=new Appwrite.Account(client);functions=new Appwrite.Functions(client);}
async function request(action,data={}){
 init();const execution=await functions.createExecution({functionId:COMMUNITY_CONFIG.functionId,body:JSON.stringify({...data,action}),async:false});
 let result;try{result=JSON.parse(execution.responseBody||'{}');}catch{throw new Error('Community returned an invalid response.');}
 if(execution.status!=='completed'||execution.responseStatusCode<200||execution.responseStatusCode>=400||result.error)throw new Error(result.error||'Community request failed.');return result;
}
root.Community={
 get enabled(){return COMMUNITY_CONFIG.enabled;},get user(){return current;},request,
 async refresh(){const result=await request('me');current=result.user;root.dispatchEvent?.(new root.Event('zonebench-account-changed'));return current;},
 async sendCode(email){init();pending=await account.createEmailToken({userId:Appwrite.ID.unique(),email,phrase:true});return pending.phrase;},
 async verify(code){if(!pending)throw new Error('Request a sign-in code first.');await account.createSession({userId:pending.userId,secret:code});pending=null;return this.refresh();},
 async name(name){init();await account.updateName({name});return this.refresh();},
 async signOut(){init();await account.deleteSession({sessionId:'current'});current=null;pending=null;root.dispatchEvent?.(new root.Event('zonebench-account-changed'));},
 selectForPublishing(rows,settings={}){
  SHARE_PICK=new Set(rows.map(r=>r.kind+'/'+r.item.id));
  if(settings.name)COMMUNITY_DRAFTS.set('new',{name:settings.name,version:settings.version||'1.0',author:current?.name||'',description:'',dependencies:'',agree:false});
  Site.go('share');
 },
 packSelection(){
  const mine=mineToShare().filter(m=>SHARE_PICK?.has(m.kind+'/'+m.it.id));
  const families={};for(const {kind,it} of mine)if(kind==='boxes'&&DB.families?.[it.takes])families[it.takes]=DB.families[it.takes];
  return {bench:'zonebench-items',version:1,from:DB.modVersion,families,items:mine.map(m=>({kind:m.kind,item:CommunityDownload.publishItem(m.kind,m.it,SEED)}))};
 },
 preview(result){
  ZB.validateAddon(result.pack);
  INCOMING={from:result.pack.from,families:result.pack.families||{},community:{id:result.listing.id,revision:result.listing.revision,version:result.listing.version},items:result.pack.items.map(x=>({kind:x.kind,item:x.item,take:true,how:x.item.adopt?'replace':'rename'}))};
  // Re-imports match the previously imported ID, including renamed items.
  for(const entry of INCOMING.items){const prior=(DB[entry.kind]||[]).find(x=>x.communitySource?.id===result.listing.id&&x.communitySource?.originalId===entry.item.id);if(prior){entry.originalId=entry.item.id;entry.item={...entry.item,id:prior.id};entry.how='replace';}}
  TAB='share';render();
 }
};
})(globalThis);
