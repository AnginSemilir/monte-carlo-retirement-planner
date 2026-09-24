/*
 * REDUCER FOR M14c (predictions/m14c-bets.md): does the solver's table misjudge the bets? Reads results/m14c/<id>.bets.json
 * (bet-audit.mjs) behind the fair-test gate against M14b's arm with the tier above, whose solve each household must have
 * reproduced path for path (the file's `reproduced`; any difference and the household is refused). The M14c files carry
 * newer code than m14b-up's (row 28): the reproduction check is what makes that difference harmless, so the gate is run
 * with row 28 accepted for that reason:
 *
 *   FAIR_ACCEPT="28=M14c's solve reproduced m14b-up's record path for path, survival and every year's tier and level (bet-audit.mjs checks it before reporting)" node research/solver/reduce-m14c.mjs
 *
 * Per household: the bet minus staying in simulated survival, pooled over positions (se: root sum of squares over the
 * count); the table's margins; the estate on paths both survive. Then pooled over all four, by how often staying
 * survives from the position (item 4), and each item of the prediction read against it.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFair } from './fair-gate.mjs';

const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const TAG = process.env.TAG || 'm14c';
const LOST = ['S194', 'S162', 'S252'], CONTROL = 'S330';
requireFair([['m14b-up', TAG, { tested: [] }]]);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const sg = x => (x >= 0 ? '+' : '') + f(x);
const pool = rows => {
  const n = rows.length; if (!n) return { n, mean: NaN, se: NaN };
  const mean = rows.reduce((a, x) => a + (x.survBet - x.survStay), 0) / n;
  const se = Math.sqrt(rows.reduce((a, x) => a + x.se * x.se, 0)) / n;
  return { n, mean, se };
};
const files = {};
for (const id of [...LOST, CONTROL]) {
  const p = join(R, TAG, `${id}.bets.json`);
  if (!existsSync(p)) { console.log(`  ${id}: no bets file - not reported`); continue; }
  const o = JSON.parse(readFileSync(p, 'utf8'));
  if (o.reproduced.pathDiff || o.reproduced.tierDiff) { console.log(`  ${id}: REFUSED - its solve did not reproduce m14b-up (${o.reproduced.pathDiff} paths, ${o.reproduced.tierDiff} path-years)`); continue; }
  files[id] = o;
}
console.log(`M14c - the bet against the table's best move without it, simulated from each first-bet position (tag ${TAG})`);
console.log('  id     paths bet  positions x paths | bet - stay, survival points (pooled +/- se)   z | margins under 0.005 | table ranks the bet first | estate, bet vs stay (paths both survive)');
const all = [];
for (const [id, o] of Object.entries(files)) {
  const P = pool(o.rows); all.push(...o.rows.map(x => ({ ...x, id })));
  const small = o.rows.filter(x => x.margin !== null && x.margin < 0.005).length;
  const first = o.rows.filter(x => x.tableBetFirst).length;
  const est = o.rows.filter(x => x.estateBet && x.estateStay);
  const estChg = est.length ? est.reduce((a, x) => a + (x.estateBet / x.estateStay - 1), 0) / est.length : NaN;
  console.log(`  ${id}   ${String(o.betPaths).padStart(4)}       ${String(o.positions).padStart(3)} x ${o.paths}        | ${sg(P.mean)} +/- ${f(P.se)}  ${f(P.mean / P.se, 1).padStart(5)} | ${small}/${o.positions} | ${first}/${o.positions} | ${sg(100 * estChg)}%`);
}
console.log('\n  pooled over every position, by how often STAYING survives from it (item 4):');
for (const [lab, lo, hi] of [['staying survives under 50%', -1, 50], ['50% to 90%', 50, 90], ['90% or more', 90, 101]]) {
  const P = pool(all.filter(x => x.survStay >= lo && x.survStay < hi));
  console.log(`    ${lab.padEnd(28)} ${String(P.n).padStart(3)} positions   bet - stay ${sg(P.mean)} +/- ${f(P.se)}`);
}
console.log('\nPREDICTION CHECK (predictions/m14c-bets.md)');
const lostP = LOST.filter(id => files[id]).map(id => [id, pool(files[id].rows)]);
const beyond = lostP.filter(([, P]) => P.mean < -2 * P.se).length;
console.log(`  1. staying better beyond two se on at least two of S194 S162 S252: ${beyond} of ${lostP.length} -> ${beyond >= 2 ? 'HELD' : 'MISSED'}`);
const three = pool(all.filter(x => LOST.includes(x.id)));
console.log(`     FALSIFIER - the three pooled: bet - stay ${sg(three.mean)} +/- ${f(three.se)}: ${three.mean > -2 * three.se ? 'FALSIFIED (betting at least as good, within two se)' : 'not fired'}`);
if (files[CONTROL]) {
  const C = pool(files[CONTROL].rows);
  console.log(`  2. the control S330, betting better beyond two se: ${sg(C.mean)} +/- ${f(C.se)} -> ${C.mean > 2 * C.se ? 'HELD' : 'MISSED'}${C.mean < -2 * C.se ? ' - THE TEST IS VOID (the rollout leans against betting)' : ''}`);
}
const withM = all.filter(x => x.margin !== null), small = withM.filter(x => x.margin < 0.005).length;
console.log(`  3. margins under 0.005 at three quarters of positions or more: ${small} of ${withM.length} -> ${small >= 0.75 * withM.length ? 'HELD' : 'MISSED'}`);
const hiB = pool(all.filter(x => x.survStay >= 90)), loB = pool(all.filter(x => x.survStay < 50));
console.log(`  4. bet worse where staying survives 90%+ (${sg(hiB.mean)}) and better under 50% (${sg(loB.mean)}) -> ${hiB.mean < 0 && loB.mean > 0 ? 'HELD' : 'MISSED'}`);
