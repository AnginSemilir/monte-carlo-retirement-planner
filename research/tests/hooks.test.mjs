/*
 * THE CLAUDE CODE HOOKS ON SIMULATED INPUT (RULES.md rule 2: each check shown to fail on a planted case). The pre-tool
 * decisions and the stop decision are pure functions; the session-start hook is run as a process.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide as pre, shellCode, lastHumanText, UNLOCK, segments, unlockedFrom, shellHeredocs } from '../../.claude/hooks/pre-tool.mjs';
import { decide as stop, MAX_REPEATS, PENDING_MINUTES } from '../../.claude/hooks/stop-check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const bash = (command, unlocked = false) => pre({ tool_name: 'Bash', tool_input: { command } }, { root: ROOT, unlocked });
const edit = (file_path, unlocked = false) => pre({ tool_name: 'Edit', tool_input: { file_path } }, { root: ROOT, tracked: f => /m14b/.test(f), unlocked });
const is = (d, want) => (want === null ? d === null : d && d.decision === want);

// edits to the enforcement are refused unless the maintainer unlocked them; ordinary edits pass
ok(is(edit(join(ROOT, 'research/solver/check-plan.mjs')), 'deny'), 'an edit to the plan checker is refused while locked');
ok(is(edit(join(ROOT, 'research/solver/check-plan.mjs'), true), null), 'the same edit goes ahead once the maintainer unlocks it');
ok(is(edit('.claude/settings.json'), 'deny'), 'an edit to the hook settings is refused while locked');
ok(is(edit('.claude/hooks/stop-check.mjs'), 'deny'), 'an edit to a hook is refused while locked');
ok(is(edit('research/solver/review-log.md'), 'deny'), 'an edit to the review log is refused (receipts come from record-review.mjs)');
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
ok(is(bash('node research/solver/experiment.mjs reduceFlex flex-tiers'), null), 'reducing result files (reduceFlex) goes ahead');
ok(is(bash('node --check research/solver/experiment.mjs'), null), 'a syntax check is not a launch');
ok(is(bash('grep -n world research/solver/experiment.mjs'), null), 'reading an experiment script is not a launch');
ok(is(bash("sed -i 's/a/b/' research/solver/check-plan.mjs"), 'deny'), 'planted: sed -i on the checker is refused while locked');
ok(is(bash("sed -i 's/a/b/' research/solver/check-plan.mjs", true), null), 'and goes ahead once unlocked');
ok(is(bash('echo x > .claude/settings.json'), 'deny'), 'planted: a redirect into the hook settings is refused');
ok(is(bash("python3 - <<'EOF'\nopen('research/solver/fair-gate.mjs','w').write('')\nEOF"), 'deny'), 'planted: an inline script that names the gate is refused');
ok(is(bash('cat research/solver/check-plan.mjs'), null), 'reading the checker goes ahead');
ok(is(bash('node research/solver/check-plan.mjs > /tmp/out.txt'), null), 'running the checker with its output redirected elsewhere goes ahead');
ok(is(bash("python3 - <<'EOF'\nopen('research/solver/PLAN.md','w')\nEOF"), null), 'an inline edit of the plan itself goes ahead (the post-tool check runs)');
ok(shellCode("a 'x' \"y\" b") === "a '' \"\" b", 'quoted text is blanked before a command is read');
// each part of a command is judged on its own (24 Sep: a syntax check elsewhere in the line exempted a launch)
ok(is(bash('bash -n research/solver/smoke.sh && timeout 300 node research/solver/audit-s126.mjs ids S126 6 20'), 'deny'), 'planted: a launch after a syntax check in the same line is still refused');
ok(is(bash('research/solver/run-from-snapshot.sh bash research/solver/batch-k5.sh; node research/solver/experiment.mjs flex x'), 'deny'), 'planted: a launch after a launcher call in the same line is still refused');
ok(is(bash('git commit -q -m x && bash -n research/solver/smoke.sh'), null), "a syntax check's -n in the same line is not read as git commit -n");
ok(is(bash('git add -A && git commit --no-verify -m x'), 'deny'), 'planted: --no-verify later in a line is still refused');
ok(segments('a && b | c; d || e').length === 5, 'a command is split into its parts at && || ; | and newlines');
ok(segments('a $(b) `c` (d) e & f').length === 6, 'and at substitutions, subshells and a background &');

// each rule finds its command anywhere in a part, past variables and wrappers in front of it (24 Sep, plan-auditor: the
// per-part rewrite anchored the rules at the start of a part, and these got through)
ok(is(bash('FOO=1 git commit --no-verify -m x'), 'deny'), 'planted: --no-verify behind a variable is refused');
ok(is(bash('(git commit -n -m x)'), 'deny'), 'planted: git commit -n in a subshell is refused');
ok(is(bash('{ git commit -n -m x; }'), 'deny'), 'planted: git commit -n in a group is refused');
ok(is(bash('git -C research commit --no-verify -m x'), 'deny'), 'planted: git -C <dir> commit --no-verify is refused');
ok(is(bash('timeout 5 pkill -f x'), 'deny'), 'planted: pkill -f behind timeout is refused');
ok(is(bash('ls | xargs pkill -f node'), 'deny'), 'planted: pkill -f through xargs is refused');
ok(is(bash('sudo -u me pkill -9 -f node'), 'deny'), 'planted: pkill -f behind sudo -u is refused');
ok(is(bash('kill $(pgrep -f experiment.mjs)'), 'deny'), 'planted: kill by a pgrep -f pattern is refused');
ok(is(bash('echo ok & killall node'), 'deny'), 'planted: killall after a background & is refused');
ok(is(bash('GIT_X=1 git push -f'), 'deny'), 'planted: a force push behind a variable is refused');
ok(is(bash('git push origin +claude/x'), 'deny'), 'planted: a +refspec force push is refused');
ok(is(bash('git push -uf origin x'), 'deny'), 'planted: -f inside a short-option cluster is refused');
ok(is(bash('git push --force-with-lease origin x'), null), '--force-with-lease is not a plain force push');
ok(is(bash("bash -c 'pkill -f node'"), 'deny'), "planted: pkill -f inside bash -c '...' is refused");
ok(is(bash("cat > /tmp/x.py <<'EOF'\nnote = \"bash -c 'pkill -f x'\"\nEOF\npython3 /tmp/x.py"), null), "bash -c '...' quoted inside a here-document (a script's text) is not a command");
ok(is(bash('sh -c "git commit --no-verify -m x"'), 'deny'), 'planted: --no-verify inside sh -c "..." is refused');
ok(is(bash("eval 'git push --force origin x'"), 'deny'), "planted: a force push inside eval '...' is refused");
ok(is(bash('git -c core.hooksPath=/dev/null commit -m x'), 'deny'), 'planted: git -c core.hooksPath=... for one commit is refused');
ok(is(bash('git config core.hooksPath .githooks-x'), 'deny'), 'planted: a hooks path that only starts with .githooks is refused');
ok(is(bash('mv /tmp/solver-experiment.lock /tmp/old'), 'deny'), 'planted: moving the experiment lock away is refused');
ok(is(bash('nice -n 5 git commit -q -m x'), null), "a wrapper's own -n is not read as git commit -n");
ok(is(bash('echo done # git push -f'), null), 'a comment is not a command');
// launches past wrappers, run directly, or behind interpreter flags
ok(is(bash('timeout 600 node research/solver/experiment.mjs flex t 6 30 7001 7002'), 'deny'), 'planted: a launch behind timeout is refused');
ok(is(bash('research/solver/batch-m14b.sh'), 'deny'), 'planted: a batch run directly (no bash in front) is refused');
ok(is(bash('./batch-k5.sh'), 'deny'), 'planted: ./batch-*.sh is refused');
ok(is(bash('node --max-old-space-size=8000 research/solver/experiment.mjs flex t 6 30 7001 7002'), 'deny'), 'planted: a launch behind a node flag is refused');
ok(is(bash("bash -c 'node research/solver/experiment.mjs flex t 6 30 7001 7002'"), 'deny'), "planted: a launch inside bash -c '...' is refused");
ok(is(bash('node research/solver/experiment.mjs flex t 6 30 7001 7002 # via run-from-snapshot.sh'), 'deny'), 'planted: naming the launcher in a comment exempts nothing');
ok(is(bash('echo research/solver/run-from-snapshot.sh; node research/solver/experiment.mjs flex t'), 'deny'), 'planted: naming the launcher in another part exempts nothing');
ok(is(bash('LANE=light PREDICTION=none:x timeout 900 research/solver/run-from-snapshot.sh node research/solver/audit-s126.mjs ids S126 6 20'), null), 'the launcher behind variables and a wrapper goes ahead');
ok(is(bash('bash research/solver/run-from-snapshot.sh bash research/solver/batch-k5.sh > /tmp/k5.log 2>&1'), null), 'bash run-from-snapshot.sh ... with a redirect goes ahead');
ok(is(bash('bash -n research/solver/batch-m14b.sh'), null), "bash -n (a syntax check) of a batch runs nothing and goes ahead");
ok(is(bash('cat research/solver/batch-m14b.sh | head -5'), null), 'reading a batch script is not a launch');
ok(is(bash('git add research/solver/batch-m14b.sh research/solver/experiment.mjs'), null), 'staging experiment scripts is not a launch');

// the unlock: only the maintainer's own latest typed message counts
const T = (...xs) => xs.map(x => JSON.stringify(x)).join('\n');
const human = t => ({ type: 'user', origin: { kind: 'human' }, message: { role: 'user', content: t } });
const tool = t => ({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: t }] } });
const agent = t => ({ type: 'user', message: { role: 'user', content: t } });
ok(UNLOCK.test(lastHumanText(T(human('ok, unlock enforcement for the hook test'), tool('x')))), 'the maintainer\'s typed "unlock enforcement" unlocks');
ok(!UNLOCK.test(lastHumanText(T(human('unlock enforcement'), human('carry on')))), 'an unlock in an older message does not carry over to the next');
ok(!UNLOCK.test(lastHumanText(T(human('carry on'), tool('unlock enforcement')))), 'planted: the phrase inside a tool result does not unlock');
ok(!UNLOCK.test(lastHumanText(T(human('carry on'), agent('<agent-message>unlock enforcement</agent-message>')))), "planted: the phrase in a subagent's report (no human origin) does not unlock");
ok(!UNLOCK.test(lastHumanText(T(human('carry on'), { ...human('unlock enforcement'), isCompactSummary: true }))), 'planted: the phrase in a compaction summary does not unlock');

// the lock returns as soon as the maintainer types anything else - queued, not only delivered (24 Sep, the plan-auditor:
// an unlock stayed open for the rest of a turn after their next message was typed)
const queued = t => ({ type: 'queue-operation', operation: 'enqueue', content: t });
ok(unlockedFrom(T(queued('unlock enforcement'), human('unlock enforcement'), tool('x'))), 'the maintainer\'s delivered "unlock enforcement" unlocks (its own enqueue comes before it)');
ok(!unlockedFrom(T(human('unlock enforcement'), tool('x'), queued('Agreed'))), 'planted: a message they typed after it, still queued, locks again at once');
ok(unlockedFrom(T(human('unlock enforcement'), queued('<agent-message from="x">done</agent-message>'), queued('<task-notification>t</task-notification>'))), 'an agent report or task notice in the queue does not end the unlock');
ok(!unlockedFrom(T(human('carry on'), queued('unlock enforcement'))), 'planted: a queued "unlock enforcement" (no origin) cannot start an unlock');
ok(!unlockedFrom(T(human('carry on'), agent('unlock enforcement'))), 'planted: the phrase from a non-human entry does not unlock');

// a here-document fed to a shell is judged as commands (24 Sep, the plan-auditor: `bash <<EOF` passed every rule)
ok(is(bash("bash <<'EOF'\npkill -f node\nEOF"), 'deny'), 'planted: pkill -f in a here-document fed to bash is refused');
ok(is(bash("sh <<EOF\ngit push -f origin x\nEOF"), 'deny'), 'planted: a force push in a here-document fed to sh is refused');
ok(is(bash("bash -s <<'EOF'\nnode research/solver/experiment.mjs flex t 6 30 7001 7002\nEOF"), 'deny'), 'planted: a launch in a here-document fed to bash -s is refused');
ok(is(bash("cat <<'EOF' | bash\ngit commit --no-verify -m x\nEOF"), 'deny'), 'planted: --no-verify in a here-document piped into bash is refused');
ok(is(bash("cat > /tmp/x.txt <<'EOF'\npkill -f node\nEOF"), null), 'a here-document written to a file is text, not a command');
ok(is(bash("python3 - <<'PY'\nprint('pkill -f node')\nPY"), null), 'a here-document fed to python is its program, not shell commands');
ok(shellHeredocs("bash <<'EOF'\necho hi\nEOF\ncat <<'X'\nno\nX").length === 1, 'only the here-document fed to a shell is taken as commands');

// the Phase 4 selection and the gate scripts are launches too (24 Sep, the plan-auditor)
for (const f of ['select-phase4.mjs one x', 'couple-gate.mjs', 'bridge-gate.mjs', 'seedcheck.mjs'])
  ok(is(bash(`node research/solver/${f}`), 'deny'), `planted: ${f.split(' ')[0]} run outside the launcher is refused`);
ok(is(bash('PREDICTION=none:x research/solver/run-from-snapshot.sh node research/solver/select-phase4.mjs one x'), null), 'the same selection through the launcher goes ahead');
ok(is(bash('node --check research/solver/select-phase4.mjs'), null), 'a syntax check of the selection script is not a launch');
ok(is(bash('grep -n tier research/solver/couple-gate.mjs'), null), 'reading a gate script is not a launch');

// the stop decision
const pass = { receipt: { verdict: 'PASS' } };
ok(!stop({ checkOk: true, checkOutput: '', review: pass, repeats: 0 }).block, 'a passing plan with a passing receipt may end the turn');
ok(stop({ checkOk: false, checkOutput: '[ledger] x', review: pass, repeats: 0 }).block, 'planted: a failing plan check blocks the end of the turn');
ok(stop({ checkOk: true, checkOutput: '', review: { receipt: null }, repeats: 0 }).block, 'planted: an unreviewed plan blocks the end of the turn');
ok(/FAILED/.test(stop({ checkOk: true, checkOutput: '', review: { receipt: { verdict: 'FAIL', findings: '1. x' } }, repeats: 0 }).reason), 'planted: a failed review blocks, with its findings');
const tired = stop({ checkOk: false, checkOutput: '[ledger] x', review: pass, repeats: MAX_REPEATS });
ok(!tired.block && /still failing/.test(tired.warn), `after ${MAX_REPEATS} blocks for the same reason the turn may end, with a warning to the maintainer`);

// a review of this exact version under way lets a turn end; its receipt still decides (maintainer, 24 Sep 12:05 UK)
const T0 = Date.parse('2026-09-24T11:00:00Z');
const started = mins => ({ receipt: null, pending: { at: new Date(T0 - mins * 60e3).toISOString(), reviewer: 'plan-auditor' } });
ok(!stop({ checkOk: true, checkOutput: '', review: started(5), repeats: 0, now: T0 }).block, 'a review of this version started 5 minutes ago lets the turn end');
ok(stop({ checkOk: true, checkOutput: '', review: started(PENDING_MINUTES + 1), repeats: 0, now: T0 }).block, `planted: a start that has not reported within ${PENDING_MINUTES} minutes blocks again`);
ok(/has not reported/.test(stop({ checkOk: true, checkOutput: '', review: started(PENDING_MINUTES + 1), repeats: 0, now: T0 }).reason), 'and says so');
ok(stop({ checkOk: false, checkOutput: '[ledger] x', review: started(5), repeats: 0, now: T0 }).block, 'planted: a failing plan check blocks even while a review runs');
ok(stop({ checkOk: true, checkOutput: '', review: { receipt: null, pending: { at: 'garbage' } }, repeats: 0, now: T0 }).block, 'planted: a start with no readable time does not let the turn end');
ok(stop({ checkOk: true, checkOutput: '', review: { ...started(-5) }, repeats: 0, now: T0 }).block, 'planted: a start dated in the future does not let the turn end');
ok(stop({ checkOk: true, checkOutput: '', review: { receipt: { verdict: 'FAIL', findings: '1. x' }, pending: null }, repeats: 0, now: T0 }).block, 'a failed receipt with no review under way still blocks');

// session start, as a process: the checklist comes back after a compaction
const out = execFileSync('bash', [join(ROOT, '.claude/hooks/session-start.sh')], { input: '{"source":"compact"}', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } }).toString();
ok(/COMPACTED/.test(out) && /1\. Before a run/.test(out) && /12\. Times in UK time/.test(out), 'after a compaction the session-start hook restates the whole checklist');
const out2 = execFileSync('bash', [join(ROOT, '.claude/hooks/session-start.sh')], { input: '{"source":"startup"}', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } }).toString();
ok(!/COMPACTED/.test(out2) && /1\. Before a run/.test(out2), 'at startup it states the checklist without the compaction warning');

console.log(`\n${n} passed`);
