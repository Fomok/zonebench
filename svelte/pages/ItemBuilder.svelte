<script>
 import {addonFilename} from '../lib/guided-install.mjs';
 import SizePicker from '../components/SizePicker.svelte';
 import RigLayout from '../components/RigLayout.svelte';
 import PouchStorage from '../components/PouchStorage.svelte';
 import TraderBuilder from '../components/TraderBuilder.svelte';
 import RepairBuilder from '../components/RepairBuilder.svelte';
 import {grantedPockets} from '../lib/builder-layout.mjs';
 import AddonIngredients from '../components/AddonIngredients.svelte';
 import RecipeBuilder from '../components/RecipeBuilder.svelte';
 import {untrack} from 'svelte';
 let {flow}=$props();
 const initial=untrack(()=>flow.current());
 const kind=initial?.kind;
 const steps=['Appearance','Storage','Details','Recipe','Traders',...(kind==='rigs'?['Repair']:[]),'Review & download'];
 const last=steps.length-1;
 const initialStep=initial?.item.builderStage?steps.indexOf(initial.item.builderStage):(initial?.item.builderStep===4?last:initial?.item.builderStep||0);
 let item=$state(initial?.item),step=$state(Math.max(0,initialStep)),error=$state(''),busy=$state(false),report=$state(initialStep===last?untrack(()=>flow.review()):null);
 const titles={rigs:'Chest rig',boxes:'Container',pouches:'Expansion pouch',packs:'Backpack'};
 const rules=untrack(()=>flow.rules());
 function save(){flow.save($state.snapshot(item));error='';}
 function next(n){step=n;item.builderStep=n;item.builderStage=steps[n];save();if(n===last)report=flow.review();}
 function number(event,key,min=0,max=999999){item[key]=Math.max(min,Math.min(max,Number(event.currentTarget.value)||min));save();}
 async function image(event){const file=event.currentTarget.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4000000){error='Choose a PNG, JPEG or WebP image smaller than 4 MB.';return;}const reader=new FileReader();reader.onload=()=>{item.icon=reader.result;delete item.fit;save();};reader.onerror=()=>error='The image could not be read.';reader.readAsDataURL(file);}
 function cell(w,h){item.cellw=Math.max(1,Math.min(20,Number(w)||1));item.cellh=Math.max(1,Math.min(20,Number(h)||1));save();}
 function size(event,axis){const [h,w]=(item.size||'10x7').split('x').map(Number);const value=Math.max(1,Math.min(30,Number(event.currentTarget.value)||1));item.size=axis==='w'?`${h}x${value}`:`${value}x${w}`;save();}
 async function download(){busy=true;error='';try{save();const result=await flow.download();const blob=await result.blob;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=addonFilename(result.manifest.name,result.manifest.addonVersion);a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){error=e.message;}finally{busy=false;}}
</script>
<section class="item-builder">
 <div class="flow-breadcrumb"><button onclick={()=>window.Site.go('create')}>← Item types</button><span>WORKBENCH / CREATE</span></div>
 {#if !item}<h1>Draft not found</h1><p>Open a saved project or start a new item.</p>
 {:else}
 <div class="flow-heading"><p class="flow-kicker">NEW {titles[kind]?.toUpperCase()}</p><h1>{item.name||'Your new item'}</h1><p>A few choices, a live preview, and your own add-on.</p></div>
 <nav class="builder-steps" aria-label="Item builder steps">{#each steps as title,i}<button aria-current={step===i?'step':undefined} onclick={()=>next(i)}><span>0{i+1}</span>{title}</button>{/each}</nav>
 <div class="builder-columns"><div class="builder-panel">
 {#if step===0}
 <h2>Give it an identity.</h2><p>Choose how your item looks and how much space it occupies in an inventory.</p>
 <label>Item name<input value={item.name} oninput={e=>{item.name=e.currentTarget.value;save();}} maxlength="100"/></label>
 <label>Description <span class="builder-notice">Optional — a simple description is supplied if left empty.</span><textarea value={item.descr||''} oninput={e=>{item.descr=e.currentTarget.value;save();}}></textarea></label>
 <label>Item image<input type="file" accept="image/png,image/jpeg,image/webp" onchange={image}/></label>
 <SizePicker width={item.cellw||2} height={item.cellh||2} changed={cell}/>
 {:else if step===1}
 <h2>Make room for your gear.</h2>
 {#if kind==='rigs'}
 <RigLayout {item} changed={save}/>
 {:else if kind==='boxes'}
 <p>Set the inner storage space and choose which supplies belong inside.</p>
 <div class="two-fields"><label>Storage width<input type="number" min="1" max="20" value={item.inw} onchange={e=>number(e,'inw',1,20)}/></label><label>Storage height<input type="number" min="1" max="20" value={item.inh} onchange={e=>number(e,'inh',1,20)}/></label></div>
 <label>Allowed items<select value={item.takes} onchange={e=>{item.takes=e.currentTarget.value;save();}}><option value="any">Any item</option>{#each rules as rule}<option value={rule.id}>{rule.name}</option>{/each}</select></label>
 <label>Weight limit (kg)<input type="number" min="0" step="0.1" value={item.kg} onchange={e=>number(e,'kg')}/></label>
 <label>Items per stack<input type="number" min="1" max="999" step="1" value={item.stack||1} onchange={e=>{item.stack=Math.max(1,Math.min(999,Math.floor(Number(e.currentTarget.value)||1)));save();}}/></label>
 <p class="builder-notice">Maximum items in each stack inside this container. Set 1 to disable stacking. This does not change stacking outside the container.</p>
 <p class="builder-notice">For separate compartments or custom item rules, use the advanced editor below.</p>
 {:else if kind==='pouches'}
 <PouchStorage {item} changed={save}/>
 {:else}
 <p>Choose the size of the inventory grid this backpack provides.</p>
 <div class="two-fields"><label>Storage width<input type="number" min="1" max="30" value={item.size.split('x')[1]} onchange={e=>size(e,'w')}/></label><label>Storage height<input type="number" min="1" max="30" value={item.size.split('x')[0]} onchange={e=>size(e,'h')}/></label></div>
 {/if}
 {:else if step===2}
 <h2>Set the essentials.</h2><p>Choose a price and weight. Choose crafting, trader availability and repair settings in the following steps.</p>
 <div class="two-fields"><label>Price (RU)<input type="number" min="0" value={item.cost} onchange={e=>number(e,'cost')}/></label><label>Weight (kg)<input type="number" min="0" step="0.01" value={item.weight} onchange={e=>number(e,'weight')}/></label></div>
 {#if kind==='pouches'}<label>Loot tier<select value={item.tier} onchange={e=>{item.tier=Number(e.currentTarget.value);save();}}>{#each [1,2,3,4,5] as tier}<option value={tier}>Tier {tier}</option>{/each}</select></label>{/if}
 {:else if step===3}
 <RecipeBuilder {item} {kind} {flow} changed={save}/>
 {:else if steps[step]==='Traders'}
 <TraderBuilder {item} changed={save}/>
 {:else if steps[step]==='Repair'}
 <RepairBuilder {item} {flow} changed={save}/>
 {:else}
 <h2>Ready for the Zone?</h2><p>Your ZIP contains this item and its own texture. Install it below Squared Away in MO2 using Squared Away 2.0.4 or newer.</p>
 <dl class="builder-summary"><div><dt>Item</dt><dd>{item.name}</dd></div><div><dt>Type</dt><dd>{titles[kind]}</dd></div><div><dt>Inventory footprint</dt><dd>{item.cellw} × {item.cellh}</dd></div><div><dt>Price / weight</dt><dd>{item.cost} RU / {item.weight} kg</dd></div><div><dt>Crafting</dt><dd>{(item.craft||flow.recipe(kind,item)).parts.length} ingredient types</dd></div><div><dt>Sold by</dt><dd>{Object.keys(item.shelves||{}).length} trader groups</dd></div>{#if kind==='rigs'}<div><dt>Repair</dt><dd>{(item.parts?.length?item.parts:flow.repairDefaults(item).parts).length} replaceable components</dd></div>{/if}</dl>
 {#if report?.ok}<p class="builder-notice">Export checks passed. Your existing mod files are left intact.</p><button class="builder-main-action" disabled={busy} onclick={download}>{busy?'Preparing ZIP…':'Download this item'}</button><details><summary>Files included</summary><pre>{report.files.join('\n')}</pre></details>{:else}<p class="builder-error">{report?.error||'Complete the previous steps to prepare the export.'}</p>{/if}<button class="builder-main-action" disabled={busy} onclick={()=>{try{save();flow.saveToLibrary();}catch(e){error=e.message;}}}>Save to library</button>
 {/if}
 {#if error}<p class="builder-error" role="alert">{error}</p>{/if}
 <div class="builder-actions"><button onclick={()=>step?next(step-1):window.Site.go('create')}>{step?'Back':'Item types'}</button>{#if step<last}<button class="primary" onclick={()=>next(step+1)}>Continue →</button>{:else}<button onclick={()=>window.Site.go('create')}>Create another item</button>{/if}</div>
 <details><summary>Need more control?</summary><p>Fine-tune image fitting, dismantling returns and custom container layouts in the full editor. Return through Editor to resume this draft.</p><button class="flow-link" onclick={()=>flow.advanced()}>Open advanced editor →</button></details>
 </div><div class="builder-sidebar"><aside class="builder-preview"><span class="fabric-label">LIVE PREVIEW</span><h3>{item.name||'Untitled item'}</h3><div class="preview-footprint" style:width={`${Math.min(220,item.cellw*40)}px`} style:height={`${Math.min(280,item.cellh*40)}px`}>{#if item.icon}<img src={item.icon} alt={item.name||'Item image'}/>{:else}<span>Add an item image</span>{/if}</div><small>{item.cellw} wide · {item.cellh} tall</small><dl><div><dt>Type</dt><dd>{titles[kind]}</dd></div><div><dt>Price</dt><dd>{item.cost} RU</dd></div><div><dt>Weight</dt><dd>{item.weight} kg</dd></div></dl>{#if kind==='pouches'}<h4>Pockets added</h4><div class="grant-preview">{#each grantedPockets(item.grants) as p,i}<div class={`grant-shape pocket-tone-${i%6}`} style:width={`${p.w*28}px`} style:height={`${p.h*28}px`} style:grid-template-columns={`repeat(${p.w},1fr)`} aria-label={`${p.w} wide by ${p.h} tall pocket`}>{#each Array.from({length:p.w*p.h}) as _}<span></span>{/each}</div>{/each}</div><small>All added pockets shown. Placement follows the equipped rig.</small>{/if}<small>Draft saved in this browser.</small></aside>{#if step===3}<AddonIngredients {item} {kind} {flow} changed={save}/>{/if}</div></div>
 {/if}
</section>
