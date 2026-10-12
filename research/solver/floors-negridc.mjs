/*
 * THE MINIMUM END POT EACH OF NE-GRID C'S HOUSEHOLDS IS SOLVED WITH (O146; predictions/diag-negrid-c.md). solvePlan
 * (solve.js) sets the model's solvencyFloor - the end-of-plan total a path must reach to count as surviving (solve.js
 * runPolicy's last year) - to the plan's own config.solvencyFloor, else to minPotYears (default 1) years of target spend;
 * minPotYears 0 is the product's way to none. This follows that rule and reads the floor back from the model's context
 * (M.prepare), with and without minPotYears 0, for the households C solves. Bridge 4 is S126's plan with its accounts and
 * ages changed (audit-negridc.mjs's variant), so S126's floor; the audit checks every job's own context against its
 * FLOORS, which must equal this.
 *   node research/solver/floors-negridc.mjs > research/solver/results-negridc-floors.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { PRODUCT_DEFAULTS } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
console.log(`the minimum end pot by solvePlan's rule (PRODUCT_DEFAULTS.minPotYears ${PRODUCT_DEFAULTS.minPotYears}), read from the model's context`);
let bad = 0;
for (const [name, id] of [['S380', 'S380'], ['S224', 'S224'], ['S364', 'S364'], ['bridge 4', 'S126']]) {
  const plan = E.normalizePlan(all.find(s => s.id === id).plan), own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0)), target = E.num(plan.spending && plan.spending.targetSpend, 0);
  const at = mp => { const years = mp !== undefined ? mp : PRODUCT_DEFAULTS.minPotYears, fp = own > 0 && mp === undefined ? own : Math.round(Math.max(0, years) * target); return M.prepare(E, fp === own ? plan : { ...plan, config: { ...plan.config, solvencyFloor: fp } }, { allowUnsupported: true }).ctx.solvencyFloor; };
  const f = at(undefined), f0 = at(0);
  if (f0 !== 0) bad++;
  console.log(`  ${name.padEnd(9)} (${id}): the plan's own ${own}, target spend ${target}: solved with ${f} (${(f / target).toFixed(2)} years of target spend); with minPotYears 0: ${f0}`);
}
if (bad) { console.log('FAIL: minPotYears 0 left a floor'); process.exit(1); }
