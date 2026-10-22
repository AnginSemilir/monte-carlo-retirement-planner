/*
 * 7U'S ITEM 4 RE-READ BY PATH (the external review of 21 Oct, Part B Step 4.3). Item 4 is the paired survival change,
 * CAND less SHIP, pooled over the households outside the gain set (panel-7u.mjs floorOf: 47 at each weight). 7u read
 * its interval with stats.mjs pooledSummed, which treats the 47 x 8,000 pairs as independent; but path i is built from
 * seed + i x 7919 whatever the horizon (App.jsx pathsForSeed), so path i carries the same draws in every household and
 * the households' changes on it are correlated. Here: each path's change averaged over the households, and the interval
 * from the spread of those per-path means across the 8,000 independent paths. The point is item 4's own (the same
 * arithmetic; the script checks it against results-7u.txt's REALISED line), only the interval differs. Also printed: the
 * bound the review gives (every household's discordant paths coinciding).
 * Reads 7u's raw per-path survival (results/diag7u, seed 7013) after checking each file's seed, path count and stamp.
 * Then 7U-F'S POWER from the same records (registrations/fresh-7uf.md's Paths field): P1's standard error by path over the
 * 7u-F floor households 7u ran, scaled to 7u-F's 16,000 paths, and its chance of reading HELD; P2's chance of reading harm,
 * which needs both the Holm-adjusted p and an observed loss of at least 1 point (below).
 *   node research/solver/reread-7u-item4.mjs [diagDir]
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { floorOf, WEIGHTS, SEED, N, labelOf } from './panel-7u.mjs';
import { pooledSummed, zFor, normUpper } from './stats.mjs';
import { PANEL as PANEL_F, floorOf as floorOfF, N as N_F, WEIGHTS as W_F } from './panel-7uf.mjs';
import { PANEL as PANEL_7U } from './panel-7u.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7u');
const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
const load = (id, arm, w) => {
  const j = JSON.parse(gunzipSync(readFileSync(join(DIR, fileOf(id, arm, labelOf(arm, w))))).toString());
  if (j.seed !== SEED || j.N !== N) throw new Error(`${id} ${arm} ${w}: seed ${j.seed}, ${j.N} paths, not 7u's ${SEED} and ${N}`);
  const b = Buffer.from(j.survived, 'base64');
  return { bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), code: j.stamp.code, audit: j.stamp.audit };
};
const realised = (() => { const t = readFileSync(join(HERE, 'results-7u.txt'), 'utf8'); return [...t.matchAll(/^REALISED item (\d+): (-?\d+\.\d+)$/gm)].reduce((o, m) => ({ ...o, [m[1]]: +m[2] }), {}); })();
const z = zFor(0.05);
console.log(`7U ITEM 4 BY PATH: ${DIR}; seed ${SEED}, ${N} paths a household; 95% intervals (z ${z.toFixed(4)})`);
WEIGHTS.forEach((w, wi) => {
  const ids = floorOf(w), m = new Float64Array(N), cells = [], stamps = new Set();
  for (const id of ids) {
    const c = load(id, 'CAND', w), s = load(id, 'SHIP', w);
    stamps.add(`${c.code}/${c.audit}`); stamps.add(`${s.code}/${s.audit}`);
    let a = 0, lost = 0, saved = 0, d = 0;
    for (let i = 0; i < N; i++) {
      const x = c.bits[i], y = s.bits[i];
      m[i] += (x - y) / ids.length;
      if (x && y) a++; else if (y && !x) lost++; else if (x && !y) saved++; else d++;
    }
    cells.push({ a, lost, saved, d });
  }
  if (stamps.size !== 1) throw new Error(`the ${w} files carry ${stamps.size} code/audit stamps: ${[...stamps].join(' ')}`);
  let mu = 0; for (let i = 0; i < N; i++) mu += m[i]; mu /= N;
  let v = 0; for (let i = 0; i < N; i++) v += (m[i] - mu) ** 2;
  const se = Math.sqrt(v / (N - 1) / N), p = pooledSummed(cells);
  const want = realised[String(4 + 4 * wi)];
  const same = Math.abs(100 * mu - p.d) < 1e-9 && Math.abs(p.d - want) < 5e-5;
  console.log(`weight ${w}: ${ids.length} households, stamp ${[...stamps][0]}; ${p.cells.saved} saved/${p.cells.lost} lost`);
  console.log(`  the point: ${(100 * mu).toFixed(4)} (pooledSummed ${p.d.toFixed(4)}, results-7u.txt REALISED item ${4 + 4 * wi} ${want.toFixed(4)}: ${same ? 'the same' : 'DIFFERENT'})`);
  console.log(`  7u's interval (pooled cells, pairs independent): ${p.lo.toFixed(3)} to ${p.hi.toFixed(3)}`);
  console.log(`  BY PATH (per-path means, paths independent): ${(100 * (mu - z * se)).toFixed(3)} to ${(100 * (mu + z * se)).toFixed(3)}; se ${(100 * se).toFixed(4)}, ${(100 * se / ((p.hi - p.lo) / (2 * z))).toFixed(2)} times 7u's`);
  console.log(`  item 4's rule (lower end above -0.1): ${100 * (mu - z * se) > -0.1 ? 'HELD' : 100 * (mu + z * se) < -0.1 ? 'FALSIFIED' : 'INCONCLUSIVE'} by path`);
  if (!same) process.exitCode = 1;
});

// 7U-F'S POWER from 7u's records. P1 reads HELD when its lower end is above -0.1: at a true pooled change delta that is
// Phi((delta + 0.1 - 1.96 se) / se). P2 reads harm when BOTH the Holm-adjusted one-sided McNemar p is below 0.05 AND the
// observed loss is at least 1 point (reduce-7uf.mjs perHousehold): the loss in paths D = lost - saved must reach both
// z_H sqrt(n) (n the discordant paths; z_H at Holm's first step over the in-band pairs) and 0.01 N, so at a true loss of
// exactly 1 point it reads harm half the time whatever the paths (the design review of 21 Oct, BLOCKING 1). Printed: the
// chance at a true loss of 1 point, and the true loss read as harm 80% and 90% of the time, by the normal approximation
// D ~ N(L N, N (d - L^2)), the discordance d at least the loss L (a true loss of L needs that share of paths discordant;
// the design re-review of 22 Oct, finding 1); and the approximation checked by simulation through the reducer's own
// perHousehold. Each household's chance of landing in the band on 16,000 paths, by SHIP's own sampling (S366 sits at its
// top), and the four floor households 7u did not run at discordances they might have. P1's se over the 18 floor households
// as a range (finding 2): the four without a record unchanged on every path, or each as discordant as S370 and independent
// of the rest, with the recorded households' cross-correlations printed beside it. 7u's records are on the code before
// Step 1; SHIP may sit elsewhere on 7014.
{
  const { perHousehold } = await import('./reduce-7uf.mjs');
  const { BAND } = await import('./reduce-7uf.mjs');
  const ran = new Set(PANEL_7U), scale = Math.sqrt(N / N_F), zOf = q => { let lo = 0, hi = 10; for (let i = 0; i < 100; i++) { const x = (lo + hi) / 2; if (normUpper(x) > q) lo = x; else hi = x; } return (lo + hi) / 2; };
  // the in-band pairs: the panel's households 7u ran, in the band by 7u's SHIP at each weight, and the four 7u did not run
  // (S362, S382, S406, S418, the screen's band households) counted in
  const shipOf = (id, w) => { const s = load(id, 'SHIP', w); let k = 0; for (let i = 0; i < N; i++) k += s.bits[i]; return 100 * k / N; };
  const inBand = W_F.flatMap(w => PANEL_F.filter(id => !ran.has(id) || (x => x >= BAND[0] && x <= BAND[1])(shipOf(id, w))));
  const m = inBand.length, zH = zOf(0.05 / m), NF = N_F;
  const pHarm = (L, d0) => { const d = Math.max(d0, L), n = d * NF, thr = Math.max(zH * Math.sqrt(n), 0.01 * NF), sd = Math.sqrt(NF * Math.max(1e-12, d - L * L)); return 1 - normUpper((L * NF - thr) / sd); };
  const lossAt = (q, d) => { let lo = 0.01, hi = 0.05; for (let i = 0; i < 60; i++) { const x = (lo + hi) / 2; if (pHarm(x, d) < q) lo = x; else hi = x; } return 100 * hi; };
  const inBandChance = s => { const se = Math.sqrt(s * (100 - s) / NF) || 1e-9, Phi = x => 1 - normUpper(x); return Phi((BAND[1] - s) / se) - Phi((BAND[0] - s) / se); };
  console.log(`\n7U-F'S POWER from 7u's records (seed 7013, ${N} paths), scaled to ${NF} paths; P2: ${m} household-weight pairs in the band, Holm's first step z ${zH.toFixed(3)} (0.05 over ${m}); harm needs that p AND an observed loss of at least 1 point`);
  for (const w of W_F) {
    const ids = floorOfF(w).filter(id => ran.has(id)), none = floorOfF(w).filter(id => !ran.has(id)), K = floorOfF(w).length, mm = new Float64Array(N), ch = [];
    for (const id of ids) { const c = load(id, 'CAND', w), s = load(id, 'SHIP', w), x = new Float64Array(N); for (let i = 0; i < N; i++) { x[i] = c.bits[i] - s.bits[i]; mm[i] += x[i] / ids.length; } ch.push(x); }
    let mu = 0; for (let i = 0; i < N; i++) mu += mm[i]; mu /= N; let v = 0; for (let i = 0; i < N; i++) v += (mm[i] - mu) ** 2;
    const varOf = x => { let a = 0; for (let i = 0; i < N; i++) a += x[i]; a /= N; let q = 0; for (let i = 0; i < N; i++) q += (x[i] - a) ** 2; return { a, q: q / (N - 1) }; };
    // the recorded households' per-path changes, correlated pairwise (those with any discordant path)
    const st = ch.map(varOf), live = ch.map((x, k) => k).filter(k => st[k].q > 0); let rLo = 1, rHi = -1;
    for (const a of live) for (const b of live) if (a < b) { let c = 0; for (let i = 0; i < N; i++) c += (ch[a][i] - st[a].a) * (ch[b][i] - st[b].a); const r = c / (N - 1) / Math.sqrt(st[a].q * st[b].q); rLo = Math.min(rLo, r); rHi = Math.max(rHi, r); }
    const v14 = v / (N - 1), [vS370, dS370] = (() => { const c = load('S370', 'CAND', w), s = load('S370', 'SHIP', w), x = Float64Array.from(c.bits, (b, i) => b - s.bits[i]); return [varOf(x).q, x.reduce((t, y) => t + (y !== 0), 0) / N]; })();   // S370 is in the gain set, not the floor
    const seOf = vv => 100 * Math.sqrt(vv / NF), seLo = seOf((ids.length / K) ** 2 * v14), seHi = seOf((ids.length ** 2 * v14 + none.length * vS370) / K ** 2);
    const held = (delta, se) => 1 - normUpper((delta + 0.1 - 1.96 * se) / se), at80 = se => -0.1 + (1.96 + zOf(0.2)) * se;
    console.log(`P1 at W${w}: ${ids.length} of the ${K} floor households have records (${none.join(', ')} none); the read averages all ${K}: se by path at ${NF} paths about ${seLo.toFixed(4)} (the ${none.length} without a record unchanged on every path) to ${seHi.toFixed(4)} (each with S370's per-path spread, ${(100 * dS370).toFixed(2)}% of its paths discordant, and independent of the rest; the recorded households' per-path changes correlate pairwise within ${rLo.toFixed(2)} to ${rHi.toFixed(2)}): HELD with chance ${held(0, seLo).toFixed(3)} to ${held(0, seHi).toFixed(3)} at no true change, and 80% of the time at a true change of ${at80(seLo).toFixed(3)} to ${at80(seHi).toFixed(3)} points or more`);
    for (const id of PANEL_F.filter(x => ran.has(x))) {
      const c = load(id, 'CAND', w), s = load(id, 'SHIP', w); let disc = 0, sv = 0; for (let i = 0; i < N; i++) { if (c.bits[i] !== s.bits[i]) disc++; sv += s.bits[i]; }
      const d = Math.max(disc / N, 0.0001), band = 100 * sv / N >= BAND[0] && 100 * sv / N <= BAND[1];
      console.log(`  ${id.padEnd(6)} W${w}: SHIP ${(100 * sv / N).toFixed(2)}%${band ? '' : ' (outside the band: not gated)'}, in the band on ${NF} paths with chance ${inBandChance(100 * sv / N).toFixed(2)}, discordant ${(100 * disc / N).toFixed(2)}% of paths; P2 reads harm at a true loss of 1 point with chance ${pHarm(0.01, d).toFixed(3)}; 80% of the time at a true loss of ${lossAt(0.8, d).toFixed(2)} points, 90% at ${lossAt(0.9, d).toFixed(2)}`);
    }
    console.log(`  the ${none.length} without a record (${none.join(', ')}): at a discordance of ${[0.05, 0.10, 0.15].map(d => `${100 * d}%`).join(', ')}, P2 reads harm 80% of the time at a true loss of ${[0.05, 0.10, 0.15].map(d => lossAt(0.8, d).toFixed(2)).join(', ')} points, 90% at ${[0.05, 0.10, 0.15].map(d => lossAt(0.9, d).toFixed(2)).join(', ')}`);
  }
  // the approximation against the reducer's own rule, by simulation: a household at a true loss (discordance d, SHIP 70%),
  // m - 1 households with no change beside it (Holm), 400 replicates of 16,000 paired paths
  // mulberry32 (Math.imul: a 32-bit product in plain doubles loses its low bits past 2^53)
  let seed = 7002; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  for (const [d, L] of [[0.09, 0.01], [0.09, 0.012], [0.026, 0.01], [0.026, 0.011], [0.0107, 0.0107], [0.011, 0.011]]) {
    let hits = 0; const R = 400;
    for (let rep = 0; rep < R; rep++) {
      const ship = new Uint8Array(NF), cand = new Uint8Array(NF), pl = (d + L) / 2;
      for (let i = 0; i < NF; i++) { const u = rnd(); if (u < pl) { ship[i] = 1; cand[i] = 0; } else if (u < d) { ship[i] = 0; cand[i] = 1; } else { const b = rnd() < 0.7 ? 1 : 0; ship[i] = b; cand[i] = b; } }
      const nul = new Uint8Array(NF).fill(1), rows = [{ id: 'X', w: '0.02', ship, cand }, ...Array.from({ length: m - 1 }, (_, k) => ({ id: `Z${k}`, w: '0.02', ship: nul, cand: nul }))];
      // a no-change household's p is 1; it never reads harm, and Holm's first step for X is m x p as in the approximation
      const out = perHousehold(rows.map(r => r.id === 'X' ? r : { ...r, ship: Uint8Array.from(ship, (_, i) => i % 2), cand: Uint8Array.from(ship, (_, i) => i % 2) }));
      if (out.find(x => x.id === 'X').harm) hits++;
    }
    console.log(`  check by simulation (the reducer's perHousehold, ${R} replicates, Holm over ${m}): discordance ${(100 * d).toFixed(2)}%, a true loss of ${(100 * L).toFixed(2)} points: harm read ${(hits / R).toFixed(3)}; the approximation ${pHarm(L, d).toFixed(3)}`);
  }
}
