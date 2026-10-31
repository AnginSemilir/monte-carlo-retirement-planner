/*
 * THE CANDIDATE WITH ONE TIER PAIR (the deep review after Phase 4, section 8 item 5; CHECKLIST 7). The candidate's tier
 * state (tierState, with its switchCharge and tableDealing: false) needs two tier pairs or more to track; with one, solve
 * threw ("tierState needs a tier menu of two pairs or more") where it should plan with the one pair held. Two ways in:
 * the user withdraws consent to change risk (`riskConsent: false`: the menu keeps the plan's own tiers alone), or the plan
 * holds its pension and ISA in Cash Equivalents (no step down from there). The checks, each a solve at 4 wealth points:
 *   1. the candidate with consent withdrawn solves, offers no tier move, and the engine runs under its table;
 *   2. the candidate on a plan whose pension and ISAs are in Cash Equivalents, consent given, solves (a plan with no pension
 *      or ISA at all keeps a tier ladder: checked, it does not reach the guard);
 *   3. the candidate with consent given, on a plan with tiers to move, keeps its tier state and its switch charge;
 *   4. the pattern search: the candidate under each other user setting solvePlan takes (the tier above on and off, no
 *      minimum pot, the lowest estate weight, raises blocked) with consent withdrawn, and the product's settings under the
 *      same, each solves.
 * Shown failing on the code before the fix (checks 1, 2 and every consent-withdrawn case of 4 threw).
 *   node research/tests/risk-consent.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const LAMBDA = 0.0223606797749979, RUN = { lambda: LAMBDA, points: 4, bequestWeight: 0.02 };
const all = buildScenarios();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => prep(JSON.parse(JSON.stringify(all.find(s => s.id === id).plan)));
const S224 = planOf('S224');
const inCash = (() => { const p = JSON.parse(JSON.stringify(all.find(s => s.id === 'S224').plan)); for (const a of p.accounts) if (/^Pensions$|^S&S ISAs$/.test(a.category)) a.risk = 'Cash Equivalents'; return prep(p); })();
const tryCand = (plan, extra) => { try { return { r: solveCandidate(E, M, plan, { ...RUN, ...extra }) }; } catch (e) { return { err: e.message }; } };
const tryShip = (plan, extra) => { try { return { r: solvePlan(E, M, candidatePlan(E, plan), { ...RUN, ...extra }) }; } catch (e) { return { err: e.message }; } };
const noTierMove = r => r.actions.every(a => !(a.tierPen || 0) && !(a.tierIsa || 0));
const engineRuns = r => { const ctx = E.buildContext(withTable(r.m.ctx.plan, r)); let alive = 0; for (const zs of E.pathsForSeed(99001, 50, ctx.totalYears)) alive += E.runTrial(ctx, Float64Array.from(zs)).survived ? 1 : 0; return alive; };
const said = x => (x.err ? `threw: ${x.err}` : `solved (${x.r.actions.length} moves, tier state ${x.r.meta.tierState || 'off'})`);

// 1. consent withdrawn
{ const x = tryCand(S224, { riskConsent: false });
  const alive = x.r ? engineRuns(x.r) : null;
  ok(x.r && noTierMove(x.r) && !x.r.meta.tierState && alive !== null, `1. S224, the candidate, consent withdrawn: ${said(x)}${x.r ? `; no tier move offered: ${noTierMove(x.r)}; the engine under its table: ${alive} of 50 paths survive` : ''}`); }
// 2. a pension and ISAs in Cash Equivalents: one tier pair with consent given
{ const x = tryCand(inCash, {});
  ok(x.r && noTierMove(x.r) && !x.r.meta.tierState, `2. S224 with its pension and ISAs in Cash Equivalents, the candidate, consent given: ${said(x)}`); }
// 3. consent given, tiers to move: the tier state and its charge as before
{ const x = tryCand(S224, {});
  ok(x.r && !!x.r.meta.tierState && x.r.switchCharge > 0 && !noTierMove(x.r), `3. S224, the candidate, consent given: ${said(x)}; switch charge ${x.r ? x.r.switchCharge : '-'}`); }
// 4. the pattern search: every other user setting, with consent withdrawn, on the candidate and the product's settings
const levers = [['the tier above on', { riskAbove: true }], ['the tier above off', { riskAbove: false }], ['no minimum pot', { minPotYears: 0 }],
  ['the lowest estate weight', { estateWeight: 0.01 }], ['raises blocked', { raiseCap: 1 }]];
for (const [nm, lever] of levers) {
  const c = tryCand(S224, { riskConsent: false, ...lever }), s = tryShip(S224, { riskConsent: false, ...lever });
  ok(!!c.r && !!s.r, `4. S224, consent withdrawn, ${nm}: the candidate ${said(c)}; the product's settings ${said(s)}`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
