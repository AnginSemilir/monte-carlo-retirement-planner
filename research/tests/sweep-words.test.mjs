/*
 * THE PAGES SHOW THE SWEEP (the review of 9 Nov, item 5, part 1; D66). Under a solved table the engine keeps cash at its buffer
 * (stepYear 7d): cash above it moves to the taxable account, a shortfall is topped up from it. The estate the pages show already
 * assumes the move; now every listing of the solved plan's actions says so, to the pound: this year's actions
 * (solverStrategy.js actionsOf's `sweep`, PlannerPlan.jsx and the printed sheet), the next ten years (aheadOf's rows) and the
 * audit table's action column (ledgerWords). S116 (£359,900 of cash above its buffer in its first year) at light settings:
 *   1. this year's sweep is the engine's own: the first year's row on three random paths moves the same amount, and actionsOf
 *      carries it (the year's flows before the sweep take no market);
 *   2. the words name the move, its accounts and its amount to the pound;
 *   3. the next ten years: each year's row on the median path carries the engine's sweep for that year, and its words name it
 *      (a move out in year 0, the buffer topped up after); the grouping keeps years whose amounts and moves match;
 *   4. the audit column names the year's sweep with its amount.
 * The plants (WORDS_PLANT.rule): 'sweepround' (the amount to the nearest £1,000) fails 2 and 3; 'sweepback' (a top-up worded as
 * a move out) fails 3. --plants runs both.
 *   node research/tests/sweep-words.test.mjs [--plants]
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { actionsOf, aheadOf, strategyRuns, rowsOf } from '../../src/solverStrategy.js';
import { sweepWords, aheadRowsWords, ledgerWords, WORDS_PLANT } from '../../src/solverWords.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const SELF = fileURLToPath(import.meta.url);
const PLANTS = { sweepround: [2, 3], sweepback: [3] };
if (process.argv.includes('--plants')) {
  let bad = 0;
  for (const [p, want] of Object.entries(PLANTS)) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, SWEEP_WORDS_PLANT: p }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => Number(m[1])))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    if (!exact) bad++;
    console.log(`plant ${p.padEnd(10)} fails ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) console.log(r.stdout + r.stderr);
  }
  process.exit(bad ? 1 : 0);
}
WORDS_PLANT.rule = process.env.SWEEP_WORDS_PLANT || '';
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
const fmt = E.formatGBP, pound = x => fmt(x);
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S116').plan);
const solved = solveForApp(E, M, plan, { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
console.log(`sweep-words: the sweep in the solved plan's listings, S116 at light settings${WORDS_PLANT.rule ? `; planted: ${WORDS_PLANT.rule}` : ''}`);

// 1. this year's sweep, the engine's own on any path
const acts = actionsOf(E, solved, plan, { n: 40 });
const { rows: rowsExp } = rowsOf(E, solved, 'expected');
const onPaths = E.pathsForSeed(7002, 3, solved.m.ctx.totalYears).map(zs => {
  const { rows } = rowsOf(E, solved, { z: zs[0], zPath: zs.length > solved.m.ctx.totalYears + 1 ? zs[solved.m.ctx.totalYears + 1] : 0 });
  return rows[0].sweptToGia;
});
ok(1, 'this year\'s sweep is the engine\'s first year, the same on every path', acts.sweep.toGia > 0 && onPaths.every(x => x === acts.sweep.toGia) && rowsExp[0].sweptToGia === acts.sweep.toGia,
  `actionsOf: £${acts.sweep.toGia.toFixed(2)} to the taxable account, £${acts.sweep.fromGia.toFixed(2)} back; the first year on three paths ${onPaths.map(x => x.toFixed(2)).join(', ')}`);

// 2. its words, to the pound
const w = sweepWords(acts.sweep, { fmt });
ok(2, 'the words name the move, its accounts and its amount to the pound', !!w && w.includes(pound(acts.sweep.toGia)) && /cash/.test(w) && /taxable account/.test(w), `"${w}" (the amount ${pound(acts.sweep.toGia)})`);

// 3. the next ten years
const runs = strategyRuns(E, solved, plan, { seed: 12345, from: 0, to: 200 });
const ahead = aheadOf(E, solved, plan, runs, { years: 10 });
const groups = aheadRowsWords(ahead.rows, { target: plan.spending.targetSpend, fmt });
let named = 0, moved = 0, wrong = [];
for (const r of ahead.rows) {
  const sw = r.swept, any = sw && (sw.toGia >= 0.5 || sw.fromGia >= 0.5);
  if (!any) continue;
  moved++;
  const g = groups.find(x => x.from.t <= r.t && r.t <= x.to.t), want = sw.toGia >= 0.5 ? `Move ${pound(sw.toGia)} of cash above your buffer` : `Top your cash buffer up with ${pound(sw.fromGia)}`;
  if (g && g.lines.some(l => l.startsWith(want))) named++; else wrong.push(`${r.year}: wanted "${want}", got "${g ? g.lines.join('; ') : 'no group'}"`);
}
ok(3, 'the next ten years: each year\'s sweep on the median path named with its amount and direction', moved > 1 && named === moved,
  `${named} of ${moved} years with a sweep named; ${groups.length} rows for ${ahead.rows.length} years${wrong.length ? `; ${wrong.slice(0, 2).join(' | ')}` : ''}; the first: ${groups[0].lines.join('; ')}`);

// 4. the audit column
const lw = ledgerWords(rowsOf(E, solved, 'expected').parts[0], true, rowsExp[0]);
ok(4, 'the audit table\'s action column names the year\'s sweep with its amount', lw.includes(`cash ${Math.round(rowsExp[0].sweptToGia).toLocaleString('en-GB')} to taxable`), `"${lw}"`);

console.log(`\nsweep-words: ${passed} passed, ${failed} failed${WORDS_PLANT.rule ? ` (planted: ${WORDS_PLANT.rule})` : ''}`);
process.exit(failed ? 1 : 0);
