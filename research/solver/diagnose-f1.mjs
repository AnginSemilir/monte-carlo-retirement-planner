/*
 * WHY F1 MISSED WHAT IT MISSED (inputs only, no solve; 24 Sep, answering the maintainer: "look again at what could be
 * done"). Part 1: every library household retired before pension access, and what F1's coverage test says with and
 * without money arriving later in the bridge. Part 2: F1's cap as built (no growth) against a cap with expected growth,
 * for the cases it misread. Output kept in results-f1-misses.txt.
 *
 *   node research/solver/diagnose-f1.mjs
 */

// without the money arriving later in the bridge (deposits such as inheritances) and with expected growth
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const out = { singles: 0, couples: 0, bridgeSingles: [], bridgeCouples: [] };
for (const s of buildScenarios()) {
  const couple = s.plan.demographics.planningMode !== 'single';
  const plan = { ...s.plan, spending: { ...s.plan.spending, floorSpend: Math.round(0.8 * E.num(s.plan.spending.targetSpend, 0)) } };
  const pl = E.resolveMpaa(E.normalizePlan(plan)); const ctx = E.buildContext(pl);
  couple ? out.couples++ : out.singles++;
  // a retired bridge: some owner retired (or retiring) before their own access age
  const bridges = ctx.owners.map(o => ({ o, start: Math.max(o === ctx.owners[0] ? ctx.ageSelf0 : (ctx.agePart0 ?? ctx.ageSelf0), o.retireAge), access: ctx.nmpa })).filter(b => b.access - b.start > 0);
  if (!bridges.length) continue;
  const o = ctx.owners[0], start = Math.max(ctx.ageSelf0, o.retireAge), B = Math.max(0, ctx.nmpa - start);
  const liq = pl.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  const y0 = new Date().getFullYear();
  let need = 0, bal = liq, minBal = liq, inflow = 0;
  for (let k = 0; k < B; k++) {
    const age = start + k, year = y0 + (age - ctx.ageSelf0);
    const inc = ctx.otherIncomes.reduce((t, i) => t + (age >= i.startAge && age <= i.endAge ? i.amount : 0), 0);
    const dep = (s.plan.oneOffContributions || []).filter(d => Number(d.year) === year).reduce((t, d) => t + d.amount, 0);
    const n = Math.max(0, ctx.floorFrac * E.spendTargetAtAge(ctx, age) - inc) + (ctx.oneOffCosts?.get?.(year) || 0);
    need += n; inflow += dep; bal = bal + dep - n; minBal = Math.min(minBal, bal);
  }
  const rec = { id: s.id, B, cover: liq / (need || 1), coverWithInflows: (liq + inflow) / (need || 1), shortAtSomePoint: minBal < 0, inflow };
  (couple ? out.bridgeCouples : out.bridgeSingles).push(rec);
}
const S = out.bridgeSingles;
console.log(`library: ${out.singles} singles, ${out.couples} couples`);
console.log(`singles retired before access (first person): ${S.length}; bridge length ${[...new Set(S.map(x => x.B))].sort((a,b)=>a-b).join(',')} years`);
console.log(`  covered without growth or inflows: ${S.filter(x => x.cover >= 1).length}; short on that test: ${S.filter(x => x.cover < 1).length}`);
console.log(`  of the short, covered once dated inflows count (year by year): ${S.filter(x => x.cover < 1 && !x.shortAtSomePoint).length}  [${S.filter(x => x.cover < 1 && !x.shortAtSomePoint).map(x=>x.id).join(' ')}]`);
console.log(`  near the edge (coverage 0.8-1.25): ${S.filter(x => x.cover >= 0.8 && x.cover < 1.25).length}  [${S.filter(x => x.cover >= 0.8 && x.cover < 1.25).map(x => x.id + ' ' + x.cover.toFixed(2)).join(', ')}]`);
console.log(`couples with a bridge for at least one partner: ${out.bridgeCouples.length} (F1 reads only the first person's bridge)`);

console.log('');


const P = E.DEFAULT_RISK_PROFILES;
const Phi = z => 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3)));
const rp = k => ({ mu: P[k].real / 100, sd: (P[k].vol ?? P[k].volatility ?? P[k].sd) / 100 });
console.log('profiles:', Object.entries(P).map(([k, v]) => `${k} real ${v.real} vol ${v.vol ?? v.volatility ?? v.sd}`).join(' | '));
// S126's accessible mix: ISA 76k Medium/High, GIA 19k Medium, cash 48k; the variants scale it
const mix = { isa: 76, gia: 19, cash: 48 }, inv = mix.isa + mix.gia, acc = inv + mix.cash;
const mh = rp('Medium/High Risk'), md = rp('Medium Risk'), cs = rp('Cash Equivalents');
const muInv = (mix.isa * mh.mu + mix.gia * md.mu) / inv, sdInv = (mix.isa * mh.sd + mix.gia * md.sd) / inv, f = inv / acc;
const mu = f * muInv + (1 - f) * cs.mu, sd = f * sdInv;
const cases = [ ['share 0.95 (B 2, cov 1.02)', 1.02, 2, 68.2, 57.4], ['bridge 6 (B 6, cov 1.02)', 1.02, 6, 99.3, 53.3], ['S366 (B 8, cov 0.77; with the inheritance at year 4: covered)', 0.77, 8, 99.2, 3.0], ['S360 (B 8, cov 0.84, lean)', 0.84, 8, 44.1, 4.3] ];
console.log(`accessible mix: invested share ${f.toFixed(2)}, expected real return ${(100 * mu).toFixed(2)}%/yr, spread ${(100 * sd).toFixed(1)}%/yr`);
console.log('case | simulated | F1 read | F1 cap as built (no growth) | cap with growth (spend spread over the bridge)');
for (const [name, cov, T, sim, read] of cases) {
  const capBuilt = Phi(Math.log(cov) / (sd * Math.sqrt(T)));
  // money spent evenly over T years is invested on average about half the bridge: growth on the balance ~ mu*T/2
  const capGrowth = Phi((Math.log(cov) + mu * T / 2) / (sd * Math.sqrt(T / 2)));
  console.log(`${name} | ${sim} | ${read} | ${(100 * capBuilt).toFixed(1)} | ${(100 * capGrowth).toFixed(1)}`);
}
