/*
 * AX-HO'S HOUSEHOLD RULE (predictions/diag-axho.md; the maintainer's choice of 17 Oct to replace S380): an input rule, read
 * from the library's plans alone (no solve). For each single household with a bridge (its private pension age past the later
 * of its current and retirement ages), the coverage: its own accessible money (every non-pension account) over the bridge's
 * floor bills (the floor, 0.8 of the target spend, times the bridge's years). The candidates are the bridge households other
 * than S360 (the adaptive reference's design household) and S364 (tested under it, AO and AOR); the rule takes the one whose
 * coverage sits nearest 1 in log terms (a bridge that neither covers itself twice over nor fails outright), ties to the
 * lower id. S380 is printed beside: its two arms moved alike on every path-year at 4 and 30 points.
 *   node research/solver/coverage-axho.mjs > research/solver/results-axho-coverage.txt
 */
import { buildScenarios } from '../policy-study/scenarios.mjs';
const n = x => Number(x) || 0, all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const rows = all.map(s => {
  const d = s.plan.demographics, br = n(d.privatePensionAge) - Math.max(n(d.currentAgeSelf), n(d.retireAgeSelf)); if (br <= 0) return null;
  const own = s.plan.accounts.filter(x => x.owner === 'Myself'), acc = own.filter(x => x.category !== 'Pensions').reduce((t, x) => t + n(x.balance), 0);
  const target = n(s.plan.spending.targetSpend), cov = acc / (0.8 * target * br);
  return { id: s.id, br, acc, target, cov };
}).filter(Boolean).sort((p, q) => Math.abs(Math.log(p.cov)) - Math.abs(Math.log(q.cov)) || p.id.localeCompare(q.id));
const EXCL = ['S360', 'S364'], cand = rows.filter(r => !EXCL.includes(r.id));
console.log(`AX-HO'S HOUSEHOLD RULE: ${rows.length} single households with a bridge; candidates all but ${EXCL.join(' and ')}; coverage = accessible money / (0.8 x target x bridge years), nearest 1 in log terms`);
for (const r of rows.slice(0, 12)) console.log(`  ${r.id} bridge ${r.br} years, accessible ${r.acc}, target ${r.target}: coverage ${r.cov.toFixed(3)}${EXCL.includes(r.id) ? ' (excluded)' : ''}`);
const s380 = rows.find(r => r.id === 'S380');
console.log(`  S380 (the receipt's, its arms alike at 4 and 30 points): coverage ${s380.cov.toFixed(3)}`);
console.log(`CHOSEN: ${cand[0].id} (coverage ${cand[0].cov.toFixed(3)})`);
