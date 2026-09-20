/*
 * THE FAST FLOW IS THE EXACT MODEL, REARRANGED - AND THIS IS WHAT PROVES IT.
 *
 * `model.js` is held to the engine to the pound. `fast.js` is the same year written for the solver:
 * no allocation, calendars and tax as tables, the state as six numbers. Every saving is a chance to
 * compute a different year, so it is held to `model.js` the same way `model.js` is held to the engine,
 * on random positions across the library rather than on a fixture that happens to be easy.
 *
 * Both halves of a solver year are checked: the flow (everything before the markets act) and growth
 * from the post-decision state. Speed is asserted too, because speed is why the file exists.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const actions = buildActions();
let rng = 12345; const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };

console.log('=========== A. RANDOM POSITIONS AND MOVES, AGAINST THE EXACT MODEL ===========');
{
  let worst = 0, where = '', n = 0, flagDiff = 0, worstGrow = 0;
  for (let h = 0; h < 16; h++) {
    const sc = singles[Math.floor(h * singles.length / 16)];
    const m = M.prepare(E, prep(sc.plan));
    const c = F.compile(m, actions);
    const o = m.ctx.owners[0];
    const spend = E.spendTargetAtAge(m.ctx, m.ctx.ageSelf0);
    for (let k = 0; k < 400; k++) {
      const t = Math.floor(rand() * (m.ctx.totalYears + 1));
      const ai = Math.floor(rand() * actions.length);
      const pen = rand() < 0.15 ? 0 : spend * Math.exp(rand() * 6 - 2);
      const isa = rand() < 0.15 ? 0 : spend * Math.exp(rand() * 6 - 2);
      const tax = rand() < 0.15 ? 0 : spend * Math.exp(rand() * 6 - 2);
      const gf = [0.05, 0.25, 0.55][Math.floor(rand() * 3)];
      const pf = [0, 0.5, 1][Math.floor(rand() * 3)];
      const cash = Math.min(tax, F.cashSplit(c, t, tax)); const gia = tax - cash;
      const st = { pots: {}, basis: { self: gia * (1 - gf), part: 0 }, cgtCarry: { self: 0, part: 0 }, cumPcls: { self: pf * m.P.lsa, part: 0 }, lumpTaken: { self: pf > 0, part: false } };
      m.ctx.accounts.forEach(a => { st.pots[a.id] = 0; });
      st.pots[o.ids.pen] = pen; st.pots[o.ids.isa] = isa; st.pots[o.ids.other] = gia; st.pots[o.ids.cash] = cash;
      const a = { ...actions[ai], sweepCash: true, lump: false };
      const row = M.step(m, st, a, t, null, true);
      const s = Float64Array.from([pen, isa, tax, gf, pf * m.P.lsa, pf > 0 ? 1 : 0]);
      const unmet = F.flow(c, t, ai, s);
      const g2 = st.pots[o.ids.other], b2 = st.basis.self;
      const mGf = g2 > 0 ? Math.max(0, Math.min(1, (g2 - b2) / g2)) : 0;
      n++;
      for (const [key, x, y] of [
        ['pension', st.pots[o.ids.pen], s[0]], ['ISA', st.pots[o.ids.isa], s[1]], ['taxable', st.pots[o.ids.other] + st.pots[o.ids.cash], s[2]],
        ['gain fraction x1e5', mGf * 1e5, s[3] * 1e5], ['tax-free used', st.cumPcls.self, s[4]],
        ['unmet', row.unmetDemand, unmet], ['income tax', row.taxPaid, c.last.taxPaid], ['CGT', row.cgtPaid, c.last.cgtPaid], ['pension drawn', row.drawdownPensions, c.last.drawdown]
      ]) { const d = Math.abs(x - y); if (d > worst) { worst = d; where = `${sc.id} year ${t} move ${ai} ${key}: ${x.toFixed(2)} vs ${y.toFixed(2)}`; } }
      if ((row.preNmpaInsolvent ? 1 : 0) !== (c.last.preNmpaInsolvent ? 1 : 0)) flagDiff++;
      const grown = M.cloneState(st); M.grow(m, grown, t, null);
      const s2 = Float64Array.from(s); F.grow(c, t, s2, c.real);
      worstGrow = Math.max(worstGrow, Math.abs(grown.pots[o.ids.pen] - s2[0]), Math.abs(grown.pots[o.ids.isa] - s2[1]), Math.abs(grown.pots[o.ids.other] + grown.pots[o.ids.cash] - s2[2]));
    }
  }
  ok(`A1  the flow agrees with the exact model on ${n} random positions and moves`, worst < 0.01, `worst £${worst.toFixed(4)}${worst >= 0.01 ? ' at ' + where : ''}`);
  ok('A2  ...including the pre-access insolvency flag', flagDiff === 0, `${flagDiff} disagreements`);
  ok('A3  ...and growth from the post-decision state', worstGrow < 0.01, `worst £${worstGrow.toFixed(4)}`);
}

console.log('=========== B. THE TAX TABLE IS THE ENGINE\'S TAX ===========');
{
  const m = M.prepare(E, prep(singles[20].plan));
  const c = F.compile(m, actions);
  let worst = 0;
  for (let g = 0; g <= 400000; g += 137) worst = Math.max(worst, Math.abs(E.calculateUKNetIncome(g, m.P) - netOfPublic(c, g)));
  ok('B1  net income from the table matches the engine at every £137 to £400k', worst < 0.01, `worst £${worst.toFixed(4)}`);
  const sc = { ...singles[20].plan, config: { ...singles[20].plan.config, taxRegion: 'scotland' } };
  const ms = M.prepare(E, prep(sc)); const cs = F.compile(ms, actions);
  let worstS = 0;
  for (let g = 0; g <= 400000; g += 137) worstS = Math.max(worstS, Math.abs(E.calculateUKNetIncome(g, ms.P) - netOfPublic(cs, g)));
  ok('B2  ...and for a Scottish taxpayer, whose ladder has six rungs', worstS < 0.01, `worst £${worstS.toFixed(4)}`);
}
function netOfPublic(c, g) { const tb = c.tb; if (g <= 0) return 0; let i = 0; while (i < tb.n - 2 && g > tb.xs[i + 1]) i++; return tb.ys[i] + (g - tb.xs[i]) * tb.slope[i]; }

console.log('=========== C. SPEED, WHICH IS WHY THE FILE EXISTS ===========');
{
  const m = M.prepare(E, prep(singles[40].plan)); const c = F.compile(m, actions);
  const s = new Float64Array(6); const st0 = M.initialState(m); const a = { ...actions[7], sweepCash: true };
  const reps = 200000;
  let t0 = Date.now(); for (let i = 0; i < reps; i++) { s[0] = 300000; s[1] = 100000; s[2] = 50000; s[3] = 0.2; s[4] = 0; s[5] = 0; F.flow(c, i % (m.ctx.totalYears + 1), 7, s); }
  const fastNs = (Date.now() - t0) * 1e6 / reps;
  t0 = Date.now(); for (let i = 0; i < 20000; i++) { const st = M.cloneState(st0); M.step(m, st, a, i % (m.ctx.totalYears + 1), null, true); }
  const modelNs = (Date.now() - t0) * 1e6 / 20000;
  console.log(`      per year: exact model ${modelNs.toFixed(0)}ns, fast flow ${fastNs.toFixed(0)}ns (${(modelNs / fastNs).toFixed(1)}x)`);
  ok('C1  the fast flow is at least five times the exact model', modelNs / fastNs >= 5, `${(modelNs / fastNs).toFixed(1)}x`);
  ok('C2  ...and under a microsecond a year', fastNs < 1000, `${fastNs.toFixed(0)}ns`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
