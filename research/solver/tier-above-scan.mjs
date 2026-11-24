/*
 * THE TIER ABOVE IN THE PAGE'S WORDS: WHICH PLANS IT REACHES (EXPLORATORY; the pattern search for
 * research/tests/tier-words.test.mjs, CHECKLIST 7). The page read a move's tier index as its steps below the risk chosen, so
 * a move to the tier above (D16's 'auto' rule: a thin plan, its simulated survival without it below 85%, offered one tier
 * riskier) was worded as several steps lower in risk. For each library plan as entered, solved as the app solves it at the
 * harnesses' light settings (a guide: the rule's decision reads the solve's own survival): a single by
 * src/solverApp.js solveForApp, a couple by the household route the page takes (src/solverCouple.js householdCut, its
 * table, householdSolved), each refused couple named and left out; the rule's decision, and where it takes the tier above,
 * the years of the expected market's run (src/solverStrategy.js rowsOf, coupleRowsOf) whose move holds a wrapper there, and
 * whether its first year does. Decides nothing.
 *   node research/solver/tier-above-scan.mjs [lane lanes] > part; the parts joined in order make results-tier-above-scan.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { rowsOf } from '../../src/solverStrategy.js';
import { householdCut, householdSolved, coupleRowsOf } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const [lane, lanes] = [Number(process.argv[2] || 0), Number(process.argv[3] || 1)];
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, PTS = 6;
const lib = buildScenarios().filter((_, i) => i % lanes === lane);
const above = q => q && ((q.tierPen || 0) < 0 || (q.tierIsa || 0) < 0);
for (const s of lib) {
  const t0 = Date.now();
  let line;
  try {
    if (s.plan.demographics.planningMode === 'single') {
      const r = solveForApp(E, M, s.plan, { points: PTS, research: { ...LIGHT } });
      const dec = r.meta.riskAbove ? r.meta.riskAbove.decision : 'none';
      if (/^on/.test(dec)) {
        const rr = rowsOf(E, r, 'expected'), held = rr.parts.filter(above).length;
        line = `${s.id} single: ${dec}; the expected market's years holding the tier above ${held} of ${rr.parts.length}, the first year ${above(rr.parts[0]) ? 'yes' : 'no'}`;
      } else line = `${s.id} single: ${dec}`;
    } else {
      const cut = householdCut(E, M, s.plan, APP_COUPLE.household), b = cut.bands;
      const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { points: PTS, ageWith: cut.ageWith, research: { ...LIGHT } }), b.paK);
      const dec = H.meta.riskAbove ? H.meta.riskAbove.decision : 'none';
      if (/^on/.test(dec)) {
        const cp = householdSolved(E, M, { household: cut.household, form: APP_COUPLE.household, topK: 3 }, { plan: cut.hplan, r: H });
        const rr = coupleRowsOf(E, cp, 'expected'), hold = q => q && (above(q.self) || above(q.part)), held = rr.parts.filter(hold).length;
        line = `${s.id} couple (the household route): ${dec}; the expected market's years holding the tier above ${held} of ${rr.parts.length}, the first year ${hold(rr.parts[0]) ? 'yes' : 'no'}`;
      } else line = `${s.id} couple (the household route): ${dec}`;
    }
  } catch (e) { line = `${s.id}: not solved (${e.message.split('\n')[0].slice(0, 120)})`; }
  console.log(`${line} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
