/*
 * 7AA'S CHANGED PATHS, WHERE THEY FIRST DIFFER (the deep review after 7aa, deep-review-log.md 28 Sep 11:44 UK; its read-only
 * slice, committed here so the plan's figures come from a committed script; grade C, reported, not registered). The traces
 * in results/diag7aa are read through reduce-7aa.mjs's own gates (requireFairLogs over the stamps, its unit gate, and
 * traceAgrees on every trace); a gate that refuses stops the script. For each pair of arms at each weight, every path whose
 * survival differs (saved or lost) is placed by the first year the two differ: in the pension tier at year 0, in years 1 to
 * 5, 6 to 15 or 16 on, or in the spend level first, or in the spend level only (the tiers never differ before the earlier
 * failure). Beside it, how the failing arm fails (at the end pot, or mid-plan with the years) and how many of the changed
 * paths have a negative long-run shift.
 *   node research/solver/read-7aa-paths.mjs > research/solver/results-7aa-paths.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import * as A from './reduce-7aa.mjs';
import { decode } from './reduce-7t.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { pathsForSeed } from '../engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diag7aa');
const files = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort();
const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
const units = Object.values(logs).flatMap(A.parse);
process.chdir(join(HERE, '..', '..'));
requireFairLogs(logs, A.PRED);
const bad = A.gate(units);
if (bad.length || units.length !== 30) { console.log(`REFUSED: ${units.length} units; the gate: ${bad.join('; ')}`); process.exit(1); }
const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
const ST = { code: st[1], audit: st[2], prediction: st[3], sha: st[4] };
const T = {};
for (const u of units) {
  const j = JSON.parse(gunzipSync(readFileSync(join(DIR, A.traceName(u.id, u.arm, u.label)))).toString());
  if (!A.traceAgrees(j, ST, u.arm, u.label, u.run.sim)) { console.log(`REFUSED: the trace for ${u.id} ${u.label} disagrees with its log`); process.exit(1); }
  T[`${u.id}|${u.arm}|${u.label}`] = decode(j);
}
const get = (id, arm, tag, w) => T[`${id}|${arm}|${tag}/W${w}`];
const Y0 = get('S126', 'READER', 'PRODUCT', '0').Y;
const shifts = pathsForSeed(7002, 8000, Y0 - 1).map(z => z[Y0]);
const lastYear = (X, i) => (X.failYear[i] >= 0 ? X.failYear[i] - 1 : X.Y - 1);
console.log(`gate passed: ${units.length} units, every trace agreeing with its log (reduce-7aa.mjs's gates); 8,000 paths of seed 7002\n`);
console.log('CHANGED PATHS BY WHERE THE TWO ARMS FIRST DIFFER (saved/lost as the second arm against the first):');
function split(id, arm, a, b, w) {
  const P = get(id, arm, a, w), Q = get(id, arm, b, w);
  const o = { saved: 0, lost: 0, tier0: 0, tier1_5: 0, tier6_15: 0, tier16: 0, levelOnly: 0, levelFirst: 0, endpot: 0, mid: 0, midYears: [], zneg: 0 };
  for (let i = 0; i < P.N; i++) {
    if (P.survived[i] === Q.survived[i]) continue;
    o[Q.survived[i] ? 'saved' : 'lost']++;
    let ft = -1, fl = -1; const L = Math.min(lastYear(P, i), lastYear(Q, i));
    for (let t = 0; t <= L; t++) { if (ft < 0 && P.tier[i * P.Y + t] !== Q.tier[i * Q.Y + t]) ft = t; if (fl < 0 && P.level[i * P.Y + t] !== Q.level[i * Q.Y + t]) fl = t; }
    if (ft < 0) o.levelOnly++; else if (fl >= 0 && fl < ft) o.levelFirst++; else if (ft === 0) o.tier0++; else if (ft <= 5) o.tier1_5++; else if (ft <= 15) o.tier6_15++; else o.tier16++;
    const F = P.survived[i] ? Q : P; if (F.failYear[i] < 0) o.endpot++; else { o.mid++; o.midYears.push(F.failYear[i]); }
    if (shifts[i] < 0) o.zneg++;
  }
  const my = o.midYears.sort((x, y) => x - y);
  const mid = my.length ? `${my.length} (years ${my[0]} to ${my.at(-1)}, median ${my[my.length >> 1]})` : '0';
  console.log(`   ${`${id} ${arm} W${w}: ${b} against ${a}`.padEnd(42)} ${`${o.saved}/${o.lost}`.padStart(6)} | first differ: tier at year 0 ${o.tier0}, tier years 1-5 ${o.tier1_5}, 6-15 ${o.tier6_15}, 16+ ${o.tier16}, level first ${o.levelFirst}, level only ${o.levelOnly} | fails at the end pot ${o.endpot}, mid-plan ${mid} | negative shift ${o.zneg}`);
}
const CA = [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];
for (const w of ['0', '0.02']) for (const [id, arm] of CA) { split(id, arm, 'PRODUCT', 'TS+J', w); split(id, arm, 'TS', 'TS+J', w); split(id, arm, 'PRODUCT', 'TS', w); }
