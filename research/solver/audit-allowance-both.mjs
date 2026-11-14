/*
 * THE ALLOWANCE'S STEP AT BOTH PLACES, THE SOLVER CHOOSING (ALLOWANCE-BOTH.md; D98; EXPLORATORY, seed 7002). One unit a
 * household of the review's eight, three arms in it, each solved at 45 points by the app's own route (solveForApp) and run on
 * the same 16,000 paths of seed 7002 (solverStrategy runPath), its first CHECK paths held to its engine's E.runTrial:
 *   NOW    the candidate as it is (menuPlus ['hr']);
 *   BOTH   the candidate with menuPlus ['hr', 'paraw']: the allowance as given offered beside the allowance as now, as a draw
 *          step ('penPAr') and as a re-wrap ceiling ('paraw');
 *   RAWPA  the candidate on an engine whose pensionCeiling leaves the allowance as given everywhere (CEILING-LEAD.md's RAWPA,
 *          its patch as there: audit-ceiling-lead.mjs engineFor), beside the rule.
 * Stored for each path: survival, the year it fails, the spending delivered and target, each year's spending level, the pot
 * left, the estate and lifetime tax. For each arm: its menu's size, its tables' digest, its settings, its solve's seconds, its
 * whole score's inputs (reduce-phase4.mjs wholeScore), its pensionCeiling read back at the allowance and the basic-rate
 * ceiling (audit-ceiling-lead.mjs probeOf), and how often its moves draw first through penPAr or re-wrap to 'paraw' over the
 * first CHECK paths. Units go to results/allowance-both-<seed>/ (ABOTH_OUT): case<k>.txt, the log, stamped (fair-gate.mjs
 * LOG_STAMP), and <id>.json.gz. reduce-allowance-both.mjs reads them.
 *   node research/solver/audit-allowance-both.mjs part k/n      node research/solver/audit-allowance-both.mjs --units
 *   ABOTH_PTS the points (smoke only); ABOTH_N the paths (smoke only); ABOTH_OUT the folder
 */
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HOUSEHOLDS } from './audit-ceiling.mjs';
import { engineFor, probeOf } from './audit-ceiling-lead.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..');
export const SEED = 7002, N = 16000, PTS = 45, CHECK = 200, CAP_TIMES = 4, W = 0.02;
export const ARMS = ['NOW', 'BOTH', 'RAWPA'];
export const MENU = { NOW: ['hr'], BOTH: ['hr', 'paraw'], RAWPA: ['hr'] };
export { HOUSEHOLDS };
export const UNITS = HOUSEHOLDS.map(id => ({ id }));
export const STAMP_FILES = ['audit-allowance-both.mjs', 'reduce-allowance-both.mjs', 'ALLOWANCE-BOTH.md', 'batch-allowance-both.sh', 'audit-ceiling.mjs', 'audit-ceiling-lead.mjs', 'reduce-ceiling.mjs', 'reduce-isasweep.mjs', 'reduce-phase4.mjs', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});
/* a move draws first through penPAr (among the pension steps before the first other source) or re-wraps to 'paraw' */
export const leadsRaw = mv => { const st = mv.steps || [], i = st.findIndex(x => !x.startsWith('pen')); return st.slice(0, i < 0 ? st.length : i).includes('penPAr'); };
export const wrapsRaw = mv => !!mv.harvest && mv.harvestCeil === 'paraw';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-allowance-both: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.ABOTH_OUT || join(HERE, 'results', `allowance-both-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.ABOTH_PTS) || PTS, n = Number(process.env.ABOTH_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const at2 = p => import(pathToFileURL(join(ROOT, p)).href);
  const M = await at2('src/solver/model.js'), A = await at2('src/solverApp.js'), ST = await at2('src/solverStrategy.js'), D = await at2('src/solverDigest.js'), P4 = await at2('research/solver/phase4-panel.mjs');
  const { CANDIDATE_HASH } = await at2('research/solver/candidate.mjs');
  const u = UNITS[pk], id = u.id, t0 = Date.now();
  const plan = P4.readPanel().find(h => h.id === id).plan, inputs = hashOf(plan);
  console.log(`ALLOWANCE-BOTH (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths, ${pts} points, the candidate ${CANDIDATE_HASH}; node ${STAMP.node}`);
  const arms = {}; let opening = null;
  for (const arm of ARMS) {
    const E = await engineFor(arm === 'RAWPA' ? 'RAWPA' : 'NOW');
    const s0 = Date.now(), r = A.solveForApp(E, M, plan, { points: pts, research: { ...light(pts), menuPlus: MENU[arm] } }), solveSecs = (Date.now() - s0) / 1000;
    const sc = ST.solvedContext(E, r), T = sc.totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, n, T);
    const open = Object.values(E.freshState(sc).pots).reduce((s, v) => s + (v || 0), 0);
    if (opening === null) opening = open; else if (Math.abs(open - opening) > 0.01) { console.error(`audit-allowance-both: ${id} ${arm}: opening wealth ${open} is not the first arm's ${opening}`); process.exit(3); }
    const survived = new Uint8Array(n), failYear = new Int16Array(n), delivered = new Float64Array(n), target = new Float64Array(n), pot = new Float64Array(n), estate = new Float64Array(n), tax = new Float64Array(n), level = new Uint8Array(n * Y);
    let bad = 0;
    paths.forEach((zs, k) => {
      const o = ST.runPath(E, sc, zs);
      survived[k] = o.survived ? 1 : 0; failYear[k] = o.failT; delivered[k] = o.delivered; target[k] = o.target; pot[k] = o.terminalPot; estate[k] = o.terminalPotNet; tax[k] = o.lifetimeTax;
      for (let t = 0; t < Y; t++) level[k * Y + t] = Math.min(255, o.level[t]);
      if (k < CHECK) { const q = E.runTrial(sc, Float64Array.from(zs)); if (q.survived !== o.survived || q.lifetimeTax !== o.lifetimeTax) bad++; }
    });
    if (bad) { console.error(`audit-allowance-both: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    // how often the solved plan draws first through penPAr or re-wraps to 'paraw', over the first CHECK paths (the same runs
    // again, the table's move read as the engine takes it; nothing is stored from these runs but the counts)
    const pol = sc.policyOverride, seen = { years: 0, lead: 0, wrap: 0 };
    sc.policyOverride = { ...pol, choose(st, t, held) { const mv = pol.choose(st, t, held); if (mv) { seen.years++; if (leadsRaw(mv)) seen.lead++; if (wrapsRaw(mv)) seen.wrap++; } return mv; } };
    for (const zs of paths.slice(0, Math.min(CHECK, n))) ST.runPath(E, sc, zs);
    sc.policyOverride = pol;
    const c = r.meta && r.meta.coarse, probe = probeOf(E, sc.P);
    const score = { lambda: r.meta.lambda, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), cap: r.meta.bequestCap };
    arms[arm] = { menuPlus: MENU[arm], menu: r.actions.length, probe, inputs, digest: await D.digestOf(D.tablesOf(r)), rest: `pts ${pts} | coarse ${c ? (c.off ? `off (${c.off})` : 'on') : 'none'} | tieAboveCap ${r.meta && r.meta.tieAboveCap !== undefined ? r.meta.tieAboveCap : 'unread'}`,
      solveSecs, Y, score, seen, survived, failYear, delivered, target, pot, estate, tax, level };
    console.log(`${''.padEnd(8)} ran ${arm}: menuPlus ${MENU[arm].join('+')}, ${r.actions.length} moves; pensionCeiling at the allowance ${probe.pa} (raw ${probe.rawPa}), at the basic ceiling ${probe.band} (raw ${probe.rawBand}); tables ${arms[arm].digest.slice(0, 12)} | ${arms[arm].rest}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; the engine against E.runTrial on the first ${Math.min(CHECK, n)} paths the same; over them ${seen.years} decision-years, drawing first through penPAr in ${seen.lead}, re-wrapping to 'paraw' in ${seen.wrap}`);
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const KEYS = ['survived', 'failYear', 'delivered', 'target', 'pot', 'estate', 'tax', 'level'];
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, seed: SEED, N: n, pts, W, inputs, candidate: CANDIDATE_HASH, opening, cap: CAP_TIMES * opening, stamp: STAMP, cpu: cpus()[0].model,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ...x, ...Object.fromEntries(KEYS.map(k => [k, b64(x[k])])) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
