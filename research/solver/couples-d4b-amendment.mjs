/*
 * THE COUPLES' RE-RUN, AMENDMENT 1 (13 Nov 2026; D94 (1); registrations/couples-d4b-amendment-1.md).
 *
 * The registered stage gate refused on 13 Nov, deciding nothing: S293's solver arms and APP ran on plans whose inputs hash
 * differently. From the plans alone, no file of the run and no path of seed 7021 read (d4b-plan-check.mjs,
 * results-d4b-plan-check.txt): the one field that differs is the second person's MPAA age, a label the engine derives
 * from the plan's own expected path (58 where the solver arms' plan is resolved, 60 in arm A's), and it moves no money on
 * this couple (contributions under the MPAA's limit; 0 of 2,000 paths of the tuning seed differ under either age). By the
 * maintainer's ruling (D94 (1)) the stage gate and the read take that ONE difference as one plan, and nothing wider:
 *   - only the couple S293;
 *   - only with APP's unit on exactly the hash the plan check printed for arm A's plan, and the solver arm's unit on
 *     exactly the hash it printed for the solver arms';
 *   - any other couple, any other hash on S293, the two the other way round, or S293 with only some of its solver units
 *     on the solver arms' hash, is refused as before.
 * The 200 first-stage chunks stay on the launch stamp. Two stamped files change with this amendment (stage-couples.mjs,
 * reduce-couples.mjs: the plan check in each), so the files the read takes no longer hash to the stamp the chunks carry.
 * launchStampHash() is that hash with those two files as they were at the launch commit and every other stamped file as
 * it is in this tree: the read holds every chunk to it, and it must be the launch's own (LAUNCH.audit), so any other
 * stamped file that has moved since the launch is still refused.
 *   node research/solver/couples-d4b-amendment.mjs --planted      its own checks
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));

/* the one difference taken as one plan (results-d4b-plan-check.txt, S293's line) */
export const KNOWN = { id: 'S293', app: '59b230b4798b', solver: '6080f4d27c15' };
/* a couple's units ([{ arm, inputs }]) on one plan: every unit on one inputs hash; or the one known difference, whole:
   the couple S293, APP's unit on arm A's hash and EVERY solver unit on the solver arms' (a mix, some solver units on
   APP's hash and some on the other, is not the difference the plan check showed and is refused) */
export function onePlan(id, units, known = KNOWN) {
  if (!units.length || units.some(u => !u.inputs)) return false;
  if (new Set(units.map(u => u.inputs)).size === 1) return true;
  const app = units.filter(u => u.arm === 'APP'), solver = units.filter(u => u.arm !== 'APP');
  return id === known.id && app.length > 0 && solver.length > 0 && app.every(u => u.inputs === known.app) && solver.every(u => u.inputs === known.solver);
}
/* whether the amendment was used for this couple (the read says so beside its figures) */
export const usedFor = (id, units, known = KNOWN) => onePlan(id, units, known) && new Set(units.map(u => u.inputs)).size > 1;

/* the launch (STATE.md section 5; the launch commit, the stamp every chunk's log names) and the files amended since */
export const LAUNCH = { commit: '4e4174b1', audit: '29a4a6a71f76', code: '1d5d2421c9ab' };
export const AMENDED = ['stage-couples.mjs', 'reduce-couples.mjs'];
/* audit-couples.mjs's stampFilesHash with the amended files as they were at the launch commit. show: a file's bytes at a
   commit (git show); here: a stamped file's path in this tree. Both swapped in the planted checks. */
export function launchStampHash(stampFiles, here, show = (commit, f) => execFileSync('git', ['-C', HERE, 'show', `${commit}:research/solver/${f}`], { maxBuffer: 1 << 28 })) {
  const h = createHash('sha256');
  for (const f of stampFiles) {
    if (AMENDED.includes(f)) { h.update(show(LAUNCH.commit, f)); continue; }
    const p = here(f);
    if (existsSync(p)) h.update(readFileSync(p));
  }
  return h.digest('hex').slice(0, 12);
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const u = (arm, inputs) => ({ arm, inputs }), five = (a, s) => [u('APP', a), u('CANDC', s), u('CANDC', s), u('SHIPC', s), u('SHIPC', s)];
  check('one hash is one plan, for any couple', onePlan('S011', five('x', 'x')) && !usedFor('S011', five('x', 'x')));
  check('S293 on exactly the two known hashes is one plan, and the amendment is named as used', onePlan('S293', five(KNOWN.app, KNOWN.solver)) && usedFor('S293', five(KNOWN.app, KNOWN.solver)));
  check('another couple on the same two hashes is refused', !onePlan('S011', five(KNOWN.app, KNOWN.solver)));
  check('S293 with the two hashes the other way round is refused', !onePlan('S293', five(KNOWN.solver, KNOWN.app)));
  check('S293 with APP on the known hash and a solver arm on any other is refused', !onePlan('S293', [u('APP', KNOWN.app), u('CANDC', KNOWN.solver), u('CANDC', 'zzzzzzzzzzzz'), u('SHIPC', KNOWN.solver), u('SHIPC', KNOWN.solver)]));
  check('S293 with a solver arm on the known hash and APP on any other is refused', !onePlan('S293', five('zzzzzzzzzzzz', KNOWN.solver)));
  check('S293 with one solver unit on APP\'s hash and the rest on the solver arms\' (a mix) is refused', !onePlan('S293', [u('APP', KNOWN.app), u('CANDC', KNOWN.app), u('CANDC', KNOWN.solver), u('SHIPC', KNOWN.solver), u('SHIPC', KNOWN.solver)]));
  check('S293 with every unit on APP\'s hash, or every unit on the solver arms\', is one plan (no difference to accept)', onePlan('S293', five(KNOWN.app, KNOWN.app)) && onePlan('S293', five(KNOWN.solver, KNOWN.solver)) && !usedFor('S293', five(KNOWN.app, KNOWN.app)));
  check('a unit with no inputs hash is not on one plan with anything', !onePlan('S293', [u('APP', KNOWN.app), u('CANDC', undefined)]) && !onePlan('S011', [u('APP', ''), u('CANDC', '')]) && !onePlan('S011', []));
  // the launch stamp: the amended files taken at the launch commit, every other as it is here
  const files = ['a.mjs', 'stage-couples.mjs', 'reduce-couples.mjs', 'b.json'];
  const here = f => join(HERE, f === 'a.mjs' ? 'stats.mjs' : 'couples-orders.json');
  const plain = (() => { const h = createHash('sha256'); h.update(readFileSync(here('a.mjs'))); h.update(Buffer.from('S')); h.update(Buffer.from('R')); h.update(readFileSync(here('b.json'))); return h.digest('hex').slice(0, 12); })();
  const at = (c, f) => Buffer.from(f === 'stage-couples.mjs' ? 'S' : 'R');
  check('the launch stamp takes the amended files at the launch commit and the rest from this tree', launchStampHash(files, here, at) === plain);
  check('...so an amended file as it is now does not move it, and another stamped file that moved does', launchStampHash(files, here, (c, f) => Buffer.from(f === 'stage-couples.mjs' ? 'S' : 'R')) === plain && launchStampHash(files, f => join(HERE, f === 'a.mjs' ? 'reduce-phase4.mjs' : 'couples-orders.json'), at) !== plain);
  check('...and the amended file as it was at another commit moves it', launchStampHash(files, here, (c, f) => Buffer.from(f === 'stage-couples.mjs' ? 'S2' : 'R')) !== plain);
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { STAMP_FILES, PANEL_FILE } = await import('./audit-couples.mjs');
  const got = launchStampHash(STAMP_FILES, f => (f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  console.log(`the launch stamp, the amended files (${AMENDED.join(', ')}) as at ${LAUNCH.commit}: ${got}; the launch's ${LAUNCH.audit}: ${got === LAUNCH.audit ? 'THE SAME' : 'NOT THE SAME'}`);
  process.exit(got === LAUNCH.audit ? 0 : 1);
}
