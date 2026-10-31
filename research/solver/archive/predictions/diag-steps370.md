# Prediction: diag-steps370

- **Run:** `research/solver/batch-steps370.sh` - results/diagsteps370/case0.txt to case2.txt and their files (audit-steps370.mjs, the candidate's own unit on S370, six shares, five return nodes, no readerRef: the candidate as it stands, its plan reference: C at 30 wealth points; SN, C with explicit pension-share nodes [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1]; W60, C at 60 wealth points), read by reduce-steps370.mjs into results-steps370.txt
- **Kind:** test
- **Written:** 18 Oct, before the run (its time is its registering commit's, git log); the deep review after HO-DEP (deep-review-log.md 18 Oct 18:40 UK) and its adoption (PLAN.md's 18 Oct 18:42 row), under the maintainer's decision of the 17:19 row (each fix of a gap over a point gets its own development test on the tuning seeds before 7u-F)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world for every job's ledger, runs and whole score and every paired comparison; a development test, not a held-out read
- **Unmasking:** SN removes, if S370-COPY holds, a known error, the step read's copy across the unsupported top share node at the bridge's step reads (family 3, PR1, PR2, PR4), which drives S370's world-0 over-read at its step years 3 and 7 (O180); removing it may unmask another error at those years (the wealth axis at 30 points, or the year before each step, which reads in the top cell too: PR4's row). The arm pair that splits a harm under SN: SN against C itself, which differ in the share nodes alone (the same code, settings, seed and paths), with the residual by year beside; a harm of item 3 is the nodes' at S370, read by year before any breadth test; W60 against C splits the wealth axis's part (item 2), and the two arms' residuals by year and layer are reported side by side.
- **Mechanism:** src/solver/reader.js:116 "c[i] = c[g.index(ip, lo, it, ig, ic)]" (the reader's flat copy of the continuation across an unsupported share node, PR1); src/solver/grid.js:120 "const n2 = total ? (SN ? SN.length : ((pts && pts.share) || opts.shares || 6) + (COV ? 1 : 0)) : ni;" (six share points by default, PR4, or the explicit list's count); src/solver/grid.js:124 "axes.a = linAxis(COV ? n2 - 1 : n2); if (SN) axes.a = nodesAxis(SN);" (the share axis linear, or SN's explicit nodes); src/solver/grid.js:697 "function shareNodesOf(opts, total, cov)" (the option, NODE-1's); the derive line prints world 0's step-year residual per path on S370 (results-derive-steps370.txt section 1: mean 10.6358 points, sd 2.9814, under the order reference on seed 7004)
- **Plan section:** PLAN.md "STEP-S370" (items/STEP-S370.md), O180, PR1, PR4; the deep review after HO-DEP (deep-review-log.md 18 Oct 18:40 UK)

## Question

Do explicit share nodes in the top cell remove S370's world-0 step-year over-read (the step read's copy across the unsupported top node), do 60 wealth points remove it instead, and does the share-node change do S370 no material harm?

## Derivation

- **What the records say:** HO-DEP's S370 jobs on seed 7004 behind HO-DEP's gate (results-derive-steps370.txt section 1): under the order reference S370's tables 50.3079, 89.1297 and 98.6252 by world against runs 1577, 3412 and 3960 of 4,000; world 0's step-year residual Y3 + Y7 per path mean 10.6358 points, sd 2.9814. Its bridge part sits at years 3 and 7 under both references (O180; results-hodep.txt: A 4.2008 and 6.5047, O 4.1214 and 6.5145), and the step reads there put 0.6488, 0.6466 and 0.6448 of their weight on the unsupported top node by world (results-pmap.txt).
- **What STEP-S370 changes, and nothing else:** SN differs from C in the share nodes alone, W60 in the wealth points alone; the same code, settings, household, seed and paths. The candidate runs with no readerRef (its own plan reference), which at S370's step years is the same 0/1 step as the order reference, so HO-DEP's O stands for C in the derivation (stated, grade C).
- **Departures, declared:** item 3 read by RULES.md section 8's rule as written (the mixture is for a reference change; the plan-auditor's MINOR 2 of 18 Oct 18:48 UK); the derivation's first output (committed in 3e3a7d2) drew SN's discordance at the judged share in every world, which at world 2's 99% survival capped the saved paths and read a no-change story as harm (item 3 FALSIFIED 0.47 at a true zero, R2 0.48); the draw now scales the discordance by 4p(1 - p), the judged share unchanged.
- **The stories:** derive-steps370.mjs's JUDGED block (committed in a997f5e before any of its output and before any STEP-S370 run): per S370 cause (COPY, GRID, CLIP, OTHER) SN's and W60's removal of the residual and SN's survival change; the path noise, SN's discordance, the whole score's continuous part and the table's drop judged across causes.
- **Power:** through reduce-steps370.mjs's own items() on synthetic reads, C's per-path residual resampled from HO-DEP's O (section 2).
- **Preflight:** it prints each arm's world-0 step-year residual, the step reads' top-cell copies (copiedTop) and the world-0 whole score at a fifteenth of the points, the share-nodes test on this code, and each plant refused on its own check.

## Prediction

Item 1 HELD (0.41: SN removes at least half of world 0's step-year residual) about as likely as FALSIFIED (0.42); item 2 FALSIFIED (0.55: W60 removes under a quarter); item 3 INCONCLUSIVE (0.54) over HELD (0.38); item 4 FALSIFIED (0.41) about as likely as HELD (0.35). The decision table's likeliest row is R1 (0.39), 'else' next (0.25). The figures are the derivation's with the leading cause at the record's rate (results-derive-steps370.txt section 3b; at the receipt's own credences, section 3: items HELD 0.56, 0.15, 0.38 and 0.46, R1 0.51).

## Falsified if

Item 1 FALSIFIED: SN's removal of C's world-0 step-year residual wholly below a quarter (its 95% interval). Item 2 FALSIFIED: W60's the same. Item 3 FALSIFIED: SN against C reads harm in any world (the exact rule, Holm-adjusted, at the relative margin, or the whole score wholly below minus the margin). Item 4 FALSIFIED: the drop in world 0's table less runs wholly below a quarter of C's.

## Fair-test table

C against SN and C against W60 on S370, each pair on the same paths (seed 7002's first 4,000 a world), settings, code and household; each pair differs in one setting.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S370 | S370 | ACCEPTED - S370 is the household whose over-read the test reads (O180), named by the deep review after HO-DEP from HO-DEP's records, a tuning household (7e's 25, 7u's 55); the same household in every arm |
| 17 | The grid: points, shares, gain buckets | C: 30 points, the uniform six share nodes | SN: 30 points, NODES_SN (eight); W60: 60 points, six share nodes | TESTED - SN against C the share nodes alone (items 1, 3, 4); W60 against C the wealth points alone (item 2) |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (01abacb478e9) | the same | SAME - all three jobs in this batch |
| 29 | The statistic and its definition | world 0's step-year residual Y3 + Y7 per path (AN's ledger); survival and the whole score; the table less runs | the same | ACCEPTED - the residual is the ledger's grid term at the visited states of S370's step years, held to the identity on every path (ownTook, identity); the whole score is reduce-7t.mjs's arithmetic from each run's own trace (scoreTook's two legs) |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | ACCEPTED - items 1 and 2 the ratio of paired sums with its delta-method interval; item 3 the exact conditional McNemar with Holm and the guarded unconditional interval per world, the whole score's normal interval; item 4 the tables fixed and the runs paired |
| 33 | For timings: what else the machine was running | the batch's other jobs, three cores | the same | ACCEPTED - the solves' seconds are reported, not read by an item |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** items 1 and 2, the removal R = sum(C - X) / sum(C) of world 0's per-path Y3 + Y7 in points, its interval by the delta method on the ratio of paired means at 95%; item 3, per world, stats.mjs's exact conditional McNemar (one-sided harm) with Holm across the three worlds and outcome() at the relative margin marginRel(C's survival in that world), the guarded unconditional interval (survivalChangeU, reduce-7aa.mjs guarded) at 95%, and the whole score's paired mean with its normal interval at 95%; item 4, the drop (C's world-0 table less runs) - (SN's), the tables fixed and the runs' paired change by the guarded unconditional interval at 95%.
- **Item 1 (primary; single look):** HELD when SN's removal interval lies at or above one half; FALSIFIED when it lies below one quarter; INCONCLUSIVE otherwise, or when C's mean residual is under a point.
- **Item 2 (single look):** the same for W60.
- **Item 3 (single look):** HELD when every world reads no material harm on survival by both rules and on the whole score (lower ends above minus the margin); FALSIFIED when any world reads harm (the Holm-adjusted p under 0.05 with a point loss of at least the margin, or the whole score wholly below minus the margin); INCONCLUSIVE otherwise.
- **Item 4 (single look):** HELD when the drop's interval lies at or above half of C's world-0 table less runs; FALSIFIED when it lies below a quarter of it; INCONCLUSIVE otherwise, or when C's table less runs is under a point.
- **A cause is read only as the items bear on it:** item 1 HELD credits S370-COPY over GRID and CLIP (each of which predicts SN removes little); item 1 FALSIFIED reads 'SN does not remove it' and settles no cause, S370-COPY left open, since the run does not print that SN cut the step reads' weight on the unsupported top node a = 1 (the mechanism; copiedTop counts copied nodes, which SN cannot change while a = 1 stays unsupported, PR2; the plan-auditor's BLOCKING 1 of 18 Oct 19:46 UK); item 2 HELD credits GRID with W60's part of the residual; items 1 and 2 both HELD read 'either change removes it', neither cause credited over the other, the parts read by year (the plan-auditor's MINOR 1 of its re-review); OTHER is never credited.
- **Reported, not items:** every arm's tables against its runs by world; GB, GA and T and the residual by year by world; the step reads' copied and top-cell copied nodes; the solves' seconds.
- **Declared choices, not derived:** the lines one half and one quarter (the review's), the floor of a point for nothing to remove; NODES_SN (the review's: three more nodes in the top cell); 60 wealth points (the review's).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 3 FALSIFIED (R2) | SN harms S370 by section 8's rule: the share-node change is not a fix as it stands; the deep review reads which world and which years, with SN's residual by year beside; nothing built | 0.08 |
| item 1 HELD, item 3 not FALSIFIED (R1) | the step read's copy across the unsupported top node carries S370's step-year over-read (S370-COPY credited, grade B for S370, one seed): the share-node fix's breadth test follows on PMAP's other step households and the gap households (O139, O145, O133's) under the 17:19 rule, W60's share read beside for the after-access part; no default | 0.39 |
| item 1 FALSIFIED, item 2 HELD (R3) | SN does not remove it and 60 wealth points do (S370-GRID credited, S370-COPY left open): wealth-axis work first (O139, O180's and O133's after-access parts) before any share-node fix | 0.20 |
| items 1 and 2 FALSIFIED (R4) | neither the nodes nor the points remove it: no cause settled (COPY open, SN's reach at the top node unshown; CLIP and OTHER open); the deep review roots it, with the step reads' weight on the unsupported top node measured, before any fix | 0.08 |
| else | nothing a row above names: the deep review reads the unsettled items with the reported lines before the next step; nothing built; no default | 0.25 |

- **The rows' credences are the JUDGED stories' with the leading cause at the record's rate (results-derive-steps370.txt section 3b; at the receipt's own credences, section 3: R1 0.51, R2 0.10, R3 0.15, R4 0.05, else 0.20).**
- **The escalation rule (escalation.md, trigger 3):** the run is under 2 hours' wall (about 1.79 h, results-derive-steps370.txt section 4) and 'else' is 0.25, so trigger 3 does not apply; trigger 1 is not met (triggers.mjs --due)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD says SN's top-cell nodes remove at least half of S370's world-0 step-year residual; FALSIFIED says under a quarter; inconclusive names the interval.
- **Item 2:** the same for 60 wealth points.
- **Item 3:** HELD says SN does S370 no material harm in any world; FALSIFIED names the world and the leg.
- **Item 4:** HELD says SN's world-0 table falls by at least half of C's over-read at its own opening; FALSIFIED says it barely moves.
- **In every branch:** no product change; the candidate's settings unchanged; the share-node option stays research only, unset in every product path; 7u-F held (the 17:19 row).

## Provenance

- **The design:** the deep review after HO-DEP (deep-review-log.md 18 Oct 18:40 UK) proposed STEP-S370; its adoption (PLAN.md's 18 Oct 18:42 row; the plan-auditor's PASS of 18:48 UK, its MINOR 2 setting item 3's rule), under the maintainer's standing go-ahead (4 Oct), the hand-over (17 Oct) and the decision of the 17:19 row.
- **The build:** audit-steps370.mjs (HO-DEP's audit with AN's ledger and the whole score, on the candidate as it stands; armTook reads the nodes asked and the grid's size; plants nodes, own, layer, quad, held, score, trace); reduce-steps370.mjs (56 planted checks, each item to all three outcomes, five EDGES); mutate-reduce-steps370.py (42 of 42 caught on the reducer's blob as launched, results-reduce-steps370-mutations.txt); derive-steps370.mjs; preflight-steps370.sh and batch-steps370.sh (a997f5e).
- **Seen before registration (declared):** HO-DEP's records and results (S370's tables, runs and residual by year under both references on seed 7004, O180), PMAP's S370 rows, the deep review's receipt, the derivation's first output (the draw fixed since, the Departures line), and every preflight line below.
- **The preflight** (through the launcher, seed 7002, 40 paths a world; results-steps370-preflight.txt): the first launch (runs.log 18 Oct 19:30 UK, on a997f5e): SMOKE PASSED; the three jobs exit 0 with every self-check in full, scoreTook's two legs 120 of 120 on each; (A) the gate passed at a fifteenth of the points (reduce-steps370.mjs --preflight): SN's explicit nodes solve with the candidate's other settings (grid total4x8x6, shareNodes as asked), C and W60 at the uniform six; (B) research/tests/share-nodes.test.mjs on this code: 12 PASS, 0 FAIL; (C) the seven plants refused, each on its own check (nodes: armTook; own: ownTook 0/120; layer: identity 2/120; quad: qfTook 364/828; held: layerTook 702/828; score: scorePaths 79/120; trace: counters 41/120). Its bearing, declared: at 4 wealth points (a fifteenth of 30 and of 60, so W60's job is C's there) world 0's step-year residual reads 41.3181 points under C and 40.5505 under SN on 40 paths, about 2% removed, and the step reads' top-cell copies are 6804 under both (SN narrows the top cell but the top node a = 1 stays unsupported, PR2); at four times the 30-point residual's size this points to item 1 FALSIFIED only weakly; the credences, derived before it, are left as derived.

## Derivation script

- `derive: research/solver/derive-steps370.mjs > research/solver/results-derive-steps370.txt sha256 437a76c7d52fa64c`
  (HO-DEP's S370 jobs behind HO-DEP's gate; the power of items 1 to 4 through reduce-steps370.mjs's own items(); the credences from the receipt's S370 CAUSE CREDENCES, read from the log, through the JUDGED stories committed before the output, as stated (section 3) and with the leading cause at the record's rate read from results-scorecard.txt (section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget)

## Point and interval

- **Item 1:** 0.2514, the share of C's world-0 step-year residual SN removes (results-derive-steps370.txt section 3b); 80% interval 0.0001 to 0.8984
- **Item 2:** 0.2007, the share W60 removes (results-derive-steps370.txt section 3b); 80% interval -0.0005 to 0.7026
- **Item 3:** 0.0000, SN's survival change against C in world 0, points (results-derive-steps370.txt section 3b); 80% interval -0.4250 to 0.4500
- **Item 4:** 3.1475, the drop in world 0's table less runs, SN against C, points (results-derive-steps370.txt section 3b); 80% interval 0.0250 to 9.4973

## Power

From results-derive-steps370.txt section 2 (40 draws a cell through reduce-steps370.mjs's own items(); C's world-0 residual resampled from HO-DEP's O, 4,000 paths a world):

```
  item 1, SN removes 0 of the residual (noise x0.5): HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 1, SN removes 0.25 of the residual (noise x0.5): HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 1, SN removes 0.5 of the residual (noise x0.5): HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 1, SN removes 0.6 of the residual (noise x0.5): HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 1, SN removes 0.6, noise x1: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 2, W60 removes 0.1: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 2, W60 removes 0.4: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 2, W60 removes 0.7: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, SN's survival change -0.25 a world (discordance 3%): HELD 0.00 INCONCLUSIVE 0.72 FALSIFIED 0.28
  item 3, SN's survival change 0 a world (discordance 3%): HELD 0.35 INCONCLUSIVE 0.63 FALSIFIED 0.03
  item 3, SN's survival change 0.25 a world (discordance 3%): HELD 0.85 INCONCLUSIVE 0.15 FALSIFIED 0.00
  item 4, SN removes 0.2 with its table falling as much: HELD 0.00 INCONCLUSIVE 0.40 FALSIFIED 0.60
  item 4, SN removes 0.5 with its table falling as much: HELD 0.13 INCONCLUSIVE 0.88 FALSIFIED 0.00
  item 4, SN removes 0.75 with its table falling as much: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
```

Items 1 and 2 separate cleanly at 4,000 paths: a removal of 0.6 or more reads HELD, a tenth FALSIFIED, between them INCONCLUSIVE, whatever the path noise. Item 3 holds a true zero a third of the time at 3% discordance (the world-0 interval is near the margin's width) and falsifies a loss at the margin about a quarter of the time. Item 4 holds when SN removes three quarters and its table falls as much.

## Budget line

From results-derive-steps370.txt section 4 (grade C: HO-DEP's O on S370 at 30 points, solve 1735 s and its ledger on 12,000 paths 1977 s): C and SN about 1.03 h each, W60 about 1.79 h (twice the solve, half again the ledger, judged); three jobs on three cores, the wall about 1.79 h; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: the stand-in.** The derivation reads HO-DEP's order-reference S370 on seed 7004 for the candidate's plan reference on seed 7002; at the step years the references read the same step, but the candidate's other years and the seed's paths differ, so C's residual may differ in size (grade C).
- **Second: SN may move the policy.** Explicit nodes change every table the chooser reads near the top of the share axis, not only the step reads; if SN moves S370's moves widely, item 3 has many discordant paths and reads INCONCLUSIVE at a true zero (HELD 0.35 at 3% discordance).
- **Third: the table and the residual.** Item 4 assumes the table falls with the step-year residual (judged tabRatio 0.7 to 1.2); the table at the opening carries GA and T as well, which SN need not move.
- **Fourth: one household, one seed, and the tuning seed.** A HELD is S370's at 30 points; the breadth test (R1) carries it to the other step households.
- **Fifth: the stories after the records.** The JUDGED block was written after HO-DEP's read and the deep review after it (grade D).
- **Sixth: the preview.** The preflight's 4-point cell had SN removing about 2% of world 0's step-year residual with the top node's copies unchanged (the Provenance); if the 30-point jobs read alike, item 1 reads FALSIFIED where the registered credence leans to R1 (0.39), and the copy's carrier is the unsupported top node itself (PR2), which no share-node list removes.

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.78 (46 of 58), EFFECT 0.71 (19 of 26), ATTRIB 0.47 (39 of 83), SIZE 0.53 (24 of 45), CTRL 0.79 (18 of 22), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.42 (14 of 34)).

Items 1, 2 and 4 rest on the deep review's ranked causes (COPY for items 1 and 4, GRID for item 2), so each starts from a deep review's cause rate, 0.42, and the derivation takes the leading cause (COPY) at that rate (section 3b): item 1 derived 0.41, item 2 0.21 (GRID is not the lead), item 4 0.35; item 3 is a no-harm item (NOHARM, 0.78), derived 0.38 (SN's discordance at S370's mid survival widens the world-0 interval to near the margin).

- **Base rate, item 1:** 0.42 (a deep review's cause: the step read's copy carries the over-read)
- **Base rate, item 2:** 0.42 (a deep review's cause: the wealth axis carries it)
- **Base rate, item 3:** 0.78 (NOHARM)
- **Base rate, item 4:** 0.42 (a deep review's cause: the table falls with the copy removed)
- **Item 1:** HELD 0.41, INCONCLUSIVE 0.16, FALSIFIED 0.42 (derived, results-derive-steps370.txt section 3b)
- **Item 2:** HELD 0.21, INCONCLUSIVE 0.24, FALSIFIED 0.55 (derived)
- **Item 3:** HELD 0.38, INCONCLUSIVE 0.54, FALSIFIED 0.08 (derived)
- **Item 4:** HELD 0.35, INCONCLUSIVE 0.24, FALSIFIED 0.41 (derived)
- **Judged:** none (the judged inputs are derive-steps370.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 NOHARM, 4 ATTRIB

## Changes after seeing results

None.
