/*
 * THE CLAUDE CODE HOOKS ON SIMULATED INPUT (RULES.md rule 2: each check shown to fail on a planted case). The pre-tool
 * decisions and the stop decision are pure functions; the session-start hook is run as a process.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide as pre, shellCode } from '../../.claude/hooks/pre-tool.mjs';
import { decide as stop, MAX_REPEATS } from '../../.claude/hooks/stop-check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const bash = command => pre({ tool_name: 'Bash', tool_input: { command } }, { root: ROOT });
const edit = file_path => pre({ tool_name: 'Edit', tool_input: { file_path } }, { root: ROOT, tracked: f => /m14b/.test(f) });
const is = (d, want) => (want === null ? d === null : d && d.decision === want);

// edits to the enforcement ask the maintainer; ordinary edits pass
ok(is(edit(join(ROOT, 'research/solver/check-plan.mjs')), 'ask'), 'an edit to the plan checker asks the maintainer');
ok(is(edit('.claude/settings.json'), 'ask'), 'an edit to the hook settings asks');
ok(is(edit('.claude/hooks/stop-check.mjs'), 'ask'), 'an edit to a hook asks');
ok(is(edit('research/solver/review-log.md'), 'ask'), 'an edit to the review log asks (receipts come from record-review.mjs)');
ok(is(edit('research/solver/predictions/m14b.md'), 'ask'), 'an edit to a registered (committed) prediction asks');
ok(is(edit('research/solver/predictions/new-one.md'), null), 'an unregistered prediction can be written freely');
ok(is(edit(join(ROOT, 'research/solver/PLAN.md')), null), 'an edit to the plan itself goes ahead (the checks run after)');
ok(is(edit('src/solver/solve.js'), null), 'an edit to the solver goes ahead (the smoke run guards the batch)');

// the shell
ok(is(bash('pkill -f "vite"'), 'deny'), 'planted: pkill -f is refused');
ok(is(bash('killall node'), 'deny'), 'planted: killall is refused');
ok(is(bash('git commit --no-verify -m "x"'), 'deny'), 'planted: git commit --no-verify is refused');
ok(is(bash('git commit -nm "x"'), 'deny'), 'planted: git commit -n is refused');
ok(is(bash('git commit -m "fix the -n flag and --no-verify text"'), null), 'words inside a commit message are not flags');
ok(is(bash("git commit -q -m \"$(cat <<'EOF'\nsubject --no-verify\nEOF\n)\""), null), 'a here-document commit message is not read as flags');
ok(is(bash('git config core.hooksPath /dev/null'), 'deny'), 'planted: pointing core.hooksPath elsewhere is refused');
ok(is(bash('git config --unset core.hooksPath'), 'deny'), 'planted: unsetting core.hooksPath is refused');
ok(is(bash('git config core.hooksPath .githooks'), null), 'setting core.hooksPath to .githooks is fine');
ok(is(bash('rm -rf /tmp/solver-experiment.lock'), 'deny'), 'planted: removing the experiment lock is refused');
ok(is(bash('git push --force origin x'), 'deny'), 'planted: a plain force push is refused');
ok(is(bash('git push -u origin claude/x'), null), 'an ordinary push goes ahead');
ok(is(bash('env ONLY=3 node research/solver/experiment.mjs flex tag 30 3000 7001 7002'), 'deny'), 'planted: an experiment launched outside the launcher is refused');
ok(is(bash('bash research/solver/batch-m14b.sh'), 'deny'), 'planted: a batch launched outside the launcher is refused');
ok(is(bash('node research/solver/audit-s126.mjs f1 16 1000 variants > log'), 'deny'), 'planted: an audit run outside the launcher is refused');
ok(is(bash('PREDICTION=research/solver/predictions/m14b.md research/solver/run-from-snapshot.sh bash research/solver/batch-m14b.sh'), null), 'the same batch through the launcher goes ahead');
ok(is(bash('node research/solver/audit-s126.mjs scan'), null), 'a census with no solve (audit scan) goes ahead');
ok(is(bash('node --check research/solver/experiment.mjs'), null), 'a syntax check is not a launch');
ok(is(bash('grep -n world research/solver/experiment.mjs'), null), 'reading an experiment script is not a launch');
ok(is(bash("sed -i 's/a/b/' research/solver/check-plan.mjs"), 'ask'), 'planted: sed -i on the checker asks');
ok(is(bash('echo x > .claude/settings.json'), 'ask'), 'planted: a redirect into the hook settings asks');
ok(is(bash("python3 - <<'EOF'\nopen('research/solver/fair-gate.mjs','w').write('')\nEOF"), 'ask'), 'planted: an inline script that names the gate asks');
ok(is(bash('cat research/solver/check-plan.mjs'), null), 'reading the checker goes ahead');
ok(is(bash('node research/solver/check-plan.mjs > /tmp/out.txt'), null), 'running the checker with its output redirected elsewhere goes ahead');
ok(is(bash("python3 - <<'EOF'\nopen('research/solver/PLAN.md','w')\nEOF"), null), 'an inline edit of the plan itself goes ahead (the post-tool check runs)');
ok(shellCode("a 'x' \"y\" b") === "a '' \"\" b", 'quoted text is blanked before a command is read');

// the stop decision
const pass = { receipt: { verdict: 'PASS' } };
ok(!stop({ checkOk: true, checkOutput: '', review: pass, repeats: 0 }).block, 'a passing plan with a passing receipt may end the turn');
ok(stop({ checkOk: false, checkOutput: '[ledger] x', review: pass, repeats: 0 }).block, 'planted: a failing plan check blocks the end of the turn');
ok(stop({ checkOk: true, checkOutput: '', review: { receipt: null }, repeats: 0 }).block, 'planted: an unreviewed plan blocks the end of the turn');
ok(/FAILED/.test(stop({ checkOk: true, checkOutput: '', review: { receipt: { verdict: 'FAIL', findings: '1. x' } }, repeats: 0 }).reason), 'planted: a failed review blocks, with its findings');
const tired = stop({ checkOk: false, checkOutput: '[ledger] x', review: pass, repeats: MAX_REPEATS });
ok(!tired.block && /still failing/.test(tired.warn), `after ${MAX_REPEATS} blocks for the same reason the turn may end, with a warning to the maintainer`);

// session start, as a process: the checklist comes back after a compaction
const out = execFileSync('bash', [join(ROOT, '.claude/hooks/session-start.sh')], { input: '{"source":"compact"}', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } }).toString();
ok(/COMPACTED/.test(out) && /1\. Before a run/.test(out) && /12\. Times in UK time/.test(out), 'after a compaction the session-start hook restates the whole checklist');
const out2 = execFileSync('bash', [join(ROOT, '.claude/hooks/session-start.sh')], { input: '{"source":"startup"}', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } }).toString();
ok(!/COMPACTED/.test(out2) && /1\. Before a run/.test(out2), 'at startup it states the checklist without the compaction warning');

console.log(`\n${n} passed`);
