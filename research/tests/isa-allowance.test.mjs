/*
 * A YEAR'S DEPOSITS AND STAGED TRANSFERS INTO AN ISA COUNT IN THAT YEAR'S ALLOWANCE (D130 (1); the windfall read's reviewer,
 * finding 1, research/solver/reviews/2026-11-18-read-windfall.md; CHECKLIST 7: the test of the defect's class).
 *
 * The engine's year (src/App.jsx stepYear) counts each person's ISA subscriptions in `isaContribThisYear`, and every flow the
 * year itself sends into the ISA reads its room there: the cash ISA's subscription (2a), the surplus sweep, the draw-first and
 * harvest re-wraps, N4's CGT move and the cash ISA's shelter (7e). The flows the plan fixes come first: the year's dated
 * deposits (step 1, the windfall split's variants among them), its staged transfers out of the taxable account (1.5) and the
 * regular contributions (2). Before 19 Nov steps 1 and 1.5 were not counted, so the year's own flows could put a whole
 * allowance on top of a deposit: on S090 under its own pick (Windfall to ISA), £20,000 of its windfall into the ISA in plan
 * year 4 and the cash ISA's shelter on top. The exact model (src/solver/model.js) and the forward run (src/solver/fast.js)
 * repeated it.
 *   1. the engine, on a copy of research/engine.mjs with a recorder beside each flow into an ISA (the fixed flows at steps 1,
 *      1.5 and 2; the year's own flows wherever `isaContribThisYear[o.key]` is added to), stepped year by year: in every year
 *      of every path, for each person, the year's own flows into the ISA add at most what the allowance leaves after the
 *      fixed ones;
 *      a. S090 of Phase 4's panel under its own pick, 200 paths of seed 7002 (the reviewer's case);
 *      b. every plan of the library (its singles and couples) with a dated deposit or a staged transfer into an ISA, as
 *         entered (none, on 19 Nov) and under Windfall to ISA where it holds an Auto deposit (210), 40 paths each;
 *      c. S026 of Phase 4's panel under the windfall split's table at light settings (a table's move: split 1 puts £20,000
 *         into the ISA), 200 paths;
 *   2. the recorder found what it records: the year's own flows at their six places, and years with a deposit or staged
 *      transfer into an ISA run in a, b and c (so check 1 had something to bite on);
 *   3. the exact model keeps step with the engine on S090: a table hands both its own policy's move each year (sweeping its
 *      cash, the cash ISA's money to the ISA), the same market (couple.js ratesAt), every pot and the cash ISA within a pound
 *      at the top of every year, 50 paths.
 * The forward run's lockstep with the engine on such a year is gaps-sweep's case "a deposit into the ISA in a year that
 * re-wraps or sweeps" (the full tier), its plant `ISA.plant = 'uncounted'` (fast.js) parting the two.
 * The plants (--planted runs both): ISA_PLANT=uncounted, this test on a copy of the engine with the fix's two lines taken out
 * (the engine before 19 Nov): check 1 fails; ISA_PLANT=model, the exact model's plant `MODEL.plant = 'isauncounted'`: check 3
 * fails. Shown failing on the code before the fix: ROOT=<a checkout at 9d2b0a75> (results-isa-allowance.txt).
 *   node research/tests/isa-allowance.test.mjs [--planted]
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ROOT = process.env.ROOT ? resolve(process.env.ROOT) : join(dirname(SELF), '..', '..');
const PLANT = process.env.ISA_PLANT || '';
const imp = p => import(pathToFileURL(join(ROOT, p)).href);

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['uncounted', ['1']], ['model', ['3']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, ISA_PLANT: plant }, encoding: 'utf8' });
    const failed = [...r.stdout.matchAll(/^FAIL {2}(\d+)/gm)].map(m => m[1]);
    const ok = want.every(w => failed.includes(w)) && failed.every(f => want.includes(f));
    if (!ok) bad++;
    console.log(`planted ${plant}: the checks that fail: ${failed.join(', ') || 'none'}; exactly ${want.join(' and ')}: ${ok ? 'yes' : 'NO'}`);
  }
  process.exit(bad ? 1 : 0);
}

/* the engine with the recorder: anchors read off research/engine.mjs, each found exactly once (the six sites of the year's own
   flows counted). With `uncounted` the fix's two lines are taken out first, as the engine was before 19 Nov. */
const FIX_DEP = "    if (x.id.startsWith('isa_')) isaContribThisYear[ownerOfId(x.id)] += x.amount;   // a subscription (above)\n";
const FIX_DRIP = "    if (x.toId.startsWith('isa_')) isaContribThisYear[ownerOfId(x.toId)] += move;   // Bed & ISA: a subscription (above)\n";
export function instrument(src, { uncounted = false } = {}) {
  let s = src;
  const once = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`isa-allowance: an anchor is in the engine ${n} times, not once: ${a.slice(0, 90)}`); s = s.replace(a, () => b); };
  if (uncounted) { once(FIX_DEP, ''); once(FIX_DRIP, ''); }
  const R = 'globalThis.__isaRec';
  once("pots[x.id] += x.amount;\n    if (cgtOn && x.id.startsWith('other_')) giaAddBasis(state, ownerOfId(x.id), x.amount);\n",
    `pots[x.id] += x.amount;\n    if (cgtOn && x.id.startsWith('other_')) giaAddBasis(state, ownerOfId(x.id), x.amount);\n    if (${R} && x.id.startsWith('isa_')) { ${R}.fixed[ownerOfId(x.id)] += x.amount; ${R}.dep[ownerOfId(x.id)] += x.amount; }\n`);
  once('pots[x.toId] = (pots[x.toId] || 0) + (x.uplift ? move * x.uplift : move);',
    `pots[x.toId] = (pots[x.toId] || 0) + (x.uplift ? move * x.uplift : move); if (${R} && x.toId.startsWith('isa_')) { ${R}.fixed[ownerOfId(x.toId)] += move; ${R}.dep[ownerOfId(x.toId)] += move; }`);
  once("if (a.cat === 'isa') isaContribThisYear[a.owner] += amt * frac;",
    `if (a.cat === 'isa') isaContribThisYear[a.owner] += amt * frac; if (${R} && a.cat === 'isa') ${R}.fixed[a.owner] += amt * frac;`);
  let sites = 0;
  s = s.replace(/isaContribThisYear\[o\.key\] \+= ([\w.]+);/g, (m, v) => { sites++; return `isaContribThisYear[o.key] += ${v}; if (${R}) ${R}.own[o.key] += ${v};`; });
  return { src: s, sites };
}

const srcEngine = readFileSync(join(ROOT, 'research/engine.mjs'), 'utf8');
const inst = instrument(srcEngine, { uncounted: PLANT === 'uncounted' });
// the copy imports nothing (the generated engine is one file): written to a temporary folder, removed at the end
const tmp = mkdtempSync(join(tmpdir(), 'isa-allowance-'));
writeFileSync(join(tmp, 'engine.mjs'), inst.src);
const EI = await import(pathToFileURL(join(tmp, 'engine.mjs')).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js');
const { ratesAt } = await imp('src/solver/couple.js');
const { withTable } = await imp('src/solver/bridge.js');
const { solveCandidate } = await imp('research/solver/candidate.mjs');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
if (PLANT === 'model') M.MODEL.plant = 'isauncounted';

let passed = 0, failed = 0;
const ok = (n, name, cond, note = '') => { if (cond) passed++; else failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${n}  ${name}${note ? '  -- ' + note : ''}`); };
const SEED = 7002;
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`;

/* one plan's paths through the instrumented engine, year by year: the worst overshoot of the year's own flows past what the
   allowance left after the fixed ones, and the person-years with a deposit or staged transfer into the ISA (where the class bites) */
function allowanceOf(EIx, plan, n) {
  const ctx = EIx.buildContext(plan), T = ctx.totalYears, A = ctx.P.isaAllowance, paths = EIx.pathsForSeed(SEED, n, T);
  let worst = 0, at = '', bites = 0, years = 0;
  for (let i = 0; i < paths.length; i++) {
    const zs = paths[i], st = EIx.freshState(ctx);
    for (let t = 0; t <= T; t++) {
      globalThis.__isaRec = { fixed: { self: 0, part: 0 }, dep: { self: 0, part: 0 }, own: { self: 0, part: 0 } };
      EIx.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 });
      const rec = globalThis.__isaRec; globalThis.__isaRec = null; years++;
      for (const k of ['self', 'part']) {
        if (rec.dep[k] > 0) bites++;
        const over = rec.own[k] - Math.max(0, A - rec.fixed[k]);
        if (over > worst + 1e-9) { worst = over; at = `path ${i} year ${t} ${k}: fixed ${gbp(rec.fixed[k])}, the year's own ${gbp(rec.own[k])}`; }
      }
    }
  }
  return { worst, at, bites, years, n: paths.length };
}

// ---- 1a. S090 under its own pick (the reviewer's case) ----
const panel = readPanel(), byId = Object.fromEntries(panel.map(h => [h.id, h]));
const ownPlan = id => { const h = byId[id], a = armA(appPlan(h.plan), { tournament: false }); return { plan: { ...appPlan(h.plan), spending: { ...appPlan(h.plan).spending, decumulationPolicy: a.planState.spending.decumulationPolicy } }, label: a.label }; };
const s090 = ownPlan('S090');
const r1a = allowanceOf(EI, s090.plan, 200);
// ---- 1b. the library's plans with a deposit or staged transfer into an ISA ----
const isaFlowsOf = ctx => { let n = 0; for (const xs of ctx.oneOffContribs.values()) for (const x of xs) if (String(x.id).startsWith('isa_')) n++; for (const xs of ctx.stagedTransfers.values()) for (const x of xs) if (String(x.toId).startsWith('isa_')) n++; return n; };
const lib = buildScenarios(), scan = [];
for (const s of lib) {
  const variants = [['as entered', s.plan]];
  if ((s.plan.oneOffContributions || []).some(c => c.category === E.AUTO_DEPOSIT)) variants.push(['Windfall to ISA', { ...s.plan, spending: { ...s.plan.spending, decumulationPolicy: 'Windfall to ISA' } }]);
  for (const [how, plan] of variants) { let ctx; try { ctx = E.buildContext(plan); } catch { continue; } if (isaFlowsOf(ctx)) scan.push({ id: s.id, how, plan }); }
}
let r1b = { worst: 0, at: '', bites: 0, years: 0 };
for (const x of scan) { const r = allowanceOf(EI, x.plan, 40); r1b.bites += r.bites; r1b.years += r.years; if (r.worst > r1b.worst) { r1b.worst = r.worst; r1b.at = `${x.id} (${x.how}) ${r.at}`; } }
const scanHow = how => scan.filter(x => x.how === how).length;
// ---- 1c. S026 under the windfall split's table (light settings) ----
const h026 = byId.S026, a026 = armA(appPlan(h026.plan), { tournament: false });
const plan026 = prep(solverPlanOf(h026.plan, { decumulationPolicy: a026.planState.spending.decumulationPolicy }));
const LIGHT = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const r026 = solveCandidate(E, M, plan026, { ...LIGHT, windfallSplit: true });
const r1c = allowanceOf(EI, withTable(r026.m.ctx.plan, r026), 200);
ok(1, "the year's own flows into an ISA never take it past the allowance its fixed flows leave (engine)", r1a.worst <= 0.01 && r1b.worst <= 0.01 && r1c.worst <= 0.01,
  `a. S090 under its own pick (${s090.label}), ${r1a.n} paths: the worst overshoot ${gbp(r1a.worst)}${r1a.worst > 0.01 ? ` at ${r1a.at}` : ''}; b. the library's ${lib.length} plans: ${scanHow('as entered')} as entered and ${scanHow('Windfall to ISA')} under Windfall to ISA with a deposit or staged transfer into an ISA, 40 paths each: ${gbp(r1b.worst)}${r1b.worst > 0.01 ? ` at ${r1b.at}` : ''}; c. S026 under the windfall split's table at 4 points, ${r1c.n} paths: ${gbp(r1c.worst)}${r1c.worst > 0.01 ? ` at ${r1c.at}` : ''}`);
ok(2, 'the recorder found its sites, and years with a deposit or staged transfer into an ISA were run (check 1 had something to bite on)', inst.sites === 6 && r1a.bites > 0 && r1b.bites > 0 && r1c.bites > 0,
  `the year's own flows at ${inst.sites} places (6 wanted); person-years with a deposit or staged transfer into the ISA: S090 ${r1a.bites} of ${r1a.years}, the library ${r1b.bites} of ${r1b.years}, S026's table ${r1c.bites} of ${r1c.years}`);

// ---- 3. the exact model in step with the engine on S090 ----
{
  const plan = prep(s090.plan), m = M.prepare(E, plan), key = plan.spending.decumulationPolicy;
  const move = { ...M.actionForPolicy(m, key, { sweepCash: true }), sweepIsa: true, spendLevel: 1 };
  const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => move } } });
  const T = ctx.totalYears, paths = E.pathsForSeed(SEED, 50, T);
  let worst = 0, at = '', years = 0, threw = '';
  try {
    for (let i = 0; i < paths.length; i++) {
      const zs = paths[i], eng = E.freshState(ctx), mod = M.initialState(m);
      for (let t = 0; t <= T; t++) {
        const gaps = [];
        for (const id of new Set([...Object.keys(eng.pots), ...Object.keys(mod.pots)])) gaps.push([`pot ${id}`, Math.abs((eng.pots[id] || 0) - (mod.pots[id] || 0))]);
        for (const k of ['self', 'part']) gaps.push([`cash ISA ${k}`, Math.abs(((eng.cashIsa && eng.cashIsa[k]) || 0) - ((mod.cashIsa && mod.cashIsa[k]) || 0))]);
        for (const [k, g] of gaps) if (!(g <= worst)) { worst = g; at = `path ${i} year ${t}: ${k}`; }
        years++;
        E.stepYear(ctx, eng, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 });
        M.step(m, mod, move, t, ratesAt(m, zs, t));
      }
    }
  } catch (e) { threw = e.message.split('\n')[0]; }
  ok(3, 'the exact model keeps step with the engine on S090 (its own policy, sweeping, the cash ISA swept to the ISA)', !threw && worst <= 1,
    threw ? `threw: ${threw}` : `${years} years of 50 paths; the largest gap ${gbp(worst)}${worst > 1 ? ` at ${at}` : ''}`);
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failed ? 'FAILED' : 'ALL PASS'}: ${passed} passed, ${failed} failed${PLANT ? ` (plant ${PLANT})` : ''}${process.env.ROOT ? ` (ROOT ${ROOT})` : ''}`);
process.exit(failed ? 1 : 0);
