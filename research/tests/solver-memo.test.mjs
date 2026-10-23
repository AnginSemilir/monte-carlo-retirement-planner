/*
 * S1, THE CELL'S EXPECTATION MEMO, CHANGES NO NUMBER (the speed review of 23 Oct, S1 and its instruction 2; STATE.md D24).
 * Many moves leave a grid cell in the same post-decision state bit for bit, and a move's expectation is a pure function of
 * that state, the move's growth class and the layer and world it reads; the memo integrates each once a cell. Each solve
 * runs with the memo off (expMemo: false) and on (the default) at 6 points, the adaptive reference's lattice cut down to
 * na 24 x nb 5 x nz 16 (exactness does not depend on its size), and the two must agree bit for bit:
 *   tableHash   every typed array within three levels of each world's table (the speed review's speed-timing.mjs)
 *   layerHash   every typed array of the solve's tables at any depth: each world, and every layer of the tier state
 * on S224 (PASS 2 under SHIP, the tier state under CAND, joint worlds without the tier state), S362 (the bridge reader,
 * the adaptive reference, the bridge step's split) and S370 (a bridge, the adaptive reference, an emptied taxable account
 * refilled), for SHIP, CAND, FROZEN (7u's CAND, FROZEN_OPTS), DECOMP (CAND on the plan reference) and JOINT (joint worlds
 * alone: CAND without the tier state or its charge). The memo ran: hits counted with it on, none with it off.
 * Planted (expMemoPlant): the key without the growth class changes the tables (S224 SHIP); without the world, the layers
 * (S224 CAND).
 * The quick form, in the fast suite: S224 under SHIP, CAND and JOINT (the memo's three places: PASS 2, the tier state and
 * joint worlds alone), and both plants. --full: all three households under all five arms (solver-memo-full.test.mjs, the
 * nightly full suite).
 *   node research/tests/solver-memo.test.mjs [--full] [--case S224:SHIP ...]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, EXP_MEMO_STATS } from '../../src/solver/solve.js';
import { solveCandidate, candidatePlan, FROZEN_OPTS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const FULL = process.argv.includes('--full');
const LAMBDA = 0.0223606797749979, PTS = 6, SMALL = { na: 24, nb: 5, nz: 16, foot: true, stepAll: true };
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id).plan; return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };
// the arms as 7u-F's audit solves them; the candidate's through solveCandidate (its e3pcls pin checked)
// e3pcls guard: solvePlan here is SHIP's solve, the product's settings; every candidate arm solves through solveCandidate
const base = extra => ({ lambda: LAMBDA, points: PTS, bequestWeight: 0.02, ...extra });
const ARMS = {
  SHIP: (plan, x) => solvePlan(E, M, candidatePlan(E, plan), base(x)),
  CAND: (plan, x) => solveCandidate(E, M, plan, base({ adaptiveLattice: SMALL, ...x })),
  FROZEN: (plan, x) => solveCandidate(E, M, plan, base(x), FROZEN_OPTS),
  DECOMP: (plan, x) => solveCandidate(E, M, plan, base({ readerRef: undefined, adaptiveLattice: undefined, ...x })),
  JOINT: (plan, x) => solveCandidate(E, M, plan, base({ adaptiveLattice: SMALL, tierState: false, switchCharge: 0, ...x }))
};
// the speed review's two hashes (speed-timing.mjs), as written there
function hashes(r) {
  const hsh = createHash('sha256');
  const walk = (o, depth, seen) => {
    if (!o || typeof o !== 'object' || seen.has(o) || depth > 3) return; seen.add(o);
    if (ArrayBuffer.isView(o)) { hsh.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; }
    if (Array.isArray(o)) { o.forEach(x => walk(x, depth + 1, seen)); return; }
    for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; hsh.update(k); walk(o[k], depth + 1, seen); }
  };
  (r.mix ? r.mix.tables : [r]).forEach(tab => walk(tab, 0, new Set()));
  const lh = createHash('sha256');
  let arrays = 0;
  const walkAll = (o, seen) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (ArrayBuffer.isView(o)) { lh.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); arrays++; return; }
    if (Array.isArray(o)) { o.forEach(x => walkAll(x, seen)); return; }
    for (const k of Object.keys(o).sort()) { lh.update(k); walkAll(o[k], seen); }
  };
  walkAll(r.tablesW, new Set());
  return { table: hsh.digest('hex').slice(0, 16), layer: lh.digest('hex').slice(0, 16), arrays };
}
const run = (arm, plan, x) => {
  EXP_MEMO_STATS.hits = 0; EXP_MEMO_STATS.misses = 0;
  const t0 = Date.now(), r = ARMS[arm](plan, x);
  return { ...hashes(r), hits: EXP_MEMO_STATS.hits, misses: EXP_MEMO_STATS.misses, secs: Math.round((Date.now() - t0) / 1000) };
};

// --case S224:SHIP (repeatable) runs only the cases named, and the plants whose case is among them
const named = process.argv.flatMap((x, i) => (x === '--case' ? [process.argv[i + 1].split(':')] : []));
const CASES = named.length ? named : FULL
  ? ['S224', 'S362', 'S370'].flatMap(id => Object.keys(ARMS).map(arm => [id, arm]))
  : [['S224', 'SHIP'], ['S224', 'CAND'], ['S224', 'JOINT']];
const kept = {};
for (const [id, arm] of CASES) {
  const plan = planOf(id), off = run(arm, plan, { expMemo: false }), on = run(arm, plan, {});
  kept[`${id} ${arm}`] = on;
  ok(off.table === on.table && off.layer === on.layer && on.hits > 0 && off.hits === 0 && off.misses === 0,
    `${id} ${arm}: the memo off and on, tableHash ${off.table} / ${on.table}, layerHash ${off.layer} / ${on.layer} (${on.arrays} arrays); the memo's hits ${on.hits}, integrations ${on.misses} (off: ${off.hits}, ${off.misses}); ${off.secs} s off, ${on.secs} s on`);
}
// the plants: the memo's key without the growth class (S224 SHIP's tables), without the world (S224 CAND's layers)
if (kept['S224 SHIP']) {
  const p = run('SHIP', planOf('S224'), { expMemoPlant: 'nocls' }), k = kept['S224 SHIP'];
  ok(p.table !== k.table, `planted: the key without the growth class changes S224 SHIP's tables (${k.table} to ${p.table})`);
}
if (kept['S224 CAND']) {
  const q = run('CAND', planOf('S224'), { expMemoPlant: 'noworld' }), j = kept['S224 CAND'];
  ok(q.layer !== j.layer, `planted: the key without the world changes S224 CAND's layers (${j.layer} to ${q.layer})`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
