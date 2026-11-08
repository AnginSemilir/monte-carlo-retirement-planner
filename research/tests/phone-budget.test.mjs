/*
 * THE PHONE'S BUDGET (Phase 11 item 2; the launch plan's F5: "Phase 11 ... sets the phone's budget from the result"). A dial
 * position solves its base first, and each part of its split solve restores the base (L2), so its peak memory grows with the
 * parts, where the solve on show peaks at about the same split any way: S116 at 45 points in the harness's browser, the
 * locked position peaked at about 1.0, 1.6 and 2.5GB split one, two and four ways (results-phone-memory.txt, run 8 and run 7).
 * On a touch device (src/solverClient.js touchDevice: no fine, hovering pointer, so a phone or a tablet in either orientation)
 * a solve with a base splits TOUCH_BASE_PARTS ways at most: two from Phase 11, four from 8 Nov by the maintainer's ruling
 * (D62: faster, at more memory), so a touch device now splits as one with a mouse does. The full tier.
 *
 * On S126 at light settings, its workers run in this process (as solver-client.test.mjs runs them), the device told by
 * window.matchMedia:
 *   1. on a touch device, the plan at the dial's 3 (its base first), asked to split four ways: four;
 *   2. on a touch device, the plan at the dial's default (no base), asked four ways: four;
 *   3. on a device with a mouse, the plan at the dial's 3, asked four ways: four;
 *   4. on a touch device, the dial's line working out the plan at 6 (startFigures, the base and the position): every solve
 *      in it split four ways, counted by the parts its workers were sent;
 *   5. on a touch device, a solve asked to split one way is not split.
 * The plant (the client's PLANT 'phonetwo': the budget held at two, as before D62) fails checks 1 and 4.
 *   node research/tests/phone-budget.test.mjs [--plant phonetwo]
 *   node research/tests/phone-budget.test.mjs --plants
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), self = fileURLToPath(import.meta.url);
const PLANTS = { phonetwo: [1, 4] };
if (args[0] === '--plants') {
  let bad = 0;
  for (const [name, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [self, '--plant', name], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; }
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

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { solveForApp } = await import('../../src/solverApp.js');
const { strategyAnswer, strategyRuns } = await import('../../src/solverStrategy.js');
const { withAims, atDial } = await import('../../src/solverSettings.js');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const opts = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const plan = withAims(E.normalizePlan(buildScenarios().find(s => s.id === 'S126').plan));

/* a solver worker in this process (solver-client.test.mjs's): each part holds the plan solved whole, solved once; the parts
   each solve was split into counted from the 'part' messages */
const solves = new Map();
const solveOnce = (p, o) => { const k = JSON.stringify([p, o]); if (!solves.has(k)) solves.set(k, solveForApp(E, M, p, o)); return solves.get(k); };
let partsSent = [];
class InProcessWorker {
  constructor() { this.solved = null; this.held = null; this.onmessage = null; this.onerror = null; this.dead = false; }
  postMessage(data) { setImmediate(() => this.handle(data)); }
  terminate() { this.dead = true; }
  reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
  handle(data) {
    if (this.dead) return;
    const { id, kind } = data;
    try {
      if (kind === 'part') { partsSent.push(data.parts); this.solved = solveOnce(data.plan, data.opts); this.reply({ done: true }); return; }
      if (kind === 'solve' || kind === 'base') { this.solved = solveOnce(data.plan, data.opts); this.held = null; this.reply({ id, done: true, meta: {}, secs: 0, restored: false }); return; }
      if (kind === 'probe') { this.reply({ id, hit: false }); return; }
      if (kind === 'share') { this.reply({ id, rec: {} }); return; }
      if (kind === 'runs') { this.reply({ id, runs: strategyRuns(E, this.solved, data.plan, { seed: data.seed, from: data.from, to: data.to }) }); return; }
      if (kind === 'strategy') { const a = strategyAnswer(E, this.solved, this.held, data); this.held = a.held; this.reply({ id, strategy: a.strategy }); return; }
      throw new Error(`no '${kind}' here`);
    } catch (e) { this.reply({ id, error: e.message }); }
  }
}
globalThis.Worker = InProcessWorker;
// the device: a touch device answers no to "(hover: hover) and (pointer: fine)", a computer with a mouse yes
let mouse = false;
globalThis.window = { matchMedia: q => ({ matches: mouse && /hover: hover/.test(q) && /pointer: fine/.test(q) }) };
const C = await import('../../src/solverClient.js');
if (PLANT_NAME) C.PLANT.rule = PLANT_NAME;

const at = x => atDial(plan, x);
const solveAt = async (x, parts) => {
  partsSent = [];
  const base = x > 1 ? { plan: at(1), key: 'the-base' } : null;
  const job = C.startSolve(at(x), { ...opts, parts, key: `at-${x}`, base });
  const d = await job.done; job.close();
  return { parts: d.parts, sent: partsSent.slice() };
};

mouse = false;
{ const r = await solveAt(3, 4); ok(1, 'on a touch device, the plan at the dial\'s 3 (its base first), asked to split four ways, splits four', r.parts === 4, `${r.parts} ways (its parts told ${[...new Set(r.sent)].join(', ') || 'none'})`); }
{ const r = await solveAt(1, 4); ok(2, 'on a touch device, the plan at the dial\'s default (no base), asked four ways, splits four', r.parts === 4, `${r.parts} ways`); }
mouse = true;
{ const r = await solveAt(3, 4); ok(3, 'on a device with a mouse, the plan at the dial\'s 3, asked four ways, splits four', r.parts === 4, `${r.parts} ways`); }
mouse = false;
{ partsSent = [];
  const f = C.startFigures(E, at(6), { ...opts, seed: 12345, upto: 40, parts: 4 });
  const fig = await f.done;
  ok(4, 'on a touch device, the dial\'s line working out the plan at 6: every solve in it split four ways', !!fig.headline && partsSent.length > 0 && partsSent.every(n => n === 4), `the parts told ${partsSent.join(', ')}`); }
{ const r = await solveAt(3, 1); ok(5, 'on a touch device, a solve asked to split one way is not split', r.parts === 1 && r.sent.length === 0, `${r.parts} way, ${r.sent.length} parts sent`); }

console.log(`\n${passed} passed, ${failed} failed${PLANT_NAME ? ` (planted: ${PLANT_NAME})` : ''}`);
process.exit(failed ? 1 : 0);
