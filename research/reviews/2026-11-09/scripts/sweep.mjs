// EXPLORATORY: how much of a cash-heavy household's solved survival rests on the cash sweep the pages never show. Light settings, seed 4242.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
for (const id of process.argv.slice(3)) {
  const nS = Number(process.argv[2]);
  let plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
  const T = E.buildContext(plan).totalYears, paths = E.pathsForSeed(4242, nS, T);
  const surv = ctx => { let s = 0; for (const zs of paths) if (S.runPath(E, ctx, zs).survived) s++; return 100 * s / nS; };
  const t0 = Number(plan.spending.targetSpend); let lo = 0.3, hi = 4;
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (surv(S.yourContext(E, E.normalizePlan({ ...plan, spending: { ...plan.spending, targetSpend: t0 * mid } }))) > 85) lo = mid; else hi = mid; }
  plan = E.normalizePlan({ ...plan, spending: { ...plan.spending, targetSpend: Math.round(t0 * lo) } });
  const bal = c => plan.accounts.filter(a => a.id === c + '_self').reduce((t, a) => t + (Number(a.balance) || 0), 0), tot = plan.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0);
  // the same plan with the cash above six months' spending held in the stocks and shares ISA from the start, run by the plan's own rules
  const buffer = 0.5 * Number(plan.spending.targetSpend), cashAll = bal('cash') + bal('cashIsa'), move = Math.max(0, cashAll - buffer);
  let left = move;
  const invested = E.normalizePlan({ ...plan, accounts: plan.accounts.map(a => { if (a.id === 'cash_self' || a.id === 'cashIsa_self') { const take = Math.min(left, Number(a.balance) || 0); left -= take; return { ...a, balance: (Number(a.balance) || 0) - take }; } return a.id === 'isa_self' ? { ...a, balance: (Number(a.balance) || 0) + move } : a; }) });
  const solved = solveForApp(E, M, plan, LIGHT), sc = S.solvedContext(E, solved), base = sc.policyOverride;
  const noSweep = { ...sc, policyOverride: { ...base, choose: (st, t, held) => { const mv = base.choose(st, t, held); return mv ? { ...mv, sweepCash: false } : mv; } } };
  console.log(`${id}: cash ${Math.round(cashAll)} of ${Math.round(tot)} (${(100 * cashAll / tot).toFixed(0)}%), target ${plan.spending.targetSpend}: the plan's rules ${surv(S.yourContext(E, plan)).toFixed(1)}%; the plan's rules with the spare cash (${Math.round(move)}) in the ISA from the start ${surv(S.yourContext(E, invested)).toFixed(1)}%; solved ${surv(sc).toFixed(1)}%; solved, every shown action taken but the cash left where it is ${surv(noSweep).toFixed(1)}%`);
}
