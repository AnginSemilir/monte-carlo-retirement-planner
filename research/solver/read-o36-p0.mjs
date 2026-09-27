/*
 * O36'S CAUSE, CANDIDATE (the deep review after 7x, deep-review-log.md 27 Sep 22:32 UK): on share 0.95 the reader's
 * table at year 0 reads p0(acc0) x c, and p0 is the reader's reference chance - the plan's tiers and the opening balances'
 * mix. This prints p0 at share 0.95's opening state, per world, at the plan's tiers (the reference the solver uses, as
 * solve.js builds it) and at the 2/2 move (for comparison), with no solve: the bills from the bridge table, the mix's rho and
 * vol from each move's compiled returns. Set beside 7x's per-world table reads (results-7x.txt, READER/H00/M3 and H22/M3),
 * p0 at the plan's tiers is the table's ceiling where c is at most 1. A measurement (grade B for year 0: the code's own
 * construction, reproduced). Share 0.95 built as audit-s126.mjs's variant and diag-o35.mjs build it.
 *   node research/solver/read-o36-p0.mjs > research/solver/results-o36-p0.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { bridgeTable, vecOf } from '../../src/solver/grid.js';
import { referenceChance } from '../../src/solver/reader.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const s126 = buildScenarios().find(s => s.id === 'S126');
const p = JSON.parse(JSON.stringify(s126.plan));
const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
{ const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; }
const plan = E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const m = M.prepare(E, plan);
const s0 = vecOf(m, M.initialState(m));
const actions = buildActions({ spendLevels: [0.8, 0.9, 0.95, 1, 1.1], tiers: [[0, 0], [2, 2]] });
console.log(`O36: THE READER'S YEAR-0 REFERENCE CHANCE p0 AT SHARE 0.95'S OPENING (accessible money ${Math.round(s0[1] + s0[2])}), per world`);
// a planted check (rule 6): p0 must fall to 0 when the accessible money cannot pay today's bill, and rise with the money
let planted = null;
for (const z of [-Math.sqrt(3), 0, Math.sqrt(3)]) {
  m.shiftZ = z;
  const c = F.compile(m, actions);
  const B = bridgeTable(E, m, c, 0.8, 2);
  const o = m.ctx.owners[0], bal = id => (id && m.acc[id] ? m.acc[id].balance : 0);
  const bi = bal(o.ids.isa), bg = bal(o.ids.other), bc = bal(o.ids.cash), tot = bi + bg + bc;
  const wi = bi / tot, wg = bg / tot, wc = bc / tot;
  const out = [];
  for (const [nm, act] of [['the plan\'s tiers', c], ['2/2', c.acts[actions.findIndex(a => a.tierPen === 2 && a.tierIsa === 2)]]]) {
    const bills = [], rho = [], vol = [];
    for (let j = 0; j < B.accessAt; j++) bills.push(B.needY[j] - B.inY[j]);
    for (let j = 0; j < bills.length - 1; j++) {
      const vi = act.volEffAt[j][1], vg = act.volEffAt[j][2], vc = act.volEffAt[j][3] || 0, v = wi * vi + wg * vg + wc * vc;
      const gross = wi * (1 + act.real[1]) * Math.exp(vi * vi / 2) + wg * (1 + act.real[2]) * Math.exp(vg * vg / 2) + wc * (1 + act.real[3]) * Math.exp(vc * vc / 2);
      rho.push(Math.log(gross) - v * v / 2); vol.push(v);
    }
    const f = referenceChance(bills, rho, vol), acc = s0[1] + s0[2];
    if (planted === null) planted = f(bills[0] - 2) === 0 && f(acc) < f(acc * 1.5) && f(acc * 1.5) <= 1;
    out.push(`${nm}: p0 ${(100 * f(acc)).toFixed(2)}% (bills ${bills.map(Math.round).join(', ')}; vol ${vol.map(x => x.toFixed(4)).join(', ')})`);
  }
  console.log(`  z ${z.toFixed(3)}: ${out.join('; ')}  [mix: ISA ${wi.toFixed(3)}, taxable ${wg.toFixed(3)}, cash ${wc.toFixed(3)}]`);
}
if (!planted) { console.log('PLANTED CHECK FAILED: p0 is not 0 below the first bill, or does not rise with the money'); process.exit(1); }
console.log('planted: p0 is 0 below the first bill and rises with the money');
