/*
 * THE DECIDED DEFAULTS AND THE CODE MOVE TOGETHER (RULES.md rule 4). PLAN.md's <!-- decided-defaults --> block is what
 * the maintainer decided; solve.js is what runs. A decision recorded in one and not the other fails here - as bare
 * solve() carrying the old objective did (M1), and the defaults comment saying "opt-in" after risk above went on.
 * The regimen's margins (RULES.md section 8, the maintainer 25 Sep 20:47 UK) are pinned the same way: the block's
 * "margins" against stats.mjs's MARGINS, which the reducers on the exact rule read.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCT_DEFAULTS, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { MARGINS, marginFor } from '../solver/stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const plan = readFileSync(join(HERE, '../solver/PLAN.md'), 'utf8');
const src = readFileSync(join(HERE, '../../src/solver/solve.js'), 'utf8');
const m = /<!-- decided-defaults([\s\S]*?)-->/.exec(plan);
ok(!!m, 'PLAN.md carries the decided-defaults block');
const D = JSON.parse(m[1]);

for (const k of ['raiseCap', 'minPotYears', 'estateWeightMin', 'thinSurvival', 'thinPaths', 'thinSeed']) ok(D[k] === PRODUCT_DEFAULTS[k], `${k}: decided ${D[k]}, code ${PRODUCT_DEFAULTS[k]}`);
ok(Object.keys(PRODUCT_DEFAULTS).every(k => k in D), 'every default in the code is in the decided block');
for (const k of ['raiseSurvival', 'failureShortfall', 'finalIntegral']) ok(D[k] === PRODUCT_BASELINE[k], `${k}: decided ${D[k]}, code ${PRODUCT_BASELINE[k]}`);
ok(D.riskAboveDefault === 'auto' && /if \(opts\.riskAbove === undefined\) return solvePlanAuto\(E, M, plan, opts\)/.test(src), 'risk above: decided auto by default (25 Sep), and solvePlan sends an unset riskAbove to the auto rule');
ok(D.giaTiers === 'refused' && /if \(opts\.giaTiers\) throw/.test(src), 'the taxable-account tier: decided refused, and solvePlan throws on it');
// the regimen's margins
const keys = Object.keys(MARGINS);
ok(D.margins && keys.length === Object.keys(D.margins).length && keys.every(k => D.margins[k] === MARGINS[k]), `the regimen's margins: decided ${JSON.stringify(D.margins)}, stats.mjs ${JSON.stringify(MARGINS)}`);
ok(marginFor(D.margins.highAt) === D.margins.high && marginFor(D.margins.highAt - 0.1) === D.margins.low, `marginFor splits at the decided ${D.margins.highAt}%`);
const r7e = readFileSync(join(HERE, '../solver/reduce-7e.mjs'), 'utf8');
ok(/const marginOf = marginFor;/.test(r7e) && /POOL_FLOOR = -MARGINS\.pooled/.test(r7e), "7e's reducer reads the decided margins from stats.mjs, not its own numbers");
// planted: the check must be able to fail
const drifted = { ...D, raiseCap: 1.2 };
ok(drifted.raiseCap !== PRODUCT_DEFAULTS.raiseCap, 'planted: a decided raise cap of 1.2 against the code\'s 1.1 would fail the raiseCap line');
const driftM = { ...D.margins, high: 0.5 };
ok(!keys.every(k => driftM[k] === MARGINS[k]), 'planted: a decided high margin of 0.5 against stats.mjs\'s 0.25 would fail the margins line');
ok(!/only as an opt-in \(`riskAbove`/.test(src), 'no comment in solve.js still calls risk above an opt-in');

console.log(`\n${n} passed`);
