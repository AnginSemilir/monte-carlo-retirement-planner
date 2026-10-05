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
import { statSync, openSync, readSync, closeSync, readdirSync } from 'node:fs';
import { relative, isAbsolute, resolve, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROTECTED = [
  '.claude/settings.json', '.claude/hooks/', '.claude/agents/plan-auditor.md', '.githooks/', '.github/workflows/plan-check.yml',
  'CLAUDE.md', 'research/solver/CHECKLIST.md', 'research/solver/check-plan.mjs', 'research/solver/check-prediction.mjs',
  'research/solver/fair-gate.mjs', 'research/solver/fair-variables.mjs', 'research/solver/code-id.mjs',
  'research/solver/run-from-snapshot.sh', 'research/solver/smoke.sh', 'research/solver/record-review.mjs',
  'research/solver/review-log.md', 'research/tests/plan-checker.test.mjs', 'research/tests/fair-gate.test.mjs',
  'research/tests/plan-defaults.test.mjs', 'research/tests/hooks.test.mjs',
  // the deep review's gate (RULES.md section 9; the maintainer's unlock of 26 Sep): its index, its reviewer, its receipts
  'research/solver/uncertainty.mjs', 'research/solver/record-deep-review.mjs', 'research/solver/deep-review-log.md', '.claude/agents/deep-reviewer.md',
  // the feedback loop (RULES.md section 10; the maintainer's unlock of 30 Sep): its codes and counts, their test, and the
  // skill, which the Edit tool could change while only the shell was refused
  'research/solver/triggers.mjs', 'research/tests/triggers.test.mjs', '.claude/skills/',
  // the deep reviews' causes, settled only by record-deep-review.mjs --settle quoting a registered result (the second
  // unlock of 5 Oct): a settlement written, changed or removed by hand would let the author score the reviews
  'research/solver/review-causes.md'
];
const isProtected = rel => PROTECTED.some(p => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

/* strip what a command says rather than does: here-document bodies, quoted strings and comments */
/* the here-documents of a command, read line by line: each opening line (`<<EOF`, `<<-'EOF'`, `<<"EOF"`, `<<\EOF`) with
   the text before and after its `<<` word, and its body up to the next line that is the delimiter alone. The next such
   line is found by lookup, so a text of many openings stays near-linear (the hundred-and-fourth review, BACKLOG 4: three
   lazy regexes took 11-13 s on 24,000 unterminated openings). An opening with no delimiter line after it is not a
   here-document, as before */
export function heredocs(raw) {
  const lines = raw.split('\n'), exactAt = new Map(), tabAt = new Map(), out = [];
  const add = (m, k, i) => { if (!m.has(k)) m.set(k, []); m.get(k).push(i); };
  lines.forEach((l, i) => { add(exactAt, l, i); add(tabAt, l.replace(/^\t+/, ''), i); });
  const next = (m, d, i) => { const a = m.get(d); if (!a) return -1; let lo = 0, hi = a.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] > i) hi = mid; else lo = mid + 1; } return lo < a.length ? a[lo] : -1; };
  // the delimiter as bash takes it: \WORD, 'WORD', "WORD" or a bare word of any characters but blanks and operators
  // (the hundred-and-fifth review, MINOR 2: <<'E-F' and <<EOF. were not found); `<<<` is a here-string, not an opening
  const OPEN = /(^|[^<])<<(-?)[ \t]*(?:\\([^\s'"<>|;&()]+)|'([^'\n]+)'|"([^"\n]+)"|([^\s'"<>|;&()]+))/;
  for (let i = 0; i < lines.length; i++) {
    const m = OPEN.exec(lines[i]);
    if (!m) continue;
    const d = m[3] ?? m[4] ?? m[5] ?? m[6], e = next(m[2] ? tabAt : exactAt, d, i);   // bash: the delimiter line alone, tabs only after <<-
    if (e < 0) continue;
    const at = m.index + m[1].length;
    out.push({ line: i, end: e, before: lines[i].slice(0, at), after: lines[i].slice(at + m[0].length - m[1].length), body: lines.slice(i + 1, e).join('\n') });
    i = e;
  }
  return out;
}
/* the text with each here-document's body and delimiter taken out, its opening kept as ` <<HEREDOC ` between the text
   before and after it (so `cat <<EOF && rm x` still shows the rm) */
export function stripHeredocs(raw) {
  const hs = heredocs(raw);
  if (!hs.length) return raw;
  const lines = raw.split('\n'), out = [];
  let k = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = hs[k];
    if (h && i === h.line) { out.push(`${h.before} <<HEREDOC ${h.after.replace(/(^|\s)#.*$/, '$1')}`); i = h.end; k++; continue; }
    out.push(lines[i]);
  }
  return out.join('\n');
}
/* quoted strings blanked to '' and "" in one pass; an unclosed quote leaves the rest as it is (the hundred-and-fifth
   review, MINOR 4: the double-quote pattern was quadratic on a run of unclosed quotes) */
export function blankQuotes(t) {
  let out = '', i = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === "'") { const e = t.indexOf("'", i + 1); if (e < 0) return out + t.slice(i); out += "''"; i = e + 1; continue; }
    if (c === '"') { let e = i + 1; while (e < t.length && t[e] !== '"') e += t[e] === '\\' ? 2 : 1; if (e >= t.length) return out + t.slice(i); out += '""'; i = e + 1; continue; }
    out += c; i++;
  }
  return out;
}
export function shellCode(cmd) {
  return stripHeredocs(cmd)
    .replace(/[\s\S]*/, blankQuotes)
    .replace(/(^|[\s;&|])#[^\n]*/g, '$1');
}

/*
 * WHAT WRITES A FILE (the maintainer, 26 Sep 18:02 UK: "Do all" - narrow the lock to actual writes). Until then a command
 * was refused when it named an enforcement file anywhere and held a write-looking word anywhere (python3, cp, ...), so
 * reading review-log.md in a script, or running check-plan.mjs beside an edit of PLAN.md, was refused (six times on 26 Sep).
 * Now a command is refused only where an enforcement file is a write TARGET: a redirect into it; the file argument of sed -i,
 * perl -i, tee, rm, unlink, truncate, chmod, chown, touch, shred, patch, mv (either end) or dd of=; the destination of cp,
 * install, ln or rsync; a path after git checkout, restore, rm or mv; or an inline python or node program (a here-document
 * fed to it, or its -c / -e text) that names the file and makes a write call. A relative target is refused by its file
 * name alone when that is a locked file's name, wherever the command has cd'd to (lockedNames; 27 Sep: `cd research/solver`
 * and then a write to 'uncertainty.mjs' got through). A program that builds the path from pieces, or
 * a script written to a file and then run, is not seen (RULES.md known limits 1 and 5).
 */
const ANY_ARG = /^(sed|perl|tee|rm|unlink|truncate|chmod|chown|touch|shred|patch|mv)$/, DEST_ARG = /^(cp|install|ln|rsync)$/;
const WRITE_CALL = /\bopen\s*\([^)]*,\s*(mode\s*=\s*)?['"]([wax]|r\+)|\.write_(text|bytes)\s*\(|\bshutil\.(copy\w*|move|rmtree)\s*\(|\bos\.(remove|unlink|rename|replace|truncate)\s*\(|\b(writeFileSync|appendFileSync|rmSync|unlinkSync|renameSync|copyFileSync|cpSync|truncateSync|writeFile|appendFile|createWriteStream)\s*\(/;
// the words of a part, quotes kept together and taken off
const words = part => [...part.matchAll(/'([^']*)'|"((?:\\.|[^"\\])*)"|(\S+)/g)].map(m => (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]));
// the bodies of here-documents fed to python or node, and their -c / -e programs
export function inlinePrograms(raw) {
  const out = [];
  for (const h of heredocs(raw)) if (/(^|[\s;&|(])(\S*\/)?(python3?|node)(\s+-\S*)*\s*(-\s*)?$/.test(h.before)) out.push(h.body);
  for (const m of raw.matchAll(/(?:^|[\s;&|(])(?:\S*\/)?(?:python3?\s+(?:-\w+\s+)*-c|node\s+(?:-\w+\s+)*(?:-e|--eval|-p|--print))\s+(?:'([^']*)'|"((?:\\.|[^"\\])*)")/g)) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}
// does a command write an enforcement file? `prot` says whether a path (or a folder holding one) is protected
export function writesProtected(raw, prot, lit = () => false) {
  const text = stripHeredocs(raw);
  for (const part of text.split(/&&|\|\||;|\||\n|\$\(|`|\(|\)|&/).map(x => x.trim()).filter(Boolean)) {
    const w = words(commandOf(part)), cmd = (w[0] || '').replace(/^.*\//, ''), args = w.slice(1), files = args.filter(a => !/^-/.test(a));
    if (cmd === 'sed' && !args.some(a => /^-[a-zA-Z]*i|^--in-place/.test(a))) continue;
    if (cmd === 'perl' && !args.some(a => /^-[a-zA-Z]*i/.test(a))) continue;
    if (ANY_ARG.test(cmd) && files.some(prot)) return true;
    if (DEST_ARG.test(cmd) && files.length && prot(files[files.length - 1])) return true;
    if (cmd === 'dd' && args.some(a => /^of=/.test(a) && prot(a.slice(3)))) return true;
    if (cmd === 'git') {   // git's own options first, -C <dir> and -c <key=value> with their values (git -C research/solver rm ...)
      const g = []; for (let k = 0; k < args.length; k++) { if (/^(-C|-c|--work-tree|--git-dir|--namespace)$/.test(args[k])) { k++; continue; } if (!/^-/.test(args[k])) g.push(args[k]); }
      if (/^(checkout|restore|rm|mv)$/.test(g[0] || '') && g.slice(1).some(prot)) return true;
    }
  }
  return inlinePrograms(raw).some(prog => WRITE_CALL.test(prog) && (PROTECTED.some(p => prog.includes(p.replace(/\/$/, ''))) || pathLiterals(prog).some(lit)));
}
// the quoted strings of a program that look like a path (27 Sep: `cd research/solver && python3 ... open('uncertainty.mjs','w')`
// named the locked file only relative to where the command ran, and got through)
export const pathLiterals = prog => [...prog.matchAll(/(['"`])([\w.~\/-]{1,300})\1/g)].map(m => m[2]);

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
   start with "<") ends it at once. A queued entry records no origin, so it can end an unlock but never start one; the
   same message absorbed mid-turn is recorded again as a queued_command attachment with its origin, and that record
   counts as delivered. */
export function unlockedFrom(transcriptText) {
  const lines = transcriptText.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let j; try { j = JSON.parse(lines[i]); } catch { continue; }
    if (j.type === 'queue-operation' && j.operation === 'enqueue' && typeof j.content === 'string' && !/^\s*</.test(j.content)) return false;
    // a message typed mid-turn and absorbed into the turn: the harness records it as a queued_command attachment carrying the
    // typist's origin (a task notice is recorded the same way with commandMode task-notification and no origin), so it
    // starts an unlock as a delivered message does and, like one, a later message ends it (the maintainer typed "unlock
    // enforcement" three times mid-turn on 25 Sep, 20:54, 21:12 and 21:17 UK, and the hook read each as queued)
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

/* the bodies of here-documents fed to a shell: `bash <<EOF`, `sh -s <<'EOF'`, `cat <<EOF | bash` */
export function shellHeredocs(raw) {
  const out = [];
  const SHELL = '(\\S*\\/)?(bash|sh|zsh|dash)(\\s+-[\\w-]+)*';
  for (const { before, after, body } of heredocs(raw)) {
    // only the last and first 400 characters: a shell word and its flags are short, and a long run of ( before it made
    // the test quadratic (the hundred-and-fifth review, MINOR 4: 280,000 ( took 42 s)
    if (new RegExp(`(^|[\\s;&|({])${SHELL}\\s*$`).test(before.slice(-400)) || new RegExp(`\\|\\s*${SHELL}\\s*($|[;&|)])`).test(after.slice(0, 400))) out.push(body);
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
      i += (valued && WRAPPERS[name].includes(valued[1])) || (name === 'env' && /^--(chdir|unset|split-string)$/.test(t[i])) ? 2 : 1;
    }
  }
  return t.slice(i).join(' ');
}

/* what follows `<cmd>` (at a command word anywhere in the part), or null: the rules below read their options there */
const after = (part, cmd) => {
  // the path before the command word is bounded, as in EXPERIMENT (a run of { made \S* quadratic: the hundred-and-fifth review)
  const m = new RegExp(`(^|[\\s{!])(\\S{0,1000}/)?${cmd}(?=\\s|$)`).exec(part);
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
  const text = stripHeredocs(raw);   // a here-document's body is data (a script's text), not a command
  for (const m of text.matchAll(re)) out.push(m[1] !== undefined ? m[1] : m[2].replace(/\\(.)/g, '$1'));
  return out;
}

// the scripts that run experiments: the solver's experiment script, the batches, the audits, the Phase 4 selection and
// the gate scripts (24 Sep, the plan-auditor: select-phase4.mjs and the gates ran directly were not seen)
const SCRIPTS = 'experiment\\.mjs|batch-[\\w.-]+\\.sh|audit-[\\w.-]+\\.mjs|select-phase4\\.mjs|couple-gate\\.mjs|bridge-gate\\.mjs|seedcheck\\.mjs';
const EXPERIMENT = new RegExp(`(^|[\\s{!])((\\S{0,1000}\\/)?(node|bash|sh|zsh|dash|source|\\.)((?:\\s+-\\S+)*)\\s+)?(\\S{0,1000}\\/)?(${SCRIPTS})(?=\\s|$)(\\s+(\\S+))?`);
const SCRIPT_WORD = new RegExp(`^(\\S*\\/)?(${SCRIPTS})$`);

/* the file names of the enforcement: every locked file's own name, and the names of the files in a locked folder today.
   A relative path can only reach a locked file through a name that ends in the file's own name, wherever the command has
   cd'd to (by cd, pushd, git -C, env --chdir, a wrapper, a loop, a subshell or "$(...)"), so a relative write target is
   judged by its name alone and no directory is followed (the hundred-and-fourth review: following directory changes
   missed some and allowed 2,728 commands d62f947 refused; this reading needs no list of places and runs in one pass) */
export function lockedNames(root) {
  const names = new Set(PROTECTED.filter(p => !p.endsWith('/')).map(p => p.split('/').pop()));
  for (const d of PROTECTED.filter(p => p.endsWith('/'))) { try { for (const f of readdirSync(join(root, d))) names.add(f); } catch { /* no folder */ } }
  return names;
}
export const lockedDirNames = () => new Set(PROTECTED.flatMap(p => p.replace(/\/$/, '').split('/').slice(0, -1).concat(p.endsWith('/') ? [p.replace(/\/$/, '').split('/').pop()] : [])));
export function decide(input, { root = process.cwd(), cwd = root, names = lockedNames(root), dirNames = lockedDirNames(), tracked = () => false, unlocked = false, depth = 0 } = {}) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const rel = f => { const abs = isAbsolute(f) ? f : resolve(root, f); return relative(root, abs).split('\\').join('/'); };
  // a path an edit could reach: an absolute one exactly; a relative one by its file name (see lockedNames), and exactly
  // from the root and the session's working directory
  const relOf = f => relative(root, isAbsolute(f) ? f : resolve(root, f)).split('\\').join('/');
  const home = process.env.HOME || '/root', expand = f => f.replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, home);
  const named = f => { f = expand(f); return !isAbsolute(f) && names.has(posix.normalize(f.replace(/\\/g, '/')).split('/').pop()); };
  // a relative target that is a folder the command could be standing in or near: `.`, `..`, a trailing slash, or the name
  // of a folder on a locked path (cp x . inside research/solver; rm -rf hooks inside .claude: the hundred-and-fifth
  // review, MINOR 1). Refused while locked for a writing command's target; the cost is in RULES.md known limit 1
  const folderish = f => { f = expand(f); if (isAbsolute(f)) return false; const n = posix.normalize(f.replace(/\\/g, '/')); return n === '.' || n === '..' || /\/$/.test(f) || n.startsWith('../') && n.split('/').every(x => x === '..' || x === '') || dirNames.has(n.split('/').pop()); };
  const exact = f => { f = expand(f); return [relOf(f), relative(root, isAbsolute(f) ? f : resolve(cwd, f)).split('\\').join('/')]; };
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
    const d = decide({ tool_name: 'Bash', tool_input: { command: inner } }, { root, cwd, names, dirNames, tracked, unlocked, depth: depth + 1 });
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
  // a target ends at a closing parenthesis too: `(cd .claude/hooks && echo x > pre-tool.mjs)` (the fuzz of 27 Sep)
  const redirect = [...code.matchAll(/>>?\s*([^\s;&|()]+)/g)].map(m => m[1]).filter(t => !/^&?\d$/.test(t) && t !== '/dev/null');
  if (redirect.some(t => named(t) || exact(t).some(isProtected))) return unlocked ? null : deny(LOCKED('The file this redirects into'));
  // a path, or a folder that holds an enforcement file (cp x .claude/hooks)
  const prot = t => named(t) || folderish(t) || exact(t).some(x => { const r = x.replace(/\/$/, ''); return isProtected(r) || PROTECTED.some(p => p.startsWith(r + '/')); });
  // a program's quoted string counts only when it is an enforcement file itself (a folder such as 'research/solver' is not)
  const lit = t => named(t) || exact(t).some(isProtected);
  if (writesProtected(raw, prot, lit)) return unlocked ? null : deny(LOCKED('This command writes an enforcement file, which'));
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
    const d = decide(input, { root, cwd: input.cwd || root, tracked, unlocked });
    if (d) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: d.decision, permissionDecisionReason: d.reason } }));
    process.exit(0);
  });
}
