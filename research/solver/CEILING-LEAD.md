# The harvest ceiling's allowance step: is it what raises tax below the cap? (EXPLORATORY; its rule, committed before launch, 13 Nov)

EXPLORATORY, seed 7002 (the tuning seed), deciding nothing in the code. It is the test the reviewer named at the
harvest ceiling's step 4 read (`reviews/2026-11-13-read-harvest-ceiling.md` finding 2), run with the tie-break above the
estate cap in every arm (the reviewer on D95, finding 6: the ceiling's pass was read before the tie-break joined the
candidate).

## The question

The ceiling passed its rule and is on `main`. At the read, on paths that end at or below the estate cap, lifetime tax
rose on the three households with most of their money in the taxable account (S030, S090, S328F). The reviewer's lead,
from the code and not shown: the allowance's ceiling now stops where the year's bill would first rise, so the slice of
pension the solver used to draw just past that point, at a few percent, is no longer on the menu, and the next step up
is the basic-rate ceiling. Is that step the cost?

## The run

`audit-ceiling-lead.mjs`, through the launcher, `batch-ceiling-lead.sh`; read by `reduce-ceiling-lead.mjs`.

- **Households:** the review's eight as Phase 4 landed them, as in step 4.
- **Arms.** One tree, the working branch's (the candidate with the tie-break, D95). Each arm solves the household at
  45 points as the app does and runs the solved plan on the same 16,000 paths of seed 7002. The arms differ in one
  function, `pensionCeiling`, in the engine each is handed (the solver's model and forward run call the engine's):
  - **OFF**: it returns the ceiling it is given: every ceiling on the non-savings income alone, as before the ceiling;
  - **RAWPA**: the allowance's ceiling as before (returned as given), the bands' ceilings as now;
  - **NOW**: the engine as it is.
- **Stored:** each path's survival, spending delivered and target, pot left and lifetime tax; the household's opening
  wealth; for each arm what its `pensionCeiling` returns at the allowance and at the basic-rate ceiling with interest
  and dividends present (read back, not taken from the arm's name), its tables' digest and its settings.

## The gate

One code, audit stamp, seed, path count and points across the eight; every arm on the household's plan at the same
settings, its arrays one a path; each arm's `pensionCeiling` read back as its arm says (OFF both raw; RAWPA the
allowance raw and the band adjusted; NOW both adjusted, the band's the same as RAWPA's).

## The rule

On each of S030, S090 and S328F, over the paths that end at or below the cap (four times opening wealth) in all three
arms, the mean lifetime tax T. The rise is T(NOW) less T(OFF); the allowance step's part is T(NOW) less T(RAWPA); each
with its paired 95% interval by path.

1. **Reproduced?** The rise is above nought, its interval wholly above nought, on at least two of the three. If not:
   **NOT REPRODUCED** with the tie-break in; the lead is closed, and the figures go in the record.
2. Otherwise, over the households where the rise is reproduced, the share: the sum of the allowance step's parts over
   the sum of the rises.
   - `0.5` or more: **THE ALLOWANCE STEP IS THE COST**;
   - under `0.2`: **NOT THE ALLOWANCE STEP**;
   - between: **PART OF IT**.

Beside the rule, deciding nothing in this run:

- `HARVEST-CEILING.md`'s four parts on the eight, NOW against OFF (the ceiling's own rule again, the tie-break in both
  arms), and RAWPA against OFF and against NOW by the same four parts;
- each household's line in each arm: survival, spending delivered, the mean pot, the pot capped at the estate cap,
  lifetime tax over all paths and over the paths at or below the cap.

## What each outcome changes

- **The allowance step is the cost, or part of it:** nothing changes in the code here. It becomes a question for the
  external review, with the figures: whether the menu should offer the allowance's step at its old place as well as its
  new one (the solver then pricing the slice itself), and what RAWPA does to survival, spending and the pot beside NOW.
  The ceiling as built stays, having passed its rule.
- **Not the allowance step, or not reproduced:** the lead is closed in the record; no further test is opened on it.
- **The ceiling's own rule, NOW against OFF with the tie-break in both arms:** if any of its four parts fails here, it
  is reported to the maintainer at once with the read whole (the ceiling is on `main`; a rule that fails is the
  maintainer's, D81 (F)). The exploratory read does not itself take it out.

## Budget

About 100 minutes on four cores (24 solves and 384,000 paths; step 4's two arms took 66 minutes). Time box: half a
day, the smoke run and the read included.
