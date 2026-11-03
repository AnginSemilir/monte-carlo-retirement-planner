/*
 * THE CANVAS'S CHARTS, AS SVG PATHS (LAYOUT.md section 3.1, the outlook): reads the bands figures.mjs printed ("spend solved
 * all", "fan solved all", "fan yours all") and prints the path data the canvas's two charts draw, at the desktop's size and
 * the phone's, so each shape on the canvas is the results file's, not drawn by eye. Nothing is computed beyond the scaling.
 *   node chart-paths.mjs results-figures-S116.txt [results-extra-S116.txt]
 *
 * What you could spend: each year's level held for the year (a step), the 10th to 90th and 25th to 75th percentile bands, and
 * (with extra.mjs's file) the typical run's levels as the line and the headline's back year as a mark (LAYOUT.md, L12); the
 * median of each year is printed beside them but not drawn. The y axis runs from 70% to 115% of the target. What you would have: the money's bands and median joined year to
 * year, and your current approach's median, on a y axis from 0 to the scale printed; above it the bands are clipped.
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('chart-paths: name a results file');
const txt = readFileSync(file, 'utf8');
const json = tag => { const m = txt.match(new RegExp(`^${tag} all: (\\[.*\\])$`, 'm')); if (!m) throw new Error(`chart-paths: no "${tag} all" line`); return JSON.parse(m[1]); };
const spend = json('spend solved'), fan = json('fan solved'), yours = json('fan yours');
const extra = process.argv[3] ? readFileSync(process.argv[3], 'utf8') : null;
const typical = extra ? JSON.parse((extra.match(/^typical run levels: (\[.*\])$/m) || [])[1] || 'null') : null;
if (extra && !typical) throw new Error('chart-paths: no "typical run levels" line in the extra file');
const backYear = Number((txt.match(/^headline \(all \d+\): .*"backYear":(\d+)/m) || [])[1]);
const baseYear = Number((txt.match(/^ahead: (\d{4}) \(age (\d+)\)/m) || [])[1]), baseAge = Number((txt.match(/^ahead: (\d{4}) \(age (\d+)\)/m) || [])[2]);
const raise = (txt.match(/^raise \(all \d+\): If markets do well, you could spend up to (\d+)% above your target from about age (\d+)\.$/m) || []).slice(1).map(Number);
const r1 = v => Math.round(v * 10) / 10;
const niceUp = v => { const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };

function frame(w, h, pad) {
  return { w, h, l: pad.l, r: w - pad.r, t: pad.t, b: h - pad.b };
}
function spendPaths(F) {
  const a0 = spend[0][0], a1 = spend[spend.length - 1][0] + 1, lo = 70, hi = 115;
  const X = a => r1(F.l + ((a - a0) / (a1 - a0)) * (F.r - F.l)), Y = v => r1(F.b - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (F.b - F.t));
  const step = col => spend.map((row, i) => `${i ? `V${Y(row[col])}` : `M${X(row[0])} ${Y(row[col])}`}H${X(row[0] + 1)}`).join('');
  const band = (top, bot) => `${step(top)}V${Y(spend[spend.length - 1][bot])}${[...spend].reverse().map((row, i, rs) => `H${X(row[0])}${i < rs.length - 1 ? `V${Y(rs[i + 1][bot])}` : ''}`).join('')}Z`;
  const out = {
    band90: band(5, 1), band75: band(4, 2), median: step(3),
    target: `M${F.l} ${Y(100)}H${F.r}`, floor: `M${F.l} ${Y(80)}H${F.r}`,
    yTicks: [80, 90, 100, 110].map(v => `${v}%@${Y(v)}`).join(' '),
    xTicks: spend.map(r => r[0]).filter(a => a === a0 || a % 5 === 0).map(a => `${a}@${X(a)}`).join(' ')
  };
  if (typical) {
    const rows = typical.filter(([a]) => a >= a0);
    out.typical = rows.map(([a, v], i) => `${i ? `V${Y(v)}` : `M${X(a)} ${Y(v)}`}H${X(a + 1)}`).join('');
  }
  if (Number.isFinite(backYear) && Number.isFinite(baseYear)) {
    const age = baseAge + (backYear - baseYear);
    out.back = `${backYear} = age ${age}: x ${X(age)}`;
  }
  if (raise.length) {
    const row = spend.find(r => r[0] === raise[1]);
    if (row) out.raise = `age ${raise[1]} at the 75th percentile ${row[4]}%: x ${X(raise[1])} to ${X(raise[1] + 1)}, y ${Y(row[4])}`;
  }
  return out;
}
function wealthPaths(F) {
  const a0 = fan[0][0], a1 = fan[fan.length - 1][0];
  // the scale: the 75th percentile's highest over the plan, rounded up, so the middle of the fan fills the chart
  const top = niceUp(Math.max(...fan.map(r => r[4])) * 1.05);
  const X = a => r1(F.l + ((a - a0) / (a1 - a0)) * (F.r - F.l)), Y = v => r1(F.b - (Math.min(v, top * 1.04) / top) * (F.b - F.t));
  const line = (rows, col) => rows.map((r, i) => `${i ? 'L' : 'M'}${X(r[0])} ${Y(r[col])}`).join('');
  const band = (hiCol, loCol) => `${line(fan, hiCol)}${[...fan].reverse().map(r => `L${X(r[0])} ${Y(r[loCol])}`).join('')}Z`;
  const k = top / 4;
  return {
    scale: `0 to ${top} (the 75th percentile's highest, ${Math.round(Math.max(...fan.map(r => r[4])))}, times 1.05, rounded up)`,
    band90: band(5, 1), band75: band(4, 2), median: line(fan, 3), yours: line(yours, 3),
    yTicks: [0, 1, 2, 3, 4].map(i => `${i * k}@${Y(i * k)}`).join(' '),
    xTicks: fan.map(r => r[0]).filter(a => a === a0 || a % 5 === 0).map(a => `${a}@${X(a)}`).join(' ')
  };
}
console.log(`# node chart-paths.mjs ${file.split('/').pop()}: the outlook's two charts as SVG paths (LAYOUT.md section 3.1)`);
for (const [size, F] of [['desktop', frame(560, 220, { l: 44, r: 12, t: 12, b: 28 })], ['phone', frame(350, 200, { l: 38, r: 8, t: 10, b: 26 })]]) {
  for (const [name, p] of [['spend', spendPaths(F)], ['wealth', wealthPaths(F)]]) {
    for (const [k, v] of Object.entries(p)) console.log(`${size} ${name} ${k}: ${v}`);
  }
}
