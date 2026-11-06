/*
 * AN OPTION'S VALUE READ ONLY WHEN THE OPTION IS THERE (Phase 12, found on the readiness checklist's full-scale run: 6 Nov).
 * The full tier. research/ui-harnesses/solver-fullscale-ui.cjs read `--parts` as args[args.indexOf('--parts') + 1]; with no
 * `--parts` that is args[-1 + 1], the first argument, the port: run as `solver-fullscale-ui.cjs 4173`, the page was told to
 * split the solve 4,173 ways and the browser gave out at part 2,710. The class: a script reading the word after an option at
 * the option's index plus one without checking the option was given (indexOf is -1, so it reads the first argument).
 *   1. the scan catches the class: the harness's line as it was, an inline read, and an index kept in a name and read
 *      unchecked; it passes the guarded forms the research scripts use (includes on the same line, the index checked
 *      against 0 or -1, a helper over a non-literal key);
 *   2. no research script (the archive, the results and the reviews left out) carries the class.
 * Shown failing on the code before the fix: check 2 on c48317d names solver-fullscale-ui.cjs.
 *   node research/tests/cli-options.test.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };

const SKIP = ['research/solver/archive', 'research/solver/results', 'research/reviews', 'research/policy-study/results', 'research/ui-harnesses/node_modules'];
const walk = dir => readdirSync(join(ROOT, dir)).flatMap(name => {
  const rel = `${dir}/${name}`;
  if (SKIP.some(s => rel === s || rel.startsWith(`${s}/`)) || name === 'node_modules') return [];
  return statSync(join(ROOT, rel)).isDirectory() ? walk(rel) : /\.(mjs|cjs|js)$/.test(name) ? [rel] : [];
});
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* each unguarded read in a script's text: { line, opt } */
export function unguarded(text) {
  const lines = String(text).split('\n'), found = [];
  lines.forEach((l, i) => {
    // inline: X[Y.indexOf('--opt') + 1], guarded only by an includes('--opt') or an index check on the same line
    for (const m of l.matchAll(/\[\s*(\w+)\.indexOf\((['"])(--?[\w-]+)\2\)\s*\+\s*1\s*\]/g)) {
      const o = esc(m[3]);
      const guard = new RegExp(`includes\\((['"])${o}\\1\\)|indexOf\\((['"])${o}\\2\\)\\s*(>=\\s*0|>\\s*-1|!==?\\s*-1)`).test(l);
      if (!guard) found.push({ line: i + 1, opt: m[3] });
    }
  });
  // kept in a name: k = X.indexOf('--opt') ... X[k + 1], guarded when the file compares k with 0 or -1
  const t = String(text);
  for (const m of t.matchAll(/\b(\w+)\s*=\s*(\w+)\.indexOf\((['"])(--?[\w-]+)\3\)/g)) {
    const k = esc(m[1]), x = esc(m[2]);
    if (!new RegExp(`${x}\\[\\s*${k}\\s*\\+\\s*1\\s*\\]`).test(t)) continue;
    if (new RegExp(`\\b${k}\\s*(>=\\s*0|>\\s*-1|>\\s*0|<\\s*0|!==?\\s*-1|===?\\s*-1)`).test(t)) continue;
    found.push({ line: t.slice(0, m.index).split('\n').length, opt: m[4] });
  }
  return found;
}

// 1. the scan against planted cases
const BAD = [
  "const PARTS = Number((args[args.indexOf('--parts') + 1] || '').match(/^\\d+$/) ? args[args.indexOf('--parts') + 1] : 4);",
  "const N = Number(argv[argv.indexOf('--paths') + 1]) || 20;",
  "const at = args.indexOf('--seed');\nconst SEED = Number(args[at + 1]);"
];
const GOOD = [
  "const PARTS = argv.includes('--parts') ? Number(argv[argv.indexOf('--parts') + 1]) : null;",
  "const ONLY2 = argv[argv.indexOf('--only') + 1] === '2' && argv.includes('--only');",
  "const at = args.indexOf('--paths'), NP = at >= 0 ? Number(args[at + 1]) : 20;",
  "const argAt = process.argv.indexOf('--paths'), NP = argAt > 0 ? Number(process.argv[argAt + 1]) : 10;",
  "const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };"
];
const badCaught = BAD.map(b => unguarded(b).length), goodPassed = GOOD.map(g => unguarded(g).length);
ok(1, 'the scan catches each planted unguarded read and passes each guarded form',
  badCaught.every(c => c > 0) && goodPassed.every(c => c === 0), `caught ${badCaught.join('/')}; guarded flagged ${goodPassed.join('/')}`);

// 2. the research scripts
const self = 'research/tests/cli-options.test.mjs';
const scripts = walk('research').filter(f => f !== self);
const hits = scripts.flatMap(f => unguarded(readFileSync(join(ROOT, f), 'utf8')).map(h => `${f}:${h.line} (${h.opt})`));
ok(2, `no research script reads an option's value without checking the option is there (${scripts.length} scripts)`, scripts.length > 100 && hits.length === 0, hits.slice(0, 5).join('; '));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
