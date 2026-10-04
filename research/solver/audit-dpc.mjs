/*
 * THE THREE-ARM DRAW-PAUSE CONTRAST (PLAN.md DPC; O71, O83; the deep review after DP, deep-review-log.md 4 Oct 04:41 UK; the
 * maintainer's go-ahead of 4 Oct, the 08:17 row). A MEASUREMENT (launched under predictions/measure-dpc.md, Kind:
 * measurement). audit-dp.mjs's measurement on DP's panel, paths and seed under the shipping default (7af's SHIP unit: no
 * reader, the product's settings, lambda held, the estate weight 0.02, 30 points), in three arms of the used-allowance axis:
 *   SNAP:  today's (buckets 0, 0.5, 1, nearest snap: the cliff at 0.75) - DP's own unit, its lines held to DP's records;
 *   PCLSI: the axis interpolated on 0, 0.5, 1 (7ap's; no cliff);
 *   SHIFT: buckets 0, 0.6, 1 snapped (research only: the cliff moved to 0.8).
 * Each arm prints DP's lines (dp, dwell: the wall band 0.6 to under 0.75 as DP defined it, so SNAP is held to DP) and, beside
 * them, read against the arm's own cliff c (0.75 for SNAP and PCLSI, 0.8 for SHIFT):
 *   dist:    the after-access path-years with u in [c - 0.3, c), by their distance to the cliff in units of the path's own
 *            yearly pace in the pre-wall band (0.3 to under 0.6, after access): d = (c - u) / pace, in bins under 0.5, 0.5 to
 *            1, 1 to 2, 2 to 4, 4 and over, and paths with no pre-wall pace; per bin the count and the mean pension share of
 *            the path's wealth (the pension over the pension, ISA and taxable account with cash) - the snap's hold predicts
 *            excess time within one year's pace of its own cliff with the pension still large, gone under PCLSI and moved
 *            under SHIFT; run-down predicts plateaus spread across the band with the pension near 0, alike in every arm;
 *   plateau: the paths that reach 0.6 and never reach c and are alive at the plan's end: their count, and at the plan's end
 *            their mean used share (where the plateau sits), pension share and pension in years of the target spend;
 * Not recorded (declared in the registration): the move's order per path-year; the readings above do not use it.
 *   sp:      the plan year the State Pension starts, and the mean yearly growth of u in that year and the year before,
 *            for path-years under 0.6 and in [0.6, c) - the State Pension's onset predicts a drop at that year at any u,
 *            alike in every arm.
 *   node research/solver/audit-dpc.mjs [points=30] [paths=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-dpc: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-dpc: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-dpc: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;
export const WALL = [0.6, 0.75], PRE = [0.3, 0.6], PAUSE_DWELL = 2, PAUSE_RATIO = 0.25;
// the arms: [name, solvePlan's allowance options, the arm's own cliff]
export const ARMS = [['SNAP', {}, 0.75], ['PCLSI', { pclsInterp: true }, 0.75], ['SHIFT', { pclsBuckets: [0, 0.6, 1] }, 0.8]];
export const DBINS = [[0, 0.5, 'd0'], [0.5, 1, 'd05'], [1, 2, 'd1'], [2, 4, 'd2'], [4, Infinity, 'd4']];

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
/* audit-s126.mjs's variant(), copied (l.75-93): S126 with its pension share, bridge length and wealth changed, and optionally a
   one-off cost [years from now, amount] */
function variant(name, { a0 = 0.85, bridge = 2, scale = 1, cost = null } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  if (cost) {
    const y = E.buildContext(E.normalizePlan(p)).baseYear + cost[0];
    p.oneOffCosts = [...(p.oneOffCosts || []), { id: 'f1cost', date: `${y}-06-01`, year: y, owner: 'Myself', amount: cost[1], desc: 'One-off cost (test)' }];
  }
  return { id: name, plan: p };
}
// 7e's panel: 7af's 16 then 7ag's 9 (reduce-7af.mjs and reduce-7ag.mjs PANEL)
export const PANEL = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
  'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
const BUILT = { 'share 0.50': { a0: 0.5 }, 'share 0.70': { a0: 0.7 }, 'share 0.78': { a0: 0.78 }, 'share 0.90': { a0: 0.9 }, 'share 0.95': { a0: 0.95 }, 'bridge 0': { bridge: 0 }, 'bridge 1': { bridge: 1 }, 'bridge 4': { bridge: 4 }, 'bridge 6': { bridge: 6 }, 'wealth x0.5': { scale: 0.5 }, 'wealth x2': { scale: 2 }, 'bridge 4+cost': { bridge: 4, cost: [2, 30000] } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
export const UNITS = PANEL.flatMap(id => ARMS.map(a => [id, a[0]]));
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
console.log(`THE THREE-ARM DRAW-PAUSE CONTRAST (O71, O83): the shipping default (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, ${NP} paths (seed ${SEED}); the allowance axis snapped (SNAP), interpolated (PCLSI) and snapped on 0, 0.6, 1 (SHIFT); DP's lines and the arm's own cliff's; ${UNITS.length} units (${PANEL.length} households x ${ARMS.length} arms); part ${pk}/${pn}`);

UNITS.forEach(([id, arm], i) => {
  if (i % pn !== pk) return;
  const [, AO, CLIFF] = ARMS.find(a => a[0] === arm), L = `OFF/PRODUCT/W${W}${arm === 'SNAP' ? '' : `/${arm}`}`;
  const h = caseOf(id);
  if (!h) { console.error(`audit-dpc: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
  // measureV2's plan (audit-s126.mjs l.163) and 7af's SHIP solve (bridgeRead false, the estate weight 0.02)
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, ...AO });
  const m = r.m, T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
  if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds) { console.error(`audit-dpc: ${id} ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  if (r.g.pclsInterp !== (arm === 'PCLSI') || r.g.pcls.join(',') !== (arm === 'SHIFT' ? '0,0.6,1' : '0,0.5,1')) { console.error(`audit-dpc: ${id} ${arm} ran pclsInterp ${r.g.pclsInterp} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.switchMargin} pcls ${r.g.pcls.join(',')} pclsInterp ${r.g.pclsInterp === true}`;
  console.log(`${''.padEnd(16)} solve ${L}: secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
  console.log(`${''.padEnd(16)} access ${L}: year ${access} years ${T} lsa ${lsa}`);
  const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now();
  const U = new Float32Array(NP * (T + 1)).fill(NaN), PS = new Float32Array(NP * (T + 1)).fill(NaN), PV = new Float32Array(NP * (T + 1)).fill(NaN);
  let row = 0, ok = 0;
  // the used share and, beside it, the pension's share of the wealth and the pension itself (grid.js vecOf's slots 0 to 2)
  const choose = (t, st, held) => { if (t <= T) { const o = row * (T + 1) + t, w = st[0] + st[1] + st[2]; U[o] = Math.min(1, st[4] / lsa); PS[o] = w > 0 ? st[0] / w : 0; PV[o] = st[0]; } return chooseAction(r, st, t, held); };
  paths.forEach((zs, j) => { row = j; const o = runPolicy(r, zs, { choose }); if (o.survived) ok++; });
  // the per-path measures
  let reach = 0, cross = 0, dwellSum = 0, pause = 0, wallPY = 0, wallG = 0, prePY = 0, preG = 0, stall = 0;
  const pauseDwell = [], dwellHist = new Map();
  for (let j = 0; j < NP; j++) {
    let rj = false, cj = false, dwell = 0, wg = 0, wn = 0, pg = 0, pnn = 0;
    for (let t = 0; t <= T; t++) {
      const u = U[j * (T + 1) + t];
      if (u !== u) continue;
      if (u >= WALL[0]) rj = true;
      if (u >= WALL[1]) cj = true;
      const u1 = t < T ? U[j * (T + 1) + t + 1] : NaN, inWall = u >= WALL[0] && u < WALL[1];
      if (inWall) dwell++;
      if (t >= access && u1 === u1) {
        if (inWall) { wg += u1 - u; wn++; wallPY++; wallG += u1 - u; if (u1 <= u + 1e-9) stall++; }
        else if (u >= PRE[0] && u < PRE[1]) { pg += u1 - u; pnn++; prePY++; preG += u1 - u; }
      }
    }
    if (rj) { reach++; dwellSum += dwell; dwellHist.set(dwell, (dwellHist.get(dwell) || 0) + 1); }
    if (cj) cross++;
    if (dwell >= PAUSE_DWELL && wn > 0 && pnn > 0 && pg / pnn > 0 && wg / wn < PAUSE_RATIO * (pg / pnn)) { pause++; pauseDwell.push(dwell); }
  }
  pauseDwell.sort((a, b) => a - b);
  const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-');
  console.log(`${''.padEnd(16)} dp ${L}: paths ${NP} survived ${ok} reach ${reach} cross ${cross} dwell ${reach ? f4(dwellSum / reach) : '-'} wallpy ${wallPY} wallgrowth ${wallPY ? f4(wallG / wallPY) : '-'} prepy ${prePY} pregrowth ${prePY ? f4(preG / prePY) : '-'} pause ${pause} pausedwell ${pauseDwell.length ? f4(pauseDwell.reduce((a, b) => a + b, 0) / pauseDwell.length) : '-'} pausemedian ${pauseDwell.length ? pauseDwell[Math.floor((pauseDwell.length - 1) / 2)] : '-'} pausemax ${pauseDwell.length ? pauseDwell[pauseDwell.length - 1] : '-'} stall ${stall} secs ${Math.round((Date.now() - t1) / 1000)}`);
  console.log(`${''.padEnd(16)} dwell ${L}: ${[...dwellHist].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d}:${n}`).join(' ') || '-'}`);
  // the arm's own cliff: distance in the path's pre-wall pace, plateaus, the State Pension's year
  const spend = Math.max(1, E.num(plan.spending.targetSpend, 0)), spYear = Math.max(0, m.ctx.spa - m.ctx.ageSelf0);
  const bins = Object.fromEntries([...DBINS.map(b => b[2]), 'nopace'].map(k => [k, { n: 0, ps: 0 }]));
  let plN = 0, plPs = 0, plPv = 0, plU = 0;
  const spg = { lo: [0, 0, 0, 0], band: [0, 0, 0, 0] };   // growth sum and count in the State Pension's year, then the year before
  for (let j = 0; j < NP; j++) {
    let pg = 0, pnn = 0, reach6 = false, reachC = false, last = -1;
    for (let t = 0; t <= T; t++) {
      const u = U[j * (T + 1) + t];
      if (u !== u) continue;
      last = t; if (u >= WALL[0]) reach6 = true; if (u >= CLIFF) reachC = true;
      const u1 = t < T ? U[j * (T + 1) + t + 1] : NaN;
      if (t >= access && u1 === u1 && u >= PRE[0] && u < PRE[1]) { pg += u1 - u; pnn++; }
      if (u1 === u1 && (t === spYear || t === spYear - 1)) { const k = u < WALL[0] ? 'lo' : u < CLIFF ? 'band' : null; if (k) { const at = t === spYear ? 0 : 2; spg[k][at] += u1 - u; spg[k][at + 1]++; } }
    }
    const pace = pnn > 0 ? pg / pnn : 0;
    for (let t = access; t <= T; t++) {
      const o = j * (T + 1) + t, u = U[o];
      if (u !== u || !(u >= CLIFF - 0.3 && u < CLIFF)) continue;
      const key = pace > 0 ? DBINS.find(([lo, hi]) => (CLIFF - u) / pace >= lo && (CLIFF - u) / pace < hi)[2] : 'nopace';
      bins[key].n++; bins[key].ps += PS[o];
    }
    if (reach6 && !reachC && last === T) { plN++; plU += U[j * (T + 1) + T]; plPs += PS[j * (T + 1) + T]; plPv += PV[j * (T + 1) + T] / spend; }
  }
  console.log(`${''.padEnd(16)} dist ${L}: cliff ${CLIFF} ${Object.entries(bins).map(([k, b]) => `${k} ${b.n} ${b.n ? f4(b.ps / b.n) : '-'}`).join(' ')}`);
  console.log(`${''.padEnd(16)} plateau ${L}: paths ${plN} u ${plN ? f4(plU / plN) : '-'} pshare ${plN ? f4(plPs / plN) : '-'} pyears ${plN ? f4(plPv / plN) : '-'}`);
  console.log(`${''.padEnd(16)} sp ${L}: year ${spYear} lo ${spg.lo[1]} ${spg.lo[1] ? f4(spg.lo[0] / spg.lo[1]) : '-'} before ${spg.lo[3]} ${spg.lo[3] ? f4(spg.lo[2] / spg.lo[3]) : '-'} band ${spg.band[1]} ${spg.band[1] ? f4(spg.band[0] / spg.band[1]) : '-'} before ${spg.band[3]} ${spg.band[3] ? f4(spg.band[2] / spg.band[3]) : '-'}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
