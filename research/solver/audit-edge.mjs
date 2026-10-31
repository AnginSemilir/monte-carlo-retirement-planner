/*
 * EDGE-SPLIT: WHICH SNAP EDGE CARRIES PCLSI'S GAIN (PLAN.md O101; the deep review after HYB, deep-review-log.md 5 Oct 11:50 UK).
 * A TEST (predictions/diag-edge.md). HYB's unit (ADOPT-PI's: no reader, the product's settings, lambda held, the estate
 * weight 0.02, 30 points, seed 7005, death tax 0) on S130, S128 and S370, one process a household: SNAP's and PCLSI's
 * tables solved; forward runs, each a table and a read of the allowance axis:
 *   SNAP (SNAP's tables, the snap) and PCLSI (PCLSI's tables, interpolated): HYB's arms again (the identity: the reducer holds
 *        them to HYB's per-path files, so HYB's own HYB arm - PCLSI's tables, the snap - joins the comparison);
 *   P-LO and P-HI: PCLSI's tables read interpolated on the lower or the upper segment only (grid.js pclsSeg 'lo' / 'hi'),
 *        the snap's cliff kept on the other (at 0.75 for P-LO, at 0.25 for P-HI);
 *   S-LO, S-HI and S-INT: SNAP's tables read the same two ways and interpolated throughout (S-INT: O88's separating arm).
 * Every forward run of a household uses the same paths (E.pathsForSeed at the seed), so every arm is paired by path. Each
 * forward unit prints HYB's lines, the ran line adding seg (the read's segment, or none); and saves
 * results/diagedge/<household>-<arm>.json.gz with HYB's per-path and per-path-year arrays.
 *   node research/solver/audit-edge.mjs [points=30] [paths=6000] part k/n [seed=7005]
 */
// e3 off: the identity gate holds the SNAP and PCLSI arms to ADOPT-PI's per-path files, which ran with e3 off; PCLSI is
// outside E3c's scope (research-opts.mjs)
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
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

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 6000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-edge: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-edge: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7005;
if (!(SEED >= 1)) { console.error(`audit-edge: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;
export const PANEL = ['S130', 'S128', 'S370'], ARMS = ['SNAP', 'S-LO', 'S-HI', 'S-INT', 'PCLSI', 'P-LO', 'P-HI'];
// each arm's tables and its forward read of the allowance axis: interpolated (read), and on which segment (seg, null: all)
export const ARM = { SNAP: { tables: 'SNAP', read: false, seg: null }, 'S-LO': { tables: 'SNAP', read: true, seg: 'lo' }, 'S-HI': { tables: 'SNAP', read: true, seg: 'hi' }, 'S-INT': { tables: 'SNAP', read: true, seg: null },
  PCLSI: { tables: 'PCLSI', read: true, seg: null }, 'P-LO': { tables: 'PCLSI', read: true, seg: 'lo' }, 'P-HI': { tables: 'PCLSI', read: true, seg: 'hi' } };
if (process.argv[2] === '--jobs') { console.log(PANEL.length); process.exit(0); }
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
console.log(`EDGE-SPLIT: HYB's unit (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, ${NP} paths (seed ${SEED}), death tax 0; ${ARMS.join(', ')} on ${PANEL.join(', ')}`);

const M9 = 1000000007, f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const OUT = process.env.DIAGEDGE_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagedge');
/* every grid a solve reads in the forward run: the main table's and the mixture's */
const gridsOf = r => [...new Set([r.g, ...(r.mix ? r.mix.tables.map(t => t.g) : [])])];

PANEL.forEach((id, i) => {
  if (i % pn !== pk) return;
  const h = all.find(s => s.id === id);
  if (!h) { console.error(`audit-edge: no case ${id}`); process.exit(2); }
  // ADOPT-PI's plan and solve (audit-adoptpi.mjs l.92-96), at the library's death tax 0
  const config = { ...h.plan.config, guardrails: false, lookaheadYears: 0 };
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const solved = {};
  const tablesOf = name => {
    if (solved[name]) return solved[name];
    for (const k of Object.keys(solved)) delete solved[k];   // one solve held at a time
    const t0 = Date.now(), r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, ...(name === 'PCLSI' ? { pclsInterp: true } : {}) });
    const m = r.m;
    if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds || r.tieMargin !== 0) { console.error(`audit-edge: ${id} ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} tieMargin ${r.tieMargin}`); process.exit(2); }
    if (gridsOf(r).some(g => g.pclsInterp !== (name === 'PCLSI') || g.pcls.join(',') !== '0,0.5,1')) { console.error(`audit-edge: ${id} ${name} solved pclsInterp ${gridsOf(r).map(g => g.pclsInterp)} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
    if (Math.abs(m.ctx.pensionDeathTaxRate) > 1e-12) { console.error(`audit-edge: ${id} ran the death tax at ${m.ctx.pensionDeathTaxRate}`); process.exit(2); }
    solved[name] = { r, secs: Math.round((Date.now() - t0) / 1000) };
    return solved[name];
  };
  for (const arm of ARMS) {
    const A = ARM[arm], L = `OFF/PRODUCT/W${W}/${arm}`;
    console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
    const fresh = !solved[A.tables], { r, secs } = tablesOf(A.tables), m = r.m, T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
    console.log(`${''.padEnd(16)} solve ${L}: ${fresh ? `secs ${secs}` : `shared ${A.tables}`}`);
    // the arm's forward read, set after the solve and restored after the run
    const grids = gridsOf(r);
    for (const g of grids) { g.pclsInterp = A.read; g.pclsSeg = A.seg; }
    const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.meta.switchMargin} pcls ${r.g.pcls.join(',')} tables ${A.tables} read ${grids.every(g => g.pclsInterp === A.read) ? A.read : 'mixed'} seg ${grids.every(g => g.pclsSeg === A.seg) ? A.seg || 'none' : 'mixed'} tieMargin ${r.tieMargin} deathTax ${m.ctx.pensionDeathTaxRate}`;
    console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
    console.log(`${''.padEnd(16)} access ${L}: year ${access} years ${T} lsa ${lsa} open ${Math.round(m.ctx.accounts.reduce((x, a) => x + a.balance, 0))}`);
    const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now(), Y = T + 1;
    const U = new Float32Array(NP * Y).fill(NaN), PV = new Float32Array(NP * Y).fill(NaN), NV = new Float32Array(NP * Y).fill(NaN);
    const SV = new Uint8Array(NP), TX = new Float32Array(NP), NET = new Float32Array(NP), tr = makeTrace(NP, Y);
    let row = 0, ok = 0, tax = 0, net = 0, chk = 0;
    const choose = (t, st, held) => { if (t <= T) { const o = row * Y + t; U[o] = Math.min(1, st[4] / lsa); PV[o] = st[0]; NV[o] = st[1] + st[2]; } return chooseAction(r, st, t, held); };
    paths.forEach((zs, j) => {
      row = j; tr.row = j;
      const o = runPolicy(r, zs, { choose, trace: tr });
      SV[j] = o.survived ? 1 : 0; TX[j] = o.lifetimeTax; NET[j] = o.terminalNet;
      if (o.survived) ok++; tax += o.lifetimeTax; net += o.terminalNet;
      chk = (((chk * 31 + Math.round(1e6 * Number(zs[0]))) % M9) + M9) % M9;
    });
    for (const g of grids) { g.pclsInterp = A.tables === 'PCLSI'; g.pclsSeg = null; }
    console.log(`${''.padEnd(16)} sum ${L}: paths ${NP} survived ${ok} tax ${f2(tax / NP)} net ${f2(net / NP)} pathsum ${chk} secs ${Math.round((Date.now() - t1) / 1000)}`);
    const file = `${id}-${arm.toLowerCase()}.json.gz`;
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, file), gzipSync(JSON.stringify({ id, arm, dt: false, read: A.read, seg: A.seg, tables: A.tables, stamp: STAMP, N: NP, Y, seed: SEED, survived: b64(SV), tax: b64(TX), net: b64(NET), u: b64(U), pen: b64(PV), non: b64(NV), level: b64(tr.level), tier: b64(tr.tier), taxPaid: b64(tr.taxPaid) })));
    console.log(`${''.padEnd(16)} trace ${L}: file ${file} paths ${NP} years ${Y}`);
    console.log(`${''.padEnd(16)} done ${L}`);
  }
});
