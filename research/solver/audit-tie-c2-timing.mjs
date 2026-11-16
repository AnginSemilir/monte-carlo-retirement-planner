/*
 * TIE-C2'S SPEED EXCEPTION, TIMED CLEANLY (D108; TIE-C2-TIMING.md, its rule committed before it runs; EXPLORATORY, seed 7001).
 * One unit one of TIE-C2's twelve couples (audit-tie-c2.mjs COUPLES), one at a time. The unit solves the couple's two tables
 * once as TIE-C2's audit did (audit-couples.mjs solverPlan('CANDC', ...), each person by solveForApp at 45 points without the
 * single's tie-break, arm A's MPAA ages), checks each against TIE-C2's digest of it (its unit's digests.before), and writes
 * each person's solve as the app's cache record (src/solverCache.js cacheOf). It then runs four timing processes, each fresh,
 * one after another: CANDS, LOOKHOLD, LOOKHOLD, CANDS on an even unit, LOOKHOLD, CANDS, CANDS, LOOKHOLD on an odd one. Each:
 *   restores the two tables from their records as the page restores a stored solve (solveForApp's `restore`), and checks them
 *   against TIE-C2's digests; builds the couple on the pots' share with its arm's options (audit-tie-c2.mjs OPTS) and reads
 *   them back; runs the first 50 paths of seed 7001 untimed to warm the code; then times the first 500, TIE-C2's own (the
 *   seed's 8,000 drawn as TIE-C2 drew them), by the process's CPU time (process.cpuUsage, user and system) with the wall clock
 *   beside; and checks each timed path's survival, failure year, pot, lifetime tax and spending delivered against TIE-C2's
 *   stored arrays for its arm, byte for byte; the load average at its start and end.
 * Units go to results/tie-c2-timing-<seed>/ (TIEC2T_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz; each couple's records in its tables/ folder, removed when the unit ends. reduce-tie-c2-timing.mjs reads them.
 *   node research/solver/audit-tie-c2-timing.mjs part k/n      node research/solver/audit-tie-c2-timing.mjs --units
 *   (a timing process: node research/solver/audit-tie-c2-timing.mjs time <k> <arm> <rep>, the unit starts it)
 *   TIEC2T_PTS the points, TIEC2T_N the timed paths, TIEC2T_WARM the warm-up's, TIEC2T_REF TIE-C2's units (smoke only);
 *   TIEC2T_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { cacheOf } from '../../src/solverCache.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { PANEL_FILE, solverPlan } from './audit-couples.mjs';
import { COUPLES_CANDIDATE } from './audit-couples-share.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import * as TC2 from './audit-tie-c2.mjs';
import { writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { serialize, deserialize } from 'node:v8';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, loadavg } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), SELF = fileURLToPath(import.meta.url);
const { solveCouple, withCouple } = CPL;

export const SEED = TC2.SEED, PTS = TC2.PTS, W = TC2.W, N = 500, WARM = 50, COUPLES = TC2.COUPLES, ARMS = ['CANDS', 'LOOKHOLD'];
/* the four timing processes of unit k: each arm first and last on alternate couples */
export const orderOf = k => (k % 2 === 0 ? ['CANDS', 'LOOKHOLD', 'LOOKHOLD', 'CANDS'] : ['LOOKHOLD', 'CANDS', 'CANDS', 'LOOKHOLD']);
export const STAMP_FILES = ['audit-tie-c2-timing.mjs', 'reduce-tie-c2-timing.mjs', 'TIE-C2-TIMING.md', 'batch-tie-c2-timing.sh', ...TC2.STAMP_FILES];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = id => `${id}.json.gz`;
const js = x => JSON.stringify(x);
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, tax: Float64Array, delivered: Float64Array };
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };

/* the couple as TIE-C2's audit builds it: the plan the solver arms take, the MPAA ages arm A resolves, and each person's
   solve at the unit's settings (with `restore`, from a stored record) */
function coupleOf(id, pts) {
  const h = readPanel(PANEL_FILE).find(x => x.id === id);
  if (!h) throw new Error(`audit-tie-c2-timing: ${id} is not in the panel`);
  const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const hp = solverPlan('CANDC', h.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const opts = (o, restore) => ({ points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light }, ...(restore ? { restore } : {}) });
  return { h, hp, aDemo, opts };
}
const digests = async cp => ({ self: await digestOf(tablesOf(cp.tables.self)), part: await digestOf(tablesOf(cp.tables.part)) });
const refOf = (dir, id) => JSON.parse(gunzipSync(readFileSync(join(dir, TC2.fileOf(id)))).toString());

if (process.argv[1] && SELF === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { COUPLES.forEach((id, k) => console.log(`${k} ${id}`)); console.log(COUPLES.length); process.exit(0); }
  const OUT = process.env.TIEC2T_OUT || join(HERE, 'results', `tie-c2-timing-${SEED}`), REF = process.env.TIEC2T_REF || join(HERE, 'results', `tie-c2-${SEED}`);
  const pts = Number(process.env.TIEC2T_PTS) || PTS, n = Number(process.env.TIEC2T_N) || N, warm = Number(process.env.TIEC2T_WARM) || WARM;

  if (args[0] === 'time') {
    // a timing process: the couple's tables restored, its arm's paths warmed then timed, every timed path checked
    const k = Number(args[1]), arm = args[2], rep = Number(args[3]), id = COUPLES[k];
    if (!(k >= 0 && k < COUPLES.length) || !ARMS.includes(arm) || !(rep === 1 || rep === 2)) { console.error('audit-tie-c2-timing: time <k> <arm> <rep>'); process.exit(2); }
    const load0 = loadavg(), { hp, aDemo, opts } = coupleOf(id, pts), ref = refOf(REF, id);
    const recs = { self: deserialize(readFileSync(join(OUT, 'tables', `${id}-self.v8`))), part: deserialize(readFileSync(join(OUT, 'tables', `${id}-part.v8`))) };
    const cp = solveCouple(E, M, hp, { shareRule: 'pots', solveOne: (p, o) => solveForApp(E, M, p, opts(o, recs[o.who])), ...TC2.OPTS[arm] });
    const dg = await digests(cp), tablesSame = dg.self === ref.digests.before.self && dg.part === ref.digests.before.part;
    const o = TC2.optionsOf(cp), w = TC2.wantOptions(arm), optionsOk = js({ tieJoint: o.tieJoint, tieLook: o.tieLook, holdPast: o.holdPast }) === js(w) && js(o.meta) === js(w);
    const ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp)), T = ctx.totalYears;
    if (ref.arms[arm].T !== T) { console.error(`audit-tie-c2-timing: ${id} ${arm}: horizon ${T}, TIE-C2's ${ref.arms[arm].T}`); process.exit(3); }
    // the seed's paths drawn as TIE-C2 drew them (all its paths), so the first n are its own
    const paths = E.pathsForSeed(SEED, ref.N, T).map(zs => Float64Array.from(zs));
    for (let i = 0; i < warm; i++) runPath(ctx, paths[i], false);
    const A = Object.fromEntries(Object.entries(KEYS).map(([key, Ty]) => [key, new Ty(n)]));
    const c0 = process.cpuUsage(), w0 = performance.now();
    for (let i = 0; i < n; i++) { const r = runPath(ctx, paths[i], false); A.survived[i] = r.survived ? 1 : 0; A.failYear[i] = r.failYear; A.pot[i] = r.wealth; A.tax[i] = r.tax; A.delivered[i] = r.delivered; }
    const c = process.cpuUsage(c0), wallMs = performance.now() - w0, load1 = loadavg();
    // each timed path's outcome against TIE-C2's stored arrays for this arm, byte for byte
    const R = Object.fromEntries(Object.entries(KEYS).map(([key, Ty]) => [key, dec(ref.arms[arm][key], Ty)]));
    let differ = 0;
    for (let i = 0; i < n; i++) if (Object.keys(KEYS).some(key => Buffer.compare(Buffer.from(A[key].buffer, i * A[key].BYTES_PER_ELEMENT, A[key].BYTES_PER_ELEMENT), Buffer.from(R[key].buffer, R[key].byteOffset + i * R[key].BYTES_PER_ELEMENT, R[key].BYTES_PER_ELEMENT)) !== 0)) differ++;
    console.log(js({ arm, rep, n, warm, T, cpuUs: c.user + c.system, userUs: c.user, systemUs: c.system, wallMs, load: [load0, load1], tablesSame, digests: dg, optionsOk, options: o, differ }));
    process.exit(0);
  }

  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === COUPLES.length && pk >= 0 && pk < pn)) { console.error(`audit-tie-c2-timing: part k/${COUPLES.length}`); process.exit(2); }
  mkdirSync(join(OUT, 'tables'), { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const id = COUPLES[pk], t0 = Date.now(), candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`TIE-C2'S TIMING (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths timed after ${warm} untimed, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}; the processes ${orderOf(pk).join(', ')}; node ${STAMP.node}`);
  // the couple's tables, solved once as TIE-C2's audit solved them, checked against its digests, stored as the app stores a solve
  const { h, hp, opts } = coupleOf(id, pts), ref = refOf(REF, id), memo = new Map();
  const s0 = Date.now();
  const base = solveCouple(E, M, hp, { shareRule: 'pots', solveOne: (p, o) => { const key = js([p, o.partnerAge0]); if (!memo.has(key)) memo.set(key, solveForApp(E, M, p, opts(o, null))); return memo.get(key); }, ...TC2.OPTS.CANDS });
  const solveSecs = (Date.now() - s0) / 1000, dg = await digests(base), solvedSame = dg.self === ref.digests.before.self && dg.part === ref.digests.before.part;
  for (const who of ['self', 'part']) writeFileSync(join(OUT, 'tables', `${id}-${who}.v8`), serialize(cacheOf(base.tables[who])));
  console.log(`${''.padEnd(8)} solved: ${solveSecs.toFixed(0)} s; the tables ${solvedSame ? "TIE-C2's" : `NOT TIE-C2's (${dg.self.slice(0, 12)} and ${dg.part.slice(0, 12)} against ${ref.digests.before.self.slice(0, 12)} and ${ref.digests.before.part.slice(0, 12)})`}; stored as the app's cache records`);
  const procs = [], reps = { CANDS: 0, LOOKHOLD: 0 };
  for (const arm of orderOf(pk)) {
    const rep = ++reps[arm];
    let line = '';
    try { line = execFileSync(process.execPath, [SELF, 'time', String(pk), arm, String(rep)], { encoding: 'utf8', env: process.env, maxBuffer: 1 << 26 }).trim().split('\n').pop(); }
    catch (e) { console.error(`audit-tie-c2-timing: ${id} ${arm} ${rep}: the timing process failed: ${String(e.stderr || e.message).slice(0, 2000)}`); process.exit(3); }
    const p = JSON.parse(line);
    procs.push(p);
    console.log(`${''.padEnd(8)} timed ${arm} (${rep}): ${(p.cpuUs / 1e6).toFixed(1)} s of CPU on ${p.n} paths (${(p.cpuUs / 1e3 / p.n).toFixed(1)} ms a path), wall ${(p.wallMs / 1e3).toFixed(1)} s; the tables ${p.tablesSame ? "TIE-C2's" : 'NOT TIE-C2\'s'}; the options ${p.optionsOk ? 'as named' : 'NOT as named'}; outcomes differing from TIE-C2's ${p.differ} of ${p.n}; the load ${p.load[0].map(x => x.toFixed(2)).join('/')} to ${p.load[1].map(x => x.toFixed(2)).join('/')}`);
  }
  rmSync(join(OUT, 'tables', `${id}-self.v8`), { force: true }); rmSync(join(OUT, 'tables', `${id}-part.v8`), { force: true });
  writeFileSync(join(OUT, fileOf(id)), gzipSync(js({ k: pk, id, cohort: h.cohort, seed: SEED, N: n, warm, pts, W, candidate, order: orderOf(pk), solveSecs, solvedSame, digests: dg, ref: { digests: ref.digests.before, N: ref.N }, procs, stamp: STAMP, cpu: cpus()[0].model })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
