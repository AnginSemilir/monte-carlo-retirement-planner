// EXPLORATORY: approximate cuts to a couple's path, stacked on the exact flat path (the review's items 11 and 12), each arm
// against the flat path on the same paths: milliseconds a path, paths saved and lost, the pot left and the spending delivered.
//   REPO_ROOT=<a copy with prototype/couple-flat.diff, shortlist.diff and couple-approx.diff applied> [SEED=n] [ASIS=40] [CHECK=1] [CHECKPATHS=20] [ARMS=a,b] node couple-approx.mjs <couple> [points 45] [paths 2000]
// An arm is a ranking and options joined by '+':
//   whole | structure | cells-held@0.005     each person's moves ranked from the whole menu, or from the chooser's shortlist (item 7's widths)
//   one            each person's table read once at a position (COUPLE_APPROX.oneRead)
//   thin<N>x<I>    the bridge's search on N + 1 points and at most I golden-section steps (8 and 10 as it is)
//   screen<n>      every candidate valued in the middle world first, the n best in every world (COUPLE_APPROX.screen)
//   nodraw         (exact) in a year the household draws nothing, one split stands for all five (COUPLE_APPROX.nodraw)
//   near           a pair with a second-ranked move tried only at the first pair's best split and the splits beside it (COUPLE_APPROX.near)
//   top1           each person's first-ranked move only (cp.topK = 1): a diagnostic, not proposed
// An arm ending #N runs the first N paths only. CHECK=1: on the first CHECKPATHS paths every value the flat path gives is
// also worked out by the path as it is, and every ranking both ways (COUPLE.flatCheck, COUPLE.check), with every option off.
// The path as it is runs the first ASIS paths; the flat path must give those bit for bit, or the script exits 1.
import { repoRoot } from './root.mjs';
import { planOf } from './plan-of.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 4242);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple, COUPLE, COUPLE_APPROX, COUPLE_FLAT, COUPLE_CHECKED } = await import(R + '/src/solver/couple.js');
const { SHORT } = await import(R + '/src/solver/solve.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP] = [process.argv[2] || 'S007', Number(process.argv[3] || 45), Number(process.argv[4] || 2000)];
const nA = Math.min(nP, Number(process.env.ASIS || 40));
const ARMS = (process.env.ARMS || 'whole+nodraw#200,whole+one+thin4x3+nodraw+near,structure,cells-held@0.005,structure+one+thin4x3+nodraw+near,cells-held@0.005+one+thin4x3+nodraw+near').split(',');
const { plan, note } = planOf(E, buildScenarios, id);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t00 = Date.now();
const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
const solveS = (Date.now() - t00) / 1000;
const ctx = E.buildContext(withCouple(cp.plan, cp)), paths = E.pathsForSeed(SEED, nP, ctx.totalYears), topK0 = cp.topK;
const setShort = v0 => { const [v, dl] = v0.split('@'); SHORT.delta = dl ? Number(dl) : null; SHORT.levels = true; SHORT.time = false; SHORT.mode = v.startsWith('cells') ? 'cells' : v; SHORT.layers = v === 'cells-held' ? 'held' : 'all'; };
const setArm = (arm) => {
  COUPLE_APPROX.oneRead = false; COUPLE_APPROX.shareN = 8; COUPLE_APPROX.shareIters = 10; COUPLE_APPROX.screen = 0; COUPLE_APPROX.nodraw = false; COUPLE_APPROX.near = false; cp.topK = topK0; SHORT.on = false;
  if (!arm) return;
  const [rank, ...extra] = arm.split('#')[0].split('+');
  if (rank !== 'whole') { setShort(rank); SHORT.on = true; }
  for (const x of extra) {
    let mt;
    if (x === 'one') COUPLE_APPROX.oneRead = true;
    else if ((mt = /^thin(\d+)x(\d+)$/.exec(x))) { COUPLE_APPROX.shareN = Number(mt[1]); COUPLE_APPROX.shareIters = Number(mt[2]); }
    else if ((mt = /^screen(\d+)$/.exec(x))) COUPLE_APPROX.screen = Number(mt[1]);
    else if (x === 'top1') cp.topK = 1;
    else if (x === 'nodraw') COUPLE_APPROX.nodraw = true;
    else if (x === 'near') COUPLE_APPROX.near = true;
    else throw new Error(`arm '${arm}': '${x}' is not an option`);
  }
};
const run = (flat, arm, n) => {
  COUPLE.flat = flat; setArm(arm); cp._flat = undefined;
  const s0 = { ...SHORT.stats }, a0 = { ...COUPLE_APPROX.stats };
  const t0 = process.hrtime.bigint(); const out = paths.slice(0, n).map(zs => E.runTrial(ctx, zs)); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / n;
  const r = { out, ms, whole: (SHORT.stats.fallback - s0.fallback) + ((SHORT.stats.checked || 0) - (s0.checked || 0)), rankings: SHORT.stats.decisions - s0.decisions,
    cand: COUPLE_APPROX.stats.candidates - a0.candidates, out2: COUPLE_APPROX.stats.screenedOut - a0.screenedOut, stepped: COUPLE_APPROX.stats.stepped - a0.stepped };
  setArm(null); COUPLE.flat = true;
  return r;
};
for (const arm of [null, ...ARMS]) run(true, arm, Math.min(nP, 5)); run(false, null, Math.min(nP, 5));   // warm every arm
const a = run(false, null, nA), f = run(true, null, nP), a2 = run(false, null, nA);
const msA = Math.min(a.ms, a2.ms);
const same = a.out.every((x, i) => x.survived === f.out[i].survived && Object.is(x.terminalPot, f.out[i].terminalPot));
const surv = f.out.filter(x => x.survived).length, mean = (o, k) => o.reduce((s, x) => s + x[k], 0) / o.length;
const br = (tab) => (tab.g && tab.g.reader ? tab.g.reader.years.reduce((s, b) => s + (b ? 1 : 0), 0) : 0);
console.log(`${id}${id.includes('@') || id.includes(':') ? ` (${note})` : ''} at ${pts} points (solve ${solveS.toFixed(0)} s), seed ${SEED}, ${ctx.totalYears + 1} years, bridge years ${br(cp.tables.self)} and ${br(cp.tables.part)}: as it is ${msA.toFixed(1)} ms a path (${nA} paths); flat ${f.ms.toFixed(1)} ms (${(msA / f.ms).toFixed(2)} times; ${nP} paths, ${surv} surviving, ${(100 * surv / nP).toFixed(2)}%); the first ${nA} paths' survival and pot left the same bit for bit: ${same}`);
let bad = !same;
if (process.env.CHECK === '1') {
  const nC = Math.min(nP, Number(process.env.CHECKPATHS || 20));
  for (const k of Object.keys(COUPLE_FLAT)) COUPLE_FLAT[k] = k === 'first' ? null : 0;
  COUPLE_CHECKED.decisions = 0; COUPLE_CHECKED.fast = 0; COUPLE_CHECKED.differ = 0;
  COUPLE.flatCheck = true; COUPLE.check = true; run(true, null, nC); COUPLE.flatCheck = false; COUPLE.check = false;
  console.log(`   every value both ways (${nC} paths, every option off): ${COUPLE_FLAT.checked} valued, ${COUPLE_FLAT.differ} differ; every ranking both ways: ${COUPLE_CHECKED.fast} ranked, ${COUPLE_CHECKED.differ} differ`);
  if (COUPLE_FLAT.differ > 0 || COUPLE_CHECKED.differ > 0 || COUPLE_FLAT.checked === 0 || COUPLE_CHECKED.fast === 0) bad = true;
}
for (const arm0 of ARMS) {
  const [arm, cap] = arm0.split('#'), nR = cap ? Math.min(nP, Number(cap)) : nP;
  const c = run(true, arm, nR); let saved = 0, lost = 0, moved = 0;
  c.out.forEach((y, i) => { const x = f.out[i]; if (y.survived && !x.survived) saved++; if (x.survived && !y.survived) lost++; if (x.survived !== y.survived || !Object.is(x.terminalPot, y.terminalPot)) moved++; });
  const d = saved - lost, se = Math.sqrt(Math.max(saved + lost - d * d / nR, 0)) / nR;   // the paired difference's standard error
  const fo = f.out.slice(0, nR), stepF = cap ? null : f.stepped;
  console.log(`   ${arm0.padEnd(42)} ${c.ms.toFixed(1).padStart(7)} ms a path  ${(msA / c.ms).toFixed(2).padStart(6)} times as it is, ${(f.ms / c.ms).toFixed(2)} flat | ${saved} saved, ${lost} lost (${(100 * d / nR).toFixed(3)} points, se ${(100 * se).toFixed(3)}) | pot left ${(100 * (mean(c.out, 'terminalPot') / mean(fo, 'terminalPot') - 1)).toFixed(2)}% | spending ${(100 * (mean(c.out, 'realisedSpend') / mean(fo, 'realisedSpend') - 1)).toFixed(3)}% | paths that differ at all ${moved} of ${nR}${c.rankings ? ` | whole menu after all ${c.whole} of ${c.rankings} rankings` : ''}${c.cand ? ` | screened out ${c.out2} of ${c.cand} candidates` : ''}${stepF ? ` | joint moves stepped ${(100 * c.stepped / stepF).toFixed(0)}% of the flat path's` : ''}`);
}
if (bad) { console.log('IDENTITY FAILED'); process.exit(1); }
