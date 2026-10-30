/*
 * BETTER DECISIONS, OR MORE LEVERS? (EXPLORATORY, seed 7002; research/reviews/2026-10-30/LEVERS.md). The spending curve's
 * harness (../2026-10-29/curve/curve-audit.mjs, itself the tier test's) on the agent's latest code, with eight arms: two
 * decision-makers, the app's fixed rules and the solver, each given the same levers. Every unit is executed by the engine on
 * the same paths of the seed with Phase 4's runPath, held to E.runTrial on the first CHECK paths, runPolicy beside the
 * engine on the first BESIDE. The levers:
 *   the draws (which pot pays): every arm. The app follows the fixed order its own policy search picks; the solver chooses
 *     each year;
 *   the investments: the plan's own tiers (the app cannot change them; the solver with the user's consent to change risk
 *     withdrawn, `riskConsent: false`, the product's switch), or the solver's joint tier menu (the plan's own and up to
 *     three tiers safer, pension and ISA together). The app uses it statically: the one joint tier for the whole plan
 *     with the best survival on 1,000 paths of seed 7001 (never scored), on its row's pick (the policy is not searched
 *     again at each tier: a policy search at another tier can pick another policy, which moves where a windfall is
 *     staged, a second lever; the tier alone is the one under test);
 *   the spending: none (the app's guardrails off; the solver's `blockTrim` and `raiseCap: 1`, one level on its menu), or
 *     flexible (the app's guardrails as Phase 4's arm A; the solver's own menu, raises to 110%).
 * The arms:
 *                       fixed rule   solver
 *   fixed spending, the plan's tiers      FIXAPP       FIXHOLD
 *   fixed spending, the tier menu         FIXAPPT      FIXCAND
 *   flexible spending, the plan's tiers   APP          FLEXHOLD
 *   flexible spending, the tier menu      APPT         CAND
 * The solver's arms run on the app's pick from the same row (FIXAPP's for the fixed-spending arms, APP's for the flexible
 * ones), as Phase 4's solver arms ran on arm A's. Picks and the tier menu are found once a household and kept beside the
 * units (<id>-pick-<arm>.json, <id>-menu.json).
 *   node levers-audit.mjs <paths> <unit dir> <id> <arm>        (from the root of the code under test)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { gzipSync } from 'zlib';
import { cpus } from 'os';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
const { withTable } = await imp('src/solver/bridge.js');

export const APP_ARMS = ['FIXAPP', 'FIXAPPT', 'APP', 'APPT'], SOLVER_ARMS = ['FIXHOLD', 'FIXCAND', 'FLEXHOLD', 'CAND'], ARMS = [...APP_ARMS, ...SOLVER_ARMS];
export const SEED = 7002, SEARCH_SEED = 7001, SEARCH_N = 1000, W = 0.02, CHECK = 100, BESIDE = 200;
const [nArg, OUT, id, arm] = process.argv.slice(2);
const N = Number(nArg);
if (!(N >= 1) || !OUT || !id || !ARMS.includes(arm)) { console.error('usage: levers-audit.mjs <paths> <unit dir> <id> <arm>'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); })();
const h = Object.fromEntries(readPanel().map(x => [x.id, x]))[id];
if (!h) { console.error(`levers-audit: ${id} is not in Phase 4's panel`); process.exit(2); }
if (h.plan.demographics.planningMode !== 'single') { console.error(`levers-audit: ${id} is a couple`); process.exit(2); }
const fixedSpend = a => a.startsWith('FIX');
// the app's plan in its row: guardrails off (spending at the target) or on (Phase 4's arm A), the lookahead at 5 years
const rowPlan = (raw, fixed) => (fixed ? E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 5, raiseCap: 1 } }) : appPlan(raw));
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
// the solver's joint tier menu: pension and ISA tier names, step by step (a light solve's compiled menu, found once)
const menuFile = join(OUT, `${id}-menu.json`);
function tierMenu() {
  if (existsSync(menuFile)) return JSON.parse(readFileSync(menuFile, 'utf8'));
  const r = C.solveCandidate(E, M, prep(solverPlanOf(h.plan, { decumulationPolicy: h.plan.spending.decumulationPolicy })), { lambda: LAMBDA, points: 4, bequestWeight: W, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } });
  const menu = { pen: r.c.tiers.pen.map(t => t.name), isa: r.c.tiers.isa.map(t => t.name) };
  if (menu.pen.length !== menu.isa.length) throw new Error(`${id}: the pension's and the ISA's tier lists differ in length`);
  writeFileSync(menuFile, JSON.stringify(menu));
  return menu;
}
const withTier = (plan, menu, k) => ({ ...plan, accounts: plan.accounts.map(a => (!a ? a : a.category === 'Pensions' ? { ...a, risk: menu.pen[k] } : a.category === 'S&S ISAs' ? { ...a, risk: menu.isa[k] } : a)) });
const survivalOn = (planState, seed, n) => { const ctx = E.buildContext(E.resolveMpaa(planState)); const ps = E.pathsForSeed(seed, n, ctx.totalYears); let s = 0; for (const z of ps) s += runPath(ctx, Float64Array.from(z), false).survived ? 1 : 0; return 100 * s / n; };
// the app's pick in a row (its policy search; for a T arm also the joint tier with the best survival on the search seed)
function appPick(a) {
  const fixed = fixedSpend(a), tiered = a.endsWith('T');
  if (!tiered) { const p = armA(rowPlan(h.plan, fixed), { tournament: false }); return { planState: p.planState, label: p.label, k: 0, search: null }; }
  const menu = tierMenu(), search = [], row = armA(rowPlan(h.plan, fixed), { tournament: false });
  let best = null;
  for (let k = 0; k < menu.pen.length; k++) {
    const ps = withTier(row.planState, menu, k), s = survivalOn(ps, SEARCH_SEED, SEARCH_N);
    search.push({ k, pen: menu.pen[k], isa: menu.isa[k], survival: s });
    if (!best || s > best.s + 1e-12) best = { s, k, ps };
  }
  return { planState: best.ps, label: row.label, k: best.k, search };
}
const pickFile = a => join(OUT, `${id}-pick-${a.toLowerCase()}.json`);
// the inputs the fair test compares: a T arm's tiers are the lever under test, so its inputs are hashed with the plan's own
// tiers restored (inputsTiered keeps the hash of what it ran)
const baseRisk = Object.fromEntries(h.plan.accounts.filter(Boolean).map(a => [a.id, a.risk]));
const untiered = ps => ({ ...ps, accounts: ps.accounts.map(a => (a && baseRisk[a.id] !== undefined ? { ...a, risk: baseRisk[a.id] } : a)) });
let inputsTiered = null, inputsFor = null;
const t0 = Date.now();
let ctx, r = null, solveSecs = 0, ran;
if (APP_ARMS.includes(arm)) {
  const p = appPick(arm);
  writeFileSync(pickFile(arm), JSON.stringify({ label: p.label, decumulationPolicy: p.planState.spending.decumulationPolicy, k: p.k, search: p.search }));
  ctx = E.buildContext(E.resolveMpaa(p.planState));
  inputsTiered = inputsHash(ctx);
  inputsFor = inputsHash(E.buildContext(E.resolveMpaa(untiered(p.planState))));
  if (!!ctx.guardrails === fixedSpend(arm)) { console.error(`levers-audit: ${id} ${arm}: the guardrails are ${ctx.guardrails ? 'on' : 'off'}`); process.exit(3); }
  ran = { arm, label: p.label, k: p.k, search: p.search, guardrails: !!ctx.guardrails, minPot: ctx.solvencyFloor, risks: ctx.accounts.map(x => x.risk) };
  solveSecs = (Date.now() - t0) / 1000;
} else {
  // the solver runs on the app's pick from its row (the plan's tiers): FIXAPP's for fixed spending, APP's for flexible
  const rowApp = fixedSpend(arm) ? 'FIXAPP' : 'APP';
  let pk = existsSync(pickFile(rowApp)) ? JSON.parse(readFileSync(pickFile(rowApp), 'utf8')) : null;
  if (!pk) { const p = appPick(rowApp); pk = { label: p.label, decumulationPolicy: p.planState.spending.decumulationPolicy, k: 0, search: null }; writeFileSync(pickFile(rowApp), JSON.stringify(pk)); }
  const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy }));
  const extra = { lambda: LAMBDA, points: Number(process.env.LEVERS_PTS) || CAND_PTS, bequestWeight: W,
    ...(fixedSpend(arm) ? { blockTrim: true, raiseCap: 1 } : {}), ...(arm.endsWith('HOLD') ? { riskConsent: false } : {}) };
  r = C.solveCandidate(E, M, plan, extra);
  solveSecs = (Date.now() - t0) / 1000;
  const levels = [...new Set(r.levelOf)].sort((x, y) => x - y), held = arm.endsWith('HOLD');
  const bad = [];
  let tierMoves;
  if (fixedSpend(arm) && (levels.length !== 1 || levels[0] !== 1)) bad.push(`the menu ${levels}`);
  if (!fixedSpend(arm) && !(levels.some(l => l < 1) && levels.some(l => l > 1))) bad.push(`no cut or no raise on the menu: ${levels}`);
  if (!r.meta.failDelivered) bad.push('failDelivered off');
  // the tier moves on the menu: with the consent withdrawn only the plan's own pair (0/0); otherwise the joint steps
  tierMoves = [...new Set(r.actions.map(x => `${x.tierPen || 0}/${x.tierIsa || 0}`))].sort();
  if (held && !(tierMoves.length === 1 && tierMoves[0] === '0/0')) bad.push(`the tiers not held: the moves ${tierMoves.join(' ')}`);
  if (!held && !(tierMoves.length > 1 && r.meta.tierState)) bad.push(`no tier menu: the moves ${tierMoves.join(' ')}`);
  if (bad.length) { console.error(`levers-audit: ${id} ${arm}: ${bad.join('; ')}`); process.exit(3); }
  ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  ran = { arm, pts: r.g.np, actions: r.actions.length, levels, tierMoves, lambda: r.lambda, failDelivered: !!r.meta.failDelivered, tierState: !!r.meta.tierState, tiers: { pen: r.c.tiers.pen.map(t => t.name), isa: r.c.tiers.isa.map(t => t.name) },
    bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10), switchCharge: r.switchCharge, label: pk.label, minPot: E.num(r.m.ctx.solvencyFloor, 0) };
}
const T = ctx.totalYears, Y = T + 1, self = ctx.owners.find(o => o.key === 'self');
const retireT = Math.max(0, Math.min(Y, self.retireAge - ctx.ageSelf0)), accessT = Math.max(0, ctx.nmpa - ctx.ageSelf0);
const paths = E.pathsForSeed(SEED, N, T);
const out = { survived: new Uint8Array(N), delivered: new Float32Array(N), unmet: new Float32Array(N), estate: new Float32Array(N), wealth: new Float32Array(N), failYear: new Int16Array(N), level: new Uint8Array(N * Y) };
let badCheck = 0;
const e0 = Date.now();
paths.forEach((zs0, k) => {
  const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
  out.survived[k] = o.survived ? 1 : 0; out.delivered[k] = o.delivered; out.unmet[k] = o.unmet; out.estate[k] = o.estate; out.wealth[k] = o.wealth; out.failYear[k] = o.failYear; out.level.set(o.level, k * Y);
  if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) badCheck++; }
});
if (badCheck) { console.error(`levers-audit: ${id} ${arm}: runPath differs from E.runTrial on ${badCheck} of the first ${CHECK} paths`); process.exit(3); }
const engineSecs = (Date.now() - e0) / 1000;
let beside = null, tierYears = null;
if (r) {
  const NB = Math.min(N, BESIDE);
  let engineOnly = 0, policyOnly = 0;
  const eq = new Float64Array(Y), en = new Float64Array(Y);
  for (let k = 0; k < NB; k++) {
    const p = S.runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held) => { const e = r.c.tiers.pen[held.pen].equity * s[0] + r.c.tiers.isa[held.isa].equity * s[1], w = s[0] + s[1]; if (w > 0 && t < Y) { eq[t] += e / w; en[t]++; } } }).survived ? 1 : 0;
    if (out.survived[k] && !p) engineOnly++; if (p && !out.survived[k]) policyOnly++;
  }
  beside = { N: NB, engineOnly, policyOnly };
  // the pension and ISA's equity share the policy holds, by year, on the paths beside (what the investment lever did): the
  // visit's held is what entered year t, before the move, so year t's move is recorded at t + 1 (the readers read it there)
  tierYears = Array.from(eq, (x, t) => (en[t] ? +(x / en[t]).toFixed(4) : null));
}
// the spending lever's use: the spending years off the target before a failure (none in the fixed-spending arms)
let offTarget = 0;
for (let k = 0; k < N; k++) { const fy = out.failYear[k]; for (let t = retireT; t < Y; t++) { const lv = out.level[k * Y + t]; if (lv === 0 || (fy >= 0 && t >= fy)) continue; if (lv !== 100) offTarget++; } }
if (fixedSpend(arm) && offTarget) { console.error(`levers-audit: ${id} ${arm}: ${offTarget} spending years off the target`); process.exit(3); }
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const surv = 100 * out.survived.reduce((a, x) => a + x, 0) / N;
writeFileSync(join(OUT, `${id}-${arm.toLowerCase()}.json.gz`), gzipSync(JSON.stringify({ id, arm, cohort: h.cohort, target: ctx.targetSpend, inputs: inputsFor || inputsHash(ctx), inputsTiered, retireT, accessT, ageSelf0: ctx.ageSelf0, Y, seed: SEED, N,
  code: codeHash, candidate: C.CANDIDATE_HASH, ran, offTarget, tierYears, solveSecs, engineSecs, cpu: cpus()[0].model, beside, main: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, b64(v)])) })));
console.log(`${id} ${arm}: survival ${surv.toFixed(2)}% on ${N}; ${ran.k !== undefined && ran.search ? `tier step ${ran.k} (search ${ran.search.map(x => x.survival.toFixed(1)).join(' / ')}); ` : ''}years off the target ${offTarget}; solve ${Math.round(solveSecs)} s, engine ${Math.round(engineSecs)} s${beside ? `; beside: the engine alone ${beside.engineOnly}, runPolicy alone ${beside.policyOnly} of ${beside.N}` : ''}; code ${codeHash}`);
