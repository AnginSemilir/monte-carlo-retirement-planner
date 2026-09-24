/*
 * THE CODE THAT MADE A RESULT (RULES.md, variable 28). A hash of every file whose change can move a number - the
 * solver, the engine slice, the library, the experiment script and the result recorder - plus the git commit where
 * there is one (a snapshot has none). Two result files with the same hash were made by the same code. The hand-set
 * SOLVER_VERSION tag was not bumped between 21 and 24 Sep, through the M17 fix and F1, so it proves nothing alone.
 *
 *   node research/solver/code-id.mjs          prints the hash of the tree it sits in
 *
 * Shared by experiment.mjs (stamped into every result file), run-from-snapshot.sh (the smoke stamp) and fair-gate.mjs.
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const id = codeId(process.argv[2] || ROOT);
  if (!id) { console.error('code-id: could not hash the code files'); process.exit(1); }
  console.log(id.hash);
}
