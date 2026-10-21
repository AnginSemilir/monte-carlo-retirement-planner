# Prediction: diag-xas

- **Run:** `research/solver/batch-xas.sh` - results/diagxas/case0-3.txt and the per-read files (audit-xas.mjs, one process a household: S370, S130, bridge 4 and S126, each BASE and COV), read by reduce-xas.mjs into results-xas.txt
- **Kind:** test
- **Written:** 5 Oct, before the run (its time is its registering commit's, git log). The design: the deep review after COV-B-STEP (deep-review-log.md 5 Oct 09:27 UK) proposed XAS as family 3's root-cause step and the decisive test before 7an (PLAN.md XAS, O99, O100); the maintainer's standing go-ahead of 4 Oct covers it (non-locked research work)
- **Seeds:** 7002 tuning: XAS re-reads COV-B-STEP's own reads (seed 7002, 2,000 paths a world) at the same states, so the reducer's gate holds BASE's and COV's reads and claims to COV-B-STEP's saved files read for read (the identity). It diagnoses where an error sits and chooses the next fix's design, which is tuning; no fix is read on it. Not 7005 (selection) and not 7004 (Phase 4's second seed). The product's 'auto' risk-above rule reads its own seed 7101 in the shared code, as in every solver run.
- **Unmasking:** XAS removes no error; it measures, at each reader read along BASE's paths, how much of the table's error (read less claim) is the table's representation at the state (read less the exact one-step value at the solve's 5 points) and how much the 5-point quadrature (that value less the same at 41 points), the rest being the year's draw (mean 0 when the one-step value is right: the gate). COV's arm is the edge node of COV-B-STEP, whose harm (S126's lost paths) and over-correction are O99's; XAS splits where COV's error sits, not whether COV harms, and S126's opening swap (each arm with the other's year-0 move) is reported to split S126's loss between the opening flip and the rest, not read.
- **Mechanism:** grid.js:391 "const RD = g.reader && yr >= 0 && g.reader.years[yr] ? g.reader.of.get(lsArr) : null;" (the reader's read at a reader year, the read here) against solve.js:1386-1396 (scoreMoves: the one-step value at the state from next year's table at the solve's 5 points, ex5) and the same at 41 Gauss-Hermite points (exF; audit-xas.mjs realAt, checked equal to the solve's own rates at its 5 points on every read); in the year before each step under COV the next year's table carries the edge node's sharp step (grid.js:283 and items/COV.md), which 5 points cannot resolve - the deep review's cause (2) - or the year's own 6 share nodes cannot represent - its cause (1). How often each acts per household, year, world, top cell and straddle is printed by the reducer beside the items
- **Plan section:** PLAN.md "XAS", "O99", "O76", "O100", "O55" and PR9

## Question

Under COV (the step-year edge node), is the optimism that moves to the year before each step on S370 the table's representation at that year (read above the exact one-step value at the state) or the 5-point quadrature across the next year's step (the one-step value above its 41-point value)? And at BASE's step reads on S370 and S130, is O76's optimism the representation (the flat copy) as ranked?

## Derivation

- **The split is exact.** At a read, read - claim = (read - ex5) + (ex5 - exF) + (exF - claim). The claim is the arm's read next year at BASE's realised next state, so its expectation given the state and BASE's move is the one-step value; exF integrates it at 41 points, so (exF - claim) has mean 0 up to exF's own error, and the gate checks that on every household, arm and kind (4 se). rep and quad are functions of the state alone: no draw enters them.
- **The sizes** (results-derive-xas.txt section 1, COV-B-STEP's fixed reads through its own gate): COV's mean D on S370 in the years before the steps, 1.304e-2 (year 2) and 2.517e-2 (year 6); BASE's at the step years, S370 2.033e-2 and 3.206e-2, S130 2.010e-2.
- **What each outcome would say.** If the year-before table cannot represent the value near the step (6 share nodes, the top cell copied), rep carries the error (REP): the fix is the table's - the edge node extended to the year before, or the chooser reading the exact one-step value there. If 5 points miss the next year's step, quad carries it (QUAD): the fix is the expectation's - Q's stepExpect (bridgeStep 'exact'), which today refuses the reader's tax (solve.js l.672). A CLOSE SPLIT: both; a WEAK one says nothing about the split (see Power).
- **The checks, each failed on a planted fault first:** reduce-xas.mjs's 25 planted checks (every outcome of both items reached; EDGES named: a self-check run on nothing, a read 1e-6 off COV-B-STEP's, rep equal to quad on every path, a split shown alone but not at the 0.05 line, a SPLIT whose detectable size exceeds a fifth of D, a split on a household the item does not read, the detectable size on a balanced y) and 35 of 35 mutations caught (results-reduce-xas-mutations.txt); the gate refuses a missing household, one not done, BASE with the reader's tax, COV without coverage, another seed, a failed self-check (either), a self-check run on nothing, another stamp, a missing file, a short read column, a read off COV-B-STEP's, and a draw off its expectation. The audit's own self-checks (the copied rates against the solve's at its 5 points; the 5-point variant path against scoreMoves; BASE's move's mixture score re-summed against chooseAction's) refuse the run on any miss; the build check (preflight-xas.sh, 4 points, 3 paths a world) runs them through the launcher.

## Prediction

- **Item 1 HELD:** on S370 under COV, the representation carries more of the year-before error than the quadrature - stated as the registered direction only; the derived credence puts HELD and FALSIFIED level (point: rep about half of read - exF there; results-derive-xas.txt section 4).
- **Item 2 HELD:** at BASE's step reads on S370 and S130, the representation carries more than the quadrature (point: rep about 0.9; derived credence below, a conjunction of two households).

## Falsified if

- **Item 1 FALSIFIED:** S370 reads QUAD (mean(rep - quad) below 0, shown after Holm). INCONCLUSIVE: SPLIT.
- **Item 2 FALSIFIED:** either S370 or S130 reads QUAD. INCONCLUSIVE: otherwise, unless both read REP.

## Fair-test table

Arms: BASE and COV, COV-B-STEP's, at the same states (BASE's paths and moves: a fixed-policy re-read).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | COV-B-STEP's panel: S370, S130, bridge 4, S126 | the same | SAME (COV-B-STEP's, chosen before it; its controls left out: they carry no step read) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002, 2,000 a world | the same reads | SAME (both arms read at BASE's states on BASE's paths; the gate holds them to COV-B-STEP's reads) |
| 8 | How each year's return is averaged (quadrature points) | 5 in both solves | 5 in both solves | SAME (the 41-point and stepExpect values are measurements at the same states, not an arm) |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points | 6, with the edge node a 7th slot in step years | TESTED (COV-B, as COV-B-STEP) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader | the reader with readerTax | TESTED (COV-B-STEP's COV arm: coverage needs readerTax, items/COV.md) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per read, from the per-read files: year, world, kind (step or spread), path, and per arm read, ex5, exF and claim.
- **Item 1 (primary; single look; a SPLIT labelled CLOSE or WEAK, see Power):** COV's reads on S370 in the years before each step (the step years less one, spread reads), per path y = the sum over those reads of (read - ex5) - (ex5 - exF); Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000 sign flips from fixed seeds, one-sided) of mean(y) above 0 (REP) and below 0 (QUAD), Holm over the 2; SPLIT otherwise. HELD on REP, FALSIFIED on QUAD, INCONCLUSIVE on SPLIT.
- **Item 2:** BASE's step reads on S370 and S130, per path y as item 1, Holm over the 4; HELD when both read REP, FALSIFIED when either reads QUAD, else INCONCLUSIVE.
- **Secondary (declared, decides nothing):** none.
- **Reported, not items:** for every household, arm and reader year, mean D, rep, quad and the draw; by world, top cell and straddle; BASE's quadrature against stepExpect where a step lies next year; S126's year-0 moves, the two moves' scores in each arm, and each arm's survival with its own and the other arm's opening (the McNemar cells).
- **NOT SETTLED**, if any gate fails: the stamps; a household missing, repeated or not done; an arm's settings not taking; a ran line off COV-B-STEP's unit; a self-check failed or run on nothing; a per-read file missing, unstamped, short or off its xas lines; a read or claim off COV-B-STEP's saved reads, or COV-B-STEP's files failing their own gate; the draw beyond 4 se of 0 on any household, arm or kind.
- **Declared choices, not derived:** 41 points as the fine quadrature (the step is resolved to about one node spacing there; stepExpect beside it for BASE); 4 se for the draw's gate; a path's reads summed (reads within a path share its state).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | the year-before optimism is the table's representation: design the family-3 fix as the edge node carried to the year before each step (or the chooser's exact one-step read there), tested against COV on S370 and S130 before 7an | 0.34 |
| item 1 INCONCLUSIVE | CLOSE: both terms carry it, so the fix design takes both (the node in the year before and stepExpect), each tested apart first. WEAK: no design decision; XAS's item 1 re-run on S370 with three times the paths, on paths XAS did not read and registered as its own test (a second look on the same paths would inflate the one-sided Holm alpha; the plan-auditor's MINOR 3 of 5 Oct 10:18 UK), before any family-3 fix is designed | 0.32 |
| item 1 FALSIFIED | the year-before optimism is the quadrature across the next year's step: Q's stepExpect with COV is family 3's fix candidate, after making it run with the reader's tax (solve.js l.672) | 0.34 |

## Decision fed

- **Item 1 HELD:** family 3's next fix is the table's (the year before each step); O99's relocation named as representation; XAS closes as the root-cause step and 7an's registration waits on that fix's test.
- **Item 1 FALSIFIED:** family 3's next fix is the expectation's (stepExpect with COV); O55's Q revived as the candidate.
- **Item 1 INCONCLUSIVE, CLOSE:** both designed and tested apart. **WEAK:** no design decision; item 1 re-run with three times the paths first.
- **Item 2:** HELD confirms O76's rank 1 (the flat copy at step reads) with a direct measure; FALSIFIED re-ranks O76 to the quadrature.
- **In every branch:** coverage and readerTax stay off in the code; no product change; 7an waits on the fix's test.

## Provenance

- **The design:** the deep review after COV-B-STEP (deep-review-log.md 5 Oct 09:27 UK: XAS, exact one-step values at BASE's saved states, representation against quadrature, by world, top cell and straddle; S126's opening swap and year-0 gaps); PLAN.md XAS.
- **The build:** audit-xas.mjs; reduce-xas.mjs (planted checks; mutations: results-reduce-xas-mutations.txt); preflight-xas.sh; derive-xas.mjs; batch-xas.sh.
- **Scoring lines added before launch (the maintainer's 'Go ahead' of 5 Oct):** item 2's households as scored legs and the judged credences of e549f95 kept beside the derived; reduce-xas.mjs prints the OUTCOME and LEGS lines the scorecard reads (it printed none, so XAS could not have been scored); planted checks 25, mutations 35 of 35.
- **Credences derived before launch:** the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK; the maintainer's question) found every credence judged, never computed from the Power section's stories, and item 1's (HELD 0.45, FALSIFIED 0.35) inconsistent with its own point (0.6, inside HELD); both items' credences are now computed from stated priors in derive-xas.mjs section 4 and the item 1 point restated as no lean. Item 2 was 0.70, the highest credence yet on a review-ranked cause.
- **Derive output amended before launch (the maintainer's 'Unlock enforcement', 5 Oct; d4487bd):** derive-xas.mjs section 4 prints the CREDENCE lines check-prediction.mjs now reads (item 1 point 0.5, HELD 0.34, INCONCLUSIVE 0.32, FALSIFIED 0.34; item 2 HELD 0.51, INCONCLUSIVE 0.27, FALSIFIED 0.22); every earlier line of results-derive-xas.txt is unchanged, so its hash moved and no figure did.
- **Amended after the first launch, before any reading by the decision rule (5 Oct):** the first launch (batch finished 14:15 UK) is INCOMPLETE: S370's mixture self-check failed on 141 of 41,436 reads, and the batch's reducer printed INCOMPLETE - 3 of 4 households done and read nothing. A diagnostic measurement (runs.log 14:36 UK, S370's BASE arm at 500 paths a world) put every mismatch at a position where every move fails in some world: the chooser's score and the re-sum are both -Infinity and |-Inf - -Inf| is NaN, so the check refused two equal values. audit-xas.mjs now counts equal values as a match; nothing else in the audit, reducer or prediction changed. The audit's hash moves, so all four households rerun under the same stamp. Seen while diagnosing, before the rerun: S370's BASE step and spread lines in the first launch's case0.txt (reads, rep, quad, D and D5). Item 2's S370 leg is a mean over BASE's step reads of (read - ex5) - (ex5 - exF), so its mean, (reads / paths) x (rep - quad), and its sign were visible from that line, though not computed then; its spread and its Holm p were not (the plan-auditor's BLOCKING 1 of 5 Oct 15:1x UK). No COV line and nothing from the other three households was seen; the diagnostic's own xas lines at 500 paths were written to its scratch log but never displayed (every look at the log filtered them out, and results-xas-selfcheck-diag.txt leaves them out); they hold no step read and no COV figure, so none of item 1's or item 2's data.
- **Amended after registration, before launch:** the Power section's spread restated as an assumption (grade C), not a bound, and the reducer's item lines given the realised sd(y) and detectable size (the plan-auditor's BLOCKING 1 of 5 Oct 10:09 UK); the planted checks 23, mutations 29 of 29; then each SPLIT labelled CLOSE or WEAK with its own action (the plan-auditor's BLOCKING 1 of 5 Oct 10:14 UK), planted checks 24, mutations 33 of 33.
- **Changed before registration:** the deep review's 5-point 'exact' value was split into ex5 (the solve's own points, which the table's nodes are built from) and exF (41 points), so representation and quadrature are separate terms; S370's years 2, 3, 6 and 7 widened to every reader year of the four households (the items read the step years and the years before them).

## Derivation script

- `derive: research/solver/derive-xas.mjs > research/solver/results-derive-xas.txt sha256 c5d114f42cb9833d`
  (the sizes each item splits; the power; the cost)

## Point and interval

- **Item 1:** rep's share of read - exF in S370's years before each step under COV about 0.5 (0.2 to 0.8): no lean between the deep review's two ranked causes, its ranked causes having read as ranked in 1 of 19 items (deep-review-log.md 5 Oct 10:16 UK).
- **Item 2:** rep's share at BASE's step reads about 0.9 (0.6 to 1.0).

## Credence

- **Item 1:** HELD 0.34, INCONCLUSIVE 0.32, FALSIFIED 0.34 (derived, results-derive-xas.txt section 4: the point and interval above through the decision bands, at the assumed spread and at twice it).
- **Item 2:** HELD 0.51, INCONCLUSIVE 0.27, FALSIFIED 0.22 (derived, section 4: per household REP 0.695 on S370 and 0.730 on S130 - the no-cliff story at the last step year mixed with a coin at weight 0.3 for the deep reviews' record - and both needed for HELD).
- **Item 2, leg S370:** HELD 0.695, INCONCLUSIVE 0.184, FALSIFIED 0.121 (derived, section 4; scored against reduce-xas.mjs's LEGS line).
- **Item 2, leg S130:** HELD 0.730, INCONCLUSIVE 0.156, FALSIFIED 0.114 (derived, section 4).
- **Judged, item 1:** HELD 0.45, INCONCLUSIVE 0.20, FALSIFIED 0.35 (the author's judgement as registered in e549f95, before the derivation; scored beside the derived credence, the maintainer's 'Go ahead' of 5 Oct on the deep review's decisive check).
- **Judged, item 2:** HELD 0.70, INCONCLUSIVE 0.20, FALSIFIED 0.10 (as registered in e549f95).
- **Kinds:** 1 ATTRIB; 2 ATTRIB.

## Power

From results-derive-xas.txt section 2, at an ASSUMED spread (grade C): if y = rep - quad has a per-path sd equal to D's, the test shows after Holm, at 80% power, |mean y| of 4.944e-3 a path for item 1 (against COV's summed D of 3.821e-2 in S370's years before the steps) and 5.238e-3 (S370) and 2.169e-3 (S130) for item 2 (against BASE's D of 2.033e-2 to 3.206e-2). That is not a bound: rep and quad share ex5 with opposite signs, so their covariance is negative where the 5-point value errs and sd(y) can exceed it (the plan-auditor's BLOCKING 1 of 5 Oct 10:09 UK). So reduce-xas.mjs prints the realised sd(y) and the detectable |mean y| at 80% power beside each item, and labels every SPLIT: CLOSE where that detectable size is at most a fifth of |mean D| over the same paths (the two terms are within a fifth of the error they split), WEAK otherwise (the test could not have shown a gap of that size; the plan-auditor's BLOCKING 1 of 5 Oct 10:14 UK). Only a CLOSE split feeds a design decision.

## Budget line

4 jobs, 7.5 core-hours at most from COV-B-STEP's seconds (results-derive-xas.txt section 3; the re-read taken at four times COV-B-STEP's, an upper estimate, grade C), about 2.3 hours on four cores, one process a household. Launched when the cores are free (after HYB).

## Pre-mortem

- **First:** the draw gate fails - exF is not the forward run's expectation (the forward run's returns and the table's differ, for instance in how the world's shift enters), so the split has an unnamed term; the read is NOT SETTLED and the mismatch is itself a finding for the register.
- **Second:** 41 points still miss a sharp step (the edge node makes next year's survival a near-step in accessible money), so quad is understated and rep overstated; stepExpect beside exF for BASE bounds it, and a large gap between the two there is reported.
- **Third:** in reader years the read is the reader's construct (the reference chance times the continuation), not a plain interpolation, so 'representation' includes the reader's own approximation; the split names where the error is (at the state's read against the one-step value), not which part of the reader's construct carries it.
- **Fourth:** S126's loss may not be one opening flip at all at 30 points; the swap lines read it (each arm with the other's opening), and if the swap does not move survival the deep review's account of S126 is withdrawn.

## Changes after seeing results

One, declared: after S370's BASE step line was seen (item 2's S370 leg mean visible, see the amendment of 5 Oct), audit-xas.mjs's mixture self-check was changed to count two equal values as a match (O102). Nothing that decides an outcome changed: the decision rule, the items, the households, the credences and the reducer are as launched (beff9ef); the fix moves no figure, and the identity gate holds the rerun's reads to COV-B-STEP's.
