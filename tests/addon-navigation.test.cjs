const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(hash='#home'){
 const events={},location={hash},pushes=[];
 const context=vm.createContext({location,history:{pushState(a,b,value){pushes.push(value);location.hash=value;}},document:{querySelector(){return {scrollTop:0};}},render(){},window:{addEventListener(name,fn){events[name]=fn;}}});
 vm.runInContext("let TAB='home',COMMUNITY_MODE='public',COMMUNITY_OFFSET=24,COMMUNITY_EDIT={id:'old'};",context);
 vm.runInContext(fs.readFileSync('web/src/site.js','utf8'),context);
 return {context,events,location,pushes,site:context.Site,get:s=>vm.runInContext(s,context)};
}
test('add-on modes have distinct routes and discard stale listing edits',()=>{
 const c=setup();c.site.addons('mine');assert.equal(c.location.hash,'#addons/mine');assert.equal(c.get('COMMUNITY_MODE'),'mine');assert.equal(c.get('COMMUNITY_OFFSET'),0);assert.equal(c.get('COMMUNITY_EDIT'),null);
 c.site.addons('public');assert.equal(c.location.hash,'#addons');assert.equal(c.pushes.length,2);
});
test('refresh and Back restore the selected add-on section',()=>{
 const c=setup('#addons/mine');assert.equal(c.site.tabFromHash(),'catalog');assert.equal(c.get('COMMUNITY_MODE'),'mine');
 c.site.addons('public');c.location.hash='#addons/mine';c.events.popstate();assert.equal(c.get('TAB'),'catalog');assert.equal(c.get('COMMUNITY_MODE'),'mine');
 c.location.hash='#addons';c.events.hashchange();assert.equal(c.get('COMMUNITY_MODE'),'public');
});
test('old Community links remain usable and invalid sections do not select privileged modes',()=>{
 const c=setup('#community');assert.equal(c.site.tabFromHash(),'catalog');assert.equal(c.get('COMMUNITY_MODE'),'public');
 c.location.hash='#addons/unknown';assert.equal(c.site.tabFromHash(),'home');
 c.site.addons('unknown');assert.equal(c.location.hash,'#addons');
});

test('download history links resolve a public add-on without selecting an admin mode',()=>{
 const c=setup('#addons/view/listing_123');assert.equal(c.site.tabFromHash(),'catalog');assert.equal(c.get('COMMUNITY_MODE'),'public');
 c.site.go('catalog');assert.equal(c.location.hash,'#addons/view/listing_123');
 c.site.addons('mine');assert.equal(c.location.hash,'#addons/mine');
});

test('full editor router preserves installation deep links and Help independently',()=>{
 const c=setup('#installation');assert.equal(c.site.tabFromHash(),'installation');c.site.go('installation');assert.equal(c.location.hash,'#installation');
 c.site.go('help');assert.equal(c.location.hash,'#help');c.location.hash='#installation';c.events.popstate();assert.equal(c.get('TAB'),'installation');
 c.location.hash='#help';c.events.hashchange();assert.equal(c.get('TAB'),'help');c.location.hash='#installation';c.events.hashchange();assert.equal(c.get('TAB'),'installation');
});
