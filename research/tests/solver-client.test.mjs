/*
 * THE FIGURES OF ONE SOLVE ASKED FOR AT ONCE (Part C Phase 10; src/solverClient.js strategy). The full tier.
 *
 * Under the switch four cards ask the solve in hand for its figures: the Strategy tab (2,000 paths, then 5,000), the age dial
 * beside it, the dial's line on the Config tab and the scenarios under the comparison (each the first 2,000 paths, exactly).
 * On a split solve each ask shares the next paths out among the solve's parts and the owner joins their shares in path order
 * (src/solverStrategy.js strategyAnswer, the owner's own code). Two asks at once shared out the same paths, and the owner
 * refused the second join, so the age dial beside the Strategy tab never drew its line (the projection harness, 3 Nov). The
 * client now takes the asks one at a time. On S126 at light settings, the solve split two ways, its workers run in this
 * process by the owner's own code:
 *   1. two asks at once, the Strategy tab's (160 paths) and an exact one (160): both answered, each Node's figures for those
 *      paths; then 320 paths, and an exact 160 after it, Node's;
 *   2. three asks at once (160, 320, an exact 160): all answered, each Node's;
 *   3. the owner refusing a share that does not start where its paths end keeps the paths it held: the next ask is Node's.
 * The plant (the client's PLANT 'noqueue': the asks run at once) fails check 1.
 *   node research/tests/solver-client.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { strategyRuns, strategyAnswer, strategyOf } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const opts = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S126').plan), SEED = 12345;

/* a solver worker run in this process: the owner's answers by the worker's own code (src/solverWorker.js 'strategy' is
   strategyAnswer); each part holds the plan solved whole, which gives the same tables as a split solve (e2.test.mjs), the one
   solve shared (read only) so the test solves once */
const solves = new Map();
const solveOnce = (p, o) => { const k = JSON.stringify([p, o]); if (!solves.has(k)) solves.set(k, solveForApp(E, M, p, o)); return solves.get(k); };
class InProcessWorker {
  constructor() { this.solved = null; this.held = null; this.onmessage = null; this.onerror = null; this.dead = false; }
  postMessage(data) { setImmediate(() => this.handle(data)); }
  terminate() { this.dead = true; }
  reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
  handle(data) {
    if (this.dead) return;
    const { id, kind } = data;
    try {
      if (kind === 'part') { this.solved = solveOnce(data.plan, data.opts); this.held = null; this.reply({ done: true }); return; }
      if (kind === 'solve') { this.solved = solveOnce(data.plan, data.opts); this.held = null; this.reply({ id, done: true, meta: {}, secs: 0, restored: false }); return; }
      if (kind === 'runs') { this.reply({ id, runs: strategyRuns(E, this.solved, data.plan, { seed: data.seed, from: data.from, to: data.to }) }); return; }
      if (kind === 'strategy') { const a = strategyAnswer(E, this.solved, this.held, data); this.held = a.held; this.reply({ id, strategy: a.strategy }); return; }
      throw new Error(`no '${kind}' here`);
    } catch (e) { this.reply({ id, error: e.message }); }
  }
}
globalThis.Worker = InProcessWorker;
const C = await import('../../src/solverClient.js');

const r = solveOnce(plan, opts);   // the tables the workers hold: what is tested is the client's sharing out and joining
const node = n => JSON.stringify(strategyOf(E, r, plan, { trials: n, seed: SEED }));
const at = { 160: node(160), 320: node(320) };
const same = (got, n) => got.status === 'fulfilled' && JSON.stringify(got.value.strategy) === at[n];
const said = got => (got.status === 'fulfilled' ? `${got.value.strategy.trials} paths` : `refused (${got.reason.message})`);

async function atOnce(label = '') {
  const before = fail;
  const job = C.startSolve(plan, { ...opts, parts: 2 });
  const done = await job.done;
  const two = await Promise.allSettled([job.strategy(plan, SEED, 160), job.strategy(plan, SEED, 160, { exact: true })]);
  ok(done.parts === 2 && two.every(g => same(g, 160)), `1${label}. two asks at once on the solve split ${done.parts} ways: both answered, Node's figures (${two.map(said).join('; ')})`);
  const more = await Promise.allSettled([job.strategy(plan, SEED, 320)]), back = await Promise.allSettled([job.strategy(plan, SEED, 160, { exact: true })]);
  ok(same(more[0], 320) && same(back[0], 160), `1${label}. then 320 paths, and an exact 160 after it: Node's (${said(more[0])}; ${said(back[0])})`);
  job.close();
  return fail - before;
}

console.log('=========== 1. TWO ASKS AT ONCE ===========');
await atOnce();
console.log('=========== 2. THREE ASKS AT ONCE ===========');
{
  const job = C.startSolve(plan, { ...opts, parts: 2 });
  await job.done;
  const three = await Promise.allSettled([job.strategy(plan, SEED, 160), job.strategy(plan, SEED, 320), job.strategy(plan, SEED, 160, { exact: true })]);
  ok(same(three[0], 160) && same(three[1], 320) && same(three[2], 160), `2. 160, 320 and an exact 160 at once: each Node's (${three.map(said).join('; ')})`);
  job.close();
}
console.log('=========== 3. A REFUSED SHARE KEEPS THE PATHS HELD ===========');
{
  const first = strategyAnswer(E, r, null, { plan, seed: SEED, upto: 160 });
  const twice = strategyRuns(E, r, plan, { seed: SEED, from: 0, to: 160 });
  let refused = null;
  try { strategyAnswer(E, r, first.held, { plan, seed: SEED, upto: 320, runs: [twice] }); } catch (e) { refused = e.message; }
  const next = strategyAnswer(E, r, first.held, { plan, seed: SEED, upto: 320 });
  ok(!!refused && first.held.runs.to === 160 && JSON.stringify(next.strategy) === at[320], `3. the paths 0 to 160 offered again: refused (${refused}); the 160 held kept, and the next ask Node's at 320`);
}
console.log('=========== THE PLANT ===========');
{
  const keep = { pass, fail };
  C.PLANT.rule = 'noqueue';
  console.log('  -- planted: the asks run at once (expected to FAIL) --');
  const caught = await atOnce(' [noqueue]');
  C.PLANT.rule = '';
  pass = keep.pass; fail = keep.fail;
  ok(caught > 0, `the plant 'noqueue' (the asks run at once) is caught: ${caught} check${caught === 1 ? '' : 's'} failed`);
}
console.log('EDGES: two asks for the same paths, an ask for fewer paths than are held, a share offered twice');
console.log(fail ? `\nFAILED: ${fail} of ${pass + fail}` : `\nALL PASS: ${pass}`);
process.exit(fail ? 1 : 0);
