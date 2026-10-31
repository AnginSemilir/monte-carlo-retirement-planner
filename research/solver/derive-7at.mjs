/*
 * 7AT'S DERIVATION FROM THE RECORDS (predictions/diag-7at.md; derive first, run to falsify): what 7ar's and 7ap's gated
 * records already say about each item, the thresholds, the power and the time. Reads results/diag7ar (reduce-7ar.mjs's
 * parse) and results/diag7ap (reduce-7ap.mjs's parse), each through its own stamps.
 *   1. Item 1 (the WALL arm calibrated after access): 7ap's PCLSI arms, three worlds pooled, by 7ap's two-sided rule - the
 *      point and the CP 95% interval against c +/- 2 - the nearest arm to WALL; the room each has inside the band.
 *   2. Item 2 (WALL against PCLSI after access, margin 1 point): the after-access point of DEFAULT and PCLSI on each
 *      household (7ap) - the size of a change the axis has made before; the per-path pairing of WALL against PCLSI is not in
 *      any record (NOT CHECKED), so the power is bounded both ways: paired with no outcome flips, the per-path sd of D is the
 *      claim's change alone; unpaired, it is the binomial outcome's.
 *   3. Item 3 (read (b) on S130): 7ar's world-0 per-path read-term rise Rd (pstage, PCLSI less DEFAULT): its mean and sd; z
 *      for the item's two directions at a share taken away of 1 and of 0, with X's noise at Rd's sd (no pairing gain).
 *   4. Item 4 (S370): 7ap's world-0 bridge stage (S370 has no decomposition in any record): the stage's rise only.
 *   5. The time: 7ar's S130 units (DEFAULT, PCLSI and the four-bucket PCLSF) and 7ap's S370 units (DEFAULT, PCLSI) as
 *      measured, the S370 WALL unit's solve by S130's four-bucket cost (PCLSF over PCLSI), the decomposition's reads
 *      already inside 7ar's node times; read (b)'s four extra stencil reads a bridge read NOT CHECKED (the preflight times
 *      them at 4 points).
 *   node research/solver/derive-7at.mjs > research/solver/results-derive-7at.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as AR from './reduce-7ar.mjs';
import * as AP from './reduce-7ap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logsOf = d => Object.fromEntries(readdirSync(join(HERE, 'results', d)).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(HERE, 'results', d, f), 'utf8')]));
const LR = logsOf('diag7ar'), LA = logsOf('diag7ap');
requireFairLogs(LR, AR.PRED); requireFairLogs(LA, AP.PRED);
const ar = Object.values(LR).flatMap(AR.parse), ap = Object.values(LA).flatMap(AP.parse);
const getR = x => ar.find(u => u.id === 'S130' && u.arm === 'READER' && u.label === AR.labelOf('TS+J', x));
const getP = (id, x) => ap.find(u => u.id === id && u.arm === 'READER' && u.label === AP.labelOf('TS+J', x));
const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length, sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (xs.length - 1)); };
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
console.log('7AT: THE DERIVATION FROM THE RECORDS (7ar: results/diag7ar; 7ap: results/diag7ap; each through its stamps)');

console.log('\n1. ITEM 1 - the nearest arm to WALL, 7ap\'s PCLSI, after access, three worlds pooled, by 7ap\'s two-sided rule (margin 2):');
for (const id of ['S370', 'S130']) {
  const [u] = AP.calib([{ id, ...AP.afterOf(getP(id, 'PCLSI')) }]), [d] = AP.calib([{ id, ...AP.afterOf(getP(id, 'DEFAULT')) }]);
  console.log(`   ${id} PCLSI: paths ${u.n} claim ${f4(u.c)} survived ${f4(100 * u.s / u.n)} point ${f4(u.pt)} CP ${f4(u.lo)} to ${f4(u.hi)} (band ${f4(u.c - 2)} to ${f4(u.c + 2)}; room ${f4(u.lo - (u.c - 2))} below, ${f4(u.c + 2 - u.hi)} above): ${u.read}; DEFAULT point ${f4(d.pt)} ${d.read}`);
  console.log(`   ${id}: the CP half-width ${f4((u.hi - u.lo) / 2)}, so CALIBRATED needs a point inside +/- ${f4(2 - (u.hi - u.lo) / 2)}`);
}

console.log('\n2. ITEM 2 - the after-access change an axis has made before (7ap, DEFAULT less PCLSI, three worlds pooled), and the bounds on D\'s per-path sd:');
for (const id of ['S370', 'S130']) {
  const [d] = AP.calib([{ id, ...AP.afterOf(getP(id, 'DEFAULT')) }]), [p] = AP.calib([{ id, ...AP.afterOf(getP(id, 'PCLSI')) }]);
  const q = p.s / p.n, sdUnp = 100 * Math.sqrt(2 * q * (1 - q));
  console.log(`   ${id}: DEFAULT ${f4(d.pt)} less PCLSI ${f4(p.pt)} = ${f4(d.pt - p.pt)} points; unpaired outcome sd per path ${f2(sdUnp)} (se over ${p.n} paths ${f4(sdUnp / Math.sqrt(p.n))}, the TOST at 1 point needs se under about ${f4(1 / 1.645)} with D at 0: ${sdUnp / Math.sqrt(p.n) < 1 / 1.645 ? 'met' : 'not met'} even unpaired); paired with no outcome flips the sd is the claims' change alone (NOT CHECKED)`);
}

console.log('\n3. ITEM 3 - 7ar\'s S130 world-0 read-term rise per path (pstage read term, PCLSI less DEFAULT):');
{
  const dD = getR('DEFAULT').pstage.find(p => p.k === 0).paths.map(p => p[1]), dP = getR('PCLSI').pstage.find(p => p.k === 0).paths.map(p => p[1]);
  const Rd = dP.map((x, j) => x - dD[j]), m = mean(Rd), s = sd(Rd), n = Rd.length, se = s / Math.sqrt(n);
  console.log(`   Rd mean ${f4(m)} sd ${f4(s)} over ${n} paths (se ${f4(se)}); the bands: two thirds ${f4(2 * m / 3)}, a third ${f4(m / 3)}`);
  console.log(`   at a share taken away of 1 (X = Rd): mean(X - 2Rd/3) = Rd/3, z ${f2((m / 3) / (s / 3 / Math.sqrt(n)))} with X exactly Rd; ${f2((m / 3) / (Math.sqrt((s / 3) ** 2 + s ** 2) / Math.sqrt(n)))} with X's own noise at Rd's sd`);
  console.log(`   at a share of 0 (X = 0): mean(Rd/3 - X) = Rd/3, z ${f2((m / 3) / (s / 3 / Math.sqrt(n)))}; a share near a band edge (a third or two thirds) reads INCONCLUSIVE`);
  const ys = getR('PCLSI').dec.filter(y => y.k === 0 && y.t < getR('PCLSI').access.year);
  console.log(`   the bridge years' reads (PCLSI, world 0): ${ys.map(y => `y${y.t} reads ${y.reads} unsup ${f2(y.unsup)} rowcopy ${f2(y.rowcopy)}`).join('; ')} - read (b) acts only where unsup > 0`);
}

console.log('\n4. ITEM 4 - S370 (no decomposition in any record): 7ap\'s world-0 bridge stage per path, DEFAULT and PCLSI:');
{
  const st = x => getP('S370', x).stage.find(s => s.k === 0 && s.stage === 'bridge');
  console.log(`   S370 bridge stage mean ${f4(st('DEFAULT').mean)} (sd ${f2(st('DEFAULT').sd)}) to ${f4(st('PCLSI').mean)} (sd ${f2(st('PCLSI').sd)}), the rise ${f4(st('PCLSI').mean - st('DEFAULT').mean)}; access at year ${getP('S370', 'PCLSI').access.year}; how much is the read term is NOT CHECKED (item 4's premise reads it)`);
}

console.log('\n5. THE TIME (seconds a unit: the solve plus the three node runs, as measured):');
{
  const timeOf = (logs, id, label) => {
    for (const t of Object.values(logs)) {
      if (!new RegExp(`^${id}\\s+case \\| unit READER/${label.replace(/[/+.]/g, m => `\\${m}`)} \\|`, 'm').test(t)) continue;
      const solve = Number(new RegExp(`solve READER/${label.replace(/[/+.]/g, m => `\\${m}`)}: table \\S+ secs (\\d+)`).exec(t)[1]);
      const nodes = [...t.matchAll(new RegExp(`node READER/${label.replace(/[/+.]/g, m => `\\${m}`)} world \\d z \\S+: sim \\S+ paths \\d+ secs (\\d+)`, 'g'))].map(m => Number(m[1]));
      return { solve, nodes: nodes.reduce((a, b) => a + b, 0) };
    }
    return null;
  };
  const r = { D: timeOf(LR, 'S130', AR.labelOf('TS+J')), P: timeOf(LR, 'S130', AR.labelOf('TS+J', 'PCLSI')), F: timeOf(LR, 'S130', AR.labelOf('TS+J', 'PCLSF')) };
  const p = { D: timeOf(LA, 'S370', AP.labelOf('TS+J', 'DEFAULT')), P: timeOf(LA, 'S370', AP.labelOf('TS+J', 'PCLSI')) };
  const k4 = r.F.solve / r.P.solve;
  const units = [['S370 DEFAULT', p.D.solve + p.D.nodes], ['S370 PCLSI', p.P.solve + p.P.nodes], ['S370 WALL', Math.round(p.P.solve * k4) + p.P.nodes], ['S130 DEFAULT', r.D.solve + r.D.nodes], ['S130 PCLSI', r.P.solve + r.P.nodes], ['S130 WALL', r.F.solve + r.F.nodes]];
  for (const [nm, s] of units) console.log(`   ${nm}: ${s}`);
  console.log(`   the four-bucket solve cost (7ar: PCLSF ${r.F.solve} s over PCLSI ${r.P.solve} s) ${f2(k4)}; S370's times are 7ap's (1 Oct host), S130's 7ar's (this host, four at once)`);
  const tot = units.reduce((t, [, s]) => t + s, 0), sorted = units.map(x => x[1]).sort((a, b) => b - a), cores = [0, 0, 0, 0];
  for (const s of sorted) { cores.sort((a, b) => a - b); cores[0] += s; }
  console.log(`   total ${tot} s = ${f2(tot / 3600)} core-hours; on four cores, longest first, about ${f2(Math.max(...cores) / 3600)} hours`);
}
