/*
 * THE STRATEGY TAB'S FIGURES (Part C Phase 9; the launch plan section 4; the wording PART-C-WORDING.md, B4 in D51).
 *
 * Everything here is the engine's own simulation of a solved plan, never the table's forecast: each path is stepped by
 * E.stepYear with the table as the plan's policy (src/solver/bridge.js withTable), with runTrial's rule for a failure
 * (spending unmet beyond FAIL_TOLERANCE, or insolvent before pension access, or under the minimum pot at the end) and
 * summarizeTrials's quantile. Loaded by the solver's worker only (src/solverWorker.js), and by the tests in Node.
 *
 *   const s = strategyOf(E, solved, plan, { trials, seed });   // solved: solveForApp's result; plan: the plan as entered
 *   const runs = strategyRuns(E, solved, plan, { seed, from, to });   // paths from..to-1 of the seed, both arms
 *   const s = strategySummary(E, solved, joinRuns([a, b]));    // the same figures from runs gathered in parts, in path order
 *   s.headline   { startLevel, startSpend, target, retireT, retired, backT, backYear, backIn, dip, survival, delivered, case }
 *   s.compare    { yours, solved }: each { survival, medianPot, p10Pot, lifetimeTax, estate } on the same paths
 *   s.raise      { level, age } | null: the first year the fan's upper quartile spends above the target (wording section 4)
 *   actionsOf(E, solved, plan, { seed, n, base, parts })   this year's move, part by part, each with the survival cost of
 *                                                    skipping it; skipRuns and joinSkipRuns its paths split across parts
 *   aheadOf(E, solved, runs, { years })             the next years' moves on the median path
 *   rowsOf(E, solved, market)                       one market's run year by year, each year's move taken apart (Phase 10:
 *                                                    the audit table's 'expected' ledger, history's out-of-model check)
 *
 * "Your plan" is D18's baseline: the plan as entered, with the policy it carries (its own withdrawal policy, guardrails and
 * lookahead), else the plain draw order the engine runs. Both arms run on pathsForSeed(seed, trials, years), path for path.
 */
import { withTable, modelStateOf } from './solver/bridge.js';
import { rankActions, wholeMenu } from './solver/solve.js';
import { vecOf } from './solver/grid.js';
import { PLANNER_PLANT } from './plannerPlant.js';

/* the wording's cases (PART-C-WORDING.md sections 1 and 2; B4: the length of the dip, three years) */
export const DIP_YEARS = 3;
export const CASES = ['atTarget', 'short', 'long', 'never'];
/* research/tests/solver-strategy.test.mjs only: a planted fault in one rule ('dip' the edge a year early, 'topq' the quantile
   from the top, 'failback' a failed path counted as back, 'raiseall' the raise on every path whatever its end; rowsOf's
   'rowsfirst' the first year's move given for every year, 'rowsexp' the market ignored for the expected path) */
export const PLANT = { rule: '' };

/* the plan as entered, as the projection runs it (src/mcWorker.js: resolveMpaa, then buildContext) */
export const yourContext = (E, plan) => E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
/* the solved plan, as the worker's 'simulate' runs it */
export const solvedContext = (E, solved) => E.buildContext(withTable(solved.m.ctx.plan, solved));

/*
 * One path through the engine: runTrial's outcome (survived, the terminal pot, net of the pension's death tax, the lifetime
 * tax) and, per year, the level spent as a percentage of the year's target (0 in a year with no target).
 */
export function runPath(E, ctx, zs) {
  const state = E.freshState(ctx), T = ctx.totalYears, Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
  const level = new Uint16Array(Y);
  // the money each year, all wrappers, as runTrial's kept path records it (Math.max(0, totalCombined), in doubles), so the
  // outlook's money bands are the engine's monteCarlo bands bit for bit (step U, LAYOUT.md section 11.3)
  const wealth = PLANT.rule === 'f32' ? new Float32Array(Y) : new Float64Array(Y);
  let failed = false, failT = -1, tax = 0, delivered = 0, target = 0, last = null;
  for (let t = 0; t <= T; t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    wealth[t] = Math.max(0, row.totalCombined);
    tax += row.taxPaid + (row.cgtPaid || 0);
    const unmet = Math.max(0, row.unmetDemand || 0);
    if (row.targetSpend > 0) {
      const sched = E.spendTargetAtAge(ctx, row.ageSelf);
      if (sched > 0) { level[t] = Math.round(100 * row.targetSpend / sched); target += sched; delivered += Math.max(0, row.targetSpend - unmet); }
    }
    if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failT = t; }
    last = row;
  }
  const terminalPot = Math.max(0, last.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && terminalPot < ctx.solvencyFloor) { failed = true; failT = T; }
  const terminalPotNet = Math.max(0, terminalPot - Math.max(0, last.pensions) * ctx.pensionDeathTaxRate);
  return { survived: !failed, failT, terminalPot, terminalPotNet, lifetimeTax: tax, delivered, target, level, wealth };
}

/* summarizeTrials's quantile, so a figure here is the same number the projection would print */
const q = (sorted, p) => (sorted.length ? sorted[PLANT.rule === 'topq' ? Math.max(0, sorted.length - 1 - Math.floor(sorted.length * p)) : Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
const sortedOf = (rs, f) => rs.map(f).sort((a, b) => a - b);

export function compareOf(rs) {
  const n = rs.length;
  return {
    survival: (100 * rs.filter(r => r.survived).length) / n,
    medianPot: q(sortedOf(rs, r => r.terminalPot), 0.5), p10Pot: q(sortedOf(rs, r => r.terminalPot), 0.1),
    lifetimeTax: q(sortedOf(rs, r => r.lifetimeTax), 0.5), estate: q(sortedOf(rs, r => r.terminalPotNet), 0.5)
  };
}

/* the first year with a target: the first retired year (the same on every path: the schedule does not depend on markets) */
/* (the engine counts year t as retired when the age then is the retirement age or above: age0 + t >= retireAge) */
export const retireYearOf = ctx => Math.max(0, Math.min(ctx.totalYears, Math.ceil(ctx.owners[0].retireAge - ctx.ageSelf0)));

/*
 * The headline (wording section 1): the safe starting spend, which is the first retired year's level (for a household already
 * retired, the table's first move, the same on every path; for one still working, the median over the paths alive then,
 * "when you retire"); the year the median path is back at target (each path's first retired year at the target or above,
 * before it fails; never on a path that does not get back; the median over the paths); the chance the money lasts; and the
 * spending delivered beside it, as a share of the target over the plan.
 */
export function headlineOf(E, ctx, rs, retireT) {
  const n = rs.length, alive = rs.filter(r => r.failT < 0 || r.failT > retireT);
  const starts = sortedOf(alive.length ? alive : rs, r => r.level[retireT]);
  const startLevel = q(starts, 0.5);
  const backs = sortedOf(rs, r => {
    for (let t = retireT; t <= ctx.totalYears; t++) { if (r.failT >= 0 && t >= r.failT && PLANT.rule !== 'failback') return Infinity; if (r.level[t] >= 100) return t; }
    return Infinity;
  });
  const backT = q(backs, 0.5);
  const target = E.spendTargetAtAge(ctx, ctx.ageSelf0 + retireT);
  const dip = Number.isFinite(backT) ? backT - retireT : Infinity;
  const kase = startLevel >= 100 ? 'atTarget' : !Number.isFinite(backT) ? 'never' : dip > DIP_YEARS - (PLANT.rule === 'dip' ? 1 : 0) ? 'long' : 'short';
  const tgt = rs.reduce((a, r) => a + r.target, 0);
  return {
    startLevel, startSpend: Math.round((startLevel / 100) * target), target, retireT, retired: retireT === 0,
    backT: Number.isFinite(backT) ? backT : null, backYear: Number.isFinite(backT) ? ctx.baseYear + backT : null,
    backIn: Number.isFinite(backT) ? dip : null, dip: Number.isFinite(dip) ? dip : null,
    survival: (100 * rs.filter(r => r.survived).length) / n,
    delivered: tgt > 0 ? (100 * rs.reduce((a, r) => a + r.delivered, 0)) / tgt : 100,
    case: kase
  };
}

/*
 * The late raise (wording section 4): the first year the fan's upper quartile, over the paths not yet failed, spends above
 * the target; its level is that quartile's. Never on a path heading for ruin: a year counts only where the paths alive in it
 * mostly survive to the end (the presentation rule of the Phase 4 deep review).
 */
export function raiseOf(ctx, rs, retireT) {
  for (let t = retireT; t <= ctx.totalYears; t++) {
    const alive = rs.filter(r => r.failT < 0 || r.failT > t);
    if (!alive.length) return null;
    const lv = sortedOf(alive, r => r.level[t]), up = q(lv, 0.75);
    if (up > 100 && (PLANT.rule === 'raiseall' || alive.filter(r => r.survived).length * 2 > alive.length)) {
      return { level: up, age: ctx.ageSelf0 + t, t };
    }
  }
  return null;
}

/*
 * THE OUTLOOK (step U, LAYOUT.md section 3.1): Your plan's two charts, from the headline's own runs, so they cost no second
 * simulation and sit on the same paths as the headline and the comparison. Each uses summarizeTrials's quantile (q above).
 *   spendBandsOf(ctx, rs, retireT)  each retired year's spending as a share of its target, over the paths still going in it
 *                                   (not failed by then, as raiseOf counts them): { t, age, n, p10, p25, p50, p75, p90 }
 *   typicalOf(runs, k)              the typical run's levels, path k's (aheadOf's path, picked over the first step's paths)
 *   wealthBandsOf(rs)               the money each year over every path, failed ones at zero: monteCarlo's bands, bit for bit
 * research/tests/planner-figures.test.mjs plants: 'bandyear' the money's bands read a year out, 'armswap' the arms' money
 * swapped, 'failcount' a failed path's spending counted after it fails, 'typmedian' the typical run as each year's median,
 * 'f32' the money recorded as Float32 (in runPath); the worker's 'typall' the typical run picked over every path held.
 */
export function spendBandsOf(ctx, rs, retireT) {
  const out = [];
  for (let t = retireT; t <= ctx.totalYears; t++) {
    const alive = PLANT.rule === 'failcount' ? rs : rs.filter(r => r.failT < 0 || r.failT > t);
    if (!alive.length) break;
    const lv = sortedOf(alive, r => r.level[t]);
    out.push({ t, age: ctx.ageSelf0 + t, n: alive.length, p10: q(lv, 0.1), p25: q(lv, 0.25), p50: q(lv, 0.5), p75: q(lv, 0.75), p90: q(lv, 0.9) });
  }
  return out;
}
export const typicalOf = (runs, k) => (PLANT.rule === 'typmedian'
  ? Array.from(runs.solved[0].level, (_, t) => q(sortedOf(runs.solved, r => r.level[t]), 0.5))
  : Array.from(runs.solved[k].level));
export function wealthBandsOf(rs) {
  const n = rs.length;
  if (!n) return [];
  const years = rs[0].wealth.length, col = new Float64Array(n), out = [];
  for (let t = 0; t < years; t++) {
    const tt = PLANT.rule === 'bandyear' ? Math.min(years - 1, t + 1) : t;
    for (let i = 0; i < n; i++) col[i] = rs[i].wealth[tt];
    col.sort();
    out.push({ t, p10: q(col, 0.10), p25: q(col, 0.25), p50: q(col, 0.50), p75: q(col, 0.75), p90: q(col, 0.90) });
  }
  return out;
}
export function outlookOf(ctx, runs, retireT) {
  // the browser's plant (research/ui-harnesses/solver-projection-ui.cjs, PROJECTION_PLANT=outlookswap) is the Node test's armswap
  const [a, b] = PLANT.rule === 'armswap' || PLANNER_PLANT.has('outlookswap') ? [runs.yours, runs.solved] : [runs.solved, runs.yours];
  return { spend: spendBandsOf(ctx, runs.solved, retireT), wealth: { solved: wealthBandsOf(a), yours: wealthBandsOf(b) } };
}

/*
 * The paths from..to-1 of `seed` (pathsForSeed's: path i is the same whatever the count asked), through both arms. The
 * worker keeps these and adds to them (the headline on 2,000 paths, then 5,000: the launch plan), and a split simulation
 * gathers them from the parts in path order (joinRuns), so the figures are the whole run's bit for bit.
 */
export function strategyRuns(E, solved, plan, { seed = 12345, from = 0, to = 2000 } = {}) {
  const sc = solvedContext(E, solved), yc = yourContext(E, plan);
  if (sc.totalYears !== yc.totalYears) throw new Error(`strategyRuns: the solved plan runs ${sc.totalYears} years and yours ${yc.totalYears}`);
  const paths = E.pathsForSeed(seed, to, sc.totalYears).slice(from);
  return { seed, from, to, solved: paths.map(zs => runPath(E, sc, zs)), yours: paths.map(zs => runPath(E, yc, zs)) };
}
export function joinRuns(parts) {
  const ps = [...parts].sort((a, b) => a.from - b.from);
  for (let i = 1; i < ps.length; i++) if (ps[i].from !== ps[i - 1].to || ps[i].seed !== ps[0].seed) throw new Error('joinRuns: the parts do not meet in path order on one seed');
  return { seed: ps[0].seed, from: ps[0].from, to: ps[ps.length - 1].to, solved: ps.flatMap(p => p.solved), yours: ps.flatMap(p => p.yours) };
}
/*
 * The owner's answer to 'strategy' (src/solverWorker.js; here so a test runs the same code, research/tests/solver-client.test.mjs):
 * `held` the paths run so far ({ r, plan, runs }, or null), `data` the ask ({ plan, seed, upto, exact, runs }). The paths held
 * for this solve, plan and seed are kept and only the rest run; the parts' shares (`runs`) are joined in path order first,
 * and a share that does not start where the held paths end is refused (joinRuns), never joined twice. Returns the paths
 * held after it and the figures; on a refusal the paths held before stay as they were.
 */
export function strategyAnswer(E, solved, held, data) {
  const planKey = JSON.stringify(data.plan), seed = data.seed;
  let h = held && held.r === solved && held.plan === planKey && held.runs.seed === seed ? held
    : { r: solved, plan: planKey, runs: strategyRuns(E, solved, data.plan, { seed, from: 0, to: 0 }) };
  if (data.runs && data.runs.length) h = { ...h, runs: joinRuns([h.runs, ...data.runs]) };
  if (data.upto > h.runs.to) h = { ...h, runs: joinRuns([h.runs, strategyRuns(E, solved, data.plan, { seed, from: h.runs.to, to: data.upto })]) };
  // exact: the figures of the first `upto` paths alone, though more have been run (the dial's line, Phase 10)
  return { held: h, strategy: strategySummary(E, solved, data.exact ? headRuns(h.runs, data.upto) : h.runs) };
}
/* the first n paths of runs gathered from path 0 (Phase 10: the dial's line reads exactly the paths its other settings run,
   whatever the Strategy tab has run since) */
export const headRuns = (runs, n) => (runs.from !== 0 ? (() => { throw new Error('headRuns: the runs do not start at path 0'); })()
  : runs.to <= n ? runs : { ...runs, to: n, solved: runs.solved.slice(0, n), yours: runs.yours.slice(0, n) });
export function strategySummary(E, solved, runs) {
  const sc = solvedContext(E, solved), retireT = retireYearOf(sc);
  return { trials: runs.solved.length, seed: runs.seed, headline: headlineOf(E, sc, runs.solved, retireT), compare: { yours: compareOf(runs.yours), solved: compareOf(runs.solved) }, raise: raiseOf(sc, runs.solved, retireT), outlook: outlookOf(sc, runs, retireT) };
}
/* the whole tab's first figures, on `trials` paths of `seed` */
export const strategyOf = (E, solved, plan, { trials = 2000, seed = 12345 } = {}) => strategySummary(E, solved, strategyRuns(E, solved, plan, { seed, from: 0, to: trials }));

/*
 * THIS YEAR'S ACTIONS (the launch plan's Phase 9, item 4): the table's move in the first year, the same on every path (the
 * opening position is), taken apart: the spending level, the draw order's start, the re-wrap (harvest) and each wrapper's
 * risk tier. Each part's skip is the best-scoring move this year that differs from the chosen one in that part (the table's
 * own ranking at the opening position, solve.js rankActions), then the plan from the next year on; its cost is the paired
 * survival on the same n paths, the plan's against the skip's, in points. A part the move does not take (the plan's own tier,
 * no re-wrap) is not an action and has no skip.
 */
const DRAW_PREFIX = { penPAm: 'pa-half', penPA: 'pa', penBm: 'basic-mid', penBasic: 'basic', penHR: 'hr', penAny: 'any' };
export function partsOf(a, ca) {
  const firstPen = a.steps.findIndex(x => x.startsWith('pen'));
  const lead = a.steps.slice(0, firstPen < 0 ? 0 : a.steps.findIndex(x => !x.startsWith('pen'))).filter(x => x.startsWith('pen'));
  return {
    level: a.spendLevel !== undefined ? a.spendLevel : 1,
    draw: lead.length ? DRAW_PREFIX[lead[lead.length - 1]] || lead[lead.length - 1] : 'none',
    isaFirst: a.steps.indexOf('isa') < a.steps.indexOf('other'),
    harvest: a.harvest ? a.harvestCeil || 'pa' : null,
    tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0
  };
}
/* the move as the engine takes it from the table (src/solver/bridge.js tablePolicy's choose), for move ai */
export function moveOf(r, ai, like) {
  const a = r.actions[ai], ca = r.c.acts[ai], m = {
    ...like, steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump,
    sweepCash: a.sweepCash !== false, spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0,
    index: ai, tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name
  };
  for (const k of ['cgtSale', 'windfall', 'save', 'sweepIsa']) { if (a[k]) m[k] = a[k]; else delete m[k]; }
  return m;
}
/*
 * A DECISION THE PAGES SHOW IS MADE ON THE WHOLE MENU (D90; src/solver/solve.js wholeMenu). Where a solve carries the
 * chooser's shortlist (`chooserShortlist`, an approximation for the paths that only count), the table policy a page reads
 * its moves from scores every move: this year's actions (firstMove), the next years' rows and the typical run (aheadOf), the
 * ledger and the history check (rowsOf), and the decisions the rule of thumb is learnt from (src/solverDistil.js
 * decisionsOf). The paths that are counted (strategyRuns, skipRuns after the forced first year, the rule of thumb's cost)
 * keep the solve's own policy. With no shortlist on the solve it is the same policy, decision for decision
 * (research/tests/shortlist-shown.test.mjs).
 */
export const shownPolicy = base => ({ ...base, choose: (st, t, held) => wholeMenu(() => base.choose(st, t, held)) });
/* the first year's move as the engine chose it, the position it was chosen at, and the table policy's own object */
export function firstMove(E, solved) {
  const sc = solvedContext(E, solved), base = sc.policyOverride, T = sc.totalYears, shown = shownPolicy(base);
  let rec = null;
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { const mv = shown.choose(st, t, held); if (t === 0 && !rec) rec = { mv, s: vecOf(solved.m, modelStateOf(st)), held: held ? { pen: held.pen, isa: held.isa } : null }; return mv; } } };
  E.runTrial(ctx, E.pathsForSeed(1, 1, T)[0]);
  return { ...rec, sc, base };
}
export const SKIP_PARTS = ['level', 'draw', 'harvest', 'tierPen', 'tierIsa'];
/* this year's skips: the move taken apart and, for each part it takes, the best-ranked move that differs in that part (null
 * where none does) */
export function skipsOf(E, solved) {
  const f = firstMove(E, solved), ai0 = f.mv.index, p0 = partsOf(solved.actions[ai0], solved.c.acts[ai0]);
  const ranked = rankActions(solved, f.s, 0, f.held, solved.actions.length), list = [];
  for (const part of SKIP_PARTS) {
    const taken = part === 'level' ? p0.level !== 1 : part === 'draw' ? p0.draw !== 'none' : part === 'harvest' ? p0.harvest !== null : p0[part] > 0;
    if (!taken) continue;
    const skip = ranked.find(ai => { const p = partsOf(solved.actions[ai], solved.c.acts[ai]); return part === 'draw' ? p.draw !== p0.draw : p[part] !== p0[part]; });
    list.push({ part, value: p0[part], skip: skip === undefined ? null : skip });
  }
  return { f, ai0, p0, list };
}
/*
 * The skips' runs on paths from..to-1 of `seed`: each skip forced in the first year, then the plan, survival per path. A split
 * solve's parts each run a share of the paths (src/solverClient.js actions) and the owner joins them in path order
 * (joinSkipRuns), so the skip costs are the whole run's, path for path (research/tests/skip-split.test.mjs).
 */
export function skipRuns(E, solved, { seed = 12345, from = 0, to = 1000 } = {}, sk = skipsOf(E, solved)) {
  const { f, list } = sk, paths = E.pathsForSeed(seed, to, f.sc.totalYears).slice(PLANT.rule === 'skipdrop' && from > 0 ? from + 1 : from);
  return {
    seed, from, to, skips: list.map(x => x.skip),
    survived: list.map(x => {
      if (x.skip === null) return null;
      const forced = { ...f.sc, policyOverride: { ...f.base, choose: (st, t, held) => (t === 0 ? moveOf(solved, x.skip, f.mv) : f.base.choose(st, t, held)) } };
      return Uint8Array.from(paths, zs => (runPath(E, forced, zs).survived ? 1 : 0));
    })
  };
}
export function joinSkipRuns(parts) {
  const ps = [...parts].sort((a, b) => a.from - b.from), key = JSON.stringify(ps[0].skips);
  for (let i = 0; i < ps.length; i++) {
    if (ps[i].seed !== ps[0].seed || JSON.stringify(ps[i].skips) !== key) throw new Error('joinSkipRuns: the parts ran other skips or another seed');
    if (i && ps[i].from !== ps[i - 1].to) throw new Error('joinSkipRuns: the parts do not meet in path order');
    if (ps[i].survived.some(v => v && v.length !== ps[i].to - ps[i].from)) throw new Error('joinSkipRuns: a part ran other than its paths, so they do not meet in path order');
  }
  return {
    seed: ps[0].seed, from: ps[0].from, to: ps[ps.length - 1].to, skips: ps[0].skips,
    survived: ps[0].skips.map((x, j) => (x === null ? null : Uint8Array.from(ps.flatMap(p => Array.from(p.survived[j])))))
  };
}
export function actionsOf(E, solved, plan, { seed = 12345, n = 1000, base = null, parts = null } = {}) {
  const sk = skipsOf(E, solved), { f, ai0, p0 } = sk;
  const runs = parts && parts.length ? joinSkipRuns(parts) : skipRuns(E, solved, { seed, from: 0, to: n }, sk);
  if (runs.from !== 0 || runs.to !== n || runs.seed !== seed) throw new Error(`actionsOf: the skips' runs are paths ${runs.from} to ${runs.to - 1} of seed ${runs.seed}, not 0 to ${n - 1} of ${seed}`);
  if (JSON.stringify(runs.skips) !== JSON.stringify(sk.list.map(x => x.skip))) throw new Error('actionsOf: the parts ran other skips than this solve ranks');
  const planRuns = base && base.length >= n ? base.slice(0, n) : E.pathsForSeed(seed, n, f.sc.totalYears).map(zs => runPath(E, f.sc, zs));
  const out = sk.list.map((x, j) => {
    if (x.skip === null) return { part: x.part, value: x.value, skip: null, cost: null };
    const sv = runs.survived[j];
    let saved = 0, lost = 0;
    for (let k = 0; k < n; k++) { if (planRuns[k].survived && !sv[k]) lost++; else if (!planRuns[k].survived && sv[k]) saved++; }
    return { part: x.part, value: x.value, skip: { index: x.skip, parts: partsOf(solved.actions[x.skip], solved.c.acts[x.skip]) }, cost: (100 * (lost - saved)) / n, lost, saved, n };
  });
  return { move: { index: ai0, parts: p0, label: solved.actions[ai0].label }, actions: out, retired: retireYearOf(f.sc) === 0, sweep: firstSweep(E, f.sc) };
}
/* the first year's sweep (the engine's 7d; the review of 9 Nov, item 5, part 1): cash above the buffer to the taxable account,
   or a shortfall topped up from it. The year's flows before it take no market, so every path sweeps the same amount */
export function firstSweep(E, sc) {
  const row = E.stepYear(sc, E.freshState(sc), 0, 'expected');
  return { toGia: row.sweptToGia || 0, fromGia: row.sweptFromGia || 0, toIsa: row.sweptToIsa || 0 };
}

/*
 * THE NEXT YEARS' ACTIONS (item 5): the moves on the median path, the path at the median of the pot left at the end (by
 * summarizeTrials's quantile over the runs given), from its first year, each year's spending and parts, and the path's levels
 * (the outlook's typical run, typicalOf). The page asks over the strategy's first step of paths (aheadAnswer, `upto`: step U,
 * LAYOUT.md finding L12), so a later visit, with more paths held, follows the same path.
 */
export const aheadAnswer = (E, solved, plan, held, { years = 10, upto = 0 } = {}) =>
  aheadOf(E, solved, plan, upto > 0 && PLANT.rule !== 'typall' ? headRuns(held, upto) : held, { years });
export function aheadOf(E, solved, plan, runs, { years = 10 } = {}) {
  const sc = solvedContext(E, solved), base = sc.policyOverride, n = runs.solved.length;
  const order = runs.solved.map((r, k) => [r.terminalPot, k]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const k = order[Math.min(n - 1, Math.floor(n * 0.5))][1];
  const zs = E.pathsForSeed(runs.seed, k + 1, sc.totalYears)[k], rows = [], shown = shownPolicy(base);
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { const mv = shown.choose(st, t, held); if (t < years) rows.push({ t, age: sc.ageSelf0 + t, year: sc.baseYear + t, parts: partsOf(solved.actions[mv.index], solved.c.acts[mv.index]) }); return mv; } } };
  const state = E.freshState(ctx), zPath = zs.length > sc.totalYears + 1 ? zs[sc.totalYears + 1] : 0;
  for (let t = 0; t < Math.min(years, sc.totalYears + 1); t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    if (rows[t]) Object.assign(rows[t], { spend: row.targetSpend > 0 ? row.targetSpend : 0, pot: Math.max(0, row.totalCombined), swept: { toGia: row.sweptToGia || 0, fromGia: row.sweptFromGia || 0, toIsa: row.sweptToIsa || 0 } });
  }
  // the typical run's levels: path k's as counted, or, where the counted paths took a shortlist, path k run on the whole
  // menu, so the levels shown are those of the rows shown (D90)
  return { path: k, rows, typical: solved.chooserShortlist ? Array.from(runPath(E, { ...sc, policyOverride: shown }, zs).level) : typicalOf(runs, k) };
}

/*
 * ONE MARKET'S RUN OF THE SOLVED PLAN, YEAR BY YEAR (Part C Phase 10, item 7): the engine's own rows (E.stepYear with the
 * table as the plan's policy, as E.simulateDeterministic and E.simulateHistorical step them) and each year's move taken
 * apart (partsOf), for the audit table's expected-return ledger (market 'expected') and the history tab's out-of-model check
 * (market { historical: true, startYear }). parts[t] is null in a year the table chose no move; verdict is E.evaluateRows on the
 * solved plan's own context (its minimum pot), as the history tab reads a run.
 */
export function rowsOf(E, solved, market) {
  const sc = solvedContext(E, solved), base = sc.policyOverride, moves = [], shown = shownPolicy(base);
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { const mv = shown.choose(st, t, held); moves[t] = mv ? partsOf(solved.actions[mv.index], solved.c.acts[mv.index]) : null; return mv; } } };
  const state = E.freshState(ctx), rows = [], m = PLANT.rule === 'rowsexp' ? 'expected' : market;
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(E.stepYear(ctx, state, t, m));
  return { rows, parts: rows.map((_, t) => (PLANT.rule === 'rowsfirst' ? moves[0] : moves[t]) || null), verdict: E.evaluateRows(ctx, rows) };
}
