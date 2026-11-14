/*
 * THE SPEED MODE ("Beta - speed mode"; D97 (3), D98, 14 Nov; src/solverSettings.js speedOf, speedOptions, withSpeed; App.jsx
 * normalizePlan; src/solverApp.js solveForApp; src/SolverConfig.jsx SolverAims). The plan carries `solver.speed` 'fast', which
 * hands its solve the chooser's shortlist (`chooserShortlist: 'order'`, src/solver/solve.js: the paths that only count, never a
 * decision the pages show). The full tier.
 *   1. The plan keeps it: normalizePlan keeps `solver.speed` 'fast' and nothing else there ('slow', true, 1 and '' dropped);
 *      the library's 420 households normalise with no such field; turned on, then off, a plan is its own again, and a plan
 *      never turned on is handed back as it is.
 *   2. It names the solve (src/solverKey.js): the key of a plan in speed mode differs from the same plan's without it, and
 *      the plan turned on then off has the plan's own key.
 *   3. It reaches the solve: S126 at light settings in speed mode carries the shortlist (the solve's own and its meta), the
 *      plan's own solve none; the tables are the same (the shortlist moves no table; each is still stored under its own key);
 *      the paths in speed mode score shortlists (src/solver/solve.js SHORTLIST counts them), the plan's own none.
 *   4. This year's recommended actions are the whole menu's (the warning's last sentence): the first move and this year's
 *      actions, each move part, the same in speed mode as without it.
 *   5. A dial position: S126 at position 3 in speed mode is solved on a base in speed mode (src/solverSettings.js dialBase
 *      keeps the plan's solver section), and both carry the shortlist.
 *   6. A couple (src/solverCouple.js couplePlans, as the worker cuts it): each person's plan carries the speed mode, and each
 *      person's solve the shortlist; without it, neither.
 *   7. The words: the two warnings (src/solverWords.js SPEED_WORDS) are the maintainer's, word for word (D98).
 * Plants (--planted): 'speednone' (src/solverSettings.js speedOptions: the solve not handed the speed mode) fails 3, 5 and 6;
 * 'speedunkeyed' (src/solverKey.js: the speed mode left out of the key) fails 2. On the code before (App.jsx dropping the
 * field) 1, 2, 3, 5 and 6 fail (research/solver/results-speed-mode.txt).
 *   node research/tests/speed-mode.test.mjs [--planted]
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { speedOf, withSpeed, dialBase, atDial, PLANT as SETTINGS_PLANT } from '../../src/solverSettings.js';
import { solveKey, PLANT as KEY_PLANT } from '../../src/solverKey.js';
import { cacheOf } from '../../src/solverCache.js';
import { couplePlans } from '../../src/solverCouple.js';
import { firstMove, actionsOf, strategyRuns } from '../../src/solverStrategy.js';
import { SHORTLIST } from '../../src/solver/solve.js';
import { SPEED_WORDS } from '../../src/solverWords.js';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  const want = { speednone: '3,5,6', speedunkeyed: '2' };
  let bad = 0;
  for (const [plant, w] of Object.entries(want)) {
    let out = '';
    try { out = execFileSync(process.execPath, [SELF], { env: { ...process.env, SPEED_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...new Set([...out.matchAll(/^ {2}FAIL (\d)\./gm)].map(m => m[1]))].join();
    console.log(`plant '${plant}': the checks that fail: ${failed || 'none'}; wanted ${w}: ${failed === w ? 'yes' : 'NO'}`);
    if (failed !== w) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANT_RULE = process.env.SPEED_PLANT || '';
if (PLANT_RULE === 'speednone') SETTINGS_PLANT.rule = 'speednone';
if (PLANT_RULE === 'speedunkeyed') KEY_PLANT.rule = 'speedunkeyed';

let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : fail++; console.log(`  ${c ? 'ok  ' : 'FAIL'} ${msg}`); };
const lib = buildScenarios(), planOf = id => lib.find(s => s.id === id).plan;
const SMALL = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, PTS = 6, SEED = 4242, N = 120;

// the tables a solve keeps for its restore (src/solverCache.js cacheOf), its meta left out, as one digest
const tablesDigest = r => {
  const rec = cacheOf(r), h = createHash('sha256');
  const feed = v => {
    if (ArrayBuffer.isView(v)) { h.update(`${v.constructor.name}:${v.length}:`); h.update(Buffer.from(v.buffer, v.byteOffset, v.byteLength)); }
    else if (Array.isArray(v)) { h.update(`[${v.length}`); v.forEach(feed); h.update(']'); }
    else if (v && typeof v === 'object') { for (const k of Object.keys(v).sort()) { h.update(`${k}=`); feed(v[k]); } }
    else h.update(JSON.stringify(v === undefined ? null : v));
  };
  feed({ layers: rec.layers, ref: rec.ref, riskAbove: rec.riskAbove });
  return h.digest('hex').slice(0, 16);
};

console.log('=========== 1. THE PLAN KEEPS IT ===========');
{
  const p = planOf('S126');
  const kept = E.normalizePlan(withSpeed(p, true)).solver;
  const dropped = ['slow', true, 1, ''].filter(v => 'speed' in (E.normalizePlan({ ...p, solver: { speed: v } }).solver || {}));
  const withField = lib.filter(s => 'speed' in (E.normalizePlan(s.plan).solver || {})).map(s => s.id);
  const back = withSpeed(withSpeed(p, true), false), same = JSON.stringify(E.normalizePlan(back)) === JSON.stringify(E.normalizePlan(p));
  ok(kept && kept.speed === 'fast' && dropped.length === 0 && withField.length === 0 && same && withSpeed(p, false) === p && speedOf(withSpeed(p, true)) && !speedOf(p),
    `1. normalizePlan keeps 'fast' (${kept && kept.speed}) and drops the rest (${dropped.length ? `kept ${dropped.join(', ')}` : 'none kept'}); the library's ${lib.length} households carry none (${withField.length}); on then off, the plan's own (${same ? 'the same' : 'NOT the same'}); never on, handed back as it is`);
}

console.log('=========== 2. IT NAMES THE SOLVE ===========');
{
  const p = planOf('S126');
  const [own, fast, back] = await Promise.all([solveKey(E, p), solveKey(E, withSpeed(p, true)), solveKey(E, withSpeed(withSpeed(p, true), false))]);
  ok(own !== fast && own === back, `2. the key in speed mode ${fast.slice(0, 12)} against the plan's own ${own.slice(0, 12)} (${own !== fast ? 'apart' : 'THE SAME'}); on then off ${back.slice(0, 12)} (${own === back ? 'the plan\'s own' : 'NOT the plan\'s own'})`);
}

console.log('=========== 3. IT REACHES THE SOLVE ===========');
const p126 = planOf('S126');
const rOwn = solveForApp(E, M, p126, { points: PTS, research: SMALL });
const rFast = solveForApp(E, M, withSpeed(p126, true), { points: PTS, research: SMALL });
{
  const dOwn = tablesDigest(rOwn), dFast = tablesDigest(rFast);
  const listed = r => { const before = SHORTLIST.stats.decisions; strategyRuns(E, r, p126, { seed: SEED, from: 0, to: N }); return SHORTLIST.stats.decisions - before; };
  const lOwn = listed(rOwn), lFast = listed(rFast);
  ok(rFast.chooserShortlist === 'order' && rFast.meta.chooserShortlist === 'order' && !rOwn.chooserShortlist && !rOwn.meta.chooserShortlist && dOwn === dFast && lFast > 0 && lOwn === 0,
    `3. S126: in speed mode the solve carries the shortlist (${rFast.chooserShortlist || 'none'}, its meta ${rFast.meta.chooserShortlist || 'none'}), the plan's own none (${rOwn.chooserShortlist || 'none'}); the tables ${dOwn === dFast ? 'the same' : 'DIFFER'} (${dFast} and ${dOwn}); decisions scored on a shortlist over ${N} paths: ${lFast} in speed mode, ${lOwn} without`);
}

console.log('=========== 4. THIS YEAR\'S ACTIONS ARE THE WHOLE MENU\'S ===========');
{
  const fOwn = firstMove(E, rOwn), fFast = firstMove(E, rFast);
  const aOwn = actionsOf(E, rOwn, p126, { seed: SEED, n: 60 }), aFast = actionsOf(E, rFast, withSpeed(p126, true), { seed: SEED, n: 60 });
  const parts = a => JSON.stringify({ move: a.move && a.move.parts, actions: a.actions.map(x => [x.part, x.value]) });
  ok(fOwn.mv.index === fFast.mv.index && parts(aOwn) === parts(aFast),
    `4. S126: the first move ${fFast.mv.index} in speed mode, ${fOwn.mv.index} without; this year's actions ${parts(aOwn) === parts(aFast) ? 'the same, part for part' : 'DIFFER'} (${aOwn.actions.map(x => `${x.part} ${JSON.stringify(x.value)}`).join('; ')})`);
}

console.log('=========== 5. A DIAL POSITION ===========');
{
  const at3 = atDial(withSpeed(p126, true), 3), base = dialBase(E.normalizePlan(at3));
  const rBase = solveForApp(E, M, base, { points: PTS, research: SMALL });
  const r3 = solveForApp(E, M, at3, { points: PTS, research: SMALL, base: rBase });
  ok(speedOf(base) && rBase.chooserShortlist === 'order' && r3.chooserShortlist === 'order',
    `5. S126 at position 3 in speed mode: its base ${speedOf(base) ? 'in speed mode' : 'NOT in speed mode'}, the base's solve ${rBase.chooserShortlist || 'without the shortlist'}, the position's ${r3.chooserShortlist || 'without the shortlist'}`);
}

console.log('=========== 6. A COUPLE ===========');
{
  const id = 'S007', cp = planOf(id);
  const fast = couplePlans(E, withSpeed(cp, true)), own = couplePlans(E, cp);
  const rSelf = solveForApp(E, M, fast.plans.self, { points: PTS, research: SMALL, ageWith: fast.ageWith ? fast.ageWith.self : undefined });
  ok(speedOf(fast.plans.self) && speedOf(fast.plans.part) && !speedOf(own.plans.self) && !speedOf(own.plans.part) && rSelf.chooserShortlist === 'order',
    `6. ${id}: in speed mode each person's plan carries it (${speedOf(fast.plans.self)}, ${speedOf(fast.plans.part)}) and the first person's solve the shortlist (${rSelf.chooserShortlist || 'none'}); without it, neither (${speedOf(own.plans.self)}, ${speedOf(own.plans.part)})`);
}

console.log('=========== 7. THE WORDS ===========');
{
  const single = 'Speed mode works out your figures about twice as fast by looking at fewer options in each simulated year. In our tests it very slightly lowered the chance your money lasts: about 2 in 10,000 on average, and at most about 2 in 1,000. This year\'s recommended actions still use every option.';
  const couple = 'For couples, speed mode is less tested. It ranged from slightly slower to nearly twice as fast, and it spent a little less and held slightly less in shares than the full calculation. Use the full calculation for decisions.';
  ok(SPEED_WORDS.single === single && SPEED_WORDS.couple === couple && SPEED_WORDS.title === 'Beta – speed mode', `7. the warnings are D98's word for word (a single's ${SPEED_WORDS.single === single ? 'yes' : 'NO'}, a couple's ${SPEED_WORDS.couple === couple ? 'yes' : 'NO'}); the title "${SPEED_WORDS.title}"`);
}

console.log(`\n=========== ${fail ? `FAILED: ${fail} of ${pass + fail}` : `ALL PASS: ${pass}`} ===========`);
process.exit(fail ? 1 : 0);
