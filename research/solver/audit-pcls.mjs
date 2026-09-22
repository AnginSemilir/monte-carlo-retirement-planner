/* AUDIT: how coarse is the lump-sum-allowance axis in the field?
 * The grid buckets cumPcls/LSA at [0, 0.5, 1] and snaps to the NEAREST one, with no interpolation.
 * Boundaries therefore sit at 0.25 and 0.75 of the LSA. A state below 0.25 reads as bucket 0,
 * whose vector says lump NOT taken (grid.js toVec: out[5] = pcls[ic] > 0 ? 1 : 0).
 * This walks each household's own model forward on the median path under a plain level-1 action
 * and reports where cumPcls/LSA actually lands. */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const IDS = 'S004 S020 S034 S054 S058 S070 S082 S100 S112 S118 S126 S142 S154 S162 S172 S178 S184 S194 S198 S206 S218 S222 S230 S234 S240 S252 S258 S268 S276 S292 S300 S318 S330 S342 S354 S374 S378 S390 S400 S410 S414'.split(' ');
const all = buildScenarios();
const buckets = [0, 0.5, 1];
const nearest = (v) => { let b = 0, bd = Infinity; for (let i = 0; i < buckets.length; i++) { const d = Math.abs(buckets[i] - v); if (d < bd) { bd = d; b = i; } } return b; };

const tally = [0, 0, 0];
let mis = 0, rows = 0;
console.log('id     LSA used  bucket  reads as        peak £cumPcls');
for (const id of IDS) {
  const sc = all.find(s => s.id === id);
  if (!sc) { console.log(`${id}  NOT IN LIBRARY`); continue; }
  const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
  const m = M.prepare(E, plan, {});
  const act = M.actionFromContext(m.ctx);              // the household's own plan, lump or phased
  const lsa = m.P.lsa;
  /* `step` MUTATES the state and returns only its figures, so read cumPcls off the state, not the row.
   * Reading it off the row gave 0 for all 41 - a vacuous probe, not a finding. */
  const st = M.initialState(m);
  let peak = 0;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    M.step(m, st, act, t, null);
    const c = st.cumPcls ? Object.values(st.cumPcls).reduce((a, b) => a + b, 0) : 0;
    if (c > peak) peak = c;
  }
  const frac = Math.min(1, peak / lsa);
  const b = nearest(frac);
  tally[b]++; rows++;
  const reads = b === 0 ? 'no lump taken' : b === 1 ? 'half the LSA' : 'the whole LSA';
  if (Math.abs(buckets[b] - frac) > 0.05) mis++;
  console.log(`${id}   ${(100 * frac).toFixed(1).padStart(6)}%   ${buckets[b].toFixed(1)}    ${reads.padEnd(15)} £${Math.round(peak).toLocaleString('en-GB')}`);
}
console.log(`\nbucket 0 (reads as: no lump taken)  ${tally[0]} of ${rows}`);
console.log(`bucket 0.5                         ${tally[1]} of ${rows}`);
console.log(`bucket 1.0                         ${tally[2]} of ${rows}`);
console.log(`snapped more than 5 points away    ${mis} of ${rows}`);
console.log(`LSA boundaries: bucket 0 below ${(0.25 * 268275).toLocaleString('en-GB')}, bucket 1 above ${(0.75 * 268275).toLocaleString('en-GB')}`);
