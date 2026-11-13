/*
 * THE WINDFALL SPLIT'S TESTS (STATE.md D37; research/solver/WINDFALL-SPLIT.md; CHECKLIST 5: each check shown failing on its
 * plant). `windfallSplit: true` (research, off by default) lets the year's move choose where that year's Auto deposits land:
 * split 1 the pension up to its room, then the ISA up to its allowance, the rest taxable; 2 the ISA, the rest taxable; 3 all
 * taxable; 0 the plan's own routing. Phase 4's panel households under APP's pick (the lock test's setup), the light settings:
 *   1. OFF: with the option unset, every table of every layer, world and year, 40 forward runs and the run record the same
 *      as the code before the option (BASE, checked out into a temporary worktree and its engine built there), on two
 *      windfall households and one without a deposit.
 *   2. THE ROUTING against a hand calculation (the engine's context; split 1's pension relieved since the review of 9 Nov,
 *      item 4: its room gross for the net, any refund to cash): S026's Auto deposit larger than both rooms; the same
 *      deposit smaller than the pension's room; and with a plain ISA deposit the same year, which takes its share of the
 *      allowance first. Planted: the room computed without giving back the Auto deposit's own claim fails the check.
 *   3. IN STEP: the engine and the forward run, each split forced in the deposit year (runPolicy's choose; the engine takes
 *      the forward run's move each year, as V2's state check), their states slot by slot every year to a pound and the
 *      wealth at the end; the split live (the deposit year's pots differ between splits 1 and 3). Planted: the engine
 *      handed the move without its split; the two part by more than a pound.
 *   4. ON: a household with no Auto deposit gets the menu without copies, move for move, its tables the same as with the
 *      option off, `meta.windfallSplit` 'no Auto deposit'; a windfall household's menu is four times as long, its tables
 *      differ from the option off, `meta.windfallSplit` 'on'.
 *   5. THE SKIP: the copies left out outside a deposit year (SPLIT.skip) change no table and no run; with them scored in
 *      every year the tables and 40 runs are the same.
 *   6. A COUPLE'S FUNDING SPLIT: a couple with an Auto deposit steps in the exact model under the even funding split (a
 *      couple's move carries `split`, the share the first person funds) as under its own move, to the pound. The move's
 *      windfall field was `split` in 4c05bc0, so the couple threw in its deposit year; that code fails the check.
 * Since D73's port (11 Nov; the candidate sweeps cash ISA money to the ISA and is solved on anchors and shortlists, `coarse`):
 * check 1 solves the candidate before D73 on this code (candidate.mjs BEFORE_D73_OPTS), which is what the code before the
 * option solves; check 1b's pins are re-taken on the candidate as it is (the working: results-d73-fulltier.txt); check 3's
 * replayed move carries `sweepIsa` as the table's own does (bridge.js tablePolicy); and check 5, an identity of the skip, is
 * read with `coarse` taken out on both sides (a shortlist is drawn from the menu, so it differs with the copies in it).
 *   node research/tests/windfall-split.test.mjs [--base <root of the code before the option>]
 */
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2), bAt = argv.indexOf('--base');
const BASE = '82e4ad6';   // the code before the option
let tmpWt = null, BROOT = bAt >= 0 ? resolve(argv[bAt + 1]) : null;
if (!BROOT) {
  tmpWt = mkdtempSync(join(tmpdir(), 'windfall-base-'));
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
const ON = { windfallSplit: true };
const dated = h => (h.plan.oneOffContributions || []).filter(x => x.date || x.year);
const NODEP = panel.find(h => !dated(h).length).id;
const WIND = ['S026', 'S090'];
/*
 * Check 1 against the code before the option where the review of 9 Nov's items 3 and 4 leave a table alone (D69): cash interest
 * untaxed, no dividend yield, any Auto deposit typed into the taxable account (item 3 prices interest and dividends above the
 * year's income; item 4 relieves an Auto deposit the plan routes into a pension). Check 1b pins the option-unset solve of the
 * household as the test takes it, interest, dividends and its Auto deposit with them: its tables and 40 forward runs, digested
 * (PIN1B, taken on item 3's code; again on item 4's where the household has an Auto deposit). CHECK1_PLANT=1 swaps the two plans
 * on this code's side: check 1 and check 1b must both fail. RECORD1B=1 prints 1b's digests.
 */
const PLANT1 = process.env.CHECK1_PLANT === '1', RECORD1B = process.env.RECORD1B === '1';
const NEUTRAL = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, cashInterestTaxed: false, giaDividendYield: 0 }, oneOffContributions: (plan.oneOffContributions || []).map(x => (x.category === E.AUTO_DEPOSIT ? { ...x, category: E.CATEGORY_LABEL.other } : x)) }));
const PIN1B = {   // taken on item 3's code (the review of 9 Nov), the light settings; S026's and S090's again on item 4's (each
  // has an Auto deposit in 2030 the plan routes into its pension: the same £3,600 now lands for £2,880, £720 more kept taxable)
  // re-taken on D73's candidate (12 Nov; before: S026 dc4b42a7ce29f5fe..., S090 f1e1167100e2f43b..., S040 4adc22e273e981c7...): the
  // sweep to the ISA and the solve on anchors move these tables and runs and nothing else in the port does (with both keys out
  // each solve gives the figure before: results-d73-fulltier.txt, printed by research/solver/d73-fulltier.mjs)
  // all three again on 12 Nov (before: S026 736b3a2b9c82aa91..., S090 c789a06cbc51db2e..., S040 23c2e079444fecec...): the ceiling on the year's whole taxable income (ANSWERS.md section 5; D91, D93) moves the draws of a household with interest or dividends,
  // and nothing else in its commit does (with the ceiling's one function switched off this test passes on the figures before: results-harvest-ceiling.txt)
  S026: '6358b69104c2fa0cacadfc35405925b210a3b851b012686c7e818b69a3fee513',
  S090: '9e5c0edb5552470b2814a7906fb8592dfb634731c57f90e1e4a0896d263ccdd1',
  [NODEP]: '1e2e0187a8f3ceaccb503e2d73febb4ae96bb158314d233085bb8c3efcdd393c'
};
const { tablesOf, digestOf } = await imp(ROOT, 'src/solverDigest.js');
const { createHash } = await import('node:crypto');
const digest1b = async (r, runs) => createHash('sha256').update(await digestOf(tablesOf(r))).update(runs.join('\n')).digest('hex');
console.log(`The windfall split's tests: the code at ${ROOT} (${headOf(ROOT)}), the code before the option at ${BROOT} (${headOf(BROOT)}); windfall households ${WIND.join(', ')}, no deposit ${NODEP}; the light settings`);

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
  for (const id of [...WIND, NODEP]) {
    const full = planOf(id), plan = NEUTRAL(full);
    let t0 = Date.now();
    // this code's side on the candidate before D73 (no sweep to the ISA, no anchors): what the code before the option solves
    const a = solve(C, E, M, PLANT1 ? full : plan, {}, C.BEFORE_D73_OPTS), ta = sec(t0);
    t0 = Date.now();
    const b = solve(B.C, B.E, B.M, plan);
    const st = sameTables(a, b), paths = pathsFor(a, 40), rd = runDiff(runsOf(S, a, paths), runsOf(B.S, b, paths)), md = metaDiff(a, b);
    ok(st.same && rd < 0 && md.length === 0,
      `1. ${id}, the option unset, the candidate before D73, against the code before it (cash interest untaxed, no dividend yield, any Auto deposit typed into the taxable account: D69): ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record ${md.length ? `differs at ${md.slice(0, 4).join(', ')}` : 'the same, its timings aside'} (this code ${ta}, the code before ${sec(t0)})${PLANT1 ? '; planted: this code on the plan as taken' : ''}`);
    // 1b. the option unset on the household as the test takes it, against its pinned digest
    const off = solve(C, E, M, PLANT1 ? plan : full), offPaths = pathsFor(off, 40), dg = await digest1b(off, runsOf(S, off, offPaths));
    SOLVED[id] = { plan: full, off, paths: offPaths };
    if (RECORD1B) console.log(`RECORD1B ${id} ${dg}`);
    ok(dg === PIN1B[id], `1b. ${id}, the option unset, as the test takes it (interest, dividends and its Auto deposit): its tables and 40 forward runs ${dg.slice(0, 16)} against the pin ${PIN1B[id] ? PIN1B[id].slice(0, 16) : 'not taken'}${PLANT1 ? '; planted: the neutral plan' : ''}`);
  }
  if (RECORD1B || PLANT1) { console.log(`\ncheck 1 and 1b only (${RECORD1B ? 'RECORD1B' : 'CHECK1_PLANT'}): ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); }


  // -------------------------------------------------------------------------------------------------- 2. THE ROUTING
  console.log('=========== 2. THE ROUTING AGAINST A HAND CALCULATION ===========');
  // the hand calculation: the room is each wrapper's headroom this year less what every deposit but the Auto ones claims;
  // split 1's pension relieved (the review of 9 Nov, item 4): its room taken gross for the net the windfall pays (gross x
  // (1 - relief at source)), a payer above the basic band refunded the rest of their relief (the tax on their earnings less
  // the tax on their earnings less the gross) to cash
  const reliefOf = (ctx, t, gross) => {
    const P = ctx.P, r = P.reliefAtSource, earnings = E.relevantEarningsAtYear(ctx, ctx.owners[0], t);
    const total = earnings > 0 ? E.incomeTax(earnings, P) - E.incomeTax(Math.max(0, earnings - gross), P) : gross * r;
    return { net: gross * (1 - r), refund: Math.max(0, total - gross * r) };
  };
  const split1 = (ctx, t, A, penRoom, isaRoom) => {
    const gross = Math.min(penRoom, A / (1 - ctx.P.reliefAtSource)), rel = gross > 0 ? reliefOf(ctx, t, gross) : { net: 0, refund: 0 };
    const net = Math.min(A, rel.net), isa1 = Math.min(A - net, isaRoom);
    return { pen: gross, isa: isa1, other: A - net - isa1, cash: rel.refund };
  };
  const handOf = (ctx, y, others) => {
    const t = y - ctx.baseYear, A = ctx.autoSplit.get(y).room.reduce((s, e) => s + e.amount, 0);
    const room = cat => Math.max(0, E.wrapperHeadroomAtYear(ctx, 'self', cat, t) - (others[cat] || 0));
    const isa2 = Math.min(A, room('isa'));
    return { A, rooms: [room('pen'), room('isa')], v: [null, split1(ctx, t, A, room('pen'), room('isa')), { pen: 0, isa: isa2, other: A - isa2, cash: 0 }, { pen: 0, isa: 0, other: A, cash: 0 }] };
  };
  const byCat = (ctx, entries) => { const o = ctx.owners[0].ids, out = { pen: 0, isa: 0, other: 0, cash: 0 }; for (const x of entries) { const cat = Object.keys(o).find(k => o[k] === x.id); out[cat] = (out[cat] || 0) + x.amount; } return out; };
  const routingGap = (ctx, y, hand, variants) => {
    let worst = 0;
    for (let v = 1; v <= 3; v++) { const got = byCat(ctx, variants[v]); for (const cat of ['pen', 'isa', 'other', 'cash']) worst = Math.max(worst, Math.abs((got[cat] || 0) - hand.v[v][cat])); }
    return worst;
  };
  const Y = 2030;
  const cases = [
    ['S026 as it is (an Auto deposit of £32,400, larger than both rooms)', p => p, {}],
    ['the same deposit cut to £2,000 (smaller than the pension\'s room)', p => { p.oneOffContributions[0].amount = 2000; return p; }, {}],
    ['a plain ISA deposit of £5,000 the same year, ahead of it', p => { p.oneOffContributions.unshift({ ...p.oneOffContributions[0], id: 'isa5k', category: 'S&S ISAs', amount: 5000 }); return p; }, { isa: 5000 }]
  ];
  let plantCtx = null;
  for (const [name, edit, others] of cases) {
    const plan = planOf('S026', p => edit(p));
    const ctx = E.buildContext(plan);
    const e = ctx.autoSplit.get(Y);
    if (!e) { ok(false, `2. ${name}: no Auto money recorded for ${Y}`); continue; }
    const hand = handOf(ctx, Y, others), gap = routingGap(ctx, Y, hand, e.variants);
    const plain = (ctx.oneOffContribs.get(Y) || []).filter(x => !x.auto).reduce((s, x) => s + x.amount, 0);
    ok(gap < 1e-9 && Math.abs(e.room[0].pen - hand.rooms[0]) < 1e-9 && Math.abs(e.room[0].isa - hand.rooms[1]) < 1e-9,
      `2. ${name}: rooms £${hand.rooms.map(x => Math.round(x)).join(' / £')} (pension / ISA), the Auto money £${Math.round(hand.A)}; split 1 ${JSON.stringify(byCat(ctx, e.variants[1]))}, 2 ${JSON.stringify(byCat(ctx, e.variants[2]))}, 3 ${JSON.stringify(byCat(ctx, e.variants[3]))}; worst gap to the hand calculation £${gap.toExponential(1)}; the plain deposits that year £${Math.round(plain)}`);
    if (!plantCtx) plantCtx = ctx;
  }
  {
    // planted: the rooms without the Auto deposit's own claims given back (the plan's routing claimed whichever wrapper its
    // deposit order reached first with room)
    const ctx = plantCtx, e = ctx.autoSplit.get(Y), t = Y - ctx.baseYear, A = e.room[0].amount;
    const own = byCat(ctx, (ctx.oneOffContribs.get(Y) || []).filter(x => x.auto));
    const roomOf = cat => Math.max(0, E.wrapperHeadroomAtYear(ctx, 'self', cat, t) - (own[cat] || 0));
    const penRoom = roomOf('pen'), isaRoom = roomOf('isa'), s1 = split1(ctx, t, A, penRoom, isaRoom);
    const isa2 = Math.min(A, isaRoom), id = ctx.owners[0].ids;
    const planted = [null, [{ id: id.pen, amount: s1.pen }, { id: id.isa, amount: s1.isa }, { id: id.other, amount: s1.other }, { id: id.cash, amount: s1.cash }], [{ id: id.isa, amount: isa2 }, { id: id.other, amount: A - isa2 }], [{ id: id.other, amount: A }]];
    const gap = routingGap(ctx, Y, handOf(ctx, Y, {}), planted);
    ok(gap > 1, `2. planted: the rooms left without the Auto deposit's own claims given back (its claims pension £${Math.round(own.pen || 0)}, ISA £${Math.round(own.isa || 0)}) part from the hand calculation by £${Math.round(gap)}, and the check fails`);
  }

  // -------------------------------------------------------------------------------------------------- 3. IN STEP
  console.log('=========== 3. THE ENGINE AND THE FORWARD RUN IN STEP THROUGH EVERY SPLIT ===========');
  const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
  const NAMES = { 0: 'pension', 1: 'ISA', 2: 'taxable and cash', 4: 'tax-free cash taken', 6: 'cash ISA', 11: 'gains carried', 12: 'cash', 13: 'basis of an emptied account', gain: 'gain held', end: 'wealth at the end' };
  const gainOf = v => v[3] * (v[2] - v[12]);
  const moveOf = (r, ai, dropSplit) => {
    const a = r.actions[ai], ca = r.c.acts[ai];
    return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
      // sweepIsa as tablePolicy carries it (bridge.js): without it the engine swept the cash ISA money to the taxable account while the
      // forward run swept it to the ISA, once D73 made 'isa' the candidate's (the class state-check's moveOf was fixed for, 11 Nov)
      spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), ...(a.sweepIsa ? { sweepIsa: true } : {}), ...(a.windfall && !dropSplit ? { windfall: a.windfall } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code: 'forced',
      tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
  };
  const id0 = 'S026', plan0 = SOLVED[id0].plan;
  let t0 = Date.now();
  const rOn = solve(C, E, M, plan0, ON), T = rOn.m.ctx.totalYears, A0 = rOn.actions.findIndex(a => a.windfall), yDep = Y - rOn.m.ctx.baseYear;
  const paths = pathsFor(rOn, 20);
  const lockstep = (v, dropSplit) => {
    const force = (t, s, held) => { const ai = S.chooseAction(rOn, s, t, held) % A0; return t === yDep ? ai + v * A0 : ai; };
    const base = withTable(rOn.m.ctx.plan, rOn), real = base.spending.policyOverride;
    let recs = null;
    const worst = {}, at = {};
    let years = 0, depPots = null;
    const pol = { ...real, choose(st, t, held) {
      const rec = recs[t];
      if (!rec) return real.choose(st, t, held);
      years++;
      const e = vecOf(rOn.m, modelStateOf(st)), f = rec.s, g = {};
      for (const k of MONEY) g[k] = Math.abs((e[k] || 0) - (f[k] || 0));
      g.gain = Math.abs(gainOf(e) - gainOf(f));
      for (const [k, x] of Object.entries(g)) if (!(x <= (worst[k] ?? -1))) { worst[k] = x; at[k] = `path ${cur} year ${t}`; }
      return moveOf(rOn, rec.ai, dropSplit);
    } };
    const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
    let cur = 0, survived = 0;
    for (let i = 0; i < paths.length; i++) {
      cur = i; recs = [];
      const out = S.runPolicy(rOn, paths[i], { choose: force, visit: (t, s, held, ai) => { recs[t] = { s: Float64Array.from(s), ai }; } });
      const st = E.freshState(ctx);
      let row = null;
      for (let t = 0; t <= T; t++) { row = E.stepYear(ctx, st, t, { z: paths[i][t], zPath: paths[i].length > T + 1 ? paths[i][T + 1] : 0 }); if (i === 0 && t === yDep) depPots = { ...st.pots }; }
      if (out.survived) { survived++; const d = Math.abs(out.terminal - row.totalCombined); if (!(d <= (worst.end ?? -1))) { worst.end = d; at.end = `path ${i}`; } }
    }
    const keys = [...MONEY, 'gain', 'end'], wk = keys.reduce((b, k) => ((worst[k] ?? 0) > (worst[b] ?? 0) ? k : b), keys[0]);
    return { worst: Math.max(...keys.map(k => worst[k] ?? 0)), slot: NAMES[wk] || wk, at: at[wk] || '', years, survived, depPots };
  };
  const L = [0, 1, 2, 3].map(v => lockstep(v, false));
  L.forEach((x, v) => ok(x.worst <= 1 && x.years > 0,
    `3. ${id0}, split ${v} forced in ${Y}: ${x.years} household-years in step over ${paths.length} paths, the worst gap £${x.worst.toExponential(2)} (${x.slot}, ${x.at}); the forward run survives ${x.survived} of ${paths.length}`));
  const o = rOn.m.ctx.owners[0].ids, d1 = L[1].depPots, d3 = L[3].depPots;
  ok(Math.abs(d1[o.pen] - d3[o.pen]) > 1 && Math.abs(d1[o.isa] - d3[o.isa]) > 1,
    `3. live: after ${Y} on path 0 the pension is £${Math.round(d1[o.pen])} under split 1 and £${Math.round(d3[o.pen])} under split 3, the ISA £${Math.round(d1[o.isa])} and £${Math.round(d3[o.isa])}`);
  const P1 = lockstep(1, true);
  ok(P1.worst > 1, `3. planted: the engine handed split 1's move without its split parts from the forward run by £${Math.round(P1.worst)} (${P1.slot}, ${P1.at}), and the check fails (${sec(t0)})`);

  // -------------------------------------------------------------------------------------------------- 4. ON
  console.log('=========== 4. THE OPTION ON ===========');
  {
    t0 = Date.now();
    const off = SOLVED[NODEP].off, on = solve(C, E, M, SOLVED[NODEP].plan, ON);
    const sameMenu = on.actions.length === off.actions.length && on.actions.every((a, i) => a.label === off.actions[i].label && !a.windfall);
    const st = sameTables(on, off), rd = runDiff(runsOf(S, on, SOLVED[NODEP].paths), runsOf(S, off, SOLVED[NODEP].paths));
    ok(sameMenu && st.same && rd < 0 && on.meta.windfallSplit === 'no Auto deposit',
      `4. ${NODEP} (no Auto deposit), the option on: the menu ${sameMenu ? 'the same' : 'DIFFERENT'} (${on.actions.length} moves); ${st.n} table entries ${st.same ? 'the same as off' : `differ (${st.at})`}; 40 runs ${rd < 0 ? 'the same' : `differ at path ${rd}`}; recorded ${JSON.stringify(on.meta.windfallSplit)} (${sec(t0)})`);
    const offW = SOLVED[id0].off, st2 = sameTables(rOn, offW);
    ok(rOn.actions.length === 4 * offW.actions.length && !st2.same && rOn.meta.windfallSplit === 'on',
      `4. ${id0} (an Auto deposit), the option on: ${rOn.actions.length} moves against ${offW.actions.length}; its tables ${st2.same ? 'THE SAME as off' : `differ from off (first at ${st2.at.split(':')[0]})`}; recorded ${JSON.stringify(rOn.meta.windfallSplit)}`);
  }

  // -------------------------------------------------------------------------------------------------- 5. THE SKIP
  console.log('=========== 5. THE COPIES LEFT OUT OUTSIDE A DEPOSIT YEAR ===========');
  {
    // the skip's identity is the whole menu's: on anchors a cell's shortlist is drawn from the menu, the copies with it, so
    // both sides are solved with `coarse` taken out (D73's port; on anchors the two differ in a few entries)
    t0 = Date.now();
    const skipped = solve(C, E, M, plan0, { ...ON, ...WHOLE });
    S.SPLIT.skip = false;
    let all;
    try { all = solve(C, E, M, plan0, { ...ON, ...WHOLE }); } finally { S.SPLIT.skip = true; }
    const ta = sec(t0), st = sameTables(skipped, all);
    S.SPLIT.skip = false;
    let rAll;
    try { rAll = runsOf(S, all, SOLVED[id0].paths); } finally { S.SPLIT.skip = true; }
    const rd = runDiff(runsOf(S, skipped, SOLVED[id0].paths), rAll);
    ok(st.same && rd < 0 && !skipped.meta.coarse && !all.meta.coarse && skipped.meta.windfallSplit === 'on', `5. ${id0}: the copies scored in every year (SPLIT.skip false) against left out outside ${Y}, both on the whole menu (coarse taken out): ${st.n} table entries ${st.same ? 'the same to the bit' : `differ (${st.at})`}; 40 runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`} (both solves ${ta})`);
  }

  // -------------------------------------------------------------------------------------------------- 6. A COUPLE'S FUNDING SPLIT
  console.log("=========== 6. A COUPLE'S FUNDING SPLIT BESIDE AN AUTO DEPOSIT ===========");
  {
    // the bug of 4c05bc0: the windfall was read from a move's `split`, which a couple's move (couple.js) uses for the share of
    // the need the first person funds, so a couple with an Auto deposit threw in its deposit year; the field is `windfall` now
    const { buildScenarios } = await imp(ROOT, 'research/policy-study/scenarios.mjs');
    const sc = buildScenarios().filter(s => s.plan.demographics.planningMode !== 'single').find(s => (s.plan.oneOffContributions || []).some(x => x.category === E.AUTO_DEPOSIT));
    const plan = E.resolveMpaa(E.normalizePlan({ ...structuredClone(sc.plan), config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
    const evenYear = Mx => {
      const m = Mx.prepare(E, plan), own = Mx.actionFromContext(m.ctx), per = { steps: own.steps, harvest: own.harvest, harvestCeil: own.harvestCeil };
      const even = { ...own, split: 0.5, perOwner: { self: per, part: per } }, s1 = Mx.initialState(m), s2 = Mx.initialState(m);
      let worst = 0;
      try { for (let t = 0; t <= m.ctx.totalYears; t++) { const r1 = Mx.step(m, s1, own, t), r2 = Mx.step(m, s2, even, t); worst = Math.max(worst, Math.abs(r1.totalCombined - r2.totalCombined), Math.abs(r1.taxPaid - r2.taxPaid)); } } catch (e) { return { threw: e.message }; }
      return { worst, years: [...m.ctx.autoSplit.keys()].join(', ') };
    };
    const cur = evenYear(M);
    ok(!cur.threw && cur.worst < 0.01 && cur.years, `6. ${sc.id} (a couple, an Auto deposit in ${cur.years || '?'}): the even funding split with one order for both, the exact model's year against its own, ${cur.threw ? `THREW (${cur.threw})` : `the worst gap £${cur.worst.toExponential(2)}`}`);
    // shown failing on the code of 4c05bc0 (its model.js, which imports nothing, beside this engine)
    const dir = mkdtempSync(join(tmpdir(), 'windfall-fault-')), f = join(dir, 'model.mjs');
    try {
      writeFileSync(f, execFileSync('git', ['show', '4c05bc0:src/solver/model.js'], { cwd: ROOT }));
      const bad = evenYear(await import(pathToFileURL(f).href));
      ok(!!bad.threw || bad.worst >= 0.01, `6. the code of 4c05bc0 fails the check: ${bad.threw ? `it throws (${bad.threw})` : `the worst gap £${bad.worst.toFixed(2)}`}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
} finally {
  cleanup();
}
console.log(failed ? `FAILED: ${failed} of ${passed + failed} checks` : `ALL PASS: ${passed} checks`);
process.exit(failed ? 1 : 0);
