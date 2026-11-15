/*
 * BESIDE THE SHARE CHOICE'S READ (EXPLORATORY, seed 7002; written after the read, deciding nothing). SHARE-CHOOSE.md's read
 * (results-share-choose.txt) gives the forecast's pick against the pots' share and against MEANS, and the simulation's pick
 * pooled. The maintainer's choice that follows is between the options themselves, so this prints, from the same units and
 * on the same paths, what the read does not (the reviewer at the read asked for sections C to G,
 * reviews/2026-11-14-read-share-choose.md findings 1 to 5):
 *   A. MEANS (the share by each person's full means, the other option offered) less the pots' share (today's rule), by unit
 *      and pooled, paired on the 4,000 paths;
 *   B. the simulation's pick (the share best on the first 1,000 paths, a tie to the pots' share, as the reducer's) less the
 *      pots' share and less MEANS, by unit, scored on the other 3,000;
 *   C. what a pick by simulation costs by the run's own clocks (a guide: the units ran four at a time): the grid's solves,
 *      and each share's 1,000 simulated paths on top (each arm's engine time over its 4,000 paths and the audit's CHECK
 *      runs of E.runTrial), against one full solve at today's share;
 *   D. the minimum pot: the share cuts each person's minimum pot with the spending (couple.js singlePlanFor), so the paths a
 *      comparison parts are told apart by how they fail: in the plan's last year below the minimum pot, or before it;
 *   E. the forecasts above 1 (the joint move's score holds the estate term and the cuts beside the two survival chances);
 *   F. the band: the pots' fraction without D99's 40%-to-60% band (the arm at 0.6 on the 60/40 units, today's elsewhere)
 *      against today's, and MEANS against it; on the four plain couples and on the ensemble's ten apart;
 *   G. what each design does to the spending delivered, the pot left and lifetime tax, against today's share.
 *   node research/solver/share-choose-beside.mjs [dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, armName, cells, change, bestOn, pickOf, SIM } from './reduce-share-choose.mjs';
import { survivalChangeU, pooledSummed } from './stats.mjs';
import { UNITS, CHECK } from './audit-share-choose.mjs';
import { planOfUnit } from './audit-share-ensemble.mjs';
import { SHARE_BAND } from '../../src/solver/couple.js';
import * as Eng from '../engine.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'share-choose-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = UNITS.map(d => raw.find(u => u.id === d.id)).filter(Boolean).map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
if (units.length !== UNITS.length) { console.error(`share-choose-beside: ${units.length} of ${UNITS.length} units`); process.exit(2); }
const f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
const gbp = v => `${v < 0 ? '-' : ''}£${Math.round(Math.abs(v)).toLocaleString('en-GB')}`;
const same = (x, y) => Math.abs(x - y) < 1e-9, med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const u0 = units[0], N = u0.N, AT = Math.min(SIM, Math.floor(N / 2));
console.log(`BESIDE THE SHARE CHOICE'S READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} units, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${N} paths, ${u0.pts} points`);
const ofPots = plan => { const of = w => (plan.accounts || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0); const a = of('self'), b = of('part'); return a / (a + b); };
const rows = units.map(U => {
  const T = U.arms[armName(U.pots)], Mn = U.arms[U.means.arm], sim = bestOn(U, 0, AT, U.pots), S = U.arms[armName(sim)];
  const pick = pickOf(U.forecasts.full, U.shares, U.pots), P = U.arms[armName(pick)];
  const surv = X => 100 * X.survived.reduce((s, v) => s + v, 0) / N;
  let best = U.shares[0]; for (const x of U.shares) if (surv(U.arms[armName(x)]) > surv(U.arms[armName(best)]) + 1e-12) best = x;
  // the pots' fraction without the band: inside it, the arm at the fraction rounded to the grid (the 60/40 units' 0.6); outside, today's
  const frac = ofPots(planOfUnit(UNITS.find(d => d.id === U.id)).plan), inBand = frac >= SHARE_BAND[0] - 1e-9 && frac <= SHARE_BAND[1] + 1e-9;
  const nbShare = inBand ? Math.round(10 * frac) / 10 : U.pots, NB = U.arms[armName(nbShare)];
  const mp = change(T, Mn), sc = { pots: cells(T, S, AT, N), means: cells(Mn, S, AT, N) };
  return { U, T, Mn, S, P, B: U.arms[armName(best)], pick, best, sim, frac, inBand, nbShare, NB, mp, sc, means: surv(Mn), pots: surv(T),
    sPots: survivalChangeU(sc.pots.a, sc.pots.lost, sc.pots.saved, sc.pots.d), sMeans: survivalChangeU(sc.means.a, sc.means.lost, sc.means.saved, sc.means.d) };
});

console.log(`\nA. MEANS less the pots' share, paired on the ${N} paths (the means' share, the pots' share; survival under each):`);
for (const r of rows) console.log(`  ${r.U.id.padEnd(11)} means ${r.U.means.share.toFixed(4)} (arm ${r.U.means.arm}), pots ${r.U.pots}: ${r.means.toFixed(2)}% and ${r.pots.toFixed(2)}%; MEANS less the pots' ${iv(r.mp)}${r.mp.hi < 0 ? ' (wholly below nought)' : r.mp.lo > 0 ? ' (wholly above nought)' : ''}`);
const PA = pooledSummed(rows.map(r => r.mp.cells));
console.log(`  pooled over the ${rows.length}: ${iv(PA)} points; units with the interval wholly below nought: ${rows.filter(r => r.mp.hi < 0).map(r => `${r.U.id} ${f(r.mp.d)}`).join(', ') || 'none'}; wholly above: ${rows.filter(r => r.mp.lo > 0).length}`);

console.log(`\nB. The simulation's pick (the share best on the first ${AT} paths, a tie to the pots' share), scored on the other ${N - AT}, by unit:`);
for (const r of rows) console.log(`  ${r.U.id.padEnd(11)} pick ${r.sim}: less the pots' share ${iv(r.sPots)}; less MEANS ${iv(r.sMeans)}`);
const PS = pooledSummed(rows.map(r => r.sc.pots)), PM = pooledSummed(rows.map(r => r.sc.means));
console.log(`  pooled: less the pots' share ${iv(PS)}; less MEANS ${iv(PM)}; a unit below the pots' share with its interval wholly below nought: ${rows.filter(r => r.sPots.hi < 0).map(r => r.U.id).join(', ') || 'none'}`);

// C. the cost of a pick by simulation, by the run's clocks: one share's 1,000 paths at its arm's engine time a path
const per = x => x.engineSecs / (N + CHECK);   // the arm's engine clock covers its N paths and the audit's CHECK runs of E.runTrial
const C = rows.map(r => {
  const one = r.U.times.full[r.U.pots], solves = r.U.shares.reduce((s, x) => s + r.U.times.full[x], 0);
  const paths = r.U.shares.reduce((s, x) => s + SIM * per(r.U.arms[armName(x)]), 0), chosen = SIM * per(r.S);
  return { id: r.U.id, engine: (N * per(r.T)) / one, solves: solves / one, both: (solves + paths) / one, credited: (solves + paths - chosen) / one, paths: paths / one };
});
const span = k => `x${med(C.map(c => c[k])).toFixed(2)} (x${Math.min(...C.map(c => c[k])).toFixed(2)} to x${Math.max(...C.map(c => c[k])).toFixed(2)})`;
console.log(`\nC. The cost of a pick by simulation, against one full solve at today's share, by the run's own clocks (the units ran 4 at a time, beside the pre-commit hook for part of the run: a guide), the median over the ${C.length} units and the range:`);
console.log(`  the engine's ${N} paths at today's share ${span('engine')}; the grid's solves ${span('solves')}; ${SIM} paths a share on the grid ${span('paths')}; the grid's solves and ${SIM} paths a share ${span('both')}; the same with the chosen share's ${SIM} paths counted as the headline's own run ${span('credited')}`);
console.log(`  by unit, the grid's solves and ${SIM} paths a share: ${C.map(c => `${c.id} x${c.both.toFixed(2)}`).join('; ')}`);

// D. the minimum pot: the paths a comparison parts, by how they fail
const kinds = (A, B, from = 0, to = N) => {   // B against A: lost (A survives, B fails) and saved, each by the failing arm's kind
  const o = { lostFloor: 0, lostBefore: 0, savedFloor: 0, savedBefore: 0 };
  for (let i = from; i < to; i++) {
    if (A.survived[i] && !B.survived[i]) { if (B.minPot[i]) o.lostFloor++; else o.lostBefore++; }
    else if (!A.survived[i] && B.survived[i]) { if (A.minPot[i]) o.savedFloor++; else o.savedBefore++; }
  }
  return o;
};
const kw = k => `${k.lostFloor + k.lostBefore} lost (${k.lostFloor} at the minimum pot in the last year, ${k.lostBefore} before), ${k.savedFloor + k.savedBefore} saved (${k.savedFloor} at it, ${k.savedBefore} before)`;
const cut = (floor, s) => `the first person ${gbp(s * floor)}, the second ${gbp((1 - s) * floor)}`;
console.log(`\nD. The minimum pot. The household's minimum pot is cut between the two people by the share (couple.js singlePlanFor). The paths each comparison parts, by how the failing arm fails:`);
let fails = 0, floorFails = 0, lastOther = 0;
for (const r of rows) {
  for (const x of [...r.U.shares.map(s => r.U.arms[armName(s)]), ...(r.U.means.arm === 'means' ? [r.Mn] : [])]) for (let i = 0; i < N; i++) if (!x.survived[i]) { fails++; if (x.minPot[i]) floorFails++; else if (x.failYear[i] === x.T) lastOther++; }
  const floor = r.T.minPotFloor, plan = planOfUnit(UNITS.find(d => d.id === r.U.id)).plan;
  const potsOf = w => (plan.accounts || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  console.log(`  ${r.U.id.padEnd(11)} the pots ${gbp(potsOf('self'))} and ${gbp(potsOf('part'))}; the minimum pot ${gbp(floor)}${floor > 0 ? `: at today's share (${r.U.pots}) ${cut(floor, r.U.pots)}; at the means' (${r.U.means.share.toFixed(2)}) ${cut(floor, r.Mn.share)}; at 0.5 ${cut(floor, 0.5)}` : ''}`);
  if (!same(r.pick, r.best)) console.log(`      the forecast's pick ${r.pick} against the best tried ${r.best}: ${kw(kinds(r.B, r.P))}`);
  console.log(`      MEANS against today's share: ${kw(kinds(r.T, r.Mn))}; the simulation's pick ${r.sim} against today's, on the last ${N - AT}: ${kw(kinds(r.T, r.S, AT, N))}`);
}
console.log(`  over every solver arm of the ${rows.length} units: ${fails} failing paths, ${floorFails} of them in the last year below the minimum pot, ${lastOther} others in the last year`);

// E. the forecasts above 1
const above = rows.filter(r => Object.values(r.U.forecasts.full).some(v => v > 1));
console.log(`\nE. Units with a full forecast above 1 (the joint move's score: the two tables' own chances multiplied, plus the estate term, less the cuts): ${above.length} of ${rows.length} (${above.map(r => r.U.id).join(', ')}); the largest ${Math.max(...rows.flatMap(r => Object.values(r.U.forecasts.full))).toFixed(6)}`);

// F. the band
console.log(`\nF. The band. The first person's fraction of the pots and the pots' share without the 40%-to-60% band (the arm at that fraction where it falls inside the band, today's where it does not):`);
for (const r of rows) {
  const nb = change(r.T, r.NB), mn = change(r.NB, r.Mn);
  console.log(`  ${r.U.id.padEnd(11)} ${r.U.group.padEnd(9)} the fraction ${r.frac.toFixed(4)}${r.inBand ? ` (inside the band: today's ${r.U.pots}, without it ${r.nbShare})` : ` (outside the band: today's ${r.U.pots})`}; without the band less today's ${iv(nb)}; MEANS less without the band ${iv(mn)}`);
}
const grp = (label, rs) => {
  const nb = pooledSummed(rs.map(r => cells(r.T, r.NB))), mn = pooledSummed(rs.map(r => cells(r.NB, r.Mn))), mt = pooledSummed(rs.map(r => r.mp.cells)), sm = pooledSummed(rs.map(r => r.sc.means));
  console.log(`  ${label} (${rs.length}): MEANS less today's ${iv(mt)}; without the band less today's ${iv(nb)}; MEANS less without the band ${iv(mn)}; the simulation's pick less MEANS on the last ${N - AT} ${iv(sm)}`);
};
grp('all', rows); grp('the couples inside the band, where it changes the share', rows.filter(r => r.inBand)); grp('the four plain couples', rows.filter(r => r.U.group === 'plain')); grp("the share ensemble's ten", rows.filter(r => r.U.group !== 'plain'));
console.log(`  the fractions inside the band: ${[...new Set(rows.filter(r => r.inBand).map(r => r.frac.toFixed(4)))].join(', ')} (every in-band couple's first person the elder: ${rows.filter(r => r.inBand).every(r => { const c = Eng.buildContext(Eng.resolveMpaa(Eng.normalizePlan(planOfUnit(UNITS.find(x => x.id === r.U.id)).plan))); return c.ageSelf0 > c.agePart0; })})`);

// G. spending, the pot and tax: each design against today's share, paired on the same paths
const paired = (A, B, k, from, to) => { const n = to - from; let s = 0, s2 = 0, a = 0; for (let i = from; i < to; i++) { const d = B[k][i] - A[k][i]; s += d; s2 += d * d; a += A[k][i]; } const m = s / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m)); return { d: m, se: sd / Math.sqrt(n), base: a / n }; };
const beyond = x => (x.d > 1.96 * x.se ? 1 : x.d < -1.96 * x.se ? -1 : 0);
const moneyOf = (label, pick, from, to) => {
  const out = rows.map(r => { const B = pick(r); return { id: r.U.id, sp: paired(r.T, B, 'delivered', from, to), pot: paired(r.T, B, 'pot', from, to), tax: paired(r.T, B, 'tax', from, to), same: B === r.T }; });
  const pct = x => 100 * x.d / x.base, mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  console.log(`  ${label}, on paths ${from} to ${to - 1}: spending delivered up beyond noise on ${out.filter(o => beyond(o.sp) > 0).length} and down on ${out.filter(o => beyond(o.sp) < 0).length} (${out.filter(o => beyond(o.sp) < 0).map(o => `${o.id} ${f(pct(o.sp), 2)}%`).join(', ') || 'none'}), its mean change over units ${f(mean(out.map(o => pct(o.sp))), 2)}%; the mean pot left lower beyond noise on ${out.filter(o => beyond(o.pot) < 0).length} (${out.filter(o => beyond(o.pot) < 0).map(o => `${o.id} ${gbp(o.pot.d)}, se ${gbp(o.pot.se)}`).join('; ') || 'none'}), higher on ${out.filter(o => beyond(o.pot) > 0).length}, its mean change over units ${f(mean(out.map(o => pct(o.pot))), 2)}%; lifetime tax higher beyond noise on ${out.filter(o => beyond(o.tax) > 0).length}, lower on ${out.filter(o => beyond(o.tax) < 0).length}`);
};
console.log(`\nG. Spending delivered, the pot left and lifetime tax, each design against today's share, paired by path (beyond noise: the mean change more than 1.96 of its standard errors from nought):`);
moneyOf('MEANS', r => r.Mn, 0, N);
moneyOf('MEANS', r => r.Mn, AT, N); moneyOf("the simulation's pick", r => r.S, AT, N); moneyOf("the forecast's pick", r => r.P, AT, N);
