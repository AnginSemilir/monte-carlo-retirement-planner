/*
 * THE STRATEGY TAB'S FIGURES (Part C Phase 9; src/solverStrategy.js). The full tier.
 *
 * 1. runPath is the engine's runTrial path for path: survival, the terminal pot, net of the pension's death tax, and the
 *    lifetime tax, on your plan and on the solved plan (S002 retired, S188 working, at light settings).
 * 2. compareOf is summarizeTrials's figures on the same paths: the survival rate, the median and unlucky-tenth pot, the
 *    median lifetime tax and the median estate.
 * 3. The headline's rules on hand-made paths (the wording, B4: the length of the dip, three years): the four cases at their
 *    edges (a dip of three years is short, four is long; starting at the target; never back), the median over the paths,
 *    a path that fails before it is back counting as never, and a household still working read at its first retired year.
 * 4. The late raise on hand-made paths: the first year the upper quartile spends above the target, and none where the paths
 *    alive then mostly run out.
 * 5. strategyOf on S002 and S188: the two arms on the same paths (your plan's figures are monteCarlo's on the same seed),
 *    the headline's survival is the solved arm's, and a working household's start is its retirement year's; the paths run
 *    in two parts and joined in path order give the whole run's figures, and a part missing a path is refused.
 * 6. This year's actions on S126 (retired, its first move a cut): the move as the engine takes it rebuilt from the table's
 *    index is the engine's own, field for field; each skip differs from the move in its part, and its cost is the paired
 *    count on the same paths; forcing the chosen move itself is the plan path for path (no cost); a dominated action (the
 *    year's move at its highest spending level) costs at least 0 against the plan; the next years on the
 *    median path start with the first move and are the median of the pots left.
 * Each rule's plant: the dip's edge moved (three years long), the quantile taken from the top, a failed path counted as
 * back, the raise read on every path whatever its end.
 *   node research/tests/solver-strategy.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { runPath, compareOf, headlineOf, raiseOf, strategyOf, strategyRuns, joinRuns, strategySummary, yourContext, solvedContext, retireYearOf, DIP_YEARS, PLANT, firstMove, moveOf, partsOf, actionsOf, aheadOf } from '../../src/solverStrategy.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const all = buildScenarios(), planOf = id => all.find(s => s.id === id).plan;
const SMALL = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, PTS = 6, N = 200, SEED = 4242;

// hand-made paths: a level per year (percent of target), a failure year or -1
const fake = (levels, failT = -1) => ({ survived: failT < 0, failT, level: Uint16Array.from(levels), target: levels.filter(x => x > 0).length * 100, delivered: levels.reduce((a, x) => a + x, 0), terminalPot: 0, terminalPotNet: 0, lifetimeTax: 0 });
// the owners carry their own age as the engine's context does (engine.mjs buildContext: age0 for each person; src/solverStrategy.js
// retireYearOf reads it since Part D's D5, a couple retired from either person's first retired year)
const CTX = { totalYears: 9, ageSelf0: 60, baseYear: 2026, spendBands: [], targetSpend: 20000, owners: [{ retireAge: 60, age0: 60 }] };
const EF = { spendTargetAtAge: () => 20000 };
const rise = k => Array.from({ length: 10 }, (_, t) => (t < k ? 80 : 100));   // back at target in year k

console.log('=========== 1-2. THE ENGINE\'S OWN RUN AND SUMMARY ===========');
const solved = {};
for (const id of ['S002', 'S188']) {
  const plan = planOf(id), t0 = Date.now();
  const r = solveForApp(E, M, plan, { points: PTS, research: SMALL });
  solved[id] = r;
  for (const [arm, ctx] of [['yours', yourContext(E, plan)], ['solved', solvedContext(E, r)]]) {
    const paths = E.pathsForSeed(SEED, N, ctx.totalYears);
    const mine = paths.map(zs => runPath(E, ctx, zs)), theirs = paths.map(zs => E.runTrial(ctx, zs));
    const bad = mine.filter((m, k) => m.survived !== theirs[k].survived || m.terminalPot !== theirs[k].terminalPot || m.terminalPotNet !== theirs[k].terminalPotNet || m.lifetimeTax !== theirs[k].lifetimeTax).length;
    ok(bad === 0, `1. ${id} ${arm}: runPath is runTrial on ${N} paths (survival, the pot, the estate, the tax; ${bad} differ)`);
    const c = compareOf(mine), s = E.summarizeTrials(theirs);
    ok(c.survival === s.successRate && c.medianPot === s.medianTerminal && c.p10Pot === s.p10Terminal && c.lifetimeTax === s.medianLifetimeTax && c.estate === s.medianTerminalNet,
      `2. ${id} ${arm}: compareOf is summarizeTrials (survival ${c.survival.toFixed(1)}%, median pot ${Math.round(c.medianPot)}, unlucky tenth ${Math.round(c.p10Pot)}, tax ${Math.round(c.lifetimeTax)}, estate ${Math.round(c.estate)})`);
  }
  console.log(`      ${id} solved and checked in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

console.log('=========== 3. THE HEADLINE\'S RULES ===========');
{
  const H = rs => headlineOf(EF, CTX, rs, 0);
  const at = H([fake(rise(0)), fake(rise(0)), fake(rise(0))]);
  ok(at.case === 'atTarget' && at.startLevel === 100 && at.startSpend === 20000 && at.backIn === 0, `3. starting at the target: ${at.case}, start ${at.startLevel}%, £${at.startSpend}`);
  const s3 = H([fake(rise(3)), fake(rise(3)), fake(rise(3))]), l4 = H([fake(rise(4)), fake(rise(4)), fake(rise(4))]);
  ok(DIP_YEARS === 3 && s3.case === 'short' && s3.dip === 3 && l4.case === 'long' && l4.dip === 4, `3. the dip's edge (B4, three years): back in year 3 ${s3.case}, in year 4 ${l4.case}`);
  const nv = H([fake(Array(10).fill(80)), fake(Array(10).fill(80)), fake(rise(2))]);
  ok(nv.case === 'never' && nv.backT === null && nv.backYear === null, `3. the median path never back: ${nv.case}`);
  const md = H([fake(rise(1)), fake(rise(5)), fake(rise(9))]);
  ok(md.backT === 5 && md.backYear === 2031 && md.case === 'long', `3. the median over the paths: back in years 1, 5 and 9 reads year ${md.backT} (${md.backYear}), ${md.case}`);
  const fl = H([fake(rise(2), 1), fake(rise(2), 1), fake(rise(2))]);
  ok(fl.case === 'never' && fl.survival.toFixed(2) === '33.33', `3. a path that fails before it is back counts as never: ${fl.case}`);
  const wk = headlineOf(EF, { ...CTX, owners: [{ retireAge: 63, age0: 60 }] }, [fake([0, 0, 0, 85, 85, 100, 100, 100, 100, 100]), fake([0, 0, 0, 90, 100, 100, 100, 100, 100, 100]), fake([0, 0, 0, 80, 80, 80, 100, 100, 100, 100])], retireYearOf({ ...CTX, owners: [{ retireAge: 63, age0: 60 }] }));
  ok(wk.retireT === 3 && !wk.retired && wk.startLevel === 85 && wk.backT === 5 && wk.backIn === 2 && wk.case === 'short', `3. a household still working: retires in year ${wk.retireT}, starts at ${wk.startLevel}% (the median of the first retired year), back ${wk.backIn} years in, ${wk.case}`);
  // plants, each in the module's own rule
  const planted = (rule, f) => { PLANT.rule = rule; try { return f(); } finally { PLANT.rule = ''; } };
  ok(planted('dip', () => H([fake(rise(3)), fake(rise(3)), fake(rise(3))]).case) === 'long', 'planted: the dip\'s edge a year early reads a three-year dip as long');
  ok(planted('topq', () => H([fake(rise(1)), fake(rise(2)), fake(rise(9)), fake(rise(9))]).backT) !== H([fake(rise(1)), fake(rise(2)), fake(rise(9)), fake(rise(9))]).backT, 'planted: the quantile taken from the top moves the median path');
  ok(planted('failback', () => H([fake(rise(2), 1), fake(rise(2), 1), fake(rise(2))]).case) !== 'never', 'planted: a failed path counted as back is no longer never');
}

console.log('=========== 4. THE LATE RAISE ===========');
{
  const up = k => Array.from({ length: 10 }, (_, t) => (t < k ? 100 : 110));
  const r = raiseOf(CTX, [fake(up(9)), fake(up(4)), fake(up(4)), fake(up(4))], 0);
  ok(r && r.t === 4 && r.age === 64 && r.level === 110, `4. the upper quartile above the target from year ${r && r.t} (age ${r && r.age}), at ${r && r.level}%`);
  const ruin = raiseOf(CTX, [fake(up(2), 6), fake(up(2), 6), fake(up(2), 6), fake(up(9))], 0);
  ok(ruin === null || ruin.t >= 6, `4. none on paths heading for ruin (the paths alive in years 2 to 5 mostly run out): ${ruin ? `year ${ruin.t}` : 'none'}`);
  PLANT.rule = 'raiseall'; const all2 = raiseOf(CTX, [fake(up(2), 6), fake(up(2), 6), fake(up(2), 6), fake(up(9))], 0); PLANT.rule = '';
  ok(all2 && all2.t === 2, `planted: the raise read on every path whatever its end shows it in year ${all2 && all2.t}`);
}

console.log('=========== 5. strategyOf ===========');
for (const id of ['S002', 'S188']) {
  const plan = planOf(id), r = solved[id];
  const s = strategyOf(E, r, plan, { trials: N, seed: SEED });
  const mc = E.monteCarlo(yourContext(E, plan), { trials: N, seed: SEED }), mcS = E.monteCarlo(solvedContext(E, r), { trials: N, seed: SEED });
  ok(s.compare.yours.survival === mc.successRate && s.compare.yours.medianPot === mc.medianTerminal && s.compare.solved.survival === mcS.successRate && s.headline.survival === s.compare.solved.survival,
    `5. ${id}: your plan ${s.compare.yours.survival.toFixed(1)}% and the solved plan ${s.compare.solved.survival.toFixed(1)}% are monteCarlo's on the same seed; the headline's survival is the solved arm's`);
  const parts = [strategyRuns(E, r, plan, { seed: SEED, from: 70, to: N }), strategyRuns(E, r, plan, { seed: SEED, from: 0, to: 70 })];
  ok(JSON.stringify(strategySummary(E, r, joinRuns(parts))) === JSON.stringify(s), `5. ${id}: the figures from paths 0-69 and 70-${N - 1} run apart and joined in path order are the whole run's, every figure`);
  let refused = '';
  try { joinRuns([parts[1], { ...parts[0], from: 71, solved: parts[0].solved.slice(1), yours: parts[0].yours.slice(1) }]); } catch (e) { refused = e.message; }
  ok(/path order/.test(refused), `planted: a part that drops its first path is refused (${refused || 'not refused'})`);
  const rt = retireYearOf(solvedContext(E, r));
  ok(s.headline.retireT === rt && (id === 'S002' ? s.headline.retired : !s.headline.retired && rt > 0), `5. ${id}: the first retired year ${s.headline.retireT}, ${s.headline.retired ? 'retired' : 'still working'}; start ${s.headline.startLevel}% (£${s.headline.startSpend} of £${s.headline.target}), ${s.headline.case}`);
}

console.log('=========== 6. THIS YEAR\'S ACTIONS AND THE NEXT YEARS ===========');
{
  const id = 'S126', plan = planOf(id), r = solveForApp(E, M, plan, { points: PTS, research: SMALL });
  const f = firstMove(E, r), rebuilt = moveOf(r, f.mv.index, f.mv);
  const keys = Object.keys(f.mv).filter(k => k !== 'code');
  ok(keys.every(k => JSON.stringify(rebuilt[k]) === JSON.stringify(f.mv[k])) && Object.keys(rebuilt).length === Object.keys(f.mv).length, `6. ${id}: the move rebuilt from index ${f.mv.index} is the engine's own, field for field (${keys.length} fields)`);
  const a = actionsOf(E, r, plan, { seed: SEED, n: N });
  const taken = a.actions.filter(x => x.skip);
  ok(taken.length > 0 && taken.every(x => (x.part === 'draw' ? x.skip.parts.draw !== a.move.parts.draw : x.skip.parts[x.part] !== a.move.parts[x.part]) && x.cost === (100 * (x.lost - x.saved)) / x.n),
    `6. ${id}: ${taken.length} action(s) (${taken.map(x => `${x.part} ${JSON.stringify(x.value)}: skip ${x.cost.toFixed(2)} points, ${x.lost} lost, ${x.saved} saved`).join('; ')}), each skip differing in its part, its cost the paired count`);
  // the chosen move forced in the first year is the plan, path for path
  const sc = solvedContext(E, r), paths = E.pathsForSeed(SEED, N, sc.totalYears);
  const self = { ...sc, policyOverride: { ...f.base, choose: (st, t, held) => (t === 0 ? moveOf(r, f.mv.index, f.mv) : f.base.choose(st, t, held)) } };
  const diff = paths.filter(zs => { const x = runPath(E, sc, zs), y = runPath(E, self, zs); return x.survived !== y.survived || x.terminalPot !== y.terminalPot; }).length;
  ok(diff === 0, `6. ${id}: the chosen move forced in the first year is the plan on all ${N} paths (${diff} differ)`);
  const planted = { ...sc, policyOverride: { ...f.base, choose: (st, t, held) => (t === 0 ? moveOf(r, (f.mv.index + 1) % r.actions.length, f.mv) : f.base.choose(st, t, held)) } };
  const diffP = paths.filter(zs => runPath(E, sc, zs).terminalPot !== runPath(E, planted, zs).terminalPot).length;
  ok(diffP > 0, `planted: another move forced in the first year parts the paths (${diffP} of ${N})`);
  // a planted dominated action (the launch plan's Phase 9): the year's move forced to its highest spending level, the rest
  // of it unchanged, costs at least 0 against the plan on the same paths
  const top = Math.max(...r.actions.map(x => x.spendLevel || 1));
  const domAi = r.actions.findIndex((x, ai) => { const p = partsOf(x, r.c.acts[ai]), q = partsOf(r.actions[f.mv.index], r.c.acts[f.mv.index]); return p.level === top && p.draw === q.draw && p.isaFirst === q.isaFirst && p.harvest === q.harvest && p.tierPen === q.tierPen && p.tierIsa === q.tierIsa; });
  const dom = { ...sc, policyOverride: { ...f.base, choose: (st, t, held) => (t === 0 ? moveOf(r, domAi, f.mv) : f.base.choose(st, t, held)) } };
  let dl = 0, ds = 0;
  for (const zs of paths) { const x = runPath(E, sc, zs).survived, y = runPath(E, dom, zs).survived; if (x && !y) dl++; else if (!x && y) ds++; }
  ok(domAi >= 0 && domAi !== f.mv.index && dl - ds >= 0, `6. ${id}: the year's move forced to spend ${Math.round(100 * top)}% (a dominated action) costs ${((100 * (dl - ds)) / N).toFixed(2)} points against the plan (${dl} lost, ${ds} saved): at least 0`);
  const runs = strategyRuns(E, r, plan, { seed: SEED, from: 0, to: N }), ah = aheadOf(E, r, plan, runs, { years: 10 });
  const pots = runs.solved.map(x => x.terminalPot).sort((x, y) => x - y);
  ok(ah.rows.length === 10 && JSON.stringify(ah.rows[0].parts) === JSON.stringify(partsOf(r.actions[f.mv.index], r.c.acts[f.mv.index])) && runs.solved[ah.path].terminalPot === pots[Math.floor(N / 2)],
    `6. ${id}: the next ten years on the median path (path ${ah.path}, its pot the median), starting with the first move (${ah.rows.map(x => Math.round(x.spend)).slice(0, 4).join(', ')}, ...)`);
}

console.log(`\n=========== ${fail ? `FAILED: ${fail} of ${pass + fail}` : `ALL PASS: ${pass}`} ===========`);
process.exit(fail ? 1 : 0);
