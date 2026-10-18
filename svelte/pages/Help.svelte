<script>
 let {startGuide=false}=$props();
 import {tick} from 'svelte';
 import SaveRepair from '../components/SaveRepair.svelte';
 let repairSection;
 const repairTerms='Repair an existing save migration crash addon add-on item ids';
 const repairMatches=()=>!query||repairTerms.toLowerCase().includes(query.toLowerCase());
 import {blocks as guideBlocks,faq} from '../help-data.js';
 const blocks=[...guideBlocks,...faq];import Checklist from '../components/Checklist.svelte';
 let query=$state('');let open=$state(new Set());let sections=[];
 const categories=[['Install & setup',[0,1,2,3,4]],['FAQ',faq.map((_,i)=>guideBlocks.length+i)],['Compatibility',[5,6,7,8]],['Playing the mod',[9,10,11]],['Editor & add-ons',[12,13,14]],['Account & administration',[15,16]]];
 const matches=i=>!query||blocks[i].join(' ').toLowerCase().includes(query.toLowerCase());
 function toggle(i){if(query)return;const next=new Set(open);if(next.has(i))next.delete(i);else next.add(i);open=next;}
</script>
<div class="field-page help-page">
<div class="chapter-drawer"><nav class="help-topics" aria-label="Help topics">{#each categories as [name,ids],i}<button class="tool" onclick={async()=>{query='';await tick();sections[i].scrollIntoView({block:'start',behavior:'smooth'});}}>{name}</button>{/each}<button class="tool" onclick={async()=>{query='';await tick();repairSection.scrollIntoView({block:'start',behavior:'smooth'});}}>Repair an existing save</button></nav></div>
<div class="help-content">
<p class="eyebrow">FIELD GUIDE</p><h1>Get squared away.</h1><p class="page-lead">Installation, compatibility and the ZoneBench editor.</p><Checklist autoStart={startGuide}/>
<div class="help-tools"><input type="search" bind:value={query} placeholder="Search installation, controls, exporting…" aria-label="Search Help"></div>
{#each categories as [name,ids],i}<section class="help-group" bind:this={sections[i]} hidden={!ids.some(matches)}><h2>{name}</h2>{#each ids as id}<details class="help-topic" hidden={!matches(id)} open={query?matches(id):open.has(id)}><summary onclick={e=>{e.preventDefault();toggle(id);}}>{blocks[id][0]}</summary><p>{blocks[id][1]}</p>{#if blocks[id][0]==='Magazine support'}<a class="tool primary" href="https://discord.com/channels/912320241713958912/1322655858240262304/1524208180135989459" target="_blank" rel="noopener noreferrer">Download Mags Reloaded Fork by Priler UPDATE 6</a>{/if}</details>{/each}</section>{/each}
<section class="help-group" id="save-repair" bind:this={repairSection} hidden={!repairMatches()}><h2>Repair an existing save</h2><SaveRepair/></section>
{#if !blocks.some((_,i)=>matches(i))&&!repairMatches()}<p class="hint">No matching help topics. Try a different word.</p>{/if}

</div>
</div>
