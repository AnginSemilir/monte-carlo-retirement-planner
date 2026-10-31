/*
 * XAS-R'S OBSERVATIONS, NOT SETTLED (results-xasr.txt: the gate failed on the BASE guard alone). Every other gate is run
 * here as reduce-xasr.mjs runs it - the logs' stamps and lines, every self-check, the per-read files, the identity against
 * XAS's reads (XAS's files through their own gate), S126's openings - and then the reading is printed WITHOUT the guard.
 * Nothing printed here decides anything: grade C, as 7av's observations (the 4 Oct 11:24 row). The guard's figures are
 * printed first, so the reason the items are not read stands beside them.
 *   node research/solver/derive-xasr-observed.mjs > research/solver/results-xasr-observed.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, checkFile, openCheck, guard, reading, xasFiles, stampOf, PRED, UNITS } from './reduce-xasr.mjs';
import { logsOf } from './reduce-xas.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagxasr');
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units), files = {};
const X = bad.length ? null : xasFiles();
if (X && X.bad.length) bad.push(...X.bad.map(x => `XAS's own gate: ${x}`));
if (!bad.length) {
  const st = stampOf(Object.values(logs)[0]);
  for (const u of units) { const f = join(DIR, fileOf(u.id)), t = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(t, u, st, X.files[u.id])); files[u.id] = t; }
  bad.push(...openCheck(units.find(u => u.id === 'S126'), X.s126));
}
if (bad.length) { console.log(`GATE (all but the BASE guard): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`GATE (all but the BASE guard): passed - ${UNITS.length} households, every self-check, the identity against XAS's reads, S126's openings`);
const g = guard(files);
console.log(`THE BASE GUARD: ${g.length ? 'FAILED - the test is NOT SETTLED (its registered rule); what follows is observation, grade C' : 'passed'}`);
for (const x of g) console.log(`  ${x}`);
console.log('\nOBSERVED, NOT SETTLED (the reducer\'s reading, the guard set aside; no item is read from it):');
reading(files, units);
