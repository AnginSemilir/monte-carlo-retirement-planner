/*
 * O199's CENSUS (PLAN.md O199): the non-finite values in the saved bridge-year tables and per-path arrays of REF-STEP's and
 * REF-B's files (results/diagrefstep, results/diagrefb: every world's survival table at each bridge year and layer, as the audits
 * save them), by file, world, layer and year; and the mechanism read by itself: adaptive.js expectSplit (stepAll) reads the
 * live side at nz midpoints u = uLo + (1 - uLo) (i + 0.5) / nz with uLo = Phi(z*), unclamped, and PhiInv(1) is Infinity, so a
 * split at z* near ZHI (8) puts midpoints at u = 1 (counted below with grid.js Phi), whose grown share is Infinity / Infinity.
 *   node research/solver/nan-census.mjs > research/solver/results-nan-census.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Phi } from '../../src/solver/grid.js';
const HERE = dirname(fileURLToPath(import.meta.url));
console.log('O199\'S CENSUS: non-finite values in the saved files (REF-STEP\'s and REF-B\'s), and the split\'s midpoints at u = 1');
let total = 0;
for (const d of ['diagrefstep', 'diagrefb']) for (const f of readdirSync(join(HERE, 'results', d)).filter(x => x.endsWith('.json.gz')).sort()) {
  const j = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', d, f))).toString());
  let n = 0, bad = 0; const by = {};
  for (const [k, v] of Object.entries(j.tables || {})) { const b = Buffer.from(v, 'base64'), a = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); for (const x of a) { n++; if (!Number.isFinite(x)) { bad++; by[k] = (by[k] || 0) + 1; } } }
  let pn = 0, pb = 0; for (const v of Object.values(j.per || {})) { const b = Buffer.from(v, 'base64'), a = new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); for (const x of a) { pn++; if (!Number.isFinite(x)) pb++; } }
  total += bad + pb;
  console.log(`  ${d}/${f}: bridge-year table values non-finite ${bad} of ${n}${bad ? ` (world/layer/year: ${Object.entries(by).map(([k, c]) => `${k} ${c}`).join(', ')})` : ''}; per-path values non-finite ${pb} of ${pn}`);
}
console.log('  the split\'s midpoints (nz 128) that reach u = 1 when the split sits at z* (grid.js Phi):');
for (const z of [6, 7, 7.5, 7.8, 7.9, 8]) { const u = Phi(z); let ones = 0; for (let i = 0; i < 128; i++) if (u + (1 - u) * (i + 0.5) / 128 >= 1) ones++; console.log(`    z* ${z}: 1 - Phi ${(1 - u).toExponential(3)}, midpoints at u = 1: ${ones} of 128`); }
console.log(`VERDICT: ${total} non-finite values in the saved files`);
