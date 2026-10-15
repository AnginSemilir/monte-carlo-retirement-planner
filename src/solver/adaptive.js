/*
 * THE ADAPTIVE REFERENCE (`readerRef: 'adaptive'`, research only, default off; PLAN.md AREF, its AN arm; the deep reviews
 * after NODE-AX, deep-review-log.md 15 Oct 01:48 UK, and after AREF Step 0, 15 Oct 10:13 UK; audit-aref0.mjs, whose DP
 * this is). The bridge reader splits a bridge year's survival S into p x c + R against a reference chance p. Today's
 * references pay the bills from one fixed mix (referenceChance) or in a fixed draw order (orderChance, 'order'); this one
 * is the chance that the policy's own floor-level moves pay every floor bill to access, chosen adaptively, year by year:
 *   - the state is the accessible money A (ISA plus taxable account and cash), its ISA share b and the taxable account's
 *     gain fraction gf. Before access the flow reads nothing else that varies: the pension, the tax-free cash taken and
 *     the lump flag enter only at access (fast.js flow), and the sheltered cash is the year's typical value, as a grid
 *     cell reads it (s[6] = -1). So p is exact in the pension, not a typical value (Step 0 held it at its records' median);
 *   - each bridge year every floor-level move (distinct draw orders by tier variants) pays the year by the engine's own
 *     flow, the world-independent one the solver shares across worlds (solve.js solveMixture), and grows by the move's own
 *     rates in each world (F.grow at realAt, the solver's node rates at zPath 0); a year fails at unmet > 1 or a pre-access
 *     insolvency (scoreMoves' rule);
 *   - one move for every world, the best on the mixture's weights (jointWorlds' rule);
 *   - THE LAST BRIDGE YEAR EXACTLY (O157: Step 0's DP read it off its grid, a 0/1 step smeared across a cell, p over its
 *     own simulation in 14 of 15 bins): in the last bridge year p is 1 exactly when some floor move pays the year, which
 *     is monotone in A, so it is the threshold A*(b, gf) found by bisection on a b by gf lattice; the year before reads it
 *     as the chance the grown money clears the threshold, the shock z* where it just does found by bisection in z and the
 *     chance taken as 1 - Phi(z*) (the step split, as solve.js's stepExpect splits the final year); earlier years average
 *     the next year's table at `nz` equal-weight midpoints in u = Phi(z), as Step 0 did;
 *   - p is read by interpolation in log A, b and gf (zero below the A grid's foot, half of today's bill).
 * Off (any other readerRef), nothing here runs.
 */
import * as F from './fast.js';
import { Phi } from './grid.js';

const ZLO = -8, ZHI = 8;

export function adaptiveReference({ cs, flowCtx, actions, levelOf, weights, years, billsOf, gains, realAt, PhiInv, na = 160, nb = 41, nz = 128 }) {
  const t0 = Date.now(), K = cs.length;
  if (!weights || weights.length !== K) throw new Error('the adaptive reference needs the mixture\'s weights (jointWorlds)');
  const bridge = []; for (let t = 0; t < years.length; t++) if (years[t]) bridge.push(t);
  if (!bridge.length) return null;
  const TL = bridge[bridge.length - 1];
  const floor = Math.min(...levelOf), moves = [], seen = new Set();
  actions.forEach((a, ai) => { if (levelOf[ai] !== floor) return; const key = `${a.steps.join(',')}|${a.tierPen || 0}|${a.tierIsa || 0}|${a.tierGia || 0}`; if (!seen.has(key)) { seen.add(key); moves.push(ai); } });
  const NG = gains.length, NM = moves.length;
  const ZS = Float64Array.from({ length: nz }, (_, i) => PhiInv((i + 0.5) / nz));
  const BG = Float64Array.from({ length: nb }, (_, j) => j / (nb - 1));
  const st = new Float64Array(7), post = new Float64Array(7), grown = new Float64Array(7), rr = new Float64Array(4);
  const setState = (A, b, gf) => { st[0] = 0; st[1] = b * A; st[2] = (1 - b) * A; st[3] = gf; st[4] = 0; st[5] = 0; st[6] = -1; };
  const flowOk = (t, ai) => { post.set(st); const u = F.flow(flowCtx, t, ai, post); return !(u > 1 || flowCtx.last.preNmpaInsolvent); };
  // a gain fraction's place on the gain nodes (clamped), and the b lattice's
  const gPos = gf => { if (NG === 1 || gf <= gains[0]) return [0, 0]; if (gf >= gains[NG - 1]) return [NG - 1, 0]; let i = 0; while (i < NG - 2 && gf > gains[i + 1]) i++; return [i, (gf - gains[i]) / (gains[i + 1] - gains[i])]; };
  const bPos = b => { const f = Math.min(nb - 1 - 1e-12, Math.max(0, b) * (nb - 1)), i = Math.floor(f); return [i, f - i]; };

  // 1. THE LAST BRIDGE YEAR: A*(b, gf), the least accessible money from which some floor move pays it
  const BIG = 1e12, AST = new Float64Array(nb * NG);
  const anyPays = (A, b, gf) => { setState(A, b, gf); for (const ai of moves) if (flowOk(TL, ai)) return true; return false; };
  let nonMono = 0;
  for (let ig = 0; ig < NG; ig++) for (let jb = 0; jb < nb; jb++) {
    const b = BG[jb], gf = gains[ig];
    if (anyPays(0, b, gf)) { AST[jb * NG + ig] = 0; continue; }
    let hi = Math.max(1000, 4 * Math.max(0, billsOf(TL)[0]));
    while (hi < BIG && !anyPays(hi, b, gf)) hi *= 2;
    if (hi >= BIG) { AST[jb * NG + ig] = BIG; continue; }
    let lo = 0;
    for (let it = 0; it < 60 && hi - lo > 1e-6; it++) { const mid = 0.5 * (lo + hi); if (anyPays(mid, b, gf)) hi = mid; else lo = mid; }
    AST[jb * NG + ig] = hi;
    if (!anyPays(hi * 1.5, b, gf)) nonMono++;   // a move that pays at A* but not above it: the threshold's premise broken
  }
  const astar = (b, gf) => {
    const [ib, wb] = bPos(b), [ig, wg] = gPos(gf), g2 = Math.min(NG - 1, ig + 1);
    const v = (j, i) => AST[j * NG + i];
    return (1 - wb) * ((1 - wg) * v(ib, ig) + wg * v(ib, g2)) + wb * ((1 - wg) * v(ib + 1, ig) + wg * v(ib + 1, g2));
  };

  // 2. THE EARLIER BRIDGE YEARS, backward: V[k][t] on a log-A by b by gf lattice
  const AG = {}, V = Array.from({ length: K }, () => ({}));
  for (const t of bridge) {
    if (t === TL) continue;
    const bl = billsOf(t), d0 = bl[0], rem = bl.reduce((u, v) => u + Math.max(0, v), 0);
    const lo = Math.log(Math.max(100, 0.5 * d0)), hi = Math.log(3 * rem + d0);
    AG[t] = Float64Array.from({ length: na }, (_, i) => lo + (hi - lo) * i / (na - 1));
  }
  const readV = (k, t, A, b, gf) => {
    if (t > TL || !years[t]) return 1;
    if (t === TL) return A >= astar(b, gf) ? 1 : 0;
    const ag = AG[t], arr = V[k][t];
    if (!(A > 0)) return 0;
    const la = Math.log(A);
    if (la < ag[0]) return 0;
    const fa = Math.min(na - 1 - 1e-9, (la - ag[0]) / (ag[1] - ag[0])), ia = Math.floor(fa), wa = fa - ia;
    const [ib, wb] = bPos(b), [ig, wg] = gPos(gf), g2 = Math.min(NG - 1, ig + 1);
    const v = (i, j, g) => arr[(i * nb + j) * NG + g];
    const at = (i) => (1 - wb) * ((1 - wg) * v(i, ib, ig) + wg * v(i, ib, g2)) + wb * ((1 - wg) * v(i, ib + 1, ig) + wg * v(i, ib + 1, g2));
    return (1 - wa) * at(ia) + wa * at(ia + 1);
  };
  // the chance a post-flow state clears year TL's threshold after growing at the move's rates in world k
  const clearStep = (k, ai, t) => {
    const ck = cs[k], act = ck.acts[ai];
    const h = z => { grown.set(post); F.grow(ck, t, grown, realAt(ck, z, rr, act, t)); const A2 = grown[1] + grown[2]; return A2 - astar(A2 > 0 ? grown[1] / A2 : 0, grown[3]); };
    if (h(ZLO) >= 0) return 1;
    if (h(ZHI) < 0) return 0;
    let lo = ZLO, hi = ZHI;
    for (let it = 0; it < 50; it++) { const mid = 0.5 * (lo + hi); if (h(mid) >= 0) hi = mid; else lo = mid; }
    return 1 - Phi(hi);
  };
  const Q = Array.from({ length: NM }, () => new Float64Array(K));
  for (let yi = bridge.length - 2; yi >= 0; yi--) {
    const t = bridge[yi], ag = AG[t], next = t + 1;
    for (let k = 0; k < K; k++) V[k][t] = new Float64Array(na * nb * NG);
    for (let ia = 0; ia < na; ia++) for (let jb = 0; jb < nb; jb++) for (let ig = 0; ig < NG; ig++) {
      const A = Math.exp(ag[ia]), b = BG[jb], gf = gains[ig];
      setState(A, b, gf);
      for (let mi = 0; mi < NM; mi++) {
        const ai = moves[mi];
        if (!flowOk(t, ai)) { Q[mi].fill(0); continue; }
        const keep = Float64Array.from(post);
        for (let k = 0; k < K; k++) {
          post.set(keep);
          if (next === TL) { Q[mi][k] = clearStep(k, ai, t); continue; }
          const ck = cs[k], act = ck.acts[ai];
          let acc = 0;
          for (let zi = 0; zi < nz; zi++) { grown.set(keep); F.grow(ck, t, grown, realAt(ck, ZS[zi], rr, act, t)); const A2 = grown[1] + grown[2]; acc += readV(k, next, A2, A2 > 0 ? grown[1] / A2 : 0, grown[3]); }
          Q[mi][k] = acc / nz;
        }
      }
      let best = 0, bestV = -1;
      for (let mi = 0; mi < NM; mi++) { let v = 0; for (let k = 0; k < K; k++) v += weights[k] * Q[mi][k]; if (v > bestV + 1e-15) { bestV = v; best = mi; } }
      const at = (ia * nb + jb) * NG + ig;
      for (let k = 0; k < K; k++) V[k][t][at] = Q[best][k];
    }
  }
  // the chance at accessible money A and the position s (its ISA share, s[1] / A, and gain fraction, s[3]); a caller that
  // passes A alone hands the position over first with f.at(s) (grid.js readValues, whose cited call line passes A only),
  // and the hand-over lasts one call, so a stale position is never read
  const at = (k, t) => {
    let held = null;
    const f = (A, s) => {
      const q = s || held; held = null;
      if (!q) throw new Error('the adaptive reference reads the position (its ISA share and gain fraction), not the accessible money alone');
      return readV(k, t, A, A > 0 ? q[1] / A : 0, q[3]);
    };
    f.at = (s) => { held = s; };
    return f;
  };
  return { at, bridge, TL, moves: NM, nonMono, astar, readV, secs: (Date.now() - t0) / 1000, lattice: { na, nb, nz, ng: NG } };
}
