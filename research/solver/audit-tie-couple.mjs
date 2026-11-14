/*
 * A COUPLE'S TIE RULE ABOVE THE ESTATE CAPS, STAGE A (TIE-C.md; D97 (2); EXPLORATORY, seed 7002, deciding nothing but by the
 * rule TIE-C.md commits). On the working branch's own code. One unit one couple of the couples' tier test's eight
 * (couples-panel-d4b.json at its landed target), solved once on the couples' candidate as the app solves a couple since D99
 * (audit-couples-share.mjs COUPLES_CANDIDATE, shareRule 'pots', 45 points, arm A's MPAA ages); its arms take those tables:
 *   CANDS  the candidate as it stands;   TIE5  with couple.js tieJoint 1e-5;   TIE4  with tieJoint 1e-4.
 * Each run by the engine on the same 8,000 paths of seed 7002. Stored for each path: survival, the year it failed, the pot
 * left, lifetime tax and the spending delivered; each person's table digest before the first arm and after the last; the
 * household's cap; and the replay on the first 100 paths (along CANDS's own path in the exact model, each decision before
 * the last year: TIE5's and TIE4's choices against CANDS's).
 * Units go to results/tie-couple-<seed>/ (TIEC_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-tie-couple.mjs reads them.
 *   node research/solver/audit-tie-couple.mjs part k/n      node research/solver/audit-tie-couple.mjs --units
 *   TIEC_PTS the points (smoke only); TIEC_N the paths (smoke only); TIEC_REPLAY the replay's paths (smoke only); TIEC_OUT
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
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
export const SEED = 7002, N = 8000, PTS = 45, W = 0.02, CHECK = 200, REPLAY = 100;
export const MARGINS = { CANDS: undefined, TIE5: 1e-5, TIE4: 1e-4 };
export const ARMS = Object.keys(MARGINS);
/* the couples' tier test's eight, the younger four first (their horizons the longest) */
export const COUPLES = ['S309F', 'S311F', 'S317F', 'S323F', 'S189', 'S293', 'S011', 'S083'];
export const STAMP_FILES = ['audit-tie-couple.mjs', 'reduce-tie-couple.mjs', 'TIE-C.md', 'batch-tie-couple.sh', 'audit-couples-share.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'couples-panel-d4b.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = id => `${id}.json.gz`;
const tiersOf = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' ');
const same = (a, b) => a.spendLevel === b.spendLevel && a.split === b.split && JSON.stringify(a.perOwner) === JSON.stringify(b.perOwner) && JSON.stringify(a.steps) === JSON.stringify(b.steps);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { COUPLES.forEach((id, k) => console.log(`${k} ${id}`)); console.log(COUPLES.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === COUPLES.length && pk >= 0 && pk < pn)) { console.error(`audit-tie-couple: part k/${COUPLES.length}`); process.exit(2); }
  const OUT = process.env.TIEC_OUT || join(HERE, 'results', `tie-couple-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.TIEC_PTS) || PTS, n = Number(process.env.TIEC_N) || N, nReplay = Math.min(n, Number(process.env.TIEC_REPLAY) || REPLAY);
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const id = COUPLES[pk], t0 = Date.now(), h = readPanel(PANEL_FILE).find(x => x.id === id);
  if (!h) { console.error(`audit-tie-couple: ${id} is not in the panel`); process.exit(2); }
  const candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`TIE-C (EXPLORATORY): unit ${pk}/${pn}: ${id} (${h.cohort}), seed ${SEED}, ${n} paths, the replay on ${nReplay}, ${pts} points, estate weight ${W}, the couples' candidate ${candidate}; node ${STAMP.node}`);
  const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const hp = solverPlan('CANDC', h.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now();
  const cps = Object.fromEntries(ARMS.map(arm => [arm, solveCouple(E, M, hp, { shareRule: 'pots', solveOne, ...(MARGINS[arm] !== undefined ? { tieJoint: MARGINS[arm] } : {}) })]));
  const solveSecs = (Date.now() - s0) / 1000, base = cps.CANDS;
  if (ARMS.some(arm => cps[arm].tables.self !== base.tables.self || cps[arm].tables.part !== base.tables.part)) { console.error(`audit-tie-couple: ${id}: an arm took other tables`); process.exit(3); }
  const digest = async () => ({ self: await digestOf(tablesOf(base.tables.self)), part: await digestOf(tablesOf(base.tables.part)) });
  const before = await digest();
  const cap = (base.tables.self.estateCap || 0) + (base.tables.part.estateCap || 0);
  console.log(`${''.padEnd(8)} solved: ${solveSecs.toFixed(0)} s; share ${base.share} ${base.meta.shareRule}; caps ${base.tables.self.estateCap} and ${base.tables.part.estateCap} | self: ${settingsOf(base.tables.self)} | part: ${settingsOf(base.tables.part)}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const arms = {}; let paths = null;
  for (const arm of ARMS) {
    const cp = cps[arm], ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp)), T = ctx.totalYears;
    if (!paths) { paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); paths.T = T; }
    if (T !== paths.T) { console.error(`audit-tie-couple: ${id} ${arm}: another horizon`); process.exit(3); }
    const A = { survived: new Uint8Array(n), failYear: new Int16Array(n), pot: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n) };
    const e0 = Date.now(); let bad = 0;
    paths.forEach((zs, k) => {
      const o = runPath(ctx, zs, false);
      A.survived[k] = o.survived ? 1 : 0; A.failYear[k] = o.failYear; A.pot[k] = o.wealth; A.tax[k] = o.tax; A.delivered[k] = o.delivered;
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-tie-couple: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const surv = 100 * A.survived.reduce((s, v) => s + v, 0) / n;
    arms[arm] = { margin: cp.tieJoint === undefined ? null : cp.tieJoint, metaMargin: cp.meta.tieJoint === undefined ? null : cp.meta.tieJoint, engineSecs: (Date.now() - e0) / 1000, T, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: margin ${cp.tieJoint === undefined ? 'off' : cp.tieJoint}; engine ${surv.toFixed(2)}% on ${n}; runPath the same as E.runTrial on the first ${Math.min(CHECK, n)} paths`);
  }
  // the replay: along CANDS's own path in the exact model, each decision before the last year, TIE5's and TIE4's choices
  const replay = { decisions: 0, above: 0, ...Object.fromEntries(['TIE5', 'TIE4'].map(arm => [arm, { differ: 0, level: 0, tiers: 0, below: 0, moreTax: 0 }])) };
  const taxOf = (cp, st, j, t) => { const s = M.cloneState(st), row = M.step(cp.m, s, j, t, null, true); return row.taxPaid + row.cgtPaid; };
  for (let k = 0; k < nReplay; k++) {
    const st = M.initialState(base.m), T = base.m.ctx.totalYears;
    for (let t = 0; t < T; t++) {
      const j0 = chooseJoint(base, st, t), ab = CPL.aboveCaps(base.tables, vecOf(base.tables.self.m, CPL.ownerState(st, 'self')), vecOf(base.tables.part.m, CPL.ownerState(st, 'part')));
      replay.decisions++; if (ab) replay.above++;
      for (const arm of ['TIE5', 'TIE4']) {
        const j = chooseJoint(cps[arm], st, t), r = replay[arm];
        if (same(j, j0)) continue;
        r.differ++;
        if (j.spendLevel !== j0.spendLevel) r.level++;
        if (tiersOf(j) !== tiersOf(j0)) r.tiers++;
        if (!ab) r.below++;
        if (taxOf(cps[arm], st, j, t) > taxOf(base, st, j0, t) + 1e-9) r.moreTax++;
      }
      const row = M.step(base.m, st, j0, t, CPL.ratesAt(base.m, paths[k], t));   // as runCouplePolicy steps a year
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
  }
  console.log(`${''.padEnd(8)} the replay on ${nReplay} paths: ${replay.decisions} decisions, ${replay.above} above both caps; ${['TIE5', 'TIE4'].map(arm => `${arm} differs at ${replay[arm].differ} (another level ${replay[arm].level}, another tier pair ${replay[arm].tiers}, at or below a cap ${replay[arm].below}; paying more tax that year ${replay[arm].moreTax})`).join('; ')}`);
  const after = await digest();
  writeFileSync(join(OUT, fileOf(id)), gzipSync(JSON.stringify({ k: pk, id, cohort: h.cohort, seed: SEED, N: n, nReplay, pts, W, candidate, cap, caps: [base.tables.self.estateCap, base.tables.part.estateCap], share: base.share, shareRule: base.meta.shareRule, digests: { before, after }, replay, stamp: STAMP, cpu: cpus()[0].model, solveSecs, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
