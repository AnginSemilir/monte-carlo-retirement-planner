/*
 * E3C: E3'S PANEL-WIDE EXACTNESS CHECK (PLAN.md E3c and the E3 paragraph; the decision of 30 Sep 09:49 UK: the gain half
 * becomes a research default once its identity check passes on every panel household, PRODUCT and TS+J with the reader; the
 * maintainer's go-ahead of 4 Oct, the 08:17 row). A MEASUREMENT (predictions/measure-e3c.md). On 7e's panel (25
 * households, DP's case construction), each solved twice at a small grid - e3 off and on - in three modes:
 *   SHIP:   the shipping default as DP and DPC run it (no reader, the estate weight 0.02);
 *   PRODUCT: solvePlan's defaults with the estate weight 0.02 (research/tests/solver-e3.test.mjs's PRODUCT);
 *   TSJ:    TS+J with the reader (tierState, jointWorlds, bridgeRead 'reader', the estate weight 0.02).
 * Each prints every table array (survival, estate, resilience, policy, shortfall; every world and tier-state layer)
 * compared bit for bit (Object.is), the cells e3 copied against the empty-pot cells of the non-zero gain buckets, and both
 * solve times. On S126 the planted copy from the wrong twin (e3PlantedWrongTwin) must break identity, or the check proves
 * nothing.
 *   node research/solver/audit-e3c.mjs [points=8] part k/n
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
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

const POINTS = Number(process.argv[2] || 8);
if (!(POINTS >= 4)) { console.error(`audit-e3c: bad grid size ${process.argv[2]}`); process.exit(2); }
const part = process.argv[3] === 'part' ? process.argv[4] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-e3c: bad part ${part}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;

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

const MODES = [['SHIP', { bridgeRead: false }], ['PRODUCT', {}], ['TSJ', { tierState: true, jointWorlds: true, bridgeRead: 'reader' }]];
if (process.argv[2] === '--units') { console.log(PANEL.length); process.exit(0); }
const arrays = r => { const out = []; const T = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (T.layW) for (const ls of T.layW) for (const L of ls) add(L); else for (let k = 0; k < T.survW.length; k++) add({ surv: T.survW[k], beq: T.beqW[k], resil: T.resilW[k], pol: T.polW[k], short: T.shortW[k] });
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return -1; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return -1; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);
console.log(`E3C, E3'S PANEL-WIDE EXACTNESS CHECK: ${PANEL.length} households, modes ${MODES.map(m => m[0]).join(', ')}, ${POINTS} points, e3 off against on; part ${pk}/${pn}`);
PANEL.forEach((id, i) => {
  if (i % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-e3c: no case ${id}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  console.log(`${id.padEnd(16)} case | points ${POINTS} | lambda ${LAMBDA} | estate weight ${W}`);
  for (const [mode, o] of MODES) {
    const base = { lambda: LAMBDA, points: POINTS, bequestWeight: W, ...o };
    const t0 = Date.now(), off = solvePlan(E, M, plan, base), t1 = Date.now(), on = solvePlan(E, M, plan, { ...base, e3: true }), t2 = Date.now();
    if (off.meta.e3 || !on.meta.e3) { console.error(`audit-e3c: ${id} ${mode}: e3 meta off ${!!off.meta.e3} on ${!!on.meta.e3}`); process.exit(2); }
    if (!!off.meta.tierState !== !!o.tierState || !!off.meta.jointWorlds !== !!o.jointWorlds || ('bridgeRead' in o && (off.meta.bridgeRead || false) !== o.bridgeRead)) { console.error(`audit-e3c: ${id} ${mode}: ran tierState ${off.meta.tierState} bridgeRead ${off.meta.bridgeRead}`); process.exit(2); }
    const A = arrays(off), B = arrays(on), g = on.g, want = (g.ni + g.nt - 1) * g.np * (g.gain.length - 1) * g.pcls.length * (on.m.ctx.totalYears + 1);
    console.log(`${''.padEnd(16)} e3c ${mode}: arrays ${A.length} values ${values(A)} differ ${differ(A, B)} copied ${on.meta.e3.copied} want ${want} secs off ${((t1 - t0) / 1000).toFixed(1)} on ${((t2 - t1) / 1000).toFixed(1)} tierState ${!!off.meta.tierState} bridgeRead ${off.meta.bridgeRead || false}`);
  }
  if (id === 'S126') {
    const base = { lambda: LAMBDA, points: POINTS, bequestWeight: W };
    const d = differ(arrays(solvePlan(E, M, plan, base)), arrays(solvePlan(E, M, plan, { ...base, e3: true, e3PlantedWrongTwin: true })));
    console.log(`${''.padEnd(16)} planted PRODUCT: the wrong twin differ ${d}`);
  }
  console.log(`${''.padEnd(16)} done`);
});
