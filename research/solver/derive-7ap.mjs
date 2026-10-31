/*
 * 7AP'S DERIVATION (predictions/diag-7ap.md; PLAN.md 7ap; O71). What the records say before any 7ap solve:
 *   1. The DEFAULT arm's after-stage figures, read from 7al's records (results/diag7al through reduce-7al.mjs's parse and
 *      its stamps): per unit its three worlds pooled (n paths alive at access, c their mean claim, s the survivors), the
 *      point c - 100 s/n, and h, half of it - item 1's threshold.
 *   2. The power of each item on those n and c: for a PCLSI arm that leaves a share f of the DEFAULT's optimism (0, a
 *      quarter, a half, three quarters, all of it), at the expected survivor count, the read items 1 and 2 give; the
 *      smallest share of the optimism left that item 1 still reads HALVED and the largest it reads NOT HALVED.
 *   3. The time: 7al's measured solve and node seconds on the three DEFAULT units (their case files); the PCLSI units at
 *      the same cost and at twice it (the interpolated read touches up to twice the corners: NOT CHECKED which), on four
 *      cores in two waves.
 * No solve. Output hashed on the prediction's derive: line.
 *   node research/solver/derive-7ap.mjs > research/solver/results-derive-7ap.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as AL from './reduce-7al.mjs';
import { afterOf, item1, calib, CROSSING, CONTROL, D } from './reduce-7ap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diag7al');
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
requireFairLogs(logs, AL.PRED);
const units = Object.values(logs).flatMap(AL.parse), L = 'TS+J/W0.02';
const get = (id, a) => { const u = units.find(x => x.id === id && x.arm === a && x.label === L && x.done); if (!u) { console.error(`derive-7ap: no ${id} ${a}/${L} in 7al's records`); process.exit(1); } return u; };
const f2 = x => x.toFixed(2), f4 = x => x.toFixed(4);
console.log("7AP'S DERIVATION (7al's records, results/diag7al, read through reduce-7al.mjs's parse; stamps checked)");
console.log('1. the DEFAULT arm after access, three worlds pooled: n, claim c, survived, the point c - survived, h = half of it');
const def = {};
for (const id of [...CROSSING, CONTROL]) {
  const a = id === CONTROL ? 'OFF' : 'READER', x = afterOf(get(id, a));
  def[id] = x;
  console.log(`   ${id} ${a.padEnd(6)} n ${x.n}  c ${f4(x.c)}  survived ${f4(100 * x.s / x.n)}  point ${f4(x.pt)}  h ${f4(x.pt / 2)}`);
}
console.log(`2. the power: a PCLSI arm leaving a share f of each crossing unit's optimism (the same n and c, the expected survivors), items 1 and 2 as registered (margin ${D} points)`);
const at = (x, f) => ({ n: x.n, c: x.c, s: Math.round(x.n * (x.c - f * x.pt) / 100) });
for (const f of [0, 0.25, 0.5, 0.75, 1]) {
  const I1 = item1(CROSSING.map(id => ({ id, def: def[id], pcl: at(def[id], f) })));
  const I2 = calib(CROSSING.map(id => ({ id, ...at(def[id], f) })));
  console.log(`   f ${f.toFixed(2)}: item 1 ${I1.units.map(u => `${u.id} ${u.read}`).join(', ')} -> ${I1.outcome}; item 2 ${I2.map(u => `${u.id} ${u.read}`).join(', ')}`);
}
for (const id of CROSSING) {
  let hMax = null, nhMin = null;
  for (let q = 0; q <= 100; q++) {
    const f = q / 100, u = item1([{ id, def: def[id], pcl: at(def[id], f) }, { id: 'other', def: def[id], pcl: at(def[id], 0) }]).units[0];
    if (u.read === 'HALVED') hMax = f;
    if (u.read === 'NOT HALVED' && nhMin === null) nhMin = f;
  }
  console.log(`   ${id}: HALVED up to f ${hMax === null ? '-' : f2(hMax)} of the optimism left, NOT HALVED from f ${nhMin === null ? '-' : f2(nhMin)} (beside a unit fully cured, Holm over 2); between, INCONCLUSIVE`);
}
console.log("3. the time: 7al's measured seconds on the DEFAULT units (the solve and the three worlds' node runs)");
let tot = 0; const per = [];
for (const id of [...CROSSING, CONTROL]) {
  const a = id === CONTROL ? 'OFF' : 'READER', f = Object.entries(logs).find(([, t]) => AL.parse(t).some(u => u.id === id && u.arm === a && u.label === L));
  const t = f[1], solve = +new RegExp(`solve ${a}/TS\\+J/W0\\.02: table \\S+ secs (\\d+)`).exec(t)[1];
  const nodes = [...t.matchAll(new RegExp(`node ${a}/TS\\+J/W0\\.02 world \\d z \\S+: sim \\S+ paths \\d+ secs (\\d+)`, 'g'))].map(m => +m[1]);
  const s = solve + nodes.reduce((x, y) => x + y, 0); tot += s; per.push(s);
  console.log(`   ${id} ${a.padEnd(6)} (${f[0]}): solve ${solve} s, nodes ${nodes.join(' + ')} s, ${s} s`);
}
const waves = xs => { const sorted = [...xs].sort((a, b) => b - a), cores = [0, 0, 0, 0]; for (const x of sorted) { cores.sort((a, b) => a - b); cores[0] += x; } return Math.max(...cores); };
for (const k of [1, 2]) {
  const all = [...per, ...per.map(x => k * x)];
  console.log(`   PCLSI at ${k} x the DEFAULT's cost: ${all.reduce((x, y) => x + y, 0)} core-seconds, ${(all.reduce((x, y) => x + y, 0) / 3600).toFixed(2)} core-hours; on four cores (longest first) ${(waves(all) / 3600).toFixed(2)} hours`);
}
console.log(`   the DEFAULT units alone: ${tot} core-seconds, ${(tot / 3600).toFixed(2)} core-hours`);
