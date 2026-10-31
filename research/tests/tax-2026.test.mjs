/*
 * THE ENGINE'S 2026/27 RULES (the external review of 21 Oct, F0a; Part B Step 1, item 7), each pinned to the published
 * figure, worked by hand here rather than read back from the engine's own config:
 *   1. dividends: 10.75% and 35.75% from 6 April 2026, 39.35% unchanged, £500 allowance (the review's sources: LITRG,
 *      Deloitte's tables);
 *   2. Scotland 2026/27: starter 19% to £16,537, basic 20% to £29,526, intermediate 21% to £43,662 (gov.scot);
 *   3. savings interest at the UK rates and bands whatever the region (LITRG): a Scottish taxpayer's interest taxed as rUK's;
 *   4. reinvested dividends add to the taxable account's cost (no GIA sale, the year's basis rises by the dividends);
 *   5. the valuation date read as a local date: a 1 January plan has a whole first year under TZ=America/New_York too.
 * Each was shown failing on the engine before the fix (results-tax-2026.txt).
 *   node research/tests/tax-2026.test.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const near = (a, b) => Math.abs(a - b) < 0.005;
const P = E.taxParams(E.DEFAULT_CONFIG), PS = E.taxParams({ ...E.DEFAULT_CONFIG, taxRegion: 'scotland' });

// 1. dividends above £20,000 of other income (all within the basic band): (4,000 - 500) x 10.75%; and £60,000 + £20,000:
// the slice to £50,270 at 10.75%, the rest at 35.75%, the allowance at the bottom of the dividends
const d1 = P.dividendTax(20000, 0, 4000), d1want = 3500 * 0.1075;
const d2 = P.dividendTax(60000, 0, 20000), d2want = 19500 * 0.3575;   // all of it above £60,500, in the higher band
ok(near(d1, d1want) && near(d2, d2want), `dividends: £4,000 on £20,000 pays £${d1.toFixed(2)} (published rates: £${d1want.toFixed(2)}); £20,000 on £60,000 pays £${d2.toFixed(2)} (£${d2want.toFixed(2)})`);

// 2. a Scottish taxpayer on £30,000 of non-savings income: 19% to £16,537, 20% to £29,526, 21% on the rest
const sc = E.incomeTax(30000, PS), scWant = (16537 - 12570) * 0.19 + (29526 - 16537) * 0.20 + (30000 - 29526) * 0.21;
ok(near(sc, scWant), `Scotland 2026/27: income tax on £30,000 is £${sc.toFixed(2)} (published bands: £${scWant.toFixed(2)})`);

// 2b. V2's worked examples (Part B Step 5): one income in each band of each region, worked from the published 2026/27
// bands (the allowance £12,570, tapered away from £100,000 to £125,140; rUK 20/40/45 to £50,270 and £125,140; Scotland
// 19/20/21/42/45/48 to £16,537, £29,526, £43,662, £75,000 and £125,140), and a Scottish taxpayer's dividends at the UK bands
{
  const PA = 12570, rukW = [[30000, 17430 * 0.20], [80000, 37700 * 0.20 + 29730 * 0.40], [150000, 37700 * 0.20 + 87440 * 0.40 + 24860 * 0.45]];
  const scotBands = (g, pa) => { const tops = [16537, 29526, 43662, 75000, 125140].map(l => l - Math.min(PA, l <= 100000 ? PA : Math.max(0, PA - (l - 100000) / 2))), rates = [0.19, 0.20, 0.21, 0.42, 0.45, 0.48], x = g - pa; let tax = 0, prev = 0; tops.concat([Infinity]).forEach((top, i) => { const w = Math.min(x, top) - prev; if (w > 0) tax += w * rates[i]; prev = Math.max(prev, Math.min(x, top)); }); return tax; };
  const sc = [[14000, PA], [25000, PA], [40000, PA], [60000, PA], [100000, PA], [150000, 0]].map(([g, pa]) => [g, scotBands(g, pa)]);
  const worst = [...rukW.map(([g, want]) => Math.abs(E.incomeTax(g, P) - want)), ...sc.map(([g, want]) => Math.abs(E.incomeTax(g, PS) - want))];
  ok(worst.every(d => d < 0.01), `income tax in every band: rUK at ${rukW.map(([g]) => g).join(', ')} and Scotland at ${sc.map(([g]) => g).join(', ')}, each within a penny of the published bands (worst ${Math.max(...worst).toFixed(4)})`);
  const dB = PS.dividendTax(40000, 0, 10000), dH = PS.dividendTax(60000, 0, 10000);
  ok(near(dB, 9500 * 0.1075) && near(dH, 9500 * 0.3575), `a Scottish taxpayer's dividends at the UK bands: £10,000 on £40,000 pays £${dB.toFixed(2)} (£${(9500 * 0.1075).toFixed(2)}), on £60,000 £${dH.toFixed(2)} (£${(9500 * 0.3575).toFixed(2)})`);
}

// 3. savings: £5,000 of interest on £45,000 (a basic-rate taxpayer by total income £50,000: £1,000 allowance, then 20%)
const sv = PS.savingsTax(45000, 5000), svR = P.savingsTax(45000, 5000);
ok(near(sv, 800) && near(svR, 800), `savings interest at the UK bands: £5,000 on £45,000 pays £${sv.toFixed(2)} in Scotland and £${svR.toFixed(2)} in rUK (published: £800.00)`);

// 4. reinvested dividends: a year with no spending to fund, so the GIA is not sold; its cost rises by the year's dividends
{
  const plan = E.normalizePlan({
    demographics: { planningMode: 'single', currentAgeSelf: 70, retireAgeSelf: 60, terminalAge: 90, statePensionAge: 66, privatePensionAge: 57, statePensionSelf: 11976 },
    spending: { targetSpend: 0, spendBands: [] },
    accounts: [{ id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 100000, contrib: 0, growth: 0, risk: 'Medium Risk', unrealisedGain: 40000 }],
    config: { valuationDate: '2026-01-01', lookaheadYears: 0, guardrails: false }
  });
  const ctx = E.buildContext(plan), st = E.freshState(ctx), b0 = st.giaBasis.self;
  const row = E.stepYear(ctx, st, 0, 'expected');
  const rise = st.giaBasis.self - b0;
  ok(row.giaDividends > 0 && near(rise, row.giaDividends), `reinvested dividends: the GIA's cost rises by the year's dividends (£${rise.toFixed(2)} against £${row.giaDividends.toFixed(2)}; cost before £${b0.toFixed(0)})`);
}

// 5. the year fraction of a 1 January and a 2 July valuation date, in New York and in London
const yfIn = tz => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
  `const E = await import(${JSON.stringify(new URL('../engine.mjs', import.meta.url).href)}); const p = d => E.buildContext(E.normalizePlan({ demographics: { planningMode: 'single', currentAgeSelf: 60, retireAgeSelf: 60, terminalAge: 90 }, spending: { targetSpend: 20000 }, accounts: [], config: { valuationDate: d } })).yf; console.log(JSON.stringify([p('2026-01-01'), p('2026-07-02')]));`],
  { env: { ...process.env, TZ: tz }, cwd: fileURLToPath(new URL('.', import.meta.url)) }).toString().trim().split('\n').pop());
for (const tz of ['America/New_York', 'Europe/London', 'Asia/Tokyo']) {
  const [jan, jul] = yfIn(tz);
  ok(jan === 1 && Math.abs(jul - 183 / 365) < 0.003, `TZ=${tz}: a 1 January plan's first year is ${jan} of a year, a 2 July plan's ${jul.toFixed(4)} (183 days of 365: ${(183 / 365).toFixed(4)})`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} tax checks failed`);
