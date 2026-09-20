/*
 * THE GRID: WHERE THE APPROXIMATIONS LIVE, SO THEY CAN BE MEASURED IN ONE PLACE.
 *
 * `model.js` computes a year exactly, and its gate holds it to the pound against the engine. Solving
 * needs something else: a finite set of positions to hold a value for, and a way to read a value at a
 * position that is not one of them. Every simplification the solver makes is here and nowhere else.
 *
 * FIVE DIMENSIONS, per person:
 *
 *   pen        the pension, on a log axis in years-of-spend
 *   isa        the ISA, likewise
 *   tax        the taxable side: the GIA and cash as ONE pot, likewise
 *   gainFrac   how much of the GIA is unrealised gain, in buckets
 *   pcls       how much of the tax-free cash allowance has been used, in buckets
 *
 * WHY CASH IS NOT A DIMENSION. Nothing in the engine moves money out of Cash Savings, so a merged pot
 * would silently assume money is invested that the engine has sitting still - measured at up to a
 * 51,000% difference in terminal wealth and a moved failure year in ten of 120 library runs. The sweep
 * in `model.js` step 7d fixes that by MAINTAINING the buffer in both directions, which makes cash a
 * function of the year alone (`cashAt`). With it on, the same round trip moves no failure year and
 * stays within 3.6% of terminal wealth. So the merge is not free: it is bought by a recommendation the
 * household can act on and the engine can execute. Solving assumes the sweep.
 *
 * WHY A LOG AXIS IN YEARS-OF-SPEND. Survival turns on how many years of spending a pot represents, not
 * on its pound value, and the interesting range spans three orders of magnitude. Twelve log-spaced
 * points from a tenth of a year to sixty carry that; twelve linear points would put eleven of them
 * above the region where the decision actually changes. Zero is its own point, because an empty pot is
 * a different thing from a nearly empty one.
 *
 * WHY SURVIVAL IS INTERPOLATED IN LOG-ODDS. The value has a cliff: a little more wealth turns a certain
 * failure into a certain success over a short stretch. Linear interpolation smears that cliff across a
 * whole cell and makes the solver think a doomed position is worth something. Log-odds keeps it sharp.
 * Bequest is interpolated linearly, because it has no cliff.
 */

const CLAMP = 1e-6;   // survival probabilities are held off 0 and 1 so the log-odds stay finite
const logit = (p) => { const q = p < CLAMP ? CLAMP : (p > 1 - CLAMP ? 1 - CLAMP : p); return Math.log(q / (1 - q)); };
const expit = (x) => 1 / (1 + Math.exp(-x));

/*
 * A log axis with a zero point. `points[0]` is 0; the rest run from `lo` to `hi` geometrically. Values
 * are located by their position in log space, which is what makes interpolation on it linear.
 */
function logAxis(n, lo, hi) {
  const pts = new Float64Array(n);
  pts[0] = 0;
  const k = n - 1;
  const lg = Math.log(lo), step = (Math.log(hi) - Math.log(lo)) / (k - 1);
  for (let i = 1; i < n; i++) pts[i] = Math.exp(lg + (i - 1) * step);
  return { pts, n, lo, hi, lg, step };
}

/* Where `v` sits on the axis: the lower index and the weight on the next one up. */
function locate(ax, v) {
  if (!(v > 0)) return { i: 0, w: 0 };
  if (v <= ax.pts[1]) return { i: 0, w: v / ax.pts[1] };       // linear between the zero point and the first
  if (v >= ax.hi) return { i: ax.n - 2, w: 1 };
  const f = 1 + (Math.log(v) - ax.lg) / ax.step;
  const i = Math.min(ax.n - 2, Math.max(1, Math.floor(f)));
  return { i, w: f - i };
}

/*
 * Build the grid for a household. `spend` is the plan's own living target, which sets the unit; `hi` is
 * how many years of spending the largest axis point represents, and is stretched to cover the opening
 * balances of a household that is already far above it.
 */
export function makeGrid(m, opts = {}) {
  const { E, ctx } = m;
  const n = opts.points || 12;
  const spend = Math.max(1000, E.spendTargetAtAge(ctx, ctx.ageSelf0));
  const open = { pen: 0, isa: 0, tax: 0 };
  ctx.accounts.forEach(a => {
    if (a.cat === 'pen') open.pen += a.balance;
    else if (a.cat === 'isa') open.isa += a.balance;
    else open.tax += a.balance;
  });
  // the top of each axis: generous, because a lucky path compounds far past where it started
  const top = (v) => Math.max(opts.hiYears || 60, (v / spend) * (opts.headroom || 6));
  const axes = {
    pen: logAxis(n, spend * 0.1, spend * top(open.pen)),
    isa: logAxis(n, spend * 0.1, spend * top(open.isa)),
    tax: logAxis(n, spend * 0.1, spend * top(open.tax))
  };
  const gain = opts.gainBuckets || [0.05, 0.25, 0.55];      // representative unrealised-gain fractions
  const pcls = opts.pclsBuckets || [0, 0.5, 1];             // fraction of the lump-sum allowance used
  const size = n * n * n * gain.length * pcls.length;
  const stride = { isa: n, tax: n * n, gain: n * n * n, pcls: n * n * n * gain.length };
  return {
    m, n, spend, axes, gain, pcls, size, stride, open,
    index: (ip, ii, it, ig, ic) => ip + ii * stride.isa + it * stride.tax + ig * stride.gain + ic * stride.pcls
  };
}

/* Nearest bucket, for the two dimensions that are not interpolated. */
const nearest = (arr, v) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < arr.length; i++) { const d = Math.abs(arr[i] - v); if (d < bd) { bd = d; best = i; } }
  return best;
};

/*
 * Turn a grid point into a state `model.step` can run. The taxable pot is split back into cash and the
 * GIA by `cashAt`, which is where the sweep left it, and the GIA's basis follows the gain bucket.
 */
export function toState(g, ip, ii, it, ig, ic, t) {
  const { m } = g;
  const o = m.ctx.owners[0];
  const tax = g.axes.tax.pts[it];
  const cash = Math.min(tax, m.E.num(cashAtOf(m, t, tax), 0));
  const gia = tax - cash;
  const pots = {};
  m.ctx.accounts.forEach(a => { pots[a.id] = 0; });
  pots[o.ids.pen] = g.axes.pen.pts[ip];
  pots[o.ids.isa] = g.axes.isa.pts[ii];
  pots[o.ids.other] = gia;
  pots[o.ids.cash] = cash;
  return {
    pots,
    basis: { self: gia * (1 - g.gain[ig]), part: 0 },
    cgtCarry: { self: 0, part: 0 },
    cumPcls: { self: g.pcls[ic] * m.P.lsa, part: 0 },
    lumpTaken: { self: g.pcls[ic] > 0, part: false }
  };
}

// indirection so this module does not import model.js and create a cycle
function cashAtOf(m, t, taxPot) {
  const buffer = (k) => m.E.spendTargetAtAge(m.ctx, m.ctx.ageSelf0 + k) * m.ctx.cashBufferYears;
  if (t <= 0) return Math.min(taxPot, buffer(0));
  const cashAcc = m.ctx.accounts.find(a => a.cat === 'cash');
  return Math.min(taxPot, buffer(t - 1) * (1 + (cashAcc ? cashAcc.real : 0)));
}

/* Where a model state sits on the grid: the three continuous locations plus the two buckets. */
export function locateState(g, st) {
  const o = g.m.ctx.owners[0];
  const gia = st.pots[o.ids.other] || 0;
  const tax = gia + (st.pots[o.ids.cash] || 0);
  const gf = gia > 0 ? Math.max(0, Math.min(1, (gia - (st.basis.self || 0)) / gia)) : 0;
  return {
    p: locate(g.axes.pen, st.pots[o.ids.pen] || 0),
    i: locate(g.axes.isa, st.pots[o.ids.isa] || 0),
    t: locate(g.axes.tax, tax),
    ig: nearest(g.gain, gf),
    ic: nearest(g.pcls, Math.min(1, (st.cumPcls.self || 0) / g.m.P.lsa))
  };
}

/*
 * Read a value at a position that is not a grid point: trilinear over the three pots, at the nearest
 * gain and lump-sum buckets. `survival` switches the interpolation into log-odds so the cliff between
 * making it and not survives the read.
 */
export function interp(g, arr, loc, survival) {
  const { p, i, t, ig, ic } = loc;
  let acc = 0;
  for (let dp = 0; dp < 2; dp++) {
    const wp = dp ? p.w : 1 - p.w; if (wp === 0) continue;
    for (let di = 0; di < 2; di++) {
      const wi = di ? i.w : 1 - i.w; if (wi === 0) continue;
      for (let dt = 0; dt < 2; dt++) {
        const wt = dt ? t.w : 1 - t.w; if (wt === 0) continue;
        const v = arr[g.index(p.i + dp, i.i + di, t.i + dt, ig, ic)];
        acc += wp * wi * wt * (survival ? logit(v) : v);
      }
    }
  }
  return survival ? expit(acc) : acc;
}

/*
 * THE TWO BOUNDS, which is most of what makes this affordable.
 *
 * Above a certain wealth the remaining years can be paid however the markets behave, so survival is 1
 * and there is nothing to solve. Below a certain wealth next year cannot be paid at all, so it is 0.
 * Both are cheap to find and between them lies the only region where the decision matters.
 *
 * `certainFloor` is the pessimistic one: every remaining year's spending, met with no growth at all and
 * taxed at the worst rate the ladder charges, less the guaranteed income that arrives whatever happens.
 * A position above it survives under any path this model can draw, which makes the claim safe rather
 * than merely usually true.
 */
export function certainSuccess(m, t) {
  const { E, ctx } = m;
  let need = 0;
  const worstRate = ctx.P.ladder[ctx.P.ladder.length - 1].rate;
  for (let k = t; k <= ctx.totalYears; k++) {
    const age = ctx.ageSelf0 + k;
    if (age < ctx.owners[0].retireAge) continue;
    const spend = E.spendTargetAtAge(ctx, age);
    let guaranteed = 0;
    if (age >= ctx.spa) guaranteed += ctx.owners[0].statePension;
    ctx.otherIncomes.forEach(inc => { if (age >= inc.startAge && age <= inc.endAge) guaranteed += inc.amount; });
    const net = Math.max(0, spend - E.calculateUKNetIncome(guaranteed, ctx.P));
    need += net / (1 - worstRate);            // as if every pound came from a fully taxed pension
  }
  ctx.oneOffCosts.forEach((amt, year) => { if (year >= ctx.baseYear + t) need += amt / (1 - worstRate); });
  return Math.max(need, ctx.solvencyFloor);
}
