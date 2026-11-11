// The repository's root: REPO_ROOT if set (a scratch copy with a prototype applied), else the first folder above this file
// that holds research/build-engine.py. Run `python3 research/build-engine.py` there once before any script.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export function repoRoot(from) {
  if (process.env.REPO_ROOT) return process.env.REPO_ROOT.replace(/\/$/, '');
  let d = dirname(fileURLToPath(from));
  for (let i = 0; i < 10; i++) { if (existsSync(join(d, 'research', 'build-engine.py'))) return d; d = dirname(d); }
  throw new Error('repository root not found above this script: set REPO_ROOT');
}
