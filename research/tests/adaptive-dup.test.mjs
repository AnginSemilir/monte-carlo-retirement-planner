/*
 * S3, THE ADAPTIVE REFERENCE'S DUPLICATE MOVES, CHANGES NO NUMBER (the speed review of 23 Oct, S3 and its instruction 3;
 * STATE.md D24). At a lattice state, a floor move whose post-flow state and growth class match an earlier move's takes that
 * move's values (adaptive.js dupMoves). Each household is solved once, cheaply (the candidate at 4 points, a small lattice),
 * and its reference is rebuilt from the same inputs (adaptive.js rebuild) with the duplicates off and on; the reference's
 * own arrays (V, MV, V0, MV0, AST, ASTY: every world's values, the moves chosen, the foot node's and the thresholds) must
 * agree bit for bit:
 *   --full (adaptive-dup-full.test.mjs, the nightly full suite): S362 (the bridge reader's household), S366 (the foot) and
 *     S370 (a bridge, an emptied taxable account refilled), at the candidate's own lattice (candidate.json's
 *     adaptiveLattice); and the solve itself, S362 at 4 points on the small lattice, its tables the same with S3 off and on;
 *   the quick form (the fast suite): S362 and S370 at a cut lattice (na 48 x nb 9 x nz 32, the foot and every step).
 * The duplicates were found: their count with S3 on, none with it off. Planted ('dupnocls', the growth class left out of
 * the match): the arrays change (S362).
 *   node research/tests/adaptive-dup.test.mjs [--full]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCandidate, CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const FULL = process.argv.includes('--full');
const LAMBDA = 0.0223606797749979, SMALL = { na: 24, nb: 5, nz: 16, foot: true, stepAll: true };
const LATTICE = FULL ? { ...CANDIDATE_OPTS.adaptiveLattice } : { na: 48, nb: 9, nz: 32, foot: true, stepAll: true };
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id).plan; return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };
const solve = (id, extra = {}) => solveCandidate(E, M, planOf(id), { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: SMALL, ...extra });
const refOf = r => r.mix.tables[0].g.reader.adaptive.ref;
// the reference's own arrays, hashed in a fixed order (the speed review's arefHash)
const arefHash = ref => {
  const a = ref.arrays(), h = createHash('sha256');
  const put = o => { if (!o) return; if (ArrayBuffer.isView(o)) { h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(put); return; } for (const k of Object.keys(o).sort((x, y) => Number(x) - Number(y))) { h.update(k); put(o[k]); } };
  put(a.V); put(a.MV); put(a.V0); put(a.MV0); put(a.AST); put(a.ASTY);
  return h.digest('hex').slice(0, 16);
};
// the solve's tables (every typed array within three levels of each world's view; the speed review's tableHash)
const tableHash = r => {
  const h = createHash('sha256');
  const walk = (o, depth, seen) => {
    if (!o || typeof o !== 'object' || seen.has(o) || depth > 3) return; seen.add(o);
    if (ArrayBuffer.isView(o)) { h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; }
    if (Array.isArray(o)) { o.forEach(x => walk(x, depth + 1, seen)); return; }
    for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; h.update(k); walk(o[k], depth + 1, seen); }
  };
  r.mix.tables.forEach(tab => walk(tab, 0, new Set()));
  return h.digest('hex').slice(0, 16);
};

const lat = `na ${LATTICE.na} x nb ${LATTICE.nb} x nz ${LATTICE.nz}${LATTICE.foot ? ', the foot' : ''}${LATTICE.stepAll ? ', every step' : ''}`;
const kept = {};
for (const id of FULL ? ['S362', 'S366', 'S370'] : ['S362', 'S370']) {
  const ref = refOf(solve(id));
  const t0 = Date.now(), off = ref.rebuild({ ...LATTICE, dupMoves: false }), t1 = Date.now(), on = ref.rebuild({ ...LATTICE, dupMoves: true }), t2 = Date.now();
  const hOff = arefHash(off), hOn = arefHash(on);
  kept[id] = { ref, hOn };
  ok(hOff === hOn && on.dupStats.hits > 0 && off.dupStats.hits === 0,
    `${id} at ${lat}: the reference's arrays with the duplicates off and on, ${hOff} / ${hOn}; the duplicates taken ${on.dupStats.hits} of ${on.dupStats.hits + on.dupStats.misses} (off: ${off.dupStats.hits}); built in ${((t1 - t0) / 1000).toFixed(1)} s off, ${((t2 - t1) / 1000).toFixed(1)} s on`);
}
// planted: the growth class left out of the match
{
  const { ref, hOn } = kept.S362, p = ref.rebuild({ ...LATTICE, dupMoves: true, plant: 'dupnocls' });
  ok(arefHash(p) !== hOn, `planted: the growth class left out of the match changes S362's reference (${hOn} to ${arefHash(p)})`);
}
// the solve itself with S3 off and on (the full form only)
if (FULL) {
  const a = tableHash(solve('S362', { arefDupMoves: false })), b = tableHash(solve('S362'));
  ok(a === b, `S362, the candidate at 4 points on the small lattice: its tables with S3 off and on, ${a} / ${b}`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
