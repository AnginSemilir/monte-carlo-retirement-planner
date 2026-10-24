/*
 * V3'S WEALTH LADDER, EVERY PAIR OF RUNGS (EXPLORATORY, the tuning seed; from V3's units in results/v3, nothing re-run). The
 * candidate solved at 20, 30 (the shipped setting), 45, 60 and 90 wealth points on V3's seven households, each simulated on
 * the same 8,000 paths of seed 7002, at both estate weights. For each pair of rungs, paired on the paths:
 *   the panel mean change in survival (the finer less the coarser) with its 95% interval (each household's paired se by
 *   path, the households independent), the households' range (smallest to largest change) and the largest change with its
 *   own se; the whole score's panel mean beside it.
 *   node research/solver/v3-ladder.mjs [dir]
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUSEHOLDS } from './v3-convergence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = process.argv[2] || process.env.V3_OUT || join(HERE, 'results', 'v3');
const RUNGS = [['p20', 20], ['ship', 30], ['p45', 45], ['p60', 60], ['p90', 90]], WEIGHTS = ['0.02', '0.01'];
const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
const pair = (a, b) => {
  const n = a.bits.length; let ds = 0, dw = 0, ss = 0;
  for (let i = 0; i < n; i++) { const d = b.bits[i] - a.bits[i]; ds += d; ss += d * d; dw += b.ws[i] - a.ws[i]; }
  const m = ds / n;
  return { s: 100 * m, se: 100 * Math.sqrt(Math.max(0, ss / n - m * m) / (n - 1)), w: dw / n };
};
const f2 = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;

console.log(`V3'S WEALTH LADDER, EVERY PAIR OF RUNGS (EXPLORATORY, the tuning seed 7002): ${DIR}; ${HOUSEHOLDS.length} households, 8000 paths each, paired`);
console.log(`survival points, the finer rung less the coarser: the panel mean [its 95% interval]; the households from smallest to largest; the largest change (its se); the whole score's panel mean`);
const codes = new Set();
for (const w of WEIGHTS) {
  const U = {};
  for (const id of HOUSEHOLDS) for (const [r] of RUNGS) { const f = join(DIR, `${id}-${r}-w${w}.json.gz`); if (!existsSync(f)) throw new Error(`v3-ladder: missing ${f}`); const x = load(f); codes.add(x.code); (U[id] = U[id] || {})[r] = x; }
  console.log(`\nAT ESTATE WEIGHT ${w}`);
  console.log(`  each rung's survival, the panel mean: ${RUNGS.map(([r, p]) => `${p} points ${(HOUSEHOLDS.reduce((t, id) => t + U[id][r].sim, 0) / HOUSEHOLDS.length).toFixed(2)}%`).join(', ')}`);
  for (let i = 0; i < RUNGS.length; i++) for (let j = i + 1; j < RUNGS.length; j++) {
    const [a, pa] = RUNGS[i], [b, pb] = RUNGS[j];
    const rows = HOUSEHOLDS.map(id => ({ id, ...pair(U[id][a], U[id][b]) }));
    const m = rows.reduce((t, x) => t + x.s, 0) / rows.length, se = Math.sqrt(rows.reduce((t, x) => t + x.se * x.se, 0)) / rows.length;
    const mw = rows.reduce((t, x) => t + x.w, 0) / rows.length;
    const lo = rows.reduce((p, x) => (x.s < p.s ? x : p)), hi = rows.reduce((p, x) => (x.s > p.s ? x : p)), big = Math.abs(lo.s) > Math.abs(hi.s) ? lo : hi;
    console.log(`  ${String(pa).padStart(2)} -> ${String(pb).padStart(2)} points: ${f2(m)} [${f2(m - 1.96 * se)} to ${f2(m + 1.96 * se)}]; households ${f2(lo.s)} (${lo.id}) to ${f2(hi.s)} (${hi.id}); the largest ${big.id} ${f2(big.s)} (se ${big.se.toFixed(2)}); whole score ${f2(mw)}`);
  }
}
console.log(`\nthe gate: ${codes.size === 1 ? `one code (${[...codes][0]})` : `NOT ONE CODE (${[...codes].join(' ')})`}`);
