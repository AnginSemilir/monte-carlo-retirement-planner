/*
 * 7AV'S DERIVATION FROM THE RECORDS (predictions/diag-7av.md; derive first, run to falsify): what 7at's gated records already
 * say about each item at 6 share points, the power at the effects the deep review's causes predict, and the time. Reads
 * results/diag7at (reduce-7at.mjs's parse) through its stamps. The step years are the deep review's (deep-review-log.md
 * 4 Oct 03:18 UK; reader.js referenceChance l.56: the last bill before access, and a step before an inflow): S130 plan year 0,
 * S370 plan years 2 and 6 (the read at t is of year t + 1's table); the run classes every read by its own table
 * (extrap-7av.mjs isStep), so this split is the derivation's input, not the run's.
 *   1. The levels at 6 points (world 0, per path over the bridge, from the bdec and dec lines by year): the step reads' flat
 *      term F6 and straight-line term L6 under PCLSI and DEFAULT, and the spread reads' flat term P6; the straight line at
 *      step reads' share of the whole rise (the review's 0.73 and 0.64).
 *   2. The per-path spread: the bridge-stage read term's sd (pstage) and read (b)'s (pbstage), the items' noise bound (the
 *      step part's own sd is NOT CHECKED: on S130 the bridge read term is almost all its one step read, on S370 it mixes).
 *   3. The power, z for each item's HELD and FALSIFIED sides at the causes' predicted effects, the noise of each difference
 *      taken unpaired (no gain from pairing: a lower bound).
 *   4. The time: 7at's units as measured; a 12-point solve taken as 4 times the 6-point one (the cells, 30 x 12 x 12 against
 *      30 x 6 x 6; NOT CHECKED) and its forward runs as 1.5 times (more tables per read; NOT CHECKED); the quadratic's reads
 *      on step tables only.
 *   node research/solver/derive-7av.mjs > research/solver/results-derive-7av.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as AT from './reduce-7at.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logsOf = d => Object.fromEntries(readdirSync(join(HERE, 'results', d)).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(HERE, 'results', d, f), 'utf8')]));
const LT = logsOf('diag7at');
requireFairLogs(LT, AT.PRED);
const at = Object.values(LT).flatMap(AT.parse);
const get = (id, x) => at.find(u => u.id === id && u.arm === 'READER' && u.label === AT.labelOf('TS+J', x));
const STEP = { S130: [0], S370: [2, 6] }, N = 2000, W0 = 0;
const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length, sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (xs.length - 1)); };
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
console.log('7AV: THE DERIVATION FROM THE RECORDS (7at: results/diag7at, through its stamps)');

const lv = {};
console.log('\n1. THE LEVELS AT 6 SHARE POINTS (world 0, points a path over the bridge; step years the deep review\'s):');
for (const id of ['S130', 'S370']) for (const x of ['DEFAULT', 'PCLSI']) {
  const u = get(id, x), A = u.access.year, dec = u.dec.filter(y => y.k === W0), bd = u.bdec.filter(y => y.k === W0);
  let F = 0, L = 0, P = 0, PL = 0;
  for (let t = 0; t < A; t++) {
    const d = dec.find(y => y.t === t), b = bd.find(y => y.t === t);
    if (!b || !b.reads) continue;
    if (STEP[id].includes(t)) { F += d.d * d.n; L += b.db * b.reads; } else { P += d.d * d.n; PL += b.db * b.reads; }
  }
  lv[`${id} ${x}`] = { F: F / N, L: L / N, P: P / N, PL: PL / N };
  console.log(`   ${id} ${x.padEnd(7)}: step flat F6 ${f4(F / N)} straight line L6 ${f4(L / N)} | spread flat P6 ${f4(P / N)} straight line ${f4(PL / N)} | step years ${STEP[id].join(', ')} of the bridge years 0 to ${A - 1}`);
}
for (const id of ['S130', 'S370']) {
  const p = lv[`${id} PCLSI`], d = lv[`${id} DEFAULT`];
  const R = (p.F + p.P) - (d.F + d.P), Ls = (p.L + p.P) - (d.L + d.P);
  console.log(`   ${id}: the rise (PCLSI less DEFAULT, step and spread flat; the years with no reader excluded) ${f4(R)}, under the straight line at step reads ${f4(Ls)}, the share taken away ${f2((R - Ls) / R)} (the review's: S370 0.73, S130 0.64)`);
}

console.log('\n2. THE PER-PATH SPREAD (world 0, PCLSI, the bridge stage):');
const sds = {};
for (const id of ['S130', 'S370']) {
  const u = get(id, 'PCLSI'), d = u.pstage.find(p => p.k === W0).paths.map(p => p[1]), bb = u.pbstage.find(p => p.k === W0).paths;
  sds[id] = { d: sd(d), b: sd(bb) };
  console.log(`   ${id}: the read term's sd ${f2(sd(d))} (mean ${f4(mean(d))}), read (b)'s sd ${f2(sd(bb))} (mean ${f4(mean(bb))}) over ${d.length} paths`);
}

console.log('\n3. THE POWER (z of each side at the effect a cause predicts; unpaired noise, a lower bound; z above 2.5 reads at the Holm-adjusted 0.05 with room):');
const z = (m, s) => m * Math.sqrt(N) / s;
for (const id of ['S130', 'S370']) {
  const p = lv[`${id} PCLSI`], s = sds[id].d, sb = sds[id].b;
  console.log(`   ${id} item 1: F6 ${f4(p.F)}; cause 1 (F12 = F6/2): the HELD side mean(0.6 F6 - F12) = ${f4(0.1 * p.F)}, z ${f2(z(0.1 * p.F, s * Math.sqrt(0.36 + 0.25)))}; at F12 = F6/4: z ${f2(z(0.35 * p.F, s * Math.sqrt(0.36 + 0.0625)))}; cause 3 (F12 = F6): the FALSIFIED side mean(F12 - 0.9 F6) = ${f4(0.1 * p.F)}, z ${f2(z(0.1 * p.F, s * Math.sqrt(1 + 0.81)))}`);
  console.log(`   ${id} item 2: L6 ${f4(p.L)}; cause 2 (Q6 = 0): the HELD sides mean(L6/3 - Q6) = mean(Q6 + L6/3) = ${f4(p.L / 3)}, z ${f2(z(p.L / 3, sb * Math.sqrt(1 / 9 + 1)))}; not cause 2 (Q6 = L6): the FALSIFIED side mean(Q6 - 2 L6/3) = ${f4(p.L / 3)}, z ${f2(z(p.L / 3, sb * Math.sqrt(1 + 4 / 9)))}`);
  console.log(`   ${id} item 4: the bar 0.5; a read at 0 with the noise of read (b): the TOST sides' z ${f2(z(0.5, sb))}; a read at 1.4 (the review's straight line left at 6): the OVER side's z ${f2(z(0.9, sb))}`);
}
{ const p = lv['S370 PCLSI'], s = sds.S370.d;
  console.log(`   S370 item 3: P6 ${f4(p.P)}; O36 the cause (O6 = 0): the HELD side mean(O6 - P6/2) = ${f4(-p.P / 2)}, z ${f2(z(-p.P / 2, s * Math.sqrt(1 + 0.25)))}; not (O6 = P6): the FALSIFIED side mean(0.75 P6 - O6) = ${f4(-0.25 * p.P)}, z ${f2(z(-0.25 * p.P, s * Math.sqrt(0.5625 + 1)))}`); }

console.log('\n4. THE TIME (seconds a unit, the solve plus the three node runs; 7at\'s as measured, scaled as stated):');
{
  const timeOf = (id, x) => { const t = Object.values(LT).find(t_ => new RegExp(`^${id}\\s+case \\| unit READER/${AT.labelOf('TS+J', x).replace(/[/+.]/g, m => `\\${m}`)} \\|`, 'm').test(t_)); const L = AT.labelOf('TS+J', x).replace(/[/+.]/g, m => `\\${m}`); return { solve: Number(new RegExp(`solve READER/${L}: table \\S+ secs (\\d+)`).exec(t)[1]), nodes: [...t.matchAll(new RegExp(`node READER/${L} world \\d z \\S+: sim \\S+ paths \\d+ secs (\\d+)`, 'g'))].reduce((a, m) => a + Number(m[1]), 0) }; };
  const units = [];
  for (const id of ['S370', 'S130']) { const d = timeOf(id, 'DEFAULT'), p = timeOf(id, 'PCLSI'); units.push([`${id} PCLSI S12`, 4 * p.solve + 1.5 * p.nodes], [`${id} DEFAULT S6`, d.solve + d.nodes], [`${id} PCLSI S6`, p.solve + p.nodes]); if (id === 'S370') units.push(['S370 ORDER PCLSI S6', p.solve + p.nodes]); }
  for (const [nm, s] of units) console.log(`   ${nm}: ${Math.round(s)}`);
  const tot = units.reduce((t, [, s]) => t + s, 0), cores = [0, 0, 0, 0];
  for (const s of units.map(x => x[1]).sort((a, b) => b - a)) { cores.sort((a, b) => a - b); cores[0] += s; }
  console.log(`   total ${Math.round(tot)} s = ${f2(tot / 3600)} core-hours; on four cores, longest first, about ${f2(Math.max(...cores) / 3600)} hours (ORDER's solve taken as PCLSI's; its own extra cost NOT CHECKED)`);
}
