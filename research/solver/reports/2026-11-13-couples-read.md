# The couples' re-run, read (13 Nov): PASS, and what sits beside it

## The outcome

The registered re-run (`registrations/couples-d4b.md`, seed 7021; amendment 1 for S293's one plan difference, D94 (1))
was read once on 13 Nov. Its output whole: `results-couples-d4b.txt`. The gate is fair.

On 40 held-out couples, each landed where the app's rules survive about 85 in 100, the candidate for couples against the
app's rules:

| | estate weight 0.02 (the standard aim) | estate weight 0.01 |
|---|---|---|
| survival | +10.008 points (9.540 to 10.477) | +9.927 points (9.458 to 10.395) |
| spending delivered over the plan | +6.485% (6.395 to 6.575) | +7.618% (7.525 to 7.711) |

Both items pass at both weights, so the outcome is **PASS**: by the registration the candidate for couples comes to the
maintainer, who decides whether couples run it under the switch. No couple is flagged for harm or for spending. Every
couple and weight was far enough ahead after the first stage to stop there, so the read rests on 5,000 paths a unit.
The solver's own model of a couple's path agrees with the engine on survival on every path checked (80,000).

The figures match the singles' Phase 4 closely (+10.7 points and +6.5% there).

## What the outcome does not say (the reviewer at the read: PASS, seven MINORs)

`reviews/2026-11-13-read-couples-d4b.md`. Its figures below are recomputed from the run's stored arrays; the read itself
does not print them.

1. **A couple spends less early.** In the first five retired years the candidate spends 92.5% of the target against
   98.2% under the app's rules, and spends 9.8 years at the 80% floor against 5.1. The spending gain is earned later, and
   by surviving. This is the singles' shape, and the wording decided for singles (D44 (2): a safe starting spend, back
   at target by a year) applies. The read's "cost years" line (-9.7% at the standard weight) is this early cut, not an
   effect of the one-off cost.
2. **The pot left is much smaller.** The mean pot left is 0.18 of the app's rules' pooled over the 40 couples, and lower
   on 36 of them; the couples' median pots are about 0.73 of the app's at the standard weight. Lifetime tax is 1.17
   times, and many times higher on some couples. This is the behaviour already found for singles: above the estate cap
   the solver places no value on more money, so it gives it away in spending and tax. The tie-break built to stop that
   (item 13, D90 (1)) was not in any registered couples' arm (D80), and as built it sits in a single's chooser, not in a
   couple's joint move, so porting it will not by itself change a couple's path.
3. **Scope.** The gain is the gain at the landing: a couple whose plan as entered survives far more or far less than 85
   in 100 will see a different figure. About nine-tenths of the survival gain is solving at all (the couples' solver at
   the product's settings reaches 93.6% where the candidate reaches 94.5% on the same 1,000 paths). No decomposition was
   run, so nothing here says how much is the tier changes. Every couple of the panel holds 60/40, so the read says
   nothing for a couple outside 40% to 60% (M4 keeps those on the app's rules until item 6's test).
4. **Some paths are lost.** 75 paths at the standard weight and 164 at the lower are lost under the candidate that the
   app's rules keep, against about 20,000 saved. Three adjacent younger couples (S307F, S309F, S311F) lose theirs in one
   year, their ninth in retirement; the rest fail the minimum pot in the last year or two. Not harm by the rule; a lead,
   with the deep review.

## The deep review (`reviews/2026-11-13-deep-couples-d4b.md`)

Its figures are recomputed from the run's stored arrays; no new path was run. Where it names a cause it says what is
inferred and what is shown.

- **The PASS is sound** for survival and for spending over the whole plan: every one of the 40 couples gains, +7.3 to
  +14.2 points, the singles' Phase 4 figure for figure. About 2.2 of the 10 points are failures on the minimum pot in
  the last year. It does not show a better estate.
- **The smaller pot is probably the tiers, not the giveaway above the cap.** This corrects point 2 above. Where the
  solver values the pot (capped at four times opening wealth) the candidate's mean pot is 1.03 of the app's rules', and
  the lowest tenth is higher on all 40 couples. The fall is above the cap, and largest for the younger couples (their
  median pot 0.52 of the app's). Extra tax and spending explain about 2% of that gap; the couples' solver at the
  product's settings shows the same pot. What is left is that the solver holds lower-risk funds than the plan's own,
  which gives up growth on the paths that end rich. Inferred: the run stored no tier. The tie-break cannot reach a
  couple as built, and on this reading it would not restore the pot anyway; it is a tax matter (lifetime tax is 1.34
  times the app's on the younger couples, on paths ending rich).
- **The paths lost in one year are an engine defect, not ruin.** On the three younger couples the household ends those
  paths with millions; the shortfall is a few hundred pounds. By the code, a person's capital gains bill may be paid
  from their own cash, taxable account, ISA and pension and from either person's cash, but never from the other
  person's ISA or pension, so a second person whose pension is still locked can owe a bill nothing may pay, and the
  path is counted as failed. Inferred from the code and the amounts; no path was replayed. It is in every arm (the
  app's rules have the same class in other years), and is 0.015 to 0.030 points here.
- **Its one test** (not launched): the couples' tier test. Eight of the panel's couples, the candidate with consent to
  change risk withdrawn beside the candidate and the app's rules, seed 7002, 4,000 paths, about five core-hours,
  storing each person's tier by year. The tiers are the cause if, with consent withdrawn, the younger couples' median
  pot is at least 0.85 of the app's; not if under 0.65.

## The agent's recommendation

Couples run the candidate under the opt-in switch, after:

1. **the engine defect is fixed**, with a test of its class shown failing first (a bill the household can plainly pay
   is paid), and its effect sized on the library;
2. **the couples' tier test** (EXPLORATORY, its rule committed first), run when item 12's stage A frees the cores. If
   the tiers are the cause, nothing in the solver changes and the couples' screens show the pot beside the survival
   figure, with what withholding consent does to each. If not, a tie rule for a couple's joint move is built and read
   first, and couples keep the app's rules meanwhile;
3. the tie-break joins the candidate for singles (D90 (1), the reviewer on the change of default);
4. item 6's stage C, the registered test for couples outside 40% to 60%;
5. Part D's D5, the couples' screens.

A couple outside 40% to 60% keeps the app's rules until item 6 reads (M4). The agent carries on with 1 to 5 in that
order; switching couples on waits for the maintainer's word.
