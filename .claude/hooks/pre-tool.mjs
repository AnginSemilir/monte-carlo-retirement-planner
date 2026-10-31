/*
 * BEFORE A TOOL RUNS (the external review of 21 Oct, Part B Step 3: "slim the hooks"). Reads Claude Code's PreToolUse
 * input on stdin and either says nothing (the call goes ahead) or refuses with a reason Claude sees. It refuses:
 *   - `--no-verify` on a git commit or push (the pre-commit hook runs the verification suite);
 *   - a force push (`--force-with-lease` is allowed);
 *   - killing processes by pattern (`pkill`, `killall`, `kill $(pgrep ...)`: a pattern once matched its own command);
 *   - a write to a protected file by its exact path, unless the maintainer's latest message says "unlock enforcement":
 *     the hooks and settings, the git hooks, CI, CLAUDE.md, the checklist, the launcher and the fair-test gate, the
 *     verification suite (research/tests/run-all.mjs and every test its FAST list names) and the archive.
 * It is a guardrail, not a sandbox, and it is not extended case by case: the guard against an agent editing its own
 * checks is outside the session, in CI on every push and in the maintainer's review of any diff to these paths.
 * decide() is pure so research/tests/hooks.test.mjs can drive it; the bottom of the file is the hook itself.
 */
import { statSync, openSync, readSync, closeSync, readFileSync } from 'node:fs';
import { relative, isAbsolute, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROTECTED = [
  '.claude/settings.json', '.claude/hooks/', '.githooks/', '.github/workflows/', 'CLAUDE.md',
  'research/solver/CHECKLIST.md', 'research/solver/run-from-snapshot.sh', 'research/solver/smoke.sh', 'research/solver/code-id.mjs',
  'research/solver/fair-gate.mjs', 'research/solver/fair-test.mjs', 'research/solver/fair-variables.mjs',
  'research/solver/check-prediction.mjs', 'research/solver/check-state.mjs', 'research/solver/archive/',
  'research/tests/run-all.mjs', 'research/tests/hooks.test.mjs', 'research/tests/fair-gate.test.mjs',
  'research/tests/plan-defaults.test.mjs', 'research/tests/check-state.test.mjs'
];
/* the verification suite's own files: run-all.mjs's FAST list, read from the file (a test added to it is protected) */
export function suiteFiles(root) {
  try {
    const m = /export const FAST = \[([\s\S]*?)\];/.exec(readFileSync(join(root, 'research/tests/run-all.mjs'), 'utf8'));
    return m ? [...m[1].matchAll(/'([\w.-]+\.test\.mjs)'/g)].map(x => `research/tests/${x[1]}`) : [];
  } catch { return []; }
}
const isProtected = (rel, extra = []) => [...PROTECTED, ...extra].some(p => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

/* is the enforcement unlocked? Only by the maintainer's latest message typed in the session (origin human; a subagent's
   report or a tool result never counts) saying "unlock enforcement", and only until they type anything else */
export const UNLOCK = /\bunlock enforcement\b/i;
export function unlockedFrom(transcriptText) {
  const lines = transcriptText.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let j; try { j = JSON.parse(lines[i]); } catch { continue; }
    if (j.type === 'queue-operation' && j.operation === 'enqueue' && typeof j.content === 'string' && !/^\s*</.test(j.content)) { if (/^\s*(?:unlock enforcement[\s.!]*)+$/i.test(j.content)) continue; return false; }
    if (j.type === 'attachment' && j.attachment && j.attachment.type === 'queued_command') {
      const a = j.attachment;
      if (a.commandMode === 'prompt' && a.origin && a.origin.kind === 'human' && typeof a.prompt === 'string') return UNLOCK.test(a.prompt);
      continue;
    }
    if (j.type !== 'user' || !j.origin || j.origin.kind !== 'human' || j.isMeta || j.isCompactSummary) continue;
    const c = j.message && j.message.content;
    if (typeof c === 'string') return UNLOCK.test(c);
    if (Array.isArray(c) && !c.some(x => x.type === 'tool_result')) return UNLOCK.test(c.filter(x => x.type === 'text').map(x => x.text).join(' '));
  }
  return false;
}

// the parts of a shell command, split at its operators (a guardrail's split, not a parser)
export const segments = cmd => String(cmd).split(/&&|\|\||;|\||\n/).map(x => x.trim()).filter(Boolean);
const WRITES = /(^|\s)(tee|mv|cp|rm|truncate|chmod|ln|install|rsync|dd)\s|(^|\s)sed\s+(-[a-zA-Z]*i|--in-place)|(^|\s)git\s+(mv|rm|checkout\s+\S*\s*--)\s|writeFileSync|appendFileSync|open\([^)]*['"]w/;

export function decide(input, { root = process.cwd(), unlocked = false, extra = suiteFiles(root) } = {}) {
  const deny = reason => ({ decision: 'deny', reason });
  const rel = p => { const a = isAbsolute(p) ? p : resolve(root, p); return relative(root, a).split('\\').join('/'); };
  const LOCKED = f => `${f} is protected (the verification suite, CI, the hooks or the archive): say what is wrong with it and ask the maintainer to unlock enforcement, or leave it`;
  const tool = input.tool_name || '', ti = input.tool_input || {};
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const f = rel(ti.file_path || ti.notebook_path || '');
    return isProtected(f, extra) && !unlocked ? deny(LOCKED(f)) : null;
  }
  if (tool !== 'Bash') return null;
  const cmd = String(ti.command || '');
  for (const part of segments(cmd)) {
    if (/\bgit\b.*\s--no-verify\b/.test(part) || /\bgit\s+commit\b.*\s-n\b/.test(part)) return deny('--no-verify skips the verification suite: fix what it found instead');
    if (/\bgit\s+push\b/.test(part) && (/\s--force(?!-with-lease)\b/.test(part) || /\s-f\b/.test(part) || /\s\+[\w./-]+/.test(part))) return deny('a force push rewrites what others may have; use --force-with-lease if it must be done');
    if (/(^|\s)(pkill|killall)\b/.test(part) || /\bkill\b.*\bpgrep\b/.test(cmd)) return deny('killing processes by pattern can match its own command: stop a task by its ID (TaskStop) or kill a recorded pid');
    if (/\bgit\s+config\b.*core\.hooksPath/.test(part) && !/core\.hooksPath\s+\.githooks(\s|$)/.test(part)) return deny('core.hooksPath switches off the pre-commit hook');
  }
  if (unlocked) return null;
  // a write to a protected file named by its path: a redirect into it, or a writing command in the same part
  const named = [...PROTECTED, ...extra];
  for (const part of segments(cmd)) {
    for (const m of part.matchAll(/(?:^|[^<>&\d])>{1,2}\s*([^\s;&|<>]+)/g)) { const f = rel(m[1].replace(/^['"]|['"]$/g, '')); if (isProtected(f, extra)) return deny(LOCKED(f)); }
    if (WRITES.test(part)) for (const p of named) if (part.includes(p.replace(/\/$/, ''))) return deny(LOCKED(p));
  }
  // a script handed to an interpreter (a heredoc, -c or -e) is not parsed across its lines: the check added for it on
  // 21 Oct was reverted on 22 Oct (the follow-up review, answer 5: it refused a harmless script, and no hook can parse
  // every way to write a file). A write made that way shows in protected-changes.mjs's list, which CI prints for every
  // push and the session start for the last day.
  return null;
}

/* the protected files among a list of repository paths (protected-changes.mjs; hooks.test.mjs) */
export function protectedAmong(files, root) {
  const extra = suiteFiles(root);
  return files.filter(f => isProtected(f, extra));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let s = '';
  process.stdin.on('data', d => { s += d; }).on('end', () => {
    let input = {};
    try { input = JSON.parse(s); } catch { process.exit(0); }
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    let unlocked = false;
    try {
      const p = input.transcript_path, size = statSync(p).size, n = Math.min(size, 30e6), buf = Buffer.alloc(n), fd = openSync(p, 'r');
      readSync(fd, buf, 0, n, size - n); closeSync(fd);
      unlocked = unlockedFrom(buf.toString('utf8'));
    } catch { unlocked = false; }
    const d = decide(input, { root, unlocked });
    if (d) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: d.decision, permissionDecisionReason: d.reason } }));
    process.exit(0);
  });
}
