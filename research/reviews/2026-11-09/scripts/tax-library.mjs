// EXPLORATORY (external review, 10 Nov): what HMRC's order does to the survival the app's own rules show, household by household.
//   REPO_ROOT=<a copy with prototype/engine-hmrc.diff applied> node tax-library.mjs [paths 1000] [seed 99001]
// Every library household already in a `touched` list (phase4-orders.json, couples-orders.json), the plan as entered, no solver:
// the engine as it is, with a worker's pay in the stack (1.1), and with HMRC's order too (1.2, 1.3), on the same paths.
import fs from 'node:fs';
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [nP, seed] = [Number(process.argv[2] || 1000), Number(process.argv[3] || 99001)];
const touched = new Set([...JSON.parse(fs.readFileSync(R + '/research/solver/phase4-orders.json', 'utf8')).touched.ids, ...JSON.parse(fs.readFileSync(R + '/research/solver/couples-orders.json', 'utf8')).touched.ids]);
const set = (a, b) => { globalThis.__STACK_SALARY = a; globalThis.__HMRC_ORDER = b; };
const out = [];
for (const s of buildScenarios()) {
  if (!touched.has(s.id)) continue;
  const plan = E.resolveMpaa(E.normalizePlan(s.plan)), d = plan.demographics;
  const bal = c => plan.accounts.filter(a => a.id.startsWith(c + '_')).reduce((t, a) => t + (Number(a.balance) || 0), 0), tot = plan.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const r = { id: s.id, couple: d.planningMode !== 'single', working: Number(d.currentAgeSelf) < Number(d.retireAgeSelf), gia: bal('other') / tot, cash: (bal('cash')) / tot };
  const V = [[false, false], [true, false], [true, true]].map(([a, b]) => {
    set(a, b);
    const ctx = E.buildContext(plan), paths = E.pathsForSeed(seed, nP, ctx.totalYears);
    const flags = paths.map(zs => E.runTrial(ctx, zs).survived);
    const tax = E.simulateDeterministic(ctx, 'expected').reduce((t, x) => t + x.taxPaid + x.cgtPaid, 0);
    return { s: flags.filter(Boolean).length, flags, tax };
  });
  set(false, false);
  r.base = 100 * V[0].s / nP; r.pay = 100 * (V[1].s - V[0].s) / nP; r.all = 100 * (V[2].s - V[0].s) / nP; r.tax0 = V[0].tax; r.tax2 = V[2].tax;
  r.lost = V[0].flags.filter((f, i) => f && !V[2].flags[i]).length; r.saved = V[0].flags.filter((f, i) => !f && V[2].flags[i]).length;
  out.push(r);
}
const f1 = v => (v >= 0 ? '+' : '') + v.toFixed(1), n = out.length, by = (k) => [...out].sort((a, b) => a[k] - b[k]);
const cnt = (g) => out.filter(g).length;
console.log(`${n} library households already touched (${cnt(r => r.couple)} couples, ${cnt(r => r.working)} still working), the plan as entered, ${nP} paths of seed ${seed}; EXPLORATORY`);
console.log(`survival, HMRC's order and a worker's pay in the stack, less the engine as it is (points): mean ${f1(out.reduce((t, r) => t + r.all, 0) / n)}; median ${f1(by('all')[Math.floor(n / 2)].all)}; worst ${f1(by('all')[0].all)}; best ${f1(by('all')[n - 1].all)}`);
console.log(`households losing over 1 point: ${cnt(r => r.all < -1)}; over 3: ${cnt(r => r.all < -3)}; over 5: ${cnt(r => r.all < -5)}; gaining over 1: ${cnt(r => r.all > 1)}; within 0.5 either way: ${cnt(r => Math.abs(r.all) <= 0.5)}`);
console.log(`a worker's pay alone (1.1): mean ${f1(out.reduce((t, r) => t + r.pay, 0) / n)}; worst ${f1(by('pay')[0].pay)}; households losing over 1 point: ${cnt(r => r.pay < -1)}`);
const grp = (name, g) => { const xs = out.filter(g); if (xs.length) console.log(`  ${name}: ${xs.length} households, mean ${f1(xs.reduce((t, r) => t + r.all, 0) / xs.length)}, worst ${f1(Math.min(...xs.map(r => r.all)))}; tax on the expected path up ${Math.round(xs.reduce((t, r) => t + (r.tax2 - r.tax0), 0) / xs.length).toLocaleString('en-GB')} a household`); };
grp('a quarter or more in the taxable account', r => r.gia >= 0.25); grp('less than a quarter there', r => r.gia < 0.25);
grp('still working', r => r.working); grp('retired', r => !r.working); grp('couples', r => r.couple); grp('singles', r => !r.couple);
console.log('the twelve that lose most:'); by('all').slice(0, 12).forEach(r => console.log(`  ${r.id}${r.couple ? ' (couple)' : ''}${r.working ? ' working' : ' retired'}, ${Math.round(100 * r.gia)}% in the taxable account: ${r.base.toFixed(1)}% as it is, ${f1(r.all)} (${r.lost} lost, ${r.saved} saved); pay alone ${f1(r.pay)}; tax on the expected path ${Math.round(r.tax0).toLocaleString('en-GB')} to ${Math.round(r.tax2).toLocaleString('en-GB')}`));
console.log('the five that gain most:'); by('all').slice(-5).reverse().forEach(r => console.log(`  ${r.id}${r.couple ? ' (couple)' : ''}, ${Math.round(100 * r.gia)}% in the taxable account, ${Math.round(100 * r.cash)}% in cash outside an ISA: ${r.base.toFixed(1)}% as it is, ${f1(r.all)}; tax ${Math.round(r.tax0).toLocaleString('en-GB')} to ${Math.round(r.tax2).toLocaleString('en-GB')}`));
