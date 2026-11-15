/*
 * A COUPLE'S PLAN CUT INTO ONE PLAN FOR EACH PERSON (couple.js singlePlanFor): EACH PERSON'S PLAN SPENDS ITS SHARE OF THE
 * HOUSEHOLD'S, PLAN YEAR BY PLAN YEAR (the reviewer at D100's stage A read, 15 Nov, finding 6; CHECKLIST 7: the class).
 * A couple's spending bands are entered in the first person's ages ("Myself" ages, App.jsx) and the household's year reads
 * them at the first person's age; each person's plan reads its bands at its own person's age. Before this fix the cut sent
 * the bands to the partner's plan with their ages unchanged, so the partner's plan spent each band in other plan years, by
 * the age gap. It also sent the household's gifts and its regular gift from surplus income (inheritance.gifts and
 * surplusGift, which the engine folds into the year's one-off costs) whole into both plans, where every other cost is cut to
 * the share.
 *   1. the schedule: on couples built with bands (a closed band, an open one running to the plan's end, two bands; the
 *      partner younger and older), each person's plan spends, in each plan year, its share of the household's scheduled
 *      target to the pound (the cut's own rounding), at the first person's shares 0.5, 0.6 and 0.75; and through the page's
 *      own route (solverCouple.js couplePlans, the pots' share)
 *   2. the costs: on the same couples with a one-off cost, a gift and a regular gift, each person's one-off costs each year
 *      their share of the household's, within the cut's rounding (half a pound an item)
 *   3. the two plans together: each year's scheduled target and one-off costs sum to the household's, within the rounding
 *   4. the library: none of its 210 couples holds a band, a gift or a regular gift, and the cut of each, each person at its
 *      own share and at the half share, is the code before's bit for bit (the 840 cut plans' digest with the two plants on,
 *      which put the code before back, equal to it with them off)
 * Plants (COUPLE.plant): 'bandage' sends the bands at the first person's ages, as before (fails checks 1 and 3); 'giftwhole'
 * sends the gifts whole, as before (fails checks 2 and 3). --planted runs each and reads which fail.
 *   node research/tests/couple-cut.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as CPL from '../../src/solver/couple.js';
import { couplePlans } from '../../src/solverCouple.js';
import { couplesOf } from '../solver/couple-panel.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['bandage', ['1', '3']], ['giftwhole', ['2', '3']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_CUT_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const { singlePlanFor, shareFor, COUPLE } = CPL;
const PLANT = process.env.COUPLE_CUT_PLANT || '';
COUPLE.plant = PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-cut: a couple's plan cut into one plan for each person, each spending its share of the household's${PLANT ? `; planted: ${PLANT}` : ''}`);
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const library = couplesOf();
const S129 = E.normalizePlan(library.find(s => s.id === 'S129').plan);

// the couples: S129 (the first person 56, the partner 53) and the same with the partner four years older than the first
// person; each with three sets of bands, and with a one-off cost, a gift and a regular gift
function couples() {
  const c0 = ctxOf(S129), out = [];
  const older = JSON.parse(JSON.stringify(S129)); older.demographics.currentAgePart = c0.ageSelf0 + 4;
  for (const [who, base] of [['the partner younger', S129], ['the partner older', E.normalizePlan(older)]]) {
    const c = ctxOf(base), a = c.ageSelf0, tgt = Number(base.spending.targetSpend), y0 = c.baseYear;
    const sets = {
      'a closed band': [{ id: 'b1', fromAge: a + 15, toAge: a + 25, amount: Math.round(0.7 * tgt) }],
      'an open band': [{ id: 'b1', fromAge: a + 20, toAge: '', amount: Math.round(0.6 * tgt) }],
      'two bands': [{ id: 'b1', fromAge: a + 5, toAge: a + 9, amount: Math.round(1.2 * tgt) }, { id: 'b2', fromAge: a + 18, toAge: a + 30, amount: Math.round(0.75 * tgt) }]
    };
    for (const [name, bands] of Object.entries(sets)) {
      const p = JSON.parse(JSON.stringify(base));
      p.spending.spendBands = bands;
      p.oneOffCosts = [{ id: 'c1', name: 'roof', date: `${y0 + 3}-06-01`, amount: 30001 }];
      p.inheritance = { ...(p.inheritance || {}), gifts: [{ id: 'g1', year: y0 + 5, amount: 50001, desc: 'a gift' }], surplusGift: { annual: 2001, fromYear: y0 + 2, toYear: y0 + 8 } };
      out.push({ name: `${who}, ${name}`, plan: E.normalizePlan(p) });
    }
  }
  return out;
}
const CASES = couples(), SHARES = [0.5, 0.6, 0.75];
// one person's plan against the household's: plan years whose schedule is off its share, years whose costs are off theirs
function against(plan, who, share) {
  const h = ctxOf(plan), q = ctxOf(singlePlanFor(plan, who, share));
  const off = { sched: [], costs: [] }, T = h.totalYears;
  for (let t = 0; t <= T; t++) {
    const hs = E.spendTargetAtAge(h, h.ageSelf0 + t), ps = E.spendTargetAtAge(q, q.ageSelf0 + t);
    if (ps !== Math.round(share * hs)) off.sched.push(t);
    const y = h.baseYear + t, hc = h.oneOffCosts.get(y) || 0, pc = q.oneOffCosts.get(y) || 0;
    if (Math.abs(pc - share * hc) > 1.5) off.costs.push(y);
  }
  return { off, h, q, T };
}

// ---- 1. the schedule ----
{
  const bad = [];
  for (const c of CASES) for (const s of SHARES) for (const [who, share] of [['self', s], ['part', 1 - s]]) {
    const r = against(c.plan, who, share);
    if (r.off.sched.length) bad.push(`${c.name}, ${who} at ${share.toFixed(2)}: ${r.off.sched.length} plan years off (from plan year ${r.off.sched[0]})`);
  }
  // through the page's own route: the household as the page makes it, the pots' share
  const page = [];
  for (const c of CASES) {
    const cp = couplePlans(E, c.plan, { shareRule: 'pots' }), h = ctxOf(cp.household);
    for (const who of ['self', 'part']) {
      const q = ctxOf(cp.plans[who]), share = who === 'self' ? cp.share : 1 - cp.share;
      let n = 0;
      for (let t = 0; t <= h.totalYears; t++) if (E.spendTargetAtAge(q, q.ageSelf0 + t) !== Math.round(share * E.spendTargetAtAge(h, h.ageSelf0 + t))) n++;
      if (n) page.push(`${c.name}, ${who} by the page at ${share.toFixed(2)}: ${n} plan years off`);
    }
  }
  ok(1, `the schedule: each person's plan spends its share of the household's scheduled target in each plan year, on ${CASES.length} couples with bands at ${SHARES.length} shares each, and by the page's route`,
    !bad.length && !page.length, bad.length || page.length ? [...bad, ...page].slice(0, 4).join('; ') + (bad.length + page.length > 4 ? `; and ${bad.length + page.length - 4} more` : '') : `${CASES.length * SHARES.length * 2} cut plans and ${CASES.length * 2} by the page, every plan year`);
}

// ---- 2. the costs ----
{
  const bad = [];
  for (const c of CASES) for (const s of SHARES) for (const [who, share] of [['self', s], ['part', 1 - s]]) {
    const r = against(c.plan, who, share);
    if (r.off.costs.length) { const y = r.off.costs[0]; bad.push(`${c.name}, ${who} at ${share.toFixed(2)}: ${r.off.costs.length} years off (in ${y} £${Math.round(r.q.oneOffCosts.get(y) || 0)} against its share £${Math.round(share * (r.h.oneOffCosts.get(y) || 0))})`); }
  }
  ok(2, `the costs: each person's one-off costs (a cost, a gift and a regular gift) each year their share of the household's`, !bad.length,
    bad.length ? bad.slice(0, 3).join('; ') + (bad.length > 3 ? `; and ${bad.length - 3} more` : '') : `${CASES.length * SHARES.length * 2} cut plans, every year`);
}

// ---- 3. the two plans together ----
{
  const bad = [];
  for (const c of CASES) for (const s of SHARES) {
    const h = ctxOf(c.plan), a = ctxOf(singlePlanFor(c.plan, 'self', s)), b = ctxOf(singlePlanFor(c.plan, 'part', 1 - s));
    let sched = 0, costs = 0;
    for (let t = 0; t <= h.totalYears; t++) {
      const hs = E.spendTargetAtAge(h, h.ageSelf0 + t), sum = E.spendTargetAtAge(a, a.ageSelf0 + t) + E.spendTargetAtAge(b, b.ageSelf0 + t);
      if (Math.abs(sum - hs) > 1) sched++;
      const y = h.baseYear + t, hc = h.oneOffCosts.get(y) || 0, cs = (a.oneOffCosts.get(y) || 0) + (b.oneOffCosts.get(y) || 0);
      if (Math.abs(cs - hc) > 3) costs++;
    }
    if (sched || costs) bad.push(`${c.name} at ${s.toFixed(2)}: the schedule off in ${sched} plan years, the costs in ${costs}`);
  }
  ok(3, `the two plans together: each year's scheduled target and one-off costs sum to the household's`, !bad.length,
    bad.length ? bad.slice(0, 3).join('; ') + (bad.length > 3 ? `; and ${bad.length - 3} more` : '') : `${CASES.length * SHARES.length} couples and shares, every year`);
}

// ---- 4. the library: no band and no gift, and its cut the code before's ----
{
  const holds = p => (p.spending.spendBands || []).length > 0 || ((p.inheritance && p.inheritance.gifts) || []).some(g => Number(g.amount) > 0) || Number(p.inheritance && p.inheritance.surplusGift && p.inheritance.surplusGift.annual) > 0;
  const plans = library.map(s => E.normalizePlan(s.plan)), withAny = plans.filter(holds).length;
  const digest = () => { const h = createHash('sha256'); for (const p of plans) { const s = shareFor(p); for (const [who, share] of [['self', s], ['part', 1 - s], ['self', 0.5], ['part', 0.5]]) h.update(JSON.stringify(singlePlanFor(p, who, share))); } return h.digest('hex'); };
  const now = digest(), keep = COUPLE.plant;
  COUPLE.plant = [keep, 'bandage', 'giftwhole'].filter(Boolean).join(',');
  const before = digest();
  COUPLE.plant = keep;
  ok(4, `the library: ${plans.length} couples, ${withAny} holding a band, a gift or a regular gift; the ${plans.length * 4} cut plans the code before's, bit for bit`,
    plans.length === 210 && withAny === 0 && now === before, `${now.slice(0, 16)} against the code before's ${before.slice(0, 16)}`);
}

console.log(`\ncouple-cut: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
