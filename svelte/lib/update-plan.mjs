export function updatePlan(releases, installedTag, variant = 'standard', installedEngine = '') {
 const stable = releases.filter(r => !r.preview);
 const latest = stable[0];
 if (!latest || !installedTag) return null;
 const installed = stable.find(r => r.tag === installedTag);
 const key = variant === 'bodycam' ? 'bodycam' : 'engine';
 const engine = latest[key];
 const update = variant === 'bodycam' ? (latest.bodycamUpdate || latest.engineUpdate) : latest.engineUpdate;
 const engineChanged = update ? installedEngine !== update.tag : !engine || !installed?.[key] || installed[key].browser_download_url !== engine.browser_download_url;
 return { latest, installed, modNeeded: installed?.tag !== latest.tag, engineNeeded: engineChanged, engine, unknown: !installed, newGame: installedTag === 'legacy' || installedTag === '2026.9.12' };
}
