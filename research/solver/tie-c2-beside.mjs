/*
 * TIE-C2'S SPEED EXCEPTION, BESIDE THE READ (TIE-C2.md; D105; EXPLORATORY, seed 7001, deciding nothing). Each arm's engine
 * time is a wall clock (audit-tie-c2.mjs: Date.now() around the arm's 8,000 paths), four units at a time, the arms in the
 * order CANDS, HOLD, LOOKHOLD, TIE4. Units 0 to 3 ran first, from the batch's start (its log: 15 Nov 19:33 UK); the session
 * committed four times while their first arms ran (git log: 19:58 to 20:23 UK) and twice in their last (21:13 UK). This
 * prints, by unit in the order run, each arm's seconds and its times against CANDS's and HOLD's, each arm's window on units 0
 * to 3 from the batch's start, and the rule's median (LOOKHOLD against CANDS, over the twelve) three ways: as read; over
 * units 4 to 11 alone; and with units 0 to 3's figures taken as high as any load on their CANDS arm could have hidden (each
 * set above every other couple's), the most the median could be were those four timed on a quiet machine. And HOLD's stored
 * outcomes against CANDS's, path by path, byte for byte (so its time against CANDS's is load, not work).
 *   node research/solver/tie-c2-beside.mjs > research/solver/results-tie-c2-beside.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE } from './reduce-tie-c2.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'tie-c2-7001');
const ARMS = ['CANDS', 'HOLD', 'LOOKHOLD', 'TIE4'], START = { h: 19, m: 33 }; // the batch's log: "from 15 Nov 19:33 UK"
const units = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()))
  .sort((a, b) => a.k - b.k);
const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const r = (u, x, b) => u.arms[x].engineSecs / u.arms[b].engineSecs, x3 = v => `x${v.toFixed(3)}`;
const at = s => { const t = START.h * 60 + START.m + s / 60; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`; };
console.log(`TIE-C2'S SPEED EXCEPTION, BESIDE THE READ (EXPLORATORY, seed 7001, deciding nothing): ${units.length} units, the engine's wall clock, four at a time, the bar x${RULE.slower} on the median over the couples of LOOKHOLD's time a path against CANDS's`);
for (const u of units) {
  let s = u.solveSecs; const win = ARMS.map(a => { const w = `${a} ${at(s)} to ${at(s + u.arms[a].engineSecs)}`; s += u.arms[a].engineSecs; return w; });
  console.log(`  unit ${u.k} ${u.id.padEnd(6)} ${ARMS.map(a => `${a} ${u.arms[a].engineSecs.toFixed(0)} s`).join(', ')}; against CANDS: HOLD ${x3(r(u, 'HOLD', 'CANDS'))}, LOOKHOLD ${x3(r(u, 'LOOKHOLD', 'CANDS'))}, TIE4 ${x3(r(u, 'TIE4', 'CANDS'))}; LOOKHOLD against HOLD ${x3(r(u, 'LOOKHOLD', 'HOLD'))}, against TIE4 ${x3(r(u, 'LOOKHOLD', 'TIE4'))}${u.k < 4 ? `; the arms, from the batch's start (UK, to the minute): ${win.join(', ')}` : ''}`);
}
const first = units.filter(u => u.k < 4), rest = units.filter(u => u.k >= 4), L = u => r(u, 'LOOKHOLD', 'CANDS');
const ratio = (us, x, b) => median(us.map(u => r(u, x, b)));
console.log(`HOLD against CANDS (the same moves wherever the hold does not act), the median: units 0 to 3 ${x3(ratio(first, 'HOLD', 'CANDS'))}, units 4 to 11 ${x3(ratio(rest, 'HOLD', 'CANDS'))}; TIE4 against CANDS: units 0 to 3 ${x3(ratio(first, 'TIE4', 'CANDS'))}, units 4 to 11 ${x3(ratio(rest, 'TIE4', 'CANDS'))}`);
// HOLD's stored outcomes against CANDS's, path by path: survival, the failure year, the pot, lifetime tax, spending delivered
{ const KEYS = ['survived', 'failYear', 'pot', 'tax', 'delivered']; let paths = 0, differ = 0;
  for (const u of units) {
    const b = KEYS.map(k => Buffer.from(u.arms.CANDS[k], 'base64')), h = KEYS.map(k => Buffer.from(u.arms.HOLD[k], 'base64'));
    const size = KEYS.map((k, i) => b[i].length / u.N);
    for (let p = 0; p < u.N; p++) { paths++; if (KEYS.some((k, i) => b[i].compare(h[i], p * size[i], (p + 1) * size[i], p * size[i], (p + 1) * size[i]) !== 0)) differ++; }
  }
  console.log(`HOLD's stored outcomes (${KEYS.join(', ')}) against CANDS's, byte for byte: ${differ} of ${paths} paths differ`); }
const asRead = median(units.map(L)), quiet = median(rest.map(L)), most = median([...rest.map(L), ...first.map(() => Infinity)]);
console.log(`The rule's median, LOOKHOLD against CANDS: as read over the twelve ${x3(asRead)}; over units 4 to 11 alone ${x3(quiet)}; with units 0 to 3 set above every other couple ${x3(most)}: ${most > RULE.slower ? 'ABOVE' : 'BELOW'} the bar x${RULE.slower} however much load their CANDS arms carried`);
