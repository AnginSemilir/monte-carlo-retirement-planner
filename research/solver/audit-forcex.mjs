/*
 * FORCE-X: FORCE THE DRAW PAST THE READ'S FIRST PRICE POINT (PLAN.md's FORCE-X; proposed by the deep review after PAUSE,
 * deep-review-log.md 6 Oct 01:52 UK). EDGE-SPLIT's unit (audit-edge.mjs: no reader, the product's settings, lambda held, the
 * estate weight 0.02, 30 points, seed 7005, death tax 0, e3 off) on S130, S128 and S370, four arms each, forward only (the
 * tables are EDGE-SPLIT's, solved as audit-edge.mjs solves them):
 *   P-LO+X and HYB+X (the deciding arms: PCLSI's tables, so their gaps to PCLSI are the read's), SNAP+X (reported: the tables'
 *   share) and PCLSI+X (the control). S-INT+X dropped (the deep review after PAUSE-S128, FLAG 5: S-INT holds past its kink).
 * THE FORCE (amended before launch on the deep review after PAUSE-S128, deep-review-log.md 6 Oct 04:34 UK, FLAG 1): at a year
 * with the pension over 10,000, the arm's chosen move is run on a copy of the state (fast.js flow, the year as the run will
 * take it); if it would HOLD - u growing by under 0.02 (an allowance-only draw moves u 0.0156 a year, a zero draw 0), u under
 * 0.99 - with u in [p - 0.10, p) and next year's u still under p, for one of the arm's price points p (PRICE below), the
 * year's flow is given c.forceTF = (p + 0.01) x lsa less the copy's tax-free used: one pension draw (fast.js step 7b') whose
 * tax-free part carries u 0.01 past p. The chooser's move is not changed; the chooser then runs free.
 * Recorded per path: survived, lifetime tax, terminal net, u, the pension pot and the other pots each year (as audit-edge.mjs,
 * so the reducer holds every year up to each path's first force to EDGE-SPLIT's file, the IDENTITY), the forced years (path,
 * year, u, p, the next year's u: the force must carry u to p or past it), and every pause year (path, year, u, forced).
 *   node research/solver/audit-forcex.mjs [points=30] [paths=6000] part k/6 [seed=7005]
 *   FORCEX_PLANT=leak: a one-pound force in every year that is not forced (the identity before the first force must refuse it)
 */
// e3 off: as audit-edge.mjs - the identity holds this run to EDGE-SPLIT's files, which ran with it off
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
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
const PLANT = process.env.FORCEX_PLANT || '';
if (PLANT && PLANT !== 'leak') { console.error(`audit-forcex: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 6000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-forcex: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
const SEED = process.argv[6] ? Number(process.argv[6]) : 7005;
if (!(SEED >= 1)) { console.error(`audit-forcex: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;
export const PANEL = ['S130', 'S128', 'S370'];
// the arms: EDGE-SPLIT's (audit-edge.mjs ARM) and HYB's (PCLSI's tables, the snapped read), each with the force
export const ARM = { 'SNAP+X': { tables: 'SNAP', read: false, seg: null },
  'P-LO+X': { tables: 'PCLSI', read: true, seg: 'lo' }, 'HYB+X': { tables: 'PCLSI', read: false, seg: null }, 'PCLSI+X': { tables: 'PCLSI', read: true, seg: null } };
// each arm's price points: where its read first prices the allowance (O111, HOLD-PRICE; predictions/diag-forcex.md)
export const PRICE = { 'SNAP+X': [0.75], 'P-LO+X': [0.75], 'HYB+X': [0.25, 0.75], 'PCLSI+X': [0.25, 0.75] };
export const CELL = 0.10, PAST = 0.01, FLAT = 0.02, LIVE = 1e4;
// one part per household and set of tables (one solve each)
export const PARTS = PANEL.flatMap(id => [[id, 'SNAP', ['SNAP+X']], [id, 'PCLSI', ['P-LO+X', 'HYB+X', 'PCLSI+X']]]);
if (process.argv[2] === '--jobs') { console.log(PARTS.length); process.exit(0); }
if (!(pn === PARTS.length && pk >= 0 && pk < pn) && !(pn === 1 && pk === 0)) { console.error(`audit-forcex: bad part ${part} (${PARTS.length} parts, or 0/1 for all)`); process.exit(2); }
const MINE = pn === 1 ? PARTS : [PARTS[pk]];
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
console.log(`FORCE-X: EDGE-SPLIT's unit (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, ${NP} paths (seed ${SEED}), death tax 0; ${MINE.map(p => `${p[2].join(', ')} on ${p[0]}`).join('; ')}`);

const M9 = 1000000007, f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const OUT = process.env.DIAGFORCEX_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagforcex');
const gridsOf = r => [...new Set([r.g, ...(r.mix ? r.mix.tables.map(t => t.g) : [])])];
/* the force's decision at one year: the price point the would-be hold sits below (next year's u still under it), or null */
export function forcePoint(prices, u, u1) {
  if (!(u < 0.99) || !(u1 - u < FLAT)) return null;
  const p = prices.find(q => u >= q - CELL - 1e-12 && u < q && u1 < q);
  return p === undefined ? null : p;
}

for (const [id, tables, arms] of MINE) {
  const h = all.find(s => s.id === id);
  if (!h) { console.error(`audit-forcex: no case ${id}`); process.exit(2); }
  // audit-edge.mjs's plan and solve, as it runs them
  const config = { ...h.plan.config, guardrails: false, lookaheadYears: 0 };
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now(), r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, ...(tables === 'PCLSI' ? { pclsInterp: true } : {}) });
  const m = r.m, secs = Math.round((Date.now() - t0) / 1000);
  if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds || r.tieMargin !== 0) { console.error(`audit-forcex: ${id} ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} tieMargin ${r.tieMargin}`); process.exit(2); }
  if (gridsOf(r).some(g => g.pclsInterp !== (tables === 'PCLSI') || g.pcls.join(',') !== '0,0.5,1')) { console.error(`audit-forcex: ${id} ${tables} solved pclsInterp ${gridsOf(r).map(g => g.pclsInterp)} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
  if (Math.abs(m.ctx.pensionDeathTaxRate) > 1e-12) { console.error(`audit-forcex: ${id} ran the death tax at ${m.ctx.pensionDeathTaxRate}`); process.exit(2); }
  for (const arm of arms) {
    const A = ARM[arm], L = `OFF/PRODUCT/W${W}/${arm}`, prices = PRICE[arm];
    console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
    const T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0), c = r.c;
    console.log(`${''.padEnd(16)} solve ${L}: ${arm === arms[0] ? `secs ${secs}` : `shared ${tables}`}`);
    const grids = gridsOf(r);
    for (const g of grids) { g.pclsInterp = A.read; g.pclsSeg = A.seg; }
    const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.meta.switchMargin} pcls ${r.g.pcls.join(',')} tables ${tables} read ${A.read} seg ${A.seg || 'none'} tieMargin ${r.tieMargin} deathTax ${m.ctx.pensionDeathTaxRate} price ${prices.join(',')} cell ${CELL} past ${PAST} flat ${FLAT}`;
    console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
    console.log(`${''.padEnd(16)} access ${L}: year ${access} years ${T} lsa ${lsa} open ${Math.round(m.ctx.accounts.reduce((x, a) => x + a.balance, 0))}`);
    const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now(), Y = T + 1;
    const U = new Float32Array(NP * Y).fill(NaN), PV = new Float32Array(NP * Y).fill(NaN), NV = new Float32Array(NP * Y).fill(NaN);
    const SV = new Uint8Array(NP), TX = new Float32Array(NP), NET = new Float32Array(NP), FIRST = new Int16Array(NP).fill(-1);
    const XP = [], XT = [], XU = [], XQ = [], XN = [], PP = [], PT = [], PU = [], PF = [];
    let row = 0, ok = 0, tax = 0, net = 0, chk = 0, pending = -1;
    const choose = (t, st, held) => {
      if (t <= T) { const o = row * Y + t; U[o] = Math.min(1, st[4] / lsa); PV[o] = st[0]; NV[o] = st[1] + st[2]; }
      if (pending >= 0) { XN[pending] = Math.min(1, st[4] / lsa); pending = -1; }   // the year after a force: where it carried u
      const ai = chooseAction(r, st, t, held);
      c.forceTF = 0;
      if (t < T && st[0] > LIVE) {
        const u = st[4] / lsa, x = Float64Array.from(st);
        F.flow(c, t, ai, x);                                   // the year as the run will take it, on a copy
        const u1 = x[4] / lsa, p = forcePoint(prices, u, u1);
        if (u < 0.99 && u1 - u < FLAT) { PP.push(row); PT.push(t); PU.push(u); PF.push(p === null ? 0 : 1); }
        if (p !== null) {
          c.forceTF = (p + PAST) * lsa - x[4];
          XP.push(row); XT.push(t); XU.push(u); XQ.push(p); XN.push(NaN); pending = XN.length - 1;
          if (FIRST[row] < 0) FIRST[row] = t;
        } else if (PLANT === 'leak') c.forceTF = 1;
      }
      return ai;
    };
    paths.forEach((zs, j) => {
      row = j; pending = -1;
      const o = runPolicy(r, zs, { choose });
      c.forceTF = 0;
      if (pending >= 0) pending = -1;                          // a force in a path's last year: its carry stays NaN
      SV[j] = o.survived ? 1 : 0; TX[j] = o.lifetimeTax; NET[j] = o.terminalNet;
      if (o.survived) ok++; tax += o.lifetimeTax; net += o.terminalNet;
      chk = (((chk * 31 + Math.round(1e6 * Number(zs[0]))) % M9) + M9) % M9;
    });
    for (const g of grids) { g.pclsInterp = tables === 'PCLSI'; g.pclsSeg = null; }
    const carried = XN.filter((v, k) => v >= XQ[k] - 1e-9).length, acting = PF.filter((v, k) => v && PU[k] >= 0.15).length, pauses = PU.filter(v => v >= 0.15).length;
    console.log(`${''.padEnd(16)} sum ${L}: paths ${NP} survived ${ok} tax ${f2(tax / NP)} net ${f2(net / NP)} pathsum ${chk} secs ${Math.round((Date.now() - t1) / 1000)}`);
    console.log(`${''.padEnd(16)} force ${L}: forced ${XP.length} carried ${carried} paths ${FIRST.filter(v => v >= 0).length} pauses ${pauses} acting ${acting}`);
    const file = `${id}-${arm.toLowerCase().replace('+', '')}.json.gz`;
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, file), gzipSync(JSON.stringify({ id, arm, read: A.read, seg: A.seg, tables, price: prices, stamp: STAMP, plant: PLANT || null, N: NP, Y, seed: SEED, lsa,
      survived: b64(SV), tax: b64(TX), net: b64(NET), u: b64(U), pen: b64(PV), non: b64(NV), first: b64(FIRST),
      xp: XP, xt: XT, xu: XU, xq: XQ, xn: XN.map(v => (Number.isFinite(v) ? v : null)), pp: PP, pt: PT, pu: PU, pf: PF })));
    console.log(`${''.padEnd(16)} trace ${L}: file ${file} paths ${NP} years ${Y}`);
    console.log(`${''.padEnd(16)} done ${L}`);
  }
}
