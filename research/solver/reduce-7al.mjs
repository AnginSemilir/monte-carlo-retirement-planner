/*
 * THE 7AL REDUCER: THE STAGE-BY-STAGE CALIBRATION (predictions/diag-7al.md; PLAN.md 7al; the deep review after 7ah,
 * deep-review-log.md 30 Sep 14:39 UK, its decisive test, amended by the deep review after 7ai, 30 Sep 18:03 UK; O66, O36).
 * Reads results/diag7al/case*.txt (batch-7al.sh: audit-7al.mjs, one process a unit) beside the records each solve is held
 * to, each read through its own stamps: 7ah's (S360 and S370, READER and ORDER), 7ag's (S128 and S130, READER), 7aa's
 * (S194 OFF/TS+J) and 7af's (S194 OFF/PRODUCT, itself held to 7aa's by 7af's gate).
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7al and of each reference record;
 *   - every registered unit once and done, nothing unregistered;
 *   - each unit's settings: lambda held, the plan's tier, 'auto' risk above, three worlds; 30 points, seed 7002, 2,000 paths
 *     a world, the estate weight 0.02, the final year exact, the bridge read the arm's (reader on READER and ORDER, false
 *     on OFF), the tier state and one move for every world on TS+J alone, readerRef 'order' on ORDER alone; the switch
 *     margin 0.001, no pension death charge (O53);
 *   - IDENTITY: every unit's table, ran line (but the path count), year-0 gap and opening, and joint line (scale, cap,
 *     risk-above decision) are its reference record's, so the solve read here is the one whose tables showed O66;
 *   - COMPLETE: an access line (access within the plan, three worlds); per world a bridgeref, a node line of 2,000 paths,
 *     both stage lines, a resid line for every year 0 to the plan's end, and the cell, wcell and band lines;
 *   - CONSISTENT (lines computed apart must agree): the paths through the bridge are the engine's paid count on the
 *     bridgeref line and the after stage's paths; the after stage's paths through are the node line's survivors; every
 *     path claims at year 0; and each stage's per-path mean, times its paths, is the resid lines' sum over the stage's
 *     years (the telescoping) to their rounding.
 * THE ITEM, by the registered rule (the one primary outcome):
 *   1. POST-ACCESS OPTIMISM (O66; the 14:39 review's hypothesis (1)): on each TS+J unit, its three worlds pooled - the
 *      paths alive at access (n, about 6,000), their mean claim there (c, the table's survival for the rest of the plan)
 *      and the paths that survive (s). The margin D is 2 points, declared (about half the smallest of O66's reported
 *      table errors, S128's +4.20; a post-access optimism under it would not carry them). The p-value is the binomial
 *      lower tail P(Bin(n, (c - D)/100) <= s): exact for equal chances and conservative for unequal ones (the paths' true
 *      chances differ; Hoeffding 1956, Theorem 4: the Poisson-binomial tail at or below the mean less one is at most the
 *      binomial's at the mean chance), Holm across the 7 units. Per unit: OPTIMISTIC when the Holm p is below 0.05 and the
 *      point c - 100 s/n is D or more; NO MATERIAL OPTIMISM when the Clopper-Pearson 95% lower end of s/n, in points, is
 *      c - D or more (conservative the same way); else INCONCLUSIVE. O66's four units (S128, S130 and S370 READER, S194
 *      OFF, all TS+J) are also pooled into one (about 24,000 paths). The item: HELD when 2 or more of O66's four units
 *      read OPTIMISTIC; FALSIFIED when none of the 7 units reads OPTIMISTIC and O66's pool reads NO MATERIAL OPTIMISM;
 *      else INCONCLUSIVE. Each unit-world is read the same way and reported, not an item (S194's O66 is its bad world's).
 * Reported, not items (a declared choice, predictions/diag-7al.md: both reviews made the reference's calibration the
 * first item; here it is reported beside the primary item): the reference against its own draw and the engine's bridge
 * payment by world, with Clopper-Pearson intervals; the bridge stage's per-path mean with a normal 95% band (not an exact
 * test); ORDER beside READER on S360 and S370; the shipping default (OFF/PRODUCT on S194), whose world tables each hold
 * their own world's policy while the paths run the mixture's, so its residual carries that policy gap too; the residual
 * pooled by share position, wealth position and claim band; and the per-year residual.
 *   node research/solver/reduce-7al.mjs [dir] [dir7ah] [dir7ag] [dir7aa] [dir7af] > research/solver/results-7al.txt
 *   node research/solver/reduce-7al.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, holm, betaInc } from './stats.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7al.md';
const PRED_AH = 'research/solver/predictions/diag-7ah.md', PRED_AG = 'research/solver/predictions/diag-7ag.md', PRED_AF = 'research/solver/predictions/diag-7af.md';
export const { field, LAMBDA } = A;
export const PTS = '30', SEED = '7002', W = '0.02', NPW = 2000, K = 3, ALPHA = 0.05, D = 2;
// audit-7al.mjs's units, in its order ([case, arm, setting]); a planted check holds the two lists together
export const UNITS7 = [['S360', 'READER', 'TS+J'], ['S360', 'ORDER', 'TS+J'], ['S370', 'READER', 'TS+J'], ['S370', 'ORDER', 'TS+J'], ['S128', 'READER', 'TS+J'], ['S130', 'READER', 'TS+J'], ['S194', 'OFF', 'TS+J'], ['S194', 'OFF', 'PRODUCT']];
export const UNITS = UNITS7.map(([id, a, s]) => [id, a, `${s}/W${W}`]);
export const O66 = [['S128', 'READER'], ['S130', 'READER'], ['S370', 'READER'], ['S194', 'OFF']];
export const refOf = (id, a, l) => (l.startsWith('PRODUCT') ? '7af' : id === 'S194' ? '7aa' : ['S360', 'S370'].includes(id) ? '7ah' : '7ag');

const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;   // reduce-7aa.mjs parse's
const ACCESSL = /^\s+access (\S+?)\/(\S+): year (\d+) years (\d+) worlds (\d+)$/;
const BREFL = /^\s+bridgeref (\S+?)\/(\S+) world (\d+): reference (?:(\S+) at (\d+) own (\S+) drawn (\d+) of (\d+)|-) engine (\S+) paid (\d+) of (\d+)$/;
const NODEL = /^\s+node (\S+?)\/(\S+) world (\d+) z (\S+): sim (\S+) paths (\d+) secs (\d+)$/;
const STAGEL = /^\s+stage (\S+?)\/(\S+) world (\d+) (bridge|after): paths (\d+) start (\S+) end (\S+) through (\d+) mean (\S+) sd (\S+)$/;
const RESIDL = /^\s+resid (\S+?)\/(\S+) world (\d+) year (\d+): paths (\d+) table (\S+) next (\S+)$/;
const CELLL = /^\s+(cell|wcell|band) (\S+?)\/(\S+) world (\d+) (bridge|after) (\S+): pathyears (\d+) table (\S+) next (\S+)$/;
const num = x => (x === '-' ? NaN : Number(x));

/* 7al's own lines, beside reduce-7aa.mjs parse's (case, solve, ran, gap, joint, done) */
export function parse(text) {
  const units = A.parse(text);
  let cur = null, i = -1;
  for (const line of text.split('\n')) {
    if (CASEL.test(line)) { cur = units[++i]; Object.assign(cur, { access: null, bref: [], node: [], stage: [], resid: [], cells: [] }); continue; }
    if (!cur) continue;
    let m;
    const mine = (a, l) => a === cur.arm && l === cur.label;
    if ((m = ACCESSL.exec(line)) && mine(m[1], m[2])) cur.access = { year: +m[3], years: +m[4], worlds: +m[5] };
    else if ((m = BREFL.exec(line)) && mine(m[1], m[2])) cur.bref.push({ k: +m[3], ref: m[4] === undefined ? null : +m[4], v0: m[5] === undefined ? null : +m[5], own: m[6] === undefined ? null : +m[6], drawn: m[7] === undefined ? null : +m[7], of: m[8] === undefined ? null : +m[8], engine: +m[9], paid: +m[10], N: +m[11] });
    else if ((m = NODEL.exec(line)) && mine(m[1], m[2])) cur.node.push({ k: +m[3], z: +m[4], sim: +m[5], paths: +m[6] });
    else if ((m = STAGEL.exec(line)) && mine(m[1], m[2])) cur.stage.push({ k: +m[3], stage: m[4], n: +m[5], start: num(m[6]), end: num(m[7]), through: +m[8], mean: num(m[9]), sd: num(m[10]) });
    else if ((m = RESIDL.exec(line)) && mine(m[1], m[2])) cur.resid.push({ k: +m[3], t: +m[4], n: +m[5], table: num(m[6]), next: num(m[7]) });
    else if ((m = CELLL.exec(line)) && mine(m[2], m[3])) cur.cells.push({ kind: m[1], k: +m[4], stage: m[5], key: m[6], n: +m[7], table: num(m[8]), next: num(m[9]) });
  }
  return units;
}
export const normRan = ran => (ran || '').replace(/(^| )paths \d+/, '$1paths X');
const one = (xs, f) => xs.filter(f);

/* THE GATE. `ref(id, arm, label)` the reference record's parsed unit (7ah's, 7ag's, 7aa's or 7af's); `pts` and `npw` the
   run's size, the registered 30 points and 2,000 paths unless the preflight names its own */
export function gate(units, ref, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint) { bad.push(`${tag}: a solve, ran, gap or joint line missing`); continue; }
    const TSJ = u.label.startsWith('TS+J');
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, finalIntegral: 'true', bridgeRead: u.arm === 'OFF' ? 'false' : 'reader', mix: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (TSJ !== (field(u.ran, 'tierState') !== null)) bad.push(`${tag}: the tier state ${field(u.ran, 'tierState')} on ${u.label}`);
    if ((u.arm === 'ORDER') !== (field(u.ran, 'readerRef') === 'order') || (u.arm !== 'ORDER' && field(u.ran, 'readerRef') !== null)) bad.push(`${tag}: readerRef ${field(u.ran, 'readerRef')} on ${u.arm}`);
    if (u.joint.joint !== TSJ) bad.push(`${tag}: one move for every world ${u.joint.joint} on ${u.label}`);
    if (u.joint.margin !== '0.001') bad.push(`${tag}: switch margin ${u.joint.margin}`);
    if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax} (O53)`);
    // identity
    const r = ref(u.id, u.arm, u.label);
    if (!r) bad.push(`${tag}: no reference unit in ${refOf(u.id, u.arm, u.label)}'s records`);
    else {
      if (r.table !== u.table) bad.push(`${tag}: table ${u.table}, ${refOf(u.id, u.arm, u.label)}'s ${r.table}`);
      if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not ${refOf(u.id, u.arm, u.label)}'s but for the path count`);
      if (!r.gap || r.gap.gap !== u.gap.gap || r.gap.open1e3 !== u.gap.open1e3 || r.gap.open0 !== u.gap.open0) bad.push(`${tag}: gap ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, the reference's ${r.gap && r.gap.gap} ${r.gap && r.gap.open1e3},${r.gap && r.gap.open0}`);
      if (!r.joint || r.joint.scale !== u.joint.scale || r.joint.cap !== u.joint.cap || r.joint.decided !== u.joint.decided || r.joint.joint !== u.joint.joint) bad.push(`${tag}: its joint line is not the reference's`);
    }
    // complete
    const ac = u.access;
    if (!ac) { bad.push(`${tag}: no access line`); continue; }
    if (ac.worlds !== K) bad.push(`${tag}: ${ac.worlds} worlds, not ${K}`);
    if (!(ac.year >= 1 && ac.year <= ac.years)) bad.push(`${tag}: access at year ${ac.year} of ${ac.years} (a bridge household's access falls inside the plan)`);
    for (let k = 0; k < K; k++) {
      const br = one(u.bref, x => x.k === k), nd = one(u.node, x => x.k === k), sb = one(u.stage, x => x.k === k && x.stage === 'bridge'), sa = one(u.stage, x => x.k === k && x.stage === 'after');
      const rs = one(u.resid, x => x.k === k), cl = one(u.cells, x => x.k === k);
      if (br.length !== 1 || nd.length !== 1 || sb.length !== 1 || sa.length !== 1) { bad.push(`${tag} world ${k}: ${br.length} bridgeref, ${nd.length} node, ${sb.length} and ${sa.length} stage lines, not 1 each`); continue; }
      if ((u.arm === 'OFF') !== (br[0].ref === null)) bad.push(`${tag} world ${k}: a reference on the bridgeref line ${br[0].ref} with the arm ${u.arm}`);
      if (nd[0].paths !== npw || br[0].N !== npw || (br[0].of !== null && br[0].of !== npw)) bad.push(`${tag} world ${k}: ${nd[0].paths} node paths, bridgeref of ${br[0].N}, not ${npw}`);
      for (let t = 0; t <= ac.years; t++) if (rs.filter(x => x.t === t).length !== 1) { bad.push(`${tag} world ${k}: ${rs.filter(x => x.t === t).length} resid lines for year ${t}, not 1`); break; }
      if (cl.length !== 16) bad.push(`${tag} world ${k}: ${cl.length} cell, wcell and band lines, not 16`);
      // consistent
      const y0 = rs.find(x => x.t === 0);
      if (y0 && y0.n !== npw) bad.push(`${tag} world ${k}: ${y0.n} paths claim at year 0, not ${npw}`);
      if (sb[0].n !== npw) bad.push(`${tag} world ${k}: the bridge stage has ${sb[0].n} paths, not ${npw}`);
      if (sb[0].through !== br[0].paid) bad.push(`${tag} world ${k}: ${sb[0].through} through the bridge, the engine paid ${br[0].paid}`);
      if (sa[0].n !== br[0].paid) bad.push(`${tag} world ${k}: the after stage has ${sa[0].n} paths, ${br[0].paid} alive at access`);
      if (Math.abs(100 * sa[0].through / npw - nd[0].sim) > 5e-5 + 1e-9) bad.push(`${tag} world ${k}: ${sa[0].through} survive the after stage, the node line's sim ${nd[0].sim}`);
      for (const [st, s] of [['bridge', sb[0]], ['after', sa[0]]]) {
        const ys = rs.filter(x => (st === 'bridge' ? x.t < ac.year : x.t >= ac.year) && x.n > 0);
        const sum = ys.reduce((t, x) => t + x.n * (x.table - x.next), 0), tol = ys.reduce((t, x) => t + x.n, 0) * 1e-4 + s.n * 1e-4 + 1e-6;
        if (s.n > 0 && !(Math.abs(sum - s.n * s.mean) <= tol)) bad.push(`${tag} world ${k}: the ${st} stage's mean x paths ${(s.n * s.mean).toFixed(2)}, the resid lines' sum ${sum.toFixed(2)} (the telescoping)`);
      }
    }
  }
  return bad;
}

/* the binomial lower tail P(Bin(n, q) <= s) (betaInc: P(X <= s) = I_{1-q}(n - s, s + 1)) */
export const binomLower = (s, n, q) => (s >= n ? 1 : q <= 0 ? 1 : q >= 1 ? (s >= n ? 1 : 0) : betaInc(n - s, s + 1, 1 - q));

/* one after stage read against its claim: n paths alive at access, c their mean claim (points), s survivors */
export const readOf = (n, c, s) => ({ n, c, s, pt: n > 0 ? c - 100 * s / n : NaN, p: n > 0 ? binomLower(s, n, Math.max(0, (c - D) / 100)) : 1, lo: n > 0 ? 100 * clopperPearson(s, n)[0] : NaN });
export const poolOf = xs => { const n = xs.reduce((t, x) => t + x.n, 0), s = xs.reduce((t, x) => t + x.s, 0); return readOf(n, n ? xs.reduce((t, x) => t + x.n * x.c, 0) / n : NaN, s); };
const isO66 = x => O66.some(([id, a]) => id === x.id && a === x.arm);
/* ITEM 1 over the TS+J units' after stages, one row a unit-world: [{ id, arm, k, n, c, s }] */
export function item1(rows) {
  const units = UNITS.filter(([, , l]) => l.startsWith('TS+J')).map(([id, arm]) => ({ id, arm, ...poolOf(rows.filter(x => x.id === id && x.arm === arm)) }));
  const adj = holm(units.map(u => u.p));
  units.forEach((u, i) => { u.pH = adj[i]; u.read = u.pH < ALPHA && u.pt >= D ? 'OPTIMISTIC' : u.lo >= u.c - D ? 'NO MATERIAL OPTIMISM' : 'INCONCLUSIVE'; });
  const worlds = rows.map(x => { const r = { ...x, ...readOf(x.n, x.c, x.s) }; r.read = r.p < ALPHA && r.pt >= D ? 'optimistic' : r.lo >= r.c - D ? 'no material optimism' : 'inconclusive'; return r; });
  const o66 = rows.filter(isO66), pool = poolOf(o66);
  pool.read = pool.lo >= pool.c - D ? 'NO MATERIAL OPTIMISM' : 'NOT SHOWN';
  const held = O66.filter(([id, a]) => units.some(u => u.id === id && u.arm === a && u.read === 'OPTIMISTIC')).length;
  const outcome = held >= 2 ? 'HELD' : !units.some(u => u.read === 'OPTIMISTIC') && o66.length === O66.length * K && pool.read === 'NO MATERIAL OPTIMISM' ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { units, worlds, pool, held, outcome };
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
export function reading(units, out = console.log) {
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  out(`7AL: THE STAGE-BY-STAGE CALIBRATION - TS+J (and the shipping default on S194) at W${W}, 30 points, ${NPW} paths a world at each world's node (seed ${SEED}); each world's table claim against its next along the policy's own paths; every solve held to its record (7ah, 7ag, 7aa, 7af)`);
  // item 1
  const rows = [];
  for (const [id, a, l] of UNITS.filter(([, , l]) => l.startsWith('TS+J'))) {
    const u = get(id, a, l);
    for (let k = 0; k < K; k++) { const s = u.stage.find(x => x.k === k && x.stage === 'after'); rows.push({ id, arm: a, k, n: s.n, c: s.start, s: s.through }); }
  }
  const I = item1(rows);
  out(`\nITEM 1 (post-access optimism, O66): each TS+J unit's three worlds pooled - the paths alive at access, their mean claim there (c) against the share that survive; margin ${D} points; binomial lower tail at (c - ${D}), Holm over ${I.units.length}`);
  out('  household  arm    |   paths  claim c  survived  c - surv | CP 95% low   p         Holm p   | reading');
  const line = (x, tag) => `${tag} | ${String(x.n).padStart(7)}  ${f4(x.c).padStart(7)}  ${f4(x.n ? 100 * x.s / x.n : NaN).padStart(8)}  ${f4(x.pt).padStart(8)} | ${f4(x.lo).padStart(9)}  ${x.p.toExponential(2).padStart(8)}  ${x.pH === undefined ? '       -' : x.pH.toExponential(2).padStart(8)} | ${x.read}`;
  for (const x of I.units) out(line(x, `  ${x.id.padEnd(9)}  ${x.arm.padEnd(6)}`));
  out(line(I.pool, `  O66's four pooled `));
  out(`  O66's four units OPTIMISTIC: ${I.held} (HELD at 2 or more; FALSIFIED when none of the ${I.units.length} is OPTIMISTIC and O66's pool reads NO MATERIAL OPTIMISM) -> ${I.outcome}`);
  out(`  by world (reported; unadjusted p): ${I.worlds.map(x => `${x.id} ${x.arm} w${x.k} ${f2(x.pt)} [${x.read}]`).join('; ')}`);
  // reported
  out(`\nREPORTED (not items):`);
  out(`  THE REFERENCE, ITS OWN DRAW AND THE ENGINE'S BRIDGE PAYMENT, by world (year 0, the opening accessible money; CP 95% on the draws):`);
  for (const [id, a, l] of UNITS) {
    const u = get(id, a, l);
    for (const b of u.bref.sort((x, y) => x.k - y.k)) {
      const ci = (k, n) => { const [lo, hi] = clopperPearson(k, n); return `[${f2(100 * lo)}, ${f2(100 * hi)}]`; };
      out(`    ${id.padEnd(5)} ${`${a}/${l}`.padEnd(20)} world ${b.k}: reference ${b.ref === null ? '     -  ' : f4(b.ref).padStart(8)}  own ${b.own === null ? '   -   ' : `${f4(b.own)} ${ci(b.drawn, b.of)}`}  engine ${f4(b.engine)} ${ci(b.paid, b.N)}`);
    }
  }
  out(`  THE BRIDGE STAGE (each path's claim at year 0 less its claim at access, 0 when it failed; mean with a normal 95% band, descriptive) and THE AFTER STAGE (claim at access less the outcome), by world:`);
  for (const [id, a, l] of UNITS) {
    const u = get(id, a, l);
    for (let k = 0; k < K; k++) {
      const sb = u.stage.find(x => x.k === k && x.stage === 'bridge'), sa = u.stage.find(x => x.k === k && x.stage === 'after');
      const band = s => (s.n > 1 ? `${f2(s.mean)} +/- ${f2(1.96 * s.sd / Math.sqrt(s.n))}` : '-');
      out(`    ${id.padEnd(5)} ${`${a}/${l}`.padEnd(20)} world ${k}: bridge ${band(sb).padEnd(16)} (claim ${f2(sb.start)} to ${f2(sb.end)}, ${sb.through} of ${sb.n} through)  after ${band(sa).padEnd(16)} (claim ${f2(sa.start)}, survived ${f2(sa.n ? 100 * sa.through / sa.n : NaN)} of ${sa.n})`);
    }
  }
  out(`  ORDER BESIDE READER (the 14:39 review: hypothesis (1) predicts ORDER leaves the after stage unchanged; (2) that it moves the bridge stage), after-stage c - survived and bridge-stage mean:`);
  for (const id of ['S360', 'S370']) for (let k = 0; k < K; k++) {
    const pick = (a, st) => get(id, a, `TS+J/W${W}`).stage.find(x => x.k === k && x.stage === st);
    const af = s => (s.n ? s.start - 100 * s.through / s.n : NaN);
    out(`    ${id} world ${k}: after READER ${f2(af(pick('READER', 'after')))} ORDER ${f2(af(pick('ORDER', 'after')))}   bridge READER ${f2(pick('READER', 'bridge').mean)} ORDER ${f2(pick('ORDER', 'bridge').mean)}`);
  }
  out(`  THE SHIPPING DEFAULT (OFF/PRODUCT on S194: each world's table holds its own world's policy, the paths run the mixture's, so its residual carries that policy gap too), beside OFF/TS+J: see the two stage tables above`);
  out(`  THE RESIDUAL BY POSITION AND BAND (table - next over path-years, pooled over the worlds; share and wealth: mid-cell = weight on the node above 0.25 to 0.75):`);
  for (const [id, a, l] of UNITS) {
    const u = get(id, a, l), parts = [];
    for (const kind of ['cell', 'wcell', 'band']) for (const st of ['bridge', 'after']) {
      const keys = [...new Set(u.cells.filter(x => x.kind === kind && x.stage === st).map(x => x.key))];
      for (const key of keys) {
        const xs = u.cells.filter(x => x.kind === kind && x.stage === st && x.key === key && x.n > 0), n = xs.reduce((t, x) => t + x.n, 0);
        parts.push(`${kind === 'cell' ? 'share' : kind === 'wcell' ? 'wealth' : 'band'} ${st} ${key} ${n ? f2(xs.reduce((t, x) => t + x.n * (x.table - x.next), 0) / n) : '-'} (${n})`);
      }
    }
    out(`    ${id.padEnd(5)} ${`${a}/${l}`.padEnd(20)} ${parts.join('; ')}`);
  }
  out(`  THE PER-YEAR RESIDUAL (table - next, points; years from 0; '|' marks access), by world:`);
  for (const [id, a, l] of UNITS) {
    const u = get(id, a, l);
    for (let k = 0; k < K; k++) out(`    ${id.padEnd(5)} ${`${a}/${l}`.padEnd(20)} world ${k}: ${u.resid.filter(x => x.k === k).sort((x, y) => x.t - y.t).map(x => `${x.t === u.access.year ? '| ' : ''}${x.n ? f2(x.table - x.next) : '.'}`).join(' ')}`);
  }
  out(`\nOUTCOME: 1 ${I.outcome}`);
  return I;
}

/* PLANTED: built logs the gate must pass clean, faults it must refuse; the item over built rows; the arithmetic */
export function builtLog(o = {}) {
  const T = 30, AC = 5, lines = [];
  for (const [id, a, l] of UNITS) {
    if (o.skip === `${id}|${a}|${l}`) continue;
    const TSJ = l.startsWith('TS+J'), L = `${a}/${l}`;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda ${o.lambda && id === 'S128' ? '0.03' : LAMBDA} tier own riskAbove auto mix 3`);
    lines.push(`${''.padEnd(16)} solve ${L}: table ${o.table && id === 'S130' ? '90.0000' : '95.0000'} secs 100`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed 7002 paths ${o.paths && id === 'S360' ? 1000 : NPW} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot 80000 quad 5${TSJ && !(o.tsOff && id === 'S370' && a === 'READER') ? ' tierState 0/0,1/1,2/2' : ''}${(a === 'ORDER' && !(o.noRef && id === 'S370')) || (o.refOnReader && id === 'S128') ? ' readerRef order' : ''} bequestWeight 0.02 finalIntegral true bridgeRead ${a === 'OFF' ? 'false' : 'reader'}`);
    lines.push(`${''.padEnd(16)} gap ${L}: ${o.gap && id === 'S194' && TSJ ? '2.0000e-3' : '1.0000e-3'} opening 2,2`);
    lines.push(`${''.padEnd(16)} joint ${L}: ${TSJ} switchMargin ${o.margin && id === 'S128' ? '0' : '0.001'} scale 180000 cap 720000 deathTax ${o.death && id === 'S130' ? 0.4 : 0} tier own riskAbove off:_no_tier_above_the_plan`);
    if (!(o.noAccess && id === 'S130')) lines.push(`${''.padEnd(16)} access ${L}: year ${AC} years ${T} worlds ${o.worlds2 && id === 'S128' ? 2 : 3}`);
    for (let k = 0; k < K; k++) {
      // per world: every path claims 90 at year 0; 1,800 reach access claiming 80 there, 1,440 survive
      const paid = o.paidOff && id === 'S360' && k === 1 ? 1799 : 1800, surv = 1440, sim = 100 * (o.simOff && id === 'S370' && k === 2 ? 1441 : surv) / NPW;
      lines.push(`${''.padEnd(16)} bridgeref ${L} world ${k}: reference ${a === 'OFF' ? '-' : `95.0000 at 100000 own 94.5000 drawn 1890 of ${NPW}`} engine ${(100 * paid / NPW).toFixed(4)} paid ${paid} of ${NPW}`);
      lines.push(`${''.padEnd(16)} node ${L} world ${k} z 0.0000: sim ${sim.toFixed(4)} paths ${NPW} secs 10`);
      // residual per year: bridge years 0..4, each path's claim 90 -> 80 by year 5 (2 points a year), failures at year 4
      for (let t = 0; t <= T; t++) {
        if (o.noResid && id === 'S128' && k === 0 && t === 7) continue;
        if (t < AC) { const n = t < 4 ? NPW : NPW, c = 90 - 2 * t, nx = t < 4 ? 88 - 2 * t : (1800 * 80) / NPW; lines.push(`${''.padEnd(16)} resid ${L} world ${k} year ${t}: paths ${n} table ${c.toFixed(4)} next ${nx.toFixed(4)}`); }
        else if (t < T) lines.push(`${''.padEnd(16)} resid ${L} world ${k} year ${t}: paths 1800 table 80.0000 next 80.0000`);
        else lines.push(`${''.padEnd(16)} resid ${L} world ${k} year ${t}: paths 1800 table 80.0000 next ${(100 * surv / 1800).toFixed(4)}`);
      }
      // the bridge stage: 1,800 paths 90 -> 80 (10), 200 paths 90 -> 0 (90): mean (18000 + 18000) / 2000 = 18
      const bm = o.teleOff && id === 'S194' && TSJ && k === 0 ? 19 : 18;
      lines.push(`${''.padEnd(16)} stage ${L} world ${k} bridge: paths ${NPW} start 90.0000 end ${(1800 * 80 / NPW).toFixed(4)} through ${o.throughOff && id === 'S360' && k === 1 ? 1799 : 1800} mean ${bm.toFixed(4)} sd 25.0000`);
      lines.push(`${''.padEnd(16)} stage ${L} world ${k} after: paths ${o.afterOff && id === 'S370' && k === 1 ? 1799 : 1800} start 80.0000 end 80.0000 through ${surv} mean 0.0000 sd 40.0000`);
      if (!(o.noCells && id === 'S360' && k === 2)) for (const [kind, keys] of [['cell', ['mid', 'near']], ['wcell', ['mid', 'near']], ['band', ['lt50', '50-90', '90-99', 'ge99']]]) for (const st of ['bridge', 'after']) for (const key of keys) lines.push(`${''.padEnd(16)} ${kind} ${L} world ${k} ${st} ${key}: pathyears 100 table 85.0000 next 85.0000`);
    }
    if (!(o.noDone && id === 'S194' && !TSJ)) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.twice) { const i = lines.findIndex(x => x.trim() === `done READER/TS+J/W${W}`); lines.push(...lines.slice(0, i + 1)); }
  if (o.extra) lines.push(`S999             case | unit READER/TS+J/W0.02 | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [];
  const IDENT = ['table', 'refTable', 'gap'];
  const refsOf = o => { const us = parse(builtLog(Object.keys(o).some(k => IDENT.includes(k)) ? {} : o)); return (id, a, l) => { const r = us.find(u => u.id === id && u.arm === a && u.label === l) || null; return r && o.refTable && id === 'S360' && a === 'ORDER' ? { ...r, table: '94.0000' } : r; }; };
  const refused = o => String(gate(parse(builtLog(o)), refsOf(o)).length > 0);
  { const bad = gate(parse(builtLog()), refsOf({})); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: 'S194|OFF|PRODUCT/W0.02' }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }],
    ['a unit not done', { noDone: true }], ['a table that is not the reference\'s', { table: true }], ['a reference table that differs', { refTable: true }], ['a gap that is not the reference\'s', { gap: true }],
    ['1,000 paths a world, not 2,000', { paths: true }], ['a TS+J unit without the tier state', { tsOff: true }], ['ORDER without readerRef order', { noRef: true }], ['readerRef on READER', { refOnReader: true }],
    ['a switch margin of 0', { margin: true }], ['a pension death charge', { death: true }], ['no access line', { noAccess: true }], ['two worlds', { worlds2: true }], ['a missing resid year', { noResid: true }],
    ['missing cell lines', { noCells: true }], ['the paths through the bridge off the engine\'s paid count', { throughOff: true }], ['the after stage\'s paths off the engine\'s paid count', { afterOff: true }], ['the node sim off the after stage\'s survivors', { simOff: true }], ['a stage mean that does not telescope', { teleOff: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  // the item
  const row = (id, arm, k, n, c, s) => ({ id, arm, k, n, c, s });
  const all = (f) => UNITS.filter(([, , l]) => l.startsWith('TS+J')).flatMap(([id, a]) => [0, 1, 2].map(k => f(id, a, k)));
  const calib = (id, a, k) => row(id, a, k, 1800, 80, 1440);   // 80.00 claimed, 80.00 survive
  const opt = (id, a, k) => row(id, a, k, 1800, 80, 1350);     // 80 claimed, 75 survive
  const unitRead = (I, id, a) => I.units.find(u => u.id === id && u.arm === a).read;
  cases.push(['all calibrated, 1,800 a world: FALSIFIED (O66\'s pool of 21,600 inside 2 points)', item1(all(calib)).outcome, 'FALSIFIED']);
  cases.push(['a calibrated unit (5,400 paths, CP low 78.9) reads NO MATERIAL OPTIMISM', unitRead(item1(all(calib)), 'S128', 'READER'), 'NO MATERIAL OPTIMISM']);
  cases.push(['S128 and S130 optimistic by 5 points: HELD', item1(all((id, a, k) => (['S128', 'S130'].includes(id) ? opt(id, a, k) : calib(id, a, k)))).outcome, 'HELD']);
  cases.push(['only S128 optimistic: INCONCLUSIVE', item1(all((id, a, k) => (id === 'S128' ? opt(id, a, k) : calib(id, a, k)))).outcome, 'INCONCLUSIVE']);
  cases.push(['S360 and S370 ORDER optimistic, O66\'s units calibrated: INCONCLUSIVE, not FALSIFIED', item1(all((id, a, k) => (a === 'ORDER' ? opt(id, a, k) : calib(id, a, k)))).outcome, 'INCONCLUSIVE']);
  cases.push(['every unit 1.8 points optimistic (78.2 survive): no unit OPTIMISTIC, O66\'s pool NOT SHOWN: INCONCLUSIVE', item1(all((id, a, k) => row(id, a, k, 1800, 80, 1408))).outcome, 'INCONCLUSIVE']);
  cases.push(['a pessimistic table reads NO MATERIAL OPTIMISM (99 claimed, all survive)', unitRead(item1(all((id, a, k) => row(id, a, k, 1800, 99, 1800))), 'S128', 'READER'), 'NO MATERIAL OPTIMISM']);
  cases.push(['80 claimed, 1,550 of 2,000 survive (77.5): p at 78 is 0.3, not OPTIMISTIC (p at 80 would be 0.003)', unitRead(item1([row('S128', 'READER', 0, 2000, 80, 1550)]), 'S128', 'READER'), 'INCONCLUSIVE']);
  cases.push(['1 point optimistic on 500 paths (CP low 75.2): INCONCLUSIVE, not NO MATERIAL OPTIMISM on the point', unitRead(item1([row('S128', 'READER', 0, 500, 80, 395)]), 'S128', 'READER'), 'INCONCLUSIVE']);
  cases.push(['S128 and S130 optimistic in worlds 1 and 2 only, world 0 calibrated: the pooled units read HELD', item1(all((id, a, k) => (['S128', 'S130'].includes(id) && k > 0 ? row(id, a, k, 1800, 80, 1300) : calib(id, a, k)))).outcome, 'HELD']);
  cases.push(['one unit at p 0.02 among 7: Holm lifts it over 0.05, not OPTIMISTIC', unitRead(item1(all((id, a, k) => (id === 'S128' ? row(id, a, k, 1800, 80, 1383 + (k === 2)) : calib(id, a, k)))), 'S128', 'READER'), 'INCONCLUSIVE']);
  // the arithmetic
  cases.push(['binomLower: P(Bin(10, 0.5) <= 2) = 56/1024', binomLower(2, 10, 0.5).toFixed(7), (56 / 1024).toFixed(7)]);
  cases.push(['binomLower: P(Bin(20, 0.9) <= 20) = 1', String(binomLower(20, 20, 0.9)), '1']);
  {
    // Hoeffding: a Poisson-binomial lower tail at or below its mean less one is at most the binomial's at the mean chance
    const ps = Array.from({ length: 60 }, (_, i) => 0.55 + 0.4 * (i % 7) / 6), n = ps.length, pbar = ps.reduce((t, x) => t + x, 0) / n;
    let dp = [1]; for (const p of ps) { const nx = new Array(dp.length + 1).fill(0); dp.forEach((v, j) => { nx[j] += v * (1 - p); nx[j + 1] += v * p; }); dp = nx; }
    const ok = []; for (let s = 0; s <= Math.floor(n * pbar - 1); s++) { const pb = dp.slice(0, s + 1).reduce((t, x) => t + x, 0); ok.push(pb <= binomLower(s, n, pbar) + 1e-12); }
    cases.push(['the Poisson-binomial lower tail is within the binomial one at the mean chance (60 unequal chances)', String(ok.every(Boolean) && ok.length > 20), 'true']);
  }
  {
    const src = readFileSync(join(HERE, 'audit-7al.mjs'), 'utf8'), m = /^export const UNITS = (\[.*\]);$/m.exec(src);
    cases.push(['the units are audit-7al.mjs\'s, in its order', m ? String(JSON.stringify(JSON.parse(m[1].replace(/'/g, '"'))) === JSON.stringify(UNITS7)) : 'no UNITS line', 'true']);
  }
  cases.push(['parse reads a stage line', JSON.stringify(parse('S128             case | unit READER/TS+J/W0.02 | lambda x tier own riskAbove auto mix 3\n                 stage READER/TS+J/W0.02 world 2 after: paths 1799 start 83.1234 end 80.0000 through 1440 mean 3.1234 sd 39.9000\n')[0].stage), '[{"k":2,"stage":"after","n":1799,"start":83.1234,"end":80,"through":1440,"mean":3.1234,"sd":39.9}]']);
  cases.push(['parse reads an OFF bridgeref line', JSON.stringify(parse('S194             case | unit OFF/TS+J/W0.02 | lambda x tier own riskAbove auto mix 3\n                 bridgeref OFF/TS+J/W0.02 world 0: reference - engine 90.0000 paid 1800 of 2000\n')[0].bref[0]), '{"k":0,"ref":null,"v0":null,"own":null,"drawn":null,"of":null,"engine":90,"paid":1800,"N":2000}']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diag7al'), dirs = { '7ah': R_(1, 'diag7ah'), '7ag': R_(2, 'diag7ag'), '7aa': R_(3, 'diag7aa'), '7af': R_(4, 'diag7af') };
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const preds = { '7ah': PRED_AH, '7ag': PRED_AG, '7aa': A.PRED, '7af': PRED_AF }, refUnits = {};
  for (const [k, d] of Object.entries(dirs)) { const L = logsOf(d); requireFairLogs(L, preds[k]); refUnits[k] = Object.values(L).flatMap(A.parse); }
  const ref = (id, a, l) => refUnits[refOf(id, a, l)].find(u => u.id === id && u.arm === a && u.label === l && u.done !== false && u.table !== undefined) || null;
  const bad = gate(units, ref);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; every solve its record's (7ah, 7ag, 7aa, 7af: table, ran line but the path count, gap, opening, joint line); every line present; the stages, the engine's payment, the survivors and the per-year residuals agree (planted ${np})\n`);
  reading(units);
}
