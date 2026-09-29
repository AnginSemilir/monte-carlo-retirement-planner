/*
 * P'S PREFLIGHT PARSE CHECK (as 7ae's): reduce-P.mjs's stamp gate refuses a log launched under "none", so the preflight calls
 * the reducer's own parse(), gate(), loadTraces() and reading() directly over its logs, at the preflight's sizes (every job at
 * 4 wealth points, 20 paths, 20 at the node), with the references' own preflights (results/diag7ae-preflight,
 * diag7ad-preflight, diag7af-preflight, diag7ag-preflight: the same sizes and seed, their own code; each proved by its own preflight parse
 * check) as the references, and 7ae's preflight traces (read by reduce-7ae.mjs loadTraces against 7ad's preflight) as the
 * identity reference for settings 0 and 1e-3. The gate is told the preflight's points and must refuse nothing: every job,
 * every line, settings 0 and 1e-3 equal to 7ae's preflight lines and its node traces path by path, every ran line its
 * reference's with the settings at its end; every trace named and stamped as the reducer reads it; the reading runs to its
 * outcome line, its lines counted, not printed. No figure is read.
 * OPEN2's pair is not read here: a 4-point opening is not the registered one; derive-P.mjs section 5 checks it on 7ae's gated
 * full-size records, and the launcher re-runs that derivation before every launch (inside the snapshot 7ae's records cannot be
 * loaded: no git there to verify 7ae's declared correction, O58).
 *   node research/solver/preflight-parse-P.mjs [dir] [dir7ae] [dir7ad] [dir7af] [dir7ag] [dir7aa]
 *     defaults results/diagP-preflight, results/diag7ae-preflight, results/diag7ad-preflight, results/diag7af-preflight,
 *     results/diag7ag-preflight, results/diag7aa-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, JOBS, loadTraces, reading, CORE } from './reduce-P.mjs';
import { decode } from './reduce-7t.mjs';
import * as A from './reduce-7aa.mjs';
import * as D from './reduce-7ad.mjs';
import * as E from './reduce-7ae.mjs';
import * as F from './reduce-7af.mjs';
import * as G from './reduce-7ag.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_PRE = 20, PTS_PRE = '4';
const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
function refs(textsE, textsD, textsF, textsG, textsA, dirE, dirD, dirA) {
  const jobsE = textsE.flatMap(E.parse), jobsD = textsD.flatMap(D.parse), unitsF = textsF.flatMap(F.parse), unitsG = textsG.flatMap(G.parse);
  const R = { e: (id, arm, w) => jobsE.find(x => x.id === id && x.arm === arm && x.w === w) || null,
    ad: (id, arm, w, g) => { const j = jobsD.find(x => x.id === id && x.arm === arm && x.w === w && x.grid === g); return j ? j.tags['TS+J'] : null; },
    af: id => unitsF.find(u => u.id === id && u.arm === F.CAND[0] && u.label === F.CAND[1]) || unitsG.find(u => u.id === id && u.arm === G.CAND[0] && u.label === G.CAND[1]) || null };
  const badE = [], TRE = E.loadTraces(jobsE, dirE, stampOf(textsE[0]), badE, dirD, stampOf(textsD[0]), N_PRE);
  // 7aa's preflight TS+J traces on the three units, stamped as its logs and counted at the preflight's size (A.traceAgrees
  // holds 7aa's full count, so the preflight checks the count, seed, arm, stamp and survival here)
  const unitsA = textsA.flatMap(A.parse), STA = stampOf(textsA[0]), TRA = {};
  for (const [id, arm, w] of CORE) {
    const l = A.label('TS+J', w), u = unitsA.find(x => x.id === id && x.arm === arm && x.label === l), f = join(dirA, A.traceName(id, arm, l));
    if (!u || !existsSync(f)) { badE.push(`no 7aa preflight TS+J/W${w} unit or trace for ${id}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!(j.stamp && STA && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === STA[k]) && j.N === N_PRE && String(j.seed) === '7002' && j.arm === `${arm}/${l}` && Math.abs(j.sim - u.run.sim) <= 5e-5 + 1e-9)) { badE.push(`${f}: count, seed, arm, stamp or survival is not 7aa's preflight log's`); continue; }
    TRA[`${id}|${arm}|${l}`] = decode(j);
  }
  return { R, TRE, TRA, badE };
}
export function check(texts, X, dir) {
  const jobs = texts.flatMap(parse), bad = gate(jobs, X.R, { n: N_PRE, wn: N_PRE, na: N_PRE, pts: PTS_PRE });
  let TR = null;
  if (dir && !bad.length) TR = loadTraces(jobs, dir, stampOf(texts[0]), bad, X.TRE, X.TRA, N_PRE, N_PRE);
  return { jobs, bad, TR };
}
function planted(texts, X, dir) {
  const good = check(texts, X, dir);
  // each plant must change the logs, or it tests nothing (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, X).bad.length > 0); };
  const cases = [
    ['the preflight\'s own logs: every job, nothing refused, every trace as the reducer reads it', `${good.jobs.length} ${good.bad.length}`, `${JOBS.length} 0`],
    ['planted: a missing gap line is refused', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a job run twice is refused', plant(ts => [...ts, ts[0]], 'a job twice'), 'true'],
    ['planted: a wrong seed is refused', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: another margin-0 table is refused', plant(ts => ts.map(t => t.replace(/(solve \S+\/M0\/30x5\/\S+: table )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`)), 'another table'), 'true'],
    ['planted: P without its charge on the ran line is refused', plant(ts => ts.map(t => t.replace(/ switchCharge 0\.001$/m, '')), 'no charge'), 'true'],
    ['planted: TS+J per world is refused', plant(ts => ts.map(t => t.replace(/(joint \S+\/TS\+J\/\S+: )true/, '$1false')), 'per-world tables'), 'true'],
    ['planted: a missing node run is refused', plant(ts => ts.map(t => t.replace(/^\s+node \S+ 0 z .*$/m, '')), 'no node run'), 'true'],
    ['planted: a missing all-world run is refused', plant(ts => ts.map(t => t.replace(/^\s+all \S+: .*$/m, '')), 'no all-world run'), 'true'],
    ['planted: a missing decision-log year is refused', plant(ts => ts.map(t => t.replace(/^\s+log \S+ OPEN2 year 4: .*$/m, '')), 'no log year'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return { n: cases.length, good };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diagP-preflight'), DIRE = R_(1, 'diag7ae-preflight'), DIRD = R_(2, 'diag7ad-preflight'), DIRF = R_(3, 'diag7af-preflight'), DIRG = R_(4, 'diag7ag-preflight'), DIRA = R_(5, 'diag7aa-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsE = logs(DIRE), textsD = logs(DIRD), textsF = logs(DIRF), textsG = logs(DIRG), textsA = logs(DIRA);
  if (texts.length !== JOBS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${JOBS.length} logs in ${DIR}`); process.exit(1); }
  for (const [t, d, k] of [[textsE, DIRE, E.JOBS.length], [textsD, DIRD, D.JOBS.length], [textsF, DIRF, F.UNITS.length], [textsG, DIRG, G.UNITS.length], [textsA, DIRA, A.UNITS.length]]) if (t.length !== k) { console.log(`PREFLIGHT INCOMPLETE - ${t.length} of ${k} logs in ${d}`); process.exit(1); }
  const X = refs(textsE, textsD, textsF, textsG, textsA, DIRE, DIRD, DIRA);
  if (X.badE.length) { console.log(`PREFLIGHT PARSE FAILED (7ae's and 7aa's preflight traces):\n  ${X.badE.join('\n  ')}`); process.exit(1); }
  const { n, good } = planted(texts, X, DIR);
  if (good.bad.length) { console.log(`PREFLIGHT PARSE FAILED:\n  ${good.bad.join('\n  ')}`); process.exit(1); }
  let lines = 0, outcome = false;
  try { reading(good.jobs, good.TR, X.R.af, l => { lines++; if (/^\nOUTCOME: /.test(l)) outcome = true; }, N_PRE); } catch (e) { console.log(`PREFLIGHT READING FAILED: ${e.message}`); process.exit(1); }
  if (!outcome) { console.log(`PREFLIGHT READING FAILED: no outcome line in ${lines} lines`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${JOBS.length} jobs parsed and gated at the preflight's sizes with nothing refused - settings 0 and 1e-3 7ae's preflight lines and node traces and 7aa's preflight all-world traces path by path, every ran line its reference's (7ae's, 7ad's, 7af's preflights) with the settings at its end (7ae's, 7ad's, 7af's and 7ag's preflights); every trace named and stamped as the reducer reads it; the reducer's reading ran over them to its outcome line (${lines} lines, not printed) (planted ${n})`);
}
