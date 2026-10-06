/*
 * THE RESEARCH CANDIDATE, PINNED (the maintainer, 6 Oct: 'yes make the fix the default' and 'yes, build the candidate as
 * one settings object'). Rule 8: a decision changes the code default in the same commit as PLAN.md's decided-defaults
 * block, and a test pins the two together. This is that test for the candidate (research/solver/candidate.mjs) and for
 * pclsInterp, the interpolated allowance axis, as e3-default.test.mjs is for e3:
 *   1. the block's "candidate" and candidate.mjs's CANDIDATE_OPTS (with its tier set) are the same, key for key;
 *   2. the product stays on the snapped axis: the block's "pclsInterp" false, PRODUCT_BASELINE without it, solvePlan's own
 *      solve snapped; the research default ("pclsInterpResearch", RESEARCH_OPTS.pclsInterp) on;
 *   3. candidatePlan moves the five blended tiers' real to results-o60.txt's blend column and nothing else;
 *   4. solveCandidate solves with every setting the block names (a smoke solve on S126, the reader's household);
 *   5. no research script sets pclsInterp false (or any candidate key) before spreading RESEARCH_OPTS or CANDIDATE_OPTS,
 *      where the spread would silently overwrite it (the deep review of 6 Oct 10:37 UK).
 * Each comparison is shown to fail on a planted drift.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { RESEARCH_OPTS } from '../solver/research-opts.mjs';
import { CANDIDATE_OPTS, CANDIDATE_TIERS, TIERS, blendReals, candidatePlan, solveCandidate } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), SOLVER = join(HERE, '../solver');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const D = JSON.parse(/<!-- decided-defaults([\s\S]*?)-->/.exec(readFileSync(join(SOLVER, 'PLAN.md'), 'utf8'))[1]);

// 1. the block's candidate is the code's, key for key (the tier set under "tiers")
const codeCand = { ...CANDIDATE_OPTS, tiers: CANDIDATE_TIERS };
const same = (a, b) => !!a && !!b && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
ok(same(D.candidate, codeCand), `the candidate: decided ${JSON.stringify(D.candidate)}, code ${JSON.stringify(codeCand)}`);
ok(!same({ ...D.candidate, switchCharge: 0.002 }, codeCand), 'planted: a decided value the code does not carry fails the comparison');
ok(!same(D.candidate, { ...codeCand, pclsInterp: false }), 'planted: a code value the block does not carry fails it');
const { bridgeStep: _b, ...lessOne } = D.candidate;
ok(!same(lessOne, codeCand), 'planted: a key missing from the block fails it');
ok(!same(undefined, codeCand), 'planted: a block without "candidate" fails it');
ok(Object.isFrozen(CANDIDATE_OPTS) && Object.isFrozen(RESEARCH_OPTS), 'CANDIDATE_OPTS and RESEARCH_OPTS are frozen');

// 2. the product stays snapped; the research default is the interpolated axis
const product = (decided, code) => 'pclsInterp' in decided && decided.pclsInterp === false && !code.pclsInterp;
ok(product(D, PRODUCT_BASELINE), `the product's pclsInterp: decided ${D.pclsInterp}, code ${PRODUCT_BASELINE.pclsInterp}`);
ok(!product({ ...D, pclsInterp: true }, PRODUCT_BASELINE), 'planted: a decided product pclsInterp on fails');
ok(!product(D, { ...PRODUCT_BASELINE, pclsInterp: true }), 'planted: a code product pclsInterp on fails');
const research = (decided, opts) => decided.pclsInterpResearch === true && opts.pclsInterp === true;
ok(research(D, RESEARCH_OPTS), `the research pclsInterp: decided ${D.pclsInterpResearch}, research-opts.mjs ${RESEARCH_OPTS.pclsInterp}`);
ok(!research({ ...D, pclsInterpResearch: false }, RESEARCH_OPTS), 'planted: a decided research pclsInterp off fails');
ok(CANDIDATE_OPTS.pclsInterp === true && CANDIDATE_OPTS.e3 === true, 'the candidate carries the research defaults (e3, pclsInterp)');

// 3. the tier set: the five blended tiers at O60's blend column, nothing else moved
const O60 = readFileSync(join(SOLVER, 'results-o60.txt'), 'utf8'), reals = blendReals(O60);
ok(TIERS.every(k => Number.isFinite(reals[k])), `blendReals reads all five tiers (${TIERS.map(k => `${k} ${reals[k]}`).join('; ')})`);
assert.throws(() => blendReals(O60.replace(/^  Low Risk.*$/m, '')), /no row for Low Risk/); ok(true, 'planted: a missing tier row throws, not a default');
const sc = buildScenarios().find(s => s.id === 'S126');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
const lin = E.normalizePlan(plan).riskProfiles, bl = E.normalizePlan(candidatePlan(E, plan)).riskProfiles;
const tierDiff = (a, b) => { const bad = []; for (const k of Object.keys(a)) for (const f of new Set([...Object.keys(a[k]), ...Object.keys(b[k] || {})])) { if (TIERS.includes(k) && f === 'real') { if (Math.abs(b[k].real - reals[k]) > 1e-9) bad.push(`${k} real ${b[k].real}`); } else if (JSON.stringify(a[k][f]) !== JSON.stringify((b[k] || {})[f])) bad.push(`${k}.${f}`); } return bad; };
ok(!tierDiff(lin, bl).length, `candidatePlan moves the five reals to the blend medians and nothing else${tierDiff(lin, bl).length ? `: ${tierDiff(lin, bl).join(', ')}` : ''}`);
ok(tierDiff(lin, { ...bl, 'Cash Equivalents': { ...bl['Cash Equivalents'], real: 9 } }).length > 0, 'planted: a moved tier outside the five fails the check');

// 4. the smoke solve: every setting the block names is the one the solve ran
const def = solvePlan(E, M, plan, { lambda: 0.5, points: 3 });
ok(def.g.pclsInterp === false, `solvePlan with nothing passed solves on the snapped axis (g.pclsInterp ${def.g.pclsInterp})`);
const r = solveCandidate(E, M, plan, { lambda: 0.5, points: 3 });
const ran = { bridgeRead: r.meta.bridgeRead, bridgeStep: r.meta.bridgeStep, tierState: !!r.meta.tierState, jointWorlds: !!r.meta.jointWorlds, bequestWeight: r.meta.bequestWeight, switchCharge: r.meta.switchCharge, switchMargin: r.switchMargin, e3: !!r.meta.e3, pclsInterp: r.g.pclsInterp };
ok(Object.entries(ran).every(([k, v]) => v === CANDIDATE_OPTS[k]), `solveCandidate ran the candidate (${JSON.stringify(ran)})`);
ok(!Object.entries({ ...ran, bridgeStep: undefined }).every(([k, v]) => v === CANDIDATE_OPTS[k]), 'planted: a solve that dropped a setting (bridgeStep) fails the same check');
const arm = solveCandidate(E, M, plan, { lambda: 0.5, points: 3, pclsInterp: false });
ok(arm.g.pclsInterp === false, 'an arm\'s own pclsInterp false, passed after the candidate, keeps the snap');

// 5. the spread-order hazard, scanned in every research script
// a key written before a spread is overwritten if the spread carries it: walk back from each spread to its enclosing brace
// (nested braces and brackets balanced), flag a carried key written anywhere before it (in a nested conditional object too),
// and flag a spread of a variable before it, which cannot be shown not to carry one (the plan-auditor's MINOR 3 on 8533b87)
const SPREADS = { RESEARCH_OPTS: Object.keys(RESEARCH_OPTS), CANDIDATE_OPTS: Object.keys(CANDIDATE_OPTS) };
const hazard = src => {
  for (const [name, carried] of Object.entries(SPREADS)) for (const m of src.matchAll(new RegExp(String.raw`\.\.\.${name}\b`, 'g'))) {
    let depth = 0, i = m.index - 1;
    for (; i >= 0; i--) { const c = src[i]; if (c === '}' || c === ')' || c === ']') depth++; else if (c === '{' || c === '(' || c === '[') { if (depth === 0) break; depth--; } }
    if (i < 0 || src[i] !== '{') continue;
    const before = src.slice(i + 1, m.index);
    if ([...before.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].some(k => carried.includes(k[1]))) return true;
    if ([...before.matchAll(/\.\.\.\s*([A-Za-z_$][\w$.]*)/g)].some(k => !(k[1] in SPREADS))) return true;
  }
  return false;
};
ok(hazard('solvePlan(E, M, plan, { pclsInterp: false, points: 6, ...RESEARCH_OPTS });'), 'planted: pclsInterp false before the spread is flagged');
ok(hazard('solvePlan(E, M, plan, { switchMargin: 0.001, ...CANDIDATE_OPTS });'), 'planted: a candidate key before the candidate spread is flagged');
ok(!hazard('solvePlan(E, M, plan, { points: 6, ...CANDIDATE_OPTS, pclsInterp: false });'), 'a key after the spread is not flagged');
ok(!hazard("Object.freeze({ bridgeRead: 'reader', ...RESEARCH_OPTS })"), 'a key before a spread that does not carry it is not flagged (candidate.mjs\'s own shape)');
ok(hazard('solvePlan(E, M, plan, { pclsInterp: false, ...(j ? { jointWorlds: true } : {}), ...RESEARCH_OPTS });'), 'planted: a carried key before a nested conditional object and the spread is flagged');
ok(hazard('solvePlan(E, M, plan, { lambda: 0.5, ...(snap ? { pclsInterp: false } : {}), ...RESEARCH_OPTS });'), 'planted: a carried key inside a nested conditional object before the spread is flagged');
ok(hazard('solvePlan(E, M, plan, { ...AO, ...RESEARCH_OPTS });'), 'planted: a variable spread before the research spread is flagged (audit-dto97.mjs\'s arm shape)');
ok(!hazard('solvePlan(E, M, plan, { ...RESEARCH_OPTS, ...AO, points: 4 });'), 'a variable spread after the research spread is not flagged');
const scripts = readdirSync(SOLVER).filter(f => /\.mjs$/.test(f));
ok(scripts.length > 20, `the scan finds the research scripts (${scripts.length}): a scan that ran on nothing is an error`);
const bad = scripts.filter(f => hazard(readFileSync(join(SOLVER, f), 'utf8')));
ok(!bad.length, `no research script sets a candidate key before spreading RESEARCH_OPTS or CANDIDATE_OPTS${bad.length ? `: ${bad.join(', ')}` : ''}`);
console.log(`\n=========== ${n} passed, 0 failed ===========`);
