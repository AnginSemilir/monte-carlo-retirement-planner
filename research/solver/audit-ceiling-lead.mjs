/*
 * THE HARVEST CEILING'S ALLOWANCE STEP: IS IT WHAT RAISES TAX BELOW THE CAP? (CEILING-LEAD.md; the reviewer at the
 * ceiling's step 4 read, finding 2, and on D95, finding 6; EXPLORATORY, seed 7002, deciding nothing in the code.)
 * One unit a household, three arms in it, each on this tree's solver with an engine that differs in pensionCeiling alone:
 *   OFF    it returns the ceiling it is given (every ceiling on the non-savings income alone, as before the ceiling);
 *   RAWPA  the allowance's ceiling as before (returned as given), the bands' as now;
 *   NOW    research/engine.mjs as it is.
 * Each arm solves the household at 45 points as the app does (solveForApp) and runs the solved plan on the same 16,000
 * paths of seed 7002 (solverStrategy runPath), its first CHECK paths held to its engine's E.runTrial. Each arm records
 * what it ran: what its pensionCeiling returns at the allowance and at the basic-rate ceiling with interest and dividends
 * present (read back), its tables' digest, its settings. Units go to results/ceiling-lead-<seed>/ (CLEAD_OUT): case<k>.txt,
 * the log, stamped (fair-gate.mjs LOG_STAMP), and <id>.json.gz. reduce-ceiling-lead.mjs reads them.
 *   node research/solver/audit-ceiling-lead.mjs part k/n      node research/solver/audit-ceiling-lead.mjs --units
 *   CLEAD_PTS the points (smoke only); CLEAD_N the paths (smoke only); CLEAD_OUT the folder
 */
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HOUSEHOLDS } from './audit-ceiling.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..');
export const SEED = 7002, N = 16000, PTS = 45, CHECK = 200, CAP_TIMES = 4;
export const ARMS = ['OFF', 'RAWPA', 'NOW'];
export { HOUSEHOLDS };
export const UNITS = HOUSEHOLDS.map(id => ({ id }));
export const STAMP_FILES = ['audit-ceiling-lead.mjs', 'reduce-ceiling-lead.mjs', 'audit-ceiling.mjs', 'reduce-ceiling.mjs', 'reduce-isasweep.mjs', 'CEILING-LEAD.md', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});
/* the arms' engines: research/engine.mjs with pensionCeiling changed at one anchor, each anchor there exactly once */
export const PATCH = {
  OFF: ['function pensionCeiling(cfg, ceiling, otherTaxableIncome, interest, dividends) {', 'function pensionCeiling(cfg, ceiling, otherTaxableIncome, interest, dividends) { return ceiling;'],
  RAWPA: ['if (T0 >= ceiling) return ceiling;   // already at it: no draw', 'if (T0 >= ceiling || ceiling === p.pa) return ceiling;   // already at it, or the allowance\'s ceiling: as given'],
  NOW: null
};
export async function engineFor(arm) {
  const file = join(ROOT, 'research/engine.mjs');
  if (!PATCH[arm]) return import(pathToFileURL(file).href);
  const src = readFileSync(file, 'utf8'), [anchor, to] = PATCH[arm];
  if (src.split(anchor).length !== 2) throw new Error(`audit-ceiling-lead: ${arm}'s anchor is not in research/engine.mjs exactly once`);
  const tmp = mkdtempSync(join(tmpdir(), `ceiling-lead-${arm}-`));
  writeFileSync(join(tmp, 'engine.mjs'), src.replace(anchor, to));
  const E = await import(pathToFileURL(join(tmp, 'engine.mjs')).href);
  rmSync(tmp, { recursive: true, force: true });
  return E;
}
/* what an engine's pensionCeiling returns at the allowance and at the basic-rate ceiling, no other income, £3,000 of
   interest and £3,000 of dividends: [allowance, band], beside the raw [P.pa, P.higherRateStartsAt] */
export const probeOf = (E, P) => ({ pa: E.pensionCeiling(P, P.pa, 0, 3000, 3000), band: E.pensionCeiling(P, P.higherRateStartsAt, 0, 3000, 3000), rawPa: P.pa, rawBand: P.higherRateStartsAt });

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-ceiling-lead: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.CLEAD_OUT || join(HERE, 'results', `ceiling-lead-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.CLEAD_PTS) || PTS, n = Number(process.env.CLEAD_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const at2 = p => import(pathToFileURL(join(ROOT, p)).href);
  const M = await at2('src/solver/model.js'), A = await at2('src/solverApp.js'), ST = await at2('src/solverStrategy.js'), D = await at2('src/solverDigest.js'), P4 = await at2('research/solver/phase4-panel.mjs');
  const { CANDIDATE_HASH } = await at2('research/solver/candidate.mjs');
  const u = UNITS[pk], id = u.id, t0 = Date.now();
  const plan = P4.readPanel().find(h => h.id === id).plan, inputs = hashOf(plan);
  console.log(`CEILING-LEAD (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths, ${pts} points, the candidate ${CANDIDATE_HASH}; node ${STAMP.node}`);
  const arms = {}; let opening = null;
  for (const arm of ARMS) {
    const E = await engineFor(arm);
    const s0 = Date.now(), r = A.solveForApp(E, M, plan, { points: pts, research: light(pts) }), solveSecs = (Date.now() - s0) / 1000;
    const sc = ST.solvedContext(E, r), T = sc.totalYears, paths = E.pathsForSeed(SEED, n, T);
    const open = Object.values(E.freshState(sc).pots).reduce((s, v) => s + (v || 0), 0);
    if (opening === null) opening = open; else if (Math.abs(open - opening) > 0.01) { console.error(`audit-ceiling-lead: ${id} ${arm}: opening wealth ${open} is not the first arm's ${opening}`); process.exit(3); }
    const survived = new Uint8Array(n), delivered = new Float64Array(n), target = new Float64Array(n), pot = new Float64Array(n), tax = new Float64Array(n);
    let bad = 0;
    paths.forEach((zs, k) => {
      const o = ST.runPath(E, sc, zs); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; target[k] = o.target; pot[k] = o.terminalPot; tax[k] = o.lifetimeTax;
      if (k < CHECK) { const q = E.runTrial(sc, Float64Array.from(zs)); if (q.survived !== o.survived || q.lifetimeTax !== o.lifetimeTax) bad++; }
    });
    if (bad) { console.error(`audit-ceiling-lead: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const c = r.meta && r.meta.coarse, probe = probeOf(E, sc.P);
    arms[arm] = { probe, inputs, digest: await D.digestOf(D.tablesOf(r)), rest: `pts ${pts} | coarse ${c ? (c.off ? `off (${c.off})` : 'on') : 'none'} | tieAboveCap ${r.meta && r.meta.tieAboveCap !== undefined ? r.meta.tieAboveCap : (r.tieAboveCap !== undefined ? r.tieAboveCap : 'unread')}`, solveSecs, survived, delivered, target, pot, tax };
    console.log(`${''.padEnd(8)} ran ${arm}: pensionCeiling at the allowance ${probe.pa} (raw ${probe.rawPa}), at the basic ceiling ${probe.band} (raw ${probe.rawBand}); tables ${arms[arm].digest.slice(0, 12)} | ${arms[arm].rest}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; the engine against E.runTrial on the first ${Math.min(CHECK, n)} paths the same`);
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, seed: SEED, N: n, pts, inputs, candidate: CANDIDATE_HASH, opening, cap: CAP_TIMES * opening, stamp: STAMP, cpu: cpus()[0].model,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ...x, survived: b64(x.survived), delivered: b64(x.delivered), target: b64(x.target), pot: b64(x.pot), tax: b64(x.tax) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
