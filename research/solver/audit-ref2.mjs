/*
 * REF-2 (PLAN.md REF-2; predictions/diag-ref2.md; the deep review after NE-REF, deep-review-log.md 13 Oct 18:36 UK).
 * Does the reference's pessimism, not RS, deepen S360's read (O151); what carries the rest of S360's gap beyond the
 * order-drawn reference; and does the order-drawn reference over-read the 95% share household? Five jobs, the candidate's
 * own unit (solveCandidate, e3pcls on), seed 7002, beside NE-REF's S360 BASE and RS jobs (read behind NE-REF's gate):
 *   L    S360 at 4 wealth points: THE LEDGER at the year-1 states of P (the plan's tiers at the floor level, cash first, no
 *        pension step first, no harvest; found by that definition), as NE-REF's: the closed form pr, the mix simulated
 *        (form), pot by pot at the opening weights (ow) and at the state's own pots (os) in each draw order, and the same
 *        at the state's own pots with the engine's cash sweep each year (osw: cash reset to the year's buffer after the
 *        bill, the excess to the GIA, a shortfall topped up from it; model.js l.503-509, the buffer model.bufferAt), and
 *        FLOW: the engine under each order's fixed move from year 0 on `flow` paths a world. mirrorTook as NE-REF's.
 *   BO   S360 under readerRef 'order' at 60 points; RSO S360 under RS with readerRef 'order': the own opening's table
 *        against its runs in every world, beside NE-REF's BASE and RS (the 2 x 2 that splits O151).
 *   BASE, BO   the 95% share household (S126 with 0.95 of its wealth in the pension, a two-year bridge; audit-7u.mjs's
 *        builder, copied) at 60 points: the own opening's table against its runs in every world.
 * Plants (REF2_PLANT, each must make the job refuse, exit 3): arm (S360's BO without ORDER: armTook fails), mirror (the
 * ledger's simulators on another seed: mirrorTook fails), force (S360's RSO forcing another opening: forceIdentity fails).
 *   node research/solver/audit-ref2.mjs [scale=1] [paths a world=4000] part k/n [seed=7002] [draws=1000000] [flow=40000]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves, WEIGHTS, NODES } from '../../src/solver/solve.js';
import { READER_PROBE } from '../../src/solver/grid.js';
import { simChance, orderChance } from '../../src/solver/reader.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

// [household, arm, wealth points, shares, return nodes]
export const JOBS = [['S360', 'L', 4, 6, 5], ['S360', 'BO', 60, 6, 5], ['S360', 'RSO', 60, 6, 5], ['share 0.95', 'BASE', 60, 6, 5], ['share 0.95', 'BO', 60, 6, 5]];
export const ARMS = Object.freeze({ L: {}, BO: { readerRef: 'order' }, RSO: { readerSplit: 'rs', readerRef: 'order' }, BASE: {} });
export const SPLIT = Object.freeze({ L: null, BO: null, RSO: 'rs', BASE: null });
export const REF = Object.freeze({ L: null, BO: 'order', RSO: 'order', BASE: null });
// no forced pairs: every 60-point job runs its own opening
export const PAIRS = Object.freeze({});
export const FLOORS = Object.freeze({ S360: 5000, 'share 0.95': 29000 });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-ref2: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-ref2: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-ref2: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const DRAWS = Number(process.argv[7] || 1000000), FLOWN = Number(process.argv[8] || 40000);
if (!(DRAWS >= 1000) || !(FLOWN >= NPW)) { console.error(`audit-ref2: bad draws or flow paths (${DRAWS}, ${FLOWN})`); process.exit(2); }
const PLANT = process.env.REF2_PLANT || '';
if (PLANT && !['arm', 'mirror', 'force'].includes(PLANT)) { console.error(`audit-ref2: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, FI = Math.min(NPW, 1000);
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-ref2: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGREF2_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagref2');
mkdirSync(OUT, { recursive: true });

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
// the 95% share household: audit-7u.mjs's builder (variant(), copied) at a0 0.95, a two-year bridge
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0);
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
  return { id: name, plan: p };
}
const caseOf = id => (id === 'share 0.95' ? variant(id, { a0: 0.95 }) : all.find(s => s.id === id));
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0].replace(/ /g, '_')}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });
const ex = x => x.toExponential(6);

// THE LEDGER'S SIMULATORS: simChance's and orderChance's draw models (reader.js), read at one accessible money
function rngOf(seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
}
export function simDraws(bills, rho, vol, draws, seed) {
  const h = bills.length, gauss = rngOf(seed), gr = new Float64Array(draws * (h - 1));
  for (let d = 0; d < draws; d++) for (let j = 1; j < h; j++) gr[d * (h - 1) + j - 1] = Math.exp(rho[j - 1] + vol[j - 1] * gauss());
  return gr;
}
export function simAt(acc, bills, gr, draws, tol = 1) {
  const h = bills.length, d0 = bills[0];
  if (acc - d0 < -tol) return 0;
  let ok = 0;
  for (let d = 0; d < draws; d++) {
    let pot = acc - d0, paid = true;
    for (let j = 1; j < h; j++) { pot = Math.max(pot, 0) * gr[d * (h - 1) + j - 1] - bills[j]; if (pot < -tol) { paid = false; break; } }
    if (paid) ok++;
  }
  return ok;
}
export function orderDraws(h, draws, seed) {
  const gauss = rngOf(seed), zr = new Float64Array(draws * (h - 1)), zc = new Float64Array(draws * (h - 1));
  for (let i = 0; i < zr.length; i++) { zr[i] = gauss(); zc[i] = gauss(); }
  return { zr, zc };
}
export function orderAt(acc, bills, w, rate, order, z, draws, tol = 1) {
  const h = bills.length, pot = { isa: 0, gia: 0, cash: 0 };
  let ok = 0;
  for (let d = 0; d < draws; d++) {
    pot.isa = acc * w.isa; pot.gia = acc * w.gia; pot.cash = acc * w.cash;
    let paid = true;
    for (let j = 0; j < h; j++) {
      if (j > 0) {
        const r = rate[j - 1], a = z.zr[d * (h - 1) + j - 1], c = z.zc[d * (h - 1) + j - 1];
        pot.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a);
        pot.gia *= Math.exp(Math.log(1 + r.gia[0]) + r.gia[1] * a);
        pot.cash *= r.cash[1] ? Math.exp(Math.log(1 + r.cash[0]) + r.cash[1] * c) : 1 + r.cash[0];
      }
      let need = bills[j];
      if (need < 0) { pot.cash -= need; continue; }
      for (const k of order) { const take = Math.min(pot[k], need); pot[k] -= take; need -= take; if (need <= 0) break; }
      if (need > tol) { paid = false; break; }
    }
    if (paid) ok++;
  }
  return ok;
}

// orderAt with the engine's cash sweep after each year's bill: cash reset to that year's buffer (buf[j]), the excess to
// the GIA, a shortfall topped up from it (model.js l.503-509; no tax, as in every reference)
export function orderAtSweep(acc, bills, w, rate, order, z, draws, buf, tol = 1) {
  const h = bills.length, pot = { isa: 0, gia: 0, cash: 0 };
  let ok = 0;
  for (let d = 0; d < draws; d++) {
    pot.isa = acc * w.isa; pot.gia = acc * w.gia; pot.cash = acc * w.cash;
    let paid = true;
    for (let j = 0; j < h; j++) {
      if (j > 0) {
        const r = rate[j - 1], a = z.zr[d * (h - 1) + j - 1], c = z.zc[d * (h - 1) + j - 1];
        pot.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a);
        pot.gia *= Math.exp(Math.log(1 + r.gia[0]) + r.gia[1] * a);
        pot.cash *= r.cash[1] ? Math.exp(Math.log(1 + r.cash[0]) + r.cash[1] * c) : 1 + r.cash[0];
      }
      let need = bills[j];
      if (need < 0) pot.cash -= need;
      else { for (const k of order) { const take = Math.min(pot[k], need); pot[k] -= take; need -= take; if (need <= 0) break; } if (need > tol) { paid = false; break; } }
      if (pot.cash > buf[j]) { pot.gia += pot.cash - buf[j]; pot.cash = buf[j]; } else if (pot.cash < buf[j]) { const got = Math.min(pot.gia, buf[j] - pot.cash); pot.gia -= got; pot.cash += got; }
    }
    if (paid) ok++;
  }
  return ok;
}

console.log(`REF-2: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ledger draws ${DRAWS}, flow paths ${FLOWN}; ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, shares, quad] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-ref2: no case ${id}`); process.exit(2); }
  const PTS = arm === 'L' ? pts0 : Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job);
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const extra = { ...(PLANT === 'arm' && id === 'S360' && arm === 'BO' ? {} : ARMS[arm]), ...(shares !== 6 ? { shares } : {}), ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend;
  const took = (mt.readerSplit || null) === SPLIT[arm] && (mt.readerRef || null) === REF[arm] && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-ref2: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length, K = cand.mix.nodes.length;
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen || 0},${acts[ownC].tierIsa || 0}`);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n);
  const svOf = (tab, ai) => { scoreMoves(tab, s0, 0, SC, TX, BQ, H0(), { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[0][ai] }, SV); return SV[ai]; };
  const f0 = Date.now(), wpaths = E.pathsForSeed(SEED, arm === 'L' ? FLOWN : NPW, T), bits = {};
  const worldPath = (i, k) => { const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = cand.mix.nodes[k]; return cz; };

  if (arm === 'L') {
    const lvlMin = Math.min(...cand.levelOf), P = acts.findIndex((a, ai) => !(a.tierPen > 0) && !(a.tierIsa > 0) && cand.levelOf[ai] === lvlMin && !a.harvest && a.steps[0] === 'cash' && a.steps.indexOf('penPA') === 3), lvl = cand.levelOf[P];
    if (P < 0) { console.error(`audit-ref2: ${L}: no move P (the plan's tiers at the floor level, cash first)`); process.exit(3); }
    console.log(`${''.padEnd(16)} P ${L}: ai ${P} level ${lvl} steps ${acts[P].steps.join('>')}`);
    if ((acts[P].tierPen || 0) !== 0 || (acts[P].tierIsa || 0) !== 0 || lvl !== Math.min(...cand.levelOf)) { console.error(`audit-ref2: ${L}: P is not the plan's tiers at the floor level`); process.exit(3); }
    const pots = s => s.steps.filter(x => x === 'isa' || x === 'cash' || x === 'other').map(x => (x === 'other' ? 'gia' : x));
    const orders = [...new Set(acts.map(a => pots(a).join(',')))].map(x => x.split(','));
    // FLOW's moves: the plan's tiers, the floor level, P's harvest and pension steps (buildActions' twin of P), one per draw order
    const twin = a => a.harvest === acts[P].harvest && a.harvestCeil === acts[P].harvestCeil && a.steps.indexOf('penPA') === acts[P].steps.indexOf('penPA');
    const flowAi = orders.map(o => acts.findIndex((a, ai) => !(a.tierPen > 0) && !(a.tierIsa > 0) && cand.levelOf[ai] === lvl && twin(a) && pots(a).join(',') === o.join(',')));
    console.log(`${''.padEnd(16)} orders ${L}: ${orders.map((o, i) => `${i} ${o.join('>')} ai ${flowAi[i]}`).join('; ')}`);
    if (flowAi.some(ai => ai < 0) || !flowAi.includes(P)) { console.error(`audit-ref2: ${L}: no floor-level plan-tier move for every order`); process.exit(3); }
    const o = m.ctx.owners[0], bal = idx => (idx && m.acc[idx] ? m.acc[idx].balance : 0);
    const bi = bal(o.ids.isa), bg = bal(o.ids.other), bc = bal(o.ids.cash), tot = bi + bg + bc;
    const w0 = { isa: bi / tot, gia: bg / tot, cash: bc / tot };
    console.log(`${''.padEnd(16)} opening ${L}: isa ${ex(w0.isa)} gia ${ex(w0.gia)} cash ${ex(w0.cash)}`);
    let mirror = [0, 0];
    for (let k = 0; k < K; k++) {
      const tab = cand.mix.tables[k], reads = [];
      READER_PROBE.fn = (Wt, IDX, NC, RD, pr, yr, acc, s) => { reads.push({ pr, acc, yr, s: Float64Array.from(s), chance: RD.chance }); };
      try { svOf(tab, P); } finally { READER_PROBE.fn = null; }
      if (reads.length !== NODES.length || reads.some(r => r.yr !== 1 || !r.chance || !r.chance.schedule)) { console.error(`audit-ref2: ${L}: world ${k}: not five year-1 reads with their schedules`); process.exit(3); }
      const sc = reads[0].chance.schedule;
      if (reads.some(r => r.chance.schedule !== sc)) { console.error(`audit-ref2: ${L}: world ${k}: the reads do not share one schedule`); process.exit(3); }
      const act = tab.c.acts[sc.ai0], rate = [];
      for (let j = sc.t; j < sc.t + sc.bills.length - 1; j++) rate.push({ isa: [act.real[1], act.volEffAt[j][1]], gia: [act.real[2], act.volEffAt[j][2]], cash: [act.real[3], act.volEffAt[j][3] || 0] });
      console.log(`${''.padEnd(16)} schedule ${L} ${k}: t ${sc.t} ai0 ${sc.ai0} bills ${sc.bills.map(b => b.toFixed(2)).join(',')} buffers ${sc.bills.map((_, j) => M.bufferAt(m, sc.t + j).toFixed(2)).join(',')}`);
      // the self-check, on world 2's schedule: the ledger's simulators against the library's own tables
      if (k === K - 1) {
        const lib = simChance(sc.bills, sc.rho, sc.vol), g12 = simDraws(sc.bills, sc.rho, sc.vol, 12000, PLANT === 'mirror' ? 7003 : 7002);
        const libs = orders.map(od => orderChance(sc.bills, w0, rate, [od])), z12 = orderDraws(sc.bills.length, 12000, PLANT === 'mirror' ? 7003 : 7002);
        const { grid, val } = lib.table;
        for (let g = 0; g < grid.length; g++) if (g === 0 || val[g] > val[g - 1]) { mirror[1]++; if (simAt(grid[g], sc.bills, g12, 12000) / 12000 === val[g]) mirror[0]++; }
        libs.forEach((lf, i) => { const tb = lf.table; for (let g = 0; g < tb.grid.length; g++) if (g === 0 || tb.val[g] > tb.val[g - 1]) { mirror[1]++; if (orderAt(tb.grid[g], sc.bills, w0, rate, orders[i], z12, 12000) / 12000 === tb.val[g]) mirror[0]++; } });
      }
      const gr = simDraws(sc.bills, sc.rho, sc.vol, DRAWS, SEED), zo = orderDraws(sc.bills.length, DRAWS, SEED), buf = sc.bills.map((_, j) => M.bufferAt(m, sc.t + j));
      reads.forEach((r, j) => {
        const tax = r.s[2], cash = Math.min(tax, M.cashAt(m, 1, tax)), gia = tax - cash, own = r.s[1] + tax;
        const ws = own > 0 ? { isa: r.s[1] / own, gia: gia / own, cash: cash / own } : w0;
        const form = simAt(r.acc, sc.bills, gr, DRAWS);
        const ow = orders.map(od => orderAt(r.acc, sc.bills, w0, rate, od, zo, DRAWS)), os = orders.map(od => orderAt(r.acc, sc.bills, ws, rate, od, zo, DRAWS)), osw = orders.map(od => orderAtSweep(r.acc, sc.bills, ws, rate, od, zo, DRAWS, buf));
        console.log(`${''.padEnd(16)} ledger ${L} ${k} ${j}: z ${NODES[j].toFixed(6)} w ${WEIGHTS[j].toFixed(6)} acc ${r.acc.toFixed(2)} isa ${r.s[1].toFixed(2)} gia ${gia.toFixed(2)} cash ${cash.toFixed(2)} pr ${ex(r.pr)} form ${form}/${DRAWS} ow ${ow.join(',')}/${DRAWS} os ${os.join(',')}/${DRAWS} osw ${osw.join(',')}/${DRAWS}`);
      });
      // the year-0 integral of pr finely over the shock (reported): log acc quadratic in the node, least squares
      const xs = NODES, ys = reads.map(r => Math.log(r.acc)), Sx = [0, 0, 0, 0, 0], Sy = [0, 0, 0];
      for (let j = 0; j < xs.length; j++) { for (let p = 0; p < 5; p++) Sx[p] += xs[j] ** p; for (let p = 0; p < 3; p++) Sy[p] += ys[j] * xs[j] ** p; }
      const A = [[Sx[0], Sx[1], Sx[2]], [Sx[1], Sx[2], Sx[3]], [Sx[2], Sx[3], Sx[4]]];
      const det = Q => Q[0][0] * (Q[1][1] * Q[2][2] - Q[1][2] * Q[2][1]) - Q[0][1] * (Q[1][0] * Q[2][2] - Q[1][2] * Q[2][0]) + Q[0][2] * (Q[1][0] * Q[2][1] - Q[1][1] * Q[2][0]);
      const D = det(A), cf = [0, 1, 2].map(c => det(A.map((row, i) => row.map((v, jj) => (jj === c ? Sy[i] : v)))) / D);
      const accOf = z => Math.exp(cf[0] + cf[1] * z + cf[2] * z * z), fitErr = Math.max(...xs.map((x, j) => Math.abs(accOf(x) / reads[j].acc - 1)));
      let I = 0, Wq = 0; for (let i = -9000; i <= 9000; i++) { const z = i / 1000, ph = Math.exp(-z * z / 2); I += ph * reads[0].chance(accOf(z)); Wq += ph; }
      console.log(`${''.padEnd(16)} quad ${L} ${k}: gh ${ex(reads.reduce((t, r, j) => t + WEIGHTS[j] * r.pr, 0))} fine ${ex(I / Wq)} fit ${fitErr.toExponential(2)}`);
      // FLOW: the engine under one fixed move every year, each draw order
      flowAi.forEach((ai, i) => {
        const b = new Uint8Array(FLOWN), sv = new Uint8Array(FLOWN);
        for (let p = 0; p < FLOWN; p++) { const r = runPolicy(cand, worldPath(p, k), { choose: () => ai }); sv[p] = r.survived ? 1 : 0; b[p] = r.survived || !r.preAccess ? 1 : 0; }
        bits[`B${k}o${i}`] = b; bits[`S${k}o${i}`] = sv;
        console.log(`${''.padEnd(16)} flow ${L} ${k} ${i} ai ${ai}: bridge ${b.reduce((t, x) => t + x, 0)}/${FLOWN} survived ${sv.reduce((t, x) => t + x, 0)}/${FLOWN} bits ${sha16(b)} ${sha16(sv)}`);
      });
    }
    console.log(`${''.padEnd(16)} checks ${L}: mirrorTook ${mirror[0]}/${mirror[1]}`);
    if (!(mirror[1] > 0 && mirror[0] === mirror[1])) { console.error(`audit-ref2: ${L}: the ledger's simulators do not reproduce the library's tables`); process.exit(3); }
  } else {
    const pair = PAIRS[id] || null;
    if (pair) {
      const [P, D] = pair;
      const pairOk = P < n && D < n && (acts[P].tierPen || 0) === 0 && (acts[P].tierIsa || 0) === 0 && acts[D].tierPen === 2 && acts[D].tierIsa === 2 && acts[P].tierBase === acts[D].tierBase && cand.levelOf[P] === cand.levelOf[D];
      console.log(`${''.padEnd(16)} pair ${L}: P ai ${P} level ${cand.levelOf[P]} tiers ${acts[P].tierPen || 0},${acts[P].tierIsa || 0}; D ai ${D} level ${cand.levelOf[D]} tiers ${acts[D].tierPen || 0},${acts[D].tierIsa || 0}`);
      console.log(`${''.padEnd(16)} checks ${L}: pairTook ${pairOk ? 1 : 0}/1`);
      if (!pairOk) { console.error(`audit-ref2: ${id} ${L}: the forced pair is not the registered tiers at one level and tier base`); process.exit(3); }
    }
    const opens = [['OWN', ownC]];
    const runsIn = () => NPW;
    for (let k = 0; k < K; k++) {
      const tab = cand.mix.tables[k];
      console.log(`${''.padEnd(16)} tables ${L} ${k} z ${cand.mix.nodes[k].toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: ${opens.map(([nm, ai]) => `${nm} ${(100 * svOf(tab, ai)).toFixed(6)}`).join(' ')}`);
    }
    for (let k = 0; k < K; k++) {
      for (const [nm, ai] of opens) {
        const np = runsIn(k), b = new Uint8Array(np), bb = new Uint8Array(np);
        for (let i = 0; i < np; i++) { const r = runPolicy(cand, worldPath(i, k), { start: { t: 0, s: s0, held: H0(), firstAi: ai } }); b[i] = r.survived ? 1 : 0; bb[i] = r.survived || !r.preAccess ? 1 : 0; }
        bits[`${nm}${k}`] = b; bits[`${nm}${k}b`] = bb;
        if (np > NPW) { const f = b.slice(0, NPW); console.log(`${''.padEnd(16)} first ${L} ${k} ${nm}: ${f.reduce((t, x) => t + x, 0)}/${NPW} bits ${sha16(f)}`); }
        console.log(`${''.padEnd(16)} sim ${L} ${k} ${nm} ai ${ai}: ${b.reduce((t, x) => t + x, 0)}/${np} bridge ${bb.reduce((t, x) => t + x, 0)} bits ${sha16(b)} ${sha16(bb)}`);
      }
    }
    // forceIdentity on world 0's first FI paths: the own opening forced against its unforced run (the plant forces another)
    const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
    let same = 0;
    for (let i = 0; i < FI; i++) { const cz = worldPath(i, 0), a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && id === 'S360' && arm === 'RSO' ? other : ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; }
    console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - f0) / 1000)}`);
    if (same !== FI) { console.error(`audit-ref2: ${id} ${L}: forcing the own opening did not reproduce its run`); process.exit(3); }
  }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, FLOWN, seed: SEED, own: ownC, bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
