# Morning summary: the night of 27 to 28 Sep (kept current through the night)

## 7x: read (results-7x.txt; the gate passed; the ledger 27 Sep 22:17)

**In one sentence:** tables held at one tier for life price lowering risk at 79% (S126) and 97% (S194) of what it
actually buys. The free-switching tables see only a fraction, so the likely culprit is the free-switching assumption.
For the product itself that stays grade C until the tier-state solve (7y) is measured. More market worlds change nothing.
On share 0.95 the held tables see 21%, but 7x's design fixed that figure (the reader's opening chance is the same in both
arms), so it is **not** evidence for the 5-point blind spot. That is tested separately (7z).

| item | outcome | the numbers (results-7x.txt) |
|---|---|---|
| 1. free switching (FS) | HELD | held tables see 0.790 (S126) and 0.970 (S194) of the realised gain |
| 2. three worlds (W) | FALSIFIED | five worlds move the tables' difference 0.98 and 0.99 times |
| 3. the Q control (share 0.95) | HELD | held tables see 0.206 of the gain: a second error there |
| 4. the sign control (S360, off) | FALSIFIED | off's held tables read S360 at 0.61% against 41.06% simulated, and they favour lowering risk (+0.33) where it loses 12.86 points (O37) |

**What it means for the held tier (O37 and O38).**
- Under off (the product's read), a held tier in the solved state would likely take S360's de-risk and lose. So 7y
  carries S360 under off as a harm leg.
- Holding the plan's tier for life does worse than the product on three of the four cases. It does better on S360
  (results-7x-held.txt). So 7y's sizes come from the product's own arm, not from 7x.

Scorecard for 7x: Brier 0.218 over 4 items. Cumulative: 0.221 over 63 (results-scorecard.txt).

The reader's pessimism on share 0.95 (O36, results-7x-o36.txt) persists with the tier held for life: 15 of 16 worlds
read more than 2 points low, and at worst 14.33 points low. So switching does not explain it, and neither does the
number of worlds.

## The deep review after 7x (22:32 UK) and the path from here

It had the auditor's corrections (O37-O39) before it concluded. What it found:
- **share 0.95's pessimism (O36):** it is the bridge reader's opening estimate p0 (72.6/82.3/89.5% by world, against
  the table's 69.3/82.0/89.5; results-o36-p0.txt). The chooser never reads that number. So 7x's item 3 is **not**
  evidence for the blind spot; I've amended the ledger.
- **The blind spot (Q):** it is real and sits in the chooser. At the 80% spend level, lowering risk is worth +2.02
  points next year by a fine average and +0.005 by the product's 5 points (results-o35-diag.txt).
- **Why the parked fix did nothing:** it only acted at grid points, none of which is near share 0.95's opening. Its
  check measured the wrong thing. The part that matters, the chooser, is kept, with new tests.
- **The held tier:** "hold for life" is the wrong design, because the product's later switching is worth a lot
  (O39). The build is a **tier state**: one table per tier, with the chooser's own switching cost and margin
  charged in the backward pass.
- **7y** separates the tier's gain from everything else with swapped arms: TS-TIER and TS-REST, as in 7r.

The order:
1. Q's fix is revived and 7z runs.
2. The tier state is built; there is no 7y tonight if it is not pinned by 01:45.
3. 7y runs and is read.
4. A deep review on both reads.
5. The combination is at most registered, **not run tonight**, because it can't be run and read by 7am.

## Tonight's runs (kept current)

- **7z (Q's fix alone): READ 28 Sep 00:03 UK; all four items HELD** (results-7z.txt; Brier 0.059; cumulative 0.211
  over 67).
  - On share 0.95 the fix saves 205 paths of 8,000 and loses none (+2.56 points). The year-0 gap rises from 2.3e-4 to
    2.0e-2, so the solver now opens de-risked at the product's margin.
  - On S126 and bridge 4 it changed **nothing**: the same paths, gaps and tables (O40). So its "no harm" there says
    nothing about the fix where it would act, and S126's own harm is untouched by it.
  - S194, with no bridge, is identical to the bit, as it should be.
  - It is a research option only; nothing goes to a default.
- **7y (the tier state):** built as a research option (solve.js tierState; its test passes 15 of 15, and all 31 solver
  suites pass on it). The plan-auditor needed three passes to accept the registration. On the way it found a real design
  limit (**O41**): the tier state applies the switching margin **per world**, while the chooser applies it to the
  mixture. So a negative 7y result will not clear free switching. The deep review after 7z said to launch as registered,
  with that named as a premise, because rebuilding would add a second change. **Launched 00:40 UK.**
- **Beside 7y:** a measurement of S360 with the reader, reading its bridge at the held tier (O36's gate). I am also
  building a joint version of the tier state (TS+J) for a **tables-only** check that bounds O41 after 7y. It gets no
  survival test tonight without you.
- **S360 with the reader (O36, measured 01:05; results-refs360.txt):** the reader's opening reference uses the plan's
  tiers. That **flips the sign** on S360: the held tables rate lowering risk **+1.0** point better, where the runs lose
  **13.2** points (1,053 paths lost). With the reference at the held tier, the tables rate it **16.0** points worse, the
  right way. So the tier state (7y), which reads every tier at the plan's reference, may well harm on S360 with the
  reader. If it does, that harm is the reference's, not the tier state's (grade C).
- **The combination of the two fixes** is registered only if every condition the deep review set holds by about 04:30.
  Otherwise it comes to you as a design.

## Things to tell you

- **The order was changed.** The order first put to you for Q's fix in parallel was revised for its review (the ledger
  27 Sep 21:29 row); the revision narrows what you were shown.
- **Q's fix: the first attempt is parked.** It is in drafts/q-step-exact.patch. Its test failed check C for a reason
  still unexplained. An earlier note gave a reason; it rested on an unsaved probe at the wrong bill and is withdrawn.
- **gaussHermite(201) underflows.** Its weights sum to 3.6e-162, which voided the first O35 diagnostic run
  (kept as results-o35-diag-first.txt). The diagnostic now uses 4,000 equal-probability points. A related find: the
  product's 5-point weights are printed to six decimals and sum to 0.999999, a bias of 1e-6, below materiality.
- **hooks.test.mjs timing check.** It failed twice under the batch's load (2.10 s and 2.20 s against its 2 s limit).
  Both commits passed when retried. It was not bypassed. The check is locked, so any change to it is yours.
