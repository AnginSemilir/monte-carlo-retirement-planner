/*
 * M14c - DOES THE TABLE MISJUDGE THE BETS? (24 Sep; the maintainer: "I'm surprised they make the wrong move, for me it
 * points to a problem with the solver"). Called by experiment.mjs flex with BETAUDIT=1, on M14b's arm with one tier above
 * (TIERSABOVE=1) and M14b's settings, so the solve is M14b's by construction - and checked to be: every one of the 3,000
 * held paths must reproduce m14b-up's record, survival and the tier held each year, or nothing is reported.
 *
 * Then, at the position where each held path FIRST takes the tier above (the bet), up to NPOS of them (a fixed draw):
 *   bet    the move the table chose there (it holds the tier above)
 *   stay   the table's best move that does not hold it
 * the table's score margin between the two (score units: a survival point is 0.01), and each simulated from that exact
 * position - take the move now, follow the same solved plan afterwards - on the same NP fresh paths (paired). The paths
 * are fresh (seed 9100 + position), so nothing is measured on the paths the positions were found on.
 * Before any rollout, a planted check: from each position, taking the bet on the held path's own remaining draws must
 * reproduce that path's recorded outcome (the start mechanism is exact), or nothing is reported.
 *
 * Writes results/<tag>/<id>.bets.json; reduce-m14c.mjs reads them behind the fair-test gate.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { runPolicy, scoreMoves } from '../../src/solver/solve.js';
import { readRecord } from './record.mjs';

const ABOVE = 3;   // the tier menu's index for one above the plan (fast.js tiersFor: after the plan's own and two below)

// the table's score for every move at a position, weighted over the mixture's worlds exactly as rankActions weights them
function scoresAt(r, s, t, held) {
  const n = r.actions.length, SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n);
  const tt = r.finalExact ? t : Math.min(t, r.m.ctx.totalYears - 1);
  if (!r.mix) { scoreMoves(r, s, tt, SC, TX, BQ, held); return SC; }
  const S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
  r.mix.tables.forEach((tab, k) => {
    scoreMoves(tab, s, tt, S2, T2, B2, held);
    const w = r.mix.weights[k];
    for (let ai = 0; ai < n; ai++) { if (S2[ai] === -Infinity || SC[ai] === -Infinity) SC[ai] = -Infinity; else SC[ai] += w * S2[ai]; }
  });
  return SC;
}

export function betAudit({ E, r, held, solvedRs, trS, id, tag, RESULTS, CODE, PREDICTION, NPOS = 40, NP = 500, refPath = null, outDir = null }) {
  const T = r.m.ctx.totalYears, N = held.length;
  const isAbove = ai => r.actions[ai].tierPen === ABOVE || r.actions[ai].tierIsa === ABOVE;
  // 1. the solve is M14b's: every held path reproduces m14b-up's record
  const ref = readRecord(refPath || join(RESULTS, 'm14b-up', `${id}.solver.record.json.gz`));
  if (ref.N !== N || ref.Y !== trS.Y) throw new Error(`BETAUDIT ${id}: the held paths differ in shape from m14b-up's record`);
  let pathDiff = 0, tierDiff = 0;
  for (let i = 0; i < N; i++) if (!!ref.paths.survived[i] !== !!solvedRs[i].survived) pathDiff++;
  for (let k = 0; k < trS.tier.length; k++) if (trS.tier[k] !== ref.trace.tier[k] || trS.level[k] !== ref.trace.level[k]) tierDiff++;
  if (pathDiff || tierDiff) throw new Error(`BETAUDIT ${id}: NOT M14b's solve - ${pathDiff} paths differ in survival and ${tierDiff} path-years in tier or level from m14b-up's record`);
  // 2. each held path's first bet: the position (start of that year) and the move chosen
  const firsts = [];
  held.forEach((zs, i) => {
    let found = null;
    runPolicy(r, zs, { visit: (t, s, h, ai) => { if (!found && t < T && isAbove(ai)) found = { i, t, s: Float64Array.from(s), held: { ...h }, ai }; } });
    if (found) firsts.push(found);
  });
  let seed = 1409; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const pool = [...firsts]; const picks = [];
  while (picks.length < NPOS && pool.length) picks.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  picks.sort((a, b) => a.i - b.i);
  // 3. planted check: from each position, the bet on the path's own remaining draws reproduces the recorded outcome
  for (const p of picks) {
    const o = runPolicy(r, held[p.i], { start: { s: p.s, t: p.t, held: p.held, firstAi: p.ai } });
    if (!!o.survived !== !!solvedRs[p.i].survived) throw new Error(`BETAUDIT ${id}: the start mechanism does not reproduce held path ${p.i} from year ${p.t}`);
  }
  // 4. at each position: the table's margin, and bet against stay simulated on the same fresh paths
  const rows = [];
  picks.forEach((p, pi) => {
    const SC = scoresAt(r, p.s, p.t, p.held);
    let stay = -1; for (let ai = 0; ai < SC.length; ai++) if (!isAbove(ai) && SC[ai] > -Infinity && (stay < 0 || SC[ai] > SC[stay])) stay = ai;
    const paths = E.pathsForSeed(9100 + pi, NP, T);
    const sim = ai => paths.map(zs => runPolicy(r, zs, { start: { s: p.s, t: p.t, held: p.held, firstAi: ai } }));
    const a = sim(p.ai), b = stay >= 0 ? sim(stay) : null;
    let sa = 0, sb = 0, disc = 0, estA = 0, estB = 0, both = 0;
    for (let k = 0; k < NP; k++) {
      const ua = a[k].survived ? 1 : 0, ub = b && b[k].survived ? 1 : 0;
      sa += ua; sb += ub; if (ua !== ub) disc++;
      if (ua && ub) { both++; estA += a[k].terminalNet; estB += b[k].terminalNet; }
    }
    rows.push({
      path: p.i, year: p.t, wealth: p.s[0] + p.s[1] + p.s[2], recordedSurvived: !!solvedRs[p.i].survived,
      // tier indices, not labels: buildActions labels index 3 "3 tiers down" though it is one ABOVE (tiersFor puts the
      // tier above after the two below) - found 24 Sep by this audit's test; the move itself is right
      bet: r.actions[p.ai].label, stay: stay >= 0 ? r.actions[stay].label : null,
      betTier: [r.actions[p.ai].tierPen, r.actions[p.ai].tierIsa], stayTier: stay >= 0 ? [r.actions[stay].tierPen, r.actions[stay].tierIsa] : null,
      margin: stay >= 0 ? SC[p.ai] - SC[stay] : null, tableBetFirst: stay >= 0 ? SC[p.ai] >= SC[stay] : null,
      survBet: 100 * sa / NP, survStay: 100 * sb / NP, se: 100 * Math.sqrt(disc) / NP,
      estateBet: both ? estA / both : null, estateStay: both ? estB / both : null
    });
  });
  const out = { tag, id, experiment: 'm14c-bets', held: N, betPaths: firsts.length, positions: rows.length, paths: NP, reproduced: { paths: N, pathDiff, tierDiff }, rows, code: CODE, prediction: PREDICTION };
  const dir = outDir || join(RESULTS, tag);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.bets.json`), JSON.stringify(out, null, 1));
  return out;
}
export function betSummary(out) {
  const { id, rows, held: N, betPaths } = out; const NP = out.paths;
  const d = rows.map(x => x.survBet - x.survStay), mean = d.reduce((a, b) => a + b, 0) / (d.length || 1);
  return `${id} BETAUDIT: M14b reproduced on ${N} paths; ${betPaths} paths bet; ${rows.length} positions x ${NP} paths: bet - stay ${mean >= 0 ? '+' : ''}${mean.toFixed(2)} points on average`;
}
