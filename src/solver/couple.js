/*
 * COUPLES BY ROLLOUT (solver plan, Phase 5).
 *
 * A couple is two single-person tables and one decision that neither can make alone: how the household's
 * spending is funded between them this year. Each person gets a single plan (their own wrappers, their own
 * incomes, half the household's spending) and a table solved for it. Then, every year, the joint move is
 * chosen by a one-step rollout: for each candidate (a funding split, and each person's move from the few
 * their own table rates highest at their position) the exact reduced model steps the household one year,
 * and the two tables value where that leaves each person. By the policy improvement theorem the rollout
 * is at least as good as the base tables it improves on; what it adds is the split, and each person's
 * move chosen with the other's position in view.
 *
 * The tables are solved with an even split and value the future as if it stays even, so the split is a
 * one-year deviation valued against a base policy, which is what a rollout is. Tiers are off for couples
 * in this pilot; the raise and the floor are the single solver's and pass through the single plans.
 *
 * PART D, D1 (the launch plan's section 6; the archive's M4, its three gaps), each scored as the single chooser
 * (solve.js scoreMoves) scores a move:
 *   - THE CUT TERM. A move's value now charges the household's cut: this year's, the two tables' own cut cost at the
 *     household's level averaged (one cut, costOf: lambda x shortOf, age-weighted under ageWeight; a raise's credit weighted
 *     by the survival it leads to, as raiseSurvival does), and the years ahead, the two tables' expected future cut cost
 *     (each table's `short`, read where its survival is read) averaged: the household spends at one level, so a cut is
 *     counted once, not once a person. So the dial (lambda) reaches couples.
 *   - THE HOUSEHOLD'S LEVEL. Each joint candidate tries the level of either person's ranked move, not the first person's
 *     alone, and both tables value where it leaves them.
 *   - THE QUADRATURE. The expectation takes the tables' own nodes and weights (`quadNodes`), not five fixed ones; unset,
 *     they are the five, so nothing changes there.
 * COUPLE.plant (couple-quick.test.mjs only; '' everywhere else): 'nocut', 'firstlevel' and 'fivenodes', alone or joined by
 * commas, put each gap back as the code before D1 had it (with model.js's MODEL.plant 'nolevel', all four are that code).
 */
import { solve, solveMixture, rankActions, NODES, WEIGHTS } from './solve.js';
import { foldedVol } from './fast.js';
import { vecOf, readValues } from './grid.js';

export const SPLITS = [0, 0.25, 0.5, 0.75, 1];
export const COUPLE = { plant: '' };
const planted = (k) => COUPLE.plant !== '' && COUPLE.plant.split(',').includes(k);

/* One person's plan, cut from the couple's: their wrappers and incomes, `share` of the household's spending. */
export function singlePlanFor(plan, who, share = 0.5) {
  const d = plan.demographics;
  const k = who === 'self' ? 'Self' : 'Part';
  const label = who === 'self' ? 'Myself' : 'Partner';
  const age0 = Number(d[`currentAge${k}`]);
  const years = Number(d.terminalAge) - Number(d.currentAgeSelf);   // the household's horizon, kept for both
  const demographics = {
    ...d, planningMode: 'single',
    currentAgeSelf: age0, retireAgeSelf: d[`retireAge${k}`], salarySelf: d[`salary${k}`], salaryGrowthSelf: d[`salaryGrowth${k}`],
    employmentSelf: d[`employment${k}`], cgtGainsUsedSelf: d[`cgtGainsUsed${k}`], cfBroughtForwardSelf: d[`cfBroughtForward${k}`],
    mpaaAgeSelf: d[`mpaaAge${k}`], statePensionSelf: d[`statePension${k}`], terminalAge: age0 + years
  };
  const rename = (id) => String(id).replace(/_(self|part)$/, '_self');
  const accounts = plan.accounts.filter(a => a.owner === label).map(a => ({ ...a, owner: 'Myself', id: rename(a.id) }));
  const otherIncomes = (plan.otherIncomes || []).filter(i => i.owner === label).map(i => ({ ...i, owner: 'Myself' }));
  const scale = (v) => (v === '' || v === undefined || v === null ? v : Math.round(Number(v) * share));
  const spending = {
    ...plan.spending, targetSpend: scale(plan.spending.targetSpend),
    floorSpend: plan.spending.floorSpend ? scale(plan.spending.floorSpend) : plan.spending.floorSpend,
    spendBands: (plan.spending.spendBands || []).map(b => ({ ...b, amount: scale(b.amount) }))
  };
  const oneOffCosts = (plan.oneOffCosts || []).map(c => ({ ...c, amount: scale(c.amount) }));
  const oneOffContributions = (plan.oneOffContributions || []).filter(c => (c.owner || 'Myself') === label).map(c => ({ ...c, owner: 'Myself' }));
  return { ...plan, demographics, accounts, otherIncomes, spending, oneOffCosts, oneOffContributions };
}

/* The couple's model state seen as one person's single-plan state, without copying the pots' values twice. */
export function ownerState(state, who) {
  const pots = {};
  for (const id in state.pots) if (id.endsWith('_' + who)) pots[id.replace(/_(self|part)$/, '_self')] = state.pots[id];
  return {
    pots, basis: { self: state.basis[who] || 0 }, cgtCarry: { self: state.cgtCarry[who] || 0 }, cumPcls: { self: state.cumPcls[who] || 0 },
    lumpTaken: { self: !!state.lumpTaken[who] }, cashIsa: { self: (state.cashIsa && state.cashIsa[who]) || 0 }, guard: null
  };
}

export function solveCouple(E, M, plan, opts = {}) {
  const m = M.prepare(E, plan);
  if (!m.ctx.isCouple) throw new Error('solveCouple takes a couple');
  const share = opts.share !== undefined ? opts.share : 0.5;
  const plans = {
    self: E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, 'self', share))),
    part: E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, 'part', 1 - share)))
  };
  const solveOne = (p) => {
    const mm = M.prepare(E, p);
    const o = { ...opts, lump: opts.lump !== undefined ? opts.lump : mm.ctx.fullLumpSum, tiers: undefined };
    return opts.mix ? solveMixture(E, M, p, o) : solve(E, M, p, o);
  };
  const t0 = Date.now();
  const tables = { self: solveOne(plans.self), part: solveOne(plans.part) };
  return { E, M, m, plans, tables, share, splits: opts.splits || SPLITS, topK: opts.topK || 2, meta: { ms: Date.now() - t0, mixture: tables.self.meta.mixture || 0, points: tables.self.meta.points } };
}

/* One table's expected future cut cost at a position, read as the single chooser reads it (scoreMoves: readValues' fourth
 * output, the `short` table over the same corners as survival). */
const CUT_RD = new Float64Array(4);
function cutAhead(tab, s, t) {
  const k = Math.min(t, tab.m.ctx.totalYears);
  readValues(tab.g, tab.lsurv[k], tab.beq[k], s, CUT_RD, tab.lresil[k], tab.short[k], k);
  return CUT_RD[3];
}

/* The household's cut cost this year at spending level `level`: the two tables' own costOf, averaged (one cut, counted once);
 * nothing for a person in a year with no spending. Below 1 a cost, above it a raise's credit (negative). */
export function cutCostOf(cp, level, t) {
  const A = cp.tables.self, B = cp.tables.part;
  const ca = A.c.yr.spend[t] > 0 ? A.costOf(level, t) : 0, cb = B.c.yr.spend[t] > 0 ? B.costOf(level, t) : 0;
  return (ca + cb) / 2;
}

/*
 * The value of a post-decision couple state: the two tables read after one year's growth, averaged over the market, less the
 * household's expected future cut cost (D1). `out`, when given, receives the expected chance both last (out[0]) and that
 * cut cost (out[1]). Exported for couple-quick.test.mjs.
 */
export function expectedValue(cp, post, t, out = null) {
  const { m, M, tables } = cp;
  const A = tables.self, B = tables.part;
  const mixA = A.mix ? A.mix.tables : [A], mixB = B.mix ? B.mix.tables : [B];
  const shifts = A.mix ? A.mix.nodes : [0], wJ = A.mix ? A.mix.weights : [1];
  const T = m.ctx.totalYears;
  const five = planted('fivenodes'), QZ = five ? NODES : (A.quadNodes || NODES), QW = five ? WEIGHTS : (A.quadWeights || WEIGHTS);
  const cut = !planted('nocut');
  let total = 0, both = 0, ahead = 0;
  for (let j = 0; j < shifts.length; j++) {
    for (let k = 0; k < QW.length; k++) {
      const rates = {};
      m.ctx.accounts.forEach(a => {
        const vol = A.c.shiftMode ? a.vol : foldedVol(a.vol, a.sigmaParam, T - t + 1);
        rates[a.id] = Math.exp(Math.log(1 + a.real) + (A.c.shiftMode ? a.sigmaParam * shifts[j] : 0) + vol * QZ[k]) - 1;
      });
      const g = M.cloneState(post);
      M.grow(m, g, t, rates);
      const sA = vecOf(mixA[j].m, ownerState(g, 'self')), sB = vecOf(mixB[j].m, ownerState(g, 'part'));
      const vA = mixA[j].value(sA, t + 1), vB = mixB[j].value(sB, t + 1);
      const h = cut ? (cutAhead(mixA[j], sA, t + 1) + cutAhead(mixB[j], sB, t + 1)) / 2 : 0;
      const w = wJ[j] * QW[k];
      // both must last: survival multiplies; the resilience term likewise; the bequest is the household's; one cut, counted once
      total += w * (vA.survival * vB.survival + A.wR * vA.resilience * vB.resilience + A.wB * (vA.bequest + vB.bequest) - h);
      both += w * vA.survival * vB.survival;
      ahead += w * h;
    }
  }
  if (out) { out[0] = both; out[1] = ahead; }
  return total;
}

/* The joint move for one year: the split and each person's move, by one-step rollout. */
export function chooseJoint(cp, state, t) {
  const { m, M, tables, splits, topK } = cp;
  const T = m.ctx.totalYears;
  const sA = vecOf(tables.self.m, ownerState(state, 'self')), sB = vecOf(tables.part.m, ownerState(state, 'part'));
  const kA = rankActions(tables.self, sA, t, null, topK), kB = rankActions(tables.part, sB, t, null, topK);
  const lvl = (tab, i) => (tab.levelOf ? tab.levelOf[i] : tab.actions[i].spendLevel !== undefined ? tab.actions[i].spendLevel : 1);
  const first = planted('firstlevel'), cut = !planted('nocut'), raiseSurv = !!tables.self.raiseSurvival;
  const ev = new Float64Array(2);
  let best = null, bestScore = -Infinity;
  for (const split of splits) for (const ia of kA) for (const ib of kB) {
    const aA = tables.self.actions[ia], aB = tables.part.actions[ib];
    // D1: the household's level from either person's ranked move (the first person's first), each valued by both tables
    const levels = first ? [aA.spendLevel] : [...new Set([lvl(tables.self, ia), lvl(tables.part, ib)])];
    for (const level of levels) {
      const joint = {
        steps: aA.steps, costSteps: aA.costSteps || aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', sweepCash: true, lump: !!aA.lump, contrib: null,
        spendLevel: level, split,
        perOwner: { self: { steps: aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa' }, part: { steps: aB.steps, harvest: !!aB.harvest, harvestCeil: aB.harvestCeil || 'pa' } },
        ia, ib
      };
      const st = M.cloneState(state);
      const row = M.step(m, st, joint, t, null, true);
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) continue;
      // D1: this year's cut, counted once for the household; a raise's credit weighted by the chance both last (raiseSurvival)
      const cst = cut ? cutCostOf(cp, level !== undefined ? level : 1, t) : 0, rz = raiseSurv && cst < 0;
      let score;
      if (t >= T) {
        const total = Object.values(st.pots).reduce((a, b) => a + b, 0), alive = total >= (m.ctx.solvencyFloor || 0) ? 1 : 0;
        score = alive + 1e-9 * total - (rz ? cst * alive : cst);
      } else {
        const v = expectedValue(cp, st, t, ev);
        score = v - (rz ? cst * ev[0] : cst);
      }
      // a move that funds the year reads finite tables, so a non-finite score is a bug: it would never win, and the year would
      // fall to the fallback below in silence (solve.js nonFiniteScore's rule; the follow-up review of 22 Oct, answer 6)
      if (!Number.isFinite(score)) throw new Error(`couple: non-finite score in the joint move, year ${t}, split ${split}, moves ${ia} and ${ib}: ${score}`);
      if (score > bestScore) { bestScore = score; best = joint; best.score = score; }
    }
  }
  if (!best) {
    // nothing funds the year: the even split with each person's first-ranked move, and the year fails on its own terms
    const aA = tables.self.actions[kA[0] || 0], aB = tables.part.actions[kB[0] || 0];
    best = { steps: aA.steps, costSteps: aA.costSteps || aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', sweepCash: true, lump: !!aA.lump, contrib: null, spendLevel: aA.spendLevel, split: 0.5, perOwner: { self: { steps: aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa' }, part: { steps: aB.steps, harvest: !!aB.harvest, harvestCeil: aB.harvestCeil || 'pa' } }, ia: kA[0] || 0, ib: kB[0] || 0 };
  }
  return best;
}

/* The engine's own market for a couple's forward run: one yearly draw for every wrapper, one held shift per path. */
export function ratesFor(m, zs, t) {
  const T = m.ctx.totalYears;
  const zp = zs.length > T + 1 ? zs[T + 1] : 0;
  const rates = {};
  m.ctx.accounts.forEach(a => { rates[a.id] = Math.exp(Math.log(1 + a.real) + a.sigmaParam * zp + a.vol * zs[t]) - 1; });
  return rates;
}

/* One path under the rollout policy, in the exact reduced model. */
export function runCouplePolicy(cp, zs) {
  const { m, M } = cp;
  const T = m.ctx.totalYears;
  const state = M.initialState(m);
  let tax = 0, splitSum = 0, splitYears = 0, uneven = 0;
  for (let t = 0; t <= T; t++) {
    const joint = chooseJoint(cp, state, t);
    const row = M.step(m, state, joint, t, ratesFor(m, zs, t));
    tax += row.taxPaid + row.cgtPaid;
    if (row.netDrawdown > 0) { splitSum += joint.split; splitYears++; if (Math.abs(joint.split - 0.5) > 1e-9) uneven++; }
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, preAccess: !!row.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax, splitMean: splitYears ? splitSum / splitYears : 0.5, unevenYears: uneven };
  }
  const total = Object.values(state.pots).reduce((a, b) => a + b, 0);
  const penTotal = m.ctx.accounts.filter(a => a.cat === 'pen').reduce((a, x) => a + (state.pots[x.id] || 0), 0);
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + T, terminalNet: 0, terminal: 0, lifetimeTax: tax, splitMean: splitYears ? splitSum / splitYears : 0.5, unevenYears: uneven };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - penTotal * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax, splitMean: splitYears ? splitSum / splitYears : 0.5, unevenYears: uneven };
}

/* One path under a fixed action for the household, in the exact reduced model: the opponents. */
export function runCoupleFixed(m, M, action, zs) {
  const T = m.ctx.totalYears;
  const state = M.initialState(m);
  let tax = 0;
  for (let t = 0; t <= T; t++) {
    const row = M.step(m, state, action, t, ratesFor(m, zs, t));
    tax += row.taxPaid + row.cgtPaid;
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, preAccess: !!row.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax };
  }
  const total = Object.values(state.pots).reduce((a, b) => a + b, 0);
  const penTotal = m.ctx.accounts.filter(a => a.cat === 'pen').reduce((a, x) => a + (state.pots[x.id] || 0), 0);
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + T, terminalNet: 0, terminal: 0, lifetimeTax: tax };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - penTotal * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax };
}
