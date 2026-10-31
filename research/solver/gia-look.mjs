/*
 * THE giaTiers LOOK (STATE.md D47; EXPLORATORY, the test's own seed 7001): why, since 136c477, a 40% unrealised gain makes
 * giaTiers switch the taxable account's tier more often than no gain does (research/tests/solver-giatiers.test.mjs check 4).
 * The test's setup (S330, 8 points, its options, giaTiers on), every decision of the forward runs tallied through
 * runPolicy's visit: how often the joint step is below the plan's tiers, how often the move's GIA tier is not the one held,
 * and of those how many the hold check (solve.js giaHoldCheck) kept, with the switches by decade. EXTRA (JSON) adds solve
 * options, so the gain axis can be read interpolated ({"gainInterp":true}) rather than at its nearest bucket.
 *   node research/solver/gia-look.mjs <repository root> [paths=60]      (the root of a checkout at the code to read)
 */
const ROOT = process.argv[2], NP = Number(process.argv[3] || 60), EXTRA = JSON.parse(process.env.EXTRA || '{}');
if (!ROOT) { console.error('gia-look: give the repository root of the code to read'); process.exit(2); }
const E = await import(`${ROOT}/research/engine.mjs`);
const M = await import(`${ROOT}/src/solver/model.js`);
const { solve, runPolicy } = await import(`${ROOT}/src/solver/solve.js`);
const { buildScenarios } = await import(`${ROOT}/research/policy-study/scenarios.mjs`);
const sc = buildScenarios().find(s => s.id === 'S330');
const target = E.num(sc.plan.spending.targetSpend, 0);
const planOf = (gain) => E.resolveMpaa(E.normalizePlan({ ...sc.plan,
  accounts: sc.plan.accounts.map(a => (/^Other Investments/.test(a.category) && E.num(a.balance, 0) > 0 ? { ...a, unrealisedGain: Math.round(gain * E.num(a.balance, 0)) } : a)),
  config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * target) } }));
const m = M.prepare(E, planOf(0));
const base = { points: 8, lambda: 1.14, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: true, giaTiers: true, ...EXTRA };
const paths = E.pathsForSeed(7001, NP, m.ctx.totalYears);
console.log(`gia-look: S330, 8 points, ${NP} paths of seed 7001, giaTiers on${Object.keys(EXTRA).length ? `, with ${JSON.stringify(EXTRA)}` : ', the gain axis at its nearest bucket'}`);
for (const gain of [0, 0.4]) {
  const r = solve(E, M, planOf(gain), base), c = r.c;
  const n = { dec: 0, below: 0, want: 0, held: 0, switched: 0, byDecade: {} };
  let ch = 0, yrs = 0;
  for (const zs of paths) {
    const o = runPolicy(r, zs, { visit: (t, s, held, ai) => {
      const a = c.acts[ai]; n.dec++;
      if (a.tierPen > 0 || a.tierIsa > 0) n.below++;
      if (a.tierGia !== held.gia) { n.want++; if (r.giaHold >= 0) n.held++; else { n.switched++; const d = Math.floor(t / 10) * 10; n.byDecade[d] = (n.byDecade[d] || 0) + 1; } }
    } });
    ch += o.giaChanges; yrs += o.giaYears;
  }
  console.log(`  gain ${gain}: ${(ch / NP).toFixed(2)} GIA switches and ${(yrs / NP).toFixed(1)} years below its plan tier a path; of ${n.dec} decisions the joint step below the plan's in ${(100 * n.below / n.dec).toFixed(1)}%; the move's GIA tier not the one held in ${n.want}, the hold check keeping it in ${n.held}, switching in ${n.switched}; the switches by decade ${JSON.stringify(n.byDecade)}`);
}
