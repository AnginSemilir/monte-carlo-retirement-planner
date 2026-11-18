/*
 * THE FACTORIALS' HOUSEHOLDS, ARM A AS IT PICKS TODAY (B7-FACTORIALS.md amendment 1; EXPLORATORY): on Phase 4's windfall and saving
 * households, arm A's pick on the code as it stands against the pick recorded at the landing (28 Oct).
 *   node research/solver/b7-labels.mjs
 */
import * as E from '../engine.mjs';
import { readPanel, appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { windfallIds } from './audit-windfall.mjs';
import * as S from './audit-save.mjs';
const panel = readPanel(), by = Object.fromEntries(panel.map(h => [h.id, h]));
const saveIds = S.saveIds(panel);
for (const [what, ids] of [['windfall', windfallIds(panel)], ['save', saveIds]]) {
  let differ = 0;
  for (const id of ids) { const h = by[id], a = armA(appPlan(h.plan), { tournament: false }); if (a.label !== h.label) { differ++; console.log(`${what} ${id}: today ${a.label}; landing ${h.label}`); } }
  console.log(`${what}: ${ids.length} households, ${differ} whose arm A pick differs today`);
}
