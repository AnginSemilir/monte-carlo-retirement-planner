/*
 * DT-O97: ADOPT-PI'S LUCKY-TAIL LOSS AT A PENSION DEATH TAX (PLAN.md DT-O97; the deep review after FORCE-X, deep-review-log.md
 * 6 Oct 08:08 UK; the maintainer's go-ahead of 6 Oct, 'yes, run DT-O97', reopening the 5 Oct 08:00 death-tax decision).
 * A TEST (predictions/diag-dto97.md). audit-adoptpi.mjs's unit, copied with only its units and output folder changed
 * (its module runs its units on import): the shipping default (no reader, the product's settings, lambda held, the estate
 * weight 0.02, 30 points), seed 7005, both allowance axes (SNAP, PCLSI), at a pension death tax of 40% (config
 * pensionDeathTaxRate 40: the solver's bequest value, solve.js l.223, and the run's terminal net), on O97's seven loss
 * households (share 0.70, 0.90, 0.95, bridge 0, bridge 1, bridge 4+cost, S366). Each unit's paths are ADOPT-PI's at the
 * same seed, so every path pairs with ADOPT-PI's death-tax-0 files for the same household (reduce-dto97.mjs's identity of
 * paths: one pathsum and one access line across the four units of a household). Lines and files as ADOPT-PI's, into
 * results/diagdto97/<household>-dt-<arm>.json.gz.
 *   node research/solver/audit-dto97.mjs [points=30] [paths=6000] part k/n [seed=7005]
 */
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

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 6000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-dto97: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-dto97: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7005;
if (!(SEED >= 1)) { console.error(`audit-dto97: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02, DEATH_TAX = 40;
// the arms: [name, solvePlan's allowance options]; the death-tax households run both
// SNAP's snap set explicitly (pclsInterp false), so the arm stays today's snap whatever the solver's default (the
// interpolated axis is to become the research candidate's default: the maintainer, 6 Oct); the solve is ADOPT-PI's SNAP
export const ARMS = [['SNAP', { pclsInterp: false }], ['PCLSI', { pclsInterp: true }]];
export const DT_PANEL = ['share 0.70', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 4+cost', 'S366'];

// audit-dpc.mjs l.59-87, copied (its module runs its units on import): DP's panel and its built variants
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
export const UNITS = DT_PANEL.flatMap(id => ARMS.map(a => [id, a[0], true]));
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
console.log(`DT-O97 (ADOPT-PI's unit): the shipping default (no reader, the product's settings, lambda held, the estate weight ${W}), ${POINTS} points, ${NP} paths (seed ${SEED}); the allowance axis snapped (SNAP) and interpolated (PCLSI) on DP's panel, and both on ${DT_PANEL.join(', ')} with the pension death tax at ${DEATH_TAX}% (DT)`);

const M9 = 1000000007;
UNITS.forEach(([id, arm, dt], i) => {
  if (i % pn !== pk) return;
  const [, AO] = ARMS.find(a => a[0] === arm), L = `OFF/PRODUCT/W${W}${dt ? '/DT' : ''}/${arm}`;
  const h = caseOf(id);
  if (!h) { console.error(`audit-dto97: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
  // DPC's plan and solve (audit-dpc.mjs: measureV2's plan, 7af's SHIP solve), the death tax set in the DT units only
  const config = { ...h.plan.config, guardrails: false, lookaheadYears: 0, ...(dt ? { pensionDeathTaxRate: DEATH_TAX } : {}) };
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  // e3 off: as audit-adoptpi.mjs - each path pairs with ADOPT-PI's death-tax-0 files, which ran without e3, so the solve must be ADOPT-PI's
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, ...AO });
  const m = r.m, T = m.ctx.totalYears, lsa = m.P.lsa, access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
  if (r.meta.bridgeRead !== false || r.meta.tierState || r.meta.jointWorlds) { console.error(`audit-dto97: ${id} ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  if (r.g.pclsInterp !== (arm === 'PCLSI') || r.g.pcls.join(',') !== '0,0.5,1') { console.error(`audit-dto97: ${id} ${arm} ran pclsInterp ${r.g.pclsInterp} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
  if (Math.abs(m.ctx.pensionDeathTaxRate - (dt ? DEATH_TAX / 100 : 0)) > 1e-12) { console.error(`audit-dto97: ${id} ${L} ran the death tax at ${m.ctx.pensionDeathTaxRate}`); process.exit(2); }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.meta.switchMargin} pcls ${r.g.pcls.join(',')} pclsInterp ${r.g.pclsInterp} deathTax ${m.ctx.pensionDeathTaxRate}`;
  console.log(`${''.padEnd(16)} solve ${L}: secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
  console.log(`${''.padEnd(16)} access ${L}: year ${access} years ${T} lsa ${lsa}`);
  const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now();
  const U = new Float32Array(NP * (T + 1)).fill(NaN), PV = new Float32Array(NP * (T + 1)).fill(NaN), NV = new Float32Array(NP * (T + 1)).fill(NaN);
  const SV = new Uint8Array(NP), TX = new Float32Array(NP), NET = new Float32Array(NP);
  let row = 0, ok = 0, tax = 0, net = 0, chk = 0;
  const choose = (t, st, held) => { if (t <= T) { const o = row * (T + 1) + t; U[o] = Math.min(1, st[4] / lsa); PV[o] = st[0]; NV[o] = st[1] + st[2]; } return chooseAction(r, st, t, held); };
  paths.forEach((zs, j) => {
    row = j; const o = runPolicy(r, zs, { choose });
    SV[j] = o.survived ? 1 : 0; TX[j] = o.lifetimeTax; NET[j] = o.terminalNet;
    if (o.survived) ok++; tax += o.lifetimeTax; net += o.terminalNet;
    chk = (((chk * 31 + Math.round(1e6 * Number(zs[0]))) % M9) + M9) % M9;
  });
  const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
  console.log(`${''.padEnd(16)} sum ${L}: paths ${NP} survived ${ok} tax ${f2(tax / NP)} net ${f2(net / NP)} pathsum ${chk} secs ${Math.round((Date.now() - t1) / 1000)}`);
  const OUT = process.env.DIAGDTO97_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagdto97'), file = `${id.replace(/[ +]/g, '_')}-${dt ? 'dt-' : ''}${arm.toLowerCase()}.json.gz`;
  mkdirSync(OUT, { recursive: true });
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  writeFileSync(join(OUT, file), gzipSync(JSON.stringify({ id, arm, dt, stamp: STAMP, N: NP, Y: T + 1, seed: SEED, survived: b64(SV), tax: b64(TX), net: b64(NET), u: b64(U), pen: b64(PV), non: b64(NV) })));
  console.log(`${''.padEnd(16)} trace ${L}: file ${file} paths ${NP} years ${T + 1}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
