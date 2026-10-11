"""Offline ZoneBench ID migration. Originals are never overwritten.
Usage: python migrate-addon-ids.py addon SOURCE_FOLDER OUTPUT.zip
       python migrate-addon-ids.py save SOURCE.scop OUTPUT.scop MAPPING.json
Save mode requires lzokay (also bundled with MO2 basic_games).
"""
import argparse, hashlib, json, re, struct, sys, zipfile
from pathlib import Path
LEGACY = re.compile(r'^zb_([0-9a-f]{32})_([rbpk])([0-9a-f]{32})$')
def base36(hexid):
    n=int(hexid,16); out=''
    while n:
        n,r=divmod(n,36);out='0123456789abcdefghijklmnopqrstuvwxyz'[r]+out
    return out.rjust(25,'0')
def safe_id(old):
    m=LEGACY.fullmatch(old)
    if not m: raise ValueError('Not a legacy ZoneBench ID: '+old)
    return 'zb_'+m[2]+base36(m[1])+'_'+base36(m[3])
def check_mapping(mapping):
    if not mapping: raise ValueError('Empty mapping')
    for old,new in mapping.items():
        if not re.fullmatch('[a-z][a-z0-9_]*',old) or not re.fullmatch('[a-z][a-z0-9_]{0,62}',new):
            raise ValueError('Invalid mapping ID')
def addon(source,target):
    manifest=json.loads((source/'addon.json').read_text())
    mapping={r['id']:safe_id(r['id']) for r in manifest['items']}
    check_mapping(mapping)
    if len(set(mapping.values()))!=len(mapping):raise ValueError('ID collision')
    files={}
    for p in sorted((source/'gamedata').rglob('*')):
        if not p.is_file():continue
        data=p.read_bytes()
        if p.suffix.lower()=='.ltx':
            # Preserve localization keys and image paths; update actual section references,
            # including x_<id> crafting keys. Bytes avoid changing legacy encodings.
            rows=[]
            for line in data.splitlines(keepends=True):
                if not re.match(rb'\s*(?:description|inv_name|inv_name_short|icons_texture)\s*=',line):
                    for old,new in mapping.items():line=line.replace(old.encode(),new.encode())
                rows.append(line)
            data=b''.join(rows)
        files[p.relative_to(source).as_posix()]=data
    for row in manifest['items']:row['id']=mapping[row['id']]
    manifest.update(exportRevision=2,sectionIdFormat=2,sectionMigration=mapping)
    # No old spawn section or distribution reference may survive. Localization is allowed.
    for name,data in files.items():
        if not name.endswith('.ltx'):continue
        for line in data.splitlines():
            if re.match(rb'\s*(?:description|inv_name|inv_name_short|icons_texture)\s*=',line):continue
            if any(old.encode() in line for old in mapping):raise ValueError('Old reference survived: '+name)
    files['addon.json']=(json.dumps(manifest,indent=2)+'\n').encode()
    files['SECTION-MIGRATION.json']=(json.dumps(mapping,indent=2)+'\n').encode()
    files['INSTALL.txt']=b'''TEST REPLACEMENT - SAVE-SAFE ITEM IDS
Install as a separate MO2 mod and DISABLE the old Tall mag pouches addon.
Do not leave the original enabled: it could spawn the unsafe IDs again.
Keep Squared Away and the required icon/model dependencies enabled.
Existing saves containing old IDs need offline migration BEFORE loading.
Use a separate migrated save or a new test game. Keep original backups.
Test both pouches: spawning, crafting, NPC drops, equipment, save, quit, reload.
'''
    with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED) as z:
        for name,data in files.items():z.writestr(name,data)
    return mapping

def lzo():
    try:import lzokay
    except ImportError:
        sys.path.insert(0,'C:/GAMMA/plugins/basic_games/lib')
        import lzokay
    return lzokay

def migrate_raw(raw,mapping):
    """Only replace section strings in spawn packets. Preserve every other packet byte."""
    check_mapping(mapping);out=bytearray();pos=0;changed=[];found=False
    while pos<len(raw):
        if pos+8>len(raw):raise ValueError('Truncated chunk')
        kind,size=struct.unpack_from('<II',raw,pos);pos+=8
        if pos+size>len(raw):raise ValueError('Truncated chunk body')
        body=raw[pos:pos+size];pos+=size
        if kind==2:
            if found:raise ValueError('Duplicate object chunk')
            found=True;count,=struct.unpack_from('<I',body);cursor=4;newbody=bytearray(body[:4])
            for index in range(count):
                n,=struct.unpack_from('<H',body,cursor);cursor+=2
                packet=body[cursor:cursor+n];cursor+=n
                if len(packet)!=n or packet[:2]!=b'\x01\x00':raise ValueError('Invalid spawn packet')
                end=packet.index(b'\0',2);old=packet[2:end].decode('ascii');new=mapping.get(old,old)
                if len(new.encode('ascii'))>63:raise ValueError('Unmapped overlong section: '+old)
                if new!=old:
                    name_end=packet.index(b'\0',end+1)
                    oid,parent=struct.unpack_from('<HH',packet,name_end+1+28)
                    changed.append(dict(index=index,old=old,new=new,id=oid,parent=parent))
                    packet=packet[:2]+new.encode('ascii')+packet[end:]
                newbody+=struct.pack('<H',len(packet))+packet
                n,=struct.unpack_from('<H',body,cursor)
                update=body[cursor:cursor+2+n]
                if len(update)!=2+n:raise ValueError('Truncated update')
                newbody+=update;cursor+=2+n
            if cursor!=len(body):raise ValueError('Invalid object framing')
            body=bytes(newbody)
        out+=struct.pack('<II',kind,len(body))+body
    if not found:raise ValueError('No object chunk')
    return bytes(out),changed

def save(source,target,mapping):
    if source.resolve()==target.resolve():raise ValueError('Choose a different output save name')
    report=target.with_suffix('.migration.json')
    outputs=[target,report]+[target.with_suffix(ext) for ext in ['.scoc','.dds'] if source.with_suffix(ext).exists()]
    if any(p.exists() for p in outputs):raise ValueError('Output already exists; choose a new name')
    original=source.read_bytes();magic,version,size=struct.unpack_from('<III',original)
    if magic!=0xffffffff or size>256*1024*1024:raise ValueError('Unsupported save header')
    codec=lzo();raw=codec.decompress(original[12:],size)
    if len(raw)!=size:raise ValueError('Size mismatch')
    rebuilt,changed=migrate_raw(raw,mapping)
    if not changed:raise ValueError('No matching objects: no recovery copy needed')
    compressed=codec.compress(rebuilt)
    if codec.decompress(compressed,len(rebuilt))!=rebuilt:raise ValueError('Compression verification failed')
    again,repeated=migrate_raw(rebuilt,mapping)
    if repeated or again!=rebuilt:raise ValueError('Migration did not stabilize')
    data=original[:8]+struct.pack('<I',len(rebuilt))+compressed
    with target.open('xb') as f:f.write(data)
    for ext in ['.scoc','.dds']:
        src=source.with_suffix(ext)
        if src.exists():
            with target.with_suffix(ext).open('xb') as f:f.write(src.read_bytes())
    if source.read_bytes()!=original:raise ValueError('Source changed during migration')
    result=dict(source=str(source),target=str(target),changed=changed,source_sha256=hashlib.sha256(original).hexdigest(),target_sha256=hashlib.sha256(data).hexdigest(),status='Offline framing and byte preservation checked; in-game load pending')
    with report.open('x') as f:json.dump(result,f,indent=2)
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('mode',choices=['addon','save']);p.add_argument('source',type=Path);p.add_argument('target',type=Path);p.add_argument('mapping',type=Path,nargs='?');args=p.parse_args()
    result=addon(args.source,args.target) if args.mode=='addon' else save(args.source,args.target,json.loads(args.mapping.read_text()))
    print(json.dumps(result,indent=2))
