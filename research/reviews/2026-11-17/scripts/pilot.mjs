/*
 * THE REVIEW'S PILOT (17 Nov; EXPLORATORY, deciding nothing; the review's seeds only). One unit of the lead test's panel
 * (research/solver/audit-household.mjs UNITS), solved as that audit solves it, and run by the engine on the same paths under:
 *   K2     the couples' default (solveCouple on APP_COUPLE's share rule with appJoint: LOOKHOLD), as the lead test's K2;
 *   HOUSE  design A as the lead test runs it (research/solver/household.mjs: top three moves, five splits, the tie rule
 *          without the look, the hold);
 *   H1, H6 design A offering the household table's top one and top six moves;
 *   HS9    design A at nine funding splits (0, 0.125, ..., 1);
 *   CEIL   the household's synthetic single plan run as a single under its own table (bridge.js withTable): the world the
 *          household table was solved in, so what the table believes it can do.
 * Beside them: the household table's opening forecast, the two tables' product, each arm's solve seconds and CPU a path.
 * This is not the lead test (HOUSEHOLD.md section 5): other seeds, fewer paths, and no rule. Nothing of seed 7002 is run.
 *   node research/reviews/2026-11-17/scripts/pilot.mjs <unit id> [seed 99003] [paths 1500] [points 45] [arms K2,HOUSE,...]
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import * as CPL from '../../../../src/solver/couple.js';
import { solveHousehold, withHousehold, mergedState } from '../../../solver/household.mjs';
import { withTable } from '../../../../src/solver/bridge.js';
import { vecOf } from '../../../../src/solver/grid.js';
import { solveForApp } from '../../../../src/solverApp.js';
import { APP_COUPLE, appJoint } from '../../../../src/solverSettings.js';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { runPath } from '../../../solver/audit-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS, biasesOf } from '../../../solver/audit-household.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEEDS = [99001, 99002, 99003, 99004, 99005];
const [id, seedArg, nArg, ptsArg, armsArg] = process.argv.slice(2);
const seed = Number(seedArg) || 99003, n = Number(nArg) || 1500, pts = Number(ptsArg) || 45, W = 0.02;
if (!SEEDS.includes(seed)) { console.error(`pilot: seed ${seed} is not one of the review's (${SEEDS.join(', ')})`); process.exit(2); }
const u = UNITS.find(x => x.id === id);
if (!u) { console.error(`pilot: ${id} is not a unit of the lead test's panel`); process.exit(2); }
const ARMS = (armsArg || 'K2,HOUSE,H1,H6,HS9,CEIL').split(',');
const OUT = process.env.PILOT_OUT || join(HERE, '..', 'units', `pilot-${seed}-${pts}`);   // stored gzipped in the review's folder; the readers take either form
mkdirSync(OUT, { recursive: true });

const U = u.panel === 'd4b' ? readPanel(PANEL_FILE).find(x => x.id === id) : readSharePanel().find(x => x.id === id);
const a = armA(appPlan(U.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const hp = solverPlan('CANDC', U.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
const memo = new Map();
const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
const JOINT = { shareRule: APP_COUPLE.shareRule, ...appJoint() };
const S9 = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

const t0 = Date.now();
const needK2 = ARMS.includes('K2');
const k2 = needK2 ? CPL.solveCouple(E, M, hp, { solveOne, ...JOINT }) : null;
const t1 = Date.now();
const house = solveHousehold(E, M, hp, { solveOne, topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
const t2 = Date.now();
const solveSecs = { K2: (t1 - t0) / 1000, HOUSE: (t2 - t1) / 1000 };
// the variants share the household's table (the memo): only the rollout's width differs
const variant = (o) => solveHousehold(E, M, hp, { solveOne, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, ...o });
const cps = { K2: k2, HOUSE: house, H1: ARMS.includes('H1') ? variant({ topK: 1 }) : null, H6: ARMS.includes('H6') ? variant({ topK: 6 }) : null, HS9: ARMS.includes('HS9') ? variant({ topK: 3, splits: S9 }) : null };

const withAges = (plan) => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
const ctxOf = (arm) => {
  if (arm === 'K2') return E.buildContext(CPL.withCouple(withAges(k2.plan), k2));
  if (arm === 'CEIL') return E.buildContext(withTable(house.hplan, house.H));
  return E.buildContext(withHousehold(withAges(cps[arm].plan), cps[arm]));
};
const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
const st0 = M.initialState(house.m), forecast = { HOUSE: survAt(house.H, vecOf(house.hm, mergedState(house, st0))) };
if (k2) { const z0 = M.initialState(k2.m); forecast.K2 = survAt(k2.tables.self, vecOf(k2.tables.self.m, CPL.ownerState(z0, 'self'))) * survAt(k2.tables.part, vecOf(k2.tables.part.m, CPL.ownerState(z0, 'part'))); forecast.K2self = survAt(k2.tables.self, vecOf(k2.tables.self.m, CPL.ownerState(z0, 'self'))); forecast.K2part = survAt(k2.tables.part, vecOf(k2.tables.part.m, CPL.ownerState(z0, 'part'))); }
const bias = biasesOf(house.m), T = house.m.ctx.totalYears;
console.log(`PILOT (EXPLORATORY): ${id} (${u.group}), seed ${seed}, ${n} paths, ${pts} points; solved K2 ${solveSecs.K2.toFixed(0)} s, HOUSE ${solveSecs.HOUSE.toFixed(0)} s; share ${k2 ? k2.share : '-'}; T ${T}; biases: ${bias.lockedYears} locked years, pension share ${bias.penShareSelf.toFixed(2)}; forecasts: household ${forecast.HOUSE.toFixed(4)}, two tables ${k2 ? forecast.K2.toFixed(4) : '-'}`);

const paths = E.pathsForSeed(seed, n, T).map(zs => Float64Array.from(zs));
const arms = {};
for (const arm of ARMS) {
  const ctx = ctxOf(arm);
  if (ctx.totalYears !== T) { console.error(`pilot: ${id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
  const A = { survived: [], failYear: [], wealth: [], estate: [], tax: [], delivered: [], unmet: [] };
  for (let k = 0; k < Math.min(3, n); k++) runPath(ctx, paths[k], false);
  const c0 = process.cpuUsage();
  for (let k = 0; k < n; k++) { const r = runPath(ctx, paths[k], false); A.survived.push(r.survived ? 1 : 0); A.failYear.push(r.failYear); A.wealth.push(Math.round(r.wealth)); A.estate.push(Math.round(r.estate)); A.tax.push(Math.round(r.tax)); A.delivered.push(Math.round(r.delivered)); A.unmet.push(Math.round(r.unmet)); }
  const c = process.cpuUsage(c0), cpuMs = (c.user + c.system) / 1e3 / n;
  arms[arm] = { ...A, cpuMs };
  const s = A.survived.reduce((x, y) => x + y, 0);
  console.log(`  ${arm.padEnd(5)} survival ${(100 * s / n).toFixed(2)}% (${n - s} fail: ${A.failYear.filter((y, i) => !A.survived[i] && y === T).length} in the last year), CPU ${cpuMs.toFixed(1)} ms a path`);
}
writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, group: u.group, seed, n, pts, T, floor: house.m.ctx.solvencyFloor, target: hp.spending.targetSpend, share: k2 ? k2.share : null, bias, forecast, solveSecs, arms }));
console.log(`  done ${id} in ${Math.round((Date.now() - t0) / 1000)} s`);
