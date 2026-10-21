/*
 * THE PRE-TOOL HOOK, ON SIMULATED INPUT (.claude/hooks/pre-tool.mjs, slimmed by the external review of 21 Oct, Part B
 * Step 3). Each rule is shown refusing its planted case and letting the ordinary command beside it through: --no-verify,
 * a force push, killing by pattern, a hooksPath change, a write to a protected file (by the Edit tool, by a redirect, by a
 * writing command), the archive, a test in run-all.mjs's FAST list; and the unlock, which only the maintainer's latest
 * typed message can give.
 *   node research/tests/hooks.test.mjs
 */
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, unlockedFrom, suiteFiles } from '../../.claude/hooks/pre-tool.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const bash = (command, unlocked = false) => decide({ tool_name: 'Bash', tool_input: { command } }, { root: ROOT, unlocked });
const edit = (file_path, unlocked = false) => decide({ tool_name: 'Edit', tool_input: { file_path } }, { root: ROOT, unlocked });
const denied = d => !!d && d.decision === 'deny';

// commits, pushes, kills
ok(denied(bash('git commit --no-verify -m x')), 'git commit --no-verify is refused');
ok(denied(bash('git commit -n -m x')), 'git commit -n is refused');
ok(!denied(bash('git commit -q -m "a fix"')), 'an ordinary commit goes ahead');
ok(denied(bash('git push --force origin b')) && denied(bash('git push -f origin b')) && denied(bash('git push origin +b')), 'a force push is refused (--force, -f, +ref)');
ok(!denied(bash('git push --force-with-lease origin b')) && !denied(bash('git push -q -u origin b')), 'a push with --force-with-lease, or a plain push, goes ahead');
ok(denied(bash('pkill -f audit')) && denied(bash('killall node')) && denied(bash('kill $(pgrep -f node)')), 'killing by pattern is refused');
ok(!denied(bash('kill 12345')), 'killing a recorded pid goes ahead');
ok(denied(bash('git config core.hooksPath /dev/null')) && denied(bash('git config core.hooksPath .git/x 2>/dev/null')) && !denied(bash('git config core.hooksPath .githooks')) && !denied(bash('git config core.hooksPath .githooks 2>/dev/null')), 'core.hooksPath may only point at .githooks');

// protected files
ok(denied(edit(join(ROOT, 'CLAUDE.md'))) && denied(edit(join(ROOT, '.claude/hooks/pre-tool.mjs'))) && denied(edit(join(ROOT, '.github/workflows/verify.yml'))), 'an Edit of CLAUDE.md, a hook or CI is refused');
ok(denied(edit(join(ROOT, 'research/solver/archive/PLAN.md'))), 'an Edit inside the archive is refused');
ok(!denied(edit(join(ROOT, 'research/solver/STATE.md'))) && !denied(edit(join(ROOT, 'src/solver/solve.js'))), 'an Edit of STATE.md or the solver goes ahead');
const suite = suiteFiles(ROOT);
ok(suite.length > 0 && suite.every(f => denied(edit(join(ROOT, f)))), `every test in run-all.mjs's FAST list is protected (${suite.length} files)`);
ok(denied(bash('echo x > CLAUDE.md')) && denied(bash('cat a >> research/tests/run-all.mjs')), 'a redirect into a protected file is refused');
ok(denied(bash('sed -i s/a/b/ research/solver/CHECKLIST.md')) && denied(bash('rm -rf research/solver/archive/items')) && denied(bash('git mv .githooks/pre-commit x')), 'a writing command naming a protected path is refused');
ok(!denied(bash('cat CLAUDE.md && node research/tests/hooks.test.mjs > /tmp/out.txt 2>&1')) && !denied(bash('grep -n x research/solver/archive/PLAN.md')), 'reading a protected file, or running a test into /tmp, goes ahead');
ok(!denied(edit(join(ROOT, 'CLAUDE.md'), true)) && !denied(bash('echo x > CLAUDE.md', true)), 'unlocked, a protected file may be written');
ok(denied(bash('git commit --no-verify -m x', true)), 'unlocked or not, --no-verify is refused');

// the unlock: the maintainer's latest typed message only
const human = text => JSON.stringify({ type: 'user', origin: { kind: 'human' }, message: { content: text } });
const tool = text => JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: text }] } });
const queued = text => JSON.stringify({ type: 'queue-operation', operation: 'enqueue', content: text });
ok(unlockedFrom([human('please unlock enforcement for this')].join('\n')) === true, 'the maintainer\'s latest message saying "unlock enforcement" unlocks');
ok(unlockedFrom([human('unlock enforcement'), human('carry on')].join('\n')) === false, 'their next message locks it again');
ok(unlockedFrom([human('unlock enforcement'), tool('unlock enforcement'), tool('done')].join('\n')) === true, 'a tool result neither gives nor ends an unlock');
ok(unlockedFrom([human('carry on'), tool('unlock enforcement')].join('\n')) === false, 'a tool result saying it does not unlock');
ok(unlockedFrom([human('unlock enforcement'), queued('stop')].join('\n')) === false, 'a queued message ends the unlock at once');

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} hook checks failed`);
