/*
 * BESIDE THE GUARD TEST'S READ (GUARD-KEY.md; D129 (4); EXPLORATORY, written after the read, deciding nothing): the figures the
 * reviewer at the read asked for (reviews/2026-11-18-read-guard-key.md), from the run's unit files (results/guard-7002) and
 * the panels:
 *   1. where each unit's income starts as the engine counts it: an income is counted from its owner's retirement at the
 *      earliest (App.jsx buildContext's incomeFloor), so rent "from now" on a working first person runs from their
 *      retirement; and K2 less APP pooled over the rent units whose rent starts at plan year 0 and over those whose rent
 *      starts later;
 *   2. the end pot, mean and median, APP's against K2's on each unit;
 *   3. arm A's own pick on each gap couple (step 5's eight from shapes-panel.json, this test's eight): whether it takes the
 *      lump sum.
 *   node research/solver/guard-beside.mjs
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { survivalChange } from './stats.mjs';
import { armOf, cells } from './reduce-household.mjs';
import { readGuardPanel } from './guard-panel.mjs';
import { fileOf } from './audit-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'guard-7002');
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), iv = r => `${f3(r.d)} (${f3(r.lo)} to ${f3(r.hi)})`;
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
const mean = A => A.reduce((t, x) => t + x, 0) / A.length, median = A => { const s = [...A].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const panel = readGuardPanel();
const units = panel.map(p => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, fileOf(p.id)))).toString()); U.arms.APP = armOf(U.arms.APP); U.arms.K2 = armOf(U.arms.K2); return { ...U, plan: p.plan }; });
console.log(`BESIDE THE GUARD TEST'S READ (EXPLORATORY, after the read, deciding nothing; the reviewer's findings 1 to 4): ${units.length} units from ${DIR}, seed ${units[0].seed}, ${units[0].N} paths; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
console.log('\n1. Where each unit\'s income starts as the engine counts it (from its owner\'s retirement at the earliest):');
const startOf = U => {
  const ctx = E.buildContext(E.resolveMpaa(U.plan)), inc = (U.plan.otherIncomes || []).find(i => Number(i.amount) === 15000 && i.owner === 'Myself' && i.incomeType === 'otherTaxable');
  const counted = ctx.otherIncomes.find(i => i.owner === 'self' && i.amount === 15000 && !i.taxFree);
  return { typed: E.num(inc.startAge, 0), counted: counted.startAge, year: counted.startAge - ctx.ageSelf0, age: ctx.ageSelf0, retire: ctx.owners.find(o => o.key === 'self').retireAge };
};
const starts = Object.fromEntries(units.map(U => [U.id, startOf(U)]));
for (const U of units) { const s = starts[U.id]; console.log(`  ${U.id.padEnd(20)} typed from ${s.typed}, counted from ${s.counted} (plan year ${s.year}); the first person ${s.age} now, retiring at ${s.retire}`); }
const pool = us => { const cs = us.map(U => cells(U.arms.APP, U.arms.K2)); return survivalChange(cs.reduce((t, c) => t + c.lost, 0), cs.reduce((t, c) => t + c.saved, 0), cs.reduce((t, c) => t + c.N, 0)); };
const rent = units.filter(U => U.kind === 'rent'), now = rent.filter(U => starts[U.id].year === 0), later = rent.filter(U => starts[U.id].year > 0);
console.log(`  K2 less APP pooled over the rent units counted from plan year 0 (${now.map(U => U.id).join(', ')}): ${iv(pool(now))}`);
console.log(`  K2 less APP pooled over the rent units counted later (${later.map(U => U.id).join(', ')}): ${iv(pool(later))}`);
console.log('\n2. The end pot, APP against K2 (mean / median over every path):');
for (const U of units) { const a = U.arms.APP.pot, k = U.arms.K2.pot; console.log(`  ${U.id.padEnd(20)} mean ${gbp(mean(a))} / ${gbp(mean(k))} (K2 ${f3(100 * (mean(k) / mean(a) - 1))}%); median ${gbp(median(a))} / ${gbp(median(k))} (K2 ${f3(100 * (median(k) / median(a) - 1))}%)`); }
console.log('\n3. Arm A\'s own pick on each gap couple (step 5\'s from shapes-panel.json, this test\'s from guard-panel.json; the lump sum where the label names it):');
const shapes = JSON.parse(readFileSync(join(HERE, 'shapes-panel.json'), 'utf8')).units.filter(u => /@gap(8|12)$/.test(u.id));
for (const u of [...shapes, ...panel]) console.log(`  ${u.id.padEnd(20)} ${u.label}${/lump sum/.test(u.label) ? ' (the lump sum)' : ''}`);
