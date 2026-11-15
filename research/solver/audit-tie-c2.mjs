/*
 * A BETTER TIE RULE FOR COUPLES ABOVE THEIR ESTATE CAPS (TIE-C2.md, its rule committed before any build; D105; EXPLORATORY,
 * seed 7001, deciding nothing but by the rule TIE-C2.md commits). One unit one couple of the couples' re-run panel
 * (couples-panel-d4b.json at its landed target): eight of the younger cohort and four of the library's, none in TIE-C.md, the
 * couples' tier test or SPEED-B.md. Each solved once on the couples' candidate as the app solves a couple since D99
 * (audit-couples-share.mjs COUPLES_CANDIDATE, shareRule 'pots', 45 points, arm A's MPAA ages); its arms take those tables:
 *   CANDS     the candidate as it stands;
 *   HOLD      with the hold (couple.js holdPast 2: a person past twice their table's wealth top never steps down in risk);
 *   LOOKHOLD  with the first rule's tie set at the singles' margin (tieJoint 1e-4), the forward look (tieLook) and the hold;
 *   TIE4      beside the rule, deciding nothing: the first rule at the same margin.
 * Each run by the engine on the same 8,000 paths of seed 7001 (runPath, held to E.runTrial on the first 200). Stored for each
 * path and arm: survival, the year it failed, the pot left, lifetime tax and the spending delivered; each person's table digest
 * before the first arm and after the last; the household's cap, each person's cap and table top; each arm's options read back
 * from the fields the chooser reads, and its engine time. The replays on the first 100 paths, in the exact model:
 *   along CANDS's own path, at each decision before the last year, each arm's choice at CANDS's state against CANDS's: the
 *   decisions that differ, at another spending level, and outside what the arm allows (HOLD: CANDS's move with each step down
 *   of a person past the limit put back; LOOKHOLD: the same of a member of its tie set; TIE4: a member of its tie set);
 *   along each arm's own path: the decisions where a person past the limit steps down (HOLD and LOOKHOLD: by construction
 *   none), the years each person spends past the limit, the decisions the hold changes and the look changes the pick, and
 *   the years at another spending level or tier pair than CANDS's path in the same year.
 * Units go to results/tie-c2-<seed>/ (TIEC2_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and <id>.json.gz.
 * reduce-tie-c2.mjs reads them.
 *   node research/solver/audit-tie-c2.mjs part k/n      node research/solver/audit-tie-c2.mjs --units
 *   TIEC2_PTS the points (smoke only); TIEC2_N the paths (smoke only); TIEC2_REPLAY the replays' paths (smoke only); TIEC2_OUT
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { TIER_ORDER } from '../../src/solver/fast.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { PANEL_FILE, solverPlan } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple, chooseJoint } = CPL;
export const SEED = 7001, N = 8000, PTS = 45, W = 0.02, CHECK = 200, REPLAY = 100, LIMIT = 2, MARGIN = 1e-4;
export const OPTS = { CANDS: {}, HOLD: { holdPast: LIMIT }, LOOKHOLD: { tieJoint: MARGIN, tieLook: true, holdPast: LIMIT }, TIE4: { tieJoint: MARGIN } };
export const ARMS = Object.keys(OPTS), OTHERS = ARMS.filter(a => a !== 'CANDS');
/* the twelve: the younger cohort's eight first (their horizons the longest), then the library's four */
export const COUPLES = ['S327F', 'S329F', 'S331F', 'S333F', 'S335F', 'S337F', 'S341F', 'S343F', 'S149', 'S167', 'S205', 'S223'];
export const STAMP_FILES = ['audit-tie-c2.mjs', 'reduce-tie-c2.mjs', 'TIE-C2.md', 'batch-tie-c2.sh', 'audit-couples-share.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'couples-panel-d4b.json', 'stats.mjs', 'paired-exact.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = id => `${id}.json.gz`;
/* each arm's options as the chooser reads them (cp's fields) and as the couple's record carries them (meta) */
export const optionsOf = cp => ({ tieJoint: cp.tieJoint ?? null, tieLook: cp.tieLook ?? null, holdPast: cp.holdPast ?? null, meta: { tieJoint: cp.meta.tieJoint ?? null, tieLook: cp.meta.tieLook ?? null, holdPast: cp.meta.holdPast ?? null } });
export const wantOptions = arm => ({ tieJoint: OPTS[arm].tieJoint ?? null, tieLook: OPTS[arm].tieLook ?? null, holdPast: OPTS[arm].holdPast ?? null });
const js = x => JSON.stringify(x);
const tiersOf = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' ');
const same = (a, b) => a.spendLevel === b.spendLevel && a.split === b.split && js(a.perOwner) === js(b.perOwner) && js(a.steps) === js(b.steps);
// the audit's own reading of the hold, written apart from couple.js holdMove: each person past LIMIT times their table's top,
// each wrapper the move steps down to less risk (a larger place in TIER_ORDER) put back to the tier held
const wealthOf = (cp, st, w) => { const s = vecOf(cp.tables[w].m, CPL.ownerState(st, w)); return s[0] + s[1] + s[2]; };
const pastOf = (cp, st, w) => wealthOf(cp, st, w) > LIMIT * cp.tables[w].g.axes.W.hi;
const place = (cp, w, cat, k) => TIER_ORDER.indexOf(cp.tables[w].c.tiers[cat][k] ? cp.tables[w].c.tiers[cat][k].name : null);
const heldOf = (st, w) => (st.tierHeld && st.tierHeld[w] ? st.tierHeld[w] : { pen: 0, isa: 0 });
function heldBack(cp, st, j) {
  const o = JSON.parse(js(j));
  for (const w of ['self', 'part']) {
    if (!pastOf(cp, st, w)) continue;
    const h = heldOf(st, w);
    for (const [cat, key] of [['pen', 'tierPen'], ['isa', 'tierIsa']]) {
      const from = h[cat] || 0, to = o.perOwner[w][key] || 0;
      if (to !== from && place(cp, w, cat, to) >= 0 && place(cp, w, cat, from) >= 0 && place(cp, w, cat, to) > place(cp, w, cat, from)) o.perOwner[w][key] = from;
    }
    if ('tierPenName' in o.perOwner[w]) { o.perOwner[w].tierPenName = cp.tables[w].c.tiers.pen[o.perOwner[w].tierPen || 0].name; o.perOwner[w].tierIsaName = cp.tables[w].c.tiers.isa[o.perOwner[w].tierIsa || 0].name; }
  }
  return o;
}
const stepsDownPast = (cp, st, j) => ['self', 'part'].reduce((n, w) => {
  if (!pastOf(cp, st, w)) return n;
  const h = heldOf(st, w);
  return n + [['pen', 'tierPen'], ['isa', 'tierIsa']].filter(([cat, key]) => { const from = h[cat] || 0, to = j.perOwner[w][key] || 0; return to !== from && place(cp, w, cat, to) > place(cp, w, cat, from); }).length;
}, 0);
// the tie set as TIE-C.md's rule draws it (couple.js tiePick's filter): the best and the moves at its level and each person's
// tier pair within the margin
const tieSetOf = (out) => (out.tie && out.best ? [out.best, ...out.tie.filter(c => c.joint !== out.best.joint && c.score >= out.best.score - MARGIN && c.joint.spendLevel === out.best.joint.spendLevel && tiersOf(c.joint) === tiersOf(out.best.joint))] : null);
// the money of a move, the tiers aside (the hold changes the tiers alone)
const sameMoney = (a, b) => a.spendLevel === b.spendLevel && a.split === b.split && js(a.steps) === js(b.steps) && ['self', 'part'].every(w => js({ ...a.perOwner[w], tierPen: 0, tierIsa: 0, tierPenName: 0, tierIsaName: 0 }) === js({ ...b.perOwner[w], tierPen: 0, tierIsa: 0, tierPenName: 0, tierIsaName: 0 }));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { COUPLES.forEach((id, k) => console.log(`${k} ${id}`)); console.log(COUPLES.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === COUPLES.length && pk >= 0 && pk < pn)) { console.error(`audit-tie-c2: part k/${COUPLES.length}`); process.exit(2); }
  const OUT = process.env.TIEC2_OUT || join(HERE, 'results', `tie-c2-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.TIEC2_PTS) || PTS, n = Number(process.env.TIEC2_N) || N, nReplay = Math.min(n, Number(process.env.TIEC2_REPLAY) || REPLAY);
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const id = COUPLES[pk], t0 = Date.now(), h = readPanel(PANEL_FILE).find(x => x.id === id);
  if (!h) { console.error(`audit-tie-c2: ${id} is not in the panel`); process.exit(2); }
  const candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`TIE-C2 (EXPLORATORY): unit ${pk}/${pn}: ${id} (${h.cohort}), seed ${SEED}, ${n} paths, the replays on ${nReplay}, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}; node ${STAMP.node}`);
  const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const hp = solverPlan('CANDC', h.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now();
  const cps = Object.fromEntries(ARMS.map(arm => [arm, solveCouple(E, M, hp, { shareRule: 'pots', solveOne, ...OPTS[arm] })]));
  const solveSecs = (Date.now() - s0) / 1000, base = cps.CANDS;
  if (ARMS.some(arm => cps[arm].tables.self !== base.tables.self || cps[arm].tables.part !== base.tables.part)) { console.error(`audit-tie-c2: ${id}: an arm took other tables`); process.exit(3); }
  for (const arm of ARMS) { const o = optionsOf(cps[arm]), w = wantOptions(arm); if (js({ tieJoint: o.tieJoint, tieLook: o.tieLook, holdPast: o.holdPast }) !== js(w) || js(o.meta) !== js(w)) { console.error(`audit-tie-c2: ${id} ${arm}: the options read back ${js(o)}, not ${js(w)}`); process.exit(3); } }
  const digest = async () => ({ self: await digestOf(tablesOf(base.tables.self)), part: await digestOf(tablesOf(base.tables.part)) });
  const before = await digest();
  const caps = [base.tables.self.estateCap || 0, base.tables.part.estateCap || 0], cap = caps[0] + caps[1], tops = [base.tables.self.g.axes.W.hi, base.tables.part.g.axes.W.hi];
  console.log(`${''.padEnd(8)} solved: ${solveSecs.toFixed(0)} s; share ${base.share} ${base.meta.shareRule}; caps ${caps.join(' and ')}; the tables' tops ${tops.map(v => Math.round(v)).join(' and ')} | self: ${settingsOf(base.tables.self)} | part: ${settingsOf(base.tables.part)}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const arms = {}; let paths = null;
  for (const arm of ARMS) {
    const cp = cps[arm], ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp)), T = ctx.totalYears;
    if (!paths) { paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); paths.T = T; }
    if (T !== paths.T) { console.error(`audit-tie-c2: ${id} ${arm}: another horizon`); process.exit(3); }
    const A = { survived: new Uint8Array(n), failYear: new Int16Array(n), pot: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n) };
    const e0 = Date.now(); let bad = 0;
    paths.forEach((zs, k) => {
      const o = runPath(ctx, zs, false);
      A.survived[k] = o.survived ? 1 : 0; A.failYear[k] = o.failYear; A.pot[k] = o.wealth; A.tax[k] = o.tax; A.delivered[k] = o.delivered;
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-tie-c2: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const surv = 100 * A.survived.reduce((s, v) => s + v, 0) / n;
    arms[arm] = { options: optionsOf(cp), engineSecs: (Date.now() - e0) / 1000, T, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: ${js(wantOptions(arm))}; engine ${surv.toFixed(2)}% on ${n} in ${arms[arm].engineSecs.toFixed(0)} s; runPath the same as E.runTrial on the first ${Math.min(CHECK, n)} paths`);
  }
  // the replays, in the exact model on the first nReplay paths, as runCouplePolicy steps a year
  const T = base.m.ctx.totalYears;
  const along = { decisions: 0, above: 0, past: [0, 0], ...Object.fromEntries(OTHERS.map(arm => [arm, { differ: 0, level: 0, outside: 0, first: null }])) };
  const own = Object.fromEntries(ARMS.map(arm => [arm, { decisions: 0, stepDownPast: 0, pastYears: [0, 0], holdActs: 0, lookChanged: 0, otherLevel: 0, otherTiers: 0 }]));
  const candsMoves = [];
  for (let k = 0; k < nReplay; k++) {
    const st = M.initialState(base.m), mine = [];
    for (let t = 0; t <= T; t++) {
      const j0 = chooseJoint(base, st, t);
      mine.push(j0);
      if (t < T) {
        along.decisions++;
        const sA = vecOf(base.tables.self.m, CPL.ownerState(st, 'self')), sB = vecOf(base.tables.part.m, CPL.ownerState(st, 'part'));
        if (CPL.aboveCaps(base.tables, sA, sB)) along.above++;
        ['self', 'part'].forEach((w, i) => { if (pastOf(base, st, w)) along.past[i]++; });
        for (const arm of OTHERS) {
          const out = {}, j = chooseJoint(cps[arm], st, t, out), r = along[arm];
          if (same(j, j0)) continue;
          r.differ++;
          if (j.spendLevel !== j0.spendLevel) r.level++;
          const set = tieSetOf(out);
          const allowed = arm === 'HOLD' ? same(j, heldBack(base, st, j0))
            : arm === 'LOOKHOLD' ? (set ? set.some(c => same(j, heldBack(base, st, c.joint))) : same(j, heldBack(base, st, j0)))
              : (set ? set.some(c => same(j, c.joint)) : false);
          if (!allowed) { r.outside++; if (!r.first) r.first = `path ${k}, plan year ${t}: ${tiersOf(j)} level ${j.spendLevel} against CANDS's ${tiersOf(j0)} level ${j0.spendLevel}`; }
        }
      }
      const row = M.step(base.m, st, j0, t, CPL.ratesAt(base.m, paths[k], t));
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
    candsMoves.push(mine);
  }
  for (const arm of ARMS) {
    const cp = cps[arm], r = own[arm];
    for (let k = 0; k < nReplay; k++) {
      const st = M.initialState(base.m);
      for (let t = 0; t <= T; t++) {
        const out = {}, j = chooseJoint(cp, st, t, out);
        if (t < T) {
          r.decisions++;
          ['self', 'part'].forEach((w, i) => { if (pastOf(base, st, w)) r.pastYears[i]++; });
          r.stepDownPast += stepsDownPast(base, st, j) > 0 ? 1 : 0;
          // the hold changes the tiers alone, and the tie set shares the best's tiers: it acted where the move's tiers are not the best's
          if (cp.holdPast > 0 && out.best && tiersOf(j) !== tiersOf(out.best.joint)) r.holdActs++;
          // the look changed the pick where the move's money (the tiers aside) is not the best's
          if (cp.tieLook && out.best && tieSetOf(out) && !sameMoney(j, out.best.joint)) r.lookChanged++;
          const c = candsMoves[k][t];
          if (c) { if (c.spendLevel !== j.spendLevel) r.otherLevel++; if (tiersOf(c) !== tiersOf(j)) r.otherTiers++; }
        }
        const row = M.step(base.m, st, j, t, CPL.ratesAt(base.m, paths[k], t));
        if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
      }
    }
  }
  console.log(`${''.padEnd(8)} the replays on ${nReplay} paths: along CANDS's path ${along.decisions} decisions, ${along.above} above both caps, the first person past the limit at ${along.past[0]} and the partner at ${along.past[1]}; ${OTHERS.map(arm => `${arm} differs at ${along[arm].differ} (another level ${along[arm].level}, outside what it allows ${along[arm].outside})`).join('; ')}`);
  console.log(`${''.padEnd(8)} along each arm's own path: ${ARMS.map(arm => `${arm} a step down past the limit at ${own[arm].stepDownPast} of ${own[arm].decisions}, the hold acting at ${own[arm].holdActs}, the look changing the pick at ${own[arm].lookChanged}, another level than CANDS's path ${own[arm].otherLevel} and tier pair ${own[arm].otherTiers}`).join('; ')}`);
  const after = await digest();
  writeFileSync(join(OUT, fileOf(id)), gzipSync(JSON.stringify({ k: pk, id, cohort: h.cohort, seed: SEED, N: n, nReplay, pts, W, limit: LIMIT, margin: MARGIN, candidate, cap, caps, tops, share: base.share, shareRule: base.meta.shareRule, digests: { before, after }, along, own, stamp: STAMP, cpu: cpus()[0].model, solveSecs, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
