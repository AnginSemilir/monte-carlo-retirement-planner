/*
 * TWO MECHANISMS OF PRESCRIPTIVE-PLAN.md, TRIED BEFORE THEY WERE PRESCRIBED (the review, 17 Nov; EXPLORATORY; a smoke at
 * six points on seed 99005, so its outcomes are not figures: only whether paths are the same).
 *   1. One household table for every household arm. The plan solves the household table once, with the candidate's
 *      tie-break above the cap left on, and has design A as built read it too. Here design A as built is run on a table
 *      solved with the tie-break off (as the lead test's audit solves it), on one solved with it on, and on a copy of
 *      that one with the setting taken off: the paths must be the same, since its ranking takes the chooser's scores
 *      and the tie-break changes only the chooser's pick.
 *   2. The capital gains band. The household's solve is run with the engine's default basic band limit doubled for that
 *      call alone and put back: the household plan's band must be two people's, the couple's model a person's, and the
 *      engine's default what it was.
 *   node research/reviews/2026-11-17/scripts/onetable-smoke.mjs <unit id> [paths 60]
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import { solveHousehold, withHousehold, householdPlanFor } from '../../../solver/household.mjs';
import { solveForApp } from '../../../../src/solverApp.js';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { runPath } from '../../../solver/audit-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS } from '../../../solver/audit-household.mjs';
const [id, nArg] = process.argv.slice(2), n = Number(nArg) || 60, pts = 6;
const u = UNITS.find(x => x.id === id), U = u.panel === 'd4b' ? readPanel(PANEL_FILE).find(x => x.id === id) : readSharePanel().find(x => x.id === id);
const a = armA(appPlan(U.plan), { tournament: false }), hp = solverPlan('CANDC', U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy }, 0.02), aDemo = E.resolveMpaa(a.planState).demographics;
const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const withTwoBands = (fn) => { const old = E.DEFAULT_CONFIG.basicBandLimit; E.DEFAULT_CONFIG.basicBandLimit = 2 * old; try { return fn(); } finally { E.DEFAULT_CONFIG.basicBandLimit = old; } };
const off = solveHousehold(E, M, hp, { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } }), topK: 3, tieJoint: 1e-4, holdPast: 2 });
const on = solveHousehold(E, M, hp, { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { ...light } }), topK: 3, tieJoint: 1e-4, holdPast: 2 });
const band = solveHousehold(E, M, hp, { solveOne: (p, o) => withTwoBands(() => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { ...light } })), topK: 3, tieJoint: 1e-4, holdPast: 2 });
console.log(`${id} (a smoke: 6 points, seed 99005): the table's tie-break above the cap, off ${off.H.tieAboveCap} and on ${on.H.tieAboveCap}; the capital gains band: the household plan as built ${on.hm.ctx.P.cgtBandWidth}, with the helper ${band.hm.ctx.P.cgtBandWidth}, a person's in the couple's model ${band.m.ctx.P.cgtBandWidth}; the engine's default after ${E.DEFAULT_CONFIG.basicBandLimit}`);
const withAges = plan => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
const T = off.m.ctx.totalYears, paths = E.pathsForSeed(99005, n, T).map(zs => Float64Array.from(zs));
const run = cp => { const ctx = E.buildContext(withHousehold(withAges(cp.plan), cp)); return paths.map(zs => { const r = runPath(ctx, zs, false); return [r.survived ? 1 : 0, Math.round(r.wealth), Math.round(r.tax), Math.round(r.delivered)].join(','); }); };
const A = run(off), C = run(on), B = run({ ...on, H: { ...on.H, tieAboveCap: undefined } });
const diff = (x, y) => x.filter((v, i) => v !== y[i]).length;
const cap = off.H.estateCap, above = paths.filter((zs, i) => Number(A[i].split(',')[1]) > cap).length;
console.log(`  design A as built on ${n} paths (${above} end above the cap ${cap}): the table solved with the tie-break off against the table solved with it on, ${diff(A, C)} paths differ; against a copy of that table with the setting taken off, ${diff(A, B)} differ`);
