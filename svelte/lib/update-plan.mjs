export function updatePlan(releases, installedTag, variant = 'standard', installedEngine = '') {
 const stable = releases.filter(r => !r.preview);
 const latest = stable[0];
 if (!latest || !installedTag) return null;
 const installed = stable.find(r => r.tag === installedTag);
 const key = variant === 'bodycam-fg' ? 'bodycamFg' : variant === 'bodycam' ? 'bodycam' : 'engine';
 const engine = variant === 'bodycam-fg' ? latest.bodycamFg?.engine : latest[key];
 const update = variant === 'bodycam-fg' ? latest.bodycamFg : variant === 'bodycam' ? (latest.bodycamUpdate || latest.engineUpdate) : latest.engineUpdate;
 const previousEngine = variant === 'bodycam-fg' ? installed?.bodycamFg?.engine : installed?.[key];
 const engineChanged = update ? installedEngine !== update.tag : !engine || !previousEngine || previousEngine.browser_download_url !== engine.browser_download_url;
 return { latest, installed, modNeeded: installed?.tag !== latest.tag, engineNeeded: engineChanged, engine, unknown: !installed, newGame: installedTag === 'legacy' || installedTag === '2026.9.12' };
}
