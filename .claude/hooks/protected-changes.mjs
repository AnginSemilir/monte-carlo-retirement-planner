/*
 * THE PROTECTED FILES A CHANGE TOUCHED (the follow-up review of 22 Oct, answer 5). The pre-tool hook refuses a write to a
 * protected file by its exact path and parses nothing further; this list is the check outside it. CI prints it for every
 * push and the session start for the last day, so the maintainer sees every change to the hooks, CI, CLAUDE.md, the
 * checklist, the launcher, the fair-test gate, the verification suite and the archive, however it was made.
 *   node .claude/hooks/protected-changes.mjs <git log range or options: a..b, -1, --since="24 hours ago">
 */
import { execFileSync } from 'node:child_process';
import { protectedAmong } from './pre-tool.mjs';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const log = execFileSync('git', ['log', '--format=@@%h %ad %s', '--date=format-local:%d %b %H:%M UK', '--name-only', ...process.argv.slice(2)],
  { cwd: root, encoding: 'utf8', env: { ...process.env, TZ: 'Europe/London' } });
let n = 0;
for (const block of log.split('@@').filter(b => b.trim())) {
  const [head, ...files] = block.split('\n').filter(Boolean);
  const hit = protectedAmong(files, root);
  if (hit.length) { n++; console.log(`${head.slice(0, 110)}\n  ${hit.join('\n  ')}`); }
}
if (!n) console.log('none');
