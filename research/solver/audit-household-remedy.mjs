/*
 * THE REMEDY'S READ, THE AUDIT (HOUSEHOLD-REMEDY-READ.md, its rule committed before any unit ran; HOUSEHOLD-REMEDY.md;
 * D129 (3); EXPLORATORY, the tuning seed). The lead test's 28 units, each on the lead test's 4,000 paths of seed 7002:
 *   K2, HS   the lead test's stored arrays (K2; HS1, the household plan at the even split), used only after this unit's K2
 *            tables and HS's household table are solved again with the lead test's digests and each arm, run again on its
 *            first 200 paths, is the lead test's arrays there byte for byte;
 *   HSPB     the remedy's part 1 in its bands-alone form (opts.scale 'bands', HOUSEHOLD-REMEDY.md amendment 1: the cap
 *            doubled), at the even split;
 *   HSP      part 1 (household.mjs householdPlanFor's opts.scale 'pensions': the bands and the cap), at the even split;
 *   HSPS     parts 1 and 2 (cp.split 'pensions': the year's need at the pensions' share as they stand), on HSP's table.
 * Each form of part 1 has its own household table, solved as the lead test's was but on that form's plan (bandsAt: a band
 * for gains of k times one person's); each plan checked (the allowance doubled, each SCALED limit 2 x PA + k x (L - PA),
 * the cap k times one person's or, in the bands-alone form, HS's, every other doubled entry HS's) and its band for gains,
 * before any path. Each new arm held to E.runTrial on
 * its first 200 paths and saved in chunks of 1,000. At a smoke's settings (HR_PTS, HR_N) no outcome is printed and the
 * lead test's digests and arrays are not compared.
 *   node research/solver/audit-household-remedy.mjs part k/28     (batch-household-remedy.sh runs every unit)
 *   node research/solver/audit-household-remedy.mjs --units
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold, withHouseholdSingle, mergedState, DOUBLED, SCALED, pensionsSplit } from './household.mjs';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { UNITS, STAMP_FILES as LEAD_STAMP, unitPlans, householdSolveOne, houseLineProblems, JOINT, TOPK, SEED, N, PTS, W, CHECK, WARM, CHUNK } from './audit-household.mjs';
import { PANEL_FILE, wantProblems } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { runPath } from './audit-phase4.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple } = CPL;
const PROC = `${hostname()}:${process.pid}:${Date.now()}`;
export const NEW = Object.freeze({ HSPB: Object.freeze({ scale: 'bands', split: 'even' }), HSP: Object.freeze({ scale: 'pensions', split: 'even' }), HSPS: Object.freeze({ scale: 'pensions', split: 'pensions' }) });
export const ARMS = Object.freeze(['K2', 'HS', ...Object.keys(NEW)]);
export const LEAD_ARM = Object.freeze({ K2: 'K2', HS: 'HS1' });
export const LEAD_DIR = process.env.HR_LEAD || join(HERE, 'results', `household-${SEED}`);
export const STAMP_FILES = ['audit-household-remedy.mjs', 'reduce-household-remedy.mjs', 'HOUSEHOLD-REMEDY-READ.md', 'HOUSEHOLD-REMEDY.md', 'batch-household-remedy.sh', ...LEAD_STAMP];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id}.json.gz`;
const js = x => JSON.stringify(x);
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };

/* part 1's plan against what HOUSEHOLD-REMEDY.md says it is: the allowance doubled, each SCALED limit 2 x PA + k x (L - PA),
   the cap k times one person's, every other doubled entry as the as-built household plan's */
export function scaleProblems(hp, asBuilt, cfg, k, cap = true) {
  const one = key => E.num(cfg[key], E.DEFAULT_CONFIG[key]), pa = one('personalAllowance');
  const want = key => (key === 'personalAllowance' ? 2 * pa : SCALED.includes(key) ? 2 * pa + k * (one(key) - pa) : key === 'pclsMaxCap' && cap ? k * one(key) : asBuilt.config[key]);
  const bad = DOUBLED.filter(key => hp.config[key] !== want(key)).map(key => `${key} ${hp.config[key]}, not ${want(key)}`);
  for (const key of Object.keys({ ...hp.config, ...asBuilt.config })) if (!DOUBLED.includes(key) && js(hp.config[key]) !== js(asBuilt.config[key])) bad.push(`${key} ${js(hp.config[key])}, not design A's ${js(asBuilt.config[key])}`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.group}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-household-remedy: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.HR_OUT || join(HERE, 'results', `household-remedy-${SEED}`);
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const pts = Number(process.env.HR_PTS) || PTS, n = Number(process.env.HR_N) || N, smoke = pts !== PTS || n !== N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), UP = unitPlans(u);
  if (!UP) { console.error(`audit-household-remedy: ${u.id} is not in its panel`); process.exit(2); }
  const { U, a, hp, aDemo } = UP, candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`HOUSEHOLD-REMEDY (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.group}, ${U.cohort}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}, the joint move ${js(JOINT)}; arm A ${a.label}`);
  if (U.label !== null && a.label !== U.label) { console.error(`audit-household-remedy: ${u.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  const lead = smoke ? null : JSON.parse(gunzipSync(readFileSync(join(LEAD_DIR, fileOf(u.id)))).toString());
  if (lead && (lead.seed !== SEED || lead.N !== N || lead.pts !== PTS || lead.stamp.code !== STAMP.code)) { console.error(`audit-household-remedy: ${u.id}: the lead test's unit file is seed ${lead.seed}, ${lead.N} paths, ${lead.pts} points, code ${lead.stamp.code}; this run seed ${SEED}, ${n}, ${pts}, code ${STAMP.code}`); process.exit(3); }
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const key = JSON.stringify([p, o.partnerAge0]); if (!memo.has(key)) memo.set(key, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(key); };
  const solveHouse = householdSolveOne(pts, light), solveSecs = {};
  let s0 = Date.now();
  const k2 = solveCouple(E, M, hp, { solveOne, ...JOINT });
  solveSecs.K2 = (Date.now() - s0) / 1000; s0 = Date.now();
  const hs = solveHousehold(E, M, hp, { solveOne: solveHouse, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
  solveSecs.HS = (Date.now() - s0) / 1000; s0 = Date.now();
  // one household table for each form of part 1 (HSP and HSPS share the 'pensions' table)
  const rems = {};
  for (const scale of ['bands', 'pensions']) { s0 = Date.now(); rems[scale] = solveHousehold(E, M, hp, { solveOne: solveHouse, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, scale }); rems[scale].secs = (Date.now() - s0) / 1000; }
  for (const [arm, o] of Object.entries(NEW)) solveSecs[arm] = rems[o.scale].secs;
  // the checks before any path (HOUSEHOLD-REMEDY-READ.md 1 and 2, as amended)
  const off = [], sp = pensionsSplit(E, hp), cfg = { ...E.DEFAULT_CONFIG, ...(hp.config || {}) };
  for (const [scale, rem] of Object.entries(rems)) {
    off.push(...scaleProblems(rem.hplan, hs.hplan, cfg, sp.k, scale === 'pensions').map(p => `the '${scale}' plan: ${p}`));
    if (!(rem.meta.scale && rem.meta.scale.rule === scale && Math.abs(rem.meta.scale.k - sp.k) < 1e-12)) off.push(`the '${scale}' table solved with ${js(rem.meta.scale)}, not k ${sp.k}`);
    if (!(Math.abs(rem.H.m.ctx.P.cgtBandWidth - sp.k * k2.m.ctx.P.cgtBandWidth) < 1e-6)) off.push(`the '${scale}' band for gains ${rem.H.m.ctx.P.cgtBandWidth}, not k x ${k2.m.ctx.P.cgtBandWidth}`);
  }
  for (const [w, h] of [['HS', hs], ["the 'bands' table", rems.bands], ["the 'pensions' table", rems.pensions]]) {
    if (!smoke) off.push(...wantProblems('CANDC', settingsOf(h.H), W).map(p => `${w}: ${p}`));
    off.push(...houseLineProblems(k2.tables.self, h.H, k2.m.ctx.solvencyFloor).map(p => `${w}: ${p}`));
    if (h.m.ctx.solvencyFloor !== k2.m.ctx.solvencyFloor) off.push(`${w}: the minimum pot ${h.m.ctx.solvencyFloor}, not K2's ${k2.m.ctx.solvencyFloor}`);
  }
  if (!smoke) for (const w of ['self', 'part']) off.push(...wantProblems('CANDC', settingsOf(k2.tables[w]), W).map(p => `${w}: ${p}`));
  const digests = { self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)), HS: await digestOf(tablesOf(hs.H)), bands: await digestOf(tablesOf(rems.bands.H)), pensions: await digestOf(tablesOf(rems.pensions.H)) };
  if (lead) {
    if (digests.self !== lead.digests.before.self || digests.part !== lead.digests.before.part) off.push(`K2's tables are not the lead test's`);
    if (digests.HS !== lead.digests.before.household) off.push(`HS's household table is not the lead test's`);
  }
  if (sp.k < 2 - 1e-12) for (const scale of ['bands', 'pensions']) if (digests[scale] === digests.HS) off.push(`the '${scale}' table is HS's though k is under 2`);
  if (off.length) { console.error(`audit-household-remedy: ${u.id}: ${off.join('; ')}`); process.exit(3); }
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), forecast = { HS: survAt(hs.H, vecOf(hs.hm, mergedState(hs, st0))) };
  for (const [arm, o] of Object.entries(NEW)) { const r = rems[o.scale]; forecast[arm] = survAt(r.H, vecOf(r.hm, mergedState(r, st0))); }
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s, HS ${solveSecs.HS.toFixed(0)} s, 'bands' ${rems.bands.secs.toFixed(0)} s, 'pensions' ${rems.pensions.secs.toFixed(0)} s; the pensions' split s ${sp.s.toFixed(4)}, k ${sp.k.toFixed(4)}; the remedy's bands for gains ${rems.bands.H.m.ctx.P.cgtBandWidth} and ${rems.pensions.H.m.ctx.P.cgtBandWidth} (a person's ${k2.m.ctx.P.cgtBandWidth}); the tables ${smoke ? 'a smoke\'s' : 'K2\'s and HS\'s the lead test\'s'}; each remedy plan part 1's`);
  const withAges = p => ({ ...p, demographics: { ...p.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
  const ctxOf = arm => (arm === 'K2' ? E.buildContext(withCouple(withAges(k2.plan), k2))
    : arm === 'HS' ? E.buildContext(withHouseholdSingle(withAges(hs.plan), { ...hs, split: 'even' }))
      : E.buildContext(withHouseholdSingle(withAges(rems[NEW[arm].scale].plan), { ...rems[NEW[arm].scale], split: NEW[arm].split })));
  const optionsOf = arm => (arm === 'K2' ? { ...JOINT } : arm === 'HS' ? { move: 'single', split: 'even' } : { move: 'single', split: NEW[arm].split, scale: NEW[arm].scale, k: sp.k });
  const T = ctxOf('K2').totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const arms = {};
  // K2 and HS: the first CHECK paths again, against the lead test's arrays there; then the lead test's arrays whole
  for (const arm of ['K2', 'HS']) {
    const ctx = ctxOf(arm), nc = Math.min(CHECK, n), A = Object.fromEntries(Object.entries(KEYS).map(([key, Ty]) => [key, new Ty(nc)]));
    if (ctx.totalYears !== T) { console.error(`audit-household-remedy: ${u.id} ${arm}: another horizon`); process.exit(3); }
    const c0 = process.cpuUsage();
    for (let k = 0; k < nc; k++) { const r = runPath(ctx, paths[k], false); A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet; }
    const cu = process.cpuUsage(c0);
    if (lead) {
      const L = lead.arms[LEAD_ARM[arm]], differ = Object.entries(KEYS).filter(([key, Ty]) => b64(A[key]) !== b64(dec(L[key], Ty).subarray(0, nc)));
      if (differ.length) { console.error(`audit-household-remedy: ${u.id} ${arm}: its first ${nc} paths are not the lead test's ${LEAD_ARM[arm]} (${differ.map(([key]) => key).join(', ')} differ)`); process.exit(3); }
      arms[arm] = { options: optionsOf(arm), stored: { from: LEAD_DIR, arm: LEAD_ARM[arm], checked: nc }, cpuUs: cu.user + cu.system, T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...Object.fromEntries(Object.keys(KEYS).map(key => [key, L[key]])) };
    } else arms[arm] = { options: optionsOf(arm), stored: null, cpuUs: cu.user + cu.system, T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...Object.fromEntries(Object.entries(A).map(([key, v]) => [key, b64(v)])) };
    console.log(`${''.padEnd(8)} ${arm}: its first ${nc} paths ${lead ? `the lead test's ${LEAD_ARM[arm]} byte for byte; its ${n} paths taken from the lead test` : 'run (a smoke)'}`);
  }
  const chunk = smoke && Number(process.env.HR_CHUNK) > 0 ? Number(process.env.HR_CHUNK) : CHUNK;
  for (const arm of Object.keys(NEW)) {
    const ctx = ctxOf(arm), o = optionsOf(arm), pf = partOf(OUT, u.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-household-remedy: ${u.id} ${arm}: another horizon`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([key, Ty]) => [key, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.seed === SEED && P.N === n && P.pts === pts && P.chunk === chunk && js(P.digests) === js(digests) && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([key, Ty]) => [key, dec(P.arrays[key], Ty)])); done = P.done; chunks = P.chunks;
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
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed: SEED, N: n, pts, chunk, digests, options: o, done, chunks, arrays: Object.fromEntries(Object.entries(A).map(([key, v]) => [key, b64(v)])) })));
      renameSync(tmp, pf);
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-household-remedy: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0);
    arms[arm] = { options: o, stored: null, cpuUs, wallMs, chunks, procs: [...new Set(chunks.map(x => x.proc))], cpus: [...new Set(chunks.map(x => x.cpu))], T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...Object.fromEntries(Object.entries(A).map(([key, v]) => [key, b64(v)])) };
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: ${js(o)}; engine ${surv}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  const planOf = h => Object.fromEntries(DOUBLED.map(key => [key, h.hplan.config[key]]));
  writeFileSync(join(OUT, fileOf(u.id)), gzipSync(js({ k: pk, id: u.id, group: u.group, panel: u.panel, cohort: U.cohort, seed: SEED, N: n, pts, W, candidate, joint: JOINT, topK: TOPK, stamp: STAMP, digests, split: { s: sp.s, k: sp.k, self: sp.self, partner: sp.partner }, plans: { HS: planOf(hs), bands: planOf(rems.bands), pensions: planOf(rems.pensions) }, bands: { bands: rems.bands.H.m.ctx.P.cgtBandWidth, pensions: rems.pensions.H.m.ctx.P.cgtBandWidth, person: k2.m.ctx.P.cgtBandWidth }, floor: k2.m.ctx.solvencyFloor, caps: [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], cap: (k2.tables.self.estateCap || 0) + (k2.tables.part.estateCap || 0), T, lead: lead ? { dir: LEAD_DIR, stamp: lead.stamp } : null, arms })));
  for (const arm of Object.keys(NEW)) rmSync(partOf(OUT, u.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
