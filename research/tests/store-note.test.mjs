/*
 * A SOLVE'S NOTE THAT IT IS NOT KEPT ON THIS DEVICE (src/solveStatus.js storeNoteAfter, src/useSolver.js). A job can store more
 * than one solve: a dial position's base and the position, a couple's two people (src/solverClient.js calls onStored once for
 * each). The page kept the last store's result alone, so a solve not kept followed by one kept said nothing, and the reverse
 * said the plan was not kept when half of it was (the second review of Part D's D5, 14 Nov, finding 2). The note now keeps the
 * first one not kept. The full tier.
 *   1. the fold over a job's stores, as the client reports them: the first not kept and the second kept names the first's
 *      reason; the first kept and the second not names the second's; both not kept, the first's; both kept, none; one store
 *      alone, as before (kept, none; not kept, its reason);
 *   2. the page folds each store through it: useSolver.js's onStored takes the note through storeNoteAfter;
 *   3. the status strip says the note on a solved plan (statusOf: "It is not kept on this device (...)"), and nothing where
 *      every store kept its solve.
 * Plant (--planted): STATUS_PLANT 'lastnote' (the last store's result alone, as before): checks 1 and 3 fail.
 *   node research/tests/store-note.test.mjs [--planted]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { storeNoteAfter, statusOf, STATUS_PLANT } from '../../src/solveStatus.js';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let out = '';
  try { out = execFileSync(process.execPath, [SELF], { env: { ...process.env, STORE_NOTE_PLANT: 'lastnote' }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
  const failed = [...new Set([...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]))], right = failed.join() === '1,3';
  console.log(`plant 'lastnote': the checks that fail: ${failed.join(', ') || 'none'}; wanted 1, 3: ${right ? 'yes' : 'NO'}`);
  process.exit(right ? 0 : 1);
}
STATUS_PLANT.rule = process.env.STORE_NOTE_PLANT || '';

let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); };

// 1. the fold over a job's stores
const fold = stores => stores.reduce((note, [stored, why]) => storeNoteAfter(note, stored, why), null);
const cases = [
  ['the first not kept, the second kept', [[false, 'the first'], [true, null]], 'the first'],
  ['the first kept, the second not', [[true, null], [false, 'the second']], 'the second'],
  ['both not kept', [[false, 'the first'], [false, 'the second']], 'the first'],
  ['both kept', [[true, null], [true, null]], null],
  ['one store, kept', [[true, null]], null],
  ['one store, not kept', [[false, 'the only']], 'the only']
];
const got = cases.map(([name, stores, want]) => ({ name, want, note: fold(stores) }));
const wrong = got.filter(g => g.note !== g.want);
ok(wrong.length === 0, `1. the note over a job's stores keeps the first not kept (${got.map(g => `${g.name}: ${g.note === null ? 'none' : `"${g.note}"`}`).join('; ')})`);

// 2. the page folds each store through it
{ const src = readFileSync(new URL('../../src/useSolver.js', import.meta.url), 'utf8');
  const folds = /onStored: \(stored, why\) => \{ kept = storeNoteAfter\(kept, stored, why\);/.test(src) && /import \{ storeNoteAfter \} from '\.\/solveStatus\.js';/.test(src);
  ok(folds, `2. useSolver.js's onStored takes the note through storeNoteAfter (${folds ? 'it does' : 'it does not'})`); }

// 3. the status strip says it
{ const solved = note => statusOf({ solveState: 'solved', solveMeta: { secs: 120, restored: false }, storeNote: note }, {});
  const a = solved(fold([[false, "the browser's storage for this site is full"], [true, null]])), b = solved(fold([[true, null], [true, null]]));
  ok(!!a.note && /not kept on this device \(the browser's storage for this site is full\)/.test(a.note) && b.note === null, `3. the strip: "${a.note}"; with every solve kept, ${b.note === null ? 'no note' : `"${b.note}"`}`); }

console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
