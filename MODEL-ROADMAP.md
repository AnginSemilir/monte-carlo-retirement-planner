# Model roadmap

Things the engine does not yet price, kept here so they are not rediscovered from scratch each time.
Each entry says what the lever is, what the tab would have to learn, and whether it is worth building.

---

## Equity release

Borrowing against the home creates a liability that is deductible from the estate, and puts cash in
hand that can be given away. Two effects run in opposite directions and the tab currently models
neither: the debt reduces the taxable estate immediately, while the interest rolls up against the
property for as long as the borrower lives.

What the engine would need:

- A secured-debt entry against the home: amount, draw date, fixed rate, and roll-up vs serviced.
- The balance compounding through `stepYear`, and the outstanding amount deducted in `ihtWorkings`
  before the bands are applied.
- The residence nil-rate band tested against the home's value *net* of the charge, which is where the
  arithmetic usually turns.

Worth noting before building it: on a short prognosis the deduction is the whole of the benefit, and
the cash raised still needs seven years to leave the estate as a gift. The lever only pays where the
borrower is expected to live long enough for the gift to clear, or where the money is spent rather
than given. That is a narrow band, and the tab should say so rather than offer it neutrally.

**Priority: low.** Real, but it helps a minority of plans and the roll-up modelling is not trivial.

---

## Deeds of variation

Section 142 IHTA 1984 lets a beneficiary redirect part or all of their inheritance within two years of
death, and the redirection is read back as though the deceased had made it. Section 62(6) TCGA 1992
does the same for capital gains. It is the one planning lever that still exists *after* death, and the
tab is silent on it.

It matters most where the beneficiaries are higher earners than the deceased, or where an inherited
pension would land on top of a large salary — exactly the shape the beneficiary income modelling
already detects and reports.

What the engine would need:

- A per-beneficiary "would redirect to" option: a named descendant, a grandchild, or charity.
- Re-running the estate with the varied shares and reporting the difference, on the same
  before-and-after footing the gift ladder already uses.
- A flag on the beneficiary card where redirecting would obviously help, keyed off the income figures
  already entered.

**Priority: medium.** It is cheap to model, because it reuses the existing share machinery, and it is
the only lever left once someone has died — which is when many people first open a tool like this.
The tab should be clear that the instrument itself is a legal document with required wording, not
something the model produces.

---

## The State Pension against the National Insurance record

The State Pension is entered as a figure and paid out as entered. Nothing in the model asks how many
qualifying years stand behind it, so the amount does not move when the plan does — and the retirement-age
solver is exactly where that bites, because its whole job is to move the year work stops.

The full new State Pension takes 35 qualifying years. A plan that answers "you could stop at 50" is
quietly assuming a record the household may not have, and overstating income from their State Pension age
onward by up to the full amount. Step 3 now says so in words, escalating to a hard warning when the solved
age leaves fewer than 35 years even counting an unbroken record from 18 — but a warning is not a
calculation, and the figure on the projection is still the one typed in.

What the engine would need:

- Qualifying years to date as an input, alongside the amount — the one number a forecast already gives
  people, and the only one that makes the rest derivable.
- Years accrued between now and retirement counted from the employment already modelled, so the entitlement
  moves when the retirement age moves.
- The entitlement recomputed as `min(35, years) / 35` of the full rate, with the transitional starting
  amount for anyone with pre-2016 service handled as a floor rather than ignored.
- Voluntary Class 3 contributions as a one-off cost with a matching uplift, since that is the actual
  decision the warning is pointing at.

**Priority: medium.** The input cost is one field and the arithmetic is simple. What makes it more than
cosmetic is that it removes a caution and replaces it with an answer — and it is the only part of the
retirement-age slide that currently asks the reader to check something themselves.
