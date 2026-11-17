/*
 * A WIDER JOINT MOVE FOR COUPLES (JOINT-WIDE.md, its rule committed before any launch; D111 (2); EXPLORATORY, seed 7002,
 * deciding nothing but by the rule JOINT-WIDE.md commits). One unit one couple: TIE-C2's twelve (couples-panel-d4b.json at
 * its landed targets: the younger cohort's eight and the library's four, each at 60/40) and the share rules' eight couples'
 * 90/10 and feature units (share-rules-panel.json at its landed targets). Each solved once on the couples' default as the app
 * solves a couple (audit-couples.mjs solverPlan('CANDC', ...), each person by solveForApp at 45 points with the partner's
 * age and without the single's tie-break, as TIE-C2's audit and the share rules' did; solveCouple on APP_COUPLE's share rule
 * with its joint move, src/solverSettings.js appJoint: LOOKHOLD since D109); its arms take those tables:
 *   K2  the default as it stands (couple.js solveCouple's topK unset: each person's top two moves);
 *   K4  each person's top four;
 *   K6  each person's top six.
 * Each run by the engine on the same N paths of seed 7002 at arm A's MPAA ages (audit-phase4.mjs runPath), the arms' order
 * rotated by unit (unit k runs ARMS[k mod 3] first), each arm's paths timed by the process's CPU time (process.cpuUsage, user
 * and system) after WARM untimed paths, the wall clock beside; its first CHECK paths then held to E.runTrial. Each arm's paths
 * run in chunks of CHUNK, each chunk saved as it ends (<out>/parts/<id>-<arm>.json.gz): a unit run again after a restart
 * takes an arm's saved chunks when they are this unit's as solved now (the stamp, the seed, the paths, the chunk, each person's
 * table digest and the arm's options) and goes on from the next path; each chunk records its CPU time, the CPU model and the
 * process it ran in (JOINT-WIDE.md's amendment 2). Stored for each
 * path and arm: survival, the failure year, the pot left, the estate, lifetime tax, spending delivered and unmet spending;
 * each person's table digest before the first arm and after the last; the household's cap; each arm's options read back from
 * the fields the chooser reads (cp.topK among them). The replays on the first REPLAY paths, in the exact model:
 *   along K2's own path, at each decision before the last year, each wider arm's chooser at K2's state: its best score before
 *   the tie rule and the hold against K2's (each person's top two lead their top four and six, so a wider set holds K2's and
 *   cannot score lower: one that does is a STOP), the decisions where it scores higher, where it funds a year K2's cannot, and
 *   where its pick differs from K2's (at another spending level, another split, another tier pair);
 *   along each wider arm's own path, the decisions where its pick differs from K2's at the same state.
 * Units go to results/joint-wide-<seed>/ (JW_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and <id>.json.gz.
 * reduce-joint-wide.mjs reads them.
 *   node research/solver/audit-joint-wide.mjs part k/n      node research/solver/audit-joint-wide.mjs --units
 *   JW_PTS the points, JW_N the paths, JW_REPLAY the replays' paths; JW_CHUNK the chunk, JW_STOP_AFTER a stop after so many
 *   chunks, JW_PLANT=offbyone a path skipped on resuming (the resume check, joint-wide-resume.mjs) (each a smoke only); JW_OUT
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { APP_COUPLE, appJoint } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { PANEL_FILE, solverPlan, wantProblems, coupleProblems } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple, chooseJoint } = CPL;
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, REPLAY = 100, WARM = 3, CHUNK = 1000;
/* this process, as each chunk records it (JOINT-WIDE.md's amendment 2: a unit stopped by a restart picks up from its last saved
   chunk, and the time measure reads the units whose three arms ran in one process) */
const PROC = `${hostname()}:${process.pid}:${Date.now()}`;
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const WIDTHS = { K2: 2, K4: 4, K6: 6 }, ARMS = Object.keys(WIDTHS), WIDER = ['K4', 'K6'];
/* the couples' default joint move, as the page assembles a couple (D99's share rule, D109's LOOKHOLD) */
export const JOINT = Object.freeze({ shareRule: APP_COUPLE.shareRule, ...appJoint() });
export const optsOf = arm => ({ ...JOINT, ...(WIDTHS[arm] !== 2 ? { topK: WIDTHS[arm] } : {}) });
/* the units, the longest horizons first: TIE-C2's younger eight and library four, then the share rules' 90/10 and feature
   units, each couple of theirs once in each group */
export const UNITS = Object.freeze([
  ...['S327F', 'S329F', 'S331F', 'S333F', 'S335F', 'S337F', 'S341F', 'S343F'].map(id => ({ id, panel: 'd4b', group: 'younger' })),
  ...['S149', 'S167', 'S205', 'S223'].map(id => ({ id, panel: 'd4b', group: 'library' })),
  ...['S023', 'S061', 'S109', 'S147', 'S191', 'S227', 'S271', 'S377'].map(c => ({ id: `${c}-90`, panel: 'share', group: '90/10' })),
  ...['S023-db', 'S061-dbpart', 'S109-sppart', 'S147-db', 'S191-dbpart', 'S227-sppart', 'S271-db', 'S377-dbpart'].map(id => ({ id, panel: 'share', group: 'feature' }))
].map(Object.freeze));
/* unit k's order of the arms: each arm first on a third of the units */
export const orderOf = k => ARMS.map((_, i) => ARMS[(k + i) % ARMS.length]);
export const STAMP_FILES = ['audit-joint-wide.mjs', 'reduce-joint-wide.mjs', 'JOINT-WIDE.md', 'batch-joint-wide.sh', 'audit-couples.mjs', 'audit-couples-share.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'share-rules-panel.mjs', 'couples-panel-d4b.json', 'share-rules-panel.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = id => `${id}.json.gz`;
/* each arm's options as the chooser reads them (cp's fields) and as the couple's record carries them (meta) */
export const optionsOf = cp => ({ shareRule: cp.meta.shareRule ?? null, tieJoint: cp.tieJoint ?? null, tieLook: cp.tieLook ?? null, holdPast: cp.holdPast ?? null, topK: cp.topK ?? null, meta: { tieJoint: cp.meta.tieJoint ?? null, tieLook: cp.meta.tieLook ?? null, holdPast: cp.meta.holdPast ?? null } });
const js = x => JSON.stringify(x);
const tiersOf = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' ');
const same = (a, b) => a.spendLevel === b.spendLevel && a.split === b.split && js(a.perOwner) === js(b.perOwner) && js(a.steps) === js(b.steps);
/* a unit's plan, its cohort and (on the share rules' panel) the policy arm A was landed on */
function unitOf(u) {
  if (u.panel === 'd4b') { const h = readPanel(PANEL_FILE).find(x => x.id === u.id); return h ? { plan: h.plan, cohort: h.cohort, label: null } : null; }
  const s = readSharePanel().find(x => x.id === u.id);
  return s ? { plan: s.plan, cohort: s.kind === 'feature' ? `feature ${s.feature}` : `held ${s.variant}`, label: s.label } : null;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.group}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-joint-wide: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.JW_OUT || join(HERE, 'results', `joint-wide-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.JW_PTS) || PTS, n = Number(process.env.JW_N) || N, nReplay = Math.min(n, Number(process.env.JW_REPLAY) || REPLAY), smoke = pts !== PTS || n !== N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), U = unitOf(u);
  if (!U) { console.error(`audit-joint-wide: ${u.id} is not in its panel`); process.exit(2); }
  const candidate = hashOf(COUPLES_CANDIDATE), order = orderOf(pk);
  console.log(`JOINT-WIDE (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.group}, ${U.cohort}), seed ${SEED}, ${n} paths, the replays on ${nReplay}, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}, the joint move ${js(JOINT)}; the arms in the order ${order.join(', ')}; node ${STAMP.node}`);
  const a = armA(appPlan(U.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  if (U.label !== null && a.label !== U.label) { console.error(`audit-joint-wide: ${u.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  const hp = solverPlan('CANDC', U.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now();
  const cps = Object.fromEntries(ARMS.map(arm => [arm, solveCouple(E, M, hp, { solveOne, ...optsOf(arm) })]));
  const solveSecs = (Date.now() - s0) / 1000, base = cps.K2;
  if (ARMS.some(arm => cps[arm].tables.self !== base.tables.self || cps[arm].tables.part !== base.tables.part)) { console.error(`audit-joint-wide: ${u.id}: an arm took other tables`); process.exit(3); }
  const lines = ['self', 'part'].map(w => settingsOf(base.tables[w]));
  // each person's settings the couples' registered run's (at a smoke's points and lattice the check cannot hold, and is skipped)
  const off = [...(smoke ? [] : lines.flatMap((line, i) => wantProblems('CANDC', line, W).map(p => `${i ? 'part' : 'self'}: ${p}`))), ...coupleProblems()];
  if (base.m.ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) off.push(`the household's minimum pot ${base.m.ctx.solvencyFloor}, not the panel's ${U.plan.config.solvencyFloor}`);
  if (off.length) { console.error(`audit-joint-wide: ${u.id}: ${off.join('; ')}`); process.exit(3); }
  const digest = async () => ({ self: await digestOf(tablesOf(base.tables.self)), part: await digestOf(tablesOf(base.tables.part)) });
  const before = await digest();
  const caps = [base.tables.self.estateCap || 0, base.tables.part.estateCap || 0], cap = caps[0] + caps[1];
  console.log(`${''.padEnd(8)} solved: ${solveSecs.toFixed(0)} s; share ${base.share} ${base.meta.shareRule}; caps ${caps.join(' and ')} | self: ${lines[0]} | part: ${lines[1]}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const ctxOf = cp => E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
  const T = ctxOf(base).totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const arms = {};
  const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
  const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
  const chunk = smoke && Number(process.env.JW_CHUNK) > 0 ? Number(process.env.JW_CHUNK) : CHUNK;
  let stopAfter = smoke && Number(process.env.JW_STOP_AFTER) > 0 ? Number(process.env.JW_STOP_AFTER) : 0;
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  for (const arm of order) {
    const cp = cps[arm], ctx = ctxOf(cp), o = optionsOf(cp), pf = partOf(OUT, u.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-joint-wide: ${u.id} ${arm}: another horizon`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [];
    // a saved part of this arm, from a process a restart stopped: taken only when it is this unit's as solved now
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.seed === SEED && P.N === n && P.pts === pts && P.chunk === chunk && js(P.digests) === js(before) && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); done = P.done; chunks = P.chunks;
        if (smoke && process.env.JW_PLANT === 'offbyone' && done < n) done += 1;   // the resume check's plant: a path skipped on resuming
        console.log(`${''.padEnd(8)} resumed ${arm} at path ${done} of ${n}, from a part saved by ${[...new Set(chunks.map(c => c.proc))].join(', ')}`);
      } else console.log(`${''.padEnd(8)} a saved part of ${arm} is not this unit's as solved now: ${arm} starts again`);
    }
    if (done < n) for (let k = 0; k < Math.min(WARM, n); k++) runPath(ctx, paths[k], false);
    while (done < n) {
      const to = Math.min(n, done + chunk), load0 = loadavg()[0], c0 = process.cpuUsage(), w0 = performance.now();
      for (let k = done; k < to; k++) {
        const r = runPath(ctx, paths[k], false);
        A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet;
      }
      const c = process.cpuUsage(c0);
      chunks.push({ from: done, to, cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [load0, loadavg()[0]], cpu: cpus()[0].model, proc: PROC });
      done = to;
      const tmp = `${pf}.tmp`;
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed: SEED, N: n, pts, chunk, digests: before, options: o, done, chunks, arrays: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
      renameSync(tmp, pf);
      // the resume check's stop (a smoke only): the process ends after so many chunks, as a restart would end it
      if (stopAfter && --stopAfter === 0) { console.log(`${''.padEnd(8)} stopped after a chunk of ${arm} (JW_STOP_AFTER)`); process.exit(75); }
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-joint-wide: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0), procs = [...new Set(chunks.map(x => x.proc))];
    arms[arm] = { options: o, cpuUs, wallMs, chunks, procs, cpus: [...new Set(chunks.map(x => x.cpu))], place: order.indexOf(arm), T, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    // at a smoke's settings no outcome is printed (the figures of a smoke decide nothing and are not the run's)
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: ${js({ topK: o.topK, tieJoint: o.tieJoint, tieLook: o.tieLook, holdPast: o.holdPast, shareRule: o.shareRule })}; engine ${surv}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path) in ${chunks.length} chunks and ${procs.length} process${procs.length > 1 ? 'es' : ''}, wall ${(wallMs / 1e3).toFixed(0)} s; runPath the same as E.runTrial on the first ${Math.min(CHECK, n)} paths`);
  }
  // the replays, in the exact model on the first nReplay paths, as runCouplePolicy steps a year
  const along = { decisions: 0, ...Object.fromEntries(WIDER.map(arm => [arm, { lower: 0, worst: 0, higher: 0, funds: 0, unfunded: 0, differ: 0, level: 0, split: 0, tiers: 0, first: null }])) };
  for (let k = 0; k < nReplay; k++) {
    const st = M.initialState(base.m);
    for (let t = 0; t <= T; t++) {
      const out0 = {}, j0 = chooseJoint(base, st, t, out0);
      if (t < T) {
        along.decisions++;
        for (const arm of WIDER) {
          const out = {}, j = chooseJoint(cps[arm], st, t, out), r = along[arm];
          const b0 = out0.best ? out0.best.score : null, b = out.best ? out.best.score : null;
          if (b0 !== null && b === null) { r.unfunded++; if (!r.first) r.first = `path ${k}, plan year ${t}: nothing funds the year where K2's best scores ${b0}`; }
          else if (b0 === null && b !== null) r.funds++;
          else if (b0 !== null) {
            if (b < b0) { r.lower++; r.worst = Math.max(r.worst, b0 - b); if (!r.first) r.first = `path ${k}, plan year ${t}: its best ${b} below K2's ${b0}`; }
            else if (b > b0) r.higher++;
          }
          if (!same(j, j0)) { r.differ++; if (j.spendLevel !== j0.spendLevel) r.level++; if (j.split !== j0.split) r.split++; if (tiersOf(j) !== tiersOf(j0)) r.tiers++; }
        }
      }
      const row = M.step(base.m, st, j0, t, CPL.ratesAt(base.m, paths[k], t));
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
  }
  const own = Object.fromEntries(WIDER.map(arm => [arm, { decisions: 0, differ: 0, level: 0 }]));
  for (const arm of WIDER) {
    const cp = cps[arm], r = own[arm];
    for (let k = 0; k < nReplay; k++) {
      const st = M.initialState(base.m);
      for (let t = 0; t <= T; t++) {
        const j = chooseJoint(cp, st, t);
        if (t < T) { r.decisions++; const j0 = chooseJoint(base, st, t); if (!same(j, j0)) { r.differ++; if (j.spendLevel !== j0.spendLevel) r.level++; } }
        const row = M.step(base.m, st, j, t, CPL.ratesAt(base.m, paths[k], t));
        if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
      }
    }
  }
  console.log(`${''.padEnd(8)} the replays on ${nReplay} paths: along K2's path ${along.decisions} decisions; ${WIDER.map(arm => { const r = along[arm]; return `${arm} best below K2's at ${r.lower} (the largest gap ${r.worst}), above at ${r.higher}, funding a year K2's cannot at ${r.funds}, nothing funding where K2's does at ${r.unfunded}; its pick differs at ${r.differ} (another level ${r.level}, split ${r.split}, tier pair ${r.tiers})`; }).join('; ')}`);
  console.log(`${''.padEnd(8)} along each wider arm's own path: ${WIDER.map(arm => `${arm} its pick differing from K2's at the same state at ${own[arm].differ} of ${own[arm].decisions} (another level ${own[arm].level})`).join('; ')}`);
  const after = await digest();
  writeFileSync(join(OUT, fileOf(u.id)), gzipSync(js({ k: pk, id: u.id, group: u.group, panel: u.panel, cohort: U.cohort, seed: SEED, N: n, nReplay, warm: WARM, pts, W, candidate, joint: JOINT, order, cap, caps, share: base.share, shareRule: base.meta.shareRule, digests: { before, after }, along, own, stamp: STAMP, cpu: cpus()[0].model, solveSecs, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, u.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
