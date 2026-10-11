<script>
 import {onMount} from 'svelte';
 import release from '../editor-release.json';
 let visible=$state(false),newBuild=$state(false),refreshing=$state(false),error=$state('');
 const key=import.meta.env.BASE_URL.includes('preview')?'zonebench.preview.editor-update.read':'zonebench.editor-update.read';
 onMount(()=>{
  try{visible=Number(localStorage.getItem(key)||0)<release.revision;}catch{visible=true;}
  let stopped=false,busy=false;
  async function check(){if(busy||document.hidden)return;busy=true;try{const r=await fetch(import.meta.env.BASE_URL+'build.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const data=await r.json();if(!stopped)newBuild=data.id!==__SITE_BUILD__;}}catch{}finally{busy=false;}}
  check();const timer=setInterval(check,60000);window.addEventListener('focus',check);
  return()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',check);};
 });
 function dismiss(){try{localStorage.setItem(key,String(release.revision));}catch{}visible=false;}
 async function refresh(){refreshing=true;error='';try{if(window.flushKeep)await window.flushKeep();location.reload();}catch{error='Could not save your work. Save your project before refreshing.';refreshing=false;}}
</script>
{#if newBuild||visible}
<aside class="editor-update-notice" role="status" aria-label="Editor update">
 <div><strong>{newBuild?'A website update is ready':release.title}</strong><p>{newBuild?'Refresh to load the latest editor files together. Your saved customizations will be kept.':release.message}</p>{#if !newBuild}<p class:important={release.requiresRedownload}>{release.requiresRedownload?release.downloadNotice||'Re-download your add-ons and replace their installed ZIP contents: this update changes generated mod files.':'No add-on re-download is needed for this interface update.'}</p>{/if}{#if error}<p>{error}</p>{/if}</div>
 {#if newBuild}<button onclick={refresh} disabled={refreshing}>{refreshing?'Saving…':'Refresh website'}</button>{:else}<button onclick={dismiss}>Got it</button>{/if}
</aside>
{/if}
<style>
.editor-update-notice{flex-shrink:0;display:flex;align-items:center;gap:20px;padding:12px 24px;margin:0 16px 8px;border:1px solid #9d8665;border-left:4px solid #dcb88e;background:#28291f;color:#eee5d8}.editor-update-notice strong{color:#e3c499;font-size:14px}.editor-update-notice p{margin:4px 0;font-size:12px;line-height:1.4}.editor-update-notice>div{flex:1}.editor-update-notice button{flex-shrink:0;padding:10px 16px;background:#dcb88e;color:#161814;border:0;cursor:pointer}.important{color:#efb1c2}@media(max-width:700px){.editor-update-notice{padding:10px;gap:10px;margin:0 8px 6px}}
</style>
