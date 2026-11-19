/*
 * STEP 8'S ARM, THE AUDIT (HOUSEHOLD-ARM.md, its rule committed before any unit ran; D130 (2); EXPLORATORY, seed 7002).
 * The lead test's 28 units and step 5's 28 shapes, each on 4,000 paths of seed 7002 at 45 points, on the code with the ISA
 * allowance fixed (D130 (1)):
 *   APP   arm A on the couple's plan, no tournament (beside, deciding nothing);
 *   K2    today's couples' default (the couples' candidate, the joint move JOINT), as the lead test's K2;
 *   HSP   the household plan priced at the pensions' split (householdPlanFor scale 'pensions'), the move at the even split;
 *   HSPA  the same with the personal allowance priced at k too (scale 'pensionsPA'), the even split.
 * Before any path: arm A's pick the landing's; no unit's base one of step 8's eight couples; HSP's and HSPA's plans as their
 * forms say (every other doubled entry design A's as built) and each table's band for gains k times one person's; each
 * table's settings line and the household line against the first person's (audit-shapes.mjs unitLineProblems: step 8's own
 * check); the minimum pot K2's. Each arm held to E.runTrial on its first 200 paths and saved in chunks of 1,000 (a restart
 * resumes from the last whole chunk on the same stamp). At a smoke's settings (HA_PTS, HA_N) no outcome is printed.
 *   node research/solver/audit-household-arm.mjs part k/56     (batch-household-arm.sh runs every unit)
 *   node research/solver/audit-household-arm.mjs --units
 *   node research/solver/audit-household-arm.mjs --planted     HSPA's plan check on planted entries
 *   HA_PTS, HA_N, HA_CHUNK (smoke only); HA_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold, withHouseholdSingle, mergedState, pensionsSplit, householdPlanFor, DOUBLED, SCALED } from './household.mjs';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { runPath } from './audit-phase4.mjs';
import { UNITS as LEAD_UNITS, unitPlans, JOINT, householdSolveOne } from './audit-household.mjs';
import { scaleProblems } from './audit-household-remedy.mjs';
import { unitLineProblems } from './audit-shapes.mjs';
import { readShapesPanel, solverPlanOf } from './shapes-panel.mjs';
import { wantProblems } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { APP_CANDIDATE } from '../../src/solverSettings.js';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, WARM = 3, CHUNK = 1000, TOPK = 3;
export const ARMS = ['APP', 'K2', 'HSP', 'HSPA'];
export const FORMS = Object.freeze({ HSP: 'pensions', HSPA: 'pensionsPA' });
export const CONFIG = Object.freeze({
  APP: { app: 'armA', tournament: false },
  K2: { ...COUPLES_CANDIDATE, ...JOINT },
  HSP: { ...APP_CANDIDATE, household: 'A', move: 'single', split: 'even', scale: FORMS.HSP, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast },
  HSPA: { ...APP_CANDIDATE, household: 'A', move: 'single', split: 'even', scale: FORMS.HSPA, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast }
});
export const configOf = arm => hashOf(CONFIG[arm]);
/* the 56 units: the lead test's 28, then step 5's 28 in its panel's order */
export function unitsAll() {
  return [...LEAD_UNITS.map(u => ({ src: 'lead', id: u.id, group: u.group, panel: u.panel })), ...readShapesPanel().map(s => ({ src: 'shapes', id: s.id, base: s.base, shape: s.shape }))];
}
/* a unit's base couple, as step 8's panel names its couples (S191-90 is S191's, S147-db@gap8 S147's) */
export const baseOf = id => String(id).split(/[-@]/)[0];
export const STEP8_PANEL = join(HERE, 'household-hsp-panel.json');
export const step8Couples = () => [...new Set(JSON.parse(readFileSync(STEP8_PANEL, 'utf8')).cohorts.flatMap(c => c.panel.flatMap(q => [q.couple, q.base])))];
/* a unit whose base is one of step 8's couples, its library couple or its younger cohort's (S349F is S349's) */
const stem = x => String(x).replace(/F$/, '');
export const inStep8 = (id, couples) => couples.map(stem).includes(stem(baseOf(id)));
export const STAMP_FILES = ['audit-household-arm.mjs', 'reduce-household-arm.mjs', 'HOUSEHOLD-ARM.md', 'batch-household-arm.sh', 'household.mjs', 'audit-household.mjs',
  'audit-household-remedy.mjs', 'audit-shapes.mjs', 'shapes-panel.mjs', 'shapes-panel.json', 'reduce-household-hsp.mjs', 'reduce-share-rules.mjs', 'reduce-phase4.mjs', 'stats.mjs', 'household-hsp-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(f).update(existsSync(join(HERE, f)) ? readFileSync(join(HERE, f)) : 'missing');
  return h.digest('hex').slice(0, 12);
}
export const partOf = (out, id, arm) => join(out, 'parts', `${id.replace(/@/g, '_')}-${arm}.json.gz`);
export const fileOf = id => `${id.replace(/@/g, '_')}.json.gz`;
const js = x => JSON.stringify(x);
export const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };

/* HSPA's plan against its form (HOUSEHOLD-ARM.md; household.mjs 'pensionsPA'): the allowance and each SCALED limit k times one
   person's, the cap k times one person's, every other doubled entry design A's as built, every other entry design A's */
export function scalePAProblems(hp, asBuilt, cfg, k) {
  const one = key => E.num(cfg[key], E.DEFAULT_CONFIG[key]);
  const want = key => (key === 'personalAllowance' || SCALED.includes(key) || key === 'pclsMaxCap' ? k * one(key) : asBuilt.config[key]);
  const bad = DOUBLED.filter(key => !(Math.abs(hp.config[key] - want(key)) <= 1e-6 * Math.max(1, Math.abs(want(key))))).map(key => `${key} ${hp.config[key]}, not ${want(key)}`);
  for (const key of Object.keys({ ...hp.config, ...asBuilt.config })) if (!DOUBLED.includes(key) && js(hp.config[key]) !== js(asBuilt.config[key])) bad.push(`${key} ${js(hp.config[key])}, not design A's ${js(asBuilt.config[key])}`);
  return bad;
}

function planted() {
  const cases = [], cfg = { ...E.DEFAULT_CONFIG }, one = key => E.num(cfg[key], E.DEFAULT_CONFIG[key]), k = 1 / 0.9;
  const asBuilt = { config: Object.fromEntries(DOUBLED.map(key => [key, 2 * one(key)])) };
  const good = { config: Object.fromEntries(DOUBLED.map(key => [key, key === 'personalAllowance' || SCALED.includes(key) || key === 'pclsMaxCap' ? k * one(key) : asBuilt.config[key]])) };
  cases.push(['HSPA\'s plan as its form says: none', `${scalePAProblems(good, asBuilt, cfg, k).length}`, '0']);
  cases.push(['the allowance left doubled (as HSP has it): caught', scalePAProblems({ config: { ...good.config, personalAllowance: 2 * one('personalAllowance') } }, asBuilt, cfg, k).map(x => x.split(' ')[0]).join(','), 'personalAllowance']);
  cases.push(['a band limit at HSP\'s 2 x PA + k x (L - PA): caught', scalePAProblems({ config: { ...good.config, basicBandLimit: 2 * one('personalAllowance') + k * (one('basicBandLimit') - one('personalAllowance')) } }, asBuilt, cfg, k).map(x => x.split(' ')[0]).join(','), 'basicBandLimit']);
  cases.push(['another entry not design A\'s: caught', scalePAProblems({ config: { ...good.config, isaAnnualAllowance: 1 } }, asBuilt, cfg, k).map(x => x.split(' ')[0]).join(','), 'isaAnnualAllowance']);
  cases.push(['a unit\'s base: S191-90 S191, S147-db@gap8 S147, S333F S333F', ['S191-90', 'S147-db@gap8', 'S333F'].map(baseOf).join(' '), 'S191 S147 S333F']);
  { const C = step8Couples(), hits = ['S025-45', 'S349F-db', 'S349-gap8', 'S027@even', 'S327F', 'S191-90', 'S147-db@gap8'].map(id => inStep8(id, C) ? 1 : 0).join('');
    cases.push([`step 8's panel read (${C.length} names), a unit on one of its couples refused and none of this read's (${unitsAll().filter(u => inStep8(u.id, C)).length} of ${unitsAll().length})`, `${C.length >= 8} ${hits} ${unitsAll().filter(u => inStep8(u.id, C)).length}`, 'true 1111000 0']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(`planted (${cases.length}): ${bad ? `${bad} FAILED` : 'all read as they should'}`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const UNITS = unitsAll();
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.src}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-household-arm: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.HA_OUT || join(HERE, 'results', `household-arm-${SEED}`);
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const pts = Number(process.env.HA_PTS) || PTS, n = Number(process.env.HA_N) || N, smoke = pts !== PTS || n !== N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), PROC = `${hostname()}:${process.pid}:${Date.now()}`, candidate = hashOf(COUPLES_CANDIDATE);
  // the unit's plans: the lead test's (unitPlans) or step 5's (solverPlanOf, the elder2nd shape handed over as its mirror)
  let a, hp, aDemo, mirrored = false, cohort, variant, landing;
  if (u.src === 'lead') {
    const UP = unitPlans(u);
    if (!UP) { console.error(`audit-household-arm: ${u.id} is not in its panel`); process.exit(2); }
    ({ a, hp, aDemo } = UP); cohort = UP.U.cohort; variant = u.group; landing = UP.U.label;
  } else {
    const S = readShapesPanel().find(x => x.id === u.id);
    ({ a, hp, mirrored } = solverPlanOf(S.plan, S.shape));
    aDemo = E.resolveMpaa(a.planState).demographics; cohort = S.base; variant = S.shape; landing = S.label;
  }
  const ages = mirrored ? { mpaaAgeSelf: aDemo.mpaaAgePart, mpaaAgePart: aDemo.mpaaAgeSelf } : { mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart };
  console.log(`STEP 8'S ARM (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.src}, ${variant}${mirrored ? ', handed to the solvers as its mirror' : ''}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}; configs ${ARMS.map(x => `${x} ${configOf(x)}`).join(', ')}; arm A ${a.label}`);
  const off = [];
  if (landing !== null && landing !== undefined && a.label !== landing) off.push(`arm A's pick ${a.label} differs from the landing's ${landing}`);
  if (inStep8(u.id, step8Couples())) off.push(`its base ${baseOf(u.id)} is one of step 8's couples`);
  if (off.length) { console.error(`audit-household-arm: ${u.id}: ${off.join('; ')}`); process.exit(3); }
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const key = js([p, o.partnerAge0]); if (!memo.has(key)) memo.set(key, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(key); };
  const solveSecs = { APP: 0 };
  let s0 = Date.now();
  const k2 = CPL.solveCouple(E, M, hp, { solveOne, ...JOINT });
  solveSecs.K2 = (Date.now() - s0) / 1000;
  const house = {};
  for (const arm of ['HSP', 'HSPA']) { s0 = Date.now(); house[arm] = solveHousehold(E, M, hp, { solveOne: householdSolveOne(pts, light), topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, scale: FORMS[arm] }); solveSecs[arm] = (Date.now() - s0) / 1000; }
  // the checks before any path (HOUSEHOLD-ARM.md)
  const sp = pensionsSplit(E, hp), cfg = { ...E.DEFAULT_CONFIG, ...(hp.config || {}) }, asBuilt = householdPlanFor(E, hp);
  off.push(...scaleProblems(house.HSP.hplan, asBuilt, cfg, sp.k, true).map(p => `HSP's plan: ${p}`));
  off.push(...scalePAProblems(house.HSPA.hplan, asBuilt, cfg, sp.k).map(p => `HSPA's plan: ${p}`));
  for (const arm of ['HSP', 'HSPA']) {
    const h = house[arm];
    if (!(h.meta.scale && h.meta.scale.rule === FORMS[arm] && Math.abs(h.meta.scale.k - sp.k) < 1e-12)) off.push(`${arm}'s table solved with ${js(h.meta.scale)}, not '${FORMS[arm]}' at k ${sp.k}`);
    if (!(Math.abs(h.H.m.ctx.P.cgtBandWidth - sp.k * k2.m.ctx.P.cgtBandWidth) < 1e-6)) off.push(`${arm}'s band for gains ${h.H.m.ctx.P.cgtBandWidth}, not k x ${k2.m.ctx.P.cgtBandWidth}`);
    if (!smoke) off.push(...wantProblems('CANDC', settingsOf(h.H), W).map(p => `${arm}: ${p}`));
    off.push(...unitLineProblems(k2, h, hp).map(p => `${arm}: ${p}`));
    if ((h.m.ctx.solvencyFloor || 0) !== (k2.m.ctx.solvencyFloor || 0)) off.push(`${arm}: the minimum pot ${h.m.ctx.solvencyFloor}, not K2's ${k2.m.ctx.solvencyFloor}`);
  }
  if (!smoke) for (const w of ['self', 'part']) off.push(...wantProblems('CANDC', settingsOf(k2.tables[w]), W).map(p => `${w}: ${p}`));
  if (off.length) { console.error(`audit-household-arm: ${u.id}: ${off.join('; ')}`); process.exit(3); }
  const digests = { self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)), HSP: await digestOf(tablesOf(house.HSP.H)), HSPA: await digestOf(tablesOf(house.HSPA.H)) };
  const caps = [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0];
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), forecast = { APP: null };
  for (const arm of ['HSP', 'HSPA']) forecast[arm] = survAt(house[arm].H, vecOf(house[arm].hm, mergedState(house[arm], st0)));
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s, HSP ${solveSecs.HSP.toFixed(0)} s, HSPA ${solveSecs.HSPA.toFixed(0)} s; the pensions' split s ${sp.s.toFixed(4)}, k ${sp.k.toFixed(4)}; K2's share ${k2.share}; caps ${caps.join(' and ')}`);
  const withAges = p => ({ ...p, demographics: { ...p.demographics, ...ages } });
  const ctxOf = arm => {
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || !ctx.isCouple) { console.error(`audit-household-arm: ${u.id} APP: guardrails ${ctx.guardrails}, a couple ${ctx.isCouple}`); process.exit(3); }
      return ctx;
    }
    if (arm === 'K2') return E.buildContext(CPL.withCouple(withAges(k2.plan), k2));
    return E.buildContext(withHouseholdSingle(withAges(house[arm].plan), { ...house[arm], split: 'even' }));
  };
  const T = ctxOf('K2').totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const chunk = smoke && Number(process.env.HA_CHUNK) > 0 ? Number(process.env.HA_CHUNK) : CHUNK, arms = {};
  for (const arm of ARMS) {
    const ctx = ctxOf(arm), pf = partOf(OUT, u.id, arm), config = configOf(arm);
    if (ctx.totalYears !== T) { console.error(`audit-household-arm: ${u.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([key, Ty]) => [key, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.stamp.node === STAMP.node && P.seed === SEED && P.N === n && P.pts === pts && P.chunk === chunk && js(P.digests) === js(digests) && P.config === config) {
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
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed: SEED, N: n, pts, chunk, digests, config, done, chunks, arrays: Object.fromEntries(Object.entries(A).map(([key, v]) => [key, b64(v)])) })));
      renameSync(tmp, pf);
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-household-arm: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0);
    arms[arm] = { config, cpuUs, wallMs, chunks, procs: [...new Set(chunks.map(x => x.proc))], T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...Object.fromEntries(Object.entries(A).map(([key, v]) => [key, b64(v)])) };
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: config ${config}; engine ${surv}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  writeFileSync(join(OUT, fileOf(u.id)), gzipSync(js({ k: pk, id: u.id, src: u.src, cohort, variant, mirrored, seed: SEED, N: n, pts, W, candidate, joint: JOINT, topK: TOPK, stamp: STAMP, digests, split: { s: sp.s, k: sp.k }, caps, label: a.label, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, u.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
