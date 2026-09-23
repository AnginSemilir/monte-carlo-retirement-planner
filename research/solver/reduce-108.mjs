/*
 * TASK #108: THE REDUCER, WRITTEN BEFORE THE RESULTS EXISTED.
 *
 *   node research/solver/reduce-108.mjs
 *
 * THE PRE-REGISTERED RULE. The landing's job is to deliver the floor survival rate it promised, on
 * paths it has never seen. flex-tiers delivered that on all 22 genuine landings, every one of them
 * ABOVE its ask, because MARGIN=0.005 exists to absorb the winner's curse. So the question is how few
 * search paths that half-point margin can cover.
 *
 *   PASS at a path count when, on all eight households:
 *     (1) the held-out floor rate is AT OR ABOVE the ask - nobody misses their promise; and
 *     (2) the worst margin is no more than 0.3 points below 5,400's worst margin, so the sweep is
 *         not quietly trading the promise for speed just inside the pass line.
 *
 *   The RECOMMENDATION is the smallest passing count. If only 5,400 passes, 5,400 stands and the
 *   sweep has earned its cost by saying so - that is the outcome the plan named as a real
 *   possibility, not a failure.
 *
 * Condition 2 exists because condition 1 alone can be met while the margin collapses from +1.5 to
 * +0.05, which is a promise held by luck rather than by design and would fail on a different seed.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const HERE = '/home/user/vitejs-vite-kdvuf9qw/research/solver/results';
const COUNTS = [600, 1200, 2400, 5400];
const MARGIN_SLACK = 0.3;

const load = (n) => {
  const d = `${HERE}/sp-${n}`;
  if (!existsSync(d)) return {};
  const out = {};
  for (const f of readdirSync(d).filter(f => f.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(`${d}/${f}`, 'utf8'));
    out[j.id] = j;
  }
  return out;
};
const data = Object.fromEntries(COUNTS.map(n => [n, load(n)]));
console.log('TASK #108 - the landing against search-path count\n');
console.log('cells present: ' + COUNTS.map(n => `${n}: ${Object.keys(data[n]).length}/8`).join(', ') + '\n');
const ids = Object.keys(data[5400]).length ? Object.keys(data[5400]).sort() : Object.keys(data[COUNTS[0]] || {}).sort();
if (!ids.length) { console.log('no records yet'); process.exit(0); }

console.log('margin = held-out floor rate minus the ask, on 3,000 paths at seed 7002. Negative MISSES the promise.\n');
console.log('id       ask   ' + COUNTS.map(n => String(n).padStart(9)).join('') + '     solves       seconds a landing');
const worstOf = {};
for (const id of ids) {
  const row = [];
  for (const n of COUNTS) {
    const j = data[n][id];
    row.push(j ? j.solver.floorRate - 100 * j.confidence : null);
  }
  const ref = data[5400][id];
  const solves = COUNTS.map(n => (data[n][id] ? data[n][id].solver.solves : '-')).join('/');
  const secs = COUNTS.map(n => (data[n][id] ? Math.round(data[n][id].ms / 1000) : '-')).join('/');
  console.log(id.padEnd(7) + (ref ? (100 * ref.confidence).toFixed(1) : '?').padStart(6) + '   '
    + row.map(v => (v === null ? '  -' : ((v >= 0 ? '+' : '') + v.toFixed(2)) + (v < 0 ? '!' : ' ')).padStart(9)).join('')
    + '   ' + solves.padStart(10) + '   ' + secs.padStart(20));
  COUNTS.forEach((n, i) => {
    if (row[i] === null) return;
    if (worstOf[n] === undefined || row[i] < worstOf[n].v) worstOf[n] = { v: row[i], id };
  });
}

console.log('\n=========== THE GATE ===========');
const ref = worstOf[5400];
if (!ref) { console.log('  the 5,400 baseline is not complete yet'); process.exit(0); }
console.log(`  baseline: at 5,400 paths the worst margin is ${(ref.v >= 0 ? '+' : '') + ref.v.toFixed(2)} (${ref.id})\n`);
let best = null;
for (const n of COUNTS) {
  const w = worstOf[n];
  if (!w || Object.keys(data[n]).length < ids.length) { console.log(`  ${String(n).padStart(5)} paths   incomplete`); continue; }
  const c1 = w.v >= 0, c2 = w.v >= ref.v - MARGIN_SLACK;
  const verdict = c1 && c2 ? 'PASS' : !c1 ? `FAIL - ${w.id} MISSES its promise` : `FAIL - worst margin falls ${(ref.v - w.v).toFixed(2)} below 5,400's`;
  const t = Math.round(ids.reduce((a, id) => a + (data[n][id] ? data[n][id].ms : 0), 0) / ids.length / 1000);
  console.log(`  ${String(n).padStart(5)} paths   worst ${(w.v >= 0 ? '+' : '') + w.v.toFixed(2)} (${w.id})   ${String(t).padStart(5)}s a landing   ${verdict}`);
  if (c1 && c2 && best === null) best = n;
}
console.log('');
if (best === null) console.log('  RECOMMENDATION: none of the counts tried passes. Awaiting the full grid.');
else if (best === 5400) console.log('  RECOMMENDATION: 5,400 STANDS. No smaller count holds the promise, and the sweep has earned\n  its cost by establishing that rather than leaving the number unexamined.');
else {
  const t5 = Math.round(ids.reduce((a, id) => a + (data[5400][id] ? data[5400][id].ms : 0), 0) / ids.length / 1000);
  const tb = Math.round(ids.reduce((a, id) => a + (data[best][id] ? data[best][id].ms : 0), 0) / ids.length / 1000);
  console.log(`  RECOMMENDATION: ${best} paths. A landing falls from ${t5}s to ${tb}s, ${(100 * (1 - tb / t5)).toFixed(0)}% off every field check from here.`);
  console.log(`  For comparison E3 is 13.8% of a landing for about a day and a half of building.`);
}
console.log('\n  Every figure here is on 3,000 HELD-OUT paths at seed 7002, the same draw flex-tiers reported on.');
