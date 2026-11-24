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
 *   node research/solver/tier-above-scan.mjs [lane lanes] > part     a part's per-plan lines; the parts joined in plan order
 *   node research/solver/tier-above-scan.mjs --count [rev] > research/solver/results-tier-above-scan.txt
 * The scan solves each plan and reads no outcome of it, so by the maintainer's ruling (D147, 24 Nov) it does not use the plans
 * it solves: the held-out scan (held-out.mjs, phase4-panel.mjs touched) counts every plan a committed results file names, and
 * the per-plan lines named all 420, which left no library couple untouched. So the committed results file is --count's: the
 * finding as counts, read from the per-plan record committed at rev (40df1247, the words fix's, kept in git's history), naming
 * only a plan the tier above reaches. A part written again goes outside research/solver (the held-out scan reads results/ as
 * well), never into a committed file.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { rowsOf } from '../../src/solverStrategy.js';
import { householdCut, householdSolved, coupleRowsOf } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { idsIn } from './scan-touched.mjs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* the per-plan record as counts: each kind's decisions, the plans the tier above reaches by name, the others by count alone */
export function countOf(text) {
  const rows = text.split('\n').map(l => l.match(/^(S\d{3}F?)(?: (single|couple \(the household route\)))?: (.*?)(?: \(\d+ s\))?$/)).filter(Boolean)
    .map(([, id, kind, rest]) => ({ id, kind: kind ? kind.split(' ')[0] : 'not solved', rest }));
  const tally = {}, taken = [];
  for (const r of rows) {
    const dec = r.kind === 'not solved' ? 'not solved' : r.rest.split(';')[0];
    tally[r.kind] = tally[r.kind] || {}; tally[r.kind][dec] = (tally[r.kind][dec] || 0) + 1;
    if (/^on/.test(dec)) taken.push(r);
  }
  return { rows, tally, taken };
}
if (process.argv[2] === '--count') {
  const rev = process.argv[3] || '40df1247', REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const { rows, tally, taken } = countOf(execFileSync('git', ['show', `${rev}:research/solver/results-tier-above-scan.txt`], { cwd: REPO, encoding: 'utf8' }));
  const n = k => Object.values(tally[k] || {}).reduce((t, v) => t + v, 0), of = k => Object.entries(tally[k] || {}).map(([d, v]) => `${d} ${v}`).join('; ') || 'none';
  const out = [`THE TIER ABOVE IN THE PAGE'S WORDS: WHICH PLANS IT REACHES (EXPLORATORY, 24 Nov; the harnesses' light settings, a guide; counts by node research/solver/tier-above-scan.mjs --count ${rev}, from the per-plan record committed at ${rev}, which the scan's parts made: it solved each plan and read no outcome of it, so by the maintainer's ruling it does not use them (D147) and this file names only a plan the tier above reaches)`,
    `the library's plans as entered: ${rows.length}, singles ${n('single')}, couples on the household route ${n('couple')}, not solved ${n('not solved')}`,
    `the rule's decision, singles: ${of('single')}`,
    `the rule's decision, couples on the household route: ${of('couple')}`,
    `the tier above taken on ${taken.length}${taken.length ? `: ${taken.map(r => `${r.id} ${r.kind}: ${r.rest}`).join(' | ')}` : ''}`,
    `IN ALL: ${rows.length} library plans as entered; the tier above taken on ${taken.length}; no tier above the plan on ${rows.filter(r => /^off: no tier above the plan/.test(r.rest)).length} (every one holds its pension at High Risk, so the joint step has no rung above it); not solved ${n('not solved')}. The defect reaches a plan whose pension and ISA are both below High Risk and whose simulated survival without the tier above is below 85%, as research/tests/tier-words.test.mjs check 3's single plan is.`].join('\n');
  // the file may name a plan the tier above reaches and no other: the held-out scan's own matcher reads it (the plant
  // TIER_COUNT_PLANT=name adds the first plan's id, which the guard must refuse)
  const named = new Set(idsIn(process.env.TIER_COUNT_PLANT === 'name' ? `${out}\n${rows[0].id}` : out)), allowed = new Set(taken.map(r => r.id.replace(/F$/, '')));
  if ([...named].some(id => !allowed.has(id))) { console.error(`tier-above-scan --count: the counts would name ${[...named].filter(id => !allowed.has(id)).join(', ')}`); process.exit(2); }
  console.log(out);
  process.exit(0);
}

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
