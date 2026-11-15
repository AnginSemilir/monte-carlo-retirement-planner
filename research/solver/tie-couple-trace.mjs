/*
 * THE COUPLES' TIE RULE: S311F'S DECIDING PATHS TRACED (TIE-C.md; D97 (2); EXPLORATORY, seed 7002), written after the read and
 * deciding nothing. S311F is solved as audit-tie-couple.mjs solves it (the same plan, arm A's policy name and MPAA ages, the
 * couples' candidate at 45 points, each arm's margin), and each arm is run by the engine year by year on the paths named,
 * as audit-phase4.mjs runPath runs them; each path's pot and lifetime tax are first checked against the stored arrays. For
 * each tie arm against CANDS it prints: the first plan year the two arms' moves differ; the first plan year the tiers held
 * differ, the tiers each person holds before and after it, the household's taxable account and ISA the year before and the
 * tax paid before and after; and what CANDS's own chooser picks at the tie arm's state in that year (does it take the same
 * tiers?). Then, answering the reviewer's second round: the decomposition, the tie arm with the first person's tiers held
 * where CANDS holds them from that year and CANDS with the step forced on it, and the dividend tax each year after the step.
 *   node research/solver/tie-couple-trace.mjs [paths, e.g. 4468,5461]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { PANEL_FILE, solverPlan } from './audit-couples.mjs';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ID = 'S311F', SEED = 7002, N = 8000, PTS = 45, W = 0.02, MARGINS = { CANDS: undefined, TIE5: 1e-5, TIE4: 1e-4 };
const PATHS = (process.argv[2] || '4468,5461').split(',').map(Number);
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`;
const tiersOf = th => ['self', 'part'].map(w => `${th && th[w] ? th[w].pen || 0 : 0}/${th && th[w] ? th[w].isa || 0 : 0}`).join(' and ');
const moveTiers = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' and ');
const moveKey = j => JSON.stringify(j ? { s: j.spendLevel, x: j.split, p: j.perOwner, st: j.steps } : null);

const h = readPanel(PANEL_FILE).find(x => x.id === ID);
const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const hp = solverPlan('CANDC', h.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
const memo = new Map();
const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: PTS, ageWith: o.partnerAge0, research: { tieAboveCap: undefined } })); return memo.get(k); };
const t0 = Date.now();
const cps = Object.fromEntries(Object.entries(MARGINS).map(([arm, m]) => [arm, CPL.solveCouple(E, M, hp, { shareRule: 'pots', solveOne, ...(m !== undefined ? { tieJoint: m } : {}) })]));
const stored = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', 'tie-couple-7002', `${ID}.json.gz`))).toString());
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
console.log(`THE COUPLES' TIE RULE, ${ID}'S DECIDING PATHS TRACED (EXPLORATORY, written after the read, deciding nothing): solved in ${((Date.now() - t0) / 1000).toFixed(0)} s, caps ${gbp(cps.CANDS.tables.self.estateCap)} and ${gbp(cps.CANDS.tables.part.estateCap)}; paths ${PATHS.join(', ')} of seed ${SEED}`);

// one arm on one path, year by year: each year's move, the tiers held after it, the year's tax and the household's wrappers
const ctxOf = cp => E.buildContext(CPL.withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
// force = { from, self }: from plan year `from` the first person's tier fields in each move replaced by `self` (the
// decomposition: the reviewer's second round, its one finding)
function trace(arm, k, force = null) {
  const ctx = ctxOf(cps[arm]), T = ctx.totalYears, all = E.pathsForSeed(SEED, N, T), zs = Float64Array.from(all[k]), Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
  const pol = ctx.policyOverride, choose = pol.choose.bind(pol), years = [];
  let move = null;
  pol.choose = (s, t) => { let mv = choose(s, t); if (force && mv && t >= force.from) mv = { ...mv, perOwner: { ...mv.perOwner, self: { ...mv.perOwner.self, ...force.self } } }; move = mv; return mv; };
  const state = E.freshState(ctx);
  let tax = 0, last = null;
  for (let t = 0; t <= T; t++) {
    const held = JSON.parse(JSON.stringify(state.tierHeld || {})), before = JSON.parse(JSON.stringify(state));
    move = null;
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    tax += row.taxPaid + (row.cgtPaid || 0); last = row;
    years.push({ t, move, before, heldBefore: held, heldAfter: JSON.parse(JSON.stringify(state.tierHeld || {})), tax: row.taxPaid + (row.cgtPaid || 0), divTax: row.dividendTax || 0, other: row.other, isa: row.isas, total: row.totalCombined, ageSelf: row.ageSelf });
  }
  pol.choose = choose;
  return { ctx, years, wealth: Math.max(0, last.totalCombined), tax };
}

for (const k of PATHS) {
  const base = trace('CANDS', k);
  const check = arm => { const r = arm === 'CANDS' ? base : trace(arm, k), sp = dec(stored.arms[arm].pot, Float64Array)[k], st = dec(stored.arms[arm].tax, Float64Array)[k]; return { r, same: r.wealth === sp && r.tax === st, sp, st }; };
  const c0 = check('CANDS');
  console.log(`\npath ${k}: CANDS's pot ${gbp(base.wealth)} and lifetime tax ${gbp(base.tax)}, the stored arrays' ${c0.same ? 'the same to the penny' : `NOT the same (${gbp(c0.sp)}, ${gbp(c0.st)})`}`);
  for (const arm of ['TIE5', 'TIE4']) {
    const { r, same } = check(arm), Ys = r.years;
    const firstMove = Ys.findIndex((y, t) => moveKey(y.move) !== moveKey(base.years[t].move));
    const firstTier = Ys.findIndex((y, t) => tiersOf(y.heldAfter) !== tiersOf(base.years[t].heldAfter));
    console.log(`  ${arm}: its pot ${gbp(r.wealth)} (${(100 * (r.wealth / base.wealth - 1)).toFixed(1)}%) and lifetime tax ${gbp(r.tax)} (${r.tax >= base.tax ? '+' : ''}${gbp(r.tax - base.tax)}), the stored arrays' ${same ? 'the same to the penny' : 'NOT the same'}`);
    console.log(`    the moves first differ in plan year ${firstMove < 0 ? 'none' : firstMove}`);
    if (firstTier < 0) { console.log('    the tiers held never differ'); continue; }
    const t = firstTier, y = Ys[t], b = base.years[t], p = Ys[t - 1], pb = base.years[t - 1];
    const taxTo = (Z, u) => Z.slice(0, u).reduce((s, x) => s + x.tax, 0), taxFrom = (Z, u) => Z.slice(u).reduce((s, x) => s + x.tax, 0);
    console.log(`    the tiers held first differ in plan year ${t} (the first person ${y.ageSelf}): the tie arm holds ${tiersOf(y.heldAfter)} (pension/ISA, the first person and the partner), CANDS ${tiersOf(b.heldAfter)}; both held ${tiersOf(y.heldBefore)} and ${tiersOf(b.heldBefore)} before it`);
    console.log(`    in plan year ${t - 1}: the household's pot ${gbp(p.total)} against CANDS's ${gbp(pb.total)} (${(100 * (p.total / pb.total - 1)).toFixed(3)}%), its taxable account ${gbp(p.other)} against ${gbp(pb.other)}, its ISAs ${gbp(p.isa)} against ${gbp(pb.isa)}`);
    console.log(`    tax paid before plan year ${t}: ${gbp(taxTo(Ys, t))} against CANDS's ${gbp(taxTo(base.years, t))}; from it to the end: ${gbp(taxFrom(Ys, t))} against ${gbp(taxFrom(base.years, t))}`);
    // CANDS's own chooser handed the tie arm's state at the start of that year (the engine state before its step)
    const pick = cps.CANDS && CPL.couplePolicy(cps.CANDS).choose(y.before, t);
    console.log(`    CANDS's own chooser at the tie arm's state in plan year ${t} picks the tiers ${moveTiers(pick)}; the tie arm's own move ${moveTiers(y.move)}; CANDS on its own path ${moveTiers(b.move)}`);
    // the decomposition: the tie arm with the first person's tiers held where CANDS holds them from plan year t (the rule's
    // wrappers, CANDS's risk), and CANDS with them forced to the tie arm's stepped tiers from t (CANDS's wrappers, the step)
    const tierFields = mv => { const o = mv.perOwner.self || {}; return { tierPen: o.tierPen || 0, tierIsa: o.tierIsa || 0, tierPenName: o.tierPenName, tierIsaName: o.tierIsaName }; };
    const held0 = trace(arm, k, { from: t, self: tierFields(b.move) }), stepped = trace('CANDS', k, { from: t, self: tierFields(y.move) });
    const pc = v => `${v >= base.wealth ? '+' : ''}${(100 * (v / base.wealth - 1)).toFixed(2)}%`, dt = v => `${v >= base.tax ? '+' : ''}${gbp(v - base.tax)}`;
    const extra = r.tax - base.tax, remains = held0.tax - base.tax;
    console.log(`    the decomposition: ${arm} with the first person's tiers held at CANDS's from plan year ${t}: the pot ${pc(held0.wealth)} of CANDS's, lifetime tax ${dt(held0.tax)}, so ${(100 * remains / extra).toFixed(0)}% of ${arm}'s extra tax remains with the step undone; CANDS with the step forced from plan year ${t}: the pot ${pc(stepped.wealth)}, lifetime tax ${dt(stepped.tax)}`);
    const divs = Z => Z.slice(t).map(x => x.divTax);
    console.log(`    dividend tax each year from plan year ${t}: ${arm} ${gbp(Math.min(...divs(Ys)))} to ${gbp(Math.max(...divs(Ys)))}, CANDS ${gbp(Math.min(...divs(base.years)))} to ${gbp(Math.max(...divs(base.years)))}; the year's tax in plan years ${t - 3} to ${t - 1}: ${arm} ${Ys.slice(t - 3, t).map(x => gbp(x.tax)).join(', ')}, CANDS ${base.years.slice(t - 3, t).map(x => gbp(x.tax)).join(', ')}`);
  }
}
