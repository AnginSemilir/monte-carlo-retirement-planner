/*
 * THE F1 TEST, READ AGAINST ITS PREDICTION (predictions/f1-test.md). Reads results-f1.txt (the run's log, copied
 * verbatim) and scores each item of the prediction and its falsifier, case by case.
 *
 * The class column is taken again from `audit-s126.mjs scan`, at the FLOOR need: the log's own column used the target
 * need (O8, fixed 24 Sep 12:12 UK), which put "share 0.95" and "bridge 6" out of the class.
 *
 * Why this is not a fair-gate reducer: the F1 test ran before result files carried their code and prediction (24 Sep
 * 08:05 UK, before the launcher), and its output is a text log, which fair-gate.mjs cannot read. Its fairness rests on
 * construction - both arms in one process, on the same 1,000 paths, paired - and on the prediction's fair-test table,
 * written before the run; its code is established by hand (commit 6dd1181), so its result is PROVISIONAL until the
 * retro audit (8e), like every result made before the stamps.
 *
 *   node research/solver/read-f1.mjs          prints the reading (kept in results-f1-verdict.txt)
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const log = readFileSync(process.argv[2] || join(HERE, 'results-f1.txt'), 'utf8');   // a path given is for a planted check
const num = x => Number(x);
const rows = [];
for (const l of log.split('\n')) {
  const m = /^(\S+(?: \S+)?)\s+a0 ([\d.]+) B (\d+) class (\S+)\s+\| OFF table\s+([\d.]+) sim\s+([\d.]+) gap\s+(-?[\d.]+) tier-below\s+([\d.]+) below\s+([\d.]+) \| F1 table\s+([\d.]+) sim\s+([\d.]+) gap\s+(-?[\d.]+) tier-below\s+([\d.]+) below\s+([\d.]+) \| survival ([+-][\d.]+) \+\/- ([\d.]+)/.exec(l.trim());
  if (!m) continue;
  rows.push({ id: m[1], a0: num(m[2]), B: num(m[3]), logClass: m[4] === 'YES', off: { table: num(m[5]), sim: num(m[6]), gap: num(m[7]), tier: num(m[8]) },
    on: { table: num(m[10]), sim: num(m[11]), gap: num(m[12]), tier: num(m[13]) }, d: num(m[15]), se: num(m[16]) });
}
if (rows.length !== 19) { console.error(`read-f1: expected 19 cases in results-f1.txt, found ${rows.length}`); process.exit(1); }

// the class at the floor need, from the inputs (no solve)
const scan = execFileSync('node', [join(HERE, 'audit-s126.mjs'), 'scan'], { cwd: join(HERE, '../..') }).toString();
const inClass = new Set();
for (const l of scan.split('\n')) { const m = /^(\S+(?: [\d.x]+)?)\s+.*class YES/.exec(l.trim()); if (m) inClass.add(m[1].trim()); }
for (const r of rows) r.cls = inClass.has(r.id);
const EDGE = new Set(['share 0.95', 'bridge 6']);
const f = x => (x >= 0 ? '+' : '') + x.toFixed(1);

console.log('F1 TEST, READ AGAINST predictions/f1-test.md (results-f1.txt; the class at the floor need from `audit-s126.mjs scan`)\n');
console.log('case         class(log) class(floor)  gap off -> on   tier-below off -> on   survival (paired se)');
for (const r of rows) console.log(`${r.id.padEnd(12)} ${(r.logClass ? 'YES' : 'no').padEnd(10)} ${(r.cls ? 'YES' : 'no').padEnd(12)}  ${f(r.off.gap).padStart(6)} -> ${f(r.on.gap).padStart(6)}   ${r.off.tier.toFixed(1).padStart(5)} -> ${r.on.tier.toFixed(1).padStart(5)}        ${f(r.d)} +/- ${r.se.toFixed(2)}`);

const verdict = (ok, text) => console.log(`  ${ok ? 'HELD  ' : 'MISSED'} ${text}`);
console.log('\nItem 1 - the class: table within +/-5 of simulation in class, within +/-15 on the edge (share 0.95, bridge 6)');
for (const r of rows.filter(r => r.cls)) { const lim = EDGE.has(r.id) ? 15 : 5; verdict(Math.abs(r.on.gap) <= lim, `${r.id}: gap ${f(r.on.gap)} (limit +/-${lim})`); }
console.log('\nItem 2 - no survival cost beyond two paired se, on any case');
for (const r of rows.filter(r => r.d < 0)) verdict(-r.d <= 2 * r.se, `${r.id}: ${f(r.d)} +/- ${r.se.toFixed(2)} (${(-r.d / (r.se || Infinity)).toFixed(1)} se)`);
console.log('\nItem 3 - on S126 and the library class, years below tier fall by at least half (from ~40)');
for (const r of rows.filter(r => r.cls && r.off.tier >= 20)) verdict(r.on.tier <= r.off.tier / 2, `${r.id}: ${r.off.tier.toFixed(1)} -> ${r.on.tier.toFixed(1)}`);
console.log('\nItem 4 - out of class');
const by = id => rows.find(r => r.id === id);
verdict(by('bridge 0').on.table === by('bridge 0').off.table && by('bridge 0').on.sim === by('bridge 0').off.sim, 'bridge 0 unchanged');
for (const id of ['share 0.50', 'share 0.70']) { const r = by(id); verdict(Math.abs(r.on.table - r.off.table) <= 0.5 && Math.abs(r.on.sim - r.off.sim) <= 0.5, `${id}: table ${r.off.table} -> ${r.on.table}, sim ${r.off.sim} -> ${r.on.sim} (within 0.5)`); }
{ const r = by('share 0.78'); verdict(r.on.tier <= r.off.tier / 2, `share 0.78: years below tier ${r.off.tier} -> ${r.on.tier}`); }
console.log('\nItem 5 - the long-bridge controls: F1 never acts at the start; read low and simulate low, as without it');
for (const id of ['S360', 'S366']) { const r = by(id); const same = r.on.table === r.off.table && r.on.sim === r.off.sim && r.on.tier === r.off.tier; verdict(same && r.off.sim < 90, `${id}: table ${r.off.table} -> ${r.on.table}, sim ${r.off.sim} -> ${r.on.sim}, tier-below ${r.off.tier} -> ${r.on.tier}`); }

console.log('\nFalsifier - an in-class case AWAY from the edge misreads by more than 10, or any case loses survival beyond two paired se');
const misread = rows.filter(r => r.cls && !EDGE.has(r.id) && Math.abs(r.on.gap) > 10);
const loss = rows.filter(r => r.d < 0 && -r.d > 2 * r.se);
console.log(`  in class away from the edge, |gap| > 10: ${misread.map(r => r.id).join(', ') || 'none'} (largest |gap| ${Math.max(...rows.filter(r => r.cls && !EDGE.has(r.id)).map(r => Math.abs(r.on.gap))).toFixed(1)})`);
console.log(`  survival lost beyond two paired se: ${loss.map(r => r.id).join(', ') || 'none'}`);
console.log(`  => ${misread.length || loss.length ? 'FALSIFIED' : 'NOT FALSIFIED'}`);
