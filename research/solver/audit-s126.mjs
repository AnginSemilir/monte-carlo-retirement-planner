/*
 * S126'S DEAD CORNER, REPLICATED (PLAN.md "S126's dead corner (#106)"; prediction written there before this ran).
 *
 *   node research/solver/audit-s126.mjs variants [points=16] [paths=1000]   S126 varied one factor at a time
 *   node research/solver/audit-s126.mjs scan                                the library singles in the class, from inputs
 *   node research/solver/audit-s126.mjs ids S126,S…  [points] [paths]       named library households
 *   node research/solver/audit-s126.mjs f1 [points] [paths] [variants|library|all]   F1's paired test
 *   node research/solver/audit-s126.mjs f1v2 [points] [paths] [part k/n]            F1 v2's paired test (PLAN.md 7c)
 *
 * Each mode reads its OWN arguments (fixed 24 Sep: the numbers were read before the mode was chosen, so `ids` read its
 * id list as the grid size - NaN, falling back to 12 points - and took the path count from the argument meant for points).
 * Every mode prints the grid size and path count it actually used.
 *
 * For each household: the pension share a0, the bridge years B and the cliff a* = 1 - N/W (N the bridge's need at
 * target, net of guaranteed income), the table's opening survival and the simulated survival of the solver's own
 * policy on held paths (seed 7002). Flags as step 2's baseline: single table, tiers, levels 1.2..0.8, raise weight
 * 0.003, resilience 0, exact final year, lambda held at S126's landed value.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solvePlan, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const mode = process.argv[2] || 'variants';
// ids mode puts the id list first, so its numbers sit one place later than every other mode's
const NUMS = mode === 'ids' ? process.argv.slice(4) : process.argv.slice(3);
const POINTS = Number(NUMS[0] || 16), NP = Number(NUMS[1] || 1000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-s126: bad grid size or path count (${NUMS.slice(0, 2).join(', ')})`); process.exit(2); }
const LAMBDA = 0.0223606797749979;
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;

/* S126 with its pension share, bridge length and wealth changed; everything else as it is */
function variant(name, { a0 = 0.85, bridge = 2, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * W) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * W) };
    return a;
  });
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}

/* the inputs' view: pension share, bridge years, the bridge's need and the cliff */
function facts(plan) {
  // the same floor the runs use (measure(): 0.8 of target): facts() read the raw plan, which has no floor, so its need
  // was the target need whatever the formula below said (O8, found by the plan-auditor 24 Sep 09:45 UK)
  const pl = E.resolveMpaa(E.normalizePlan({ ...plan, spending: { ...plan.spending, floorSpend: Math.round(0.8 * E.num(plan.spending.targetSpend, 0)) } }));
  const ctx = E.buildContext(pl);
  const o = ctx.owners[0];
  const bal = (re) => pl.accounts.filter(a => re.test(a.category) && a.owner === 'Myself').reduce((t, a) => t + E.num(a.balance, 0), 0);
  const pen = bal(/^Pensions/), liq = bal(LIQ), W = pen + liq;
  const retired = ctx.ageSelf0 >= o.retireAge;
  const B = Math.max(0, ctx.nmpa - Math.max(ctx.ageSelf0, o.retireAge));
  // the bridge's need at the FLOOR (floorFrac x target), not the target: the cliff is where the liquid money cannot
  // carry the floor to pension access (the replication, 24 Sep 07:48 UK; O8: this function kept the target need until
  // 24 Sep 12:12 UK). With no floor set, the target is the need.
  let need = 0, needTarget = 0;
  for (let k = 0; k < B; k++) {
    const age = Math.max(ctx.ageSelf0, o.retireAge) + k;
    const guaranteed = ctx.otherIncomes.reduce((t, inc) => t + (age >= inc.startAge && age <= inc.endAge ? inc.amount : 0), 0) + (age >= ctx.spa ? o.statePension : 0);
    const w = k === 0 && ctx.ageSelf0 >= o.retireAge ? ctx.yf : 1, target = E.spendTargetAtAge(ctx, age);
    needTarget += Math.max(0, target - guaranteed) * w;
    need += Math.max(0, (ctx.floorFrac > 0 ? ctx.floorFrac * target : target) - guaranteed) * w;
  }
  const a0 = W > 0 ? pen / W : 0, aStar = W > 0 ? 1 - need / W : 1;
  return { pl, ctx, a0, B, need, needTarget, W, liq, aStar, retired, inClass: B > 0 && a0 > 0.8 && a0 < aStar };
}

function measure(h, bridgeRead = false) {
  const f = facts(h.plan);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const m = M.prepare(E, plan);
  const t0 = Date.now();
  const r = solve(E, M, plan, { points: POINTS, lambda: LAMBDA, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: true, bridgeRead: bridgeRead || undefined });
  const table = 100 * r.value(M.initialState(m), 0).survival;
  let ok = 0, below = 0, tierYrs = 0; const paths = E.pathsForSeed(7002, NP, m.ctx.totalYears);
  const okArr = new Uint8Array(NP);
  // below: atTarget counts every year at or above target, so years below = spend years - atTarget
  paths.forEach((zs, i) => { const o = runPolicy(r, zs); if (o.survived) { ok++; okArr[i] = 1; } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; });
  const sim = 100 * ok / NP;
  return { ...f, table, sim, gap: table - sim, below: below / NP, tierYrs: tierYrs / NP, okArr, secs: (Date.now() - t0) / 1000 };
}

const f1 = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const line = (id, x) => console.log(`${id.padEnd(16)} a0 ${f1(x.a0, 2)}  B ${x.B}  W ${f1(x.W / 1000, 0)}k  need ${f1(x.need / 1000, 0)}k  a* ${f1(x.aStar, 3)}  class ${x.inClass ? 'YES' : 'no '}  |  table ${f1(x.table).padStart(5)}  sim ${f1(x.sim).padStart(5)}  gap ${f1(x.gap).padStart(6)}  |  years below/path ${f1(x.below)}  pension below plan tier ${f1(x.tierYrs)} yrs  (${f1(x.secs, 0)} s)`);

/* F1's test: each case with the cliff-aware read off and on, on the same paths, paired */
function pairF1(id, h) {
  const a = measure(h, false), b = measure(h, true);
  let disc = 0; for (let i = 0; i < NP; i++) if (a.okArr[i] !== b.okArr[i]) disc++;
  const d = b.sim - a.sim, se = 100 * Math.sqrt(disc) / NP;
  console.log(`${id.padEnd(16)} a0 ${f1(a.a0, 2)} B ${a.B} class ${a.inClass ? 'YES' : 'no '} | OFF table ${f1(a.table).padStart(5)} sim ${f1(a.sim).padStart(5)} gap ${f1(a.gap).padStart(6)} tier-below ${f1(a.tierYrs).padStart(4)} below ${f1(a.below).padStart(4)} | F1 table ${f1(b.table).padStart(5)} sim ${f1(b.sim).padStart(5)} gap ${f1(b.gap).padStart(6)} tier-below ${f1(b.tierYrs).padStart(4)} below ${f1(b.below).padStart(4)} | survival ${(d >= 0 ? '+' : '') + f1(d, 2)} +/- ${f1(se, 2)}`);
}
// the S126 variants the F1 test runs (also read, without solving, by the scan)
const F1_VARIANTS = [['S126', {}], ['share 0.50', { a0: 0.5 }], ['share 0.70', { a0: 0.7 }], ['share 0.78', { a0: 0.78 }], ['share 0.90', { a0: 0.9 }], ['share 0.95', { a0: 0.95 }],
  ['bridge 0', { bridge: 0 }], ['bridge 1', { bridge: 1 }], ['bridge 4', { bridge: 4 }], ['bridge 6', { bridge: 6 }], ['wealth x0.5', { scale: 0.5 }], ['wealth x2', { scale: 2 }]];
/*
 * F1 V2'S TEST (PLAN.md 7c; predictions/f1v2-test.md): off against v2, paired, on the STEP-6 DEFAULTS IN THE MIXTURE -
 * the product's own entry, solvePlan (three worlds, the M17 floor fix, raises capped at 1.1, a minimum pot of one year,
 * risk above the tier with consent), with lambda held at S126's landed value and the grid at POINTS. The table's read
 * is the mixture's: each world's opening read weighted as the solve weights them. The F1 test (mode f1) ran on step 2's
 * settings in the single-table fold; this is its re-test where the product runs.
 */
function measureV2(h, bridgeRead) {
  const f = facts(h.plan);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: bridgeRead || undefined });
  const m = r.m, s0 = M.initialState(m);
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  let ok = 0, below = 0, tierYrs = 0; const paths = E.pathsForSeed(7002, NP, m.ctx.totalYears);
  const okArr = new Uint8Array(NP);
  paths.forEach((zs, i) => { const o = runPolicy(r, zs); if (o.survived) { ok++; okArr[i] = 1; } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; });
  const sim = 100 * ok / NP;
  // what the solve actually ran with, printed so the fair-test table can be checked against the log
  const ran = `mix ${r.meta.mixture} pts ${r.meta.points} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} bridgeRead ${r.meta.bridgeRead}`;
  return { ...f, table, sim, gap: table - sim, below: below / NP, tierYrs: tierYrs / NP, okArr, secs: (Date.now() - t0) / 1000, ran };
}
if (mode === 'f1v2') {
  // the cases, in a fixed order; `part k/n` runs every n-th from the k-th, so a batch can split them across processes
  const cases = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]),
    ...['S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370'].map(id => [id, () => all.find(s => s.id === id)])];
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  console.log(`F1 V2 TEST, step-6 defaults in the mixture (solvePlan), ${POINTS} points, ${NP} held paths (seed 7002), lambda ${LAMBDA}, off against v2, paired; part ${pk}/${pn}`);
  cases.forEach(([id, mk], i) => {
    if (i % pn !== pk) return;
    const h = mk();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const a = measureV2(h, false), b = measureV2(h, 2);
    let disc = 0; for (let j = 0; j < NP; j++) if (a.okArr[j] !== b.okArr[j]) disc++;
    const d = b.sim - a.sim, se = 100 * Math.sqrt(disc) / NP;
    console.log(`${id.padEnd(16)} a0 ${f1(a.a0, 2)} B ${a.B} class ${a.inClass ? 'YES' : 'no '} | OFF table ${f1(a.table).padStart(5)} sim ${f1(a.sim).padStart(5)} gap ${f1(a.gap).padStart(6)} tier-below ${f1(a.tierYrs).padStart(4)} below ${f1(a.below).padStart(4)} | V2 table ${f1(b.table).padStart(5)} sim ${f1(b.sim).padStart(5)} gap ${f1(b.gap).padStart(6)} tier-below ${f1(b.tierYrs).padStart(4)} below ${f1(b.below).padStart(4)} | survival ${(d >= 0 ? '+' : '') + f1(d, 2)} +/- ${f1(se, 2)} | ${f1(a.secs + b.secs, 0)} s`);
    console.log(`${''.padEnd(16)} ran OFF: ${a.ran}`);
    console.log(`${''.padEnd(16)} ran V2:  ${b.ran}`);
  });
} else if (mode === 'f1') {
  const which = process.argv[5] || 'all';
  console.log(`F1 TEST, ${POINTS} points, ${NP} held paths (seed 7002), off against on, paired`);
  const V = F1_VARIANTS;
  const L = ['S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366'];
  if (which === 'all' || which === 'variants') for (const [id, o] of V) pairF1(id, variant(id, o));
  if (which === 'all' || which === 'library') for (const id of L) pairF1(id, all.find(s => s.id === id));
} else if (mode === 'scan') {
  console.log('Library singles in a bridge year at the start, by the class test (0.8 < a0 < a*), from inputs only:');
  let n = 0;
  for (const s of all) {
    const f = facts(s.plan);
    if (f.B > 0 && f.a0 > 0.6) { n++; console.log(`${s.id.padEnd(6)} ${s.name.slice(0, 44).padEnd(44)} a0 ${f.a0.toFixed(2)}  B ${f.B}  a* ${f.aStar.toFixed(3)}  retired ${f.retired ? 'yes' : 'no '}  class ${f.inClass ? 'YES' : 'no'}`); }
  }
  console.log(`${n} singles in a bridge with a0 > 0.6; in the class: ${all.filter(s => facts(s.plan).inClass).map(s => s.id).join(' ') || 'none'}`);
  // the F1 test's variants by the same test, at the floor need (O8: results-f1.txt's class column used the target need)
  console.log('\nThe S126 variants of the F1 test, by the same test (no solve):');
  for (const [id, o] of F1_VARIANTS) { const f = facts(variant(id, o).plan); console.log(`${id.padEnd(12)} a0 ${f.a0.toFixed(2)}  B ${f.B}  W ${(f.W / 1000).toFixed(0)}k  need ${(f.need / 1000).toFixed(0)}k (target ${(f.needTarget / 1000).toFixed(0)}k)  a* ${f.B > 0 ? f.aStar.toFixed(3) : '-'}  class ${f.inClass ? 'YES' : 'no'}`); }
} else if (mode === 'ids') {
  console.log(`NAMED HOUSEHOLDS, ${POINTS} points, ${NP} held paths (seed 7002), lambda ${LAMBDA}`);
  for (const id of process.argv[3].split(',')) line(id, measure(all.find(s => s.id === id)));
} else {
  const V = [
    variant('S126', {}), variant('share 0.50', { a0: 0.5 }), variant('share 0.70', { a0: 0.7 }), variant('share 0.78', { a0: 0.78 }),
    variant('share 0.90', { a0: 0.9 }), variant('share 0.95', { a0: 0.95 }), variant('bridge 0', { bridge: 0 }), variant('bridge 1', { bridge: 1 }),
    variant('bridge 4', { bridge: 4 }), variant('bridge 6', { bridge: 6 }), variant('wealth x0.5', { scale: 0.5 }), variant('wealth x2', { scale: 2 })
  ];
  console.log(`S126 VARIED, ${POINTS} points, ${NP} held paths (seed 7002), lambda ${LAMBDA}`);
  for (const v of V) line(v.id, measure(v));
}
