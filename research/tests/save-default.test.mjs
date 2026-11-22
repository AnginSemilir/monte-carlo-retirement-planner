/*
 * THE SAVINGS SPLIT AS A WORKING SINGLE'S DEFAULT (D138; the savings split's v2, registered on seed 7025 and read once: PASS,
 * research/solver/results-save-v2.txt; its registration's Outcomes: `saveSplit: true` joins the candidate for singles who work
 * and save, a couple's solves kept off it). Light settings, each solve as the page makes it (src/solverApp.js solveForApp):
 *   1. the candidate: research/solver/candidate.json and the app's APP_CANDIDATE carry `saveSplit: true` and `saveIsaFirst:
 *      'selfEmployed'`, the two keys D138 adds to the candidate before it (candidate.mjs BEFORE_D138_OPTS); the two the same key
 *      for key;
 *   2. a single who works and saves (S188, an employee taxed in Scotland, five working years): its record 'on', its menu each
 *      move and its save-1 copy (save 1 the pension first, save 2 the ISA first, src/App.jsx saveSplitRoutes; check 7 has the
 *      ISA first), and its first year's move placing the year's saving;
 *   3. a single with no working year (S002): its record 'no year to choose' and its tables those of the candidate before D138
 *      to the bit (by digest): the default reaches no table of a retired single;
 *   4. a couple who work and save (S181) keeps off the split on both of the page's routes, each solved with the partner's age:
 *      the household's one table (src/solverCouple.js householdCut at 'pensionsPA', step 8's port, D136) and today's route,
 *      each person's table on the pots' share (couplePlans, as a couple the household plan refuses is solved). Each plan has
 *      a saving to place in its first year (its context's saveSplitAt), so the split would act there; no table records it
 *      and none has a save copy on its menu;
 *   5. the page's words for a year's saving: the move taken apart names it (src/solverStrategy.js partsOf: a save copy's
 *      `save`, its base none); this year's actions list it with its skip, the best-ranked move placing the saving otherwise,
 *      and that skip's cost on the paths (actionsOf), worded (src/solverWords.js actionWords); the next years' rows and the
 *      ledger name it (aheadWords, ledgerWords); a move with no save reads word for word as before;
 *   6. the chooser under the split, every world (a defect found by the fast tier on this change: chooser-share.test.mjs on
 *      S224 under the split, the share check parting at a copy in a year the copies are left out): each world's table carries
 *      the solve's moves a year (src/solver/solve.js, the solve's finish), so in a year the copies are left out every scorer
 *      makes them unchoosable; with the share check on (CHOOSER.check), the year's shared flows and scoreMoves agree on every
 *      move's score, tax and estate at every decision of S188's 20 paths (the terms the plant parts), and no decision there
 *      picks a copy, which no decision could do before the fix either (the centre world, the solve itself, carried the
 *      moves a year, and the mixture fails a move that fails in any table: the reviewer on D138's change of default, MINOR
 *      3), so that count is a guard the plant cannot fail;
 *   7. the ISA first held back for an employee (D137 (4); src/solver/solve.js saveOn): the app asks for the pension figure
 *      gross, the employer's part included, and the split would move it as the employee's own. S188, an employee: no save-2
 *      copy on its menu, its record 'held back (an employee)'; S184, self-employed (five working years): both copies, its record
 *      'offered'; S188 at the registered configuration (the hold unset): both copies, as the split's v2 ran it;
 *   8. the law's price in the split's routes (D137 (4), test K's outcome; src/App.jsx SAVE_NIC_CAP): from April 2029 an
 *      employee's salary sacrifice is relieved of employee NIC on its first £2,000 a year alone. S188, an employee: each
 *      working year's budget (saveSplitRoutes' record, the plan's pension saving at its net cost plus its ISA saving) against a
 *      hand calculation from the engine's income tax and NIC (incomeTax, nicFor), the NIC relief on the first £2,000 alone
 *      from 2029 and in full before; the years before 2029 the same with the cap on and off, and the years from 2029
 *      dearer with it on, the pension first's route then the flipped plan's (income tax relief alone) to the penny, the
 *      plan sacrificing past the £2,000 already; S184, self-employed: every year the same with it on and off; and the net cost and the gross-up
 *      without a cap the same to the bit as before, on a grid of salaries and contributions.
 *   9. a year has a choice only where a route offered differs from the plan (the reviewer on the change of default, finding
 *      2; src/App.jsx saveSplitRoutes' `differs`, src/solver/solve.js saveOn, src/solver/fast.js the live years): S188 saving
 *      into the pension alone, and S188 with its pension saving filling its room, each under the hold: no save copy, its
 *      record 'no year to choose', its tables the candidate before D138's to the bit; the first at the registered
 *      configuration (the hold unset): its copies, the ISA first differing; S188 as entered under the hold: a working year's
 *      copies live exactly where the pension first differs from the plan.
 *  10. the same year by year (the reviewer on the change of default's second look, finding 1: on S188 both routes differ in
 *      every working year, so check 9 cannot see the forward run's filter): S242, an employee, under the hold, has a working
 *      year where the ISA first alone differs from the plan (plan year 12); its copies live exactly in the years where the
 *      pension first differs, so not in that one; at the registered configuration (the hold unset) that year live.
 * Plants (--planted; each wants exactly the checks named): src/solverApp.js 'couplesplit' (a couple's solve keeps the split:
 * check 4), src/solverStrategy.js 'nosavepart' (a move's save left out of its parts: check 5), src/solver/solve.js
 * 'nattables' (the worlds' tables left without the moves a year, as before the fix: check 6) and 'noisahold' (an employee
 * offered the ISA first: checks 7, 9 and 10, checks 9's and 10's employees being under the hold, so that offered the ISA
 * first their moved saving differs from the plan and their copies are rightly there), src/App.jsx 'nocap' (the split's routes priced
 * without the cap: check 8), src/solver/solve.js 'anyroute' (the year read over both routes, whatever is offered:
 * check 9) and src/solver/fast.js 'anyyear' (the forward run's live years read over both routes: check 10).
 *   node research/tests/save-default.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp, APP_CANDIDATE, PLANT as APP_PLANT } from '../../src/solverApp.js';
import { householdCut, couplePlans } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { firstMove, skipsOf, actionsOf, partsOf, solvedContext, runPath, PLANT as STRATEGY_PLANT } from '../../src/solverStrategy.js';
import { CHOOSER, SAVE_ROUTES } from '../../src/solver/solve.js';
import { SAVE_YEAR } from '../../src/solver/fast.js';
import { PART_WORDS, actionWords, aheadWords, ledgerWords } from '../../src/solverWords.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { CANDIDATE_OPTS, BEFORE_D138_OPTS, D138_KEYS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['couplesplit', ['4']], ['nosavepart', ['5']], ['nattables', ['6']], ['noisahold', ['7', '9', '10']], ['nocap', ['8']], ['anyroute', ['9']], ['anyyear', ['10']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, SAVE_DEFAULT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d+)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted exactly ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const guard = (n, f) => { try { f(); } catch (e) { ok(n, false, `threw: ${e.message}`); } };
const PLANT = process.env.SAVE_DEFAULT_PLANT || '';
if (PLANT === 'couplesplit') APP_PLANT.rule = PLANT;
if (PLANT === 'nosavepart') STRATEGY_PLANT.rule = PLANT;
if (PLANT === 'nattables') CHOOSER.plant = PLANT;
if (PLANT === 'noisahold') SAVE_ROUTES.plant = PLANT;
if (PLANT === 'nocap') E.SAVE_NIC_CAP.on = false;
if (PLANT === 'anyroute') SAVE_ROUTES.plant = PLANT;
if (PLANT === 'anyyear') SAVE_YEAR.plant = PLANT;
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const lib = buildScenarios(), planOf = id => structuredClone(lib.find(s => s.id === id).plan);
const js = x => JSON.stringify(x);
const choiceAt0 = plan => { const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(plan))); return !!(ctx.saveSplitAt && ctx.saveSplitAt(0)); };
const noSplit = r => !r.meta.saveSplit && !r.actions.some(a => a.save);
const t0 = Date.now(), secs = () => `${((Date.now() - t0) / 1000).toFixed(0)} s`;

// 1. the candidate
{
  const keys = o => Object.keys(o).sort();
  const sameKeys = js(keys(CANDIDATE_OPTS)) === js(keys(APP_CANDIDATE)) && keys(CANDIDATE_OPTS).every(k => js(CANDIDATE_OPTS[k]) === js(APP_CANDIDATE[k]));
  const added = keys(CANDIDATE_OPTS).filter(k => !(k in BEFORE_D138_OPTS));
  const rest = keys(BEFORE_D138_OPTS).every(k => js(BEFORE_D138_OPTS[k]) === js(CANDIDATE_OPTS[k]));
  ok('1. the candidate', CANDIDATE_OPTS.saveSplit === true && APP_CANDIDATE.saveSplit === true && CANDIDATE_OPTS.saveIsaFirst === 'selfEmployed' && APP_CANDIDATE.saveIsaFirst === 'selfEmployed' && sameKeys && js(added) === js(['saveIsaFirst', 'saveSplit']) && js(D138_KEYS) === js(['saveSplit', 'saveIsaFirst']) && rest,
    `candidate.json saveSplit ${CANDIDATE_OPTS.saveSplit} saveIsaFirst ${CANDIDATE_OPTS.saveIsaFirst}, APP_CANDIDATE saveSplit ${APP_CANDIDATE.saveSplit} saveIsaFirst ${APP_CANDIDATE.saveIsaFirst}; the two ${sameKeys ? 'the same key for key' : 'DIFFERENT'}; added to the candidate before D138: ${added.join(', ') || 'none'}; every other key ${rest ? 'as before' : 'MOVED'}`);
}

// 2. a single who works and saves
let S188 = null;
guard('2. a working single', () => {
  const plan = planOf('S188'), r = solveForApp(E, M, plan, light), base = r.actions.filter(a => !a.save), copies = r.actions.filter(a => a.save);
  const f = firstMove(E, r), a0 = r.actions[f.mv.index];
  S188 = { plan, r, a0 };
  ok('2. a working single', r.meta.saveSplit === 'on' && copies.filter(a => a.save === 1).length === base.length && copies.every(a => a.save === 1 || a.save === 2) && a0.save > 0,
    `S188 (${secs()}): its record '${r.meta.saveSplit}'; ${r.actions.length} moves, ${base.length} and ${copies.length} save copies; the first year's move '${a0.label}', save ${a0.save || 0}`);
});

// 3. a single with no working year
await (async () => {
  try {
    const plan = planOf('S002'), on = solveForApp(E, M, plan, light), off = solveForApp(E, M, plan, { ...light, research: { ...light.research, saveSplit: undefined } });
    const dOn = await digestOf(tablesOf(on)), dOff = await digestOf(tablesOf(off));
    ok('3. a retired single', on.meta.saveSplit === 'no year to choose' && off.meta.saveSplit === undefined && dOn === dOff && on.actions.length === off.actions.length && !choiceAt0(plan),
      `S002 (${secs()}): its record '${on.meta.saveSplit}' (the candidate before D138: ${off.meta.saveSplit === undefined ? 'none' : off.meta.saveSplit}); ${on.actions.length} and ${off.actions.length} moves; its tables ${dOn === dOff ? 'the same to the bit' : 'DIFFERENT'} (${dOn.slice(0, 12)}, ${dOff.slice(0, 12)})`);
  } catch (e) { ok('3. a retired single', false, `threw: ${e.message}`); }
})();

// 4. a couple keeps off the split on both routes
guard('4. a couple', () => {
  const plan = planOf('S181'), cut = householdCut(E, M, plan, 'pensionsPA'), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...light, ageWith: cut.ageWith }), b.paK);
  const cp = couplePlans(E, plan, { shareRule: 'pots' }), P = {};
  for (const who of ['self', 'part']) P[who] = solveForApp(E, M, cp.plans[who], { ...light, ageWith: cp.ageWith[who] });
  const choice = { household: choiceAt0(cut.hplan), self: choiceAt0(cp.plans.self), part: choiceAt0(cp.plans.part) };
  const off = { household: noSplit(H), self: noSplit(P.self), part: noSplit(P.part) };
  const says = (w, r) => `${w} ${off[w] ? 'without the split' : `WITH IT ('${r.meta.saveSplit}', ${r.actions.filter(a => a.save).length} save copies)`}${choice[w] ? '' : ' (no saving to place in year 0)'}`;
  ok('4. a couple', off.household && off.self && off.part && choice.household && (choice.self || choice.part),
    `S181 (${secs()}), each solved with the partner's age: the household's one table at 'pensionsPA' ${says('household', H)}; today's route, ${says('self', P.self)}, ${says('part', P.part)}`);
});

// 5. the page's words for a year's saving
guard('5. the words', () => {
  if (!S188) throw new Error('check 2 did not solve S188');
  const { plan, r, a0 } = S188;
  // the menu is each move, then each move's save-1 copy, then each move's save-2 copy (solve.js withSaveCopies)
  const n0 = r.actions.filter(a => !a.save).length, ci = r.actions.findIndex(a => a.save === 1), bi = ci - n0;
  const pc = partsOf(r.actions[ci], r.c.acts[ci]), pb = bi >= 0 && !r.actions[bi].save && r.actions[ci].label.startsWith(r.actions[bi].label) ? partsOf(r.actions[bi], r.c.acts[bi]) : null;
  const apart = pc.save === 1 && pb !== null && !('save' in pb) && js({ ...pc, save: undefined }) === js(pb);
  const sk = skipsOf(E, r), sx = sk.list.find(x => x.part === 'save');
  const skipOk = !!sx && sx.value === a0.save && sx.skip !== null && (r.actions[sx.skip].save || 0) !== a0.save;
  const acts = actionsOf(E, r, plan, { n: 40 }), ax = acts.actions.find(x => x.part === 'save');
  const wctx = { target: 30000, fmt: v => `£${Math.round(v).toLocaleString('en-GB')}` };
  const aw = ax ? actionWords(ax, wctx) : null;
  const listed = !!ax && ax.skip !== null && Number.isFinite(ax.cost) && aw.what === PART_WORDS.save(a0.save) && /^Pay your saving into your (pension|ISA) first, then your (ISA|pension)/.test(aw.what);
  const row = { year: 2027, age: 55, spend: 0, parts: { level: 1, draw: 'none', isaFirst: true, harvest: null, tierPen: 0, tierIsa: 0, save: 1 }, swept: null };
  const ah = aheadWords(row, wctx), ahNone = aheadWords({ ...row, parts: { ...row.parts, save: undefined } }, wctx);
  const rows = ah.lines[0] === PART_WORDS.save(1) && ah.spend === 'still working' && js(ahNone.lines) === js(['nothing to change']);
  const before = { level: 0.9, draw: 'pa', isaFirst: true, harvest: null, tierPen: 1, tierIsa: 0 };
  const ledger = ledgerWords({ ...before, save: 2 }, false) === 'saving: ISA first · pension first, to the personal allowance · pension 1 step safer'
    && ledgerWords(before, true) === 'spend 90% · pension first, to the personal allowance · pension 1 step safer' && ledgerWords({ ...before, draw: 'none', tierPen: 0 }, false) === 'as planned';
  ok('5. the words', apart && skipOk && listed && rows && ledger,
    `S188 (${secs()}): a save copy's parts ${apart ? `name it (save ${pc.save}), its base's none` : `DO NOT (${js(pc)})`}; this year's skips ${skipOk ? `list the save, its skip '${r.actions[sx.skip].label}' save ${r.actions[sx.skip].save || 0}` : 'DO NOT list the save'}; `
    + `this year's actions ${listed ? `say "${aw.what}" (${aw.cost})` : 'DO NOT word it'}; the rows ${rows ? 'name it and a year without it reads "nothing to change"' : `DO NOT (${js(ah.lines)})`}; the ledger ${ledger ? 'names it and a move with no save reads as before' : 'DOES NOT'}`);
});

// 6. the chooser under the split, every world: each world's table scores the year's moves alone
guard('6. the worlds under the split', () => {
  if (!S188) throw new Error('check 2 did not solve S188');
  const { r } = S188, worlds = r.mix ? r.mix.tables : [], n = r.actions.length;
  const live = t => r.nAt[Math.min(Math.max(t, 0), r.nAt.length - 1)];
  const carried = worlds.length > 1 && worlds.every(w => w.nAt === r.nAt);
  const sc = solvedContext(E, r), T = sc.totalYears, paths = E.pathsForSeed(7002, 20, T), left = [...Array(T + 1).keys()].filter(t => live(t) < n).length;
  let threw = null, copies = 0, decisions = 0;
  CHOOSER.check = true;
  try {
    for (const zs of paths) runPath(E, { ...sc, policyOverride: { ...sc.policyOverride, choose(st, t, held) { const mv = sc.policyOverride.choose(st, t, held); decisions++; if (mv && mv.index >= live(t)) copies++; return mv; } } }, zs);
  } catch (e) { threw = e.message; } finally { CHOOSER.check = false; }
  ok('6. the worlds under the split', carried && !threw && copies === 0 && left > 0,
    `S188 (${secs()}): ${worlds.length} worlds, each ${carried ? 'carrying the solve\'s moves a year' : 'WITHOUT the solve\'s moves a year'}; the copies left out in ${left} of ${T + 1} years; with the share check on, ${threw ? `it THREW: ${threw.slice(0, 160)}` : `every move's score, tax and estate agree at ${decisions} decisions of ${paths.length} paths`}; a copy picked in a year it is left out at ${copies}`);
});

// 7. the ISA first held back for an employee (D138; D137 (4)): an employee's split offers the plan's own and the pension first
guard('7. the hold', () => {
  if (!S188) throw new Error('check 2 did not solve S188');
  const e = S188.r, s = solveForApp(E, M, planOf('S184'), light), reg = solveForApp(E, M, planOf('S188'), { ...light, research: { ...light.research, saveIsaFirst: undefined } });
  const nBase = r => r.actions.filter(a => !a.save).length, nSave = (r, v) => r.actions.filter(a => a.save === v).length;
  const emp = nSave(e, 1) === nBase(e) && nSave(e, 2) === 0 && e.meta.saveIsaFirst === 'held back (an employee)';
  const self = nSave(s, 1) === nBase(s) && nSave(s, 2) === nBase(s) && s.meta.saveIsaFirst === 'offered';
  const registered = nSave(reg, 1) === nBase(reg) && nSave(reg, 2) === nBase(reg) && reg.meta.saveIsaFirst === undefined && reg.meta.saveSplit === 'on';
  const said = r => `${nBase(r)} moves, ${nSave(r, 1)} pension-first and ${nSave(r, 2)} ISA-first copies, its record '${r.meta.saveIsaFirst}'`;
  ok('7. the hold', emp && self && registered,
    `(${secs()}) S188, an employee: ${said(e)}; S184, self-employed: ${said(s)}; S188 at the registered configuration (the hold unset): ${said(reg)}`);
});

// 8. the law's price in the split's routes: the 2029 cap on salary sacrifice's NIC relief (D138; D137 (4))
guard('8. the 2029 cap', () => {
  const prep = plan => E.resolveMpaa(E.normalizePlan(plan));
  const routes = id => { const ctx = E.buildContext(prep(planOf(id))), o = ctx.owners.find(x => x.key === 'self'), out = [];
    for (let t = 0; t <= ctx.totalYears; t++) { const R = ctx.saveSplitAt && ctx.saveSplitAt(t); if (R) out.push({ t, year: ctx.baseYear + t, R, salary: E.salaryAtYear(o, t), ctx, o }); } return out; };
  const was = E.SAVE_NIC_CAP.on, on = routes('S188');
  E.SAVE_NIC_CAP.on = false; const off = routes('S188'), selfOff = routes('S184');
  E.SAVE_NIC_CAP.on = was; const selfOn = routes('S184');
  const cap = E.SAVE_NIC_CAP.amount, from = E.SAVE_NIC_CAP.from;
  // the hand calculation: the net cost of a gross contribution g to an employee on salary s, NIC relieved on min(g, c)
  const hand = (g, s, P, c) => g - (E.incomeTax(s, P) - E.incomeTax(s - g, P)) - (E.nicFor(s, P) - E.nicFor(s - Math.min(g, c), P));
  let worst = 0, before = 0, after = 0, dearer = 0;
  for (const r of on) {
    const P = r.ctx.P, acc = Object.fromEntries(r.ctx.accounts.map(a => [a.id, a])), pa = acc[r.o.ids.pen], ia = acc[r.o.ids.isa];
    const P0 = pa ? E.contribAtYear(pa, r.t) : 0, I0 = ia ? E.contribAtYear(ia, r.t) : 0, c = r.year >= from ? cap : Infinity;
    const want = (P0 > 0 ? hand(P0, r.salary, P, c) : 0) + I0, got = r.R.owners[0].budget;
    worst = Math.max(worst, Math.abs(got - want));
    const o2 = off.find(x => x.t === r.t);
    if (r.year < from) { if (JSON.stringify(r.R) === JSON.stringify(o2 && o2.R)) before++; }
    else { after++; if (o2 && got > o2.R.owners[0].budget + 0.005) dearer++; }
  }
  const nBefore = on.filter(r => r.year < from).length;
  // from 2029 the pension first's route under the cap is the flipped plan's (income tax relief alone, test K's lever) to the
  // penny: the plan already sacrifices past the £2,000 the cap relieves (the reviewer at K's read, finding 1)
  const fl = (() => { const p = planOf('S188'); p.demographics = { ...p.demographics, employmentSelf: 'self-employed' }; const ctx = E.buildContext(prep(p)); return t => ctx.saveSplitAt(t); })();
  let route = 0, routeSame = 0;
  for (const r of on.filter(x => x.year >= from)) { const b = fl(r.t), ids = r.o.ids; route++; if (b && [ids.pen, ids.isa, ids.other].every(id => Math.abs(r.R.variants[1][id] - b.variants[1][id]) < 0.01)) routeSame++; }
  const selfSame = selfOn.length > 0 && selfOn.length === selfOff.length && selfOn.every((r, i) => JSON.stringify(r.R) === JSON.stringify(selfOff[i].R));
  // the net cost and the gross-up without a cap: the same to the bit as the call without the argument
  const P = on[0].ctx.P;
  let grid = 0, gridSame = 0;
  for (const s of [15000, 29500, 50000, 77500, 130000]) for (const g of [500, 2000, 3540, 9300, 20000]) {
    grid++; if (Object.is(E.netCostOfPensionContrib(g, s, P, false), E.netCostOfPensionContrib(g, s, P, false, Infinity)) && Object.is(E.grossUpNet(g, s, P, 60000, false), E.grossUpNet(g, s, P, 60000, false, Infinity))) gridSame++;
  }
  ok('8. the 2029 cap', on.length > 0 && worst < 1e-6 && after > 0 && before === nBefore && dearer === after && route === after && routeSame === route && selfSame && gridSame === grid,
    `S188, an employee: ${on.length} working years with a saving to place (${nBefore} before ${from}, ${after} from it); each year's budget against the hand calculation, the worst gap £${worst.toExponential(2)}; the years before ${from} ${before === nBefore ? 'the same with the cap on and off' : `DIFFERENT in ${nBefore - before}`}; from ${from} dearer with it on in ${dearer} of ${after}, and the pension first's route the flipped plan's to the penny in ${routeSame} of ${route}; S184, self-employed: ${selfSame ? `every year the same with it on and off (${selfOn.length})` : 'DIFFERENT'}; without a cap the net cost and the gross-up ${gridSame === grid ? `the same to the bit (${grid} cases)` : `DIFFERENT in ${grid - gridSame} of ${grid}`}`);
});

// 9. a year has a choice only where a route offered differs from the plan (D138; the reviewer on the change of default, 2)
await (async () => {
  try {
    const edit = (f) => { const p = planOf('S188'); for (const a of p.accounts) f(a); return p; };
    const penOnly = edit(a => { if (a.id === 'isa_self') a.contrib = 0; }), filled = edit(a => { if (a.id === 'pen_self') a.contrib = 60000; });
    const off = { ...light, research: { ...light.research, saveSplit: undefined, saveIsaFirst: undefined } };
    const kept = async plan => { const on = solveForApp(E, M, plan, light), before = solveForApp(E, M, structuredClone(plan), off); return { on, same: (await digestOf(tablesOf(on))) === (await digestOf(tablesOf(before))) && on.actions.length === before.actions.length }; };
    const a = await kept(penOnly), b = await kept(filled);
    const none = x => !x.on.actions.some(m => m.save) && x.on.meta.saveSplit === 'no year to choose' && x.same;
    const reg = solveForApp(E, M, structuredClone(penOnly), { ...light, research: { ...light.research, saveIsaFirst: undefined } });
    const regOn = reg.meta.saveSplit === 'on' && reg.actions.some(m => m.save === 2);
    // S188 as entered under the hold: the copies live exactly in the working years where the pension first differs
    const r = S188 ? S188.r : solveForApp(E, M, planOf('S188'), light), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(planOf('S188'))));
    let liveYears = 0, d1Years = 0, agree = true;
    for (let t = 0; t < r.nAt.length; t++) { const live = r.nAt[t] === r.actions.length, R = ctx.saveSplitAt(t), d1 = !!(R && R.differs[1]); if (live) liveYears++; if (d1) d1Years++; if (live !== d1) agree = false; }
    ok('9. a year to choose', none(a) && none(b) && regOn && agree && liveYears > 0,
      `S188 saving into the pension alone, under the hold: ${a.on.actions.filter(m => m.save).length} save copies, its record '${a.on.meta.saveSplit}', its tables ${a.same ? 'the candidate before D138\'s to the bit' : 'DIFFERENT'}; with its pension saving filling its room: ${b.on.actions.filter(m => m.save).length} copies, '${b.on.meta.saveSplit}', ${b.same ? 'the same to the bit' : 'DIFFERENT'}; the first at the registered configuration: '${reg.meta.saveSplit}', ${reg.actions.filter(m => m.save === 2).length} ISA-first copies; S188 as entered: its copies live in ${liveYears} years, the pension first differing in ${d1Years}${agree ? ', the same years' : ', NOT THE SAME YEARS'} (${secs()})`);
  } catch (e) { ok('9. a year to choose', false, `threw: ${e.message}`); }
})();

// 10. the same year by year: a working year where the ISA first alone differs is not live under the hold (S242)
await (async () => {
  try {
    const r = solveForApp(E, M, planOf('S242'), light), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(planOf('S242'))));
    let isaOnly = 0, liveYears = 0, agree = true;
    const at = [];
    for (let t = 0; t < r.nAt.length; t++) {
      const R = ctx.saveSplitAt(t), d1 = !!(R && R.differs[1]), d2 = !!(R && R.differs[2]), live = r.nAt[t] === r.actions.length;
      if (R && !d1 && d2) { isaOnly++; at.push(t); }
      if (live) liveYears++;
      if (live !== d1) agree = false;
    }
    const held = r.meta.saveIsaFirst === 'held back (an employee)';
    // the same year at the registered configuration (the hold unset, both routes offered): live
    const reg = solveForApp(E, M, planOf('S242'), { ...light, research: { ...light.research, saveIsaFirst: undefined } });
    const regLive = at.length > 0 && at.every(t => reg.nAt[t] === reg.actions.length);
    ok('10. the same year by year', held && isaOnly > 0 && agree && liveYears > 0 && regLive,
      `S242 (${secs()}), an employee under the hold (its record '${r.meta.saveIsaFirst}'): ${isaOnly} working year${isaOnly === 1 ? '' : 's'} where the ISA first alone differs from the plan (plan year ${at.join(', ') || 'none'}); the copies live in ${liveYears} years, ${agree ? 'exactly those where the pension first differs' : 'NOT those where the pension first differs'}; at the registered configuration that year ${regLive ? 'live' : 'NOT live'}`);
  } catch (e) { ok('10. the same year by year', false, `threw: ${e.message}`); }
})();

console.log(`\n${fail ? 'FAILED' : 'ALL PASS'}: ${pass} passed, ${fail} failed (${secs()})`);
process.exit(fail ? 1 : 0);
