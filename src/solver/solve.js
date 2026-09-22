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
  const tables = zs.map(z => solve(E, M, plan, { ...opts, shiftZ: z }));
  const r = tables[K === 3 ? 1 : 2];
  r.mix = { tables, weights: ws, nodes: zs };
  r.meta.mixture = K;
  r.meta.ms = tables.reduce((a, x) => a + x.meta.ms, 0);
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
  const menuLevels = raiseOn || !opts.spendLevels ? opts.spendLevels : opts.spendLevels.filter(l => l <= 1);
  const actions = (opts.actions || buildActions({ spendLevels: menuLevels, tiers: opts.tiers ? tierCombos(m, opts.tiers) : null })).map(a => ({ ...a, lump: !!opts.lump }));
  const c = F.compile(m, actions);
  // a tier change costs its round trip on the slice traded (see SWITCH_COST in fast.js); charged at decision time
  c.switchCost = opts.switchCost !== undefined ? opts.switchCost : (opts.tiers ? F.SWITCH_COST : 0);
  // ...and is made only when the table's gain from it is worth noticing (see chooseAction)
  const switchMargin = opts.switchMargin !== undefined ? opts.switchMargin : (opts.tiers ? SWITCH_MARGIN : 0);
  const T0 = m.ctx.totalYears;
  // the quadrature rates by year (the folded spread depends on the years left) for each move's tier
  // combination, shared between moves that hold the same tiers
  const byCombo = {};
  const nodeRealOfAt = [];
  for (let t = 0; t <= T0; t++) {
    const byK = {};
    nodeRealOfAt[t] = actions.map((a, ai) => { const k = `${c.acts[ai].tierPen}/${c.acts[ai].tierIsa}`; if (!byK[k]) byK[k] = NODES.map(z => realAt(c, z, new Float64Array(4), c.acts[ai], t)); byCombo[k] = true; return byK[k]; });
  }
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

  const surv = [], lsurv = [], resil = [], lresil = [], beq = [], pol = [], short = [];
  for (let t = 0; t <= T; t++) {
    surv[t] = new Float64Array(g.size); lsurv[t] = new Float64Array(g.size);
    resil[t] = new Float64Array(g.size); lresil[t] = new Float64Array(g.size);
    beq[t] = new Float64Array(g.size); pol[t] = new Uint8Array(g.size); short[t] = new Float64Array(g.size);
  }
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
  const base = new Float64Array(7), post = new Float64Array(7), grown = new Float64Array(7), rd = new Float64Array(4), cachedPost = new Float64Array(7);
  let evaluated = 0;
  const profT0 = PROF ? now() : 0;
  for (let t = T; t >= 0; t--) {
    const sNext = t < T ? lsurv[t + 1] : null;
    const bNext = t < T ? beq[t + 1] : null;
    const rNext = t < T ? lresil[t + 1] : null;
    const hNext = t < T ? short[t + 1] : null;
    const St = surv[t], Bt = beq[t], Rt = resil[t], Pt = pol[t], Ht = short[t];
    const spendYear = c.yr.spend[t] > 0;
    const nodeRealOf = nodeRealOfAt[t];
    for (let ic = 0; ic < g.pcls.length; ic++) {
      for (let ig = 0; ig < g.gain.length; ig++) {
        for (let it = 0; it < g.nt; it++) {
          for (let ii = 0; ii < g.ni; ii++) {
            for (let ip = 0; ip < g.np; ip++) {
              const idx = g.index(ip, ii, it, ig, ic);
              toVec(g, ip, ii, it, ig, ic, base);
              /*
               * Every move is tried at every cell. There is no certain-success shortcut: the plan's
               * bound assumed "no growth" was the worst case, and for an invested pot it is not - see
               * zeroGrowthNeed in grid.js for the measurement that retired it.
               */
              let bestScore = -Infinity, bestS = -1, bestB = -Infinity, bestR = 0, bestA = 0, bestH = 0, cachedFail = false;
              for (let ai = 0; ai < actions.length; ai++) {
                let fail;
                if (tierBase[ai] === ai) {
                  const tf = PROF ? now() : 0;
                  post.set(base);
                  const unmet = F.flow(c, t, ai, post);
                  evaluated++;
                  fail = unmet > 1 || c.last.preNmpaInsolvent;
                  cachedFail = fail; cachedPost.set(post);
                  if (PROF) { PROF.flow += now() - tf; PROF.flows++; }
                } else { post.set(cachedPost); fail = cachedFail; if (PROF) PROF.skipped++; }
                let s = 0, b = 0, rs = 0, h = 0;
                const thisShort = spendYear ? costOf(levelOf[ai]) : 0;
                if (!fail) {
                  const tn = PROF ? now() : 0;
                  const nr = nodeRealOf[ai];
                  for (let zi = 0; zi < 5; zi++) {
                    grown.set(post);
                    F.grow(c, t, grown, nr[zi]);
                    if (t === T) {
                      const total = grown[0] + grown[1] + grown[2];
                      const alive = !(floor > 0 && total < floor);
                      const net = Math.max(0, total - grown[0] * deathTax);
                      s += WEIGHTS[zi] * (alive ? 1 : 0);
                      rs += WEIGHTS[zi] * (alive ? (shortfall ? 1 - Math.min(1, Math.max(0, resilK - net) / resilK) : (net >= resilK ? 1 : 0)) : 0);
                      b += WEIGHTS[zi] * (alive ? Math.min(net, beqCap) : 0);
                    } else {
                      readValues(g, sNext, bNext, grown, rd, rNext, hNext);
                      s += WEIGHTS[zi] * rd[0];
                      b += WEIGHTS[zi] * rd[1];
                      rs += WEIGHTS[zi] * rd[2];
                      h += WEIGHTS[zi] * rd[3];
                    }
                  }
                  if (PROF) { PROF.nodes += now() - tn; PROF.nodeCalls++; }
                }
                h += thisShort;
                const score = s + wR * rs + wB * b - h;
                if (score > bestScore + eps || (Math.abs(score - bestScore) <= eps && b > bestB)) { bestScore = score; bestS = s; bestB = b; bestR = rs; bestH = h; bestA = ai; }
              }
              if (PROF) PROF.cells++;
              St[idx] = bestS; Bt[idx] = bestB; Rt[idx] = bestR; Pt[idx] = bestA; Ht[idx] = bestH;
            }
          }
        }
      }
    }
    toLogOdds(St, lsurv[t]);
    if (shortfall) lresil[t].set(Rt); else toLogOdds(Rt, lresil[t]);
  }

  const meta = { ms: Date.now() - t0, size: g.size, years: T + 1, actions: actions.length, evaluated, lump: !!opts.lump, points: g.mode === 'total' ? `total ${g.np} x ${g.ni} x ${g.nt}` : (g.np === g.ni && g.ni === g.nt ? g.np : `${g.np}/${g.ni}/${g.nt}`), coords: g.mode, wR, bequestWeight: wB * scale, resilienceAt: resilK, bequestCap: beqCap, resilience: shortfall ? 'shortfall' : 'indicator', lambda, raiseWeight: mu, spendLevels: [...new Set(levelOf)], tiers: Object.keys(byCombo).length > 1 ? Object.keys(byCombo) : null, switchCost: c.switchCost, switchMargin, solverVersion: SOLVER_VERSION };
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
    m, g, c, actions, surv, lsurv, resil, lresil, beq, short, pol, meta, M, eps, nodeReal, nodeRealOfAt, wB, wR, lambda, levelOf, shortExp, costOf, switchMargin,
    tieMargin: opts.tieMargin || 0,
    rich: null,   // a second solve at half the resolution, for Richardson extrapolation of the move scores
    /* The stored move for the nearest cell to a state; `chooseAction` is the better read. */
    policy(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); return actions[pol[Math.min(t, T)][nearestIndex(g, s)]]; },
    /* What the table says this position is worth, before anything is executed. */
    value(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); const loc = locateVec(g, s); const k = Math.min(t, T); const sv = interp(g, surv[k], loc, true), rs = interp(g, resil[k], loc, !shortfall), bq = interp(g, beq[k], loc, false); return { survival: sv, resilience: rs, bequest: bq, score: sv + wR * rs + wB * bq }; }
  };
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
  if (t >= T && !r.mix) return r.pol[T][nearestIndex(r.g, s)];
  if (t >= T) return r.mix.tables[Math.floor(r.mix.tables.length / 2)].pol[T][nearestIndex(r.g, s)];
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
function scoreMoves(r, s, t, SC, TX, BQ, held = null) {
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
    let sv = 0, bq = 0, rs = 0, h = spendYear ? r.costOf(levelOf[ai]) : 0;
    const nr = nodeRealOf[ai];
    for (let zi = 0; zi < 5; zi++) {
      grown.set(post);
      F.grow(c, t, grown, nr[zi]);
      readValues(g, lsurv[t + 1], beq[t + 1], grown, rd, lresil[t + 1], short[t + 1]);
      sv += WEIGHTS[zi] * rd[0];
      bq += WEIGHTS[zi] * rd[1];
      rs += WEIGHTS[zi] * rd[2];
      h += WEIGHTS[zi] * rd[3];
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
    r.mix.tables.forEach((tab, k) => { scoreMoves(tab, s, Math.min(t, r.m.ctx.totalYears - 1), S2, T2, B2, held); const w = r.mix.weights[k]; for (let ai = 0; ai < n; ai++) { if (S2[ai] === -Infinity || SC[ai] === -Infinity) SC[ai] = -Infinity; else SC[ai] += w * S2[ai]; BQ[ai] += w * B2[ai]; } });
  } else scoreMoves(r, s, Math.min(t, r.m.ctx.totalYears - 1), SC, TX, BQ, held);
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
  const s = vecOf(m, r.M.initialState(m));
  const real = new Float64Array(4);
  // the path's own long-run shift, drawn once (the engine keeps it after the yearly draws); nothing in fold mode
  const zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  // belowSum/aboveSum carry the level in the years it was under or over target, so the report can say how
  // DEEP a trim was and how big a raise, not only how often each happened
  let lifetimeTax = 0, spendYears = 0, atTarget = 0, aboveTarget = 0, belowSum = 0, aboveSum = 0, minLevel = 1, shortfall = 0, changes = 0, lastLevel = null, levelSum = 0, tierPenYears = 0, tierIsaYears = 0, tierChanges = 0, lastTier = null, switchPaid = 0;
  const held = { pen: 0, isa: 0 };   // the tiers held: the plan's until a move changes them
  for (let t = 0; t <= T; t++) {
    const ai = opts.stored ? pol[Math.min(t, T)][nearestIndex(g, s)] : chooseAction(r, s, t, held);
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
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, failYear: m.ctx.baseYear + t, failAge: m.ctx.ageSelf0 + t, preAccess: !!c.last.preNmpaInsolvent, terminalNet: 0, terminal: 0, lifetimeTax, action: actions[ai], spendYears, atTarget, aboveTarget, minLevel: 0, shortfall, changes, levelSum, fullyFunded: false, tierPenYears, tierIsaYears, tierChanges, switchPaid };
    F.grow(c, t, s, realAt(c, zs[t], real, c.acts[ai], t, zPath));
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
  const rateOn = (r, paths) => paths.filter(z => runPolicy(r, z).survived).length / paths.length;
  let solves = 0;
  const at = (lambda) => {
    const r = (opts.mix ? solveMixture : solve)(E, M, plan, { ...opts, spendLevels: levels, lambda });
    r.floorRate = rateOn(r, zsSearch); solves++; return r;
  };
  // the rate about to be promised, on the full draw the search set is a prefix of
  const verify = (r) => { if (r.searchFloorRate === undefined) { r.searchFloorRate = r.floorRate; r.floorRate = rateOn(r, zsAll); } return r; };
  const done = (r, landed, vSteps = 0) => {
    r.meta.landed = landed; r.meta.solves = solves; r.meta.confidence = confidence;
    r.meta.searchPaths = nSearch; r.meta.verifyPaths = nVerify; r.meta.verifySteps = vSteps;
    r.meta.solverVersion = SOLVER_VERSION;
    return r;
  };
  if (levels.length === 1) return done(verify(at(0)), 'no floor');
  if (!levels.some(l => l < 1)) return done(verify(at(0)), 'no floor');   // raises only: nothing to land
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
