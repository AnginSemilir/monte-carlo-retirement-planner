# The gain bucket on the candidate's taxable-account moves: design and cost (D49; EXPLORATORY, not run)

For the maintainer's go-ahead (D49: "sized and brought to the maintainer before it runs"). Open item GAIN-BUCKET.

**Question.** Does reading the taxable account's gain share at its nearest bucket (5, 25, 55%) cost the candidate survival
or spending? D47's look found it reversing giaTiers' switches on S330 (research only, off). The candidate's own moves on
that account (the yearly sweep into the ISA, the draw order, HR's re-wrap) read the same bucket, and nobody has measured
what that does to its outcomes.

**Arms.** Two, paired on the same paths:
- CANDD, the candidate as it stands (d71f65ae871e);
- CANDGI, the same with the gain axis interpolated (`gainInterp: true`).

The fair-test gate's row 17 (gain buckets) is the one difference. The comparison runs on one code, one stamp.

**Households.** Phase 4's 40. Every one holds a taxable account. As a share of wealth it is 45% on 12, 10% on 8, 5% on
12 and 2% on 8.

**Run.** Seed 7002 (tuning), 4,000 paths, the estate weight 0.02, 45 points, through the launcher with
`PREDICTION="none:EXPLORATORY measurement (D49)"`.

**Reported, not gated.**
- Survival and lifetime spending delivered, CANDGI less CANDD, paired: the panel and each household.
- The taxable account's moves a path (sweeps, switches, re-wraps) under each arm.
- How often a path's gain share crosses a bucket's edge.
- The solve's time, CANDGI against CANDD.

A gain beyond noise on the panel, or on a household, comes back to the maintainer as a proposal (a registered held-out
test before any default moves). A null closes GAIN-BUCKET as measured.

**Cost.** Taken from the tier test's CAND units (`results/tiers`: 40 households, 8,000 paths, seed 7002, the same machine
type): the solves took 4.6 core-hours and the engine 6.5. At 4,000 paths that is about 7.9 core-hours an arm, so about
16 core-hours for both, or 4 to 4.5 hours on 4 cores.

`gainInterp`'s own cost to the solve is not yet known. A pilot on two households (about 20 minutes) measures it before
launch, and a cost more than a quarter above this estimate comes back first.

Smaller option: the 20 households whose taxable account is 10% of wealth or more. That is about 8 core-hours, or 2 hours.

**Build.** An arm in the curve audit's pattern and a reducer with its fair-test gate. About two hours.
