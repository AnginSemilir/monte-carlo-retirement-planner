/*
 * NE-SPLIT: why the candidate's tables choose S364's opening (PLAN.md NE-SPLIT and O132; the deep review after 7u,
 * deep-review-log.md 10 Oct 04:17 UK, its decisive test). Read-only on the candidate's own unit (7u's: CAND solveCandidate,
 * CANDIDATE_OPTS with e3pcls; SHIP solvePlan on the candidate's plan, the product's settings), 30 points, the tuning seed
 * 7002 (7u's held-out seed is refused). Units: S364 at the estate weights 0.02 and 0.01, bridge 4 at 0.02 (the control).
 * At the household's year-0 state, with the plan's tiers held:
 *   the four openings {SHIP's own year-0 spend level, CAND's own} x {the plan's tiers 0/0, two steps down 2/2}, each a move
 *   of CAND's action set (the taxable account at the plan's tier), scored in CAND's tables by their parts, per world table
 *   and mixture-weighted as chooseAction weights them: survival sv, estate bq (times wB), resilience rs (times wR), and h
 *   (the expected shortfall reads with the trim's cost), so that score = sv + wR rs + wB bq - h, and the chooser's switch
 *   charge on a move that leaves the held tiers; the same with the 2/2 openings' year-1 tier-state layer swapped for the
 *   plan's tiers' layer (the swap); the survival part of each opening in SHIP's tables (reported);
 *   each opening forced in year 0 on the same paths with CAND's own moves after it (runPolicy's start), and the arms'
 *   unforced runs: survival, failures split by kind (a year with no money, or the plan's end below its minimum pot),
 *   and per world (the seed's first NPW paths, each world's long-run shift put in) beside that world's table survival.
 * Self-checks, each refusing the run: partsSum (the parts rebuild each table's score within 1e-12 relative, every opening
 * and table), chooserTop (CAND's own opening is the best of the four by the chooser's score), swapIdentity (swapping a
 * plan-tier opening to its own layer changes nothing), forceIdentity (forcing CAND's own opening reproduces its unforced
 * run on every path: survival, failure kind, and its fail year or end wealth). NESPLIT_PLANT=partsum adds 1e-6 to one part (partsSum must refuse); NESPLIT_PLANT=force forces
 * the plan-tier opening at CAND's level as if it were CAND's own (forceIdentity must refuse).
 *   node research/solver/audit-nesplit.mjs [points=30] [paths=8000] [paths a world=2000] part k/n [seed=7002]
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

export const UNITS = [['S364', '0.02'], ['S364', '0.01'], ['bridge 4', '0.02']];
export const OPENINGS = ['SS', 'SC', 'CS', 'CC'];   // spend (S: SHIP's level, C: CAND's), then tiers (S: the plan's 0/0, C: 2/2)
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 8000), NPW = Number(process.argv[4] || 2000);
if (!(POINTS >= 4) || !(NP >= 1) || !(NPW >= 1)) { console.error(`audit-nesplit: bad grid size or path counts (${process.argv.slice(2, 5).join(', ')})`); process.exit(2); }
const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-nesplit: bad part ${part}`); process.exit(2); }
const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-nesplit: seed ${process.argv[7]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NESPLIT_PLANT || '';
if (PLANT && !['partsum', 'force'].includes(PLANT)) { console.error(`audit-nesplit: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979;
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-nesplit: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGNESPLIT_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagnesplit');
mkdirSync(OUT, { recursive: true });

// the households: audit-7u.mjs's builders (copied): bridge 4 from S126, S364 the library's
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
const f6 = x => (Number.isFinite(x) ? x.toExponential(6) : 'NaN');
const fileOf = (id, w) => `${id.replace(/ /g, '_')}-w${w}.json.gz`;
const settingsOf = (r, m) => `mix ${r.meta.mixture} pts ${r.g.np} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.bridgeStep ? ` bridgeStep ${r.meta.bridgeStep}` : ''}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge || 0} e3 ${!!r.meta.e3} e3pcls ${!!r.meta.e3pcls} pclsInterp ${!!r.g.pclsInterp} joint ${!!r.meta.jointWorlds}`;

console.log(`NE-SPLIT: the candidate's own unit (CAND: solveCandidate; SHIP: solvePlan, the product's settings; both on the candidate's plan), ${POINTS} points, ${NP} paths and ${NPW} a world (seed ${SEED}); ${UNITS.length} units; part ${part}`);
UNITS.forEach(([id, w], ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-nesplit: no case ${id}`); process.exit(2); }
  const W = Number(w), L = `NE/W${w}`;
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const base = { lambda: LAMBDA, points: POINTS, bequestWeight: W }, R = {};
  for (const a of ['CAND', 'SHIP']) {
    const t0 = Date.now();
    R[a] = a === 'CAND' ? solveCandidate(E, M, plan, base) : solvePlan(E, M, candidatePlan(E, plan), base);
    const r = R[a];
    const ok = a === 'CAND' ? r.meta.bridgeRead === 'reader' && r.meta.bridgeStep === 'exact' && !!r.meta.e3pcls && !!r.meta.tierState && !!r.meta.jointWorlds && r.switchMargin === 0 && r.switchCharge === 0.001
      : !r.meta.bridgeRead && !r.meta.tierState && !r.meta.e3pcls && r.switchMargin === 0.001 && !r.switchCharge;
    if (!ok || !(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-nesplit: ${id} ${a}: the arm's settings did not take`); process.exit(2); }
    const s0v = M.initialState(r.m);
    const table = 100 * r.worlds.reduce((t, wd, k) => t + r.mix.weights[k] * wd.value(s0v, 0).survival, 0);
    console.log(`${''.padEnd(16)} solve ${a} ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
    console.log(`${''.padEnd(16)} ran ${a} ${L}: ${settingsOf(r, r.m)}`);
  }
  const cand = R.CAND, ship = R.SHIP, m = cand.m, T = m.ctx.totalYears, acts = cand.c.acts, n = cand.actions.length;
  // the year-0 state as runPolicy builds it, and each arm's own opening
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const H0 = () => ({ pen: 0, isa: 0, gia: 0 });
  const ownC = chooseAction(cand, s0, 0, H0()), ownS = chooseAction(ship, s0, 0, H0());
  const lvC = cand.levelOf[ownC], lvS = ship.levelOf[ownS];
  console.log(`${''.padEnd(16)} own ${L}: CAND ai ${ownC} level ${lvC} tiers ${acts[ownC].tierPen},${acts[ownC].tierIsa} SHIP ai ${ownS} level ${lvS} tiers ${ship.c.acts[ownS].tierPen},${ship.c.acts[ownS].tierIsa}`);
  const find = (lv, tp) => { for (let ai = 0; ai < n; ai++) if (Math.abs(cand.levelOf[ai] - lv) < 1e-12 && acts[ai].tierPen === tp && acts[ai].tierIsa === tp && (acts[ai].tierGia || 0) === 0) return ai; return -1; };
  const OP = { SS: find(lvS, 0), SC: find(lvS, 2), CS: find(lvC, 0), CC: find(lvC, 2) };
  if (Object.values(OP).some(ai => ai < 0)) { console.error(`audit-nesplit: ${id}: an opening is not in CAND's action set (${JSON.stringify(OP)})`); process.exit(2); }
  // CAND's own opening is one of the four (its spend and tiers): which
  const ownKey = OPENINGS.find(k => OP[k] === ownC);
  if (!ownKey) { console.error(`audit-nesplit: ${id}: CAND's own opening (level ${lvC}, tiers ${acts[ownC].tierPen},${acts[ownC].tierIsa}) is not one of the four`); process.exit(2); }
  console.log(`${''.padEnd(16)} openings ${L}: ${OPENINGS.map(k => `${k} ai ${OP[k]} level ${cand.levelOf[OP[k]]} tiers ${acts[OP[k]].tierPen},${acts[OP[k]].tierIsa}`).join('; ')}; CAND's own ${ownKey}`);

  // the parts of one move in one table (scoreMoves with the estate and resilience weights set aside, then restored)
  const NA = Math.max(n, ship.actions.length);
  const SC = new Float64Array(NA), TX = new Float64Array(NA), BQ = new Float64Array(NA), SV = new Float64Array(NA);
  const CHK = { partsSum: 0, partsSumBad: 0, swapIdentity: 0, swapIdentityBad: 0 };
  const scoreOne = (tab, ai) => { scoreMoves(tab, s0, 0, SC, TX, BQ, H0(), { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[0][ai] }, SV); return { sc: SC[ai], sv: SV[ai], bq: BQ[ai] }; };
  const partsOne = (tab, ai) => {
    const wB = tab.wB, wR = tab.wR, full = scoreOne(tab, ai);
    if (full.sc === -Infinity) return { feasible: false, sc: -Infinity, sv: 0, bq: 0, rs: 0, h: 0 };
    let z, one;
    try { tab.wB = 0; tab.wR = 0; z = scoreOne(tab, ai); tab.wR = 1; one = scoreOne(tab, ai); } finally { tab.wB = wB; tab.wR = wR; }
    const p = { feasible: true, sc: full.sc, sv: full.sv, bq: full.bq, h: full.sv - z.sc, rs: one.sc - z.sc, wB, wR };
    if (PLANT === 'partsum' && ai === OP.CC) p.bq += 1e-6;   // bq carries wB (0.02 or 0.01); rs carries wR, 0 in both arms, so a plant there could not show
    CHK.partsSum++;
    const rebuilt = p.sv + wR * p.rs + wB * p.bq - p.h;
    if (!(Math.abs(rebuilt - p.sc) <= 1e-12 * Math.max(1, Math.abs(p.sc)))) CHK.partsSumBad++;
    return p;
  };
  const sc = cand.switchCharge || 0;
  const mixParts = (r, ai, swapTo = null) => {
    const keep = r.tsLayerOf ? r.tsLayerOf[ai] : null;
    if (swapTo !== null) r.tsLayerOf[ai] = swapTo;   // shared by every world table (solve.js: tsLayerOf is one array)
    try {
      const per = r.mix.tables.map(tab => partsOne(tab, ai));
      const wts = r.mix.weights;
      const feasible = per.every(p => p.feasible);
      const S = k => per.reduce((t, p, j) => t + wts[j] * p[k], 0);
      const charge = (r.switchCharge || 0) > 0 && (r.c.acts[ai].tierPen !== 0 || r.c.acts[ai].tierIsa !== 0) ? r.switchCharge : 0;
      return { feasible, per, sv: S('sv'), bq: S('bq'), rs: S('rs'), h: S('h'), score: feasible ? S('sc') : -Infinity, charge, chooser: feasible ? S('sc') - charge : -Infinity, wB: per[0].wB, wR: per[0].wR };
    } finally { if (swapTo !== null) r.tsLayerOf[ai] = keep; }
  };
  const P = {}, PSW = {};
  for (const k of OPENINGS) P[k] = mixParts(cand, OP[k]);
  // the swap: each 2/2 opening read through the plan's tiers' layer at the same level (the layer of its 0/0 partner)
  const partner = { SC: 'SS', CC: 'CS', SS: 'SS', CS: 'CS' };
  for (const k of OPENINGS) {
    const to = cand.tsLayerOf[OP[partner[k]]];
    PSW[k] = mixParts(cand, OP[k], to);
    if (partner[k] === k) { CHK.swapIdentity++; if (!(PSW[k].score === P[k].score)) CHK.swapIdentityBad++; }
  }
  const top = OPENINGS.reduce((b, k) => (P[k].chooser > P[b].chooser ? k : b), OPENINGS[0]);
  const chooserTop = P[ownKey].chooser >= P[top].chooser - (cand.eps || 0);
  const pr = x => `sv ${f6(100 * x.sv)} bq ${f6(x.bq)} rs ${f6(x.rs)} h ${f6(x.h)} wB ${x.wB} wR ${x.wR} score ${f6(x.score)} charge ${x.charge} chooser ${f6(x.chooser)}`;
  for (const k of OPENINGS) {
    console.log(`${''.padEnd(16)} parts ${L} ${k}: ${pr(P[k])}`);
    console.log(`${''.padEnd(16)} swap ${L} ${k}: ${pr(PSW[k])}`);
    console.log(`${''.padEnd(16)} worldparts ${L} ${k}: ${P[k].per.map((p, j) => `w${j} sv ${f6(100 * p.sv)} sc ${f6(p.sc)}`).join('; ')}`);
  }
  // SHIP's tables: the survival part of the same openings, where SHIP's menu has them (reported)
  const findS = (lv, tp) => { for (let ai = 0; ai < ship.actions.length; ai++) if (Math.abs(ship.levelOf[ai] - lv) < 1e-12 && ship.c.acts[ai].tierPen === tp && ship.c.acts[ai].tierIsa === tp && (ship.c.acts[ai].tierGia || 0) === 0) return ai; return -1; };
  console.log(`${''.padEnd(16)} shipparts ${L}: ${OPENINGS.map(k => { const ai = findS(cand.levelOf[OP[k]], acts[OP[k]].tierPen); if (ai < 0) return `${k} none`; const x = mixParts(ship, ai); return `${k} sv ${f6(100 * x.sv)} score ${f6(x.score)}`; }).join('; ')}`);
  const rd = cand.meta.reader;
  if (rd) console.log(`${''.padEnd(16)} reader ${L}: ${['unsupported', 'copied', 'copiedTop', 'nodes'].map(k => `${k} ${Array.isArray(rd[k]) || ArrayBuffer.isView(rd[k]) ? [...rd[k]].slice(0, 3).join(',') : rd[k]}`).join(' ')}`);
  console.log(`${''.padEnd(16)} checks ${L}: partsSum ${CHK.partsSum - CHK.partsSumBad}/${CHK.partsSum} swapIdentity ${CHK.swapIdentity - CHK.swapIdentityBad}/${CHK.swapIdentity} chooserTop ${chooserTop ? 1 : 0}/1`);
  if (CHK.partsSumBad || !CHK.partsSum || CHK.swapIdentityBad || !CHK.swapIdentity || !chooserTop) { console.error(`audit-nesplit: ${id} ${L}: a self-check failed or ran on nothing`); process.exit(3); }

  // forward: each opening forced in year 0 with CAND's moves after it, and both arms unforced, on the same paths
  const f0 = Date.now(), paths = E.pathsForSeed(SEED, NP, T);
  const kindOf = o => (o.survived ? 0 : ('action' in o ? 1 : 2));   // 1: a year with no money; 2: the plan's end below its minimum pot
  const RUNS = [...OPENINGS.map(k => [k, zs => runPolicy(cand, zs, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && k === ownKey ? OP[{ SS: 'SC', SC: 'SS', CS: 'CC', CC: 'CS' }[ownKey]] : OP[k] } })]),
    ['CANDOWN', zs => runPolicy(cand, zs)], ['SHIPOWN', zs => runPolicy(ship, zs)]];
  const bits = {}, kinds = {}, prints = {};
  for (const [k, run] of RUNS) {
    const b = new Uint8Array(NP), kd = new Uint8Array(NP), fp = new Float64Array(NP);
    // fp: each path's fingerprint for forceIdentity - its end wealth if it survived, else minus its fail year
    paths.forEach((zs, i) => { const o = run(zs); b[i] = o.survived ? 1 : 0; kd[i] = kindOf(o); fp[i] = o.survived ? o.terminal : -o.failYear; });
    bits[k] = b; kinds[k] = kd; prints[k] = fp;
    const ok = b.reduce((t, x) => t + x, 0), early = kd.reduce((t, x) => t + (x === 1), 0), endBelow = kd.reduce((t, x) => t + (x === 2), 0);
    console.log(`${''.padEnd(16)} sim ${L} ${k}: survived ${ok} of ${NP} ran-out ${early} end-below-minpot ${endBelow} bits ${sha16(b)}`);
  }
  let same = 0; for (let i = 0; i < NP; i++) if (bits[ownKey][i] === bits.CANDOWN[i] && kinds[ownKey][i] === kinds.CANDOWN[i] && prints[ownKey][i] === prints.CANDOWN[i]) same++;
  console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${NP} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (same !== NP) { console.error(`audit-nesplit: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
  // per world: the world's long-run shift fixed (NS-CAND's paths), each opening forced
  const K = cand.mix.nodes.length, wpaths = E.pathsForSeed(SEED, NPW, T);   // the seed's first NPW paths, each world's long-run shift put in
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k];
    const line = OPENINGS.map(o => { let ok = 0; wpaths.forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = z; ok += runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: OP[o] } }).survived ? 1 : 0; }); return `${o} table ${f6(100 * P[o].per[k].sv)} sim ${ok}/${NPW}`; }).join('; ');
    console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: ${line}`);
  }
  writeFileSync(join(OUT, fileOf(id, w)), gzipSync(JSON.stringify({ id, unit: L, stamp: STAMP, N: NP, seed: SEED, own: ownKey,
    bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])), kinds: Object.fromEntries(Object.entries(kinds).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOf(id, w)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
