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
 * Then 7U-F'S POWER from the same records (registrations/fresh-7uf.md's Paths field): over the 7u-F floor households 7u ran,
 * P1's standard error by path at 8,000 paths and, scaled by the root of the path counts, at 7u-F's 16,000; and for each 7u-F
 * household 7u ran, its discordant share and the chance a true loss of exactly 1 point reads as harm under P2 at 16,000
 * paths (one-sided, at the Holm threshold for every household and weight of the panel: 0.05 over 38), by the normal
 * approximation to the exact test.
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

// 7U-F'S POWER from 7u's records
{
  const ran = new Set(PANEL_7U), scale = Math.sqrt(N / N_F), m = 2 * PANEL_F.length, zH = (() => { let lo = 0, hi = 10; for (let i = 0; i < 100; i++) { const x = (lo + hi) / 2; if (normUpper(x) > 0.05 / m) lo = x; else hi = x; } return (lo + hi) / 2; })();
  console.log(`\n7U-F'S POWER from 7u's records (seed 7013, ${N} paths), scaled to ${N_F} paths; P2's threshold z ${zH.toFixed(3)} (0.05 over ${m}, Holm's first step)`);
  for (const w of W_F) {
    const ids = floorOfF(w).filter(id => ran.has(id)), mm = new Float64Array(N);
    for (const id of ids) { const c = load(id, 'CAND', w), s = load(id, 'SHIP', w); for (let i = 0; i < N; i++) mm[i] += (c.bits[i] - s.bits[i]) / ids.length; }
    let mu = 0; for (let i = 0; i < N; i++) mu += mm[i]; mu /= N; let v = 0; for (let i = 0; i < N; i++) v += (mm[i] - mu) ** 2;
    const se = 100 * Math.sqrt(v / (N - 1) / N);
    console.log(`P1 at W${w}: ${ids.length} of the ${floorOfF(w).length} floor households have records; se by path ${se.toFixed(4)} at ${N}, about ${(se * scale).toFixed(4)} at ${N_F}: the interval's half-width about ${(1.96 * se * scale).toFixed(3)} points, so a true pooled change above ${(-0.1 + 1.96 * se * scale).toFixed(3)} reads HELD`);
    for (const id of PANEL_F.filter(x => ran.has(x))) {
      const c = load(id, 'CAND', w), s = load(id, 'SHIP', w); let disc = 0, sv = 0; for (let i = 0; i < N; i++) { if (c.bits[i] !== s.bits[i]) disc++; sv += s.bits[i]; }
      const nD = Math.max(disc * N_F / N, 160), pw = normUpper(zH - 160 / Math.sqrt(nD));
      console.log(`  ${id.padEnd(6)} W${w}: SHIP ${(100 * sv / N).toFixed(2)}%, discordant ${(100 * disc / N).toFixed(2)}% of paths; power for a true 1-point loss at ${N_F} paths ${pw.toFixed(3)}`);
    }
  }
}
