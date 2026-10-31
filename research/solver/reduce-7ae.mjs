/*
 * THE 7AE REDUCER: THE BAD NODE AT MARGIN 0 (predictions/diag-7ae.md; PLAN.md 7ae). Reads results/diag7ae/case*.txt
 * (batch-7ae.sh: audit-s126.mjs diag7ae, three jobs) beside 7aa's, 7ac's and 7ad's records, each read only through its own
 * reducer's gate.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) and 7aa's, 7ac's and 7ad's own gates;
 *   - every registered job once and done, each with its lines at both margins: solve, ran, gap, joint, moves, price, three
 *     world lines, the node line at world 0 of the registered node paths, and ten decision-log lines a rule;
 *   - at margin 1e-3 the table, ran line, gap and joint line are 7aa's TS+J unit's (7ae's code - nearestIndex exported, the
 *     margin option - reproduces 7aa's solve); at margin 0 the ran line is 7aa's with " switchMargin 0" at its end and the
 *     joint line says switchMargin 0;
 *   - the mixture's price equals the gap (x100), the like-for-like prices sum to it, the moves line is consistent and the
 *     node runs' held0 are as the chosen move says (7ad's checks);
 *   - at margin 1e-3 the node runs' first 4,000 paths are 7ad's world-0 30x5 node runs: the printed survival equals 7ad's
 *     node line, and path by path the survived bits equal 7ad's traces (the same paths, the same tables);
 *   - the decision log: each year's counts consistent (the cell's and the forward's leaves split into the two disagreements
 *     the same way; no margin hold at margin 0), and against the run's own trace, the paths holding the plan's tiers at each
 *     year's start exactly the log's, and its forward leaves between the trace's and the trace's plus that year's failures;
 *   - every node trace: its count, seed, arm, stamp and survival are the log's.
 * THE ITEMS, by the registered rule:
 *   1. At margin 0 the bad world's de-risk is priced as it realises: over the three units pooled, world 0's like-for-like
 *      survival price of the opening (Σ price) against the survival TS+J realises over OPEN0 at world 0's node (Σ realised,
 *      8,000 paths each, paired, its 95% interval from the per-path sums, the units' shared paths counted). HELD if the ratio
 *      Σ price / Σ realised is at least 0.85 AND Σ price is at or above the interval's lower end; FALSIFIED if the ratio is
 *      below 0.75 AND Σ price is below the lower end; else INCONCLUSIVE (and INCONCLUSIVE if a unit's TS+J keeps the held
 *      tiers at margin 0, its node run then OPEN0's, or Σ realised is not above 0).
 *      Its attribution (registered, attribution()): each rule's paired change from 1e-3 to 0 on the same node paths - the
 *      price rising by a quarter of the 1e-3 mispricing, OPEN0 rising, TS+J falling - read as the prediction says.
 *   2. At margin 1e-3 the forward run holds where the table's own cell leaves, beyond the grid's own disagreement: on OPEN0's
 *      node runs (the STAY move's realisation), years 1 to 7, pooled over the three units, the one-way share (the forward
 *      holds, the nearest cell's stored move leaves) of the path-years holding the plan's tiers; the net excess the smaller
 *      of it less the reverse share and it less the same share on OPEN0/M0 (where OPEN0/M0 holds MIN_GRID_PY path-years).
 *      HELD at a one-way share of 10% or more with a net excess of 5 points or more; FALSIFIED at a net excess below 2
 *      points; else INCONCLUSIVE (the plan-auditor's BLOCKING 1, 28 Sep 21:07 UK).
 *   3. Bridge 4 alone, at margin 0: its world-0 survival price at or above the node's exact 95% interval's lower end
 *      (survivalChange at 0.05). HELD if so; FALSIFIED if below it with the ratio price / realised below 0.75; else
 *      INCONCLUSIVE (and INCONCLUSIVE if TS+J keeps the held tiers at margin 0).
 * Reported, not items: every unit's price, realised and ratio at both margins; the pooled figure at margin 1e-3 (7ad's
 * 30x5 reading on twice the paths) and which side moved from 1e-3 to 0 (Σ price, Σ realised); the cause-2 signature (at margin 0, S194's ratio at least 0.85 with bridge 4's and
 * S126's below 0.65); the decision log by year (both disagreements, the margin holds); O47's yearly first-leave share.
 *   node research/solver/reduce-7ae.mjs [dir7ae] [dir7ad] [dir7ac] [dir7aa] > research/solver/results-7ae.txt
 *   node research/solver/reduce-7ae.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import * as C from './reduce-7ac.mjs';
import * as D from './reduce-7ad.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ae.md';
export const { N, SEED, LAMBDA, field } = A;
export const WN = 8000, FIRST = 4000, YEARS = 10, LOGYEARS = 7, ALPHA3 = 0.05, Z95 = 1.959963984540054, MIN_GRID_PY = 1000;
export const { PRICE_TOL, LFL_TOL, SIM_TOL, WTOL } = D;
export const JOBS = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02'], ['S126', 'READER', '0']];
export const MARGINS = ['1e-3', '0'];
export const RULES = ['TS+J', 'OPEN0'];
const marginOf = m => (m === '0' ? '0' : '0.001');

const CASEL = /^(\S.*?)\s+case \| job (\S+?)\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+) points (\d+) quad (\d+)$/;
const LBL = '(\\S+?)\\/TS\\+J\\/M(\\S+?)\\/W(\\S+)';
const SOLVEL = new RegExp(`^\\s+solve ${LBL}: table (\\S+) secs (\\S+)$`);
const RANL = new RegExp(`^\\s+ran ${LBL}: (.*)$`);
const GAPL = new RegExp(`^\\s+gap ${LBL}: (\\S+) opening (\\d+),(\\d+)$`);
const JOINTL = new RegExp(`^\\s+joint ${LBL}: (true|false) switchMargin (\\S+) scale (\\S+) cap (\\S+) deathTax (\\S+) tier (\\S+) riskAbove (\\S+)$`);
const MOVESL = new RegExp(`^\\s+moves ${LBL}: best (\\d+) (\\d+)\\/(\\d+) stay (\\d+) (\\d+)\\/(\\d+) chosen (\\d+) (\\d+)\\/(\\d+) held (\\d+)\\/(\\d+)$`);
const PRICEL = new RegExp(`^\\s+price ${LBL}: mixture (\\S+) like-for-like whole (\\S+) survival (\\S+)$`);
const WORLDL = new RegExp(`^\\s+world ${LBL} (\\d+) z (\\S+) weight (\\S+): whole (\\S+) survival (\\S+)$`);
const NODEL = new RegExp(`^\\s+node ${LBL} 0 z (\\S+): sim TS\\+J (\\S+) OPEN0 (\\S+) held0 TS\\+J (\\d+) OPEN0 (\\d+) first4000 TS\\+J (\\S+) OPEN0 (\\S+) paths (\\d+) secs (\\S+)$`);
const LOGL = new RegExp(`^\\s+log ${LBL} (TS\\+J|OPEN0) year (\\d+): held (\\d+) fwdLeave (\\d+) cellLeave (\\d+) fwdHoldCellLeave (\\d+) fwdLeaveCellHold (\\d+) marginHold (\\d+)$`);

export function parse(text) {
  const jobs = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], w: m[3], lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], points: +m[8], quad: +m[9], tags: {}, dup: [], done: false }; jobs.push(cur); continue; }
    if (!cur) continue;
    const T = (a, mg, w) => (a === cur.arm && w === cur.w ? (cur.tags[mg] || (cur.tags[mg] = { worlds: [], log: { 'TS+J': [], OPEN0: [] } })) : null);
    // a line given twice for one tag is a fault the gate names (a job's lines are written once)
    const set = (t, k, v, name) => { if (t[k] !== undefined) cur.dup.push(name); t[k] = v; };
    let t;
    if ((m = SOLVEL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'table', m[4], `solve M${m[2]}`); continue; }
    if ((m = RANL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'ran', m[4], `ran M${m[2]}`); continue; }
    if ((m = GAPL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'gap', { gap: m[4], open1e3: +m[5], open0: +m[6] }, `gap M${m[2]}`); continue; }
    if ((m = JOINTL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'joint', { joint: m[4] === 'true', margin: m[5], scale: +m[6], cap: +m[7] }, `joint M${m[2]}`); continue; }
    if ((m = MOVESL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'moves', { best: +m[4], bestTier: [+m[5], +m[6]], stay: +m[7], stayTier: [+m[8], +m[9]], chosen: +m[10], chosenTier: [+m[11], +m[12]], held: [+m[13], +m[14]] }, `moves M${m[2]}`); continue; }
    if ((m = PRICEL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'price', { mixture: +m[4], whole: +m[5], surv: +m[6] }, `price M${m[2]}`); continue; }
    if ((m = WORLDL.exec(line)) && (t = T(m[1], m[2], m[3]))) { if (t.worlds[+m[4]]) cur.dup.push(`world M${m[2]} ${m[4]}`); t.worlds[+m[4]] = { z: +m[5], w: +m[6], whole: +m[7], surv: +m[8] }; continue; }
    if ((m = NODEL.exec(line)) && (t = T(m[1], m[2], m[3]))) { set(t, 'node', { z: +m[4], simJ: +m[5], simO: +m[6], heldJ: +m[7], heldO: +m[8], firstJ: +m[9], firstO: +m[10], paths: +m[11] }, `node M${m[2]}`); continue; }
    if ((m = LOGL.exec(line)) && (t = T(m[1], m[2], m[3]))) { const L = t.log[m[4]], y = +m[5]; if (L[y]) cur.dup.push(`log M${m[2]} ${m[4]} year ${y}`); L[y] = { held: +m[6], fwdLeave: +m[7], cellLeave: +m[8], fwdHoldCellLeave: +m[9], fwdLeaveCellHold: +m[10], marginHold: +m[11] }; continue; }
    if (line.trim() === `done ${cur.arm}/W${cur.w}`) { cur.done = true; continue; }
  }
  return jobs;
}

/* 7ae's gate. `refA(id, arm, w)` is 7aa's parsed TS+J unit (reduce-7aa.mjs parse); `ref7ad(id, arm, w)` 7ad's parsed TS+J tag
   of the 30x5 job (reduce-7ad.mjs parse), whose world-0 node line the first paths must equal. */
export function gate(jobs, refA, ref7ad, wn = WN) {
  const bad = [];
  for (const [id, arm, w] of JOBS) { const k = jobs.filter(j => j.id === id && j.arm === arm && j.w === w).length; if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} job lines, not 1`); }
  for (const j of jobs) {
    const tagJ = `${j.id} ${j.arm}/W${j.w}`;
    if (!JOBS.some(([id, a, w]) => id === j.id && a === j.arm && w === j.w)) { bad.push(`${tagJ}: not a registered job`); continue; }
    if (j.dup.length) bad.push(`${tagJ}: lines given twice: ${j.dup.join(', ')}`);
    if (j.lambda !== LAMBDA || j.tier !== 'own' || j.riskAbove !== 'auto' || j.mix !== '3') bad.push(`${tagJ}: job line settings ${j.lambda} ${j.tier} ${j.riskAbove} ${j.mix}`);
    if (j.points !== 30 || j.quad !== 5) bad.push(`${tagJ}: ran at ${j.points} points and ${j.quad} return points, not 30x5`);
    for (const mg of Object.keys(j.tags)) if (!MARGINS.includes(mg)) bad.push(`${tagJ}: an unregistered margin ${mg}`);
    const r = refA(j.id, j.arm, j.w), r7 = ref7ad(j.id, j.arm, j.w);
    if (!r) bad.push(`${tagJ}: no 7aa TS+J unit to compare with`);
    if (!r7) bad.push(`${tagJ}: no 7ad 30x5 TS+J job to compare with`);
    for (const mg of MARGINS) {
      const u = j.tags[mg], L = `${tagJ} M${mg}`;
      if (!u) { bad.push(`${L}: no lines`); continue; }
      if (u.table === undefined) bad.push(`${L}: no solve line`);
      if (!u.ran) bad.push(`${L}: no ran line`);
      else {
        if (field(u.ran, 'bequestWeight') !== j.w) bad.push(`${L}: ran the estate weight ${field(u.ran, 'bequestWeight')}`);
        if (!field(u.ran, 'tierState')) bad.push(`${L}: ran without the tier state`);
        for (const k of ['holdTier', 'bridgeStep', 'readerRef']) if (field(u.ran, k)) bad.push(`${L}: ran ${k} ${field(u.ran, k)}`);
        if (field(u.ran, 'paths') !== String(N) || field(u.ran, 'seed') !== SEED) bad.push(`${L}: ran ${field(u.ran, 'paths')} paths of seed ${field(u.ran, 'seed')}`);
        if (field(u.ran, 'pts') !== '30' || field(u.ran, 'quad') !== '5') bad.push(`${L}: its ran line says ${field(u.ran, 'pts')} points and ${field(u.ran, 'quad')} return points, not 30x5`);
        if (r) { const want = mg === '0' ? `${r.ran} switchMargin 0` : r.ran; if (u.ran !== want) bad.push(`${L}: its ran line is not 7aa's${mg === '0' ? ' with switchMargin 0 at its end' : ''}`); }
      }
      if (mg === '1e-3' && r && u.table !== undefined && u.table !== r.table) bad.push(`${L}: its table ${u.table}, 7aa's ${r.table}`);
      if (!u.gap) bad.push(`${L}: no gap line`);
      else if (mg === '1e-3' && r && (!r.gap || u.gap.gap !== r.gap.gap || u.gap.open1e3 !== r.gap.open1e3 || u.gap.open0 !== r.gap.open0)) bad.push(`${L}: its gap ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, 7aa's ${r.gap ? `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}` : 'none'}`);
      if (!u.joint) bad.push(`${L}: no joint line`);
      else {
        if (!u.joint.joint) bad.push(`${L}: TS+J solved per world`);
        if (u.joint.margin !== marginOf(mg)) bad.push(`${L}: solved at margin ${u.joint.margin}`);
        if (r && (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap)) bad.push(`${L}: scale or cap not 7aa's`);
      }
      if (!u.moves) bad.push(`${L}: no moves line`);
      else {
        const [hp, hi] = u.moves.held, keeps = t => t[0] === hp && t[1] === hi;
        if (hp !== 0 || hi !== 0) bad.push(`${L}: the opening holds ${hp}/${hi}, not the plan's tiers`);
        if (!keeps(u.moves.stayTier)) bad.push(`${L}: its STAY move leaves the held tiers`);
        if (u.gap && u.gap.gap !== '0' && keeps(u.moves.bestTier)) bad.push(`${L}: its BEST move keeps the held tiers where the gap is ${u.gap.gap}`);
        if (u.gap && u.gap.gap === '0' && u.moves.best !== u.moves.stay) bad.push(`${L}: its BEST and STAY moves differ where the gap is 0`);
        if (u.moves.chosen !== (keeps(u.moves.chosenTier) ? u.moves.stay : u.moves.best)) bad.push(`${L}: its chosen move ${u.moves.chosen} is neither BEST where it leaves the held tiers nor STAY where it keeps them`);
        if (mg === '0' && u.moves.chosen !== u.moves.best) bad.push(`${L}: its chosen move at margin 0 is not BEST`);
      }
      if (!u.price) bad.push(`${L}: no price line`);
      else {
        const g = u.gap ? Number(u.gap.gap) : NaN;
        if (Number.isFinite(g) && g > 0 && !(Math.abs(u.price.mixture / 100 - g) <= PRICE_TOL * g)) bad.push(`${L}: the mixture's price ${u.price.mixture} is not the gap ${u.gap.gap} (x100)`);
        if (!(Math.abs(u.price.whole - u.price.mixture) <= LFL_TOL * Math.abs(u.price.mixture) + 1e-12)) bad.push(`${L}: the like-for-like prices' weighted sum ${u.price.whole} is not the mixture's price ${u.price.mixture}`);
      }
      if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k])) bad.push(`${L}: world lines ${u.worlds.filter(Boolean).length}, not 3`);
      else if (u.price) {
        const sum = f => u.worlds.reduce((t, x) => t + x.w * x[f], 0), tol = f => WTOL * u.worlds.reduce((t, x) => t + Math.abs(x[f]), 0) + 3e-6;
        if (!(Math.abs(sum('whole') - u.price.whole) <= tol('whole')) || !(Math.abs(sum('surv') - u.price.surv) <= tol('surv'))) bad.push(`${L}: the world lines do not sum to the price line`);
      }
      const nd = u.node;
      if (!nd) bad.push(`${L}: no node line`);
      else {
        if (nd.paths !== wn) bad.push(`${L}: the node ran ${nd.paths} paths, not ${wn}`);
        if (u.worlds[0] && Math.abs(nd.z - u.worlds[0].z) > 1e-4) bad.push(`${L}: the node at z ${nd.z}, world 0's node ${u.worlds[0].z}`);
        if (nd.heldO !== nd.paths) bad.push(`${L}: OPEN0 kept the held tiers on ${nd.heldO} of ${nd.paths} paths`);
        if (u.moves) { const leaves = !(u.moves.chosenTier[0] === u.moves.held[0] && u.moves.chosenTier[1] === u.moves.held[1]); if (nd.heldJ !== (leaves ? 0 : nd.paths)) bad.push(`${L}: TS+J kept the held tiers on ${nd.heldJ} of ${nd.paths} paths, its chosen move ${leaves ? 'leaving' : 'keeping'} them`); }
        if (mg === '1e-3' && r7) {
          const n7 = r7.nodes && r7.nodes[0];
          if (!n7) bad.push(`${L}: no 7ad world-0 node line to compare with`);
          else if (n7.paths !== Math.min(FIRST, wn)) bad.push(`${L}: 7ad's node ran ${n7.paths} paths, not this run's first ${Math.min(FIRST, wn)}`);
          else if (Math.abs(nd.firstJ - n7.simJ) > 1e-9 || Math.abs(nd.firstO - n7.simO) > 1e-9) bad.push(`${L}: its first ${n7.paths} paths (TS+J ${nd.firstJ}, OPEN0 ${nd.firstO}) are not 7ad's node (${n7.simJ}, ${n7.simO})`);
        }
      }
      for (const rule of RULES) {
        const lg = u.log[rule];
        if (lg.filter(Boolean).length !== YEARS || Array.from({ length: YEARS }, (_, i) => i + 1).some(y => !lg[y]) || lg[0]) { bad.push(`${L} ${rule}: decision-log lines for years ${lg.map((x, y) => (x ? y : null)).filter(y => y !== null).join(',')}, not 1 to ${YEARS}`); continue; }
        for (let y = 1; y <= YEARS; y++) {
          const g = lg[y], both1 = g.fwdLeave - g.fwdLeaveCellHold, both2 = g.cellLeave - g.fwdHoldCellLeave;
          if (both1 !== both2 || both1 < 0 || g.fwdLeave > g.held || g.cellLeave > g.held || g.fwdLeave + g.fwdHoldCellLeave > g.held) bad.push(`${L} ${rule} year ${y}: the decision log's counts are inconsistent`);
          if (g.marginHold > g.held - g.fwdLeave) bad.push(`${L} ${rule} year ${y}: more margin holds than holds`);
          if (mg === '0' && g.marginHold !== 0) bad.push(`${L} ${rule} year ${y}: a margin hold at margin 0`);
          if (nd && g.held > nd.paths) bad.push(`${L} ${rule} year ${y}: more paths held than run`);
        }
      }
    }
    if (!j.done) bad.push(`${tagJ}: no done line`);
  }
  return bad;
}
export const traceName = (id, arm, m, rule, w) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-m${m}-${rule.toLowerCase().replace(/\+/g, '_')}-world0@w${w}.json.gz`;
export const traceAgrees = (j, ST, arm, m, rule, w, sim, wn = WN) => !!(j && ST && j.stamp && j.N === wn && String(j.seed) === SEED && j.arm === `${arm}/${rule}/M${m}/W${w}/world0` && ['code', 'audit', 'prediction', 'sha'].every(x => j.stamp[x] === ST[x]) && Math.abs(j.sim - sim) <= SIM_TOL);
/* the decision log against its run's trace: the paths holding the plan's tiers (the tier byte 0) at year y's start - alive
   at y (no failure before it: failYear -1 or at least y) and holding 0 after year y - 1's move - are exactly the log's; the
   forward leaves are at least the traced leaves (tier byte at y not 0) and at most those plus the held paths failing in y
   (a path failing in its year writes no tier) */
export function logAgrees(T, lg) {
  const out = [];
  for (let y = 1; y <= YEARS && y < T.Y; y++) {
    let held = 0, left = 0, dying = 0;
    for (let i = 0; i < T.N; i++) {
      const f = T.failYear[i];
      if (f !== -1 && f < y) continue;
      if (T.tier[i * T.Y + y - 1] !== 0) continue;
      held++;
      if (f === y) dying++; else if (T.tier[i * T.Y + y] !== 0) left++;
    }
    const g = lg[y];
    if (!g || g.held !== held || g.fwdLeave < left || g.fwdLeave > left + dying) out.push(`year ${y}: the log's held ${g ? g.held : '-'} leaves ${g ? g.fwdLeave : '-'}, the trace's ${held} and ${left} to ${left + dying}`);
  }
  return out;
}
/* the first `n` survived bits of two traces equal, path by path */
export const sameFirst = (a, b, n) => { if (!a || !b || a.length < n || b.length < n) return false; for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false; return true; };

/* O47's first-leave share (reduce-7ad.mjs firstLeave) */
export const { firstLeave } = D;

/*
 * THE ITEMS. `P(id, m)` is a job's parsed tag at margin m; `K(id, m)` the paired node run at world 0: cells(OPEN0, TS+J) with
 * `diff`, each path's TS+J survival less OPEN0's (-1, 0, 1).
 */
const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
export const leaves = u => !!u.moves && u.moves.chosen !== u.moves.stay;
/* the pooled realised with the units' shared paths: every unit runs on seed 7002's first paths with world 0's shift, so a
   path's differences on two units may move together; the variance of the sum of the units' means is the per-path sum's
   variance over N (centred), in points^2 */
export function pooled(ks) {
  const n = ks[0].N; if (ks.some(k => k.N !== n)) throw new Error('pooled: units of different path counts');
  let s = 0, s2 = 0;
  for (let i = 0; i < n; i++) { let x = 0; for (const k of ks) x += k.diff[i]; s += x; s2 += x * x; }
  const mean = s / n, v = (s2 / n - mean * mean) / n, d = 100 * mean, se = 100 * Math.sqrt(Math.max(0, v));
  return { d, se, lo: d - Z95 * se, hi: d + Z95 * se };
}
/* ITEM 1's ATTRIBUTION (registered; the plan-auditor's BLOCKING 2, 28 Sep 21:07 UK): which side closed the ratio. `KR(id, rule)`
   is a rule's paired change from margin 1e-3 to 0 on the same node paths (cells(rule/1e-3, rule/M0), diff M0 less 1e-3).
   priceRose: Σ price rose by at least a quarter of the 1e-3 pooled mispricing (Σ realised less Σ price at 1e-3; the tables'
   own numbers); open0Rose: OPEN0's pooled change's 95% interval above 0 (its continuation no longer holds); tsjFell: TS+J's
   pooled change's interval below 0 (margin 0's own switching). */
export function attribution(P, K, KR) {
  const at = m => ({ sp: JOBS.reduce((t, [id]) => t + P(id, m).worlds[0].surv, 0), sd: pooled(JOBS.map(([id]) => K(id, m))).d });
  const a = at('1e-3'), b = at('0'), miss = Math.max(0, a.sd - a.sp), dO = pooled(JOBS.map(([id]) => KR(id, 'OPEN0'))), dJ = pooled(JOBS.map(([id]) => KR(id, 'TS+J')));
  const priceRose = b.sp - a.sp >= 0.25 * miss && b.sp > a.sp, open0Rose = dO.lo > 0, tsjFell = dJ.hi < 0;
  const reading = priceRose || open0Rose ? `${[priceRose ? 'the 0.001 tables under-value the de-risk (the price rose)' : null, open0Rose ? 'the 0.001 continuation holds where the tables\' valued one leaves (OPEN0 rose)' : null].filter(Boolean).join('; ')}${tsjFell ? '; TS+J fell at margin 0 too (reported beside: a margin design must also stop it)' : ''}`
    : tsjFell ? 'TS+J fell at margin 0 alone: nothing attributed to the 0.001 tables or continuation (grade C; no margin design on it)' : 'no side moved beyond its threshold: nothing attributed';
  return { priceBefore: a.sp, priceAfter: b.sp, miss, dO, dJ, priceRose, open0Rose, tsjFell, reading };
}
export function items(P, K, LOGS) {
  const out = [];
  // 1. margin 0, pooled
  { const legs = JOBS.map(([id]) => { const u = P(id, '0'), k = K(id, '0'); return { id, leaves: leaves(u), price: u.worlds[0].surv, d: 100 * (k.saved - k.lost) / k.N, k }; });
    const all = legs.every(l => l.leaves), pl = pooled(legs.map(l => l.k)), sp = legs.reduce((t, l) => t + l.price, 0), ratio = pl.d > 0 ? sp / pl.d : NaN;
    const ok = all && pl.d > 0;
    out.push({ n: 1, text: 'at margin 0, the three units pooled: Σ price / Σ realised at least 0.85 AND Σ price at or above the realised 95% interval\'s lower end (FALSIFIED: the ratio below 0.75 AND Σ price below the lower end)', legs, pooled: pl, sp, ratio, measured: ok,
      outcome: ok ? tri(ratio >= 0.85 && sp >= pl.lo, ratio < 0.75 && sp < pl.lo) : 'INCONCLUSIVE' }); }
  // 2. margin 1e-3, OPEN0's log, years 1 to 7, pooled: the one-way share (the forward holds, the cell leaves) net of the grid's
  //    own disagreement - the reverse share at 1e-3, and the same one-way share at margin 0 (no margin: the nearest cell
  //    against the interpolated state alone) where OPEN0/M0 holds MIN_GRID_PY path-years or more (the plan-auditor's
  //    BLOCKING 1, 28 Sep 21:07 UK)
  { const sh = m => { let held = 0, hc = 0, lc = 0; const legs = JOBS.map(([id]) => { const lg = LOGS(id, m, 'OPEN0'); let h = 0, x = 0, r = 0; for (let y = 1; y <= LOGYEARS; y++) { h += lg[y].held; x += lg[y].fwdHoldCellLeave; r += lg[y].fwdLeaveCellHold; } held += h; hc += x; lc += r; return { id, held: h, fwdHoldCellLeave: x, fwdLeaveCellHold: r, share: h ? x / h : 0 }; }); return { held, hc, lc, legs, one: held ? hc / held : 0, rev: held ? lc / held : 0 }; };
    const a = sh('1e-3'), g = sh('0'), grid = g.held >= MIN_GRID_PY ? g.one : null;
    const net = Math.min(a.one - a.rev, grid === null ? Infinity : a.one - grid);
    out.push({ n: 2, text: `at margin 1e-3, on OPEN0's node runs, years 1 to 7, the three units pooled: the share of path-years holding the plan's tiers where the forward move holds and the nearest cell's stored move leaves is 10% or more AND exceeds by 5 points or more both the reverse share (the forward leaves, the cell holds) and the same one-way share at margin 0 (where OPEN0/M0 holds ${MIN_GRID_PY} path-years or more) (FALSIFIED: the net excess below 2 points)`, legs: a.legs, held: a.held, hc: a.hc, share: a.one, rev: a.rev, grid, gridHeld: g.held, net,
      outcome: a.held ? tri(a.one >= 0.10 && net >= 0.05, net < 0.02) : 'INCONCLUSIVE' }); }
  // 3. bridge 4 at margin 0
  { const u = P('bridge 4', '0'), k = K('bridge 4', '0'), iv = survivalChange(k.lost, k.saved, k.N, ALPHA3), price = u.worlds[0].surv, ratio = iv.d > 0 ? price / iv.d : NaN, lv = leaves(u);
    out.push({ n: 3, text: 'bridge 4 at margin 0: its world-0 survival price at or above the node\'s exact 95% interval\'s lower end (FALSIFIED: below it, the ratio price / realised below 0.75)', legs: [{ id: 'bridge 4', price, iv, ratio, leaves: lv }],
      outcome: lv ? tri(price >= iv.lo, price < iv.lo && ratio < 0.75) : 'INCONCLUSIVE' }); }
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, w) => `mix 3 pts 30 seed ${SEED} paths ${N} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 80000 : 29000} quad 5 tierState 0/0,1/1,2/2 bequestWeight ${w} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}`;
  const refA = (id, arm, w) => ({ table: '99.5000', ran: ranOf(id, arm, w), gap: { gap: '1.3456e-3', open1e3: 2, open0: 2 }, joint: { joint: true, margin: '0.001', scale: 950000, cap: 3800000 } });
  const ref7ad = () => ({ nodes: [{ simJ: 99.3, simO: 98.5, paths: FIRST }] });
  const GAP = { '1e-3': '1.3456e-3', 0: '1.5000e-3' };
  const logLine = (L, rule, y, o) => { const g = { held: 7000, fwdLeave: rule === 'OPEN0' && y === 1 ? 700 : 70, cellLeave: rule === 'OPEN0' && y === 1 ? 1400 : 70, fwdHoldCellLeave: rule === 'OPEN0' && y === 1 ? 800 : 10, fwdLeaveCellHold: rule === 'OPEN0' && y === 1 ? 100 : 10, marginHold: 0, ...((o.log && o.log(rule, y, L)) || {}) }; return `${''.padEnd(16)} log ${L} ${rule} year ${y}: held ${g.held} fwdLeave ${g.fwdLeave} cellLeave ${g.cellLeave} fwdHoldCellLeave ${g.fwdHoldCellLeave} fwdLeaveCellHold ${g.fwdLeaveCellHold} marginHold ${g.marginHold}`; };
  const jobText = (id, arm, w, o = {}) => {
    const p = ''.padEnd(16), lines = [`${id.padEnd(16)} case | job ${arm}/W${w} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${o.points || 30} quad 5`];
    for (const mg of o.margins || MARGINS) {
      const L = `${arm}/TS+J/M${mg}/W${w}`, gap = GAP[mg], price = 100 * Number(gap), s0 = 0.5;
      lines.push(`${p} solve ${L}: table ${mg === '0' ? '99.6000' : (o.table || '99.5000')} secs 1`);
      lines.push(`${p} ran ${L}: ${ranOf(id, arm, w)}${mg === '0' ? ' switchMargin 0' : ''}`);
      lines.push(`${p} gap ${L}: ${gap} opening 2,2`);
      lines.push(`${p} joint ${L}: true switchMargin ${marginOf(mg)} scale 950000 cap 3800000 deathTax 0 tier own riskAbove off:_no_tier_above_the_plan`);
      lines.push(`${p} moves ${L}: best 12 2/0 stay 3 0/0 chosen 12 2/0 held 0/0`);
      const w0 = 3 * price, w2 = 6 * price - w0;
      lines.push(`${p} price ${L}: mixture ${price.toExponential(6)} like-for-like whole ${price.toExponential(6)} survival ${(s0 / 6).toExponential(6)}`);
      [[w0, s0], [0, 0], [w2, 0]].forEach(([wh, sv], k) => lines.push(`${p} world ${L} ${k} z ${[-1.7321, 0, 1.7321][k].toFixed(4)} weight ${[0.1667, 0.6667, 0.1667][k].toFixed(4)}: whole ${wh.toFixed(6)} survival ${sv.toFixed(6)}`));
      lines.push(`${p} node ${L} 0 z -1.7321: sim TS+J 99.3000 OPEN0 98.1000 held0 TS+J 0 OPEN0 ${WN} first4000 TS+J ${mg === '1e-3' ? (o.first || '99.3000') : '99.4000'} OPEN0 ${mg === '1e-3' ? '98.5000' : '98.6000'} paths ${WN} secs 1`);
      for (const rule of RULES) for (let y = 1; y <= YEARS; y++) lines.push(logLine(L, rule, y, o));
    }
    lines.push(`${p} done ${arm}/W${w}`);
    return (o.sub || []).reduce((t, [f, to]) => { if (!t.includes(f)) throw new Error(`planted sub ${f} not found`); return t.replace(f, to); }, lines.join('\n'));
  };
  const good = () => JOBS.map(([id, a, w]) => jobText(id, a, w)).join('\n');
  const bent = (id, o) => JOBS.map(([i, a, w]) => jobText(i, a, w, i === id ? o : {})).join('\n');
  const refused = t => String(gate(parse(t), refA, ref7ad).length > 0);
  const sub = (id, ...xs) => refused(bent(id, { sub: xs }));
  cases.push(['a log parsed and gated: three jobs, the gate passes', `${parse(good()).length} ${gate(parse(good()), refA, ref7ad).length}`, '3 0']);
  cases.push(['the gate refuses a missing job', refused(JOBS.slice(1).map(([id, a, w]) => jobText(id, a, w)).join('\n')), 'true']);
  cases.push(['the gate refuses a job run twice', refused(good() + '\n' + jobText('S194', 'OFF', '0.02')), 'true']);
  cases.push(['the gate refuses an unregistered job (S194 at W0)', refused(good() + '\n' + jobText('S194', 'OFF', '0')), 'true']);
  cases.push(['the gate refuses a job run at other points than 30', refused(bent('S126', { points: 4 })), 'true']);
  cases.push(['the gate refuses a missing margin', refused(bent('bridge 4', { margins: ['1e-3'] })), 'true']);
  cases.push(['the gate refuses a 1e-3 table not 7aa\'s', refused(bent('S194', { table: '99.5001' })), 'true']);
  cases.push(['the gate takes a margin-0 table unlike 7aa\'s (its own solve)', String(gate(parse(good()), refA, ref7ad).length === 0 && good().includes('M0/W0: table 99.6000')), 'true']);
  cases.push(['the gate refuses a 1e-3 gap not 7aa\'s', sub('bridge 4', ['gap READER/TS+J/M1e-3/W0: 1.3456e-3', 'gap READER/TS+J/M1e-3/W0: 1.3457e-3']), 'true']);
  cases.push(['the gate refuses a margin-0 ran line without switchMargin 0 at its end', sub('S126', ['bridgeRead reader switchMargin 0', 'bridgeRead reader']), 'true']);
  cases.push(['the gate refuses a 1e-3 ran line carrying a switchMargin', sub('S194', [`${ranOf('S194', 'OFF', '0.02')}\n`, `${ranOf('S194', 'OFF', '0.02')} switchMargin 0.001\n`]), 'true']);
  cases.push(['the gate refuses a ran line of other settings (minPot)', sub('bridge 4', ['minPot 29000', 'minPot 30000']), 'true']);
  cases.push(['the gate refuses a margin-0 solve whose joint line says 0.001', sub('bridge 4', ['M0/W0: true switchMargin 0 ', 'M0/W0: true switchMargin 0.001 ']), 'true']);
  cases.push(['the gate refuses a 1e-3 solve whose joint line says 0', sub('S194', ['M1e-3/W0.02: true switchMargin 0.001', 'M1e-3/W0.02: true switchMargin 0']), 'true']);
  cases.push(['the gate refuses TS+J solved per world', sub('S126', ['M0/W0: true switchMargin', 'M0/W0: false switchMargin']), 'true']);
  cases.push(['the gate refuses a scale not 7aa\'s', sub('S194', ['scale 950000', 'scale 950001']), 'true']);
  cases.push(['the gate refuses a STAY move leaving the held tiers', sub('S194', ['stay 3 0/0', 'stay 3 2/0']), 'true']);
  cases.push(['the gate refuses a margin-0 chosen move that is STAY while BEST leaves', sub('bridge 4', ['moves READER/TS+J/M0/W0: best 12 2/0 stay 3 0/0 chosen 12 2/0', 'moves READER/TS+J/M0/W0: best 12 2/0 stay 3 0/0 chosen 3 0/0'], ['held0 TS+J 0 OPEN0 8000 first4000 TS+J 99.4000', `held0 TS+J ${WN} OPEN0 8000 first4000 TS+J 99.4000`]), 'true']);
  cases.push(['the gate refuses an opening holding other than the plan\'s tiers', sub('S126', ['held 0/0', 'held 1/1'], ['stay 3 0/0', 'stay 3 1/1']), 'true']);
  cases.push(['the gate refuses a mixture price not the gap (x100)', sub('S126', ['gap READER/TS+J/M0/W0: 1.5000e-3', 'gap READER/TS+J/M0/W0: 1.5030e-3']), 'true']);
  cases.push(['the gate refuses world lines not summing to the price line', sub('S194', ['world OFF/TS+J/M0/W0.02 1 z 0.0000 weight 0.6667: whole 0.000000', 'world OFF/TS+J/M0/W0.02 1 z 0.0000 weight 0.6667: whole 0.001000']), 'true']);
  cases.push(['the gate refuses a missing world line', sub('bridge 4', ['world READER/TS+J/M0/W0 2', 'wrld READER/TS+J/M0/W0 2']), 'true']);
  cases.push(['the gate refuses a node run of other than the registered paths', sub('S194', ['OPEN0 8000 first4000 TS+J 99.4000 OPEN0 98.6000 paths 8000', 'OPEN0 7999 first4000 TS+J 99.4000 OPEN0 98.6000 paths 7999']), 'true']);
  cases.push(['the gate refuses a node run away from world 0\'s node', sub('S126', ['node READER/TS+J/M0/W0 0 z -1.7321', 'node READER/TS+J/M0/W0 0 z -1.6000']), 'true']);
  cases.push(['the gate refuses OPEN0 leaving the held tiers on a node path', sub('bridge 4', ['held0 TS+J 0 OPEN0 8000 first4000 TS+J 99.4000', 'held0 TS+J 0 OPEN0 7999 first4000 TS+J 99.4000']), 'true']);
  cases.push(['the gate refuses TS+J keeping the held tiers where its chosen move leaves', sub('S194', ['held0 TS+J 0 OPEN0 8000 first4000 TS+J 99.3000', 'held0 TS+J 1 OPEN0 8000 first4000 TS+J 99.3000']), 'true']);
  cases.push(['the gate refuses a 1e-3 node\'s first 4000 paths not 7ad\'s', refused(bent('S126', { first: '99.2000' })), 'true']);
  cases.push(['the gate takes a margin-0 node\'s first 4000 paths unlike 7ad\'s (its own tables)', String(gate(parse(good()), refA, ref7ad).length === 0 && good().includes('first4000 TS+J 99.4000')), 'true']);
  cases.push(['the gate refuses 7ad\'s node of another count than the first paths', String(gate(parse(good()), refA, () => ({ nodes: [{ simJ: 99.3, simO: 98.5, paths: 1000 }] })).length > 0), 'true']);
  cases.push(['the gate refuses a job with no 7ad job to compare', String(gate(parse(good()), refA, (id, a, w) => (id === 'S194' ? null : ref7ad(id, a, w))).length > 0), 'true']);
  cases.push(['the gate refuses a job with no 7aa unit to compare', String(gate(parse(good()), (id, a, w) => (id === 'S126' ? null : refA(id, a, w)), ref7ad).length > 0), 'true']);
  cases.push(['the gate refuses a missing decision-log year', sub('bridge 4', ['log READER/TS+J/M0/W0 OPEN0 year 10:', 'lg READER/TS+J/M0/W0 OPEN0 year 10:']), 'true']);
  cases.push(['the gate refuses a decision-log year 0 or 11', sub('S194', ['log OFF/TS+J/M0/W0.02 TS+J year 10:', 'log OFF/TS+J/M0/W0.02 TS+J year 11:']), 'true']);
  cases.push(['the gate refuses a decision-log year given twice', sub('S126', ['log READER/TS+J/M0/W0 TS+J year 3: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 0', `log READER/TS+J/M0/W0 TS+J year 3: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 0\n${''.padEnd(16)} log READER/TS+J/M0/W0 TS+J year 3: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 0`]), 'true']);
  cases.push(['the gate refuses a decision log whose leaves do not split consistently', refused(bent('bridge 4', { log: (rule, y) => (rule === 'OPEN0' && y === 4 ? { fwdHoldCellLeave: 11 } : null) })), 'true']);
  cases.push(['the gate refuses more leaves than paths held', refused(bent('S194', { log: (rule, y) => (rule === 'TS+J' && y === 2 ? { held: 75 } : null) })), 'true']);
  cases.push(['the gate refuses a margin hold at margin 0', sub('S126', ['log READER/TS+J/M0/W0 OPEN0 year 5: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 0', 'log READER/TS+J/M0/W0 OPEN0 year 5: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 1']), 'true']);
  cases.push(['the gate takes a margin hold at margin 1e-3', sub('S126', ['log READER/TS+J/M1e-3/W0 OPEN0 year 5: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 0', 'log READER/TS+J/M1e-3/W0 OPEN0 year 5: held 7000 fwdLeave 70 cellLeave 70 fwdHoldCellLeave 10 fwdLeaveCellHold 10 marginHold 1']), 'false']);
  cases.push(['the gate refuses more margin holds than holds (at margin 1e-3)', refused(bent('bridge 4', { log: (rule, y, L) => (rule === 'TS+J' && y === 6 && L.includes('/M1e-3/') ? { marginHold: 6931 } : null) })), 'true']);
  cases.push(['the gate takes as many margin holds as holds (at margin 1e-3)', refused(bent('bridge 4', { log: (rule, y, L) => (rule === 'TS+J' && y === 6 && L.includes('/M1e-3/') ? { marginHold: 6930 } : null) })), 'false']);
  cases.push(['the gate refuses a missing solve line (margin 0, whose table is compared with nothing)', sub('S194', ['solve OFF/TS+J/M0/W0.02: table', 'slve OFF/TS+J/M0/W0.02: table']), 'true']);
  cases.push(['the gate refuses a missing world line priced 0 (world 1)', sub('S126', ['world READER/TS+J/M0/W0 1', 'wrld READER/TS+J/M0/W0 1']), 'true']);
  cases.push(['the gate refuses a missing node line', sub('bridge 4', ['node READER/TS+J/M0/W0 0 z', 'nde READER/TS+J/M0/W0 0 z']), 'true']);
  // a fault in a ran line that 7aa's reference carries too (a wrong lookup): the ran line's own fields must catch it
  { const t = JOBS.map(([i, a, w]) => { const x = jobText(i, a, w); return i === 'S194' ? x.split(`bequestWeight ${w} `).join('bequestWeight 0 ') : x; }).join('\n');
    const ref = (i, a, w) => { const r = refA(i, a, w); return i === 'S194' ? { ...r, ran: r.ran.replace(`bequestWeight ${w} `, 'bequestWeight 0 ') } : r; };
    cases.push(['the gate refuses a solve at another estate weight (7aa\'s reference too)', String(gate(parse(t), ref, ref7ad).length > 0), 'true']); }
  cases.push(['the gate refuses more paths held than run', refused(bent('S194', { log: (rule, y) => (rule === 'TS+J' && y === 1 ? { held: WN + 1 } : null) })), 'true']);
  cases.push(['the gate refuses a line given twice (a solve)', sub('bridge 4', ['solve READER/TS+J/M0/W0: table 99.6000 secs 1', `solve READER/TS+J/M0/W0: table 99.6000 secs 1\n${''.padEnd(16)} solve READER/TS+J/M0/W0: table 99.6000 secs 1`]), 'true']);
  cases.push(['the gate refuses a missing done line', sub('S126', ['done READER/W0', 'dne READER/W0']), 'true']);
  cases.push(['the gate refuses job line settings not the registered ones', sub('S194', [`lambda ${LAMBDA} tier own`, 'lambda 0.03 tier own']), 'true']);
  // the trace checks
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = (sim, m = '0') => ({ stamp: ST, N: WN, seed: 7002, arm: `READER/TS+J/M${m}/W0/world0`, sim });
    cases.push(['a trace agrees with the log to its four decimals, and not beyond, and at its own margin', `${traceAgrees(t(99.30004), ST, 'READER', '0', 'TS+J', '0', 99.3)} ${traceAgrees(t(99.3001), ST, 'READER', '0', 'TS+J', '0', 99.3)} ${traceAgrees(t(99.3, '1e-3'), ST, 'READER', '0', 'TS+J', '0', 99.3)}`, 'true false false']); }
  cases.push(['the trace name is registered', traceName('bridge 4', 'READER', '1e-3', 'OPEN0', '0'), 'bridge_4-reader-m1e-3-open0-world0@w0.json.gz']);
  cases.push(['the first paths\' bits compared path by path', `${sameFirst(Uint8Array.from([1, 0, 1, 1]), Uint8Array.from([1, 0, 1, 0]), 3)} ${sameFirst(Uint8Array.from([1, 0, 1, 1]), Uint8Array.from([1, 1, 1, 1]), 3)} ${sameFirst(Uint8Array.from([1, 0]), Uint8Array.from([1, 0]), 3)}`, 'true false false']);
  // logAgrees on a four-path, four-year trace: path 0 holds throughout; path 1 leaves in year 1; path 2 fails in year 2 holding;
  // path 3 leaves in year 2 then returns to the plan's tiers in year 3
  { const T = { N: 4, Y: 4, tier: Uint8Array.from([0, 0, 0, 0, 0, 8, 8, 8, 0, 0, 0, 0, 0, 0, 8, 0]), failYear: Int16Array.from([-1, -1, 2, -1]) };
    const lg = [null, { held: 4, fwdLeave: 1 }, { held: 3, fwdLeave: 1 }, { held: 1, fwdLeave: 0 }];
    const run = x => logAgrees(T, x).filter(s => !/^year ([4-9]|10):/.test(s)).length;
    cases.push(['the log against the trace: the held and leaves as the trace says (the year-2 failure may count as either)', `${run(lg)} ${run([null, lg[1], { held: 3, fwdLeave: 2 }, lg[3]])}`, '0 0']);
    cases.push(['the log against the trace: a held count off by one is refused', String(run([null, lg[1], { held: 2, fwdLeave: 1 }, lg[3]])), '1']);
    cases.push(['the log against the trace: fewer leaves than traced is refused', String(run([null, { held: 4, fwdLeave: 0 }, lg[2], lg[3]])), '1']);
    cases.push(['the log against the trace: a path back in the plan\'s tiers is held again (year 3 held 1 is path 0 alone, path 3 at 8 after year 2)', String(run([null, lg[1], lg[2], { held: 2, fwdLeave: 0 }])), '1']); }
  // pooled: two units on the same paths moving together widen the interval against two moving apart
  { const mk = diff => ({ N: diff.length, diff, saved: diff.filter(x => x > 0).length, lost: diff.filter(x => x < 0).length }), n = 400;
    const a = mk(Array.from({ length: n }, (_, i) => (i < 20 ? 1 : i < 24 ? -1 : 0))), same = mk(a.diff.slice()), apart = mk(Array.from({ length: n }, (_, i) => (i >= 380 ? 1 : i >= 376 ? -1 : 0)));
    const ps = pooled([a, same]), pa = pooled([a, apart]);
    cases.push(['pooled: the same sum either way, a wider interval where the units share their paths', `${ps.d.toFixed(3)} ${pa.d.toFixed(3)} ${ps.se > pa.se}`, '8.000 8.000 true']); }
  // the items on planted stories
  const mkP = spec => (id, m) => { const s = spec[`${id}|${m}`] || {}; return { worlds: [{ surv: s.p0 !== undefined ? s.p0 : 0.5 }], moves: { chosen: s.keeps ? 3 : 12, stay: 3 } }; };
  const mkK = spec => (id, m) => { const [saved, lost] = spec[`${id}|${m}`] || [48, 8]; const diff = new Int8Array(WN); for (let i = 0; i < saved; i++) diff[i] = 1; for (let i = 0; i < lost; i++) diff[WN - 1 - i] = -1; return { saved, lost, N: WN, diff }; };
  // a log spec: a number (one-way a year of 1000 held) or { x, r, h } (one-way, reverse, held a year)
  const mkL = spec => (id, m, rule) => Array.from({ length: YEARS + 1 }, (_, y) => { if (y === 0) return null; const v = spec[`${id}|${m}|${rule}`] || 0, o = typeof v === 'number' ? { x: v } : v; return { held: o.h !== undefined ? o.h : 1000, fwdHoldCellLeave: o.x || 0, fwdLeaveCellHold: o.r || 0 }; });
  // realised 0.5 points a unit (48 saved, 8 lost of 8000), pooled 1.5
  const right = { 'bridge 4|0': { p0: 0.5 }, 'S194|0': { p0: 0.5 }, 'S126|0': { p0: 0.5 } }, low = { 'bridge 4|0': { p0: 0.25 }, 'S194|0': { p0: 0.3 }, 'S126|0': { p0: 0.3 } };
  const chain = { 'bridge 4|1e-3|OPEN0': 150, 'S194|1e-3|OPEN0': 120, 'S126|1e-3|OPEN0': 100 }, none = { 'bridge 4|1e-3|OPEN0': 10, 'S194|1e-3|OPEN0': 5, 'S126|1e-3|OPEN0': 0 };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['the margin is the cause: priced right at margin 0, the chain seen: all HELD', outs(items(mkP(right), mkK({}), mkL(chain))), '1 HELD, 2 HELD, 3 HELD']);
  cases.push(['nothing moves at margin 0 and no chain: all FALSIFIED', outs(items(mkP(low), mkK({}), mkL(none))), '1 FALSIFIED, 2 FALSIFIED, 3 FALSIFIED']);
  cases.push(['item 1 at 0.85: a ratio of 0.8 is INCONCLUSIVE', items(mkP({ 'bridge 4|0': { p0: 0.4 }, 'S194|0': { p0: 0.4 }, 'S126|0': { p0: 0.4 } }), mkK({}), mkL(chain))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 needs the price at or above the lower end: a ratio of 0.9 below a narrow interval is INCONCLUSIVE', items(mkP({ 'bridge 4|0': { p0: 9 }, 'S194|0': { p0: 9 }, 'S126|0': { p0: 9 } }), mkK({ 'bridge 4|0': [800, 0], 'S194|0': [800, 0], 'S126|0': [800, 0] }), mkL(chain))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 falsified below 0.75, not 0.85: a ratio of 0.8 below the lower end is INCONCLUSIVE', items(mkP({ 'bridge 4|0': { p0: 8 }, 'S194|0': { p0: 8 }, 'S126|0': { p0: 8 } }), mkK({ 'bridge 4|0': [800, 0], 'S194|0': [800, 0], 'S126|0': [800, 0] }), mkL(chain))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 falsified needs the price below the lower end too: a ratio of 0.6 inside a wide interval is INCONCLUSIVE', items(mkP({ 'bridge 4|0': { p0: 0.06 }, 'S194|0': { p0: 0.06 }, 'S126|0': { p0: 0.06 } }), mkK({ 'bridge 4|0': [10, 2], 'S194|0': [10, 2], 'S126|0': [10, 2] }), mkL(chain))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 is not measured where a unit keeps the held tiers at margin 0: INCONCLUSIVE', items(mkP({ ...right, 'S126|0': { p0: 0.5, keeps: true } }), mkK({}), mkL(chain))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 reads margin 0, not 1e-3: priced right at 1e-3 alone is FALSIFIED', items(mkP({ ...low, 'bridge 4|1e-3': { p0: 0.5 }, 'S194|1e-3': { p0: 0.5 }, 'S126|1e-3': { p0: 0.5 } }), mkK({}), mkL(chain))[0].outcome, 'FALSIFIED']);
  cases.push(['item 1 with no realised gain: INCONCLUSIVE', items(mkP(right), mkK({ 'bridge 4|0': [5, 5], 'S194|0': [5, 5], 'S126|0': [5, 5] }), mkL(chain))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 at 10%: a pooled share of 7% is INCONCLUSIVE', items(mkP(right), mkK({}), mkL({ 'bridge 4|1e-3|OPEN0': 70, 'S194|1e-3|OPEN0': 70, 'S126|1e-3|OPEN0': 70 }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 falsified below 2%, not 5%: a pooled share of 3% is INCONCLUSIVE', items(mkP(right), mkK({}), mkL({ 'bridge 4|1e-3|OPEN0': 30, 'S194|1e-3|OPEN0': 30, 'S126|1e-3|OPEN0': 30 }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 reads OPEN0 at 1e-3, not TS+J or margin 0: the chain on those alone is FALSIFIED', items(mkP(right), mkK({}), mkL({ 'bridge 4|1e-3|TS+J': 200, 'S194|0|OPEN0': 200, 'S126|0|OPEN0': 200 }))[1].outcome, 'FALSIFIED']);
  cases.push(['item 2 reads years 1 to 7 only: a chain in years 8 to 10 alone is FALSIFIED', (() => { const L = (id, m, rule) => Array.from({ length: YEARS + 1 }, (_, y) => (y === 0 ? null : { held: 1000, fwdHoldCellLeave: m === '1e-3' && rule === 'OPEN0' && y >= 8 ? 900 : 0, fwdLeaveCellHold: 0 })); return items(mkP(right), mkK({}), L)[1].outcome; })(), 'FALSIFIED']);
  { const o = (x, r, gx, gh) => items(mkP(right), mkK({}), mkL(Object.fromEntries(JOBS.flatMap(([id]) => [[`${id}|1e-3|OPEN0`, { x, r }], [`${id}|0|OPEN0`, { x: gx, h: gh }]]))))[1].outcome;
    cases.push(['item 2 net of the reverse share: one-way 12% against reverse 9% is INCONCLUSIVE, not HELD', o(120, 90, 0, 1000), 'INCONCLUSIVE']);
    cases.push(['item 2 net of margin 0\'s share (the grid alone): one-way 12% against 11% at margin 0 is FALSIFIED', o(120, 0, 110, 1000), 'FALSIFIED']);
    cases.push(['item 2 needs 5 points net: one-way 12%, reverse 6% is HELD; reverse 8% INCONCLUSIVE', `${o(120, 60, 0, 1000)} ${o(120, 80, 0, 1000)}`, 'HELD INCONCLUSIVE']);
    cases.push(['item 2 leaves margin 0 out where it holds under 1000 path-years (840 here): one-way 12% against 12% there is HELD', o(120, 0, 5, 40), 'HELD']);
    cases.push(['item 2 counts margin 0 where it holds 1000 path-years or more (1050 here): one-way 12% against 12% there is FALSIFIED', o(120, 0, 6, 50), 'FALSIFIED']); }
  // item 1's attribution
  { const mkKR = spec => (id, rule) => { const [saved, lost] = spec[`${id}|${rule}`] || [0, 0]; const diff = new Int8Array(WN); for (let i = 0; i < saved; i++) diff[i] = 1; for (let i = 0; i < lost; i++) diff[WN - 1 - i] = -1; return { saved, lost, N: WN, diff }; };
    const low3 = Object.fromEntries(JOBS.map(([id]) => [`${id}|1e-3`, { p0: 0.3 }])), at = (p0m0, kr) => attribution(mkP({ ...low3, ...Object.fromEntries(JOBS.map(([id]) => [`${id}|0`, { p0: p0m0 }])) }), mkK({}), mkKR(kr || {}));
    const flags = a => `${a.priceRose} ${a.open0Rose} ${a.tsjFell}`;
    cases.push(['attribution: the price up 0.2 a unit (0.6 of a 0.6 mispricing) is the tables\' under-value', flags(at(0.5)), 'true false false']);
    cases.push(['attribution: the price up by less than a quarter of the mispricing (0.09 of 0.6) is not credited', flags(at(0.33)), 'false false false']);
    cases.push(['attribution: OPEN0 up 40 paths a unit is the continuation', flags(at(0.3, Object.fromEntries(JOBS.map(([id]) => [`${id}|OPEN0`, [40, 0]])))), 'false true false']);
    cases.push(['attribution: OPEN0 up inside its interval (2 paths a unit) is not credited', flags(at(0.3, Object.fromEntries(JOBS.map(([id]) => [`${id}|OPEN0`, [2, 0]])))), 'false false false']);
    cases.push(['attribution: TS+J down 40 paths a unit alone attributes nothing', String(at(0.3, Object.fromEntries(JOBS.map(([id]) => [`${id}|TS+J`, [0, 40]]))).reading.startsWith('TS+J fell at margin 0 alone')), 'true']);
    cases.push(['attribution: TS+J down with the price up names the tables, TS+J beside', ((a) => `${flags(a)} ${a.reading.includes('the 0.001 tables under-value') && a.reading.includes('TS+J fell at margin 0 too')}`)(at(0.5, Object.fromEntries(JOBS.map(([id]) => [`${id}|TS+J`, [0, 40]])))), 'true false true true']); }
  cases.push(['item 3 at the 0.05 interval, not 0.025: a price between the two lower ends is FALSIFIED', (() => { const lo5 = survivalChange(8, 48, WN, 0.05).lo, lo25 = survivalChange(8, 48, WN, 0.025).lo; return items(mkP({ ...right, 'bridge 4|0': { p0: (lo5 + lo25) / 2 } }), mkK({}), mkL(chain))[2].outcome; })(), 'FALSIFIED']);
  cases.push(['item 3 below the interval with the ratio at 0.8 is INCONCLUSIVE', items(mkP({ ...right, 'bridge 4|0': { p0: 8 } }), mkK({ 'bridge 4|0': [800, 0] }), mkL(chain))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['item 3 reads bridge 4 alone: S194 low with bridge 4 right is HELD', items(mkP({ ...right, 'S194|0': { p0: 0.1 } }), mkK({}), mkL(chain))[2].outcome, 'HELD']);
  cases.push(['item 3 where bridge 4 keeps the held tiers at margin 0: INCONCLUSIVE', items(mkP({ ...low, 'bridge 4|0': { p0: 0.1, keeps: true } }), mkK({}), mkL(chain))[2].outcome, 'INCONCLUSIVE']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every node run's two traces, checked against the log (count, seed, arm, stamp, survival) and the decision log;
   at margin 1e-3 their first paths' survived bits against 7ad's world-0 30x5 traces (`DIR7AD`, stamped `ST7AD`). `bad` gains
   every refusal. Returns the decoded traces by `${id}|${m}|${rule}`. */
export function loadTraces(jobs, DIR, ST, bad, DIR7AD, ST7AD, wn = WN) {
  const TR = {};
  for (const j of jobs) for (const mg of MARGINS) { const u = j.tags[mg]; for (const [rule, sim] of [['TS+J', u.node.simJ], ['OPEN0', u.node.simO]]) {
    const f = join(DIR, traceName(j.id, j.arm, mg, rule, j.w));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const t = readTrace(f);
    if (!traceAgrees(t, ST, j.arm, mg, rule, j.w, sim, wn)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const T = decode(t);
    for (const x of logAgrees(T, u.log[rule])) bad.push(`${f}: the decision log against the trace, ${x}`);
    if (mg === '1e-3') {
      const n = Math.min(FIRST, wn), f7 = join(DIR7AD, D.traceName(j.id, j.arm, '30x5', rule, 0, j.w));
      if (!existsSync(f7)) bad.push(`no 7ad trace ${f7}`);
      else { const t7 = readTrace(f7);
        if (!D.traceAgrees(t7, ST7AD, j.arm, '30x5', rule, 0, j.w, t7.sim, n)) bad.push(`${f7}: 7ad's trace not stamped, counted or armed as 7ad's reducer reads it`);
        else if (!sameFirst(T.survived, decode(t7).survived, n)) bad.push(`${f}: its first ${n} paths' survival is not 7ad's, path by path`); }
    }
    TR[`${j.id}|${mg}|${rule}`] = T;
  } }
  return TR;
}
/* THE READING, after every gate has passed (the preflight runs it over its own tiny logs) */
export function reading(jobs, TR, out = console.log, wn = WN) {
  const P = (id, m) => jobs.find(j => j.id === id).tags[m];
  const K = (id, m) => { const O = TR[`${id}|${m}|OPEN0`].survived, J = TR[`${id}|${m}|TS+J`].survived, k = cells(O, J), diff = new Int8Array(O.length); for (let i = 0; i < O.length; i++) diff[i] = J[i] - O[i]; return { ...k, diff }; };
  const LOGS = (id, m, rule) => P(id, m).log[rule];
  const KR = (id, rule) => { const a = TR[`${id}|1e-3|${rule}`].survived, b = TR[`${id}|0|${rule}`].survived, k = cells(a, b), diff = new Int8Array(a.length); for (let i = 0; i < a.length; i++) diff[i] = b[i] - a[i]; return { ...k, diff }; };
  out(`7AE: THE BAD NODE AT MARGIN 0 - DOES THE PER-YEAR SWITCH MARGIN MAKE THE TABLES PRICE THE BAD WORLD'S DE-RISK BELOW WHAT IT REALISES? (predictions/diag-7ae.md; ${N} paths of seed ${SEED}, ${wn} at world 0's node; the fair-test gates passed: the stamps, 7aa's, 7ac's and 7ad's gates, 7ae's gate against them - its 1e-3 solves 7aa's, its 1e-3 node runs' first ${Math.min(FIRST, wn)} paths 7ad's path by path - every node trace, and the decision log against its trace)\n`);
  out('EVERY UNIT AT BOTH MARGINS: the table, the year-0 gap, world 0\'s like-for-like survival price of the opening, and at world 0\'s node TS+J against OPEN0 (saved/lost, the survival difference in points with its exact 95% interval at 0.05) and the ratio price / realised');
  for (const [id, arm, w] of JOBS) for (const m of MARGINS) {
    const u = P(id, m), k = K(id, m), iv = survivalChange(k.lost, k.saved, k.N, ALPHA3);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} M${m}`.padEnd(28)} table ${u.table} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0}) ${leaves(u) ? 'leaves' : 'KEEPS the held tiers'} | price ${u.worlds[0].surv.toFixed(3)} | ${k.saved}/${k.lost} ${f3(iv.d)} (${iv.lo.toFixed(3)} to ${iv.hi.toFixed(3)}) | ratio ${iv.d > 0 ? (u.worlds[0].surv / iv.d).toFixed(2) : 'n/a'} | node TS+J ${u.node.simJ.toFixed(2)} OPEN0 ${u.node.simO.toFixed(2)}`);
  }
  out('\nPOOLED OVER THE THREE UNITS (Σ price against Σ realised, the interval from the per-path sums: the units share their paths)');
  for (const m of MARGINS) { const pl = pooled(JOBS.map(([id]) => K(id, m))), sp = JOBS.reduce((t, [id]) => t + P(id, m).worlds[0].surv, 0); out(`  M${m.padEnd(5)} Σ price ${sp.toFixed(3)} Σ realised ${f3(pl.d)} (${pl.lo.toFixed(3)} to ${pl.hi.toFixed(3)}, se ${pl.se.toFixed(3)}) ratio ${pl.d > 0 ? (sp / pl.d).toFixed(2) : 'n/a'}`); }
  { const at = m => ({ sp: JOBS.reduce((t, [id]) => t + P(id, m).worlds[0].surv, 0), sd: pooled(JOBS.map(([id]) => K(id, m))).d }), a = at('1e-3'), b = at('0');
    out(`  which side moved from 1e-3 to 0: Σ price ${f3(b.sp - a.sp)}, Σ realised ${f3(b.sd - a.sd)} (a ratio can close by the price rising or the realised falling; the prediction says how each is read)`); }
  out('\nTHE DECISION LOG: by year, among the paths holding the plan\'s tiers at its start - held, the forward move leaving, the nearest cell\'s stored move leaving, forward holds while the cell leaves, forward leaves while the cell holds, the margin alone holding');
  for (const [id, arm, w] of JOBS) for (const m of MARGINS) for (const rule of RULES) {
    const lg = LOGS(id, m, rule);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} M${m} ${rule}`.padEnd(34)} ${Array.from({ length: YEARS }, (_, i) => { const g = lg[i + 1]; return `y${i + 1} ${g.held}/${g.fwdLeave}/${g.cellLeave}/${g.fwdHoldCellLeave}/${g.fwdLeaveCellHold}/${g.marginHold}`; }).join(' ')}`);
  }
  out('\nO47, THE YEARLY FIRST-LEAVE SHARE AT THE NODE: the per cent of the node run\'s paths first leaving the plan\'s tiers in years 0 to 7, OPEN0 then TS+J');
  for (const [id, arm, w] of JOBS) for (const m of MARGINS) for (const rule of ['OPEN0', 'TS+J']) {
    const T = TR[`${id}|${m}|${rule}`], f = firstLeave(T);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} M${m} ${rule}`.padEnd(34)} ${f.map(x => (100 * x / T.N).toFixed(1).padStart(5)).join(' ')}`);
  }
  const it = items(P, K, LOGS);
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const x of it) {
    out(`${x.n}. ${x.text}: ${x.outcome}`);
    if (x.n === 1) { out(`     Σ price ${x.sp.toFixed(3)} against Σ realised ${f3(x.pooled.d)} (${x.pooled.lo.toFixed(3)} to ${x.pooled.hi.toFixed(3)}): ratio ${Number.isFinite(x.ratio) ? x.ratio.toFixed(3) : 'n/a'}${x.measured ? '' : ' - not measured (a unit keeps the held tiers at margin 0, or no realised gain)'}`); for (const l of x.legs) out(`     ${l.id}: price ${l.price.toFixed(3)} realised ${f3(l.d)}${l.leaves ? '' : ' (keeps the held tiers)'}`); }
    if (x.n === 2) { out(`     pooled one-way ${x.hc} of ${x.held} held path-years: ${(100 * x.share).toFixed(2)}%; reverse ${(100 * x.rev).toFixed(2)}%; at margin 0 ${x.grid === null ? `not measured (${x.gridHeld} held path-years, under ${MIN_GRID_PY})` : `${(100 * x.grid).toFixed(2)}% (${x.gridHeld} held path-years)`}; net excess ${(100 * x.net).toFixed(2)} points`); for (const l of x.legs) out(`     ${l.id}: one-way ${l.fwdHoldCellLeave}, reverse ${l.fwdLeaveCellHold}, of ${l.held} (${(100 * l.share).toFixed(2)}%)`); }
    if (x.n === 3) { const l = x.legs[0]; out(`     bridge 4: price ${l.price.toFixed(3)} against ${f3(l.iv.d)} (${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}), ratio ${Number.isFinite(l.ratio) ? l.ratio.toFixed(3) : 'n/a'}${l.leaves ? '' : ' (keeps the held tiers)'}`); }
  }
  // item 1's registered attribution: each rule's paired change from 1e-3 to 0 on the same node paths
  { const at = attribution(P, K, KR), iv = d => `${f3(d.d)} (${d.lo.toFixed(3)} to ${d.hi.toFixed(3)})`;
    out(`\nITEM 1'S ATTRIBUTION (registered: which side closed the ratio): Σ price ${at.priceBefore.toFixed(3)} -> ${at.priceAfter.toFixed(3)} (the 1e-3 mispricing ${at.miss.toFixed(3)}; risen by a quarter of it or more: ${at.priceRose ? 'yes' : 'no'}); OPEN0 from 1e-3 to 0 ${iv(at.dO)} (rose: ${at.open0Rose ? 'yes' : 'no'}); TS+J from 1e-3 to 0 ${iv(at.dJ)} (fell: ${at.tsjFell ? 'yes' : 'no'})`);
    for (const [id] of JOBS) for (const rule of RULES) { const k = KR(id, rule), c = survivalChange(k.lost, k.saved, k.N, ALPHA3); out(`     ${id} ${rule}: ${k.saved}/${k.lost} ${f3(c.d)} (${c.lo.toFixed(3)} to ${c.hi.toFixed(3)})`); }
    out(`     reading (${it[0].outcome === 'HELD' ? 'item 1 HELD' : `item 1 ${it[0].outcome}: reported only`}): ${at.reading}`); }
  // reported: the one-way share at 1e-3 by year's parity (the review's "alternate years")
  { const par = odd => { let h = 0, x = 0; for (const [id] of JOBS) { const lg = LOGS(id, '1e-3', 'OPEN0'); for (let y = 1; y <= LOGYEARS; y++) if ((y % 2 === 1) === odd) { h += lg[y].held; x += lg[y].fwdHoldCellLeave; } } return h ? `${(100 * x / h).toFixed(2)}% of ${h}` : 'none held'; };
    out(`\nREPORTED: the one-way share at 1e-3 by year's parity, years 1 to 7 pooled: odd years ${par(true)}, even years ${par(false)}`); }
  // reported: the cause-2 signature at margin 0
  const r0 = id => { const u = P(id, '0'), k = K(id, '0'), d = 100 * (k.saved - k.lost) / k.N; return d > 0 ? u.worlds[0].surv / d : NaN; };
  const sig = r0('S194') >= 0.85 && r0('bridge 4') < 0.65 && r0('S126') < 0.65;
  out(`\nREPORTED: the cause-2 signature at margin 0 (S194's ratio at least 0.85, bridge 4's and S126's below 0.65): ${sig ? 'seen' : 'not seen'} (ratios bridge 4 ${r0('bridge 4').toFixed(2)}, S194 ${r0('S194').toFixed(2)}, S126 ${r0('S126').toFixed(2)})`);
  out(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  return it;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ae'), DIR7AD = args[1] || join(HERE, 'results', 'diag7ad'), DIR7AC = args[2] || join(HERE, 'results', 'diag7ac'), DIR7AA = args[3] || join(HERE, 'results', 'diag7aa');
  // 7aa: its stamps and its own gate
  const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
  requireFairLogs(logsA, A.PRED);
  { const badA = A.gate(unitsA); if (badA.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${badA.join('\n  ')}`); process.exit(1); } }
  const refAll = (id, arm, tag, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
  // 7ac: its stamps and its own gate against 7aa (7ad's gate reads it)
  const logsC = logsOf(DIR7AC), unitsC = Object.values(logsC).flatMap(C.parse);
  requireFairLogs(logsC, C.PRED);
  { const refOf = tag => (id, arm, w) => refAll(id, arm, tag, w), badC = C.gate(unitsC, refOf('TS+J'), refOf('PRODUCT')); if (badC.length) { console.log(`FAIR-TEST GATE (7ac): FAILED\n  ${badC.join('\n  ')}`); process.exit(1); } }
  const refC = (id, arm, w) => unitsC.find(u => u.id === id && u.arm === arm && u.w === w) || null;
  // 7ad: its stamps and its own gate against 7aa and 7ac
  const logsD = logsOf(DIR7AD), jobsD = Object.values(logsD).flatMap(D.parse);
  requireFairLogs(logsD, D.PRED);
  { const badD = D.gate(jobsD, refAll, refC); if (badD.length) { console.log(`FAIR-TEST GATE (7ad): FAILED\n  ${badD.join('\n  ')}`); process.exit(1); } }
  const ref7ad = (id, arm, w) => { const j = jobsD.find(x => x.id === id && x.arm === arm && x.w === w && x.grid === '30x5'); return j ? j.tags['TS+J'] : null; };
  // 7ae
  const logsE = logsOf(DIR), jobs = Object.values(logsE).flatMap(parse);
  if (JOBS.some(([id, a, w]) => !jobs.some(j => j.id === id && j.arm === a && j.w === w && j.done))) { console.log(`INCOMPLETE - ${jobs.filter(j => j.done).length} of ${JOBS.length} jobs done in ${DIR}`); process.exit(1); }
  requireFairLogs(logsE, PRED);
  const bad = gate(jobs, (id, arm, w) => refAll(id, arm, 'TS+J', w), ref7ad), STE = stampOf(logsE);
  const TR = bad.length ? {} : loadTraces(jobs, DIR, STE, bad, DIR7AD, stampOf(logsD));
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(jobs, TR);
}
