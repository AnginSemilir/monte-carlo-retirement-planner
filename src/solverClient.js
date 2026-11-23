/*
 * THE PAGE'S SIDE OF THE SOLVER (Part C Phase 7, research/solver/PHASE-7.md). Loaded lazily, by src/useSolver.js when the
 * switch is on, so the first load of the app fetches none of it.
 *
 *   const key = await keyOf(engine, plan, opts);          // what the solve depends on (src/solverKey.js); the engine is
 *                                                         // App.jsx's, handed in (importing App.jsx here would split the
 *                                                         // page's own first-load code into another chunk)
 *   const job = startSolve(plan, { key, base, parts, lambda, points, research, onProgress, onStored });
 *   const { meta, secs, parts, restored, base } = await job.done;   // rejects with 'cancelled' after job.cancel()
 *   await job.ask('simulate', { trials, seed });          // the owner worker's answers (src/solverWorker.js)
 *   await job.strategy(plan, seed, upto, { exact });      // the Strategy tab's figures, split across the solve's parts (exact:
 *                                                         // the first `upto` paths alone, though more have been run)
 *   await job.actions(plan, seed, n);                     // this year's skip costs, split the same way
 *   job.close();                                          // the owner worker, and the solved tables with it, let go
 *   const f = startFigures(engine, plan, { seed, upto });  // a variant's figures, its tables let go (Phase 10, F6)
 *
 * With a key, the owner first asks the store (src/solverCache.js): a stored solve of the same key and code is restored, split
 * across workers where the page is cross-origin isolated (Part D, D5.6: the owner copies the record into the shared tables and
 * its parts follow it, so the parts kept hold the solve, as a fresh split solve's do); otherwise the plan is solved, split the
 * same way (src/solverPool.js), and stored. Elsewhere the solve runs whole in one worker.
 * A dial position above 1 (step L2) names its base ({ plan, key }: baseOf): the owner first restores or solves the base and
 * keeps it, then solves the position on it; a split position's parts each restore the base from one shared copy. The store
 * keeps the base beside the latest position (src/solverCache.js), so another position of the same plan costs one solve.
 */
import { arenaFor, failArena } from './solverPool.js';
// Part C Phase 10 (B5): the page's isolation where its host sends no headers, asked for with the first solve (src/useSolver.js)
export { ensureIsolation } from './isolation.js';
import { solveKey } from './solverKey.js';
import { dialBase, APP_COUPLE, appJoint, jointKey } from './solverSettings.js';
import { PLANNER_PLANT } from './plannerPlant.js';
import { swapOf, coupleSolverOn } from './couplesSwitch.js';
import { otherOrder, backMeta, backAnswer } from './coupleOrder.js';

export const PLANT = { rule: '' };   // tests only: 'openfallback' lets a couple the household route alone opens (D143) fall back to today's route (couple-default.test.mjs); 'keyvariant' keys a couple's variant's person solves, stored and restored (couple-split.test.mjs check 5); 'noqueue' lets two figures' asks run at once (solver-client.test.mjs); 'keepshared' keeps a job's shared memory after it is let go (solver-close.test.mjs); 'phonetwo' holds the phone's budget at two, as before D62 (phone-budget.test.mjs); 'coupleowner' lets a couple's parts go, 'wholerestore' restores a stored solve in the owner alone, both as before D5.6 (couple-split.test.mjs); 'halfdefault' solves a couple on the half share unless asked otherwise, as before D99, and 'notie' assembles a couple without the couples' joint move, as before D108, and 'nojointcheck' leaves each assembly's joint move unread (couple-default.test.mjs); 'noformcheck' leaves each assembly of a household's setting (its form and split among it) unread and 'partnobands' hands its first part no bands (household-client.test.mjs); 'nohousehold' solves a couple on today's route though the couples' default names the household plan (couple-default.test.mjs); 'nofallback' fails the solve of a couple the household plan refuses (household-client.test.mjs)
export const canSplit = () => typeof SharedArrayBuffer !== 'undefined' && (typeof crossOriginIsolated === 'undefined' || crossOriginIsolated)
  && typeof SharedArrayBuffer.prototype.grow === 'function';
/* gate 5's four cores at most (D11), fewer where the machine has fewer */
export const defaultParts = () => (canSplit() ? Math.max(1, Math.min(4, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 1)) : 1);
/*
 * THE PHONE'S BUDGET (Phase 11 item 2; the launch plan's F5: "Phase 11 ... sets the phone's budget from the result"). A dial
 * position solves its base first, and each part of its split solve restores the base (L2), so its peak memory grows with the
 * parts; the solve on show peaks at about the same split any way (results-phone-memory.txt). On a touch device (no fine,
 * hovering pointer: a phone or a tablet, in either orientation) a solve with a base splits TOUCH_BASE_PARTS ways at most;
 * every other solve, and every solve elsewhere, splits as before (research/tests/phone-budget.test.mjs). Two from Phase 11;
 * four from 8 Nov, the maintainer's ruling (D62: faster, at more memory: about 2.5GB at the dial's 3 in the harness's
 * browser, where two ways peaked at about 1.6GB), so a touch device splits as any other does, at gate 5's four cores at most;
 * the cap stays, one figure to move if a phone runs short of memory.
 */
export const TOUCH_BASE_PARTS = 4;
export const touchDevice = () => typeof window !== 'undefined' && !!window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const partsFor = (parts, base) => (base && touchDevice() ? Math.min(parts, PLANT.rule === 'phonetwo' ? 2 : TOUCH_BASE_PARTS) : parts);
const newWorker = () => new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });
/* the solve's key on the page: the plan as the solver takes it and the settings (the code is checked by the worker) */
export const keyOf = (engine, plan, opts = {}) => solveKey(engine, plan, opts);
/* a dial position's base as startSolve takes it ({ plan, key }), or null at position 1 */
export async function baseOf(engine, plan, opts = {}) {
  const bp = dialBase(engine.normalizePlan(plan));
  return bp ? { plan: bp, key: await solveKey(engine, bp, opts) } : null;
}

/*
 * A PLAN'S FIGURES WITHOUT ITS TABLES (Part C Phase 10; the launch plan's F6: "a position not chosen keeps only its figures").
 * A variant of the plan on screen (another of the dial's positions, another retirement age, a scenario, a step of a search)
 * solved in workers of its own, the Strategy tab's headline and comparison run on the paths and seed the plan's own use,
 * and the workers let go: only the figures are kept. A dial position's base is restored from the store where it is kept
 * (the store keeps the base beside the latest position), so a position costs one solve. The variant itself is neither
 * restored nor stored unless `keyed` (the dial's position 1 is that base, restored by its key).
 *   const f = startFigures(engine, plan, { seed, upto, ...opts });   const { headline, compare } = await f.done;   f.cancel();
 */
// `household` (step 8's port): a couple's variant at another form than the couples' default (null: today's route); unset, the default
export function startFigures(engine, plan, { seed, upto, keyed = false, parts = defaultParts(), household = undefined, ...opts } = {}) {
  let job = null, cancelled = false;
  const done = (async () => {
    // a couple's variant (Part D, D5.1): its two tables solved in turn, each with its own base (startSolve's `couple`)
    const isCouplePlan = !!(plan && plan.demographics && plan.demographics.planningMode === 'couple');
    const base = isCouplePlan ? null : await baseOf(engine, plan, opts), key = keyed ? await keyOf(engine, plan, opts) : null;
    if (cancelled) throw new Error('cancelled');
    job = startSolve(plan, { ...opts, key, base, parts, ...(isCouplePlan ? { couple: { engine, ...(household !== undefined ? { household } : {}) } } : {}) });
    try {
      await job.done;
      const { strategy } = await job.strategy(plan, seed, upto, { exact: true });
      return { headline: strategy.headline, compare: strategy.compare };
    } finally { job.close(); }
  })();
  return { done, cancel() { cancelled = true; if (job) { job.cancel(); job.close(); } } };
}

/*
 * A COUPLE (Part D, D5.1; src/solverCouple.js): with `couple` ({ engine, shareRule }), the plan is a couple's, solved on the
 * couples' default share rule (src/solverSettings.js APP_COUPLE, D99: each person's share of the pots outside 40% to 60%)
 * unless `shareRule` names another ('half', the research's; couple-default.test.mjs), and assembled with the couples' joint
 * move (APP_COUPLE's, D108: appJoint) unless `joint` names another (null for none). The owner cuts
 * each person's plan from it ('couple-plans'); each is then solved as a single's plan is, in turn, with their partner's age
 * today (`ageWith`) in its settings and so in its key: where the job is keyed (the plan's own solve, not a variant's), restored
 * from the store, else solved and stored, each split across workers, a dial position's base first (always keyed, as a
 * single's); its progress names whose table it is (`who`). The owner then assembles the couple
 * ('couple') and keeps it as the solve in hand. The two people's solves run on the same parts (D5.6), which then assemble
 * the couple too and keep it, so the couple's paths and skips are shared out as a single's are
 * (research/tests/couple-split.test.mjs); where the two did not split alike, the owner runs them all.
 * That is today's route. Since D135 the couples' default solves a couple as one household (APP_COUPLE.household: the
 * household route in startSolve, below; research/tests/household-client.test.mjs): one table, solved as a single's plan's
 * is, inside the household's tax bands. `household` names the form (null: today's route, which a couple the household plan
 * refuses also takes, its record saying why).
 */
export function startSolve(plan, { key = null, base = null, parts: asked = defaultParts(), onProgress = null, onStored = null, couple = null, ...opts } = {}) {
  const parts = partsFor(asked, base);
  const owner = newWorker(), workers = [owner], pending = new Map();
  let seq = 0, finished = false, rejectDone = null, arena = null, n = 1;
  // a job let go keeps none of its shared memory (Phase 11, phone-memory.cjs): its handle can outlive it (an earlier state of
  // the page holds its asks), so the arena is dropped here and not left to the handle (research/tests/solver-close.test.mjs)
  // so are the workers' handlers, which the solve's phases set and which close over what a phase held (a position's shared base)
  const release = () => { if (PLANT.rule === 'keepshared') return; arena = null; for (const w of workers) { w.onmessage = null; w.onerror = null; } };
  const stop = () => { if (arena) failArena(arena); workers.forEach(w => w.terminate()); release(); };
  // the owner's answers: ask() replies by id, the solve's own messages under id 0
  let onMain = null, phaseWho = null;
  owner.onmessage = ({ data }) => {
    if (data.id !== 0) {
      const p = pending.get(data.id); if (!p) return; pending.delete(data.id);
      if (data.error) p.reject(new Error(data.error)); else p.resolve(data);
      return;
    }
    if (data.progress) { if (onProgress) onProgress(phaseWho ? { ...data.progress, who: phaseWho } : data.progress); return; }
    if (data.stored !== undefined) { if (onStored) onStored(data.stored, data.why || null); return; }
    if (onMain) onMain(data);
  };
  const ask = (kind, extra = {}) => {
    const id = ++seq;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); owner.postMessage({ id, kind, ...extra }); });
  };
  // a couple whose elder is entered second (D104 (1); src/couplesSwitch.js swapOf): its two tables cut from its mirror
  // (src/coupleOrder.js otherOrder), the elder first as every couple tested, and each answer the page reads put back in the
  // order the couple was entered (`ages`, the entered first person's age today and the mirror's first person's). The plan the
  // page hands the Strategy tab's asks stays the plan as entered: "your plan" is the app's rules on it, as the page shows them.
  // Plant 'noback' (PLANNER_PLANT): the answers left as the mirror's, which the page harness's couple entered younger first fails
  const mirror = couple && couple.engine && swapOf(plan) ? otherOrder(couple.engine, plan) : null;
  const ages = mirror ? (() => { const E = couple.engine, a = E.buildContext(E.resolveMpaa(E.normalizePlan(plan))), b = E.buildContext(E.resolveMpaa(E.normalizePlan(mirror))); return { self0: a.ageSelf0, mirror0: b.ageSelf0 }; })() : null;
  const back = !mirror || PLANNER_PLANT.has('noback') ? (kind, r) => r : (kind, r) => backAnswer(kind, r, ages);
  // a kept part's questions, answered by id as the owner's are
  let kept = [];
  let shared = null;   // a couple's parts (D5.6): { ws, both }, the first person's solve's, kept for the second's and the couple
  const askerOf = w => {
    const waiting = new Map();
    w.onmessage = ({ data }) => { const p = waiting.get(data.id); if (!p) return; waiting.delete(data.id); if (data.error) p.reject(new Error(data.error)); else p.resolve(data); };
    w.onerror = e => { for (const p of waiting.values()) p.reject(new Error((e && e.message) || 'a solver part failed')); waiting.clear(); };
    return (kind, extra = {}) => { const id = ++seq; return new Promise((resolve, reject) => { waiting.set(id, { resolve, reject }); w.postMessage({ id, kind, ...extra }); }); };
  };
  /*
   * The Strategy tab's figures on paths 0 to upto-1 (src/solverWorker.js 'strategy'). With a split solve's parts kept, the
   * paths not yet run are shared out evenly, the owner taking the first share, and the owner joins them in path order, so
   * the figures are the whole run's (research/tests/sim-split.test.mjs). Without parts, the owner runs them all.
   */
  let have = 0, haveKey = null, line = Promise.resolve();
  const strategyNow = async (plan, seed, upto, { exact = false } = {}) => {
    const k = JSON.stringify([seed, plan]);
    if (k !== haveKey) { have = 0; haveKey = k; }
    if (!kept.length || upto <= have) { const r = await ask('strategy', { plan, seed, upto, exact }); have = Math.max(have, upto); return r; }
    const all = [ask, ...kept], n = all.length, span = upto - have;
    const share = i => [have + Math.floor((i * span) / n), have + Math.floor(((i + 1) * span) / n)];
    const got = await Promise.all(all.map((a, i) => a('runs', { plan, seed, from: share(i)[0], to: share(i)[1] })));
    const r = await ask('strategy', { plan, seed, upto, exact, runs: got.map(g => g.runs) });
    have = upto;
    return r;
  };
  // one at a time (Phase 10): the Strategy tab, the age dial, the dial's line and the scenarios each ask for figures of the one
  // solve, and two asks at once would share out the same next paths, which the owner refuses to join twice
  const strategy = (...args) => {
    const r = PLANT.rule === 'noqueue' ? strategyNow(...args) : line.then(() => strategyNow(...args));
    line = r.catch(() => {});
    return r;
  };

  /*
   * This year's skip costs on paths 0 to n-1 (src/solverWorker.js 'actions'), after the headline. With a split solve's parts
   * kept, each part runs the skips on its share of the paths ('skipruns') and the owner joins them in path order against the
   * plan's runs it holds, so the costs are the whole run's (research/tests/skip-split.test.mjs). Without parts, the owner runs
   * them all.
   */
  const actions = async (plan, seed, n) => {
    if (!kept.length) return ask('actions', { plan, seed, n });
    const all = [ask, ...kept], m = all.length, share = i => [Math.floor((i * n) / m), Math.floor(((i + 1) * n) / m)];
    const got = await Promise.all(all.map((a, i) => a('skipruns', { plan, seed, from: share(i)[0], to: share(i)[1] })));
    return ask('actions', { plan, seed, n, parts: got.map(g => g.skipruns) });
  };

  const done = new Promise((resolve, reject) => {
    rejectDone = reject;
    // one solve: the base of a dial position ('base') or the plan itself ('solve'), restored when stored, else split where it can be
    // `phaseBase` the phase's dial base ({ plan, key }) or null; `phaseOpts` its settings (a couple's person's carry `ageWith`);
    // `slot` a couple's person ('self' or 'part'), whose solve the owner keeps in their slot. A couple's two people share their
    // parts (D5.6): the first person's solve's parts are kept and solve (or restore) the second person's too, so each part ends
    // holding both tables, assembles the couple beside the owner and runs its share of the couple's paths, as a single's parts
    // do; where the two did not split alike (the arena refused, say) their parts are let go and the owner runs every path.
    // `bands` (the household's table, step 8's port): the band scaling every worker solves it inside (src/solverWorker.js inBands)
    const phase = async (kind, phasePlan, phaseKey, phaseBase, phaseOpts = opts, slot = null, bands = null) => {
      const baseKey = phaseBase ? phaseBase.key : null;
      const hit = phaseKey ? (await ask('probe', { key: phaseKey })).hit : false;
      if (finished) return null;
      n = 1; arena = null;
      // a stored solve is restored split as a fresh one is solved split (D5.6): the owner loads the record and copies it in,
      // its parts follow it (src/solverCache.js followRecord), so the parts kept hold it; a dial position's base, restored or
      // held, stays the owner's alone. Where the store let the record go meanwhile (`follow` null), the plan is solved, split
      // (plant 'wholerestore', tests only: a stored solve restored in the owner alone, as before)
      let follow = null;
      if (parts > 1 && canSplit() && (!hit || kind === 'solve') && !(hit && PLANT.rule === 'wholerestore')) {
        if (hit) follow = (await ask('follow', { key: phaseKey })).follow;
        if (finished) return null;
        arena = arenaFor(); if (arena) n = parts;
      }
      // a split position's parts each restore its base, shared once by the owner that holds it
      let partBase = n > 1 && baseKey ? { plan: phaseBase.plan, rec: (await ask('share')).rec } : null;
      const reuse = slot === 'part' && shared && shared.ws.length === n - 1 && n > 1 ? shared.ws : null;
      const mine = [], ends = [];
      for (let i = 1; i < n; i++) {
        const w = reuse ? reuse[i - 1] : newWorker();
        if (!reuse) workers.push(w);
        mine.push(w);
        ends.push(new Promise((res, rej) => {
          w.onmessage = ({ data }) => (data.error ? rej(new Error(data.error)) : res());
          w.onerror = e => rej(new Error((e && e.message) || `solver part ${i} failed`));
          // plant 'partnobands' (household-client.test.mjs check 1): the first part handed no bands, its share solved outside them
          w.postMessage({ kind: 'part', part: i, parts: n, arena, plan: phasePlan, opts: phaseOpts, ...(bands && !(PLANT.rule === 'partnobands' && i === 1) ? { bands } : {}), ...(partBase ? { base: partBase } : {}), ...(follow ? { restore: follow } : {}), ...(slot ? { slot } : {}) });
        }));
      }
      const main = new Promise((res, rej) => {
        onMain = data => (data.error ? rej(new Error(data.error)) : res(data));
        owner.onerror = e => rej(new Error((e && e.message) || 'the solver failed'));
        owner.postMessage({ id: 0, kind, plan: phasePlan, opts: phaseOpts, parts: n, arena, key: phaseKey, ...(bands ? { bands } : {}), ...(baseKey ? { baseKey } : {}), ...(slot ? { slot } : {}), ...(follow ? { restoreSplit: true } : {}) });
      });
      const [m] = await Promise.all([main, ...ends]);
      // the parts hold the base they were sent: the page lets its copy go (solver-close.test.mjs)
      if (PLANT.rule !== 'keepshared') partBase = null;
      const drop = ws => { for (const w of ws) { w.terminate(); const j = workers.indexOf(w); if (j > 0) workers.splice(j, 1); } };
      // the plan's own solve keeps its parts, each holding the solve, to run its share of the Strategy tab's paths (Phase 9); a
      // couple's first person's keeps them for the second's, and the second's (on the same parts) for the couple; a dial
      // position's base lets them go
      if (kind === 'solve' && (!slot || slot === 'household')) kept = mine.map(askerOf);
      else if (kind === 'solve' && slot === 'self' && n > 1) shared = { ws: mine, both: false };
      else if (kind === 'solve' && slot === 'part' && reuse) shared.both = true;
      else { drop(mine); if (kind === 'solve' && slot === 'part' && shared) { drop(shared.ws); shared = null; } }
      return m;
    };
    (async () => {
      // THE HOUSEHOLD PLAN (step 8's port, research/solver/HSP-PORT.md; D134 (1)): where the couples' default names a form
      // (APP_COUPLE.household, or the caller's `couple.household`; null for none), the couple is solved as one household:
      // its plan cut in the worker at that form (src/solver/household.js householdForm), its one table solved as a single's
      // is (its key, its base, its parts), every part inside the band scaling, and the household assembled by the owner and
      // by each part kept; each assembly's form read back, a difference refused
      // plant 'nohousehold' (couple-default.test.mjs check 3): the couples' default form not taken, today's route instead
      const form = couple ? (couple.household !== undefined ? couple.household : PLANT.rule === 'nohousehold' ? null : APP_COUPLE.household || null) : null;
      // a couple the household plan cannot take (src/solver/household.js householdPlanFor's refusals: the two people's accounts
      // of one wrapper at different risks, their pay or contributions growing at different rates, a cash ISA subscription, a
      // later retiree paid or saving in the plan's first year, the partner's own limits) is solved on today's route, as before
      // the household default, and its record says why (`householdRefused`); any other error stands. Plant 'nofallback'
      // (household-client.test.mjs check 7): a refusal fails the solve
      let refusedWhy = null;
      // D143: a couple the guard hands over only because the household route's classes opened it (src/couplesSwitch.js
      // coupleSolverOn's `lifted`: Y, E, S, G) is solved on the household route alone, the route the registered test read: with no
      // household form, or where the household plan refuses its shape after all (the guard reads the refusals first:
      // householdShapeOf), the solve fails, and today's route, which no test read for these classes, never takes it; and so is
      // a plan the guard keeps off for its shape (a variant of an opened couple, an age the age card asks: the reviewer on D143's
      // change of default, finding 2), which today's guard keeps off. Plant 'openfallback' (couple-default.test.mjs): it falls
      // back as before
      const g = couple ? coupleSolverOn(plan) : null;
      const closedFor = g && g.lifted ? `a couple the household route alone opens (${g.lifted.join(', ')})` : g && g.why === 'shape' ? `a couple the guard keeps off for its shape (${g.shape})` : null;
      const closed = !!closedFor && PLANT.rule !== 'openfallback';
      if (closed && !form) throw new Error(`${closedFor} asked for no household form`);
      const hh = couple && form ? await ask('household-plan', { plan: mirror || plan, form }).catch(e => {
        // the plan's own shapes only: a refusal of the options it was called with (`opts.`, an unknown group) is a fault and stands
        if (PLANT.rule !== 'nofallback' && /^householdPlanFor: (?!opts\.|no group)/.test(e.message)) {
          if (closed) throw new Error(`the household plan refused ${closedFor}: ${e.message}`);
          refusedWhy = e.message; return null;
        }
        throw e;
      }) : null;
      if (finished) return;
      if (couple && form && hh) {
        // the table's options as the workers take them (`bands` goes beside them, src/solverWorker.js inBands), and as its key and
        // its dial base's key name them, the bands among them (src/solverKey.js): a table solved inside other bands never restored
        const hOpts = { ...opts, ageWith: hh.ageWith }, hKeyOpts = { ...hOpts, bands: hh.bands };
        const hKey = key || PLANT.rule === 'keyvariant' ? await solveKey(couple.engine, hh.hplan, hKeyOpts) : null;
        const hBase = await baseOf(couple.engine, hh.hplan, hKeyOpts);
        if (finished) return;
        phaseWho = 'household';
        const b = hBase ? await phase('base', hBase.plan, hBase.key, null, hOpts, null, hh.bands) : null;
        if (finished || (hBase && !b)) return;
        const m = await phase('solve', hh.hplan, hKey, hBase, hOpts, 'household', hh.bands);
        if (finished || !m) return;
        phaseWho = null;
        // the household's move: its table's own move, both people taking it at the even split (src/solver/household.js
        // chooseHouseholdSingle; its tie-break the candidate's above the estate cap). The form and the split move it; the top
        // three, the tie-break and the hold of the couples' joint move are passed as step 8's HSPA passed them (its audit) and
        // do not reach it (the reviewer on D135's change of default, finding 2). Each assembly's record of the whole setting is
        // read back and a difference refused, as a couple's joint move is (D109)
        const joint = appJoint(), setting = { form, split: 'even', topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, asked = { household: hh.household, ...setting };
        const sameForm = (r, where) => {
          const got = JSON.stringify(r && r.meta && r.meta.household ? r.meta.setting : null);
          if (PLANT.rule !== 'noformcheck' && got !== JSON.stringify(setting)) throw new Error(`solverClient: the household was assembled ${where} with ${got}, not the ${JSON.stringify(setting)} asked for`);
        };
        const h = await ask('household', asked);
        if (finished) return;
        sameForm(h, 'by the owner');
        if (kept.length) {
          const replies = await Promise.all(kept.map(a => a('household', asked)));
          if (finished) return;
          replies.forEach((r, i) => sameForm(r, `by part ${i + 1}`));
        }
        finished = true;
        resolve({ meta: h.meta, secs: m.secs + (b ? b.secs : 0), parts: n, restored: !!m.restored, base: null, code: null,
          couple: { household: form, k: h.meta.k, split: h.meta.split, ...(mirror ? { mirrored: true } : {}) } });
        return;
      }
      if (couple) {
        // plant 'couplehalf' (solver-planner-ui check 19, a build's PLANNER_PLANT): the page solving a couple on the half share, as before D99
        const shareRule = couple.shareRule !== undefined ? couple.shareRule : PLANT.rule === 'halfdefault' || PLANNER_PLANT.has('couplehalf') ? undefined : APP_COUPLE.shareRule;
        // the couples' joint move (D108: src/solverSettings.js appJoint), the same wherever the couple is assembled, unless the
        // caller names its own (`couple.joint`, null for none); plant 'notie' (couple-default.test.mjs check 3): none, as before D108
        const joint = couple.joint !== undefined ? couple.joint : PLANT.rule === 'notie' ? null : appJoint();
        const cpl = await ask('couple-plans', { plan: mirror || plan, shareRule });
        if (finished) return;
        let secs = 0, restored = true;
        for (const who of ['self', 'part']) {
          // plant 'coupleage' (solver-planner-ui check 19): each table solved without its partner's age, which the assembly refuses
          const pOpts = PLANNER_PLANT.has('coupleage') ? { ...opts } : { ...opts, ageWith: cpl.ageWith[who] };
          // each person's solve keyed only where the job is (startFigures' contract: a variant neither restored nor stored unless
          // `keyed`; the reviewer of 14 Nov, finding 6; couple-split.test.mjs check 5); each person's dial base keyed, as a single's
          const pKey = key || PLANT.rule === 'keyvariant' ? await solveKey(couple.engine, cpl.plans[who], pOpts) : null;
          const pBase = await baseOf(couple.engine, cpl.plans[who], pOpts);
          if (finished) return;
          // the progress names whose table it is as the couple was entered (the mirror's 'self' is the entered partner)
          phaseWho = mirror && !PLANNER_PLANT.has('noback') ? (who === 'self' ? 'part' : 'self') : who;
          const b = pBase ? await phase('base', pBase.plan, pBase.key, null, pOpts) : null;
          if (finished || (pBase && !b)) return;
          const m = await phase('solve', cpl.plans[who], pKey, pBase, pOpts, who);
          if (finished || !m) return;
          secs += m.secs + (b ? b.secs : 0); restored = restored && !!m.restored;
        }
        phaseWho = null;
        // each assembly's record (src/solverCouple.js coupleMeta) read back against the joint move asked for (the reviewer on D109's
        // change, MINOR 1): a couple assembled with another is refused, never shown as the couples' default. Plant 'nojointcheck'
        // (couple-default.test.mjs check 7): not read back, as before
        const sameJoint = (m, where) => {
          const got = jointKey(m && m.meta && m.meta.joint);
          if (PLANT.rule !== 'nojointcheck' && got !== jointKey(joint)) throw new Error(`solverClient: the couple was assembled ${where} with the joint move ${got}, not the ${jointKey(joint)} asked for`);
        };
        const c = await ask('couple', { household: cpl.household, shareRule, joint });
        if (finished) return;
        sameJoint(c, 'by the owner');
        // the parts that hold both tables assemble the couple too, and run their shares of its paths (D5.6)
        if (shared && shared.both && PLANT.rule !== 'coupleowner') {
          const askers = shared.ws.map(askerOf);
          const replies = await Promise.all(askers.map(a => a('couple', { household: cpl.household, shareRule, joint })));
          if (finished) return;
          replies.forEach((m, i) => sameJoint(m, `by part ${i + 1}`));
          kept = askers;
        } else if (shared) { shared.ws.forEach(w => { w.terminate(); const j = workers.indexOf(w); if (j > 0) workers.splice(j, 1); }); }
        shared = null;
        finished = true;
        resolve({ meta: mirror && !PLANNER_PLANT.has('noback') ? backMeta(c.meta) : c.meta, secs, parts: n, restored, base: null, code: null,
          couple: { share: mirror && !PLANNER_PLANT.has('noback') ? 1 - cpl.share : cpl.share, shareRule: cpl.shareRule, joint: joint || null, ...(refusedWhy ? { household: null, householdRefused: refusedWhy } : {}), ...(mirror ? { mirrored: true } : {}) } });
        return;
      }
      const b = base ? await phase('base', base.plan, base.key, null) : null;
      if (finished || (base && !b)) return;
      const m = await phase('solve', plan, key, base);
      if (finished || !m) return; finished = true;
      resolve({ meta: m.meta, secs: m.secs + (b ? b.secs : 0), parts: n, restored: !!m.restored, base: b ? { restored: b.restored || false, secs: b.secs } : null, code: m.code || null });
    })().catch(err => { if (finished) return; finished = true; stop(); reject(err); });
  });
  return {
    done,
    get parts() { return n; },
    cancel() {
      if (finished) return; finished = true;
      stop();
      rejectDone(new Error('cancelled'));
    },
    ask: (kind, extra = {}) => ask(kind, extra).then(r => back(kind, r)),
    strategy: (...a) => strategy(...a).then(r => back('strategy', r)),
    actions: (...a) => actions(...a).then(r => back('actions', r)),
    close() { owner.terminate(); kept.forEach((_, i) => workers[i + 1] && workers[i + 1].terminate()); workers.splice(1).forEach(w => w.terminate()); kept = []; for (const p of pending.values()) p.reject(new Error('closed')); pending.clear(); release(); }
  };
}
