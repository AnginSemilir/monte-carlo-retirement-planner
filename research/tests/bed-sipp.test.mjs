/*
 * BED & SIPP: RELIEF ONLY WHERE THE RULES GIVE IT (STATE.md D36; Phase 4's design review of 27 Oct, finding 1). The
 * tournament's capital move at scope 'full' (bedAndSippFor) sized a non-earner's contribution at the full annual allowance
 * (£60,000 gross) and relieved it at the higher rate, where the rules give relief only up to relevant UK earnings or the
 * no-earnings limit (£3,600 gross), at the basic rate at source. The checks:
 *   1. a retired non-earner (S024: 68, retired, no salary, an ISA to move): the gross at most the no-earnings limit, no
 *      refund beyond the relief at source;
 *   2. the same through the tournament at scope 'full': no player adds more than the no-earnings limit to the pension at
 *      year 0, nor any refund to cash;
 *   3. an earner (S224: 55, working, a higher-rate salary): the gross within the allowance and the salary, the refund the
 *      higher-rate relief on it (incomeTax(salary) less incomeTax(salary - gross), less the relief at source) as before;
 *   4. scope 'contributions' (as the app ships): no capital move at all.
 *   node research/tests/bed-sipp.test.mjs
 */
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const all = buildScenarios(), planOf = id => E.resolveMpaa(E.normalizePlan(all.find(s => s.id === id).plan));
const P = E.taxParams(planOf('S024').config), LIMIT = P.pensionNoEarningsLimit;
const none = { penByOwner: [0, 0] };

// 1. the retired non-earner
{ const ctx = E.buildContext(planOf('S024')), bs = E.bedAndSippFor(ctx, none, 1e6, 'full');
  const gross = bs ? bs.transfer.gross : 0, refund = bs ? bs.transfer.refund : 0;
  ok(gross <= LIMIT + 1e-6 && refund <= 1e-6, `S024 (retired, no earnings): Bed & SIPP gross £${gross.toFixed(2)} (at most the no-earnings limit £${LIMIT}), refund £${refund.toFixed(2)} (none beyond the relief at source)`); }

// 2. through the tournament at scope 'full': the pension's opening balance and the cash, player by player, against the plan's
{ const plan = planOf('S024'), t = E.buildTournament(plan, { scope: 'full' }), base = Object.fromEntries(plan.accounts.map(a => [a.id, E.num(a.balance, 0)]));
  let worstPen = 0, worstCash = 0, players = 0;
  for (const s of t.strategies) for (const c of (s.candidates || (s.planState ? [{ planState: s.planState }] : []))) {
    if (!c.planState) continue; players++;
    for (const a of c.planState.accounts) { const d = E.num(a.balance, 0) - (base[a.id] || 0); if (/^Pensions/.test(a.category)) worstPen = Math.max(worstPen, d); if (/^Cash Savings/.test(a.category)) worstCash = Math.max(worstCash, d); }
  }
  ok(players > 0 && worstPen <= LIMIT + 1e-6 && worstCash <= 1e-6, `S024 through the tournament at scope 'full' (${players} plans): the pension's opening balance up by at most £${worstPen.toFixed(2)}, cash by £${worstCash.toFixed(2)}`); }

// 3. the earner: unchanged, the higher-rate relief on a gross within the allowance and the salary
{ const ctx = E.buildContext(planOf('S224')), Q = ctx.P, o = ctx.owners[0], bs = E.bedAndSippFor(ctx, none, 1e6, 'full');   // S224 pays Scottish tax: its own rates
  const gross = bs ? bs.transfer.gross : 0, want = gross > 0 ? Math.max(0, E.incomeTax(o.salary, Q) - E.incomeTax(Math.max(0, o.salary - gross), Q) - gross * Q.reliefAtSource) : 0;
  ok(bs && gross <= Math.min(Q.aaAt(o.salary), o.salary) + 1e-6 && Math.abs(bs.transfer.refund - want) < 1e-6 && want > 0, `S224 (working, salary £${o.salary}): gross £${gross.toFixed(2)} within the allowance and the salary, refund £${bs ? bs.transfer.refund.toFixed(2) : '-'} (the higher-rate relief, £${want.toFixed(2)})`); }

// 4. as the app ships: scope 'contributions' moves no capital
ok(E.bedAndSippFor(E.buildContext(planOf('S024')), none, 1e6, 'contributions') === null && E.bedAndSippFor(E.buildContext(planOf('S224')), none, 1e6, 'contributions') === null, "scope 'contributions': no Bed & SIPP move");

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
