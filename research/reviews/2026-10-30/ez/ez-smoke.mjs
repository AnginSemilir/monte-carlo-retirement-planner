/*
 * EZ'S FIRST LOOK (EXPLORATORY; EZ.md; not the calibration and not the run). S090 at light settings (4 wealth points, a
 * small reference lattice, e3pcls off: the pin is not yet refreshed on the patched code, and e3pcls changes no table), 200
 * paths of seed 99001. Arms: the candidate (CAND, the dial at 1); EZ at gamma 4, rho 2 (EZ4); the same without the chance
 * of dying (EZ4-NM: mode 1000, so every year counts in full); EZ at gamma 10, rho 2 (EZ10). Per arm: survival; how the
 * failures fall (running out, by age; ending below the minimum pot); the spending level by age band among the paths still
 * going; the share of retired years at the top level, at target, below it and at the floor.
 *   node ez-smoke.mjs > results-ez-smoke.txt      (from the root of the patched code)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs'), S = await imp('src/solver/solve.js');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const ID = 'S090', N = 200, SEED = 99001;
const h = readPanel().find(x => x.id === ID);
const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy;
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk }));
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true }, e3pcls: false };
const LOOP = { tsOnce: false };
const ARMS = [
  ['CAND', {}],
  ['EZ4', { ...LOOP, ez: { gamma: 4, rho: 2 } }],
  ['EZ4-NM', { ...LOOP, ez: { gamma: 4, rho: 2, mortality: { mode: 1000, disp: 9 } } }],
  ['EZ10', { ...LOOP, ez: { gamma: 10, rho: 2 } }]
];
console.log(`EZ's first look (EXPLORATORY): ${ID} at light settings (4 points, lattice 24/5/16, e3pcls off), ${N} paths of seed ${SEED}; the candidate's plan with the app's policy (${pk})`);
const pct = (a, b) => (b > 0 ? (100 * a / b).toFixed(1) : '-');
let first = true;
for (const [name, extra] of ARMS) {
  const t0 = Date.now();
  const r = C.solveCandidate(E, M, structuredClone(plan), { ...light, ...extra });
  const T = r.m.ctx.totalYears, a0 = r.m.ctx.ageSelf0, Y = T + 1, spend = r.c.yr.spend;
  if (first) { console.log(`age ${a0} to ${a0 + T}; retired (spending) from year ${Array.from(spend).findIndex(x => x > 0)}; the minimum pot ${Math.round(r.m.ctx.solvencyFloor)}; the menu's levels ${r.meta.spendLevels.join(', ')}`); first = false; }
  const paths = E.pathsForSeed(SEED, N, T);
  const tr = { Y, level: new Uint8Array(N * Y), tier: new Uint8Array(N * Y), wealth: new Float64Array(N * Y), penShare: new Uint8Array(N * Y), taxPaid: new Float64Array(N * Y), failYear: new Int16Array(N).fill(-1) };
  const runs = paths.map((zs, i) => { tr.row = i; return S.runPolicy(r, zs, { trace: tr }); });
  const surv = runs.filter(x => x.survived).length, ranOut = runs.filter(x => !x.survived && tr.failYear[runs.indexOf(x)] >= 0);
  const outAges = runs.map((x, i) => (!x.survived && tr.failYear[i] >= 0 ? a0 + tr.failYear[i] : null)).filter(x => x !== null);
  const belowPot = runs.filter((x, i) => !x.survived && tr.failYear[i] < 0).length;
  const bands = [[a0, 70], [71, 80], [81, 90], [91, a0 + T]];
  const band = bands.map(([lo, hi]) => { let s = 0, n = 0; for (let i = 0; i < N; i++) for (let t = 0; t <= T; t++) { const age = a0 + t; if (age < lo || age > hi || !(spend[t] > 0)) continue; if (tr.failYear[i] >= 0 && t >= tr.failYear[i]) continue; s += tr.level[i * Y + t]; n++; } return n ? (s / n).toFixed(1) : '-'; });
  let yrs = 0, top = 0, at = 0, below = 0, floorY = 0; const lvTop = Math.round(100 * Math.max(...r.meta.spendLevels)), lvFloor = Math.round(100 * Math.min(...r.meta.spendLevels));
  for (let i = 0; i < N; i++) for (let t = 0; t <= T; t++) { if (!(spend[t] > 0) || (tr.failYear[i] >= 0 && t >= tr.failYear[i])) continue; const l = tr.level[i * Y + t]; yrs++; if (l >= lvTop) top++; if (l === 100) at++; if (l < 100) below++; if (l <= lvFloor) floorY++; }
  const outBy = bands.map(([lo, hi]) => outAges.filter(a => a >= lo && a <= hi).length);
  console.log(`${name.padEnd(7)} survival ${pct(surv, N)}% (${surv} of ${N}); ran out ${ranOut.length} (at ages ${bands.map(([lo, hi], b) => `${lo}-${hi}: ${outBy[b]}`).join(', ')}), ended below the minimum pot ${belowPot}; level by age (%) ${bands.map(([lo, hi], b) => `${lo}-${hi} ${band[b]}`).join(', ')}; retired years at the top ${pct(top, yrs)}%, at target ${pct(at, yrs)}%, below ${pct(below, yrs)}%, at the floor ${pct(floorY, yrs)}%; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
