# Prediction: NODE-1 (does the share cell carry S360's missing policy gain, or does the solve read the base move's value even at a node?)

- **Run:** `research/solver/batch-node1.sh` - results/diagnode1/case0-1.txt and the two jobs' files (audit-node1.mjs), with REF-2's S360 BO behind REF-2's gate, reduced by reduce-node1.mjs into results-node1.txt
- **Kind:** test
- **Written:** 14 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world for both jobs (REF-2's, so BO is held to REF-2's BO path for path); 7u's held-out seed refused by the audit
- **Unmasking:** the dense nodes lift S360's tables where the policy's own gain inside the bridge sits mid-cell (O152); a lifted table can move S360's later choices (BN's runs against BO's are printed, paired) and unmask ORDER's possible over-read of the fixed move in worlds 1 and 2, which the policy's gain now hides (O155): the over-correction line reads BN's table against its runs in every world, world 2 included. The arm pair BN against BO (one change, the share nodes) splits any harm under the nodes; a harm under ORDER itself is not settled here (O154). Any fix this leads to names S360, S364, the 95% share household and bridge 4 in its own Unmasking
- **Mechanism:** grid.js:124 "if (SN) axes.a = nodesAxis(SN);" (the explicit share nodes); grid.js:419 "const v = pr * cc + rr;" (the reader's read: p at the query, c and R blended from the cell's corners); reader.js:97 "c[i] = Math.min(1, Math.max(0, S[i] / p[i]));" (c clipped at a supported corner, so the dead a = 1 node carries no gain)
- **Plan section:** PLAN.md "NODE-1", O152, O151, O155, PR20; the deep review after REF-2 (deep-review-log.md 13 Oct 23:45 UK)

## Question

The deep review after REF-2's decisive test. Under ORDER, S360's own-opening table still under-reads its runs by about five points (O152), and Step 0 (results-policy-gap.txt, grade C) puts that gap in the policy's own gain inside the bridge, which no fixed-move reference can carry. S360's pension share sits inside the share cell from 0.8 to 1.0, where the read takes c and R from a covered node and a dead one. With explicit pension-share nodes dense about S360's share, does the table rise to its runs (O152-NODE), or stay at the reference (O152-MODEL)?

## Derivation

What the mathematics and the existing records say, with the scripts that computed any figure.
Every check this prediction names (a gate, a count, a power model) is run once on a planted case of exactly its claim before registration, and that output is quoted here. A pace or rate is derived with the household's own parameters and as the same statistic the reducer prints (a mean over paths at the same horizon), not a borrowed parameter or an expected point.
A cause test decides only on arms whose gap the named cause alone can carry; its reducer plants the hypothesis's own geometry (the smallest move the cause makes) as a case, and any gate on a forced or capped quantity plants the cap itself.
A noise or flip parameter in the power model is computed by the derive script from the records it names, never typed from a receipt or a review's prose, and the power is printed at two larger values as sensitivity rows.
A cause that turns on a ratio of table reads has that ratio's distribution (its median and its tail, not its mean) previewed per cell at the preflight's grid before the credences are derived; where the bulk sits at 1 the cause cannot act there (NS-COND: S370's cell means of rho above 100 came from 150 near-dead reads, its median 1.0001e+0, results-nscond-rho.txt).
A panel's households that no record covers are carried into the power and the intervals from a record of households chosen by the same rule, never from another panel's subset; where none exists, each interval is widened to the spread across the record's households and the carry is named grade D in the pre-mortem (7u: the broad 30 drawn from the 25's no-gain households put six of eight points outside their 80% intervals, the broad floor +0.360 against the 25's +0.162, results-7u.txt).
A derivation's story that moves a table or a rate keeps it inside its range (survival between 0 and 100 points, a count at least 0), and the derive script asserts it.
A Decision fed that gives an arm's change to one part names the item that splits it and gives it only when that item reads HELD (RULES.md section 9 rule 1); a reading past the target (an over-correction) is read for the cause, never against it, and has its own row.
A power model draws every count its reducer reads from that count's own sampling distribution (the lost and the saved paths each, not only their churn), and a rule a review set is read as the review set it, or the departure is declared with its consequence.
An item that decides between causes names the outcome each cause predicts, and a row credits a cause only where the item's outcome is likelier under it than under every rival; a control reads only the arm whose failure would change the action.
Where an earlier measurement of the same mechanism exists, the derivation's stories for it start from that measurement's size, scaled to the new case, before any shading toward a track record.
A cause map settles a cause 'not' only where the run shows its arm reached the mechanism (the reach printed and read against a registered line, as NE-GRID C's S364-COPY); where the arm may not reach it, the map leaves the cause open.
A convergence or resolution item reads each market world apart, and its derivation draws each world's story from that world's own earlier moves: the poor world's tables converge slower than the average world's (NE-GRID C, ratios 0.37 to 0.57 against 0.12 to 0.20).
An arm that changes a read changes the policy: the stories for a paired outcome size the arm's own opening move from the records of the family's openings (a de-risked opening losing poor-world paths, O132), not only the correction the cause predicts.
An item that reads a quantity built from simulated paths, or a bound the code gives, states its sampling interval and which side the bound sits on from the derivation's first draft, and its decision rule reads the interval's ends, not the point.
Two arms nested by construction are drawn coupled in the derivation, the partial arm at most the whole (NE-EDGE's RS within RZ, the plan-auditor's FAIL of 13 Oct 02:54 UK).
An arm that removes an error is read against the runs in every world, counted or not, and the derivation lets it cross the runs (removal past 1): NE-EDGE's arms removed S364's over-read and left an under-read of 1.3262 in world 2 that no item read (O150).
A share or removal story reaches past the whole wherever the other terms can be negative: NE-REF's MIX carried 1.0581 of world 1's log gap against stories that stopped at 0.9.
The preflight prints each arm's statistic beside its control's on every household it is read on, and an arm equal to its control everywhere is a design fault before launch, not a null (REF-2's item 3, O153).
A cause map that blames an arm read against a second reference reads it so only where that reference is shown free of the error at the states the arm acts on (a printed clearance), and leaves both causes open otherwise (REF-2's item 1, the plan-auditor's FAIL of 13 Oct 19:56 UK).
An unscored item is listed in its scorecard entry's unscored list, and scorecard.mjs is run on the prediction before registration; a registered line is never reworded after the read. Such an item (one previewed before registration, say) stays off the OUTCOME line, and the fair-test gate hashes the prediction (NE-REF's item 3, the plan-auditor's FAIL of 13 Oct 18:18 UK).
An out-of-sample household is an item with its own falsifier, not a report, when the test's deciding household is the one where the mechanism was first found.
A net or estate item names which of the mean, the capped mean or the median it reads, and why the score or the app reads that one; the others are reported beside it (above the bequest cap the score is flat, so an uncapped mean follows the unscored tail: DT-O97).

- **The records:** REF-2's S360 BO (results/diagref2, behind REF-2's gate): its own-opening tables 23.6259, 43.7384, 66.2316 against runs of 28.6250, 48.6500, 69.7750, gaps of 4.9991, 4.9116 and 3.5434 points (results-derive-node1.txt section 1).
- **The option is inert off:** node1-inert.mjs prints the same table hashes for S360 and S126 on the code before the option and with it unset (results-node1-inert.txt); the uniform six-node list reproduces the linear axis's tables to 1e-9 (research/tests/share-nodes.test.mjs B). Item 2 reads the same at 60 points against REF-2's BO.
- **Why the table's move, not the table against the runs:** the runs' exact interval at 4,000 paths is about 1.7 points either side at S360's survival, so a table that does not move (about five points under) cannot show itself 3.75 under - the review's lines read INCONCLUSIVE 0.73 on the same stories (results-derive-node1.txt sections 2 and 3). The table's move is exact (both tables are the solve's), so item 1 reads it as a share of the gap to BN's own runs, the gap's interval carrying the runs' noise.

## Prediction

- **Item 1 HELD (0.44 against INCONCLUSIVE 0.32 and FALSIFIED 0.25):** the dense nodes lift S360's own-opening table by at least half of its gap to the runs in worlds 0 and 1.
- **Item 2 HELD (0.97):** BO on this code is REF-2's BO, table and runs, in every world.

## Falsified if

- **Item 1 FALSIFIED:** in worlds 0 and 1 the gap to BN's runs is shown and the share's interval top is at most 0.25 (the table stays at the reference).
- **Item 2 FALSIFIED:** BO's own-opening table differs from REF-2's in some world (the option not inert off).

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 17 | The grid: points, shares, gain buckets | BN: 60 wealth points, the review's fifteen pension-share nodes, six b nodes | BO: 60 wealth points, six by six shares | TESTED: the one change |
| 28 | Every file of a comparison made by the same code | this launch (BN and BO) | REF-2's BO (item 2) | ACCEPTED: read behind REF-2's gate; item 2 is the check that this code with the option off is REF-2's code's solve |
| 29 | The statistic | item 1: the table's move over the gap to BN's runs | item 2: tables and run bits equal | ACCEPTED: each item reads one statistic throughout |
| 32 | The table's number is never the result | item 1 reads the table's move against the simulated runs' gap | the over-correction line reads BN's table against its runs | ACCEPTED: every read is a table against a simulation of it |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** BN's runs by their exact (Clopper-Pearson) interval at 2 x ALPHA / 4 (two worlds); ALPHA 0.05; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look):** per world k in 0 and 1, D = BN's own-opening table less BO's (exact), G = BN's runs less BO's table with its interval from BN's runs', S = D / G with its interval from G's (shown only where G's bottom is above 0; otherwise S runs from minus to plus infinity). HELD when S's bottom is at least 0.5 in both worlds; FALSIFIED when S's top is at most 0.25 in both; INCONCLUSIVE otherwise.
- **Item 2 (control; single look):** BO's own-opening tables against REF-2's BO to the printed digit, and its runs' survival and bridge bits. HELD when every table and every run is REF-2's; FALSIFIED when any table differs; INCONCLUSIVE when the tables agree and some run's bits do not, or REF-2's BO cannot be read behind its gate.
- **OVER-CORRECTION (read for the cause, never against it; its own row):** BN's table less its runs with its interval bottom above 1 point in any world, world 2 included (O155).
- **The causes, by the registered map:** O152-NODE held and O152-MODEL not on item 1 HELD with item 2 HELD; O152-MODEL held and O152-NODE not on item 1 FALSIFIED with item 2 HELD; open otherwise. The nodes reach the mechanism where BN's tables move: the preflight refuses an arm equal to its control in every world (O153's rule), and the read prints the move per world.
- **Reported, not items:** per world D, G, S and both arms' table less runs; the year-0 reads at the initial state against the runs, mixed; BN's runs against BO's, paired; each solve's seconds.
- **Declared choices, not derived:** half and a quarter of the gap for item 1, worlds 0 and 1 deciding (S360's near-edge worlds, the review's), a point for the over-correction line (the review's); the review's lines (within 2.5 points, at least 3.75 under) replaced by the share of the gap, declared above with its power.

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1 and 2 HELD | the share cell carries S360's policy gain (O152-NODE): the share axis's resolution, not the reference, is the remaining error at S360; the deep review after NODE-1 designs a share-axis research step on S364, S360 and the 95% share household before any panel (no share-axis default; REF-S stays unwired) | 0.42 |
| item 1 FALSIFIED, item 2 HELD | the solve reads the base move's value even at a node (O152-MODEL): the reference is the table there, so REF-S's solver wiring is unblocked (on S364, S360 and the 95% share household, each arm's tables shown moving in the preflight); the deep review after NODE-1 designs the model fix | 0.24 |
| else | NODE-1's unsettled items named (or the option not inert: nothing read); the deep review after NODE-1 designs the next step | 0.34 |

- **Waiver:** none needed: the chance the action changes is 0.58 (one less 0.42, the likeliest row), above a quarter
- **The escalation rule (escalation.md, trigger 3):** the run is over 2 hours' wall (about 3.52 h) and its 'else' row is 0.34, under the 0.6 bar: no escalation review first.

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD settles O152 as the share cell's at S360 (grade B, one household, one seed); FALSIFIED settles it as the solve's reading at a node (O152-MODEL, grade B); either only with item 2 HELD. An OVER-CORRECTION YES is read for the cause (O155: ORDER's over-read of the fixed move unmasked), never against the nodes.
- **Item 2:** HELD says the option is inert off at 60 points (grade A, bit for bit); FALSIFIED voids item 1's read and blocks the option until the code is found.
- **Inconclusive on item 1:** a partial lift; it names the world that kept it so, nothing rests on it, and the deep review after NODE-1 reads it with the paired runs.
- **In every branch:** no product change; the candidate's settings unchanged; no share-axis or bucket default; 7u-F held; RS and RSO out of any panel.

## Provenance

- **The design:** the deep review after REF-2 (deep-review-log.md 13 Oct 23:45 UK), its decisive test, adopted under the maintainer's standing go-ahead of 4 Oct and the unlock of 13 Oct (PLAN.md's 13 Oct 23:45 row).
- **The build (d891e0e):** grid.js's `shareNodes` (research only; added without moving a line any registered anchor cites), solve.js's meta.shareNodes; research/tests/share-nodes.test.mjs (10 checks); node1-inert.mjs and results-node1-inert.txt (inert off); audit-node1.mjs, reduce-node1.mjs (65 planted checks, both items to all three outcomes, eight EDGES; REF-2's BO behind REF-2's gate), mutate-reduce-node1.py (58 of 58 caught, results-reduce-node1-mutations.txt), derive-node1.mjs, batch-node1.sh, preflight-node1.sh. The solver code changed (the option), so the code id is new; the e3pcls pin re-taken on it before launch.
- **Changed from the review's design (declared):** item 1 reads the table's exact move as a share of the gap to BN's runs, not the table against the runs within 2.5 points or at least 3.75 under: at 4,000 paths the review's FALSIFIED line is out of reach of a table that does not move (results-derive-node1.txt sections 2 and 3: the review's lines INCONCLUSIVE 0.73 on the same stories, this rule 0.32); two jobs at once, one process each, not E2 on four cores (simpler; registrable on its else row).
- **Seen before registration (declared):** REF-2's results and files, Step 0's split (results-policy-gap.txt), the deep review's scratch reads; four-point solves of S360 under the dense list in the option's tests (the year-0 reads 0.1010, 0.2987, 0.5909 by world, research/tests/share-nodes.test.mjs C, at 4 points and no ORDER: not this run's figures); no NODE-1 figure.
- **The preflight** (through the launcher, runs.log 14 Oct, on d388c28; tuning seed 7002, a fifteenth of the points, 40 paths a world): SMOKE PASSED. "A. planted (65): all read as they should". "B. GATE: passed - the two jobs once and done at the registered settings (40 paths a world, scale 15, seed 7002); each job's reference, nodes and grid in its solve's meta; every self-check passed (armTook, forceIdentity); every file the log's"; "ARM'S REACH (O153): BN's own-opening tables differ from BO's in 3 of 3 worlds" (at 4 wealth points, by under a hundredth of a point - seen, as the reach check prints them; not this run's figures). Solve seconds: BN 764, BO 407. "C. the plant arm: refused (exit 3; audit-node1: S360 BN/P60S15Q5: the job's settings did not take)"; "C. the plant force: refused (exit 3; ... forcing the own opening did not reproduce its run)". "preflight done 02:12 UK".
- **The option's tests after registration:** share-nodes.test.mjs gained the read path's checks (readValues and locateVec on the dense list, 12 checks), so a fault in either locate shows; mutate-share-nodes.py runs its planted faults on a scratch tree (results-share-nodes-mutations.txt). No solver code changed (the code id is the launch's).

## Derivation script

- `derive: research/solver/derive-node1.mjs > research/solver/results-derive-node1.txt sha256 23f2118221f390b6`
  (REF-2's S360 BO behind REF-2's gate, the power of item 1 through reduce-node1.mjs's own items() with the review's lines beside it, the credences from the review's O152 cause credences and the JUDGED block, the decision table's rows, the point and 80% interval, the budget from REF-2's log)

## Point and interval

- **Item 1:** 0.5831, the share of world 0's gap the nodes lift (results-derive-node1.txt section 3); 80% interval 0.0102 to 1.1175
- **Item 2:** none: a bit-for-bit control

## Power

From results-derive-node1.txt section 2 (400 draws a cell through reduce-node1.mjs's own items(); BN's runs moved -0.5, 0 and +0.5 points):

```
  the nodes lifting 0 of the gap: runs moved -0.5: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000; runs moved 0: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000; runs moved 0.5: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
  the nodes lifting 0.2 of the gap: runs moved -0.5: HELD 0.0000 INCONCLUSIVE 0.9850 FALSIFIED 0.0150; runs moved 0: HELD 0.0000 INCONCLUSIVE 0.9800 FALSIFIED 0.0200; runs moved 0.5: HELD 0.0000 INCONCLUSIVE 0.9500 FALSIFIED 0.0500
  the nodes lifting 0.5 of the gap: runs moved -0.5: HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000; runs moved 0: HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000; runs moved 0.5: HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  the nodes lifting 0.7 of the gap: runs moved -0.5: HELD 0.2725 INCONCLUSIVE 0.7275 FALSIFIED 0.0000; runs moved 0: HELD 0.4300 INCONCLUSIVE 0.5700 FALSIFIED 0.0000; runs moved 0.5: HELD 0.5400 INCONCLUSIVE 0.4600 FALSIFIED 0.0000
  the nodes lifting 0.9 of the gap: runs moved -0.5: HELD 0.9900 INCONCLUSIVE 0.0100 FALSIFIED 0.0000; runs moved 0: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000; runs moved 0.5: HELD 0.9975 INCONCLUSIVE 0.0025 FALSIFIED 0.0000
  the nodes lifting 1.1 of the gap: runs moved -0.5: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000; runs moved 0: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000; runs moved 0.5: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
```

Item 1 separates no lift (FALSIFIED) from a lift of nine tenths or more (HELD); a lift between a fifth and two thirds reads INCONCLUSIVE. The review's own lines on the same draws read a full lift HELD only 0.43 of the time at 0.9 and a zero lift FALSIFIED at most 0.30.

## Budget line

From results-derive-node1.txt section 4 (REF-2's S360 BO log: solve and runs, the dense job scaled by the judged factors, grade D): BO about 1.64 h, BN about 3.52 h; two jobs on two cores, about 3.52 h wall, 5.15 core-hours. Each job may run 10 hours (the batch's timeout).

## Pre-mortem

- **First: a partial lift.** If the nodes carry part of the gain (a share between a quarter and a half) - the cell's resolution and the solve's reading both at work - item 1 reads INCONCLUSIVE: the else row's main route.
- **Second: BN's runs move.** The lifted tables can move S360's later choices; BN's runs then differ from BO's and the gap G moves with them; the paired runs are printed.
- **Third: the cost.** The dense solve's time is judged (grade D; O120's drift up to three times); the batch's 10-hour timeout bounds it.
- **Fourth: an over-correction.** ORDER's possible over-read of the fixed move (O155) may surface once the policy's gain is carried; read for the cause.
- **Fifth: one seed (7002) and one household (S360).**

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories (the split, one-flip and band stories included) through the decision bands. No cap
taken from the scorecard. An item that needs every household carries a line per household, its reducer printing
"LEGS: N/<household> <OUTCOME>" beside "OUTCOME: ...".

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.76 (40 of 52), EFFECT 0.71 (19 of 26), ATTRIB 0.49 (33 of 68), SIZE 0.53 (24 of 45), CTRL 0.75 (14 of 18), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.32 (9 of 29: the hand record's 1 of 19, deep-review-log.md, and the leading causes settled since, 8 of 10, review-causes.md)).
The derivation's priors begin there and state why they move from it; an item resting on a deep review's ranked cause or
story starts from that record's rate, not the review's own probability.

Item 1 rests on the review's ranked cause (O152-NODE 0.55), so it starts from a deep review's cause rate, 0.32; the derivation mixes the receipt's cause credences through the JUDGED stories and section 2's power, which puts item 1's HELD at 0.44. Item 2 starts from CTRL's rate, moved up by the inertness check already made at 4 points (results-node1-inert.txt) to the JUDGED 0.97.

- **Base rate, item 1:** 0.32 (a deep review's cause: O152-NODE)
- **Base rate, item 2:** 0.75 (CTRL)
- **Item 1:** HELD 0.44, INCONCLUSIVE 0.32, FALSIFIED 0.25 (derived, results-derive-node1.txt section 3)
- **Item 2:** HELD 0.97, FALSIFIED 0.03, INCONCLUSIVE 0.00 (derived)
- **Judged:** none (the judged inputs are derive-node1.mjs's JUDGED block, committed before its output in d891e0e)
- **Kinds:** 1 ATTRIB, 2 CTRL

## Changes after seeing results

None.
