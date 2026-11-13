/*
 * PART D, D4: THE CANDIDATE FOR COUPLES AGAINST THE APP'S RULES AND THE PRODUCT'S SETTINGS, SCORED BY THE ENGINE (the launch
 * plan's section 6, D4; built as Phase 4's audit was, audit-phase4.mjs, whose path runner, inputs hash and solver plan it takes).
 * Per couple of couples-panel.json, its plan (couple-panel.mjs planOf: the landed target, the floor at 80%, the minimum pot
 * written in, the one-off costs kept, the candidate's return assumptions on every arm), and per unit:
 *   APP      arm A, the app's rules: its withdrawal-policy search on the couple's own plan (searched on seed 7001; no
 *            tournament, D36), guardrails on, the lookahead at 5 years, raises capped at 110% (couple-panel.mjs appPlan,
 *            select-phase4.mjs armA);
 *   CANDC/W  the candidate for couples: each person's table solved as the app solves a single's (src/solverApp.js
 *            solveForApp: the candidate's settings at the app's 45 points, the floor, the aims at the dial's 1, the estate
 *            'standard' at W 0.02 and 'lower' at 0.01), the two run by the couples' rollout (src/solver/couple.js, Part D's D1
 *            to D3), executed by the engine (couple.js withCouple);
 *   SHIPC/W  the couples' solver at the product's settings: each person's table at PRODUCT_BASELINE's settings (solvePlan, 30
 *            points, lambda as 7u-F's, the estate weight W), the same rollout, executed by the engine.
 * The solver arms solve the couple's plan with guardrails and the lookahead off, its windfalls routed as arm A routes them
 * (audit-phase4.mjs solverPlanOf, D37). Each unit is run on N paths of the seed: every path's survival, estate, wealth at the
 * end, spending delivered over every year, unmet spending, lifetime tax, the year it failed, each year's spend as a share of
 * its target, and the spending delivered in the one-off costs' years (the cost years, reported apart); the engine's own year
 * path by path (audit-phase4.mjs runPath), held to E.runTrial on the first CHECK paths; on the solver arms the couples'
 * rollout in the exact model (runCouplePolicy) beside the engine on the first BESIDE paths (the fidelity check). Every unit
 * records its engine context's inputs hash (a couple's five units held to one plan), the target the engine ran, its
 * configuration's hash (CONFIG), each person's run record, the cost years and whether either person is retired in each, and
 * the solve's seconds. A unit runs in CHUNKS_OF[arm] chunks of its paths, each its own process (the solve repeated, the paths
 * split evenly: path i is path i of the seed whichever chunk runs it), so no process nears the harness's 12-hour limit (the
 * design review of 7 Nov, MINOR 5); the check against E.runTrial and the rollout beside run on the unit's first paths, in its
 * first chunk. Each chunk's arrays go to results/d4-run (D4_OUT), stamped with the code, the files in STAMP_FILES and the
 * Node version; the read joins a unit's chunks.
 * THE RE-RUN (registrations/couples-d4b.md; the review of 9 Nov, items 1 and 9; D66, D67): the same 40 couples landed again on
 * the code after items 2 to 5 (couples-panel-d4b.json), the same seed, and item 9's two stages: every unit's first STAGE1 paths
 * (its chunk 0), then, for each couple and weight whose CANDC survival on them is below APP's plus STAGE_BAR points
 * (stage-couples.mjs, the registered stage gate, into the run's stage2.json), the rest of its N in CHUNKS2[arm] chunks (CANDC
 * at that weight, and APP where either weight goes on); a couple and weight at or above the bar stops there.
 * THE REVISION OF 11 NOV (the external review's ANSWERS-2026-11-11.md, sections 3 and 4; D78, D80): SHIPC is reported, not
 * deciding, and runs the first SHIP_N paths of each of its units, in one chunk, in the first stage alone: it has no second-stage
 * chunk whatever the stage gate decides (the check against E.runTrial and the rollout beside run inside those paths). The
 * candidate is af001697ce1b (D73's port: the sweep to the ISA, the solve on anchors and shortlists, the thinner bridge
 * reference); each person's run record gains `sweepCashIsaTo` and `coarse`, and the unit's records COUPLE.flat and COUPLE.fast
 * as run (the review's items 11 and 2) and what D80 rules out (a shortlist, item 12's options, item 13's tie-break), each
 * read by its name where the code has it. The unit numbers changed with SHIPC's chunks: the first stage's are as they were
 * (0 to 199 over the 40 couples); the second stage's are 200 to 479 (CANDC 200 to 439, APP 440 to 479), where they were
 * 200 to 559 (CANDC 200 to 439, SHIPC 440 to 519, APP 520 to 559).
 *   node research/solver/audit-couples.mjs registered part k/n         the registered run (seed SEED, each couple's paths)
 *   node research/solver/audit-couples.mjs --unit-files                each chunk's number and the arrays file it writes
 *   node research/solver/audit-couples.mjs --stage-units 1             the stage-1 units' numbers, one a line
 *   node research/solver/audit-couples.mjs --stage-units 2 <stage2.json>  the stage-2 units' numbers for the couples going on
 *   node research/solver/audit-couples.mjs <paths> part k/n <seed>     the pilot (D4_PILOT=1) or a preflight
 *   node research/solver/audit-couples.mjs --units                     the unit count (chunks)
 *   node research/solver/audit-couples.mjs --planted                   the audit's own checks on planted cases
 *   D4_ONLY=<id>,<id> limits the couples, D4_W the estate weight, D4_ARMS the arms, D4_PTS the solves' wealth points (the pilot
 *   and smoke tests only: the registered run refuses them)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as SOLVE from '../../src/solver/solve.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp, appPlan as appSolverPlan, prepareForSolve, APP_CANDIDATE, APP_COARSE } from '../../src/solverApp.js';
import { hashOf } from './candidate.mjs';
import { readPanel, appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, inputsHash, solverPlanOf } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: CANDC solves through solveForApp (the app's path; the pin is the candidate's research path's); SHIPC's solvePlan is the product's settings

// the solver's and the couples' modules whole (not by name), so D80's guard can read a switch a later port adds (d80Of)
const { solvePlan, PRODUCT_BASELINE } = SOLVE, { solveCouple, withCouple, runCouplePolicy, COUPLE } = CPL;
const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7021, PILOT_SEED = 7002, CAND_PTS = 45, SHIP_PTS = 30, LAMBDA = 0.0223606797749979;
export const WEIGHTS = ['0.02', '0.01'], CHECK = 200, BESIDE = 500;
/* D4's one-stage chunks, kept as its record (the re-run's are CHUNKS2, below): CANDC's younger units took about 9.9 hours at
   19,000 paths whole (D4's pilot), SHIPC's about 3 */
export const CHUNKS_OF = { CANDC: 4, SHIPC: 2, APP: 1 };
/* the paths a chunk runs, [lo, hi) of the unit's N */
export const chunkRange = (N, J, j) => [Math.floor((j * N) / J), Math.floor(((j + 1) * N) / J)];
/* item 9's two stages (couples-d4b.md): chunk 0 is the first STAGE1 paths; chunks 1 to CHUNKS2[arm] split [STAGE1, N) evenly.
   SHIPC (reported, not deciding: D78) is its chunk 0 alone, the first SHIP_N paths of the unit, and has no second stage */
export const STAGE1 = 5000, STAGE_BAR = 0.5, SHIP_N = 1000, CHUNKS2 = { CANDC: 3, SHIPC: 0, APP: 1 };
export const chunksOf = arm => 1 + CHUNKS2[arm];
export const firstOf = arm => (arm === 'SHIPC' ? SHIP_N : STAGE1);
export const rangeOf = (N, arm, j) => {
  const n1 = Math.min(firstOf(arm), N);
  if (j === 0) return [0, n1];
  const K = CHUNKS2[arm], R = N - n1;
  if (!K) return [n1, n1];   // the arm has no such chunk: nought paths
  return [n1 + Math.floor(((j - 1) * R) / K), n1 + Math.floor((j * R) / K)];
};
/* the adaptive reference's lattice as the candidate sets it (APP_CANDIDATE.adaptiveLattice, the thinner one since D73);
   'unbuilt' where no bridge year was read */
export const LATTICE = '80x21x64+foot+stepAll';
const latticeName = L => `${L.na}x${L.nb}x${L.nz}${L.foot ? '+foot' : ''}${L.stepAll ? '+stepAll' : ''}`;
/* the solve on anchors and shortlists (D73; `meta.coarse`), named as solve-cfg.mjs names a setting: on with the candidate's
   setting where the person's solve has the joint tier state; where it has none, off with solveForApp's reason (D74), its
   spaces written as underscores so the record stays one word; 'none' where the solve was never handed it (SHIPC) */
export const COARSE_ON = 'w2a3b3g2c2-NT-LRVOH-h3', COARSE_OFF = 'off:no_joint_tier_state_on_this_solve:_the_whole_menu';
export const coarseName = c => (!c ? 'none' : c.off ? `off:${String(c.off).replace(/ /g, '_')}` : `w${c.w}a${c.a}b${c.b}g${c.g}c${c.c}-${c.src}-${c.expand}-h${c.climb}`);
export const PATHS_FILE = join(HERE, 'couples-paths-d4b.json'), REGISTRATION = 'research/solver/registrations/couples-d4b.md';
/* the re-run's panel: D4's 40 couples landed again (couple-panel.mjs reland); D4_PANEL another, for a pilot or preflight alone */
export const PANEL_FILE = process.env.D4_PANEL || join(HERE, 'couples-panel-d4b.json');
/* the files the stamp hashes, in this order (batch-couples.sh's AUDIT hashes the same list): this audit, the panel's code and arm
   A's, the code it borrows from Phase 4, the app's solve and its settings (CANDC's whole configuration), the candidate's hash,
   the frozen orders, the panel, the paths, and the read with the code it borrows, its provenance check (fair-gate.mjs) and
   audit-phase4.mjs's own import (the design reviews of 7 Nov: the first's BLOCKING 2, the second's MINOR 3) */
export const STAMP_FILES = ['audit-couples.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', '../../src/solverApp.js', '../../src/solverSettings.js', 'candidate.mjs', 'research-opts.mjs', 'couples-orders.json', 'couples-panel-d4b.json', 'couples-paths-d4b.json', 'reduce-couples.mjs', 'reduce-phase4.mjs', 'size-phase4.mjs', 'size-couples.mjs', 'stats.mjs', 'fair-gate.mjs', 'audit-7uf-checks.mjs', 'stage-couples.mjs'];
/* each solver arm's configuration, hashed as state.mjs prints it: CANDC the candidate (candidate.mjs hashOf over the app's own
   settings, APP_CANDIDATE), SHIPC the product's settings (sha256 of PRODUCT_BASELINE); the audit refuses any other */
export const CONFIG = { CANDC: 'af001697ce1b', SHIPC: '07c069b6e330' };   // CANDC: the candidate since D73's port (d71f65ae871e before it)
export const configOf = arm => (arm === 'CANDC' ? hashOf(APP_CANDIDATE) : createHash('sha256').update(JSON.stringify(PRODUCT_BASELINE)).digest('hex').slice(0, 12));
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) { const p = f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f); if (existsSync(p)) h.update(readFileSync(p)); }
  return h.digest('hex').slice(0, 12);
}
/* the units: every unit's stage-1 chunk first, then the stage-2 chunks (CANDC's and APP's: SHIPC has none); within each, CANDC
   at both weights, then SHIPC, then APP (the longest first) */
const unitList = ids => [...ids.flatMap(id => WEIGHTS.map(w => [id, 'CANDC', w])), ...ids.flatMap(id => WEIGHTS.map(w => [id, 'SHIPC', w])), ...ids.map(id => [id, 'APP', '-'])];
export const unitsOf = ids => [...unitList(ids).map(([id, arm, w]) => [id, arm, w, 0]), ...unitList(ids).flatMap(([id, arm, w]) => Array.from({ length: CHUNKS2[arm] }, (_, j) => [id, arm, w, j + 1]))];
/* the stage-2 chunks a stage gate's decision runs: CANDC at each weight going on, APP where either does; SHIPC never */
export const goesOn = (on, id, arm, w) => (arm === 'SHIPC' ? false : arm === 'APP' ? on.some(x => x.id === id) : on.some(x => x.id === id && x.w === w));
/* the paths file as the sizing wrote it for this layout (size-couples.mjs): the registered run refuses any other */
export const pathsProblems = reg => [['n1', STAGE1], ['bar', STAGE_BAR], ['shipN', SHIP_N]].filter(([k, v]) => reg[k] !== v).map(([k, v]) => `couples-paths-d4b.json's ${k} is ${reg[k]}, not the audit's ${v} (size-couples.mjs writes it from the pilot)`);
/* the couples' path as the registration names it: the joint move on flat arrays (the review's item 11) and each person ranked
   from their chooser's shared scores (item 2), both exact and on; no unit runs, and the gate refuses one, with either off */
export const coupleProblems = (C = COUPLE) => ['flat', 'fast'].filter(k => C[k] !== true).map(k => `COUPLE.${k} ${C[k]} (want true)`);
/*
 * D80: NO REGISTERED COUPLES' ARM TAKES A SHORTLIST, ITEM 12'S OPTIONS OR ITEM 13'S TIE-BREAK. The committed code has none of
 * them; each is read by the name the review's prototypes and D81 give it, where the code has it, so a later port cannot reach a
 * registered arm unseen:
 *   shortlist  solve.js's SHORT (the chooser's shortlist, the review's item 7: its `on` and its `slice`), and `chooserShortlist`
 *              on a solved plan;
 *   item12     couple.js's COUPLE_APPROX (the approximate cuts to the joint move: oneRead, screen, nodraw, near, and the share
 *              search off its 8 points and 10 rounds);
 *   tieBreak   on a solved plan, `tieAboveCap` (item 13), and the chooser's `tieMargin` with the prototype's `tieSame` and
 *              `tieAbove` (`tieMargin` is in the code today, off: nought).
 * A solved plan is read on the result, its meta, each world's view and each table of a mixture. Each of the three reads
 * 'none' (no such name in this code), 'off:<the names found>' or 'ON:<the names on>'. The audit refuses to run on an ON; the
 * gate refuses a unit recording one, or not recording all three.
 */
export const D80 = {
  shortlist: { mod: [['SHORT.on'], ['SHORT.slice']], plan: ['chooserShortlist'] },
  item12: { mod: [['COUPLE_APPROX.oneRead'], ['COUPLE_APPROX.screen'], ['COUPLE_APPROX.nodraw'], ['COUPLE_APPROX.near'], ['COUPLE_APPROX.shareN', 8], ['COUPLE_APPROX.shareIters', 10]], plan: [] },
  tieBreak: { mod: [], plan: ['tieAboveCap', 'tieMargin', 'tieSame', 'tieAbove'] }
};
const viewsOf = r => [...new Set([r, ...(r.worlds || []), ...((r.mix && r.mix.tables) || [])].filter(Boolean).flatMap(x => [x, x.meta]).filter(Boolean))];
export function d80Of(mods = { SHORT: SOLVE.SHORT, COUPLE_APPROX: CPL.COUPLE_APPROX }, tabs = []) {
  const out = {};
  for (const [k, { mod, plan }] of Object.entries(D80)) {
    const found = [], on = [];
    for (const [nm, offAt] of mod) { const [o, f] = nm.split('.'), v = mods[o] ? mods[o][f] : undefined; if (v === undefined) continue; found.push(nm); if (v && v !== offAt) on.push(nm); }
    for (const nm of plan) { const vs = tabs.flatMap(viewsOf).filter(x => nm in x).map(x => x[nm]); if (!vs.length) continue; found.push(nm); if (vs.some(v => !!v)) on.push(nm); }
    out[k] = on.length ? `ON:${on.join(',')}` : found.length ? `off:${found.join(',')}` : 'none';
  }
  return out;
}
export const d80Problems = d => Object.keys(D80).filter(k => !/^(none|off:\S+)$/.test(d[k] || '')).map(k => `${k} ${d[k]} (D80: none in a registered couples' arm)`);
export const fileOf = (id, arm, w, j = 0) => `${id}-${arm.toLowerCase()}-w${w}-c${j}.json.gz`;
/* the cost years: each one-off cost's year as the engine's year index */
export const costYearsOf = ctx => [...new Set([...(ctx.oneOffCosts instanceof Map ? ctx.oneOffCosts.keys() : [])].map(y => Number(y) - ctx.baseYear).filter(t => t >= 0 && t <= ctx.totalYears))].sort((a, b) => a - b);   // the engine keeps a Map of year to amount
/* whether either person is retired in year t (the engine's own rule, stepYear: working while age0 + t is below the retirement
   age): a year with no one retired has no living spending, so its spending delivered is nought on every path in every arm and
   the read leaves it out of the cost years' spending (the design review of 7 Nov, BLOCKING 1) */
export const retiredAt = (ctx, t) => ctx.owners.some(o => o.age0 + t >= o.retireAge);

/* each person's table as the arm solves it */
export function solveArm(arm, hp, W, pts) {
  if (arm === 'CANDC') return solveCouple(E, M, hp, { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0 }) });
  return solveCouple(E, M, hp, { solveOne: (p) => solvePlan(E, M, p, { lambda: LAMBDA, points: pts, bequestWeight: W }) });
}
/* the plan each solver arm solves: the couple's with arm A's routing, guardrails and the lookahead off; CANDC's prepared as the
   app prepares a plan (prepareForSolve, appPlan: the candidate's tier returns, the same as candidatePlan's), its estate aim W */
export function solverPlan(arm, base, aPol, W) {
  const routed = solverPlanOf(base, aPol);
  if (arm === 'CANDC') return appSolverPlan(E, prepareForSolve(E, { ...routed, solver: { aims: { cuts: 1, estate: W === 0.01 ? 'lower' : 'standard', raises: 'capped', riskConsent: true } } }));
  return E.resolveMpaa(E.normalizePlan({ ...routed, config: { ...routed.config, guardrails: false, lookaheadYears: 0 } }));
}
const readerYearsOf = r => { const rd = (r.mix ? r.mix.tables[0].g : r.g).reader; return rd ? Array.from(rd.years).reduce((s, x) => s + x, 0) : 0; };
const latticeOf = r => { const rd = (r.mix ? r.mix.tables[0].g : r.g).reader, L = rd && rd.adaptive ? rd.adaptive.lattice : null; return L ? latticeName(L) : 'unbuilt'; };
const settingsOf = r => `pts ${r.g.np} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} raiseW ${r.meta.raiseWeight} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} readerRef ${r.meta.readerRef} readerSplit ${r.meta.readerSplit} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} switchCharge ${r.switchCharge || 0} e3 ${!!r.meta.e3} e3pcls ${!!r.meta.e3pcls} hr ${r.actions.some(a => a.steps.includes('penHR') || a.harvestCeil === 'hr') ? 'yes' : 'no'} jointWorlds ${!!r.meta.jointWorlds} bridgeStep ${r.meta.bridgeStep} switchMargin ${r.meta.switchMargin || 0} pclsInterp ${!!r.g.pclsInterp} lattice ${latticeOf(r)} failDelivered ${!!r.meta.failDelivered} minPot ${E.num(r.m.ctx.solvencyFloor, 0)} readerYears ${readerYearsOf(r)} sweepCashIsaTo ${r.meta.sweepCashIsaTo || 'unset'} coarse ${coarseName(r.meta.coarse)}`;
/* what each person's run record must say (the read's copy: reduce-couples.mjs WANT). Since D73's port a CANDC person's also
   says where the year's sweep sends cash ISA money ('isa'; fair-variables row 35) and whether the solve took the solve on
   anchors (row 36; coarseWant, below); SHIPC's, the product's settings, has neither */
export const WANT = {
  CANDC: { pts: String(CAND_PTS), bridgeRead: 'reader', readerRef: 'adaptive', readerSplit: 'rs', tiersBelow: '3', tableDealing: 'false', switchCharge: '0.001', e3: 'true', e3pcls: 'true', hr: 'yes', jointWorlds: 'true', bridgeStep: 'exact', switchMargin: '0', pclsInterp: 'true', failDelivered: 'true', lambda: String(LAMBDA), sweepCashIsaTo: 'isa' },
  SHIPC: { pts: String(SHIP_PTS), bridgeRead: 'false', tierState: 'null', tiersBelow: '2', tableDealing: 'true', e3: 'false', e3pcls: 'false', hr: 'no', jointWorlds: 'false', failDelivered: 'false', lambda: String(LAMBDA), sweepCashIsaTo: 'unset', coarse: 'none' }
};
/* the solve on anchors a CANDC person must record: the candidate's setting where their solve has the joint tier state, off
   with its reason where it has none (consent withdrawn, or one tier pair: solve.js coarseWhereFits) */
export const coarseWant = got => (got.tierState === undefined || got.tierState === 'null' ? COARSE_OFF : COARSE_ON);
export const wantProblems = (arm, line, W, ptsFree = false) => {
  const got = Object.fromEntries(line.match(/(\S+) (\S+)/g).map(x => x.split(' ')));
  const bad = Object.entries(WANT[arm]).filter(([k, v]) => !(ptsFree && k === 'pts') && got[k] !== v).map(([k, v]) => `${k} ${got[k]} (want ${v})`);
  if (Number(got.bequestWeight) !== W) bad.push(`bequestWeight ${got.bequestWeight} (want ${W})`);
  if (arm === 'CANDC' && got.lattice !== LATTICE && got.lattice !== 'unbuilt') bad.push(`lattice ${got.lattice} (want ${LATTICE}, or unbuilt)`);
  if (arm === 'CANDC' && got.coarse !== coarseWant(got)) bad.push(`coarse ${got.coarse} (want ${coarseWant(got)}: ${coarseWant(got) === COARSE_ON ? 'the joint tier state' : 'no joint tier state'})`);
  return bad;
};

/* the audit's own checks on planted cases (CHECKLIST 5; the design review of 7 Nov, MINOR 9) */
async function planted() {
  // a CANDC person's record as the registration has it: the joint tier state (four pairs), the lattice, the solve on anchors on
  const cases = [], lineOf = (arm, over = {}) => Object.entries({ ...WANT[arm], bequestWeight: '0.02', ...(arm === 'CANDC' ? { lattice: LATTICE, tierState: '0/0,1/1,2/2,3/3', coarse: COARSE_ON } : {}), ...over }).map(([k, v]) => `${k} ${v}`).join(' ');
  cases.push(['the candidate\'s run record as registered: no problem', `${wantProblems('CANDC', lineOf('CANDC'), 0.02).length}`, '0']);
  cases.push(['a CANDC person solved without HR (menuPlus removed) is named', wantProblems('CANDC', lineOf('CANDC', { hr: 'no' }), 0.02).join(';'), 'hr no (want yes)']);
  // D73's port: the thinner reference (the lattice before it is now the wrong one)
  cases.push(['a CANDC person on another lattice (the one before D73) is named; an unbuilt one (no bridge year read) is not', `${wantProblems('CANDC', lineOf('CANDC', { lattice: '160x41x128+foot+stepAll' }), 0.02).length} ${wantProblems('CANDC', lineOf('CANDC', { lattice: 'unbuilt' }), 0.02).length}`, '1 0']);
  cases.push(['a SHIPC person with e3pcls on, or at the other estate weight, is named', `${wantProblems('SHIPC', lineOf('SHIPC', { e3pcls: 'true' }), 0.02).length} ${wantProblems('SHIPC', lineOf('SHIPC'), 0.01).length}`, '1 1']);
  cases.push(['each arm\'s configuration the registration\'s (CANDC the candidate since D73\'s port); the candidate without menuPlus, or without the sweep to the ISA, hashes otherwise', `${configOf('CANDC') === CONFIG.CANDC} ${configOf('SHIPC') === CONFIG.SHIPC} ${hashOf({ ...APP_CANDIDATE, menuPlus: undefined }) === CONFIG.CANDC} ${hashOf({ ...APP_CANDIDATE, sweepCashIsaTo: undefined }) === CONFIG.CANDC}`, 'true true false false']);
  cases.push(['the candidate\'s own settings spell the registration\'s: the lattice, the solve on anchors, the sweep', `${latticeName(APP_CANDIDATE.adaptiveLattice) === LATTICE} ${coarseName(APP_CANDIDATE.coarse) === COARSE_ON} ${coarseName(APP_COARSE) === COARSE_ON} ${APP_CANDIDATE.sweepCashIsaTo}`, 'true true true isa']);
  // the two settings each person's record gains (fair-variables rows 35 and 36)
  cases.push(['a CANDC person without the sweep to the ISA is named; a SHIPC person with it is named', `${wantProblems('CANDC', lineOf('CANDC', { sweepCashIsaTo: 'unset' }), 0.02).join(';')} | ${wantProblems('SHIPC', lineOf('SHIPC', { sweepCashIsaTo: 'isa' }), 0.02).join(';')}`, 'sweepCashIsaTo unset (want isa) | sweepCashIsaTo isa (want unset)']);
  cases.push(['a CANDC person with the joint tier state must record the solve on anchors on: none, off, or another setting is named', `${[{ coarse: 'none' }, { coarse: COARSE_OFF }, { coarse: 'w2a2b2g2c2-NT-LRVOH-h3' }].map(o => wantProblems('CANDC', lineOf('CANDC', o), 0.02).length).join(' ')} ${wantProblems('CANDC', lineOf('CANDC', { coarse: 'none' }), 0.02)[0]}`, `1 1 1 coarse none (want ${COARSE_ON}: the joint tier state)`]);
  cases.push(['a CANDC person with no joint tier state must record it off with the reason: off for it is not named; on, none, or off for another reason is', `${[{ coarse: COARSE_OFF }, { coarse: COARSE_ON }, { coarse: 'none' }, { coarse: 'off:a_locked_dial_position_keeps_the_whole_menu' }].map(o => wantProblems('CANDC', lineOf('CANDC', { tierState: 'null', ...o }), 0.02).filter(x => x.startsWith('coarse')).length).join(' ')}`, '0 1 1 1']);
  cases.push(['the names as the solve writes them: its setting, its off with the reason, and none', `${coarseName({ w: 2, a: 3, b: 3, g: 2, c: 2, src: 'NT', expand: 'LRVOH', climb: 3, fine: 9 })} ${coarseName({ off: 'no joint tier state on this solve: the whole menu' }) === COARSE_OFF} ${coarseName(undefined)}`, `${COARSE_ON} true none`]);
  cases.push(['a SHIPC person handed the solve on anchors is named', wantProblems('SHIPC', lineOf('SHIPC', { coarse: COARSE_ON }), 0.02).join(';'), `coarse ${COARSE_ON} (want none)`]);
  // items 11 and 2 as run
  cases.push(['the couples\' path: flat and fast on, no problem; either off is named', `${coupleProblems().length} ${coupleProblems({ flat: false, fast: true }).join(';')} | ${coupleProblems({ flat: true, fast: false }).join(';')}`, '0 COUPLE.flat false (want true) | COUPLE.fast false (want true)']);
  // D80: read by name where the code has it
  const tab = (over = {}, meta = {}) => ({ tieMargin: 0, meta: { ...meta }, worlds: null, ...over });
  { const now = d80Of(undefined, [tab(), tab()]), bare = d80Of({}, [{ meta: {} }]);
    cases.push(['D80 on the code as committed: no shortlist and no item 12 option in it, the chooser\'s tieMargin there and off; nothing refused', `${now.shortlist} ${now.item12} ${now.tieBreak} ${d80Problems(now).length} | ${bare.shortlist} ${bare.item12} ${bare.tieBreak} ${d80Problems(bare).length}`, 'none none off:tieMargin 0 | none none none 0']); }
  { const off = d80Of({ SHORT: { on: false, slice: false }, COUPLE_APPROX: { oneRead: false, shareN: 8, shareIters: 10, screen: 0, nodraw: false, near: false } }, [tab({ tieAboveCap: 0, tieSame: false, tieAbove: false }, { chooserShortlist: null })]);
    cases.push(['D80 after a port with every option off: each named as found, nothing refused', `${off.shortlist} ${off.item12} ${off.tieBreak} ${d80Problems(off).length}`, 'off:SHORT.on,SHORT.slice,chooserShortlist off:COUPLE_APPROX.oneRead,COUPLE_APPROX.screen,COUPLE_APPROX.nodraw,COUPLE_APPROX.near,COUPLE_APPROX.shareN,COUPLE_APPROX.shareIters off:tieAboveCap,tieMargin,tieSame,tieAbove 0']); }
  { const on = [d80Of({ SHORT: { on: true, slice: false } }, [tab()]), d80Of({ SHORT: { on: false, slice: true } }, [tab()]), d80Of({}, [tab(), tab({}, { chooserShortlist: 'order' })]),
      d80Of({ COUPLE_APPROX: { near: true } }, [tab()]), d80Of({ COUPLE_APPROX: { screen: 3 } }, [tab()]), d80Of({ COUPLE_APPROX: { shareN: 4, shareIters: 10 } }, [tab()]),
      d80Of({}, [tab({ tieAboveCap: 0.001 })]), d80Of({}, [tab({ tieMargin: 0.002 })]), d80Of({}, [tab({ worlds: [{ tieAboveCap: 0.001, meta: {} }] })]), d80Of({}, [tab({ mix: { tables: [{ tieMargin: 0.002, meta: {} }] } })])];
    cases.push(['D80 refuses each one on: the shortlist, its slice, a plan\'s chooserShortlist; item 12\'s near, screen, a shorter share search; the tie-break above the cap, the tie margin, on a world\'s view, on a mixture\'s table', `${on.map(d => d80Problems(d).length).join('')} ${on[0].shortlist} ${on[3].item12} ${on[6].tieBreak} ${d80Problems(on[6])[0]}`, '1111111111 ON:SHORT.on ON:COUPLE_APPROX.near ON:tieAboveCap tieBreak ON:tieAboveCap (D80: none in a registered couples\' arm)']); }
  cases.push(['a record without D80\'s three, or with one missing, is refused', `${d80Problems({}).length} ${d80Problems({ shortlist: 'none', item12: 'none' }).join(';')}`, '3 tieBreak undefined (D80: none in a registered couples\' arm)']);
  const ctx = { oneOffCosts: new Map([[2029, 5000], [2070, 1], [2020, 1]]), baseYear: 2026, totalYears: 30 };
  cases.push(['the cost years from the engine\'s Map, those outside the horizon left out; a plain object none', `${costYearsOf(ctx).join(',')} ${costYearsOf({ ...ctx, oneOffCosts: { 2029: 5000 } }).length}`, '3 0']);
  const young = { owners: [{ age0: 37, retireAge: 52 }, { age0: 34, retireAge: 52 }] };
  cases.push(['retired in year t when either person is at their retirement age (37 and 34, retiring at 52: not in year 3 or 14, in year 15)', `${retiredAt(young, 3)} ${retiredAt(young, 14)} ${retiredAt(young, 15)}`, 'false false true']);
  const covers = (N, arm) => { const J = chunksOf(arm), r = Array.from({ length: J }, (_, j) => rangeOf(N, arm, j)); return r[0][0] === 0 && r[0][1] === Math.min(STAGE1, N) && r[J - 1][1] === N && r.every(([a, b], j) => a <= b && (j === 0 || a === r[j - 1][1])); };
  // SHIPC left this case on 11 Nov (D78): it no longer covers a unit's N, and has its own case below
  cases.push(['the two stages\' chunks cover a unit\'s paths once, in order (19,000: CANDC, APP; 5,000 and 7 paths)', `${covers(19000, 'CANDC')} ${covers(19000, 'APP')} ${covers(5000, 'CANDC')} ${covers(7, 'CANDC')} ${rangeOf(19000, 'CANDC', 0).join('-')} ${rangeOf(19000, 'CANDC', 3).join('-')}`, 'true true true true 0-5000 14333-19000']);
  cases.push(['SHIPC is one chunk of its unit\'s first 1,000 paths (of 600, all 600), with no second-stage chunk; the check against E.runTrial and the rollout beside lie inside it', `${chunksOf('SHIPC')} ${rangeOf(19000, 'SHIPC', 0).join('-')} ${rangeOf(600, 'SHIPC', 0).join('-')} ${rangeOf(19000, 'SHIPC', 1).join('-')} ${CHECK <= SHIP_N && BESIDE <= SHIP_N}`, '1 0-1000 0-600 1000-1000 true']);
  // the units' numbers changed with SHIPC's chunks (28 for two couples before: SHIPC two chunks a unit)
  const U = unitsOf(['X', 'Y']), per = k => U.filter(u => u.slice(0, 3).join('/') === k).length, firstTwo = U.findIndex(u => u[3] > 0);
  cases.push(['the units: every stage-1 chunk first, then CANDC\'s and APP\'s stage-2 chunks, the longest first; SHIPC one chunk a unit', `${U.length} ${firstTwo} ${per('X/CANDC/0.02')} ${per('X/SHIPC/0.01')} ${per('Y/APP/-')} ${U[0][1]} ${U[firstTwo - 1][1]} ${U[U.length - 1][1]} ${U.filter(u => u[1] === 'SHIPC' && u[3] > 0).length}`, '24 10 4 1 2 CANDC APP APP 0']);
  { const U40 = unitsOf(Array.from({ length: 40 }, (_, i) => `H${i}`)), s2 = U40.map((u, k) => [u, k]).filter(([u]) => u[3] > 0), at = arm => s2.filter(([u]) => u[1] === arm).map(([, k]) => k);
    cases.push(['over 40 couples: 480 chunks, the first stage 0 to 199 (SHIPC 80 to 159), the second CANDC 200 to 439 and APP 440 to 479', `${U40.length} ${U40.filter(u => u[3] === 0).length} ${U40.findIndex(u => u[1] === 'SHIPC')}-${U40.findLastIndex(u => u[1] === 'SHIPC')} ${at('CANDC')[0]}-${at('CANDC').pop()} ${at('APP')[0]}-${at('APP').pop()} ${at('SHIPC').length}`, '480 200 80-159 200-439 440-479 0']); }
  const on = [{ id: 'X', w: '0.01' }];
  cases.push(['a stage gate\'s decision runs CANDC at the weight going on and APP, nothing else: no SHIPC chunk, whatever it decides', `${U.filter(([id, arm, w, j]) => j > 0 && goesOn(on, id, arm, w)).map(([id, arm, w]) => `${id}${arm[0]}${w === '-' ? '' : w.slice(-1)}`).join(',')} ${goesOn(on, 'X', 'SHIPC', '0.01')} ${goesOn([{ id: 'X', w: '0.02' }, { id: 'X', w: '0.01' }], 'X', 'SHIPC', '0.02')}`, 'XC1,XC1,XC1,XA false false']);
  cases.push(['the paths file must be the sizing\'s for this layout: one written before SHIPC\'s 1,000 paths (no shipN) is refused; one with it is not', `${pathsProblems({ n1: 5000, bar: 0.5 }).length} ${pathsProblems({ n1: 5000, bar: 0.5, shipN: 1000 }).length} ${pathsProblems({ n1: 5000, bar: 0.5, shipN: 5000 }).length}`, '1 0 1']);
  // the read's and the stage gate's copies of what this audit sets (reduce-couples.mjs, stage-couples.mjs)
  { const R = await import('./reduce-couples.mjs'), G = await import('./stage-couples.mjs'), J = x => JSON.stringify(x);
    cases.push(['the read\'s and the stage gate\'s copies are the audit\'s: the configurations, the lattice, the chunks, each person\'s settings, the solve on anchors, the stages and SHIPC\'s paths', `${J(R.CONFIG) === J(CONFIG)} ${R.LATTICE === LATTICE} ${J(R.CHUNKS2) === J(CHUNKS2)} ${J(R.WANT) === J(WANT)} ${R.COARSE_ON === COARSE_ON && R.COARSE_OFF === COARSE_OFF} ${R.LAYOUT.n1 === STAGE1 && R.LAYOUT.bar === STAGE_BAR && R.LAYOUT.ship === SHIP_N} ${G.STAGE1 === STAGE1 && G.STAGE_BAR === STAGE_BAR && G.SHIP_N === SHIP_N}`, 'true true true true true true true']); }
  let bad = 0;
  for (const [nm, got, w] of cases) { const ok = got === w; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${w})`}`); }
  console.log('EDGES: a lattice unbuilt, a cost year past the horizon, a year with no one retired, a chunk of nought paths, a unit of fewer paths than SHIPC\'s 1,000, a person with no joint tier state, D80\'s names absent from the code, present and off, and each one on');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const panel = readPanel(PANEL_FILE), byId = Object.fromEntries(panel.map(h => [h.id, h]));
  if (args[0] === '--units') { console.log(`over ${panel.length} couples:`); console.log(unitsOf(panel.map(h => h.id)).length); process.exit(0); }
  // each chunk's number and the arrays file it writes (backup-chunks.sh: a log is read for its done line alone)
  if (args[0] === '--unit-files') { unitsOf(panel.map(h => h.id)).forEach(([id, arm, w, j], k) => console.log(`${k} ${fileOf(id, arm, w, j)}`)); process.exit(0); }
  if (args[0] === '--stage-units') {
    const U = unitsOf(panel.map(h => h.id));
    if (args[1] === '1') U.forEach((u, k) => { if (u[3] === 0) console.log(k); });
    else if (args[1] === '2') { const on = JSON.parse(readFileSync(args[2], 'utf8')).continue; U.forEach(([id, arm, w, j], k) => { if (j > 0 && goesOn(on, id, arm, w)) console.log(k); }); }
    else { console.error('audit-couples: --stage-units 1, or 2 <stage2.json>'); process.exit(2); }
    process.exit(0);
  }
  if (args[0] === '--planted') process.exit((await planted()) ? 1 : 0);
  const REGISTERED = args[0] === 'registered', PILOT = process.env.D4_PILOT === '1';
  // no run, registered or not, with the couples' path off its flat arrays or its shared scores, or with anything D80 rules out
  // switched on in the solver's or the couples' module (each solved plan is read again once it is solved, below)
  { const bad = [...coupleProblems(), ...d80Problems(d80Of())]; if (bad.length) { console.error(`audit-couples: ${bad.join('; ')}`); process.exit(2); } }
  if (REGISTERED && (process.env.D4_ONLY || process.env.D4_W || process.env.D4_ARMS || process.env.D4_PTS || process.env.D4_PANEL || process.env.D4_PILOT)) { console.error('audit-couples: the registered run takes no limits'); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-couples: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  // the registered run only on the code the couples were landed on (the design review of 11 Nov, MINOR 1): a change of code
  // before launch means landing again, a new pilot and a new design review
  if (REGISTERED) { const pc = JSON.parse(readFileSync(PANEL_FILE, 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-couples: the code ${cc ? cc.hash : 'unknown'} is not the code the panel was landed on (${pc}): land again, pilot and review again`); process.exit(2); } }
  const SEED_RUN = REGISTERED ? SEED : Number(args[3]);
  if (!REGISTERED && (!(SEED_RUN > 0) || SEED_RUN === SEED)) { console.error(`audit-couples: a run other than the registered one needs a seed, and not ${SEED}`); process.exit(2); }
  const [pk, pn] = (args[2] || '0/1').split('/').map(Number);
  const reg = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')) : null, pathsOf = reg && reg.paths;
  // the registered run only on a paths file the sizing wrote for these stages and SHIPC's paths
  if (REGISTERED && pathsProblems(reg).length) { console.error(`audit-couples: ${pathsProblems(reg).join('; ')}`); process.exit(2); }
  const nOf = id => (REGISTERED ? pathsOf[id] : Number(args[0]));
  const only = process.env.D4_ONLY ? new Set(process.env.D4_ONLY.split(',')) : null, arms = process.env.D4_ARMS ? new Set(process.env.D4_ARMS.split(',')) : null;
  const UNITS = unitsOf(panel.map(h => h.id).filter(id => !only || only.has(id))).filter(([, arm, w]) => (!arms || arms.has(arm)) && (!process.env.D4_W || w === '-' || w === process.env.D4_W));
  const OUT = process.env.D4_OUT || join(HERE, 'results', REGISTERED ? 'd4b-run' : PILOT ? 'd4-pilot' : 'd4-preflight');
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`D4B${REGISTERED ? '' : PILOT ? ' (THE PILOT)' : ' (A PREFLIGHT)'}: APP, CANDC (${CAND_PTS} points) and SHIPC (${SHIP_PTS} points, the first ${SHIP_N} paths of each unit alone) at the estate weights ${WEIGHTS.join(' and ')}; seed ${SEED_RUN}; ${UNITS.length} units; part ${pk}/${pn}; node ${STAMP.node}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const surv = A => (100 * A.survived.reduce((a, x) => a + x, 0) / A.survived.length);

  UNITS.forEach(([id, arm, w, j], i) => {
    if (i % pn !== pk) return;
    const J = chunksOf(arm), h = byId[id], N = nOf(id), [lo, hi] = rangeOf(N, arm, j), L = `${arm}${w === '-' ? '' : `/W${w}`} c${j}/${J}`, base = h.plan, t0 = Date.now();
    if (hi <= lo) return;   // a second-stage chunk with no paths (a pilot or preflight within the first stage)
    console.log(`${id.padEnd(8)} case | unit ${L} | cohort ${h.cohort} target ${h.target} paths ${N}, this chunk ${lo} to ${hi}`);
    const a = armA(appPlan(base), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
    if (a.label !== h.label) { console.error(`audit-couples: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    let ctx, cp = null, solveSecs = 0, ran;
    if (arm === 'APP') {
      ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-couples: ${id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, couple ${ctx.isCouple}`); process.exit(3); }
      ran = `armA ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears} raiseCap ${ctx.raiseCapFrac} minPot ${ctx.solvencyFloor} target ${ctx.targetSpend}`;
    } else {
      const W = Number(w), pts = Number(process.env.D4_PTS) || (arm === 'CANDC' ? CAND_PTS : SHIP_PTS), config = configOf(arm);
      if (config !== CONFIG[arm]) { console.error(`audit-couples: ${id} ${L}: the arm's configuration hashes ${config}, not the registration's ${CONFIG[arm]}`); process.exit(3); }
      cp = solveArm(arm, solverPlan(arm, base, aPol, W), W, pts);
      solveSecs = (Date.now() - t0) / 1000;
      const lines = ['self', 'part'].map(who => settingsOf(cp.tables[who]));
      for (const [k, line] of lines.entries()) { const bad = wantProblems(arm, line, W, !!process.env.D4_PTS); if (bad.length) { console.error(`audit-couples: ${id} ${L} ${k ? 'part' : 'self'}: ${bad.join('; ')}`); process.exit(3); } }
      if (cp.m.ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0)) { console.error(`audit-couples: ${id} ${L}: the household's minimum pot ${cp.m.ctx.solvencyFloor}, not the panel's ${base.config.solvencyFloor}`); process.exit(3); }
      // D80, on the plans as solved: neither person's carries a shortlist or a tie-break (the modules' switches read again)
      const d80 = d80Of(undefined, [cp.tables.self, cp.tables.part]), off = [...coupleProblems(), ...d80Problems(d80)];
      if (off.length) { console.error(`audit-couples: ${id} ${L}: ${off.join('; ')}`); process.exit(3); }
      ctx = E.buildContext(withCouple(cp.plan, cp));
      ran = `config ${config} hhMinPot ${cp.m.ctx.solvencyFloor} share ${cp.share} shareRule ${cp.meta.shareRule} flat ${COUPLE.flat} fast ${COUPLE.fast} shortlist ${d80.shortlist} item12 ${d80.item12} tieBreak ${d80.tieBreak} | self: ${lines[0]} | part: ${lines[1]}`;
    }
    const T = ctx.totalYears, Y = T + 1, inputs = inputsHash(ctx), costYears = costYearsOf(ctx), costRetired = costYears.map(t => retiredAt(ctx, t));
    console.log(`${''.padEnd(8)} ran ${L}: ${ran} inputs ${inputs} costYears ${costYears.map((t, q) => `${t}${costRetired[q] ? '' : ' (no one retired)'}`).join(',') || 'none'}${solveSecs ? ` | solve secs ${Math.round(solveSecs)}` : ''}`);
    // the chunk's paths: paths lo to hi of the seed's (path i draws from seed + 7919 i, whichever chunk runs it)
    const e0 = Date.now(), paths = E.pathsForSeed(SEED_RUN, hi, T).slice(lo), n = paths.length;
    const A = { survived: new Uint8Array(n), estate: new Float32Array(n), wealth: new Float32Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), tax: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y), costDelivered: new Float32Array(n) };
    let bad = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
      A.survived[k] = o.survived ? 1 : 0; A.estate[k] = o.estate; A.wealth[k] = o.wealth; A.delivered[k] = o.delivered; A.unmet[k] = o.unmet; A.tax[k] = o.tax; A.failYear[k] = o.failYear; A.level.set(o.level, k * Y);
      if (lo + k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-couples: ${id} ${L}: runPath differs from E.runTrial on ${bad} of the unit's first ${Math.min(CHECK, N)} paths`); process.exit(3); }
    // the cost years' spending delivered (each cost year's target less its unmet spending), path by path
    if (costYears.length) paths.forEach((zs0, k) => {
      const st = E.freshState(ctx), zs = Float64Array.from(zs0), zPath = zs.length > Y ? zs[Y] : 0; let d = 0;
      for (let t = 0; t <= Math.max(...costYears); t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); if (costYears.includes(t) && row.targetSpend > 0) d += Math.max(0, row.targetSpend - Math.max(0, row.unmetDemand || 0)); }
      A.costDelivered[k] = d;
    });
    const eSecs = (Date.now() - e0) / 1000;
    console.log(`${''.padEnd(8)} run ${L}: engine ${surv(A).toFixed(4)} on ${n}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
    // the couples' rollout in the exact model beside the engine on the unit's first BESIDE paths (its first chunk): a path one
    // survives and the other does not is a fidelity gap, reported
    let beside = null;
    if (cp && j === 0) {
      const NB = Math.min(n, BESIDE), pb = new Uint8Array(NB); let engineOnly = 0, modelOnly = 0;
      const b0 = Date.now();
      paths.slice(0, NB).forEach((zs, k) => { pb[k] = runCouplePolicy(cp, Float64Array.from(zs)).survived ? 1 : 0; if (A.survived[k] && !pb[k]) engineOnly++; if (pb[k] && !A.survived[k]) modelOnly++; });
      beside = { N: NB, survived: b64(pb), engineOnly, modelOnly, secs: (Date.now() - b0) / 1000 };
      console.log(`${''.padEnd(8)} beside ${L}: the rollout in the model ${(100 * pb.reduce((x, y) => x + y, 0) / NB).toFixed(4)} on ${NB}; the engine alone ${engineOnly}, the model alone ${modelOnly}`);
    }
    writeFileSync(join(OUT, fileOf(id, arm, w, j)), gzipSync(JSON.stringify({ id, arm, w, chunk: j, chunks: J, lo, hi, cohort: h.cohort, target: ctx.targetSpend, inputs, stamp: STAMP, ran, seed: SEED_RUN, N, n, Y, costYears, costRetired,
      solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, label: a.label, cpu: cpus()[0].model, beside,
      main: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(8)} done ${L} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
