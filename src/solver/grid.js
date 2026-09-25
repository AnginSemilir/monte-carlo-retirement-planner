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
    /* Phase 6e arms 3 and 4. Both default off, so the shipped build is bit-identical to before. */
    gainInterp: !!opts.gainInterp, pclsStrict: !!opts.pclsStrict,
    /* #106: how a survival read treats a corner that is dead along a SHARE axis (see shareDeadAdjust) */
    shareDead: opts.shareDead === 'drop' || opts.shareDead === 'linear' ? opts.shareDead : null,
    /* F1, the cliff-aware read of a bridge year (see bridgeAdjust); set by `solve` when `bridgeRead` is on */
    bridge: null,
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
 * PHASE 6e ARM 4. The lump-sum-allowance axis, snapped so that bucket 0 is reachable ONLY by a state
 * that has taken nothing.
 *
 * `nearest` puts everything below a quarter of the allowance on bucket 0, and `toVec` derives the
 * lump-taken FLAG from the bucket (`out[5] = pcls[ic] > 0 ? 1 : 0`). So a household that has spent part
 * of its tax-free lump is valued as one that may still take the whole thing - an action it no longer
 * has. Measured on the clean 41: eight of them, using between 7.1% and 20.9% of the allowance, S172
 * having spent GBP 56,047 and read as having spent nothing.
 *
 * This keeps the flag honest by excluding bucket 0 from the search once anything has been taken. It is
 * not free: S374, at 7.1% of the allowance, then reads as 50% instead of 0%, so the FIGURE gets worse
 * for the eight while the FLAG gets right. Which of the two errors costs more is what the screen is for.
 */
const nearestPclsStrict = (arr, v) => {
  if (!(v > 0)) return 0;
  let best = 1, bd = Infinity;
  for (let i = 1; i < arr.length; i++) { const d = Math.abs(arr[i] - v); if (d < bd) { bd = d; best = i; } }
  return best;
};

/*
 * PHASE 6e ARM 3. Bracket a value on an ascending bucket list, for interpolating the gain axis instead
 * of snapping to it. Returns the lower index and the weight on the one above, clamped at both ends, so
 * a household beyond the top bucket reads as the top bucket and the axis stays flat there - this arm
 * removes the SNAPPING, not the ceiling. Arm 2 moves the ceiling; the two are measured separately on
 * purpose, because one is free and the other is not.
 */
const bracket = (arr, v) => {
  if (v <= arr[0]) return { i: 0, w: 0 };
  const n = arr.length;
  if (v >= arr[n - 1]) return { i: n - 2 < 0 ? 0 : n - 2, w: n > 1 ? 1 : 0 };
  let k = 0;
  while (k < n - 2 && v > arr[k + 1]) k++;
  const lo = arr[k], hi = arr[k + 1];
  return { i: k, w: hi > lo ? (v - lo) / (hi - lo) : 0 };
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
  const pf = Math.min(1, s[4] / g.m.P.lsa);
  const ic = g.pclsStrict ? nearestPclsStrict(g.pcls, pf) : nearest(g.pcls, pf);
  // when the gain axis is interpolated, `ig` is the LOWER bracket and `igw` the weight on the one above
  const gb = g.gainInterp ? bracket(g.gain, s[3]) : null;
  const ig = gb ? gb.i : nearest(g.gain, s[3]);
  const igw = gb ? gb.w : 0;
  if (g.mode === 'total') {
    const W = s[0] + s[1] + s[2], rest = W - s[0];
    return { p: locate(g.axes.W, W), i: locateLin(g.axes.a, W > 0 ? s[0] / W : 0), t: locateLin(g.axes.b, rest > 0 ? s[1] / rest : 0), ig, ic, igw };
  }
  return { p: locate(g.axes.pen, s[0]), i: locate(g.axes.isa, s[1]), t: locate(g.axes.tax, s[2]), ig, ic, igw };
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
const IDX = new Int32Array(16);   // 8 corners, or 16 when the gain axis is interpolated too (Phase 6e arm 3)
const W = new Float64Array(16);
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
export function readValues(g, lsArr, bArr, s, out, lrArr = null, shArr = null, yr = -1) {
  if (g.mode === 'total') {
    const W = s[0] + s[1] + s[2], rest = W - s[0];
    locInto(g.axes.W, W, 0); locLinInto(g.axes.a, W > 0 ? s[0] / W : 0, 2); locLinInto(g.axes.b, rest > 0 ? s[1] / rest : 0, 4);
  } else {
    locInto(g.axes.pen, s[0], 0); locInto(g.axes.isa, s[1], 2); locInto(g.axes.tax, s[2], 4);
  }
  const pf = Math.min(1, s[4] / g.m.P.lsa);
  const ic = g.pclsStrict ? nearestPclsStrict(g.pcls, pf) : nearest(g.pcls, pf);
  const gb = g.gainInterp ? bracket(g.gain, s[3]) : null;
  const ig = gb ? gb.i : nearest(g.gain, s[3]);
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
  /*
   * PHASE 6e ARM 3. With the gain axis interpolated, the same eight corners are read again one gain
   * bucket up and the two sets are blended. Sixteen reads instead of eight on this path, no extra cells.
   * `gw` is 0 at or below the bottom bucket and at or above the top, so the flat region above the top
   * bucket is untouched - removing the snap is not the same as removing the ceiling.
   */
  let NC = 8;
  if (gb) {
    const gw = gb.w;
    if (gw > 0) {
      const step = g.stride.gain;
      for (let k = 0; k < 8; k++) { IDX[k + 8] = IDX[k] + step; W[k + 8] = W[k] * gw; W[k] *= 1 - gw; }
      NC = 16;
    }
  }
  /*
   * THE BRIDGE READER (`bridgeRead: 'reader'`; src/solver/reader.js): in a retired bridge year, survival is
   * p x I[c] + I[R] - p from this position's own accessible money, c and R blended with the same corner weights, in
   * probability. It replaces F1 and the #106 options there (neither runs with it); every other year, and the bequest,
   * resilience and shortfall reads, are unchanged.
   */
  const RD = g.reader && yr >= 0 && g.reader.years[yr] ? g.reader.of.get(lsArr) : null;
  // F1 in a retired bridge year (yr is the year of the table read); otherwise the #106 options, if set
  const cap = !RD && g.bridge && yr >= 0 && g.bridge.need[yr] > 0 ? bridgeAdjust(g, lsArr, NC, s, yr) : null;
  const linearRead = !RD && cap === null && g.shareDead ? shareDeadAdjust(g, lsArr, NC) : false;
  let ls = 0, b = 0, lr = 0, sh = 0;
  if (lrArr && shArr) {
    // the flexible-spending read: survival, bequest, resilience and the expected future shortfall from target
    for (let k = 0; k < NC; k++) { const w = W[k]; if (w === 0) continue; const i = IDX[k]; ls += w * lsArr[i]; b += w * bArr[i]; lr += w * lrArr[i]; sh += w * shArr[i]; }
    out[2] = g.linearResil ? lr : expit(lr); out[3] = sh;
  } else if (lrArr) {
    for (let k = 0; k < NC; k++) { const w = W[k]; if (w === 0) continue; const i = IDX[k]; ls += w * lsArr[i]; b += w * bArr[i]; lr += w * lrArr[i]; }
    out[2] = g.linearResil ? lr : expit(lr);
  } else {
    for (let k = 0; k < NC; k++) { const w = W[k]; if (w === 0) continue; ls += w * lsArr[IDX[k]]; b += w * bArr[IDX[k]]; }
  }
  if (cap !== null && ls > cap) ls = cap;
  if (RD) {
    let cc = 0, rr = 0;
    for (let k = 0; k < NC; k++) { const w = W[k]; if (w === 0) continue; cc += w * RD.c[IDX[k]]; rr += w * RD.R[IDX[k]]; }
    const v = RD.chance(s[1] + s[2]) * cc + rr;
    out[0] = v < CLAMP ? CLAMP : (v > 1 - CLAMP ? 1 - CLAMP : v);
  } else if (linearRead) { let p = 0; for (let k = 0; k < NC; k++) { const w = W[k]; if (w !== 0) p += w * expit(lsArr[IDX[k]]); } out[0] = p; }
  else out[0] = expit(ls);
  out[1] = b;
  return out;
}

/*
 * #106, THE DEAD CORNER ON A SHARE AXIS (results-106-deadcorner.txt, results-phase-v.txt). Survival is
 * blended in log-odds, so a corner at true zero enters at the clamp, -13.8, and a quarter's weight on it
 * divides the odds by ~32. Along TOTAL WEALTH that sharpness is the point - it is the survival cliff. Along
 * a SHARE axis it is not a cliff the position is near: it is the all-pension node of a household short of
 * pension access, which cannot fund its bridge. Two treatments, both default off:
 *   'drop'   - within each total-wealth slice, a share-axis corner that is dead while another corner in the
 *              same slice is alive gets no weight, and the slice's weight goes to its live corners;
 *   'linear' - when the stencil holds such a pair, survival is blended in probability, not log-odds.
 * Operates on the corner weights in W before the reads, so every table read at that position agrees.
 * Returns true when the caller should blend survival linearly.
 */
const DEAD_LS = -11.5;   // log-odds of about 1e-5: a corner the backward pass found (all but) certain to fail
function shareDeadAdjust(g, lsArr, NC) {
  let mixed = false;
  for (let base = 0; base < NC; base += 8) {
    for (let dp = 0; dp < 2; dp++) {
      // the four corners of one total-wealth slice: k = dp + 2*di + 4*dt
      let wAlive = 0, wDead = 0;
      for (let q = 0; q < 4; q++) { const k = base + dp + 2 * q; const w = W[k]; if (w === 0) continue; if (lsArr[IDX[k]] <= DEAD_LS) wDead += w; else wAlive += w; }
      if (wDead > 0 && wAlive > 0) {
        mixed = true;
        if (g.shareDead === 'drop') {
          const f = (wAlive + wDead) / wAlive;
          for (let q = 0; q < 4; q++) { const k = base + dp + 2 * q; if (W[k] === 0) continue; if (lsArr[IDX[k]] <= DEAD_LS) W[k] = 0; else W[k] *= f; }
        }
      }
    }
  }
  return g.shareDead === 'linear' && mixed;
}
/*
 * F1, THE CLIFF-AWARE READ OF A BRIDGE YEAR (PLAN.md "S126's dead corner"; maintainer, 24 Sep).
 *
 * In a retired year before pension access only the ISA, the GIA and cash can pay, so along the pension share
 * survival falls off a cliff at a* = 1 - (the bridge's need at the floor) / W. The share axis has six nodes, the
 * all-pension one is dead in every bridge year, and a log-odds blend with a dead node puts the cliff where the clamp
 * says (about 0.83 for S126) rather than where the money says (0.95). #106's `drop` removed the dead node whatever
 * side of the cliff the position was on, so positions past a* read as alive (-0.30 on S126).
 *
 * F1 asks the position itself. If its accessible money does not cover the rest of the bridge at the floor, it is
 * truly short and the read stands. If it does, the dead share-corners are on the far side of a cliff it has not
 * reached: they get no weight (each wealth slice's weight goes to its live corners, as `drop`), and survival is capped
 * at the chance the accessible money itself lasts the bridge, Phi(ln(coverage) / (sigma x sqrt(years left))), so a
 * position just inside the cliff is not read as safe. Returns the cap in log-odds, or null when nothing applies.
 */
export function Phi(z) {   // the standard normal distribution function (Abramowitz and Stegun 26.2.17, error under 7.5e-8)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}
function bridgeAdjust(g, lsArr, NC, s, yr) {
  const B = g.bridge, need = B.need[yr];
  const acc = s[1] + s[2];                     // the ISA and the taxable pot with its cash: what can pay before access
  if (B.version === 2) return bridgeAdjust2(B, lsArr, NC, acc, yr);
  if (!(acc >= need)) return null;             // short of the bridge even at the floor: the dead read is the truth
  let dropped = false;
  for (let base = 0; base < NC; base += 8) {
    for (let dp = 0; dp < 2; dp++) {
      let wAlive = 0, wDead = 0;
      for (let q = 0; q < 4; q++) { const k = base + dp + 2 * q; const w = W[k]; if (w === 0) continue; if (lsArr[IDX[k]] <= DEAD_LS) wDead += w; else wAlive += w; }
      if (wDead > 0 && wAlive > 0) {
        dropped = true;
        const f = (wAlive + wDead) / wAlive;
        for (let q = 0; q < 4; q++) { const k = base + dp + 2 * q; if (W[k] === 0) continue; if (lsArr[IDX[k]] <= DEAD_LS) W[k] = 0; else W[k] *= f; }
      }
    }
  }
  if (!dropped) return null;
  const cash = Math.min(acc, B.cash[yr]);
  const sd = B.sigma * (acc > 0 ? (acc - cash) / acc : 0) * Math.sqrt(B.years[yr]);
  if (!(sd > 0)) return null;                  // nothing invested: covered means covered
  const p = Math.min(1 - CLAMP, Math.max(CLAMP, Phi(Math.log(acc / need) / sd)));
  return Math.log(p / (1 - p));
}
/*
 * F1 VERSION 2 (PLAN.md, the F1 write-up: why F1 missed what it missed; approved by the maintainer 24 Sep 12:42 UK). Three changes:
 *  1. Money arriving later in the bridge counts. The test is no longer "does the accessible money cover the whole
 *     bridge's need" but "does it cover every year up to access, with the deposits due by then": B.req[yr] is the
 *     accessible money needed now (the largest shortfall of cumulative need over cumulative inflows), which an
 *     inheritance inside the bridge lowers (S366 read dead without it: short on v1's test, so F1 stayed off; the
 *     bridge-6 variant looked just covered, so F1 acted, but its cap read low; S370's is inferred from inputs, never solved).
 *  2. The chance the money lasts has growth. Money spent evenly over the years left is invested for about half of them,
 *     so the cap is Phi((ln(acc / req) + mu * tau) / (sigma * sqrt(tau))) with tau = half the bridge years left and mu, sigma
 *     the accessible money's expected real return and spread (cash at its own rate). As built, F1's cap had neither
 *     and reproduced its low reads (share 0.95 57.7 against 57.4 read; results-f1-misses.txt).
 *  3. It acts when the money looks short too. A position short of the bridge is not certain to fail - its money may
 *     grow into the gap - so its dead corners (no accessible money at all) get no weight either, and the cap, now below
 *     one half, carries the risk (S360, short on v1's test, so F1 stayed off: read 4.3 against 44.1 simulated).
 * Version 1 is unchanged for comparison (bridgeRead: true or 1); version 2 is bridgeRead: 2.
 */
function bridgeAdjust2(B, lsArr, NC, acc, yr) {
  const req = B.req[yr];
  let dropped = false;
  for (let base = 0; base < NC; base += 8) {
    for (let dp = 0; dp < 2; dp++) {
      let wAlive = 0, wDead = 0;
      for (let q = 0; q < 4; q++) { const k = base + dp + 2 * q; const w = W[k]; if (w === 0) continue; if (lsArr[IDX[k]] <= DEAD_LS) wDead += w; else wAlive += w; }
      if (wDead > 0 && wAlive > 0) {
        dropped = true;
        const f = (wAlive + wDead) / wAlive;
        for (let q = 0; q < 4; q++) { const k = base + dp + 2 * q; if (W[k] === 0) continue; if (lsArr[IDX[k]] <= DEAD_LS) W[k] = 0; else W[k] *= f; }
      }
    }
  }
  if (!dropped) return null;
  const p = bridgeChanceV2(acc, req, B.cash[yr], B.years[yr], B.sigma, B.mu, B.cashReal);
  return p === null ? null : Math.log(p / (1 - p));
}
/* v2's chance the accessible money lasts to access, or null when the inflows due cover every year (nothing to cap) */
export function bridgeChanceV2(acc, req, cashBuffer, yearsLeft, sigma, mu, cashReal) {
  if (!(req > 0)) return null;
  if (!(acc > 0)) return CLAMP;
  const cash = Math.min(acc, cashBuffer), f = (acc - cash) / acc;
  const tau = yearsLeft / 2;                   // money spent evenly over the years left is invested for about half of them
  const m = f * mu + (1 - f) * cashReal, sd = sigma * f * Math.sqrt(tau);
  const z = sd > 0 ? (Math.log(acc / req) + m * tau) / sd : (acc * Math.exp(m * tau) >= req ? 40 : -40);
  return Math.min(1 - CLAMP, Math.max(CLAMP, Phi(z)));
}
/*
 * The per-year bridge table F1 reads: for each retired year before access, the need from that year to access at the
 * lowest spending level on the menu (the floor), net of guaranteed income, plus any one-off costs due in those years;
 * the bridge years left; the cash buffer; and the spread of the accessible investments (the ISA and GIA at the plan's
 * tiers, weighted by opening balance). Years that are working or past access carry no need, and F1 does nothing there.
 */
export function bridgeTable(E, m, c, floorLevel, version = 1) {
  const T = c.T, yr = c.yr;
  const need = new Float64Array(T + 2), years = new Float64Array(T + 2), cash = new Float64Array(T + 2);
  let accessAt = T + 1;
  for (let t = 0; t <= T; t++) if (yr.access[t]) { accessAt = t; break; }
  let run = 0, n = 0;
  const needY = new Float64Array(T + 2), inY = new Float64Array(T + 2);
  for (let t = Math.min(accessAt, T + 1) - 1; t >= 0; t--) {
    const guaranteed = yr.taxFree0[t] + (yr.taxable0[t] > 0 ? E.calculateUKNetIncome(yr.taxable0[t], c.P) : 0);
    needY[t] = Math.max(0, floorLevel * yr.spend[t] - guaranteed) + (yr.cost[t] || 0);
    run += needY[t];
    if (yr.spend[t] > 0) n += yr.frac[t];
    if (yr.spend[t] > 0) { need[t] = run; years[t] = n; }
    cash[t] = yr.buffer[t];
    // dated deposits into the accessible pots (ISA, taxable account, cash), less deductions from them: v2's req and the
    // reader read them; v1 never did, and its need, years, cash and sigma do not depend on them
    for (let i = 1; i <= 3; i++) inY[t] += (yr.dep[i][t] || 0) - (yr.ded[i][t] || 0);
  }
  const o = m.ctx.owners[0], isaA = m.acc[o.ids.isa], giaA = m.acc[o.ids.other];
  const bi = isaA ? isaA.balance : 0, bg = giaA ? giaA.balance : 0;
  const sigma = bi + bg > 0 ? (bi * c.volEff[1] + bg * c.volEff[2]) / (bi + bg) : 0;
  if (version !== 2) return { need, years, cash, sigma, accessAt, floorLevel, needY, inY };
  // v2: the accessible money needed now so every year to access is met, the inflows due by each year counted
  const req = new Float64Array(T + 2);
  for (let t = 0; t < Math.min(accessAt, T + 1); t++) {
    if (!(need[t] > 0)) continue;
    let cumNeed = 0, cumIn = 0, worst = -Infinity;
    for (let j = t; j < Math.min(accessAt, T + 1); j++) { cumNeed += needY[j]; cumIn += inY[j]; worst = Math.max(worst, cumNeed - cumIn); }
    req[t] = worst;
  }
  const mu = bi + bg > 0 ? (bi * c.real[1] + bg * c.real[2]) / (bi + bg) : 0;
  return { need, years, cash, sigma, accessAt, floorLevel, needY, inY, version: 2, req, mu, cashReal: c.cashReal || 0 };
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
  // Phase 6e arm 3: when the gain axis is interpolated, loc carries the weight on the bucket above
  const gw = g.gainInterp && loc.igw > 0 && ig + 1 < g.gain.length ? loc.igw : 0;
  let acc = 0;
  for (let dp = 0; dp < 2; dp++) {
    const wp = dp ? p.w : 1 - p.w; if (wp === 0) continue;
    for (let di = 0; di < 2; di++) {
      const wi = di ? i.w : 1 - i.w; if (wi === 0) continue;
      for (let dt = 0; dt < 2; dt++) {
        const wt = dt ? t.w : 1 - t.w; if (wt === 0) continue;
        const w3 = wp * wi * wt;
        const v = arr[g.index(p.i + dp, i.i + di, t.i + dt, ig, ic)];
        acc += w3 * (1 - gw) * (survival ? logit(v) : v);
        if (gw > 0) {
          const v2 = arr[g.index(p.i + dp, i.i + di, t.i + dt, ig + 1, ic)];
          acc += w3 * gw * (survival ? logit(v2) : v2);
        }
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
