// EXPLORATORY: a couple's path with the joint move's expectation on flat arrays (COUPLE.flat; the review's item 11) against
// the path as it is, under the engine (E.runTrial on withCouple's plan, as the couples' audit runs a unit).
// Identity: every decision's joint move and score, and every path's survival and pot left, compared bit for bit; with CHECK=1
// every value is also computed both ways inside one run (COUPLE.flatCheck) and every ranking both ways (COUPLE.check), on
// the first CHECKPATHS paths. PLANT names the test's plants: each must change values (CHECKLIST 5). Exit 1 if anything
// differs, or a plant changes nothing.
//   REPO_ROOT=<a copy with prototype/couple-flat.diff applied> [SEED=n] [ARM=SHIPC] [CHECK=1] [PLANT=flatrate,flatmemo,flatmove] [CHECKPATHS=40] node couple-flat.mjs <couple> [points 4] [paths 100]
// ARM=SHIPC: each person's table at the product's settings as the couples' audit solves that arm (30 points there); its
// rankings never reach the shared scores (no switch charge), so only the values are compared both ways.
// <couple>: a touched library couple, by plan-of.mjs's names (S007; S303@52:land for one dressed as the panel's younger cohort).
import { repoRoot } from './root.mjs';
import { planOf } from './plan-of.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 4242);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple, COUPLE, COUPLE_FLAT, COUPLE_CHECKED } = await import(R + '/src/solver/couple.js');
const { solvePlan } = await import(R + '/src/solver/solve.js');
const ARM = process.env.ARM || 'CANDC';   // SHIPC: each person's table at the product's settings, as the couples' audit solves that arm (solvePlan, its lambda, the estate weight 0.02)
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP] = [process.argv[2] || 'S007', Number(process.argv[3] || 4), Number(process.argv[4] || 100)];
const { plan, note } = planOf(E, buildScenarios, id);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t00 = Date.now();
const cp = ARM === 'SHIPC'
  ? solveCouple(E, M, E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } })), { solveOne: (p) => solvePlan(E, M, p, { lambda: 0.0223606797749979, bequestWeight: 0.02, ...opts }) })
  : solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
const solveS = (Date.now() - t00) / 1000;
const pl = withCouple(cp.plan, cp), pol = pl.spending.policyOverride, choose0 = pol.choose.bind(pol);
let log = null;
pol.choose = (st, t) => { const j = choose0(st, t); if (log) log.push(t, j.split, j.ia, j.ib, j.spendLevel === undefined ? -1 : j.spendLevel, j.score === undefined ? NaN : j.score); return j; };
const ctx = E.buildContext(pl), paths = E.pathsForSeed(SEED, nP, ctx.totalYears);
const br = (tab) => (tab.g && tab.g.reader ? tab.g.reader.years.reduce((a, b) => a + (b ? 1 : 0), 0) : 0);
const nC = Math.min(nP, Number(process.env.CHECKPATHS || 40));   // the paths the slower checks and the plants run
const run = (flat, plant = '', n = nP) => {
  COUPLE.flat = flat; COUPLE.plant = plant; cp._flat = undefined; log = [];
  for (const k of Object.keys(COUPLE_FLAT)) COUPLE_FLAT[k] = k === 'first' ? null : 0;
  const t0 = process.hrtime.bigint(); const out = paths.slice(0, n).map(zs => E.runTrial(ctx, zs)); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / n;
  const r = { out, ms, log, count: { ...COUPLE_FLAT } }; COUPLE.plant = ''; log = null; return r;
};
const cmp = (a, b) => {
  let paths = 0, dec = 0;
  b.out.forEach((x, i) => { if (x.survived !== a.out[i].survived || !Object.is(x.terminalPot, a.out[i].terminalPot)) paths++; });
  const n = b.log.length;   // b may be the first paths only (the checks and the plants): a's decisions come in the same order
  for (let i = 0; i < n; i += 6) { let d = false; for (let k = 0; k < 6; k++) if (!Object.is(a.log[i + k], b.log[i + k])) d = true; if (d) dec++; }
  return { paths, dec, n: n / 6 };
};
run(true, '', Math.min(nP, 10)); run(false, '', Math.min(nP, 10));   // warm both
const a = run(false), b = run(true), a2 = run(false), b2 = run(true);
const msA = Math.min(a.ms, a2.ms), msB = Math.min(b.ms, b2.ms), c = cmp(a, b);
console.log(`${id}${id.includes('@') || id.includes(':') ? ` (${note})` : ''}${ARM === 'SHIPC' ? ', the product\'s settings' : ''} at ${pts} points (solve ${solveS.toFixed(0)} s), ${nP} paths of seed ${SEED}, ${ctx.totalYears + 1} years, bridge years ${br(cp.tables.self)} and ${br(cp.tables.part)}: as it is ${msA.toFixed(1)} ms a path; flat ${msB.toFixed(1)} ms (${(msA / msB).toFixed(2)} times)`);
console.log(`   decisions ${c.n}: ${c.dec} differ; paths: ${c.paths} of ${nP} differ in survival or pot left; positions valued ${b.count.values}, taken from one already valued ${b.count.memo} (${(100 * b.count.memo / (b.count.memo + b.count.values)).toFixed(1)}%), table reads ${b.count.reads}`);
let bad = c.dec > 0 || c.paths > 0;
if (process.env.CHECK === '1') {
  COUPLE.flatCheck = true; COUPLE.check = true; COUPLE_CHECKED.decisions = 0; COUPLE_CHECKED.fast = 0; COUPLE_CHECKED.differ = 0;
  const k = run(true, '', nC); COUPLE.flatCheck = false; COUPLE.check = false;
  console.log(`   every value both ways (${nC} paths): ${k.count.checked} valued, ${k.count.differ} differ; every ranking both ways: ${COUPLE_CHECKED.fast} ranked, ${COUPLE_CHECKED.differ} differ`);
  // the product's settings carry no switch charge, so rankFor returns rankActions' ranking before the shared scores: none to compare
  if (k.count.differ > 0 || COUPLE_CHECKED.differ > 0 || k.count.checked === 0 || (COUPLE_CHECKED.fast === 0 && ARM !== 'SHIPC')) { bad = true; console.log('   first:', JSON.stringify(k.count.first)); }
}
if (process.env.PLANT) for (const plant of process.env.PLANT.split(',')) {
  if (plant === 'flatmove' && br(cp.tables.self) + br(cp.tables.part) === 0) { console.log(`   planted 'flatmove': not run here: no bridge year, so the rollout moves no money between the two (it is run on the couples with one)`); continue; }
  COUPLE.flatCheck = true; const p = run(true, plant, nC), d = cmp(a, p); COUPLE.flatCheck = false;
  console.log(`   planted '${plant}': ${p.count.differ} of ${p.count.checked} values differ from the path as it is, ${d.dec} of ${d.n} decisions, ${d.paths} of ${nC} paths${p.count.differ > 0 && d.dec > 0 ? '' : p.count.differ > 0 ? '  (the value check sees it; no decision turned on it)' : '  <- THE PLANT DID NOT BITE'}`);
  if (p.count.differ === 0) bad = true;
}
if (bad) { console.log('IDENTITY FAILED'); process.exit(1); }
