import {lzo1xCompress,lzo1xDecompress} from 'lzo1x';
import {unzipSync,zipSync} from 'fflate';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
export const MAX_SAVE=64*1024*1024,MAX_RAW=256*1024*1024,MAX_ADDON=128*1024*1024;
const MAX_JSON=1024*1024;
function fail(message){throw Error(message);}
function join(parts){const size=parts.reduce((n,p)=>n+p.length,0);if(size>MAX_RAW)fail('The repaired save is too large.');const out=new Uint8Array(size);let pos=0;for(const p of parts){out.set(p,pos);pos+=p.length;}return out;}
function number(n,width){const b=new Uint8Array(width),v=new DataView(b.buffer);width===2?v.setUint16(0,n,true):v.setUint32(0,n,true);return b;}
function equal(a,b){return a.length===b.length&&a.every((x,i)=>x===b[i]);}
export function mergeMappings(mappings){
 const result=Object.create(null);
 for(const map of mappings){
  if(!map||typeof map!=='object'||Array.isArray(map)||Object.keys(map).length>10000)fail('Invalid section mapping. Use a current ZoneBench add-on ZIP.');
  for(const [old,next] of Object.entries(map)){
   if(!/^[a-z][a-z0-9_]{0,255}$/.test(old)||typeof next!=='string'||!/^[a-z][a-z0-9_]{0,62}$/.test(next))fail('Invalid item ID in the mapping.');
   if(result[old]&&result[old]!==next)fail('The selected add-ons contain conflicting mappings for '+old+'.');
   if(old!==next)result[old]=next;
  }
 }
 if(!Object.keys(result).length)fail('No migration mapping found. Download the updated add-on first.');
 for(const next of Object.values(result))if(result[next])fail('The mappings contain chained replacements. Use matching, current add-on versions.');
 return result;
}
export function mappingFromFile(name,data){
 if(data.length>MAX_ADDON)fail('An add-on ZIP is too large (maximum 128 MB).');
 let candidates=[];
 if(/\.json$/i.test(name))candidates=[data];
 else if(/\.zip$/i.test(name)){
  let total=0;
  const files=unzipSync(data,{filter:entry=>{
   if(!/(^|\/)SECTION-MIGRATION\.json$/i.test(entry.name))return false;
   total+=entry.originalSize;
   if(entry.originalSize>MAX_JSON||total>MAX_JSON)fail('The ZIP migration mapping is too large.');
   return true;
  }});
  candidates=Object.values(files);
 }else fail('Choose updated add-on ZIPs or SECTION-MIGRATION.json files.');
 if(!candidates.length)fail(name+' has no migration mapping. Download its updated version from ZoneBench.');
 return mergeMappings(candidates.map(b=>{if(b.length>MAX_JSON)fail('The mapping is too large.');return JSON.parse(decoder.decode(b));}));
}
export function migrateRaw(raw,mappings){
 const mapping=mergeMappings([mappings]);if(raw.length>MAX_RAW)fail('The save is too large.');
 const view=new DataView(raw.buffer,raw.byteOffset,raw.byteLength),chunks=[],changes=[],missing=new Set();let pos=0,found=false,count=0;
 const range=(at,n,end=raw.length)=>{if(at<0||n<0||at+n>end)fail('The save is truncated or has invalid packet lengths.');};
 const u16=(at,end)=>{range(at,2,end);return view.getUint16(at,true);};
 const u32=(at,end)=>{range(at,4,end);return view.getUint32(at,true);};
 while(pos<raw.length){
  const kind=u32(pos),size=u32(pos+4),start=pos+8,end=start+size;range(start,size);pos=end;
  if(kind!==2){chunks.push(raw.subarray(start-8,end));continue;}
  if(found)fail('The save contains duplicate object records.');found=true;
  count=u32(start,end);if(count>1000000)fail('Invalid saved object count.');let cur=start+4;const body=[raw.subarray(start,cur)];
  for(let index=0;index<count;index++){
   const n=u16(cur,end);cur+=2;range(cur,n,end);const finish=cur+n;
   if(u16(cur,finish)!==1)fail('Invalid spawn packet in the save.');
   const zero=raw.indexOf(0,cur+2);if(zero<0||zero>=finish)fail('An item section is not terminated.');
   const sectionBytes=raw.subarray(cur+2,zero);if(sectionBytes.some(b=>b>127))fail('An item section contains unsupported characters.');
   const old=decoder.decode(sectionBytes),next=mapping[old]||old;
   if(next.length>63)missing.add(old);
   let packet=raw.subarray(cur,finish);
   if(next!==old){
    const nameEnd=raw.indexOf(0,zero+1);if(nameEnd<0||nameEnd>=finish)fail('An object name is not terminated.');
    const id=u16(nameEnd+29,finish),parent=u16(nameEnd+31,finish);
    packet=join([packet.subarray(0,2),encoder.encode(next),raw.subarray(zero,finish)]);
    if(packet.length>65535)fail('An item packet is too large.');
    changes.push({index,old,new:next,id,parent});
   }
   body.push(number(packet.length,2),packet);cur=finish;
   const updateSize=u16(cur,end);range(cur+2,updateSize,end);
   if(updateSize<2||u16(cur+2,end)!==0)fail('Invalid update packet in the save.');
   body.push(raw.subarray(cur,cur+2+updateSize));cur+=2+updateSize;
  }
  if(cur!==end)fail('Unexpected data at the end of the object records.');
  const merged=join(body);chunks.push(number(kind,4),number(merged.length,4),merged);
 }
 if(!found)fail('This file does not contain Anomaly save objects.');
 if(missing.size)fail('Add the updated ZIPs for all affected add-ons. Missing mappings: '+[...missing].slice(0,5).join(', '));
 return {raw:join(chunks),changes,count};
}
export function repairSave(bytes,mapping){
 if(bytes.length<15||bytes.length>MAX_SAVE)fail('Choose an Anomaly .scop save up to 64 MB.');
 const header=new DataView(bytes.buffer,bytes.byteOffset,12),size=header.getUint32(8,true);
 if(header.getUint32(0,true)!==0xffffffff||!size||size>MAX_RAW)fail('Unsupported save header or save size.');
 let raw;try{raw=lzo1xDecompress(bytes.subarray(12),size);}catch{fail('The save could not be decompressed. Check that you selected the original .scop file.');}
 const result=migrateRaw(raw,mapping);
 if(!result.changes.length)return {changes:[],count:result.count};
 const compressed=lzo1xCompress(result.raw);
 if(!equal(lzo1xDecompress(compressed,result.raw.length),result.raw))fail('The repaired save failed verification. Nothing was downloaded.');
 const second=migrateRaw(result.raw,mapping);
 if(second.changes.length||!equal(second.raw,result.raw))fail('The repaired save failed its second check.');
 return {bytes:join([bytes.subarray(0,8),number(result.raw.length,4),compressed]),changes:result.changes,count:result.count};
}
export async function repairFiles(saveFiles,addonFiles,outputName){
 if(!/^[a-z0-9_]{1,60}$/.test(outputName))fail('Invalid output save name.');
 const saves=Array.from(saveFiles),addons=Array.from(addonFiles);
 const scop=saves.filter(f=>/\.scop$/i.test(f.name));
 if(scop.length!==1)fail('Select exactly one .scop save and its matching .scoc file.');
 const stem=scop[0].name.replace(/\.scop$/i,'').toLowerCase();
 if(saves.some(f=>!/^.*\.(scop|scoc|dds)$/i.test(f.name)||f.name.replace(/\.(scop|scoc|dds)$/i,'').toLowerCase()!==stem))fail('Select files with the same save name. Do not mix different saves.');
 const side=saves.filter(f=>/\.scoc$/i.test(f.name)),pictures=saves.filter(f=>/\.dds$/i.test(f.name));
 if(side.length!==1||pictures.length>1)fail('Include the matching .scoc file, and optionally its .dds preview.');
 if(scop[0].size>MAX_SAVE||side[0].size>16*1024*1024||pictures.some(f=>f.size>16*1024*1024))fail('The selected save files are too large.');
 if(!addons.length||addons.length>30||addons.some(f=>f.size>MAX_ADDON)||addons.reduce((n,f)=>n+f.size,0)>512*1024*1024)fail('Select 1–30 updated add-on ZIPs or mapping files (up to 512 MB total).');
 const maps=[];
 for(const f of addons)maps.push(mappingFromFile(f.name,new Uint8Array(await f.arrayBuffer())));
 const mapping=mergeMappings(maps),result=repairSave(new Uint8Array(await scop[0].arrayBuffer()),mapping);
 if(!result.changes.length)return {count:result.count,changed:0};
 const report={source:scop[0].name,output:outputName+'.scop',changed:result.changes,objectCount:result.count,validation:'Save framing and compression verified. In-game load still needs checking.'};
 const files={
  [outputName+'.scop']:result.bytes,
  [outputName+'.scoc']:new Uint8Array(await side[0].arrayBuffer()),
  'migration-report.json':encoder.encode(JSON.stringify(report,null,2)),
  'READ-ME.txt':encoder.encode('Close the game. Back up your saves and old add-ons.\nCopy the repaired .scop and .scoc (and .dds if included) into Anomaly/appdata/savedgames, beside your originals. Do not install this save ZIP through MO2.\nIn MO2, disable the old affected add-ons and enable their corrected replacements.\nLoad '+outputName+'. Check the items, save, fully exit and reload.\nThis tool repairs mapped item section IDs only; it is not a general crash repair tool. Original input files were not changed.\n')
 };
 if(pictures[0])files[outputName+'.dds']=new Uint8Array(await pictures[0].arrayBuffer());
 return {bytes:zipSync(files,{level:0}),name:outputName+'.zip',changed:result.changes.length,count:result.count};
}
