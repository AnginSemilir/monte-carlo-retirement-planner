/*
 * NE-ROOT: why the candidate's S364 survival read is a plateau - too high in worlds 0 and 1, too flat in money and
 * volatility in all three (PLAN.md NE-ROOT and O137; the deep review after NE-SPLIT, deep-review-log.md 11 Oct 02:37 UK,
 * its decisive test). The candidate's own unit (CAND solveCandidate, CANDIDATE_OPTS with e3pcls), 30 points, the tuning
 * seed 7002 (7u's held-out seed refused). Eleven jobs, one process each (JOBS): S364 at 0.02 and bridge 4 at 0.02 (the
 * control) under four arms - BASE (the candidate as it is), R0 (readerSplit 'r0': nothing left in the reader's residual),
 * SIMP (readerChance 'sim': the reference chance simulated on the same schedule), READEROFF (bridgeRead off, and with it
 * bridgeStep, which needs the reader) - and, under BASE, S364 at 0.01 (reported), S224 and S380 at 0.02 (their world lines,
 * reported: whether the plateau reaches 7u-F's households).
 * At the household's year-0 state:
 *   the openings: on S364 and bridge 4, SS and SC - SHIP's own year-0 spend level at the plan's tiers (0/0) and two steps
 *   down (2/2), with the rest of the move (withdrawal steps, harvest, lump, sweep) SHIP's own opening's, so the two are the
 *   same moves under every arm (SHIP solvePlan on the candidate's plan, the product's settings, solved in each job; it
 *   takes no arm); on S224 and S380, CAND's own opening (OWN);
 *   each opening's survival part in every world table (scoreMoves, as NE-SPLIT's parts);
 *   STAGE 1 (BASE, S364 at both weights): each world table's year-1 read at each opening split into its parts by scoring
 *   the opening again with every reader table's c and R swapped and restored: pc (R set to 0: the reference times the
 *   continuation), r (c set to 0, R halved about 1: the residual), w1 (c 0, R 1: the weight the year-1 reads carry), p (c 1,
 *   R 0: the reference alone), and the share of the reads' corner weight on each corner status - supported, clipped (a
 *   supported node whose survival beats its reference, c held at 1), share-copied (c from a supported node along its share
 *   row), row-copied (c from another wealth row: the meter's blind spot, O138), none (c 0) - and per reader table (bridge
 *   year and world) the nodes by status and, at its funded share corners (the lowest pension share, supported), the mean
 *   and largest R and the mean S - p;
 *   each opening forced in year 0 on the seed's first NPW paths with each world's long-run shift put in, the arm's own
 *   moves after it, beside that world's table survival.
 * Self-checks, each refusing the run: armTook (the arm's settings are in the solve's meta, the candidate's others intact),
 * splitIdentity (pc + r rebuilds each world's survival part within 1e-5: the read is linear in c and R), splitCover (the
 * five status shares sum to 1 within 1e-5), forceIdentity (forcing CAND's own opening on world 0's paths reproduces the
 * unforced run on every one of world 0's first 1,000 paths). NEROOT_PLANT=split moves r by 1e-3 (splitIdentity must refuse); NEROOT_PLANT=arm runs the R0
 * job without its arm (armTook must refuse).
 *   node research/solver/audit-neroot.mjs [points=30] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { solveCandidate, candidatePlan, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

export const JOBS = [['S364', '0.02', 'BASE'], ['S364', '0.02', 'R0'], ['S364', '0.02', 'SIMP'], ['S364', '0.02', 'READEROFF'],
  ['bridge 4', '0.02', 'BASE'], ['bridge 4', '0.02', 'R0'], ['bridge 4', '0.02', 'SIMP'], ['bridge 4', '0.02', 'READEROFF'],
  ['S364', '0.01', 'BASE'], ['S224', '0.02', 'BASE'], ['S380', '0.02', 'BASE']];
export const ARMS = Object.freeze({ BASE: {}, R0: { readerSplit: 'r0' }, SIMP: { readerChance: 'sim' }, READEROFF: { bridgeRead: false, bridgeStep: undefined } });
export const PAIRED = ['S364', 'bridge 4'];   // the households read at SS and SC; the others at CAND's own opening
export const STATUS = ['sup', 'clip', 'share', 'row', 'none'];
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 4000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-neroot: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-neroot: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-neroot: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NEROOT_PLANT || '';
if (PLANT && !['split', 'arm'].includes(PLANT)) { console.error(`audit-neroot: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, FI = Math.min(NPW, 1000);   // forceIdentity's paths: world 0's first 1,000
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-neroot: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGNEROOT_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagneroot');
mkdirSync(OUT, { recursive: true });

// the households: audit-7u.mjs's builders (copied, as audit-nesplit.mjs): bridge 4 from S126, S364 the library's
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
const caseOf = id => (id === 'bridge 4' ? variant(id, { bridge: 4 }) : all.find(s => s.id === id));
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
const fileOfJob = (id, w, arm) => `${id.replace(/ /g, '_')}-w${w}-${arm}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });
const rest = a => `${[...a.steps]}|${[...a.costSteps]}|${a.harvest}|${a.harvestCeil}|${a.lump}|${a.sweep}`;

/* each node's corner status in one reader table, from the table as built: buildReaderTable's own rules (reader.js) */
function statusOf(g, RD) {
  const n = g.size, st = new Uint8Array(n), S = new Float64Array(n);
  for (let i = 0; i < n; i++) S[i] = RD.p[i] * RD.c[i] + RD.R[i];
  const { np, ni, nt } = g, NG = g.gain.length, NCL = g.pcls.length;
  const row = (ip, it, ig, ic) => ((ic * NG + ig) * nt + it) * np + ip;
  const rowHas = new Uint8Array(np * nt * NG * NCL);
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    for (let ii = 0; ii < ni; ii++) if (RD.p[g.index(ip, ii, it, ig, ic)] >= 0.5) { rowHas[row(ip, it, ig, ic)] = 1; break; }
  }
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    let src = -1;
    if (!rowHas[row(ip, it, ig, ic)]) for (let d = 1; d < np && src < 0; d++) {
      if (ip + d < np && rowHas[row(ip + d, it, ig, ic)]) src = ip + d;
      else if (ip - d >= 0 && rowHas[row(ip - d, it, ig, ic)]) src = ip - d;
    }
    for (let ii = 0; ii < ni; ii++) {
      const i = g.index(ip, ii, it, ig, ic);
      if (RD.p[i] >= 0.5) st[i] = S[i] > RD.p[i] ? 1 : 0;
      else st[i] = rowHas[row(ip, it, ig, ic)] ? 2 : src >= 0 ? 3 : 4;
    }
  }
  return { st, S };
}

console.log(`NE-ROOT: the candidate's own unit (CAND: solveCandidate under each arm; SHIP: solvePlan, the product's settings, for the openings), ${POINTS} points, ${NPW} paths a world (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach(([id, w, arm], ji) => {
  if (ji % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-neroot: no case ${id}`); process.exit(2); }
  const W = Number(w), L = `${arm}/W${w}`;
  console.log(`${id.padEnd(16)} case | job ${L} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const armOpts = PLANT === 'arm' && arm === 'R0' ? {} : ARMS[arm];
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: POINTS, bequestWeight: W, ...armOpts });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12;
  const took = arm === 'BASE' ? mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerSplit && !mt.readerChance
    : arm === 'R0' ? mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && /^r0 /.test(mt.readerSplit || '') && !mt.readerChance
      : arm === 'SIMP' ? mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && mt.readerChance === 'sim' && !mt.readerSplit
        : mt.bridgeRead === false && !mt.bridgeStep && !mt.readerSplit && !mt.readerChance;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${mt.mixture} pts ${cand.g.np} minPot ${E.num(plan.spending.minPot, 0)}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-neroot: ${id} ${L}: the arm's settings did not take`); process.exit(3); }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.c.acts, n = cand.actions.length;
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  const OP = {};
  if (PAIRED.includes(id)) {
    const t1 = Date.now(), ship = solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: POINTS, bequestWeight: W });
    if (ship.meta.bridgeRead || ship.meta.tierState || ship.meta.e3pcls || ship.switchMargin !== 0.001) { console.error(`audit-neroot: ${id}: SHIP's settings did not take`); process.exit(2); }
    const ownS = chooseAction(ship, s0, 0, H0()), lvS = ship.levelOf[ownS], RS = rest(ship.c.acts[ownS]);
    const find = tp => { for (let ai = 0; ai < n; ai++) if (Math.abs(cand.levelOf[ai] - lvS) < 1e-12 && acts[ai].tierPen === tp && acts[ai].tierIsa === tp && (acts[ai].tierGia || 0) === 0 && rest(acts[ai]) === RS) return ai; return -1; };
    OP.SS = find(0); OP.SC = find(2);
    if (OP.SS < 0 || OP.SC < 0) { console.error(`audit-neroot: ${id} ${L}: an opening is not in CAND's action set (${JSON.stringify(OP)})`); process.exit(2); }
    console.log(`${''.padEnd(16)} openings ${L}: SHIP's own level ${lvS} tiers ${ship.c.acts[ownS].tierPen},${ship.c.acts[ownS].tierIsa} secs ${Math.round((Date.now() - t1) / 1000)}; SS ai ${OP.SS}; SC ai ${OP.SC}; CAND's own ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen},${acts[ownC].tierIsa}`);
  } else {
    OP.OWN = ownC;
    console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen},${acts[ownC].tierIsa}`);
  }
  const KS = Object.keys(OP);
  // each world table's survival part at an opening (scoreMoves, as NE-SPLIT's parts)
  const NA = n, SC = new Float64Array(NA), TX = new Float64Array(NA), BQ = new Float64Array(NA), SV = new Float64Array(NA);
  const svOf = (tab, ai) => { scoreMoves(tab, s0, 0, SC, TX, BQ, H0(), { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[0][ai] }, SV); return SV[ai]; };
  const TAB = {}; for (const k of KS) TAB[k] = cand.mix.tables.map(tab => svOf(tab, OP[k]));
  const K = cand.mix.nodes.length;

  // STAGE 1: BASE on S364 only
  if (arm === 'BASE' && id === 'S364') {
    const pairs = [];
    for (const tab of cand.mix.tables) { const g = tab.g; if (g && g.reader && g.reader.of && !pairs.some(([, mp]) => mp === g.reader.of)) pairs.push([g, g.reader.of]); }
    const tabs = []; for (const [g, mp] of pairs) for (const RD of mp.values()) tabs.push({ g, RD, ...statusOf(g, RD) });
    if (!tabs.length) { console.error(`audit-neroot: ${id} ${L}: stage 1 found no reader table`); process.exit(3); }
    const swapped = (cOf, rOf, body) => {
      const keep = tabs.map(x => [x.RD.c, x.RD.R]);
      try { for (const x of tabs) { x.RD.c = cOf(x); x.RD.R = rOf(x); } return body(); } finally { tabs.forEach((x, j) => { x.RD.c = keep[j][0]; x.RD.R = keep[j][1]; }); }
    };
    const zeros = x => new Float64Array(x.RD.c.length), ones = x => new Float64Array(x.RD.c.length).fill(1);
    const CHK = { splitIdentity: 0, splitIdentityBad: 0, splitCover: 0, splitCoverBad: 0 };
    for (const k of KS) {
      const ai = OP[k], per = j => cand.mix.tables[j];
      const pc = swapped(x => x.RD.c, zeros, () => cand.mix.tables.map(tab => svOf(tab, ai)));
      const half = swapped(zeros, x => Float64Array.from(x.RD.R, r => (r + 1) / 2), () => cand.mix.tables.map(tab => svOf(tab, ai)));
      const w1 = swapped(zeros, ones, () => cand.mix.tables.map(tab => svOf(tab, ai)));
      const pOnly = swapped(ones, zeros, () => cand.mix.tables.map(tab => svOf(tab, ai)));
      const shares = STATUS.map((_, si) => swapped(zeros, x => Float64Array.from(x.st, s => ((s === si ? 1 : 0) + 1) / 2), () => cand.mix.tables.map(tab => svOf(tab, ai))));
      for (let j = 0; j < K; j++) {
        const r = 2 * half[j] - w1[j] + (PLANT === 'split' ? 1e-3 : 0);
        CHK.splitIdentity++; if (!(Math.abs(pc[j] + r - TAB[k][j]) <= 1e-5)) CHK.splitIdentityBad++;
        const sh = shares.map(v => (w1[j] > 0 ? (2 * v[j] - w1[j]) / w1[j] : NaN));
        CHK.splitCover++; if (!(Math.abs(sh.reduce((a, b) => a + b, 0) - 1) <= 1e-5)) CHK.splitCoverBad++;
        console.log(`${''.padEnd(16)} split ${L} ${j} ${k}: sv ${(100 * TAB[k][j]).toFixed(6)} pc ${(100 * pc[j]).toFixed(6)} r ${(100 * r).toFixed(6)} w1 ${w1[j].toFixed(6)} p ${(100 * pOnly[j]).toFixed(6)} | ${STATUS.map((s, si) => `${s} ${sh[si].toFixed(6)}`).join(' ')}`);
      }
      void per;
    }
    console.log(`${''.padEnd(16)} checks ${L}: splitIdentity ${CHK.splitIdentity - CHK.splitIdentityBad}/${CHK.splitIdentity} splitCover ${CHK.splitCover - CHK.splitCoverBad}/${CHK.splitCover}`);
    if (CHK.splitIdentityBad || !CHK.splitIdentity || CHK.splitCoverBad || !CHK.splitCover) { console.error(`audit-neroot: ${id} ${L}: a stage-1 self-check failed or ran on nothing`); process.exit(3); }
    // per reader table: the nodes by status; at its funded share corners (ii 0, supported) R and S - p
    for (const x of tabs) {
      const cnt = STATUS.map(() => 0); for (const s of x.st) cnt[s]++;
      const { np, nt } = x.g, NG = x.g.gain.length, NCL = x.g.pcls.length;
      let nf = 0, rs = 0, rmax = 0, smp = 0;
      for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
        const i = x.g.index(ip, 0, it, ig, ic);
        if (x.RD.p[i] < 0.5) continue;
        nf++; rs += x.RD.R[i]; if (Math.abs(x.RD.R[i]) > Math.abs(rmax)) rmax = x.RD.R[i]; smp += x.S[i] - x.RD.p[i];
      }
      console.log(`${''.padEnd(16)} year ${L} t ${x.RD.t} k ${x.RD.k}: nodes ${x.st.length} ${STATUS.map((s, si) => `${s} ${cnt[si]}`).join(' ')} | funded ${nf} Rmean ${nf ? (rs / nf).toExponential(4) : '-'} Rmax ${rmax.toExponential(4)} S-p ${nf ? (smp / nf).toExponential(4) : '-'}`);
    }
  }

  // forward, per world: each opening forced in year 0 with the arm's own moves after it
  const f0 = Date.now(), wpaths = E.pathsForSeed(SEED, NPW, T), bits = {};
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k];
    const line = KS.map(o => {
      const b = new Uint8Array(NPW);
      wpaths.forEach((zs, i) => { const cz = Float64Array.from(zs); cz[cz.length - 1] = z; b[i] = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: OP[o] } }).survived ? 1 : 0; });
      bits[`${o}${k}`] = b;
      return `${o} table ${(100 * TAB[o][k]).toFixed(6)} sim ${b.reduce((t, x) => t + x, 0)}/${NPW} bits ${sha16(b)}`;
    }).join('; ');
    console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: ${line}`);
  }
  // forceIdentity on world 0's first FI paths: CAND's own opening forced against its unforced run
  let same = 0;
  wpaths.slice(0, FI).forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = cand.mix.nodes[0]; const a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; });
  console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (same !== FI) { console.error(`audit-neroot: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
  writeFileSync(join(OUT, fileOfJob(id, w, arm)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(id, w, arm)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
