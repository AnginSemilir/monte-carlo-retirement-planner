/*
 * THE HELD-OUT SCAN, WIDENED (STATE.md D38 (1)): every library id an earlier run touched, for choosing any panel after
 * Phase 4. phase4-panel.mjs touched() reads this branch's results, the archive, the archived manifest and the tests; it
 * could not see the external review's own runs, which live on the review branch (its N1 assessment ran S368 on 26 Oct,
 * found only at Phase 4's read). touchedAll adds every id named in the review branch's research/reviews/, file names and
 * contents, read through git. A branch that cannot be read is refused, never skipped: a silent skip is the fault this
 * closes. phase4-panel.mjs stays as Phase 4 stamped it (its read takes that file's hash).
 *   node research/solver/held-out.mjs [ref]     the ids the review branch adds to touched(), and the count
 */
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { touched } from './phase4-panel.mjs';
import { idsIn } from './scan-touched.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const REVIEW_REF = 'origin/review/external-2026-10-21', REVIEW_DIR = 'research/reviews/';
const git = args => execFileSync('git', args, { cwd: REPO, encoding: 'latin1', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });

/* the review branch's files under research/reviews/, as [path, text]; throws when the ref cannot be read */
export function reviewFiles(ref = REVIEW_REF) {
  let names;
  try { names = git(['ls-tree', '-r', '--name-only', ref, '--', REVIEW_DIR]).split('\n').filter(Boolean); }
  catch (e) { throw new Error(`held-out: the review branch ${ref} cannot be read (fetch it: git fetch origin ${ref.replace(/^origin\//, '')}); refusing to scan without it`); }
  if (!names.length) throw new Error(`held-out: ${ref} has nothing under ${REVIEW_DIR}; refusing to scan without it`);
  return names.map(p => [p, git(['show', `${ref}:${p}`])]);
}
/* the ids the review branch names */
export function reviewIds(files) {
  const S = new Set();
  for (const [p, t] of files) { idsIn(p).forEach(id => S.add(id)); idsIn(t).forEach(id => S.add(id)); }
  return S;
}
/* touched() and the review branch together: the scan any later panel takes */
export function touchedAll({ root = HERE, files = null, ref = REVIEW_REF } = {}) {
  const S = touched(root);
  for (const id of reviewIds(files || reviewFiles(ref))) S.add(id);
  return S;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ref = process.argv[2] || REVIEW_REF, files = reviewFiles(ref), base = touched(), rev = reviewIds(files);
  const added = [...rev].filter(id => !base.has(id)).sort();
  console.log(`held-out: ${ref}, ${files.length} files under ${REVIEW_DIR}: ${rev.size} ids named, ${added.length} not in touched() (${base.size}): ${added.join(', ') || 'none'}`);
}
