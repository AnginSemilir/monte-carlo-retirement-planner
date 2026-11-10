import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
console.log('grossUpNet(2880 net, salary 0):', E.grossUpNet(2880, 0).toFixed(0), '(HMRC: 3,600 for a non-earner)');
console.log('grossUpNet(20000 net, salary 0, cap 60000):', E.grossUpNet(20000, 0, undefined, 60000).toFixed(0), '(HMRC: a non-earner can get relief on 3,600 gross only)');
console.log('netCostOfPensionContrib(3600, salary 0):', E.netCostOfPensionContrib(3600, 0).toFixed(0), '(HMRC: 2,880)');
// salary sacrifice in 2030 for a basic-rate employee: the engine's relief on 10,000 sacrificed from 40,000
const r = E.calculateMarginalRelief ? E.calculateMarginalRelief(40000, 10000) : null;
console.log('relief on 10,000 sacrificed from a 40,000 salary:', r ? `${r.taxSaved.toFixed(0)} (${r.reliefRate.toFixed(0)}%)` : 'n/a', '(from April 2029: NIC relief on the first 2,000 only, so 2,000 + 160 = 2,160)');
