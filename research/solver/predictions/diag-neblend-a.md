# Prediction: NE-BLEND stage A (does the read in log-odds restore S380's spread, and was R0's bridge 4 break the copy rule?)

- **Run:** `research/solver/batch-neblend-a.sh` - results/diagneblend/case0-3.txt and the four jobs' files (audit-neblend.mjs: bridge 4 at 0.02 under RZ and LOR, S380 at 0.02 under BASE and LOR), reduced by reduce-neblend-a.mjs into results-neblend-a.txt
- **Kind:** test
- **Written:** 11 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths for each world's forced runs, each world's long-run shift put in, the same paths for every arm; 7u's held-out seed refused by the audit
- **Unmasking:** RZ removes the residual and keeps the clip-and-copy split, so it separates the split's share of R0's bridge 4 break from R's; LOR reads every bridge corner at the position's own chance and blends in log-odds, so it may unmask the no-reader dead-corner pessimism the reader was built to fix (bridge 4 read under both arms as the control) or over-steepen where the probability blend was right (item 3's over-corrected reading: its interval wholly above 1.05, INCONCLUSIVE); any fix this leads to names bridge 4, S126 and the 95% share household in its own Unmasking (the deep review after NE-SPLIT)
- **Mechanism:** grid.js:387 "c and R blended with the same corner weights" (PB-WIDE: the bridge read is a probability blend across the share cliff; the LOR arm); reader.js:80 "c_i = clip(S_i / p_i, 0, 1) where p_i >= 0.5 (supported)" (B4-COPY: the copy rule decides the R each unsupported corner leaves; the RZ arm keeps it)
- **Plan section:** PLAN.md "NE-BLEND", O137, O139, PR17, PR18, PR20; the deep review after NE-ROOT (deep-review-log.md 11 Oct 10:33 UK)

## Question

Stage A of the deep review's NE-BLEND: (1) does setting the residual to 0 with the copy rule kept (RZ) keep bridge 4 calibrated - so R0's 48-point break was the copy rule's zeroing, not R (B4-COPY against B4-R)? (2) does reading each bridge corner at the position's own chance and blending in log-odds (LOR) keep bridge 4? (3) does LOR restore S380's spread across the worlds, flattened to 0.8987 of its runs under BASE (O139; PB-WIDE against PB-EDGE)? (4) does the flattening matter: does LOR change S380's simulated survival in the poor world, where BASE's table over-reads it by about 4 points?

## Derivation

- **The arms are research options, inert by default:** `readerSplit: 'rz'` sets each bridge table's R to 0 after the split, the clip-and-copy c kept (solve.js); `readerBlend: 'logodds'` reads each corner i at the position's chance p as p c_i + R_i, clamped, and blends the corners in log-odds (grid.js readValues). research/tests/reader-neblend.test.mjs: S224, which has no bridge year, is bit for bit BASE's under both arms; S380 moves under both (the planted case); the meta carries both; an unknown blend and a blend without the reader are refused. The reader tests pass unchanged (reader 30, reader-solve 17, reader-order 12, reader-order-solve 10, reader-neroot 7); the e3pcls identity test re-pinned on this code.
- **Each arm is read against itself:** each job's table survival at CAND's own opening by world is set beside that opening forced in year 0 with the arm's own moves after it, on the same 4,000 paths a world; item 4 pairs BASE's own policy with LOR's on S380 on the same world-0 paths.
- **The default is checked unchanged:** the gate refuses S380 under BASE unless its tables by world are NE-ROOT's to the printed digits (results-neroot.txt).
- **The records, behind NE-ROOT's gate (results-derive-neblend-a.txt section 1):** bridge 4 under BASE 98.4967, 99.9761 and 99.9955 against 98.4000, 99.9750 and 100.0000 simulated; S380 under BASE 35.0977, 76.2609 and 94.5685 against 30.8500, 78.4000 and 97.0250, a spread ratio of 0.8987.
- **The checks, each failed on a planted fault first:** reduce-neblend-a.mjs's 34 planted checks (`node research/solver/reduce-neblend-a.mjs --planted`, EDGES printed, each item reaching all three outcomes from its own plants), and the audit's two plants, each refused by the preflight (Provenance): arm runs the LOR job on bridge 4 without its arm (armTook refuses), force forces another opening as CAND's own (forceIdentity refuses).

## Prediction

- **Item 1 HELD:** RZ keeps bridge 4 within 0.3 points in every world (B4-COPY).
- **Item 2 HELD:** LOR keeps bridge 4 within 0.3 points in every world.
- **Item 3 FALSIFIED:** LOR leaves S380 about as flat as BASE (PB-WIDE is the review's lead at 0.35 only; the stories put 0.39 on this end).
- **Item 4 INCONCLUSIVE:** LOR's change in S380's world-0 survival is under half a point, or its paths churn too much to show it either way.

## Falsified if

- **Item 1 FALSIFIED:** a world's interval of bridge 4's table less simulated under RZ lies wholly outside 0.3 points: R itself holds bridge 4's read (B4-R or other).
- **Item 2 FALSIFIED:** the same under LOR: LOR is no fix as it stands.
- **Item 3 HELD (the prediction missed):** LOR's spread ratio on S380 lands in [0.97, 1.03] with every world's table less simulated within a point (at the point): the probability blend flattens funded households too (PB-WIDE).
- **Item 4 HELD:** LOR moves S380's world-0 survival by half a point or more, reading by the exact test, its direction printed; it is the flattening's doing only with item 3 HELD, and then at grade C (LOR changes every bridge read).
- **Item 3 over-corrected (INCONCLUSIVE):** LOR's spread ratio lies wholly above 1.05: the blend carries S380's spread and LOR overshoots - read for the cause, never against it.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | bridge 4 (the control household, NE-ROOT's), S380 (7u-F's, O139) | the same | SAME: tuning-seed households; S380 read on the tuning seed only, never its held-out survival item |
| 24 | The read and edge handling: the bridge read | BASE: the reader as the candidate carries it (S380 only) | RZ: R set to 0, the split kept (bridge 4 only); LOR: corners at the position's chance, blended in log-odds (both) | TESTED: one reader part per arm; each item reads an arm against its own runs, except item 4, which pairs BASE and LOR on S380 on the same paths |
| 28 | Every file made by the same code | one launch, one stamp | the same | SAME: the gate refuses mixed stamps, and refuses S380 under BASE off NE-ROOT's tables |
| 29 | The statistic | each arm's table survival at its own opening against its own simulated survival by world; item 4 the paired change | the same | SAME |
| 32 | The table's number is never the result | the gap between table and simulation is half the result, both printed | the same | ACCEPTED: items 1-3 are about the tables' calibration; item 4 is simulated outcomes alone |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** each world's simulated survival bounded by its exact (Clopper-Pearson) interval one-sided at ALPHA / 6 = 0.0083, ALPHA 0.05.
- **Items 1 and 2 (single look):** bridge 4 under RZ (item 1) or LOR (item 2): HELD when every world's table less simulated is within 0.3 points (the point); FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise (NE-ROOT item 5's rule).
- **Item 3 (primary; single look):** the ratio (T2 - T0) / (S2 - S0) of LOR's table spread to its simulated spread at CAND's own opening on S380, bounded by the worlds' bounds: HELD when its point lies in [0.97, 1.03] and every world's table less simulated is within a point (the point, as the deep review set it); FALSIFIED when its interval lies wholly below 0.95 (still flattened); INCONCLUSIVE otherwise - and when its interval lies wholly above 1.05 it is read and printed as over-corrected (the blend carries the spread, LOR overshoots), never as FALSIFIED. BASE's ratio printed beside it.
- **Item 4 (primary; single look):** LOR's own opening and moves against BASE's on S380, paired on the same 4,000 world-0 paths: HELD when the exact two-sided McNemar p (stats.mjs binomUpperHalf, exact at any count) is under ALPHA and the change is at least 0.5 points, printed up (LOR saves paths) or down (it loses them); FALSIFIED when the guarded interval of the change (survivalChangeU at ALPHA, held out to the exact bound on a one-sided count: reduce-7aa.mjs guarded) lies inside [-0.5, 0.5]; INCONCLUSIVE otherwise.
- **Reported, not items:** every job's world lines and own opening, BASE's spread ratio, item 4's changes in worlds 1 and 2.
- **Declared choices, not derived:** the 0.3 control line (NE-ROOT's); the spread band [0.97, 1.03] and the one-point world line read at the point (the deep review's item); 0.95 as the FALSIFIED line, below which LOR is as flat as BASE's 0.8987 within sampling, and 1.05 as the over-corrected line; half a point as a material change in the poor world; stage A's four jobs (the deep review's order: RZ on bridge 4, BASE and LOR on S380), with LOR's bridge 4 added so item 3 is read beside LOR's own control.

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 2 and 3 HELD | LOR is the candidate fix (grade B, one seed): stage B registers next - S364's over-read under LOR, ORDER (PB-REF), S224 bit-identical, S126, the 95% share household and S360 reported - and the fix's test on a fresh seed goes to the maintainer with 7u-F | 0.12 |
| item 3 FALSIFIED (still flat) | the probability blend does not carry S380's flattening (PB-EDGE, PB-REF or other): O139 gets its own cause step, and stage B narrows to S364 (LOR against ORDER) | 0.39 |
| item 3 over-corrected | the blend carries S380's spread and LOR overshoots it: stage B tests a milder read (log-odds on the dead side only, or more share nodes, PR20) on S380 and S364 together | 0.09 |
| item 2 FALSIFIED, item 3 neither | LOR breaks bridge 4: no fix as it stands; stage B tests the log-odds read on the dead side only, or more share nodes (PR20) | 0.10 |
| else | the unsettled items named; stage B as the deep review designed it, its items re-derived from these lines | 0.30 |

- **Waiver:** none needed: the chance the action changes is 0.61 (one less 0.39, the likeliest row), above a quarter

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1 HELD:** B4-COPY recorded (grade B): R0's bridge 4 break came from its replaced split, not from R; where in the split (the all-pension corner, the review's judgement) stays at the review's grade; a fix may change R's blend without losing bridge 4. FALSIFIED: R holds bridge 4's read, and any fix keeps R where it is right.
- **Item 4 HELD with item 3 HELD:** correcting the flattening changes S380's poor-world outcome, by the printed amount and direction - the defect is material beyond households that fail under every plan (the maintainer's question), grade C (LOR changes every bridge read; a decomposition would split it); up, the correction helps there; down, it costs survival there while restoring the table's spread, recorded as such. **Item 4 HELD otherwise:** LOR changes the outcome, not attributed to the flattening. FALSIFIED: no material change in S380's poor world under LOR. INCONCLUSIVE leaves the question open.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F held (the maintainer, 11 Oct); NS-PROP waits on stage B.

## Provenance

- **The design:** the deep review after NE-ROOT (deep-review-log.md 11 Oct 10:33 UK), its decisive test NE-BLEND and its order (stage A first); the maintainer's go-ahead (11 Oct, the session: 'Go ahead with NE-BLEND, hold 7u-F').
- **Amended before launch** on the plan-auditor's FAIL of 11 Oct 13:00 UK (review-log.md): item 3's steep end read as over-corrected (INCONCLUSIVE) with its own decision row, never as FALSIFIED (BLOCKING 1); item 4's HELD attributed to the flattening only with item 3 HELD, at grade C, and split by direction (BLOCKING 2); item 4's power with its lost and saved paths drawn (BLOCKING 3); item 3's world line read at the point, as the review set it (BLOCKING 4); the exact test built in logs at any count, the guarded interval (MINORs 5 and 6); every story's table kept inside 0 to 100 (MINOR 7); item 1's location of the split left at the review's grade (MINOR 8); 34 planted checks; re-derived (sha256 eae08e05c4ef9a0c); on the re-review's PASS of 11 Oct 13:29 UK, its MINORs: item 3's over-corrected and item 4's direction printed on the item lines and the OUTCOME line's unscored note, and this file's text brought to the amended rules; the preflight re-run on the reducer as launched (below).
- **Changed from the review's design (declared):** stage A registered as its own test so its answer lands first; LOR's bridge 4 job added; item 4 (the poor-world change) added for the maintainer's question; the openings are each arm's own (no SHIP solve), since every item reads an arm against its own runs; S224's bit-identity is a unit test (research/tests/reader-neblend.test.mjs) rather than a job.
- **The build:** solve.js and grid.js's two options (one line each, no mechanism anchor moved), research/tests/reader-neblend.test.mjs; audit-neblend.mjs, reduce-neblend-a.mjs, derive-neblend-a.mjs, batch-neblend-a.sh, preflight-neblend-a.sh.
- **The preflight:** preflight-neblend-a.sh on the tuning seed at 4 points through the launcher (runs.log 11 Oct), quoted from results-neblend-a-preflight.txt: A. the reducer's 30 planted checks all read as they should, EDGES printed; B. GATE passed on the four jobs at 4 points and 40 paths a world, every arm in its solve's meta, every self-check passed; C. the plant arm refused (exit 3: the arm's settings did not take) and the plant force refused (exit 3: forcing CAND's own opening did not reproduce its run).
- **Seen before registration (declared):** NE-ROOT's results in full (results-neroot.txt, results/diagneroot) and the deep review's figures; reader-neblend.test.mjs's 4-point solves of S224 and S380 (S380's year-0 survival under BASE, RZ and LOR at 4 points, printed by the test).

## Derivation script

- `derive: research/solver/derive-neblend-a.mjs > research/solver/results-derive-neblend-a.txt sha256 eae08e05c4ef9a0c`
  (NE-ROOT's bridge 4 and S380 world lines behind its gate, the power of items 1-4 through reduce-neblend-a.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from NE-ROOT's logs)

## Point and interval

- **Item 1:** none: a control, read by its point and interval
- **Item 2:** none: a control, read by its point and interval
- **Item 3:** 0.9592, LOR's spread ratio on S380 (results-derive-neblend-a.txt section 3); 80% interval 0.8910 to 1.0882
- **Item 4:** 0.2992, points, LOR's change in S380's world-0 survival; 80% interval -0.1366 to 1.4348

## Power

From results-derive-neblend-a.txt section 2 (1,500 draws a cell at 4,000 paths a world through reduce-neblend-a.mjs's own items()):

```
  items 1 and 2, bridge 4 kept  : HELD 0.8180 INCONCLUSIVE 0.1813 FALSIFIED 0.0007
  items 1 and 2, bridge 4 small : HELD 0.0793 INCONCLUSIVE 0.6940 FALSIFIED 0.2267
  items 1 and 2, bridge 4 broken: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
  item 3, LOR's spread ratio 0.899: HELD 0.0000 INCONCLUSIVE 0.1007 FALSIFIED 0.8993
  item 3, LOR's spread ratio 0.95 : HELD 0.0027 INCONCLUSIVE 0.9960 FALSIFIED 0.0013
  item 3, LOR's spread ratio 1    : HELD 0.7420 INCONCLUSIVE 0.2580 FALSIFIED 0.0000
  item 3, LOR's spread ratio 1.1  : HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000 (over-corrected 0.8407)
  item 4, a world-0 change of -0.5 points, churn 0.01: HELD 0.5053 INCONCLUSIVE 0.4733 FALSIFIED 0.0213 (HELD up 0.0000, down 0.5053)
  item 4, a world-0 change of -0.5 points, churn 0.05: HELD 0.2607 INCONCLUSIVE 0.7393 FALSIFIED 0.0000 (HELD up 0.0000, down 0.2607)
  item 4, a world-0 change of 0 points, churn 0.01: HELD 0.0033 INCONCLUSIVE 0.2300 FALSIFIED 0.7667 (HELD up 0.0013, down 0.0020)
  item 4, a world-0 change of 0 points, churn 0.05: HELD 0.0493 INCONCLUSIVE 0.9507 FALSIFIED 0.0000 (HELD up 0.0233, down 0.0260)
  item 4, a world-0 change of 0.5 points, churn 0.01: HELD 0.5293 INCONCLUSIVE 0.4433 FALSIFIED 0.0273 (HELD up 0.5293, down 0.0000)
  item 4, a world-0 change of 0.5 points, churn 0.05: HELD 0.2380 INCONCLUSIVE 0.7620 FALSIFIED 0.0000 (HELD up 0.2380, down 0.0000)
  item 4, a world-0 change of 1.5 points, churn 0.01: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000 (HELD up 1.0000, down 0.0000)
  item 4, a world-0 change of 1.5 points, churn 0.05: HELD 0.9487 INCONCLUSIVE 0.0513 FALSIFIED 0.0000 (HELD up 0.9487, down 0.0000)
```

Bridge 4's world 0 at 4,000 paths (its point 0.0967 under BASE, a standard error near 0.2) leaves a calibrated arm HELD 0.82 of the time; item 3 separates a restored spread from BASE's flatness, a fully restored spread reading HELD 0.74 (the world line read at the point); item 4 draws its lost and saved paths (the plan-auditor's BLOCKING 3 of 11 Oct 13:00 UK) and turns on how many paths the two policies split on beyond the change (churn), judged.

## Budget line

From results-derive-neblend-a.txt section 4 (NE-ROOT's own logs): a bridge 4 job about 1.06 core-hours, an S380 job about 0.95; in all about 4.02 core-hours, the four jobs at once, so about 1.1 h wall on the main lane; the arms' own solves untimed until the preflight. Each job may run 6 hours (the batch's timeout).

## Pre-mortem

- **First: each arm changes the policy too.** An arm's forced runs follow its own moves after year 0, so items 1-3 read each arm's own calibration, and item 4 reads two policies, not one table.
- **Second: LOR is one way to read in log-odds.** Reading each corner at the position's chance then blending may over-steepen where the probability blend was right; item 3's steep end and item 2 read that.
- **Third: S380's own opening may move under LOR,** so item 3's world lines are LOR's opening's, not BASE's; the openings are printed.
- **Fourth: item 4's churn is judged** (1% or 5% of paths splitting beyond the change); at 5% a half-point change reads INCONCLUSIVE.
- **Fifth: the 4-point solves seen before registration** (S380's year-0 survival rose under LOR there) are a coarse grid's; nothing in the derivation rests on them.

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories through the decision bands. No cap taken from the scorecard.

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.69 (17 of 24), ATTRIB 0.51 (25 of 49), SIZE 0.53 (24 of 45), CTRL 0.71 (9 of 12), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.26 (6 of 25).
Items 1 and 3 rest on the review's ranked causes (B4-COPY, PB-WIDE), so each starts from 0.26; the review's credences are already shaded toward that rate (its receipt), and the derivation mixes them through the JUDGED stories and section 2's power, which is what moves item 1 to 0.53 (B4-COPY's 0.65 through a control HELD 0.82 when kept) and holds item 3 at 0.21 (0.09 of its INCONCLUSIVE over-corrected). Item 2 starts from CTRL's 0.71 and comes down to 0.55 on the judged chance that LOR moves bridge 4. Item 4 starts from EFFECT's 0.69 and comes down to 0.28 (0.24 up, 0.04 down), since half of its stories turn on a churn that hides a half-point change.

- **Base rate, item 1:** 0.26 (a deep review's cause: B4-COPY)
- **Base rate, item 2:** 0.71 (CTRL)
- **Base rate, item 3:** 0.26 (a deep review's cause: PB-WIDE)
- **Base rate, item 4:** 0.69 (EFFECT)
- **Item 1:** HELD 0.53, INCONCLUSIVE 0.22, FALSIFIED 0.25 (derived, results-derive-neblend-a.txt section 3)
- **Item 2:** HELD 0.55, INCONCLUSIVE 0.26, FALSIFIED 0.20 (derived)
- **Item 3:** HELD 0.21, INCONCLUSIVE 0.40, FALSIFIED 0.39 (derived)
- **Item 4:** HELD 0.28, INCONCLUSIVE 0.51, FALSIFIED 0.21 (derived)
- **Judged:** none (the judged inputs are derive-neblend-a.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 CTRL, 2 CTRL, 3 ATTRIB, 4 EFFECT

## Changes after seeing results

None.
