/*
 * THE SHAPES THE LIBRARY LACKS, THE AUDIT (SHAPES.md, its rule committed before this was built; PRESCRIPTIVE-PLAN.md step 5;
 * D120; EXPLORATORY, the tuning seed). The units of shapes-panel.json (four bases by seven shapes, landed on seed 7005, the
 * units householdPlanFor refuses left out), each solved twice, the two people's tables and one household table, as the lead
 * test solves them (audit-household.mjs), and run on the same 4,000 paths of seed 7002 under four arms, in the order ARMS
 * rotated by k % 4:
 *   APP   arm A, the app's rules, on the plan as entered;
 *   K2    the couples' default, solved by solveCouple whatever the guard says of the couple;
 *   HS    the household's move from the single solver's own chooser (household.mjs chooseHouseholdSingle), at the best of
 *         five splits where the lead test printed THE SEARCH STAYS, at the even split where it printed THE SEARCH GOES
 *         (read from results-household.txt, which the stamp names);
 *   CEIL  the household table on the household's own single plan (bridge.js withTable on householdPlanFor's plan), its
 *         context built inside twoBands: what the table believes it can do.
 * An elder2nd unit is handed to both solvers as its mirror (src/coupleOrder.js otherOrder: the elder first, as the app hands
 * such a couple to the solver, D104), arm A's MPAA ages swapped with it; APP runs the plan as entered; every figure the rule
 * reads is the household's, so nothing is mirrored back. Each arm held to E.runTrial on its first 200 paths and saved in
 * chunks of 1,000 (resumable, as the lead test's). Recorded beside: each arm's solve time and CPU a path, the forecasts
 * (the household table's at the start for HS and CEIL; the two tables' product for K2), biasesOf's five things, step 1's
 * two counts on HS. At a smoke's settings (SH_PTS, SH_N) no outcome is printed.
 *   node research/solver/audit-shapes.mjs part k/<units>     (batch-shapes.sh runs every unit)
 *   node research/solver/audit-shapes.mjs --units
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold, withHouseholdSingle, mergedState, twoBands } from './household.mjs';
import { withTable } from '../../src/solver/bridge.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { runPath } from './audit-phase4.mjs';
import { JOINT, householdSolveOne, biasesOf, lineOf } from './audit-household.mjs';
import { APP_CANDIDATE } from '../../src/solverSettings.js';
import { readShapesPanel, solverPlanOf, PANEL as SHAPES_PANEL } from './shapes-panel.mjs';
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
export const ARMS = ['APP', 'K2', 'HS', 'CEIL'];
export const orderOf = k => [...ARMS.slice(k % ARMS.length), ...ARMS.slice(0, k % ARMS.length)];
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id.replace('@', '_')}.json.gz`;
export const LEAD_READ = join(HERE, 'results-household.txt');
/* HS's split, by the lead test's printed verdict on its split's search (SHAPES.md) */
export function hsSplitOf(text) {
  const m = String(text).match(/THE SEARCH (GOES|STAYS)/g);
  if (!m || new Set(m).size !== 1) throw new Error('audit-shapes: the lead test\'s read prints no single verdict on the split\'s search');
  return m[0] === 'THE SEARCH GOES' ? 'even' : 'best5';
}
export const STAMP_FILES = ['audit-shapes.mjs', 'shapes-panel.mjs', 'reduce-shapes.mjs', 'SHAPES.md', 'batch-shapes.sh', 'household.mjs', 'audit-household.mjs', 'audit-couples.mjs', 'audit-couples-share.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'share-rules-panel.mjs', 'couples-panel-d4b.json', 'share-rules-panel.json', 'shapes-panel.json', 'results-household.txt', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : f === 'shapes-panel.json' ? SHAPES_PANEL : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const optionsOf = (arm, cp) => (arm === 'K2' ? { shareRule: cp.meta.shareRule ?? null, tieJoint: cp.tieJoint ?? null, tieLook: cp.tieLook ?? null, holdPast: cp.holdPast ?? null, topK: cp.topK ?? null }
  : arm === 'HS' ? { household: cp.meta.household, move: 'single', split: cp.split ?? null, tieAboveCap: cp.H.tieAboveCap ?? null }
    : arm === 'CEIL' ? { household: cp.meta.household, ceiling: 'withTable', tieAboveCap: cp.H.tieAboveCap ?? null } : { app: 'armA' });
const js = x => JSON.stringify(x);
const zeroCounts = () => ({ decisions: 0, far: 0, down: 0 });

/* THE SETTINGS CHECK, AS SHAPES.md AMENDMENT 1 HAS IT (17 Nov; D125: D124 (1)'s form for the lowest spending level). On the
   two tables' settings lines (audit-household.mjs lineOf): the household table's line is the first person's, the tie-break
   the one difference (the household table takes the candidate's, the first person's none); the minimum pot is left out and
   the household table's held to the household's own (D124 (1)); the spending levels are compared with the lowest left out,
   and the household table's lowest held to the household's own floor over its target, rounded to six places as the levels
   are (each table's lowest level is its own plan's floor over its own target, so a person's table solved on their share
   of the household's figures can part from the household table's there and nowhere else). SHAPES_PLANT, for the planted
   checks alone: 'alllevels' compares the levels whole, as before the amendment; 'nolevelhold' skips the hold. */
export const SHAPES_PLANT = { name: '' };
const round6 = x => Math.round(x * 1e6) / 1e6;
export function shapesLineProblems(selfLine, houseLine, floor, houseFloorFrac) {
  const kv = line => Object.fromEntries(line.match(/(\S+) (\S+)/g).map(x => x.split(' ')));
  const a = kv(selfLine), b = kv(houseLine), keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const levels = v => String(v).split(',').map(Number), upper = v => { const l = levels(v), lo = Math.min(...l); return l.filter(x => x !== lo).join(','); };
  const same = k => (k === 'levels' && SHAPES_PLANT.name !== 'alllevels' ? upper(a[k]) === upper(b[k]) : a[k] === b[k]);
  const differ = keys.filter(k => k !== 'minPot' && !same(k)), bad = differ.filter(k => k !== 'tieAboveCap').map(k => `household: ${k} ${b[k]}, the first person's ${a[k]}`);
  if (!(Number(b.minPot) === Number(floor))) bad.push(`household: minPot ${b.minPot}, not the household's ${floor}`);
  if (Number(b.tieAboveCap) !== APP_CANDIDATE.tieAboveCap) bad.push(`household: tieAboveCap ${b.tieAboveCap} (want the candidate's ${APP_CANDIDATE.tieAboveCap})`);
  if (Number(a.tieAboveCap) !== 0) bad.push(`self: tieAboveCap ${a.tieAboveCap} (want none)`);
  if (SHAPES_PLANT.name !== 'nolevelhold') { const lo = Math.min(...levels(b.levels)); if (!(houseFloorFrac > 0) || lo !== round6(houseFloorFrac)) bad.push(`household: its lowest spending level ${lo}, not the household's own floor over its target ${round6(houseFloorFrac)}`); }
  return bad;
}
/* the planted checks of the amended settings check (SHAPES.md amendment 1): each case a pair of lines as lineOf prints
   them, the household's minimum pot and its floor over its target; each plant fails the case it names */
function plantedLine() {
  const line = (levels, extra = {}) => Object.entries({ pts: 45, mix: 3, lambda: 0.0223606797749979, levels, minPot: 100000, coarse: 'w2a3b3g2c2-NT-LRVOH-h3', tieAboveCap: 0, ...extra }).map(([k, v]) => `${k} ${v}`).join(' ');
  const cases = [
    ['a person\'s lowest level its own share\'s (S147-db@penA100: 0.799985 against 0.8) passes', line('1,1.1,0.95,0.9,0.799985'), line('1,1.1,0.95,0.9,0.8', { minPot: 120000, tieAboveCap: APP_CANDIDATE.tieAboveCap }), 120000, 0.8, true],
    ['the household\'s lowest level not its own floor over its target is refused', line('1,1.1,0.95,0.9,0.8'), line('1,1.1,0.95,0.9,0.75', { minPot: 120000, tieAboveCap: APP_CANDIDATE.tieAboveCap }), 120000, 0.8, false],
    ['another level parting is refused', line('1,1.1,0.95,0.85,0.8'), line('1,1.1,0.95,0.9,0.8', { minPot: 120000, tieAboveCap: APP_CANDIDATE.tieAboveCap }), 120000, 0.8, false],
    ['another setting parting is refused', line('1,1.1,0.95,0.9,0.8', { lambda: 0.05 }), line('1,1.1,0.95,0.9,0.8', { minPot: 120000, tieAboveCap: APP_CANDIDATE.tieAboveCap }), 120000, 0.8, false],
    ['the household\'s minimum pot not its own is refused', line('1,1.1,0.95,0.9,0.8'), line('1,1.1,0.95,0.9,0.8', { minPot: 110000, tieAboveCap: APP_CANDIDATE.tieAboveCap }), 120000, 0.8, false]
  ];
  const run = () => cases.map(([label, self, house, floor, frac, pass]) => ({ label, ok: (shapesLineProblems(self, house, floor, frac).length === 0) === pass }));
  let bad = 0;
  SHAPES_PLANT.name = '';
  for (const c of run()) { if (!c.ok) bad++; console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.label}`); }
  // each plant fails exactly the case it names
  for (const [plant, want] of [['alllevels', [0]], ['nolevelhold', [1]]]) {
    SHAPES_PLANT.name = plant;
    const failed = run().map((c, i) => (c.ok ? -1 : i)).filter(i => i >= 0);
    SHAPES_PLANT.name = '';
    const ok = JSON.stringify(failed) === JSON.stringify(want);
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} the plant '${plant}' fails case ${want.map(i => i + 1).join(', ')} alone (it fails ${failed.map(i => i + 1).join(', ') || 'none'})`);
  }
  console.log(bad ? `PLANTED: ${bad} FAILED` : `PLANTED: ALL PASS (${cases.length + 2})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit(plantedLine() ? 1 : 0);
  const units = readShapesPanel();
  if (args[0] === '--units') { units.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(units.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-shapes: part k/${units.length}`); process.exit(2); }
  const OUT = process.env.SH_OUT || join(HERE, 'results', `shapes-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SH_PTS) || PTS, n = Number(process.env.SH_N) || N, smoke = pts !== PTS || n !== N;
  const split = hsSplitOf(readFileSync(LEAD_READ, 'utf8'));
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const U = units[pk], t0 = Date.now(), order = orderOf(pk), candidate = hashOf(COUPLES_CANDIDATE);
  const { a, hp, mirrored } = solverPlanOf(U.plan, U.shape);
  console.log(`SHAPES (EXPLORATORY): unit ${pk}/${pn}: ${U.id} (${U.base}, ${U.shape}${mirrored ? ', handed to the solvers as its mirror' : ''}), target ${U.target}, seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}, the joint move ${js(JOINT)}, HS at the split '${split}', the arms in the order ${order.join(', ')}`);
  if (a.label !== U.label) { console.error(`audit-shapes: ${U.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  const aDemo = E.resolveMpaa(a.planState).demographics, ages = mirrored ? { mpaaAgeSelf: aDemo.mpaaAgePart, mpaaAgePart: aDemo.mpaaAgeSelf } : { mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart };
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now();
  const k2 = CPL.solveCouple(E, M, hp, { solveOne, ...JOINT });
  const s1 = Date.now();
  const house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(pts, light), topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
  const s2 = Date.now(), solveSecs = { APP: 0, K2: (s1 - s0) / 1000, HS: (s2 - s1) / 1000, CEIL: (s2 - s1) / 1000 };
  const cps = { K2: k2, HS: { ...house, split, counts: zeroCounts() }, CEIL: house };
  const lines = ['self', 'part'].map(w => settingsOf(k2.tables[w])), hline = settingsOf(house.H);
  const off = [...(smoke ? [] : [...lines.flatMap((line, i) => wantProblems('CANDC', line, W).map(p => `${i ? 'part' : 'self'}: ${p}`)), ...wantProblems('CANDC', hline, W).map(p => `household: ${p}`)]), ...shapesLineProblems(lineOf(k2.tables.self), lineOf(house.H), k2.m.ctx.solvencyFloor || 0, house.hm.ctx.floorFrac || 0), ...coupleProblems()];
  if (k2.m.ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) off.push(`the household's minimum pot ${k2.m.ctx.solvencyFloor}, not the unit's ${U.plan.config.solvencyFloor}`);
  if (off.length) { console.error(`audit-shapes: ${U.id}: ${off.join('; ')}`); process.exit(3); }
  const digest = async () => ({ self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)), household: await digestOf(tablesOf(house.H)) });
  const before = await digest();
  const caps = [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], cap = caps[0] + caps[1];
  const bias = biasesOf(k2.m, hp);
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), forecast = { APP: null, HS: survAt(house.H, vecOf(house.hm, mergedState(house, st0))) };
  forecast.CEIL = forecast.HS;
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s, the household table ${solveSecs.HS.toFixed(0)} s; share ${k2.share}; caps ${caps.join(' and ')}, the household's ${house.H.estateCap}; biases: ${bias.lockedYears} locked years, the first person's share of the pensions ${bias.penShareSelf.toFixed(3)}, income tax left out ${Math.round(bias.incomeTaxLeftOut.aYear)} a year, ${bias.oneOffOwned.length} one-off deposits | self: ${lines[0]} | part: ${lines[1]} | household: ${hline}`);
  const withAges = plan => ({ ...plan, demographics: { ...plan.demographics, ...ages } });
  const ctxOf = arm => {
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-shapes: ${U.id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, couple ${ctx.isCouple}`); process.exit(3); }
      return ctx;
    }
    if (arm === 'K2') return E.buildContext(CPL.withCouple(withAges(k2.plan), k2));
    if (arm === 'HS') return E.buildContext(withHouseholdSingle(withAges(house.plan), cps.HS));
    return twoBands(E, () => E.buildContext(withTable(house.hplan, house.H)));
  };
  const T = ctxOf('K2').totalYears, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const arms = {}, b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
  const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
  const chunk = smoke && Number(process.env.SH_CHUNK) > 0 ? Number(process.env.SH_CHUNK) : CHUNK;
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  for (const arm of order) {
    const cp = cps[arm] || null, ctx = ctxOf(arm), o = optionsOf(arm, cp), pf = partOf(OUT, U.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-shapes: ${U.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [], counts = cp && cp.counts ? zeroCounts() : null;
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.seed === SEED && P.N === n && P.pts === pts && P.chunk === chunk && js(P.digests) === js(before) && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); done = P.done; chunks = P.chunks; if (counts) counts = { ...P.counts };
        console.log(`${''.padEnd(8)} resumed ${arm} at path ${done} of ${n}, from a part saved by ${[...new Set(chunks.map(c => c.proc))].join(', ')}`);
      } else console.log(`${''.padEnd(8)} a saved part of ${arm} is not this unit's as solved now: ${arm} starts again`);
    }
    if (done < n) for (let k = 0; k < Math.min(WARM, n); k++) runPath(ctx, paths[k], false);
    if (counts) cp.counts = counts;
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
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed: SEED, N: n, pts, chunk, digests: before, options: o, done, chunks, ...(counts ? { counts: { ...cp.counts } } : {}), arrays: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
      renameSync(tmp, pf);
    }
    const countsDone = counts ? { ...cp.counts } : null;
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-shapes: ${U.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), wallMs = chunks.reduce((t, x) => t + x.wallMs, 0), procs = [...new Set(chunks.map(x => x.proc))];
    arms[arm] = { options: o, cpuUs, wallMs, chunks, procs, cpus: [...new Set(chunks.map(x => x.cpu))], place: order.indexOf(arm), T, solveSecs: solveSecs[arm], forecast: forecast[arm], ...(countsDone ? { counts: countsDone } : {}), ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    const surv = smoke ? 'a smoke: no figure printed' : `${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}`;
    console.log(`${''.padEnd(8)} done ${arm}: ${js(o)}; engine ${surv}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path), in ${procs.length} process${procs.length > 1 ? 'es' : ''}`);
  }
  const after = await digest();
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, base: U.base, shape: U.shape, mirrored, target: U.target, seed: SEED, N: n, warm: WARM, pts, W, candidate, joint: JOINT, split, order, cap, caps, houseCap: house.H.estateCap, share: k2.share, shareRule: k2.meta.shareRule, bias, stamp: STAMP, digests: { before, after }, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
