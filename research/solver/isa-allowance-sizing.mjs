/*
 * THE ISA ALLOWANCE FIX'S REACH (D130 (1); EXPLORATORY, seed 7002, deciding nothing): the engine before the fix (a copy of
 * research/engine.mjs with the fix's two lines taken out, as isa-allowance.test.mjs plants it) against the engine as fixed,
 * on the same paths, each plan under its own rules (the app's own projection, no table):
 *   a. Phase 4's panel, each household under arm A's own pick on this code (select-phase4.mjs armA, no tournament);
 *   b. the library's plans (its singles and couples) as entered;
 *   c. the library's plans holding an Auto deposit, under Windfall to ISA (the policy that routes a windfall into the ISA).
 * For each plan with a dated deposit or staged transfer into an ISA (the rest run the same code path, and are checked the same
 * on 20 paths each): survival in points, the paths saved and lost, the mean terminal pot and the unmet spending, after less before.
 *   node research/solver/isa-allowance-sizing.mjs [paths]      (1,000 unless given)
 */
import * as E from '../engine.mjs';
import { readPanel, appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), SEED = 7002, N = Number(process.argv[2]) || 1000;
// the engine before the fix: the two lines the fix added, taken out (each must be there exactly once)
const FIX = ["    if (x.id.startsWith('isa_')) isaContribThisYear[ownerOfId(x.id)] += x.amount;   // a subscription (above)\n",
  "    if (x.toId.startsWith('isa_')) isaContribThisYear[ownerOfId(x.toId)] += move;   // Bed & ISA: a subscription (above)\n"];
let src = readFileSync(join(HERE, '..', 'engine.mjs'), 'utf8');
for (const f of FIX) { if (src.split(f).length !== 2) throw new Error('isa-allowance-sizing: the fix is not in research/engine.mjs once (rebuild it)'); src = src.replace(f, ''); }
const tmp = mkdtempSync(join(tmpdir(), 'isa-sizing-'));
writeFileSync(join(tmp, 'engine.mjs'), src);
const E0 = await import(pathToFileURL(join(tmp, 'engine.mjs')).href);

const isaFlows = ctx => { let n = 0; for (const xs of ctx.oneOffContribs.values()) for (const x of xs) if (String(x.id).startsWith('isa_')) n++; for (const xs of ctx.stagedTransfers.values()) for (const x of xs) if (String(x.toId).startsWith('isa_')) n++; return n; };
function pairOf(plan) {
  // a plan with no deposit or staged transfer into an ISA runs the same code path: 20 paths show it unchanged
  const c1 = E.buildContext(plan), c0 = E0.buildContext(plan), T = c1.totalYears, paths = E.pathsForSeed(SEED, isaFlows(c1) ? N : Math.min(N, 20), T);
  let s0 = 0, s1 = 0, saved = 0, lost = 0, w0 = 0, w1 = 0, u0 = 0, u1 = 0, same = 0;
  for (const z of paths) {
    const zs = Float64Array.from(z), a = E0.runTrial(c0, zs), b = E.runTrial(c1, zs);
    s0 += a.survived ? 1 : 0; s1 += b.survived ? 1 : 0;
    if (b.survived && !a.survived) saved++; if (a.survived && !b.survived) lost++;
    w0 += a.terminalPotNet; w1 += b.terminalPotNet; u0 += a.unmetTotal; u1 += b.unmetTotal;
    if (a.terminalPotNet === b.terminalPotNet && a.unmetTotal === b.unmetTotal && a.survived === b.survived) same++;
  }
  return { n: paths.length, d: 100 * (s1 - s0) / paths.length, surv0: 100 * s0 / paths.length, saved, lost, dw: (w1 - w0) / paths.length, du: (u1 - u0) / paths.length, same, flows: isaFlows(c1) };
}
const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`, gbp = x => `${x < 0 ? '-' : '+'}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const out = [], cid = codeId();
out.push(`THE ISA ALLOWANCE FIX'S REACH (D130 (1); EXPLORATORY, seed ${SEED}, ${N} paths a plan, deciding nothing): the engine before the fix against the engine as fixed, each plan under its own rules; code ${cid ? cid.hash : 'unknown'}`);
const summary = (name, rows) => {
  const hit = rows.filter(r => r.p.flows > 0), ds = hit.map(r => r.p.d).sort((x, y) => x - y);
  const mean = ds.length ? ds.reduce((x, v) => x + v, 0) / ds.length : 0, med = ds.length ? ds[Math.floor((ds.length - 1) / 2)] : 0;
  const worst = hit.reduce((b, r) => (!b || r.p.d < b.p.d ? r : b), null), best = hit.reduce((b, r) => (!b || r.p.d > b.p.d ? r : b), null);
  const changed = hit.filter(r => r.p.same < r.p.n).length, untouchedSame = rows.filter(r => r.p.flows === 0).every(r => r.p.same === r.p.n);
  out.push(`${name}: ${rows.length} plans, ${hit.length} with a dated deposit or staged transfer into an ISA, ${changed} of them run differently on some path; the plans without one the same on every path: ${untouchedSame ? 'yes' : 'NO'}`);
  if (hit.length) out.push(`  survival, after less before, over the ${hit.length}: the mean ${f(mean)} points, the median ${f(med)}, the lowest ${f(worst.p.d)} (${worst.id}), the highest ${f(best.p.d)} (${best.id}); losing more than a point ${hit.filter(r => r.p.d < -1).length}, more than three ${hit.filter(r => r.p.d < -3).length}; gaining more than a point ${hit.filter(r => r.p.d > 1).length}; the mean terminal pot ${gbp(hit.reduce((x, r) => x + r.p.dw, 0) / hit.length)} a path; the mean unmet spending ${gbp(hit.reduce((x, r) => x + r.p.du, 0) / hit.length)} a path`);
  for (const r of hit.filter(x => x.p.same < x.p.n).sort((x, y) => x.p.d - y.p.d).slice(0, 12)) out.push(`  ${r.id.padEnd(8)} ${r.how}: survival ${r.p.surv0.toFixed(1)}% before, ${f(r.p.d)} points (${r.p.saved} saved, ${r.p.lost} lost of ${r.p.n}); the terminal pot ${gbp(r.p.dw)} a path; unmet ${gbp(r.p.du)} a path; paths run the same ${r.p.same} of ${r.p.n}`);
};
// a. Phase 4's panel under arm A's own pick
const panelRows = [];
for (const h of readPanel()) {
  const a = armA(appPlan(h.plan), { tournament: false }), plan = { ...appPlan(h.plan), spending: { ...appPlan(h.plan).spending, decumulationPolicy: a.planState.spending.decumulationPolicy } };
  panelRows.push({ id: h.id, how: `its own pick, ${a.label}`, p: pairOf(plan) });
}
summary("a. Phase 4's panel, each household under arm A's own pick", panelRows);
// b. and c. the library
const lib = buildScenarios(), asEntered = [], windfall = [];
for (const s of lib) {
  asEntered.push({ id: s.id, how: 'as entered', p: pairOf(s.plan) });
  if ((s.plan.oneOffContributions || []).some(c => c.category === E.AUTO_DEPOSIT)) windfall.push({ id: s.id, how: 'Windfall to ISA', p: pairOf({ ...s.plan, spending: { ...s.plan.spending, decumulationPolicy: 'Windfall to ISA' } }) });
}
summary("b. the library's plans as entered", asEntered);
summary("c. the library's plans holding an Auto deposit, under Windfall to ISA", windfall);
rmSync(tmp, { recursive: true, force: true });
console.log(out.join('\n'));
