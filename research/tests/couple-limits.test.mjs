/*
 * THE LIMITS PER PERSON (Part D, D5; research/solver/PART-D.md; the launch plan's D5: "What matters to you" and the limits per
 * person). A couple's ceilings on the riskiest tier were the household's: the same for both people's wrappers (D3). Now the
 * partner may have their own (`plan.solver.locks.tierCeilingPart`): src/solver/couple.js cuts it into the partner's plan as
 * its `tierCeiling` (the first person's plan keeps the household's), and src/solverSettings.js lockedPlan holds each person's
 * wrappers to their own, so the tables and the engine that runs the couple read the same accounts. The pension age and the lump
 * sum stay the household's: the engine keeps one pension access age and one lump-sum choice for a household.
 *   1. the cut: S069 with the first person's pension held at Medium Risk and the partner's pension at Low Risk and ISA at
 *      Medium/Low Risk: each person's plan carries their own ceilings and not the other's; the household's prepared plan holds
 *      each person's accounts to their own; the plan's normaliser keeps the partner's ceilings;
 *   2. as before where no partner's ceilings are set: every library household (420), with no ceiling, with both wrappers'
 *      and with the pension's alone, the same through lockedPlan as through the function before D5 (copied here); each
 *      couple's two plans carrying the household's locks as they were; a plan without the partner's ceilings normalised with
 *      no field for them;
 *   3. solved (light settings) with the partner's pension at Low Risk and the first person's free: the partner's table offers
 *      no pension tier riskier than Low Risk, the first person's does, and on 40 paths of the engine's run of the couple every
 *      year's joint move holds the partner's pension at Low Risk or safer;
 *   4. the partner's ceiling changed alone: the first person's plan and solve's key as they were (their stored table restored),
 *      the partner's key moved;
 *   5. a single carrying a partner's ceilings (a couple's plan made a single's: the reviewer of 14 Nov, finding 2): every one
 *      of the library's singles, with no ceiling of their own and with the pension's, the same through lockedPlan as without
 *      the field; S126 with the partner's pension at Low Risk (the reviewer's probe) keyed as without it, the tier above left
 *      to the solver.
 * Plants (--planted): COUPLE.plant 'nopartlock' (both plans keep the household's locks whole, as the cut before D5: checks 1
 * and 4; the household's accounts are held to each person's before either plan is cut, so it reaches the partner's table only
 * where the tier above would open for them) and solverSettings.js PLANT 'nopartceil' (lockedPlan holding no one to the
 * partner's own: 1 and 3), 'partfree' (the partner's wrappers left free where they have no ceilings of their own: 2) and
 * 'singlepart' (the partner's ceilings read on a single's plan, as before 14 Nov: 5).
 *   node research/tests/couple-limits.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { COUPLE, solveCouple } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { lockedPlan, PLANT as SETTINGS_PLANT } from '../../src/solverSettings.js';
import { couplePlans, householdPlan } from '../../src/solverCouple.js';
import { solveKey } from '../../src/solverKey.js';
import { solvedContext, runPath } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['nopartlock', ['1', '4']], ['nopartceil', ['1', '3']], ['partfree', ['2']], ['singlepart', ['5']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_LIMITS_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
{ const pl = process.env.COUPLE_LIMITS_PLANT || ''; if (['nopartceil', 'partfree', 'singlepart'].includes(pl)) SETTINGS_PLANT.rule = pl; else COUPLE.plant = pl; }

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const riskier = (a, b) => RISK.indexOf(a) < RISK.indexOf(b);
// src/solverSettings.js lockedPlan as it was before D5 (the identity's reference)
function lockedPlanBefore(E, plan) {
  const L = plan.solver && plan.solver.locks;
  if (!L) return { plan, riskAbove: undefined };
  let p = plan, binds = false;
  if (L.pensionBefore !== null && L.pensionBefore !== undefined) {
    const d = p.demographics || {}, now = E.num(d.privatePensionAge, 58);
    if (L.pensionBefore > now) p = { ...p, demographics: { ...d, privatePensionAge: L.pensionBefore } };
  }
  if (L.lumpSum === 'never' || L.lumpSum === 'now') p = { ...p, spending: { ...p.spending, drawdownStrategy: L.lumpSum === 'now' ? 'Full 25% Lump Sum' : 'Phased Drawdown' } };
  const tc = L.tierCeiling || {};
  for (const [w, prefix] of [['pen', 'pen_'], ['isa', 'isa_']]) {
    const ceil = tc[w];
    if (!ceil || !RISK.includes(ceil)) continue;
    binds = true;
    p = { ...p, accounts: (p.accounts || []).map(a => (a.id && a.id.startsWith(prefix) && RISK.indexOf(a.risk) < RISK.indexOf(ceil) ? { ...a, risk: ceil } : a)) };
  }
  return { plan: p, riskAbove: binds ? false : undefined };
}
const withLocks = (plan, locks) => ({ ...plan, solver: { ...(plan.solver || {}), locks: { pensionBefore: null, lumpSum: 'free', ...locks } } });
const lib = buildScenarios(), base = lib.find(s => s.id === 'S069').plan;
const SELF = { pen: 'Medium Risk', isa: null }, PART = { pen: 'Low Risk', isa: 'Medium/Low Risk' };

// 1. the cut
{ const plan = withLocks(base, { tierCeiling: SELF, tierCeilingPart: PART });
  const cut = couplePlans(E, plan), hh = householdPlan(E, plan), bad = [];
  const ls = cut.plans.self.solver.locks, lp = cut.plans.part.solver.locks;
  if (JSON.stringify(ls.tierCeiling) !== JSON.stringify(SELF) || 'tierCeilingPart' in ls) bad.push(`the first person's locks ${JSON.stringify(ls)}`);
  if (JSON.stringify(lp.tierCeiling) !== JSON.stringify(PART) || 'tierCeilingPart' in lp) bad.push(`the partner's locks ${JSON.stringify(lp)}`);
  for (const a of hh.accounts) {
    const w = a.id.startsWith('pen_') ? 'pen' : a.id.startsWith('isa_') ? 'isa' : null, who = a.id.endsWith('_part') ? 'part' : 'self';
    const ceil = w && (who === 'part' ? PART[w] : SELF[w]), was = base.accounts.find(x => x.id === a.id);
    const want = ceil && was && riskier(was.risk, ceil) ? ceil : was ? was.risk : a.risk;
    if (w && a.risk !== want) bad.push(`${a.id} ${a.risk}, not ${want}`);
  }
  const norm = E.normalizePlan(plan).solver.locks;
  if (JSON.stringify(norm.tierCeilingPart) !== JSON.stringify(PART)) bad.push(`normalised ${JSON.stringify(norm)}`);
  ok('1. S069: each person\'s plan carries their own ceilings and not the other\'s; the household\'s accounts held to each person\'s; the normaliser keeps the partner\'s', bad.length === 0,
    bad.join('; ') || `the partner's pension ${hh.accounts.filter(a => /^pen_part/.test(a.id)).map(a => a.risk).join(', ')}, the first person's ${hh.accounts.filter(a => /^pen_self/.test(a.id)).map(a => a.risk).join(', ')}`); }

// 2. as before where no partner's ceilings are set
{ let n = 0, differ = 0, cutDiffer = 0, normDiffer = 0;
  for (const s of lib) for (const locks of [null, { tierCeiling: { pen: 'Medium Risk', isa: 'Low Risk' } }, { tierCeiling: { pen: 'Medium/Low Risk', isa: null } }]) {
    const p = E.normalizePlan(locks ? withLocks(s.plan, locks) : s.plan);
    n++;
    if (JSON.stringify(lockedPlan(E, p)) !== JSON.stringify(lockedPlanBefore(E, p))) differ++;
    if (p.solver && p.solver.locks && 'tierCeilingPart' in p.solver.locks) normDiffer++;
    if (s.plan.demographics.planningMode === 'couple' && locks) {
      const cut = couplePlans(E, withLocks(s.plan, locks)), hh = householdPlan(E, withLocks(s.plan, locks));
      if (['self', 'part'].some(w => JSON.stringify(cut.plans[w].solver) !== JSON.stringify(hh.solver))) cutDiffer++;
    }
  }
  ok('2. without the partner\'s ceilings, as before: lockedPlan the function before D5\'s on every household and setting, each couple\'s two plans carrying the household\'s locks, no new field', differ === 0 && cutDiffer === 0 && normDiffer === 0,
    `${n} plans: ${differ} differ through lockedPlan; ${cutDiffer} couples' plans not carrying the household's locks; ${normDiffer} with a field for the partner's`); }

// 3. solved: the partner's pension held at Low Risk, the first person's free
{ let threw = '';
  try {
  const plan = withLocks(base, { tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Low Risk', isa: null } });
  const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
  const hh = householdPlan(E, plan);
  const cp = solveCouple(E, M, hh, { solveOne: (p, o) => solveForApp(E, M, p, { ...light, ageWith: o.partnerAge0 }) });
  const names = tab => (tab.c && tab.c.tiers && tab.c.tiers.pen ? tab.c.tiers.pen.map(t => t.name) : []);
  const partMenu = names(cp.tables.part), selfMenu = names(cp.tables.self);
  const sc = solvedContext(E, cp), held = [];
  const ctx = { ...sc, policyOverride: { ...sc.policyOverride, choose(st, t) { const j = sc.policyOverride.choose(st, t); if (j && j.perOwner) held.push({ part: j.perOwner.part.tierPenName, self: j.perOwner.self.tierPenName }); return j; } } };
  for (const zs of E.pathsForSeed(99001, 40, sc.totalYears)) runPath(E, ctx, Float64Array.from(zs));
  const partOver = held.filter(h => h.part && riskier(h.part, 'Low Risk')).length, selfOver = held.filter(h => h.self && riskier(h.self, 'Low Risk')).length;
  ok('3. solved: the partner\'s table offers no pension tier riskier than their ceiling, the first person\'s does; on 40 paths every year holds the partner\'s pension at Low Risk or safer',
    partMenu.length > 0 && partMenu.every(x => !riskier(x, 'Low Risk')) && selfMenu.some(x => riskier(x, 'Low Risk')) && partOver === 0,
    `the partner's pension tiers ${partMenu.join(', ') || 'none'}; the first person's ${selfMenu.join(', ') || 'none'}; ${held.length} years run, the partner's riskier than Low Risk in ${partOver}, the first person's in ${selfOver}`);
  } catch (e) { threw = e.message; }
  // a household and a table that disagree on a person's tier are refused (model.js step), never run: a failure of this check
  if (threw) ok('3. solved: the partner\'s table offers no pension tier riskier than their ceiling, the first person\'s does; on 40 paths every year holds the partner\'s pension at Low Risk or safer', false, `threw: ${threw}`); }

// 4. a change to the partner's ceilings alone leaves the first person's plan, and so their solve's key, as it was: their stored
// table is restored, only the partner's solved again
{ const a = couplePlans(E, withLocks(base, { tierCeiling: SELF, tierCeilingPart: PART })), b = couplePlans(E, withLocks(base, { tierCeiling: SELF, tierCeilingPart: { ...PART, pen: 'Cash Equivalents' } }));
  const ka = { self: await solveKey(E, a.plans.self, { ageWith: a.ageWith.self }), part: await solveKey(E, a.plans.part, { ageWith: a.ageWith.part }) };
  const kb = { self: await solveKey(E, b.plans.self, { ageWith: b.ageWith.self }), part: await solveKey(E, b.plans.part, { ageWith: b.ageWith.part }) };
  ok('4. the partner\'s ceiling changed alone: the first person\'s plan and key as they were, the partner\'s key moved',
    JSON.stringify(a.plans.self) === JSON.stringify(b.plans.self) && ka.self === kb.self && ka.part !== kb.part, `the first person's key ${ka.self.slice(0, 12)} and ${kb.self.slice(0, 12)}; the partner's ${ka.part.slice(0, 12)} and ${kb.part.slice(0, 12)}`); }

// 5. a single carrying a partner's ceilings: locked, keyed and solved as without them
{ const stray = { pen: 'Low Risk', isa: 'Low Risk' };
  let n = 0, differ = 0;
  for (const s of lib.filter(x => x.plan.demographics.planningMode === 'single')) for (const tc of [{ pen: null, isa: null }, { pen: 'Medium Risk', isa: null }]) {
    const p = E.normalizePlan(withLocks(s.plan, { tierCeiling: tc })), q = E.normalizePlan(withLocks(s.plan, { tierCeiling: tc, tierCeilingPart: stray }));
    n++;
    if (JSON.stringify(lockedPlan(E, q)) !== JSON.stringify(lockedPlan(E, p))) differ++;
  }
  const s126 = lib.find(x => x.id === 'S126').plan;
  const p = E.normalizePlan(withLocks(s126, { tierCeiling: { pen: null, isa: null } })), q = E.normalizePlan(withLocks(s126, { tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Low Risk', isa: null } }));
  const kp = await solveKey(E, p), kq = await solveKey(E, q), lq = lockedPlan(E, q);
  ok('5. a single carrying a partner\'s ceilings locks, keys and solves as without them: lockedPlan the same on every single and setting; S126 keyed as without them, the tier above left to the solver',
    n > 0 && differ === 0 && kp === kq && lq.riskAbove === undefined, `${n} plans: ${differ} differ through lockedPlan; S126's key ${kp.slice(0, 12)} and ${kq.slice(0, 12)}; its riskAbove ${lq.riskAbove}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
