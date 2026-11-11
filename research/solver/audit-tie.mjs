/*
 * THE TIE-BREAK ABOVE THE ESTATE CAP, AND ITEM 7'S SECOND READ, STAGE A (the review of 11 Nov, item 13:
 * research/reviews/2026-11-11/ANSWERS.md sections 2 and 3; D76; TIE-A.md; EXPLORATORY, seed 7002, deciding nothing but by
 * the rule TIE-A.md commits). Runs only on a scratch tree carrying the review's three prototypes on the ported code
 * (2026-11-09/prototype/shortlist.diff: SHORT; 2026-11-11/prototype/chooser-tie.diff: tieMargin with tieSame and tieAbove;
 * 2026-11-11/prototype/shortlist-slice.diff: SHORT.slice). One unit a household: the candidate solved once at 45 points
 * (solveForApp), then on those tables every arm on the same 16,000 paths of seed 7002, scored by the engine (solverStrategy
 * runPath): each path's survival, spending delivered and target, pot left and lifetime tax. Then the replay on the first
 * 100 paths: at each decision of a reference arm's own path, another arm's choice at that position.
 *   main    the eight arms of TIE-A.md (ARMS), the replays of arms 3 and 2 along arm 1's path and of the shortlist arms
 *           along their margin's whole-menu arm's path;
 *   remedy  (only if TIE-A.md's rule sends the run there) the tie-break where wealth is above 1.25 times the cap, on the
 *           whole menu and on the two shortlists with the slice, at the margin named (TIE_REMEDY_MARGIN), the household
 *           solved again (the reducer holds its tables' digest against the main unit's) and run on the same paths.
 * The tables are not touched by an arm (the switches are set on the solved plan after the solve): the unit records the
 * tables' digest before the first arm and after the last. Units go to results/tie-<seed>/ (TIE_OUT): case<k>.txt, the log,
 * stamped (fair-gate.mjs LOG_STAMP), and <id>-<mode>.json.gz. reduce-tie.mjs reads them.
 *   node research/solver/audit-tie.mjs part k/n [remedy]        node research/solver/audit-tie.mjs --units
 *   TIE_PTS the points (smoke only); TIE_N the paths (smoke only); TIE_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as SOLVE from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext, runPath, partsOf } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { HOUSEHOLDS, planOf, settingsOf } from './audit-speed.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 16000, PTS = 45, NREPLAY = 100, CAP_TIMES = 4, REMEDY_TIMES = 1.25;
export { HOUSEHOLDS };
export const UNITS = HOUSEHOLDS.map(id => ({ id }));
/*
 * The arms, by the review's names (chooser-tie.mjs): a width (whole, structure, order), then +slice, then +tieC@<margin>
 * (the tie-break among the moves at the best move's level and tier pair, only where wealth is above the cap; a margin in
 * score units: 1e-4 is 0.01 points of survival). 1 to 6 are ANSWERS.md's; 7 and 8 are the two shortlists with the slice
 * at the smaller margin, read only if the rule takes arm 2 (TIE-A.md).
 */
export const ARMS = { 1: 'whole', 2: 'whole+tieC@1e-5', 3: 'whole+tieC@1e-4', 4: 'structure+slice+tieC@1e-4', 5: 'order+slice+tieC@1e-4', 6: 'structure+tieC@1e-4', 7: 'structure+slice+tieC@1e-5', 8: 'order+slice+tieC@1e-5' };
/* the replays: [the arm whose own path is walked, the arms asked at each of its decisions] */
export const REPLAYS = [[1, [3, 2]], [3, [4, 5, 6]], [2, [7, 8]]];
export const remedyArms = m => ({ R1: `whole+tieC@${m}`, R4: `structure+slice+tieC@${m}`, R5: `order+slice+tieC@${m}` });
export const REMEDY_REPLAYS = [[1, ['R1']], ['R1', ['R4', 'R5']]];
export const STAMP_FILES = ['audit-tie.mjs', 'reduce-tie.mjs', 'TIE-A.md', 'audit-speed.mjs', 'stats.mjs', 'phase4-panel.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = (u, mode = 'main') => `${u.id}-${mode}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
/* an arm's switches (chooser-tie.mjs's setArm): the width on SHORT, the tie-break on the solved plan; `capAt` where the
   tie-break and the slice begin (the prototype keeps it on the solved plan as `_cap`; unset, the cap itself) */
export function setArm(arm, solved, capAt = undefined) {
  const S = SOLVE.SHORT;
  S.on = false; S.slice = false; solved.tieMargin = 0; solved.tieSame = false; solved.tieAbove = false; solved._cap = capAt;
  if (!arm) return;
  for (const part of arm.split('+')) {
    let mt;
    if (part === 'whole') continue;
    if (part === 'slice') { S.slice = true; continue; }
    if ((mt = /^tieC@(.+)$/.exec(part))) { solved.tieMargin = Number(mt[1]); solved.tieSame = true; solved.tieAbove = true; continue; }
    if (part !== 'structure' && part !== 'order') throw new Error(`audit-tie: not an arm's part: ${part}`);
    S.delta = null; S.levels = true; S.time = false; S.mode = part; S.layers = 'all'; S.on = true;
  }
}
/* what an arm ran, for the gate: the tie-break, the chooser's width, where it begins, then every other setting */
export const ranOf = (r, arm, capAt, cap) => {
  const tie = /tieC@([^+]+)/.exec(arm || ''), w = (arm || 'whole').split('+')[0];
  return `tie ${tie ? `above the cap, the best move's level and tier pair, within ${tie[1]}` : 'off'} | from ${capAt === undefined ? 1 : +(capAt / cap).toFixed(6)} times the cap | chooser ${w}${/\+slice/.test(arm || '') ? ' with the slice' : ''} | ${settingsOf(r)}`;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN], mode = args.includes('remedy') ? 'remedy' : 'main';
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-tie: part k/${UNITS.length} [remedy]`); process.exit(2); }
  if (!SOLVE.SHORT || !('slice' in SOLVE.SHORT)) { console.error('audit-tie: this tree has not the review\'s prototypes (SHORT, SHORT.slice): run it on the scratch tree (TIE-A.md)'); process.exit(2); }
  const remedyMargin = process.env.TIE_REMEDY_MARGIN || '';
  if (mode === 'remedy' && !/^1e-[45]$/.test(remedyMargin)) { console.error('audit-tie: the remedy needs TIE_REMEDY_MARGIN (1e-4 or 1e-5), the margin of the arm that failed part 4 or 5'); process.exit(2); }
  const OUT = process.env.TIE_OUT || join(HERE, 'results', `tie-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.TIE_PTS) || PTS, n = Number(process.env.TIE_N) || N, nRep = Math.min(NREPLAY, n);
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], id = u.id;
  console.log(`TIE-A (EXPLORATORY): unit ${pk}/${pn} ${mode}: ${id}, seed ${SEED}, ${n} paths, ${pts} points; node ${STAMP.node}`);
  const t0 = Date.now();
  const plan = planOf(id), inputs = hashOf(plan);
  const s0 = Date.now(), r = solveForApp(E, M, plan, { points: pts, research: light }), solveSecs = (Date.now() - s0) / 1000;
  const sc = solvedContext(E, r), T = sc.totalYears, paths = E.pathsForSeed(SEED, n, T);
  const opening = r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0), cap = CAP_TIMES * opening;
  // the cap as the solve's own estate term has it (the prototype's reading, right under the shape 'cap', D77)
  const capTerm = r.terminal.beqOf(1e18);
  const digest0 = await digestOf(tablesOf(r));
  console.log(`${id.padEnd(8)} case | unit ${pk} | years ${T + 1} | inputs ${inputs} | solve ${solveSecs.toFixed(0)} s | coarse ${r.meta.coarse ? (r.meta.coarse.off ? `off (${r.meta.coarse.off})` : 'on') : 'none'} | opening wealth ${Math.round(opening)}, the cap ${Math.round(cap)} (the estate term's ${Math.round(capTerm)}) | tables ${digest0.slice(0, 16)}`);
  const capAtOf = name => (String(name).startsWith('R') ? REMEDY_TIMES * capTerm : undefined);
  const armList = mode === 'main' ? ARMS : { 1: ARMS[1], ...remedyArms(remedyMargin) };
  // the chooser's tally at every decision of an arm's own paths: the tiers held, the re-wraps, the level (chooser-tie.mjs)
  const tally = { n: 0, pen: 0, isa: 0, harvest: 0, level: 0 };
  const base = sc.policyOverride;
  const ctxTally = { ...sc, policyOverride: { ...base, choose(st, t, held) {
    const f = base.choose(st, t, held);
    if (f && f.index !== undefined && t < T) { const p = partsOf(r.actions[f.index], r.c.acts[f.index]); tally.n++; tally.pen += p.tierPen || 0; tally.isa += p.tierIsa || 0; if (p.harvest && p.harvest !== 'none') tally.harvest++; tally.level += r.levelOf ? r.levelOf[f.index] : 1; }
    return f;
  } } };
  const arms = {};
  for (const [name, arm] of Object.entries(armList)) {
    const capAt = capAtOf(name), S = SOLVE.SHORT;
    setArm(arm, r, capAt); for (const zs of paths.slice(0, 3)) runPath(E, ctxTally, zs);   // warm the code paths before timing
    for (const k of Object.keys(tally)) tally[k] = 0; S.stats.sliced = 0; S.stats.slicedMoves = 0;
    const survived = new Uint8Array(n), delivered = new Float64Array(n), target = new Float64Array(n), pot = new Float64Array(n), tax = new Float64Array(n);
    setArm(arm, r, capAt); const e0 = process.hrtime.bigint();
    paths.forEach((zs, k) => { const o = runPath(E, ctxTally, zs); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; target[k] = o.target; pot[k] = o.terminalPot; tax[k] = o.lifetimeTax; });
    const ms = Number(process.hrtime.bigint() - e0) / 1e6 / n;
    arms[name] = { arm, ran: ranOf(r, arm, capAt, capTerm), inputs, ms, tally: { ...tally }, sliced: S.stats.sliced || 0, slicedMoves: S.stats.slicedMoves || 0, survived, delivered, target, pot, tax };
    setArm(null, r);
    console.log(`${''.padEnd(8)} ran ${name}: ${arms[name].ran}`);
    console.log(`${''.padEnd(8)} done ${name} (${arm}): a path ${ms.toFixed(2)} ms`);
  }
  // the replay: at each decision of the reference arm's own path, each asked arm's choice at the same position
  const replay = {};
  const wealthOf = st => Object.values(st.pots).reduce((x, v) => x + (v || 0), 0);
  for (const [ref, asked] of mode === 'main' ? REPLAYS : REMEDY_REPLAYS) {
    const R = Object.fromEntries(asked.map(a => [a, { ref: String(ref), decisions: 0, differ: 0, level: 0, pair: 0, atOrBelow: 0, moreTax: 0, above: 0 }]));
    const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
      setArm(armList[ref], r, capAtOf(ref)); const f = base.choose(st, t, held);
      if (t >= T || !f || f.index === undefined) { return f; }
      const w = wealthOf(st), txF = r._tx ? r._tx[f.index] : NaN;
      for (const a of asked) {
        const q = R[a], capAt = capAtOf(a) === undefined ? capTerm : capAtOf(a);
        setArm(armList[a], r, capAtOf(a)); const x = base.choose(st, t, held);
        q.decisions++; if (w > capAt) q.above++;
        if (x.index !== f.index) {
          q.differ++;
          const pf = partsOf(r.actions[f.index], r.c.acts[f.index]), px = partsOf(r.actions[x.index], r.c.acts[x.index]);
          if ((r.levelOf ? r.levelOf[f.index] : 1) !== (r.levelOf ? r.levelOf[x.index] : 1)) q.level++;
          if ((pf.tierPen || 0) !== (px.tierPen || 0) || (pf.tierIsa || 0) !== (px.tierIsa || 0)) q.pair++;
          if (!(w > capAt)) q.atOrBelow++;
          if (r._tx && r._tx[x.index] > txF + 1e-6) q.moreTax++;
        }
      }
      setArm(armList[ref], r, capAtOf(ref));
      return f;
    } } };
    for (let i = 0; i < nRep; i++) runPath(E, ctx, paths[i]);
    setArm(null, r);
    for (const a of asked) { const q = R[a]; replay[a] = q; console.log(`${''.padEnd(8)} replay ${a} along ${ref}'s path: ${q.decisions} decisions (${q.above} with wealth above where the tie-break begins), a different move at ${q.differ}: at another level ${q.level}, at another tier pair ${q.pair}, with wealth at or below the cap ${q.atOrBelow}, with more tax that year ${q.moreTax}`); }
  }
  const digest1 = await digestOf(tablesOf(r));
  console.log(`${''.padEnd(8)} the tables after the arms: ${digest1 === digest0 ? 'the same' : 'CHANGED'} (${digest1.slice(0, 16)})`);
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u, mode)), gzipSync(JSON.stringify({ k: pk, id, mode, seed: SEED, N: n, pts, inputs, stamp: STAMP, cpu: cpus()[0].model, solveSecs, opening, cap, capTerm, digest0, digest1, replay, remedyMargin: mode === 'remedy' ? remedyMargin : null,
    coarse: r.meta.coarse ? (r.meta.coarse.off ? 'off' : 'on') : 'none',
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { arm: x.arm, ran: x.ran, inputs: x.inputs, ms: x.ms, tally: x.tally, sliced: x.sliced, slicedMoves: x.slicedMoves,
      survived: b64(x.survived), delivered: b64(x.delivered), target: b64(x.target), pot: b64(x.pot), tax: b64(x.tax) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
