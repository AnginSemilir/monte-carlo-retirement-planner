// 7AL'S DERIVATION AND POWER (predictions/diag-7al.md): from the records each unit's solve is held to, the year-0 table
// error G (table less simulated survival, the mixture) and, for S194 under off, each world's (7aa's world lines); what
// hypothesis (1) - a calibrated bridge, the whole error after access - implies for the item's post-access optimism
// (about G over the share alive at access, which lies between the survival and 1); and the item's power: the smallest
// optimism a unit reads OPTIMISTIC at (the margin D plus z sd, z at Holm's first step over 7, one-sided 0.05/7), with n
// between 6,000 x survival and 6,000 paths alive at access, and the half-width of O66's pooled Clopper-Pearson interval.
//   node research/solver/derive-7al.mjs > research/solver/results-derive-7al.txt
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { zFor, clopperPearson } from './stats.mjs';

const HERE = new URL('.', import.meta.url).pathname, rd = f => readFileSync(join(HERE, f), 'utf8');
const D = 2, NW = 2000, K = 3, UNITS = 7;
const rows = [];
const take = (file, re, id, arm) => { const m = re.exec(rd(file)); if (!m) { console.error(`derive-7al: no line for ${id} ${arm} in ${file}`); process.exit(1); } rows.push({ id, arm, file, table: +m[1], sim: +m[2] }); };
take('results-7ah.txt', /^\s+S360\s+READER W0\.02\s+table (\S+) sim (\S+)/m, 'S360', 'READER');
take('results-7ah.txt', /^\s+S360\s+ORDER\s+W0\.02\s+table (\S+) sim (\S+)/m, 'S360', 'ORDER');
take('results-7ah.txt', /^\s+S370\s+READER W0\.02\s+table (\S+) sim (\S+)/m, 'S370', 'READER');
take('results-7ah.txt', /^\s+S370\s+ORDER\s+W0\.02\s+table (\S+) sim (\S+)/m, 'S370', 'ORDER');
take('results-7ag.txt', /^\s+S128 CAND\s+table (\S+) sim (\S+)/m, 'S128', 'READER');
take('results-7ag.txt', /^\s+S130 CAND\s+table (\S+) sim (\S+)/m, 'S130', 'READER');
take('results-7af.txt', /^\s+S194 SHIP\s+table (\S+) sim (\S+)/m, 'S194', 'OFF/PRODUCT');
// S194 OFF/TS+J/W0.02: 7aa's case file, its solve table, run sim and world lines
const dir = join(HERE, 'results', 'diag7aa'), worlds = [];
for (const f of readdirSync(dir).filter(x => /^case\d+\.txt$/.test(x))) {
  const t = readFileSync(join(dir, f), 'utf8');
  if (!/^S194\s+case \| unit OFF\/TS\+J\/W0\.02 /m.test(t)) continue;
  const tab = /solve OFF\/TS\+J\/W0\.02: table (\S+)/.exec(t), run = /run OFF\/TS\+J\/W0\.02: sim (\S+)/.exec(t);
  rows.push({ id: 'S194', arm: 'OFF', file: `results/diag7aa/${f}`, table: +tab[1], sim: +run[1] });
  for (const m of t.matchAll(/world OFF\/TS\+J\/W0\.02 (\d) z \S+ weight (\S+): table (\S+) sim (\S+) paths (\d+)/g)) worlds.push({ k: +m[1], w: +m[2], table: +m[3], sim: +m[4], paths: +m[5] });
}
if (rows.length !== 8 || worlds.length !== 3) { console.error(`derive-7al: ${rows.length} units, ${worlds.length} S194 world lines`); process.exit(1); }
const z = zFor(2 * 0.05 / UNITS);   // zFor takes a two-sided level: this is the one-sided 0.05/7
const sd = (q, n) => 100 * Math.sqrt(q * (1 - q) / n);
console.log(`7AL DERIVATION: the year-0 table error G by unit, hypothesis (1)'s post-access optimism, and the item's power (D ${D} points; z ${z.toFixed(3)}, one-sided 0.05/${UNITS}; ${NW} paths a world, ${K} worlds)`);
console.log('  unit            source                     table     sim       G      | (1): optimism G/alive  | smallest OPTIMISTIC (n 6000 x sim .. 6000)');
for (const r of rows) {
  const G = r.table - r.sim, s = r.sim / 100, nLo = K * NW * s, nHi = K * NW;
  // alive at access a in [s, 1]; survival among the alive q = s / a
  const md = a => D + z * sd(Math.min(0.999, s / a), K * NW * a);
  console.log(`  ${`${r.id} ${r.arm}`.padEnd(16)}${r.file.padEnd(27)}${r.table.toFixed(4).padStart(8)}  ${r.sim.toFixed(4).padStart(8)}  ${G.toFixed(2).padStart(6)}  | ${(G).toFixed(2).padStart(6)} to ${(G / s).toFixed(2).padStart(6)}        | ${md(1).toFixed(2)} (all alive) to ${md(s).toFixed(2)} (alive = survival; n ${Math.round(nLo)} to ${nHi})`);
}
console.log('  S194 OFF/TS+J by world (7aa, 1,000 paths a world):');
for (const w of worlds.sort((a, b) => a.k - b.k)) console.log(`    world ${w.k} weight ${w.w}: table ${w.table.toFixed(4)} sim ${w.sim.toFixed(4)} G ${(w.table - w.sim).toFixed(2)}`);
// O66's pool: S128, S130, S370 READER, S194 OFF; about 24,000 paths alive at access if all are
const o66 = rows.filter(r => ['S128 READER', 'S130 READER', 'S370 READER', 'S194 OFF'].includes(`${r.id} ${r.arm}`));
const qp = o66.reduce((t, r) => t + r.sim, 0) / o66.length / 100, np = o66.length * K * NW, [lo] = clopperPearson(Math.round(qp * np), np);
console.log(`  O66's pool: ${o66.length} units, ${np} paths if all are alive at access, mean survival ${(100 * qp).toFixed(2)}: its Clopper-Pearson lower end sits ${(100 * (qp - lo)).toFixed(2)} points under the point, so NO MATERIAL OPTIMISM (the lower end at c - ${D} or more) holds while the pooled optimism is under about ${(D - 100 * (qp - lo)).toFixed(2)} points`);
