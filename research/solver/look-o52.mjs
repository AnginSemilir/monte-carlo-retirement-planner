/*
 * O52'S LOOK (PLAN.md register O52, its gate: "a look at wealth x2's lost paths (their bridge years and tier) beside the
 * reader's reference (O36) ... to be redone by a committed script before the gate"). A description over 7af's gated
 * traces, not a test: nothing is registered against it and it decides nothing; grade C.
 *   It reads 7af's wealth x2 units through 7af's own gate chain (reduce-7af.mjs gate and loadTraces, 7aa's beside), finds
 *   the paths the bundle (CAND, READER/TS+J) and the reader alone (PRODR, READER/PRODUCT) lose against the shipping
 *   default (SHIP, OFF/PRODUCT), and prints each lost path's tiers year by year (the trace's tier byte, pen * 4 + isa:
 *   0 the plan's 0/0, 5 the pair 1/1, 10 the de-risked pair 2/2), its failure year and its wealth, beside SHIP's on the
 *   same path, with the bridge years marked (wealth x2's bridge is 2 years: reduce-7af.mjs PANEL).
 *   Its own check: the lost and saved counts must be 7af's (results-7af.txt: the reader 0/9, the bundle 0/5 against
 *   SHIP), or it stops.
 *   node research/solver/look-o52.mjs > research/solver/results-o52.txt
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const DIR = join(HERE, 'results', 'diag7af'), DIRA = join(HERE, 'results', 'diag7aa');

const logsA = logsOf(DIRA), unitsA = Object.values(logsA).flatMap(A.parse);
requireFairLogs(logsA, A.PRED);
{ const b = A.gate(unitsA); if (b.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
const refA = (id, arm, l) => unitsA.find(u => u.id === id && u.arm === arm && u.label === l) || null;
const logs = logsOf(DIR), units = Object.values(logs).flatMap(F.parse);
requireFairLogs(logs, F.PRED);
const bad = F.gate(units, refA);
const TR = bad.length ? {} : F.loadTraces(units, DIR, stampOf(logs), bad, DIRA, stampOf(logsA), refA);
if (bad.length) { console.log(`FAIR-TEST GATE (7af): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }

const ID = 'wealth x2', BRIDGE = 2;
const tr = ([arm, label]) => TR[`${ID}|${arm}|${label}`];
const X = tr(F.SHIP), C = tr(F.CAND), R = tr(F.PRODR);
const unit = ([arm, label]) => units.find(u => u.id === ID && u.arm === arm && u.label === label);
const pair = code => `${code >> 2}/${code & 3}`;
const lostSaved = (B) => { const lost = [], saved = []; for (let i = 0; i < X.N; i++) { if (X.survived[i] && !B.survived[i]) lost.push(i); if (!X.survived[i] && B.survived[i]) saved.push(i); } return { lost, saved }; };
const lc = lostSaved(C), lr = lostSaved(R);

// the check: 7af's counts (results-7af.txt, the reader 0/9 and the bundle 0/5 against SHIP)
const want = { C: [0, 5], R: [0, 9] }, got = { C: [lc.saved.length, lc.lost.length], R: [lr.saved.length, lr.lost.length] };
if (got.C.join() !== want.C.join() || got.R.join() !== want.R.join()) { console.log(`COUNTS ARE NOT 7AF'S: bundle ${got.C.join('/')} (want ${want.C.join('/')}), reader ${got.R.join('/')} (want ${want.R.join('/')})`); process.exit(1); }

const k = x => `${Math.round(x / 1000)}k`;
const minPot = u => { try { return Number(A.field(u.ran, 'minPot')); } catch { return NaN; } };
console.log(`O52'S LOOK: wealth x2's lost paths, 7af's gated traces (8,000 paths, seed 7002; the bridge is years 0 to ${BRIDGE - 1}); grade C, a description`);
for (const [name, a] of [['SHIP', F.SHIP], ['PRODR', F.PRODR], ['CAND', F.CAND]]) { const u = unit(a); console.log(`  ${name.padEnd(6)} ${a.join('/')}: simulated survival ${u.run.sim}; minimum pot ${minPot(u)}`); }
console.log(`  counts against SHIP (saved/lost): the reader alone ${got.R.join('/')}, the bundle ${got.C.join('/')} - 7af's`);
console.log(`  a trace's failure year is the year the money runs out; -1 is a path that reaches the plan's end below the minimum pot (solve.js l.1359)`);

const firstAt = (T, i, code) => { for (let t = 0; t < T.Y; t++) if (T.tier[i * T.Y + t] === code) return t; return -1; };
// a path's tiers as runs: "b0/0 x2, 0/0 x19, 2/2 x19" (b: the bridge years). Only RECORDED years: the trace has no record in
// a path's run-out year or after (solve.js returns before tracing it), so those years are left out, never read as 0/0
const recorded = (S, i) => (S.failYear[i] >= 0 ? S.failYear[i] : S.Y);
const runs = (S, i, upTo = recorded(S, i)) => { const out = []; let last = null, n = 0, br = null; const flush = () => { if (last !== null) out.push(`${br ? 'b' : ''}${pair(last)} x${n}`); };
  for (let t = 0; t < upTo; t++) { const c = S.tier[i * S.Y + t], b = t < BRIDGE; if (c === last && b === br) n++; else { flush(); last = c; br = b; n = 1; } } flush(); return out.join(', '); };
// the last RECORDED year's wealth (a trace's wealth at index t is the end of year t)
const fin = (S, i) => S.wealth[i * S.Y + recorded(S, i) - 1];
for (const [name, tag, T, L] of [['THE BUNDLE (CAND)', 'CAND ', C, lc.lost], ['THE READER ALONE (PRODR)', 'PRODR', R, lr.lost]]) {
  console.log(`\n${name}: ${L.length} paths lost where SHIP survives; each path's tiers over the plan as runs, SHIP's beneath`);
  for (const i of L) {
    const f = T.failYear[i];
    const fd = firstAt(T, i, 10);
    console.log(`  path ${i}: ${f < 0 ? 'ends below the minimum pot' : `runs out in year ${f} (no record from then)`}; first de-risked (2/2) in year ${fd}, ${fd - BRIDGE} years after the bridge; wealth at the end of year 0 ${k(T.wealth[i * T.Y])}, at the bridge's end (year ${BRIDGE - 1}) ${k(T.wealth[i * T.Y + BRIDGE - 1])}, in its last recorded year ${k(fin(T, i))} (SHIP in the same year ${k(X.wealth[i * X.Y + recorded(T, i) - 1])})`);
    console.log(`    ${tag} ${runs(T, i)}`);
    console.log(`    SHIP  ${runs(X, i, recorded(T, i))}`);
  }
}
const both = lc.lost.filter(i => lr.lost.includes(i));
const range = (T, L, f) => { const v = L.map(f); return `${k(Math.min(...v))} to ${k(Math.max(...v))}`; };
const after = (T, L) => { const v = L.map(i => firstAt(T, i, 10) - BRIDGE); return `${Math.min(...v)} to ${Math.max(...v)}`; };
// the late move back to 0/0 after holding 2/2: its length in RECORDED years (0 where the path never returns)
const lateBack = (T, i) => { const end = recorded(T, i); let n = 0; for (let t = end - 1; t >= 0 && T.tier[i * T.Y + t] === 0; t--) n++; return firstAt(T, i, 10) >= 0 && firstAt(T, i, 10) < end - n ? n : 0; };
for (const [nm, T, L] of [['the bundle', C, lc.lost], ['the reader alone', R, lr.lost]])
  console.log(`${nm.toUpperCase()}: wealth at the bridge's end ${range(T, L, i => T.wealth[i * T.Y + BRIDGE - 1])}; first de-risked ${after(T, L)} years after the bridge; back at 0/0 in its last recorded years on ${L.filter(i => lateBack(T, i) > 0).length} of ${L.length} (${L.map(i => lateBack(T, i)).join(', ')} years)`);
console.log(`\nOVERLAP: ${both.length} of the bundle's ${lc.lost.length} lost paths are also lost by the reader alone (${both.join(', ')})`);
const kinds = (T, L) => `${L.filter(i => T.failYear[i] < 0).length} end below the minimum pot, ${L.filter(i => T.failYear[i] >= 0).length} run out (years ${L.filter(i => T.failYear[i] >= 0).map(i => T.failYear[i]).join(', ') || 'none'})`;
console.log(`HOW THEY FAIL: the bundle ${kinds(C, lc.lost)}; the reader alone ${kinds(R, lr.lost)}`);
const inBridge = (T, L) => L.filter(i => T.tier[i * T.Y] === 0 && T.tier[i * T.Y + 1] === 0).length;
console.log(`IN THE BRIDGE: the bundle holds the plan's 0/0 through both bridge years on ${inBridge(C, lc.lost)} of its ${lc.lost.length}, the reader alone on ${inBridge(R, lr.lost)} of ${lr.lost.length}; SHIP holds 2/2 there on every one`);
