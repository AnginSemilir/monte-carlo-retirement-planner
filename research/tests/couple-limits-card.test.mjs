/*
 * THE LIMITS CARD ON A COUPLE THE HOUSEHOLD ROUTE OPENS (D143; the reviewer on its change of default, finding 1: a per-person
 * edit there parted the two people's limits, which the household plan then refused, so the couple dropped to the app's rules
 * and the card, then one row, could not undo it). Since COUPLES-ANY's change of default (D148) the household plan takes the
 * partner's own limits (src/couplesSwitch.js limitsTaken, with 'risks'), so the card shows every couple the solver runs a row per
 * person. Every edit the card offers (src/limitsCard.js limitsMode, limitsRows and limitsPatch, which src/SolverConfig.jsx
 * SolverLocks shows and writes, merged as the card merges it: withLocks), read back through the guard (src/couplesSwitch.js
 * coupleSolverOn):
 *   1. on each of the registered panel's household-route units (registrations/couples-open.md's panel, the plans alone, no
 *      outcome read), as landed and with the partner's own limits carried alike beforehand: a row for each person's wrappers
 *      ('perPerson', since D148; one row a wrapper for the two of them before it), and after any edit of any row (No limit or
 *      each risk) and a second edit on another row, the couple still on, on the household route, each edit written to its
 *      person's limit;
 *   2. a couple the solver runs per person (the library's first 20 couples held 60/40, inside the guard before D143): a row for
 *      each person's wrappers ('perPerson', D5), an edit of the partner's row giving the partner their own limit and the couple
 *      still on, today's route open to it;
 *   3. no couple off for its limits since D148 (each household-route unit given a partner's own pension limit unlike the first
 *      person's): on, on the household route, the card per person, so the difference shows; and still on with the partner's
 *      row set to the first person's, or the first person's to the partner's (before D148, the plant 'beforeany', the guard
 *      kept it off for 'limits');
 *   4. a single's plan, and one carrying a partner's limits (a couple's plan made a single's): one row ('single'), its edit
 *      writing its own limit alone;
 *   5. a couple the solver does not run, its two people's limits alike (each household-route unit with nobody retiring within
 *      the plan, the partner's own limits carried alike, under the guard before D150, the plant 'beforeall': since D150 the
 *      guard keeps no couple off for its shape, the same units on the household route with the card per person, and the card's
 *      form for a couple the solver does not run is the same whatever keeps it off, couples switched off among them): kept off
 *      for its shape, one row a wrapper for the two of them ('household'), every edit of a row (No limit or each risk) writing
 *      the two people's limits alike, so they never part from the household's row;
 *   6. since D148, the card's words for a couple on the household route (src/limitsCard.js householdLimits: both people held to
 *      the more cautious of their two limits on each kind of account, as the household plan holds them, the shape 'limits'; the
 *      deep review of the registered read): said exactly where the couple is solved on the household route, the guard running
 *      it and the page's household cut (src/solverCouple.js householdCut at the couples' default form, on the couple entered
 *      elder first) taking its plan, as src/solverClient.js asks them: on the household-route units as landed and with their
 *      two people's pension limits apart (said), the library's first 20 couples held 60/40 (inside the guard before D143: said),
 *      the same with nobody retiring within the plan and the household-route units with nobody retiring (since D150 on the
 *      household route: said; under the guard and the cut before D150, the plants 'beforeall' and 'cutbeforeall', the first on
 *      today's route and the second kept off: not said), and a single (not said).
 * The limits per person themselves (the cut, the tables, the keys): research/tests/couple-limits.test.mjs.
 * Plants (--planted runs each and wants exactly its checks to fail): 'perperson' (src/limitsCard.js: the card before D143's
 * fix, per-person rows for every couple the guard runs and one row writing the first person's limit alone for any other:
 * check 5 since D148, which shows every couple the solver runs per person; checks 1 and 3 before it), 'partleft'
 * (src/limitsCard.js: the household's row leaving the partner's own limits as they were: check 5 since D148, check 1 before),
 * 'inguardhh' (src/limitsCard.js: a couple the solver runs per person given the household's one row: check 2), 'singlepart'
 * (src/limitsCard.js: a single's row writing the partner's limits it carries: check 4; the reviewer's second look, MINOR 2),
 * and since D148 'beforeanycard' (src/limitsCard.js: the card before COUPLES-ANY's change of default, one row a wrapper for a
 * couple the household route alone opens: check 1, and since D150 check 5, whose couples with nobody retiring the household
 * route alone opens), 'beforeany' (src/couplesSwitch.js: the guard before it, the partner's own limits refused: checks 1 and
 * 3, check 6, the guard's reading of the shape then apart from the page's cut, and since D150 check 5, nobody retiring refused
 * before it too) and
 * 'stricterany' (src/limitsCard.js: the household's words for every couple the guard runs, its shape not read: check 6).
 *   node research/tests/couple-limits-card.test.mjs [--planted]
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { coupleSolverOn, partLimitsDiffer, swapOf, PLANT as SWITCH_PLANT } from '../../src/couplesSwitch.js';
import { limitsMode, limitsRows, limitsPatch, withLocks, householdLimits, PLANT } from '../../src/limitsCard.js';
import { householdCut, PLANT as CUT_PLANT } from '../../src/solverCouple.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['perperson', ['5']], ['partleft', ['5']], ['inguardhh', ['2']], ['singlepart', ['4']], ['beforeanycard', ['1', '5']], ['beforeany', ['1', '3', '5', '6']], ['stricterany', ['6']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_LIMITS_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
// the card's plants, and the guard's 'beforeany' (the guard before D148)
if (process.env.COUPLE_LIMITS_PLANT === 'beforeany') SWITCH_PLANT.rule = 'beforeany';
else PLANT.rule = process.env.COUPLE_LIMITS_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const VALUES = [null, 'High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const edit = (plan, who, w, v) => withLocks(plan, limitsPatch(plan, limitsMode(plan), who, w, v));
// on the household route (since D148 the two people's limits may differ there)
const onHouse = p => { const g = coupleSolverOn(p); return g.on && g.route === 'household'; };
// an edit written to its person's limit: a per-person row its person's, the partner's own limit carried from then
const wrote = (p, who, w, v) => { const L = (p.solver && p.solver.locks) || {}; return who === 'part' ? !!L.tierCeilingPart && L.tierCeilingPart[w] === v : !!L.tierCeiling && L.tierCeiling[w] === v; };
const say = p => { const g = coupleSolverOn(p), L = (p.solver && p.solver.locks) || {}; return `${g.on ? `on${g.route ? `, ${g.route}` : ''}` : `off '${g.why}'${g.shape ? ` '${g.shape}'` : ''}`}; limits ${JSON.stringify(L.tierCeiling || null)} and the partner's ${JSON.stringify(L.tierCeilingPart || null)}`; };

const { readOpenPanel } = await import('../solver/couples-open-panel.mjs');
const units = readOpenPanel(join(HERE, '../solver/couples-open-registered-panel.json')).filter(u => u.route === 'household');

// 1. every edit the card offers on a couple the household route alone opens
{ let n = 0, bad = 0, notPerPerson = 0, parted = 0; const first = [];
  for (const u of units) for (const start of ['as landed', 'the partner\'s own limits carried alike']) {
    const base = start === 'as landed' ? u.plan : withLocks(u.plan, { tierCeiling: { pen: 'Medium/High Risk', isa: null }, tierCeilingPart: { pen: 'Medium/High Risk', isa: null } });
    if (!onHouse(base)) { bad++; if (first.length < 3) first.push(`${u.id} ${start}: not on the household route before any edit (${say(base)})`); continue; }
    if (limitsMode(base) !== 'perPerson') { notPerPerson++; if (first.length < 3) first.push(`${u.id} ${start}: the card '${limitsMode(base)}'`); }
    for (const [who, w] of limitsRows(base, limitsMode(base))) for (const v of VALUES) {
      const once = edit(base, who, w, v);
      n++; if (!onHouse(once) || !wrote(once, who, w, v)) { bad++; if (first.length < 3) first.push(`${u.id} ${start}, ${who || 'the two of you'}'s ${w} to ${v}: ${say(once)}`); continue; }
      if (partLimitsDiffer(once)) parted++;
      for (const [who2, w2] of limitsRows(once, limitsMode(once))) if (who2 !== who || w2 !== w) {
        const v2 = VALUES[(VALUES.indexOf(v) + 3) % VALUES.length], twice = edit(once, who2, w2, v2);
        n++; if (!onHouse(twice) || !wrote(twice, who2, w2, v2)) { bad++; if (first.length < 3) first.push(`${u.id} ${start}, then ${who2 || 'the two of you'}'s ${w2}: ${say(twice)}`); }
      }
    }
  }
  ok(`1. on the registered panel's ${units.length} household-route units, as landed and with the partner's own limits carried alike: the card a row for each person's wrappers (since D148), and after any edit of any row, and a second on another, the couple still on the household route, each edit written to its person's limit`,
    units.length === 44 && n > 0 && bad === 0 && notPerPerson === 0 && parted > 0, `${n} edits, ${bad} leaving the couple off or an edit unwritten, ${parted} single edits parting the two people's limits (on the household route all the same), the card not per person on ${notPerPerson}${first.length ? ` (${first.join('; ')})` : ''}`); }

// 2. a couple the solver runs per person (inside the guard before D143): D5's rows, the partner given their own limit
const lib = buildScenarios(), couples = lib.filter(s => s.plan.demographics.planningMode === 'couple').slice(0, 20);
const reheld = (plan, f) => { const re = structuredClone(plan), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * f; else if (/_part$/.test(a.id)) a.balance = tot[k] * (1 - f); }
  return re; };
{ let n = 0, bad = 0; const first = [];
  for (const c of couples) {
    const p = reheld(c.plan, 0.6), g = coupleSolverOn(p), mode = limitsMode(p);
    if (!g.on || g.lifted || mode !== 'perPerson') { bad++; if (first.length < 3) first.push(`${c.id} held 60/40: ${say(p)}, the card '${mode}'`); continue; }
    if (!limitsRows(p, mode).some(([who, w]) => who === 'part' && w === 'pen')) continue;
    const q = edit(p, 'part', 'pen', 'Low Risk'), L = q.solver.locks;
    n++; if (!coupleSolverOn(q).on || !L.tierCeilingPart || L.tierCeilingPart.pen !== 'Low Risk') { bad++; if (first.length < 3) first.push(`${c.id}: the partner's pension to Low Risk: ${say(q)}`); }
  }
  ok('2. a couple the solver runs per person (held 60/40, inside the guard before D143): a row for each person\'s wrappers, an edit of the partner\'s row giving the partner their own limit and the couple still on',
    n > 0 && bad === 0, `${n} couples edited, ${bad} wrong${first.length ? ` (${first.join('; ')})` : ''}`); }

// 3. no couple off for its limits since D148: on the household route, per person, and still on with the two set alike, either way
{ let n = 0, bad = 0; const first = [];
  for (const u of units) {
    const parted = withLocks(u.plan, { tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Low Risk', isa: null } }), mode = limitsMode(parted);
    n++;
    if (!onHouse(parted) || !partLimitsDiffer(parted) || mode !== 'perPerson') { bad++; if (first.length < 3) first.push(`${u.id} parted: ${say(parted)}, the card '${mode}'`); continue; }
    const theirs = edit(parted, 'part', 'pen', null), mine = edit(parted, 'self', 'pen', 'Low Risk');
    if (!onHouse(theirs) || !onHouse(mine)) { bad++; if (first.length < 3) first.push(`${u.id}: the partner's row to the first person's: ${say(theirs)}; the first person's to the partner's: ${say(mine)}`); }
  }
  ok('3. no couple off for its limits since D148 (a household-route unit given a partner\'s own pension limit): on the household route, the card per person, and still on with the partner\'s row set to the first person\'s or the first person\'s to the partner\'s',
    n === units.length && bad === 0, `${n} couples, ${bad} wrong${first.length ? ` (${first.join('; ')})` : ''}`); }

// 4. a single's plan, and one carrying a partner's limits (a couple's plan made a single's)
{ const s = lib.find(x => x.plan.demographics.planningMode === 'single').plan, carried = withLocks(s, { tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Medium Risk', isa: null } });
  const res = [s, carried].map(p => { const mode = limitsMode(p), patch = limitsPatch(p, mode, null, 'pen', 'Low Risk'); return { mode, patch, ok: mode === 'single' && JSON.stringify(Object.keys(patch)) === JSON.stringify(['tierCeiling']) && patch.tierCeiling.pen === 'Low Risk' }; });
  ok('4. a single\'s plan, and one carrying a partner\'s limits: one row, its edit writing its own limit alone', res.every(r => r.ok),
    res.map((r, i) => `${i ? 'carrying a partner\'s limits' : 'as entered'}: the card '${r.mode}', the patch ${JSON.stringify(r.patch)}`).join('; ')); }

// 5. a couple the solver does not run, its limits alike: one row a wrapper, every edit writing the two people's limits alike. Since
// D150 the guard keeps no couple off for its shape, so the couple is kept off by the guard before D150 (the plant 'beforeall', the
// rollback: a household-route unit with nobody retiring within the plan off for its shape); at the defaults the same on, per person
{ let n = 0, bad = 0, off = 0, onNow = 0; const first = [];
  const VAL = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
  for (const u of units) {
    const q = structuredClone(u.plan); q.demographics.retireAgeSelf = 120; q.demographics.retireAgePart = 120;
    const base = withLocks(q, { tierCeiling: { pen: 'Medium/High Risk', isa: null }, tierCeilingPart: { pen: 'Medium/High Risk', isa: null } });
    if (onHouse(base) && limitsMode(base) === 'perPerson') onNow++; else if (first.length < 3) first.push(`${u.id} with nobody retiring, at the defaults: ${say(base)}, the card '${limitsMode(base)}'`);
    const was = SWITCH_PLANT.rule; SWITCH_PLANT.rule = [was, 'beforeall'].filter(Boolean).join(',');
    try {
      const g = coupleSolverOn(base), mode = limitsMode(base);
      if (g.on || g.why !== 'shape' || g.shape !== 'noretire' || mode !== 'household') { bad++; if (first.length < 3) first.push(`${u.id} with nobody retiring, before D150: ${say(base)}, the card '${mode}'`); continue; }
      off++;
      for (const [who, w] of limitsRows(base, mode)) for (const v of [null, ...VAL]) {
        const e = edit(base, who, w, v), L = e.solver.locks;
        n++; if (partLimitsDiffer(e) || !L.tierCeiling || L.tierCeiling[w] !== v || !L.tierCeilingPart || L.tierCeilingPart[w] !== v) { bad++; if (first.length < 3) first.push(`${u.id} with nobody retiring, the ${w} row to ${v}: ${say(e)}`); }
      }
    } finally { SWITCH_PLANT.rule = was; }
  }
  ok('5. a couple the solver does not run, its two people\'s limits alike (a household-route unit with nobody retiring within the plan, the partner\'s own limits carried alike, under the guard before D150): kept off for its shape, one row a wrapper for the two of them, every edit writing the two people\'s limits alike; since D150 the same couples on the household route, the card per person',
    off === units.length && onNow === units.length && n > 0 && bad === 0, `before D150 ${off} couples kept off for 'noretire', ${n} edits, ${bad} wrong; since D150 ${onNow} of ${units.length} on the household route, per person${first.length ? ` (${first.join('; ')})` : ''}`); }

// 6. the household's words exactly where the couple is solved on the household route
{ const cutTakes = p => { try { householdCut(E, M, swapOf(p) ? otherOrder(E, p) : p, APP_COUPLE.household); return true; } catch (e) { if (/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) return false; throw e; } };
  const route = p => p.demographics.planningMode === 'couple' && !!APP_COUPLE.household && coupleSolverOn(p).on && cutTakes(p);
  const noRetire = p => { const q = structuredClone(p); q.demographics.retireAgeSelf = 120; q.demographics.retireAgePart = 120; return q; };
  const apart = p => withLocks(p, { tierCeiling: { pen: 'Medium/High Risk', isa: null }, tierCeilingPart: { pen: 'Medium Risk', isa: null } });
  // nobody retiring within the plan: since D150 on the household route (said); under the guard and the cut before D150 (the
  // plants 'beforeall' and 'cutbeforeall', the rollback; `true` below) inside the guard on today's route, outside it kept off
  const battery = [
    ...units.flatMap(u => [[`${u.id} as landed`, u.plan], [`${u.id} its pension limits apart`, apart(u.plan)], [`${u.id} with nobody retiring`, noRetire(u.plan)], [`${u.id} with nobody retiring, before D150`, noRetire(u.plan), true]]),
    ...couples.flatMap(c => [[`${c.id} held 60/40`, reheld(c.plan, 0.6)], [`${c.id} held 60/40, its pension limits apart`, apart(reheld(c.plan, 0.6))], [`${c.id} held 60/40 with nobody retiring`, apart(noRetire(reheld(c.plan, 0.6)))], [`${c.id} held 60/40 with nobody retiring, before D150`, apart(noRetire(reheld(c.plan, 0.6))), true]]),
    ['a single', lib.find(x => x.plan.demographics.planningMode === 'single').plan]];
  const before = (rolled, f) => { if (!rolled) return f(); const was = [SWITCH_PLANT.rule, CUT_PLANT.rule]; SWITCH_PLANT.rule = [was[0], 'beforeall'].filter(Boolean).join(','); CUT_PLANT.rule = 'cutbeforeall'; try { return f(); } finally { [SWITCH_PLANT.rule, CUT_PLANT.rule] = was; } };
  let said = 0, unsaid = 0, bad = 0, today = 0, kept = 0, retiringSaid = 0; const first = [];
  for (const [name, p, rolled] of battery) before(rolled, () => {
    const want = route(p), got = householdLimits(p), on = p.demographics.planningMode === 'couple' && coupleSolverOn(p).on;
    if (got) said++; else unsaid++;
    if (on && !want) today++;
    if (p.demographics.planningMode === 'couple' && !on) kept++;
    if (!rolled && /with nobody retiring$/.test(name) && got) retiringSaid++;
    if (got !== want) { bad++; if (first.length < 3) first.push(`${name}: ${got ? 'said' : 'not said'}, ${want ? 'on' : 'not on'} the household route (${say(p)})`); }
  });
  ok('6. since D148, the card says both people are held to the more cautious of their two limits on each kind of account exactly where the couple is solved on the household route (the guard running it and the page\'s household cut taking its plan): on the household-route units as landed and with their pension limits apart, and the library\'s couples held 60/40, and since D150 each with nobody retiring; not on today\'s route or on a couple kept off (each with nobody retiring, under the guard and the cut before D150) or on a single',
    bad === 0 && said > 0 && unsaid > 0 && today > 0 && kept > 0 && retiringSaid === units.length + couples.length, `${battery.length} plans: said on ${said} (of them ${retiringSaid} with nobody retiring, since D150), not on ${unsaid} (of them ${today} couples the guard runs on today's route and ${kept} kept off, before D150), ${bad} wrong${first.length ? ` (${first.join('; ')})` : ''}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
