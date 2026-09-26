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
import { swapChooser } from './swap.mjs';
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
  // the audit hash covers this script and swap.mjs, which picks every move of diag7r's swap arms (the sixty-seventh review, MINOR 3)
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'swap.mjs'))).digest('hex').slice(0, 12), cid = codeId();
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
function measureV2(h, bridgeRead, quad = 5, { finalIntegral, riskAbove, trace, seed = 7002, joint } = {}) {
  const f = facts(h.plan);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  // riskAbove and finalIntegral are passed only when a mode names them (the trace mode, which names finalIntegral true or
  // false in every arm); unset, the product's defaults hold (the final year exact by default since the maintainer's decision, 25 Sep 09:36 UK).
  // Every mode's ran line records the final year it ran (until 25 Sep only the trace mode's did, after bridgeRead), so a
  // re-run of an older mode (7c's f1v2, 7i's quad), now exact by default, cannot pass a ran-line gate against files that
  // ran it averaged. It sits BEFORE bridgeRead: smoke.sh's f1v2 check (locked) reads bridgeRead at the end of the line.
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: bridgeRead || false, quadNodes: quad === 5 ? undefined : quad,
    ...(finalIntegral !== undefined ? { finalIntegral: !!finalIntegral } : {}), ...(riskAbove !== undefined ? { riskAbove } : {}), ...(joint ? { jointWorlds: true } : {}) });   // F1 off is explicit, whatever the product default
  const m = r.m, s0 = M.initialState(m);
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  let ok = 0, below = 0, tierYrs = 0; const paths = E.pathsForSeed(seed, NP, m.ctx.totalYears);
  const okArr = new Uint8Array(NP);
  const tr = trace ? makeTrace(NP, m.ctx.totalYears + 1) : null;
  paths.forEach((zs, i) => { if (tr) tr.row = i; const o = runPolicy(r, zs, tr ? { trace: tr } : {}); if (o.survived) { ok++; okArr[i] = 1; } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; });
  const sim = 100 * ok / NP;
  // what the solve actually ran with, printed so the fair-test table can be checked against the log
  // the held paths' seed and count sit after pts (added 25 Sep for 7e, which runs on held-out paths; smoke.sh's greps read around them)
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${seed} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead}`;
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
   * per arm, one pairs line over all eight runs, and a "world" line per arm and world; writes each of the eight runs' traces
   * to results/diag7t/<case>-<run>.json.gz (DIAG7T_OUT when set), stamped as the log is.
   */
  const PANEL = [['S126', 'off,reader'], ['bridge 4', 'off,reader'], ['S360', 'off,reader'], ['share 0.95', 'off,reader'], ['S194', 'off']];
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
  const forward = (r, paths, trace) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = trace ? makeTrace(N, T + 1) : null;
    let ok = 0, below = 0, tierYrs = 0, estate = 0;
    const cap = r.meta.bequestCap;
    paths.forEach((zs, i) => { if (tr) tr.row = i; const o = runPolicy(r, zs, tr ? { trace: tr } : {}); if (o.survived) { ok++; okArr[i] = 1; estate += Math.min(o.terminalNet, cap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; });
    return { sim: 100 * ok / N, below: below / N, tierYrs: tierYrs / N, estate: estate / N, okArr, tr, secs: (Date.now() - t0) / 1000 };
  };
  PANEL.forEach(([id, armList], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-s126: no case ${id}`); process.exit(2); }
    const arms = armList.split(',').flatMap(a => [{ name: a, joint: false }, { name: a, joint: true }]);
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
    const main = runs.filter(x => x.res), mzero = runs.filter(x => x.m0), base = main[0];
    const cell = (x, j) => {
      let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!base.okArr[k] && x.okArr[k]) up++; else if (base.okArr[k] && !x.okArr[k]) dn++; }
      const r = x.res;
      return `${x.label} table ${f1(r.table).padStart(5)} sim ${f1(r.sim).padStart(5)} gap ${f1(r.gap).padStart(6)} tier-below ${f1(r.tierYrs).padStart(4)} below ${f1(r.below).padStart(4)} ${Math.round(r.secs)} s${j === 0 ? '' : ` d ${r.sim - base.sim >= 0 ? '+' : ''}${f1(r.sim - base.sim)} se ${f1(100 * Math.sqrt(up + dn) / NP)} (${up}/${dn})`}`;
    };
    console.log(`${id.padEnd(16)} a0 ${f1(base.res.a0, 2)} B ${base.res.B} class ${base.res.inClass ? 'YES' : 'no '} | ${main.map(cell).join(' | ')}`);
    console.log(`${''.padEnd(16)} margin0 | ${mzero.map(x => `${x.label} sim ${f1(x.m0.sim).padStart(5)} tier-below ${f1(x.m0.tierYrs).padStart(4)} below ${f1(x.m0.below).padStart(4)} ${Math.round(x.m0.secs)} s`).join(' | ')}`);
    main.forEach(x => console.log(`${''.padEnd(16)} ran ${x.label}: ${x.res.ran}`));
    main.forEach(x => console.log(`${''.padEnd(16)} joint ${x.label}: ${!!x.res.r.meta.jointWorlds} switchMargin ${x.res.r.switchMargin} scale ${Math.round(Math.max(1, x.res.r.m.ctx.accounts.reduce((t, a) => t + a.balance, 0)))} cap ${Math.round(x.res.r.meta.bequestCap)} deathTax ${x.res.r.m.ctx.pensionDeathTaxRate}`));
    const pairs = [];
    for (let j = 1; j < runs.length; j++) for (let q = 0; q < j; q++) { let up = 0, dn = 0; for (let k = 0; k < NP; k++) { if (!runs[q].okArr[k] && runs[j].okArr[k]) up++; else if (runs[q].okArr[k] && !runs[j].okArr[k]) dn++; } pairs.push(`${runs[j].label}-${runs[q].label} ${up}/${dn}`); }
    console.log(`${''.padEnd(16)} pairs ${pairs.join(' ')}`);
    lines.forEach(l => console.log(l));
    runs.forEach(x => {
      const T = x.tr;
      writeFileSync(join(OUT, `${id.replace(/ /g, '_')}-${x.file}.json.gz`), gzipSync(JSON.stringify({ id, arm: x.label, stamp: STAMP, N: NP, Y: T.Y, seed: SEED, sim: x.sim,
        survived: b64(x.okArr), level: b64(T.level), tier: b64(T.tier), wealth: b64(T.wealth), taxPaid: b64(T.taxPaid), failYear: b64(T.failYear) })));
    });
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
