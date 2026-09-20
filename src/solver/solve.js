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
const NODES = [-2.856970, -1.355626, 0, 1.355626, 2.856970];
const WEIGHTS = [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];

/*
 * The draw orders worth considering. The three pension steps keep their band order - drawing to the
 * basic-rate limit before filling the allowance is not a different strategy, it is the same one - and
 * cash sits directly before the GIA, because the grid holds them as one pot and the sweep decides the
 * split. Everything else varies.
 */
export function buildActions() {
  const PREFIX = [[], ['penPA'], ['penPA', 'penBasic'], ['penPA', 'penBasic', 'penAny']];
  const PEN = ['penPA', 'penBasic', 'penAny'];
  const out = [];
  for (let pi = 0; pi < PREFIX.length; pi++) {
    const prefix = PREFIX[pi];
    const rest = PEN.filter(x => !prefix.includes(x));
    for (const isaFirst of [false, true]) {
      const mid = isaFirst ? ['isa', 'cash', 'other'] : ['cash', 'other', 'isa'];
      const steps = [...prefix, ...mid, ...rest];
      for (const harvest of [null, 'pa', 'basic']) {
        out.push({
          steps, costSteps: steps,
          harvest: harvest !== null, harvestCeil: harvest || 'pa',
          sweepCash: true, lump: false, contrib: null,
          label: `${prefix.length ? prefix.join('+') + ' first, ' : ''}${isaFirst ? 'ISA' : 'taxable'} before ${isaFirst ? 'taxable' : 'ISA'}${harvest ? `, harvest to ${harvest === 'pa' ? 'the allowance' : 'the basic-rate limit'}` : ''}`
        });
      }
    }
  }
  return out;
}

/* The real rate of each pot (pension, ISA, GIA, cash) at a market draw z. */
function realAt(c, z, out) {
  for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + c.real[i]) + c.volEff[i] * z) - 1;
  return out;
}

/*
 * Solve one household. Returns the tables, the chosen move for every position and year, and a `policy`
 * function that reads the move for a state the engine is actually in - which is how Phase 3 will run it.
 */
export function solve(E, M, plan, opts = {}) {
  const t0 = Date.now();
  const m = M.prepare(E, plan);
  // one table per person; a couple needs two and a funding split, which is phase 5
  if (m.ctx.isCouple) throw new Error('the solver takes one person at a time; couples are phase 5');
  const g = makeGrid(m, opts);
  const actions = (opts.actions || buildActions()).map(a => ({ ...a, lump: !!opts.lump }));
  const c = F.compile(m, actions);
  const nodeReal = NODES.map(z => realAt(c, z, new Float64Array(4)));
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
   * THE RISK TERM, INDICATOR OR SHORTFALL (plan 2c.2). The default is the indicator P(net >= K). With
   * `resilience: 'shortfall'` it is 1 - E[min(1, max(0, K - net) / K)]: one when the household ends
   * with at least K, falling linearly to zero at nothing. Same range, same weight, but continuous in
   * wealth, so a table of it has no cliff to smear and no line to gamble at. Stored and read linearly.
   */
  const shortfall = opts.resilience === 'shortfall';
  g.linearResil = shortfall;

  const surv = [], lsurv = [], resil = [], lresil = [], beq = [], pol = [];
  for (let t = 0; t <= T; t++) {
    surv[t] = new Float64Array(g.size); lsurv[t] = new Float64Array(g.size);
    resil[t] = new Float64Array(g.size); lresil[t] = new Float64Array(g.size);
    beq[t] = new Float64Array(g.size); pol[t] = new Uint8Array(g.size);
  }

  const base = new Float64Array(6), post = new Float64Array(6), grown = new Float64Array(6), rd = new Float64Array(3);
  let evaluated = 0;
  for (let t = T; t >= 0; t--) {
    const sNext = t < T ? lsurv[t + 1] : null;
    const bNext = t < T ? beq[t + 1] : null;
    const rNext = t < T ? lresil[t + 1] : null;
    const St = surv[t], Bt = beq[t], Rt = resil[t], Pt = pol[t];
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
              let bestScore = -Infinity, bestS = -1, bestB = -Infinity, bestR = 0, bestA = 0;
              for (let ai = 0; ai < actions.length; ai++) {
                post.set(base);
                const unmet = F.flow(c, t, ai, post);
                evaluated++;
                let s = 0, b = 0, rs = 0;
                if (!(unmet > 1 || c.last.preNmpaInsolvent)) {
                  for (let zi = 0; zi < 5; zi++) {
                    grown.set(post);
                    F.grow(c, t, grown, nodeReal[zi]);
                    if (t === T) {
                      const total = grown[0] + grown[1] + grown[2];
                      const alive = !(floor > 0 && total < floor);
                      const net = Math.max(0, total - grown[0] * deathTax);
                      s += WEIGHTS[zi] * (alive ? 1 : 0);
                      rs += WEIGHTS[zi] * (alive ? (shortfall ? 1 - Math.min(1, Math.max(0, resilK - net) / resilK) : (net >= resilK ? 1 : 0)) : 0);
                      b += WEIGHTS[zi] * (alive ? Math.min(net, beqCap) : 0);
                    } else {
                      readValues(g, sNext, bNext, grown, rd, rNext);
                      s += WEIGHTS[zi] * rd[0];
                      b += WEIGHTS[zi] * rd[1];
                      rs += WEIGHTS[zi] * rd[2];
                    }
                  }
                }
                const score = s + wR * rs + wB * b;
                if (score > bestScore + eps || (Math.abs(score - bestScore) <= eps && b > bestB)) { bestScore = score; bestS = s; bestB = b; bestR = rs; bestA = ai; }
              }
              St[idx] = bestS; Bt[idx] = bestB; Rt[idx] = bestR; Pt[idx] = bestA;
            }
          }
        }
      }
    }
    toLogOdds(St, lsurv[t]);
    if (shortfall) lresil[t].set(Rt); else toLogOdds(Rt, lresil[t]);
  }

  const meta = { ms: Date.now() - t0, size: g.size, years: T + 1, actions: actions.length, evaluated, lump: !!opts.lump, points: g.np === g.ni && g.ni === g.nt ? g.np : `${g.np}/${g.ni}/${g.nt}`, wR, bequestWeight: wB * scale, resilienceAt: resilK, bequestCap: beqCap, resilience: shortfall ? 'shortfall' : 'indicator' };
  const r = {
    m, g, c, actions, surv, lsurv, resil, lresil, beq, pol, meta, M, eps, nodeReal, wB, wR,
    tieMargin: opts.tieMargin || 0,
    rich: null,   // a second solve at half the resolution, for Richardson extrapolation of the move scores
    /* The stored move for the nearest cell to a state; `chooseAction` is the better read. */
    policy(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); return actions[pol[Math.min(t, T)][nearestIndex(g, s)]]; },
    /* What the table says this position is worth, before anything is executed. */
    value(state, t) { const s = state instanceof Float64Array ? state : vecOf(m, state); const loc = locateVec(g, s); const k = Math.min(t, T); return { survival: interp(g, surv[k], loc, true), resilience: interp(g, resil[k], loc, !shortfall), bequest: interp(g, beq[k], loc, false) }; }
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
export function chooseAction(r, s, t) {
  const { actions } = r;
  const T = r.m.ctx.totalYears;
  if (t >= T) return r.pol[T][nearestIndex(r.g, s)];
  const eps = r.eps;
  const n = actions.length;
  const SC = r._sc || (r._sc = new Float64Array(n));
  const TX = r._tx || (r._tx = new Float64Array(n));
  const BQ = r._bq || (r._bq = new Float64Array(n));
  scoreMoves(r, s, t, SC, TX, BQ);
  /*
   * RICHARDSON EXTRAPOLATION. The table's optimism was measured to fall as 1/n in the grid points
   * (S070: +21, +16, +13, +9 at 12, 16, 20, 28). With a second solve at half the points, 2 x score(n)
   * - score(n/2) cancels the leading term of that error for every move at once, at the cost of one
   * more, cheaper, solve. Off unless `r.rich` is set.
   */
  if (r.rich) {
    const S2 = r._sc2 || (r._sc2 = new Float64Array(n));
    scoreMoves(r.rich, s, t, S2, r._tx2 || (r._tx2 = new Float64Array(n)), r._bq2 || (r._bq2 = new Float64Array(n)));
    for (let ai = 0; ai < n; ai++) SC[ai] = SC[ai] === -Infinity || S2[ai] === -Infinity ? -Infinity : 2 * SC[ai] - S2[ai];
  }
  let bestScore = -Infinity, bestB = -Infinity, best = 0;
  for (let ai = 0; ai < n; ai++) {
    const score = SC[ai];
    if (score > bestScore + eps || (Math.abs(score - bestScore) <= eps && BQ[ai] > bestB)) { bestScore = score; bestB = BQ[ai]; best = ai; }
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
function scoreMoves(r, s, t, SC, TX, BQ) {
  const { g, c, actions, lsurv, lresil, beq, nodeReal, wB, wR } = r;
  const post = r._post || (r._post = new Float64Array(6));
  const grown = r._grown || (r._grown = new Float64Array(6));
  const rd = r._rd || (r._rd = new Float64Array(3));
  for (let ai = 0; ai < actions.length; ai++) {
    post.set(s);
    const unmet = F.flow(c, t, ai, post);
    TX[ai] = c.last.taxPaid + c.last.cgtPaid;
    if (unmet > 1 || c.last.preNmpaInsolvent) { SC[ai] = -Infinity; BQ[ai] = 0; continue; }
    let sv = 0, bq = 0, rs = 0;
    for (let zi = 0; zi < 5; zi++) {
      grown.set(post);
      F.grow(c, t, grown, nodeReal[zi]);
      readValues(g, lsurv[t + 1], beq[t + 1], grown, rd, lresil[t + 1]);
      sv += WEIGHTS[zi] * rd[0];
      bq += WEIGHTS[zi] * rd[1];
      rs += WEIGHTS[zi] * rd[2];
    }
    SC[ai] = sv + wR * rs + wB * bq; BQ[ai] = bq;
  }
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
  let lifetimeTax = 0;
  for (let t = 0; t <= T; t++) {
    const ai = opts.stored ? pol[Math.min(t, T)][nearestIndex(g, s)] : chooseAction(r, s, t);
    const unmet = F.flow(c, t, ai, s);
    lifetimeTax += c.last.taxPaid + c.last.cgtPaid;
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, failYear: m.ctx.baseYear + t, failAge: m.ctx.ageSelf0 + t, preAccess: !!c.last.preNmpaInsolvent, terminalNet: 0, terminal: 0, lifetimeTax, action: actions[ai] };
    F.grow(c, t, s, realAt(c, zs[t], real));
  }
  const total = s[0] + s[1] + s[2];
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, failYear: m.ctx.baseYear + T, failAge: m.ctx.ageSelf0 + T, preAccess: false, terminalNet: 0, terminal: 0, lifetimeTax };
  return { survived: true, failYear: null, failAge: null, preAccess: false, terminalNet: Math.max(0, total - s[0] * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax };
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
