# What keys the guard, read (18 Nov): a DB pension does not bring the harm; rent brings it on one couple

EXPLORATORY, seed 7002, deciding nothing in the app (D129 (4); the rule `GUARD-KEY.md`, committed in d92ccea9 before any
unit was landed or run; the read whole in `results-guard.txt`).

## In plain words

D128's guard keeps a couple on the app's rules when the two are more than three years apart and the plan has other
taxable income. It rested on step 5:
- today's couples' default (K2) lost to the app's rules (APP) on three couples 8 or 12 years apart with a `£15,000` a year
  DB pension;
- it beat them on the four as far apart without one.

This test gave those four (S149 and S337F at gap8 and gap12) that DB pension from the state pension age, then `£15,000`
a year of rent from now instead. Each couple was landed again so the app's rules survive about 85%, and run on 4,000
simulated markets.

**What it found:**
- **With the DB pension, today's default still does better than the app's rules on all four.**
  - Pooled `+7.150` points of survival (`+6.867` to `+7.402`).
  - By couple: S149@gap8 `+6.325`, S149@gap12 `+4.350`, S337F@gap8 `+9.575`, S337F@gap12 `+8.350`.
  - By the rule: **NO HARM**. So the DB pension does not bring the harm on these couples, and the guard is keyed on the
    wrong thing.
- **With rent from now instead, the default does worse on one of the four.**
  - S149@gap12 `-6.850` (`-7.622` to `-5.984`).
  - The other three gain or are level: `+0.450`, `+0.875`, `+3.525`.
  - Pooled `-0.500` (`-0.912` to `-0.085`).
  - By the rule: **HARM**. So the guard's reach past a DB pension holds on these couples: one of the four is harmed.
- **Without either income** (step 5, at their own landings), the same four were `+10.744` pooled.
- **Beside, deciding nothing:**
  - the app's guard answers "gapincome" on all eight, as built;
  - on the paths both keep, the default spends more than the app's rules on all eight (`+0.92%` to `+2.66%`);
  - the capped pot is higher on seven and lower on S149@gap12+rent (`-3.828%`).
- **What brings the harm is not shown.** The default has now lost to the app's rules on four couples:
  - S147-db at gap8 and gap12 and S061-dbpart at gap12 (step 5), and S149@gap12 with rent (here);
  - on the other eight gap couples with an income it gained or held level: step 5's S061-dbpart@gap8 and seven here;
  - no key fits the four: two have the first person's DB pension, one the partner's, one rent; and the same incomes do
    no harm elsewhere.

## What it leads to, by the rule

- **+db NO HARM: the guard is keyed on the wrong thing.** Re-keying it comes back to the maintainer as a change of default,
  with this read. Nothing in the app changes until that is ruled.
- **+rent HARM:** the guard's reach past a DB pension holds on these couples.
- **Item 5 (the card's words) waits.** It was to follow "if the guard stays", and the guard's key is now the
  maintainer's.

## The choice, for the maintainer

- **Keep the guard as built for now.** It errs towards the app's rules: the four harmed couples are kept safe. It also
  keeps couples on the app's rules where the default gains, as it did with a DB pension on all four here.
- **Re-key it now.** No key fits what has been seen. A key on the age gap alone would also bar the four gap couples
  without an income, which gain `+10.744` pooled.
- **Find the cause first.** A decomposition of the default's loss on the harmed couples, EXPLORATORY. Two comparisons:
  - S149@gap12 with rent against S149@gap12 with the DB pension: they differ in the income's start and their targets;
  - S147-db@gap12 against S149@gap12 with the DB pension: they differ in the base couple.
- **The agent recommends:** keep the guard as built, and find the cause before re-keying.
  - The household plan may make this moot. It beat the app's rules on step 5's three harmed couples (`+12.575`,
    `+10.900`, `+9.250`), and its remedy's read is queued tonight.
