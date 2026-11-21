/*
 * STEP 8'S PORT, THE REVIEWER'S FIX ROUND ON D135'S CHANGE OF DEFAULT (findings 1 and 3; EXPLORATORY, no path run): what the
 * page's cut (src/solverCouple.js householdCut) now does that it did not, counted on the plans it reaches.
 *   - Finding 1: a household whose plan leaves its minimum pot at nought is given the one its table is solved with, one year of
 *     its target. Before, the assembly refused every such couple (plant 'hhzerofloor').
 *   - Finding 3: a partner's own ceilings that are the first person's, wrapper for wrapper, are no ceilings of the partner's
 *     own. Before, the household plan refused them by their presence (plant 'partceilkey').
 * For each plan, the cut as the code now makes it is compared with the cut under each plant, which is the cut before that fix:
 *   1. step 8's 40 panel units, each as its audit handed the solvers (shapes-panel.mjs solverPlanOf, 'own'). The identity
 *      (results-household-port-identity.txt, 15 of them) was run before the fix, so a unit whose cut is unchanged keeps it;
 *   2. the library's 210 couples as entered: how many leave their minimum pot at nought, and how many cuts each fix changes;
 *   3. the same couples with the limits as the card leaves them set back to free (tierCeiling and tierCeilingPart, both
 *      wrappers free): how many the household plan took before the fix, and how many it takes now.
 *   node research/solver/household-port-floor.mjs > research/solver/results-household-port-floor.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdCut, PLANT } from '../../src/solverCouple.js';
import { readHspPanel } from './household-hsp-panel.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';

const FORM = 'pensionsPA', js = x => JSON.stringify(x);
const cutUnder = (plan, rule) => { PLANT.rule = rule; try { return householdCut(E, M, plan, FORM); } catch (e) { return { refused: e.message }; } finally { PLANT.rule = ''; } };
const brief = c => (c.refused ? `refused (${c.refused.slice(0, 60)})` : 'taken');
console.log(`STEP 8'S PORT, THE FIX ROUND'S REACH (EXPLORATORY, no path run): the page's cut now against the cut under each plant; this code ${(codeId() || {}).hash || 'unknown'}`);

// 1. step 8's panel
{ const units = readHspPanel(); let same = 0; const changed = [];
  for (const u of units) {
    const { hp } = solverPlanOf(u.plan, 'own'), now = cutUnder(hp, ''), a = cutUnder(hp, 'hhzerofloor'), b = cutUnder(hp, 'partceilkey');
    if (js(now) === js(a) && js(now) === js(b)) same++; else changed.push(u.id);
  }
  console.log(`1. step 8's panel: ${units.length} units, the cut unchanged by either fix on ${same}${changed.length ? `; CHANGED on ${changed.join(', ')}` : ''}`);
}

// 2. the library's couples as entered
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
{ let zero = 0, floorChanged = 0, ceilChanged = 0, refusedNow = 0, refusedBefore = 0;
  for (const c of couples) {
    const now = cutUnder(c.plan, ''), a = cutUnder(c.plan, 'hhzerofloor'), b = cutUnder(c.plan, 'partceilkey');
    if (!(E.num(c.plan.config && c.plan.config.solvencyFloor, 0) > 0)) zero++;
    if (now.refused) refusedNow++;
    if (a.refused) refusedBefore++;
    if (js(now) !== js(a)) floorChanged++;
    if (js(now) !== js(b)) ceilChanged++;
  }
  console.log(`2. the library's ${couples.length} couples as entered: ${zero} leave their minimum pot at nought; the cut changed by the minimum pot's fix on ${floorChanged}, by the ceilings' on ${ceilChanged}; refused by the household plan now ${refusedNow}`);
}

// 3. the same couples with the limits as the card leaves them set back to free
{ let before = 0, now = 0; const sample = [];
  for (const c of couples) {
    const p = { ...c.plan, solver: { ...(c.plan.solver || {}), locks: { pensionBefore: null, tierCeiling: { pen: null, isa: null }, lumpSum: 'free', tierCeilingPart: { pen: null, isa: null } } } };
    const n = cutUnder(p, ''), b = cutUnder(p, 'partceilkey');
    if (!b.refused) before++;
    if (!n.refused) now++;
    if (sample.length < 2) sample.push(`${c.id}: before ${brief(b)}, now ${brief(n)}`);
  }
  console.log(`3. the same couples with the limits as the card leaves them set back to free: taken by the household plan before the fix ${before} of ${couples.length}, now ${now} (${sample.join('; ')})`);
}
