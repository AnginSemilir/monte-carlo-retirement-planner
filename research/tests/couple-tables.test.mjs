/*
 * PART D, D2.3 AND D2.4: A COUPLE'S TWO TABLES AT THE CANDIDATE'S SETTINGS (the launch plan's section 6, D2: "the candidate's features
 * on two tables ... the tier state per person, three steps below, HR, the table without the dealing cost, the failure year at
 * what it can pay, the floor (B2) on the household's spending ... the two tables solved side by side"). Each person's table is
 * solved as a single's is (src/solverApp.js solveForApp on their own plan, src/solver/couple.js singlePlanFor), and the
 * couples' rollout (couple.js chooseJoint) reads each person at the tier pair their move goes to and charges a switch as the
 * single's chooser charges it. Two library couples (S007, S105; never anybody's own plan) at the library sweep's light settings:
 *   1. each person's table is a single's at the candidate's settings: the tier state on four pairs (three steps below), HR in
 *      the menu, the table without the dealing cost, the failure year at what it can pay, the spending floor at 80% of their
 *      share of the target, the switch charge; the two tables' switch cost the same; the two people's minimum pots add up to
 *      the household's (where the plan sets none, the household's is the two tables' together);
 *   2. the two people's plans add back to the household's on every money amount (the class of the minimum pot's bug): on every
 *      library couple, and one made with spending bands and a one-off cost, every number in `spending` and `oneOffCosts` and
 *      the minimum pot add back within a pound, and the accounts, incomes and contributions fall to one person or the other
 *      whole (before D2.3 each person's table was asked to end with the household's whole minimum pot);
 *   3. the layer reads: a table's value at a tier layer (`value(s, t, layer)`) is that layer's own arrays read by grid.js, on
 *      every layer at the positions the rollout reaches, world views too, and with no layer the plan's own as before; the
 *      layers differ there; and the rollout's expectation of a joint move reads each person at their own move's layer
 *      (an oracle that grows the post-decision state at each person's tier and reads the layers by hand);
 *   4. the switch: each person's candidates are their own chooser's (chooseAction's pick is rankFor's first, with the tiers
 *      they hold, wherever the rollout stands); each joint move's score charges each person's switch charge when their move
 *      leaves their tiers held (an oracle from the expectation of check 3), the chosen move the best of all candidates; some
 *      decisions switch and some hold;
 *   5. the engine under the solved couple (couple.js withCouple: src/App.jsx stepYear reading the engine's state as the
 *      model's) and the rollout (runCouplePolicy), path by path: the same joint move every year (both moves, the split, the
 *      level, each person's tiers), the same end within a pound and the same survival;
 *   6. a single's tables are the code before D2.3's, bit for bit: S116 and S224 at the same light settings, their tables, their
 *      value reads where the engine stands and the engine's runs under them (digests taken on 08de944);
 * and D2.4, the bridge with the household's money (the archive's O11), on a planted O11 couple (made from S105: the second
 * person retired at 50, eight years from their pension with £40,000 they can reach; the first past access with a large ISA):
 *   7. in a bridge year the rollout reads the two people with their accessible money shared as best serves both: the money
 *      moved within its bounds (what the giver holds, the receiver's floor bills ahead), the read at it the best the search
 *      tried and never below the own-money read, above it by more than a point somewhere, short of a 41-point scan by at most
 *      a thousandth; each wrapper's household total, the pensions, the basis and the giver's gain share kept; after the bridge
 *      the expectation the own-money one bit for bit (checks 3 and 5 read the couples above, which have no bridge year, and the
 *      O11 couple's engine and rollout in step);
 *   8. O11's case: the year-0 read of both lasting, with the household's money, within 10 points of the household's survival
 *      simulated under the couple's policy (40 paths); on each person's own money more than 50 points below it (the misread);
 *      the two policies' survival paired and their spending levels beside it.
 * Plants (COUPLE_PLANT, couple.js COUPLE.plant), each the gap it names: 'fullfloor' (each person's plan with the household's
 * whole minimum pot, as before D2.3) fails checks 1 and 2; 'nohhfloor' (the household with no minimum pot where its plan sets
 * none, while each person's table sets one, as before D2.3) check 1; 'baselayer' (every move read at the plan's own tiers) checks 3
 * and 4 (the joint score's oracle reads the layers);
 * 'nocharge' (no switch charge in the rollout) check 4; 'noheld' (the engine's tiers read as the plan's own) check 5;
 * 'ownmoney' (each person's bridge read on their own money, as before D2.4) checks 7 and 8.
 *   node research/tests/couple-tables.test.mjs [--paths N]
 *   COUPLE_PLANT=nocharge node research/tests/couple-tables.test.mjs
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { readValues, locateVec, interp, vecOf } from '../../src/solver/grid.js';
import { foldedVol } from '../../src/solver/fast.js';
import { solveCouple, singlePlanFor, ownerState, chooseJoint, expectedValue, cutCostOf, rankFor, runCouplePolicy, couplePolicy, withCouple, ratesAt, bridgeAt, shareBounds, shareBridge, sharedState, COUPLE } from '../../src/solver/couple.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp, appPlan, prepareForSolve } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const args = process.argv.slice(2);
const pathsAt = args.indexOf('--paths');
const NP = pathsAt >= 0 && /^\d+$/.test(args[pathsAt + 1] || '') ? Number(args[pathsAt + 1]) : 6;
const PLANT = process.env.COUPLE_PLANT || '';
COUPLE.plant = PLANT;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const library = buildScenarios();
const couples = library.filter(s => s.plan.demographics.planningMode !== 'single');
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(a), Math.abs(b));
console.log(`couple-tables: two couples at the library sweep's light settings, ${NP} paths each${PLANT ? `; planted: ${PLANT}` : ''}`);

// the fixtures: the household's plan as the solver takes it (prepareForSolve, appPlan), each person's table by solveForApp
const t0 = Date.now();
const FIX = ['S007', 'S105'].map(id => {
  const plan = appPlan(E, prepareForSolve(E, couples.find(s => s.id === id).plan));
  const cp = solveCouple(E, M, plan, { solveOne: (p) => solveForApp(E, M, p, LIGHT) });
  return { id, plan, cp };
});
// D2.4's planted O11 case (the archive's O11: "one partner's bridge can be funded from the other's money"): a made couple, the
// second person retired at 50 with eight years to their pension, £40,000 they can reach and £600,000 they cannot; the first
// past access with a large ISA. Each person's own table reads the second person's bridge as unpaid
const O11 = (() => {
  const raw = JSON.parse(JSON.stringify(couples.find(s => s.id === 'S105').plan));
  Object.assign(raw.demographics, { currentAgeSelf: 62, retireAgeSelf: 60, currentAgePart: 50, retireAgePart: 50, privatePensionAge: 58, terminalAge: 96 });
  const bal = { pen_self: 500000, isa_self: 500000, other_self: 150000, cash_self: 50000, pen_part: 600000, isa_part: 20000, other_part: 10000, cash_part: 10000 };
  raw.accounts = raw.accounts.map(x => (x.id in bal ? { ...x, balance: bal[x.id] } : x));
  raw.spending.targetSpend = 50000;
  const plan = appPlan(E, prepareForSolve(E, raw));
  return { id: 'O11', plan, cp: solveCouple(E, M, plan, { solveOne: (p) => solveForApp(E, M, p, LIGHT) }) };
})();
console.log(`  solved in ${((Date.now() - t0) / 1000).toFixed(0)}s (with the planted O11 couple)`);
const withPlant = (k) => (PLANT ? `${PLANT},${k}` : k);

// ---- 1. each person's table at the candidate's settings ----
{
  const bad = [], seen = [];
  for (const { id, plan, cp } of FIX) {
    for (const who of ['self', 'part']) {
      const r = cp.tables[who], mt = r.meta, p = r.m.ctx.plan;
      const pairs = mt.tierState ? mt.tierState.split(',').length : 0;
      const hr = r.actions.some(a => a.steps.includes('penHR') || a.harvestCeil === 'hr');
      const floorShare = Math.abs(E.num(p.spending.floorSpend, 0) - Math.round(0.8 * E.num(p.spending.targetSpend, 0))) <= 1;
      const why = [];
      if (pairs !== 4 || mt.tiersBelow !== 3) why.push(`tier state ${mt.tierState}, ${mt.tiersBelow} below`);
      if (!hr) why.push('no HR in the menu');
      if (mt.tableDealing !== false) why.push('the dealing cost in the table');
      if (mt.failDelivered !== true) why.push('the failure year not at what it can pay');
      if (!floorShare || Math.min(...mt.spendLevels) !== 0.8) why.push(`floor ${p.spending.floorSpend} of ${p.spending.targetSpend}, levels ${mt.spendLevels}`);
      if (r.switchCharge !== 0.001) why.push(`switch charge ${r.switchCharge}`);
      if (why.length) bad.push(`${id} ${who}: ${why.join('; ')}`);
    }
    const fA = cp.tables.self.m.ctx.solvencyFloor, fB = cp.tables.part.m.ctx.solvencyFloor, fH = cp.m.ctx.solvencyFloor;
    if (Math.abs(fA + fB - fH) > 1) bad.push(`${id}: minimum pots ${fA} + ${fB} against the household's ${fH}`);
    if (cp.tables.self.c.switchCost !== cp.tables.part.c.switchCost || cp.switchCost !== cp.tables.self.c.switchCost) bad.push(`${id}: switch costs ${cp.tables.self.c.switchCost} / ${cp.tables.part.c.switchCost}`);
    seen.push(`${id} floors ${fA} + ${fB} = ${fH}, switch cost ${cp.switchCost}`);
  }
  ok(1, 'each person\'s table a single\'s at the candidate\'s settings (four tier pairs, HR, no dealing cost, the failure year at what it pays, the floor, the switch charge)', bad.length === 0,
    bad.length ? bad.slice(0, 4).join(' | ') : seen.join('; '));
}

// ---- 2. the two people's plans add back to the household's on every money amount ----
{
  const made = (() => {
    const p = JSON.parse(JSON.stringify(couples.find(s => s.id === 'S007').plan));
    p.spending.floorSpend = 33001;
    p.spending.spendBands = [{ fromAge: 75, toAge: 85, amount: 37001 }, { fromAge: 85, toAge: 99, amount: 31001 }];
    p.oneOffCosts = [{ id: 'c1', year: 2031, owner: 'Myself', amount: 12001, desc: 'made' }, { id: 'c2', year: 2035, owner: 'Partner', amount: 8001, desc: 'made' }];
    p.config.solvencyFloor = 150001;
    return { id: 'made', plan: p };
  })();
  const SKIP = /(^|\.)(year|date|fromAge|toAge|age|id)$/i;   // when, not how much
  const leaves = (x, pre = '', out = {}) => {
    if (Array.isArray(x)) x.forEach((v, i) => leaves(v, `${pre}[${i}]`, out));
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) leaves(v, pre ? `${pre}.${k}` : k, out);
    else if (typeof x === 'number' || (typeof x === 'string' && x !== '' && Number.isFinite(Number(x)) && /^-?[\d.]+$/.test(x))) { if (!SKIP.test(pre)) out[pre] = Number(x); }
    return out;
  };
  let amounts = 0, households = 0, floors = 0;
  const bad = [];
  for (const sc of [...couples, made]) {
    const H = sc.plan, A = singlePlanFor(H, 'self', 0.5), B = singlePlanFor(H, 'part', 0.5);
    const lh = leaves({ spending: H.spending, oneOffCosts: H.oneOffCosts, floor: H.config.solvencyFloor });
    const la = leaves({ spending: A.spending, oneOffCosts: A.oneOffCosts, floor: A.config.solvencyFloor });
    const lb = leaves({ spending: B.spending, oneOffCosts: B.oneOffCosts, floor: B.config.solvencyFloor });
    for (const [k, v] of Object.entries(lh)) {
      amounts++;
      if (!(Math.abs((la[k] || 0) + (lb[k] || 0) - v) <= 1)) bad.push(`${sc.id} ${k}: ${la[k]} + ${lb[k]} against ${v}`);
    }
    if (Number(H.config.solvencyFloor) > 0) floors++;
    // the accounts, incomes and contributions: each to one person whole
    for (const key of ['accounts', 'otherIncomes', 'oneOffContributions']) {
      const sum = (xs) => (xs || []).reduce((a, x) => a + E.num(x.balance !== undefined ? x.balance : x.amount, 0), 0);
      const n = (H[key] || []).length, na = (A[key] || []).length, nb = (B[key] || []).length;
      if (na + nb !== n || Math.abs(sum(A[key]) + sum(B[key]) - sum(H[key])) > 1e-6) bad.push(`${sc.id} ${key}: ${na} + ${nb} of ${n}`);
    }
    households++;
  }
  ok(2, 'the two people\'s plans add back to the household\'s on every money amount (spending, one-off costs, the minimum pot; accounts, incomes and contributions whole)', bad.length === 0,
    `${households} couples (one made), ${amounts} amounts, ${floors} with a minimum pot${bad.length ? `; ${bad.length} do not add back: ${bad.slice(0, 3).join(' | ')}` : ''}`);
}

// the oracles: a table's value read by hand from one layer's arrays (grid.js), as solve.js value() reads the plan's own
function valueAt(tab, layers, s, t, L) {
  const T = tab.m.ctx.totalYears, k = Math.min(t, T), A = L === null ? null : layers[L], g = tab.g;
  if (!A) return null;
  const shortfall = tab.meta.resilience === 'shortfall';
  if (g.cov) { const o = readValues(g, A.lsurv[k], A.beq[k], s, new Float64Array(4), A.lresil[k], null, k); return { survival: o[0], resilience: o[2], bequest: o[1] }; }
  const loc = locateVec(g, s);
  const sv = (g.bridge || g.reader) ? readValues(g, A.lsurv[k], A.beq[k], s, new Float64Array(4), null, null, k)[0] : interp(g, A.surv[k], loc, true);
  return { survival: sv, resilience: interp(g, A.resil[k], loc, !shortfall), bequest: interp(g, A.beq[k], loc, false) };
}
const RD = new Float64Array(4);
const cutAt = (tab, s, k, L) => { const A = tab.tsLayers[L]; readValues(tab.g, A.lsurv[k], A.beq[k], s, RD, A.lresil[k], A.short[k], k); return RD[3]; };
// the expectation of a post-decision state, each person read at their move's own layer (tsLayerOf), grown at their tiers held:
// over the mixture's shifts (each a table of its own, the market's held shift) and the tables' quadrature
const compsOf = (tab) => (tab.mix ? tab.mix.tables : [tab]);
function oracleExpect(cp, post, t, ia, ib) {
  const { m } = cp, A = cp.tables.self, B = cp.tables.part, T = m.ctx.totalYears, QZ = A.quadNodes, QW = A.quadWeights;
  const shifts = A.mix ? A.mix.nodes : [0], wJ = A.mix ? A.mix.weights : [1], cA = compsOf(A), cB = compsOf(B);
  let total = 0, both = 0;
  for (let j = 0; j < shifts.length; j++) for (let k = 0; k < QW.length; k++) {
    const rates = {};
    m.ctx.accounts.forEach(a0 => {
      const a = M.profileOf(m, post, a0);   // the growth at each person's tier held (D2.2's, checked by couple-lockstep)
      const vol = A.c.shiftMode ? a.vol : foldedVol(a.vol, a.sigmaParam, T - t + 1);
      rates[a0.id] = Math.exp(Math.log(1 + a.real) + (A.c.shiftMode ? a.sigmaParam * shifts[j] : 0) + vol * QZ[k]) - 1;
    });
    const g = M.cloneState(post); M.grow(m, g, t, rates);
    const TA = cA[j], TB = cB[j], LA = TA.tsLayerOf[ia], LB = TB.tsLayerOf[ib];
    const sA = vecOf(TA.m, ownerState(g, 'self')), sB = vecOf(TB.m, ownerState(g, 'part'));
    const vA = valueAt(TA, TA.tsLayers, sA, t + 1, LA), vB = valueAt(TB, TB.tsLayers, sB, t + 1, LB);
    const h = (cutAt(TA, sA, Math.min(t + 1, T), LA) + cutAt(TB, sB, Math.min(t + 1, T), LB)) / 2;
    const w = wJ[j] * QW[k];
    total += w * (vA.survival * vB.survival + A.wR * vA.resilience * vB.resilience + A.wB * (vA.bequest + vB.bequest) - h);
    both += w * vA.survival * vB.survival;
  }
  return { total, both };
}
const heldOf = (state, who) => ({ pen: state.tierHeld[who].pen || 0, isa: state.tierHeld[who].isa || 0 });

// the decisions the rollout makes on two paths of each couple, with the state it stood at
const DEC = [];
for (const f of FIX) {
  const { cp } = f, T = cp.m.ctx.totalYears;
  for (const zs of E.pathsForSeed(99005, 2, T)) {
    const tr = [], states = [];
    const st = M.initialState(cp.m);
    for (let t = 0; t <= T; t++) {
      states.push(M.cloneState(st));
      const j = chooseJoint(cp, st, t); tr.push(j);
      const row = M.step(cp.m, st, j, t, ratesAt(cp.m, zs, t));
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
    tr.forEach((j, t) => DEC.push({ f, t, state: states[t], joint: j }));
  }
}

// ---- 3. the layer reads ----
{
  let reads = 0, diff = 0, exps = 0, worstV = 0, worstE = 0, layered = 0, at = '';
  for (const { f, t, state, joint } of DEC) {
    const { cp } = f, T = cp.m.ctx.totalYears;
    if (t >= T) continue;
    for (const who of ['self', 'part']) for (const tab of compsOf(cp.tables[who])) {
      const s = vecOf(tab.m, ownerState(state, who));
      const base = tab.value(s, t + 1);
      let differs = false;
      for (const view of tab.worlds || [tab]) for (let L = 0; L < tab.tsLayers.length; L++) {
        const v = view.value(s, t + 1, L), o = valueAt(view, view.tsLayers, s, t + 1, L);
        const g = Math.max(rel(v.survival, o.survival), rel(v.resilience, o.resilience), rel(v.bequest, o.bequest));
        if (!(g <= worstV)) { worstV = g; at = `${f.id} ${who} year ${t + 1} layer ${L}`; }
        if (view === tab && Math.abs(v.survival - base.survival) > 1e-9) differs = true;
        reads++;
      }
      const b2 = tab.value(s, t + 1, null);
      if (b2.survival !== base.survival || b2.bequest !== base.bequest || b2.resilience !== base.resilience) worstV = Infinity;
      if (differs) diff++;
    }
    // the expectation of the chosen joint move, each person at their own move's layer
    const post = M.cloneState(state); M.step(cp.m, post, joint, t, null, true);
    const ev = new Float64Array(2), v = expectedValue(cp, post, t, ev, { ia: joint.ia, ib: joint.ib }), o = oracleExpect(cp, post, t, joint.ia, joint.ib);
    worstE = Math.max(worstE, rel(v, o.total), rel(ev[0], o.both));
    if (compsOf(cp.tables.self)[0].tsLayerOf[joint.ia] !== 0 || compsOf(cp.tables.part)[0].tsLayerOf[joint.ib] !== 0) layered++;
    exps++;
  }
  // the oracle shares no bridge money (D2.4): these two couples' tables read no bridge year
  const bridgeYears = FIX.reduce((n, { cp }) => n + ['self', 'part'].reduce((q, w) => q + compsOf(cp.tables[w]).reduce((r, tb) => r + (tb.g.reader ? tb.g.reader.years.reduce((a, b) => a + b, 0) : 0), 0), 0), 0);
  ok(3, 'the layer reads: value(s, t, layer) the layer\'s own arrays, world views too, no layer as before; the rollout\'s expectation reads each person at their move\'s layer',
    worstV <= 1e-12 && worstE <= 1e-12 && diff > 0 && layered > 0 && bridgeYears === 0,
    `${reads} layer reads, the largest gap ${worstV.toExponential(2)}${worstV > 1e-12 ? ` at ${at}` : ''}; positions where a layer reads differently from the plan's own ${diff}; ${exps} expectations, the largest gap ${worstE.toExponential(2)}, ${layered} with a person off the plan's own pair; bridge years read ${bridgeYears}`);
}

// ---- 4. the switch: each person's candidates their own chooser's; the joint score charges each person's switch ----
{
  let picks = 0, pickBad = 0, scored = 0, worst = 0, beaten = 0, switched = 0, held = 0;
  for (const { f, t, state, joint } of DEC) {
    const { cp } = f, T = cp.m.ctx.totalYears, A = cp.tables.self, B = cp.tables.part;
    const hA = heldOf(state, 'self'), hB = heldOf(state, 'part');
    // the single chooser's pick, with the tiers held, is the first of rankFor's candidates (or ties it within the chooser's eps)
    for (const [tab, who, h] of [[A, 'self', hA], [B, 'part', hB]]) {
      const s = vecOf(tab.m, ownerState(state, who)), n = tab.actions.length;
      const pick = chooseAction(tab, s, t, h), first = rankFor(tab, s, t, h, 1)[0];
      if (pick !== first) {
        const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n);
        scoreMoves(tab, s, tab.finalExact ? t : Math.min(t, T - 1), SC, TX, BQ, h);
        const charged = (ai) => SC[ai] - ((tab.c.acts[ai].tierPen || 0) !== h.pen || (tab.c.acts[ai].tierIsa || 0) !== h.isa ? tab.switchCharge : 0);
        if (!(Math.abs(charged(pick) - charged(first)) <= tab.eps)) pickBad++;
      }
      picks++;
    }
    // every candidate's score by the oracle: the expectation less the household's cut less each person's switch charge
    const kA = rankFor(A, vecOf(A.m, ownerState(state, 'self')), t, hA, cp.topK), kB = rankFor(B, vecOf(B.m, ownerState(state, 'part')), t, hB, cp.topK);
    const leaves = (tab, ai, h) => (tab.c.acts[ai].tierPen || 0) !== h.pen || (tab.c.acts[ai].tierIsa || 0) !== h.isa;
    const oracle = (ia, ib, split, level) => {
      const aA = A.actions[ia], aB = B.actions[ib];
      const j = { steps: aA.steps, costSteps: aA.costSteps || aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', sweepCash: true, ...(aA.sweepIsa ? { sweepIsa: true } : {}), lump: !!aA.lump, contrib: null, spendLevel: level, split, switchCost: cp.switchCost,
        perOwner: { self: { steps: aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', tierPen: A.c.acts[ia].tierPen || 0, tierIsa: A.c.acts[ia].tierIsa || 0, tierPenName: A.c.tiers.pen[A.c.acts[ia].tierPen || 0].name, tierIsaName: A.c.tiers.isa[A.c.acts[ia].tierIsa || 0].name },
          part: { steps: aB.steps, harvest: !!aB.harvest, harvestCeil: aB.harvestCeil || 'pa', tierPen: B.c.acts[ib].tierPen || 0, tierIsa: B.c.acts[ib].tierIsa || 0, tierPenName: B.c.tiers.pen[B.c.acts[ib].tierPen || 0].name, tierIsaName: B.c.tiers.isa[B.c.acts[ib].tierIsa || 0].name } } };
      const post = M.cloneState(state), row = M.step(cp.m, post, j, t, null, true);
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) return null;
      const cst = cutCostOf(cp, level, t), rz = A.raiseSurvival && cst < 0;
      const swc = (leaves(A, ia, hA) ? A.switchCharge : 0) + (leaves(B, ib, hB) ? B.switchCharge : 0);
      if (t >= T) { const total = Object.values(post.pots).reduce((a, b) => a + b, 0), alive = total >= (cp.m.ctx.solvencyFloor || 0) ? 1 : 0; return alive + 1e-9 * total - (rz ? cst * alive : cst) - swc; }
      const o = oracleExpect(cp, post, t, ia, ib);
      return o.total - (rz ? cst * o.both : cst) - swc;
    };
    let best = -Infinity;
    for (const split of cp.splits) for (const ia of kA) for (const ib of kB) for (const level of new Set([A.levelOf[ia], B.levelOf[ib]])) {
      const sc = oracle(ia, ib, split, level); if (sc !== null && sc > best) best = sc;
    }
    const mine = oracle(joint.ia, joint.ib, joint.split, joint.spendLevel);
    if (mine !== null && joint.score !== undefined) { worst = Math.max(worst, Math.abs(mine - joint.score)); scored++; if (best - mine > 1e-12) beaten++; }
    if (leaves(A, joint.ia, hA) || leaves(B, joint.ib, hB)) switched++; else held++;
  }
  ok(4, 'the switch: each person\'s candidates their own chooser\'s, the joint score charging each person\'s switch, the chosen move the best',
    pickBad === 0 && worst <= 1e-12 && beaten === 0 && switched > 0 && held > 0,
    `${picks} picks, ${pickBad} not the chooser's; ${scored} joint scores, the largest gap to the oracle ${worst.toExponential(2)}, ${beaten} beaten by another candidate; ${switched} decisions switch a tier, ${held} hold`);
}

// ---- 5. the engine under the solved couple and the rollout, path by path ----
{
  let paths = 0, years = 0, moveBad = 0, worst = 0, survBad = 0, at = '';
  for (const { id, cp } of [...FIX, O11]) {
    const T = cp.m.ctx.totalYears;
    for (const [i, zs] of E.pathsForSeed(99006, NP, T).entries()) {
      const trace = [], rp = runCouplePolicy(cp, zs, trace);
      const pol = couplePolicy(cp), rec = [];
      const wrapped = { ...pol, choose: (st, t, h) => { const j = pol.choose(st, t, h); rec.push(j); return j; } };
      const base = withCouple(cp.plan, cp);
      const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: wrapped } });
      const st = E.freshState(ctx);
      let alive = true;
      for (let t = 0; t <= T; t++) {
        const re = E.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 });
        if (re.unmetDemand > 1 || re.preNmpaInsolvent) { alive = false; break; }
      }
      // the end judged as the rollout judges it: below the household's minimum pot is not survival
      if (alive && cp.m.ctx.solvencyFloor > 0 && Object.values(st.pots).reduce((a, b) => a + b, 0) < cp.m.ctx.solvencyFloor) alive = false;
      const key = (j) => j && `${j.ia}/${j.ib}/${j.split}/${j.spendLevel}/${j.perOwner.self.tierPen},${j.perOwner.self.tierIsa}/${j.perOwner.part.tierPen},${j.perOwner.part.tierIsa}`;
      const n = Math.max(rec.length, trace.length);
      for (let t = 0; t < n; t++) { if (key(rec[t]) !== key(trace[t])) { if (!moveBad) at = `${id} path ${i} year ${t}: engine ${key(rec[t])}, rollout ${key(trace[t])}`; moveBad++; break; } }
      years += rec.length;
      if (alive !== rp.survived) survBad++;
      if (alive && rp.survived) { const tot = Object.values(st.pots).reduce((a, b) => a + b, 0); worst = Math.max(worst, Math.abs(tot - rp.terminal)); }
      paths++;
    }
  }
  ok(5, 'the engine under the solved couple and the rollout: the same joint move every year, the same end, the same survival (the O11 couple\'s bridge years too)', moveBad === 0 && survBad === 0 && worst <= 1,
    `${paths} paths, ${years} engine years; paths with a move apart ${moveBad}${at ? ` (first: ${at})` : ''}; survival apart ${survBad}; the largest gap at the end £${worst.toExponential(2)}`);
}

// ---- 6. a single's tables, value reads and runs, the code before D2.3's ----
{
  // taken on 08de944, the code before D2.3 (S116 tables b12130607dc6, runs 83348278687d, reads da5fd63b56e0; S224 130e93bbc22f,
  // 16c14981a6f9, 3224079fcac5); re-taken on the review of 9 Nov's item 3 (D69): both singles hold cash and a taxable account,
  // whose interest and dividends item 3 prices above the year's income (with none, the code before and item 3 give the same tables)
  // runs re-taken on item 5's code, whose row gains the year's sweep (sweptToGia, sweptFromGia, sweptToIsa): with those three
  // stripped, each is item 4's to the bit; the tables and value reads unchanged
  const BEFORE = {
    S116: { tables: 'b954f145878ff4604101cff2c8513547430df0e9a0835547f3b5471982b65eb4', runs: '36c5ce5e9062fdee78212e51475a6c04d3bac29a73cc8b55ba789a20d1a5e83e', reads: 'a0d64da0839c6b4303ba7891607e0c5c7e0916a77d906f35b4dfab375177a7e1' },
    S224: { tables: '4a38efe85909a4e3af5410d1795d1e47cc5c3a7970760a76fbc32ca65360ed08', runs: '099e73f40cfcd918c7eeaadca94382c2e5a4551ac5267e777b7d63da30dc467f', reads: '4d7ef15fabca2aaa35aca6c21fe61c031f189dc8b7ab6777a934efd787343410' }
  };
  const h = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
  const bad = [];
  for (const id of Object.keys(BEFORE)) {
    const plan = E.normalizePlan(library.find(s => s.id === id).plan);
    const r = solveForApp(E, M, plan, LIGHT), T = r.m.ctx.totalYears;
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r));
    const runs = [], reads = [];
    for (const zs of E.pathsForSeed(99004, 10, T)) {
      const st = E.freshState(ctx), out = [];
      for (let t = 0; t <= T; t++) {
        reads.push(r.value(vecOf(r.m, { pots: st.pots, basis: st.giaBasis, cgtCarry: st.cgtCarry, cumPcls: st.cumPcls, lumpTaken: st.lumpSumTaken, cashIsa: st.cashIsa, guard: null }), t));
        out.push(E.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }));
      }
      runs.push(out);
    }
    const now = { tables: await digestOf(tablesOf(r)), runs: h(runs), reads: h(reads) };
    if (process.env.COUPLE_TABLES_PRINT) console.log(`  ${id}: ${JSON.stringify(now)}`);
    for (const k of ['tables', 'runs', 'reads']) if (now[k] !== BEFORE[id][k]) bad.push(`${id} ${k} ${now[k].slice(0, 12)} against ${BEFORE[id][k].slice(0, 12)}`);
  }
  ok(6, 'a single\'s tables, value reads and runs under them the code before D2.3\'s, bit for bit (S116, S224)', bad.length === 0, bad.length ? bad.join('; ') : 'S116 and S224 the same');
}

// ---- 7. D2.4's share in the bridge years: its bounds, its search, money kept; nothing else moves ----
{
  const { cp } = O11, T = cp.m.ctx.totalYears, A = cp.tables.self, B = cp.tables.part, cA = compsOf(A), cB = compsOf(B);
  const ids = (who) => cp.m.ctx.owners.find(o => o.key === who).ids;
  const acc = (g, who) => ['isa', 'other', 'cash'].reduce((s, k) => s + (ids(who)[k] ? g.pots[ids(who)[k]] || 0 : 0), 0);
  let bridgeDec = 0, otherDec = 0, otherSame = 0, above = 0, below = 0, boundBad = 0, readBad = 0, keptBad = 0, scanGap = 0, moved = 0, worstUp = 0;
  for (const zs of E.pathsForSeed(99005, 2, T)) {
    const st = M.initialState(cp.m);
    for (let t = 0; t < T; t++) {
      const j = chooseJoint(cp, st, t), post = M.cloneState(st); M.step(cp.m, post, j, t, null, true);
      const k1 = Math.min(t + 1, T), TA = cA[0], TB = cB[0], bA = bridgeAt(TA, k1), bB = bridgeAt(TB, k1);
      const ev = new Float64Array(2), own = new Float64Array(2);
      const vH = expectedValue(cp, post, t, ev, { ia: j.ia, ib: j.ib });
      COUPLE.plant = withPlant('ownmoney'); const vO = expectedValue(cp, post, t, own, { ia: j.ia, ib: j.ib }); COUPLE.plant = PLANT;
      if (bA || bB) {
        bridgeDec++;
        if (vH < vO - 1e-12) below++;
        if (ev[0] > own[0] + 0.01) above++;
        worstUp = Math.max(worstUp, ev[0] - own[0]);
        // one node by hand: the post-decision state grown at the middle node of the first shift, the share searched with the
        // test's own reads (valueAt, cutAt), its bounds, its read and the money it keeps
        const QZ = A.quadNodes, z = QZ[Math.floor(QZ.length / 2)], sh = A.mix ? A.mix.nodes[0] : 0, rates = {};
        cp.m.ctx.accounts.forEach(a0 => { const a = M.profileOf(cp.m, post, a0); rates[a0.id] = Math.exp(Math.log(1 + a.real) + (A.c.shiftMode ? a.sigmaParam * sh : 0) + (A.c.shiftMode ? a.vol : foldedVol(a.vol, a.sigmaParam, T - t + 1)) * z) - 1; });
        const g = M.cloneState(post); M.grow(cp.m, g, t, rates);
        const LA = TA.tsLayerOf[j.ia], LB = TB.tsLayerOf[j.ib];
        const atO = (gg, o) => {
          const sA = vecOf(TA.m, ownerState(gg, 'self')), sB = vecOf(TB.m, ownerState(gg, 'part'));
          const vA = valueAt(TA, TA.tsLayers, sA, t + 1, LA), vB = valueAt(TB, TB.tsLayers, sB, t + 1, LB);
          const h = (cutAt(TA, sA, k1, LA) + cutAt(TB, sB, k1, LB)) / 2;
          o[0] = vA.survival * vB.survival + A.wR * vA.resilience * vB.resilience + A.wB * (vA.bequest + vB.bequest) - h; o[1] = vA.survival * vB.survival; o[2] = h;
          return o[0];
        };
        const lo = -Math.min(acc(g, 'self'), bB ? cp.need.part[k1] : 0), hi = Math.min(acc(g, 'part'), bA ? cp.need.self[k1] : 0);
        const [blo, bhi] = shareBounds(cp, g, k1, bA, bB);
        if (Math.abs(blo - lo) > 1e-6 || Math.abs(bhi - hi) > 1e-6) boundBad++;
        const out = new Float64Array(4), o = new Float64Array(3);
        shareBridge(cp, g, k1, bA, bB, atO, out);
        if (out[3] < lo - 1e-9 || out[3] > hi + 1e-9) boundBad++;
        if (atO(sharedState(cp, g, out[3]), o) !== out[0] || out[0] < atO(g, o)) readBad++;
        if (out[3] !== 0) moved++;
        // the search against a scan of 41 points: how much it leaves
        for (let i = 0; i <= 40; i++) scanGap = Math.max(scanGap, atO(sharedState(cp, g, lo + (hi - lo) * i / 40), o) - out[0]);
        // money kept: each wrapper's household total, the pensions, the taxable account's basis, the giver's gain share
        for (const x of [out[3], hi / 2, lo / 2]) {
          const g2 = sharedState(cp, g, x);
          for (const k of ['pen', 'isa', 'other', 'cash']) { const tot = (gg) => (gg.pots[ids('self')[k]] || 0) + (gg.pots[ids('part')[k]] || 0); if (Math.abs(tot(g2) - tot(g)) > 1e-6) keptBad++; }
          for (const w of ['self', 'part']) if (g2.pots[ids(w).pen] !== g.pots[ids(w).pen]) keptBad++;
          if (Math.abs((g2.basis.self + g2.basis.part) - (g.basis.self + g.basis.part)) > 1e-6) keptBad++;
          const giver = x > 0 ? 'part' : 'self', gf = (gg) => { const v = gg.pots[ids(giver).other] || 0; return v > 0 ? (v - gg.basis[giver]) / v : 0; };
          if (x !== 0 && Math.abs(gf(g2) - gf(g)) > 1e-9) keptBad++;
        }
      } else { otherDec++; if (Object.is(vH, vO) && Object.is(ev[0], own[0])) otherSame++; }
      const row = M.step(cp.m, st, j, t, ratesAt(cp.m, zs, t));
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
  }
  ok(7, 'the household\'s money in the bridge (D2.4): x within its bounds, the read at x the best tried and at least the own-money read, money kept; outside the bridge nothing moves',
    bridgeDec > 0 && above > 0 && below === 0 && boundBad === 0 && readBad === 0 && keptBad === 0 && moved > 0 && otherDec > 0 && otherSame === otherDec && scanGap <= 1e-3,
    `${bridgeDec} bridge-year decisions: the household's read above the own-money read by more than a point on ${above} (the most ${(100 * worstUp).toFixed(1)} points), below it on ${below}; bounds wrong ${boundBad}, reads wrong ${readBad}, money not kept ${keptBad}; money moved at ${moved} of the nodes checked; the search short of a 41-point scan by ${scanGap.toExponential(2)} at most; ${otherDec} decisions after the bridge, ${otherSame} the same bit for bit`);
}

// ---- 8. O11's case: the household's bridge read against its simulation ----
{
  const { cp } = O11, T = cp.m.ctx.totalYears, N8 = 40, zsAll = E.pathsForSeed(99007, N8, T);
  const run = (plant) => {
    COUPLE.plant = plant;
    const st = M.initialState(cp.m), j = chooseJoint(cp, st, 0), post = M.cloneState(st); M.step(cp.m, post, j, 0, null, true);
    const ev = new Float64Array(2); expectedValue(cp, post, 0, ev, { ia: j.ia, ib: j.ib });
    let surv = 0, lv = 0, ly = 0;
    const each = zsAll.map(zs => { const tr = [], r = runCouplePolicy(cp, zs, tr); surv += r.survived ? 1 : 0; tr.slice(0, 8).forEach(x => { lv += x.spendLevel; ly++; }); return r.survived ? 1 : 0; });
    COUPLE.plant = PLANT;
    return { read: ev[0], surv: surv / N8, level: lv / ly, each };
  };
  const H = run(PLANT), O = run(withPlant('ownmoney'));
  const saved = H.each.filter((s, i) => s && !O.each[i]).length, lost = H.each.filter((s, i) => !s && O.each[i]).length;
  ok(8, 'O11\'s case: with the household\'s money the year-0 read of both lasting within 10 points of the household\'s simulated survival; on each person\'s own money more than 50 points below it',
    Math.abs(H.read - H.surv) <= 0.10 && O.surv - O.read > 0.50,
    `the household's money: read ${(100 * H.read).toFixed(1)}%, simulated ${(100 * H.surv).toFixed(1)}% of ${N8}; own money: read ${(100 * O.read).toFixed(1)}%, simulated ${(100 * O.surv).toFixed(1)}%; paired, ${saved} paths saved and ${lost} lost by the household's money; the mean level in the first eight years ${H.level.toFixed(3)} against ${O.level.toFixed(3)}`);
}

console.log(`${failed ? 'FAILED' : 'ALL PASS'}: ${passed} passed, ${failed} failed (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
process.exit(failed ? 1 : 0);
