// Does the candidate run (a) with the user's consent to change risk withdrawn, (b) on a plan whose wrappers sit at the lowest tier?
import * as E from '../../../../../research/engine.mjs';
import * as M from '../../../../../src/solver/model.js';
import { solveCandidate } from '../../../../../research/solver/candidate.mjs';
import { readPanel } from '../../../../../research/solver/phase4-panel.mjs';
import { LAMBDA } from '../../../../../research/solver/audit-phase4.mjs';
const h = readPanel().find(x => x.id === 'S074');
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(h.plan);
console.log('accounts', plan.accounts.map(a => `${a.category || a.cat || a.type}:${a.risk || a.riskProfile}`).join(', '));
const tryIt = (label, p, extra) => { const t0 = Date.now(); try { const r = solveCandidate(E, M, p, { lambda: LAMBDA, points: 6, bequestWeight: 0.02, ...extra }); console.log(`${label}: solved (${r.actions.length} moves, tiers ${r.meta.tiers ? r.meta.tiers.length : 'none'}) in ${Date.now() - t0} ms`); } catch (e) { console.log(`${label}: THROWS: ${e.message}`); } };
tryIt('the candidate, consent given', plan, {});
tryIt('the candidate, riskConsent false', plan, { riskConsent: false });
const low = JSON.parse(JSON.stringify(plan)); for (const a of low.accounts) { if ('risk' in a) a.risk = 'Low Risk'; if ('riskProfile' in a) a.riskProfile = 'Low Risk'; }
tryIt('the candidate, every account at Low Risk', prep(low), {});
