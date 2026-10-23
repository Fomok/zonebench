const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const {test}=require('node:test');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../web');
const context=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob});
for(const name of ['src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const seed=()=>vm.runInContext('JSON.parse(JSON.stringify(SEED))',context);
const {ZB,EMIT,BUILD}=context;
test('corrected new-item translations survive exports and boxes retain chosen stack limits',()=>{
 const db=seed(),base=EMIT.baseStrings(db.files['configs/text/eng/zzz_amp_text.xml']);
 for(const lang of ['eng','rus','ukr','spa']){
  const original=db.files['configs/text/'+lang+'/zzz_amp_text.xml'];
  const result=EMIT.textFile(db,original,base,[]);
  for(const kind of ['boxes','pouches'])for(const id of db.introducedItems[kind])for(const suffix of ['name','descr']){
   const key='st_'+id+'_'+suffix;assert.equal(EMIT.getString(result,key),EMIT.getString(original,key));
  }
 }
 for(const limit of [1,7,999]){
  db.boxes[0].stack=limit;
  const text=EMIT.boxSystem(db,db.files['configs/mod_system_amp_boxes.ltx'],{});
  const block=text.split('['+db.boxes[0].id+']')[1].split('\n[')[0];
  assert.match(block,new RegExp('amp_box_stack\\s*=\\s*'+limit+'(?:\\s|$)'));
 }
});
test('current baseline validates and has no inventory script or UI templates',()=>{
 const db=seed();ZB.validate(db);assert.equal(db.modVersion,'2.1.0 Hotfix 1');assert.equal(Object.keys(db.files).filter(x=>x.startsWith('scripts/')||x.startsWith('configs/ui/')).length,0);
});
test('new rigs receive the dedicated engine slot without replacing runtime',()=>{
 const db=seed();const r=JSON.parse(JSON.stringify(db.rigs[0]));r.id='amprig_test';r.new=true;db.rigs.push(r);
 const files=ZB.compatibilityFiles(db);assert.equal(files.length,2);assert(!files.some(f=>f.name.endsWith('zzz_armor_mag_pouches.script')));
 assert.match(files[1].text,/!\[amprig_test\]\r\nclass = II_CONTR\r\ndont_stack = true\r\nslot = 15\r\nrestore_slot_from_config = true/);
 assert.match(files[0].text,/amprig_test/);assert.match(files[0].text,/amp_wd_seam/);
});
test('stock pouch grants are exported as overrides',()=>{const db=seed();db.pouches[0].grants['2x2']=2;const text=ZB.compatibilityFiles(db)[1].text;assert.match(text,/!\[af_magpouch_s\][\s\S]*?amp_pgrant_2x2 = 2/);});
test('retired stock items stay defined while distribution is removable',()=>{
 const db=seed();const id=db.rigs[0].id;db.rigs=db.rigs.slice(1);db.removed=[{id,kind:'rigs'}];
 const definitions=EMIT.rigSystem({...db,removed:[]},db.files['configs/mod_system_amp_rigs.ltx'],{});
 assert(definitions.includes('['+id+']'));assert(ZB.compatibilityFiles(db)[0].text.includes('["'+id+'"]=true'));
});
test('rejects malformed projects and script injection in item ids and models',()=>{
 for(const mutation of [db=>db.rigs[0].id='evil\n[section]',db=>{db.rigs[0].model='custom';db.rigs[0].modelPath='../bad';},db=>db.rigs[0].cost=-1,db=>db.rigs[0].icon='https://example.com/track.png',db=>db.cond.novice=[90,10]]){const db=seed();mutation(db);assert.throws(()=>ZB.validate(db));}
 assert.throws(()=>ZB.validateAddon(JSON.parse('{"bench":"zonebench-items","version":1,"items":[],"__proto__":{"polluted":true}}')));
});
test('catalog packs validate before merge',()=>{const db=seed();assert.doesNotThrow(()=>ZB.validateAddon({bench:'zonebench-items',version:1,items:[{kind:'rigs',item:db.rigs[0]}]}));assert.throws(()=>ZB.validateAddon({bench:'zonebench-items',version:1,items:[{kind:'unknown',item:db.rigs[0]}]}));});
test('DDS writer preserves distinct color channels',()=>{
 const bytes=BUILD.ddsFrom({width:1,height:1,data:new Uint8Array([11,22,33,255])});
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'DDS ');assert.deepEqual(Array.from(bytes.slice(128,132)),[33,22,11,255]);
});
test('ZIP writer creates a standard archive',async()=>{const blob=await BUILD.zip([{name:'gamedata/test.ltx',bytes:new TextEncoder().encode('[test]\nvalue = 1')}]);const b=new Uint8Array(await blob.arrayBuffer());assert.deepEqual(Array.from(b.slice(0,4)),[80,75,3,4]);});
test('site has no whole-runtime export path',()=>{const source=fs.readFileSync(path.join(root,'src/editor.js'),'utf8');assert(!source.includes('EMIT.scriptLists'));assert(!source.includes('put(SCRIPT_PATH'));});

// Audited source hashes catch stale templates or model files in a future baseline update.
test('2.0 baseline matches audited templates and shared model assets',()=>{
 const crypto=require('node:crypto');const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/baseline-manifest.json'),'utf8'));const db=seed();
 assert.equal(db.baseline,'squared-away-2.1.0-hotfix1');assert.equal(db.baseline,manifest.baseline);assert.equal(db.engineCommit,manifest.engineCommit);
 assert.deepEqual(Object.keys(db.files).sort(),Object.keys(manifest.templates).sort());
 for(const [name,hash] of Object.entries(manifest.templates))assert.equal(crypto.createHash('sha256').update(db.files[name]).digest('hex'),hash,name);
 for(const [name,hash] of Object.entries(manifest.models))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/models',name))).digest('hex'),hash,name);
});

test('all localized exports preserve game characters and match their XML encoding',()=>{
 const db=seed();const base=EMIT.baseStrings(db.files['configs/text/eng/zzz_amp_text.xml']);
 for(const lang of ['eng','rus','spa','ukr']){
  const text=EMIT.textFile(db,db.files['configs/text/'+lang+'/zzz_amp_text.xml'],base,[]);
  const bytes=BUILD.stringTable(text,lang);const decoded=BUILD.decodeStringTable(bytes);
  assert.equal(decoded,text);assert(!decoded.includes('\ufffd'));
 }
 for(const [lang,word] of [['rus','Разгрузка'],['ukr','Ємність ґрунт ї'],['spa','Munición pequeña']]){
  const xml='<?xml version="1.0" encoding="utf-8"?><string_table>'+word+'</string_table>';
  assert(BUILD.decodeStringTable(BUILD.stringTable(xml,lang)).includes(word));
 }
 assert.throws(()=>BUILD.stringTable('<text>😀</text>','rus'),/Unsupported character/);
});


test('pouch descriptions with multiplication signs export to a ZIP in every language',async()=>{
 const description='Attaches to your rig and adds two separate 1\u00d73 storage slots for longer items.';
 const xml='<?xml version="1.0" encoding="utf-8"?><string_table><string id="st_tall_pouch_descr"><text>'+description+'</text></string></string_table>';
 const files=[];
 for(const lang of ['eng','rus','ukr','spa']){
  const bytes=BUILD.stringTable(xml,lang),decoded=BUILD.decodeStringTable(bytes);
  assert(decoded.includes(lang==='spa'?description:description.replace('\u00d7','x')));
  assert(!decoded.includes('\ufffd'));
  files.push({name:'gamedata/configs/text/'+lang+'/tall_pouch.xml',bytes});
 }
 assert(xml.includes('1\u00d73'),'source description must remain unchanged');
 const zip=await BUILD.zip(files);assert(zip.size>0);
 assert.throws(()=>BUILD.stringTable('<text>1\u00d73 \ud83d\ude00</text>','eng'),/Unsupported character/);
});
