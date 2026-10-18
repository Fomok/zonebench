const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){const c=vm.createContext({});vm.runInContext(fs.readFileSync('web/src/item-icons.js','utf8'),c);return c.ItemIcons;}
test('stock backpacks and inherited magazine pouches resolve to bundled real icons without mutating items',()=>{
 const icons=setup(),sources=JSON.parse(fs.readFileSync('web/assets/item-icons/sources.json','utf8'));
 assert.equal(Object.keys(sources.items).length,8);
 for(const id of Object.keys(sources.items)){const item={id,icon:null},before=JSON.stringify(item);assert.equal(icons.source(item),'assets/item-icons/'+id+'.png');assert.equal(JSON.stringify(item),before);}
});
test('replacement textures win while unknown and unrelated custom items keep their own fallback',()=>{
 const icons=setup();assert.equal(icons.source({id:'equ_military_pack',icon:'data:image/png;base64,custom'}),'data:image/png;base64,custom');
 assert.equal(icons.source({id:'unknown_mod_item'}),null);assert.equal(icons.source({id:'itm_backpack',new:true}),null);
 assert(icons.source({id:'itm_backpack',new:true,adopt:true}));assert(icons.source({id:'af_magpouch_s',new:true,optionalLibrarySaved:true}));
});
test('bundled PNGs match provenance hashes and exact configured source crop sizes',()=>{
 const {items}=JSON.parse(fs.readFileSync('web/assets/item-icons/sources.json','utf8'));
 for(const record of Object.values(items)){const bytes=fs.readFileSync('web/assets/item-icons/'+record.file);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),record.rect[2]);assert.equal(bytes.readUInt32BE(20),record.rect[3]);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256);}
});
test('displaying an inherited icon does not turn a price-only mod patch into a texture export',()=>{
 const c=vm.createContext({crypto,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob});
 for(const file of ['emit.js','archive.js'])vm.runInContext(fs.readFileSync('web/src/'+file,'utf8'),c);
 vm.runInContext(fs.readFileSync('web/data/baseline.js','utf8'),c);
 for(const file of ['compatibility.js','independent-addon.js','adaptation-export.js','item-icons.js','editor-library.js'])vm.runInContext(fs.readFileSync('web/src/'+file,'utf8'),c);
 const seed=vm.runInContext('SEED',c),base=seed.pouches.find(x=>x.id==='af_magpouch_s'),item=JSON.parse(JSON.stringify(base));item.cost+=100;item.optionalLibrarySaved=true;
 const before=JSON.stringify(item);assert(c.ItemIcons.source(item));assert.equal(JSON.stringify(item),before);
 const patch=c.EditorLibrary.modOverrideSource('pouches',item,base);assert.equal(patch.own.look,false);assert.equal(patch.icon,null);
 const db={rigs:[],boxes:[],pouches:[patch],packs:[],items:[],families:{}};
 const plan=c.AdaptationExport.plan(db,seed,'pouches',patch);assert(!plan.picture);assert(!plan.files.some(f=>f.name.endsWith('.dds')));
 const text=plan.files.map(f=>new TextDecoder().decode(f.bytes)).join('\n');assert(text.includes('cost = '+item.cost));assert(!text.includes('icons_texture'));
});
