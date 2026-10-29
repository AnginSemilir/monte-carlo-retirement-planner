/*
 * THE HELD-OUT SCAN READS THE REVIEW BRANCH (STATE.md D38 (1); CHECKLIST 5). held-out.mjs touchedAll adds the ids named
 * in the review branch's research/reviews/ to phase4-panel.mjs touched(). The checks:
 *   1. the planted case: a review file naming an id no earlier run touched puts it in the scan, by its contents and by
 *      its file name, where touched() alone leaves it out;
 *   2. a review branch that cannot be read is refused, never skipped;
 *   3. on the real review branch (origin/review/external-2026-10-21, fetched): every id it names is in the scan, S368 (the
 *      review's N1 assessment, 26 Oct) among them, and the ids it adds to touched() alone are listed (Phase 4's own results
 *      name S368 now, so touched() alone has it since 28 Oct).
 *   node research/tests/held-out.test.mjs
 */
import { touched } from '../solver/phase4-panel.mjs';
import { touchedAll, reviewFiles, reviewIds } from '../solver/held-out.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const base = touched();
// an untouched library id to plant: the first single household touched() leaves out
const fresh = buildScenarios().map(s => s.id).filter(id => !base.has(id));
const [a, b] = fresh;
ok(a && b, `two untouched library ids to plant (${a}, ${b}; ${fresh.length} untouched of the library)`);

// 1. the planted case
{ const S = touchedAll({ files: [['research/reviews/2099-01-01/N9.md', `the assessment ran ${a} at its library target`], [`research/reviews/2099-01-01/${b}-trace.txt`, 'nothing']] });
  ok(!base.has(a) && S.has(a), `the planted case: ${a}, named in a review file's contents, is in the scan (touched() alone: ${base.has(a) ? 'in' : 'out'})`);
  ok(!base.has(b) && S.has(b), `the planted case: ${b}, named in a review file's name, is in the scan`);
  ok([...base].every(id => S.has(id)), 'everything touched() finds stays in the scan'); }

// 2. an unreadable branch is refused
{ let err = null; try { touchedAll({ ref: 'origin/no-such-branch' }); } catch (e) { err = e.message; }
  ok(err && /cannot be read/.test(err), `a review branch that cannot be read is refused: ${err ? err.split(';')[0] : 'NOT REFUSED'}`); }

// 3. the real branch
{ let files = null, err = null; try { files = reviewFiles(); } catch (e) { err = e.message; }
  if (err) ok(false, `the real review branch: ${err}`);
  else {
    const S = touchedAll({ files }), named = reviewIds(files), added = [...named].filter(id => !base.has(id)).sort();
    ok(S.has('S368') && [...named].every(id => S.has(id)), `the real review branch (${files.length} files, ${named.size} ids named): every one in the scan, S368 among them; added to touched() alone: ${added.join(', ') || 'none'}`);
  } }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
