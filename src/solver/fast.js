/*
 * THE FAST FLOW: ONE PERSON'S YEAR WITH NOTHING ALLOCATED AND NOTHING LOOKED UP TWICE.
 *
 * `model.js` computes a year exactly and is held to the engine to the pound. It is also 4.3µs a call,
 * because it is written for clarity: pots in a map, calendars in Maps, the tax functions rebuilt from
 * parameters on every call, a state cloned for every quadrature node. A solve makes tens of millions
 * of calls, and at 20 grid points the exact model takes eleven minutes a household. This is the same
 * year written for the solver, and it is held to `model.js` the way `model.js` is held to the engine.
 *
 * WHAT IS PRECOMPUTED, once per household in `compile`:
 *   - everything that depends on the year alone: the year fraction, whether the person is working or
 *     can reach the pension, the living target, the state pension and other income (and the tax they
 *     already carry), the one-off cost, every dated deposit and deduction by pot, the scheduled
 *     contributions by pot, and the cash buffer the sweep maintains;
 *   - the net-income function as a table. UK income tax is straight lines with corners, and the engine
 *     already names the corners (`taxBreakpoints`), so net-of-gross is stored as segments and read by
 *     one comparison per corner. The pension draw for a net need is then inverted segment by segment
 *     rather than searched;
 *   - each move's step list as small integers.
 *
 * WHAT IS THE SAME AS `model.js`, and asserted so by `solver-fast.test.mjs`: the order of the year,
 * every tax figure, the GIA basis and its pro-rata disposal, the PCLS cap, CGT and its settlement, and
 * the sweep. Single owner only; couples are phase 5.
 *
 * THE STATE is six numbers in a Float64Array: pension, ISA, taxable pot (GIA and cash together, split
 * by the sweep's rule), the GIA's unrealised-gain fraction, the tax-free cash used so far, and whether
 * the whole lump sum has been taken. Gains carried into next year's CGT tally are the one thing the
 * grid does not hold, so they are computed within the year and dropped, exactly as `toState` does.
 */

export const STEP = { penPA: 0, penBasic: 1, penAny: 2, cash: 3, other: 4, isa: 5 };
const CATS = ['pen', 'isa', 'other', 'cash'];

/* Net income of a gross figure, as segments between the engine's own breakpoints. */
function netTable(E, P) {
  const bps = [0, ...E.taxBreakpoints(P)];
  const top = Math.max(bps[bps.length - 1] * 2, 1e6);
  const xs = [...bps, top, top * 8];
  const ys = xs.map(x => E.calculateUKNetIncome(x, P));
  const n = xs.length;
  const slope = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i++) slope[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  return { xs: Float64Array.from(xs), ys: Float64Array.from(ys), slope, n };
}
function netOf(tb, g) {
  if (g <= 0) return 0;
  let i = 0;
  while (i < tb.n - 2 && g > tb.xs[i + 1]) i++;
  return tb.ys[i] + (g - tb.xs[i]) * tb.slope[i];
}
function taxOf(tb, g) { return g <= 0 ? 0 : g - netOf(tb, g); }

/*
 * Compile a household. `m` is `model.prepare`'s result, so the fast flow and the exact one read the
 * same context; `actions` are the solver's moves.
 */
export function compile(m, actions) {
  const { E, ctx, P } = m;
  if (ctx.isCouple) throw new Error('the fast flow takes one person; couples are phase 5');
  const o = ctx.owners[0];
  const T = ctx.totalYears;
  const acc = ctx.acc;
  const idOf = { pen: o.ids.pen, isa: o.ids.isa, other: o.ids.other, cash: o.ids.cash };
  const catOfId = {}; CATS.forEach(c => { catOfId[idOf[c]] = c; });

  const yr = {
    frac: new Float64Array(T + 1), working: new Uint8Array(T + 1), access: new Uint8Array(T + 1),
    spend: new Float64Array(T + 1), taxable0: new Float64Array(T + 1), taxFree0: new Float64Array(T + 1),
    cost: new Float64Array(T + 1), buffer: new Float64Array(T + 1),
    // by pot, in CATS order: dated deposits, deductions, scheduled contributions (full-year, before frac)
    dep: CATS.map(() => new Float64Array(T + 1)), ded: CATS.map(() => new Float64Array(T + 1)), con: CATS.map(() => new Float64Array(T + 1)),
    // staged transfers out of the GIA into a pot, by target pot
    drip: CATS.map(() => new Float64Array(T + 1)),
    cgtExempt: new Float64Array(T + 1),
    // the cash ISA cap for the owner's age in the year, and the typical sheltered cash a grid cell assumes
    cashIsaCap: new Float64Array(T + 1), cashIsaTypical: new Float64Array(T + 1),
    // the full-year scheduled spend, which the guardrails measure the draw against
    scheduled: new Float64Array(T + 1)
  };
  for (let t = 0; t <= T; t++) {
    const age = ctx.ageSelf0 + t, year = ctx.baseYear + t;
    yr.frac[t] = t === 0 ? ctx.yf : 1;
    yr.working[t] = age < o.retireAge ? 1 : 0;
    yr.access[t] = age >= ctx.nmpa ? 1 : 0;
    yr.scheduled[t] = yr.working[t] ? 0 : E.spendTargetAtAge(ctx, age);
    yr.spend[t] = yr.scheduled[t] * yr.frac[t];
    let taxable = 0, taxFree = 0;
    ctx.otherIncomes.forEach(inc => { if (age >= inc.startAge && age <= inc.endAge) { if (inc.taxFree) taxFree += inc.amount * yr.frac[t]; else taxable += inc.amount * yr.frac[t]; } });
    if (age >= ctx.spa) taxable += o.statePension * yr.frac[t];
    yr.taxable0[t] = taxable; yr.taxFree0[t] = taxFree;
    yr.cost[t] = ctx.oneOffCosts.get(year) || 0;
    yr.buffer[t] = E.spendTargetAtAge(ctx, age) * ctx.cashBufferYears;
    (ctx.oneOffContribs.get(year) || []).forEach(x => { const c = catOfId[x.id]; if (c) yr.dep[CATS.indexOf(c)][t] += x.amount; });
    (ctx.oneOffDeductions.get(year) || []).forEach(x => { const c = catOfId[x.id]; if (c) yr.ded[CATS.indexOf(c)][t] += x.amount; });
    (ctx.stagedTransfers.get(year) || []).forEach(x => { const c = catOfId[x.toId]; if (c && x.fromId === idOf.other) yr.drip[CATS.indexOf(c)][t] += x.amount; });
    if (yr.working[t]) CATS.forEach((c, i) => { const a = acc[idOf[c]]; if (a) yr.con[i][t] = E.contribAtYear(a, t); });
    yr.cgtExempt[t] = Math.max(0, P.cgtAnnualExempt - (t === 0 ? o.cgtGainsUsed : 0));
    yr.cashIsaCap[t] = P.cashIsaCapAt(age, year);
  }
  const cashAcc = acc[idOf.cash];
  const cashReal = cashAcc ? cashAcc.real : 0;
  // the nominal rate the year's savings interest is taxed on; zero when the tax is off
  const cashNominal = cashAcc && P.cashInterestTaxed ? (1 + cashAcc.real) * (1 + ctx.inflation) - 1 : 0;
  /*
   * What a grid cell assumes about the sheltered cash. The sweep holds cash at the buffer, and the
   * leftover allowance shelters up to the cap a year, so from the opening sheltered amount the typical
   * path reaches "all of the buffer" within a few years. A cell has no memory of the true figure; the
   * forward run carries it exactly in the seventh slot.
   */
  {
    let sheltered = Math.min(o.cashIsa0 || 0, cashAcc ? cashAcc.balance : 0);
    for (let t = 0; t <= T; t++) {
      const cashHere = t === 0 ? (cashAcc ? cashAcc.balance : 0) : yr.buffer[t - 1] * (1 + cashReal);
      const scheduledIsa = yr.working[t] ? yr.con[1][t] * yr.frac[t] : 0;
      sheltered = Math.min(cashHere, sheltered + Math.min(yr.cashIsaCap[t], Math.max(0, P.isaAllowance - scheduledIsa)));
      yr.cashIsaTypical[t] = sheltered;
      sheltered = Math.min(yr.buffer[t], sheltered) * (1 + cashReal);
    }
  }
  const tb = netTable(E, P);
  const acts = actions.map(a => ({
    steps: Int8Array.from(a.steps.map(s => STEP[s])),
    costSteps: Int8Array.from((a.costSteps || a.steps).map(s => STEP[s])),
    harvest: a.harvest ? 1 : 0, harvestCeil: a.harvestCeil === 'basic' ? P.higherRateStartsAt : P.pa,
    lump: a.lump ? 1 : 0, sweep: a.sweepCash === false ? 0 : 1,
    // flexible spending (Part D): the year's spend as a fraction of the plan's target, 1 for the plan as written
    level: a.spendLevel !== undefined ? a.spendLevel : 1
  }));
  return {
    E, m, ctx, P, o, T, yr, tb, acts, cashReal, cashNominal, cashIsaContrib: o.cashIsaContrib || 0,
    // the guardrails, applied only on a forward run whose state vector carries their memory (slots 7 to 10)
    guard: ctx.guardrails || null, floorFrac: ctx.floorFrac || 0, inflation: ctx.inflation,
    real: CATS.map(c => (acc[idOf[c]] ? acc[idOf[c]].real : 0)),
    // the annual spread per pot with the per-path shock folded in, for a solver that has no path memory
    volEff: CATS.map(c => { const a = acc[idOf[c]]; return a ? Math.sqrt(a.vol * a.vol + a.sigmaParam * a.sigmaParam) : 0; })
  };
}

const GK = Object.freeze({ kind: 'gk' });

/* An eleven-slot state for a forward run under a spending rule: the seven the plan carries plus the rule's memory. */
export function withRuleSlots(s) {
  if (s.length > 10) return s;
  const out = new Float64Array(11); out.set(s); if (s.length < 7) out[6] = -1;
  out[7] = -1; out[8] = 1; out[9] = 0; out[10] = 0;
  return out;
}

/* ARVA's real rate for a household: the geometric expected real return of its opening pots, never below zero. */
export function arvaRate(c, s) {
  const w = [s[0], s[1], s[2], 0]; const tot = w[0] + w[1] + w[2];
  if (tot <= 0) return 0;
  let g = 0; for (let i = 0; i < 3; i++) g += (w[i] / tot) * (Math.log(1 + c.real[i]) - 0.5 * c.volEff[i] * c.volEff[i]);
  return Math.max(0, Math.exp(g) - 1);
}

/* Where cash sits at the start of year t, given the merged taxable pot: the sweep's rule. */
export function cashSplit(c, t, tax) {
  if (t <= 0) return Math.min(tax, c.yr.buffer[0]);
  return Math.min(tax, c.yr.buffer[t - 1] * (1 + c.cashReal));
}

/*
 * ONE YEAR. `s` is the six-slot state, mutated in place. Returns unmet demand (failure when above £1),
 * and leaves the taxes paid in `c.last` for callers that want them. No growth here: the solver applies
 * that per quadrature node from the post-decision state, and `grow` below does it.
 */
export function flow(c, t, ai, s) {
  const { P, tb, yr } = c;
  const a = c.acts[ai];
  const frac = yr.frac[t];
  const working = yr.working[t] === 1, access = yr.access[t] === 1;
  const retired = !working;

  let pen = s[0], isa = s[1];
  let tax = s[2];
  let cash = cashSplit(c, t, tax);
  let gia = tax - cash;
  let gainFrac = s[3];
  let cumPcls = s[4];
  let lumpTaken = s[5] > 0.5;
  let basis = gia * (1 - gainFrac);
  // the sheltered part of the cash: carried in the seventh slot by a forward run, the year's typical value for a
  // grid cell (-1), and none at all for a six-slot vector built by hand, which is what the model assumes too
  let cashIsa = s.length > 6 ? Math.min(cash, s[6] >= 0 ? s[6] : yr.cashIsaTypical[t]) : 0;
  let realised = 0;                  // gains booked this year (the grid carries none in)
  let taxable = yr.taxable0[t];
  let taxPaid = 0, cgtPaid = 0, unmet = 0, drawdown = 0, harvested = 0;
  const cgtOn = P.cgtEnabled;

  const sellGia = (amt) => {
    const sold = Math.min(gia, Math.max(0, amt));
    if (sold <= 0) return 0;
    if (cgtOn && gia > 0) { const gain = sold * (Math.max(0, gia - basis) / gia); basis = Math.max(0, basis - (sold - gain)); realised += gain; }
    gia -= sold;
    return sold;
  };
  const addGia = (amt) => { if (amt > 0) { gia += amt; if (cgtOn) basis += amt; } };

  // 0. deductions, 1. deposits, 1.5 drips
  for (let i = 0; i < 4; i++) {
    const d = yr.ded[i][t]; if (d > 0) {
      if (i === 0) { const take = Math.min(pen, d); pen -= take; unmet += d - take; }
      else if (i === 1) { const take = Math.min(isa, d); isa -= take; unmet += d - take; }
      else if (i === 2) { const take = sellGia(d); unmet += d - take; }
      else { const take = Math.min(cash, d); cash -= take; unmet += d - take; }
    }
    const p = yr.dep[i][t]; if (p > 0) { if (i === 0) pen += p; else if (i === 1) isa += p; else if (i === 2) addGia(p); else cash += p; }
    const dr = yr.drip[i][t]; if (dr > 0) { const mv = sellGia(dr); if (i === 0) pen += mv; else if (i === 1) isa += mv; else if (i === 2) addGia(mv); else cash += mv; }
  }
  // 2. contributions while working
  let isaContrib = 0, cashIsaSubscribed = 0;
  if (working) {
    const cp = yr.con[0][t] * frac, ci = yr.con[1][t] * frac, co = yr.con[2][t] * frac, cc = yr.con[3][t] * frac;
    pen += cp; isa += ci; isaContrib += ci; addGia(co); cash += cc;
    // 2a. the cash ISA subscription out of the cash paid in (the wrapper's own contribution is folded into cc)
    if (c.cashIsaContrib > 0) {
      const room = Math.min(yr.cashIsaCap[t], Math.max(0, P.isaAllowance - isaContrib));
      const sub = Math.min(c.cashIsaContrib * frac, room, Math.max(0, cash - cashIsa));
      if (sub > 0) { cashIsa += sub; isaContrib += sub; cashIsaSubscribed += sub; }
    }
  }
  // 3. the whole lump sum on first access
  if (a.lump && !lumpTaken && access && retired && pen > 0) {
    const pcls = Math.min(pen * P.pclsProp, Math.max(0, P.lsa - cumPcls));
    pen -= pcls; cash += pcls; cumPcls += pcls; lumpTaken = true;
  }
  // 4. guaranteed income, less the tax on this year's savings interest (taxable cash only) and GIA dividends (engine 4a, 4b)
  const interest = c.cashNominal > 0 && cash > cashIsa ? (cash - cashIsa) * c.cashNominal * frac : 0;
  const savingsTax = interest > 0 ? P.savingsTax(taxable, interest) : 0;
  const dividendTax = P.giaDividendYield > 0 && gia > 0 ? P.dividendTax(taxable, interest, gia * P.giaDividendYield * frac) : 0;
  const netGuaranteed = yr.taxFree0[t] + netOf(tb, taxable) - savingsTax - dividendTax;

  /* Draw `need` net from the pension without taking taxable income past `ceiling`. */
  const drawPension = (need, ceiling) => {
    if (need <= 0 || !access || pen <= 0) return 0;
    const fully = a.lump && lumpTaken;
    const headroom = fully ? 0 : Math.max(0, P.lsa - cumPcls);
    if (taxable >= ceiling) return 0;
    const gross = Math.min(pen, grossForNet(c, need, taxable, fully, headroom, ceiling));
    if (gross <= 0) return 0;
    pen -= gross; drawdown += gross;
    const taxFree = fully ? 0 : Math.min(gross * P.pclsProp, headroom);
    cumPcls += taxFree;
    const tp = gross - taxFree;
    const before = netOf(tb, taxable);
    taxable += tp;
    return taxFree + (netOf(tb, taxable) - before);
  };
  const drawStep = (step, need) => {
    if (need <= 0) return 0;
    switch (step) {
      case 0: return drawPension(need, P.pa);
      case 1: return drawPension(need, P.higherRateStartsAt);
      case 2: return drawPension(need, Infinity);
      case 3: { const pull = Math.min(cash, need); cash -= pull; return pull; }
      case 4: return sellGia(need);
      default: { const pull = Math.min(isa, need); isa -= pull; return pull; }
    }
  };

  // 5. a one-off cost, in the move's cost order
  const cost = yr.cost[t];
  if (cost > 0) {
    let rem = cost;
    for (let k = 0; k < a.costSteps.length && rem > 0; k++) rem -= drawStep(a.costSteps[k], rem);
    unmet += Math.max(0, rem);
  }
  /*
   * 6. the living target. On a forward run that carries the rails' memory in slots 7 to 10 (rate0 or -1,
   * the multiplier, whether last year lost money, the draw the rails were last set against) the
   * guardrails apply exactly as the engine applies them, floor included; a grid cell carries no memory
   * and the solver plans at the full spend.
   */
  let target = yr.spend[t] * a.level;
  /*
   * A spending rule other than the plan's own (research opponents, plan 2d.2) uses the same four slots:
   * `c.rule` is { kind:'vanguard', up, down } or { kind:'arva', rate }, set on the compiled household by
   * the caller; the guardrails stay the engine's rule, chosen by the plan's config.
   */
  const rule = c.rule || (c.guard ? GK : null);
  if (rule && s.length > 10 && retired) {
    const scheduled = yr.scheduled[t];
    const covered = netGuaranteed / frac;
    const baseDraw = Math.max(0, scheduled - covered);
    const potNow = pen + isa + gia + cash;
    let rate0 = s[7], mult = s[8], lost = s[9] > 0.5, lastBase = s[10];
    if (baseDraw > 0 && potNow > 0) {
      // the plan itself changed what it draws (the State Pension starting, a band beginning): re-foot, do not react
      const replanned = rate0 >= 0 && Math.abs(baseDraw - lastBase) > 0.01 * Math.max(1, lastBase);
      if (rule.kind === 'gk') {
        const g = c.guard;
        if (rate0 >= 0 && lost) mult /= (1 + c.inflation);
        if (rate0 < 0) rate0 = baseDraw / potNow;
        else if (replanned) rate0 = (baseDraw * mult) / potNow;
        else {
          const rate = (baseDraw * mult) / potNow;
          if (rate > rate0 * (1 + g.band) && (c.T - t) > g.freezeYears) mult *= (1 - g.cut);
          else if (rate < rate0 * (1 - g.band)) mult *= (1 + g.raise);
        }
      } else if (rule.kind === 'vanguard') {
        // Vanguard's dynamic spending: the first year's rate of the pot, then each year's draw held within a
        // ceiling and a floor of last year's (5% up, 2.5% down, in real terms), so it follows the pot slowly
        if (rate0 < 0) rate0 = baseDraw / potNow;
        else if (replanned) rate0 = (baseDraw * mult) / potNow;
        else { const want = (rate0 * potNow) / baseDraw; mult = Math.min(mult * (1 + rule.up), Math.max(mult * (1 - rule.down), want)); }
      } else if (rule.kind === 'arva') {
        // ARVA (Waring and Siegel): the pot spread over the years left as a level real annuity at the rule's
        // real rate, recomputed every year, so it spends up after good years and never runs out on its own
        const n = c.T - t + 1, r = rule.rate;
        const draw = r > 1e-9 ? (potNow * r) / (1 - Math.pow(1 + r, -n)) : potNow / n;
        mult = draw / baseDraw; rate0 = baseDraw / potNow;
      }
      if (c.floorFrac > 0) { const minMult = Math.max(0, scheduled * c.floorFrac - covered) / baseDraw; if (mult < minMult) mult = minMult; }
      lastBase = baseDraw;
      target = (covered + baseDraw * mult) * frac;
    }
    s[7] = rate0; s[8] = mult; s[10] = lastBase;
  }
  const netDemand = Math.max(0, target - netGuaranteed);
  if (target > 0 && netGuaranteed >= target) {
    const surplus = netGuaranteed - target;
    const bufferEach = (target / frac) * c.ctx.cashBufferYears;
    cash += surplus;
    if (cash > bufferEach) {
      let excess = cash - bufferEach;
      const room = Math.max(0, P.isaAllowance - isaContrib);
      const toIsa = Math.min(excess, room);
      isa += toIsa; isaContrib += toIsa; excess -= toIsa;
      cash = bufferEach + excess;
    }
  } else if (netDemand > 0) {
    let rem = netDemand;
    for (let k = 0; k < a.steps.length && rem > 0.005; k++) rem = Math.max(0, rem - drawStep(a.steps[k], rem));
    unmet += Math.max(0, rem);
  }
  // 7b. harvest beyond the need and re-wrap: ISA first, then the GIA at cost
  if (a.harvest && retired && access && pen > 0 && taxable < a.harvestCeil) {
    const net = drawPension(1e12, a.harvestCeil);
    if (net > 0) {
      const room = Math.max(0, P.isaAllowance - isaContrib);
      const toIsa = Math.min(net, room);
      isa += toIsa; isaContrib += toIsa; addGia(net - toIsa); harvested += net;
    }
  }
  // 7c. capital gains on the year's disposals, settled cash -> GIA -> ISA -> pension
  if (cgtOn) {
    const taxableGain = Math.max(0, realised - yr.cgtExempt[t]);
    if (taxableGain > 0) {
      const taxableIncome = Math.max(0, taxable - P.paAt(taxable));
      const basicRoom = Math.max(0, P.cgtBandWidth - taxableIncome);
      const atBasic = Math.min(taxableGain, basicRoom);
      const bill = atBasic * P.cgtBasicRate + (taxableGain - atBasic) * P.cgtHigherRate;
      if (bill > 0) {
        cgtPaid += bill;
        let rem = bill;
        const pull = Math.min(cash, rem); cash -= pull; rem -= pull;
        if (rem > 0) rem -= sellGia(rem);       // the gain this books is next year's, and the grid drops it
        if (rem > 0) { const p2 = Math.min(isa, rem); isa -= p2; rem -= p2; }
        if (rem > 0) rem -= drawPension(rem, Infinity);
        unmet += Math.max(0, rem);
      }
    }
  }
  // 7d. the sweep: cash to the buffer, both ways
  if (a.sweep) {
    const bufferEach = yr.buffer[t];
    if (cash > bufferEach) { addGia(cash - bufferEach); cash = bufferEach; }
    else if (cash < bufferEach) { const got = sellGia(bufferEach - cash); cash += got; }
  }
  // 7e. the cash ISA: taxable cash was drawn first, then the leftover allowance shelters more (engine 7e)
  cashIsa = Math.min(cashIsa, cash);
  {
    const room = Math.min(Math.max(0, yr.cashIsaCap[t] - cashIsaSubscribed), Math.max(0, P.isaAllowance - isaContrib));
    const move = Math.min(room, Math.max(0, cash - cashIsa));
    if (move > 0) { cashIsa += move; isaContrib += move; }
  }
  taxPaid = taxOf(tb, taxable) + savingsTax + dividendTax;
  const preNmpaInsolvent = unmet > 1 && !access;      // the engine's test, with one owner

  s[0] = pen; s[1] = isa; s[2] = gia + cash;
  s[3] = gia > 0 ? Math.max(0, Math.min(1, (gia - basis) / gia)) : 0;
  s[4] = cumPcls; s[5] = lumpTaken ? 1 : 0; if (s.length > 6) s[6] = cashIsa;
  // the year's spend as a fraction of the plan's target, whoever set it: the move's level, or the rails' multiplier
  const level = yr.spend[t] > 0 ? target / yr.spend[t] : 1;
  c.last = { taxPaid, cgtPaid, drawdown, harvested, unmet, preNmpaInsolvent, cash, gia, netDemand, target, level };
  return unmet;
}

/*
 * The gross pension draw that delivers `need` net, with `T0` already taxable, without taking taxable
 * income past `ceiling`. The same piecewise inversion the engine does, over the table's segments.
 */
function grossForNet(c, need, T0, fully, headroom, ceiling) {
  const { P, tb } = c;
  if (need <= 0) return 0;
  const prop = fully ? 0 : P.pclsProp;
  const room = Math.max(0, ceiling - T0);
  if (!(room > 0) && (prop <= 0 || headroom <= 0)) return 0;
  const Gh = prop > 0 ? headroom / prop : Infinity;
  const taxFreeOf = (G) => Math.min(prop * G, headroom);
  const gMaxForTaxable = (x) => { if (prop >= 1) return Gh + x; const g1 = x / (1 - prop); return g1 <= Gh ? g1 : headroom + x; };
  const netBase = netOf(tb, T0);
  const f = (G) => taxFreeOf(G) + netOf(tb, T0 + (G - taxFreeOf(G))) - netBase;
  const Gmax = Number.isFinite(room) ? gMaxForTaxable(room) : Infinity;
  if (Number.isFinite(Gmax) && f(Gmax) <= need) return Gmax;
  // breakpoints of f in gross space: the tax-free cap, then each table corner above T0
  let lo = 0, flo = 0;
  const cand = [];
  if (Number.isFinite(Gh)) cand.push(Gh);
  for (let i = 1; i < tb.n; i++) { const B = tb.xs[i]; if (B > T0) cand.push(gMaxForTaxable(B - T0)); }
  cand.push(Number.isFinite(Gmax) ? Gmax : Math.max(need * 4, 1000));
  cand.sort((x, y) => x - y);
  for (let i = 0; i < cand.length; i++) {
    const hi = cand[i]; if (hi <= lo) continue;
    const fhi = f(hi);
    if (fhi >= need) { const sl = (fhi - flo) / (hi - lo); return sl > 0 ? lo + (need - flo) / sl : hi; }
    lo = hi; flo = fhi;
  }
  // beyond the last corner the slope is the top segment's
  const last = cand[cand.length - 1];
  const sl = (f(last * 2) - f(last)) / last;
  return sl > 0 ? last + (need - f(last)) / sl : last;
}

/* Growth for one year from a post-decision state, at the given real rates in CATS order. */
export function grow(c, t, s, real) {
  const frac = c.yr.frac[t];
  const tax = s[2];
  // the sweep has just left cash at this year's buffer (or all of a smaller pot), and growth acts on that
  const cash = Math.min(tax, c.yr.buffer[t]);
  const gia = tax - cash;
  s[0] = Math.max(0, s[0] * (1 + real[0] * frac));
  s[1] = Math.max(0, s[1] * (1 + real[1] * frac));
  const gia2 = Math.max(0, gia * (1 + real[2] * frac));
  const cash2 = Math.max(0, cash * (1 + real[3] * frac));
  if (s.length > 6 && s[6] >= 0) s[6] = cash > 0 ? Math.min(cash2, s[6] * (cash2 / cash)) : 0;   // the sheltered part grows with the cash
  if (s.length > 10) { const before = s[0] + s[1] + tax; s[9] = (s[0] * (1 + real[0] * frac) + s[1] * (1 + real[1] * frac) + gia2 + cash2) < before ? 1 : 0; }
  // the basis does not grow, so the gain fraction rises with the GIA and falls if it shrinks
  if (gia > 0 && gia2 > 0) { const basis = gia * (1 - s[3]); s[3] = Math.max(0, Math.min(1, (gia2 - basis) / gia2)); }
  s[2] = gia2 + cash2;
}
