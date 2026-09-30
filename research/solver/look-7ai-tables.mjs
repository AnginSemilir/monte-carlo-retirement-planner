// 7ai's table change under the blend medians, pair by pair: each unit's solve table with the blend less its linear
// pair's (results/diag7ai/case*.txt, the solve lines). Reported, not an item (the plan-auditor's MINOR 3 of 30 Sep: the mean
// alone hides that two shipping-default pairs carry it).
//   node research/solver/look-7ai-tables.mjs [dir]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || new URL('./results/diag7ai/', import.meta.url).pathname;
const tab = {};
for (const f of readdirSync(dir).filter(x => /^case\d+\.txt$/.test(x))) {
  let id = null;
  for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    const c = /^(\S.*?)\s+case \| unit/.exec(line); if (c) id = c[1].trim();
    const s = /^\s+solve (\S+): table (\S+) secs/.exec(line); if (s && id) tab[`${id}|${s[1]}`] = +s[2];
  }
}
const rows = [];
for (const [k, v] of Object.entries(tab)) {
  if (!k.endsWith('@logblend')) continue;
  const lin = tab[k.replace('@logblend', '')];
  if (lin === undefined) { console.error(`no linear pair for ${k}`); process.exit(1); }
  rows.push([k.replace('@logblend', ''), v - lin]);
}
if (rows.length !== 14) { console.error(`expected 14 pairs, found ${rows.length}`); process.exit(1); }
rows.sort((a, b) => a[1] - b[1]);
console.log('7AI: THE TABLE WITH THE BLEND MEDIANS LESS THE LINEAR, BY PAIR (points; the solve lines)');
for (const [k, d] of rows) console.log(`  ${k.replace('|', '  ').padEnd(40)} ${d >= 0 ? '+' : ''}${d.toFixed(4)}`);
console.log(`MEAN ${(rows.reduce((t, r) => t + r[1], 0) / rows.length).toFixed(4)} over ${rows.length} pairs; up on ${rows.filter(r => r[1] > 0).length}`);
