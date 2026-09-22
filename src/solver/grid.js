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

// survival probabilities are held off 0 and 1 so the log-odds stay finite; the clamp and the choice of
// log-odds against plain probability are overridable from the environment for the smear experiments
const CLAMP = process.env.SOLVER_CLAMP ? Number(process.env.SOLVER_CLAMP) : 1e-6;
const LINEAR = process.env.SOLVER_INTERP === 'linear';
const logit = LINEAR ? (p) => p : (p) => { const q = p < CLAMP ? CLAMP : (p > 1 - CLAMP ? 1 - CLAMP : p); return Math.log(q / (1 - q)); };
const expit = LINEAR ? (x) => x : (x) => 1 / (1 + Math.exp(-x));

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

/* A linear axis on [0, 1], for the wrapper shares in the total-wealth coordinates. */
function linAxis(n) {
  const pts = new Float64Array(n);
  for (let i = 0; i < n; i++) pts[i] = i / (n - 1);
  return { pts, n, linear: true };
}
function locateLin(ax, v) {
  const f = Math.max(0, Math.min(1, v)) * (ax.n - 1);
  const i = Math.min(ax.n - 2, Math.floor(f));
  return { i, w: f - i };
}

/* Where `v` sits on the axis: the lower index and the weight on the next one up. */
function locate(ax, v) {
  if (ax.linear) return locateLin(ax, v);
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
  // one count for every pot axis, or `{ pen, isa, tax }` so an axis the smear lives on can be denser than the others
  const pts = opts.points && typeof opts.points === 'object' ? opts.points : null;
  const np = (pts ? pts.pen : opts.points) || 12, ni = (pts ? pts.isa : opts.points) || 12, nt = (pts ? pts.tax : opts.points) || 12;
  const spend = Math.max(1000, E.spendTargetAtAge(ctx, ctx.ageSelf0));
  const open = { pen: 0, isa: 0, tax: 0 };
  ctx.accounts.forEach(a => {
    if (a.cat === 'pen') open.pen += a.balance;
    else if (a.cat === 'isa') open.isa += a.balance;
    else open.tax += a.balance;
  });
  // the top of each axis: generous, because a lucky path compounds far past where it started
  // `??`, not `||`: a headroom of 0 is a real choice (a fixed ceiling), and `||` silently read it as absent.
  const top = (v) => Math.max(opts.hiYears ?? 60, (v / spend) * (opts.headroom ?? 6));
  const axes = {
    pen: logAxis(np, spend * 0.1, spend * top(open.pen)),
    isa: logAxis(ni, spend * 0.1, spend * top(open.isa)),
    tax: logAxis(nt, spend * 0.1, spend * top(open.tax))
  };
  const gain = opts.gainBuckets || [0.05, 0.25, 0.55];      // representative unrealised-gain fractions
  const pcls = opts.pclsBuckets || [0, 0.5, 1];             // fraction of the lump-sum allowance used
  /*
   * TOTAL-WEALTH COORDINATES (`coords: 'total'`). The survival cliff runs along total wealth and is
   * smooth in how that wealth is split between wrappers, so the three pot axes spend most of their
   * points in directions the cliff does not run. These coordinates put one dense log axis on total
   * wealth in years-of-spend and two coarse linear axes on the shares: a = pension / total,
   * b = ISA / (total - pension). Forty points on the cliff and six on each share is 1,440 cells
   * against 8,000 at twenty points per pot. The six-slot vector and everything downstream are
   * unchanged; only where a position sits, and what a cell means, differ.
   */
  // The default since the 41-household re-run: every loss smaller, no win lost, six times faster.
  const total = (opts.coords || 'total') === 'total';
  const n1 = total ? ((pts && pts.total) || opts.points || 40) : np;
  const n2 = total ? ((pts && pts.share) || opts.shares || 6) : ni;
  const n3 = total ? ((pts && pts.share) || opts.shares || 6) : nt;
  if (total) {
    axes.W = logAxis(n1, spend * 0.1, spend * top(open.pen + open.isa + open.tax));
    axes.a = linAxis(n2);
    axes.b = linAxis(n3);
  }
  const size = n1 * n2 * n3 * gain.length * pcls.length;
  const stride = { isa: n1, tax: n1 * n2, gain: n1 * n2 * n3, pcls: n1 * n2 * n3 * gain.length };
  return {
    m, mode: total ? 'total' : 'pots', n: Math.max(n1, n2, n3), np: n1, ni: n2, nt: n3, spend, axes, gain, pcls, size, stride, open,
    index: (i1, i2, i3, ig, ic) => i1 + i2 * stride.isa + i3 * stride.tax + ig * stride.gain + ic * stride.pcls
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
  const v = toVec(g, ip, ii, it, ig, ic, new Float64Array(7));
  const tax = v[2];
  const cash = Math.min(tax, m.E.num(cashAtOf(m, t, tax), 0));
  const gia = tax - cash;
  const pots = {};
  m.ctx.accounts.forEach(a => { pots[a.id] = 0; });
  pots[o.ids.pen] = v[0];
  pots[o.ids.isa] = v[1];
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

/* The same cell as a six-slot vector for the fast flow: pen, isa, taxable, gain fraction, tax-free used, lump taken. */
export function toVec(g, ip, ii, it, ig, ic, out) {
  if (g.mode === 'total') {
    const W = g.axes.W.pts[ip], a = g.axes.a.pts[ii], b = g.axes.b.pts[it];
    const pen = a * W, rest = W - pen, isa = b * rest;
    out[0] = pen; out[1] = isa; out[2] = rest - isa;
  } else {
    out[0] = g.axes.pen.pts[ip]; out[1] = g.axes.isa.pts[ii]; out[2] = g.axes.tax.pts[it];
  }
  out[3] = g.gain[ig]; out[4] = g.pcls[ic] * g.m.P.lsa; out[5] = g.pcls[ic] > 0 ? 1 : 0;
  out[6] = -1;   // the sheltered part of the cash pot is not a grid dimension: a cell reads the year's typical value
  return out;
}

/* Where a six-slot vector sits on the grid. */
export function locateVec(g, s) {
  const ig = nearest(g.gain, s[3]), ic = nearest(g.pcls, Math.min(1, s[4] / g.m.P.lsa));
  if (g.mode === 'total') {
    const W = s[0] + s[1] + s[2], rest = W - s[0];
    return { p: locate(g.axes.W, W), i: locateLin(g.axes.a, W > 0 ? s[0] / W : 0), t: locateLin(g.axes.b, rest > 0 ? s[1] / rest : 0), ig, ic };
  }
  return { p: locate(g.axes.pen, s[0]), i: locate(g.axes.isa, s[1]), t: locate(g.axes.tax, s[2]), ig, ic };
}

/*
 * THE HOT READ: both tables at one position, nothing allocated.
 *
 * A solve reads the next year's tables five times per move per cell - at 20 points that is 450 million
 * reads - so the locator objects the general `interp` builds were most of the solve's time once the
 * flow was fast. This locates the three axes into a scratch array, forms the eight corner indices once,
 * and reads survival (from a table already in log-odds) and bequest (linear) from the same corners.
 * `out[0]` is survival, `out[1]` bequest.
 */
const LOC = new Float64Array(6);     // i, w for each of the three axes
const IDX = new Int32Array(8);
const W = new Float64Array(8);
function locInto(ax, v, k) {
  if (!(v > 0)) { LOC[k] = 0; LOC[k + 1] = 0; return; }
  if (v <= ax.pts[1]) { LOC[k] = 0; LOC[k + 1] = v / ax.pts[1]; return; }
  if (v >= ax.hi) { LOC[k] = ax.n - 2; LOC[k + 1] = 1; return; }
  const f = 1 + (Math.log(v) - ax.lg) / ax.step;
  const i = Math.min(ax.n - 2, Math.max(1, Math.floor(f)));
  LOC[k] = i; LOC[k + 1] = f - i;
}
function locLinInto(ax, v, k) {
  const f = (v <= 0 ? 0 : v >= 1 ? 1 : v) * (ax.n - 1);
  const i = Math.min(ax.n - 2, Math.floor(f));
  LOC[k] = i; LOC[k + 1] = f - i;
}
export function readValues(g, lsArr, bArr, s, out, lrArr = null, shArr = null) {
  if (g.mode === 'total') {
    const W = s[0] + s[1] + s[2], rest = W - s[0];
    locInto(g.axes.W, W, 0); locLinInto(g.axes.a, W > 0 ? s[0] / W : 0, 2); locLinInto(g.axes.b, rest > 0 ? s[1] / rest : 0, 4);
  } else {
    locInto(g.axes.pen, s[0], 0); locInto(g.axes.isa, s[1], 2); locInto(g.axes.tax, s[2], 4);
  }
  const ig = nearest(g.gain, s[3]), ic = nearest(g.pcls, Math.min(1, s[4] / g.m.P.lsa));
  const n = g.stride.isa, nn = g.stride.tax;
  const i0 = LOC[0] + LOC[2] * n + LOC[4] * nn + ig * g.stride.gain + ic * g.stride.pcls;
  const wp1 = LOC[1], wi1 = LOC[3], wt1 = LOC[5], wp0 = 1 - wp1, wi0 = 1 - wi1, wt0 = 1 - wt1;
  IDX[0] = i0;           W[0] = wp0 * wi0 * wt0;
  IDX[1] = i0 + 1;       W[1] = wp1 * wi0 * wt0;
  IDX[2] = i0 + n;       W[2] = wp0 * wi1 * wt0;
  IDX[3] = i0 + n + 1;   W[3] = wp1 * wi1 * wt0;
  IDX[4] = i0 + nn;      W[4] = wp0 * wi0 * wt1;
  IDX[5] = i0 + nn + 1;  W[5] = wp1 * wi0 * wt1;
  IDX[6] = i0 + nn + n;  W[6] = wp0 * wi1 * wt1;
  IDX[7] = i0 + nn + n + 1; W[7] = wp1 * wi1 * wt1;
  let ls = 0, b = 0, lr = 0, sh = 0;
  if (lrArr && shArr) {
    // the flexible-spending read: survival, bequest, resilience and the expected future shortfall from target
    for (let k = 0; k < 8; k++) { const w = W[k]; if (w === 0) continue; const i = IDX[k]; ls += w * lsArr[i]; b += w * bArr[i]; lr += w * lrArr[i]; sh += w * shArr[i]; }
    out[2] = g.linearResil ? lr : expit(lr); out[3] = sh;
  } else if (lrArr) {
    for (let k = 0; k < 8; k++) { const w = W[k]; if (w === 0) continue; const i = IDX[k]; ls += w * lsArr[i]; b += w * bArr[i]; lr += w * lrArr[i]; }
    out[2] = g.linearResil ? lr : expit(lr);
  } else {
    for (let k = 0; k < 8; k++) { const w = W[k]; if (w === 0) continue; ls += w * lsArr[IDX[k]]; b += w * bArr[IDX[k]]; }
  }
  out[0] = expit(ls); out[1] = b;
  return out;
}
/* Survival stored as log-odds, once per year, so a read costs eight multiplies instead of eight logs. */
export function toLogOdds(sArr, out) { for (let i = 0; i < sArr.length; i++) out[i] = logit(sArr[i]); return out; }

/* A model state as the vector: what the solver reads the household's real position through. */
export function vecOf(m, st) {
  const o = m.ctx.owners[0];
  const gia = st.pots[o.ids.other] || 0;
  const gf = gia > 0 ? Math.max(0, Math.min(1, (gia - (st.basis.self || 0)) / gia)) : 0;
  const base = [st.pots[o.ids.pen] || 0, st.pots[o.ids.isa] || 0, gia + (st.pots[o.ids.cash] || 0), gf, st.cumPcls.self || 0, st.lumpTaken.self ? 1 : 0, st.cashIsa ? (st.cashIsa.self || 0) : 0];
  // a state that carries the guardrails' memory hands it to the forward run in four more slots
  if (st.guard && m.ctx.guardrails) base.push(st.guard.rate0 === null ? -1 : st.guard.rate0, st.guard.mult, st.guard.lostLastYear ? 1 : 0, st.guard.lastBaseDraw);
  return Float64Array.from(base);
}

/* Where a model state sits on the grid: the three continuous locations plus the two buckets. */
export function locateState(g, st) { return locateVec(g, vecOf(g.m, st)); }

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
 * THE ZERO-GROWTH NEED, and why it is NOT a certain-success bound.
 *
 * The plan meant to skip every position rich enough to pay every remaining year with no growth at all
 * and the worst tax rate on every pound, on the reasoning that such a position survives whatever the
 * markets do. That reasoning is wrong for an invested portfolio: "no growth" is not the worst case,
 * because returns can be negative, and five bad years in a row at the worst quadrature node take more
 * than half of a pot held at the High Risk tier. Measured on a full solve with the shortcut off: of
 * 161,946 cells above this line, 8,645 read below 0.999 and the lowest read 0.864. Writing 1 there would
 * have been a fourteen-point error that propagated backwards.
 *
 * So there is no certain-success shortcut, and this figure is kept only so the test can keep proving
 * that there must not be one. The saving the plan expected from it comes from the reachable band and
 * the fast flow instead. (A certain-FAILURE check is sound, because the year's spending is drawn before
 * the year's growth, and the model already applies it inside every step.)
 */
export function zeroGrowthNeed(m, t) {
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
    need += net / (1 - worstRate);
  }
  ctx.oneOffCosts.forEach((amt, year) => { if (year >= ctx.baseYear + t) need += amt / (1 - worstRate); });
  return Math.max(need, ctx.solvencyFloor);
}
