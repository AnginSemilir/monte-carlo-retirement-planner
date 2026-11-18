/*
 * THE PATTERN SEARCH FOR survivalChangeU's FIX (D112; CHECKLIST 7; research/tests/stats-newcombe.test.mjs is the fix's test).
 * The fix (Newcombe's method 10's correction to the paired correlation) widens a paired interval where the two arms'
 * survival is correlated, most where nearly every path survives. The reads made before it stand as printed (D112); this
 * finds where the fix would have carried an interval end across a bar a rule might compare it with. Every stored run's
 * units in research/solver/results/ (each unit file's arms with a survival array a path), every ordered pair of arms in
 * each run, each unit's interval and each run's pooled one (stats.mjs pooledSummed), both ways: before the fix
 * (STATS.plant 'nocorrect') and after. Printed: by run, the comparisons scanned, the largest move of an interval end, and
 * every end that crosses one of the bars -0.5, -0.3, -0.25, -0.1 and 0 points. A crossing is a lead to check against that
 * run's own rule (which bar it used, on which end, for which pair), not a changed verdict. EXPLORATORY, deciding nothing.
 * Never opened: a folder of units set aside unread (joint-wide-7002-stopped).
 *   node research/solver/stats-newcombe-scan.mjs > research/solver/results-stats-newcombe.txt
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed, STATS } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), RES = join(HERE, 'results');
const BARS = [-0.5, -0.3, -0.25, -0.1, 0], UNREAD = new Set(['joint-wide-7002-stopped']);
const dec = s => { const b = Buffer.from(s, 'base64'); return new Uint8Array(b.buffer, b.byteOffset, b.length); };
const cellsOf = (A, B) => { let a = 0, lost = 0, saved = 0, d = 0; for (let i = 0; i < A.length; i++) { const x = A[i], y = B[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; } return { a, lost, saved, d }; };
const both = f => { STATS.plant = 'nocorrect'; const o = f(); STATS.plant = ''; return [o, f()]; };
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
console.log('THE PATTERN SEARCH FOR survivalChangeU\'s FIX (EXPLORATORY, deciding nothing; stats-newcombe-scan.mjs): before the fix (method 8) and after (method 10), every stored run\'s every ordered pair of arms, by unit and pooled; a crossing of the bars ' + BARS.join(', ') + ' is a lead to check against that run\'s own rule');
let runs = 0, all = 0, crossings = 0, worst = 0;
for (const run of readdirSync(RES).sort()) {
  const dir = join(RES, run);
  if (UNREAD.has(run) || !statSync(dir).isDirectory()) continue;
  const units = [];
  for (const f of readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).sort()) {
    let U; try { U = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); } catch { continue; }
    if (!U || !U.arms || typeof U.arms !== 'object') continue;
    const arms = Object.fromEntries(Object.entries(U.arms).filter(([, x]) => x && typeof x.survived === 'string').map(([k, x]) => [k, dec(x.survived)]));
    if (Object.keys(arms).length >= 2) units.push({ id: U.id || f, arms });
  }
  if (!units.length) continue;
  runs++;
  const names = [...new Set(units.flatMap(u => Object.keys(u.arms)))];
  let n = 0, big = 0; const cross = [];
  for (const base of names) for (const x of names) {
    if (x === base) continue;
    const us = units.filter(u => u.arms[base] && u.arms[x] && u.arms[base].length === u.arms[x].length);
    if (!us.length) continue;
    const cells = us.map(u => cellsOf(u.arms[base], u.arms[x]));
    const rows = us.map((u, i) => [u.id, ...both(() => { const c = cells[i]; return survivalChangeU(c.a, c.lost, c.saved, c.d); })]);
    rows.push(['pooled', ...both(() => pooledSummed(cells))]);
    for (const [id, o, w] of rows) {
      n++; big = Math.max(big, Math.abs(w.lo - o.lo), Math.abs(w.hi - o.hi));
      for (const bar of BARS) {
        if ((o.lo > bar) !== (w.lo > bar)) cross.push(`${id} ${x} less ${base}: the lower end ${f3(o.lo)} to ${f3(w.lo)} across ${bar}`);
        if ((o.hi < bar) !== (w.hi < bar)) cross.push(`${id} ${x} less ${base}: the upper end ${f3(o.hi)} to ${f3(w.hi)} across ${bar}`);
      }
    }
  }
  all += n; crossings += cross.length; worst = Math.max(worst, big);
  console.log(`\n${run}: ${units.length} units, arms ${names.join(', ')}; ${n} intervals; the largest move of an end ${big.toFixed(3)} points; crossings ${cross.length}${cross.length ? '' : ' (none)'}`);
  for (const c of cross) console.log(`  ${c}`);
}
console.log(`\n${runs} runs, ${all} intervals; the largest move of an end ${worst.toFixed(3)} points; ${crossings} crossings of a bar, each a lead to check against its run's rule`);
