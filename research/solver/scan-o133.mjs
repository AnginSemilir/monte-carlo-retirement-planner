/*
 * O133's counts (the plan-auditor's MINOR 1 on e000bc7583 and MINOR 7 of 10 Oct: the counts came from an awk that was not
 * kept): over results-7u.txt's per-unit lines at 0.02, the broad households whose simulated survival is below 95, and on how
 * many of them each arm's year-0 table reads above its simulation. Reads results-7u.txt only, held to its committed text by
 * reduce-7u.mjs's own gate when it was written; a measurement, deciding nothing.
 *   node research/solver/scan-o133.mjs > research/solver/results-o133-scan.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const text = readFileSync(join(HERE, 'results-7u.txt'), 'utf8');
const sec = text.split('EVERY UNIT AT 0.02')[1].split('THE ITEMS AT 0.02')[0];
const rows = [...sec.matchAll(/^  (\S.*?)\s+(CAND|SHIP)\s+table (\S+) sim (\S+) error (\S+) .*\(broad\)$/gm)].map(m => ({ id: m[1], arm: m[2], table: +m[3], sim: +m[4], error: +m[5] }));
// planted: the parser on a line of known answer
{ const t = '  S999             SHIP      table 80.0000 sim 70.00 error 10.00 gap 0 (opening 0,0) x  (broad)'; const m = /^  (\S.*?)\s+(CAND|SHIP)\s+table (\S+) sim (\S+) error (\S+) .*\(broad\)$/m.exec(t); if (!m || m[1] !== 'S999' || +m[5] !== 10) { console.log('PLANTED CHECK FAILED'); process.exit(1); } console.log('planted (1): the per-unit line parses'); }
if (rows.length !== 60) { console.log(`GATE FAILED: ${rows.length} broad unit lines at 0.02, not 60`); process.exit(1); }
for (const arm of ['SHIP', 'CAND']) {
  const below = rows.filter(r => r.arm === arm && r.sim < 95), above = below.filter(r => r.error > 0), not = below.filter(r => !(r.error > 0));
  const mn = above.reduce((a, r) => (r.error < a.error ? r : a), above[0]), mx = above.reduce((a, r) => (r.error > a.error ? r : a), above[0]);
  console.log(`${arm}: broad households below 95 ${below.length}; table above the simulation on ${above.length} (from ${mn.error} on ${mn.id} to ${mx.error} on ${mx.id}); not above: ${not.map(r => `${r.id} ${r.error}`).join(', ')}`);
}
