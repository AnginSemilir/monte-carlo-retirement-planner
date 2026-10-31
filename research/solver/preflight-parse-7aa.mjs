/*
 * 7AA'S PREFLIGHT PARSE CHECK (as 7v's to 7y's): reduce-7aa.mjs's stamp gate refuses a log launched under "none" before it
 * parses anything, so the preflight calls the reducer's own parse() and gate() directly over its logs. The preflight runs every
 * unit tiny (4 points, 20 paths, each world on those 20), so the gate must refuse the sizes and nothing else: every unit line,
 * ran-line setting but the points and the path count (the tier state, the estate weight and the bridge read included), solve,
 * gap, joint, world, run and done line must be there as registered, and every trace must carry the name the reducer looks for.
 * No figure is read.
 *   node research/solver/preflight-parse-7aa.mjs [dir]    default results/diag7aa-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, traceName, UNITS, N, WP } from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the refusals a tiny run must give: the grid's points, the path count on each ran line, the worlds' path count
export const SIZE = [/: pts is \d+, the prediction names \d+$/, /: grid is total\d+x6x6, the prediction names total\d+x6x6$/, new RegExp(`: paths is \\d+, the prediction names ${N}$`), new RegExp(`: world lines 3, not 3 of ${WP} paths$`)];
export function check(texts, dir) {
  const units = texts.flatMap(parse), bad = gate(units);
  const missing = dir ? units.filter(u => !existsSync(join(dir, traceName(u.id, u.arm, u.label)))).map(u => `${u.id} ${u.arm}/${u.label}: no trace`) : [];
  return { units: units.length, sizes: bad.filter(b => SIZE.some(r => r.test(b))).length, other: [...bad.filter(b => !SIZE.some(r => r.test(b))), ...missing] };
}
function planted(texts, dir) {
  const good = check(texts, dir);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: thirty units, sizes refused, nothing else', `${good.units} ${good.sizes > 0} ${good.other.length}`, `${UNITS.length} true 0`],
    ['planted: a missing gap line is not a size', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a unit run twice is not a size', plant(ts => [...ts, ts[0]], 'a unit twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: the estate weight missing is not a size', plant(ts => ts.map(t => t.replace(/ bequestWeight \S+/, '')), 'no estate weight'), 'true'],
    ['planted: the tier state missing is not a size', plant(ts => ts.map(t => t.replace(/ tierState \S+/, '')), 'no tier state'), 'true'],
    ['planted: a missing world line is not a size', plant(ts => ts.map(t => t.replace(/^\s+world \S+ 2 .*$/m, '')), 'no world line'), 'true'],
    ['planted: a missing run line is not a size', plant(ts => ts.map(t => t.replace(/^\s+run \S+: .*$/m, '')), 'no run line'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7aa-preflight');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${files.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  const texts = files.map(f => readFileSync(join(DIR, f), 'utf8'));
  const np = planted(texts, DIR);
  const r = check(texts, DIR);
  if (r.units !== UNITS.length || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.units} units parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed from ${files.length} logs; the gate refused ${r.sizes} size lines and nothing else; every trace named as the reducer reads it (planted ${np})`);
}
