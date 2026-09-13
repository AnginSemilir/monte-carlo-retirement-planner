# Plan: "Maximise Inheritance" tab

Status: **planned, not built.** Rules researched September 2026. Every rate below carries a source; check
them again before implementing, because three of the four relevant regimes changed in 2025–2027.

---

## 1. Why this is not just "add a tax rate"

The app currently has one knob for death: `pensionDeathTaxRate`, a flat percentage haircut on the
residual pension. It defaults to 0. That was defensible when pensions sat outside the estate. It is not
defensible now, and the reason matters for the whole design:

**From 6 April 2027 the classic advice inverts.** Unused pension funds are inside the estate for IHT.
A pension left to a non-exempt beneficiary can now be hit twice — 40% IHT on the estate, then the
beneficiary's own income tax on withdrawals if death was at 75 or over. Taking 40% first and a 45%
marginal rate on the remainder leaves 33p in the pound: an effective **67%**. The same pound in an ISA
is taxed once, at 40%, leaving 60p.

So the pension went from *the best thing to leave* to *the worst thing to leave*, and the app still
ranks it as the best because a gross terminal pot counts a pension pound and an ISA pound as equal.

This produces a concrete, testable prediction that the existing study can settle:

> **Hypothesis.** "Pension First" — drain the taxable wrapper early — scored **zero** wins across 360
> households when ranked on survival. Ranked on *post-tax inheritance* it should win a large share of
> them. If it does not, the 2027 change matters less than the commentary suggests and we should say so.

That single result decides whether this tab is a feature or a footnote, and it costs one rerun.

---

## 2. The rules, as they stand for 2026/27

| Rule | Value | Note |
|---|---|---|
| Nil-rate band (NRB) | £325,000 | Frozen to 5 April 2031 |
| Residence nil-rate band (RNRB) | £175,000 | Only if the home passes to **direct descendants** |
| RNRB taper | Lost £1 for every £2 of estate over £2,000,000 | Fully gone by £2.35m (or £2.7m with a transferred RNRB) |
| Transferable to spouse/civil partner | Unused % of both NRB and RNRB | A couple can reach £1,000,000 combined |
| Headline rate | 40% | |
| Reduced rate | 36% | If ≥10% of the *net* estate goes to charity |
| Spouse / civil partner | Fully exempt | Also the route by which unused bands transfer |
| Charity | Fully exempt | And can trigger the 36% rate on the rest |
| **Pensions in estate** | **From 6 April 2027** | Finance Act 2026, Royal Assent 18 March 2026 |
| Death-in-service benefits | Excluded | |
| Beneficiary income tax on inherited pension | **0% if death before 75; beneficiary's marginal rate if 75+** | Stacks *on top of* IHT from 2027 |
| Business/Agricultural Property Relief | 100% up to £1m combined, **50% above** | Effective 20% on the excess, from 6 April 2026 |
| AIM shares | **50% relief regardless of value** | Effective 20%; the £1m allowance does not apply |
| Gifts (PETs) | Exempt after 7 years | Taper only bites once gifts exceed the NRB |
| Taper relief | 40/32/24/16/8/0% by year | Applies to the *tax*, not the gift |
| Annual gift exemption | £3,000/yr, one year carry-forward | Immediately exempt |
| Small gifts | £250 per person, unlimited recipients | |
| **Regular gifts out of surplus income** | **Immediately exempt, uncapped** | Must be habitual and genuinely out of income |
| ISAs | **No IHT exemption at all** | Spouse gets an APS allowance, but that is an ISA-allowance benefit, not an IHT one |

Sources at the foot of this document.

---

## 3. Answers to the open questions

### "Keep the min bequest pre-tax in simple inputs, post-tax in advanced — or is post-tax just as easy?"

**Keep them split — but the reason is input dependency, not arithmetic.** The arithmetic is trivial. The
problem is that a *post-tax* bequest floor is not a property of the plan at all: it depends on who
inherits, their relationship, their income, and the age at death. Putting it in the simple inputs would
mean nobody can set a bequest floor until they have filled in a beneficiary table — which turns a
one-number input into a five-screen one.

So: **pre-tax floor stays where it is, in the simple inputs, unchanged.** The post-tax floor lives in the
Inheritance tab, next to the inputs it depends on, and is disabled with an explanation until they exist.
Label the existing one explicitly as *before inheritance tax*, because right now it is silent about which
it is, and after this tab ships that silence becomes misleading.

### "Guess we'll need age of death as an input"

Yes, and it must be **separate from "Plan to Age"**. Those are different things and conflating them will
produce wrong answers:

- *Plan to Age* is a **planning horizon** — deliberately pessimistic, often 100, chosen so you don't run out.
- *Age at death* is a **prediction** — for inheritance you want the realistic one, because the estate is
  valued at death, not at your planning horizon.

Using 100 for both would model an estate depleted by 20 more years of drawdown than is likely, and
understate the bequest badly.

**The 75 cliff deserves its own treatment.** Death at 74 → beneficiaries pay no income tax on the
pension. Death at 76 → they pay their marginal rate, on top of IHT. That is not a smooth curve, it is a
step worth tens of thousands of pounds, and no single input can represent it honestly. So the tab
should show the outcome **at several death ages side by side** (say 70 / 74 / 80 / 90) rather than
asking for one number and pretending it is known.

### "Inheritors' age and income?"

- **Income: required.** It sets the marginal rate on inherited pension income after a 75+ death, which
  is the single largest swing factor after IHT itself. Same pot, same estate, and a non-earning
  grandchild keeps far more than a higher-rate-taxpayer child.
- **Age: optional, and I would not require it.** It changes nothing in the tax calculation directly.
  Its only real use is that a younger beneficiary can spread pension withdrawals across more tax years
  and so face a lower effective rate. That is a genuine effect but second-order, and modelling it means
  assuming a drawdown pattern for someone who isn't the user. Collect it as optional, use it only for a
  "spread over N years" refinement, and default to a single-year assumption that is stated on screen.
- **Relationship: required.** See below — it changes the tax completely, not marginally.

### "Direct descendant or not"

Required, and it needs more than a boolean. Four categories, because each is taxed differently:

| Relationship | IHT treatment | Effect |
|---|---|---|
| Spouse / civil partner | **Fully exempt** | Also transfers unused NRB and RNRB |
| Direct descendant | Taxable | **Unlocks the £175,000 RNRB** if the home passes to them |
| Other individual | Taxable | No reliefs |
| Charity | **Fully exempt** | ≥10% of net estate drops the rate on everything else to 36% |

"Direct descendant" includes children, grandchildren, step-, adopted and fostered children.

### "Not sure if taxes are different"

They are, substantially — the table above. The two that will surprise people:

- **A charity legacy can make the family better off.** Crossing the 10% threshold cuts the rate on the
  rest of the estate from 40% to 36%. Just past the boundary, giving more to charity costs the family
  nothing. The tab should find and show that point.
- **Leaving a pension to a spouse is free; leaving the same pension to a child could cost 67%.**
  Same asset, same value, different recipient.

### "Other wrappers worth including?"

Ranked by value-per-unit-of-complexity, sticking to standard products:

1. **Regular gifts out of surplus income.** The strongest and most under-used relief in UK estate
   planning: immediately exempt, uncapped, no 7-year wait. It also fits this engine unusually well,
   because "surplus income" is something the model already computes each year. **Do this one first.**
2. **Ordinary gifts (PETs) with the 7-year clock.** The main lever most people actually reach for.
   Needs a gift schedule and taper. Moderate complexity, high value.
3. **Whole-of-life cover written in trust.** Sits outside the estate and pays the IHT bill. Reduces to
   a premium out of income and a lump sum at death — simple to model, widely used, genuinely standard.
4. **AIM / BPR holdings.** Now only 50% relief (effective 20%), so much weaker than its reputation.
   Easy to add as an account flag. Worth including partly *to show it is no longer the shelter people
   think it is.*
5. **Trusts.** Out of scope. Genuinely complex, needs legal advice, and modelling them badly would be
   worse than not modelling them.

---

## 4. What gets built

### 4a. Config additions (rules, not personal facts)

```
iht: {
  nrb: 325000, rnrb: 175000,
  taperThreshold: 2000000, taperRate: 50,      // £1 lost per £2 over
  rate: 40, charityReducedRate: 36, charityThresholdPct: 10,
  pensionsInEstateFrom: 2027,                   // the 6 April 2027 switch, so pre-2027 deaths model correctly
  bprCap: 1000000, bprReliefAboveCap: 50, aimRelief: 50,
  giftExemptAnnual: 3000, giftSmall: 250, taperBands: [...]
}
```

All of it belongs in Config beside the income-tax bands, with the same "these are the current published
figures, override them if you disagree" framing already used there.

### 4b. Inheritance tab inputs (personal facts)

- **Age at death**, defaulting to Plan-to-Age minus a stated margin, with the multi-age comparison above.
- **Beneficiary table**: name, relationship (4 categories), share %, expected income. Shares must total
  100% — validate, don't silently normalise.
- **Home value and whether it passes to a direct descendant** (RNRB is about the *home*, not the estate).
- **Predeceased spouse's unused NRB/RNRB percentages**, for widows and widowers. Commonly overlooked and
  worth up to £500,000.
- **Post-tax bequest floor** (the advanced counterpart to the existing pre-tax one).
- **Gift schedule** (phase 2).

### 4c. Engine

A new `estateAtDeath(ctx, rows, deathAge)` returning gross estate, per-wrapper split, IHT due,
per-beneficiary post-tax inheritance, and the effective rate on each wrapper. It runs on the terminal
row plus the beneficiary table — no changes to `stepYear`, so the simulation is untouched.

Then: **`inheritance` becomes a seventh priority** in the ranking built this session, using post-tax
inheritance rather than the current gross-pot proxy. That is a one-line addition to `PRIORITY_METRICS`
now that the ranking exists.

### 4d. The rerun

Re-run the 360-household library with post-tax inheritance as the ranking objective. Specifically:

- Add beneficiary variants to the scenario library: spouse-only, children (basic rate), children
  (higher rate), mixed, and one with a charity legacy at the 10% boundary.
- Test the Pension First hypothesis from §1.
- Check whether any policy is dominated *once inheritance is the objective* — the answer to that will
  differ from the survival-first answer, and that difference is the tab's justification.

### 4e. Documentation

A `doc-inheritance` section: the rules table with sources, the 2027 change and why it inverts the usual
advice, the 75 cliff, the four relationship categories, and — matching the pattern just established for
priorities — **which policy each inheritance goal pushes towards, and why**. Plus an explicit statement of
what is *not* modelled: trusts, business succession, domicile, and anything requiring legal advice.

---

## 5. Order of work

1. Config rules + `estateAtDeath` + tests. No UI. Gets the arithmetic right and testable first.
2. The rerun and the Pension First hypothesis. **Do this before building the tab** — if the effect is
   small, the tab should be smaller than planned.
3. Beneficiary table and the tab.
4. `inheritance` priority wired into the ranking.
5. Gifts out of surplus income.
6. Documentation.

Steps 1–2 are the ones that generate knowledge. Everything after is construction.

---

## 6. Risks

- **These rules change every Budget.** Three of the four regimes here changed in 2025–2027. Everything
  goes in Config with visible dates and sources, and the docs must say when they were last checked.
- **This is close to advice.** The existing "educational and illustrative only" disclaimer needs to be
  louder here than elsewhere, and the tab should avoid imperative wording ("you should gift…").
- **Precision implies confidence.** A post-tax inheritance figure to the pound, resting on a guessed
  death age and a guessed beneficiary income, is false precision. Round hard and show ranges.

---

## Sources

- [GOV.UK — Inheritance Tax on pensions: technical note](https://www.gov.uk/government/publications/inheritance-tax-on-pensions-technical-note/technical-note-inheritance-tax-on-pensions)
- [Womble Bond Dickinson — Major IHT changes for pensions from April 2027](https://www.womblebonddickinson.com/uk/insights/articles-and-briefings/major-inheritance-tax-changes-pensions-april-2027)
- [M&G — IHT on unused pension funds and death benefits](https://www.mandg.com/wealth/adviser-services/tech-matters/government/inheritance-tax-on-unused-pension-funds-and-death-benefits)
- [Rathbones — Business Property Relief and AIM: the latest changes](https://www.rathbones.com/en-gb/wealth-management/knowledge-and-insight/business-property-relief-and-aim-changes-inheritance-tax)
- [Withers — What to do about the 6 April 2026 changes to Business Property Relief](https://www.withersworldwide.com/en-gb/insight/read/what-to-do-about-the-6-april-2026-changes-to-business-property-relief)
- [Crowe UK — Inheritance Tax gifting rules](https://www.crowe.com/uk/crowefinancialplanning/insights/inheritance-tax-gifting-rules)
- [Which? — Can you inherit an ISA?](https://www.which.co.uk/money/savings-and-isas/isas/cash-isas/can-you-inherit-an-isa-aytHW5W6vWrK)
