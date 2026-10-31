/*
 * PR31's INERTNESS CHECK (PLAN.md PR31; the design review of 20 Oct 13:40 UK, deep-review-log.md, its step 5): the chooser's
 * split at the adaptive reference's own threshold (solve.js stepThrOf, 22a40bf) acts only under `adaptiveLattice.stepAll`.
 * So, on S362 at 4 points under the candidate's options (e3pcls off, as the step tests run), the plan reference (C) and the
 * adaptive reference with its fix and no exact steps (AN) must hash the same on the code before the fix and after it; the
 * exact steps (AN3) may move, and the size of the move is printed: each world's survival tables by year, the largest
 * difference, on how many nodes, and on how many the stored move differs. Run with two trees: a worktree of the commit
 * before the fix (its research/engine.mjs built) and this one.
 *   node research/solver/inert-pr31.mjs <old tree root> <new tree root>
 */
import { createHash } from 'node:crypto';
const [oldRoot, newRoot] = process.argv.slice(2);
if (!oldRoot || !newRoot) { console.error('usage: node research/solver/inert-pr31.mjs <old tree root> <new tree root>'); process.exit(2); }
const L = { na: 160, nb: 41, nz: 128, foot: true };
const ARMS = { C: {}, AN: { readerRef: 'adaptive', adaptiveLattice: L }, AN3: { readerRef: 'adaptive', adaptiveLattice: { ...L, stepAll: true } } };
async function solveAll(root) {
  const E = await import(root + '/research/engine.mjs'), M = await import(root + '/src/solver/model.js');
  const { solvePlan } = await import(root + '/src/solver/solve.js'), { CANDIDATE_OPTS, candidatePlan } = await import(root + '/research/solver/candidate.mjs');
  const { buildScenarios } = await import(root + '/research/policy-study/scenarios.mjs');
  const p0 = buildScenarios().find(s => s.id === 'S362').plan;
  const plan = candidatePlan(E, E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p0)), config: { ...p0.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p0.spending, floorSpend: Math.round(0.8 * E.num(p0.spending.targetSpend, 0)) } })));
  const out = {};
  for (const [name, extra] of Object.entries(ARMS)) {
    const r = solvePlan(E, M, plan, { ...CANDIDATE_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, ...extra });
    const h = createHash('sha256');
    for (const w of r.worlds) for (const key of ['surv', 'beq', 'pol', 'short']) for (const a of w[key]) if (a) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
    out[name] = { hash: h.digest('hex').slice(0, 16), worlds: r.worlds.map(w => ({ surv: w.surv, pol: w.pol })) };
  }
  return out;
}
const A = await solveAll(oldRoot), B = await solveAll(newRoot);
console.log('PR31 INERTNESS (S362, 4 points, e3pcls off): the tables\' hash, the code before the fix and after it');
for (const name of Object.keys(ARMS)) console.log(`  ${name}: ${A[name].hash} ${B[name].hash} ${A[name].hash === B[name].hash ? 'identical' : 'differ'}`);
console.log('AN3, the survival tables by world and year (before against after):');
let worst = 0, moves = 0;
for (let k = 0; k < A.AN3.worlds.length; k++) {
  const a = A.AN3.worlds[k], b = B.AN3.worlds[k], by = [];
  for (let t = 0; t < a.surv.length; t++) {
    if (!a.surv[t] || !b.surv[t]) continue;
    let mx = 0, nd = 0, pd = 0;
    for (let i = 0; i < a.surv[t].length; i++) { const d = Math.abs(a.surv[t][i] - b.surv[t][i]); if (d > mx) mx = d; if (d > 0) nd++; if (a.pol[t][i] !== b.pol[t][i]) pd++; }
    worst = Math.max(worst, mx); moves += pd;
    if (mx > 0 || pd > 0) by.push(`year ${t} max ${mx.toExponential(2)} on ${nd} of ${a.surv[t].length} nodes, moves differ on ${pd}`);
  }
  console.log(`  world ${k}: ${by.length ? by.join('; ') : 'identical'}`);
}
console.log(`VERDICT: C ${A.C.hash === B.C.hash ? 'identical' : 'DIFFERS'}, AN ${A.AN.hash === B.AN.hash ? 'identical' : 'DIFFERS'}; AN3's largest survival change ${worst.toExponential(2)}, stored moves differing ${moves}`);
process.exit(A.C.hash === B.C.hash && A.AN.hash === B.AN.hash ? 0 : 1);
