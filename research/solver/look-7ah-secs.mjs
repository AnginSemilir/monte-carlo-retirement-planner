// 7ah's solve times, ORDER against READER, from the case files (results/diag7ah/case*.txt).
// Reported, not registered: the 24 solves ran four at a time in one batch, so the load was shared but not
// controlled (grade C). Gate 5 asks what the order-drawn reference adds to a bundle solve.
// Usage: node research/solver/look-7ah-secs.mjs [dir]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || new URL('./results/diag7ah/', import.meta.url).pathname;
const files = readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f));
if (!files.length) { console.error(`no case files in ${dir}`); process.exit(1); }
const secs = {};   // household -> weight -> arm -> seconds
for (const f of files) {
  let unit = null;
  for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    const u = /^(\S.*?)\s+case \| unit/.exec(line);
    if (u) unit = u[1].trim();
    const s = /solve (ORDER|READER)\/TS\+J\/(W[\d.]+): table [\d.]+ secs (\d+)/.exec(line);
    if (s && unit) (((secs[unit] ??= {})[s[2]] ??= {})[s[1]] = Number(s[3]));
  }
}
let tr = 0, to = 0, n = 0;
console.log('7AH SOLVE TIMES, ORDER AGAINST READER (seconds; one batch, four at a time; grade C)');
for (const h of Object.keys(secs).sort()) for (const w of Object.keys(secs[h]).sort()) {
  const { READER: r, ORDER: o } = secs[h][w];
  if (r == null || o == null) { console.error(`missing arm: ${h} ${w}`); process.exit(1); }
  tr += r; to += o; n++;
  console.log(`  ${h.padEnd(14)} ${w}  READER ${r}  ORDER ${o}  ratio ${(o / r).toFixed(3)}`);
}
if (n !== 12) { console.error(`expected 12 unit pairs, found ${n}`); process.exit(1); }
console.log(`TOTAL: READER ${tr} s, ORDER ${to} s, ratio ${(to / tr).toFixed(3)} over ${n} pairs`);
