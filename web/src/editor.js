
"use strict";


/* ==========================================================
   THE NUMBERS THE MOD ITSELF USES.
   Ported from art/mkloot.py and art/mkcraft.py so the bench and the
   build agree about what a rig is worth. If these drift, the bench
   lies - so they are together, named the same, in one place.
   ========================================================== */
const KINDS = ["2x2","3x1","2x1","1x1"];
const CELLS = {"2x2":4,"3x1":3,"2x1":2,"1x1":1};
// TALL x WIDE. A 2x1 is two squares tall and one wide - the name reads
// down first, which is the opposite of what everyone assumes once.
const SHAPE = {"2x2":[2,2],"3x1":[3,1],"2x1":[2,1],"1x1":[1,1]};
const WORTH = {"1x1":1.0,"2x1":2.2,"3x1":3.4,"2x2":4.8};
const BANDS = [[12.5,1],[17.0,2],[21.0,3],[26.0,4]];
const CAP_COMMON = 3, CAP_RARE = 4;
// Roubles per point of worth, and the slack in the ladder. Both are the
// build's own numbers - the bench must not object to a price the build
// would ship, nor pass one it would refuse.
const LO_RU = 80, HI_RU = 380, LADDER_SLACK = 3.0;
const RANKS = ["novice","trainee","experienced","professional",
               "veteran","expert","master","legend"];
const RANK_EN = {novice:"Rookie",trainee:"Trainee",experienced:"Experienced",
  professional:"Professional",veteran:"Veteran",expert:"Expert",
  master:"Master",legend:"Legend"};
/* WHAT A CONTAINER TAKES lives in its own file, one section per RULE,
   and a container names the rule it uses. The list of rules used to be
   typed here - nine names, fixed - which meant the file could describe
   a tenth and the bench would never show it, and there was no way to
   write one from this page at all. So the list is read out of the file
   now, and this is only where the file is. */
const RULES_PATH = "configs/items/amp_boxes.ltx";
/* WHERE A NEW THING SORTS. One line per rig and per container, read by
   Sorting Plus and nothing else - a rig goes with the outfits and a box
   with the storage. There is nothing to choose, so there is no page for
   it; the build just writes it. */
const SORT_PATH = "configs/mod_sortingplus_amp.ltx";
/* WHAT A POUCH COSTS TO BUILD. The workshop category [2], which this
   file already overrides for the magazine mod's medium pouch - our own
   pouches' recipes go under that line. */
const PCRAFT_PATH = "configs/items/settings/mod_craft_zzz_amp_magpouch.ltx";
/* WHAT A RIG IS MADE OF: two lists in one file, and they answer
   different questions - see the emitter's own note. */
const PARTS_PATH = "configs/items/settings/mod_parts_amp_rigs.ltx";
/* HOW MUCH ROOM EACH BACKPACK GIVES. Zone Grid's own file, in the same
   gamedata folder the two mods have always shared - overrides only,
   because a pack nobody has listed is worked out from its carry bonus. */
const PACKS_PATH = "configs/items/settings/zzz_grid_packs.ltx";
/* THE ITEM EDITOR'S TWO. An item given a new picture, a new size in
   your bag or a new price gets an override block in the first; a recipe
   for one goes in the second, under the workshop list it belongs to.
   Both ship empty and both are DLTX - nothing in them declares what an
   item is or what it does. */
const ITEMS_PATH = "configs/mod_system_zzz_amp_items.ltx";
const ICRAFT_PATH = "configs/items/settings/mod_craft_zzz_amp_items.ltx";
/* The game's own word for what a thing is, offered as suggestions
   under the Kinds box. Not a closed list - the field takes whatever is
   typed into it - just the ones already in use, so the common case is
   a pick rather than a spelling. */
const KIND_HINTS = ["i_medical","i_food","i_drink","i_mutant_cooked",
  "i_mutant_raw","i_part","i_letter","i_tool","i_repair","i_arty","i_device",
  "i_attach","i_other","o_light","o_medium","o_heavy","o_sci","o_helmet"];
const SOUNDS = ["chest","plastic","metal","cloth"];
const SHELVES = [
  ["general","Sidorovich & faction traders"],
  ["medic","The medic"],
  ["ecolog","Sakharov & Hermann"],
  ["mechanic","The mechanics"],
  ["food","The barman & the butcher"]
];
const FOLD = {1:1,2:1,3:2,4:3,5:3};
// Which pouch slider a stash tier joins, the same fold the craft books
// use. This is A.POUCH_COL in the mod, and the two must agree.
const POUCH_COL = {1:1,2:1,3:2,4:3,5:3};
const BOOK = {1:"recipe_basic_0",2:"recipe_basic_1",3:"recipe_advanced_1"};
const FABRIC = {1:"prt_o_fabrics_1",2:"prt_o_fabrics_3",3:"prt_o_fabrics_4"};
const BASE_FABRIC = {1:4,2:6,3:8}, THREAD_BASE = {1:4,2:6,3:8}, THREAD_PER = 2;

function cellsOf(s){ return KINDS.reduce((a,k)=>a+CELLS[k]*(s[k]||0),0); }
function worthOf(s){ return KINDS.reduce((a,k)=>a+WORTH[k]*(s[k]||0),0); }
function tierOf(s){
  const w = worthOf(s);
  for(const [hi,t] of BANDS) if(w<=hi) return t;
  return 5;
}
function stashOf(t){
  return t<=CAP_COMMON ? "common and rare stashes"
       : t<=CAP_RARE   ? "rare stashes only"
       : "no stash - craft or a legend's body";
}
/* The recipe, spent down exactly as mkcraft does it: large pouch first
   because a 2x2 is the slot nothing else reaches, then medium, then
   small - and at most two KINDS, because the workshop drops a recipe
   line with more than four ingredients. */
function recipeOf(slots){
  const tier = FOLD[tierOf(slots)];
  const rem = {}; KINDS.forEach(k=>rem[k]=slots[k]||0);
  const P = [["large","af_magpouch_l","2x2",1],
             ["medium","af_magpouch_m","2x1",2],
             ["small","af_magpouch_s","2x1",1]];
  const n = {};
  for(const [cls,item,geo,cap] of P){ n[cls]=Math.floor(rem[geo]/cap); rem[geo]-=n[cls]*cap; }
  const chosen = P.filter(p=>n[p[0]]>0).slice(0,2).map(p=>p[0]);
  const parts=[]; let pouches=0;
  for(const [cls,item,geo,cap] of P){
    if(chosen.includes(cls)){ parts.push([item,n[cls]]); pouches+=n[cls]; }
    else rem[geo]+=n[cls]*cap;
  }
  const leftover = KINDS.reduce((a,k)=>a+CELLS[k]*rem[k],0);
  parts.push(["sewing_thread", THREAD_BASE[tier]+THREAD_PER*pouches]);
  parts.push([FABRIC[tier], BASE_FABRIC[tier]+leftover]);
  return {tier, book:BOOK[tier], parts, pouches, leftover};
}

/* ==========================================================
   STATE
   ========================================================== */
let DB = null, TAB = Site.tabFromHash(), SEL = {}, DIRTY = false, PAINT = "2x2";
let PENDING_ICON = null;
const $ = s => document.querySelector(s);
const el = (t,c,h) => { const e=document.createElement(t);
  if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,
  c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ==========================================================
   THE BENCH REMEMBERS ITSELF

     "instead of providing the mod file and save json every time i open
      it. it will work more like an app. ill need to put that in the
      seperate folder and it will update things inside with what i
      provide and auto use those so when i restart my PC i can just
      continue straight away."

   So: everything you do is written back the moment you do it, and
   opening the page picks up exactly where you left off. No save to
   pick, no mod zip to re-feed, nothing to remember.

   WHERE IT IS KEPT. In the browser's own store, under this page. Two
   of them, in order:

     IndexedDB    first, because there is no practical size limit and a
                  bench with a dozen pictures in it is megabytes.
     localStorage second, when IndexedDB is refused - about five
                  megabytes, which is enough for the numbers and a few
                  pictures and not enough for many.

   ...and if both are refused - a private window, a browser told to
   keep no site data - the bench says so in the corner and goes on
   working exactly as it did before, with the save file as the only
   memory. It never pretends to have saved something it did not.

   WHAT IS KEPT is what "Save project" writes: the items, the
   numbers, the layouts, the drop settings, your notes, and only the
   pictures you replaced. The mod's own three megabytes of config are
   NOT kept, because this page already has them baked in - unless you
   have fed it a NEWER mod than the one it was built with, which is the
   one case where they are.

   THE SAVE FILE IS NOT GONE and is not second best. This store belongs
   to one browser on one computer; the file is the copy you send me,
   send your friend, or put somewhere safe. Both are here on purpose.
   ========================================================== */
const KEEP_DBN = "zonebench-web-v1", KEEP_STORE = "state", KEEP_ROW = "bench";
let KEEP_HOW = null;         // "idb" | "ls" | "off", decided once
let KEEP_ERR = "";           // why, if off

function idbOpen(){
  return new Promise(res=>{
    let r;
    try{ r = indexedDB.open(KEEP_DBN, 1); }
    catch(e){ KEEP_ERR = e.message || String(e); return res(null); }
    r.onupgradeneeded = ()=>{
      const db = r.result;
      if(!db.objectStoreNames.contains(KEEP_STORE)) db.createObjectStore(KEEP_STORE);
    };
    r.onsuccess = ()=>res(r.result);
    r.onerror = ()=>{ KEEP_ERR = (r.error && r.error.message) || "refused"; res(null); };
    // A BROWSER THAT NEITHER SUCCEEDS NOR FAILS. An IndexedDB open can
    // simply hang - a blocked upgrade, a store the browser is still
    // making its mind up about - and a boot that waits forever is a
    // page that never draws. Two seconds and we take the other road.
    setTimeout(()=>res(null), 2000);
  });
}
function idbDo(mode, fn){
  return idbOpen().then(db=>{
    if(!db) return null;
    return new Promise(res=>{
      let tx;
      try{ tx = db.transaction(KEEP_STORE, mode); }
      catch(e){ return res(null); }
      const out = fn(tx.objectStore(KEEP_STORE));
      tx.oncomplete = ()=>res(out && out.result !== undefined ? out.result : true);
      tx.onerror = tx.onabort = ()=>res(null);
    });
  }).catch(()=>null);
}

async function keepGet(){
  const got = await idbDo("readonly", st=>st.get(KEEP_ROW));
  if(got && typeof got === "object"){ KEEP_HOW = "idb"; return got; }
  // Nothing in IndexedDB is not the same as IndexedDB not working, so
  // the store is asked whether it is there at all before giving up on it.
  const db = await idbOpen();
  if(db){ KEEP_HOW = "idb"; }
  else {
    try{
      const raw = localStorage.getItem(KEEP_DBN);
      KEEP_HOW = "ls";
      if(raw) return JSON.parse(raw);
    }catch(e){ KEEP_HOW = "off"; KEEP_ERR = e.message || String(e); }
  }
  return null;
}
async function keepPut(obj){
  if(KEEP_HOW === "off") return false;
  const ok = await idbDo("readwrite", st=>st.put(obj, KEEP_ROW));
  if(ok){ KEEP_HOW = "idb"; return true; }
  try{
    localStorage.setItem(KEEP_DBN, JSON.stringify(obj));
    KEEP_HOW = "ls"; return true;
  }catch(e){
    // THE ONE THAT ACTUALLY HAPPENS: five megabytes of pictures in
    // localStorage. Said plainly, because the alternative is a bench
    // that looks saved and is not.
    KEEP_HOW = "off";
    KEEP_ERR = /quota|exceed/i.test(e.name + e.message)
      ? "there is more here than this browser will store"
      : (e.message || String(e));
    renderDirty();
    return false;
  }
}
async function keepClear(){
  await idbDo("readwrite", st=>st.delete(KEEP_ROW));
  try{ localStorage.removeItem(KEEP_DBN); }catch(e){}
}

/* ---------------- what a snapshot is ---------------- */
/* The same thing "Save project" writes - one function, so the file
   and the store can never come to mean different things. */
function snapshot(){
  AddonExport.ensure(DB,SEED);
  const { files, ...rest } = DB;
  const orig = {};
  (SEED.rigs||[]).concat(SEED.boxes||[]).concat(SEED.pouches||[])
    .forEach(x=>{ orig[x.id]=1; });
  ["rigs","pouches","boxes"].forEach(k=>{
    rest[k] = (rest[k]||[]).map(x =>
      (x.iconNew || !orig[x.id]) ? x : { ...x, icon: null, iconKept: true });
  });
  return { bench:"zonebench", version:1,
           saved:new Date().toISOString(), ...rest };
}
/* ...and for the store, the mod's own files as well, but ONLY when
   they are newer than the ones this page was built with. See adoptSave
   for why that test is the whole point of it. */
function keepSnapshot(){
  const s = snapshot();
  if(DB.filesFromZip && DB.files) s.files = DB.files;
  return s;
}

/* ---------------- putting one back on ---------------- */
function verBits(v){
  return String(v||"").split("-")[0].split(".").map(n=>parseInt(n,10)||0);
}
/* Is a newer than b? Compared part by part, so 3.2.10 beats 3.2.9 -
   which a string compare gets wrong, and which this project will reach
   eventually. */
function verNewer(a, b){
  const A = verBits(a), B = verBits(b);
  for(let i=0;i<Math.max(A.length,B.length);i++){
    const x = A[i]||0, y = B[i]||0;
    if(x !== y) return x > y;
  }
  return false;
}
/* Everything that has to happen to a saved bench before it is the live
   one. Three callers - the stored copy at boot, a file you open, and
   nothing else - and they were three copies of this until the store
   made it three. */
function upgradeBaselineItems(db, seed) {
  if (db.modVersion === seed.modVersion) return;
  for (const kind of ["rigs", "boxes", "pouches"]) {
    for (const previous of seed.previousDefaults?.[kind] || []) {
      const item = (db[kind] || []).find(x => x.id === previous.id);
      const current = (seed[kind] || []).find(x => x.id === previous.id);
      if (!item || !current || item.new || item.adopt) continue;
      for (const [field, oldValue] of Object.entries(previous.fields)) {
        if (JSON.stringify(item[field]) === JSON.stringify(oldValue))
          item[field] = JSON.parse(JSON.stringify(current[field]));
      }
    }
    for (const id of seed.introducedItems?.[kind] || []) {
      if ((db[kind] || []).some(x => x.id === id) || (db.removed || []).some(x => x.id === id)) continue;
      const current = seed[kind].find(x => x.id === id);
      if (current) (db[kind] ||= []).push(JSON.parse(JSON.stringify(current)));
    }
  }
}
function adoptSave(d, say){
  ZB.validate(d);
  CommunityUpdates.invalidate();
  DB = d; DB.notes = DB.notes || "";

  /* THE MOD'S FILES, AND WHOSE ARE NEWER.
     A save carries none, and a stored bench carries them only if you
     fed it a newer mod than this page was built with. But this page
     gets rebuilt with every mod I send, so the copy baked in here can
     easily be the newer one now - and a stored set from an older zip
     would quietly write an OLD mod over a new one on the next build.
     That is the exact trap the magazine-rounds fix walked into.
     So: the newer of the two wins, and it says which. */
  const mine = SEED.modVersion, theirs = DB.modVersion;
  upgradeBaselineItems(DB, SEED);
  if(true){
    if(DB.files && DB.filesFromZip && say && theirs !== mine)
      say("this page has Squared Away " + mine + "; the copy it remembered was "
          + theirs + " - the newer one is being used");
    for (const kind of ["rigs", "boxes", "pouches"]) {
      for (const item of DB[kind] || []) {
        const old = SEED.previousItemText?.[kind]?.[item.id];
        const current = SEED[kind].find(x => x.id === item.id);
        if (old && current) for (const field of ["name", "descr"])
          if (item[field] === old[field]) item[field] = current[field];
      }
    }
    DB.files = JSON.parse(JSON.stringify(SEED.files));
    DB.craftOrder = SEED.craftOrder;
    DB.modVersion = mine;
    DB.baseline = SEED.baseline;
    DB.engineCommit = SEED.engineCommit;
    DB.filesFromZip = false;
  }

  /* ============================================================
     AND WHAT THE MOD HAS RETIRED GOES WITH IT

     The wallet was taken out of the mod months ago. Every bench that
     has been open since kept it in its list, because this function has
     always refreshed the mod's FILES and never reconciled the LISTS -
     so a container that no longer exists sat there being built into
     every zip, and one of those zips would not start the game. See the
     note in boxSystem: a borrowed section it cannot find is a section
     it used to invent.

     WHAT IS SAFE TO DROP IS NARROW, because this is somebody's work:

       borrowed, and gone from the seed   the game's own section that
                                          this mod no longer touches.
                                          It was never ours to keep.
       ours, not new, not adopted,        a container the mod itself
       and gone from the seed             retired.

     ANYTHING YOU MADE OR ADOPTED IS NEVER TOUCHED, whether or not the
     mod has heard of it - that is the whole point of making one.

     Said out loud, always. Quietly removing something from a list is
     how you find out months later.
     ============================================================ */
  const retired = [];

  /* The container rules are reconciled by wireFamilies, which owns
     that decision because famEdited lives there; it leaves the names
     here to be said with the rest. wireOrders calls it, below. */
  ["rigs","pouches","boxes"].forEach(k=>{
    const have = {};
    (SEED[k]||[]).forEach(x=>{ have[x.id] = 1; });
    DB[k] = (DB[k]||[]).filter(x=>{
      if(have[x.id] || x.new || x.adopt) return true;
      retired.push(x.name || x.id);
      return false;
    });
  });
  // the pictures the save left behind, put back from this page's copy
  const orig = {};
  (SEED.rigs||[]).concat(SEED.boxes||[]).concat(SEED.pouches||[])
    .forEach(x=>{ orig[x.id]=x.icon; });
  ["rigs","pouches","boxes"].forEach(k=>(DB[k]||[]).forEach(x=>{
    if(x.iconKept){ x.icon = orig[x.id] || null; delete x.iconKept; }
  }));

  FAM_RETIRED = [];
  wireOrders();
  FAM_RETIRED.forEach(n => retired.push(n + " (a container rule)"));
  if(retired.length && say)
    say("no longer in the mod, so taken off the list: " + retired.join(", "));

  SEL = { rigs:DB.rigs[0]&&DB.rigs[0].id, boxes:DB.boxes[0]&&DB.boxes[0].id,
          pouches:DB.pouches[0]&&DB.pouches[0].id };
  DIRTY = false;
}

/* ---------------- the autosave itself ---------------- */
/* WRITTEN A MOMENT AFTER YOU STOP, not on every keystroke. Dragging a
   pocket across a grid is thirty touches a second and each one would be
   a megabyte through IndexedDB. */
let KEEP_T = null, KEEP_SAID = "";
function scheduleKeep(){
  clearTimeout(KEEP_T);
  KEEP_SAID = "soon"; renderDirty();
  KEEP_T = setTimeout(flushKeep, 600);
}
let KEEP_BUSY = false, KEEP_AGAIN = false;
async function flushKeep(){
  if(KEEP_BUSY){ KEEP_AGAIN = true; return; }
  KEEP_BUSY = true;
  const ok = await keepPut(keepSnapshot());
  KEEP_BUSY = false;
  KEEP_SAID = ok ? "saved" : "off";
  renderDirty();
  if(KEEP_AGAIN){ KEEP_AGAIN = false; flushKeep(); }
}
// ...AND ONE LAST TIME ON THE WAY OUT, for the case where the tab is
// closed inside those six hundred milliseconds.
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState === "hidden" && KEEP_SAID === "soon"){
    clearTimeout(KEEP_T); flushKeep();
  }
});

function fresh(){
  CommunityUpdates.invalidate();
  DB = JSON.parse(JSON.stringify(SEED));
  DB.notes = DB.notes || "";
  DB.filesFromZip = false;
  wireOrders();
  SEL = {rigs:DB.rigs[0]&&DB.rigs[0].id, boxes:DB.boxes[0]&&DB.boxes[0].id,
         pouches:DB.pouches[0]&&DB.pouches[0].id};
  DIRTY = false;
}
/* THE PAGE OPENS ON WHAT YOU LEFT. Nothing to pick, nothing to feed
   it - and if there is nothing stored, or the store is unavailable,
   the shipped bench, exactly as before. */
async function boot(){
  fresh(); Workbench.setDefaults(DB);
  let kept = null;
  try{ kept = await keepGet(); }catch(e){ KEEP_HOW = "off"; KEEP_ERR = String(e); }
  let note = "";
  if(kept && kept.bench === "zonebench"){
    try{ adoptSave(kept, m=>{ note = m; }); KEEP_SAID = "saved"; }
    catch(e){
      // A STORED BENCH THAT WILL NOT LOAD MUST NOT BE A PAGE THAT WILL
      // NOT OPEN. Better the shipped one and a sentence about it.
      fresh(); note = "what was stored could not be read - starting from the "
        + "shipped bench (" + (e.message || e) + ")";
    }
  } else fresh();
  AddonExport.ensure(DB,SEED); await flushKeep();
  render(); Workbench.init(); CommunityUpdates.start();
  if(note) setTimeout(()=>alert(note), 60);
}
function touch(){ AddonExport.ensure(DB,SEED); Workbench.record(document.activeElement); DIRTY = true; renderDirty(); scheduleKeep(); }
/* WHAT THE CORNER SAYS. It used to say "unsaved changes", which was
   the whole truth when the only memory was a file you pressed a button
   for. Now it is about the store: kept, keeping, or not keeping and
   why. */
function renderDirty(){
  const d=$("#dirty");
  if(KEEP_SAID === "off" || KEEP_HOW === "off"){
    d.textContent = "not being kept" + (KEEP_ERR ? " \u2014 " + KEEP_ERR : "");
    d.className = "on"; d.title = "Use Save project; this browser will not "
      + "store the bench."; return;
  }
  if(KEEP_SAID === "soon"){ d.textContent = "keeping\u2026"; d.className = "on";
    d.title = ""; return; }
  if(KEEP_SAID === "saved"){ d.textContent = "kept in this browser";
    d.className = ""; d.title = "Everything here is written back as you work. "
      + "Save project still writes a file you can send or keep."; return; }
  d.textContent = ""; d.className = ""; d.title = "";
}
const cur = () => (DB[TAB]||[]).find(x=>x.id===SEL[TAB]);
/* A pouch this mod owns, as against the magazine mod's three. Everything
   the bench may write about a pouch hangs off this one question. */
const ourPouch = p => !!p && !p.adopt
  && ["af_magpouch_s","af_magpouch_m","af_magpouch_l"].indexOf(p.id) < 0;

/* The orders the generated files were written in. Read out of the
   files themselves rather than decided here, so a build keeps the
   shape of the file it is replacing and a diff stays readable. */
function wireOrders(){
  const F=DB.files||{};
  EMIT.craftOrder = DB.craftOrder || SEED.craftOrder || [];
  const sc = F["scripts/zzz_armor_mag_pouches.script"] || "";
  EMIT.rigOrder = SEED.rigs.map(r=>r.id);
  wireFamilies(F);
  wirePacks(F);
}

/* THE RULES, READ OUT OF THE FILE - AND YOUR EDITS KEPT.
   Three things arrive here: a fresh start, a save being opened, and a
   newer copy of the mod. The first two are easy. The third is not: the
   new mod may describe a rule this bench has never seen, and the save
   may hold a rule of yours the mod has never seen, and either one
   quietly winning would lose work.

   So the file is the truth about every rule EXCEPT the ones you
   actually changed. Those are remembered by name, because a rule you
   edited is a decision and a rule you did not is just the mod's. */
function wireFamilies(F){
  const read = EMIT.readFamilies(F[RULES_PATH] || "");
  const mine = DB.families || {};
  DB.famEdited = DB.famEdited || {};
  const out = {};
  Object.keys(read).forEach(n=>{ out[n] = read[n]; });
  Object.keys(mine).forEach(n=>{
    /* KEPT BECAUSE YOU TOUCHED IT, and for no other reason.
       This used to keep anything the file had not got, on the grounds
       that it might be a rule of yours - and could not tell one of
       yours from one the mod had RETIRED. So the wallet's patch rule
       rode along in every bench that had ever seen it, exactly as the
       wallet did, and a build wrote it back into the mod: twelve patch
       sections named by a rule no container points at.

       famEdited is what tells them apart and always was. Making a rule
       marks it; so does changing one. A rule you have never touched is
       the mod's to add and the mod's to drop. */
    if(DB.famEdited[n]) out[n] = mine[n];
    else if(!read[n]) FAM_RETIRED.push(n);
  });
  DB.families = out;
}
let FAM_RETIRED = [];
const famNames = () => Object.keys(DB.families||{})
  .filter(n=>n!=="medpocket").sort();
/* KEY BY KEY, NOT STRINGIFIED. These objects are built in two orders -
   one read out of the file, one made by the "new rule" button - and
   JSON.stringify compares the order as well as the contents, which is
   how two identical rules came out different once. */
function famSame(a,b){
  const list = k => (a[k]||[]).join(",") === (b[k]||[]).join(",");
  const flag = k => !!a[k] === !!b[k];
  const say  = x => String(x==null?"":x);
  return ["kinds","also","never"].every(list)
      && ["ammo","mags","guns","rigs"].every(flag)
      && say(a.no) === say(b.no);
}
// A RULE YOU TOUCHED SURVIVES A MOD UPDATE. One that you did not is
// the mod's to change.
function famTouch(name){ DB.famEdited[name]=true; touch(); }
function famOf(it){ return (DB.families||{})[it.takes]; }

/* ==========================================================
   CHROME
   ========================================================== */
/* TWO TABS FEWER. The item editor is gone by request; the inventory
   layout editor is gone for the reason written where its code used to
   be. The marker below stays, with nothing to put in it, so that mk.py
   still has something to assert on - see mk.py. */
const TABS = [["rigs","Rigs"],["pouches","Pouches"],["boxes","Containers"],
              ["packs","Backpacks"],
              
              ["drops","Drops"],["changes","Changes"],["check","Check"],
              ["catalog","Public add-ons"], ["account","Account"], ["share","Share items"], ["build","Export mod"],
              ["help","How this works"]];
function render(){
  if(window.EditorLibrary?.isFocused(TAB))EditorLibrary.resolve();
  Workbench.record();
  Site.shell();
  const listy = ["rigs","pouches","boxes","packs","items"].includes(TAB)&&!window.EditorLibrary?.isFocused(TAB);
  document.body.classList.toggle("wide", !listy);
  if(listy) renderList(); else $("#list").innerHTML="";
  renderPane();
  renderDirty();
}

function renderList(){
  if(window.EditorLibrary?.isFocused(TAB)){document.querySelector("#list").replaceChildren();return;}
  const L=$("#list"); L.innerHTML="";
  const items = DB[TAB]||[];
  const groups = TAB==="boxes"
    ? [["", items]]
    : [[ "", items ]];
  for(const [head,arr] of groups){
    if(head) L.appendChild(el("div","grouphead",head));
    for(const it of arr){
      const r=el("div","row"+(it.id===SEL[TAB]?" on":"")
        +(it.new&&!it.adopt?" isnew":"")+(it.adopt?" isadopt":""));
      const ic=el("div","ic");
      if(it.icon){ const i=new Image(); i.src=it.icon; ic.appendChild(i); }
      else ic.appendChild(el("span",null,"&#9634;"));
      const tx=el("div","tx");
      tx.appendChild(el("div","nm",esc(it.name||it.id)));
      let sub;
      if(TAB==="rigs") sub = cellsOf(it.slots)+" cells &middot; "+fmt(it.cost)+" RU";
      else if(TAB==="boxes") sub = it.borrowed ? "the game's own"
        : it.inw+"&times;"+it.inh+" inside &middot; "+fmt(it.cost)+" RU";
      else if(TAB==="packs"){
        const z = EMIT.packSize(it.size);
        sub = (z ? z.cells + " squares inside" : "the default size")
          + (it.own && it.own.look ? " &middot; its own picture" : "");
      }
      else if(TAB==="items"){
        const on = Object.keys(it.own||{}).filter(k=>it.own[k]);
        sub = it.newItem ? "a new item"
          : (on.length ? on.length + " thing" + (on.length>1?"s":"") + " taken over"
                       : "nothing taken over yet");
      }
      else sub = "tier "+it.tier+" &middot; "+fmt(it.cost)+" RU";
      tx.appendChild(el("div","sub",sub));
      r.appendChild(ic); r.appendChild(tx);
      r.onclick=()=>{SEL[TAB]=it.id;render();};
      L.appendChild(r);
    }
  }
  const back=el("button","addbtn","← Editor home");
  back.onclick=()=>Site.go('editor');L.appendChild(back);
  EditorView.list(L); Workbench.markRows();
}
function fmt(n){ return String(n==null?0:n).replace(/\B(?=(\d{3})+(?!\d))/g,","); }

function renderPane(){
  window.ZonebenchPages?.clear();
  const P=$("#pane"); if(P._previewPaint){P.removeEventListener("input",P._previewPaint);P.removeEventListener("change",P._previewPaint);P._previewPaint=null;} P.innerHTML="";
  if(window.Introduction)Introduction.cleanup();
  P.classList.remove("site-content","item-editor","patch-notes-page");
  if(window.ZonebenchPages?.render(P,TAB))return;
  if(TAB==="patchnotes")return PatchNotes.render(P);
  if(TAB==="home")return Site.home(P);
  if(TAB==="introduction")return Introduction.render(P);
  if(TAB==="downloads")return Site.downloads(P);
  TITLE_NODE = IDCHIP_NODE = null; IDECHO = []; ICOPAINT = [];
  if(TAB==="account") return drawCommunityAccount(P);
  if(TAB==="catalog") return drawCatalog(P);
  if(TAB==="drops") return drawDrops(P);
  if(TAB==="check") return drawCheck(P);
  if(TAB==="changes") return Workbench.changes(P);
  if(TAB==="share") return drawShare(P);
  if(TAB==="build") return drawBuild(P);
  if(TAB==="addonexport") return AddonExport.render(P,DB,SEED,async()=>{touch();await flushKeep();},drawLegacyBuild);
  if(TAB==="help") return Site.help(P);
  const it=cur();
  if(!it&&window.EditorLibrary?.isFocused(TAB)){const back=el("button","tool","← Return to item library");back.onclick=()=>EditorLibrary.choose(EditorLibrary.scope);P.append(el("h1",null,"This item is no longer in your project."),back);return;}
  if(!it){
    /* THE BACKPACKS PAGE HAS SOMETHING TO SAY WITH NO PACK SELECTED -
       what every pack nobody has listed is - so an empty list is not an
       empty page there. */
    if(TAB==="packs"){ P.appendChild(el("h1",null,"Backpacks"));
      P.appendChild(el("div","hint",
        "Every backpack has a size of its own: this one is ten tall and "
        + "seven across, that one is something else. Add one on the left to "
        + "give it a size, a picture, a price, a recipe."));
      return drawPacksExtra(P); }
    P.appendChild(el("div","welcome","<h2>Nothing here yet</h2>"
      +"<p>Use the button at the bottom of the list to add one.</p>")); return; }
  if(TAB==="rigs") drawRig(P,it);
  else if(TAB==="boxes") drawBox(P,it);
  else if(TAB==="packs" || TAB==="items") drawItemPage(P,it);
  else drawPouch(P,it);
  if(TAB==="rigs" || TAB==="boxes") drawModel(P,it);
  EditorView.organize(P,it); Workbench.itemTools(P,it); EditorView.focused?.(P,it);
}

/* small field builders --------------------------------------------- */
function field(parent, label, hint, node){
  const l=el("label","f"); l.dataset.fieldLabel=label;
  l.appendChild(el("span",null, esc(label)+(hint?' <em>'+esc(hint)+'</em>':"")));
  l.appendChild(node); parent.appendChild(l); return node;
}
/* The heading and the id chip, kept in step with the fields under them
   WITHOUT redrawing the pane - which would take the cursor out of the
   box being typed in. Set when a page draws its heading; cleared by the
   next render. */
let TITLE_NODE = null, IDCHIP_NODE = null, IDECHO = [];
// The icon wells drawn on this pane, so a nudge can repaint them
// without a renderPane that would take the cursor out of a field.
let ICOPAINT = [];
function retitle(it){
  if(TITLE_NODE) TITLE_NODE.textContent = it.name || it.id || "(no id yet)";
  if(IDCHIP_NODE) IDCHIP_NODE.textContent = it.id || "(no id yet)";
  /* ANYTHING ELSE ON THE PAGE THAT SPELLS THE ID. The recipe preview
     writes the line the build will write, which is worth nothing if it
     still says `x_amppouch_new` while you are typing a name for it -
     and renderPane would take the cursor out of the box mid-word. */
  IDECHO.forEach(fn => fn(it));
}
function heading(P, it, tail){
  TITLE_NODE = el("h1",null,esc(it.name||it.id||"(no id yet)"));
  P.appendChild(TITLE_NODE);
  const h = el("div","hint");
  IDCHIP_NODE = document.createElement("code");
  IDCHIP_NODE.textContent = it.id || "(no id yet)";
  h.appendChild(IDCHIP_NODE);
  if(tail) h.appendChild(document.createTextNode(" " + tail));
  P.appendChild(h);
}

function txt(obj,key,opts){
  const i=document.createElement(opts&&opts.area?"textarea":"input");
  if(!opts||!opts.area) i.type="text";
  i.value = obj[key]==null?"":obj[key];
  if(opts&&opts.disabled) i.disabled=true;
  i.oninput=()=>{
    obj[key]=i.value; touch();
    /* THE SELECTION IS BY ID, so changing the id orphans it. Typing a
       section name into a new item made the whole editor vanish
       mid-word - `cur()` looked for an id nothing had any more and the
       pane redrew as "nothing here yet". Found by a test that could
       not click a field it had just been looking at. */
    if(opts&&opts.isid) SEL[TAB]=i.value;
    if(opts&&opts.title) retitle(obj);
    if(opts&&opts.live) renderList();
  };
  return i;
}
function num(obj,key,opts){
  const i=document.createElement("input"); i.type="number";
  const o=opts||{};
  if(o.min!=null)i.min=o.min; if(o.max!=null)i.max=o.max;
  if(o.step!=null)i.step=o.step;
  i.value = obj[key]==null?"":obj[key];
  if(o.disabled) i.disabled=true;
  i.oninput=()=>{
    let v = i.value==="" ? null : Number(i.value);
    if(v!=null && o.int) v=Math.round(v);
    if(v!=null && o.min!=null && v<o.min) v=o.min;
    obj[key]=v; touch();
    // NOT A REDRAW. Re-rendering the pane while somebody is typing in
    // it takes the cursor away mid-number, so a field that only needs
    // to update a line of advice updates that line and nothing else.
    if(o.after) o.after();
    if(o.redraw) renderPane(); else if(o.live) renderList();
  };
  return i;
}
/* A NUMBER THAT REDRAWS THE PAGE CANNOT BE TYPED INTO.
   Seven fields here change the shape of what is on screen - the width
   of the pocket grid, the size of a container - so they redrew the pane
   as you typed, which destroyed the very input you were typing in after
   the first keystroke. The field looked ordinary and could not be used.

   So: buttons commit at once, and the box itself commits on CHANGE -
   blur or Enter - never on every keystroke. */
function stepper(obj,key,opts){
  const o=opts||{}, lo=o.min==null?0:o.min, hi=o.max==null?999:o.max;
  const wrap=el("div","stepper");
  const dec=el("button",null,"&minus;"), inc=el("button",null,"+");
  const i=document.createElement("input"); i.type="text"; i.inputMode="numeric";
  i.value = obj[key]==null?"":obj[key];
  const commit=v=>{
    v=Math.round(Number(v));
    if(!isFinite(v)) v=obj[key]||lo;
    v=Math.max(lo,Math.min(hi,v));
    if(v===obj[key]){ i.value=v; return; }
    obj[key]=v; touch();
    if(o.before) o.before();
    if(o.redraw) renderPane(); else { i.value=v; if(o.live) renderList(); }
  };
  dec.onclick=()=>commit((obj[key]||0)-1);
  inc.onclick=()=>commit((obj[key]||0)+1);
  i.onchange=()=>commit(i.value);
  i.onkeydown=e=>{
    if(e.key==="Enter"){ e.preventDefault(); i.blur(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); commit((obj[key]||0)+1); }
    else if(e.key==="ArrowDown"){ e.preventDefault(); commit((obj[key]||0)-1); }
  };
  wrap.appendChild(dec); wrap.appendChild(i); wrap.appendChild(inc);
  return wrap;
}

function pick(obj,key,list,opts){
  const s=document.createElement("select");
  for(const v of list){
    const o=document.createElement("option");
    if(Array.isArray(v)){ o.value=v[0]; o.textContent=v[1]; }
    else { o.value=v; o.textContent=v; }
    s.appendChild(o);
  }
  s.value=obj[key];
  s.onchange=()=>{ obj[key] = isNaN(s.value)||s.value===""?s.value:
    (opts&&opts.str?s.value:Number(s.value)); touch();
    if(opts&&opts.redraw) renderPane(); else renderList(); };
  return s;
}

/* HOW FAR TO TAKE AN ADOPTED ITEM OVER.
   Nothing by default. Each tick is a field of theirs this mod
   overwrites, so it is a decision rather than a setting, and the card
   says what each one actually does. */
const TAKEOVER = [
  ["name",  "Its name and description",
   "Replaces theirs with what you write here, in all four languages."],
  ["price", "Its price and weight",
   "Replaces theirs. Use it to slot the thing into this mod's price ladder."],
  ["drops", "Where it turns up",
   "Puts it in this mod's stash pool, on corpses, and in the drop roll at the "
   + "tier you set. Leave it off if the other mod already places it &mdash; "
   + "both would make it twice as common."],
  ["craft", "What it costs to build",
   "Gives it a recipe in this mod's workshop. A rig's is worked out from its "
   + "pockets; a pouch's is yours to write."],
  ["repair", "How it is mended, and what it is made of",
   "Gives it this mod's repair type, the bar on its icon, and a list of "
   + "components the workbench can swap &mdash; which is what puts the parts "
   + "dots on it and is the other way to mend a rig. Rigs only."],
  ["shelves", "Who sells it",
   "Puts it on the trader shelves this mod writes."]
];
function takeover(P, it){
  it.own = it.own || {};
  P.appendChild(el("div","sect","How far this mod takes it over"));
  const c=el("div","card");
  c.appendChild(el("div","hint",
    "Nothing, unless you say so. Every tick here overwrites something the "
    + "other mod decided, so they are all off to begin with."));
  TAKEOVER.forEach(([key,label,why])=>{
    if(it.adaptationId){
      if(key==='drops' && TAB==='boxes')return;
      if(key==='craft' && TAB==='boxes')return;
      if(key==='repair' && TAB!=='rigs')return;
      if(key==='drops'){label='Include in Squared Away NPC drops';why='Uses the existing rank and tier settings. Adds this item to the rig or pouch pool; does not change global chances.';}
    }

    /* A CONTAINER STILL HAS NO RECIPE. Rigs derive one from their
       pockets and pouches have an editor of their own; a container is
       neither, so the tick would open a card that does not exist. */
    if(key==="craft" && !it.slots && !it.grants) return;
    if(key==="repair" && !it.slots) return;     // a repair type is a rig's
    const on = !!it.own[key];
    const row=el("label","tick");
    row.style.alignItems="flex-start";
    row.innerHTML='<input type="checkbox"'+(on?" checked":"")+'>'
      +'<span>'+esc(label)+'<br><span style="color:var(--faint);font-size:11px">'
      +why+'</span></span>';
    row.querySelector("input").onchange=e=>{
      it.own[key]=e.target.checked; touch(); renderPane(); };
    c.appendChild(row);
  });
  P.appendChild(c);
}

/* WHO STOCKS IT. A container of ours has always had this; an adopted
   item of any kind can have it too, once it has been told to. */
function shelfCard(P, it){
  P.appendChild(el("div","sect","Who sells it"));
  const c4=el("div","card");
  it.shelves = it.shelves || {};
  for(const [key,label] of SHELVES){
    const on = it.shelves[key];
    const line=el("div"); line.style.display="flex";
    line.style.alignItems="center"; line.style.gap="12px";
    line.style.marginBottom="8px";
    const tk=el("label","tick"); tk.style.margin="0"; tk.style.width="240px";
    tk.innerHTML='<input type="checkbox"'+(on?" checked":"")+'><span>'+esc(label)+'</span>';
    tk.querySelector("input").onchange=e=>{
      if(e.target.checked) it.shelves[key]={count:1,chance:30};
      else delete it.shelves[key];
      touch(); renderPane(); };
    line.appendChild(tk);
    if(on){
      const a=num(on,"count",{min:1,max:9,int:true}); a.style.width="70px";
      const b=num(on,"chance",{min:1,max:100,int:true}); b.style.width="70px";
      const w1=el("span",null,"how many: "); w1.style.color="var(--faint)";
      const w2=el("span",null,"chance %: "); w2.style.color="var(--faint)";
      w2.style.marginLeft="10px";
      line.appendChild(w1); line.appendChild(a);
      line.appendChild(w2); line.appendChild(b);
    }
    c4.appendChild(line);
  }
  if(!Object.keys(it.shelves).length)
    c4.appendChild(el("div","hint","Nobody stocks it &mdash; it will only be found."));
  P.appendChild(c4);
}

/* WHAT AN ADOPTED ITEM IS, said once. */
function adoptNote(P, it, one){
  if(it.adaptationId){const n=el('div','note');n.textContent='This compatibility patch changes the installed section '+it.id+'. It keeps its artwork and model. Name, price, repair, crafting and trader changes are optional in Advanced settings. The source item must exist; a missing source can stop the game loading. Converted rigs and containers need newly spawned items for testing because their engine class changes.';P.appendChild(n);return;}

  /* WHAT IT SAYS HAS TO FOLLOW WHAT IS TICKED. This used to promise
     that their name and price stayed theirs, which stopped being true
     the moment the take-over card grew - and a notice that contradicts
     the switches under it is worse than none. */
  const own = it.own || {};
  const kept = [], taken = [];
  (own.name ? taken : kept).push("name and description");
  (own.price ? taken : kept).push("price and weight");
  kept.push("picture");
  const n=el("div","note");
  n.innerHTML = "This is <b>somebody else's " + esc(one) + "</b>. The build does "
    + "not create it &mdash; it adds this mod's keys to the section that mod "
    + "already defines, as an override.<br><br>"
    /* IT STOPS DOING WHAT IT USED TO DO. Another pack's rigs and
       pouches install onto the armour, and one adopted here would have
       gone on working that way as well - two ways to wear the thing
       and only one of them granting any pockets. That route is closed
       for every adopted item, always, which is what makes "a new item
       that happens to share an id" true rather than nearly true. */
    + "<b>Its old use is closed.</b> Whatever right-click did before &mdash; "
    + "bolting it onto an armour, most likely &mdash; does nothing now. Here it "
    + "is a " + esc(one) + " of this mod's, wearing their name and their "
    + "picture.<br><br>"
    + "<b>Theirs, untouched:</b> its " + kept.join(", ") + "."
    + (taken.length ? " <b>Yours:</b> its " + taken.join(", ") + "." : "")
    + " Everything else is on the card below.<br><br>"
    + "Type the section id exactly as that mod writes it. If it is wrong the "
    + "keys land on nothing and you will simply not notice, which makes it the "
    + "one field here worth checking twice.";
  P.appendChild(n);
}

/* HOW MUCH ROOM IT TAKES IN THE BAG.
   The same two numbers on all three pages, because it is the same
   question - and the little block of squares under them is what makes
   "2 by 3" mean something without going and looking. */
function bagSize(parent, it){
  const footprint=el("div","bag-size-settings");parent.appendChild(footprint);parent=footprint;
  const g=el("div","grid2");
  field(g,"Cells wide","in the bag",stepper(it,"cellw",{min:1,max:8,redraw:true}));
  field(g,"Cells tall","in the bag",stepper(it,"cellh",{min:1,max:8,redraw:true}));
  parent.appendChild(g);
  const w=Math.max(1,Math.min(8,it.cellw||2)), h=Math.max(1,Math.min(8,it.cellh||2));
  const bg=el("div","bgrid outer");
  bg.style.gridTemplateColumns="repeat("+w+",15px)";
  for(let i=0;i<w*h;i++) bg.appendChild(el("i"));
  const wrap=el("div"); wrap.style.marginTop="6px"; wrap.appendChild(bg);
  parent.appendChild(wrap);
  const aspect = (w/h).toFixed(2), art = (2/3).toFixed(2);
  parent.appendChild(el("div","hint",
    "The room it takes up in your bag. <b>These numbers decide the size, not "
    +"your picture</b> &mdash; the picture is fitted inside the shape and "
    +"centred. So a tall drawing in a wide slot sits in the middle with empty "
    +"space either side, and the fix for that is a drawing cut to the new "
    +"shape rather than a different number here."));
}

/* the icon well ---------------------------------------------------- */
function iconWell(it, caption){
  const box=el("div","iconbox");
  const d=el("div","drop");
  /* WHAT THE GAME WILL SHOW, not what the file looks like.
     The well used to display the PNG as a picture in a box, which says
     nothing about the thing that actually matters: how it sits in the
     cells the item takes. It is drawn onto a grid of those cells now,
     at exactly the size and place the sheet will put it - the same
     function, BUILD.fitRect, does both. */
  const paint=()=>{
    d.innerHTML="";
    if(!it.icon){
      d.appendChild(el("div","ph","drop a PNG here<br>or click to pick one"));
      return;
    }
    d.appendChild(fitPreview(it, 146, 156));
  };
  paint();
  ICOPAINT.push(paint);
  const take=file=>{
    if(!file || !/^image\//.test(file.type)) return;
    const fr=new FileReader();
    fr.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        // KEPT SMALL ON PURPOSE. The save file travels through a chat
        // window; a folder of full-size renders would not.
        const k=Math.min(1, 320/Math.max(img.width,img.height));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.width*k));
        c.height=Math.max(1,Math.round(img.height*k));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        it.icon=c.toDataURL("image/png");
        it.iconNew=true;
        /* GIVING IT A PICTURE IS TICKING THE BOX. On an adopted item
           nothing about its look is written until `look` is on, and an
           item with a picture nobody asked to use is a picture that
           silently does nothing. */
        if(it.adopt){
          it.own = it.own || {};
          if(!it.own.look){
            it.own.look = true;
            if(typeof packMark === "function" && isPackTab()) packMark(it);
          }
        }
        touch(); paint(); renderList(); renderPane();
      };
      img.src=fr.result;
    };
    fr.readAsDataURL(file);
  };
  // ONE HANDLER, SET ONCE. The picker used to get its handler at click
  // time, so an image arriving at the input any other way was dropped
  // on the floor - including every test that tried to set one.
  d.onclick=()=>{ const f=$("#imgIn"); f.value=""; PENDING_ICON=take; f.click(); };
  d.ondragover=e=>{e.preventDefault();d.classList.add("over");};
  d.ondragleave=()=>d.classList.remove("over");
  d.ondrop=e=>{e.preventDefault();d.classList.remove("over");
    take(e.dataTransfer.files[0]);};
  box.appendChild(d);
  const cap=el("div","cap", esc(caption||""));
  if(it.icon){
    const a=el("a",null,"remove");
    a.onclick=()=>{it.icon=null;it.iconNew=true;touch();renderPane();renderList();};
    cap.appendChild(document.createElement("br")); cap.appendChild(a);
  }
  box.appendChild(cap);
  if(it.icon) box.appendChild(fitControls(it));
  return box;
}

/* ==========================================================
   HOW THE PICTURE SITS IN ITS CELLS

     "the texture is taken as is and not scaled to better much how much
      grid cells the item takes, so add option so icon can be resized
      in the ZoneBench with visual how it will look in game kinda. like
      add grid behind the texture user uploads and add options to size
      it up and down."

   Exactly that. The drawing is laid on a grid of the item's own cells,
   at the size and place the sheet will actually put it, and there are
   handles to change it.

   THE NUMBERS ARE RELATIVE, not pixels: a zoom about the centre and a
   nudge as a fraction of the rectangle. So they go on meaning the same
   thing when you make the item a cell wider, and they do not depend on
   how big the PNG happens to be.

   1, 0, 0 is what it always did - fitted whole and centred - so
   everything that has never been touched is untouched.
   ========================================================== */
function fitOf(it){
  it.fit = it.fit || { zoom: 1, dx: 0, dy: 0 };
  return it.fit;
}
function fitIsDefault(f){
  return !f || (Math.abs((f.zoom==null?1:f.zoom) - 1) < 1e-6
    && Math.abs(f.dx || 0) < 1e-6 && Math.abs(f.dy || 0) < 1e-6);
}
/* One canvas, drawn the way the sheet draws it, over the cells the
   item takes. maxw/maxh are only how much room the page has for it. */
function fitPreview(it, maxw, maxh){
  const cw = Math.max(1, it.cellw || 2), ch = Math.max(1, it.cellh || 2);
  const S = Math.max(12, Math.min(maxw / cw, maxh / ch));
  const W = Math.round(cw * S), H = Math.round(ch * S);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.style.cssText = "display:block;margin:0 auto;image-rendering:auto";
  const cx = cv.getContext("2d");

  const draw = im => {
    cx.clearRect(0,0,W,H);
    // Draw the guides first so the item texture stays unobstructed.
    cx.fillStyle = "#0e1013"; cx.fillRect(0,0,W,H);
    // Interior guides are quiet; the complete outer frame stays inside the canvas.
    cx.strokeStyle = "rgba(160,174,184,0.25)";
    cx.lineWidth = 1;
    for(let i=1;i<cw;i++){ const x=Math.round(i*W/cw)+0.5;
      cx.beginPath(); cx.moveTo(x,0); cx.lineTo(x,H); cx.stroke(); }
    for(let j=1;j<ch;j++){ const y=Math.round(j*H/ch)+0.5;
      cx.beginPath(); cx.moveTo(0,y); cx.lineTo(W,y); cx.stroke(); }
    cx.strokeStyle = "#75818a";
    cx.strokeRect(0.5,0.5,W-1,H-1);
    if(im){
      const f = BUILD.fitRect(im.width, im.height, W, H, it.fit);
      cx.save(); cx.beginPath(); cx.rect(0,0,W,H); cx.clip();
      cx.drawImage(im, f.x, f.y, f.w, f.h);
      cx.restore();
    }
  };
  const im = new Image();
  im.onload = ()=>draw(im);
  im.onerror = ()=>draw(null);
  im.src = it.icon;
  return cv;
}
/* The handles. Under the well rather than beside it, because the well
   is 150px wide and this is the thing you look at while you use them. */
function fitControls(it){
  const f = fitOf(it);
  const wrap = el("div","fitbox");
  /* THE NUMBER IS PART OF THE PICTURE. It was only written when the
     card was built and by Fit and Fill, so the two buttons people
     actually use moved the art and left the label saying 100%. */
  const repaint = ()=>{ say(); touch(); ICOPAINT.forEach(fn=>fn()); renderList(); };
  const bump = (k, by, lo, hi)=>{
    let v = (f[k] == null ? (k==="zoom"?1:0) : f[k]) + by;
    v = Math.max(lo, Math.min(hi, Math.round(v*1000)/1000));
    f[k] = v; repaint();
  };
  const row = el("div","fitrow");
  const b = (label, title, fn)=>{
    const x = el("button","tool", label);
    x.title = title; x.onclick = fn; row.appendChild(x); return x;
  };
  b("&minus;", "smaller", ()=>bump("zoom", -0.05, 0.1, 6));
  const pct = el("span","fitpct");
  const say = ()=>{ pct.textContent = Math.round(((f.zoom==null?1:f.zoom))*100) + "%"; };
  row.appendChild(pct);
  b("+", "bigger", ()=>bump("zoom", 0.05, 0.1, 6));
  wrap.appendChild(row);

  const row2 = el("div","fitrow");
  const b2 = (label, title, fn)=>{
    const x = el("button","tool", label); x.title = title; x.onclick = fn;
    row2.appendChild(x);
  };
  b2("&#9664;", "left",  ()=>bump("dx", -0.02, -2, 2));
  b2("&#9650;", "up",    ()=>bump("dy", -0.02, -2, 2));
  b2("&#9660;", "down",  ()=>bump("dy",  0.02, -2, 2));
  b2("&#9654;", "right", ()=>bump("dx",  0.02, -2, 2));
  wrap.appendChild(row2);

  const row3 = el("div","fitrow");
  const fit = el("button","tool","Fit");
  fit.title = "the whole picture inside the cells, centred - what it "
    + "does with nothing set";
  fit.onclick = ()=>{ f.zoom = 1; f.dx = 0; f.dy = 0; say(); repaint(); };
  row3.appendChild(fit);
  /* FILL IS THE ONE PEOPLE ACTUALLY WANT. A square drawing on a 2 x 3
     rig fits at two thirds of the height and leaves a third of the
     cells empty; filling means the short side reaches the edges and
     the long side is trimmed. */
  const fill = el("button","tool","Fill");
  fill.title = "big enough to reach every edge - the overflow is trimmed";
  fill.onclick = ()=>{
    const im = new Image();
    im.onload = ()=>{
      const cw = Math.max(1, it.cellw||2), ch = Math.max(1, it.cellh||2);
      const k1 = Math.min(cw/im.width, ch/im.height);
      const k2 = Math.max(cw/im.width, ch/im.height);
      f.zoom = Math.round((k2/k1)*1000)/1000; f.dx = 0; f.dy = 0;
      say(); repaint();
    };
    im.src = it.icon;
  };
  row3.appendChild(fill);
  wrap.appendChild(row3);
  say();
  return wrap;
}

/* ==========================================================
   RIG EDITOR
   ========================================================== */
function drawRig(P,it){
  heading(P, it, it.adopt ? "\u2014 adopted from another mod" : "");
  if(it.adopt) adoptNote(P, it, "rig");

  P.appendChild(el("div","sect","What it is"));
  const top=el("div","cards");
  const c1=el("div","card"); c1.style.display="flex"; c1.style.gap="18px";
  if(!it.adopt)
    c1.appendChild(iconWell(it,(it.cellw||2)+" x "+(it.cellh||3)+" cells in the bag"));
  const f=el("div"); f.style.flex="1";
  field(f, (it.adopt && !EMIT.owns(it,"name")) ? "What you call it here" : "Name",
        (it.adopt && !EMIT.owns(it,"name"))
          ? "a label for this list \u2014 the game keeps their name" : null,
        txt(it,"name",{live:true,title:true}));
  field(f,"Section id",
        it.adopt ? "exactly as the other mod writes it"
                 : it.new ? "letters, digits and _ only" : "cannot change - saves refer to it",
        txt(it,"id",{disabled:!it.new,live:true,isid:true,title:true}));
  if(!it.adopt || EMIT.owns(it,"name"))
    field(f,"Description","shown in the tooltip",txt(it,"descr",{area:true}));
  c1.appendChild(f); top.appendChild(c1);

  const derived=tierOf(it.slots);
  const c2=el("div","card"); c2.dataset.settingsGroup="economy"; c2.style.maxWidth="270px";
  const w=worthOf(it.slots);
  const advice=el("div","hint");
  const sayPrice=()=>{
    // NOTHING TO SAY YET. A rig with no pockets is worth nothing, and
    // "expects a price between 0 and 0" is a complaint about a rig
    // nobody has finished drawing.
    if(!w){ advice.className="hint";
      advice.innerHTML="Draw its pockets below and this will say what it "
        +"ought to cost."; return; }
    const lo=Math.round(w*LO_RU/50)*50, hi=Math.round(w*HI_RU/50)*50;
    const per=w?Math.round((it.cost||0)/w):0;
    const inband = w>0 && it.cost>=w*LO_RU && it.cost<=w*HI_RU;
    advice.className = inband ? "hint" : "warn";
    advice.innerHTML = "It holds "+w.toFixed(1)+" points, so the mod expects a "
      +"price between <b>"+fmt(lo)+"</b> and <b>"+fmt(hi)+"</b> RU. Yours is "
      +per+" per point"
      +(inband ? "." : " &mdash; outside the band, and the build will say so.");
  };
  const g=el("div","grid2");
  if(!it.adopt || EMIT.owns(it,"price")){
    field(g,"Weight","kg",num(it,"weight",{min:0,step:0.1}));
    field(g,"Price","RU",num(it,"cost",{min:0,step:50,int:true,live:true,after:sayPrice}));
  }
  c2.appendChild(g);
  c2.appendChild(el("div","hint",
    "Tier <b>"+derived+"</b>, worked out from the pockets &mdash; "+esc(stashOf(derived))
    +". The drop chances for that tier are on the Drops page."));
  if(!it.adopt){ sayPrice(); c2.appendChild(advice); bagSize(c2, it); }
  else if(EMIT.owns(it,"price")){ sayPrice(); c2.appendChild(advice); }
  top.appendChild(c2);
  P.appendChild(top);

  P.appendChild(el("div","sect","The pockets"));
  drawPocketEditor(P,it);

  if(it.adopt){
    takeover(P, it);
    if(EMIT.owns(it,"repair")){ drawRepair(P, it); partsCard(P, it); }
    if(EMIT.owns(it,"craft")) drawCraft(P, it);
    if(EMIT.owns(it,"drops")){ P.appendChild(el("div","sect","Where it turns up"));
      P.appendChild(dropCard(it, tierOf(it.slots))); }
    if(EMIT.owns(it,"shelves")) shelfCard(P, it);
    const del=el("button","danger","Stop adopting this one");
    del.onclick=()=>removeItem(it); P.appendChild(del);
    return;
  }

  drawRepair(P, it);
  partsCard(P, it);
  drawCraft(P, it);
  P.appendChild(el("div","sect","Where it turns up"));
  P.appendChild(dropCard(it, derived));

  if(it.new || DB.rigs.length>1){
    const del=el("button","danger","Remove this rig");
    del.onclick=()=>removeItem(it); P.appendChild(del);
  }
}

/* ==========================================================
   HOW A RIG IS MENDED

     "add options for rigs to change what they are repaired with for
      ours/new/adopted"

   Two keys and no script anywhere. `repair_type` is a name a repair
   kit claims - a kit says `repair_only = ... outfit_light ...` and the
   game's own machinery does the rest, the minimum condition, the parts
   window, all of it - and `repair_part_bonus` is how much one part
   puts back.

   THE DEFAULT IS NOT ARBITRARY. Every rig ships outfit_light, because
   a type nobody lists is a rig NO KIT WILL TOUCH, and light armour is
   already served by every sewing kit and cloth glue in the game. That
   is the thing worth saying next to the box.
   ========================================================== */
const REPAIRS = [
  ["outfit_novice",  "Novice armour \u2014 the cheapest kits"],
  ["outfit_light",   "Light armour \u2014 sewing kits and cloth glue"],
  ["outfit_medium",  "Medium armour"],
  ["outfit_heavy",   "Heavy armour"],
  ["outfit_exo",     "Exoskeletons \u2014 the dearest kits only"]
];
function modernRecipe(P,it,mode){
  if(!window.ZonebenchAdvancedRecipe)return false;
  P.appendChild(el('div','sect',mode==='repair'?'How it is mended':mode==='yield'?'What it breaks down into':'What it costs to build'));
  const target=el('div','card advanced-recipe-host');P.appendChild(target);
  window.ZonebenchAdvancedRecipe.mount(target,it,TAB,mode,()=>{if(TAB==='packs')packMark(it);touch();});
  return true;
}
function drawRepair(P, it){
  if(modernRecipe(P,it,'repair'))return;
  /* A BENCH KEPT BY AN OLDER PAGE HAS NO REPAIR ON IT. The store
     carries what the page that wrote it knew about, so every field
     added later arrives undefined - and a dropdown whose value is
     undefined SHOWS its first option while the item still says
     nothing, which is a lie the person cannot see. Filled in here,
     with the same answer every rig ships with. */
  if(!it.repair) it.repair = "outfit_light";
  P.appendChild(el("div","sect","How it is mended"));
  const c=el("div","card"); c.style.maxWidth="560px";
  c.appendChild(el("div","hint",
    "Which repair kits will touch it. This is a name kits claim, not a "
    + "list of kits: anything whose <code>repair_only</code> mentions the "
    + "word below can mend this rig, and the game does the rest."));
  const g=el("div","grid2");
  const known = REPAIRS.some(r=>r[0]===(it.repair||"outfit_light"));
  field(g,"Mended as",null,pick(it,"repair",
    known ? REPAIRS : REPAIRS.concat([[it.repair, it.repair + " \u2014 its own"]]),
    {str:true,redraw:true}));
  /* AN EMPTY BOX IS NOT A NUMBER. repairBonus is allowed to be null -
     it means "whatever the ladder says" and the emitter fills it in -
     but a blank field reads as "nothing is set" rather than as a
     default, so the ladder's own number is put in the moment the card
     is looked at. */
  if(it.repairBonus == null) it.repairBonus = EMIT.bonusFor(it.slots);
  field(g,"A part puts back","of its condition",
        num(it,"repairBonus",{min:0,max:1,step:0.01,after:()=>saySame()}));
  c.appendChild(g);
  const want = EMIT.bonusFor(it.slots);
  const line = el("div","hint");
  const saySame = ()=>{
    const b = it.repairBonus == null ? want : Number(it.repairBonus);
    line.className = (Math.abs(b - want) < 1e-9) ? "hint" : "note";
    line.innerHTML = "Every rig of this tier uses <b>" + want + "</b>."
      + (Math.abs(b - want) < 1e-9 ? "" : " Yours is " + b + ", which is a "
         + "decision rather than a mistake &mdash; it is only said so you know.");
  };
  saySame(); c.appendChild(line);
  /* A TYPE NOBODY CLAIMS IS A RIG NOBODY CAN MEND, and it fails
     silently: the rig simply never appears in a repair window. Worth a
     line here rather than a surprise at 40% condition. */
  if(!known) c.appendChild(el("div","warn",
    "<code>"+esc(it.repair||"")+"</code> is not one of the five the pack uses. "
    + "If no kit's <code>repair_only</code> names it, nothing will mend this rig."));
  P.appendChild(c);
}

/* ==========================================================
   WHAT A RIG IS MADE OF

     "the tool lacs the ability to change what Items are used as parts,
      to swap them out as that is also a way to repair the rigs"

   TWO LISTS, AND THEY ARE NOT THE SAME LIST. Worth saying on the page
   as well as in the file, because everybody assumes they are:

     what it is made of      the components the workbench lets you
                             REPLACE. This is what puts the parts dots
                             on a cell, and swapping a worn one is the
                             second way to mend a rig - the first being
                             a repair kit.

     what it breaks down     what dismantling GIVES BACK. Every entry
     into                    is created, one each; it is not a pool to
                             roll from.

   The rules on the first are the game's, from the head of parts.ltx:
   at most six, every one different, and every one a conditional item -
   which the prt_i_* hardware is not. The second has no such rules;
   hardware is exactly what a rig should give back.
   ========================================================== */
function partsCard(P, it){
  if(!window.ZonebenchAdvancedRecipe){
  P.appendChild(el("div","sect","What it is made of"));
  const c=el("div","card"); c.style.maxWidth="640px";
  c.appendChild(el("div","hint",
    "The components the workbench lets you swap out. This is what puts "
    + "the <b>dots</b> on the item in your bag, and replacing a worn one is "
    + "the other way to mend a rig &mdash; the repair kit is not the only "
    + "route."));
  partsList(c, it, "parts", EMIT.partsDefault(it.slots), true);
  P.appendChild(c);

  }
  if(modernRecipe(P,it,'yield'))return;
  P.appendChild(el("div","sect","What it breaks down into"));
  const c2=el("div","card"); c2.style.maxWidth="640px";
  c2.appendChild(el("div","hint",
    "What dismantling it hands back. Every one of these is given, one "
    + "each &mdash; it is not a pool it rolls from. Buckles and plastic "
    + "belong here; they cannot be components above, because they carry "
    + "no condition of their own."));
  partsList(c2, it, "yield", EMIT.yieldDefault(it.slots), false);
  P.appendChild(c2);
}
/* One editable list. `conditional` is the con_parts_list rules: six at
   most, no repeats, prt_o_ only. */
function partsList(c, it, key, dflt, conditional){
  if(!it[key] || !it[key].length) it[key] = dflt.slice();
  const list = it[key];
  const redo = ()=>{ touch(); renderPane(); };

  const tb=el("table","ingr");
  tb.innerHTML="<thead><tr><th>Part</th><th></th></tr></thead>";
  const body=el("tbody");
  list.forEach((name,i)=>{
    const tr=el("tr"); const td1=el("td"), td2=el("td","n");
    const sel=document.createElement("select");
    /* A PICK RATHER THAN A BOX, because a part that does not exist is
       skipped in silence - the rig breaks down and one of the things
       it promised is simply not there. Every option here is a section
       the reference install has. */
    const opts = EMIT.KNOWN_PARTS.filter(x=>!conditional || x.indexOf("prt_o_")===0);
    if(opts.indexOf(name)<0) opts.unshift(name);
    opts.forEach(x=>{ const o=document.createElement("option");
      o.value=x; o.textContent=x; sel.appendChild(o); });
    sel.value=name; sel.className="mono";
    sel.onchange=()=>{ list[i]=sel.value; redo(); };
    td1.appendChild(sel);
    const x=el("button","tool","\u00d7");
    x.onclick=()=>{ list.splice(i,1); redo(); };
    td2.appendChild(x);
    tr.appendChild(td1); tr.appendChild(td2); body.appendChild(tr);
  });
  tb.appendChild(body); c.appendChild(tb);

  const add=el("button","tool","+ another part");
  add.style.marginTop="8px";
  const full = conditional && list.length >= EMIT.PART_MAX;
  if(full){
    add.disabled = true;
    c.appendChild(add);
    c.appendChild(el("div","note",
      "Six is the ceiling the game sets on components. A seventh is not "
      + "read."));
  } else {
    add.onclick=()=>{
      const pool = EMIT.KNOWN_PARTS.filter(x=>
        (!conditional || x.indexOf("prt_o_")===0) && list.indexOf(x)<0);
      list.push(pool[0] || "prt_o_fabrics_1"); redo();
    };
    c.appendChild(add);
  }
  const back=el("button","tool","Back to the worked-out one");
  back.style.cssText="margin-top:8px;margin-left:8px";
  back.onclick=()=>{ it[key] = dflt.slice(); redo(); };
  c.appendChild(back);

  if(conditional){
    const dup = list.filter((x,i)=>list.indexOf(x)!==i);
    if(dup.length) c.appendChild(el("div","warn",
      "<code>"+esc(dup[0])+"</code> is listed twice. A repeat is not a second "
      + "component &mdash; it is one slot written twice, and the game refuses "
      + "the whole list."));
  }
}

/* The recipe card, which an adopted rig can also have. One editor for
   rigs and pouches both now - see drawCraftCard. */
function drawCraft(P, it){ drawCraftCard(P, it); }

/* ==========================================================
   WHERE ONE THING TURNS UP
   ==========================================================
   The ladder on the Drops page is by TIER, which is the right default
   and the wrong answer for the one rig you want to be a story. So an
   item may take the ladder's numbers or state its own, and the card
   says plainly which of the two is in force - a page that only
   REPORTS an inherited number, with no way to change it, is the thing
   this replaces.

   An override is a whole row, not a patch: once a thing has its own
   chances, moving the ladder underneath it must not move it. */
const STASH = [["auto","follow the tier"],["both","common and rare stashes"],
               ["rare","rare stashes only"],["none","never in a stash"]];

// A rig reads the tier columns; a pouch reads its own small/medium/
// large column instead, which is what `pcol` selects.
function inheritedDrops(tier, pcol){
  return RANKS.map(rk => {
    const d = DB.drops[rk]; if(!d) return 0;
    return (pcol == null ? d.tier[tier-1] : d.pouch[pcol]) || 0;
  });
}
function dropCard(it, tier, pcol){
  if(it.adaptationId){const c=el('div','card');c.textContent=it.own?.drops?'NPC drops enabled. This item joins the existing '+(TAB==='rigs'?'rig':'pouch')+' tier '+tier+' pool. Drop chances follow Squared Away MCM settings.':'NPC drops are unchanged. Enable Include in Squared Away NPC drops under Advanced settings to add it to the existing pool.';return c;}

  const c = el("div","card");
  const own = it.drop != null;

  const tk = el("label","tick");
  tk.innerHTML = '<input type="checkbox"' + (own ? " checked" : "") + '>'
    + '<span>Give this one its own drop chances, whatever its tier says</span>';
  tk.querySelector("input").onchange = e => {
    // STARTS FROM WHAT IT HAD. Ticking the box must not silently zero
    // a rig that was dropping perfectly well a second ago.
    it.drop = e.target.checked ? (it.drop || inheritedDrops(tier,pcol)) : null;
    if(!e.target.checked) it.stash = null;
    touch(); renderPane();
  };

  if(!own){
    c.appendChild(el("div","hint",
      pcol == null
      ? "It follows tier <b>" + tier + "</b> &mdash; worked out from the pockets, "
        + "and moving with them. These are the numbers on the Drops page."
      : "It follows the <b>" + ["small","medium","large"][pcol]
        + " pouch</b> slider on the Drops page &mdash; which one is decided "
        + "by its stash tier: 1 and 2 small, 3 medium, 4 and 5 large."));
    const rows = RANKS.map((rk,i) => {
      const pc = inheritedDrops(tier,pcol)[i];
      return pc > 0 ? "<tr><td>" + esc(RANK_EN[rk]) + "</td><td class='n'>"
        + pc + "%</td></tr>" : "";
    }).join("");
    const dt = el("table");
    dt.innerHTML = "<thead><tr><th>Off a body</th><th class='n'>Chance</th></tr></thead>"
      + "<tbody>" + (rows || "<tr><td colspan=2 class='no'>no rank carries this tier"
      + "</td></tr>") + "</tbody>";
    c.appendChild(dt);
    c.appendChild(el("div","hint","In stashes: " + esc(stashOf(tier)) + "."));
    c.appendChild(tk);
    return c;
  }

  c.appendChild(el("div","note",
    "This one is <b>set by hand</b>. The ladder on the Drops page no longer "
    + "applies to it" + (pcol == null
      ? ", and changing its pockets will not move these numbers." : ".")));
  const dt = el("table");
  dt.innerHTML = "<thead><tr><th>Off a body</th><th class='n'>Chance %</th>"
    + "<th class='n'>" + (pcol == null ? "tier " + tier
    : ["small","medium","large"][pcol] + " pouch") + " would be</th></tr></thead>";
  const tb = el("tbody");
  const inh = inheritedDrops(tier,pcol);
  RANKS.forEach((rk,i) => {
    const tr = el("tr");
    tr.appendChild(el("td", null, esc(RANK_EN[rk])));
    const td = el("td","n"); td.appendChild(numAt(it.drop, i)); tr.appendChild(td);
    tr.appendChild(el("td","n", '<span style="color:var(--faint)">' + inh[i] + "%</span>"));
    tb.appendChild(tr);
  });
  dt.appendChild(tb); c.appendChild(dt);

  const bar = el("div","sizerow");
  const st = el("div"); st.style.width="240px";
  it.stash = it.stash || "auto";
  field(st, "In stashes", null, pick(it,"stash",STASH,{str:true,redraw:true}));
  bar.appendChild(st);
  const back = el("button","tool");
  back.textContent = pcol == null ? "Put the tier's numbers back"
    : "Put the pouch column back";
  back.onclick = () => { it.drop = inheritedDrops(tier,pcol); touch(); renderPane(); };
  bar.appendChild(back);
  c.appendChild(bar);
  if(it.stash === "auto")
    c.appendChild(el("div","hint","Following the tier: " + esc(stashOf(tier)) + "."));
  c.appendChild(tk);
  return c;
}

/* the pocket grid -------------------------------------------------- */
// How deep the editor draws by default, and the ceilings on both
// edges. ROWS is a starting depth, not a limit - a rig may be drawn
// deeper, and `rows` on the rig remembers it.
const ROWS = 6, MAXW = 16, MAXD = 10, CS = 34, GAP = 3;
function drawPocketEditor(P,it){
  const card=el("div","card");

  if(!it.pins || !it.pins.length){
    const n=el("div","note");
    n.innerHTML="This rig has <b>no drawn layout</b> &mdash; the game packs its "
      +"pockets automatically. Draw one below and it will use yours instead.";
    card.appendChild(n);
  }

  const pal=el("div","palette");
  const cls={"2x2":"k22","3x1":"k31","2x1":"k21","1x1":"k11"};
  for(const k of KINDS){
    const b=el("button","pbtn"+(PAINT===k?" on":""),
      '<span class="sw '+cls[k]+'"></span>'+k+' <span style="color:var(--faint)">'
      +SHAPE[k][0]+' tall</span>');
    b.onclick=()=>{PAINT=k;renderPane();};
    pal.appendChild(b);
  }
  const er=el("button","pbtn era"+(PAINT==="erase"?" on":""),"&#10005; remove");
  er.onclick=()=>{PAINT="erase";renderPane();}; pal.appendChild(er);
  const cl=el("button","pbtn","clear all");
  cl.onclick=()=>{ if(confirm("Take every pocket off this rig?")){
    it.pins=[]; syncSlots(it); touch(); renderPane(); } };
  pal.appendChild(cl);
  card.appendChild(pal);

  it.rows = Math.max(usedRows(it), Math.min(MAXD, it.rows||ROWS));
  const band = Math.max(1, Math.min(MAXW, it.band||maxCol(it)||4));
  const rows = Math.max(1, Math.min(MAXD, it.rows||ROWS));
  const wrap=el("div","gridwrap");
  const hold=el("div","gholder");
  hold.style.width=(band*(CS+GAP)-GAP)+"px";
  hold.style.height=(rows*(CS+GAP)-GAP)+"px";
  for(let r=1;r<=rows;r++) for(let c=1;c<=band;c++){
    const cell=el("div","gcell");
    cell.style.left=((c-1)*(CS+GAP))+"px";
    cell.style.top=((r-1)*(CS+GAP))+"px";
    cell.style.width=CS+"px"; cell.style.height=CS+"px";
    cell.dataset.c=c; cell.dataset.r=r;
    cell.onclick=()=>placeAt(it,c,r);
    hold.appendChild(cell);
  }
  (it.pins||[]).forEach((p,i)=>{
    const [h,w]=SHAPE[p.kind];
    const d=el("div","pocket "+cls[p.kind], p.kind);
    d.style.left=((p.col-1)*(CS+GAP))+"px";
    d.style.top=((p.row-1)*(CS+GAP))+"px";
    d.style.width=(w*(CS+GAP)-GAP)+"px";
    d.style.height=(h*(CS+GAP)-GAP)+"px";
    if(p.col+w-1>band || p.row+h-1>rows) d.classList.add("bad");
    d.onmousedown=e=>startDrag(e,it,i,band,rows,hold);
    d.oncontextmenu=e=>{e.preventDefault(); it.pins.splice(i,1);
      syncSlots(it); touch(); renderPane();};
    hold.appendChild(d);
  });
  wrap.appendChild(hold); card.appendChild(wrap);

  /* THE EDGES ARE MOVED, NOT TYPED. This was a labelled box with a
     number in it, sitting above the grid, and it read as a setting
     rather than as part of the board - so the grid looked like a fixed
     size that could not be changed. Arrows on the edge they move,
     under the thing they move, are the same two numbers and need no
     label at all.

     An edge stops where the pockets are: the arrow that would cut a
     pocket in half goes dead rather than dropping it. */
  const edges = el("div","edges");
  const arrow = (glyph, title, on, act) => {
    const b = el("button", "arrow" + (on ? "" : " off"), glyph);
    b.title = title;
    if(on) b.onclick = () => { act(); touch(); renderPane(); };
    else b.disabled = true;
    return b;
  };
  const wgrp = el("div","edge");
  wgrp.appendChild(arrow("&#9664;", "Narrower", band > Math.max(1, maxCol(it)),
    () => it.band = band - 1));
  wgrp.appendChild(el("span","edgen", band + " wide"));
  wgrp.appendChild(arrow("&#9654;", "Wider", band < MAXW, () => it.band = band + 1));
  edges.appendChild(wgrp);

  const dgrp = el("div","edge");
  dgrp.appendChild(arrow("&#9650;", "Shallower", rows > Math.max(1, usedRows(it)),
    () => it.rows = rows - 1));
  dgrp.appendChild(el("span","edgen", rows + " deep"));
  dgrp.appendChild(arrow("&#9660;", "Deeper", rows < MAXD, () => it.rows = rows + 1));
  edges.appendChild(dgrp);

  const fitBtn = el("button","tool");
  fitBtn.textContent = "Shrink to fit";
  fitBtn.title = "Pull both edges in to the pockets that are actually there";
  const tight = band === Math.max(1, maxCol(it)) && rows === Math.max(1, usedRows(it));
  if(tight) fitBtn.disabled = true;
  else fitBtn.onclick = () => { it.band = Math.max(1, maxCol(it));
    it.rows = Math.max(1, usedRows(it)); touch(); renderPane(); };
  edges.appendChild(fitBtn);
  card.appendChild(edges);

  const s=it.slots, cells=cellsOf(s), used=band*usedRows(it);
  const st=el("div","stats");
  const add=(v,l,bad)=>{const d=el("div","stat"+(bad?" warn2":""));
    d.innerHTML="<b>"+v+"</b><span>"+l+"</span>";st.appendChild(d);};
  add(cells,"cells");
  add(band+"&times;"+usedRows(it),"block");
  add(used?Math.round(cells/used*100)+"%":"0%","filled");
  add(worthOf(s).toFixed(1),"worth");
  add(tierOf(s),"tier");
  add(KINDS.map(k=>s[k]||0).join(" / "),"2x2 / 3x1 / 2x1 / 1x1");
  card.appendChild(st);
  card.appendChild(el("div","hint",
    "Click a shape then click the grid to place it. Drag a pocket to move it. "
    +"Right-click a pocket to take it off. The arrows under the grid move its "
    +"edges. A <b>2x1</b> is two squares <b>tall</b>."));
  P.appendChild(card);
}
function maxCol(it){ let m=0; for(const p of (it.pins||[]))
  m=Math.max(m,p.col+SHAPE[p.kind][1]-1); return m; }
function usedRows(it){ let m=0; for(const p of (it.pins||[]))
  m=Math.max(m,p.row+SHAPE[p.kind][0]-1); return m; }
function occupied(pins, skip){
  const o=new Set();
  pins.forEach((p,i)=>{ if(i===skip) return;
    const [h,w]=SHAPE[p.kind];
    for(let r=0;r<h;r++) for(let c=0;c<w;c++) o.add((p.col+c)+"."+(p.row+r));
  });
  return o;
}
function fits(pins,kind,col,row,band,rows,skip){
  const [h,w]=SHAPE[kind];
  if(col<1||row<1||col+w-1>band||row+h-1>rows) return false;
  const o=occupied(pins,skip);
  for(let r=0;r<h;r++) for(let c=0;c<w;c++)
    if(o.has((col+c)+"."+(row+r))) return false;
  return true;
}
function placeAt(it,c,r){
  it.pins = it.pins||[];
  const band=Math.max(1,Math.min(MAXW,it.band||4));
  const rows=Math.max(1,Math.min(MAXD,it.rows||ROWS));
  if(PAINT==="erase"){
    const o=it.pins.findIndex(p=>{
      const [h,w]=SHAPE[p.kind];
      return c>=p.col&&c<p.col+w&&r>=p.row&&r<p.row+h;});
    if(o>=0){ it.pins.splice(o,1); syncSlots(it); touch(); renderPane(); }
    return;
  }
  if(!fits(it.pins,PAINT,c,r,band,rows,-1)) return;
  it.pins.push({kind:PAINT,col:c,row:r});
  syncSlots(it); touch(); renderPane();
}
function startDrag(e,it,idx,band,rows,hold){
  e.preventDefault();
  const p=it.pins[idx];
  const box=hold.getBoundingClientRect();
  const node=hold.children[hold.children.length-it.pins.length+idx];
  const offC=Math.floor((e.clientX-box.left)/(CS+GAP))-(p.col-1);
  const offR=Math.floor((e.clientY-box.top)/(CS+GAP))-(p.row-1);
  if(node) node.classList.add("drag");
  const move=ev=>{
    const c=Math.floor((ev.clientX-box.left)/(CS+GAP))+1-offC;
    const r=Math.floor((ev.clientY-box.top)/(CS+GAP))+1-offR;
    if(node){
      node.style.left=((c-1)*(CS+GAP))+"px";
      node.style.top=((r-1)*(CS+GAP))+"px";
      node.classList.toggle("bad", !fits(it.pins,p.kind,c,r,band,rows,idx));
    }
    node && (node.dataset.c=c, node.dataset.r=r);
  };
  const up=()=>{
    document.removeEventListener("mousemove",move);
    document.removeEventListener("mouseup",up);
    if(node && node.dataset.c){
      const c=Number(node.dataset.c), r=Number(node.dataset.r);
      if(fits(it.pins,p.kind,c,r,band,rows,idx)){ p.col=c; p.row=r; touch(); }
    }
    renderPane();
  };
  document.addEventListener("mousemove",move);
  document.addEventListener("mouseup",up);
}
/* THE COUNTS ARE THE DRAWING. They used to be typed as well, and a rig
   whose counts and layout disagreed is refused by the game and packed
   the old way - silently. So there is only one of them now. */
function syncSlots(it){
  const s={}; KINDS.forEach(k=>s[k]=0);
  for(const p of (it.pins||[])) s[p.kind]=(s[p.kind]||0)+1;
  it.slots=s;
  const m=maxCol(it); if(m>(it.band||0)) it.band=m;
}

/* ==========================================================
   POUCH EDITOR
   ========================================================== */
function drawPouch(P,it){
  heading(P, it, it.adopt ? "\u2014 adopted from another mod"
    : ourPouch(it) ? "\u2014 this mod's own pouch"
    : "\u2014 the magazine mod's own section; this mod says what a fitted one grants");
  if(it.adopt) adoptNote(P, it, "pouch");
  P.appendChild(el("div","sect","What it is"));
  const cards=el("div","cards");
  const c1=el("div","card"); c1.style.display="flex"; c1.style.gap="18px";
  // OURS HAVE A SHEET NOW; the magazine mod's three wear its pictures
  // and are not ours to redraw.
  if(!it.adopt) c1.appendChild(iconWell(it, ourPouch(it)
    ? (it.cellw||2)+" x "+(it.cellh||2)+" cells in the bag"
    : "the magazine mod's own picture"));
  const f=el("div"); f.style.flex="1";
  field(f, (it.adopt && !EMIT.owns(it,"name")) ? "What you call it here" : "Name",
        (it.adopt && !EMIT.owns(it,"name"))
          ? "a label for this list \u2014 the game keeps their name" : null,
        txt(it,"name",{live:true,title:true}));
  field(f,"Section id",
        it.adopt ? "exactly as the other mod writes it"
                 : it.new ? "letters, digits and _ only" : "cannot change",
        txt(it,"id",{disabled:!it.new,live:true,isid:true,title:true}));
  if(ourPouch(it) || EMIT.owns(it,"name"))
    field(f,"Description","shown in the tooltip",txt(it,"descr",{area:true}));
  const g=el("div","grid3");
  if(!it.adopt || EMIT.owns(it,"price")){
    field(g,"Weight","kg",num(it,"weight",{min:0,step:0.1}));
    field(g,"Price","RU",num(it,"cost",{min:0,step:50,int:true,live:true}));
  }
  field(g,"Stash tier","1 common - 5 rare",stepper(it,"tier",{min:1,max:5,redraw:true}));
  f.appendChild(g);
  if(ourPouch(it)) bagSize(f, it);
  if(!ourPouch(it)) f.appendChild(el("div","hint",
    "This one is the magazine mod's. Its stash tier is set here because that "
    +"lives in a loot file this mod writes; its weight, price and picture are "
    +"theirs, and the build does not touch them."));
  c1.appendChild(f); cards.appendChild(c1);
  P.appendChild(cards);

  P.appendChild(el("div","sect","What fitting it adds to a rig"));
  const c2=el("div","card");
  const gg=el("div","grid4");
  for(const k of KINDS)
    field(gg,k, SHAPE[k][0]+" tall", stepper(it.grants,k,{min:0,max:9,redraw:true}));
  c2.appendChild(gg);
  c2.appendChild(el("div","hint","That is "+cellsOf(it.grants)
    +" extra cells. Every rig has two pouch slots."));
  P.appendChild(c2);

  P.appendChild(el("div","sect","Where it turns up"));
  // A POUCH HAS ITS OWN COLUMN, not a tier row. The three shipped ones
  // are the small / medium / large columns on the Drops page; anything
  // new has no column there at all, so it starts out set by hand.
  /* WHICH SLIDER COVERS IT. The three shipped pouches are the three
     columns; a pouch of ours joins the column its stash tier puts it
     beside - 1-2 small, 3 medium, 4-5 large - which is what the mod's
     own A.pouches_at does. So the numbers shown here are the numbers
     that will actually roll, rather than a table of zeroes nobody
     asked for. */
  const shipped = ["af_magpouch_s","af_magpouch_m","af_magpouch_l"].indexOf(it.id);
  const col = shipped >= 0 ? shipped : POUCH_COL[Math.max(1,Math.min(5,it.tier||3))] - 1;
  P.appendChild(dropCard(it, it.tier, col));
  if(it.adopt){
    takeover(P, it);
    if(EMIT.owns(it,"craft")) drawPouchCraft(P, it);
    if(EMIT.owns(it,"shelves")) shelfCard(P, it);
  } else if(ourPouch(it)) drawPouchCraft(P, it);
  if(ourPouch(it) || it.adopt){ const del=el("button","danger",
    it.adopt?"Stop adopting this one":"Remove this pouch");
    del.onclick=()=>removeItem(it); P.appendChild(del); }
}

/* ==========================================================
   WHAT A POUCH COSTS TO BUILD

     "also add crafting editor to pouches and optional for adopted
      pouches"

   A rig's recipe is worked out and shown; there is no editing it,
   because the derivation IS the balance - a rig costs what it would
   cost to reach that shape by bolting pouches onto a strap.

   A pouch is the bottom of that ladder. Nothing is sold that a pouch
   is made of, so there is nothing to derive from and the recipe is
   simply a recipe. Hence a real editor: the kit you must be carrying,
   the book you must have read, and up to four things it eats.

   FOUR IS THE CEILING AND IT IS NOT ADVISORY. ui_workshop parses each
   line into at most four ingredients and DROPS THE WHOLE RECIPE if
   there are more, saying nothing - so the fifth row is refused here
   rather than in a workshop that silently forgets the pouch exists.
   ========================================================== */
const CRAFT_KITS = [[1,"1 \u2014 basic toolkit"],[2,"2 \u2014 advanced toolkit"],
                    [3,"3 \u2014 expert toolkit"]];
const CRAFT_BOOKS = [["recipe_basic_0","recipe_basic_0 \u2014 the first book"],
                     ["recipe_basic_1","recipe_basic_1 \u2014 the second"],
                     ["recipe_advanced_1","recipe_advanced_1 \u2014 advanced"]];
const MAX_ING = 4;

/* ==========================================================
   WHAT A THING COSTS TO BUILD

     "change crafting changes in Rig TAB to look like those in pouches,
      its much better 'add ingredient' and put how much od it is needed.
      Instead of typing in a list od Items that looks like its an
      information for you not a real working thing."

   Exactly right, and it was information: the rig card printed the
   derivation as a table and the only way to disagree with it was a note
   in prose for me to read later. One editor now, for both.

   THE DERIVATION IS STILL THE BALANCE. A rig's recipe is worked out
   from its pockets - that is what makes the ladder a ladder - so it is
   what a rig starts at and what the button at the bottom returns to.
   What has changed is that it is a starting point rather than a
   verdict.
   ========================================================== */
function craftSeed(it){
  /* THE POCKETS ARE WHAT MAKES IT A RIG, and this used to ask
     ourPouch() - which only means "not adopted and not one of the
     magazine mod's three", and is therefore TRUE of every rig. So every
     rig seeded itself with a pouch's recipe. */
  if(!it.slots){
    const d = EMIT.pouchRecipe(it);
    return { kit: d.kit, book: d.book, parts: d.parts.map(x=>[x[0], x[1]]) };
  }
  const d = EMIT.rigRecipe({ ...it, craft: null });
  return { kit: d.kit, book: d.book, parts: d.parts.map(x=>[x[0], x[1]]) };
}

function drawPouchCraft(P, it){ drawCraftCard(P, it); }

function drawCraftCard(P, it){
  if(modernRecipe(P,it,'craft'))return;
  const isRig = !!it.slots;
  /* LOOKING IS NOT CHANGING. This used to write the worked-out recipe
     onto the item the moment the card was drawn, which FROZE it: add a
     pocket afterwards and the rig kept the recipe its old shape had
     earned, because it now had one of its own. So the derivation is
     held loose and only becomes the item's own when you touch
     something. */
  const mine = !!(it.craft && it.craft.parts && it.craft.parts.length);
  const c0 = mine ? it.craft : craftSeed(it);
  /* THE LINE UNDER THE CARD IS THE POINT OF THE CARD, so it is repainted
     by whatever changed - it used to be rewritten only when the id
     changed, so a count you had just typed showed the count before it. */
  const code = document.createElement("code");
  const say = x=>{ code.textContent = "x_" + (x.id||"") + " = " + c0.kit + ", "
    + c0.book + "," + c0.parts.map(r=>r[0]+","+r[1]).join(","); };
  const own = ()=>{ if(!it.craft || !it.craft.parts) it.craft = c0; };

  P.appendChild(el("div","sect","What it costs to build"));
  const c=el("div","card"); c.style.maxWidth="640px";
  c.appendChild(el("div","hint", isRig
    ? "Worked out from the pockets to begin with, the way the mod does it "
      + "&mdash; a rig costs what it would cost to reach that shape by "
      + "bolting pouches onto a strap, and every square no pouch sells is "
      + "paid for in cloth. <b>Change any of it and it is yours</b>; the "
      + "button at the bottom puts the worked-out one back."
    : "Unlike a rig, a pouch's recipe is not worked out from anything "
      + "&mdash; there is nothing underneath a pouch to be made of. This is "
      + "what it actually costs, and it is yours to set."));

  const g=el("div","grid2");
  const kitSel = pick(c0,"kit",CRAFT_KITS,{redraw:true});
  const bookSel = pick(c0,"book",CRAFT_BOOKS,{str:true,redraw:true});
  [kitSel, bookSel].forEach(n0=>{
    const was = n0.onchange;
    n0.onchange = (e)=>{ own(); if(was) was(e); };
  });
  field(g,"Toolkit you must carry",null,kitSel);
  field(g,"Book you must have read",null,bookSel);
  c.appendChild(g);

  const tb=el("table","ingr");
  tb.innerHTML="<thead><tr><th>Ingredient</th><th class='n'>Count</th><th></th></tr></thead>";
  const body=el("tbody");
  c0.parts.forEach((row,i)=>{
    const tr=el("tr");
    const td1=el("td"), td2=el("td","n"), td3=el("td","n");
    const sec=document.createElement("input"); sec.type="text"; sec.value=row[0]||"";
    sec.className="mono"; sec.setAttribute("list","ingrhints");
    sec.onchange=()=>{ own(); row[0]=sec.value.trim(); touch(); renderPane(); };
    td1.appendChild(sec);
    const n=document.createElement("input"); n.type="number"; n.min=1; n.value=row[1]||1;
    n.style.width="80px";
    n.oninput=()=>{ own(); row[1]=Math.max(1,Math.round(Number(n.value)||1));
      say(it); touch(); };
    td2.appendChild(n);
    const x=el("button","tool","\u00d7");
    x.onclick=()=>{ own(); c0.parts.splice(i,1); touch(); renderPane(); };
    td3.appendChild(x);
    tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
    body.appendChild(tr);
  });
  tb.appendChild(body); c.appendChild(tb);

  /* THE THINGS THESE RECIPES ACTUALLY USE, offered under the box. Not a
     closed list - the field takes whatever is typed - just the ones the
     mod and the game already build with, so the common case is a pick
     rather than a spelling. A section typed wrong writes a recipe the
     workshop quietly refuses. */
  if(!document.getElementById("ingrhints")){
    const dl=el("datalist"); dl.id="ingrhints";
    INGREDIENTS.forEach(v=>{ const o=el("option"); o.value=v; dl.appendChild(o); });
    c.appendChild(dl);
  }

  const add=el("button","tool","+ another ingredient");
  add.style.marginTop="8px";
  if(c0.parts.length >= MAX_ING){
    add.disabled = true;
    c.appendChild(add);
    c.appendChild(el("div","note",
      "Four is the ceiling. The workshop reads at most four ingredients and "
      + "throws the whole recipe away if there are more &mdash; without saying "
      + "so, which is why this stops here."));
  } else {
    add.onclick=()=>{ own(); c0.parts.push(["sewing_thread",4]); touch(); renderPane(); };
    c.appendChild(add);
  }

  /* ONLY WHEN THERE IS SOMETHING TO GO BACK FROM. A rig following its
     pockets has nothing to undo, and a button that undoes nothing is a
     button that makes you wonder what it did. */
  if(mine){
    const back=el("button","tool", isRig
      ? "Back to following the pockets" : "Back to the worked-out one");
    back.style.cssText="margin-top:8px;margin-left:8px";
    back.onclick=()=>{ delete it.craft; touch(); renderPane(); };
    c.appendChild(back);
  } else if(isRig){
    c.appendChild(el("div","hint","Following the pockets &mdash; change a "
      + "pocket and this changes with it. Touch anything here and it stops."));
  }

  // THE LINE ITSELF, because this is a config file with a shape and
  // seeing it is how you notice a section id typed wrong.
  const pv=el("div","hint"); pv.appendChild(document.createTextNode("The line this writes:"));
  pv.appendChild(document.createElement("br"));
  say(it); IDECHO.push(say);
  pv.appendChild(code); c.appendChild(pv);
  P.appendChild(c);
}

/* What the mod and the game already build with. */
const INGREDIENTS = ["sewing_thread","af_magpouch_s","af_magpouch_m","af_magpouch_l",
  "prt_o_fabrics_1","prt_o_fabrics_2","prt_o_fabrics_3","prt_o_fabrics_4",
  "prt_i_buckles","prt_i_metal_plate","prt_i_plastic","leather_part",
  "itm_backpack","equ_small_pack","equ_small_military_pack","equ_military_pack"];

/* ==========================================================
   WHAT A CONTAINER TAKES

     "add option for boxes. to 'it takes' to also add new categories/
      add items by their IDs to make very specific boxes."

   The mod could always do this. `amp_box_takes = meds` names the
   section [amp_box_meds] in items/amp_boxes.ltx, and that section has
   always been able to say `also = bandage, medkit` and name the things
   it takes outright. What was missing was any way to write one without
   opening the file - so this is that, and nothing under it changed.

   A RULE IS SHARED. Two containers that name the same rule are two
   containers with one rule between them, and editing it moves both.
   That is the one thing about this page that can surprise somebody, so
   the card says it in as many words and names the other containers.
   ========================================================== */
function famSummary(f){
  if(!f) return "";
  const bits=[];
  if(f.ammo) bits.push("ammunition");
  if(f.mags) bits.push("magazines");
  if(f.guns) bits.push("weapons");
  if(f.rigs) bits.push("rigs");
  (f.kinds||[]).forEach(k=>bits.push(k));
  const n=(f.also||[]).length;
  if(n) bits.push(n+" named item"+(n===1?"":"s"));
  return bits.length ? bits.join(", ") : "nothing yet";
}
function newFamily(){
  const raw = prompt("A short name for the new rule — lower case letters, "
    + "digits and underscores.\n\nIt is what you will see in the list, and any "
    + "other container can use it too.\n\nFor example: brew, tools, quest");
  if(raw==null) return null;
  const name = raw.trim().toLowerCase();
  if(!/^[a-z][a-z0-9_]*$/.test(name)){
    alert("\"" + raw.trim() + "\" will not do as a rule name. Lower case "
      + "letters, digits and underscores, starting with a letter."); return null;
  }
  if(DB.families[name]){
    alert("There is already a rule called \"" + name + "\" — pick it from "
      + "the list instead."); return null;
  }
  DB.families[name] = { kinds:[], also:[], never:[],
    ammo:false, mags:false, guns:false, rigs:false,
    no:"That does not go in this box" };
  famTouch(name);
  return name;
}
function takesPick(it){
  const s=document.createElement("select");
  const opt=(v,l)=>{ const o=document.createElement("option");
    o.value=v; o.textContent=l; s.appendChild(o); return o; };
  opt("any","anything at all");
  famNames().forEach(n=>opt(n, n + " — " + famSummary(DB.families[n])));
  // A CONTAINER MAY NAME A RULE THAT IS NOT THERE - somebody else's
  // save, a rule deleted from the file - and the box would silently
  // read as "anything at all" if the list simply did not have it.
  if(it.takes && it.takes!=="any" && !DB.families[it.takes])
    opt(it.takes, it.takes + " — no such rule");
  opt("__new__","make a rule of my own…");
  s.value = it.takes || "any";
  s.onchange=()=>{
    if(s.value!=="__new__"){ it.takes=s.value; touch(); renderPane(); return; }
    const made=newFamily();
    if(!made){ s.value=it.takes||"any"; return; }
    it.takes=made; touch(); renderPane();
  };
  return s;
}
/* A COMMA LIST, edited as one line. Committed on blur rather than on
   every keystroke: a redraw mid-word is how the number fields on this
   page became unusable once, and there is nothing here worth redrawing
   for. */
function famList(f,key,name){
  const i=document.createElement("input"); i.type="text";
  i.value=(f[key]||[]).join(", ");
  i.onchange=()=>{
    f[key]=i.value.split(",").map(s=>s.trim()).filter(s=>s!=="");
    i.value=f[key].join(", ");
    famTouch(name);
  };
  return i;
}
function famText(f,key,name){
  const i=document.createElement("input"); i.type="text";
  i.value=f[key]==null?"":f[key];
  i.oninput=()=>{ f[key]=i.value; famTouch(name); };
  return i;
}
function famTick(c,f,name,key,label,hint){
  const t=el("label","tick");
  t.innerHTML='<input type="checkbox"'+(f[key]?" checked":"")
    +'><span>'+esc(label)+' <span style="color:var(--faint)">'+esc(hint)+'</span></span>';
  t.querySelector("input").onchange=e=>{ f[key]=e.target.checked;
    famTouch(name); renderPane(); };
  c.appendChild(t);
}
function familyCard(P,it){
  const name = it.takes || "any";
  if(name==="any"){
    P.appendChild(el("div","hint","Anything you can pick up goes in this one. "
      + "Pick a rule above to narrow it down, or make one."));
    return;
  }
  const f = DB.families[name];
  if(!f){
    P.appendChild(el("div","warn","Nothing in the mod describes a rule called "
      + "<code>"+esc(name)+"</code>, so this container will take <b>anything at "
      + "all</b>. Pick one from the list above, or make it."));
    return;
  }
  P.appendChild(el("div","sect","The “"+esc(name)+"” rule"));
  const c=el("div","card"); c.style.maxWidth="640px";
  const users = (DB.boxes||[]).filter(b=>(b.takes||"any")===name && b.id!==it.id);
  c.appendChild(el("div", users.length?"note":"hint",
    users.length
      ? "<b>This rule is shared.</b> " + users.map(b=>"<b>"+esc(b.name||b.id)+"</b>")
          .join(", ") + " " + (users.length===1?"uses":"use") + " it too and will "
        + "change with it. For a container that has to be different, make a rule "
        + "of its own from the list above."
      : "No other container uses this rule, so it is this one's alone."));

  famTick(c,f,name,"ammo","Ammunition","every box of rounds, however the mod that adds it is written");
  famTick(c,f,name,"mags","Magazines","");
  famTick(c,f,name,"guns","Weapons","");
  famTick(c,f,name,"rigs","Chest rigs","what is in the rig travels with it");

  field(c,"Kinds of item","the game's own word — comma separated",
        famList(f,"kinds",name));
  const chips=el("div","kchips");
  KIND_HINTS.forEach(k=>{
    const on=(f.kinds||[]).indexOf(k)>=0;
    const b=el("button",on?"on":"",esc(k));
    b.onclick=()=>{
      const has=f.kinds.indexOf(k);
      if(has<0) f.kinds.push(k); else f.kinds.splice(has,1);
      famTouch(name); renderPane();
    };
    chips.appendChild(b);
  });
  c.appendChild(chips);
  c.appendChild(el("div","hint","Everything the game calls one of these goes "
    + "in. <code>i_medical</code> is every medical item there is or ever will "
    + "be, which is usually what you want. The buttons are the kinds already "
    + "in use; the box takes any word you type."));
  field(c,"These items as well","section ids — comma separated",
        famList(f,"also",name));
  c.appendChild(el("div","hint","<b>This is how you make a very specific "
    + "container.</b> Name the sections outright and leave the kinds box empty, "
    + "and it takes those and nothing else — the wallet is built exactly "
    + "that way, out of twelve named patches."));
  field(c,"Never these","section ids — comma separated",
        famList(f,"never",name));
  c.appendChild(el("div","hint","Checked first, so it beats everything above it."));
  field(c,"What it says when it refuses",null,famText(f,"no",name));
  P.appendChild(c);
}

/* ==========================================================
   CONTAINER EDITOR
   ========================================================== */
/* ==========================================================
   COMPARTMENTS

     "i dont want box editor to have just height/width but also what
      slots insode look like. so i can make slots that are any size so
      any number by any number and i can move them how i want them"

   A box is a grid with rectangles drawn on it. No rectangles means one
   open area, which is every ordinary box; one per square is the hip
   pouch; anything else is what this page is for.

   THE LIST IS THE TRUTH AND THE PICTURE IS A VIEW OF IT. Every gesture
   below ends by writing `it.slots` and asking for a redraw, rather than
   moving a div and writing the list afterwards - so there is one place
   a compartment's position is decided and nothing can drift out of step
   with the drawing.
   ========================================================== */
const SLED = 30;                       /* pixels per square, on screen */

/* THE FIRST SQUARE A w x h RECTANGLE WILL STAND ON, read across then
   down - the same walk the mod's own packer does. What "Add a
   compartment" needs, and the reason there is a way to make one
   without dragging at all: a button is discoverable and a gesture is
   not. */
function slotSpot(it, w, h){
  for(let r = 1; r + h - 1 <= (it.inh||1); r++)
    for(let c = 1; c + w - 1 <= (it.inw||1); c++)
      if(slotFree(it, {c:c, r:r, w:w, h:h})) return {c:c, r:r, w:w, h:h};
  return null;
}

function slotsOf(it){
  return Array.isArray(it.slots) ? it.slots : (it.slots = []);
}

/* Does a rectangle lie inside the grid and clear of every other one?
   `skip` is the compartment being moved, which must not be counted as
   being in its own way - the same rule the mod's own packer has. */
function slotFree(it, s, skip){
  const w = Math.max(1, it.inw||1), h = Math.max(1, it.inh||1);
  if(s.w < 1 || s.h < 1 || s.c < 1 || s.r < 1) return false;
  if(s.c + s.w - 1 > w || s.r + s.h - 1 > h) return false;
  const list = slotsOf(it);
  for(let i = 0; i < list.length; i++){
    if(i === skip) continue;
    const e = list[i];
    const apart = (s.c + s.w - 1 < e.c) || (e.c + e.w - 1 < s.c)
               || (s.r + s.h - 1 < e.r) || (e.r + e.h - 1 < s.r);
    if(!apart) return false;
  }
  return true;
}

/* READ IN THE ORDER SOMEBODY READS A GRID - across, then down - so the
   list a build writes is the list a person would have typed, and two
   boxes drawn the same way produce the same line. */
function slotSort(it){
  slotsOf(it).sort((a,b)=> (a.r - b.r) || (a.c - b.c));
}

/* WHAT FITS WHERE, asked exactly as the mod asks it: a footprint is in
   a compartment only if it lies WHOLLY inside one, either way up. */
function slotTakes(s, w, h){
  return (s.w >= w && s.h >= h) || (s.w >= h && s.h >= w);
}
function slotsTake(it, w, h){
  const list = slotsOf(it);
  if(!list.length) return (w <= (it.inw||1) && h <= (it.inh||1))
                       || (h <= (it.inw||1) && w <= (it.inh||1));
  return list.some(s => slotTakes(s, w, h));
}

/* ----------------------------------------------------------
   THE PAGE
   ---------------------------------------------------------- */
let SLOT_SEL = -1;                     /* which compartment is selected */
let SLOT_TRY = null;                   /* the footprint being asked about */

/* ==========================================================
   ONE COMPARTMENT'S NUMBERS

     "i want to be able to make not a box with a bunch of the same
      sized slots but also with any custom slots so like a box with one
      3x1, two 1x1, one 3x3 etc any combiantion i want"

   THE DRAG COULD ALWAYS DO THIS and nobody could tell, which makes it
   a thing the editor did not do. A grid you can drag on looks exactly
   like a grid you cannot, and the only other controls on the page
   filled it with one size - so what the page SAID it was for was
   uniform tiling.

   So every compartment is also four numbers you can type. Select one
   and its position and size are here, with a stepper apiece and the
   arrow keys on the picture itself. Any combination, one rectangle at
   a time, no gesture required.

   A CHANGE THAT WOULD OVERLAP IS PUT BACK rather than clamped to
   something near it: clamping moves a rectangle somewhere nobody asked
   for, and the somewhere is hard to predict from the number you typed.
   ========================================================== */
function slotStep(it, i, key, lo, hi){
  const s = slotsOf(it)[i];
  let was = s[key];
  return stepper(s, key, { min: lo, max: hi, redraw: true, before: () => {
    if(!slotFree(it, s, i)){ s[key] = was; SLOT_STUCK = true; return; }
    was = s[key];
    slotSort(it);
    SLOT_SEL = slotsOf(it).indexOf(s);
  }});
}

function slotNumbers(parent, it){
  const side = el("div","sledside");
  const list = slotsOf(it);
  const s = list[SLOT_SEL];

  if(!s){
    side.appendChild(el("h4", null, "No compartment selected"));
    side.appendChild(el("div","none",
      "<b>Drag across the empty squares</b> to make one, click a "
      + "single square for a 1&times;1, or press <b>Add a "
      + "compartment</b> below.<br><br>"
      + "Click one to select it. Then drag it to move, drag its corner "
      + "to resize, or set its numbers here \u2014 any size, anywhere, "
      + "and they need not match each other."));
    parent.appendChild(side);
    return;
  }

  side.appendChild(el("h4", null,
    "This compartment \u2014 " + s.w + " by " + s.h));
  const g = el("div","grid2");
  field(g, "Across", null, slotStep(it, SLOT_SEL, "c", 1, it.inw||1));
  field(g, "Down",   null, slotStep(it, SLOT_SEL, "r", 1, it.inh||1));
  field(g, "Wide",   null, slotStep(it, SLOT_SEL, "w", 1, it.inw||1));
  field(g, "Tall",   null, slotStep(it, SLOT_SEL, "h", 1, it.inh||1));
  side.appendChild(g);

  if(SLOT_STUCK){
    side.appendChild(el("div","note",
      "That would have put it on top of another compartment, or off "
      + "the edge \u2014 so it stayed where it was."));
    SLOT_STUCK = false;
  }

  const bar = el("div","sledbar");
  const del = el("button","danger","Remove this one");
  del.onclick = ()=>{ list.splice(SLOT_SEL,1); SLOT_SEL=-1; touch(); renderPane(); };
  bar.appendChild(del);
  side.appendChild(bar);
  parent.appendChild(side);
}

function slotEditor(parent, it){
  const cols = Math.max(1, Math.min(16, it.inw||1));
  const rows = Math.max(1, Math.min(32, it.inh||1));
  const list = slotsOf(it);
  if(SLOT_SEL >= list.length) SLOT_SEL = -1;

  const outer = el("div");
  const pane = el("div","sledwrap");
  const col = el("div");
  if(SLOT_DROPPED){
    col.appendChild(el("div","note", SLOT_DROPPED + " compartment"
      + (SLOT_DROPPED===1?" was":"s were") + " off the edge of the "
      + "smaller grid and had to go."));
    SLOT_DROPPED = 0;
  }
  const grid = el("div","sled");
  grid.style.width  = (cols*SLED + 16) + "px";
  grid.style.height = (rows*SLED + 16) + "px";

  const at = (c,r,w,h,node)=>{
    node.style.left = (8 + (c-1)*SLED) + "px";
    node.style.top  = (8 + (r-1)*SLED) + "px";
    node.style.width  = (w*SLED - 2) + "px";
    node.style.height = (h*SLED - 2) + "px";
    return node;
  };

  for(let r=1;r<=rows;r++) for(let c=1;c<=cols;c++)
    grid.appendChild(at(c,r,1,1,el("div","bed")));

  const ghost = el("div","ghost"); ghost.hidden = true;
  grid.appendChild(ghost);

  /* WHICH SQUARE A POINT IS ON. Clamped rather than refused: a drag
     that leaves the grid should stop at the edge, the way dragging a
     window against the side of the screen does. */
  const cellAt = ev => {
    const b = grid.getBoundingClientRect();
    return { c: Math.max(1, Math.min(cols, Math.floor((ev.clientX - b.left - 8)/SLED) + 1)),
             r: Math.max(1, Math.min(rows, Math.floor((ev.clientY - b.top  - 8)/SLED) + 1)) };
  };

  list.forEach((s,i)=>{
    const d = at(s.c, s.r, s.w, s.h, el("div","slot"));
    if(i === SLOT_SEL) d.className = "slot on";
    else if(SLOT_TRY) d.className = "slot " +
      (slotTakes(s, SLOT_TRY[0], SLOT_TRY[1]) ? "yes" : "no");
    d.title = s.w + " by " + s.h + " at " + s.c + "," + s.r;

    /* MOVE. The offset the compartment was GRABBED BY is kept, so a
       corner does not jump under the cursor - the same thing the mod's
       own drag does with dr/dc. */
    d.onmousedown = ev => {
      if(ev.target.className === "grip") return;
      ev.preventDefault(); ev.stopPropagation();
      const a = cellAt(ev), dc = a.c - s.c, dr = a.r - s.r;
      SLOT_SEL = i;
      drag(ev, p => ({ c: p.c - dc, r: p.r - dr, w: s.w, h: s.h }), i);
    };

    /* RESIZE, from the far corner, so the near one stays put.
       ON THE SELECTED ONE ONLY: fifteen little blue corners is not
       fifteen affordances, it is a texture, and a texture is the thing
       people stop seeing. */
    if(i === SLOT_SEL){
      const g = el("div","grip");
      g.onmousedown = ev => {
        ev.preventDefault(); ev.stopPropagation();
        SLOT_SEL = i;
        drag(ev, p => ({ c: s.c, r: s.r,
                         w: Math.max(1, p.c - s.c + 1),
                         h: Math.max(1, p.r - s.r + 1) }), i);
      };
      d.appendChild(g);
    }
    grid.appendChild(d);
  });

  /* ONE DRAG, THREE GESTURES. Make, move and resize differ only in how
     a cursor position becomes a rectangle, so that is the only thing
     passed in - and every one of them shows the same ghost, refuses in
     the same red, and commits through the same door. */
  function drag(ev0, shape, skip){
    const show = p => {
      const s = shape(p);
      const ok = slotFree(it, s, skip);
      at(s.c, s.r, s.w, s.h, ghost);
      ghost.className = ok ? "ghost" : "ghost bad";
      ghost.hidden = false;
      return ok ? s : null;
    };
    let last = show(cellAt(ev0));
    const move = e => { last = show(cellAt(e)); };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      ghost.hidden = true;
      if(last){
        /* THE OBJECT THAT ENDS UP HOLDING THE VALUES, which on a move
           or a resize is NOT `last` - the numbers are assigned into
           the compartment that was already there. Looking for `last`
           in the list found nothing, so every move and every resize
           quietly deselected the thing being moved: the numbers
           panel vanished and so did the corner you were dragging. */
        let kept;
        if(skip == null){ kept = last; slotsOf(it).push(kept); }
        else { kept = slotsOf(it)[skip]; Object.assign(kept, last); }
        slotSort(it);
        SLOT_SEL = slotsOf(it).indexOf(kept);
        touch();
      }
      renderPane();
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  /* DRAW A NEW ONE on empty squares. A press that never moves is a
     click, and a click on nothing means "nothing is selected". */
  grid.onmousedown = ev => {
    ev.preventDefault();
    const a = cellAt(ev);
    SLOT_SEL = -1;
    drag(ev, p => ({ c: Math.min(a.c, p.c), r: Math.min(a.r, p.r),
                     w: Math.abs(p.c - a.c) + 1, h: Math.abs(p.r - a.r) + 1 }),
         null);
  };

  /* ============================================================
     AND THE ARROW KEYS, because a drag is not a fine adjustment.
     One square a press; with shift, the size instead of the place.
     Refused the same way a drag is: the rectangle stays put rather
     than being clamped somewhere nobody asked for.
     ============================================================ */
  grid.tabIndex = 0;
  grid.onkeydown = ev => {
    const s0 = slotsOf(it)[SLOT_SEL];
    if(!s0) return;
    const d = { ArrowLeft:[-1,0], ArrowRight:[1,0],
                ArrowUp:[0,-1], ArrowDown:[0,1] }[ev.key];
    if(ev.key === "Delete" || ev.key === "Backspace"){
      ev.preventDefault();
      slotsOf(it).splice(SLOT_SEL,1); SLOT_SEL = -1; touch(); renderPane();
      return;
    }
    if(!d) return;
    ev.preventDefault();
    const nx = ev.shiftKey
      ? { c:s0.c, r:s0.r, w:Math.max(1,s0.w+d[0]), h:Math.max(1,s0.h+d[1]) }
      : { c:s0.c+d[0], r:s0.r+d[1], w:s0.w, h:s0.h };
    if(!slotFree(it, nx, SLOT_SEL)) return;
    Object.assign(s0, nx);
    slotSort(it);
    SLOT_SEL = slotsOf(it).indexOf(s0);
    touch(); renderPane();
    const g2 = document.querySelector(".sled");
    if(g2) g2.focus();
  };

  col.appendChild(grid);

  /* ---------------- the buttons ---------------- */
  const bar = el("div","sledbar");
  const btn = (label, fn, title, cls) => {
    const b = el("button", cls || "", label);
    if(title) b.title = title;
    b.onclick = () => { fn(); slotSort(it); touch(); renderPane(); };
    bar.appendChild(b);
    return b;
  };

  /* THE NO-GESTURE PATH. A button is discoverable and a drag is not,
     and "I did not know I could" is the same outcome as "it cannot".
     One square in the first free place, selected, with its numbers
     already open beside it - which is where somebody finds out the
     numbers exist. */
  btn("Add a compartment", ()=>{
    const spot = slotSpot(it, 1, 1);
    if(!spot){ SLOT_FULL = true; return; }
    slotsOf(it).push(spot);
    slotSort(it);
    SLOT_SEL = slotsOf(it).indexOf(spot);
  }, "One square, in the first free place. Then size it however you "
   + "like - they need not match each other.", "go");

  btn("One open area", ()=>{ it.slots = []; SLOT_SEL = -1; },
      "No compartments at all - a thing lies across as many squares as "
      + "it needs. Every ordinary container.");
  btn("A compartment per square", ()=>{
    it.slots = [];
    for(let r=1;r<=rows;r++) for(let c=1;c<=cols;c++)
      it.slots.push({c:c,r:r,w:1,h:1});
    SLOT_SEL = -1;
  }, "What the hip pouch is: nothing bigger than one square goes in.");

  /* TILE WITH N x M, which is how a pistol case gets made in two
     clicks. Laid across then down, keeping whatever will not divide
     evenly as empty squares rather than as a row of stumps. */
  const tw = el("input"); tw.type="text"; tw.value = String(SLOT_TILE[0]);
  const th = el("input"); th.type="text"; th.value = String(SLOT_TILE[1]);
  bar.appendChild(el("span","lbl","Fill with"));
  bar.appendChild(tw);
  bar.appendChild(el("span","lbl","by"));
  bar.appendChild(th);
  btn("Fill", ()=>{
    const w = Math.max(1, Math.min(cols, Math.round(Number(tw.value)) || 1));
    const h = Math.max(1, Math.min(rows, Math.round(Number(th.value)) || 1));
    SLOT_TILE = [w, h];
    it.slots = [];
    for(let r=1; r + h - 1 <= rows; r += h)
      for(let c=1; c + w - 1 <= cols; c += w)
        it.slots.push({c:c, r:r, w:w, h:h});
    SLOT_SEL = -1;
  }, "A compartment of that size everywhere one fits, left to right.");

  if(SLOT_SEL >= 0) btn("Remove this one", ()=>{
    slotsOf(it).splice(SLOT_SEL, 1); SLOT_SEL = -1;
  });

  pane.appendChild(col);
  slotNumbers(pane, it);
  outer.appendChild(pane);

  /* THE BUTTONS GO UNDER THE WHOLE THING. Inside the picture's own
     column they made it as wide as the row of them, which pushed the
     selected compartment's numbers off to the far side of the card -
     a panel about the thing you are looking at, placed where you are
     not looking. */
  outer.appendChild(bar);
  if(SLOT_FULL){
    outer.appendChild(el("div","note",
      "There is no free square left to put one in."));
    SLOT_FULL = false;
  }
  return outer;
}

let SLOT_TILE = [2, 1];
let SLOT_DROPPED = 0;
let SLOT_FULL = false;
let SLOT_STUCK = false;

/* ----------------------------------------------------------
   WILL IT TAKE ONE OF THESE?

   The question the whole feature exists to answer, answered here rather
   than by loading a save. It asks what the game asks - does this
   footprint lie wholly inside some compartment, either way up - so a
   green row here is a green square there.
   ---------------------------------------------------------- */
const SLOT_SIZES = [[1,1,"a bandage, a patch"], [2,1,"a pistol"],
                    [1,2,"a magazine"], [2,2,"a drum, a helmet"],
                    [3,1,"a small SMG"], [5,2,"a rifle"],
                    [6,3,"a long rifle"]];

function slotChecker(parent, it){
  const c = el("div","card");
  c.appendChild(el("div","hint",
    "Hover a size to see which compartments would take it. This is the "
    + "same question the game asks - whether the footprint fits wholly "
    + "inside one compartment, either way up."));
  const row = el("div","sledbar");
  SLOT_SIZES.forEach(([w,h,what])=>{
    const ok = slotsTake(it, w, h);
    const b = el("button", "tiny" + (ok ? "" : " danger"),
                 w + "×" + h + " " + (ok ? "✓" : "✗"));
    b.title = what + " — " + (ok ? "goes in" : "is refused");
    b.onmouseenter = ()=>{ SLOT_TRY = [w,h]; renderPane(); };
    b.onmouseleave = ()=>{ SLOT_TRY = null; renderPane(); };
    b.onclick = ()=>{ SLOT_TRY = SLOT_TRY ? null : [w,h]; renderPane(); };
    row.appendChild(b);
  });
  c.appendChild(row);
  parent.appendChild(c);
}

function drawBox(P,it){
  heading(P, it, it.adopt ? "\u2014 adopted from another mod" : "");
  if(it.adopt) adoptNote(P, it, "container");
  if(it.borrowed) P.appendChild(el("div","note",
    "This is the game's own <b>Wallet</b> with a pocket added to it. Its name, "
    +"price and picture belong to the base game &mdash; only what fits inside is ours."));

  P.appendChild(el("div","sect","What it is"));
  const cards=el("div","cards");
  const c1=el("div","card"); c1.style.display="flex"; c1.style.gap="18px";
  if(!it.borrowed && !it.adopt)
    c1.appendChild(iconWell(it, it.cellw+" x "+it.cellh+" cells in the bag"));
  const f=el("div"); f.style.flex="1";
  field(f, (it.adopt && !EMIT.owns(it,"name")) ? "What you call it here" : "Name",
        (it.adopt && !EMIT.owns(it,"name"))
          ? "a label for this list \u2014 the game keeps their name" : null,
        txt(it,"name",{live:true,disabled:it.borrowed,title:true}));
  field(f,"Section id",
        it.adopt ? "exactly as the other mod writes it"
                 : it.new ? "letters, digits and _ only" : "cannot change",
        txt(it,"id",{disabled:!it.new,live:true,isid:true,title:true}));
  if(!it.borrowed && (!it.adopt || EMIT.owns(it,"name")))
    field(f,"Description","shown in the tooltip",txt(it,"descr",{area:true}));
  if(it.adopt && EMIT.owns(it,"price")){
    const gp=el("div","grid2");
    field(gp,"Weight","kg, empty",num(it,"weight",{min:0,step:0.1}));
    field(gp,"Price","RU",num(it,"cost",{min:0,step:100,int:true,live:true}));
    f.appendChild(gp);
  }
  c1.appendChild(f); cards.appendChild(c1);

  if(!it.borrowed && !it.adopt){
    const c2=el("div","card"); c2.dataset.settingsGroup="economy"; c2.style.maxWidth="270px";
    const g=el("div","grid2");
    field(g,"Weight","kg, empty",num(it,"weight",{min:0,step:0.1}));
    field(g,"Price","RU",num(it,"cost",{min:0,step:100,int:true,live:true}));
    c2.appendChild(g);
    bagSize(c2, it);
    cards.appendChild(c2);
  }
  P.appendChild(cards);

  P.appendChild(el("div","sect","What fits inside"));
  const c3=el("div","card"); c3.style.display="flex"; c3.style.gap="24px";
  const left=el("div"); left.style.flex="1"; left.style.maxWidth="330px";
  const gi=el("div","grid2");
  /* ...AND SHRINKING THE BOX DOES NOT LEAVE COMPARTMENTS OFF THE EDGE.
     `before` runs after the number has moved and before the redraw, so
     what the page paints is already the truth. Ones that no longer fit
     are dropped and SAID - silently losing a compartment somebody drew
     is the bench's version of an item you cannot see. */
  const trim = () => {
    const was = slotsOf(it).length;
    it.slots = slotsOf(it).filter(s =>
      s.c + s.w - 1 <= (it.inw||1) && s.r + s.h - 1 <= (it.inh||1));
    if(it.slots.length !== was){
      SLOT_SEL = -1;
      SLOT_DROPPED = was - it.slots.length;
    }
  };
  field(gi,"Squares wide",null,
        stepper(it,"inw",{min:1,max:16,redraw:true,before:trim}));
  field(gi,"Squares tall",null,
        stepper(it,"inh",{min:1,max:32,redraw:true,before:trim}));
  left.appendChild(gi);
  field(left,"It takes","the rule it goes by",takesPick(it));
  field(left,"Sound when it opens",null,pick(it,"snd",SOUNDS,{str:true}));
  const gk=el("div","grid2");
  const kgIn = num(it,"kg",{min:0,step:0.5,disabled:it.kg==null});
  field(gk,"Weight it carries","kg",kgIn);
  field(gk,"Stack ceiling","per square",num(it,"stack",{min:1,max:999,int:true}));
  left.appendChild(gk);
  const nolimit=el("label","tick");
  nolimit.innerHTML='<input type="checkbox"'+(it.kg==null?" checked":"")
    +'><span>No weight limit at all</span>';
  nolimit.querySelector("input").onchange=e=>{
    it.kg = e.target.checked ? null : 10; touch(); renderPane(); };
  left.appendChild(nolimit);
  c3.appendChild(left);

  const right=el("div");
  const inw=Math.max(1,Math.min(12,it.inw||1)), inh=Math.max(1,Math.min(24,it.inh||1));

  /* ============================================================
     A FAN HAS NO SQUARES TO DIVIDE

     The document case is rows of paper fifteen pixels tall: a sheet on
     edge has no footprint and no orientation, so there is nothing for
     a compartment to refuse. It keeps the picture it had.
     ============================================================ */
  if(it.fan || it.case){
    const bg=el("div","bgrid");
    bg.style.gridTemplateColumns="repeat("+inw+",15px)";
    for(let i=0;i<inw*inh;i++) bg.appendChild(el("i"));
    right.appendChild(bg);
    right.appendChild(el("div","hint",
      it.fan ? "A fan of paper - one row per sheet, no compartments"
             : "Lead-lined wells, one kind of artefact in each"));
  } else {
    /* THE LITTLE PREVIEW, WHICH IS ALL THIS EVER WAS. The editor gets a
       section of its own below - squeezed into the right-hand third of
       a card it read as a picture rather than as something to drag on,
       which is most of why the compartments looked like they only came
       in one size. */
    const bg=el("div","bgrid");
    bg.style.gridTemplateColumns="repeat("+inw+",15px)";
    for(let i=0;i<inw*inh;i++) bg.appendChild(el("i"));
    right.appendChild(bg);
    right.appendChild(el("div","hint", (inw*inh) + " squares"
      + (it.kg==null ? ", no weight limit" : ", up to " + it.kg + " kg")));
  }
  c3.appendChild(right);
  P.appendChild(c3);

  if(!(it.fan || it.case)){
    const n = slotsOf(it).length;
    P.appendChild(el("div","sect", "Compartments"));
    const c4 = el("div","card");
    c4.appendChild(el("div","hint", n
      ? ("<b>" + n + " compartment" + (n===1?"":"s") + ".</b> They can be "
         + "any size and in any arrangement &mdash; one 3&times;1, two "
         + "1&times;1 and a 3&times;3 is a perfectly good box. Drag on "
         + "the empty squares to make one, drag a compartment to move "
         + "it, its corner to resize; or select one and type its "
         + "numbers. Arrow keys nudge it, with shift to resize.")
      : ("<b>One open area.</b> A thing lies across as many squares as "
         + "it needs, which is every ordinary container. Divide it up "
         + "and nothing will reach out of one compartment into the "
         + "next &mdash; which is how a case refuses a rifle without "
         + "anybody keeping a list of rifles.")));
    c4.appendChild(slotEditor(c4, it));
    P.appendChild(c4);

    if(n){
      P.appendChild(el("div","sect","What will fit in one"));
      slotChecker(P, it);
    }
  }
  familyCard(P, it);

  if(it.borrowed) return;   // the wallet has no shelf of ours and no delete
  if(it.adopt){
    takeover(P, it);
    if(EMIT.owns(it,"drops")){ P.appendChild(el("div","sect","Where it turns up"));
      P.appendChild(dropCard(it, it.tier||3, null)); }
    if(EMIT.owns(it,"shelves")) shelfCard(P, it);
    const del=el("button","danger","Stop adopting this one");
    del.onclick=()=>removeItem(it); P.appendChild(del);
    return;
  }

  shelfCard(P, it);

  const del=el("button","danger","Remove this container");
  del.onclick=()=>removeItem(it); P.appendChild(del);
}

/* ==========================================================
   DROPS
   ========================================================== */
function drawDrops(P){
  P.appendChild(el("h1",null,"What comes off a body"));
  P.appendChild(el("div","hint",
    "The chance a dead stalker of each rank is carrying a rig of each tier, "
    +"or a pouch. These are the numbers the menu starts at &mdash; a player can "
    +"still move every one of them in MCM."));
  const c=el("div","card");
  const t=el("table");
  t.innerHTML="<thead><tr><th>Rank</th>"
    +[1,2,3,4,5].map(i=>"<th class='n'>tier "+i+"</th>").join("")
    +"<th class='n'>small<br>pouch</th><th class='n'>medium<br>pouch</th>"
    +"<th class='n'>large<br>pouch</th></tr></thead>";
  const tb=el("tbody");
  for(const rk of RANKS){
    const tr=el("tr");
    tr.appendChild(el("td",null,esc(RANK_EN[rk])));
    const row=DB.drops[rk];
    for(let i=0;i<5;i++){
      const td=el("td","n");
      td.appendChild(numAt(row.tier,i)); tr.appendChild(td);
    }
    for(let i=0;i<3;i++){
      const td=el("td","n");
      td.appendChild(numAt(row.pouch,i)); tr.appendChild(td);
    }
    tb.appendChild(tr);
  }
  t.appendChild(tb); c.appendChild(t);
  c.appendChild(el("div","hint",
    "Every number is a percentage. Zero means that rank never carries it."));
  P.appendChild(c);

  P.appendChild(el("div","sect","And what state it is in"));
  const c2=el("div","card");
  DB.cond = DB.cond || defaultCond();
  const t2=el("table");
  t2.innerHTML="<thead><tr><th>Rank</th><th class='n'>worst %</th>"
    +"<th class='n'>best %</th></tr></thead>";
  const tb2=el("tbody");
  for(const rk of RANKS){
    const tr=el("tr");
    tr.appendChild(el("td",null,esc(RANK_EN[rk])));
    for(let i=0;i<2;i++){
      const td=el("td","n"); td.appendChild(numAt(DB.cond[rk],i)); tr.appendChild(td);
    }
    tb2.appendChild(tr);
  }
  t2.appendChild(tb2); c2.appendChild(t2);
  c2.appendChild(el("div","hint",
    "A rig off a rookie comes home as junk; a legend's is worth carrying."));
  P.appendChild(c2);
}
function numAt(arr,i){
  const inp=document.createElement("input");
  inp.type="number"; inp.min=0; inp.max=100; inp.value=arr[i]||0;
  inp.oninput=()=>{ let v=Math.round(Number(inp.value)||0);
    arr[i]=Math.max(0,Math.min(100,v)); touch(); };
  return inp;
}
function defaultCond(){
  return {novice:[5,15],trainee:[5,20],experienced:[5,25],professional:[10,30],
    veteran:[10,35],expert:[15,40],master:[20,45],legend:[25,55]};
}

/* The current smaller inventory cells fit eleven columns. Wider shapes
   retain their capacity but cannot be previewed at their requested width. */
const PACK_ROOM = 11;
/* GAMMA'S OWN FIVE, in the order Craft and Repair Overhaul builds them
   - each one made out of the one above it. Offered as suggestions: the
   field takes anything typed into it, because the interesting case is
   a pack from some other mod.

   TWO THINGS THAT LOOK LIKE BACKPACKS AND ARE NOT, both deliberately
   absent: kit_hunt is a hunting kit that works from your inventory and
   only shares the packs' icon sheet, and itm_actor_backpack is the bag
   you DROP to make a stash rather than one you wear. */
const PACK_HINTS = [
  ["itm_backpack","the sack you start with"],
  ["equ_small_pack","small pack"],
  ["equ_small_military_pack","small military pack"],
  ["equ_military_pack","military pack"],
  ["equ_tourist_pack","tourist pack, the top of the ladder"]
];

/* A shape drawn as squares, clipped the way the bag column clips it. */
function packPreview(size){
  const wrap = el("div","gridwrap");
  if(!size){ wrap.appendChild(el("div","hint","&mdash;")); return wrap; }
  const hold = el("div","gholder");
  const S = 13, GAP = 2;
  const cols = size.cols || PACK_ROOM;
  const shown = Math.max(1, Math.min(cols, PACK_ROOM));
  const rows = Math.max(1, Math.ceil(size.cells / shown));
  const capped = Math.min(rows, 20);
  hold.style.width = (shown*(S+GAP)) + "px";
  hold.style.height = (capped*(S+GAP)) + "px";
  let left = size.cells;
  for(let r=0;r<capped && left>0;r++) for(let c=0;c<shown && left>0;c++){
    const cell = el("div","gcell");
    cell.style.left=(c*(S+GAP))+"px"; cell.style.top=(r*(S+GAP))+"px";
    cell.style.width=S+"px"; cell.style.height=S+"px";
    hold.appendChild(cell); left--;
  }
  wrap.appendChild(hold);
  if(rows>capped) wrap.appendChild(el("div","hint",
    "&hellip;and " + (rows-capped) + " more rows"));
  return wrap;
}

/* TALL AND WIDE AND NOTHING ELSE. Every pack is a shape now - there is
   no arithmetic left for one to fall back to, and a bare count is a
   thing the file still READS rather than a thing this page offers.

   IT REDRAWS ITSELF RATHER THAN THE PAGE. The count, the warning and
   the picture all follow the two boxes, and the obvious way to keep
   them in step - renderPane() on change - takes the cursor out of the
   box you are typing in and only catches up when you leave it. So the
   three of them are held and rewritten in place, and typing 11 into
   Wide says so on the 11 rather than on the way out. */
function packSizeControls(c, size, put){
  let h = size ? (size.h || Math.max(1, Math.ceil(size.cells/(size.cols||PACK_ROOM)))) : 10;
  let w = size ? (size.cols || PACK_ROOM) : PACK_ROOM;

  const row = el("div","grid2");
  const th = el("input"); th.type="number"; th.min=1; th.max=60; th.value=h;
  const tw = el("input"); tw.type="number"; tw.min=1; tw.max=20; tw.value=w;
  /* TALL FIRST, and the labels say so in words rather than showing
     "12x7" and hoping. Every size in these two mods reads this way - a
     rig pocket's 2x1 is two down and one across - and one place that
     read the other way is how a bag comes out sideways. */
  field(row, "Tall", "squares down", th);
  field(row, "Wide", "squares across", tw);
  c.appendChild(row);

  const tally = el("div","hint");
  const warn = el("div","warn");
  const shown = el("div");
  c.appendChild(tally); c.appendChild(warn); c.appendChild(shown);

  const paint = ()=>{
    tally.innerHTML = (h*w) + " squares in all.";
    if(w > PACK_ROOM){
      warn.hidden = false;
      warn.innerHTML = "Wider than the bag column can show. The game keeps all "
        + (h*w) + " squares and lays them out " + PACK_ROOM
        + " across instead &mdash; so you get the room, but not the shape.";
    } else { warn.hidden = true; warn.innerHTML = ""; }
    shown.innerHTML = "";
    shown.appendChild(packPreview({ cells: h*w, cols: w }));
  };
  const push = ()=>{
    h = Math.max(1,Math.min(60,Math.round(Number(th.value)||1)));
    w = Math.max(1,Math.min(20,Math.round(Number(tw.value)||1)));
    put(h+"x"+w); paint();
  };
  th.oninput = push; tw.oninput = push;
  paint();
  return c;
}


/* ==========================================================
   ONE ITEM EDITOR, TWO TABS

     "this would be able to jsut change visual/grid size/crafting/etc
      besides what the Item does, so in hunting kit case i would be able
      to change it to not look like a backpack and fit this into
      inventory balance as a small tool that will sit in the inventory.
      Editing should kinda work like adapt but without overwriting what
      Item is and how it function."

     "change the backpack TAB to look like other Tabs, so it Has list on
      the left with added backpacks and ability to change their icons
      and how much slots they take in inventory as an Item etc all of
      it"

   Those two turned out to be one thing. A backpack IS an item: it has a
   picture, it takes up room in your bag, it costs money and it can be
   built at a workshop. The only thing that makes it a backpack is that
   it ALSO has an inside - a grid it gives you when you put it on.

   So there is one editor. The Backpacks tab is that editor plus one
   card; the Item editor tab is that editor without it.

   ADOPT, MINUS THE PART THAT MAKES A THING OURS. An adopted rig BECOMES
   this mod's rig - our keys, our install route, our refusal to sit in a
   pouch slot. An edited item is still exactly what it was. It has a
   different picture, takes a different amount of room, costs something
   different to build - and its class, its slot, its functors and
   everything else that decides what it DOES are never written.
   ========================================================== */
/* WHAT THE ITEM EDITOR MAY TOUCH, and it is short on purpose:

     "Item editor should not have 'new Item' we adopting existing Items
      and changing their look not properites so only options for Icon
      edit and name."

   So: the picture, and what it is called. The number of squares it
   fills travels with the picture because in this game they are one
   thing - inv_grid_width IS both how big the drawing is and how much
   room the item takes, and there is no way to change one without the
   other. */
const ITEMS_TAKE = [
  ["look",  "Its picture, and the squares it fills",
   "one setting, not two \u2014 the game draws the icon across the "
   + "squares the item takes"],
  ["name",  "What it is called", null]
];
/* A BACKPACK IS THE OTHER CASE. A new one is an item of this mod's own,
   from nothing, so it needs everything a thing we make needs. */
const PACK_TAKE_MORE = [
  ["look",  "Its picture, and the squares it fills",
   "how it looks sitting in your bag, before you put it on"],
  ["name",  "What it is called", null],
  ["price", "What it is worth, and what it weighs", null],
  ["craft", "What it costs to build", null]
];
/* ...and the Backpacks tab has a fourth, which is the whole reason that
   tab exists. */
const PACK_TAKE = ["size", "How much room it gives you",
                   "the grid you get when you put it on"];

const WORKSHOP_CATS = [
  [1, "1 — devices"], [2, "2 — equipment"], [3, "3 — repair"],
  [4, "4 — upgrades"], [5, "5 — medical"], [6, "6 — ammunition"]
];

/* Sections worth offering under the box. Not a closed list - it takes
   whatever is typed - but a name that is not in your install writes a
   block the game skips in silence, so a pick beats a spelling. */
const ITEM_HINTS = ["kit_hunt", "itm_actor_backpack", "itm_sleepbag",
  "swiss_knife", "itm_basickit", "itm_advancedkit", "itm_expertkit",
  "device_torch_dummy", "detector_simple", "hand_radio"];

function isPackTab(){ return TAB === "packs"; }

/* ---------------- the model, and a save from before it ----------------

   The Backpacks page began as the three blocks of a config file - a
   default, a by-kind list and a by-section list. A pack is an item with
   a page now, so the bench holds a list of them. A save written by the
   older page is still a save, so it is turned into the new shape once,
   here, on the way in. */
function migratePacks(){
  DB.packDefault = DB.packDefault || "10x7";
  DB.packKinds = DB.packKinds || {};
  const p = DB.packs;
  if(Array.isArray(p)) return;
  if(!p){ DB.packs = []; return; }
  if(p.scale && p.scale.size) DB.packDefault = p.scale.size;
  Object.keys(p.kind||{}).forEach(k=>{ DB.packKinds[k] = p.kind[k]; });
  DB.packs = Object.keys(p.sec||{}).map(id=>({
    id: id, name: id, adopt: true, own: { size: true }, size: p.sec[id],
    cellw: 2, cellh: 2, icon: null, cost: 0, weight: 0
  }));
}

/* THE FILE IS THE TRUTH FOR A PACK NOBODY EDITED. Same rule as the
   container families: a newer mod may change a pack's line and your
   save may hold one the mod has never seen, so the file is read and
   what you actually touched is laid over it by name. */
function wirePacks(F){
  migratePacks();
  const read = EMIT.readPacks(F[PACKS_PATH] || "");
  DB.packEdited = DB.packEdited || {};
  if(!DB.packEdited["default"]) DB.packDefault = read.scale.size;

  const have = {};
  DB.packs.forEach(x=>{ have[x.id] = x; });
  Object.keys(read.sec).forEach(id=>{
    /* ...AND ONE YOU DELIBERATELY TOOK OFF THE LIST STAYS OFF. */
    if(!have[id] && DB.packEdited["gone:"+id]) return;
    if(!have[id]){
      DB.packs.push({ id, name:id, adopt:true, own:{ size:true },
        size: read.sec[id], cellw:2, cellh:2, icon:null, cost:0, weight:0 });
    } else if(!DB.packEdited[id]){
      have[id].size = read.sec[id];
    }
  });
  Object.keys(read.kind).forEach(k=>{
    if(DB.packEdited["kind:"+k]) return;
    DB.packKinds[k] = read.kind[k];
  });
  DB.items = DB.items || [];
}

function packMark(it){ DB.packEdited[it.id] = true; }

/* ---------------- the page ---------------- */
function drawItemPage(P, it){
  const pack = isPackTab();
  const own = it.own = it.own || {};

  P.appendChild(el("h1", null, esc(it.name || it.id || "—")));
  TITLE_NODE = P.lastChild;

  /* ---------------- what it is ---------------- */
  P.appendChild(el("div","sect","What it is"));
  const c0 = el("div","card");
  const g = el("div","grid2");
  field(g, "Name", it.adopt && !own.name
    ? "for your own list \u2014 the item keeps its real name until the "
      + "tick below is on"
    : "what you see in the bag", txt(it,"name",{title:true,live:true}));
  /* isid, AND IT IS NOT A NICETY. The selection is by id, so changing
     the id orphans it - typing a section name made the whole editor
     vanish mid-word, because cur() looked for an id nothing had any
     more. The other three pages learned this the same way. */
  const idBox = txt(it,"id",{isid:true,live:true,title:true});
  idBox.className = "mono";
  if(it.adopt) idBox.setAttribute("list","itemhints");
  field(g, "Section", it.adopt
    ? "the item's own name in the files" : "this mod's name for it", idBox);
  c0.appendChild(g);

  if(it.adopt && !document.getElementById("itemhints")){
    const dl=el("datalist"); dl.id="itemhints";
    ITEM_HINTS.forEach(v=>{ const o=el("option"); o.value=v; dl.appendChild(o); });
    c0.appendChild(dl);
  }

  if(it.newItem){
    const par = txt(it,"parent"); par.className="mono";
    par.setAttribute("list", pack ? "packhints" : "itemhints");
    field(c0, "Built from", "a real item it inherits everything from, so "
      + "the game knows what to do with it", par);
    if(pack && !document.getElementById("packhints")){
      const dl=el("datalist"); dl.id="packhints";
      PACK_HINTS.forEach(([v])=>{ const o=el("option"); o.value=v; dl.appendChild(o); });
      c0.appendChild(dl);
    }
    c0.appendChild(el("div","hint",
      "A new item is a section that does not exist yet, so it has to be "
      + "made <i>out of</i> one that does. Everything it does not say for "
      + "itself comes from there."));
  }
  P.appendChild(c0);

  /* ---------------- what we take over ---------------- */
  if(it.adopt){
    P.appendChild(el("div","sect","What to take over"));
    const c1 = el("div","card");
    c1.appendChild(el("div","note",
      "<b>This never changes what the item is or what it does.</b> No "
      + "class, no slot, no right-click menu, nothing about what it "
      + "heals or shoots or opens. Only the things ticked below are "
      + "written, and everything else is left exactly as whoever wrote "
      + "the item left it."));
    const takes = pack ? [PACK_TAKE].concat(PACK_TAKE_MORE) : ITEMS_TAKE;
    takes.forEach(([key,label,hint])=>{
      const l = el("label","tick");
      l.innerHTML = '<input type="checkbox"'+(own[key]?" checked":"")+'>'
        + '<span>'+esc(label)+(hint?' <em>'+esc(hint)+'</em>':"")+'</span>';
      l.querySelector("input").onchange = e=>{
        own[key] = e.target.checked; if(pack) packMark(it);
        touch(); renderPane(); };
      c1.appendChild(l);
    });
    P.appendChild(c1);
  }

  /* ---------------- the inside (backpacks only) ---------------- */
  if(pack && (it.newItem || own.size)){
    P.appendChild(el("div","sect","How much room it gives you"));
    const c2 = el("div","card");
    c2.appendChild(el("div","hint",
      "The grid you get when you put it on. <b>Weight has nothing to do "
      + "with it</b> &mdash; how much a pack lets you carry is a separate "
      + "limit and the game goes on applying it."));
    packSizeControls(c2, EMIT.packSize(it.size) || EMIT.packSize(DB.packDefault),
      v=>{ it.size = v; packMark(it); touch(); });
    P.appendChild(c2);
  }

  /* ---------------- how it looks ----------------

     ALWAYS DRAWN, NOT HIDDEN BEHIND ITS OWN TICK.

       "backpack tab lacs ability to edit/add textures"

     It was never missing. It was behind a tick in a list of five, worded
     "its picture, and the squares it fills", and a tick you have to find
     before the thing appears is a thing that is not there.

     DROPPING A PICTURE IS THE DECISION. The tick still exists and still
     means the same - it is what decides whether this mod writes those
     lines - but you turn it on by giving the item a picture rather than
     by promising to. */
  if(true){
    P.appendChild(el("div","sect","Its picture, and the squares it fills"));
    const c3 = el("div","card");
    if(it.adopt && !own.look) c3.appendChild(el("div","hint",
      "Drop a picture in and this gets written; until then the item keeps "
      + "the one it has and nothing about its look is touched."));
    const row = el("div","grid2");
    /* THE PICTURE FOLLOWS THE SIZE, and only the picture - re-rendering
       the pane on every keystroke would take the cursor out of the box
       being typed in. */
    const repaint = ()=>ICOPAINT.forEach(f=>f());
    field(row, "Squares down", "in your bag",
      num(it,"cellh",{min:1,max:8,int:true,after:repaint}));
    field(row, "Squares across", "in your bag",
      num(it,"cellw",{min:1,max:8,int:true,after:repaint}));
    c3.appendChild(row);
    c3.appendChild(iconWell(it, "the picture, on this mod's own sheet"));
    if(!it.icon) c3.appendChild(el("div","hint",
      "With no picture the size is still written &mdash; that is the half "
      + "of this that is about balance rather than art. The item keeps "
      + "the picture it has."));
    P.appendChild(c3);
  }

  /* ---------------- what it is worth ----------------
     BACKPACKS ONLY. An ordinary item is having its look changed, not
     its place in the economy. */
  if(pack && (it.newItem || own.price)){
    P.appendChild(el("div","sect","What it is worth"));
    const c4 = el("div","card");
    const row = el("div","grid2");
    field(row, "Price", "RU", num(it,"cost",{min:0,max:999999}));
    field(row, "Weight", "kg", num(it,"weight",{min:0,max:200,step:0.01}));
    c4.appendChild(row);
    P.appendChild(c4);
  }

  /* ---------------- what it costs to build ---------------- */
  if(pack && (it.newItem || own.craft)){
    it.craft = it.craft || { cat: pack ? 2 : 2, kit: 1,
                             book: "recipe_basic_0",
                             parts: [["sewing_thread", 4]] };
    if(it.craft.cat == null) it.craft.cat = 2;
    P.appendChild(el("div","sect","What it costs to build"));
    const c5 = el("div","card"); c5.style.maxWidth="640px";
    c5.appendChild(el("div","hint",
      "The workshop is six lists and a recipe has to be in the right one, "
      + "or it lands in the wrong tab of the bench."));
    field(c5, "Which list", null, pick(it.craft,"cat",WORKSHOP_CATS,{redraw:true}));
    P.appendChild(c5);
    itemCraftRows(P, it);
  }

  /* ---------------- and away ---------------- */
  const foot = el("div"); foot.style.marginTop="18px";
  const rm = el("button","tool", it.adopt && !it.newItem
    ? "Stop editing this one" : "Remove it");
  rm.onclick = ()=>{
    if(!confirm("Remove " + (it.name||it.id||"this") + "?")) return;
    const arr = DB[TAB], i = arr.indexOf(it);
    if(i >= 0) arr.splice(i,1);
    if(pack){ DB.packEdited["gone:"+it.id] = true; packMark(it); }
    SEL[TAB] = arr[0] && arr[0].id;
    touch(); render();
  };
  foot.appendChild(rm);
  if(it.adopt && !it.newItem) foot.appendChild(el("div","hint",
    "It goes back to being exactly what its own mod made it."));
  P.appendChild(foot);
}

/* The ingredient rows, sharing the craft card's shape without its
   rig-and-pouch reasoning - an item has nothing underneath it to be
   worked out from. */
function itemCraftRows(P, it){
  if(modernRecipe(P,it,'craft'))return;
  const c0 = it.craft;
  const c = el("div","card"); c.style.maxWidth="640px";
  const g = el("div","grid2");
  field(g,"Toolkit you must carry",null,pick(c0,"kit",CRAFT_KITS,{redraw:true}));
  field(g,"Book you must have read",null,pick(c0,"book",CRAFT_BOOKS,{str:true,redraw:true}));
  c.appendChild(g);

  const tb = el("table","ingr");
  tb.innerHTML="<thead><tr><th>Ingredient</th><th class='n'>Count</th><th></th></tr></thead>";
  const body = el("tbody");
  const code = document.createElement("code");
  const say = ()=>{ code.textContent = "x_" + (it.id||"") + " = " + c0.kit + ", "
    + c0.book + "," + c0.parts.map(r=>r[0]+","+r[1]).join(","); };
  c0.parts.forEach((row,i)=>{
    const tr=el("tr"), td1=el("td"), td2=el("td","n"), td3=el("td","n");
    const sec=document.createElement("input"); sec.type="text"; sec.value=row[0]||"";
    sec.className="mono"; sec.setAttribute("list","ingrhints");
    sec.onchange=()=>{ row[0]=sec.value.trim(); say(); touch(); renderPane(); };
    td1.appendChild(sec);
    const n=document.createElement("input"); n.type="number"; n.min=1; n.value=row[1]||1;
    n.style.width="80px";
    n.oninput=()=>{ row[1]=Math.max(1,Math.round(Number(n.value)||1)); say(); touch(); };
    td2.appendChild(n);
    const x=el("button","tool","×");
    x.onclick=()=>{ c0.parts.splice(i,1); touch(); renderPane(); };
    td3.appendChild(x);
    tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
    body.appendChild(tr);
  });
  tb.appendChild(body); c.appendChild(tb);

  const add=el("button","tool","+ another ingredient");
  add.style.marginTop="8px";
  if(c0.parts.length >= MAX_ING){
    add.disabled = true; c.appendChild(add);
    c.appendChild(el("div","note",
      "Four is the ceiling. The workshop reads at most four ingredients and "
      + "throws the whole recipe away if there are more &mdash; without "
      + "saying so, which is why this stops here."));
  } else {
    add.onclick=()=>{ c0.parts.push(["sewing_thread",4]); touch(); renderPane(); };
    c.appendChild(add);
  }
  const pv=el("div","hint");
  pv.appendChild(document.createTextNode("The line this writes:"));
  pv.appendChild(document.createElement("br"));
  say(); IDECHO.push(say);
  pv.appendChild(code); c.appendChild(pv);
  P.appendChild(c);
}

/* ---------------- the two lists' own bits ---------------- */
function drawPacksExtra(P){
  P.appendChild(el("div","sect","What a pack nobody has listed is"));
  const dc = el("div","card");
  dc.appendChild(el("div","hint",
    "Every backpack in the game that is not in the list on the left, and "
    + "every one from a mod nothing here has heard of. There is no sum to "
    + "make them differ, so they are all this size &mdash; and the game "
    + "names each one in the log as it turns up, which is how you find out "
    + "what is worth adding."));
  packSizeControls(dc, EMIT.packSize(DB.packDefault),
    v=>{ DB.packDefault = v; DB.packEdited["default"] = true; touch(); });
  P.appendChild(dc);

  const kinds = Object.keys(DB.packKinds || {});
  P.appendChild(el("div","sect","…or a whole kind at once"));
  const kc = el("div","card");
  kc.appendChild(el("div","hint",
    "<code>kind</code> is the game's own word for what a thing is. A kind "
    + "here beats the default and loses to any pack in the list."));
  kinds.forEach(k=>{
    const row = el("div","grid2");
    field(row, esc(k), null, (()=>{ const i=el("input"); i.type="text";
      i.className="mono"; i.value=DB.packKinds[k];
      i.onchange=()=>{ DB.packKinds[k]=i.value.trim();
        DB.packEdited["kind:"+k]=true; touch(); }; return i; })());
    const x = el("button","tool","remove");
    x.onclick=()=>{ delete DB.packKinds[k]; DB.packEdited["kind:"+k]=true;
      touch(); renderPane(); };
    field(row, " ", null, x);
    kc.appendChild(row);
  });
  const kb = el("input"); kb.type="text"; kb.placeholder="i_backpack";
  field(kc, "Add a kind", null, kb);
  const kgo = el("button","tool","Add it");
  kgo.onclick = ()=>{
    const id = String(kb.value||"").trim();
    if(!/^[\w.]+$/.test(id)) return;
    DB.packKinds[id] = DB.packDefault;
    DB.packEdited["kind:"+id] = true; touch(); renderPane();
  };
  kc.appendChild(kgo);
  P.appendChild(kc);
}

/* ==========================================================
   THE INVENTORY LAYOUT EDITOR IS NOT IN THIS BENCH

   It was about sixty-six thousand characters of page, plus its own
   findings on the Check tab, and all of it is gone rather than merely
   unreachable.

   NOT ONLY BECAUSE IT WAS ASKED FOR. It was the one part of this bench
   that wrote gamedata/configs/ui/ui_inventory.xml, and a ui xml is a
   WHOLE FILE: there is no DLTX for menus, so whichever mod ships one
   last wins it entire, and half a dozen mods in a GAMMA install ship
   one. A bench that cannot write that file cannot break anybody's menu
   by accident - which is also why there used to be two html files, one
   with the editor and one without. There is one now, and it is the
   safe one.

   The functions the BUILD used to ask - is there a layout, does it need
   a sheet, a background picture - are answered here, once, with no.
   Kept as answers rather than deleted so that the build's own code is
   untouched by this removal: a file it never writes is a file that
   cannot be written wrong.
   ========================================================== */
function layoutFile(){ return null; }
function layoutSheetJobs(){ return []; }
function layoutSheetName(){ return EMIT.LAYOUT_SHEET; }
function layoutSheetHave(){ return null; }
function layoutFindings(){ }

/* ==========================================================
   CHECK
   ========================================================== */
function drawCheck(P){
  P.appendChild(el("h1",null,"Anything that looks wrong"));
  const f = checkFindings();
  const box=(title,list,cls)=>{
    const c=el("div","card"); c.style.marginBottom="16px";
    c.appendChild(el("div","sect",title));
    if(!list.length) c.appendChild(el("div",null,
      '<span class="ok">&#10003;</span> nothing'));
    else for(const m of list) c.appendChild(el("div",cls,m));
    P.appendChild(c);
  };
  box("Will not work", f.bad, "warn");
  box("Worth a look", f.soft, "note");
}

/* ONE PLACE THAT DECIDES WHAT IS WRONG. The Check page shows it and
   the Build page refuses to build over it, and those two disagreeing
   would be the worst of both. */
/* ==========================================================
   WHAT COMPARTMENTS CAN BE WRONG ABOUT

   The silent one is last and is the reason the others are here at all:
   a container whose family promises a kind of thing that will not fit
   in any of its compartments. Nothing about that looks broken. The box
   opens, the tooltip says what it takes, and every one of them is
   refused at the cursor - which is exactly the shape of bug this whole
   feature exists to make impossible, arrived at from the other side.
   ========================================================== */
function slotFindings(bad, soft){
  for(const b of DB.boxes||[]){
    const list = Array.isArray(b.slots) ? b.slots : [];
    if(!list.length) continue;
    const nm = "<b>" + esc(b.name || b.id) + "</b>";

    if(b.fan || b.case)
      bad.push(nm + " has compartments and is also a "
        + (b.fan ? "fan of paper" : "lead-lined case")
        + ". Those are different shapes and the window cannot be drawn "
        + "both ways.");

    /* THE CEILING IS THE DRAWING, not the data. Every compartment is
       its own pair of windows, and in this engine a window that exists
       is walked every frame whether or not it changed. */
    if(list.length > 36)
      bad.push(nm + " has " + list.length + " compartments. Thirty-six "
        + "is the most &mdash; each one is drawn as its own little "
        + "window and they all cost something every frame.");

    let off = 0, over = 0;
    list.forEach((s,i)=>{
      if(s.c < 1 || s.r < 1 || s.c + s.w - 1 > (b.inw||1)
         || s.r + s.h - 1 > (b.inh||1)) off++;
      for(let j = i + 1; j < list.length; j++){
        const e = list[j];
        const apart = (s.c + s.w - 1 < e.c) || (e.c + e.w - 1 < s.c)
                   || (s.r + s.h - 1 < e.r) || (e.r + e.h - 1 < s.r);
        if(!apart) over++;
      }
    });
    if(off) bad.push(nm + " has " + off + " compartment"
      + (off===1?"":"s") + " hanging off the edge of its grid.");
    if(over) bad.push(nm + " has compartments lying on top of each "
      + "other. The game reads them in order and drops the later one.");

    /* ...AND THE ONE THAT LOOKS FINE. `no` is the sentence the family
       already uses to say what it takes, so it is what gets quoted
       back: this is that promise measured against the shape. */
    const fam = (DB.families||{})[b.takes];
    if(fam){
      const big = list.reduce((m,s)=>Math.max(m, s.w*s.h), 0);
      const wide = ["guns","rigs"].filter(k=>fam[k]);
      if(big <= 1 && wide.length)
        bad.push(nm + " takes one square at a time and says it accepts "
          + wide.join(" and ") + " &mdash; and there is nothing of "
          + "either kind in the game that stands on one square. It "
          + "would promise them and refuse every one.");
      else if(big <= 2 && fam.guns)
        soft.push(nm + " accepts weapons and its biggest compartment "
          + "is " + big + " squares. <small>Pistols will go in and "
          + "nothing else will. That may be the whole idea &mdash; it "
          + "is how you make a pistol case &mdash; but the tooltip "
          + "will say &ldquo;weapons&rdquo;.</small>");
    }
  }

  /* ...AND A SECTION THE MOD HAS NOT GOT. A borrowed box is the game's
     own section with our keys added to it; if the mod's file no longer
     carries it, there is nothing to add them to, and inventing one is
     what crashed a game on startup with "[DLTX] Duplicate section
     'cash'". Said here so it is a line on a page rather than a fatal
     error two minutes into loading. */
  for(const b of DB.boxes||[]){
    if(!b.borrowed) continue;
    const there = (SEED.boxes||[]).some(x => x.id === b.id);
    if(!there) bad.push("<b>" + esc(b.name || b.id) + "</b> is the game's "
      + "own <code>" + esc(b.id) + "</code>, and this mod no longer "
      + "touches it. It will be left out of the build &mdash; take it "
      + "off the list.");
  }

  /* AND WHAT THE ITEM EDITOR LEFT BEHIND. Its page is gone; a file
     saved before it went may still carry items, and they are still
     built. Said rather than deleted: quietly dropping somebody's work
     is worse than quietly keeping it, and quietly keeping it is worse
     than saying so. */
  const n = (DB.items||[]).length;
  if(n) soft.push(n + " item" + (n===1?"":"s") + " from the old item "
    + "editor " + (n===1?"is":"are") + " still in this file and still "
    + "being built. <small>There is no longer a page to edit them on. "
    + "If you want them gone, say so and I will take them out.</small>");
}

function checkFindings(){
  const bad=[], soft=[];
  layoutFindings(bad, soft);
  slotFindings(bad, soft);
  const seen={};
  for(const kind of ["rigs","pouches","boxes"])
    for(const it of DB[kind]){
      if(seen[it.id]) bad.push("Two things are called <code>"+esc(it.id)+"</code>.");
      seen[it.id]=1;
      if(!/^[a-z][a-z0-9_]*$/.test(it.id))
        bad.push("<code>"+esc(it.id)+"</code> is not a section name the game will take "
          +"&mdash; lower case letters, digits and underscores only.");
      /* A SECTION NAME IS A CLAIM ON A NAMESPACE. `af_magpouch_t` looks
         reasonable and is the magazine mod's prefix: if they ever ship
         a pouch by that name, two mods declare one section and the game
         will not start. The mod's own audit refuses any section outside
         its prefixes for exactly this reason, so a build with one in it
         is a build that fails its own check. */
      const want = { rigs:"amprig_", pouches:"amppouch_", boxes:"ampbox_" }[kind];
      // AN ADOPTED ITEM IS SUPPOSED TO HAVE A FOREIGN NAME. The whole
      // point of it is to name a section somebody else defined.
      if(it.new && !it.adopt && want && it.id.indexOf(want) !== 0)
        bad.push("<code>"+esc(it.id)+"</code> has to begin <code>"+want+"</code>. "
          +"That prefix is how this mod's sections are told apart from every "
          +"other mod's &mdash; <code>af_magpouch_</code> in particular belongs "
          +"to the magazine mod, and two mods declaring one section is a game "
          +"that will not start.");
      if(!it.name || !it.name.trim())
        bad.push("<code>"+esc(it.id)+"</code> has no name.");
      /* IT DOES NOT BORROW ONE. This used to say it would, which was
         true when a new item was a note in a save for me to draw. The
         Build page draws the sheet itself now, and an item with no
         picture is drawn with nothing - a blank rectangle where the
         icon goes. Said plainly, because the mod's own audit calls it
         a failure and somebody should know why before they see it. */
      if(it.new && !it.icon && (!it.adopt || it.own?.look))
        soft.push("<b>"+esc(it.name||it.id)+"</b> has no picture. It will "
          +"build and work, and it will be a blank square in your bag until "
          +"you drop a PNG on it.");
    }
  /* A CONTAINER THAT TAKES NOTHING IS A CONTAINER THAT DOES NOTHING,
     and it does it silently: the game starts, the box opens, and
     everything you try to put in it comes straight back out with a
     message. Neither of these stops a build - the mod handles both
     without complaint - so they are worth a look rather than wrong. */
  const usedFam = {};
  for(const b of (DB.boxes||[])){
    const t = b.takes || "any";
    if(t==="any" || t==="anything") continue;
    usedFam[t]=1;
    if(!DB.families[t])
      soft.push("<b>"+esc(b.name||b.id)+"</b> goes by a rule called <code>"
        + esc(t)+"</code> and nothing describes one. It will take anything "
        + "at all.");
  }
  for(const n of Object.keys(usedFam)){
    const f = DB.families[n]; if(!f) continue;
    if(!(f.kinds||[]).length && !(f.also||[]).length
       && !f.ammo && !f.mags && !f.guns && !f.rigs)
      soft.push("The <code>"+esc(n)+"</code> rule says nothing about what it "
        + "takes, so anything put in will be refused. Name a kind, or name "
        + "the items outright.");
  }
  /* A RECIPE THE WORKSHOP WILL NOT READ. ui_workshop parses each line
     into at most four ingredients and drops the whole recipe if there
     are more - saying nothing, so the pouch simply never appears in
     the workshop. The editor stops at four, but a save made elsewhere
     or an item somebody sent could carry five. */
  for(const p of DB.pouches||[]){
    if(!(ourPouch(p) || (p.adopt && EMIT.owns(p,"craft")))) continue;
    const n = EMIT.pouchCraftFields(p);
    if(n > 10) bad.push("<b>"+esc(p.name||p.id)+"</b> has a recipe with more "
      + "than four ingredients. The workshop throws that whole recipe away "
      + "without saying so, and the pouch cannot be built at all.");
    const parts = (p.craft && p.craft.parts) || [];
    if(parts.length && !parts.some(r=>r && r[0] && Number(r[1])>0))
      bad.push("<b>"+esc(p.name||p.id)+"</b> has a recipe with nothing in it.");
    for(const r of parts)
      if(r && r[0] && !/^[a-z][a-z0-9_]*$/.test(r[0]))
        soft.push("<b>"+esc(p.name||p.id)+"</b> is built from <code>"+esc(r[0])
          + "</code>, which is not a section name the game will take. If nothing "
          + "is called that, the recipe cannot be finished.");
  }
  /* THE RULES THE GAME PUTS ON COMPONENTS, from the head of parts.ltx.
     A list that breaks one of them is not a list with a mistake in it -
     the whole thing is refused, and the rig has no dots and nothing to
     swap, saying nothing about why. */
  for(const r of DB.rigs){
    if(r.adopt && !EMIT.owns(r,"repair")) continue;
    const c = r.parts || [];
    const dup = c.filter((x,i)=>c.indexOf(x)!==i);
    if(dup.length) bad.push("<b>"+esc(r.name||r.id)+"</b> lists <code>"
      + esc(dup[0])+"</code> twice as a component. A repeat is one slot "
      + "written twice, not two components, and the game refuses the list.");
    if(c.length > EMIT.PART_MAX) bad.push("<b>"+esc(r.name||r.id)+"</b> has "
      + c.length + " components. Six is the ceiling.");
    for(const x of c){
      if(x.indexOf("prt_o_") !== 0) bad.push("<b>"+esc(r.name||r.id)+"</b> is "
        + "made of <code>"+esc(x)+"</code>, which carries no condition of its "
        + "own. Only <code>prt_o_</code> parts can be components; hardware "
        + "belongs in what it breaks down into.");
      else if(EMIT.KNOWN_PARTS.indexOf(x) < 0) soft.push("<b>"
        + esc(r.name||r.id)+"</b> is made of <code>"+esc(x)+"</code>, which is "
        + "not a section the reference install has.");
    }
    for(const x of (r["yield"]||[]))
      if(/magpouch/.test(x)) soft.push("<b>"+esc(r.name||r.id)+"</b> breaks "
        + "down into <code>"+esc(x)+"</code>. Craft a rig, break it, keep the "
        + "pouches &mdash; that would be the cheapest pouch in the game.");
  }
  /* A REPAIR TYPE NOBODY CLAIMS IS A RIG NOBODY CAN MEND, and it fails
     by simply never appearing in a repair window. */
  for(const r of DB.rigs){
    if(r.adopt && !EMIT.owns(r,"repair")) continue;
    if(r.repair && REPAIRS.every(x=>x[0]!==r.repair))
      soft.push("<b>"+esc(r.name||r.id)+"</b> is mended as <code>"+esc(r.repair)
        + "</code>, which is not one of the five the pack uses. If no repair "
        + "kit names it, nothing will mend that rig.");
  }
  /* A POUCH OF OURS IS A REAL ITEM NOW, so the only thing left to say
     about one is the same thing that is said about a new rig: it will
     be a blank square until it has a picture. NOT FOR A NEW ONE - the
     loop above says exactly that already, and saying it twice in the
     same list reads as two problems. */
  for(const p of EMIT.ourPouches(DB)){
    if(!p.icon && !p.new) soft.push("<b>"+esc(p.name||p.id)+"</b> has no "
      + "picture. It will build and work; it will be a blank square in your bag.");
    if(cellsOf(p.grants||{})===0)
      bad.push("<b>"+esc(p.name||p.id)+"</b> grants nothing. A pouch that "
      + "adds no squares is a pouch there is no reason to fit.");
  }
  for(const r of DB.rigs){
    if(!cellsOf(r.slots)) bad.push("<b>"+esc(r.name)+"</b> has no pockets at all.");
    const band=r.band||0;
    for(const p of (r.pins||[])){
      const [h,w]=SHAPE[p.kind];
      if(p.col+w-1>band)
        bad.push("<b>"+esc(r.name)+"</b> has a pocket hanging off the right edge.");
      if(p.row+h-1>Math.max(1,Math.min(MAXD,r.rows||ROWS)))
        bad.push("<b>"+esc(r.name)+"</b> has a pocket hanging off the bottom.");
    }
    if((r.pins||[]).length && cellsOf(r.slots)===0)
      bad.push("<b>"+esc(r.name)+"</b>: drawn pockets do not add up.");
    if(!r.descr || !r.descr.trim())
      soft.push("<b>"+esc(r.name)+"</b> has no description.");
  }
  /* A SHEET IS 2048 PIXELS AND THAT IS ALL IT IS.
     Sizes are yours to set, but sixteen rigs at three cells by five
     want more room than one sheet has - and the packer's only other
     option is to leave one out, which would ship a rig with no picture
     and nothing said about it. So it reports what it could not place
     and the build stops here. */
  for(const [kind,label] of [["rigs","rig"],["boxes","container"],["pouches","pouch"]]){
    const plan = sheetPlans()[kind];
    if(plan && plan.overflow && plan.overflow.length)
      bad.push("At these sizes the " + label + " picture sheet has no room for <b>"
        + plan.overflow.map(id=>{
            const it=(DB[kind]||[]).find(x=>x.id===id);
            return esc((it && it.name) || id);
          }).join("</b>, <b>") + "</b>. Make something smaller &mdash; a sheet "
        + "is 2048 pixels square and every picture has to fit on it.");
  }

  /* THE PRICE LADDER, exactly as the build checks it. Rigs inside a
     tier are deliberately priced by what they are FOR rather than by
     size, so there are three points of slack - more than a 2x1 and
     less than a 3x1, which is enough to let the Cordon's drum pockets
     cost more than the Barakholka's wider strap and not enough to hide
     a rig priced a whole slot out of place. Reported per RIG, not per
     pair, because one rig priced wrong against six others is one
     problem and reads as six. */
  const worst={};
  for(const a of DB.rigs) for(const b of DB.rigs){
    if(worthOf(a.slots)+LADDER_SLACK<=worthOf(b.slots) && (a.cost||0)>(b.cost||0)){
      const gap=(a.cost||0)-(b.cost||0);
      if(!worst[a.id] || gap>worst[a.id].gap) worst[a.id]={a,b,gap};
    }
  }
  for(const k in worst){
    const {a,b}=worst[k];
    soft.push("<b>"+esc(a.name)+"</b> costs more than <b>"+esc(b.name)
      +"</b> and holds less &mdash; "+worthOf(a.slots).toFixed(1)+" points at "
      +fmt(a.cost)+" RU against "+worthOf(b.slots).toFixed(1)+" at "+fmt(b.cost)
      +". Check whether this price is intentional.");
  }
  for(const r of DB.rigs){
    const w=worthOf(r.slots); if(!w) continue;
    const per=r.cost/w;
    if(per<LO_RU || per>HI_RU)
      soft.push("<b>"+esc(r.name)+"</b> is "+Math.round(per)+" RU a point; the "
        +"build wants between "+LO_RU+" and "+HI_RU+" (so "
        +fmt(Math.round(w*LO_RU/50)*50)+" to "+fmt(Math.round(w*HI_RU/50)*50)+" RU).");
  }
  for(const b of DB.boxes){
    if(b.borrowed) continue;
    const inside=b.inw*b.inh, outside=b.cellw*b.cellh;
    if(inside<=outside)
      soft.push("<b>"+esc(b.name)+"</b> holds "+inside+" squares and takes up "
        +outside+" &mdash; there is no reason to carry it.");
  }

  return { bad: dedupe(bad), soft: dedupe(soft) };
}

function dedupe(a){ return [...new Set(a)]; }

/* ==========================================================
   NOTES
   ========================================================== */
function drawProjectReset(P){
  const c=el("section","card");
  c.appendChild(el("h2",null,"Reset local item customizations"));
  c.appendChild(el("p","hint","Restore the original Squared Away items and settings in this browser. This removes your custom items, imported items, and edits to layouts, textures, prices, crafting and other project settings."));
  c.appendChild(el("p","hint","This does not delete your account, sign you out, or remove your published add-ons. Downloaded project files and installed game files are unchanged."));
  const backup=el("button","tool","Save project backup");
  backup.onclick=()=>document.querySelector('#btnSave').click();
  c.appendChild(backup);
  const wipe=el("button","danger","Reset item customizations");
  wipe.style.marginLeft="8px";
  wipe.onclick=async()=>{
    if(!confirm("Reset this browser's item customizations to the original Squared Away defaults?\n\nYour custom and imported items and project edits will be removed. Save a project backup first if you want to keep them.\n\nYour account and published add-ons will NOT be deleted.")) return;
    clearTimeout(KEEP_T);
    await keepClear();
    fresh(); touch(); render();
  };
  c.appendChild(wipe);
  P.appendChild(c);
}

/* ==========================================================
   BUILD IT

   The bench writes the mod's own files. Not all of them - anything
   that needs a line of the script changed cannot come out of a page in
   a browser - and the part of this that matters is that it says which
   is which, by name, before you press anything.

   A PATCH, NOT A MOD. What comes out goes over the Squared Away you
   already have: only the files the bench owns are in it, because the
   ones it does not own include a sixty-megabyte texture nobody wants
   to carry around inside an html file.
   ========================================================== */
const SCRIPT_PATH = "scripts/zzz_armor_mag_pouches.script";
const POUCH_PATH = "configs/mod_system_amp_pouches.ltx";
const ADOPT_PATH = "configs/mod_system_zzz_amp_adopted.ltx";
const LANGS = ["eng","rus","spa","ukr"];

/* What the bench cannot do on its own, said plainly. Each of these is
   a change to the mod's Lua, which is not a value in a file - it is
   behaviour, and behaviour is where a page in a browser stops. */
function beyondTheBench(){
  const out = [];
  const named = (arr,what,why) => {
    if(arr.length) out.push({ what: what, who: arr, why: why });
  };
  // A NEW POUCH IS ALREADY LISTED BELOW AS LEFT OUT WHOLE, so naming
  // its drop chances as well is one problem reported twice.
  const newPouch = new Set(DB.pouches.filter(x=>x.new).map(x=>x.id));
  named(DB.rigs.concat(DB.pouches)
      .filter(x=>x.drop!=null && !newPouch.has(x.id)).map(x=>x.name||x.id),
    "drop chances set by hand",
    "The mod rolls a drop from the item's TIER. Giving one item its own "
    + "chances means teaching the script to look at the item first, which "
    + "is a change to how the roll works, not a number in a file.");
  named(DB.rigs.filter(x=>x.stash && x.stash!=="auto" && x.stash!=="none")
    .map(x=>x.name||x.id),
    "a stash rule of its own",
    "Which stashes hold which tier is the Stash Overhaul's own setting. "
    + "Pinning one rig against it needs the script to place it.");
  named(DB.rigs.filter(x=>x.craftNote!=null && String(x.craftNote).trim())
    .map(x=>x.name||x.id),
    "a recipe written by hand",
    "Recipes are worked out from the pockets. A different one is a "
    + "sentence for me to read, not something the bench can spell.");
  named(EMIT.ourPouches(DB).filter(x=>!x.icon).map(x=>x.name||x.id),
    "a pouch with no picture",
    "It will build and spawn and work, and it will be a blank square in "
    + "your bag until you drop a PNG on it.");
  return out;
}

function drawBuild(P){ return drawLegacyBuild(P); }
function drawLegacyBuild(P){
  P.appendChild(el('h1',null,'Export your add-on'));
  P.appendChild(el('p','hint','Review your project, check for issues, then download one ZIP for Mod Organizer 2.'));
  const findings=checkFindings();try{ZB.validate(DB);}catch(error){findings.bad.push(esc(error.message));}
  const beyond=beyondTheBench(),man=manifest();
  const nav=el('nav','export-steps');nav.setAttribute('aria-label','Export steps');P.appendChild(nav);
  const panels=['Review','Fix issues','Download'].map((name,i)=>{const section=el('section','card export-step');section.setAttribute('aria-label',name);P.appendChild(section);return section;});
  const buttons=[];function show(index){panels.forEach((p,i)=>p.hidden=i!==index);buttons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
  ['Review','Fix issues','Download'].forEach((name,i)=>{const b=el('button','tool',(i+1)+'. '+name);b.type='button';b.onclick=()=>show(i);nav.appendChild(b);buttons.push(b);});
  const review=panels[0];review.appendChild(el('h2',null,'1. Review your project'));
  const counts=el('div','export-summary');for(const [key,label] of [['rigs','Rigs'],['boxes','Containers'],['pouches','Pouches'],['packs','Backpacks']])counts.appendChild(el('div',null,'<strong>'+((DB[key]||[]).length)+'</strong><span>'+label+'</span>'));review.appendChild(counts);
  review.appendChild(el('p','hint','The ZIP contains configuration and selected assets. It requires Squared Away 2.0 and its matching custom engine.'));
  const files=el('details','export-files');files.appendChild(el('summary',null,'File review ('+man.length+')'));
  const table=el('table');table.innerHTML='<thead><tr><th>File</th><th>Contents</th></tr></thead>';const body=el('tbody');
  for(const f of man){const row=el('tr');row.appendChild(el('td','mono',esc(f.name)));row.appendChild(el('td',null,esc(f.stop||f.why||'Included unchanged')));body.appendChild(row);}table.appendChild(body);files.appendChild(table);review.appendChild(files);
  const next=el('button','tool primary','Check project →');next.onclick=()=>show(1);review.appendChild(next);
  const checks=panels[1];checks.appendChild(el('h2',null,'2. Check for issues'));
  checks.appendChild(el('p',findings.bad.length?'warn':'ok',findings.bad.length?findings.bad.length+' issue(s) must be fixed before downloading.':'No blocking issues. Your project can be exported.'));
  for(const m of findings.bad)checks.appendChild(el('div','warn',m));
  if(findings.soft.length){const warnings=el('details');warnings.appendChild(el('summary',null,findings.soft.length+' recommendation(s) — export is still allowed'));for(const m of findings.soft)warnings.appendChild(el('div','note',m));checks.appendChild(warnings);}
  if(beyond.length){const omitted=el('details');omitted.open=true;omitted.appendChild(el('summary',null,'Changes that will not be exported'));for(const b of beyond)omitted.appendChild(el('p','note','<b>'+esc(b.what)+'</b> '+b.who.map(esc).join(', ')+'<br>'+esc(b.why)));checks.appendChild(omitted);}
  const edit=el('button','tool','Return to Editor');edit.onclick=()=>Site.go('rigs');checks.appendChild(edit);
  const ready=el('button','tool primary','Continue to download →');ready.disabled=!!findings.bad.length;ready.onclick=()=>show(2);checks.appendChild(ready);
  const download=panels[2];download.appendChild(el('h2',null,'3. Download and install'));
  download.appendChild(el('p',null,'Install the exported ZIP as a separate MO2 mod below Squared Away and its optional patches. Enable only one ZoneBench export at a time.'));
  if(findings.bad.length)download.appendChild(el('p','warn','Fix the blocking issues in step 2 before downloading.'));
  const button=el('button','tool primary','Download add-on ZIP');button.disabled=!!findings.bad.length;download.appendChild(button);
  const status=el('p','hint');status.setAttribute('role','status');download.appendChild(status);
  button.onclick=async()=>{button.disabled=true;button.textContent='Preparing ZIP…';status.className='hint';
    try{ZB.validate(DB);if(checkFindings().bad.length)throw new Error('Your project has blocking issues. Return to step 2.');const result=await doBuild(message=>{status.textContent=message;});status.textContent='Downloaded '+result.count+' files ('+(result.size/1048576).toFixed(1)+' MB). Install this ZIP using the instructions above.';}
    catch(error){status.className='warn';status.textContent='Download could not finish: '+error.message;}
    finally{button.disabled=false;button.textContent='Download add-on ZIP';}
  };
  show(0);
}

/* Which files this build would touch, and why - worked out by running
   the emitters and comparing, so the list cannot claim a change the
   build does not make. */
function manifest(){
  const F=DB.files, out=[
    {name:"gamedata/scripts/zzz_amp_zonebench.script",why:"register custom drops without replacing the inventory runtime"},
    {name:"gamedata/configs/mod_system_zzzzzz_zonebench.ltx",why:"dedicated rig slots, pouch grants and selected models"},
    {name:"README.txt",why:"requirements and installation instructions"}
  ];
  const modelPaths = new Set();
  for(const kind of ["rigs","boxes"])for(const it of DB[kind]) {
    const model=it.model||(kind==="rigs"?"rig":"box");
    for(const path of ZB.models[model]?.files||[])modelPaths.add(path);
  }
  for(const path of modelPaths)out.push({name:"gamedata/"+path,why:"selected dropped-item model and textures"});
  const base=EMIT.baseStrings(F["configs/text/eng/zzz_amp_text.xml"]);
  const rects=sheetRects();
  const add=(path,got,why)=>out.push({ name:"gamedata/"+path,
    why: got===F[path] ? null : why });
  add("configs/mod_system_amp_rigs.ltx",
      EMIT.rigSystem({...DB, removed:[]},F["configs/mod_system_amp_rigs.ltx"],rects.rigs),
      "rig numbers, layouts and prices");
  add("configs/mod_system_amp_boxes.ltx",
      EMIT.boxSystem({...DB, removed:[]},F["configs/mod_system_amp_boxes.ltx"],rects.boxes),
      "container sizes and prices");
  add(POUCH_PATH, EMIT.pouchSystem({...DB, removed:[]},F[POUCH_PATH],rects.pouches),
      "the pouches this mod owns");
  add(ADOPT_PATH, EMIT.adoptedSystem(DB,F[ADOPT_PATH]),
      "items from other mods, given this mod\u2019s keys");
  add(RULES_PATH, EMIT.boxRules(DB,F[RULES_PATH]),
      "what each kind of container takes");
  add(SORT_PATH, EMIT.sorting(DB,F[SORT_PATH]),
      "where a new rig or container sorts in your bag");
  add(PCRAFT_PATH, EMIT.pouchCraft(DB,F[PCRAFT_PATH]),
      "what a pouch costs to build");
  add(PARTS_PATH, EMIT.parts(DB,F[PARTS_PATH]),
      "what a rig is made of and breaks down into");
  add(PACKS_PATH, EMIT.packs(DB,F[PACKS_PATH]),
      "how much room each backpack gives");
  add(ITEMS_PATH, EMIT.itemSystem(DB,F[ITEMS_PATH],rects.items),
      "items given a new look, and new ones");
  add(ICRAFT_PATH, EMIT.itemCraft(DB,F[ICRAFT_PATH]),
      "what those cost to build");
  const lay = layoutFile();
  if(lay) out.push({ name:"gamedata/"+lay.path,
    why:"your inventory layout, on " + lay.from });
  /* THE PACK'S SHEET, AND WHETHER IT CAN BE WRITTEN AT ALL. Better to
     say it here, in the list, than to stop the build after somebody has
     pressed the button. */
  if(typeof layoutSheetJobs === "function" && layoutSheetJobs().length){
    const got = layoutSheetHave();
    out.push({ name:"gamedata/textures/ui/" + layoutSheetName() + ".dds",
      why: got
        ? "your panels painted into your own sheet, every other pixel of "
          + "it left alone"
        : null,
      stop: got ? null : "give the Inventory Layout Editor your "
        + layoutSheetName() + ".dds — without it this cannot be "
        + "painted, and a fresh sheet would throw away your drawing" });
  }
  const P2=[
    ["configs/magazines/outfitloadouts/l_amp_rigs.ltx","balance",
     "the pockets, as the balance file states them"],
    ["configs/items/settings/mod_craft_amp_rigs.ltx","craft","the craft recipes"],
    ["configs/items/settings/mod_grok_items_tier_amp.ltx","lootTier","stash rarity"],
    ["configs/items/settings/mod_grok_treasure_manager_amp.ltx","lootPool",
     "what may turn up in a stash at all"],
    ["configs/items/settings/mod_death_items_amp.ltx","deathItems",
     "what a corpse must not throw away"],

  ];
  P2.forEach(([path,fn,why])=>{
    const got=EMIT[fn](DB,F[path]);
    out.push({ name:"gamedata/"+path, why: got===F[path]?null:why });
  });
  LANGS.forEach(l=>{
    const path="configs/text/"+l+"/zzz_amp_text.xml";
    const got=EMIT.textFile(DB,F[path],base,[]);
    out.push({ name:"gamedata/"+path, why: got===F[path]?null:"names and descriptions" });
  });
  Object.keys(F).filter(k=>k.indexOf("configs/items/trade/")===0).forEach(path=>{
    const shelf=shelfOf(path);
    const got=shelf?EMIT.tradeFile(DB,F[path],shelf):F[path];
    out.push({ name:"gamedata/"+path, why: got===F[path]?null:"what this trader stocks" });
  });
  out.push({ name:"gamedata/textures/ui/ui_amp_rigs.dds", why: iconsMoved("rigs") });
  out.push({ name:"gamedata/textures/ui/ui_amp_boxes.dds", why: iconsMoved("boxes") });
  if(EMIT.ourPouches(DB).length)
    out.push({ name:"gamedata/textures/ui/ui_amp_pouches.dds",
               why: iconsMoved("pouches") });
  return out;
}
function shelfOf(path){
  const f=path.split("/").pop().replace(/^mod_/,"").replace(/_amp\.ltx$/,"");
  for(const k in EMIT.SHELF_FILES)
    if(EMIT.SHELF_FILES[k].indexOf(f)>=0) return k;
  return null;
}
/* A sheet is rewritten if any picture on it was replaced, or if
   anything new needs a place on it. */
function iconsMoved(kind){
  // AN ADOPTED ITEM HAS NO PICTURE OF OURS. It wears the other mod's,
  // is not on our sheet and must not make us redraw one - which it did,
  // because it is marked new like everything else the user added.
  const arr = kind==="rigs" ? EMIT.ourRigs(DB)
            : kind==="pouches" ? EMIT.ourPouches(DB)
            : DB.boxes.filter(b=>!b.borrowed && !b.adopt);
  const n = arr.filter(x=>x.iconNew || x.new).length;
  /* ...AND SO DOES A PICTURE THAT HAS ONLY BEEN RESIZED. Nothing about
     the item's section changes when you zoom its art - the rectangle is
     the same rectangle - so without this the sheet would not be redrawn
     and the setting would do nothing at all. */
  const refit = arr.filter(x=>x.fit && !fitIsDefault(x.fit) && !(x.iconNew || x.new)).length;
  // A SIZE CHANGE REDRAWS THE SHEET EVEN IF NO PICTURE MOVED. Every
  // rectangle on it has been laid out again, so the old pixels are in
  // the wrong places - which shows in game as a slice of one rig down
  // the side of another.
  const plan = sheetPlans()[kind];
  if(plan && plan.repacked)
    return n ? n + " pictures, and everything laid out again"
             : "everything laid out again for a new size";
  if(n) return (n===1 ? "one new picture" : n+" new pictures")
              + (refit ? ", and " + refit + " resized" : "");
  return refit ? (refit===1 ? "a picture resized" : refit + " pictures resized") : null;
}
/* ONE PLACE THAT LAYS OUT THE SHEETS, so the Check page and the Build
   page cannot disagree about whether everything fits. */
function sheetPlans(){
  const seedR = k => { const o={};
    (SEED[k]||[]).forEach(x=>{ if(x.rect) o[x.id]=x.rect; }); return o; };
  return { rigs: BUILD.rigSheetPlan(DB, seedR("rigs")),
           boxes: BUILD.boxSheetPlan(DB, seedR("boxes")),
           pouches: BUILD.pouchSheetPlan(DB, seedR("pouches")),
           items: BUILD.itemSheetPlan(DB, {}) };
}
function sheetRects(){
  const seedR = k => { const o={};
    (SEED[k]||[]).forEach(x=>{ if(x.rect) o[x.id]=x.rect; }); return o; };
  const p = sheetPlans();
  return { rigs: p.rigs.rects, boxes: p.boxes.rects, pouches: p.pouches.rects,
           items: p.items.rects };
}

function doBuild(say){
  ZB.validate(DB);
  const failures = checkFindings().bad;
  if(failures.length) throw new Error("Fix the issues on the Check page before exporting.");
  const F=DB.files, rects=sheetRects(), files=[];
  const base=EMIT.baseStrings(F["configs/text/eng/zzz_amp_text.xml"]);
  const put=(name,text,enc)=>files.push({ name:"gamedata/"+name,
    bytes: enc==="cp1251" ? BUILD.cp1251(text) : BUILD.utf8(text) });

  put("configs/mod_system_amp_rigs.ltx",
      EMIT.rigSystem({...DB, removed:[]},F["configs/mod_system_amp_rigs.ltx"],rects.rigs));
  put("configs/mod_system_amp_boxes.ltx",
      EMIT.boxSystem({...DB, removed:[]},F["configs/mod_system_amp_boxes.ltx"],rects.boxes));
  put("configs/magazines/outfitloadouts/l_amp_rigs.ltx",
      EMIT.balance(DB,F["configs/magazines/outfitloadouts/l_amp_rigs.ltx"]));
  put("configs/items/settings/mod_craft_amp_rigs.ltx",
      EMIT.craft(DB,F["configs/items/settings/mod_craft_amp_rigs.ltx"]));
  put("configs/items/settings/mod_grok_items_tier_amp.ltx",
      EMIT.lootTier(DB,F["configs/items/settings/mod_grok_items_tier_amp.ltx"]));
  put("configs/items/settings/mod_grok_treasure_manager_amp.ltx",
      EMIT.lootPool(DB,F["configs/items/settings/mod_grok_treasure_manager_amp.ltx"]));
  put("configs/items/settings/mod_death_items_amp.ltx",
      EMIT.deathItems(DB,F["configs/items/settings/mod_death_items_amp.ltx"]));
  put(POUCH_PATH, EMIT.pouchSystem({...DB, removed:[]},F[POUCH_PATH],rects.pouches));
  put(ADOPT_PATH, EMIT.adoptedSystem(DB,F[ADOPT_PATH]));
  put(RULES_PATH, EMIT.boxRules(DB,F[RULES_PATH]));
  put(SORT_PATH, EMIT.sorting(DB,F[SORT_PATH]));
  put(PCRAFT_PATH, EMIT.pouchCraft(DB,F[PCRAFT_PATH]));
  put(PARTS_PATH, EMIT.parts(DB,F[PARTS_PATH]));
  put(PACKS_PATH, EMIT.packs(DB,F[PACKS_PATH]));
  put(ITEMS_PATH, EMIT.itemSystem(DB,F[ITEMS_PATH],rects.items));
  put(ICRAFT_PATH, EMIT.itemCraft(DB,F[ICRAFT_PATH]));
  /* ============================================================
     THE LAYOUT, AND WHY THE PLAIN BENCH DOES NOT WRITE ONE

     THIS ZIP IS A PATCH, NOT A WHOLE MOD - its own Build page says so:
     "drop it over the Squared Away you already have ... nothing else in
     your install is touched". The mod ships its layout again, and a
     build that does not mention it leaves the one already on disk
     exactly where it is. That is the behaviour, not an omission.

     A draft of this carried the mod's copy through "so a build could
     not lose it" - and that would have been the plain bench quietly
     overwriting a layout the layout-editor bench had just written.
     A patch that rewrites a file nobody asked it to touch is not a
     patch.
     ============================================================ */
  const layFile = layoutFile();
  if(layFile) put(layFile.path, layFile.text);
  for (const f of ZB.compatibilityFiles(DB)) put(f.name, f.text);
  LANGS.forEach(l=>{
    const path="configs/text/"+l+"/zzz_amp_text.xml";
    files.push({name:"gamedata/"+path, bytes:BUILD.stringTable(EMIT.textFile(DB,F[path],base,[]),l)});
  });
  Object.keys(F).filter(k=>k.indexOf("configs/items/trade/")===0).forEach(path=>{
    const shelf=shelfOf(path);
    put(path, shelf ? EMIT.tradeFile(DB,F[path],shelf) : F[path]);
  });

  /* A SHEET NOBODY DREW ON IS NOT REDRAWN.

     Every picture goes back on through a canvas, and a canvas keeps
     colour multiplied by alpha - so a picture that came off the sheet
     and went straight back on returns with its soft EDGES a shade or
     two out. Nothing opaque moves and nothing is visible in game, but
     it is a change to a sixteen-megabyte file for no reason, and a
     build that leaves your sheets exactly as they were is a better
     build than one that rewrites them to look the same.

     So a sheet is only drawn when something on it actually changed. */
  const sheets = [];
  if(iconsMoved("rigs")) sheets.push(["ui_amp_rigs",
    EMIT.ourRigs(DB).map(r=>({ icon:r.icon, fit:r.fit, rect:rects.rigs[r.id] })).filter(e=>e.rect)]);
  if(iconsMoved("boxes")) sheets.push(["ui_amp_boxes",
    DB.boxes.filter(b=>!b.borrowed && !b.adopt)
      .map(b=>({ icon:b.icon, fit:b.fit, rect:rects.boxes[b.id] })).filter(e=>e.rect)]);
  // THE POUCH SHEET IS DRAWN WHENEVER THERE IS A POUCH OF OURS AT ALL,
  // not only when a picture changed - it does not exist in the install
  // until this build writes it, so "nothing moved" still means "and
  // there is nothing there".
  /* THE ITEM SHEET IS DRAWN WHENEVER ANYTHING IS ON IT, not only when a
     picture moved - it does not exist in the install until a build puts
     it there, so "nothing changed" still means "and there is nothing
     there". Same as the pouch sheet, for the same reason. */
  const withPics = (DB.items||[]).concat(Array.isArray(DB.packs)?DB.packs:[])
    .filter(x=>x && x.icon && rects.items[x.id]);
  if(withPics.length) sheets.push(["ui_amp_items",
    withPics.map(x=>({ icon:x.icon, fit:x.fit, rect:rects.items[x.id] }))]);
  if(EMIT.ourPouches(DB).length) sheets.push(["ui_amp_pouches",
    EMIT.ourPouches(DB)
      .map(p=>({ icon:p.icon, fit:p.fit, rect:rects.pouches[p.id] })).filter(e=>e.rect)]);

  /* ============================================================
     AND THE MENU'S BACKDROP, WHICH IS NOT A SHEET

     A sheet is a page of small pictures at known rectangles. This is
     one picture the size of the menu, so it goes through the same dds
     writer and none of the packing - and only when you have actually
     given the editor one.
     ============================================================ */

  /* ============================================================
     AND THE PACK'S OWN SHEET, WHICH IS NEITHER

     Every panel in the menu is a rectangle cut out of one 62 MB file,
     and that file is the player's own drawing. So this does not make
     one: it paints into the one the editor was given, and if it was
     not given one it writes NOTHING and says so.

     That refusal is the important half. A build that helpfully wrote a
     fresh sheet with three panels on it and nothing else would replace
     a drawing made in an image editor with a mostly-empty file, and it
     would look like it had worked.
     ============================================================ */
  const sheetJobs = (typeof layoutSheetJobs === "function")
    ? layoutSheetJobs() : [];
  const sheetHave = (typeof layoutSheetHave === "function")
    ? layoutSheetHave() : null;
  if(sheetJobs.length && !sheetHave) throw new Error(
    "There are pictures for the menu's panels, but the page has not been "
    + "given " + layoutSheetName() + ".dds to paint them into — it is "
    + "in your install under Squared Away\\gamedata\\textures\\ui. Drop it "
    + "into the Inventory Layout Editor and build again. (Nothing was "
    + "written: making you a fresh sheet would throw away the drawing in "
    + "yours.)");

  return sheets.reduce((chain,[name,entries])=>chain.then(()=>{
    say("Drawing " + name + "...");
    return BUILD.composeSheet(entries).then(img=>{
      files.push({ name:"gamedata/textures/ui/"+name+".dds", bytes: BUILD.ddsFrom(img) });
    });
  }), Promise.resolve())
    .then(()=>{
      if(!sheetJobs.length) return;
      say("Painting " + sheetJobs.length + " panel"
        + (sheetJobs.length === 1 ? "" : "s") + " into "
        + layoutSheetName() + "...");
      /* Every picture first, then one pass over the bytes: the sheet is
         62 MB and copying it once per panel would copy it five times. */
      return sheetJobs.reduce((chain, j)=>chain.then(done=>
        BUILD.fitPicture(j.src, j.rect.w, j.rect.h, j.fit, j.stretch)
          .then(img=>{ done.push({ id:j.id, rect:j.rect, img:img });
                       return done; })
      ), Promise.resolve([])).then(ready=>{
        files.push({ name:"gamedata/textures/ui/" + layoutSheetName() + ".dds",
                     bytes: BUILD.paintSheet(sheetHave.bytes, ready) });
      });
    })
    .then(async()=>{ files.push(...await ZB.modelFiles(DB)); files.push({name:"README.txt",bytes:BUILD.utf8(ZB.installNotes)}); say("Packing " + files.length + " files..."); return BUILD.zip(files); })
    .then(blob=>{
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      const d=new Date();
      a.download="SquaredAway-bench-"+d.getFullYear()+"-"
        +String(d.getMonth()+1).padStart(2,"0")+"-"
        +String(d.getDate()).padStart(2,"0")+".zip";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),8000);
      return { count: files.length, size: blob.size };
    });
}

/* ==========================================================
   SENDING ITEMS TO SOMEBODY ELSE

     "i could add some items and export it, send it to someone that has
      the tool, he imports my file and also can choose what items that i
      added will be imported to his tool if he doesnt want all of them."

   A save is the whole bench: every rig, every price, every drop number.
   That is the wrong thing to send somebody who wants two of your
   pouches, because opening it replaces everything they have.

   So this is items on their own - only the ones you tick, with their
   pictures - and the far end ticks again on the way in. Nothing of
   theirs is replaced without being asked about.
   ========================================================== */
const SHARE_KINDS = [["rigs", "Rigs"], ["pouches", "Pouches"], ["boxes", "Containers"]];

/* Everything that is yours to send: made here, or adopted here. The
   shipped rigs are not - the other person has those already, and
   sending them would only overwrite theirs with yours. */
function mineToShare() {
  const out = [];
  SHARE_KINDS.forEach(([k]) => (DB[k] || []).forEach(x => {
    if (x.new || x.adopt) out.push({ kind: k, it: x });
  }));
  return out;
}
let SHARE_PICK = null;     // what to send
let INCOMING = null;       // what somebody sent, and what to take of it

function drawShare(P) {
  P.appendChild(el('h1',null,INCOMING?'Review import':'Share items'));
  if(INCOMING){drawIncoming(P);return;}
  P.appendChild(el('p','hint','Build an add-on from your items, preview it, then publish it for others to browse.'));
  const mine=mineToShare();
  if(!SHARE_PICK)SHARE_PICK=new Set(mine.map(m=>m.kind+'/'+m.it.id));
  const selected=()=>mine.filter(m=>SHARE_PICK.has(m.kind+'/'+m.it.id));
  const section=el('section','card share-selection');P.appendChild(section);
  section.appendChild(el('h2',null,'1. Choose items'));
  const count=selected().length;
  section.appendChild(el('p',count>20?'warn':'hint',count+' selected / 20 per public add-on'));
  if(!mine.length){
    section.appendChild(el('p','hint','Create a rig, container or pouch first. Your custom and adopted items will appear here.'));
    communityButton(section,'Create an item',async()=>Site.go('create'));
    communityButton(section,'Edit add-on items',async()=>EditorLibrary.choose('addons')); 
  }else{
    const controls=el('div','community-actions');section.appendChild(controls);
    communityButton(controls,'Select all',async()=>{SHARE_PICK=new Set(mine.map(m=>m.kind+'/'+m.it.id));renderPane();});
    communityButton(controls,'Clear selection',async()=>{SHARE_PICK.clear();renderPane();});
    const tiles=el('div','share-item-grid');section.appendChild(tiles);
    for(const {kind,it} of mine){
      const key=kind+'/'+it.id;const card=el('div','share-item'+(SHARE_PICK.has(key)?' selected':''));
      const label=document.createElement('label');label.className='share-item-label';
      const check=document.createElement('input');check.type='checkbox';check.checked=SHARE_PICK.has(key);check.setAttribute('aria-label','Include '+(it.name||it.id));
      check.onchange=()=>{if(check.checked)SHARE_PICK.add(key);else SHARE_PICK.delete(key);renderPane();};
      label.appendChild(check);label.appendChild(AddonPreview.picture({kind,item:it}));
      const name=document.createElement('strong');name.textContent=it.name||it.id;label.appendChild(name);
      const type=el('span','hint');type.textContent=SHARE_KINDS.find(x=>x[0]===kind)?.[1]||kind;label.appendChild(type);card.appendChild(label);
      communityButton(card,'Inspect',async()=>AddonPreview.openItem({kind,item:it},{families:DB.families||{}}));tiles.appendChild(card);
    }
  }
  drawCommunityPublish(P);
  const local=document.createElement('details');local.className='card share-files';
  const summary=document.createElement('summary');summary.textContent='File sharing and backups';local.appendChild(summary);
  local.appendChild(el('p','hint','Optional: save the selected items as a file, or open an item file someone sent you. No account needed.'));
  const save=communityButton(local,'Save selected items to file',async()=>exportItems(mine));save.disabled=!count;
  communityButton(local,'Open an items file',async()=>{const input=$('#shareIn');input.value='';input.click();});P.appendChild(local);
}

function exportItems(mine) {
  const take = mine.filter(m => SHARE_PICK.has(m.kind + "/" + m.it.id));
  /* A CONTAINER WITHOUT ITS RULE IS A CONTAINER THAT TAKES ANYTHING.
     The rule lives in a file of its own, not on the item, so sending
     the item alone sends half of it - and the half that is missing is
     the half that made it worth sending. */
  const fams = {};
  take.forEach(({ kind, it }) => {
    if (kind !== "boxes") return;
    const t = it.takes;
    if (t && t !== "any" && DB.families[t]) fams[t] = DB.families[t];
  });
  const out = {
    bench: "zonebench-items", version: 1,
    saved: new Date().toISOString(), from: DB.modVersion || null,
    families: fams,
    items: take.map(({ kind, it }) => ({ kind: kind, item: it }))
  };
  const blob = new Blob([JSON.stringify(out)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = "zonebench-items-" + d.getFullYear() + "-"
    + String(d.getMonth() + 1).padStart(2, "0") + "-"
    + String(d.getDate()).padStart(2, "0") + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------------- what somebody sent ---------------- */
function drawIncoming(P) {
  P.appendChild(el("div", "sect", "What is in that file"));
  const c = el("div", "card");
  if (INCOMING.from)
    c.appendChild(el("div", "hint", "Made against Squared Away <b>"
      + esc(INCOMING.from) + "</b>; you are on <b>"
      + esc(DB.modVersion || "unknown") + "</b>."));
  const nf = Object.keys(INCOMING.families || {}).length;
  if (nf) c.appendChild(el("div", "hint",
    "A container brings the rule for what it takes with it. "
    + (nf === 1 ? "One rule" : nf + " rules") + " will come in beside yours; "
    + "nothing of yours is written over, and if a name clashes theirs arrives "
    + "under a new one."));
  const one = { rigs: "rig", pouches: "pouch", boxes: "container", packs:"backpack", items:"item" };
  INCOMING.items.forEach((entry, i) => {
    const it = entry.item, clash = (DB[entry.kind] || []).some(x => x.id === it.id);
    const row = el("label", "tick");
    row.innerHTML = '<input type="checkbox"' + (entry.take ? " checked" : "")
      + '><span>' + esc(it.name || it.id)
      + ' <span style="color:var(--faint)">' + esc(one[entry.kind]) + " &middot; "
      + esc(it.id) + (it.adopt ? " &middot; adopted" : "") + '</span>'
      + (clash ? ' <span class="pill t5">you already have this id</span>' : "")
      + '</span>';
    row.querySelector("input").onchange = e => { entry.take = e.target.checked; renderPane(); };
    row.prepend(AddonPreview.picture(entry));
    c.appendChild(row);
    const inspect=el('button','tool','Inspect item');
    inspect.onclick=()=>AddonPreview.openItem(entry,INCOMING);
    c.appendChild(inspect);
    if (clash && entry.take) {
      /* AN ID THAT ALREADY EXISTS IS THE ONE THING THAT CANNOT BE
         WAVED THROUGH. Two items with one section name is a game that
         will not start, so it is either theirs replacing yours or a
         new name - and the choice is made here rather than guessed. */
      const how = el("div"); how.style.cssText = "margin:-4px 0 12px 26px";
      const s = document.createElement("select");
      [["replace", "replace mine with theirs"],
       ["rename", "keep both — theirs gets a new id"]].forEach(o => {
        const op = document.createElement("option");
        op.value = o[0]; op.textContent = o[1]; s.appendChild(op);
      });
      s.style.maxWidth = "320px";
      s.value = entry.how || "rename";
      entry.how = s.value;
      s.onchange = () => { entry.how = s.value; renderPane(); };
      how.appendChild(s);
      c.appendChild(how);
    }
  });
  const replaceCount=Workbench.importReview(c,INCOMING);
  let approved=!replaceCount;
  let acknowledge;
  if(replaceCount){const warning=el("label","tick");acknowledge=document.createElement("input");acknowledge.type="checkbox";warning.appendChild(acknowledge);const text=document.createElement("span");text.textContent="I understand this replaces "+replaceCount+" existing item(s), including their local customizations.";warning.appendChild(text);c.appendChild(warning);}
  const n = INCOMING.items.filter(x => x.take).length;
  const go = el("button", "tool primary");
  go.style.marginTop = "10px";
  go.textContent = "Take " + n + " item" + (n === 1 ? "" : "s");
  go.disabled=!n||!approved;
  if(acknowledge)acknowledge.onchange=()=>{approved=acknowledge.checked;go.disabled=!n||!approved;};
  go.onclick=()=>{if(n&&approved)takeIncoming();};
  c.appendChild(go);
  const no = el("button", "tool");
  no.style.cssText = "margin-top:10px;margin-left:8px";
  no.textContent = "Never mind";
  no.onclick = () => { INCOMING = null; renderPane(); };
  c.appendChild(no);
  P.appendChild(c);
}

function takeIncoming() {
  let added = 0, replaced = 0, renamed = 0, rules = 0;
  INCOMING.items.forEach(entry => {
    if (!entry.take) return;
    const arr = DB[entry.kind] = DB[entry.kind] || [];
    const it = JSON.parse(JSON.stringify(entry.item));
    // AN ITEM THAT ARRIVES IS ONE OF YOURS NOW - it has to be written
    // by your build, so it counts as new here however it was marked
    // where it came from.
    it.new = true;
    if(INCOMING.community)it.communitySource={...INCOMING.community,originalId:entry.originalId||entry.item.id};
    if (entry.kind === "boxes" && takeRule(it)) rules++;
    const at = arr.findIndex(x => x.id === it.id);
    if (at < 0) { arr.push(it); added++; return; }
    if (entry.how === "replace") { arr[at] = it; replaced++; return; }
    it.id = uniqueId(it.id);
    arr.push(it); renamed++;
  });
  INCOMING = null; SHARE_PICK = null; CommunityUpdates.invalidate(); touch(); render();
  const bits = [];
  if (added) bits.push(added + " added");
  if (replaced) bits.push(replaced + " replaced");
  if (renamed) bits.push(renamed + " added under a new id");
  if (rules) bits.push(rules + " rule" + (rules === 1 ? "" : "s") + " brought in");
  alert(bits.join(", ") + ".");
}
/* THE RULE THAT CAME WITH IT. A rule of theirs that you do not have is
   simply added. A rule of theirs that shares a name with one of yours
   is NOT written over - a name is not a promise that two people meant
   the same thing - so theirs arrives beside yours and their container
   is pointed at it. */
function takeRule(it) {
  const t = it.takes, from = (INCOMING.families || {})[t];
  if (!t || t === "any" || !from) return false;
  const mine = DB.families[t];
  if (!mine) { DB.families[t] = JSON.parse(JSON.stringify(from));
    famTouch(t); return true; }
  if (famSame(mine, from)) return false;
  let n = 2, name = t + "_2";
  while (DB.families[name]) name = t + "_" + (++n);
  DB.families[name] = JSON.parse(JSON.stringify(from));
  it.takes = name; famTouch(name);
  return true;
}

/* ==========================================================
   HELP
   ========================================================== */
function drawHelp(P){
 return Site.help(P);
}

/* ==========================================================
   ADD / REMOVE
   ========================================================== */
function uniqueId(base){
  let n=base, i=2;
  const all=new Set([...DB.rigs,...DB.pouches,...DB.boxes].map(x=>x.id));
  while(all.has(n)) n=base+"_"+(i++);
  return n;
}
function addItem(adopt,kind=TAB,navigate=true){
  let it;
  if(kind==="rigs") it={id:uniqueId("amprig_new"),name:"New rig",descr:"",
    weight:1.5,cost:3000,tier:2,slots:{"2x2":0,"3x1":0,"2x1":0,"1x1":0},
    band:5,pins:[],icon:null,cellw:2,cellh:3,
    // MENDED LIKE EVERY OTHER RIG until you say otherwise. A section
    // with no repair_type is a rig no kit in the game will touch, and
    // it fails by simply never appearing in a repair window.
    repair:"outfit_light",repairBonus:null,new:true};
  else if(kind==="pouches") it={id:uniqueId("amppouch_new"),name:"New pouch",
    weight:0.3,cost:2000,tier:3,grants:{"2x2":0,"3x1":0,"2x1":1,"1x1":0},
    icon:null,cellw:2,cellh:2,new:true};
  else if(kind==="packs") it={id:uniqueId("amppack_new"),name:"New backpack",
    newItem:true, parent:"equ_military_pack", own:{size:true,look:true,price:true},
    size: DB.packDefault||"10x7", cellw:2, cellh:2, icon:null,
    cost:6000, weight:1.2, new:true};
  else it={id:uniqueId("ampbox_new"),name:"New container",descr:"",
    weight:2,cost:8000,takes:"any",snd:"chest",inw:4,inh:3,kg:10,stack:99,
    cellw:2,cellh:2,icon:null,shelves:{},new:true};
  if(adopt){
    // An adopted item is named after somebody else's section, so it
    // starts with a blank id rather than one of ours - there is no
    // sensible guess, and a wrong guess would be a fatal duplicate.
    it.adopt=true; it.id=""; it.name="";
    delete it.shelves;
    /* AN ADOPTED ITEM IS NOT A NEW ONE, and the difference is the whole
       point of the Item editor: a new section is declared, an existing
       one is only added to. Nothing is taken over until it is ticked. */
    delete it.newItem; delete it.parent;
    if(kind==="packs") it.own={size:true};
    else if(kind==="items"){
      it.own={};
      it={ id:"", name:"", adopt:true, own:{}, cellw:1, cellh:1, icon:null };
    }
  }
  DB[kind].push(it); SEL[kind]=it.id; touch(); if(navigate)render(); return it;
}
function removeItem(it){
  if(!confirm("Remove "+(it.name||it.id)+"?")) return;
  const arr=DB[TAB], i=arr.indexOf(it);
  if(i<0) return;
  if(it.new) arr.splice(i,1);
  else { it.removed=true; arr.splice(i,1); DB.removed=DB.removed||[];
    DB.removed.push({kind:TAB,id:it.id,name:it.name}); }
  SEL[TAB]=arr[Math.min(i,arr.length-1)] && arr[Math.min(i,arr.length-1)].id;
  touch(); if(window.EditorLibrary?.isFocused(TAB))EditorLibrary.choose(EditorLibrary.scope);else render();
}

/* ==========================================================
   SAVE / LOAD
   ========================================================== */
$("#btnSave").onclick=()=>{
  /* THE MOD'S OWN FILES DO NOT TRAVEL IN THE SAVE.
     They are three megabytes of text this copy of the bench already
     has, and the save is a thing that gets sent - so it carries the
     numbers, the layouts and the pictures, and the templates are put
     back from the bench when it is opened again. */
  /* ...AND NEITHER DO THE PICTURES THAT CAME WITH IT. Only the ones
     you replaced travel; the rest are put back from the bench's own
     copy on the way in. A save is a thing that gets sent, and this is
     the difference between a hundred kilobytes and two megabytes.

     ONE FUNCTION FOR BOTH. The file and the browser's own copy are the
     same snapshot, so the two can never drift into meaning different
     things. */
  const out=JSON.stringify(snapshot());
  const blob=new Blob([out],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  const d=new Date();
  a.download="zonebench-"+d.getFullYear()+"-"
    +String(d.getMonth()+1).padStart(2,"0")+"-"
    +String(d.getDate()).padStart(2,"0")+".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  DIRTY=false; renderDirty();
};
$("#imgIn").onchange=e=>{
  const f=e.target.files[0];
  if(f && PENDING_ICON) PENDING_ICON(f);
};
/* ==========================================================
   TEACHING THE TOOL A NEWER MOD

   Everything the bench knows is baked in when the page is built, so a
   page from Tuesday builds Tuesday's mod. Drop a Squared Away zip on
   this and it reads that build instead - the configs, the pictures,
   the version - and keeps every item you added.

   WHICH ITEMS SURVIVE, exactly: anything you made or adopted. The
   shipped ones are replaced wholesale by whatever the new mod says
   they are, because the new mod is now the authority on them.
   ========================================================== */
$("#btnMod").onclick=()=>{ const f=$("#modIn"); f.value=""; f.click(); };
$("#modIn").onchange=e=>{
  const file=e.target.files[0]; if(!file) return;
  const say=m=>{ const d=$("#dirty"); d.textContent=m; d.className="on"; };
  say("Reading " + file.name + "...");
  file.arrayBuffer()
    .then(buf=>BUILD.learnFromZip(buf, say))
    .then(mod=>{
      const mine = {};
      ["rigs","pouches","boxes"].forEach(k=>{
        mine[k] = (DB[k]||[]).filter(x=>x.new || x.adopt);
      });
      const known = {};
      ["rigs","pouches","boxes"].forEach(k=>{
        known[k] = {}; mod[k].forEach(x=>{ known[k][x.id]=1; });
      });
      let kept=0, absorbed=0;
      const read = { rigs: mod.rigs.length, pouches: mod.pouches.length,
                     boxes: mod.boxes.length };
      ["rigs","pouches","boxes"].forEach(k=>{
        // A COPY, NOT THE ARRAY ITSELF. Pushing onto DB[k] would push
        // onto mod[k] as well, and the message below would then report
        // the user's own items as things it had read out of the zip.
        DB[k] = mod[k].slice();
        mine[k].forEach(x=>{
          // AN ITEM OF YOURS THAT THE NEW MOD NOW SHIPS is not added
          // twice - the mod's copy wins, because it is the one that is
          // actually in the game.
          if(known[k][x.id]){ absorbed++; return; }
          DB[k].push(x); kept++;
        });
      });
      DB.files = mod.files;
      DB.craftOrder = mod.craftOrder;
      DB.modVersion = mod.version;
      /* AND THIS IS THE ONE CASE WHERE THE MOD'S OWN FILES ARE KEPT.
         Three megabytes of config that this page does not have baked
         in - so it is remembered, and a later page built with a NEWER
         mod than this one will drop it again. See adoptSave. */
      DB.filesFromZip = true;
      wireOrders();
      SEL={rigs:DB.rigs[0]&&DB.rigs[0].id, boxes:DB.boxes[0]&&DB.boxes[0].id,
           pouches:DB.pouches[0]&&DB.pouches[0].id};
      touch(); render();
      alert("Now building against Squared Away " + mod.version + ".\n\n"
        + read.rigs + " rigs, " + read.pouches + " pouches and "
        + read.boxes + " containers read from the zip.\n"
        + kept + " of your own item" + (kept===1?"":"s") + " kept"
        + (absorbed ? ", and " + absorbed + " now shipped by the mod itself"
                    : "") + ".");
    })
    .catch(err=>{
      renderDirty();
      alert("That did not work.\n\n" + (err && err.message || err)
        + "\n\nIt wants the Squared Away zip itself, the one with a "
        + "gamedata folder inside it.");
    });
};

$("#shareIn").onchange=e=>{
  const file=e.target.files[0]; if(!file) return;
  const fr=new FileReader();
  fr.onload=()=>{
    let d;
    try{ d=JSON.parse(fr.result); }catch(err){ d=null; }
    if(!d || d.bench!=="zonebench-items" || !Array.isArray(d.items)){
      alert("That is not an items file.\n\nIt wants the file the Share page "
        + "writes, not a bench save \u2014 a save is the whole bench and goes "
        + "through Open project instead.");
      return;
    }
    try { ZB.validateAddon(d); } catch(err) { alert(err.message); return; }
    // Everything ticked to begin with, and anything whose id already
    // exists defaulting to keeping both.
    INCOMING = { from: d.from, families: d.families || {},
      items: d.items.map(x=>({
        kind: x.kind, item: x.item, take: true, how: "rename" })) };
    TAB="share"; render();
  };
  fr.readAsText(file);
};

$("#btnLoad").onclick=()=>{ const f=$("#fileIn"); f.value=""; f.click(); };
$("#fileIn").onchange=e=>{
  const file=e.target.files[0]; if(!file) return;
  const fr=new FileReader();
  fr.onload=()=>{
    let d;
    try{ d=JSON.parse(fr.result); }
    catch(err){ alert("That file is not a bench save."); return; }
    if(d.bench!=="zonebench"){ alert("That file is not a bench save."); return; }
    /* OPENING A FILE REPLACES WHAT IS KEPT, because that is what
       opening a save means - and it is written back at once rather
       than on the next edit, so closing the page immediately
       afterwards does not lose it. */
    let note = "";
    adoptSave(d, m=>{ note = m; });
    Workbench.record(); render(); flushKeep();
    if(note) setTimeout(()=>alert(note), 60);
  };
  fr.readAsText(file);
};
/* ONLY WHEN THERE IS SOMETHING TO LOSE. This used to fire on any
   change at all, which was right when the only memory was a file. The
   bench keeps itself now, so the question is whether a write is still
   in the air - or whether this browser is keeping anything at all. */
window.onbeforeunload=e=>{
  if(KEEP_HOW === "off" || KEEP_SAID === "off"){
    if(!DIRTY) return;
  } else if(KEEP_SAID !== "soon" && !KEEP_BUSY) return;
  e.preventDefault(); return e.returnValue="";
};

boot().catch(error=>{ document.querySelector("#pane").textContent="Could not open the editor: "+error.message; });



