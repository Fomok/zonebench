const {test}=require('node:test'),assert=require('node:assert/strict');
test('download records are account-scoped, replace updates and retain actual exported item IDs',async()=>{
 const {recordDownload,downloadedAddons,downloadedIngredient}=await import('../svelte/lib/addon-downloads.mjs');
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 const a={id:'alice'},b={id:'bob'},manifest={format:'zonebench-independent-addon',id:'addon-1',name:'Field kit',addonVersion:'1',items:[{sourceId:'editor_box',id:'zb_real_exported_id',name:'Field box',kind:'boxes'}]};
 assert.throws(()=>recordDownload(null,manifest,{},storage),/Sign in/);
 recordDownload(a,manifest,{},storage);assert.equal(downloadedAddons(b,storage).length,0);assert.equal(downloadedAddons(null,storage).length,0);
 assert.equal(downloadedIngredient(a,'zb_real_exported_id',storage).name,'Field box');assert.equal(downloadedIngredient(a,'editor_box',storage),null);
 recordDownload(a,{...manifest,addonVersion:'2'}, {},storage);assert.equal(downloadedAddons(a,storage).length,1);assert.equal(downloadedAddons(a,storage)[0].version,'2');
 assert.throws(()=>recordDownload(a,{...manifest,items:[{id:'bad/id',kind:'boxes'}]}, {},storage),/Invalid/);
});

test('patch-only downloads are remembered without inventing new ingredient items',async()=>{
 const {recordDownload,downloadedAddons,downloadedIngredient}=await import('../svelte/lib/addon-downloads.mjs');
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},user={id:'alice'};
 recordDownload(user,{format:'zonebench-community-package',id:'patch-one',name:'Balance',addonVersion:'1',items:[],patches:[{sourceSection:'base_rig'}]},{listingId:'listing',revision:2},storage);
 assert.equal(downloadedAddons(user,storage)[0].listingId,'listing');assert.equal(downloadedIngredient(user,'base_rig',storage),null);
});
