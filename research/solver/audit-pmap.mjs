/*
 * PMAP: THE POSITION MAP (PLAN.md PMAP; the deep review after 7av, deep-review-log.md 4 Oct 11:37 UK, adopted in the 4 Oct 11:41
 * row: the step before 7an). A MEASUREMENT (predictions/measure-pmap.md). 7av's READER/TS+J/W0.02/PCLSI unit at 6 share points
 * on S130, S370, bridge 4, S126 and bridge 0 (no bridge: the control), its forward runs at each world's node as 7av ran them;
 * at every bridge read (the year-t table at the path's year-t state, through the layer its year-(t - 1) move goes to) it
 * records where the read sits and how much of it falls on unsupported nodes, and by arithmetic how much would on other grids:
 *   - the position: wealth W = pension + ISA + taxable and cash, the pension share a, and each bracketing wealth row's edge
 *     a*(W_j) = 1 - acc* / W_j, acc* the accessible money at which the reader's chance (g.reader.chanceOf(k, t), the chance
 *     reader.js buildReaderTable applies at every node) reaches one half;
 *   - the unsupported weight measured as 7av measured it (the reader's stencil read through indicator tables, chance 1);
 *   - the unsupported weight by arithmetic: the read's two wealth rows (grid.js locInto's weights) times its two share nodes on
 *     a share axis of n points (locLinInto's weights), a node unsupported when the reader's chance at its accessible money
 *     W_j (1 - a_i) is under one half - at n = 6 (which must equal the measured weight read by read: the arithmetic's gate), at
 *     n = 7 to 16, and on the 6-point axis with a coverage node added at each row's edge a*(W_j);
 *   - a node check: on every reader table read, the chance at each node's accessible money classifies the node as the table does.
 * AMENDED BEFORE LAUNCH (the pre-launch deep review, deep-review-log.md 4 Oct 12:01 UK): replicates are CLUSTERS - paths with one
 * move history to year t (one start state and one move are one cluster, however many paths) - not positions; step reads split by
 * their own support (own accessible money st[1] + st[2] against acc*: 'stepsup' at a supported position, 'stepuns' below the
 * edge, where the chance multiplies c out); the share of reads in the top share cell at 6 points (a > 0.8) and of reads whose own
 * edge lies there (the top node a = 1 is dead by construction in a bill year); under option B's node on each wealth row the span
 * left between the read's own edge and its lower row's (a*(W) - a*(W_j)); histograms of a (tenths) and of own money over acc*;
 * e3 pinned off; and two self-checks - the coverage weight never above the 6-point weight, and the chance at acc* at least one
 * half and below it just under.
 * Lines a household, world and year (stepsup, stepuns, all): reads, clusters, the mean measured and arithmetic weights at 6 and
 * their largest difference, the mean weight and the share of reads carrying any at n = 6 to 16 and with the coverage node, the
 * top-cell shares and the span; a hist line beside it; a checks line a household.
 *   node research/solver/audit-pmap.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';
import { isStep } from './extrap-7av.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-pmap: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-pmap: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const LAMBDA = 0.0223606797749979, W = 0.02, SH = 6, NS = Array.from({ length: 11 }, (_, i) => 6 + i);

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

export const UNITS = ['S130', 'S370', 'bridge 4', 'S126', 'bridge 0'];
const BUILT = { 'bridge 4': { bridge: 4 }, 'bridge 0': { bridge: 0 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const L = 'READER/TS+J/W0.02/PCLSI';
console.log(`PMAP, THE POSITION MAP: ${L} at ${SH} share points, ${POINTS} wealth points, ${NPW} paths a world (seed ${SEED}); the unsupported weight measured and by arithmetic at ${NS[0]} to ${NS[NS.length - 1]} share points and with a coverage node; ${UNITS.length} households; part ${pk}/${pn}`);

// grid.js locInto and locLinInto, restated (not exported): the read's lower node and the weight on the one above
const locW = (ax, v) => { if (!(v > 0)) return [0, 0]; if (v <= ax.pts[1]) return [0, v / ax.pts[1]]; if (v >= ax.hi) return [ax.n - 2, 1]; const f = 1 + (Math.log(v) - ax.lg) / ax.step; const i = Math.min(ax.n - 2, Math.max(1, Math.floor(f))); return [i, f - i]; };
const locA = (n, v) => { const f = (v <= 0 ? 0 : v >= 1 ? 1 : v) * (n - 1); const i = Math.min(n - 2, Math.floor(f)); return [i, f - i]; };
// the indicator read of 7av (audit-7av.mjs indicatorsOf's `gu`): the stencil over nodes whose reader chance is under one half
const IND = new Map();
const indOf = (g, RD) => { if (IND.has(RD)) return IND.get(RD); const n = g.size, un = new Float64Array(n), z = new Float64Array(n); for (let i = 0; i < n; i++) un[i] = RD.p[i] < 0.5 ? 1 : 0; const one = () => 1, gu = { ...g, readerAcc: null, reader: { ...g.reader, of: { get: () => ({ chance: one, c: un, R: z }) } } }; IND.set(RD, gu); return gu; };
const RDB = new Float64Array(4);
// the bins of a read's own accessible money over the threshold acc*
const RB = [[0, 0.5], [0.5, 0.9], [0.9, 1], [1, 1.1], [1.1, 1.5], [1.5, Infinity]];
const cl = x => (x <= 2e-6 ? 0 : x >= 1 - 2e-6 ? 1 : x);

UNITS.forEach((id, ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-pmap: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false });
  const m = r.m, g = r.g, T = m.ctx.totalYears, K = r.worlds.length;
  if (!r.meta.tierState || !r.meta.jointWorlds || r.g.pclsInterp !== true || g.ni !== SH || g.nt !== SH || r.meta.e3) { console.error(`audit-pmap: ${id} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${r.g.pclsInterp} shares ${g.ni}x${g.nt}`); process.exit(2); }
  const access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
  console.log(`${''.padEnd(16)} solve ${L}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${g.np} shares ${g.ni} access ${access} years ${T} worlds ${K} reader ${g.reader ? 'yes' : 'no'} readerYears ${g.reader ? g.reader.years.reduce((t, x) => t + (x ? 1 : 0), 0) : 0}`);
  const paths = E.pathsForSeed(SEED, NPW, T), ax = g.axes.W;
  // the threshold acc*: the least accessible money at which the year's chance reaches one half (the chance rises with money)
  const ACC = new Map();
  const accOf = (k, t) => {
    const key = `${k}|${t}`; if (ACC.has(key)) return ACC.get(key);
    const f = g.reader.chanceOf(k, t); let lo = 0, hi = Math.max(1, ax.hi), v;
    if (f(0) >= 0.5) v = 0; else { while (f(hi) < 0.5 && hi < 1e12) hi *= 2; if (f(hi) < 0.5) v = Infinity; else { for (let i = 0; i < 200 && hi - lo > 1e-6 * Math.max(1, hi); i++) { const mid = (lo + hi) / 2; if (f(mid) >= 0.5) hi = mid; else lo = mid; } v = hi; } }
    // the threshold's own check: the chance reaches one half at acc* and not just below it
    if (v > 0 && Number.isFinite(v)) { CHK.acc++; if (!(f(v) >= 0.5 && f(v * (1 - 1e-5)) < 0.5)) CHK.accBad++; }
    const o = { acc: v, f }; ACC.set(key, o); return o;
  };
  // the node check: does the chance at each node's accessible money classify every node of a reader table as the table does
  const NODE = { tables: 0, nodes: 0, off: 0 }, CHECKED = new Set(), CHK = { acc: 0, accBad: 0, cov: 0, covBad: 0 };
  const nodeCheck = (RD, k, t) => {
    if (CHECKED.has(RD)) return; CHECKED.add(RD); NODE.tables++;
    const { f } = accOf(k, t);
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
      const i = g.index(ip, ii, it, ig, ic), Wj = ax.pts[ip], ai = g.axes.a.pts[ii];
      NODE.nodes++;
      if ((f(Wj * (1 - ai)) < 0.5) !== (RD.p[i] < 0.5)) NODE.off++;
    }
  };
  for (let k = 0; k < K; k++) {
    const z = r.mix.nodes[k], tab = r.mix.tables[k];
    const zpaths = paths.map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
    const Y = Array.from({ length: T + 1 }, () => ({ all: null, step: null }));
    const blank = () => ({ n: 0, um: 0, ua: 0, dmax: 0, cl: new Set(), un: NS.map(() => 0), any: NS.map(() => 0), uc: 0, anyc: 0, top: 0, edgeTop: 0, span: 0, nspan: 0, ha: Array(10).fill(0), hr: Array(RB.length).fill(0) });
    let prev = -1, hist = '';
    const choose = (t, st, held) => {
      const ai = chooseAction(r, st, t, held);
      if (held && t >= 1 && t <= T && prev >= 0 && g.reader && g.reader.years[t]) {
        const Ln = tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[prev]] : tab, ls = Ln.lsurv[t], RD = g.reader.of.get(ls);
        if (RD) {
          nodeCheck(RD, k, t);
          const um = cl(readValues(indOf(g, RD), ls, Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0]);
          const Wt = st[0] + st[1] + st[2], a = Wt > 0 ? st[0] / Wt : 0, { f, acc } = accOf(k, t), [ip, wp] = locW(ax, Wt);
          const rowsW = [[ip, 1 - wp], [ip + 1, wp]];
          const uAt = n => { const [ia, wa] = locA(n, a); let u = 0; for (const [j, ww] of rowsW) { if (!ww) continue; for (const [i, w2] of [[ia, 1 - wa], [ia + 1, wa]]) { if (!w2) continue; if (f(ax.pts[j] * (1 - i / (n - 1))) < 0.5) u += ww * w2; } } return u; };
          // the coverage node: the 6-point share axis with each row's edge a*(W_j) added; a node at the edge is supported
          const uCov = () => { let u = 0; for (const [j, ww] of rowsW) { if (!ww) continue; const Wj = ax.pts[j], aStar = Wj > 0 && Number.isFinite(acc) ? 1 - acc / Wj : -Infinity; const nodes = Array.from({ length: SH }, (_, i) => i / (SH - 1)); if (aStar > 0 && aStar < 1 && !nodes.some(x => Math.abs(x - aStar) < 1e-12)) nodes.push(aStar); nodes.sort((x, y) => x - y); let lo = 0; while (lo < nodes.length - 2 && nodes[lo + 1] <= a) lo++; const span = nodes[lo + 1] - nodes[lo], w2 = span > 0 ? Math.min(1, Math.max(0, (a - nodes[lo]) / span)) : 0; for (const [x, w3] of [[nodes[lo], 1 - w2], [nodes[lo + 1], w2]]) { if (!w3) continue; if (f(Wj * (1 - x)) < 0.5) u += ww * w3; } } return u; };
          const ua = uAt(SH), step = isStep(RD), unAll = NS.map(n => (n === SH ? ua : uAt(n))), uc = uCov();
          CHK.cov++; if (uc > ua + 1e-12) CHK.covBad++;
          // the read's own support (its own accessible money against the threshold), the top share cell at 6 points, and under
          // a node on each wealth row's edge (option B) the span left between the read's own edge and its lower row's
          const As = st[1] + st[2], own = f(As) >= 0.5, rA = Number.isFinite(acc) && acc > 0 ? As / acc : Infinity, topLo = 1 - 1 / (SH - 1);
          const aOwn = Wt > 0 && Number.isFinite(acc) ? 1 - acc / Wt : -Infinity, aRows = rowsW.filter(([, ww]) => ww > 0).map(([j]) => (ax.pts[j] > 0 && Number.isFinite(acc) ? 1 - acc / ax.pts[j] : -Infinity));
          const span = uc > 1e-9 && aRows.length ? Math.max(0, aOwn - Math.min(...aRows)) : 0;
          const keys = ['all']; if (step) keys.push(own ? 'stepsup' : 'stepuns');
          for (const key of keys) {
            const B = Y[t][key] || (Y[t][key] = blank());
            B.n++; B.um += um; B.ua += ua; B.dmax = Math.max(B.dmax, Math.abs(um - ua)); B.cl.add(hist);
            unAll.forEach((u, q) => { B.un[q] += u; if (u > 1e-9) B.any[q]++; });
            B.uc += uc; if (uc > 1e-9) { B.anyc++; B.span += span; B.nspan++; }
            if (a > topLo) B.top++; if (aOwn > topLo) B.edgeTop++;
            B.ha[Math.min(9, Math.max(0, Math.floor(a * 10)))]++; B.hr[RB.findIndex(([lo, hi]) => rA >= lo && rA < hi)]++;
          }
        }
      }
      prev = ai; hist += `${ai},`;
      return ai;
    };
    const t1 = Date.now();
    zpaths.forEach(zs => { prev = -1; hist = ''; runPolicy(r, zs, { choose }); });
    for (let t = 0; t <= T; t++) for (const key of ['stepsup', 'stepuns', 'all']) {
      const B = Y[t][key]; if (!B) continue;
      const f4 = x => (x / B.n).toFixed(4);
      console.log(`${''.padEnd(16)} pmap ${L} world ${k} year ${t} ${key}: reads ${B.n} clusters ${B.cl.size} um ${f4(B.um)} ua ${f4(B.ua)} dmax ${B.dmax.toExponential(2)} un ${B.un.map(f4).join(',')} any ${B.any.map(f4).join(',')} cov ${f4(B.uc)} anycov ${f4(B.anyc)} top ${f4(B.top)} edgetop ${f4(B.edgeTop)} span ${B.nspan ? (B.span / B.nspan).toFixed(4) : '-'}`);
      console.log(`${''.padEnd(16)} hist ${L} world ${k} year ${t} ${key}: a ${B.ha.join(',')} r ${B.hr.join(',')}`);
    }
    console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(4)}: paths ${zpaths.length} secs ${Math.round((Date.now() - t1) / 1000)}`);
  }
  console.log(`${''.padEnd(16)} nodecheck ${L}: tables ${NODE.tables} nodes ${NODE.nodes} off ${NODE.off}`);
  console.log(`${''.padEnd(16)} checks ${L}: acc ${CHK.acc} accbad ${CHK.accBad} cov ${CHK.cov} covbad ${CHK.covBad}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
