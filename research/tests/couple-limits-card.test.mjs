/*
 * THE LIMITS CARD ON A COUPLE THE HOUSEHOLD ROUTE OPENS (D143; the reviewer on its change of default, finding 1: a per-person
 * edit there parted the two people's limits, which the household plan refuses, so the couple dropped to the app's rules and the
 * card, then one row, could not undo it). Every edit the card offers (src/limitsCard.js limitsMode, limitsRows and limitsPatch,
 * which src/SolverConfig.jsx SolverLocks shows and writes, merged as the card merges it: withLocks), read back through the guard
 * (src/couplesSwitch.js coupleSolverOn):
 *   1. on each of the registered panel's household-route units (registrations/couples-open.md's panel, the plans alone, no
 *      outcome read), as landed and with the partner's own limits carried alike beforehand: one row a wrapper for the two of
 *      them ('household'), and after any edit of any row (No limit or each risk) and a second edit on another row, the couple
 *      still on, on the household route, its two people's limits alike;
 *   2. a couple the solver runs per person (the library's first 20 couples held 60/40, inside the guard before D143): a row for
 *      each person's wrappers ('perPerson', D5), an edit of the partner's row giving the partner their own limit and the couple
 *      still on, today's route open to it;
 *   3. a couple off for its limits (each household-route unit given a partner's own pension limit unlike the first person's):
 *      the guard 'shape', 'limits'; the card per person, so the difference shows; setting the partner's row to the first
 *      person's brings it back on the household route, and so does setting the first person's row to the partner's;
 *   4. a single's plan, and one carrying a partner's limits (a couple's plan made a single's): one row ('single'), its edit
 *      writing its own limit alone.
 * The limits per person themselves (the cut, the tables, the keys): research/tests/couple-limits.test.mjs.
 * Plants (--planted runs each and wants exactly its checks to fail): 'perperson' (src/limitsCard.js: the card before the fix,
 * per-person rows for every couple the guard runs and one row writing the first person's limit alone for any other: checks 1
 * and 3), 'partleft' (src/limitsCard.js: the household's row leaving the partner's own limits as they were: check 1),
 * 'inguardhh' (src/limitsCard.js: a couple the solver runs per person given the household's one row: check 2), 'singlepart'
 * (src/limitsCard.js: a single's row writing the partner's limits it carries: check 4; the reviewer's second look, MINOR 2).
 *   node research/tests/couple-limits-card.test.mjs [--planted]
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { coupleSolverOn, partLimitsDiffer } from '../../src/couplesSwitch.js';
import { limitsMode, limitsRows, limitsPatch, withLocks, PLANT } from '../../src/limitsCard.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['perperson', ['1', '3']], ['partleft', ['1']], ['inguardhh', ['2']], ['singlepart', ['4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_LIMITS_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
PLANT.rule = process.env.COUPLE_LIMITS_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const VALUES = [null, 'High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const edit = (plan, who, w, v) => withLocks(plan, limitsPatch(plan, limitsMode(plan), who, w, v));
const onHouse = p => { const g = coupleSolverOn(p); return g.on && g.route === 'household' && !partLimitsDiffer(p); };
const say = p => { const g = coupleSolverOn(p), L = (p.solver && p.solver.locks) || {}; return `${g.on ? `on${g.route ? `, ${g.route}` : ''}` : `off '${g.why}'${g.shape ? ` '${g.shape}'` : ''}`}; limits ${JSON.stringify(L.tierCeiling || null)} and the partner's ${JSON.stringify(L.tierCeilingPart || null)}`; };

const { readOpenPanel } = await import('../solver/couples-open-panel.mjs');
const units = readOpenPanel(join(HERE, '../solver/couples-open-registered-panel.json')).filter(u => u.route === 'household');

// 1. every edit the card offers on a couple the household route alone opens
{ let n = 0, bad = 0, notHousehold = 0; const first = [];
  for (const u of units) for (const start of ['as landed', 'the partner\'s own limits carried alike']) {
    const base = start === 'as landed' ? u.plan : withLocks(u.plan, { tierCeiling: { pen: 'Medium/High Risk', isa: null }, tierCeilingPart: { pen: 'Medium/High Risk', isa: null } });
    if (!onHouse(base)) { bad++; if (first.length < 3) first.push(`${u.id} ${start}: not on the household route before any edit (${say(base)})`); continue; }
    if (limitsMode(base) !== 'household') { notHousehold++; if (first.length < 3) first.push(`${u.id} ${start}: the card '${limitsMode(base)}'`); }
    for (const [who, w] of limitsRows(base, limitsMode(base))) for (const v of VALUES) {
      const once = edit(base, who, w, v);
      n++; if (!onHouse(once)) { bad++; if (first.length < 3) first.push(`${u.id} ${start}, ${who || 'the two of you'}'s ${w} to ${v}: ${say(once)}`); continue; }
      for (const [who2, w2] of limitsRows(once, limitsMode(once))) if (who2 !== who || w2 !== w) {
        const twice = edit(once, who2, w2, VALUES[(VALUES.indexOf(v) + 3) % VALUES.length]);
        n++; if (!onHouse(twice)) { bad++; if (first.length < 3) first.push(`${u.id} ${start}, then ${who2 || 'the two of you'}'s ${w2}: ${say(twice)}`); }
      }
    }
  }
  ok(`1. on the registered panel's ${units.length} household-route units, as landed and with the partner's own limits carried alike: the card one row a wrapper for the two of them, and after any edit of any row, and a second on another, the couple still on the household route, its two people's limits alike`,
    units.length === 44 && n > 0 && bad === 0 && notHousehold === 0, `${n} edits, ${bad} leaving the couple off or its limits parted, the card per person on ${notHousehold}${first.length ? ` (${first.join('; ')})` : ''}`); }

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

// 3. a couple off for its limits: per person, and back on by setting the two alike, either way
{ let n = 0, bad = 0; const first = [];
  for (const u of units) {
    const parted = withLocks(u.plan, { tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Low Risk', isa: null } }), g = coupleSolverOn(parted), mode = limitsMode(parted);
    n++;
    if (g.on || g.why !== 'shape' || g.shape !== 'limits' || mode !== 'perPerson') { bad++; if (first.length < 3) first.push(`${u.id} parted: ${say(parted)}, the card '${mode}'`); continue; }
    const theirs = edit(parted, 'part', 'pen', null), mine = edit(parted, 'self', 'pen', 'Low Risk');
    if (!onHouse(theirs) || !onHouse(mine)) { bad++; if (first.length < 3) first.push(`${u.id}: the partner's row to the first person's: ${say(theirs)}; the first person's to the partner's: ${say(mine)}`); }
  }
  ok('3. a couple off for its limits (a household-route unit given a partner\'s own pension limit): the guard \'shape\' \'limits\', the card per person, and back on the household route by setting the partner\'s row to the first person\'s or the first person\'s to the partner\'s',
    n === units.length && bad === 0, `${n} couples, ${bad} wrong${first.length ? ` (${first.join('; ')})` : ''}`); }

// 4. a single's plan, and one carrying a partner's limits (a couple's plan made a single's)
{ const s = lib.find(x => x.plan.demographics.planningMode === 'single').plan, carried = withLocks(s, { tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Medium Risk', isa: null } });
  const res = [s, carried].map(p => { const mode = limitsMode(p), patch = limitsPatch(p, mode, null, 'pen', 'Low Risk'); return { mode, patch, ok: mode === 'single' && JSON.stringify(Object.keys(patch)) === JSON.stringify(['tierCeiling']) && patch.tierCeiling.pen === 'Low Risk' }; });
  ok('4. a single\'s plan, and one carrying a partner\'s limits: one row, its edit writing its own limit alone', res.every(r => r.ok),
    res.map((r, i) => `${i ? 'carrying a partner\'s limits' : 'as entered'}: the card '${r.mode}', the patch ${JSON.stringify(r.patch)}`).join('; ')); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
