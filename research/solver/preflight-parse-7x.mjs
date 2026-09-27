/*
 * 7X'S PREFLIGHT PARSE CHECK (as 7v's and 7w's): reduce-7x.mjs's stamp gate refuses a log launched under "none" before it parses
 * anything, so the preflight calls the reducer's own parse() and gate() directly over its logs. The preflight runs every
 * unit tiny (4 points, 20 paths, 10 a world), so the gate must refuse the sizes and nothing else: every unit line, ran-line
 * setting but the points and the path count (the held tier, the worlds and the bridge read included), joint, hold, world, run
 * and done line must be there as registered, and every trace must carry the name the reducer looks for.
 * No figure is read.
 *   node research/solver/preflight-parse-7x.mjs [dir]    default results/diag7x-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, traceName, UNITS, N, WP } from './reduce-7x.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the refusals a tiny run must give: the grid's points and the path count on each ran line
export const SIZE = [/: pts is \d+, the prediction names \d+$/, /: grid is total\d+x6x6, the prediction names total\d+x6x6$/, new RegExp(`: paths is \\d+, the prediction names ${N}$`), new RegExp(`: lacks its \\d world lines at ${WP} paths$`)];
export function check(texts, dir) {
  const units = texts.flatMap(parse), bad = gate(units);
  const missing = dir ? units.filter(u => !existsSync(join(dir, traceName(u.id, u.label)))).map(u => `${u.id}: no trace for ${u.label}`) : [];
  return { units: units.length, sizes: bad.filter(b => SIZE.some(r => r.test(b))).length, other: [...bad.filter(b => !SIZE.some(r => r.test(b))), ...missing] };
}
function planted(texts, dir) {
  const good = check(texts, dir);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: nine units, sizes refused, nothing else', `${good.units} ${good.sizes > 0} ${good.other.length}`, `${UNITS.length} true 0`],
    ['planted: a missing hold line is not a size', plant(ts => ts.map(t => t.replace(/^\s+hold \S+: .*$/m, '')), 'no hold line'), 'true'],
    ['planted: a unit run twice is not a size', plant(ts => [...ts, ts[0]], 'a unit twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: a held tier run as another is not a size', plant(ts => ts.map(t => t.replace(/holdTier 2\/2/, 'holdTier 0/0')), '2/2 as 0/0'), 'true'],
    ['planted: a missing run line is not a size', plant(ts => ts.map(t => t.replace(/^\s+run \S+: .*$/m, '')), 'no run line'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7x-preflight');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${files.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  const texts = files.map(f => readFileSync(join(DIR, f), 'utf8'));
  const np = planted(texts, DIR);
  const r = check(texts, DIR);
  if (r.units !== UNITS.length || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.units} units parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed from ${files.length} logs; the gate refused ${r.sizes} size lines and nothing else; every trace named as the reducer reads it (planted ${np})`);
}
