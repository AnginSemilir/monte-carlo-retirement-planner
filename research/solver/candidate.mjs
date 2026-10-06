/*
 * THE RESEARCH CANDIDATE AS ONE SETTINGS OBJECT (the maintainer, 6 Oct: 'yes, build the candidate as one settings object').
 * The solver settings Phase 4's head-to-head and 7u's held-out confirmation run use: before this file the bundle was a list of decisions
 * in PLAN.md, each test carrying its own copy of the options. Each entry names the decision that put it there (the ledger,
 * PLAN.md and PLAN-HISTORY.md). Not the product's: solve.js's PRODUCT_BASELINE and PLAN.md's decided-defaults block are the
 * app's, unchanged until after Phase 4 (the maintainer, 1 Oct 06:45 UK). Pinned with the decided-defaults block's
 * "candidate" by research/tests/candidate.test.mjs.
 *
 *   bridgeRead 'reader', tierState, jointWorlds, bequestWeight 0.02 - the bundle (29 Sep 07:49 UK: 'Go ahead with all your
 *     recommendations'; the bridge reader with TS+J at the estate weight 0.02)
 *   bridgeStep 'exact' - Q's year-1 fix, the reader's step integrated in the chooser (30 Sep 18:50 UK)
 *   switchCharge 0.001, switchMargin 0 - the switch charged in both passes instead of the stored margin (3 Oct 18:51 UK;
 *     the value's PROVISIONAL label lifted by 7as, 4 Oct 01:42 UK)
 *   RESEARCH_OPTS - e3, the empty-pot copy (E3c EXACT, 5 Oct), and pclsInterp, the interpolated allowance axis (6 Oct: 'yes
 *     make the fix the default'; the 4 Oct step-read condition replaced, 'Yes, replace it'; tested with the reader off only,
 *     ADOPT-PI; O76 and PR5 its named caveats)
 *   e3 here rests on E3c beyond its checked scope: E3c ran TSJ as the reader with tierState and jointWorlds only
 *     (audit-e3c.mjs), so e3's identity with Q's fix (bridgeStep 'exact'), with the charge (switchCharge, margin 0) and with
 *     pclsInterp is NOT CHECKED by a run - grade B by construction (the deep review of 5 Oct 01:49 UK: the copied cells have
 *     an exactly empty taxable pot); an identity run under CANDIDATE_OPTS on a household where Q acts (share 0.95) would close it
 *   Open before 7u (PLAN.md 7u, the 30 Sep 18:50 condition): a unit test of Q with the tier state and joint worlds; the smoke
 *     solve in candidate.test.mjs is the first run of Q with TS+J, the charge and e3 together, not that test
 *   the tier returns at the medians of their blends - O60 (30 Sep 18:50 UK, 'Adopt before 7u'): a change to the plan's
 *     inputs, not a solver option, so candidatePlan applies it (results-o60.txt's blend column, as audit-7ai.mjs's override)
 *   Not in it, and not settings: O97 (PCLSI's lucky-tail net loss at a pension death tax of 0, under test as DT-O97) and
 *     the death tax itself, a household input the library sets to 0 (PR5); the end pot's valuation (PR7) is undecided.
 *
 * Use solveCandidate, or spread CANDIDATE_OPTS first and a test's own arm options after it, never before it
 * (an arm's pclsInterp false before the spread is silently overwritten: research/tests/candidate.test.mjs scans for it).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solvePlan } from '../../src/solver/solve.js';
import { RESEARCH_OPTS } from './research-opts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CANDIDATE_OPTS = Object.freeze({
  bridgeRead: 'reader', tierState: true, jointWorlds: true, bequestWeight: 0.02,
  bridgeStep: 'exact',
  switchCharge: 0.001, switchMargin: 0,
  ...RESEARCH_OPTS,
});
/* the tier set the candidate's plan carries: O60's blend medians (candidatePlan) */
export const CANDIDATE_TIERS = 'o60-blend';
export const TIERS = Object.freeze(['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk']);
/* O60's blend medians, read from results-o60.txt as audit-7ai.mjs reads them; a missing row is an error, not a default */
export function blendReals(text = readFileSync(join(HERE, 'results-o60.txt'), 'utf8')) {
  const out = {};
  for (const k of TIERS) {
    const m = new RegExp(`^  ${k.replace(/\//g, '\\/')}\\s+\\S+\\s+(\\S+)%\\s+(\\S+)%`, 'm').exec(text);
    if (!m) throw new Error(`candidate: results-o60.txt has no row for ${k}`);
    out[k] = +m[2];
  }
  return Object.freeze(out);
}
/* the plan with each blended tier's real at its blend median; riskSource '' so normalizePlan keeps them (audit-7ai.mjs) */
export function candidatePlan(E, plan, reals = blendReals()) {
  const base = E.normalizePlan(plan), rp = {};
  for (const [k, p] of Object.entries(base.riskProfiles)) rp[k] = TIERS.includes(k) ? { ...p, real: reals[k] } : { ...p };
  return { ...plan, riskProfiles: rp, riskSource: '' };
}
/* the candidate's solve: its plan and options, then the caller's own (lambda, points, an arm's settings) on top */
export function solveCandidate(E, M, plan, extra = {}) {
  return solvePlan(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, ...extra });
}
