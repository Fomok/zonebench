<script>
 import {onDestroy} from 'svelte';
 let saves=$state([]),addons=$state([]),busy=$state(false),error=$state(''),result=$state(null),url=$state('');
 let worker,timer;
 function clear(){error='';result=null;if(url)URL.revokeObjectURL(url);url='';}
 function cancel(){worker?.terminate();worker=null;clearTimeout(timer);busy=false;}
 onDestroy(()=>{cancel();if(url)URL.revokeObjectURL(url);});
 function select(event,type){clear();const files=Array.from(event.currentTarget.files||[]);if(type==='save')saves=files;else addons=files;}
 function repair(){
  clear();busy=true;
  try{
   worker=new Worker(new URL('../lib/save-repair.worker.js',import.meta.url),{type:'module'});
   worker.onmessage=({data})=>{cancel();if(!data.ok){error=data.error;return;}result=data;if(data.bytes)url=URL.createObjectURL(new Blob([data.bytes],{type:'application/zip'}));};
   worker.onerror=()=>{cancel();error='The repair tool could not finish. Refresh the page and try again.';};
   timer=setTimeout(()=>{cancel();error='The repair took too long. No input files were changed. Try again in Chrome or Edge.';},120000);
   const name='zonebench_repaired_'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14)+'_'+crypto.randomUUID().slice(0,6);
   worker.postMessage({saves:[...saves],addons:[...addons],name});
  }catch(e){cancel();error=e.message||'Could not start the repair tool.';}
 }
</script>
<div class="save-repair">
 <p>Repair saves affected by the long item IDs from older ZoneBench add-ons. Your files stay on your device. No account, upload or Python installation is needed.</p>
 <p class="repair-note">Close the game and back up your saves and old add-ons first. This fixes mapped add-on item IDs, not every kind of crash.</p>
 <div class="repair-pickers">
  <label><span class="step">1</span><strong>Select your save files</strong><span>In Anomaly → appdata → savedgames, select one .scop and its matching .scoc. You can also include its .dds preview. Hold Ctrl to select them together.</span><input type="file" multiple accept=".scop,.scoc,.dds" disabled={busy} onchange={e=>select(e,'save')} aria-label="Save files"/><small>{saves.length?saves.map(f=>f.name).join(' · '):'No save selected'}</small></label>
  <label><span class="step">2</span><strong>Select updated add-on ZIPs</strong><span>Choose the newly downloaded ZIPs for all affected add-ons. You can also select their SECTION-MIGRATION.json files. Old ZIPs without a mapping cannot be used.</span><input type="file" multiple accept=".zip,.json" disabled={busy} onchange={e=>select(e,'addon')} aria-label="Updated add-on ZIPs or mappings"/><small>{addons.length?addons.map(f=>f.name).join(' · '):'No add-ons selected'}</small></label>
 </div>
 <div class="repair-actions"><button class="tool primary" disabled={busy||!saves.length||!addons.length} onclick={repair}>{busy?'Checking and repairing…':'Check and repair save'}</button>{#if busy}<button class="tool" onclick={cancel}>Cancel</button>{/if}</div>
 <div aria-live="polite">
 {#if error}<p class="repair-error" role="alert">{error}</p>{/if}
 {#if result}
  {#if result.changed}
   <div class="repair-result"><h3>Repaired copy ready</h3><p>Updated {result.changed} item{result.changed===1?'':'s'} and checked {result.count.toLocaleString()} saved objects. Your original files are untouched.</p><a class="tool primary" href={url} download={result.name}>Download repaired save ZIP</a>
   <ol><li>Extract the new .scop, .scoc and optional .dds into <strong>Anomaly/appdata/savedgames</strong>, beside your originals. Do not install this ZIP through MO2.</li><li>In MO2, disable the old affected add-ons and enable their updated replacements.</li><li>Load the save whose name begins with <strong>zonebench_repaired_</strong>. Check your items, save, fully exit the game, then reload.</li></ol><p class="hint">The file structure and compression passed verification. Please check the result in-game before continuing your playthrough.</p></div>
  {:else}<p class="repair-result">No matching old item IDs were found, and no overlong section IDs were detected. This save does not need this repair. No replacement file was created.</p>{/if}
 {/if}
 </div>
</div>
<style>
.save-repair>p{max-width:900px;line-height:1.65}.repair-note{border-left:3px solid #c96480;padding:8px 14px;color:#ddc7bd;background:#201d1d}.repair-pickers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:22px 0}.repair-pickers label{display:flex;flex-direction:column;gap:12px;min-width:0;padding:20px;background:#171a17;border:1px solid #494b40}.repair-pickers strong{font-size:17px;color:#dcb88e}.repair-pickers span:not(.step){line-height:1.6;color:#c6c7ba;font-size:13px}.step{color:#a6b693;font-size:12px}.repair-pickers input{width:100%;min-width:0;height:auto;min-height:44px;padding:8px;background:#101210;color:#eee;border:1px solid #55574a;box-sizing:border-box}.repair-pickers small{overflow-wrap:anywhere;color:#a9ad9e}.repair-actions{display:flex;gap:12px}.repair-error{padding:16px;border:1px solid #c96480;color:#efb9c7;overflow-wrap:anywhere}.repair-result{padding:20px;margin-top:18px;background:#191f18;border:1px solid #56674a}.repair-result h3{margin-top:0}.repair-result li{margin:12px 0;line-height:1.6}.repair-result ol{padding-left:22px}.repair-actions button:disabled{opacity:.5;cursor:default}@media(max-width:700px){.repair-pickers{grid-template-columns:1fr}.repair-pickers label{padding:14px}}
</style>

