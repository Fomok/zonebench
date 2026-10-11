/* Change the entry id when publishing a new set of notes: this re-arms the New badge. */
(function(root){
'use strict';
const entries=[{"id": "squared-away-engine-2026-10-11", "date": "2026-10-11", "title": "Engine update — 2026.10.11", "version": "Engine 2026.10.11", "modVersion": "2.0.6", "status": "Standard + Bodycam • No mod reinstall • Existing saves work", "summary": "Both Squared Away engines now include mrdemonized’s 2026.10.11 update.", "sections": [{"title": "What changed", "items": ["Updated the standard all-DX engine and the optional Bodycam DX11-AVX engine.", "Includes upstream rendering, weapon and scripting fixes, expanded shader support and support for larger maps. Squared Away’s inventory features remain included."]}, {"title": "Installing", "items": ["Download your matching engine package and install both bin and db/mods into Anomaly. Back up your current engine files first.", "Keep Squared Away 2.0.6 Hotfix 4. No mod or add-on redownload is needed for this engine update, and no new game is required."]}, {"title": "Please report problems", "items": ["Saving and changing areas were tested with bolts in a rig and items in boxes. There may still be issues I didn’t catch.", "If anything is wrong, please report it in the Discord thread and go back to the matching standard or Bodycam engine from the 2.0.3 post. Restore both its bin and db/mods files."]}], "links": [{"label": "Download engine update", "url": "#downloads"}, {"label": "Report in the Discord thread", "url": "https://discord.com/channels/912320241713958912/1542887991222206484"}, {"label": "2.0.3 engines — fallback", "url": "https://github.com/Fomok/xray-monolith-inventory-edits/releases/tag/v2.0.3"}]},{"id": "squared-away-2-0-6-hotfix4", "date": "2026-10-11", "title": "2.0.6 - hotfix 4 — Bolts in rigs", "version": "2.0.6 - hotfix 4", "status": "Save crash fix • No new game • No engine update", "summary": "Fixes the crash when saving with bolts in rig pockets, even when there is only one bolt.", "sections": [{"title": "What changed", "items": ["Bolts in rig pockets can now be saved and restored with their counts and placement.", "Includes all earlier 2.0.6 hotfixes."]}, {"title": "Updating", "items": ["Install the full ZIP with your usual compatibility options. Disable the separate Bolt Rig Save Test 1 patch if installed.", "Keep your standard or Bodycam 2.0.3 engine. The bolt fix does not require a new game."]}, {"title": "ZoneBench add-ons and save repair", "items": ["New add-on exports use shorter item IDs to avoid a separate save-loading problem. Older affected add-ons need updated exports.", "Help now has Repair an existing save below Account & administration. Select your save files and updated add-on ZIPs to download a repaired copy locally. Your original files are left untouched."]}]},{"id": "squared-away-2-0-6-hotfix3", "date": "2026-10-10", "title": "2.0.6 - hotfix 3 — ZONA ultrawide UI", "version": "2.0.6 - hotfix 3", "status": "ZONA compatibility fix • Existing saves work • No engine update", "summary": "Fixes the stretched inventory background and misaligned controls in ZONA on ultrawide screens.", "sections": [{"title": "What changed", "items": ["The ZONA SOTA compatibility patch now matches the 21:9 inventory layout to its equipment, header and stats controls.", "Restores matching ultrawide texture selection. The 16:9 layout, default UI and GAMMA compatibility option are unchanged.", "Includes both earlier stats hotfixes. If you do not use ZONA on ultrawide, there is no new fix you need in this release."]}, {"title": "Updating", "items": ["Install the full ZIP and select SOTA UI Compatibility (ZONA). Disable the separate ZONA Ultrawide Test 1 patch after installing.", "Keep your standard or Bodycam 2.0.3 engine. No new game or add-on redownload is needed."]}]},{"id": "squared-away-2-0-6-hotfix2", "date": "2026-10-09", "title": "2.0.6 - hotfix 2 — Item effect previews", "version": "2.0.6 - hotfix 2", "status": "Small fix • Existing saves work • No engine update", "summary": "Sry i forgot about that funcionality xD", "image": {"src": "assets/patch-notes/stats-effects-hotfix2.png", "alt": "Food hover preview with white hunger gain and red thirst loss on the slim stats bars.", "caption": "Item effects now appear directly on the stat bars."}, "sections": [{"title": "What changed", "items": ["Hovering over food, drinks and other items now previews their stat effects: white shows the amount gained and red shows the amount lost.", "The current fill stays visible, and percentages show the current and predicted values. Moving away restores the normal display.", "Includes the previous fix for expanded item stacks overlapping the stats bars."]}, {"title": "Updating", "items": ["Install the full hotfix 2 ZIP with your usual compatibility patches. Disable the separate Stats Effect Preview Test and Stats Stack Fix Test patches if installed.", "Keep your standard or Bodycam 2.0.3 engine. Existing 2.0.x saves work; no add-on redownload is needed."]}]},{"id": "squared-away-2-0-6-stack-hotfix", "date": "2026-10-09", "title": "2.0.6 Hotfix — Expanded item stacks", "version": "2.0.6", "status": "Small fix • Existing saves work • No engine update", "summary": "Expanded item stacks now display cleanly without the stats bars behind them.", "sections": [{"title": "Fixed", "items": ["The new stats bars and their tooltips hide while you choose individual items from a stack, then return when the stack closes."]}, {"title": "Updating", "items": ["Replace the mod with the full 2.0.6 Hotfix ZIP and choose your usual compatibility patches. Disable the separate Stats Stack Fix Test patch if installed.", "Keep your current 2.0.3 standard or Bodycam engine. No new game or add-on redownload is needed."]}]},{"id": "squared-away-2-0-6-stats", "date": "2026-10-08", "title": "2.0.6 — Clearer inventory stats", "version": "2.0.6", "status": "Small visual update • Existing saves work • Keep the 2.0.3 engine", "summary": "An optional new look for equipment stats. If you are happy with your current UI, you can wait for a later update.", "image": {"src": "assets/patch-notes/stats-2.0.6.png", "alt": "In-game Squared Away stats panel with two columns of slim gauges and coloured protection bars.", "caption": "The new stats panel in-game."}, "sections": [{"title": "What changed", "items": ["Full stat names, larger icons and slim bars make your equipment stats easier to read.", "Health and Sleep sit on the left; Hunger and Thirst on the right. Their bars fade from green through amber to red as they empty.", "Head protection uses steel blue, body protection uses tan, and other resistances remain olive green. Icons stay off-white.", "The belt and metal divider move up to give the stats more room. Vertical SOTA bolt and grenade slots align with the quick-use row.", "Works with default UI and the GAMMA and ZONA SOTA compatibility options, including horizontal and vertical weapon layouts."]}, {"title": "Your choice", "items": ["Enabled by default. Turn off Use Squared Away slim stats bars under MCM > Squared Away > Appearance to restore the original stats, background and slot positions."]}, {"title": "Updating", "items": ["Replace the full mod with 2.0.6 and select your usual compatibility patches. Disable any separate stats test mods.", "Keep your standard or Bodycam 2.0.3 engine. No new game is needed when updating from 2.0.x. No add-on redownload is required for this visual update."]}]},{"id": "squared-away-2-0-5-zona", "date": "2026-10-08", "title": "2.0.5 — SOTA UI FIX + ZONA modpack compatibility patch", "version": "2.0.5", "status": "Available now • Existing 2.0 saves work • Keep the 2.0.3 engine", "summary": "A fix for SOTA vertical weapon slots, dedicated ZONA compatibility and manual recipe IDs in ZoneBench.", "sections": [{"title": "SOTA UI fix", "items": ["Fixed a crash when opening inventory with vertical weapon slots or switching equipment layouts."]}, {"title": "ZONA compatibility", "items": ["New SOTA UI Compatibility (ZONA) preserves ZONA stats controls.", "New Mags Redux ammo fix prevents magazine reloads from taking loose rounds and recreating them in the backpack. Dynamic Reload Speeds is not required for this patch.", "The installer separates shared optional patches, GAMMA compatibility and ZONA compatibility. Select only the patches for your setup.", "Squared Away was made for GAMMA. Crafting recipes, repair parts, dismantling returns and trader settings may be wrong or not work in ZONA. These may need modpack-specific changes; this is not a complete ZONA rebalance."]}, {"title": "ZoneBench", "items": ["Crafting, repair and dismantling now offer manual item-ID entry alongside the GAMMA database in the editor and item creator.", "The installation checklist now includes ZONA and its matching patch instructions."]}, {"title": "Installing the update", "items": ["Replace your Squared Away installation with the full 2.0.5 ZIP and select the matching optional patches. Disable the separate UI, magazine and vertical-slot test fixes included in this release.", "Keep the standard or Bodycam 2.0.3 engine. Existing 2.0.x saves can continue; first installations and upgrades from before 2.0 require a new game."]}]},{"id": "squared-away-2-0-4-zonebench", "date": "2026-10-07", "title": "Squared Away — 2.0.4 & the new ZoneBench", "version": "2.0.4", "status": "Available now • Keep your 2.0 saves • Uses the 2.0.3 engines", "summary": "Build your own gear and combine community add-ons, with a redesigned ZoneBench to guide you.", "sections": [{"title": "Add-ons that work together", "items": ["New rigs, containers, pouches and backpacks from ZoneBench use separate files and unique IDs, so multiple independent add-ons can be installed together.", "Install add-ons below Squared Away in MO2. Replace an add-on when updating it instead of installing another copy.", "Older full-project exports still replace shared mod files. Rebuild them as independent add-ons if you want to combine them."]}, {"title": "A cleaner ZoneBench", "items": ["A new Field Kit design, a screenshot introduction, and a step-by-step installation checklist with player FAQs.", "Choose between editing existing gear and creating a new item. Search item tiles, then edit one item at a time.", "The new builder guides you through appearance, storage, crafting, traders and rig repair.", "Crafting, repair and dismantling use searchable GAMMA Database names and icons.", "Browse add-on contents before downloading. Update your published add-on using its own item selection.", "Account organizes your profile, creations and download history. Website update notices explain when add-ons need fresh downloads."]}, {"title": "Installing 2.0.4", "items": ["Replace the full mod through MO2 and choose the same optional patches. Keep the standard or Bodycam Squared Away 2.0.3 engine.", "HD Icons Framework is required for correctly sized item icons. Put Squared Away after its dependencies, with independent add-ons below it.", "No new game is needed from 2.0.x. First-time installations and upgrades from before 2.0 still require one."]}]},{
 id:'squared-away-2-0-3-ammo',
 date:'2026-10-05',
 title:'Squared Away — 2.0.3 Ammo Hotfix',
 version:'2.0.3',
 status:'Available now • Update both the mod and engine • Keep your 2.0 saves',
 summary:'Reload magazines without loose ammunition being consumed and recreated in your inventory.',
 sections:[
  {title:'Magazine reload fix',items:[
   'Stops magazine-fed weapon reloads from taking loose ammunition and returning it to your inventory.',
   'Includes compatibility with Dynamic Reload Speeds, while keeping its reload speed and sound changes.',
   'Normal loose-ammo weapons, grenade launchers and loading rounds into magazines keep their usual behavior.'
  ]},
  {title:'Installing the hotfix',items:[
   'Replace the full mod in MO2 and install the matching 2.0.3 engine, including bin and db/mods. Standard and Bodycam engine downloads are both updated.',
   'Select the optional Mags Reloaded ammo fix in the installer. It requires Mags Reloaded Fork by Priler UPDATE 6 and its Dynamic Reload Speeds dependency. Let Squared Away win their file conflicts in MO2.',
   'Existing 2.0, 2.0.1 and 2.0.2 saves are supported. Your ZoneBench item customizations are preserved.'
  ]}
 ]
},{
 id:'squared-away-2-0-2-bodycam',
 date:'2026-10-05',
 title:'Squared Away — Optional Bodycam Support',
 version:'2.0.2 · Bodycam',
 status:'Available now • Optional engine download • DX11-AVX only',
 summary:'Use Squared Away together with Bodycam’s camera and shooting changes.',
 sections:[
  {title:'Optional Bodycam engine',items:[
   'A combined engine is now available for Squared Away 2.0.2 and Bodycam, based on Bodycam’s August 4 release.',
   'Choose Download Bodycam engine in Downloads instead of the standard engine package. Install both bin and db/mods from its ZIP.',
   'Keep the Squared Away 2.0.2 mod installed. Only DX11-AVX is included.',
   'For PiP scopes, use the matching external 3DSS PiP compatibility content required by Bodycam. The engine ZIP does not include that external patch.',
   'If you do not use Bodycam, keep the standard engine. No update is needed.'
  ]}
 ]
},{
 id:'squared-away-2-0-2-looting',
 date:'2026-10-04',
 title:'Squared Away — 2.0.2',
 version:'2.0.2',
 status:'Available now • Update both the mod and engine • Keep your 2.0 saves',
 summary:'Equip loot straight from bodies, with a refreshed optional corpse inventory.',
 sections:[
  {title:'Equip straight from a body',items:[
   'Drag weapons from a dead body directly into your equipment slots, even when your backpack is full.',
   'Swap with an equipped weapon directly; the replaced weapon goes back to the body.',
   'These transfers work with standard corpse looting. The Tarkov-like looting patch is not required.'
  ]},
  {title:'Optional Tarkov-like looting',items:[
   'A Field Kit equipment section now shows helmet, outfit, knife or pistol, and one main weapon slot above the body’s scattered loot.',
   'A framed Pockets bar separates equipment from loose items. Grid lines follow item shapes.',
   'Item positions and rotations are remembered, and looted equipment slots stay empty instead of being filled by a spare item.',
   'Looting Takes Time Redux still controls item discovery. Keep its Pre-sort items on grid option turned off.'
  ]},
  {title:'Installing 2.0.2',items:[
   'Replace the full mod in MO2 and install the matching 2.0.2 engine package into your Anomaly folder, including bin and db/mods.',
   'Existing 2.0 and 2.0.1 saves are supported. A new game is required only when upgrading from a pre-2.0 version.',
   'ZoneBench now targets 2.0.2. Your item customizations are preserved.'
  ]}
 ]
},{
 id:'squared-away-2-0-1-localization',
 date:'2026-10-04',
 title:'Squared Away — Localization Hotfix',
 version:'2.0.1',
 status:'Available now • Replace the mod ZIP; keep your 2.0 engine',
 summary:'Clearer settings and item descriptions, with updated translations throughout the mod.',
 sections:[
  {title:'Language updates',items:[
   'Updated English text to match the current rig, pouch and inventory mechanics.',
   'Completed Russian, Spanish and Ukrainian translations for settings, item descriptions, gameplay messages and optional patches.',
   'Fixed unreadable Cyrillic text and missing translated settings. Rig messages now describe the current rules instead of the old medicine-pocket system.'
  ]},
  {title:'ZoneBench',items:[
   'The editor now uses the hotfix item text and preserves the correct language encoding in exported files.',
   'Previous patch notes remain here, below the latest update, so you can catch up whenever you return.'
  ]},
  {title:'Installation',items:[
   'Download the full mod ZIP again and replace your Squared Away installation in MO2, selecting the same optional patches.',
   'Existing 2.0 saves and the 2.0 engine package are supported. No new game or engine download is needed for this hotfix.'
  ]}
 ]
},{
 id:'squared-away-2-0-published',
 date:'2026-10-04',
 title:'Squared Away — 2.0 Update',
 version:'2.0 Update',
 status:'Available now • Download the mod and matching engine',
 summary:'Your inventory, rebuilt. The 2.0 Update brings smarter packing, a cleaner interface and easier customization.',
 sections:[
  {title:'Before you install',items:[
   'Start a new game when upgrading to 2.0. Saves from the previous public version are not supported.',
   'Install the matching custom engine package, including its DB0 game-data file, alongside the mod. See the installation guide for setup and optional patches.'
  ]},
  {title:'Packing and carrying',items:[
   'The engine now handles inventory space, item placement and saved layouts. Your chosen positions and rotations stay with your inventory.',
   'Picked-up items can turn automatically to fit an available gap when auto-rotation is enabled.',
   'Crafting and NPC item hand-ins can use items inside carried boxes and spare rigs. You do not have to unpack them first.',
   'Rigs use a dedicated equipment slot. Equipped rig items use normal inventory icons, including supported dynamic icons and magazine ammo counters.'
  ]},
  {title:'Move gear directly',items:[
   'Equip gear straight from rigs, boxes and stashes, or put equipped gear directly into storage without clearing backpack space first.',
   'Swap equipped weapons with stored ones, and move items between boxes, rigs and stashes without unpacking them into your bag.',
   'Rotate and arrange items inside opened rigs and boxes. Placement highlights help you see where your gear will fit.'
  ]},
  {title:'Less inventory frustration',items:[
   'Carrying items inside a spare rig no longer makes unrelated items drop when there is still room in your inventory.',
   'Unequipping a rig uses a free space instead of forcing it back into an old position and shifting your other items. It tries the normal orientation first, then rotates if needed.',
   'Leftovers created by used items, such as medkit scraps, drop to the ground when the bag is full instead of crashing the game.'
  ]},
  {title:'A clearer inventory',items:[
   'A new metallic Field Kit look covers equipment, inventory, trade controls and container windows.',
   'SOTA UI is optional. Keep either the Tarkov-like or Anomaly-default layout, with the backpack and rig slots scrolling alongside your inventory.',
   'Smaller inventory cells make wide rigs easier to use. Expansion pouches sit below the rig, and amber borders identify the extra storage they add.',
   'The backpack grid outlines occupied item spaces, keeping grid lines out of the middle of your gear.',
   'Settings are reorganized into clearer MCM categories. Adjust background opacity and use the updated white-key control prompts.',
   'Dropped rigs and boxes have recognizable shared 3D models instead of looking like armor plates.'
  ]},
  {title:'Installation and customization',items:[
   'The installer offers optional SOTA UI, Wearable Devices and Looting Takes Time Redux patches. Enable only the patches for mods you use.',
   'Box and rig context-menu actions work in plain Anomaly as well as GAMMA. Magazine content and other gameplay dependencies still need to be installed separately.',
   'ZoneBench is now a website: edit items, preview layouts and export your own add-on. Its bundled data is ready for the 2.0 Update.',
   'Browse community add-ons with real item previews. Creators can update or remove their listings, and unwanted listings can be moderated.'
  ]},
  {title:'Still Squared Away',items:[
   'Rigs, boxes, rotation, limited carrying space, pouch upgrades, rig wear and the rig-based reload and quick-use rules remain part of the mod. These are returning features, not new additions.'
  ]}
 ]
}];
const key='zonebench.patchnotes.read';let readId=null;
try{readId=root.localStorage.getItem(key);}catch(_){}
function unread(){return readId!==entries[0].id;}
function markRead(){readId=entries[0].id;try{root.localStorage.setItem(key,readId);}catch(_){}refreshBadge();}
function refreshBadge(){const a=root.document?.querySelector('[data-patch-notes-link]');if(!a)return;const fresh=unread();a.classList.toggle('has-update',fresh);a.querySelector('.patch-new').hidden=!fresh;a.setAttribute('aria-label',fresh?'Patch Notes, new update':'Patch Notes');}
function decorate(a){a.dataset.patchNotesLink='';const badge=document.createElement('span');badge.className='patch-new';badge.textContent='New';badge.hidden=!unread();a.appendChild(badge);a.classList.toggle('has-update',unread());a.setAttribute('aria-label',unread()?'Patch Notes, new update':'Patch Notes');}
function render(P){
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 P.classList.add('patch-notes-page');
 P.appendChild(el('p','eyebrow','SQUARED AWAY / WHAT CHANGED'));P.appendChild(el('h1',null,'Patch Notes'));
 function articleFor(entry){
  const article=el('article','patch-entry');article.appendChild(el('p','patch-version',entry.version + (entry.date ? ' • ' + entry.date : '')));article.appendChild(el('h2',null,entry.title));article.appendChild(el('p','patch-status',entry.status));article.appendChild(el('p','page-lead',entry.summary));
  if(entry.image){const figure=el('figure','patch-screenshot');const image=el('img');image.src=entry.image.src;image.alt=entry.image.alt;image.width=488;image.height=314;image.loading='lazy';image.style.cssText='display:block;max-width:100%;height:auto;border-radius:4px';figure.style.cssText='margin:24px 0';figure.appendChild(image);if(entry.image.caption)figure.appendChild(el('figcaption','hint',entry.image.caption));article.appendChild(figure);}
  for(const group of entry.sections){const section=el('section','patch-group');section.appendChild(el('h3',null,group.title));const list=el('ul');for(const item of group.items)list.appendChild(el('li',null,item));section.appendChild(list);article.appendChild(section);}
  if(entry.links){const links=el('div','site-actions');for(const link of entry.links){const a=el('a','tool',link.label);a.href=link.url;links.appendChild(a);}article.appendChild(links);}
  return article;
 }
 P.appendChild(articleFor(entries[0]));
 if(entries.length>1){
  const history=el('section','patch-history');history.appendChild(el('h2',null,'Previous updates'));
  history.appendChild(el('p','hint','Choose an update to read its patch notes.'));
  const tiles=el('div','patch-history-tiles'),detail=el('div','patch-history-detail');
  detail.id='patch-history-detail';detail.hidden=true;
  let selected=null;const buttons=[];
  function close(){selected=null;detail.replaceChildren();detail.hidden=true;for(const b of buttons)b.setAttribute('aria-expanded','false');}
  for(const entry of entries.slice(1)){
   const button=el('button','patch-history-tile');button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',detail.id);
   button.appendChild(el('span','patch-version',entry.version));
   button.appendChild(el('strong',null,entry.title));
   if(entry.date)button.appendChild(el('span','hint',entry.date));
   button.onclick=()=>{
    if(selected===entry.id){close();return;}
    close();selected=entry.id;button.setAttribute('aria-expanded','true');detail.hidden=false;
    const back=el('button','tool','Close older notes');back.onclick=()=>{close();button.focus();};detail.appendChild(back);
    const article=articleFor(entry);article.tabIndex=-1;detail.appendChild(article);article.focus({preventScroll:true});
    detail.scrollIntoView({block:'start',behavior:'auto'});
   };
   buttons.push(button);tiles.appendChild(button);
  }
  history.appendChild(tiles);history.appendChild(detail);P.appendChild(history);
 }
 const help=el('button','tool primary','Installation guide');help.onclick=()=>Site.go('help');P.appendChild(help);markRead();
}
root.addEventListener?.('storage',event=>{if(event.key===key||event.key===null){try{readId=root.localStorage.getItem(key);}catch(_){}refreshBadge();}});
root.PatchNotes={entries,unread,markRead,decorate,render};
})(globalThis);
