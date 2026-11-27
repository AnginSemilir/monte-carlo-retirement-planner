/*
 * WHY TWO NOBODY-RETIRING UNITS LEAVE ABOUT HALF THE MEAN POT (post hoc, deciding nothing; D154 (5), D152's by-inference record;
 * written 27 Nov). The dress rehearsal (COUPLES-ANY.md amendment 2, EXPLORATORY, seed 7002, already read) ran N, a couple both
 * working past the plan's end, on four couples at two holdings; both arms survived every path and spent the same, and the
 * household route (ROUTE) left a mean pot `-54.469%` and `-55.178%` on S227's two units against the app's rules (APP), while
 * its pot up to the estate cap was a little higher. This reads the rehearsal's own arrays (results/couples-any-7002 in the
 * rehearsal's tree) and solves and runs nothing: for each N unit, the pot left by quantile under each arm and their ratio; the
 * share of the mean's gap that sits above the estate cap; the paths where ROUTE leaves more; lifetime tax and spending
 * delivered beside. A pot is the terminal pot the engine leaves (in today's money).
 *   node research/solver/couples-any-n-pot.mjs <the rehearsal's couples-any-7002> > research/solver/results-couples-any-n-pot.txt
 */
import { readdirSync } from 'node:fs';
import { loadDir } from './reduce-couples-open.mjs';

const dir = process.argv[2];
if (!dir) { console.error('couples-any-n-pot: <the rehearsal\'s results/couples-any-7002>'); process.exit(2); }
const files = readdirSync(dir).filter(f => /-N-(own|Y75)\.json\.gz$/.test(f)).sort();
if (files.length !== 8) { console.error(`couples-any-n-pot: ${files.length} N units, not 8`); process.exit(2); }
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const q = (a, p) => { const s = Float64Array.from(a).sort(), i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const QS = [0.1, 0.25, 0.5, 0.75, 0.9, 0.99];
console.log('WHY TWO NOBODY-RETIRING UNITS LEAVE ABOUT HALF THE MEAN POT (post hoc, deciding nothing; the dress rehearsal\'s arrays, seed 7002, already read; no unit solved or run)');
console.log('Each N unit (both working past the plan\'s end): the pot left by quantile, APP and ROUTE, in pounds of today; ROUTE less APP as a share of APP at each; the mean; the estate cap ROUTE\'s table counts the pot up to; and beside, lifetime tax and spending delivered, a path.');
for (const U of loadDir(dir, new Set(files.map(f => f.replace(/\.json\.gz$/, '')))).sort((a, b) => a.id < b.id ? -1 : 1)) {
  const A = U.arms.APP, R = U.arms.ROUTE, n = U.N;
  const cap = (U.caps || []).reduce((s, x) => s + x, 0);
  const surv = X => X.survived.reduce((s, x) => s + x, 0) / n;
  const line = QS.map(p => { const a = q(A.pot, p), r = q(R.pot, p); return `p${Math.round(100 * p)} ${gbp(a)} / ${gbp(r)} (${a > 0 ? `${r >= a ? '+' : ''}${(100 * (r / a - 1)).toFixed(1)}%` : 'n/a'})`; }).join('; ');
  const mA = mean(A.pot), mR = mean(R.pot);
  // the mean's gap split at the cap: the part of each pot up to the cap, and the part above it
  let upA = 0, upR = 0, abA = 0, abR = 0, routeMore = 0;
  for (let i = 0; i < n; i++) { const a = A.pot[i], r = R.pot[i]; upA += Math.min(a, cap); upR += Math.min(r, cap); abA += Math.max(0, a - cap); abR += Math.max(0, r - cap); if (r > a) routeMore++; }
  const gap = (mR - mA) * n, upG = upR - upA, abG = abR - abA;
  console.log(`\n${U.id} (${U.hold === 'own' ? 'the library\'s holding' : 'the younger holding 75%'}; survival APP ${(100 * surv(A)).toFixed(2)}%, ROUTE ${(100 * surv(R)).toFixed(2)}%; ${n} paths)`);
  console.log(`  the pot left, APP / ROUTE: ${line}`);
  console.log(`  the mean ${gbp(mA)} / ${gbp(mR)} (${(100 * (mR / mA - 1)).toFixed(3)}%); the estate cap ${cap > 0 ? gbp(cap) : 'none recorded'}${cap > 0 ? `: up to the cap ${gbp(upA / n)} / ${gbp(upR / n)} (${(100 * (upR / upA - 1)).toFixed(3)}%), above it ${gbp(abA / n)} / ${gbp(abR / n)}; of the mean's gap ${gbp(gap / n)} a path, ${(100 * abG / gap).toFixed(1)}% above the cap` : ''}`);
  console.log(`  ROUTE leaves more on ${routeMore} of ${n} paths; lifetime tax a path ${gbp(mean(A.tax))} / ${gbp(mean(R.tax))}; spending delivered a path ${gbp(mean(A.delivered))} / ${gbp(mean(R.delivered))}`);
}
