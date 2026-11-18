/*
 * WHY THE HOUSEHOLD PLAN LOSES ON THREE COUPLES: THE DECOMPOSITION (HOUSEHOLD-DECOMP.md; D129 (1); EXPLORATORY, the tuning
 * seed). The lead test's three units to place (S191-90, S333F, S335F), each solved as the couples' default (K2) and four times
 * as the household table (as built, and with its income-tax bands, its tax-free cash cap, or both left at one person's:
 * household.mjs householdPlanFor's opts.single), and run on the lead test's 4,000 paths of seed 7002:
 *   K2                         the couples' default, as the lead test ran it (its K2);
 *   HS                         the household's move from the single solver's own chooser at the even split (its HS1);
 *   HSB, HSC, HSBC             the same, each on its own household table: the bands, the cap, or both single;
 *   CEIL, CEILB, CEILC, CEILBC beside, deciding nothing: each household table on its own plan (household-ceil-check.mjs's
 *                              CEIL: bridge.js withTable on the household plan, run by the engine as a single's plan).
 * Before any path: K2's two tables and HS's household table carry the lead test's digests; each variant's plan leaves exactly
 * its group single and every other doubled entry design A's; each household table carries one person's band for gains with
 * the bands single and two people's otherwise, and passes the lead test's settings check. After the paths: K2's and HS's
 * arrays are the lead test's byte for byte, and each arm is held to E.runTrial on its first 200 paths. Each arm's paths are
 * saved in chunks of 1,000, so a restart loses at most a chunk. At a smoke's settings (HD_PTS, HD_N) no outcome is printed,
 * and the lead test's digests and arrays are not compared (a smoke solves another table).
 *   node research/solver/audit-household-decomp.mjs part k/3     (batch-household-decomp.sh runs every unit)
 *   node research/solver/audit-household-decomp.mjs --units
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold, withHouseholdSingle, mergedState, inBands, DOUBLED, SINGLE_GROUPS } from './household.mjs';
import { withTable } from '../../src/solver/bridge.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { UNITS as LEAD_UNITS, STAMP_FILES as LEAD_STAMP, unitPlans, householdSolveOne, houseLineProblems, JOINT, TOPK, SEED, N, PTS, W, CHECK, WARM, CHUNK } from './audit-household.mjs';
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
export const UNIT_IDS = Object.freeze(['S191-90', 'S333F', 'S335F']);
export const UNITS = Object.freeze(UNIT_IDS.map(id => LEAD_UNITS.find(u => u.id === id)));
/* the household arms: each its household table's single groups (household.mjs SINGLE_GROUPS) */
export const HOUSES = Object.freeze({ HS: [], HSB: ['bands'], HSC: ['cap'], HSBC: ['bands', 'cap'] });
/* the beside arms: each household table on its own plan */
export const CEIL_OF = Object.freeze({ CEIL: 'HS', CEILB: 'HSB', CEILC: 'HSC', CEILBC: 'HSBC' });
export const ARMS = Object.freeze(['K2', ...Object.keys(HOUSES), ...Object.keys(CEIL_OF)]);
/* the lead test's arm each re-run arm must equal byte for byte */
export const LEAD_ARM = Object.freeze({ K2: 'K2', HS: 'HS1' });
export const LEAD_DIR = process.env.HD_LEAD || join(HERE, 'results', `household-${SEED}`);
export const STAMP_FILES = ['audit-household-decomp.mjs', 'reduce-household-decomp.mjs', 'HOUSEHOLD-DECOMP.md', 'batch-household-decomp.sh', ...LEAD_STAMP];
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

/* the doubled entries of a household plan's config that are not as its groups want them: each of its groups' entries at one
   person's, every other doubled entry design A's (the as-built household plan's) */
export function configProblems(hp, asBuilt, single, cfg) {
  const one = k => E.num(cfg[k], E.DEFAULT_CONFIG[k]), singles = new Set(single.flatMap(g => SINGLE_GROUPS[g] || []));
  if (single.some(g => !SINGLE_GROUPS[g])) return [`a group not in SINGLE_GROUPS: ${single.join(', ')}`];
  const bad = DOUBLED.filter(k => hp.config[k] !== (singles.has(k) ? one(k) : asBuilt.config[k])).map(k => `${k} ${hp.config[k]}`);
  for (const k of Object.keys({ ...hp.config, ...asBuilt.config })) if (!DOUBLED.includes(k) && js(hp.config[k]) !== js(asBuilt.config[k])) bad.push(`${k} ${js(hp.config[k])}, not design A's ${js(asBuilt.config[k])}`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.group}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-household-decomp: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.HD_OUT || join(HERE, 'results', `household-decomp-${SEED}`);
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const pts = Number(process.env.HD_PTS) || PTS, n = Number(process.env.HD_N) || N, smoke = pts !== PTS || n !== N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), UP = unitPlans(u);
  if (!UP) { console.error(`audit-household-decomp: ${u.id} is not in its panel`); process.exit(2); }
  const { U, a, hp, aDemo } = UP, candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`HOUSEHOLD-DECOMP (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.group}, ${U.cohort}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}, the joint move ${js(JOINT)}, the household tables ${js(HOUSES)}; arm A ${a.label}`);
  if (U.label !== null && a.label !== U.label) { console.error(`audit-household-decomp: ${u.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  const lead = smoke ? null : JSON.parse(gunzipSync(readFileSync(join(LEAD_DIR, fileOf(u.id)))).toString());
  if (lead && (lead.seed !== SEED || lead.N !== N || lead.pts !== PTS || lead.stamp.code !== STAMP.code)) { console.error(`audit-household-decomp: ${u.id}: the lead test's unit file is seed ${lead.seed}, ${lead.N} paths, ${lead.pts} points, code ${lead.stamp.code}; this run seed ${SEED}, ${n}, ${pts}, code ${STAMP.code}`); process.exit(3); }
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  // the two people's tables as the lead test solved them (the couples' candidate, no tie-break)
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const solveHouse = householdSolveOne(pts, light), solveSecs = {};
  let s0 = Date.now();
  const k2 = solveCouple(E, M, hp, { solveOne, ...JOINT });
  solveSecs.K2 = (Date.now() - s0) / 1000;
  const houses = {};
  for (const [arm, single] of Object.entries(HOUSES)) {
    s0 = Date.now();
    houses[arm] = solveHousehold(E, M, hp, { solveOne: solveHouse, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, single });
    solveSecs[arm] = (Date.now() - s0) / 1000;
  }
  for (const [ce, arm] of Object.entries(CEIL_OF)) solveSecs[ce] = solveSecs[arm];   // CEIL reads its household arm's table
  // the checks before any path (HOUSEHOLD-DECOMP.md 1 to 3)
  const off = [];
  const cfg = { ...E.DEFAULT_CONFIG, ...(hp.config || {}) };   // householdPlanFor's own reading of a person's allowances
  for (const [arm, single] of Object.entries(HOUSES)) {
    const h = houses[arm];
    off.push(...configProblems(h.hplan, houses.HS.hplan, single, cfg).map(p => `${arm}: the plan's ${p}`));
    const people = single.includes('bands') ? 1 : 2;
    if (!(Math.abs(h.H.m.ctx.P.cgtBandWidth - people * k2.m.ctx.P.cgtBandWidth) < 1e-6)) off.push(`${arm}: its band for gains ${h.H.m.ctx.P.cgtBandWidth}, not ${people} person's ${people * k2.m.ctx.P.cgtBandWidth}`);
    if (!smoke) off.push(...wantProblems('CANDC', settingsOf(h.H), W).map(p => `${arm}: ${p}`));
    off.push(...houseLineProblems(k2.tables.self, h.H, k2.m.ctx.solvencyFloor).map(p => `${arm}: ${p}`));
    if (h.m.ctx.solvencyFloor !== k2.m.ctx.solvencyFloor) off.push(`${arm}: the minimum pot ${h.m.ctx.solvencyFloor}, not K2's ${k2.m.ctx.solvencyFloor}`);
    if (js(h.meta.single || []) !== js(single)) off.push(`${arm}: solved with ${js(h.meta.single || [])}, not ${js(single)}`);
  }
  if (!smoke) for (const w of ['self', 'part']) off.push(...wantProblems('CANDC', settingsOf(k2.tables[w]), W).map(p => `${w}: ${p}`));
  if (k2.m.ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) off.push(`the household's minimum pot ${k2.m.ctx.solvencyFloor}, not the panel's ${U.plan.config.solvencyFloor}`);
  const digests = { self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)) };
  for (const arm of Object.keys(HOUSES)) digests[arm] = await digestOf(tablesOf(houses[arm].H));
  if (lead) {
    if (digests.self !== lead.digests.before.self || digests.part !== lead.digests.before.part) off.push(`K2's tables are not the lead test's (${digests.self.slice(0, 12)} ${digests.part.slice(0, 12)} against ${lead.digests.before.self.slice(0, 12)} ${lead.digests.before.part.slice(0, 12)})`);
    if (digests.HS !== lead.digests.before.household) off.push(`HS's household table is not the lead test's (${digests.HS.slice(0, 12)} against ${lead.digests.before.household.slice(0, 12)})`);
  }
  for (const arm of ['HSB', 'HSC', 'HSBC']) if (digests[arm] === digests.HS) off.push(`${arm}'s household table is HS's`);
  if (off.length) { console.error(`audit-household-decomp: ${u.id}: ${off.join('; ')}`); process.exit(3); }
  // the forecasts at the start: each household table's survival where the household opens (as the lead test reads it)
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), forecast = {};
  for (const arm of Object.keys(HOUSES)) forecast[arm] = survAt(houses[arm].H, vecOf(houses[arm].hm, mergedState(houses[arm], st0)));
  for (const [ce, arm] of Object.entries(CEIL_OF)) forecast[ce] = forecast[arm];
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  const bands = Object.fromEntries(Object.keys(HOUSES).map(arm => [arm, houses[arm].H.m.ctx.P.cgtBandWidth]));
  console.log(`${''.padEnd(8)} solved: ${Object.entries(solveSecs).filter(([k]) => !CEIL_OF[k]).map(([k, s]) => `${k} ${s.toFixed(0)} s`).join(', ')}; the bands for gains ${js(bands)} (a person's ${k2.m.ctx.P.cgtBandWidth}); the tables ${smoke ? 'a smoke\'s' : 'K2\'s and HS\'s the lead test\'s'}; each variant's plan its groups single, every other doubled entry design A's`);
  // the engines: the couple's under K2 and each household arm; each household plan's own under its table (CEIL)
  const withAges = p => ({ ...p, demographics: { ...p.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
  const ctxOf = arm => {
    if (arm === 'K2') return E.buildContext(withCouple(withAges(k2.plan), k2));
    if (HOUSES[arm]) { const h = houses[arm]; return E.buildContext(withHouseholdSingle(withAges(h.plan), { ...h, split: 'even' })); }
    const h = houses[CEIL_OF[arm]];
    return inBands(E, HOUSES[CEIL_OF[arm]], () => E.buildContext(withTable(h.hplan, h.H)));
  };
  const optionsOf = arm => (arm === 'K2' ? { ...JOINT } : HOUSES[arm] ? { move: 'single', split: 'even', single: HOUSES[arm] } : { ceil: CEIL_OF[arm], single: HOUSES[CEIL_OF[arm]] });
  const T = ctxOf('K2').totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const chunk = smoke && Number(process.env.HD_CHUNK) > 0 ? Number(process.env.HD_CHUNK) : CHUNK;
  let stopAfter = smoke && Number(process.env.HD_STOP_AFTER) > 0 ? Number(process.env.HD_STOP_AFTER) : 0;
  const arms = {};
  for (const arm of ARMS) {
    const ctx = ctxOf(arm), o = optionsOf(arm), pf = partOf(OUT, u.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-household-decomp: ${u.id} ${arm}: another horizon (${ctx.totalYears}, K2 ${T})`); process.exit(3); }
    if (ctx.solvencyFloor !== k2.m.ctx.solvencyFloor) { console.error(`audit-household-decomp: ${u.id} ${arm}: the minimum pot ${ctx.solvencyFloor}, not K2's ${k2.m.ctx.solvencyFloor}`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.seed === SEED && P.N === n && P.pts === pts && P.chunk === chunk && js(P.digests) === js(digests) && js(P.options) === js(o)) {
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
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed: SEED, N: n, pts, chunk, digests, options: o, done, chunks, arrays: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
      renameSync(tmp, pf);
      if (stopAfter && --stopAfter === 0) { console.log(`${''.padEnd(8)} stopped after a chunk of ${arm} (HD_STOP_AFTER)`); process.exit(75); }
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-household-decomp: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    // K2 and HS: the lead test's arrays byte for byte
    if (lead && LEAD_ARM[arm]) {
      const L = lead.arms[LEAD_ARM[arm]], differ = Object.keys(KEYS).filter(k => L[k] !== b64(A[k]));
      if (differ.length) { console.error(`audit-household-decomp: ${u.id} ${arm}: not the lead test's ${LEAD_ARM[arm]} (${differ.join(', ')} differ)`); process.exit(3); }
    }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0);
    arms[arm] = { options: o, cpuUs, wallMs, chunks, procs: [...new Set(chunks.map(x => x.proc))], cpus: [...new Set(chunks.map(x => x.cpu))], T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...(lead && LEAD_ARM[arm] ? { leadSame: LEAD_ARM[arm] } : {}), ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: ${js(o)}; engine ${surv}${lead && LEAD_ARM[arm] ? `; the lead test's ${LEAD_ARM[arm]} byte for byte` : ''}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  const plans = Object.fromEntries(Object.keys(HOUSES).map(arm => [arm, Object.fromEntries(DOUBLED.map(k => [k, houses[arm].hplan.config[k]]))]));
  writeFileSync(join(OUT, fileOf(u.id)), gzipSync(js({ k: pk, id: u.id, group: u.group, panel: u.panel, cohort: U.cohort, seed: SEED, N: n, pts, W, candidate, joint: JOINT, topK: TOPK, houses: HOUSES, ceilOf: CEIL_OF, stamp: STAMP, digests, bands, personBand: k2.m.ctx.P.cgtBandWidth, plans, floor: k2.m.ctx.solvencyFloor, caps: [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], cap: (k2.tables.self.estateCap || 0) + (k2.tables.part.estateCap || 0), houseCaps: Object.fromEntries(Object.keys(HOUSES).map(arm => [arm, houses[arm].H.estateCap])), T, lead: lead ? { dir: LEAD_DIR, stamp: lead.stamp } : null, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, u.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
