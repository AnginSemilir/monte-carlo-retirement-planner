/*
 * THE REDUCED MODEL: ONE YEAR OF THE PLAN, AS A FUNCTION RATHER THAN A PROCEDURE.
 *
 * The engine's `stepYear` is the authority on what a year does, and it stays the authority: this is not
 * a replacement for it. It is the same year written so that a solver can call it tens of millions of
 * times and so that the decision is an ARGUMENT rather than something the function looks up. `stepYear`
 * reads the draw order, the harvest switch, the lump-sum choice and the cost order out of the context
 * and applies them; here they arrive in `action`, and nothing in the function chooses anything.
 *
 * It takes the engine as a parameter rather than importing it, the way `src/evolve.js` does: the
 * research scripts pass a build of `research/engine.mjs`, the app's worker will pass its own imports,
 * and both run this code. That also keeps the engine free of any import of the solver.
 *
 * WHAT IS THE SAME AS THE ENGINE, and is meant to stay exact:
 *   - every tax calculation, because they are the engine's own functions, called here
 *   - the order of the year: deductions, deposits, drips, contributions, lump sum, guaranteed income,
 *     one-off costs, living demand, the surplus sweep or the draw, the harvest, CGT, then growth
 *   - the GIA cost basis and its pro-rata disposal, the PCLS cap, the year-zero fraction
 *   - the four pots per owner. Cash is NOT merged into the taxable pot here. The merge is a property of
 *     the solver's GRID, not of the year, so it belongs in `grid.js` where its cost can be measured on
 *     its own. Keeping the year exact is what makes the golden test a bug detector rather than a
 *     tolerance negotiation.
 *
 * WHAT IS DELIBERATELY ABSENT, and asserted absent by `prepare`:
 *   - the spending guardrails. The solver plans at the full spend; the projection applies the rails on
 *     top when they are switched on. (Part D of the plan makes the cut an action and retires them.)
 *   - the one-off cost lookahead. A known cost reaches the solver through the calendar, so the rule it
 *     replaces has nothing left to do.
 *   - the historical market and the per-path return shock. The solver integrates over a return
 *     distribution rather than walking a path; `grow` takes a real rate per account and the caller
 *     decides where it came from.
 *   - the audit row. `step` returns only what a solver or a comparison needs.
 *
 * THE ACTION is the six-token step vocabulary the app already speaks, so a named policy and a solved
 * one are the same kind of object and the instruction sheet can phrase either:
 *
 *   steps       the draw order for living costs: a permutation of 'cash', 'other', 'isa' and the three
 *               pension ceilings 'penPA', 'penBasic', 'penAny'
 *   costSteps   the same for a one-off cost, which is a different decision: a lump is large enough to
 *               push a year's pension income through a band on its own
 *   harvest     draw pension beyond the year's need and re-wrap it, or not
 *   harvestCeil 'pa' or 'basic': free money, or a 20%-now bequest trade
 *   lump        take the tax-free cash in one go on first access, or phase it
 *   sweepCash   keep cash at the buffer and put the rest in the GIA, or leave it where it is. Off is
 *               what the engine does today; see step 7d for why this is an action and not a rule
 *   contrib     per owner, what goes into the pension this year; null means "as the plan is entered",
 *               which is what the golden test needs and what the household's own plan means
 */

const CATS = ['pen', 'isa', 'other', 'cash'];

/*
 * The cash buffer for the household in projection year `t`, in full-year terms: months of the year's
 * living target, as the Config setting says. It is a function of the year and nothing else, which is
 * what lets the grid stop carrying cash as a dimension of its own once the sweep maintains it.
 */
export function bufferAt(m, t) {
  const { E, ctx } = m;
  return E.spendTargetAtAge(ctx, ctx.ageSelf0 + t) * ctx.cashBufferYears;
}

/*
 * Where cash sits at the START of year `t` under the sweep, which is what the grid needs in order to
 * split a merged taxable pot back into its cash and GIA parts. The sweep leaves cash at exactly the
 * buffer at the end of the previous year's flows, and growth then applies, so a year later it is the
 * previous buffer grown at the cash tier - capped by the merged pot, for a household that has run the
 * taxable side down below its own buffer. Year zero is the exception: the opening balances are the
 * household's own, and the solve reads them directly rather than through the grid.
 */
export function cashAt(m, t, taxPot) {
  if (t <= 0) return Math.min(taxPot, bufferAt(m, 0));
  const cashAcc = m.ctx.accounts.find(a => a.cat === 'cash');
  const r = cashAcc ? cashAcc.real : 0;
  return Math.min(taxPot, bufferAt(m, t - 1) * (1 + r));
}

/*
 * Turn a plan into everything that does not change from year to year or from action to action. Called
 * once per solve; `step` may then allocate nothing.
 */
export function prepare(E, rawPlan, opts = {}) {
  const ctx = E.buildContext(E.resolveMpaa ? E.resolveMpaa(rawPlan) : rawPlan);
  const reasons = [];
  if (ctx.guardrails) reasons.push('spending guardrails are on');
  if (ctx.lookaheadYears > 0) reasons.push('the one-off cost lookahead is on');
  if (reasons.length && !opts.allowUnsupported) {
    throw new Error(`the reduced model does not carry ${reasons.join(' and ')}; solve with them off and let the engine apply them when it runs the plan`);
  }
  const ownerByKey = {};
  ctx.owners.forEach(o => { ownerByKey[o.key] = o; });
  return { E, ctx, P: ctx.P, owners: ctx.owners, ownerByKey, acc: ctx.acc, cats: CATS };
}

/* The opening position, taken from the plan's own balances. */
export function initialState(m) {
  const { ctx } = m;
  const pots = {};
  ctx.accounts.forEach(a => { pots[a.id] = a.balance; });
  const basis = {}, cgtCarry = {}, cumPcls = {}, lumpTaken = {}, cashIsa = {};
  ctx.owners.forEach(o => {
    const gia = ctx.acc[o.ids.other];
    // what the GIA cost, so a disposal knows how much of the proceeds is gain
    basis[o.key] = gia ? Math.max(0, gia.balance - gia.unrealisedGain) : 0;
    cgtCarry[o.key] = 0; cumPcls[o.key] = 0; lumpTaken[o.key] = false;
    cashIsa[o.key] = Math.min(o.cashIsa0 || 0, pots[o.ids.cash] || 0);
  });
  return { pots, basis, cgtCarry, cumPcls, lumpTaken, cashIsa };
}

export function cloneState(s) {
  return {
    pots: { ...s.pots }, basis: { ...s.basis }, cgtCarry: { ...s.cgtCarry },
    cumPcls: { ...s.cumPcls }, lumpTaken: { ...s.lumpTaken }, cashIsa: { ...(s.cashIsa || {}) }
  };
}

/*
 * The action a named policy amounts to, so the golden test and the baseline can be expressed in the
 * same terms the solver's own actions use.
 */
export function actionForPolicy(m, policyKey, over = {}) {
  const { E, ctx } = m;
  const pol = (E.DECUMULATION_POLICIES || {})[policyKey];
  return {
    steps: over.steps || (pol ? pol.steps : ctx.policySteps),
    costSteps: over.costSteps || ctx.costSteps,
    harvest: over.harvest !== undefined ? over.harvest : (pol ? pol.harvest && ctx.harvestPA : ctx.harvestPA),
    harvestCeil: over.harvestCeil || ctx.harvestCeiling,
    lump: over.lump !== undefined ? over.lump : ctx.fullLumpSum,
    sweepCash: !!over.sweepCash,
    contrib: over.contrib || null
  };
}

/* The action the plan itself carries, whatever it is. Used by the golden test and by the baseline. */
export function actionFromContext(ctx) {
  return {
    steps: ctx.policySteps, costSteps: ctx.costSteps, harvest: ctx.harvestPA,
    harvestCeil: ctx.harvestCeiling, lump: ctx.fullLumpSum, sweepCash: false, contrib: null
  };
}

/*
 * ONE YEAR.
 *
 * `state` is mutated in place, which is what a solver wants; callers that need the old one clone first.
 * `rates` is a map from account id to the real return for this year, or null for the plan's own expected
 * rates. `t` is the projection year, 0 being the stub year from the valuation date.
 *
 * Returns the small set of figures a solver or a comparison needs. Everything else the audit table shows
 * is the engine's job.
 */
export function step(m, state, action, t, rates = null, skipGrowth = false) {
  const { E, ctx, P, owners, ownerByKey } = m;
  const pots = state.pots;
  const frac = t === 0 ? ctx.yf : 1.0;
  const year = ctx.baseYear + t;
  const ageSelf = ctx.ageSelf0 + t;
  const agePart = ctx.isCouple ? ctx.agePart0 + t : 0;
  const ageOf = (o) => (o === 'self' ? ageSelf : agePart);

  const working = {}, access = {};
  owners.forEach(o => { working[o.key] = ageOf(o.key) < o.retireAge; access[o.key] = ageOf(o.key) >= ctx.nmpa; });
  const anyAccess = owners.some(o => access[o.key]);
  const anyRetired = owners.some(o => !working[o.key]);

  const cgtOn = P.cgtEnabled;
  const realisedGains = { self: state.cgtCarry.self, part: state.cgtCarry.part };
  state.cgtCarry = { self: 0, part: 0 };
  const ownerOfId = (id) => (String(id).endsWith('_part') ? 'part' : 'self');

  /*
   * A GIA sale realises gain pro-rata against the whole holding and takes the cost portion out of the
   * basis, exactly as the engine's giaDispose does. The consequence, which the grid will lean on later,
   * is that the GAIN FRACTION is unchanged by a sale: it moves only on a deposit at cost and on growth.
   */
  const sellGia = (id, amount) => {
    const before = pots[id] || 0;
    const sold = Math.min(before, Math.max(0, amount));
    if (sold <= 0) return 0;
    pots[id] = before - sold;
    if (cgtOn) {
      const k = ownerOfId(id);
      const b = state.basis[k] || 0;
      const gain = sold * (Math.max(0, before - b) / before);
      state.basis[k] = Math.max(0, b - (sold - gain));
      realisedGains[k] += gain;
    }
    return sold;
  };
  const addBasis = (k, amount) => { if (cgtOn && amount > 0) state.basis[k] += amount; };

  // 0. a deposit funded from another pot of the household's own takes the money out first
  let unmetDeduction = 0;
  const deductions = ctx.oneOffDeductions.get(year);
  if (deductions) deductions.forEach(x => {
    if (pots[x.id] === undefined) return;
    let take;
    if (x.id.startsWith('other_')) take = sellGia(x.id, x.amount);
    else { take = Math.min(pots[x.id], x.amount); pots[x.id] -= take; }
    unmetDeduction += Math.max(0, x.amount - take);
  });

  // 1. dated one-off deposits, not pro-rated
  const deposits = ctx.oneOffContribs.get(year);
  if (deposits) deposits.forEach(x => {
    if (pots[x.id] === undefined) return;
    pots[x.id] += x.amount;
    if (x.id.startsWith('other_')) addBasis(ownerOfId(x.id), x.amount);
  });

  // 1.5 staged multi-year transfers out of the GIA, which are real disposals
  const drips = ctx.stagedTransfers.get(year);
  if (drips) drips.forEach(x => {
    const move = sellGia(x.fromId, x.amount);
    if (move <= 0) return;
    pots[x.toId] = (pots[x.toId] || 0) + move;
    if (x.toId.startsWith('other_')) addBasis(ownerOfId(x.toId), move);
  });

  /*
   * 2. contributions while the owner works.
   *
   * `action.contrib` is where the solver's saving decision lands: a map of account id to the amount for
   * this year. Null means the plan's own schedule, which is what "your plan" means and what the golden
   * test compares against.
   */
  const contribThisYear = { self: 0, part: 0 };
  const isaContribThisYear = { self: 0, part: 0 };
  ctx.accounts.forEach(a => {
    if (!working[a.owner]) return;
    const amt = action.contrib ? Math.max(0, action.contrib[a.id] || 0) : E.contribAtYear(a, t);
    if (amt > 0) {
      pots[a.id] += amt * frac;
      if (a.cat === 'other') addBasis(a.owner, amt * frac);
      contribThisYear[a.owner] += amt * frac;
      if (a.cat === 'isa') isaContribThisYear[a.owner] += amt * frac;
    }
  });
  // 2a. the cash ISA subscription out of the year's cash contribution (engine step 2a)
  if (!state.cashIsa) state.cashIsa = { self: 0, part: 0 };   // a state built by hand carries no sheltered cash
  const cashIsaSubscribed = { self: 0, part: 0 };
  owners.forEach(o => {
    if (!working[o.key] || !(o.cashIsaContrib > 0)) return;
    const room = Math.min(P.cashIsaCapAt(ageOf(o.key), year), Math.max(0, P.isaAllowance - isaContribThisYear[o.key]));
    const sub = Math.min(o.cashIsaContrib * frac, room, Math.max(0, (pots[o.ids.cash] || 0) - state.cashIsa[o.key]));
    if (sub > 0) { state.cashIsa[o.key] += sub; isaContribThisYear[o.key] += sub; cashIsaSubscribed[o.key] += sub; }
  });

  // 3. the whole tax-free lump sum on first access, when that is the choice
  if (action.lump) {
    owners.forEach(o => {
      if (state.lumpTaken[o.key] || !access[o.key] || working[o.key]) return;
      const pot = pots[o.ids.pen] || 0;
      if (pot <= 0) return;
      const pcls = Math.min(pot * P.pclsProp, Math.max(0, P.lsa - state.cumPcls[o.key]));
      pots[o.ids.pen] -= pcls;
      pots[o.ids.cash] = (pots[o.ids.cash] || 0) + pcls;
      state.cumPcls[o.key] += pcls;
      state.lumpTaken[o.key] = true;
    });
  }

  // 4. guaranteed income, the state pension, and the take-home of a partner still working
  const taxable = { self: 0, part: 0 };
  const taxFreeIncome = { self: 0, part: 0 };
  ctx.otherIncomes.forEach(inc => {
    const age = ageOf(inc.owner);
    if (age >= inc.startAge && age <= inc.endAge) {
      if (inc.taxFree) taxFreeIncome[inc.owner] += inc.amount * frac; else taxable[inc.owner] += inc.amount * frac;
    }
  });
  const statePension = { self: 0, part: 0 };
  owners.forEach(o => { if (ageOf(o.key) >= ctx.spa) { statePension[o.key] = o.statePension * frac; taxable[o.key] += statePension[o.key]; } });
  // 4a, 4b. tax on the year's savings interest (taxable cash only) and on the GIA's dividends, as the engine charges them
  if (!state.cashIsa) state.cashIsa = { self: 0, part: 0 };   // a state built by hand carries no sheltered cash
  const savingsTax = { self: 0, part: 0 }, dividendTax = { self: 0, part: 0 };
  owners.forEach(o => {
    const a = ctx.acc[o.ids.cash];
    const nominal = a ? (1 + a.real) * (1 + ctx.inflation) - 1 : 0;
    const interest = P.cashInterestTaxed && a ? Math.max(0, ((pots[o.ids.cash] || 0) - state.cashIsa[o.key]) * nominal * frac) : 0;
    savingsTax[o.key] = P.savingsTax(taxable[o.key], interest);
    if (P.giaDividendYield > 0) dividendTax[o.key] = P.dividendTax(taxable[o.key], interest, Math.max(0, (pots[o.ids.other] || 0) * P.giaDividendYield * frac));
  });
  const netGuaranteed = {};
  owners.forEach(o => { netGuaranteed[o.key] = taxFreeIncome[o.key] + E.calculateUKNetIncome(taxable[o.key], P) - savingsTax[o.key] - dividendTax[o.key]; });
  const totalNetGuaranteed = owners.reduce((s, o) => s + netGuaranteed[o.key], 0);
  let workingTakeHome = 0;
  if (anyRetired) {
    owners.forEach(o => {
      if (!working[o.key] || o.salary <= 0) return;
      const pen = ctx.acc[o.ids.pen];
      const penContrib = action.contrib ? Math.max(0, action.contrib[o.ids.pen] || 0) : (pen ? E.contribAtYear(pen, t) : 0);
      const pay = E.salaryAtYear(o, t);
      const takeHome = pay - E.calculateUKTaxAndNIC(pay, P, o.selfEmployed) - E.netCostOfPensionContrib(penContrib, pay, P, o.selfEmployed);
      const nonPensionContribs = (contribThisYear[o.key] / frac) - penContrib;
      workingTakeHome += Math.max(0, takeHome - nonPensionContribs) * frac;
    });
  }

  let drawdownPensions = 0;
  const taxablePensionDrawn = { self: 0, part: 0 };
  let harvested = 0;
  const pclsHeadroom = (o) => Math.max(0, P.lsa - state.cumPcls[o]);

  /* Draw `netNeeded` net from an owner's pension without taking taxable income past `ceiling`. */
  const drawPension = (oKey, netNeeded, ceiling = Infinity) => {
    const o = ownerByKey[oKey];
    if (!o || netNeeded <= 0 || !access[oKey]) return 0;
    const pot = pots[o.ids.pen] || 0;
    if (pot <= 0) return 0;
    const fully = action.lump && state.lumpTaken[oKey];
    const headroom = fully ? 0 : pclsHeadroom(oKey);
    if (taxable[oKey] >= ceiling) return 0;
    const grossNeeded = E.grossPensionNeededForNet(netNeeded, taxable[oKey], P, fully, headroom, ceiling);
    const gross = Math.min(pot, grossNeeded);
    if (gross <= 0) return 0;
    pots[o.ids.pen] = pot - gross;
    drawdownPensions += gross;
    const taxFree = fully ? 0 : Math.min(gross * P.pclsProp, headroom);
    state.cumPcls[oKey] += taxFree;
    const taxablePart = gross - taxFree;
    taxablePensionDrawn[oKey] += taxablePart;
    const before = E.calculateUKNetIncome(taxable[oKey], P);
    taxable[oKey] += taxablePart;
    const after = E.calculateUKNetIncome(taxable[oKey], P);
    return taxFree + (after - before);
  };
  const drawPot = (id, need) => {
    if (need <= 0) return 0;
    if (id.startsWith('other_')) return sellGia(id, need);
    const pull = Math.min(pots[id] || 0, need);
    if (pull <= 0) return 0;
    pots[id] -= pull;
    return pull;
  };

  // 5. a one-off capital cost, met in the action's own order for costs
  let unmetCost = 0;
  const cost = ctx.oneOffCosts.get(year) || 0;
  if (cost > 0) {
    let rem = cost;
    for (const s of action.costSteps) {
      if (rem <= 0) break;
      if (s === 'penPA') { for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem, P.pa); } }
      else if (s === 'penBasic') { for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem, P.higherRateStartsAt); } }
      else if (s === 'penAny') { for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem); } }
      else { for (const o of owners) { if (rem > 0) rem -= drawPot(o.ids[s], rem); } }
    }
    unmetCost = Math.max(0, rem);
  }

  // 6. what the year costs to live on. No rails: the solver plans at the full spend.
  const annualLivingTarget = anyRetired ? E.spendTargetAtAge(ctx, ageSelf) * frac : 0;
  const netDemand = Math.max(0, annualLivingTarget - totalNetGuaranteed - workingTakeHome);
  const demand = { self: 0, part: 0 };

  // 7. either the guaranteed income covers the year and the surplus is swept, or the pots are drawn
  if (annualLivingTarget > 0 && totalNetGuaranteed + workingTakeHome >= annualLivingTarget) {
    const surplus = totalNetGuaranteed + workingTakeHome - annualLivingTarget;
    const bufferEach = (annualLivingTarget / frac) * ctx.cashBufferYears / owners.length;
    owners.forEach(o => {
      const share = surplus / owners.length;
      pots[o.ids.cash] = (pots[o.ids.cash] || 0) + share;
      if (pots[o.ids.cash] > bufferEach) {
        let excess = pots[o.ids.cash] - bufferEach;
        const isaRoom = Math.max(0, P.isaAllowance - isaContribThisYear[o.key]);
        const toIsa = Math.min(excess, isaRoom);
        pots[o.ids.isa] = (pots[o.ids.isa] || 0) + toIsa;
        isaContribThisYear[o.key] += toIsa;
        excess -= toIsa;
        pots[o.ids.cash] = bufferEach + excess;
      }
    });
  } else if (netDemand > 0) {
    owners.forEach(o => { demand[o.key] = netDemand / owners.length; });
    const remaining = () => owners.reduce((s, o) => s + demand[o.key], 0);
    const tier = (cat) => {
      owners.forEach(o => { demand[o.key] -= drawPot(o.ids[cat], demand[o.key]); });
      owners.forEach(o => owners.forEach(x => { if (x.key !== o.key && demand[x.key] > 0) demand[x.key] -= drawPot(o.ids[cat], demand[x.key]); }));
    };
    const pensionTier = (ceiling) => {
      owners.forEach(o => { if (demand[o.key] > 0) demand[o.key] = Math.max(0, demand[o.key] - drawPension(o.key, demand[o.key], ceiling)); });
      owners.forEach(o => owners.forEach(x => { if (x.key !== o.key && demand[x.key] > 0) demand[x.key] = Math.max(0, demand[x.key] - drawPension(o.key, demand[x.key], ceiling)); }));
    };
    for (const s of action.steps) {
      if (remaining() <= 0.005) break;
      if (s === 'penPA') pensionTier(P.pa);
      else if (s === 'penBasic') pensionTier(P.higherRateStartsAt);
      else if (s === 'penAny') pensionTier(Infinity);
      else tier(s);
    }
  }

  // 7b. draw pension beyond the year's need and re-wrap it: ISA first, then the GIA at cost
  if (action.harvest && anyRetired) {
    const harvestCeil = action.harvestCeil === 'basic' ? P.higherRateStartsAt : P.pa;
    owners.forEach(o => {
      if (working[o.key] || !access[o.key]) return;
      if ((pots[o.ids.pen] || 0) <= 0 || taxable[o.key] >= harvestCeil) return;
      const net = drawPension(o.key, 1e12, harvestCeil);
      if (net > 0) {
        const isaRoom = Math.max(0, P.isaAllowance - isaContribThisYear[o.key]);
        const toIsa = Math.min(net, isaRoom);
        pots[o.ids.isa] = (pots[o.ids.isa] || 0) + toIsa;
        isaContribThisYear[o.key] += toIsa;
        const toGia = net - toIsa;
        pots[o.ids.other] = (pots[o.ids.other] || 0) + toGia;
        addBasis(o.key, toGia);
        harvested += net;
      }
    });
  }

  // 7c. capital gains on the year's disposals, settled cash -> GIA -> ISA -> pension
  let cgtPaid = 0, unmetCgt = 0;
  if (cgtOn) {
    owners.forEach(o => {
      const exempt = Math.max(0, P.cgtAnnualExempt - (t === 0 ? o.cgtGainsUsed : 0));
      const taxableGain = Math.max(0, realisedGains[o.key] - exempt);
      if (taxableGain <= 0) return;
      const taxableIncome = Math.max(0, taxable[o.key] - P.paAt(taxable[o.key]));
      const basicRoom = Math.max(0, P.cgtBandWidth - taxableIncome);
      const atBasic = Math.min(taxableGain, basicRoom);
      const bill = atBasic * P.cgtBasicRate + (taxableGain - atBasic) * P.cgtHigherRate;
      if (bill <= 0) return;
      cgtPaid += bill;
      const gainsBeforeSettling = realisedGains[o.key];
      let rem = bill;
      for (const cat of ['cash', 'other', 'isa']) { if (rem > 0) rem -= drawPot(o.ids[cat], rem); }
      for (const x of owners) { if (rem > 0) rem -= drawPot(x.ids.cash, rem); }
      if (rem > 0) rem -= drawPension(o.key, rem);
      unmetCgt += Math.max(0, rem);
      // a sale made to settle the bill books its own gain, which falls into next year's tally
      state.cgtCarry[o.key] += realisedGains[o.key] - gainsBeforeSettling;
      realisedGains[o.key] = gainsBeforeSettling;
    });
  }

  /*
   * 7d. KEEP CASH AT THE BUFFER AND INVEST THE REST.
   *
   * The engine has no rule that moves money out of Cash Savings: what the household enters there, and
   * what a full tax-free lump sum lands there, stays there earning the cash tier for the rest of the
   * plan. That is a decision left unmade rather than a decision taken, and it is the reason the solver
   * cannot simply merge cash into the taxable pot - a merged pot would silently assume the money was
   * invested when the engine has it sitting still.
   *
   * So the sweep is explicit. Off, this function is exactly the engine. On, whatever is above the
   * buffer at the end of the year's flows moves into the GIA at cost, which creates no gain, and cash
   * is then the buffer by construction and no longer needs a dimension of its own.
   *
   * Measured in the real engine over 22 library households holding more than half a year's spend in
   * cash: survival +0.30 points on average and the median pot +£149k, but mixed household by household
   * (a few lose a fraction of a point, the two cash-heaviest gain 3.5 and 3.8). So it is worth doing
   * and worth SAYING, not worth assuming: with it on, the plan carries a recommendation to move the
   * money, the engine executes that move too, and a household that wants more cash raises the buffer.
   */
  if (action.sweepCash) {
    const bufferEach = bufferAt(m, t) / owners.length;
    owners.forEach(o => {
      const cash = pots[o.ids.cash] || 0;
      if (cash > bufferEach) {
        const excess = cash - bufferEach;
        pots[o.ids.cash] = bufferEach;
        pots[o.ids.other] = (pots[o.ids.other] || 0) + excess;
        addBasis(o.key, excess);                      // moved at cost, so no gain is created
      } else if (cash < bufferEach) {
        // topping the buffer back up is a sale, so it books its gain like any other disposal
        const got = sellGia(o.ids.other, bufferEach - cash);
        pots[o.ids.cash] = cash + got;
      }
    });
  }

  const unmetDemand = owners.reduce((s, o) => s + Math.max(0, demand[o.key]), 0) + unmetCost + unmetDeduction + unmetCgt;
  const lockedPensionWealth = owners.reduce((s, o) => s + (access[o.key] ? 0 : (pots[o.ids.pen] || 0)), 0);
  const preNmpaInsolvent = unmetDemand > 1 && (!anyAccess || lockedPensionWealth > 0);

  /*
   * 8. growth, unless the caller wants the position BEFORE the markets act.
   *
   * That position is the post-decision state, and it is what makes a solve affordable: every action
   * from a given position leads to one of them, and the expectation over next year's returns is then
   * taken once per post-decision state rather than once per state and action together.
   */
  /*
   * 7e. The cash ISA at the end of the year's flows (engine step 7e): draws came out of taxable cash
   * first, so the sheltered part is capped at what is left; then the leftover ISA allowance shelters
   * more, up to the cash ISA's own cap.
   */
  owners.forEach(o => {
    const cashNow = pots[o.ids.cash] || 0;
    state.cashIsa[o.key] = Math.min(state.cashIsa[o.key], cashNow);
    const cap = Math.max(0, P.cashIsaCapAt(ageOf(o.key), year) - cashIsaSubscribed[o.key]);
    const room = Math.min(cap, Math.max(0, P.isaAllowance - isaContribThisYear[o.key]));
    const move = Math.min(room, Math.max(0, cashNow - state.cashIsa[o.key]));
    if (move > 0) { state.cashIsa[o.key] += move; isaContribThisYear[o.key] += move; cashIsaSubscribed[o.key] += move; }
  });
  if (!skipGrowth) grow(m, state, t, rates);

  const byCat = {};
  CATS.forEach(cat => { byCat[cat] = owners.reduce((s, o) => s + (pots[o.ids[cat]] || 0), 0); });
  const taxPaid = owners.reduce((s, o) => s + E.incomeTax(taxable[o.key], P) + savingsTax[o.key] + dividendTax[o.key], 0);

  return {
    year, t, ageSelf, agePart,
    targetSpend: annualLivingTarget,
    netDrawdown: netDemand,
    pensions: byCat.pen, isas: byCat.isa, other: byCat.other, cash: byCat.cash,
    totalCombined: byCat.pen + byCat.isa + byCat.other + byCat.cash,
    drawdownPensions, harvested, taxPaid, cgtPaid,
    taxablePensionSelf: taxablePensionDrawn.self, taxablePensionPart: taxablePensionDrawn.part,
    unmetDemand, preNmpaInsolvent, oneOffCost: cost
  };
}

/* Apply one year's growth. `rates` is a map of account id to real rate, or null for the plan's own. */
export function grow(m, state, t, rates = null) {
  const frac = t === 0 ? m.ctx.yf : 1.0;
  m.ctx.accounts.forEach(a => {
    const g = rates ? (rates[a.id] !== undefined ? rates[a.id] : a.real) : a.real;
    const before = state.pots[a.id] || 0;
    state.pots[a.id] = Math.max(0, before * (1 + g * frac));
    // the sheltered part of the cash pot grows with the pot
    if (a.cat === 'cash' && state.cashIsa) state.cashIsa[a.owner] = before > 0 ? Math.min(state.pots[a.id], (state.cashIsa[a.owner] || 0) * (state.pots[a.id] / before)) : 0;
  });
}

/*
 * Run the whole plan under one fixed action, at the plan's expected rates. This is what the golden test
 * compares against `simulateDeterministic`, and what the early in-model signal scores.
 */
export function runFixed(m, action, opts = {}) {
  const state = opts.state || initialState(m);
  const rows = [];
  const n = m.ctx.totalYears;
  for (let t = 0; t <= n; t++) rows.push(step(m, state, action, t, opts.rates || null));
  return rows;
}
