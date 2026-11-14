/*
 * A COUPLE'S FIGURES SHARED ACROSS THE SOLVE'S PARTS, AND A STORED SOLVE RESTORED SPLIT (Part D, D5.6; research/solver/PART-D.md;
 * src/solverClient.js). A couple's figures ran in the owner worker alone: each person's table was split across the parts and
 * the parts let go, and a couple's path costs about 150 to 200 ms at the app's settings, so the headline's 5,000 paths and
 * this year's skips took minutes. Now the first person's parts are kept and solve (or restore) the second person's table too,
 * each part assembles the couple, and the headline's paths and the skips' runs are shared out as a single's are; a stored
 * solve (a single's, or either person's) is restored split, the owner copying the record in and its parts following it. The
 * client is driven by in-process stand-ins for the page's workers, answering by the modules the worker calls (couplePlans,
 * assembleCouple, solveForApp, strategyRuns and strategyAnswer, coupleSkipRuns and coupleActionsOf; as solver-client.test.mjs
 * does, each part's table is solved whole, the tables a split solve gives, e2.test.mjs); the page's own worker is run by the
 * browser harness (solver-planner-ui.cjs check 19). Light settings, S069 (61 and 58, holding 60/40, some of its paths failing)
 * and S126:
 *   1. a couple solved with three parts: each part is handed both people's tables (the first person's, then the second's, in
 *      their slots) and assembles the couple; the job keeps the two parts beside the owner; the headline's figures on 120
 *      paths and this year's actions on 60 paths are the whole run's (strategyOf; coupleActionsOf run whole), bit for bit;
 *   2. the same couple again, both people's tables now in the store: each is restored split (the owner asked to follow it,
 *      each part handed the record's small fields alone, followRecord), the solve marked restored, the two parts kept, the
 *      figures and the actions the whole run's;
 *   3. a single (S126) restored with two parts: restored split, its part kept, its figures the whole run's (before, a restored
 *      solve kept no parts and the owner ran every path);
 *   4. a part leaving out the first path of its share of the couple's skips (solverCouple.js PLANT 'skipdrop'): refused by the
 *      join, never a different cost.
 * Plants (--planted): the client's 'coupleowner' (the couple's parts let go: check 1) and 'wholerestore' (a stored solve restored
 * in the owner alone: checks 2 and 3).
 *   node research/tests/couple-split.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { cacheOf, followRecord } from '../../src/solverCache.js';
import { strategyRuns, strategyAnswer, strategyOf } from '../../src/solverStrategy.js';
import { couplePlans, assembleCouple, isCouple, coupleSkipRuns, coupleActionsOf, PLANT as COUPLE_PLANT } from '../../src/solverCouple.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['coupleowner', ['1']], ['wholerestore', ['2', '3']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_SPLIT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const SEED = 4242, N = 120, NA = 60;
const lib = buildScenarios();
// S069, 61 and 58: some paths fail (about 71% under the app's own rules on 300 paths), so this year's skips cost something
const couple = lib.find(s => s.id === 'S069');
const single = E.normalizePlan(lib.find(s => s.id === 'S126').plan);

// the store, as the page's (a key's record, cacheOf), and every message each stand-in was handed
const store = new Map(), log = [];
const solves = new Map();
const solveOnce = (p, o) => { const k = JSON.stringify([p, o]); if (!solves.has(k)) solves.set(k, solveForApp(E, M, p, o)); return solves.get(k); };
let nextId = 0;
class InProcessWorker {
  constructor() { this.n = nextId++; this.solved = null; this.persons = { self: null, part: null }; this.runs = null; this.pending = null; this.onmessage = null; this.onerror = null; this.dead = false; }
  postMessage(data) { log.push({ w: this.n, kind: data.kind, slot: data.slot || null, follow: !!data.restore || !!data.restoreSplit, part: data.part }); setImmediate(() => this.handle(data)); }
  terminate() { this.dead = true; }
  reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
  // a person's table, kept in its slot, or the solve in hand; solved whole (a split solve's tables) or restored from the store
  table(data, restore) {
    const r = restore ? solveForApp(E, M, data.plan, { ...data.opts, restore }) : solveOnce(data.plan, data.opts);
    if (data.slot) this.persons[data.slot] = { r, plan: data.plan, ageWith: data.opts && data.opts.ageWith };
    else { this.solved = r; this.runs = null; }
    return r;
  }
  handle(data) {
    if (this.dead) return;
    const { id, kind } = data;
    try {
      if (kind === 'part') {
        // a part following a restore holds the record's small fields alone: its table is the owner's, which it would view
        if (data.restore && (data.restore.layers || !data.restore.follow)) throw new Error('a following part was handed tables');
        this.table(data, null); this.reply({ done: true }); return;
      }
      if (kind === 'probe') { this.reply({ id, hit: store.has(data.key) }); return; }
      if (kind === 'follow') { const rec = store.get(data.key) || null; this.pending = rec ? { key: data.key, rec } : null; this.reply({ id, follow: rec ? followRecord(rec) : null }); return; }
      if (kind === 'solve') {
        const rec = data.restoreSplit ? this.pending && this.pending.key === data.key && this.pending.rec : data.key && data.parts <= 1 ? store.get(data.key) || null : null;
        if (data.restoreSplit && !rec) throw new Error('no record followed for this key');
        this.pending = null;
        const r = this.table(data, rec);
        this.reply({ id: 0, done: true, meta: JSON.parse(JSON.stringify(r.meta)), secs: 0, restored: !!rec });
        if (data.key && !rec) { store.set(data.key, cacheOf(r)); this.reply({ id: 0, stored: true, why: null }); }
        return;
      }
      if (kind === 'couple-plans') { this.reply({ id, ...couplePlans(E, data.plan, { shareRule: data.shareRule }) }); return; }
      if (kind === 'couple') {
        const cp = assembleCouple(E, M, data.household, { self: this.persons.self.r, part: this.persons.part.r }, {
          shareRule: data.shareRule, solvedOn: { self: { plan: this.persons.self.plan, ageWith: this.persons.self.ageWith }, part: { plan: this.persons.part.plan, ageWith: this.persons.part.ageWith } } });
        this.solved = cp; this.runs = null; this.reply({ id, done: true, meta: {} }); return;
      }
      if (kind === 'runs') { this.reply({ id, runs: strategyRuns(E, this.solved, data.plan, { seed: data.seed, from: data.from, to: data.to }) }); return; }
      if (kind === 'strategy') { const a = strategyAnswer(E, this.solved, this.runs, data); this.runs = a.held; this.reply({ id, strategy: a.strategy }); return; }
      if (kind === 'skipruns') { this.reply({ id, skipruns: coupleSkipRuns(E, this.solved, { seed: data.seed, from: data.from, to: data.to }) }); return; }
      if (kind === 'actions') {
        const same = this.runs && this.runs.r === this.solved && this.runs.plan === JSON.stringify(data.plan) && this.runs.runs.seed === data.seed ? this.runs.runs : null;
        this.reply({ id, actions: coupleActionsOf(E, this.solved, data.plan, { seed: data.seed, n: data.n, base: same ? same.solved : null, parts: data.parts || null }) }); return;
      }
      throw new Error(`no '${kind}' here`);
    } catch (e) { this.reply({ id: id === undefined ? undefined : id, error: e.message }); }
  }
}
globalThis.Worker = InProcessWorker;
const C = await import('../../src/solverClient.js');
C.PLANT.rule = process.env.COUPLE_SPLIT_PLANT || '';

// the whole run's figures and actions, in this process
const cpl = couplePlans(E, couple.plan);
const tabs = { self: solveForApp(E, M, cpl.plans.self, { ...light, ageWith: cpl.ageWith.self }), part: solveForApp(E, M, cpl.plans.part, { ...light, ageWith: cpl.ageWith.part }) };
const cpWhole = assembleCouple(E, M, cpl.household, tabs, { solvedOn: { self: { plan: cpl.plans.self, ageWith: cpl.ageWith.self }, part: { plan: cpl.plans.part, ageWith: cpl.ageWith.part } } });
const wantCouple = JSON.stringify(strategyOf(E, cpWhole, couple.plan, { trials: N, seed: SEED }));
const wantActions = JSON.stringify(coupleActionsOf(E, cpWhole, couple.plan, { seed: SEED, n: NA }));
const wantSingle = JSON.stringify(strategyOf(E, solveForApp(E, M, single, light), single, { trials: N, seed: SEED }));

async function runCouple() {
  const at = log.length;
  const job = C.startSolve(couple.plan, { ...light, parts: 3, key: 'couple', couple: { engine: E } });
  const done = await job.done;
  const s = await job.strategy(couple.plan, SEED, N);
  const a = await job.actions(couple.plan, SEED, NA);
  const sent = log.slice(at);
  job.close();
  return { done, s, a, sent };
}
const partsOf = sent => [...new Set(sent.filter(m => m.kind === 'part').map(m => m.w))];

// 1. a couple solved with three parts
{ const { done, s, a, sent } = await runCouple(), ps = partsOf(sent);
  const both = ps.length === 2 && ps.every(w => ['self', 'part'].every(slot => sent.some(m => m.w === w && m.kind === 'part' && m.slot === slot)) && sent.some(m => m.w === w && m.kind === 'couple'));
  const shared = sent.some(m => m.kind === 'runs' && ps.includes(m.w)) && sent.some(m => m.kind === 'skipruns' && ps.includes(m.w));
  ok('1. a couple with three parts: each part handed both people\'s tables and assembling the couple, its paths and skips shared out, every figure and cost the whole run\'s',
    both && shared && JSON.stringify(s.strategy) === wantCouple && JSON.stringify(a.actions) === wantActions,
    `${couple.id}: parts ${ps.join(', ')} (both tables ${both}); shared ${shared}; survival ${s.strategy.headline.survival.toFixed(2)}%; skips ${a.actions.actions.map(x => (x.cost === null ? 'none' : x.cost.toFixed(2))).join(' ')}; restored ${done.restored}`); }

// 2. the same couple, both tables in the store
{ const { done, s, a, sent } = await runCouple(), ps = partsOf(sent);
  const followed = sent.filter(m => m.kind === 'follow').length === 2 && sent.filter(m => m.kind === 'part').every(m => m.follow);
  const shared = sent.some(m => m.kind === 'runs' && ps.includes(m.w));
  ok('2. the couple again from the store: each person restored split (followed, the parts handed no tables), the parts kept, the figures and costs the whole run\'s',
    done.restored === true && followed && ps.length === 2 && shared && JSON.stringify(s.strategy) === wantCouple && JSON.stringify(a.actions) === wantActions,
    `restored ${done.restored}; follows ${sent.filter(m => m.kind === 'follow').length}; parts ${ps.length}; shared ${shared}`); }

// 3. a single restored with two parts
{ const key = 'single';
  const first = C.startSolve(single, { ...light, parts: 2, key }); await first.done; first.close();
  const at = log.length, job = C.startSolve(single, { ...light, parts: 2, key }), done = await job.done, s = await job.strategy(single, SEED, N), sent = log.slice(at);
  job.close();
  const ps = partsOf(sent), shared = sent.some(m => m.kind === 'runs' && ps.includes(m.w));
  ok('3. a single restored with two parts: restored split, its part kept and running its share, the figures the whole run\'s',
    done.restored === true && sent.some(m => m.kind === 'follow') && ps.length === 1 && shared && JSON.stringify(s.strategy) === wantSingle,
    `restored ${done.restored}; parts ${ps.length}; shared ${shared}`); }

// 4. a part's share of the skips leaving out a path
{ let refused = '';
  try {
    COUPLE_PLANT.rule = 'skipdrop';
    const parts = [coupleSkipRuns(E, cpWhole, { seed: SEED, from: 0, to: 30 }), coupleSkipRuns(E, cpWhole, { seed: SEED, from: 30, to: NA })];
    COUPLE_PLANT.rule = '';
    coupleActionsOf(E, cpWhole, couple.plan, { seed: SEED, n: NA, parts });
  } catch (e) { refused = e.message; }
  COUPLE_PLANT.rule = '';
  ok('4. a part leaving out the first path of its share of the skips: refused, never a different cost', /path order/.test(refused), refused || 'not refused'); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
