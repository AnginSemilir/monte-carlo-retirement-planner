/*
 * EACH UNIT'S ESTATE CAP (the review, 17 Nov; EXPLORATORY). The capped pot of JOINT-WIDE's rule (reduce-joint-wide.mjs: the
 * mean of each path's pot left, counted up to the two tables' estate caps together) needs each unit's cap, which pilot.mjs
 * did not store. The cap is the estate term's top (solve.js researchFinish: terminal.beqOf(Infinity)), set by the plan and
 * not by the table's size, so it is read here from a solve at six points; pilot-extra.mjs stores it from its own solves at
 * 45, and the units both ran agree (pilot-read.mjs checks).
 *   node research/reviews/2026-11-17/scripts/caps.mjs <unit id> ...   (writes ../units/caps.json, adding to it)
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import * as CPL from '../../../../src/solver/couple.js';
import { solveHousehold } from '../../../solver/household.mjs';
import { solveForApp } from '../../../../src/solverApp.js';
import { APP_COUPLE, appJoint } from '../../../../src/solverSettings.js';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS } from '../../../solver/audit-household.mjs';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), FILE = process.env.CAPS_FILE || join(HERE, '..', 'units', 'caps.json');
mkdirSync(dirname(FILE), { recursive: true });
const caps = existsSync(FILE) ? JSON.parse(readFileSync(FILE)) : {};
const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
for (const id of process.argv.slice(2)) {
  const u = UNITS.find(x => x.id === id);
  if (!u) { console.error(`caps: ${id} is not a unit of the lead test's panel`); process.exit(2); }
  const U = u.panel === 'd4b' ? readPanel(PANEL_FILE).find(x => x.id === id) : readSharePanel().find(x => x.id === id);
  const a = armA(appPlan(U.plan), { tournament: false });
  const hp = solverPlan('CANDC', U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy }, 0.02);
  const solveOne = (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } });
  const k2 = CPL.solveCouple(E, M, hp, { solveOne, shareRule: APP_COUPLE.shareRule, ...appJoint() }), house = solveHousehold(E, M, hp, { solveOne, topK: 3 });
  caps[id] = { cap: (k2.tables.self.estateCap || 0) + (k2.tables.part.estateCap || 0), houseCap: house.H.estateCap || 0 };
  console.log(`${id}: the two tables' caps together ${Math.round(caps[id].cap)}, the household table's ${Math.round(caps[id].houseCap)}`);
  writeFileSync(FILE, JSON.stringify(caps, null, 1));
}
