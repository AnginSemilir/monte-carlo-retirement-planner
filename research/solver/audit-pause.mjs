/*
 * PAUSE: WHERE EACH ARM PAUSES, AGAINST THE STEEPEST POINT OF ITS OWN READ OVER THE USED ALLOWANCE (PLAN.md O103's gate;
 * the deep review after XAS-R, deep-review-log.md 5 Oct 23:18 UK: "O103's measurement now"). A MEASUREMENT
 * (predictions/measure-pause.md, Kind: measurement): no arm is judged.
 * EDGE-SPLIT's unit (audit-edge.mjs: no reader, the product's settings, lambda held, the estate weight 0.02, 30 points, seed
 * 7005, death tax 0) on S130, its eight arms - EDGE-SPLIT's seven and HYB (PCLSI's tables, the snapped read) - over the
 * first N paths of EDGE-SPLIT's (path i is built from seed + i x 7919, so the first N are EDGE-SPLIT's first N):
 *   1. the forward run as audit-edge.mjs runs it, recording u (the used share of the lump sum allowance, st[4] / lsa), the
 *      pension pot and the other pots each year, so the reducer can hold them to EDGE-SPLIT's (and HYB's) files path for path;
 *   2. at each FLAT YEAR (derive-hyb-edges.mjs flatYears: the pension pot above 10,000 and u growing by under 0.01 to the next
 *      year; u under 0.99, since a spent allowance cannot pause), the arm's read over u: the chooser's score of its best move (chooseAction over the mixture) at the year's
 *      own state with st[4] set to u x lsa, for u = 0, 0.05, ..., 1, every other coordinate and the tiers held as the run held them
 *      (the envelope, the chooser's switch-margin stay rule included), AND the score of the move the run took that year, read at
 *      the same u (the read along one fixed move: the primary measure, the plan-auditor's BLOCKING 2 of 6 Oct on 1fde232), and
 *      whether the chooser's move at u differs from it.
 * SELF-CHECK (refused by the reducer if it fails or ran on nothing): at the state's own u, through the same setter, the chooser
 *   takes the move the run took and both scores equal the forward run's, at every flat year.
 * Parts: four processes, two arms each, one solve each (SNAP's or PCLSI's tables).
 *   node research/solver/audit-pause.mjs [points=30] [paths=1000] part k/4 [seed=7005]
 * PAUSE_HH=S128 (PAUSE-S128, predictions/measure-pause-s128.md: the deep review after PAUSE's out-of-sample step): the same
 *   run on S128, three arms (SNAP, P-LO, HYB), one a part: part k/3. Unset, the run is PAUSE's on S130 as registered.
 *   PAUSE_PLANT=scale: the setter writes u, not u x lsa (the self-check must refuse it)
 */
// e3 off, as audit-edge.mjs (the identity holds this run to EDGE-SPLIT's files, which ran with it off)
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const PLANT = process.env.PAUSE_PLANT || '';
if (PLANT && PLANT !== 'scale') { console.error(`audit-pause: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 1000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-pause: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
const SEED = process.argv[6] ? Number(process.argv[6]) : 7005;
if (!(SEED >= 1)) { console.error(`audit-pause: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02, ID = process.env.PAUSE_HH || 'S130';
if (ID !== 'S130' && ID !== 'S128') { console.error(`audit-pause: PAUSE_HH ${ID} (S130 or S128)`); process.exit(2); }
// audit-edge.mjs's ARM, copied, and HYB's arm (audit-hyb.mjs: PCLSI's tables, the snapped read)
export const ARM = { SNAP: { tables: 'SNAP', read: false, seg: null }, 'S-LO': { tables: 'SNAP', read: true, seg: 'lo' }, 'S-HI': { tables: 'SNAP', read: true, seg: 'hi' }, 'S-INT': { tables: 'SNAP', read: true, seg: null },
  PCLSI: { tables: 'PCLSI', read: true, seg: null }, 'P-LO': { tables: 'PCLSI', read: true, seg: 'lo' }, 'P-HI': { tables: 'PCLSI', read: true, seg: 'hi' }, HYB: { tables: 'PCLSI', read: false, seg: null } };
export const PARTS = ID === 'S128' ? [['SNAP'], ['P-LO'], ['HYB']] : [['SNAP', 'S-LO'], ['S-HI', 'S-INT'], ['PCLSI', 'P-LO'], ['P-HI', 'HYB']];
export const UGRID = Array.from({ length: 21 }, (_, i) => i / 20);
if (!(pn === PARTS.length && pk >= 0 && pk < pn) && !(pn === 1 && pk === 0)) { console.error(`audit-pause: bad part ${part} (${PARTS.length} parts, or 0/1 for all)`); process.exit(2); }
const MINE = pn === 1 ? PARTS.flat() : PARTS[pk];
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
console.log(`PAUSE: EDGE-SPLIT's unit (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, the first ${NP} paths (seed ${SEED}), death tax 0; ${MINE.join(', ')} on ${ID}; the read over u at ${UGRID.length} points`);

const M9 = 1000000007, f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const OUT = process.env.DIAGPAUSE_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagpause');
const gridsOf = r => [...new Set([r.g, ...(r.mix ? r.mix.tables.map(t => t.g) : [])])];

const h = all.find(s => s.id === ID);
if (!h) { console.error(`audit-pause: no case ${ID}`); process.exit(2); }
// audit-edge.mjs's plan and solve, as it runs them
const config = { ...h.plan.config, guardrails: false, lookaheadYears: 0 };
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const solved = {};
const tablesOf = name => {
  if (solved[name]) return solved[name];
  const t0 = Date.now(), r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, ...(name === 'PCLSI' ? { pclsInterp: true } : {}) });
  const m = r.m;
  if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds || r.tieMargin !== 0) { console.error(`audit-pause: ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} tieMargin ${r.tieMargin}`); process.exit(2); }
  if (gridsOf(r).some(g => g.pclsInterp !== (name === 'PCLSI') || g.pcls.join(',') !== '0,0.5,1')) { console.error(`audit-pause: ${name} solved pclsInterp ${gridsOf(r).map(g => g.pclsInterp)} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
  if (Math.abs(m.ctx.pensionDeathTaxRate) > 1e-12) { console.error(`audit-pause: ran the death tax at ${m.ctx.pensionDeathTaxRate}`); process.exit(2); }
  solved[name] = { r, secs: Math.round((Date.now() - t0) / 1000) };
  return solved[name];
};

for (const arm of MINE) {
  const A = ARM[arm], L = `OFF/PRODUCT/W${W}/${arm}`;
  console.log(`${ID.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
  const fresh = !solved[A.tables], { r, secs } = tablesOf(A.tables), m = r.m, T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
  console.log(`${''.padEnd(16)} solve ${L}: ${fresh ? `secs ${secs}` : `shared ${A.tables}`}`);
  const grids = gridsOf(r);
  for (const g of grids) { g.pclsInterp = A.read; g.pclsSeg = A.seg; }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.meta.switchMargin} pcls ${r.g.pcls.join(',')} tables ${A.tables} read ${grids.every(g => g.pclsInterp === A.read) ? A.read : 'mixed'} seg ${grids.every(g => g.pclsSeg === A.seg) ? A.seg || 'none' : 'mixed'} tieMargin ${r.tieMargin} deathTax ${m.ctx.pensionDeathTaxRate}`;
  console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
  console.log(`${''.padEnd(16)} access ${L}: year ${access} years ${T} lsa ${lsa} open ${Math.round(m.ctx.accounts.reduce((x, a) => x + a.balance, 0))}`);
  const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now(), Y = T + 1, D = 8;
  const U = new Float32Array(NP * Y).fill(NaN), PV = new Float32Array(NP * Y).fill(NaN), NV = new Float32Array(NP * Y).fill(NaN);
  const ST = new Float64Array(NP * Y * D).fill(NaN), SCO = new Float64Array(NP * Y).fill(NaN), HD = new Float64Array(NP * Y * 3).fill(NaN), AI = new Int32Array(NP * Y).fill(-1);
  let row = 0, ok = 0, tax = 0, net = 0, chk = 0, odd = 0, wide = 0;
  // the forward run, as audit-edge.mjs's, keeping each pension-live year's state and the chosen move's score
  const choose = (t, st, hd) => {
    const ai = chooseAction(r, st, t, hd);
    if (t <= T) {
      const o = row * Y + t; U[o] = Math.min(1, st[4] / lsa); PV[o] = st[0]; NV[o] = st[1] + st[2];
      if (st[0] > 1e4) { if (!hd || Object.keys(hd).sort().join() !== 'gia,isa,pen') odd++; else { HD[o * 3] = hd.pen; HD[o * 3 + 1] = hd.isa; HD[o * 3 + 2] = hd.gia; } if (st.length > D) wide++; for (let d = 0; d < Math.min(D, st.length); d++) ST[o * D + d] = st[d]; SCO[o] = r._sc[ai]; AI[o] = ai; }
    }
    return ai;
  };
  paths.forEach((zs, j) => {
    row = j;
    const o = runPolicy(r, zs, { choose });
    if (o.survived) ok++; tax += o.lifetimeTax; net += o.terminalNet;
    chk = (((chk * 31 + Math.round(1e6 * Number(zs[0]))) % M9) + M9) % M9;
  });
  console.log(`${''.padEnd(16)} sum ${L}: paths ${NP} survived ${ok} tax ${f2(tax / NP)} net ${f2(net / NP)} pathsum ${chk} secs ${Math.round((Date.now() - t1) / 1000)}`);
  if (odd || wide) { console.error(`audit-pause: ${arm}: ${odd} pension-live years with held tiers not { pen, isa, gia }, ${wide} states wider than ${D}: the sweep cannot hold them`); process.exit(2); }
  // the sweep at every flat year
  const t2 = Date.now(), FP = [], FT = [], FU = [], FV = [], FX = [], FC = [];
  let rep = 0, repBad = 0;
  const s = new Float64Array(D);
  const scoreAt = (o, t, u) => {
    let n = 0; for (let d = 0; d < D; d++) { const v = ST[o * D + d]; if (Number.isNaN(v)) break; s[d] = v; n = d + 1; }
    const st = s.subarray(0, n);
    st[4] = PLANT === 'scale' ? u : u * lsa;
    const hd = { pen: HD[o * 3], isa: HD[o * 3 + 1], gia: HD[o * 3 + 2] }, gh = r.giaHold, ai = chooseAction(r, st, t, hd); r.giaHold = gh;
    // env: the chooser's own move's score (its stay rule included); fix: the score of the move the run took at this year,
    // read at u (the read along one move, no move change or stay rule in it); changed: whether the chooser's move differs
    return { env: r._sc[ai], fix: r._sc[AI[o]], changed: ai !== AI[o] ? 1 : 0 };
  };
  for (let j = 0; j < NP; j++) for (let t = 0; t + 1 < Y; t++) {
    const o = j * Y + t, x = U[o];
    if (!(PV[o] > 1e4) || !(U[o + 1] - x < 0.01) || !(x < 0.99) || Number.isNaN(SCO[o])) continue;   // a spent allowance (u 0.99 or more) cannot pause
    rep++; const v0 = scoreAt(o, t, ST[o * D + 4] / lsa), tol = 1e-9 * Math.max(1, Math.abs(SCO[o]));
    if (!(Math.abs(v0.env - SCO[o]) <= tol && Math.abs(v0.fix - SCO[o]) <= tol && v0.changed === 0)) repBad++;
    FP.push(j); FT.push(t); FU.push(x);
    for (const u of UGRID) { const v = scoreAt(o, t, u); FV.push(v.env); FX.push(Number.isFinite(v.fix) ? v.fix : NaN); FC.push(v.changed); }
  }
  for (const g of grids) { g.pclsInterp = A.tables === 'PCLSI'; g.pclsSeg = null; }
  console.log(`${''.padEnd(16)} sweep ${L}: flat ${FP.length} points ${UGRID.length} repro ${rep - repBad}/${rep} secs ${Math.round((Date.now() - t2) / 1000)}`);
  const file = `${ID}-${arm.toLowerCase()}.json.gz`;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, file), gzipSync(JSON.stringify({ id: ID, arm, read: A.read, seg: A.seg, tables: A.tables, stamp: STAMP, plant: PLANT || null, N: NP, Y, seed: SEED, lsa, ugrid: UGRID,
    u: b64(U), pen: b64(PV), non: b64(NV), fp: FP, ft: FT, fu: FU, fv: b64(Float64Array.from(FV)), fx: b64(Float64Array.from(FX)), fc: b64(Uint8Array.from(FC)) })));
  console.log(`${''.padEnd(16)} trace ${L}: file ${file} paths ${NP} years ${Y}`);
  console.log(`${''.padEnd(16)} done ${L}`);
}
