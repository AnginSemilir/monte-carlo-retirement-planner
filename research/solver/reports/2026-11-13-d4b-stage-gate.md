# The couples' re-run: the stage gate refused (13 Nov): a STOP for the maintainer

## What happened

- The registered re-run (`registrations/couples-d4b.md`, seed 7021) finished its first stage at 01:02 UK on 13 Nov: all
  200 first-stage chunks are in and on `d4b-backup`. A container restart about 00:10 UK stopped the first window with
  150 chunks finished; none was lost, and the run resumed at 00:15 UK on the same stamps.
- The registered stage gate (`stage-couples.mjs`) then **refused and decided nothing**:
  "S293: SHIPC and APP on different plans" and "S293: CANDC and APP on different plans", at both estate weights. The
  batch stopped there. No second stage has run and the read has not been made.
- **No outcome of seed 7021 has been read, printed or estimated.** The gate prints no survival and no difference when
  it refuses; the only lines read are its five refusal lines and the batch's own.

## The cause, from the plans alone

`d4b-plan-check.mjs` builds each arm's plan as the audit builds it, on the launch tree's code, and reads no file of the
run and no path of seed 7021. Its output whole: `results-d4b-plan-check.txt`.

- For S293 the arms' plans differ in **one field: the second person's MPAA age**, 58 in the solver arms' plan and 60 in
  arm A's. With every owner's MPAA age left out, the three arms hash the same.
- Why they differ: the engine derives the MPAA age from the plan's own expected path (`resolveMpaa`: the first year a
  taxable pension draw is made). Arm A's plan runs with guardrails on and the lookahead at 5; the solver arms' plan is
  resolved with both off. On S293 that moves the second person's first draw by two years. The other 39 couples resolve
  the same ages in every arm.
- Whether it moves money: the MPAA only caps pension contributions above its limit. S293's contributions are below it
  for both people, and arm A's plan run on the tuning seed with either age gives the same outcome on every path (the
  figures are in the results file).
- So the gate was right by its rule (the arms' hashed inputs differ) and the difference is a derived label that changes
  nothing the engine does on this couple.

## What the registration allows

Nothing, as written. Every route forward changes a file the run's stamp covers (the audit, the stage gate, the read or
the panel), and the gate and the read refuse chunks on another stamp. This is the maintainer's (D81 (F): a STOP).

## The options

1. **Amend the gate and the read for this one known difference; keep the 200 chunks.** A dated amendment to the
   registration, reviewed by the `reviewer` agent before it is used: the plan check accepts a couple whose arms' recorded
   hashes are exactly the two this check prints for S293 (the difference shown to be the MPAA age alone, moving no
   money), the first-stage chunks stay valid on the launch stamp, and the amended files carry a planted test. Cost: a few
   hours and no cores. The record then holds a registered run whose gate was changed after launch, before any outcome
   was read, for a reason written down and reviewed.
2. **Fix the cause in the audit and run the first stage again.** The solver arms take arm A's resolved MPAA ages, so
   every arm agrees by construction; the couples are landed again (arm A does not change, so the targets should not),
   the design review looks at the change, and the 200 chunks run again: about twelve hours of four quiet cores. For 39
   couples the new chunks would be the same numbers as the ones in hand. The record is a clean registered run; the
   present chunks stay unread on `d4b-backup` and are deleted after the read.
3. **Drop S293 from the panel.** Not recommended: it changes the registered panel and still needs option 1's or 2's
   machinery.

## The agent's recommendation

Option 1, with option 2 as the fallback if the reviewer fails the amendment. Nothing has been read, so the amendment
cannot be steered by an outcome; the difference moves no money; and option 2 spends half a day of cores to recompute
numbers that are already in hand. The class is fixed for the next registered couples' test either way: the audit's
solver arms will take arm A's MPAA ages from item 6's stage C on.

## Meanwhile

The cores are free. They go to the first batch's merge gate (D92), the harvest ceiling's step 4 and item 12's stage A
(EXPLORATORY, other couples, seed 7002), none of which touches the re-run or its seed.

## Ruled (13 Nov, D94 (1))

The maintainer: "Proceed with your recommendations". Option 1 is carried out as
`registrations/couples-d4b-amendment-1.md` sets it out; the `reviewer` agent sees the amendment before the amended gate
is run; option 2 is the fallback if its FAIL stands after one fix.
