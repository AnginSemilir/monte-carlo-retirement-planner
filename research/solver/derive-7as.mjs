/*
 * 7AS'S DERIVATION (predictions/diag-7as.md; PLAN.md 7as). What P's records say before any 7as solve, read from P's
 * registered read (results-P.txt, reduce-P.mjs's output after its gate) and P's case files (results/diagP, through their
 * stamps) for the seconds:
 *   1. S194's bad-world slice by the setting P read: OPEN2 at margin 0 and at the charge 0.001 against OPEN2 at the margin
 *      1e-3 (saved/lost, survival), the whole score at 0.001, and the straight line through the two survival points to the
 *      charge 0.002 and 0.0005 (a reading of two points, not a model).
 *   1b. The world-aware chooser WA at S194's node under the margin, margin 0 and the charge 0.001 (P's node line): item 3's
 *      reference, and P's own read of it (the deep review after P: WA scores the same with or without the charge).
 *   2. Across all worlds, P's legs against the margin (the whole score and its half-width at 16,000 paths), and the
 *      half-width at 8,000 (the square root of two wider), against item 1's band (+/-0.25).
 *   3. The time: P's measured seconds per unit (solve, the node at 4 rules on 16,000 paths, all worlds on 16,000), scaled to
 *      7as's runs (S194's node at 3 rules on 16,000; all worlds on 8,000; the identity solves alone) and by today's host
 *      against the host 7am measured P's solves on (results-host.txt: 1479 to 1567 s on the 1 Oct boot against 844 to 900 s,
 *      times 0.89 for today's): P's own host is unrecorded, so NOT CHECKED.
 * No solve. Output hashed on the prediction's derive: line.
 *   node research/solver/derive-7as.mjs > research/solver/results-derive-7as.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as P from './reduce-P.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R = readFileSync(join(HERE, 'results-P.txt'), 'utf8');
const logs = Object.fromEntries(readdirSync(join(HERE, 'results', 'diagP')).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(HERE, 'results', 'diagP', f), 'utf8')]));
requireFairLogs(logs, P.PRED);
const pair = re => { const m = re.exec(R); if (!m) throw new Error(`results-P.txt: no line ${re}`); return { saved: +m[1], lost: +m[2], d: +m[3], lo: +m[4], hi: +m[5] }; };
console.log("7AS'S DERIVATION (P's registered read, results-P.txt, and P's case files through their stamps; no solve)");
const p0 = pair(/S194\s+OPEN2\/0 against OPEN2\/1e-3\s+(\d+)\/(\d+) (\S+) \((\S+) to (\S+)\)/), p1 = pair(/S194\s+OPEN2\/P against OPEN2\/1e-3\s+(\d+)\/(\d+) (\S+) \((\S+) to (\S+)\)/);
const w3 = (/3\. O50's harm[^\n]*\n\s+whole (\S+) \((\S+) to (\S+)\)/.exec(R) || []).slice(1).map(Number);
console.log("1. S194's slice at world 0's node, OPEN2 against OPEN2 at the margin 1e-3 (16,000 paths)");
console.log(`   charge 0 (margin 0): ${p0.saved}/${p0.lost} survival ${p0.d} (${p0.lo} to ${p0.hi})`);
console.log(`   charge 0.001 (P):    ${p1.saved}/${p1.lost} survival ${p1.d} (${p1.lo} to ${p1.hi}); the whole score ${w3[0]} (${w3[1]} to ${w3[2]})`);
const slope = (p1.d - p0.d) / 0.001;
console.log(`   the line through the two: ${slope.toFixed(1)} points per unit of charge; at 0.0005 ${(p0.d + slope * 0.0005).toFixed(3)}, at 0.002 ${(p0.d + slope * 0.002).toFixed(3)} (survival; two points, not a model)`);
console.log(`   item 2's band: HELD needs the whole score's lower end above -${P.MW}, so a point above about -${(P.MW - (w3[2] - w3[1]) / 2).toFixed(3)} at P's half-width ${((w3[2] - w3[1]) / 2).toFixed(3)}; FALSIFIED a point below about -${(P.MW + (w3[2] - w3[1]) / 2).toFixed(3)}`);
{ const m = /S194 \(off\) W0\.02 M1e-3 .*?WA (\S+)/.exec(R), z = /S194 \(off\) W0\.02 M0 .*?WA (\S+)/.exec(R), p = /S194 \(off\) W0\.02 MP .*?WA (\S+)/.exec(R);
  console.log(`1b. the world-aware chooser at S194's node (survival, 16,000 paths): margin 1e-3 ${m[1]}, margin 0 ${z[1]}, the charge 0.001 ${p[1]} - item 3 reads the charge 0.002 against the margin's ${m[1]} by the whole score (no paired WA leg is printed in results-P.txt: its half-width taken as item 2's, NOT CHECKED)`); }
console.log('2. across all worlds, P against the margin (TS+J, 16,000 paths): the whole score and its half-width; at 8,000 the half-width times sqrt 2');
for (const id of ['bridge 4', 'S194', 'S126']) {
  const m = new RegExp(`${id.replace(' ', '\\s')}\\s+TS\\+J\\/P against TS\\+J\\/1e-3\\s+(\\d+)\\/(\\d+)\\s+whole (\\S+) \\((\\S+) to (\\S+)\\)`).exec(R);
  const h = (+m[5] - +m[4]) / 2;
  console.log(`   ${id.padEnd(9)} ${m[1]}/${m[2]} whole ${m[3]} (${m[4]} to ${m[5]}): half-width ${h.toFixed(3)}, at 8,000 about ${(h * Math.SQRT2).toFixed(3)}; FLAT (inside +/-${P.MW}) needs a point within about ${(P.MW - h * Math.SQRT2).toFixed(3)} of 0`);
}
console.log("3. the time: P's measured seconds per unit (results/diagP), scaled");
const H = (1479 + 1567) / (844 + 900) * 0.89;
let tot = 0; const per = [];
for (const [id] of P.CORE) {
  const t = Object.values(logs).find(x => new RegExp(`^${id}\\s+case \\| job core:P `, 'm').test(x));
  const s = +/solve \S+: table \S+ secs (\d+)/.exec(t)[1], nd = +/node \S+ 0 z \S+: .* secs (\d+)$/m.exec(t)[1], al = +/all \S+: TS\+J \S+ held0 \d+ paths \d+ secs (\d+)/.exec(t)[1];
  const core = (s + (id === 'S194' ? nd * 3 / 4 : 0) + al / 2) * H, ident = s * H;   // S194's node: 3 of P's 4 rules (TS+J, OPEN2, WA)
  per.push(core, core, ident); tot += 2 * core + ident;
  console.log(`   ${id.padEnd(9)} P: solve ${s} s, node (4 rules, 16,000) ${nd} s, all worlds (16,000) ${al} s; a 7as charged job about ${Math.round(core)} s, an identity solve about ${Math.round(ident)} s (times ${H.toFixed(2)})`);
}
const waves = xs => { const c = [0, 0, 0, 0]; for (const x of [...xs].sort((a, b) => b - a)) { c.sort((a, b) => a - b); c[0] += x; } return Math.max(...c); };
console.log(`   9 jobs: ${(tot / 3600).toFixed(2)} core-hours; on four cores (longest first) ${(waves(per) / 3600).toFixed(2)} hours (P's own host unrecorded: NOT CHECKED)`);
