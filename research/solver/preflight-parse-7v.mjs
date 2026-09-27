/*
 * 7v'S PREFLIGHT PARSE CHECK (as 7t's, the seventy-sixth review, MINOR 2): reduce-7v.mjs's stamp gate refuses a log
 * launched under "none" before it parses anything, so the preflight calls the reducer's own parse() and gate() directly
 * over its logs. The preflight runs every case tiny (4 points, 20 paths, 10 a world), so the gate must refuse the sizes
 * and nothing else: every case line, arm, ran-line setting but the points and the path count, joint line (with the risk
 * above each case registers), run and world line must be there as registered, and every trace must carry the name the
 * reducer looks for.
 * No figure is read.
 *   node research/solver/preflight-parse-7v.mjs [dir]    default results/diag7v-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, runsOf, traceName, CASES, N, WP } from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the refusals a tiny run must give: the grid's points and the path count on each ran line, and the world runs' size
export const SIZE = [/pts is \d+, the prediction names \d+$/, /grid is total\d+x6x6, the prediction names total\d+x6x6$/, new RegExp(`paths is \\d+, the prediction names ${N}$`), new RegExp(`lacks its three world runs at ${WP} paths$`)];
export function check(texts, dir) {
  const cases = texts.flatMap(parse), bad = gate(cases);
  const missing = dir ? cases.flatMap(c => runsOf(c.id).filter(l => !existsSync(join(dir, traceName(c.id, l)))).map(l => `${c.id}: no trace for ${l}`)) : [];
  return { cases: cases.length, sizes: bad.filter(b => SIZE.some(r => r.test(b))).length, other: [...bad.filter(b => !SIZE.some(r => r.test(b))), ...missing] };
}
function planted(texts, dir) {
  const good = check(texts, dir);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t).other.length > 0); };
  const n = Object.keys(CASES).length;
  const cases = [
    ['the preflight\'s own logs: nine cases, sizes refused, nothing else', `${good.cases} ${good.sizes > 0} ${good.other.length}`, `${n} true 0`],
    ['planted: a missing joint line is not a size', plant(ts => ts.map(t => t.replace(/^\s+joint OFF\+J: .*$/m, '')), 'no joint line'), 'true'],
    ['planted: a case run twice is not a size', plant(ts => [...ts, ts[0]], 'a case twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: a missing learner run is not a size', plant(ts => ts.map(t => t.replace(/^\s+run \S+\/0\+L: .*$/m, '')), 'no learner run'), 'true'],
    ['planted: five worlds run as three is not a size', plant(ts => ts.map(t => t.replace(/(S330 mix5\s+case .* mix )5/, '$13')), 'mix5 at 3'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7v-preflight');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const n = Object.keys(CASES).length;
  if (files.length !== n) { console.log(`PREFLIGHT INCOMPLETE - ${files.length} of ${n} logs in ${DIR}`); process.exit(1); }
  const texts = files.map(f => readFileSync(join(DIR, f), 'utf8'));
  const np = planted(texts, DIR);
  const r = check(texts, DIR);
  if (r.cases !== n || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.cases} cases parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${n} cases parsed from ${files.length} logs; the gate refused ${r.sizes} size lines and nothing else; every trace named as the reducer reads it (planted ${np})`);
}
