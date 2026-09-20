/*
 * A GENETIC SEARCH OVER THE WHOLE PLAN AT ONCE.
 *
 * The app searches the way to save and the way to draw separately, each with the other held fixed. This
 * searches them together: one genome carries the accumulation choices the tournament's players are built
 * from AND the decumulation choices the policy search enumerates, and a population of them is bred
 * against the same simulated futures until the budget runs out.
 *
 * It takes the engine as a parameter rather than importing it. The research scripts pass research/
 * engine.mjs (a build of App.jsx's engine half), the app's worker will pass its own imports, and the
 * two run the same code - which is the point of writing it once.
 *
 * THE GENOME, in the vocabulary the instruction sheet can already phrase:
 *
 *   keep      use the household's own contributions as they are (the Current Plan player); when true
 *             the accumulation genes below are ignored
 *   cover     the bridge multiple the tournament's Bridge-Sized Relief player sizes to (0 = nothing
 *             set aside), or null: no bridge sizing, split the budget by isaShare instead
 *   isaShare  the ISA/pension split of the budget, used only when cover is null
 *   backLoad  pay the bridge in over the final years rather than level
 *   sipp      allow the one-off Bed & SIPP move of spare ISA capital into the pension
 *   balance   how a couple's pension money is split between them: 'proportional' or 'balanced'
 *   steps     the draw order, a permutation of the six steps with the three pension steps kept in
 *             their tax-band order (allowance, then basic rate, then anything)
 *   harvest   the personal-allowance harvest, on or off
 *   lump      full 25% lump sum on first access rather than phased
 *   deposit   where an unassigned windfall goes first, a permutation of the four wrappers
 *
 * FITNESS is the lower confidence bound of survival on common random numbers, ties to the larger unlucky
 * pot net of death tax. Not the point estimate: a population search is a machine for finding the
 * candidate its sample happened to flatter, and the safe-spend solver already taught this codebase what
 * that costs. Every candidate in a generation sees the same paths (one seed), weak ones are scored on a
 * few paths and dropped, and only the survivors earn a longer look - so the budget is spent where the
 * answer is, and the number reported for the winner comes from its longest look.
 *
 * WHAT IT DOES NOT DO: confirm. The caller scores the winner on a held-out seed before believing it,
 * exactly as the tournament's challengers were confirmed on independent draws.
 */

export const DRAW_STEPS = ['penPA', 'penBasic', 'penAny', 'cash', 'other', 'isa'];
export const PEN_STEPS = ['penPA', 'penBasic', 'penAny'];
export const DEPOSIT_WRAPPERS = ['pen', 'isa', 'other', 'cash'];
export const COVER_MAX = 2.4;

/* The pension steps must stay in tax-band order wherever they land: put them back in that order. */
export function repairSteps(steps) {
  const pens = steps.filter(s => PEN_STEPS.includes(s));
  const want = PEN_STEPS.filter(s => pens.includes(s));
  let k = 0;
  const out = steps.map(s => (PEN_STEPS.includes(s) ? want[k++] : s));
  // anything missing or duplicated is repaired to the full set in a stable way
  const seen = new Set();
  const fixed = out.filter(s => DRAW_STEPS.includes(s) && !seen.has(s) && seen.add(s));
  DRAW_STEPS.forEach(s => { if (!fixed.includes(s)) fixed.push(s); });
  return repairOnce(fixed);
}
const repairOnce = (steps) => {
  const idx = PEN_STEPS.map(s => steps.indexOf(s));
  const sorted = idx.slice().sort((a, b) => a - b);
  const out = steps.slice();
  PEN_STEPS.forEach((s, i) => { out[sorted[i]] = s; });
  return out;
};

/* Order crossover for a permutation: a slice of one parent, the rest in the other parent's order. */
function orderCrossover(a, b, rnd) {
  const n = a.length;
  let i = Math.floor(rnd() * n), j = Math.floor(rnd() * n);
  if (i > j) [i, j] = [j, i];
  const slice = a.slice(i, j + 1);
  const rest = b.filter(x => !slice.includes(x));
  return [...rest.slice(0, i), ...slice, ...rest.slice(i)];
}

function randomGenome(rnd, shape) {
  const shuffle = (arr) => { const o = arr.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
  const useIsa = rnd() < 0.35;
  return canon({
    keep: rnd() < 0.15,
    cover: useIsa ? null : Math.round(rnd() * COVER_MAX * 20) / 20,
    isaShare: Math.round(rnd() * 20) / 20,
    backLoad: rnd() < 0.3,
    sipp: rnd() < 0.5,
    balance: rnd() < 0.5 ? 'proportional' : 'balanced',
    steps: repairSteps(shuffle(DRAW_STEPS)),
    harvest: rnd() < 0.6,
    lump: rnd() < 0.2,
    deposit: shuffle(DEPOSIT_WRAPPERS)
  }, shape);
}

/* Genes that cannot matter for this household are pinned, so two genomes that decode to the same plan
   compare equal and the search does not spend paths telling them apart. */
function canon(g, shape) {
  const out = { ...g };
  if (!shape.hasGap) { if (out.cover !== null) out.cover = 0; out.backLoad = false; }
  if (!shape.canBackLoad) out.backLoad = false;
  if (!shape.isCouple) out.balance = 'proportional';
  if (!shape.fullScope) out.sipp = false;
  if (out.keep) { out.cover = 0; out.isaShare = 0; out.backLoad = false; out.sipp = false; out.balance = 'proportional'; }
  if (out.cover !== null) out.isaShare = 0;
  out.steps = repairSteps(out.steps);
  return out;
}

export function genomeKey(g) {
  return [g.keep ? 'K' : `c${g.cover === null ? 'n' : g.cover.toFixed(2)}/i${g.isaShare.toFixed(2)}/${g.backLoad ? 'L' : 'l'}/${g.sipp ? 'S' : 's'}/${g.balance[0]}`,
    g.steps.join('>'), g.harvest ? 'H' : 'h', g.lump ? 'U' : 'u', g.deposit.join('>')].join('|');
}

/* A genome in words, for a card or a sheet. Names the policy when the draw genes are a named one. */
export function describeGenome(E, g, cand) {
  const named = Object.entries(E.DECUMULATION_POLICIES).find(([, p]) =>
    p.steps.join() === g.steps.join() && (p.depositOrder || E.DEFAULT_DEPOSIT_ORDER).join() === g.deposit.join());
  const draw = named ? `${named[0]}${g.harvest ? '' : ' (harvest off)'}` : `draw ${g.steps.join(' → ')}, harvest ${g.harvest ? 'on' : 'off'}, windfalls ${g.deposit.join(' → ')}`;
  const acc = g.keep ? 'contributions as they are' : (cand ? cand.label : '');
  return `${acc}; ${draw}; ${g.lump ? 'full lump sum' : 'phased'}`;
}

/**
 * evolve(E, rawPlan, opts) -> { winner, elites, generations, used, history, shape }
 *
 *   budget    total simulated paths the search may spend (the unit the tournament also spends)
 *   seed      one seed for the paths every candidate is scored on, and for the search's own randomness
 *   pop       population size
 *   coarse    paths for a first look at every candidate; fine: paths for the survivors of each generation
 *   seedGenomes  genomes to put in generation zero beside the random ones (a warm start)
 *   emergencyFloor, scope, priorities  as the tournament takes them; scope 'full' allows the SIPP move
 */
export function* evolveGen(E, rawPlan, {
  budget = 60000, seed = 12345, pop = 24, coarse = 120, fine = 480, refineFrac = 0.4, elite = 2, pMut = 0.25,
  seedGenomes = [], emergencyFloor = 25000, scope = 'full', onGeneration = null
} = {}) {
  const rnd = E.mulberry32(seed ^ 0x9e3779b9);
  const base = E.normalizePlan(JSON.parse(JSON.stringify(rawPlan)));
  const ctx = E.buildContext(base);
  const envs = {
    proportional: E.accumulationEnv(ctx, { emergencyFloor, scope, balance: 'proportional' }),
    balanced: E.accumulationEnv(ctx, { emergencyFloor, scope, balance: 'balanced' })
  };
  const shape = { hasGap: envs.proportional.bridge.gapYears > 0, canBackLoad: envs.proportional.canBackLoad, isCouple: ctx.isCouple, fullScope: scope === 'full' };

  /*
   * THE SAME TAKE-HOME BUDGET, FOR THE WHOLE RUN, NOT JUST YEAR ONE.
   *
   * Every candidate allocates the same net budget in year one, but contributions grow at each wrapper's
   * own rate, so a plan that tilts towards a faster-escalating wrapper compounds a bigger base and ends
   * up spending more over the years to retirement. It would then win the search by paying in more rather
   * than by allocating better - which is the exact trap buildTournament holds its own players out of, by
   * solving each one back to the baseline's lifetime outlay.
   *
   * So the search does it too, on every candidate it decodes. Without this the evolved player is not
   * playing the same game as the named three, and its wins cannot be read as better allocation.
   */
  const baselineOutlay = E.accumulationOutlay(ctx);
  const normalise = (planState) => {
    const solved = E.solveEscalation(planState, baselineOutlay);
    return solved.rate === null ? planState : E.applyEscalationToPlan(planState, solved.rate);
  };

  const decode = (g) => {
    let cand = null, plan;
    if (g.keep) plan = JSON.parse(JSON.stringify(base));   // the household's own plan is the baseline
    else {
      cand = E.accumulationCandidate(ctx, envs[g.balance], { cover: g.cover, isaShare: g.isaShare, backLoad: g.backLoad, sipp: g.sipp });
      plan = normalise(cand.planState);
    }
    plan.spending.drawdownStrategy = g.lump ? 'Full 25% Lump Sum' : 'Phased Drawdown';
    plan.spending.policyOverride = { steps: g.steps, harvest: g.harvest, depositOrder: g.deposit };
    plan.config.harvestPersonalAllowance = g.harvest;
    return { plan, cand };
  };

  let used = 0;
  const cache = new Map();          // genomeKey -> { trials, stats } at the longest look so far
  const score = (ind, trials) => {
    const key = genomeKey(ind.g);
    const have = cache.get(key);
    if (have && have.trials >= trials) { ind.trials = have.trials; ind.stats = have.stats; return; }
    if (!ind.plan) Object.assign(ind, decode(ind.g));
    const stats = E.monteCarlo(E.resolveMpaa(ind.plan), { trials, seed });
    used += trials;
    ind.trials = trials; ind.stats = stats;
    cache.set(key, { trials, stats });
  };
  // the lower confidence bound: one standard error below the point estimate
  const fit = (ind) => ind.stats.successRate - ind.stats.standardError;
  const better = (a, b) => (Math.abs(fit(a) - fit(b)) > E.RATE_EPSILON_PTS ? fit(a) - fit(b) : a.stats.p10TerminalNet - b.stats.p10TerminalNet);

  const mutate = (g) => {
    const o = { ...g, steps: g.steps.slice(), deposit: g.deposit.slice() };
    const flip = (p) => rnd() < p;
    if (flip(pMut)) o.keep = !o.keep;
    if (flip(pMut)) o.cover = o.cover === null ? Math.round(rnd() * COVER_MAX * 20) / 20 : (rnd() < 0.2 ? null : Math.max(0, Math.min(COVER_MAX, o.cover + (rnd() - 0.5) * 0.8)));
    if (flip(pMut)) o.isaShare = Math.max(0, Math.min(1, o.isaShare + (rnd() - 0.5) * 0.4));
    if (flip(pMut)) o.backLoad = !o.backLoad;
    if (flip(pMut)) o.sipp = !o.sipp;
    if (flip(pMut)) o.balance = o.balance === 'balanced' ? 'proportional' : 'balanced';
    if (flip(pMut)) { const i = Math.floor(rnd() * 6), j = Math.floor(rnd() * 6); [o.steps[i], o.steps[j]] = [o.steps[j], o.steps[i]]; }
    if (flip(pMut)) o.harvest = !o.harvest;
    if (flip(pMut * 0.6)) o.lump = !o.lump;
    if (flip(pMut)) { const i = Math.floor(rnd() * 4), j = Math.floor(rnd() * 4); [o.deposit[i], o.deposit[j]] = [o.deposit[j], o.deposit[i]]; }
    if (o.cover !== null) o.cover = Math.round(o.cover * 20) / 20;
    o.isaShare = Math.round(o.isaShare * 20) / 20;
    return canon(o, shape);
  };
  const cross = (a, b) => canon({
    keep: rnd() < 0.5 ? a.keep : b.keep,
    cover: rnd() < 0.5 ? a.cover : b.cover,
    isaShare: rnd() < 0.5 ? a.isaShare : b.isaShare,
    backLoad: rnd() < 0.5 ? a.backLoad : b.backLoad,
    sipp: rnd() < 0.5 ? a.sipp : b.sipp,
    balance: rnd() < 0.5 ? a.balance : b.balance,
    steps: orderCrossover(a.steps, b.steps, rnd),
    harvest: rnd() < 0.5 ? a.harvest : b.harvest,
    lump: rnd() < 0.5 ? a.lump : b.lump,
    deposit: orderCrossover(a.deposit, b.deposit, rnd)
  }, shape);
  const pickParent = (popn) => {   // tournament selection, three drawn
    let best = null;
    for (let k = 0; k < 3; k++) { const c = popn[Math.floor(rnd() * popn.length)]; if (!best || better(c, best) > 0) best = c; }
    return best;
  };

  // generation zero: the warm starts, then random genomes, no two alike
  let popn = [];
  const seen = new Set();
  const add = (g) => { const k = genomeKey(g); if (seen.has(k)) return false; seen.add(k); popn.push({ g }); return true; };
  seedGenomes.forEach(g => add(canon({ ...g, steps: g.steps.slice(), deposit: g.deposit.slice() }, shape)));
  let guard = 0;
  while (popn.length < pop && guard++ < pop * 50) add(randomGenome(rnd, shape));

  const history = [];
  let gen = 0;
  const perGen = pop * coarse + Math.ceil(pop * refineFrac) * fine;
  while (used + perGen <= budget || gen === 0) {
    popn.forEach(ind => score(ind, coarse));
    popn.sort((a, b) => better(b, a));
    const nRefine = Math.max(elite, Math.ceil(popn.length * refineFrac));
    popn.slice(0, nRefine).forEach(ind => score(ind, fine));
    popn.sort((a, b) => better(b, a));
    // the same four figures every other searching player reports per candidate, so a caller can show
    // a generation the way it shows a candidate: rate, pre-access failures, the unlucky pot, the median
    history.push({ gen, best: fit(popn[0]), bestRate: popn[0].stats.successRate, mean: popn.reduce((s, i) => s + fit(i), 0) / popn.length, used,
      preAccess: popn[0].stats.preNmpaFailRate, p10: popn[0].stats.p10Terminal, median: popn[0].stats.medianTerminal,
      // how many more generations the remaining budget affords, so a caller can show progress
      remaining: Math.max(0, Math.floor((budget - used) / perGen)) });
    if (onGeneration) onGeneration(history[history.length - 1], popn[0]);
    // The one yield point. A caller on a UI thread drives this with an await between generations so the
    // page stays responsive; evolve() below just runs it to the end.
    yield history[history.length - 1];
    if (used + perGen > budget) break;
    // breed the next generation: elites carried over, the rest from crossover and mutation
    const next = popn.slice(0, elite).map(ind => ind);
    const nextSeen = new Set(next.map(ind => genomeKey(ind.g)));
    let tries = 0;
    while (next.length < pop && tries++ < pop * 20) {
      const child = mutate(cross(pickParent(popn).g, pickParent(popn).g));
      const k = genomeKey(child);
      if (nextSeen.has(k)) continue;
      nextSeen.add(k);
      next.push({ g: child });
    }
    popn = next;
    gen++;
  }
  popn.sort((a, b) => better(b, a));
  const winner = popn[0];
  if (!winner.plan) Object.assign(winner, decode(winner.g));
  const out = (ind) => ({ genome: ind.g, planState: ind.plan, cand: ind.cand, stats: ind.stats, trials: ind.trials, describe: describeGenome(E, ind.g, ind.cand) });
  return { winner: out(winner), elites: popn.slice(0, Math.min(5, popn.length)).map(out), generations: gen + 1, used, history, shape };
}

/* The same search, run to the end in one go. What the tests and the research scripts use. */
export function evolve(E, rawPlan, opts = {}) {
  const it = evolveGen(E, rawPlan, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

/*
 * A resolved tournament player as a genome, so the search can start from the answers the named players
 * already found. This is what makes the evolved player unable to lose to them: elitism carries the best
 * genome of each generation forward untouched, so a warm start is a floor, not a suggestion.
 *
 * `player` is a strategy after its candidates have been scored and the best one chosen, which is where
 * the share, the bridge cover and whether it back-loaded are known. `plan` supplies the draw genes,
 * which no accumulation player varies - they are the household's own settings from the Config tab.
 */
export function genomeFromPlayer(E, player, plan, { balance = 'proportional' } = {}) {
  const pol = E.DECUMULATION_POLICIES[plan?.spending?.decumulationPolicy] || E.DECUMULATION_POLICIES['Bracket Fill Basic'];
  return {
    keep: player.id === 'baseline',
    cover: player.chosenCover === undefined ? null : player.chosenCover,
    isaShare: E.num(player.chosenShare, 0),
    backLoad: !!player.phase,
    sipp: true,
    balance,
    steps: pol.steps.slice(),
    harvest: !!pol.harvest && !!plan?.config?.harvestPersonalAllowance,
    lump: plan?.spending?.drawdownStrategy === 'Full 25% Lump Sum',
    deposit: (pol.depositOrder || E.DEFAULT_DEPOSIT_ORDER).slice()
  };
}
