/*
 * BEFORE A TURN MAY END (research/solver/RULES.md, layer 3). Two conditions, both about the plan as it stands:
 *   1. check-plan.mjs passes;
 *   2. the plan-auditor has a PASS receipt for this exact version of PLAN.md (review-log.md).
 * Otherwise the turn is blocked and the reason goes back to Claude. Claude Code itself ends the turn after eight blocks
 * in a row, and this hook lets a turn end after three blocks for the SAME reason - with a warning to the maintainer - so
 * a check that only the maintainer can resolve does not burn the session; GitHub CI still stands behind it.
 *
 * decide() is pure for research/tests/hooks.test.mjs.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_REPEATS = 3;

export function decide({ checkOk, checkOutput, review, repeats }) {
  const reasons = [];
  if (!checkOk) reasons.push(`The plan check fails - fix it before ending the turn:\n${checkOutput.trim()}`);
  if (!review || !review.receipt) reasons.push('PLAN.md has changed since its last review. Run the plan-auditor agent (Agent tool, subagent_type "plan-auditor") on the change; it records its receipt with record-review.mjs.');
  else if (review.receipt.verdict !== 'PASS') reasons.push(`The plan-auditor's last review FAILED:\n  ${review.receipt.findings}\nFix the findings, then run the plan-auditor again.`);
  if (!reasons.length) return { block: false };
  const reason = reasons.join('\n\n');
  if (repeats >= MAX_REPEATS) return { block: false, warn: `Ending the turn with the rules' checks still failing (blocked ${repeats} times for the same reason):\n${reason}` };
  return { block: true, reason };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let s = '';
  process.stdin.on('data', d => { s += d; }).on('end', async () => {
    let input = {};
    try { input = JSON.parse(s); } catch { /* run anyway */ }
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    let checkOk = true, checkOutput = '';
    try { checkOutput = execFileSync('node', [join(root, 'research/solver/check-plan.mjs')], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 }).toString(); }
    catch (e) { checkOk = false; checkOutput = String(e.stdout || e.message); }
    let review = null;
    try { review = (await import(join(root, 'research/solver/record-review.mjs'))).status(); } catch { review = null; }
    // how many times in a row this same reason has blocked this session
    const state = join(tmpdir(), `plan-stop-${String(input.session_id || 'x').replace(/\W/g, '')}.json`);
    let prev = {};
    try { prev = JSON.parse(readFileSync(state, 'utf8')); } catch { /* first time */ }
    const first = decide({ checkOk, checkOutput, review, repeats: 0 });
    const repeats = first.block && input.stop_hook_active && prev.reason === first.reason ? (prev.repeats || 0) + 1 : 0;
    const d = repeats ? decide({ checkOk, checkOutput, review, repeats }) : first;
    try { writeFileSync(state, JSON.stringify(first.block ? { reason: first.reason, repeats } : {})); } catch { /* best effort */ }
    if (d.block) process.stdout.write(JSON.stringify({ decision: 'block', reason: d.reason }));
    else if (d.warn) process.stdout.write(JSON.stringify({ systemMessage: d.warn }));
    process.exit(0);
  });
}
