// 7ai's gap response split (the deep review after 7ai, 30 Sep 18:03 UK): for each pair, the sign-following part
// (blend - reversed) / 2 and the sign-blind part (blend + reversed) / 2 - linear, their ratio |blind| / |following|, the
// sign-blind part as a share of the linear gap, and the linear gap's distance to the margin 0.001 as a share of it.
// Read from results-7ai.txt's table (the reducer's own output). A gap printed '0' or '>1' is not a number: the pair is
// listed, not split. Reported, not an item.
//   node research/solver/look-7ai-split.mjs [results-7ai.txt]
import { readFileSync } from 'node:fs';

const f = process.argv[2] || new URL('./results-7ai.txt', import.meta.url).pathname;
const rows = [];
for (const line of readFileSync(f, 'utf8').split('\n')) {
  const m = /^\s+(\S.*?)\s{2,}(READER\/TS\+J|OFF\/PRODUCT)\s+\|\s+(\S+)\s.*?\|\s+(\S+)\s.*?\|\s+(\S+)\s/.exec(line);
  if (m) rows.push({ id: m[1].trim(), arm: m[2], l: +m[3], b: +m[4], r: +m[5] });
}
if (rows.length !== 14) { console.error(`expected 14 pairs in ${f}, found ${rows.length}`); process.exit(1); }
const MARGIN = 0.001;
console.log('7AI SPLIT: the gap response, sign-following (blend - reversed)/2 against sign-blind (blend + reversed)/2 - linear');
for (const arm of ['READER/TS+J', 'OFF/PRODUCT']) {
  console.log(`  ${arm}`);
  for (const x of rows.filter(y => y.arm === arm)) {
    if (![x.l, x.b, x.r].every(Number.isFinite)) { console.log(`    ${x.id.padEnd(12)} not split (a gap is not a number)`); continue; }
    const fol = (x.b - x.r) / 2, blind = (x.b + x.r) / 2 - x.l;
    console.log(`    ${x.id.padEnd(12)} following ${fol.toExponential(3)} blind ${blind.toExponential(3)} ratio ${(Math.abs(blind) / Math.abs(fol)).toFixed(2)} blind/gap ${(100 * Math.abs(blind) / x.l).toFixed(1)}% margin distance/gap ${(100 * Math.abs(x.l - MARGIN) / x.l).toFixed(1)}%`);
  }
}
