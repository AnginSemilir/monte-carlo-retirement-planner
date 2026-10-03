/*
 * 7AT'S READ (b): THE READER'S CONTINUATION EXTRAPOLATED ALONG THE SHARE ROW (the deep review after 7ar, deep-review-log.md
 * 3 Oct 21:52 UK: O76's decisive read). reader.js buildReaderTable gives each node p_i (the reference chance at its
 * accessible money), c_i (S_i / p_i where p_i >= 0.5, the supported nodes) and R_i = S_i - p_i c_i; an unsupported node on a
 * share row with support takes c from the NEAREST supported node in the row (a flat copy, l.106-112), and a row with none
 * takes another wealth row's (left as the reader has it here). Read (b) replaces the flat copy on rows with two or more
 * supported nodes on the near side: c_i = clip(c1 + (c1 - c2) / (a1 - a2) x (a_i - a1), 0, 1), from the nearest supported
 * node (a1, c1) and the next supported node beyond it on the same side (a2, c2), in the share coordinate a (grid.js toVec:
 * g.axes.a.pts); R_i = S_i - p_i c_i with S_i = p_i c_i(reader) + R_i(reader), so every node still reproduces S_i. A row with
 * one supported node on the near side keeps the flat copy (nothing to extrapolate from). Research only: no solver file reads
 * this.
 *   extrapolate(g, RD) -> { c, R, S, ex, extrapolated, flat }: the read-(b) arrays, ex[i] = 1 on each node extrapolated (so a
 *   read can say how much of its unsupported weight read (b) left as the reader had it), and the counts of unsupported nodes
 *   extrapolated and left flat (rows without support excluded: the reader's row copy stands)
 */
export function extrapolate(g, RD) {
  const n = g.size, c = Float64Array.from(RD.c), R = new Float64Array(n), S = new Float64Array(n), ex = new Uint8Array(n);
  const { np, ni, nt } = g, NG = g.gain.length, NCL = g.pcls.length, A = g.axes.a.pts;
  for (let i = 0; i < n; i++) S[i] = RD.p[i] * RD.c[i] + RD.R[i];
  const sup = i => RD.p[i] >= 0.5;
  let extrapolated = 0, flat = 0;
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
      let j2 = -1;
      for (let jj = j1 + dir; jj >= 0 && jj < ni; jj += dir) if (sup(idx(jj))) { j2 = jj; break; }
      if (j2 < 0) { flat++; continue; }
      const c1 = RD.c[idx(j1)], c2 = RD.c[idx(j2)], a1 = A[j1], a2 = A[j2];
      c[idx(ii)] = Math.min(1, Math.max(0, c1 + (c1 - c2) / (a1 - a2) * (A[ii] - a1)));
      ex[idx(ii)] = 1; extrapolated++;
    }
  }
  for (let i = 0; i < n; i++) R[i] = S[i] - RD.p[i] * c[i];
  return { c, R, S, ex, extrapolated, flat };
}
