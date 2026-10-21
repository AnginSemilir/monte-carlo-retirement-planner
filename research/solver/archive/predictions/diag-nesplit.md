# Prediction: diag-nesplit

- **Run:** `research/solver/batch-nesplit.sh` - results/diagnesplit/case0-2.txt and the three units' files (audit-nesplit.mjs, S364 at 0.02 and 0.01, bridge 4 at 0.02), reduced by reduce-nesplit.mjs into results-nesplit.txt
- **Kind:** test
- **Written:** 10 Oct, before the run (its time is its registering commit's, git log); the maintainer, 10 Oct, the session: 'Go ahead', to running NE-SPLIT before a fresh seed is spent on 7u-F
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): 8,000 paths a unit, the same paths for every opening and both arms' unforced runs; its first 2,000 paths again for the per-world runs, each world's long-run shift put in, the same for every opening. 7u's held-out seed is refused by the audit; no held-out seed is spent.
- **Unmasking:** none: the test changes no setting and removes no known error; it reads the candidate's own tables at S364's year-0 state, scores four openings by their parts, and forces each in year 0 with the candidate's own moves after it, so every comparison is between openings inside one arm's tables and continuation (the attribution the deep review asks for before any part of the candidate is blamed for S364's loss, PLAN.md O132)
- **Mechanism:** reader.js:10 "* with ln D taken as normal with D's exact first two moments (worked backward from the last bill:" (NE-SURV: the reader's survival read at the near-dead bridge edge; PR15); solve.js:1504 "const Ln = r.tsLayers ? r.tsLayers[r.tsLayerOf[ai]] : null;" (NE-TS: each move reads its tier pair's next-year layer; item 3 swaps it); solve.js:1009 "b += QW[zi] * rd[1];" (NE-NS: the estate blend over dead corners; PR12). How often each applies on S364: results-derive-nesplit.txt section 1 prints CAND's year-0 opening two steps down in both wrappers at both weights and its move off that tier in year 1 on 5815 of 8000 paths at 0.02 and 5554 at 0.01 (the tier-state layer acts on every path's year-0 read; the reader on every bridge year)
- **Plan section:** PLAN.md "NE-SPLIT", O132, PR13-PR16, items/7u.md (10 Oct)

## Question

Why do the candidate's tables choose S364's opening - two steps down in both wrappers at a higher year-0 spend than the shipping default's - when that opening loses 31 of the shipping default's 34 surviving paths on 7u's held-out seed (O132)? Split the choice by its parts in the candidate's tables (survival, estate, resilience, shortfall and trim, the switch charge), by the year-1 held-tier layer, and in simulation by the de-risk against the spend, with bridge 4 as the control where the candidate's table is calibrated.

## Derivation

What the mathematics and the existing records say, with the scripts that computed any figure.

- **The records** (results-derive-nesplit.txt section 1, 7u's files behind 7u's gate): on S364 the candidate against the shipping default reads 0 saved/31 lost at 0.02 and 0/28 at 0.01; the candidate opens at tier code 10 (pension 2, ISA 2) at a level of 0.90 (0.95 at 0.01) where the shipping default holds code 0 at 0.80; the candidate moves tier in year 1 on 5815 of 8000 paths at 0.02; every failure in both arms is a run-out, none the plan's end below its minimum pot (CAND 0/7997, SHIP 0/7966 at 0.02). The candidate's year-0 table reads 4.8605 against the simulated 0.04, the shipping default's 0.0383 against 0.42 (results-7u.txt). On bridge 4 at 0.02 the candidate's table reads 99.7554 against 99.76: calibrated, so the control.
- **The tables are seed-free:** the solve reads no simulated path, so the candidate's tables at 30 points are 7u's; its own opening at 30 points is the one 7u's traces show (pension 2, ISA 2 at 0.90 and 0.95), and the table's own quantities (item 3, and dT and G in items 1 and 2) carry no sampling error; items 1 and 2 also read the simulated change d, which does (item 2 reads its corrected gap at both ends of d's interval). The build check at 4 points chose the plan's tiers at 0.80 (a coarser grid's tables, declared in Provenance), so the four openings collapse there; at 30 points they do not.
- **G is at least 7u's year-0 gap** (grade A, by the code): 7u's gap is the smallest switch margin at which CAND keeps its held tiers, its opening's chooser score less its best staying move's (audit-7u.mjs openGap; solve.js l.1388-1409), and SS is one staying move, so G = chooser(own) - chooser(SS) is that gap or more; how far above is judged (derive-nesplit.mjs's gMult), and item 2 turns on it (Power).
- **The parts are exact:** scoreMoves scores a move as sv + wR rs + wB bq - h (solve.js l.1520-1521); with wB and wR set to 0 the score is sv - h, with wR 1 it is sv + rs - h, so h and rs follow, and the audit's partsSum check rebuilds every table's score from them within 1e-12 relative. The chooser then subtracts the switch charge from a move that leaves the held tiers (solve.js l.1388-1392), so its score is the mixture-weighted score less the charge; chooserTop checks the candidate's own opening is the best of the four by it.
- **The forced runs are the candidate's own:** runPolicy's start takes the forced move in year 0 and the solver's own move after it (solve.js l.1555-1567); forceIdentity checks that forcing the candidate's own opening reproduces its unforced run on every path, so any difference between openings is the opening's.
- **The checks, each failed on a planted fault first:** reduce-nesplit.mjs's 40 planted checks (`node research/solver/reduce-nesplit.mjs --planted`, EDGES printed), and the audit's two plants, each refused by the preflight (Provenance): partsum moves CC's estate part, which carries wB (resilience carries wR, 0 in both arms, where a plant could not show); force runs the other-tier partner of CAND's own opening in its place, and forceIdentity compares each path's survival, failure kind and fail year or end wealth. partsSum checks the parts' arithmetic only: h is the residual, so a misread survival part could not show in it (declared).

## Prediction

- **Item 1 HELD (NE-SURV):** at both weights its own opening loses to SS on the same paths by at least a quarter of a point (the loss reading by the exact test) while the candidate's table sees at most a quarter of that loss (its survival gap above -0.1 points).
- **Item 2 HELD:** at both weights, with the table's survival difference replaced by the realised one, the chooser would prefer SS even at the least loss in d's interval.
- **Item 3 FALSIFIED:** the swapped year-1 layer leaves at least half of the chooser's gap at both weights (the held-tier layer does not carry the preference).
- **Item 4 HELD:** in simulation the de-risk's loss reads (SC against SS) and the de-risk loses to the spend on the same paths (SC against CS) at both weights.
- **Item 5 HELD:** on bridge 4 the table's survival ranking of the candidate's opening against its other-tier partner does not disagree in sign with a simulated difference that reads.

## Falsified if

- **Item 1 FALSIFIED:** at both weights the loss reads and the table sees at least half of it (dT at or below d / 2). INCONCLUSIVE otherwise when not HELD (the loss not reading or short of -0.25, or the table seeing between a quarter and a half).
- **Item 2 FALSIFIED:** correcting the survival read leaves at least half the chooser's gap at both weights even at the most loss in d's interval. INCONCLUSIVE otherwise when not HELD (including whenever d's interval spans the flip).
- **Item 3 HELD (the prediction missed):** the swap leaves no gap at both weights. INCONCLUSIVE when it shrinks the gap below half but not to 0, or own holds the plan's tiers.
- **Item 4 FALSIFIED:** at both weights the spend's loss reads and the spend loses to the de-risk on the same paths. INCONCLUSIVE otherwise when not HELD.
- **Item 5 FALSIFIED:** the signs disagree and the simulated difference reads (p below 0.05). INCONCLUSIVE when they disagree without reading.

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison). Rows that are SAME may be deleted: then keep the line "- **All other rows: SAME**" below the
table (every other status is written out, with its reason).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 13 | The risk tier chosen, consent to change it, risk above | the year-0 opening at the plan's tiers (0/0) | the same spend two steps down (2/2) | TESTED - the de-risk, the thing items 3 and 4 split; every later year the candidate's own move in both |
| 18 | The spending menu and the tier menu | the year-0 spend at SHIP's own level (0.80) | at the candidate's own level | TESTED - the spend, the thing item 4 splits; the menus themselves the candidate's in every opening |
| 26 | Which rivals, and each one's rule and parameters | the four openings, each forced in the candidate's tables and continuation | SHIP's unforced run beside them | ONE ARM ONLY - SHIP enters only to name SS's spend level and as a reported unforced run; no item compares an opening with SHIP's run |
| 32 | The table's number is never the result: survival is simulated | item 3 reads the candidate's table parts alone; items 1 and 2 set them beside the simulated change d | items 4 and 5 read simulated survival | ACCEPTED - the question is the table's own ranking of the openings, so item 3 reads the table by design, and items 1 and 2 set the table's survival part beside the simulated survival of the same openings (item 2 at both ends of d's interval) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (primary; single look; the deep review's NE-SURV test, amended on the plan-auditor's BLOCKING 1 of 10 Oct 08:13 UK):** dT = sv(own) - sv(SS) in points in the candidate's tables; d = the paired survival change of own against SS on the same 8,000 paths, its exact one-sided McNemar p for the loss (stats.mjs mcnemarHarmP), Holm over the two weights. A weight MISREADS when the loss reads (Holm p below 0.05, lost above saved), d <= -0.25 and dT > -0.1 with dT >= d / 4; it SEES when the loss reads and dT <= d / 2. HELD when both misread; FALSIFIED when both see; else INCONCLUSIVE.
- **Item 2 (primary; single look; amended on the plan-auditor's BLOCKING 1 of 10 Oct 18:14 UK):** G = chooser(own) - chooser(SS); Gc = G - dT / 100 + d / 100, the gap with the table's survival difference replaced by the realised one, read at both ends of d's unconditional 97.5% interval (stats.mjs survivalChangeU, alpha 0.05 over the two weights). HELD when at both weights G > 0 and Gc at the interval's upper end (the least loss) is below 0; FALSIFIED when Gc at its lower end (the most loss) is at least G / 2 at both; else INCONCLUSIVE.
- **Item 3 (primary; single look; deterministic):** Gs = the swapped chooser(own) - chooser(SS), own read through its plan-tier partner's year-1 layer. HELD when Gs <= 0 at both; FALSIFIED when Gs >= G / 2 at both; else INCONCLUSIVE (and when own holds the plan's tiers).
- **Item 4 (primary; single look; amended on the plan-auditor's BLOCKING 2):** D = SC against SS, P = CS against SS, X = SC against CS on the same paths, each exact one-sided, Holm over the eight (both directions of X). HELD when at both weights D's loss reads and SC loses to CS; FALSIFIED when at both weights P's loss reads and CS loses to SC; else INCONCLUSIVE.
- **Item 5 (the control; single look):** own against its other-tier partner at the same spend on bridge 4 at 0.02; dT and the paired survival, two-sided exact (the smaller one-sided p doubled). FALSIFIED when the signs disagree and p < 0.05; INCONCLUSIVE when they disagree and p >= 0.05; HELD otherwise.
- **Reported, not items:** every opening's parts and swapped parts, its table survival by world beside its simulated survival by world (PR16), its survival part in SHIP's tables, failures by kind (a run-out; the plan's end below its minimum pot), the reader's meter (PR15), both arms' unforced runs paired.
- **NOT SETTLED**, if the gate fails (reduce-nesplit.mjs's header): the stamps; a unit missing, repeated or not done; a ran line off the candidate's or the product's settings, the registered points or the unit's weight; the arms at different menus, grids or minimum pots; an opening or the own line missing; a self-check short of every read or path; a run's sim line or file missing, or its bits not the log's.
- **Declared choices, not derived:** the four openings (the review's design); item 1's lines (-0.25 and -0.1, the review's; a quarter and a half of the realised loss); the half-gap lines in items 2 and 3; alpha 0.05 with Holm; the single look.

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1 and 2 HELD | NE-SURV leads: the candidate's survival read at the near-dead bridge edge misses a real loss and that alone decides the opening; O132's cause recorded at grade B (one seed); a near-edge fix is designed only after the maintainer's answer on PR13 and is tested on a fresh seed; 7u-F and the fix's test go to the maintainer together | 0.22 |
| item 3 HELD, item 2 not HELD | NE-TS leads: the tier-state layer carries the preference; the charge accounting goes to its own decomposition (the layer against the charge), registered before any change to the tier state | 0.16 |
| items 2 and 3 FALSIFIED | neither the survival read nor the layer carries it (NE-NS or other): NS-PROP, already re-scoped onto the candidate by NS-CAND's census, is registered with S364 and bridge 4 deciding | 0.05 |
| else | the unsettled items named; the parts printed decide the next split, registered as its own test; nothing goes to the maintainer unless a part reads | 0.57 |

- **Waiver:** none needed: the chance the action changes is 0.43 (one less 0.57, the likeliest row), above a quarter

## Decision fed

The decision table's rows decide (the plan-auditor's MINOR 3 of 10 Oct 18:14 UK); each item's own reading adds only this:

- **Items 1 and 2 HELD (row 1):** NE-SURV is recorded as O132's leading cause (grade B, one seed); the STOP list on S364 lifts for the cause, not for a fix.
- **Item 3 HELD with item 2 not HELD (row 2):** NE-TS leads, whatever item 1 reads; item 1 HELD then is recorded beside it as a second effect, not the cause.
- **Items 2 and 3 FALSIFIED (row 3):** NS-PROP on the candidate is registered next.
- **Any other combination (row 4):** the unsettled items are named and the next split registered on the parts printed; item 1 FALSIFIED (the table sees the loss) is recorded against NE-SURV whatever the row; nothing goes to the maintainer unless a part reads.
- **Item 4 HELD or FALSIFIED:** the de-risk or the spend names the part of the candidate S364's loss follows (STOP's 'blaming any one part' lifts only for that part, on S364); INCONCLUSIVE leaves it with both.
- **Item 5 FALSIFIED:** the method misreads where the table is calibrated: items 1-4 are NOT SETTLED until the misread is explained; HELD or INCONCLUSIVE leaves them as read.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F still waits for the maintainer's unlock and PR13's answer.

## Provenance

- **The design:** the deep review after 7u (deep-review-log.md 10 Oct 04:17 UK), its decisive test NE-SPLIT and its STOP list; PLAN.md's NE-SPLIT row (PROPOSED 10 Oct; the maintainer's 'Go ahead').
- **The build:** audit-nesplit.mjs (d39e6ae; its per-world paths moved to the tuning seed in 64a923b, since 7003 is Phase 4's), reduce-nesplit.mjs, derive-nesplit.mjs, batch-nesplit.sh and preflight-nesplit.sh (64a923b; derive-nesplit.mjs's no-point form 2137e3c; the amendments 1901a97, 990a06f, 01f16e4 and 5daa9a8).
- **Seen before registration (declared):** 7u's results in full (results-7u.txt) and the deep review's figures; NE-SPLIT's build check at 4 points, 40 paths and 10 a world (runs.log 10 Oct), whose own opening at 4 points was the plan's tiers at 0.80 on all three units (the four openings collapsing to two) and whose table and simulated figures at that grid were seen; the derivation's output (results-derive-nesplit.txt), run before the per-item judged lines below were written (the JUDGED block in derive-nesplit.mjs, its inputs, was written before its first run and extended after it, each time to carry an amended item's inputs: its blind and sees lines in 1901a97 after the first output, its table positions in 01f16e4 after the second, its G and dT stories in 5daa9a8 after the third; the plan-auditor's MINOR 5 of 10 Oct 18:44 UK). A container restart on 10 Oct lost this file and the plan row's edit before they were committed; both were rewritten unchanged, and 7u's files restored from the 7u-results checkpoint reproduce results-7u.txt byte for byte.
- **Amended before launch** on the plan-auditor's FAIL of 10 Oct 08:13 UK (review-log.md): items 1, 2 and 4 and the decision table rewritten (BLOCKINGs 1 and 2), the judged lines withdrawn (BLOCKING 3: they were written after the derivation had run), the plants fixed (MINOR 4), row 3 reconciled with NS-PROP's row (MINOR 5); the derivation re-derived from the amended reducer (1901a97).
- **Amended a second time before launch** on the plan-auditor's FAIL of 10 Oct 18:14 UK: item 2 read at both ends of d's interval, the four statements that called it sampling-free corrected, items 1 and 2 simulated through items() in the derivation (BLOCKING 1); the Decision fed made to follow the table (MINOR 3); NS-CAND read into the plan (MINOR 4).
- **Amended a third time before launch** on the plan-auditor's FAIL of 10 Oct 18:44 UK: item 2 derived over G at and above 7u's gap and a blind table's dT, with the G it needs stated (BLOCKING 1); a planted case at item 2's FALSIFIED end (MINOR 2). The preflight's A runs the reducer as of its launch; its B and C are unchanged by this amendment (the audit is not touched).
- **Also seen before launch (declared):** NS-CAND's measurement (results-nscand.txt, 990a06f), read into the plan's NS-PROP row; the fifth preflight's plant log at 4 points, whose parts lines (table survival, estate and score of each opening at that grid) were read while the partsum plant was debugged.
- **Launch 1 refused, the audit fixed, nothing read:** the first launch (runs.log 10 Oct 19:20 UK) stopped on bridge 4 at the audit's own guard: its own opening (level 0.8, tiers 2,2) carried a withdrawal recipe other than the first at its level and tiers, and the openings were built from the first, so it was none of the four. Every opening, and the reported SHIP-side lookup, now takes every part of the move other than the spend and the tiers from CAND's own opening, as the fair-test table already requires (row 13: 'the same spend'; all other rows SAME). The gate refused the launch, so nothing was read; S364's two finished units are kept unread in results/diagnesplit-launch1 and all three units run again on the fixed audit. Same pattern searched: every research/solver script that finds an action by its level and tiers (grep of levelOf against a level inside 1e-12) - only audit-nesplit.mjs's two lookups, both fixed. The preflight at 4 points could not show it (its own openings there are first-recipe).
- **The preflight:** preflight-nesplit.sh on the tuning seed at 4 points, after the amendments (runs.log 10 Oct 18:29 UK, the seventh launch; its output results-nesplit-preflight.txt): A, planted (39): all read as they should, EDGES printed; B, GATE: passed - the three units once and done at the registered settings (4 points, 40 paths, 10 a world, seed 7002), every self-check passed, every file the log's; C, the plant partsum: refused (exit 3; a self-check failed), the plant force: refused (exit 3; forcing CAND's own opening did not reproduce its run). The first to sixth launches were stopped or failed before a full read: the restart, a lost results file, the amendments, and the fifth's partsum plant not refused (fixed in 990a06f).

## Derivation script

- `derive: research/solver/derive-nesplit.mjs > research/solver/results-derive-nesplit.txt sha256 6a9692c75e6813b6`
  (7u's S364 and bridge 4 records behind 7u's gate, the power of items 1 and 4 under the loss and split stories through reduce-nesplit.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from 7u's logs)

## Point and interval

- **Item 1:** -0.2125, points, own against SS at 0.02 over the loss stories (results-derive-nesplit.txt section 3); 80% interval -0.4250 to 0.0000 (the draws' 10th to 90th percentile; the stories carry 7u's CAND-against-SHIP loss to own-against-SS, grade D)
- **Item 2:** none: a table quantity beside the simulated d, read at the ends of d's interval rather than at a point
- **Item 3:** none: a table quantity, deterministic
- **Item 4:** -0.2125, points, the de-risk (SC) against SS at 0.02 over the split stories (results-derive-nesplit.txt section 3); 80% interval -0.3875 to -0.0250
- **Item 5:** none: a control, read by its sign

## Power

From results-derive-nesplit.txt section 2 (4,000 draws a cell through reduce-nesplit.mjs's own items()):

```
  item 1's simulated half, the loss reading at both weights and reaching -0.25: SAME 0.9327, HALF 0.0147, NULL 0.0000
  item 2 HELD needs G below (dT - hi) / 100 at both weights: with dT 0, below 2.497e-3 at 0.02 (1.93 times 7u's gap) and 2.190e-3 at 0.01 (1.33 times)
  item 2, a BLIND table at dT 0 under SAME, by G: 1 times the gap HELD 0.8005; 1.5 times 0.2367; 2 times 0.0125; 3 times 0.0000
  items 1 and 2 over G (1, 1.5, 2, 3 times the gap) and a BLIND table's dT (0, 0.1, 1): BLIND SAME item 1 HELD 0.9302, item 2 HELD 0.7139; SEES SAME item 1 FALSIFIED 1.0000, item 2 INCONCLUSIVE 0.9048
  item 4: DERISK HELD 0.9722 INCONCLUSIVE 0.0278; SPEND FALSIFIED 0.9710 INCONCLUSIVE 0.0290; BOTH INCONCLUSIVE 1.0000
```

SAME carries 7u's S364 loss (0/31 at 0.02, 0/28 at 0.01) to own against SS; HALF half of it, short of item 1's -0.25 line, so item 1 reads INCONCLUSIVE there by design (the review's line); NULL none beyond churn. Item 2 turns on G, which the code bounds below by 7u's year-0 gap (1.2931e-3 at 0.02, 1.644e-3 at 0.01) but not above: at a blind table's dT 0 it reads HELD only while G stays under about twice the gap at 0.02 and 1.33 times at 0.01, and a table that over-reads its own opening's survival by a point (dT 1) clears that for any G here. Where the table sees the loss item 2 reads INCONCLUSIVE and item 1 carries the reading. Item 4's BOTH story no longer names a part. Item 3 is a table quantity: no power to compute.

## Budget line

From results-derive-nesplit.txt section 4 (7u's own timings for S364 and bridge 4): S364 at 0.02 about 1.30 core-hours, at 0.01 about 1.27, bridge 4 at 0.02 about 2.96; in all about 5.53 core-hours, the three units at once, so about 3 h wall on the main lane beside NS-CAND in the light lane. Each unit may run 6 hours (the batch's timeout 21600); the batch is resumable.

## Pre-mortem

- **First: the forced SS is not SHIP's run.** SS takes SHIP's spend at the plan's tiers in year 0 and the candidate's moves after it, so item 1 reads the opening, not the arms; a loss that was SHIP's continuation (it never moves on S364) reads as NULL, and item 1 then reads INCONCLUSIVE with the table's dT still printed.
- **Second: the swap is a construct.** Reading a 2/2 move through the plan-tier layer values year 1 as if the plan's tiers were held without a move; it changes the continuation's held state and the charge it would pay together, so item 3 reads the layer as a whole, not the charge apart (NE-TS's own decomposition is the decision table's second row).
- **Third: the near-dead counts are small.** S364 survives on tens of paths in 8,000; a loss half of 7u's falls short of item 1's -0.25 line (HALF: 0.0147), and a split of the loss between the de-risk and the spend near half and half reads INCONCLUSIVE on item 4 (BOTH: 1.0000).
- **Fourth: NSL-PROP is present in the candidate's tables** (PR12): the estate and shortfall parts at S364's year-0 state blend dead corners, so h and bq carry it; items 2 and 3 read them as the table holds them, NE-NS's share is not separated from the blend's.
- **Fifth: PR15 and PR16 are reported, not items:** the reader's chance and the survival by world are printed beside the forced runs, not tested.
- **Sixth: the control's openings** may coincide on bridge 4 if SHIP's and the candidate's year-0 levels are equal; item 5 reads own against its other-tier partner, which always exists.

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories (the split, one-flip and band stories included) through the decision bands. No cap
taken from the scorecard. An item that needs every household carries a line per household, its reducer printing
"LEGS: N/<household> <OUTCOME>" beside "OUTCOME: ...".

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.69 (17 of 24), ATTRIB 0.56 (23 of 41), SIZE 0.53 (24 of 45), CTRL 0.67 (7 of 10), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.23 (5 of 24: the hand record's 1 of 19, deep-review-log.md, and the leading causes settled since, 4 of 5, review-causes.md)).
The derivation's priors begin there and state why they move from it; an item resting on a deep review's ranked cause or
story starts from that record's rate, not the review's own probability.

Items 1-3 rest on the review's ranked causes, so each starts from 0.23; the review's own lead credence (NE-SURV 0.45) is already its posterior shaded halfway to that rate (its receipt), and the derivation mixes the receipt's credences through the JUDGED conditionals and section 2's power, which is what moves item 1 from 0.23. Item 1 HELD needs the realised loss at -0.25 or past, which only the SAME story reaches, so it sits near the base rate; item 2 is simulated beside it through items() over the same table positions and stories, and stands higher (0.41) because a blind table that over-reads its own opening's survival by a point (dT 1, weight 0.4 of BLIND) reads item 2 HELD under every loss story and G here, whatever the cause - correcting a one-point over-read flips a gap of a few thousandths (the plan-auditor's MINOR 3 of 10 Oct 19:04 UK). Item 4 is an attribution (ATTRIB 0.56) moved by the split stories; item 5 a control (CTRL 0.67) moved up because the candidate's table on bridge 4 is calibrated in 7u (99.7554 against 99.76).

- **Base rate, item 1:** 0.23 (a deep review's cause: NE-SURV)
- **Base rate, item 2:** 0.23 (a deep review's cause)
- **Base rate, item 3:** 0.23 (a deep review's cause: NE-TS)
- **Base rate, item 4:** 0.56 (ATTRIB)
- **Base rate, item 5:** 0.67 (CTRL)
- **Item 1:** HELD 0.31, INCONCLUSIVE 0.58, FALSIFIED 0.11 (derived, results-derive-nesplit.txt section 3)
- **Item 2:** HELD 0.41, INCONCLUSIVE 0.49, FALSIFIED 0.10 (derived)
- **Item 3:** HELD 0.28, INCONCLUSIVE 0.26, FALSIFIED 0.46 (derived)
- **Item 4:** HELD 0.44, INCONCLUSIVE 0.32, FALSIFIED 0.24 (derived)
- **Item 5:** HELD 0.80, INCONCLUSIVE 0.12, FALSIFIED 0.08 (derived: the JUDGED control line)
- **Judged:** none (the plan-auditor's BLOCKING 3 of 10 Oct 08:13 UK: the per-item judged lines were written after the derivation had run, so they are withdrawn; the JUDGED block in derive-nesplit.mjs, the derivation's inputs, is the judgement on record)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 ATTRIB, 5 CTRL

## Changes after seeing results

None.
