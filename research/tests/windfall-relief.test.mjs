/*
 * RELIEF ON MONEY THE PLAN PAYS INTO A PENSION (the review of 9 Nov, item 4; D66). Money the plan itself routes into a
 * pension from the household's own funds (the windfall split's pension-first variant, an Auto deposit the policy puts in a
 * pension, a staged transfer out of the taxable account) is relieved at source, through one function shared with
 * bedAndSippFor (App.jsx pensionRelief): the room taken gross, the money paying the net (gross x 0.8), a payer above the basic
 * band refunded the rest of their relief to cash. A deposit typed into a pension lands as typed (M3). Each case by hand, on a
 * single person in England holding a pension, an ISA, a taxable account and cash, an Auto deposit in 2028:
 *   1. no earnings (66, retired at 60), a £10,000 windfall, room £3,600 (the no-earnings limit): split 1 puts £3,600 in the
 *      pension for £2,880 (£3,600 x 0.8); the other £7,120 goes on, to the ISA (its room £20,000). The plan's own routing (the
 *      policy's order, the pension first) the same: £3,600 for £2,880, £7,120 to the taxable account;
 *   2. pay £40,000 (50, working to 67), a £20,000 windfall, room £40,000 (the earnings): the pension gains £25,000 for £20,000
 *      (£20,000 / 0.8); no refund: the relief due, the tax on £40,000 less the tax on £15,000 (£5,486 - £486 = £5,000), is all
 *      given at source (£25,000 x 0.2);
 *   3. pay £80,000, the same windfall: the pension gains £25,000 for £20,000, and £5,000 comes back to cash: the tax on
 *      £80,000 (£7,540 + £29,730 x 0.4 = £19,432) less the tax on £55,000 (£7,540 + £4,730 x 0.4 = £9,432) is £10,000, £5,000
 *      of it at source;
 *   4. the MPAA triggered (58, accessed at 57, pay £40,000): room £10,000, so the pension gains £10,000 for £8,000; £12,000
 *      goes on, to the ISA;
 *   5. a staged transfer: case 1's household with a £20,000 deposit typed into the pension: £3,600 lands now as typed (M3),
 *      £16,400 waits in the taxable account, and each later year the transfer takes £2,880 from it and lands £3,600 (its
 *      uplift 1.25, no refund), until the last, smaller one; the engine's year (stepYear, the expected returns) moves the
 *      pension by 1.25 times what the transfer sold from the taxable account, against the same year without the transfer;
 *   6. restated by D69 (the review's case 6 contradicted its step 1.2): where no route into a pension is made from the
 *      household's money, every table is the code before this item's (item 3's), bit for bit: S116, and S210 with its deposit
 *      removed and with it typed into the taxable account, at light settings; S210 as the library enters it, its 2033 Auto
 *      deposit to the pound (£3,600 lands for £2,880, £168,120 goes on);
 *   7. no relief and no room for a one-off deposit from 75 (D69): aged 76, no earnings, a £10,000 windfall: nothing to the
 *      pension, £10,000 on to the ISA, under split 1 and under the plan's own routing.
 * The plants, each in a patched copy of the engine: norelief (the money landing at face value, pensionRelief's net the gross
 * and the routes sizing the gross at no relief) fails cases 1 to 6; no75 (the pension keeping its room from 75) fails case 7. --planted runs it and reads which checks fail.
 *   node research/tests/windfall-relief.test.mjs [--planted]
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SELF = fileURLToPath(import.meta.url), HERE = dirname(SELF);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['norelief', ['1', '2', '3', '4', '5', '6']], ['no75', ['7']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, WINDFALL_RELIEF_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    if (!exact) bad++;
    console.log(`plant ${plant} fails cases ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) console.log(r.stdout + r.stderr);
  }
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.WINDFALL_RELIEF_PLANT || '';
let E, tmp = null;
if (PLANT === 'no75') {
  // the age rule removed: the pension keeps its room from 75
  const src = readFileSync(join(HERE, '../engine.mjs'), 'utf8'), a = "  if (category === 'pen' && o.age0 + t >= PENSION_RELIEF_TO_AGE) return 0;\n";
  if (src.split(a).length !== 2) throw new Error('windfall-relief: the plant\'s anchor in wrapperHeadroomAtYear is not unique');
  tmp = join(HERE, '../engine-no75.tmp.mjs');
  writeFileSync(tmp, src.replace(a, ''));
  E = await import(pathToFileURL(tmp).href);
} else if (PLANT === 'norelief') {
  // the engine with the relief dropped: a patched copy beside the real one, so its own imports resolve
  // (the money landing at face value: pensionRelief's net the gross, and the routes sizing the gross at no relief)
  const src = readFileSync(join(HERE, '../engine.mjs'), 'utf8');
  const swaps = [['  const net = gross * (1 - P.reliefAtSource);\n  const reliefTotal', '  const net = gross;\n  const reliefTotal'], ['const relief = { rate: P.reliefAtSource, of:', 'const relief = { rate: 0, of:']];
  let planted = src;
  for (const [a, b] of swaps) { if (planted.split(a).length !== 2) throw new Error(`windfall-relief: the plant's anchor is not unique: ${a}`); planted = planted.replace(a, b); }
  tmp = join(HERE, '../engine-norelief.tmp.mjs');
  writeFileSync(tmp, planted);
  E = await import(pathToFileURL(tmp).href);
} else E = await import('../engine.mjs');

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
const near = (a, b, tol = 0.005) => Math.abs(a - b) <= tol;
const Y = 2028;
const planOf = (salary, age, retire, deposit, extra = {}) => E.resolveMpaa(E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: age, retireAgeSelf: retire, statePensionAge: 67, privatePensionAge: 57, statePensionSelf: 11976, terminalAge: 95, salarySelf: salary, ...extra },
  accounts: [{ id: 'pen_self', owner: 'Myself', balance: 100000, risk: 'Medium Risk' }, { id: 'isa_self', owner: 'Myself', balance: 50000, risk: 'Medium Risk' }, { id: 'other_self', owner: 'Myself', balance: 20000, risk: 'Medium Risk' }, { id: 'cash_self', owner: 'Myself', balance: 20000, risk: 'Cash Equivalents' }],
  oneOffContributions: [{ id: 'w', owner: 'Myself', category: E.AUTO_DEPOSIT, amount: 0, year: Y, transferredFrom: 'External', ...deposit }],
  spending: { targetSpend: 30000 }, config: { ...E.DEFAULT_CONFIG }
}));
const byId = entries => entries.reduce((o, x) => ({ ...o, [x.id.replace('_self', '')]: (o[x.id.replace('_self', '')] || 0) + x.amount }), {});
const show = o => Object.entries(o).map(([k, v]) => `${k} £${v.toFixed(2)}`).join(', ');
// what split 1 lands, and what the windfall pays for the pension (the windfall less what lands elsewhere)
function splitOne(ctx, A) {
  const e = ctx.autoSplit.get(Y), v = byId(e.variants[1]);
  return { v, net: A - (v.isa || 0) - (v.other || 0), refund: v.cash || 0 };
}

console.log(`windfall-relief: relief on the plan's own pension routes (the review of 9 Nov, item 4)${PLANT ? `; planted: ${PLANT}` : ''}`);
{
  const ctx = E.buildContext(planOf(0, 66, 60, { amount: 10000 })), s = splitOne(ctx, 10000), own = byId(ctx.oneOffContribs.get(Y));
  ok(1, 'no earnings, £10,000, room £3,600: split 1 puts £3,600 in the pension for £2,880, £7,120 goes on to the ISA; the plan\'s own routing the same, the rest taxable',
    near(s.v.pen, 3600) && near(s.net, 2880) && near(s.v.isa, 7120) && !s.refund && near(own.pen, 3600) && near(own.other, 7120) && !own.cash,
    `split 1: ${show(s.v)} (the pension costing £${s.net.toFixed(2)}); the plan's routing: ${show(own)}`);
}
{
  const ctx = E.buildContext(planOf(40000, 50, 67, { amount: 20000 })), s = splitOne(ctx, 20000);
  ok(2, 'pay £40,000, £20,000, room £40,000: the pension gains £25,000 for £20,000, no refund', near(s.v.pen, 25000) && near(s.net, 20000) && !s.refund, `split 1: ${show(s.v)}`);
}
{
  const ctx = E.buildContext(planOf(80000, 50, 67, { amount: 20000 })), s = splitOne(ctx, 20000);
  ok(3, 'pay £80,000 in England, £20,000: the pension gains £25,000 for £20,000, and £5,000 comes back to cash', near(s.v.pen, 25000) && near(s.net, 20000) && near(s.refund, 5000), `split 1: ${show(s.v)}`);
}
{
  const ctx = E.buildContext(planOf(40000, 58, 67, { amount: 20000 }, { mpaaAgeSelf: 57 })), s = splitOne(ctx, 20000), room = ctx.autoSplit.get(Y).room[0].pen;
  ok(4, 'the MPAA triggered, room £10,000: the pension gains £10,000 for £8,000, £12,000 goes on to the ISA', near(room, 10000) && near(s.v.pen, 10000) && near(s.net, 8000) && near(s.v.isa, 12000), `room £${room.toFixed(2)}; split 1: ${show(s.v)}`);
}
{
  const plan = planOf(0, 66, 60, { amount: 20000, category: 'Pensions' }), ctx = E.buildContext(plan);
  const now = byId(ctx.oneOffContribs.get(Y)), drips = [...ctx.stagedTransfers.entries()].sort((a, b) => a[0] - b[0]);
  const first = drips.length ? drips[0][1][0] : null, moved = drips.reduce((s, [, xs]) => s + xs.reduce((t, x) => t + x.amount, 0), 0);
  const landed = drips.reduce((s, [, xs]) => s + xs.reduce((t, x) => t + x.amount * (x.uplift || 1), 0), 0);
  // the engine's year: the drip year's step, with the GIA full and then short of the transfer, its pension against the same
  // year with the transfer taken out (the move, and its uplift on it, are all that differ before growth)
  const dy = drips.length ? drips[0][0] : null, t = dy - ctx.baseYear;
  const yearOf = (cx) => { const st = E.freshState(cx); for (let k = 0; k <= t; k++) E.stepYear(cx, st, k, 'expected'); return { st }; };
  let engine = 'not run';
  let engineOk = false;
  if (first) {
    const ctxNo = { ...ctx, stagedTransfers: new Map([...ctx.stagedTransfers].filter(([y]) => y !== dy)) };
    const full = yearOf(ctx), none = yearOf(ctxNo);
    const gain = full.st.pots.pen_self - none.st.pots.pen_self, sold = none.st.pots.other_self - full.st.pots.other_self;
    engine = `the drip year ${dy}: the pension £${gain.toFixed(2)} higher for £${sold.toFixed(2)} more sold from the GIA`;
    engineOk = sold > 0 && Math.abs(gain / sold - 1.25) < 0.02;
  }
  ok(5, 'a £20,000 deposit typed into the pension, room £3,600: £3,600 now as typed, £16,400 parked; each later transfer takes £2,880 and lands £3,600; the engine\'s year books it grossed up',
    near(now.pen, 3600) && near(now.other, 16400) && first && near(first.amount, 2880) && near(first.amount * first.uplift, 3600) && !(first.refundPer > 0) && near(moved, 16400, 0.01) && near(landed, 20500, 0.01) && engineOk,
    `now ${show(now)}; ${drips.length} transfers, the first ${dy}: £${first ? first.amount.toFixed(2) : '-'} landing £${first ? (first.amount * (first.uplift || 1)).toFixed(2) : '-'}; in all £${moved.toFixed(2)} moved, £${landed.toFixed(2)} landed; ${engine}`);
}
{
  // 6, restated by D69 (the review's case 6 contradicted its step 1.2: S210's own Auto deposit routes into its pension). Where
  // no route into a pension is made from the household's money, every table is item 3's, bit for bit: S116 (no deposit); S210
  // with its deposit removed, and with it typed into the taxable account. S210 as the library enters it: its 2033 route to the
  // pound (£3,600 lands for £2,880; £168,120 goes on, where item 3 sent £167,400 on)
  // taken on item 3's code alone (b954f145878ff460..., f9a4e63e00f6958e..., c7785c6fc3ecdcb4...), and re-taken on D73's candidate (11 Nov,
  // D81 (A), D83): the sweep to the ISA and the solve on anchors move these tables and nothing else in the port does (with both keys
  // out each solve gives item 3's figure: results-d73-digests.txt)
  const ITEM3 = {
    S116: '81e774a399c6b29e6d39151ece157e6ad48c6fc407606f782b83d8c96ce32b13',
    'S210, its deposit removed': '1daa7851917f000a97479b09485392689113801c740c484dc157fc4e825e9574',
    'S210, its deposit typed into the taxable account': 'bb84262fb4db77b4e24c0c57252471064c73c2c16dc7b9b273cec9c3012f274e'
  };
  const { buildScenarios } = await import('../policy-study/scenarios.mjs');
  const lib = id => buildScenarios().find(s => s.id === id).plan, s210 = lib('S210');
  const plans = { S116: lib('S116'), 'S210, its deposit removed': { ...s210, oneOffContributions: [] }, 'S210, its deposit typed into the taxable account': { ...s210, oneOffContributions: s210.oneOffContributions.map(x => ({ ...x, category: E.CATEGORY_LABEL.other })) } };
  const own = byId(E.buildContext(E.resolveMpaa(E.normalizePlan(s210))).oneOffContribs.get(2033));
  const route = near(own.pen, 3600) && near(own.other, 168120), routeTxt = `S210's 2033 route: ${show(own)}`;
  if (PLANT) ok(6, `S116 and S210 as before (the tables not solved under the plant); ${routeTxt}`, route);
  else {
    const M = await import('../../src/solver/model.js'), { solveForApp } = await import('../../src/solverApp.js'), { tablesOf, digestOf } = await import('../../src/solverDigest.js');
    const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
    const got = {};
    for (const k of Object.keys(ITEM3)) got[k] = await digestOf(tablesOf(solveForApp(E, M, E.normalizePlan(plans[k]), LIGHT)));
    const same = Object.keys(ITEM3).every(k => got[k] === ITEM3[k]);
    ok(6, 'no route into a pension from the household\'s money: S116, and S210 with its deposit removed and typed into the taxable account, every table as on item 3\'s code, bit for bit; S210 as entered, its 2033 route to the pound',
      same && route, `${Object.keys(ITEM3).map(k => `${k} ${got[k].slice(0, 16)} (item 3's ${ITEM3[k].slice(0, 16)})`).join('; ')}; ${routeTxt}`);
  }
}
{
  // 7. no relief and no room for a one-off deposit from 75 (D69): aged 76 in 2028, no earnings, a £10,000 windfall: nothing to the
  // pension, £10,000 goes on (to the ISA, its room £20,000), under split 1 and under the plan's own routing
  const ctx = E.buildContext(planOf(0, 74, 60, { amount: 10000 })), s = splitOne(ctx, 10000), own = byId(ctx.oneOffContribs.get(Y)), room = ctx.autoSplit.get(Y).room[0].pen;
  ok(7, 'aged 76, no earnings, £10,000: nothing to the pension, £10,000 on to the ISA, split 1 and the plan\'s own routing', room === 0 && !s.v.pen && near(s.v.isa, 10000) && !own.pen && near(own.isa, 10000),
    `the pension's room £${room.toFixed(2)}; split 1: ${show(s.v)}; the plan's routing: ${show(own)}`);
}
if (tmp) rmSync(tmp, { force: true });
console.log(`\nwindfall-relief: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
