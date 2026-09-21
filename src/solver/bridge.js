/*
 * THE BRIDGE (solver plan, Phase 3): a solved table as the plan's policy.
 *
 * `tablePolicy(r)` turns a solve result into `spending.policyOverride = { kind: 'table', choose }`, which
 * the engine honours at the top of every year: it maps its exact state to the solver's position, asks the
 * table for the move at that position, and executes the move through its own machinery. The engine
 * keeps every rule it has (tax, MPAA, CGT, the audit row); the table only chooses.
 *
 * `withTable(plan, r)` attaches it. The override holds a function, so attach it AFTER normalizePlan and
 * resolveMpaa, which copy the plan through JSON, and hand the result straight to buildContext,
 * simulateDeterministic or monteCarlo.
 */
import { vecOf } from './grid.js';
import { chooseAction } from './solve.js';

/* The engine's state as the reduced model's, without copying the pots: the names differ, the numbers do not. */
export function modelStateOf(engineState) {
  return {
    pots: engineState.pots, basis: engineState.giaBasis, cgtCarry: engineState.cgtCarry, cumPcls: engineState.cumPcls,
    lumpTaken: engineState.lumpSumTaken, cashIsa: engineState.cashIsa, guard: null
  };
}

/* A short code for the audit row: the draw order's first pot, the harvest, the level and the tiers. */
function codeOf(a, ca) {
  const first = a.steps[0].replace('pen', 'P').replace('isa', 'I').replace('cash', 'C').replace('other', 'G');
  return `${first}${a.harvest ? (a.harvestCeil === 'basic' ? 'h+' : 'h') : ''}${a.spendLevel !== undefined && a.spendLevel !== 1 ? ` ${Math.round(a.spendLevel * 100)}%` : ''}${ca.tierPen || ca.tierIsa ? ` t${ca.tierPen}${ca.tierIsa}` : ''}`;
}

export function tablePolicy(r) {
  const { m, c, actions } = r;
  return {
    kind: 'table',
    choose(engineState, t, held) {
      const s = vecOf(m, modelStateOf(engineState));
      const ai = chooseAction(r, s, t, held ? { pen: held.pen, isa: held.isa } : null);
      const a = actions[ai], ca = c.acts[ai];
      return {
        steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa',
        lump: !!a.lump, sweepCash: a.sweepCash !== false, spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1,
        tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code: codeOf(a, ca)
      };
    },
    switchCost: c.switchCost || 0,
    meta: r.meta
  };
}

export function withTable(plan, r) {
  return { ...plan, spending: { ...plan.spending, policyOverride: tablePolicy(r) } };
}
