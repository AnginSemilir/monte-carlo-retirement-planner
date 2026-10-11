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
import { MARGINS, marginFor, marginRel, relClearable, survivalChangeU } from '../solver/stats.mjs';

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
// the relative margin (the maintainer, 11 Oct: PR13's form): a tenth of the comparison arm's survival where smaller
ok(D.margins.rel === 0.1 && Math.abs(marginRel(0.42) - 0.042) < 1e-12 && marginRel(5) === D.margins.low && marginRel(50) === D.margins.low && marginRel(96) === D.margins.high && marginRel(0) === 0, `marginRel: the smaller of marginFor and ${D.margins.rel} of the arm's survival (S364's 0.42 gives 0.042; 5 and above unchanged)`);
ok(!(Math.abs(Math.min(marginFor(0.42), 0.2 * 0.42) - marginRel(0.42)) < 1e-12), 'planted: a fifth in place of the decided tenth would fail the marginRel line');
// inside the range where the relative margin binds (the plan-auditor's MINOR 2 of 11 Oct 07:51 UK: a form stepping at 1 point,
// or flooring at 0.25, passed the first pin)
const relAt = f => [1, 2, 3.3, 4.9].every(x => Math.abs(f(x) - Math.min(marginFor(x), 0.1 * x)) < 1e-12);
ok(relAt(marginRel), 'marginRel is a tenth of the survival at 1, 2, 3.3 and 4.9 points (0.1, 0.2, 0.33, 0.49)');
ok(!relAt(x => (x < 1 ? 0.1 * x : marginFor(x))) && !relAt(x => (x > 0.5 ? Math.max(0.25, Math.min(marginFor(x), 0.1 * x)) : 0.1 * x)), 'planted: a form stepping at 1 point, and one flooring at 0.25, fail that line');
// the floor: report-only where identical arms could not clear (about 39 surviving paths)
ok(D.marginRelFloor === 'report-only' && !relClearable(38, 8000) && relClearable(39, 8000) && !relClearable(0, 8000) && !relClearable(38, 16000) && relClearable(40, 16000), `the relative margin's floor: decided ${D.marginRelFloor}; identical arms clear from 39 surviving paths (8,000 and 16,000 paths), never at 0`);
ok(survivalChangeU(38, 0, 0, 8000 - 38).lo <= -marginRel(100 * 38 / 8000) && !((a, N) => a > 0)(0, 8000) && (a => a > 0)(38), 'planted: a floor that clears every household with survivors would pass 38 of 8,000, which identical arms cannot clear');
const r7e = readFileSync(join(HERE, '../solver/reduce-7e.mjs'), 'utf8');
ok(/const marginOf = marginFor;/.test(r7e) && /POOL_FLOOR = -MARGINS\.pooled/.test(r7e), "7e's reducer reads the decided margins from stats.mjs, not its own numbers");
// planted: the check must be able to fail
const drifted = { ...D, raiseCap: 1.2 };
ok(drifted.raiseCap !== PRODUCT_DEFAULTS.raiseCap, 'planted: a decided raise cap of 1.2 against the code\'s 1.1 would fail the raiseCap line');
const driftM = { ...D.margins, high: 0.5 };
ok(!keys.every(k => driftM[k] === MARGINS[k]), 'planted: a decided high margin of 0.5 against stats.mjs\'s 0.25 would fail the margins line');
ok(!/only as an opt-in \(`riskAbove`/.test(src), 'no comment in solve.js still calls risk above an opt-in');

console.log(`\n${n} passed`);
