# Prediction: REF-2 (does the reference's pessimism, not RS, deepen S360's read; what carries the rest of S360's gap beyond the order-drawn reference; does ORDER over-read the 95% share household?)

- **Run:** `research/solver/batch-ref2.sh` - results/diagref2/case0-4.txt and the five jobs' files (audit-ref2.mjs), with NE-REF's S360 BASE and RS jobs behind NE-REF's gate, reduced by reduce-ref2.mjs into results-ref2.txt
- **Kind:** test
- **Written:** 13 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world (NE-REF's, so S360's 2 x 2 is paired across the two runs), its first 40,000 for the ledger's flow, and the ledger's simulated chances on seed 7002's own generator (reader.js's); 7u's held-out seed refused by the audit
- **Unmasking:** ORDER (readerRef 'order') lifts the bridge reads where the order-drawn chance beats the proportional mix, which can move S360's and the 95% share household's choices after year 0 and unmask an over-read the pessimistic reference was offsetting (O66's after-access optimism; the 95% share household, where the money just covers the bills, the review's named case: ORDER's best-order envelope optimistic there); item 3 reads BO's table against its own runs with an over-read line, and BO's runs against BASE's are printed SAME or DIFFERENT. RS under ORDER (RSO) is read against BO paired (item 1), the split rule 1 asks for: a deepening under RSO that remains is RS's; one that vanishes was the reference's (O151). Any fix this leads to names S360, the 95% share household, S364 and bridge 4 in its own Unmasking
- **Mechanism:** solve.js:667 "const v = wi * vi + wg * vg + wc * vc;" (the proportional mix at the opening weights; PR23); reader.js:134 "R[i] = S[i] - p[i] * c[i];" (with c clipped to 1 at a supported corner, R is the reference's shortfall, which RS scales away); model.js:503 "if (action.sweepCash) {" (the engine's cash sweep the reference does not model)
- **Plan section:** PLAN.md "REF-2", O151, O36 (items/O36.md), O150, PR23; the deep review after NE-REF (deep-review-log.md 13 Oct 18:36 UK)

## Question

The deep review after NE-REF's decisive test. NE-REF found S364's under-read under RS to be the reference's proportional mix, and RS deepening S360's under-read in world 0 by 1.2587 points (O151) with the runs unmoved. Under ORDER (the order-drawn reference), does RS still deepen S360 (O151-RS) or not (O151-REF)? At S360's states, do the state's own pots carry the gap the order-drawn reference leaves against the engine's own bridge payment (RR-MIXS)? And does ORDER over-read the 95% share household, where the money just covers the bills?

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
An unscored item (one previewed before registration, say) stays off the OUTCOME line and is listed in its scorecard entry's unscored list, and scorecard.mjs is run on the prediction before registration; a registered line is never reworded after the read, since the fair-test gate hashes the prediction (NE-REF's item 3, the plan-auditor's FAIL of 13 Oct 18:18 UK).
An out-of-sample household is an item with its own falsifier, not a report, when the test's deciding household is the one where the mechanism was first found.
A net or estate item names which of the mean, the capped mean or the median it reads, and why the score or the app reads that one; the others are reported beside it (above the bequest cap the score is flat, so an uncapped mean follows the unscored tail: DT-O97).

- **The 2 x 2 is one code's:** NE-REF's S360 BASE and RS jobs are read behind NE-REF's own reducer gate, and REF-2's gate refuses unless their stamp's code is this run's (both c29acec9e7cb as written; code-id.mjs); BO and RSO run on the same 4,000 paths a world, so every arm's runs pair path by path.
- **The ledger is NE-REF's, at S360:** the five year-1 states of P (the plan's tiers at the floor level, cash first; found by that definition, its index printed), the closed form, the mix simulated, pot by pot at the opening weights (OW) and at the state's own pots (OS) and the same with the engine's cash sweep (OSW), at 1,000,000 draws; the engine under each order's fixed move on 40,000 paths a world (FB). The year-1 states are the grid's flow (NE-REF's identity control showed it on S364; no 60-point probe of S360 exists, so the 4-point read is taken on that showing, grade B).
- **The 95% share household:** S126 with 0.95 of its wealth in the pension and a two-year bridge (audit-7u.mjs's builder, copied), its minimum end pot one year's target spend (29,000).

## Prediction

- **Item 1 HELD (0.47 against INCONCLUSIVE 0.40):** under ORDER, RS deepens S360's read by no more than half a point in any world.
- **Item 2 INCONCLUSIVE, tied with FALSIFIED (0.37 each, HELD 0.27):** the state's own pots carry under half of S360's gap beyond ORDER, or the read cannot tell.
- **Item 3 HELD (0.50):** ORDER does not over-read the 95% share household by more than half a point in any world.

## Falsified if

- **Item 1 FALSIFIED:** RSO less BO, paired, has its world-0 interval top at -1.0 or below.
- **Item 2 HELD:** in worlds 0 and 1 the gap beyond ORDER is shown and MIXS's interval bottom is at least half of its top; FALSIFIED: the gap shown and MIXS's top under half of its bottom in both.
- **Item 3 FALSIFIED:** BO's table less its runs has its interval bottom above 0.5 in some world.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | S360 (items 1 and 2) | the 95% share household (item 3) | SAME within each comparison: tuning-seed households the review named |
| 5 | The held-out paths | 4,000 a world (every 60-point job; NE-REF's S360 BASE and RS on the same) | 40,000 (the ledger's flow) | ACCEPTED: the 40,000 begin with the 4,000; item 2 reads the ledger alone |
| 17 | The grid | the ledger at 4 wealth points | the 60-point jobs | ACCEPTED: the ledger reads the flow's states and the reference's chances, which the grid does not set (NE-REF's identity control on S364); no ledger table is read |
| 24 | The read: the reference and the residual | BASE, RS (NE-REF); BASE (the 95% share household) | BO, RSO; BO | TESTED: item 1 RS under ORDER against ORDER, item 3 ORDER against BASE, one change each |
| 28 | Every file made by the same code | this launch | NE-REF's S360 BASE and RS | ACCEPTED: read behind NE-REF's gate and refused unless their code is this run's |
| 29 | The statistic | the ledger's chances read the bridge's payment (OW, OS, OSW, FB) | items 1 and 3 read survival | ACCEPTED: each item reads one statistic throughout |
| 32 | The table's number is never the result | items 1 and 3 read tables against their own runs | the ledger reads chances against simulations and the engine | ACCEPTED: every read is a table or chance against a simulation of it |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** item 1's discordant paths and item 3's runs by their exact (Clopper-Pearson) interval at 2 x ALPHA / 6 (three worlds); item 2's weighted counts and flow at 2 x ALPHA / 4 (two worlds); ALPHA 0.05; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look):** per world, D = (RSO's own table - BO's) less (RSO's own runs - BO's), the runs paired by path, in points. HELD when every world's bottom is at least -0.5; FALSIFIED when world 0's top is at most -1.0; INCONCLUSIVE otherwise.
- **Item 2 (single look):** at S360's states, worlds 0 and 1: GAP = ln FB - ln OW, MIXS = ln OS - ln OW. A world holds when GAP is shown (its bottom above 0) and MIXS's bottom is at least half of GAP's top; it falls when GAP is shown and MIXS's top is under half of GAP's bottom. HELD when both worlds hold; FALSIFIED when both fall; INCONCLUSIVE otherwise.
- **Item 3 (single look):** BO's own-opening table less its runs per world. HELD when every world's point is at most 0.5; FALSIFIED when any world's bottom is above 0.5; INCONCLUSIVE otherwise.
- **The causes, by the registered map:** O151-REF held on item 1 HELD, not on FALSIFIED; O151-RS held on item 1 FALSIFIED, not on HELD; RR-MIXS held on item 2 HELD, not on FALSIFIED; open otherwise. The ledger is a measurement at every state, so MIXS reaches its mechanism by construction.
- **Reported, not items:** the 2 x 2 by world (ORDER's effect on S360, BO less BASE, and the interaction); the ledger's terms by world, SWEEP (ln OSW - ln OS) and the rest; BASE's read of the 95% share household; whether BO's runs are BASE's.
- **Declared choices, not derived:** half a point and a point for item 1 (the review's), half the gap for item 2 (the review's line, read against the engine's bridge payment), half a point for item 3; worlds 0 and 1 deciding item 2 (S360's near-edge worlds).

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1 and 3 HELD | under ORDER, RS does not deepen S360 and ORDER does not over-read the 95% share household: RSO may enter the panel test as its own arm, with BO beside it and RSO read in ratio (the review's conditions), once the panel's registration re-decides NE-REF's third row on this record | 0.24 |
| item 1 HELD, item 3 FALSIFIED | ORDER over-reads where the money just covers the bills: no ORDER arm in the panel; the state's-pots reference (REF-S) must handle that case before any reference arm | 0.14 |
| item 1 FALSIFIED | RS's own form deepens S360 even under ORDER (O151-RS): RS stays out of the panel, and the deep review after REF-2 revisits RS's form (no milder RS without a split) | 0.12 |
| else | REF-2's unsettled items named; the deep review after REF-2 designs the next step | 0.50 |

- **Waiver:** none needed: the chance the action changes is 0.50 (one less 0.50, the likeliest row), above a quarter
- **The escalation rule (escalation.md, trigger 3):** the run is over 2 hours' wall (about 2.37 h) and its 'else' row is 0.50, under the 0.6 bar: no escalation review first.

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD settles O151 as the reference's (grade B, one household, one seed); FALSIFIED as RS's own.
- **Item 2:** HELD says the state's own pots carry S360's gap beyond ORDER too, so REF-S's design (the chance at the state's pots) is the fix's shape (grade B); FALSIFIED says something else carries it (the sweep, the engine's tax, the policy: SWEEP and the rest reported, grade C).
- **Item 3:** HELD says ORDER does not over-read where the money just covers the bills; FALSIFIED says it does, read for the cause (the best-order envelope), never against REF-S.
- **Inconclusive on any item:** it leaves its question open and names the world that kept it so; nothing rests on it, and the deep review after REF-2 reads it.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F held; REF-S built and unit-tested, not run in a solver test until the panel's design takes it.

## Provenance

- **The design:** the deep review after NE-REF (deep-review-log.md 13 Oct 18:36 UK), its decisive test, adopted under the maintainer's standing go-ahead of 4 Oct (PLAN.md's 13 Oct 18:36 row).
- **The build:** audit-ref2.mjs, reduce-ref2.mjs (80 planted checks, each item reaching all three outcomes, EDGES, boundaries planted exactly - item 2's by a continuous node weight; NE-REF's S360 jobs behind NE-REF's gate on this run's code), mutate-reduce-ref2.py (68 of 68 caught, results-reduce-ref2-mutations.txt), derive-ref2.mjs, batch-ref2.sh, preflight-ref2.sh. No solver code changed (code-id.mjs reads c29acec9e7cb, NE-REF's).
- **Changed from the review's design (declared):** (1) item 2 reads S360's gap beyond ORDER against the engine's own bridge payment under a fixed move (FB, 40,000 paths), not against the policy's full survival (ln r): S360's runs fail after access too, which a bridge reference does not model, and FB isolates the bridge; (2) BO's runs equal to BASE's on the 95% share household is printed SAME or DIFFERENT, not a gate: ORDER moves the year-1 reads the year-0 choice uses, so the choice may move (the review read it as year 0's read alone); (3) item 3's HELD reads the point (within half a point), since the runs' interval near 95% survival is about a point wide.
- **Seen before registration (declared):** NE-REF's results in full and its files; the deep review's figures and scratch reads of NE-REF's ledger; no REF-2 figure.
- **The preflight:** to be run through the launcher before launch and quoted here.

## Derivation script

- `derive: research/solver/derive-ref2.mjs > research/solver/results-derive-ref2.txt sha256 b8c657c8978f637b`
  (NE-REF's S360 BASE and RS behind NE-REF's gate, the power of items 1-3 through reduce-ref2.mjs's own items(), the credences from the review's O151 and RR cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from NE-REF's logs)

## Point and interval

- **Item 1:** -0.4617, RSO less BO in world 0, points (results-derive-ref2.txt section 3); 80% interval -1.2016 to 0.0432
- **Item 3:** 0.1686, BO's table less its runs on the 95% share household in its worst world, points; 80% interval -3.0011 to 2.1018
- **Item 2:** none: a share read by its rule

## Power

From results-derive-ref2.txt section 2 (300 draws a cell through reduce-ref2.mjs's own items()):

```
  item 1, RSO deepening world 0 by -0.3: 0 discordant HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000; 10 discordant HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000; 40 discordant HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  item 1, RSO deepening world 0 by -1.3: 0 discordant HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000; 10 discordant HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000; 40 discordant HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  item 2, the state's pots carrying 0.3 of the gap beyond ORDER: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
  item 2, the state's pots carrying 0.7 of the gap beyond ORDER: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
  item 3, BO 0.8 points from the 95% share household's runs: HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  item 3, BO 2 points from the 95% share household's runs: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
```

Item 1 decides when RSO and BO move no path, as NE-REF's RS and BASE moved none on S360; ten discordant paths a world make a deepening of 0.3 INCONCLUSIVE and forty make every story so. Item 2 separates a share of 0.3 from 0.7 fully, a share near half INCONCLUSIVE. Item 3 separates no over-read from two points.

## Budget line

From results-derive-ref2.txt section 4 (NE-REF's S360 logs: solve plus runs): in all about 7.77 core-hours; five jobs on four cores, the ledger first, about 2.37 h wall. Each job may run 10 hours (the batch's timeout).

## Pre-mortem

- **First: discordant paths.** If ORDER and RS together move S360's choices (the review: ORDER moves S360's choices on 57 of 200 paths in reader-order-solve.test.mjs), item 1's interval widens and it reads INCONCLUSIVE even with no deepening - the else row's main route.
- **Second: no gap beyond ORDER at S360.** If ORDER already reaches the engine's bridge payment, item 2 reads INCONCLUSIVE (no gap shown) and REF-S's case rests on S364 alone.
- **Third: the 95% share household's opening may move under ORDER,** so BO's runs differ from BASE's; item 3 reads BO against its own runs regardless.
- **Fourth: the S360 ledger's states are taken as the flow's** on NE-REF's S364 showing; a 4-point read that differed from 60 points at S360 would not show here.
- **Fifth: one seed (7002); S360 and one constructed household.**

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories (the split, one-flip and band stories included) through the decision bands. No cap
taken from the scorecard. An item that needs every household carries a line per household, its reducer printing
"LEGS: N/<household> <OUTCOME>" beside "OUTCOME: ...".

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.77 (40 of 51), EFFECT 0.71 (19 of 26), ATTRIB 0.49 (32 of 66), SIZE 0.53 (24 of 45), CTRL 0.75 (14 of 18), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.29 (7 of 26: the hand record's 1 of 19, deep-review-log.md, and the leading causes settled since, 6 of 7, review-causes.md)).
The derivation's priors begin there and state why they move from it; an item resting on a deep review's ranked cause or
story starts from that record's rate, not the review's own probability.

Items 1 and 2 rest on the review's ranked causes (O151-REF 0.67, RR-MIXS 0.45), so each starts from a deep review's cause rate, 0.29; the derivation mixes the receipt's cause credences through the JUDGED stories and section 2's power, which puts item 1's HELD at 0.47 (O151-REF's stories mostly within half a point, less the discordant paths) and item 2's at 0.27. Item 3 starts from NOHARM's rate, moved down by the review's warning (ORDER's best-order envelope optimistic when the money just covers the bills).

- **Base rate, item 1:** 0.29 (a deep review's cause: O151-REF)
- **Base rate, item 2:** 0.29 (a deep review's cause: RR-MIXS)
- **Base rate, item 3:** 0.77 (NOHARM)
- **Item 1:** HELD 0.47, INCONCLUSIVE 0.40, FALSIFIED 0.12 (derived, results-derive-ref2.txt section 3)
- **Item 2:** INCONCLUSIVE 0.37, FALSIFIED 0.37, HELD 0.27 (derived)
- **Item 3:** HELD 0.50, FALSIFIED 0.30, INCONCLUSIVE 0.20 (derived)
- **Judged:** none (the judged inputs are derive-ref2.mjs's JUDGED block, committed before its output in 6a4ea95)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 NOHARM

## Changes after seeing results

None.
