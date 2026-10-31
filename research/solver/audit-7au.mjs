/*
 * 7AU: THE LEARNER AT P'S SETTINGS (PLAN.md 7au; predictions/diag-7au.md; the deep review after 7as, deep-review-log.md 4 Oct
 * 01:54 UK: family 2a's root-cause step; the maintainer's go-ahead of 4 Oct, the 08:17 row: before 7u). 7as found S194's
 * bad-world slice the world-blind chooser's (item 3 HELD): at world 0's node the de-risked opening (OPEN2) re-risks where the
 * world-aware chooser (WA: every move scored on world 0's table alone) does not. Can a chooser a household could follow - one
 * that learns the world from its own returns (learn.mjs: the world weights the posterior given the returns realised on ONE
 * risky pot a year) - recover that slice in time? P's three units at P's settings (switchCharge 0.001, switchMargin 0, TS+J,
 * 30x5), each solved once (its solve, ran, gap, joint, moves, price and world lines held by reduce-7au.mjs to P's core:P lines):
 *   node:L (S194 alone): at world 0's node on the first WN of P's paths, OPEN2+L (year 0 forced to the de-risked pair 2/2 as
 *     OPEN2, then the learner's weights every year) and OPEN2+O (the same with the oracle's weights: all on world 0, learn.mjs
 *     oracleWeights - the learner's bound with OPEN2's opening); and OPEN2 and WA again on the first IN paths, so the reducer
 *     can hold today's code to P's traces of them before pairing the learner with P's OPEN2 and WA on all WN paths;
 *   all:L (bridge 4, S194, S126): across all worlds on the first NA of P's paths, TS+J+L (the learner from year 0) and TS+J+O
 *     (the oracle from year 0: weights from the path's true long-run shift); and TS+J again on the first IN paths (held to P's).
 * Every run is traced (the per-path long-run shift saved beside it, for the reading by shift bin) and prints its mean end
 * weights. The learner's information is learn.mjs's design premise (its header): one risky pot a year.
 *   node research/solver/audit-7au.mjs [points=30] [paths=16000] part k/n [seed=7002] [node paths=16000] [all-world paths=16000] [identity paths=2000]
 * The preflight: DIAG7AU_GRID=4 runs every job at 4 wealth points; traces go to results/diag7au (DIAG7AU_OUT when set).
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves, nearestIndex } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';
import { signalPot, update, posterior, oracleWeights } from './learn.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'learn.mjs'))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
if (process.argv[2] === '--jobs') { console.log(4); process.exit(0); }
const NUMS = process.argv.slice(2);
const POINTS = Number(NUMS[0] || 30), NP = Number(NUMS[1] || 16000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-7au: bad grid size or path count (${NUMS.slice(0, 2).join(', ')})`); process.exit(2); }
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

const F1_VARIANTS = [['S126', {}], ['share 0.50', { a0: 0.5 }], ['share 0.70', { a0: 0.7 }], ['share 0.78', { a0: 0.78 }], ['share 0.90', { a0: 0.9 }], ['share 0.95', { a0: 0.95 }],
  ['bridge 0', { bridge: 0 }], ['bridge 1', { bridge: 1 }], ['bridge 4', { bridge: 4 }], ['bridge 6', { bridge: 6 }], ['wealth x0.5', { scale: 0.5 }], ['wealth x2', { scale: 2 }]];
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


{
  const CORE = [['bridge 4', 'reader', 0], ['S194', 'off', 0.02], ['S126', 'reader', 0]];
  const JOBSU = [['node:L', 'S194', 'off', 0.02, 30, 5], ...CORE.map(([id, arm, w]) => ['all:L', id, arm, w, 30, 5])];
  const YEARS = 10, DERISK = { pen: 2, isa: 2 }, S = { switchMargin: 0, switchCharge: 0.001 };
  const NODE_RULES = ['OPEN2+L', 'OPEN2+O'], NODE_IDENT = ['OPEN2', 'WA'], ALL_RULES = ['TS+J+L', 'TS+J+O'], ALL_IDENT = ['TS+J'];
  const ARM = { off: false, reader: 'reader' };
  const known = F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]);
  const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1] : () => all.find(s => s.id === id); };
  const SEED = process.argv[6] ? Number(process.argv[6]) : 7002, WN = process.argv[7] ? Number(process.argv[7]) : 16000, NA = process.argv[8] ? Number(process.argv[8]) : 16000, IN = process.argv[9] ? Number(process.argv[9]) : 2000;
  if (!(SEED >= 1) || !(WN >= 1) || WN > NP || !(NA >= 1) || NA > NP || !(IN >= 1) || IN > Math.min(WN, NA)) { console.error(`audit-7au: bad seed, node, all-world or identity paths ${process.argv.slice(6, 10).join(' ')} (each at most the paths, ${NP}; identity at most both)`); process.exit(2); }
  const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
  const [pk, pn] = part.split('/').map(Number);
  if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7au: bad part ${part}`); process.exit(2); }
  const SMALL = process.env.DIAG7AU_GRID ? Number(process.env.DIAG7AU_GRID.split('x')[0]) : null;
  const OUT = process.env.DIAG7AU_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7au');
  mkdirSync(OUT, { recursive: true });
  console.log(`7AU, THE LEARNER AT P'S SETTINGS (switchCharge 0.001, switchMargin 0, TS+J): the product's settings (solvePlan) but the estate weight, ${NP} paths (seed ${SEED}), ${WN} at S194's bad node (OPEN2+L, OPEN2+O; OPEN2 and WA on ${IN}), ${NA} across all worlds (TS+J+L, TS+J+O; TS+J on ${IN}): ${JOBSU.length} jobs; part ${pk}/${pn}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
  const withWeights = (r, w, f) => { const keep = r.mix.weights; r.mix.weights = w; try { return f(); } finally { r.mix.weights = keep; } };
  const worldAware = (r, f) => withWeights(r, r.mix.weights.map((_, k) => (k === 0 ? 1 : 0)), f);
  const toDerisk = (r, st, held) => chooseAt(r, st, 0, { ...held, pen: DERISK.pen, isa: DERISK.isa }, Infinity);
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
  // THE WEIGHTS A PATH'S CHOOSER USES: 'L' learn.mjs's learner (one risky pot a year: year t's move sees the returns of
  // years 0..t-1 on the moves held through them), 'O' the oracle's (from the path's true long-run shift), else the prior
  const weigher = (r, zs, kind) => {
    const T = r.m.ctx.totalYears, nodes = r.mix.nodes, prior = r.mix.weights.slice();
    if (zs.length <= T + 1) throw new Error('audit-7au: the path carries no long-run shift (a fold path)');
    const zPath = zs[T + 1];
    if (kind === 'O') { const w = oracleWeights(nodes, zPath); return { at: () => w, saw: () => {}, n: () => 0 }; }
    if (kind !== 'L') return { at: () => prior, saw: () => {}, n: () => 0 };
    const logL = nodes.map(() => 0); let k = 0;
    return { at: () => posterior(prior, logL), saw: (ai, t) => { const pot = signalPot(r.c.acts[ai], t); if (pot) { const [Sg, V] = pot; update(logL, nodes, Sg, V, Sg * zPath + V * zs[t]); k++; } }, n: () => k };
  };
  // a forward run with 7as's decision log (`plan` the plan's tiers). `rule`: OPEN2 (year 0 forced to the de-risked pair,
  // then the chooser), WA (every move on world 0's table alone), TS+J (the chooser), and +L / +O on OPEN2 or TS+J (the same
  // with the learner's or the oracle's weights every year; OPEN2's forced opening at the prior weights, as OPEN2's)
  const run = (r, paths, rule, plan) => {
    const t0 = Date.now(), N = paths.length, T = r.m.ctx.totalYears, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1), acts = r.c.acts, tab = r.mix.tables[0];
    const shift = new Float32Array(N), wEnd = r.mix.nodes.map(() => 0);
    const layerOf = new Map(); acts.forEach((a, ai) => { const key = `${a.tierPen || 0}/${a.tierIsa || 0}`; if (!layerOf.has(key)) layerOf.set(key, tab.tsLayerOf[ai]); });
    const log = Array.from({ length: YEARS + 1 }, () => ({ held: 0, fwdLeave: 0, cellLeave: 0, fwdHoldCellLeave: 0, fwdLeaveCellHold: 0, marginHold: 0 }));
    let ok = 0, held0 = 0, seen = 0;
    const base = rule.split('+')[0] === 'TS' ? 'TS+J' : rule.split('+')[0], kind = /\+L$/.test(rule) ? 'L' : /\+O$/.test(rule) ? 'O' : null;
    const leaves = (ai, held) => acts[ai].tierPen !== held.pen || acts[ai].tierIsa !== held.isa;
    paths.forEach((zs, k) => {
      tr.row = k; shift[k] = zs[T + 1];
      const wt = weigher(r, zs, kind);
      let prevAi = null, prevT = -1, lastW = r.mix.weights;
      const choose = (t, st, held) => {
        if (prevAi !== null && prevT === t - 1) wt.saw(prevAi, t - 1);
        let ai;
        if (t === 0 && base === 'OPEN2') ai = toDerisk(r, st, held);
        else if (base === 'WA') ai = worldAware(r, () => chooseAction(r, st, t, held));
        else if (kind) { lastW = wt.at(); ai = withWeights(r, lastW, () => chooseAction(r, st, t, held)); }
        else ai = chooseAction(r, st, t, held);
        if (t === 0 && held && !leaves(ai, held)) held0++;
        if (t >= 1 && t <= YEARS && held && held.pen === plan.pen && held.isa === plan.isa) {
          const L = log[t], j = layerOf.get(`${held.pen}/${held.isa}`), cell = tab.tsLayers[j].pol[Math.min(t, T)][nearestIndex(r.g, st)];
          const f = leaves(ai, held), c = leaves(cell, held);
          L.held++; if (f) L.fwdLeave++; if (c) L.cellLeave++; if (!f && c) L.fwdHoldCellLeave++; if (f && !c) L.fwdLeaveCellHold++;
        }
        prevAi = ai; prevT = t;
        return ai;
      };
      const o = runPolicy(r, zs, { trace: tr, choose });
      if (o.survived) { ok++; okArr[k] = 1; }
      lastW.forEach((w, i) => { wEnd[i] += w; }); seen += wt.n();
    });
    return { sim: 100 * ok / N, held0, okArr, tr, log, shift, wEnd: wEnd.map(w => w / N), seen: seen / N, secs: (Date.now() - t0) / 1000 };
  };
  const fileOf = (id, arm, rule, w, where) => `${id.replace(/ /g, '_')}-${arm}-mp-${rule.toLowerCase().replace(/\+/g, '_')}-${where}@w${w}.json.gz`;
  const save = (id, A, arm, rule, w, where, z, f, n) => writeFileSync(join(OUT, fileOf(id, arm, rule, w, where)), gzipSync(JSON.stringify({ id, arm: `${A}/${rule}/MP/W${w}/${where}`, stamp: STAMP, N: n, Y: f.tr.Y, seed: SEED, node: z, sim: f.sim,
    survived: b64(f.okArr), level: b64(f.tr.level), tier: b64(f.tr.tier), wealth: b64(f.tr.wealth), taxPaid: b64(f.tr.taxPaid), failYear: b64(f.tr.failYear), shift: b64(f.shift) })));
  const wtxt = f => `w-end ${f.wEnd.map(w => w.toFixed(4)).join(',')} updates ${f.seen.toFixed(2)}`;
  JOBSU.forEach(([kind, id, arm, w, pts0, quad], i) => {
    if (i % pn !== pk) return;
    const h = byId(id)();
    if (!h) { console.error(`audit-7au: no case ${id}`); process.exit(2); }
    const A = arm.toUpperCase(), pts = SMALL || pts0, grid = `${pts0}x${quad}`, L = `${A}/TS+J/MP/${grid}/W${w}`;
    console.log(`${id.padEnd(16)} case | job ${kind} ${A}/${grid}/W${w} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${pts} quad ${quad}`);
    const res = measureV2(h, ARM[arm], quad, { trace: false, seed: SEED, lambda: LAMBDA, forward: false, bequestWeight: w, points: pts, tierState: true, joint: true, ...S });
    const r = res.r;
    if (!r.meta.tierState || !r.meta.jointWorlds) { console.error(`audit-7au: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
    if (!(Math.abs(r.meta.bequestWeight - w) < 1e-12)) { console.error(`audit-7au: ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
    if (r.switchMargin !== 0 || (r.switchCharge || 0) !== 0.001 || (r.meta.switchCharge || 0) !== 0.001) { console.error(`audit-7au: ${L} ran switch margin ${r.switchMargin} charge ${r.switchCharge} (meta ${r.meta.switchCharge})`); process.exit(2); }
    if (!r.mix || r.mix.nodes.length !== 3) { console.error(`audit-7au: ${L} has no three-world mixture to learn between`); process.exit(2); }
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
    if (kind === 'node:L') {
      const z = r.mix.nodes[0];
      const npaths = res.paths.slice(0, WN).map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
      const F = Object.fromEntries(NODE_RULES.map(rule => [rule, run(r, npaths, rule, h0)]));
      const G = Object.fromEntries(NODE_IDENT.map(rule => [rule, run(r, npaths.slice(0, IN), rule, h0)]));
      console.log(`${''.padEnd(16)} node ${L} 0 z ${z.toFixed(4)}: ${NODE_RULES.map(rule => `${rule} ${F[rule].sim.toFixed(4)} held0 ${F[rule].held0}`).join(' ')} paths ${npaths.length} secs ${Math.round(NODE_RULES.reduce((t, rule) => t + F[rule].secs, 0))}`);
      console.log(`${''.padEnd(16)} ident ${L} 0 z ${z.toFixed(4)}: ${NODE_IDENT.map(rule => `${rule} ${G[rule].sim.toFixed(4)} held0 ${G[rule].held0}`).join(' ')} paths ${IN} secs ${Math.round(NODE_IDENT.reduce((t, rule) => t + G[rule].secs, 0))}`);
      for (const rule of NODE_RULES) {
        console.log(`${''.padEnd(16)} weights ${L} ${rule} world0: ${wtxt(F[rule])}`);
        for (let t = 1; t <= YEARS; t++) { const g = F[rule].log[t]; console.log(`${''.padEnd(16)} log ${L} ${rule} year ${t}: held ${g.held} fwdLeave ${g.fwdLeave} cellLeave ${g.cellLeave} fwdHoldCellLeave ${g.fwdHoldCellLeave} fwdLeaveCellHold ${g.fwdLeaveCellHold}`); }
        save(id, A, arm, rule, w, 'world0', z, F[rule], npaths.length);
      }
      for (const rule of NODE_IDENT) save(id, A, arm, rule, w, 'world0', z, G[rule], IN);
    } else {
      const apaths = res.paths.slice(0, NA);
      const F = Object.fromEntries(ALL_RULES.map(rule => [rule, run(r, apaths, rule, h0)]));
      const G = run(r, apaths.slice(0, IN), 'TS+J', h0);
      console.log(`${''.padEnd(16)} all ${L}: ${ALL_RULES.map(rule => `${rule} ${F[rule].sim.toFixed(4)} held0 ${F[rule].held0}`).join(' ')} paths ${apaths.length} secs ${Math.round(ALL_RULES.reduce((t, rule) => t + F[rule].secs, 0))}`);
      console.log(`${''.padEnd(16)} ident-all ${L}: TS+J ${G.sim.toFixed(4)} held0 ${G.held0} paths ${IN} secs ${Math.round(G.secs)}`);
      for (const rule of ALL_RULES) { console.log(`${''.padEnd(16)} weights ${L} ${rule} all: ${wtxt(F[rule])}`); save(id, A, arm, rule, w, 'all', null, F[rule], apaths.length); }
      save(id, A, arm, 'TS+J', w, 'all', null, G, IN);
    }
    console.log(`${''.padEnd(16)} done ${kind} ${A}/${grid}/W${w}`);
  });
}
