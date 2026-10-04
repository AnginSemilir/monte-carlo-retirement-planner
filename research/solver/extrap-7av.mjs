/*
 * 7AV'S EXTRAPOLATIONS OF THE READER'S CONTINUATION ALONG THE SHARE ROW (the step-read test; the deep review after 7at,
 * deep-review-log.md 4 Oct 03:18 UK). extrap-7at.mjs's read (b) - the reader's flat copy (reader.js buildReaderTable l.106-112)
 * replaced on a row by a straight line through the nearest supported node and the next one beyond it on the same side -
 * generalised to a polynomial of order 1 (the straight line, identical to extrap-7at.mjs's, held by reduce-7av.mjs's planted
 * checks) or 2 (a quadratic through the nearest three supported nodes on the same side, falling back to the straight line
 * where the side has two, and to the flat copy where it has one), with the counts a read needs:
 *   extrapolateOrder(g, RD, order) -> { c, R, S, ex, extrapolated, flat, fellBack, clipLo, clipHi }
 *     c: the continuation per node (clipped to 0 to 1); R = S - p c, so every node still reproduces S = p c(reader) + R(reader);
 *     ex[i] = 1 on each node extrapolated; extrapolated, flat: the unsupported nodes extrapolated and left flat (one
 *     supported node on the near side; rows with no support excluded: the reader's row copy stands); fellBack: the nodes a
 *     quadratic took as a straight line (two supported nodes on the side); clipLo, clipHi: the nodes whose polynomial value
 *     fell below 0 or above 1 and were clipped (the deep review's per-node clip counts).
 *   isStep(RD) -> true when every node's reference chance is 0 or 1 (to 1e-12): the year's reference is a pure step - the
 *     last bill before access (reader.js referenceChance l.56, one bill) or a step before an inflow - the deep review's STEP
 *     read; any other table is a SPREAD read.
 * Research only: no solver file reads this.
 */
export function extrapolateOrder(g, RD, order = 1) {
  if (order !== 1 && order !== 2) throw new Error(`extrapolateOrder: order ${order}, not 1 or 2`);
  const n = g.size, c = Float64Array.from(RD.c), R = new Float64Array(n), S = new Float64Array(n), ex = new Uint8Array(n);
  const { np, ni, nt } = g, NG = g.gain.length, NCL = g.pcls.length, A = g.axes.a.pts;
  for (let i = 0; i < n; i++) S[i] = RD.p[i] * RD.c[i] + RD.R[i];
  const sup = i => RD.p[i] >= 0.5;
  let extrapolated = 0, flat = 0, fellBack = 0, clipLo = 0, clipHi = 0;
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    const idx = ii => g.index(ip, ii, it, ig, ic);
    let any = false;
    for (let ii = 0; ii < ni; ii++) if (sup(idx(ii))) { any = true; break; }
    if (!any) continue;
    for (let ii = 0; ii < ni; ii++) {
      if (sup(idx(ii))) continue;
      // the nearest supported node, searched as reader.js does (a tie to the lower share)
      let j1 = -1, dir = 0;
      for (let d = 1; d < ni; d++) {
        if (ii - d >= 0 && sup(idx(ii - d))) { j1 = ii - d; dir = -1; break; }
        if (ii + d < ni && sup(idx(ii + d))) { j1 = ii + d; dir = 1; break; }
      }
      const js = [j1];
      for (let jj = j1 + dir; jj >= 0 && jj < ni && js.length < order + 1; jj += dir) if (sup(idx(jj))) js.push(jj);
      if (js.length < 2) { flat++; continue; }
      if (order === 2 && js.length < 3) fellBack++;
      // the Lagrange polynomial through the nodes found (two: the straight line; three: the quadratic) at the node's share
      const x = A[ii];
      let v = 0;
      for (let a = 0; a < js.length; a++) {
        let w = 1;
        for (let b = 0; b < js.length; b++) if (b !== a) w *= (x - A[js[b]]) / (A[js[a]] - A[js[b]]);
        v += w * RD.c[idx(js[a])];
      }
      if (js.length === 2) v = RD.c[idx(js[0])] + (RD.c[idx(js[0])] - RD.c[idx(js[1])]) / (A[js[0]] - A[js[1]]) * (x - A[js[0]]);   // extrap-7at.mjs's own arithmetic, so order 1 is its read (b) to the bit
      if (v < 0) clipLo++; else if (v > 1) clipHi++;
      c[idx(ii)] = Math.min(1, Math.max(0, v));
      ex[idx(ii)] = 1; extrapolated++;
    }
  }
  for (let i = 0; i < n; i++) R[i] = S[i] - RD.p[i] * c[i];
  return { c, R, S, ex, extrapolated, flat, fellBack, clipLo, clipHi };
}
export const isStep = RD => { for (let i = 0; i < RD.p.length; i++) { const q = RD.p[i]; if (!(q <= 1e-12 || q >= 1 - 1e-12)) return false; } return true; };
