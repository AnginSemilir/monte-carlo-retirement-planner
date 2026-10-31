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

const N4_CODE = { hr: 'h++', pam: 'h-', bm: 'hm' };   // N4's research re-wrap ceilings (research/solver/n4-design.md); 'g' its CGT sale
/* A short code for the audit row: the draw order's first pot, the harvest, the level and the tiers. */
function codeOf(a, ca) {
  const first = a.steps[0].replace('pen', 'P').replace('isa', 'I').replace('cash', 'C').replace('other', 'G');
  return `${first}${a.harvest ? (a.harvestCeil === 'basic' ? 'h+' : N4_CODE[a.harvestCeil] || 'h') : ''}${a.cgtSale ? 'g' : ''}${a.spendLevel !== undefined && a.spendLevel !== 1 ? ` ${Math.round(a.spendLevel * 100)}%` : ''}${ca.tierPen || ca.tierIsa ? ` t${ca.tierPen}${ca.tierIsa}` : ''}`;
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
        lump: !!a.lump, sweepCash: a.sweepCash !== false, spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}),
        tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code: codeOf(a, ca),
        // the tiers by name too: the engine checks its own list's tier at each index against them (F2a, 21 Oct)
        tierPenName: c.tiers.pen[ca.tierPen || 0].name, tierIsaName: c.tiers.isa[ca.tierIsa || 0].name
      };
    },
    switchCost: c.switchCost || 0,
    tiersBelow: r.m.tiersBelow || 2,   // D28: the engine builds its tier list to the table's (App.jsx buildContext)
    meta: r.meta
  };
}

/* With guardrails and the cost lookahead off: the table chooses the spend level and the draw, and the engine refuses a
   table with either on (the external review of 21 Oct, F0a). */
export function withTable(plan, r) {
  return { ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: tablePolicy(r) } };
}
