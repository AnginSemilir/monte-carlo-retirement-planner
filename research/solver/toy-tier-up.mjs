/*
 * PLAN.md finding M14. Run: node research/solver/toy-tier-up.mjs (about 11 s, one core). Output: results-toy-tier-up.txt.
 *
 * A toy with the solver's structure: one pot in years of spending, spending paid before growth, the
 * app's tier returns (1 + r = exp(ln(1 + real) + vol * z)), a 5-node Gauss-Hermite average over markets,
 * backward induction, and at run time the best move by one-step lookahead at the exact position.
 * No tax, wrappers or three-world mixture. User's tier: Medium. Compares "down only" (today) with
 * "up allowed" (Medium plus two above and two below).
 */
const TIERS = [ // riskiest first
  { n: 'High', real: 0.0444, vol: 0.155 }, { n: 'Med/High', real: 0.0372, vol: 0.115 },
  { n: 'Medium', real: 0.03, vol: 0.08 }, { n: 'Med/Low', real: 0.0228, vol: 0.055 }, { n: 'Low', real: 0.0156, vol: 0.03 }];
const USER = 2;
const GH = { z: [-2.8569700138728056, -1.3556261799742657, 0, 1.3556261799742657, 2.8569700138728056],
             w: [0.011257411327720693, 0.22207592200561266, 0.5333333333333333, 0.22207592200561266, 0.011257411327720693] };
const N = 30, DW = 0.02, WMAX = 120, G = Math.round(WMAX / DW) + 1;
const growth = (k, z) => Math.exp(Math.log(1 + TIERS[k].real) + TIERS[k].vol * z);
const interp = (tab, w) => { if (w <= 0) return tab[0]; const x = w / DW; if (x >= G - 1) return tab[G - 1]; const i = Math.floor(x), f = x - i; return tab[i] * (1 - f) + tab[i + 1] * f; };

function solve(allowed, levels, lambda) {
  const V = [], P = [];              // V: score table; P: survival chance under the chosen moves
  V[N] = new Float64Array(G).fill(1); P[N] = new Float64Array(G).fill(1);
  const moves = []; for (const l of levels) for (const k of allowed) moves.push({ l, k, c: lambda * (1 - l) ** 2 });
  for (let t = N - 1; t >= 0; t--) {
    const v = new Float64Array(G), p = new Float64Array(G);
    for (let i = 0; i < G; i++) {
      const w = i * DW; let best = -Infinity, bp = 0;
      for (const m of moves) {
        if (w < m.l) continue;
        let e = 0, ep = 0;
        for (let j = 0; j < 5; j++) { const w2 = (w - m.l) * growth(m.k, GH.z[j]); e += GH.w[j] * interp(V[t + 1], w2); ep += GH.w[j] * interp(P[t + 1], w2); }
        e -= m.c;
        if (e > best + 1e-12) { best = e; bp = ep; }
      }
      v[i] = best === -Infinity ? 0 : best; p[i] = best === -Infinity ? 0 : bp;
    }
    V[t] = v; P[t] = p;
  }
  return { V, P, moves };
}
function choose(S, t, w) {
  let best = null, bs = -Infinity;
  for (const m of S.moves) {
    if (w < m.l) continue;
    let e = 0; for (let j = 0; j < 5; j++) e += GH.w[j] * interp(S.V[t + 1], (w - m.l) * growth(m.k, GH.z[j]));
    e -= m.c; if (e > bs + 1e-12) { bs = e; best = m; }
  }
  return best;
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function simulate(S, w0, paths = 20000, seed = 7002) {
  const r = rng(seed); let surv = 0, unfunded = 0, early = 0, cutYrs = 0; const ruinYr = [], endW = [], funded = [];
  let upYears = 0, liveYears = 0, upLosing = 0, upMid = 0, upSafe = 0;
  for (let p = 0; p < paths; p++) {
    let w = w0, t = 0, alive = true;
    for (; t < N; t++) {
      const m = choose(S, t, w);
      if (!m) { alive = false; break; }
      liveYears++; if (m.l < 1) cutYrs++;
      if (m.k < USER) { upYears++; const pr = interp(S.P[t], w); if (pr < 0.5) upLosing++; else if (pr < 0.9) upMid++; else upSafe++; }
      let u1 = r(), u2 = r(); while (u1 <= 1e-12) u1 = r();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      w = (w - m.l) * growth(m.k, z);
    }
    funded.push(t);
    if (alive) { surv++; endW.push(w); } else { unfunded += N - t; ruinYr.push(t); if (t < 20) early++; endW.push(0); }
  }
  endW.sort((a, b) => a - b); funded.sort((a, b) => a - b);
  const q = (a, f) => a[Math.floor(f * (a.length - 1))];
  return { surv: 100 * surv / paths, unfunded: unfunded / paths, ruinMean: ruinYr.length ? ruinYr.reduce((a, b) => a + b, 0) / ruinYr.length : NaN,
    early: 100 * early / paths, p10funded: q(funded, 0.05), medEnd: q(endW, 0.5), p10End: q(endW, 0.1), cutShare: 100 * cutYrs / liveYears,
    upShare: 100 * upYears / liveYears, upLosing, upMid, upSafe, upYears };
}
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2);
const down = [USER, 3, 4], up = [USER, 3, 4, 1, 0];   // user's tier listed first, so a tie never moves
for (const [label, levels, lambda] of [['tiers only (survival alone)', [1], 0], ['tiers + cuts to 95/90/80% (lambda 0.5)', [1, 0.95, 0.9, 0.8], 0.5]]) {
  console.log(`\n=== ${label} ===`);
  const A = solve(down, levels, lambda), B = solve(up, levels, lambda);
  console.log('policy map, tier chosen at the start of a year (paying spend 1):');
  for (const left of [30, 20, 10, 3]) {
    const t = N - left, row = [];
    for (const w of [1.5, 3, 5, 8, 12, 16, 20, 25, 30, 40]) {
      if (w > left * 2.5 && w > 8 && left < 10) continue;
      const mA = choose(A, t, w), mB = choose(B, t, w);
      row.push(`${w}:${mA ? TIERS[mA.k].n : 'x'}${mA && mA.l < 1 ? '@' + mA.l : ''}|${mB ? TIERS[mB.k].n : 'x'}${mB && mB.l < 1 ? '@' + mB.l : ''} (${(100 * interp(B.P[t], w)).toFixed(0)}%)`);
    }
    console.log(`  ${left} years left: ` + row.join('  '));
  }
  console.log('  (each entry: wealth in years of spending: down-only | up-allowed (survival chance up-allowed))');
  for (const w0 of [25, 20, 16]) {
    const a = simulate(A, w0), b = simulate(B, w0);
    console.log(`start ${w0} years of spending (${(100 / w0).toFixed(1)}% withdrawal), 30 years, 20,000 paths:`);
    for (const [n, s] of [['down only ', a], ['up allowed', b]])
      console.log(`  ${n}  survival ${f1(s.surv)}%  | mean years unfunded ${f2(s.unfunded)}  | failed paths run out in year ${f1(s.ruinMean)}  | run out before year 20: ${f1(s.early)}%  | worst 5% funded ${s.p10funded} yrs  | median end ${f1(s.medEnd)}  unlucky-tenth end ${f1(s.p10End)}  | cut years ${f1(s.cutShare)}%  | years above Medium ${f1(s.upShare)}%` + (s.upYears ? `  [up-moves made at survival <50%: ${f1(100 * s.upLosing / s.upYears)}%, 50-90%: ${f1(100 * s.upMid / s.upYears)}%, >90%: ${f1(100 * s.upSafe / s.upYears)}%]` : ''));
  }
}
