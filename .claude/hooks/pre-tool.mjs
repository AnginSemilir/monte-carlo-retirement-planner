/*
 * BEFORE A TOOL RUNS (research/solver/RULES.md, layer 3). Reads Claude Code's PreToolUse input on stdin and either says
 * nothing (the call goes ahead), asks the maintainer, or refuses with a reason Claude sees.
 *
 * DENY UNLESS THE MAINTAINER UNLOCKS IT - an edit to the enforcement itself: the checkers, the hooks, the launcher, the
 *   smoke run, the tests that pin them, the review log, CLAUDE.md, the checklist. A research agent once edited its own
 *   time limit rather than speed up (Sakana's AI Scientist); the checks are only worth something if the agent they check
 *   cannot quietly change them. Edits made through Bash (sed -i, >, tee, mv, cp, rm, an inline script) count. The first
 *   version said "ask", and in auto mode an ask is approved without the maintainer seeing it (24 Sep), so it is now a
 *   refusal that only the maintainer's own latest message can lift: the words "unlock enforcement" in a message they
 *   typed (origin human in the session transcript; a subagent's report or a tool result never counts). The lock returns
 *   as soon as they type anything else - a message still queued behind the turn counts, not only a delivered one
 *   (24 Sep: an unlock stayed open for the rest of a turn after their next message was typed).
 * ASK - an edit to a registered (committed) prediction: legitimate before a run, and the prediction's hash in every
 *   result file (fair-gate: PREDICTION EDITED) is what enforces it after.
 * DENY - killing processes by pattern (`pkill -f` matched its own command twice on 24 Sep); committing with
 *   --no-verify; unsetting or redirecting core.hooksPath; removing the experiment lock; a plain force push; and launching
 *   an experiment (experiment.mjs, a batch-*.sh, an audit-*.mjs, select-phase4.mjs or a gate script run: SCRIPTS below)
 *   outside run-from-snapshot.sh, which is where the prediction gate, the smoke run, the lock and the run log live.
 *
 * Each part of a command (split at && || ; | & newlines and substitutions) is judged on its own, so nothing elsewhere in
 * a line exempts a part; and each rule looks for its command anywhere in the part, past variables and wrappers in front
 * of it (FOO=1, timeout 5, xargs, sudo), inside `bash -c '...'` and `eval '...'`, and in a here-document fed to a shell
 * (`bash <<EOF`, `cat <<EOF | sh`). It is a guardrail, not a sandbox. Not seen here: a program that runs a command
 * itself (a node or python script calling a shell), a string piped or here-string'd into a shell (`echo ... | bash`,
 * `bash <<< '...'`), a script written to a file and then run, and launches of scripts other than those listed in
 * EXPERIMENT below.
 *
 * decide() is pure so research/tests/hooks.test.mjs can drive it; the bottom of the file is the hook itself.
 */
import { execSync } from 'node:child_process';
import { statSync, openSync, readSync, closeSync } from 'node:fs';
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

/* strip what a command says rather than does: here-document bodies, quoted strings and comments */
const HEREDOC = /<<-?\s*'?"?(\w+)'?"?[^\n]*\n[\s\S]*?\n\s*\1\b/g;
export function shellCode(cmd) {
  return cmd
    .replace(HEREDOC, ' <<HEREDOC ')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/(^|[\s;&|])#[^\n]*/g, '$1');
}

const WRITE_VERB = /(^|[\s;&|(])(sed\s+(-[a-zA-Z]*\s+)*-i|perl\s+-[a-zA-Z]*i|tee\b|mv\b|cp\b|rm\b|truncate\b|chmod\b|ln\b|install\b|dd\b|git\s+(checkout|restore)\b|python3?\s|node\s+(-e|--eval|--input-type|-)\b)/;

/* the text of the maintainer's latest typed message, from the tail of the session transcript */
export function lastHumanText(transcriptText) {
  const lines = transcriptText.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let j; try { j = JSON.parse(lines[i]); } catch { continue; }
    if (j.type !== 'user' || !j.origin || j.origin.kind !== 'human' || j.isMeta || j.isCompactSummary) continue;
    const c = j.message && j.message.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c) && !c.some(x => x.type === 'tool_result')) return c.filter(x => x.type === 'text').map(x => x.text).join(' ');
  }
  return '';
}
export const UNLOCK = /\bunlock enforcement\b/i;

/* is the enforcement unlocked? Only by the maintainer's latest DELIVERED message saying so, and only until they type
   anything else: a queued message (an enqueue of plain text - the queue also carries agent and task notices, which
   start with "<") ends it at once. A queued entry records no origin, so it can end an unlock but never start one. */
export function unlockedFrom(transcriptText) {
  const lines = transcriptText.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let j; try { j = JSON.parse(lines[i]); } catch { continue; }
    if (j.type === 'queue-operation' && j.operation === 'enqueue' && typeof j.content === 'string' && !/^\s*</.test(j.content)) return false;
    if (j.type !== 'user' || !j.origin || j.origin.kind !== 'human' || j.isMeta || j.isCompactSummary) continue;
    const c = j.message && j.message.content;
    if (typeof c === 'string') return UNLOCK.test(c);
    if (Array.isArray(c) && !c.some(x => x.type === 'tool_result')) return UNLOCK.test(c.filter(x => x.type === 'text').map(x => x.text).join(' '));
  }
  return false;
}

/* the bodies of here-documents fed to a shell: `bash <<EOF`, `sh -s <<'EOF'`, `cat <<EOF | bash` */
export function shellHeredocs(raw) {
  const out = [];
  const re = /^([^\n]*?)<<-?[ \t]*(['"]?)(\w+)\2([^\n]*)\n([\s\S]*?)\n[ \t]*\3[ \t]*$/gm;
  const SHELL = '(\\S*\\/)?(bash|sh|zsh|dash)(\\s+-[\\w-]+)*';
  for (const m of raw.matchAll(re)) {
    const [, before, , , after, body] = m;
    if (new RegExp(`(^|[\\s;&|({])${SHELL}\\s*$`).test(before) || new RegExp(`\\|\\s*${SHELL}\\s*($|[;&|)])`).test(after)) out.push(body);
  }
  return out;
}

/* the parts of a command that run one after another, in a pipe, in the background or in a substitution */
export const segments = code => code.split(/&&|\|\||;|\||\n|\$\(|`|\(|\)|&/).map(x => x.trim()).filter(Boolean);

/* the command a part runs, past what only wraps it: `{`, `!`, variable assignments, and wrappers that run their
   arguments, with their options. Used only to EXEMPT (the launcher, a syntax check, a cheap mode), so a wrapper it does
   not know leaves the part judged as an experiment - it errs towards refusing */
const WRAPPERS = {   // wrapper -> its options that take the next word as their value
  sudo: 'ugphC', env: 'uCS', nohup: '', time: 'fo', command: '', exec: 'a', setsid: '', stdbuf: 'ioe', nice: 'n',
  ionice: 'cnp', timeout: 'sk', xargs: 'nILPdsEa', builtin: '', unbuffer: ''
};
export function commandOf(part) {
  const t = part.trim().split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < t.length) {
    const w = t[i], name = w.replace(/^.*\//, '');
    if (/^[{!]$/.test(w) || /^[A-Za-z_]\w*=/.test(w)) { i++; continue; }
    if (!(name in WRAPPERS)) break;
    i++;
    while (i < t.length && (/^-/.test(t[i]) || (name === 'timeout' && /^\d+(\.\d+)?[smhd]?$/.test(t[i])) || (name === 'env' && /^[A-Za-z_]\w*=/.test(t[i])))) {
      const valued = /^-([a-zA-Z])$/.exec(t[i]);
      i += valued && WRAPPERS[name].includes(valued[1]) ? 2 : 1;
    }
  }
  return t.slice(i).join(' ');
}

/* what follows `<cmd>` (at a command word anywhere in the part), or null: the rules below read their options there */
const after = (part, cmd) => {
  const m = new RegExp(`(^|[\\s{!])(\\S*/)?${cmd}(?=\\s|$)`).exec(part);
  return m ? part.slice(m.index + m[0].length) : null;
};
const gitSub = (part, sub) => {
  const rest = after(part, 'git');
  if (rest === null) return null;
  const m = new RegExp(`^\\s+((-C|-c)\\s+\\S+\\s+|--[\\w-]+(=\\S+)?\\s+)*${sub}(?=\\s|$)`).exec(rest);
  return m ? rest.slice(m[0].length) : null;
};

/* the bodies of `bash -c '...'`, `sh -c "..."` and `eval '...'`: their quotes hide a command, so each is judged too */
export function innerCommands(raw) {
  const out = [];
  const re = /(?:^|[\s;&|(`])(?:(?:bash|sh|zsh|dash)\s+(?:-\w+\s+)*-\w*c\w*|eval)\s+(?:'([^']*)'|"((?:\\.|[^"\\])*)")/g;
  const text = raw.replace(HEREDOC, ' <<HEREDOC ');   // a here-document's body is data (a script's text), not a command
  for (const m of text.matchAll(re)) out.push(m[1] !== undefined ? m[1] : m[2].replace(/\\(.)/g, '$1'));
  return out;
}

// the scripts that run experiments: the solver's experiment script, the batches, the audits, the Phase 4 selection and
// the gate scripts (24 Sep, the plan-auditor: select-phase4.mjs and the gates ran directly were not seen)
const SCRIPTS = 'experiment\\.mjs|batch-[\\w.-]+\\.sh|audit-[\\w.-]+\\.mjs|select-phase4\\.mjs|couple-gate\\.mjs|bridge-gate\\.mjs|seedcheck\\.mjs';
const EXPERIMENT = new RegExp(`(^|[\\s{!])((\\S*\\/)?(node|bash|sh|zsh|dash|source|\\.)((?:\\s+-\\S+)*)\\s+)?(\\S*\\/)?(${SCRIPTS})(?=\\s|$)(\\s+(\\S+))?`);
const SCRIPT_WORD = new RegExp(`^(\\S*\\/)?(${SCRIPTS})$`);

export function decide(input, { root = process.cwd(), tracked = () => false, unlocked = false, depth = 0 } = {}) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const rel = f => { const abs = isAbsolute(f) ? f : resolve(root, f); return relative(root, abs).split('\\').join('/'); };
  const deny = reason => ({ decision: 'deny', reason });
  const LOCKED = what => `${what} is part of the rules' enforcement (RULES.md) and is locked. Tell the maintainer what is wrong with the check and why the change does not weaken it; they unlock it by writing "unlock enforcement" in their next message.`;
  const ask = reason => ({ decision: 'ask', reason });

  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const f = rel(ti.file_path || ti.notebook_path || '');
    if (isProtected(f)) return unlocked ? null : deny(LOCKED(f));
    if (/^research\/solver\/predictions\/.+\.md$/.test(f) && tracked(f)) return ask(`${f} is a registered prediction. A change after it was pushed is declared under "Changes after seeing results" (RULES.md rule 11); results already made under it will show PREDICTION EDITED.`);
    return null;
  }
  if (tool !== 'Bash') return null;
  const raw = String(ti.command || '');
  const code = shellCode(raw);

  // a command hidden in bash -c '...', eval '...' or a here-document fed to a shell is judged as if typed
  if (depth < 3) for (const inner of [...innerCommands(raw), ...shellHeredocs(raw)]) {
    const d = decide({ tool_name: 'Bash', tool_input: { command: inner } }, { root, tracked, unlocked, depth: depth + 1 });
    if (d && d.decision === 'deny') return d;
  }

  const parts = segments(code);
  const FULL = /\s(-[a-zA-Z]*f[a-zA-Z]*|--full)(?=\s|$)/;
  const killByPattern = parts.some(x => { const r = after(x, 'pkill'); return r !== null && FULL.test(' ' + r); })
    || parts.some(x => after(x, 'killall') !== null)
    || (parts.some(x => { const r = after(x, 'pgrep'); return r !== null && FULL.test(' ' + r); }) && parts.some(x => after(x, 'kill') !== null));
  if (killByPattern) return deny('Killing by pattern is refused (it matched its own command twice on 24 Sep). Stop a background job by its task ID, or kill the PID from the lock file / `ps` output.');
  if (parts.some(x => { const r = gitSub(x, 'commit'); return r !== null && /(\s--no-verify\b|\s-[a-zA-Z]*n[a-zA-Z]*\b)/.test(' ' + r.replace(/(^|\s)-m\s*(''|"")/g, ' ')); }))
    return deny('Committing with --no-verify skips the pre-commit plan check. Fix what it reports instead.');
  if (parts.some(x => /core\.hooksPath/i.test(x) && !/core\.hooksPath\s+\.githooks(\s|$)/.test(x) && !/--get\b/.test(x))) return deny('core.hooksPath stays .githooks: it is how the pre-commit plan check runs.');
  if (parts.some(x => /\b(rm|unlink|mv|truncate)\b/.test(x) && /solver-experiment[^\s]*\.lock/.test(x))) return deny('Removing the experiment lock is refused: run-from-snapshot.sh decides staleness from the recorded PID (its header says why).');
  if (parts.some(x => { const r = gitSub(x, 'push'); return r !== null && /(\s--force(?!-with-lease)\b|\s-[a-zA-Z]*f[a-zA-Z]*\b|\s\+\S)/.test(' ' + r); }))
    return deny('A plain force push is refused. Use --force-with-lease only where the session rules allow it.');

  // an experiment launched outside the launcher - judged part by part, so a syntax check or a launcher call elsewhere in
  // the same command line exempts nothing (24 Sep: `bash -n smoke.sh && node ... audit-s126.mjs ids` got through)
  for (const x of parts) {
    const m = EXPERIMENT.exec(x);
    if (!m) continue;
    const interp = m[4], flags = (m[5] || '').trim().split(/\s+/).filter(Boolean), script = m[7], arg = m[9] || '';
    const w = commandOf(x).split(/\s+/);
    if (!interp && !SCRIPT_WORD.test(w[0])) continue;   // named, not run (cat, grep, git add ...)
    if (/^(\S*\/)?run-from-snapshot\.sh$/.test(w[0]) || (/^(bash|sh)$/.test(w[0]) && /^(\S*\/)?run-from-snapshot\.sh$/.test(w[1] || ''))) continue;
    if (/^(bash|sh|zsh|dash)$/.test(interp) && flags.some(f => /^-[a-zA-Z]*n[a-zA-Z]*$/.test(f))) continue;   // a syntax check runs nothing
    if (interp === 'node' && flags.some(f => f === '--check' || f === '-c')) continue;
    const cheap = (script === 'experiment.mjs' && /^(select|reduce|reduceFlex)$/.test(arg)) || (/^audit-/.test(script) && arg === 'scan');
    if (!cheap) return deny(`${script} is an experiment: launch it through the launcher, which checks the registered prediction, runs the smoke test, takes the lock and logs the run:\n  PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh ${m[0].trim()} ...\n(or PREDICTION="none:<why this is a measurement>"; LANE=light for one single-process job beside a running batch).`);
  }

  // an edit to the enforcement made through the shell
  const redirect = [...code.matchAll(/>>?\s*([^\s;&|]+)/g)].map(m => m[1]).filter(t => !/^&?\d$/.test(t) && t !== '/dev/null');
  if (redirect.some(t => isProtected(rel(t)))) return unlocked ? null : deny(LOCKED('The file this redirects into'));
  const mentioned = PROTECTED.filter(p => raw.includes(p.replace(/\/$/, '')));
  if (mentioned.length && WRITE_VERB.test(code)) return unlocked ? null : deny(LOCKED(`This command may change ${mentioned.join(', ')}, which`));
  return null;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let s = '';
  process.stdin.on('data', d => { s += d; }).on('end', () => {
    let input = {};
    try { input = JSON.parse(s); } catch { process.exit(0); }
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const tracked = f => { try { execSync(`git ls-files --error-unmatch "${f}"`, { cwd: root, stdio: 'ignore' }); return true; } catch { return false; } };
    // the maintainer's latest typed message, read from the tail of the transcript (it can run to hundreds of MB)
    let unlocked = false;
    try {
      const p = input.transcript_path, size = statSync(p).size, n = Math.min(size, 30e6), buf = Buffer.alloc(n), fd = openSync(p, 'r');
      readSync(fd, buf, 0, n, size - n); closeSync(fd);
      unlocked = unlockedFrom(buf.toString('utf8'));
    } catch { unlocked = false; }
    const d = decide(input, { root, tracked, unlocked });
    if (d) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: d.decision, permissionDecisionReason: d.reason } }));
    process.exit(0);
  });
}
