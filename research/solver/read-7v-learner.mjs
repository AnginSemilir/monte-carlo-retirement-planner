/*
 * 7V'S LEARNER AGAINST THE SAME ARM WITHOUT IT, ON EVERY CASE (reported, not registered: 7v registered the learner's gain on
 * the two harmed cases alone, item 6). For each case: the learner's run (READER+J/0+L, or OFF+J/0+L where the case has no
 * reader) against the same arm at margin 0 without the learner, path by path - saved (survives only with the learner) and
 * lost. Written for the hundred-and-eleventh review's MINOR 3 and the sixth deep review (27 Sep 18:19 UK): O31 first
 * quoted these cases against the product, which folds in margin 0 and one policy.
 * The same stamp gate and trace checks as reduce-7v.mjs (requireFairLogs, gate, traceAgrees) run before any figure.
 *   node research/solver/read-7v-learner.mjs > research/solver/results-7v-learner.txt
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { PRED, CASES, parse, gate, traceName, traceAgrees, cells, learnArm } from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const pair = (A, B) => { const k = cells(A, B); return `${k.saved}/${k.lost}`; };

// PLANTED (rule 6): the pair counts paths that survive only with the learner as saved, and the reverse as lost
{
  const A = Uint8Array.from([1, 1, 0, 0, 1]), B = Uint8Array.from([1, 0, 1, 1, 1]);
  const got = pair(A, B);
  if (got !== '2/1') { console.log(`PLANTED CHECK FAILED: the learner's pair read ${got}, should read 2/1`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log('planted (1): all read as they should'); process.exit(0); }
}

const DIR = join(HERE, 'results', 'diag7v');
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
requireFairLogs(logs, PRED);
const cases = Object.values(logs).flatMap(parse);
const bad = gate(cases);
const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
const load = (c, l) => {
  const f = join(DIR, traceName(c.id, l));
  if (!existsSync(f)) { bad.push(`no trace ${f}`); return null; }
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (!traceAgrees(j, ST, l, c.runs[l].sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); return null; }
  return decode(j).survived;
};
const rows = [];
for (const id of Object.keys(CASES)) {
  const c = cases.find(x => x.id === id), a = learnArm(id), withL = load(c, `${a}/0+L`), without = load(c, `${a}/0`);
  if (withL && without) rows.push(`  ${id.padEnd(11)} ${`${a}/0+L against ${a}/0`.padEnd(30)} ${pair(without, withL)} (saved/lost)`);
}
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`7V'S LEARNER AGAINST THE SAME ARM WITHOUT IT (reported, not registered; ${PRED}; the stamp gate and trace checks passed)`);
for (const r of rows) console.log(r);
