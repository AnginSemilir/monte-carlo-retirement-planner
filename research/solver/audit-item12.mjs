/*
 * ITEM 12, STAGE A, ON THE PORT: APPROXIMATE CUTS ON A COUPLE'S PATH (the review of 9 Nov, item 12:
 * research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md; its own run and the prompt, research/reviews/2026-11-11/ITEM12-RUN.md;
 * D84; ITEM12-A.md; EXPLORATORY, seed 7002, deciding nothing but by the rule ITEM12-A.md commits). Runs only on a scratch
 * tree carrying the review's prototype of the joint options on the ported code (2026-11-09/prototype/couple-approx.diff:
 * COUPLE_APPROX); the shortlist and the tie-break are the port's own options (chooserShortlist, tieAboveCap; D85, D86).
 * One unit a couple: each person solved once at 45 points as the app solves them (solveCouple over solveForApp), then on
 * those tables every arm on the same 16,000 paths of seed 7002, scored by the engine (audit-phase4.mjs runPath, held to
 * E.runTrial on the base's first paths): each path's survival, spending delivered, pot left and lifetime tax; at every
 * decision, each person's equity weight held in pension and in ISA coming into it.
 *   base   the flat path on the whole menu (item 11 as committed), every switch off;
 *   a      the shortlist that passed item 7 as its stage B built it, in each person's ranking: chooserShortlist 'order' on
 *          each person's table, with the tie-break above the cap at 1e-4 on it (the slice acts only with it);
 *   b      a, with item 12's joint options: one read, the bridge search on 5 points and 3 steps, near.
 * An arm's switches are set on the solved tables after the solve, and what each arm records is read back from the tables
 * and the modules, not built from its name. Two identities first, each bit for bit or the unit stops: the path as it was
 * (COUPLE.flat off) against the flat path on the first ASIS paths; the whole menu with the tie-break on each person's
 * table against the base on the first TIE_SAME paths (a couple's ranking takes the chooser's scores, which the tie-break
 * does not touch). The tables are not touched by an arm: their digest is taken before the first and after the last.
 * Units go to results/item12-<seed>/ (ITEM12_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-item12.mjs reads them.
 *   node research/solver/audit-item12.mjs part k/n        node research/solver/audit-item12.mjs --units
 *   node research/solver/audit-item12.mjs --switch-check [id]   (light: a solve handed the options against the switches set after)
 *   node research/solver/audit-item12.mjs --choice              (the couples against the touched list, the panel and the review's eight)
 *   ITEM12_PTS the points (smoke only); ITEM12_N the paths (smoke only); ITEM12_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as SOLVE from '../../src/solver/solve.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp, prepareForSolve } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { runPath } from './audit-phase4.mjs';
import { settingsOf } from './audit-speed.mjs';
import { touchedAll } from './held-out.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple, COUPLE } = CPL;
export const SEED = 7002, N = 16000, PTS = 45, ASIS = 20, TIE_SAME = 200, CHECK = 200, TIE = 1e-4;
/* The eight couples (ITEM12-A.md's rule of choice): touched, none in the panel, none of the review's eight; as the library
   enters them. BRIDGE: those the choice counts on for years before pension access (each unit records the years its tables
   hold, and the gate holds the four to at least one). */
export const COUPLES = ['S009', 'S079', 'S137', 'S153', 'S173', 'S253', 'S315', 'S415'], BRIDGE = ['S137', 'S153', 'S173', 'S415'];
export const REVIEWS = ['S007', 'S127', 'S209', 'S261', 'S303', 'S391', 'S313'];
export const UNITS = COUPLES.map(id => ({ id }));
/* an arm's switches: the shortlist and the tie-break on each person's table, the joint options on the module */
export const ARMS = {
  base: { short: null, tie: 0, oneRead: false, shareN: 8, shareIters: 10, near: false },
  a: { short: 'order', tie: TIE, oneRead: false, shareN: 8, shareIters: 10, near: false },
  b: { short: 'order', tie: TIE, oneRead: true, shareN: 4, shareIters: 3, near: true }
};
const WHOLE_TIE = { ...ARMS.base, tie: TIE };
export const STAMP_FILES = ['audit-item12.mjs', 'reduce-item12.mjs', 'ITEM12-A.md', 'audit-phase4.mjs', 'audit-speed.mjs', 'reduce-speed.mjs', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const worldsOf = tab => [tab, ...(tab.worlds || [])];
/* set an arm: as researchFinish sets the two options from a solve's own (the shortlist on the table, the margin on the
   table and its worlds), and the prototype's joint options on its module; null: everything off */
export function setArm(cp, arm) {
  const A = arm || ARMS.base, X = CPL.COUPLE_APPROX;
  for (const who of ['self', 'part']) {
    const tab = cp.tables[who];
    if (A.short) tab.chooserShortlist = A.short; else delete tab.chooserShortlist;
    for (const x of worldsOf(tab)) { if (A.tie) x.tieAboveCap = A.tie; else delete x.tieAboveCap; }
  }
  X.oneRead = A.oneRead; X.shareN = A.shareN; X.shareIters = A.shareIters; X.near = A.near; X.screen = 0; X.nodraw = false;
  cp._flat = undefined;   // the flat path's arrays are built again for the arm
}
/* what is switched as the run sees it, read back from the tables and the modules */
export function switchesOf(cp) {
  const X = CPL.COUPLE_APPROX, per = who => { const t = cp.tables[who]; return `${t.chooserShortlist || 'whole'}/${[...new Set(worldsOf(t).map(x => x.tieAboveCap || 0))].join(',')}`; };
  return `ranking self ${per('self')} part ${per('part')} | joint oneRead ${X.oneRead} search ${X.shareN + 1}x${X.shareIters} near ${X.near} screen ${X.screen} nodraw ${X.nodraw} | flat ${COUPLE.flat} fast ${COUPLE.fast}`;
}
/* what an arm should record (reduce-item12.mjs's gate) */
export const wantOf = A => { const p = `${A.short || 'whole'}/${A.tie || 0}`; return `ranking self ${p} part ${p} | joint oneRead ${A.oneRead} search ${A.shareN + 1}x${A.shareIters} near ${A.near} screen 0 nodraw false | flat true fast true`; };
export function planOf(id) {
  const sc = buildScenarios().find(s => s.id === id);
  if (!sc) throw new Error(`audit-item12: no library plan ${id}`);
  if (sc.plan.demographics.planningMode === 'single') throw new Error(`audit-item12: ${id} is not a couple`);
  return E.normalizePlan(JSON.parse(JSON.stringify(sc.plan)));
}
/* the couples are touched, outside the panel (either panel file's base ids; ids only) and outside the review's eight */
export function choiceProblems(ids = COUPLES) {
  const P = [], t = touchedAll(), panel = new Set();
  for (const f of ['couples-panel-d4b.json', 'couples-panel.json']) if (existsSync(join(HERE, f))) for (const x of JSON.parse(readFileSync(join(HERE, f), 'utf8')).panel) { panel.add(x.base); panel.add(x.id); }
  if (!panel.size) P.push('no panel file to hold the couples against');
  for (const id of ids) {
    if (!t.has(id)) P.push(`${id} is not touched`);
    if (panel.has(id) || panel.has(`${id}F`)) P.push(`${id} is in the panel`);
    if (REVIEWS.includes(id)) P.push(`${id} is one of the review's eight`);
  }
  return P;
}
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});
const solveIt = (plan, pts, research = {}) => solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { ...light(pts), ...research } }) });
const bridgeYears = tab => (tab.g && tab.g.reader ? tab.g.reader.years.reduce((s, b) => s + (b ? 1 : 0), 0) : 0);
const sameOut = (x, y) => x.survived === y.survived && Object.is(x.wealth, y.wealth) && Object.is(x.tax, y.tax) && Object.is(x.delivered, y.delivered);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  if (args[0] === '--choice') { const bad = choiceProblems(); console.log(bad.length ? `the choice: ${bad.join('; ')}` : `the choice: ${COUPLES.join(', ')}: each touched, none in the panel (couples-panel-d4b.json, couples-panel.json: ids only), none of the review's eight`); process.exit(bad.length ? 1 : 0); }
  if (!CPL.COUPLE_APPROX || !('near' in CPL.COUPLE_APPROX)) { console.error('audit-item12: this tree has not the review\'s prototype of the joint options (COUPLE_APPROX): run it on the scratch tree (ITEM12-A.md)'); process.exit(2); }
  if (!SOLVE.SHORTLIST) { console.error('audit-item12: this tree has not the port\'s shortlist (SHORTLIST)'); process.exit(2); }
  if (args[0] === '--switch-check') {
    // light: a couple solved with the two options handed to each person's solve gives the paths of the plain solve with
    // the switches set afterwards, bit for bit (so setting them on the solved tables is the option as the port built it)
    const id = args[1] || 'S137', n = 200, plan = planOf(id);
    const plain = solveIt(plan, 6), handed = solveIt(plan, 6, { chooserShortlist: 'order', tieAboveCap: TIE });
    const run = (cp, arm, set) => { if (set) setArm(cp, arm); else cp._flat = undefined; const ctx = E.buildContext(withCouple(cp.plan, cp)), paths = E.pathsForSeed(SEED, n, ctx.totalYears); SOLVE.SHORTLIST.stats.decisions = 0; const out = paths.map(zs => runPath(ctx, Float64Array.from(zs), false)); return { out, sw: switchesOf(cp), listed: SOLVE.SHORTLIST.stats.decisions }; };
    const base = run(plain, ARMS.base, true), after = run(plain, ARMS.a, true); setArm(plain, null);
    const opt = run(handed, null, false);
    const differ = after.out.filter((x, i) => !sameOut(x, opt.out[i])).length, moved = after.out.filter((x, i) => !sameOut(x, base.out[i])).length;
    console.log(`switch check (EXPLORATORY, ${id} at 6 points, ${n} paths of seed ${SEED}): the options handed to each person's solve: ${opt.sw}; meta ${handed.tables.self.meta.chooserShortlist}/${handed.tables.self.meta.tieAboveCap}; set after the solve: ${after.sw}`);
    console.log(`  paths that differ between the two: ${differ} of ${n} (rankings from a shortlist: ${opt.listed} and ${after.listed}); paths the arm moves against the whole menu: ${moved} of ${n}`);
    console.log(differ === 0 && moved > 0 && opt.listed > 0 && opt.listed === after.listed ? 'SWITCH CHECK: THE SAME' : 'SWITCH CHECK: FAILED');
    process.exit(differ === 0 && moved > 0 && opt.listed > 0 && opt.listed === after.listed ? 0 : 1);
  }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-item12: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.ITEM12_OUT || join(HERE, 'results', `item12-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.ITEM12_PTS) || PTS, n = Number(process.env.ITEM12_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], id = u.id;
  console.log(`ITEM12-A (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths, ${pts} points; node ${STAMP.node}`);
  const t0 = Date.now();
  const plan = planOf(id), inputs = hashOf(plan);
  const s0 = Date.now(), cp = solveIt(plan, pts), solveSecs = (Date.now() - s0) / 1000;
  setArm(cp, null);
  const ctx0 = E.buildContext(withCouple(cp.plan, cp)), T = ctx0.totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const digest = async () => `${await digestOf(tablesOf(cp.tables.self))}/${await digestOf(tablesOf(cp.tables.part))}`;
  const digest0 = await digest();
  // the couple's lifetime target: each year's scheduled target where the household has one (the same on every path)
  let lifeTarget = 0; { const st = E.freshState(ctx0), zs = paths[0], zPath = zs.length > T + 1 ? zs[T + 1] : 0; for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx0, st, t, { z: zs[t], zPath }); if (row.targetSpend > 0) lifeTarget += E.spendTargetAtAge(ctx0, row.ageSelf); } }
  const settings = ['self', 'part'].map(who => settingsOf(cp.tables[who])), coarse = ['self', 'part'].map(who => { const c = cp.tables[who].meta.coarse; return c ? (c.off ? `off (${c.off})` : 'on') : 'none'; });
  const bridge = ['self', 'part'].map(who => bridgeYears(cp.tables[who]));
  console.log(`${id.padEnd(8)} case | unit ${pk} | years ${T + 1} | inputs ${inputs} | solve ${solveSecs.toFixed(0)} s | coarse ${coarse.join(' and ')} | years before pension access in the tables ${bridge.join(' and ')} | target £${Math.round(Number(cp.plan.spending.targetSpend))}, lifetime £${Math.round(lifeTarget)} | share ${cp.share} | tables ${digest0.slice(0, 16)}`);
  // each person's equity weight held in pension and in ISA coming into each decision: the plain sum over the decisions
  // (the rule's), and beside it the sum weighted by the wrapper's pot
  const owners = ctx0.owners.map(o => ({ key: o.key, pen: o.ids && o.ids.pen, isa: o.ids && o.ids.isa }));
  const slots = owners.flatMap(o => ['pen', 'isa'].map(cat => ({ key: o.key, cat, id: o[cat], profs: o[cat] ? ctx0.tierProfiles[o[cat]] : null })));
  const eq = { n: 0, sum: new Float64Array(4), wsum: new Float64Array(4), pot: new Float64Array(4) };
  const base = ctx0.policyOverride;
  const ctx = { ...ctx0, policyOverride: { ...base, choose(st, t, ...rest) {
    eq.n++;
    slots.forEach((s, j) => { if (!s.profs || !st.tierHeld || !st.tierHeld[s.key]) return; const w = s.profs[Math.min(st.tierHeld[s.key][s.cat] || 0, s.profs.length - 1)].equityWeight, p = st.pots[s.id] || 0; eq.sum[j] += w; eq.wsum[j] += w * p; eq.pot[j] += p; });
    return base.choose(st, t, ...rest);
  } } };
  const runArm = (A, m, flat = true) => {
    setArm(cp, A); COUPLE.flat = flat;
    for (const zs of paths.slice(0, 3)) runPath(ctx, zs, false);   // warm the code paths before timing
    eq.n = 0; eq.sum.fill(0); eq.wsum.fill(0); eq.pot.fill(0); for (const k of Object.keys(SOLVE.SHORTLIST.stats)) SOLVE.SHORTLIST.stats[k] = 0;
    const X = CPL.COUPLE_APPROX; if (X.stats) for (const k of Object.keys(X.stats)) X.stats[k] = 0;
    const sw = switchesOf(cp), survived = new Uint8Array(m), delivered = new Float64Array(m), pot = new Float64Array(m), tax = new Float64Array(m), out = [];
    const e0 = process.hrtime.bigint();
    for (let k = 0; k < m; k++) { const o = runPath(ctx, paths[k], false); out.push(o); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; pot[k] = o.wealth; tax[k] = o.tax; }
    const ms = Number(process.hrtime.bigint() - e0) / 1e6 / m;
    const r = { sw, ms, out, survived, delivered, pot, tax, eq: { n: eq.n, sum: Array.from(eq.sum), wsum: Array.from(eq.wsum), pot: Array.from(eq.pot) }, short: { ...SOLVE.SHORTLIST.stats }, far: X.stats ? X.stats.far : 0 };
    setArm(cp, null); COUPLE.flat = true;
    return r;
  };
  const arms = {};
  arms.base = runArm(ARMS.base, n);
  // the base against E.runTrial on its first paths
  { let d = 0; const m = Math.min(CHECK, n); setArm(cp, null); for (let k = 0; k < m; k++) { const q = E.runTrial(ctx0, paths[k]), o = arms.base.out[k]; if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) d++; }
    if (d) { console.error(`audit-item12: ${id}: runPath differs from E.runTrial on ${d} of the first ${m} paths`); process.exit(3); }
    console.log(`${''.padEnd(8)} the base against E.runTrial on the first ${m} paths: the same`); }
  // the two identities
  const asIs = runArm(ARMS.base, Math.min(ASIS, n), false), dA = asIs.out.filter((x, i) => !sameOut(x, arms.base.out[i])).length;
  const wt = runArm(WHOLE_TIE, Math.min(TIE_SAME, n)), dT = wt.out.filter((x, i) => !sameOut(x, arms.base.out[i])).length;
  console.log(`${''.padEnd(8)} identities: the path as it was against the flat path, ${asIs.out.length} paths: ${dA} differ (${asIs.ms.toFixed(1)} ms a path as it was); the whole menu with the tie-break on each person's table against the base, ${wt.out.length} paths: ${dT} differ (${wt.sw})`);
  if (dA || dT) { console.error(`audit-item12: ${id}: IDENTITY FAILED`); process.exit(3); }
  for (const name of ['a', 'b']) arms[name] = runArm(ARMS[name], n);
  for (const [name, x] of Object.entries(arms)) {
    console.log(`${''.padEnd(8)} ran ${name}: ${x.sw} | self: ${settings[0]} | part: ${settings[1]}`);
    console.log(`${''.padEnd(8)} done ${name}: a path ${x.ms.toFixed(2)} ms; rankings from a shortlist ${x.short.decisions} (the whole menu after all ${x.short.fallback}, sliced ${x.short.sliced}); pairs not tried at a far split ${x.far}`);
  }
  const digest1 = await digest();
  console.log(`${''.padEnd(8)} the tables after the arms: ${digest1 === digest0 ? 'the same' : 'CHANGED'} (${digest1.slice(0, 16)})`);
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, seed: SEED, N: n, pts, inputs, stamp: STAMP, cpu: cpus()[0].model, solveSecs, years: T + 1, target: Number(cp.plan.spending.targetSpend), lifeTarget, share: cp.share, coarse, bridge, settings, digest0, digest1,
    slots: slots.map(s => `${s.key} ${s.cat}${s.profs ? '' : ' (none)'}`), identities: { asIs: { n: asIs.out.length, differ: dA, ms: asIs.ms }, wholeTie: { n: wt.out.length, differ: dT, sw: wt.sw } },
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { sw: x.sw, ms: x.ms, eq: x.eq, short: x.short, far: x.far, survived: b64(x.survived), delivered: b64(x.delivered), pot: b64(x.pot), tax: b64(x.tax) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
