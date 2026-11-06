/*
 * THE LIBRARY SWEEP AND OLD EXPORTS (Phase 12 item 5, the readiness checklist: "every one of the 210 singles normalises,
 * prepares and solves at light settings without a throw, and so does a sample with every lever off its default"; "old exports
 * import"). The full tier; research/solver/launch-ready.mjs reads its results file (results-library-sweep.txt).
 *
 *   1. every single household of the research library (research/policy-study/scenarios.mjs) normalises, keys (src/solverKey.js,
 *      prepareForSolve) and solves at the light settings (solveForApp) without a throw, its tables there;
 *   2. a sample, every tenth single, with every lever off its default solves without a throw and keys apart from its default:
 *      the dial at 3, 6 or 10 in turn (its base solved first), the estate's weight lower, raises blocked, no consent to change
 *      risk, the pension not before two years after its access age, the pension's and the ISA's riskiest tiers capped, the lump
 *      sum locked (now and never in turn), and a floor of 70% of the target;
 *   3. old exports: for every twentieth single, the shapes an older version of the app wrote, each through the import's own
 *      test (an object with demographics, accounts or spending) after a JSON round trip, then normalised and solved without a
 *      throw: no solver section and no named returns source beside a saved matrix (before Phase 8; the matrix kept as it was);
 *      the two lifestyle tapers in place of spending bands (migrated to bands, their schedule the tapers'); an income carrying
 *      the old taxTreatment 'Taxable' (migrated to 'otherTaxable'); and a field the app no longer knows (ignored).
 * The plants (src/solverSettings.js PLANT): 'lumpthrow' (a lever value the code cannot take: the lump sum locked to now) fails
 * check 2; 'needsolver' (a plan without a solver section refused, as an old export or the quick start's plan has none) fails
 * checks 1 and 3. The plants run --quick: check 1 over every tenth single (about 21), checks 2 and 3 whole.
 *   node research/tests/library-sweep.test.mjs [--plant lumpthrow|needsolver] [--quick]
 *   node research/tests/library-sweep.test.mjs --plants
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), self = fileURLToPath(import.meta.url);
const PLANTS = { lumpthrow: [2], needsolver: [1, 3] };
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
const PLANT_NAME = args[0] === '--plant' ? args[1] : null;
// --quick (the plants' runs): check 1 over every tenth single, not all; checks 2 and 3 as they are
const QUICK = args.includes('--quick');
if (PLANT_NAME && !PLANTS[PLANT_NAME]) { console.log(`no plant '${PLANT_NAME}'`); process.exit(2); }

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { solveForApp } = await import('../../src/solverApp.js');
const S = await import('../../src/solverSettings.js');
const { solveKey } = await import('../../src/solverKey.js');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');
const { stamp } = await import('../solver/launch-stamp.mjs');
const { tablesOf } = await import('../../src/solverDigest.js');
if (PLANT_NAME) S.PLANT.rule = PLANT_NAME;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const singles = buildScenarios().filter(s => E.normalizePlan(s.plan).demographics.planningMode === 'single');
const first = QUICK ? singles.filter((_, i) => i % 10 === 0) : singles;
console.log(`the code: ${stamp()}; ${singles.length} single households, the light settings ${JSON.stringify(LIGHT)}`);

// one plan through the page's steps: normalised, keyed, solved; the throw's words if it throws. A key already solved without a
// throw is not solved again: the key is everything the solve reads (src/solverKey.js), so the same key is the same solve
const solvedKeys = new Set();
let solves = 0;
const through = async plan => {
  try {
    const n = E.normalizePlan(plan);
    const key = await solveKey(E, n, LIGHT);
    if (solvedKeys.has(key)) return { key, tables: true, error: null, again: true };
    const r = solveForApp(E, M, n, LIGHT);
    solves++;
    // its tables there: every array the solve keeps (src/solverDigest.js, as the page fingerprints them), each non-empty
    const A = r && r.meta && r.tablesW ? tablesOf(r) : [];
    const tables = A.length > 0 && A.every(a => a.length > 0);
    if (tables) solvedKeys.add(key);
    return { key, tables, error: tables ? null : 'no tables' };
  } catch (e) { return { error: e.message }; }
};
const t0 = Date.now();

// 1. every single, as it is
const bad1 = [], keyOf1 = new Map();
for (const [i, s] of first.entries()) {
  const r = await through(s.plan);
  if (r.error) bad1.push(`${s.id}: ${r.error}`); else keyOf1.set(s.id, r.key);
  if ((i + 1) % 30 === 0) console.log(`    ${i + 1} of ${first.length}, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ok(1, `${QUICK ? `every tenth of the ${singles.length}` : `all ${singles.length}`} single households normalise, key and solve at the light settings without a throw`, first.length >= (QUICK ? 20 : 200) && bad1.length === 0, bad1.length ? `${bad1.length} threw: ${bad1.slice(0, 3).join('; ')}` : `${first.length} solved, ${((Date.now() - t0) / 1000).toFixed(0)}s`);

// 2. every lever off its default, on every tenth
const DIALS = [3, 6, 10], LUMPS = ['now', 'never'];
const off = (plan, i) => {
  const n = E.normalizePlan(plan), d = n.demographics, sp = n.spending;
  return { ...n, spending: { ...sp, floorSpend: Math.round(0.7 * E.num(sp.targetSpend, 0)) },
    solver: { aims: { cuts: DIALS[i % 3], estate: 'lower', raises: 'blocked', riskConsent: false },
      locks: { pensionBefore: E.num(d.privatePensionAge, 58) + 2, tierCeiling: { pen: 'Medium/Low Risk', isa: 'Medium Risk' }, lumpSum: LUMPS[i % 2] } } };
};
const sample = singles.filter((_, i) => i % 10 === 0), bad2 = [], same = [];
for (const [i, s] of sample.entries()) {
  const a = keyOf1.has(s.id) ? { key: keyOf1.get(s.id) } : await through(s.plan), b = await through(off(s.plan, i));
  if (b.error) bad2.push(`${s.id}: ${b.error}`);
  else if (a.key && b.key === a.key) same.push(s.id);
}
ok(2, `a sample of ${sample.length}, every lever off its default (the dial at 3, 6 or 10, the estate lower, raises blocked, no risk consent, the pension two years later, both tiers capped, the lump sum locked, the floor at 70%), solves without a throw and keys apart`,
  sample.length >= 20 && bad2.length === 0 && same.length === 0, bad2.length || same.length ? `${bad2.length} threw: ${bad2.slice(0, 3).join('; ')}; keyed as the default: ${same.join(', ') || 'none'}` : `${sample.length} solved`);

// 3. old exports
const roundTrip = x => JSON.parse(JSON.stringify(x));
const accepted = x => !!x && typeof x === 'object' && !Array.isArray(x) && !!(x.demographics || x.accounts || x.spending);   // App.jsx handleImportJSON's test
const olds = singles.filter((_, i) => i % 20 === 0), bad3 = [];
for (const s of olds) {
  const n = E.normalizePlan(s.plan);
  const { solver, riskSource, ...pre8 } = n; void solver; void riskSource;
  const { spendBands, ...spNoBands } = n.spending; void spendBands;
  const target = E.num(n.spending.targetSpend, 0);
  const shapes = {
    'before Phase 8': pre8,
    'the two tapers': { ...pre8, spending: { ...spNoBands, taper1Age: 75, taper1Rate: 10, taper2Age: 85, taper2Rate: 20 } },
    'an old income': { ...pre8, otherIncomes: [{ id: 'inc_old', name: 'Rent', owner: 'Myself', startAge: 60, endAge: 70, amount: 3000, taxTreatment: 'Taxable' }] },
    'an unknown field': { ...pre8, someRetiredSetting: { a: 1 } }
  };
  for (const [what, shape] of Object.entries(shapes)) {
    const x = roundTrip(shape);
    if (!accepted(x)) { bad3.push(`${s.id} ${what}: refused by the import's test`); continue; }
    const m = E.normalizePlan(x);
    if (what === 'before Phase 8' && JSON.stringify(m.riskProfiles) !== JSON.stringify(n.riskProfiles)) bad3.push(`${s.id} ${what}: the saved matrix changed`);
    if (what === 'the two tapers') {
      const age = a => (m.spending.spendBands.find(b => E.num(b.fromAge, 0) <= a && (b.toAge === '' || a <= E.num(b.toAge, 999))) || {}).amount;
      if (!(m.spending.spendBands.length >= 2 && Math.abs(E.num(age(80), 0) - 0.9 * target) < 1 && Math.abs(E.num(age(90), 0) - 0.72 * target) < 1)) bad3.push(`${s.id} ${what}: the bands are not the tapers' schedule (${JSON.stringify(m.spending.spendBands).slice(0, 120)})`);
    }
    if (what === 'an old income' && !(m.otherIncomes[0] && m.otherIncomes[0].incomeType === 'otherTaxable')) bad3.push(`${s.id} ${what}: not migrated to otherTaxable`);
    const r = await through(x);
    if (r.error) bad3.push(`${s.id} ${what}: ${r.error}`);
  }
}
ok(3, `old exports: ${olds.length} households in four older shapes each pass the import's test, migrate as they should and solve without a throw`, olds.length >= 10 && bad3.length === 0, bad3.length ? `${bad3.length} wrong: ${bad3.slice(0, 3).join('; ')}` : `${olds.length * 4} imported and solved`);

console.log(`\n${passed} passed, ${failed} failed${PLANT_NAME ? ` (planted: ${PLANT_NAME})` : ''}; ${solves} solves, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(failed ? 1 : 0);
