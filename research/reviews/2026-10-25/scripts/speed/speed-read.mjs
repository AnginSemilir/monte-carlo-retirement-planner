/*
 * Gate 5's gap, read from the timings (the external review's speed groundwork, 25 Oct; EXPLORATORY: this machine, two
 * jobs sharing two cores, not gate 5's quiet four-core machine). On one core: the product (solvePlan at 30 points), the
 * latest candidate (HR and the third step at 45 points; its solve times from the purpose test's logs, no profiler) and the
 * prototype (the same with the table solved without the switch's dealing cost). Gate 5 asks the candidate split across four
 * cores (E2) for at most 1.25 times the product on one, on each household; E2X (6 Oct) measured that split at 3.7 to 4.3
 * times, so a one-core ratio is read over 4.3 (the best case) to 3.7. n1-compare.mjs's logs, where given, add both of
 * their solves (the candidate and the prototype, one process); timeq-n1.sh's files add the prototype alone.
 *   node speed-read.mjs <timings dir> <purpose-test logs dir> [n1-compare logs ...]
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const [tdir, ldir, ...n1logs] = process.argv.slice(2);
const prod = {}, cand = {}, proto = {}, src = {};
for (const f of readdirSync(tdir)) {
  if (!f.endsWith('.json')) continue;
  const last = readFileSync(join(tdir, f), 'utf8').trim().split('\n').pop();
  if (!last || last[0] !== '{') continue;   // a run still going, or one that failed
  const j = JSON.parse(last);
  if (j.arm === 'PRODUCT') prod[j.who] = j.secs;
  if (j.arm === 'HRT3-N1') { proto[j.who] = j.secs; src[j.who] = 'alone'; }
}
for (const f of readdirSync(ldir)) {
  const m = /^(S\d+) \(S\d+\): .* at 45 points, 800 moves.* solved in (\d+) s/m.exec(readFileSync(join(ldir, f), 'utf8'));
  if (m && !(m[1] in cand)) cand[m[1]] = Number(m[2]);
}
const pair = {};
for (const f of n1logs) {
  const text = readFileSync(f, 'utf8');
  const a = /^\S+ (S\d+) HRT3: solved in (\d+) s/m.exec(text), b = /^\S+ (S\d+) HRT3, the table without the dealing cost: solved in (\d+) s/m.exec(text);
  if (a && b) pair[a[1]] = [Number(a[2]), Number(b[2])];
}
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), four = r => `${f2(r / 4.3)} to ${f2(r / 3.7)}`;
console.log('THE CANDIDATE, AS IT STANDS: household | the product, 30 points (s) | the candidate, 45 points (s) | one core | over four cores (E2 at 4.3 to 3.7)');
for (const h of Object.keys(prod).sort()) if (cand[h]) console.log(`  ${h} | ${f1(prod[h])} | ${cand[h]} | ${f2(cand[h] / prod[h])} | ${four(cand[h] / prod[h])}`);
console.log('THE PROTOTYPE (the table without the dealing cost): household | the prototype (s) | its speed-up on one core | its ratio over four cores');
for (const h of Object.keys(prod).sort()) {
  if (pair[h]) console.log(`  ${h} | ${pair[h][1]} (one process with the candidate's ${pair[h][0]}) | ${f2(pair[h][0] / pair[h][1])} times | ${four(pair[h][1] / prod[h])}`);
  else if (proto[h]) console.log(`  ${h} | ${f1(proto[h])} (alone) | ${cand[h] ? `${f2(cand[h] / proto[h])} times, against the purpose test's solve` : 'no clean solve of the candidate to set it against'} | ${four(proto[h] / prod[h])}`);
}
console.log('gate 5: at most 1.25 on each household');
