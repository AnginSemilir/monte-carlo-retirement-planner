/*
 * TAIL: THE TIE MARGIN AND THE FORWARD-ONLY HYBRID (PLAN.md O97, O89, PR7; the maintainer's go-ahead, the 5 Oct 06:29 row;
 * the death-tax group dropped by the maintainer, the 5 Oct 08:00 row: the pot at the horizon read as a buffer, not an estate). A TEST (predictions/diag-tail.md). ADOPT-PI's unit (no reader, the product's settings, lambda held, the
 * estate weight 0.02, 30 points, seed 7005, death tax 0) on two groups of households, one process a job:
 *   TAIL (share 0.90, share 0.95, bridge 1, bridge 4+cost, S366 - where O97's mean loss sits - and S130, S370, the controls):
 *     SNAP's and PCLSI's tables solved; forward runs SNAP and PCLSI (tieMargin 0: ADOPT-PI's arms again, the identity), and
 *     PCLSI-TIE (PCLSI's tables, tieMargin m after the solve: among moves within m of the best, the least tax this year);
 *   HYB (S130, S370, S128): PCLSI's tables read through the snap in the forward run (every grid's pclsInterp off for the run,
 *     then restored) - O89's split of the tables from the read; S128 runs SNAP and PCLSI beside it for the identity;
 * Every forward run of a household uses the same paths (E.pathsForSeed at the seed), so every arm is paired by path. Each
 * forward unit prints:
 *   ran, access, sum, trace and done lines as ADOPT-PI's, the ran line adding tables (whose solve), read (the forward's
 *   pclsInterp) and tieMargin, the access line the opening balances (open: the estate cap is 4 x open, solve.js beqCap);
 * and saves results/diagtail/<household>-<arm>.json.gz: per path survived, lifetime tax and terminal net; per path-year
 * the used share of the allowance, the pension and non-pension balances (ADOPT-PI's), and record.mjs's trace (the spend
 * level, the tiers held, the year's tax).
 *   node research/solver/audit-tail.mjs [points=30] [paths=6000] part k/n [seed=7005] [m=1e-6]
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
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-tail: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-tail: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7005;
const TIE = process.argv[7] ? Number(process.argv[7]) : 1e-6;
if (!(SEED >= 1) || !(TIE > 0)) { console.error(`audit-tail: bad seed ${process.argv[6]} or tie margin ${process.argv[7]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;
export const LOSERS = ['share 0.90', 'share 0.95', 'bridge 1', 'bridge 4+cost', 'S366'], CONTROLS = ['S130', 'S370'], HYB_PANEL = ['S130', 'S370', 'S128'];
// the jobs, longest first in the batch's order: [household, group]; a job's forward arms follow from its group
export const JOBS = [...[...LOSERS, ...CONTROLS].map(id => [id, 'TAIL']), ['S128', 'HYB']];
export const armsOf = (id, group) => (group === 'HYB' ? ['SNAP', 'PCLSI', 'HYB'] : ['SNAP', 'PCLSI', 'PCLSI-TIE', ...(HYB_PANEL.includes(id) ? ['HYB'] : [])]);
// each arm's tables, its tie margin and its forward read of the allowance axis
const ARM = { SNAP: { tables: 'SNAP', tie: 0, read: false }, PCLSI: { tables: 'PCLSI', tie: 0, read: true }, 'PCLSI-TIE': { tables: 'PCLSI', tie: TIE, read: true }, HYB: { tables: 'PCLSI', tie: 0, read: false } };

// audit-adoptpi.mjs l.49-80, copied (its module runs its units on import): DP's built variants of S126 and the library cases
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
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
const BUILT = { 'share 0.90': { a0: 0.9 }, 'share 0.95': { a0: 0.95 }, 'bridge 1': { bridge: 1 }, 'bridge 4+cost': { bridge: 4, cost: [2, 30000] } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
if (process.argv[2] === '--jobs') { console.log(JOBS.length); process.exit(0); }
console.log(`TAIL: ADOPT-PI's unit (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, ${NP} paths (seed ${SEED}), the tie margin ${TIE}; TAIL on ${[...LOSERS, ...CONTROLS].join(', ')}; HYB on ${HYB_PANEL.join(', ')}`);

const M9 = 1000000007, f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const OUT = process.env.DIAGTAIL_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagtail');
/* every grid a solve reads in the forward run: the main table's and the mixture's */
const gridsOf = r => [...new Set([r.g, ...(r.mix ? r.mix.tables.map(t => t.g) : [])])];

JOBS.forEach(([id, group], i) => {
  if (i % pn !== pk) return;
  const h = caseOf(id);   // every unit at the library's death tax 0 (no death-tax group: the 5 Oct 08:00 row)
  if (!h) { console.error(`audit-tail: no case ${id}`); process.exit(2); }
  // ADOPT-PI's plan and solve (audit-adoptpi.mjs l.92-96)
  const config = { ...h.plan.config, guardrails: false, lookaheadYears: 0 };
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const solved = {};
  const tablesOf = name => {
    if (solved[name]) return solved[name];
    for (const k of Object.keys(solved)) delete solved[k];   // one solve held at a time
    const t0 = Date.now(), r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, ...(name === 'PCLSI' ? { pclsInterp: true } : {}) });
    const m = r.m;
    if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds || r.tieMargin !== 0) { console.error(`audit-tail: ${id} ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} tieMargin ${r.tieMargin}`); process.exit(2); }
    if (gridsOf(r).some(g => g.pclsInterp !== (name === 'PCLSI') || g.pcls.join(',') !== '0,0.5,1')) { console.error(`audit-tail: ${id} ${name} solved pclsInterp ${gridsOf(r).map(g => g.pclsInterp)} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
    if (Math.abs(m.ctx.pensionDeathTaxRate) > 1e-12) { console.error(`audit-tail: ${id} ran the death tax at ${m.ctx.pensionDeathTaxRate}`); process.exit(2); }
    solved[name] = { r, secs: Math.round((Date.now() - t0) / 1000) };
    return solved[name];
  };
  for (const arm of armsOf(id, group)) {
    const A = ARM[arm], L = `OFF/PRODUCT/W${W}/${arm}`;
    console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
    const fresh = !solved[A.tables], { r, secs } = tablesOf(A.tables), m = r.m, T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
    console.log(`${''.padEnd(16)} solve ${L}: ${fresh ? `secs ${secs}` : `shared ${A.tables}`}`);
    // the arm's forward settings, set after the solve and restored after the run
    const grids = gridsOf(r);
    r.tieMargin = A.tie; for (const g of grids) g.pclsInterp = A.read;
    const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.meta.switchMargin} pcls ${r.g.pcls.join(',')} tables ${A.tables} read ${grids.every(g => g.pclsInterp === A.read) ? A.read : 'mixed'} tieMargin ${r.tieMargin} deathTax ${m.ctx.pensionDeathTaxRate}`;
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
    r.tieMargin = 0; for (const g of grids) g.pclsInterp = A.tables === 'PCLSI';
    console.log(`${''.padEnd(16)} sum ${L}: paths ${NP} survived ${ok} tax ${f2(tax / NP)} net ${f2(net / NP)} pathsum ${chk} secs ${Math.round((Date.now() - t1) / 1000)}`);
    const file = `${id.replace(/[ +]/g, '_')}-${arm.toLowerCase()}.json.gz`;
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, file), gzipSync(JSON.stringify({ id, arm, dt: false, tie: A.tie, read: A.read, tables: A.tables, stamp: STAMP, N: NP, Y, seed: SEED, survived: b64(SV), tax: b64(TX), net: b64(NET), u: b64(U), pen: b64(PV), non: b64(NV), level: b64(tr.level), tier: b64(tr.tier), taxPaid: b64(tr.taxPaid) })));
    console.log(`${''.padEnd(16)} trace ${L}: file ${file} paths ${NP} years ${Y}`);
    console.log(`${''.padEnd(16)} done ${L}`);
  }
});
