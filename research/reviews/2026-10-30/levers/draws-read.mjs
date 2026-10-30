/*
 * WHAT THE SOLVER DOES WITH THE DRAWS (EXPLORATORY; LEVERS.md, the maintainer's question of 30 Oct 09:08: "what is it about
 * the solver that makes it better than the fixed policy outside of tiers and spending?"). The two arms that share every
 * lever but the way the draws are chosen: FIXAPP (the app's fixed policy, guardrails off, the plan's tiers) and FIXHOLD
 * (the solver with cuts, raises and risk changes blocked), each built as levers-audit.mjs builds it, replayed year by year
 * with the engine's own stepYear on the same paths of seed 7002, and every year's row kept: pension drawn and its taxable
 * part, the personal allowance harvested, income tax (with savings and dividend tax), CGT and gains realised, and each
 * wrapper's balance. Everything is in years of the household's target unless said. Each household's detail lines (the
 * equity share, the cash held, the saved paths) print above its own line.
 *   node draws-read.mjs <paths> <unit dir>        (from the root of the code under test; the unit dir holds the picks)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, existsSync } from 'fs';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA, CAND_PTS, runPath } = await imp('research/solver/audit-phase4.mjs');
const { withTable } = await imp('src/solver/bridge.js');
const [nArg, dir] = process.argv.slice(2);
const N = Number(nArg) || 500, IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
const P = Object.fromEntries(readPanel().map(x => [x.id, x]));
const fixedAppPlan = raw => E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 5, raiseCap: 1 } });
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
// one path, year by year, as runTrial runs it, every row kept
function replay(ctx, zs) {
  const state = E.freshState(ctx), zPath = zs.length > ctx.totalYears + 1 ? zs[ctx.totalYears + 1] : 0, rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(E.stepYear(ctx, state, t, { z: zs[t], zPath }, null));
  return rows;
}
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), sg = (x, d = 2) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(d)}` : '-');
const out = [];
out.push(`WHAT THE SOLVER DOES WITH THE DRAWS (EXPLORATORY): FIXAPP (the app's fixed policy) against FIXHOLD (the solver), spending at the target and the plan's own tiers in both, ${N} paths of seed 7002 a household, replayed with the engine's stepYear`);
out.push('Per household, FIXAPP / FIXHOLD (years of target unless said): survival; tax over the plan (income, savings and dividend tax; CGT), on the paths alive at each year; pension income taken while the personal allowance would otherwise go unused; the pension drawn by the State Pension age; the pension, ISA and GIA left at 75 (means over the paths not yet failed)');
const pooled = { app: {}, sol: {} };
const add = (o, k, v) => { o[k] = (o[k] || 0) + v; };
for (const id of IDS) {
  const h = P[id];
  const pickF = join(dir, `${id}-pick-fixapp.json`), pk = existsSync(pickF) ? JSON.parse(readFileSync(pickF, 'utf8')) : null;
  const app = armA(fixedAppPlan(h.plan), { tournament: false });
  if (pk && pk.decumulationPolicy !== app.planState.spending.decumulationPolicy) throw new Error(`${id}: the pick differs from the run's`);
  const ctxA = E.buildContext(E.resolveMpaa(app.planState));
  const r = C.solveCandidate(E, M, prep(solverPlanOf(h.plan, { decumulationPolicy: app.planState.spending.decumulationPolicy })), { lambda: LAMBDA, points: CAND_PTS, bequestWeight: 0.02, blockTrim: true, raiseCap: 1, riskConsent: false });
  const ctxS = E.buildContext(withTable(r.m.ctx.plan, r));
  const T = ctxA.totalYears, paths = E.pathsForSeed(7002, N, T), target = ctxA.targetSpend, self = ctxA.owners.find(o => o.key === 'self');
  const pa = ctxA.P.pa, spaT = Math.max(0, (self.spa || ctxA.spa || 67) - ctxA.ageSelf0), t75 = 75 - ctxA.ageSelf0;
  const eqW = ctx => Object.fromEntries(ctx.accounts.map(a => [a.id, Number(a.equityWeight) || 0]));
  const kept = new Map();
  const stats = (ctx, tag) => {
    let surv = 0, tax = 0, cgt = 0, paUsed = 0, paRoom = 0, penBySpa = 0, penAll = 0, hr = 0;
    const left = { pen: 0, isa: 0, gia: 0, cash: 0, n: 0 }, W = eqW(ctx), perPath = [];
    for (const z0 of paths) {
      const zs = Float64Array.from(z0), rows = replay(ctx, zs);
      const o = runPath(ctx, zs, false); surv += o.survived ? 1 : 0;
      // the whole portfolio's equity share each year (every wrapper at its tier's equity weight), and tax paid so far
      let taxSoFar = 0;
      perPath.push({ survived: o.survived, failYear: o.failYear, rows: rows.map(row => { const tot = Object.values(row.pots).reduce((x, v) => x + Math.max(0, v), 0); taxSoFar += (row.taxPaid + (row.cgtPaid || 0)) / target;
        return { t: row.t, eq: tot > 0 ? Object.entries(row.pots).reduce((x, [k, v]) => x + Math.max(0, v) * (W[k] || 0), 0) / tot : NaN, tot: tot / target, pen: row.pensions / target, isa: row.isas / target, gia: row.other / target, cash: row.cash / target, taxSoFar, unmet: row.unmetDemand }; }) });
      let failed = false;
      for (const row of rows) {
        if (row.unmetDemand > 1) failed = true;
        tax += row.taxPaid / target; cgt += (row.cgtPaid || 0) / target;
        if (row.targetSpend > 0 && !failed) {
          // the personal allowance: the room left in it by the other taxable income, and how much of it pension income filled
          const other = (row.otherTaxableSelf || 0) + (row.spSelf || 0), room = Math.max(0, pa - other), used = Math.min(room, row.taxablePensionSelf || 0);
          paRoom += room / target; paUsed += used / target;
          // income taxed above the basic rate (its excess over the basic rate band's top, by the engine's limit)
          const ti = other + (row.taxablePensionSelf || 0); hr += Math.max(0, ti - (ctx.P.basicLimit || 50270)) / target;
          penAll += (row.drawdownPensions || 0) / target; if (row.t < spaT) penBySpa += (row.drawdownPensions || 0) / target;
        }
        if (row.t === t75 && !failed) { left.pen += row.pensions / target; left.isa += row.isas / target; left.gia += row.other / target; left.cash += row.cash / target; left.n++; }
      }
    }
    kept.set(tag, perPath);
    return { surv: 100 * surv / N, tax: tax / N, cgt: cgt / N, paUsed: paUsed / N, paRoom: paRoom / N, penBySpa: penBySpa / N, penAll: penAll / N, hr: hr / N, left: Object.fromEntries(['pen', 'isa', 'gia', 'cash'].map(k => [k, left.n ? left[k] / left.n : NaN])) };
  };
  const a = stats(ctxA, 'app'), s = stats(ctxS, 'sol');
  // the paths that decide survival: the app's policy runs out and the solver's does not (saved), or the other way (lost)
  const PA = kept.get('app'), PS = kept.get('sol'), retT = Math.max(0, self.retireAge - ctxA.ageSelf0);
  const saved = [], lost = [];
  for (let k = 0; k < N; k++) { if (!PA[k].survived && PS[k].survived) saved.push(k); if (PA[k].survived && !PS[k].survived) lost.push(k); }
  const med = xs => { const v = xs.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : NaN; };
  const at = (pp, ks, t, f) => med(ks.map(k => pp[k].rows[t]).filter(Boolean).map(f));
  const eqLine = (ks, label) => [0, 5, 10].map(d => retT + d).filter(t => t <= T).map(t => `${t - retT + 1}: ${f1(100 * at(PA, ks, t, x => x.eq))}% / ${f1(100 * at(PS, ks, t, x => x.eq))}%`).join(', ');
  const failAge = med(saved.map(k => PA[k].failYear >= 0 ? ctxA.ageSelf0 + PA[k].failYear : NaN));
  const tf = med(saved.map(k => PA[k].failYear)), tCut = Number.isFinite(tf) ? Math.max(retT, tf - 1) : retT;
  out.push(`         the whole portfolio's equity share, retired years 1, 6, 11 (medians, FIXAPP / FIXHOLD): all paths ${eqLine([...Array(N).keys()])}; the ${saved.length} saved paths ${eqLine(saved)}`);
  const cashLine = ks => [0, 5, 10, 20].map(d => retT + d).filter(t => t <= T).map(t => `${t - retT + 1}: ${f2(at(PA, ks, t, x => x.cash))} (${f1(100 * at(PA, ks, t, x => (x.tot > 0 ? x.cash / x.tot : NaN)))}%) / ${f2(at(PS, ks, t, x => x.cash))} (${f1(100 * at(PS, ks, t, x => (x.tot > 0 ? x.cash / x.tot : NaN)))}%)`).join(', ');
  out.push(`         cash held, years of target (its share of the pots), retired years 1, 6, 11, 21 (medians, FIXAPP / FIXHOLD): ${cashLine([...Array(N).keys()])}`);
  out.push(`         on the ${saved.length} saved paths (and ${lost.length} lost): the app's policy runs out at a median age of ${f1(failAge)}; a year before, the pots (medians) are ${f1(at(PA, saved, tCut, x => x.tot))} / ${f1(at(PS, saved, tCut, x => x.tot))} years of target, with tax paid so far ${f2(at(PA, saved, tCut, x => x.taxSoFar))} / ${f2(at(PS, saved, tCut, x => x.taxSoFar))}; the pension in them ${f1(at(PA, saved, tCut, x => x.pen))} / ${f1(at(PS, saved, tCut, x => x.pen))}, the ISA ${f1(at(PA, saved, tCut, x => x.isa))} / ${f1(at(PS, saved, tCut, x => x.isa))}, the GIA ${f1(at(PA, saved, tCut, x => x.gia))} / ${f1(at(PS, saved, tCut, x => x.gia))}, cash ${f1(at(PA, saved, tCut, x => x.cash))} / ${f1(at(PS, saved, tCut, x => x.cash))}`);
  for (const [k, v] of Object.entries(a)) if (typeof v === 'number') add(pooled.app, k, v / IDS.length);
  for (const [k, v] of Object.entries(s)) if (typeof v === 'number') add(pooled.sol, k, v / IDS.length);
  out.push(`  ${id.padEnd(6)} (${app.label}; age ${ctxA.ageSelf0}, retiring ${self.retireAge}, State Pension at ${self.spa || ctxA.spa}) survival ${f1(a.surv)} / ${f1(s.surv)};  tax ${f2(a.tax)} / ${f2(s.tax)}, CGT ${f2(a.cgt)} / ${f2(s.cgt)};  the allowance's room filled with pension income ${f2(a.paUsed)} / ${f2(s.paUsed)} of ${f2(a.paRoom)} / ${f2(s.paRoom)};  taxed above the basic rate ${f2(a.hr)} / ${f2(s.hr)};  pension drawn by the State Pension age ${f2(a.penBySpa)} / ${f2(s.penBySpa)} of ${f2(a.penAll)} / ${f2(s.penAll)};  left at 75: pension ${f1(a.left.pen)} / ${f1(s.left.pen)}, ISA ${f1(a.left.isa)} / ${f1(s.left.isa)}, GIA ${f1(a.left.gia)} / ${f1(s.left.gia)}, cash ${f1(a.left.cash)} / ${f1(s.left.cash)}`);
}
const A = pooled.app, S = pooled.sol;
out.push('');
out.push(`Pooled (each household once), FIXAPP / FIXHOLD: survival ${f2(A.surv)} / ${f2(S.surv)}; tax ${f2(A.tax)} / ${f2(S.tax)} (${sg(S.tax - A.tax)}); CGT ${f2(A.cgt)} / ${f2(S.cgt)} (${sg(S.cgt - A.cgt)}); the allowance's room filled with pension income ${f2(A.paUsed)} / ${f2(S.paUsed)}; taxed above the basic rate ${f2(A.hr)} / ${f2(S.hr)}; pension drawn by the State Pension age ${f2(A.penBySpa)} / ${f2(S.penBySpa)}, in all ${f2(A.penAll)} / ${f2(S.penAll)}`);
console.log(out.join('\n'));
