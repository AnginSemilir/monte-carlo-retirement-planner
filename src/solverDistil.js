/*
 * THE RULE OF THUMB (Part C Phase 9, item 7; the launch plan: "a depth-3 tree with its fidelity, in src/solverDistil.js",
 * outside src/solver so the e3pcls pin does not move). The solved plan's spending level, year by year on the engine's own
 * paths, learnt as a tree of at most three questions a person can answer from a statement: how many years of spending the
 * savings hold, the age, and the pension's share of the savings. Its fidelity is the share of the solved plan's decisions
 * it gives; its cost is the paired survival of following it (the solved plan's own move each year with the tree's level in
 * place of the table's) against the solved plan, on the same paths. The tab shows it only where that cost is under half a
 * point (SHOW_BELOW). Loaded by the solver's worker and the tests.
 *
 *   const d = distilOf(E, solved, plan, { seed, n });   // { tree, rules, fidelity, decisions, cost, lost, saved, n, show }
 */
import { solvedContext, runPath, partsOf, moveOf, shownPolicy } from './solverStrategy.js';

export const SHOW_BELOW = 0.5, DEPTH = 3, CUTS = 24;
export const FEATURES = ['years', 'age', 'penShare'];
/* research/tests/solver-distil.test.mjs only: 'depth1' (a tree of one question) */
export const PLANT = { rule: '' };

/* a year's features from the engine's state at the top of the year */
export function featuresOf(E, ctx, st, t) {
  const age = ctx.ageSelf0 + t, target = E.spendTargetAtAge(ctx, age);
  let total = 0, pen = 0;
  for (const a of ctx.accounts) { const v = Math.max(0, st.pots[a.id] || 0); total += v; if (a.category === 'pension' || /^pen/.test(a.id)) pen += v; }
  return { years: target > 0 ? total / target : 0, age, penShare: total > 0 ? pen / total : 0 };
}

/* the decisions: each retired year of each path, its features and the level the table chose */
export function decisionsOf(E, solved, { seed = 12345, n = 400 } = {}) {
  // the decisions the rule is learnt from are decisions the page shows: made on the whole menu (solverStrategy.js shownPolicy)
  const sc = solvedContext(E, solved), base = shownPolicy(sc.policyOverride), out = [];
  const paths = E.pathsForSeed(seed, n, sc.totalYears);
  for (const zs of paths) {
    const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { const mv = base.choose(st, t, held); if (E.spendTargetAtAge(sc, sc.ageSelf0 + t) > 0 && sc.ageSelf0 + t >= sc.owners[0].retireAge) out.push({ x: featuresOf(E, sc, st, t), y: mv.spendLevel }); return mv; } } };
    E.runTrial(ctx, zs);
  }
  return out;
}

/* a classification tree on the decisions, at most `depth` questions deep, each split the one that gets most right */
const majority = ds => { const c = new Map(); for (const d of ds) c.set(d.y, (c.get(d.y) || 0) + 1); let best = null, k = -1; for (const [y, m] of c) if (m > k || (m === k && y > best)) { best = y; k = m; } return { y: best, right: k }; };
const splitAt = (ds, f, c) => { const lo = [], hi = []; for (const d of ds) (d.x[f] < c ? lo : hi).push(d); return { lo, hi }; };
const scoreAt = (ds, f, c) => { const { lo, hi } = splitAt(ds, f, c); return lo.length && hi.length ? majority(lo).right + majority(hi).right : -1; };
/* the leaves' levels of a subtree, and the subtree as one leaf where they are all one level */
const levelsIn = t => (t.leaf !== undefined ? [t.leaf] : [...levelsIn(t.lo), ...levelsIn(t.hi)]);
export function grow(ds, depth = DEPTH) {
  const leaf = majority(ds);
  if (depth === 0 || leaf.right === ds.length || ds.length < 20) return { leaf: leaf.y, n: ds.length, right: leaf.right };
  let best = null;
  for (const f of FEATURES) {
    const vs = [...new Set(ds.map(d => d.x[f]))].sort((a, b) => a - b);
    const qs = [...new Set(Array.from({ length: CUTS - 1 }, (_, i) => vs[Math.floor(((i + 1) * vs.length) / CUTS)]))];
    let fb = null;
    qs.forEach((c, i) => { const r = scoreAt(ds, f, c); if (r > -1 && (!fb || r > fb.right)) fb = { c, i, right: r }; });
    if (!fb) continue;
    // refined: every value between the best quantile cut's neighbours
    const lo = fb.i > 0 ? qs[fb.i - 1] : vs[0], hi = fb.i + 1 < qs.length ? qs[fb.i + 1] : vs[vs.length - 1];
    for (const c of vs) if (c > lo && c < hi) { const r = scoreAt(ds, f, c); if (r > fb.right) fb = { c, i: fb.i, right: r }; }
    if (!best || fb.right > best.right) best = { f, c: fb.c, right: fb.right };
  }
  if (!best || best.right <= leaf.right) return { leaf: leaf.y, n: ds.length, right: leaf.right };
  const parts = splitAt(ds, best.f, best.c), lo = grow(parts.lo, depth - 1), hi = grow(parts.hi, depth - 1);
  // a subtree whose leaves all give one level is that level: one answer, not a question
  const node = { f: best.f, c: best.c, lo, hi, n: ds.length, right: lo.right + hi.right };
  const lv = new Set(levelsIn(node));
  return lv.size === 1 ? { leaf: [...lv][0], n: ds.length, right: node.right } : node;
}
export const levelOf = (tree, x) => (tree.leaf !== undefined ? tree.leaf : levelOf(x[tree.f] < tree.c ? tree.lo : tree.hi, x));

/* the tree as rules a person reads: each leaf with one range per question asked on the way, rounded for the reader */
const SAY = {
  years: (lo, hi) => `your savings hold ${lo !== null && hi !== null ? `between ${Math.round(lo)} and ${Math.round(hi)}` : lo !== null ? `at least ${Math.round(lo)}` : `less than ${Math.round(hi)}`} years of spending`,
  // ages in whole years: at least c is ceil(c) or over, under c is under ceil(c)
  age: (lo, hi) => `you are ${lo !== null && hi !== null ? `between ${Math.ceil(lo)} and ${Math.ceil(hi) - 1}` : lo !== null ? `${Math.ceil(lo)} or over` : `under ${Math.ceil(hi)}`}`,
  penShare: (lo, hi) => `${lo !== null && hi !== null ? `between ${Math.round(100 * lo)}% and ${Math.round(100 * hi)}%` : lo !== null ? `at least ${Math.round(100 * lo)}%` : `less than ${Math.round(100 * hi)}%`} of your savings are in pensions`
};
export function rulesOf(tree, bounds = {}) {
  if (tree.leaf !== undefined) return [{ when: FEATURES.filter(f => bounds[f]).map(f => SAY[f](bounds[f][0], bounds[f][1])), level: tree.leaf }];
  const [lo0, hi0] = bounds[tree.f] || [null, null];
  return [...rulesOf(tree.lo, { ...bounds, [tree.f]: [lo0, hi0 === null ? tree.c : Math.min(hi0, tree.c)] }),
    ...rulesOf(tree.hi, { ...bounds, [tree.f]: [lo0 === null ? tree.c : Math.max(lo0, tree.c), hi0] })];
}

export function distilOf(E, solved, plan, { seed = 12345, n = 1000, fit = 400, base = null } = {}) {
  const ds = decisionsOf(E, solved, { seed: seed + 1, n: fit });   // learnt on paths apart from those it is judged on
  const tree = grow(ds, PLANT.rule === 'depth1' ? 1 : DEPTH);
  const fidelity = ds.length ? ds.filter(d => levelOf(tree, d.x) === d.y).length / ds.length : 1;
  const sc = solvedContext(E, solved), pol = sc.policyOverride, paths = E.pathsForSeed(seed, n, sc.totalYears);
  // following it: each year the solved plan's own move, with the tree's level in place of the table's
  const byParts = new Map();
  solved.actions.forEach((a, ai) => { const p = partsOf(a, solved.c.acts[ai]); const k = JSON.stringify({ ...p, level: undefined }) + '|' + p.level; if (!byParts.has(k)) byParts.set(k, ai); });
  const follow = { ...sc, policyOverride: { ...pol, choose(st, t, held) {
    const mv = pol.choose(st, t, held);
    if (!(E.spendTargetAtAge(sc, sc.ageSelf0 + t) > 0 && sc.ageSelf0 + t >= sc.owners[0].retireAge)) return mv;
    const lv = levelOf(tree, featuresOf(E, sc, st, t));
    if (lv === mv.spendLevel) return mv;
    const p = partsOf(solved.actions[mv.index], solved.c.acts[mv.index]), j = byParts.get(JSON.stringify({ ...p, level: undefined }) + '|' + lv);
    return j === undefined ? mv : moveOf(solved, j, mv);
  } } };
  const planRuns = base && base.length >= n ? base.slice(0, n) : paths.map(zs => runPath(E, sc, zs));
  let lost = 0, saved = 0;
  paths.forEach((zs, k) => { const s = runPath(E, follow, zs).survived; if (planRuns[k].survived && !s) lost++; else if (!planRuns[k].survived && s) saved++; });
  const cost = (100 * (lost - saved)) / n;
  return { tree, rules: rulesOf(tree), fidelity, decisions: ds.length, cost, lost, saved, n, show: cost < SHOW_BELOW };
}
