# Where the sweep puts a couple's cash ISA money: the check before the couples' re-run (EXPLORATORY)

D87 and D88 (12 Nov). Item 5's experiment (`ISA-SWEEP.md`, the review of 9 Nov) measured the sweep's two fixed rules on
singles only; D73 made the sweep to the ISA the candidate's default on that read. A couple's joint move now carries the
same sweep (0b047efd), and the couples' registered re-run (`registrations/couples-d4b.md`) is landed and piloted on it.
Nothing has compared the two on a couple. The maintainer asked whether a fixed rule is the best way here and whether we
are sure. This run measures the part of that which can be measured today, before the held-out panel is spent.
EXPLORATORY, seed 7002. The rule below is committed before launch, with the audit, the batch and the reducer.

## The question

For a couple, does solving and running with spare cash ISA money swept to each person's own ISA (the candidate as ported)
cost survival, or leave the couple poorer, against sweeping it to the taxable account (as before D73)?

## What it cannot answer, said first

Whether a sweep the solver chose year by year would beat both fixed rules. That has never been built. The reasons none
is built first:

- **The destination.** A cash ISA transfers to a stocks and shares ISA without using any allowance, the ISA's growth and
  draws are untaxed, and both wrappers can be drawn at any age. So for the same pounds invested the same way, the ISA is
  never worse than the taxable account in tax, in access or in allowance. An optimiser offered both would take the ISA.
- **What is a real choice.** Two things: how much is kept in cash, and how the swept money is invested. The first is
  the cash buffer, a standing rule of the plan (D18), the same in every arm of every test so far, for singles and
  couples alike. The second the solver already holds: money in the ISA takes the tier the table picks for the ISA,
  where money in the taxable account keeps the plan's fixed mix. That is why the two rules can differ in survival at
  all (the review's guess in `ISA-SWEEP.md`), and it is what this run measures on couples.
- **So a sweep on the menu** would add the buffer's size as a choice, for singles and couples both. That is a new lever
  with its own experiment, not something the couples' re-run turns on. It is recorded for the maintainer
  (`DECISIONS-PENDING.md`) and not built.

## The design

- **Code:** the working branch as it stands (code 1d5d2421c9ab, the code the panel was landed on; nothing under `src/`
  changes for this run), launched on frozen code through `run-from-snapshot.sh` with `PREDICTION="none:..."`.
- **Couples:** twelve. Of the library's couples that are touched (`held-out.mjs` `touchedAll`) and outside the panel, the
  twelve with the most cash ISA money at the start (the engine's fresh state, both people), ties in the library's order:
  S059, S035, S175, S235, S415, S053, S173, then three of the same sum (S079, S091, S391), then the first two of the next
  sum (S017, S029). Each as the library enters it. No panel couple is run.
- **Arms:** GIA, each person solved as the app solves them at 45 points with `sweepCashIsaTo: 'gia'` handed to the solve
  (the sweep to the taxable account; the other reading); ISA, the candidate as ported, the couple's joint move carrying
  the sweep (the first reading; what the registered run's CANDC is). Each couple solved under each arm; each solved
  couple run by the engine. `COUPLE.flat` and `COUPLE.fast` on, as the registered run has them.
- **Paths:** 4,000 of seed 7002 a couple, the same paths for both arms (paired). As `ISA-SWEEP.md` took them.
- **Recorded:** each arm's sweep read back from each person's solved table (the option in its meta, the moves carrying
  it), and what the engine swept over the first 500 paths (to the ISA, to the taxable account). Each arm held to
  `E.runTrial` on its first 200 paths.
- **Read:** survival; spending delivered (lifetime, as a share of the lifetime target); the mean pot left; lifetime tax.
- **Size:** 24 solves of a couple and 96,000 engine paths: about 6 core-hours.

## The rule (`ISA-SWEEP.md`'s, as written for singles, read by the same code)

Write d for a couple's survival under ISA less under GIA, in points, paired on its 4,000 paths.

1. **Pooled survival:** the mean of the twelve couples' d, with its 95% interval from the couples' paired variances. Its
   lower end above -0.2 points.
2. **No couple harmed:** no couple's paired 95% interval for d (`stats.mjs` `survivalChangeU`) lies wholly below -0.5
   points.
3. **The pot left:** the twelve couples' mean pot left under ISA, averaged over couples, not lower than under GIA.

The sweep to the ISA passes for couples if all three hold. Beside them, deciding nothing: spending delivered, lifetime
tax, and the couples with a lower pot or an observed loss.

## The outcomes (D88)

- **Passes:** the first reading stands (D87). The couples' re-run is launched as registered, from a tree at the
  registration's commit, the code not having moved. This run's read goes to the maintainer with the launch.
- **Fails on survival (1 or 2), or on the pot only (3):** STOP. The re-run is not launched. The read goes to the
  maintainer with the couples named; the other reading would mean a small code change, landing, the pilot and the
  design review again.
- **The gate is not fair:** STOP and report.

A rule that fails is reported; it is not changed and the run is not made again to pass it (D81 (F)).
