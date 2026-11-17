/*
 * JOINT-WIDE, BESIDE ITS READ (EXPLORATORY, deciding nothing; written after the read, for the reviewer's findings at it,
 * research/solver/reviews/2026-11-17-read-joint-wide.md). The read is `results-joint-wide.txt` by `reduce-joint-wide.mjs`
 * (a stamped file, unchanged); this prints what the write-up quotes beyond it, from the same units in
 * results/joint-wide-7002, on stats.mjs as it stood at the read (before D112's fix to survivalChangeU):
 *   A. each unit's survival change against K2 under K4 and K6: the rule's per-unit interval (survivalChangeU, part 2's) and
 *      the exact paired interval (survivalChange), each unit wholly below nought by either named;
 *   B. how much of each width's pooled net gain is S147-db's, and the pooled change without it;
 *   C. the capped pot: units lower at all and lower by more than half a percent, K4 and K6 against K2 and K6 against K4;
 *   D. the replays along K2's path: the share of decisions on which the wider pick differs, pooled and by unit, and the
 *      split's share of those differences;
 *   E. the typical-path pot without S147-db, S147-db's own figure, how much of it comes from paths K2 fails, and its median
 *      path's change;
 *   F. the units behind the order effect's three groups (by which arm ran first) and behind each group's time.
 *   node research/solver/joint-wide-beside.mjs > research/solver/results-joint-wide-beside.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, survivalChange, pooledSummed } from './stats.mjs';
import { armOf, cells } from './reduce-joint-wide.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'joint-wide-7002');
const units = readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)).map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ['K2', 'K4', 'K6']) U.arms[a] = armOf(U.arms[a]); return U; }).sort((p, q) => p.k - q.k);
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), pc = x => `${(100 * x).toFixed(1)}%`;
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`JOINT-WIDE, BESIDE ITS READ (EXPLORATORY, deciding nothing; joint-wide-beside.mjs, after the read): ${units.length} units of results/joint-wide-7002, on stats.mjs as it stood at the read`);

console.log('\nA. survival by unit against K2: the rule\'s interval (survivalChangeU) and the exact paired one (survivalChange); units wholly below nought by either');
for (const arm of ['K4', 'K6']) {
  const below = [];
  for (const U of units) {
    const c = cells(U.arms.K2, U.arms[arm]), u = survivalChangeU(c.a, c.lost, c.saved, c.d), e = survivalChange(c.lost, c.saved, U.N);
    if (u.hi < 0 || e.hi < 0) below.push(`${U.id} ${f3(u.d)} (the rule's ${f3(u.lo)} to ${f3(u.hi)}; exact ${f3(e.lo)} to ${f3(e.hi)}; ${c.lost} lost, ${c.saved} saved)`);
  }
  console.log(`  ${arm}: ${below.length ? below.join('; ') : 'none'}`);
}

console.log('\nB. S147-db\'s part of each width\'s pooled net gain');
for (const arm of ['K4', 'K6']) {
  const net = U => { const c = cells(U.arms.K2, U.arms[arm]); return c.saved - c.lost; }, all = units.reduce((s, U) => s + net(U), 0), s147 = net(units.find(U => U.id === 'S147-db'));
  const rest = pooledSummed(units.filter(U => U.id !== 'S147-db').map(U => cells(U.arms.K2, U.arms[arm])));
  console.log(`  ${arm}: net paths saved ${all}, S147-db's ${s147} (${pc(s147 / all)}); pooled survival without S147-db ${f3(rest.d)} (${f3(rest.lo)} to ${f3(rest.hi)})`);
}

console.log('\nC. the capped pot (each path\'s pot up to the household\'s cap, the arm\'s mean against the base\'s): units lower at all, and by more than half a percent');
for (const [base, arm] of [['K2', 'K4'], ['K2', 'K6'], ['K4', 'K6']]) {
  const ch = units.map(U => { const cap = v => mean(Array.from(v, x => Math.min(x, U.cap))); return { id: U.id, d: 100 * (cap(U.arms[arm].pot) / cap(U.arms[base].pot) - 1) }; });
  const lower = ch.filter(x => x.d < 0), half = ch.filter(x => x.d < -0.5);
  console.log(`  ${arm} against ${base}: lower on ${lower.length} of ${units.length}; by more than 0.5% on ${half.length} (${half.map(x => `${x.id} ${x.d.toFixed(3)}%`).join(', ')})`);
}

console.log('\nD. the replays along K2\'s path: decisions on which the wider pick differs, and the split\'s share of those');
for (const arm of ['K4', 'K6']) {
  let dec = 0, dif = 0, split = 0; const by = [];
  let splitUnder = 0;
  for (const U of units) { const r = U.along[arm]; dec += U.along.decisions; dif += r.differ; split += r.split; by.push(r.differ / U.along.decisions); if (r.split < r.differ / 2) splitUnder++; }
  console.log(`  ${arm}: differs on ${pc(dif / dec)} pooled (by unit ${pc(Math.min(...by))} to ${pc(Math.max(...by))}); a different split on ${pc(split / dif)} of those; the split under half of a unit's differing picks on ${splitUnder} of ${units.length} units`);
}

console.log('\nE. the typical-path pot (each path\'s own change where both arms leave a pot, averaged by unit, the units averaged)');
for (const arm of ['K4', 'K6']) {
  const per = units.map(U => {
    const b = U.arms.K2, x = U.arms[arm], v = [], vFail = [];
    for (let i = 0; i < b.pot.length; i++) if (b.pot[i] > 0 && x.pot[i] > 0) { const d = 100 * (x.pot[i] / b.pot[i] - 1); v.push(d); if (!b.survived[i]) vFail.push(d); }
    const s = [...v].sort((p, q) => p - q);
    return { id: U.id, m: mean(v), n: v.length, fromFail: vFail.reduce((t, y) => t + y, 0) / v.length, med: s[Math.floor(s.length / 2)] };
  });
  const all = mean(per.map(p => p.m)), s = per.find(p => p.id === 'S147-db'), rest = mean(per.filter(p => p.id !== 'S147-db').map(p => p.m));
  console.log(`  ${arm}: pooled ${f3(all)}%, without S147-db ${f3(rest)}%; S147-db's own ${f3(s.m)}% (its share of the pooled figure ${f3(s.m / units.length)} points), of which ${f3(s.fromFail)} points from paths K2 fails; S147-db's median path ${f3(s.med)}%`);
}

console.log('\nF. the order effect\'s groups (by which arm ran first) and the units each time median is over');
const one = U => new Set(['K2', 'K4', 'K6'].flatMap(a => (U.arms[a].chunks || []).map(c => c.proc))).size === 1;
for (const first of ['K2', 'K4', 'K6']) { const g = units.filter(U => U.order[0] === first); console.log(`  ${first} first: ${g.length} units (${g.filter(one).length} in one process): ${g.map(U => U.id).join(', ')}`); }
for (const grp of ['younger', 'library', '90/10', 'feature']) { const g = units.filter(U => U.group === grp); console.log(`  the ${grp} group: ${g.length} units, ${g.filter(one).length} with their three arms in one process`); }
