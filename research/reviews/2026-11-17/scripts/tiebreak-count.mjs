/*
 * WHERE THE TIE-BREAK ABOVE THE CAP HAS SOMETHING TO DO (the review, 17 Nov; EXPLORATORY; a smoke at six points, so no
 * outcome). PRESCRIPTIVE-PLAN.md step 1 asks for a check that the household's move is the single chooser's with its
 * tie-break on, failing on a plant that takes the tie-break off. That check is empty on a unit whose household is
 * rarely above its estate cap. Here, at household.test.mjs check 4's settings (6 points, the light lattice, 20 paths of
 * seed 99002), along the path of the single chooser's move at the even split in the exact model: the decisions, those
 * with the household above its cap, those at which the pick with the tie-break on differs from the pick with it off,
 * and of those how many are at or below the cap (there should be none). And the split: at how many decisions no split
 * scores more than 1e-9 above the even one by the household table's value, and at how many of those a rule that keeps the
 * first best in the order 0 to 1 would take another split (the plan's plant 'tiezero', and what the review's HT5 did).
 *   node research/reviews/2026-11-17/scripts/tiebreak-count.mjs <unit id>
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import { solveHousehold, mergedState, householdValue } from '../../../solver/household.mjs';
import { chooseAction } from '../../../../src/solver/solve.js';
import { vecOf } from '../../../../src/solver/grid.js';
import * as CPL from '../../../../src/solver/couple.js';
import { solveForApp } from '../../../../src/solverApp.js';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS } from '../../../solver/audit-household.mjs';
const id = process.argv[2], u = UNITS.find(x => x.id === id), U = u.panel === 'd4b' ? readPanel(PANEL_FILE).find(x => x.id === id) : readSharePanel().find(x => x.id === id);
const a = armA(appPlan(U.plan), { tournament: false }), hp = solverPlan('CANDC', U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy }, 0.02);
const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const cp = solveHousehold(E, M, hp, { solveOne: (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { ...light } }), topK: 1 });
const H = cp.H, H0 = { ...H, tieAboveCap: 0 }, m = cp.m, T = m.ctx.totalYears, tH = H.c.acts.some(x => (x.tierPen || 0) > 0 || (x.tierIsa || 0) > 0);
let dec = 0, above = 0, differ = 0, differBelow = 0, searched = 0, kept = 0, firstOther = 0;
for (const zs of E.pathsForSeed(99002, 20, T)) {
  const state = M.initialState(m);
  for (let t = 0; t <= T; t++) {
    const s = vecOf(H.m, mergedState(cp, state)), held = tH ? { pen: (state.tierHeld && state.tierHeld.self && state.tierHeld.self.pen) || 0, isa: (state.tierHeld && state.tierHeld.self && state.tierHeld.self.isa) || 0 } : null;
    const ai = chooseAction(H, s, t, held), a0 = chooseAction(H0, s, t, held);
    const up = s[0] + s[1] + s[2] > H.estateCap;
    dec++; if (up) above++; if (ai !== a0) { differ++; if (!up) differBelow++; }
    // the split: each of the five valued as PRESCRIPTIVE-PLAN.md's 'best5' values it; does any beat the even one?
    if (t < T) {
      const a2 = H.actions[ai], po2 = { steps: a2.steps, harvest: !!a2.harvest, harvestCeil: a2.harvestCeil || 'pa', tierPen: a2.tierPen || 0, tierIsa: a2.tierIsa || 0 };
      const mk = split => ({ steps: a2.steps, costSteps: a2.costSteps || a2.steps, harvest: !!a2.harvest, harvestCeil: a2.harvestCeil || 'pa', sweepCash: true, ...(a2.sweepIsa ? { sweepIsa: true } : {}), lump: !!a2.lump, contrib: null, spendLevel: H.levelOf ? H.levelOf[ai] : 1, split, switchCost: cp.switchCost || 0, perOwner: { self: { ...po2 }, part: { ...po2 } } });
      const val = split => { const st = M.cloneState(state), row = M.step(m, st, mk(split), t, null, true); return row.unmetDemand > 1 || row.preNmpaInsolvent ? -Infinity : householdValue(cp, st, t, null, ai); };
      const v = [0, 0.25, 0.5, 0.75, 1].map(val);
      searched++;
      if (v[2] > -Infinity && Math.max(v[0], v[1], v[3], v[4]) <= v[2] + 1e-9) { kept++; let first = 0; for (let i = 1; i < 5; i++) if (v[i] > v[first]) first = i; if (first !== 2) firstOther++; }
    }
    const act = H.actions[ai], po = { steps: act.steps, harvest: !!act.harvest, harvestCeil: act.harvestCeil || 'pa', tierPen: act.tierPen || 0, tierIsa: act.tierIsa || 0 };
    const joint = { steps: act.steps, costSteps: act.costSteps || act.steps, harvest: !!act.harvest, harvestCeil: act.harvestCeil || 'pa', sweepCash: true, ...(act.sweepIsa ? { sweepIsa: true } : {}), lump: !!act.lump, contrib: null, spendLevel: H.levelOf ? H.levelOf[ai] : 1, split: 0.5, switchCost: cp.switchCost || 0, perOwner: { self: { ...po }, part: { ...po } } };
    const row = M.step(m, state, joint, t, CPL.ratesAt(m, zs, t));
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
  }
}
console.log(`${id} at 6 points, 20 paths of seed 99002: ${dec} decisions, the household above its cap at ${above}, the tie-break changing the chooser's pick at ${differ}, of them at or below the cap ${differBelow}`);
console.log(`  the split, at the ${searched} decisions before the plan's last year: no other split scores more than 1e-9 above the even one at ${kept}; at ${firstOther} of those the first best in the order 0, 0.25, 0.5, 0.75, 1 is not the even one`);
