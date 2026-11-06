/*
 * ONE SOLVE, ONE KEY (Phase 11, found by phone-memory.cjs). A solve's key (src/solverKey.js) names what the tables depend on,
 * so two plans the solver reads the same must key the same, or the page solves one plan twice and a dial position never finds
 * its base in the store. The quick start's plan carries no `solver` section; the dial, a Config choice or the limits card
 * write the default aims and locks beside the user's own (withAims; App.jsx normalizeSolverLocks), and the key read them as
 * stored, so the first touch of the dial solved the plan again (S116 at 45 points in the browser: the dial at 3 took 533s,
 * its base and the position, against 280s for the first solve). The full tier.
 *
 * Over every single household in the library (the class: a field the solve does not read moves the key):
 * 1. what the solver takes from the aims is the same with them absent and with their defaults (aimsOptions, dialSettings),
 *    so a key that tells the two apart names two solves where there is one;
 * 2. the plan as the quick start leaves it keys as the same plan with the default aims, the default locks, and both;
 * 3. a dial position's base (the plan at 3, 6 and 10 as the dial writes it) keys as the plan before the dial was touched;
 * 4. a choice made and taken back (the estate lower, then standard; raises blocked, then capped) keys as before it;
 * 5. the view of whose money (a couple's display: 'Myself', 'Partner') keys as 'Combined'.
 * That each aim and lock off its default still moves the key is solver-aims.test.mjs check 4 and solver-locks.test.mjs check 3.
 * Its plant 'raw' (the key reads the aims, locks and view as stored, as before the fix) fails checks 2 to 5.
 *   node research/tests/solve-key.test.mjs [--plant raw]
 *   node research/tests/solve-key.test.mjs --plants
 */
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const PLANTS = { raw: [2, 3, 4, 5] };
if (args[0] === '--plants') {
  let bad = 0;
  for (const [name, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--plant', name], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; }
    const failed = [...new Set(out.split('\n').filter(l => l.startsWith('  FAIL ')).map(l => Number(/^ {2}FAIL (\d+)\./.exec(l)?.[1])))].sort((a, b) => a - b);
    const right = JSON.stringify(failed) === JSON.stringify(want);
    if (!right) bad++;
    console.log(`plant '${name}': checks failing ${failed.join(', ') || 'none'} (its own: ${want.join(', ')}) ${right ? 'ok' : 'WRONG'}`);
  }
  console.log(bad ? `PLANTS: ${bad} of ${Object.keys(PLANTS).length} did not fail exactly their own checks` : `PLANTS: all ${Object.keys(PLANTS).length} fail exactly their own checks`);
  process.exit(bad ? 1 : 0);
}
const PLANT_NAME = args[0] === '--plant' ? args[1] : null;
if (PLANT_NAME && !PLANTS[PLANT_NAME]) { console.log(`no plant '${PLANT_NAME}'`); process.exit(2); }

const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
// the engine as the tests build it from App.jsx (research/build-engine.py), built here if it is not there yet
let E = await load('research/engine.mjs').catch(() => null);
if (!E) { execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' }); E = await load('research/engine.mjs'); }
const { solveKey, PLANT } = await load('src/solverKey.js');
const { withAims, aimsOptions, dialSettings, dialBase, APP_DIAL } = await load('src/solverSettings.js');
const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
if (PLANT_NAME === 'raw') PLANT.rule = 'raw';

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const OPTS = {};   // the app's own settings: the solve at APP_POINTS, the dial's lambda and variant

const singles = buildScenarios().filter(s => (s.plan.demographics || {}).planningMode !== 'couple' && !(s.plan.solver));
const LOCKS = { pensionBefore: null, tierCeiling: { pen: null, isa: null }, lumpSum: 'free' };
const withLocks = plan => ({ ...plan, solver: { ...(plan.solver || {}), locks: LOCKS } });
const miss = { 1: [], 2: [], 3: [], 4: [], 5: [] };
for (const s of singles) {
  const plan = s.plan, k0 = await solveKey(E, plan, OPTS);
  // 1. what the solver takes from the aims
  const a = E.normalizePlan(plan), b = E.normalizePlan(withAims(plan));
  if (JSON.stringify(aimsOptions(a)) !== JSON.stringify(aimsOptions(b)) || JSON.stringify(dialSettings(a)) !== JSON.stringify(dialSettings(b))) miss[1].push(s.id);
  // 2. the defaults written beside the plan
  for (const [what, p] of [['aims', withAims(plan)], ['locks', withLocks(plan)], ['both', withLocks(withAims(plan))]]) if (await solveKey(E, p, OPTS) !== k0) { miss[2].push(`${s.id} ${what}`); break; }
  // 3. the dial's base, the plan at each position as the dial writes it (withAims, src/SolverConfig.jsx)
  for (const x of APP_DIAL.filter(v => v > 1)) { const bp = dialBase(E.normalizePlan(withAims(plan, { cuts: x }))); if (!bp || await solveKey(E, bp, OPTS) !== k0) { miss[3].push(`${s.id} at ${x}`); break; } }
  // 4. a choice made and taken back
  const back = withAims(withAims(withAims(plan, { estate: 'lower' }), { estate: 'standard' }), { raises: 'capped' });
  if (await solveKey(E, withAims(plan, { estate: 'lower' }), OPTS) === k0 || await solveKey(E, back, OPTS) !== k0) miss[4].push(s.id);
  // 5. the view of whose money
  for (const v of ['Myself', 'Partner']) if (await solveKey(E, { ...plan, activeProfileView: v }, OPTS) !== k0) { miss[5].push(`${s.id} ${v}`); break; }
}
const N = singles.length, list = m => (m.length ? `${m.length} of ${N}: ${m.slice(0, 4).join(', ')}${m.length > 4 ? ', ...' : ''}` : `all ${N}`);
ok(1, 'what the solver takes from the aims is the same with them absent and at their defaults', miss[1].length === 0, miss[1].length ? `differs on ${list(miss[1])}` : `the same on ${list(miss[1])}`);
ok(2, 'the plan as the quick start leaves it keys as the plan with the default aims, the default locks and both', miss[2].length === 0, miss[2].length ? `another key on ${list(miss[2])}` : `the same key on ${list(miss[2])}`);
ok(3, 'a dial position\'s base (the plan at 3, 6 and 10 as the dial writes it) keys as the plan before the dial was touched', miss[3].length === 0, miss[3].length ? `another key on ${list(miss[3])}` : `the same key on ${list(miss[3])}`);
ok(4, 'a choice made and taken back (the estate lower then standard, raises capped) keys as before it, and the choice itself moves it', miss[4].length === 0, miss[4].length ? `wrong on ${list(miss[4])}` : `right on ${list(miss[4])}`);
ok(5, 'the view of whose money (\'Myself\', \'Partner\') keys as \'Combined\'', miss[5].length === 0, miss[5].length ? `another key on ${list(miss[5])}` : `the same key on ${list(miss[5])}`);

console.log(`\n${passed} passed, ${failed} failed (${N} single households${PLANT_NAME ? `; planted: ${PLANT_NAME}` : ''})`);
process.exit(failed ? 1 : 0);
