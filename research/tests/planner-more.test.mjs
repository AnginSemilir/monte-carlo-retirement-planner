/*
 * YOUR PLAN'S FIGURES BEYOND THE HEADLINE (the new planner's UI pass, 20 Nov; src/solverStrategy.js mixOf, moreOf, lifeRun).
 * The full tier.
 *
 * 1. How long the money lasts, by plan year, both arms: on made-up paths against a hand count, and on S116 at the light
 *    settings its last year is each arm's chance the money lasts (the headline's and the comparison's), arm for arm.
 * 2. The share in shares (mixOf): on S116's opening year, and on the solved plan's first year holding a tier other than its own,
 *    against a hand sum over its accounts (each pension and ISA at the tier held, cash at none, the rest at its own risk); and
 *    under your current approach a pension's share is its own risk's every year it holds money.
 * 3. The share's bands count only the paths whose money lasts that year: made-up paths against a hand count.
 * 4. The spending counts: made-up paths against a hand count (the levels while the money lasts, the years below target, the
 *    paths that run out and their median year).
 * 5. The typical run's whole life: each arm's money by wrapper adds up, year by year, to that arm's run of the same path in
 *    the strategy's runs (runPath), and its share in shares is the one runPath recorded.
 * Its plants (each fails its own checks): 'lastswap' the arms' lasting swapped (1), 'tierown' each pension and ISA read at its
 * own tier, whatever is held (2), 'eqdead' a path's share counted after its money runs out (3), 'belowall' a year after the money runs out
 * counted below target (4), 'lifeyours' both arms of the life the solved plan's (5).
 *   node research/tests/planner-more.test.mjs [--plant <name>]
 *   node research/tests/planner-more.test.mjs --plants        every plant in turn, each in its own process
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const PLANTS = { lastswap: [1], tierown: [2], eqdead: [3], belowall: [4], lifeyours: [5] };
if (args[0] === '--plants') {
  let bad = 0;
  for (const [name, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--plant', name], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; }
    const failed = [...new Set(out.split('\n').filter(l => l.startsWith('  FAIL ')).map(l => Number(/^ {2}FAIL (\d+)\./.exec(l)?.[1])))].sort();
    const right = JSON.stringify(failed) === JSON.stringify(want);
    if (!right) bad++;
    console.log(`plant '${name}': checks failing ${failed.join(', ') || 'none'} (its own: ${want.join(', ')}) ${right ? 'ok' : 'WRONG'}`);
  }
  console.log(bad ? `PLANTS: ${bad} of ${Object.keys(PLANTS).length} did not fail exactly their own checks` : `PLANTS: all ${Object.keys(PLANTS).length} fail exactly their own checks`);
  process.exit(bad ? 1 : 0);
}

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');
const { solveForApp } = await import('../../src/solverApp.js');
const S = await import('../../src/solverStrategy.js');
const plantAt = args.indexOf('--plant');
if (plantAt >= 0) {
  const name = args[plantAt + 1];
  if (!PLANTS[name]) throw new Error(`no plant '${name}'`);
  S.PLANT.rule = name;
  console.log(`(planted: '${name}')`);
}
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const SEED = 12345, N = 400;

const plan = buildScenarios().find(s => s.id === 'S116').plan;
const r = solveForApp(E, M, plan, LIGHT);
const runs = S.strategyRuns(E, r, plan, { seed: SEED, from: 0, to: N });
const s = S.strategySummary(E, r, runs), more = s.more, T = runs.solved[0].level.length;

// made-up paths: failT, level and eq by year (5 years, retired from year 1)
const mk = (failT, level, eq) => ({ failT, survived: failT < 0, level: Uint16Array.from(level), eq: Uint8Array.from(eq), target: 100, delivered: 90 });
const fake = [mk(-1, [0, 80, 80, 100, 110], [60, 40, 40, 50, 55]), mk(2, [0, 80, 80, 80, 80], [60, 30, 0, 255, 255]), mk(-1, [0, 100, 100, 100, 100], [60, 70, 70, 70, 70]), mk(3, [0, 90, 80, 80, 0], [60, 35, 20, 10, 255])];

// 1
{
  const hand = [0, 1, 2, 3, 4].map(t => (100 * fake.filter(p => p.failT < 0 || p.failT > t).length) / fake.length);
  const hs = more.lasting.solved[T - 1], hy = more.lasting.yours[T - 1];
  ok(same(S.lastingOf(fake, 5), hand) && hs === s.headline.survival && hs === s.compare.solved.survival && hy === s.compare.yours.survival && more.lasting.solved.length === T,
    `1. how long the money lasts: made-up paths ${JSON.stringify(S.lastingOf(fake, 5))} against ${JSON.stringify(hand)}; S116's last year ${hs.toFixed(2)} / ${hy.toFixed(2)} against the chance it lasts ${s.compare.solved.survival.toFixed(2)} / ${s.compare.yours.survival.toFixed(2)}`);
}
// 2
{
  const yc = S.yourContext(E, plan), st = E.freshState(yc), row = E.stepYear(yc, st, 0, 'expected');
  let w = 0, e = 0;
  for (const a of yc.accounts) { const v = row.pots[a.id] || 0; if (v <= 0) continue; const ew = a.cat === 'cash' ? 0 : yc.tierProfiles[a.id] && (a.cat === 'pen' || a.cat === 'isa') ? yc.tierProfiles[a.id][0].equityWeight : a.equityWeight; w += v; e += v * ew; }
  const mx = S.mixOf(yc, st, row.pots);
  // the solved plan along path 0 to its first year holding a pension or ISA tier other than its own
  const sc = S.solvedContext(E, r), ss = E.freshState(sc), zs = E.pathsForSeed(SEED, 1, sc.totalYears)[0], zPath = zs[sc.totalYears + 1] || 0;
  let srow = null, moved = false;
  for (let t = 0; t <= sc.totalYears && !moved; t++) { srow = E.stepYear(sc, ss, t, { z: zs[t], zPath }); moved = ss.tierHeld.self.pen > 0 || ss.tierHeld.self.isa > 0; }
  let sw = 0, se = 0;
  for (const a of sc.accounts) { const v = srow.pots[a.id] || 0; if (v <= 0) continue; const ew = a.cat === 'cash' ? 0 : sc.tierProfiles[a.id] && (a.cat === 'pen' || a.cat === 'isa') ? sc.tierProfiles[a.id][ss.tierHeld[a.owner][a.cat]].equityWeight : a.equityWeight; sw += v; se += v * ew; }
  const smx = S.mixOf(sc, ss, srow.pots);
  const penW = yc.accounts.filter(a => a.cat === 'pen').map(a => a.equityWeight)[0];
  const life = S.lifeRun(E, yc, E.pathsForSeed(SEED, 1, yc.totalYears)[0]);
  const penSteady = life.filter(x => x.pen > 0).every(x => x.eqPen === Math.round(100 * penW));
  ok(Math.abs(mx.all - e / w) < 1e-12 && moved && Math.abs(smx.all - se / sw) < 1e-12 && penSteady && life.some(x => x.pen > 0),
    `2. the share in shares: S116's opening year ${(100 * mx.all).toFixed(3)}% against a hand sum ${(100 * e / w).toFixed(3)}%; the solved plan's first year at another tier (year ${srow.t}, held ${JSON.stringify(ss.tierHeld.self)}) ${(100 * smx.all).toFixed(3)}% against ${(100 * se / sw).toFixed(3)}%; under your current approach the pension at its own risk's ${Math.round(100 * penW)}% in every year it holds money: ${penSteady}`);
}
// 3
{
  const b = S.equityBandsOf(fake, 5), hand = [4, 4, 3, 2, 2];
  ok(same(b.map(x => x.n), hand) && b[2].p50 === [40, 70, 20].sort((x, y) => x - y)[1],
    `3. the share's bands over the paths still going: counts ${JSON.stringify(b.map(x => x.n))} against ${JSON.stringify(hand)}, year 2's median ${b[2].p50}`);
}
// 4
{
  const sp = S.spendingOf({ totalYears: 4 }, fake, 1);
  const hand = { levels: { 80: 4, 90: 1, 100: 5, 110: 1 }, below: [2, 1, 0, 2], failed: { n: 2, t50: 3 } };
  const belowSorted = [...hand.below].sort((a, b) => a - b);
  ok(same(sp.levels, hand.levels) && sp.below.p50 === belowSorted[2] && sp.below.p25 === belowSorted[1] && same(sp.failed, hand.failed),
    `4. the spending counts: levels ${JSON.stringify(sp.levels)} against ${JSON.stringify(hand.levels)}; years below target p25/p50 ${sp.below.p25}/${sp.below.p50} against ${belowSorted[1]}/${belowSorted[2]}; run out ${JSON.stringify(sp.failed)}`);
}
// 5
{
  const a = S.aheadAnswer(E, r, plan, runs, { years: 10, upto: 200 }), k = a.path;
  const sum = x => x.pen + x.isa + x.other + x.cash;
  const okArm = (life, run) => life.length === run.wealth.length && life.every((x, t) => Math.abs(sum(x) - run.wealth[t]) <= 2 && (x.eq === null ? run.eq[t] === S.EQ_NONE : x.eq === run.eq[t]));
  const so = okArm(a.life.solved, runs.solved[k]), yo = okArm(a.life.yours, runs.yours[k]);
  ok(so && yo, `5. the typical run's life (path ${k}): the solved plan's money and share ${so ? 'the same as' : 'NOT'} its run's; your current approach's ${yo ? 'the same as' : 'NOT'} its run's`);
}
console.log(fail ? `FAILED: ${pass} passed, ${fail} failed` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
