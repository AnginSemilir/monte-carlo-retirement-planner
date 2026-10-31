/*
 * 7AQ: P AT HALF THE STEP, WITH A SIGNED GAP (PLAN.md 7aq; predictions/diag-7aq.md; the deep review after 7am,
 * deep-review-log.md 1 Oct 02:00 UK, its decisive next step for O67). P - READER/TS+J with switchCharge 0.001 and
 * switchMargin 0 - under half of 7ai's symmetric tier shift each way (7am's 'halfblend' and 'halfreversed') on 7am's seven
 * households, and P's full-step units (the blend medians and the shift reversed) re-solved on the three 7am could not split
 * (share 0.50, share 0.90, bridge 0: a gap clipped at 0, O74). Every unit prints the signed year-0 gap (signed-gap.mjs: the
 * best move leaving the held tiers less the best keeping them, the charge paid; 0 or below where the held pair wins at
 * margin 0), cross-checked against the bisected gap on the unit itself.
 * The tier override, the households and the solve are 7am's audit's, copied (a separate script, so 7am's stays byte for
 * byte as it ran); the reducer holds each re-solved full-step unit to 7am's record (table, ran line, the bisected gap and
 * the opening) and each half-step unit's ran line to P's record but for the tier returns.
 * Linear base only (the maintainer, 1 Oct 06:45 UK): the halves are linear plus or minus half of blend less linear.
 * Prints per unit 7am's lines (case, solve, ran, gap, opening2, joint, tiers, done) and a signed line.
 *   node research/solver/audit-7aq.mjs [points=30] [paths=8000] part k/n [seed=7002]
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
import { signedGap, bisectedGap, crossCheck } from './signed-gap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 8000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-7aq: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7aq: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-7aq: bad seed ${process.argv[6]}`); process.exit(2); }
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
  if (!m) { console.error(`audit-7aq: results-o60.txt has no row for ${k}`); process.exit(2); }
  o60[k] = { linear: +m[1], blend: +m[2] };
}
export const realOf = (k, set) => (set === 'logblend' ? o60[k].blend : set === 'reversed' ? +(2 * o60[k].linear - o60[k].blend).toFixed(2) : set === 'halfblend' ? o60[k].linear + (o60[k].blend - o60[k].linear) / 2 : set === 'halfreversed' ? o60[k].linear - (o60[k].blend - o60[k].linear) / 2 : o60[k].linear);
const withTiers = (plan, set) => {
  const base = E.normalizePlan(plan);
  if (set === 'linear') return plan;
  const rp = {};
  for (const [k, p] of Object.entries(base.riskProfiles)) rp[k] = TIERS.includes(k) ? { ...p, real: realOf(k, set) } : { ...p };
  return { ...plan, riskProfiles: rp, riskSource: '' };
};
// before any solve: the linear profiles are O60's linear column, the override its blend column, and nothing else differs
for (const id of HOUSEHOLDS) {
  const h = byId(id);
  if (!h) { console.error(`audit-7aq: no household ${id}`); process.exit(2); }
  const lin = E.normalizePlan(h.plan).riskProfiles;
  const bad = [];
  for (const k of TIERS) {
    // the engine rounds the real from the import's rounded nominal (applyCmaPreset), look-o60.mjs from the unrounded blend,
    // so the two may differ by one rounding step (Low Risk: 2.60 against 2.59, the build check of 29 Sep)
    if (Math.abs(lin[k].real - o60[k].linear) > 0.01 + 1e-9) bad.push(`${k} linear ${lin[k].real} is not O60's ${o60[k].linear} to 0.01`);
  }
  for (const set of ['logblend', 'reversed', 'halfblend', 'halfreversed']) {
    const bl = E.normalizePlan(withTiers(h.plan, set)).riskProfiles;
    for (const k of TIERS) if (Math.abs(bl[k].real - realOf(k, set)) > 1e-9) bad.push(`${k} ${set} ${bl[k].real} is not ${realOf(k, set)}`);
    for (const k of Object.keys(lin)) for (const f of new Set([...Object.keys(lin[k]), ...Object.keys(bl[k] || {})])) if (!(TIERS.includes(k) && f === 'real') && JSON.stringify(lin[k][f]) !== JSON.stringify((bl[k] || {})[f])) bad.push(`${set}: ${k}.${f} differs (${lin[k][f]} against ${(bl[k] || {})[f]})`);
  }
  if (bad.length) { console.error(`audit-7aq: ${id}'s tier override is not O60's: ${bad.join('; ')}`); process.exit(2); }
}

// P (READER/TS+J/MP/30x5, switchCharge 0.001, switchMargin 0) at the full shift each way on the three 7am could not split
// (re-solves of 7am's units, held to its records), then at half the shift each way on the seven
export const UNSPLIT = ['share 0.50', 'share 0.90', 'bridge 0'];
export const TAG = 'TS+J/MP/30x5';
export const labelOf = (tag, set) => `${tag}/W${W}${set === 'linear' ? '' : '@' + set}`;
export const UNITS = [...UNSPLIT.flatMap(id => ['logblend', 'reversed'].map(set => [id, 'READER', TAG, set])), ...HOUSEHOLDS.flatMap(id => ['halfblend', 'halfreversed'].map(set => [id, 'READER', TAG, set]))];
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
console.log(`7AQ, P AT HALF THE STEP: P (READER/TS+J, switchCharge 0.001, switchMargin 0) with the tier returns moved the full way to the medians of their blends (results-o60.txt) and the other way on the three 7am left unsplit, and half of each way on seven households, the estate weight ${W}, ${POINTS} points, solves only (the opening on path 0 of seed ${SEED}), every unit's year-0 gap signed; ${UNITS.length} units; part ${pk}/${pn}`);

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
  return { s0, h0, gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(','), open2: [0.001, 0].map(sm => `${at(sm).tierPen},${at(sm).tierIsa}`).join(' ') };
};

UNITS.forEach(([id, A, tag, set], i) => {
  if (i % pn !== pk) return;
  const h = byId(id), label = labelOf(tag, set), TSJ = tag.startsWith('TS+J'), MP = tag.includes('/MP/');
  console.log(`${id.padEnd(16)} case | unit ${A}/${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  // measureV2's plan and solve (audit-s126.mjs), forward: false
  const src = withTiers(h.plan, set);
  const plan = E.resolveMpaa(E.normalizePlan({ ...src, config: { ...src.config, guardrails: false, lookaheadYears: 0 }, spending: { ...src.spending, floorSpend: Math.round(0.8 * E.num(src.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: A === 'READER' ? 'reader' : false, bequestWeight: W, ...(TSJ ? { tierState: true, jointWorlds: true } : {}), ...(MP ? { switchMargin: 0, switchCharge: 0.001 } : {}) });
  const m = r.m, s0 = M.initialState(m);
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  const secs = (Date.now() - t0) / 1000;
  if (MP && !(r.switchMargin === 0 && r.switchCharge === 0.001)) { console.error(`audit-7aq: ${label} ran switchMargin ${r.switchMargin} switchCharge ${r.switchCharge}`); process.exit(2); }
  if (TSJ !== !!r.meta.tierState || TSJ !== !!r.meta.jointWorlds) { console.error(`audit-7aq: ${label} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7aq: ${label} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
  // the tier menu the solve built carries the reals of the set it was given
  const menu = ['pen', 'isa'].map(cat => `${cat} ${(r.c.tiers[cat] || []).map(x => `${String(x.name).replace(/ /g, '_')}:${(100 * x.real).toFixed(2)}`).join(',')}`).join(' ');
  const want = E.normalizePlan(src).riskProfiles;
  for (const cat of ['pen', 'isa']) for (const x of r.c.tiers[cat] || []) if (TIERS.includes(x.name) && Math.abs(100 * x.real - want[x.name].real) > 1e-9) { console.error(`audit-7aq: ${label}'s ${cat} menu carries ${x.name} at ${100 * x.real}`); process.exit(2); }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead}${MP ? ` switchMargin ${r.switchMargin} switchCharge ${r.switchCharge}` : ''}`;
  const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
  console.log(`${''.padEnd(16)} solve ${A}/${label}: table ${table.toFixed(4)} secs ${Math.round(secs)}`);
  console.log(`${''.padEnd(16)} ran ${A}/${label}: ${ran}`);
  {
    const zs = E.pathsForSeed(SEED, 1, m.ctx.totalYears)[0]; const g = openGap(r, zs);
    console.log(`${''.padEnd(16)} gap ${A}/${label}: ${g.gap} opening ${g.open}`); console.log(`${''.padEnd(16)} opening2 ${A}/${label}: ${g.open2}`);
    // the signed gap at the same position and held pair, held to the bisected one before it is printed
    const sg = signedGap(r, g.s0, 0, g.h0), bg = bisectedGap(r, g.s0, 0, g.h0), e = (bg === g.gap ? null : `the bisected gap ${bg} is not openGap's ${g.gap}`) || crossCheck(sg.gap, bg);
    if (e) { console.error(`audit-7aq: ${id} ${label}: ${e}`); process.exit(2); }
    console.log(`${''.padEnd(16)} signed ${A}/${label}: ${sg.gap.toExponential(6)} stay ${sg.stay.toFixed(9)} move ${sg.move.toFixed(9)}`);
  }
  console.log(`${''.padEnd(16)} joint ${A}/${label}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin}${MP ? ` switchCharge ${r.switchCharge}` : ''} scale ${Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${r.m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
  console.log(`${''.padEnd(16)} tiers ${A}/${label}: ${menu}`);
  console.log(`${''.padEnd(16)} done ${A}/${label}`);
});
