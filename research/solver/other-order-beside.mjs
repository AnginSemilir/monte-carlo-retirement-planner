/*
 * BESIDE THE OTHER ORDER'S READ (OTHER-ORDER.md; D100 stage A; EXPLORATORY, seed 7002), written after the read and deciding
 * nothing. It reads the same units the reducer read (results/other-order-7002) through the reducer's own functions and prints:
 *   A. the tie at the bar: each unit part (b) names, its change in whole paths against the bar in whole paths, and the
 *      change as the reducer's floating point carries it; then the rule with (b) taken in whole paths;
 *   B. arm A's policy in each order, and where it differs, whether each person's table differs with it;
 *   C. the estate weight's pull: YOUNG and YOUNGE against ELDER, the mean pot left and the spending delivered by unit;
 *   D. what is left with the option: the units whose interval is wholly below or wholly above nought, and the paths lost
 *      and saved pooled;
 *   E. the rule as the reducer takes it on the units whose order did not change arm A's policy.
 *   node research/solver/other-order-beside.mjs [dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, rule, RULE, OTHERS } from './reduce-other-order.mjs';
import { unitsOf } from './audit-other-order.mjs';
import { pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'other-order-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const byId = Object.fromEntries(raw.map(U => [U.id, { ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }]));
const ids = unitsOf().map(u => u.id), units = ids.map(id => byId[id]);
if (units.some(u => !u)) { console.error('other-order-beside: a unit is missing'); process.exit(2); }
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
const R = rule(units), N = units[0].N, barPaths = RULE.unit * N / 100;
console.log(`BESIDE THE OTHER ORDER'S READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} units of ${DIR.split('/').slice(-1)[0]}, ${N} paths each; the reducer's outcome ${R.verdict}`);

console.log(`\nA. The tie at the bar. Part (b) reads a unit as below ${RULE.unit} points when its change, in floating point, is below ${RULE.unit} and its interval wholly below nought. On ${N} paths ${RULE.unit} points is ${barPaths} paths exactly; a unit's change is a whole number of paths (saved less lost):`);
for (const k of OTHERS) {
  const near = R.H.filter(h => Math.abs(h.vs[k].ch.d - RULE.unit) < 1e-9 || R.R[k].units.includes(h.id));
  if (!near.length) { console.log(`  ${k}: no unit named by (b) and none at the bar`); continue; }
  for (const h of near) {
    const c = h.vs[k].ch.cells, paths = c.saved - c.lost;
    console.log(`  ${k} ${h.id}: ${c.lost} paths lost and ${c.saved} saved, a change of ${paths} paths against the bar's ${barPaths}; in floating point ${h.vs[k].ch.d.toPrecision(17)} points, which ${h.vs[k].ch.d < RULE.unit ? 'IS' : 'is not'} below ${RULE.unit}; in whole paths ${paths < barPaths ? 'below the bar' : 'AT the bar, not below it'}; its interval ${f(h.vs[k].ch.lo)} to ${f(h.vs[k].ch.hi)}`);
  }
}
const whole = Object.fromEntries(OTHERS.map(k => {
  const r = R.R[k], named = R.H.filter(h => { const c = h.vs[k].ch.cells; return c.saved - c.lost < barPaths && h.vs[k].ch.hi < 0; }).map(h => h.id);
  return [k, { ...r, b: !named.length, named, within: r.a && !named.length && r.c }];
}));
for (const k of OTHERS) { const w = whole[k]; console.log(`  ${k} with (b) in whole paths: (a) ${w.a ? 'HOLDS' : 'FAILS'}; (b) ${w.named.length ? `${w.named.join(', ')}: FAILS` : 'none: HOLDS'}; (c) ${w.c ? 'HOLDS' : 'FAILS'}: ${w.within ? 'WITHIN THE TARGETS' : 'NOT WITHIN THEM'}`); }
const wordsVerdict = whole.YOUNG.within ? 'AS IT IS' : whole.YOUNGE.within ? 'THE OPTION' : 'NEITHER';
console.log(`  the outcome with (b) taken in whole paths, as the rule's words put it ("below"): ${wordsVerdict}; the reducer printed ${R.verdict}. Which stands is the maintainer's.`);

console.log(`\nB. Arm A's policy in each order (the solver arms solve each order's plan under its own arm A's policy name, as stage C did):`);
const differ = [];
for (const U of units) {
  const e = U.order.ELDER.label, y = U.order.YOUNG.label, h = R.H.find(x => x.id === U.id);
  if (e !== y) { differ.push(U.id); console.log(`  ${U.id}: elder first "${e}", younger first "${y}"; APP ${h.surv.APP.toFixed(2)}%, APPY ${h.surv.APPY.toFixed(2)}%; each person's table ${h.same ? 'the same' : 'DIFFERS'} in the two orders`); }
}
console.log(`  the same policy in both orders on ${units.length - differ.length} of ${units.length} units; each person's table the same in both orders on ${R.H.filter(h => h.same).length} of ${units.length}, and on every unit whose policy is the same: ${R.H.filter(h => !differ.includes(h.id)).every(h => h.same) ? 'yes' : 'no'}`);

console.log(`\nC. The estate weight's pull (the mean pot left and the spending delivered, each arm against ELDER, by unit):`);
for (const k of OTHERS) {
  const rows = units.map(U => ({ id: U.id, pot: 100 * (mean(U.arms[k].pot) / mean(U.arms.ELDER.pot) - 1), sp: 100 * (mean(U.arms[k].delivered) / mean(U.arms.ELDER.delivered) - 1), w: U.arms[k].wB / U.arms.ELDER.wB }));
  const up = rows.filter(r => r.pot > 0).length, down = rows.filter(r => r.sp < 0).length;
  const ws = [...new Set(rows.map(r => r.w.toFixed(2)))].join(' and ');
  console.log(`  ${k} (the joint estate weight x${ws} ELDER's): the mean pot left higher on ${up} of ${rows.length} units (from ${f(Math.min(...rows.map(r => r.pot)), 2)}% to ${f(Math.max(...rows.map(r => r.pot)), 2)}%, the units' mean ${f(mean(rows.map(r => r.pot)), 2)}%); the spending delivered lower on ${down} of ${rows.length} (from ${f(Math.min(...rows.map(r => r.sp)), 3)}% to ${f(Math.max(...rows.map(r => r.sp)), 3)}%)`);
}

console.log(`\nD. What is left with the option (YOUNGE against ELDER; YOUNG beside):`);
for (const k of ['YOUNGE', 'YOUNG']) {
  const below = R.H.filter(h => h.vs[k].ch.hi < 0), above = R.H.filter(h => h.vs[k].ch.lo > 0), cells = R.H.map(h => h.vs[k].ch.cells);
  console.log(`  ${k}: the interval wholly below nought on ${below.length} units (${below.map(h => `${h.id} ${iv(h.vs[k].ch)}`).join('; ') || 'none'}); wholly above on ${above.length} (${above.map(h => `${h.id} ${f(h.vs[k].ch.d)}`).join(', ') || 'none'}); pooled ${sum(cells.map(c => c.lost))} paths lost and ${sum(cells.map(c => c.saved))} saved of ${sum(cells.map(c => c.a + c.lost + c.saved + c.d))}; the paths whose run parts from ELDER's at all ${sum(R.H.map(h => h.parted[k]))} of ${units.length * N}`);
}

console.log(`\nE. The rule as the reducer takes it, on the ${units.length - differ.length} units whose order left arm A's policy the same (without ${differ.join(' and ')}):`);
const keep = units.filter(U => !differ.includes(U.id)), R2 = rule(keep);
for (const k of OTHERS) {
  const r = R2.R[k];
  console.log(`  ${k}: (a) ${iv(r.pooled)} points: ${r.a ? 'HOLDS' : 'FAILS'}; (b) ${r.units.length ? `${r.units.join(', ')}: FAILS` : 'none: HOLDS'}; (c) ${f(r.spend)}%: ${r.c ? 'HOLDS' : 'FAILS'}: ${r.within ? 'WITHIN THE TARGETS' : 'NOT WITHIN THEM'}`);
}
console.log(`  the outcome on them by the reducer: ${R2.verdict}`);

console.log(`\nF. The order every tested couples' panel enters its couples in (each person's age today as the engine reads it):`);
{
  const { readPanel } = await import('./couple-panel.mjs'), E = await import('../engine.mjs');
  const order = plans => { let el = 0, yo = 0, same = 0; for (const p of plans) { const c = E.buildContext(E.resolveMpaa(E.normalizePlan(p))); if (c.ageSelf0 > c.agePart0) el++; else if (c.ageSelf0 < c.agePart0) yo++; else same++; } return `the first person the elder ${el}, the younger ${yo}, the same age ${same}`; };
  for (const f of ['couples-panel-d4b.json', 'couples-panel.json']) { const P = readPanel(join(HERE, f)); console.log(`  ${f} (the couples' ${f.includes('d4b') ? 're-run' : 'first registered run'}): ${P.length} couples; ${order(P.map(h => h.plan))}`); }
  const share = unitsOf(), { readSharePanel } = await import('./couples-share-panel.mjs'), all = readSharePanel();
  console.log(`  couples-share-panel.json (stage C): ${all.length} units; ${order(all.map(u => u.plan))}; this read's ${share.length} re-held units among them, ${order(share.map(u => u.plan))}`);
}
