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
 *   - p is read by interpolation in log A, b and gf (zero below the A grid's foot, half of today's bill; `foot`: below).
 * `simulate` runs the reference's own rule forward from a state (the nearest lattice cell's joint move, the flow, the
 * world's own returns at fresh draws), so an audit can check p against it (audit-an.mjs's refTook). `plant` (audits only):
 * 'drift' grows every world at the centre world's rates, 'choice' values each world at its own best move, 'step' reads
 * the last bridge year off the A lattice (Step 0's smear) - each a fault the simulation should see.
 * Off (any other readerRef), nothing here runs.
 */
import * as F from './fast.js';
import { Phi } from './grid.js';

const ZLO = -8, ZHI = 8;

export function adaptiveReference({ cs, flowCtx, actions, levelOf, weights, years, billsOf, gains, realAt, PhiInv, na = 160, nb = 41, nz = 128, plant = '', foot = false, stepAll = false }) {
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
  const STEP = stepAll && plant !== 'stepramp', ASTY = stepAll ? stepThresholds() : {};   // `stepAll`: every bridge year's own step (stepThresholds, below)

  // 2. THE EARLIER BRIDGE YEARS, backward: V[k][t] on a log-A by b by gf lattice
  const AG = {}, V = Array.from({ length: K }, () => ({})), MV = {}, centre = K >> 1, V0 = Array.from({ length: K }, () => ({})), MV0 = {}; let footLive = 0;
  for (const t of bridge) {
    if (t === TL && plant !== 'step') continue;
    const bl = billsOf(t), d0 = bl[0], rem = bl.reduce((u, v) => u + Math.max(0, v), 0);
    const lo = Math.log(Math.max(100, 0.5 * d0)), hi0 = Math.log(3 * rem + (foot ? Math.max(d0, 0) : d0)), hi = foot && !(hi0 > lo + Math.LN2) ? lo + Math.LN2 : hi0;
    AG[t] = Float64Array.from({ length: na }, (_, i) => lo + (hi - lo) * i / (na - 1));
  }
  const readV = (k, t, A, b, gf) => {
    if (t > TL || !years[t]) return 1;
    if (t === TL && plant !== 'step') return A >= astar(b, gf) ? 1 : 0;
    if (t === TL) { const ag = AG[TL], fa = Math.max(0, Math.min(na - 1 - 1e-9, (Math.log(Math.max(A, 1e-9)) - ag[0]) / (ag[1] - ag[0]))), ia = Math.floor(fa), wa = fa - ia, a0 = astar(b, gf); return (1 - wa) * (Math.exp(ag[ia]) >= a0 ? 1 : 0) + wa * (Math.exp(ag[ia + 1]) >= a0 ? 1 : 0); }
    const ag = AG[t], arr = V[k][t];
    const a0 = STEP ? astarAt(t, b, gf) : 0; if (a0 > 0 && !(A >= a0)) return 0;   // `stepAll`: below the year's own step no floor move pays it
    if (foot) { if (!(A > 0) || Math.log(A) < ag[0]) return footRead(k, t, A, b, gf); } else if (!(A > 0)) return 0;
    const la = Math.log(A);
    if (la < ag[0]) return 0;
    const fa = Math.min(na - 1 - 1e-9, (la - ag[0]) / (ag[1] - ag[0])), ia = Math.floor(fa), wa = fa - ia;
    const [ib, wb] = bPos(b), [ig, wg] = gPos(gf), g2 = Math.min(NG - 1, ig + 1);
    const v = (i, j, g) => arr[(i * nb + j) * NG + g];
    const at = (i) => (1 - wb) * ((1 - wg) * v(i, ib, ig) + wg * v(i, ib, g2)) + wb * ((1 - wg) * v(i, ib + 1, ig) + wg * v(i, ib + 1, g2));
    return a0 > 0 && Math.exp(ag[ia]) < a0 ? at(ia + 1) : (1 - wa) * at(ia) + wa * at(ia + 1);   // `stepAll`: between the step and the first live node, that node's value
  };
  // the chance a post-flow state clears year TL's threshold after growing at the move's rates in world k
  const clearStep = (k, ai, t) => {
    const cg = cs[plant === 'drift' ? centre : k], ag2 = cg.acts[ai];
    const h = z => { grown.set(post); F.grow(cg, t, grown, realAt(cg, z, rr, ag2, t)); const A2 = grown[1] + grown[2]; return A2 - astar(A2 > 0 ? grown[1] / A2 : 0, grown[3]); };
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
    MV[t] = new Int32Array(na * nb * NG);
    for (let ia = 0; ia < na; ia++) for (let jb = 0; jb < nb; jb++) for (let ig = 0; ig < NG; ig++) {
      const A = Math.exp(ag[ia]), b = BG[jb], gf = gains[ig];
      setState(A, b, gf);
      for (let mi = 0; mi < NM; mi++) {
        const ai = moves[mi];
        if (!flowOk(t, ai)) { Q[mi].fill(0); continue; }
        const keep = Float64Array.from(post);
        for (let k = 0; k < K; k++) {
          post.set(keep);
          if (next === TL && plant !== 'step') { Q[mi][k] = clearStep(k, ai, t); continue; }
          if (STEP && ASTY[next]) { Q[mi][k] = expectSplit(k, ai, t, keep); continue; }
          const ck = cs[plant === 'drift' ? centre : k], act = ck.acts[ai];
          let acc = 0;
          for (let zi = 0; zi < nz; zi++) { grown.set(keep); F.grow(ck, t, grown, realAt(ck, ZS[zi], rr, act, t)); const A2 = grown[1] + grown[2]; acc += readV(k, next, A2, A2 > 0 ? grown[1] / A2 : 0, grown[3]); }
          Q[mi][k] = acc / nz;
        }
      }
      let best = 0, bestV = -1;
      for (let mi = 0; mi < NM; mi++) { let v = 0; for (let k = 0; k < K; k++) v += weights[k] * Q[mi][k]; if (v > bestV + 1e-15) { bestV = v; best = mi; } }
      const at = (ia * nb + jb) * NG + ig;
      MV[t][at] = best;
      for (let k = 0; k < K; k++) {
        let bk = best;
        if (plant === 'choice') { let bv = -1; for (let mi = 0; mi < NM; mi++) if (Q[mi][k] > bv + 1e-15) { bv = Q[mi][k]; bk = mi; } }
        V[k][t][at] = Q[bk][k];
      }
    }
    // `foot`: the A = 0 node of year t, by the same backward step (the flow, then the next year's read at each draw)
    if (foot) {
      for (let k = 0; k < K; k++) V0[k][t] = new Float64Array(nb * NG);
      MV0[t] = new Int32Array(nb * NG);
      for (let jb = 0; jb < nb; jb++) for (let ig = 0; ig < NG; ig++) {
        const b = BG[jb], gf = gains[ig];
        setState(0, b, gf);
        for (let mi = 0; mi < NM; mi++) {
          const ai = moves[mi];
          if (!flowOk(t, ai)) { Q[mi].fill(0); continue; }
          const keep = Float64Array.from(post);
          for (let k = 0; k < K; k++) {
            post.set(keep);
            if (next === TL && plant !== 'step') { Q[mi][k] = clearStep(k, ai, t); continue; }
            if (STEP && ASTY[next]) { Q[mi][k] = expectSplit(k, ai, t, keep); continue; }
            const ck = cs[plant === 'drift' ? centre : k], act = ck.acts[ai];
            let acc = 0;
            for (let zi = 0; zi < nz; zi++) { grown.set(keep); F.grow(ck, t, grown, realAt(ck, ZS[zi], rr, act, t)); const A2 = grown[1] + grown[2]; acc += readV(k, next, A2, A2 > 0 ? grown[1] / A2 : 0, grown[3]); }
            Q[mi][k] = acc / nz;
          }
        }
        let best = 0, bestV = -1;
        for (let mi = 0; mi < NM; mi++) { let v = 0; for (let k = 0; k < K; k++) v += weights[k] * Q[mi][k]; if (v > bestV + 1e-15) { bestV = v; best = mi; } }
        MV0[t][jb * NG + ig] = best;
        for (let k = 0; k < K; k++) { V0[k][t][jb * NG + ig] = plant === 'foot' && !(Q[best][k] > 0) ? 1 : Q[best][k]; if (V0[k][t][jb * NG + ig] > 0) footLive++; }
      }
    }
  }
  // `foot` (research only, default off; PLAN.md AREF, FOOT-S366, items/FOOT-S366.md; the deep review after AX-HO, deep-review-log.md
  // 18 Oct 01:41 UK, O177): in a year whose inflow covers its own bill (a negative bill: S366's inheritance year) the
  // reference's p at no accessible money is not 0, yet readV returned 0 there and below the A grid's foot. With `foot`, each
  // bridge year before the last carries an A = 0 node valued by the same backward step through the flow, readV reads it at
  // A = 0 and interpolates in A between it and the grid's first point below the foot, and the grid's top is taken at
  // log(3 rem + max(d0, 0)) (O178: log(3 rem + d0) is NaN or under the foot when an inflow exceeds its year's bill plus three
  // times the later bills). Where no move pays a year at A = 0 the node is 0 and every read is as without it (inert). The
  // plant 'foot' values a node of 0 as sure to pay, breaking that (a fault the bit-for-bit check should see).
  // footLive counts the A = 0 nodes (world by year by b by gain node) whose value is not 0, for an audit's footTook.
  function footRead(k, t, A, b, gf) {
    const ag = AG[t], arr = V[k][t], z0 = V0[k][t], [ib, wb] = bPos(b), [ig, wg] = gPos(gf), g2 = Math.min(NG - 1, ig + 1);
    const bg = (f) => (1 - wb) * ((1 - wg) * f(ib, ig) + wg * f(ib, g2)) + wb * ((1 - wg) * f(ib + 1, ig) + wg * f(ib + 1, g2));
    const v0 = bg((j, g) => z0[j * NG + g]);
    if (!(A > 0)) return v0;
    // a node of 0 reads 0 below the foot as without `foot`
    return v0 > 0 ? v0 + (A / Math.exp(ag[0])) * (bg((j, g) => arr[j * NG + g]) - v0) : 0;
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
  // THE RULE RUN FORWARD: from (A, b, gf) in bridge year t of world k, each year the nearest lattice cell's joint move (in the
  // last bridge year, any floor move that pays), the flow, and growth at the world's own rates at a fresh draw (`gauss`);
  // returns the share of `nsim` runs that pay every year to access
  const nearest = (t, A, b, gf) => {
    if (foot && !(A > 0) && MV0[t]) { const jb0 = Math.max(0, Math.min(nb - 1, Math.round(Math.max(0, b) * (nb - 1)))); let ig0 = 0; for (let i = 1; i < NG; i++) if (Math.abs(gains[i] - gf) < Math.abs(gains[ig0] - gf)) ig0 = i; return MV0[t][jb0 * NG + ig0]; }
    const ag = AG[t]; let ia = Math.max(0, Math.min(na - 1, Math.round((Math.log(Math.max(A, 1e-9)) - ag[0]) / (ag[1] - ag[0]))));
    if (STEP && ASTY[t]) { const a0 = astarAt(t, b, gf); if (a0 > 0 && A >= a0 && Math.exp(ag[ia]) < a0) ia = Math.min(na - 1, ia + 1); }   // `stepAll`: in the step's cell, the live node's move
    const jb = Math.max(0, Math.min(nb - 1, Math.round(Math.max(0, b) * (nb - 1))));
    let ig = 0; for (let i = 1; i < NG; i++) if (Math.abs(gains[i] - gf) < Math.abs(gains[ig] - gf)) ig = i;
    return MV[t][(ia * nb + jb) * NG + ig];
  };
  const simulate = (k, t, A0, b0, gf0, nsim, gauss) => {
    let ok = 0;
    for (let n = 0; n < nsim; n++) {
      let A = A0, b = b0, gf = gf0, alive = true;
      for (let y = t; y <= TL && alive; y++) {
        setState(A, b, gf);
        if (y === TL) { alive = false; for (const ai of moves) if (flowOk(TL, ai)) { alive = true; break; } break; }
        const ai = moves[nearest(y, A, b, gf)];
        if (!flowOk(y, ai)) { alive = false; break; }
        const ck = cs[k]; grown.set(post); F.grow(ck, y, grown, realAt(ck, gauss(), rr, ck.acts[ai], y));
        A = grown[1] + grown[2]; b = A > 0 ? grown[1] / A : 0; gf = grown[3];
      }
      if (alive) ok++;
    }
    return ok / nsim;
  };
  // `stepAll` (research only, default off; PLAN.md REF-STEP, PR29; the deep review after REF-B, deep-review-log.md 20 Oct 02:53
  // UK): every bridge year's own step read exactly, not only the last's. Each bridge year has one (below some A no floor move
  // pays the year), and the lattice read of an earlier year ramps across it between a dead node and a live one, valuing dead
  // states (S362's year 3, before its inflow, where p is a 0/1 step). With `stepAll`, each earlier bridge year's threshold
  // A*_t(b, gf) is found by bisection as the last year's is (stepThresholds; a year that pays at A = 0 has A*_t = 0, no step);
  // readV returns 0 below it and, between it and the first live node above, that node's value (no ramp), and the rule run
  // forward takes that node's move; the year before splits its expectation at the shock where the grown money clears A*_t,
  // averaging the live side at `nz` midpoints in u (expectSplit, as clearStep splits the year before the last at A*). Off,
  // nothing changes. The plant 'stepramp' (audits only) keeps the thresholds but reads, averages and moves as without it.
  function stepThresholds() {
    const out = {};
    for (const t of bridge) {
      if (t === TL) continue;
      const arr = new Float64Array(nb * NG), pays = (A, b, gf) => { setState(A, b, gf); for (const ai of moves) if (flowOk(t, ai)) return true; return false; };
      for (let ig = 0; ig < NG; ig++) for (let jb = 0; jb < nb; jb++) {
        const b = BG[jb], gf = gains[ig];
        if (pays(0, b, gf)) { arr[jb * NG + ig] = 0; continue; }
        let hi = Math.max(1000, 4 * Math.max(0, billsOf(t)[0]));
        while (hi < BIG && !pays(hi, b, gf)) hi *= 2;
        if (hi >= BIG) { arr[jb * NG + ig] = BIG; continue; }
        let lo = 0;
        for (let it = 0; it < 60 && hi - lo > 1e-6; it++) { const mid = 0.5 * (lo + hi); if (pays(mid, b, gf)) hi = mid; else lo = mid; }
        arr[jb * NG + ig] = hi;
        if (!pays(hi * 1.5, b, gf)) nonMono++;
      }
      out[t] = arr;
    }
    return out;
  }
  // year t's threshold at (b, gf), interpolated on the b and gain nodes as astar is (the last year's is astar's own)
  function astarAt(t, b, gf) {
    if (t === TL) return astar(b, gf);
    const arr = ASTY[t]; if (!arr) return 0;
    const [ib, wb] = bPos(b), [ig, wg] = gPos(gf), g2 = Math.min(NG - 1, ig + 1);
    const v = (j, i) => arr[j * NG + i];
    return (1 - wb) * ((1 - wg) * v(ib, ig) + wg * v(ib, g2)) + wb * ((1 - wg) * v(ib + 1, ig) + wg * v(ib + 1, g2));
  }
  // the year before an earlier year's step: the expectation over the shock split where the grown money clears A*_next
  function expectSplit(k, ai, t, keep) {
    const next = t + 1, ck = cs[plant === 'drift' ? centre : k], act = ck.acts[ai];
    const at2 = z => { grown.set(keep); F.grow(ck, t, grown, realAt(ck, z, rr, act, t)); return grown[1] + grown[2]; };
    const h = z => { const A2 = at2(z); return A2 - astarAt(next, A2 > 0 ? grown[1] / A2 : 0, grown[3]); };
    let uLo = 0;
    if (h(ZLO) < 0) {
      if (h(ZHI) < 0) return 0;
      let lo = ZLO, hi = ZHI;
      for (let it = 0; it < 50; it++) { const mid = 0.5 * (lo + hi); if (h(mid) >= 0) hi = mid; else lo = mid; }
      uLo = Phi(hi);
    }
    let acc = 0;
    for (let zi = 0; zi < nz; zi++) { const A2 = at2(uLo > 0 ? PhiInv(uLo + (1 - uLo) * (zi + 0.5) / nz) : ZS[zi]); acc += readV(k, next, A2, A2 > 0 ? grown[1] / A2 : 0, grown[3]); }
    return (1 - uLo) * acc / nz;
  }
  return { at, bridge, TL, moves: NM, nonMono, astar, readV, simulate, moveAt: (t, A, b, gf) => moves[nearest(t, A, b, gf)], moveList: moves.slice(), secs: (Date.now() - t0) / 1000, lattice: { na, nb, nz, ng: NG, ...(foot ? { foot: true } : {}), ...(stepAll ? { stepAll: true } : {}) }, plant, astarAt, ...(foot ? { footLive } : {}) };   // moveAt, moveList: the rule's own move and floor moves, for an audit's engine run (audit-ao.mjs)
}
