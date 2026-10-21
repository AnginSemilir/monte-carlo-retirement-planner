// TAX CHECKS (external review, 21 Oct 2026; Part A, F0a). Savings tax for a Scottish and an rUK taxpayer, dividend tax at
// the engine's rates and at 2026/27's, and the year fraction of a 1 January valuation date in the machine's time zone.
// usage (from the repository root): [TZ=America/New_York] node research/reviews/2026-10-21/scripts/engine-checks/tax.mjs
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const D = E.DEFAULT_CONFIG;
const ruk = E.taxParams({ ...D, taxRegion: 'ruk' }), sco = E.taxParams({ ...D, taxRegion: 'scotland' });
for (const [ns, i] of [[30000, 5000], [45000, 5000], [60000, 3000]]) {
  console.log(`savings tax, non-savings ${ns}, interest ${i}: rUK ${ruk.savingsTax(ns, i).toFixed(2)}  Scotland (engine) ${sco.savingsTax(ns, i).toFixed(2)}`);
}
console.log('incomeTax rUK 110000:', E.incomeTax(110000, ruk).toFixed(2), ' Scotland 110000:', E.incomeTax(110000, sco).toFixed(2));
const div26 = E.taxParams({ ...D, dividendBasicRate: 10.75, dividendHigherRate: 35.75 });
for (const [ns, dv] of [[20000, 4000], [60000, 20000]]) console.log(`dividend tax ns ${ns} div ${dv}: engine default ${ruk.dividendTax(ns, 0, dv).toFixed(2)}  at 2026/27 rates (10.75/35.75) ${div26.dividendTax(ns, 0, dv).toFixed(2)}`);
console.log('yf(2026-01-01) in this TZ', process.env.TZ, '=', E.calculateYearFraction('2026-01-01'));
