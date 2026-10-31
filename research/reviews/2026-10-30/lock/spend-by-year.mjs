/*
 * SPENDING AGAINST THE TARGET, BY RETIRED YEAR (EXPLORATORY; for the maintainer's chart of 31 Oct). From the units of the
 * locked run and the units beside it (the levers', the dial's and EZ's), for each of the eight households, each arm and each
 * retired year: of the 1,000 paths (seed 7002), how many are still funded (before any failure), their mean spending level as
 * a share of the year's target, and the shares of them over the target, on it, under it and at the 80% floor. Read as
 * lock-run.mjs --read reads the levels: the retired years from the household's retirement, a path's years before its
 * failure, a year with no spending skipped.
 *   node spend-by-year.mjs <levers unit dir> <dial unit dir> <ez unit dir> <lock unit dir>      (results-spend-by-year.csv)
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
const [dir, dialDir, ezDir, lkDir] = process.argv.slice(2);
if (!lkDir) { console.error('usage: spend-by-year.mjs <levers unit dir> <dial unit dir> <ez unit dir> <lock unit dir>'); process.exit(2); }
const IDS = ['S090', 'S030', 'S368', 'S050', 'S188', 'S328F', 'S304F', 'S340F'];
const ARMS = [['APP', dir, 'app'], ['CAND', dir, 'cand'], ['DIAL10M', dialDir, 'dial10m'], ['D10MLK', lkDir, 'd10mlk'], ['EZ', ezDir, 'ez-g4-r2-f30'], ['EZLK30', lkDir, 'ezlk-g4-r2-f30'], ['EZLK10', lkDir, 'ezlk-g4-r2-f10']];
const unitOf = (d, id, f) => JSON.parse(gunzipSync(readFileSync(join(d, `${id}-${f}.json.gz`))));
const arr = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const rows = ['household,arm,retired_year,age,paths_funded,mean_level_pct,over_target_pct,on_target_pct,under_target_pct,at_floor_pct'];
const levels = new Set();
for (const id of IDS) {
  const ref = unitOf(dir, id, 'cand'), age0 = ref.ageSelf0, retT = ref.retireT;
  for (const [a, d, f] of ARMS) {
    const u = unitOf(d, id, f), Y = u.Y, N = u.N, level = arr(u.main.level, Uint8Array), fy = arr(u.main.failYear, Int16Array);
    if (u.seed !== ref.seed || u.N !== ref.N || u.Y !== ref.Y || u.inputs !== ref.inputs) throw new Error(`${id} ${a}: not on the CAND unit's paths and inputs`);
    for (let t = retT; t < Y; t++) {
      let n = 0, sum = 0, over = 0, on = 0, under = 0, floor = 0;
      for (let k = 0; k < N; k++) {
        if (fy[k] >= 0 && t >= fy[k]) continue;   // failed by now
        const lv = level[k * Y + t]; if (!lv) continue;
        levels.add(lv); n++; sum += lv;
        if (lv <= 80) floor++; else if (lv < 100) under++; else if (lv === 100) on++; else over++;
      }
      if (!n) continue;
      const pc = x => (100 * x / n).toFixed(1);
      rows.push([id, a, t - retT + 1, age0 + t, n, (sum / n).toFixed(2), pc(over), pc(on), pc(under), pc(floor)].join(','));
    }
  }
}
process.stdout.write(rows.join('\n') + '\n');
console.error(`spend-by-year: ${rows.length - 1} rows; the levels seen: ${[...levels].sort((x, y) => x - y).join(', ')}%`);
