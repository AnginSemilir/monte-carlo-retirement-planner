/*
 * WHERE THE ENGINE'S ISA DEFECT COULD REACH B7'S FACTORIALS (EXPLORATORY; plan inputs only: no path run, no outcome read).
 * The windfall read's reviewer found the engine's dated deposits and staged drips into an ISA (stepYear steps 1 and 1.5) not
 * counted against the year's ISA subscription, which the same year's cash ISA shelter, surplus sweep and re-wraps read
 * (reviews/2026-11-18-read-windfall.md). For each household of a factorial's panel this lists every such deposit or drip
 * under each decumulation policy, and whether it falls in a working year with a save choice (the savings split's years).
 * Arm A's own pick (the plan both arms of a factorial solve) is found for every household with any such deposit or drip,
 * and the households counted twice: with one in a save-choice year, and with one in any year (the windfall read's
 * reviewer, second round, MINOR 1: on 19 Nov the pick was found only where a save-choice year was reached, so S310F's
 * deposit in a retired year under its own pick went unnamed).
 *   node research/solver/save-isa-deposits.mjs [save|windfall]
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await import(`${R}/engine.mjs`);
const { readPanel, appPlan } = await import(`${R}/solver/phase4-panel.mjs`);
const { saveIds, choiceYears } = await import(`${R}/solver/audit-save.mjs`);
const { windfallIds } = await import(`${R}/solver/audit-windfall.mjs`);
const { solverPlanOf } = await import(`${R}/solver/audit-phase4.mjs`);
const { armA } = await import(`${R}/solver/select-phase4.mjs`);
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const panel = readPanel(), byId = Object.fromEntries(panel.map(h => [h.id, h]));
const POLS = Object.keys(E.DECUMULATION_POLICIES || {});
const which = process.argv[2] || 'save';
const ids = which === 'save' ? saveIds(panel) : windfallIds(panel);
console.log(`${which} panel: ${ids.length} households; policies: ${POLS.join(' | ') || '(none exported)'}`);
let touched = 0, anyYear = 0;
const named = [];
for (const id of ids) {
  const h = byId[id], seen = new Map();
  for (const pol of POLS.length ? POLS : [null]) {
    const plan = prep(pol ? solverPlanOf(h.plan, { decumulationPolicy: pol }) : appPlan(h.plan));
    const ctx = E.buildContext(plan), ch = new Set(choiceYears(ctx));
    for (const [y, xs] of ctx.oneOffContribs) for (const x of xs) if (x.id.startsWith('isa_') && x.amount > 0) {
      const t = y - ctx.baseYear, k = `deposit ${x.id} t${t}${ch.has(t) ? ' (a choice year)' : ''}`;
      seen.set(k, [...(seen.get(k) || []), pol]);
    }
    for (const [y, xs] of ctx.stagedTransfers) for (const x of xs) if (x.toId.startsWith('isa_') && x.amount > 0) {
      const t = y - ctx.baseYear, k = `drip ${x.toId} t${t}${ch.has(t) ? ' (a choice year)' : ''}`;
      seen.set(k, [...(seen.get(k) || []), pol]);
    }
  }
  const choice = [...seen].filter(([k]) => k.includes('choice year'));
  // wherever a deposit or drip reaches an ISA under some policy, arm A's own pick as it stands (the plan both arms solve,
  // B7-FACTORIALS.md amendment 1)
  const pick = seen.size ? armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy : null;
  if (choice.some(([, p]) => p.includes(pick))) touched++;
  const under = [...seen].filter(([, p]) => p.includes(pick)).map(([k]) => k);
  if (under.length) { anyYear++; named.push(`${id} (${under.join('; ')})`); }
  console.log(`${id.padEnd(7)} ${seen.size ? [...seen].map(([k, p]) => `${k} [${p.length === POLS.length ? 'every policy' : p.join(', ')}]`).join('; ') : 'no deposit or drip into an ISA'}${pick ? `; arm A picks ${pick} on this code${under.length ? ', so it lands under arm A\'s own pick' : ''}` : ''}`);
}
console.log(`households with an ISA deposit or drip in a save-choice year under arm A's own pick: ${touched} of ${ids.length}`);
console.log(`households with an ISA deposit or drip in any year under arm A's own pick: ${anyYear} of ${ids.length}${named.length ? `: ${named.join(', ')}` : ''}`);
