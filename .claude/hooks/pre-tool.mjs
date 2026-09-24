/*
 * BEFORE A TOOL RUNS (research/solver/RULES.md, layer 3). Reads Claude Code's PreToolUse input on stdin and either says
 * nothing (the call goes ahead), asks the maintainer, or refuses with a reason Claude sees.
 *
 * ASK - an edit to the enforcement itself: the checkers, the hooks, the launcher, the smoke run, the tests that pin
 *   them, the review log, CLAUDE.md, the checklist, or a registered (committed) prediction. A research agent once edited
 *   its own time limit rather than speed up (Sakana's AI Scientist); the checks are only worth something if the agent
 *   they check cannot quietly change them. Edits made through Bash (sed -i, >, tee, mv, cp, rm, an inline script) count.
 * DENY - killing processes by pattern (`pkill -f` matched its own command twice on 24 Sep); committing with
 *   --no-verify; unsetting or redirecting core.hooksPath; removing the experiment lock; a plain force push; and launching
 *   an experiment (experiment.mjs, a batch-*.sh, an audit-*.mjs run) outside run-from-snapshot.sh, which is where the
 *   prediction gate, the smoke run, the lock and the run log live.
 *
 * decide() is pure so research/tests/hooks.test.mjs can drive it; the bottom of the file is the hook itself.
 */
import { execSync } from 'node:child_process';
import { relative, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROTECTED = [
  '.claude/settings.json', '.claude/hooks/', '.claude/agents/plan-auditor.md', '.githooks/', '.github/workflows/plan-check.yml',
  'CLAUDE.md', 'research/solver/CHECKLIST.md', 'research/solver/check-plan.mjs', 'research/solver/check-prediction.mjs',
  'research/solver/fair-gate.mjs', 'research/solver/fair-variables.mjs', 'research/solver/code-id.mjs',
  'research/solver/run-from-snapshot.sh', 'research/solver/smoke.sh', 'research/solver/record-review.mjs',
  'research/solver/review-log.md', 'research/tests/plan-checker.test.mjs', 'research/tests/fair-gate.test.mjs',
  'research/tests/plan-defaults.test.mjs', 'research/tests/hooks.test.mjs'
];
const isProtected = rel => PROTECTED.some(p => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

/* strip what a command says rather than does: quoted strings and here-document bodies */
export function shellCode(cmd) {
  return cmd
    .replace(/<<-?\s*'?"?(\w+)'?"?[^\n]*\n[\s\S]*?\n\s*\1\b/g, ' <<HEREDOC ')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

const WRITE_VERB = /(^|[\s;&|(])(sed\s+(-[a-zA-Z]*\s+)*-i|perl\s+-[a-zA-Z]*i|tee\b|mv\b|cp\b|rm\b|truncate\b|chmod\b|ln\b|install\b|dd\b|git\s+(checkout|restore)\b|python3?\s|node\s+(-e|--eval|--input-type|-)\b)/;

export function decide(input, { root = process.cwd(), tracked = () => false } = {}) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const rel = f => { const abs = isAbsolute(f) ? f : resolve(root, f); return relative(root, abs).split('\\').join('/'); };
  const deny = reason => ({ decision: 'deny', reason });
  const ask = reason => ({ decision: 'ask', reason });

  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const f = rel(ti.file_path || ti.notebook_path || '');
    if (isProtected(f)) return ask(`${f} is part of the rules' enforcement (RULES.md). Changing it needs the maintainer's approval: say what is wrong with the check and why the change does not weaken it.`);
    if (/^research\/solver\/predictions\/.+\.md$/.test(f) && tracked(f)) return ask(`${f} is a registered prediction. A change after it was pushed is declared under "Changes after seeing results" (RULES.md rule 11); results already made under it will show PREDICTION EDITED.`);
    return null;
  }
  if (tool !== 'Bash') return null;
  const raw = String(ti.command || '');
  const code = shellCode(raw);

  if (/(^|[\s;&|(])(pkill\s+(-\w+\s+)*-f|pkill\s+-f|killall)\b/.test(code)) return deny('Killing by pattern is refused (it matched its own command twice on 24 Sep). Stop a background job by its task ID, or kill the PID from the lock file / `ps` output.');
  if (/\bgit\s+commit\b/.test(code) && /(\s--no-verify\b|\s-[a-zA-Z]*n[a-zA-Z]*\b)/.test(code.replace(/\s-m\s*''|\s-m\s*""/g, ' '))) return deny('Committing with --no-verify skips the pre-commit plan check. Fix what it reports instead.');
  if (/core\.hooksPath/.test(code) && !/core\.hooksPath\s+\.githooks\b/.test(code) && !/--get\b/.test(code)) return deny('core.hooksPath stays .githooks: it is how the pre-commit plan check runs.');
  if (/\brm\b[^;&|]*solver-experiment[^;&|\s]*\.lock/.test(code)) return deny('Removing the experiment lock is refused: run-from-snapshot.sh decides staleness from the recorded PID (its header says why).');
  if (/\bgit\s+push\b/.test(code) && /(\s--force(?!-with-lease)\b|\s-f\b)/.test(code)) return deny('A plain force push is refused. Use --force-with-lease only where the session rules allow it.');

  const launch = /(^|[\s;&|(])(node|bash|sh)\s+(\S*\/)?(experiment\.mjs|batch-[\w.-]+\.sh|audit-[\w.-]+\.mjs)\b(\s+(\S+))?/.exec(code);
  if (launch && !/run-from-snapshot\.sh/.test(code) && !/--check\b|\s-n\s/.test(code)) {
    const script = launch[4], arg = launch[6] || '';
    const cheap = (script === 'experiment.mjs' && /^(select|reduce)$/.test(arg)) || (/^audit-/.test(script) && arg === 'scan');
    if (!cheap) return deny(`${script} is an experiment: launch it through the launcher, which checks the registered prediction, runs the smoke test, takes the lock and logs the run:\n  PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh ${launch[2]} ${launch[0].trim().split(/\s+/).slice(1).join(' ')}\n(or PREDICTION="none:<why this is a measurement>"; LANE=light for one single-process job beside a running batch).`);
  }

  // an edit to the enforcement made through the shell
  const redirect = [...code.matchAll(/>>?\s*([^\s;&|]+)/g)].map(m => m[1]).filter(t => !/^&?\d$/.test(t) && t !== '/dev/null');
  if (redirect.some(t => isProtected(rel(t)))) return ask('This redirects output into a file that is part of the rules\' enforcement. That needs the maintainer\'s approval.');
  const mentioned = PROTECTED.filter(p => raw.includes(p.replace(/\/$/, '')));
  if (mentioned.length && WRITE_VERB.test(code)) return ask(`This command may change ${mentioned.join(', ')}, part of the rules' enforcement. That needs the maintainer's approval.`);
  return null;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let s = '';
  process.stdin.on('data', d => { s += d; }).on('end', () => {
    let input = {};
    try { input = JSON.parse(s); } catch { process.exit(0); }
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const tracked = f => { try { execSync(`git ls-files --error-unmatch "${f}"`, { cwd: root, stdio: 'ignore' }); return true; } catch { return false; } };
    const d = decide(input, { root, tracked });
    if (d) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: d.decision, permissionDecisionReason: d.reason } }));
    process.exit(0);
  });
}
