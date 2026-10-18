let COMMUNITY_MODE='public',COMMUNITY_OFFSET=0,COMMUNITY_EDIT=null;
function communityMessage(P,message,kind='hint'){const node=el('p',kind);node.textContent=message;P.appendChild(node);return node;}
function communityButton(parent,label,fn,primary=false){const b=el('button',primary?'tool primary':'tool');b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){communityMessage(parent,e.message,'warn');}finally{b.disabled=false;}};parent.appendChild(b);return b;}
function communityField(parent,label,value='',type='text'){
 const wrap=document.createElement('label');wrap.className='community-field';const title=document.createElement('span');title.textContent=label;wrap.appendChild(title);
 const input=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value;input.setAttribute('aria-label',label);wrap.appendChild(input);parent.appendChild(wrap);return input;
}
async function drawCommunityAccount(P){
 P.appendChild(el('h1',null,'Your account'));
 drawProjectReset(P);
 if(!Community.enabled){communityMessage(P,'Community accounts will open after backend setup is complete. The editor and local project files are available now.');return;}
 const status=communityMessage(P,'Checking sign-in…');
 let user;try{user=await Community.refresh();}catch(e){status.textContent=e.message;return;}if(!P.contains(status))return;status.remove();
 const card=el('div','card');P.appendChild(card);
 if(user){
  communityMessage(card,'Signed in as '+(user.name||'a new creator')+(user.moderator?' · Maintainer':''));
  if(user.blocked)communityMessage(card,'Publishing is disabled for this account. You can still unpublish your own listings.','warn');
  const name=communityField(card,'Public display name',user.name);name.maxLength=60;
  communityButton(card,'Save display name',async()=>{if(name.value.trim().length<2)throw new Error('Enter at least two characters.');await Community.name(name.value.trim());communityMessage(card,'Display name saved.');});
  communityButton(card,'My add-ons',async()=>{COMMUNITY_MODE='mine';COMMUNITY_OFFSET=0;TAB='catalog';render();});
  if(user.moderator){
   communityMessage(card,'Admin controls: remove unwanted add-ons, block publishing by abusive creators, or save an add-on for a future mod update.');
   communityButton(card,'Manage public add-ons',async()=>{COMMUNITY_MODE='moderation';COMMUNITY_OFFSET=0;Site.go('catalog');},true);
   communityButton(card,'Edit site text',async()=>SiteCopy.open(),true);
   communityButton(card,'Next mod update',async()=>{COMMUNITY_MODE='selections';COMMUNITY_OFFSET=0;Site.go('catalog');});
  }
  communityButton(card,'Sign out',async()=>{await Community.signOut();SiteCopy.close();renderPane();});
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Account details';details.appendChild(summary);communityMessage(details,'Account ID: '+user.id);card.appendChild(details);
  return;
 }
 communityMessage(card,'Sign in to publish and manage your add-ons. Browsing and importing do not need an account. Your email is used for sign-in and is not shown on listings.');
 const email=communityField(card,'Email address','','email');email.autocomplete='email';
 const send=communityButton(card,'Send sign-in code',async()=>{
  if(!email.validity.valid||!email.value.trim())throw new Error('Enter a valid email address.');
  const phrase=await Community.sendCode(email.value.trim());send.hidden=true;email.disabled=true;
  communityMessage(card,'Enter the code from your email.'+(phrase?' Check that the email contains this phrase: '+phrase:''));
  const code=communityField(card,'Sign-in code');code.autocomplete='one-time-code';code.inputMode='numeric';
  communityButton(card,'Sign in',async()=>{await Community.verify(code.value.trim());renderPane();},true);
  communityButton(card,'Use a different email',async()=>renderPane());code.focus();
 },true);
}
async function drawCommunityCatalog(P){
 const intro=el('div','addons-heading');P.appendChild(intro);
 intro.appendChild(el('p','eyebrow','THE COMMUNITY WORKBENCH'));
 intro.appendChild(el('h1',null,({public:'Add-ons',mine:'My add-ons',moderation:'Manage add-ons',selections:'Next mod update'})[COMMUNITY_MODE]||'Add-ons'));
 communityMessage(intro,COMMUNITY_MODE==='mine'?'Your published items, in one place. Update an existing listing instead of creating a new version beside it.':'Find gear for your loadout. Inspect each item, then import only what you want.');
 const create=el('a','tool addon-create','Create an add-on');create.href='#editor/create';create.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();Site.go('create');};intro.appendChild(create);
 const controls=el('div','community-actions');P.appendChild(controls);
 const status=communityMessage(P,'Loading community library…');
 try{
  const user=await Community.refresh();if(!P.contains(status))return;
  for(const [mode,label] of [['public','Browse add-ons'],['mine','My add-ons'],...(user?.moderator?[['moderation','Moderate'],['selections','Next mod update']]:[])]){const button=communityButton(controls,label,async()=>Site.addons(mode),COMMUNITY_MODE===mode);button.setAttribute('aria-pressed',String(COMMUNITY_MODE===mode));}
  communityButton(controls,user?'Account':'Sign in',async()=>{TAB='account';render();});
  if(!user&&COMMUNITY_MODE!=='public'){status.remove();const empty=el('section','card addon-empty');P.appendChild(empty);empty.appendChild(el('h2',null,'Your add-ons belong here'));communityMessage(empty,'Sign in to find and manage your published add-ons. You can browse and create items without an account.');communityButton(empty,'Go to account',async()=>Site.go('account'),true);communityButton(empty,'Browse add-ons',async()=>Site.addons('public'));return;}
  if(COMMUNITY_EDIT&&user){status.remove();drawCommunityPublish(P,COMMUNITY_EDIT);return;}
  const selected=COMMUNITY_MODE==='selections';
  const result=await Community.request(selected?'selections':'list',{mode:COMMUNITY_MODE,offset:COMMUNITY_MODE==='public'?0:COMMUNITY_OFFSET});if(!P.contains(status))return;
  // Metadata is small. Search the whole public library, not only its first page.
  if(COMMUNITY_MODE==='public'){let offset=result.items.length;while(offset<result.total){status.textContent='Loading add-ons: '+offset+' of '+result.total+'…';const page=await Community.request('list',{mode:'public',offset});if(!P.contains(status))return;if(!page.items.length)break;result.items.push(...page.items);offset+=page.items.length;}}
  status.remove();
  if(COMMUNITY_MODE==='mine')communityButton(P,'Publish a new add-on',async()=>{TAB='share';render();},true);
  if(!result.items.length&&COMMUNITY_MODE!=='public')communityMessage(P,selected?'No versions selected for the next mod update.':'No add-ons here yet. Create items in the editor, then choose Publish an add-on from the Add-ons menu.');
  const records=[...new Map(result.items.map(listing=>[listing.id,listing])).values()].map(listing=>({listing,load:CatalogBrowser.once(()=>Community.request(selected?'selectedPack':'pack',{id:listing.id}))}));
  function renderListing(record,grid){const listing=record.listing;
   const row=el('article','card addon-listing');grid.appendChild(row);const card=el('div','addon-listing-content');row.appendChild(card);const title=el('h2');title.textContent=listing.name;card.appendChild(title);
   communityMessage(card,listing.author+' · '+listing.version+(listing.status&&listing.status!=='published'?' · '+listing.status:''));
   if(listing.description)communityMessage(card,listing.description);
   if(listing.dependencies)communityMessage(card,'Requires: '+listing.dependencies);
   const imports=['rigs','boxes','pouches','packs','items'].flatMap(k=>DB[k]||[]).filter(x=>x.communitySource?.id===listing.id);
   if(imports.length)communityMessage(card,imports.some(x=>x.communitySource.revision<listing.revision)?'Update available — your imported version stays unchanged until you choose to import.':'Items from this version are in your project.');
   const show=AddonPreview.card(card,listing,record.load,result=>Community.preview(result));
   communityButton(card,'View items',show,true);
   if(imports.some(x=>x.communitySource.revision<listing.revision))communityButton(card,'Compare update',async()=>Community.preview(await record.load()),true);
   if(listing.canEdit){
    communityButton(card,'Edit / update',async()=>{COMMUNITY_EDIT=listing;renderPane();});
    if(listing.status!=='removed')communityButton(card,listing.status==='published'?'Unpublish':'Publish again',async()=>{
     if(!confirm(listing.status==='published'?'Remove this listing from public browsing? Existing imports remain in people’s projects.':'Make this listing public again?'))return;
     await Community.request(listing.status==='published'?'unpublish':'republish',{id:listing.id,expectedRevision:listing.revision});renderPane();
    });
   }
   if(user?.moderator){
    if(selected)communityButton(card,'Remove from next update',async()=>{await Community.request('unselect',{id:listing.id});renderPane();});
    else{
     communityButton(card,'Select for next mod update',async()=>{await Community.request('select',{id:listing.id,expectedRevision:listing.revision});communityMessage(card,'A private copy of version '+listing.version+' is saved for the next update.');});
     if(listing.status!=='removed')communityButton(card,'Remove listing',async()=>{if(!confirm('Remove this public listing? Its creator will not be able to republish it.'))return;await Community.request('remove',{id:listing.id,expectedRevision:listing.revision});renderPane();});
     communityButton(card,'Block creator publishing',async()=>{if(!confirm('Block further publishing and updates by this creator? Remove unwanted listings separately.'))return;await Community.request('block',{id:listing.id});communityMessage(card,'Creator publishing blocked.');});
     communityButton(card,'Unblock creator',async()=>{await Community.request('unblock',{id:listing.id});communityMessage(card,'Creator publishing restored.');});
    }
   }
  }
  if(COMMUNITY_MODE==='public'){CatalogBrowser.mount(P,records,renderListing);return;}
  const grid=el('div','catalog-grid');P.appendChild(grid);for(const record of records)renderListing(record,grid);
  const pages=el('div','community-actions');P.appendChild(pages);
  if(COMMUNITY_OFFSET>0)communityButton(pages,'Previous page',async()=>{COMMUNITY_OFFSET=Math.max(0,COMMUNITY_OFFSET-24);renderPane();});
  if(COMMUNITY_OFFSET+24<result.total)communityButton(pages,'Next page',async()=>{COMMUNITY_OFFSET+=24;renderPane();});
 }catch(e){status.textContent=e.message+' Your local project is unchanged.';}
}
const COMMUNITY_DRAFTS=new Map();
function drawCommunityPublish(P,listing=null,sessionChecked=false){
 const card=el('section','card share-publish');P.appendChild(card);card.appendChild(el('h2',null,listing?'Update your add-on':'2. Add-on details'));
 if(!Community.enabled){communityMessage(card,'Community publishing is currently unavailable. File sharing is available below.');return;}
 if(!Community.user){
  communityMessage(card,'Sign in to publish. You can choose and inspect your items first.');
  communityButton(card,'Sign in to publish',async()=>{TAB='account';render();},true);
  if(!sessionChecked)Community.refresh().then(user=>{if(user&&card.isConnected){const mount=document.createElement('div');card.replaceWith(mount);drawCommunityPublish(mount,listing,true);}}).catch(e=>{if(card.isConnected)communityMessage(card,e.message,'warn');});
  return;
 }
 const draftKey=listing?.id||'new';
 if(!COMMUNITY_DRAFTS.has(draftKey))COMMUNITY_DRAFTS.set(draftKey,{name:listing?.name||'',author:listing?.author||Community.user.name||'',version:listing?.version||'1.0',description:listing?.description||'',dependencies:listing?.dependencies||'',replace:false,agree:false});
 const draft=COMMUNITY_DRAFTS.get(draftKey);
 communityMessage(card,listing?'Changes update this listing instead of creating another version in the list.':'Give your add-on a name and explain what it adds. Your draft stays here while you change the selected items.');
 const fields=el('div','share-publish-fields');card.appendChild(fields);
 for(const [key,label,max,type] of [['name','Add-on name',100,'text'],['author','Author display name',60,'text'],['version','Version',32,'text'],['description','Description',2000,'textarea'],['dependencies','Required mods / source mods',500,'text']]){
  const input=communityField(fields,label,draft[key],type);input.maxLength=max;input.oninput=()=>{draft[key]=input.value;};
 }
 let currentPack=null;
 if(listing){
  const contents=el('section','update-contents');card.appendChild(contents);
  contents.appendChild(el('h3',null,'Items in this update'));
  const status=el('p','hint','Loading published contents…');contents.appendChild(status);
  Community.request('pack',{id:listing.id}).then(result=>{
   if(!card.isConnected)return;ZB.validateAddon(result.pack);currentPack=result.pack;
   const local=CommunityDownload.candidates(DB,SEED);
   const fresh=CommunityUpdateSelection.candidates(listing,currentPack,local);
   const previous=new Map((draft.rows||[]).map(row=>[row.key,row]));
   draft.rows=fresh.map(row=>{const old=previous.get(row.key);return old?{...row,selected:old.selected,useLocal:!!row.local&&old.useLocal}:row;});
   status.textContent='Keep published items, use edited local copies, or add items from your library. Unchecking a published item removes it from this update.';
   const grid=el('div','share-item-grid');contents.appendChild(grid);
   for(const row of draft.rows){
    const entry=row.published||row.local,tile=el('div','share-item');
    const label=document.createElement('label');label.className='share-item-label';
    const check=document.createElement('input');check.type='checkbox';check.checked=row.selected;check.setAttribute('aria-label','Include '+(entry.item.name||entry.item.id));check.onchange=()=>{row.selected=check.checked;tile.classList.toggle('selected',row.selected);};
    label.append(check,AddonPreview.picture(entry));const name=el('strong');name.textContent=entry.item.name||entry.item.id;label.appendChild(name);tile.appendChild(label);tile.classList.toggle('selected',row.selected);
    tile.appendChild(el('p','hint',row.published?'Already published':'Local item · not yet included'));
    if(row.local&&row.published){const select=document.createElement('select');select.setAttribute('aria-label','Version of '+(entry.item.name||entry.item.id));for(const [value,text] of [['published','Keep published version'],['local','Use edited local version']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.appendChild(option);}select.value=row.useLocal?'local':'published';select.onchange=()=>row.useLocal=select.value==='local';tile.appendChild(select);}
    communityButton(tile,'Inspect',async()=>AddonPreview.openItem(row.useLocal?row.local:row.published,{families:{...currentPack.families,...DB.families}}));
    communityButton(tile,'Edit item',async()=>{if(row.local)EditorLibrary.open({kind:row.local.kind,item:row.local.item},'addons');else await EditorLibrary.importPack(result,entry.kind,entry.item.id);});
    grid.appendChild(tile);
   }
  }).catch(error=>status.textContent=error.message+' Published contents have not changed.');
 }
 const updatePack=()=>{if(!listing)return Community.packSelection();if(!currentPack)throw Error('Wait for the published contents to load.');const pack=CommunityUpdateSelection.build(currentPack,draft.rows,DB.families);pack.items=pack.items.map(({kind,item})=>({kind,item:CommunityDownload.publishItem(kind,item,SEED)}));return pack;};
 const review=el('div','share-publish-review');card.appendChild(review);review.appendChild(el('h2',null,listing?'Review and save':'3. Preview and publish'));
 const n=Community.packSelection().items.length;
 communityMessage(review,listing?'Preview the version you are about to save.':n+' selected item'+(n===1?'':'s')+'. The first four provide the listing preview.');
 const preview=communityButton(review,'Preview add-on',async()=>{
  const pack=updatePack();
  if(!pack.items.length)throw new Error('Select at least one item above.');
  AddonPreview.openPack({listing:{...draft,name:draft.name||'Your add-on'},pack},null);
 });preview.disabled=!listing&&!n;
 const label=el('label','tick');const agree=document.createElement('input');agree.type='checkbox';agree.checked=draft.agree;agree.onchange=()=>{draft.agree=agree.checked;};label.appendChild(agree);const consent=document.createElement('span');consent.textContent='I have permission to share these items and images, and agree to make them public for others to import.';label.appendChild(consent);review.appendChild(label);
 communityMessage(review,'Publishing makes the add-on visible immediately. Up to 20 items / 2 MB; PNG icons up to 512 KB each. No adult imagery. Required custom models must be supplied separately.');
 const publish=communityButton(review,listing?'Save update':'Publish add-on',async()=>{
  if(!draft.agree)throw new Error('Confirm public sharing first.');
  const pack=updatePack();if(!listing&&!pack.items.length)throw new Error('Select items to publish.');
  await CommunityDownload.validateExport({listing:{id:listing?.id||'publication-preview',name:draft.name,version:draft.version},pack});
  const data={name:draft.name,author:draft.author,version:draft.version,description:draft.description,dependencies:draft.dependencies};
  if(listing){data.id=listing.id;data.expectedRevision=listing.revision;data.pack=pack;}else data.pack=pack;
  await Community.request(listing?'update':'publish',data);COMMUNITY_DRAFTS.delete(draftKey);COMMUNITY_EDIT=null;COMMUNITY_MODE='mine';COMMUNITY_OFFSET=0;TAB='catalog';render();
 },true);publish.disabled=!listing&&(!n||n>20);
 if(listing)communityButton(review,'Cancel editing',async()=>{COMMUNITY_EDIT=null;renderPane();});
 else communityButton(review,'Manage my published add-ons',async()=>{COMMUNITY_MODE='mine';TAB='catalog';render();});
}

window.ZonebenchAccount={get readOnly(){return !!COMMUNITY_CONFIG.readOnly;},mountReset:node=>drawProjectReset(node),editText:()=>SiteCopy.open()};

