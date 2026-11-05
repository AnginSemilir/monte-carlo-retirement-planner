/*
 * THE SOLVER'S CODE, AS THE STORED SOLVES' KEY (the launch plan's step P1 (g); F19, confirmed by
 * research/solver/results-cache-key.txt).
 *
 * A stored solve (src/solverCache.js) is kept for the code that solved it. That code was named by the solver worker's own
 * URL, which a build fingerprints with the worker's contents; the worker imports the whole of App.jsx for the engine, screens
 * included, so a change to any screen gave every stored solve a new key and each deploy threw them all away.
 *
 * This plugin, in the worker build only, names the code by its module graph instead: every module the solver worker reaches
 * from its entry, each by its path and the code the build compiled from it, with App.jsx counted by its engine slice (the lines
 * research/build-engine.py takes from it: after the lucide-react import, to its one `export {` line, its imports left out) and
 * what App.jsx imports not followed, since the engine slice imports nothing. It is the graph the build records, not a list, so
 * the worker, src/solverPool.js, the digest and the shims all count, and a module added to it counts the day it is added. The
 * key replaces the worker's one placeholder (src/solverWorker.js CODE); a build in which the placeholder is not found exactly
 * once stops, so a worker can never fall back to its URL unnoticed. Under `vite dev` nothing is bundled and the worker keeps
 * its URL, as before.
 *   research/tests/cache-key.test.mjs builds the site and checks: a screen change keeps the key; a change to the engine slice,
 *   and one to src/solverPool.js, each move it. CACHE_KEY_PLANT=url leaves the placeholder in (the URL fallback): it fails.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

export const PLACEHOLDER = '__SOLVER_CODE_KEY__';
const ENTRY = /[\\/]src[\\/]solverWorker\.js$/, APP = /[\\/]src[\\/]App\.jsx$/;
const sha = s => createHash('sha256').update(s).digest('hex');

/* App.jsx's engine slice, as research/build-engine.py takes it */
export function engineSlice(src) {
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith("} from 'lucide-react'")) + 1;
  const ends = lines.map((l, i) => (l.startsWith('export {') ? i : -1)).filter(i => i >= 0);
  if (start < 1 || ends.length !== 1) throw new Error(`solver-code: App.jsx's engine slice not found (the lucide-react import at ${start}, ${ends.length} lines starting "export {")`);
  return lines.slice(start, ends[0] + 1).filter(l => !l.startsWith('import ')).join('\n');
}

/* the key of a module graph: [{ id, code }] for every module, ids relative to the project's root */
export const keyOf = mods => `solver-code:${sha(mods.map(m => `${m.id}\n${sha(m.code)}\n`).sort().join('')).slice(0, 16)}`;

export default function solverCode({ root = process.cwd() } = {}) {
  return {
    name: 'solver-code',
    generateBundle(_, bundle) {
      const entry = this.getModuleIds ? [...this.getModuleIds()].find(id => ENTRY.test(id) && this.getModuleInfo(id).isEntry) : null;
      if (!entry) return;   // another worker's build (mcWorker, simWorker)
      const seen = new Set(), mods = [];
      const walk = id => {
        if (seen.has(id)) return;
        seen.add(id);
        const info = this.getModuleInfo(id);
        if (!info || info.isExternal) return;
        const name = id.startsWith('\0') ? id : relative(root, id).split('\\').join('/');
        if (APP.test(id)) { mods.push({ id: name, code: engineSlice(readFileSync(id, 'utf8')) }); return; }
        if (info.code == null) this.error(`solver-code: no code for ${name}`);
        mods.push({ id: name, code: info.code });
        for (const d of [...info.importedIds, ...info.dynamicallyImportedIds]) walk(d);
      };
      walk(entry);
      const key = keyOf(mods);
      const re = new RegExp(`(["'\`])${PLACEHOLDER}\\1`, 'g');
      let found = 0;
      for (const out of Object.values(bundle)) if (out.type === 'chunk') found += (out.code.match(re) || []).length;
      if (found !== 1) this.error(`solver-code: the worker's placeholder ${PLACEHOLDER} found ${found} times in its build, not once (src/solverWorker.js CODE)`);
      if (process.env.CACHE_KEY_PLANT === 'url') return;   // the plant: the placeholder left in, so the worker keys on its URL
      for (const out of Object.values(bundle)) if (out.type === 'chunk') out.code = out.code.replace(re, JSON.stringify(key));
    }
  };
}
