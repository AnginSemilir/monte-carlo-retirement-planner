/*
 * EZ'S RUN SCORED (EXPLORATORY; the prediction in EZ.md section 9, committed in 72bf950 before the launch). Reads the run's
 * read (results-ez-run.txt, the whole output of `ez-run.mjs --read`) and prints each prediction's figure against its
 * declared range, then the figures beside it that EZ.md section 10 cites. It refuses a read that is not FAIR, or that lacks
 * a line it needs, and checks its own sums against the read's (the pooled survival pair and the retirees' means).
 *   node ez-score.mjs [results-ez-run.txt]      (results-ez-score.txt)
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const file = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), 'results-ez-run.txt');
const txt = readFileSync(file, 'utf8'), lines = txt.split('\n');
const die = m => { console.error(`ez-score: ${m}`); process.exit(1); };
if (!/^FAIR: /m.test(txt) || /^NOT FAIR/m.test(txt)) die('the read is not FAIR');
const ARMS = ['APP', 'CAND', 'DIAL10', 'DIAL10M', 'EZ'], IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
// the households retired at the start; checked below against the read's own means for the retirees
const RETIREES = ['S090', 'S030', 'S368', 'S050'];
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), sg = (x, d = 1) => (Math.abs(x) < 0.5 * 10 ** -d ? (0).toFixed(d) : `${x > 0 ? '+' : ''}${x.toFixed(d)}`);
const mean = xs => xs.reduce((p, x) => p + x, 0) / xs.length;

// the pooled block
const pooled = {}, at = lines.findIndex(l => l.startsWith('Pooled, each household once'));
if (at < 0) die('no pooled block');
for (const l of lines.slice(at + 1)) {
  const m = l.match(/^  (APP|CAND|DIAL10M|DIAL10|EZ)\s+survival ([\d.]+)%; the first retired year ([\d.]+)% \(the retirees ([\d.]+)%\); by retired years 1-5 ([\d.]+)%, 6-10 ([\d.]+)%, 11-20 ([\d.]+)%, 21-on ([\d.]+)%; at the floor 1-5 (\d+)%, 6-10 (\d+)%, 11-20 (\d+)%, 21-on (\d+)%; at 110% 1-5 (\d+)%, 6-10 (\d+)%, 11-20 (\d+)%, 21-on (\d+)%; cuts after year 1 ([\d.]+) a hundred years, (\d+)% after the worst third of market years(?:; the pension and ISA's equity share at retired years 1, 5, 10, 20 ([\d.]+) \/ ([\d.]+) \/ ([\d.]+) \/ ([\d.]+)% \(the retirees ([\d.]+) \/ ([\d.]+) \/ ([\d.]+) \/ ([\d.]+)%\))?$/);
  if (!m) continue;
  const v = m.slice(2).map(x => (x === undefined ? NaN : Number(x)));
  pooled[m[1]] = { surv: v[0], open: v[1], openRet: v[2], bands: v.slice(3, 7), floor: v.slice(7, 11), top: v.slice(11, 15), cuts: v[15], eq: v.slice(17, 21), eqRet: v.slice(21, 25) };
}
for (const a of ARMS) if (!pooled[a]) die(`no pooled line for ${a}`);
const pm = txt.match(/EZ less CAND, survival ([+-][\d.]+) \(se ([\d.]+); ([+-][\d.]+) to ([+-][\d.]+)\); less DIAL10 ([+-][\d.]+) \(se ([\d.]+); ([+-][\d.]+) to ([+-][\d.]+)\); less DIAL10M ([+-][\d.]+) \(se ([\d.]+); ([+-][\d.]+) to ([+-][\d.]+)\)/);
if (!pm) die('no pooled survival pairs');
const [vsC, , vsM] = [1, 5, 9].map(i => ({ s: `${pm[i]} (se ${pm[i + 1]}; ${pm[i + 2]} to ${pm[i + 3]})`, d: Number(pm[i]), lo: Number(pm[i + 2]), hi: Number(pm[i + 3]) }));
const em = txt.match(/the estate where each survives, the households' mean: EZ (\d+), CAND (\d+)/);
if (!em) die('no pooled estate');

// the households
const hh = {};
let cur = null;
for (const l of lines) {
  let m;
  if ((m = l.match(/^  (S\d+F?)\s+APP /))) { cur = hh[m[1]] = { id: m[1], arm: {} }; continue; }
  if (!cur || l.startsWith('Pooled')) { cur = null; continue; }
  if ((m = l.match(/^\s+(CAND|DIAL10M|DIAL10|EZ) ([\d.]+)%, first year ([\d.]+)%, by years 1-5 ([\d.]+)%.*; equity at retired years 1, 5, 10, 20: ([\d.]+) \/ ([\d.]+) \/ ([\d.]+) \/ ([\d.]+)%$/)))
    cur.arm[m[1]] = { surv: Number(m[2]), open: Number(m[3]), eq: [5, 6, 7, 8].map(i => Number(m[i])) };
  else if ((m = l.match(/^\s+EZ less CAND ([+-][\d.]+) \(se ([\d.]+); (\d+)\/(\d+)\); less DIAL10 [+-][\d.]+ \(se [\d.]+\); less DIAL10M [+-][\d.]+ \(se [\d.]+\); the estate where each survives, EZ (\d+), CAND (\d+)$/)))
    Object.assign(cur, { vsC: Number(m[1]), ezSurvivesAlone: Number(m[3]), candSurvivesAlone: Number(m[4]), estEz: Number(m[5]), estCand: Number(m[6]) });
}
for (const id of IDS) if (!hh[id] || !['CAND', 'DIAL10', 'DIAL10M', 'EZ'].every(a => hh[id].arm[a]) || hh[id].vsC === undefined) die(`${id}: its lines are not all there`);
const H = IDS.map(id => hh[id]);
// each household's survival is a count of 1,000 printed to 0.1, so these differences are exact
const dOf = a => mean(H.map(h => h.arm[a].surv - h.arm.CAND.surv));
for (const h of H) if (Math.abs(h.arm.EZ.surv - h.arm.CAND.surv - h.vsC) > 0.005 + 1e-9) die(`${h.id}: EZ less CAND ${h.vsC} is not its survivals' difference`);
if (Math.abs(dOf('EZ') - vsC.d) > 0.005 + 1e-9) die(`the households' EZ less CAND ${dOf('EZ')} is not the read's ${vsC.d}`);
for (const a of ['CAND', 'DIAL10', 'DIAL10M', 'EZ']) {
  const r = H.filter(h => RETIREES.includes(h.id));
  if (Math.abs(mean(r.map(h => h.arm[a].open)) - pooled[a].openRet) > 0.1 || Math.abs(mean(r.map(h => h.arm[a].eq[0])) - pooled[a].eqRet[0]) > 0.1) die(`${a}: the retirees are not ${RETIREES.join(', ')}`);
}

const P = pooled, out = [], score = [];
const verdict = ok => (score.push(ok), ok ? 'HELD' : 'MISSED');
out.push(`EZ's run scored (EXPLORATORY), against the prediction in EZ.md section 9 (committed before the launch), from ${file.split('/').pop()}; the read FAIR`);
out.push('The prediction:');
out.push(`  1. survival, EZ less CAND, pooled: ${vsC.s} against -1.0 to +0.5: ${verdict(vsC.d >= -1.0 && vsC.d <= 0.5)}${vsC.lo < -1.0 || vsC.hi > 0.5 ? ` (the interval reaches past the range, to ${vsC.lo < -1.0 ? vsC.lo : vsC.hi})` : ''}`);
const y15 = P.EZ.bands[0] - P.CAND.bands[0];
out.push(`  2. retired years 1-5: EZ ${f1(P.EZ.bands[0])}% against CAND's ${f1(P.CAND.bands[0])}%, ${sg(y15)} points, against +3 to +10: ${verdict(y15 >= 3 && y15 <= 10)}`);
out.push(`  3. retired years 1-5 at the floor: EZ ${P.EZ.floor[0]}% (CAND ${P.CAND.floor[0]}%) against 25% to 65%: ${verdict(P.EZ.floor[0] < P.CAND.floor[0] && P.EZ.floor[0] >= 25 && P.EZ.floor[0] <= 65)}`);
const o = P.EZ.openRet - P.CAND.openRet;
out.push(`  4. the retirees' first retired year: EZ ${f1(P.EZ.openRet)}% against CAND's ${f1(P.CAND.openRet)}%, ${sg(o)}, against within 5: ${verdict(Math.abs(o) <= 5)}`);
const late = P.EZ.bands[3] - P.CAND.bands[3];
out.push(`  5. from the 21st retired year: EZ ${f1(P.EZ.bands[3])}% against CAND's ${f1(P.CAND.bands[3])}%, ${sg(late)}, against within 2: ${verdict(Math.abs(late) <= 2)}`);
const e1 = P.EZ.eqRet[0] - P.CAND.eqRet[0];
out.push(`  6. the retirees' equity in retired year 1: EZ ${f1(P.EZ.eqRet[0])}% against CAND's ${f1(P.CAND.eqRet[0])}%, ${sg(e1)}, against within 5: ${verdict(Math.abs(e1) <= 5)}`);
out.push(`  7. EZ less DIAL10M, survival: ${vsM.s} against +0.3 to +2.0: ${verdict(vsM.d >= 0.3 && vsM.d <= 2.0)}; retired years 1-5: EZ ${f1(P.EZ.bands[0])}% against DIAL10M's ${f1(P.DIAL10M.bands[0])}%, below: ${verdict(P.EZ.bands[0] < P.DIAL10M.bands[0])}`);
const items = [...score.slice(0, 6), score[6] && score[7]];
out.push(`  held ${items.filter(Boolean).length} of ${items.length} (7 holds only if both its parts do)`);

out.push('Beside (not predicted):');
out.push(`  survival, EZ less CAND, by household: ${H.map(h => `${h.id} ${sg(h.vsC, 2)}`).join(', ')}; below CAND on ${H.filter(h => h.vsC < 0).length} of ${H.length}; the paths where one of the two alone fails: EZ ${H.reduce((p, h) => p + h.candSurvivesAlone, 0)}, CAND ${H.reduce((p, h) => p + h.ezSurvivesAlone, 0)}, of ${1000 * H.length}`);
out.push('  each arm less CAND, pooled: survival (paired, from the households\' counts), retired years 1-5 (the pooled levels), and years 1-5 at the floor');
for (const a of ['DIAL10', 'DIAL10M', 'EZ']) out.push(`    ${a.padEnd(8)} ${sg(dOf(a), 2)} points; ${sg(P[a].bands[0] - P.CAND.bands[0])} points (${f1(P[a].bands[0])}%); at the floor ${P[a].floor[0]}% (CAND ${P.CAND.floor[0]}%)`);
const atFloor = a => H.filter(h => h.arm[a].open === 80).map(h => h.id);
out.push(`  the first retired year at the floor on every path (80.0%): EZ on ${atFloor('EZ').join(', ')}; CAND on ${atFloor('CAND').join(', ')}; of the retirees (${RETIREES.join(', ')}) EZ ${atFloor('EZ').filter(x => RETIREES.includes(x)).length}, CAND ${atFloor('CAND').filter(x => RETIREES.includes(x)).length}`);
const eqs = (a, k) => P[a][k].map(f1).join(' / ');
out.push(`  the pension and ISA's equity share at retired years 1 / 5 / 10 / 20, pooled: EZ ${eqs('EZ', 'eq')}%, CAND ${eqs('CAND', 'eq')}%, EZ less CAND ${P.EZ.eq.map((x, i) => sg(x - P.CAND.eq[i])).join(' / ')} points; the retirees: EZ ${eqs('EZ', 'eqRet')}%, CAND ${eqs('CAND', 'eqRet')}%, ${P.EZ.eqRet.map((x, i) => sg(x - P.CAND.eqRet[i])).join(' / ')}`);
out.push(`  the first retired year's equity where retirement comes later: ${H.filter(h => !RETIREES.includes(h.id)).map(h => `${h.id} EZ ${f1(h.arm.EZ.eq[0])}% against CAND ${f1(h.arm.CAND.eq[0])}%`).join(', ')}`);
const range = a => { const v = H.flatMap(h => h.arm[a].eq); return `${f1(Math.min(...v))}% to ${f1(Math.max(...v))}%`; };
out.push(`  the equity share at the four years, over every household: EZ ${range('EZ')}, CAND ${range('CAND')}, DIAL10M ${range('DIAL10M')}`);
out.push(`  at 110% in retired years 6-10: ${['CAND', 'DIAL10', 'DIAL10M', 'EZ'].map(a => `${a} ${P[a].top[1]}%`).join(', ')}; cuts after year 1 a hundred years: ${['CAND', 'DIAL10', 'DIAL10M', 'EZ'].map(a => `${a} ${f1(P[a].cuts)}`).join(', ')}`);
const eE = Number(em[1]), eC = Number(em[2]);
out.push(`  the estate where each survives, the households' mean: EZ ${eE.toLocaleString('en-GB')} against CAND ${eC.toLocaleString('en-GB')}, ${(100 * (1 - eE / eC)).toFixed(0)}% lower; lower on ${H.filter(h => h.estEz < h.estCand).length} of ${H.length}`);
console.log(out.join('\n'));
