/*
 * 7U-F'S AUDIT CHECKS, PLANTED (research/solver/audit-7uf-checks.mjs; CHECKLIST.md item 5; the design review of 21 Oct,
 * MINORs 3 and 4). Each check passes the arm as registered and refuses each planted fault:
 *   armProblems     CAND without the RS split, SHIP with e3, DECOMP with the adaptive reference, a wrong estate weight;
 *   latticeProblem  a lattice not the candidate's, a reader reading bridge years with no lattice built;
 *   ctxProblem      the engine run on another plan: another solvency floor, another tier return, a one-off cost (a Map
 *                   field, which the first check, JSON of the context, could not see);
 *   planHash        the same plan hashes alike, another plan otherwise (the read compares it across a household's arms).
 *   node research/tests/audit-7uf-checks.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { WANT, armProblems, latticeProblem, ctxKey, ctxProblem, planHash } from '../solver/audit-7uf-checks.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

for (const arm of ['CAND', 'DECOMP', 'SHIP']) ok(armProblems(arm, { ...WANT[arm] }, 0.02, 0.02).length === 0, `${arm} as registered passes the settings check`);
ok(armProblems('CAND', { ...WANT.CAND, readerSplit: null }, 0.02, 0.02).length === 1, 'planted: CAND without the RS split is refused');
ok(armProblems('SHIP', { ...WANT.SHIP, e3: true }, 0.02, 0.02).length === 1, 'planted: SHIP with e3 on is refused');
ok(armProblems('DECOMP', { ...WANT.DECOMP, readerRef: 'adaptive' }, 0.02, 0.02).length === 1, 'planted: DECOMP on the adaptive reference is refused');
ok(armProblems('CAND', { ...WANT.CAND }, 0.01, 0.02).length === 1, 'planted: a solve at another estate weight is refused');

const want = { na: 160, nb: 41, nz: 128, foot: true, stepAll: true };
ok(latticeProblem('CAND', want, { ...want, ng: 9 }, 8) === null && latticeProblem('CAND', want, null, 0) === null && latticeProblem('SHIP', want, null, 8) === null, 'the candidate\'s lattice, or none where the reader reads no year, passes; other arms are not asked');
ok(latticeProblem('CAND', want, { ...want, na: 80 }, 8) !== null && latticeProblem('CAND', want, { ...want, foot: undefined }, 8) !== null, 'planted: a lattice not the candidate\'s (na 80, or without the foot) is refused');
ok(latticeProblem('CAND', want, null, 3) !== null, 'planted: a reader reading bridge years with no lattice built is refused');

const sc = buildScenarios().find(s => s.id === 'S224');
const base = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const ctxOf = p => E.buildContext(p), c0 = ctxOf(base);
ok(ctxProblem(ctxOf(base), c0) === null && planHash(ctxOf(base)) === planHash(c0), 'the same plan: the contexts agree and hash alike');
const floor = ctxOf({ ...base, config: { ...base.config, solvencyFloor: E.num(base.config.solvencyFloor, 0) + 1000 } });
ok(/solvencyFloor/.test(ctxProblem(floor, c0) || '') && planHash(floor) !== planHash(c0), 'planted: another solvency floor is refused (named) and hashes otherwise');
const rp = JSON.parse(JSON.stringify(base.riskProfiles)), tier = Object.keys(rp).find(k => / Risk$/.test(k)); rp[tier] = { ...rp[tier], real: rp[tier].real + 0.001 };
const tiered = ctxOf({ ...base, riskProfiles: rp, riskSource: '' });
ok(ctxProblem(tiered, c0) !== null && planHash(tiered) !== planHash(c0), `planted: another tier return (${tier}) is refused and hashes otherwise`);
const y = c0.baseYear + 3, costly = ctxOf(E.normalizePlan({ ...base, oneOffCosts: [...(base.oneOffCosts || []), { id: 'plant', date: `${y}-06-01`, year: y, owner: 'Myself', amount: 5000, desc: 'planted' }] }));
const mapFields = Object.keys(c0).filter(k => c0[k] instanceof Map);
const jsonOnly = ctx => JSON.stringify(Object.keys(ctx).filter(k => !['plan', 'warnings', 'policyOverride', 'policyKey'].includes(k)).sort().map(k => [k, ctx[k]]));
ok(mapFields.length > 0 && ctxProblem(costly, c0) !== null && planHash(costly) !== planHash(c0), `planted: a one-off cost (the context's Map fields: ${mapFields.join(', ')}) is refused and hashes otherwise`);
ok(jsonOnly(costly) === jsonOnly(c0) || ctxKey(costly) !== ctxKey(c0), `EDGE: the first check, JSON of the context, ${jsonOnly(costly) === jsonOnly(c0) ? 'could not see the one-off cost' : 'saw it too'}; ctxKey sees it`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} audit checks failed`);
