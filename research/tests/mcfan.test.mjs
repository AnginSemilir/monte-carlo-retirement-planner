/*
 * The Monte Carlo fan: per-year percentile bands read off the simulated paths themselves.
 *
 * This replaces the deterministic lucky/unlucky lines, which claimed to be the 90th and 10th percentile
 * of terminal wealth and were not: a constant rate carries no sequence-of-returns risk, so the downside
 * line finished a mean 23% above the simulated 10th-percentile pot and 70% above it at worst. A band
 * taken from the paths cannot have that problem, because it is not a summary of anything — it is the
 * outcome distribution.
 *
 * The load-bearing assertion here is that the band's last entry equals the terminal-pot figures already
 * reported on the tiles. Both must use the same quantile convention or the chart and the numbers beneath
 * it would disagree, which is exactly the sort of quiet inconsistency this whole change is about.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const GIA = 'Other Investments (e.g. GIA)';
const mk = (o = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 45, retireAgeSelf: o.ret ?? 60, salarySelf: 70000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500,
    terminalAge: o.term ?? 92
  },
  spending: { targetSpend: o.spend ?? 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 300000, contrib: o.penC ?? 12000, growth: 3, risk: o.risk ?? 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 100000, contrib: o.isaC ?? 5000, growth: 3, risk: o.risk ?? 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 50000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: o.cash ?? 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});

const SEED = 20260911;
const show = (v) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : Math.round(v / 1000) + 'k');

console.log('=== collecting paths is opt-in ===');
{
  const ctx = E.buildContext(mk());
  const zs = E.gaussianPath(1234, ctx.totalYears + 1);
  ok('runTrial keeps no path by default', E.runTrial(ctx, zs).path === undefined);
  ok('and no path when asked for none', E.runTrial(ctx, zs, null, false).path === undefined);
  const kept = E.runTrial(ctx, zs, null, true);
  ok('it keeps one when asked', kept.path instanceof Float64Array, kept.path && kept.path.constructor.name);
  ok('one entry per projection year', kept.path.length === ctx.totalYears + 1, `${kept.path.length} vs ${ctx.totalYears + 1}`);

  const plain = E.monteCarlo(mk(), { trials: 200, seed: SEED });
  ok('monteCarlo returns no bands by default', plain.bands === null);
  const banded = E.monteCarlo(mk(), { trials: 200, seed: SEED, collectPaths: true });
  ok('and bands when asked', Array.isArray(banded.bands) && banded.bands.length > 0, `${banded.bands.length} years`);

  // collecting must not disturb the numbers, only add to them
  ok('the survival rate is unchanged by collecting', plain.successRate === banded.successRate, `${plain.successRate} vs ${banded.successRate}`);
  ok('and so is the terminal spread', plain.p10Terminal === banded.p10Terminal && plain.p90Terminal === banded.p90Terminal);
}

console.log('\n=== the band is ordered and complete ===');
{
  const ctx = E.buildContext(mk());
  const r = E.monteCarlo(mk(), { trials: 600, seed: SEED, collectPaths: true });
  ok('one band per projection year', r.bands.length === ctx.totalYears + 1, `${r.bands.length} vs ${ctx.totalYears + 1}`);
  ok('every band is indexed by its own year', r.bands.every((b, i) => b.t === i));
  ok('p10 <= p50 <= p90 at every year', r.bands.every(b => b.p10 <= b.p50 && b.p50 <= b.p90));
  ok('no band is negative', r.bands.every(b => b.p10 >= 0));
  ok('every value is finite', r.bands.every(b => Number.isFinite(b.p10) && Number.isFinite(b.p50) && Number.isFinite(b.p90)));
}

console.log('\n=== the right-hand edge is the numbers on the tiles ===');
// the property the chart rests on: read the fan at the terminal year and you get the reported pots
{
  for (const [name, plan] of [['default', mk()], ['lean', mk({ pen: 120000, isa: 40000, gia: 10000, cash: 10000 })], ['couple-ish spend', mk({ spend: 45000 })]]) {
    const r = E.monteCarlo(plan, { trials: 800, seed: SEED, collectPaths: true });
    const last = r.bands[r.bands.length - 1];
    ok(`${name}: the final p10 equals p10Terminal`, last.p10 === r.p10Terminal, `${show(last.p10)} vs ${show(r.p10Terminal)}`);
    ok(`${name}: the final p50 equals medianTerminal`, last.p50 === r.medianTerminal, `${show(last.p50)} vs ${show(r.medianTerminal)}`);
    ok(`${name}: the final p90 equals p90Terminal`, last.p90 === r.p90Terminal, `${show(last.p90)} vs ${show(r.p90Terminal)}`);
  }
}

console.log('\n=== the cone opens, because nothing cancels out ===');
{
  const r = E.monteCarlo(mk({ age: 35, ret: 65, spend: 28000 }), { trials: 800, seed: SEED, collectPaths: true });
  const width = (b) => b.p90 - b.p10;
  const early = r.bands[3], mid = r.bands[Math.floor(r.bands.length / 2)];
  ok('year 0 is nearly a point, since every path starts from the same balances',
    width(r.bands[0]) < width(mid) / 10, `${show(width(r.bands[0]))} vs ${show(width(mid))} at the midpoint`);
  ok('the band is wider at the midpoint than early on', width(mid) > width(early), `${show(width(early))} -> ${show(width(mid))}`);
  // through accumulation it can only open: no withdrawals, so nothing pulls the low paths back up
  const accum = r.bands.filter(b => 35 + b.t <= 65);
  let monotone = true;
  for (let i = 1; i < accum.length; i++) if (width(accum[i]) < width(accum[i - 1]) - 1) { monotone = false; break; }
  ok('and it never narrows while contributions are still going in', monotone);
}

console.log('\n=== a plan that runs dry says so, at the right age ===');
{
  const plan = mk({ age: 55, ret: 60, pen: 90000, isa: 20000, gia: 0, cash: 10000, penC: 2000, isaC: 0, spend: 34000 });
  const r = E.monteCarlo(plan, { trials: 800, seed: SEED, collectPaths: true });
  const ruin = r.bands.find(b => b.p10 <= 0);
  ok('the lower edge reaches zero', !!ruin, ruin ? `at age ${55 + ruin.t}` : 'never');
  if (ruin) {
    ok('and stays there once it has', r.bands.slice(ruin.t).every(b => b.p10 <= 0));
    ok('not before retirement, since nothing is being drawn yet', 55 + ruin.t >= 60, `age ${55 + ruin.t}`);
    // the band hitting zero and the reported failure rate have to tell the same story
    ok('a lower edge at zero means at least a tenth of paths failed', r.successRate <= 90.0 + 1e-9, `${r.successRate.toFixed(1)}% survived`);
  }
  // and the mirror case
  const rich = E.monteCarlo(mk({ pen: 900000, isa: 400000, gia: 200000, cash: 100000, spend: 30000 }), { trials: 600, seed: SEED, collectPaths: true });
  ok('a comfortable plan never touches the axis', rich.bands.every(b => b.p10 > 0), `worst ${show(Math.min(...rich.bands.map(b => b.p10)))}`);
}

console.log('\n=== nothing else in the app pays for paths it will not read ===');
{
  // optimizeSpend bisects with hundreds of runTrial calls; buildTournament runs a full simulation per
  // player plus two candidate searches. A default of "collect" would have quietly cost all of them.
  const solved = E.optimizeSpend(mk(), { targetRate: 90, seed: SEED, searchTrials: 120, finalTrials: 200 });
  ok('optimizeSpend returns no bands', !solved.bands, String(solved.bands));

  const t = E.buildTournament(mk(), { emergencyFloor: 25000, scope: 'full' });
  const scored = t.strategies.filter(s => !s.candidates).map(s => E.monteCarlo(s.planState, { trials: 150, seed: SEED }));
  ok('no tournament player collects paths', scored.every(r => r.bands === null), `${scored.length} players`);
  const surv = t.strategies.find(s => s.id === 'survival');
  const cands = surv.candidates.map(c => E.monteCarlo(c.planState, { trials: 80, seed: SEED }));
  ok('nor does any search candidate', cands.every(r => r.bands === null), `${cands.length} candidates`);
}

console.log('\n=== the deterministic band is gone from the engine ===');
{
  const ctx = E.buildContext(mk());
  ok('accounts no longer carry a lucky rate', ctx.acc.pen_self.lucky === undefined);
  ok('nor an unlucky one', ctx.acc.pen_self.unlucky === undefined);
  // an unknown regime must fall back to the expected rate rather than silently compounding undefined
  const expected = E.simulateDeterministic(ctx, 'expected');
  const gone = E.simulateDeterministic(ctx, 'lucky');
  const last = (rows) => rows[rows.length - 1].totalCombined;
  ok('asking for the retired regime returns the expected path, not NaN', Number.isFinite(last(gone)) && last(gone) === last(expected), show(last(gone)));
}


console.log('\n=========== SAMPLE PATHS: THE CHART DRAWS REAL TRIALS ===========');
{
  /*
   * The Monte Carlo chart animates by drawing individual simulated futures before settling into the
   * percentile band. That is only worth doing if they are the ACTUAL trials - a wipe across a
   * pre-computed band would look much the same for a second and would be a lie, because the fan would
   * appear whether or not anything had been simulated. So: prove each drawn path is a real trial.
   */
  const plan = mk({ spend: 30000 });
  const ctx = E.buildContext(plan);
  const TR = 2000, SEED = 4242;
  const res = E.monteCarlo(ctx, { trials: TR, seed: SEED, collectPaths: true });
  ok('sample paths are returned when paths are collected', Array.isArray(res.samplePaths) && res.samplePaths.length > 0, `${res.samplePaths?.length} kept of ${TR}`);
  ok('and are absent when they are not', E.monteCarlo(ctx, { trials: 200, seed: SEED }).samplePaths === null);

  const all = E.pathsForSeed(SEED, TR, ctx.totalYears);
  const stride = Math.max(1, Math.floor(TR / 60));
  let exact = 0;
  for (let k = 0; k < res.samplePaths.length; k++) {
    const truth = E.runTrial(ctx, all[k * stride], null, true).path;
    const drawn = res.samplePaths[k];
    if (truth.length === drawn.length && truth.every((v, i) => v === drawn[i])) exact++;
  }
  ok('every drawn path is a real trial, value for value', exact === res.samplePaths.length, `${exact}/${res.samplePaths.length} reproduce exactly from their seed`);
  ok('each spans the whole horizon', res.samplePaths.every(p => p.length === ctx.totalYears + 1));
  // They do NOT start from one point: stepYear applies a year's growth at row 0, so the very first
  // value already carries that path's own first-year return. The chart therefore opens slightly fanned
  // rather than pinched, which is correct - and the rate-based band has spread at row 0 for the same
  // reason. Assert the true thing: tightly clustered at the start, far apart by the end.
  const firsts = res.samplePaths.map(p => p[0]);
  const spread0 = (Math.max(...firsts) - Math.min(...firsts)) / (firsts.reduce((a, b) => a + b, 0) / firsts.length);
  const lasts = res.samplePaths.map(p => p[p.length - 1]);
  const spreadN = (Math.max(...lasts) - Math.min(...lasts)) / (lasts.reduce((a, b) => a + b, 0) / lasts.length);
  // One year of a ~17% sigma spread across 60 draws spans roughly +/- 2.5 sd, so a range near 80% of the
  // mean is exactly right at row 0 and is NOT evidence of anything wrong. What matters is that it is one
  // year's worth rather than a whole horizon's.
  ok('the opening spread is about one year of volatility', spread0 > 0.2 && spread0 < 1.2, `spread ${(spread0 * 100).toFixed(0)}% of the mean at row 0`);
  ok('and are far apart by the end', spreadN > spread0 * 3, `${(spread0 * 100).toFixed(0)}% -> ${(spreadN * 100).toFixed(0)}%`);

  // the sample should look like the population it is drawn from, or it is a misleading picture
  const endsSorted = res.samplePaths.map(p => p[p.length - 1]).sort((a, b) => a - b);
  const sampleMed = endsSorted[Math.floor(endsSorted.length / 2)];
  ok('the sample median is close to the full median', Math.abs(sampleMed - res.medianTerminal) / Math.max(1, res.medianTerminal) < 0.25,
    `sample £${Math.round(sampleMed).toLocaleString()} vs all £${Math.round(res.medianTerminal).toLocaleString()}`);
  const inBand = res.samplePaths.filter(p => p[p.length - 1] >= res.p10Terminal && p[p.length - 1] <= res.p90Terminal).length;
  ok('about four fifths of them land inside the 10th-90th band', inBand / res.samplePaths.length > 0.6,
    `${inBand}/${res.samplePaths.length}`);
  // and the selection must be stable, so the same run always shows the same faces
  const again = E.monteCarlo(ctx, { trials: TR, seed: SEED, collectPaths: true });
  ok('the same run picks the same paths', again.samplePaths.every((p, i) => p[p.length - 1] === res.samplePaths[i][p.length - 1]));
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
