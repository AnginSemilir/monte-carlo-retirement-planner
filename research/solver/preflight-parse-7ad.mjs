/*
 * 7AD'S PREFLIGHT PARSE CHECK (as 7ac's): reduce-7ad.mjs's stamp gate refuses a log launched under "none" before it parses
 * anything, so the preflight calls the reducer's own parse() and gate() directly over its logs, with 7aa's and 7ac's preflight
 * units (results/diag7aa-preflight, results/diag7ac-preflight: 4 points, 20 paths, 20 a world, seed 7002, their own code) as
 * the references, and 20 paths a node. At 4 points every job is run at 4 wealth points, so the gate must refuse the sizes -
 * the job's points and the ran line's points and paths - and nothing else: every job line, both tags' solve, ran, gap, joint,
 * moves and price lines, three world lines summing to the price, the node lines of the registered worlds, the done line; the
 * 30x5-named jobs' tables, ran lines and gaps 7aa's preflight units' (the solve.js change to scoreMoves - its optional
 * survival output - leaves the solve as it was) and their node runs' first paths 7ac's preflight world lines; every trace
 * named, counted, seeded, armed and stamped as the reducer reads it; and the reducer's reading (loadTraces, reading) runs over
 * them to its outcome line, its lines counted, not printed. No figure is read.
 *   node research/solver/preflight-parse-7ad.mjs [dir] [dir7aa] [dir7ac]   defaults results/diag7ad-preflight, results/diag7aa-preflight, results/diag7ac-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parse, gate, traceName, traceAgrees, JOBS, nodeWorlds, loadTraces, reading } from './reduce-7ad.mjs';
import * as A from './reduce-7aa.mjs';
import * as C from './reduce-7ac.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WN_PRE = 20;
// the refusals a tiny run may give: the sizes alone
export const SIZE = [
  /: ran at 4 points and \d+ return points, not its grid's$/,
  /: ran 20 paths of seed 7002$/,
  /: its ran line says 4 points and \d+ return points, not \d+x\d+$/,
];
const readTrace = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
export function check(texts, textsA, textsC, dir) {
  const jobs = texts.flatMap(parse), unitsA = textsA.flatMap(A.parse), unitsC = textsC.flatMap(C.parse);
  const refA = (id, arm, tag, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
  const refC = (id, arm, w) => unitsC.find(u => u.id === id && u.arm === arm && u.w === w) || null;
  const bad = gate(jobs, refA, refC, WN_PRE), other = bad.filter(b => !SIZE.some(r => r.test(b)));
  if (dir) { const ST = stampOf(texts[0]); for (const j of jobs) { const u = j.tags['TS+J']; if (!u) continue; for (const k of nodeWorlds(j.grid)) { const nd = u.nodes[k]; if (!nd) continue; for (const [rule, sim] of [['TS+J', nd.simJ], ['OPEN0', nd.simO]]) {
    const f = join(dir, traceName(j.id, j.arm, j.grid, rule, k, j.w)), t = readTrace(f);
    if (!t) other.push(`${j.id} ${j.arm}/${rule}/${j.grid}/W${j.w} world ${k}: no trace`);
    else if (!traceAgrees(t, ST, j.arm, j.grid, rule, k, j.w, sim, WN_PRE)) other.push(`${f}: count, seed, arm, stamp or survival is not the log's`);
  } } } }
  return { jobs: jobs.length, sizes: bad.length - other.filter(o => bad.includes(o)).length, other };
}
function planted(texts, textsA, textsC, dir) {
  const good = check(texts, textsA, textsC, dir);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, textsA, textsC).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: seven jobs, sizes refused, nothing else, every trace as the reducer reads it', `${good.jobs} ${good.sizes > 0} ${good.other.length}`, `${JOBS.length} true 0`],
    ['planted: a missing gap line is not a size', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a job run twice is not a size', plant(ts => [...ts, ts[0]], 'a job twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: another 30x5 table is not a size', plant(ts => ts.map(t => (/job \S+\/30x5\//.test(t) ? t.replace(/(solve \S+: table )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`) : t)), 'another table'), 'true'],
    ['planted: a missing node run is not a size', plant(ts => ts.map(t => t.replace(/^\s+node \S+ 0 z .*$/m, '')), 'no node run'), 'true'],
    ['planted: a like-for-like sum off the mixture is not a size', plant(ts => ts.map(t => t.replace(/(like-for-like whole )(\S+)/, (m, a, b) => `${a}${(Number(b) * 1.01 + 1e-6).toExponential(6)}`)), 'a sum off'), 'true'],
    ['planted: TS+J per world is not a size', plant(ts => ts.map(t => t.replace(/(joint \S+\/TS\+J\/\S+: )true/, '$1false')), 'per-world tables'), 'true'],
    ['planted: a 30x5 node run\'s first paths not 7ac\'s is not a size', plant(ts => ts.map(t => (/job \S+\/30x5\//.test(t) ? t.replace(/(first1000 TS\+J )(\S+)/, (m, a, b) => `${a}${(Number(b) - 5).toFixed(4)}`) : t)), 'first paths off'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ad-preflight'), DIRA = args[1] || join(HERE, 'results', 'diag7aa-preflight'), DIRC = args[2] || join(HERE, 'results', 'diag7ac-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsA = logs(DIRA), textsC = logs(DIRC);
  if (texts.length !== JOBS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${JOBS.length} logs in ${DIR}`); process.exit(1); }
  if (textsA.length !== A.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsA.length} of ${A.UNITS.length} 7aa preflight logs in ${DIRA}`); process.exit(1); }
  if (textsC.length !== C.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsC.length} of ${C.UNITS.length} 7ac preflight logs in ${DIRC}`); process.exit(1); }
  const np = planted(texts, textsA, textsC, DIR);
  const r = check(texts, textsA, textsC, DIR);
  if (r.jobs !== JOBS.length || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.jobs} jobs parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  // the reading itself, over the preflight's own logs and traces, its lines counted, never printed (no figure is read): it must
  // run to its outcome line, so the reducer's reading has run on files before the real ones
  let lines = 0, outcome = false;
  try {
    const jobs = texts.flatMap(parse), bad = [], TR = loadTraces(jobs, DIR, stampOf(texts[0]), bad, WN_PRE);
    if (bad.length) throw new Error(`the traces: ${bad.join('; ')}`);
    reading(jobs, TR, l => { lines++; if (/^\nOUTCOME: /.test(l)) outcome = true; }, WN_PRE);
  } catch (e) { console.log(`PREFLIGHT READING FAILED: ${e.message}`); process.exit(1); }
  if (!outcome) { console.log(`PREFLIGHT READING FAILED: no outcome line in ${lines} lines`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${JOBS.length} jobs parsed; the gate against 7aa's and 7ac's preflights refused ${r.sizes} size lines and nothing else; the 30x5 jobs reproduce 7aa's preflight solves and 7ac's preflight world lines; every trace named and stamped as the reducer reads it; the reducer's reading ran over them to its outcome line (${lines} lines, not printed) (planted ${np})`);
}
