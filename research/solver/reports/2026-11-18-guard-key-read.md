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
a year of rent instead, typed as starting now. Each couple was landed again so the app's rules survive about 85%, and run
on 4,000 simulated markets.

The rent started now on only two of the four. The engine counts an income from its owner's retirement at the earliest
(`src/App.jsx` `buildContext`, `incomeFloor`). S149's first person is 56 and already retired, so their rent ran from plan
year 0. S337F's first person is 37 and retires at 52, so their rent ran from plan year 15 (`results-guard-beside.txt`).

**What it found:**
- **With the DB pension, today's default still does better than the app's rules on all four.**
  - Pooled `+7.150` points of survival (`+6.867` to `+7.402`).
  - By couple: S149@gap8 `+6.325`, S149@gap12 `+4.350`, S337F@gap8 `+9.575`, S337F@gap12 `+8.350`.
  - By the rule: **NO HARM**. So the DB pension does not bring the harm on these couples, and the guard is keyed on the
    wrong thing.
- **With rent instead, the default does worse on one of the four**, pooled `-0.500` (`-0.912` to `-0.085`). By the
  rule: **HARM**. So the guard's reach past a DB pension holds on these couples. By when the rent starts:
  - **from now (S149's two):** level at gap8 (`+0.450`) and harmed at gap12 (`-6.850`, `-7.622` to `-5.984`); pooled
    `-3.200` (`-3.834` to `-2.541`);
  - **from 52 (S337F's two):** `+0.875` and `+3.525`; pooled `+2.200` (`+1.768` to `+2.595`).
  - The outcome rests on S149@gap12, where the rent does start now.
- **Without either income** (step 5, at their own landings), the same four were `+10.744` pooled.
- **Beside, deciding nothing:**
  - the app's guard answers "gapincome" on all eight, as built;
  - on the paths both keep, the default spends more than the app's rules on all eight (`+0.92%` to `+2.66%`);
  - the capped pot is higher on seven and lower on S149@gap12+rent (`-3.828%`);
  - the end pot runs the other way (`results-guard-beside.txt`): the default's mean end pot is below the app's on all
    eight, by `29%` to `40%` on S149's four and `88%` to `90%` on S337F's, and its median is below on six.
- **What brings the harm is not shown.** The counts below are the gap couples'. In step 5 the default also lost on
  S061-dbpart at penB90 (`-10.175`) and penA100 (`-2.850`), both with the partner's DB pension, and the holdings guard
  keeps both on the app's rules. Among the gap couples, the default has now lost to the app's rules on four:
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
  - Each pair also differs in arm A's own pick, which moves the app's rules alone. Arm A takes the full lump sum on all
    four harmed couples, and on six of the twelve unharmed gap couples (`results-guard-beside.txt`). So the lump sum is
    not a key, but a decomposition would have to hold the pick fixed or name it.
- **The agent recommends:** keep the guard as built, and find the cause before re-keying.
  - The household plan may make this moot. It beat the app's rules on step 5's three harmed couples (`+12.575`,
    `+10.900`, `+9.250`), and its remedy's read is queued tonight.

## The reviewer at the read

FAIL, one BLOCKING and three MINORs (`reviews/2026-11-18-read-guard-key.md`), all in this write-up and each answered
above in one fix. The read's figures and outcome stand: the reviewer recomputed every unit from the arrays, and found the
rule's files unchanged since their commits and the landings after the rule. The figures the fix needed are printed by
`guard-beside.mjs` into `results-guard-beside.txt`.
1. **BLOCKING:** the rent started now on S149's two couples only. On S337F's it ran from the first person's retirement
   at 52. The write-up now says which start each had, with each pair's pooled figure.
2. **MINOR:** the end pot runs against the capped pot, and is printed beside it.
3. **MINOR:** the counts are the gap couples'; step 5's two losses outside them are named.
4. **MINOR:** arm A's own pick also parts the comparisons offered.

The reviewer again (`reviews/2026-11-18-read-guard-key-2.md`): PASS, no findings. Both scripts reproduce their files byte
for byte, and the outcome rests on S149@gap12 with rent: without it, +rent pools `+1.617` and reads NO HARM.
