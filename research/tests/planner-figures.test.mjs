/*
 * THE OUTLOOK'S FIGURES (step U, the new planner: LAYOUT.md sections 3.1 and 11.3; src/solverStrategy.js spendBandsOf,
 * typicalOf, wealthBandsOf, aheadAnswer). The full tier; joining FAST needs an unlock.
 *
 * 1. The money bands from the strategy's runs are the engine's monteCarlo(..., { collectPaths: true }).bands on the same seed
 *    and paths, bit for bit, in both arms (S116 at the light settings): the solved plan's and your current approach's.
 * 2. The spending bands use summarizeTrials's quantile over the paths still going in each year (not failed by then), against
 *    a hand count on 20 made-up paths.
 * 3. A split simulation's bands (two parts, joinRuns) are the whole run's, bit for bit.
 * 4. The typical run is aheadOf's path over the first step's paths (aheadAnswer with upto: headRuns(held, upto)), the same
 *    path whether the worker then holds that many or more; its first ten levels are the ten-year rows' spending over their
 *    targets.
 * 5. The money's records are Float64: a Float32 record cannot equal the engine's doubles bit for bit.
 * 6. The next ten years' words (LAYOUT.md section 8, finding L9; src/solverWords.js aheadWords), a property over the ten rows of
 *    each fixture (S116 retired, S224 working): a tier is said only in a year whose tier differs from the year before's (the
 *    first year's against the plan's own), and said as a step down, a step back up or a return to the risk chosen by the sign
 *    of that difference; a year with nothing to say reads "nothing to change".
 * Its plants (each fails its own checks): 'bandyear' the money's bands read a year out (1), 'armswap' the arms swapped (1),
 * 'failcount' a failed path counted after it fails (2), 'typmedian' the typical run taken as each year's median (4), 'typall'
 * the typical run picked over every path held (4), 'f32' the money recorded as Float32 (1, 5); and in the words, 'tiereach' the tier
 * said every year it is held (6), 'tierdown' a step up worded as a step down (6).
 *   node research/tests/planner-figures.test.mjs [--plant <name>]
 *   node research/tests/planner-figures.test.mjs --plants        every plant in turn, each in its own process
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const PLANTS = { bandyear: [1], armswap: [1], failcount: [2], typmedian: [4], typall: [4], f32: [1, 5], tiereach: [6], tierdown: [6] };
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
const W = await import('../../src/solverWords.js');
const plantAt = args.indexOf('--plant');
if (plantAt >= 0) {
  const name = args[plantAt + 1];
  if (!PLANTS[name]) throw new Error(`no plant '${name}'`);
  if (name.startsWith('tier')) W.WORDS_PLANT.rule = name; else S.PLANT.rule = name;
  console.log(`(planted: '${name}')`);
}

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const SMALL = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, PTS = 6, SEED = 4242, STEP0 = 200, STEP1 = 500;

console.log('=========== THE SOLVE (S116, the light settings) ===========');
const plan = buildScenarios().find(s => s.id === 'S116').plan, t0 = Date.now();
const solved = solveForApp(E, M, plan, { points: PTS, research: SMALL });
const sc = S.solvedContext(E, solved), yc = S.yourContext(E, plan), retireT = S.retireYearOf(sc);
const whole = S.strategyRuns(E, solved, plan, { seed: SEED, from: 0, to: STEP1 });
const sum = S.strategySummary(E, solved, whole);
console.log(`      solved and run on ${STEP1} paths in ${((Date.now() - t0) / 1000).toFixed(0)} s; retired from year ${retireT}; survival ${sum.headline.survival.toFixed(1)}%`);

console.log('=========== 1. THE MONEY BANDS ARE THE ENGINE\'S ===========');
for (const [arm, ctx] of [['solved', sc], ['yours', yc]]) {
  const mc = E.monteCarlo(ctx, { trials: STEP1, seed: SEED, collectPaths: true });
  const mine = sum.outlook.wealth[arm];
  const diff = mine.length !== mc.bands.length ? Infinity : mine.filter((b, t) => ['t', 'p10', 'p25', 'p50', 'p75', 'p90'].some(k => b[k] !== mc.bands[t][k])).length;
  ok(diff === 0, `1. ${arm}: the money bands on ${STEP1} paths are monteCarlo's bit for bit (${mine.length} years; ${diff} differ; the median at the end ${Math.round(mine[mine.length - 1]?.p50 || 0)}, the engine's ${Math.round(mc.bands[mc.bands.length - 1].p50)})`);
}

console.log('=========== 2. THE SPENDING BANDS, BY HAND ===========');
{
  // twenty made-up paths over ten years: levels in steps of 5 from a seeded walk, some failing part way
  let x = 7;
  const rnd = () => { x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff; return x / 2147483648; };   // stepped in 32 bits (hygiene.test.mjs)
  const CTX = { totalYears: 9, ageSelf0: 60 };
  const rs = Array.from({ length: 20 }, (_, i) => ({ failT: i % 6 === 0 ? 2 + (i % 5) : -1, level: Uint16Array.from({ length: 10 }, () => 80 + 5 * Math.floor(rnd() * 7)) }));
  const got = S.spendBandsOf(CTX, rs, 1);
  let bad = 0;
  for (let t = 1; t <= 9; t++) {
    const going = [];
    for (const r of rs) if (r.failT === -1 || t < r.failT) going.push(r.level[t]);
    going.sort((a, b) => a - b);
    const at = p => going[Math.min(going.length - 1, Math.floor(going.length * p))];
    const g = got.find(b => b.t === t);
    if (!g || g.n !== going.length || g.age !== 60 + t || [0.1, 0.25, 0.5, 0.75, 0.9].some((p, j) => g[['p10', 'p25', 'p50', 'p75', 'p90'][j]] !== at(p))) bad++;
  }
  ok(bad === 0 && got.length === 9 && got[0].t === 1, `2. the spending bands on 20 made-up paths, years 1 to 9, against a hand count over the paths still going (${bad} years differ; ${got.length} years given)`);
  const real = sum.outlook.spend;
  ok(real.length > 0 && real[0].t === retireT && real.every(b => b.n <= STEP1 && b.p10 <= b.p25 && b.p25 <= b.p50 && b.p50 <= b.p75 && b.p75 <= b.p90),
    `2. S116's spending bands start at its first retired year (${real[0]?.t}) and are ordered in every year (${real.length} years; year one 10-90 ${real[0]?.p10} to ${real[0]?.p90})`);
}

console.log('=========== 3. A SPLIT SIMULATION\'S BANDS ===========');
{
  const a = S.strategyRuns(E, solved, plan, { seed: SEED, from: 0, to: 170 }), b = S.strategyRuns(E, solved, plan, { seed: SEED, from: 170, to: STEP1 });
  const joined = S.strategySummary(E, solved, S.joinRuns([b, a]));
  ok(same(joined.outlook, sum.outlook), `3. two parts (paths 0 to 169 and 170 to ${STEP1 - 1}) joined give the whole run's outlook bit for bit`);
}

console.log('=========== 4. THE TYPICAL RUN ===========');
{
  const held0 = S.headRuns(whole, STEP0);   // what the worker holds after the first step
  const first = S.aheadAnswer(E, solved, plan, held0, { years: 10, upto: STEP0 });
  const later = S.aheadAnswer(E, solved, plan, whole, { years: 10, upto: STEP0 });
  const over0 = S.aheadOf(E, solved, plan, held0, { years: 10 });
  // against the path's own record, every year of it, not typicalOf's reading of it (which a plant there would share)
  ok(first.path === over0.path && same(first.typical, Array.from(held0.solved[over0.path].level)), `4. the typical run is aheadOf's path over the first ${STEP0} paths, every year its own level (path ${first.path})`);
  ok(later.path === first.path && same(later.typical, first.typical), `4. the same path with ${STEP1} paths held as with ${STEP0} (path ${later.path} against ${first.path})`);
  const lv = first.rows.map(r => (r.spend > 0 ? Math.round((100 * r.spend) / E.spendTargetAtAge(sc, r.age)) : 0));
  ok(first.rows.length === 10 && same(lv, first.typical.slice(0, 10)), `4. its first ten levels are the ten-year rows' spending over their targets (${first.typical.slice(0, 10).join(' ')})`);
}

console.log('=========== 5. THE MONEY RECORDED IN DOUBLES ===========');
ok(whole.solved.every(r => r.wealth instanceof Float64Array) && whole.yours.every(r => r.wealth instanceof Float64Array), '5. every path\'s money record is a Float64Array, in both arms');

console.log('=========== 6. THE NEXT TEN YEARS\' WORDS ===========');
{
  const fmt = v => E.formatGBP(v);
  for (const [id, sv, pl] of [['S116', solved, plan], ['S224', null, buildScenarios().find(x => x.id === 'S224').plan]]) {
    const r = sv || solveForApp(E, M, pl, { points: PTS, research: SMALL });
    const runs = S.strategyRuns(E, r, pl, { seed: SEED, from: 0, to: STEP0 });
    const rows = S.aheadAnswer(E, r, pl, runs, { years: 10, upto: STEP0 }).rows;
    let bad = 0, said = 0;
    rows.forEach((row, i) => {
      const prev = i ? rows[i - 1].parts : { tierPen: 0, tierIsa: 0 }, w = W.aheadWords(row, { fmt }, i ? prev : null);
      for (const [k, name] of [['tierPen', 'pension'], ['tierIsa', 'ISA']]) {
        const now = row.parts[k] || 0, was = prev[k] || 0;
        const line = w.lines.find(l => /in risk|risk you chose/.test(l) && (l.includes(`your ${name} `) || l.includes('your pension and ISA')));
        if (now === was) { if (line) bad++; continue; }
        said++;
        const kind = now === 0 ? 'back to the risk you chose' : was === 0 ? 'lower in risk' : now < was ? 'back up in risk' : 'further down in risk';
        if (!line || !line.includes(kind)) bad++;
      }
      // a year's sweep (item 5, part 1: the engine's 7d named to the pound, sweepWords) is something to do, as a draw is
      if (!w.lines.length || (w.lines.length === 1 && w.lines[0] === 'nothing to change') !== (row.parts.draw === 'none' && !row.parts.harvest && !W.sweepWords(row.swept, { fmt }) && (row.parts.tierPen || 0) === (prev.tierPen || 0) && (row.parts.tierIsa || 0) === (prev.tierIsa || 0))) bad++;
    });
    ok(bad === 0, `6. ${id}: over its ten rows a tier is said only where it changes, as a step down, a step back up or a return (${said} changes said; ${bad} rows wrong)`);
  }
  // made-up rows for the cases the fixtures may not reach: held, a step back up, a step further, back to the plan's own
  const mk = (t, pen, isa) => ({ t, year: 2026 + t, age: 60 + t, spend: 30000, parts: { level: 1, draw: 'none', harvest: null, tierPen: pen, tierIsa: isa } });
  const rows = [mk(0, 3, 3), mk(1, 3, 3), mk(2, 2, 2), mk(3, 3, 3), mk(4, 0, 0), mk(5, 1, 0)];
  const words = rows.map((r, i) => W.aheadWords(r, { fmt }, i ? rows[i - 1].parts : null).notes);
  const want = ['Move your pension and ISA 3 steps lower in risk', 'nothing to change', 'Move your pension and ISA 1 step back up in risk (2 below the risk you chose)',
    'Move your pension and ISA 1 step further down in risk (3 below the risk you chose)', 'Move your pension and ISA back to the risk you chose', 'Move your pension 1 step lower in risk'];
  ok(JSON.stringify(words) === JSON.stringify(want), `6. six made-up years read as LAYOUT.md section 8 words them (${words.join(' | ')})`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
