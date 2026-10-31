/*
 * EXAMPLE PATHS, YEAR BY YEAR (EXPLORATORY; for the maintainer's chart of 31 Oct). For each of the eight households, five of
 * its 1,000 market paths (seed 7002), ranked by the mean of the yearly market draws over the first ten retired years and
 * taken at the 5th, 25th, 50th, 75th and 95th percentiles of that rank (from bad early markets to good); for each of their
 * retired years, the year's market draw (the engine's shock z, in standard deviations: above 0 a better year than the
 * average) and each method's spending level as a share of the year's target, blank once the method's money has run out on
 * that path. Every method runs on the same paths, so a row compares them on identical markets.
 *   node example-paths.mjs <levers unit dir> <dial unit dir> <ez unit dir> <lock unit dir>      (results-example-paths.csv)
 * Run from the root of the agent's code (it reads the engine's paths, research/engine.mjs).
 */
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { gunzipSync } from 'zlib';
import { pathToFileURL } from 'url';
const E = await import(pathToFileURL(resolve(process.cwd(), 'research/engine.mjs')).href);
const [dir, dialDir, ezDir, lkDir] = process.argv.slice(2);
if (!lkDir) { console.error('usage: example-paths.mjs <levers unit dir> <dial unit dir> <ez unit dir> <lock unit dir>'); process.exit(2); }
const IDS = ['S090', 'S030', 'S368', 'S050', 'S188', 'S328F', 'S304F', 'S340F'], RANKS = [5, 25, 50, 75, 95], EARLY = 10;
const ARMS = [['APP', dir, 'app'], ['CAND', dir, 'cand'], ['DIAL10M', dialDir, 'dial10m'], ['D10MLK', lkDir, 'd10mlk'], ['EZ', ezDir, 'ez-g4-r2-f30'], ['EZLK30', lkDir, 'ezlk-g4-r2-f30'], ['EZLK10', lkDir, 'ezlk-g4-r2-f10']];
const unitOf = (d, id, f) => JSON.parse(gunzipSync(readFileSync(join(d, `${id}-${f}.json.gz`))));
const arr = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const rows = [['household', 'example', 'market_rank_pct', 'path', 'retired_year', 'age', 'market_draw', ...ARMS.map(([a]) => `level_${a}`)].join(',')];
for (const id of IDS) {
  const ref = unitOf(dir, id, 'cand'), Y = ref.Y, N = ref.N, retT = ref.retireT, age0 = ref.ageSelf0;
  const paths = E.pathsForSeed(ref.seed, N, Y - 1);
  const us = ARMS.map(([a, d, f]) => { const u = unitOf(d, id, f); if (u.seed !== ref.seed || u.N !== N || u.Y !== Y || u.inputs !== ref.inputs) throw new Error(`${id} ${a}: not on the CAND unit's paths and inputs`); return { level: arr(u.main.level, Uint8Array), fy: arr(u.main.failYear, Int16Array) }; });
  const end = Math.min(Y, retT + EARLY), early = Array.from({ length: N }, (_, k) => { let s = 0; for (let t = retT; t < end; t++) s += paths[k][t]; return { k, m: s / (end - retT) }; }).sort((a, b) => a.m - b.m || a.k - b.k);
  RANKS.forEach((p, i) => {
    const k = early[Math.round((p / 100) * (N - 1))].k;
    for (let t = retT; t < Y; t++) {
      const lv = us.map((u) => (u.fy[k] >= 0 && t >= u.fy[k] ? '' : u.level[k * Y + t] || ''));
      rows.push([id, i + 1, p, k, t - retT + 1, age0 + t, paths[k][t].toFixed(3), ...lv].join(','));
    }
  });
}
process.stdout.write(rows.join('\n') + '\n');
console.error(`example-paths: ${rows.length - 1} rows`);
