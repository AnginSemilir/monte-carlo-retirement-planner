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
- **The tables are seed-free:** the solve reads no simulated path, so the candidate's tables at 30 points are 7u's; its own opening at 30 points is the one 7u's traces show (pension 2, ISA 2 at 0.90 and 0.95), and the table items (2, 3, the table half of 1) carry no sampling error. The build check at 4 points chose the plan's tiers at 0.80 (a coarser grid's tables, declared in Provenance), so the four openings collapse there; at 30 points they do not.
- **The parts are exact:** scoreMoves scores a move as sv + wR rs + wB bq - h (solve.js l.1520-1521); with wB and wR set to 0 the score is sv - h, with wR 1 it is sv + rs - h, so h and rs follow, and the audit's partsSum check rebuilds every table's score from them within 1e-12 relative. The chooser then subtracts the switch charge from a move that leaves the held tiers (solve.js l.1388-1392), so its score is the mixture-weighted score less the charge; chooserTop checks the candidate's own opening is the best of the four by it.
- **The forced runs are the candidate's own:** runPolicy's start takes the forced move in year 0 and the solver's own move after it (solve.js l.1555-1567); forceIdentity checks that forcing the candidate's own opening reproduces its unforced run on every path, so any difference between openings is the opening's.
- **The checks, each failed on a planted fault first:** reduce-nesplit.mjs's 35 planted checks (`node research/solver/reduce-nesplit.mjs --planted`, EDGES printed), and the audit's two plants (partsum, force), each refused by the preflight (Provenance).

## Prediction

- **Item 1 HELD (NE-SURV):** at both weights the candidate's table gives its own opening a higher survival part than SS (SHIP's spend at the plan's tiers), and on the same paths its own opening loses to SS by the exact test.
- **Item 2 HELD:** at both weights the survival part alone covers the whole chooser gap between its own opening and SS.
- **Item 3 FALSIFIED:** the swapped year-1 layer leaves at least half of that gap at both weights (the held-tier layer does not carry the preference).
- **Item 4 HELD:** in simulation the de-risk (SC against SS) carries more of the loss than the spend (CS against SS) at both weights.
- **Item 5 HELD:** on bridge 4 the table's survival ranking of the candidate's opening against its other-tier partner does not disagree in sign with a simulated difference that reads.

## Falsified if

- **Item 1 FALSIFIED:** the table does not favour its own opening on survival at either weight (dT at or below 0 at both). INCONCLUSIVE when the table favours it but the simulated loss does not read at both weights, or the weights split.
- **Item 2 FALSIFIED:** the survival part is at or below 0 at both weights. INCONCLUSIVE when it is positive but under the whole gap at a weight.
- **Item 3 HELD (the prediction missed):** the swap leaves no gap at both weights. INCONCLUSIVE when it shrinks the gap below half but not to 0, or own holds the plan's tiers.
- **Item 4 FALSIFIED:** the spend's loss reads at both weights and exceeds the de-risk's. INCONCLUSIVE otherwise when not HELD.
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
| 32 | The table's number is never the result: survival is simulated | items 2 and 3 read the candidate's table parts | items 1, 4 and 5 read simulated survival | ACCEPTED - the question is the table's own ranking of the openings, so items 2 and 3 read the table by design, and item 1 sets the table's survival part beside the simulated survival of the same openings |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (primary; single look):** dT = sv(own) - sv(SS) in points in the candidate's tables; the paired survival of own against SS on the same 8,000 paths, the exact one-sided McNemar p for its loss (stats.mjs mcnemarHarmP), Holm over the two weights. HELD when at both weights dT > 0 and the loss reads (Holm p below 0.05, lost above saved); FALSIFIED when dT <= 0 at both; else INCONCLUSIVE.
- **Item 2 (primary; single look; deterministic):** G = chooser(own) - chooser(SS), dS = dT / 100. HELD when at both weights G > 0 and dS >= G; FALSIFIED when dS <= 0 at both; else INCONCLUSIVE.
- **Item 3 (primary; single look; deterministic):** Gs = the swapped chooser(own) - chooser(SS), own read through its plan-tier partner's year-1 layer. HELD when Gs <= 0 at both; FALSIFIED when Gs >= G / 2 at both; else INCONCLUSIVE (and when own holds the plan's tiers).
- **Item 4 (primary; single look):** D = SC against SS, P = CS against SS, each paired, exact one-sided p, Holm over the four. HELD when at both weights D's loss reads and its net loss exceeds P's; FALSIFIED when at both weights P's loss reads and exceeds D's; else INCONCLUSIVE.
- **Item 5 (the control; single look):** own against its other-tier partner at the same spend on bridge 4 at 0.02; dT and the paired survival, two-sided exact (the smaller one-sided p doubled). FALSIFIED when the signs disagree and p < 0.05; INCONCLUSIVE when they disagree and p >= 0.05; HELD otherwise.
- **Reported, not items:** every opening's parts and swapped parts, its table survival by world beside its simulated survival by world (PR16), its survival part in SHIP's tables, failures by kind (a run-out; the plan's end below its minimum pot), the reader's meter (PR15), both arms' unforced runs paired.
- **NOT SETTLED**, if the gate fails (reduce-nesplit.mjs's header): the stamps; a unit missing, repeated or not done; a ran line off the candidate's or the product's settings, the registered points or the unit's weight; the arms at different menus, grids or minimum pots; an opening or the own line missing; a self-check short of every read or path; a run's sim line or file missing, or its bits not the log's.
- **Declared choices, not derived:** the four openings (the review's design); the half-gap line in item 3; alpha 0.05 with Holm; the single look.

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | NE-SURV leads: the candidate's survival read at the near-dead bridge edge ranks the openings wrongly; O132's cause recorded at the item's grade (B, one seed); a near-edge fix is designed only after the maintainer's answer on PR13 and is tested on a fresh seed; 7u-F and the fix's test go to the maintainer together | 0.51 |
| item 1 FALSIFIED, item 3 HELD | NE-TS leads: the tier-state layer carries the preference; the charge accounting goes to its own decomposition (the layer against the charge), registered before any change to the tier state | 0.08 |
| items 1 and 3 FALSIFIED | the estate or shortfall parts carry it (NE-NS or other): NS-PROP is re-scoped onto the candidate at seed 7002 with S364 and bridge 4 deciding (PLAN.md NS-PROP's held branch) | 0.13 |
| else | the unsettled items named; the parts printed decide the next split, registered as its own test; nothing goes to the maintainer unless a part reads | 0.28 |

- **Waiver:** none needed: the chance the action changes is 0.49 (one less 0.51), above a quarter

## Decision fed

- **Item 1 HELD:** NE-SURV is recorded as O132's leading cause (grade B, one seed); the STOP list on S364 lifts for the cause, not for a fix; a near-edge fix is designed after the maintainer answers PR13, and tested on a fresh seed.
- **Item 1 FALSIFIED:** NE-SURV leaves the lead; items 2 and 3 name the part (item 3 HELD: NE-TS's own decomposition; items 1 and 3 FALSIFIED: NS-PROP re-scoped onto the candidate).
- **Item 1 INCONCLUSIVE:** the unsettled half (the table's dT or the simulated loss) is named; the next split is registered on the parts printed; nothing goes to the maintainer unless a part reads.
- **Item 4 HELD or FALSIFIED:** the de-risk or the spend names the part of the candidate S364's loss follows (STOP's 'blaming any one part' lifts only for that part, on S364); INCONCLUSIVE leaves it with both.
- **Item 5 FALSIFIED:** the method misreads where the table is calibrated: items 1-4 are NOT SETTLED until the misread is explained; HELD or INCONCLUSIVE leaves them as read.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F still waits for the maintainer's unlock and PR13's answer.

## Provenance

- **The design:** the deep review after 7u (deep-review-log.md 10 Oct 04:17 UK), its decisive test NE-SPLIT and its STOP list; PLAN.md's NE-SPLIT row (PROPOSED 10 Oct; the maintainer's 'Go ahead').
- **The build:** audit-nesplit.mjs (d39e6ae; its per-world paths moved to the tuning seed in 64a923b, since 7003 is Phase 4's), reduce-nesplit.mjs, derive-nesplit.mjs, batch-nesplit.sh and preflight-nesplit.sh (64a923b; derive-nesplit.mjs's no-point form 2137e3c).
- **Seen before registration (declared):** 7u's results in full (results-7u.txt) and the deep review's figures; NE-SPLIT's build check at 4 points, 40 paths and 10 a world (runs.log 10 Oct), whose own opening at 4 points was the plan's tiers at 0.80 on all three units (the four openings collapsing to two) and whose table and simulated figures at that grid were seen; the derivation's output (results-derive-nesplit.txt), run before the per-item judged lines below were written (the JUDGED block in derive-nesplit.mjs, its inputs, was written before its first run). A container restart on 10 Oct lost this file and the plan row's edit before they were committed; both were rewritten unchanged, and 7u's files restored from the 7u-results checkpoint reproduce results-7u.txt byte for byte.
- **The preflight:** preflight-nesplit.sh on the tuning seed at 4 points, after this registration (runs.log 10 Oct): A, the reducer's planted checks; B, the audit's three units through the gate in --preflight mode; C, the audit's two plants (partsum, force) each refused; its output quoted here in an amendment before launch

## Derivation script

- `derive: research/solver/derive-nesplit.mjs > research/solver/results-derive-nesplit.txt sha256 9a7993ca2a644969`
  (7u's S364 and bridge 4 records behind 7u's gate, the power of items 1 and 4 under the loss and split stories through reduce-nesplit.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from 7u's logs)

## Point and interval

- **Item 1:** -0.2125, points, own against SS at 0.02 over the loss stories (results-derive-nesplit.txt section 3); 80% interval -0.4250 to 0.0000 (the draws' 10th to 90th percentile; the stories carry 7u's CAND-against-SHIP loss to own-against-SS, grade D)
- **Item 2:** none: a table quantity, deterministic (the tables are 7u's), no sampling interval
- **Item 3:** none: a table quantity, deterministic
- **Item 4:** -0.2125, points, the de-risk (SC) against SS at 0.02 over the split stories (results-derive-nesplit.txt section 3); 80% interval -0.3875 to -0.0250
- **Item 5:** none: a control, read by its sign

## Power

From results-derive-nesplit.txt section 2 (4,000 draws a story through reduce-nesplit.mjs's own items()):

```
  item 1's simulated half, the loss reading at both weights: SAME 1.0000, HALF 0.9868, NULL 0.0000; SAME with the churn 8 and 12 times larger 0.9998 and 0.9970
  item 4: DERISK HELD 1.0000; SPEND FALSIFIED 1.0000; BOTH HELD 0.2130 INCONCLUSIVE 0.5677 FALSIFIED 0.2193
```

SAME carries 7u's S364 loss (0/31 at 0.02, 0/28 at 0.01) to own against SS; HALF half of it; NULL none beyond churn (a loss that was SHIP's continuation, not the opening). Items 2 and 3 are deterministic: no power to compute.

## Budget line

From results-derive-nesplit.txt section 4 (7u's own timings for S364 and bridge 4): S364 at 0.02 about 1.30 core-hours, at 0.01 about 1.27, bridge 4 at 0.02 about 2.96; in all about 5.53 core-hours, the three units at once, so about 3 h wall on the main lane beside NS-CAND in the light lane. Each unit may run 6 hours (the batch's timeout 21600); the batch is resumable.

## Pre-mortem

- **First: the forced SS is not SHIP's run.** SS takes SHIP's spend at the plan's tiers in year 0 and the candidate's moves after it, so item 1 reads the opening, not the arms; a loss that was SHIP's continuation (it never moves on S364) reads as NULL, and item 1 then reads INCONCLUSIVE with the table's dT still printed.
- **Second: the swap is a construct.** Reading a 2/2 move through the plan-tier layer values year 1 as if the plan's tiers were held without a move; it changes the continuation's held state and the charge it would pay together, so item 3 reads the layer as a whole, not the charge apart (NE-TS's own decomposition is the decision table's second row).
- **Third: the near-dead counts are small.** S364 survives on tens of paths in 8,000; a split of the loss between the de-risk and the spend near half and half reads INCONCLUSIVE on item 4 (BOTH: 0.5677).
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

Items 1-3 rest on the review's ranked causes, so each starts from 0.23; the review's own lead credence (NE-SURV 0.45) is already its posterior shaded halfway to that rate (its receipt), and the derivation mixes the receipt's credences through the JUDGED conditionals and section 2's power, which is what moves item 1 above 0.23. Item 4 is an attribution (ATTRIB 0.56) moved by the split stories; item 5 a control (CTRL 0.67) moved up because the candidate's table on bridge 4 is calibrated in 7u (99.7554 against 99.76).

- **Base rate, item 1:** 0.23 (a deep review's cause: NE-SURV)
- **Base rate, item 2:** 0.23 (a deep review's cause)
- **Base rate, item 3:** 0.23 (a deep review's cause: NE-TS)
- **Base rate, item 4:** 0.56 (ATTRIB)
- **Base rate, item 5:** 0.67 (CTRL)
- **Item 1:** HELD 0.51, INCONCLUSIVE 0.20, FALSIFIED 0.29 (derived, results-derive-nesplit.txt section 3)
- **Item 2:** HELD 0.33, INCONCLUSIVE 0.38, FALSIFIED 0.29 (derived)
- **Item 3:** HELD 0.28, INCONCLUSIVE 0.26, FALSIFIED 0.46 (derived)
- **Item 4:** HELD 0.51, INCONCLUSIVE 0.17, FALSIFIED 0.32 (derived)
- **Item 5:** HELD 0.80, INCONCLUSIVE 0.12, FALSIFIED 0.08 (derived: the JUDGED control line)
- **Judged, item 1:** HELD 0.45, INCONCLUSIVE 0.25, FALSIFIED 0.30
- **Judged, item 2:** HELD 0.35, INCONCLUSIVE 0.35, FALSIFIED 0.30
- **Judged, item 3:** HELD 0.30, INCONCLUSIVE 0.25, FALSIFIED 0.45
- **Judged, item 4:** HELD 0.45, INCONCLUSIVE 0.25, FALSIFIED 0.30
- **Judged, item 5:** HELD 0.80, INCONCLUSIVE 0.12, FALSIFIED 0.08
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 ATTRIB, 5 CTRL

## Changes after seeing results

None.
