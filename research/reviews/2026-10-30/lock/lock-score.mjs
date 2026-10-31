/*
 * THE LOCKED RUN SCORED (EXPLORATORY; the prediction in LOCK.md section 3, committed in 39711d0 before the launch). Reads
 * the run's read (results-lock-run.txt, the whole output of `lock-run.mjs --read`) and prints each prediction's figure
 * against its declared range, then the figures beside it that LOCK.md section 4 cites. It refuses a read that is not FAIR,
 * that lacks a line it needs, or whose pooled figures are not its households' (survival from the counts, exactly).
 *   node lock-score.mjs [results-lock-run.txt]      (results-lock-score.txt)
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const file = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), 'results-lock-run.txt');
const txt = readFileSync(file, 'utf8'), lines = txt.split('\n');
const die = m => { console.error(`lock-score: ${m}`); process.exit(1); };
if (!/^FAIR: /m.test(txt) || /^NOT FAIR/m.test(txt)) die('the read is not FAIR');
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'], RETIREES = ['S090', 'S030', 'S368', 'S050'];
const ARMS = ['APP', 'CAND', 'DIAL10M', 'EZ', 'D10MLK', 'EZLK10', 'EZLK30'], LOCKED = ['D10MLK', 'EZLK10', 'EZLK30'];
const f1 = x => x.toFixed(1), sg = (x, d = 1) => (Math.abs(x) < 0.5 * 10 ** -d ? (0).toFixed(d) : `${x > 0 ? '+' : ''}${x.toFixed(d)}`);
const mean = xs => xs.reduce((p, x) => p + x, 0) / xs.length;
const num = '([+-]?[\\d.]+)', eqv = '([\\d.]+|-)';   // eqv: an equity share, '-' where a household has none that year

// the households' lines: each arm's survival, first year, years 1-5, years 1-5 at the floor, equity at years 1/5/10/20
const hh = {};
let cur = null;
for (const l of lines) {
  let m;
  if ((m = l.match(/^  (S\d+F?)\s+APP ([\d.]+)%/))) { cur = hh[m[1]] = { APP: { surv: Number(m[2]) } }; continue; }
  if (!cur) continue;
  if (l.startsWith('Pooled')) { cur = null; continue; }
  if ((m = l.match(new RegExp(`^\\s+(CAND|DIAL10M|EZLK10|EZLK30|D10MLK|EZ) ${num}%, first year ${num}%, by years 1-5 ${num}%.*, at the floor in years 1-5 (\\d+)%; equity at retired years 1, 5, 10, 20: ${eqv} / ${eqv} / ${eqv} / ${eqv}%$`))))
    cur[m[1]] = { surv: Number(m[2]), open: Number(m[3]), y15: Number(m[4]), floor15: Number(m[5]), eq: [6, 7, 8, 9].map(i => (m[i] === '-' ? NaN : Number(m[i]))) };
}
for (const id of IDS) for (const a of ARMS) if (!hh[id] || !hh[id][a]) die(`${id} ${a}: no line`);
// the pooled block
const pooled = {}, at = lines.findIndex(l => l.startsWith('Pooled, each household once'));
if (at < 0) die('no pooled block');
for (const l of lines.slice(at + 1)) {
  const m = l.match(new RegExp(`^  (APP|CAND|DIAL10M|EZLK10|EZLK30|D10MLK|EZ)\\s+survival ${num}%; the first retired year ${num}% \\(the retirees ${num}%\\); by retired years 1-5 ${num}%, 6-10 ${num}%, 11-20 ${num}%, 21-on ${num}%; at the floor 1-5 (\\d+)%, 6-10 (\\d+)%, 11-20 (\\d+)%, 21-on (\\d+)%; at 110% 1-5 (\\d+)%, 6-10 (\\d+)%, 11-20 (\\d+)%, 21-on (\\d+)%; cuts after year 1 ${num} a hundred years, (\\d+)% after the worst third of market years(?:; the pension and ISA's equity share at retired years 1, 5, 10, 20 ${num} / ${num} / ${num} / ${num}% \\(the retirees ${num} / ${num} / ${num} / ${num}%\\))?; the estate where it survives, the households' mean (\\d+|-)$`));
  if (!m) continue;
  const v = m.slice(2).map(x => (x === undefined || x === '-' ? NaN : Number(x)));
  pooled[m[1]] = { surv: v[0], open: v[1], openRet: v[2], bands: v.slice(3, 7), floor: v.slice(7, 11), top: v.slice(11, 15), cuts: v[15], eq: v.slice(17, 21), eqRet: v.slice(21, 25), estate: v[25] };
}
for (const a of ARMS) if (!pooled[a]) die(`no pooled line for ${a}`);
// the paired survival lines
const pairs = {};
for (const l of lines) { const m = l.match(new RegExp(`^  (\\w+) less (\\w+): ${num} \\(se ${num}; ${num} to ${num}; (\\d+) paths survive in the first alone, (\\d+) in the second, of (\\d+)\\)`)); if (m) pairs[`${m[1]}-${m[2]}`] = { d: Number(m[3]), se: Number(m[4]), lo: Number(m[5]), hi: Number(m[6]), aOnly: Number(m[7]), bOnly: Number(m[8]), of: Number(m[9]), s: `${m[3]} (se ${m[4]}; ${m[5]} to ${m[6]})` }; }
for (const k of ['D10MLK-CAND', 'EZLK10-CAND', 'EZLK30-CAND', 'D10MLK-DIAL10M', 'EZLK30-EZ', 'EZLK10-D10MLK', 'EZLK30-D10MLK']) if (!pairs[k]) die(`no paired line ${k}`);
// the comparison at equal survival
const eqm = txt.match(new RegExp(`At equal survival \\(EZ read at D10MLK's pooled survival, ${num}%, on the line between EZLK10 at ${num}% and EZLK30 at ${num}%: the weight on EZLK30 ${num}, (BRACKETED|NOT BRACKETED: extrapolated); 95% intervals from (\\d+) bootstrap replicates of the paths, the weight's own from ${num} to ${num}\\):`));
const lvm = txt.match(new RegExp(`retired years 1-5, EZ less D10MLK: ${num} points of the target \\(${num} to ${num}\\); D10MLK ${num}%, EZLK10 ${num}%, EZLK30 ${num}%: (EZ HIGHER|EZ LOWER|NOT SEPARATED)`));
const flm = txt.match(new RegExp(`retired years 1-5 at the floor, EZ less D10MLK: ${num} points \\(${num} to ${num}\\); D10MLK ${num}%, EZLK10 ${num}%, EZLK30 ${num}%: (EZ LESS AT THE FLOOR|EZ MORE AT THE FLOOR|NOT SEPARATED)`));
if (!eqm || !lvm || !flm) die('no comparison at equal survival');
// its own sums: each arm's pooled survival the mean of its households' (each a count of 1,000, printed to 0.1, so exact
// to rounding); each paired line's mean the households' difference
for (const a of ARMS) { const m = mean(IDS.map(id => hh[id][a].surv)); if (Math.abs(m - pooled[a].surv) > 0.05 + 1e-9) die(`${a}: the households' survival ${m} is not the pooled ${pooled[a].surv}`); }
const dOf = (a, b) => mean(IDS.map(id => hh[id][a].surv - hh[id][b].surv));
for (const [k, p] of Object.entries(pairs)) { const [a, b] = k.split('-'); if (Math.abs(dOf(a, b) - p.d) > 0.005 + 1e-9) die(`${k}: the households' difference ${dOf(a, b)} is not the read's ${p.d}`); }
for (const a of ['CAND', 'DIAL10M', 'EZ', ...LOCKED]) { const r = RETIREES.map(id => hh[id][a]); if (Math.abs(mean(r.map(x => x.open)) - pooled[a].openRet) > 0.1 || Math.abs(mean(r.map(x => x.eq[0])) - pooled[a].eqRet[0]) > 0.1) die(`${a}: the retirees are not ${RETIREES.join(', ')}`); }

const P = pooled, out = [], score = [];
const verdict = ok => (score.push(ok), ok ? 'HELD' : 'MISSED');
out.push(`The locked run scored (EXPLORATORY), against the prediction in LOCK.md section 3 (committed before the launch), from ${file.split('/').pop()}; the read FAIR`);
out.push('The prediction:');
const p1 = pairs['D10MLK-DIAL10M'], p2 = pairs['EZLK30-EZ'];
out.push(`  1. the lock's cost to the dial, D10MLK less DIAL10M, survival: ${p1.s} against -1.0 to +0.5: ${verdict(p1.d >= -1.0 && p1.d <= 0.5)}`);
out.push(`  2. the lock's cost to EZ, EZLK30 less EZ, survival: ${p2.s} against -0.5 to +0.5: ${verdict(p2.d >= -0.5 && p2.d <= 0.5)}`);
const dSv = dOf('EZLK30', 'EZLK10'), dY = P.EZLK10.bands[0] - P.EZLK30.bands[0];
out.push(`  3. the price: EZLK10 below EZLK30 by ${dSv.toFixed(2)} points of survival (against 0.5 to 3.0): ${verdict(dSv >= 0.5 && dSv <= 3.0)}; above it in years 1-5 by ${sg(dY)} points (${f1(P.EZLK10.bands[0])}% against ${f1(P.EZLK30.bands[0])}%; against +2 to +8): ${verdict(dY >= 2 && dY <= 8)}`);
out.push(`  4. the bracket: D10MLK's pooled survival ${eqm[1]}% between EZLK10's ${eqm[2]}% and EZLK30's ${eqm[3]}% (the weight on EZLK30 ${eqm[4]}): ${verdict(eqm[5] === 'BRACKETED')}`);
out.push(`  5. at equal survival: years 1-5, EZ less D10MLK ${lvm[1]} points (${lvm[2]} to ${lvm[3]}): ${lvm[7]}, predicted EZ LOWER: ${verdict(lvm[7] === 'EZ LOWER')}; at the floor ${flm[1]} points (${flm[2]} to ${flm[3]}): ${flm[7]}, predicted EZ MORE AT THE FLOOR: ${verdict(flm[7] === 'EZ MORE AT THE FLOOR')}`);
const eqGap = LOCKED.map(a => ({ a, w: Math.max(...IDS.map(id => Math.abs(hh[id][a].eq[0] - hh[id].CAND.eq[0]))) }));
out.push(`  6. the tiers: the first retired year's equity, the largest gap to CAND's on a household: ${eqGap.map(x => `${x.a} ${x.w.toFixed(1)}`).join(', ')} points (against within 1): ${verdict(eqGap.every(x => x.w <= 1 + 1e-9))}; at retired year 20, pooled, ${LOCKED.map(a => `${a} ${f1(P[a].eq[3])}%`).join(', ')} (against between EZ's ${f1(P.EZ.eq[3])}% and CAND's ${f1(P.CAND.eq[3])}%): ${verdict(LOCKED.every(a => P[a].eq[3] > P.EZ.eq[3] && P[a].eq[3] < P.CAND.eq[3]))}`);
const items = [score[0], score[1], score[2] && score[3], score[4], score[5] && score[6], score[7] && score[8]];
out.push(`  held ${items.filter(Boolean).length} of ${items.length} (an item with two parts holds only if both do); its parts ${score.filter(Boolean).length} of ${score.length}`);

out.push('Beside (not predicted):');
out.push('  each arm against CAND, pooled: survival (paired), the retirees\' first year, retired years 1-5, at the floor in years 1-5, from the 21st year, the estate where it survives');
for (const a of ['DIAL10M', 'EZ', 'D10MLK', 'EZLK30', 'EZLK10']) out.push(`    ${a.padEnd(8)} ${sg(dOf(a, 'CAND'), 2)} points; first year ${f1(P[a].openRet)}% (CAND ${f1(P.CAND.openRet)}%); years 1-5 ${f1(P[a].bands[0])}% (${sg(P[a].bands[0] - P.CAND.bands[0])}); at the floor ${P[a].floor[0]}% (CAND ${P.CAND.floor[0]}%); from the 21st ${f1(P[a].bands[3])}% (CAND ${f1(P.CAND.bands[3])}%); the estate ${Number.isFinite(P[a].estate) ? `${(100 * (P[a].estate / P.CAND.estate - 1)).toFixed(0)}% against CAND's` : 'not recorded in its units'}`);
out.push(`  survival by household, D10MLK less DIAL10M: ${IDS.map(id => `${id} ${sg(hh[id].D10MLK.surv - hh[id].DIAL10M.surv)}`).join(', ')}; EZLK30 less EZ: ${IDS.map(id => `${id} ${sg(hh[id].EZLK30.surv - hh[id].EZ.surv)}`).join(', ')}`);
const atFloor = a => IDS.filter(id => RETIREES.includes(id) && hh[id][a].open === 80);
out.push(`  the retirees' first retired year at the floor on every path (80.0%): ${['CAND', 'DIAL10M', 'EZ', ...LOCKED].map(a => `${a} ${atFloor(a).length} of 4${atFloor(a).length ? ` (${atFloor(a).join(', ')})` : ''}`).join('; ')}`);
out.push(`  the equity share at retired years 1 / 5 / 10 / 20, pooled: ${['CAND', 'DIAL10M', 'EZ', ...LOCKED].map(a => `${a} ${P[a].eq.map(f1).join(' / ')}%`).join('; ')}`);
out.push(`  at 110% in retired years 6-10: ${['CAND', 'DIAL10M', 'EZ', ...LOCKED].map(a => `${a} ${P[a].top[1]}%`).join(', ')}; cuts after year 1 a hundred years: ${['CAND', 'DIAL10M', 'EZ', ...LOCKED].map(a => `${a} ${f1(P[a].cuts)}`).join(', ')}`);
console.log(out.join('\n'));
