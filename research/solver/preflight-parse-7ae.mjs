/*
 * 7AE'S PREFLIGHT PARSE CHECK (as 7ad's): reduce-7ae.mjs's stamp gate refuses a log launched under "none" before it parses
 * anything, so the preflight calls the reducer's own parse() and gate() directly over its logs, with 7aa's and 7ad's preflight
 * units (results/diag7aa-preflight, results/diag7ad-preflight: 4 points, 20 paths, 20 a node, seed 7002, their own code) as
 * the references, and 20 paths at the node. At 4 points every job is run at 4 wealth points, so the gate must refuse the
 * sizes - the job's points and the ran line's points and paths - and nothing else: every job line, both margins' solve, ran,
 * gap, joint, moves and price lines, three world lines summing to the price, the node line, ten decision-log lines a rule,
 * the done line; the 1e-3 tables, ran lines and gaps 7aa's preflight units', the margin-0 ran lines 7aa's with switchMargin 0,
 * and the 1e-3 node runs' first paths 7ad's preflight node lines; every trace named, counted, seeded, armed and stamped as the
 * reducer reads it, its decision log agreeing with it, and its first paths' survival 7ad's preflight traces' path by path
 * (loadTraces); and the reducer's reading (reading) runs over them to its outcome line, its lines counted, not printed. No
 * figure is read.
 *   node research/solver/preflight-parse-7ae.mjs [dir] [dir7aa] [dir7ad]   defaults results/diag7ae-preflight, results/diag7aa-preflight, results/diag7ad-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, JOBS, loadTraces, reading } from './reduce-7ae.mjs';
import * as A from './reduce-7aa.mjs';
import * as D from './reduce-7ad.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WN_PRE = 20;
// the refusals a tiny run may give: the sizes alone
export const SIZE = [
  /: ran at 4 points and 5 return points, not 30x5$/,
  /: ran 20 paths of seed 7002$/,
  /: its ran line says 4 points and 5 return points, not 30x5$/,
];
const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
export function check(texts, textsA, textsD, dir, dirD) {
  const jobs = texts.flatMap(parse), unitsA = textsA.flatMap(A.parse), jobsD = textsD.flatMap(D.parse);
  const refA = (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label('TS+J', w));
  const ref7ad = (id, arm, w) => { const j = jobsD.find(x => x.id === id && x.arm === arm && x.w === w && x.grid === '30x5'); return j ? j.tags['TS+J'] : null; };
  const bad = gate(jobs, refA, ref7ad, WN_PRE), other = bad.filter(b => !SIZE.some(r => r.test(b)));
  if (dir && !other.length) { const tb = []; loadTraces(jobs, dir, stampOf(texts[0]), tb, dirD, stampOf(textsD[0]), WN_PRE); other.push(...tb); }
  return { jobs: jobs.length, sizes: bad.length - bad.filter(b => !SIZE.some(r => r.test(b))).length, other };
}
function planted(texts, textsA, textsD, dir, dirD) {
  const good = check(texts, textsA, textsD, dir, dirD);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, textsA, textsD).other.length > 0); };
  const cases = [
    ['the preflight\'s own logs: three jobs, sizes refused, nothing else, every trace as the reducer reads it', `${good.jobs} ${good.sizes > 0} ${good.other.length}`, `${JOBS.length} true 0`],
    ['planted: a missing gap line is not a size', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a job run twice is not a size', plant(ts => [...ts, ts[0]], 'a job twice'), 'true'],
    ['planted: a wrong seed is not a size', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: another 1e-3 table is not a size', plant(ts => ts.map(t => t.replace(/(solve \S+\/M1e-3\/\S+: table )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`)), 'another table'), 'true'],
    ['planted: a margin-0 ran line without its switchMargin is not a size', plant(ts => ts.map(t => t.replace(/ switchMargin 0$/m, '')), 'no switchMargin'), 'true'],
    ['planted: a missing node run is not a size', plant(ts => ts.map(t => t.replace(/^\s+node \S+ 0 z .*$/m, '')), 'no node run'), 'true'],
    ['planted: a missing decision-log year is not a size', plant(ts => ts.map(t => t.replace(/^\s+log \S+ OPEN0 year 4: .*$/m, '')), 'no log year'), 'true'],
    ['planted: TS+J per world is not a size', plant(ts => ts.map(t => t.replace(/(joint \S+\/TS\+J\/\S+: )true/, '$1false')), 'per-world tables'), 'true'],
    ['planted: a 1e-3 node run\'s first paths not 7ad\'s is not a size', plant(ts => ts.map(t => t.replace(/(node \S+\/M1e-3\/\S+ 0 z \S+: .*first4000 TS\+J )(\S+)/, (m, a, b) => `${a}${(Number(b) - 5).toFixed(4)}`)), 'first paths off'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ae-preflight'), DIRA = args[1] || join(HERE, 'results', 'diag7aa-preflight'), DIRD = args[2] || join(HERE, 'results', 'diag7ad-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsA = logs(DIRA), textsD = logs(DIRD);
  if (texts.length !== JOBS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${JOBS.length} logs in ${DIR}`); process.exit(1); }
  if (textsA.length !== A.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsA.length} of ${A.UNITS.length} 7aa preflight logs in ${DIRA}`); process.exit(1); }
  if (textsD.length !== D.JOBS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsD.length} of ${D.JOBS.length} 7ad preflight logs in ${DIRD}`); process.exit(1); }
  const np = planted(texts, textsA, textsD, DIR, DIRD);
  const r = check(texts, textsA, textsD, DIR, DIRD);
  if (r.jobs !== JOBS.length || r.other.length) { console.log(`PREFLIGHT PARSE FAILED: ${r.jobs} jobs parsed; refusals other than the sizes:\n  ${r.other.join('\n  ')}`); process.exit(1); }
  // the reading itself, over the preflight's own logs and traces, its lines counted, never printed (no figure is read)
  let lines = 0, outcome = false;
  try {
    const jobs = texts.flatMap(parse), bad = [], TR = loadTraces(jobs, DIR, stampOf(texts[0]), bad, DIRD, stampOf(textsD[0]), WN_PRE);
    if (bad.length) throw new Error(`the traces: ${bad.join('; ')}`);
    reading(jobs, TR, l => { lines++; if (/^\nOUTCOME: /.test(l)) outcome = true; }, WN_PRE);
  } catch (e) { console.log(`PREFLIGHT READING FAILED: ${e.message}`); process.exit(1); }
  if (!outcome) { console.log(`PREFLIGHT READING FAILED: no outcome line in ${lines} lines`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${JOBS.length} jobs parsed; the gate against 7aa's and 7ad's preflights refused ${r.sizes} size lines and nothing else; the 1e-3 jobs reproduce 7aa's preflight solves and 7ad's preflight node runs (path by path); every trace named and stamped as the reducer reads it, its decision log agreeing with it; the reducer's reading ran over them to its outcome line (${lines} lines, not printed) (planted ${np})`);
}
