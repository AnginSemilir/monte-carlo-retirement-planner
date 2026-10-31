/*
 * THE PRODUCT'S PART-YEAR FIRST YEAR (M1 of the fallback review of 12 Oct, escalations/12-Oct-opening-near-ties-report.md;
 * confirmed in the code there): the app values a plan from today (App.jsx:439, 1126), and fast.js grows year 0 by
 * real x yf (grow(), yr.frac[0] = ctx.yf), so year 0's return variance scales with yf squared; every research household
 * is valued on 1 January (yf 1, policy-study/scenarios.mjs:166). A MEASUREMENT for the deep review after NE-GRID C, not a
 * test: the shipping default exactly as 7u ran it (audit-7u.mjs's SHIP: solvePlan on candidatePlan's tiers, 30 points,
 * lambda 0.0223606797749979, the estate weight 0.02) on S194 and share 0.95, valued 1 January, 1 July and 1 October of
 * the library's base year. Per unit: yf, the solve's settings, the table's year-0 survival, the year-0 gap and opening
 * (7u's openGap, copied), and one hash of every table array for years 1 on, which for a retired household should not
 * move with the date (reported SAME or DIFFERENT against the 1 January unit, never read as a failure).
 *   Identity gate: each 1 January unit reproduces 7u's printed SHIP line at 0.02 (results-7u.txt l.104 and l.126) to the
 *   digits printed, or the run refuses (exit 3).
 *   Planted: the hash comparison must read DIFFERENT with one bit of one year-1 array flipped, and must hash at least one
 *   array a table (a comparison over nothing is an error, checklist item 6).
 *   node research/solver/measure-partyear.mjs > research/solver/results-partyear.txt
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { candidatePlan } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const POINTS = 30, LAMBDA = 0.0223606797749979, W = 0.02;
// 7u's printed SHIP lines at the estate weight 0.02 (results-7u.txt l.104, l.126)
const REF = { 'share 0.95': { table: '0.0140', gap: '1.6693e-5', open: '0,1' }, S194: { table: '99.4341', gap: '5.4317e-4', open: '0,2' } };

// the households: audit-7u.mjs's builders (variant() copied, for share 0.95), and the library's singles
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
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
const byId = id => (id === 'share 0.95' ? variant(id, { a0: 0.95 }) : all.find(s => s.id === id));

// the year-0 gap and opening (audit-7u.mjs's, copied)
const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
const openGap = (r, zs) => {
  let s0 = null, h0 = null;
  runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
  const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
  const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
  let gap;
  if (stays(0)) gap = '0';
  else if (!stays(1)) gap = '>1';
  else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
  return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
};
// every table's per-year arrays for years 1 on, hashed in a fixed order
const KEYS = ['surv', 'lsurv', 'resil', 'lresil', 'beq', 'short', 'pol'];
function laterHash(r, flip = false) {
  const h = createHash('sha256'); let n = 0, flipped = false;
  for (const tab of (r.mix ? r.mix.tables : [r])) for (const key of KEYS) {
    const arr = tab[key];
    if (!Array.isArray(arr)) continue;
    for (let t = 1; t < arr.length; t++) {
      const x = arr[t];
      if (!ArrayBuffer.isView(x)) continue;
      let buf = Buffer.from(x.buffer, x.byteOffset, x.byteLength);
      if (flip && !flipped && t === 1 && buf.length) { buf = Buffer.from(buf); buf[0] ^= 1; flipped = true; }
      h.update(buf); n++;
    }
  }
  return { sha: h.digest('hex').slice(0, 16), n };
}

const base = all[0].plan.config.valuationDate.slice(0, 4);
const DATES = [`${base}-01-01`, `${base}-07-01`, `${base}-10-01`];
console.log(`PART-YEAR: the shipping default (7u's SHIP, ${POINTS} points, lambda ${LAMBDA}, the estate weight ${W}) valued on ${DATES.join(', ')}`);
let planted = null;
for (const id of ['S194', 'share 0.95']) {
  const h = byId(id);
  if (!h) { console.error(`measure-partyear: no case ${id}`); process.exit(2); }
  let ref = null;
  for (const date of DATES) {
    const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, valuationDate: date, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
    const t0 = Date.now();
    const r = solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: POINTS, bequestWeight: W });
    const secs = Math.round((Date.now() - t0) / 1000);
    const ship = !r.meta.bridgeRead && !r.meta.tierState && !r.meta.jointWorlds && r.switchMargin === 0.001 && !(r.switchCharge > 0) && !r.meta.e3 && !r.meta.e3pcls && Math.abs(r.meta.bequestWeight - W) < 1e-12;
    if (!ship) { console.error(`measure-partyear: ${id} ${date}: the solve did not run the shipping default's settings`); process.exit(2); }
    const m = r.m, s0 = M.initialState(m);
    const table = (100 * r.worlds.reduce((t, wd, k) => t + r.mix.weights[k] * wd.value(s0, 0).survival, 0)).toFixed(4);
    const g = openGap(r, E.pathsForSeed(7002, 1, m.ctx.totalYears)[0]);
    const lh = laterHash(r);
    if (!(lh.n > 0)) { console.error(`measure-partyear: ${id} ${date}: no table array hashed`); process.exit(2); }
    if (!ref) {
      ref = lh;
      const want = REF[id];
      if (table !== want.table || g.gap !== want.gap || g.open !== want.open) { console.error(`measure-partyear: ${id} on 1 January does not reproduce 7u (table ${table} gap ${g.gap} opening ${g.open}; 7u ${want.table} ${want.gap} ${want.open})`); process.exit(3); }
      if (!planted) { const p = laterHash(r, true); planted = p.sha !== lh.sha ? 'DIFFERENT (as it must)' : 'SAME - THE COMPARISON CANNOT SEE A CHANGE'; if (p.sha === lh.sha) { console.log(`planted: a flipped bit in a year-1 array reads ${planted}`); process.exit(3); } }
    }
    console.log(`${id.padEnd(12)} ${date}: yf ${m.ctx.yf.toFixed(4)} table ${table} gap ${g.gap} opening ${g.open} years-1-on ${lh.sha} (${lh.n} arrays) ${lh.sha === ref.sha ? 'SAME' : 'DIFFERENT'} as 1 January; secs ${secs}`);
  }
}
console.log(`planted: a flipped bit in a year-1 array reads ${planted}`);
console.log('identity: both 1 January units reproduce 7u\'s printed SHIP lines (table, gap, opening)');
