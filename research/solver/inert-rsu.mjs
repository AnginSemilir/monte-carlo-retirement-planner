/*
 * RSU's INERTNESS CHECK (PLAN.md TOP-CELL; the design review of 20 Oct 17:04 UK, deep-review-log.md): `readerSplit: 'rsu'`
 * adds a branch the read takes only under its own flag (grid.js l.417; solve.js l.683, l.871, l.1269), so every arm without
 * it must hash the same on the code before it and after: on S370 at 4 points under the candidate's options (e3pcls off,
 * as the reader tests run), the plan reference (C), the RS split (RS), SN's share nodes with the RU split (SNR) and the
 * adaptive package (the reference, its fix, stepAll, RS: PKG). Run with two trees: a worktree of the commit before 'rsu'
 * (its research/engine.mjs built) and this one.
 *   node research/solver/inert-rsu.mjs <old tree root> <new tree root>
 */
import { createHash } from 'node:crypto';
const [oldRoot, newRoot] = process.argv.slice(2);
if (!oldRoot || !newRoot) { console.error('usage: node research/solver/inert-rsu.mjs <old tree root> <new tree root>'); process.exit(2); }
const NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1];
const ARMS = { C: {}, RS: { readerSplit: 'rs' }, SNR: { shareNodes: NODES_SN, readerSplit: 'ru' }, PKG: { readerRef: 'adaptive', adaptiveLattice: { na: 160, nb: 41, nz: 128, foot: true, stepAll: true }, readerSplit: 'rs' } };
async function hashes(root) {
  const E = await import(root + '/research/engine.mjs'), M = await import(root + '/src/solver/model.js');
  const { solvePlan } = await import(root + '/src/solver/solve.js'), { CANDIDATE_OPTS, candidatePlan } = await import(root + '/research/solver/candidate.mjs');
  const { buildScenarios } = await import(root + '/research/policy-study/scenarios.mjs');
  const p0 = buildScenarios().find(s => s.id === 'S370').plan;
  const plan = candidatePlan(E, E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p0)), config: { ...p0.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p0.spending, floorSpend: Math.round(0.8 * E.num(p0.spending.targetSpend, 0)) } })));
  const out = {};
  for (const [name, extra] of Object.entries(ARMS)) {
    const r = solvePlan(E, M, plan, { ...CANDIDATE_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, ...extra });
    const h = createHash('sha256');
    for (const w of r.worlds) for (const key of ['surv', 'beq', 'pol', 'short']) for (const a of w[key]) if (a) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
    out[name] = h.digest('hex').slice(0, 16);
  }
  return out;
}
const A = await hashes(oldRoot), B = await hashes(newRoot);
console.log("RSU INERTNESS (S370, 4 points, e3pcls off): the tables' hash, the code before 'rsu' and after it");
for (const name of Object.keys(ARMS)) console.log(`  ${name}: ${A[name]} ${B[name]} ${A[name] === B[name] ? 'identical' : 'DIFFER'}`);
const same = Object.keys(ARMS).every(k => A[k] === B[k]);
console.log(`VERDICT: ${same ? 'every arm identical' : 'an arm DIFFERS'}`);
process.exit(same ? 0 : 1);
