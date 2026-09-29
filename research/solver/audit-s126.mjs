/*
 * S126'S DEAD CORNER, REPLICATED (PLAN.md "S126's dead corner (#106)"; prediction written there before this ran).
 *
 *   node research/solver/audit-s126.mjs variants [points=16] [paths=1000]   S126 varied one factor at a time
 *   node research/solver/audit-s126.mjs scan                                the library singles in the class, from inputs
 *   node research/solver/audit-s126.mjs ids S126,S…  [points] [paths]       named library households
 *   node research/solver/audit-s126.mjs f1 [points] [paths] [variants|library|all]   F1's paired test
 *   node research/solver/audit-s126.mjs f1v2 [points] [paths] [part k/n]            F1 v2's paired test (PLAN.md 7c)
 *   node research/solver/audit-s126.mjs trace [points] [paths] [case]               O22's trace: 5/15 points x final year averaged/exact
 *   node research/solver/audit-s126.mjs time [points] [runs] [ids]                  7k: the solve's time with and without the exact final year
 *   node research/solver/audit-s126.mjs readertime [points] [runs]                  the bridge reader's added solve time (its design's check 6)
 *   node research/solver/audit-s126.mjs bridge7e [points] [paths] part k/n [arms] [ids]  7e: off, F1 v1, F1 v2 and the reader, paired
 *   node research/solver/audit-s126.mjs diag7v [points] [paths] part k/n [seed] [world paths]  7v: the switch margin's dose-response
 *   node research/solver/audit-s126.mjs diag7w [points] [paths] part k/n [seed]  7w: 5 against 15 return points on share 0.95 (Q)
 *   node research/solver/audit-s126.mjs diag7x [points] [paths] part k/n [seed] [world paths]  7x: held-for-life tables against their own runs
 *   node research/solver/audit-s126.mjs diag7z [points] [paths] part k/n [seed]  7z: Q's fix (bridgeStep 'exact') on against off, the reader on
 *   node research/solver/audit-s126.mjs diag7y [points] [paths] part k/n [seed]  7y: the tier state against the product, its tier and rest swapped, and held for life
 *   node research/solver/audit-s126.mjs diag7aa [points] [paths] part k/n [seed] [world paths]  7aa: the joint tier state against the product and the tier state, the estate weight 0 and 0.02
 *   node research/solver/audit-s126.mjs diag7ab [points] [paths] part k/n [seed]  7ab: the freed opening beside 7aa's product, read against 7aa's TS+J
 *   node research/solver/audit-s126.mjs diag7ac [points] [paths] part k/n [seed] [world paths]  7ac: TS+J and TS+J with the opening held in the plan's tier (OPEN0)
 *   node research/solver/audit-s126.mjs diag7ad [points, unused] [paths] part k/n [seed] [node paths]  7ad: the refinement check (TS+J and the product at 30x5, 60x5 and 30x15; like-for-like prices by world; node runs)
 *   node research/solver/audit-s126.mjs refs360 [points] [paths] [seed]  O36 on S360 with the reader: held tables, the reader's reference at the plan's tiers and at the held tier
 *   node research/solver/audit-s126.mjs o41 [points] [paths] [seed]  O41's bound: the tier state per world against the joint tier state, tables only
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
import { solve, solvePlan, runPolicy, chooseAction, scoreMoves, nearestIndex } from '../../src/solver/solve.js';
import { swapChooser, tsSwapChooser } from './swap.mjs';
import { learningChooser, oracleChooser } from './learn.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadavg } from 'node:os';
import { codeId } from './code-id.mjs';

const mode = process.argv[2] || 'variants';
// THE LOG'S STAMP (25 Sep evening): the shared fair-test gate reads JSON result files, and this script writes text logs, so
// a reducer over them reads this line instead - the code that ran (code-id.mjs) and the prediction the launcher registered
// (its file and git blob), "none" for a measurement, or NOT-LAUNCHED when run outside run-from-snapshot.sh
// (code-id.mjs's hash covers the engine and src/solver, not this script, so the script's own hash is stamped beside it)
// (kept as STAMP too, so a mode that writes files beside its log can stamp them: diag7r's traces)
const STAMP = (() => {
  // the audit hash covers this script and the choosers it runs: swap.mjs, which picks every move of diag7r's swap arms (the
  // sixty-seventh review, MINOR 3), and learn.mjs, which picks every move of diag7t's learning arms (26 Sep)
  const here = dirname(fileURLToPath(import.meta.url));
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(join(here, 'swap.mjs'))).update(readFileSync(join(here, 'learn.mjs'))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
// ids mode puts the id list first, so its numbers sit one place later than every other mode's
const NUMS = mode === 'ids' ? process.argv.slice(4) : process.argv.slice(3);
const POINTS = Number(NUMS[0] || 16), NP = Number(NUMS[1] || 1000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-s126: bad grid size or path count (${NUMS.slice(0, 2).join(', ')})`); process.exit(2); }
const LAMBDA = 0.0223606797749979;
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;

/* S126 with its pension share, bridge length and wealth changed, and optionally a one-off cost `cost: [years from now,
 * amount]` (the F1 v2 test's cost case, maintainer 24 Sep: no library bridge household has a cost inside its bridge);
 * everything else as it is */
function variant(name, { a0 = 0.85, bridge = 2, scale = 1, cost = null } = {}) {
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
  if (cost) {
    const y = E.buildContext(E.normalizePlan(p)).baseYear + cost[0];
    p.oneOffCosts = [...(p.oneOffCosts || []), { id: 'f1cost', date: `${y}-06-01`, year: y, owner: 'Myself', amount: cost[1], desc: 'One-off cost (test)' }];
  }
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
// `lambda` and `forward` (7v, 27 Sep): a case's own dislike of cuts in place of S126's, and `forward: false` to solve and
// return the tables without the held-path run (7v runs its own forward runs, one a switch margin); unset, as before
// `bequestWeight` (7aa, 28 Sep): the estate weight passed to solvePlan and printed on the ran line; unset, the product's default
// `switchMargin` (7ae, 28 Sep): the per-year switch margin passed to solvePlan and printed at the ran line's end; unset, the
// product's (0.001) and the ran line as before
function measureV2(h, bridgeRead, quad = 5, { finalIntegral, riskAbove, trace, seed = 7002, joint, mix, lambda = LAMBDA, forward = true, holdTier, bridgeStep, tierState, readerRef, bequestWeight, points = POINTS, switchMargin, switchCharge } = {}) {
  const f = facts(h.plan);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  // riskAbove and finalIntegral are passed only when a mode names them (the trace mode, which names finalIntegral true or
  // false in every arm); unset, the product's defaults hold (the final year exact by default since the maintainer's decision, 25 Sep 09:36 UK).
  // Every mode's ran line records the final year it ran (until 25 Sep only the trace mode's did, after bridgeRead), so a
  // re-run of an older mode (7c's f1v2, 7i's quad), now exact by default, cannot pass a ran-line gate against files that
  // ran it averaged. It sits BEFORE bridgeRead: smoke.sh's f1v2 check (locked) reads bridgeRead at the end of the line.
  const r = solvePlan(E, M, plan, { lambda, points, ...(switchMargin !== undefined ? { switchMargin } : {}), ...(switchCharge !== undefined ? { switchCharge } : {}), bridgeRead: bridgeRead || false, quadNodes: quad === 5 ? undefined : quad,
    ...(finalIntegral !== undefined ? { finalIntegral: !!finalIntegral } : {}), ...(riskAbove !== undefined ? { riskAbove } : {}), ...(joint ? { jointWorlds: true } : {}), ...(mix ? { mix } : {}), ...(holdTier ? { holdTier } : {}), ...(bridgeStep ? { bridgeStep } : {}), ...(tierState ? { tierState: true } : {}), ...(readerRef ? { readerRef } : {}), ...(bequestWeight !== undefined ? { bequestWeight } : {}) });   // F1 off is explicit, whatever the product default
  const m = r.m, s0 = M.initialState(m);
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  let ok = 0, below = 0, tierYrs = 0; const paths = E.pathsForSeed(seed, NP, m.ctx.totalYears);
  const okArr = new Uint8Array(NP);
  const tr = trace ? makeTrace(NP, m.ctx.totalYears + 1) : null;
  if (forward) paths.forEach((zs, i) => { if (tr) tr.row = i; const o = runPolicy(r, zs, tr ? { trace: tr } : {}); if (o.survived) { ok++; okArr[i] = 1; } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; });
  const sim = forward ? 100 * ok / NP : NaN;
  // what the solve actually ran with, printed so the fair-test table can be checked against the log
  // the held paths' seed and count sit after pts (added 25 Sep for 7e, which runs on held-out paths; smoke.sh's greps read around them)
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${seed} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${holdTier ? ` holdTier ${holdTier.join('/')}` : ''}${r.meta.bridgeStep ? ` bridgeStep ${r.meta.bridgeStep}` : ''}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''}${readerRef ? ` readerRef ${r.meta.readerRef}` : ''}${bequestWeight !== undefined ? ` bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)}` : ''} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead}${switchMargin !== undefined ? ` switchMargin ${r.switchMargin}` : ''}${switchCharge !== undefined ? ` switchCharge ${r.switchCharge}` : ''}`;
  return { ...f, table, sim, gap: table - sim, below: below / NP, tierYrs: tierYrs / NP, okArr, tr, secs: (Date.now() - t0) / 1000, ran, reader: r.meta.reader || null, r, paths };
}
if (mode === 'f1v2') {
  // the cases, in a fixed order; `part k/n` runs every n-th from the k-th, so a batch can split them across processes
  const cases = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]),
    ...['S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370'].map(id => [id, () => all.find(s => s.id === id)]),
    // added before any run at the maintainer's request (24 Sep 14:05 UK): bridge 4 with a 30k one-off cost in its year 2
    ['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];
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
} else if (mode === 'bridge7e') {
  /*
   * 7e: THE BRIDGE FIXES SIDE BY SIDE (PLAN.md 7e; its prediction registers the panel and the arms before it runs). Each
   * case solved with each named arm on the same held paths, paired against the first arm: off (no bridge read), v1 and
   * v2 (F1), reader (the bridge reader, src/solver/reader.js). Every arm holds the tier above allowed and the final year
   * exact EXPLICITLY (the reviewer: tier eligibility and the world count identical across arms; 'auto' could differ arm
   * to arm), three worlds, lambda held at S126's. An arm written name@q runs at q return points (S360 at 5 and 15).
   *   node research/solver/audit-s126.mjs bridge7e [points] [paths] part k/n [arms=off,v1,v2,reader] [ids=7c's cases] [seed=7002]
   * Per case: each arm's table, simulated survival, gap, tier-below and below-target years, its solve seconds, the paired
   * change against the first arm (net paths, se), and a ran line per arm for the reducer's gate.
   */
  const ARM = { off: false, v1: 1, v2: 2, reader: 'reader' };
  const arms = (process.argv[7] || 'off,v1,v2,reader').split(',').map(a => { const [name, q] = a.split('@'); return { label: a.toUpperCase(), br: ARM[name], quad: q ? Number(q) : 5, ok: name in ARM && (!q || Number(q) >= 1) }; });
  if (arms.some(a => !a.ok)) { console.error(`audit-s126: unknown arm in ${process.argv[7]} (off, v1, v2, reader, each optionally @points)`); process.exit(2); }
  const known = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]),
    ['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const defIds = [...F1_VARIANTS.map(v => v[0]), 'S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370', 'bridge 4+cost'];
  const ids = process.argv[8] ? process.argv[8].split(',') : defIds;
  const SEED = process.argv[9] ? Number(process.argv[9]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[9]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  console.log(`BRIDGE READER TEST (7e), step-6 defaults in the mixture (solvePlan), ${POINTS} points, ${NP} held paths (seed ${SEED}), lambda ${LAMBDA}, the tier above allowed and the final year exact in every arm; arms ${arms.map(a => a.label).join(', ')}, paired against ${arms[0].label}; part ${pk}/${pn}`);
  ids.forEach((id, i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const res = arms.map(a => measureV2(h, a.br, a.quad, { finalIntegral: true, riskAbove: true, seed: SEED }));
    const base = res[0];
    const cells = res.map((r, j) => {
      let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!base.okArr[k] && r.okArr[k]) up++; else if (base.okArr[k] && !r.okArr[k]) dn++; }
      const vs = j === 0 ? '' : ` d ${r.sim - base.sim >= 0 ? '+' : ''}${f1(r.sim - base.sim)} se ${f1(100 * Math.sqrt(up + dn) / NP)} (${up}/${dn})`;
      return `${arms[j].label} table ${f1(r.table).padStart(5)} sim ${f1(r.sim).padStart(5)} gap ${f1(r.gap).padStart(6)} tier-below ${f1(r.tierYrs).padStart(4)} below ${f1(r.below).padStart(4)} ${Math.round(r.secs)} s${vs}`;
    });
    console.log(`${id.padEnd(16)} a0 ${f1(base.a0, 2)} B ${base.B} class ${base.inClass ? 'YES' : 'no '} | ${cells.join(' | ')}`);
    res.forEach((r, j) => console.log(`${''.padEnd(16)} ran ${arms[j].label}: ${r.ran}`));
    res.forEach((r, j) => { if (r.reader) console.log(`${''.padEnd(16)} tables ${arms[j].label}: ${r.reader.tables} reader tables, ${r.reader.unsupported} unsupported nodes`); });
    // every pair of arms, paired on the same paths (the exact rule's secondary comparisons): later arm's gained/lost against each earlier arm
    const pairs = [];
    for (let j = 1; j < res.length; j++) for (let i = 0; i < j; i++) { let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!res[i].okArr[k] && res[j].okArr[k]) up++; else if (res[i].okArr[k] && !res[j].okArr[k]) dn++; } pairs.push(`${arms[j].label}-${arms[i].label} ${up}/${dn}`); }
    if (pairs.length) console.log(`${''.padEnd(16)} pairs ${pairs.join(' ')}`);
  });
} else if (mode === 'quad') {
  /*
   * IS THE BRIDGE MISREAD AVERAGING OR REPRESENTATION? (PLAN.md 7h; predictions/bridge-quad.md) F1 off in both arms, the
   * same solvePlan settings as the f1v2 mode, the year's return averaged over 5 points against 15 (every year, the final
   * year included: the exact final year was off in both, as the product had it when 7i ran; it is the default since 25 Sep
   * 09:36 UK, so a re-run now runs it exact and read-bridgequad.mjs refuses those arms), paired on the same paths. If 15 points close the table's misread, it
   * is averaging; if not, the grid read across the share axis (a representation problem).
   */
  // built exactly as the f1v2 mode builds them (F1_VARIANTS and the library), so each case is the one 7c read
  const cases = [['S126', () => variant('S126', {})], ['bridge 4', () => variant('bridge 4', { bridge: 4 })], ['bridge 6', () => variant('bridge 6', { bridge: 6 })],
    ['share 0.95', () => variant('share 0.95', { a0: 0.95 })], ['S366', () => all.find(s => s.id === 'S366')], ['S360', () => all.find(s => s.id === 'S360')]];
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  console.log(`BRIDGE QUAD TEST, step-6 defaults in the mixture (solvePlan), ${POINTS} points, ${NP} held paths (seed 7002), lambda ${LAMBDA}, F1 off, 5 against 15 return points, paired; part ${pk}/${pn}`);
  cases.forEach(([id, mk], i) => {
    if (i % pn !== pk) return;
    const h = mk();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const a = measureV2(h, false, 5), b = measureV2(h, false, 15);
    let disc = 0, net = 0; for (let j = 0; j < NP; j++) if (a.okArr[j] !== b.okArr[j]) { disc++; net += b.okArr[j] ? 1 : -1; }
    const d = b.sim - a.sim, se = 100 * Math.sqrt(disc) / NP;
    // the whole path counts too: the tie rule (exactly two se) is judged on them, not on the rounded figures (the thirtieth review)
    console.log(`${id.padEnd(16)} | Q5 table ${f1(a.table).padStart(5)} sim ${f1(a.sim).padStart(5)} gap ${f1(a.gap).padStart(6)} | Q15 table ${f1(b.table).padStart(5)} sim ${f1(b.sim).padStart(5)} gap ${f1(b.gap).padStart(6)} | survival ${d >= 0 ? '+' : ''}${d.toFixed(2)} +/- ${se.toFixed(2)} (net ${net} of ${disc} discordant) | ${Math.round(a.secs)} / ${Math.round(b.secs)} s`);
    console.log(`${''.padEnd(16)} ran Q5:  ${a.ran}`);
    console.log(`${''.padEnd(16)} ran Q15: ${b.ran}`);
  });
} else if (mode === 'trace') {
  /*
   * O22'S TRACE (PLAN.md O22; predictions/o22-trace.md): one case (S360 unless named), F1 off, the tier above allowed
   * (riskAbove true, as 7i ran it before the 'auto' default), four solves on the same paths - 5 or 15 return points, each
   * with the final year averaged or exact - each run forward with the per-year trace kept. The 5- and 15-point arms with
   * the final year averaged are 7i's own and must reproduce it. Written to results/o22-trace/<case>-<arm>.json.gz for
   * reduce-o22.mjs, with each arm's "ran" line.
   *   node research/solver/audit-s126.mjs trace [points=16] [paths=1000] [case=S360]
   */
  const id = process.argv[5] || 'S360';
  const h = all.find(s => s.id === id);
  if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
  const OUT = join(dirname(fileURLToPath(import.meta.url)), 'results', 'o22-trace');
  mkdirSync(OUT, { recursive: true });
  console.log(`O22 TRACE, ${id}, step-6 defaults in the mixture (solvePlan), ${POINTS} points, ${NP} held paths (seed 7002), lambda ${LAMBDA}, F1 off, riskAbove true`);
  for (const [arm, quad, fi] of [['q5', 5, false], ['q15', 15, false], ['q5x', 5, true], ['q15x', 15, true]]) {
    const a = measureV2(h, false, quad, { finalIntegral: fi, riskAbove: true, trace: true });
    const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
    const T = a.tr;
    writeFileSync(join(OUT, `${id}-${arm}.json.gz`), gzipSync(JSON.stringify({ id, arm, quad, finalIntegral: fi, N: NP, Y: T.Y, table: a.table, sim: a.sim, ran: a.ran,
      survived: b64(a.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), penShare: b64(T.penShare), failYear: b64(T.failYear) })));
    console.log(`${arm.padEnd(5)} table ${f1(a.table).padStart(5)} sim ${f1(a.sim).padStart(5)} | ${Math.round(a.secs)} s`);
    console.log(`      ran ${arm}: ${a.ran}`);
  }
} else if (mode === 'diag7r') {
  /*
   * 7r: WHY THE READER HARMS S126 AND BRIDGE 4 (PLAN.md 7r; predictions/diag-7r.md). 7e's arms and settings (the tier above
   * allowed and the final year exact in every arm, three worlds, lambda held at S126's), each case solved with its named
   * arms on the same paths, the per-year trace kept for every arm. The panel is fixed here, as the prediction registers
   * it: the two harmed cases, two contrasts the reader lifted as far with no loss, and S366 under v1 (O23).
   * THE SWAP ARMS (the sixty-sixth review's BLOCKING 1, 26 Sep): on S126 and bridge 4, two more arms run forward on the
   * same paths from the two tables already solved, no new solve. In each year before pension access both choosers pick a
   * move from the arm's own state and tiers held; RTIER takes the reader's tiers with off's order, harvest and spending
   * level, RREST off's tiers with the reader's order, harvest and level (the move list holds every tier pair under each
   * such base: solve.js buildActions, tierBase). From access on, both pick off's move, which the reader's move equals there
   * (the reader reads only tables of years before access); the run compares the two in the last bridge year and the first
   * year of access and counts any difference there, which the derivation says is none; after that it takes off's move
   * without asking the reader (research/tests/solver-choose-hook.test.mjs compares every later year on S126). Whichever arm reproduces the reader's harm carries it.
   *   node research/solver/audit-s126.mjs diag7r [points] [paths] part k/n [seed=7002]
   * Prints 7e's line format per case (so reduce-7r.mjs reuses 7e's parser and gate) and writes each arm's trace to
   * results/diag7r/<case>-<arm>.json.gz, stamped as the log is (reduce-7r.mjs checks the two agree), or to DIAG7R_OUT when
   * set: smoke.sh's run sets it, so a smoke run never overwrites 7r's own traces.
   */
  const ARM = { off: false, v1: 1, v2: 2, reader: 'reader' };
  const PANEL = [['S126', 'off,reader,rtier,rrest'], ['bridge 4', 'off,reader,rtier,rrest'], ['S120', 'off,reader'], ['wealth x2', 'off,reader'], ['S366', 'off,v1']];
  // a swap arm: off's solve run forward with swap.mjs's chooser (the tiers from one table's move, the rest from the other's)
  const swapArm = (off, rd, which) => {
    const t0 = Date.now(), rO = off.r, T = rO.m.ctx.totalYears;
    const { choose, n, accessAt } = swapChooser(rO, rd.r, which);
    let ok = 0, below = 0, tierYrs = 0;
    const okArr = new Uint8Array(NP), tr = makeTrace(NP, T + 1);
    off.paths.forEach((zs, i) => { tr.row = i; const o = runPolicy(rO, zs, { trace: tr, choose }); if (o.survived) { ok++; okArr[i] = 1; } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; });
    const sim = 100 * ok / NP;
    return { a0: off.a0, B: off.B, inClass: off.inClass, table: NaN, sim, gap: NaN, below: below / NP, tierYrs: tierYrs / NP, okArr, tr, secs: (Date.now() - t0) / 1000,
      ran: off.ran.replace(/ bridgeRead false$/, ` bridgeRead swap-${which === 'rtier' ? 'tier' : 'rest'}`), swap: `moves swapped ${n.swapped}, differing in the last bridge year or at access ${n.late}, access at year ${accessAt}` };
  };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[7]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7R_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7r');
  mkdirSync(OUT, { recursive: true });
  console.log(`7R DIAGNOSIS, step-6 defaults in the mixture (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), lambda ${LAMBDA}, the tier above allowed and the final year exact in every arm; traces kept; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  PANEL.forEach(([id, armList], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const names = armList.split(','), labels = names.map(a => a.toUpperCase());
    const res = [];
    names.forEach(a => res.push(a === 'rtier' || a === 'rrest' ? swapArm(res[names.indexOf('off')], res[names.indexOf('reader')], a)
      : measureV2(h, ARM[a], 5, { finalIntegral: true, riskAbove: true, trace: true, seed: SEED })));
    const base = res[0];
    const cells = res.map((r, j) => {
      let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!base.okArr[k] && r.okArr[k]) up++; else if (base.okArr[k] && !r.okArr[k]) dn++; }
      const vs = j === 0 ? '' : ` d ${r.sim - base.sim >= 0 ? '+' : ''}${f1(r.sim - base.sim)} se ${f1(100 * Math.sqrt(up + dn) / NP)} (${up}/${dn})`;
      return `${labels[j]} table ${f1(r.table).padStart(5)} sim ${f1(r.sim).padStart(5)} gap ${f1(r.gap).padStart(6)} tier-below ${f1(r.tierYrs).padStart(4)} below ${f1(r.below).padStart(4)} ${Math.round(r.secs)} s${vs}`;
    });
    console.log(`${id.padEnd(16)} a0 ${f1(base.a0, 2)} B ${base.B} class ${base.inClass ? 'YES' : 'no '} | ${cells.join(' | ')}`);
    res.forEach((r, j) => console.log(`${''.padEnd(16)} ran ${labels[j]}: ${r.ran}`));
    res.forEach((r, j) => { if (r.swap) console.log(`${''.padEnd(16)} swap ${labels[j]}: ${r.swap}`); });
    res.forEach((r, j) => {
      const T = r.tr;
      writeFileSync(join(OUT, `${id.replace(/ /g, '_')}-${names[j]}.json.gz`), gzipSync(JSON.stringify({ id, arm: labels[j], stamp: STAMP, N: NP, Y: T.Y, seed: SEED, table: r.table, sim: r.sim, ran: r.ran,
        survived: b64(r.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    });
  });
} else if (mode === 'diag7t') {
  /*
   * 7T: DO THE MIXTURE'S TABLES OVERRATE THE RISKIER TIER BECAUSE EACH WORLD PLANS AS IF IT KNEW ITS WORLD? (PLAN.md 7t;
   * predictions/diag-7t.md). Each case solved four ways - off and the reader, each with the mixture as the product solves
   * it and with `jointWorlds` (solve.js: one policy for every world, chosen by the forward chooser's own weighted rule) -
   * at 7e's settings (the tier above allowed, the final year exact, three worlds, lambda held at S126's). Every arm is run
   * forward three ways on the same seed's paths:
   *   - as solved, on NP paths, the per-year trace kept;
   *   - with the switch margin at 0 (the same tables; the chooser changes tier for any gain), on the same NP paths, traced;
   *   - in each world, on the first WP paths with each path's persistent shift replaced by that world's node (-sqrt 3, 0,
   *     +sqrt 3): the world's own table's opening survival and expected capped estate beside what the policy realises there.
   *   node research/solver/audit-s126.mjs diag7t [points] [paths] part k/n [seed=7002] [world paths=1000]
   * Prints 7e's case line for the four arms, a "margin0" line for the same arms at margin 0, a ran line and a "joint" line
   * per arm, one pairs line over all the runs, a "prefix" line (the arms' survival and the reader against off on the
   * first 3,000 paths, which are 7r's: pathsForSeed builds path i from the seed and i alone), and a "world" line per arm and world; writes each run's trace
   * to results/diag7t/<case>-<run>.json.gz (DIAG7T_OUT when set), stamped as the log is.
   * THE OTHER CAUSES (the first deep review, 26 Sep 17:12 UK; the maintainer, 17:15 UK: "Test all"), on the same paths:
   *   - LEARNING (+L): off's and the reader's own tables, run forward with learn.mjs's chooser, whose world weights are the
   *     posterior given the returns the path has realised (the product's weights never move): a "learn" line, every case;
   *   - FIVE WORLDS (OFF5, READER5; S126 and bridge 4): off and the reader solved with the five-world mixture (nodes to
   *     +/-2.86) and run as solved: a "five" line in the case line's format, with their ran and joint lines;
   *   - FIVE WORLDS LEARNING (OFF5+L, READER5+L): the five-world tables with the learning chooser: a "five-learn" line.
   *   - THE ORACLE (+O; the seventy-eighth review, BLOCKING 1: the bound on learning): off's and the reader's own tables with
   *     the weights set from the path's TRUE shift from year 0 (learn.mjs oracleChooser): an "oracle" line, every case.
   *   Each learning and oracle line gives every arm's mean end weights. Every run is traced and on the pairs line.
   */
  const PANEL = [['S126', 'off,reader'], ['bridge 4', 'off,reader'], ['S360', 'off,reader'], ['share 0.95', 'off,reader'], ['S194', 'off']];
  const FIVE = new Set(['S126', 'bridge 4']);   // the five-world arms: the harmed cases only
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WP = process.argv[8] ? Number(process.argv[8]) : 1000;
  if (!(SEED >= 1) || !(WP >= 1)) { console.error(`audit-s126: bad seed or world paths ${process.argv[7]} ${process.argv[8]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7T_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7t');
  mkdirSync(OUT, { recursive: true });
  const NODES = [-Math.sqrt(3), 0, Math.sqrt(3)];
  console.log(`7T DIAGNOSIS, step-6 defaults in the mixture (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), ${WP} a world, lambda ${LAMBDA}, the tier above allowed and the final year exact in every arm; traces kept; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  // one forward run of a solve on the given paths: survival, below-target and tier years, and optionally the trace
  // `learn`: each path run with learn.mjs's chooser - 'oracle' for the oracle's, any other true value for the learner's; the
  // mean end weights are returned
  const forward = (r, paths, trace, learn = false) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null;
    let ok = 0, below = 0, tierYrs = 0, estate = 0;
    const cap = r.meta.bequestCap, wEnd = learn ? r.mix.nodes.map(() => 0) : null;
    paths.forEach((zs, i) => {
      if (tr) tr.row = i;
      const L = learn ? (learn === 'oracle' ? oracleChooser(r, zs) : learningChooser(r, zs)) : null;
      const o = runPolicy(r, zs, { ...(tr ? { trace: tr } : {}), ...(L ? { choose: L.choose } : {}) });
      if (L) L.n.last.forEach((w, k) => { wEnd[k] += w / N; });
      if (o.survived) { ok++; okArr[i] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0;
    });
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, estate: estate / N, okArr, tr, wEnd, secs: (Date.now() - t0) / 1000 };
  };
  PANEL.forEach(([id, armList], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    // the product's arms first (off, then the reader), then the same with one policy for every world
    const arms = [false, true].flatMap(j => armList.split(',').map(a => ({ name: a, joint: j })));
    const runs = [], lines = [];
    for (const a of arms) {
      const label = `${a.name.toUpperCase()}${a.joint ? '+J' : ''}`;
      const res = measureV2(h, ARM[a.name], 5, { finalIntegral: true, riskAbove: true, trace: true, seed: SEED, joint: a.joint });
      if (!!res.r.meta.jointWorlds !== a.joint) { console.error(`audit-s126: ${label} ran jointWorlds ${res.r.meta.jointWorlds}`); process.exit(2); }
      runs.push({ label, file: `${a.name}${a.joint ? '_j' : ''}`, res, sim: res.sim, okArr: res.okArr, tr: res.tr });
      const sm = res.r.switchMargin; res.r.switchMargin = 0;
      const m0 = forward(res.r, res.paths, true);
      res.r.switchMargin = sm;
      runs.push({ label: `${label}/M0`, file: `${a.name}${a.joint ? '_j' : ''}_m0`, res: null, sim: m0.sim, okArr: m0.okArr, tr: m0.tr, m0 });
      const s0 = M.initialState(res.r.m);
      NODES.forEach((z, k) => {
        const wpaths = res.paths.slice(0, WP).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
        const f = forward(res.r, wpaths, false), v = res.r.worlds[k].value(s0, 0);
        lines.push(`${''.padEnd(16)} world ${label} ${k} z ${z.toFixed(4)}: table ${(100 * v.survival).toFixed(2)} sim ${f.sim.toFixed(2)} estate table ${Math.round(v.bequest)} sim ${Math.round(f.estate)} tier-below ${f1(f.tierYrs)} paths ${WP}`);
      });
    }
    // the other causes: learning on the product's tables (every case); five worlds, and learning on them (the harmed cases)
    const learnRun = (src, label, file, kind = true) => { const f = forward(src.res.r, src.res.paths, true, kind); return { label, file, res: null, sim: f.sim, okArr: f.okArr, tr: f.tr, lf: f }; };
    const learnRuns = runs.filter(x => x.res && !x.label.endsWith('+J')).map(x => learnRun(x, `${x.label}+L`, `${x.file}_l`));
    const oracleRuns = runs.filter(x => x.res && !x.label.endsWith('+J')).map(x => learnRun(x, `${x.label}+O`, `${x.file}_o`, 'oracle'));
    const fiveRuns = [], fiveLearn = [];
    if (FIVE.has(id)) for (const name of armList.split(',')) {
      const label = `${name.toUpperCase()}5`;
      const res = measureV2(h, ARM[name], 5, { finalIntegral: true, riskAbove: true, trace: true, seed: SEED, mix: 5 });
      if (res.r.meta.mixture !== 5 || res.r.meta.jointWorlds) { console.error(`audit-s126: ${label} ran mix ${res.r.meta.mixture} jointWorlds ${res.r.meta.jointWorlds}`); process.exit(2); }
      const run = { label, file: `${name}5`, res, sim: res.sim, okArr: res.okArr, tr: res.tr };
      fiveRuns.push(run);
      fiveLearn.push(learnRun(run, `${label}+L`, `${name}5_l`));
    }
    runs.push(...learnRuns, ...oracleRuns, ...fiveRuns, ...fiveLearn);
    const main = runs.filter(x => x.res && !fiveRuns.includes(x)), mzero = runs.filter(x => x.m0), base = main[0];
    const cell = (x, j) => {
      let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!base.okArr[k] && x.okArr[k]) up++; else if (base.okArr[k] && !x.okArr[k]) dn++; }
      const r = x.res;
      return `${x.label} table ${f1(r.table).padStart(5)} sim ${f1(r.sim).padStart(5)} gap ${f1(r.gap).padStart(6)} tier-below ${f1(r.tierYrs).padStart(4)} below ${f1(r.below).padStart(4)} ${Math.round(r.secs)} s${j === 0 ? '' : ` d ${r.sim - base.sim >= 0 ? '+' : ''}${f1(r.sim - base.sim)} se ${f1(100 * Math.sqrt(up + dn) / NP)} (${up}/${dn})`}`;
    };
    console.log(`${id.padEnd(16)} a0 ${f1(base.res.a0, 2)} B ${base.res.B} class ${base.res.inClass ? 'YES' : 'no '} | ${main.map(cell).join(' | ')}`);
    console.log(`${''.padEnd(16)} margin0 | ${mzero.map(x => `${x.label} sim ${f1(x.m0.sim).padStart(5)} tier-below ${f1(x.m0.tierYrs).padStart(4)} below ${f1(x.m0.below).padStart(4)} ${Math.round(x.m0.secs)} s`).join(' | ')}`);
    const learnCell = x => `${x.label} sim ${f1(x.lf.sim).padStart(5)} tier-below ${f1(x.lf.tierYrs).padStart(4)} below ${f1(x.lf.below).padStart(4)} w-end ${x.lf.wEnd.map(w => w.toFixed(4)).join(',')} ${Math.round(x.lf.secs)} s`;
    console.log(`${''.padEnd(16)} learn | ${learnRuns.map(learnCell).join(' | ')}`);
    console.log(`${''.padEnd(16)} oracle | ${oracleRuns.map(learnCell).join(' | ')}`);
    if (fiveRuns.length) {
      console.log(`${''.padEnd(16)} five | ${fiveRuns.map(x => cell(x, 1)).join(' | ')}`);
      console.log(`${''.padEnd(16)} five-learn | ${fiveLearn.map(learnCell).join(' | ')}`);
    }
    [...main, ...fiveRuns].forEach(x => console.log(`${''.padEnd(16)} ran ${x.label}: ${x.res.ran}`));
    [...main, ...fiveRuns].forEach(x => console.log(`${''.padEnd(16)} joint ${x.label}: ${!!x.res.r.meta.jointWorlds} switchMargin ${x.res.r.switchMargin} scale ${Math.round(Math.max(1, x.res.r.m.ctx.accounts.reduce((t, a) => t + a.balance, 0)))} cap ${Math.round(x.res.r.meta.bequestCap)} deathTax ${x.res.r.m.ctx.pensionDeathTaxRate}`));
    const pairs = [];
    for (let j = 1; j < runs.length; j++) for (let q = 0; q < j; q++) { let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!runs[q].okArr[k] && runs[j].okArr[k]) up++; else if (runs[q].okArr[k] && !runs[j].okArr[k]) dn++; } pairs.push(`${runs[j].label}-${runs[q].label} ${up}/${dn}`); }
    console.log(`${''.padEnd(16)} pairs ${pairs.join(' ')}`);
    { const P0 = Math.min(3000, NP), sv = x => { let k = 0; for (let i = 0; i < P0; i++) k += x.okArr[i]; return (100 * k / P0).toFixed(2); };
      const o = main.find(x => x.label === 'OFF'), rd = main.find(x => x.label === 'READER');
      let up = 0, dn = 0; if (o && rd) for (let i = 0; i < P0; i++) { if (!o.okArr[i] && rd.okArr[i]) up++; else if (o.okArr[i] && !rd.okArr[i]) dn++; }
      console.log(`${''.padEnd(16)} prefix ${P0} | ${main.map(x => `${x.label} sim ${sv(x)}`).join(' | ')}${o && rd ? ` | READER-OFF ${up}/${dn}` : ''}`); }
    lines.forEach(l => console.log(l));
    runs.forEach(x => {
      const T = x.tr;
      writeFileSync(join(OUT, `${id.replace(/ /g, '_')}-${x.file}.json.gz`), gzipSync(JSON.stringify({ id, arm: x.label, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: x.sim,
        survived: b64(x.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    });
  });
} else if (mode === 'diag7v') {
  /*
   * 7V: IS THE READER'S HARM THE SWITCH MARGIN HOLDING A NEAR-TIE? THE MARGIN'S DOSE-RESPONSE (PLAN.md 7v; the second deep
   * review, 27 Sep 02:07 UK, O30; the maintainer, 27 Sep: "Run 7v first"; predictions/diag-7v.md). At the product's settings -
   * solvePlan with 30 points, risk above by the product's 'auto' rule, lambda held at 7t's (S126's landed 0.0224; the third
   * deep review, 27 Sep 07:42 UK: 7t to 7v then differs in the grid alone, on the same paths) - each case's arms are solved once, off and the reader (a non-bridge case, off alone), each
   * with the mixture as the product solves it and with `jointWorlds` (+J), and every solve is run forward on the same NP paths
   * at four switch margins: 0.001 (the product's; label /1e-3), 3e-4, 1e-4 and 0 (the margin is read only by the forward
   * chooser: the tables do not depend on it). One policy at margin 0 is also run with learn.mjs's learning chooser (+L; the
   * reader's on a bridge case, off's elsewhere). On the harmed cases and S194 each solve is also run in each of the three
   * worlds on the first WP paths, at margins 0.001 and 0. Every solve's YEAR-0 GAP is logged (the third deep review): the
   * score the chooser's best opening move gains over keeping the plan's tier, read by the chooser itself as the smallest
   * switch margin at which it keeps the plan's tier (0 when it keeps it at margin 0), and the pension tier it opens in at
   * each margin.
   * The family pairs are run at their odd results' own setups (the ninety-first review, MINOR 5): S172 planned at Medium Risk
   * with the tier above off and on (O16, M14b's settings: S172's landed lambda 0.6503449126242364, held); S330 planned at
   * Medium Risk with the tier above on, in three and in five worlds (O21, 7h's: S330's landed 0.9457416090031758, held).
   *   node research/solver/audit-s126.mjs diag7v [points=30] [paths] part k/n [seed=7002] [world paths=1000]
   * Prints, per case: a case line; a solve line per arm (the table's opening read, seconds); a ran and a joint line per arm
   * (the joint line also names the plan tier, lambda and what the risk-above rule decided); a gap line per arm; a run line per forward run
   * (survival, years below target, pension years below the plan's tier, the mean capped estate, seconds); a world line per
   * world run. Every run's trace goes to results/diag7v/<case>-<run>.json.gz (DIAG7V_OUT when set), stamped as the log is;
   * the reducer (reduce-7v.mjs) reads every pair from the traces.
   */
  const MARG = [['1e-3', 0.001], ['3e-4', 3e-4], ['1e-4', 1e-4], ['0', 0]];
  const REF_LAMBDA = LAMBDA;
  const PANEL7V = [
    ['S126', { arms: 'off,reader', worlds: true }], ['bridge 4', { arms: 'off,reader', worlds: true }],
    ['S360', { arms: 'off,reader' }], ['share 0.95', { arms: 'off,reader' }], ['S194', { arms: 'off', worlds: true }],
    ['S172 down', { id: 'S172', arms: 'off', tier: 'Medium Risk', riskAbove: false, lambda: 0.6503449126242364 }],
    ['S172 up', { id: 'S172', arms: 'off', tier: 'Medium Risk', riskAbove: true, lambda: 0.6503449126242364 }],
    ['S330 mix3', { id: 'S330', arms: 'off', tier: 'Medium Risk', riskAbove: true, lambda: 0.9457416090031758, mix: 3 }],
    ['S330 mix5', { id: 'S330', arms: 'off', tier: 'Medium Risk', riskAbove: true, lambda: 0.9457416090031758, mix: 5 }]];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  // the plan held at a tier (M14's PLANTIER, experiment.mjs flex): the pension and the ISA at that tier
  const atTier = (h, tier) => (!tier ? h : { ...h, plan: { ...h.plan, accounts: h.plan.accounts.map(a => (/^Pensions|^S&S ISA/.test(a.category) ? { ...a, risk: tier } : a)) } });
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WP = process.argv[8] ? Number(process.argv[8]) : 1000;
  if (!(SEED >= 1) || !(WP >= 1)) { console.error(`audit-s126: bad seed or world paths ${process.argv[7]} ${process.argv[8]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7V_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7v');
  mkdirSync(OUT, { recursive: true });
  console.log(`7V DIAGNOSIS, the product's settings (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), ${WP} a world, margins ${MARG.map(m => m[0]).join(',')}; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  // one forward run of a solve at switch margin `sm` on the given paths; `learn` runs learn.mjs's learning chooser
  const forward = (r, paths, sm, trace, learn = false) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null;
    let ok = 0, below = 0, tierYrs = 0, estate = 0;
    const cap = r.meta.bequestCap, keep = r.switchMargin;
    r.switchMargin = sm;
    try {
      paths.forEach((zs, i) => {
        if (tr) tr.row = i;
        const L = learn ? learningChooser(r, zs) : null;
        const o = runPolicy(r, zs, { ...(tr ? { trace: tr } : {}), ...(L ? { choose: L.choose } : {}) });
        if (o.survived) { ok++; okArr[i] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0;
      });
    } finally { r.switchMargin = keep; }
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, estate: estate / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  // the year-0 gap: runPolicy's own opening state and held tier (captured through its choose hook on one path), then the
  // chooser asked at that state for the smallest margin at which it keeps the plan's tier (bisection, 40 steps on [0, 1])
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const keep = r.switchMargin, acts = r.c.acts;
    const at = sm => { r.switchMargin = sm; try { return acts[chooseAction(r, s0, 0, h0)]; } finally { r.switchMargin = keep; } };
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: MARG.map(([, sm]) => at(sm).tierPen).join(',') };
  };
  const fileOf = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  PANEL7V.forEach(([id, o], i) => {
    if (i % pn !== pk) return;
    const base = byId(o.id || id)();
    if (!base) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const h = atTier(base, o.tier), lambda = o.lambda || REF_LAMBDA;
    const names = o.arms.split(','), bridge = names.includes('reader');
    const arms = [false, true].flatMap(j => names.map(a => ({ name: a, joint: j, label: `${a.toUpperCase()}${j ? '+J' : ''}` })));
    console.log(`${id.padEnd(16)} case | arms ${arms.map(a => a.label).join(',')} | margins ${MARG.map(m => m[0]).join(',')} | lambda ${lambda} tier ${o.tier || 'own'} riskAbove ${o.riskAbove === undefined ? 'auto' : o.riskAbove} mix ${o.mix || 3}`);
    const runs = [];
    for (const a of arms) {
      const res = measureV2(h, ARM[a.name], 5, { trace: false, seed: SEED, joint: a.joint, lambda, forward: false, ...(o.riskAbove !== undefined ? { riskAbove: o.riskAbove } : {}), ...(o.mix ? { mix: o.mix } : {}) });
      const r = res.r;
      if (!!r.meta.jointWorlds !== a.joint) { console.error(`audit-s126: ${a.label} ran jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
      const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : `set_${o.riskAbove}`;
      console.log(`${''.padEnd(16)} solve ${a.label}: table ${f1(res.table, 2)} secs ${Math.round(res.secs)}`);
      console.log(`${''.padEnd(16)} ran ${a.label}: ${res.ran}`);
      { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${a.label}: ${g.gap} opening ${g.open}`); }
      console.log(`${''.padEnd(16)} joint ${a.label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier ${(o.tier || 'own').replace(/ /g, '_')} riskAbove ${ra}`);
      for (const [tag, sm] of MARG) {
        const f = forward(r, res.paths, sm, true);
        runs.push({ label: `${a.label}/${tag}`, f });
        console.log(`${''.padEnd(16)} run ${a.label}/${tag}: sim ${f.sim.toFixed(3)} below ${f1(f.below, 2)} tier-below ${f1(f.tierYrs, 2)} estate ${Math.round(f.estate)} secs ${Math.round(f.secs)}`);
        if (o.worlds && (sm === 0.001 || sm === 0)) {
          const s0 = M.initialState(r.m), nodes = r.mix.nodes;
          nodes.forEach((z, k) => {
            const wpaths = res.paths.slice(0, WP).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
            const w = forward(r, wpaths, sm, false), v = r.worlds[k].value(s0, 0);
            console.log(`${''.padEnd(16)} world ${a.label}/${tag} ${k} z ${z.toFixed(4)}: table ${(100 * v.survival).toFixed(2)} sim ${w.sim.toFixed(2)} estate table ${Math.round(v.bequest)} sim ${Math.round(w.estate)} tier-below ${f1(w.tierYrs, 2)} paths ${WP}`);
          });
        }
      }
      // one policy at margin 0 with the learning chooser: the reader's on a bridge case, off's elsewhere
      if (a.joint && a.name === (bridge ? 'reader' : 'off')) {
        const f = forward(r, res.paths, 0, true, true);
        runs.push({ label: `${a.label}/0+L`, f });
        console.log(`${''.padEnd(16)} run ${a.label}/0+L: sim ${f.sim.toFixed(3)} below ${f1(f.below, 2)} tier-below ${f1(f.tierYrs, 2)} estate ${Math.round(f.estate)} secs ${Math.round(f.secs)}`);
      }
    }
    runs.forEach(x => {
      const T = x.f.tr;
      writeFileSync(join(OUT, fileOf(id, x.label)), gzipSync(JSON.stringify({ id, arm: x.label, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: x.f.sim,
        survived: b64(x.f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    });
    console.log(`${''.padEnd(16)} done ${runs.length} runs`);
  });
} else if (mode === 'diag7w') {
  /*
   * 7W: IS T THE FIVE-POINT RETURN AVERAGE HIDING THE BRIDGE'S LAST YEAR? (Q; PLAN.md 7w; the sixth deep review, 27 Sep
   * 18:19 UK; the maintainer's option A, 27 Sep; predictions/diag-7w.md). Each unit is one solve at the product's settings
   * (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's and 7v's), with the year's return averaged over QUAD points
   * (5, the product's, or 15), run forward on the same NP paths at switch margin 0.001 (the product's; /1e-3), at 0 (/0), and
   * at 0.001 with the year-0 move forced to the chooser's best at margin 0 (/1e-3+open: the opening freed, every later year
   * as the product holds it). Every solve's YEAR-0 GAP is logged as in 7v (the smallest margin at which the chooser keeps the
   * plan's tier at runPolicy's own opening state; 0 when it keeps it at margin 0) with the pension tier it opens in at 0.001
   * and at 0.
   *   node research/solver/audit-s126.mjs diag7w [points=30] [paths] part k/n [seed=7002]
   * Prints, per unit: a case line; solve, ran, gap and joint lines; a run line per forward run (as 7v's). Every run's trace
   * goes to results/diag7w/<case>-<run>.json.gz (DIAG7W_OUT when set), stamped as the log is; reduce-7w.mjs reads them.
   */
  const UNITS7W = [
    ['share 0.95', 'reader', false, 15], ['share 0.95', 'reader', true, 15], ['share 0.95', 'off', false, 15], ['S126', 'reader', false, 15],
    ['share 0.95', 'reader', false, 5], ['share 0.95', 'reader', true, 5], ['share 0.95', 'off', false, 5], ['S126', 'reader', false, 5],
    ['S194', 'off', false, 5]];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[7]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7W_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7w');
  mkdirSync(OUT, { recursive: true });
  console.log(`7W DIAGNOSIS, the product's settings (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), return points 5 and 15, margins 1e-3, 0 and 1e-3 with the opening freed; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  // the chooser at switch margin `sm` for one call, the solve's own margin restored after
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  // one forward run at margin `sm`; `open` frees the year-0 move (the chooser at margin 0 in year 0, `sm` after)
  const forward = (r, paths, sm, open = false) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1);
    let ok = 0, below = 0, tierYrs = 0, estate = 0;
    const cap = r.meta.bequestCap, keep = r.switchMargin;
    r.switchMargin = sm;
    try {
      paths.forEach((zs, i) => {
        tr.row = i;
        const o = runPolicy(r, zs, { trace: tr, ...(open ? { choose: (t, st, held) => (t === 0 ? chooseAt(r, st, 0, held, 0) : chooseAction(r, st, t, held)) } : {}) });
        if (o.survived) { ok++; okArr[i] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0;
      });
    } finally { r.switchMargin = keep; }
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, estate: estate / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  const fileOf = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7W.forEach(([id, arm, joint, quad], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const label = `${arm.toUpperCase()}${joint ? '+J' : ''}@${quad}`;
    console.log(`${id.padEnd(16)} case | unit ${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    const res = measureV2(h, ARM[arm], quad, { trace: false, seed: SEED, joint, lambda: LAMBDA, forward: false });
    const r = res.r;
    if (!!r.meta.jointWorlds !== joint) { console.error(`audit-s126: ${label} ran jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${label}: table ${f1(res.table, 2)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${label}: ${res.ran}`);
    { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${label}: ${g.gap} opening ${g.open}`); }
    console.log(`${''.padEnd(16)} joint ${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
    const runs = [];
    for (const [tag, sm, open] of [['1e-3', 0.001, false], ['0', 0, false], ['1e-3+open', 0.001, true]]) {
      const f = forward(r, res.paths, sm, open);
      runs.push({ label: `${label}/${tag}`, f });
      console.log(`${''.padEnd(16)} run ${label}/${tag}: sim ${f.sim.toFixed(4)} below ${f1(f.below, 2)} tier-below ${f1(f.tierYrs, 2)} estate ${Math.round(f.estate)} secs ${Math.round(f.secs)}`);
    }
    runs.forEach(x => {
      const T = x.f.tr;
      writeFileSync(join(OUT, fileOf(id, x.label)), gzipSync(JSON.stringify({ id, arm: x.label, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: x.f.sim,
        survived: b64(x.f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    });
    console.log(`${''.padEnd(16)} done ${runs.length} runs`);
  });
} else if (mode === 'diag7x') {
  /*
   * 7X: IS THE DE-RISK'S UNDERVALUING FREE SWITCHING (FS) OR THE THREE WORLDS (W)? (PLAN.md 7x; the deep review after 7w,
   * deep-review-log.md 27 Sep 20:17 UK; the maintainer's option A, 27 Sep; predictions/diag-7x.md). Each unit is one solve at
   * the product's settings (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's, 7v's and 7w's, 5 return points)
   * with ONE TIER PAIR HELD FOR THE WHOLE PLAN (solve.js holdTier): the plan's (0/0) or the freed opening's (2/2: pension
   * and ISA two tiers down), in three worlds or five. Each is run forward on the same NP paths (margin irrelevant: one
   * tier), and in each world on the first WP paths with every path's long-run shift set to that world's node.
   *   node research/solver/audit-s126.mjs diag7x [points=30] [paths] part k/n [seed=7002] [world paths=1000]
   * Prints, per unit: a case line; solve (the mixture's year-0 table survival), ran, joint and hold lines; a world line per
   * world (its table survival at the opening state against its own world run); a run line (the aggregate run); a done
   * line. Every aggregate run's trace goes to results/diag7x/<case>-<unit>.json.gz (DIAG7X_OUT when set), stamped.
   */
  const CASES7X = [['S126', 'reader'], ['S194', 'off'], ['share 0.95', 'reader'], ['bridge 4', 'reader'], ['S360', 'off']];
  const UNITS7X = [];
  for (const mix of [3, 5]) for (const hold of [[0, 0], [2, 2]]) for (const [id, arm] of CASES7X) UNITS7X.push([id, arm, hold, mix]);
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WP = process.argv[8] ? Number(process.argv[8]) : 1000;
  if (!(SEED >= 1) || !(WP >= 1)) { console.error(`audit-s126: bad seed or world paths ${process.argv[7]} ${process.argv[8]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7X_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7x');
  mkdirSync(OUT, { recursive: true });
  console.log(`7X DIAGNOSIS, the product's settings (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), ${WP} a world, one tier held for life (0/0 or 2/2), three or five worlds; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const run = (r, paths, trace) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null;
    let ok = 0, tierYrs = 0, changes = 0;
    paths.forEach((zs, i) => { if (tr) tr.row = i; const o = runPolicy(r, zs, tr ? { trace: tr } : {}); if (o.survived) { ok++; okArr[i] = 1; } tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
    return { sim: 100 * ok / N, tierYrs: tierYrs / N, changes: changes / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7X.forEach(([id, arm, hold, mix], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const label = `${arm.toUpperCase()}/H${hold.join('')}/M${mix}`;
    console.log(`${id.padEnd(16)} case | unit ${label} | lambda ${LAMBDA} tier own riskAbove auto`);
    const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, holdTier: hold, mix });
    const r = res.r, s0 = M.initialState(r.m);
    if (r.meta.holdTier !== hold.join('/')) { console.error(`audit-s126: ${label} held ${r.meta.holdTier}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${label}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${label}: ${res.ran}`);
    console.log(`${''.padEnd(16)} joint ${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
    { const t = r.c.tiers; console.log(`${''.padEnd(16)} hold ${label}: ${r.meta.holdTier} pension ${String(t.pen[hold[0]].name).replace(/ /g, '_')} isa ${String(t.isa[hold[1]].name).replace(/ /g, '_')} moves ${r.c.acts.length} ref ${r.meta.readerRef || 'none'}`); }
    r.mix.nodes.forEach((z, k) => {
      const wpaths = res.paths.slice(0, WP).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
      const w = run(r, wpaths, false), v = r.worlds[k].value(s0, 0);
      console.log(`${''.padEnd(16)} world ${label} ${k} z ${z.toFixed(4)} weight ${r.mix.weights[k].toFixed(4)}: table ${(100 * v.survival).toFixed(4)} sim ${w.sim.toFixed(4)} paths ${WP}`);
    });
    const f = run(r, res.paths, true);
    console.log(`${''.padEnd(16)} run ${label}: sim ${f.sim.toFixed(4)} tier-below ${f.tierYrs.toFixed(2)} changes ${f.changes.toFixed(3)} secs ${Math.round(f.secs)}`);
    const T = f.tr;
    writeFileSync(join(OUT, fileOf(id, label)), gzipSync(JSON.stringify({ id, arm: label, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: f.sim,
      survived: b64(f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    console.log(`${''.padEnd(16)} done ${label}`);
  });
} else if (mode === 'diag7z') {
  /*
   * 7Z: DOES INTEGRATING ACROSS THE READER'S STEP IN THE CHOOSER (Q's fix) GAIN ON SHARE 0.95 WITHOUT HARM ELSEWHERE? (PLAN.md
   * 7z; predictions/diag-7z.md; the ledger 27 Sep 21:29 and 22:32; the deep review after 7x). Each unit is one solve at the
   * product's settings (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's to 7x's, 5 return points) with the bridge
   * reader on, with Q's fix off (READER) or on (READER+STEP: solve.js bridgeStep 'exact'), run forward on the same NP paths
   * at the product's switch margin (0.001); the year-0 gap line as 7v's and 7w's. Cases: share 0.95 (the test), S126 and
   * bridge 4 (no-harm legs: the fix acts in the years before their reader years too), S194 (no bridge: the fix cannot act).
   *   node research/solver/audit-s126.mjs diag7z [points=30] [paths] part k/n [seed=7002]
   * Prints, per unit: a case line; solve, ran, gap and joint lines; a run line; a done line. Every run's trace goes to
   * results/diag7z/<case>-<unit>.json.gz (DIAG7Z_OUT when set), stamped as the log is; reduce-7z.mjs reads them.
   */
  const CASES7Z = ['share 0.95', 'S126', 'bridge 4', 'S194'];
  const UNITS7Z = [];
  for (const step of [false, true]) for (const id of CASES7Z) UNITS7Z.push([id, step]);
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[7]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7Z_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7z');
  mkdirSync(OUT, { recursive: true });
  console.log(`7Z DIAGNOSIS, the product's settings (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), the reader on, Q's fix off and on, margin 1e-3; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  const fileOf = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7Z.forEach(([id, step], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const label = step ? 'READER+STEP' : 'READER';
    console.log(`${id.padEnd(16)} case | unit ${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    const res = measureV2(h, 'reader', 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, ...(step ? { bridgeStep: 'exact' } : {}) });
    const r = res.r;
    if ((r.meta.bridgeStep === 'exact') !== step) { console.error(`audit-s126: ${label} ran bridgeStep ${r.meta.bridgeStep}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${label}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${label}: ${res.ran}`);
    { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${label}: ${g.gap} opening ${g.open}`); }
    console.log(`${''.padEnd(16)} joint ${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra} readerYears ${r.g.reader ? Array.from(r.g.reader.years).filter(Boolean).length : 0}`);
    const t0 = Date.now(), N = res.paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1);
    let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
    const cap = r.meta.bequestCap;
    res.paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, { trace: tr }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
    const sim = 100 * ok / N;
    console.log(`${''.padEnd(16)} run ${label}: sim ${sim.toFixed(4)} below ${(below / N).toFixed(2)} tier-below ${(tierYrs / N).toFixed(2)} changes ${(changes / N).toFixed(3)} estate ${Math.round(estate / N)} secs ${Math.round((Date.now() - t0) / 1000)}`);
    writeFileSync(join(OUT, fileOf(id, label)), gzipSync(JSON.stringify({ id, arm: label, stamp: STAMP, N: NP, Y: tr.Y, seed: SEED, sim,
      survived: b64(okArr), level: b64(tr.level), tier: b64(tr.tier), wealth: b64(tr.wealth), taxPaid: b64(tr.taxPaid), failYear: b64(tr.failYear) })));
    console.log(`${''.padEnd(16)} done ${label}`);
  });
} else if (mode === 'diag7y') {
  /*
   * 7Y: DOES THE TIER STATE (solve.js tierState) RECOVER WHAT FREE SWITCHING LOSES, AND IS IT THE TIER THAT CARRIES IT?
   * (PLAN.md 7y; predictions/diag-7y.md; the deep review after 7x, deep-review-log.md 27 Sep 22:32 UK; O37-O39's gates).
   * Every solve at the product's settings (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's to 7z's, 5 return
   * points, margin 0.001), run forward on the same NP paths. The arms: PRODUCT (today's free-switching tables), TS (the
   * tier held entering the year part of the state), TS-TIER (TS's tiers with PRODUCT's order, harvest and level, every year:
   * swap.mjs tsSwapChooser) and TS-REST (PRODUCT's tiers with TS's rest), H0 (the plan's tier held for life: holdTier 0/0).
   * The units: on S126 (reader) and S194 (off), P = PRODUCT and H0, T = TS, S = TS-TIER and TS-REST (each re-solving the two
   * tables it needs); on share 0.95, bridge 4 and S360 with the reader and S360 under off (O37's harm leg), P = PRODUCT and
   * T = TS. Each solve's year-0 gap line as 7v's to 7z's.
   *   node research/solver/audit-s126.mjs diag7y [points=30] [paths] part k/n [seed=7002]
   * Prints, per unit: a case line; per solve a solve, ran, gap and joint line; per run a run line (and a swap line on the
   * swap arms); a done line. Every run's trace goes to results/diag7y/<case>-<arm>.json.gz (DIAG7Y_OUT when set), stamped.
   */
  const UNITS7Y = [['S126', 'reader', 'P'], ['S126', 'reader', 'T'], ['S126', 'reader', 'S'], ['S194', 'off', 'P'], ['S194', 'off', 'T'], ['S194', 'off', 'S'],
    ['share 0.95', 'reader', 'P'], ['share 0.95', 'reader', 'T'], ['bridge 4', 'reader', 'P'], ['bridge 4', 'reader', 'T'],
    ['S360', 'reader', 'P'], ['S360', 'reader', 'T'], ['S360', 'off', 'P'], ['S360', 'off', 'T']];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[7]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7Y_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7y');
  mkdirSync(OUT, { recursive: true });
  console.log(`7Y DIAGNOSIS, the product's settings (solvePlan), ${POINTS} points, ${NP} paths (seed ${SEED}), margin 1e-3: PRODUCT, TS (the tier state), TS-TIER, TS-REST, H0; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7Y.forEach(([id, arm, kind], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase();
    console.log(`${id.padEnd(16)} case | unit ${A}/${kind} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    // the solves this unit needs, each logged
    const solveOf = (tag, extra) => {
      const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, ...extra });
      const r = res.r;
      if ((tag === 'TS') !== !!r.meta.tierState) { console.error(`audit-s126: ${tag} ran tierState ${r.meta.tierState}`); process.exit(2); }
      if ((tag === 'H0') !== (r.meta.holdTier === '0/0')) { console.error(`audit-s126: ${tag} ran holdTier ${r.meta.holdTier}`); process.exit(2); }
      const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
      console.log(`${''.padEnd(16)} solve ${A}/${tag}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
      console.log(`${''.padEnd(16)} ran ${A}/${tag}: ${res.ran}`);
      if (tag !== 'H0') { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${A}/${tag}: ${g.gap} opening ${g.open}`); }
      console.log(`${''.padEnd(16)} joint ${A}/${tag}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
      return res;
    };
    const runOf = (label, r, paths, choose, swapN) => {
      const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1);
      let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
      const cap = r.meta.bequestCap;
      paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, { trace: tr, ...(choose ? { choose } : {}) }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
      const sim = 100 * ok / N;
      console.log(`${''.padEnd(16)} run ${A}/${label}: sim ${sim.toFixed(4)} below ${(below / N).toFixed(2)} tier-below ${(tierYrs / N).toFixed(2)} changes ${(changes / N).toFixed(3)} estate ${Math.round(estate / N)} secs ${Math.round((Date.now() - t0) / 1000)}`);
      if (swapN) console.log(`${''.padEnd(16)} swap ${A}/${label}: swapped ${swapN.swapped} same ${swapN.same}`);
      writeFileSync(join(OUT, fileOf(id, arm, label)), gzipSync(JSON.stringify({ id, arm: `${A}/${label}`, stamp: STAMP, N: NP, Y: tr.Y, seed: SEED, sim,
        survived: b64(okArr), level: b64(tr.level), tier: b64(tr.tier), wealth: b64(tr.wealth), taxPaid: b64(tr.taxPaid), failYear: b64(tr.failYear) })));
    };
    if (kind === 'P') {
      const p = solveOf('PRODUCT', {}); runOf('PRODUCT', p.r, p.paths);
      if (id === 'S126' || id === 'S194') { const h0 = solveOf('H0', { holdTier: [0, 0] }); runOf('H0', h0.r, h0.paths); }
    } else if (kind === 'T') {
      const ts = solveOf('TS', { tierState: true }); runOf('TS', ts.r, ts.paths);
    } else {
      const p = solveOf('PRODUCT', {}), ts = solveOf('TS', { tierState: true });
      for (const [label, which] of [['TS-TIER', 'tier'], ['TS-REST', 'rest']]) { const sw = tsSwapChooser(p.r, ts.r, which); runOf(label, p.r, p.paths, sw.choose, sw.n); }
    }
    console.log(`${''.padEnd(16)} done ${A}/${kind}`);
  });
} else if (mode === 'refs360') {
  /*
   * O36'S OPEN PART ON S360 (PLAN.md O36's gate: before any deep review judges the combination of Q's fix and the tier state;
   * the deep review after 7x, 27 Sep 22:32 UK, step 3; a measurement, no test): does the reader's reference at the PLAN's
   * tiers, which every held or tier-state layer reads its bridge years at, turn the de-risk's sign on S360 with the reader?
   * Held-for-life tables (solve.js holdTier) at the plan's tier (0/0) and the freed opening's (2/2), each with the reader's
   * reference at the plan's tiers (readerRef 'plan', the product's) and at the held tier (readerRef 'held', research only),
   * at the product's settings (solvePlan, 30 points, 'auto' risk above, lambda held, 5 return points), each run forward on
   * the same NP paths. Prints each solve's opening table and simulated survival, and per reference dT (the tables' 2/2 less
   * 0/0) against dS (the runs' 2/2 less 0/0) with the paired saved/lost.
   *   node research/solver/audit-s126.mjs refs360 [points=30] [paths] [seed=7002]
   */
  const SEED = process.argv[5] ? Number(process.argv[5]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[5]}`); process.exit(2); }
  const h = all.find(s => s.id === 'S360');
  console.log(`O36 ON S360 WITH THE READER: held tables 0/0 and 2/2, the reader's reference at the plan's tiers and at the held tier; ${POINTS} points, ${NP} paths (seed ${SEED}); a measurement`);
  const res = {};
  for (const ref of ['plan', 'held']) for (const hold of [[0, 0], [2, 2]]) {
    const x = measureV2(h, 'reader', 5, { seed: SEED, lambda: LAMBDA, holdTier: hold, readerRef: ref });
    if (x.r.meta.holdTier !== hold.join('/') || x.r.meta.readerRef !== ref) { console.error(`audit-s126: ran holdTier ${x.r.meta.holdTier} readerRef ${x.r.meta.readerRef}`); process.exit(2); }
    res[`${ref}|${hold.join('')}`] = x;
    console.log(`  ref ${ref.padEnd(4)} hold ${hold.join('/')}: table ${x.table.toFixed(4)} sim ${x.sim.toFixed(4)} secs ${Math.round(x.secs)} | ran ${x.ran}`);
  }
  for (const ref of ['plan', 'held']) {
    const a = res[`${ref}|00`], b = res[`${ref}|22`];
    let saved = 0, lost = 0; for (let i = 0; i < NP; i++) { if (!a.okArr[i] && b.okArr[i]) saved++; else if (a.okArr[i] && !b.okArr[i]) lost++; }
    console.log(`  ref ${ref}: dT ${(b.table - a.table).toFixed(4)} dS ${(b.sim - a.sim).toFixed(4)} (2/2 against 0/0: ${saved} saved, ${lost} lost)`);
  }
} else if (mode === 'o41') {
  /*
   * O41'S BOUND (PLAN.md O41's gate; the deep review after 7z, 28 Sep 00:38 UK; a measurement, tables only, no survival test):
   * the tier state with the switch rule applied per world (TS, 7y's arm) against the joint tier state (TS+J: the chooser's
   * full rule, one move for every world, the margin on the mixture-weighted score), each solved at the product's settings
   * (solvePlan, 30 points, 'auto' risk above, lambda held, 5 return points, margin 0.001), on S126 (reader), S194 (off) and
   * share 0.95 (reader). Per solve: the year-0 gap (as 7v's to 7y's) and the pension tier it opens in at 1e-3 and at 0, the
   * mixture's opening table and each world's. The bound rule, written before the measurement (O41's gate): O41 is BOUNDED at
   * the opening on a case where TS+J opens in the same pair at 1e-3 as TS and its gap is within 2 times TS's.
   *   node research/solver/audit-s126.mjs o41 [points=30] [paths=1] [seed=7002]
   */
  const SEED = process.argv[5] ? Number(process.argv[5]) : 7002;
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen), s0 };
  };
  console.log(`O41'S BOUND: the tier state per world (TS) against the joint tier state (TS+J), tables only, ${POINTS} points (seed ${SEED} for the opening state); a measurement`);
  const res = {};
  for (const [id, arm] of [['S126', 'reader'], ['S194', 'off'], ['share 0.95', 'reader']]) {
    const h = byId(id)();
    for (const [tag, joint] of [['TS', false], ['TS+J', true]]) {
      const x = measureV2(h, arm === 'reader' ? 'reader' : false, 5, { seed: SEED, lambda: LAMBDA, forward: false, tierState: true, joint });
      const r = x.r;
      if (!!r.meta.jointWorlds !== joint || !r.meta.tierState) { console.error(`audit-s126: ${tag} ran jointWorlds ${r.meta.jointWorlds} tierState ${r.meta.tierState}`); process.exit(2); }
      const g = openGap(r, x.paths[0]);
      const worlds = r.worlds.map(w => (100 * w.value(M.initialState(r.m), 0).survival).toFixed(4)).join(' / ');
      res[`${id}|${tag}`] = g;
      console.log(`${id.padEnd(11)} ${arm.padEnd(6)} ${tag.padEnd(5)} gap ${g.gap} opens ${g.open[0]} at 1e-3, ${g.open[1]} at 0 | table ${x.table.toFixed(4)} | worlds ${worlds} | secs ${Math.round(x.secs)} | ran ${x.ran}`);
    }
    const a = res[`${id}|TS`], b = res[`${id}|TS+J`], ga = a.gap === '0' ? 0 : a.gap === '>1' ? Infinity : Number(a.gap), gb = b.gap === '0' ? 0 : b.gap === '>1' ? Infinity : Number(b.gap);
    const within = ga === gb || (ga > 0 && gb > 0 && gb / ga <= 2 && ga / gb <= 2);
    console.log(`${id.padEnd(11)} the bound: TS+J opens in pair ${b.open[0]} at 1e-3, TS in ${a.open[0]}; gap ratio TS+J/TS ${ga > 0 && Number.isFinite(ga) && Number.isFinite(gb) ? (gb / ga).toFixed(3) : 'n/a'} -> ${b.open[0] === a.open[0] && within ? 'BOUNDED' : 'NOT BOUNDED'}`);
  }
} else if (mode === 'diag7aa') {
  /*
   * 7AA: DOES THE JOINT TIER STATE (tierState with jointWorlds: the chooser's full rule, one move for every world) GAIN WHERE
   * THE PER-WORLD TIER STATE DID NOT, WITH THE POT'S WEIGHT OFF AND ON? (PLAN.md 7aa; predictions/diag-7aa.md; the
   * maintainer's go-ahead, 28 Sep; the deep review on both reads, 02:38 UK; O41, O42, O43.) Every solve at the product's
   * settings (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's to 7z's, 5 return points, margin 0.001) but for
   * the estate weight, passed explicitly: 0 (the pot off, survival first) or 0.02 (the solver's default), run forward on
   * the same NP paths. The arms: PRODUCT (free-switching tables), TS (the per-world tier state, 7y's), TS+J (the joint tier
   * state, O41's). The units: each case (S126 and bridge 4 with the reader, S194 under off, S360 with the reader and under
   * off), each weight and each arm, one solve and one run. Each solve's year-0 gap line as 7v's to 7y's; each world's
   * opening table against the policy's run in that world on the first WP paths (the long-run shift set to the world's node).
   *   node research/solver/audit-s126.mjs diag7aa [points=30] [paths] part k/n [seed=7002] [world paths=1000]
   * Prints, per unit: a case line; a solve, ran, gap and joint line; a world line per world; a run line; a done line. The
   * run's trace goes to results/diag7aa/<case>-<arm>-<label>.json.gz (DIAG7AA_OUT when set), stamped.
   */
  const CASES7AA = [['S126', 'reader'], ['S194', 'off'], ['bridge 4', 'reader'], ['S360', 'reader'], ['S360', 'off']];
  const UNITS7AA = [];
  for (const w of [0, 0.02]) for (const [id, arm] of CASES7AA) for (const tag of ['PRODUCT', 'TS', 'TS+J']) UNITS7AA.push([id, arm, tag, w]);
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WP = process.argv[8] ? Number(process.argv[8]) : 1000;
  if (!(SEED >= 1) || !(WP >= 1)) { console.error(`audit-s126: bad seed or world paths ${process.argv[7]} ${process.argv[8]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7AA_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7aa');
  mkdirSync(OUT, { recursive: true });
  console.log(`7AA DIAGNOSIS, the product's settings (solvePlan) but the estate weight, ${POINTS} points, ${NP} paths (seed ${SEED}), ${WP} a world, margin 1e-3: PRODUCT, TS, TS+J at the estate weight 0 and 0.02; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  const run = (r, paths, trace) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null;
    let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
    const cap = r.meta.bequestCap;
    paths.forEach((zs, k) => { if (tr) tr.row = k; const o = runPolicy(r, zs, tr ? { trace: tr } : {}); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, changes: changes / N, estate: estate / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7AA.forEach(([id, arm, tag, w], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase(), label = `${tag}/W${w}`;
    console.log(`${id.padEnd(16)} case | unit ${A}/${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w, ...(tag !== 'PRODUCT' ? { tierState: true } : {}), ...(tag === 'TS+J' ? { joint: true } : {}) });
    const r = res.r, s0 = M.initialState(r.m);
    if ((tag !== 'PRODUCT') !== !!r.meta.tierState || (tag === 'TS+J') !== !!r.meta.jointWorlds) { console.error(`audit-s126: ${label} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
    if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-s126: ${label} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${A}/${label}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${A}/${label}: ${res.ran}`);
    { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${A}/${label}: ${g.gap} opening ${g.open}`); }
    console.log(`${''.padEnd(16)} joint ${A}/${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
    r.mix.nodes.forEach((z, k) => {
      const wpaths = res.paths.slice(0, WP).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
      const wr = run(r, wpaths, false), v = r.worlds[k].value(s0, 0);
      console.log(`${''.padEnd(16)} world ${A}/${label} ${k} z ${z.toFixed(4)} weight ${r.mix.weights[k].toFixed(4)}: table ${(100 * v.survival).toFixed(4)} sim ${wr.sim.toFixed(4)} paths ${wpaths.length}`);
    });
    const f = run(r, res.paths, true);
    console.log(`${''.padEnd(16)} run ${A}/${label}: sim ${f.sim.toFixed(4)} below ${f.below.toFixed(2)} tier-below ${f.tierYrs.toFixed(2)} changes ${f.changes.toFixed(3)} estate ${Math.round(f.estate)} secs ${Math.round(f.secs)}`);
    const T = f.tr;
    writeFileSync(join(OUT, fileOf(id, arm, label)), gzipSync(JSON.stringify({ id, arm: `${A}/${label}`, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: f.sim,
      survived: b64(f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    console.log(`${''.padEnd(16)} done ${A}/${label}`);
  });
} else if (mode === 'diag7ab') {
  /*
   * 7AB: IS THE FREED OPENING GOOD ENOUGH WITHOUT TS+J'S SOLVE TIME? (PLAN.md 7ab; predictions/diag-7ab.md; the maintainer,
   * 28 Sep 07:54 UK: "keep 7aa as is and queue that follow-up run".) Each unit is 7aa's PRODUCT unit again - the product's
   * settings (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's to 7aa's, 5 return points, margin 0.001) with
   * the estate weight passed explicitly (0 or 0.02) - solved once and run forward on the same NP paths twice: PRODUCT (the
   * product's rule, as 7aa ran it) and FREED (7w's freed opening: the year-0 move chosen at margin 0, 0.001 after; the
   * product's own tables, so no extra solve). No world lines. reduce-7ab.mjs reads FREED against 7aa's TS+J traces only
   * once 7ab's PRODUCT traces equal 7aa's on every path.
   *   node research/solver/audit-s126.mjs diag7ab [points=30] [paths] part k/n [seed=7002]
   * Prints, per unit: a case line; a solve, ran, gap and joint line (7aa's formats, labelled PRODUCT); a run line for PRODUCT
   * and one for FREED; a done line. Each run's trace goes to results/diag7ab/<case>-<arm>-<label>.json.gz (DIAG7AB_OUT when
   * set), stamped.
   */
  const CASES7AB = [['S126', 'reader'], ['S194', 'off'], ['bridge 4', 'reader'], ['S360', 'reader'], ['S360', 'off']];
  const UNITS7AB = [];
  for (const w of [0, 0.02]) for (const [id, arm] of CASES7AB) UNITS7AB.push([id, arm, w]);
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[7]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7AB_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7ab');
  mkdirSync(OUT, { recursive: true });
  console.log(`7AB DIAGNOSIS, the product's settings (solvePlan) but the estate weight, ${POINTS} points, ${NP} paths (seed ${SEED}), margin 1e-3: PRODUCT and FREED (the year-0 move at margin 0) at the estate weight 0 and 0.02; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  // one forward run on every path; `open` frees the year-0 move (7w's forward: the chooser at margin 0 in year 0, the
  // product's margin after); without it the call is 7aa's own
  const run = (r, paths, open) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1);
    let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
    const cap = r.meta.bequestCap;
    paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, open ? { trace: tr, choose: (t, st, held) => (t === 0 ? chooseAt(r, st, 0, held, 0) : chooseAction(r, st, t, held)) } : { trace: tr }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, changes: changes / N, estate: estate / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7AB.forEach(([id, arm, w], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase(), label = `PRODUCT/W${w}`;
    console.log(`${id.padEnd(16)} case | unit ${A}/${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w });
    const r = res.r;
    if (r.meta.tierState || r.meta.jointWorlds) { console.error(`audit-s126: ${label} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
    if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-s126: ${label} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${A}/${label}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${A}/${label}: ${res.ran}`);
    { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${A}/${label}: ${g.gap} opening ${g.open}`); }
    console.log(`${''.padEnd(16)} joint ${A}/${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
    for (const [tag, open] of [['PRODUCT', false], ['FREED', true]]) {
      const lb = `${tag}/W${w}`, f = run(r, res.paths, open);
      console.log(`${''.padEnd(16)} run ${A}/${lb}: sim ${f.sim.toFixed(4)} below ${f.below.toFixed(2)} tier-below ${f.tierYrs.toFixed(2)} changes ${f.changes.toFixed(3)} estate ${Math.round(f.estate)} secs ${Math.round(f.secs)}`);
      const T = f.tr;
      writeFileSync(join(OUT, fileOf(id, arm, lb)), gzipSync(JSON.stringify({ id, arm: `${A}/${lb}`, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: f.sim,
        survived: b64(f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    }
    console.log(`${''.padEnd(16)} done ${A}/W${w}`);
  });
} else if (mode === 'diag7ac') {
  /*
   * 7AC: DOES TS+J PRICE THE OPENING RIGHT? THE FOURTH CELL (PLAN.md 7ac; predictions/diag-7ac.md; the deep review after 7aa,
   * deep-review-log.md 28 Sep 11:44 UK; the maintainer, 28 Sep 11:59 UK). Each unit is 7aa's TS+J unit again - the product's
   * settings (solvePlan, 30 points, 'auto' risk above, lambda held at 7t's to 7aa's, 5 return points, margin 0.001) with the
   * tier state and one move for every world, the estate weight passed explicitly - solved once and run forward on the same
   * NP paths twice: TS+J (7aa's rule; reduce-7ac.mjs requires its trace to equal 7aa's on every path) and OPEN0 (the year-0
   * move held in the plan's tier: the chooser at an unbounded margin in year 0 takes the best move that keeps the held
   * pension and ISA tiers, solve.js chooseAction; the product's 0.001 after). Only the four units where TS+J opens tier 2 and
   * the product the plan's tier (7aa; results-7aa-gaps.txt): S126 (reader) at W0 and W0.02, bridge 4 (reader) at W0, S194
   * (off) at W0.02. Each world: the world table's own price of the opening at the true year-0 position (its best move's
   * score less its best plan's-tier move's score, in points), and TS+J's and OPEN0's survival on the first WP paths with the
   * long-run shift at the world's node; beside it the mixture's price, which must equal the gap line's.
   *   node research/solver/audit-s126.mjs diag7ac [points=30] [paths] part k/n [seed=7002] [world paths=1000]
   * Prints, per unit: a case line; a solve, ran, gap and joint line (7aa's formats, labelled TS+J); a price line; a world
   * line per world; a run line for TS+J and one for OPEN0 (with the paths whose year-0 move kept the plan's tiers); a done
   * line. Each run's trace goes to results/diag7ac/<case>-<arm>-<label>.json.gz (DIAG7AC_OUT when set), stamped.
   */
  const UNITS7AC = [['S126', 'reader', 0], ['bridge 4', 'reader', 0], ['S126', 'reader', 0.02], ['S194', 'off', 0.02]];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WP = process.argv[8] ? Number(process.argv[8]) : 1000;
  if (!(SEED >= 1) || !(WP >= 1)) { console.error(`audit-s126: bad seed or world paths ${process.argv[7]} ${process.argv[8]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7AC_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7ac');
  mkdirSync(OUT, { recursive: true });
  console.log(`7AC DIAGNOSIS, the product's settings (solvePlan) but the estate weight, ${POINTS} points, ${NP} paths (seed ${SEED}), ${WP} a world, margin 1e-3: TS+J and OPEN0 (TS+J's tables, the year-0 move held in the plan's tier) on the four units where TS+J opens tier 2 and the product the plan's tier; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const opening = (r, zs) => { let s0 = null, h0 = null; runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } }); return { s0, h0 }; };
  const openGap = (r, zs) => {
    const { s0, h0 } = opening(r, zs), acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  // a table's price of the opening at (s0, h0): its best move's score less its best move keeping the held tiers (points)
  const priceOf = (tabs, weights, s0, h0, acts) => {
    const n = acts.length, SC = new Float64Array(n), S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
    tabs.forEach((tab, k) => { scoreMoves(tab, s0, 0, S2, T2, B2, h0); for (let ai = 0; ai < n; ai++) SC[ai] = S2[ai] === -Infinity || SC[ai] === -Infinity ? -Infinity : SC[ai] + weights[k] * S2[ai]; });
    let best = -Infinity, stay = -Infinity;
    for (let ai = 0; ai < n; ai++) { if (SC[ai] > best) best = SC[ai]; if (acts[ai].tierPen === h0.pen && acts[ai].tierIsa === h0.isa && SC[ai] > stay) stay = SC[ai]; }
    return { price: 100 * (best - stay), best: 100 * best, stay: 100 * stay };
  };
  // one forward run on every path; `open0` holds the year-0 move in the plan's tiers (an unbounded margin in year 0); without
  // it the call is 7aa's own. `held0` counts the paths whose year-0 move kept the held tiers.
  const run = (r, paths, open0, trace) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null, acts = r.c.acts;
    let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0, held0 = 0;
    const cap = r.meta.bequestCap;
    const choose = (t, st, held) => { const ai = t === 0 ? chooseAt(r, st, 0, held, open0 ? Infinity : r.switchMargin) : chooseAction(r, st, t, held); if (t === 0 && held && acts[ai].tierPen === held.pen && acts[ai].tierIsa === held.isa) held0++; return ai; };
    paths.forEach((zs, k) => { if (tr) tr.row = k; const o = runPolicy(r, zs, { ...(tr ? { trace: tr } : {}), ...(open0 ? { choose } : { choose: (t, st, held) => { const ai = chooseAction(r, st, t, held); if (t === 0 && held && acts[ai].tierPen === held.pen && acts[ai].tierIsa === held.isa) held0++; return ai; } }) }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, changes: changes / N, estate: estate / N, held0, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7AC.forEach(([id, arm, w], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase(), label = `TS+J/W${w}`;
    console.log(`${id.padEnd(16)} case | unit ${A}/${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w, tierState: true, joint: true });
    const r = res.r;
    if (!r.meta.tierState || !r.meta.jointWorlds) { console.error(`audit-s126: ${label} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
    if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-s126: ${label} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${A}/${label}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${A}/${label}: ${res.ran}`);
    { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${A}/${label}: ${g.gap} opening ${g.open}`); }
    console.log(`${''.padEnd(16)} joint ${A}/${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
    const { s0, h0 } = opening(r, res.paths[0]), acts = r.c.acts;
    { const p = priceOf(r.mix.tables, r.mix.weights, s0, h0, acts); console.log(`${''.padEnd(16)} price ${A}/${label}: mixture ${p.price.toExponential(6)} best ${p.best.toFixed(6)} stay ${p.stay.toFixed(6)} held ${h0.pen}/${h0.isa}`); }
    r.mix.nodes.forEach((z, k) => {
      const wpaths = res.paths.slice(0, WP).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
      const p = priceOf([r.mix.tables[k]], [1], s0, h0, acts), a = run(r, wpaths, false, false), b = run(r, wpaths, true, false);
      console.log(`${''.padEnd(16)} world ${A}/${label} ${k} z ${z.toFixed(4)} weight ${r.mix.weights[k].toFixed(4)}: price ${p.price.toFixed(4)} best ${p.best.toFixed(4)} stay ${p.stay.toFixed(4)} | sim TS+J ${a.sim.toFixed(4)} OPEN0 ${b.sim.toFixed(4)} paths ${wpaths.length}`);
    });
    for (const [tag, open0] of [['TS+J', false], ['OPEN0', true]]) {
      const lb = `${tag}/W${w}`, f = run(r, res.paths, open0, true);
      console.log(`${''.padEnd(16)} run ${A}/${lb}: sim ${f.sim.toFixed(4)} below ${f.below.toFixed(2)} tier-below ${f.tierYrs.toFixed(2)} changes ${f.changes.toFixed(3)} estate ${Math.round(f.estate)} held0 ${f.held0} secs ${Math.round(f.secs)}`);
      const T = f.tr;
      writeFileSync(join(OUT, fileOf(id, arm, lb)), gzipSync(JSON.stringify({ id, arm: `${A}/${lb}`, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: f.sim,
        survived: b64(f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    }
    console.log(`${''.padEnd(16)} done ${A}/W${w}`);
  });
} else if (mode === 'diag7ad') {
  /*
   * 7AD: THE REFINEMENT CHECK (PLAN.md 7ad; the deep review after 7ac, deep-review-log.md 28 Sep 14:47 UK; the maintainer,
   * 28 Sep 15:01 UK). Is the bad world's price of the opening wrong for numerical reasons? Each job is one case at one grid
   * (wealth points x return points): TS+J (7aa's unit - the product's settings, solvePlan, 'auto' risk above, lambda held,
   * margin 0.001, the tier state and one move for every world, the estate weight passed) solved at that grid, and at the
   * opening's true year-0 position s0 (held tiers h0):
   *   - the mixture's two year-0 moves: BEST (its best move, margin 0) and STAY (its best move keeping the held tiers, an
   *     unbounded margin; OPEN0's), and the move TS+J takes (margin 0.001);
   *   - each world's LIKE-FOR-LIKE price of those two moves - its score of BEST less its score of STAY, the whole and the
   *     survival part apart (scoreMoves' SV) - whose weighted sum must equal the mixture's price, the gap line's;
   *   - node runs: on the first WN paths with each path's long-run shift set to a world's node, TS+J and OPEN0 forward
   *     (every world at 30x5; world 0, the bad world, at the finer grids), each run's trace kept, and the survival of the
   *     first 1000 of them printed so the reducer can check them against 7ac's world lines at 30x5;
   *   - the product (7aa's PRODUCT unit) solved at the same grid: its gap, its mixture price and its worlds' like-for-like
   *     prices of its own BEST and STAY (not for the S126 control).
   *   node research/solver/audit-s126.mjs diag7ad [points, unused: each job names its grid] [paths] part k/n [seed=7002] [node paths=4000]
   * Jobs, longest first: bridge 4 (reader, W0) and S194 (off, W0.02) at 30x15 and 60x5; the same two at 30x5; S126 (reader,
   * W0) at 30x5, the control (TS+J only). Each job prints a case line; for TS+J a solve, ran, gap, joint, moves and price
   * line, a world line per world, a node line per node run; for the product a solve, ran, gap, moves and price line and a
   * world line per world; and a done line. Traces go to results/diag7ad (DIAG7AD_OUT when set), stamped.
   */
  const JOBS7AD = [['bridge 4', 'reader', 0, 30, 15], ['S194', 'off', 0.02, 30, 15], ['bridge 4', 'reader', 0, 60, 5], ['S194', 'off', 0.02, 60, 5],
    ['bridge 4', 'reader', 0, 30, 5], ['S194', 'off', 0.02, 30, 5], ['S126', 'reader', 0, 30, 5]];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WN = process.argv[8] ? Number(process.argv[8]) : 4000;
  if (!(SEED >= 1) || !(WN >= 1) || WN > NP) { console.error(`audit-s126: bad seed or node paths ${process.argv[7]} ${process.argv[8]} (node paths at most the paths, ${NP})`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  // the preflight's tiny grids: DIAG7AD_GRID=4x5 runs every job at 4 wealth points, the return points as named
  const SMALL = process.env.DIAG7AD_GRID ? Number(process.env.DIAG7AD_GRID.split('x')[0]) : null;
  const OUT = process.env.DIAG7AD_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7ad');
  mkdirSync(OUT, { recursive: true });
  console.log(`7AD DIAGNOSIS, the product's settings (solvePlan) but the estate weight, ${NP} paths (seed ${SEED}), ${WN} a node, margin 1e-3: TS+J and the product at 30x5, 60x5 and 30x15 on bridge 4 and S194, TS+J at 30x5 on S126 (the control); the like-for-like price of the opening by world and the node runs of TS+J and OPEN0; part ${pk}/${pn}${SMALL ? `; SMALL GRID ${SMALL} points` : ''}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const opening = (r, zs) => { let s0 = null, h0 = null; runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } }); return { s0, h0 }; };
  const openGap = (r, s0, h0) => {
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  // 7ac's price of the opening: the mixture's best move's score less its best move keeping the held tiers (points)
  const priceOf = (tabs, weights, s0, h0, acts) => {
    const n = acts.length, SC = new Float64Array(n), S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
    tabs.forEach((tab, k) => { scoreMoves(tab, s0, 0, S2, T2, B2, h0); for (let ai = 0; ai < n; ai++) SC[ai] = S2[ai] === -Infinity || SC[ai] === -Infinity ? -Infinity : SC[ai] + weights[k] * S2[ai]; });
    let best = -Infinity, stay = -Infinity;
    for (let ai = 0; ai < n; ai++) { if (SC[ai] > best) best = SC[ai]; if (acts[ai].tierPen === h0.pen && acts[ai].tierIsa === h0.isa && SC[ai] > stay) stay = SC[ai]; }
    return { price: 100 * (best - stay), best: 100 * best, stay: 100 * stay };
  };
  // one world table's like-for-like price of two named moves (points): the whole score and the survival part apart
  const likeForLike = (tab, s0, h0, aB, aS, n) => {
    const S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n), V2 = new Float64Array(n);
    scoreMoves(tab, s0, 0, S2, T2, B2, h0, null, V2);
    return { whole: 100 * (S2[aB] - S2[aS]), surv: 100 * (V2[aB] - V2[aS]) };
  };
  const moves = (r, s0, h0) => { const bi = chooseAt(r, s0, 0, h0, 0), si = chooseAt(r, s0, 0, h0, Infinity), ci = chooseAction(r, s0, 0, h0), a = r.c.acts; return { bi, si, ci, txt: `best ${bi} ${a[bi].tierPen}/${a[bi].tierIsa} stay ${si} ${a[si].tierPen}/${a[si].tierIsa} chosen ${ci} ${a[ci].tierPen}/${a[ci].tierIsa} held ${h0.pen}/${h0.isa}` }; };
  const run = (r, paths, open0, trace) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null, acts = r.c.acts;
    let ok = 0, held0 = 0;
    const choose = (t, st, held) => { const ai = t === 0 ? chooseAt(r, st, 0, held, open0 ? Infinity : r.switchMargin) : chooseAction(r, st, t, held); if (t === 0 && held && acts[ai].tierPen === held.pen && acts[ai].tierIsa === held.isa) held0++; return ai; };
    paths.forEach((zs, k) => { if (tr) tr.row = k; const o = runPolicy(r, zs, { ...(tr ? { trace: tr } : {}), choose }); if (o.survived) { ok++; okArr[k] = 1; } });
    return { sim: 100 * ok / N, held0, okArr, tr, first: 100 * okArr.slice(0, Math.min(1000, N)).reduce((t, x) => t + x, 0) / Math.min(1000, N), secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, grid, rule, k, w) => `${id.replace(/ /g, '_')}-${arm}-${grid}-${rule.toLowerCase().replace(/\+/g, '_')}-world${k}@w${w}.json.gz`;
  JOBS7AD.forEach(([id, arm, w, pts0, quad], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const pts = SMALL || pts0, grid = `${pts0}x${quad}`, A = arm.toUpperCase();
    console.log(`${id.padEnd(16)} case | job ${A}/${grid}/W${w} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${pts} quad ${quad}`);
    for (const tag of id === 'S126' ? ['TS+J'] : ['TS+J', 'PRODUCT']) {
      const L = `${A}/${tag}/${grid}/W${w}`;
      const res = measureV2(h, ARM[arm], quad, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w, points: pts, ...(tag === 'TS+J' ? { tierState: true, joint: true } : {}) });
      const r = res.r;
      if (tag === 'TS+J' && (!r.meta.tierState || !r.meta.jointWorlds)) { console.error(`audit-s126: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
      if (tag === 'PRODUCT' && (r.meta.tierState || r.meta.jointWorlds)) { console.error(`audit-s126: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
      if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-s126: ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
      const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
      console.log(`${''.padEnd(16)} solve ${L}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
      console.log(`${''.padEnd(16)} ran ${L}: ${res.ran}`);
      const { s0, h0 } = opening(r, res.paths[0]), acts = r.c.acts, n = acts.length;
      { const g = openGap(r, s0, h0); console.log(`${''.padEnd(16)} gap ${L}: ${g.gap} opening ${g.open}`); }
      console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
      const mv = moves(r, s0, h0);
      console.log(`${''.padEnd(16)} moves ${L}: ${mv.txt}`);
      const p = priceOf(r.mix.tables, r.mix.weights, s0, h0, acts);
      const lfl = r.mix.tables.map(tab => likeForLike(tab, s0, h0, mv.bi, mv.si, n));
      const sumW = lfl.reduce((t, x, k) => t + r.mix.weights[k] * x.whole, 0), sumS = lfl.reduce((t, x, k) => t + r.mix.weights[k] * x.surv, 0);
      console.log(`${''.padEnd(16)} price ${L}: mixture ${p.price.toExponential(6)} like-for-like whole ${sumW.toExponential(6)} survival ${sumS.toExponential(6)}`);
      r.mix.nodes.forEach((z, k) => console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(4)} weight ${r.mix.weights[k].toFixed(4)}: whole ${lfl[k].whole.toFixed(6)} survival ${lfl[k].surv.toFixed(6)}`));
      if (tag !== 'TS+J') continue;
      // node runs: every world at 30x5, world 0 (the bad world) at the finer grids
      r.mix.nodes.forEach((z, k) => {
        if (!(pts0 === 30 && quad === 5) && k !== 0) return;
        const npaths = res.paths.slice(0, WN).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
        const a = run(r, npaths, false, true), b = run(r, npaths, true, true);
        console.log(`${''.padEnd(16)} node ${L} ${k} z ${z.toFixed(4)}: sim TS+J ${a.sim.toFixed(4)} OPEN0 ${b.sim.toFixed(4)} held0 TS+J ${a.held0} OPEN0 ${b.held0} first1000 TS+J ${a.first.toFixed(4)} OPEN0 ${b.first.toFixed(4)} paths ${npaths.length} secs ${Math.round(a.secs + b.secs)}`);
        for (const [rule, f] of [['TS+J', a], ['OPEN0', b]]) writeFileSync(join(OUT, fileOf(id, arm, grid, rule, k, w)), gzipSync(JSON.stringify({ id, arm: `${A}/${rule}/${grid}/W${w}/world${k}`, stamp: STAMP, N: npaths.length, Y: f.tr.Y, seed: SEED, node: z, sim: f.sim,
          survived: b64(f.okArr), level: b64(f.tr.level), tier: b64(f.tr.tier), wealth: b64(f.tr.wealth), taxPaid: b64(f.tr.taxPaid), failYear: b64(f.tr.failYear) })));
      });
    }
    console.log(`${''.padEnd(16)} done ${A}/${grid}/W${w}`);
  });
} else if (mode === 'diag7ae') {
  /*
   * 7AE: THE BAD NODE AT MARGIN 0 (PLAN.md 7ae; the deep review after 7ad, deep-review-log.md 28 Sep 19:09 UK; the
   * maintainer's go-ahead). Is the per-year switch margin why the tables price the bad world's de-risk below what it
   * realises? Each job is one unit at 30x5 - bridge 4 (reader, W0), S194 (off, W0.02), S126 (reader, W0) - and solves TS+J
   * (7aa's unit: the product's settings, 'auto' risk above, lambda held, the tier state and one move for every world, the
   * estate weight passed) twice: at the product's margin 0.001 (7aa's solve, unchanged) and at switchMargin 0 (the backward
   * pass and the chooser both; the switch cost kept). For each: the gap, the mixture's two year-0 moves (BEST, STAY) and
   * each world's like-for-like price of them (7ad's lines), and at world 0's node on the first WN paths (the first 4,000
   * 7ad's), TS+J and OPEN0 (the year-0 move held in the plan's tiers, the table's margin after) forward, traces kept; and
   * the decision log: on each run, for each year 1 to 10, among the paths still holding the plan's tiers at the year's
   * start, how often the forward move leaves them, how often the nearest cell's stored move for that held layer does
   * (tsLayers[j].pol[t][nearestIndex]), both ways of disagreeing, and how often the margin alone holds (the best move at
   * margin 0 leaves, the chosen one stays).
   *   node research/solver/audit-s126.mjs diag7ae [points] [paths] part k/n [seed=7002] [node paths=8000]
   */
  const JOBS7AE = [['bridge 4', 'reader', 0], ['S194', 'off', 0.02], ['S126', 'reader', 0]];
  const MARGINS7AE = [['1e-3', undefined], ['0', 0]];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WN = process.argv[8] ? Number(process.argv[8]) : 8000, YEARS = 10;
  if (!(SEED >= 1) || !(WN >= 1) || WN > NP) { console.error(`audit-s126: bad seed or node paths ${process.argv[7]} ${process.argv[8]} (node paths at most the paths, ${NP})`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = process.env.DIAG7AE_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7ae');
  mkdirSync(OUT, { recursive: true });
  console.log(`7AE DIAGNOSIS, the product's settings (solvePlan) but the estate weight, ${POINTS} points, ${NP} paths (seed ${SEED}), ${WN} at the bad node: TS+J at switch margin 0.001 and 0 on bridge 4, S194 and S126; the like-for-like price of the opening, TS+J and OPEN0 at world 0's node, and the forward-against-cell decision log; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const opening = (r, zs) => { let s0 = null, h0 = null; runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } }); return { s0, h0 }; };
  const openGap = (r, s0, h0) => {
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  const priceOf = (tabs, weights, s0, h0, acts) => {
    const n = acts.length, SC = new Float64Array(n), S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
    tabs.forEach((tab, k) => { scoreMoves(tab, s0, 0, S2, T2, B2, h0); for (let ai = 0; ai < n; ai++) SC[ai] = S2[ai] === -Infinity || SC[ai] === -Infinity ? -Infinity : SC[ai] + weights[k] * S2[ai]; });
    let best = -Infinity, stay = -Infinity;
    for (let ai = 0; ai < n; ai++) { if (SC[ai] > best) best = SC[ai]; if (acts[ai].tierPen === h0.pen && acts[ai].tierIsa === h0.isa && SC[ai] > stay) stay = SC[ai]; }
    return { price: 100 * (best - stay) };
  };
  const likeForLike = (tab, s0, h0, aB, aS, n) => {
    const S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n), V2 = new Float64Array(n);
    scoreMoves(tab, s0, 0, S2, T2, B2, h0, null, V2);
    return { whole: 100 * (S2[aB] - S2[aS]), surv: 100 * (V2[aB] - V2[aS]) };
  };
  const moves = (r, s0, h0) => { const bi = chooseAt(r, s0, 0, h0, 0), si = chooseAt(r, s0, 0, h0, Infinity), ci = chooseAction(r, s0, 0, h0), a = r.c.acts; return { bi, si, ci, txt: `best ${bi} ${a[bi].tierPen}/${a[bi].tierIsa} stay ${si} ${a[si].tierPen}/${a[si].tierIsa} chosen ${ci} ${a[ci].tierPen}/${a[ci].tierIsa} held ${h0.pen}/${h0.isa}` }; };
  // the forward run with the decision log: `plan` the plan's tiers; a year's log counts the paths holding them at its start
  const run = (r, paths, open0, plan) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1), acts = r.c.acts, tab = r.mix.tables[0];
    const layerOf = new Map(); acts.forEach((a, ai) => { const key = `${a.tierPen || 0}/${a.tierIsa || 0}`; if (!layerOf.has(key)) layerOf.set(key, tab.tsLayerOf[ai]); });
    const log = Array.from({ length: YEARS + 1 }, () => ({ held: 0, fwdLeave: 0, cellLeave: 0, fwdHoldCellLeave: 0, fwdLeaveCellHold: 0, marginHold: 0 }));
    let ok = 0, held0 = 0;
    const leaves = (ai, held) => acts[ai].tierPen !== held.pen || acts[ai].tierIsa !== held.isa;
    const choose = (t, st, held) => {
      const ai = t === 0 ? chooseAt(r, st, 0, held, open0 ? Infinity : r.switchMargin) : chooseAction(r, st, t, held);
      if (t === 0 && held && !leaves(ai, held)) held0++;
      if (t >= 1 && t <= YEARS && held && held.pen === plan.pen && held.isa === plan.isa) {
        const L = log[t], j = layerOf.get(`${held.pen}/${held.isa}`), cell = tab.tsLayers[j].pol[Math.min(t, T)][nearestIndex(r.g, st)];
        const f = leaves(ai, held), c = leaves(cell, held);
        L.held++; if (f) L.fwdLeave++; if (c) L.cellLeave++; if (!f && c) L.fwdHoldCellLeave++; if (f && !c) L.fwdLeaveCellHold++;
        if (!f && r.switchMargin > 0 && leaves(chooseAt(r, st, t, held, 0), held)) L.marginHold++;
      }
      return ai;
    };
    paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, { trace: tr, choose }); if (o.survived) { ok++; okArr[k] = 1; } });
    const firstN = Math.min(4000, N);
    return { sim: 100 * ok / N, held0, okArr, tr, log, first: 100 * okArr.slice(0, firstN).reduce((t, x) => t + x, 0) / firstN, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, m, rule, w) => `${id.replace(/ /g, '_')}-${arm}-m${m}-${rule.toLowerCase().replace(/\+/g, '_')}-world0@w${w}.json.gz`;
  JOBS7AE.forEach(([id, arm, w], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase();
    console.log(`${id.padEnd(16)} case | job ${A}/W${w} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${POINTS} quad 5`);
    for (const [m, sm] of MARGINS7AE) {
      const L = `${A}/TS+J/M${m}/W${w}`;
      const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w, tierState: true, joint: true, ...(sm !== undefined ? { switchMargin: sm } : {}) });
      const r = res.r;
      if (!r.meta.tierState || !r.meta.jointWorlds) { console.error(`audit-s126: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
      if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-s126: ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
      if (!(r.switchMargin === (sm !== undefined ? sm : 0.001))) { console.error(`audit-s126: ${L} ran switch margin ${r.switchMargin}`); process.exit(2); }
      const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
      console.log(`${''.padEnd(16)} solve ${L}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
      console.log(`${''.padEnd(16)} ran ${L}: ${res.ran}`);
      const { s0, h0 } = opening(r, res.paths[0]), acts = r.c.acts, n = acts.length;
      { const g = openGap(r, s0, h0); console.log(`${''.padEnd(16)} gap ${L}: ${g.gap} opening ${g.open}`); }
      console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
      const mv = moves(r, s0, h0);
      console.log(`${''.padEnd(16)} moves ${L}: ${mv.txt}`);
      const p = priceOf(r.mix.tables, r.mix.weights, s0, h0, acts);
      const lfl = r.mix.tables.map(tab => likeForLike(tab, s0, h0, mv.bi, mv.si, n));
      const sumW = lfl.reduce((t, x, k) => t + r.mix.weights[k] * x.whole, 0), sumS = lfl.reduce((t, x, k) => t + r.mix.weights[k] * x.surv, 0);
      console.log(`${''.padEnd(16)} price ${L}: mixture ${p.price.toExponential(6)} like-for-like whole ${sumW.toExponential(6)} survival ${sumS.toExponential(6)}`);
      r.mix.nodes.forEach((z, k) => console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(4)} weight ${r.mix.weights[k].toFixed(4)}: whole ${lfl[k].whole.toFixed(6)} survival ${lfl[k].surv.toFixed(6)}`));
      const z = r.mix.nodes[0];
      const npaths = res.paths.slice(0, WN).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
      const a = run(r, npaths, false, h0), b = run(r, npaths, true, h0);
      console.log(`${''.padEnd(16)} node ${L} 0 z ${z.toFixed(4)}: sim TS+J ${a.sim.toFixed(4)} OPEN0 ${b.sim.toFixed(4)} held0 TS+J ${a.held0} OPEN0 ${b.held0} first4000 TS+J ${a.first.toFixed(4)} OPEN0 ${b.first.toFixed(4)} paths ${npaths.length} secs ${Math.round(a.secs + b.secs)}`);
      for (const [rule, f] of [['TS+J', a], ['OPEN0', b]]) {
        for (let t = 1; t <= YEARS; t++) { const g = f.log[t]; console.log(`${''.padEnd(16)} log ${L} ${rule} year ${t}: held ${g.held} fwdLeave ${g.fwdLeave} cellLeave ${g.cellLeave} fwdHoldCellLeave ${g.fwdHoldCellLeave} fwdLeaveCellHold ${g.fwdLeaveCellHold} marginHold ${g.marginHold}`); }
        writeFileSync(join(OUT, fileOf(id, arm, m, rule, w)), gzipSync(JSON.stringify({ id, arm: `${A}/${rule}/M${m}/W${w}/world0`, stamp: STAMP, N: npaths.length, Y: f.tr.Y, seed: SEED, node: z, sim: f.sim,
          survived: b64(f.okArr), level: b64(f.tr.level), tier: b64(f.tr.tier), wealth: b64(f.tr.wealth), taxPaid: b64(f.tr.taxPaid), failYear: b64(f.tr.failYear) })));
      }
    }
    console.log(`${''.padEnd(16)} done ${A}/W${w}`);
  });
} else if (mode === 'diag7af' || mode === 'diag7ag') {
  /*
   * 7AF: THE CANDIDATE BUNDLE AGAINST THE SHIPPING DEFAULT (PLAN.md 7af; predictions/diag-7af.md; the deep review after 7ae,
   * deep-review-log.md 28 Sep 22:52 UK, which designed it under the maintainer's steer of 22:10 UK). Every solve at the
   * product's settings (solvePlan, 30 points, 'auto' risk above, lambda held, 5 return points, margin 0.001) with the
   * estate weight passed at the default, 0.02. The arms, per household:
   *   CAND  - the bridge reader with the joint tier state (READER/TS+J/W0.02: 7aa's TS+J unit on the reader);
   *   SHIP  - the shipping default: no bridge read, the product's per-world tables (OFF/PRODUCT/W0.02);
   *   PRODR - the product's tables with the reader (READER/PRODUCT/W0.02), on households with a bridge only: it splits a
   *           harm between the reader (PRODR against SHIP) and the tier state (CAND against PRODR).
   * The panel: 7e's households in its registered order, the first 12 not reused, then S126, bridge 4, S360 and S194 (the
   * units 7aa also ran, identity-checked by the reducer). Every unit runs on the same NP paths of the seed; its trace kept.
   *   node research/solver/audit-s126.mjs diag7af [points=30] [paths] part k/n [seed=7002]
   * Prints per unit 7aa's lines (reduce-7aa.mjs parse): a case line, solve, ran, gap, joint, run and done; no world lines.
   * Units in the order CAND, SHIP, PRODR (the longest first); part k/n runs the units with index i % n === k.
   * 7AG (PLAN.md 7ag; predictions/diag-7ag.md; the deep review after 7af, deep-review-log.md 29 Sep 03:07 UK): the same
   * arms and lines on the nine households of 7e's panel 7af did not run, every one with a bridge (so PRODR on all nine),
   * its traces in results/diag7ag (DIAG7AG_OUT); the path count is the command's (the batch passes 16,000). One more unit,
   * the last (index 27): TS+J under off on S126 (OFF/TS+J/W0.02), which the batch runs alone at 8,000 paths so it pairs with
   * 7af's S126 units path by path (the plan-auditor's BLOCKING 1 of 29 Sep: does the tier state repair the reader's error
   * on S126, or add a gain of its own beside it?).
   *   node research/solver/audit-s126.mjs diag7ag [points=30] [paths] part k/n [seed=7002]
   */
  const AG = mode === 'diag7ag';
  const PANEL7AF = AG ? [['S124', 2], ['S128', 2], ['S130', 2], ['S366', 8], ['S370', 8], ['bridge 4+cost', 4], ['S162', 2], ['S172', 2], ['S168', 2]] : [['share 0.50', 2], ['share 0.70', 2], ['share 0.78', 2], ['share 0.90', 2], ['share 0.95', 2], ['bridge 0', 0], ['bridge 1', 1], ['bridge 6', 6],
    ['wealth x0.5', 2], ['wealth x2', 2], ['S120', 2], ['S122', 2], ['S126', 2], ['bridge 4', 4], ['S360', 8], ['S194', 0]];
  const UNITS7AF = [...PANEL7AF.map(([id]) => [id, 'reader', 'TS+J']), ...PANEL7AF.map(([id]) => [id, 'off', 'PRODUCT']),
    ...PANEL7AF.filter(([, b]) => b > 0).map(([id]) => [id, 'reader', 'PRODUCT']), ...(AG ? [['S126', 'off', 'TS+J']] : [])];
  const W7AF = 0.02, ARM = { off: false, reader: 'reader' };
  const known = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]), ['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
  if (!(SEED >= 1)) { console.error(`audit-s126: bad seed ${process.argv[7]}`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const OUT = AG ? (process.env.DIAG7AG_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7ag')) : (process.env.DIAG7AF_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7af'));
  mkdirSync(OUT, { recursive: true });
  console.log(`${AG ? '7AG, on the nine remaining panel households, ' : '7AF, '}the candidate bundle (READER/TS+J) against the shipping default (OFF/PRODUCT) and the product with the reader (READER/PRODUCT) on bridge households, the product's settings (solvePlan) with the estate weight ${W7AF}, ${POINTS} points, ${NP} paths (seed ${SEED}), margin 1e-3; ${UNITS7AF.length} units; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const openGap = (r, zs) => {
    let s0 = null, h0 = null;
    runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  const run = (r, paths) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1);
    let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
    const cap = r.meta.bequestCap;
    paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, { trace: tr }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, changes: changes / N, estate: estate / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
  UNITS7AF.forEach(([id, arm, tag], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase(), label = `${tag}/W${W7AF}`;
    console.log(`${id.padEnd(16)} case | unit ${A}/${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    const res = measureV2(h, ARM[arm], 5, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: W7AF, ...(tag === 'TS+J' ? { tierState: true, joint: true } : {}) });
    const r = res.r;
    if ((tag === 'TS+J') !== !!r.meta.tierState || (tag === 'TS+J') !== !!r.meta.jointWorlds) { console.error(`audit-s126: ${label} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
    if (!(Math.abs(r.meta.bequestWeight - W7AF) < 1e-12)) { console.error(`audit-s126: ${label} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
    const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
    console.log(`${''.padEnd(16)} solve ${A}/${label}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
    console.log(`${''.padEnd(16)} ran ${A}/${label}: ${res.ran}`);
    { const g = openGap(r, res.paths[0]); console.log(`${''.padEnd(16)} gap ${A}/${label}: ${g.gap} opening ${g.open}`); }
    console.log(`${''.padEnd(16)} joint ${A}/${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
    const f = run(r, res.paths);
    console.log(`${''.padEnd(16)} run ${A}/${label}: sim ${f.sim.toFixed(4)} below ${f.below.toFixed(2)} tier-below ${f.tierYrs.toFixed(2)} changes ${f.changes.toFixed(3)} estate ${Math.round(f.estate)} secs ${Math.round(f.secs)}`);
    const T = f.tr;
    writeFileSync(join(OUT, fileOf(id, arm, label)), gzipSync(JSON.stringify({ id, arm: `${A}/${label}`, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: f.sim,
      survived: b64(f.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    console.log(`${''.padEnd(16)} done ${A}/${label}`);
  });
} else if (mode === 'diagP') {
  /*
   * P: THE SWITCH CHARGED IN BOTH PASSES (PLAN.md P; predictions/diag-p.md; the deep review after 7ae, deep-review-log.md
   * 28 Sep 22:52 UK, which proposed it; the deep reviews of 29 Sep 08:56 UK (the openings read) and 11:30 UK (the redesign:
   * equal openings, the decision log, O50 by survival and the whole score across all worlds, the world-aware 2x2, share 0.95
   * at three grids); the maintainer's go-ahead, 29 Sep 07:49 UK). TS+J (7aa's unit: the product's settings, 'auto' risk
   * above, lambda held, the tier state and one move for every world, the estate weight passed) solved with switchMargin 0
   * and the switch charged 0.001 in the score (solve.js switchCharge: in the backward pass's h, so the stored values carry
   * every later switch's charge, and in the forward chooser at the true state). Setting P is that; settings 0 and 1e-3 are
   * 7ae's two solves (switchMargin 0; the product's margin 0.001) solved again, to be identity-checked against 7ae's lines,
   * 7ae's node traces on the first 8,000 node paths and 7aa's all-world traces - so every arm runs on the same paths. Jobs:
   *   core - one job a unit and setting, 7ae's three units at 30x5 (bridge 4 reader W0, S194 off W0.02, S126 reader W0):
   *          the gap, moves, price and world lines (7ae's); at world 0's node on the first WN paths four rules forward, each
   *          with 7ae's decision log (years 1 to 10, the paths holding the plan's tiers) and its trace kept - TS+J (the
   *          setting's chooser), OPEN0 (the year-0 move held in the plan's tiers), OPEN2 (the year-0 move forced to the
   *          de-risked pair 2/2, the best such move), and WA (the world-aware chooser: every move scored on world 0's table
   *          alone, the tables unchanged); and TS+J across all worlds on the first NA paths (the paths' own shifts), traced;
   *   grid - bridge 4, S194 and share 0.95 (the bundle's unit) at 30x15 and 60x5, P: the gap, moves, price and world lines;
   *   open - the 25 households of 7e's panel read by 7af (sixteen) and 7ag (nine), the bundle's unit (READER/TS+J/W0.02) at
   *          P: the gap, moves and price lines (the openings read that feeds the maintainer's Q decision, and shows where P
   *          moves the bundle's opening on every household the recommendation covers).
   *   node research/solver/audit-s126.mjs diagP [points] [paths] part k/n [seed=7002] [node paths=16000] [all-world paths=8000]
   * The preflight: DIAGP_GRID=4 runs every job at 4 wealth points, the return points as named. Traces go to results/diagP
   * (DIAGP_OUT when set), stamped. Jobs in the order core, grid, open (the longest first); part k/n runs index i % n === k.
   */
  const CORE = [['bridge 4', 'reader', 0], ['S194', 'off', 0.02], ['S126', 'reader', 0]];
  const GRIDS = [['bridge 4', 'reader', 0, 30, 15], ['S194', 'off', 0.02, 30, 15], ['share 0.95', 'reader', 0.02, 30, 15], ['bridge 4', 'reader', 0, 60, 5], ['S194', 'off', 0.02, 60, 5], ['share 0.95', 'reader', 0.02, 60, 5]];
  const OPENS = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
    'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
  const JOBSP = [...['P', '0', '1e-3'].flatMap(m => CORE.map(([id, arm, w]) => [`core:${m}`, id, arm, w, 30, 5])), ...GRIDS.map(([id, arm, w, p, q]) => ['grid', id, arm, w, p, q]), ...OPENS.map(id => ['open', id, 'reader', 0.02, 30, 5])];
  const CHARGE = 0.001, YEARS = 10, DERISK = { pen: 2, isa: 2 };
  const SETTINGS = { P: { switchMargin: 0, switchCharge: CHARGE }, 0: { switchMargin: 0 }, '1e-3': {} }, MARGIN = { P: 0, 0: 0, '1e-3': 0.001 };
  const RULESP = ['TS+J', 'OPEN0', 'OPEN2', 'WA'];
  const ARM = { off: false, reader: 'reader' };
  const known = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]), ['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[7] ? Number(process.argv[7]) : 7002, WN = process.argv[8] ? Number(process.argv[8]) : 16000, NA = process.argv[9] ? Number(process.argv[9]) : 8000;
  if (!(SEED >= 1) || !(WN >= 1) || WN > NP || !(NA >= 1) || NA > NP) { console.error(`audit-s126: bad seed, node or all-world paths ${process.argv[7]} ${process.argv[8]} ${process.argv[9]} (each at most the paths, ${NP})`); process.exit(2); }
  const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-s126: bad part ${part}`); process.exit(2); }
  const SMALL = process.env.DIAGP_GRID ? Number(process.env.DIAGP_GRID.split('x')[0]) : null;
  const OUT = process.env.DIAGP_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagP');
  mkdirSync(OUT, { recursive: true });
  console.log(`P, THE SWITCH CHARGED IN BOTH PASSES (switchCharge ${CHARGE}, switchMargin 0), the product's settings (solvePlan) but the estate weight, ${NP} paths (seed ${SEED}), ${WN} at the bad node, ${NA} across all worlds: ${JOBSP.length} jobs (9 core at 30x5, P and 7ae's two settings again; 6 grid; 25 openings); part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  // the world-aware chooser: every move scored on world 0's table alone (weight 1 there, 0 elsewhere; a move failing in any
  // table still fails), the tables, the margin and the charge unchanged
  const worldAware = (r, f) => { const keep = r.mix.weights; r.mix.weights = keep.map((_, k) => (k === 0 ? 1 : 0)); try { return f(); } finally { r.mix.weights = keep; } };
  // OPEN2's year-0 move: the best move whose tiers are the de-risked pair (scored as if that pair were held, so no charge
  // or margin separates the pair's own moves)
  const toDerisk = (r, st, held) => chooseAt(r, st, 0, { ...held, pen: DERISK.pen, isa: DERISK.isa }, Infinity);
  const opening = (r, zs) => { let s0 = null, h0 = null; runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } }); return { s0, h0 }; };
  // the gap: the least margin, on top of any charge, at which the chooser keeps the held tiers ('0' where it keeps them at 0)
  const openGap = (r, s0, h0) => {
    const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
    const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
    let gap;
    if (stays(0)) gap = '0';
    else if (!stays(1)) gap = '>1';
    else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
    return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
  };
  // the mixture's uncharged price: its best move's score less its best staying move's (x100); with the charge, the gap is
  // this less the charge where that is above 0
  const priceOf = (tabs, weights, s0, h0, acts) => {
    const n = acts.length, SC = new Float64Array(n), S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
    tabs.forEach((tab, k) => { scoreMoves(tab, s0, 0, S2, T2, B2, h0); for (let ai = 0; ai < n; ai++) SC[ai] = S2[ai] === -Infinity || SC[ai] === -Infinity ? -Infinity : SC[ai] + weights[k] * S2[ai]; });
    let best = -Infinity, stay = -Infinity;
    for (let ai = 0; ai < n; ai++) { if (SC[ai] > best) best = SC[ai]; if (acts[ai].tierPen === h0.pen && acts[ai].tierIsa === h0.isa && SC[ai] > stay) stay = SC[ai]; }
    return { price: 100 * (best - stay) };
  };
  const likeForLike = (tab, s0, h0, aB, aS, n) => {
    const S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n), V2 = new Float64Array(n);
    scoreMoves(tab, s0, 0, S2, T2, B2, h0, null, V2);
    return { whole: 100 * (S2[aB] - S2[aS]), surv: 100 * (V2[aB] - V2[aS]) };
  };
  const moves = (r, s0, h0) => { const bi = chooseAt(r, s0, 0, h0, 0), si = chooseAt(r, s0, 0, h0, Infinity), ci = chooseAction(r, s0, 0, h0), a = r.c.acts; return { bi, si, ci, txt: `best ${bi} ${a[bi].tierPen}/${a[bi].tierIsa} stay ${si} ${a[si].tierPen}/${a[si].tierIsa} chosen ${ci} ${a[ci].tierPen}/${a[ci].tierIsa} held ${h0.pen}/${h0.isa}` }; };
  // a forward run at the node with 7ae's decision log: `plan` the plan's tiers; a year's log counts the paths holding them at
  // its start - the forward move leaving, the nearest cell's stored move for that held layer leaving, both ways of
  // disagreeing, and the margin alone holding (the best move at margin 0 leaves, the chosen one stays)
  const run = (r, paths, rule, plan) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1), acts = r.c.acts, tab = r.mix.tables[0];
    const layerOf = new Map(); acts.forEach((a, ai) => { const key = `${a.tierPen || 0}/${a.tierIsa || 0}`; if (!layerOf.has(key)) layerOf.set(key, tab.tsLayerOf[ai]); });
    const log = Array.from({ length: YEARS + 1 }, () => ({ held: 0, fwdLeave: 0, cellLeave: 0, fwdHoldCellLeave: 0, fwdLeaveCellHold: 0, marginHold: 0 }));
    let ok = 0, held0 = 0;
    const leaves = (ai, held) => acts[ai].tierPen !== held.pen || acts[ai].tierIsa !== held.isa;
    const pick = (t, st, held) => (rule === 'WA' ? worldAware(r, () => chooseAction(r, st, t, held)) : chooseAction(r, st, t, held));
    const choose = (t, st, held) => {
      const ai = t === 0 && rule === 'OPEN0' ? chooseAt(r, st, 0, held, Infinity) : t === 0 && rule === 'OPEN2' ? toDerisk(r, st, held) : pick(t, st, held);
      if (t === 0 && held && !leaves(ai, held)) held0++;
      if (t >= 1 && t <= YEARS && held && held.pen === plan.pen && held.isa === plan.isa) {
        const L = log[t], j = layerOf.get(`${held.pen}/${held.isa}`), cell = tab.tsLayers[j].pol[Math.min(t, T)][nearestIndex(r.g, st)];
        const f = leaves(ai, held), c = leaves(cell, held);
        L.held++; if (f) L.fwdLeave++; if (c) L.cellLeave++; if (!f && c) L.fwdHoldCellLeave++; if (f && !c) L.fwdLeaveCellHold++;
        if (!f && r.switchMargin > 0 && leaves(chooseAt(r, st, t, held, 0), held)) L.marginHold++;
      }
      return ai;
    };
    paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, { trace: tr, choose }); if (o.survived) { ok++; okArr[k] = 1; } });
    return { sim: 100 * ok / N, held0, okArr, tr, log, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, m, rule, w, where) => `${id.replace(/ /g, '_')}-${arm}-m${m.toLowerCase()}-${rule.toLowerCase().replace(/\+/g, '_')}-${where}@w${w}.json.gz`;
  const save = (id, A, arm, m, rule, w, where, z, f, n) => writeFileSync(join(OUT, fileOf(id, arm, m, rule, w, where)), gzipSync(JSON.stringify({ id, arm: `${A}/${rule}/M${m}/W${w}/${where}`, stamp: STAMP, N: n, Y: f.tr.Y, seed: SEED, node: z, sim: f.sim,
    survived: b64(f.okArr), level: b64(f.tr.level), tier: b64(f.tr.tier), wealth: b64(f.tr.wealth), taxPaid: b64(f.tr.taxPaid), failYear: b64(f.tr.failYear) })));
  JOBSP.forEach(([kind, id, arm, w, pts0, quad], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase(), pts = SMALL || pts0, grid = `${pts0}x${quad}`;
    console.log(`${id.padEnd(16)} case | job ${kind} ${A}/${grid}/W${w} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${pts} quad ${quad}`);
    for (const m of kind.startsWith('core:') ? [kind.slice(5)] : ['P']) {
      const L = `${A}/TS+J/M${m}/${grid}/W${w}`, S = SETTINGS[m];
      const res = measureV2(h, ARM[arm], quad, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w, points: pts, tierState: true, joint: true, ...S });
      const r = res.r;
      if (!r.meta.tierState || !r.meta.jointWorlds) { console.error(`audit-s126: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
      if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-s126: ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
      if (r.switchMargin !== MARGIN[m] || (r.switchCharge || 0) !== (S.switchCharge || 0) || (r.meta.switchCharge || 0) !== (S.switchCharge || 0)) { console.error(`audit-s126: ${L} ran switch margin ${r.switchMargin} charge ${r.switchCharge} (meta ${r.meta.switchCharge})`); process.exit(2); }
      const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
      console.log(`${''.padEnd(16)} solve ${L}: table ${res.table.toFixed(4)} secs ${Math.round(res.secs)}`);
      console.log(`${''.padEnd(16)} ran ${L}: ${res.ran}`);
      const { s0, h0 } = opening(r, res.paths[0]), acts = r.c.acts, n = acts.length;
      { const g = openGap(r, s0, h0); console.log(`${''.padEnd(16)} gap ${L}: ${g.gap} opening ${g.open}`); }
      console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge || 0} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
      const mv = moves(r, s0, h0);
      console.log(`${''.padEnd(16)} moves ${L}: ${mv.txt}`);
      const p = priceOf(r.mix.tables, r.mix.weights, s0, h0, acts);
      const lfl = r.mix.tables.map(tab => likeForLike(tab, s0, h0, mv.bi, mv.si, n));
      const sumW = lfl.reduce((t, x, k) => t + r.mix.weights[k] * x.whole, 0), sumS = lfl.reduce((t, x, k) => t + r.mix.weights[k] * x.surv, 0);
      console.log(`${''.padEnd(16)} price ${L}: mixture ${p.price.toExponential(6)} like-for-like whole ${sumW.toExponential(6)} survival ${sumS.toExponential(6)}`);
      r.mix.nodes.forEach((z, k) => console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(4)} weight ${r.mix.weights[k].toFixed(4)}: whole ${lfl[k].whole.toFixed(6)} survival ${lfl[k].surv.toFixed(6)}`));
      if (!kind.startsWith('core:')) continue;
      const z = r.mix.nodes[0];
      const npaths = res.paths.slice(0, WN).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
      const F = Object.fromEntries(RULESP.map(rule => [rule, run(r, npaths, rule, h0)]));
      console.log(`${''.padEnd(16)} node ${L} 0 z ${z.toFixed(4)}: ${RULESP.map(rule => `${rule} ${F[rule].sim.toFixed(4)} held0 ${F[rule].held0}`).join(' ')} paths ${npaths.length} secs ${Math.round(RULESP.reduce((t, rule) => t + F[rule].secs, 0))}`);
      for (const rule of RULESP) {
        for (let t = 1; t <= YEARS; t++) { const g = F[rule].log[t]; console.log(`${''.padEnd(16)} log ${L} ${rule} year ${t}: held ${g.held} fwdLeave ${g.fwdLeave} cellLeave ${g.cellLeave} fwdHoldCellLeave ${g.fwdHoldCellLeave} fwdLeaveCellHold ${g.fwdLeaveCellHold} marginHold ${g.marginHold}`); }
        save(id, A, arm, m, rule, w, 'world0', z, F[rule], npaths.length);
      }
      // TS+J across all worlds: the paths' own long-run shifts
      const apaths = res.paths.slice(0, NA), a = run(r, apaths, 'TS+J', h0);
      console.log(`${''.padEnd(16)} all ${L}: TS+J ${a.sim.toFixed(4)} held0 ${a.held0} paths ${apaths.length} secs ${Math.round(a.secs)}`);
      save(id, A, arm, m, 'TS+J', w, 'all', null, a, apaths.length);
    }
    console.log(`${''.padEnd(16)} done ${kind} ${A}/${grid}/W${w}`);
  });
} else if (mode === 'time') {
  /*
   * 7k: THE EXACT FINAL YEAR'S RUN TIME (PLAN.md 7k; a measurement, not a test). Times the solve only (solvePlan, no
   * forward run), with and without `finalIntegral`, on each named household, at the settings the trace mode uses (F1
   * off, the tier above allowed, lambda held), alternating which goes first run to run so drift in the machine's load
   * falls on both. Prints every solve's seconds, the load average before and after, and per household the ratio of the
   * median times (with / without).
   *   node research/solver/audit-s126.mjs time [points=16] [runs=2] [ids=S126,S194,S330]
   */
  const RUNS = Number(NUMS[1] || 2);
  const ids = (process.argv[5] || 'S126,S194,S330').split(',');
  console.log(`FINAL-YEAR TIMING, ${POINTS} points, ${RUNS} runs each way, alternated; households ${ids.join(', ')}; load before ${loadavg().map(x => x.toFixed(2)).join(' ')}`);
  const times = {};
  for (const id of ids) {
    const h = all.find(s => s.id === id);
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
    times[id] = { off: [], on: [] };
    for (let r = 0; r < RUNS; r++) {
      for (const fi of (r % 2 === 0 ? [false, true] : [true, false])) {
        const t0 = process.hrtime.bigint();
        const res = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, riskAbove: true, finalIntegral: fi });
        const secs = Number(process.hrtime.bigint() - t0) / 1e9;
        if ((res.meta.finalIntegral === true) !== fi) { console.error(`audit-s126: ${id} asked finalIntegral ${fi}, the solve ran ${res.meta.finalIntegral}`); process.exit(2); }
        times[id][fi ? 'on' : 'off'].push(secs);
        console.log(`  ${id} run ${r + 1} final year ${fi ? 'exact   ' : 'averaged'}: ${secs.toFixed(1)} s (load ${loadavg()[0].toFixed(2)})`);
      }
    }
  }
  const med = xs => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  console.log(`load after ${loadavg().map(x => x.toFixed(2)).join(' ')}`);
  for (const id of ids) console.log(`${id}: median ${med(times[id].off).toFixed(1)} s averaged, ${med(times[id].on).toFixed(1)} s exact -> ratio ${(med(times[id].on) / med(times[id].off)).toFixed(3)}`);
} else if (mode === 'readertime') {
  /*
   * THE BRIDGE READER'S RUN TIME (drafts/reader-design.md check 6; a measurement, not a test): the solve alone
   * (solvePlan, no forward run) with the reader against with no bridge read, on S126, bridge 6 and S366 as the f1v2 and
   * quad modes build them, at the settings 7e's arms hold (F1 off or the reader, the tier above allowed, lambda held,
   * the final year exact), alternating which goes first run to run. Prints every solve's seconds, the load average
   * before and after, and per case the ratio of the median times (reader / off), beside 7e's 20% bar.
   *   node research/solver/audit-s126.mjs readertime [points=16] [runs=2]
   */
  const RUNS = Number(NUMS[1] || 2);
  const cases = [['S126', () => variant('S126', {})], ['bridge 6', () => variant('bridge 6', { bridge: 6 })], ['S366', () => all.find(s => s.id === 'S366')]];
  console.log(`READER TIMING, ${POINTS} points, ${RUNS} runs each way, alternated; cases ${cases.map(c => c[0]).join(', ')}; load before ${loadavg().map(x => x.toFixed(2)).join(' ')}`);
  const times = {};
  for (const [id, build] of cases) {
    const h = build();
    const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
    times[id] = { off: [], on: [] };
    for (let r = 0; r < RUNS; r++) {
      for (const on of (r % 2 === 0 ? [false, true] : [true, false])) {
        const t0 = process.hrtime.bigint();
        const res = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: on ? 'reader' : false, riskAbove: true, finalIntegral: true });
        const secs = Number(process.hrtime.bigint() - t0) / 1e9;
        if ((res.meta.bridgeRead === 'reader') !== on || res.meta.finalIntegral !== true) { console.error(`audit-s126: ${id} asked reader ${on}, the solve ran ${res.meta.bridgeRead} (final year ${res.meta.finalIntegral})`); process.exit(2); }
        times[id][on ? 'on' : 'off'].push(secs);
        console.log(`  ${id} run ${r + 1} ${on ? 'reader' : 'off   '}: ${secs.toFixed(1)} s (load ${loadavg()[0].toFixed(2)})${on ? `, ${res.meta.reader.tables} reader tables, ${res.meta.reader.unsupported} unsupported nodes` : ''}`);
      }
    }
  }
  const med = xs => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  console.log(`load after ${loadavg().map(x => x.toFixed(2)).join(' ')}`);
  for (const id of Object.keys(times)) console.log(`${id}: median ${med(times[id].off).toFixed(1)} s off, ${med(times[id].on).toFixed(1)} s with the reader -> ratio ${(med(times[id].on) / med(times[id].off)).toFixed(3)}`);
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
