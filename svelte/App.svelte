<script>
 import { onMount } from 'svelte';
 import EditorUpdateNotice from './components/EditorUpdateNotice.svelte';
 import HeaderTexture from './components/HeaderTexture.svelte';
 import AddonsNav from './components/AddonsNav.svelte';
 import DownloadsNav from './components/DownloadsNav.svelte';
 import { start, go } from './bootstrap.js';
 let shell,header,brand;
 let view=$state({tab:'home',editor:false,tools:false,sections:false,version:'2.1.0 Hotfix 1',tabs:[],unread:false});let error=$state('');let ready=$state(false);
 const links=[['patchnotes','Patch Notes'],['home','Home'],['introduction','Introduction'],['editor','Editor'],['catalog','Add-ons'],['downloads','Downloads'],['help','Help'],['account','Account']];
 const hashes={patchnotes:'patch-notes',catalog:'community',editor:'editor'};
 onMount(()=>{
  const align=()=>{const h=header.getBoundingClientRect(),b=brand.getBoundingClientRect();shell.style.setProperty('--drawer-left',h.left+'px');shell.style.setProperty('--drawer-top',(h.bottom-2)+'px');shell.style.setProperty('--drawer-width',(b.right-h.left)+'px');};
  const observer=new ResizeObserver(align);observer.observe(header);observer.observe(brand);window.addEventListener('resize',align);align();
  return()=>{observer.disconnect();window.removeEventListener('resize',align);};
 });
 onMount(()=>{start(next=>{view=next;ready=true;}).catch(e=>error=e.message);});
 function navigate(e,tab){if(!ready||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();go(tab);}
</script>
<div id="app" bind:this={shell}>
 <header class="site-header" bind:this={header}>
  <button bind:this={brand} class="brand" type="button" onclick={()=>ready&&go('home')} aria-label="ZoneBench home"><span class="brand-patch"><HeaderTexture kind="name"/><span class="brand-accessible">ZONEBENCH</span></span><small class="brand-version"><HeaderTexture kind="version"/><span>SQUARED AWAY {view.version}</span></small></button>
  <nav id="site-nav" aria-label="Main navigation">
   {#each links as [tab,label]}{#if tab==='catalog'}<AddonsNav {ready} active={view.tab==='catalog'}/>{:else if tab==='downloads'}<DownloadsNav {ready} active={['downloads','update'].includes(view.tab)}/>{:else}<a href={'#'+(hashes[tab]||tab)} class:active={tab==='editor'?view.editor:view.tab===tab} class:has-update={tab==='patchnotes'&&view.unread} aria-current={(tab==='editor'?view.editor:view.tab===tab)?'page':undefined} onclick={e=>navigate(e,tab)}><HeaderTexture selected={tab==='editor'?view.editor:view.tab===tab}/><span class="nav-label">{label}</span>{#if tab==='patchnotes'&&view.unread}<span class="patch-new" title="Unread patch notes" aria-label="Unread patch notes">New</span>{/if}</a>{/if}{/each}
  </nav>
 </header>
 <EditorUpdateNotice/>
 <div id="project-tools" class="project-toolbar" hidden={!view.tools}><span class="project-caption">YOUR WORKBENCH</span><span id="dirty"></span><div class="spacer"></div><button hidden class="tool" id="btnMod">Update the mod</button><button class="tool" id="btnLoad">Open project</button><button class="tool primary" id="btnSave">Save project</button></div>
 <input type="file" id="modIn" accept=".zip,application/zip" hidden><input type="file" id="shareIn" accept=".json,application/json" hidden><input type="file" id="fileIn" accept=".json,application/json" hidden><input type="file" id="imgIn" accept="image/*" hidden>
 <nav id="nav" aria-label="Editor sections" hidden={!view.sections}>{#each view.tabs as item}<button class:on={item.key===view.tab} onclick={()=>go(item.key)}>{item.label}{#if item.count}<span class="cnt"> {item.count}</span>{/if}</button>{/each}</nav>
 <main><div id="list"></div><div id="pane"></div></main>
 {#if error}<div role="alert" class="startup-error">{error} <a href="https://fomok.github.io/zonebench/">Open the live website</a></div>{/if}
</div>
<style>
 :global(#svelte-root){height:100%} :global(#app){grid-template-rows:auto auto auto minmax(0,1fr)}
 .startup-error{position:fixed;inset:30% 15% auto;background:#211a1a;padding:30px;z-index:1000}
</style>

