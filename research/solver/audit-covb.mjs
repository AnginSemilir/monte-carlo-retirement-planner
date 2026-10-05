/*
 * COV-B-STEP: THE READER'S TAX AND THE STEP-YEAR EDGE NODE, ARM BY ARM (PLAN.md COV and RTAX; items/COV.md, items/RTAX.md;
 * predictions/diag-covb.md). PMAP's unit (READER/TS+J/W0.02/PCLSI, 6 share points, e3 off) in three arms, one process a
 * household, the same paths for every arm:
 *   BASE  PMAP's unit as it ran;
 *   TAX   with readerTax (RTAX v2: in a step year, inside the edge band, support decided by the floor moves' flow);
 *   COV   with readerTax and coverage (COV-B: the edge node a wealth row in step years, at d0 - tol/2 + tauMax_j);
 * and on S370 a fourth, ORDER (BASE with readerRef 'order', O81's unit: the spread reads' reference drawn in the menu's
 * order). Households: S130, S370, bridge 4, S126; controls bridge 0 (no reader year: every arm the same paths) and
 * S126 all-ISA (S126 with its taxable and cash money in the ISA: no tax, so TAX equals BASE).
 * Per arm and world: the forward run under the arm's own policy (survived, fail year, net estate per path); along BASE's
 * own paths, a FIXED-POLICY re-read at every step year: each arm's step-year survival read at BASE's state through the layer
 * of BASE's previous move, less that arm's read the next year at BASE's next state (0 when the path fails in the year) - the
 * step read's error against the claim at t + 1 (D) - and how often TAX's and COV's chooser would move differently from BASE's
 * at BASE's state (the step year and the year before it).
 * Lines per household: case, solve (an arm each), ran, sum (an arm each: paths, survivors, a checksum of the survival
 * pattern), fixed (an arm each: step reads, mean D), moves (TAX and COV), done. Per-path files: results/diagcovb/<id>.json.gz.
 *   node research/solver/audit-covb.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-covb: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-covb: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const OUT = process.env.DIAGCOVB_OUT || join(HERE, 'results', 'diagcovb');
const LAMBDA = 0.0223606797749979, W = 0.02, SH = 6;

// audit-pmap.mjs l.56-84, copied (its module runs its units on import): PMAP's households and its built variants
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
// S126 all-ISA: its taxable and cash money moved into its ISA (the reader-tax.test.mjs construction)
function allIsa(name) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const liq = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  let put = false;
  p.accounts = p.accounts.map(a => { if (!LIQ.test(a.category)) return a; if (/^S&S ISA/.test(a.category) && !put) { put = true; return { ...a, balance: liq }; } return { ...a, balance: 0 }; });
  if (!put) throw new Error('S126 has no ISA account');
  return { id: name, plan: p };
}
export const UNITS = ['S130', 'S370', 'bridge 4', 'S126', 'bridge 0', 'S126 all-ISA'];
const BUILT = { 'bridge 4': { bridge: 4 }, 'bridge 0': { bridge: 0 } };
const caseOf = id => (id === 'S126 all-ISA' ? allIsa(id) : BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
export const ARMS = [['BASE', {}], ['TAX', { readerTax: true }], ['COV', { readerTax: true, coverage: true }]];
const ORDER = ['ORDER', { readerRef: 'order' }];
const armsOf = id => (id === 'S370' ? [...ARMS, ORDER] : ARMS);
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const L = 'READER/TS+J/W0.02/PCLSI';
console.log(`COV-B-STEP: ${L} at ${SH} share points, ${POINTS} wealth points, ${NPW} paths a world (seed ${SEED}); arms BASE, TAX (readerTax), COV (readerTax and coverage), ORDER on S370; ${UNITS.length} households; part ${pk}/${pn}`);
const RDB = new Float64Array(4);

UNITS.forEach((id, ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-covb: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3 | arms ${armsOf(id).map(a => a[0]).join(',')}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const R = {};
  for (const [key, o] of armsOf(id)) {
    const t0 = Date.now();
    // e3 off: coverage refuses e3 (solve.js; items/COV.md: each shown identical with it before it joins), and PMAP's unit ran without it
    const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false, ...o });
    if (!r.meta.tierState || !r.meta.jointWorlds || r.g.pclsInterp !== true || r.meta.e3) { console.error(`audit-covb: ${id} ${key} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
    if (!!o.readerTax !== !!(r.g.reader && r.g.reader.tax) || !!o.coverage !== !!r.g.cov || (o.readerRef === 'order') !== (r.meta.readerRef === 'order')) { console.error(`audit-covb: ${id} ${key}: the arm's settings did not take`); process.exit(2); }
    R[key] = r;
    const steps = r.g.reader && r.g.reader.tax ? r.g.reader.tax.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : [];
    console.log(`${''.padEnd(16)} solve ${key}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${r.g.np} shares ${r.g.ni} readerYears ${r.g.reader ? r.g.reader.years.reduce((t, x) => t + (x ? 1 : 0), 0) : 0} stepYears ${steps.join(',') || 'none'} readerTax ${r.meta.readerTax || '-'} coverage ${r.meta.coverage ? `${r.meta.coverage.nodes}/${r.meta.coverage.copied}` : '-'} readerRef ${r.meta.readerRef || '-'}`);
  }
  const base = R.BASE, m = base.m, T = m.ctx.totalYears, K = base.worlds.length;
  // the step years: the TAX arm's (a year every world's reference reads as a 0/1 step); none without a reader year
  const STEP = new Set(R.TAX.g.reader && R.TAX.g.reader.tax ? R.TAX.g.reader.tax.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  console.log(`${''.padEnd(16)} ran ${L}: mix ${K} pts ${POINTS} seed ${SEED} paths ${NPW * K} worlds ${K} steps ${[...STEP].join(',') || 'none'} access ${Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0)} years ${T}`);
  const paths = E.pathsForSeed(SEED, NPW, T);
  const rec = { id, arms: {}, fixed: {}, moves: {} };
  // each arm's own forward run
  for (const [key] of armsOf(id)) {
    const r = R[key], surv = new Uint8Array(K * NPW), fy = new Int16Array(K * NPW).fill(-1), net = new Float64Array(K * NPW);
    const t1 = Date.now();
    for (let k = 0; k < K; k++) {
      const z = r.mix.nodes[k];
      paths.forEach((zs, i) => { const c = Float64Array.from(zs); c[c.length - 1] = z; const o = runPolicy(r, c, {}); const j = k * NPW + i; surv[j] = o.survived ? 1 : 0; fy[j] = o.failYear === null ? -1 : o.failYear - m.ctx.baseYear; net[j] = o.terminalNet || 0; });
    }
    let S = 0, sum = 0; for (let j = 0; j < surv.length; j++) { S += surv[j]; sum = (sum * 31 + surv[j] * (j % 997 + 1)) % 1000000007; }
    console.log(`${''.padEnd(16)} sum ${key}: paths ${surv.length} survived ${S} pathsum ${sum} secs ${Math.round((Date.now() - t1) / 1000)}`);
    rec.arms[key] = { survived: Array.from(surv), failYear: Array.from(fy), net: Array.from(net, x => Math.round(x)) };
  }
  // the fixed-policy re-read along BASE's own paths: each arm's step read at BASE's state, less its read the next year
  const keys = armsOf(id).map(a => a[0]), D = Object.fromEntries(keys.map(k => [k, []])), MOV = { TAX: [0, 0, 0, 0], COV: [0, 0, 0, 0] };
  const readAt = (key, k, t, st, prevAi) => {
    const r = R[key], tab = r.mix.tables[k], Ln = tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[prevAi]] : tab;
    return readValues(r.g, Ln.lsurv[t], Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0];
  };
  const t2 = Date.now();
  for (let k = 0; k < K; k++) {
    const z = base.mix.nodes[k];
    paths.forEach((zs) => {
      const c = Float64Array.from(zs); c[c.length - 1] = z;
      let prev = -1, pend = null;
      const choose = (t, st, held) => {
        const ai = chooseAction(base, st, t, held);
        if (pend) { for (const key of keys) D[key].push(pend[key] - readAt(key, k, t, st, prev)); pend = null; }
        if (prev >= 0 && STEP.has(t)) { pend = {}; for (const key of keys) pend[key] = readAt(key, k, t, st, prev); }
        // the moves TAX's and COV's chooser would make at BASE's state, in the step years and the years before them (where a
        // step-year read enters the choice): [step year same, differ, year before same, differ]
        const bucket = STEP.has(t) ? 0 : STEP.has(t + 1) ? 2 : -1;
        if (bucket >= 0) for (const key of ['TAX', 'COV']) { const aj = chooseAction(R[key], st, t, held); MOV[key][bucket + (aj === ai ? 0 : 1)]++; }
        prev = ai;
        return ai;
      };
      runPolicy(base, c, { choose });
      if (pend) for (const key of keys) D[key].push(pend[key]);   // the path failed in the step year: the claim at t + 1 is 0
    });
  }
  for (const key of keys) {
    const d = D[key], mean = d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0;
    console.log(`${''.padEnd(16)} fixed ${key}: reads ${d.length} meanD ${mean.toExponential(4)}`);
    rec.fixed[key] = d.map(x => Math.round(x * 1e9) / 1e9);
  }
  for (const key of ['TAX', 'COV']) { const v = MOV[key]; console.log(`${''.padEnd(16)} moves ${key}: step ${v[0]}/${v[1]} before ${v[2]}/${v[3]} (same/differ) secs ${Math.round((Date.now() - t2) / 1000)}`); rec.moves[key] = v; }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id.replace(/\s+/g, '_')}.json.gz`), gzipSync(JSON.stringify({ stamp: STAMP, seed: SEED, npw: NPW, points: POINTS, ...rec })));
  console.log(`${''.padEnd(16)} done ${L}`);
});
