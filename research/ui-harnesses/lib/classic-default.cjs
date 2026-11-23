/*
 * THE CLASSIC PLANNER, CHOSEN (22 Nov 2026).
 *
 * The new planner became the default that day, the maintainer's word ("Switch the new solver from beta to the default"):
 * a visitor who has chosen nothing among the planners gets the new planner, and the classic planner is the one chosen with
 * "Classic planner" (rp_planner 'classic'). Until then every harness that did not opt in saw the classic planner, and the
 * harnesses written for it relied on that without saying so.
 *
 * So a classic planner's harness requires this file once, at its top, and it says so in one line:
 *   require('./lib/classic-default.cjs');
 * It wraps the Playwright the harnesses load (/tmp/node_modules/playwright, the same module object every harness gets): every
 * browser context and page made afterwards first sets rp_planner to 'classic' where nothing has set it yet, so the harness sees
 * the planner it was written for, as the solver's harnesses opt in to the new one. A harness that sets rp_planner itself (the
 * first-load harness measuring the new planner, the phone harness's opted-in run) is unchanged: the seed only fills an empty key.
 * Requiring it twice wraps once.
 */
const pw = require('/tmp/node_modules/playwright');

const SEED = () => { try { if (localStorage.getItem('rp_planner') === null) localStorage.setItem('rp_planner', 'classic'); } catch (e) { /* no storage */ } };

function wrapBrowser(b) {
  if (!b || b.__classicDefault) return b;
  b.__classicDefault = true;
  const newContext = b.newContext.bind(b), newPage = b.newPage.bind(b);
  b.newContext = async (...a) => { const c = await newContext(...a); await c.addInitScript(SEED); return c; };
  b.newPage = async (...a) => { const p = await newPage(...a); await p.context().addInitScript(SEED); return p; };
  return b;
}

for (const name of ['chromium', 'firefox', 'webkit']) {
  const t = pw[name];
  if (!t || t.__classicDefault) continue;
  t.__classicDefault = true;
  const launch = t.launch.bind(t), persistent = t.launchPersistentContext.bind(t);
  t.launch = async (...a) => wrapBrowser(await launch(...a));
  t.launchPersistentContext = async (...a) => { const c = await persistent(...a); await c.addInitScript(SEED); return c; };
}

module.exports = { SEED };
