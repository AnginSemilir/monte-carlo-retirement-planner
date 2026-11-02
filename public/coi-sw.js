/*
 * THE PAGE'S CROSS-ORIGIN ISOLATION WHERE THE HOST SENDS NO HEADERS (Part C Phase 10, the launch plan's B5: GitHub Pages
 * cannot send COOP and COEP). This service worker re-serves the app's own responses with them, so the page and its workers
 * are cross-origin isolated and a solve can be split across workers (src/solverPool.js needs SharedArrayBuffer). Every
 * asset the app loads is its own, so `require-corp` blocks nothing. Registered only with the solver's switch on, when the
 * first solve starts (src/isolation.js), so the site with the switch off has no service worker at all.
 *
 * The switch file: if `coi-off` is served beside this file (its body the word "off"), the worker unregisters itself on its next activation and the
 * pages it controls reload without it (the launch plan: a way back if it misbehaves on the live site).
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => event.waitUntil((async () => {
  try {
    const off = await fetch('coi-off', { cache: 'no-store' });
    if (off.ok && (await off.text()).trim() === 'off') {   // the word itself: a single-page fallback is not a switch
      await self.registration.unregister();
      for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
      return;
    }
  } catch (e) { /* no switch file: carry on */ }
  await self.clients.claim();
})()));

self.addEventListener('fetch', event => {
  const req = event.request;
  // a request the worker may not re-issue (a cache-only request across origins) passes untouched
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(res => {
    if (!res || res.status === 0 || res.type === 'opaque') return res;
    const headers = new Headers(res.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }));
});
