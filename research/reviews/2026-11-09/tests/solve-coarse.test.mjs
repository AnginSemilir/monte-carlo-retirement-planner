/*
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
 * solve()'s bytecode under V8's limit with the hooks in is solve-size.test.mjs's check, unchanged.
 *   REPO_ROOT=<a tree with solve-coarse.diff applied> node solve-coarse.test.mjs [--full]     (quick: 4 points; --full: 6)
 */
import { Worker, MessageChannel } from 'node:worker_threads';
import { repoRoot } from '../scripts/root.mjs';
import { parseConfig, researchOf } from '../scripts/solve-cfg.mjs';

const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs'), M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js'), { solvePlan } = await import(R + '/src/solver/solve.js'), SS = await import(R + '/src/solverSettings.js');
const { makeControl, makePool } = await import(R + '/research/solver/e2.mjs'), { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');

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

// the solve split across parts, as research/solver/e2.mjs's solveSplit runs it (called here without its e3pcls pin check:
// in the port, call solveSplit itself)
function optionsOf(id, cfg) {
  const raw = rawOf(id), norm = E.normalizePlan(raw), aims = SS.aimsOptions(norm, SS.APP_DIAL_VARIANT), locked = SS.lockedPlan(E, norm).riskAbove === false ? { riskAbove: false } : {};
  return { plan: SS.appPlan(E, SS.prepareForSolve(E, raw)), opts: { ...SS.APP_CANDIDATE, ...aims, ...researchOf(parseConfig(cfg), LIGHT), lambda: aims.lambda, points: PTS, ...locked } };
}
async function split(id, cfg, parts) {
  const { plan, opts } = optionsOf(id, cfg), control = makeControl(), ports = [], ends = [];
  for (let part = 1; part < parts; part++) {
    const { port1, port2 } = new MessageChannel();
    const w = new Worker(R + '/research/solver/e2-worker.mjs', { workerData: { part, parts, control, plan, opts, port: port2, planted: null }, transferList: [port2] });
    ends.push(new Promise((resolve, reject) => { w.once('error', e => { Atomics.store(new Int32Array(control.ctrl), 2, 1); reject(e); }); w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`)))); }));
    ports.push(port1);
  }
  const pool = makePool(0, parts, control, ports);
  let r; try { r = solvePlan(E, M, plan, { ...opts, e2: pool }); } catch (e) { pool.fail(); await Promise.allSettled(ends); throw e; }
  await Promise.all(ends); for (const p of ports) p.close();
  return r;
}

const A = 'S116', B = 'S370';   // B has years before pension access (the bridge reader, its reference and the exact steps)
const baseA = solve(A, null), baseB = solve(B, null);

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

// 6. refusal
{ let msg = ''; try { solve(A, SETTING, { tsOnce: false }); } catch (e) { msg = e.message; } ok(/coarse needs/.test(msg), `6. refused outside E5's path (tsOnce false): ${msg || 'NOT refused'}`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
