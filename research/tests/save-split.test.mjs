/*
 * THE SAVINGS SPLIT'S TESTS (STATE.md D38 (4); research/solver/SAVINGS-SPLIT.md; CHECKLIST 5: each check shown failing on its
 * plant). `saveSplit: true` (research, off by default) lets a working year's move choose where the plan's pension and ISA
 * saving goes at the plan's net cost: save 1 the pension first, grossed up to its room, then the ISA, the rest taxable; save 2
 * the ISA first, then the pension; 0 the plan's own contributions. Phase 4's panel households under APP's pick (the windfall
 * test's setup), the light settings:
 *   1. OFF: with the option unset, every table of every layer, world and year, 40 forward runs and the run record the same
 *      as the code before the option (BASE, checked out into a temporary worktree and its engine built there), on two saving
 *      households (an employee, the self-employed) and one already retired.
 *   2. THE GROSS-UP against a hand calculation (the engine's context; tax and NIC differenced by hand, the rooms from the
 *      allowance rules): an employee across Scottish bands, the self-employed (relief at source), the MPAA in force (the
 *      pension's room binds), a blank salary (the assumed rate), and an ISA room that binds (a cash ISA subscription kept).
 *      Each variant's net cost is the plan's to a penny, each amount within its room, each greedy in its order. Planted: the
 *      budget taken with the pension contribution gross (its net cost not used) fails the check.
 *   3. IN STEP: the engine and the forward run, each save forced in every working year with a choice (runPolicy's choose;
 *      the engine takes the forward run's move each year, as V2's state check), their states slot by slot every year to a
 *      pound and the wealth at the end; the saves live (the pots at retirement differ between saves 1 and 2). Planted: the
 *      engine handed the move without its save; the two part by more than a pound. The exact model (model.js) under a save
 *      takes that year's variant: the same as under the variant handed it as `contrib`; planted, the save dropped, it parts.
 *   4. ON: a retired household gets the menu without copies, move for move, its tables the same as with the option off,
 *      `meta.saveSplit` 'no year to choose'; a saving household's menu is three times as long, its tables differ from the
 *      option off, `meta.saveSplit` 'on'.
 *   5. THE SKIP: the copies left out outside the working years (SPLIT.skip) change no table and no run.
 *   6. THE REFUSALS: with the windfall split, or a value other than true, the solve throws.
 * Since D73's port (11 Nov; the candidate sweeps cash ISA money to the ISA and is solved on anchors and shortlists, `coarse`):
 * check 1 solves the candidate before D73 on this code (candidate.mjs BEFORE_D73_OPTS), which is what the code before the
 * option solves; check 1b's pins are re-taken on the candidate as it is (the working: results-d73-fulltier.txt); check 3's
 * replayed move carries `sweepIsa` as the table's own does (bridge.js tablePolicy); and check 5, an identity of the skip, is
 * read with `coarse` taken out on both sides (a shortlist is drawn from the menu, so it differs with the copies in it).
 *   node research/tests/save-split.test.mjs [--base <root of the code before the option>] [--only 2]   (--only 2: the gross-up alone, no solves; not a record)
 */
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2), bAt = argv.indexOf('--base'), ONLY2 = argv[argv.indexOf('--only') + 1] === '2' && argv.includes('--only');
const BASE = '574cb57';   // the code before the option
let tmpWt = null, BROOT = bAt >= 0 ? resolve(argv[bAt + 1]) : ONLY2 ? ROOT : null;
if (!BROOT) {
  tmpWt = mkdtempSync(join(tmpdir(), 'save-base-'));
  rmSync(tmpWt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '--detach', tmpWt, BASE], { cwd: ROOT, stdio: 'ignore' });
  if (existsSync(join(ROOT, 'node_modules'))) symlinkSync(join(ROOT, 'node_modules'), join(tmpWt, 'node_modules'));
  execFileSync('python3', ['research/build-engine.py'], { cwd: tmpWt, stdio: 'ignore' });
  BROOT = tmpWt;
}
const cleanup = () => { if (tmpWt) { try { execFileSync('git', ['worktree', 'remove', '--force', tmpWt], { cwd: ROOT, stdio: 'ignore' }); } catch (e) { rmSync(tmpWt, { recursive: true, force: true }); } tmpWt = null; } };
process.on('exit', cleanup);

const imp = (root, p) => import(pathToFileURL(resolve(root, p)).href);
const load = async root => ({ root, E: await imp(root, 'research/engine.mjs'), M: await imp(root, 'src/solver/model.js'), C: await imp(root, 'research/solver/candidate.mjs'), S: await imp(root, 'src/solver/solve.js') });
const X = await load(ROOT), B = await load(BROOT);
const { E, M, C, S } = X;
const { vecOf } = await imp(ROOT, 'src/solver/grid.js');
const { modelStateOf, withTable } = await imp(ROOT, 'src/solver/bridge.js');
const { readPanel, appPlan } = await imp(ROOT, 'research/solver/phase4-panel.mjs');
const { armA } = await imp(ROOT, 'research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp(ROOT, 'research/solver/audit-phase4.mjs');

let failed = 0, passed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (c) passed++; else failed++; };
const sec = t0 => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
const headOf = root => { try { return execSync('git log --oneline -1', { cwd: root }).toString().trim().slice(0, 7) + (execSync('git status --short src', { cwd: root }).toString().trim() ? ' with changes' : ''); } catch (e) { return '?'; } };
const panel = readPanel();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = (id, edit) => { const h = structuredClone(panel.find(x => x.id === id)); if (edit) edit(h.plan); const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy; return prep(solverPlanOf(h.plan, { decumulationPolicy: pk })); };
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const ON = { saveSplit: true };
const workingYears = plan => { const ctx = E.buildContext(plan), o = ctx.owners[0]; return Math.max(0, o.retireAge - o.age0); };
const RETIRED = panel.find(h => workingYears(prep(appPlan(h.plan))) === 0).id;
const SAVERS = ['S188', 'S244'];   // an employee taxed in Scotland, five working years; the self-employed, fifteen
/*
 * Check 1 against the code before the option where the review of 9 Nov's items 3 and 4 leave a table alone (D69): cash interest
 * untaxed, no dividend yield, any Auto deposit typed into the taxable account. Check 1b pins the option-unset solve of the
 * household as the test takes it: its tables and 40 forward runs, digested (PIN1B, taken on item 3's code; again on item 4's
 * where the household has an Auto deposit). CHECK1_PLANT=1 swaps the two plans on this code's side: check 1 and check 1b must
 * both fail. RECORD1B=1 prints 1b's digests.
 */
const PLANT1 = process.env.CHECK1_PLANT === '1', RECORD1B = process.env.RECORD1B === '1';
const NEUTRAL = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, cashInterestTaxed: false, giaDividendYield: 0 }, oneOffContributions: (plan.oneOffContributions || []).map(x => (x.category === E.AUTO_DEPOSIT ? { ...x, category: E.CATEGORY_LABEL.other } : x)) }));
const PIN1B = {   // taken on item 3's code (the review of 9 Nov), the light settings; S026's and S090's again on item 4's (each
  // has an Auto deposit in 2030 the plan routes into its pension: the same £3,600 now lands for £2,880, £720 more kept taxable)
  // re-taken on D73's candidate (12 Nov; before: S188 847a1cbc6947bba1..., S244 2fcb676ee98a867e..., S026 dc4b42a7ce29f5fe...): the
  // sweep to the ISA and the solve on anchors move these tables and runs and nothing else in the port does (with both keys out
  // each solve gives the figure before: results-d73-fulltier.txt, printed by research/solver/d73-fulltier.mjs)
  // all three again on 12 Nov (before: S188 18d011b40c673bad..., S244 50b52e353034a397..., S026 736b3a2b9c82aa91...): the ceiling on the year's whole taxable income (ANSWERS.md section 5; D91, D93) moves the draws of a household with interest or dividends,
  // and nothing else in its commit does (with the ceiling's one function switched off this test passes on the figures before: results-harvest-ceiling.txt)
  // S188 and S244 again on 13 Nov (before: S188 a42f62208fabdb30..., S244 614e53bfe8e20aad...): the tie-break above the estate cap joined the candidate (D95; D90 (1)), which moves a
  // single's forward runs above the cap and no table (the same pins and no others moved in the measurement of 12 Nov, results-stage-b-figures.txt;
  // with the candidate's margin set to nought this test passes on the figures before: results-tie-port.txt)
  S188: '74320e7cf3eb83b4a3e2562af100db36d0c9092b451cf6bd332c55fbc6cf0251',
  S244: '0b47fa3c72e1552231257b06e07839cc934c64d66dd3026ebd931f43b5ef3e41',
  [RETIRED]: '6358b69104c2fa0cacadfc35405925b210a3b851b012686c7e818b69a3fee513'
};
const { tablesOf, digestOf } = await imp(ROOT, 'src/solverDigest.js');
const { createHash } = await import('node:crypto');
const digest1b = async (r, runs) => createHash('sha256').update(await digestOf(tablesOf(r))).update(runs.join('\n')).digest('hex');
console.log(`The savings split's tests: the code at ${ROOT} (${headOf(ROOT)}), the code before the option at ${BROOT} (${headOf(BROOT)}); saving households ${SAVERS.join(', ')}, retired ${RETIRED}; the light settings`);

const KEYS = ['surv', 'lsurv', 'resil', 'lresil', 'beq', 'short', 'pol'];
const sameTables = (a, b) => {
  const La = a.tablesW.layW, Lb = b.tablesW.layW;
  let n = 0;
  if (!La || !Lb || La.length !== Lb.length) return { same: false, n, at: "the worlds' layers" };
  for (let k = 0; k < La.length; k++) {
    if (La[k].length !== Lb[k].length) return { same: false, n, at: `world ${k}'s layers` };
    for (let j = 0; j < La[k].length; j++) for (const key of KEYS) {
      const x = La[k][j][key], y = Lb[k][j][key];
      if (!x || !y || x.length !== y.length) return { same: false, n, at: `world ${k} layer ${j} ${key}` };
      for (let t = 0; t < x.length; t++) {
        const u = x[t], v = y[t];
        if (u.length !== v.length) return { same: false, n, at: `world ${k} layer ${j} ${key} year ${t}` };
        for (let i = 0; i < u.length; i++) { n++; if (!Object.is(u[i], v[i])) return { same: false, n, at: `world ${k} layer ${j} ${key} year ${t} cell ${i}: ${u[i]} against ${v[i]}` }; }
      }
    }
  }
  return { same: true, n };
};
const runsOf = (Sx, r, paths) => paths.map(zs => JSON.stringify(Sx.runPolicy(r, Float64Array.from(zs))));
const runDiff = (ra, rb) => ra.findIndex((x, i) => x !== rb[i]);
const flat = (o, pre = '', out = {}) => { for (const [k, x] of Object.entries(o || {})) { if (k === 'ms') continue; if (x && typeof x === 'object' && !Array.isArray(x)) flat(x, `${pre}${k}.`, out); else out[`${pre}${k}`] = JSON.stringify(x); } return out; };
const metaDiff = (a, b) => { const fa = flat(a.meta), fb = flat(b.meta); return [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter(k => fa[k] !== fb[k]).sort(); };
const solve = (Cx, Ex, Mx, plan, o = {}, base) => Cx.solveCandidate(Ex, Mx, structuredClone(plan), { ...light, ...o }, base);
// the whole menu named by the arm itself (check 5): the candidate's `coarse` left out of a solve that could take it
const WHOLE = { coarse: undefined };
const pathsFor = (r, n, seed = 99001) => E.pathsForSeed(seed, n, r.m.ctx.totalYears).map(z => Float64Array.from(z));

try {
  // -------------------------------------------------------------------------------------------------- 1. OFF
  console.log('=========== 1. OFF: THE CODE BEFORE THE OPTION ===========');
  const SOLVED = {};
  for (const id of ONLY2 ? [] : [...SAVERS, RETIRED]) {
    const full = planOf(id), plan = NEUTRAL(full);
    let t0 = Date.now();
    // this code's side on the candidate before D73 (no sweep to the ISA, no anchors): what the code before the option solves
    const a = solve(C, E, M, PLANT1 ? full : plan, {}, C.BEFORE_D73_OPTS), ta = sec(t0);
    t0 = Date.now();
    const b = solve(B.C, B.E, B.M, plan);
    const st = sameTables(a, b), paths = pathsFor(a, 40), rd = runDiff(runsOf(S, a, paths), runsOf(B.S, b, paths)), md = metaDiff(a, b);
    // 1b. the option unset on the household as the test takes it, against its pinned digest
    const off = solve(C, E, M, PLANT1 ? plan : full), offPaths = pathsFor(off, 40), dg = await digest1b(off, runsOf(S, off, offPaths));
    SOLVED[id] = { plan: full, off, paths: offPaths };
    if (RECORD1B) console.log(`RECORD1B ${id} ${dg}`);
    ok(dg === PIN1B[id], `1b. ${id}, the option unset, as the test takes it (interest, dividends and any Auto deposit): its tables and 40 forward runs ${dg.slice(0, 16)} against the pin ${PIN1B[id] ? PIN1B[id].slice(0, 16) : 'not taken'}${PLANT1 ? '; planted: the neutral plan' : ''}`);
    ok(st.same && rd < 0 && md.length === 0,
      `1. ${id}, the option unset, the candidate before D73, against the code before it (cash interest untaxed, no dividend yield, any Auto deposit typed into the taxable account: D69${PLANT1 ? '; planted: this code on the plan as taken' : ''}): ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record ${md.length ? `differs at ${md.slice(0, 4).join(', ')}` : 'the same, its timings aside'} (this code ${ta}, the code before ${sec(t0)})`);
  }
  if (RECORD1B || PLANT1) { console.log(`\ncheck 1 and 1b only (${RECORD1B ? 'RECORD1B' : 'CHECK1_PLANT'}): ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); }


  // -------------------------------------------------------------------------------------------------- 2. THE GROSS-UP
  console.log('=========== 2. THE GROSS-UP AGAINST A HAND CALCULATION ===========');
  // by hand: the net cost of a pension credit g (an employee sacrifices g / (1 + the employer NIC passed through), relieved at
  // income tax and employee NIC; the self-employed pay g and are relieved at income tax), the year's rooms from the allowance
  // rules, and the variants' net cost (the pension at its net cost, the ISA and the overflow at face value)
  const handNet = (P, o, salary, g) => {
    if (!(g > 0)) return 0;
    const se = !!o.selfEmployed, pass = se ? 1 : 1 + P.erNic * P.erPass;
    if (!(salary > 0)) return (g / pass) * (1 - (se ? P.higherRate : P.higherRate + P.nicUpper));
    const s = Math.min(g / pass, salary), tax = x => (se ? E.incomeTax(x, P) : E.calculateUKTaxAndNIC(x, P));
    return s - (tax(salary) - tax(salary - s));
  };
  const handOf = (ctx, t, planted) => {
    const P = ctx.P, o = ctx.owners[0], ids = o.ids, salary = E.salaryAtYear(o, t);
    const P0 = E.contribAtYear(ctx.acc[ids.pen], t), I0 = E.contribAtYear(ctx.acc[ids.isa], t), G0 = E.contribAtYear(ctx.acc[ids.other], t);
    const earn = E.relevantEarningsAtYear(ctx, o, t), allow = E.mpaaAppliesAtYear(P, o, t) ? P.mpaaLimit : P.aaAt(earn);
    const cap = o.salary <= 0 && earn <= 0 ? allow : Math.min(allow, Math.max(P.pensionNoEarningsLimit, earn));
    const cashIsa = o.cashIsaContrib > 0 ? Math.min(o.cashIsaContrib, P.cashIsaCapAt(o.age0 + t, ctx.baseYear + t)) : 0;
    const budget = (planted ? P0 : handNet(P, o, salary, P0)) + I0;
    return { P0, I0, G0, budget, pen: Math.max(P0, cap), isa: Math.max(I0, P.isaAllowance - cashIsa), net: g => handNet(P, o, salary, g) };
  };
  const checkCase = (ctx, t, planted = false) => {
    const h = handOf(ctx, t, planted), e = ctx.saveSplitAt(t), ids = ctx.owners[0].ids;
    if (!e) return { bad: 'no choice recorded', h };
    let worst = 0, room = true, greedy = true;
    const parts = [];
    for (let v = 1; v <= 2; v++) {
      const x = e.variants[v], pen = x[ids.pen], isa = x[ids.isa], over = x[ids.other] - h.G0;
      worst = Math.max(worst, Math.abs(h.net(pen) + isa + over - h.budget));
      room = room && pen <= h.pen + 1e-6 && isa <= h.isa + 1e-6 && over >= -1e-9 && x[ids.cash] === E.contribAtYear(ctx.acc[ids.cash], t);
      // greedy in its order: the first wrapper full or holding the whole budget, the second only what the first left
      greedy = greedy && (v === 1 ? (pen >= h.pen - 0.01 || isa + over < 0.01) && (isa >= h.isa - 0.01 || over < 0.01) : (isa >= h.isa - 0.01 || pen + over < 0.01) && (pen >= h.pen - 0.01 || over < 0.01));
      parts.push(`save ${v} pension £${Math.round(pen)}, ISA £${Math.round(isa)}, taxable +£${Math.round(over)}`);
    }
    const roomsAgree = Math.abs(e.owners[0].pen - h.pen) < 1e-6 && Math.abs(e.owners[0].isa - h.isa) < 1e-6;
    return { worst, room, greedy, roomsAgree, h, parts };
  };
  // each case: its name, household, an edit of the panel plan before it is prepared, one of the prepared plan (the MPAA age,
  // which resolveMpaa would otherwise set from the plan's own draws), and what the case is there to show
  const sv = (ctx, v) => ctx.saveSplitAt(0).variants[v], ids = ctx => ctx.owners[0].ids;
  const cases = [
    ['S188, an employee taxed in Scotland (the sacrifice crosses the 45% band)', 'S188', null, null, ctx => sv(ctx, 1)[ids(ctx).isa] === 0 && sv(ctx, 2)[ids(ctx).pen] === 0],
    ['S244, self-employed (relief at source, income tax only)', 'S244', null, null, ctx => ctx.owners[0].selfEmployed === true],
    ['S188 with the MPAA in force (the pension\'s room £10,000 binds)', 'S188', null, p => { p.demographics.mpaaAgeSelf = p.demographics.currentAgeSelf; return p; }, ctx => Math.abs(sv(ctx, 1)[ids(ctx).pen] - ctx.P.mpaaLimit) < 1e-6 && sv(ctx, 1)[ids(ctx).isa] > 0],
    ['S204 with its salary blank (the assumed rate)', 'S204', p => { p.demographics.salarySelf = ''; return p; }, null, ctx => !(ctx.owners[0].salary > 0)],
    ['S260 with an ISA contribution of £12,000 and a cash ISA subscription of £6,000 (the ISA\'s room, £14,000, binds)', 'S260', p => { const a = p.accounts.find(x => x.category === 'S&S ISAs' && x.owner === 'Myself'); a.contrib = 12000; delete a.contribByYear; p.accounts.find(x => x.category === 'Cash ISA' && x.owner === 'Myself').contrib = 6000; return p; }, null, ctx => Math.abs(sv(ctx, 2)[ids(ctx).isa] - 14000) < 1e-6 && sv(ctx, 2)[ids(ctx).pen] > 0]
  ];
  let plantCtx = null;
  for (const [name, id, edit, post, shows] of cases) {
    const t = 0;
    let ctx;
    try { const plan = planOf(id, edit ? p => edit(p) : null); ctx = E.buildContext(post ? post(plan) : plan); } catch (e) { ok(false, `2. ${name}: the plan would not build (${e.message})`); continue; }
    const r = checkCase(ctx, t);
    if (r.bad) { ok(false, `2. ${name}: ${r.bad}`); continue; }
    const shown = shows(ctx);
    ok(r.worst < 0.01 && r.room && r.greedy && r.roomsAgree && shown,
      `2. ${name}, year ${t}: the plan's pension £${Math.round(r.h.P0)}, ISA £${Math.round(r.h.I0)}, net budget £${r.h.budget.toFixed(2)}; rooms pension £${Math.round(r.h.pen)}, ISA £${Math.round(r.h.isa)}; ${r.parts.join('; ')}; the worst net cost against the budget £${r.worst.toExponential(1)}; within the rooms ${r.room ? 'yes' : 'NO'}, greedy ${r.greedy ? 'yes' : 'NO'}, the rooms as by hand ${r.roomsAgree ? 'yes' : 'NO'}, the case as named ${shown ? 'yes' : 'NO'}`);
    if (!plantCtx) plantCtx = ctx;
  }
  {
    const r = checkCase(plantCtx, 0, true);
    ok(r.worst > 1, `2. planted: the budget taken with the pension contribution gross (£${Math.round(r.h.P0)}, not its net cost) parts the variants from it by £${Math.round(r.worst)}, and the check fails`);
  }

  if (ONLY2) throw Object.assign(new Error('only 2'), { only2: true });
  // -------------------------------------------------------------------------------------------------- 3. IN STEP
  console.log('=========== 3. THE ENGINE AND THE FORWARD RUN IN STEP THROUGH EVERY SAVE ===========');
  const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
  const gainOf = v => v[3] * (v[2] - v[12]);
  const moveOf = (r, ai, dropSave) => {
    const a = r.actions[ai], ca = r.c.acts[ai];
    return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
      // sweepIsa as tablePolicy carries it (bridge.js): without it the engine swept the cash ISA money to the taxable account while the
      // forward run swept it to the ISA, once D73 made 'isa' the candidate's (the class state-check's moveOf was fixed for, 11 Nov)
      spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), ...(a.sweepIsa ? { sweepIsa: true } : {}), ...(a.save && !dropSave ? { save: a.save } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code: 'forced',
      tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
  };
  const id0 = 'S188', plan0 = SOLVED[id0].plan;
  let t0 = Date.now();
  const rOn = solve(C, E, M, plan0, ON), T = rOn.m.ctx.totalYears, A0 = rOn.actions.findIndex(a => a.save), WY = workingYears(plan0);
  const paths = pathsFor(rOn, 20);
  const lockstep = (v, dropSave) => {
    const force = (t, s, held) => { const ai = S.chooseAction(rOn, s, t, held) % A0; return rOn.c.yr.saveYear[t] ? ai + v * A0 : ai; };
    const base = withTable(rOn.m.ctx.plan, rOn), real = base.spending.policyOverride;
    let recs = null;
    const worst = {}, at = {};
    let years = 0, retPots = null;
    const pol = { ...real, choose(st, t, held) {
      const rec = recs[t];
      if (!rec) return real.choose(st, t, held);
      years++;
      const e = vecOf(rOn.m, modelStateOf(st)), f = rec.s, g = {};
      for (const k of MONEY) g[k] = Math.abs((e[k] || 0) - (f[k] || 0));
      g.gain = Math.abs(gainOf(e) - gainOf(f));
      for (const [k, x] of Object.entries(g)) if (!(x <= (worst[k] ?? -1))) { worst[k] = x; at[k] = `path ${cur} year ${t}`; }
      return moveOf(rOn, rec.ai, dropSave);
    } };
    const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
    let cur = 0, survived = 0;
    for (let i = 0; i < paths.length; i++) {
      cur = i; recs = [];
      const out = S.runPolicy(rOn, paths[i], { choose: force, visit: (t, s, held, ai) => { recs[t] = { s: Float64Array.from(s), ai }; } });
      const st = E.freshState(ctx);
      let row = null;
      for (let t = 0; t <= T; t++) { row = E.stepYear(ctx, st, t, { z: paths[i][t], zPath: paths[i].length > T + 1 ? paths[i][T + 1] : 0 }); if (i === 0 && t === WY - 1) retPots = { ...st.pots }; }
      if (out.survived) { survived++; const d = Math.abs(out.terminal - row.totalCombined); if (!(d <= (worst.end ?? -1))) { worst.end = d; at.end = `path ${i}`; } }
    }
    const keys = [...MONEY, 'gain', 'end'], wk = keys.reduce((b, k) => ((worst[k] ?? 0) > (worst[b] ?? 0) ? k : b), keys[0]);
    const NAMES = { 0: 'pension', 1: 'ISA', 2: 'taxable and cash', 4: 'tax-free cash taken', 6: 'cash ISA', 11: 'gains carried', 12: 'cash', 13: 'basis of an emptied account', gain: 'gain held', end: 'wealth at the end' };
    return { worst: worst[wk] ?? 0, slot: NAMES[wk], at: at[wk] || '-', years, survived, retPots };
  };
  const L = [0, 1, 2].map(v => lockstep(v, false));
  L.forEach((x, v) => ok(x.worst <= 1 && x.years > 0,
    `3. ${id0}, save ${v} forced in its ${WY} working years: ${x.years} household-years in step over ${paths.length} paths, the worst gap £${x.worst.toExponential(2)} (${x.slot}, ${x.at}); the forward run survives ${x.survived} of ${paths.length}`));
  const o = rOn.m.ctx.owners[0].ids, d1 = L[1].retPots, d2 = L[2].retPots;
  ok(Math.abs(d1[o.pen] - d2[o.pen]) > 1 && Math.abs(d1[o.isa] - d2[o.isa]) > 1,
    `3. live: at retirement on path 0 the pension is £${Math.round(d1[o.pen])} under save 1 and £${Math.round(d2[o.pen])} under save 2, the ISA £${Math.round(d1[o.isa])} and £${Math.round(d2[o.isa])}`);
  const P1 = lockstep(1, true);
  ok(P1.worst > 1, `3. planted: the engine handed save 1's move without its save parts from the forward run by £${Math.round(P1.worst)} (${P1.slot}, ${P1.at}), and the check fails (${sec(t0)})`);
  {
    // the exact model: a save takes the year's variant, the same as that variant handed it as `contrib`
    const m = M.prepare(E, plan0), own = M.actionFromContext(m.ctx);
    const run = act => { const s = M.initialState(m), out = []; for (let t = 0; t < WY; t++) { M.step(m, s, act(t), t); out.push({ ...s.pots }); } return out; };
    const gap = (a, b) => Math.max(...a.map((p, t) => Math.max(...Object.keys(p).map(k => Math.abs(p[k] - b[t][k])))));
    const viaSave = run(() => ({ ...own, save: 1 })), viaMap = run(t => ({ ...own, contrib: m.ctx.saveSplitAt(t).variants[1] })), viaPlan = run(() => own);
    const g = gap(viaSave, viaMap), gp = gap(viaPlan, viaMap);
    ok(g < 0.01 && gp > 1, `3. the exact model under save 1 through ${WY} working years: the same as the variant handed it as contrib (the worst gap £${g.toExponential(1)}); planted, the save dropped, it parts by £${Math.round(gp)}`);
  }

  // -------------------------------------------------------------------------------------------------- 4. ON
  console.log('=========== 4. THE OPTION ON ===========');
  {
    t0 = Date.now();
    const off = SOLVED[RETIRED].off, on = solve(C, E, M, SOLVED[RETIRED].plan, ON);
    const sameMenu = on.actions.length === off.actions.length && on.actions.every((a, i) => a.label === off.actions[i].label && !a.save);
    const st = sameTables(on, off), rd = runDiff(runsOf(S, on, SOLVED[RETIRED].paths), runsOf(S, off, SOLVED[RETIRED].paths));
    ok(sameMenu && st.same && rd < 0 && on.meta.saveSplit === 'no year to choose',
      `4. ${RETIRED} (retired), the option on: the menu ${sameMenu ? 'the same' : 'DIFFERENT'} (${on.actions.length} moves); ${st.n} table entries ${st.same ? 'the same as off' : `differ (${st.at})`}; 40 runs ${rd < 0 ? 'the same' : `differ at path ${rd}`}; recorded ${JSON.stringify(on.meta.saveSplit)} (${sec(t0)})`);
    const offS = SOLVED[id0].off, st2 = sameTables(rOn, offS);
    ok(rOn.actions.length === 3 * offS.actions.length && !st2.same && rOn.meta.saveSplit === 'on',
      `4. ${id0} (saving), the option on: ${rOn.actions.length} moves against ${offS.actions.length}; its tables ${st2.same ? 'THE SAME as off' : `differ from off (first at ${st2.at.split(':')[0]})`}; recorded ${JSON.stringify(rOn.meta.saveSplit)}`);
  }

  // -------------------------------------------------------------------------------------------------- 5. THE SKIP
  console.log('=========== 5. THE COPIES LEFT OUT OUTSIDE THE WORKING YEARS ===========');
  {
    // the skip's identity is the whole menu's: on anchors a cell's shortlist is drawn from the menu, the copies with it, so
    // both sides are solved with `coarse` taken out (D73's port)
    t0 = Date.now();
    const skipped = solve(C, E, M, plan0, { ...ON, ...WHOLE });
    S.SPLIT.skip = false;
    let all, rAll;
    try { all = solve(C, E, M, plan0, { ...ON, ...WHOLE }); rAll = runsOf(S, all, SOLVED[id0].paths); } finally { S.SPLIT.skip = true; }
    const ta = sec(t0), st = sameTables(skipped, all), rd = runDiff(runsOf(S, skipped, SOLVED[id0].paths), rAll);
    ok(st.same && rd < 0 && !skipped.meta.coarse && !all.meta.coarse && skipped.meta.saveSplit === 'on', `5. ${id0}: the copies scored in every year (SPLIT.skip false) against left out after its ${WY} working years, both on the whole menu (coarse taken out): ${st.n} table entries ${st.same ? 'the same to the bit' : `differ (${st.at})`}; 40 runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`} (both solves ${ta})`);
  }

  // -------------------------------------------------------------------------------------------------- 6. THE REFUSALS
  console.log('=========== 6. THE REFUSALS ===========');
  for (const [name, o] of [['with the windfall split', { saveSplit: true, windfallSplit: true }], ["as 'yes'", { saveSplit: 'yes' }]]) {
    let msg = null;
    try { S.buildActions && solve(C, E, M, plan0, { ...o, points: 2 }); } catch (e) { msg = e.message; }
    ok(!!msg && /saveSplit/.test(msg), `6. the savings split asked ${name}: ${msg ? `refused (${msg})` : 'RAN'}`);
  }
} catch (e) {
  if (!e.only2) throw e;
  console.log('--only 2: the gross-up alone (not a record)');
} finally {
  cleanup();
}
console.log(failed ? `FAILED: ${failed} of ${passed + failed} checks` : `ALL PASS: ${passed} checks`);
process.exit(failed ? 1 : 0);
