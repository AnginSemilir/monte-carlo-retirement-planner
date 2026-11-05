/*
 * A DIAL POSITION TAKES ITS BASE'S ADAPTIVE REFERENCE, AND NOTHING MOVES (the launch plan's step P1 (b)). A dial position
 * above 1 is solved on its base's tiers (src/solverApp.js solveForApp with `base`); the adaptive reference reads no lambda
 * and no age weights, so the position takes the base's arrays (solve.js refFromOf, `refFrom`) in place of building them.
 * On S370 (a bridge, so a reference) at light settings (4 points, a small lattice), the dial at ten on its base:
 *   1. the position's tables, every array of every world and layer, and its reference's arrays, the same bit for bit with
 *      the reference taken (REFSHARE.on) and built afresh (off), unsplit;
 *   2. the engine's outcomes on 200 paths the same either way;
 *   3. split two ways on src/solverPool.js's arena (Node's worker threads, each part holding its own base, as the page's
 *      parts do), the tables the same as unsplit, with the reference taken and built;
 *   4. a base solved on another lattice is refused, never read;
 *   5. S090 (no bridge, no reference): the position solves as before, the reference neither taken nor built.
 * Planted (REFSHARE.plant 'nudge': the base's first step moved a hundredth): the tables part.
 * The build's time with the reference taken and built is printed beside them (not checked). The full tier.
 *   node research/tests/lock-ref.test.mjs
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { REFSHARE } from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { withTable } from '../../src/solver/bridge.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const failed = [];
const ok = (n, c, extra = '') => { c ? pass++ : (fail++, failed.push(n.split(/\s+/)[0])); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const WORKER = fileURLToPath(new URL('./lock-ref-worker.mjs', import.meta.url));
const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const all = buildScenarios();
const planOf = id => { const p = all.find(s => s.id === id).plan; return E.normalizePlan({ ...p, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }); };
const atDial = (p, pos) => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), cuts: pos } } });
const refDigest = r => { const a = r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref; if (!a) return 'none'; const { V, MV, V0, MV0, AST, ASTY } = a.arrays(), h = createHash('sha256'); const add = x => h.update(new Uint8Array(x.buffer, x.byteOffset, x.byteLength)); add(AST); for (const o of [ASTY, MV, MV0, ...V, ...V0]) for (const t of Object.keys(o || {}).sort((x, y) => x - y)) add(o[t]); return h.digest('hex').slice(0, 16); };
const outcomes = (r, n) => { const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), h = createHash('sha256'); for (const zs of E.pathsForSeed(99001, n, ctx.totalYears)) { const x = E.runTrial(ctx, Float64Array.from(zs)); h.update(`${x.survived}:${x.failAge}:${x.terminalPot}:${x.lifetimeTax};`); } return h.digest('hex').slice(0, 16); };
const secsOf = r => (r.g && r.g.reader && r.g.reader.adaptive ? r.g.reader.adaptive.secs : NaN);
const thrown = f => { try { f(); return null; } catch (e) { return e.message; } };

// a position split two ways: each worker part solves its base and then its share of the position, as the page's parts do
async function splitPosition(plan, on) {
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const w = new Worker(WORKER, { workerData: { part: 1, parts: 2, arena, plan, opts: OPTS, on } });
  const done = new Promise((res, rej) => { w.once('message', m => (m.error ? rej(new Error(m.error)) : res())); w.once('error', rej); });
  REFSHARE.on = on;
  const base = solveForApp(E, M, { ...plan, solver: { ...(plan.solver || {}), aims: { ...((plan.solver && plan.solver.aims) || {}), cuts: 1 } } }, OPTS);
  const pool = arenaPool(0, 2, arena);
  let r;
  try { r = solveForApp(E, M, atDial(plan, 10), { ...OPTS, base, e2: pool }); } catch (e) { pool.fail(); throw e; }
  await done; await w.terminate();
  return r;
}

const s370 = planOf('S370');
REFSHARE.on = true;
const base = solveForApp(E, M, s370, OPTS);
const pos = atDial(s370, 10);
REFSHARE.on = true; const rOn = solveForApp(E, M, pos, { ...OPTS, base });
REFSHARE.on = false; const rOff = solveForApp(E, M, pos, { ...OPTS, base });
const dOn = await digestOf(tablesOf(rOn)), dOff = await digestOf(tablesOf(rOff));
ok('1  S370 at ten on its base: every table and the reference the same bit for bit, the reference taken and built afresh', dOn === dOff && refDigest(rOn) === refDigest(rOff) && refDigest(rOn) === refDigest(base) && refDigest(rOn) !== 'none',
  `tables ${dOn.slice(0, 16)} / ${dOff.slice(0, 16)}; reference ${refDigest(rOn)} / ${refDigest(rOff)} (the base's ${refDigest(base)}); its build ${secsOf(rOn).toFixed(2)} s taken, ${secsOf(rOff).toFixed(2)} s built`);
const oOn = outcomes(rOn, 200), oOff = outcomes(rOff, 200);
ok('2  the engine\'s outcomes on 200 paths the same either way', oOn === oOff, `${oOn} / ${oOff}`);
const sOn = await digestOf(tablesOf(await splitPosition(s370, true))), sOff = await digestOf(tablesOf(await splitPosition(s370, false)));
ok('3  split two ways, each part on its own base: the tables the same as unsplit, the reference taken and built', sOn === dOn && sOff === dOn, `${sOn.slice(0, 16)} / ${sOff.slice(0, 16)} against ${dOn.slice(0, 16)}`);
REFSHARE.on = true;
const other = solveForApp(E, M, s370, { ...OPTS, research: { adaptiveLattice: { na: 40, nb: 9, nz: 32, foot: true, stepAll: true } } });
const e4 = thrown(() => solveForApp(E, M, pos, { ...OPTS, base: other }));
ok('4  a base solved on another lattice is refused, never read', /refFrom: the base's reference was built on/.test(e4 || '') || /lockTiers: the candidate was solved on another grid/.test(e4 || ''), (e4 || 'no throw').slice(0, 100));
const s090 = planOf('S090'), b090 = solveForApp(E, M, s090, OPTS);
REFSHARE.on = true; const p090on = solveForApp(E, M, atDial(s090, 10), { ...OPTS, base: b090 });
REFSHARE.on = false; const p090off = solveForApp(E, M, atDial(s090, 10), { ...OPTS, base: b090 });
const d090on = await digestOf(tablesOf(p090on)), d090off = await digestOf(tablesOf(p090off));
ok('5  S090 (no bridge): no reference taken or built, the position the same either way', refDigest(p090on) === 'none' && d090on === d090off, `${d090on.slice(0, 16)} / ${d090off.slice(0, 16)}`);
REFSHARE.on = true; REFSHARE.plant = 'nudge';
const rPl = solveForApp(E, M, pos, { ...OPTS, base });
REFSHARE.plant = '';
const dPl = await digestOf(tablesOf(rPl));
ok('6  planted, the base\'s first step moved a hundredth: the tables part', dPl !== dOn, `${dPl.slice(0, 16)} against ${dOn.slice(0, 16)}`);
REFSHARE.on = true;

console.log(`\n=========== ${pass} passed, ${fail} failed${failed.length ? `: ${failed.join('; ')}` : ''} ===========`);
process.exit(fail ? 1 : 0);
