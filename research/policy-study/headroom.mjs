/*
 * How much is the POLICY APPROACH ITSELF leaving on the table?
 *
 * Every policy in this study is one fixed draw order applied to every year of a retirement. That is a
 * rule, and a rule is the only thing a household can actually follow. But it is not the best conceivable
 * behaviour: a clairvoyant who knew the future could vary the order year by year - filling the pension
 * to the basic-rate limit in a year with room, reaching for the ISA in a year when selling GIA would
 * realise a large gain, and so on.
 *
 * That clairvoyant is not implementable. It is, however, an upper bound, and the gap between it and the
 * best fixed policy is the number that decides whether a richer strategy is worth building:
 *
 *   gap near zero   -> the fixed-order policy space is already close to optimal. Stop here.
 *   gap large       -> a rule with more freedom (parameters, not schedules) could capture real money.
 *
 * WHAT IS MEASURED, AND WHY IT IS THE DETERMINISTIC PATH
 *
 * Withdrawal ORDER controls tax and which wrapper survives. It barely touches sequence risk, which is
 * governed by withdrawal SIZE. Running this on the expected path therefore isolates exactly what the
 * lever controls, and avoids the trap the alternative walks into: hand an optimiser Monte Carlo paths
 * and perfect foresight and it will "solve" sequence risk by knowing which decade is bad, producing a
 * number that describes clairvoyance rather than strategy.
 *
 * Usage: node headroom.mjs [sliceIndex] [sliceCount]
 */
import * as E from '../engine.mjs';
import { installChallengers } from './challengers.mjs';
import { installChallengers2 } from './challengers2.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';

installChallengers(E);
installChallengers2(E);

const slice = Number(process.argv[2] ?? 0), slices = Number(process.argv[3] ?? 1);
const DIR = process.env.POLICY_RESULTS || new URL('./results/', import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });

// The order vocabulary the clairvoyant may pick from each year: every distinct order the fifteen
// policies use, plus a few the study did not ship, so the bound is not limited to what we happened
// to think of.
const ORDERS = [...new Map([
  ...Object.values(E.DECUMULATION_POLICIES).map(p => p.steps),
  ['isa', 'other', 'cash', 'penAny'],
  ['other', 'isa', 'cash', 'penAny'],
  ['cash', 'isa', 'other', 'penAny'],
  ['penPA', 'isa', 'other', 'cash', 'penBasic', 'penAny'],
  ['penPA', 'penBasic', 'other', 'cash', 'isa', 'penAny']
].map(s => [JSON.stringify(s), s])).values()];

// one deterministic run with a per-year order schedule
function runSchedule(ctx, schedule) {
  const state = E.freshState(ctx);
  const rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) {
    ctx.policySteps = ORDERS[schedule[t]];
    rows.push(E.stepYear(ctx, state, t, 'expected'));
  }
  const ev = E.evaluateRows(ctx, rows);
  return { ev, rows, s: score(ev, ctx, rows), net: netPot(ctx, ev, rows) };
}
/*
 * What we are maximising: survive first, then terminal wealth. A schedule that ends richer but runs dry
 * on the way is not better, so failure is scored below every solvent outcome.
 *
 * HAIRCUT is the sting in the tail. A gross terminal pot counts a pound left in the pension as worth
 * the same as a pound in an ISA, when the pension pound still owes income tax on the way out. Any
 * ranking on gross wealth therefore rewards deferring the pension, whether or not deferring it is
 * actually right. Run this at 0 to reproduce the app's own measure, and at 0.2 to ask whether the
 * answer was an artefact of that.
 */
const HAIRCUT = Number(process.env.PENSION_HAIRCUT ?? 0);
const netPot = (ctx, ev, rows) => Math.max(0, ev.terminalPot - HAIRCUT * Math.max(0, rows[rows.length - 1].pensions));
const score = (ev, ctx, rows) => (ev.survived ? 1e12 + netPot(ctx, ev, rows) : ev.failAge * 1e6);

const scenarios = buildScenarios().filter((_, i) => i % slices === slice);
const out = [];
const t0 = Date.now();

scenarios.forEach((sc, n) => {
  const ctx = E.buildContext(E.resolveMpaa(sc.plan));
  const T = ctx.totalYears;

  // baseline: the best FIXED order, which is what a policy can be
  let bestFixed = null;
  ORDERS.forEach((_, k) => {
    const r = runSchedule(ctx, Array(T + 1).fill(k));
    if (!bestFixed || r.s > bestFixed.s) bestFixed = { s: r.s, k, ev: r.ev, net: r.net };
  });

  /*
   * Coordinate ascent from that baseline: repeatedly take one year and try every order for it, keeping
   * whichever is best, until a full sweep changes nothing. Started from the best fixed order rather
   * than from noise, so the result can never be worse than a policy - the reported gap is then honestly
   * attributable to per-year freedom and not to a lucky restart.
   */
  const schedule = Array(T + 1).fill(bestFixed.k);
  let cur = bestFixed.s, evals = 0, sweeps = 0;
  for (; sweeps < 12; sweeps++) {
    let improved = false;
    for (let t = 0; t <= T; t++) {
      const was = schedule[t];
      let bestK = was, bestS = cur;
      for (let k = 0; k < ORDERS.length; k++) {
        if (k === was) continue;
        schedule[t] = k;
        const s = runSchedule(ctx, schedule).s; evals++;
        if (s > bestS + 1e-6) { bestS = s; bestK = k; }
      }
      schedule[t] = bestK;
      if (bestK !== was) { cur = bestS; improved = true; }
    }
    if (!improved) break;
  }
  const free = runSchedule(ctx, schedule); const evFree = free.ev;
  const distinct = new Set(schedule).size;

  out.push({
    id: sc.id, name: sc.name, tags: sc.tags, years: T,
    fixedPolicyOrder: ORDERS[bestFixed.k].join('>'),
    fixedSurvived: bestFixed.ev.survived, freeSurvived: evFree.survived,
    fixedTerminal: bestFixed.net, freeTerminal: free.net,
    fixedGross: bestFixed.ev.terminalPot, freeGross: evFree.terminalPot,
    fixedTax: bestFixed.ev.lifetimeTax, freeTax: evFree.lifetimeTax,
    gainPct: bestFixed.net > 0 ? 100 * (free.net - bestFixed.net) / bestFixed.net : null,
    gainAbs: free.net - bestFixed.net,
    ordersUsed: distinct, evals, sweeps
  });
  if (n % 10 === 0) {
    process.stderr.write(`slice ${slice}: ${n}/${scenarios.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
    fs.writeFileSync(`${DIR}/headroom-${slice}.partial.json`, JSON.stringify(out));
  }
});

fs.writeFileSync(`${DIR}/headroom-${slice}.json`, JSON.stringify(out));
process.stderr.write(`slice ${slice}: done ${out.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
