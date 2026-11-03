/*
 * THE PAGE'S ISOLATION, ASKED FOR (Part C Phase 10, the launch plan's B5). With the solver's switch on, the first solve
 * calls ensureIsolation() (src/useSolver.js, through the solver's lazy client, so the page's first load fetches none of
 * this): where the page is not yet cross-origin isolated and service workers are available, it
 * registers public/coi-sw.js (which adds COOP and COEP to the app's own responses) and reloads the page once when the worker
 * takes control. A page still not isolated after that one reload (the browser declined) is not reloaded again: the solve
 * runs whole in one worker (src/solverClient.js canSplit), the fallback.
 *
 * The switch file: each load first asks for `coi-off` beside the page. Served (its body the word "off"), the page unregisters every worker of its own,
 * reloads once if a worker still controls it (so the isolation goes with it), and registers nothing while the file is
 * there. The worker checks it too when it activates.
 *
 *   await ensureIsolation()   'isolated' | 'unavailable' | 'tried' | 'registering' | 'off'
 */
const TRIED = 'rp_coi_reloaded', OFF_TRIED = 'rp_coi_off_reloaded';
const flag = k => { try { return sessionStorage.getItem(k) === '1'; } catch (e) { return false; } };
const reloadOnce = k => { if (flag(k)) return; try { sessionStorage.setItem(k, '1'); } catch (e) { /* no storage: still reload, once per load */ } window.location.reload(); };

export async function ensureIsolation({ sw = 'coi-sw.js', off = 'coi-off' } = {}) {
  if (typeof window === 'undefined' || !window.isSecureContext || !('serviceWorker' in navigator)) return 'unavailable';
  let switchedOff = false;
  // the file's body is the word itself: a host that answers any path with the page (a single-page fallback) is not a switch
  try { const r = await fetch(off, { cache: 'no-store' }); switchedOff = r.ok && (await r.text()).trim() === 'off'; } catch (e) { /* unreachable: not switched off */ }
  if (switchedOff) {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    if (navigator.serviceWorker.controller) reloadOnce(OFF_TRIED);
    return 'off';
  }
  if (window.crossOriginIsolated) return 'isolated';
  if (flag(TRIED)) return 'tried';
  try {
    await navigator.serviceWorker.register(sw);
    // controlled already (a worker from an earlier visit) but not isolated: reload once through it; otherwise wait for it
    if (navigator.serviceWorker.controller) reloadOnce(TRIED);
    else navigator.serviceWorker.addEventListener('controllerchange', () => reloadOnce(TRIED), { once: true });
  } catch (e) { return 'unavailable'; }
  return 'registering';
}
