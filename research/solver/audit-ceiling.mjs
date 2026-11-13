/*
 * THE HARVEST CEILING ON THE YEAR'S WHOLE TAXABLE INCOME: THE REVIEW'S EIGHT SOLVED BEFORE AND AFTER (the review of 11 Nov,
 * ANSWERS.md section 5, step 4; HARVEST-CEILING.md; D91, D93; EXPLORATORY, seed 7002, deciding nothing but by the rule
 * HARVEST-CEILING.md commits). One unit a household, two arms in it:
 *   BEFORE  the tree at the commit before the ceiling's (CEILING_BEFORE, a worktree with its engine built), its own solver and engine;
 *   AFTER   this tree's.
 * Each arm solves the household at 45 points as the app does (solveForApp) and runs the solved plan on the same 16,000 paths
 * of seed 7002 by its own engine (solverStrategy runPath), its first CHECK paths held to that engine's E.runTrial. Each arm
 * records what it ran: its tree's commit, whether its engine has the ceiling (pensionCeiling), its tables' digest, its
 * settings. Units go to results/ceiling-<seed>/ (CEILING_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-ceiling.mjs reads them.
 *   CEILING_BEFORE=<tree> node research/solver/audit-ceiling.mjs part k/n      node research/solver/audit-ceiling.mjs --units
 *   CEILING_PTS the points (smoke only); CEILING_N the paths (smoke only); CEILING_OUT the folder
 */
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..');
export const SEED = 7002, N = 16000, PTS = 45, CHECK = 200;
// the review's eight as Phase 4 landed them (audit-curve.mjs HOUSEHOLDS; SPEED-A.md's EIGHT)
export const HOUSEHOLDS = ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F'];
export const UNITS = HOUSEHOLDS.map(id => ({ id }));
export const STAMP_FILES = ['audit-ceiling.mjs', 'reduce-ceiling.mjs', 'reduce-isasweep.mjs', 'HARVEST-CEILING.md', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});
const load = async (R) => {
  const at = p => import(pathToFileURL(join(R, p)).href);
  return { E: await at('research/engine.mjs'), M: await at('src/solver/model.js'), A: await at('src/solverApp.js'), ST: await at('src/solverStrategy.js'), D: await at('src/solverDigest.js'), P4: await at('research/solver/phase4-panel.mjs') };
};
// a tree's commit, or 'snapshot' where it is the launcher's frozen copy (no git there: the stamp's code names it)
const commitOf = R => { try { return execFileSync('git', ['-C', R, 'rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return 'snapshot'; } };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-ceiling: part k/${UNITS.length}`); process.exit(2); }
  const BEFORE = process.env.CEILING_BEFORE;
  if (!BEFORE || !existsSync(join(BEFORE, 'research/engine.mjs'))) { console.error('audit-ceiling: CEILING_BEFORE=<a worktree at the commit before the ceiling, its engine built>'); process.exit(2); }
  const OUT = process.env.CEILING_OUT || join(HERE, 'results', `ceiling-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.CEILING_PTS) || PTS, n = Number(process.env.CEILING_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], id = u.id, t0 = Date.now();
  console.log(`HARVEST-CEILING (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths, ${pts} points; before ${commitOf(BEFORE)}; node ${STAMP.node}`);
  const arms = {}; let inputs = null;
  for (const [arm, R] of [['BEFORE', BEFORE], ['AFTER', ROOT]]) {
    const { E, M, A, ST, D, P4 } = await load(R);
    const plan = P4.readPanel().find(h => h.id === id).plan, mine = hashOf(plan);
    if (inputs === null) inputs = mine;
    const s0 = Date.now(), r = A.solveForApp(E, M, plan, { points: pts, research: light(pts) }), solveSecs = (Date.now() - s0) / 1000;
    const sc = ST.solvedContext(E, r), T = sc.totalYears, paths = E.pathsForSeed(SEED, n, T);
    const survived = new Uint8Array(n), delivered = new Float64Array(n), target = new Float64Array(n), pot = new Float64Array(n), tax = new Float64Array(n);
    let bad = 0;
    paths.forEach((zs, k) => {
      const o = ST.runPath(E, sc, zs); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; target[k] = o.target; pot[k] = o.terminalPot; tax[k] = o.lifetimeTax;
      if (k < CHECK) { const q = E.runTrial(sc, Float64Array.from(zs)); if (q.survived !== o.survived || q.lifetimeTax !== o.lifetimeTax) bad++; }
    });
    if (bad) { console.error(`audit-ceiling: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const c = r.meta && r.meta.coarse;
    arms[arm] = { commit: commitOf(R), ceiling: typeof E.pensionCeiling === 'function', inputs: mine, digest: await D.digestOf(D.tablesOf(r)), rest: `pts ${pts} | coarse ${c ? (c.off ? `off (${c.off})` : 'on') : 'none'}`, solveSecs, survived, delivered, target, pot, tax };
    console.log(`${''.padEnd(8)} ran ${arm}: tree ${arms[arm].commit}, the ceiling ${arms[arm].ceiling ? 'in' : 'not in'} its engine, tables ${arms[arm].digest.slice(0, 12)} | ${arms[arm].rest}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; the engine against E.runTrial on the first ${Math.min(CHECK, n)} paths the same`);
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, seed: SEED, N: n, pts, inputs, stamp: STAMP, cpu: cpus()[0].model,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ...x, survived: b64(x.survived), delivered: b64(x.delivered), target: b64(x.target), pot: b64(x.pot), tax: b64(x.tax) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
