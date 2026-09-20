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
 * short, and then, among moves that tie on that within the app's own epsilon, the expected bequest net
 * of the pension death charge. Both are carried through the table separately so a change of
 * prioritisation can re-combine them without re-solving.
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
 * SPEED. This version is built on `model.js`, which computes a year exactly and takes microseconds. It
 * is fast enough to answer the only question that matters first: is a state-dependent plan worth more
 * than the fixed rules the app already has? The allocation-free version comes after that answer, not
 * before it.
 */
import { makeGrid, toState, locateState, interp, certainSuccess } from './grid.js';

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
          steps,
          costSteps: steps,
          harvest: harvest !== null,
          harvestCeil: harvest || 'pa',
          sweepCash: true,
          lump: false,
          contrib: null,
          label: `${prefix.length ? prefix.join('+') + ' first, ' : ''}${isaFirst ? 'ISA' : 'taxable'} before ${isaFirst ? 'taxable' : 'ISA'}${harvest ? `, harvest to ${harvest === 'pa' ? 'the allowance' : 'the basic-rate limit'}` : ''}`
        });
      }
    }
  }
  return out;
}

/* The real rate each account earns at each quadrature node, worked out once. */
function ratesByNode(m) {
  return NODES.map(z => {
    const r = {};
    m.ctx.accounts.forEach(a => {
      // the per-path shock the solver cannot see is folded into the annual spread
      const vol = Math.sqrt(a.vol * a.vol + a.sigmaParam * a.sigmaParam);
      r[a.id] = Math.exp(Math.log(1 + a.real) + vol * z) - 1;
    });
    return r;
  });
}

/*
 * Solve one household. Returns the tables, the chosen move for every position and year, and a `policy`
 * function that reads the move for a state the engine is actually in - which is how Phase 3 will run it.
 */
export function solve(E, M, plan, opts = {}) {
  const t0 = Date.now();
  const m = M.prepare(E, plan);
  const g = makeGrid(m, opts);
  const actions = (opts.actions || buildActions()).map(a => ({ ...a, lump: !!opts.lump }));
  const rates = ratesByNode(m);
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

  const surv = [], beq = [], pol = [];
  for (let t = 0; t <= T; t++) { surv[t] = new Float64Array(g.size); beq[t] = new Float64Array(g.size); pol[t] = new Uint8Array(g.size); }

  // scratch, reused for every state so the loop allocates nothing it does not have to
  const post = { pots: {}, basis: { self: 0, part: 0 }, cgtCarry: { self: 0, part: 0 }, cumPcls: { self: 0, part: 0 }, lumpTaken: { self: false, part: false } };
  const copyInto = (dst, src) => {
    for (const k in src.pots) dst.pots[k] = src.pots[k];
    dst.basis.self = src.basis.self; dst.basis.part = src.basis.part;
    dst.cgtCarry.self = src.cgtCarry.self; dst.cgtCarry.part = src.cgtCarry.part;
    dst.cumPcls.self = src.cumPcls.self; dst.cumPcls.part = src.cumPcls.part;
    dst.lumpTaken.self = src.lumpTaken.self; dst.lumpTaken.part = src.lumpTaken.part;
  };

  let evaluated = 0, skipped = 0;
  for (let t = T; t >= 0; t--) {
    const sNext = t < T ? surv[t + 1] : null;
    const bNext = t < T ? beq[t + 1] : null;
    const St = surv[t], Bt = beq[t], Pt = pol[t];
    /*
     * Above this much total wealth the remaining years are payable however the markets behave - but
     * only once the pension can be reached. Before that, wealth locked in a pension cannot pay for
     * anything, and a household with a large pension and a thin bridge is at real risk however rich
     * the total looks. So the shortcut is switched off entirely until the access age.
     */
    const canShortcut = opts.shortcut !== false && (m.ctx.ageSelf0 + t) >= m.ctx.nmpa && (!m.ctx.isCouple || (m.ctx.agePart0 + t) >= m.ctx.nmpa);
    const sure = canShortcut ? certainSuccess(m, t) : Infinity;
    for (let ic = 0; ic < g.pcls.length; ic++) {
      for (let ig = 0; ig < g.gain.length; ig++) {
        for (let it = 0; it < g.n; it++) {
          for (let ii = 0; ii < g.n; ii++) {
            for (let ip = 0; ip < g.n; ip++) {
              const idx = g.index(ip, ii, it, ig, ic);
              const wealth = g.axes.pen.pts[ip] + g.axes.isa.pts[ii] + g.axes.tax.pts[it];
              const base = toState(g, ip, ii, it, ig, ic, t);
              /*
               * A position rich enough to pay every remaining year at the worst tax rate with no growth
               * at all survives under any path this model can draw. The move still has to be chosen -
               * the bequest depends on it - but only one sensible candidate is tried, which is where
               * most of the saving in a well-funded household comes from.
               */
              const list = wealth >= sure ? [actions[0]] : actions;
              if (list.length === 1) skipped++;
              let bestS = -1, bestB = -Infinity, bestA = 0;
              for (let ai = 0; ai < list.length; ai++) {
                copyInto(post, base);
                const row = M.step(m, post, list[ai], t, null, true);
                evaluated++;
                let s = 0, b = 0;
                if (row.unmetDemand > 1 || row.preNmpaInsolvent) { s = 0; b = 0; }
                else {
                  for (let zi = 0; zi < NODES.length; zi++) {
                    const grown = M.cloneState(post);
                    M.grow(m, grown, t, rates[zi]);
                    const o = m.ctx.owners[0];
                    const total = (grown.pots[o.ids.pen] || 0) + (grown.pots[o.ids.isa] || 0) + (grown.pots[o.ids.other] || 0) + (grown.pots[o.ids.cash] || 0);
                    if (t === T) {
                      const alive = !(floor > 0 && total < floor);
                      s += WEIGHTS[zi] * (alive ? 1 : 0);
                      b += WEIGHTS[zi] * (alive ? Math.max(0, total - (grown.pots[o.ids.pen] || 0) * deathTax) : 0);
                    } else {
                      const loc = locateState(g, grown);
                      s += WEIGHTS[zi] * interp(g, sNext, loc, true);
                      b += WEIGHTS[zi] * interp(g, bNext, loc, false);
                    }
                  }
                }
                // survival first; among moves that tie on it within the app's own epsilon, the bequest
                if (s > bestS + eps || (Math.abs(s - bestS) <= eps && b > bestB)) { bestS = s; bestB = b; bestA = ai === 0 && list !== actions ? 0 : ai; }
              }
              St[idx] = bestS; Bt[idx] = bestB; Pt[idx] = bestA;
            }
          }
        }
      }
    }
  }

  const meta = { ms: Date.now() - t0, size: g.size, years: T + 1, actions: actions.length, evaluated, skipped, lump: !!opts.lump, points: g.n };
  return {
    m, g, actions, surv, beq, pol, meta, M, eps,
    /* The move for a state the engine is actually in, which is how the bridge will read it. */
    policy(state, t) { return actions[pol[Math.min(t, T)][gIndexOf(g, state)]]; },
    /* What the table says this position is worth, before anything is executed. */
    value(state, t) { const loc = locateState(g, state); return { survival: interp(g, surv[Math.min(t, T)], loc, true), bequest: interp(g, beq[Math.min(t, T)], loc, false) }; }
  };
}

/* The nearest grid cell to a state, for reading a chosen move (which cannot be interpolated). */
function gIndexOf(g, state) {
  const loc = locateState(g, state);
  return g.index(loc.p.i + (loc.p.w > 0.5 ? 1 : 0), loc.i.i + (loc.i.w > 0.5 ? 1 : 0), loc.t.i + (loc.t.w > 0.5 ? 1 : 0), loc.ig, loc.ic);
}

/*
 * RUN THE SOLVED PLAN FORWARD, reading the move from the table each year.
 *
 * This, and not the table's own number, is what the solver is judged on. A value function built on a
 * coarse grid and read by interpolation can flatter itself; a simulation cannot, because it spends the
 * money. `zs` is the same per-year market draw the named policies see, so the comparison is like for
 * like on common random numbers.
 */
export function runPolicy(r, zs, opts = {}) {
  const { m, g, actions, pol } = r;
  const M = r.M;
  const T = m.ctx.totalYears;
  const state = M.initialState(m);
  const rates = {};
  let lifetimeTax = 0;
  for (let t = 0; t <= T; t++) {
    const action = opts.stored ? actions[pol[Math.min(t, T)][nearestIndex(g, state)]] : chooseAction(r, state, t);
    const z = zs[t];
    m.ctx.accounts.forEach(a => {
      const vol = Math.sqrt(a.vol * a.vol + a.sigmaParam * a.sigmaParam);
      rates[a.id] = Math.exp(Math.log(1 + a.real) + vol * z) - 1;
    });
    const row = M.step(m, state, action, t, rates);
    lifetimeTax += row.taxPaid + row.cgtPaid;
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, failYear: row.year, terminalNet: 0, lifetimeTax };
  }
  const o = m.ctx.owners[0];
  const total = m.ctx.owners.reduce((s, ow) => s + ['pen', 'isa', 'other', 'cash'].reduce((x, c) => x + (state.pots[ow.ids[c]] || 0), 0), 0);
  const pen = m.ctx.owners.reduce((s, ow) => s + (state.pots[ow.ids.pen] || 0), 0);
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, failYear: m.ctx.baseYear + T, terminalNet: 0, lifetimeTax };
  return { survived: true, failYear: null, terminalNet: Math.max(0, total - pen * m.ctx.pensionDeathTaxRate), lifetimeTax, unused: o };
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
export function chooseAction(r, state, t) {
  const { m, g, actions, surv, beq } = r;
  const M = r.M, E = m.E;
  const T = m.ctx.totalYears;
  if (t >= T) return actions[pol0(r, state, t)];
  const eps = r.eps !== undefined ? r.eps : 1e-12;
  const rates = r.nodeRates || (r.nodeRates = ratesByNode(m));
  let bestS = -1, bestB = -Infinity, best = actions[0];
  for (let ai = 0; ai < actions.length; ai++) {
    const post = M.cloneState(state);
    const row = M.step(m, post, actions[ai], t, null, true);
    let sv = 0, bq = 0;
    if (!(row.unmetDemand > 1 || row.preNmpaInsolvent)) {
      for (let zi = 0; zi < NODES.length; zi++) {
        const grown = M.cloneState(post);
        M.grow(m, grown, t, rates[zi]);
        const loc = locateState(g, grown);
        sv += WEIGHTS[zi] * interp(g, surv[t + 1], loc, true);
        bq += WEIGHTS[zi] * interp(g, beq[t + 1], loc, false);
      }
    }
    if (sv > bestS + eps || (Math.abs(sv - bestS) <= eps && bq > bestB)) { bestS = sv; bestB = bq; best = actions[ai]; }
  }
  return best;
}

const pol0 = (r, state, t) => r.pol[Math.min(t, r.m.ctx.totalYears)][nearestIndex(r.g, state)];

function nearestIndex(g, state) {
  const loc = locateState(g, state);
  return g.index(Math.min(g.n - 1, loc.p.i + (loc.p.w > 0.5 ? 1 : 0)), Math.min(g.n - 1, loc.i.i + (loc.i.w > 0.5 ? 1 : 0)),
    Math.min(g.n - 1, loc.t.i + (loc.t.w > 0.5 ? 1 : 0)), loc.ig, loc.ic);
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
