/*
 * THE P REDUCER: THE SWITCH CHARGED IN BOTH PASSES (predictions/diag-P.md; PLAN.md P). Reads results/diagP/case*.txt
 * (batch-P.sh: audit-s126.mjs diagP, 38 jobs) beside 7ae's, 7ad's, 7af's and 7ag's records, each read only through its own
 * reducer's gate (7ae's through 7aa's, 7ac's and 7ad's; 7af's through 7aa's; 7ag's beside 7af's). Every arm the items read is P's own, on the
 * same 16,000 node paths; 7ae is the identity reference for settings 0 and 1e-3.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) and 7aa's, 7ac's, 7ad's, 7ae's and 7af's own gates;
 *   - every registered job once and done: core, one a unit and setting (7ae's three units at 30x5; settings P, 0 and 1e-3),
 *     grid (bridge 4 and S194 at 30x15 and 60x5, P), open (the 25 households 7af and 7ag read, the bundle's unit, P); each tag with its
 *     solve, ran, gap, joint, moves, price and three world lines, and a core tag its node line;
 *   - the ran line is its reference's, its path count this run's, with the settings named at its end: core P 7ae's margin-0
 *     ran line and " switchCharge 0.001"; core 0 and 1e-3 7ae's ran lines at those margins; grid 7ad's TS+J ran line at that
 *     grid and open 7af's or 7ag's CAND ran line, each with " switchMargin 0 switchCharge 0.001"; the joint line says the margin
 *     (0.001 at 1e-3, else 0) and the charge (0 but at P), a joint solve, no pension death charge (the scorer has none:
 *     O53), the reference's scale and cap;
 *   - SETTINGS 0 AND 1E-3 ARE 7AE'S SOLVES: their tables, gaps, openings, moves, prices and world lines are 7ae's, and on the
 *     node's first 8,000 paths their TS+J and OPEN0 runs' survival is 7ae's traces', path by path (the code changed: the
 *     charge option; the path count doubled);
 *   - the moves: the opening holds the plan's tiers, STAY keeps them, the chosen move is BEST at margin 0 (at 1e-3 BEST where
 *     it leaves, STAY where it keeps), BEST equals STAY where the gap is 0 and leaves where it is above 0; the price: where
 *     the gap is above 0 the mixture's uncharged price is
 *     the gap plus the charge (x100) and the like-for-like sum is the mixture's; where the gap is 0 the like-for-like price
 *     is 0 and the mixture's at most the charge; the world lines sum to the price line;
 *   - the node: the registered paths at world 0's node (7ae's), OPEN0 holding the plan's tiers on every path, TS+J as its
 *     chosen move says, WA run at P and 0 and not at 1e-3; every trace's count, seed, arm, stamp and survival the log's.
 * THE ITEMS, by the registered rule (the pooled interval is 7ae's: the per-path sums over the three units, their shared
 * paths counted, 95%):
 *   1. OPEN0 under P is near OPEN0 at margin 0, not fallen back toward 1e-3: pooled OPEN0/P less OPEN0/M0. HELD if the
 *      lower end is above -M1; FALSIFIED if the upper end is below -M1; else INCONCLUSIVE. M1 = 0.35, half 7ae's pooled
 *      OPEN0 shift from 1e-3 to 0 (+0.713).
 *   2. TS+J under P is near TS+J at 1e-3, not fallen as at margin 0: pooled TS+J/P less TS+J/1e-3. HELD if the lower end
 *      is above -M2; FALSIFIED if the upper end is below -M2; else INCONCLUSIVE. M2 = 0.23, half 7ae's pooled TS+J fall
 *      (-0.462).
 *   3. No re-risk churn under P (O50): the moves to a riskier tier a path (a lower tier code, the path alive), summed over
 *      the three units, TS+J/P less TS+J/1e-3, paired. H3 = half TS+J/M0's excess over TS+J/1e-3 (this run's). HELD if the
 *      upper end is below H3; FALSIFIED if the lower end is above H3; else INCONCLUSIVE (and INCONCLUSIVE if margin 0's excess
 *      is not above 0 by its own interval: nothing to separate).
 *   4. O50's split, the world-blind chooser: WA/M0 (world 0's table alone chooses, the margin-0 tables) less TS+J/1e-3 on
 *      the same measure. HELD (the world-blind chooser carries margin 0's churn) if the upper end is below H3; FALSIFIED if
 *      the lower end is above H3; else INCONCLUSIVE (and as item 3 where there is nothing to separate).
 *   5. P's opening does not flip with the grid: on bridge 4 and on S194, the chosen year-0 tiers at 30x5, 30x15 and 60x5 are
 *      one. HELD if so on both; FALSIFIED if not on both; else INCONCLUSIVE.
 * Reported, not items: every core unit's lines and survival against 7ae's arms; the pooled price / realised ratio at P
 * beside margin 0's (cause 3 predicts it unchanged); the churn table (switches and riskier moves a path, every rule); WA/P,
 * the 2x2's fourth cell; the openings on 7af's sixteen against the bundle's, with share 0.95's registered branch for the Q
 * decision; the solve seconds at P and at 0 (gate 5's record).
 *   node research/solver/reduce-P.mjs [dirP] [dir7ae] [dir7ad] [dir7ac] [dir7aa] [dir7af] [dir7ag] > research/solver/results-P.txt
 *   node research/solver/reduce-P.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import * as C from './reduce-7ac.mjs';
import * as D from './reduce-7ad.mjs';
import * as E from './reduce-7ae.mjs';
import * as F from './reduce-7af.mjs';
import * as G from './reduce-7ag.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-P.md';
export const { LAMBDA, field } = A;
export const N = 16000, WN = 16000, SEED = '7002', CHARGE = '0.001', Z95 = 1.959963984540054;
// the margins: half 7ae's own pooled shifts from 1e-3 to 0 (OPEN0 +0.713, TS+J -0.462; results-7ae.txt; derive-P.mjs)
export const M1 = 0.35, M2 = 0.23;
export const { PRICE_TOL, LFL_TOL, SIM_TOL, WTOL } = D;
export const CORE = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02'], ['S126', 'READER', '0']];
export const GRIDS = [['bridge 4', 'READER', '0', '30x15'], ['S194', 'OFF', '0.02', '30x15'], ['bridge 4', 'READER', '0', '60x5'], ['S194', 'OFF', '0.02', '60x5']];
export const OPENS = [...F.PANEL, ...G.PANEL].map(([id]) => id);
export const SETTINGS = ['P', '0', '1e-3'];
export const JOBS = [...SETTINGS.flatMap(m => CORE.map(([id, a, w]) => [`core:${m}`, id, a, w, '30x5'])), ...GRIDS.map(([id, a, w, g]) => ['grid', id, a, w, g]), ...OPENS.map(id => ['open', id, 'READER', '0.02', '30x5'])];
export const RULES = { P: ['TS+J', 'OPEN0', 'WA'], 0: ['TS+J', 'OPEN0', 'WA'], '1e-3': ['TS+J', 'OPEN0'] };
const isCore = kind => kind.startsWith('core:');
const tagsOf = kind => (isCore(kind) ? [kind.slice(5)] : ['P']);
const jobKey = (kind, id, a, w, g) => `${kind} ${id} ${a}/${g}/W${w}`;

const CASEL = /^(\S.*?)\s+case \| job (core:\S+|grid|open) (\S+?)\/(\d+x\d+)\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+) points (\d+) quad (\d+)$/;
const LBL = '(\\S+?)\\/TS\\+J\\/M(\\S+?)\\/(\\d+x\\d+)\\/W(\\S+)';
const SOLVEL = new RegExp(`^\\s+solve ${LBL}: table (\\S+) secs (\\S+)$`);
const RANL = new RegExp(`^\\s+ran ${LBL}: (.*)$`);
const GAPL = new RegExp(`^\\s+gap ${LBL}: (\\S+) opening (\\d+),(\\d+)$`);
const JOINTL = new RegExp(`^\\s+joint ${LBL}: (true|false) switchMargin (\\S+) switchCharge (\\S+) scale (\\S+) cap (\\S+) deathTax (\\S+) tier (\\S+) riskAbove (\\S+)$`);
const MOVESL = new RegExp(`^\\s+moves ${LBL}: best (\\d+) (\\d+)\\/(\\d+) stay (\\d+) (\\d+)\\/(\\d+) chosen (\\d+) (\\d+)\\/(\\d+) held (\\d+)\\/(\\d+)$`);
const PRICEL = new RegExp(`^\\s+price ${LBL}: mixture (\\S+) like-for-like whole (\\S+) survival (\\S+)$`);
const WORLDL = new RegExp(`^\\s+world ${LBL} (\\d+) z (\\S+) weight (\\S+): whole (\\S+) survival (\\S+)$`);
const NODEL = new RegExp(`^\\s+node ${LBL} 0 z (\\S+): sim TS\\+J (\\S+) OPEN0 (\\S+) WA (\\S+) held0 TS\\+J (\\d+) OPEN0 (\\d+) WA (\\d+|-) paths (\\d+) secs (\\S+)$`);
const orNull = x => (x === '-' ? null : +x);

export function parse(text) {
  const jobs = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { kind: m[2], id: m[1].trim(), arm: m[3], grid: m[4], w: m[5], lambda: m[6], tier: m[7], riskAbove: m[8], mix: m[9], points: +m[10], quad: +m[11], tags: {}, dup: [], done: false }; jobs.push(cur); continue; }
    if (!cur) continue;
    const T = (a, mg, g, w) => (a === cur.arm && g === cur.grid && w === cur.w ? (cur.tags[mg] || (cur.tags[mg] = { worlds: [] })) : null);
    const set = (t, k, v, name) => { if (t[k] !== undefined) cur.dup.push(name); t[k] = v; };
    let t;
    if ((m = SOLVEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'table', m[5], `solve M${m[2]}`); t.secs = +m[6]; continue; }
    if ((m = RANL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'ran', m[5], `ran M${m[2]}`); continue; }
    if ((m = GAPL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'gap', { gap: m[5], open1e3: +m[6], open0: +m[7] }, `gap M${m[2]}`); continue; }
    if ((m = JOINTL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'joint', { joint: m[5] === 'true', margin: m[6], charge: m[7], scale: +m[8], cap: +m[9], deathTax: +m[10], tier: m[11], decided: m[12] }, `joint M${m[2]}`); continue; }
    if ((m = MOVESL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'moves', { best: +m[5], bestTier: [+m[6], +m[7]], stay: +m[8], stayTier: [+m[9], +m[10]], chosen: +m[11], chosenTier: [+m[12], +m[13]], held: [+m[14], +m[15]] }, `moves M${m[2]}`); continue; }
    if ((m = PRICEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'price', { mixture: +m[5], whole: +m[6], surv: +m[7] }, `price M${m[2]}`); continue; }
    if ((m = WORLDL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { if (t.worlds[+m[5]]) cur.dup.push(`world M${m[2]} ${m[5]}`); t.worlds[+m[5]] = { z: +m[6], w: +m[7], whole: +m[8], surv: +m[9] }; continue; }
    if ((m = NODEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'node', { z: +m[5], sim: { 'TS+J': +m[6], OPEN0: +m[7], WA: orNull(m[8]) }, held0: { 'TS+J': +m[9], OPEN0: +m[10], WA: orNull(m[11]) }, paths: +m[12] }, `node M${m[2]}`); continue; }
    if (line.trim() === `done ${cur.kind} ${cur.arm}/${cur.grid}/W${cur.w}`) { cur.done = true; continue; }
  }
  return jobs;
}

/* the reference a job's lines are held to: `R.e(id, arm, w)` 7ae's parsed job (reduce-7ae.mjs parse); `R.ad(id, arm, w, grid)`
   7ad's parsed TS+J tag at that grid (reduce-7ad.mjs parse); `R.af(id)` 7af's or 7ag's parsed CAND unit (reduce-7aa.mjs parse) */
function refOf(j, R) {
  if (isCore(j.kind)) { const m = j.kind.slice(5), e = R.e(j.id, j.arm, j.w), t = e && e.tags[m === 'P' ? '0' : m]; return t ? { ran: t.ran, joint: t.joint, e: m === 'P' ? null : t, z: t.node ? t.node.z : null } : null; }
  if (j.kind === 'grid') { const t = R.ad(j.id, j.arm, j.w, j.grid); return t ? { ran: t.ran, joint: t.joint } : null; }
  const u = R.af(j.id); return u ? { ran: u.ran, joint: u.joint } : null;
}
const withPaths = (ran, n) => ran.replace(/(^| )paths \d+(?= |$)/, `$1paths ${n}`);
const sameArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sameMoves = (a, b) => !!a && !!b && a.best === b.best && a.stay === b.stay && a.chosen === b.chosen && sameArr(a.bestTier, b.bestTier) && sameArr(a.stayTier, b.stayTier) && sameArr(a.chosenTier, b.chosenTier) && sameArr(a.held, b.held);
export const keeps = (t, held) => t[0] === held[0] && t[1] === held[1];
export const leaves = u => !!u.moves && !keeps(u.moves.chosenTier, u.moves.held);

/* P's gate. `n` the solve's paths, `wn` the node's, `pts` the wealth points every job ran at (the preflight's 4; else each
   job's grid's). */
export function gate(jobs, R, { n = N, wn = WN, pts = null } = {}) {
  const bad = [];
  for (const [kind, id, a, w, g] of JOBS) { const k = jobs.filter(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.grid === g).length; if (k !== 1) bad.push(`${jobKey(kind, id, a, w, g)}: ${k} job lines, not 1`); }
  for (const j of jobs) {
    const tagJ = jobKey(j.kind, j.id, j.arm, j.w, j.grid), core = isCore(j.kind);
    if (!JOBS.some(([kind, id, a, w, g]) => kind === j.kind && id === j.id && a === j.arm && w === j.w && g === j.grid)) { bad.push(`${tagJ}: not a registered job`); continue; }
    if (j.dup.length) bad.push(`${tagJ}: lines given twice: ${j.dup.join(', ')}`);
    if (j.lambda !== LAMBDA || j.tier !== 'own' || j.riskAbove !== 'auto' || j.mix !== '3') bad.push(`${tagJ}: job line settings ${j.lambda} ${j.tier} ${j.riskAbove} ${j.mix}`);
    const [gp, gq] = j.grid.split('x').map(Number);
    if (j.points !== (pts ? Number(pts) : gp) || j.quad !== gq) bad.push(`${tagJ}: ran at ${j.points} points and ${j.quad} return points, not ${pts || gp}x${gq}`);
    const want = tagsOf(j.kind);
    for (const mg of Object.keys(j.tags)) if (!want.includes(mg)) bad.push(`${tagJ}: an unregistered setting M${mg}`);
    const ref = refOf(j, R);
    if (!ref) bad.push(`${tagJ}: no reference to compare with (${core ? '7ae' : j.kind === 'grid' ? '7ad' : '7af or 7ag'})`);
    for (const mg of want) {
      const u = j.tags[mg], L = `${tagJ} M${mg}`;
      if (!u) { bad.push(`${L}: no lines`); continue; }
      if (u.table === undefined) bad.push(`${L}: no solve line`);
      if (!u.ran) bad.push(`${L}: no ran line`);
      else if (ref) {
        const base = withPaths(ref.ran, n), wantRan = core ? (mg === 'P' ? `${base} switchCharge ${CHARGE}` : base) : `${base} switchMargin 0 switchCharge ${CHARGE}`;
        if (u.ran !== wantRan) bad.push(`${L}: its ran line is not its reference's with the settings at its end`);
      }
      if (!u.joint) bad.push(`${L}: no joint line`);
      else {
        if (!u.joint.joint) bad.push(`${L}: TS+J solved per world`);
        if (u.joint.margin !== (mg === '1e-3' ? '0.001' : '0')) bad.push(`${L}: solved at margin ${u.joint.margin}`);
        if (u.joint.charge !== (mg === 'P' ? CHARGE : '0')) bad.push(`${L}: solved with the charge ${u.joint.charge}`);
        if (u.joint.deathTax !== 0) bad.push(`${L}: a pension death charge ${u.joint.deathTax} (the scorer has none: O53)`);
        if (ref && (!ref.joint || u.joint.scale !== ref.joint.scale || u.joint.cap !== ref.joint.cap)) bad.push(`${L}: scale or cap not its reference's`);
      }
      if (!u.gap) bad.push(`${L}: no gap line`);
      if (!u.moves) bad.push(`${L}: no moves line`);
      else {
        const M = u.moves;
        if (M.held[0] !== 0 || M.held[1] !== 0) bad.push(`${L}: the opening holds ${M.held.join('/')}, not the plan's tiers`);
        if (!keeps(M.stayTier, M.held)) bad.push(`${L}: its STAY move leaves the held tiers`);
        if (mg !== '1e-3' && M.chosen !== M.best) bad.push(`${L}: its chosen move is not BEST (margin 0)`);
        if (mg === '1e-3' && M.chosen !== (keeps(M.chosenTier, M.held) ? M.stay : M.best)) bad.push(`${L}: its chosen move is neither BEST where it leaves the held tiers nor STAY where it keeps them`);
        if (u.gap && u.gap.gap === '0' && M.best !== M.stay) bad.push(`${L}: BEST and STAY differ where the gap is 0`);
        if (u.gap && u.gap.gap !== '0' && keeps(M.bestTier, M.held)) bad.push(`${L}: BEST keeps the held tiers where the gap is ${u.gap.gap}`);
      }
      if (!u.price) bad.push(`${L}: no price line`);
      else if (u.gap) {
        const g = Number(u.gap.gap), c = mg === 'P' ? Number(CHARGE) : 0;
        if (u.gap.gap === '0') {
          if (u.price.whole !== 0 || u.price.surv !== 0) bad.push(`${L}: a like-for-like price where the gap is 0`);
          if (!(u.price.mixture / 100 <= c + 1e-12)) bad.push(`${L}: the mixture's price ${u.price.mixture} is above the charge where the gap is 0`);
        } else if (!(g > 0)) bad.push(`${L}: the gap ${u.gap.gap}`);
        else {
          if (!(Math.abs(u.price.mixture / 100 - (g + c)) <= PRICE_TOL * g)) bad.push(`${L}: the mixture's price ${u.price.mixture} is not the gap ${u.gap.gap} plus the charge (x100)`);
          if (!(Math.abs(u.price.whole - u.price.mixture) <= LFL_TOL * Math.abs(u.price.mixture) + 1e-12)) bad.push(`${L}: the like-for-like prices' weighted sum ${u.price.whole} is not the mixture's price ${u.price.mixture}`);
        }
      }
      if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k])) bad.push(`${L}: world lines ${u.worlds.filter(Boolean).length}, not 3`);
      else if (u.price) {
        const sum = f => u.worlds.reduce((t, x) => t + x.w * x[f], 0), tol = f => WTOL * u.worlds.reduce((t, x) => t + Math.abs(x[f]), 0) + 3e-6;
        if (!(Math.abs(sum('whole') - u.price.whole) <= tol('whole')) || !(Math.abs(sum('surv') - u.price.surv) <= tol('surv'))) bad.push(`${L}: the world lines do not sum to the price line`);
      }
      // settings 0 and 1e-3 are 7ae's solves, to their printed figures
      if (mg !== 'P' && ref && ref.e) {
        const e = ref.e;
        if (u.table !== e.table) bad.push(`${L}: its table ${u.table}, 7ae's ${e.table}`);
        if (!u.gap || !e.gap || u.gap.gap !== e.gap.gap || u.gap.open1e3 !== e.gap.open1e3 || u.gap.open0 !== e.gap.open0) bad.push(`${L}: its gap and openings are not 7ae's`);
        if (!sameMoves(u.moves, e.moves)) bad.push(`${L}: its moves are not 7ae's`);
        if (!u.price || !e.price || u.price.mixture !== e.price.mixture || u.price.whole !== e.price.whole || u.price.surv !== e.price.surv) bad.push(`${L}: its price is not 7ae's`);
        if ([0, 1, 2].some(k => !u.worlds[k] || !e.worlds[k] || ['z', 'w', 'whole', 'surv'].some(f => u.worlds[k][f] !== e.worlds[k][f]))) bad.push(`${L}: its world lines are not 7ae's`);
      }
      if (!core) { if (u.node) bad.push(`${L}: a node line on a ${j.kind} job`); continue; }
      const nd = u.node;
      if (!nd) { bad.push(`${L}: no node line`); continue; }
      if (nd.paths !== wn) bad.push(`${L}: the node ran ${nd.paths} paths, not ${wn}`);
      if (u.worlds[0] && Math.abs(nd.z - u.worlds[0].z) > 1e-4) bad.push(`${L}: the node at z ${nd.z}, world 0's node ${u.worlds[0].z}`);
      if (ref && ref.z !== null && nd.z !== ref.z) bad.push(`${L}: the node at z ${nd.z}, 7ae's at ${ref.z}`);
      const lv = u.moves ? leaves(u) : null;
      if (nd.held0.OPEN0 !== nd.paths) bad.push(`${L}: OPEN0 kept the held tiers on ${nd.held0.OPEN0} of ${nd.paths} paths`);
      if (lv !== null && nd.held0['TS+J'] !== (lv ? 0 : nd.paths)) bad.push(`${L}: TS+J kept the held tiers on ${nd.held0['TS+J']} of ${nd.paths} paths, its chosen move ${lv ? 'leaving' : 'keeping'} them`);
      if (mg === '1e-3' ? nd.sim.WA !== null || nd.held0.WA !== null : nd.sim.WA === null || nd.held0.WA === null || nd.held0.WA < 0 || nd.held0.WA > nd.paths) bad.push(`${L}: WA ${mg === '1e-3' ? 'run at 1e-3' : `missing or keeping the held tiers on ${nd.held0.WA} of ${nd.paths} paths`}`);
    }
    if (!j.done) bad.push(`${tagJ}: no done line`);
  }
  return bad;
}

export const traceName = (id, arm, m, rule, w) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-m${m.toLowerCase()}-${rule.toLowerCase().replace(/\+/g, '_')}-world0@w${w}.json.gz`;
export const traceAgrees = (j, ST, arm, m, rule, w, sim, count) => !!(j && ST && j.stamp && j.N === count && String(j.seed) === SEED && j.arm === `${arm}/${rule}/M${m}/W${w}/world0` && ['code', 'audit', 'prediction', 'sha'].every(x => j.stamp[x] === ST[x]) && Math.abs(j.sim - sim) <= SIM_TOL);
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every core node run's trace against its log; at settings 0 and 1e-3 the TS+J and OPEN0 traces' first paths
   (as many as 7ae ran) against 7ae's (`TRE`, 7ae's gated traces by `${id}|${m}|${rule}`), path by path. `bad` gains every
   refusal. Returns the decoded traces by `${id}|${m}|${rule}`. */
export function loadTraces(jobs, DIR, ST, bad, TRE, wn = WN) {
  const TR = {};
  for (const j of jobs) {
    if (!isCore(j.kind)) continue;
    const mg = j.kind.slice(5), u = j.tags[mg];
    for (const rule of RULES[mg]) {
      const f = join(DIR, traceName(j.id, j.arm, mg, rule, j.w));
      if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
      const t = readTrace(f);
      if (!traceAgrees(t, ST, j.arm, mg, rule, j.w, u.node.sim[rule], wn)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
      const T = decode(t);
      if (mg !== 'P' && rule !== 'WA') {
        const R7 = TRE && TRE[`${j.id}|${mg}|${rule}`];
        if (!R7) bad.push(`${f}: no 7ae ${rule}/M${mg} trace to check it against`);
        else if (R7.N > wn || !E.sameFirst(T.survived, R7.survived, R7.N)) bad.push(`${f}: its first ${R7.N} paths' survival is not 7ae's ${rule}/M${mg}, path by path`);
      }
      TR[`${j.id}|${mg}|${rule}`] = T;
    }
  }
  return TR;
}

/* THE MEASURES. A path's switches and moves to a riskier tier (a lower tier code: tierPen * 4 + tierIsa), years 1 to Y - 1,
   counted only while the path is alive (a failed path's later bytes are 0, which is not a move). */
export function churn(T) {
  const sw = new Int16Array(T.N), rr = new Int16Array(T.N);
  for (let i = 0; i < T.N; i++) {
    const f = T.failYear[i];
    for (let y = 1; y < T.Y; y++) {
      if (f !== -1 && f <= y) break;
      const a = T.tier[i * T.Y + y - 1], b = T.tier[i * T.Y + y];
      if (a !== b) { sw[i]++; if (b < a) rr[i]++; }
    }
  }
  return { sw, rr };
}
/* the paired mean difference of per-path sums over units (`xs[u][i]` against `ys[u][i]`), with its 95% interval */
export function pairedSum(xs, ys) {
  const n = xs[0].length; if ([...xs, ...ys].some(a => a.length !== n)) throw new Error('pairedSum: arrays of different lengths');
  let s = 0, s2 = 0;
  for (let i = 0; i < n; i++) { let d = 0; for (let u = 0; u < xs.length; u++) d += xs[u][i] - ys[u][i]; s += d; s2 += d * d; }
  const d = s / n, se = Math.sqrt(Math.max(0, (s2 / n - d * d) / n));
  return { d, se, lo: d - Z95 * se, hi: d + Z95 * se };
}
const sumMean = xs => { const n = xs[0].length; let s = 0; for (const a of xs) for (let i = 0; i < n; i++) s += a[i]; return s / n; };
/* survival, paired: `a` against `b` (b less a), the diff array for 7ae's pooled() */
export const pair = (a, b) => { const k = cells(a, b), diff = new Int8Array(a.length); for (let i = 0; i < a.length; i++) diff[i] = b[i] - a[i]; return { ...k, diff }; };

const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
/* THE ITEMS, over pure inputs so the planted set can reach them:
   S(rule, m)[u] - unit u's survived bits (rules TS+J, OPEN0, WA; settings P, 0, 1e-3), R(rule, m)[u] its riskier moves a path,
   openings[unit] - P's chosen year-0 tiers by grid ({ '30x5': [p, i], ... }) */
export function items(S, R, openings) {
  const out = [];
  const pooledOf = (ra, ma, rb, mb) => E.pooled(S(ra, ma).map((a, u) => pair(a, S(rb, mb)[u])));
  { const p = pooledOf('OPEN0', '0', 'OPEN0', 'P');
    out.push({ n: 1, text: `OPEN0 under P against OPEN0 at margin 0, pooled: the lower end above -${M1} (FALSIFIED: the upper end below -${M1})`, pooled: p, outcome: tri(p.lo > -M1, p.hi < -M1) }); }
  { const p = pooledOf('TS+J', '1e-3', 'TS+J', 'P');
    out.push({ n: 2, text: `TS+J under P against TS+J at 1e-3, pooled: the lower end above -${M2} (FALSIFIED: the upper end below -${M2})`, pooled: p, outcome: tri(p.lo > -M2, p.hi < -M2) }); }
  const ex = pairedSum(R('TS+J', '0'), R('TS+J', '1e-3')), H3 = ex.d / 2, sep = ex.lo > 0;
  { const p = pairedSum(R('TS+J', 'P'), R('TS+J', '1e-3'));
    out.push({ n: 3, text: 'no re-risk churn under P: riskier moves a path summed over the units, TS+J/P less TS+J/1e-3, the upper end below H3, half margin 0\'s excess (FALSIFIED: the lower end above H3)', pooled: p, excess: ex, H3, measured: sep, outcome: sep ? tri(p.hi < H3, p.lo > H3) : 'INCONCLUSIVE' }); }
  { const p = pairedSum(R('WA', '0'), R('TS+J', '1e-3'));
    out.push({ n: 4, text: 'O50\'s split: the world-aware chooser at margin 0 (WA/M0) less TS+J/1e-3 on the same measure, the upper end below H3 (the world-blind chooser carries margin 0\'s churn; FALSIFIED: the lower end above H3)', pooled: p, excess: ex, H3, measured: sep, outcome: sep ? tri(p.hi < H3, p.lo > H3) : 'INCONCLUSIVE' }); }
  { const legs = Object.entries(openings).map(([id, o]) => { const g = Object.values(o); return { id, o, same: g.length === 3 && g.every(x => sameArr(x, g[0])) }; });
    out.push({ n: 5, text: 'P\'s opening does not flip with the grid: the chosen year-0 tiers at 30x5, 30x15 and 60x5 one on bridge 4 and on S194 (FALSIFIED: not one on both)', legs, outcome: legs.length !== 2 ? 'INCONCLUSIVE' : tri(legs.every(l => l.same), legs.every(l => !l.same)) }); }
  return out;
}

/* the Q branch (registered; the deep review of 29 Sep 08:56 UK, decision 2): share 0.95's opening under P */
export const qBranch = open => (open === null ? 'not measured' : open ? 'P leaves the plan\'s tiers on share 0.95 at year 0, as margin 0 and Q do: Q\'s year-0 de-risk is P\'s to take; the bundle/+Q/+O36-fix 2x2 is not triggered by this read (the maintainer decides Q)'
  : 'P keeps the plan\'s tiers on share 0.95 at year 0: the bundle/+Q/+O36-fix 2x2 is triggered before 7u (the deep review\'s decision 2; the maintainer decides Q)');

const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const iv = p => `${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`;
/* THE READING, after every gate has passed. `TR` P's traces, `af(id)` the bundle's parsed unit (7af's or 7ag's) */
export function reading(jobs, TR, af, out = console.log, wn = WN) {
  const J = (kind, id, g = '30x5') => jobs.find(j => j.kind === kind && j.id === id && j.grid === g);
  const tag = (id, m) => J(`core:${m}`, id).tags[m];
  const tr = (id, m, rule) => TR[`${id}|${m}|${rule}`];
  const S = (rule, m) => CORE.map(([id]) => tr(id, m, rule).survived);
  const CH = {}; const chOf = (id, m, rule) => CH[`${id}|${m}|${rule}`] || (CH[`${id}|${m}|${rule}`] = churn(tr(id, m, rule)));
  const R = (rule, m) => CORE.map(([id]) => chOf(id, m, rule).rr);
  const openings = Object.fromEntries(['bridge 4', 'S194'].map(id => [id, Object.fromEntries(['30x5', '30x15', '60x5'].map(g => { const j = J(g === '30x5' ? 'core:P' : 'grid', id, g); return [g, j.tags.P.moves.chosenTier]; }))]));
  const IT = items(S, R, openings);
  out(`P: THE SWITCH CHARGED IN BOTH PASSES (switchCharge ${CHARGE}, switchMargin 0) - DOES THE UNCHARGED MARGIN CARRY FAMILIES 1 AND 2? (predictions/diag-P.md; ${N} paths of seed ${SEED}, ${wn} at world 0's node; the fair-test gates passed: the stamps, 7aa's, 7ac's, 7ad's, 7ae's and 7af's own gates, settings 0 and 1e-3 as 7ae's solves to their printed lines and on 7ae's node paths path by path)`);
  out('\nTHE CORE UNITS AT 30x5: the table, the year-0 gap on top of the charge, the opening, world 0\'s survival price of the opening, and at world 0\'s node each rule\'s survival');
  for (const [id, arm, w] of CORE) for (const m of ['1e-3', '0', 'P']) {
    const u = tag(id, m), sims = `TS+J ${u.node.sim['TS+J'].toFixed(2)} OPEN0 ${u.node.sim.OPEN0.toFixed(2)}${u.node.sim.WA === null ? '' : ` WA ${u.node.sim.WA.toFixed(2)}`}`;
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} M${m}`.padEnd(28)} table ${u.table} gap ${u.gap.gap} (opening ${u.moves.chosenTier.join('/')}) | price ${u.worlds[0].surv.toFixed(3)} | node ${sims} | solve ${Math.round(u.secs)} s`);
  }
  out('\nPAIRED AT THE NODE, every unit (saved/lost, the survival difference in points, the 95% interval)');
  for (const [id] of CORE) for (const [ra, ma, rb, mb] of [['OPEN0', '0', 'OPEN0', 'P'], ['TS+J', '1e-3', 'TS+J', 'P'], ['TS+J', '0', 'TS+J', 'P'], ['OPEN0', 'P', 'TS+J', 'P'], ['TS+J', '0', 'WA', '0'], ['TS+J', 'P', 'WA', 'P']]) {
    const k = pair(tr(id, ma, ra).survived, tr(id, mb, rb).survived), p = E.pooled([k]);
    out(`  ${id.padEnd(9)} ${`${rb}/${mb} against ${ra}/${ma}`.padEnd(30)} ${k.saved}/${k.lost} ${iv(p)}`);
  }
  out('\nTHE CHURN AT THE NODE: switches and moves to a riskier tier a path (the path alive), by rule and setting');
  for (const [id] of CORE) {
    const row = [['TS+J', '1e-3'], ['TS+J', '0'], ['TS+J', 'P'], ['OPEN0', '1e-3'], ['OPEN0', '0'], ['OPEN0', 'P'], ['WA', '0'], ['WA', 'P']].map(([rule, m]) => { const c = chOf(id, m, rule), n = c.sw.length; let a = 0, b = 0; for (let i = 0; i < n; i++) { a += c.sw[i]; b += c.rr[i]; } return `${rule}/${m} ${(a / n).toFixed(2)}/${(b / n).toFixed(2)}`; });
    out(`  ${id.padEnd(9)} ${row.join('  ')}`);
  }
  out(`  summed over the units, riskier moves a path: TS+J/1e-3 ${sumMean(R('TS+J', '1e-3')).toFixed(3)} TS+J/0 ${sumMean(R('TS+J', '0')).toFixed(3)} TS+J/P ${sumMean(R('TS+J', 'P')).toFixed(3)} WA/0 ${sumMean(R('WA', '0')).toFixed(3)} WA/P ${sumMean(R('WA', 'P')).toFixed(3)}`);
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const it of IT) {
    out(`${it.n}. ${it.text}: ${it.outcome}`);
    if (it.n <= 2) out(`     pooled ${iv(it.pooled)}`);
    if (it.n === 3 || it.n === 4) out(`     ${iv(it.pooled)} against H3 ${it.H3.toFixed(3)} (margin 0's excess ${iv(it.excess)}${it.measured ? '' : ': not above 0, nothing to separate'})`);
    if (it.n === 5) for (const l of it.legs) out(`     ${l.id}: ${Object.entries(l.o).map(([g, t]) => `${g} ${t.join('/')}`).join(', ')}${l.same ? '' : ' - flips'}`);
  }
  // REPORTED: the ratio at P beside margin 0's
  { const at = m => { const sp = CORE.reduce((t, [id]) => t + tag(id, m).worlds[0].surv, 0), pl = E.pooled(CORE.map(([id]) => pair(tr(id, m, 'OPEN0').survived, tr(id, m, 'TS+J').survived))); return { sp, pl, ratio: pl.d > 0 ? sp / pl.d : NaN }; };
    const a = at('0'), b = at('P');
    out(`\nREPORTED: the pooled price / realised ratio (Σ world-0 survival price of the opening against Σ TS+J less OPEN0 at the node): margin 0 ${a.sp.toFixed(3)} / ${iv(a.pl)} = ${a.ratio.toFixed(3)}; P ${b.sp.toFixed(3)} / ${iv(b.pl)} = ${b.ratio.toFixed(3)}. Cause 3 (the share and gain axes) predicts P's within 0.10 of margin 0's: ${Number.isFinite(b.ratio) && Math.abs(b.ratio - a.ratio) <= 0.10 ? 'it is' : 'it is not'}`); }
  // REPORTED: the openings on 7af's sixteen
  out('\nREPORTED: THE OPENINGS ON THE 25 HOUSEHOLDS 7AF AND 7AG READ (the bundle\'s unit, READER/TS+J/W0.02): P\'s gap on top of the charge and its chosen year-0 tiers, against the bundle\'s (7af\'s or 7ag\'s: the gap at 1e-3, the pension tier chosen at 1e-3 and at margin 0 on its tables)');
  let q = null;
  for (const id of OPENS) {
    const u = J('open', id).tags.P, f = af(id), lv = leaves(u);
    if (id === 'share 0.95') q = lv;
    out(`  ${id.padEnd(12)} P gap ${u.gap.gap.padEnd(10)} opening ${u.moves.chosenTier.join('/')} ${lv ? 'leaves' : 'keeps '} | bundle gap ${f.gap.gap} opening ${f.gap.open1e3},${f.gap.open0} | solve ${Math.round(u.secs)} s`);
  }
  out(`  share 0.95, the registered branch: ${qBranch(q)}`);
  out(`\nOUTCOME: ${IT.map(i => `${i.n} ${i.outcome}`).join(', ')}`);
  return IT;
}

/* THE PLANTED CHECKS (rule 6): the gate over a built log and references, one fault at a time; the measures and the items
   over built arrays */
const B = (n, k) => { const a = new Uint8Array(n); for (let i = 0; i < k; i++) a[i] = 1; return a; };
function built(o = {}) {
  const pts = o.pts || null, lines = [], R = { e: () => null, ad: () => null, af: () => null }, E0 = {}, AD = {}, AF = {};
  const P = '                ';
  const ranOf = (id, g, w) => `mix 3 pts ${g.split('x')[0]} seed 7002 paths ${N} grid total${g.split('x')[0]}x6x6 lambda ${LAMBDA} levels 1 quad ${g.split('x')[1]} tierState 0/0,1/1,2/2 bequestWeight ${w} finalIntegral true bridgeRead x ${id.replace(/ /g, '')}`;
  for (const [kind, id, a, w, g] of JOBS) {
    if (o.skip === jobKey(kind, id, a, w, g)) continue;
    const [gp, gq] = g.split('x'), start = lines.length, core = isCore(kind), one = kind === 'open' && id === 'S360';   // 'one': the job a single-job plant bends
    lines.push(`${id.padEnd(16)} case | job ${kind} ${a}/${g}/W${w} | lambda ${o.lambda || LAMBDA} tier own riskAbove auto mix 3 points ${pts || gp} quad ${gq}`);
    const base = ranOf(id, g, w), scale = 1000, cap = 4000;
    const refRan = core && kind !== 'core:1e-3' ? `${base} switchMargin 0` : base;
    for (const mg of tagsOf(kind)) {
      const L = `${a}/TS+J/M${mg}/${g}/W${w}`, gap = mg === 'P' ? (o.gapZero === id ? '0' : '5.0000e-4') : '8.0000e-4', leaveT = gap === '0' ? '0/0' : '2/2';
      const c = mg === 'P' ? 0.001 : 0, g0 = Number(gap), mix = gap === '0' ? 5e-4 : 100 * (g0 + (o.noChargePrice && one ? 0 : c)), lfl = gap === '0' ? 0 : mix, lflW = o.lflOff && one ? lfl * 1.1 : lfl;
      const x = { table: mg === 'P' ? '99.1000' : '99.2000', ran: mg === 'P' ? (core ? `${refRan} switchCharge ${CHARGE}` : `${refRan} switchMargin 0 switchCharge ${CHARGE}`) : refRan };
      if (o.ranTail && mg === 'P' && core) x.ran += ' minPot 1';
      if (!(o.noSolve && one)) lines.push(`${P} solve ${L}: table ${x.table} secs 700`);
      lines.push(`${P} ran ${L}: ${x.ran}`);
      if (!(o.noGap && mg === 'P' && kind === 'grid')) lines.push(`${P} gap ${L}: ${gap} opening ${gap === '0' ? '0,0' : (o.flip && g === '60x5' ? '1,1' : '2,2')}`);
      lines.push(`${P} joint ${L}: ${o.perWorld ? 'false' : 'true'} switchMargin ${o.margin && mg === 'P' ? o.margin : mg === '1e-3' ? (o.margin3 || '0.001') : '0'} switchCharge ${mg === 'P' ? (o.charge || CHARGE) : (o.charge0 || '0')} scale ${o.scale && kind === 'open' ? scale + 1 : scale} cap ${cap} deathTax ${o.death && kind === 'open' ? 0.4 : 0} tier own riskAbove off`);
      const bt = gap === '0' ? '0/0' : (o.flip && g === '60x5' ? '1/1' : '2/2'), bi = gap === '0' ? 3 : 7;
      lines.push(`${P} moves ${L}: best ${bi} ${bt} stay ${o.stayLeaves && mg === 'P' ? '4 1/1' : o.held && one ? '3 1/1' : '3 0/0'} chosen ${o.chosenStay && one && gap !== '0' ? '3 0/0' : `${bi} ${bt}`} held ${o.held && one ? '1/1' : '0/0'}`);
      const mx = o.price && mg === 'P' ? mix * 1.5 : mix;
      lines.push(`${P} price ${L}: mixture ${mx.toExponential(6)} like-for-like whole ${lflW.toExponential(6)} survival ${lfl === 0 ? (0).toExponential(6) : (lfl / 2).toExponential(6)}`);
      const ws = [[-1.7321, 1 / 6], [0, 2 / 3], [1.7321, 1 / 6]];
      ws.forEach(([z, wt], k) => { if (!(o.noWorld && one && k === 1)) lines.push(`${P} world ${L} ${k} z ${z.toFixed(4)} weight ${wt.toFixed(4)}: whole ${(o.worldOff && one && k === 0 ? lfl * 2 : lflW).toFixed(6)} survival ${(lfl / 2).toFixed(6)}`); });
      if (core && !(o.noNode && mg === 'P')) {
        const wa = mg === '1e-3' && !o.wa3 ? ['-', '-'] : ['97.5000', '3'], np = o.nodePaths && mg === 'P' ? o.nodePaths : WN;
        lines.push(`${P} node ${L} 0 z ${mg === 'P' && o.nodeZ ? o.nodeZ : '-1.7321'}: sim TS+J 98.0000 OPEN0 97.0000 WA ${wa[0]} held0 TS+J ${o.tsjHeld && mg === 'P' ? 5 : 0} OPEN0 ${o.open0Held && mg === 'P' ? np - 1 : np} WA ${wa[1]} paths ${np} secs 100`);
      }
      if (core && mg !== 'P') (E0[id] || (E0[id] = {}))[mg] = { table: x.table, ran: refRan, gap: { gap, open1e3: 2, open0: 2 }, joint: { scale, cap }, moves: { best: bi, bestTier: bt.split('/').map(Number), stay: 3, stayTier: [0, 0], chosen: bi, chosenTier: bt.split('/').map(Number), held: [0, 0] }, price: { mixture: +mx.toExponential(6), whole: +lfl.toExponential(6), surv: +(lfl / 2).toExponential(6) }, worlds: ws.map(([z, wt]) => ({ z: +z.toFixed(4), w: +wt.toFixed(4), whole: +lfl.toFixed(6), surv: +(lfl / 2).toFixed(6) })), node: { z: -1.7321 } };
      if (core && mg !== 'P' && o.table0 === mg) E0[id][mg].table = '99.3000';
    }
    if (kind === 'grid') AD[`${id}|${g}`] = { ran: base, joint: { scale, cap } };
    if (kind === 'open') AF[id] = { ran: base, joint: { scale, cap } };
    if (!(o.noDone && kind === 'open')) lines.push(`${P} done ${kind} ${a}/${g}/W${w}`);
    if (o.twice && one) lines.push(...lines.slice(start));
  }
  if (o.extra) lines.push('S999             case | job open READER/30x5/W0.02 | lambda x tier own riskAbove auto mix 3 points 30 quad 5');
  R.e = (id, arm, w) => (E0[id] ? { tags: E0[id] } : null);
  R.ad = (id, arm, w, g) => AD[`${id}|${g}`] || null;
  R.af = id => (o.noAf === id ? null : AF[id] || null);
  return { text: lines.join('\n'), R };
}
export function planted() {
  const cases = [];
  const refused = (o, pts) => { const b = built(o); return String(gate(parse(b.text), b.R, pts ? { pts } : {}).length > 0); };
  { const b = built(); const bad = gate(parse(b.text), b.R); cases.push(['a built log parsed and gated: every job, the gate passes', `${parse(b.text).length} ${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, `${JOBS.length} 0`]); }
  cases.push(['the gate refuses a missing job', refused({ skip: jobKey(...JOBS[20]) }), 'true']);
  cases.push(['the gate refuses a missing solve line', refused({ noSolve: true }), 'true']);
  cases.push(['the gate refuses a job run twice', refused({ twice: true }), 'true']);
  cases.push(['the gate refuses an unregistered job', refused({ extra: true }), 'true']);
  cases.push(['the gate refuses other job settings (lambda)', refused({ lambda: '0.05' }), 'true']);
  cases.push(['the gate refuses a job at other points than its grid', refused({ pts: '4' }), 'true']);
  cases.push(['the gate takes the preflight\'s points where it is told them', refused({ pts: '4' }, '4'), 'false']);
  cases.push(['the gate refuses a ran line with more at its end', refused({ ranTail: true }), 'true']);
  cases.push(['the gate refuses a missing reference (7af)', refused({ noAf: 'S360' }), 'true']);
  cases.push(['the gate refuses a missing gap line', refused({ noGap: true }), 'true']);
  cases.push(['the gate refuses a joint line at margin 0.001', refused({ margin: '0.001' }), 'true']);
  cases.push(['the gate refuses P without its charge', refused({ charge: '0' }), 'true']);
  cases.push(['the gate refuses setting 0 with a charge', refused({ charge0: '0.001' }), 'true']);
  cases.push(['the gate refuses a per-world solve', refused({ perWorld: true }), 'true']);
  cases.push(['the gate refuses a pension death charge (O53)', refused({ death: true }), 'true']);
  cases.push(['the gate refuses a scale not the reference\'s', refused({ scale: true }), 'true']);
  cases.push(['the gate refuses setting 0 whose table is not 7ae\'s', refused({ table0: '0' }), 'true']);
  cases.push(['the gate refuses setting 1e-3 whose table is not 7ae\'s', refused({ table0: '1e-3' }), 'true']);
  cases.push(['the gate refuses setting 1e-3 solved at margin 0', refused({ margin3: '0' }), 'true']);
  cases.push(['the gate refuses a WA run at 1e-3', refused({ wa3: true }), 'true']);
  cases.push(['the gate refuses an opening holding other than the plan\'s tiers', refused({ held: true }), 'true']);
  cases.push(['the gate refuses a STAY move leaving the held tiers', refused({ stayLeaves: true }), 'true']);
  cases.push(['the gate refuses a chosen move that is not BEST', refused({ chosenStay: true }), 'true']);
  cases.push(['the gate takes a gap of 0 with BEST as STAY and no like-for-like price', refused({ gapZero: 'S360' }), 'false']);
  cases.push(['the gate refuses a mixture price not the gap plus the charge', refused({ price: true }), 'true']);
  cases.push(['the gate refuses a price that is the gap alone (the charge left out)', refused({ noChargePrice: true }), 'true']);
  cases.push(['the gate refuses a like-for-like sum not the mixture\'s', refused({ lflOff: true }), 'true']);
  cases.push(['the gate refuses world lines not summing to the price', refused({ worldOff: true }), 'true']);
  cases.push(['the gate refuses a missing world line (on a gap-0 job, where every world line reads 0 and the sum cannot catch it)', refused({ noWorld: true, gapZero: 'S360' }), 'true']);
  cases.push(['the gate refuses a missing node line', refused({ noNode: true }), 'true']);
  cases.push(['the gate refuses a node run of other than the registered paths', refused({ nodePaths: 4000 }), 'true']);
  cases.push(['the gate refuses a node away from world 0\'s', refused({ nodeZ: '-1.7300' }), 'true']);
  cases.push(['the gate refuses a node within world 0\'s printed figure but not 7ae\'s exactly', refused({ nodeZ: '-1.73205' }), 'true']);
  cases.push(['the gate refuses OPEN0 leaving the held tiers on a node path', refused({ open0Held: true }), 'true']);
  cases.push(['the gate refuses TS+J keeping the held tiers where its chosen move leaves', refused({ tsjHeld: true }), 'true']);
  cases.push(['the gate refuses a missing done line', refused({ noDone: true }), 'true']);
  // the traces' names and agreement
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = { stamp: ST, N: WN, seed: 7002, arm: 'READER/TS+J/MP/W0/world0', sim: 98 };
    cases.push(['a trace agrees with its log, and not at another count, arm, stamp or survival', [traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98, WN), traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98, 8000), traceAgrees(t, ST, 'READER', 'P', 'OPEN0', '0', 98, WN), traceAgrees(t, { ...ST, code: 'd' }, 'READER', 'P', 'TS+J', '0', 98, WN), traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98.0001, WN)].join(' '), 'true false false false false']);
    cases.push(['the trace name is the audit\'s', traceName('bridge 4', 'READER', 'P', 'TS+J', '0'), 'bridge_4-reader-mp-ts_j-world0@w0.json.gz']); }
  // the churn measure: a path failing writes 0 bytes after, not a move; a de-risk is not a riskier move
  { const T = { N: 3, Y: 5, tier: Uint8Array.from([0, 10, 10, 0, 0, /**/ 0, 10, 0, 10, 0, /**/ 10, 10, 10, 0, 0]), failYear: Int16Array.from([3, -1, 3]) };
    const c = churn(T);
    cases.push(['the churn: switches and riskier moves a path, the path alive only', `${Array.from(c.sw).join(',')} ${Array.from(c.rr).join(',')}`, '1,4,0 0,2,0']); }
  // pairedSum
  { const p = pairedSum([Int16Array.from([2, 2, 0, 0])], [Int16Array.from([1, 1, 0, 0])]);
    cases.push(['the paired sum: the mean difference and its interval', `${p.d.toFixed(2)} ${p.se.toFixed(4)} ${p.lo.toFixed(3)} ${p.hi.toFixed(3)}`, '0.50 0.2500 0.010 0.990']); }
  // the items over built arrays: n paths a unit, three units
  const n = 8000, U = 3;
  const bits = k => B(n, k), rr = m => { const a = new Int16Array(n), k = Math.round(m * n); for (let i = 0; i < k; i++) a[i] = 1; return a; };   // mean m exactly, the first paths
  const mk = ({ o0 = 7760, oP = 7760, j3 = 7840, jP = 7840, c3 = 0.1, c0 = 1.0, cP = 0.1, w0 = 0.1, open = { 'bridge 4': [[2, 2], [2, 2], [2, 2]], S194: [[2, 2], [2, 2], [2, 2]] } } = {}) => {
    const surv = { 'OPEN0|0': o0, 'OPEN0|P': oP, 'TS+J|1e-3': j3, 'TS+J|P': jP }, ch = { 'TS+J|1e-3': c3, 'TS+J|0': c0, 'TS+J|P': cP, 'WA|0': w0 };
    const S = (rule, m) => Array.from({ length: U }, () => bits(surv[`${rule}|${m}`]));
    const R = (rule, m) => Array.from({ length: U }, () => rr(ch[`${rule}|${m}`]));
    const op = Object.fromEntries(Object.entries(open).map(([id, g]) => [id, { '30x5': g[0], '30x15': g[1], '60x5': g[2] }]));
    return items(S, R, op).map(i => i.outcome).join(' ');
  };
  cases.push(['the items: P as cause 1 says (OPEN0 as at margin 0, TS+J as at 1e-3, no churn, WA no churn, a robust opening): all HELD', mk(), 'HELD HELD HELD HELD HELD']);
  cases.push(['the items: P as margin 0 (OPEN0 fallen to 1e-3, TS+J fallen, the churn, WA churning, the opening flipping on both): all FALSIFIED', mk({ oP: 7760 - 80, jP: 7840 - 60, cP: 1.0, w0: 1.0, open: { 'bridge 4': [[2, 2], [0, 0], [2, 2]], S194: [[2, 2], [2, 2], [1, 1]] } }), 'FALSIFIED FALSIFIED FALSIFIED FALSIFIED FALSIFIED']);
  cases.push(['item 1 at M1 0.35: OPEN0 down 24 paths a unit (0.9 pooled) is FALSIFIED, 8 paths (0.3 pooled) INCONCLUSIVE', `${mk({ oP: 7760 - 24 }).split(' ')[0]} ${mk({ oP: 7760 - 8 }).split(' ')[0]}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['item 1 at M1 0.35, not 0.5: OPEN0 down 6 paths a unit (0.225 pooled, lower end -0.405) is INCONCLUSIVE', mk({ oP: 7760 - 6 }).split(' ')[0], 'INCONCLUSIVE']);
  cases.push(['item 1 reads OPEN0/P against OPEN0/M0, not against 1e-3: OPEN0 at M0 lower than P by 0.5 a unit is HELD', mk({ o0: 7720 }).split(' ')[0], 'HELD']);
  cases.push(['item 2 at M2 0.23: TS+J down 20 paths a unit (0.75 pooled) is FALSIFIED, 4 paths (0.15 pooled) INCONCLUSIVE', `${mk({ jP: 7840 - 20 }).split(' ')[1]} ${mk({ jP: 7840 - 4 }).split(' ')[1]}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['item 3 halfway: P churning at 0.6 of margin 0\'s (above H3) is FALSIFIED; at 0.4 HELD', `${mk({ cP: 0.64 }).split(' ')[2]} ${mk({ cP: 0.46 }).split(' ')[2]}`, 'FALSIFIED HELD']);
  cases.push(['items 3 and 4 need margin 0\'s excess above 0: none is INCONCLUSIVE on both', mk({ c0: 0.1, cP: 1.0 }).split(' ').slice(2, 4).join(' '), 'INCONCLUSIVE INCONCLUSIVE']);
  cases.push(['item 4 reads WA at margin 0: WA churning as margin 0 is FALSIFIED with P clean', mk({ w0: 1.0 }).split(' ').slice(2, 4).join(' '), 'HELD FALSIFIED']);
  cases.push(['item 5: one unit flipping is INCONCLUSIVE; 30x15 alone flipping on bridge 4 counts', mk({ open: { 'bridge 4': [[2, 2], [0, 0], [2, 2]], S194: [[2, 2], [2, 2], [2, 2]] } }).split(' ')[4], 'INCONCLUSIVE']);
  cases.push(['item 5 compares both tiers: an ISA tier flip counts', mk({ open: { 'bridge 4': [[2, 2], [2, 1], [2, 2]], S194: [[2, 2], [2, 2], [2, 1]] } }).split(' ')[4], 'FALSIFIED']);
  cases.push(['the Q branch reads share 0.95 as registered', `${qBranch(true).startsWith('P leaves')} ${qBranch(false).includes('is triggered before 7u')} ${qBranch(null)}`, 'true true not measured']);
  const wrong = cases.filter(([, got, want]) => got !== want);
  for (const [nm, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'FAIL'} ${nm}: ${got}${got === want ? '' : ` (should read ${want})`}`);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.length} of ${cases.length}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should`);
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
/* 7ae with its whole chain (7aa, 7ac, 7ad), and 7af against 7aa, each through its own stamps and gate; exits on a refusal */
export function loadRefs(DIR7AE, DIR7AD, DIR7AC, DIR7AA, DIR7AF, DIR7AG) {
  const fail = (who, bad) => { console.log(`FAIR-TEST GATE (${who}): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); };
  const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
  requireFairLogs(logsA, A.PRED);
  { const b = A.gate(unitsA); if (b.length) fail('7aa', b); }
  const refAll = (id, arm, tag, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
  const logsC = logsOf(DIR7AC), unitsC = Object.values(logsC).flatMap(C.parse);
  requireFairLogs(logsC, C.PRED);
  { const refOf2 = tag => (id, arm, w) => refAll(id, arm, tag, w), b = C.gate(unitsC, refOf2('TS+J'), refOf2('PRODUCT')); if (b.length) fail('7ac', b); }
  const refC = (id, arm, w) => unitsC.find(u => u.id === id && u.arm === arm && u.w === w) || null;
  const logsD = logsOf(DIR7AD), jobsD = Object.values(logsD).flatMap(D.parse);
  requireFairLogs(logsD, D.PRED);
  { const b = D.gate(jobsD, refAll, refC); if (b.length) fail('7ad', b); }
  const ref7ad = (id, arm, w) => { const j = jobsD.find(x => x.id === id && x.arm === arm && x.w === w && x.grid === '30x5'); return j ? j.tags['TS+J'] : null; };
  const logsE = logsOf(DIR7AE), jobsE = Object.values(logsE).flatMap(E.parse);
  requireFairLogs(logsE, E.PRED);
  const badE = E.gate(jobsE, (id, arm, w) => refAll(id, arm, 'TS+J', w), ref7ad);
  const TRE = badE.length ? {} : E.loadTraces(jobsE, DIR7AE, stampOf(logsE), badE, DIR7AD, stampOf(logsD));
  if (badE.length) fail('7ae', badE);
  const logsF = logsOf(DIR7AF), unitsF = Object.values(logsF).flatMap(F.parse);
  requireFairLogs(logsF, F.PRED);
  { const refA = (id, arm, l) => unitsA.find(u => u.id === id && u.arm === arm && u.label === l) || null, b = F.gate(unitsF, refA); if (b.length) fail('7af', b); }
  const unitsG = DIR7AG ? Object.values(logsOf(DIR7AG)).flatMap(G.parse) : [];
  if (DIR7AG) { requireFairLogs(logsOf(DIR7AG), G.PRED); const b = G.gate(unitsG, G.N, G.PTS, unitsF.filter(u => u.id === 'S126')); if (b.length) fail('7ag', b); }
  const cand = id => unitsF.find(u => u.id === id && u.arm === F.CAND[0] && u.label === F.CAND[1]) || unitsG.find(u => u.id === id && u.arm === G.CAND[0] && u.label === G.CAND[1]) || null;
  const R = { e: (id, arm, w) => jobsE.find(x => x.id === id && x.arm === arm && x.w === w) || null, ad: (id, arm, w, g) => { const j = jobsD.find(x => x.id === id && x.arm === arm && x.w === w && x.grid === g); return j ? j.tags['TS+J'] : null; },
    af: cand };
  return { R, jobsE, TRE, unitsF, unitsG };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const d = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = d(0, 'diagP');
  const { R, TRE } = loadRefs(d(1, 'diag7ae'), d(2, 'diag7ad'), d(3, 'diag7ac'), d(4, 'diag7aa'), d(5, 'diag7af'), d(6, 'diag7ag'));
  const logs = logsOf(DIR), jobs = Object.values(logs).flatMap(parse);
  if (JOBS.some(([kind, id, a, w, g]) => !jobs.some(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.grid === g && j.done))) { console.log(`INCOMPLETE - ${jobs.filter(j => j.done).length} of ${JOBS.length} jobs done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(jobs, R), ST = stampOf(logs);
  const TR = bad.length ? {} : loadTraces(jobs, DIR, ST, bad, TRE);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(jobs, TR, R.af);
}
