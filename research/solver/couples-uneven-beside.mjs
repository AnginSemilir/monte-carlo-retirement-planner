/*
 * BESIDE THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS' READ (post hoc, deciding nothing; written 25 Nov after the read once,
 * results-couples-uneven.txt, from the leads of the reviewer at the read, reviews/2026-11-25-read-couples-uneven.md findings 1
 * and 2). It reads the run's own arrays (seed 7002, already read; results/couples-uneven-7002) and solves and runs nothing:
 *   A. M1's own rule (reduce-couples-open.mjs m1ByUnit, as the registered read applies it: more paths kept net than APP and the
 *      spending on the paths both keep wholly below APP's) on the 28 units, with each household arm in ROUTE's place: the
 *      units it names, each with its paths kept net and that spending;
 *   B. each of PA2, SPLIT and FIX less ROUTE, pooled over each holding's 14 units: survival by path (reduce-phase4.mjs
 *      survivalItem), and spending on the paths both keep (reduce-household-hsp.mjs keptSpend);
 *   C. where the paths each of PA2, SPLIT and FIX loses against ROUTE fail: in the plan's last year, in its last three, with
 *      no spending unmet (so ending below the minimum pot), before its last five; and each arm's own failed paths beside.
 * It reads the registered panel's plans for each unit's last year (REG=1, as the reducer).
 *   REG=1 node research/solver/couples-uneven-beside.mjs > research/solver/results-couples-uneven-beside.txt
 */
import { loadDir } from './reduce-couples-uneven.mjs';
import { m1ByUnit } from './reduce-couples-open.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { survivalItem } from './reduce-phase4.mjs';
import { readAnyPanel } from './couples-any-panel.mjs';
import { OUT_DEFAULT, unitsOf } from './audit-couples-uneven.mjs';

if (process.env.REG !== '1') { console.error('couples-uneven-beside: reads the registered panel, REG=1'); process.exit(2); }
const units = loadDir(process.argv[2] || OUT_DEFAULT).sort((a, b) => a.k - b.k);
if (units.length !== 28) { console.error(`couples-uneven-beside: ${units.length} units, not 28`); process.exit(2); }
const n = units[0].N;
if (units.some(u => u.N !== n)) { console.error('couples-uneven-beside: the units are on different path counts'); process.exit(2); }
// the plan's last year, from the panel's plans (S041: its end age less the first person's age)
const lastOf = Object.fromEntries(unitsOf(readAnyPanel()).map(u => [u.id, Number(u.plan.demographics.terminalAge) - Number(u.plan.demographics.currentAgeSelf)]));
const sg = (x, d) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`, iv = (r, d) => `${sg(r.d, d)} (${sg(r.lo, d)} to ${sg(r.hi, d)})`;

console.log(`BESIDE THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS' READ (post hoc, deciding nothing; seed 7002, already read; ${units.length} units, ${n} paths each; no unit solved or run)`);

console.log('\nA. M1\'s own rule (reduce-couples-open.mjs m1ByUnit) with each household arm in ROUTE\'s place, against APP:');
for (const arm of ['ROUTE', 'PA2', 'SPLIT', 'FIX']) {
  const named = m1ByUnit(units.map(u => ({ ...u, caps: [], arms: { APP: u.arms.APP, ROUTE: u.arms[arm] } }))).filter(x => x.named);
  console.log(`  ${arm.padEnd(5)} names ${named.length}${named.length ? `: ${named.map(x => `${x.id} (${x.net} paths kept net; spending on the paths both keep ${iv(x.kept, 4)}%)`).join('; ')}` : ''}`);
}
console.log('  Each household arm on the two units the registered read named, against APP:');
for (const id of ['S041-Rp1t-Y75', 'S041-Ri1s-Y75']) {
  const u = units.find(x => x.id === id);
  for (const arm of ['ROUTE', 'PA2', 'SPLIT', 'FIX']) {
    let lost = 0, saved = 0; const A = u.arms[arm], P = u.arms.APP;
    for (let i = 0; i < n; i++) { if (P.survived[i] && !A.survived[i]) lost++; else if (A.survived[i] && !P.survived[i]) saved++; }
    console.log(`    ${id} ${arm.padEnd(5)} ${saved - lost} paths kept net (${saved} saved, ${lost} lost); spending on the paths both keep ${iv(keptSpend([u], 'APP', arm, n), 4)}%`);
  }
}

console.log('\nB. Each arm less ROUTE, pooled over each holding\'s 14 units: survival by path, points; spending on the paths both keep, %:');
for (const hold of ['own', 'Y75']) {
  const us = units.filter(u => u.hold === hold);
  if (us.length !== 14) { console.error(`couples-uneven-beside: ${us.length} units at ${hold}, not 14`); process.exit(2); }
  for (const arm of ['PA2', 'SPLIT', 'FIX']) {
    const s = survivalItem(us.map(u => [u.arms[arm], u.arms.ROUTE]), n), k = keptSpend(us, 'ROUTE', arm, n);
    console.log(`  ${hold === 'own' ? '60/40' : '25/75'} ${arm.padEnd(5)} survival ${iv(s, 3)}; spending ${iv(k, 4)}`);
  }
}

console.log('\nC. Where the paths each arm loses against ROUTE fail (over the 28 units), and each arm\'s own failed paths:');
for (const arm of ['PA2', 'SPLIT', 'FIX']) {
  let lost = 0, atT = 0, last3 = 0, noUnmet = 0, early = 0;
  for (const u of units) {
    const A = u.arms[arm], R = u.arms.ROUTE, T = lastOf[u.id];
    if (!(T > 0)) { console.error(`couples-uneven-beside: no plan for ${u.id}`); process.exit(2); }
    for (let i = 0; i < n; i++) if (R.survived[i] && !A.survived[i]) {
      lost++; const fy = A.failYear[i];
      if (fy === T) atT++; if (fy >= T - 2) last3++; if (A.unmet[i] <= 1e-6) noUnmet++; if (fy < T - 5) early++;
    }
  }
  console.log(`  ${arm.padEnd(5)} loses ${lost}: failing in the plan's last year ${atT}, in its last three ${last3}, with no spending unmet ${noUnmet}, before its last five ${early}`);
}
for (const arm of ['APP', 'ROUTE', 'PA2', 'SPLIT', 'FIX']) {
  let f = 0, atT = 0, noUnmet = 0;
  for (const u of units) { const A = u.arms[arm], T = lastOf[u.id]; for (let i = 0; i < n; i++) if (!A.survived[i]) { f++; if (A.failYear[i] === T) atT++; if (A.unmet[i] <= 1e-6) noUnmet++; } }
  console.log(`  ${arm.padEnd(5)} fails ${f} paths: in the plan's last year ${atT}, with no spending unmet ${noUnmet}`);
}
