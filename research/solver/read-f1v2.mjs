/*
 * THE F1 V2 TEST, READ AGAINST ITS PREDICTION (predictions/f1v2-test.md; PLAN.md 7c). Reads the run's log (the four
 * parts of `audit-s126.mjs f1v2` joined: results/f1v2/log.txt, kept verbatim in results-f1v2.txt) and scores each item
 * of the prediction and its falsifier, case by case. Written before the run.
 *
 * THE FAIR-TEST GATE comes first, and nothing is scored if it fails. The log is text, which fair-gate.mjs cannot read, so
 * the gate is here: each case prints what its two solves actually ran with (the "ran" lines), and the two must be
 * identical in everything but the bridge read (off, then 2), and must be the settings the prediction's table names - the
 * three-world mixture, 16 points, lambda held at S126's landed value, the menu capped at 1.1, the M17 floor fix on, a
 * minimum pot set. Both arms run in one process on the same 1,000 paths, so the rest is the same by construction.
 *
 * The class is taken from `audit-s126.mjs scan`, at the floor need, as read-f1.mjs does.
 *
 *   node research/solver/read-f1v2.mjs [log]     prints the reading (kept in results-f1v2-verdict.txt)
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const log = readFileSync(process.argv[2] || join(HERE, 'results-f1v2.txt'), 'utf8');   // a path given is the run's own log, or a planted one
const CASES = ['S126', 'share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 4', 'bridge 6',
  'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370', 'bridge 4+cost'];
const num = x => Number(x);
const rows = [];
const lines = log.split('\n');
lines.forEach((l, i) => {
  const m = /^(\S+(?: \S+)?)\s+a0 ([\d.]+) B (\d+) class (\S+)\s+\| OFF table\s+([\d.]+) sim\s+([\d.]+) gap\s+(-?[\d.]+) tier-below\s+([\d.]+) below\s+([\d.]+) \| V2 table\s+([\d.]+) sim\s+([\d.]+) gap\s+(-?[\d.]+) tier-below\s+([\d.]+) below\s+([\d.]+) \| survival ([+-][\d.]+) \+\/- ([\d.]+)/.exec(l.trim());
  if (!m) return;
  const ranOff = /^\s*ran OFF: (.*)$/.exec(lines[i + 1] || ''), ranV2 = /^\s*ran V2: (.*)$/.exec(lines[i + 2] || '');
  rows.push({ id: m[1], a0: num(m[2]), B: num(m[3]), off: { table: num(m[5]), sim: num(m[6]), gap: num(m[7]), tier: num(m[8]) },
    on: { table: num(m[10]), sim: num(m[11]), gap: num(m[12]), tier: num(m[13]) }, d: num(m[15]), se: num(m[16]),
    ranOff: ranOff ? ranOff[1].trim() : null, ranV2: ranV2 ? ranV2[1].trim() : null });
});
const missing = CASES.filter(id => !rows.some(r => r.id === id)), extra = rows.filter(r => !CASES.includes(r.id)).map(r => r.id);
if (missing.length || extra.length || rows.length !== CASES.length) {
  console.error(`read-f1v2: expected the 21 cases once each; missing ${missing.join(', ') || 'none'}, unexpected ${extra.join(', ') || 'none'}, rows ${rows.length}`);
  process.exit(1);
}

// THE FAIR-TEST GATE
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const bad = [];
for (const r of rows) {
  if (!r.ranOff || !r.ranV2) { bad.push(`${r.id}: no "ran" lines`); continue; }
  const strip = s => s.replace(/ bridgeRead \S+$/, '');
  if (strip(r.ranOff) !== strip(r.ranV2)) bad.push(`${r.id}: the arms differ beyond the bridge read (OFF "${r.ranOff}" / V2 "${r.ranV2}")`);
  if (field(r.ranOff, 'bridgeRead') !== 'false' || field(r.ranV2, 'bridgeRead') !== '2') bad.push(`${r.id}: the bridge read is not off against 2`);
  const want = { mix: '3', pts: '16', grid: 'total16x6x6', lambda: '0.0223606797749979', raiseSurv: 'true', failShort: 'floor', tiersAbove: '1' };
  for (const [k, v] of Object.entries(want)) if (field(r.ranOff, k) !== v) bad.push(`${r.id}: ${k} is ${field(r.ranOff, k)}, not ${v}`);
  const levels = (field(r.ranOff, 'levels') || '').split(',').map(Number);
  if (!(Math.max(...levels) === 1.1 && Math.min(...levels) === 0.8)) bad.push(`${r.id}: the menu is ${field(r.ranOff, 'levels')}, not capped at 1.1 down to the floor 0.8`);
  if (!(Number(field(r.ranOff, 'minPot')) > 0)) bad.push(`${r.id}: no minimum pot`);
}
console.log('F1 V2 TEST, READ AGAINST predictions/f1v2-test.md (the class at the floor need from `audit-s126.mjs scan`)\n');
if (bad.length) {
  console.log('FAIR-TEST GATE: FAILED - nothing below is settled');
  for (const b of bad) console.log(`  ${b}`);
  process.exit(1);
}
console.log('FAIR-TEST GATE: passed - on all 21 cases the two arms ran the same settings but the bridge read (off, 2), and those settings are the step-6 defaults in the mixture\n');

// the class at the floor need, from the inputs (no solve)
const scan = execFileSync('node', [join(HERE, 'audit-s126.mjs'), 'scan'], { cwd: join(HERE, '../..') }).toString();
const inClass = new Set();
for (const l of scan.split('\n')) { const m = /^(\S+(?: [\d.x]+)?)\s+.*class YES/.exec(l.trim()); if (m) inClass.add(m[1].trim()); }
for (const r of rows) r.cls = inClass.has(r.id);
const EDGE = new Set(['share 0.95', 'bridge 6']), THIN = new Set(['S128', 'S130']);
const f = x => (x >= 0 ? '+' : '') + x.toFixed(1);
const by = id => rows.find(r => r.id === id);

console.log('case         class  gap off -> v2    tier-below off -> v2   survival (paired se)');
for (const r of rows) console.log(`${r.id.padEnd(12)} ${(r.cls ? 'YES' : 'no').padEnd(5)}  ${f(r.off.gap).padStart(6)} -> ${f(r.on.gap).padStart(6)}   ${r.off.tier.toFixed(1).padStart(5)} -> ${r.on.tier.toFixed(1).padStart(5)}        ${f(r.d)} +/- ${r.se.toFixed(2)}`);

const verdict = (ok, text) => console.log(`  ${ok ? 'HELD  ' : 'MISSED'} ${text}`);
console.log('\nItem 1 - in class away from the edge: v2 within +/-5 of simulation (the thin S128 and S130 within +/-8)');
const away = rows.filter(r => r.cls && !EDGE.has(r.id));
for (const r of away) { const lim = THIN.has(r.id) ? 8 : 5; verdict(Math.abs(r.on.gap) <= lim, `${r.id}: gap ${f(r.on.gap)} (limit +/-${lim})`); }
// the caps below are the solver's own (f1v2-caps.mjs, results-f1v2-caps.txt), re-derived before any run (the sixteenth review)
const CAP = { S370: 84.8, cost: 91.6 };
console.log('\nItem 2 - what v2 changes: share 0.95 within +/-10; bridge 6 and S366 within +/-5; S370 reads at most its cap 84.8 (+2)');
for (const [id, lim] of [['share 0.95', 10], ['bridge 6', 5], ['S366', 5]]) { const r = by(id); verdict(Math.abs(r.on.gap) <= lim, `${id}: gap ${f(r.off.gap)} -> ${f(r.on.gap)} (limit +/-${lim})`); }
{ const r = by('S370'); verdict(r.on.table <= CAP.S370 + 2, `S370: read ${r.on.table} (cap ${CAP.S370}); its gap ${f(r.on.gap)} is reported, not predicted`); }
console.log('\nItem 3 - S360, short even with its inflows: v2 acts, and reads within +/-10 of simulation (cap 47.2)');
{ const r = by('S360'); verdict(Math.abs(r.on.gap) <= 10, `S360: gap ${f(r.off.gap)} -> ${f(r.on.gap)}`); }
console.log('\nItem 4 - no survival cost beyond two paired se, on any case');
const losses = rows.filter(r => r.d < 0);
for (const r of losses) verdict(-r.d <= 2 * r.se, `${r.id}: ${f(r.d)} +/- ${r.se.toFixed(2)} (${(-r.d / (r.se || Infinity)).toFixed(1)} se)`);
if (!losses.length) console.log('  HELD   no case lost survival');
console.log('\nItem 5 - out of class: bridge 0 identical; share 0.50 and 0.70 within 0.5 of off, table and simulation');
{ const r = by('bridge 0'); verdict(r.on.table === r.off.table && r.on.sim === r.off.sim && r.on.tier === r.off.tier, `bridge 0: table ${r.off.table} -> ${r.on.table}, sim ${r.off.sim} -> ${r.on.sim}`); }
for (const id of ['share 0.50', 'share 0.70']) { const r = by(id); verdict(Math.abs(r.on.table - r.off.table) <= 0.5 && Math.abs(r.on.sim - r.off.sim) <= 0.5, `${id}: table ${r.off.table} -> ${r.on.table}, sim ${r.off.sim} -> ${r.on.sim}`); }
console.log('\nItem 6 - S126 and S120: years below tier fall by at least half, where they start at 20 or more');
for (const id of ['S126', 'S120']) { const r = by(id); if (r.off.tier < 20) console.log(`  n/a    ${id}: started at ${r.off.tier.toFixed(1)}, below 20 (not scored, as written)`); else verdict(r.on.tier <= r.off.tier / 2, `${id}: ${r.off.tier.toFixed(1)} -> ${r.on.tier.toFixed(1)}`); }
console.log('\nItem 7 - the cost case: v2 reads at its cap, 91.6 +/- 3 (the cost counted); its gap is reported');
{ const r = by('bridge 4+cost'); verdict(Math.abs(r.on.table - CAP.cost) <= 3, `bridge 4+cost: read ${r.on.table} (cap ${CAP.cost}), gap ${f(r.on.gap)}`); }

console.log('\nFalsifier - an in-class case away from the edge misreads by more than 10; or bridge 6 or S366 by more than 15; or the cost case reads above 97 (the cost not counted); or any case loses survival beyond two paired se');
const misread = away.filter(r => Math.abs(r.on.gap) > 10);
const inflow = ['bridge 6', 'S366'].filter(id => Math.abs(by(id).on.gap) > 15);
const costNotCounted = by('bridge 4+cost').on.table > 97;
const loss = rows.filter(r => r.d < 0 && -r.d > 2 * r.se);
console.log(`  in class away from the edge, |gap| > 10: ${misread.map(r => r.id).join(', ') || 'none'} (largest |gap| ${Math.max(...away.map(r => Math.abs(r.on.gap))).toFixed(1)})`);
console.log(`  the inflow cases beyond +/-15: ${inflow.join(', ') || 'none'}`);
console.log(`  the cost case above 97 (the cost not counted): ${costNotCounted ? 'yes' : 'no'} (read ${by('bridge 4+cost').on.table})`);
console.log(`  survival lost beyond two paired se: ${loss.map(r => r.id).join(', ') || 'none'}`);
console.log(`  => ${misread.length || inflow.length || costNotCounted || loss.length ? 'FALSIFIED' : 'NOT FALSIFIED'}`);
