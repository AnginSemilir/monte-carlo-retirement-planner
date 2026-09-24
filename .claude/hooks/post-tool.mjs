/*
 * AFTER A TOOL RUNS (research/solver/RULES.md, layer 3). Fast feedback, never a block (a PostToolUse hook cannot undo
 * anything): after an edit that touches the plan, its rules or a prediction - through Edit/Write or through the shell -
 * the plan check runs and any failure is handed straight back to Claude. After an edit to the solver or the experiment
 * script, a reminder that the launcher will smoke-test the new code before any batch. The Stop hook is the gate.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

let s = '';
process.stdin.on('data', d => { s += d; }).on('end', () => {
  let input = {};
  try { input = JSON.parse(s); } catch { process.exit(0); }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const ti = input.tool_input || {};
  const target = `${ti.file_path || ''} ${ti.command || ''}`;
  const notes = [];
  if (/research\/solver\/(PLAN|RULES|CHECKLIST)\.md|research\/solver\/predictions\//.test(target)) {
    try { execFileSync('node', [join(root, 'research/solver/check-plan.mjs')], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }); }
    catch (e) { notes.push(`PLAN CHECK after this change:\n${String(e.stdout || e.message).trim()}`); }
  }
  if (/src\/solver\/[\w-]+\.js|research\/solver\/experiment\.mjs|research\/engine\.mjs/.test(target) && /^(Edit|Write|MultiEdit)$/.test(input.tool_name || '')) {
    notes.push('Solver or experiment code changed: re-test every caller of what changed (checklist 7); the launcher will run smoke.sh on this code before any batch.');
  }
  if (notes.length) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: notes.join('\n\n') } }));
  process.exit(0);
});
