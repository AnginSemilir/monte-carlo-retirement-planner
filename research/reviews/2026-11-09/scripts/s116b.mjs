import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const id = process.argv[2] || 'S116', pts = Number(process.argv[3] || 4), ny = Number(process.argv[4] || 10);
const sc = buildScenarios().find(s => s.id === id);
let plan = E.normalizePlan(sc.plan);
if (process.argv[5]) plan = E.normalizePlan({ ...plan, config: { ...plan.config, ...JSON.parse(process.argv[5]) } });
const LIGHT = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t0 = Date.now();
const r = solveForApp(E, M, plan, LIGHT);
console.log(id, 'solved in', ((Date.now() - t0) / 1000).toFixed(1), 's; actions', r.actions.length);
const { rows, parts } = S.rowsOf(E, r, 'expected');
const f = v => Math.round(v);
for (let t = 0; t < Math.min(ny, rows.length); t++) {
  const x = rows[t], p = parts[t];
  console.log(`t${t} age ${x.ageSelf} move ${p ? `lvl ${p.level} draw ${p.draw} isaFirst ${p.isaFirst} harvest ${p.harvest} tier ${p.tierPen}/${p.tierIsa}` : '-'} | spend ${f(x.targetSpend)} netG ${f(x.netGuaranteed)} | penDrawn ${f(x.drawdownPensions)} taxablePen ${f(x.taxablePensionSelf)} otherTaxable ${f(x.otherTaxableSelf)} harvested ${f(x.harvested)} | tax ${f(x.taxPaid)} cgt ${f(x.cgtPaid)} gains ${f(x.realisedGains)} int ${f(x.savingsInterest)} intTax ${f(x.savingsTax)} div ${f(x.giaDividends)} divTax ${f(x.dividendTax)} | pots pen ${f(x.pensions)} isa ${f(x.isas)} gia ${f(x.other)} cash ${f(x.cash)} cashIsa ${f(x.cashIsa)} unmet ${f(x.unmetDemand)}`);
}
console.log('action 0 sample', JSON.stringify(r.actions[0]).slice(0, 400));
console.log('lump among actions:', r.actions.filter(a => a.lump).length, 'of', r.actions.length, '; harvest ceilings:', [...new Set(r.actions.map(a => a.harvest ? (a.harvestCeil || 'pa') : 'none'))].join(','), '; steps set size', new Set(r.actions.map(a => a.steps.join('>'))).size);
console.log([...new Set(r.actions.map(a => a.steps.join('>')))].join('\n'));
