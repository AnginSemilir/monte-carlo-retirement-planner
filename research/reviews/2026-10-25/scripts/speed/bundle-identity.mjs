/*
 * THE SMALLER SAVINGS' IDENTITY (the external review's speed work, 25 Oct; on the speed checkout: the prototype, E5 and the
 * realAt cache in, E6 off). The latest candidate (HR, the third step) with tableDealing false, solved as the reference
 * (E5), then with each of E7 (mixOnce), E8 (postIds), E9 (hoistNext), E10 (gfnFast) and E11 (readerDirect) alone, then
 * with all five, then a plant in each on top of all five: E7 'swap' (the switching sum taken for staying), E8 'pen' (ids
 * from the pension alone), E9 'layer0' (every move's next-year tables at layer 0), E11 'world0' (every world given world
 * 0's reader split). Every table the solve keeps is compared value by value with the reference's: each change must give
 * it bit for bit, and each plant must part it. The memo's own plant ('nocls', the growth class dropped) is reported, not
 * gated. E10 is checked again call by call on 200,000 inputs, against its plant (a sort that never fills the first place).
 *   node bundle-identity.mjs <household> <points>
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js'), F = await imp('src/solver/fast.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg] = process.argv.slice(2), PTS = Number(ptsArg || 6);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const base = { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, tableDealing: false };
const arrays = r => { const out = []; for (const ls of r.tablesW.layW) for (const L of ls) for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); return out; };
const hashOf = A => { const hh = createHash('sha256'); for (const a of A) hh.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); return hh.digest('hex').slice(0, 16); };
const differ = (A, B) => { let d = 0, n = 0; for (let i = 0; i < A.length; i++) for (let j = 0; j < A[i].length; j++) { n++; if (!Object.is(A[i][j], B[i][j])) d++; } return { d, n }; };
// E10 call by call: the gross-up's inputs as the flows meet them, each answered by both
let calls = 0, callDiff = 0, plantDiff = 0;
const { slow, fast, planted } = F._grossForNetPair;
const run = (label, extra) => { const t0 = Date.now(), r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...base, ...extra }), A = arrays(r);
  console.log(`${id} at ${PTS} points, ${label}: ${((Date.now() - t0) / 1000).toFixed(0)} s, hash ${hashOf(A)}`); return { A, r }; };
const ref = run('the reference (E5)', {});
console.log(`${id}: the reference's meta: bridgeRead ${ref.r.meta.bridgeRead}, giaTiers ${ref.r.meta.giaTiers}, tierState ${ref.r.meta.tierState}, tiersBelow ${ref.r.meta.tiersBelow}`);
const ALL = { mixOnce: true, postIds: true, hoistNext: true, gfnFast: true, readerDirect: true };
const rows = [];
for (const [label, extra, want] of [['E7 alone', { mixOnce: true }, 0], ['E8 alone', { postIds: true }, 0], ['E9 alone', { hoistNext: true }, 0], ['E10 alone', { gfnFast: true }, 0], ['E11 alone', { readerDirect: true }, 0], ['all five', ALL, 0],
  ['the plant, E7 swapped', { ...ALL, mixOncePlant: 'swap' }, 1], ['the plant, E8 ids from the pension alone', { ...ALL, postIdsPlant: 'pen' }, 1],
  ['the plant, E9 at layer 0', { ...ALL, hoistNextPlant: 'layer0' }, 1], ['the plant, E11 world 0 for every world', { ...ALL, readerDirectPlant: 'world0' }, 1],
  ['the memo\'s own plant (the growth class dropped), reported', { ...ALL, expMemoPlant: 'nocls' }, 2]]) {
  const x = run(label, extra), dd = differ(ref.A, x.A);
  rows.push(`${label}: ${dd.d} of ${dd.n} values differ: ${want === 2 ? 'reported' : want ? (dd.d > 0 ? 'CAUGHT' : 'NOT CAUGHT') : (dd.d === 0 ? 'THE SAME BIT FOR BIT' : 'DIFFERENT')}`);
  if (label === 'all five') {
    // E10 call by call, on inputs drawn about the ones the flows meet (the compiled context's own tax table)
    const c = x.r.c; let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 200000; i++) {
      const need = rnd() < 0.05 ? 0 : rnd() * 150000, T0 = rnd() * 160000, fully = rnd() < 0.2, headroom = rnd() < 0.1 ? 0 : rnd() * 300000, ceiling = rnd() < 0.2 ? Infinity : T0 + rnd() * 140000 - 20000;
      const a = slow(c, need, T0, fully, headroom, ceiling), b = fast(c, need, T0, fully, headroom, ceiling), p = planted(c, need, T0, fully, headroom, ceiling); calls++; if (!Object.is(a, b)) callDiff++; if (!Object.is(a, p)) plantDiff++;
    }
  }
}
for (const line of rows) console.log(`${id}: ${line}`);
console.log(`${id}: E10 call by call: ${callDiff} of ${calls} answers differ: ${callDiff === 0 ? 'THE SAME BIT FOR BIT' : 'DIFFERENT'}; its plant: ${plantDiff} of ${calls} differ: ${plantDiff > 0 ? 'CAUGHT' : 'NOT CAUGHT'}`);
