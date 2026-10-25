/*
 * THE THIRD TIER STEP'S IDENTITY, THE OPTION UNSET (STATE.md D28; THIRD-STEP.md step 2.1; EXPLORATORY). Reads the outputs of
 * speed-timing.mjs (S224 and S370, SHIP and CAND, at 30 points, PATHS=100) on the code before the step (BASE) and with it
 * (NEW), and N4's CAND+HR unit (S002 at W0.02, n4-menu.mjs) re-run on NEW, and prints whether every hash is the same:
 *   tableHash  each world's tables (speed-timing's walk hashes every key name too, meta's included: the step adds the key
 *              `tiersBelow` to meta, so NEW's is also taken with that one key skipped, speed-timing.mjs's tableHashNoBelow;
 *              on BASE, which has no such key, the two are the same, and BASE's runs of this speed-timing.mjs show it)
 *   layerHash  every layer of every world;  runHash  each engine path's outcome;  arefHash  the adaptive reference's arrays
 * The dir holds BASE-<household>-<arm>.json and NEW-<household>-<arm>.json, and n4/S002-CAND+HR-w0.02.json.gz (NEW's unit).
 *   node research/solver/tier-steps-identity.mjs [dir] > research/solver/results-tier-steps-identity.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 't3-identity'), N4 = join(HERE, 'results', 'n4', 'S002-CAND+HR-w0.02.json.gz');
const CASES = [['S224', 'SHIP'], ['S370', 'SHIP'], ['S224', 'CAND'], ['S370', 'CAND']];
const json = f => JSON.parse(readFileSync(f, 'utf8'));
const bad = [], rows = [];
for (const [id, arm] of CASES) {
  const fb = join(DIR, `BASE-${id}-${arm}.json`), fn = join(DIR, `NEW-${id}-${arm}.json`);
  if (!existsSync(fb) || !existsSync(fn)) { bad.push(`${id} ${arm}: missing ${existsSync(fb) ? 'NEW' : 'BASE'}`); continue; }
  const b = json(fb), n = json(fn);
  const bt = b.tableHashNoBelow || b.tableHash;   // BASE has no meta.tiersBelow, so its walk is the same with the key skipped or not
  if (b.tableHashNoBelow && b.tableHashNoBelow !== b.tableHash) bad.push(`${id} ${arm}: BASE's two table hashes differ (${b.tableHash}, ${b.tableHashNoBelow})`);
  if (!n.tableHashNoBelow) bad.push(`${id} ${arm}: NEW's table hash without meta.tiersBelow not taken`);
  rows.push(`${id} ${arm} BASE ${bt} ${b.layerHash} ${b.runHash} ${b.arefHash || '-'}`, `${id} ${arm} NEW  ${n.tableHashNoBelow} ${n.layerHash} ${n.runHash} ${n.arefHash || '-'}  (tableHash with the key: ${n.tableHash})`);
  for (const [k, x, y] of [['tableHash', bt, n.tableHashNoBelow], ['layerHash', b.layerHash, n.layerHash], ['runHash', b.runHash, n.runHash], ['arefHash', b.arefHash, n.arefHash], ['arrays', b.arrays, n.arrays], ['cells', b.cells, n.cells], ['moves', b.moves, n.moves]])
    if (x !== y) bad.push(`${id} ${arm}: ${k} ${x} against ${y}`);
  if (arm === 'CAND' && id === 'S370' && !b.arefHash) bad.push('S370 CAND: no adaptive reference hash (a bridge household builds one; S224 does not)');
}
// N4's CAND+HR unchanged: its survival bits and whole scores on NEW against N4's own unit
const unit = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); return { ...j, s: Buffer.from(j.survived, 'base64'), x: Buffer.from(j.whole, 'base64') }; };
let n4line = 'missing';
const fn4 = join(DIR, 'n4', 'S002-CAND+HR-w0.02.json.gz');
if (existsSync(fn4) && existsSync(N4)) {
  const a = unit(N4), c = unit(fn4), same = a.s.equals(c.s) && a.x.equals(c.x) && a.moves === c.moves && a.candidate === c.candidate;
  n4line = `S002 CAND+HR W0.02: N4's unit (code ${a.code}) ${a.sim.toFixed(4)}% against NEW's (code ${c.code}, tiersBelow ${c.tiersBelow}) ${c.sim.toFixed(4)}%, ${a.moves} and ${c.moves} moves: ${same ? 'every path\'s survival and whole score the same bit for bit' : 'DIFFER'}`;
  if (!same) bad.push('N4\'s CAND+HR unit differs');
} else bad.push('N4\'s CAND+HR unit on NEW missing');
console.log(`THE THIRD TIER STEP'S IDENTITY, THE OPTION UNSET (EXPLORATORY; D28, THIRD-STEP.md step 2.1): speed-timing.mjs at 30 points, PATHS=100, weight 0.02, on the code before the step (BASE) and with it (NEW); ${DIR}`);
console.log('columns: household arm tree tableHash layerHash runHash arefHash (each world\'s tables, meta.tiersBelow skipped; every layer of every world; each engine path\'s outcome; the adaptive reference)');
rows.forEach(r => console.log(r));
console.log(`N4's CAND+HR on NEW: ${n4line}`);
console.log(bad.length ? `VERDICT: NOT THE SAME\n  ${bad.join('\n  ')}` : 'VERDICT: every hash the same on S224 and S370 under SHIP and CAND (tables, layers, S370\'s adaptive reference, the engine\'s paths), and N4\'s CAND+HR unit the same bit for bit');
process.exit(bad.length ? 1 : 0);
