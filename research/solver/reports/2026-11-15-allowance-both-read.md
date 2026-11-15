# The allowance's step at both places, read (15 Nov): FAILS

EXPLORATORY, seed 7002 (D98; `ALLOWANCE-BOTH.md`, its rule committed before launch at bb2c48dd). The read whole is
`results-allowance-both.txt`; the figures beside it, written after the read and deciding nothing, are
`results-allowance-both-beside.txt` (`allowance-both-beside.mjs`). Every figure below is printed in one of those two files.

## In plain words

Since the harvest ceiling (13 Nov), a pension draw "to the personal allowance" stops where the year's whole tax bill would
first rise, counting the year's interest and dividends. The test of that change found it cost tax on the households with
most in their taxable accounts, for a larger pot, and the question went to the external review: should the solver be
offered the allowance at its old place as well as its new one? D98 built that offer, off in code, and this read tried it on
the review's eight households, 16,000 paths each.

**What it found:**
- **Survival is a hair higher:** +0.019 points pooled (+0.002 to +0.035), beyond noise. Spending is level (+0.0059 points of
  target).
- **The pot below the cap is a little lower:** -0.187% pooled, against the rule's bar of 0.1%. That fails part 4. The mean
  pot over all paths is -0.155%, inside its own bar of 0.5%.
- **Both effects are mostly one household's, S090's.**
  - S090 carries 54.2% of the summed survival gain and 71.3% of the summed fall in the capped pot (its capped pot -1.130%).
  - Without S090, part 4 would hold (the pot -0.162%, the capped pot -0.061%). The gain would go too: pooled survival
    +0.010 (-0.004 to +0.023), and the rule would read NO GAIN.
  - On S090 the solver's own whole score is +0.047 (-0.044 to +0.138): it trades a little capped pot for a little survival,
    the trade the ceiling-lead test found on 13 Nov.
  - All of this is beside the rule and decides nothing.
- **Tax moves both ways.** S090 pays less (£74,608 to £68,519 on average) while its capped pot falls; S188 pays more
  (£180,950 to £189,190). Pooled, lifetime tax is £84,890 under the candidate and £85,333 with the offer.
- **Where the solver takes the new moves:**
  - The re-wrap to the allowance at its old place: on S030 and S090 in 2,028 of 5,600 and 1,820 of 7,200 decision-years
    over the first 200 paths.
  - The read's count of years "drawing first through" the old allowance does not measure the new draw. It counts every
    move whose pension draws pass the new rung: 40 of the 60 base moves. Only 10 of those are the new draw. The other 30
    are the old ladders with the rung between, and on these runs they drew exactly what they drew before. So S188's 1,510 such years
    mix the two, and the units do not split them.
  - S188 re-wraps to the old place in 73 of 8,200 decision-years. Its capped pot is £4,624 lower and its tax higher, and
    the cause is not shown. The old engine-wide allowance (RAWPA, beside) moves S188's capped pot by -£24 and its tax by
    +£268 (beside, section F).
- **RAWPA against the candidate is the ceiling-lead test's comparison again.** Both arms' tables and stored figures are
  those of the 13 Nov units byte for byte (beside, section E). Its +0.020 survival and -0.244% capped pot are that test's
  finding, not a new one.
- **The solve takes x1.06 the time**, the menu 1,200 moves against 800.

**By the rule:** FAILS, so the offer is closed and reported, and nothing changes. The allowance step stays where the harvest
ceiling put it.

The external review's question is answered "no" for this panel, but only by the rule's bar on the capped pot. On S090, the
household that decides it, the solver's own score takes the trade: a little more survival for a little less pot below the
cap. The bar was set on the capped pot because that is where the ceiling-lead test found the trade (`ALLOWANCE-BOTH.md`),
and it declines it.

## The read

`reduce-allowance-both.mjs`, once, its gate fair: 8 households, code 6b2dc56b2f82, audit 07b1ad74d638, seed 7002, 16,000
paths, 45 points, the candidate 17ff82379838. Launched 15 Nov 05:35 UK through the launcher on frozen code, its runs done
07:21 UK, no unit exiting with an error.

The code moved between the rule's commit (bb2c48dd, code be2f925c8252, `runs.log`) and the launch (28a38c6a, code
6b2dc56b2f82). The two commits between, 4ada22b4 and da4669d8, touch a couple's cut and a partner's blank income end age,
and reach no single's plan. The evidence that they reach neither NOW nor RAWPA is that both arms' tables and stored figures
are the 13 Nov ceiling-lead units' byte for byte (beside, section E).

| part | the bar | BOTH against NOW |
|---|---|---|
| 1. pooled survival | lower end above -0.1 | +0.019 (+0.002 to +0.035): holds |
| 2. a household wholly below -0.3 | none | none: holds |
| 3. pooled spending | not lower by more than 0.05 points of target | +0.0059: holds |
| 4. the pot, the capped pot | not lower by more than 0.5%, 0.1% | -0.155%, -0.187%: **fails** |
| 5. a gain | the whole score's or survival's lower end above nought | the whole score +0.014 (-0.003 to +0.030); survival's lower end +0.002: holds |

**ALLOWANCE-BOTH OUTCOME: FAILS (4).** By hand, no figure sits at a bar where floating point could decide it: the capped
pot's -0.187% is clear of its -0.1%, and the survival bars are on interval ends.

## Beside the rule, deciding nothing

- **The capped pot by household** (`results-allowance-both-beside.txt`): S090 -£15,369 (-1.130%), S188 -£4,624 (-0.253%),
  S328F -£1,378 (-0.111%), the other five within £300 either way.
- **Also in the beside file:**
  - part 4's two halves without each household in turn (section B);
  - each household's survival change and the rule on the seven without S090 (section C);
  - the menu the draw count reads (section D);
  - the identity with the 13 Nov units (section E).
- **Each household's line in each arm**, lifetime tax over all paths and over those at or below the cap, how often the new
  moves are taken, and RAWPA against NOW and against BOTH are in the read.

## What it does not show

- It covers the review's eight households, 16,000 paths of the tuning seed and one estate weight.
- It does not show why the offer lowers S090's pot below its cap while it cuts its tax.
- It does not show what S188's fall is.
- **BOTH is not the candidate with the new moves simply added.**
  - With the solve on anchors (the candidate's), a cell's shortlist is widened one step along the leading pension run.
  - In NOW the step after `penPA` is `penPA+penBasic`. In BOTH it is the new rung, and the old ladder is two steps away.
  - So BOTH's approximate solve over the old moves differs from NOW's as well as offering the new ones. How much of BOTH
    against NOW that accounts for is not shown; S188 is where it could show.
  - The read is of the option as the candidate's route solves it, which is what the rule asks, so the outcome stands.
- **BOTH has no exact copy of the old band ladders.**
  - Once a person's interest and dividends for the year pass the basic-rate band, a ladder through the new rung draws
    pension to the allowance as given before going on. The old ladder stops lower.
  - So in such a year BOTH has no move that draws as NOW's band ladder does, and the tables are solved on such cells too.
    `ALLOWANCE-BOTH.md`'s "NOW's moves are BOTH's less the new ones" holds in what was drawn on these runs, not for the menu
    as built.
  - The reviewer's second round (its own probe, `reviews/2026-11-15-read-allowance-both-2.md`) found NOW's tables would
    have taken a ladder BOTH lacks on S328F and S340F only, never on S090, which decides the FAIL. So the outcome does not
    move.
- **No forward run beside the engine.** The audit held its runs to the engine's own trial (`runPath` against
  `E.runTrial`) on the first 200 paths, on survival and lifetime tax. Both are the engine's year. That the forward run and
  the engine agree under the new moves rests on `allowance-both.test.mjs` checks 4 and 5: seeded random moves on that
  test's households, not these eight's solved policies.

## Files

`ALLOWANCE-BOTH.md` (the rule), `audit-allowance-both.mjs`, `batch-allowance-both.sh`, `reduce-allowance-both.mjs`,
`results-allowance-both.txt` (the read whole), `allowance-both-beside.mjs` and `results-allowance-both-beside.txt` (beside
it, written after the read; sections B to E added for the reviewer), `reviews/2026-11-15-read-allowance-both.md` (the
reviewer at the read: FAIL, one BLOCKING, the take-up sentence, answered above with its five MINORs in one fix), and
`-2.md` (the reviewer again: PASS, two MINORs, answered: "on these runs" above, the band ladders' line, and RAWPA by household
printed in section F).
