/*
 * E3-PCLS-C: THE PANEL IDENTITY CHECK FOR E3'S LUMP-SUM HALF (solve.js `e3pcls`; PLAN.md E3-PCLS; the maintainer, 6 Oct: 'Do
 * the lump sum work before phase 4 anyway'; designed by the deep review of 7 Oct 00:01 UK). A MEASUREMENT
 * (predictions/measure-e3pclsc.md). Each household solved under the research candidate (solveCandidate, e3 on) at 30 points
 * with e3pcls off (OFF) and on (ON), one household for each way the last pension inflow year (lastPenIn) is set:
 *   none     - S124 and S360 (nothing can refill the pension: copies from year 0)
 *   work     - S180 (works to 60)
 *   deposit  - S194 (it works to year 4, then a deposit in year 7 sets it), S126, share 0.95 (where Q's step acts), S130 (where the interpolated axis acts) and bridge 6 (the longest
 *              reader bridge of the S126 family)
 *   transfer - S126 with a further GBP 20,000 pension deposit six years in, which the allowance stages into later years
 * Compared, OFF against ON: every table array bit for bit (Object.is; every world and tier-state layer), the reader's
 * counters, the solve's metadata but for e3pcls itself, the moves evaluated and the time, and a forward run on the same
 * 2,000 paths of seed 7002 (survival, spend level, tier and wealth, path by path); printed: lastPenIn, the clause that set
 * it, the cells copied and the moves evaluated each way.
 * PLANTED, at 8 points, each of which must break identity: copying from the last inflow year itself (the boundary) on S180,
 * S126 and the staged deposit; each clause dropped alone where it alone sets lastPenIn (work on S180, deposit on S126,
 * transfer on the staged deposit); and e3's wrong-twin copy with e3pcls on (share 0.95).
 * E2 (the last unit, 'S180 split'): S180's ON solve at 30 points split four ways and two ways (E2, research/solver/e2.mjs),
 * each against the unsplit, every table bit for bit.
 *   node research/solver/audit-e3pclsc.mjs [points=30] part k/n
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
// imported here as well as by candidate.mjs, so the research defaults are in the run's stamp by name too
import { RESEARCH_OPTS } from './research-opts.mjs';
import { solveSplit } from './e2.mjs';
import { candidatePlan } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

// [household, the clause expected to set lastPenIn, the plants run on it]
export const PANEL = [['S124', 'none', []], ['S360', 'none', []], ['S180', 'work', ['boundary', 'work']], ['S194', 'deposit', []],
  ['S126', 'deposit', ['boundary', 'deposit']], ['share 0.95', 'deposit', ['wrongtwin']], ['S130', 'deposit', []], ['bridge 6', 'deposit', []],
  ['S126+transfer', 'transfer', ['boundary', 'transfer']]];
export const UNITS = [...PANEL.map(([id]) => id), 'S180 split'];
export const PLANT_PTS = 8, NP = 2000, SEED = 7002;
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const POINTS = Number(process.argv[2] || 30);
if (!(POINTS >= 4)) { console.error(`audit-e3pclsc: bad grid size ${process.argv[2]}`); process.exit(2); }
const part = process.argv[3] === 'part' ? process.argv[4] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-e3pclsc: bad part ${part}`); process.exit(2); }
const LAMBDA = 0.0223606797749979;
if (!Object.entries(RESEARCH_OPTS).every(([k, v]) => CANDIDATE_OPTS[k] === v) || CANDIDATE_OPTS.e3 !== true) { console.error('audit-e3pclsc: the candidate does not carry RESEARCH_OPTS with e3 on'); process.exit(2); }

// the households: audit-s126.mjs's variant() for share 0.95 and bridge 6, the library's singles, and the staged deposit
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
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
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return p;
}
function planOf(id) {
  let p;
  if (id === 'share 0.95') p = variant(id, { a0: 0.95 });
  else if (id === 'bridge 6') p = variant(id, { bridge: 6 });
  else if (id === 'S126+transfer') {
    p = JSON.parse(JSON.stringify(s126.plan));
    const y = E.buildContext(E.normalizePlan(p)).baseYear + 6;
    p.oneOffContributions = [...(p.oneOffContributions || []), { id: 'e3pclsc-dep', date: `${y}-06-01`, year: y, owner: 'Myself', category: 'Pensions', amount: 20000 }];
  } else { const s = all.find(x => x.id === id); if (!s) return null; p = JSON.parse(JSON.stringify(s.plan)); }
  return E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
}
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return -1; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return -1; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);
// the metadata compared: all but e3pcls itself, the moves evaluated and the time
const metaOf = r => { const { e3pcls, evaluated, ms, ...rest } = r.meta; return JSON.stringify(rest); };
const fwd = r => { const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T); const out = [];
  paths.forEach(zs => { const o = runPolicy(r, zs, {}); out.push(o.survived ? 1 : 0, o.spendYears || 0, o.atTarget || 0, o.tierPenYears || 0, o.tierChanges || 0, Math.round(o.terminalNet || 0)); });
  return out; };
const fwdDiffer = (a, b) => { let d = 0; for (let i = 0; i < a.length; i += 6) { for (let j = 0; j < 6; j++) if (!Object.is(a[i + j], b[i + j])) { d++; break; } } return d; };
const ran = r => `bridgeRead ${r.meta.bridgeRead} tierState ${!!r.meta.tierState} jointWorlds ${!!r.meta.jointWorlds} bridgeStep ${r.meta.bridgeStep} switchCharge ${r.switchCharge || 0} pclsInterp ${!!r.g.pclsInterp} e3 ${!!r.meta.e3} e3pcls ${!!r.meta.e3pcls} points ${String(r.meta.points).replace(/ /g, '')}`;
const P = ''.padEnd(16);

console.log(`E3-PCLS-C: THE LUMP-SUM HALF'S PANEL IDENTITY CHECK: ${UNITS.join(', ')}; ${POINTS} points, the candidate with e3; OFF (e3pcls off) and ON; ${NP} forward paths of seed ${SEED}; plants at ${PLANT_PTS} points; part ${pk}/${pn}`);
for (const [i, id] of UNITS.entries()) {
  if (i % pn !== pk) continue;
  const base = { lambda: LAMBDA, points: POINTS };
  if (id === 'S180 split') {
    const plan = planOf('S180');
    console.log(`${id.padEnd(16)} case | points ${POINTS} | lambda ${LAMBDA}`);
    const one = solveCandidate(E, M, plan, { ...base, e3pcls: true }), A = arrays(one);
    for (const parts of [4, 2]) {
      const s = await solveSplit(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, ...base, e3pcls: true }, parts);
      console.log(`${P} split ${parts}: differ ${differ(A, arrays(s))} values ${values(A)} copied ${one.meta.e3pcls.copied} ${s.meta.e3pcls ? s.meta.e3pcls.copied : -1} evaluated ${one.meta.evaluated} ${s.meta.evaluated} parts ${s.meta.e2 ? s.meta.e2.parts : 1}`);
    }
    console.log(`${P} done`);
    continue;
  }
  const [, setBy, plants] = PANEL.find(x => x[0] === id), plan = planOf(id);
  if (!plan) { console.error(`audit-e3pclsc: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | points ${POINTS} | lambda ${LAMBDA}`);
  let t0 = Date.now(); const off = solveCandidate(E, M, plan, base); console.log(`${P} time OFF: secs ${((Date.now() - t0) / 1000).toFixed(1)}`);
  t0 = Date.now(); const on = solveCandidate(E, M, plan, { ...base, e3pcls: true }); console.log(`${P} time ON: secs ${((Date.now() - t0) / 1000).toFixed(1)}`);
  console.log(`${P} ran OFF: ${ran(off)}`);
  console.log(`${P} ran ON: ${ran(on)}`);
  const A = arrays(off), B = arrays(on), x = on.meta.e3pcls;
  console.log(`${P} e3pclsc: arrays ${A.length} values ${values(A)} differ ${differ(A, B)} evaluated ${off.meta.evaluated} ${on.meta.evaluated} copied ${x.copied} lastPenIn ${x.lastPenIn} setBy ${x.setBy} expected ${setBy}`);
  console.log(`${P} meta: same ${metaOf(off) === metaOf(on)} reader ${JSON.stringify(off.meta.reader || null) === JSON.stringify(on.meta.reader || null)}`);
  console.log(`${P} forward: paths ${NP} differ ${fwdDiffer(fwd(off), fwd(on))}`);
  for (const pl of plants) {
    const pb = { lambda: LAMBDA, points: PLANT_PTS };
    const ref = arrays(solveCandidate(E, M, plan, pb));
    const bad = solveCandidate(E, M, plan, pl === 'wrongtwin' ? { ...pb, e3pcls: true, e3PlantedWrongTwin: true } : { ...pb, e3pcls: true, e3pclsPlant: pl });
    console.log(`${P} planted ${pl}: at ${PLANT_PTS} points differ ${differ(ref, arrays(bad))}`);
  }
  console.log(`${P} done`);
}
