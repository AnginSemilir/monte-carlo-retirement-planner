// PMAP's reading for COV's fork (items/COV.md, 'What decides between them'), from the PMAP logs alone (results/diagpmap; the
// reducer's gate passed on them, results-pmap.txt): per household, the step reads at a supported position (stepsup) and below
// their own edge (stepuns), pooled over worlds and years, by their own accessible money over the reader's threshold acc*
// (audit-pmap.mjs RB: under 0.5, 0.5 to 0.9, 0.9 to 1, 1 to 1.1, 1.1 to 1.5, 1.5 and over), and the share within 10% of 1
// (0.9 to 1.1: where A1's node at c = 1 would sit close to the reader's boundary); and every read of each household, world
// and year (the 'all' lines: step and spread reads together), the share within 10% and at 1.5 or over, and the reads below
// their own edge (the deep review after PMAP, deep-review-log.md 4 Oct 18:35 UK: the step panel's figures hide a slice).
//   node research/solver/derive-pmap-read.mjs > research/solver/results-derive-pmap-read.txt
import { readFileSync, readdirSync } from 'node:fs';
const D = new URL('./results/diagpmap/', import.meta.url), BINS = ['<0.5', '0.5-0.9', '0.9-1', '1-1.1', '1.1-1.5', '>=1.5'];
const tot = {}, years = [];
for (const f of readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort()) {
  let id = null;
  for (const l of readFileSync(new URL(f, D), 'utf8').split('\n')) {
    const c = /^(\S.*?)\s+case \| unit /.exec(l); if (c) { id = c[1].trim(); continue; }
    const y = /^\s+hist \S+ world (\d+) year (\d+) all: a [\d,]+ r ([\d,]+)$/.exec(l);
    if (y && id) { const r = y[3].split(',').map(Number), n = r.reduce((a, b) => a + b, 0); years.push(`  ${id.padEnd(10)} world ${y[1]} year ${y[2]}: ${r.join(' ')} | ${n} reads | within 10% ${(r[2] + r[3]) / n > 0 ? ((r[2] + r[3]) / n).toFixed(4) : '0.0000'} (${r[2] + r[3]}) | at 1.5 or over ${(r[5] / n).toFixed(4)} (${r[5]}) | below 0.9 ${r[0] + r[1]}`); continue; }
    const m = /^\s+hist \S+ world \d+ year \d+ (stepsup|stepuns): a [\d,]+ r ([\d,]+)$/.exec(l);
    if (!m || !id) continue;
    const r = m[2].split(',').map(Number);
    if (r.length !== BINS.length) { console.error(`derive-pmap-read: ${f}: ${r.length} bins, not ${BINS.length}`); process.exit(1); }
    const k = `${id} ${m[1]}`; tot[k] ||= Array(BINS.length).fill(0); r.forEach((x, i) => (tot[k][i] += x));
  }
}
if (!Object.keys(tot).length) { console.error('derive-pmap-read: no hist lines: a read of nothing is an error'); process.exit(1); }
console.log(`step reads by own accessible money over acc* (pooled over worlds and years): household kind | ${BINS.join(' ')} | reads | share in 0.9-1.1`);
const pool = { stepsup: Array(BINS.length).fill(0), stepuns: Array(BINS.length).fill(0) };
for (const [k, r] of Object.entries(tot)) {
  const n = r.reduce((a, b) => a + b, 0), kind = k.split(' ').pop(); r.forEach((x, i) => (pool[kind][i] += x));
  console.log(`  ${k.padEnd(22)} | ${r.join(' ')} | ${n} | ${((r[2] + r[3]) / n).toFixed(4)}`);
}
for (const [kind, r] of Object.entries(pool)) { const n = r.reduce((a, b) => a + b, 0); console.log(`PANEL ${kind}: ${r.join(' ')} | ${n} reads | share in 0.9-1.1 ${n ? ((r[2] + r[3]) / n).toFixed(4) : '-'} | share at 1.5 or over ${n ? (r[5] / n).toFixed(4) : '-'}`); }
console.log(`\nevery read (step and spread) by household, world and year: ${BINS.join(' ')}`);
for (const l of years) console.log(l);
