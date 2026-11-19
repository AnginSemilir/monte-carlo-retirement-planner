/*
 * WHAT KEYS THE GUARD, THE AUDIT (GUARD-KEY.md, its rule committed before any unit was landed or run; D129 (4);
 * EXPLORATORY, the tuning seed). The units of guard-panel.json (step 5's four couples 8 or 12 years apart without a DB
 * pension, each with S147-db's DB pension or with rent, landed on seed 7005), each run on the same 4,000 paths of seed 7002
 * under two arms, as step 5's audit ran them (audit-shapes.mjs), APP first on even units and K2 first on odd:
 *   APP  arm A, the app's rules, on the plan as entered;
 *   K2   the couples' default, solved by solveCouple whatever the guard says of the couple.
 * Each arm held to E.runTrial on its first 200 paths and saved in chunks of 1,000 (resumable, as step 5's). Recorded beside:
 * K2's solve time, each arm's CPU a path, the two tables' forecast at the start, and the app's guard's answer on the plan
 * as entered (src/couplesSwitch.js coupleSolverOn, the guard as built). At a smoke's settings (GD_PTS, GD_N) no outcome is
 * printed.
 *   node research/solver/audit-guard.mjs part k/<units>     (batch-guard.sh runs every unit)
 *   node research/solver/audit-guard.mjs --units
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { coupleSolverOn } from '../../src/couplesSwitch.js';
import { runPath } from './audit-phase4.mjs';
import { JOINT } from './audit-household.mjs';
import { solverPlanOf, PANEL as SHAPES_PANEL } from './shapes-panel.mjs';
import { readGuardPanel, PANEL as GUARD_PANEL } from './guard-panel.mjs';
import { wantProblems, coupleProblems, PANEL_FILE } from './audit-couples.mjs';
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
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, WARM = 3, CHUNK = 1000;
const PROC = `${hostname()}:${process.pid}:${Date.now()}`;
export const ARMS = ['APP', 'K2'];
export const orderOf = k => (k % 2 ? ['K2', 'APP'] : ['APP', 'K2']);
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id.replace('@', '_').replace('+', '_')}.json.gz`;
export const STAMP_FILES = ['audit-guard.mjs', 'guard-panel.mjs', 'reduce-guard.mjs', 'GUARD-KEY.md', 'batch-guard.sh', 'guard-panel.json', 'shapes-panel.mjs', 'shapes-panel.json', 'share-rules-panel.mjs', 'share-rules-panel.json', 'audit-household.mjs', 'audit-couples.mjs', 'audit-couples-share.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'phase4-panel.mjs', 'couples-panel-d4b.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : f === 'shapes-panel.json' ? SHAPES_PANEL : f === 'guard-panel.json' ? GUARD_PANEL : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const optionsOf = (arm, cp) => (arm === 'K2' ? { shareRule: cp.meta.shareRule ?? null, tieJoint: cp.tieJoint ?? null, tieLook: cp.tieLook ?? null, holdPast: cp.holdPast ?? null, topK: cp.topK ?? null } : { app: 'armA' });
const js = x => JSON.stringify(x);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const units = readGuardPanel();
  if (args[0] === '--units') { units.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(units.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-guard: part k/${units.length}`); process.exit(2); }
  const OUT = process.env.GD_OUT || join(HERE, 'results', `guard-${SEED}`);
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const pts = Number(process.env.GD_PTS) || PTS, n = Number(process.env.GD_N) || N, smoke = pts !== PTS || n !== N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const U = units[pk], t0 = Date.now(), order = orderOf(pk), candidate = hashOf(COUPLES_CANDIDATE);
  const shape = U.shapeId.split('@')[1];
  const { a, hp, mirrored } = solverPlanOf(U.plan, shape);
  console.log(`GUARD (EXPLORATORY): unit ${pk}/${pn}: ${U.id} (${U.shapeId}, the income ${U.kind}), target ${U.target} (step 5 ${U.step5}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}, the joint move ${js(JOINT)}; arm A ${a.label}`);
  if (a.label !== U.label) { console.error(`audit-guard: ${U.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  if (mirrored) { console.error(`audit-guard: ${U.id}: a mirrored unit (GUARD-KEY.md has none)`); process.exit(3); }
  const guard = coupleSolverOn(U.plan);
  const aDemo = E.resolveMpaa(a.planState).demographics, ages = { mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart };
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now();
  const k2 = CPL.solveCouple(E, M, hp, { solveOne, ...JOINT });
  const solveSecs = { APP: 0, K2: (Date.now() - s0) / 1000 };
  const lines = ['self', 'part'].map(w => settingsOf(k2.tables[w]));
  const off = [...(smoke ? [] : lines.flatMap((line, i) => wantProblems('CANDC', line, W).map(p => `${i ? 'part' : 'self'}: ${p}`))), ...coupleProblems()];
  if (k2.m.ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) off.push(`the household's minimum pot ${k2.m.ctx.solvencyFloor}, not the unit's ${U.plan.config.solvencyFloor}`);
  const inc = (U.plan.otherIncomes || []).filter(i => Number(i.amount) === 15000 && i.incomeType === 'otherTaxable' && i.owner === 'Myself');
  if (inc.length !== 1) off.push(`the plan carries ${inc.length} incomes of £15,000 of the first person's, not one`);
  if (off.length) { console.error(`audit-guard: ${U.id}: ${off.join('; ')}`); process.exit(3); }
  const digest = async () => ({ self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)) });
  const before = await digest();
  const caps = [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], cap = caps[0] + caps[1];
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), forecast = { APP: null };
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s; share ${k2.share}; caps ${caps.join(' and ')}; the app's guard on the plan as entered: ${js(guard)}`);
  const ctxOf = arm => {
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-guard: ${U.id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, couple ${ctx.isCouple}: not the app's rules`); process.exit(3); }
      return ctx;
    }
    return E.buildContext(CPL.withCouple({ ...k2.plan, demographics: { ...k2.plan.demographics, ...ages } }, k2));
  };
  const T = ctxOf('K2').totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const arms = {}, b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
  const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
  const chunk = smoke && Number(process.env.GD_CHUNK) > 0 ? Number(process.env.GD_CHUNK) : CHUNK;
  for (const arm of order) {
    const cp = arm === 'K2' ? k2 : null, ctx = ctxOf(arm), o = optionsOf(arm, cp), pf = partOf(OUT, U.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-guard: ${U.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.seed === SEED && P.N === n && P.pts === pts && P.chunk === chunk && js(P.digests) === js(before) && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); done = P.done; chunks = P.chunks;
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
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-guard: ${U.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0);
    arms[arm] = { options: o, cpuUs, wallMs, chunks, procs: [...new Set(chunks.map(x => x.proc))], cpus: [...new Set(chunks.map(x => x.cpu))], place: order.indexOf(arm), T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: ${js(o)}; engine ${surv}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  const after = await digest();
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, shapeId: U.shapeId, kind: U.kind, target: U.target, step5: U.step5, seed: SEED, N: n, pts, W, candidate, joint: JOINT, order, cap, caps, share: k2.share, shareRule: k2.meta.shareRule, guard, stamp: STAMP, digests: { before, after }, T, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
