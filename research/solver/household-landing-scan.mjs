/*
 * THE LATER RETIREE'S SAVING IN THE HOUSEHOLD PLAN, THE PATTERN SEARCH (household-landing.test.mjs's class run over every
 * panel run on the household route and the library's couples; the reviewer on step 4's change of default, finding 1). For
 * each couple, as handed over and on its mirror, cut as the page cuts it (src/solverCouple.js householdCut at the couples'
 * default form, the shapes step 4 takes), each contribution of the later retiree's the household plan lists, and what its own
 * engine context lands in its wrapper in its year (buildContext's ledger), with the fix and under the plant 'roomclaim' (the
 * code before: claimed against the household person's room, its no-earnings limit, its MPAA once it draws, nothing from the
 * first person's 75). And the dated-schedule class (finding 6): the plans where two people's accounts of one wrapper carry a
 * dated schedule, under the plant 'firstsched' and with the fix. No path is run and no outcome read.
 *   node research/solver/household-landing-scan.mjs > research/solver/results-household-landing-scan.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdCut } from '../../src/solverCouple.js';
import { HOUSE } from '../../src/solver/household.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { swapOf } from '../../src/couplesSwitch.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readOpenPanel } from './couples-open-panel.mjs';
import { readHspPanel } from './household-hsp-panel.mjs';
import { readShapesPanel } from './shapes-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { readPanel } from './couple-panel.mjs';
import { codeId } from './code-id.mjs';
import { fileURLToPath } from 'node:url';

const SETS = [
  ['the registered couples panel (couples-open-registered-panel.json)', () => readOpenPanel(fileURLToPath(new URL('./couples-open-registered-panel.json', import.meta.url))).map(u => [u.id, u.plan])],
  ['the dress rehearsal\'s panel (couples-open-panel.json)', () => readOpenPanel(fileURLToPath(new URL('./couples-open-panel.json', import.meta.url))).map(u => [u.id, u.plan])],
  ['step 8\'s panel (household-hsp-panel.json)', () => readHspPanel().map(u => [u.id, u.plan])],
  ['step 5\'s shapes (shapes-panel.json)', () => readShapesPanel().map(u => [u.id, u.plan])],
  ['the share rules\' panel (share-rules-panel.json)', () => readSharePanel().map(u => [u.id, u.plan])],
  ['the couples\' re-run panel (couples-panel-d4b.json)', () => readPanel().map(u => [u.id, u.plan])],
  ['the library\'s couples', () => buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple').map(s => [s.id, s.plan])]
];
const landing = plan => {
  let cut; try { cut = householdCut(E, M, plan, APP_COUPLE.household); } catch (e) { if (/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) return null; throw e; }
  const hp = cut.hplan, ctx = E.buildContext(hp), deps = (hp.oneOffContributions || []).filter(x => /^dep_house_/.test(x.id));
  let listed = 0, landed = 0, years = 0, short = 0;
  for (const d of deps) { const s = ctx.oneOffStaging.get(d.id), into = s ? (s.direct ? s.amount : s.H0) : 0; years++; listed += d.amount; landed += into; if (into < d.amount - 0.005) short++; }
  // the plan's own one-off deposits (not the later retiree's): what each lands in its year and where its surplus is staged,
  // so the fix's side effect on them shows (the later retiree's saving no longer claiming the room they compete for)
  const own = new Map();
  for (const d of (hp.oneOffContributions || []).filter(x => !/^dep_house_/.test(x.id))) { const s = ctx.oneOffStaging.get(d.id); if (s) own.set(d.id, { into: s.direct ? s.amount : s.H0, staged: JSON.stringify(s.tranches || []) }); }
  return { years, short, listed, landed, own };
};
/* the plan's own deposits landing otherwise with the fix than under the plant: how many, and the largest change landed in its year */
const ownApart = (after, before) => { let n = 0, worst = 0; for (const [id, a] of after.own) { const b = before.own.get(id); if (!b || Math.abs(a.into - b.into) > 0.005 || a.staged !== b.staged) { n++; worst = Math.max(worst, b ? Math.abs(a.into - b.into) : a.into); } } return { n, worst, of: after.own.size }; };
const dated = plan => (plan.accounts || []).some(a => Array.isArray(a.contribByYear));
const cid = codeId();
console.log(`THE LATER RETIREE'S SAVING IN THE HOUSEHOLD PLAN (household-landing.test.mjs's class; code ${cid ? cid.hash : 'unknown'}). No path run, no outcome read.`);
console.log(`Each couple as handed over and on its mirror, cut as the page cuts it ('${APP_COUPLE.household}', the shapes ${JSON.stringify(APP_COUPLE.takeShapes)}); a plan the household plan refuses for its shape is not counted. "Before" is the plant 'roomclaim' (the deposits claimed against the household person's room).\n`);
const tot = { plans: 0, withDeps: 0, depYears: 0, shortBefore: 0, shortAfter: 0, plansShortBefore: 0, listed: 0, gapBefore: 0, dated: 0, ownDeps: 0, ownApart: 0, ownPlans: 0, ownWorst: 0 };
for (const [name, unitsOf] of SETS) {
  const t = { plans: 0, withDeps: 0, depYears: 0, shortBefore: 0, shortAfter: 0, plansShortBefore: 0, listed: 0, gapBefore: 0, dated: 0, ownDeps: 0, ownApart: 0, ownPlans: 0, ownWorst: 0 }; const hit = [], ownHit = [];
  for (const [id, plan] of unitsOf()) for (const [order, p] of [['as handed over', plan], ['its mirror', otherOrder(E, plan)]]) {
    const handed = swapOf(p) ? otherOrder(E, p) : p;
    if (dated(handed)) t.dated++;
    const after = landing(handed); if (!after) continue;
    HOUSE.plant = 'roomclaim'; const before = landing(handed); HOUSE.plant = '';
    t.plans++; if (after.years) t.withDeps++;
    t.depYears += after.years; t.shortAfter += after.short; t.shortBefore += before.short; t.listed += after.listed; t.gapBefore += before.listed - before.landed;
    if (before.short) { t.plansShortBefore++; if (hit.length < 12) hit.push(`${id} (${order}) ${before.short} of ${before.years} years, £${Math.round(before.landed)} of £${Math.round(before.listed)}`); }
    const oa = ownApart(after, before); t.ownDeps += oa.of; t.ownApart += oa.n; t.ownWorst = Math.max(t.ownWorst, oa.worst);
    if (oa.n) { t.ownPlans++; if (ownHit.length < 6) ownHit.push(`${id} (${order}) ${oa.n} of ${oa.of}, landed in its year up to £${Math.round(oa.worst)} more`); }
  }
  for (const k of Object.keys(tot)) tot[k] = k === 'ownWorst' ? Math.max(tot[k], t[k]) : tot[k] + t[k];
  console.log(`${name}: ${t.plans} household plans, ${t.withDeps} with the later retiree's contributions as deposits (${t.depYears} deposit years, £${Math.round(t.listed)}); before the fix ${t.plansShortBefore} plans short in ${t.shortBefore} years, £${Math.round(t.gapBefore)} not landed in its wrapper that year; with it short in ${t.shortAfter}; plans with a dated schedule ${t.dated}; the plan's own one-off deposits ${t.ownDeps}, landing otherwise with the fix ${t.ownApart} in ${t.ownPlans} plans${hit.length ? `\n    short before: ${hit.join('; ')}` : ''}${ownHit.length ? `\n    the plan's own deposits otherwise: ${ownHit.join('; ')}` : ''}`);
}
console.log(`\nIN ALL: ${tot.plans} household plans, ${tot.withDeps} with the later retiree's contributions as deposits (${tot.depYears} deposit years, £${Math.round(tot.listed)}); before the fix ${tot.plansShortBefore} plans short in ${tot.shortBefore} years, £${Math.round(tot.gapBefore)} not landed; with it ${tot.shortAfter} short: ${tot.shortAfter === 0 ? 'EVERY ONE LANDS WHOLE' : 'NOT ALL LAND'}. Plans with a dated schedule: ${tot.dated}. The plan's own one-off deposits: ${tot.ownDeps}, of which ${tot.ownApart} in ${tot.ownPlans} plans land otherwise with the fix (the later retiree's saving no longer claiming the room they compete for), landed in their year up to £${Math.round(tot.ownWorst)} more.`);
