// EXPLORATORY: the single solver (light settings, 4 wealth points) against the plan's own rules on a library household,
// as the library has it and with a feature no library household carries: a DB pension, or a gain already in the taxable account.
// Seed 4242, not a registered seed; each variant's target landed so the plan's own rules survive about 85% on these paths.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, nS] = [process.argv[2], Number(process.argv[3] || 300)];
const base = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const age = Number(base.demographics.currentAgeSelf);
const variants = {
  'as the library has it': p => p,
  'DB pension 15,000 a year': p => ({ ...p, otherIncomes: [{ id: 'db1', owner: 'Myself', name: 'DB', type: 'otherTaxable', amount: 15000, startAge: age, endAge: 120 }] }),
  'DB pension 30,000 a year': p => ({ ...p, otherIncomes: [{ id: 'db1', owner: 'Myself', name: 'DB', type: 'otherTaxable', amount: 30000, startAge: age, endAge: 120 }] }),
  'half the taxable account a gain': p => ({ ...p, accounts: p.accounts.map(a => (a.id === 'other_self' ? { ...a, unrealisedGain: (Number(a.balance) || 0) / 2 } : a)) })
};
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
for (const [name, make] of Object.entries(variants)) {
  let plan = E.normalizePlan(make(base));
  const T = E.buildContext(plan).totalYears, paths = E.pathsForSeed(4242, nS, T);
  const rules = p => { const ctx = S.yourContext(E, p); let s = 0; for (const zs of paths) if (S.runPath(E, ctx, zs).survived) s++; return s; };
  const t0 = Number(plan.spending.targetSpend); let lo = 0.3, hi = 4;
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (rules(E.normalizePlan({ ...plan, spending: { ...plan.spending, targetSpend: t0 * mid } })) > 0.85 * nS) lo = mid; else hi = mid; }
  plan = E.normalizePlan({ ...plan, spending: { ...plan.spending, targetSpend: Math.round(t0 * lo) } });
  const ctxOwn = S.yourContext(E, plan);
  const inc = ctxOwn.otherIncomes.map(i => `${i.amount}${i.taxFree ? ' tax-free' : ''} from ${i.startAge}`).join(', ') || 'none';
  let solved; try { solved = solveForApp(E, M, plan, LIGHT); } catch (e) { console.log(`${id}, ${name}: target ${plan.spending.targetSpend}; the solve threw: ${String(e.message).slice(0, 200)}`); continue; }
  const ctxS = S.solvedContext(E, solved);
  let a = 0, b = 0, saved = 0, lost = 0, dA = 0, dB = 0, tg = 0;
  for (const zs of paths) { const r = S.runPath(E, ctxOwn, zs), s = S.runPath(E, ctxS, zs); if (r.survived) a++; if (s.survived) b++; if (s.survived && !r.survived) saved++; if (!s.survived && r.survived) lost++; dA += r.delivered; dB += s.delivered; tg += r.target; }
  console.log(`${id}, ${name}: other income ${inc}; target ${plan.spending.targetSpend}; the plan's rules ${(100 * a / nS).toFixed(1)}%, solved (light) ${(100 * b / nS).toFixed(1)}%; ${saved} saved, ${lost} lost of ${nS}; spending delivered ${(100 * dA / tg).toFixed(1)}% and ${(100 * dB / tg).toFixed(1)}% of target`);
}
