/*
 * 7AI: O60'S OPENINGS CHECK (PLAN.md 7ai; predictions/diag-7ai.md; the deep review of 29 Sep 21:08 UK, its single most
 * decisive check; O60). Do the knife-edge year-0 openings move when each tier's return is the median of its blend
 * (look-o60.mjs, results-o60.txt) in place of the import's linear figure?
 * A separate script, not an audit-s126.mjs mode, so 7ah's audit script stays byte for byte the one it registered. The solve
 * is audit-s126.mjs diag7af's own (measureV2 with forward: false, the same plan and options), copied here; the reducer holds
 * every linear solve to 7af's and 7ag's records (table, ran line, gap and opening), which catches any drift in the copy.
 * The units: seven households whose bundle openings sit near the switch margin (7af: share 0.50, share 0.90, bridge 0,
 * bridge 1, S126, S194; 7ag: S162), each under
 *   CAND - the bridge reader with the joint tier state (READER/TS+J/W0.02), and
 *   SHIP - the shipping default (OFF/PRODUCT/W0.02),
 * each with the tiers as the import makes them (label as 7af's) and as the medians of their blends (label + '@logblend'):
 * 28 solves, no forward run (the opening is read on path 0 of seed 7002, as 7af's gap line reads it).
 * THE TIER OVERRIDE: the plan's own normalised risk profiles with each of the five blended tiers' `real` replaced by its
 * blend median, rounded to 0.01 as the import rounds (engine.mjs applyCmaPreset), and riskSource '' so normalizePlan keeps
 * them; every other field (volatility, sigmaParam, the cash tier) untouched. Checked before any solve, or it stops: the
 * linear profiles' reals are results-o60.txt's "linear" column to 0.01 (one rounding step: the engine rounds the real from
 * the import's rounded nominal), the override's are its "blend median" column exactly, and the
 * override differs from the linear profiles in the five reals alone. Checked after each solve: the solve's tier menu
 * (r.c.tiers) carries the reals of the tier set it was given; printed on a tiers line.
 * Prints per unit 7aa's lines (reduce-7aa.mjs parse): a case line, solve, ran, gap and joint; then a tiers line and done.
 *   node research/solver/audit-7ai.mjs [points=30] [paths=8000] part k/n [seed=7002]
 * Units in the order CAND then SHIP (the longest first), linear before blend; part k/n runs the units with i % n === k.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 8000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-7ai: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7ai: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-7ai: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02;

// the households: audit-s126.mjs's S126 variants (its variant(), copied) and the library's single households
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
export const HOUSEHOLDS = ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126', 'S194', 'S162'];
const VARIANTS = { 'share 0.50': { a0: 0.5 }, 'share 0.90': { a0: 0.9 }, 'bridge 0': { bridge: 0 }, 'bridge 1': { bridge: 1 } };
const byId = id => (VARIANTS[id] ? variant(id, VARIANTS[id]) : all.find(s => s.id === id));

// the tier sets: the import's linear figures and the blend medians, both from results-o60.txt (look-o60.mjs's output)
const O60 = readFileSync(join(HERE, 'results-o60.txt'), 'utf8');
export const TIERS = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk'];
const o60 = {};
for (const k of TIERS) {
  const m = new RegExp(`^  ${k.replace(/\//g, '\\/')}\\s+\\S+\\s+(\\S+)%\\s+(\\S+)%`, 'm').exec(O60);
  if (!m) { console.error(`audit-7ai: results-o60.txt has no row for ${k}`); process.exit(2); }
  o60[k] = { linear: +m[1], blend: +m[2] };
}
const withTiers = (plan, set) => {
  const base = E.normalizePlan(plan);
  if (set === 'linear') return plan;
  const rp = {};
  for (const [k, p] of Object.entries(base.riskProfiles)) rp[k] = TIERS.includes(k) ? { ...p, real: o60[k].blend } : { ...p };
  return { ...plan, riskProfiles: rp, riskSource: '' };
};
// before any solve: the linear profiles are O60's linear column, the override its blend column, and nothing else differs
for (const id of HOUSEHOLDS) {
  const h = byId(id);
  if (!h) { console.error(`audit-7ai: no household ${id}`); process.exit(2); }
  const lin = E.normalizePlan(h.plan).riskProfiles, bl = E.normalizePlan(withTiers(h.plan, 'logblend')).riskProfiles;
  const bad = [];
  for (const k of TIERS) {
    // the engine rounds the real from the import's rounded nominal (applyCmaPreset), look-o60.mjs from the unrounded blend,
    // so the two may differ by one rounding step (Low Risk: 2.60 against 2.59, the build check of 29 Sep)
    if (Math.abs(lin[k].real - o60[k].linear) > 0.01 + 1e-9) bad.push(`${k} linear ${lin[k].real} is not O60's ${o60[k].linear} to 0.01`);
    if (Math.abs(bl[k].real - o60[k].blend) > 1e-9) bad.push(`${k} blend ${bl[k].real} is not O60's ${o60[k].blend}`);
  }
  for (const k of Object.keys(lin)) for (const f of new Set([...Object.keys(lin[k]), ...Object.keys(bl[k] || {})])) if (!(TIERS.includes(k) && f === 'real') && JSON.stringify(lin[k][f]) !== JSON.stringify((bl[k] || {})[f])) bad.push(`${k}.${f} differs (${lin[k][f]} against ${(bl[k] || {})[f]})`);
  if (bad.length) { console.error(`audit-7ai: ${id}'s tier override is not O60's: ${bad.join('; ')}`); process.exit(2); }
}

export const ARMS = [['READER', 'TS+J'], ['OFF', 'PRODUCT']];
export const SETS = ['linear', 'logblend'];
export const labelOf = (tag, set) => `${tag}/W${W}${set === 'linear' ? '' : '@' + set}`;
export const UNITS = ARMS.flatMap(([A, tag]) => HOUSEHOLDS.flatMap(id => SETS.map(set => [id, A, tag, set])));
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
console.log(`7AI, O60'S OPENINGS CHECK: the bundle (READER/TS+J) and the shipping default (OFF/PRODUCT) with the import's linear tier returns and with the medians of their blends (results-o60.txt), the product's settings (solvePlan) with the estate weight ${W}, ${POINTS} points, solves only (the opening on path 0 of seed ${SEED}); ${UNITS.length} units; part ${pk}/${pn}`);

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

UNITS.forEach(([id, A, tag, set], i) => {
  if (i % pn !== pk) return;
  const h = byId(id), label = labelOf(tag, set), TSJ = tag === 'TS+J';
  console.log(`${id.padEnd(16)} case | unit ${A}/${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  // measureV2's plan and solve (audit-s126.mjs), forward: false
  const src = withTiers(h.plan, set);
  const plan = E.resolveMpaa(E.normalizePlan({ ...src, config: { ...src.config, guardrails: false, lookaheadYears: 0 }, spending: { ...src.spending, floorSpend: Math.round(0.8 * E.num(src.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: A === 'READER' ? 'reader' : false, bequestWeight: W, ...(TSJ ? { tierState: true, jointWorlds: true } : {}) });
  const m = r.m, s0 = M.initialState(m);
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  const secs = (Date.now() - t0) / 1000;
  if (TSJ !== !!r.meta.tierState || TSJ !== !!r.meta.jointWorlds) { console.error(`audit-7ai: ${label} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7ai: ${label} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
  // the tier menu the solve built carries the reals of the set it was given
  const menu = ['pen', 'isa'].map(cat => `${cat} ${(r.c.tiers[cat] || []).map(x => `${String(x.name).replace(/ /g, '_')}:${(100 * x.real).toFixed(2)}`).join(',')}`).join(' ');
  const want = E.normalizePlan(src).riskProfiles;
  for (const cat of ['pen', 'isa']) for (const x of r.c.tiers[cat] || []) if (TIERS.includes(x.name) && Math.abs(100 * x.real - want[x.name].real) > 1e-9) { console.error(`audit-7ai: ${label}'s ${cat} menu carries ${x.name} at ${100 * x.real}`); process.exit(2); }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead}`;
  const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
  console.log(`${''.padEnd(16)} solve ${A}/${label}: table ${table.toFixed(4)} secs ${Math.round(secs)}`);
  console.log(`${''.padEnd(16)} ran ${A}/${label}: ${ran}`);
  { const zs = E.pathsForSeed(SEED, 1, m.ctx.totalYears)[0]; const g = openGap(r, zs); console.log(`${''.padEnd(16)} gap ${A}/${label}: ${g.gap} opening ${g.open}`); }
  console.log(`${''.padEnd(16)} joint ${A}/${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
  console.log(`${''.padEnd(16)} tiers ${A}/${label}: ${menu}`);
  console.log(`${''.padEnd(16)} done ${A}/${label}`);
});
