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
 * PART D, D2.3, the candidate's tables: `opts.solveOne` solves each person's plan as a single's is solved (solveForApp: the
 * tier state three steps below, HR, the table without the dealing cost, the failure year at what it can pay, the floor), and
 * the rollout reads each person at the tier pair their move goes to (the tier state's layer, solve.js value(s, t, layer)),
 * ranks each person's moves with the tiers they hold, and charges each a switch as their own chooser does (switchCharge);
 * each person's plan takes their share of the household's minimum pot. couplePolicy / withCouple run a solved couple in the
 * engine (src/App.jsx stepYear), its state read as the model's.
 * COUPLE.plant (tests only; '' everywhere else), alone or joined by commas: 'nocut', 'firstlevel' and 'fivenodes'
 * (couple-quick.test.mjs) put each D1 gap back as the code before D1 had it (with model.js's MODEL.plant 'nolevel', all four
 * are that code); 'fullfloor', 'nohhfloor', 'baselayer', 'nocharge' and 'noheld' (couple-tables.test.mjs) each D2.3 gap it
 * names; 'ownmoney' D2.4's (each person's bridge read on their own money); 'nolock' D3's (couple-levers.test.mjs: the rollout
 * unlocked from each person's base).
 */
import { solve, solveMixture, rankActions, scoreMoves, chooseAction, NODES, WEIGHTS } from './solve.js';
import { foldedVol } from './fast.js';
import { vecOf, readValues, bridgeTable } from './grid.js';
import { profileOf as M_profileOf } from './model.js';

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
  // the household's minimum pot at the plan's end cut to the share too (Part D, D2: before it each person's table was asked to
  // end with the household's whole minimum pot on their own, 84 of the library's 210 couples setting one); plant 'fullfloor'
  const config = plan.config && Number(plan.config.solvencyFloor) > 0 && !planted('fullfloor') ? { ...plan.config, solvencyFloor: scale(plan.config.solvencyFloor) } : plan.config;
  return { ...plan, config, demographics, accounts, otherIncomes, spending, oneOffCosts, oneOffContributions };
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

/*
 * The couple's two tables. `opts.solveOne` (Part D, D2), when given, solves each person's single plan as a single's is solved
 * (src/solverApp.js solveForApp: the candidate's settings, the floor, the dial, the tiers by consent and the tier above): the
 * household's plan is then the caller's, prepared as a single's is (prepareForSolve and appPlan, so the tiers' returns are
 * the tables'), its minimum pot the household's. Without it, the archive's pilot: solve() on each plan with `opts`, no tiers.
 * The household's model takes the tier lists the tables were solved on (each person by their own wrappers, App.jsx).
 */
export function solveCouple(E, M, plan, opts = {}) {
  const m0 = M.prepare(E, plan);
  if (!m0.ctx.isCouple) throw new Error('solveCouple takes a couple');
  const share = opts.share !== undefined ? opts.share : 0.5;
  const plans = {
    self: E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, 'self', share))),
    part: E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, 'part', 1 - share)))
  };
  const solveOne = opts.solveOne || ((p) => {
    const mm = M.prepare(E, p);
    const o = { ...opts, lump: opts.lump !== undefined ? opts.lump : mm.ctx.fullLumpSum, tiers: undefined };
    return opts.mix ? solveMixture(E, M, p, o) : solve(E, M, p, o);
  });
  const t0 = Date.now();
  // each person's solve told who they are and the other's age today (D3: B3a's age weights on the chance that either lives)
  const tables = { self: solveOne(plans.self, { who: 'self', partnerAge0: m0.ctx.agePart0 }), part: solveOne(plans.part, { who: 'part', partnerAge0: m0.ctx.ageSelf0 }) };
  const tiersBelow = tables.self.meta.tiersBelow === 3 || tables.part.meta.tiersBelow === 3 ? 3 : 2;
  // the household's minimum pot where its plan sets none: the two tables' together (a single's solve sets one where the plan
  // has none, solve.js solvePlan's minPotYears; before D2.3 the household's year ended judged against none); plant 'nohhfloor'
  const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
  const floorBoth = (tables.self.m.ctx.solvencyFloor || 0) + (tables.part.m.ctx.solvencyFloor || 0);
  const planH = !(own > 0) && floorBoth > 0 && !planted('nohhfloor') ? { ...plan, config: { ...plan.config, solvencyFloor: floorBoth } } : plan;
  const m = tiersBelow === 3 || planH !== plan ? M.prepare(E, planH, tiersBelow === 3 ? { tiersBelow: 3 } : {}) : m0;
  const scA = tables.self.c.switchCost || 0, scB = tables.part.c.switchCost || 0;
  if (scA !== scB) throw new Error(`solveCouple: the two tables' switch costs differ (${scA}, ${scB})`);
  // D2.4: each person's floor bills ahead to their pension access, where their table reads the bridge (the reader's years)
  const needOf = (tab) => (tab.g && tab.g.reader ? bridgeTable(E, tab.m, tab.c, Math.min(...tab.levelOf), 2).need : null);
  const need = { self: needOf(tables.self), part: needOf(tables.part) };
  return { E, M, m, plan: planH, plans, tables, share, tiersBelow, switchCost: scA, need, splits: opts.splits || SPLITS, topK: opts.topK || 2, meta: { ms: Date.now() - t0, mixture: tables.self.meta.mixture || 0, points: tables.self.meta.points } };
}

/*
 * PART D, D2.4: THE BRIDGE WITH THE HOUSEHOLD'S MONEY (the archive's O11; the launch plan's D2). Each person's table is
 * solved on their own money, so in a year before one person's pension can be drawn their table reads their bridge as paid
 * from their own ISA, taxable account and cash alone (the bridge reader's chance, grid.js readValues). A couple's household
 * can pay one person's bridge from the other's money: the split does it year by year. So where either table reads a bridge
 * year, the rollout reads the two people with their accessible money shared between them as best serves both: x moved from
 * one to the other, each wrapper to the same wrapper (the taxable account with its share of the basis), the household's
 * money the same, x at most the receiver's floor bills ahead to their access (bridgeTable's need) and what the giver holds,
 * and x = 0 (each person on their own money, as before) always among those tried. Pensions never move. Plant 'ownmoney'.
 */
const ACC = ['isa', 'other', 'cash'];
const ownerOf = (m, who) => m.ctx.owners.find(o => o.key === who);
export function accessibleOf(m, g, who) { const o = ownerOf(m, who); return ACC.reduce((a, k) => a + (o.ids[k] ? g.pots[o.ids[k]] || 0 : 0), 0); }
/* The couple's state with x of `from`'s accessible money moved to `to` (each wrapper to the same, or to `to`'s first held). */
export function movedState(M, m, g, from, to, x) {
  const out = M.cloneState(g);
  if (!(x > 0)) return out;
  const oF = ownerOf(m, from), oT = ownerOf(m, to), have = accessibleOf(m, g, from);
  if (!(have > 0)) return out;
  const f = Math.min(1, x / have);
  for (const k of ACC) {
    const idF = oF.ids[k]; if (!idF) continue;
    const d = (g.pots[idF] || 0) * f; if (!(d > 0)) continue;
    const idT = oT.ids[k] || ACC.map(q => oT.ids[q]).find(Boolean);
    if (!idT) continue;
    out.pots[idF] -= d; out.pots[idT] = (out.pots[idT] || 0) + d;
    if (k === 'other') { const db = (g.basis[from] || 0) * f; out.basis[from] = (g.basis[from] || 0) - db; if (idT === oT.ids.other) out.basis[to] = (out.basis[to] || 0) + db; }
    if (k === 'cash' && out.cashIsa && out.cashIsa[from] > out.pots[idF]) out.cashIsa[from] = out.pots[idF];
  }
  return out;
}
export const bridgeAt = (tab, k) => !!(tab.g && tab.g.reader && tab.g.reader.years[k]);

/* The tier-state layer a move of `tab` goes to (its pair), or null where the table has no tier state (the plan's own pair). */
export const layerOf = (tab, ai) => (ai !== null && ai !== undefined && tab.tsLayers && tab.tsLayerOf && !planted('baselayer') ? tab.tsLayerOf[ai] : null);
/* A table's moves come with tiers when its menu holds more than one pair. */
const tiered = (tab) => !!(tab.c && tab.c.acts && tab.c.acts.some(a => (a.tierPen || 0) > 0 || (a.tierIsa || 0) > 0));
/* The tier name a table gives index k of its pension or ISA list, as the engine names it (App.jsx tierOf checks it). */
const tierName = (tab, cat, k) => (tab.c && tab.c.tiers && tab.c.tiers[cat] && tab.c.tiers[cat][k] ? tab.c.tiers[cat][k].name : null);

/* One table's expected future cut cost at a position, read as the single chooser reads it (scoreMoves: readValues' fourth
 * output, the `short` table over the same corners as survival). */
const CUT_RD = new Float64Array(4);
function cutAhead(tab, s, t, layer = null) {
  const k = Math.min(t, tab.m.ctx.totalYears), L = layer !== null ? tab.tsLayers[layer] : tab;
  readValues(tab.g, L.lsurv[k], L.beq[k], s, CUT_RD, L.lresil[k], L.short[k], k);
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
const SHARE = new Float64Array(4), AT = new Float64Array(3);
/* D2.4's bounds on x (the money moved from the second person to the first; below 0 the other way): what the giver holds,
 * and the receiver's floor bills ahead to their access, counted only where the receiver's own table reads a bridge year. */
export function shareBounds(cp, g, k, bA, bB) {
  const { m } = cp;
  const accA = accessibleOf(m, g, 'self'), accB = accessibleOf(m, g, 'part');
  const capA = bA && cp.need.self ? Math.max(0, cp.need.self[k] || 0) : 0, capB = bB && cp.need.part ? Math.max(0, cp.need.part[k] || 0) : 0;
  return [-Math.min(accA, capB), Math.min(accB, capA)];
}
/* The couple's state with x moved (shareBounds' sign). */
export const sharedState = (cp, g, x) => (x > 0 ? movedState(cp.M, cp.m, g, 'part', 'self', x) : x < 0 ? movedState(cp.M, cp.m, g, 'self', 'part', -x) : g);
/*
 * D2.4's share: the x within shareBounds that does best by `at(state, o)` (the expectation's integrand into o[0], with both
 * lasting into o[1] and the cut ahead into o[2]): nine points and x = 0, then a golden-section refinement in the best
 * point's bracket. out: the integrand, both lasting and the cut ahead at the best x, and x.
 */
export function shareBridge(cp, g, k, bA, bB, at, out) {
  const [lo, hi] = shareBounds(cp, g, k, bA, bB);
  let bx = 0, bv = at(g, AT), b1 = AT[1], b2 = AT[2];
  const tryX = (x) => { const v = at(sharedState(cp, g, x), AT); if (v > bv) { bv = v; bx = x; b1 = AT[1]; b2 = AT[2]; } return v; };
  if (hi - lo > 1) {
    const N = 8, xs = [];
    for (let i = 0; i <= N; i++) xs.push(lo + (hi - lo) * i / N);
    const vs = xs.map(tryX);
    let ib = 0; for (let i = 1; i <= N; i++) if (vs[i] > vs[ib]) ib = i;
    // golden-section within the best grid point's neighbours
    let a = xs[Math.max(0, ib - 1)], c = xs[Math.min(N, ib + 1)];
    const R = (Math.sqrt(5) - 1) / 2;
    let x1 = c - R * (c - a), x2 = a + R * (c - a), f1 = tryX(x1), f2 = tryX(x2);
    for (let it = 0; it < 10 && c - a > 1; it++) {
      if (f1 >= f2) { c = x2; x2 = x1; f2 = f1; x1 = c - R * (c - a); f1 = tryX(x1); } else { a = x1; x1 = x2; f1 = f2; x2 = a + R * (c - a); f2 = tryX(x2); }
    }
  }
  out[0] = bv; out[1] = b1; out[2] = b2; out[3] = bx;
}

export function expectedValue(cp, post, t, out = null, pick = null) {
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
      m.ctx.accounts.forEach(a0 => {
        const a = M_profileOf(m, post, a0);   // each pension and ISA at its person's tier held after the move (D2)
        const vol = A.c.shiftMode ? a.vol : foldedVol(a.vol, a.sigmaParam, T - t + 1);
        rates[a0.id] = Math.exp(Math.log(1 + a.real) + (A.c.shiftMode ? a.sigmaParam * shifts[j] : 0) + vol * QZ[k]) - 1;
      });
      const g = M.cloneState(post);
      M.grow(m, g, t, rates);
      // each person read at the tier pair their move goes to (D2: the tier state's layer; `pick` the two moves)
      const LA = pick ? layerOf(mixA[j], pick.ia) : null, LB = pick ? layerOf(mixB[j], pick.ib) : null;
      // both must last: survival multiplies; the resilience term likewise; the bequest is the household's; one cut, counted once
      const at = (gg, o) => {
        const sA = vecOf(mixA[j].m, ownerState(gg, 'self')), sB = vecOf(mixB[j].m, ownerState(gg, 'part'));
        const vA = mixA[j].value(sA, t + 1, LA), vB = mixB[j].value(sB, t + 1, LB);
        const h = cut ? (cutAhead(mixA[j], sA, t + 1, LA) + cutAhead(mixB[j], sB, t + 1, LB)) / 2 : 0;
        o[0] = vA.survival * vB.survival + A.wR * vA.resilience * vB.resilience + A.wB * (vA.bequest + vB.bequest) - h; o[1] = vA.survival * vB.survival; o[2] = h;
        return o[0];
      };
      // D2.4: in a bridge year, the two people's accessible money shared between them as best serves both (shareBridge)
      const k1 = Math.min(t + 1, T), bA = bridgeAt(mixA[j], k1), bB = bridgeAt(mixB[j], k1);
      if ((bA || bB) && !planted('ownmoney')) shareBridge(cp, g, k1, bA, bB, at, SHARE); else at(g, SHARE);
      const w = wJ[j] * QW[k];
      total += w * SHARE[0];
      both += w * SHARE[1];
      ahead += w * SHARE[2];
    }
  }
  if (out) { out[0] = both; out[1] = ahead; }
  return total;
}

/*
 * One person's K best moves where they stand, ranked as their own table's chooser ranks them (solve.js chooseAction): with
 * the tiers they hold, the round trip charged in the flows, and a move that leaves those tiers paying the table's
 * `switchCharge` (score units). Without a tier state or a charge (the archive's pilot, a mixture), rankActions as before.
 */
export function rankFor(tab, s, t, held, K) {
  const sc = held && !planted('nocharge') ? tab.switchCharge || 0 : 0;
  // D3: a dial position solved on its base's tiers (lockTiers) keeps each person to the pair their base's own chooser picks
  // where they stand, as chooseAction's lockMask does a single's; where every move there fails, the base's own move. Plant 'nolock'
  const LK = tab.lockTiers && held && !planted('nolock') ? tab.lockTiers : null;
  if (!(sc > 0) && !LK) return rankActions(tab, s, t, held, K);
  const n = tab.actions.length, SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), acts = tab.c.acts;
  const tt = tab.finalExact ? t : Math.min(t, tab.m.ctx.totalYears - 1);
  if (tab.mix) {
    // the mixture as chooseAction scores it: each table's score weighted, a move that fails in any table failing
    const S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
    tab.mix.tables.forEach((tb, k) => {
      scoreMoves(tb, s, tt, S2, T2, B2, held);
      const w = tab.mix.weights[k];
      for (let ai = 0; ai < n; ai++) { if (S2[ai] === -Infinity || SC[ai] === -Infinity) SC[ai] = -Infinity; else SC[ai] += w * S2[ai]; BQ[ai] += w * B2[ai]; }
    });
  } else scoreMoves(tab, s, tt, SC, TX, BQ, held);
  if (LK) {
    const ac = chooseAction(LK.rc, s, t, held), lj = tab.tsLayerOf[ac];
    let any = false;
    for (let ai = 0; ai < n; ai++) { if (tab.tsLayerOf[ai] !== lj) SC[ai] = -Infinity; else if (SC[ai] > -Infinity) any = true; }
    if (!any) return [ac];
  }
  const idx = [];
  for (let ai = 0; ai < n; ai++) {
    if (!(SC[ai] > -Infinity)) continue;
    if ((acts[ai].tierPen || 0) !== held.pen || (acts[ai].tierIsa || 0) !== held.isa) SC[ai] -= sc;
    idx.push(ai);
  }
  idx.sort((a, b) => (SC[b] - SC[a]) || (BQ[b] - BQ[a]));
  return idx.slice(0, K);
}

/* The joint move for one year: the split and each person's move, by one-step rollout. */
export function chooseJoint(cp, state, t) {
  const { m, M, tables, splits, topK } = cp;
  const T = m.ctx.totalYears;
  const sA = vecOf(tables.self.m, ownerState(state, 'self')), sB = vecOf(tables.part.m, ownerState(state, 'part'));
  // each person ranked with the tiers they hold (D2: the switch charged in their flows, as a single's chooser charges it)
  const A = tables.self, B = tables.part, tA = tiered(A), tB = tiered(B);
  const heldOf = (who) => (state.tierHeld && state.tierHeld[who] ? { pen: state.tierHeld[who].pen || 0, isa: state.tierHeld[who].isa || 0 } : { pen: 0, isa: 0 });
  const hA = heldOf('self'), hB = heldOf('part');
  const kA = rankFor(A, sA, t, tA ? hA : null, topK), kB = rankFor(B, sB, t, tB ? hB : null, topK);
  const tiersOf = (tab, a, on) => (on ? { tierPen: a.tierPen || 0, tierIsa: a.tierIsa || 0, tierPenName: tierName(tab, 'pen', a.tierPen || 0), tierIsaName: tierName(tab, 'isa', a.tierIsa || 0) } : {});
  // a move that leaves the tiers its person holds pays that table's charge in score units (chooseAction's `switchCharge`)
  const leaves = (a, h) => (a.tierPen || 0) !== h.pen || (a.tierIsa || 0) !== h.isa;
  const lvl = (tab, i) => (tab.levelOf ? tab.levelOf[i] : tab.actions[i].spendLevel !== undefined ? tab.actions[i].spendLevel : 1);
  const first = planted('firstlevel'), cut = !planted('nocut'), raiseSurv = !!tables.self.raiseSurvival;
  const ev = new Float64Array(2);
  let best = null, bestScore = -Infinity;
  for (const split of splits) for (const ia of kA) for (const ib of kB) {
    const aA = A.actions[ia], aB = B.actions[ib];
    // D1: the household's level from either person's ranked move (the first person's first), each valued by both tables
    const levels = first ? [aA.spendLevel] : [...new Set([lvl(tables.self, ia), lvl(tables.part, ib)])];
    for (const level of levels) {
      const joint = {
        steps: aA.steps, costSteps: aA.costSteps || aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', sweepCash: true, lump: !!aA.lump, contrib: null,
        spendLevel: level, split, switchCost: cp.switchCost || 0,
        perOwner: { self: { steps: aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', ...tiersOf(A, aA, tA) }, part: { steps: aB.steps, harvest: !!aB.harvest, harvestCeil: aB.harvestCeil || 'pa', ...tiersOf(B, aB, tB) } },
        ia, ib
      };
      const st = M.cloneState(state);
      const row = M.step(m, st, joint, t, null, true);
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) continue;
      // D1: this year's cut, counted once for the household; a raise's credit weighted by the chance both last (raiseSurvival)
      const cst = cut ? cutCostOf(cp, level !== undefined ? level : 1, t) : 0, rz = raiseSurv && cst < 0;
      const swc = planted('nocharge') ? 0 : (tA && leaves(aA, hA) ? A.switchCharge || 0 : 0) + (tB && leaves(aB, hB) ? B.switchCharge || 0 : 0);
      let score;
      if (t >= T) {
        const total = Object.values(st.pots).reduce((a, b) => a + b, 0), alive = total >= (m.ctx.solvencyFloor || 0) ? 1 : 0;
        score = alive + 1e-9 * total - (rz ? cst * alive : cst) - swc;
      } else {
        const v = expectedValue(cp, st, t, ev, { ia, ib });
        score = v - (rz ? cst * ev[0] : cst) - swc;
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
    best = { steps: aA.steps, costSteps: aA.costSteps || aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', sweepCash: true, lump: !!aA.lump, contrib: null, spendLevel: aA.spendLevel, split: 0.5, switchCost: cp.switchCost || 0, perOwner: { self: { steps: aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', ...tiersOf(A, aA, tA) }, part: { steps: aB.steps, harvest: !!aB.harvest, harvestCeil: aB.harvestCeil || 'pa', ...tiersOf(B, aB, tB) } }, ia: kA[0] || 0, ib: kB[0] || 0 };
  }
  return best;
}

/* The engine's own market for a couple's forward run: one yearly draw for every wrapper, one held shift per path; each pension
 * and ISA at its person's tier held when `state` is given (Part D, D2: the profile the engine grows it at). */
export function ratesFor(m, zs, t, state = null) {
  const T = m.ctx.totalYears;
  const zp = zs.length > T + 1 ? zs[T + 1] : 0;
  const rates = {};
  m.ctx.accounts.forEach(a => { const p = state ? M_profileOf(m, state, a) : a; rates[a.id] = Math.exp(Math.log(1 + p.real) + p.sigmaParam * zp + p.vol * zs[t]) - 1; });
  return rates;
}
/* The same as a function of the state after the year's switch, for model.js step (which grows at the tier then held). */
export const ratesAt = (m, zs, t) => (state) => ratesFor(m, zs, t, state);

/* One path under the rollout policy, in the exact reduced model; `trace`, when given, gets each year's joint move. */
export function runCouplePolicy(cp, zs, trace = null) {
  const { m, M } = cp;
  const T = m.ctx.totalYears;
  const state = M.initialState(m);
  let tax = 0, splitSum = 0, splitYears = 0, uneven = 0;
  for (let t = 0; t <= T; t++) {
    const joint = chooseJoint(cp, state, t);
    if (trace) trace.push(joint);
    const row = M.step(m, state, joint, t, ratesAt(m, zs, t));
    tax += row.taxPaid + row.cgtPaid;
    if (row.netDrawdown > 0) { splitSum += joint.split; splitYears++; if (Math.abs(joint.split - 0.5) > 1e-9) uneven++; }
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, preAccess: !!row.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax, splitMean: splitYears ? splitSum / splitYears : 0.5, unevenYears: uneven };
  }
  const total = Object.values(state.pots).reduce((a, b) => a + b, 0);
  const penTotal = m.ctx.accounts.filter(a => a.cat === 'pen').reduce((a, x) => a + (state.pots[x.id] || 0), 0);
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + T, terminalNet: 0, terminal: 0, lifetimeTax: tax, splitMean: splitYears ? splitSum / splitYears : 0.5, unevenYears: uneven };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - penTotal * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax, splitMean: splitYears ? splitSum / splitYears : 0.5, unevenYears: uneven };
}

/*
 * THE ENGINE UNDER A SOLVED COUPLE (Part D, D2): a table policy for src/App.jsx stepYear, as bridge.js tablePolicy is for a
 * single. Each year the engine's state is read as the exact model's (the pots, each person's basis, gains carried, tax-free
 * cash, lump sum, cash ISA and the tiers each holds) and the rollout's joint move is returned; the engine carries it as the
 * model's year does (D2.1, D2.2). The engine runs with guardrails and the lookahead off, as under a single's table.
 */
export function couplePolicy(cp) {
  return {
    kind: 'table',
    choose(engineState, t) {
      const tierHeld = {};
      // plant 'noheld' (couple-tables.test.mjs): the tiers read as the plan's own whatever the engine holds
      for (const o of cp.m.ctx.owners) { const h = planted('noheld') ? null : engineState.tierHeld && engineState.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
      const state = {
        pots: { ...engineState.pots }, basis: { ...engineState.giaBasis }, cgtCarry: { ...engineState.cgtCarry }, cumPcls: { ...engineState.cumPcls },
        lumpTaken: { ...engineState.lumpSumTaken }, cashIsa: { ...(engineState.cashIsa || {}) }, guard: null, tierHeld
      };
      return chooseJoint(cp, state, t);
    },
    switchCost: cp.switchCost || 0,
    tiersBelow: cp.tiersBelow || 2
  };
}
export function withCouple(plan, cp) {   // `plan` the household's as solved (cp.plan: its minimum pot set)
  return { ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: couplePolicy(cp) } };
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
