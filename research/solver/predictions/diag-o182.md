# Prediction: diag-o182

- **Run:** `research/solver/batch-o182.sh` - results/diago182/case0.txt to case2.txt and their files (audit-o182.mjs, the candidate's own unit on S370, 30 wealth points, five return nodes, no readerRef: the candidate as it stands, its plan reference: C with the uniform six share nodes; SN, C with explicit pension-share nodes NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1], eight in all, the uniform six with two (0.9 and 0.95) added in the top cell; SNR, SN with `readerSplit: 'ru'`), read by reduce-o182.mjs into results-o182.txt against STEP-S370's saved C and SN (results/diagsteps370)
- **Kind:** test
- **Written:** 19 Oct, 00:12 UK, before the run; the deep review after STEP-S370 (deep-review-log.md 18 Oct 22:45 UK) and its adoption (PLAN.md's 18 Oct 23:10 row), under the maintainer's decision of the 17:19 row (each fix of a gap over a point gets its own development test on the tuning seeds before 7u-F) and the hand-over of 19 Oct
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world for every job's ledger, split, runs and whole score and every paired comparison, the paths STEP-S370's saved C and SN ran on (the inert gate compares them bit for bit); a development test, not a held-out read
- **Unmasking:** SNR removes, if O182-RESID holds, a known error the share-node fix makes (O182, PR25): a copied interior node's residual R carried unscaled into queries whose chance is near 1, which drives SN's world-0 over-read at years 1 and 5; removing it may unmask another error there (the reference's steepness against the policy's bridge survival at the support edge, the review's root, which R only carries; or the year before each step, O182-YB). The arm pair that splits a harm under SNR: SNR against SN, which differ in the residual's scaling alone (the same code, nodes, settings, seed and paths; item 2, with the residual by year beside), and SN against C (STEP-S370's pair, re-run here bit for bit); a harm of item 4 under SNR is the scaling's only where SN against C reads none, and is NOT SETTLED as the scaling's until SNR against SN reads it by world and year (reported). Where the over-read moves rather than falls (item 3 FALSIFIED with item 2 HELD, R2), the move is read by year beside the split before any fix (WHOLE; RULES.md section 9).
- **Mechanism:** src/solver/grid.js:418 "cc += w * RD.c[IDX[k]]; rr += w * RD.R[IDX[k]];" (the read carries each corner's residual R unscaled into the query, PR25); src/solver/grid.js:417 "else if (g.reader.ru)" (SNR's arm, each corner's R scaled by ruScale where the query's chance is the higher); src/solver/grid.js:38 "export const ruScale = (pq, pk) => (pq > pk ? (1 - pq) / (1 - pk) : 1);" (the factor); src/solver/reader.js:134 "for (let i = 0; i < n; i++) R[i] = S[i] - p[i] * c[i];" (a copied node keeps R = S - p c after c is copied, PR1); the derive line prints SN's world-0 Y1 + Y5 per path on S370 (results-derive-o182.txt section 1: mean 7.7122 points, sd 3.0923, seed 7002)
- **Plan section:** PLAN.md "STEP-O182" (items/STEP-O182.md), O182, O180, PR25, PR1, PR4; the deep review after STEP-S370 (deep-review-log.md 18 Oct 22:45 UK)

## Question

Does a copied corner's residual R, carried unscaled into queries of higher chance, carry the over-read SN shows at S370's years 1 and 5 (O182), and does scaling it (SNR) remove that over-read and the world-0 table's gap, with no material harm against the candidate?

## Derivation

What the mathematics and the existing records say, with the scripts that computed any figure. Each line below came from a miss; lessons.md holds each one's case.
POWER: a power model draws every count its reducer reads from that count's own sampling distribution (lost and saved each, not only their churn), as the same statistic the reducer prints with the household's own parameters; its noise or flip parameters are computed by the derive script from named records (power also printed at two larger values), and each check it names is run once on a planted case of its claim, the output quoted here. Its stories go wherever the quantity can (a share or removal past the whole and across the runs; a table or rate kept in range by an assert), nested arms drawn coupled, an arm's own opening move sized from the family's openings. A quantity built from simulated paths, or a code bound, carries its sampling interval (and the bound's side) from the first draft, and the rule reads the interval's ends. A review's decision lines are run through the power model on the same draws as any replacement, both printed, before registration; a rule a review set is read as set, or the departure declared.
CAUSES: a cause map settles a cause 'not' only where the run prints that its arm reached the mechanism, and blames an arm read against a second reference only where that reference is shown clear of the error at the arm's states; otherwise the causes stay open. An item deciding between causes names each cause's outcome and credits a cause only where its outcome is likelier under it than under every rival, on arms whose gap that cause alone can carry; its reducer plants the cause's smallest move (a capped quantity: the cap). A Decision fed gives an arm's change to one part only when the item that splits it reads HELD (RULES.md section 9 rule 1); an over-correction is read for the cause, with its own row; a control reads only the arm whose failure would change the action.
SLICES: a statistic over a table's nodes is read only over the nodes the read weighs at the states the policy visits (the corners its records' reads use), never over every node of the grid. An arm that removes an error is read against the runs in every world, counted or not; a convergence item reads each market world apart from that world's own earlier moves. A share attributed to a subset of path-years (a tier layer, a state band) is read against that subset's share year by year (year-matched), never pooled across years, and a cause on it is held only with a state-matched read where the subset's states differ.
PREFLIGHT: it prints each arm's statistic beside its control's on every household read (an arm equal to its control everywhere is a design fault, not a null) and, for a cause on a ratio of table reads, the ratio's median and tail per cell before the credences are derived.
CARRY: a per-household record carries only to a test differing in the estate weight alone, within its paired band, except a part left out, a year-0 gap moved across the switch line, or a household with 15 or more saved or lost (each its own record); a whole score is re-scored on the record's traces with the policy held (O123); otherwise grade D, interval wide. Uncovered panel households carry from a record chosen by the same rule, never another panel's subset, else widened to the record's spread, grade D in the pre-mortem.
PRIOR: an earlier measurement of the same mechanism sets the stories' starting size, scaled to the new case, before any shading toward a track record.
STAMPS: a test run by more than one audit script registers the split, its reducer calls the fair-test gate on each audit's logs, and the preflight runs that split on its own logs (the reducer's preflight mode skips the gate).
CORNERS: an arm is judged equal to its control at the preflight only where the preflight's corners are alive (p and S above the clamp) at the reads the mechanism uses.
RATES: results-scorecard.txt is regenerated (scorecard.mjs) before a base rate or the lead rate is quoted, and a preflight's reported cells with intervals clear of zero are in the register before registration.
FIXTURES: an audit's household constants (floors, bills, inflow years) are computed from the scenario library by the product's own rule, never typed, and after any edit under src/solver the e3pcls pin is re-taken (node research/tests/solver-e3pcls.test.mjs 4 --pin) before a preflight.
PLANTS: a plant names the states where it changes a value, and the preflight shows its check reads one of them; a plant that can change only a value already at its floor or clamp at every read is inert by construction. A guard added ahead of a plant's own check is passed by the plant on purpose (declared, as HO-DEP's arm plant declares K1F unfixed), so each check is still shown failing on its own fault.
REACH: a screen that chooses households for a reference or reader change keeps only households where the mechanism can act (for the bridge reader, a bridge failure under the control) before it applies a survival band, and the reach step counts the moves the change makes.
PREVIEW: a preflight at a fraction of the points is not read for the direction or size of an effect that depends on the grid's resolution; its bearing is declared as such.
WHOLE: a fix aimed at one slice of a residual (a year, a layer, a cell) reads the whole residual beside the slice (the table less runs and the residual by year), so a residual that moves shows as moved, not removed.
DISCORD: a power model's paired discordance in each world scales with the paths that can flip there (4p(1 - p) at the control's survival), never one share fixed across worlds.

- **What the records say:** STEP-S370's saved C and SN on seed 7002 behind STEP-S370's gate (results-derive-o182.txt section 1): C's tables 49.0987, 87.9402 and 98.2445 by world against runs 1602, 3472 and 3959 of 4,000; world 0's table less runs C 9.0487, SN 10.3428; SN's world-0 Y1 + Y5 per path mean 7.7122 points, sd 3.0923; C against SN discordant on 63, 31 and 6 paths by world (0.0164, 0.0169 and 0.0370 of 4p(1 - p) of the paths). The PRIOR: the receipt's copied corners' I[R] against SN's Y1 at judged year-1 states, 0.89, 1.09 and 0.99 by world (read from the log; grade C, year 5 unread).
- **What STEP-O182 changes, and nothing else:** SNR differs from SN in the residual's scaling alone; SN from C in the share nodes alone; the same code, settings, household, seed and paths. C and SN run on the new code with the option off and must reproduce STEP-S370's saved runs bit for bit (the reducer's inert gate), so their residuals and runs enter the derivation as recorded.
- **Departures, declared:** item 4 read by RULES.md section 8's rule as written (a policy change, not a reference change); item 3's line is the review's (SNR's gap at most half of C's), read as set. The derivation's first output (2b5b198, sha256 7d583a488a6a094b) tied SNR's gap to the Y1 + Y5 it removes one for one, so the decision table's R2 could not be drawn (R2 0.00; items HELD 0.42, 0.32, 0.17 and 0.32 in its section 3b); a judged displacement story (`move`, the share of the removed Y1 + Y5 that reappears elsewhere in world 0's gap) was added to the JUDGED block AFTER that output was seen (407ecf8), its reason on record before it (STEP-S370's item 4 and WHOLE lesson); the second output (06088bb) is the one registered.
- **The stories:** derive-o182.mjs's JUDGED block (committed in 14defee before any output, `move` in 407ecf8 after the first output, declared above): per O182 cause (RESID, YB, TOP, GRID, OTHER) the copied corners' share of SN's Y1 + Y5, SNR's removal of it, the share that moves elsewhere and SNR's survival change; the path noise, SNR's discordance (scaled by 4p(1 - p), DISCORD), the whole score's continuous part and the other years' change judged across causes.
- **Power:** through reduce-o182.mjs's own items() on synthetic reads, SN's per-path Y1 + Y5 and C's runs as recorded (section 2).
- **Preflight:** it prints each arm's world-0 Y1 + Y5 beside its copied corners' I[R], the copied nodes, the reads at the clamp and the world-0 whole score at a fifteenth of the points (a preview, PREVIEW), the reader-ru test on this code, and each of ten plants refused on its own check.

## Prediction

Item 1 HELD (0.42: the copied corners' I[R] carries at least half of SN's world-0 Y1 + Y5) over INCONCLUSIVE and FALSIFIED (0.29 each); item 2 FALSIFIED (0.47: SNR removes under a quarter) over HELD (0.33); item 3 FALSIFIED (0.67: SNR's world-0 gap more than three quarters of C's) over INCONCLUSIVE (0.24); item 4 INCONCLUSIVE (0.55) over HELD (0.34). The decision table's likeliest row is 'else' (0.48), R3 next (0.26). The figures are the derivation's with the leading cause at the record's rate (results-derive-o182.txt section 3b; at the receipt's own credences, section 3: items HELD 0.80, 0.60, 0.16 and 0.34, R1 0.14, R2 0.13, else 0.52).

## Falsified if

Item 1 FALSIFIED: the copied corners' share of SN's world-0 Y1 + Y5 wholly below a quarter (its 95% interval). Item 2 FALSIFIED: SNR's removal of SN's world-0 Y1 + Y5 wholly below a quarter. Item 3 FALSIFIED: the drop in world 0's table less runs, SNR against C, wholly below a quarter of C's. Item 4 FALSIFIED: SNR against C reads harm in any world (the exact rule, Holm-adjusted, at the relative margin, or the whole score wholly below minus the margin).

## Fair-test table

C, SN and SNR on S370, on the same paths (seed 7002's first 4,000 a world), settings, code and household. SN against SNR differ in one setting (item 2); C against SNR differ in the fix as a whole, the nodes with the scaling (items 3 and 4: the fix the review proposes, against the candidate); item 1 reads SN alone.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S370 | S370 | ACCEPTED - S370 is the household whose displacement the test reads (O182), named by the deep review after STEP-S370 from STEP-S370's records, a tuning household; the same household in every arm |
| 17 | The grid: points, shares, gain buckets | C: 30 points, the uniform six share nodes | SN and SNR: 30 points, NODES_SN (eight: the uniform six with 0.9 and 0.95 added in the top cell) | TESTED - SN against C the share nodes alone (STEP-S370's pair, re-run bit for bit); SNR against C the fix as a whole (items 3 and 4); SN and SNR share the nodes |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | C and SN: the bridge reader, each corner's R carried unscaled | SNR: the bridge reader with each corner's R scaled by (1 - pq) / (1 - pk) where pq > pk (`readerSplit: 'ru'`) | TESTED - SNR against SN the scaling alone (item 2); within the fix as a whole against C (items 3 and 4) |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (14defee's src/solver) | the same | SAME - all three jobs in this batch; C and SN must also reproduce STEP-S370's saved runs, made on 01abacb478e9's code, bit for bit (the inert gate: the new code's option off) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome; a net or estate item's mean, capped mean or median, and why the score or app reads that one) | world 0's Y1 + Y5 per path (AN's ledger) and its split into p x I[c], the supported corners' I[R] and the copied corners' I[R]; survival and the whole score; the table less runs | the same | ACCEPTED - the residual is the ledger's grid term at the visited states of S370's years 1 and 5, held to the identity on every path (ownTook, identity); the split gives each read back exactly (splitTook) and its copied class is the solve's (copyTook); the whole score is reduce-7t.mjs's arithmetic from each run's own trace (scoreTook's two legs) |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | ACCEPTED - items 1 and 2 the ratio of paired sums with its delta-method interval; item 3 the tables fixed and the runs paired; item 4 the exact conditional McNemar with Holm and the guarded unconditional interval per world, the whole score's normal interval |
| 33 | For timings: what else the machine was running | the batch's other jobs, three cores | the same | ACCEPTED - the solves' seconds are reported, not read by an item |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** item 1, the share S = sum(RC1 + RC5) / sum(Y1 + Y5) of SN's world-0 per-path values in points, its interval by the delta method on the ratio of paired means at 95%; item 2, the removal sum(SN - SNR) / sum(SN) of world 0's per-path Y1 + Y5, the same interval; item 3, the drop (C's world-0 table less runs) - (SNR's), the tables fixed and the runs' paired change by the guarded unconditional interval at 95%; item 4, per world, stats.mjs's exact conditional McNemar (one-sided harm) with Holm across the three worlds and outcome() at the relative margin marginRel(C's survival in that world), the guarded unconditional interval (survivalChangeU, reduce-7aa.mjs guarded) at 95%, and the whole score's paired mean with its normal interval at 95%.
- **Item 1 (primary; single look):** HELD when the share's interval lies at or above one half; FALSIFIED when it lies below one quarter; INCONCLUSIVE otherwise, or when SN's mean Y1 + Y5 is under a point.
- **Item 2 (single look):** HELD when SNR's removal interval lies at or above one half; FALSIFIED when it lies below one quarter; INCONCLUSIVE otherwise, or when SN's mean is under a point.
- **Item 3 (single look):** HELD when the drop's interval lies at or above half of C's world-0 table less runs; FALSIFIED when it lies below a quarter of it; INCONCLUSIVE otherwise, or when C's table less runs is under a point.
- **Item 4 (single look):** HELD when every world reads no material harm on survival by both rules and on the whole score (lower ends above minus the margin); FALSIFIED when any world reads harm (the Holm-adjusted p under 0.05 with a point loss of at least the margin, or the whole score wholly below minus the margin); INCONCLUSIVE otherwise.
- **A cause is read only as the items bear on it:** item 1 HELD credits O182-RESID over YB, TOP and GRID (each predicts the copied corners carry little of years 1 and 5) for the year-1-and-5 slice; item 1 FALSIFIED settles O182-RESID 'not', since the run prints its own arm reaching the mechanism (the copied corners' I[R] is the mechanism's own quantity, read at every visited read of those years, splitTook and copyTook holding); item 2 HELD credits the scaling with removing the slice; item 3 reads the over-read itself, the question O182 and S370-COPY leave open; S370-COPY is not scored from this test unless item 3 reads (its receipt's question, the over-read's carrier); OTHER is never credited.
- **Reported, not items:** every arm's tables against its runs by world; GB, GA, T and the residual by year by world; the split by year by world; the copied nodes; the reads at the clamp; the solves' seconds.
- **Declared choices, not derived:** the lines one half and one quarter and the floor of a point (the review's); NODES_SN (STEP-S370's array, eight nodes, the count from the array); the scaling (1 - pq) / (1 - pk) (the review's, RS's mirror).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 4 FALSIFIED (R4) | SNR harms S370 against the candidate by section 8's rule: the fix is not a fix as it stands; which world and years, with SNR against SN by year beside (the harm is the scaling's only where SN against C reads none); nothing built | 0.11 |
| items 2 and 3 HELD (R1) | the scaling removes the years-1-and-5 over-read and the world-0 gap falls to half of C's or less: the fix (NODES_SN with the scaling) gets its breadth test on PMAP's other step households and the gap households (O139, O145, O133's) under the 17:19 rule, the residual by year printed; S370-COPY scored with the deep review's next receipt; no default | 0.08 |
| item 2 HELD, item 3 FALSIFIED (R2) | the slice removed and the gap kept: the over-read moves again; the deep review reads where, by year and split, before any breadth test (RULES.md section 9); nothing built | 0.07 |
| item 1 FALSIFIED (R3) | the copied corners carry under a quarter of years 1 and 5: O182-RESID settled not; the review's next-ranked carriers (OTHER, YB) first, read from this run's saved states and split before any new run | 0.26 |
| else | nothing a row above names: the deep review reads the unsettled items with the split and the reported lines before the next step; nothing built; no default | 0.48 |

- **The rows' credences are the JUDGED stories' with the leading cause at the record's rate (results-derive-o182.txt section 3b; at the receipt's own credences, section 3: R1 0.14, R2 0.13, R3 0.09, R4 0.12, else 0.52).**
- **The escalation rule (escalation.md, trigger 3):** the run is under 2 hours' wall (about 1.06 h, results-derive-o182.txt section 4) though 'else' is 0.48, so trigger 3 does not apply; trigger 1 is not met (triggers.mjs --due)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD says the copied corners' residual carries at least half of SN's world-0 over-read at years 1 and 5; FALSIFIED says under a quarter; inconclusive names the interval.
- **Item 2:** HELD says the scaling removes at least half of it; FALSIFIED says under a quarter.
- **Item 3:** HELD says the fix as a whole brings S370's world-0 gap to half of C's or less; FALSIFIED says it stays above three quarters.
- **Item 4:** HELD says the fix does S370 no material harm in any world; FALSIFIED names the world and the leg.
- **In every branch:** no product change; the candidate's settings unchanged; the share-node option and `readerSplit: 'ru'` stay research only, unset in every product path; 7u-F held (the 17:19 row).

## Provenance

- **The design:** the deep review after STEP-S370 (deep-review-log.md 18 Oct 22:45 UK) proposed STEP-O182; its adoption (PLAN.md's 18 Oct 23:10 row; the plan-auditor's PASS of 23:21 UK, its MINORs folded into this registration), under the maintainer's standing go-ahead (4 Oct), the hand-overs (17 and 19 Oct) and the decision of the 17:19 row.
- **The build (14defee):** the SNR arm in src/solver (grid.js ruScale and the read, written on existing lines; solve.js); research/tests/reader-ru.test.mjs (10 checks on this code, failing on the scaling left off and turned the other way); audit-o182.mjs (AN's ledger with the read split, the visited states saved; plants nodes, snr, own, layer, quad, held, score, trace, split, class); reduce-o182.mjs (71 planted checks, each item to all three outcomes, six EDGES, the inert gate against STEP-S370's saved C and SN); mutate-reduce-o182.py (52 of 52 caught, results-reduce-o182-mutations.txt); derive-o182.mjs; preflight-o182.sh and batch-o182.sh. The e3pcls pin re-taken on this code (daa6c33: 27 passed); the reader tests re-run on it (reader, reader-ru, reader-neblend, reader-neroot, reader-solve, reader-order, reader-tax, reader-order-solve: every one passed).
- **Seen before registration (declared):** STEP-S370's records and results (S370's tables, runs, residual by year and split-free ledger on seed 7002, O182), the deep review's receipt and its scratch reads, the derivation's first output (the displacement story added since, the Departures line), and every preflight line below.
- **The preflight** (through the launcher, seed 7002, 40 paths a world; results-o182-preflight.txt): the first launch (runs.log 19 Oct 01:01 UK, on 06088bb) was lost to a container restart before it reported (its partial files read alike); the second (runs.log 19 Oct 01:12 UK, code b22d424cad72): SMOKE PASSED; the three jobs exit 0 with every self-check in full (copyTook 1/1 on each, splitTook 828, 828 and 832 of as many bridge-year reads, scoreTook's two legs 120 of 120 on each); (A) the gate passed at a fifteenth of the points (reduce-o182.mjs --preflight): SNR's split solves with SN's nodes and the candidate's other settings (readerSplit ru, grid total4x8x6), the copied nodes recounted to the solve's count (14418 on C, 21222 on SN and SNR); (B) research/tests/reader-ru.test.mjs on this code: 10 PASS, 0 FAIL; (C) the ten plants refused, each on its own check (nodes and snr: armTook; own: ownTook 0/120; layer: identity 2/120; quad: qfTook 364/828; held: layerTook 702/828; score: scorePaths 79/120; trace: counters 41/120; split: splitTook 120/828; class: copyTook, 21384 recounted against 21222). Its bearing, declared (PREVIEW): at 4 wealth points world 0's Y1 + Y5 reads -1.6190 points under C, -1.5719 under SN and -1.5456 under SNR on 40 paths, and the copied corners' I[R] about 1e-4 points in every arm (by year the supported corners' I[R] nil and the reference's part p x I[c] the whole read): at that resolution SN makes no over-read at years 1 and 5 for the copied corners to carry, so the preview cannot show the split or the scaling acting on the over-read; that each read is split exactly, the scaling included, is splitTook's, and the reader-ru test shows the scaling acting on reads at 4 points; the credences, derived before it, are left as derived.

## Derivation script

- `derive: research/solver/derive-o182.mjs > research/solver/results-derive-o182.txt sha256 ae94b6a8378a9016`
  (STEP-S370's saved C and SN behind STEP-S370's gate; the PRIOR read from the receipt; the power of items 1 to 4 through reduce-o182.mjs's own items(); the credences from the receipt's O182 CAUSE CREDENCES, read from the log, through the JUDGED stories, as stated (section 3) and with the leading cause at the record's rate read from results-scorecard.txt (section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget)

## Point and interval

- **Item 1:** 0.4975, the share of SN's world-0 Y1 + Y5 the copied corners' I[R] carries (results-derive-o182.txt section 3b); 80% interval 0.0008 to 0.9484
- **Item 2:** 0.3941, the share of SN's world-0 Y1 + Y5 SNR removes (results-derive-o182.txt section 3b); 80% interval -0.0006 to 0.9487
- **Item 3:** 0.1712, the drop in world 0's table less runs, SNR against C, points (results-derive-o182.txt section 3b); 80% interval -1.5229 to 4.4901
- **Item 4:** 0.0000, SNR's survival change against C in world 0, points (results-derive-o182.txt section 3b); 80% interval -0.4500 to 0.4250

## Power

From results-derive-o182.txt section 2 (40 draws a cell through reduce-o182.mjs's own items(); SN's world-0 Y1 + Y5 and C's runs as recorded, 4,000 paths a world):

```
  item 1, the copied corners carry 0.1 of SN's Y1 + Y5 (noise x0.5): HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 1, the copied corners carry 0.25 of SN's Y1 + Y5 (noise x0.5): HELD 0.00 INCONCLUSIVE 0.97 FALSIFIED 0.03
  item 1, the copied corners carry 0.4 of SN's Y1 + Y5 (noise x0.5): HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 1, the copied corners carry 0.5 of SN's Y1 + Y5 (noise x0.5): HELD 0.03 INCONCLUSIVE 0.97 FALSIFIED 0.00
  item 1, the copied corners carry 0.6 of SN's Y1 + Y5 (noise x0.5): HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 1, the copied corners carry 0.8 of SN's Y1 + Y5 (noise x0.5): HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 1, a share of 0.6, noise x0.25: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 1, a share of 0.6, noise x1: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 2, SNR removes 0 of SN's Y1 + Y5: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 2, SNR removes 0.25 of SN's Y1 + Y5: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 2, SNR removes 0.4 of SN's Y1 + Y5: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 2, SNR removes 0.5 of SN's Y1 + Y5: HELD 0.07 INCONCLUSIVE 0.93 FALSIFIED 0.00
  item 2, SNR removes 0.75 of SN's Y1 + Y5: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, SNR removes 0.25, the other years -1 point: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 3, SNR removes 0.25, the other years +0 point: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 3, SNR removes 0.25, the other years +1 point: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 3, SNR removes 0.5, the other years -1 point: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, SNR removes 0.5, the other years +0 point: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, SNR removes 0.5, the other years +1 point: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 3, SNR removes 0.75, the other years -1 point: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, SNR removes 0.75, the other years +0 point: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, SNR removes 0.75, the other years +1 point: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, SNR removes 0.95, the other years -1 point: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, SNR removes 0.95, the other years +0 point: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, SNR removes 0.95, the other years +1 point: HELD 0.25 INCONCLUSIVE 0.75 FALSIFIED 0.00
  item 3, SNR removes 0.75 and 0.4 of it reappears elsewhere: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, SNR removes 0.75 and 0.8 of it reappears elsewhere: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 3, SNR removes 0.95 and 0.4 of it reappears elsewhere: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, SNR removes 0.95 and 0.8 of it reappears elsewhere: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 4, SNR's survival change -0.6 a world (discordance 0.03 of 4p(1 - p)): HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 4, SNR's survival change -0.25 a world (discordance 0.03 of 4p(1 - p)): HELD 0.00 INCONCLUSIVE 0.55 FALSIFIED 0.45
  item 4, SNR's survival change 0 a world (discordance 0.03 of 4p(1 - p)): HELD 0.30 INCONCLUSIVE 0.70 FALSIFIED 0.00
  item 4, SNR's survival change 0.25 a world (discordance 0.03 of 4p(1 - p)): HELD 0.70 INCONCLUSIVE 0.30 FALSIFIED 0.00
```

Items 1 and 2 separate cleanly at 4,000 paths: a share or removal of 0.6 or more reads HELD, a tenth FALSIFIED, between a quarter and a half INCONCLUSIVE. Item 3 needs SNR to remove about three quarters or more of SN's Y1 + Y5 with nothing moving elsewhere to read HELD (SN's gap starts 1.29 points above C's); a move of 0.8 reads FALSIFIED even at a removal of 0.95. Item 4 holds a true zero under a third of the time at 0.03 of 4p(1 - p) discordance (world 0's interval near the margin's width) and falsifies a loss of 0.6 a world.

## Budget line

From results-derive-o182.txt section 4 (grade C: STEP-S370's C, solve 1240 s and ledger 1819 s, and SN, solve 1798 s and ledger 1850 s, on 12,000 paths): C about 0.90 h, SN and SNR about 1.06 h each (the split a tenth on the ledger, judged); three jobs on three cores, the wall about 1.06 h; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: the states judged.** The PRIOR's share (0.89 of world 0's Y1) came from the review's rebuilt reads at judged year-1 states (no tax or cash sweep), and year 5 was not read at its states; RESID's judged share is centred below it, but the run's own split may differ.
- **Second: the displacement.** STEP-S370's fix moved the over-read rather than removing it; SNR may do the same (R2), and the `move` story that lets the model draw it was added after the first output (the Departures line), grade D.
- **Third: item 3's bar.** SN's gap starts above C's (10.3428 against 9.0487), so the fix must remove most of SN's Y1 + Y5 with little moving to bring the gap to half of C's; item 3 HELD is 0.08 at the record's rate even where items 1 and 2 hold.
- **Fourth: the scaling reaches supported corners too.** ruScale acts on every corner of lower chance than the query, supported ones included (their R is nonzero where S > p and c clipped at 1); a change in RS (reported by year) would show it.
- **Fifth: SNR may move the policy.** A lower read at near-certain queries changes the chooser's moves at years 1 and 5; item 4 at 0.03 of 4p(1 - p) discordance holds a true zero under a third of the time.
- **Sixth: the preview.** The preflight runs at 4 points, where the copied interior nodes and their R differ from 30 points' (PREVIEW); its figures are not read for size or direction.
- **Seventh: one household, one seed, the tuning seed.** Any HELD is S370's at 30 points; the breadth test (R1) carries it.

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (48 of 61), EFFECT 0.71 (19 of 26), ATTRIB 0.46 (40 of 87), SIZE 0.53 (24 of 45), CTRL 0.79 (18 of 22), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.42 (14 of 34: the hand record's 1 of 19, deep-review-log.md, and the leading causes settled since, 13 of 15, review-causes.md)); the priors state why they move from it, and an item resting on a deep review's ranked cause or story starts from that record's rate, not the review's own probability. Run scorecard.mjs on the prediction before registration: an item read but not scored is listed in its TESTS entry's unscored list and stays off the OUTCOME line.

Items 1, 2 and 3 rest on the deep review's leading cause (O182-RESID: the copied corners carry the over-read, the scaling removes it, and with it the gap falls), so each starts from a deep review's cause rate, 0.42, and the derivation takes the leading cause at that rate (section 3b): item 1 derived 0.42, item 2 0.33, item 3 0.08 (the displacement story and SN's larger gap); item 4 is a no-harm item (NOHARM, 0.78), derived 0.34 (SNR's discordance at S370's mid survival widens world 0's interval to near the margin).

- **Base rate, item 1:** 0.42 (a deep review's cause: the copied corners' residual carries the over-read)
- **Base rate, item 2:** 0.42 (a deep review's cause: the scaling removes it)
- **Base rate, item 3:** 0.42 (a deep review's cause: the gap falls with it)
- **Base rate, item 4:** 0.78 (NOHARM)
- **Item 1:** HELD 0.42, INCONCLUSIVE 0.29, FALSIFIED 0.29 (derived, results-derive-o182.txt section 3b)
- **Item 2:** HELD 0.33, INCONCLUSIVE 0.20, FALSIFIED 0.47 (derived)
- **Item 3:** HELD 0.08, INCONCLUSIVE 0.24, FALSIFIED 0.67 (derived)
- **Item 4:** HELD 0.34, INCONCLUSIVE 0.55, FALSIFIED 0.11 (derived)
- **Judged:** none (the judged inputs are derive-o182.mjs's JUDGED block, committed before its output; `move` added after the first output, declared under Departures)
- **Kinds:** 1 ATTRIB, 2 EFFECT, 3 EFFECT, 4 NOHARM

## Changes after seeing results

None.
