<script>
 import EngineNotice from '../components/EngineNotice.svelte';
 import {updatePlan} from '../lib/update-plan.mjs';
 const result=window.Releases.load();
 let installed=$state(''),variant=$state('standard'),installedEngine=$state('previous');
 const version=r=>r.tag.replace(/^v/,'').replace(/-update$/,'');
</script>
<div class="field-page update-page">
 <p class="eyebrow">KEEP YOUR KIT CURRENT</p><h1>Update Squared Away</h1>
 <p class="page-lead">Tell us what you have. We’ll show you what needs replacing.</p>
 {#await result}<p class="hint">Checking the latest release…</p>{:then data}
  {#if data.cached}<p class="hint">Live release lookup is unavailable. These are the last verified releases.</p>{/if}
  {#if data.items.some(r=>!r.preview)}
   <section class="release-panel setup">
    <div><p class="eyebrow">YOUR INSTALLATION</p><h2>What are you running?</h2><p class="hint">Check the version of Squared Away installed in MO2.</p></div>
    <label>Installed mod version<select bind:value={installed}><option value="" disabled>Choose your version</option>{#each data.items.filter(r=>!r.preview&&/^v2\./.test(r.tag)) as release}<option value={release.tag}>{version(release)}</option>{/each}<option value="legacy">Before the 2.0 Update</option><option value="unknown">I’m not sure / another version</option></select></label>
    <fieldset><legend>Which engine do you use?</legend><div class="engine-options"><label class:selected={variant==='standard'}><input type="radio" bind:group={variant} value="standard"/>Standard</label><label class:selected={variant==='bodycam'}><input type="radio" bind:group={variant} value="bodycam"/>Bodycam</label></div></fieldset>
   {#if data.items[0].engineUpdate}<label>Installed engine version<select bind:value={installedEngine}><option value="previous">2.0.3 or older / I’m not sure</option><option value={data.items[0].engineUpdate.tag}>{data.items[0].engineUpdate.version}</option></select></label>{/if}
   </section>
   {@const plan=updatePlan(data.items,installed,variant,installedEngine)}
   {#if plan}
    <section class="release-panel" aria-live="polite">
     <p class="eyebrow">YOUR UPDATE · {version(plan.latest)}</p>
     <h2>{plan.modNeeded?'Here’s what you need.':plan.engineNeeded?'An engine update is available.':'You’re up to date.'}</h2>
     {#if plan.unknown}<p>We can’t verify your installed files. Install both current packages to make sure they match.</p>{/if}
     {#if plan.modNeeded}<div class="download-step"><div><h3>Update the mod</h3><p>Replace your old Squared Away installation in MO2 with this full package. Select the same optional patches you use now, and keep your separate add-ons below it.</p></div><a class="tool primary" href={plan.latest.mod.browser_download_url}>Download mod {version(plan.latest)}</a></div>{/if}
     {#if plan.engineNeeded}<div class="download-step"><div><h3>Update your {variant==='bodycam'?'Bodycam':'standard'} engine</h3><p>Install both <strong>bin</strong> and <strong>db/mods</strong> from the matching engine ZIP into your Anomaly folder.{variant==='bodycam'?' The Bodycam package is DX11-AVX only.':''}</p></div>{#if plan.engine}<a class="tool primary" href={plan.engine.browser_download_url}>Download {variant==='bodycam'?'Bodycam':'standard'} engine</a>{:else}<p role="alert">No matching engine package is available. Check the release before updating.</p>{/if}</div>{:else}<div class="keep-engine"><strong>Keep your current engine.</strong><p>Your selected {variant==='bodycam'?'Bodycam':'standard'} engine is current. No engine download is needed.</p></div>{/if}
     <EngineNotice update={plan.latest.engineUpdate}/><p class:important={plan.newGame}>{plan.newGame?'New game required: saves from before the 2.0 Update are not supported.':plan.unknown?'Already playing on 2.0.x? You can keep your save. Coming from before 2.0? Start a new game.':'Your existing 2.0.x save can continue.'}</p>
     <div class="site-actions"><a class="tool" href="#patch-notes">What changed?</a><a class="tool" href="#help">Installation help</a></div>
    </section>
   {/if}
  {:else}<p>No published update is available.</p>{/if}
 {:catch error}<p role="alert">{error.message}</p>{/await}
</div>
<style>
 .update-page{max-width:1100px}.setup{display:grid;gap:24px}.setup label{display:grid;gap:10px;font-size:14px}select{width:100%;max-width:480px;min-height:48px;padding:10px 14px;color:var(--ink);background:#111512;border:1px solid #626456;border-radius:3px;font:inherit}fieldset{border:0;padding:0;margin:0}legend{font-size:14px;margin-bottom:12px}.engine-options{display:flex;gap:12px;flex-wrap:wrap}.engine-options label{display:flex;align-items:center;gap:10px;padding:14px 22px;border:1px solid #454a40;background:#171b17;border-radius:3px;cursor:pointer}.engine-options label.selected{border-color:var(--hot);background:#292b22}input{accent-color:var(--hot)}.download-step{display:flex;align-items:center;gap:28px;padding:22px 0;border-bottom:1px solid #42483d}.download-step>div{flex:1}.download-step p,.keep-engine p{color:var(--dim);line-height:1.65;margin-bottom:0}.download-step .tool{flex-shrink:0}.keep-engine{padding:20px;margin:20px 0;background:#232d23;border-left:3px solid #849b70}.important{color:var(--warn,#c96480)}.site-actions{margin-top:24px}@media(max-width:650px){.download-step{align-items:flex-start;flex-direction:column}}
</style>
