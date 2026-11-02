/*
 * THE SESSION START'S WATCHDOG (the launch plan of 1 Nov, step 0, B14): .claude/hooks/session-start.sh prints the
 * working branch's latest run of the full tier (.github/workflows/full.yml) and warns when it is red, or tested a commit
 * more than 24 hours older than the branch's head. Driven here with a stand-in `gh` on PATH answering from canned runs,
 * in a scratch repository whose two commits are 30 hours apart:
 *   a red run on the head warns; a green run on the old commit warns (stale); a green run on the head does not; no run
 *   warns; a run in progress on the head does not; a run on a commit this clone lacks is dated by its start, and warns
 *   when that is 30 hours before the head; gh failing says the tier is not readable and warns of nothing.
 * Planted: the hook as it was before the watchdog (git show 82e4ad6:.claude/hooks/session-start.sh) warns of nothing.
 *   node research/tests/watchdog.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const tmp = mkdtempSync(join(tmpdir(), 'watchdog-')), repo = join(tmp, 'repo'), bin = join(tmp, 'bin');
execFileSync('mkdir', ['-p', repo, bin]);
const git = (args, env = {}) => execFileSync('git', args, { cwd: repo, env: { ...process.env, ...env }, encoding: 'utf8' }).trim();
git(['init', '-q', '-b', 'work']);
const T0 = 1_790_000_000, T1 = T0 + 30 * 3600;
const at = t => ({ GIT_AUTHOR_DATE: `@${t} +0000`, GIT_COMMITTER_DATE: `@${t} +0000`, GIT_AUTHOR_NAME: 'x', GIT_AUTHOR_EMAIL: 'x@x', GIT_COMMITTER_NAME: 'x', GIT_COMMITTER_EMAIL: 'x@x' });
git(['commit', '-q', '--allow-empty', '-m', 'old'], at(T0)); const OLD = git(['rev-parse', 'HEAD']);
git(['commit', '-q', '--allow-empty', '-m', 'head'], at(T1)); const HEAD = git(['rev-parse', 'HEAD']);
// the stand-in gh: `run list --workflow full.yml ...` prints FAKE_FULL (or fails when it is FAIL); anything else fails
writeFileSync(join(bin, 'gh'), '#!/bin/sh\ncase "$*" in *"--workflow full.yml"*) [ "$FAKE_FULL" = FAIL ] && exit 1; printf "%s" "$FAKE_FULL"; exit 0;; esac\nexit 1\n');
chmodSync(join(bin, 'gh'), 0o755);

const iso = t => new Date(t * 1000).toISOString().replace('.000', '');
const run = (status, conclusion, sha, createdAt = iso(T1)) => JSON.stringify([{ status, conclusion, headSha: sha, createdAt }]);
const hook = script => full => execFileSync('bash', ['-c', script], { cwd: repo, input: '{}', encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDE_PROJECT_DIR: repo, FAKE_FULL: full } });
const now = hook(`bash ${join(ROOT, '.claude/hooks/session-start.sh')}`);
const warns = out => out.split('\n').filter(l => l.startsWith('WATCHDOG'));

const CASES = [
  ['a red run on the head', run('completed', 'failure', HEAD), w => w.length === 1 && /red/.test(w[0])],
  ['a green run on a commit 30 hours older than the head', run('completed', 'success', OLD, iso(T0)), w => w.length === 1 && /30\.0 hours older/.test(w[0])],
  ['a green run on the head', run('completed', 'success', HEAD), w => w.length === 0],
  ['no run on the branch', '[]', w => w.length === 1 && /no run/.test(w[0])],
  ['a run in progress on the head', run('in_progress', null, HEAD), w => w.length === 0],
  ['a green run on a commit this clone lacks, started 30 hours before the head', run('completed', 'success', 'f'.repeat(40), iso(T0)), w => w.length === 1 && /older/.test(w[0])]
];
for (const [name, full, want] of CASES) { const out = now(full), w = warns(out); ok(want(w) && /full tier (on|has no run on) work/.test(out), `${name}: ${w.length ? w.join(' / ') : 'no warning'}`); }
{ const out = now('FAIL'); ok(warns(out).length === 0 && /The full tier on work: not readable/.test(out), 'gh failing: the tier is not readable, and nothing is warned of'); }

// planted: the hook before the watchdog
const OLDHOOK = join(tmp, 'old-session-start.sh');
writeFileSync(OLDHOOK, execFileSync('git', ['show', '82e4ad6:.claude/hooks/session-start.sh'], { cwd: ROOT, encoding: 'utf8' }));
{ const w = warns(hook(`bash ${OLDHOOK}`)(CASES[0][1])); ok(!CASES[0][2](w), `planted, the hook before the watchdog on a red run: the check fails (${w.length} warnings)`); }

rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
