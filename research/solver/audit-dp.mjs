/*
 * THE DRAW-PAUSE MEASUREMENT (PLAN.md O71, O77; the maintainer's answers of 1 Oct 06:45 UK - 'a product-level measurement
 * of the draw pause: how many library households, how long', no product change before Phase 4 - and 1 Oct 10:37 UK - on the
 * product's own settings, as dwell time and yearly growth at the wall against the years before it). A MEASUREMENT, not a
 * test (launched under predictions/measure-dp.md, Kind: measurement): it counts, it settles nothing.
 * The shipping default (7af's SHIP unit: solvePlan at the product's settings, no bridge reader, lambda held at S126's, the
 * estate weight 0.02, 30 points), on each household named, run forward on N paths (seed 7002) with the product's own
 * chooser; at every path-year alive the used share of the lump sum allowance u = min(1, cumPcls / lsa) (grid.js vecOf's
 * slot 4), and per household:
 *   reach:  paths with u at 0.6 or more in some year (the wall band is 0.6 to under 0.75, O71: the snap reads 0.75 and above
 *           as the last bucket);
 *   cross:  paths with u at 0.75 or more in some year;
 *   dwell:  over the reaching paths, the years spent in the wall band;
 *   growth: the mean yearly growth of u over path-years in the wall band, and over path-years in the pre-wall band (0.3 to
 *           under 0.6), after pension access (O77: a pause is dwell and growth at the wall against the years before it);
 *   pause:  paths whose dwell is 2 years or more and whose own mean yearly growth in the wall band is under a quarter of
 *           their own mean yearly growth in the pre-wall band (paths with no pre-wall growth are not counted); with the
 *           pausing paths' dwell (mean, median, longest);
 *   stall:  7ap's strict count beside it (wall path-years whose u does not grow to the next year; O77: it has a floor that is
 *           not the snap's).
 * The households: 7e's panel (7af's and 7ag's 25: the Phase 4 panel, chosen by a rule that never looks at the solver), the
 * built ones (share, bridge, wealth and bridge 4+cost) made as audit-s126.mjs makes them (its variant(), copied here so
 * that file's stamp is unchanged).
 *   node research/solver/audit-dp.mjs [points=30] [paths=2000] part k/n [seed=7002]
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
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-dp: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-dp: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-dp: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;
export const WALL = [0.6, 0.75], PRE = [0.3, 0.6], PAUSE_DWELL = 2, PAUSE_RATIO = 0.25;

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
if (process.argv[2] === '--units') { console.log(PANEL.length); process.exit(0); }
console.log(`DRAW-PAUSE MEASUREMENT (O71, O77): the shipping default (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, ${NP} paths (seed ${SEED}); the used allowance at every path-year alive; the wall band ${WALL.join(' to under ')}, the pre-wall band ${PRE.join(' to under ')}; ${PANEL.length} households; part ${pk}/${pn}`);

PANEL.forEach((id, i) => {
  if (i % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-dp: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit OFF/PRODUCT/W${W} | lambda ${LAMBDA}`);
  // measureV2's plan (audit-s126.mjs l.163) and 7af's SHIP solve (bridgeRead false, the estate weight 0.02)
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W });
  const m = r.m, T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
  if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds) { console.error(`audit-dp: ${id} ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.switchMargin} pcls ${r.g.pcls.join(',')} pclsInterp ${r.g.pclsInterp === true}`;
  console.log(`${''.padEnd(16)} solve OFF/PRODUCT/W${W}: secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran OFF/PRODUCT/W${W}: ${ran}`);
  console.log(`${''.padEnd(16)} access OFF/PRODUCT/W${W}: year ${access} years ${T} lsa ${lsa}`);
  const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now();
  const U = new Float32Array(NP * (T + 1)).fill(NaN);
  let row = 0, ok = 0;
  const choose = (t, st, held) => { if (t <= T) U[row * (T + 1) + t] = Math.min(1, st[4] / lsa); return chooseAction(r, st, t, held); };
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
  console.log(`${''.padEnd(16)} dp OFF/PRODUCT/W${W}: paths ${NP} survived ${ok} reach ${reach} cross ${cross} dwell ${reach ? f4(dwellSum / reach) : '-'} wallpy ${wallPY} wallgrowth ${wallPY ? f4(wallG / wallPY) : '-'} prepy ${prePY} pregrowth ${prePY ? f4(preG / prePY) : '-'} pause ${pause} pausedwell ${pauseDwell.length ? f4(pauseDwell.reduce((a, b) => a + b, 0) / pauseDwell.length) : '-'} pausemedian ${pauseDwell.length ? pauseDwell[Math.floor((pauseDwell.length - 1) / 2)] : '-'} pausemax ${pauseDwell.length ? pauseDwell[pauseDwell.length - 1] : '-'} stall ${stall} secs ${Math.round((Date.now() - t1) / 1000)}`);
  console.log(`${''.padEnd(16)} dwell OFF/PRODUCT/W${W}: ${[...dwellHist].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d}:${n}`).join(' ') || '-'}`);
  console.log(`${''.padEnd(16)} done OFF/PRODUCT/W${W}`);
});
