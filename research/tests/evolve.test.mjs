/*
 * The joint search and the vocabulary it is built on.
 *
 * Three things are pinned. The accumulation builder extracted from the tournament reproduces the
 * tournament's own candidates exactly, so the two searches cannot drift apart. A draw order handed in
 * as an override simulates identically to the named policy it copies, so an evolved winner is a plan
 * the rest of the app already runs. And the search itself is deterministic under its seed, stays inside
 * its budget, and never loses to a warm start it was given - the elitism that makes "the tournament
 * with breeding" never worse than the tournament.
 */
import * as E from '../engine.mjs';
import { evolve, repairSteps, genomeKey, DRAW_STEPS, PEN_STEPS } from '../../src/evolve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const all = buildScenarios().filter(s => s.plan.demographics.currentAgeSelf <= s.plan.demographics.retireAgeSelf - 5);
// The library retires everyone at 60 or 65, so no household in it has a pre-access bridge. The bridge is
// where saving and drawing interact, so the fixture that needs one is a library household retiring early.
const fire = (sc, at = 52) => { const p = JSON.parse(JSON.stringify(sc.plan)); p.demographics.retireAgeSelf = at; if (p.demographics.planningMode === 'couple') p.demographics.retireAgePart = at; return { ...sc, id: sc.id + '-fire', plan: p }; };
const withGap = fire(all.find(s => s.plan.demographics.currentAgeSelf <= 42 && s.plan.demographics.planningMode === 'couple'));
const noGap = all.find(s => E.accumulationEnv(E.buildContext(s.plan)).bridge.gapYears === 0);
const single = all.find(s => s.plan.demographics.planningMode === 'single');
const envG = E.accumulationEnv(E.buildContext(withGap.plan));
console.log(`fixtures: ${withGap.id} (gap ${envG.bridge.gapYears}y, back-load ${envG.canBackLoad}), ${noGap.id}, ${single.id}`);

console.log('=========== A. THE SHARED VOCABULARY ===========');
{
  const t = E.buildTournament(withGap.plan, { scope: 'full' });
  const bridged = t.strategies.find(s => s.id === 'bridged');
  const ctx = E.buildContext(withGap.plan);
  const env = E.accumulationEnv(ctx, { scope: 'full' });
  let same = 0;
  bridged.candidates.forEach(c => {
    const mine = E.accumulationCandidate(ctx, env, { cover: c.cover, backLoad: !!c.phase });
    if (JSON.stringify(mine.planState) === JSON.stringify(c.planState) && mine.label === c.label) same++;
  });
  ok('A1  the builder reproduces every Bridge-Sized Relief candidate exactly', same === bridged.candidates.length, `${same} of ${bridged.candidates.length} on ${withGap.id}`);
  const surv = t.strategies.find(s => s.id === 'survival');
  const envC = E.accumulationEnv(ctx, { scope: 'contributions' });
  const grid = surv.candidates.filter(c => JSON.stringify(E.accumulationCandidate(ctx, envC, { cover: null, isaShare: c.share }).planState) === JSON.stringify(c.planState)).length;
  ok('A2  ...and the Survival Maximizer\'s grid with cover null', grid === surv.candidates.length, `${grid} of ${surv.candidates.length}`);
}
{
  const sc = all[20];
  let same = 0;
  for (const [key, pol] of Object.entries(E.DECUMULATION_POLICIES)) {
    const named = JSON.parse(JSON.stringify(sc.plan)); named.spending.decumulationPolicy = key;
    const over = JSON.parse(JSON.stringify(sc.plan)); over.spending.decumulationPolicy = 'Sequential';
    over.spending.policyOverride = { steps: pol.steps, harvest: pol.harvest, depositOrder: pol.depositOrder || null, costSteps: pol.costSteps || null };
    const x = E.monteCarlo(named, { trials: 200, seed: 9 }), y = E.monteCarlo(over, { trials: 200, seed: 9 });
    if (x.successRate === y.successRate && x.medianTerminal === y.medianTerminal && x.medianLifetimeTax === y.medianLifetimeTax) same++;
  }
  ok('A3  a named policy handed in as an override simulates identically', same === 5, `${same} of 5`);
  const ctx = E.buildContext({ ...sc.plan, spending: { ...sc.plan.spending, policyOverride: { steps: ['isa', 'penPA', 'cash', 'other', 'penBasic', 'penAny'], harvest: true } } });
  ok('A4  ...and a custom order is labelled as such', ctx.policyKey === 'Custom' && ctx.policySteps[0] === 'isa');
  ok('A5  a plan saved without an override is untouched', E.normalizePlan(JSON.parse(JSON.stringify(sc.plan))).spending.policyOverride === undefined);
}

console.log('=========== B. THE GENOME ===========');
{
  const r = repairSteps(['penAny', 'isa', 'penPA', 'cash', 'penBasic', 'other']);
  const pos = PEN_STEPS.map(s => r.indexOf(s));
  ok('B1  the pension steps are put back in tax-band order wherever they land', pos[0] < pos[1] && pos[1] < pos[2] && r.length === 6, r.join('>'));
  ok('B2  ...and a broken list is completed', repairSteps(['isa', 'isa', 'cash']).length === 6 && new Set(repairSteps(['isa', 'isa', 'cash'])).size === 6);
  ok('B3  every step is one the engine knows', r.every(s => DRAW_STEPS.includes(s)));
}

console.log('=========== C. THE SEARCH ===========');
{
  const opts = { budget: 12000, seed: 31, pop: 10, coarse: 80, fine: 240 };
  const r1 = evolve(E, withGap.plan, opts), r2 = evolve(E, withGap.plan, opts);
  ok('C1  the same seed gives the same winner', genomeKey(r1.winner.genome) === genomeKey(r2.winner.genome));
  ok('C2  the budget is respected', r1.used <= opts.budget && r1.used > 0, `${r1.used} of ${opts.budget}`);
  ok('C3  the winner was scored on its longest look', r1.winner.trials === opts.fine, `${r1.winner.trials} paths`);
  ok('C4  the winner decodes to a plan the engine runs', Number.isFinite(E.monteCarlo(r1.winner.planState, { trials: 50, seed: 1 }).successRate));
  ok('C5  the winner is described in words', /draw|Bracket|Sequential|ISA First|Windfall/.test(r1.winner.describe) && /phased|lump/.test(r1.winner.describe), r1.winner.describe);
  const r3 = evolve(E, withGap.plan, { ...opts, seed: 32 });
  ok('C6  a different seed is allowed to differ', true, genomeKey(r3.winner.genome) === genomeKey(r1.winner.genome) ? 'same answer' : 'different answer');
}
{
  // a warm start: the search can never lose to a genome it was handed
  const seed = { keep: false, cover: 1.0, isaShare: 0, backLoad: false, sipp: true, balance: 'proportional',
    steps: E.DECUMULATION_POLICIES['Bracket Fill Basic'].steps, harvest: true, lump: false, deposit: E.DEFAULT_DEPOSIT_ORDER };
  const opts = { budget: 9000, seed: 5, pop: 8, coarse: 80, fine: 240, seedGenomes: [seed] };
  const r = evolve(E, withGap.plan, opts);
  const seedStats = E.monteCarlo(E.resolveMpaa(evolve(E, withGap.plan, { ...opts, budget: 1, pop: 1 }).winner.planState), { trials: 240, seed: 5 });
  const lcb = (s) => s.successRate - s.standardError;
  ok('C7  with a warm start the winner is never worse than it', lcb(r.winner.stats) >= lcb(seedStats) - 1e-9, `${lcb(r.winner.stats).toFixed(2)} vs ${lcb(seedStats).toFixed(2)}`);
}
{
  const r = evolve(E, noGap.plan, { budget: 3000, seed: 2, pop: 6, coarse: 60, fine: 120 });
  ok('C8  with no bridge to size, no genome sizes one', r.elites.every(e => e.genome.cover === null || e.genome.cover === 0) && !r.elites.some(e => e.genome.backLoad), noGap.id);
  const s = evolve(E, single.plan, { budget: 3000, seed: 2, pop: 6, coarse: 60, fine: 120 });
  ok('C9  a single household never carries a couple\'s balance gene', s.elites.every(e => e.genome.balance === 'proportional'), single.id);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
