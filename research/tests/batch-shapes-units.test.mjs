/*
 * THE SHAPES BATCH'S RE-RUN GUARDS (SHAPES.md amendment 1, D125 to D127; the reviewer before use, finding 5). On a scratch
 * folder of 28 fake unit logs on the launch's stamp (26 with their done line, units 20 and 27 refused), batch-shapes.sh in
 * its dry and move-only modes (TODO_ONLY, MOVE_ONLY; nothing runs):
 *   1. RESUME=1 UNITS_ONLY="20 27 20" lists units 20 and 27, each once;
 *   2. RESUME=1 without UNITS_ONLY is refused while logs on another stamp are there;
 *   3. UNITS_ONLY without RESUME=1 is refused;
 *   4. MOVE_ONLY moves case20.txt and case27.txt aside to case<k>-refused.txt and touches no other log;
 *   5. a log on another stamp is not moved over a refused log already there: refused, the refused log unchanged.
 * Each guard taken out of a scratch copy of the batch (the plants) fails the check it names.
 *   node research/tests/batch-shapes-units.test.mjs
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), BATCH = join(ROOT, 'research/solver/batch-shapes.sh');
const LAUNCH = 'stamp: code 603eeb595679 audit 260916d007cd prediction none sha -';
function folder() {
  const d = mkdtempSync(join(tmpdir(), 'shapes-units-'));
  for (let k = 0; k < 28; k++) writeFileSync(join(d, `case${k}.txt`), k === 20 || k === 27 ? `${LAUNCH}\nSHAPES (EXPLORATORY): unit ${k}/28\naudit-shapes: X: household: levels 1,1.1,0.95,0.9,0.8, the first person's 1,1.1,0.95,0.9,0.799985\n` : `${LAUNCH}\nSHAPES (EXPLORATORY): unit ${k}/28\n         done unit ${k} secs 100\n`);
  return d;
}
const run = (script, d, env) => spawnSync('bash', [script], { cwd: ROOT, env: { ...process.env, SH_OUT: d, ...env }, encoding: 'utf8' });
const snapshot = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f) && f !== 'case20.txt' && f !== 'case27.txt').map(f => [f, readFileSync(join(d, f), 'utf8')]));
function checks(script) {
  const out = [];
  { const d = folder(), r = run(script, d, { RESUME: '1', UNITS_ONLY: '20 27 20', TODO_ONLY: '1' }); out.push(r.status === 0 && /^todo: 20 27$/m.test(r.stdout)); rmSync(d, { recursive: true }); }
  { const d = folder(), r = run(script, d, { RESUME: '1', TODO_ONLY: '1' }); out.push(r.status === 2 && /needs UNITS_ONLY/.test(r.stdout)); rmSync(d, { recursive: true }); }
  { const d = folder(), r = run(script, d, { UNITS_ONLY: '20', TODO_ONLY: '1' }); out.push(r.status === 2); rmSync(d, { recursive: true }); }
  { const d = folder(), before = snapshot(d), r = run(script, d, { RESUME: '1', UNITS_ONLY: '20 27', MOVE_ONLY: '1' }), after = snapshot(d);
    out.push(r.status === 0 && existsSync(join(d, 'case20-refused.txt')) && existsSync(join(d, 'case27-refused.txt')) && !existsSync(join(d, 'case20.txt')) && !existsSync(join(d, 'case27.txt')) && JSON.stringify(before) === JSON.stringify(after) && Object.keys(after).length === 26);
    rmSync(d, { recursive: true }); }
  { const d = folder(); writeFileSync(join(d, 'case20-refused.txt'), 'the first refusal\n'); const r = run(script, d, { RESUME: '1', UNITS_ONLY: '20', MOVE_ONLY: '1' });
    out.push(r.status === 2 && readFileSync(join(d, 'case20-refused.txt'), 'utf8') === 'the first refusal\n' && existsSync(join(d, 'case20.txt'))); rmSync(d, { recursive: true }); }
  return out;
}
const LABELS = ['RESUME=1 UNITS_ONLY="20 27 20" lists 20 and 27, each once', 'RESUME=1 without UNITS_ONLY is refused beside logs on another stamp', 'UNITS_ONLY without RESUME=1 is refused',
  'MOVE_ONLY moves case20.txt and case27.txt aside and touches no other log', 'a log on another stamp is not moved over a refused log already there'];
let bad = 0;
const got = checks(BATCH);
got.forEach((ok, i) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${LABELS[i]}`); });
// the plants: each guard taken out of a scratch copy (in the repo's research/solver, so its relative paths hold), failing its check
const PLANTS = [['nodedupe', s => s.replace(/^ {2}UNITS_ONLY=\$\(printf .*awk .*$/m, ''), 0], ['noguard', s => s.replace(/^if \[ "\$\{RESUME:-0\}" = 1 \] && \[ -z "\$\{UNITS_ONLY:-\}" \].*$/m, ''), 1],
  ['nomove', s => s.replace(/^ {6}mv "\$f" "\$r".*$/m, ''), 3], ['overwrite', s => s.replace(/^ {6}\[ -e "\$r" \] && .*$/m, ''), 4]];
const src = readFileSync(BATCH, 'utf8'), tmp = join(ROOT, 'research/solver', '.batch-shapes-plant.sh');
for (const [name, edit, want] of PLANTS) {
  const s = edit(src);
  if (s === src) { bad++; console.log(`  FAIL the plant '${name}' found nothing to take out`); continue; }
  writeFileSync(tmp, s);
  const failed = checks(tmp).map((ok, i) => (ok ? -1 : i)).filter(i => i >= 0);
  const ok = JSON.stringify(failed) === JSON.stringify([want]);
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} the plant '${name}' fails check ${want + 1} alone (it fails ${failed.map(i => i + 1).join(', ') || 'none'})`);
}
rmSync(tmp, { force: true });
console.log(bad ? `FAILED: ${bad}` : `ALL PASS: ${LABELS.length} checks and ${PLANTS.length} plants`);
process.exit(bad ? 1 : 0);
