/*
 * THE SAVINGS SPLIT'S v2: THE POOL (SAVE-V2.md, DRAFT; D130 (7)), EXPLORATORY, no path run: the library's single households
 * who work and save into a pension or an ISA (the engine's saveSplitAt: a working year with a save to choose, audit-save.mjs
 * choiceYears), on Phase 4's plan (phase4-panel.mjs planOf at the library target, the younger cohort retiring at 52), by
 * cohort (older than 44; 44 or under, retiring at 52), each counted as:
 *   - in the savings factorial's panel (audit-save.mjs saveIds on phase4-panel.json): the split's effect seen on it;
 *   - touched by an earlier run, by the scan frozen for step 8 (household-hsp-orders.json, held-out.mjs touchedAll taken on
 *     19 Nov), outside the factorial: the split never run on it;
 *   - untouched by that scan.
 * It decides nothing: it shows what SAVE-V2.md's panel can be drawn from. The panel itself takes the scan again on its day.
 *   node research/solver/save-v2-pool.mjs > research/solver/results-save-v2-pool.txt
 */
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { planOf, appPlan, readPanel, MAX_FIRE_AGE } from './phase4-panel.mjs';
import { choiceYears, saveIds } from './audit-save.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCAN = JSON.parse(readFileSync(join(HERE, 'household-hsp-orders.json'), 'utf8'));
const used = new Set(SCAN.touched.ids), factorial = new Set(saveIds(readPanel()).map(id => id.replace(/F$/, '')));
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const rows = { lib: [], fire: [] };
for (const s of buildScenarios()) {
  if (s.plan.demographics.planningMode !== 'single') continue;
  const h = { id: s.id, age: Number(s.plan.demographics.currentAgeSelf), plan: s.plan }, cohort = h.age <= MAX_FIRE_AGE ? 'fire' : 'lib';
  const years = choiceYears(E.buildContext(prep(appPlan(planOf(h, cohort, E.num(h.plan.spending.targetSpend, 0))))));
  if (!years.length) continue;
  rows[cohort].push({ id: h.id, stage: s.name.split('/')[0], age: h.age, years: years.length, where: factorial.has(h.id) ? 'factorial' : used.has(h.id) ? 'touched' : 'untouched' });
}
console.log(`THE SAVINGS SPLIT'S v2, THE POOL (EXPLORATORY, no path run): the library's single households who work and save into a pension or an ISA`);
console.log(`the scan: step 8's, frozen ${SCAN.built} (household-hsp-orders.json: ${SCAN.touched.count} ids touched, hash ${SCAN.touched.hash}); the factorial's panel: ${factorial.size} households (Phase 4's working savers)`);
for (const [c, name] of [['lib', `older than ${MAX_FIRE_AGE}, retiring at their plan's age`], ['fire', `${MAX_FIRE_AGE} or under, retiring at 52`]]) {
  const xs = rows[c], of = w => xs.filter(x => x.where === w), ids = w => of(w).map(x => x.id).join(', ') || 'none';
  console.log(`\n${c === 'lib' ? 'THE LIBRARY COHORT' : 'THE YOUNGER COHORT'} (${name}): ${xs.length} who save; stages ${[...new Set(xs.map(x => `${x.stage} (age ${x.age})`))].join(', ')}`);
  console.log(`  in the factorial's panel: ${of('factorial').length} (${ids('factorial')})`);
  console.log(`  touched by an earlier run, the split never run on it: ${of('touched').length} (${ids('touched')})`);
  console.log(`  untouched: ${of('untouched').length} (${ids('untouched')})`);
}
const all = [...rows.lib, ...rows.fire], n = w => all.filter(x => x.where === w).length;
console.log(`\nIN ALL: ${all.length} who save; ${n('factorial')} in the factorial's panel, ${n('touched')} touched elsewhere, ${n('untouched')} untouched`);
