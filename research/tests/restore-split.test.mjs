/*
 * A RESTORED SOLVE, SPLIT ACROSS THE PAGE'S WORKERS (Part D, D5.6; research/solver/PART-D.md). A solve restored from the store
 * ran in the owner worker alone (solve.js refused a split restore), so the page kept no parts beside it and every figure's paths
 * ran in one worker: a returning single's, and a couple's whenever either person's table came from the store. Now every part
 * makes the same tables on the arena (src/solverPool.js), part 0 copies the stored record in, and the others follow it
 * (src/solverCache.js followRecord: no table crosses to them), so each part holds the restored solve and can run its share of
 * the paths, as a split solve's parts do. On S370 (a bridge, so the adaptive reference) at light settings, on Node's worker
 * threads with the page's own pool:
 *   1. the solve's record restored whole gives the solve's tables (the anchor: solver-cache.test.mjs holds it at full scale);
 *   2. restored split three ways, part 0's tables and each following part's (views of the same arena) are the whole restore's,
 *      bit for bit, and each part's solve is marked restored;
 *   3. the adaptive reference in every part: its arrays (the step thresholds by year among them) the whole restore's, bit for
 *      bit, and its counts the record's (part 0 alone carries them, so their sum across the parts is the record's);
 *   4. the strategy's figures from the three parts' shares of 120 paths, joined in path order, are the whole restore's on the
 *      same paths, bit for bit (the headline, the comparison, the bands: strategySummary);
 *   5. a dial position split two ways (each part solving its own base, the reference taken from it, step P1 (b)): its
 *      reference's counts the same as unsplit (before, every part carried the base's counts and the sum was twice them).
 * Plants (--planted runs each and wants its checks to fail): 'stale' (part 0 restores from a record with one cell of the last
 * year moved: 2; the figures on 120 paths pass, no path reaching that cell), 'noasty' (the following parts handed no step
 * thresholds: 3 and 4).
 * The full tier.
 *   node research/tests/restore-split.test.mjs [--planted]
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { cacheOf, followRecord } from '../../src/solverCache.js';
import { strategyRuns, joinRuns, strategySummary } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { refDigest, countsOf, atDial } from './restore-split-lib.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['stale', ['2']], ['noasty', ['3', '4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [SELF], { env: { ...process.env, RESTORE_SPLIT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANTED = process.env.RESTORE_SPLIT_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const WORKER = fileURLToPath(new URL('./restore-split-worker.mjs', import.meta.url));
const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S370').plan), SEED = 12345, N = 120, PARTS = 3;
const shares = parts => Array.from({ length: parts }, (_, k) => [Math.floor((k * N) / parts), Math.floor(((k + 1) * N) / parts)]);

const solved = solveForApp(E, M, plan, OPTS), rec = cacheOf(solved);
const whole = solveForApp(E, M, plan, { ...OPTS, restore: rec });
const wantTables = await digestOf(tablesOf(whole)), wantRef = refDigest(whole), wantCounts = countsOf(whole);

// 1. the anchor
{ const d = await digestOf(tablesOf(solved));
  ok('1. S370\'s record restored whole gives the solve\'s tables', d === wantTables && wholeRestored(), `${wantTables.slice(0, 16)} against ${d.slice(0, 16)}`); }
function wholeRestored() { return !!whole.meta.restored; }

// the record with one cell of the last year moved (plant 'stale': a record that is not this solve's)
function staleOf(r) {
  const L = r.layers[0][0], T = L.surv.length - 1, surv = L.surv.map(a => a.slice());
  surv[T][0] = surv[T][0] > 0.5 ? surv[T][0] - 0.25 : surv[T][0] + 0.25;
  return { ...r, layers: r.layers.map((ls, k) => ls.map((x, j) => (k === 0 && j === 0 ? { ...x, surv } : x))) };
}
async function restoreSplit() {
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const sh = shares(PARTS), got = [], ends = [];
  const follow = followRecord(rec);
  if (PLANTED === 'noasty' && follow.ref) follow.ref = { ...follow.ref, ASTY: {} };
  for (let part = 1; part < PARTS; part++) {
    const w = new Worker(WORKER, { workerData: { mode: 'restore', part, parts: PARTS, arena, plan, opts: OPTS, restore: follow, seed: SEED, from: sh[part][0], to: sh[part][1] } });
    ends.push(new Promise((resolve, reject) => {
      w.on('message', m => (m.error ? reject(new Error(m.error)) : got.push(m)));
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
      w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`))));
    }));
  }
  const pool = arenaPool(0, PARTS, arena);
  let r;
  try { r = solveForApp(E, M, plan, { ...OPTS, restore: PLANTED === 'stale' ? staleOf(rec) : rec, e2: pool }); } catch (e) { pool.fail(); await Promise.allSettled(ends); throw e; }
  const mine = { part: 0, tables: await digestOf(tablesOf(r)), ref: refDigest(r), counts: countsOf(r), restored: !!r.meta.restored, runs: strategyRuns(E, r, plan, { seed: SEED, from: sh[0][0], to: sh[0][1] }) };
  await Promise.all(ends);
  return { r, parts: [mine, ...got.sort((a, b) => a.part - b.part)] };
}
let split = null, why = '';
try { split = await restoreSplit(); } catch (e) { why = e.message; }
const P = split ? split.parts : [];

// 2. the tables in every part
ok(`2. restored split ${PARTS} ways: part 0's tables and each following part's the whole restore's, bit for bit, each marked restored`,
  P.length === PARTS && P.every(p => p.tables === wantTables && p.restored), split ? P.map(p => `part ${p.part} ${p.tables.slice(0, 12)}`).join(', ') + ` (whole ${wantTables.slice(0, 12)})` : `threw: ${why}`);

// 3. the reference in every part, and its counts
ok('3. the adaptive reference in every part: its arrays the whole restore\'s bit for bit, its counts the record\'s',
  P.length === PARTS && P.every(p => p.ref === wantRef && JSON.stringify(p.counts) === JSON.stringify(wantCounts)),
  split ? `${P.map(p => `part ${p.part} ${p.ref.slice(0, 12)} ${JSON.stringify(p.counts)}`).join('; ')} (whole ${wantRef.slice(0, 12)} ${JSON.stringify(wantCounts)})` : `threw: ${why}`);

// 4. the strategy's figures from the parts' shares
{ let same = false, extra = split ? '' : `threw: ${why}`;
  if (split) {
    const mineAll = strategySummary(E, whole, strategyRuns(E, whole, plan, { seed: SEED, from: 0, to: N }));
    let joined = null;
    try { joined = strategySummary(E, split.r, joinRuns(P.map(p => p.runs))); } catch (e) { extra = `refused: ${e.message}`; }
    same = !!joined && JSON.stringify(joined) === JSON.stringify(mineAll);
    if (joined) extra = `survival ${joined.headline.survival.toFixed(2)}% against ${mineAll.headline.survival.toFixed(2)}%; start ${joined.headline.startLevel} against ${mineAll.headline.startLevel}`;
  }
  ok(`4. the strategy's figures from the ${PARTS} parts' shares of ${N} paths, joined, are the whole restore's bit for bit`, same, extra); }

// 5. a dial position split: its reference's counts the same as unsplit
{ let extra = '', same = false;
  try {
    const base = solveForApp(E, M, atDial(plan, 1), OPTS), un = solveForApp(E, M, atDial(plan, 10), { ...OPTS, base });
    const arena = arenaFor(), got = [];
    const w = new Worker(WORKER, { workerData: { mode: 'position', part: 1, parts: 2, arena, plan, opts: OPTS } });
    const end = new Promise((resolve, reject) => {
      w.on('message', m => (m.error ? reject(new Error(m.error)) : got.push(m)));
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
      w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part 1 exited ${code}`))));
    });
    const pool = arenaPool(0, 2, arena);
    let sp;
    try { sp = solveForApp(E, M, atDial(plan, 10), { ...OPTS, base, e2: pool }); } catch (e) { pool.fail(); await Promise.allSettled([end]); throw e; }
    await end;
    const cu = countsOf(un), cs = countsOf(sp), tu = await digestOf(tablesOf(un)), ts = await digestOf(tablesOf(sp));
    same = !!cu && JSON.stringify(cs) === JSON.stringify(cu) && JSON.stringify(got[0].counts) === JSON.stringify(cu) && ts === tu && got[0].tables === tu;
    extra = `unsplit ${JSON.stringify(cu)}; split part 0 ${JSON.stringify(cs)}, part 1 ${JSON.stringify(got[0].counts)}; tables ${ts === tu && got[0].tables === tu ? 'the same' : 'differ'}`;
  } catch (e) { extra = `threw: ${e.message}`; }
  ok('5. a dial position split two ways: its reference\'s counts (and tables) the same as unsplit', same, extra); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
