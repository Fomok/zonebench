import editorRelease from './editor-release.json';
import { mount, unmount } from 'svelte';
import {loadScripts} from './lib/load-scripts.mjs';
import {addonFilename} from './lib/guided-install.mjs';
import Addons from './pages/Addons.svelte';
import Home from './pages/Home.svelte';
import Account from './pages/Account.svelte';
import Downloads from './pages/Downloads.svelte';
import Update from './pages/Update.svelte';
import Help from './pages/Help.svelte';
import Notes from './pages/Notes.svelte';
let EditorChoices,ItemBuilder,ItemLibrary,AdvancedRecipe; let editorWidgets=[];
import {recordDownload,downloadedAddons} from './lib/addon-downloads.mjs';
let page;
const native={account:Account,home:Home,downloads:Downloads,update:Update,help:Help,installation:Help,patchnotes:Notes};
export async function start(sync){
 window.ZonebenchShell=sync; window.ZonebenchExportRevision=editorRelease.exportRevision;
 window.ZonebenchAddonFilename=addonFilename;
 window.ZonebenchDownloads={list:()=>downloadedAddons(window.Community?.user),recordCompletedDownload(manifest,options){const result=recordDownload(window.Community?.user,manifest,options);window.dispatchEvent(new Event('zonebench-downloads-changed'));return result;}};
 window.ZonebenchAdvancedRecipe={mount(target,source,kind,mode,changed){editorWidgets.push(mount(AdvancedRecipe,{target,props:{source,kind,mode,changed}}));}};
 window.ZonebenchPages={clear(){for(const widget of editorWidgets)unmount(widget);editorWidgets=[];if(page){unmount(page);page=null;}},render(target,tab){if(['editchoice','itemlibrary'].includes(tab)){page=mount(ItemLibrary,{target,props:{choose:tab==='editchoice',library:window.EditorLibrary}});return true;}if(tab==='catalog'&&(['#addons','#community',''].includes(location.hash)||/^#addons\/view\/[a-zA-Z0-9_-]+$/.test(location.hash))){page=mount(Addons,{target});return true;}if(['editor','create','builder'].includes(tab)){page=mount(tab==='builder'?ItemBuilder:EditorChoices,{target,props:{flow:window.EditorFlow,create:tab==='create'}});return true;}if(!native[tab])return false;page=mount(native[tab],{target,props:{startGuide:tab==='installation'}});return true;}};
 const files=['src/intro.js','src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js','src/independent-addon.js','src/adaptation-export.js','src/community-download.js','vendor/appwrite-28.1.0.js','src/community-config.js','src/community-client.js','src/item-icons.js','src/addon-preview.js','src/catalog-browser.js','src/community-updates.js','src/community-update-selection.js','src/community-ui.js','src/releases.js','src/patch-notes.js','src/workbench.js','src/installation-guide.js','src/site.js','src/introduction.js','src/catalog.js','src/editor-view.js','src/editor-flow.js','src/editor-library.js','src/library-workflow.js','src/editor.js','src/site-copy.js'];
 const lightFiles=['src/intro.js','src/releases.js','src/patch-notes.js','src/installation-guide.js','vendor/appwrite-28.1.0.js','src/community-config.js','src/community-client.js','src/site-copy.js'];
 const lightPages={home:Home,downloads:Downloads,update:Update,help:Help,installation:Help,'patch-notes':Notes};
 let loading;
 async function full(){
  if(loading)return loading;
  window.removeEventListener('hashchange',routeLight);
  const status=document.createElement('p');status.className='site-loading';status.setAttribute('role','status');status.textContent='Opening your workbench…';document.querySelector('#pane').prepend(status);
  loading=(async()=>{
   [EditorChoices,ItemBuilder,ItemLibrary,AdvancedRecipe]=await Promise.all([import('./pages/EditorChoices.svelte'),import('./pages/ItemBuilder.svelte'),import('./pages/ItemLibrary.svelte'),import('./components/AdvancedRecipe.svelte')]).then(modules=>modules.map(m=>m.default));
   await loadScripts(files.filter(file=>!lightFiles.includes(file)),import.meta.env.BASE_URL,document,__SITE_BUILD__);
  })();
  try{await loading;}catch(error){status.textContent='Could not open this section. Reload the page to try again. '+error.message;throw error;}
 }
 function routeLight(){
  const route=location.hash.slice(1)||'home',Page=lightPages[route];
  if(!Page){full().catch(()=>{});return;}
  window.ZonebenchPages.clear();const target=document.querySelector('#pane');target.replaceChildren();
  document.body.classList.add('site-page');document.body.classList.toggle('home-page',route==='home');
  document.title=(route==='home'?'Squared Away':route)+' | ZoneBench';
  sync({tab:route==='patch-notes'?'patchnotes':route,editor:false,tools:false,sections:false,version:'2.1.0',tabs:[],unread:window.PatchNotes.unread()});
  page=mount(Page,{target,props:{startGuide:route==='installation'}});target.scrollTop=0;
 }
 await loadScripts(lightFiles,import.meta.env.BASE_URL,document,__SITE_BUILD__);
 window.Site={go(tab){const hash='#'+({patchnotes:'patch-notes',catalog:'addons',create:'editor/create',share:'editor/share'}[tab]||tab);if(location.hash===hash&&tab==='installation')routeLight();else location.hash=hash;},addons(mode='public'){location.hash='#addons'+(mode==='public'?'':'/'+mode);}};
 window.addEventListener('hashchange',routeLight);
 if(lightPages[location.hash.slice(1)||'home'])routeLight();else await full();
}
export function go(tab){window.Site.go(tab);}



