/*
 * 7t'S PREFLIGHT PARSE CHECK (the seventy-sixth review, MINOR 2): reduce-7t.mjs's stamp gate refuses a log launched under
 * "none" before it parses anything, so the preflight calls the reducer's own parse() and gate() directly over its logs.
 * The preflight runs every case tiny (4 points, 20 paths, 10 a world), so the gate must refuse the sizes and nothing else:
 * every case line, arm, ran line setting but the points and the path count, joint line, margin-0 run and pair must be
 * there as registered.
 * No figure is read.
 *   node research/solver/preflight-parse-7t.mjs [dir]    default results/diag7t-preflight
 *   node research/solver/preflight-parse-7t.mjs --planted
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, N, WP, P0 } from './reduce-7t.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the refusals a tiny run must give: the grid's points and the path count on each ran line, the world runs' size, the
// prefix's size
export const SIZE = [/pts is \d+, the prediction names \d+$/, /grid is total\d+x6x6, the prediction names total\d+x6x6$/, new RegExp(`paths is \\d+, the prediction names ${N}$`), new RegExp(`lacks its three world runs at ${WP} paths$`), new RegExp(`no prefix line for the first ${P0} paths$`)];
export function check(texts) {
  const cases = texts.flatMap(parse), bad = gate(cases);
  return { cases: cases.length, sizes: bad.filter(b => SIZE.some(r => r.test(b))).length, other: bad.filter(b => !SIZE.some(r => r.test(b))) };
}

function planted(texts) {
  const good = check(texts);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: five cases, sizes refused, nothing else', `${good.cases} ${good.sizes > 0} ${good.other.length}`, '5 true 0'],
    ['planted: a missing joint line is not a size', plant(ts => ts.map(t => t.replace(/^\s+joint READER\+J: .*$/m, '')), 'no joint line'), 'true'],
    ['planted: a case run twice is not a size', plant(ts => [...ts, ts[0]], 'a case twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: jointWorlds on for a plain arm is not a size', plant(ts => ts.map(t => t.replace(/(joint OFF: )false/, '$1true')), 'joint on for OFF'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7t-preflight');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== 5) { console.log(`PREFLIGHT INCOMPLETE - ${files.length} of 5 logs in ${DIR}`); process.exit(1); }
  const texts = files.map(f => readFileSync(join(DIR, f), 'utf8'));
  const np = planted(texts);
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const r = check(texts);
  if (r.cases !== 5 || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.cases} cases parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: 5 cases parsed from ${files.length} logs; the gate refused ${r.sizes} size lines and nothing else (planted ${np})`);
}
