/*
 * THE 7AD REDUCER: THE REFINEMENT CHECK (predictions/diag-7ad.md; PLAN.md 7ad). Reads results/diag7ad/case*.txt (batch-7ad.sh:
 * audit-s126.mjs diag7ad, seven jobs) beside 7aa's and 7ac's records, each read only through its own reducer's gate.
 * THE GATE, before any figure:
 *   - both runs' stamps (fair-gate.mjs requireFairLogs), 7aa's gate (reduce-7aa.mjs) and 7ac's gate (reduce-7ac.mjs);
 *   - every registered job once and done, each with its lines for TS+J (and the product, but for the S126 control): solve,
 *     ran, gap, joint, moves, price, three world lines; for TS+J the node lines (three at 30x5, world 0's at the finer
 *     grids) of the registered node paths;
 *   - at 30x5 TS+J's table, ran line, gap and joint line equal 7aa's TS+J unit's and the product's table, ran line and gap
 *     7aa's PRODUCT unit's (7ad's code, with scoreMoves' survival output, reproduces 7aa's solves); at the finer grids the
 *     ran line equals 7aa's but for its points (pts, grid) or its return points (quad), which must be the grid's;
 *   - the mixture's price equals the gap (x100) within PRICE_TOL; the like-for-like prices' weighted whole sum equals the
 *     mixture's price within LFL_TOL (the like-for-like decomposition is exact by construction: the same two moves);
 *   - the moves line: BEST leaves the held tiers where the gap is above 0 and STAY keeps them; the node runs' held0 - OPEN0
 *     on every node path, TS+J on none where its chosen move leaves the held tiers (on all where it keeps them);
 *   - at 30x5 the node runs' first 1000 paths' survival, TS+J's and OPEN0's, equal 7ac's world lines (the same paths);
 *   - every node trace: its count, seed, arm, stamp and survival are the log's.
 * THE ITEMS, by the registered rule:
 *   1. Stage 1 (30x5), the bad world (world 0): on bridge 4 (reader, W0) and S194 (off, W0.02), TS+J's like-for-like SURVIVAL
 *      price of its opening lies below the exact 95% interval (Bonferroni over the two: 0.025 each) of the survival TS+J
 *      realises over OPEN0 at the node (4,000 paths, paired). HELD on both below; FALSIFIED on both inside or above (priced
 *      right or high at the node: cause 2's mark); else INCONCLUSIVE.
 *   2. Stage 2, 60 wealth points: on both units TS+J's gap at 60x5 is at least 1.2 times its 30x5 gap AND world 0's
 *      mispricing - the survival TS+J realises over OPEN0 at the node less the table's like-for-like survival price, each
 *      grid its own (its own table, its own node run on the same 4,000 paths) - is positive at 30x5 and at most two thirds of
 *      that at 60x5. HELD on both; FALSIFIED if on both units the gap rises less than 10% at 60x5 (the bug or structure
 *      branch); else INCONCLUSIVE.
 *   3. The product's gap moves with TS+J's: on both units the product's gap at 60x5 is at least 1.2 times its 30x5 gap. HELD
 *      on both; FALSIFIED if it rises less than 10% on both; else INCONCLUSIVE.
 *   4. 15 return points move TS+J's gap less than 60 wealth points: on both units the 30x15 gap's rise over 30x5 is below the
 *      60x5 gap's rise. HELD on both; FALSIFIED if above on both; else INCONCLUSIVE.
 * Reported, not items: every job's prices by world (whole and survival), the node runs (survival and the whole score over
 * OPEN0 by reduce-7aa.mjs wholeLeg), O47's yearly de-risk share at every node run (firstLeave), the S126 control, and whether 60x15 is warranted (items 2 and 4's 15-point rise both
 * at least 10%).
 *   node research/solver/reduce-7ad.mjs [dir7ad] [dir7ac] [dir7aa] > research/solver/results-7ad.txt
 *   node research/solver/reduce-7ad.mjs --planted   the planted checks alone
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

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ad.md';
export const { N, SEED, LAMBDA, field, label } = A;
// PRICE_TOL 7ac's (the gap to 5 figures); LFL_TOL relative, the two printed to 7 figures; a trace's survival against the
// log's four decimals (SIM_TOL); a world line's weight printed to 4 decimals (WTOL, relative to the prices)
export const WN = 4000, ALPHA1 = 0.025, PRICE_TOL = 1e-3, LFL_TOL = 2e-6, SIM_TOL = 5e-5 + 1e-9, WTOL = 5e-5;
// the jobs: case, arm (the log's), estate weight, grid; the S126 control has no product
export const JOBS = [['bridge 4', 'READER', '0', '30x15'], ['S194', 'OFF', '0.02', '30x15'], ['bridge 4', 'READER', '0', '60x5'], ['S194', 'OFF', '0.02', '60x5'],
  ['bridge 4', 'READER', '0', '30x5'], ['S194', 'OFF', '0.02', '30x5'], ['S126', 'READER', '0', '30x5']];
export const UNITS2 = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02']];
export const tagsOf = id => (id === 'S126' ? ['TS+J'] : ['TS+J', 'PRODUCT']);
export const nodeWorlds = grid => (grid === '30x5' ? [0, 1, 2] : [0]);
const gridOf = g => g.split('x').map(Number);

const CASEL = /^(\S.*?)\s+case \| job (\S+?)\/(\S+?)\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+) points (\d+) quad (\d+)$/;
const LBL = '(\\S+?)\\/(TS\\+J|PRODUCT)\\/(\\S+?)\\/W(\\S+)';
const SOLVEL = new RegExp(`^\\s+solve ${LBL}: table (\\S+) secs (\\S+)$`);
const RANL = new RegExp(`^\\s+ran ${LBL}: (.*)$`);
const GAPL = new RegExp(`^\\s+gap ${LBL}: (\\S+) opening (\\d+),(\\d+)$`);
const JOINTL = new RegExp(`^\\s+joint ${LBL}: (true|false) switchMargin (\\S+) scale (\\S+) cap (\\S+) deathTax (\\S+) tier (\\S+) riskAbove (\\S+)$`);
const MOVESL = new RegExp(`^\\s+moves ${LBL}: best (\\d+) (\\d+)\\/(\\d+) stay (\\d+) (\\d+)\\/(\\d+) chosen (\\d+) (\\d+)\\/(\\d+) held (\\d+)\\/(\\d+)$`);
const PRICEL = new RegExp(`^\\s+price ${LBL}: mixture (\\S+) like-for-like whole (\\S+) survival (\\S+)$`);
const WORLDL = new RegExp(`^\\s+world ${LBL} (\\d+) z (\\S+) weight (\\S+): whole (\\S+) survival (\\S+)$`);
const NODEL = new RegExp(`^\\s+node ${LBL} (\\d+) z (\\S+): sim TS\\+J (\\S+) OPEN0 (\\S+) held0 TS\\+J (\\d+) OPEN0 (\\d+) first1000 TS\\+J (\\S+) OPEN0 (\\S+) paths (\\d+) secs (\\S+)$`);

export function parse(text) {
  const jobs = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], grid: m[3], w: m[4], lambda: m[5], tier: m[6], riskAbove: m[7], mix: m[8], points: +m[9], quad: +m[10], tags: {}, done: false }; jobs.push(cur); continue; }
    if (!cur) continue;
    const T = (a, tag, g, w) => (a === cur.arm && g === cur.grid && w === cur.w ? (cur.tags[tag] || (cur.tags[tag] = { worlds: [], nodes: [] })) : null);
    let t;
    if ((m = SOLVEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.table = m[5]; continue; }
    if ((m = RANL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.ran = m[5]; continue; }
    if ((m = GAPL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.gap = { gap: m[5], open1e3: +m[6], open0: +m[7] }; continue; }
    if ((m = JOINTL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.joint = { joint: m[5] === 'true', margin: m[6], scale: +m[7], cap: +m[8], deathTax: +m[9] }; continue; }
    if ((m = MOVESL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.moves = { best: +m[5], bestTier: [+m[6], +m[7]], stay: +m[8], stayTier: [+m[9], +m[10]], chosen: +m[11], chosenTier: [+m[12], +m[13]], held: [+m[14], +m[15]] }; continue; }
    if ((m = PRICEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.price = { mixture: +m[5], whole: +m[6], surv: +m[7] }; continue; }
    if ((m = WORLDL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.worlds[+m[5]] = { z: +m[6], w: +m[7], whole: +m[8], surv: +m[9] }; continue; }
    if ((m = NODEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { t.nodes[+m[5]] = { z: +m[6], simJ: +m[7], simO: +m[8], heldJ: +m[9], heldO: +m[10], firstJ: +m[11], firstO: +m[12], paths: +m[13] }; continue; }
    if (line.trim() === `done ${cur.arm}/${cur.grid}/W${cur.w}`) { cur.done = true; continue; }
  }
  return jobs;
}

const stripGrid = ran => (ran || '').replace(/(^|\s)pts \S+/, '$1pts _').replace(/(^|\s)grid \S+/, '$1grid _').replace(/(^|\s)quad \S+/, '$1quad _');
/* 7ad's gate. `refA(id, arm, tag, w)` is 7aa's parsed unit (reduce-7aa.mjs parse); `refC(id, arm, w)` 7ac's (reduce-7ac.mjs
   parse), or null where 7ac has none. */
export function gate(jobs, refA, refC, wn = WN) {
  const bad = [];
  for (const [id, arm, w, grid] of JOBS) { const k = jobs.filter(j => j.id === id && j.arm === arm && j.w === w && j.grid === grid).length; if (k !== 1) bad.push(`${id} ${arm}/${grid}/W${w}: ${k} job lines, not 1`); }
  for (const j of jobs) {
    const tagJ = `${j.id} ${j.arm}/${j.grid}/W${j.w}`;
    if (!JOBS.some(([id, a, w, g]) => id === j.id && a === j.arm && w === j.w && g === j.grid)) { bad.push(`${tagJ}: not a registered job`); continue; }
    if (j.lambda !== LAMBDA || j.tier !== 'own' || j.riskAbove !== 'auto' || j.mix !== '3') bad.push(`${tagJ}: job line settings ${j.lambda} ${j.tier} ${j.riskAbove} ${j.mix}`);
    const [pts, quad] = gridOf(j.grid);
    if (j.points !== pts || j.quad !== quad) bad.push(`${tagJ}: ran at ${j.points} points and ${j.quad} return points, not its grid's`);
    const want = tagsOf(j.id);
    for (const tag of Object.keys(j.tags)) if (!want.includes(tag)) bad.push(`${tagJ}: an unregistered ${tag} solve`);
    for (const tag of want) {
      const u = j.tags[tag], L = `${tagJ} ${tag}`, r = refA(j.id, j.arm, tag, j.w);
      if (!u) { bad.push(`${L}: no lines`); continue; }
      if (!r) { bad.push(`${L}: no 7aa ${tag} unit to compare with`); continue; }
      if (u.table === undefined) bad.push(`${L}: no solve line`);
      if (!u.ran) bad.push(`${L}: no ran line`);
      else {
        if (field(u.ran, 'bequestWeight') !== j.w) bad.push(`${L}: ran the estate weight ${field(u.ran, 'bequestWeight')}`);
        if (!!field(u.ran, 'tierState') !== (tag === 'TS+J')) bad.push(`${L}: tier state ${field(u.ran, 'tierState')}`);
        for (const k of ['holdTier', 'bridgeStep', 'readerRef']) if (field(u.ran, k)) bad.push(`${L}: ran ${k} ${field(u.ran, k)}`);
        if (field(u.ran, 'paths') !== String(N) || field(u.ran, 'seed') !== SEED) bad.push(`${L}: ran ${field(u.ran, 'paths')} paths of seed ${field(u.ran, 'seed')}`);
        if (field(u.ran, 'pts') !== String(pts) || field(u.ran, 'quad') !== String(quad)) bad.push(`${L}: its ran line says ${field(u.ran, 'pts')} points and ${field(u.ran, 'quad')} return points, not ${j.grid}`);
        if (j.grid === '30x5') { if (u.ran !== r.ran) bad.push(`${L}: its ran line at 30x5 is not 7aa's`); }
        else if (stripGrid(u.ran) !== stripGrid(r.ran)) bad.push(`${L}: its ran line differs from 7aa's in more than its grid`);
      }
      if (j.grid === '30x5' && u.table !== undefined && u.table !== r.table) bad.push(`${L}: its table ${u.table} at 30x5, 7aa's ${r.table}`);
      if (!u.gap) bad.push(`${L}: no gap line`);
      else if (j.grid === '30x5' && (!r.gap || u.gap.gap !== r.gap.gap || u.gap.open1e3 !== r.gap.open1e3 || u.gap.open0 !== r.gap.open0)) bad.push(`${L}: its gap at 30x5 ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, 7aa's ${r.gap ? `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}` : 'none'}`);
      if (!u.joint) bad.push(`${L}: no joint line`);
      else {
        if (u.joint.joint !== (tag === 'TS+J')) bad.push(`${L}: one policy for every world ${u.joint.joint}`);
        if (u.joint.margin !== '0.001') bad.push(`${L}: solved at margin ${u.joint.margin}`);
        if (u.joint.deathTax !== 0) bad.push(`${L}: a pension death charge ${u.joint.deathTax} (O53)`);
        if (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap) bad.push(`${L}: scale or cap not 7aa's`);
      }
      if (!u.moves) bad.push(`${L}: no moves line`);
      else {
        const [hp, hi] = u.moves.held, keeps = t => t[0] === hp && t[1] === hi;
        if (!keeps(u.moves.stayTier)) bad.push(`${L}: its STAY move leaves the held tiers`);
        if (u.gap && u.gap.gap !== '0' && keeps(u.moves.bestTier)) bad.push(`${L}: its BEST move keeps the held tiers where the gap is ${u.gap.gap}`);
        if (u.gap && u.gap.gap === '0' && u.moves.best !== u.moves.stay) bad.push(`${L}: its BEST and STAY moves differ where the gap is 0`);
        // the price is of the move taken: where the chosen move leaves the held tiers it is BEST, where it keeps them STAY
        if (u.moves.chosen !== (keeps(u.moves.chosenTier) ? u.moves.stay : u.moves.best)) bad.push(`${L}: its chosen move ${u.moves.chosen} is neither BEST where it leaves the held tiers nor STAY where it keeps them`);
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
      if (tag !== 'TS+J') { if (u.nodes.length) bad.push(`${L}: node runs for the product`); continue; }
      const nw = nodeWorlds(j.grid);
      if (u.nodes.filter(Boolean).length !== nw.length || nw.some(k => !u.nodes[k])) bad.push(`${L}: node lines for worlds ${u.nodes.map((x, k) => (x ? k : null)).filter(k => k !== null).join(',')}, not ${nw.join(',')}`);
      for (const k of nw) {
        const nd = u.nodes[k]; if (!nd) continue;
        if (nd.paths !== wn) bad.push(`${L}: node ${k} ran ${nd.paths} paths, not ${wn}`);
        if (u.worlds[k] && Math.abs(nd.z - u.worlds[k].z) > 1e-4) bad.push(`${L}: node ${k} at z ${nd.z}, the world's node ${u.worlds[k].z}`);
        if (nd.heldO !== nd.paths) bad.push(`${L}: OPEN0 kept the held tiers on ${nd.heldO} of ${nd.paths} node ${k} paths`);
        if (u.moves) { const leaves = !(u.moves.chosenTier[0] === u.moves.held[0] && u.moves.chosenTier[1] === u.moves.held[1]); if (nd.heldJ !== (leaves ? 0 : nd.paths)) bad.push(`${L}: TS+J kept the held tiers on ${nd.heldJ} of ${nd.paths} node ${k} paths, its chosen move ${leaves ? 'leaving' : 'keeping'} them`); }
      }
      if (j.grid === '30x5') {
        const c = refC(j.id, j.arm, j.w);
        if (!c) bad.push(`${L}: no 7ac unit to compare the node runs' first 1000 paths with`);
        else for (const k of nw) { const nd = u.nodes[k], cw = c.worlds && c.worlds[k]; if (nd && (!cw || Math.abs(nd.firstJ - cw.simJ) > 1e-9 || Math.abs(nd.firstO - cw.simO) > 1e-9)) bad.push(`${L}: node ${k}'s first 1000 paths (TS+J ${nd.firstJ}, OPEN0 ${nd.firstO}) are not 7ac's world line (${cw ? `${cw.simJ}, ${cw.simO}` : 'none'})`); }
      }
    }
    if (!j.done) bad.push(`${tagJ}: no done line`);
  }
  return bad;
}
export const traceName = (id, arm, grid, rule, k, w) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${grid}-${rule.toLowerCase().replace(/\+/g, '_')}-world${k}@w${w}.json.gz`;
export const traceAgrees = (j, ST, arm, grid, rule, k, w, sim, wn = WN) => !!(j && ST && j.stamp && j.N === wn && String(j.seed) === SEED && j.arm === `${arm}/${rule}/${grid}/W${w}/world${k}` && ['code', 'audit', 'prediction', 'sha'].every(x => j.stamp[x] === ST[x]) && Math.abs(j.sim - sim) <= SIM_TOL);

/*
 * THE ITEMS. `P(id, grid, tag)` is a job's parsed tag (gap, price, worlds, nodes); `K(id, grid, k)` the paired cells of TS+J
 * against OPEN0 at node k (cells(OPEN0, TS+J): saved = TS+J survives where OPEN0 fails).
 */
/* O47's gate: the yearly de-risk share - the paths whose held tiers (the trace's tier byte, pen * 4 + isa, the plan's 0/0 at
   the start) first leave the plan's tiers in year t, t = 0 to `years` - 1, as counts over the run's paths */
export function firstLeave(T, years = 8) {
  const out = new Array(years).fill(0);
  for (let i = 0; i < T.N; i++) for (let t = 0; t < Math.min(years, T.Y); t++) if (T.tier[i * T.Y + t] !== 0) { out[t]++; break; }
  return out;
}
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
export function items(P, K) {
  const out = [];
  // 1. stage 1: world 0's survival price against the node's exact interval
  const i1 = UNITS2.map(([id]) => { const u = P(id, '30x5', 'TS+J'), k = K(id, '30x5', 0), iv = survivalChange(k.lost, k.saved, k.N, ALPHA1), price = u.worlds[0].surv; return { id, price, iv, o: price < iv.lo ? 'priced low' : price > iv.hi ? 'priced high' : 'priced right' }; });
  out.push({ n: 1, text: 'stage 1 (30x5), the bad world: TS+J\'s survival price of its opening lies below the node\'s exact 95% interval (0.025 each) on bridge 4 and S194 (FALSIFIED: inside or above on both)', legs: i1, outcome: tri(i1, x => x.o === 'priced low', x => x.o !== 'priced low') });
  // 2. stage 2, 60 points: the gap up 20% and world 0's mispricing (the node's realised survival over OPEN0 less the
  //    table's price, each at its own grid, on the same 4,000 paths) down by a third
  const g = (id, grid, tag) => Number(P(id, grid, tag).gap.gap);
    // a mispricing is measured only where TS+J's move leaves the held tiers, so its node run differs from OPEN0's; where it
  // keeps them the two runs are equal by construction and the figure is the price alone (the deep review after 7ad, 28 Sep
  // 19:09 UK): null, and that unit cannot close
  const leaves = (id, grid) => { const u = P(id, grid, 'TS+J'); return !u.moves || u.moves.chosen !== u.moves.stay; };
  const miss = (id, grid) => { if (!leaves(id, grid)) return null; const k = K(id, grid, 0); return survivalChange(k.lost, k.saved, k.N, ALPHA1).d - P(id, grid, 'TS+J').worlds[0].surv; };
  const i2 = UNITS2.map(([id]) => { const g30 = g(id, '30x5', 'TS+J'), g60 = g(id, '60x5', 'TS+J'), m30 = miss(id, '30x5'), m60 = miss(id, '60x5'); return { id, g30, g60, rise: g60 / g30 - 1, m30, m60, closes: m30 !== null && m60 !== null && m30 > 0 && m60 <= (2 / 3) * m30 }; });
  out.push({ n: 2, text: '60 wealth points: TS+J\'s gap rises 20% or more AND world 0\'s mispricing (realised at the node less priced, each grid its own) falls by a third or more from a positive value, on both units (FALSIFIED: the gap rises less than 10% on both)', legs: i2, outcome: tri(i2, x => x.rise >= 0.2 && x.closes, x => x.rise < 0.1) });
  // 3. the product's gap with it
  const i3 = UNITS2.map(([id]) => { const g30 = g(id, '30x5', 'PRODUCT'), g60 = g(id, '60x5', 'PRODUCT'); return { id, g30, g60, rise: g60 / g30 - 1 }; });
  out.push({ n: 3, text: 'the product\'s gap rises 20% or more at 60 wealth points on both units (FALSIFIED: less than 10% on both)', legs: i3, outcome: tri(i3, x => x.rise >= 0.2, x => x.rise < 0.1) });
  // 4. 15 return points move TS+J's gap less than 60 wealth points
  const i4 = UNITS2.map(([id]) => { const g30 = g(id, '30x5', 'TS+J'), rq = g(id, '30x15', 'TS+J') / g30 - 1, rp = g(id, '60x5', 'TS+J') / g30 - 1; return { id, rq, rp }; });
  out.push({ n: 4, text: '15 return points raise TS+J\'s gap less than 60 wealth points do, on both units (FALSIFIED: more on both)', legs: i4, outcome: tri(i4, x => x.rq < x.rp, x => x.rq > x.rp) });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, w, tag, pts = 30, quad = 5) => `mix 3 pts ${pts} seed ${SEED} paths ${N} grid total${pts}x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 80000 : 29000} quad ${quad} bequestWeight ${w} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}${tag === 'TS+J' ? ' tierState 0/0,1/1,2/2' : ''}`;
  const refGap = { 'TS+J': '1.3456e-3', PRODUCT: '8.0106e-4' };
  const refA = (id, arm, tag, w) => ({ table: '99.5000', ran: ranOf(id, arm, w, tag), gap: { gap: refGap[tag], open1e3: tag === 'TS+J' ? 2 : 0, open0: 2 }, joint: { joint: tag === 'TS+J', margin: '0.001', scale: 950000, cap: 3800000 } });
  const refC = () => ({ worlds: [{ simJ: 99.3, simO: 98.5 }, { simJ: 100, simO: 100 }, { simJ: 100, simO: 100 }] });
  const GAPS = { '30x5': { 'TS+J': '1.3456e-3', PRODUCT: '8.0106e-4' }, '60x5': { 'TS+J': '1.7000e-3', PRODUCT: '1.0000e-3' }, '30x15': { 'TS+J': '1.4000e-3', PRODUCT: '8.2000e-4' } };
  const jobText = (id, arm, w, grid, o = {}) => {
    const [pts, quad] = gridOf(grid), p = ''.padEnd(16), lines = [`${id.padEnd(16)} case | job ${arm}/${grid}/W${w} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${o.points || pts} quad ${quad}`];
    for (const tag of tagsOf(id)) {
      const L = `${arm}/${tag}/${grid}/W${w}`, gap = (o.gap && o.gap[tag]) || GAPS[grid][tag], price = 100 * Number(gap), s0 = o.surv0 !== undefined ? o.surv0 : 0.5;
      if (!(o.noSolve === tag)) lines.push(`${p} solve ${L}: table ${o.table || '99.5000'} secs 1`);
      lines.push(`${p} ran ${L}: ${o.ran && o.ran[tag] ? o.ran[tag] : ranOf(id, arm, w, tag, pts, quad)}`);
      lines.push(`${p} gap ${L}: ${gap} opening ${tag === 'TS+J' ? 2 : 0},2`);
      lines.push(`${p} joint ${L}: ${tag === 'TS+J'} switchMargin 0.001 scale 950000 cap 3800000 deathTax 0 tier own riskAbove off:_no_tier_above_the_plan`);
      lines.push(`${p} moves ${L}: best 12 2/0 stay 3 ${o.stayTier || '0/0'} chosen ${o.chosen || (tag === 'TS+J' ? '12 2/0' : '3 0/0')} held 0/0`);
      // three worlds weighted 1/6, 2/3, 1/6; world prices chosen to sum to the mixture price
      const w0 = 3 * price, w1 = 0, w2 = 6 * price - w0 - 0;
      lines.push(`${p} price ${L}: mixture ${price.toExponential(6)} like-for-like whole ${(o.lfl !== undefined ? o.lfl : price).toExponential(6)} survival ${(s0 / 6).toExponential(6)}`);
      [[w0, s0], [w1, 0], [w2, 0]].forEach(([wh, sv], k) => lines.push(`${p} world ${L} ${k} z ${[-1.7321, 0, 1.7321][k].toFixed(4)} weight ${[0.1667, 0.6667, 0.1667][k].toFixed(4)}: whole ${wh.toFixed(6)} survival ${sv.toFixed(6)}`));
      if (tag === 'TS+J') for (const k of (o.nodes || (grid === '30x5' ? [0, 1, 2] : [0]))) lines.push(`${p} node ${L} ${k} z ${[-1.7321, 0, 1.7321][k].toFixed(4)}: sim TS+J 99.3000 OPEN0 98.1000 held0 TS+J ${o.heldJ !== undefined ? o.heldJ : 0} OPEN0 ${o.heldO !== undefined ? o.heldO : 4000} first1000 TS+J ${k === 0 ? (o.first || '99.3000') : '100.0000'} OPEN0 ${k === 0 ? '98.5000' : '100.0000'} paths ${o.paths || 4000} secs 1`);
    }
    if (!o.noDone) lines.push(`${p} done ${arm}/${grid}/W${w}`);
    // o.sub: [from, to] replacements on the job's text, each applied once (the TS+J lines come first)
    return (o.sub || []).reduce((t, [f, to]) => { if (!t.includes(f)) throw new Error(`planted sub ${f} not found`); return t.replace(f, to); }, lines.join('\n'));
  };
  const good = () => JOBS.map(([id, a, w, g]) => jobText(id, a, w, g)).join('\n');
  const bent = (id, grid, o) => JOBS.map(([i, a, w, g]) => jobText(i, a, w, g, i === id && g === grid ? o : {})).join('\n');
  const refused = t => String(gate(parse(t), refA, refC).length > 0);
  const sub = (id, grid, ...xs) => refused(bent(id, grid, { sub: xs }));
  cases.push(['a log parsed and gated: seven jobs, the gate passes', `${parse(good()).length} ${gate(parse(good()), refA, refC).length}`, '7 0']);
  cases.push(['the gate refuses a missing job', refused(JOBS.slice(1).map(([id, a, w, g]) => jobText(id, a, w, g)).join('\n')), 'true']);
  cases.push(['the gate refuses a job run twice', refused(good() + '\n' + jobText('S194', 'OFF', '0.02', '60x5')), 'true']);
  cases.push(['the gate refuses an unregistered job (S126 at 60x5)', refused(good() + '\n' + jobText('S126', 'READER', '0', '60x5')), 'true']);
  cases.push(['the gate refuses a job run at other points than its grid', refused(bent('S194', '60x5', { points: 30 })), 'true']);
  cases.push(['the gate refuses a 30x5 table not 7aa\'s', refused(bent('bridge 4', '30x5', { table: '99.5001' })), 'true']);
  cases.push(['the gate refuses a 30x5 gap not 7aa\'s', refused(bent('bridge 4', '30x5', { gap: { 'TS+J': '1.3457e-3' } })), 'true']);
  cases.push(['the gate refuses a 30x5 product gap not 7aa\'s', refused(bent('S194', '30x5', { gap: { PRODUCT: '8.0107e-4' } })), 'true']);
  cases.push(['the gate refuses a finer grid\'s ran line differing in more than its grid', refused(bent('bridge 4', '60x5', { ran: { 'TS+J': ranOf('bridge 4', 'READER', '0', 'TS+J', 60, 5).replace('minPot 29000', 'minPot 30000') } })), 'true']);
  cases.push(['the gate takes a finer grid\'s ran line differing only in its grid', String(gate(parse(bent('bridge 4', '60x5', {})), refA, refC).length), '0']);
  cases.push(['the gate refuses a ran line whose points are not the grid\'s', refused(bent('S194', '30x15', { ran: { 'TS+J': ranOf('S194', 'OFF', '0.02', 'TS+J', 30, 5) } })), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(bent('S194', '60x5', { noSolve: 'PRODUCT' })), 'true']);
  cases.push(['the gate refuses like-for-like prices not summing to the mixture\'s (the world lines summing to them)', sub('bridge 4', '30x15', ['like-for-like whole 1.400000e-1', 'like-for-like whole 1.500300e-1'], ['world READER/TS+J/30x15/W0 0 z -1.7321 weight 0.1667: whole 0.420000', 'world READER/TS+J/30x15/W0 0 z -1.7321 weight 0.1667: whole 0.480000']), 'true']);
  cases.push(['the same, the world lines moved alone: refused by their sum', sub('bridge 4', '30x15', ['world READER/TS+J/30x15/W0 0 z -1.7321 weight 0.1667: whole 0.420000', 'world READER/TS+J/30x15/W0 0 z -1.7321 weight 0.1667: whole 0.480000']), 'true']);
  cases.push(['the gate refuses a STAY move leaving the held tiers', refused(bent('S194', '30x5', { stayTier: '2/0' })), 'true']);
  cases.push(['the gate refuses a missing node run at 30x5 (world 2)', refused(bent('bridge 4', '30x5', { nodes: [0, 1] })), 'true']);
  cases.push(['the gate refuses a node run of other than the registered paths', refused(bent('S194', '60x5', { paths: 3999, heldO: 3999 })), 'true']);
  cases.push(['the gate refuses OPEN0 leaving the held tiers on a node path', refused(bent('bridge 4', '30x15', { heldO: 3999 })), 'true']);
  cases.push(['the gate refuses TS+J keeping the held tiers where its chosen move leaves them', refused(bent('S194', '30x5', { heldJ: 1 })), 'true']);
  cases.push(['the gate refuses a 30x5 node\'s first 1000 paths not 7ac\'s world line', refused(bent('S126', '30x5', { first: '99.2000' })), 'true']);
  cases.push(['the gate refuses a missing done line', refused(bent('bridge 4', '60x5', { noDone: true })), 'true']);
  cases.push(['the gate refuses a job with no 7aa unit to compare', String(gate(parse(good()), (id, arm, tag, w) => (id === 'S194' ? null : refA(id, arm, tag, w)), refC).length > 0), 'true']);
  cases.push(['the gate refuses a pension death charge (O53: the whole score read with the death tax on)', sub('S194', '30x15', ['cap 3800000 deathTax 0 tier', 'cap 3800000 deathTax 0.4 tier']), 'true']);
  cases.push(['the gate refuses job line settings not the registered ones', sub('S194', '30x15', [`lambda ${LAMBDA} tier own`, 'lambda 0.03 tier own']), 'true']);
  cases.push(['the gate refuses an unregistered solve (the product in the S126 control)', sub('S126', '30x5', ['solve READER/TS+J/30x5/W0: table', `solve READER/PRODUCT/30x5/W0: table 99.5000 secs 1\n${''.padEnd(16)} solve READER/TS+J/30x5/W0: table`]), 'true']);
  // a fault in a 30x5 ran line that 7aa's reference carries too (a wrong lookup): the ran line's own fields must catch it
  const both = (id, tag, from, to) => {
    const t = JOBS.map(([i, a, w, g]) => { const x = jobText(i, a, w, g); if (i !== id || !tagsOf(i).includes(tag)) return x; const [pts, quad] = gridOf(g), r0 = ranOf(i, a, w, tag, pts, quad); return x.replace(`${tag}/${g}/W${w}: ${r0}`, `${tag}/${g}/W${w}: ${r0.replace(from, to)}`); }).join('\n');
    const ref = (i, a, tg, w) => { const r = refA(i, a, tg, w); return i === id && tg === tag ? { ...r, ran: r.ran.replace(from, to) } : r; };
    return String(gate(parse(t), ref, refC).length > 0); };
  cases.push(['the fixture\'s shared fault alone passes (the helper plants nothing by itself)', both('S194', 'TS+J', 'minPot 80000', 'minPot 80000'), 'false']);
  cases.push(['the gate refuses a solve at another estate weight (7aa\'s reference too)', both('S194', 'TS+J', 'bequestWeight 0.02', 'bequestWeight 0'), 'true']);
  cases.push(['the gate refuses the product run with the tier state (7aa\'s reference too)', both('bridge 4', 'PRODUCT', 'bridgeRead reader', 'bridgeRead reader tierState 0/0'), 'true']);
  cases.push(['the gate refuses a held tier, Q\'s fix or the reader\'s reference in a ran line (7aa\'s reference too)', both('bridge 4', 'TS+J', 'bridgeRead reader', 'bridgeRead reader bridgeStep 1'), 'true']);
  cases.push(['the gate refuses a ran line of other paths (7aa\'s reference too)', both('S194', 'PRODUCT', `paths ${N} grid`, 'paths 4000 grid'), 'true']);
  cases.push(['the gate refuses TS+J solved per world', sub('S194', '60x5', ['joint OFF/TS+J/60x5/W0.02: true', 'joint OFF/TS+J/60x5/W0.02: false']), 'true']);
  cases.push(['the gate refuses a solve at margin 0', sub('bridge 4', '30x15', ['switchMargin 0.001', 'switchMargin 0']), 'true']);
  cases.push(['the gate refuses a scale not 7aa\'s', sub('S194', '30x15', ['scale 950000', 'scale 950001']), 'true']);
  cases.push(['the gate refuses a product scale not 7aa\'s', sub('S194', '30x15', ['PRODUCT/30x15/W0.02: false switchMargin 0.001 scale 950000', 'PRODUCT/30x15/W0.02: false switchMargin 0.001 scale 950001']), 'true']);
  cases.push(['the gate refuses a missing moves line', sub('bridge 4', '60x5', ['moves READER/TS+J/60x5/W0', 'mvs READER/TS+J/60x5/W0']), 'true']);
  cases.push(['the gate refuses a BEST move keeping the held tiers where the gap is above 0', sub('S194', '30x15', ['best 12 2/0', 'best 12 0/0']), 'true']);
  cases.push(['the gate refuses BEST and STAY differing where the gap is 0', sub('bridge 4', '30x15', ['gap READER/TS+J/30x15/W0: 1.4000e-3', 'gap READER/TS+J/30x15/W0: 0'], ['best 12 2/0', 'best 12 0/0'], ['chosen 12 2/0', 'chosen 3 0/0'], ['held0 TS+J 0 OPEN0', 'held0 TS+J 4000 OPEN0']), 'true']);
  cases.push(['the gate refuses a missing price line', sub('S194', '60x5', ['price OFF/TS+J/60x5', 'prce OFF/TS+J/60x5']), 'true']);
  cases.push(['the gate refuses a mixture price not the gap (x100): the gap 0.14% away', sub('bridge 4', '30x15', ['gap READER/TS+J/30x15/W0: 1.4000e-3', 'gap READER/TS+J/30x15/W0: 1.4020e-3']), 'true']);
  cases.push(['the gate takes a gap 0.05% from the mixture price (its five figures)', sub('bridge 4', '30x15', ['gap READER/TS+J/30x15/W0: 1.4000e-3', 'gap READER/TS+J/30x15/W0: 1.4007e-3']), 'false']);
  cases.push(['the gate refuses world lines not summing to the price line', sub('S194', '60x5', ['world OFF/TS+J/60x5/W0.02 1 z 0.0000 weight 0.6667: whole 0.000000', 'world OFF/TS+J/60x5/W0.02 1 z 0.0000 weight 0.6667: whole 0.001000']), 'true']);
  cases.push(['the gate refuses two world lines (world 1, priced 0, missing)', sub('bridge 4', '60x5', ['world READER/PRODUCT/60x5/W0 1', 'wrld READER/PRODUCT/60x5/W0 1']), 'true']);
  cases.push(['the gate refuses a node run away from its world\'s node', sub('S194', '30x5', ['node OFF/TS+J/30x5/W0.02 1 z 0.0000', 'node OFF/TS+J/30x5/W0.02 1 z 0.1000']), 'true']);
  cases.push(['the gate refuses node runs for the product', sub('S194', '60x5', [`world OFF/PRODUCT/60x5/W0.02 2 z 1.7321 weight 0.1667: whole ${(6 * 0.1 - 0.3).toFixed(6)} survival 0.000000`, `world OFF/PRODUCT/60x5/W0.02 2 z 1.7321 weight 0.1667: whole ${(6 * 0.1 - 0.3).toFixed(6)} survival 0.000000\n node OFF/PRODUCT/60x5/W0.02 0 z -1.7321: sim TS+J 99.3000 OPEN0 98.1000 held0 TS+J 0 OPEN0 4000 first1000 TS+J 99.3000 OPEN0 98.5000 paths 4000 secs 1`]), 'true']);
  cases.push(['the gate refuses an extra node run at a finer grid (world 1 at 60x5)', refused(bent('bridge 4', '60x5', { nodes: [0, 1] })), 'true']);
  cases.push(['the gate refuses a chosen move neither BEST nor STAY (a third leaving move)', refused(bent('bridge 4', '30x5', { chosen: '13 2/0' })), 'true']);
  cases.push(['the gate refuses a chosen move keeping the held tiers that is not STAY', refused(bent('S194', '60x5', { chosen: '4 0/0' })), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = sim => ({ stamp: ST, N: WN, seed: 7002, arm: 'READER/TS+J/60x5/W0/world0', sim });
    cases.push(['a trace agrees with the log to its four decimals, and not beyond', `${traceAgrees(t(99.30004), ST, 'READER', '60x5', 'TS+J', 0, '0', 99.3)} ${traceAgrees(t(99.3001), ST, 'READER', '60x5', 'TS+J', 0, '0', 99.3)} ${traceAgrees(t(99.3), ST, 'READER', '60x5', 'TS+J', 1, '0', 99.3)}`, 'true false false']); }
  cases.push(['O47\'s yearly de-risk share: the first year each path leaves the plan\'s tiers, counted once', String(firstLeave({ N: 4, Y: 4, tier: Uint8Array.from([0, 8, 0, 8, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 4, 0]) }, 4)), '1,1,1,0']);
  cases.push(['the trace name is registered', traceName('bridge 4', 'READER', '60x5', 'TS+J', 0, '0'), 'bridge_4-reader-60x5-ts_j-world0@w0.json.gz']);
  // the items on planted stories
  const mkP = spec => (id, grid, tag) => { const s = spec[`${id}|${grid}|${tag}`] || {}; return { gap: { gap: String(s.gap) }, worlds: [{ surv: s.p0 !== undefined ? s.p0 : 0.5 }], moves: { chosen: s.keeps ? 3 : 12, stay: 3 } }; };
  const mkK = spec => (id, grid, k) => { const s = spec[`${id}|${grid}`] || [48, 0]; return { saved: s[0], lost: s[1], a: WN - s[0] - s[1], d: 0, N: WN }; };
  // cause 1 numerical: priced 0.5 at 30x5 against 1.2 realised; at 60 the gap +30% and the price 0.9 (closes 0.4 >= 0.7/3)
  const num = { 'bridge 4|30x5|TS+J': { gap: 1.3456e-3, p0: 0.5 }, 'bridge 4|60x5|TS+J': { gap: 1.75e-3, p0: 0.9 }, 'bridge 4|30x15|TS+J': { gap: 1.4e-3 }, 'bridge 4|30x5|PRODUCT': { gap: 8e-4 }, 'bridge 4|60x5|PRODUCT': { gap: 1e-3 },
    'S194|30x5|TS+J': { gap: 1.0525e-3, p0: 0.6 }, 'S194|60x5|TS+J': { gap: 1.4e-3, p0: 1.0 }, 'S194|30x15|TS+J': { gap: 1.1e-3 }, 'S194|30x5|PRODUCT': { gap: 7.5e-4 }, 'S194|60x5|PRODUCT': { gap: 9.5e-4 } };
  const nodes = { 'bridge 4|30x5': [48, 0], 'S194|30x5': [64, 0] };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['cause 1, numerical: 1, 2, 3 and 4 HELD', outs(items(mkP(num), mkK(nodes))), '1 HELD, 2 HELD, 3 HELD, 4 HELD']);
  const flat = { ...num, 'bridge 4|60x5|TS+J': { gap: 1.38e-3, p0: 0.52 }, 'S194|60x5|TS+J': { gap: 1.06e-3, p0: 0.61 }, 'bridge 4|60x5|PRODUCT': { gap: 8.1e-4 }, 'S194|60x5|PRODUCT': { gap: 7.6e-4 }, 'bridge 4|30x15|TS+J': { gap: 1.37e-3 }, 'S194|30x15|TS+J': { gap: 1.07e-3 } };
  cases.push(['nothing moves 10% (the bug or structure branch): 2 and 3 FALSIFIED', outs(items(mkP(flat), mkK(nodes))).split(', ').slice(1, 3).join(', '), '2 FALSIFIED, 3 FALSIFIED']);
  cases.push(['cause 2: priced right at the node (price 1.2 against 48 of 4000): 1 FALSIFIED', items(mkP({ ...num, 'bridge 4|30x5|TS+J': { gap: 1.3456e-3, p0: 1.2 }, 'S194|30x5|TS+J': { gap: 1.0525e-3, p0: 1.5 } }), mkK(nodes))[0].outcome, 'FALSIFIED']);
  cases.push(['item 1 split (low on bridge 4, right on S194): INCONCLUSIVE', items(mkP({ ...num, 'S194|30x5|TS+J': { gap: 1.0525e-3, p0: 1.5 } }), mkK(nodes))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 reads the interval at 0.025, not 0.05: a price just under the 0.05 lower end but above the 0.025 one is priced right', (() => { const k = { saved: 48, lost: 0, N: WN }, lo5 = survivalChange(0, 48, WN, 0.05).lo, lo25 = survivalChange(0, 48, WN, 0.025).lo, p = (lo5 + lo25) / 2; return items(mkP({ ...num, 'bridge 4|30x5|TS+J': { gap: 1.3456e-3, p0: p } }), mkK(nodes))[0].legs[0].o; })(), 'priced right']);
  cases.push(['item 2 needs the price to close a third too: the gap +30% but the price stuck is INCONCLUSIVE', items(mkP({ ...num, 'bridge 4|60x5|TS+J': { gap: 1.75e-3, p0: 0.5 } }), mkK(nodes))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 reads the mispricing at 60x5 on its own node run: the price stuck but the realised down to 0.6 is HELD', items(mkP({ ...num, 'bridge 4|60x5|TS+J': { gap: 1.75e-3, p0: 0.5 } }), mkK({ ...nodes, 'bridge 4|60x5': [24, 0] }))[1].outcome, 'HELD']);
  cases.push(['item 2 needs a positive mispricing at 30x5: priced high at 30x5 with the gap +30% is INCONCLUSIVE', items(mkP({ ...num, 'bridge 4|30x5|TS+J': { gap: 1.3456e-3, p0: 1.5 } }), mkK(nodes))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 at 20%, not 10%: a 15% rise with the price closing is INCONCLUSIVE', items(mkP({ ...num, 'bridge 4|60x5|TS+J': { gap: 1.3456e-3 * 1.15, p0: 0.9 } }), mkK(nodes))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 falsified below 10%, not below 20%: a 15% rise on both, the mispricing stuck, is INCONCLUSIVE', items(mkP({ ...num, 'bridge 4|60x5|TS+J': { gap: 1.3456e-3 * 1.15, p0: 0.5 }, 'S194|60x5|TS+J': { gap: 1.0525e-3 * 1.15, p0: 0.6 } }), mkK({ ...nodes, 'bridge 4|60x5': [48, 0], 'S194|60x5': [64, 0] }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 on a negative mispricing growing more negative: INCONCLUSIVE, not HELD', items(mkP({ ...num, 'bridge 4|30x5|TS+J': { gap: 1.3456e-3, p0: 1.5 }, 'bridge 4|60x5|TS+J': { gap: 1.75e-3, p0: 1.7 } }), mkK(nodes))[1].outcome, 'INCONCLUSIVE']);
    cases.push(['item 2 does not count a mispricing where TS+J keeps the held tiers (its node run is OPEN0\'s): the gap +30% and the price alone "closing" is INCONCLUSIVE', items(mkP({ ...num, 'S194|60x5|TS+J': { gap: 1.4e-3, p0: 1.0, keeps: true } }), mkK({ ...nodes, 'S194|60x5': [0, 0] }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 at a third, not a half: the mispricing 0.7 -> 0.4 is HELD', items(mkP({ ...num, 'bridge 4|60x5|TS+J': { gap: 1.75e-3, p0: 0.8 } }), mkK(nodes))[1].outcome, 'HELD']);
  cases.push(['item 3 reads the product, not TS+J: the product flat with TS+J +30% is FALSIFIED', items(mkP({ ...num, 'bridge 4|60x5|PRODUCT': { gap: 8.1e-4 }, 'S194|60x5|PRODUCT': { gap: 7.6e-4 } }), mkK(nodes))[2].outcome, 'FALSIFIED']);
  cases.push(['item 4: 15 return points moving more than 60 wealth points on both is FALSIFIED', items(mkP({ ...num, 'bridge 4|30x15|TS+J': { gap: 1.9e-3 }, 'S194|30x15|TS+J': { gap: 1.5e-3 } }), mkK(nodes))[3].outcome, 'FALSIFIED']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

const logsOf = D => (existsSync(D) ? Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;

/* THE TRACES: every node run's two traces, checked against the log (count, seed, arm, stamp, survival); `bad` gains every
   refusal. Returns the decoded traces by `${id}|${grid}|${rule}|${k}`. */
export function loadTraces(jobs, DIR, ST, bad, wn = WN) {
  const TR = {};
  for (const j of jobs) { const u = j.tags['TS+J']; for (const k of nodeWorlds(j.grid)) for (const [rule, sim] of [['TS+J', u.nodes[k].simJ], ['OPEN0', u.nodes[k].simO]]) {
    const f = join(DIR, traceName(j.id, j.arm, j.grid, rule, k, j.w));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const t = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(t, ST, j.arm, j.grid, rule, k, j.w, sim, wn)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    TR[`${j.id}|${j.grid}|${rule}|${k}`] = decode(t);
  } }
  return TR;
}
/* THE READING, after every gate has passed: every job's prices, the node runs, O47's yearly share, the items and the outcome,
   printed by `out` (the preflight runs it over its own tiny logs, so it has run on files before the real ones) */
export function reading(jobs, TR, out = console.log, wn = WN) {
  const P = (id, grid, tag) => jobs.find(j => j.id === id && j.grid === grid).tags[tag];
  const K = (id, grid, k) => cells(TR[`${id}|${grid}|OPEN0|${k}`].survived, TR[`${id}|${grid}|TS+J|${k}`].survived);
  out(`7AD: THE REFINEMENT CHECK - IS THE BAD WORLD'S PRICE OF THE OPENING WRONG FOR NUMERICAL REASONS? (predictions/diag-7ad.md; ${N} paths of seed ${SEED}, ${wn} a node; the fair-test gates passed: the stamps, 7aa's gate, 7ac's gate, 7ad's gate against both - its 30x5 solves 7aa's, its 30x5 node runs' first 1000 paths 7ac's world lines - and every node trace)\n`);
  out('EVERY JOB: the year-0 gap (the mixture\'s price over 100), and by world the like-for-like price of the mixture\'s two year-0 moves (points, whole | survival)');
  for (const [id, arm, w, grid] of JOBS) for (const tag of tagsOf(id)) {
    const u = P(id, grid, tag);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} ${grid} ${tag}`.padEnd(34)} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0}) | ${u.worlds.map((x, k) => `world ${k} ${x.whole.toFixed(4)} | ${x.surv.toFixed(4)}`).join('  ')} | mixture survival ${u.price.surv.toFixed(4)}`);
  }
  out('\nTHE NODE RUNS: TS+J against OPEN0 at each node run (4,000 paths): saved/lost, the survival difference (points, exact 95% interval at 0.025), beside the world\'s like-for-like survival price; the whole score\'s difference (reduce-7aa.mjs wholeLeg at 0.05)');
  for (const [id, arm, w, grid] of JOBS) { const u = P(id, grid, 'TS+J'); for (const k of nodeWorlds(grid)) {
    const kk = K(id, grid, k), iv = survivalChange(kk.lost, kk.saved, kk.N, ALPHA1), X = TR[`${id}|${grid}|TS+J|${k}`], O = TR[`${id}|${grid}|OPEN0|${k}`];
    const cfg = { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(w) };
    cfg.spendYears = Array.from({ length: X.Y }, (_, t) => { for (let i = 0; i < X.N; i++) if (X.level[i * X.Y + t] > 0) return true; return false; });
    const wl = A.wholeLeg(O, X, cfg, 0.05);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} ${grid} world ${k}`.padEnd(34)} ${kk.saved}/${kk.lost} ${f3(iv.d)} (${iv.lo.toFixed(3)} to ${iv.hi.toFixed(3)}) against the price ${u.worlds[k].surv.toFixed(3)} | whole ${f3(wl.d)} (${wl.lo.toFixed(3)} to ${wl.hi.toFixed(3)}) against the price ${u.worlds[k].whole.toFixed(3)}`);
  } }
  out('\nO47, THE YEARLY DE-RISK SHARE AT THE NODES: the per cent of each node run\'s paths first leaving the plan\'s tiers in years 0 to 7 (the trace\'s tier byte), OPEN0 then TS+J');
  for (const [id, arm, w, grid] of JOBS) for (const k of nodeWorlds(grid)) for (const rule of ['OPEN0', 'TS+J']) {
    const T = TR[`${id}|${grid}|${rule}|${k}`], f = firstLeave(T);
    out(`  ${`${id} (${arm.toLowerCase()}) W${w} ${grid} world ${k} ${rule}`.padEnd(40)} ${f.map(x => (100 * x / T.N).toFixed(1).padStart(5)).join(' ')}`);
  }
  const it = items(P, K);
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const x of it) {
    out(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs) out(`     ${l.id}: ${x.n === 1 ? `price ${l.price.toFixed(3)} against the node's ${f3(l.iv.d)} (${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}): ${l.o}` : x.n === 2 ? `gap ${l.g30.toExponential(4)} -> ${l.g60.toExponential(4)} (${f3(100 * l.rise)}%); world 0's mispricing ${l.m30 === null ? 'not measured' : f3(l.m30)} -> ${l.m60 === null ? 'not measured (TS+J keeps the held tiers: its node run is OPEN0\'s)' : f3(l.m60)}: ${l.closes ? 'falls by a third' : 'does not fall by a third from a positive value'}` : x.n === 3 ? `the product's gap ${l.g30.toExponential(4)} -> ${l.g60.toExponential(4)} (${f3(100 * l.rise)}%)` : `the gap's rise at 30x15 ${f3(100 * l.rq)}%, at 60x5 ${f3(100 * l.rp)}%`}`);
  }
  const want60x15 = it[1].legs.every(l => l.rise >= 0.1) && it[3].legs.every(l => l.rq >= 0.1);
  out(`\nREPORTED: 60x15 warranted by the registered condition (both 60 points and 15 return points raise TS+J's gap by 10% or more on both units): ${want60x15 ? 'yes' : 'no'}`);
  out(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  return it;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ad'), DIR7AC = args[1] || join(HERE, 'results', 'diag7ac'), DIR7AA = args[2] || join(HERE, 'results', 'diag7aa');
  // 7aa: its stamps and its own gate (the units the 30x5 solves must reproduce)
  const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
  requireFairLogs(logsA, A.PRED);
  { const badA = A.gate(unitsA); if (badA.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${badA.join('\n  ')}`); process.exit(1); } }
  const refA = (id, arm, tag, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
  // 7ac: its stamps and its own gate against 7aa (the world lines the 30x5 node runs' first 1000 paths must equal)
  const logsC = logsOf(DIR7AC), unitsC = Object.values(logsC).flatMap(C.parse);
  requireFairLogs(logsC, C.PRED);
  { const refOf = tag => (id, arm, w) => refA(id, arm, tag, w), badC = C.gate(unitsC, refOf('TS+J'), refOf('PRODUCT')); if (badC.length) { console.log(`FAIR-TEST GATE (7ac): FAILED\n  ${badC.join('\n  ')}`); process.exit(1); } }
  const refC = (id, arm, w) => unitsC.find(u => u.id === id && u.arm === arm && u.w === w) || null;
  // 7ad
  const logsD = logsOf(DIR), jobs = Object.values(logsD).flatMap(parse);
  if (JOBS.some(([id, a, w, g]) => !jobs.some(j => j.id === id && j.arm === a && j.w === w && j.grid === g && j.done))) { console.log(`INCOMPLETE - ${jobs.filter(j => j.done).length} of ${JOBS.length} jobs done in ${DIR}`); process.exit(1); }
  requireFairLogs(logsD, PRED);
  const bad = gate(jobs, refA, refC), STD = stampOf(logsD);
  const TR = bad.length ? {} : loadTraces(jobs, DIR, STD, bad);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(jobs, TR);
}
