/*
 * THE BRIDGE QUAD TEST, READ AGAINST ITS PREDICTION (predictions/bridge-quad.md; PLAN.md 7i). Reads the run's log (the
 * parts of `audit-s126.mjs quad` joined: results/bridgequad/log.txt) and scores each item and the falsifier, case by case.
 * Written before the run.
 * THE FAIR-TEST GATE comes first, and nothing is scored if it fails. The log is text, which fair-gate.mjs cannot read, so
 * the gate is here, as read-f1v2.mjs's: each case prints what its two solves ran with, and the two must be identical in
 * everything but the return points (quad 5, then 15), with F1 off in both, at the settings the prediction names.
 * The tie rule: "beyond two se" is strictly more than two se; exactly two se is reported AT THE LINE.
 *   node research/solver/read-bridgequad.mjs [log]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const log = readFileSync(process.argv[2] || join(HERE, 'results', 'bridgequad', 'log.txt'), 'utf8');
const CASES = ['S126', 'bridge 4', 'bridge 6', 'share 0.95', 'S366', 'S360'];
const num = x => Number(x);
const rows = [];
const lines = log.split('\n');
lines.forEach((l, i) => {
  const m = /^(\S+(?: \S+)?)\s+\| Q5 table\s+([\d.]+) sim\s+([\d.]+) gap\s+(-?[\d.]+) \| Q15 table\s+([\d.]+) sim\s+([\d.]+) gap\s+(-?[\d.]+) \| survival ([+-][\d.]+) \+\/- ([\d.]+) \| (\d+) \/ (\d+) s$/.exec(l);
  if (!m) return;
  const r5 = /^\s*ran Q5: (.*)$/.exec(lines[i + 1] || ''), r15 = /^\s*ran Q15: (.*)$/.exec(lines[i + 2] || '');
  rows.push({ id: m[1], q5: { table: num(m[2]), sim: num(m[3]), gap: num(m[4]) }, q15: { table: num(m[5]), sim: num(m[6]), gap: num(m[7]) },
    d: num(m[8]), se: num(m[9]), secs: [num(m[10]), num(m[11])], ran5: r5 ? r5[1].trim() : null, ran15: r15 ? r15[1].trim() : null });
});
const missing = CASES.filter(id => !rows.some(r => r.id === id)), extra = rows.filter(r => !CASES.includes(r.id)).map(r => r.id);
if (missing.length || extra.length || rows.length !== CASES.length) {
  console.error(`read-bridgequad: expected the 6 cases once each; missing ${missing.join(', ') || 'none'}, unexpected ${extra.join(', ') || 'none'}, rows ${rows.length}`);
  process.exit(1);
}

// THE FAIR-TEST GATE
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const bad = [];
for (const r of rows) {
  if (!r.ran5 || !r.ran15) { bad.push(`${r.id}: no "ran" lines`); continue; }
  const strip = s => s.replace(/ quad \d+ /, ' ');
  if (strip(r.ran5) !== strip(r.ran15)) bad.push(`${r.id}: the arms differ beyond the return points (Q5 "${r.ran5}" / Q15 "${r.ran15}")`);
  if (field(r.ran5, 'quad') !== '5' || field(r.ran15, 'quad') !== '15') bad.push(`${r.id}: the return points are not 5 against 15`);
  if (field(r.ran5, 'bridgeRead') !== 'false' || field(r.ran15, 'bridgeRead') !== 'false') bad.push(`${r.id}: F1 is not off in both arms`);
  const want = { mix: '3', pts: '16', grid: 'total16x6x6', lambda: '0.0223606797749979', raiseSurv: 'true', failShort: 'floor', tiersAbove: '1' };
  for (const [k, v] of Object.entries(want)) if (field(r.ran5, k) !== v) bad.push(`${r.id}: ${k} is ${field(r.ran5, k)}, the prediction names ${v}`);
}
console.log('BRIDGE QUAD TEST, READ AGAINST predictions/bridge-quad.md');
if (bad.length) { console.log(`\nFAIR-TEST GATE: FAILED - nothing is scored\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('\nFAIR-TEST GATE: passed - on all 6 cases the two arms ran the same settings but the return points (5, 15), F1 off in both, at the named settings\n');
const f = (x, d = 1) => x.toFixed(d), sg = x => (x >= 0 ? '+' : '') + x.toFixed(2);
const beyondLow = r => r.d < -2 * r.se, atLine = r => Math.abs(r.d + 2 * r.se) < 1e-9 || Math.abs(r.d - 2 * r.se) < 1e-9;
console.log('case          gap 5 points -> 15 points     table 5 -> 15      sim 5 -> 15      survival 15 - 5 (paired se)   solve s 5 / 15');
for (const r of rows) console.log(`${r.id.padEnd(13)} ${f(r.q5.gap).padStart(7)} -> ${f(r.q15.gap).padStart(7)}          ${f(r.q5.table).padStart(5)} -> ${f(r.q15.table).padStart(5)}    ${f(r.q5.sim).padStart(5)} -> ${f(r.q15.sim).padStart(5)}    ${sg(r.d)} +/- ${r.se.toFixed(2)}${atLine(r) ? ' AT THE LINE' : ''}            ${r.secs[0]} / ${r.secs[1]}`);

// the 5-point arm against 7c's OFF arm (the same settings; newer code whose solver change is comments only): a check
let rep = [];
try {
  const old = readFileSync(join(HERE, 'results-f1v2.txt'), 'utf8').split('\n');
  for (const r of rows) {
    const l = old.find(x => new RegExp(`^${r.id.replace('.', '\\.')}\\s+a0 .*\\| OFF table`).test(x));
    const m = l && /OFF table\s+([\d.]+) sim\s+([\d.]+)/.exec(l);
    rep.push(m ? `${r.id}: 7c ${m[1]} / ${m[2]}, now ${f(r.q5.table)} / ${f(r.q5.sim)} ${Math.abs(num(m[1]) - r.q5.table) <= 0.1 && Math.abs(num(m[2]) - r.q5.sim) <= 0.1 ? 'reproduced' : 'DIFFERS'}` : `${r.id}: not in results-f1v2.txt`);
  }
} catch { rep = ['results-f1v2.txt not found']; }
console.log(`\nCHECK - the 5-point arm reproduces 7c's OFF arm (table / sim, to 0.1):\n  ${rep.join('\n  ')}`);

console.log('\nPREDICTION CHECK');
const big = rows.filter(r => Math.abs(r.q5.gap) > 40), stay = big.filter(r => Math.abs(r.q15.gap) > 30);
console.log(`  1. every case misreading by more than 40 at 5 points still misreads by more than 30 at 15: ${stay.length} of ${big.length} (${big.map(r => `${r.id} ${f(r.q15.gap)}`).join(', ')}) -> ${stay.length === big.length ? 'HELD' : 'MISSED'}`);
const losers = rows.filter(beyondLow), tied = rows.filter(r => Math.abs(r.d + 2 * r.se) < 1e-9 && r.d < 0);
console.log(`  2. 15 points loses survival beyond two se on no case: ${losers.length ? 'MISSED - ' + losers.map(r => `${r.id} ${sg(r.d)} +/- ${r.se.toFixed(2)}`).join('; ') : 'HELD'}${tied.length ? ` (at the line: ${tied.map(r => r.id).join(', ')})` : ''}`);
const closed = rows.filter(r => Math.abs(r.q15.gap) <= 10 && Math.abs(r.q5.gap) > 10);
console.log(`\nFALSIFIER - 15 points closes the gap to within 10 on at least half the cases (3 of 6): ${closed.length} (${closed.map(r => r.id).join(', ') || 'none'}) -> ${closed.length >= 3 ? 'FALSIFIED (the misread is mostly averaging)' : 'not fired'}`);
