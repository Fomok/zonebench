/* Display-only originals. Never assign these paths to DB items or exported textures. */
(function(root){
'use strict';
const originals=new Set(['itm_backpack','equ_small_pack','equ_small_military_pack','equ_military_pack','equ_tourist_pack','af_magpouch_s','af_magpouch_m','af_magpouch_l']);
function original(item){
 if(!item||!originals.has(item.id)||item.new&&!item.adopt&&!item.optionalLibrarySaved)return null;
 return 'assets/item-icons/'+item.id+'.png';
}
function source(item){return item?.icon||original(item);}
root.ItemIcons=Object.freeze({source,original});
})(globalThis);
