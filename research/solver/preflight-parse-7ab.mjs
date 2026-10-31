/*
 * 7AB'S PREFLIGHT PARSE CHECK (as 7aa's): reduce-7ab.mjs's stamp gate refuses a log launched under "none" before it parses
 * anything, so the preflight calls the reducer's own parse() and gate() directly over its logs, with 7aa's preflight units
 * (results/diag7aa-preflight: the same 4 points, 20 paths and seed, run on 7aa's code) as the reference. The gate must
 * refuse the sizes and nothing else: every unit line, the ran line (7aa's preflight's, identical), the table, the year-0
 * gap, the scale and cap, PRODUCT's survival, both run lines and the done line must be there as registered; every trace
 * must carry the name the reducer looks for; and every PRODUCT trace must equal 7aa's preflight PRODUCT trace byte for byte
 * (the identity the reducer requires, on 7ab's code against 7aa's). No figure is read.
 *   node research/solver/preflight-parse-7ab.mjs [dir] [dir7aa]    defaults results/diag7ab-preflight, results/diag7aa-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parse, gate, traceName, sameTrace, UNITS, RULES, N, label } from './reduce-7ab.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the refusal a tiny run must give: the points and the path count on each ran line
export const SIZE = [new RegExp(`: ran at \\d+ points, \\d+ paths, seed 7002$`)];
const readTrace = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
export function check(texts, textsA, dir, dirA) {
  const units = texts.flatMap(parse), unitsA = textsA.flatMap(A.parse);
  const ref = (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === label('PRODUCT', w));
  const bad = gate(units, ref), other = bad.filter(b => !SIZE.some(r => r.test(b)));
  if (dir) for (const u of units) for (const rule of RULES) {
    const f = join(dir, traceName(u.id, u.arm, rule, u.w));
    if (!existsSync(f)) { other.push(`${u.id} ${u.arm}/${rule}/W${u.w}: no trace`); continue; }
    if (rule === 'PRODUCT' && !sameTrace(readTrace(f), readTrace(join(dirA, A.traceName(u.id, u.arm, label('PRODUCT', u.w)))))) other.push(`${u.id} ${u.arm}/W${u.w}: PRODUCT's trace is not 7aa's preflight trace`);
  }
  return { units: units.length, sizes: bad.length - bad.filter(b => !SIZE.some(r => r.test(b))).length, other };
}
function planted(texts, textsA, dir, dirA) {
  const good = check(texts, textsA, dir, dirA);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, textsA).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: ten units, sizes refused, nothing else, every PRODUCT trace 7aa\'s', `${good.units} ${good.sizes > 0} ${good.other.length}`, `${UNITS.length} true 0`],
    ['planted: a missing gap line is not a size', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a unit run twice is not a size', plant(ts => [...ts, ts[0]], 'a unit twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: another table is not a size', plant(ts => ts.map(t => t.replace(/(solve \S+: table )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`)), 'another table'), 'true'],
    ['planted: a missing FREED run is not a size', plant(ts => ts.map(t => t.replace(/^\s+run \S+\/FREED\/\S+: .*$/m, '')), 'no FREED run'), 'true'],
    ['planted: the tier state is not a size', plant(ts => ts.map(t => t.replace(/ quad 5/, ' quad 5 tierState 0/0,1/1,2/2')), 'the tier state'), 'true'],
  ];
  // the identity on a planted trace: the first PRODUCT trace with one survival flipped
  { const u = texts.flatMap(parse)[0], j = readTrace(join(dir, traceName(u.id, u.arm, 'PRODUCT', u.w))), k = readTrace(join(dirA, A.traceName(u.id, u.arm, label('PRODUCT', u.w))));
    const s = Buffer.from(j.survived, 'base64'); s[0] ^= 1;
    cases.push(['planted: one flipped survival breaks the identity', `${sameTrace(j, k)} ${sameTrace({ ...j, survived: s.toString('base64') }, k)}`, 'true false']); }
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ab-preflight'), DIRA = args[1] || join(HERE, 'results', 'diag7aa-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsA = logs(DIRA);
  if (texts.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  if (textsA.length !== A.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsA.length} of ${A.UNITS.length} 7aa preflight logs in ${DIRA}`); process.exit(1); }
  const np = planted(texts, textsA, DIR, DIRA);
  const r = check(texts, textsA, DIR, DIRA);
  if (r.units !== UNITS.length || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.units} units parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed; the gate against 7aa's preflight refused ${r.sizes} size lines and nothing else; every trace named as the reducer reads it; every PRODUCT trace equal to 7aa's preflight trace byte for byte (${N} paths registered; planted ${np})`);
}
