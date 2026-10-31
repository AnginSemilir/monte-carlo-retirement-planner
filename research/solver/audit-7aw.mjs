/*
 * 7AW: THE CANDIDATE AGAINST THE SHIPPING DEFAULT AT THE ESTATE WEIGHT 0.02 (PLAN.md 7aw; predictions/diag-7aw.md; the
 * maintainer, 7 Oct 13:22 UK: 'run the 0.02 leg first'). 7aj read the pair at 0.01 in the blend-median world; the adopted
 * whole-score rule reads two settings (the product's default estate weight 0.02 and its lowest reachable 0.01: the
 * maintainer, 29 Sep 09:08 UK), and the only records at 0.02 (7af, 7ag) are another bundle on the product's tiers (the deep
 * review of 7 Oct 11:42 UK). 7aj's design, copied, with the estate weight 0.02; before 7u registers, on the tuning seed.
 * The arms, per household, each at 30 points, lambda held, the estate weight 0.02:
 *   CAND - the research candidate as Phase 4 and 7u run it (candidate.mjs solveCandidate: CANDIDATE_OPTS and candidatePlan's
 *          tiers, O60's blend medians), with bequestWeight 0.02 on top;
 *   SHIP - the shipping default (solvePlan with the product's own settings: no bridge read, per-world tables, the stored
 *          switch margin, e3 off, the snapped allowance axis), on the SAME plan as CAND, O60's blend-median tiers: the tiers
 *          are the research world since the maintainer's decision of 30 Sep 18:50 UK (PLAN.md O60: 'the research switches to
 *          the blend medians ... before 7u; the product's tiers only after Phase 4'), and every arm of a test shares them,
 *          so the forward run's returns are the same in both arms and only the solver's settings differ.
 * The panel: 7e's 25 households, 7af's 16 in its order then 7ag's 9 (the households and their builders as audit-s126.mjs
 * diag7af's and diag7ag's, copied). Every unit runs forward on the same 8,000 paths of seed 7002, its trace kept.
 * Prints per unit 7aa's lines (reduce-7aa.mjs parse): a case line, solve, ran, gap, joint, run and done; no world lines.
 * Units in the order CAND then SHIP (the longest first); part k/n runs the units with index i % n === k.
 *   node research/solver/audit-7aw.mjs [points=30] [paths=8000] part k/n [seed=7002]
 *   node research/solver/audit-7aw.mjs --units      the unit count
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { solveCandidate, candidatePlan, CANDIDATE_OPTS, CANDIDATE_TIERS } from './candidate.mjs';
// imported here as well as by candidate.mjs, so the research defaults are in the run's stamp by name too
import { RESEARCH_OPTS } from './research-opts.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

export const PANEL = [['share 0.50', 2], ['share 0.70', 2], ['share 0.78', 2], ['share 0.90', 2], ['share 0.95', 2], ['bridge 0', 0], ['bridge 1', 1], ['bridge 6', 6],
  ['wealth x0.5', 2], ['wealth x2', 2], ['S120', 2], ['S122', 2], ['S126', 2], ['bridge 4', 4], ['S360', 8], ['S194', 0],
  ['S124', 2], ['S128', 2], ['S130', 2], ['S366', 8], ['S370', 8], ['bridge 4+cost', 4], ['S162', 2], ['S172', 2], ['S168', 2]];
export const W = 0.02;
export const ARMS = [['CAND', `CANDIDATE/W${W}`], ['SHIP', `PRODUCT/W${W}`]];
export const UNITS = ARMS.flatMap(([arm, l]) => PANEL.map(([id]) => [id, arm, l]));
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 8000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-7aw: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7aw: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-7aw: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979;
// e3 off: in the SHIP arm only - it is the shipping default's solve, whose e3 is off; CAND carries RESEARCH_OPTS through CANDIDATE_OPTS (checked below)
if (!Object.entries(RESEARCH_OPTS).every(([k, v]) => CANDIDATE_OPTS[k] === v)) { console.error('audit-7aw: the candidate does not carry RESEARCH_OPTS'); process.exit(2); }
const OUT = process.env.DIAG7AW_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7aw');
mkdirSync(OUT, { recursive: true });

// the households: audit-s126.mjs's variant() and F1_VARIANTS, copied (7af's and 7ag's builders), and the library's singles
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
const F1_VARIANTS = [['S126', {}], ['share 0.50', { a0: 0.5 }], ['share 0.70', { a0: 0.7 }], ['share 0.78', { a0: 0.78 }], ['share 0.90', { a0: 0.9 }], ['share 0.95', { a0: 0.95 }],
  ['bridge 0', { bridge: 0 }], ['bridge 1', { bridge: 1 }], ['bridge 4', { bridge: 4 }], ['bridge 6', { bridge: 6 }], ['wealth x0.5', { scale: 0.5 }], ['wealth x2', { scale: 2 }]];
const known = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]), ['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];
const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1]() : all.find(s => s.id === id); };

const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
// the year-0 gap and opening (audit-s126.mjs diag7af's openGap, copied): the switch margin above which the opening holds the plan's tiers
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

console.log(`7AW: the research candidate (solveCandidate) against the shipping default (solvePlan, the product's settings), both on the candidate's plan (tiers ${CANDIDATE_TIERS}), the estate weight ${W}, ${POINTS} points, ${NP} paths (seed ${SEED}); ${UNITS.length} units; part ${part}`);
UNITS.forEach(([id, arm, label], i) => {
  if (i % pn !== pk) return;
  const h = byId(id);
  if (!h) { console.error(`audit-7aw: no case ${id}`); process.exit(2); }
  const L = `${arm}/${label}`;
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const base = { lambda: LAMBDA, points: POINTS, bequestWeight: W };
  const t0 = Date.now();
  const r = arm === 'CAND' ? solveCandidate(E, M, plan, base) : solvePlan(E, M, candidatePlan(E, plan), base);
  const secs = (Date.now() - t0) / 1000;
  const m = r.m, s0 = M.initialState(m);
  // the arm's settings, checked before anything is printed
  const isC = arm === 'CAND', want = isC ? { bridgeRead: 'reader', tierState: true, jointWorlds: true, bridgeStep: 'exact', switchMargin: 0, switchCharge: 0.001, e3: true, pclsInterp: true }
    : { bridgeRead: false, tierState: false, jointWorlds: false, bridgeStep: null, switchMargin: 0.001, switchCharge: 0, e3: false, pclsInterp: false };
  const got = { bridgeRead: r.meta.bridgeRead, tierState: !!r.meta.tierState, jointWorlds: !!r.meta.jointWorlds, bridgeStep: r.meta.bridgeStep || null, switchMargin: r.switchMargin, switchCharge: r.switchCharge || 0, e3: !!r.meta.e3, pclsInterp: !!r.g.pclsInterp };
  for (const [k, v] of Object.entries(want)) if (got[k] !== v) { console.error(`audit-7aw: ${id} ${L} ran ${k} ${got[k]}, not ${v}`); process.exit(2); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7aw: ${id} ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
  // the tiers the solve was given: O60's blend medians in both arms
  const cp = candidatePlan(E, plan), rp = E.normalizePlan(cp).riskProfiles;
  const tiers = Object.entries(rp).filter(([k]) => / Risk$/.test(k)).map(([k, p]) => `${k.replace(/ /g, '_')}:${p.real}`).join(',');
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve ${L}: table ${table.toFixed(4)} secs ${Math.round(secs)}`);
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.bridgeStep ? ` bridgeStep ${r.meta.bridgeStep}` : ''}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge || 0} e3 ${!!r.meta.e3} pclsInterp ${!!r.g.pclsInterp} tiers ${tiers}`;
  console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
  const paths = E.pathsForSeed(SEED, NP, m.ctx.totalYears);
  { const g = openGap(r, paths[0]); console.log(`${''.padEnd(16)} gap ${L}: ${g.gap} opening ${g.open}`); }
  const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
  console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
  const f0 = Date.now(), T = m.ctx.totalYears, okArr = new Uint8Array(NP), tr = makeTrace(NP, T + 1);
  let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
  paths.forEach((zs, k) => { tr.row = k; const o = runPolicy(r, zs, { trace: tr }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, r.meta.bequestCap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
  const sim = 100 * ok / NP;
  console.log(`${''.padEnd(16)} run ${L}: sim ${sim.toFixed(4)} below ${(below / NP).toFixed(2)} tier-below ${(tierYrs / NP).toFixed(2)} changes ${(changes / NP).toFixed(3)} estate ${Math.round(estate / NP)} secs ${Math.round((Date.now() - f0) / 1000)}`);
  writeFileSync(join(OUT, fileOf(id, arm, label)), gzipSync(JSON.stringify({ id, arm: L, stamp: STAMP, N: NP, Y: tr.Y, seed: SEED, sim,
    survived: b64(okArr), level: b64(tr.level), tier: b64(tr.tier), wealth: b64(tr.wealth), taxPaid: b64(tr.taxPaid), failYear: b64(tr.failYear) })));
  console.log(`${''.padEnd(16)} done ${L}`);
});
