/* What the clairvoyant bound says about whether the fixed-policy approach is good enough. */
import fs from 'fs';
const DIR = process.argv[2] || new URL('./results/', import.meta.url).pathname;
const rows = [0, 1, 2, 3].flatMap(i => {
  for (const f of [`${DIR}/headroom-${i}.json`, `${DIR}/headroom-${i}.partial.json`]) if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f));
  return [];
});
if (!rows.length) { console.log('no headroom results yet'); process.exit(0); }
const pad = (s, n) => String(s).padEnd(n);
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const gains = rows.filter(r => r.gainPct !== null).map(r => r.gainPct).sort((a, b) => a - b);
const q = (p) => gains[Math.min(gains.length - 1, Math.floor(p * gains.length))];

console.log(`=== HEADROOM: per-year clairvoyant ordering vs the best FIXED order ===`);
console.log(`${rows.length} households.\n`);
console.log(`  median gain in terminal wealth   ${q(0.5).toFixed(2)}%`);
console.log(`  75th percentile                  ${q(0.75).toFixed(2)}%`);
console.log(`  90th percentile                  ${q(0.90).toFixed(2)}%`);
console.log(`  largest                          ${gains[gains.length - 1].toFixed(2)}%`);
console.log(`  households where a fixed order is already optimal: ${rows.filter(r => r.ordersUsed === 1).length} (${pct(rows.filter(r => r.ordersUsed === 1).length, rows.length)})`);
console.log(`  households where varying by year gains >1%:        ${gains.filter(g => g > 1).length} (${pct(gains.filter(g => g > 1).length, rows.length)})`);
console.log(`  households where it gains >5%:                     ${gains.filter(g => g > 5).length} (${pct(gains.filter(g => g > 5).length, rows.length)})`);
const rescued = rows.filter(r => !r.fixedSurvived && r.freeSurvived);
console.log(`  households a fixed order cannot save but per-year freedom can: ${rescued.length} (${pct(rescued.length, rows.length)})\n`);

for (const axis of ['stage', 'mix', 'wealth', 'spend', 'bequest']) {
  const vals = [...new Set(rows.map(r => r.tags[axis]))];
  console.log(`GAIN BY ${axis.toUpperCase()}`);
  for (const v of vals) {
    const sub = rows.filter(r => r.tags[axis] === v && r.gainPct !== null).map(r => r.gainPct).sort((a, b) => a - b);
    if (!sub.length) continue;
    console.log(`  ${pad(v, 15)} median ${pad(sub[Math.floor(sub.length / 2)].toFixed(2) + '%', 9)} 90th ${pad(sub[Math.floor(0.9 * sub.length)].toFixed(2) + '%', 9)} max ${sub[sub.length - 1].toFixed(2)}%`);
  }
  console.log('');
}

console.log('THE TEN HOUSEHOLDS WITH THE MOST TO GAIN FROM VARYING BY YEAR');
[...rows].filter(r => r.gainPct !== null).sort((a, b) => b.gainPct - a.gainPct).slice(0, 10).forEach(r =>
  console.log(`  ${pad(r.name, 42)} +${pad(r.gainPct.toFixed(1) + '%', 8)} £${Math.round(r.fixedTerminal).toLocaleString()} -> £${Math.round(r.freeTerminal).toLocaleString()}  (${r.ordersUsed} orders used across ${r.years} years)`));

console.log('\nWHICH FIXED ORDER IS THE BASELINE MOST OFTEN?');
const t = {}; rows.forEach(r => { t[r.fixedPolicyOrder] = (t[r.fixedPolicyOrder] || 0) + 1; });
Object.entries(t).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${pad(k, 46)} ${pad(v, 5)} ${pct(v, rows.length)}`));
