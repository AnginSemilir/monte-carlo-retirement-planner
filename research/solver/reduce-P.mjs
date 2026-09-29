/*
 * THE P REDUCER: THE SWITCH CHARGED IN BOTH PASSES (predictions/diag-p.md; PLAN.md P; the deep review after 7ag,
 * deep-review-log.md 29 Sep 11:30 UK, whose amendments this design carries). Reads results/diagP/case*.txt (batch-P.sh:
 * audit-s126.mjs diagP, 40 jobs) beside 7aa's, 7ae's, 7ad's, 7af's and 7ag's records, each read only through its own
 * reducer's gate (7ae's through 7aa's, 7ac's and 7ad's; 7af's through 7aa's; 7ag's beside 7af's). Every arm the items read is
 * P's own, on the same paths; 7ae (the node) and 7aa (all worlds) are the identity references for settings 0 and 1e-3.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) and 7aa's, 7ac's, 7ad's, 7ae's, 7af's and 7ag's own gates;
 *   - every registered job once and done: core, one a unit and setting (7ae's three units at 30x5; settings P, 0 and 1e-3),
 *     grid (bridge 4, S194 and share 0.95 at 30x15 and 60x5, P), open (the 25 households 7af and 7ag read, the bundle's
 *     unit, P); each tag with its solve, ran, gap, joint, moves, price and three world lines, and a core tag its node line,
 *     ten decision-log lines a node rule and its all-world line;
 *   - the ran line is its reference's, its path count this run's, with the settings named at its end: core P 7ae's
 *     margin-0 ran line and " switchCharge 0.001"; core 0 and 1e-3 7ae's ran lines at those margins; grid 7ad's TS+J ran
 *     line at that grid (share 0.95: 7af's CAND ran line with the grid's points and return points) and open 7af's or 7ag's
 *     CAND ran line, each with " switchMargin 0 switchCharge 0.001"; the joint line says the margin (0.001 at 1e-3, else 0)
 *     and the charge (0 but at P), a joint solve, no pension death charge (the scorer has none: O53), the reference's scale
 *     and cap;
 *   - SETTINGS 0 AND 1E-3 ARE 7AE'S SOLVES: their tables, gaps, openings, moves, prices and world lines are 7ae's; on the
 *     node's first 8,000 paths their TS+J and OPEN0 runs' survival is 7ae's traces', path by path; and the 1e-3 all-world
 *     run's survival is 7aa's TS+J unit's, path by path (the code changed: the charge option; the path count doubled);
 *   - OPEN2's pair is the one 7ae's TS+J opened in at 1e-3 on all three units (2/2);
 *   - the moves: the opening holds the plan's tiers, STAY keeps them, the chosen move is BEST at margin 0 (at 1e-3 BEST where
 *     it leaves, STAY where it keeps), BEST equals STAY where the gap is 0 and leaves where it is above 0; the price: where
 *     the gap is above 0 the mixture's uncharged price is the gap plus the charge (x100) and the like-for-like sum is the
 *     mixture's; where the gap is 0 the like-for-like price is 0 and the mixture's at most the charge; the world lines sum
 *     to the price line;
 *   - the node: the registered paths at world 0's node (7ae's); OPEN0 holds the plan's tiers and OPEN2 leaves them on every
 *     path, TS+J as its chosen move says; the decision log consistent year by year (7ae's checks) and against each trace
 *     (reduce-7ae.mjs logAgrees); the all-world run on the registered paths, TS+J as its chosen move says; every trace's
 *     count, seed, arm, stamp and survival the log's.
 * THE ITEMS, by the registered rule (pooled: 7ae's interval over the per-path sums of the three units, their shared paths
 * counted, 95%):
 *   1. From the plan's tiers, P's continuation is near margin 0's, not fallen back toward 1e-3's: pooled OPEN0/P less
 *      OPEN0/M0. HELD if the lower end is above -M1; FALSIFIED if the upper end is below -M1. M1 = 0.35, half 7ae's pooled
 *      OPEN0 shift from 1e-3 to 0 (+0.713).
 *   2. From the de-risked opening, P's continuation is near 1e-3's, not fallen as at margin 0 (O50's harm at equal
 *      openings): pooled OPEN2/P less OPEN2/1e-3. HELD if the lower end is above -M2; FALSIFIED if the upper end is below
 *      -M2. M2 = 0.23, half 7ae's pooled TS+J fall (-0.462; TS+J opened in the pair at both margins).
 *   3. O50's harm by the whole score, S194 at the node: OPEN2/P against OPEN2/1e-3 (reduce-7aa.mjs wholeLeg at 0.05). HELD if
 *      the lower end is above -MW; FALSIFIED if the upper end is below -MW; MW = 0.25.
 *   4. O50 across all worlds (the world-blind chooser's trade), S194: TS+J/M0 against TS+J/1e-3 by the whole score. HELD
 *      (the bad world's loss bought back elsewhere) if the lower end is above -MW; FALSIFIED (a loss the mixture does not buy
 *      back) if the upper end is below -MW.
 *   5. P across all worlds does no material harm: TS+J/P against TS+J/1e-3 on the three units, survival by the exact rule
 *      with Holm across 3 at 0.25 (HELD needs the guarded unconditional interval's lower end above -0.25 too) AND the whole
 *      score's lower end above -MW. HELD if every unit passes both; FALSIFIED if any reads harm (exact, Holm) or its whole
 *      score's upper end is below -MW; else INCONCLUSIVE.
 *   6. P's opening does not flip with the grid: the chosen year-0 tiers at 30x5, 30x15 and 60x5 one, on bridge 4, S194 and
 *      share 0.95. HELD if so on all three; FALSIFIED if not on all three; else INCONCLUSIVE.
 *   7. The mechanism (O49's comparator): on OPEN0/P's node runs, years 1 to 7 pooled over the three units, the share of
 *      path-years holding the plan's tiers where the forward move holds and the nearest cell's stored move leaves, net of
 *      the reverse share. HELD (P's forward agrees with its cells: the one-way disagreement at 1e-3 was the margin's) if the
 *      net is below 2 points; FALSIFIED (the grid's own disagreement) at 5 points or more; INCONCLUSIVE between, or where
 *      OPEN0/P holds fewer than MIN_PY path-years.
 * Reported, not items: every core unit's lines and survival by rule; the churn by year band (1-5, 6-25, 26 on), switches and
 * riskier moves a path, every rule and setting; the world-aware 2x2 at the node; the 1e-3 decision log's net (7ae's item 2
 * on these paths); the pooled price / realised ratio at P beside margin 0's; the openings on the 25 against the bundle's,
 * with share 0.95's registered branch for the Q decision (read only if item 6's share 0.95 leg is stable); solve seconds.
 *   node research/solver/reduce-P.mjs [dirP] [dir7ae] [dir7ad] [dir7ac] [dir7aa] [dir7af] [dir7ag] > research/solver/results-P.txt
 *   node research/solver/reduce-P.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { survivalChangeU, mcnemarHarmP, holm, outcome } from './stats.mjs';
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
export const PRED = 'research/solver/predictions/diag-p.md';
export const { LAMBDA, field } = A;
export const N = 16000, WN = 16000, NA = 8000, SEED = '7002', CHARGE = '0.001', Z95 = 1.959963984540054, ALPHA = 0.05;
// the margins: half 7ae's own pooled shifts from 1e-3 to 0 (OPEN0 +0.713, TS+J -0.462; results-7ae.txt; derive-P.mjs); the
// whole score's and item 5's survival margin the regimen's 0.25
export const M1 = 0.35, M2 = 0.23, MW = 0.25, M5 = 0.25;
export const YEARS = 10, LOGYEARS = 7, MIN_PY = 1000, NET_HELD = 0.02, NET_FALSE = 0.05;
export const { PRICE_TOL, LFL_TOL, SIM_TOL, WTOL } = D;
export const CORE = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02'], ['S126', 'READER', '0']];
export const GRIDS = [['bridge 4', 'READER', '0', '30x15'], ['S194', 'OFF', '0.02', '30x15'], ['share 0.95', 'READER', '0.02', '30x15'], ['bridge 4', 'READER', '0', '60x5'], ['S194', 'OFF', '0.02', '60x5'], ['share 0.95', 'READER', '0.02', '60x5']];
export const OPENS = [...F.PANEL, ...G.PANEL].map(([id]) => id);
export const SETTINGS = ['P', '0', '1e-3'];
export const JOBS = [...SETTINGS.flatMap(m => CORE.map(([id, a, w]) => [`core:${m}`, id, a, w, '30x5'])), ...GRIDS.map(([id, a, w, g]) => ['grid', id, a, w, g]), ...OPENS.map(id => ['open', id, 'READER', '0.02', '30x5'])];
export const RULES = ['TS+J', 'OPEN0', 'OPEN2', 'WA'];
export const DERISK = [2, 2];
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
const NODEL = new RegExp(`^\\s+node ${LBL} 0 z (\\S+): TS\\+J (\\S+) held0 (\\d+) OPEN0 (\\S+) held0 (\\d+) OPEN2 (\\S+) held0 (\\d+) WA (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`);
const LOGL = new RegExp(`^\\s+log ${LBL} (TS\\+J|OPEN0|OPEN2|WA) year (\\d+): held (\\d+) fwdLeave (\\d+) cellLeave (\\d+) fwdHoldCellLeave (\\d+) fwdLeaveCellHold (\\d+) marginHold (\\d+)$`);
const ALLL = new RegExp(`^\\s+all ${LBL}: TS\\+J (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`);

export function parse(text) {
  const jobs = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { kind: m[2], id: m[1].trim(), arm: m[3], grid: m[4], w: m[5], lambda: m[6], tier: m[7], riskAbove: m[8], mix: m[9], points: +m[10], quad: +m[11], tags: {}, dup: [], done: false }; jobs.push(cur); continue; }
    if (!cur) continue;
    const T = (a, mg, g, w) => (a === cur.arm && g === cur.grid && w === cur.w ? (cur.tags[mg] || (cur.tags[mg] = { worlds: [], log: Object.fromEntries(RULES.map(r => [r, []])) })) : null);
    const set = (t, k, v, name) => { if (t[k] !== undefined) cur.dup.push(name); t[k] = v; };
    let t;
    if ((m = SOLVEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'table', m[5], `solve M${m[2]}`); t.secs = +m[6]; continue; }
    if ((m = RANL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'ran', m[5], `ran M${m[2]}`); continue; }
    if ((m = GAPL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'gap', { gap: m[5], open1e3: +m[6], open0: +m[7] }, `gap M${m[2]}`); continue; }
    if ((m = JOINTL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'joint', { joint: m[5] === 'true', margin: m[6], charge: m[7], scale: +m[8], cap: +m[9], deathTax: +m[10], tier: m[11], decided: m[12] }, `joint M${m[2]}`); continue; }
    if ((m = MOVESL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'moves', { best: +m[5], bestTier: [+m[6], +m[7]], stay: +m[8], stayTier: [+m[9], +m[10]], chosen: +m[11], chosenTier: [+m[12], +m[13]], held: [+m[14], +m[15]] }, `moves M${m[2]}`); continue; }
    if ((m = PRICEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'price', { mixture: +m[5], whole: +m[6], surv: +m[7] }, `price M${m[2]}`); continue; }
    if ((m = WORLDL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { if (t.worlds[+m[5]]) cur.dup.push(`world M${m[2]} ${m[5]}`); t.worlds[+m[5]] = { z: +m[6], w: +m[7], whole: +m[8], surv: +m[9] }; continue; }
    if ((m = NODEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'node', { z: +m[5], sim: { 'TS+J': +m[6], OPEN0: +m[8], OPEN2: +m[10], WA: +m[12] }, held0: { 'TS+J': +m[7], OPEN0: +m[9], OPEN2: +m[11], WA: +m[13] }, paths: +m[14] }, `node M${m[2]}`); continue; }
    if ((m = LOGL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { const L = t.log[m[5]], y = +m[6]; if (L[y]) cur.dup.push(`log M${m[2]} ${m[5]} year ${y}`); L[y] = { held: +m[7], fwdLeave: +m[8], cellLeave: +m[9], fwdHoldCellLeave: +m[10], fwdLeaveCellHold: +m[11], marginHold: +m[12] }; continue; }
    if ((m = ALLL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'all', { sim: +m[5], held0: +m[6], paths: +m[7] }, `all M${m[2]}`); continue; }
    if (line.trim() === `done ${cur.kind} ${cur.arm}/${cur.grid}/W${cur.w}`) { cur.done = true; continue; }
  }
  return jobs;
}

/* the reference a job's lines are held to: `R.e(id, arm, w)` 7ae's parsed job (reduce-7ae.mjs parse); `R.ad(id, arm, w, grid)`
   7ad's parsed TS+J tag at that grid (reduce-7ad.mjs parse); `R.af(id)` 7af's or 7ag's parsed CAND unit (reduce-7aa.mjs
   parse). share 0.95's grid jobs are held to 7af's CAND ran line with the grid's points and return points. */
const withPaths = (ran, n) => ran.replace(/(^| )paths \d+(?= |$)/, `$1paths ${n}`);
export const withGrid = (ran, g) => { const [p, q] = g.split('x'); return ran.replace(/(^| )pts \d+(?= |$)/, `$1pts ${p}`).replace(/(^| )grid total\d+x/, `$1grid total${p}x`).replace(/(^| )quad \d+(?= |$)/, `$1quad ${q}`); };
function refOf(j, R) {
  if (isCore(j.kind)) { const m = j.kind.slice(5), e = R.e(j.id, j.arm, j.w), t = e && e.tags[m === 'P' ? '0' : m]; return t ? { ran: t.ran, joint: t.joint, e: m === 'P' ? null : t, z: t.node ? t.node.z : null, t1e3: e.tags['1e-3'] || null } : null; }
  if (j.kind === 'grid') {
    const t = R.ad(j.id, j.arm, j.w, j.grid); if (t) return { ran: t.ran, joint: t.joint };
    const u = R.af(j.id); return u ? { ran: withGrid(u.ran, j.grid), joint: u.joint } : null;
  }
  const u = R.af(j.id); return u ? { ran: u.ran, joint: u.joint } : null;
}
const sameArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sameMoves = (a, b) => !!a && !!b && a.best === b.best && a.stay === b.stay && a.chosen === b.chosen && sameArr(a.bestTier, b.bestTier) && sameArr(a.stayTier, b.stayTier) && sameArr(a.chosenTier, b.chosenTier) && sameArr(a.held, b.held);
export const keeps = (t, held) => t[0] === held[0] && t[1] === held[1];
export const leaves = u => !!u.moves && !keeps(u.moves.chosenTier, u.moves.held);

/* P's gate. `n` the solve's paths, `wn` the node's, `na` the all-world run's, `pts` the wealth points every job ran at (the
   preflight's 4; else each job's grid's). */
export function gate(jobs, R, { n = N, wn = WN, na = NA, pts = null } = {}) {
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
    if (!ref) bad.push(`${tagJ}: no reference to compare with (${core ? '7ae' : j.kind === 'grid' ? '7ad or 7af' : '7af or 7ag'})`);
    if (core && ref && (!ref.t1e3 || !ref.t1e3.moves || !sameArr(ref.t1e3.moves.chosenTier, DERISK))) bad.push(`${tagJ}: 7ae's TS+J at 1e-3 did not open in the de-risked pair ${DERISK.join('/')}`);
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
      if (!core) { if (u.node || u.all || RULES.some(r => u.log[r].length)) bad.push(`${L}: node, log or all-world lines on a ${j.kind} job`); continue; }
      const nd = u.node, lv = u.moves ? leaves(u) : null;
      if (!nd) bad.push(`${L}: no node line`);
      else {
        if (nd.paths !== wn) bad.push(`${L}: the node ran ${nd.paths} paths, not ${wn}`);
        if (u.worlds[0] && Math.abs(nd.z - u.worlds[0].z) > 1e-4) bad.push(`${L}: the node at z ${nd.z}, world 0's node ${u.worlds[0].z}`);
        if (ref && ref.z !== null && nd.z !== ref.z) bad.push(`${L}: the node at z ${nd.z}, 7ae's at ${ref.z}`);
        if (nd.held0.OPEN0 !== nd.paths) bad.push(`${L}: OPEN0 kept the held tiers on ${nd.held0.OPEN0} of ${nd.paths} paths`);
        if (nd.held0.OPEN2 !== 0) bad.push(`${L}: OPEN2 kept the held tiers on ${nd.held0.OPEN2} of ${nd.paths} paths`);
        if (lv !== null && nd.held0['TS+J'] !== (lv ? 0 : nd.paths)) bad.push(`${L}: TS+J kept the held tiers on ${nd.held0['TS+J']} of ${nd.paths} paths, its chosen move ${lv ? 'leaving' : 'keeping'} them`);
        if (nd.held0.WA < 0 || nd.held0.WA > nd.paths) bad.push(`${L}: WA kept the held tiers on ${nd.held0.WA} of ${nd.paths} paths`);
      }
      for (const rule of RULES) {
        const lg = u.log[rule];
        if (lg.filter(Boolean).length !== YEARS || Array.from({ length: YEARS }, (_, i) => i + 1).some(y => !lg[y]) || lg[0]) { bad.push(`${L} ${rule}: decision-log lines for years ${lg.map((x, y) => (x ? y : null)).filter(y => y !== null).join(',')}, not 1 to ${YEARS}`); continue; }
        for (let y = 1; y <= YEARS; y++) {
          const g = lg[y], both1 = g.fwdLeave - g.fwdLeaveCellHold, both2 = g.cellLeave - g.fwdHoldCellLeave;
          if (both1 !== both2 || both1 < 0 || g.fwdLeave > g.held || g.cellLeave > g.held || g.fwdLeave + g.fwdHoldCellLeave > g.held) bad.push(`${L} ${rule} year ${y}: the decision log's counts are inconsistent`);
          if (g.marginHold > g.held - g.fwdLeave) bad.push(`${L} ${rule} year ${y}: more margin holds than holds`);
          if (mg !== '1e-3' && g.marginHold !== 0) bad.push(`${L} ${rule} year ${y}: a margin hold at margin 0`);
          if (nd && g.held > nd.paths) bad.push(`${L} ${rule} year ${y}: more paths held than run`);
        }
      }
      if (!u.all) bad.push(`${L}: no all-world line`);
      else {
        if (u.all.paths !== na) bad.push(`${L}: the all-world run ran ${u.all.paths} paths, not ${na}`);
        if (lv !== null && u.all.held0 !== (lv ? 0 : u.all.paths)) bad.push(`${L}: the all-world TS+J kept the held tiers on ${u.all.held0} of ${u.all.paths} paths, its chosen move ${lv ? 'leaving' : 'keeping'} them`);
      }
    }
    if (!j.done) bad.push(`${tagJ}: no done line`);
  }
  return bad;
}

export const traceName = (id, arm, m, rule, w, where = 'world0') => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-m${m.toLowerCase()}-${rule.toLowerCase().replace(/\+/g, '_')}-${where}@w${w}.json.gz`;
export const traceAgrees = (j, ST, arm, m, rule, w, sim, count, where = 'world0') => !!(j && ST && j.stamp && j.N === count && String(j.seed) === SEED && j.arm === `${arm}/${rule}/M${m}/W${w}/${where}` && ['code', 'audit', 'prediction', 'sha'].every(x => j.stamp[x] === ST[x]) && Math.abs(j.sim - sim) <= SIM_TOL);
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every core run's trace against its log (and the node's decision log against its trace); at settings 0 and 1e-3
   the node TS+J and OPEN0 traces' first paths (as many as 7ae ran) against 7ae's (`TRE`, by `${id}|${m}|${rule}`), and at
   1e-3 the all-world trace against 7aa's TS+J unit (`TRA`, by `${id}|${arm}|${label}`), path by path. `bad` gains every
   refusal. Returns the decoded traces by `${id}|${m}|${rule}` (node) and `${id}|${m}|all`. */
export function loadTraces(jobs, DIR, ST, bad, TRE, TRA, wn = WN, na = NA) {
  const TR = {};
  for (const j of jobs) {
    if (!isCore(j.kind)) continue;
    const mg = j.kind.slice(5), u = j.tags[mg];
    for (const [rule, where, count, sim] of [...RULES.map(r => [r, 'world0', wn, u.node.sim[r]]), ['TS+J', 'all', na, u.all.sim]]) {
      const f = join(DIR, traceName(j.id, j.arm, mg, rule, j.w, where));
      if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
      const t = readTrace(f);
      if (!traceAgrees(t, ST, j.arm, mg, rule, j.w, sim, count, where)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
      const T = decode(t);
      if (where === 'world0') {
        for (const x of E.logAgrees(T, u.log[rule])) bad.push(`${f}: the decision log against the trace, ${x}`);
        if (mg !== 'P' && (rule === 'TS+J' || rule === 'OPEN0')) {
          const R7 = TRE && TRE[`${j.id}|${mg}|${rule}`];
          if (!R7) bad.push(`${f}: no 7ae ${rule}/M${mg} trace to check it against`);
          else if (R7.N > wn || !E.sameFirst(T.survived, R7.survived, R7.N)) bad.push(`${f}: its first ${R7.N} paths' survival is not 7ae's ${rule}/M${mg}, path by path`);
        }
        TR[`${j.id}|${mg}|${rule}`] = T;
      } else {
        if (mg === '1e-3') {
          const RA = TRA && TRA[`${j.id}|${j.arm}|${A.label('TS+J', j.w)}`];
          if (!RA) bad.push(`${f}: no 7aa TS+J unit to check it against`);
          else if (RA.N !== na || !E.sameFirst(T.survived, RA.survived, na)) bad.push(`${f}: its survival is not 7aa's TS+J/W${j.w} unit's, path by path`);
        }
        TR[`${j.id}|${mg}|all`] = T;
      }
    }
  }
  return TR;
}

/* THE MEASURES. A path's switches and moves to a riskier tier (a lower tier code: tierPen * 4 + tierIsa) by year band, years
   1 to Y - 1, counted only while the path is alive (a failed path's later bytes are 0, which is not a move). */
export const BANDS = [[1, 5], [6, 25], [26, 999]];
export function churn(T) {
  const sw = BANDS.map(() => new Int16Array(T.N)), rr = BANDS.map(() => new Int16Array(T.N));
  for (let i = 0; i < T.N; i++) {
    const f = T.failYear[i];
    for (let y = 1; y < T.Y; y++) {
      if (f !== -1 && f <= y) break;
      const a = T.tier[i * T.Y + y - 1], b = T.tier[i * T.Y + y], k = BANDS.findIndex(([lo, hi]) => y >= lo && y <= hi);
      if (a !== b) { sw[k][i]++; if (b < a) rr[k][i]++; }
    }
  }
  return { sw, rr };
}
/* survival, paired: `a` against `b` (b less a), the diff array for 7ae's pooled() */
export const pair = (a, b) => { const k = cells(a, b), diff = new Int8Array(a.length); for (let i = 0; i < a.length; i++) diff[i] = b[i] - a[i]; return { ...k, diff }; };
/* the decision log's one-way share net of the reverse, years 1 to LOGYEARS pooled over logs */
export function netShare(logs) {
  let held = 0, one = 0, rev = 0;
  for (const lg of logs) for (let y = 1; y <= LOGYEARS; y++) { held += lg[y].held; one += lg[y].fwdHoldCellLeave; rev += lg[y].fwdLeaveCellHold; }
  return { held, one: held ? one / held : 0, rev: held ? rev / held : 0, net: held ? (one - rev) / held : 0 };
}
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);

const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
/* THE ITEMS, over pure inputs so the planted set can reach them:
   S(rule, m)[u] - unit u's node survived bits (rules TS+J, OPEN0, OPEN2, WA; settings P, 0, 1e-3);
   W(id, where, [ruleA, mA], [ruleB, mB]) - reduce-7aa.mjs wholeLeg of B against A (where 'world0' or 'all');
   K(id, mA, mB) - the all-world paired cells of TS+J at mB against mA (reduce-7v.mjs cells);
   openings[unit] - P's chosen year-0 tiers by grid; LOG(m, rule) - the three units' decision logs */
export function items(S, W, K, openings, LOG) {
  const out = [];
  const pooledOf = (ra, ma, rb, mb) => E.pooled(S(ra, ma).map((a, u) => pair(a, S(rb, mb)[u])));
  { const p = pooledOf('OPEN0', '0', 'OPEN0', 'P');
    out.push({ n: 1, text: `from the plan's tiers: OPEN0 under P against OPEN0 at margin 0, pooled - the lower end above -${M1} (FALSIFIED: the upper end below -${M1})`, pooled: p, outcome: tri(p.lo > -M1, p.hi < -M1) }); }
  { const p = pooledOf('OPEN2', '1e-3', 'OPEN2', 'P');
    out.push({ n: 2, text: `from the de-risked opening: OPEN2 under P against OPEN2 at 1e-3, pooled - the lower end above -${M2} (FALSIFIED: the upper end below -${M2})`, pooled: p, outcome: tri(p.lo > -M2, p.hi < -M2) }); }
  { const w = W('S194', 'world0', ['OPEN2', '1e-3'], ['OPEN2', 'P']);
    out.push({ n: 3, text: `O50's harm by the whole score, S194 at the node: OPEN2/P against OPEN2/1e-3 - the lower end above -${MW} (FALSIFIED: the upper end below -${MW})`, whole: w, outcome: tri(w.lo > -MW, w.hi < -MW) }); }
  { const w = W('S194', 'all', ['TS+J', '1e-3'], ['TS+J', '0']);
    out.push({ n: 4, text: `O50 across all worlds, S194: TS+J at margin 0 against 1e-3 by the whole score - the lower end above -${MW}, the bad world's loss bought back (FALSIFIED: the upper end below -${MW}, a loss the mixture does not buy back)`, whole: w, outcome: tri(w.lo > -MW, w.hi < -MW) }); }
  { const legs = CORE.map(([id]) => { const k = K(id, '1e-3', 'P'); return { id, k, p: mcnemarHarmP(k.lost, k.saved), w: W(id, 'all', ['TS+J', '1e-3'], ['TS+J', 'P']) }; });
    const adj = holm(legs.map(l => l.p));
    legs.forEach((l, i) => { l.pHolm = adj[i]; l.o = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: M5, pHolm: l.pHolm, level: ALPHA }); l.u = guardedU(l.k);
      l.pass = l.o.outcome === 'no material harm' && l.u.lo > -M5 && l.w.lo > -MW; l.harm = l.o.outcome === 'harm' || l.w.hi < -MW; });
    out.push({ n: 5, text: `P across all worlds: TS+J/P against TS+J/1e-3 on the three units - survival no material harm by the exact rule with Holm at ${M5} and the guarded unconditional interval, AND the whole score's lower end above -${MW} (FALSIFIED: harm on either on any unit)`, legs, outcome: tri(legs.every(l => l.pass), legs.some(l => l.harm)) }); }
  { const legs = Object.entries(openings).map(([id, o]) => { const g = Object.values(o); return { id, o, same: g.length === 3 && g.every(x => sameArr(x, g[0])) }; });
    out.push({ n: 6, text: 'P\'s opening does not flip with the grid: the chosen year-0 tiers at 30x5, 30x15 and 60x5 one, on bridge 4, S194 and share 0.95 (FALSIFIED: not one on all three)', legs, outcome: legs.length !== 3 ? 'INCONCLUSIVE' : tri(legs.every(l => l.same), legs.every(l => !l.same)) }); }
  { const s = netShare(LOG('P', 'OPEN0')), ok = s.held >= MIN_PY;
    out.push({ n: 7, text: `the mechanism: on OPEN0/P's node runs, years 1 to ${LOGYEARS} pooled, the one-way share (the forward holds, the nearest cell leaves) net of the reverse below ${100 * NET_HELD} points (FALSIFIED: ${100 * NET_FALSE} points or more; INCONCLUSIVE between, or under ${MIN_PY} path-years held)`, share: s, measured: ok, outcome: ok ? tri(s.net < NET_HELD, s.net >= NET_FALSE) : 'INCONCLUSIVE' }); }
  return out;
}

/* the Q branch (registered; the deep review of 29 Sep 08:56 UK, decision 2; read only where share 0.95's opening is one across
   the three grids, the deep review of 11:30): share 0.95's opening under P */
export const qBranch = (open, stable) => (open === null ? 'not measured' : !stable ? 'not decided by this read: share 0.95\'s opening under P flips with the grid (item 6)'
  : open ? 'P leaves the plan\'s tiers on share 0.95 at year 0, as margin 0 and Q do, at all three grids: Q\'s year-0 de-risk is P\'s to take; the bundle/+Q/+O36-fix 2x2 is not triggered by this read (the maintainer decides Q)'
    : 'P keeps the plan\'s tiers on share 0.95 at year 0 at all three grids: the bundle/+Q/+O36-fix 2x2 is triggered before 7u (the deep review\'s decision 2; the maintainer decides Q)');

const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const iv = p => `${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`;
/* THE READING, after every gate has passed. `TR` P's traces, `af(id)` the bundle's parsed unit (7af's or 7ag's) */
export function reading(jobs, TR, af, out = console.log, wn = WN) {
  const J = (kind, id, g = '30x5') => jobs.find(j => j.kind === kind && j.id === id && j.grid === g);
  const tag = (id, m) => J(`core:${m}`, id).tags[m];
  const tr = (id, m, rule) => TR[`${id}|${m}|${rule}`];
  const S = (rule, m) => CORE.map(([id]) => tr(id, m, rule).survived);
  const cfgOf = (id, X, Y) => { const u = tag(id, 'P'); return { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(CORE.find(c => c[0] === id)[2]), spendYears: F.spendYears(X, Y) }; };
  const W = (id, where, [ra, ma], [rb, mb]) => { const X = where === 'all' ? tr(id, ma, 'all') : tr(id, ma, ra), Y = where === 'all' ? tr(id, mb, 'all') : tr(id, mb, rb); return A.wholeLeg(X, Y, cfgOf(id, X, Y), ALPHA); };
  const K = (id, ma, mb) => cells(tr(id, ma, 'all').survived, tr(id, mb, 'all').survived);
  const openings = Object.fromEntries(['bridge 4', 'S194', 'share 0.95'].map(id => [id, Object.fromEntries(['30x5', '30x15', '60x5'].map(g => { const j = g === '30x5' ? (id === 'share 0.95' ? J('open', id) : J('core:P', id)) : J('grid', id, g); return [g, j.tags.P.moves.chosenTier]; }))]));
  const LOG = (m, rule) => CORE.map(([id]) => tag(id, m).log[rule]);
  const IT = items(S, W, K, openings, LOG);
  out(`P: THE SWITCH CHARGED IN BOTH PASSES (switchCharge ${CHARGE}, switchMargin 0) - WHICH EXPLANATION CARRIES FAMILIES 1 AND 2? (predictions/diag-p.md; ${N} paths of seed ${SEED}, ${wn} at world 0's node, ${NA} across all worlds; the fair-test gates passed: the stamps, 7aa's, 7ac's, 7ad's, 7ae's, 7af's and 7ag's own gates, settings 0 and 1e-3 as 7ae's solves to their printed lines, on 7ae's node paths and 7aa's all-world paths path by path)`);
  out('\nTHE CORE UNITS AT 30x5: the table, the year-0 gap on top of any charge, the opening, world 0\'s survival price of the opening, each rule\'s survival at world 0\'s node, TS+J across all worlds, and the solve\'s seconds');
  for (const [id, arm, w] of CORE) for (const m of ['1e-3', '0', 'P']) {
    const u = tag(id, m);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} M${m}`.padEnd(28)} table ${u.table} gap ${u.gap.gap} (opening ${u.moves.chosenTier.join('/')}) | price ${u.worlds[0].surv.toFixed(3)} | node ${RULES.map(r => `${r} ${u.node.sim[r].toFixed(2)}`).join(' ')} | all ${u.all.sim.toFixed(2)} | solve ${Math.round(u.secs)} s`);
  }
  out('\nPAIRED AT THE NODE, every unit (saved/lost, the survival difference in points, the 95% interval)');
  for (const [id] of CORE) for (const [ra, ma, rb, mb] of [['OPEN0', '0', 'OPEN0', 'P'], ['OPEN2', '1e-3', 'OPEN2', 'P'], ['OPEN2', '1e-3', 'OPEN2', '0'], ['TS+J', '1e-3', 'TS+J', 'P'], ['OPEN0', 'P', 'TS+J', 'P'], ['TS+J', '1e-3', 'WA', '1e-3'], ['TS+J', '0', 'WA', '0'], ['TS+J', 'P', 'WA', 'P']]) {
    const k = pair(tr(id, ma, ra).survived, tr(id, mb, rb).survived), p = E.pooled([k]);
    out(`  ${id.padEnd(9)} ${`${rb}/${mb} against ${ra}/${ma}`.padEnd(30)} ${k.saved}/${k.lost} ${iv(p)}`);
  }
  out('\nACROSS ALL WORLDS, every unit: TS+J at P and at 0 against 1e-3 (saved/lost; the whole score, wholeLeg at 0.05)');
  for (const [id] of CORE) for (const mb of ['0', 'P']) { const k = K(id, '1e-3', mb), w = W(id, 'all', ['TS+J', '1e-3'], ['TS+J', mb]); out(`  ${id.padEnd(9)} TS+J/${mb} against TS+J/1e-3  ${k.saved}/${k.lost}  whole ${iv(w)} (survival part ${f3(w.sd)}, the rest ${f3(w.rest)})`); }
  out(`\nTHE CHURN AT THE NODE by year band (${BANDS.map(([a, b]) => `${a}-${b > 100 ? 'end' : b}`).join(', ')}): switches / moves to a riskier tier a path (the path alive)`);
  for (const [id] of CORE) for (const m of ['1e-3', '0', 'P']) {
    const row = RULES.map(rule => { const c = churn(tr(id, m, rule)), n = c.sw[0].length, mean = a => a.reduce((t, x) => t + x, 0) / n; return `${rule} ${BANDS.map((_, k) => `${mean(c.sw[k]).toFixed(2)}/${mean(c.rr[k]).toFixed(2)}`).join(' ')}`; });
    out(`  ${`${id} M${m}`.padEnd(15)} ${row.join('  |  ')}`);
  }
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const it of IT) {
    out(`${it.n}. ${it.text}: ${it.outcome}`);
    if (it.n <= 2) out(`     pooled ${iv(it.pooled)}`);
    if (it.n === 3 || it.n === 4) out(`     whole ${iv(it.whole)} (survival part ${f3(it.whole.sd)}, the rest ${f3(it.whole.rest)})`);
    if (it.n === 5) for (const l of it.legs) out(`     ${l.id.padEnd(9)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N}  Holm ${l.pHolm.toExponential(1)}  change ${f3(l.o.d)} (${l.o.lo.toFixed(3)} to ${l.o.hi.toFixed(3)}; unconditional, guarded, ${l.u.lo.toFixed(3)} to ${l.u.hi.toFixed(3)})  whole ${iv(l.w)}  -> ${l.pass ? 'passes' : l.harm ? 'harm' : 'open'}`);
    if (it.n === 6) for (const l of it.legs) out(`     ${l.id}: ${Object.entries(l.o).map(([g, t]) => `${g} ${t.join('/')}`).join(', ')}${l.same ? '' : ' - flips'}`);
    if (it.n === 7) out(`     one-way ${(100 * it.share.one).toFixed(2)}%, reverse ${(100 * it.share.rev).toFixed(2)}%, net ${(100 * it.share.net).toFixed(2)} points of ${it.share.held} held path-years`);
  }
  { const s = netShare(LOG('1e-3', 'OPEN0')); out(`\nREPORTED: the same share on OPEN0 at 1e-3 (7ae's item 2 on these paths): one-way ${(100 * s.one).toFixed(2)}%, reverse ${(100 * s.rev).toFixed(2)}%, net ${(100 * s.net).toFixed(2)} points of ${s.held} held path-years`); }
  { const at = m => { const sp = CORE.reduce((t, [id]) => t + tag(id, m).worlds[0].surv, 0), pl = E.pooled(CORE.map(([id]) => pair(tr(id, m, 'OPEN0').survived, tr(id, m, 'TS+J').survived))); return { sp, pl, ratio: pl.d > 0 ? sp / pl.d : NaN }; };
    const a = at('0'), b = at('P');
    out(`REPORTED: the pooled price / realised ratio (Σ world-0 survival price of the opening against Σ TS+J less OPEN0 at the node): margin 0 ${a.sp.toFixed(3)} / ${iv(a.pl)} = ${a.ratio.toFixed(3)}; P ${b.sp.toFixed(3)} / ${iv(b.pl)} = ${b.ratio.toFixed(3)} (reported only: the deep review of 11:30 - the ratio does not separate the explanations)`); }
  out('\nREPORTED: THE OPENINGS ON THE 25 HOUSEHOLDS 7AF AND 7AG READ (the bundle\'s unit, READER/TS+J/W0.02): P\'s gap on top of the charge and its chosen year-0 tiers, against the bundle\'s (7af\'s or 7ag\'s: the gap at 1e-3, the pension tier chosen at 1e-3 and at margin 0 on its tables)');
  let q = null;
  for (const id of OPENS) {
    const u = J('open', id).tags.P, f = af(id), lv = leaves(u);
    if (id === 'share 0.95') q = lv;
    out(`  ${id.padEnd(14)} P gap ${u.gap.gap.padEnd(10)} opening ${u.moves.chosenTier.join('/')} ${lv ? 'leaves' : 'keeps '} | bundle gap ${f.gap.gap} opening ${f.gap.open1e3},${f.gap.open0} | solve ${Math.round(u.secs)} s`);
  }
  const s95 = IT.find(i => i.n === 6).legs.find(l => l.id === 'share 0.95');
  out(`  share 0.95, the registered branch: ${qBranch(q, !!s95 && s95.same)}`);
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
    const base = kind === 'grid' && id === 'share 0.95' ? ranOf(id, '30x5', w) : ranOf(id, g, w), scale = 1000, cap = 4000;
    const refRan = core && kind !== 'core:1e-3' ? `${base} switchMargin 0` : base;
    for (const mg of tagsOf(kind)) {
      const L = `${a}/TS+J/M${mg}/${g}/W${w}`, gap = mg === 'P' ? (o.gapZero === id ? '0' : '5.0000e-4') : '8.0000e-4';
      const c = mg === 'P' ? 0.001 : 0, g0 = Number(gap), mix = gap === '0' ? 5e-4 : 100 * (g0 + (o.noChargePrice && one ? 0 : c)), lfl = gap === '0' ? 0 : mix, lflW = o.lflOff && one ? lfl * 1.1 : lfl;
      const wantRan = mg === 'P' ? (core ? `${refRan} switchCharge ${CHARGE}` : `${withGrid(base, g)} switchMargin 0 switchCharge ${CHARGE}`) : refRan;
      const x = { table: mg === 'P' ? '99.1000' : '99.2000', ran: wantRan };
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
      if (core) {
        const np = o.nodePaths && mg === 'P' ? o.nodePaths : WN, pl = mg === 'P';
        if (!(o.noNode && pl)) lines.push(`${P} node ${L} 0 z ${pl && o.nodeZ ? o.nodeZ : '-1.7321'}: TS+J 98.0000 held0 ${o.tsjHeld && pl ? 5 : 0} OPEN0 97.0000 held0 ${o.open0Held && pl ? np - 1 : np} OPEN2 97.8000 held0 ${o.open2Held && pl ? 1 : 0} WA 97.5000 held0 3 paths ${np} secs 100`);
        for (const rule of RULES) for (let y = 1; y <= YEARS; y++) {
          if (o.noLogYear && pl && rule === 'OPEN0' && y === 4) continue;
          const bad = o.logBad && pl && rule === 'OPEN0' && y === 2, mh = o.marginHold0 && pl && rule === 'TS+J' && y === 1 ? 1 : 0;
          lines.push(`${P} log ${L} ${rule} year ${y}: held 100 fwdLeave ${bad ? 30 : 20} cellLeave 25 fwdHoldCellLeave 10 fwdLeaveCellHold 5 marginHold ${mh}`);
        }
        if (!(o.noAll && pl)) lines.push(`${P} all ${L}: TS+J 99.0000 held0 ${o.allHeld && pl ? 7 : 0} paths ${o.allPaths && pl ? o.allPaths : NA} secs 60`);
      }
      if (core && mg !== 'P') (E0[id] || (E0[id] = {}))[mg] = { table: x.table, ran: refRan, gap: { gap, open1e3: 2, open0: 2 }, joint: { scale, cap }, moves: { best: bi, bestTier: bt.split('/').map(Number), stay: 3, stayTier: [0, 0], chosen: bi, chosenTier: (mg === '1e-3' && o.e1e3Stay ? '0/0' : bt).split('/').map(Number), held: [0, 0] }, price: { mixture: +mx.toExponential(6), whole: +lfl.toExponential(6), surv: +(lfl / 2).toExponential(6) }, worlds: ws.map(([z, wt]) => ({ z: +z.toFixed(4), w: +wt.toFixed(4), whole: +lfl.toFixed(6), surv: +(lfl / 2).toFixed(6) })), node: { z: -1.7321 } };
      if (core && mg !== 'P' && o.table0 === mg) E0[id][mg].table = '99.3000';
    }
    if (kind === 'grid' && id !== 'share 0.95') AD[`${id}|${g}`] = { ran: base, joint: { scale, cap } };
    if (kind === 'open') AF[id] = { ran: ranOf(id, '30x5', w), joint: { scale, cap } };
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
  cases.push(['the gate refuses a missing job', refused({ skip: jobKey(...JOBS[25]) }), 'true']);
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
  cases.push(['the gate refuses 7ae\'s 1e-3 opening outside the de-risked pair (OPEN2 would not be its opening)', refused({ e1e3Stay: true }), 'true']);
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
  cases.push(['the gate refuses OPEN2 keeping the held tiers on a node path', refused({ open2Held: true }), 'true']);
  cases.push(['the gate refuses TS+J keeping the held tiers where its chosen move leaves', refused({ tsjHeld: true }), 'true']);
  cases.push(['the gate refuses a missing decision-log year', refused({ noLogYear: true }), 'true']);
  cases.push(['the gate refuses a decision log whose counts are inconsistent', refused({ logBad: true }), 'true']);
  cases.push(['the gate refuses a margin hold at margin 0', refused({ marginHold0: true }), 'true']);
  cases.push(['the gate refuses a missing all-world line', refused({ noAll: true }), 'true']);
  cases.push(['the gate refuses an all-world run of other than the registered paths', refused({ allPaths: 4000 }), 'true']);
  cases.push(['the gate refuses the all-world TS+J keeping the held tiers where its chosen move leaves', refused({ allHeld: true }), 'true']);
  cases.push(['the gate refuses a missing done line', refused({ noDone: true }), 'true']);
  cases.push(['share 0.95\'s grid ran line is 7af\'s with the grid\'s points and return points', withGrid('mix 3 pts 30 seed 7002 paths 8000 grid total30x6x6 lambda x quad 5 tierState a', '60x15'), 'mix 3 pts 60 seed 7002 paths 8000 grid total60x6x6 lambda x quad 15 tierState a']);
  // the traces' names and agreement
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = { stamp: ST, N: WN, seed: 7002, arm: 'READER/TS+J/MP/W0/world0', sim: 98 };
    cases.push(['a trace agrees with its log, and not at another count, arm, place, stamp or survival', [traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98, WN), traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98, 8000), traceAgrees(t, ST, 'READER', 'P', 'OPEN0', '0', 98, WN), traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98, WN, 'all'), traceAgrees(t, { ...ST, code: 'd' }, 'READER', 'P', 'TS+J', '0', 98, WN), traceAgrees(t, ST, 'READER', 'P', 'TS+J', '0', 98.0001, WN)].join(' '), 'true false false false false false']);
    cases.push(['the trace names are the audit\'s', `${traceName('bridge 4', 'READER', 'P', 'TS+J', '0')} ${traceName('S194', 'OFF', '1e-3', 'TS+J', '0.02', 'all')}`, 'bridge_4-reader-mp-ts_j-world0@w0.json.gz S194-off-m1e-3-ts_j-all@w0.02.json.gz']); }
  // the churn by band: a path failing writes 0 bytes after, not a move; a de-risk is not a riskier move
  { const Y = 30, tier = new Uint8Array(3 * Y), f = Int16Array.from([3, -1, 28]);
    tier.set([0, 10, 10], 0);                         // path 0: de-risk in year 1, fails in year 3 (its later zero bytes no move)
    for (let y = 0; y < Y; y++) tier[Y + y] = y % 2 ? 10 : 0;   // path 1: switches every year to the end
    for (let y = 0; y < Y; y++) tier[2 * Y + y] = y < 27 ? 10 : 0;   // path 2: re-risks in year 27, fails in 28
    const c = churn({ N: 3, Y, tier, failYear: f }), s = k => Array.from(c.sw[k]).join(','), r = k => Array.from(c.rr[k]).join(',');
    cases.push(['the churn by band: switches and riskier moves a path, the path alive only', `${s(0)}|${s(1)}|${s(2)} ${r(0)}|${r(1)}|${r(2)}`, '1,5,0|0,20,0|0,4,1 0,2,0|0,10,0|0,2,1']); }
  // the decision log's net share
  { const lg = Array.from({ length: 11 }, (_, y) => (y ? { held: 100, fwdHoldCellLeave: 10, fwdLeaveCellHold: 4 } : null)), s = netShare([lg, lg]);
    cases.push(['the net share: years 1 to 7 pooled, one-way less reverse', `${s.held} ${(100 * s.net).toFixed(1)}`, '1400 6.0']); }
  // the items over built arrays: n paths a unit, three units
  const n = 8000, U = 3;
  const mk = ({ o0 = 7760, oP = 7760, a3 = 7840, aP = 7840, wOff = 0, w4 = 0, k5 = { lost: 2, saved: 2 }, w5 = 0, open = { 'bridge 4': [[2, 2], [2, 2], [2, 2]], S194: [[2, 2], [2, 2], [2, 2]], 'share 0.95': [[2, 2], [2, 2], [2, 2]] }, net = 0.005, held = 5000 } = {}) => {
    const surv = { 'OPEN0|0': o0, 'OPEN0|P': oP, 'OPEN2|1e-3': a3, 'OPEN2|P': aP };
    const S = (rule, m) => Array.from({ length: U }, () => B(n, surv[`${rule}|${m}`]));
    const W = (id, where, a, b) => { const d = where === 'world0' ? wOff : a[1] === '1e-3' && b[1] === '0' ? w4 : w5; return { d, lo: d - 0.1, hi: d + 0.1, sd: d, rest: 0 }; };
    const K = () => ({ a: n - 50 - k5.lost - k5.saved, lost: k5.lost, saved: k5.saved, d: 50, N: n });
    const op = Object.fromEntries(Object.entries(open).map(([id, g]) => [id, { '30x5': g[0], '30x15': g[1], '60x5': g[2] }]));
    const lg = Array.from({ length: 11 }, (_, y) => (y ? { held: held / 7, fwdHoldCellLeave: (held / 7) * (0.02 + net), fwdLeaveCellHold: (held / 7) * 0.02 } : null));
    const LOG = () => [lg];
    return items(S, W, K, op, LOG).map(i => i.outcome).join(' ');
  };
  cases.push(['the items: P as the uncharged-margin explanation says, and robust: all HELD', mk(), 'HELD HELD HELD HELD HELD HELD HELD']);
  cases.push(['the items: every alternative: all FALSIFIED', mk({ oP: 7760 - 80, aP: 7840 - 60, wOff: -0.6, w4: -0.6, k5: { lost: 200, saved: 0 }, w5: -0.6, open: { 'bridge 4': [[2, 2], [0, 0], [2, 2]], S194: [[2, 2], [2, 2], [1, 1]], 'share 0.95': [[0, 0], [2, 2], [2, 2]] }, net: 0.08 }), 'FALSIFIED FALSIFIED FALSIFIED FALSIFIED FALSIFIED FALSIFIED FALSIFIED']);
  cases.push(['item 1 at M1 0.35: OPEN0 down 24 paths a unit (0.9 pooled) is FALSIFIED, 8 paths (0.3 pooled) INCONCLUSIVE', `${mk({ oP: 7760 - 24 }).split(' ')[0]} ${mk({ oP: 7760 - 8 }).split(' ')[0]}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['item 1 at M1 0.35, not 0.5: OPEN0 down 6 paths a unit (0.225 pooled, lower end -0.405) is INCONCLUSIVE', mk({ oP: 7760 - 6 }).split(' ')[0], 'INCONCLUSIVE']);
  cases.push(['item 1 reads OPEN0/P against OPEN0/M0: OPEN0 at M0 lower than P by 0.5 a unit is HELD', mk({ o0: 7720 }).split(' ')[0], 'HELD']);
  cases.push(['item 2 at M2 0.23: OPEN2 down 20 paths a unit (0.75 pooled) is FALSIFIED, 4 paths (0.15 pooled) INCONCLUSIVE', `${mk({ aP: 7840 - 20 }).split(' ')[1]} ${mk({ aP: 7840 - 4 }).split(' ')[1]}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['item 3 at MW 0.25: the node\'s whole score at -0.2 (lower end -0.3) is INCONCLUSIVE; at -0.4 FALSIFIED', `${mk({ wOff: -0.2 }).split(' ')[2]} ${mk({ wOff: -0.4 }).split(' ')[2]}`, 'INCONCLUSIVE FALSIFIED']);
  cases.push(['item 4 reads margin 0 against 1e-3 across all worlds, not P: margin 0 at -0.6 is FALSIFIED with P level', `${mk({ w4: -0.6 }).split(' ')[3]} ${mk({ w4: -0.6 }).split(' ')[4]}`, 'FALSIFIED HELD']);
  cases.push(['item 5 needs the whole score too: survival level but P\'s whole at -0.2 is INCONCLUSIVE, at -0.4 FALSIFIED', `${mk({ w5: -0.2 }).split(' ')[4]} ${mk({ w5: -0.4 }).split(' ')[4]}`, 'INCONCLUSIVE FALSIFIED']);
  cases.push(['item 5 by survival: 60 lost of 8,000 against none saved is harm', mk({ k5: { lost: 60, saved: 0 } }).split(' ')[4], 'FALSIFIED']);
  cases.push(['item 5 HELD needs the guarded unconditional end: 12 lost, 0 saved (exact inside, unconditional not) is not HELD', mk({ k5: { lost: 12, saved: 0 } }).split(' ')[4] !== 'HELD' ? 'not HELD' : 'HELD', 'not HELD']);
  cases.push(['item 6: one unit flipping is INCONCLUSIVE; an ISA tier flip counts', `${mk({ open: { 'bridge 4': [[2, 2], [0, 0], [2, 2]], S194: [[2, 2], [2, 2], [2, 2]], 'share 0.95': [[2, 2], [2, 2], [2, 2]] } }).split(' ')[5]} ${mk({ open: { 'bridge 4': [[2, 2], [2, 1], [2, 2]], S194: [[2, 2], [2, 2], [2, 1]], 'share 0.95': [[2, 1], [2, 2], [2, 2]] } }).split(' ')[5]}`, 'INCONCLUSIVE FALSIFIED']);
  cases.push(['item 7: net 3 points is INCONCLUSIVE, under the held path-years floor INCONCLUSIVE', `${mk({ net: 0.03 }).split(' ')[6]} ${mk({ held: 700 }).split(' ')[6]}`, 'INCONCLUSIVE INCONCLUSIVE']);
  cases.push(['the Q branch reads share 0.95 as registered, and only where its opening is stable', `${qBranch(true, true).startsWith('P leaves')} ${qBranch(false, true).includes('is triggered before 7u')} ${qBranch(true, false).startsWith('not decided')} ${qBranch(null, true)}`, 'true true true not measured']);
  const wrong = cases.filter(([, got, want]) => got !== want);
  for (const [nm, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'FAIL'} ${nm}: ${got}${got === want ? '' : ` (should read ${want})`}`);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.length} of ${cases.length}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should`);
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
/* 7ae with its whole chain (7aa, 7ac, 7ad), 7aa's TS+J traces on the three units, 7af against 7aa and 7ag beside 7af, each
   through its own stamps and gate; exits on a refusal */
export function loadRefs(DIR7AE, DIR7AD, DIR7AC, DIR7AA, DIR7AF, DIR7AG) {
  const fail = (who, bad) => { console.log(`FAIR-TEST GATE (${who}): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); };
  const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
  requireFairLogs(logsA, A.PRED);
  { const b = A.gate(unitsA); if (b.length) fail('7aa', b); }
  const refAll = (id, arm, tag, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
  const TRA = {}, STA = stampOf(logsA);
  { const b = []; for (const [id, arm, w] of CORE) { const u = refAll(id, arm, 'TS+J', w), f = join(DIR7AA, A.traceName(id, arm, A.label('TS+J', w)));
      if (!u || !existsSync(f)) { b.push(`no 7aa TS+J/W${w} unit or trace for ${id}`); continue; }
      const j = readTrace(f); if (!A.traceAgrees(j, STA, arm, A.label('TS+J', w), u.run.sim)) { b.push(`${f}: count, seed, arm, stamp or survival is not 7aa's log's`); continue; }
      TRA[`${id}|${arm}|${A.label('TS+J', w)}`] = decode(j); }
    if (b.length) fail('7aa\'s traces', b); }
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
  return { R, jobsE, TRE, TRA, unitsF, unitsG };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const d = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = d(0, 'diagP');
  const { R, TRE, TRA } = loadRefs(d(1, 'diag7ae'), d(2, 'diag7ad'), d(3, 'diag7ac'), d(4, 'diag7aa'), d(5, 'diag7af'), d(6, 'diag7ag'));
  const logs = logsOf(DIR), jobs = Object.values(logs).flatMap(parse);
  if (JOBS.some(([kind, id, a, w, g]) => !jobs.some(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.grid === g && j.done))) { console.log(`INCOMPLETE - ${jobs.filter(j => j.done).length} of ${JOBS.length} jobs done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(jobs, R), ST = stampOf(logs);
  const TR = bad.length ? {} : loadTraces(jobs, DIR, ST, bad, TRE, TRA);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(jobs, TR, R.af);
}
