/*
 * S126'S DEAD CORNER, REPLICATED (PLAN.md "S126's dead corner (#106)"; prediction written there before this ran).
 *
 *   node research/solver/audit-s126.mjs variants [points=16] [paths=1000]   S126 varied one factor at a time
 *   node research/solver/audit-s126.mjs scan                                the library singles in the class, from inputs
 *   node research/solver/audit-s126.mjs ids S126,S…  [points] [paths]       named library households
 *
 * For each household: the pension share a0, the bridge years B and the cliff a* = 1 - N/W (N the bridge's need at
 * target, net of guaranteed income), the table's opening survival and the simulated survival of the solver's own
 * policy on held paths (seed 7002). Flags as step 2's baseline: single table, tiers, levels 1.2..0.8, raise weight
 * 0.003, resilience 0, exact final year, lambda held at S126's landed value.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const mode = process.argv[2] || 'variants';
const POINTS = Number(process.argv[3] || 16), NP = Number(process.argv[4] || 1000);
const LAMBDA = 0.0223606797749979;
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;

/* S126 with its pension share, bridge length and wealth changed; everything else as it is */
function variant(name, { a0 = 0.85, bridge = 2, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * W) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * W) };
    return a;
  });
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}

/* the inputs' view: pension share, bridge years, the bridge's need and the cliff */
function facts(plan) {
  const pl = E.resolveMpaa(E.normalizePlan(plan));
  const ctx = E.buildContext(pl);
  const o = ctx.owners[0];
  const bal = (re) => pl.accounts.filter(a => re.test(a.category) && a.owner === 'Myself').reduce((t, a) => t + E.num(a.balance, 0), 0);
  const pen = bal(/^Pensions/), liq = bal(LIQ), W = pen + liq;
  const retired = ctx.ageSelf0 >= o.retireAge;
  const B = Math.max(0, ctx.nmpa - Math.max(ctx.ageSelf0, o.retireAge));
  let need = 0;
  for (let k = 0; k < B; k++) {
    const age = Math.max(ctx.ageSelf0, o.retireAge) + k;
    const guaranteed = ctx.otherIncomes.reduce((t, inc) => t + (age >= inc.startAge && age <= inc.endAge ? inc.amount : 0), 0) + (age >= ctx.spa ? o.statePension : 0);
    need += Math.max(0, E.spendTargetAtAge(ctx, age) - guaranteed) * (k === 0 && ctx.ageSelf0 >= o.retireAge ? ctx.yf : 1);
  }
  const a0 = W > 0 ? pen / W : 0, aStar = W > 0 ? 1 - need / W : 1;
  return { pl, ctx, a0, B, need, W, liq, aStar, retired, inClass: B > 0 && a0 > 0.8 && a0 < aStar };
}

function measure(h) {
  const f = facts(h.plan);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const m = M.prepare(E, plan);
  const t0 = Date.now();
  const r = solve(E, M, plan, { points: POINTS, lambda: LAMBDA, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: true });
  const table = 100 * r.value(M.initialState(m), 0).survival;
  let ok = 0, below = 0, tierYrs = 0; const paths = E.pathsForSeed(7002, NP, m.ctx.totalYears);
  for (const zs of paths) { const o = runPolicy(r, zs); if (o.survived) ok++; below += (o.spendYears || 0) - (o.atTarget || 0);   // atTarget counts every year at or above target tierYrs += o.tierPenYears || 0; }
  const sim = 100 * ok / NP;
  return { ...f, table, sim, gap: table - sim, below: below / NP, tierYrs: tierYrs / NP, secs: (Date.now() - t0) / 1000 };
}

const f1 = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const line = (id, x) => console.log(`${id.padEnd(16)} a0 ${f1(x.a0, 2)}  B ${x.B}  W ${f1(x.W / 1000, 0)}k  need ${f1(x.need / 1000, 0)}k  a* ${f1(x.aStar, 3)}  class ${x.inClass ? 'YES' : 'no '}  |  table ${f1(x.table).padStart(5)}  sim ${f1(x.sim).padStart(5)}  gap ${f1(x.gap).padStart(6)}  |  years below/path ${f1(x.below)}  pension below plan tier ${f1(x.tierYrs)} yrs  (${f1(x.secs, 0)} s)`);

if (mode === 'scan') {
  console.log('Library singles in a bridge year at the start, by the class test (0.8 < a0 < a*), from inputs only:');
  let n = 0;
  for (const s of all) {
    const f = facts(s.plan);
    if (f.B > 0 && f.a0 > 0.6) { n++; console.log(`${s.id.padEnd(6)} ${s.name.slice(0, 44).padEnd(44)} a0 ${f.a0.toFixed(2)}  B ${f.B}  a* ${f.aStar.toFixed(3)}  retired ${f.retired ? 'yes' : 'no '}  class ${f.inClass ? 'YES' : 'no'}`); }
  }
  console.log(`${n} singles in a bridge with a0 > 0.6; in the class: ${all.filter(s => facts(s.plan).inClass).map(s => s.id).join(' ') || 'none'}`);
} else if (mode === 'ids') {
  for (const id of process.argv[3].split(',')) line(id, measure(all.find(s => s.id === id)));
} else {
  const V = [
    variant('S126', {}), variant('share 0.50', { a0: 0.5 }), variant('share 0.70', { a0: 0.7 }), variant('share 0.78', { a0: 0.78 }),
    variant('share 0.90', { a0: 0.9 }), variant('share 0.95', { a0: 0.95 }), variant('bridge 0', { bridge: 0 }), variant('bridge 1', { bridge: 1 }),
    variant('bridge 4', { bridge: 4 }), variant('bridge 6', { bridge: 6 }), variant('wealth x0.5', { scale: 0.5 }), variant('wealth x2', { scale: 2 })
  ];
  console.log(`S126 VARIED, ${POINTS} points, ${NP} held paths (seed 7002), lambda ${LAMBDA}`);
  for (const v of V) line(v.id, measure(v));
}
