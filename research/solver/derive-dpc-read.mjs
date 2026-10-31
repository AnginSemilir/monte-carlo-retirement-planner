// DPC's reading against its registered description (predictions/measure-dpc.md), from results-dpc.txt alone: the panel's
// near-cliff ratios, the plateau paths' pension share pooled over the panel (weighted by plateau paths), how many
// households carry plateau paths with a pension share of a half or more, and how many households and arms have a
// State Pension drop in the band at all.
//   node research/solver/derive-dpc-read.mjs > research/solver/results-dpc-read.txt
import { readFileSync } from 'node:fs';
const t = readFileSync(new URL('./results-dpc.txt', import.meta.url), 'utf8').split('\n');
const ROW = /^\s{2}(\S.{0,14}?)?\s+(SNAP|PCLSI|SHIFT)\s+\|\s+(\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s+\|\s+(\S+)\s+\(\s*(\d+)\)\s+(\S+)\s+\|\s+(\d+)\s+(\S+)\s+(\S+)\s+\|\s+(\d+)\s+(\S+)\s+(\S+)\s*$/;
let id = null; const rows = [];
for (const l of t) { const m = ROW.exec(l); if (!m) continue; if (m[1] && m[1].trim()) id = m[1].trim(); rows.push({ id, arm: m[2], plat: +m[10], ps: m[12] === '-' ? NaN : +m[12], band: m[15] }); }
if (rows.length !== 75) { console.error(`derive-dpc-read: ${rows.length} rows, not 75`); process.exit(1); }
const tot = Object.fromEntries([...t.join('\n').matchAll(/^TOTALS (\w+): near (\S+)/gm)].map(m => [m[1], +m[2]]));
console.log(`near-cliff share: SNAP ${tot.SNAP}, PCLSI ${tot.PCLSI}, SHIFT ${tot.SHIFT}; SNAP over PCLSI ${(tot.SNAP / tot.PCLSI).toFixed(2)}; SHIFT over SNAP ${(tot.SHIFT / tot.SNAP).toFixed(2)}`);
for (const arm of ['SNAP', 'PCLSI', 'SHIFT']) {
  const R = rows.filter(r => r.arm === arm && r.plat > 0 && Number.isFinite(r.ps)), n = R.reduce((s, r) => s + r.plat, 0);
  const ps = R.reduce((s, r) => s + r.plat * r.ps, 0) / n, big = R.filter(r => r.ps >= 0.5).length;
  const band = rows.filter(r => r.arm === arm && r.band !== '-').length;
  console.log(`${arm}: plateau paths ${n} on ${R.length} households, their pension share pooled ${ps.toFixed(4)}; households with a plateau pension share of a half or more ${big}; households with a State Pension drop in the band ${band} of 25`);
}
