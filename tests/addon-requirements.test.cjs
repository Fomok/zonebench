const test=require('node:test'),assert=require('node:assert/strict');
test('recipe requirements only include ingredients actually used and combine shared add-ons',async()=>{
 const {recipeRequirements}=await import('../svelte/lib/addon-requirements.mjs');
 const dependency={id:'pack_1',name:'Extra supplies',version:'1.2'};
 const pack={items:[{item:{name:'Rig',craft:{parts:[['thread',2]]},recipeDependencies:{thread:dependency,unused:{id:'unused'}}}},{item:{name:'Box',craft:{parts:[['thread',1]]},recipeDependencies:{thread:dependency}}}]};
 const result=recipeRequirements(pack,[{id:'pack_1',version:'1.0',listingId:'listing_1'}]);
 assert.deepEqual(result,[{id:'pack_1',name:'Extra supplies',version:'1.2',downloadedVersion:'1.0',link:'#addons/view/listing_1',items:['Rig','Box']}]);
 assert.equal(recipeRequirements(pack)[0].downloadedVersion,'');
});
test('download status distinguishes a newer listing, unavailable listing and failed checks',async()=>{
 const {downloadStatus,addonLink}=await import('../svelte/lib/addon-requirements.mjs');
 const saved={listingId:'one',revision:2,exportRevision:2};
 assert.match(downloadStatus({...saved,exportRevision:1},[],true).label,/migration/);
 assert.equal(downloadStatus(saved,[],false).kind,'unknown');
 assert.equal(downloadStatus(saved,[],true).kind,'unavailable');
 assert.equal(downloadStatus(saved,[{id:'one',revision:2}],true).kind,'current');
 assert.equal(downloadStatus(saved,[{id:'one',revision:3,version:'2.0'}],true).label,'Update available · 2.0');
 assert.equal(addonLink('bad/id'),null);
});
