import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const all = buildScenarios();
const P = E.taxParams(undefined);
// HMRC's order: allowance against non-savings income first, then interest, then dividends; UK bands for both
const band = (lo, hi, rates) => { const cuts = [[0, 37700, rates[0]], [37700, 125140, rates[1]], [125140, Infinity, rates[2]]]; let t = 0; for (const [a, b, r] of cuts) { const w = Math.min(hi, b) - Math.max(lo, a); if (w > 0) t += w * r; } return t; };
function trueSavDiv(ns, i, d) {
  const pa = P.paAt(ns + i + d);
  const tns = Math.max(0, ns - pa); let left = Math.max(0, pa - ns);
  const ti = Math.max(0, i - left); left = Math.max(0, left - i);
  const td = Math.max(0, d - left);
  const tot = tns + ti + td;
  const psa = tot <= 37700 ? 1000 : tot <= 125140 ? 500 : 0;
  const zero = Math.min(ti, Math.max(0, 5000 - tns) + psa);
  const sav = band(tns + zero, tns + ti, [0.20, 0.40, 0.45]);
  const dz = Math.min(td, 500);
  const div = band(tns + ti + dz, tns + ti + td, [0.1075, 0.3575, 0.3935]);
  return { sav, div };
}
console.log('check: ns 12570, div 8489 ->', trueSavDiv(12570, 0, 8489).div.toFixed(0), '(hand 859); ns 8000 int 9000 ->', trueSavDiv(8000, 9000, 0).sav.toFixed(0), '(hand 0); ns 10000 int 10000 ->', trueSavDiv(10000, 10000, 0).sav.toFixed(0), '(hand 286)');
const f = v => Math.round(v);
const tally = (rows) => { let eng = 0, tru = 0, cgt = 0, inc = 0, spend = 0, maxGap = 0; for (const x of rows) { const ns = x.otherTaxableSelf + x.taxablePensionSelf; const t = trueSavDiv(ns, x.savingsInterest, x.giaDividends); const e = x.savingsTax + x.dividendTax; eng += e; tru += t.sav + t.div; cgt += x.cgtPaid; inc += x.taxPaid - e; spend += x.targetSpend; maxGap = Math.max(maxGap, t.sav + t.div - e); } return { eng, tru, cgt, inc, spend, maxGap }; };
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
for (const id of process.argv.slice(2)) {
  const plan = E.normalizePlan(all.find(s => s.id === id).plan);
  const own = tally(E.simulateDeterministic(E.resolveMpaa(plan), 'expected'));
  const r = solveForApp(E, M, plan, LIGHT);
  const { rows } = S.rowsOf(E, r, 'expected');
  const sol = tally(rows);
  const line = (n, a) => `${n}: interest+dividend tax engine ${f(a.eng)} / HMRC order ${f(a.tru)} (largest year's gap ${f(a.maxGap)}); CGT ${f(a.cgt)}; income tax ${f(a.inc)}; lifetime spend ${f(a.spend)}`;
  console.log(id, plan.config.taxRegion || 'ruk', '\n  ' + line('plan as entered', own) + '\n  ' + line('solved (light)', sol) + `\n  solved: cash ISA at start ${f(E.buildContext(plan).owners[0].cashIsa0 || 0)}, GIA end of year 0 ${f(rows[0].other)}, cashIsa end of year 0 ${f(rows[0].cashIsa)}`);
}
