/*
 * BEFORE A TURN MAY END (research/solver/RULES.md, layer 3). Two conditions, both about the plan as it stands:
 *   1. check-plan.mjs passes;
 *   2. the plan-auditor has a PASS receipt for this exact version of PLAN.md (review-log.md) - or a review of this exact
 *      version started within the last 30 minutes and has not reported yet (the reviewer's first step is
 *      `record-review.mjs --start`). Nothing gets past unreviewed: the receipt is still needed, and a start that does not
 *      report within 30 minutes blocks again (maintainer, 24 Sep 12:05 UK: three identical blocks at every turn end
 *      while a review ran were noise, not rigour).
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
export const PENDING_MINUTES = 30;

// a deep reviewer is at work when deep-review-log.md's newest "- started <iso>" line is under PENDING_MINUTES old and no
// receipt ("... UK | covered ...") follows it
export function deepRunning(log, now = Date.now()) {
  const lines = String(log || '').split('\n');
  let at = -1;
  lines.forEach((l, i) => { if (/^- started \S+/.test(l)) at = i; });
  if (at < 0) return false;
  const t = Date.parse(/^- started (\S+)/.exec(lines[at])[1]);
  return Number.isFinite(t) && now - t >= 0 && now - t < PENDING_MINUTES * 60e3 && !lines.slice(at + 1).some(l => / UK \| covered /.test(l));
}

export function decide({ checkOk, checkOutput, review, repeats, now = Date.now(), deep = null }) {
  const reasons = [];
  if (!checkOk) reasons.push(`The plan check fails - fix it before ending the turn:\n${checkOutput.trim()}`);
  const startedAt = review && review.pending && review.pending.at ? Date.parse(review.pending.at) : NaN;
  const running = Number.isFinite(startedAt) && now - startedAt >= 0 && now - startedAt < PENDING_MINUTES * 60e3;
  if (running) { /* a review of this exact version is under way: its receipt will decide */ }
  else if (!review || !review.receipt || review.pending) reasons.push(`PLAN.md has changed since its last review${review && review.pending ? ` (a review of it started ${review.pending.at} and has not reported within ${PENDING_MINUTES} minutes)` : ''}. Run the plan-auditor agent (Agent tool, subagent_type "plan-auditor") on the change; it records its receipt with record-review.mjs.`);
  else if (review.receipt.verdict !== 'PASS') reasons.push(`The plan-auditor's last review FAILED:\n  ${review.receipt.findings}\nFix the findings, then run the plan-auditor again.`);
  // the deep review, paced by uncertainty (RULES.md section 9; the maintainer, 26 Sep): due by uncertainty.mjs, and no deep
  // reviewer at work (one started within PENDING_MINUTES reports in deep-review-log.md)
  if (deep && deep.due && !deep.running) reasons.push(`A deep review is due (${deep.summary}). Run the deep-reviewer agent (Agent tool, subagent_type "deep-reviewer"); it appends its receipt to research/solver/deep-review-log.md.`);
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
    // the deep review: uncertainty.mjs --due exits 1 when one is due; a "started" line in deep-review-log.md within
    // PENDING_MINUTES means a deep reviewer is at work
    let deep = null;
    try { execFileSync('node', [join(root, 'research/solver/uncertainty.mjs'), '--due'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 }); deep = { due: false }; }
    catch (e) { const out = String(e.stdout || ''); if (/DEEP REVIEW DUE/.test(out)) { let log = ''; try { log = readFileSync(join(root, 'research/solver/deep-review-log.md'), 'utf8'); } catch { /* no log */ } deep = { due: true, running: deepRunning(log), summary: out.trim() }; } }
    // how many times in a row this same reason has blocked this session
    const state = join(tmpdir(), `plan-stop-${String(input.session_id || 'x').replace(/\W/g, '')}.json`);
    let prev = {};
    try { prev = JSON.parse(readFileSync(state, 'utf8')); } catch { /* first time */ }
    const first = decide({ checkOk, checkOutput, review, repeats: 0, deep });
    const repeats = first.block && input.stop_hook_active && prev.reason === first.reason ? (prev.repeats || 0) + 1 : 0;
    const d = repeats ? decide({ checkOk, checkOutput, review, repeats, deep }) : first;
    try { writeFileSync(state, JSON.stringify(first.block ? { reason: first.reason, repeats } : {})); } catch { /* best effort */ }
    if (d.block) process.stdout.write(JSON.stringify({ decision: 'block', reason: d.reason }));
    else if (d.warn) process.stdout.write(JSON.stringify({ systemMessage: d.warn }));
    process.exit(0);
  });
}
