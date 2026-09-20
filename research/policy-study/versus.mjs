/*
 * LIKE FOR LIKE: THE CURRENT SET-UP AGAINST A GENETIC SEARCH, ON THE SAME HOUSEHOLDS.
 *
 * Arm A is what the app does today, in the order it does it: score the 18 policy combinations at the
 * household's current portfolio, take the winner, then run the tournament under that policy and take
 * its winner. Arm B is one genetic search over the joint space - accumulation, draw order, harvest,
 * lump sum, windfall order - started cold, on the same seed, with the same total budget of simulated
 * paths arm A spent. Arm B3 is the same search with three times the budget, to see what more compute
 * buys.
 *
 * Nothing either arm saw during its search is used to judge it. Every finalist is re-scored on a
 * held-out seed at 3,000 paths, and the differences reported are between those held-out figures.
 * That is the only fair test of a search whose whole failure mode is picking the candidate its own
 * sample flattered - and it measures that failure directly, as the gap between what each arm claimed
 * during the search and what it scored afterwards.
 *
 * Usage: node versus.mjs [households=20] [searchSeed=4242] [heldOutSeed=777]
 */
import * as E from '../engine.mjs';
import { evolve } from '../../src/evolve.js';
import { buildScenarios } from './scenarios.mjs';

const N = Number(process.argv[2] || 20), SEED = Number(process.argv[3] || 4242), HELD = Number(process.argv[4] || 777);
const TP = 300, TT = 400, CONFIRM = 3000;
const all = buildScenarios().filter(s => s.plan.demographics.currentAgeSelf <= s.plan.demographics.retireAgeSelf - 5);
/*
 * Two cohorts. The library retires everyone at 60 or 65, after the pension access age, so none of its
 * households has a bridge to fund - and the bridge is where the way of saving and the way of drawing
 * interact most. So half the households are the library's, spread across it, and half are the same
 * households retiring at 52: a FIRE cohort, with a six-year gap the pots must carry alone.
 */
const fire = (sc) => { const p = JSON.parse(JSON.stringify(sc.plan)); p.demographics.retireAgeSelf = 52; if (p.demographics.planningMode === 'couple') p.demographics.retireAgePart = 52; return { ...sc, id: sc.id + 'F', name: sc.name.replace(/^[a-z]+\//, 'fire/'), plan: p, cohort: 'fire' }; };
const young = all.filter(s => s.plan.demographics.currentAgeSelf <= 44);
const pick = [];
const half = Math.ceil(N / 2);
for (let i = 0; i < half; i++) pick.push({ ...all[Math.floor(i * all.length / half)], cohort: 'library' });
for (let i = 0; i < N - half; i++) pick.push(fire(young[Math.floor(i * young.length / (N - half))]));
console.log(`${pick.length} accumulating households (${half} library, ${N - half} retiring at 52); search seed ${SEED}, held-out seed ${HELD} at ${CONFIRM} paths\n`);

const held = (plan) => E.monteCarlo(E.resolveMpaa(plan), { trials: CONFIRM, seed: HELD });
const rate = (st) => st.successRate;

function armA(plan) {
  let used = 0;
  // the policy search, as the app runs it
  const cands = E.buildPolicyCandidates(plan).map(c => {
    const stats = E.monteCarlo(E.buildContext(E.resolveMpaa(c.planState)), { trials: TP, seed: SEED }); used += TP;
    return { ...c, stats };
  });
  const pol = E.explainPick(cands, { priorities: E.DEFAULT_PRIORITIES }).winner;
  const withPolicy = E.normalizePlan(JSON.parse(JSON.stringify(plan)));
  withPolicy.spending.decumulationPolicy = pol.decumulationPolicy;
  withPolicy.spending.drawdownStrategy = pol.drawdownStrategy;
  withPolicy.config.harvestPersonalAllowance = pol.harvestPersonalAllowance;
  // the tournament under that policy, every player scored on the same seed
  const t = E.buildTournament(withPolicy, { scope: 'full' });
  const players = t.strategies.filter(s => !s.isEntrant).map(s => {
    if (s.candidates) { used += s.candidates.length * TT; return E.resolveSearchPlayer(s, { trials: TT, seed: SEED, priorities: E.DEFAULT_PRIORITIES }); }
    return s;
  }).map(p => { const stats = p.stats || E.monteCarlo(p.planState, { trials: TT, seed: SEED }); if (!p.stats) used += TT; return { ...p, stats }; });
  const won = E.explainPick(players, { priorities: E.DEFAULT_PRIORITIES }).winner;
  return { plan: won.planState, used, claimed: won.stats.successRate, label: `${won.name} + ${pol.decumulationPolicy}${pol.harvestPersonalAllowance ? '' : ' (harvest off)'}${pol.drawdownStrategy === 'Full 25% Lump Sum' ? ', lump sum' : ''}` };
}

function armB(plan, budget) {
  const r = evolve(E, plan, { budget, seed: SEED, scope: 'full' });
  return { plan: r.winner.planState, used: r.used, claimed: r.winner.stats.successRate, label: r.winner.describe, generations: r.generations, genome: r.winner.genome };
}

const rows = [];
const t0 = Date.now();
for (const sc of pick) {
  let A, B, B3;
  try { A = armA(sc.plan); } catch (e) { console.log(`${sc.id}: arm A failed: ${e.message}`); continue; }
  B = armB(sc.plan, A.used);
  B3 = armB(sc.plan, A.used * 3);
  const h0 = held(sc.plan), hA = held(A.plan), hB = held(B.plan), hB3 = held(B3.plan);
  const dB = rate(hB) - rate(hA), dB3 = rate(hB3) - rate(hA);
  const verdict = (d) => (d > E.RATE_EPSILON_PTS ? 'B wins' : d < -E.RATE_EPSILON_PTS ? 'A wins' : 'tie');
  rows.push({ id: sc.id, name: sc.name, cohort: sc.cohort, base: rate(h0), A: rate(hA), B: rate(hB), B3: rate(hB3), dB, dB3,
    curseA: A.claimed - rate(hA), curseB: B.claimed - rate(hB), curseB3: B3.claimed - rate(hB3),
    usedA: A.used, keep: B3.genome.keep, novel: !/^(Bracket Fill Basic|Bracket Fill|Sequential|ISA First|Windfall to ISA)/.test(B3.label.split('; ')[1] || '') });
  console.log(`${sc.id.padEnd(5)} ${sc.name.slice(0, 40).padEnd(41)} now ${rate(h0).toFixed(1).padStart(5)}  A ${rate(hA).toFixed(1).padStart(5)}  B ${rate(hB).toFixed(1).padStart(5)} (${dB >= 0 ? '+' : ''}${dB.toFixed(1)}, ${verdict(dB)})  B3 ${rate(hB3).toFixed(1).padStart(5)} (${dB3 >= 0 ? '+' : ''}${dB3.toFixed(1)}, ${verdict(dB3)})  | ${A.used} paths`);
  console.log(`       A: ${A.label}`);
  console.log(`       B3: ${B3.label}`);
}
const n = rows.length;
const med = (arr) => { const s = arr.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const tally = (k) => ({ win: rows.filter(r => r[k] > E.RATE_EPSILON_PTS).length, tie: rows.filter(r => Math.abs(r[k]) <= E.RATE_EPSILON_PTS).length, lose: rows.filter(r => r[k] < -E.RATE_EPSILON_PTS).length });
const tB = tally('dB'), tB3 = tally('dB3');
console.log(`\n${n} households in ${((Date.now() - t0) / 1000).toFixed(0)}s, held-out at ${CONFIRM} paths`);
console.log(`equal budget:   B wins ${tB.win}, ties ${tB.tie}, A wins ${tB.lose}; B - A mean ${mean(rows.map(r => r.dB)).toFixed(2)} pts, median ${med(rows.map(r => r.dB)).toFixed(2)}, best +${Math.max(...rows.map(r => r.dB)).toFixed(1)}, worst ${Math.min(...rows.map(r => r.dB)).toFixed(1)}`);
console.log(`triple budget:  B3 wins ${tB3.win}, ties ${tB3.tie}, A wins ${tB3.lose}; B3 - A mean ${mean(rows.map(r => r.dB3)).toFixed(2)} pts, median ${med(rows.map(r => r.dB3)).toFixed(2)}, best +${Math.max(...rows.map(r => r.dB3)).toFixed(1)}, worst ${Math.min(...rows.map(r => r.dB3)).toFixed(1)}`);
console.log(`over the household's own plan: A +${mean(rows.map(r => r.A - r.base)).toFixed(2)}, B +${mean(rows.map(r => r.B - r.base)).toFixed(2)}, B3 +${mean(rows.map(r => r.B3 - r.base)).toFixed(2)} pts on average`);
console.log(`winner's curse (claimed in search minus held-out): A ${mean(rows.map(r => r.curseA)).toFixed(2)}, B ${mean(rows.map(r => r.curseB)).toFixed(2)}, B3 ${mean(rows.map(r => r.curseB3)).toFixed(2)} pts`);
console.log(`B3 kept the household's own contributions in ${rows.filter(r => r.keep).length} of ${n}; chose a draw order outside the named five in ${rows.filter(r => r.novel).length} of ${n}`);
for (const c of ['library', 'fire']) {
  const rs = rows.filter(r => r.cohort === c); if (!rs.length) continue;
  const t = { win: rs.filter(r => r.dB3 > E.RATE_EPSILON_PTS).length, tie: rs.filter(r => Math.abs(r.dB3) <= E.RATE_EPSILON_PTS).length, lose: rs.filter(r => r.dB3 < -E.RATE_EPSILON_PTS).length };
  console.log(`  ${c.padEnd(8)} cohort, triple budget: B3 wins ${t.win}, ties ${t.tie}, A wins ${t.lose}; B3 - A mean ${mean(rs.map(r => r.dB3)).toFixed(2)} pts, A over own plan +${mean(rs.map(r => r.A - r.base)).toFixed(2)}, B3 over own plan +${mean(rs.map(r => r.B3 - r.base)).toFixed(2)}`);
}
