/*
 * THE DECIDED DEFAULTS AND THE CODE MOVE TOGETHER (RULES.md rule 4). PLAN.md's <!-- decided-defaults --> block is what
 * the maintainer decided; solve.js is what runs. A decision recorded in one and not the other fails here - as bare
 * solve() carrying the old objective did (M1), and the defaults comment saying "opt-in" after risk above went on.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCT_DEFAULTS, PRODUCT_BASELINE } from '../../src/solver/solve.js';

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
// planted: the check must be able to fail
const drifted = { ...D, raiseCap: 1.2 };
ok(drifted.raiseCap !== PRODUCT_DEFAULTS.raiseCap, 'planted: a decided raise cap of 1.2 against the code\'s 1.1 would fail the raiseCap line');
ok(!/only as an opt-in \(`riskAbove`/.test(src), 'no comment in solve.js still calls risk above an opt-in');

console.log(`\n${n} passed`);
