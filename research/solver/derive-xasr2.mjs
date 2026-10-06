/*
 * XAS-R2'S DERIVATION (predictions/diag-xasr2.md, the Derivation, Power and Credence sections). From XAS-R's per-read files
 * through every gate but the BASE guard (derive-xasr-observed.mjs's loading; results-xasr.txt reports the guard failed on
 * (v-a), which XAS-R2 does not read): only the columns no node cache touched - each arm's read and ex5 (held to XAS's read
 * for read by the identity) and BASE's vb (BASE filled every cached row first, O109) - are used.
 *   1. THE SIZES: on S370 in each year before a step, COV's per-path P = sum (read - ex5) (item 1's denominator) and BASE's
 *      per-path (read - vb), the midpoint node's own movement where there is little to remove: its spread is the noise
 *      proxy for D under COV.
 *   2. ITEM 1's POWER: for a true share s, D = s P + e (e: BASE's per-path read - vb, centred, paired by path), read by the
 *      registered rule (reduce-xasr2.mjs items: flipP, Holm over four, LO1 0.2, HI1 0.5, the bounds), over R bootstrap
 *      resamples of the paths; the chance of HELD, FALSIFIED and INCONCLUSIVE at each s.
 *   3. THE CREDENCES: the deep review's cause credences (deep-review-log.md 5 Oct 23:18 UK, CAUSE CREDENCES) as stories, each
 *      with its expected reading (item 1: YB-TOPCELL s 0.7, YB-REF and YB-NODEQ s 0.1, the rest s 0.35; item 2 and item 3 by
 *      the stated maps), shaded toward the deep-review record's base rate (ranked causes read as ranked 1 of 19).
 *   node research/solver/derive-xasr2.mjs > research/solver/results-derive-xasr2.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, checkFile, openCheck, xasFiles, stampOf, perPath, PRED } from './reduce-xasr.mjs';
import { logsOf } from './reduce-xas.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { LO1, HI1, S_MIN, S_MAX, ALPHA } from './reduce-xasr2.mjs';

const R_BOOT = 60, B_FLIP = 2000;
const mean = a => a.reduce((s, x) => s + x, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), f2 = x => x.toFixed(2);
// a seeded generator (mulberry32) for the bootstrap: the output is reproducible
const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// the registered rule of item 1 (reduce-xasr2.mjs items), on per-path D and P by year
export function itemOne(years) {
  const per = years.map(({ D, P }) => ({ s: D.reduce((q, x) => q + x, 0) / P.reduce((q, x) => q + x, 0), lo: D.map((d, i) => d - LO1 * P[i]), hi: D.map((d, i) => HI1 * P[i] - d) }));
  const h = holm(per.flatMap((r, i) => [flipP(r.lo, B_FLIP, 7002 + 2 * i), flipP(r.hi, B_FLIP, 7003 + 2 * i)]));
  per.forEach((r, i) => { r.read = !(r.s >= S_MIN && r.s <= S_MAX) ? 'CONSTRUCT' : h[2 * i] < ALPHA && r.s >= HI1 ? 'TOPCELL' : h[2 * i + 1] < ALPHA && r.s <= LO1 ? 'REF' : 'MID'; });
  return per.every(r => r.read === 'TOPCELL') ? 'HELD' : per.every(r => r.read === 'REF') ? 'FALSIFIED' : 'INCONCLUSIVE';
}
// PLANTED (rule 6): a clear share reads HELD, a clear zero FALSIFIED, a middle INCONCLUSIVE
{
  const P = Array.from({ length: 40 }, (_, i) => 0.02 + 0.002 * (i % 5)), mk = s => [{ D: P.map(p => s * p), P }, { D: P.map(p => s * p), P }];
  const got = [0.8, 0.05, 0.35].map(s => itemOne(mk(s))).join(',');
  if (got !== 'HELD,FALSIFIED,INCONCLUSIVE') { console.log(`PLANTED CHECK FAILED: ${got}`); process.exit(1); }
}

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagxasr');
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units), files = {};
const X = bad.length ? null : xasFiles();
if (X && X.bad.length) bad.push(...X.bad.map(x => `XAS's own gate: ${x}`));
if (!bad.length) {
  const st = stampOf(Object.values(logs)[0]);
  for (const u of units) { const f = join(DIR, fileOf(u.id)), t = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(t, u, st, X.files[u.id])); files[u.id] = t; }
  bad.push(...openCheck(units.find(u => u.id === 'S126'), X.s126));
}
if (bad.length) { console.log(`GATE (XAS-R's, all but the BASE guard): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('GATE (XAS-R\'s, all but the BASE guard, which XAS-R2 does not read): passed; planted: passed\n');

// 1. the sizes
const S = files.S370, years = [...new Set(S.t)].sort((a, b) => a - b), data = {};
console.log('1. THE SIZES (S370, per path, the years before a step): COV\'s P = sum (read - ex5); BASE\'s read - vb (the midpoint node\'s own movement, built on BASE\'s own nodes)');
for (const y of years) {
  const J = S.t.map((_, j) => j).filter(j => S.t[j] === y);
  const P = perPath(S, J, j => S.arms.COV.read[j] - S.arms.COV.ex5[j]), E0 = perPath(S, J, j => S.arms.BASE.read[j] - S.arms.BASE.vb[j]);
  data[y] = { P, E: E0.map(x => x - mean(E0)) };
  console.log(`  year ${y}: paths ${P.length}; P mean ${f4(mean(P))} sd ${f4(sd(P))}; BASE read - vb mean ${f4(mean(E0))} sd ${f4(sd(E0))}`);
}
// 2. power
console.log(`\n2. ITEM 1'S POWER: D = s P + e (e: BASE's read - vb, centred), the registered rule, ${R_BOOT} bootstrap resamples of the paths (flipP B ${B_FLIP})`);
const S_GRID = [0.05, 0.1, 0.2, 0.35, 0.5, 0.6, 0.7, 0.9], POW = {};
for (const s of S_GRID) {
  const r = rng(7002 + Math.round(1000 * s)), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let b = 0; b < R_BOOT; b++) {
    const ys = years.map(y => { const { P, E } = data[y], N = P.length, idx = Array.from({ length: N }, () => Math.floor(r() * N)); return { P: idx.map(i => P[i]), D: idx.map(i => s * P[i] + E[i]) }; });
    n[itemOne(ys)]++;
  }
  POW[s] = Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT]));
  console.log(`  s ${f2(s)}: HELD ${f2(POW[s].HELD)} FALSIFIED ${f2(POW[s].FALSIFIED)} INCONCLUSIVE ${f2(POW[s].INCONCLUSIVE)}`);
}
// 3. credences
console.log('\n3. THE CREDENCES (the deep review\'s cause credences as stories, normalised within each question, then shaded toward the base rate: weight 0.7 on the stories, 0.3 on an even split)');
const shade = (o) => { const k = Object.keys(o), t = k.reduce((s, x) => s + o[x], 0); return Object.fromEntries(k.map(x => [x, 0.7 * o[x] / t + 0.3 / k.length])); };
const near = s => POW[S_GRID.reduce((b, x) => (Math.abs(x - s) < Math.abs(b - s) ? x : b), S_GRID[0])];
{
  const w = shade({ TOPCELL: 0.45, 'REF+NODEQ': 0.27, REST: 0.09 }), sOf = { TOPCELL: 0.7, 'REF+NODEQ': 0.1, REST: 0.35 }, c = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (const [k, wk] of Object.entries(w)) { const p = near(sOf[k]); for (const o of Object.keys(c)) c[o] += wk * p[o]; }
  console.log(`  item 1 (stories ${Object.entries(w).map(([k, v]) => `${k} ${f3(v)} at s ${sOf[k]}`).join(', ')}): HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
  console.log(`CREDENCE item 1: point ${f2(Object.entries(w).reduce((s, [k, v]) => s + v * sOf[k], 0))} HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
}
{
  // item 2: QUANT reads HELD, REF FALSIFIED, a further bug (VA-BUG) or neither INCONCLUSIVE; exact arithmetic over the nodes,
  // so each story reads its own outcome with 0.8 and the middle band with 0.2
  const w = shade({ QUANT: 0.5, REF: 0.35, BUG: 0.08 }), c = { HELD: 0.8 * w.QUANT, FALSIFIED: 0.8 * w.REF, INCONCLUSIVE: w.BUG + 0.2 * (w.QUANT + w.REF) };
  console.log(`  item 2 (stories ${Object.entries(w).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}): HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
  // the point: the ratio each story expects (QUANT 0.7, REF 0.1, BUG 0.35), weighted
  console.log(`CREDENCE item 2: point ${f2(0.7 * w.QUANT + 0.1 * w.REF + 0.35 * w.BUG)} HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
}
{
  // item 3: S126-BLEND reads HELD when COV's edge node removes half or more (0.7), else INCONCLUSIVE; another non-survival
  // channel (NSOTHER) leaves the errors in place under COV (FALSIFIED 0.6, INCONCLUSIVE 0.4); the tie (TIE) moves no read
  // (FALSIFIED 0.5, INCONCLUSIVE 0.5)
  const w = shade({ BLEND: 0.5, NSOTHER: 0.3, TIE: 0.12 }), c = { HELD: 0.7 * w.BLEND, FALSIFIED: 0.6 * w.NSOTHER + 0.5 * w.TIE, INCONCLUSIVE: 0.3 * w.BLEND + 0.4 * w.NSOTHER + 0.5 * w.TIE };
  console.log(`  item 3 (stories ${Object.entries(w).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}): HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
  // the point: COV's error as a share of BASE's that each story expects (BLEND 0.2, NSOTHER 1, TIE 1), weighted
  console.log(`CREDENCE item 3: point ${f2(0.2 * w.BLEND + 1 * w.NSOTHER + 1 * w.TIE)} HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
}
