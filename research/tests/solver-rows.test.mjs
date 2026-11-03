/*
 * ONE MARKET'S RUN OF THE SOLVED PLAN, YEAR BY YEAR (Part C Phase 10, item 7; src/solverStrategy.js rowsOf). The full tier.
 *
 * The audit table under the switch is the solved plan's expected-return ledger with each year's action, and the history tab
 * runs the solved plan through real history (the out-of-model check). Both read rowsOf, through the solver's worker.
 *
 * 1. The rows are the engine's own: rowsOf on 'expected' is E.simulateDeterministic of the solved plan row for row, field for
 *    field, and on a historical start year E.simulateHistorical's (recording the moves changes nothing); its verdict is
 *    E.evaluateRows on the solved plan's context.
 * 2. Each year's parts are the move the engine took that year: the spending level the engine's row records, and the tiers the
 *    row holds after the move; a year with no move has none.
 * 3. The result crosses to the page: structuredClone keeps it whole (the worker posts it).
 * 4. The words: ledgerWords on each year's parts, the spending first where the year has a target.
 * On S126 (retired, its levels moving over the years) and S188 (working, then retired), at light settings.
 * Plants (the module's PLANT): 'rowsfirst' (the first year's move given for every year) fails 2; 'rowsexp' (the market ignored
 * for the expected path) fails 1's history.
 *   node research/tests/solver-rows.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { rowsOf, solvedContext, PLANT } from '../../src/solverStrategy.js';
import { ledgerWords } from '../../src/solverWords.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const all = buildScenarios(), planOf = id => all.find(s => s.id === id).plan;
const SMALL = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, PTS = 6, STARTS = [1929, 1966];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* the checks on one solve; returns the count failing (for the plants) */
function checks(id, r, label = '') {
  const before = fail, sc = solvedContext(E, r), T = sc.totalYears;
  const x = rowsOf(E, r, 'expected'), ref = E.simulateDeterministic(sc, 'expected');
  ok(x.rows.length === T + 1 && same(x.rows, ref), `1. ${id}${label}: 'expected' is simulateDeterministic of the solved plan, ${T + 1} rows field for field`);
  ok(same(x.verdict, E.evaluateRows(sc, ref)), `1. ${id}${label}: its verdict is evaluateRows on the solved plan's context (survived ${x.verdict.survived}, the pot left ${Math.round(x.verdict.terminalPot)})`);
  for (const y of STARTS) {
    const h = rowsOf(E, r, { historical: true, startYear: y }), hr = E.simulateHistorical(sc, y);
    ok(same(h.rows, hr) && same(h.verdict, E.evaluateRows(sc, hr)), `1. ${id}${label}: history from ${y} is simulateHistorical of the solved plan, row for row, with its verdict (survived ${h.verdict.survived})`);
  }
  let moved = 0, badLevel = 0, badTier = 0, none = 0;
  x.rows.forEach((row, t) => {
    const p = x.parts[t];
    if (!p) { none++; if (row.action !== null) badLevel++; return; }
    moved++;
    if (p.level !== row.spendLevel) badLevel++;
    if (p.tierPen !== row.tierPen || p.tierIsa !== row.tierIsa) badTier++;
  });
  ok(moved > 0 && badLevel === 0, `2. ${id}${label}: each year's spending level is the engine row's (${moved} years with a move, ${none} without; ${badLevel} differ)`);
  ok(badTier === 0, `2. ${id}${label}: each year's tiers are those the row holds after the move (${badTier} differ)`);
  const back = structuredClone(x);
  ok(same(back, x), `3. ${id}${label}: the result crosses to the page whole (structuredClone)`);
  return fail - before;
}

const solved = {};
for (const id of ['S126', 'S188']) {
  const t0 = Date.now();
  solved[id] = solveForApp(E, M, planOf(id), { points: PTS, research: SMALL });
  console.log(`=========== ${id} (solved in ${((Date.now() - t0) / 1000).toFixed(0)} s) ===========`);
  checks(id, solved[id]);
}

console.log('=========== 4. THE WORDS ===========');
{
  const x = rowsOf(E, solved.S126, 'expected'), levels = new Set(x.parts.filter(Boolean).map(p => p.level));
  ok(levels.size > 1, `4. S126's levels move over the years on the expected path (${[...levels].map(v => `${Math.round(100 * v)}%`).join(', ')}), so a plant that repeats year 0 shows`);
  const t = x.rows.findIndex((row, k) => row.targetSpend > 0 && x.parts[k]), p = x.parts[t], w = ledgerWords(p, true);
  ok(w.startsWith(`spend ${Math.round(100 * p.level)}%`), `4. a retired year's words lead with its spending level ("${w}")`);
  const y = rowsOf(E, solved.S188, 'expected'), k = y.rows.findIndex((row, j) => row.targetSpend === 0 && y.parts[j]);
  ok(k < 0 || !/^spend /.test(ledgerWords(y.parts[k], false)), `4. a working year's words do not speak of spending (${k < 0 ? 'no working year with a move' : `"${ledgerWords(y.parts[k], false)}"`})`);
  ok(ledgerWords(null, true) === null && ledgerWords({ level: 1, draw: 'none', harvest: null, tierPen: 0, tierIsa: 0 }, false) === 'as planned', '4. no move gives no words; a move doing nothing beyond the plan reads "as planned"');
}

console.log('=========== THE PLANTS ===========');
for (const [rule, what] of [['rowsfirst', 'the first year\'s move given for every year'], ['rowsexp', 'the market ignored for the expected path']]) {
  const keep = { pass, fail };
  PLANT.rule = rule;
  console.log(`  -- planted: ${what} (expected to FAIL) --`);
  const caught = checks('S126', solved.S126, ` [${rule}]`);
  PLANT.rule = '';
  pass = keep.pass; fail = keep.fail;
  ok(caught > 0, `the plant '${rule}' (${what}) is caught: ${caught} check${caught === 1 ? '' : 's'} failed`);
}

console.log(fail ? `\nFAILED: ${fail} of ${pass + fail}` : `\nALL PASS: ${pass}`);
process.exit(fail ? 1 : 0);
