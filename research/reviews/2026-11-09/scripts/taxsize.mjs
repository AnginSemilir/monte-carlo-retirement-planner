// EXPLORATORY: what the missing salary is worth under the plan's own rules. The engine with a worker's salary at the bottom of
// their income stack (REPO_ROOT a copy with prototype/engine-hmrc.diff applied; switched by globalThis.__STACK_SALARY) against the
// engine as it is; 2,000 paths of seed 4242.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const all = buildScenarios(), N = 2000;
const one = (label, plan) => {
  const out = [];
  for (const on of [false, true]) {
    globalThis.__STACK_SALARY = on;
    const ctx = E.buildContext(E.resolveMpaa(plan)), paths = E.pathsForSeed(4242, N, ctx.totalYears);
    let s = 0, pot = 0; const flags = [];
    for (const zs of paths) { const r = E.runTrial(ctx, zs); if (r.survived) s++; pot += r.terminalPot; flags.push(r.survived); }
    const rows = E.simulateDeterministic(ctx, 'expected'); const tax = rows.reduce((t, x) => t + x.taxPaid + x.cgtPaid, 0);
    out.push({ s, pot: pot / N, tax, flags });
  }
  globalThis.__STACK_SALARY = false;
  let lost = 0, saved = 0; out[0].flags.forEach((f, i) => { if (f && !out[1].flags[i]) lost++; if (!f && out[1].flags[i]) saved++; });
  console.log(`${label}: survival ${(100 * out[0].s / N).toFixed(2)}% as it is, ${(100 * out[1].s / N).toFixed(2)}% with the salary stacked (${lost} lost, ${saved} saved of ${N}); mean pot left ${Math.round(out[0].pot)} and ${Math.round(out[1].pot)} (${(100 * (out[1].pot / out[0].pot - 1)).toFixed(1)}%); tax on the expected path ${Math.round(out[0].tax)} and ${Math.round(out[1].tax)}`);
};
for (const id of process.argv.slice(2)) one(id, E.normalizePlan(all.find(s => s.id === id).plan));
// the review's example: a couple, the first retired at 68, the second 60 and working to 66 on 60,000, the pension all the second's
const b = E.normalizePlan(all.find(s => s.id === 'S021').plan);
one('S021 altered (second person 60, working to 66 on 60,000, holding a 600,000 pension; no other money)', E.normalizePlan({ ...b, demographics: { ...b.demographics, currentAgePart: 60, retireAgePart: 66, salaryPart: 60000 },
  accounts: b.accounts.map(a => (a.id === 'pen_self' ? { ...a, balance: 0 } : a.id === 'pen_part' ? { ...a, balance: 600000, contrib: 0 } : /^(isa|other|cash|cashIsa)_/.test(a.id) ? { ...a, balance: 0 } : a)) }));
