// EXPLORATORY (the external review, 11 Nov): item 12's stage A, run by the review at the maintainer's request. Approximate cuts
// to a couple's path, each arm against the exact flat path on the same paths. One couple solved once at the candidate's
// settings; then the flat path on the whole menu and each arm on the same paths, with each person's tiers held tallied at
// every decision (the rule's part 5).
//   REPO_ROOT=<a copy with couple-flat.diff, shortlist.diff and couple-approx.diff of 2026-11-09/prototype applied>
//     [SEED=99012] [OFFSET=0] [ASIS=20] [ARMS=a,b] node couple-approx-full.mjs <couple> [points 45] [paths 8000]
// The paths are numbers OFFSET to OFFSET + paths - 1 of the seed's stream (the stream is the same whatever its length), so a
// couple can run in chunks; each chunk solves again, and the tables are the same. An arm is named as in
// ../../2026-11-09/scripts/couple-approx.mjs: a ranking (whole | order | structure | cells-held@0.005) and options joined by '+'
// (one, thin<N>x<I>, nodraw, near). The path as it is runs the chunk's first ASIS paths; the flat path must give those bit
// for bit, or the script exits 1. Each arm prints a line to read and a line '#DATA' of raw sums, which
// couple-approx-pool.py pools over chunks and couples.
import { repoRoot } from './root.mjs';
import { planOf } from './plan-of.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 99012), OFFSET = Number(process.env.OFFSET || 0);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple, COUPLE, COUPLE_APPROX } = await import(R + '/src/solver/couple.js');
const { SHORT } = await import(R + '/src/solver/solve.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP] = [process.argv[2] || 'S007', Number(process.argv[3] || 45), Number(process.argv[4] || 8000)];
const nA = Math.min(nP, Number(process.env.ASIS || 20));
const ARMS = (process.env.ARMS || 'order,order+one+thin4x3+nodraw+near').split(',');
const { plan, note } = planOf(E, buildScenarios, id);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t00 = Date.now();
const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
const solveS = (Date.now() - t00) / 1000;
const ctx0 = E.buildContext(withCouple(cp.plan, cp)), topK0 = cp.topK;
const paths = E.pathsForSeed(SEED, OFFSET + nP, ctx0.totalYears).slice(OFFSET);
const target = Number(cp.plan.spending.targetSpend);
// each person's tiers as the engine holds them coming into each decision, summed: [decisions, self pen, self isa, partner pen, partner isa]
const tiers = [0, 0, 0, 0, 0], owners = cp.m.ctx.owners.map(o => o.key);
const base = ctx0.policyOverride;
const ctx = { ...ctx0, policyOverride: { ...base, choose(st, t) {
  const h = st.tierHeld || {}; tiers[0]++;
  owners.forEach((k, j) => { const x = h[k]; if (x) { tiers[1 + 2 * j] += x.pen || 0; tiers[2 + 2 * j] += x.isa || 0; } });
  return base.choose(st, t);
} } };
const setShort = v0 => { const [v, dl] = v0.split('@'); SHORT.delta = dl ? Number(dl) : null; SHORT.levels = true; SHORT.time = false; SHORT.mode = v.startsWith('cells') ? 'cells' : v; SHORT.layers = v === 'cells-held' ? 'held' : 'all'; };
const setArm = (arm) => {
  COUPLE_APPROX.oneRead = false; COUPLE_APPROX.shareN = 8; COUPLE_APPROX.shareIters = 10; COUPLE_APPROX.screen = 0; COUPLE_APPROX.nodraw = false; COUPLE_APPROX.near = false; cp.topK = topK0; SHORT.on = false;
  if (!arm) return;
  const [rank, ...extra] = arm.split('+');
  if (rank !== 'whole') { setShort(rank); SHORT.on = true; }
  for (const x of extra) {
    let mt;
    if (x === 'one') COUPLE_APPROX.oneRead = true;
    else if ((mt = /^thin(\d+)x(\d+)$/.exec(x))) { COUPLE_APPROX.shareN = Number(mt[1]); COUPLE_APPROX.shareIters = Number(mt[2]); }
    else if (x === 'nodraw') COUPLE_APPROX.nodraw = true;
    else if (x === 'near') COUPLE_APPROX.near = true;
    else throw new Error(`arm '${arm}': '${x}' is not an option`);
  }
};
const run = (flat, arm, n) => {
  COUPLE.flat = flat; setArm(arm); cp._flat = undefined; tiers.fill(0);
  const t0 = process.hrtime.bigint(); const out = paths.slice(0, n).map(zs => E.runTrial(ctx, zs)); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / n;
  const r = { out, ms, tiers: [...tiers] }; setArm(null); COUPLE.flat = true; return r;
};
for (const arm of [null, ...ARMS]) run(true, arm, Math.min(nP, 3)); run(false, null, Math.min(nP, 3));   // warm every arm
const a = run(false, null, nA), f = run(true, null, nP);
const same = a.out.every((x, i) => x.survived === f.out[i].survived && Object.is(x.terminalPot, f.out[i].terminalPot));
const sum = (o, k) => o.reduce((s, x) => s + x[k], 0), surv = f.out.filter(x => x.survived).length;
const br = (tab) => (tab.g && tab.g.reader ? tab.g.reader.years.reduce((s, b) => s + (b ? 1 : 0), 0) : 0);
const tl = t => `${(t[1] / t[0]).toFixed(3)}/${(t[2] / t[0]).toFixed(3)} and ${(t[3] / t[0]).toFixed(3)}/${(t[4] / t[0]).toFixed(3)}`;
console.log(`${id}${id.includes('@') || id.includes(':') ? ` (${note})` : ''} at ${pts} points (solve ${solveS.toFixed(0)} s), seed ${SEED}, paths ${OFFSET} to ${OFFSET + nP - 1}, ${ctx0.totalYears + 1} years, bridge years ${br(cp.tables.self)} and ${br(cp.tables.part)}, target £${Math.round(target).toLocaleString('en-GB')}: as it is ${a.ms.toFixed(1)} ms a path (${nA} paths); flat ${f.ms.toFixed(1)} ms (${nP} paths, ${surv} surviving, ${(100 * surv / nP).toFixed(2)}%); mean pot £${Math.round(sum(f.out, 'terminalPot') / nP).toLocaleString('en-GB')}, spending ${(100 * sum(f.out, 'realisedSpend') / nP / target).toFixed(3)}% of target, lifetime tax £${Math.round(sum(f.out, 'lifetimeTax') / nP).toLocaleString('en-GB')}; tiers held, pension/ISA, each person: ${tl(f.tiers)}; the flat path and the path as it is, the first ${nA} paths bit for bit: ${same}`);
const data = (arm, c, saved, lost, moved) => console.log('#DATA ' + JSON.stringify({ id, pts, seed: SEED, offset: OFFSET, n: nP, arm, target, baseSurv: surv, saved, lost, moved,
  potBase: sum(f.out, 'terminalPot'), potArm: sum(c.out, 'terminalPot'), spendBase: sum(f.out, 'realisedSpend'), spendArm: sum(c.out, 'realisedSpend'),
  spendD2: c.out.reduce((s, y, i) => s + (y.realisedSpend - f.out[i].realisedSpend) ** 2, 0),   // for the paired standard error of the spending difference
  taxBase: sum(f.out, 'lifetimeTax'), taxArm: sum(c.out, 'lifetimeTax'), tiersBase: f.tiers, tiersArm: c.tiers, msBase: f.ms, msArm: c.ms, msAsIs: a.ms }));
for (const arm of ARMS) {
  const c = run(true, arm, nP); let saved = 0, lost = 0, moved = 0;
  c.out.forEach((y, i) => { const x = f.out[i]; if (y.survived && !x.survived) saved++; if (x.survived && !y.survived) lost++; if (x.survived !== y.survived || !Object.is(x.terminalPot, y.terminalPot)) moved++; });
  const d = saved - lost, se = Math.sqrt(Math.max(saved + lost - d * d / nP, 0)) / nP;   // the paired difference's standard error
  const sp = 100 * (sum(c.out, 'realisedSpend') - sum(f.out, 'realisedSpend')) / nP / target;
  console.log(`   ${arm.padEnd(36)} ${c.ms.toFixed(1).padStart(7)} ms a path (${(f.ms / c.ms).toFixed(2)} times flat) | ${saved} saved, ${lost} lost (${(100 * d / nP).toFixed(3)} points, se ${(100 * se).toFixed(3)}) | spending ${sp >= 0 ? '+' : ''}${sp.toFixed(3)} points of target | pot left ${(100 * (sum(c.out, 'terminalPot') / sum(f.out, 'terminalPot') - 1)).toFixed(2)}% | lifetime tax ${(100 * (sum(c.out, 'lifetimeTax') / sum(f.out, 'lifetimeTax') - 1)).toFixed(2)}% | tiers held ${tl(c.tiers)} | paths that differ at all ${moved} of ${nP}`);
  data(arm, c, saved, lost, moved);
}
if (!same) { console.log('IDENTITY FAILED'); process.exit(1); }
