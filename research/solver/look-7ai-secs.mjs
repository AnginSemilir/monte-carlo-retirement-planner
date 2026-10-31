// 7ai's solve times and the two top-share tables (the plan-auditor's MINORs 2 and 3 of 30 Sep, after the deep review after
// 7ai): the bundle's (READER/TS+J) blend and reversed solves' seconds, their range and sum (7am's sizing), and S126's and
// share 0.90's bundle tables under each tier set (results/diag7ai/case*.txt, the solve lines). Reported, not an item.
//   node research/solver/look-7ai-secs.mjs [dir]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || new URL('./results/diag7ai/', import.meta.url).pathname;
const rows = [];
for (const f of readdirSync(dir).filter(x => /^case\d+\.txt$/.test(x))) {
  let id = null;
  for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    const c = /^(\S.*?)\s+case \| unit/.exec(line); if (c) id = c[1].trim();
    const s = /^\s+solve (\S+): table (\S+) secs (\d+)/.exec(line); if (s && id) rows.push({ id, unit: s[1], table: +s[2], secs: +s[3] });
  }
}
if (rows.length !== 42) { console.error(`expected 42 solves in ${dir}, found ${rows.length}`); process.exit(1); }
const shifted = rows.filter(r => r.unit.startsWith('READER/TS+J') && /@(logblend|reversed)$/.test(r.unit));
if (shifted.length !== 14) { console.error(`expected 14 shifted bundle solves, found ${shifted.length}`); process.exit(1); }
const s = shifted.map(r => r.secs);
console.log('7AI SOLVE TIMES AND THE TOP-SHARE TABLES');
console.log(`  the bundle's blend and reversed solves: ${s.length}, secs ${Math.min(...s)} to ${Math.max(...s)}, sum ${s.reduce((t, x) => t + x, 0)} (${(s.reduce((t, x) => t + x, 0) / 3600).toFixed(2)} core-hours)`);
for (const id of ['S126', 'share 0.90']) for (const set of ['', '@logblend', '@reversed']) {
  const r = rows.find(x => x.id === id && x.unit === `READER/TS+J/W0.02${set}`);
  console.log(`  ${id.padEnd(11)} READER/TS+J${(set || '@linear').padEnd(10)} table ${r.table.toFixed(4)}`);
}
