/*
 * check-state.mjs, shown failing on planted faults (CHECKLIST.md item 5): a typed figure, an edited printed block, a
 * state file over its line limit, a missing section; and passing the committed STATE.md and a clean planted text.
 *   node research/tests/check-state.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { textProblems, stateProblems, MAX_LINES } from '../solver/check-state.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const real = readFileSync(fileURLToPath(new URL('../solver/STATE.md', import.meta.url)), 'utf8');

const P0 = await stateProblems(real);
ok(P0.length === 0, `the committed STATE.md passes (${P0.length ? P0.join('; ') : 'no problems'})`);
const clean = '## 1. a\n## 2. b\n`0.02` and <!-- decided-defaults {"x": 0.5} -->\n## 3. c\n## 4. d\n## 5. e\n## 6. f\n';
ok(textProblems(clean).length === 0, 'a clean planted text passes: figures inside backticks and the decided-defaults block are allowed');
ok(textProblems(clean.replace('## 3. c', '## 3. c, survival 41.27 by hand')).some(p => /typed by hand \("41\.27"\)/.test(p)), 'planted: a decimal typed outside a printed block is refused');
ok(textProblems(clean.replace('## 3. c', '## 3. c, up 3%')).some(p => /typed by hand/.test(p)), 'planted: a percentage typed by hand is refused');
ok(textProblems(clean.replace('## 3. c', '## 3. c, £66,559')).some(p => /typed by hand/.test(p)), 'planted: a sum in pounds typed by hand is refused');
ok(textProblems(clean.replace('## 4. d\n', '')).some(p => /no section "## 4\."/.test(p)), 'planted: a missing section is refused');
ok(textProblems(clean + 'x\n'.repeat(MAX_LINES)).some(p => /lines; the limit/.test(p)), `planted: a state file over ${MAX_LINES} lines is refused`);
const edited = real.replace(/(<!-- printed:candidate -->\n- The candidate)/, '$1 (edited by hand)');
ok(edited !== real && (await stateProblems(edited)).some(p => /printed block "candidate" is not what state\.mjs prints/.test(p)), 'planted: a printed block edited by hand is refused');

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} check-state checks failed`);
