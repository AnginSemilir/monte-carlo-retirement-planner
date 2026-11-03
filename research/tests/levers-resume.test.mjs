/*
 * L4'S RESUME RULE (research/solver/batch-levers.sh; the full tier). A unit of L4 is a household and a variant, and runs
 * several arms: a B3a unit four (CANDD, A3, A6, A10), a B3b unit three (audit-levers.mjs GROUPS). After a restart,
 * RESUME=1 keeps a unit only when its log is stamped with this code and these files and holds a done line for every one of
 * its arms. Before 2 Nov the rule kept a log with any three done lines, so a B3a unit stopped after its third arm was kept
 * with its last arm missing (the reviewer at L4's read, reviews/2026-11-02-read-L4.md, MINOR 2; the reducer's gate refuses
 * the missing arm, so no figure could be wrong, but the resume would stop there). On a scratch folder (LEVERS_OUT), with
 * the batch's dry run (TODO_ONLY=1):
 *   1. an empty folder: every unit to run;
 *   2. with RESUME=1: a whole B3a unit and a whole B3b unit kept; a B3a unit without its last arm, a B3b unit without its
 *      last, a whole unit under another stamp, and every unit with no log, run again;
 *   3. planted, the rule before 2 Nov (any three done lines) on a copy of the batch: the B3a unit without its last arm kept.
 *   node research/tests/levers-resume.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS } from '../solver/audit-levers.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const ROOT = fileURLToPath(new URL('../..', import.meta.url)), BATCH = join(ROOT, 'research/solver/batch-levers.sh');
const dir = mkdtempSync(join(tmpdir(), 'levers-resume-'));
const run = (script, env) => {
  const out = execFileSync('bash', [script], { cwd: ROOT, env: { ...process.env, TODO_ONLY: '1', LEVERS_OUT: dir, ...env }, encoding: 'utf8' });
  const stamp = out.match(/^stamp: (code \S+ audit \S+)$/m), todo = out.match(/^todo: (.*)$/m);
  if (!stamp || !todo) throw new Error(`levers-resume: the dry run printed no stamp or todo:\n${out}`);
  return { stamp: stamp[1], todo: todo[1].split(' ').filter(Boolean).map(Number) };
};
const log = (stamp, arms) => `stamp: ${stamp} prediction none sha -\nTHE DIAL'S POSITIONS (fixture)\n${arms.map(a => `         done ${a} secs 1`).join('\n')}\n`;

try {
  // 1. an empty folder
  const first = run(BATCH, {}), NU = first.todo.length, half = NU / 2;
  ok(NU === 16 && first.todo.every((k, i) => k === i), `1. an empty folder: ${NU} units to run`);

  // 2. the fixtures, with RESUME=1 (units 0 to half-1 are B3a's, half on B3b's: audit-levers.mjs unitsOf)
  const A = GROUPS.A, B = GROUPS.B;
  writeFileSync(join(dir, 'case0.txt'), log(first.stamp, A));                                   // whole, B3a
  writeFileSync(join(dir, 'case1.txt'), log(first.stamp, A.slice(0, 3)));                       // B3a without its last arm
  writeFileSync(join(dir, 'case2.txt'), log(first.stamp.replace(/audit \S+/, 'audit 000000000000'), A));   // another stamp
  writeFileSync(join(dir, `case${half}.txt`), log(first.stamp, B));                             // whole, B3b
  writeFileSync(join(dir, `case${half + 1}.txt`), log(first.stamp, B.slice(0, 2)));             // B3b without its last arm
  const want = [...Array(NU).keys()].filter(k => k !== 0 && k !== half);
  const resumed = run(BATCH, { RESUME: '1' });
  ok(JSON.stringify(resumed.todo) === JSON.stringify(want), `2. RESUME=1: units ${resumed.todo.join(' ')} to run (kept: the whole B3a unit 0 and B3b unit ${half}; run again: 1 and ${half + 1} without their last arm, 2 under another stamp, the rest with no log)`);

  // 3. planted: the rule before 2 Nov on a copy of the batch
  const text = readFileSync(BATCH, 'utf8'), line = /^ *for a in \$arms; do .*$/m;
  if (!line.test(text)) throw new Error('levers-resume: the plant finds no arm loop in batch-levers.sh');
  const copy = join(dir, 'batch-old-rule.sh');
  writeFileSync(copy, text.replace(line, `  [ $keep = 1 ] && [ "$(grep -cE '^ +done ' "$f")" -ge 3 ] || keep=0`));
  const old = run(copy, { RESUME: '1' });
  ok(!old.todo.includes(1), `3. planted, any three done lines: unit 1 (B3a without its last arm) ${old.todo.includes(1) ? 'run again' : 'kept'}; units ${old.todo.join(' ')} to run`);
} finally { rmSync(dir, { recursive: true, force: true }); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
