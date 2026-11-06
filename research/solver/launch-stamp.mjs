/*
 * THE CODE A RESULT RAN ON (Phase 12 item 5; research/solver/launch-ready.mjs). The readiness checklist reads results files "on
 * the release commit", and the results are committed after the runs, so a file names the code it ran on by a stamp of the files
 * that make the site, not by a commit: the same stamp on the release commit means the same code, whatever results and records
 * were committed beside it. The stamp is the SHA-256 (first 16 hex digits) of every tracked or new file under src/ and public/
 * and of index.html, vite.config.js, the vite plugins, package.json and package-lock.json, each by its path and git's hash of its
 * content as it is on disk (so a run on uncommitted changes stamps those changes).
 *   node research/solver/launch-stamp.mjs [commit]  prints the stamp of the working tree, or of a commit's tree
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const STAMPED = ['src', 'public', 'index.html', 'vite.config.js', 'vite-plugin-inline-edit.js', 'vite-plugin-solver-code.js', 'package.json', 'package-lock.json'];
export function stamp(root = ROOT) {
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', ...STAMPED], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean).sort();
  const hashes = execFileSync('git', ['hash-object', '--', ...files], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  const h = createHash('sha256');
  files.forEach((f, i) => h.update(`${f} ${hashes[i]}\n`));
  return `code-stamp:${h.digest('hex').slice(0, 16)}`;
}
// the stamp of a commit's code, from its tree: the same as stamp() on a checkout of it with nothing changed
export function stampAt(root, sha) {
  const out = execFileSync('git', ['ls-tree', '-r', sha, '--', ...STAMPED], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
    .map(l => { const [meta, path] = l.split('\t'); return [path, meta.split(' ')[2]]; }).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const h = createHash('sha256');
  for (const [f, blob] of out) h.update(`${f} ${blob}\n`);
  return `code-stamp:${h.digest('hex').slice(0, 16)}`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(process.argv[2] ? stampAt(ROOT, process.argv[2]) : stamp());
