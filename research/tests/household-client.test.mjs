/*
 * THE HOUSEHOLD'S SOLVE THROUGH THE PAGE'S CLIENT (step 8's port, research/solver/HSP-PORT.md step 2; D134 (1)).
 * src/solverClient.js solves a couple at a household form as one single's solve of the household plan: the owner cuts the plan
 * ('household-plan', src/solverCouple.js householdCut), its one table is solved as a single's is (its key, its dial base, its
 * parts, the store), every part inside the band scaling, and the owner and each part kept assemble the household
 * ('household', householdSolved), each assembly's setting read back. Driven by in-process stand-ins for the page's workers,
 * answering by the functions the worker calls (householdCut, householdSolved, householdMeta, solveForApp inside bandsAt, the
 * store's cacheOf and followRecord), as couple-split.test.mjs drives a couple's; each part's table is solved whole (the tables
 * a split solve gives, e2.test.mjs). The page's own worker is run by the browser harness (step 3). Light settings; S025-own
 * from step 8's panel, as household-route.test.mjs takes it:
 *   1. solved with three parts: the owner cuts the plan; the table is solved split, the cut's bands handed to the owner and to
 *      every part; the owner and both parts assemble the household with the setting asked (the form and the even split, which
 *      move its move, and the top three, the tie-break and the hold, passed as step 8's arm passed them and reaching no move:
 *      the reviewer on D135's change of default, finding 2); each assembly's table the table solved whole inside the bands, by digest,
 *      its record the whole household's, and the owner's household run on 50 paths as the whole's, bit for bit;
 *   2. the same couple again, its table now in the store: restored split (followed, the parts handed no tables), marked
 *      restored, both parts assembling, each assembly's table the same;
 *   3. the key names the bands: the household table's key is not the household plan's keyed without them; and with the
 *      household plan solved and stored first as a single's plan (outside the bands), the household's solve misses it and
 *      solves its own, never restoring a table solved outside the bands;
 *   4. a part assembling the household at another split (the pensions', not the even split asked for): refused, never shown;
 *   5. a household's variant through startFigures at the default (no form named: the couples' default since D135), as the
 *      page solves a What if variant: the household's route taken, split with its parts kept, not keyed, so neither restored
 *      nor stored, the store as it was; its headline and comparison the whole household's on the same paths;
 *   6. at the dial's position 3, the store empty: the dial base (position 1) of the household plan solved first, split inside
 *      the bands (the owner and both parts handed them) and keyed with them, its key the household's own at position 1 (so a
 *      position-1 solve stored is the base restored), then the position on it; the household assembled;
 *   7. a couple the household plan refuses (householdPlanFor's refusals of a plan's shape: here S025-own with the partner's
 *      ISA held at another risk than the first person's) is solved on today's route, as before the household default: its two
 *      people's tables cut on the pots' share and solved in their slots, the couple assembled with the couples' joint move,
 *      the job's record naming no household and the refusal's reason (`householdRefused`); and a refusal that is not the
 *      plan's shape (a form the page does not solve at) fails the solve, never falls back;
 *   8. a couple whose minimum pot is left at nought, the page's default (the reviewer on D135's change of default, finding 1:
 *      the assembly refused every such couple): S001 as the library holds it solved at the default as one household, the
 *      couple's model, its table and the engine's context each judging the household's year against one year of its target,
 *      the minimum pot the solver keeps for a plan with none (src/solver/solve.js solvePlan's minPotYears); and over the
 *      library's 210 couples as entered, the pattern search, the cut's household plan carrying the minimum pot its table is
 *      solved with (as solvePlan sets it, no solve run) and its model the same one;
 *   9. a partner's own ceilings (the limits per person) that are the first person's wrapper for wrapper, as the limits card
 *      leaves them set back to free (the reviewer's finding 3), solve as one household; a partner's own ceiling that differs
 *      falls back to today's route, its record naming the household plan's refusal (lockedPlan lowers the partner's pension
 *      to the ceiling first, so the household plan refuses its risk before it reads the limit).
 * Plants (--planted; each wants exactly the checks named): the key's 'bandsunkeyed' (the bands left out of the key: check 3),
 * the client's 'partnobands' (the first part handed no bands: every check whose table is solved split, 1, 2, 4, 5 and 6, its
 * assembly refused on the band for gains), 'noformcheck' (each assembly's setting unread: check 4), 'keyvariant' (a variant
 * keyed: check 5), 'nofallback' (a refusal of the plan's shape failing the solve: check 7, and check 9's partner whose ceiling differs), and the cut's (src/solverCouple.js)
 * 'hhzerofloor' (a household's minimum pot left at the plan's nought: check 8) and 'partceilkey' (a partner's ceilings that
 * are the first person's handed to the household plan: check 9).
 *   node research/tests/household-client.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { cacheOf, followRecord, shareRecord } from '../../src/solverCache.js';
import { householdCut, householdSolved, householdMeta, couplePlans, assembleCouple, coupleMeta, PLANT as COUPLE_PLANT } from '../../src/solverCouple.js';
import { PRODUCT_DEFAULTS } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { bandsAt } from '../../src/solver/household.js';
import { solveKey, PLANT as KEY_PLANT } from '../../src/solverKey.js';
import { solvedContext, strategyRuns, strategyAnswer, strategyOf } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { appJoint, atDial, dialBase } from '../../src/solverSettings.js';
import { readHspPanel } from '../solver/household-hsp-panel.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['bandsunkeyed', ['3']], ['partnobands', ['1', '2', '4', '5', '6']], ['noformcheck', ['4']], ['keyvariant', ['5']], ['nofallback', ['7', '9']], ['hhzerofloor', ['8']], ['partceilkey', ['9']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HOUSEHOLD_CLIENT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted exactly ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const PLANT = process.env.HOUSEHOLD_CLIENT_PLANT || '';
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const FORM = 'pensionsPA', N = 50, SEED = 99001;
const U = readHspPanel().find(u => u.id === 'S025-own'), plan = U.plan;
const js = x => JSON.stringify(x);
const inBands = (b, f) => (b ? bandsAt(E, b.k, b.paOne, f, !!b.paK) : f());

// the store, as the page's (a key's record, cacheOf), every message each stand-in was handed, and each household assembled
const store = new Map(), log = [], assembled = [], couples = [];
const solves = new Map();
const solveOnce = (p, o, b) => { const k = js([p, o, b || null]); if (!solves.has(k)) solves.set(k, inBands(b, () => solveForApp(E, M, p, o))); return solves.get(k); };
let nextId = 0, oddPart = false;
class InProcessWorker {
  constructor() { this.n = nextId++; this.isPart = false; this.solved = null; this.runs = null; this.held = null; this.persons = { self: null, part: null, household: null }; this.pending = null; this.onmessage = null; this.onerror = null; this.dead = false; }
  postMessage(data) {
    log.push({ w: this.n, kind: data.kind, slot: data.slot || null, follow: !!data.restore || !!data.restoreSplit, key: data.key || null, bands: data.bands ? js(data.bands) : null, base: !!(data.base || data.baseKey),
      ...(data.kind === 'household' ? { setting: js({ form: data.form, split: data.split, topK: data.topK, tieJoint: data.tieJoint, holdPast: data.holdPast }) } : {}) });
    setImmediate(() => this.handle(data));
  }
  terminate() { this.dead = true; }
  reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
  // the table, kept in its slot, or as the dial's base, or as the solve in hand; solved whole inside the bands it was handed
  // (a split solve's tables), or restored from the store inside them, as the worker's inBands does
  table(data, restore, isBase = false) {
    const base = data.base ? inBands(data.bands, () => solveForApp(E, M, data.base.plan, { ...data.opts, restore: data.base.rec })) : data.baseKey ? this.held.r : null;
    const r = restore ? inBands(data.bands, () => solveForApp(E, M, data.plan, { ...data.opts, restore, ...(base ? { base } : {}) }))
      : base ? inBands(data.bands, () => solveForApp(E, M, data.plan, { ...data.opts, base })) : solveOnce(data.plan, data.opts, data.bands);
    if (isBase) this.held = { key: data.key, r };
    else if (data.slot) this.persons[data.slot] = { r, plan: data.plan, ageWith: data.opts && data.opts.ageWith };
    else this.solved = r;
    return r;
  }
  handle(data) {
    if (this.dead) return;
    const { id, kind } = data;
    try {
      if (kind === 'part') {
        this.isPart = true;
        if (data.restore && (data.restore.layers || !data.restore.follow)) throw new Error('a following part was handed tables');
        this.table(data, null); this.reply({ done: true }); return;
      }
      if (kind === 'probe') { this.reply({ id, hit: store.has(data.key) }); return; }
      if (kind === 'follow') { const rec = store.get(data.key) || null; this.pending = rec ? { key: data.key, rec } : null; this.reply({ id, follow: rec ? followRecord(rec) : null }); return; }
      if (kind === 'solve' || kind === 'base') {
        const isBase = kind === 'base';
        if (isBase && this.held && this.held.key === data.key) { this.reply({ id: 0, done: true, meta: JSON.parse(JSON.stringify(this.held.r.meta)), secs: 0, restored: 'held' }); return; }
        const rec = data.restoreSplit ? this.pending && this.pending.key === data.key && this.pending.rec : data.key && data.parts <= 1 ? store.get(data.key) || null : null;
        if (data.restoreSplit && !rec) throw new Error('no record followed for this key');
        this.pending = null;
        const r = this.table(data, rec, isBase);
        this.reply({ id: 0, done: true, meta: JSON.parse(JSON.stringify(r.meta)), secs: 0, restored: !!rec });
        if (data.key && !rec) { store.set(data.key, cacheOf(r)); this.reply({ id: 0, stored: true, why: null }); }
        return;
      }
      if (kind === 'share') { if (!this.held) throw new Error('no base held to share'); this.reply({ id, rec: shareRecord(cacheOf(this.held.r)) }); return; }
      if (kind === 'household-plan') { this.reply({ id, ...householdCut(E, M, data.plan, data.form) }); return; }
      if (kind === 'household') {
        if (!this.persons.household) throw new Error('a household asked before its table was solved');
        // check 4's stand-in: a part assembling the household at the pensions' split, not the even split asked
        this.solved = householdSolved(E, M, data, this.persons.household); this.runs = null;
        if (oddPart && this.isPart) this.solved = { ...this.solved, split: 'pensions' };
        assembled.push({ w: this.n, isPart: this.isPart, cp: this.solved });
        this.reply({ id, done: true, meta: householdMeta(this.solved) }); return;
      }
      // the figures (check 5), as the worker answers them (strategyRuns, strategyAnswer)
      if (kind === 'runs') { this.reply({ id, runs: strategyRuns(E, this.solved, data.plan, { seed: data.seed, from: data.from, to: data.to }) }); return; }
      if (kind === 'strategy') { const a = strategyAnswer(E, this.solved, this.runs, data); this.runs = a.held; this.reply({ id, strategy: a.strategy }); return; }
      // today's route (check 7: a couple the household plan refuses), as the worker answers it (couplePlans, assembleCouple)
      if (kind === 'couple-plans') { this.reply({ id, ...couplePlans(E, data.plan, { shareRule: data.shareRule }) }); return; }
      if (kind === 'couple') {
        const cp = assembleCouple(E, M, data.household, { self: this.persons.self.r, part: this.persons.part.r }, {
          shareRule: data.shareRule, joint: data.joint || null, solvedOn: { self: { plan: this.persons.self.plan, ageWith: this.persons.self.ageWith }, part: { plan: this.persons.part.plan, ageWith: this.persons.part.ageWith } } });
        this.solved = cp; this.runs = null; couples.push({ w: this.n, isPart: this.isPart, cp });
        this.reply({ id, done: true, meta: coupleMeta(cp) }); return;
      }
      throw new Error(`no '${kind}' here`);
    } catch (e) { this.reply({ id: id === undefined ? undefined : id, error: e.message }); }
  }
}
globalThis.Worker = InProcessWorker;
const C = await import('../../src/solverClient.js');
C.PLANT.rule = ['partnobands', 'noformcheck', 'keyvariant', 'nofallback'].includes(PLANT) ? PLANT : '';
COUPLE_PLANT.rule = ['hhzerofloor', 'partceilkey'].includes(PLANT) ? PLANT : '';
KEY_PLANT.rule = PLANT === 'bandsunkeyed' ? PLANT : '';

// the whole: the cut, its table solved whole inside its bands, the household assembled on it, its record and its paths
const cut = householdCut(E, M, plan, FORM), hOpts = { ...light, ageWith: cut.ageWith };
const joint = appJoint(), setting = { form: FORM, split: 'even', topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast };
const wholeH = solveOnce(cut.hplan, hOpts, cut.bands);
const wholeCp = householdSolved(E, M, { household: cut.household, ...setting }, { plan: cut.hplan, r: wholeH });
const wantDigest = await digestOf(tablesOf(wholeH)), wantMeta = js(householdMeta(wholeCp));
const run = cp => {
  const ctx = solvedContext(E, cp), out = [];
  for (const zs of E.pathsForSeed(SEED, N, ctx.totalYears)) { const q = E.runTrial(ctx, Float64Array.from(zs)); out.push([q.survived ? 1 : 0, q.terminalPotNet, q.lifetimeTax]); }
  return out;
};
const wantRuns = js(run(wholeCp));

async function solveHousehold(p, { parts = 3, key = 'hh' } = {}) {
  const at = log.length, from = assembled.length;
  let done = null, threw = '';
  const job = C.startSolve(p, { ...light, parts, key, couple: { engine: E, household: FORM } });
  try { done = await job.done; } catch (e) { threw = e.message; }
  job.close();
  return { done, threw, sent: log.slice(at), made: assembled.slice(from) };
}
const partsOf = sent => [...new Set(sent.filter(m => m.kind === 'part').map(m => m.w))];
const bandsJs = js(cut.bands);
const digestsOf = async made => Promise.all(made.map(a => digestOf(tablesOf(a.cp.H))));

// 1. solved with three parts
{ const { done, threw, sent, made } = await solveHousehold(plan), ps = partsOf(sent), owner = sent.find(m => m.kind === 'household-plan');
  const cutFirst = !!owner && sent.findIndex(m => m.kind === 'household-plan') < sent.findIndex(m => m.kind === 'solve');
  const solveMsg = sent.find(m => m.kind === 'solve'), partMsgs = sent.filter(m => m.kind === 'part');
  const bandsEverywhere = !!solveMsg && solveMsg.slot === 'household' && solveMsg.bands === bandsJs && partMsgs.length === 2 && partMsgs.every(m => m.slot === 'household' && m.bands === bandsJs);
  const settings = sent.filter(m => m.kind === 'household'), settingOk = settings.length === 3 && settings.every(m => m.setting === js(setting));
  const ds = await digestsOf(made), metas = made.map(a => js(householdMeta(a.cp))), ownerCp = made.find(a => !a.isPart);
  const same = made.length === 3 && ds.every(d => d === wantDigest) && metas.every(m => m === wantMeta) && !!ownerCp && js(run(ownerCp.cp)) === wantRuns;
  ok('1. three parts: the plan cut by the owner, the table solved split inside the cut\'s bands in the owner and every part, the household assembled by the owner and both parts with the setting asked, each the whole household (its table by digest, its record, 50 paths)',
    !threw && cutFirst && ps.length === 2 && bandsEverywhere && settingOk && same && done && done.couple && done.couple.household === FORM && done.couple.k === cut.bands.k,
    threw ? `threw: ${threw.slice(0, 160)}` : `parts ${ps.length}; bands to the owner ${solveMsg ? solveMsg.bands === bandsJs : '-'}, to the parts ${partMsgs.map(m => m.bands === bandsJs).join('/')}; assembled ${made.length} times, the setting asked ${settingOk}; the whole household's ${same} (k ${cut.bands.k.toFixed(4)}, the table ${wantDigest.slice(0, 12)})`); }

// 2. the same couple again, from the store
{ const { done, threw, sent, made } = await solveHousehold(plan), ps = partsOf(sent);
  const followed = sent.filter(m => m.kind === 'follow').length === 1 && sent.filter(m => m.kind === 'part').every(m => m.follow && m.bands === bandsJs);
  const ds = await digestsOf(made);
  ok('2. the household again from the store: its table restored split inside the bands (followed, the parts handed no tables), marked restored, the owner and both parts assembling, each the whole table',
    !threw && done && done.restored === true && followed && ps.length === 2 && made.length === 3 && ds.every(d => d === wantDigest),
    threw ? `threw: ${threw.slice(0, 160)}` : `restored ${done.restored}; follows ${sent.filter(m => m.kind === 'follow').length}; parts ${ps.length}; assembled ${made.length}, the whole table ${ds.every(d => d === wantDigest)}`); }

// 3. the key names the bands; a table of the household plan solved outside them is never restored as the household's
{ const kWith = await solveKey(E, cut.hplan, { ...hOpts, bands: cut.bands }), kWithout = await solveKey(E, cut.hplan, hOpts);
  store.clear();
  const single = C.startSolve(cut.hplan, { ...hOpts, parts: 1, key: kWithout }); await single.done; single.close();
  const { done, threw, sent } = await solveHousehold(plan, { parts: 1 });
  const keyed = sent.filter(m => m.kind === 'solve').map(m => m.key);
  ok('3. the key names the bands: not the household plan\'s keyed without them; with that plan stored first as a single\'s, the household solves its own table inside its bands, never restoring one solved outside them',
    kWith !== kWithout && !threw && done && done.restored === false && keyed.length === 1 && keyed[0] !== kWithout && store.size === 2,
    threw ? `threw: ${threw.slice(0, 160)}` : `the keys ${kWith.slice(0, 12)} / ${kWithout.slice(0, 12)}; the household's solve restored ${done.restored}, keyed ${keyed.map(k => k.slice(0, 12)).join(', ')}; ${store.size} solves stored`); }

// 4. a part assembling the household with another setting
{ oddPart = true;
  const { done, threw } = await solveHousehold(plan);
  oddPart = false;
  ok('4. a part assembling the household at the pensions\' split, not the even split asked: refused, never shown',
    !done && /assembled by part \d with .*"split":"pensions".* not the .*"split":"even"/.test(threw), threw ? threw.slice(0, 200) : 'not refused'); }

// 5. a household's variant through startFigures at the default (no form named), as the page solves a What if variant: the
// household's route, not keyed, neither restored nor stored; its figures the whole household's on the same paths
{ const variant = { ...plan, spending: { ...plan.spending, targetSpend: Math.round(Number(plan.spending.targetSpend) * 0.95) } };
  const before = [...store.keys()].join(), at = log.length, from = assembled.length;
  let figs = null, threw = '';
  try { figs = await C.startFigures(E, variant, { ...light, seed: SEED, upto: N, parts: 3 }).done; } catch (e) { threw = e.message; }
  const sent = log.slice(at), made = assembled.slice(from);
  const keyed = sent.filter(m => (m.kind === 'solve' || m.kind === 'base') && m.key).length, asked = sent.filter(m => m.kind === 'probe' || m.kind === 'follow').length;
  const routed = sent.some(m => m.kind === 'household-plan') && sent.filter(m => m.kind === 'solve').length === 1 && sent.filter(m => m.kind === 'solve' || m.kind === 'part').every(m => m.slot === 'household')
    && made.length === 3 && sent.some(m => m.kind === 'runs' && m.w !== sent.find(x => x.kind === 'household-plan').w);
  const vcut = householdCut(E, M, variant, FORM), vH = solveOnce(vcut.hplan, { ...light, ageWith: vcut.ageWith }, vcut.bands);
  const want = strategyOf(E, householdSolved(E, M, { household: vcut.household, ...setting }, { plan: vcut.hplan, r: vH }), variant, { trials: N, seed: SEED });
  const same = !!figs && js(figs.headline) === js(want.headline) && js(figs.compare) === js(want.compare);
  ok('5. a household\'s variant through startFigures at the default (D135), not keyed: the household\'s route, split with its parts kept, its table neither restored nor stored, the store as it was, its headline and comparison the whole household\'s on the same paths',
    !threw && routed && keyed === 0 && asked === 0 && [...store.keys()].join() === before && same,
    threw ? `threw: ${threw.slice(0, 160)}` : `the household's route ${routed} (assembled ${made.length} times, the parts running paths ${sent.some(m => m.kind === 'runs')}); ${keyed} solves keyed; ${asked} asks of the store; ${store.size} solves stored, as before: ${[...store.keys()].join() === before}; the figures the whole household's ${same}`); }

// 6. at the dial's position 3, the store empty: its base solved first, split inside the bands and keyed with them, then the
// position on it
{ const p3 = atDial(plan, 3), cut3 = householdCut(E, M, p3, FORM), bp = dialBase(E.normalizePlan(cut3.hplan));
  const wantBaseKey = bp ? await solveKey(E, bp, { ...light, ageWith: cut3.ageWith, bands: cut3.bands }) : null, oneKey = await solveKey(E, cut.hplan, { ...hOpts, bands: cut.bands });
  store.clear();
  const { done, threw, sent, made } = await solveHousehold(p3);
  const baseMsg = sent.find(m => m.kind === 'base'), basePart = sent.filter(m => m.kind === 'part' && !m.slot), posMsg = sent.find(m => m.kind === 'solve');
  ok('6. at the dial\'s position 3, the store empty: the household plan\'s base solved first, split inside the bands (the owner and both parts) and keyed with them, its key the household\'s own at position 1, then the position on it, and the household assembled',
    !threw && !!bp && !!baseMsg && baseMsg.key === wantBaseKey && wantBaseKey === oneKey && baseMsg.bands === js(cut3.bands) && basePart.length === 2 && basePart.every(m => m.bands === js(cut3.bands)) && !!posMsg && posMsg.base && posMsg.bands === js(cut3.bands) && made.length === 3 && !!done,
    threw ? `threw: ${threw.slice(0, 160)}` : `base ${!!baseMsg}, keyed with the bands ${baseMsg ? baseMsg.key === wantBaseKey : '-'} (the position-1 key ${wantBaseKey === oneKey}), its parts' bands ${basePart.map(m => m.bands === js(cut3.bands)).join('/')}; the position on it ${posMsg ? posMsg.base : '-'}; assembled ${made.length}`); }

// 7. a couple the household plan refuses: today's route, its record saying why; a refusal that is not the plan's shape stands
{ const odd = JSON.parse(JSON.stringify(plan)); odd.accounts.find(a => a.id === 'isa_part').risk = 'Medium Risk';
  let refusal = ''; try { householdCut(E, M, odd, FORM); } catch (e) { refusal = e.message; }
  const at = log.length, from = couples.length;
  let done = null, threw = '';
  const job = C.startSolve(odd, { ...light, parts: 3, couple: { engine: E } });
  try { done = await job.done; } catch (e) { threw = e.message; }
  job.close();
  const sent = log.slice(at), made = couples.slice(from);
  const slots = sent.filter(m => m.kind === 'solve').map(m => m.slot), cutPots = sent.some(m => m.kind === 'couple-plans');
  const rec = done && done.couple ? done.couple : {};
  const fellBack = !threw && /^householdPlanFor: the two people's S&S ISAs hold different risks/.test(refusal) && cutPots && js(slots) === js(['self', 'part'])
    && !sent.some(m => m.kind === 'household') && made.length === 3 && made.filter(c => !c.isPart).length === 1
    && rec.household === null && rec.householdRefused === refusal && rec.shareRule === 'pots' && js(rec.joint) === js(appJoint());
  // a fault stands: a form the page does not solve at (an unscaled one)
  let fault = ''; const j2 = C.startSolve(plan, { ...light, parts: 1, couple: { engine: E, household: 'even' } });
  try { await j2.done; } catch (e) { fault = e.message; }
  j2.close();
  ok('7. a couple the household plan refuses (the partner\'s ISA at another risk) is solved on today\'s route: cut on the pots\' share, both people\'s tables solved in their slots, the couple assembled with the joint move by the owner and both parts, its record naming no household and the refusal; a form the page does not solve at fails the solve',
    fellBack && /^householdCut: the page solves a household at a scaled form/.test(fault),
    threw ? `threw: ${threw.slice(0, 200)}` : `the refusal "${refusal.slice(0, 90)}"; cut on the pots' share ${cutPots}, tables solved in ${slots.join(', ')}, assembled as a couple ${made.length} times; the record ${js({ household: rec.household, shareRule: rec.shareRule, joint: rec.joint })}, its reason ${rec.householdRefused === refusal ? 'the refusal' : js(rec.householdRefused)}; the form 'even': ${fault ? fault.slice(0, 90) : 'not refused'}`); }

// 8. a couple whose minimum pot is left at nought: one household, its model, its table and the engine's context on one minimum
// pot, one year of its target; and the library's couples as entered, cut at the default's form, the pattern search
{ const lib = buildScenarios().filter(x => x.plan.demographics.planningMode === 'couple'), s1 = lib.find(x => x.id === 'S001').plan;
  const want = Math.round(PRODUCT_DEFAULTS.minPotYears * E.num(E.normalizePlan(s1).spending.targetSpend, 0));
  const from = assembled.length; let done = null, threw = '';
  const job = C.startSolve(s1, { ...light, parts: 1, couple: { engine: E } });
  try { done = await job.done; } catch (e) { threw = e.message; }
  job.close();
  const made = assembled.slice(from), cp = made.length ? made[0].cp : null;
  const floors = cp ? { model: cp.m.ctx.solvencyFloor, table: cp.H.m.ctx.solvencyFloor, engine: solvedContext(E, cp).solvencyFloor } : null;
  const s1ok = !threw && !!done && !!done.couple && done.couple.household === FORM && !!floors && floors.model === want && floors.table === want && floors.engine === want && want > 0 && !(E.num(s1.config && s1.config.solvencyFloor, 0) > 0);
  // the floor a table is solved with, as src/solver/solve.js solvePlan sets it with no minPotYears asked (the app asks none)
  const tableFloor = hp => { const own = Math.max(0, E.num(hp.config && hp.config.solvencyFloor, 0)), t = E.num(hp.spending && hp.spending.targetSpend, 0); return own > 0 ? own : Math.round(PRODUCT_DEFAULTS.minPotYears * t); };
  let n = 0, zero = 0, differ = 0, refused = 0; const first = [];
  for (const c of lib) {
    let cut = null; try { cut = householdCut(E, M, c.plan, FORM); } catch (e) { refused++; continue; }
    n++; if (!(E.num(c.plan.config && c.plan.config.solvencyFloor, 0) > 0)) zero++;
    const tf = tableFloor(cut.hplan), mf = M.prepare(E, cut.household).ctx.solvencyFloor || 0;
    if (tf !== mf) { differ++; if (first.length < 3) first.push(`${c.id}: the table's ${tf}, the model's ${mf}`); }
  }
  ok('8. a couple whose minimum pot is left at nought (S001 as the library holds it) solves as one household, its model, its table and the engine\'s context on one minimum pot, one year of its target; every library couple, cut at the default\'s form, carrying the minimum pot its table is solved with',
    s1ok && n === lib.length && differ === 0 && zero > 0,
    `S001: ${threw ? `threw: ${threw.slice(0, 120)}` : `the record ${done && done.couple ? done.couple.household : '-'}, the minimum pots ${js(floors)} against ${want}`}; the library: ${n} of ${lib.length} couples cut (${refused} refused), ${zero} with their minimum pot at nought, ${differ} whose table and model differ${first.length ? ` (${first.join('; ')})` : ''}`); }

// 9. a partner's own ceilings: the first person's wrapper for wrapper, as the limits card leaves them set back to free, one
// household; a partner's own ceiling that differs, today's route with the refusal named
{ const withLocks = part => ({ ...plan, solver: { ...(plan.solver || {}), locks: { pensionBefore: null, tierCeiling: { pen: null, isa: null }, lumpSum: 'free', tierCeilingPart: part } } });
  const run1 = async p => { let done = null, threw = ''; const job = C.startSolve(p, { ...light, parts: 1, couple: { engine: E } }); try { done = await job.done; } catch (e) { threw = e.message; } job.close(); return { done, threw }; };
  const same = await run1(withLocks({ pen: null, isa: null })), other = await run1(withLocks({ pen: 'Medium Risk', isa: null }));
  const r1 = same.done && same.done.couple ? same.done.couple : {}, r2 = other.done && other.done.couple ? other.done.couple : {};
  ok('9. a partner\'s own ceilings that are the first person\'s (both free, as the limits card leaves them set back) solve as one household; a partner\'s own pension ceiling that differs falls back to today\'s route, its record naming the household plan\'s refusal (the ceiling, applied to the partner\'s pension first, refused as its risk or as the limit)',
    !same.threw && r1.household === FORM && !r1.householdRefused && !other.threw && r2.household === null && /^householdPlanFor: /.test(r2.householdRefused || ''),
    `the same: ${same.threw ? `threw ${same.threw.slice(0, 100)}` : `household ${r1.household}${r1.householdRefused ? `, refused: ${r1.householdRefused.slice(0, 80)}` : ''}`}; a differing one: ${other.threw ? `threw ${other.threw.slice(0, 100)}` : `household ${r2.household}, refused: ${(r2.householdRefused || '-').slice(0, 80)}`}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
