import importlib.util,json,struct,tempfile,unittest,zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('migration',Path(__file__).parents[1]/'tools/migrate-addon-ids.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
OLD=['zb_72bb0903c26b4164a77c837ab2225358_p335f43e0d3e04391a2670a64f8c1cfe7','zb_72bb0903c26b4164a77c837ab2225358_p67a0e41c4b724773b54a7ebc03f4b4cd']
def chunk(k,data):return struct.pack('<II',k,len(data))+data
def packet(section,oid):
 p=b'\x01\x00'+section.encode()+b'\0unchanged_name\0'+bytes(28)+struct.pack('<HH',oid,32359)+b'unchanged-state'
 return struct.pack('<H',len(p))+p+struct.pack('<H',3)+b'\0\0x'
def saved(ids):return chunk(1,b'header untouched')+chunk(2,struct.pack('<I',len(ids))+b''.join(packet(x,200+i) for i,x in enumerate(ids)))+chunk(3,b'script data untouched')
class Migration(unittest.TestCase):
 def test_both_variants_preserve_packet_state(self):
  ids=OLD+['medkit'];raw=saved(ids);out,changed=m.migrate_raw(raw,{x:m.safe_id(x) for x in OLD})
  self.assertEqual(out,saved([m.safe_id(x) for x in OLD]+['medkit']))
  self.assertEqual([(x['id'],x['parent']) for x in changed],[(200,32359),(201,32359)])
  self.assertEqual(m.migrate_raw(out,{x:m.safe_id(x) for x in OLD}),(out,[]))
 def test_unknown_overlong_and_broken_frames_rejected(self):
  with self.assertRaises(ValueError):m.migrate_raw(saved(['a'*64]),{OLD[0]:m.safe_id(OLD[0])})
  with self.assertRaises(ValueError):m.migrate_raw(saved(OLD)[:-1],{x:m.safe_id(x) for x in OLD})
 def test_save_never_overwrites(self):
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent) as d:
   p=Path(d)/'original.scop';p.write_bytes(b'original')
   with self.assertRaises(ValueError):m.save(p,p,{OLD[0]:m.safe_id(OLD[0])})
   self.assertEqual(p.read_bytes(),b'original')
 def test_previous_recovery_alias(self):
  alias='fmk_recovery_tall_pouch_advanced';out,changed=m.migrate_raw(saved([alias]),{alias:m.safe_id(OLD[1])})
  self.assertEqual(out,saved([m.safe_id(OLD[1])]))
if __name__=='__main__':unittest.main()

