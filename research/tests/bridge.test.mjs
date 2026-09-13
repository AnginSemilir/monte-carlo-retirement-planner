// Growth-aware bridge sizing, and the Bridge-Sized Relief player built on it.
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (n, a, b, tol, extra = '') => ok(n, Math.abs(a - b) <= tol, extra || `got ${a.toFixed(2)}, expected ${b.toFixed(2)} (tol ${tol})`);

const GIA = 'Other Investments (e.g. GIA)';
const mk = (o = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 45, retireAgeSelf: o.ret ?? 55, salarySelf: o.sal ?? 90000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: o.nmpa ?? 58,
    statePensionSelf: 11500, terminalAge: 92
  },
  spending: { targetSpend: o.spend ?? 28000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 260000, contrib: o.penC ?? 14000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 90000, contrib: o.isaC ?? 5000, growth: 3, risk: o.isaRisk ?? 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 60000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: o.cash ?? 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' },
  // Some cases need a specific real rate rather than whatever the shipped matrix happens to say. Pinning
  // it here keeps them honest: the zero-growth case below was only passing because the default cash tier
  // was slightly negative, and started failing the moment the default became a published set whose UK
  // cash deflates to about +1% real. A test that depends on the default data tests the wrong thing.
  ...(o.profiles ? { riskProfiles: o.profiles } : {})
});
const withRate = (tier, real) => ({ ...E.DEFAULT_RISK_PROFILES, [tier]: { ...E.DEFAULT_RISK_PROFILES[tier], real, volatility: 0, sigmaParam: 0 } });

console.log('=== liquidRealRate ===');
{
  // pensions are not allowed to fund the bridge, so they must not drag the rate
  const ctx = E.buildContext(mk({ pen: 10000000, isa: 100000, gia: 0, cash: 0 }));
  near('a huge pension does not move the rate', E.liquidRealRate(ctx), ctx.acc.isa_self.real, 1e-12);
  const mixed = E.buildContext(mk({ pen: 0, isa: 100000, gia: 100000, cash: 0 }));
  const expect = (mixed.acc.isa_self.real + mixed.acc.other_self.real) / 2;
  near('equal balances give the midpoint of their tiers', E.liquidRealRate(mixed), expect, 1e-12);
  const empty = E.buildContext(mk({ pen: 100000, isa: 0, gia: 0, cash: 0 }));
  near('nothing liquid falls back to the ISA tier', E.liquidRealRate(empty), empty.acc.isa_self.real, 1e-12);
  const cashy = E.buildContext(mk({ pen: 0, isa: 0, gia: 0, cash: 100000 }));
  near('an all-cash household gets the cash rate', E.liquidRealRate(cashy), cashy.acc.cash_self.real, 1e-12);
}

console.log('\n=== bridgeRequirement discounts what it can ===');
{
  const ctx = E.buildContext(mk({ age: 45, ret: 50, nmpa: 58 }));   // an 8-year gap
  const b = E.bridgeRequirement(ctx);
  ok('the gap is found', b.gapYears === 8, String(b.gapYears));
  ok('pvNeeded is below the undiscounted sum', b.pvNeeded < b.netNeeded, `${Math.round(b.pvNeeded)} < ${Math.round(b.netNeeded)}`);
  ok('but not by more than the horizon allows', b.pvNeeded > b.netNeeded * 0.6, `${(b.pvNeeded / b.netNeeded).toFixed(3)}`);
  const short = E.bridgeRequirement(E.buildContext(mk({ age: 45, ret: 57, nmpa: 58 })));
  ok('a one-year gap needs no discounting', short.gapYears === 1 && Math.abs(short.pvNeeded - short.netNeeded) < 1e-6,
    `${short.gapYears}yr, ${Math.round(short.pvNeeded)} vs ${Math.round(short.netNeeded)}`);
  ok('a longer gap discounts harder', (b.pvNeeded / b.netNeeded) < (short.pvNeeded / short.netNeeded));
  const none = E.bridgeRequirement(E.buildContext(mk({ age: 45, ret: 60, nmpa: 58 })));
  ok('retiring after the access age leaves no gap', none.gapYears === 0 && none.netNeeded === 0 && none.pvNeeded === 0);
  // zero-growth liquid assets: discounting must be a no-op
  const flat = E.bridgeRequirement(E.buildContext(mk({ age: 45, ret: 50, nmpa: 58, isa: 0, gia: 0, cash: 100000, isaRisk: 'Cash Equivalents', profiles: withRate('Cash Equivalents', 0) })));
  ok('a rate near zero makes pv and sum near-identical', Math.abs(flat.pvNeeded / flat.netNeeded - 1) < 0.03,
    `rate ${(flat.rate * 100).toFixed(2)}%, ratio ${(flat.pvNeeded / flat.netNeeded).toFixed(3)}`);
}

console.log('\n=== bridgeIsaAnnual ===');
// a household that genuinely has a shortfall: a long gap and little put by outside the pension
const LEAN = { age: 45, ret: 50, nmpa: 58, isa: 20000, gia: 5000, cash: 10000 };
{
  const ctx = E.buildContext(mk(LEAN));
  const s1 = E.bridgeIsaAnnual(ctx, { emergencyFloor: 25000, margin: 1 });
  ok('it asks for something', s1.annual > 0, `${Math.round(s1.annual)}/yr`);
  ok('there is a real shortfall to size', s1.shortfall > 0, `${Math.round(s1.shortfall)}`);
  const s2 = E.bridgeIsaAnnual(ctx, { emergencyFloor: 25000, margin: 2 });
  ok('a bigger margin asks for more', s2.annual > s1.annual, `${Math.round(s1.annual)} -> ${Math.round(s2.annual)}`);
  const s0 = E.bridgeIsaAnnual(ctx, { emergencyFloor: 25000, margin: 0 });
  ok('a zero margin asks for nothing', s0.annual === 0);

  // the round trip: contributing `annual` for `years`, on top of what is already held, must land on target
  const g = s1.bridge.rate;
  const isaEsc = ctx.acc.isa_self.growth;
  const built = s1.spareAtRetire + s1.annual * E.fvContribStream(1, g, isaEsc, s1.years);
  near('the sizing actually reaches the target by retirement', built, s1.target, Math.max(1, s1.target * 1e-9),
    `${Math.round(built)} vs target ${Math.round(s1.target)}`);

  // back-loading the same target into fewer years must raise the annual figure
  const late = E.bridgeIsaAnnual(ctx, { emergencyFloor: 25000, margin: 1, overYears: 2 });
  ok('paying it over fewer years costs more per year', late.annual > s1.annual, `${Math.round(s1.annual)}/yr over ${s1.years} vs ${Math.round(late.annual)}/yr over ${late.years}`);
  near('and still reaches the same target', late.spareAtRetire + late.annual * E.fvContribStream(1, g, isaEsc, late.years), late.target, Math.max(1, late.target * 1e-9));

  // a longer run to retirement compounds existing balances further, so less new money is needed each year
  const far = E.bridgeIsaAnnual(E.buildContext(mk({ ...LEAN, age: 30 })), { emergencyFloor: 25000, margin: 1 });
  ok('a longer runway needs less each year', far.annual < s1.annual, `${Math.round(far.annual)}/yr from 30 vs ${Math.round(s1.annual)}/yr from 45`);

  ok('no gap means no requirement', E.bridgeIsaAnnual(E.buildContext(mk({ age: 45, ret: 60, nmpa: 58 })), { emergencyFloor: 25000 }).annual === 0);
  const rich = E.bridgeIsaAnnual(E.buildContext(mk({ age: 45, ret: 55, nmpa: 58, isa: 900000, cash: 200000 })), { emergencyFloor: 25000, margin: 1 });
  ok('already-covered households are asked for nothing', rich.annual === 0, `${Math.round(rich.annual)}`);
  ok('and report no shortfall rather than a negative one', rich.shortfall === 0);
}

console.log('\n=== it is less conservative than the formula it replaces ===');
{
  // the naive figure ignores growth on both sides and divides by every year to retirement
  for (const [age, ret] of [[35, 50], [45, 50], [40, 52]]) {
    const o = { ...LEAN, age, ret };
    const t = E.buildTournament(mk(o), { emergencyFloor: 25000, scope: 'full' });
    const naive = t.meta.annualIsaNeeded;
    const sized = E.bridgeIsaAnnual(E.buildContext(mk(o)), { emergencyFloor: 25000, margin: 1.3 });
    ok(`age ${age} retiring at ${ret}: both see a shortfall`, naive > 0 && sized.annual > 0, `${Math.round(sized.annual)} / ${Math.round(naive)}`);
    ok(`age ${age} retiring at ${ret}: growth-aware sizing asks for less`, sized.annual < naive,
      `${Math.round(sized.annual)}/yr vs the naive ${Math.round(naive)}/yr`);
  }
}

console.log('\n=== the player ===');
{
  const t = E.buildTournament(mk({ age: 45, ret: 55, nmpa: 58 }), { emergencyFloor: 25000, scope: 'full' });
  const b = t.strategies.find(s => s.id === 'bridged');
  ok('it is in the field', !!b);
  ok('it searches rather than assuming', Array.isArray(b.candidates) && b.candidates.length > 1, `${b.candidates.length} candidates`);
  ok('every candidate is labelled', b.candidates.every(c => typeof c.label === 'string' && c.label.length > 0), b.candidates.map(c => c.label).join(', '));
  ok('labels are unique', new Set(b.candidates.map(c => c.label)).size === b.candidates.length);
  ok('every candidate explains itself', b.candidates.every(c => typeof c.describe === 'string' && c.describe.length > 20));
  ok('every candidate carries a runnable plan', b.candidates.every(c => c.planState && Array.isArray(c.planState.accounts)));
  ok('it brackets the target on both sides', b.candidates.some(c => c.cover === 0) && b.candidates.some(c => c.cover > 1.3));
  ok('some candidates are back-loaded', b.candidates.some(c => c.phase && c.phase.switchYears > 0));
  ok('the back-loaded ones use a year-by-year schedule',
    b.candidates.filter(c => c.phase).every(c => c.planState.accounts.some(a => Array.isArray(a.contribByYear))));

  const noGap = E.buildTournament(mk({ age: 45, ret: 60, nmpa: 58 }), { emergencyFloor: 25000, scope: 'full' })
    .strategies.find(s => s.id === 'bridged');
  ok('with no gap it collapses to a single candidate', noGap.candidates.length === 1, String(noGap.candidates.length));
  ok('and says so', /no pre-SIPP access gap/i.test(noGap.candidates[0].describe), noGap.candidates[0].describe);
}

console.log('\n=== Bed & SIPP is shared, and the bridge is reserved before it ===');
{
  // no gap: this player and Relief-First should reach exactly the same plan
  const t = E.buildTournament(mk({ age: 45, ret: 60, nmpa: 58 }), { emergencyFloor: 25000, scope: 'full' });
  const b = t.strategies.find(s => s.id === 'bridged').candidates[0];
  const r = t.strategies.find(s => s.id === 'relief');
  const key = (ps) => JSON.stringify(ps.accounts.map(a => [a.id, Math.round(E.num(a.balance, 0)), Math.round(E.num(a.contrib, 0))]));
  ok('with no bridge it matches Relief-First exactly', key(b.planState) === key(r.planState));
  ok('and it moved capital too', b.transferGross > 0, `${Math.round(b.transferGross)}`);

  // with a gap: Relief-First does not transfer at all, this player transfers only what the bridge spares.
  // The ISA is sized so that spare capital, not the annual allowance, is the binding constraint.
  const g = E.buildTournament(mk({ age: 45, ret: 50, nmpa: 58, isa: 120000, gia: 0, cash: 5000, spend: 34000 }), { emergencyFloor: 25000, scope: 'full' });
  const gb = g.strategies.find(s => s.id === 'bridged');
  const gr = g.strategies.find(s => s.id === 'relief');
  ok('Relief-First never transfers when a bridge exists', E.num(gr.transferGross, 0) === 0);
  ok('this player can, because it knows what to hold back', gb.candidates.some(c => c.transferGross > 0));
  const byCover = gb.candidates.filter(c => c.phase === undefined && c.cover !== undefined).sort((x, y) => x.cover - y.cover);
  const lowest = byCover[0], highest = byCover[byCover.length - 1];
  ok('more bridge cover leaves less to transfer', highest.transferGross <= lowest.transferGross,
    `cover ${lowest.cover} -> ${Math.round(lowest.transferGross)}, cover ${highest.cover} -> ${Math.round(highest.transferGross)}`);
  ok('scope "contributions only" transfers nothing', E.buildTournament(mk({ age: 45, ret: 60, nmpa: 58 }), { emergencyFloor: 25000, scope: 'contributions' })
    .strategies.find(s => s.id === 'bridged').candidates.every(c => !(c.transferGross > 0)));
}

console.log('\n=== the shared resolver ===');
{
  const t = E.buildTournament(mk({ age: 45, ret: 55, nmpa: 58 }), { emergencyFloor: 25000, scope: 'full' });
  for (const id of ['survival', 'bridged']) {
    const s = t.strategies.find(x => x.id === id);
    const seen = [];
    const r = E.resolveSearchPlayer(s, { trials: 200, seed: 7, onCandidate: (i, n, label) => seen.push(label) });
    ok(`${id}: resolves to a plain strategy`, !!r.planState && Array.isArray(r.planState.accounts));
    ok(`${id}: reports which candidate won`, typeof r.chosenLabel === 'string' && r.chosenLabel.length > 0, r.chosenLabel);
    ok(`${id}: the winner is one of the candidates`, s.candidates.some(c => c.label === r.chosenLabel));
    ok(`${id}: every candidate was reported to the caller`, seen.length === s.candidates.length);
    ok(`${id}: the search table matches the field`, r.searchResults.length === s.candidates.length);
    ok(`${id}: it names its own axis`, typeof r.searchAxis === 'string' && r.searchAxis.length > 0, r.searchAxis);
    ok(`${id}: the description is the winner's`, r.description.length > 20);
  }
  // the bridge-risk cap has to be able to rule candidates out
  const b = t.strategies.find(x => x.id === 'bridged');
  const strict = E.resolveSearchPlayer(b, { trials: 200, seed: 7, preAccessCap: 0 });
  const loose = E.resolveSearchPlayer(b, { trials: 200, seed: 7, preAccessCap: Infinity });
  const preOf = (r) => r.searchResults.find(x => x.label === r.chosenLabel).preAccess;
  ok('a 0% bridge-risk cap never picks a riskier candidate than no cap', preOf(strict) <= preOf(loose) + 1e-9,
    `${preOf(strict).toFixed(2)}% capped vs ${preOf(loose).toFixed(2)}% uncapped`);
}

console.log('\n=== head to head on a plan Relief-First gets wrong ===');
{
  // a short runway into a three-year bridge: the naive sizing overshoots badly here
  for (const sal of [38000, 95000]) {
    const p = mk({ age: 45, ret: 55, nmpa: 58, sal, spend: 22400, pen: 91000, isa: 31500, gia: 21000, cash: 10500, penC: sal > 50000 ? 14400 : 9000, isaC: 5000 });
    const t = E.buildTournament(p, { emergencyFloor: 25000, scope: 'full' });
    const rel = E.monteCarlo(t.strategies.find(s => s.id === 'relief').planState, { trials: 800, seed: 424242 });
    const bri = E.resolveSearchPlayer(t.strategies.find(s => s.id === 'bridged'), { trials: 400, seed: 424242, preAccessCap: 5 });
    const bs = E.monteCarlo(bri.planState, { trials: 800, seed: 424242 });
    ok(`salary ${sal}: Bridge-Sized survives more often`, bs.successRate > rel.successRate,
      `${bs.successRate.toFixed(2)}% vs ${rel.successRate.toFixed(2)}% (picked ${bri.chosenLabel})`);
    ok(`salary ${sal}: and respects the bridge-risk cap`, bs.preNmpaFailRate <= 5 + 1e-9, `${bs.preNmpaFailRate.toFixed(2)}%`);
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
