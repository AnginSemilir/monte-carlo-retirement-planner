/*
 * THE CODE THAT MADE A RESULT (RULES.md, variable 28). A hash of every file whose change can move a number - the
 * solver, the engine slice, the library, the experiment script and the result recorder - plus the git commit where
 * there is one (a snapshot has none). Two result files with the same hash were made by the same code. The hand-set
 * SOLVER_VERSION tag was not bumped between 21 and 24 Sep, through the M17 fix and F1, so it proves nothing alone.
 *
 *   node research/solver/code-id.mjs          prints the hash of the tree it sits in
 *   node research/solver/code-id.mjs --smoke  prints the smoke stamp's hash (below)
 *
 * Shared by experiment.mjs (stamped into every result file), run-from-snapshot.sh (the smoke stamp) and fair-gate.mjs.
 *
 * THE SMOKE STAMP hashes more: every script a batch runs (the audits, the Phase 4 selection, the gate scripts, and any
 * research/solver script a batch-*.sh names), the modules they import from outside those - settings.mjs (every
 * experiment.mjs run checks its settings with it) and this file - and smoke.sh itself, so an edit to any of them re-runs
 * the smoke test (24 Sep: the audit's ids-mode bug sat in a file the code hash left out; settings.mjs and code-id.mjs
 * were outside the stamp until the maintainer's unlock at 13:44 UK). It is kept apart from the code hash so the
 * result files' identity (fair-gate's MIXED CODE check) does not move when only an audit script changes.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function codeFiles(root = ROOT) {
  return ['research/engine.mjs', 'research/solver/experiment.mjs', 'research/solver/record.mjs', 'research/policy-study/scenarios.mjs',
    ...readdirSync(join(root, 'src/solver')).filter(f => f.endsWith('.js')).sort().map(f => `src/solver/${f}`)];
}

export function codeId(root = ROOT) {
  try {
    const h = createHash('sha256');
    for (const f of codeFiles(root)) h.update(f).update(readFileSync(join(root, f)));
    let commit = null;
    try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* a snapshot has no .git */ }
    return { hash: h.digest('hex').slice(0, 12), commit };
  } catch { return null; }
}

export function smokeFiles(root = ROOT) {
  const dir = join(root, 'research/solver');
  const all = readdirSync(dir);
  const named = new Set();
  for (const b of all.filter(f => /^batch-.+\.sh$/.test(f)))
    for (const m of readFileSync(join(dir, b), 'utf8').matchAll(/research\/solver\/([\w.-]+\.mjs)/g)) named.add(m[1]);
  const run = all.filter(f => /^audit-.+\.mjs$/.test(f) || /^(select-phase4|couple-gate|bridge-gate|seedcheck)\.mjs$/.test(f) || named.has(f));
  return [...new Set([...codeFiles(root), ...run.sort().map(f => `research/solver/${f}`), 'research/solver/settings.mjs', 'research/solver/code-id.mjs', 'research/solver/smoke.sh'])];
}

export function smokeId(root = ROOT) {
  try {
    const h = createHash('sha256');
    for (const f of smokeFiles(root)) h.update(f).update(readFileSync(join(root, f)));
    return h.digest('hex').slice(0, 12);
  } catch { return null; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const smoke = process.argv.includes('--smoke');
  const root = process.argv.slice(2).find(a => !a.startsWith('--')) || ROOT;
  const id = smoke ? smokeId(root) : codeId(root)?.hash;
  if (!id) { console.error('code-id: could not hash the code files'); process.exit(1); }
  console.log(id);
}
