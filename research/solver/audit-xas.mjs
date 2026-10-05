/*
 * XAS: THE EXACT ONE-STEP CHECK AT THE READER'S READS (PLAN.md XAS; the deep review after COV-B-STEP, deep-review-log.md
 * 5 Oct 09:27 UK: family 3's proposed root-cause step and the decisive test before 7an). COV-B-STEP's unit (PMAP's:
 * READER/TS+J/W0.02/PCLSI, 6 share points, 30 wealth points, e3 off) in two arms, BASE and COV (readerTax and coverage), on
 * S370, S130, bridge 4 and S126, at COV-B-STEP's seed (7002, tuning) and paths, one process a household.
 * Along BASE's own paths (BASE's moves), at every reader year t after the first move, and in each world k, per arm:
 *   read   the arm's table at t read at BASE's state through the layer of BASE's previous move (COV-B-STEP's read; the
 *          reducer's identity holds BASE's and COV's reads to COV-B-STEP's saved files read for read);
 *   ex5    the one-step value at the same state: BASE's move scored against the arm's table at t + 1 (scoreMoves, the
 *          survival part, the solve's own 5 quadrature points) - read less ex5 is the table's REPRESENTATION error there;
 *   exF    the same with 41 Gauss-Hermite points (each pot's rate at a node by the solve's own formula, copied: realAt) -
 *          ex5 less exF is the QUADRATURE error;
 *   exS    (BASE only, where t + 1 holds a reader step) the same split at the step and integrated each side of it
 *          (stepExpect, bridgeStep 'exact'); NaN where no step lies at t + 1 or it lies outside z in [-9, 9];
 *   claim  the arm's read at t + 1 at BASE's next state (0 when the path fails in the year), as COV-B-STEP's;
 * with the year, world, kind (step year or spread), BASE's support (COV-B-STEP's), the top cell (the share between the top
 * two share nodes of its row) and the straddle (the 5 quadrature points' accessible money at t + 1 falling both sides of
 * the next year's reader step under BASE's move).
 * And S126's opening (O99: one opening move changed on every path): BASE's and COV's year-0 move, both arms' scores of
 * both moves and their gaps to the best other move (the mixture's score, chooseAction's), and the forward run of each arm
 * with its year-0 move swapped for the other arm's (the opening-move swap).
 * Lines per household: case, solve (an arm each), ran, xas (an arm and kind: reads, mean read - ex5, ex5 - exF, read -
 * claim, ex5 - claim), checks (the self-checks below), open (S126), swap (S126: survived per arm, own and swapped), done.
 * Self-checks, each refusing the run: realAt's copy equals the solve's own rates at its 5 points on every year and move
 * read; ex5 at BASE's move equals chooseAction's mixture score's survival part re-summed; exF at 5 points (the solve's
 * nodes) equals ex5. Per-read files: results/diagxas/<id>.json.gz.
 *   node research/solver/audit-xas.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves, gaussHermite, NODES } from '../../src/solver/solve.js';
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
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-xas: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-xas: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const OUT = process.env.DIAGXAS_OUT || join(HERE, 'results', 'diagxas');
const LAMBDA = 0.0223606797749979, W = 0.02, SH = 6, NF = 41;

// audit-covb.mjs l.56-84, copied (its module runs its units on import): its households and built variants
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2, scale = 1 } = {}) {
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
  return { id: name, plan: p };
}
export const UNITS = ['S370', 'S130', 'bridge 4', 'S126'];
const BUILT = { 'bridge 4': { bridge: 4 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
export const ARMS = [['BASE', {}], ['COV', { readerTax: true, coverage: true }]];
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const L = 'READER/TS+J/W0.02/PCLSI';
console.log(`XAS: ${L} at ${SH} share points, ${POINTS} wealth points, ${NPW} paths a world (seed ${SEED}); arms BASE and COV; exact one-step values at ${NF} points; ${UNITS.length} households; part ${pk}/${pn}`);

// solve.js realAt (l.160), copied: each pot's real rate at a draw z, for the fine quadrature
function realAt(c, z, out, act, t) {
  const R = act ? act.real : c.real, V = act ? act.volEffAt[t] : c.volEffAt[t];
  for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + R[i]) + V[i] * z) - 1;
  return out;
}
const GHF = gaussHermite(NF), RDB = new Float64Array(4);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');

UNITS.forEach((id, ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-xas: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3 | arms ${ARMS.map(a => a[0]).join(',')}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const R = {};
  for (const [key, o] of ARMS) {
    const t0 = Date.now();
    // e3 off: coverage refuses e3, and COV-B-STEP's unit ran without it (the identity against its saved reads)
    const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false, ...o });
    if (!r.meta.tierState || !r.meta.jointWorlds || r.g.pclsInterp !== true || r.meta.e3) { console.error(`audit-xas: ${id} ${key} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
    if (!!o.readerTax !== !!(r.g.reader && r.g.reader.tax) || !!o.coverage !== !!r.g.cov) { console.error(`audit-xas: ${id} ${key}: the arm's settings did not take`); process.exit(2); }
    R[key] = r;
    console.log(`${''.padEnd(16)} solve ${key}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${r.g.np} shares ${r.g.ni} readerYears ${r.g.reader ? r.g.reader.years.reduce((t, x) => t + (x ? 1 : 0), 0) : 0} readerTax ${r.meta.readerTax || '-'} coverage ${r.meta.coverage ? `${r.meta.coverage.nodes}/${r.meta.coverage.copied}` : '-'}`);
  }
  const base = R.BASE, m = base.m, T = m.ctx.totalYears, K = base.worlds.length, n = base.actions.length;
  const STEP = new Set(R.COV.g.reader && R.COV.g.reader.tax ? R.COV.g.reader.tax.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const RY = new Set(base.g.reader ? base.g.reader.years.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  console.log(`${''.padEnd(16)} ran ${L}: mix ${K} pts ${POINTS} seed ${SEED} paths ${NPW * K} worlds ${K} steps ${[...STEP].join(',') || 'none'} readerYears ${[...RY].join(',') || 'none'} nf ${NF} access ${Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0)} years ${T}`);
  const paths = E.pathsForSeed(SEED, NPW, T);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n);
  const CHK = { rates: 0, ratesBad: 0, mix: 0, mixBad: 0, nodes: 0, nodesBad: 0 };
  const readAt = (r, k, t, st, prevAi) => {
    const tab = r.mix.tables[k], Ln = tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[prevAi]] : tab;
    return readValues(r.g, Ln.lsurv[t], Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0];
  };
  // the one-step survival of move ai at state st against the world table's t + 1, at the solve's points (QZ null) or at QZ
  const oneStep = (tab, st, t, held, ai, QZ, QW) => {
    if (!QZ) { scoreMoves(tab, st, t, SC, TX, BQ, held, null, SV); return SC[ai] === -Infinity ? 0 : SV[ai]; }
    const act = tab.c.acts[ai], nr = QZ.map(z => realAt(tab.c, z, new Float64Array(4), act, t)), qw0 = tab.quadWeights;
    tab.quadWeights = QW;
    try { scoreMoves(tab, st, t, SC, TX, BQ, held, { ai, nr, act }, SV); } finally { tab.quadWeights = qw0; }
    return SC[ai] === -Infinity ? 0 : SV[ai];
  };
  // solve.js stepAtOf (l.263), copied: where next year's reader step lies for the world table, or null
  const schedOf = (tab, t) => {
    const RDn = base.g.reader && base.g.reader.years[t + 1] ? base.g.reader.of.get(tab.lsurv[t + 1]) : null, sch = RDn && RDn.chance && RDn.chance.schedule;
    return sch && sch.bills.length ? sch.bills[0] - 1 : null;
  };
  const stepOne = (tab, st, t, held, ai) => {
    if (schedOf(tab, t) === null) return NaN;
    const was = tab.stepExact; tab.stepExact = true;
    let v;
    try { scoreMoves(tab, st, t, SC, TX, BQ, held, null, SV); v = SC[ai] === -Infinity ? 0 : SV[ai]; } finally { tab.stepExact = was; }
    // stepExpect declined (no step, or outside z in [-9, 9]): the 5 points stood, so not a step read
    return v;
  };
  // the share's position and the straddle under BASE's move
  const post = new Float64Array(8), grown = new Float64Array(8), rb = new Float64Array(4);
  const topCell = (g, st) => { const Wt = st[0] + st[1] + st[2], a = Wt > 0 ? st[0] / Wt : 0, sh = g.axes && g.axes.a ? g.axes.a : null; return sh && sh.length >= 2 ? (a >= sh[sh.length - 2] ? 1 : 0) : -1; };
  const straddle = (tab, st, t, held, ai) => {
    const at = schedOf(tab, t), c = tab.c;
    if (at === null) return -1;
    post.set(st.subarray ? st.subarray(0, 8) : st); if (F.flow(c, t, ai, post) > 1) return -1;
    if (held) F.chargeSwitch(c, post, held, c.acts[ai], t);
    let lo = 0, hi = 0;
    for (const z of NODES) { grown.set(post); F.grow(c, t, grown, realAt(c, z, rb, c.acts[ai], t)); if (grown[1] + grown[2] >= at) hi++; else lo++; }
    return lo && hi ? 1 : 0;
  };
  const X = { p: [], t: [], k: [], kind: [], top: [], strad: [], arms: Object.fromEntries(ARMS.map(([a]) => [a, { read: [], ex5: [], exF: [], claim: [] }])), exS: [] };
  const t2 = Date.now();
  for (let k = 0; k < K; k++) {
    const z = base.mix.nodes[k];
    paths.forEach((zs, pi) => {
      const cz = Float64Array.from(zs); cz[cz.length - 1] = z;
      let prev = -1, pend = false;
      const choose = (t, st, held) => {
        const ai = chooseAction(base, st, t, held), mixSC = base._sc[ai];
        if (pend) { for (const [a] of ARMS) X.arms[a].claim.push(readAt(R[a], k, t, st, prev)); pend = false; }
        if (prev >= 0 && RY.has(t)) {
          const tb = base.mix.tables[k];
          X.p.push(pi); X.t.push(t); X.k.push(k); X.kind.push(STEP.has(t) ? 1 : 0); X.top.push(topCell(base.g, st)); X.strad.push(straddle(tb, st, t, held, ai));
          for (const [a] of ARMS) {
            const tab = R[a].mix.tables[k], A = X.arms[a];
            A.read.push(readAt(R[a], k, t, st, prev));
            const e5 = oneStep(tab, st, t, held, ai, null, null);
            A.ex5.push(e5);
            A.exF.push(oneStep(tab, st, t, held, ai, GHF.nodes, GHF.weights));
            // self-check: the copied rates at the solve's own 5 points are the solve's, and the variant path at them is ex5
            const nr5 = tab.nodeRealOfAt[t][ai], mine = NODES.map(q => realAt(tab.c, q, new Float64Array(4), tab.c.acts[ai], t));
            CHK.rates++; if (nr5.some((v, i) => v.some((x, j) => x !== mine[i][j]))) CHK.ratesBad++;
            CHK.nodes++; if (Math.abs(oneStep(tab, st, t, held, ai, NODES, tab.quadWeights) - e5) > 1e-12) CHK.nodesBad++;
          }
          X.exS.push(stepOne(tb, st, t, held, ai));
          // self-check: BASE's move's mixture score re-summed from each world's scoreMoves equals what chooseAction ranked
          let s = 0; base.mix.tables.forEach((tab, kk) => { scoreMoves(tab, st, t, SC, TX, BQ, held); s += base.mix.weights[kk] * SC[ai]; });
          CHK.mix++; if (!(Math.abs(s - mixSC) <= 1e-12)) CHK.mixBad++;
          pend = true;
        }
        prev = ai;
        return ai;
      };
      runPolicy(base, cz, { choose });
      if (pend) for (const [a] of ARMS) X.arms[a].claim.push(0);
    });
  }
  const N = X.t.length;
  for (const [a] of ARMS) {
    const A = X.arms[a];
    if ([A.read, A.ex5, A.exF, A.claim].some(v => v.length !== N)) { console.error(`audit-xas: ${id} ${a}: the reads do not line up`); process.exit(2); }
    for (const kind of [1, 0]) {
      const J = X.kind.map((x, j) => (x === kind ? j : -1)).filter(j => j >= 0), mean = f => (J.length ? J.reduce((s, j) => s + f(j), 0) / J.length : NaN);
      console.log(`${''.padEnd(16)} xas ${a} ${kind ? 'step' : 'spread'}: reads ${J.length} rep ${f4(mean(j => A.read[j] - A.ex5[j]))} quad ${f4(mean(j => A.ex5[j] - A.exF[j]))} D ${f4(mean(j => A.read[j] - A.claim[j]))} D5 ${f4(mean(j => A.ex5[j] - A.claim[j]))} secs ${Math.round((Date.now() - t2) / 1000)}`);
    }
  }
  console.log(`${''.padEnd(16)} checks: rates ${CHK.rates - CHK.ratesBad}/${CHK.rates} nodes ${CHK.nodes - CHK.nodesBad}/${CHK.nodes} mix ${CHK.mix - CHK.mixBad}/${CHK.mix}`);
  if (CHK.ratesBad || CHK.nodesBad || CHK.mixBad || !N) { console.error(`audit-xas: ${id}: a self-check failed or ran on nothing`); process.exit(2); }
  const rec = { id, p: X.p, t: X.t, k: X.k, kind: X.kind, top: X.top, strad: X.strad, exS: X.exS.map(x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : null)), arms: Object.fromEntries(ARMS.map(([a]) => [a, Object.fromEntries(Object.entries(X.arms[a]).map(([q, v]) => [q, v.map(x => Math.round(x * 1e9) / 1e9)]))])) };
  // S126's opening: each arm's year-0 move, both moves' mixture scores in each arm, and the swap
  if (id === 'S126') {
    const st0 = { v: null }, mv = {};
    runPolicy(base, Float64Array.from(paths[0]), { choose: (t, st, held) => { if (t === 0 && !st0.v) st0.v = { st: Float64Array.from(st), held }; return chooseAction(base, st, t, held); } });
    const { st, held } = st0.v;
    for (const [a] of ARMS) mv[a] = chooseAction(R[a], st, 0, held);
    const scoreOf = (r, ai) => { let s = 0; r.mix.tables.forEach((tab, kk) => { scoreMoves(tab, st, 0, SC, TX, BQ, held); s += r.mix.weights[kk] * SC[ai]; }); return s; };
    const best2 = r => { const v = []; for (let ai = 0; ai < n; ai++) v.push(scoreOf(r, ai)); const o = v.map((x, i) => [x, i]).filter(x => x[0] > -Infinity).sort((p, q) => q[0] - p[0]); return o.slice(0, 3); };
    for (const [a] of ARMS) {
      const b = best2(R[a]);
      console.log(`${''.padEnd(16)} open ${a}: move ${mv[a]} scores BASE-move ${f4(scoreOf(R[a], mv.BASE))} COV-move ${f4(scoreOf(R[a], mv.COV))} gap ${f4(scoreOf(R[a], mv.BASE) - scoreOf(R[a], mv.COV))} best3 ${b.map(([x, i]) => `${i}:${f4(x)}`).join(',')}`);
    }
    rec.open = { BASE: mv.BASE, COV: mv.COV };
    // the swap: each arm run forward with its year-0 move replaced by the other arm's
    const sw = {};
    for (const [a] of ARMS) {
      const other = a === 'BASE' ? 'COV' : 'BASE', r = R[a];
      let own = 0, swapped = 0; const so = [], ss = [];
      for (let k = 0; k < K; k++) {
        const z = r.mix.nodes[k];
        paths.forEach((zs) => {
          const cz = Float64Array.from(zs); cz[cz.length - 1] = z;
          const o1 = runPolicy(r, cz, {}); own += o1.survived ? 1 : 0; so.push(o1.survived ? 1 : 0);
          const o2 = runPolicy(r, cz, { choose: (t, s, held) => (t === 0 ? mv[other] : chooseAction(r, s, t, held)) }); swapped += o2.survived ? 1 : 0; ss.push(o2.survived ? 1 : 0);
        });
      }
      console.log(`${''.padEnd(16)} swap ${a}: paths ${K * NPW} survived ${own} with ${other}'s opening ${swapped}`);
      sw[a] = { own: so, swapped: ss };
    }
    rec.swap = sw;
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id.replace(/\s+/g, '_')}.json.gz`), gzipSync(JSON.stringify({ stamp: STAMP, seed: SEED, npw: NPW, points: POINTS, nf: NF, ...rec })));
  console.log(`${''.padEnd(16)} done ${L} rss ${Math.round(process.resourceUsage().maxRSS / 1024)}MB`);
});
