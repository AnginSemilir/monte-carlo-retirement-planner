/*
 * THE PATTERN SEARCH FOR paired-exact.mjs (CHECKLIST 7; EXPLORATORY, deciding nothing). Of the reducers, two read a paired
 * survival change's point value (stats.mjs survivalChangeU, formed as a difference of two rounded proportions) against a
 * bar: reduce-other-order.mjs (its part (b); the tie it met is results-other-order-beside.txt A, with the maintainer) and
 * reduce-share-choose.mjs (its parts (i) to (iv)). The rest compare interval ends, which are not whole paths, or a change
 * with nought or with twice its standard error. This reads SHARE-CHOOSE's units through its own rule and asks of each point
 * comparison whether its change sits exactly on its bar in whole paths, and whether the floating form reads it otherwise.
 *   node research/solver/paired-exact-search.mjs > research/solver/results-paired-exact.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rule, armOf, RULE } from './reduce-share-choose.mjs';
import { cmpBar } from './paired-exact.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), DIR = process.argv[2] || join(HERE, 'results', 'share-choose-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
const R = rule(units);
const k = c => c.saved - c.lost, n = c => c.a + c.lost + c.saved + c.d;
const rows = [];
const test = (what, c, d, bar, op) => { const ex = cmpBar(k(c), n(c), bar), fl = d < bar ? -1 : d > bar ? 1 : 0; rows.push({ what, k: k(c), N: n(c), bar, exact: ex, float: fl, op }); };
for (const h of R.H) test(`(ii) ${h.id} pots against the pick`, h.pots.cells, h.pots.d, -RULE.unit, '<');
test('(i) pooled cross', R.i.cross.cells, R.i.cross.d, RULE.pooled, '<');
test('(iii) pooled means', R.iii.pooled.cells, R.iii.pooled.d, -RULE.means, '<');
for (const key of Object.keys(R.iv)) test(`(iv) pooled ${key}`, R.iv[key].pooled.cells, R.iv[key].pooled.d, RULE.lightPooled, '>');
const onBar = rows.filter(r => r.exact === 0), differ = rows.filter(r => r.exact !== r.float);
console.log(`SHARE-CHOOSE's point comparisons against their bars (EXPLORATORY, deciding nothing): ${rows.length} comparisons; exactly on a bar in whole paths: ${onBar.length}; the floating form reading one differently from the exact: ${differ.length}`);
for (const r of [...onBar, ...differ]) console.log(`  ${r.what}: ${r.k} of ${r.N} paths against ${r.bar}: exact ${r.exact}, float ${r.float}`);
