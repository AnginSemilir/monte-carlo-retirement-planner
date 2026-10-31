/*
 * A ONE-POT REFERENCE WITH AN INDEPENDENTLY KNOWN ANSWER (the external review of 21 Oct, Part B Step 5, V2). Imports
 * nothing from src/solver. One pot, no tax, constant real spending, one return tier, one world: each year the household
 * pays `spend` from the pot (a year more than £1 short fails, as the engine and the solver count it), and what is left
 * grows by exp(mu + sigma z), z standard normal. The chance of surviving every year from wealth W at the start of year t,
 * V_t(W), is solved backward on `n` log-wealth points from the year's own threshold (W = spend - 1, below which the year
 * fails) upward: between two points V_{t+1} is linear in log wealth, so the year's expectation against the lognormal is
 * exact for that interpolant (a normal's mass and partial mean on each segment), and below the threshold it is 0 exactly
 * (the step is a node, never interpolated). The top point carries V flat beyond it.
 *   solveOnePot({ W0, spend, years, mu, sigma, n, spanSd }) -> { V0, at(t, W) }
 *   simulateOnePot({ W0, spend, years, mu, sigma, paths, seed }) -> { survival, se }   (its own generator)
 */
const SQ2PI = Math.sqrt(2 * Math.PI);
const phi = x => Math.exp(-0.5 * x * x) / SQ2PI;
// the standard normal's CDF, from erfc by its continued fraction in the tails and its series near 0 (double precision)
export function Phi(x) {
  if (x < -8) { let f = -x; for (let k = 60; k >= 1; k--) f = -x + k / f; return phi(x) / f; }
  if (x > 8) return 1 - Phi(-x);
  // the series sum of x^(2k+1) / (1*3*...*(2k+1)), stable for |x| <= 8 at double precision near the centre
  if (Math.abs(x) < 3) { let s = x, t = x; for (let k = 1; k < 200; k++) { t *= x * x / (2 * k + 1); s += t; if (Math.abs(t) < 1e-17 * Math.abs(s)) break; } return 0.5 + phi(x) * s; }
  // the tails by the continued fraction of Q(z) = phi(z) / (z + 1/(z + 2/(z + ...)))
  const z = Math.abs(x); let f = z; for (let k = 80; k >= 1; k--) f = z + k / f; const q = phi(z) / f;
  return x > 0 ? 1 - q : q;
}

export function solveOnePot({ W0, spend, years, mu, sigma, n = 2400, spanSd = 9 }) {
  const T = years - 1;                                   // years 0..T
  const lo = Math.log(Math.max(1e-9, spend - 1));        // the year's threshold, a node
  const hi = Math.max(Math.log(W0) + 3, Math.log(spend * years) + spanSd * sigma * Math.sqrt(years) + Math.abs(mu) * years);
  const u = Float64Array.from({ length: n }, (_, i) => lo + (hi - lo) * i / (n - 1));
  const V = Array.from({ length: years }, () => new Float64Array(n));
  // the final year: it is paid when the pot is at least spend - 1 (no floor after it)
  V[T].fill(1);
  // E[V_{t+1}(y G)] for y > 0: ln(yG) ~ N(m, sigma^2), m = ln y + mu; V linear in ln wealth on each segment
  const expect = (Vn, y) => {
    if (!(y > 0)) return 0;
    const m = Math.log(y) + mu;
    // only the segments within 9 sd of the mean carry mass above 1e-18; the rest add nothing at double precision
    const du = (hi - lo) / (n - 1), j0 = Math.max(0, Math.floor((m - 9 * sigma - lo) / du)), j1 = Math.min(n - 1, Math.ceil((m + 9 * sigma - lo) / du));
    if (j0 >= n - 1) return Vn[n - 1];
    let e = 0, Pprev = Phi((u[j0] - m) / sigma), phPrev = phi((u[j0] - m) / sigma);
    for (let j = j0; j < Math.min(j1, n - 1); j++) {
      const b1 = (u[j + 1] - m) / sigma, P1 = Phi(b1), ph1 = phi(b1);
      const P = P1 - Pprev;
      if (P > 0) {
        const slope = (Vn[j + 1] - Vn[j]) / (u[j + 1] - u[j]);
        const meanU = m * P + sigma * (phPrev - ph1);     // E[ln(yG); segment]
        e += Vn[j] * P + slope * (meanU - u[j] * P);
      }
      Pprev = P1; phPrev = ph1;
    }
    return e + (j1 >= n - 1 ? Vn[n - 1] * (1 - Pprev) : 0);   // beyond the top point, flat
  };
  for (let t = T - 1; t >= 0; t--) for (let i = 0; i < n; i++) V[t][i] = expect(V[t + 1], Math.exp(u[i]) - spend);
  // V_t at any W: 0 below the threshold, linear in ln W between nodes, flat above
  const at = (t, W) => {
    if (W < spend - 1) return 0;
    const x = Math.log(W);
    if (x >= u[n - 1]) return V[t][n - 1];
    const k = Math.min(n - 2, Math.max(0, Math.floor((x - lo) / (hi - lo) * (n - 1))));
    const w = (x - u[k]) / (u[k + 1] - u[k]);
    return V[t][k] * (1 - w) + V[t][k + 1] * w;
  };
  return { V0: at(0, W0), at, nodes: n };
}

// mulberry32 and Box-Muller: the oracle's own paths, independent of the engine's generator
function gauss(seed) {
  let s = seed >>> 0, spare = null;
  const u = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => { if (spare !== null) { const x = spare; spare = null; return x; } let a = 0; while (a === 0) a = u(); const b = u(), r = Math.sqrt(-2 * Math.log(a)); spare = r * Math.sin(2 * Math.PI * b); return r * Math.cos(2 * Math.PI * b); };
}
export function simulateOnePot({ W0, spend, years, mu, sigma, paths, seed = 99004 }) {
  const g = gauss(seed);
  let ok = 0;
  for (let p = 0; p < paths; p++) {
    let W = W0, alive = true;
    for (let t = 0; t < years; t++) {
      if (W < spend - 1) { alive = false; break; }
      W = Math.max(0, W - spend) * Math.exp(mu + sigma * g());
    }
    if (alive) ok++;
  }
  const p = ok / paths;
  return { survival: p, se: Math.sqrt(p * (1 - p) / paths) };
}
