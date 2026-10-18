const {test}=require('node:test'),assert=require('node:assert/strict');
test('addon ZIP names preserve readable names and versions while removing path characters',async()=>{const {addonFilename}=await import('../svelte/lib/guided-install.mjs');assert.equal(addonFilename('Tall mag pouches','1.0'),'Squared Away Tall mag pouches 1.0.zip');assert.equal(addonFilename('Box / Kit: "A"','2/3'),'Squared Away Box Kit A 23.zip');});
test('installation questions require explicit yes and no answers',async()=>{const {checklistReady,checklistSetup}=await import('../svelte/lib/guided-install.mjs');assert.equal(checklistReady({game:true}),false);const answers={game:false,sota:false,bodycam:true,devices:false,looting:true};assert.equal(checklistReady(answers),true);assert.equal(checklistSetup(answers).game,'anomaly');assert.equal(checklistSetup(answers).bodycam,true);});
test('guided steps cannot be skipped and revisiting resets subsequent progress',async()=>{const {advanceChecklist}=await import('../svelte/lib/guided-install.mjs');assert.equal(advanceChecklist(0,3,true,5),0);assert.equal(advanceChecklist(0,0,true,5),1);assert.equal(advanceChecklist(3,1,false,5),1);assert.equal(advanceChecklist(4,4,true,5),5);});

test('ZONA checklist selects its own magazine and UI patches',async()=>{
 const {checklistReady,checklistSetup}=await import('../svelte/lib/guided-install.mjs');const answers={game:'zona',sota:true,bodycam:false,devices:false,looting:false};assert(checklistReady(answers));assert.equal(checklistSetup(answers).game,'zona');
 const vm=require('node:vm'),fs=require('node:fs'),c=vm.createContext({});vm.runInContext(fs.readFileSync('web/src/installation-guide.js','utf8'),c);const steps=c.InstallationGuide.steps(answers);assert(steps.find(x=>x[0]==='zona'));assert.match(steps.find(x=>x[0]==='mags')[1],/Mags Redux ammo fix/);assert.match(steps.find(x=>x[0]==='sota')[1],/\(ZONA\)/);
});
test('manual IDs reject malformed and injectable section names',async()=>{const {validItemId}=await import('../svelte/lib/item-id.mjs');assert(validItemId('zona_custom_part_2'));for(const x of ['', 'bad id','x\n[evil]','../file','x;comment','1bad'])assert(!validItemId(x));});

test('FG checklist preserves normal launch and distinguishes the obsolete helper from the model',async()=>{
 const {checklistReady}=await import('../svelte/lib/guided-install.mjs');
 const answers={game:'gamma',sota:false,bodycam:'fg',devices:false,looting:false};assert(checklistReady(answers));
 const vm=require('node:vm'),fs=require('node:fs'),c=vm.createContext({});vm.runInContext(fs.readFileSync('web/src/installation-guide.js','utf8'),c);
 const text=c.InstallationGuide.steps(answers).find(x=>x[0]==='engine')[1];
 for(const expected of ['nvngx.dll_dlssnr.dll','KEEP nvngx_dlssnr.dll','FrameGen.External=true','own FG off','OverlayMenu=false','MO2 Play','loose MO2 files override','FG UI/scope'])assert(text.includes(expected),expected);
 const old=c.InstallationGuide.steps({...answers,bodycam:false}).find(x=>x[0]==='engine')[1];assert(old.includes('2026.10.11'));assert(!old.includes('nvngx'));
});
