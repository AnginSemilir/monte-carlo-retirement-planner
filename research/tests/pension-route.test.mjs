/*
 * HOW AN EMPLOYEE PAYS INTO THEIR PENSION (D154 (3); research/solver/DECISIONS-PENDING.md, the entry of 21 Nov, way (A)). The
 * employment type asks it (src/App.jsx): 'employed', salary sacrifice (the default, the app's assumption until now);
 * 'employed-net', from net pay or by relief at source; 'employed-unsure', not sure, priced as net pay (the cautious reading);
 * 'self-employed'. A net-pay employee is relieved of income tax alone, as the self-employed are, with no employer NIC passed
 * through, and pays Class 1 NIC on the whole pay. Each owner carries it as `reliefTaxOnly` (buildContext), which every price of
 * a pension contribution reads: the engine's taxable pay and a working partner's take-home, the savings split's routes, the
 * classic strategies, the solver's exact model (src/solver/model.js) and forward run (src/solver/fast.js), the household plan
 * (src/solver/household.js); the NIC class stays `selfEmployed`. The full tier.
 *   1. every plan as entered the same to the bit: the library's 420 plans through the engine (20 paths of seed 99001 each),
 *      three working savers solved at the light settings, and the household plan of every library couple with its first person
 *      retired and the partner working; each digest the code before's, pinned (taken on 27 Nov on the code before the change);
 *   2. the price, by hand: a net-pay employee's relief income tax alone and no employer NIC passed through, at a basic-rate and
 *      a higher-rate salary, beside salary sacrifice's income tax and NIC with the pass-through;
 *   3. the engine prices a working partner's take-home by their own route: a couple, the first person retired and the partner
 *      working and paying in, the household's pot after the first year lower under net pay by the partner's NIC relief alone;
 *   4. the engine and the solver's exact model in step for net-pay employees (model.js runFixed against simulateDeterministic);
 *   5. the savings split's routes for a net-pay employee those of the same plan with the person self-employed (income tax relief
 *      alone in both);
 *   6. not sure priced as net pay; a couple entered younger first keeps each person's answer on the mirror;
 *   7. the words: the employment type's four answers and each one's line.
 * The plants: 'ignored' (src/App.jsx ROUTE_PLANT: every employee priced as a sacrificer, the code before) fails 2, 3, 5 and 6;
 * 'unsure' (not sure priced as a sacrificer) fails 6; 'modelignored' (src/solver/model.js MODEL: the exact model pricing every
 * employee as a sacrificer) fails 4.
 *   node research/tests/pension-route.test.mjs [--plant <name>]       node research/tests/pension-route.test.mjs --plants
 *   node research/tests/pension-route.test.mjs --digest               the digests of check 1 on this code
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), self = fileURLToPath(import.meta.url);
const PLANTS = { ignored: [2, 3, 5, 6], unsure: [6], modelignored: [4] };
if (args[0] === '--plants') {
  let bad = 0;
  for (const [name, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [self, '--plant', name, '--quick'], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { out = e.stdout || ''; }
    const failed = [...new Set(out.split('\n').filter(l => l.startsWith('  FAIL ')).map(l => Number(/^ {2}FAIL (\d+)\./.exec(l)?.[1])))].sort((a, b) => a - b);
    const right = JSON.stringify(failed) === JSON.stringify(want);
    if (!right) bad++;
    console.log(`plant '${name}': checks failing ${failed.join(', ') || 'none'} (its own: ${want.join(', ')}) ${right ? 'ok' : 'WRONG'}`);
  }
  console.log(bad ? `PLANTS: ${bad} of ${Object.keys(PLANTS).length} did not fail exactly their own checks` : `PLANTS: all ${Object.keys(PLANTS).length} fail exactly their own checks`);
  process.exit(bad ? 1 : 0);
}
const plantAt = args.indexOf('--plant'), PLANT_NAME = plantAt >= 0 ? args[plantAt + 1] : null, QUICK = args.includes('--quick'), DIGEST = args.includes('--digest');
if (PLANT_NAME && !PLANTS[PLANT_NAME]) { console.log(`no plant '${PLANT_NAME}'`); process.exit(2); }

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { solveForApp, appPlan: appSolverPlan, prepareForSolve } = await import('../../src/solverApp.js');
const { tablesOf } = await import('../../src/solverDigest.js');
const { householdPlan } = await import('../../src/solverCouple.js');
const { householdPlanFor, TAKE_SHAPES, RISK_SHAPES, SALARY_SHAPES } = await import('../../src/solver/household.js');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');
const { laterWorking } = await import('../solver/couples-open-panel.mjs');
if (PLANT_NAME && PLANT_NAME !== 'modelignored' && E.ROUTE_PLANT) E.ROUTE_PLANT.rule = PLANT_NAME;
if (PLANT_NAME === 'modelignored') M.MODEL.plant = 'routeignored';

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const library = buildScenarios();
const normal = s => E.normalizePlan(JSON.parse(JSON.stringify(s.plan)));
const isCouple = p => p.demographics.planningMode !== 'single';
const working = (d, k) => E.num(d[`retireAge${k}`], 0) > E.num(d[`currentAge${k}`], 0) && E.num(d[`salary${k}`], 0) > 0;
const penOf = (p, o) => p.accounts.find(a => a.id === `pen_${o}`);

/* check 1's three digests: the engine over the library, three working savers' tables, and the household plans */
function digests() {
  const h1 = createHash('sha256');
  library.forEach((s, i) => {
    const ctx = E.buildContext(E.resolveMpaa(normal(s)));
    const mc = E.monteCarlo(ctx, { trials: 20, seed: 99001 });
    h1.update(JSON.stringify([s.id || i, mc.successRate, mc.p10Terminal, mc.medianTerminal, mc.p90Terminal, mc.medianLifetimeTax, mc.medianRealisedSpend, mc.medianFailAge, mc.p10RealisedSpend]));
  });
  const singles = library.map(normal).filter(p => !isCouple(p));
  const savers = [
    ...singles.filter(p => p.demographics.employmentSelf !== 'self-employed' && working(p.demographics, 'Self') && E.num(penOf(p, 'self') && penOf(p, 'self').contrib, 0) > 0).slice(0, 2),
    ...singles.filter(p => p.demographics.employmentSelf === 'self-employed' && working(p.demographics, 'Self') && E.num(penOf(p, 'self') && penOf(p, 'self').contrib, 0) > 0).slice(0, 1)
  ];
  const h2 = createHash('sha256');
  for (const p of savers) { const r = solveForApp(E, M, p, LIGHT); for (const a of tablesOf(r)) h2.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); }
  const h3 = createHash('sha256');
  const takes = [...TAKE_SHAPES, ...RISK_SHAPES, ...SALARY_SHAPES];
  let households = 0;
  for (const s of library) {
    const p0 = normal(s);
    if (!isCouple(p0)) continue;
    const p = E.normalizePlan(laterWorking(p0));
    let out;
    try { out = householdPlanFor(E, householdPlan(E, appSolverPlan(E, prepareForSolve(E, p))), { scale: 'pensionsPA', takeShapes: takes }); households++; } catch (e) { out = { refused: e.message }; }
    h3.update(JSON.stringify(out));
  }
  return { engine: h1.digest('hex').slice(0, 16), savers: h2.digest('hex').slice(0, 16), saverCount: savers.length, households: h3.digest('hex').slice(0, 16), householdCount: households };
}
if (DIGEST) { console.log(JSON.stringify(digests())); process.exit(0); }

// the digests check 1 holds, taken on 27 Nov on the code before the change (its --digest mode on 96b8decf's tree)
const PINNED = { engine: 'eff3f291c4944916', savers: '1ece139e903a41a2', saverCount: 3, households: 'b799121b3014df54', householdCount: 210 };
const { otherOrder } = await import('../../src/coupleOrder.js');
const P0 = E.buildContext(E.resolveMpaa(normal(library[0]))).P;
const at = (p, emp, who = 'Self') => { const q = JSON.parse(JSON.stringify(p)); q.demographics[`employment${who}`] = emp; return E.normalizePlan(q); };
const ctxOf = p => E.buildContext(E.resolveMpaa(p));

console.log(`pension-route.test.mjs${PLANT_NAME ? ` (plant '${PLANT_NAME}')` : ''}`);
{
  const d = digests(), same = Object.keys(PINNED).every(k => d[k] === PINNED[k]);
  ok(1, 'every plan as entered the same to the bit: the library through the engine, three working savers\' tables, 210 household plans', same, JSON.stringify(d));
}
// a working single of the library, an employee paying into their pension, its salary set
const singleSaver = normal(library.find(s => { const p = normal(s), d = p.demographics; return !isCouple(p) && d.employmentSelf === 'employed' && working(d, 'Self') && E.num(penOf(p, 'self') && penOf(p, 'self').contrib, 0) > 0; }));
{
  const bad = [];
  for (const salary of [40000, 80000]) {
    const base = JSON.parse(JSON.stringify(singleSaver)); base.demographics.salarySelf = salary; base.config = { ...base.config, employerNicPassThrough: 50 };
    const net = ctxOf(at(base, 'employed-net')), sac = ctxOf(at(base, 'employed')), P = net.P, c = 5000;
    const on = net.owners[0], os = sac.owners[0];
    const itRelief = E.incomeTax(salary, P) - E.incomeTax(salary - c, P);
    const wantNet = c - itRelief;
    const pf = 1 + P.erNic * P.erPass, g = c / pf;
    const both = x => E.incomeTax(x, P) + E.nicFor(x, P, false);
    const wantSac = g - (both(salary) - both(salary - g));
    const gotNet = E.netCostOfPensionContrib(c, salary, P, on.reliefTaxOnly), gotSac = E.netCostOfPensionContrib(c, salary, P, os.reliefTaxOnly);
    const payNet = E.taxablePayOf(salary, c, P, on.reliefTaxOnly), paySac = E.taxablePayOf(salary, c, P, os.reliefTaxOnly);
    if (!(on.reliefTaxOnly === true && on.selfEmployed === false && os.reliefTaxOnly === false)) bad.push(`£${salary}: the owners' flags net ${on.reliefTaxOnly}/${on.selfEmployed}, sacrifice ${os.reliefTaxOnly}`);
    if (Math.abs(gotNet - wantNet) > 1e-6) bad.push(`£${salary} net pay: £${gotNet.toFixed(2)} against £${wantNet.toFixed(2)} by hand`);
    if (Math.abs(gotSac - wantSac) > 1e-6) bad.push(`£${salary} sacrifice: £${gotSac.toFixed(2)} against £${wantSac.toFixed(2)} by hand`);
    if (Math.abs(payNet - (salary - c)) > 1e-6 || Math.abs(paySac - (salary - g)) > 1e-6) bad.push(`£${salary} taxable pay: net £${payNet.toFixed(2)}, sacrifice £${paySac.toFixed(2)}`);
  }
  ok(2, 'a net-pay employee\'s relief income tax alone with no employer NIC passed through, salary sacrifice\'s income tax and NIC with it, by hand at £40,000 and £80,000', bad.length === 0, bad.join('; '));
}
// a library couple with its first person retired and the partner working and paying into their pension
const coupleWorking = (() => {
  for (const s of library) {
    const p0 = normal(s);
    if (!isCouple(p0)) continue;
    const p = E.normalizePlan(laterWorking(p0)), ctx = ctxOf(p), o = ctx.owners.find(x => x.key === 'part'), pen = ctx.accounts.find(a => a.owner === 'part' && a.cat === 'pen');
    if (o && o.salary > 0 && pen && E.contribAtYear(pen, 0) > 0 && p.demographics.employmentPart === 'employed') return p;
  }
  return null;
})();
{
  const bad = [];
  if (!coupleWorking) bad.push('no library couple with a working partner paying in');
  else {
    const rowsOf = p => E.simulateDeterministic(E.resolveMpaa(p), 'expected');
    const sac = rowsOf(coupleWorking), net = rowsOf(at(coupleWorking, 'employed-net', 'Part'));
    const ctx = ctxOf(coupleWorking), o = ctx.owners.find(x => x.key === 'part'), pen = ctx.accounts.find(a => a.owner === 'part' && a.cat === 'pen');
    let years = 0;
    for (let t = 0; t < Math.min(sac.length, net.length); t++) {
      const r0 = sac[t], r1 = net[t];
      if (!(r0.workingTakeHome > 0) || !(r1.workingTakeHome > 0)) continue;
      const pay = E.salaryAtYear(o, t), c = E.contribAtYear(pen, t), frac = t === 0 ? ctx.yf : 1;
      if (!(c > 0)) continue;
      const want = (E.nicFor(pay, ctx.P, false) - E.nicFor(pay - c / (1 + ctx.P.erNic * ctx.P.erPass), ctx.P, false)) * frac;
      const got = r0.workingTakeHome - r1.workingTakeHome;
      years++;
      if (Math.abs(got - want) > 1e-6) { bad.push(`plan year ${t}: take-home £${got.toFixed(2)} apart, the NIC relief £${want.toFixed(2)}`); break; }
    }
    if (!years) bad.push('no year with a working partner paying in');
    else if (!bad.length) bad.push(`${years} years`);
  }
  ok(3, 'a working partner\'s take-home in the engine priced by their own route: under net pay lower by the NIC relief on the contribution alone, year by year', bad.length === 1 && /^\d+ years$/.test(bad[0]), bad.join('; '));
}
{
  const FIELDS = ['pensions', 'isas', 'other', 'cash', 'totalCombined', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'harvested', 'targetSpend', 'netDrawdown', 'unmetDemand'];   // solver-model.test.mjs's: the take-home is the model's own, seen in the pots and the flows
  // the exact model takes a plan with the guardrails and the lookahead off, as the solver hands it (solver-model.test.mjs's off)
  const compare = plan0 => {
    const plan = E.normalizePlan({ ...plan0, config: { ...plan0.config, guardrails: false, lookaheadYears: 0 } });
    const prepared = E.resolveMpaa(plan), m = M.prepare(E, prepared), eng = E.simulateDeterministic(prepared, 'expected'), red = M.runFixed(m, M.actionFromContext(m.ctx));
    if (eng.length !== red.length) return { worst: Infinity, where: 'row count' };
    let worst = 0, where = '';
    for (let t = 0; t < eng.length; t++) for (const k of FIELDS) { const d = Math.abs(E.num(eng[t][k], 0) - E.num(red[t][k], 0)); if (d > worst) { worst = d; where = `${k} in plan year ${t}`; } }
    return { worst, where };
  };
  const plans = [['the working single', at(singleSaver, 'employed-net')], ...(coupleWorking ? [['the couple, the partner working', at(coupleWorking, 'employed-net', 'Part')], ['the couple, both net pay', at(at(coupleWorking, 'employed-net', 'Part'), 'employed-net')]] : [])];
  const rows = plans.map(([nm, p]) => { const r = compare(p); return `${nm} £${r.worst.toExponential(2)}${r.where ? ` (${r.where})` : ''}`; });
  const worst = Math.max(...plans.map(([, p]) => compare(p).worst));
  ok(4, 'the engine and the solver\'s exact model in step for net-pay employees, every wrapper and flow year by year', plans.length === 3 && worst <= 1.0, rows.join('; '));
}
{
  const bad = [];
  const net = ctxOf(at(singleSaver, 'employed-net')), se = ctxOf(at(singleSaver, 'self-employed')), sac = ctxOf(singleSaver);
  let years = 0, apart = 0;
  for (let t = 0; t <= net.totalYears; t++) {
    const a = net.saveSplitAt(t), b = se.saveSplitAt(t), c = sac.saveSplitAt(t);
    if (!a && !b) continue;
    years++;
    if (JSON.stringify(a) !== JSON.stringify(b)) { bad.push(`plan year ${t}: net pay's routes not the self-employed's`); break; }
    if (JSON.stringify(a) !== JSON.stringify(c)) apart++;
  }
  if (!years) bad.push('no working year');
  if (!bad.length && !apart) bad.push('net pay\'s routes the sacrificer\'s in every year: the route not read');
  ok(5, 'the savings split\'s routes for a net-pay employee the same plan\'s with the person self-employed (income tax relief alone), and apart from salary sacrifice\'s', bad.length === 0, bad.length ? bad.join('; ') : `${years} working years, ${apart} apart from salary sacrifice's`);
}
{
  const bad = [];
  const un = ctxOf(at(singleSaver, 'employed-unsure')), net = ctxOf(at(singleSaver, 'employed-net'));
  if (un.owners[0].reliefTaxOnly !== true || un.owners[0].selfEmployed !== false) bad.push(`not sure: the owner's flags ${un.owners[0].reliefTaxOnly}/${un.owners[0].selfEmployed}`);
  for (let t = 0; t <= un.totalYears; t++) if (JSON.stringify(un.saveSplitAt(t)) !== JSON.stringify(net.saveSplitAt(t))) { bad.push(`plan year ${t}: not sure's routes not net pay's`); break; }
  if (coupleWorking) {
    const p = at(at(coupleWorking, 'employed-net', 'Part'), 'employed-unsure');
    const m = otherOrder(E, p), md = m && (m.plan || m).demographics;
    if (!md || md.employmentSelf !== 'employed-net' || md.employmentPart !== 'employed-unsure') bad.push(`the mirror: ${md ? `${md.employmentSelf}/${md.employmentPart}` : 'none'}`);
  }
  ok(6, 'not sure priced as net pay; a couple entered younger first keeps each person\'s answer on the mirror', bad.length === 0, bad.join('; '));
}
{
  const src = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8'), bad = [];
  if (JSON.stringify(E.EMPLOYMENT_KINDS) !== JSON.stringify(['employed', 'employed-net', 'employed-unsure', 'self-employed'])) bad.push(`the answers ${E.EMPLOYMENT_KINDS}`);
  for (const k of E.EMPLOYMENT_KINDS) if (!src.includes(`<option value="${k}">`)) bad.push(`no option '${k}'`);
  const W = E.EMPLOYMENT_WORDS, pass = 'the employer NIC pass-through in Config does not apply';
  if (!/salary sacrifice: income tax and employee NIC relief/.test(W.employed(true)) || W.employed(true).includes(pass)) bad.push('salary sacrifice\'s line');
  if (!/income tax relief only/.test(W['employed-net'](false)) || !W['employed-net'](true).includes(pass) || W['employed-net'](false).includes(pass)) bad.push('net pay\'s line');
  if (!/^Priced as net pay, the more cautious/.test(W['employed-unsure'](false)) || !W['employed-unsure'](true).includes(pass)) bad.push('not sure\'s line');
  if (!/trading profit/.test(W['self-employed'](false))) bad.push('the self-employed\'s line');
  ok(7, 'the words: the employment type\'s four answers, each with its line, the pass-through said where it does not apply', bad.length === 0, bad.join('; '));
}
console.log(`${failed ? 'FAILED' : 'ALL PASS'}: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
