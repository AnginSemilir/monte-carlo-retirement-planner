/*
 * 7AQ'S DERIVATION (predictions/diag-7aq.md; PLAN.md 7aq). What the records say before any 7aq solve, read through their
 * stamps (7am's records, results/diag7am, through reduce-7am.mjs's parse; P's, results/diagP; 7ai's, results/diag7ai):
 *   1. P's full-step split where 7am split it (bridge 1, S126, S194, S162) and, where a gap was clipped at 0 (O74), the
 *      bound the clip gives: the clipped gap's true value is 0 or below, so C = (B + R)/2 - L is bounded on one side.
 *   2. Item 1's threshold in each household's own units: q <= 0.33 needs |C at half| <= 0.33 |C at full|.
 *   3. Item 2's: the bundle's half-step blind part (7am's halves; 7ai's linear), and the third and two thirds of it.
 *   4. What item 2 reads if P is smooth to second order (C at half = C at full / 4) where C at full is known: the
 *      prediction's question whether items 1 and 2 can both hold.
 *   5. The time: 7am's measured seconds on P's full-step units (case files), so the 20 solves' cost on four cores.
 * No solve. Output hashed on the prediction's derive: line.
 *   node research/solver/derive-7aq.mjs > research/solver/results-derive-7aq.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as A from './reduce-7aa.mjs';
import * as P from './reduce-P.mjs';
import * as I from './reduce-7ai.mjs';
import * as AM from './reduce-7am.mjs';
import { HOUSEHOLDS, UNSPLIT, FAMILIES, PTAG, BTAG, labelOf, Q_SMOOTH, UNDER, NOT_UNDER, UNITS } from './reduce-7aq.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logsOf = d => Object.fromEntries(readdirSync(join(HERE, 'results', d)).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(HERE, 'results', d, f), 'utf8')]));
const LM = logsOf('diag7am'), LP = logsOf('diagP'), LI = logsOf('diag7ai');
requireFairLogs(LM, AM.PRED); requireFairLogs(LP, P.PRED); requireFairLogs(LI, I.PRED);
const um = Object.values(LM).flatMap(AM.parse), jp = Object.values(LP).flatMap(P.parse), ui = Object.values(LI).flatMap(A.parse);
const mref = (id, l) => um.find(u => u.id === id && u.arm === 'READER' && u.label === l && u.done);
const pref = id => jp.find(x => x.kind === 'open' && x.id === id && x.arm === 'READER' && x.grid === '30x5' && x.w === '0.02' && x.done).tags.P;
const bref = (id, set) => ui.find(u => u.id === id && u.arm === 'READER' && u.label === I.labelOf('TS+J', set) && u.done);
const e = x => x.toExponential(4), num = AM.num;
console.log("7AQ'S DERIVATION (7am's, P's and 7ai's records through their stamps; no solve)");
console.log("1. P's full-step split (7am's gaps; L P's record): C = (B + R)/2 - L; a gap clipped at 0 (O74) is 0 or below, so C is bounded");
const Cf = {};
for (const id of HOUSEHOLDS) {
  const L = num(pref(id).gap.gap), gB = mref(id, labelOf(PTAG, 'logblend')).gap.gap, gR = mref(id, labelOf(PTAG, 'reversed')).gap.gap, B = num(gB), R = num(gR);
  if (B !== null && R !== null) { Cf[id] = (B + R) / 2 - L; console.log(`   ${id.padEnd(11)} L ${e(L)} B ${e(B)} R ${e(R)}: C ${e(Cf[id])}`); }
  else {
    const hi = ((B ?? 0) + (R ?? 0)) / 2 - L;
    console.log(`   ${id.padEnd(11)} L ${e(L)} B ${gB} R ${gR}: C at most ${e(hi)} (the clipped gap at 0); |C| ${hi < 0 ? `at least ${e(-hi)}` : 'unbounded'} - read by 7aq's re-solve (${UNSPLIT.includes(id) ? 'registered' : 'NOT registered'})`);
  }
}
console.log(`2. item 1: q <= ${Q_SMOOTH} needs |C at half| <= ${Q_SMOOTH} |C at full|`);
for (const id of HOUSEHOLDS) console.log(`   ${id.padEnd(11)} ${Cf[id] !== undefined ? `|C at half| <= ${e(Q_SMOOTH * Math.abs(Cf[id]))}` : 'after the re-solve'}`);
console.log(`3. item 2: the bundle's blind part at half the step (7ai's linear, 7am's halves) and its third (under) and two thirds (not under)`);
const Cbh = {};
for (const id of HOUSEHOLDS) {
  const L = num(bref(id, 'linear').gap.gap), hb = num(mref(id, labelOf(BTAG, 'halfblend')).gap.gap), hr = num(mref(id, labelOf(BTAG, 'halfreversed')).gap.gap);
  Cbh[id] = (hb + hr) / 2 - L;
  console.log(`   ${id.padEnd(11)} C ${e(Cbh[id])}: under at |C_P| <= ${e(UNDER * Math.abs(Cbh[id]))}, not under at >= ${e(NOT_UNDER * Math.abs(Cbh[id]))}`);
}
console.log('4. if P is smooth to second order (C at half = C at full / 4) where C at full is known, item 2 per household');
for (const id of HOUSEHOLDS) {
  if (Cf[id] === undefined) { console.log(`   ${id.padEnd(11)} unknown (C at full after the re-solve)`); continue; }
  const v = Math.abs(Cf[id] / 4) / Math.abs(Cbh[id]);
  console.log(`   ${id.padEnd(11)} |C at half| ${e(Math.abs(Cf[id] / 4))}, ${v.toFixed(2)} of the bundle's: ${v <= UNDER ? 'under' : v >= NOT_UNDER ? 'not under' : 'neither'}`);
}
console.log(`   the families (O73): ${FAMILIES.map(([n, ids]) => `${n}: ${ids.join(', ')}`).join('; ')}`);
console.log("5. the time: 7am's measured solve seconds on P's full-step units (a half unit taken at its household's mean)");
const secs = {};
for (const t of Object.values(LM)) for (const m of t.matchAll(/^(\S.*?)\s+case \| unit READER\/(TS\+J\/MP\/30x5\/W0\.02@\w+)[\s\S]*?solve READER\/\2: table \S+ secs (\d+)/gm)) (secs[m[1].trim()] ||= []).push(+m[3]);
let tot = 0; const per = [];
for (const [id, , l] of UNITS) { const xs = secs[id] || []; const s = xs.reduce((a, b) => a + b, 0) / xs.length; per.push(s); tot += s; }
for (const id of HOUSEHOLDS) console.log(`   ${id.padEnd(11)} ${(secs[id] || []).join(' + ')} s`);
const waves = xs => { const cores = [0, 0, 0, 0]; for (const x of [...xs].sort((a, b) => b - a)) { cores.sort((a, b) => a - b); cores[0] += x; } return Math.max(...cores); };
console.log(`   ${UNITS.length} units: ${Math.round(tot)} core-seconds, ${(tot / 3600).toFixed(2)} core-hours; on four cores (longest first) ${(waves(per) / 3600).toFixed(2)} hours`);
