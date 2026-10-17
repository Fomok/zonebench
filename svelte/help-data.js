export const blocks=[
  ["Squared Away 2.1.0", "ZoneBench targets Squared Away 2.1.0 with independent add-on support. Install the full mod through MO2 and use the standard 2026.10.11 engine or combined Bodycam 0.3 engine. Existing 2.0.x saves can continue. Downloads and patch-note history are available on this website."],
  [
    "Install the mod",
    "Use Anomaly 1.5.3, GAMMA or ZONA V1.38. Install the full Squared Away ZIP through Mod Organizer 2 (MO2). Its FOMOD installer lets you choose optional patches. Replace an older Squared Away installation instead of merging files, and disable old copies and hotfixes. Select only patches for mods you actually have."
  ],
  [
    "Install the matching engine",
    "The 2.0 Update requires the Squared Away custom engine and its matching DB0 file. Close the game and back up your existing engine files, then extract the engine ZIP into your Anomaly game folder. The bin folder contains the executables and PDB files; db/mods contains the DB0. Preserve that folder structure. Install this package in Anomaly itself, not as an MO2 mod. Stock Anomaly and unmodified Monolith executables are not supported."
  ],
  [
    "Engine choices and developer files",
    "The all-DX engine package includes DX8, DX9, DX10 and DX11 executables, each with AVX and non-AVX versions. Choose a renderer supported by your setup, and use AVX only if your CPU supports it. The separate For Developers ZIP is for engine authors merging changes; players do not need it. Always use the engine paired with your mod release in Downloads. Bodycam users can choose the optional combined Bodycam 0.3 engine instead of the standard package. It supports DX11-AVX only and includes its matching DB0. Install both bin and db/mods from that ZIP. GAMMA users must also install Bodycam GAMMA Patch 1.1.0 from Downloads. Downloads also offers a separate Bodycam + DLSS / FSR 3 engine with its own required shader patch. Install that patch below Bodycam, SSS and Atmospherics, disable older DLSS/FSR patches, clear shader cache and keep MSAA off. It adds super resolution, not frame generation. Replace old Bodycam GAMMA, 3DSS PiP Compat and Better Beef NVG PiP Compat patches; follow its included load-order instructions and clear appdata/shaders_cache."
  ],
  ["Saves and upgrades", "Updating from 2.0.x to 2.1.0 does not require a new game. Engine downloads are available separately on the Downloads page. First installation and upgrading from before 2.0 require a new game. Keep add-ons installed while your save contains their items."],
  [
    "SOTA UI and HD Inventory Icons",
    "SOTA UI is optional. Choose SOTA UI Compatibility (GAMMA) or SOTA UI Compatibility (ZONA) in the matching installer group, only if that SOTA UI and its requirements are installed. Do not combine both groups. HD Inventory Icons Framework is required so item icons display correctly in the inventory. Install the framework with all compatibility patches required by your installed mods. Add its SOTA patch when using SOTA; leave that patch unchecked otherwise. The other required patches still need to be selected. Place Squared Away below those UI mods in the MO2 left pane so its files win conflicts. Both UI choices use the Field Kit artwork and support the Tarkov-like and Anomaly default layouts."
  ],
  [
    "Wearable Devices support",
    "Select Wearable Devices support in the installer only with the separate Wearable Devices pack installed. It adds device controls below the backpack, keeps worn devices out of the bag grid, and adds the relevant settings to Squared Away in MCM."
  ],
  [
    "Tarkov-like corpse looting",
    "This installer option requires Looting Takes Time Redux by Priler. In that mod’s MCM settings, turn OFF Pre-sort items on grid so it does not compete with Squared Away for item placement. The patch adds equipment slots above scattered loot, with a Pockets divider and remembered positions and rotations. Stashes and living NPCs keep their normal behavior. Direct equipping from bodies works in the base mod, even with a full backpack; this visual patch is optional."
  ],
  [
    "Magazine support",
    "For ZONA V1.38, keep its Magazines Redux setup and choose Mags Redux ammo fix under ZONA compatibility. This does not require Dynamic Reload Speeds. For GAMMA, the baseline is Mags Reloaded Fork by Priler UPDATE 6. Install it separately for magazine support and the three stock expansion pouches. It also requires Dynamic Reload Speeds. Select the optional Mags Reloaded ammo fix in the FOMOD with Mags Reloaded Fork by Priler UPDATE 6 and its Dynamic Reload Speeds dependency installed. It requires the 2.0.3 engine or newer. Let Squared Away win their file conflicts in MO2. The direct download message is linked below. GAMMA recipes and trader integrations also need their corresponding GAMMA content; plain Anomaly does not include those dependencies automatically."
  ],
  [
    "Inventory, rigs and containers",
    "Drag and rotate items to fit the grid. Equipped rigs provide accessible storage above the backpack; spare rigs and boxes keep their contents inside when dropped or stored. Expansion pouches attach below the equipped rig, and amber borders mark the extra storage they provide. See Introduction for the illustrated guide."
  ],
  [
    "Reloading, quick use and crafting",
    "By default, keep magazines in the equipped rig to reload, medicine there for quick use, and loose ammunition there for weapons that reload without magazines. Medicine and loose-ammo restrictions can be adjusted in MCM. Crafting and NPC item hand-ins can use items inside carried containers without unpacking them first. A non-empty rig cannot be disassembled."
  ],
  [
    "Appearance and controls",
    "The slim stats bars are enabled by default. In MCM > Squared Away > Appearance, turn off Use Squared Away slim stats bars to restore the original stats panel, background and slot positions. Open Squared Away in MCM to choose your inventory layout, adjust background opacity, and configure controls, rig rules and drops. The backpack and rig equipment slots scroll with the inventory. White key prompts show available actions. The Swap toggle is beside the weight display. Box and rig context-menu actions are included for Anomaly and GAMMA; they do not need a separate installer patch."
  ],
  ["Create and install your own add-on", "In Editor, choose Add new item and follow the steps for appearance, storage, crafting, traders and repair. Download the resulting ZIP and install it below Squared Away 2.1.0 in MO2. Independent add-ons have separate files and can be used together. To change existing gear, choose Edit existing items and use the Mod items, My add-ons or Adaptations tabs. Save to library keeps the item ready for packaging; unfinished edits are autosaved as drafts. Select item checkboxes and choose Create package to review and download only those items. Saved packages remember their identity and selection, show changed or missing items, and can be reopened for updates. Removal offers Undo; restoring a mod edit brings back its defaults. To adapt external equipment, choose Adapt a game or mod item, enter its exact section ID, and select rig, container, pouch or existing-backpack capacity. Use Advanced settings to choose optional overrides. Download compatibility patch exports only that item; install it below Squared Away and the source mod. Rig and pouch NPC drops are opt-in and follow the existing tier settings. Converted rigs/containers should be tested with newly spawned items on a separate save. Older full-project exports replace shared files and should not be stacked. Crafting, repair and dismantling offer Enter item IDs manually for ingredients outside the GAMMA database, including ZONA items. The toggle keeps existing values. Recipe book and repair type IDs can also be edited. IDs are checked for format, not whether they exist in your game. Save project keeps a backup of your work."],
  ["Browse add-ons", "Use Add-ons → Browse add-ons to inspect item icons, layouts, descriptions, prices and recipes. Download an independent ZIP directly or open items in the editor. Install each add-on below Squared Away in MO2. Updating replaces its previous installation. Signed-in downloads are remembered in this browser; this does not detect your MO2 installation."],
  ["Publish and update your add-ons", "Sign in through Account using an email code. Use Add-ons → Publish an add-on to choose your items. My published add-ons → Edit / update starts from the published contents: keep or remove items, choose edited local versions, or add items from your library. Edit item opens the focused editor; Back to add-on update returns to your draft. Preview before saving. Updating revises the same listing; unpublishing removes it from browsing without deleting existing downloads."],
  [
    "Keep your work",
    "Item editing and exports happen in your browser. Use Save project regularly and Open project to restore a downloaded backup. Account → Reset item customizations clears local item edits and imported items only. It does not delete your account, sign you out, or remove published add-ons or installed game files."
  ],
  [
    "Administrator controls",
    "Your admin account has Manage public add-ons for removing unwanted listings and blocking abusive publishers. Next mod update keeps selected add-ons for later review. Account → Edit site text lets you change website wording: navigate to a page, select Refresh list, choose text, and Save for everyone. Identical phrases share the edit. Restore original returns to the current built-in wording. These controls are restricted to the administrator; website text edits do not change item configurations."
  ]
];

export const faq = [
["Does ZONA compatibility include recipes and traders?", "Not fully. Squared Away was made for GAMMA. Crafting recipes, repair parts, dismantling returns and trader settings may be wrong or not work in ZONA. The compatibility patches cover SOTA UI and Magazines Redux reload handling. Modpack authors can adapt item IDs in ZoneBench, then test those changes in ZONA."],
  [
    "Why are my item icons so big?",
    "HD Inventory Icons Framework is missing or installed in the wrong load order. Install the correct version for your UI and check its load order."
  ],
  [
    "Why do the stats under my equipment look broken?",
    "This is probably a resolution or aspect-ratio issue, especially on widescreen displays. I recommend using SOTA UI."
  ],
  [
    "Can I use the rigs without the Tarkov-style inventory grid?",
    "No. A rigs-only mode is not supported, and I do not plan to add one. Some MCM options may let you turn off the grid, but the inventory will look broken. If you want rigs without the grid-based inventory limit, you would need to make a separate mod. Feel free to use Squared Away as a baseline."
  ],
  [
    "Can I move the rig and its slots out of the inventory column?",
    "That layout is part of the intended design, and there is no option to move it. Feel free to make an add-on or patch that puts the rig and its slots somewhere else."
  ],
  [
    "I made a patch that changes how the mod works. Where can I share it?",
    "Post it in the Squared Away Discord thread and tag me (Fomok). I’ll pin it in the first message. You are responsible for keeping your patch updated: future Squared Away changes may break it, and I will not maintain compatibility for you."
  ]
];
