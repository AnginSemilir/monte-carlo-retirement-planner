/*
 * THE FAIR-TEST GATE'S ALLOWED VERSIONS (17 Nov, D126: the maintainer's unlock for exactly fair-gate.mjs's stamp check, "an
 * optional list of allowed versions ... with a dated note and a planted case refusing a third"; SHAPES.md amendment 1).
 * checkLogStamps on a read's unit logs, each "stamp: code <id> audit <hash> prediction none sha -":
 *   1. without an allowed list, logs on two versions are refused, as before the change;
 *   2. with the two versions allowed, the same logs pass;
 *   3. the planted case: a log on a third version, beside the two allowed, is refused;
 *   4. an allowed list naming two codes is refused, the logs on both versions it lists (so the one-code rule alone can
 *      refuse them: the reviewer before use, finding 6);
 *   5. logs on one version pass without a list, as before, and with a list naming that version.
 * The plants (scratch copies of fair-gate.mjs, each with one rule taken out): 'acceptall' (every version taken) fails check
 * 3 alone; 'manycodes' (the one-code rule taken out) fails check 4 alone.
 *   node research/tests/fair-gate-allowed.test.mjs
 */
import { checkLogStamps } from '../solver/fair-gate.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const log = (code, audit) => `stamp: code ${code} audit ${audit} prediction none sha -\nSHAPES (EXPLORATORY): a unit\n`;
const opts = (allowed = null) => ({ blob: () => '-', textAt: () => null, textNow: () => null, ...(allowed ? { allowed } : {}) });
const A = 'code 603eeb595679 audit 260916d007cd', B = 'code 603eeb595679 audit d97b3e32482d', C = 'code 000000000000 audit d97b3e32482d';
const two = { case0: log('603eeb595679', '260916d007cd'), case1: log('603eeb595679', '260916d007cd'), case20: log('603eeb595679', 'd97b3e32482d') };
const LABELS = ['without an allowed list, logs on two versions are refused', 'with the two versions allowed, the same logs pass', 'the planted case: a third version beside the two allowed is refused',
  'an allowed list naming two codes is refused, the logs on both of its versions', 'logs on one version pass without a list, and with a list naming it'];
const checksOf = check => [
  check(two, 'none', opts()).some(p => /more than one version/.test(p)),
  check(two, 'none', opts([A, B])).length === 0,
  check({ ...two, case5: log('603eeb595679', 'ffffffffffff') }, 'none', opts([A, B])).some(p => /ffffffffffff/.test(p)),
  check({ case0: two.case0, case7: log('000000000000', 'd97b3e32482d') }, 'none', opts([A, C])).some(p => /not a list on one code/.test(p)),
  check({ case0: two.case0, case1: two.case1 }, 'none', opts()).length === 0 && check({ case0: two.case0, case1: two.case1 }, 'none', opts([A])).length === 0
];
let bad = 0;
checksOf(checkLogStamps).forEach((ok, i) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${LABELS[i]}`); });
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'solver', 'fair-gate.mjs'), 'utf8'), dir = mkdtempSync(join(tmpdir(), 'fair-gate-plant-'));
const PLANTS = [['acceptall', s => s.replace('const out = [...versions].filter(v => !allowed.includes(v));', 'const out = [];'), 2],
  ['manycodes', s => s.replace(".size !== 1)) bad.push(`the allowed versions are not a list on one code", ".size !== 1 && false)) bad.push(`the allowed versions are not a list on one code"), 3]];
for (const [name, edit, want] of PLANTS) {
  const s = edit(src);
  if (s === src) { bad++; console.log(`  FAIL the plant '${name}' found nothing to take out`); continue; }
  const f = join(dir, `fair-gate-${name}.mjs`);
  writeFileSync(f, s);
  const failed = checksOf((await import(pathToFileURL(f).href)).checkLogStamps).map((ok, i) => (ok ? -1 : i)).filter(i => i >= 0);
  const ok = JSON.stringify(failed) === JSON.stringify([want]);
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} the plant '${name}' fails check ${want + 1} alone (it fails ${failed.map(i => i + 1).join(', ') || 'none'})`);
}
rmSync(dir, { recursive: true, force: true });
console.log(bad ? `FAILED: ${bad}` : `ALL PASS: ${LABELS.length} checks and ${PLANTS.length} plants`);
process.exit(bad ? 1 : 0);
