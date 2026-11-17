/*
 * ONE PLAN FOR THE WHOLE HOUSEHOLD, THE LEAD TEST (HOUSEHOLD.md section 5; D113; EXPLORATORY, the tuning seed). JOINT-WIDE's
 * 28 units (TIE-C2's younger eight and library four, the share rules' 90/10 and feature units, at their landed targets),
 * each solved two ways and run on the same 4,000 paths of seed 7002:
 *   K2     the couples' default as the app solves a couple (couple.js solveCouple: each person's table by solveForApp at 45
 *          points, the pots' share, LOOKHOLD; JOINT-WIDE's K2, whose arrays this K2 must equal byte for byte);
 *   HOUSE  design A (research/solver/household.mjs): the household's plan as one person's with both people's allowances, solved
 *          by solveForApp at 45 points as a single's plan is, judging the couple's rollout alone (its top three moves at
 *          every funding split, the tie rule and the hold at the couples' default's settings).
 * Each arm held to E.runTrial on its first 200 paths; each arm's paths saved in chunks of 1,000 so a restart loses at most a
 * chunk (JOINT-WIDE.md's amendment 2, as built there). Beside each unit: each arm's solve time and CPU a path, the household
 * table's forecast at the start and the two tables' joint one, design A's two biases (the plan years one person's pension is
 * open and the other's locked while the household spends; the first person's share of the pensions), and along K2's own
 * path on the first 100 paths how often the household's pick differs from K2's (the level, the split, the tiers). At a
 * smoke's settings (HH_PTS, HH_N) no outcome is printed.
 *   node research/solver/audit-household.mjs part k/28     (batch-household.sh runs every unit)
 *   node research/solver/audit-household.mjs --units
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold, withHousehold, chooseHousehold, mergedState, householdContext, householdPlanFor } from './household.mjs';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { APP_COUPLE, appJoint, APP_CANDIDATE } from '../../src/solverSettings.js';
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
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, REPLAY = 100, WARM = 3, CHUNK = 1000, TOPK = 3;
const PROC = `${hostname()}:${process.pid}:${Date.now()}`;
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const ARMS = ['K2', 'HOUSE'];
/* the couples' default joint move, as the page assembles a couple (D99's share rule, D109's LOOKHOLD) */
export const JOINT = Object.freeze({ shareRule: APP_COUPLE.shareRule, ...appJoint() });
/* JOINT-WIDE's units, in its order (audit-joint-wide.mjs UNITS) */
export const UNITS = Object.freeze([
  ...['S327F', 'S329F', 'S331F', 'S333F', 'S335F', 'S337F', 'S341F', 'S343F'].map(id => ({ id, panel: 'd4b', group: 'younger' })),
  ...['S149', 'S167', 'S205', 'S223'].map(id => ({ id, panel: 'd4b', group: 'library' })),
  ...['S023', 'S061', 'S109', 'S147', 'S191', 'S227', 'S271', 'S377'].map(c => ({ id: `${c}-90`, panel: 'share', group: '90/10' })),
  ...['S023-db', 'S061-dbpart', 'S109-sppart', 'S147-db', 'S191-dbpart', 'S227-sppart', 'S271-db', 'S377-dbpart'].map(id => ({ id, panel: 'share', group: 'feature' }))
].map(Object.freeze));
/* unit k's order of the arms: each arm first on half the units */
export const orderOf = k => (k % 2 ? ['HOUSE', 'K2'] : ['K2', 'HOUSE']);
export const STAMP_FILES = ['audit-household.mjs', 'household.mjs', 'reduce-household.mjs', 'HOUSEHOLD.md', 'batch-household.sh', 'audit-couples.mjs', 'audit-couples-share.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'share-rules-panel.mjs', 'couples-panel-d4b.json', 'share-rules-panel.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = id => `${id}.json.gz`;
export const optionsOf = (arm, cp) => (arm === 'HOUSE'
  ? { household: cp.meta.household, topK: cp.topK, tieJoint: cp.tieJoint ?? null, holdPast: cp.holdPast ?? null }
  : { shareRule: cp.meta.shareRule ?? null, tieJoint: cp.tieJoint ?? null, tieLook: cp.tieLook ?? null, holdPast: cp.holdPast ?? null, topK: cp.topK ?? null });
const js = x => JSON.stringify(x);
const tiersOf = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' ');

/* the household table's solve (PRESCRIPTIVE-PLAN.md step 1): solveForApp at the candidate as it stands, its tie-break above
   the estate cap left on (APP_CANDIDATE's tieAboveCap); not the two people's `tieAboveCap: undefined` */
export const householdSolveOne = (pts, light = {}) => (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { ...light } });
/* the settings check (step 1, as D124 rules it): the household table's line the first person's, the tie-break the one
   difference, with the minimum pot left out of the comparison (a person's table is solved on its share of the household's
   minimum pot, the household table on the whole: household-line-check.mjs) and the household table's held to the
   household's own instead */
export const lineOf = r => `${settingsOf(r)} tieAboveCap ${r.tieAboveCap || 0}`;
export function houseLineProblems(selfTab, houseTab, floor) {
  const kv = line => Object.fromEntries(line.match(/(\S+) (\S+)/g).map(x => x.split(' ')));
  const a = kv(lineOf(selfTab)), b = kv(lineOf(houseTab)), keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const differ = keys.filter(k => a[k] !== b[k] && k !== 'minPot'), bad = differ.filter(k => k !== 'tieAboveCap').map(k => `household: ${k} ${b[k]}, the first person's ${a[k]}`);
  if (!(Number(b.minPot) === Number(floor))) bad.push(`household: minPot ${b.minPot}, not the household's ${floor}`);
  if (Number(b.tieAboveCap) !== APP_CANDIDATE.tieAboveCap) bad.push(`household: tieAboveCap ${b.tieAboveCap} (want the candidate's ${APP_CANDIDATE.tieAboveCap})`);
  if (Number(a.tieAboveCap) !== 0) bad.push(`self: tieAboveCap ${a.tieAboveCap} (want none)`);
  return bad;
}
/* a unit's plan as the audit solves it: arm A's policy on the plan prepared for the solver, and arm A's MPAA ages */
export function unitPlans(u, W0 = W) {
  const U = unitOf(u);
  if (!U) return null;
  const a = armA(appPlan(U.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  return { U, a, hp: solverPlan('CANDC', U.plan, aPol, W0), aDemo: E.resolveMpaa(a.planState).demographics };
}
/* a unit's plan, its cohort and (on the share rules' panel) the policy arm A was landed on */
function unitOf(u) {
  if (u.panel === 'd4b') { const h = readPanel(PANEL_FILE).find(x => x.id === u.id); return h ? { plan: h.plan, cohort: h.cohort, label: null } : null; }
  const s = readSharePanel().find(x => x.id === u.id);
  return s ? { plan: s.plan, cohort: s.kind === 'feature' ? `feature ${s.feature}` : `held ${s.variant}`, label: s.label } : null;
}
/* design A's biases on a unit (HOUSEHOLD.md section 2; PRESCRIPTIVE-PLAN.md step 3, five things, the last three as the
   review's scripts/bias-table.mjs computes them): the plan years in which the household spends (anyone retired) and exactly
   one person's pension is open (lockedYears, lockedAt); the first person's share of the two pensions (penShareSelf); the
   income tax the household plan leaves out on the two people's guaranteed incomes (each state pension and taxable other
   income taxed on its owner's own bands, less the same taxed together on the household plan's: in the plan's last year
   once every such income is in payment, over the plan, and that as a share of the plan's spending; incomeTaxLeftOut); the
   one-off deposits owned by one person (oneOffOwned); the basic-rate band for capital gains the household plan is given,
   through householdContext, against the two people's (cgtBand). Nil: no locked year, the share from 0.25 to 0.75, under
   £100 a year of income tax left out, no one-off deposit and the band two people's (biasesNil). */
export function biasesOf(m, plan) {
  const c = m.ctx, T = c.totalYears, o = { self: c.owners.find(x => x.key === 'self'), part: c.owners.find(x => x.key === 'part') };
  const age = (k, t) => (k === 'self' ? c.ageSelf0 : c.agePart0) + t;
  const lockedAt = [];
  for (let t = 0; t <= T; t++) {
    const retired = age('self', t) >= o.self.retireAge || age('part', t) >= o.part.retireAge;
    const open = ['self', 'part'].filter(k => age(k, t) >= c.nmpa).length;
    if (retired && open === 1) lockedAt.push(t);
  }
  const pen = k => c.accounts.filter(a => a.owner === k && a.cat === 'pen').reduce((s, a) => s + a.balance, 0);
  const pA = pen('self'), pB = pen('part');
  const cH = householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, plan))));
  let over = 0, last = 0, spend = 0;
  for (let t = 0; t <= T; t++) {
    const g = { self: 0, part: 0 };
    for (const o of c.owners) if (age(o.key, t) >= c.spa) g[o.key] += o.statePension || 0;
    for (const i of c.otherIncomes || []) { const ag = age(i.owner, t); if (!i.taxFree && ag >= i.startAge && ag <= i.endAge) g[i.owner] += i.amount; }
    const couple = E.incomeTax(g.self, c.P) + E.incomeTax(g.part, c.P), house = E.incomeTax(g.self + g.part, cH.P);
    over += couple - house; last = couple - house;
    spend += E.spendTargetAtAge(c, age('self', t)) || 0;
  }
  const oneOffOwned = (plan.oneOffContributions || []).filter(x => Number(x.amount) > 0).map(x => ({ owner: x.owner === 'Partner' ? 'Partner' : 'Myself', amount: Number(x.amount), year: Number.isFinite(Number(x.year)) && x.year !== '' ? Number(x.year) : parseInt(String(x.date).slice(0, 4)) }));
  return {
    lockedYears: lockedAt.length, lockedAt, penShareSelf: pA + pB > 0 ? pA / (pA + pB) : 0.5,
    incomeTaxLeftOut: { aYear: last, overPlan: over, shareOfSpending: spend > 0 ? over / spend : 0 }, oneOffOwned,
    cgtBand: { household: cH.P.cgtBandWidth, twoPeople: 2 * c.P.cgtBandWidth }
  };
}
export const biasesNil = b => b.lockedYears === 0 && b.penShareSelf >= 0.25 && b.penShareSelf <= 0.75 && b.incomeTaxLeftOut.aYear < 100 && b.oneOffOwned.length === 0 && b.cgtBand.household === b.cgtBand.twoPeople;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.group}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-household: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.HH_OUT || join(HERE, 'results', `household-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.HH_PTS) || PTS, n = Number(process.env.HH_N) || N, nReplay = Math.min(n, Number(process.env.HH_REPLAY) || REPLAY), smoke = pts !== PTS || n !== N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), UP = unitPlans(u);
  if (!UP) { console.error(`audit-household: ${u.id} is not in its panel`); process.exit(2); }
  const { U, a, hp, aDemo } = UP;
  const candidate = hashOf(COUPLES_CANDIDATE), order = orderOf(pk);
  console.log(`HOUSEHOLD (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.group}, ${U.cohort}), seed ${SEED}, ${n} paths, the replay on ${nReplay}, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}, the joint move ${js(JOINT)}, the household's top ${TOPK}, the arms in the order ${order.join(', ')}`);
  if (U.label !== null && a.label !== U.label) { console.error(`audit-household: ${u.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  // the household table (PRESCRIPTIVE-PLAN.md step 1, D117): solved once, as the candidate stands (its tie-break above the
  // estate cap left on), every household arm reading it; the two people's tables keep the couples' candidate (no tie-break)
  const solveHouse = householdSolveOne(pts, light);
  const s0 = Date.now();
  const k2 = solveCouple(E, M, hp, { solveOne, ...JOINT });
  const s1 = Date.now();
  const house = solveHousehold(E, M, hp, { solveOne: solveHouse, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
  const s2 = Date.now(), solveSecs = { K2: (s1 - s0) / 1000, HOUSE: (s2 - s1) / 1000 };
  const cps = { K2: k2, HOUSE: house };
  const lines = ['self', 'part'].map(w => settingsOf(k2.tables[w])), hline = settingsOf(house.H);
  // each person's settings and the household table's the couples' registered run's (at a smoke's points the check is skipped)
  const off = [...(smoke ? [] : [...lines.flatMap((line, i) => wantProblems('CANDC', line, W).map(p => `${i ? 'part' : 'self'}: ${p}`)), ...wantProblems('CANDC', hline, W).map(p => `household: ${p}`)]), ...houseLineProblems(k2.tables.self, house.H, k2.m.ctx.solvencyFloor || 0), ...coupleProblems()];
  if (k2.m.ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) off.push(`the household's minimum pot ${k2.m.ctx.solvencyFloor}, not the panel's ${U.plan.config.solvencyFloor}`);
  if (house.m.ctx.solvencyFloor !== k2.m.ctx.solvencyFloor) off.push(`the household plan's minimum pot ${house.m.ctx.solvencyFloor}, not K2's ${k2.m.ctx.solvencyFloor}`);
  if (off.length) { console.error(`audit-household: ${u.id}: ${off.join('; ')}`); process.exit(3); }
  const digest = async () => ({ self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)), household: await digestOf(tablesOf(house.H)) });
  const before = await digest();
  const caps = [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], cap = caps[0] + caps[1];
  const bias = biasesOf(k2.m, hp);
  // the forecasts at the start: the household table's survival where the household opens, and the two tables' product
  // (a table of three worlds read as the rollout reads it: each world's survival, weighted)
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), sH = vecOf(house.hm, mergedState(house, st0)), forecast = { HOUSE: survAt(house.H, sH) };
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s, HOUSE ${solveSecs.HOUSE.toFixed(0)} s; share ${k2.share}; caps ${caps.join(' and ')}, the household's ${house.H.estateCap}; design A's biases: ${bias.lockedYears} plan years one pension locked, the first person's share of the pensions ${bias.penShareSelf.toFixed(3)} | self: ${lines[0]} | part: ${lines[1]} | household: ${hline}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const engineOf = (arm, cp) => (arm === 'HOUSE' ? withHousehold : withCouple)({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp);
  const ctxOf = (arm, cp) => E.buildContext(engineOf(arm, cp));
  const T = ctxOf('K2', k2).totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const arms = {};
  const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
  const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
  const chunk = smoke && Number(process.env.HH_CHUNK) > 0 ? Number(process.env.HH_CHUNK) : CHUNK;
  let stopAfter = smoke && Number(process.env.HH_STOP_AFTER) > 0 ? Number(process.env.HH_STOP_AFTER) : 0;
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  for (const arm of order) {
    const cp = cps[arm], ctx = ctxOf(arm, cp), o = optionsOf(arm, cp), pf = partOf(OUT, u.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-household: ${u.id} ${arm}: another horizon`); process.exit(3); }
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
      if (stopAfter && --stopAfter === 0) { console.log(`${''.padEnd(8)} stopped after a chunk of ${arm} (HH_STOP_AFTER)`); process.exit(75); }
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-household: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0), procs = [...new Set(chunks.map(x => x.proc))];
    arms[arm] = { options: o, cpuUs, wallMs, chunks, procs, cpus: [...new Set(chunks.map(x => x.cpu))], place: order.indexOf(arm), T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: ${js(o)}; engine ${surv}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path), in ${procs.length} process${procs.length > 1 ? 'es' : ''}`);
  }
  // the replay: along K2's own path on the first nReplay paths, the household's pick at the same state against K2's
  const along = { decisions: 0, differ: 0, level: 0, higher: 0, lower: 0, split: 0, tiers: 0, unfunded: 0 };
  for (let k = 0; k < nReplay; k++) {
    const st = M.initialState(k2.m);
    for (let t = 0; t <= T; t++) {
      const j0 = chooseJoint(k2, st, t);
      if (t < T) {
        along.decisions++;
        const out = {}, j = chooseHousehold(house, st, t, out);
        if (!out.best) along.unfunded++;
        if (j.spendLevel !== j0.spendLevel || j.split !== j0.split || tiersOf(j) !== tiersOf(j0) || js(j.perOwner) !== js(j0.perOwner)) along.differ++;
        if (j.spendLevel !== j0.spendLevel) { along.level++; if (j.spendLevel > j0.spendLevel) along.higher++; else along.lower++; }
        if (j.split !== j0.split) along.split++;
        if (tiersOf(j) !== tiersOf(j0)) along.tiers++;
      }
      const row = M.step(k2.m, st, j0, t, CPL.ratesAt(k2.m, paths[k], t));
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
  }
  console.log(`${''.padEnd(8)} the replay on ${nReplay} paths along K2's path: ${along.decisions} decisions; the household's pick differs at ${along.differ} (another level ${along.level}: higher ${along.higher}, lower ${along.lower}; another split ${along.split}; other tiers ${along.tiers}); nothing funds the year for it at ${along.unfunded}`);
  const after = await digest();
  writeFileSync(join(OUT, fileOf(u.id)), gzipSync(js({ k: pk, id: u.id, group: u.group, panel: u.panel, cohort: U.cohort, seed: SEED, N: n, nReplay, warm: WARM, pts, W, candidate, joint: JOINT, topK: TOPK, order, cap, caps, houseCap: house.H.estateCap, share: k2.share, shareRule: k2.meta.shareRule, bias, stamp: STAMP, digests: { before, after }, along, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, u.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
