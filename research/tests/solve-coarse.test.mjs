/*
 * (Ported from the review of 9 Nov's tests/solve-coarse.test.mjs at c3fea94d, item 10's stage B, D73: the repository's imports,
 * the split through e2.mjs's solveSplit, a seventh check that a locked dial position keeps the whole menu, its plant
 * 'lockcoarse'; since D73 the candidate carries the setting, so the solves 'without the option' take it out.)
 * THE SOLVE ON ANCHORS AND SHORTLISTS (`opts.coarse`; the external review of 9 Nov, item 10; EXPLORATORY, research only, off
 * unless set). A year's cells are solved in two passes: the anchors on the whole menu, then every other cell on a shortlist
 * (coarseSetup, coarseMask, coarseCell and coarseSync at the end of src/solver/solve.js). The shortlist is an approximation, so
 * what is tested is everything around it that must be exact. Each check is shown failing on its plant (CHECKLIST 5).
 *   1. every cell an anchor (`w1a1b1`): each world's tables, every layer, bit for bit the solve's without the option - the
 *      two-pass loop and its hooks change nothing by themselves
 *   2. every move listed (`expand: 'E'`) at the setting's anchors: bit for bit the solve's without the option, on a household
 *      with no bridge year and on one with - a listed move is scored, summed over the worlds, chosen and stored exactly as the
 *      whole menu's code does it (the cell's arithmetic is a second copy of that code, and this is what holds the two together)
 *      plant `staleflow` (a move's flow kept from the cell before): the tables part
 *   3. the repeat-move rule (a listed move with an earlier listed move's position, growth class and layer takes its
 *      expectation): the setting's tables bit for bit the same with the rule and without (`memo: false`)
 *      plant `posonly` (the position alone matched, neither the growth class nor the layer): the tables part. In E5's path a
 *      move's layer is its own tier pair's, which fixes its class, so leaving out either alone changes nothing
 *   4. the setting itself, on one thread and split across two parts (the app's worker split, E2): bit for bit the same - the
 *      anchors are whole, and their copied cells made, before any part solves a cell between them
 *      plant `nocopy` (part 0 does not make the anchors' copied cells before the second pass): the tables part
 *   5. the setting's record: `meta.coarse` holds the strides, the sources, the widening, the rounds and the counts; every cell
 *      between anchors found a list (none fell back for want of one); the anchors' share of the cells is the strides' own
 *   6. refusal: outside the joint tier state's E5 path (`tsOnce: false`, which a locked dial position runs on) the option
 *      throws, so no solve takes it in silence where its arithmetic is not the path's
 *   7. a locked dial position keeps the whole menu, and meta.coarse says so; plant `lockcoarse` (SOLVE_COARSE_PLANT)
 *   8. consent to change risk withdrawn (one tier pair): the app's solve runs on the whole menu, its tables the solve's with the
 *      setting taken out, and meta.coarse says so (D74); plant `fitsall` (SOLVE_COARSE_PLANT: coarseFits says yes to every solve)
 *  10. stored solves (the port's step 8): a record made on the whole menu is refused by a solve on anchors, and the reverse; a
 *      record of its own kind restores to the same tables; plant `restoreany` (SOLVE_COARSE_PLANT)
 *   9. the predicate (solve.js coarseFits) is the refusal: over the options that take a solve off the path, the solve refuses
 *      exactly where the predicate says no
 * solve()'s bytecode under V8's limit with the hooks in is solve-size.test.mjs's check, unchanged.
 *  12. E5 against the layer loop with the sweep to the ISA on and the setting out: every table bit for bit
 *  11. --full only: the known answer, S116 at 45 points, 1,000 paths, survival within 0.5 points of the whole menu's
 *   node research/tests/solve-coarse.test.mjs [--full]     (quick: 4 points; --full: 6, and the known answer at 45)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp, PLANT as APP_PLANT } from '../../src/solverApp.js';
import { solvePlan, coarseFits, coarseWhereFits, tierPairsOf, COARSE } from '../../src/solver/solve.js';
import * as SS from '../../src/solverSettings.js';
import { solveSplit } from '../solver/e2.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { parseConfig, researchOf } from '../solver/solve-cfg.mjs';
import { tablesOf, digestOf, sizeOf } from '../../src/solverDigest.js';

const FULL = process.argv.includes('--full'), PTS = FULL ? 6 : 4, SETTING = 'w2a3b3g2c2-NT-LRVOH-h3';
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const all = buildScenarios(), rawOf = id => all.find(s => s.id === id).plan;
// the app's own solve of a plan at the dial's first position (solveForApp), with a setting's research options
const solve = (id, cfg, extra = {}) => solveForApp(E, M, E.normalizePlan(rawOf(id)), { points: PTS, research: { ...researchOf(cfg ? parseConfig(cfg) : null, LIGHT), ...extra } });
const KEYS = ['surv', 'beq', 'resil', 'short', 'pol', 'lsurv', 'lresil'];
const differ = (a, b) => { let d = 0, m = 0; const A = a.mix.tables, B = b.mix.tables;
  for (let k = 0; k < A.length; k++) for (let j = 0; j < A[k].tsLayers.length; j++) for (const key of KEYS) { const x = A[k].tsLayers[j][key], y = B[k].tsLayers[j][key]; if (!x) continue; for (let t = 0; t < x.length; t++) for (let i = 0; i < x[t].length; i++) { m++; if (!Object.is(x[t][i], y[t][i])) d++; } }
  return { d, m }; };
const said = ({ d, m }) => `${d} of ${m} table values differ`;

// the solve split across parts through e2.mjs's solveSplit (its e3pcls pin checked first)
function optionsOf(id, cfg) {
  const raw = rawOf(id), norm = E.normalizePlan(raw), aims = SS.aimsOptions(norm, SS.APP_DIAL_VARIANT), locked = SS.lockedPlan(E, norm).riskAbove === false ? { riskAbove: false } : {};
  return { plan: SS.appPlan(E, SS.prepareForSolve(E, raw)), opts: { ...SS.APP_CANDIDATE, ...aims, ...researchOf(parseConfig(cfg), LIGHT), lambda: aims.lambda, points: PTS, ...locked } };
}
const split = (id, cfg, parts) => { const { plan, opts } = optionsOf(id, cfg); return solveSplit(E, M, plan, opts, parts); };

const A = 'S116', B = 'S370';   // B has years before pension access (the bridge reader, its reference and the exact steps)
const baseA = solve(A, null), baseB = solve(B, null), baseOn = solveForApp(E, M, E.normalizePlan(rawOf(A)), { points: PTS, research: LIGHT });   // baseOn: the app's solve as it is, the candidate's setting on

// 1. every cell an anchor
{ const x = differ(baseA, solve(A, 'w1a1b1-NT-LRV')); ok(x.d === 0, `1. every cell an anchor, ${A} at ${PTS} points: ${said(x)} from the solve without the option`); }

// 2. every move listed, and its plant
for (const [id, base] of [[A, baseA], [B, baseB]]) { const x = differ(base, solve(id, 'w2a3b3g2c2-NT-E')); ok(x.d === 0, `2. every move listed at the cells between anchors, ${id} at ${PTS} points: ${said(x)} from the solve without the option`); }
{ const x = differ(baseA, solve(A, 'w2a3b3g2c2-NT-E-staleflow')); ok(x.d > 0, `2. planted (a move's flow kept from the cell before), ${A}: ${said(x)}`); }

// 3. the repeat-move rule, and its plant
const oneB = solve(B, SETTING);
{ const x = differ(oneB, solve(B, SETTING + '-nomemo')); ok(x.d === 0, `3. ${SETTING} on ${B} with the repeat-move rule against without it: ${said(x)} (${oneB.meta.coarse.hits} expectations taken from a listed move)`); }
{ const x = differ(oneB, solve(B, SETTING + '-posonly')); ok(x.d > 0, `3. planted (the position alone matched, neither the growth class nor the layer), ${B}: ${said(x)}`); }

// 4. the setting, one thread and split, and its plant
{ const x = differ(oneB, await split(B, SETTING, 2)); ok(x.d === 0, `4. ${SETTING} on ${B}, split across two parts against one thread: ${said(x)}`); }
{ const x = differ(oneB, await split(B, SETTING + '-nocopy', 2)); ok(x.d > 0, `4. planted (the anchors' copied cells not made before the second pass), ${B} split: ${said(x)}`); }

// 5. the record
{ const m = oneB.meta.coarse, g = oneB.g, dims = [g.np, g.ni, g.nt, g.gain.length, g.pcls.length], str = [2, 3, 3, 2, 2];
  const anchorsOn = (len, st) => { let c = 0; for (let i = 0; i < len; i++) if (i % st === 0 || i === len - 1) c++; return c; };
  const share = dims.reduce((p, len, d) => p * anchorsOn(len, str[d]) / len, 1);
  ok(!!m && m.w === 2 && m.a === 3 && m.b === 3 && m.g === 2 && m.c === 2 && m.src === 'NT' && m.expand === 'LRVOH' && m.climb === 3, `5. meta.coarse records the setting: ${JSON.stringify(m && { w: m.w, a: m.a, b: m.b, g: m.g, c: m.c, src: m.src, expand: m.expand, climb: m.climb })}`);
  ok(!!m && m.fine > 0 && m.fallback === 0, `5. ${m && m.fine} cells solved on a shortlist of ${m && (m.listed / m.fine).toFixed(1)} moves on average; cells with nothing listed ${m && m.fallback}`);
  ok(share > 0 && share < 0.2, `5. the anchors are ${(100 * share).toFixed(1)}% of the grid's cells at these strides (${dims.join(' x ')})`); }

// 6. refusal: the solve itself, handed the setting outside E5's path
{ const { plan, opts } = optionsOf(A, SETTING); let msg = ''; try { solvePlan(E, M, plan, { ...opts, tsOnce: false }); } catch (e) { msg = e.message; } ok(/coarse needs/.test(msg), `6. refused outside E5's path (tsOnce false): ${msg || 'NOT refused'}`); }

// 7. a locked dial position keeps the whole menu (D68): the app hands the candidate's setting to the position's base solve, never to
// the locked solve (tsOnce false); plant 'lockcoarse' (src/solverApp.js) hands it on, and the locked solve refuses
{
  const at3 = p => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), cuts: 3 } } });
  const run = () => solveForApp(E, M, E.normalizePlan(at3(rawOf(A))), { points: PTS, research: LIGHT });
  if (process.env.SOLVE_COARSE_PLANT === 'lockcoarse') APP_PLANT.rule = 'lockcoarse';
  let r = null, msg = ''; try { r = run(); } catch (e) { msg = e.message; }
  APP_PLANT.rule = '';
  ok(!!r && !!r.meta.coarse && /locked dial position/.test(r.meta.coarse.off || '') && r.meta.coarse.fine === undefined, `7. at the dial's position 3 the locked solve keeps the whole menu (meta.coarse ${r ? JSON.stringify(r.meta.coarse) : 'none'})${msg ? `: ${msg}` : ''}`);
}

// 8. consent to change risk withdrawn (one tier pair, no tier state: a real product case): the app's solve runs on the whole
// menu, its tables the solve's with the setting taken out by hand, and meta.coarse says so; plant 'fitsall' (solve.js COARSE.plant:
// coarseFits says yes to every solve) hands the setting on, and the solve refuses
{
  const noConsent = p => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), riskConsent: false } } });
  const run = extra => solveForApp(E, M, E.normalizePlan(noConsent(rawOf(A))), { points: PTS, research: { ...LIGHT, ...extra } });
  if (process.env.SOLVE_COARSE_PLANT === 'fitsall') COARSE.plant = 'fitsall';
  let r = null, msg = ''; try { r = run({}); } catch (e) { msg = e.message; }
  COARSE.plant = '';
  // no tier state, so no layers: the tables compared by their digest (src/solverDigest.js, every stored array)
  const dg = r ? await digestOf(tablesOf(r)) : '', dg0 = r ? await digestOf(tablesOf(run({ coarse: undefined }))) : 'none';
  ok(!!r && dg === dg0 && sizeOf(tablesOf(r)).values > 0 && !!r.meta.coarse && /no joint tier state/.test(r.meta.coarse.off || '') && !!r.meta.tierStateOff, `8. consent withdrawn on ${A}: the app's solve runs on the whole menu (${r ? `its ${sizeOf(tablesOf(r)).values} table values' digest ${dg.slice(0, 16)}, the solve's with the setting taken out ${dg0.slice(0, 16)}` : 'no solve'}; meta.coarse ${r ? JSON.stringify(r.meta.coarse) : 'none'})${msg ? `: ${msg}` : ''}`);
  // and where the solve can take it, the app's solve does (the record of check 5 is the app's own solve of B)
  ok(!!baseOn.meta.coarse && baseOn.meta.coarse.fine > 0 && !baseOn.meta.coarse.off, `8. where the solve can take it (${A}, consent as the plan's), the app's solve is on the shortlist: ${baseOn.meta.coarse && baseOn.meta.coarse.fine} cells`);
}

// 9. the predicate is the refusal: over the options that take a solve off the setting's path, solvePlan handed the setting
// throws its refusal exactly where coarseFits says no, and coarseSetup's own cross-check (the predicate against the solve's
// flags) never fires; coarseWhereFits takes the setting out of exactly those
{
  const { plan, opts } = optionsOf(A, SETTING);
  const cases = [['as the candidate', {}], ['tsOnce false', { tsOnce: false }], ['tsLean false', { tsLean: false }], ['payWhereOnePays', { payWhereOnePays: true }], ['countFailPicks', { countFailPicks: true }],
    ['consent withdrawn', { riskConsent: false }], ['a tsOnce plant', { tsOncePlant: 'nocharge' }], ['without joint worlds', { jointWorlds: false, readerRef: undefined, adaptiveLattice: undefined, readerSplit: undefined }],
    ['the table with the dealing cost', { tableDealing: true }]];
  const got = cases.map(([name, extra]) => {
    const o = { ...opts, ...extra, riskAbove: false }, fits = coarseFits(o, tierPairsOf(E, M, plan, o)), kept = coarseWhereFits(E, M, plan, o).coarse !== undefined;
    let msg = ''; if (!fits) { try { solvePlan(E, M, plan, o); msg = 'NOT refused'; } catch (e) { msg = e.message; } }
    return { name, fits, kept, okay: kept === fits && (fits ? true : /^coarse needs/.test(msg)), msg };
  });
  // and one tier pair by the plan itself (its pension and ISA held in Cash Equivalents, which have no step down): no tier state
  { const raw = rawOf(A), cash = { ...raw, accounts: raw.accounts.map(a => (/^(pen|isa)_/.test(a.id) ? { ...a, risk: 'Cash Equivalents' } : a)) }, planC = SS.appPlan(E, SS.prepareForSolve(E, cash)), o = { ...opts, riskAbove: false };
    const pairs = tierPairsOf(E, M, planC, o), fits = coarseFits(o, pairs), kept = coarseWhereFits(E, M, planC, o).coarse !== undefined;
    let msg = ''; try { solvePlan(E, M, planC, o); msg = 'NOT refused'; } catch (e) { msg = e.message; }
    got.push({ name: `one tier pair by the plan itself (${pairs})`, fits, kept, okay: pairs === 1 && !fits && !kept && /^coarse needs/.test(msg), msg }); }
  const bad = got.filter(x => !x.okay);
  ok(bad.length === 0 && got[0].fits && got.slice(1).every(x => !x.fits), `9. the predicate against the refusal on ${got.length} option sets: fits ${got.filter(x => x.fits).map(x => x.name).join(', ')}; refused ${got.filter(x => !x.fits).map(x => x.name).join(', ')}${bad.length ? `; WRONG: ${bad.map(x => `${x.name} (fits ${x.fits}, kept ${x.kept}: ${x.msg})`).join('; ')}` : ''}`);
}

// 10. stored solves (the port's step 8): a solve stored on the whole menu is not restored as one on anchors and shortlists, nor
// the reverse: the app's solve refuses the record; a record of its own kind restores to the same tables; plant 'restoreany'
// (src/solverApp.js) lets any record through
{
  const { cacheOf } = await import('../../src/solverCache.js');
  const noConsent = p => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), riskConsent: false } } });
  const app = (plan, extra = {}) => solveForApp(E, M, E.normalizePlan(plan), { points: PTS, research: LIGHT, ...extra });
  const whole = app(noConsent(rawOf(A))), recWhole = cacheOf(whole), recOn = cacheOf(baseOn);
  if (process.env.SOLVE_COARSE_PLANT === 'restoreany') APP_PLANT.rule = 'restoreany';
  const tryIt = f => { try { f(); return 'NOT refused'; } catch (e) { return e.message; } };
  // and a whole-menu record of the SAME plan (the setting taken out by hand: the same tier layers, so the solve's own count of
  // layers cannot refuse it): solveForApp's refusal is the only guard there (the reviewer of 11 Nov, MINOR 3)
  const recSame = cacheOf(solveForApp(E, M, E.normalizePlan(rawOf(A)), { points: PTS, research: { ...LIGHT, coarse: undefined } }));
  const m1 = tryIt(() => app(rawOf(A), { restore: recWhole })), m2 = tryIt(() => app(noConsent(rawOf(A)), { restore: recOn })), m3 = tryIt(() => app(rawOf(A), { restore: recSame }));
  APP_PLANT.rule = '';
  const WH = /^solveForApp: the stored solve was made on the whole menu and this solve is on anchors and shortlists/;
  ok(WH.test(m1) && /^solveForApp: the stored solve was made on anchors and shortlists and this solve is on the whole menu/.test(m2) && WH.test(m3),
    `10. a stored solve of the other kind is refused: a whole-menu record for a solve on anchors (${m1.slice(0, 90)}); the reverse (${m2.slice(0, 90)}); a whole-menu record of the same plan, the same layers (${m3.slice(0, 90)})`);
  const again = app(rawOf(A), { restore: cacheOf(baseOn) }), x = differ(baseOn, again);
  const againWhole = app(noConsent(rawOf(A)), { restore: cacheOf(whole) });
  ok(x.d === 0 && x.m > 0 && again.meta.restored === true && !!again.meta.coarse && !again.meta.coarse.off && (await digestOf(tablesOf(againWhole))) === (await digestOf(tablesOf(whole))) && !!againWhole.meta.coarse.off,
    `10. a record of its own kind restores: ${said(x)} on ${A} solved on anchors; the whole-menu solve's digest the same; each one's meta.coarse kept`);
}

// 12. the port's exact identity with the sweep on (the reviewer of 11 Nov, MINOR 7: speed-port's identities now run on the
// candidate before D73): the joint tier state's E5 path against the layer loop, the sweep to the ISA on and `coarse` out, on a
// household with no bridge year and on one with: every table bit for bit
for (const [id, base] of [[A, baseA], [B, baseB]]) { const x = differ(base, solve(id, null, { tsOnce: false })); ok(x.d === 0 && x.m > 0 && base.meta.sweepCashIsaTo === 'isa', `12. E5 against the layer loop with the sweep to the ISA on and the setting out, ${id} at ${PTS} points: ${said(x)}`); }

// 11 (--full only; the review's step 5): the known answer. S116 solved by the app at 45 points on anchors and shortlists and on
// the whole menu, each run by the engine on the same 1,000 paths of seed 99001: survival within 0.5 points
if (FULL) {
  const { solvedContext, runPath } = await import('../../src/solverStrategy.js');
  const at45 = extra => solveForApp(E, M, E.normalizePlan(rawOf(A)), { points: 45, research: extra });
  const t0 = Date.now(), on = at45({}), t1 = Date.now(), whole = at45({ coarse: undefined }), t2 = Date.now();
  const surv = r => { const sc = solvedContext(E, r), paths = E.pathsForSeed(99001, 1000, sc.totalYears); return 100 * paths.filter(zs => runPath(E, sc, zs).survived).length / paths.length; };
  const sOn = surv(on), sWhole = surv(whole);
  ok(!!on.meta.coarse && on.meta.coarse.fine > 0 && !whole.meta.coarse && Math.abs(sOn - sWhole) <= 0.5 + 1e-9, `11. the known answer, ${A} at 45 points, 1,000 paths of seed 99001: survival ${sOn.toFixed(1)}% on anchors and shortlists (solved in ${((t1 - t0) / 1000).toFixed(0)} s), ${sWhole.toFixed(1)}% on the whole menu (${((t2 - t1) / 1000).toFixed(0)} s); within 0.5 points`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
