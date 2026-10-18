const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function bootstrap(hash){
 const events={},mounts=[],location={hash},target={replaceChildren(){},scrollTop:0};
 const context={location,editorRelease:{},addonFilename(){},recordDownload(){},downloadedAddons(){},loadScripts:async()=>{},__SITE_BUILD__:'test',document:{querySelector:()=>target,body:{classList:{add(){},toggle(){}}}},mount(Page,options){mounts.push({Page,...options});return {};},unmount(){}};
 for(const name of ['Home','Downloads','Update','Help','Notes','Account','Addons'])context[name]=name;
 context.window={PatchNotes:{unread:()=>false},addEventListener(name,fn){events[name]=fn;},removeEventListener(){}};
 const code=fs.readFileSync('svelte/bootstrap.js','utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ','').replaceAll('import.meta.env.BASE_URL',"'/'");
 vm.createContext(context);vm.runInContext(code,context);await context.start(()=>{});
 return {context,events,mounts,location};
}
test('installation deep link starts existing Help wizard on refresh and cross-page navigation',async()=>{
 const c=await bootstrap('#installation');assert.equal(c.mounts.at(-1).Page,'Help');assert.equal(c.mounts.at(-1).props.startGuide,true);
 c.context.window.Site.go('help');c.events.hashchange();assert.equal(c.mounts.at(-1).props.startGuide,false);
 c.context.window.Site.go('installation');c.events.hashchange();assert.equal(c.mounts.at(-1).props.startGuide,true);
 const count=c.mounts.length;c.context.window.Site.go('installation');assert.equal(c.mounts.length,count+1);assert.equal(c.mounts.at(-1).props.startGuide,true);
 c.context.window.ZonebenchPages.render({},'installation');assert.equal(c.mounts.at(-1).props.startGuide,true);
});
test('installation entry clicks reopen guide while modified clicks keep native link behavior',async()=>{
 const {openInstallation}=await import('../svelte/lib/installation-navigation.mjs');let calls=0,prevented=0;global.window={Site:{go(tab){assert.equal(tab,'installation');calls++;}}};
 try{const event={button:0,preventDefault(){prevented++;}};openInstallation(event);openInstallation(event);assert.equal(calls,2);assert.equal(prevented,2);for(const flag of ['ctrlKey','metaKey','shiftKey','altKey'])openInstallation({...event,[flag]:true});openInstallation({...event,button:1});assert.equal(calls,2);}finally{delete global.window;}
});
