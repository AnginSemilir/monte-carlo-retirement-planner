/*
 * PHASE 4'S PATHS AND THRESHOLDS, BY THE MAINTAINER'S HARM RULE (STATE.md D34), FROM THE PILOT.
 * Per household and estate weight, two comparisons each with its own threshold: the candidate against the app's rules
 * (CAND/W less APP) and against the shipping solver (CAND/W less SHIP/W). For each, from the pilot's units (seed 7002,
 * audit-phase4.mjs with P4_PILOT=1): the discordance (the share of paths one arm survives and the other does not) and its
 * Clopper-Pearson upper 95% bound, the bound the sizing uses (a 1-point loss needs a discordance of at least 1%, so never
 * below 1.01%). The observed loss is L = 100 (lost - saved) / N points. At a discordance d and a true loss D points, a
 * path is discordant with chance d, and a discordant path is lost with chance 1/2 + D / (200 d). Then:
 *   - the threshold: the smallest t on L's lattice with P(L > t) at most 5% at a true quarter-point loss;
 *   - the rate at 1 point: P(L > t) at a true 1-point loss, at least 90% by D34;
 *   - the paths: the household's N, the smallest multiple of 1,000 from 16,000 at which every comparison of the household
 *     (two arms, two weights) meets both rates; its threshold at that N for each comparison.
 * The rates are the binomial sums computed exactly (no simulation error), held to a direct convolution of the paired paths
 * (--planted) and checked by simulation on a few cases (--check);
 * beside each, D34's normal cross-check: t = 0.25 + 1.645 x se, se = 100 sqrt(d / N), paths >= d x 152,000.
 *   node research/solver/size-phase4.mjs [pilot dir] > research/solver/results-phase4-sizing.txt   (writes phase4-paths.json)
 *   node research/solver/size-phase4.mjs --planted | --check
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { betaInc, clopperPearson } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FP_LOSS = 0.25, TP_LOSS = 1, FP_MAX = 0.05, TP_MIN = 0.90, N_FLOOR = 16000, N_STEP = 1000, N_MAX = 200000, D_MIN = 0.0101;

/* ln of the binomial pmf, by lgamma (Lanczos) */
const LG = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
function lgamma(x) { let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const c of LG) s += c / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
/* P(X >= m), X ~ Bin(n, q) */
const upperTail = (m, n, q) => (m <= 0 ? 1 : m > n ? 0 : q <= 0 ? 0 : q >= 1 ? 1 : betaInc(m, n - m + 1, q));

/* P(L > t) at a discordance d, N paths and a true loss D (points): the sum over K discordant paths of Bin(K; N, d) times
   P(lost > (K + tN/100) / 2 | K), lost ~ Bin(K, 1/2 + D / (200 d)); K over d N +/- 9 sd (the rest below 1e-18) */
export function harmRate(d, N, t, D) {
  const q = 0.5 + D / (200 * d);
  if (q > 1) return NaN;   // a true loss of D needs a discordance of at least D / 100
  const mu = N * d, sd = Math.sqrt(N * d * (1 - d)), lo = Math.max(0, Math.floor(mu - 9 * sd - 5)), hi = Math.min(N, Math.ceil(mu + 9 * sd + 5));
  let p = 0;
  for (let K = lo; K <= hi; K++) {
    const w = Math.exp(lchoose(N, K) + K * Math.log(d) + (N - K) * Math.log1p(-d));
    if (w < 1e-18) continue;
    // L > t  <=>  2 lost - K > t N / 100  <=>  lost >= floor((K + t N / 100) / 2) + 1
    const m = Math.floor((K + t * N / 100) / 2 + 1e-9) + 1;
    p += w * upperTail(m, K, q);
  }
  return Math.min(1, p);
}
/* the smallest threshold on L's lattice (100 j / N) with P(L > t) at most FP_MAX at a true FP_LOSS */
export function thresholdFor(d, N) {
  let j = Math.max(0, Math.floor(FP_LOSS * N / 100));
  while (harmRate(d, N, 100 * j / N, FP_LOSS) > FP_MAX) j++;
  return 100 * j / N;
}
/* the paths and threshold for a set of discordances (one household's comparisons) */
export function sizeFor(ds) {
  const dd = ds.map(d => Math.max(d, D_MIN));
  for (let N = N_FLOOR; N <= N_MAX; N += N_STEP) {
    const rows = dd.map(d => { const t = thresholdFor(d, N); return { d, t, fp: harmRate(d, N, t, FP_LOSS), tp: harmRate(d, N, t, TP_LOSS) }; });
    if (rows.every(r => r.tp >= TP_MIN)) return { N, rows };
  }
  throw new Error(`size-phase4: no N up to ${N_MAX} meets both rates at discordances ${dd.join(', ')}`);
}
export const normalCheck = (d, N) => { const se = 100 * Math.sqrt(d / N); return { se, t: FP_LOSS + 1.645 * se, nNeeded: Math.ceil(d * 152000) }; };

/* the pilot's discordances: per household, per weight, per comparison (the pilot's units as audit-phase4.mjs writes them) */
function discordances(dir) {
  const U = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) { const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); ((U[j.id] ||= {})[`${j.arm}/${j.w}`] = j); }
  const bits = j => Buffer.from(j.main.survived, 'base64');
  const disc = (a, b) => { const x = bits(a), y = bits(b), n = Math.min(x.length, y.length); let k = 0; for (let i = 0; i < n; i++) if (x[i] !== y[i]) k++; return { k, n }; };
  return Object.fromEntries(Object.entries(U).map(([id, u]) => [id, Object.fromEntries(['0.02', '0.01'].flatMap(w => [[`APP/${w}`, u[`CAND/${w}`] && u['APP/-'] ? disc(u[`CAND/${w}`], u['APP/-']) : null], [`SHIP/${w}`, u[`CAND/${w}`] && u[`SHIP/${w}`] ? disc(u[`CAND/${w}`], u[`SHIP/${w}`]) : null]]))]));
}

function planted() {
  const cases = [];
  // the maintainer's cross-check: 16,000 paths up to 10.5% discordance, about 14,000 at 9.2% (D34)
  { const a = normalCheck(0.105, 16000), b = normalCheck(0.092, 16000); cases.push(['D34\'s normal cross-check: 10.5% needs 15,960 paths, 9.2% needs 13,984', `${a.nNeeded} ${b.nNeeded}`, '15960 13984']); }
  // the exact rates against the normal approximation where it holds (d 9%, N 16,000)
  { const t = thresholdFor(0.09, 16000), fp = harmRate(0.09, 16000, t, FP_LOSS), tp = harmRate(0.09, 16000, t, TP_LOSS), nt = normalCheck(0.09, 16000).t;
    cases.push(['at 9% and 16,000 paths: false alarms at most 5%, the threshold within 0.02 of the normal one, a 1-point loss caught at least 90%', `${fp <= 0.05} ${Math.abs(t - nt) < 0.02} ${tp >= 0.9}`, 'true true true']); }
  // the edges
  { const r = sizeFor([0.20]); cases.push(['at 20% the paths grow past 16,000 (about 30,400 by the normal check)', `${r.N > 16000} ${Math.abs(r.N - 30400) <= 2000}`, 'true true']); }
  { const r = sizeFor([0.0]); cases.push(['no discordance: sized at the 1.01% a 1-point loss needs, 16,000 paths', `${r.N} ${r.rows[0].d}`, '16000 0.0101']); }
  // the binomial sums against a direct convolution of the paired paths (each path +1, -1 or 0), on a size it can afford
  { const dp = (d, N, D, t) => { const pl = d / 2 + D / 200, ps = d - pl; let f = new Float64Array(2 * N + 1); f[N] = 1;
      for (let i = 0; i < N; i++) { const g = new Float64Array(2 * N + 1); for (let k = 0; k <= 2 * N; k++) { const v = f[k]; if (!v) continue; g[k] += v * (1 - d); if (k < 2 * N) g[k + 1] += v * pl; if (k > 0) g[k - 1] += v * ps; } f = g; }
      const j = Math.round(t * N / 100); let p = 0; for (let x = j + 1; x <= N; x++) p += f[x + N]; return p; };
    const t = thresholdFor(0.05, 2000), u = thresholdFor(0.2, 3000);
    const gaps = [[0.05, 2000, 0.25, t], [0.05, 2000, 1, t], [0.2, 3000, 0.25, u], [0.2, 3000, 1, u]].map(([d, N, D, tt]) => Math.abs(dp(d, N, D, tt) - harmRate(d, N, tt, D)));
    cases.push(['the binomial sums agree with a direct convolution to 1e-9 (four cases)', `${gaps.every(g => g < 1e-9)}`, 'true']); }
  cases.push(['a 1-point loss is impossible below 1% discordance', `${Number.isNaN(harmRate(0.005, 16000, 0.3, 1))}`, 'true']);
  { const r = sizeFor([0.03, 0.12]); cases.push(['a household is sized by its widest comparison', `${r.N === sizeFor([0.12]).N}`, 'true']); }
  { const t = thresholdFor(0.05, 20000); cases.push(['a threshold sits on the lattice of losses (a whole number of paths)', `${Math.abs(t * 200 - Math.round(t * 200)) < 1e-9}`, 'true']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log('EDGES: no discordance, below the 1% a 1-point loss needs, a household above 10.5%, the threshold on the lattice');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

/* the exact rates checked by simulation: R replicates of N paired paths */
function check() {
  let seed = 7002; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  for (const [d, N] of [[0.05, 16000], [0.105, 16000], [0.2, 32000]]) {
    const t = thresholdFor(d, N), R = 2000;
    for (const D of [FP_LOSS, TP_LOSS]) {
      const pl = d / 2 + D / 200; let hits = 0;
      for (let r = 0; r < R; r++) { let s = 0; for (let i = 0; i < N; i++) { const u = rnd(); if (u < pl) s++; else if (u < d) s--; } if (100 * s / N > t) hits++; }
      console.log(`  d ${(100 * d).toFixed(1)}% N ${N} t ${t.toFixed(4)} true loss ${D}: exact ${harmRate(d, N, t, D).toFixed(4)}, simulated ${(hits / R).toFixed(4)} (${R} replicates, se ${Math.sqrt(harmRate(d, N, t, D) * (1 - harmRate(d, N, t, D)) / R).toFixed(4)})`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  if (process.argv[2] === '--check') { check(); process.exit(0); }
  if (planted()) process.exit(1);
  const dir = process.argv[2] || join(HERE, 'results', 'p4-pilot'), D = discordances(dir), panel = JSON.parse(readFileSync(join(HERE, 'phase4-panel.json'), 'utf8')).panel;
  const missing = panel.flatMap(h => Object.entries(D[h.id] || {}).filter(([, v]) => !v).map(([k]) => `${h.id} ${k}`).concat(D[h.id] ? [] : [`${h.id} (no units)`]));
  if (missing.length) { console.log(`SIZING REFUSED: the pilot lacks ${missing.join(', ')}`); process.exit(1); }
  console.log(`PHASE 4'S PATHS AND THRESHOLDS (D34), from the pilot in ${dir}: per household and estate weight, the candidate against the app's rules (APP) and against the shipping solver (SHIP); d the pilot's discordance (k of n), d+ its upper 95% bound (the sizing's); t the threshold (harm when the observed loss is above it); the rates at a true quarter-point and 1-point loss, exact; D34's normal check beside`);
  const out = { paths: {}, thresholds: {} };
  let total = 0;
  for (const h of panel) {
    const comps = Object.entries(D[h.id]).map(([cmp, v]) => ({ cmp, k: v.k, n: v.n, dHat: v.k / v.n, dUp: clopperPearson(v.k, v.n).hi }));
    const r = sizeFor(comps.map(c => c.dUp));
    out.paths[h.id] = r.N; total += r.N;
    out.thresholds[h.id] = Object.fromEntries(comps.map((c, i) => [c.cmp, { d: +r.rows[i].d.toFixed(6), t: +r.rows[i].t.toFixed(6), fp: +r.rows[i].fp.toFixed(4), tp: +r.rows[i].tp.toFixed(4) }]));
    console.log(`${h.id.padEnd(6)} ${h.cohort.padEnd(4)} paths ${r.N}`);
    comps.forEach((c, i) => { const x = r.rows[i], n = normalCheck(x.d, r.N); console.log(`  ${c.cmp.padEnd(9)} d ${(100 * c.dHat).toFixed(2)}% (${c.k} of ${c.n}) d+ ${(100 * c.dUp).toFixed(2)}%: t ${x.t.toFixed(4)}, false alarm at 0.25 ${x.fp.toFixed(4)}, caught at 1 ${x.tp.toFixed(4)} | normal: se ${n.se.toFixed(4)}, t ${n.t.toFixed(4)}, paths for d+ ${n.nNeeded}`); });
  }
  console.log(`TOTAL: ${panel.length} households, ${total} paths a unit summed (${(total / panel.length).toFixed(0)} on average); households above 16,000: ${Object.values(out.paths).filter(n => n > 16000).length}`);
  writeFileSync(join(HERE, 'phase4-paths.json'), JSON.stringify(out, null, 1) + '\n');
}
