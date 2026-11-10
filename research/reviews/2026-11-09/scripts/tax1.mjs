import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const P = E.taxParams ? E.taxParams(undefined) : null;
console.log('exports has taxParams', !!E.taxParams, Object.keys(E).filter(k=>/tax|Tax|pension|Pension|gross|nic/i.test(k)).join(' '));
const it = (g, cfg) => E.incomeTax(g, cfg);
const rows = [12570, 20000, 50270, 60000, 100000, 110000, 125140, 150000];
for (const g of rows) console.log('rUK', g, it(g).toFixed(2));
const sc = { ...E.DEFAULT_CONFIG, taxRegion: 'scotland' };
for (const g of [12570, 16537, 20000, 29526, 43662, 50270, 75000, 100000, 110000, 125140, 150000]) console.log('Scot', g, it(g, sc).toFixed(2));
if (P) {
  console.log('savingsTax(8000, 9000)', P.savingsTax(8000, 9000), 'HMRC: 0');
  console.log('savingsTax(10000, 10000)', P.savingsTax(10000, 10000), 'HMRC: 286');
  console.log('savingsTax(0, 14000)', P.savingsTax(0, 14000), 'HMRC 286 alone');
  console.log('savingsTax(12570, 14000)', P.savingsTax(12570, 14000), 'HMRC 1600');
  console.log('savingsTax(17570,3000) ', P.savingsTax(17570, 3000), 'HMRC: srBand 0, PSA 1000 -> 2000*.2=400');
  console.log('savingsTax(49000,3000) ', P.savingsTax(49000, 3000), 'HMRC: higher-rate payer (total 52000>50270): PSA 500; 2500 taxable: 1270@20% + 1230... ');
  console.log('dividendTax(0,0,6000)', P.dividendTax(0, 0, 6000), ' dividendTax(12570,0,6000)', P.dividendTax(12570, 0, 6000));
  console.log('cgtBandWidth', P.cgtBandWidth, 'higherRateStartsAt', P.higherRateStartsAt, 'lsa', P.lsa);
}
console.log('gross for huge net with PA ceiling, no other income', E.grossPensionNeededForNet(1e12, 0, undefined, false, 268275, 12570));
console.log('gross needed for 30000 net, none other', E.grossPensionNeededForNet(30000, 0, undefined, false, 268275, Infinity));
