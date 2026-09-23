/*
 * BACKWARD INDUCTION: THE BEST MOVE FROM EVERY POSITION, WORKED OUT FROM THE END.
 *
 * The last year is easy. Whatever position the household is in at the terminal age, the year can either
 * be paid or it cannot, and whatever is left is the bequest; there is no future to weigh. Step back one
 * year and the question becomes answerable too: for each move, the markets do something, the household
 * lands in some position a year later, and the value of THAT is already written down. So the best move
 * this year needs only a one-year look ahead into a table that is already finished.
 *
 * Repeat to the present and the result is not a rule but a lookup: for every year and every position,
 * the move that leaves the household best off across everything that could follow. No decision ever
 * uses knowledge of what the markets actually did - only the range of what they might do, which is the
 * same distribution the Monte Carlo draws from.
 *
 * WHAT IS BEING MAXIMISED, in the order the app already ranks things: the probability of never falling
 * short, and then, among moves that tie on it EXACTLY, the expected bequest net of the pension death
 * charge. Both are carried through the table separately so a change of prioritisation can re-combine
 * them without re-solving.
 *
 * THE MOVES. UK tax is straight lines with corners, and a best move can only sit at a corner: if it is
 * worth drawing a pound of pension at 20%, it is worth drawing the next one at 20% too, so the choice
 * is where to stop, not how much. That turns a continuous decision into a handful:
 *
 *   how far up the bands the pension is drawn before other pots are touched - not at all, to the
 *   personal allowance, to the basic-rate limit, or all the way (four);
 *   which of the taxable side and the ISA is spent first (two);
 *   whether to draw pension beyond the year's need and re-wrap it, and to which ceiling (three).
 *
 * Twenty-four moves a year, against the eighteen fixed combinations the app searches today - except
 * that here the choice is made again every year from the position the household is actually in.
 *
 * THE YEAR is `fast.js`, held to `model.js` to the pound, which is held to the engine to the pound. The
 * state is six numbers, nothing is allocated in the loop, and the expectation over returns is taken
 * from the post-decision state so it costs one flow per move rather than one per move and node.
 */
import { makeGrid, toVec, locateVec, interp, vecOf, readValues, toLogOdds } from './grid.js';
import * as F from './fast.js';

/*
 * Five-point Gauss-Hermite quadrature against a standard normal: five representative years, weighted so
 * their mean and spread match the distribution. The engine drives every account from ONE market factor
 * each year, scaled by the account's own volatility, so a single dimension covers the whole portfolio.
 * The engine's other source of uncertainty - how good the long-run average turns out to be, drawn once
 * per path rather than once per year - cannot be seen by a solver that has no memory of the path, so it
 * is folded into the annual spread instead. That makes the tails fatter, which is the safe direction.
 */
/*
 * A stamp written into every result record, so a run that straddles an edit is visible in the JSON
 * instead of being reconstructed from process start times. Bump it whenever the solved policy or the
 * landing can move. Experiments run from a snapshot of the tree; this catches it when one does not.
 */
export const SOLVER_VERSION = '2026-09-21.single-stage-landing';

/* The score gain a tier change must beat to be made, once it is also paying its trades: a tenth of a survival point. */
export const SWITCH_MARGIN = 0.001;

export const NODES = [-2.856970, -1.355626, 0, 1.355626, 2.856970];
export const WEIGHTS = [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];

/*
 * GAUSS-HERMITE AT ANY ORDER, so the five above can be CHECKED rather than trusted (PLAN.md Phase V).
 *
 * Five nodes is exact for polynomials to degree nine. That bound is quoted as though it settles the
 * matter, and it does not: the integrand here contains a survival cliff, which is not a polynomial, and
 * the outer two nodes carry 1.1% of the weight each. If a cell's cliff falls near z = -2 the rule has no
 * node anywhere near it. Nothing in this repository has ever varied the count, so the question is open.
 *
 * Computed by Newton iteration on the physicists' Hermite polynomials - the classical `gauher` - then
 * rescaled to the probabilists' form the solver wants (x*sqrt(2), w/sqrt(pi)), so it integrates against
 * a standard normal. Derived rather than tabulated, so there are no new magic numbers to mistype; the
 * gate for it is that n = 5 reproduces the constants above.
 */
export function gaussHermite(n) {
  const x = new Array(n).fill(0), w = new Array(n).fill(0);
  const m = (n + 1) >> 1;
  for (let i = 0; i < m; i++) {
    // the classical starting guesses, which converge in a handful of steps
    let z = i === 0 ? Math.sqrt(2 * n + 1) - 1.85575 * Math.pow(2 * n + 1, -1 / 6)
      : i === 1 ? z0 - 1.14 * Math.pow(n, 0.426) / x[0]
        : i === 2 ? 1.86 * z0 - 0.86 * x[0]
          : i === 3 ? 1.91 * z0 - 0.91 * x[1]
            : 2 * z0 - x[i - 2];
    var z0 = z;
    let pp = 0;
    for (let its = 0; its < 100; its++) {
      let p1 = Math.PI ** -0.25, p2 = 0;
      for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = z * Math.sqrt(2 / (j + 1)) * p2 - Math.sqrt(j / (j + 1)) * p3; }
      pp = Math.sqrt(2 * n) * p2;
      const dz = p1 / pp;
      z -= dz;
      if (Math.abs(dz) <= 1e-14) break;
    }
    z0 = z;
    x[i] = z; x[n - 1 - i] = -z;
    w[i] = 2 / (pp * pp); w[n - 1 - i] = w[i];
  }
  // physicists' (weight e^-x^2) -> probabilists' (standard normal)
  // `x` comes out largest-positive first, so negating already gives ascending order; do NOT reverse it
  const nodes = x.map(v => -v * Math.SQRT2);
  const wts = w.map(v => v / Math.sqrt(Math.PI));
  return { nodes, weights: wts };
}

/*
 * The draw orders worth considering. The three pension steps keep their band order - drawing to the
 * basic-rate limit before filling the allowance is not a different strategy, it is the same one - and
 * cash sits directly before the GIA, because the grid holds them as one pot and the sweep decides the
 * split. Everything else varies.
 */
export function buildActions(opts = {}) {
  const PREFIX = [[], ['penPA'], ['penPA', 'penBasic'], ['penPA', 'penBasic', 'penAny']];
  const PEN = ['penPA', 'penBasic', 'penAny'];
  // flexible spending (Part D): each withdrawal move at each spend level, 1 meaning the plan as written
  // the plan as written comes first at every level list, so a tie in the score goes to it and not to a trim or a raise
  const given = opts.spendLevels && opts.spendLevels.length ? opts.spendLevels : [1];
  const levels = given.includes(1) ? [1, ...given.filter(l => l !== 1)] : given;
  // the risk tier as part of the move (phase 6): the plan's tier first, so a move's tier variants follow it and share its flow
  const tiers = opts.tiers && opts.tiers.length ? opts.tiers : [[0, 0]];
  const out = [];
  for (let pi = 0; pi < PREFIX.length; pi++) {
    const prefix = PREFIX[pi];
    const rest = PEN.filter(x => !prefix.includes(x));
    for (const isaFirst of [false, true]) {
      const mid = isaFirst ? ['isa', 'cash', 'other'] : ['cash', 'other', 'isa'];
      const steps = [...prefix, ...mid, ...rest];
      for (const harvest of [null, 'pa', 'basic']) {
        for (const level of levels) {
          const base = out.length;
          for (const [tp, ti] of tiers) {
            out.push({
              steps, costSteps: steps,
              harvest: harvest !== null, harvestCeil: harvest || 'pa',
              sweepCash: true, lump: false, contrib: null, spendLevel: level,
              tierPen: tp, tierIsa: ti, tierBase: base,
              label: `${prefix.length ? prefix.join('+') + ' first, ' : ''}${isaFirst ? 'ISA' : 'taxable'} before ${isaFirst ? 'taxable' : 'ISA'}${harvest ? `, harvest to ${harvest === 'pa' ? 'the allowance' : 'the basic-rate limit'}` : ''}${level !== 1 ? `, spend ${Math.round(level * 100)}%` : ''}${tp ? `, pension ${tp} tier${tp > 1 ? 's' : ''} down` : ''}${ti ? `, ISA ${ti} tier${ti > 1 ? 's' : ''} down` : ''}`
            });
          }
        }
      }
    }
  }
  return out;
}

/*
 * The spend levels a household's floor allows: the plan as written, two trims, and the floor itself,
 * never below the floor and never duplicated. With no floor (or the floor equal to the target) there is
 * one level, and the solve is exactly the phase 2 solve.
 */
export function spendLevelsFor(floorFrac) {
  if (!(floorFrac > 0) || floorFrac >= 1) return [1];
  // 0.95 mirrors the gentlest move the guardrails make (skipping an inflation rise); the rest are real trims
  const raw = [1, 0.95, 0.9, 0.8, floorFrac].filter(x => x >= floorFrac - 1e-9);
  return [...new Set(raw.map(x => Math.round(x * 1e6) / 1e6))].sort((a, b) => b - a);
}

/* The real rate of each pot (pension, ISA, GIA, cash) at a market draw z. */
function realAt(c, z, out, act = null, t = 0, zPath = 0) {
  const R = act ? act.real : c.real, V = act ? act.volEffAt[t] : c.volEffAt[t], S = act ? act.sigma : c.sigma;
  for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + R[i]) + S[i] * zPath + V[i] * z) - 1;
  return out;
}

/*
 * THE SCENARIO MIXTURE over the per-path mean shift (the statistician's option 1). K tables, each solved
 * with the shift held at its quadrature node for the whole horizon and the yearly spread the plain
 * volatility; the move at a position is the one with the best weighted average of the K tables' scores.
 * Each table has the right persistent drift, so the dispersion and its shape are the engine's; what is
 * left out is learning which shift the path drew, which twenty years of returns barely do. The returned
 * object is the central table with `mix` attached, so everything that runs a table runs a mixture.
 */
const MIX3 = { z: [-Math.sqrt(3), 0, Math.sqrt(3)], w: [1 / 6, 2 / 3, 1 / 6] };
export function solveMixture(E, M, plan, opts = {}) {
  const K = opts.mix === 3 ? 3 : 5;
  const zs = K === 3 ? MIX3.z : NODES, ws = K === 3 ? MIX3.w : WEIGHTS;
  /*
   * PHASE E0. This was `zs.map(z => solve(...))`: K independent solves, each rebuilding every
   * post-decision state. The year's money movement does not depend on the world - `F.flow` reads only
   * structural fields, checked field by field - so the K tables are now solved side by side with one
   * flow a cell shared between them, and what comes out is what the separate solves produced, bit for
   * bit. `solve` reports the whole interleaved build in `meta.ms`, so no summing here.
   */
  const r = solve(E, M, plan, { ...opts, shifts: zs, shiftZ: undefined });
  r.mix = { tables: r.worlds, weights: ws, nodes: zs };
  r.meta.mixture = K;
  return r;
}

/*
 * The tier combinations a household's moves may hold (phase 6). The default ('joint', also `true`) moves
 * the pension and the ISA down together, by the same step: on three households every pair of tiers
 * ('pairs') scored the same opening value to four places at more than twice the cost, so the joint
 * step is the menu and the pairs are kept for checking that.
 */
export function tierCombos(m, mode = true) {
  const t = F.tiersFor(m);
  const joint = mode !== 'pairs';
  const out = [];
  for (let tp = 0; tp < t.pen.length; tp++) for (let ti = 0; ti < t.isa.length; ti++) {
    if (joint && tp !== ti && !(t.pen.length === 1 || t.isa.length === 1)) continue;
    if (joint && (t.pen.length === 1 || t.isa.length === 1) && tp !== 0 && ti !== 0 && tp !== ti) continue;
    out.push([tp, ti]);
  }
  return out;
}

/*
 * Solve one household. Returns the tables, the chosen move for every position and year, and a `policy`
 * function that reads the move for a state the engine is actually in - which is how Phase 3 will run it.
 */
export function solve(E, M, plan, opts = {}) {
  const t0 = Date.now();
  const m = M.prepare(E, plan);
  if (opts.shiftZ !== undefined) m.shiftZ = opts.shiftZ;   // the scenario mixture: this table's held shift
  // one table per person; a couple needs two and a funding split, which is phase 5
  if (m.ctx.isCouple) throw new Error('the solver takes one person at a time; couples are phase 5');
  const g = makeGrid(m, opts);
  const raiseOn = (opts.raiseWeight || 0) > 0;
  let menuLevels = raiseOn || !opts.spendLevels ? opts.spendLevels : opts.spendLevels.filter(l => l <= 1);
  /* THE USER'S RULES ON THE MENU (PLAN.md step 3). `raiseCap`: no level above it (1 blocks raises). `blockTrim`:
   * no level below 1 - never spend under the target. Both only remove moves, never add them. */
  if (menuLevels && opts.raiseCap !== undefined) menuLevels = menuLevels.filter(l => l <= opts.raiseCap + 1e-9);
  if (menuLevels && opts.blockTrim) menuLevels = menuLevels.filter(l => l >= 1 - 1e-9);
  const actions = (opts.actions || buildActions({ spendLevels: menuLevels, tiers: opts.tiers ? tierCombos(m, opts.tiers) : null })).map(a => ({ ...a, lump: !!opts.lump }));
  /*
   * PHASE E0, STEP 1: the loop carries K worlds. `opts.shifts` is the list of held shifts to solve
   * side by side; absent, it is the single-world list `[opts.shiftZ]` and K is 1, which must stay
   * bit-identical to the solve that came before this change (gate E0 condition 1). Nothing calls this
   * with K > 1 yet: step 1 is the restructure alone, so that a failure here is a refactoring bug and a
   * failure later is a sharing bug, and the two are never confused.
   *
   * The world enters in exactly one place. `F.flow` reads only structural fields of the action and the
   * context - checked field by field, 22 Sep - and `F.grow` takes the growth rates as a PARAMETER, so
   * the shift reaches the arithmetic solely through `nodeRealOfAt`. One context therefore serves every
   * world for the flow; each world needs only its own rates and its own tables.
   */
  const shifts = opts.shifts !== undefined ? opts.shifts : [opts.shiftZ];
  const K = shifts.length;
  const cs = shifts.map(z => { if (z === undefined) delete m.shiftZ; else m.shiftZ = z; return F.compile(m, actions); });
  const centre = K >> 1;                       // the middle world is the one the result presents, as solveMixture did
  const c = cs[centre];
  // a tier change costs its round trip on the slice traded (see SWITCH_COST in fast.js); charged at decision time
  const switchCost = opts.switchCost !== undefined ? opts.switchCost : (opts.tiers ? F.SWITCH_COST : 0);
  for (const cc of cs) cc.switchCost = switchCost;
  // ...and is made only when the table's gain from it is worth noticing (see chooseAction)
  const switchMargin = opts.switchMargin !== undefined ? opts.switchMargin : (opts.tiers ? SWITCH_MARGIN : 0);
  const T0 = m.ctx.totalYears;
  // the quadrature rates by year (the folded spread depends on the years left) for each move's tier
  // combination, shared between moves that hold the same tiers
  const byCombo = {};
  // per world, per year, per action: the five quadrature rates. This is the only place the shift lands.
  /*
   * PHASE V1: the quadrature order is a parameter. `quadNodes` absent or 5 uses the tabulated constants,
   * so every existing result is reproduced bit for bit; any other n comes from `gaussHermite`.
   */
  const QUAD = opts.quadNodes && opts.quadNodes !== 5 ? gaussHermite(opts.quadNodes) : { nodes: NODES, weights: WEIGHTS };
  const QZ = QUAD.nodes, QW = QUAD.weights, NQ = QW.length;
  const nodeRealOfAtW = cs.map((cc) => {
    const out = [];
    for (let t = 0; t <= T0; t++) {
      const byK = {};
      out[t] = actions.map((a, ai) => { const k = `${cc.acts[ai].tierPen}/${cc.acts[ai].tierIsa}`; if (!byK[k]) byK[k] = QZ.map(z => realAt(cc, z, new Float64Array(4), cc.acts[ai], t)); byCombo[k] = true; return byK[k]; });
    }
    return out;
  });
  const nodeRealOfAt = nodeRealOfAtW[centre];
  const nodeReal = nodeRealOfAt[0][0];
  // tier variants of a move share its flow: `tierBase` names the move whose flow they reuse
  const tierBase = actions.map((a, ai) => (a.tierBase !== undefined && a.tierBase < ai && actions[a.tierBase].tierBase === a.tierBase ? a.tierBase : ai));
  const T = m.ctx.totalYears;
  const floor = m.ctx.solvencyFloor;
  /*
   * THE TIE THRESHOLD, and why it is not the app's.
   *
   * `RATE_EPSILON_PTS` is a whole percentage point, and it is right where it is used: comparing two
   * Monte Carlo estimates that each carry sampling noise of about that size, so anything closer is not
   * a real difference. Backward induction has no sampling noise - the same position and move always
   * give the same number - so carrying that epsilon in here does real damage. It lets any move within
   * a point of the best on survival win on the bequest instead, and the bequest is measured net of the
   * pension death charge, so the solver empties the pension early and pays 20% to do it. Measured: the
   * first version spent £37k more in lifetime tax than the best fixed rule and lost 0.8 points of
   * survival for it. Here the tie must be exact, and the bequest breaks only a genuine tie.
   */
  const eps = opts.eps !== undefined ? opts.eps : 1e-12;
  const deathTax = m.ctx.pensionDeathTaxRate;
  /*
   * THE OBJECTIVE, MATCHED TO THE APP'S OWN RANKING AS FAR AS A TABLE CAN CARRY IT.
   *
   * The app ranks a plan by survive, then downside (the unlucky tenth's pot), then bequest (the median
   * pot net of death tax), each with its own tolerance. A backward induction cannot carry a quantile,
   * because a quantile does not decompose year by year, and it cannot carry a median for the same
   * reason. What it can carry is any EXPECTATION of a function of the terminal state. So:
   *
   *   survival    P(never falling short)                                 the app's first priority, exact
   *   resilience  P(ending with at least the opening wealth, net)        a decomposable stand-in for
   *               the unlucky tenth: it looks only at the bottom of the distribution
   *   bequest     E[min(terminal net, four times the opening wealth)]    the bequest with its right tail
   *               cut off. The plain expectation was dominated by paths that end at fifty times the
   *               opening wealth, and weighting it told the solver to chase upside; the cap makes it a
   *               statement about ordinary outcomes
   *
   * The score is `survival + wR x resilience + wB x bequest / openingWealth`. With survival strictly
   * first and the bequest only breaking exact ties, ANY survival gain justified ANY bequest loss, and
   * the solver doubled a household's lifetime tax for a death-tax benefit that was zero. The weights
   * say a point of survival is worth two of resilience and half the opening wealth in bequest, which is
   * the app's ordering made numeric. They are the solver's reading of the prioritisation presets, not a
   * setting, and they are not swept: one objective, on both arms, is the experiment.
   */
  const scale = Math.max(1, m.ctx.accounts.reduce((x, a) => x + a.balance, 0));
  const wR = opts.resilienceWeight !== undefined ? opts.resilienceWeight : 0.5;
  const wB = (opts.bequestWeight !== undefined ? opts.bequestWeight : 0.02) / scale;
  const resilK = opts.resilienceAt !== undefined ? opts.resilienceAt : scale;
  const beqCap = opts.bequestCap !== undefined ? opts.bequestCap : 4 * scale;
  /*
   * THE BEQUEST SHAPE (phase 6c). `min(net, cap)` scores an extra pound of estate at exactly zero above
   * the cap, so up there the solver is INDIFFERENT and will trade the pot away for any gain at all.
   * Gate 6b caught it doing that: the cap binds on 9 of the 41 (every one a 52 or 61 year horizon), and
   * of the £35.9M of median pot the tier freedom gave up, £12.8M sat above the cap and cost nothing.
   * S354 went from £7.31M to £4.69M with both ends above its £3.80M cap, so the whole £2.6M was free.
   *
   * The cap itself is right to exist. Survival and resilience are bounded and an estate is not, and the
   * mean of an unbounded quantity is set by the lucky tail: uncapped, a policy leaving £200M in one
   * future of a hundred beats one leaving £1M in all hundred. What is wrong is the cliff, not the
   * refusal to chase upside. `soft` keeps the refusal and loses the cliff:
   *
   *     soft(net) = net                                    net <= cap
   *               = cap x (1 + ln(1 + (net - cap) / cap))  net >  cap
   *
   * Identical below the cap and C1-continuous at it (both one-sided slopes are 1), and above it the
   * marginal value decays like cap/net: always positive, never zero. A hundred times the cap scores
   * about 5.6 cap rather than 100, so the lottery ticket still loses. `cap` stays the default until
   * gate 6c is judged, and every result to date was measured with it.
   */
  /*
   * THE ESTATE CREDIT CURVE ABOVE THE MINIMUM POT (`bequestShape: 'logfloor'`, PLAN.md K4). What the
   * maintainer asked for: credit starts at the user's minimum end pot P, not at zero, and each extra pound
   * counts a little less than the one before - a pound counts half at P + s, a third at P + 2s. `estateScale`
   * sets s in multiples of opening wealth; no cap is needed, since the logarithm already refuses to chase a
   * lucky tail. K4 maps the user's 0-100% slider onto (bequestWeight, estateScale).
   */
  const beqShape = opts.bequestShape === 'soft' ? 'soft' : opts.bequestShape === 'logfloor' ? 'logfloor' : 'cap';
  const estS = (opts.estateScale !== undefined ? opts.estateScale : 1) * scale;
  const minPot = m.ctx.solvencyFloor || 0;
  const beqOf = beqShape === 'soft'
    ? (net) => (net <= beqCap ? net : beqCap * (1 + Math.log(1 + (net - beqCap) / beqCap)))
    : beqShape === 'logfloor'
      ? (net) => (net <= minPot ? 0 : estS * Math.log(1 + (net - minPot) / estS))
      : (net) => Math.min(net, beqCap);
  /*
   * THE RISK TERM, SHORTFALL OR INDICATOR (plan 2c.2). The default is the shortfall,
   * 1 - E[min(1, max(0, K - net) / K)]; `resilience: 'indicator'` restores P(net >= K). The shortfall is: one when the household ends
   * with at least K, falling linearly to zero at nothing. Same range, same weight, but continuous in
   * wealth, so a table of it has no cliff to smear and no line to gamble at. Stored and read linearly.
   */
  // the shortfall term is the default since the tuning on the odd households (plan 2c.2, 2c.3); 'indicator' restores the step
  const shortfall = opts.resilience !== 'indicator';
  g.linearResil = shortfall;
  /*
   * FLEXIBLE SPENDING (Part D). A move may spend below the plan's target; each such year adds
   * ((1 - level))^2 to a running shortfall that is carried as its own table and charged at `lambda`.
   * With lambda at zero the solver would always trim to the floor (survival and bequest both like it);
   * with lambda large it never trims. `solveFlex` bisects lambda until the policy's floor survival lands
   * on the household's confidence. The buffer stays sized on the plan's target (the buffer trap).
   */
  const lambda = opts.lambda !== undefined ? opts.lambda : 0;
  // the shortfall exponent: 2 (the plan) makes one deep cut dearer than two shallow ones; 1 makes small trims proportionally dear
  const shortExp = opts.shortfallExponent !== undefined ? opts.shortfallExponent : 2;
  const shortOf = (level) => Math.pow(1 - level, shortExp);
  /*
   * RAISES (plan 2d.4). A move may also spend above the target after a good run. Nothing else in the
   * score rewards that, so a raise earns a bounded, concave credit, sqrt(level - 1) capped at a 20% raise,
   * at `raiseWeight`; the value function prices what the smaller pot costs in survival, resilience and
   * bequest, so a raise is taken only where the credit beats that cost. The table carries the signed
   * cost in score units: lambda times the shortfall for a trim, minus the credit for a raise.
   */
  const mu = opts.raiseWeight !== undefined ? opts.raiseWeight : 0;
  const creditOf = (level) => Math.sqrt(Math.min(0.2, level - 1));
  const costOf = (level) => (level < 1 ? lambda * shortOf(level) : level > 1 ? -mu * creditOf(level) : 0);
  /*
   * HOLDING AN OFF-PLAN TIER (the one-dial form of plan item (b), 22 Sep). Gate 6b found the solver
   * holding a de-risked pension tier for 0.70 of retired years on the mean and up to 0.97, and paying
   * £870k of median pot for it. Nothing in the score charged for HOLDING a lower tier: `switchCost`
   * charges the round trip and `switchMargin` stops a switch for noise, but once moved the solver sat
   * there for free, and at the objective's exchange rate (a point of survival against half the opening
   * wealth in bequest) sitting there always won.
   *
   * The dial is the one already being landed. A year holding a tier below the plan's costs
   * `driftWeight x lambda x (equity given up)`, summed over the two wrappers, where lambda is the same
   * penalty `solveFlex` bisects to hit the household's floor-rate promise. Tying it to lambda rather
   * than giving de-risking a bisection of its own is what makes this cost nothing: no extra solves, and
   * the promise still governs both levers. It also points the right way. In gate 6b the households
   * holding the most de-risked tier (0.79 to 0.97 of years) were the ones whose ask was lenient enough
   * that lambda pinned at the bracket top, and the ones trimming hardest (lambda at or below 0.1) held
   * 0.04 to 0.30: high lambda means a comfortable household, and a comfortable household should be
   * paying MORE to leave its plan's portfolio, not less.
   *
   * Equity given up, not tier steps, because a step is not a fixed amount of risk and `chargeSwitch`
   * already prices a move by the same measure. The cost is per action and per year, so it is free to
   * evaluate: with driftWeight at zero every entry is zero and the tables are the ones solved before.
   */
  const driftW = opts.driftWeight !== undefined ? opts.driftWeight : 0;
  const eqDrop = (list, k) => {
    if (!list || !list[0] || !list[k] || list[0].equity === undefined || list[k].equity === undefined) return 0;
    return Math.max(0, list[0].equity - list[k].equity);
  };
  const driftCostOf = actions.map(a => (driftW > 0 && c.tiers
    ? driftW * lambda * (eqDrop(c.tiers.pen, a.tierPen || 0) + eqDrop(c.tiers.isa, a.tierIsa || 0))
    : 0));

  // one set of tables per world; at K = 1 these are the arrays the single-world solve always had
  const mk = () => { const a = []; for (let t = 0; t <= T; t++) a[t] = new Float64Array(g.size); return a; };
  const survW = [], lsurvW = [], resilW = [], lresilW = [], beqW = [], polW = [], shortW = [];
  for (let k = 0; k < K; k++) {
    survW[k] = mk(); lsurvW[k] = mk(); resilW[k] = mk(); lresilW[k] = mk(); beqW[k] = mk(); shortW[k] = mk();
    // Uint16, not Uint8: with tiers and five spending levels the menu has 360 moves (432 with six), and a
    // byte silently wrapped every index above 255 to a different move. Found 23 Sep; see results-pol-overflow.txt
    polW[k] = []; for (let t = 0; t <= T; t++) polW[k][t] = new Uint16Array(g.size);
  }
  const surv = survW[centre], lsurv = lsurvW[centre], resil = resilW[centre];
  const lresil = lresilW[centre], beq = beqW[centre], pol = polW[centre], short = shortW[centre];
  const levelOf = actions.map(a => (a.spendLevel !== undefined ? a.spendLevel : 1));

  /*
   * PROFILING, off unless SOLVER_PROFILE is set, because nobody has measured where a solve's time
   * actually goes and every performance decision so far has been made from a measurement. The timers
   * sit at the two hot calls: `flow`, the year's draws and tax, and the node loop that takes the
   * expectation over returns. `performance.now()` is called about four times per evaluated move, so
   * the overhead is real and is reported alongside, not hidden: compare `prof.total` against `ms`.
   */
  const PROF = typeof process !== 'undefined' && process.env && process.env.SOLVER_PROFILE ? { flow: 0, nodes: 0, cells: 0, flows: 0, nodeCalls: 0, skipped: 0 } : null;
  const now = PROF ? () => performance.now() : null;
  // the timers are not free: about 4 million pairs a solve, so calibrate one call and subtract the
  // clock's own cost from each phase rather than reporting shares that flatter whichever phase is
  // timed more often
  if (PROF) {
    const CAL = 2e6; const c0 = performance.now();
    for (let i = 0; i < CAL; i++) performance.now();
    PROF.nsPerCall = (performance.now() - c0) * 1e6 / CAL;
  }
  /*
   * The flows for a whole cell are buffered, then the worlds are looped on the OUTSIDE. Interleaving
   * world-inside-action would triple the hot working set - at 30 points each world's four next-year
   * tables are 311 KB, which sits in L2, and three worlds are 933 KB, which does not - and handing the
   * arithmetic saving straight back in cache misses is a real way to fail. The buffer is A x 7 doubles,
   * about 12 KB, and each world's pass then reads only its own tables: today's access pattern exactly.
   * It also keeps the order of operations within a world untouched, which is what bit-equality needs.
   */
  const base = new Float64Array(7), grown = new Float64Array(7), rd = new Float64Array(4);
  const A = actions.length;
  const postBuf = new Float64Array(A * 7);     // every action's post-decision state at this cell
  const failBuf = new Uint8Array(A);
  let evaluated = 0;
  const profT0 = PROF ? now() : 0;
  const shortOfAction = new Float64Array(A);
  /*
   * THE LEVEL SEARCH (`levelSearch: 'ternary'`, decided 23 Sep). Measured over 5.0 million combinations
   * on the six-level menu, the score is single-peaked in spending level almost everywhere, and a ternary
   * search per group - one draw order, harvest and tier, all its levels - evaluates four levels instead
   * of six, missing 24 times in 5.0 million by at most 0.009 survival points. Flows are computed lazily,
   * only for the levels the search visits; every move it does evaluate is scored with exactly the
   * arithmetic of the exhaustive scan, and the winner is chosen among the evaluated moves by the same
   * rule in the same order, so where the search finds the true peak the table is bit-identical.
   * Off by default: the exhaustive scan below is untouched.
   */
  const TERN = opts.levelSearch === 'ternary';
  let groups = null, stampFlow = null, stampScore = null, scS = null, scB = null, scR = null, scH = null, scV = null, cellStamp = 0;
  if (TERN) {
    const byKey = new Map();
    actions.forEach((a, ai) => { const key = `${(a.steps || []).join('>')}|${a.harvest ? a.harvestCeil : '-'}|${a.tierPen || 0}/${a.tierIsa || 0}`; if (!byKey.has(key)) byKey.set(key, []); byKey.get(key).push(ai); });
    groups = [...byKey.values()].map(list => list.sort((x, y) => levelOf[x] - levelOf[y]));
    stampFlow = new Int32Array(A).fill(-1); stampScore = new Float64Array(A).fill(-1);
    scS = new Float64Array(A); scB = new Float64Array(A); scR = new Float64Array(A); scH = new Float64Array(A); scV = new Float64Array(A);
  }
  for (let t = T; t >= 0; t--) {
    const spendYear = c.yr.spend[t] > 0;
    // world-independent, so computed once a year rather than once a world: E0 made the world loop the
    // outer one and this would otherwise be evaluated K times for the same answer
    for (let ai = 0; ai < A; ai++) shortOfAction[ai] = (spendYear ? costOf(levelOf[ai]) : 0) + driftCostOf[ai];
    for (let ic = 0; ic < g.pcls.length; ic++) {
      for (let ig = 0; ig < g.gain.length; ig++) {
        for (let it = 0; it < g.nt; it++) {
          for (let ii = 0; ii < g.ni; ii++) {
            for (let ip = 0; ip < g.np; ip++) {
              const idx = g.index(ip, ii, it, ig, ic);
              toVec(g, ip, ii, it, ig, ic, base);
              if (TERN) {
                cellStamp++;
                const ensure = (ai) => {
                  const b0 = tierBase[ai];
                  if (stampFlow[b0] !== cellStamp) {
                    const ob = b0 * 7;
                    for (let q = 0; q < 7; q++) postBuf[ob + q] = base[q];
                    const unmet = F.flow(c, t, b0, postBuf.subarray(ob, ob + 7));
                    evaluated++;
                    failBuf[b0] = (unmet > 1 || c.last.preNmpaInsolvent) ? 1 : 0;
                    stampFlow[b0] = cellStamp;
                  }
                  return b0;
                };
                for (let k = 0; k < K; k++) {
                  const nodeRealOf = nodeRealOfAtW[k][t];
                  const sNext = t < T ? lsurvW[k][t + 1] : null;
                  const bNext = t < T ? beqW[k][t + 1] : null;
                  const rNext = t < T ? lresilW[k][t + 1] : null;
                  const hNext = t < T ? shortW[k][t + 1] : null;
                  const key = cellStamp * K + k;
                  const score = (ai) => {
                    if (stampScore[ai] === key) return scV[ai];
                    const o = ensure(ai) * 7;
                    const fail = failBuf[tierBase[ai]] === 1;
                    let s = 0, b = 0, rs = 0, h = 0;
                    if (!fail) {
                      const nr = nodeRealOf[ai];
                      for (let zi = 0; zi < NQ; zi++) {
                        for (let q = 0; q < 7; q++) grown[q] = postBuf[o + q];
                        F.grow(cs[k], t, grown, nr[zi]);
                        if (t === T) {
                          const total = grown[0] + grown[1] + grown[2];
                          const alive = !(floor > 0 && total < floor);
                          const net = Math.max(0, total - grown[0] * deathTax);
                          s += QW[zi] * (alive ? 1 : 0);
                          rs += QW[zi] * (alive ? (shortfall ? 1 - Math.min(1, Math.max(0, resilK - net) / resilK) : (net >= resilK ? 1 : 0)) : 0);
                          b += QW[zi] * (alive ? beqOf(net) : 0);
                        } else {
                          readValues(g, sNext, bNext, grown, rd, rNext, hNext);
                          s += QW[zi] * rd[0];
                          b += QW[zi] * rd[1];
                          rs += QW[zi] * rd[2];
                          h += QW[zi] * rd[3];
                        }
                      }
                    }
                    h += shortOfAction[ai];
                    stampScore[ai] = key; scS[ai] = s; scB[ai] = b; scR[ai] = rs; scH[ai] = h;
                    return (scV[ai] = s + wR * rs + wB * b - h);
                  };
                  for (const G of groups) {
                    let lo = 0, hi = G.length - 1;
                    while (hi - lo > 2) {
                      const m1 = lo + Math.floor((hi - lo) / 3), m2 = hi - Math.floor((hi - lo) / 3);
                      if (score(G[m1]) < score(G[m2])) lo = m1 + 1; else hi = m2 - 1;
                    }
                    for (let j = lo; j <= hi; j++) score(G[j]);
                  }
                  // the winner among every move evaluated, by the exhaustive scan's own rule and order
                  let bestScore = -Infinity, bestS = -1, bestB = -Infinity, bestR = 0, bestA = 0, bestH = 0;
                  for (let ai = 0; ai < A; ai++) {
                    if (stampScore[ai] !== key) continue;
                    const score_ = scV[ai], b = scB[ai];
                    if (score_ > bestScore + eps || (Math.abs(score_ - bestScore) <= eps && b > bestB)) { bestScore = score_; bestS = scS[ai]; bestB = b; bestR = scR[ai]; bestH = scH[ai]; bestA = ai; }
                  }
                  survW[k][t][idx] = bestS; beqW[k][t][idx] = bestB; resilW[k][t][idx] = bestR;
                  polW[k][t][idx] = bestA; shortW[k][t][idx] = bestH;
                }
                if (PROF) PROF.cells++;
                continue;
              }
              /*
               * PASS 1, shared by every world. Every move is tried at every cell; there is no
               * certain-success shortcut, because the plan's bound assumed "no growth" was the worst
               * case and for an invested pot it is not (see zeroGrowthNeed in grid.js). Tier variants
               * of a move reuse its flow, as they always have; the buffer only removes the need for
               * them to be adjacent.
               */
              for (let ai = 0; ai < A; ai++) {
                const o = ai * 7;
                if (tierBase[ai] === ai) {
                  const tf = PROF ? now() : 0;
                  for (let q = 0; q < 7; q++) postBuf[o + q] = base[q];
                  const unmet = F.flow(c, t, ai, postBuf.subarray(o, o + 7));
                  evaluated++;
                  failBuf[ai] = (unmet > 1 || c.last.preNmpaInsolvent) ? 1 : 0;
                  if (PROF) { PROF.flow += now() - tf; PROF.flows++; }
                } else {
                  const b = tierBase[ai] * 7;
                  for (let q = 0; q < 7; q++) postBuf[o + q] = postBuf[b + q];
                  failBuf[ai] = failBuf[tierBase[ai]];
                  if (PROF) PROF.skipped++;
                }
              }
              // PASS 2, once per world: growth at that world's rates, read of that world's tables.
              for (let k = 0; k < K; k++) {
                const nodeRealOf = nodeRealOfAtW[k][t];
                const sNext = t < T ? lsurvW[k][t + 1] : null;
                const bNext = t < T ? beqW[k][t + 1] : null;
                const rNext = t < T ? lresilW[k][t + 1] : null;
                const hNext = t < T ? shortW[k][t + 1] : null;
                let bestScore = -Infinity, bestS = -1, bestB = -Infinity, bestR = 0, bestA = 0, bestH = 0;
                for (let ai = 0; ai < A; ai++) {
                  const o = ai * 7;
                  const fail = failBuf[ai] === 1;
                  let s = 0, b = 0, rs = 0, h = 0;
                  const thisShort = shortOfAction[ai];
                  if (!fail) {
                    const tn = PROF ? now() : 0;
                    const nr = nodeRealOf[ai];
                    for (let zi = 0; zi < NQ; zi++) {
                      for (let q = 0; q < 7; q++) grown[q] = postBuf[o + q];
                      F.grow(cs[k], t, grown, nr[zi]);
                      if (t === T) {
                        const total = grown[0] + grown[1] + grown[2];
                        const alive = !(floor > 0 && total < floor);
                        const net = Math.max(0, total - grown[0] * deathTax);
                        s += QW[zi] * (alive ? 1 : 0);
                        rs += QW[zi] * (alive ? (shortfall ? 1 - Math.min(1, Math.max(0, resilK - net) / resilK) : (net >= resilK ? 1 : 0)) : 0);
                        b += QW[zi] * (alive ? beqOf(net) : 0);
                      } else {
                        readValues(g, sNext, bNext, grown, rd, rNext, hNext);
                        s += QW[zi] * rd[0];
                        b += QW[zi] * rd[1];
                        rs += QW[zi] * rd[2];
                        h += QW[zi] * rd[3];
                      }
                    }
                    if (PROF) { PROF.nodes += now() - tn; PROF.nodeCalls++; }
                  }
                  h += thisShort;
                  const score = s + wR * rs + wB * b - h;
                  if (score > bestScore + eps || (Math.abs(score - bestScore) <= eps && b > bestB)) { bestScore = score; bestS = s; bestB = b; bestR = rs; bestH = h; bestA = ai; }
                }
                survW[k][t][idx] = bestS; beqW[k][t][idx] = bestB; resilW[k][t][idx] = bestR;
                polW[k][t][idx] = bestA; shortW[k][t][idx] = bestH;
              }
              if (PROF) PROF.cells++;
            }
          }
        }
      }
    }
    for (let k = 0; k < K; k++) {
      toLogOdds(survW[k][t], lsurvW[k][t]);
      if (shortfall) lresilW[k][t].set(resilW[k][t]); else toLogOdds(resilW[k][t], lresilW[k][t]);
    }
  }

  const meta = { ms: Date.now() - t0, size: g.size, years: T + 1, actions: actions.length, evaluated, lump: !!opts.lump, points: g.mode === 'total' ? `total ${g.np} x ${g.ni} x ${g.nt}` : (g.np === g.ni && g.ni === g.nt ? g.np : `${g.np}/${g.ni}/${g.nt}`), coords: g.mode, wR, bequestWeight: wB * scale, resilienceAt: resilK, bequestCap: beqCap, bequestShape: beqShape, resilience: shortfall ? 'shortfall' : 'indicator', lambda, raiseWeight: mu, driftWeight: driftW, spendLevels: [...new Set(levelOf)], levelSearch: TERN ? 'ternary' : 'exhaustive', tiers: Object.keys(byCombo).length > 1 ? Object.keys(byCombo) : null, switchCost: c.switchCost, switchMargin, solverVersion: SOLVER_VERSION };
  if (PROF) {
    PROF.total = now() - profT0;
    // two clock calls per timed region, and the outer pair too
    const costMs = (n) => n * 2 * PROF.nsPerCall / 1e6;
    PROF.flowNet = PROF.flow - costMs(PROF.flows);
    PROF.nodesNet = PROF.nodes - costMs(PROF.nodeCalls);
    PROF.overhead = costMs(PROF.flows + PROF.nodeCalls);
    PROF.totalNet = PROF.total - PROF.overhead;
    PROF.otherNet = PROF.totalNet - PROF.flowNet - PROF.nodesNet;
    PROF.other = PROF.total - PROF.flow - PROF.nodes;
    meta.profile = PROF;
  }
  const r = {
    m, g, c, actions, surv, lsurv, resil, lresil, beq, short, pol, meta, M, eps, nodeReal, nodeRealOfAt, wB, wR, lambda, levelOf, shortExp, costOf, switchMargin, driftCostOf,
    quadWeights: QW,
    tieMargin: opts.tieMargin || 0,
    /* the end-of-plan rule the backward pass applies at t = T, so the final year can be scored exactly (see scoreMoves) */
    terminal: { floor, deathTax, resilK, shortfall, beqOf },
    finalExact: !!opts.finalExact,
    /*
     * PHASE E0, STEP 2. One result-like view per world, for `chooseAction`'s mixture loop, which calls
     * `scoreMoves(tab, ...)` on each and so needs a complete object. Everything immutable is shared by
     * reference - the grid, the actions, the penalties - and only what the world owns differs: its
     * context, its growth rates and its six tables. At K = 1 this is a one-element list holding `r`
     * itself, so the single-world path allocates nothing extra.
     */
    worlds: null,
    rich: null,   // a second solve at half the resolution, for Richardson extrapolation of the move scores
    /* The stored move for the nearest cell to a state; `chooseAction` is the better read. */
    policy(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); return actions[pol[Math.min(t, T)][nearestIndex(g, s)]]; },
    /* What the table says this position is worth, before anything is executed. */
    value(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); const loc = locateVec(g, s); const k = Math.min(t, T); const sv = interp(g, surv[k], loc, true), rs = interp(g, resil[k], loc, !shortfall), bq = interp(g, beq[k], loc, false); return { survival: sv, resilience: rs, bequest: bq, score: sv + wR * rs + wB * bq }; }
  };
  r.worlds = K === 1 ? [r] : cs.map((cc, k) => (k === centre ? r : {
    m, g, c: cc, actions, meta, M, eps, wB, wR, lambda, levelOf, shortExp, costOf, switchMargin, driftCostOf,
    surv: survW[k], lsurv: lsurvW[k], resil: resilW[k], lresil: lresilW[k], beq: beqW[k], short: shortW[k], pol: polW[k],
    nodeRealOfAt: nodeRealOfAtW[k], nodeReal: nodeRealOfAtW[k][0][0], quadWeights: QW,
    tieMargin: opts.tieMargin || 0, rich: null, worlds: null,
    terminal: { floor, deathTax, resilK, shortfall, beqOf }, finalExact: !!opts.finalExact,
    /*
     * A world view answers `policy` and `value` as the central result does, reading ITS OWN tables.
     * Leaving them off made the view scoreable but not readable, which is half a result: the mixture
     * test asks each table what the opening position is worth, and that is the one question a table
     * exists to answer. Same bodies as above, bound to this world's six tables.
     */
    policy(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); return actions[polW[k][Math.min(t, T)][nearestIndex(g, s)]]; },
    value(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); const loc = locateVec(g, s); const kk = Math.min(t, T); const sv = interp(g, survW[k][kk], loc, true), rs = interp(g, resilW[k][kk], loc, !shortfall), bq = interp(g, beqW[k][kk], loc, false); return { survival: sv, resilience: rs, bequest: bq, score: sv + wR * rs + wB * bq }; }
  }));
  return r;
}

/*
 * THE MOVE FOR A POSITION THE HOUSEHOLD IS ACTUALLY IN.
 *
 * The table stores a move per grid cell, but a real household is never exactly on a cell, and on a log
 * axis the nearest one can be half again as rich. Reading the stored move there is the single largest
 * avoidable error in the whole scheme - measured at more than a point of survival on its own.
 *
 * So the stored move is not what gets used. The VALUE function is the solver's real output, and it can
 * be read anywhere by interpolation. Each year every move is tried from the true position, the markets
 * are integrated over, and the move with the best value wins. It is the same maximisation the solve
 * did, taken once more at the position that actually arose, and it costs one year of arithmetic.
 */
export function chooseAction(r, s, t, held = null) {
  const { actions } = r;
  const T = r.m.ctx.totalYears;
  /*
   * THE FINAL YEAR (`finalExact`, 23 Sep, found by the step-2 records). Off, the last year reads the stored
   * move of the NEAREST cell - the one read this function exists to avoid. It decided the step-2 outliers:
   * all 53 paths S206 lost at 56 points, and 27 of the 28 S390 lost under the ternary search, failed in the
   * final year, from a near-empty position whose nearest cell could afford a move the real one could not.
   * On, every move is scored at the exact position against the end-of-plan rule the backward pass itself
   * applies at t = T (scoreMoves below), so the last year is the same exact maximisation as every other.
   */
  if (t >= T && !r.finalExact && !r.mix) return r.pol[T][nearestIndex(r.g, s)];
  if (t >= T && !r.finalExact) return r.mix.tables[Math.floor(r.mix.tables.length / 2)].pol[T][nearestIndex(r.g, s)];
  const eps = r.eps;
  const n = actions.length;
  const SC = r._sc || (r._sc = new Float64Array(n));
  const TX = r._tx || (r._tx = new Float64Array(n));
  const BQ = r._bq || (r._bq = new Float64Array(n));
  if (r.mix) {
    // the mixture: the weighted average of every table's score for each move; a move that fails in any table fails
    SC.fill(0); TX.fill(0); BQ.fill(0);
    const S2 = r._scm || (r._scm = new Float64Array(n)), T2 = r._txm || (r._txm = new Float64Array(n)), B2 = r._bqm || (r._bqm = new Float64Array(n));
    r.mix.tables.forEach((tab, k) => {
      scoreMoves(tab, s, t, S2, T2, B2, held);
      const w = r.mix.weights[k];
      for (let ai = 0; ai < n; ai++) { if (S2[ai] === -Infinity || SC[ai] === -Infinity) SC[ai] = -Infinity; else SC[ai] += w * S2[ai]; TX[ai] += w * T2[ai]; BQ[ai] += w * B2[ai]; }
    });
  } else scoreMoves(r, s, t, SC, TX, BQ, held);
  /*
   * RICHARDSON EXTRAPOLATION. The table's optimism was measured to fall as 1/n in the grid points
   * (S070: +21, +16, +13, +9 at 12, 16, 20, 28). With a second solve at half the points, 2 x score(n)
   * - score(n/2) cancels the leading term of that error for every move at once, at the cost of one
   * more, cheaper, solve. Off unless `r.rich` is set.
   */
  if (r.rich) {
    const S2 = r._sc2 || (r._sc2 = new Float64Array(n));
    scoreMoves(r.rich, s, t, S2, r._tx2 || (r._tx2 = new Float64Array(n)), r._bq2 || (r._bq2 = new Float64Array(n)), held);
    for (let ai = 0; ai < n; ai++) SC[ai] = SC[ai] === -Infinity || S2[ai] === -Infinity ? -Infinity : 2 * SC[ai] - S2[ai];
  }
  let bestScore = -Infinity, bestB = -Infinity, best = 0;
  for (let ai = 0; ai < n; ai++) {
    const score = SC[ai];
    if (score > bestScore + eps || (Math.abs(score - bestScore) <= eps && BQ[ai] > bestB)) { bestScore = score; bestB = BQ[ai]; best = ai; }
  }
  /*
   * IS THE SWITCH WORTH IT (phase 6). A tier change is made only when the table's gain from it beats
   * `switchMargin`, in score units (survival-equivalent): a gain the household could not tell from
   * noise is not worth the trades and the bother. The moves that keep the tiers held are compared on
   * their own; if the best of them is within the margin of the best overall, it is chosen.
   */
  const sm = r.switchMargin || 0;
  if (held && sm > 0) {
    const acts = r.c.acts;
    if (acts[best].tierPen !== held.pen || acts[best].tierIsa !== held.isa) {
      let stay = -1, stayScore = -Infinity, stayB = -Infinity;
      for (let ai = 0; ai < n; ai++) {
        if (acts[ai].tierPen !== held.pen || acts[ai].tierIsa !== held.isa) continue;
        const score = SC[ai];
        if (score > stayScore + eps || (Math.abs(score - stayScore) <= eps && BQ[ai] > stayB)) { stayScore = score; stayB = BQ[ai]; stay = ai; }
      }
      if (stay >= 0 && stayScore > -Infinity && bestScore - stayScore <= sm) { best = stay; bestScore = stayScore; bestB = stayB; }
    }
  }
  /*
   * WHEN THE TABLE CANNOT TELL, DO NOT PAY TAX NOW. Within `tieMargin` of the best score, prefer the
   * move with the least tax this year; an exact tie there still goes to the larger bequest. Off by
   * default; measured to recover 1.5 points on S070 and give back half a point on the largest wins.
   */
  const tie = r.tieMargin || 0;
  if (tie > 0) {
    let pick = best, pickTx = TX[best], pickB = BQ[best];
    for (let ai = 0; ai < n; ai++) {
      if (SC[ai] < bestScore - tie) continue;
      if (TX[ai] < pickTx - 1e-9 || (Math.abs(TX[ai] - pickTx) <= 1e-9 && BQ[ai] > pickB)) { pick = ai; pickTx = TX[ai]; pickB = BQ[ai]; }
    }
    return pick;
  }
  return best;
}

/* Every move's score from one solve's tables at the true position `s` in year `t`, with the year's tax and the expected bequest. */
/*
 * Exported so a probe can ask what EVERY action scores at a position, not just which one wins.
 * `chooseAction` returns the argmax and throws the rest away, which makes questions about the SHAPE of
 * the action set - is the score single-peaked in spending level? are most actions dominated? -
 * unanswerable from outside. Pure function, no state touched.
 */
export function scoreMoves(r, s, t, SC, TX, BQ, held = null) {
  const { g, c, actions, lsurv, lresil, beq, short, nodeRealOfAt, wB, wR, levelOf } = r;
  const nodeRealOf = nodeRealOfAt[t];
  const post = r._post || (r._post = new Float64Array(Math.max(7, s.length)));
  const grown = r._grown || (r._grown = new Float64Array(Math.max(7, s.length)));
  const rd = r._rd || (r._rd = new Float64Array(4));
  const spendYear = c.yr.spend[t] > 0;
  for (let ai = 0; ai < actions.length; ai++) {
    post.set(s);
    const unmet = F.flow(c, t, ai, post);
    TX[ai] = c.last.taxPaid + c.last.cgtPaid;
    if (unmet > 1 || c.last.preNmpaInsolvent) { SC[ai] = -Infinity; BQ[ai] = 0; continue; }
    // a move that changes tier pays the round trip on the slice traded before the year's growth
    if (held) F.chargeSwitch(c, post, held, c.acts[ai]);
    let sv = 0, bq = 0, rs = 0, h = (spendYear ? r.costOf(levelOf[ai]) : 0) + (r.driftCostOf ? r.driftCostOf[ai] : 0);
    const nr = nodeRealOf[ai];
    const QW = r.quadWeights || WEIGHTS;
    if (t >= r.m.ctx.totalYears) {
      // the final year, exactly as the backward pass scores it at t = T: grown, then judged by the end-of-plan rule
      const { floor, deathTax, resilK, shortfall, beqOf } = r.terminal;
      for (let zi = 0; zi < QW.length; zi++) {
        grown.set(post);
        F.grow(c, t, grown, nr[zi]);
        const total = grown[0] + grown[1] + grown[2];
        const alive = !(floor > 0 && total < floor);
        const net = Math.max(0, total - grown[0] * deathTax);
        sv += QW[zi] * (alive ? 1 : 0);
        rs += QW[zi] * (alive ? (shortfall ? 1 - Math.min(1, Math.max(0, resilK - net) / resilK) : (net >= resilK ? 1 : 0)) : 0);
        bq += QW[zi] * (alive ? beqOf(net) : 0);
      }
      SC[ai] = sv + wR * rs + wB * bq - h; BQ[ai] = bq;
      continue;
    }
    for (let zi = 0; zi < QW.length; zi++) {
      grown.set(post);
      F.grow(c, t, grown, nr[zi]);
      readValues(g, lsurv[t + 1], beq[t + 1], grown, rd, lresil[t + 1], short[t + 1]);
      sv += QW[zi] * rd[0];
      bq += QW[zi] * rd[1];
      rs += QW[zi] * rd[2];
      h += QW[zi] * rd[3];
    }
    SC[ai] = sv + wR * rs + wB * bq - h; BQ[ai] = bq;
  }
}

/* The K best moves at a position, by the same score chooseAction uses (a couple's rollout builds its candidates from these). */
export function rankActions(r, s, t, held = null, K = 3) {
  const n = r.actions.length;
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n);
  if (r.mix) {
    SC.fill(0);
    const S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
    r.mix.tables.forEach((tab, k) => { scoreMoves(tab, s, r.finalExact ? t : Math.min(t, r.m.ctx.totalYears - 1), S2, T2, B2, held); const w = r.mix.weights[k]; for (let ai = 0; ai < n; ai++) { if (S2[ai] === -Infinity || SC[ai] === -Infinity) SC[ai] = -Infinity; else SC[ai] += w * S2[ai]; BQ[ai] += w * B2[ai]; } });
  } else scoreMoves(r, s, r.finalExact ? t : Math.min(t, r.m.ctx.totalYears - 1), SC, TX, BQ, held);
  const idx = []; for (let ai = 0; ai < n; ai++) if (SC[ai] > -Infinity) idx.push(ai);
  idx.sort((a, b) => (SC[b] - SC[a]) || (BQ[b] - BQ[a]));
  return idx.slice(0, K);
}

/*
 * RUN THE SOLVED PLAN FORWARD on one market path, reading the move each year from the value function
 * at the true position (or, with `stored`, from the nearest cell). This, and not the table's own number,
 * is what the solver is judged on: a value function read across a coarse grid can flatter itself; a
 * simulation that actually spends the money cannot. `zs` is the same per-year draw the fixed rules see.
 */
export function runPolicy(r, zs, opts = {}) {
  const { m, g, c, actions, pol } = r;
  const T = m.ctx.totalYears;
  /* `start` (the ranking check, PLAN.md step 2b): begin at year t0 from a given position and tiers, taking
   * `firstAi` in that first year and the solver's own move after it. Absent, the run starts at year 0 as always. */
  const st0 = opts.start || null;
  const s = st0 ? Float64Array.from(st0.s) : vecOf(m, r.M.initialState(m));
  const real = new Float64Array(4);
  // the path's own long-run shift, drawn once (the engine keeps it after the yearly draws); nothing in fold mode
  const zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  // belowSum/aboveSum carry the level in the years it was under or over target, so the report can say how
  // DEEP a trim was and how big a raise, not only how often each happened
  let lifetimeTax = 0, spendYears = 0, atTarget = 0, aboveTarget = 0, belowSum = 0, aboveSum = 0, minLevel = 1, shortfall = 0, changes = 0, lastLevel = null, levelSum = 0, tierPenYears = 0, tierIsaYears = 0, tierChanges = 0, lastTier = null, switchPaid = 0;
  const held = st0 ? { pen: st0.held.pen, isa: st0.held.isa } : { pen: 0, isa: 0 };   // the tiers held: the plan's until a move changes them
  /* RUN RECORDS (research/solver/record.mjs): a per-year trace when a caller asks for one. Off, it costs a null check. */
  const tr = opts.trace || null;
  const traceYear = (t, lv, spendYear, taxYear) => {
    const k = tr.row * tr.Y + t, w = s[0] + s[1] + s[2];
    tr.level[k] = spendYear ? Math.max(0, Math.min(255, Math.round(100 * lv))) : 0;
    tr.tier[k] = held.pen * 4 + held.isa; tr.wealth[k] = w; tr.penShare[k] = w > 0 ? Math.round(100 * s[0] / w) : 0; tr.taxPaid[k] = taxYear;
  };
  for (let t = st0 ? st0.t : 0; t <= T; t++) {
    const ai = st0 && t === st0.t ? st0.firstAi : (opts.stored ? pol[Math.min(t, T)][nearestIndex(g, s)] : chooseAction(r, s, t, held));
    if (opts.visit) opts.visit(t, s, held, ai);
    const unmet = F.flow(c, t, ai, s);
    lifetimeTax += c.last.taxPaid + c.last.cgtPaid;
    { const a = c.acts[ai]; switchPaid += F.chargeSwitch(c, s, held, a); held.pen = a.tierPen; held.isa = a.tierIsa; if (a.tierPen > 0) tierPenYears++; if (a.tierIsa > 0) tierIsaYears++; const k = a.tierPen * 4 + a.tierIsa; if (lastTier !== null && k !== lastTier) tierChanges++; lastTier = k; }
    if (c.yr.spend[t] > 0) {
      spendYears++; const lv = c.last.level; levelSum += lv;
      if (lv >= 1 - 1e-9) atTarget++; else belowSum += lv;
      if (lv > 1 + 1e-9) { aboveTarget++; aboveSum += lv; }
      if (lv < minLevel) minLevel = lv;
      shortfall += (1 - Math.min(1, lv)) * (1 - Math.min(1, lv));
      // whipsaw: how often the year's spend level differs from last year's
      if (lastLevel !== null && Math.abs(lv - lastLevel) > 1e-6) changes++;
      lastLevel = lv;
    }
    if (unmet > 1 || c.last.preNmpaInsolvent) { if (tr) tr.failYear[tr.row] = t; return { survived: false, failYear: m.ctx.baseYear + t, failAge: m.ctx.ageSelf0 + t, preAccess: !!c.last.preNmpaInsolvent, terminalNet: 0, terminal: 0, lifetimeTax, action: actions[ai], spendYears, atTarget, aboveTarget, minLevel: 0, shortfall, changes, levelSum, fullyFunded: false, tierPenYears, tierIsaYears, tierChanges, switchPaid }; }
    F.grow(c, t, s, realAt(c, zs[t], real, c.acts[ai], t, zPath));
    if (tr) traceYear(t, c.last.level, c.yr.spend[t] > 0, c.last.taxPaid + c.last.cgtPaid);
  }
  const total = s[0] + s[1] + s[2];
  const spendStats = { spendYears, atTarget, aboveTarget, belowSum, aboveSum, minLevel, shortfall, changes, levelSum, fullyFunded: atTarget === spendYears, tierPenYears, tierIsaYears, tierChanges, switchPaid };
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, failYear: m.ctx.baseYear + T, failAge: m.ctx.ageSelf0 + T, preAccess: false, terminalNet: 0, terminal: 0, lifetimeTax, ...spendStats, fullyFunded: false };
  return { survived: true, failYear: null, failAge: null, preAccess: false, terminalNet: Math.max(0, total - s[0] * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax, ...spendStats };
}

/*
 * FLEXIBLE SPENDING: THE SOLVE THAT LANDS ON THE HOUSEHOLD'S CONFIDENCE (Part D).
 *
 * The household names a target, a floor and how sure it wants to be of never going below the floor.
 * The solver is given the trims as moves and a penalty `lambda` on trimming; the larger the penalty,
 * the less it trims and the lower its floor survival. This finds, by bisection on log lambda, the
 * LARGEST penalty (the least trimming) whose floor survival still meets the confidence, measured by
 * running the policy on `searchPaths` paths in the fast flow. If even the untrimmed plan meets the
 * confidence, no trimming is asked for; if even trimming to the floor every year cannot meet it, the
 * most protective policy is returned and `meta.landed` says the confidence was not reachable.
 */
export function solveFlex(E, M, plan, opts = {}) {
  const probe = M.prepare(E, plan);
  const floorFrac = probe.ctx.floorFrac || 0;
  const levels = opts.spendLevels || spendLevelsFor(floorFrac);
  // the penalty is chosen on the search paths, so a policy that just meets the ask there tends to fall short on
  // held-out paths; `margin` asks for a little more than the confidence to land on it
  const confidence = (opts.confidence !== undefined ? opts.confidence : (probe.ctx.floorConfidence || 0.9)) + (opts.margin || 0);
  const tol = opts.tolerance !== undefined ? opts.tolerance : 0.005;
  /*
   * ONE DRAW, TWO STAGES, AND THE SECOND ONE IS NOT OPTIONAL.
   *
   * This is the lesson `optimizeSpend` in the app learned the hard way, re-learned here. Bisecting on a
   * small sample selects, among the lambdas near the boundary, whichever one that sample happened to
   * flatter - the winner's curse - so re-measuring regresses, and always downward, because the selection
   * was upward. Measured on the flex-mix pilot, which searched on 600 paths with seed 7001 and reported
   * on 3,000 with 7002: the three households that missed all MET their ask on the search paths and came
   * back 1.5 to 2.1 points below it on held-out, each about one standard error of a 600-path estimate.
   * A floor promised at 92% that holds 91% of the time is not a rounding error.
   *
   * So: one draw throughout. `pathsForSeed` builds path i deterministically from the seed, so the search
   * set is a genuine PREFIX of the verification set rather than a different draw, and stage 2 re-measures
   * the chosen table on the whole of it, walking lambda down until the rate we are about to PROMISE
   * clears the ask. What is returned in `floorRate` is what was checked; the search estimate that guided
   * the bisection is kept beside it as `searchFloorRate`.
   *
   * The app splits its budget the other way round (cheap re-runs, expensive paths) because its "solve" is
   * one more Monte Carlo. Ours is a table, or K tables under the mixture, so paths are nearly free here:
   * 12,600 forward runs take under two seconds. Verification costs no solve at all unless it has to walk.
   */
  /*
   * SINGLE STAGE BY DEFAULT, and the two-stage path below is kept only as the record of a loss.
   *
   * Bisecting on a cheap small sample and verifying the winner on a big one is the right shape when a
   * try costs a simulation run - which is why `optimizeSpend` in the app is built that way. Here a try
   * costs a SOLVE, three tables under the mixture, and the paths are nearly free beside it, so a noisy
   * search lands in the wrong neighbourhood and the repair is paid in the expensive currency. Measured
   * head to head on the two households the old landing missed by a point:
   *
   *            over the ask   years at target   solves   time
   *   single       +0.80 / +0.13   0.86 / 0.97    7 / 7   2093s / 2814s
   *   two-stage    +0.93 / +1.17   0.82 / 0.89   9 / 10   2989s / 4497s
   *
   * Single stage wins on all four, on both. So verifyPaths defaults to searchPaths, which makes the
   * code below exactly one sample throughout, and stage 2 never runs. Raising verifyPaths re-enables
   * it; do not, without re-running that comparison.
   */
  const nSearch = opts.searchPaths || 5400;
  const nVerify = Math.max(opts.verifyPaths || nSearch, nSearch);
  const zsAll = E.pathsForSeed(opts.seed || 4242, nVerify, probe.ctx.totalYears);
  const zsSearch = nVerify === nSearch ? zsAll : zsAll.slice(0, nSearch);
  /*
   * THE SPLIT, off unless SOLVER_PROFILE is set: how much of a LANDING is solving, and how much is
   * running the policy forward over paths?
   *
   * It matters because the whole of Part E - E0 through E4 - makes the SOLVE faster and none of it
   * touches the forward passes. If those are half the run then E3's measured 30.2% is 30.2% of half,
   * and the cheapest remaining win is the search-path count instead. That was an estimate differenced
   * from two runs that changed several things at once, which is exactly the reasoning that produced
   * the wrong cost figures this instrument exists to replace. So: measure it directly.
   */
  const FPROF = typeof process !== 'undefined' && process.env && process.env.SOLVER_PROFILE
    ? { solveMs: 0, fwdMs: 0, solveCalls: 0, fwdRuns: 0 } : null;
  const rateOn = (r, paths) => {
    const t = FPROF ? Date.now() : 0;
    const v = paths.filter(z => runPolicy(r, z).survived).length / paths.length;
    if (FPROF) { FPROF.fwdMs += Date.now() - t; FPROF.fwdRuns += paths.length; }
    return v;
  };
  let solves = 0;
  /*
   * THE TRACE: every (lambda, floor rate) the search actually visits, in order.
   *
   * The landing computed these and threw them away, keeping only where it stopped. That made a fair
   * question - what does the floor rate look like as a function of lambda? - unanswerable from any
   * recorded run, and the answer decides whether a smarter root-finder than bisection can help.
   *
   * It matters because the shape is NOT the smooth curve the stage-2 comment below implies. The policy
   * is an argmax over a finite action set, so it is constant in lambda until two actions tie and then
   * jumps: the floor rate is a STAIRCASE. And the solver maximises survival + resilience + bequest,
   * not survival alone, so nothing forces the survival component of an argmax to move monotonically
   * when one term's weight changes - gate 6b found the de-risking channel lifting floors on its own.
   * Free to keep, and it makes the shape a matter of record rather than of assumption.
   */
  const trace = [];
  const at = (lambda) => {
    const t = FPROF ? Date.now() : 0;
    const r = (opts.mix ? solveMixture : solve)(E, M, plan, { ...opts, spendLevels: levels, lambda });
    if (FPROF) { FPROF.solveMs += Date.now() - t; FPROF.solveCalls++; }
    r.floorRate = rateOn(r, zsSearch); solves++;
    trace.push({ lambda, searchRate: r.floorRate });
    return r;
  };
  /*
   * The rate about to be promised, on the full draw the search set is a prefix of.
   *
   * WHEN THE TWO DRAWS ARE THE SAME ARRAY, THIS IS A NO-OP, AND IT USED NOT TO BE. `verifyPaths`
   * defaults to `searchPaths` - that is the whole point of the single-stage landing above - so
   * `zsSearch` and `zsAll` are the SAME OBJECT, and re-running `rateOn` against the same immutable
   * table on the same paths returned the same bits at full price.
   *
   * It was not a small price. A landing calls `at` eight times and `verify` three times (the bracket
   * top, the bracket bottom, and the chosen table), so a QUARTER of all forward-pass work was
   * recomputing a number already in hand - and forward passes dominate: a single-solve probe at 12
   * points still took 15 minutes, almost none of it solving.
   *
   * The guard is identity, not equality, so it cannot fire on two draws that merely happen to match.
   * When `verifyPaths` is raised above `searchPaths` the second pass is real work and still happens.
   */
  const sameDraw = zsSearch === zsAll;
  const verify = (r) => {
    if (r.searchFloorRate !== undefined) return r;
    r.searchFloorRate = r.floorRate;
    if (!sameDraw) r.floorRate = rateOn(r, zsAll);
    return r;
  };
  const done = (r, landed, vSteps = 0) => {
    r.meta.landed = landed; r.meta.solves = solves; r.meta.confidence = confidence;
    r.meta.searchPaths = nSearch; r.meta.verifyPaths = nVerify; r.meta.verifySteps = vSteps;
    r.meta.solverVersion = SOLVER_VERSION;
    if (FPROF) r.meta.split = { ...FPROF, totalMs: FPROF.solveMs + FPROF.fwdMs };
    r.meta.trace = trace;
    return r;
  };
  if (levels.length === 1) return done(verify(at(0)), 'no floor');
  if (!levels.some(l => l < 1)) return done(verify(at(0)), 'no floor');   // raises only: nothing to land
  /*
   * LAMBDA HELD, FOR A SCREEN. One solve instead of the five to seven a landing takes, by skipping the
   * bisection and using a penalty that was landed on a previous run of the same household.
   *
   * This exists so a screen can compare ARMS at a fixed penalty rather than comparing landings, which
   * is a different and much more expensive question. The cost is stated wherever it is used and is not
   * negotiable: with lambda held, THE FLOOR RATE IS NOT PINNED, so the arms are not compared at equal
   * downside and no number from such a run is a headline. `landed` says 'lambda held' so a reducer
   * cannot mistake one of these for a landing.
   */
  if (opts.lambdaFixed !== undefined) return done(verify(at(opts.lambdaFixed)), 'lambda held');
  // the bracket: landings in the pilot sat between 0.05 and 0.5, so 0.005 to 2 reaches them in fewer solves
  let hi = opts.lambdaHigh || 2, lo = opts.lambdaLow || 5e-3;
  const rHi = at(hi);
  if (verify(rHi).floorRate >= confidence) return done(rHi, 'no trimming needed');
  /*
   * The bracket's bottom: the most trimming on offer, and what stage 2 falls back to.
   *
   * Reaching it is not a failure, and calling it one was misleading. On the clean 41, seven households
   * ended here, every one with an ask between 97.6 and 99.0, and every one delivered within 0.37 of that
   * ask; the reducer counted all seven as landings. What the bottom of the bracket means is that the ask
   * PLUS the margin is more than trimming can buy, because the failures left at that level are ones no
   * amount of trimming fixes. So the label says where the solve stopped and leaves the pass/fail to the
   * caller, which judges the delivered rate against the ask on its own terms.
   */
  const rLo = at(lo);
  if (verify(rLo).floorRate < confidence) return done(rLo, 'at the bracket floor');
  let best = rLo;
  // stage 1: find the neighbourhood on the search prefix, moving lambda up while it still meets the ask
  for (let k = 0; k < (opts.bisectSteps || 6); k++) {
    const mid = Math.exp((Math.log(lo) + Math.log(hi)) / 2);
    const r = at(mid);
    if (r.floorRate >= confidence) { lo = mid; best = r; if (r.floorRate - confidence <= tol) break; } else hi = mid;
  }
  /*
   * Stage 2: re-measure on the full draw, and if the promise does not hold, bisect on the VERIFIED rate
   * for the LARGEST lambda that still clears it - the least trimming that keeps the promise.
   *
   * Taking the first lambda that clears instead is the mistake this replaced, and it is a worse bug than
   * the one it was fixing. The bracket bottom is ten to twenty times below where the answer sits, so one
   * step of "halve the gap and accept" landed S004 at lambda 0.043 against the 0.45 it wanted: the floor
   * cleared its 92.2 ask by two points, and the years at the full target fell from 1.00 to 0.61. Landing
   * a floor by over-trimming spends exactly what the floor exists to protect.
   */
  verify(best);
  let vSteps = 0;
  if (best.floorRate < confidence) {
    /*
     * loL clears the ask, hiL does not, and the floor rate is smooth and monotone in log lambda between
     * them, so interpolate for the crossing rather than bisect to it (regula falsi, the same idiom the
     * app uses for the sacrifice curve). Bisection from a bracket bottom ten to twenty times below the
     * answer needs four or five solves to get back up; interpolation usually needs one.
     *
     * DORMANT by default: verifyPaths equals searchPaths above, so one sample runs throughout and this
     * never executes. If it is ever re-enabled, note that plain regula falsi can stall by replacing the
     * same endpoint over and over on a curved function; at three steps that cannot bite, but raising
     * verifySteps means switching to the Illinois modification (halve the retained endpoint's value
     * each time it survives a step) rather than adding steps to this loop.
     */
    let loL = rLo.lambda, loR = rLo.floorRate, good = rLo;
    let hiL = best.lambda, hiR = best.floorRate;
    for (; vSteps < (opts.verifySteps || 3); vSteps++) {
      const lgLo = Math.log(loL), lgHi = Math.log(hiL);
      if (!(lgHi > lgLo + 1e-9)) break;
      // where the straight line through the two verified points crosses the ask, then kept off the ends
      const t = loR > hiR + 1e-12 ? (confidence - hiR) / (loR - hiR) : 0.5;
      const lg = Math.min(lgHi - 0.05 * (lgHi - lgLo), Math.max(lgLo + 0.05 * (lgHi - lgLo),
        lgHi + Math.min(1, Math.max(0, t)) * (lgLo - lgHi)));
      const r = verify(at(Math.exp(lg)));
      if (r.floorRate >= confidence) { loL = r.lambda; loR = r.floorRate; good = r; if (r.floorRate - confidence <= tol) break; }
      else { hiL = r.lambda; hiR = r.floorRate; }
    }
    best = good;
  }
  return done(best, 'landed', vSteps);
}

function nearestIndex(g, s) {
  const loc = locateVec(g, s);
  return g.index(Math.min(g.np - 1, loc.p.i + (loc.p.w > 0.5 ? 1 : 0)), Math.min(g.ni - 1, loc.i.i + (loc.i.w > 0.5 ? 1 : 0)),
    Math.min(g.nt - 1, loc.t.i + (loc.t.w > 0.5 ? 1 : 0)), loc.ig, loc.ic);
}

/*
 * Solve the lump-sum choice as well, by solving both ways and keeping the better at the household's
 * own opening position. It is one decision taken once, so two solves answer it exactly and it does not
 * need a dimension of its own.
 */
export function solveBoth(E, M, plan, opts = {}) {
  const a = solve(E, M, plan, { ...opts, lump: false });
  if (opts.skipLump) return a;
  const b = solve(E, M, plan, { ...opts, lump: true });
  const at = a.value(M.initialState(a.m), 0), bt = b.value(M.initialState(b.m), 0);
  const eps = E.RATE_EPSILON_PTS / 100;
  const better = (bt.survival > at.survival + eps || (Math.abs(bt.survival - at.survival) <= eps && bt.bequest > at.bequest)) ? b : a;
  better.alternative = better === a ? b : a;
  return better;
}

/*
 * THE PRODUCT ENTRY POINT (PLAN.md finding M1, 23 Sep). `solve()` keeps the research engine's historical
 * defaults - resilience 0.5, the full level scan, no raises, no #106 fix - because fourteen test suites and
 * every recorded result are written against them. The app must never inherit those by omission, so it calls
 * this instead, which carries the baseline decided on 23 Sep and nothing else:
 *
 *   survival the anchor, no resilience term; the six-level menu down to the user's floor (raises to 1.2 unless
 *   capped or blocked); raise credit 0.003; the ternary level search; the chosen #106 read; the pension and
 *   ISA tiers when the user consents; the three-world mixture; 30 wealth points.
 *
 * The user's settings arrive as `opts`: `lambda` (dislike of cuts), `raiseCap`, `riskConsent` (default on),
 * and anything the caller must override for a test (`points`). Block trimming is the plan's floor set equal
 * to its target, which leaves the menu nothing below 1. The estate curve and the minimum-pot default join
 * after the maintainer's step-6 choices. Gate: identical, bit for bit, to `solveMixture` with the same options
 * written out (solver-plan.test.mjs).
 */
export const PRODUCT_BASELINE = Object.freeze({
  resilienceWeight: 0, raiseWeight: 0.003, levelSearch: 'ternary', shareDead: 'drop', finalExact: true, mix: 3, points: 30
});
/* The menu for a floor, as a fraction of target: raises to 1.2, then 1, 0.95, 0.9 and the floor itself, never below it. */
export function productLevels(floorFrac) {
  const f = floorFrac > 0 ? Math.min(1, floorFrac) : 1;
  const raw = [1.2, 1.1, 1, 0.95, 0.9, f].filter(l => l >= f - 1e-9);
  return [...new Set(raw.map(x => Math.round(x * 1e6) / 1e6))].sort((a, b) => b - a);
}
export function solvePlan(E, M, plan, opts = {}) {
  if (!(opts.lambda >= 0)) throw new Error('solvePlan needs the dislike-of-cuts setting as lambda');
  const m = M.prepare(E, plan);
  const { riskConsent, ...rest } = opts;
  const o = {
    ...PRODUCT_BASELINE, ...rest,
    spendLevels: productLevels(m.ctx.floorFrac || 0),
    lump: m.ctx.fullLumpSum,
    tiers: riskConsent === false ? undefined : true
  };
  return solveMixture(E, M, plan, o);
}
