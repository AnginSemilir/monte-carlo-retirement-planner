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

## 2a. RESULT: the hypothesis was wrong, and the tab is justified anyway

Step 2 has been run: 360 households x 5 beneficiary profiles x 2 death ages = 3,600 rankings on
post-tax inheritance. The prediction in §1 does **not** survive.

**Pension First wins 6 of 3,600 (0.2%).** Draining the taxable wrapper early is not merely unhelpful,
it is the worst thing on the board: on one wealthy household it leaves £6.2m where the best policy
leaves £13.5m. The reason is one the commentary about 2027 tends to skip - emptying a pension early
means paying income tax at YOUR OWN marginal rate, during retirement, on a large pot, and the proceeds
cannot be sheltered fast enough because the ISA allowance is £20,000 a year. Leaving it invested costs
40% IHT plus the beneficiary's rate, but only on what remains after decades of untaxed compounding.
The double charge is real; it is still cheaper than volunteering for the single one early.

So the 2027 change does not invert the advice. **What it does is make the answer depend on facts the
app never asked for**, which is the actual case for the tab:

| | winner on post-tax inheritance |
|---|---|
| Death at 74 (pension not yet taxable on the heir) | Sequential 59% |
| Death at 80 (pension taxable on the heir) | Bracket Fill Basic 28%, Bracket Fill 24%, Sequential 21%, Windfall to ISA 21% |
| Heir is a grandchild with no income | Sequential 59% |
| Heir is an additional-rate taxpayer | Sequential 31%, Bracket Fill Basic 26%, Windfall to ISA 20% |

Sequential's dominance collapses from 59% to 21% across the 75 boundary. Same household, same money,
two years apart.

And the app's current ranking is measurably wrong for this purpose: **ranking on the gross pot picks a
different policy from ranking on post-tax inheritance in 24.8% of cases.** The stakes are not
rounding - the median gap between best and worst surviving policy is £240,291, and the choice is worth
more than £100,000 to the heirs in 66% of cases.

The tab should therefore be built around **"when, and to whom"** rather than around a drawdown
recommendation. That is a different emphasis from §4b and the input list should be read with it in mind.

---

## 2a-bis. The beneficiary's own tax, modelled properly

The first version charged the inherited pension at the beneficiary's CURRENT marginal rate. That was
wrong in both directions, and badly:

- Someone with **no income was charged nothing at all** on any size of pot, because their marginal rate
  at zero income is zero. Drawing £400,000 in a single year would really cost them £166,203. The model
  forgot that the withdrawal *is* the income.
- Someone on £70,000 was charged a flat 40% on the whole pot, when spreading it over several years keeps
  much of it in the basic band.
- A **spouse was charged nothing**, because income tax was skipped for every IHT-exempt relationship.
  The inheritance tax exemption does not reach the beneficiary's own income tax on what they draw: a
  widow inheriting a pension after a death at 75 or over pays it like anyone else.

It now charges the extra tax they actually pay on their income plus a share of the pot, each year, for
the years they spread it over (default five). That grants a non-earner their personal allowance every
year, which is exactly why leaving a pension to someone without an income is so much less punishing:

| heir | tax on a £400,000 pension | they keep | taken |
|---|---|---|---|
| no income at all | £85,160 | £284,840 | 29% |
| modest job, £25k | £122,730 | £247,270 | 38% |
| higher earner, £70k | £177,855 | £192,145 | 52% |
| retired at 70 (state pension uses the allowance) | £109,112 | £260,888 | 35% |

**It changes the recommendation.** Gross pot and post-tax inheritance now pick a different policy in
**37.8%** of cases, up from 24.8% under the cruder model — a better tax model makes the gross figure a
*worse* proxy, not a better one. Sequential's share of wins falls from 40.1% to 31.7%, and Windfall to
ISA rises from 12.6% to 18.5%.

The assumption is stated on screen: it holds only if the beneficiary's circumstances stay roughly as
they are across those five years. Someone about to retire, start a business or come into other money
would face a different bill.

---

## 2b. Two decisions taken before building

**Couples are modelled as two deaths.** The first is spouse-exempt and passes on the unused percentage
of both bands; the tax lands on the second. For the *estate arithmetic* that collapses neatly to "the
survivor's estate with doubled bands", which is what `estateForCouple` does and what the tests check.
What it does **not** collapse is the projection: after a first death the survivor loses a personal
allowance, a set of bands and a state pension, and modelling that is a change to `stepYear`, not to the
estate function. So the estate side is done; the projection side is phase 2 and is called out as a
known gap rather than quietly ignored.

**Property is modelled, including sale during retirement.** A home value plus a "passes to direct
descendants" flag, because the residence band is worth up to £175,000 each and is unavailable without
one — omitting it would have made the model pessimistic for exactly the homeowners most likely to use
it. Downsizing releases cash into the plan, so the sale connects to the drawdown model rather than
sitting beside it: a sale year, a sale value, and the proceeds landing in a wrapper the policy chooses.

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

## 3b. Credit and exemption mechanisms beyond the bands

Researched September 2026. These are the cases where an estate of identical size pays a completely
different amount, for reasons the band arithmetic cannot see.

### Quick Succession Relief — build this

The mechanism described as "IHT credit". Under s.141 IHTA 1984, where someone inherits assets on which
inheritance tax was paid and then dies within five years, the tax on the **second** death is reduced by
reference to the tax paid on the first, on a sliding scale:

| Years between the two deaths | Relief |
|---|---|
| under 1 | 100% |
| 1–2 | 80% |
| 2–3 | 60% |
| 3–4 | 40% |
| 4–5 | 20% |
| 5+ | none |

Two things make this worth building rather than noting. It is **not applied automatically** — it must be
claimed, so a household that does not know it exists loses it outright. And it is squarely relevant to
this app's users: someone who inherited from a parent shortly before their own death is the exact case,
and the relief can be worth six figures.

Inputs: whether anything was inherited in the last five years, its value, the IHT paid on it, and the
date. Four fields, self-contained, and the calculation slots into `estateAtDeath` as a reduction to the
tax rather than a change to the estate.

### Death on active service — build this

A **full exemption** from inheritance tax, not a relief: s.154 IHTA 1984 covers armed forces personnel
dying from a wound, accident or disease contracted on active service, including where an earlier
condition was aggravated by service. Extended since 19 March 2014 to emergency services personnel and
to anyone deliberately targeted because of their job or status.

One checkbox, and it takes the bill to zero. Cheap to build and enormous when it applies.

**A correction worth recording**, since the brief paired these: a war widow's or widower's pension is
**tax-free income**, not an inheritance tax mechanism. It does not affect the estate calculation at all.
The IHT-relevant armed-forces provision is the active-service exemption above. Two different things that
sit near each other in conversation.

### Double taxation relief — build if cheap

Foreign assets taxed abroad attract a credit against UK inheritance tax, either under a treaty (France,
Netherlands, Ireland, Italy, India, Pakistan, South Africa, Sweden, Switzerland, the United States) or
by unilateral relief where no treaty exists. Two inputs — foreign asset value and foreign tax paid —
and a credit capped at the UK tax on the same asset.

Note the scope rule it depends on: since 6 April 2025 worldwide assets are in scope for anyone UK
resident in 10 of the previous 20 tax years. Without that test the foreign asset should not be in the
estate at all, so the two belong together.

### Warn about, do not model

- **Gifts with reservation of benefit.** Giving away the house and continuing to live in it does not
  remove it from the estate. This is the single most common planning mistake and deserves a warning
  next to any gifting feature, not a calculation.
- **Woodlands relief**, **heritage conditional exemption**, **fall-in-value relief** on assets sold at a
  loss after death. All real, all narrow, and all requiring facts a planning tool has no way to hold.

The general rule for this section: model what a household can state as a fact about themselves, and warn
about what needs an adviser. QSR and active service are facts. A reservation of benefit is a judgement.

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
