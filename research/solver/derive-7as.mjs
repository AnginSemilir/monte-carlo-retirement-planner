/*
 * 7AS'S DERIVATION (predictions/diag-7as.md; PLAN.md 7as). What P's records say before any 7as solve, read from P's
 * registered read (results-P.txt, reduce-P.mjs's output after its gate) and P's case files (results/diagP, through their
 * stamps) for the seconds:
 *   1. S194's bad-world slice by the setting P read: OPEN2 at margin 0 and at the charge 0.001 against OPEN2 at the margin
 *      1e-3 (saved/lost, survival), the whole score at 0.001, and the straight line through the two survival points to the
 *      charge 0.002 and 0.0005 (a reading of two points, not a model).
 *   1b. The world-aware chooser WA at S194's node under the margin, margin 0 and the charge 0.001 (P's node line): item 3's
 *      reference, and P's own read of it (the deep review after P: WA scores the same with or without the charge).
 *   1c. THE SPLIT AT P'S CHARGE, FROM P'S TRACES (what the records already contain; RULES.md: derive first; CHECKLIST 3: a
 *      reuse is a new question, so P's traces are read only through P's stamps and held to P's logs): at S194's node, path
 *      by path, OPEN2 at 0.001 less OPEN2 at 1e-3 (the slice) against WA at 0.001 less WA at 1e-3, by reduce-7as.mjs's own
 *      splitItem - and WA's paired whole-score leg and half-width (wholeLeg) at 0.001 and at margin 0, item 3's power. Grade C
 *      for the attribution: computed after the plan-auditor's receipt of 3 Oct 20:14 UK had shown WA's leg at 0.001 (post hoc).
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
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';
import { splitItem } from './reduce-7as.mjs';
import { gunzipSync } from 'node:zlib';
import { decode } from './reduce-7t.mjs';

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
const p0line = c => p0.d + slope * c;
console.log(`   the line through the two: ${slope.toFixed(1)} points per unit of charge; at 0.0005 ${(p0.d + slope * 0.0005).toFixed(3)}, at 0.002 ${(p0.d + slope * 0.002).toFixed(3)} (survival; two points, not a model)`);
console.log(`   item 2's band: HELD needs the whole score's lower end above -${P.MW}, so a point above about -${(P.MW - (w3[2] - w3[1]) / 2).toFixed(3)} at P's half-width ${((w3[2] - w3[1]) / 2).toFixed(3)}; FALSIFIED a point below about -${(P.MW + (w3[2] - w3[1]) / 2).toFixed(3)}`);
{ const m = /S194 \(off\) W0\.02 M1e-3 .*?WA (\S+)/.exec(R), z = /S194 \(off\) W0\.02 M0 .*?WA (\S+)/.exec(R), p = /S194 \(off\) W0\.02 MP .*?WA (\S+)/.exec(R);
  console.log(`1b. the world-aware chooser at S194's node (survival, 16,000 paths): margin 1e-3 ${m[1]}, margin 0 ${z[1]}, the charge 0.001 ${p[1]} (its paired legs from P's traces in 1c)`); }
{
  const jobsP = Object.values(logs).flatMap(P.parse), ST = P.stampOf(logs), j = mg => jobsP.find(x => x.kind === `core:${mg}` && x.id === 'S194');
  const tr = (mg, rule) => { const u = j(mg).tags[mg], f = join(HERE, 'results', 'diagP', P.traceName('S194', 'OFF', mg, rule, '0.02', 'world0')), t = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!P.traceAgrees(t, ST, 'OFF', mg, rule, '0.02', u.node.sim[rule], P.WN, 'world0')) throw new Error(`${f}: not P's log's`); return decode(t); };
  const u = j('P').tags.P, cfg = (X, Y) => ({ lambda: Number(P.field(u.ran, 'lambda')), floor: Math.min(...P.field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: 0.02, spendYears: F.spendYears(X, Y) });
  const per = (X, Y) => { const c = cfg(X, Y), x = A.wholePaths(X, c), y = A.wholePaths(Y, c); return Array.from(y, (v, k) => v - x[k]); };
  const O1 = tr('1e-3', 'OPEN2'), OP = tr('P', 'OPEN2'), W1 = tr('1e-3', 'WA'), WP = tr('P', 'WA'), W0 = tr('0', 'WA');
  const lw = (X, Y) => A.wholeLeg(X, Y, cfg(X, Y), 0.05), f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
  const wa1 = lw(W1, WP), wa0 = lw(W1, W0), op = lw(O1, OP);
  console.log(`1c. the split at P's charge, from P's traces (S194's node, ${O1.N} paths; grade C, post hoc)`);
  console.log(`   OPEN2 at 0.001 against 1e-3: whole ${f3(op.d)} (${op.lo.toFixed(3)} to ${op.hi.toFixed(3)}), half-width ${((op.hi - op.lo) / 2).toFixed(3)}`);
  console.log(`   WA at 0.001 against 1e-3:    whole ${f3(wa1.d)} (${wa1.lo.toFixed(3)} to ${wa1.hi.toFixed(3)}), half-width ${((wa1.hi - wa1.lo) / 2).toFixed(3)}; WA at margin 0 against 1e-3: ${f3(wa0.d)} (${wa0.lo.toFixed(3)} to ${wa0.hi.toFixed(3)}), half-width ${((wa0.hi - wa0.lo) / 2).toFixed(3)}`);
  const sp = splitItem(per(O1, OP), per(W1, WP));
  // item 3's power at 0.0005: P's per-path spread of the two test statistics at 0.001, with the slice at the line's value at
  // 0.0005 and WA's share as at 0.001 (a model, not a measurement): z = mean / (sd / sqrt n)
  { const o = per(O1, OP), a = per(W1, WP), n = o.length, mean = xs => xs.reduce((t, x) => t + x, 0) / n, sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (n - 1)); };
    const L1 = -mean(o), A1 = -mean(a), share = A1 / L1, Lq = -(p0line(0.0005)), sH = sd(a.map((x, j) => x - o[j] / 3)), sF = sd(a.map((x, j) => (2 / 3) * o[j] - x)), sS = sd(o);
    const zH = (Lq / 3 - share * Lq) / (sH / Math.sqrt(n)), zS = Lq / (sS / Math.sqrt(n)), zH1 = (L1 / 3 - A1) / (sH / Math.sqrt(n));
    console.log(`   item 3's power at 0.0005 (P's per-path spread at 0.001: sd of a - o/3 ${sH.toFixed(3)}, of 2o/3 - a ${sF.toFixed(3)}, of o ${sS.toFixed(3)}; the slice at the line's ${Lq.toFixed(3)}, WA's share as at 0.001, ${share.toFixed(2)}): the premise's z ${zS.toFixed(2)}, the HELD side's z ${zH.toFixed(2)} (at 0.001: ${zH1.toFixed(2)}); Holm over two needs a one-sided p under 0.025, z about 1.96, power 0.8 at about 2.8 - a model (the line through two points, the spread unscaled), NOT CHECKED`); }
  console.log(`   the contrast path by path (reduce-7as.mjs splitItem): the slice ${f3(-sp.L)} a path (p ${sp.pSlice.toExponential(2)}), WA's move ${f3(-sp.A)}, WA's share of the slice ${Number.isFinite(sp.share) ? sp.share.toFixed(2) : '-'}; ${sp.note ? sp.note : `HELD side p ${sp.pU.toExponential(2)} (Holm ${sp.hU.toExponential(2)}), FALSIFIED side p ${sp.pD.toExponential(2)} (Holm ${sp.hD.toExponential(2)})`}: ${sp.read}`);
}
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
