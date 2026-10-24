/*
 * MENU GAP (EXPLORATORY, the tuning seed 7002; the external review, 24 Oct: are moves better than the menu's missing from
 * N4?). The candidate's tables are solved over its menu: the pension drawn first to one of three tax corners (the
 * allowance, the basic-rate limit, everything) or not at all; the ISA or the taxable account next; a re-wrap to one of two
 * corners or none; five spend levels; the tier pairs. At each position the candidate's own run visits, this scores a far
 * finer menu of the same kinds of move with the same tables, the same three worlds and the same switch charge (scoreMoves
 * itself, on the solve's own compiled moves with their ceiling or level changed): spend levels in 1% steps, and a
 * draw-first ceiling and a re-wrap ceiling at any taxable income in GBP 2,500 steps. The search starts from the K best menu
 * moves, varies one dimension at a time, then climbs from the best it finds until nothing improves. The same search held
 * to N4's menu (its three ceilings, as a draw-first and as a re-wrap ceiling, at the menu's five levels; the CGT sale
 * aside) splits the gap into what N4's kinds reach and what lies beyond them.
 *
 * The gap at a position is the best finer move's score less the best menu move's, in the score's units (x 100: points of
 * the whole score, the solver's own objective, which N4 reads). Summed along a path it is what one step of policy
 * improvement over the finer menu gains in the tables' own terms (the performance-difference identity, on the menu
 * policy's paths). Then the greedy policies over the finer menu and over N4's run on the same paths as the candidate's, so
 * each gain is also measured in simulated outcomes, paired, in N4's units: one step of improvement on the candidate's own
 * tables, not N4's re-solve. Nothing in src/solver changes: a finer ceiling rides on N4's step code 6 (its ceiling a field
 * of a cloned compiled context) and a finer re-wrap or level on the compiled move's own fields.
 *
 * Checks before the gap is read: (1) the existing menu scored by this file picks the move the candidate's chooser picked
 * at every recorded decision; (2) every finer move that is a menu move scores bit for bit what the menu move scores; (3)
 * CHECK paths run under this file's own chooser reproduce the candidate's run bit for bit; (4) the planted hole: with the
 * basic-rate corner removed from the menu (both as a draw-first ceiling and as a re-wrap), the search must find the gap the
 * hole leaves (its grid has no point at the corner itself).
 *
 * usage (from the root of a copy of the code with the engine built):
 *   node menu-gap.mjs <household> <weight> [paths 1000] [paths for the greedy runs, default the same]
 * env: PTS (45), K (3), CHECK (20 paths), HOLE (200 paths), STEP (2500), OUT (a JSON summary file)
 */
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const { makeTrace } = await imp('research/solver/record.mjs');
const { wholeScore } = await imp('research/solver/reduce-7uf.mjs');
const { SEED, LAMBDA } = await imp('research/solver/v4-ensemble.mjs');

const [id, w = '0.02', nArg = '1000', n1Arg] = process.argv.slice(2);
const N0 = Number(nArg), N1 = Number(n1Arg !== undefined ? n1Arg : nArg);
const PTS = Number(process.env.PTS || 45), K = Number(process.env.K || 3), NCHECK = Number(process.env.CHECK || 20), NHOLE = Number(process.env.HOLE || 200), STEPGBP = Number(process.env.STEP || 2500);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// the candidate's solve, as n4-menu.mjs makes it
const h = buildScenarios().find(s => s.id === id);
if (!h) throw new Error(`no household ${id}`);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const tS = Date.now();
const r = C.solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: Number(w) });
const solveS = (Date.now() - tS) / 1000;
const T = r.m.ctx.totalYears, W = r.mix.tables, WT = r.mix.weights, NW = W.length, centre = W.indexOf(r);
const P = r.c.P, PA = P.pa, HRS = P.higherRateStartsAt, eps = r.eps, sc = r.switchCharge || 0;
if (centre < 0) throw new Error('the centre table is not in the mixture');
log(`${id} W${w}: solved in ${solveS.toFixed(0)} s, ${PTS} points, ${r.actions.length} moves, levels ${[...new Set(r.levelOf)].join(' ')}, tier pairs ${r.meta.tierState}, switch charge ${sc}, riskAbove ${r.meta.riskAbove ? r.meta.riskAbove.decision : '-'}`);

/* ---- the menu's moves as specifications: draw-first ceiling C (0 none, Infinity all), order, re-wrap H (0 none), level L, tiers ---- */
const PEN_CODE = { penPA: 0, penBasic: 1, penAny: 2 }, CEIL = [PA, HRS, Infinity];
function specOf(a) {
  let n = 0; while (n < a.steps.length && PEN_CODE[a.steps[n]] !== undefined) n++;
  const C0 = n === 0 ? 0 : CEIL[PEN_CODE[a.steps[n - 1]]];
  if (a.cgtSale) throw new Error('unexpected move kind: the CGT sale (N4) is not in the candidate\'s menu');
  for (const s of a.steps) if (!['penPA', 'penBasic', 'penAny', 'cash', 'other', 'isa'].includes(s)) throw new Error(`unexpected step ${s}`);
  return { isaFirst: a.steps[n] === 'isa', C: C0, H: a.harvest ? (a.harvestCeil === 'basic' ? HRS : a.harvestCeil === 'pa' ? PA : NaN) : 0, L: a.spendLevel !== undefined ? a.spendLevel : 1, tp: a.tierPen || 0, ti: a.tierIsa || 0 };
}
const keyOf = sp => `${sp.isaFirst ? 1 : 0}|${sp.tp}|${sp.ti}|${sp.C}|${sp.H}|${sp.L}`;
const specs0 = r.actions.map(specOf);
const index0 = new Map(specs0.map((sp, ai) => [keyOf(sp), ai]));
if (index0.size !== specs0.length) throw new Error('two menu moves share a specification');
const tmplOf = new Map();
specs0.forEach((sp, ai) => { const k = `${sp.isaFirst ? 1 : 0}|${sp.tp}|${sp.ti}`; if (!tmplOf.has(k)) tmplOf.set(k, ai); });
const tmplFor = sp => tmplOf.get(`${sp.isaFirst ? 1 : 0}|${sp.tp}|${sp.ti}`);
// the step codes: the pension ladder (the corners plus the move's own ceiling as N4's code 6), its run up to the ceiling,
// the two other pots in the move's order, then the rest of the ladder: for a corner, exactly buildActions' codes
function stepsFor(Cv, isaFirst) {
  const mid = isaFirst ? [5, 3, 4] : [3, 4, 5];
  const ladder = [[PA, 0], [HRS, 1], [Infinity, 2]];
  if (Cv !== 0 && !CEIL.includes(Cv)) { ladder.push([Cv, 6]); ladder.sort((a, b) => a[0] - b[0]); }
  const pre = Cv === 0 ? [] : ladder.filter(x => x[0] <= Cv).map(x => x[1]), rest = ladder.filter(x => !(Cv !== 0 && x[0] <= Cv)).map(x => x[1]);
  return Int8Array.from([...pre, ...mid, ...rest]);
}
const actFor = (k, sp) => { const tpl = W[k].c.acts[tmplFor(sp)], steps = stepsFor(sp.C, sp.isaFirst); return { ...tpl, steps, costSteps: steps, harvest: sp.H > 0 ? 1 : 0, harvestCeil: sp.H > 0 ? sp.H : PA, level: sp.L }; };
// every menu move's compiled form must be the solve's own, field for field (the tier fields come from a template move)
for (let k = 0; k < NW; k++) for (let ai = 0; ai < r.actions.length; ai++) {
  const a = W[k].c.acts[ai], b = actFor(k, specs0[ai]);
  for (const f of Object.keys(a)) { const x = a[f], y = b[f]; const same = ArrayBuffer.isView(x) ? x.length === y.length && x.every((v, i) => Object.is(v, y[i])) : Array.isArray(x) ? x === y : Object.is(x, y); if (!same) throw new Error(`world ${k} move ${ai} field ${f}: the rebuilt move differs`); }
}

/* ---- scoring: the solve's own scoreMoves on fresh-scratch copies of each world's table ---- */
const fresh = o => { const x = Object.assign(Object.create(Object.getPrototypeOf(o)), o); for (const k of Object.keys(x)) if (k.startsWith('_')) delete x[k]; return x; };
const baseTabs = W.map(fresh);
const nA = r.actions.length;
const bufs = n => Array.from({ length: NW }, () => new Float64Array(n));
const SCw0 = bufs(nA), TXw0 = bufs(nA), BQw0 = bufs(nA), SC0 = new Float64Array(nA), BQ0 = new Float64Array(nA);
const tierP0 = Int32Array.from(r.c.acts, a => a.tierPen), tierI0 = Int32Array.from(r.c.acts, a => a.tierIsa);
// chooseAction's mixture and charge, in its own order of operations
function mixInto(SCw, BQw, n, SC, BQ, tierP, tierI, held) {
  SC.fill(0, 0, n); BQ.fill(0, 0, n);
  for (let k = 0; k < NW; k++) { const wk = WT[k], X = SCw[k], B = BQw[k]; for (let i = 0; i < n; i++) { if (X[i] === -Infinity || SC[i] === -Infinity) SC[i] = -Infinity; else SC[i] += wk * X[i]; BQ[i] += wk * B[i]; } }
  if (held && sc > 0) for (let i = 0; i < n; i++) if (SC[i] !== -Infinity && (tierP[i] !== held.pen || tierI[i] !== held.isa)) SC[i] -= sc;
}
function argmax(SC, BQ, n, ok = null) { let bs = -Infinity, bb = -Infinity, b = -1; for (let i = 0; i < n; i++) { if (ok && !ok[i]) continue; const x = SC[i]; if (b < 0 || x > bs + eps || (Math.abs(x - bs) <= eps && BQ[i] > bb)) { bs = x; bb = BQ[i]; b = i; } } return b; }
function scoreMenu(t, s, held) {
  for (let k = 0; k < NW; k++) S.scoreMoves(baseTabs[k], s, t, SCw0[k], TXw0[k], BQw0[k], held);
  mixInto(SCw0, BQw0, nA, SC0, BQ0, tierP0, tierI0, held);
}
// the finer moves: grouped by draw-first ceiling, each group a copy of each world's table whose compiled context carries the
// group's ceiling as N4's code 6 and the group's moves as its acts
const groups = new Map();
function groupTabs(Cv) {
  let g = groups.get(Cv);
  if (!g) {
    g = W.map(wt => { const tab = fresh(wt); const cc = Object.assign(Object.create(Object.getPrototypeOf(wt.c)), wt.c); cc.acts = []; cc.n4cap = Float64Array.of(Number.isFinite(Cv) ? Cv : Infinity, NaN, NaN); tab.c = cc; tab.nodeRealOfAt = []; tab.levelOf = []; tab.tsLayerOf = []; tab.driftCostOf = []; tab.actions = { length: 0 }; return tab; });
    groups.set(Cv, g);
  }
  return g;
}
let NEVAL = 0;
function scoreSpecs(t, s, held, list) {   // returns { SC, BQ } mixed and charged, in list order
  const n = list.length, SCw = bufs(n), BQw = bufs(n), TX = new Float64Array(n);
  const byC = new Map(); list.forEach((sp, i) => { const a = byC.get(sp.C); if (a) a.push(i); else byC.set(sp.C, [i]); });
  for (const [Cv, idx] of byC) {
    const tabs = groupTabs(Cv), m = idx.length, SCg = new Float64Array(m), TXg = new Float64Array(m), BQg = new Float64Array(m);
    for (let k = 0; k < NW; k++) {
      const tab = tabs[k], nro = W[k].nodeRealOfAt[t], nr = new Array(m);
      tab.c.acts.length = m; tab.levelOf.length = m; tab.tsLayerOf.length = m; tab.driftCostOf.length = m;
      for (let j = 0; j < m; j++) { const sp = list[idx[j]], ta = tmplFor(sp); tab.c.acts[j] = actFor(k, sp); tab.levelOf[j] = sp.L; tab.tsLayerOf[j] = r.tsLayerOf ? r.tsLayerOf[ta] : 0; tab.driftCostOf[j] = r.driftCostOf ? r.driftCostOf[ta] : 0; nr[j] = nro[ta]; }
      tab.nodeRealOfAt[t] = nr; tab.actions = { length: m };
      S.scoreMoves(tab, s, t, SCg, TXg, BQg, held);
      for (let j = 0; j < m; j++) { SCw[k][idx[j]] = SCg[j]; BQw[k][idx[j]] = BQg[j]; }
      tab.nodeRealOfAt[t] = undefined;
    }
    NEVAL += m;
  }
  const SC = new Float64Array(n), BQ = new Float64Array(n);
  const tp = Int32Array.from(list, sp => r.c.acts[tmplFor(sp)].tierPen), ti = Int32Array.from(list, sp => r.c.acts[tmplFor(sp)].tierIsa);
  mixInto(SCw, BQw, n, SC, BQ, tp, ti, held);
  return { SC, BQ };
}

/* ---- the search ---- */
const lo = Math.min(...r.levelOf), hi = Math.max(...r.levelOf);
const LEVELS = [...new Set([...r.levelOf, ...Array.from({ length: Math.floor(100 * hi + 1e-9) - Math.ceil(100 * lo - 1e-9) + 1 }, (_, i) => (Math.ceil(100 * lo - 1e-9) + i) / 100)])].sort((a, b) => a - b);
const GBP = Array.from({ length: Math.round(150000 / STEPGBP) }, (_, i) => (i + 1) * STEPGBP);
// N4's three ceilings (the engine's own map: half the allowance, the basic band's middle, the taper threshold), in both grids
const N4V = ['penPAm', 'penBm', 'penHR'].map(k => E.N4_PEN[k](P));
const CGRID_FULL = [...new Set([0, PA, HRS, Infinity, ...N4V, ...GBP])].sort((a, b) => a - b), HGRID_FULL = [...new Set([0, PA, HRS, ...N4V, ...GBP])].sort((a, b) => a - b);
// N4's finer menu, the CGT sale aside: the menu's corners and levels with N4's ceilings, as a draw-first ceiling and a re-wrap
const CG4 = [...new Set([0, PA, HRS, Infinity, ...N4V])].sort((a, b) => a - b), HG4 = [...new Set([0, PA, HRS, ...N4V])].sort((a, b) => a - b), LV_MENU = [...new Set(r.levelOf)].sort((a, b) => a - b);
log(`N4's ceilings here: ${N4V.map(Math.round).join(', ')}; the corners ${Math.round(PA)}, ${Math.round(HRS)}`);
log(`finer menu: ${LEVELS.length} levels (${LEVELS[0]} to ${LEVELS[LEVELS.length - 1]}), ${CGRID_FULL.length} draw-first ceilings, ${HGRID_FULL.length} re-wraps (steps of GBP ${STEPGBP} to 150,000, with the corners)`);
/*
 * At (t, s, held): the menu's best (allowed: which menu moves count; the planted hole removes some), then the finer search
 * from the K best allowed menu moves. Returns the menu's best, the finer best and the gap, with the best of each single
 * dimension from the K starts (level, ceiling, re-wrap) and the dimensions in which the finer best differs from the menu's.
 */
function search(t, s, held, allowed = null, CG = CGRID_FULL, HG = HGRID_FULL, menuDone = false, LV = LEVELS) {
  if (!menuDone) scoreMenu(t, s, held);
  const a0 = argmax(SC0, BQ0, nA, allowed), best0 = SC0[a0];
  const out = { a0, best0, bestD: best0, specD: specs0[a0], gapL: 0, gapC: 0, gapH: 0, rounds: 0, dims: '' };
  if (best0 === -Infinity) return out;
  const spendYear = r.c.yr.spend[t] > 0, canDraw = r.c.yr.access[t] === 1 && s[0] > 0;
  if (!spendYear && !canDraw) return out;
  const order = []; for (let i = 0; i < nA; i++) if ((!allowed || allowed[i]) && SC0[i] > -Infinity) order.push(i);
  order.sort((x, y) => (SC0[y] - SC0[x]) || (BQ0[y] - BQ0[x]));
  const seen = new Map();
  const variants = (sp, tag, into) => {
    if (spendYear) for (const L of LV) into.push([{ ...sp, L }, 'L']);
    if (canDraw) { for (const Cv of CG) into.push([{ ...sp, C: Cv }, 'C']); for (const Hv of HG) into.push([{ ...sp, H: Hv }, 'H']); }
  };
  const evalList = (pairs) => {
    const todo = [], tags = [];
    for (const [sp, tag] of pairs) { const k = keyOf(sp); if (!seen.has(k)) { seen.set(k, null); todo.push(sp); tags.push(tag); } else tags.push(null); }
    if (!todo.length) return [];
    const { SC, BQ } = scoreSpecs(t, s, held, todo);
    const res = todo.map((sp, i) => ({ sp, sc: SC[i], bq: BQ[i] }));
    res.forEach(x => seen.set(keyOf(x.sp), x));
    return res;
  };
  // round 1: each dimension alone from each of the K starts
  const pairs = []; for (const ai of order.slice(0, K)) variants(specs0[ai], null, pairs);
  const res1 = evalList(pairs);
  const byTag = { L: -Infinity, C: -Infinity, H: -Infinity };
  { let i = 0; for (const [sp, tag] of pairs) { const x = seen.get(keyOf(sp)); if (x && x.sc > byTag[tag]) byTag[tag] = x.sc; i++; } }
  out.gapL = Math.max(0, byTag.L - best0); out.gapC = Math.max(0, byTag.C - best0); out.gapH = Math.max(0, byTag.H - best0);
  let best = { sp: specs0[a0], sc: best0, bq: BQ0[a0] };
  const better = (x, b) => x.sc > b.sc + eps || (Math.abs(x.sc - b.sc) <= eps && x.bq > b.bq);
  for (const x of res1) if (better(x, best)) best = x;
  // then climb from the best found, one dimension at a time, until no move improves
  for (let round = 0; round < 6; round++) {
    const nb = []; variants(best.sp, null, nb);
    const res = evalList(nb);
    let moved = false; for (const x of res) if (better(x, best) && x.sc > best.sc + 1e-12) { best = x; moved = true; }
    out.rounds = round + 1;
    if (!moved) break;
  }
  out.bestD = best.sc; out.specD = best.sp;
  const s0 = specs0[a0], d = [];
  if (best.sp.L !== s0.L) d.push('L'); if (best.sp.C !== s0.C) d.push('C'); if (best.sp.H !== s0.H) d.push('H'); if (best.sp.isaFirst !== s0.isaFirst || best.sp.tp !== s0.tp || best.sp.ti !== s0.ti) d.push('base');
  out.dims = d.join('');
  out.seen = seen;
  return out;
}

/* ---- 1. the candidate's own run, every decision recorded ---- */
const paths = E.pathsForSeed(SEED, Math.max(N0, N1, NCHECK), T);   // path i is seed 7002's path i, as N4's units (pathsForSeed: seed + i x 7919)
const Y = T + 1, spendYears = Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0));
const scale = Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0))), capR = Math.round(r.meta.bequestCap), floorL = Math.min(...r.levelOf);
const scoreOf = (tr, surv, n) => Float64Array.from(wholeScore({ survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: floorL, scale, capR, spendYears }, Number(w), Y).subarray(0, n));
const NR = Math.max(N0, N1), tr0 = makeTrace(NR, Y), surv0 = new Uint8Array(NR), decs = [];
let tRun = Date.now();
for (let p = 0; p < NR; p++) { tr0.row = p; const o = S.runPolicy(r, Float64Array.from(paths[p]), { trace: tr0, visit: p < N0 ? (t, s, held, ai) => decs.push({ p, t, s: Float64Array.from(s), held: { ...held }, ai }) : undefined }); if (o.survived) surv0[p] = 1; }
const ws0 = scoreOf(tr0, surv0, NR);
log(`the candidate's run: ${NR} paths in ${((Date.now() - tRun) / 1000).toFixed(0)} s, ${decs.length} decisions recorded on the first ${N0}; survival ${(100 * surv0.reduce((a, x) => a + x, 0) / NR).toFixed(3)}%, whole score ${(ws0.reduce((a, x) => a + x, 0) / NR).toFixed(4)}`);

/* ---- 2. check (3): this file's own chooser over the menu reproduces the run bit for bit ---- */
{
  const n = Math.min(NCHECK, N0), trC = makeTrace(n, Y), survC = new Uint8Array(n);
  for (let p = 0; p < n; p++) { trC.row = p; const o = S.runPolicy(r, Float64Array.from(paths[p]), { trace: trC, choose: (t, s, held) => { scoreMenu(t, s, held); return argmax(SC0, BQ0, nA); } }); if (o.survived) survC[p] = 1; }
  let diff = 0; for (const f of ['level', 'wealth', 'failYear', 'tier', 'taxPaid']) for (let i = 0; i < trC[f].length; i++) if (!Object.is(trC[f][i], tr0[f][i])) diff++;
  for (let p = 0; p < n; p++) if (survC[p] !== surv0[p]) diff++;
  log(`check 3, this file's chooser over the menu on ${n} paths: ${diff === 0 ? 'the same bit for bit' : `${diff} values DIFFER`}`);
  if (diff) throw new Error('check 3 failed');
}

/* ---- 3. the gap at every recorded decision ---- */
tRun = Date.now();
let pickDiff = 0, identDiff = 0, identN = 0;
const gap4Path = new Float64Array(N0), beyondPath = new Float64Array(N0), gapPath = new Float64Array(N0), gapL = new Float64Array(N0), gapC = new Float64Array(N0), gapH = new Float64Array(N0), gapYear = new Float64Array(Y), nYear = new Float64Array(Y);
const dimCount = {}, dimGap = {}, gaps = [], examples = [];
let lastLog = Date.now();
for (let i = 0; i < decs.length; i++) {
  const d = decs[i];
  const o = search(d.t, d.s, d.held);
  if (o.a0 !== d.ai) pickDiff++;
  // check (2): each menu move reached by the search scores what the menu scored it
  if (o.seen) for (const [k, x] of o.seen) { const ai = index0.get(k); if (ai !== undefined && x) { identN++; if (!Object.is(x.sc, SC0[ai])) identDiff++; } }
  const o4 = search(d.t, d.s, d.held, null, CG4, HG4, true, LV_MENU);   // N4's finer menu from the same starts (the menu already scored)
  // every menu move fails: so does every finer one (the floor is the lowest level)
  const all = Math.max(o.bestD, o4.bestD), g = o.best0 === -Infinity ? 0 : Math.max(0, all - o.best0), g4 = o.best0 === -Infinity ? 0 : Math.max(0, o4.bestD - o.best0);
  gap4Path[d.p] += g4; beyondPath[d.p] += g - g4;
  gapPath[d.p] += g; gapL[d.p] += o.gapL; gapC[d.p] += o.gapC; gapH[d.p] += o.gapH; gapYear[d.t] += g; nYear[d.t]++;
  gaps.push(g);
  if (g > 1e-6) { dimCount[o.dims] = (dimCount[o.dims] || 0) + 1; dimGap[o.dims] = (dimGap[o.dims] || 0) + 100 * g / N0; if (examples.length < 400) examples.push({ p: d.p, t: d.t, age: r.m.ctx.ageSelf0 + d.t, gap: g, menu: specs0[o.a0], finer: o.specD, wealth: Math.round(d.s[0] + d.s[1] + d.s[2]), pen: Math.round(d.s[0]) }); }
  if (Date.now() - lastLog > 120000) { lastLog = Date.now(); log(`  ${i + 1} of ${decs.length} decisions, ${NEVAL} finer moves scored`); }
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, seOf = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length); };
const q = (a, f) => { const b = Float64Array.from(a).sort(); return b[Math.min(b.length - 1, Math.floor(f * b.length))]; };
log(`check 1, the menu's pick against the candidate's chooser: ${pickDiff} of ${decs.length} decisions differ; check 2, menu moves reached by the search: ${identN}, ${identDiff} scored differently`);
if (pickDiff || identDiff) throw new Error('check 1 or 2 failed');
log(`the gap over ${decs.length} decisions in ${((Date.now() - tRun) / 1000).toFixed(0)} s (${NEVAL} finer moves scored): per decision, in points of the whole score, median ${(100 * q(gaps, 0.5)).toExponential(2)}, 95th ${(100 * q(gaps, 0.95)).toExponential(2)}, 99th ${(100 * q(gaps, 0.99)).toExponential(2)}, the largest ${(100 * Math.max(...gaps)).toExponential(2)}; decisions with a gap above 0.001 points ${gaps.filter(x => x > 1e-5).length}, above 0.01 ${gaps.filter(x => x > 1e-4).length}`);
const P100 = a => Array.from(a, x => 100 * x);
const summary = { id, w, points: PTS, K, step: STEPGBP, paths: N0, decisions: decs.length, solveS, n4Ceilings: N4V, corners: [PA, HRS],
  survival0: 100 * mean(Array.from(surv0)), whole0: mean(Array.from(ws0)),
  tableGain: { all: [mean(P100(gapPath)), seOf(P100(gapPath))], n4: [mean(P100(gap4Path)), seOf(P100(gap4Path))], beyondN4: [mean(P100(beyondPath)), seOf(P100(beyondPath))], levelOnly: [mean(P100(gapL)), seOf(P100(gapL))], ceilingOnly: [mean(P100(gapC)), seOf(P100(gapC))], rewrapOnly: [mean(P100(gapH)), seOf(P100(gapH))] },
  perDecision: { median: 100 * q(gaps, 0.5), p95: 100 * q(gaps, 0.95), p99: 100 * q(gaps, 0.99), max: 100 * Math.max(...gaps), above001: gaps.filter(x => x > 1e-5).length, above01: gaps.filter(x => x > 1e-4).length },
  dims: dimCount, dimPoints: Object.fromEntries(Object.entries(dimGap).map(([k, v]) => [k, +v.toFixed(5)])), byAge: Array.from(gapYear, (g, t) => [r.m.ctx.ageSelf0 + t, +(100 * g / N0).toFixed(5)]).filter(x => x[1] > 0) };
log(`the table's estimate of one step of improvement, points of the whole score a path (mean, se): all dimensions ${summary.tableGain.all.map(x => x.toFixed(4)).join(', ')}, of which N4's ceilings at the menu's levels ${summary.tableGain.n4.map(x => x.toFixed(4)).join(', ')} and beyond them ${summary.tableGain.beyondN4.map(x => x.toFixed(4)).join(', ')}; the level alone ${summary.tableGain.levelOnly.map(x => x.toFixed(4)).join(', ')}; the draw-first ceiling alone ${summary.tableGain.ceilingOnly.map(x => x.toFixed(4)).join(', ')}; the re-wrap alone ${summary.tableGain.rewrapOnly.map(x => x.toFixed(4)).join(', ')}`);
log(`where the finer best differs from the menu's (decisions with a gap above 1e-6 score units; L level, C draw-first ceiling, H re-wrap, base another start move): ${JSON.stringify(dimCount)}; their points a path ${JSON.stringify(summary.dimPoints)}`);
log(`by age, points a path: ${summary.byAge.map(([a, g]) => `${a}:${g}`).join(' ')}`);
const top = [...examples].sort((a, b) => b.gap - a.gap).slice(0, 8);
const fmt = sp => `${sp.C === 0 ? 'no pension first' : sp.C === Infinity ? 'pension first, all' : `pension first to ${Math.round(sp.C)}`}, ${sp.isaFirst ? 'ISA' : 'taxable'} next, ${sp.H ? `re-wrap to ${Math.round(sp.H)}` : 'no re-wrap'}, spend ${Math.round(sp.L * 100)}%, tiers ${sp.tp}/${sp.ti}`;
for (const x of top) log(`  path ${x.p} age ${x.age}: gap ${(100 * x.gap).toFixed(4)} points; wealth ${x.wealth} (pension ${x.pen}); menu: ${fmt(x.menu)} | finer: ${fmt(x.finer)}`);
summary.top = top.map(x => ({ ...x, menu: fmt(x.menu), finer: fmt(x.finer) }));

/* ---- 4. check (4), the planted hole: the basic-rate corner out of the menu, as a ceiling and as a re-wrap ---- */
{
  const allowed = Uint8Array.from(specs0, sp => (sp.C === HRS || sp.H === HRS ? 0 : 1));
  const CG = CGRID_FULL.filter(x => x !== HRS), HG = HGRID_FULL.filter(x => x !== HRS);
  let holeSum = 0, foundSum = 0, nHole = 0, nFound = 0, nd = 0;
  const lim = Math.min(NHOLE, N0);
  for (const d of decs) {
    if (d.p >= lim) break;
    nd++;
    scoreMenu(d.t, d.s, d.held);
    const aFull = argmax(SC0, BQ0, nA), aHole = argmax(SC0, BQ0, nA, allowed);
    const hole = SC0[aHole] === -Infinity ? 0 : SC0[aFull] - SC0[aHole];
    const o = search(d.t, d.s, d.held, allowed, CG, HG, true);
    const found = o.best0 === -Infinity ? 0 : Math.max(0, o.bestD - o.best0);
    holeSum += hole; foundSum += found;
    if (hole > 1e-5) { nHole++; if (found >= 0.5 * hole) nFound++; }
  }
  summary.hole = { paths: lim, decisions: nd, holePoints: 100 * holeSum / lim, foundPoints: 100 * foundSum / lim, decisionsHoleAbove001: nHole, foundHalf: nFound };
  log(`check 4, the planted hole on ${lim} paths (${nd} decisions): the hole costs ${(100 * holeSum / lim).toFixed(4)} points a path in the tables; the search finds ${(100 * foundSum / lim).toFixed(4)}; at the ${nHole} decisions where the hole costs over 0.001 points, it finds half or more at ${nFound}: ${nHole > 0 && nFound >= 0.9 * nHole ? 'CAUGHT' : 'NOT CAUGHT'}`);
}

/* ---- 5. the greedy policies over the finer menu and over N4's, each run on the same paths as the candidate's, paired ---- */
function runImproved(label, pick) {
  const t1 = Date.now();
  const cSlot = Object.assign(Object.create(Object.getPrototypeOf(r.c)), r.c, { acts: [null], n4cap: Float64Array.of(0, NaN, NaN) });
  const r1 = Object.assign(Object.create(Object.getPrototypeOf(r)), r, { c: cSlot, actions: [r.actions[0]] });
  const tr1 = makeTrace(N1, Y), surv1 = new Uint8Array(N1);
  let changed = 0, decisions = 0;
  const choose = (t, s, held) => {
    const sp = pick(t, s, held); decisions++; if (keyOf(sp) !== keyOf(specs0[argmax(SC0, BQ0, nA)])) changed++;
    cSlot.acts[0] = actFor(centre, sp); cSlot.n4cap[0] = Number.isFinite(sp.C) ? sp.C : Infinity;
    return 0;
  };
  for (let p = 0; p < N1; p++) { tr1.row = p; const o = S.runPolicy(r1, Float64Array.from(paths[p]), { trace: tr1, choose }); if (o.survived) surv1[p] = 1; if (p % 500 === 499) log(`  ${label}: ${p + 1} of ${N1} paths`); }
  const ws1 = scoreOf(tr1, surv1, N1);
  const res = { paths: N1, decisions, changed, secs: (Date.now() - t1) / 1000, ws: ws1, surv: surv1 };
  log(`${label} on the first ${N1} paths: ${changed} of ${decisions} decisions take a move off the menu; ${res.secs.toFixed(0)} s`);
  return res;
}
function pairedLine(label, A, B) {   // B less A, paired on the paths
  const n = Math.min(A.ws.length, B.ws.length), dW = [], dS = []; let saved = 0, lost = 0;
  for (let i = 0; i < n; i++) { dW.push(B.ws[i] - A.ws[i]); dS.push(100 * (B.surv[i] - A.surv[i])); if (B.surv[i] && !A.surv[i]) saved++; if (!B.surv[i] && A.surv[i]) lost++; }
  const o = { whole: [mean(dW), seOf(dW)], survival: [mean(dS), seOf(dS)], saved, lost, paths: n };
  const f = x => `${x >= 0 ? '+' : ''}${x.toFixed(4)}`;
  log(`${label}: whole score ${f(o.whole[0])} (se ${o.whole[1].toFixed(4)}), survival ${f(o.survival[0])} points (se ${o.survival[1].toFixed(4)}; ${saved} saved, ${lost} lost) on ${n} paths`);
  return o;
}
if (N1 > 0) {
  const base = { ws: ws0.subarray(0, N1), surv: surv0.subarray(0, N1) };
  const pickFiner = (t, s, held) => { const o = search(t, s, held), o4 = search(t, s, held, null, CG4, HG4, true, LV_MENU); const b = o4.bestD > o.bestD ? o4 : o; return b.bestD > b.best0 ? b.specD : specs0[b.a0]; };
  const pickN4 = (t, s, held) => { const o4 = search(t, s, held, null, CG4, HG4, false, LV_MENU); return o4.bestD > o4.best0 ? o4.specD : specs0[o4.a0]; };
  const R1 = runImproved('the finer menu\'s greedy policy', pickFiner), R4 = runImproved('N4\'s menu\'s greedy policy (its ceilings, no CGT sale)', pickN4);
  summary.improved = { finer: { ...pairedLine('the finer menu\'s greedy policy less the candidate', base, R1), decisions: R1.decisions, changed: R1.changed, secs: R1.secs },
    n4: { ...pairedLine('N4\'s menu\'s greedy policy less the candidate', base, R4), decisions: R4.decisions, changed: R4.changed, secs: R4.secs },
    finerLessN4: pairedLine('the finer menu\'s greedy policy less N4\'s', R4, R1) };
  summary.perPath1 = { whole1: Array.from(R1.ws, x => +x.toFixed(6)), surv1: Array.from(R1.surv), whole4: Array.from(R4.ws, x => +x.toFixed(6)), surv4: Array.from(R4.surv) };
}
summary.perPath = { gap: P100(gapPath).map(x => +x.toFixed(6)), gap4: P100(gap4Path).map(x => +x.toFixed(6)), whole0: Array.from(ws0, x => +x.toFixed(6)), surv0: Array.from(surv0) };
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(summary));
log('done');
