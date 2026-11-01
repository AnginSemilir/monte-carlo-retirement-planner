/*
 * THE LEVER MATRIX (the launch plan's step L3): every pair of settings across the levers and locks, the dial's four positions
 * in both variants among them, on two households (S002, retired; S126, a bridge to the pension), at light settings. Used by
 * lever-matrix.test.mjs (four combinations and the plants: the fast tier) and lever-matrix-full.test.mjs (every combination:
 * the full tier). Each combination solves without a throw, and on 100 engine paths of the solved plan:
 *   - the dial above 1 with a tier state: the position's tier pair at every decision of the first 20 paths is the one its
 *     base's chooser picks there (runPolicy's visit, as lock-check.mjs reads it);
 *   - consent withdrawn: the plan's own tiers every year; raises blocked: no year above target;
 *   - each lock: no pension before its age; no tier riskier than the ceiling; never a full lump, or the full lump from the
 *     first open year;
 * and its run record holds ageWeight as the variant and position set it (absent at position 1), spendLevels with the floor's
 * 0.8, and a base whose key is the position's with the dial at 1 and whose estate weight is the position's.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { withTable } from '../../src/solver/bridge.js';
import { runPolicy, chooseAction } from '../../src/solver/solve.js';
import { solveForApp, dialBase, dialOf, APP_AGE_WEIGHT } from '../../src/solverApp.js';
import { solveKey } from '../../src/solverKey.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

export const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
export const FACTORS = [
  ['household', ['S002', 'S126']], ['dial', [1, 3, 6, 10]], ['variant', ['B3a', 'B3b']], ['estate', ['standard', 'lower']],
  ['raises', ['capped', 'blocked']], ['consent', [true, false]], ['minpot', [0, 40000]], ['pensionBefore', [null, 'later']],
  ['ceiling', [null, 'Medium/Low Risk']], ['lumpSum', ['free', 'never', 'now']]
];

/* an all-pairs design: rows chosen greedily from seeded candidates, each covering the most pairs not yet covered */
export function allPairs(factors = FACTORS, seed = 20261101) {
  let x = seed >>> 0; const rnd = () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pairsOf = row => { const out = []; for (let i = 0; i < row.length; i++) for (let j = i + 1; j < row.length; j++) out.push(`${i}:${row[i]}|${j}:${row[j]}`); return out; };
  const want = new Set();
  for (let i = 0; i < factors.length; i++) for (let j = i + 1; j < factors.length; j++) for (let a = 0; a < factors[i][1].length; a++) for (let b = 0; b < factors[j][1].length; b++) want.add(`${i}:${a}|${j}:${b}`);
  const rows = [];
  while (want.size) {
    let best = null, gain = -1;
    for (let c = 0; c < 200; c++) {
      const row = factors.map(([, lv]) => Math.floor(rnd() * lv.length));
      const g = pairsOf(row).filter(p => want.has(p)).length;
      if (g > gain) { gain = g; best = row; }
    }
    pairsOf(best).forEach(p => want.delete(p));
    rows.push(best);
  }
  return rows.map(row => Object.fromEntries(row.map((v, i) => [factors[i][0], factors[i][1][v]])));
}
export const coversAllPairs = (rows, factors = FACTORS) => {
  for (let i = 0; i < factors.length; i++) for (let j = i + 1; j < factors.length; j++) for (const a of factors[i][1]) for (const b of factors[j][1])
    if (!rows.some(r => r[factors[i][0]] === a && r[factors[j][0]] === b)) return `${factors[i][0]}=${a} with ${factors[j][0]}=${b}`;
  return null;
};

const all = buildScenarios();
/* the plan a combination asks for */
export function planOf(c) {
  const raw = all.find(s => s.id === c.household).plan, np = E.normalizePlan(raw), d = np.demographics;
  const later = Math.max(E.num(d.privatePensionAge, 58), E.num(d.currentAgeSelf, 0)) + 2;
  return {
    ...raw, config: { ...raw.config, solvencyFloor: c.minpot },
    solver: {
      aims: { cuts: c.dial, estate: c.estate, raises: c.raises, riskConsent: c.consent },
      locks: { pensionBefore: c.pensionBefore === 'later' ? later : null, tierCeiling: { pen: c.ceiling, isa: null }, lumpSum: c.lumpSum }
    }
  };
}
const ownTier = (np, pre) => { const a = (np.accounts || []).find(x => x.id && x.id.startsWith(pre)); return a ? a.risk : null; };
function rowsOf(r, np = 100, seed = 99004) {
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, out = [];
  for (const zs of E.pathsForSeed(seed, np, T)) {
    const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0, path = [];
    for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); path.push({ level: row.spendLevel, tp: row.tierPenName, ti: row.tierIsaName, age: row.ageSelf, pen: row.drawdownPensions || 0, lump: !!st.lumpSumTaken.self, open: row.ageSelf >= ctx.nmpa && !row.workingSelf }); }
    out.push({ zs, path });
  }
  return out;
}

/* the solve of a combination: its base (solved here, or the one handed in) and the position on it */
export function solveCombo(c, { base = null, variant = c.variant } = {}) {
  const plan = planOf(c), np = E.normalizePlan(plan), bp = dialBase(np);
  const b = bp ? (base || solveForApp(E, M, bp, { ...OPTS, variant })) : null;
  const r = solveForApp(E, M, plan, { ...OPTS, variant, ...(b ? { base: b } : {}) });
  return { plan, np, base: b, basePlan: bp, r };
}

/* every check of a combination on its solve; returns the failures (empty: all hold) */
export async function checkCombo(c, { plan, np, base, basePlan, r }, { expectVariant = c.variant } = {}) {
  const bad = [], runs = rowsOf(r), L = np.solver.locks;
  const dial = dialOf(np);
  // the run record
  const wantAW = dial > 1 && expectVariant === 'B3a' ? JSON.stringify(APP_AGE_WEIGHT) : undefined;
  if (JSON.stringify(r.meta.ageWeight) !== wantAW) bad.push(`ageWeight ${JSON.stringify(r.meta.ageWeight)} where ${wantAW || 'none'}`);
  if (!(r.meta.spendLevels || []).some(x => Math.abs(x - 0.8) < 1e-6)) bad.push(`spendLevels ${JSON.stringify(r.meta.spendLevels)} without the floor`);
  if (dial > 1) {
    const atOne = { ...plan, solver: { ...plan.solver, aims: { ...plan.solver.aims, cuts: 1 } } };
    if (await solveKey(E, basePlan, OPTS) !== await solveKey(E, atOne, OPTS)) bad.push('the base\'s key is not the position\'s at the dial at 1');
    if (Math.abs(base.meta.bequestWeight - r.meta.bequestWeight) > 1e-12) bad.push(`the base's estate weight ${base.meta.bequestWeight}, the position's ${r.meta.bequestWeight}`);
    if (base.meta.tierState) {
      if (!r.meta.lockTiers || !r.lockTiers || r.lockTiers.rc !== base) bad.push('no lock on the base');
      let off = 0, decisions = 0;
      for (const { zs } of runs.slice(0, 20)) runPolicy(r, Float64Array.from(zs), { visit: (t, s, held, ai) => { decisions++; if (r.tsLayerOf[ai] !== base.tsLayerOf[chooseAction(base, s, t, held)]) off++; } });
      if (off || !decisions) bad.push(`${off} of ${decisions} decisions off the base's tier pair`);
    } else if (r.meta.lockTiers) bad.push('a lock where the base has no tier state');
  }
  // the engine's paths
  const own = { tp: ownTier(np, 'pen_'), ti: ownTier(np, 'isa_') };
  for (const { path } of runs) {
    if (np.solver.aims.riskConsent === false && path.some(y => (y.tp && own.tp && y.tp !== own.tp && !L.tierCeiling.pen) || (y.ti && own.ti && y.ti !== own.ti))) { bad.push('a tier moved with consent withdrawn'); break; }
    if (np.solver.aims.raises === 'blocked' && path.some(y => y.level > 1 + 1e-9)) { bad.push('a year above target with raises blocked'); break; }
    if (L.pensionBefore && path.some(y => y.age < L.pensionBefore && y.pen > 0.5)) { bad.push(`pension drawn before ${L.pensionBefore}`); break; }
    if (L.tierCeiling.pen && path.some(y => y.tp && RISK.indexOf(y.tp) < RISK.indexOf(L.tierCeiling.pen))) { bad.push(`a pension tier riskier than ${L.tierCeiling.pen}`); break; }
    if (L.lumpSum === 'never' && path.some(y => y.lump)) { bad.push('a full lump with the lump sum never'); break; }
    if (L.lumpSum === 'now') { const i = path.findIndex(y => y.open); if (i >= 0 && !(path.slice(i).every(y => y.lump) && path.slice(0, i).every(y => !y.lump))) { bad.push('the full lump not taken at first access'); break; } }
  }
  return bad;
}
export const label = c => `${c.household} dial ${c.dial}${c.dial > 1 ? ` ${c.variant}` : ''}, estate ${c.estate}, raises ${c.raises}, consent ${c.consent ? 'yes' : 'no'}, min pot ${c.minpot}, pension ${c.pensionBefore || 'free'}, ceiling ${c.ceiling || 'none'}, lump ${c.lumpSum}`;
