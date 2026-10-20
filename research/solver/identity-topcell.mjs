/*
 * TOP-CELL's ONE-BRIDGE IDENTITY (PLAN.md TOP-CELL; the design review of 20 Oct 17:04 UK, deep-review-log.md, its (2) and (7)):
 * S130 and S128 read one bridge year, where both references are the one 0/1 step at the untaxed bill less the tolerance when no
 * tax sits at the threshold, so the package's arms there would equal the plan reference's (a design fault, not a null: the
 * review's F3). Printed, for each household, at a fifteenth of the run's points (4) under the candidate as audit-topcell.mjs
 * solves it: the reader's bridge years; at the first bridge year, the adaptive reference's A*_1 against the plan's split at b 0,
 * 0.25, 0.5, 0.75 and 1 and every gain node (the largest gap, and the cells that differ by more than a pound); and the package's
 * tables against the plan's, every world's survival, bequest, move and shortfall table hashed: PX against CX and PSNX against
 * SNRX (audit-topcell.mjs's arms). A household whose tables differ, or whose A*_1 differs from the plan's split, runs its
 * package cells (the review: "S128's package cells run only if the two differ").
 *   node research/solver/identity-topcell.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCandidate } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { createHash } from 'node:crypto';

const LAMBDA = 0.0223606797749979, W = 0.02, PTS = 4, BS = [0, 0.25, 0.5, 0.75, 1];
// audit-topcell.mjs's arms and lattice (not imported: importing the audit runs its jobs)
const LATTICE = { na: 160, nb: 41, nz: 128 }, NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1];
const PKG = { readerRef: 'adaptive', foot: true, stepAll: true, readerSplit: 'rs', readerCopy: 'extrap' };
const ARMS = { CX: { readerCopy: 'extrap' }, PX: PKG, SNRX: { shareNodes: NODES_SN, readerSplit: 'ru', readerCopy: 'extrap' }, PSNX: { ...PKG, shareNodes: NODES_SN, readerSplit: 'rsu' } };
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const extraOf = a => ({ ...(a.readerRef ? { readerRef: a.readerRef, adaptiveLattice: { ...LATTICE, ...(a.foot ? { foot: true } : {}), ...(a.stepAll ? { stepAll: true } : {}) } } : {}), ...(a.shareNodes ? { shareNodes: a.shareNodes } : {}), ...(a.readerSplit ? { readerSplit: a.readerSplit } : {}), ...(a.readerCopy ? { readerCopy: a.readerCopy } : {}) });
const hashOf = r => { const h = createHash('sha256'); for (const w of r.worlds) for (const key of ['surv', 'beq', 'pol', 'short']) for (const a of w[key]) if (a) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); return h.digest('hex').slice(0, 16); };
const survGap = (a, b) => { let mx = 0, nd = 0; for (let k = 0; k < a.worlds.length; k++) for (let t = 0; t < a.worlds[k].surv.length; t++) { const x = a.worlds[k].surv[t], y = b.worlds[k].surv[t]; if (!x || !y) continue; for (let i = 0; i < x.length; i++) { const d = Math.abs(x[i] - y[i]); if (d > 0) nd++; if (d > mx) mx = d; } } return { mx, nd }; };
let differ = 0;
console.log(`TOP-CELL'S ONE-BRIDGE IDENTITY (S130 and S128, ${PTS} points, the candidate as audit-topcell.mjs solves it)`);
for (const id of ['S130', 'S128']) {
  const h = all.find(s => s.id === id);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const R = {};
  for (const arm of ['CX', 'PX', 'SNRX', 'PSNX']) R[arm] = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extraOf(ARMS[arm]) });
  const g = R.PX.mix.tables[0].g, T = R.PX.m.ctx.totalYears, bridge = [];
  for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.push(t);
  console.log(`${id}: reader years ${bridge.join(',') || 'none'}`);
  const adr = g.reader && g.reader.adaptive, ref = adr && adr.ref, gains = Array.from(g.gain);
  if (!ref || !bridge.length) { console.log(`${id}: no adaptive reference or no bridge year: the identity cannot be read`); differ++; continue; }
  const t1 = bridge[0], tb0 = R.PX.mix.tables[0], lyr = tb0.tsLayers ? tb0.tsLayers[0] : tb0;
  const RD = g.reader.of.get(lyr.lsurv[t1]), sch = RD && RD.chance && RD.chance.schedule, split = sch && sch.bills.length ? sch.bills[0] - 1 : null;
  let gap = 0, off = 0, n = 0, none = 0;
  for (const b of BS) for (const gf of gains) { const a = ref.astarAt(t1, b, gf); n++; if (!(a > 0 && a < 1e11) || split === null) { none++; continue; } const d = Math.abs(a - split); if (d > gap) gap = d; if (d > 1) off++; }
  console.log(`${id}: year ${t1}: the plan's split ${split === null ? 'none' : split.toFixed(2)}; A*_${t1} at ${n} cells (b ${BS.join(', ')} by ${gains.length} gain nodes): ${none} without a step, the largest gap ${gap.toFixed(4)}, ${off} differ by more than a pound`);
  for (const [p, c] of [['PX', 'CX'], ['PSNX', 'SNRX']]) {
    const hp = hashOf(R[p]), hc = hashOf(R[c]), sg = survGap(R[p], R[c]);
    console.log(`${id}: ${p} against ${c}: ${hp} ${hc} ${hp === hc ? 'identical' : `DIFFER (survival tables: largest ${sg.mx.toExponential(2)} on ${sg.nd} values)`}`);
    if (hp !== hc) differ++;
  }
  if (none > 0 || off > 0) differ++;
}
console.log(`VERDICT: ${differ ? 'NOT IDENTICAL: a household\'s package cells must run (or its A*_1 is unread)' : 'every one-bridge household reference-invariant at this resolution'}`);
process.exit(0);
