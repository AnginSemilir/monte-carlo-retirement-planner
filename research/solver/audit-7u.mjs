/*
 * 7U: THE WIDER CONFIRMATION - THE RESEARCH CANDIDATE AGAINST THE SHIPPING DEFAULT ON A HELD-OUT SEED (PLAN.md 7u;
 * items/7u.md; predictions/confirm-7u.md; the maintainer, 26 Sep 20:10 UK: "a further wider test run that would confirm
 * whether we can take forward anything useful discovered to the default model"; released 8 Oct 19:56 UK).
 * 7aj's and 7aw's design (audit-7aw.mjs), widened: the 55 households of panel-7u.mjs (7e's 25 and the broad 30), both
 * estate weights (0.02 and 0.01), the held-out seed 7013, 8,000 paths, 30 points. The arms, per household and weight,
 * lambda held:
 *   CAND - the research candidate (candidate.mjs solveCandidate: CANDIDATE_OPTS, RESEARCH_OPTS among them, so e3pcls ON -
 *          the research default since 7 Oct; 7aj and 7aw ran it off, declared in the prediction's fair-test row 17 - and
 *          candidatePlan's tiers, O60's blend medians), with the estate weight on top;
 *   SHIP - the shipping default (solvePlan with the product's own settings: no bridge read, per-world tables, the stored
 *          switch margin, e3 and e3pcls off, the snapped allowance axis) on the same plan, O60's blend-median tiers, so
 *          the forward run's returns are the same in both arms and only the solver's settings differ.
 * Prints per unit 7aw's lines (reduce-7aa.mjs parse): case, solve, ran (with e3pcls), gap, joint, run, done; its trace to
 * results/diag7u (DIAG7U_OUT). On the six households of STAGE6 (the deep review of 7 Oct 11:42 UK, change 4; items/7u.md
 * 8 Oct item 3), also the table against the simulation by year: an access line (the first year the pension can be
 * drawn) and, for every year, a resid line - the paths alive that year, the mean over them of the survival the arm's
 * own chooser expected for the move it chose (scoreMoves on that move alone, each world's table weighted as the chooser
 * weights them; the reader's read included where the arm reads), and the share of those paths that survived. The
 * reducer groups the years into the bridge, after access and the last 15 years. Logging changes no move: the chooser
 * is called first and the move it returns is the move run (the preflight holds a logged run to an unlogged one bit for
 * bit; AUDIT7U_NOSTAGE=1 turns the logging off).
 *   node research/solver/audit-7u.mjs [points=30] [paths=8000] part k/n [seed=7013]
 *   node research/solver/audit-7u.mjs --units      the unit count
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { solveCandidate, candidatePlan, CANDIDATE_OPTS, CANDIDATE_TIERS } from './candidate.mjs';
// imported here as well as by candidate.mjs, so the research defaults are in the run's stamp by name too
import { RESEARCH_OPTS } from './research-opts.mjs';
import { PANEL25, UNITS, STAGE6, SEED as SEED_7U } from './panel-7u.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'panel-7u.mjs'))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 8000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`audit-7u: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7u: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : SEED_7U;
if (!(SEED >= 1)) { console.error(`audit-7u: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, NOSTAGE = process.env.AUDIT7U_NOSTAGE === '1';
if (!Object.entries(RESEARCH_OPTS).every(([k, v]) => CANDIDATE_OPTS[k] === v)) { console.error('audit-7u: the candidate does not carry RESEARCH_OPTS'); process.exit(2); }
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-7u: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAG7U_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7u');
mkdirSync(OUT, { recursive: true });

// the households: 7aw's builders (audit-s126.mjs variant() and F1_VARIANTS, copied), and the library's singles
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
if (PANEL25.some(([id]) => !byId(id))) { console.error('audit-7u: a household of the 25 has no builder'); process.exit(2); }

const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const fileOf = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
// the year-0 gap and opening (audit-7aw.mjs's, copied)
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
// the survival the arm's own chooser expects for move ai at (st, t): each table's survival part of that move alone,
// weighted as chooseAction weights the tables (a move failing in a table contributes 0 there, as scoreMoves sets it)
const survOf = (() => {
  const buf = new Map();
  const bufs = n => { if (!buf.has(n)) buf.set(n, [new Float64Array(n), new Float64Array(n), new Float64Array(n), new Float64Array(n)]); return buf.get(n); };
  const one = (tab, st, t, held, ai) => { const [SC, TX, BQ, SV] = bufs(tab.actions.length); scoreMoves(tab, st, t, SC, TX, BQ, held, { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[t][ai] }, SV); return SV[ai]; };
  return (r, st, t, held, ai) => (r.mix ? r.mix.tables.reduce((s, tab, k) => s + r.mix.weights[k] * one(tab, st, t, held, ai), 0) : one(r, st, t, held, ai));
})();

console.log(`7U: the research candidate (solveCandidate, e3pcls on) against the shipping default (solvePlan, the product's settings), both on the candidate's plan (tiers ${CANDIDATE_TIERS}), the estate weights 0.02 and 0.01, ${POINTS} points, ${NP} paths (seed ${SEED}); ${UNITS.length} units; part ${part}${NOSTAGE ? '; stage logging off' : ''}`);
UNITS.forEach(([id, arm, label, w], i) => {
  if (i % pn !== pk) return;
  const h = byId(id);
  if (!h) { console.error(`audit-7u: no case ${id}`); process.exit(2); }
  const W = Number(w), L = `${arm}/${label}`;
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const base = { lambda: LAMBDA, points: POINTS, bequestWeight: W };
  const t0 = Date.now();
  const r = arm === 'CAND' ? solveCandidate(E, M, plan, base) : solvePlan(E, M, candidatePlan(E, plan), base);
  const secs = (Date.now() - t0) / 1000;
  const m = r.m, s0 = M.initialState(m);
  const isC = arm === 'CAND', want = isC ? { bridgeRead: 'reader', tierState: true, jointWorlds: true, bridgeStep: 'exact', switchMargin: 0, switchCharge: 0.001, e3: true, e3pcls: true, pclsInterp: true }
    : { bridgeRead: false, tierState: false, jointWorlds: false, bridgeStep: null, switchMargin: 0.001, switchCharge: 0, e3: false, e3pcls: false, pclsInterp: false };
  const got = { bridgeRead: r.meta.bridgeRead, tierState: !!r.meta.tierState, jointWorlds: !!r.meta.jointWorlds, bridgeStep: r.meta.bridgeStep || null, switchMargin: r.switchMargin, switchCharge: r.switchCharge || 0, e3: !!r.meta.e3, e3pcls: !!r.meta.e3pcls, pclsInterp: !!r.g.pclsInterp };
  for (const [k, v] of Object.entries(want)) if (got[k] !== v) { console.error(`audit-7u: ${id} ${L} ran ${k} ${got[k]}, not ${v}`); process.exit(2); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7u: ${id} ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
  const cp = candidatePlan(E, plan), rp = E.normalizePlan(cp).riskProfiles;
  const tiers = Object.entries(rp).filter(([k]) => / Risk$/.test(k)).map(([k, p]) => `${k.replace(/ /g, '_')}:${p.real}`).join(',');
  const table = 100 * r.worlds.reduce((t, wd, k) => t + r.mix.weights[k] * wd.value(s0, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve ${L}: table ${table.toFixed(4)} secs ${Math.round(secs)}`);
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.bridgeStep ? ` bridgeStep ${r.meta.bridgeStep}` : ''}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge || 0} e3 ${!!r.meta.e3} e3pcls ${!!r.meta.e3pcls} pclsInterp ${!!r.g.pclsInterp} tiers ${tiers}`;
  console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
  const paths = E.pathsForSeed(SEED, NP, m.ctx.totalYears);
  { const g = openGap(r, paths[0]); console.log(`${''.padEnd(16)} gap ${L}: ${g.gap} opening ${g.open}`); }
  const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
  console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
  const f0 = Date.now(), T = m.ctx.totalYears, okArr = new Uint8Array(NP), tr = makeTrace(NP, T + 1);
  const STG = STAGE6.includes(id) && !NOSTAGE, pred = STG ? new Float32Array(NP * (T + 1)).fill(NaN) : null;
  let row = 0;
  const choose = STG ? (t, st, held) => { const ai = chooseAction(r, st, t, held); if (t <= T) pred[row * (T + 1) + t] = 100 * survOf(r, st, t, held, ai); return ai; } : undefined;
  let ok = 0, below = 0, tierYrs = 0, estate = 0, changes = 0;
  paths.forEach((zs, k) => { row = k; tr.row = k; const o = runPolicy(r, zs, choose ? { trace: tr, choose } : { trace: tr }); if (o.survived) { ok++; okArr[k] = 1; estate += Math.min(o.terminalNet, r.meta.bequestCap); } below += (o.spendYears || 0) - (o.atTarget || 0); tierYrs += o.tierPenYears || 0; changes += o.tierChanges || 0; });
  const sim = 100 * ok / NP;
  console.log(`${''.padEnd(16)} run ${L}: sim ${sim.toFixed(4)} below ${(below / NP).toFixed(2)} tier-below ${(tierYrs / NP).toFixed(2)} changes ${(changes / NP).toFixed(3)} estate ${Math.round(estate / NP)} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (STG) {
    console.log(`${''.padEnd(16)} access ${L}: year ${Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0)} years ${T}`);
    for (let t = 0; t <= T; t++) { let n = 0, tb = 0, sv = 0; for (let k = 0; k < NP; k++) { const v = pred[k * (T + 1) + t]; if (v === v) { n++; tb += v; sv += okArr[k]; } }
      console.log(`${''.padEnd(16)} resid ${L} year ${t}: paths ${n} table ${n ? (tb / n).toFixed(4) : '-'} realised ${n ? (100 * sv / n).toFixed(4) : '-'}`); }
  }
  writeFileSync(join(OUT, fileOf(id, arm, label)), gzipSync(JSON.stringify({ id, arm: L, stamp: STAMP, N: NP, Y: tr.Y, seed: SEED, sim,
    survived: b64(okArr), level: b64(tr.level), tier: b64(tr.tier), wealth: b64(tr.wealth), taxPaid: b64(tr.taxPaid), failYear: b64(tr.failYear) })));
  console.log(`${''.padEnd(16)} done ${L}`);
});
