/*
 * 7AC'S PREFLIGHT PARSE CHECK (as 7ab's): reduce-7ac.mjs's stamp gate refuses a log launched under "none" before it parses
 * anything, so the preflight calls the reducer's own parse() and gate() directly over its logs, with 7aa's preflight units
 * (results/diag7aa-preflight: 4 points, 20 paths, seed 7002, run on 7aa's code) as the reference. The gate must refuse the
 * sizes and, at 4 points, may refuse the openings (TS+J's and the product's year-0 pension tier move with the grid, and with
 * them the paths whose year-0 move kept the plan's tiers), and nothing else: every unit line, the ran line (7aa's
 * preflight's, identical), the table, the year-0 gap, the scale and cap, the mixture's price equal to the gap, three world
 * lines whose TS+J survival is 7aa's, TS+J's survival, both run lines and the done line must be there as registered; every
 * trace must carry the name the reducer looks for; and every TS+J trace must equal 7aa's preflight TS+J trace byte for byte
 * (the identity the reducer requires, on 7ac's code against 7aa's). No figure is read.
 *   node research/solver/preflight-parse-7ac.mjs [dir] [dir7aa]    defaults results/diag7ac-preflight, results/diag7aa-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parse, gate, traceName, UNITS, RULES, N, label } from './reduce-7ac.mjs';
import { sameTrace } from './reduce-7ab.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the refusals a tiny run may give: the sizes (the points and paths on each ran line, the world lines' paths, OPEN0's count
// of paths holding the plan's tiers) and, at 4 points, the openings
export const SIZE = [
  /: ran at \d+ points, \d+ paths, seed 7002$/,
  /: world lines 3, not 3 of 1000 paths$/,
  new RegExp(`: OPEN0 kept the plan's tiers in year 0 on \\d+ paths, not ${N}$`),
  /: TS\+J kept the plan's tiers in year 0 on \d+ paths, not 0$/,
  /: 7aa's PRODUCT does not open in the plan's tier here \(a registered unit is one where it does\)$/,
  /: TS\+J opens in the plan's tier here \(a registered unit is one where it opens apart\)$/,
];
const readTrace = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
export function check(texts, textsA, dir, dirA) {
  const units = texts.flatMap(parse), unitsA = textsA.flatMap(A.parse);
  const refOf = tag => (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === label(tag, w));
  const bad = gate(units, refOf('TS+J'), refOf('PRODUCT')), other = bad.filter(b => !SIZE.some(r => r.test(b)));
  if (dir) for (const u of units) for (const rule of RULES) {
    const f = join(dir, traceName(u.id, u.arm, rule, u.w));
    if (!existsSync(f)) { other.push(`${u.id} ${u.arm}/${rule}/W${u.w}: no trace`); continue; }
    if (rule === 'TS+J' && !sameTrace(readTrace(f), readTrace(join(dirA, A.traceName(u.id, u.arm, label('TS+J', u.w)))))) other.push(`${u.id} ${u.arm}/W${u.w}: TS+J's trace is not 7aa's preflight trace`);
  }
  return { units: units.length, sizes: bad.length - other.filter(o => bad.includes(o)).length, other };
}
function planted(texts, textsA, dir, dirA) {
  const good = check(texts, textsA, dir, dirA);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, textsA).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: four units, sizes refused, nothing else, every TS+J trace 7aa\'s', `${good.units} ${good.sizes > 0} ${good.other.length}`, `${UNITS.length} true 0`],
    ['planted: a missing gap line is not a size', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a unit run twice is not a size', plant(ts => [...ts, ts[0]], 'a unit twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: another table is not a size', plant(ts => ts.map(t => t.replace(/(solve \S+: table )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`)), 'another table'), 'true'],
    ['planted: a missing OPEN0 run is not a size', plant(ts => ts.map(t => t.replace(/^\s+run \S+\/OPEN0\/\S+: .*$/m, '')), 'no OPEN0 run'), 'true'],
    ['planted: a mixture price off the gap is not a size', plant(ts => ts.map(t => t.replace(/(price \S+: mixture )(\S+)/, (m, a, b) => `${a}${(Number(b) * 1.01 + 1e-6).toExponential(6)}`)), 'a price off'), 'true'],
    ['planted: one policy for every world off is not a size', plant(ts => ts.map(t => t.replace(/(joint \S+: )true/, '$1false')), 'per-world tables'), 'true'],
  ];
  // the identity on a planted trace: the first TS+J trace with one survival flipped
  { const u = texts.flatMap(parse)[0], j = readTrace(join(dir, traceName(u.id, u.arm, 'TS+J', u.w))), k = readTrace(join(dirA, A.traceName(u.id, u.arm, label('TS+J', u.w))));
    const s = Buffer.from(j.survived, 'base64'); s[0] ^= 1;
    cases.push(['planted: one flipped survival breaks the identity', `${sameTrace(j, k)} ${sameTrace({ ...j, survived: s.toString('base64') }, k)}`, 'true false']); }
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ac-preflight'), DIRA = args[1] || join(HERE, 'results', 'diag7aa-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsA = logs(DIRA);
  if (texts.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  if (textsA.length !== A.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsA.length} of ${A.UNITS.length} 7aa preflight logs in ${DIRA}`); process.exit(1); }
  const np = planted(texts, textsA, DIR, DIRA);
  const r = check(texts, textsA, DIR, DIRA);
  if (r.units !== UNITS.length || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.units} units parsed; refusals other than the sizes and openings:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed; the gate against 7aa's preflight refused ${r.sizes} size or opening lines and nothing else; every trace named as the reducer reads it; every TS+J trace equal to 7aa's preflight trace byte for byte (${N} paths registered; planted ${np})`);
}
