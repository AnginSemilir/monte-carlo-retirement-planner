/*
 * 7T'S CURE TESTS READ UNCONDITIONALLY, BESIDE THE REGISTERED RULE (the eighty-fourth review, 26 Sep, BLOCKING 2). The
 * registered exact interval (stats.mjs survivalChange) conditions on the discordant count, so when every discordant path
 * moves one way its end on that side is the point estimate: a true loss at the margin reads "no material harm" about half
 * the time, and a true gain at the margin "no material gain". 7t's rule cannot change after its launch, so 7t is read as
 * registered (reduce-7t.mjs); this script is reported, not a test. For each cause and harmed case it prints the registered
 * interval and the unconditional one (stats.mjs survivalChangeU, Newcombe 1998 method 10) for:
 *   g, the reader with the cause removed against the reader as solved: "no material gain" when the upper end is below +0.25;
 *   h, the reader with the cause removed against off with the same change: "no material harm" when the lower end is above -0.25;
 *   and item 13's pair (READER+J/M0 against OFF+J/M0), read as h; and items 10 and 14's no-harm legs on S360 and share
 *   0.95 (READER+J and READER+L against READER: "loses nothing material"; the eighty-fifth review, MINOR 4);
 * and flags every leg where the two readings disagree: each goes to the maintainer beside 7t's attribution.
 * The unconditional interval is widened, where it applies, to the exact bound from the one-sided count (read-o27-unconditional.mjs
 * guarded(), O27): it is itself too kind where few paths differ well below 100% survival (S360 and share 0.95 among them);
 * a read the bound changes is marked COUNT CHECK.
 * Gated as read-7r-lost-paths.mjs is: requireFairLogs over the logs' stamps, then every trace's count, seed, arm and stamp.
 *   node research/solver/read-7t-unconditional.mjs > research/solver/results-7t-unconditional.txt
 *   node research/solver/read-7t-unconditional.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { survivalChange, survivalChangeU } from './stats.mjs';
import { guarded } from './read-o27-unconditional.mjs';
import { CAUSES, HARMED, GAINED, MARGIN, PRED, decode, traceName, traceAgrees } from './reduce-7t.mjs';

// the paired cells of arm B (changed) against arm A (reference): a both survive, b lost (A survives, B fails), c saved, d both fail
export function cells(A, B) {
  let a = 0, b = 0, c = 0, d = 0;
  for (let i = 0; i < A.length; i++) { if (A[i] && B[i]) a++; else if (A[i]) b++; else if (B[i]) c++; else d++; }
  return { a, b, c, d, N: A.length };
}
// one leg read both ways: 'h' asks "no material harm" (lower end above -MARGIN), 'g' asks "no material gain" (upper end below +MARGIN)
export function leg(kind, A, B) {
  const k = cells(A, B), reg = survivalChange(k.b, k.c, k.N), un = guarded(survivalChangeU(k.a, k.b, k.c, k.d), k.b, k.c, k.N, 0.05);
  const read = iv => (kind === 'h' ? iv.lo > -MARGIN : iv.hi < MARGIN);
  return { ...k, reg, un, regRead: read(reg), unRead: read(un), counted: read(un) !== read(un.m10), disagree: read(reg) !== read(un) };
}
const fmt = (kind, x) => `${x.b} lost, ${x.c} saved: registered ${x.reg.d.toFixed(3)} (${x.reg.lo.toFixed(3)} to ${x.reg.hi.toFixed(3)}), unconditional (${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.counted ? '; COUNT CHECK' : ''}); ${kind === 'h' ? 'no material harm' : 'no material gain'}: registered ${x.regRead ? 'yes' : 'no'}, unconditional ${x.unRead ? 'yes' : 'no'}${x.disagree ? '  <-- DISAGREE' : ''}`;

// PLANTED, before any real file (rule 6)
function planted() {
  const arr = (n, f) => Uint8Array.from({ length: n }, (_, i) => f(i));
  const cases = [];
  // 7 of 3,000 lost, none saved: the registered interval reads no material harm, the unconditional one does not
  const A = arr(3000, i => (i < 2993 ? 1 : 0)), B7 = arr(3000, i => (i < 2986 ? 1 : 0)), B30 = arr(3000, i => (i < 2963 ? 1 : 0));
  const h7 = leg('h', A, B7), h30 = leg('h', A, B30);
  cases.push(['7 lost, none saved: the two readings of "no material harm" disagree', `${h7.b} ${h7.c} ${h7.regRead} ${h7.unRead} ${h7.disagree}`, '7 0 true false true']);
  cases.push(['30 lost, none saved: both read harm-side, no disagreement', `${h30.regRead} ${h30.unRead} ${h30.disagree}`, 'false false false']);
  // 7 of 3,000 saved, none lost: the registered interval reads no material gain, the unconditional one does not
  const Bs = arr(3000, i => (i < 3000 ? 1 : 0)), g7 = leg('g', A, Bs);
  cases.push(['7 saved, none lost: the two readings of "no material gain" disagree', `${g7.c} ${g7.b} ${g7.regRead} ${g7.unRead} ${g7.disagree}`, '7 0 true false true']);
  // the count check: 0 of 1,000 differing at 68.8% survival reads no material harm by the unconditional interval alone
  // (-0.14 at 0.05), not with the exact bound from the lost count (0 of 1,000 at 0.05: -0.37), against a planted margin of 0.35
  const A688 = arr(1000, i => (i < 688 ? 1 : 0)), c0 = leg('h', A688, A688);
  cases.push(['the count check widens a no-harm read where no path differs at 68.8%', `${c0.un.m10.lo > -0.35} ${c0.un.lo > -0.35} ${c0.un.lo.toFixed(2)}`, 'true false -0.37']);
  // the cells add up and follow the arms' order (B against A)
  const k = cells(arr(4, i => [1, 1, 0, 0][i]), arr(4, i => [1, 0, 1, 0][i]));
  cases.push(['the cells: both, lost, saved, neither', `${k.a} ${k.b} ${k.c} ${k.d}`, '1 1 1 1']);
  let bad = 0;
  for (const [name, got, want] of cases) { const okk = got === want; if (!okk) bad++; console.log(`${okk ? 'ok  ' : 'FAIL'} ${name}: ${got}${okk ? '' : ` (want ${want})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED: ${bad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7t');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== 5) { console.log(`INCOMPLETE - ${files.length} of 5 logs in ${DIR}`); process.exit(1); }
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  requireFairLogs(logs, PRED);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const load = (id, label) => {
    const f = join(DIR, traceName(id, label));
    if (!existsSync(f)) { console.log(`FAIR-TEST GATE: FAILED\n  no trace ${f}`); process.exit(1); }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, label)) { console.log(`FAIR-TEST GATE: FAILED\n  ${f}: count, seed, arm or stamp is not the logs'`); process.exit(1); }
    return decode(j).survived;
  };
  console.log(`7T'S CURE TESTS, THE REGISTERED INTERVAL BESIDE THE UNCONDITIONAL ONE (reported, not a test: 7t is read as registered; the logs' stamp gate and every trace's stamp checked)\n`);
  let disagreements = 0;
  for (const id of HARMED) {
    console.log(id);
    for (const cz of CAUSES) {
      const g = leg('g', load(id, cz.g[1]), load(id, cz.g[0])), h = leg('h', load(id, cz.h[1]), load(id, cz.h[0]));
      disagreements += g.disagree + h.disagree;
      console.log(`  ${cz.key.padEnd(3)} g ${cz.g[0]} against ${cz.g[1]}: ${fmt('g', g)}`);
      console.log(`  ${''.padEnd(3)} h ${cz.h[0]} against ${cz.h[1]}: ${fmt('h', h)}`);
    }
    const i13 = leg('h', load(id, 'OFF+J/M0'), load(id, 'READER+J/M0'));
    disagreements += i13.disagree;
    console.log(`  item 13: READER+J/M0 against OFF+J/M0: ${fmt('h', i13)}`);
  }
  for (const id of GAINED) {
    console.log(id);
    for (const [item, arm] of [[10, 'READER+J'], [14, 'READER+L']]) {
      const x = leg('h', load(id, 'READER'), load(id, arm));
      disagreements += x.disagree;
      console.log(`  item ${item}: ${arm} against READER: ${fmt('h', x)}`);
    }
  }
  console.log(`\n${disagreements} leg(s) where the two readings disagree${disagreements ? ': each goes to the maintainer beside 7t\'s attribution' : ''}`);
}
