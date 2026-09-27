# Prediction: diag-7v

- **Run:** `research/solver/batch-7v.sh` - results/diag7v/case0-8.txt and every run's trace (audit-s126.mjs diag7v); reduced by `reduce-7v.mjs` into results-7v.txt
- **Kind:** test
- **Written:** 27 Sept, 07:22 UK, before the run; first registered in 11a474e. REVISED before any launch for the third deep review (deep-review-log.md, 27 Sep 07:42 UK: "not yet the decisive test") and the ninety-third review (review-log.md, 27 Sep 07:43 UK, FAIL: four BLOCKING, three MINOR): lambda held at 7t's on the core cases; item 5 read at margin 0 alone; items 10-13 added (P alone or P with C, the whole score, S194's world lines, the grid against 7t); item 4 read in off's and one policy's tables too; item 8's falsifier made to match the reducer; the power re-derived at 7e's 30-point size; the candidates read by the whole score as well; the year-0 gap logged. REVISED AGAIN before any launch for the ninety-fourth review (review-log.md, 27 Sep 08:48 UK, FAIL: four BLOCKING, four MINOR): item 10 read three ways in the attribution and the Decision fed, C named only from item 5, item 10's point re-derived (HELD); the timing log's disclosure made exact and item 10 added to the re-read on paths 1,001 to 8,000; the deep bad world picked from each case's own horizon; item 3 falsified only through a harm; Phase 6's sweep cited; item 4's arms named. REVISED A THIRD TIME before any launch for the ninety-fifth review (review-log.md, 27 Sep 09:45 UK, FAIL: one BLOCKING, three MINOR): Phase 6's 30-point margin sweep cited with its verdict and each figure given its source; item 13's point (9 to 8, range 5-12 to 3-12) and credence (0.55 to 0.40) re-set against it; item 4's arms named in the Derivation too; fair-test row 5 names item 10; item 4's S126 OFF legs named in the disclosure. And for the ninety-sixth review (review-log.md, 27 Sep 09:52 UK, FAIL: one BLOCKING, one MINOR): Phase 6's joint tier count and S126's own Phase 6 churn (3.53 at 0, 0.85 at 0.001) cited, the confounded 40-against-30 comparison named as such, the free-switching figure dropped; item 13's point and credence kept, with those reasons. The ninety-seventh review (PASS, one MINOR): 'the interpolation fix' dropped from the list of solver changes (none landed after Phase 6). The maintainer, 27 Sep: "Run 7v first" (on the second deep review's proposal, drafts/after-7t-proposal.md; PLAN.md 7v)
- **Seen before registration** (the ninety-third review, BLOCKING 3; the ninety-fourth, BLOCKING 2): the timing measurement (runs.log 07:09 UK, a measurement under PREDICTION=none) ran diag7v on S126 at 30 points, lambda 0.025, on seed 7002's first 1,000 paths - 7v's own first 1,000 - and its log printed each run's lines as it ran, until 07:45 UK (the log's file time; kept whole in results-7v-timing.txt). What the author read, and when: BEFORE 11a474e (07:27 UK), OFF's solve line (its table 61.50), its ran and joint lines and OFF's four run lines in full (survival 99.7, 99.7, 99.6 and 99.6; pension years below the plan's tier 40.0, 32.5, 28.5 and 27.8; estates), and the seconds of READER's solve; AFTER 11a474e and before b31686c, by commands that printed only each line's label and seconds, the seconds of every other solve and run line (READER's runs, OFF+J, READER+J and the learner), and the count of world lines (24). No survival, table, tier or estate figure of any arm but OFF was read. No item, point or credence was set from the log: the revision's items, points and credences come from the two reviews and the records they cite. The revision's lambda (0.0224) is not the one that ran. Items 1, 2 and 10, which read S126's READER/1e-3, READER/0, OFF/0 and OFF/1e-3, are also printed on paths 1,001 to 8,000 (reported beside the registered reading). Item 4's S126 OFF legs (OFF/3e-4 and OFF/1e-4 against OFF/0) come from OFF run lines read in full before 11a474e (survival and pension years below the plan's tier; no run line carries switches, so item 13's datum was not in the log); item 4 is predicted HELD through S360, which the log did not run, and item 4 is also printed on paths 1,001 to 8,000, the whole item re-read there (each arm's better small margin picked on those paths, Holm over its fourteen legs; reduce-7v.mjs heldOut4), by the maintainer's decision of 27 Sep after launch ("Yes, re-read item 4 on the held-out paths"), made before any 7v result was read; reported beside the registered reading, which it does not replace
- **Seeds:** 7002 tuning (8,000 paths, the first 3,000 of them 7r's; 1,000 a world on the harmed cases and S194; the same paths for every run of every case). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan (PRODUCT_DEFAULTS.thinSeed); on the five core cases it never draws a path (no tier above is within reach: the rule returns before its check, confirmed on all five by the preflight's gate), and the pairs set the tier above explicitly
- **Unmasking:** every margin below the product's removes a suspected error of the solver's own, not the bridge misread: the forward chooser's switch margin (0.001) holding the tier it opens in, because the tables are solved as if switching were free and tier families sit within the margin (O30). The baseline behaviour that error drives: 7t's OFF switched its pension tier 0.03 and 0.04 times a path on S126 and bridge 4, so off's early de-risk is held for life by the margin whether or not it is right, and the reader's accurate read makes that de-risk a sub-margin gain it never takes (results-7t-deep.txt). The separating arms: item 2 (the reader against off at the SAME margin 0) tells the reader's own harm from the margin's; item 10 (the reader alone at 0 against the product) tells a cure by the margin from one that needs one policy for every world too; item 4 (margin 0 against a small positive margin, in off's own tables as well) tells a margin that hides noise from one that hides a near-tie; item 13 (off's churn at 30 points against 7t's at 16) tells the margin's churn from a coarse grid's noise. On S360 and share 0.95 the fix alone unmasks off's flat misread of the bridge (7t's OFF/M0 lost 520 paths on S360): its legs there are reported, not read as the fix's harm (item 9)
- **Plan section:** PLAN.md "7v"

## Question

7t found four changes that each remove the bridge reader's harm on S126 and bridge 4 (L, O, 5L and M0; results-7t.txt),
and the second deep review traced all four to one mechanism (grade C): the forward chooser changes tier only when the
table's gain beats the switch margin, 0.001 in score units, while the tables are solved as if switching were free, so two
tiers usually differ by less than the margin and the chooser keeps the tier it opens in for decades. The reader's accurate
read makes year 0's de-risk look worth less than the margin, so it keeps the riskier tier, and in the worst markets its
lost paths follow (O30). Margin 0 removes the hold but churns (about 10 tier changes a path, nearly half reversed within
three years) and, where a table has no signal, follows noise (7t's OFF at margin 0 lost 520 paths on S360).

**Is the reader's harm the margin holding a near-tie (P), or table noise (N), a separate clairvoyance error (C) or a
separate learning error (L)?** And is there a margin below today's that keeps the reader's gains, removes its harm and
keeps switching rare? The draft's four predictions (drafts/after-7t-proposal.md): P, the result rises as the margin falls
and the family pairs meet at 0; N, a peak at a small positive margin; C, one policy for every world gains at every small
margin (read here at margin 0 alone: at a positive margin one policy's table change can flip a held tier, which is P's own
mechanism - the third deep review); L, the learner adds survival at one policy and margin 0.

**At the product's settings but for lambda** (the ninetieth review, BLOCKING 1: 7t's OFF was not the product as it ships):
solvePlan's own entry with 30 points and the product's 'auto' risk-above rule, the bridge read off (the product) or the
reader. **Lambda is held at 7t's, S126's landed 0.0223606797749979, on the five core cases** (the third deep review, point
6): 7t to 7v then differs in the grid alone (16 points to 30) on the same paths, the cheapest direct test of N (item 13),
and a 12% lambda change - the kind of small table change P says can flip a held tier - is not added to it. The product
has no lambda default until K6, so no value has the product's standing; the draft's "each household's own lambda" has no
record for bridge 4, share 0.95 or S360. The family pairs run at their odd results' own setups (the ninety-first review,
MINOR 5): S172 planned at Medium Risk with the tier above off and on, at S172's landed lambda 0.6503449126242364 (O16:
M14b's settings; results/m14b-down/S172.json), and S330 planned at Medium Risk with the tier above on, in three and in
five worlds, at S330's landed 0.9457416090031758 (O21: 7h's settings; results/m14b-down/S330.json).

**A within-sample test.** 7v reuses 7t's paths, on which P was found, so what it settles is grade C; its independent test
is 7u on the held-out seed 7013. The paths are kept for the pairing with 7t (item 13).

## Derivation

What the code and the records say before any run:
- **The margin acts only forward.** solve.js chooseAction applies `switchMargin` when a tier is held; the backward pass
  holds none (every cell is solved as if switching were free: fast.js SWITCH_COST's note, solve.js l.965-975), so the
  tables do not depend on the margin and one solve serves all four margins (audit-s126.mjs diag7v runs each solve forward
  four times). The switching cost (0.25% of the slice traded) is charged at decision time in every run, unchanged. The
  'auto' rule's own thin check (solve.js l.1477-1481) runs at the product's margin, so the product's default is itself
  margin-dependent; on the core cases it never runs (no tier above).
- **The opening is one comparison per arm.** In 7t every path opens alike: READER held the plan's tier in year 0, OFF and
  every margin-0 arm opened below it (the third deep review, from 7t's traces). So the margin's effect on the opening is a
  step at one gap. diag7v logs each solve's year-0 gap - the score the best opening move gains over keeping the plan's
  tier, read by the chooser itself - and the tier it opens in at each margin, so the read can say whether 3e-4 and 1e-4
  straddle it (without that, item 3's rise, item 4 and item 8 could all be degenerate).
- **What P predicts.** Lowering the margin lets the chooser take any tier gain above it. If the reader's harm is a
  sub-margin opening de-risk held for life, the reader's net loss against the product falls as the margin falls, and at
  margin 0 the reader and off open alike (7t: READER/M0 and OFF/M0 identical on S126 - item 2 is near-identity there and
  carries little information on that case), so the reader's own harm is gone. By the realised whole score, which the
  chooser maximises, P predicts the result rising as the margin falls (item 11): survival alone can fall by the objective's
  own trade (7t's OFF/M0 on S126: survival -0.175, estate +0.499, results-7t-deep.txt).
- **What C predicts, and the record.** One policy for every world against the reader: at today's margin 14 saved, 0 lost on
  S126 and 18 and 3 on bridge 4 (results-7t.txt, READER+J-READER); at margin 0, 12 and 0, and 11 and 2 (results/diag7t/
  part0.txt and part1.txt, the pairs line READER+J/M0-READER/M0). 7t's J read INCONCLUSIVE by its rule. So C at margin 0
  is expected to show (item 5), and item 3's cure at 0, read on one policy, may be partly one policy's: item 10 reads the
  reader alone at 0 against the product (7t: READER/M0 0 saved and 14 lost on S126, 3 and 6 on bridge 4, against 7t's OFF;
  one policy at 0, 0 and 2, 11 and 5; results-7t-vs-product.txt).
- **Phase 6's two margin tests** (results-p6-tiers-margin.txt l.62, the 21 Sep solver: one market world, no reader, the
  five-node final year; pension and ISA tiers moved together ("joint steps", l.1 and l.3), so its "tier changes" count the
  pension's changes exactly, as 7v's do): (a) gate 6 on 41 households at 40 points - the switching cost, and the cost with
  the margin, gave tier changes a run 5.1 and 1.7 (0.7 to 3.2 by household) and the edge +4.97 and +4.91; its verdict, the
  margin kept the edge while cutting the churn by two thirds. (b) The margin sweep on six households at 30 points, 7v's
  grid, one solve each - margin 0, 0.0005, 0.001, 0.002, 0.005 and 0.01 gave changes 3.43, 1.71, 1.62, 1.53, 1.11 and 0.62
  a run and survival 92.77, 92.83, 92.75, 92.47, 91.28 and 89.37; its verdict, "above 0.001 the margin blocks the first
  de-risking step, not the flips". The third deep review (27 Sep 07:42 UK) set (b)'s 3.43 against 7t's 7.8 to 10.5 as N's
  expectation for item 13. The nearest prior record to item 13 is S126 itself in (a), at 40 points, a grid finer than 7v's:
  3.53 changes a run at margin 0 (results/p6-tiers-cost/S126.json, tierChangesMean) - below half of 7t's 10.52 - and 0.85 at
  0.001 (results/p6-tiers-margin/S126.json) against 7t's OFF at 0.03 (results-7t-deep.txt l.10). Read at face value, the
  old record points to item 13 FALSIFIED. It does not isolate the grid: the 0.85 against 0.03 on the same household and
  margin shows the old solver's tier gaps were of another size from today's (at the same margin the old solver
  changed tier 28 times as often), and the solver is what changed between them (among them the three-world mixture and the exact
  final year); nor does (a) against (b) (5.1 at 40 points, 3.43 at 30), which compares 41 households with six. So
  within today's solver 7t's 16-point figures are the only record, and no record of any solver has the grid alone moved.
  Item 13's point is set between the two records, 8 (3 to 12), and its credence on HELD at 0.40: P expects the near-ties
  of free-switching tables at any grid, while the old solver's S126 is the one household-level datum, and it points the
  other way.
- **What N predicts.** Where a table carries no signal a margin of 0 follows noise (7t's OFF/M0 on S360: 6 saved, 520
  lost, results-7t-vs-product.txt), so some small positive margin should beat 0 in that arm's own tables (item 4, read in
  OFF's, OFF+J's and READER+J's own tables; the reader's mixture tables, READER, are not read there). And if 7t's churn at margin 0 was a 16-point grid's noise, the churn falls
  at 30 points (item 13; 7t's OFF/M0: 10.52 and 10.02 switches a path, results-7t-deep.txt). The whole score shows noise's
  switching fees as estate, where survival cannot see them (item 11's parts are printed).
- **What L predicts.** The learner adding survival on top of one policy at margin 0 (item 6). 7t's one policy at margin 0
  left 2 lost on S126 against 7t's OFF, so the learner has little room there: item 6 is near its ceiling on S126, and the
  deep bad world's survival for each run is printed beside it (7t: one policy at 0 96.0% there, the oracle 98.9%, the third
  deep review's reading of 7t's traces).
- **S194's slice** (item 12): under 7t's OFF, S194's bad world reads 95.36 against 87.20 realised; with one policy, 92.39
  against 88.15 (results-7t.txt). The consistency rule (RULES.md section 9 rule 4): with one policy at margin 0 the table
  should value the policy the chooser follows, so the bad world's overrating should shrink.
- **The family pairs.** O16: allowed one tier above, S172 loses 0.77 points and holds the plan's tier in 73.4% of years
  against 0.1% without (results-m14b.txt, results-m14b-why.txt, seed 7011); with the final year exact, as 7v runs, the loss
  is 0.67 (results-o19.txt). O21: five worlds raise S330's survival by 0.27 (results-quadref-exact.txt). If both are a
  sub-margin tier change held by the margin, each pair meets at margin 0 (item 7). O16's own measure (the share of years at
  the plan's tier and above) is printed; at margin 0 the up arm can also take the tier-above bets themselves (O18, O20).
- **The churn.** 7t at margin 0: 10.52 and 10.02 pension switches a path on S126 and bridge 4, 48% and 47% reversed within
  three years (results-7t-deep.txt). A margin that holds only true noise should keep most of that away (item 8).
- **What 7v does not test:** the held tier as part of the solved state (not built), the grid beyond 30 points, a second
  seed, or any household beyond these nine cases. Its candidates (item 9) go to 7u.

## Prediction

Every case solved with off and the reader (a non-bridge case, off alone), each under the product's mixture and with one
policy for every world (+J), and every solve run forward at switch margins 0.001 (the product's), 3e-4, 1e-4 and 0 on the
same 8,000 paths of seed 7002; one policy at margin 0 also run with the learner (+L); the harmed cases' and S194's world
lines at 0.001 and 0; each solve's year-0 gap logged. The product is OFF/1e-3 on each case. Items (reduce-7v.mjs items();
1-8 and 10 each a Holm family of its own; 11-13 on point figures, grade C):
1. **The harm at the product's settings:** READER/1e-3 harms against the product on S126 and bridge 4 (INCONCLUSIVE: at
   30 points 7e read S126's harm as 3 of 1,000, and bridge 4 has no 30-point read).
2. **The margin carries the reader's own harm (P):** READER/0 does no material harm against OFF/0, on both harmed cases (HELD).
3. **The dose-response (P):** against the product, READER+J's net paths (saved less lost) rise as the margin falls (each
   step no more than 3 paths down, and more at 0 than at 0.001) and READER+J/0 does no material harm, on both harmed
   cases (HELD). FALSIFIED only through a harm: READER+J/0 harming against the product, or ending more than 3 paths below
   its 0.001 result where READER+J/1e-3 itself harms, on both; otherwise INCONCLUSIVE (the ninety-fourth review, BLOCKING 4:
   where one policy has already removed the harm, 7t's record is a few paths down at 0 - OFF+J/M0 against OFF+J 0/2 on S126
   and 1/4 on bridge 4 - which is noise or the objective's trade, not the harm surviving the margin).
4. **Table noise (N):** margin 0 harms against the same arm's better small positive margin on at least one core case, in
   OFF's, OFF+J's or READER+J's tables - READER's own are not read (HELD: off's flat table on S360). A FALSIFIED would not
   clear margin 0 for 7u.
5. **A separate clairvoyance error (C):** READER+J gains against READER at margin 0, on both harmed cases (HELD).
6. **A separate learning error (L):** READER+J/0+L shows no material gain against READER+J/0, on both harmed cases
   (FALSIFIED).
7. **The family pairs meet at 0:** S172's loss with the tier above and S330's gain with five worlds each reproduce at
   0.001 and are gone at 0 (HELD).
8. **A small margin keeps switching rare:** READER+J's pension switches a path at 1e-4 are at most half those at 0, on both
   harmed cases (HELD); FALSIFIED is at least 0.8 of them on both; between, INCONCLUSIVE.
9. **The candidates for 7u** (a list, not a verdict), by survival and by the realised whole score: READER+J/0 among them
   by the whole score; by survival it may carry an unconditional-reading warning.
10. **P alone:** READER/0 does no material harm against the product, on both harmed cases (HELD: 7t's READER/M0 left 14
    lost and none saved on S126, 6 lost and 3 saved on bridge 4, against 7t's OFF, which the registered interval reads as no
    material harm - the exact lower end -0.175 against the 0.25 margin; results-derive-7v.txt: HELD 0.828 at the small
    background, INCONCLUSIVE 0.834 at the larger; the unconditional reading is printed beside it).
11. **The whole score (grade C):** READER+J's realised whole score against the product rises as the margin falls (each step
    no more than 0.05 points down, and more at 0 than at 0.001), on both harmed cases (HELD).
12. **S194's slice:** OFF+J/0 at least halves OFF/1e-3's bad-world overrating on S194 (HELD).
13. **The grid:** OFF/0's switches a path at 30 points hold within 30% of 7t's at 16 (HELD); FALSIFIED is below half of
    them on both harmed cases (N: the churn was a coarse grid's noise).

Reported, not items: every run's survival, saved and lost against the product, switches a path and the share reversed
within three years, and the realised whole score against the product with its parts (survival, estate, cuts, raises);
every solve's year-0 gap and the tier it opens in at each margin; every world line; survival on the deep bad world's paths
on the harmed cases; O16's measure on S172; items 1, 2, 4 and 10 on paths 1,001 to 8,000; each solve's time.

## Falsified if

The margin explanation (P) is FALSIFIED when READER/0 still harms against OFF/0 on both harmed cases (item 2), or when
READER+J at 0 harms against the product, or ends more than 3 paths below its 0.001 result where READER+J/1e-3 itself
harms, on both (item 3): the harm then survives the margin's removal. With items 2 and 3 HELD, item 10 says three things:
HELD, the reader alone is cured at margin 0 (P alone); FALSIFIED, the reader alone still harms there, so the cure at 0
needs one policy for every world as well; INCONCLUSIVE, that is not settled - never read as either. N is named when item
4 HOLDS or item 13 is FALSIFIED; C only when item 5 HOLDS; L when item 6 HOLDS. Item 7 FALSIFIED is both reproduced pairs staying different at 0; item 8 FALSIFIED is a small margin
churning at least 0.8 as much as 0 on both harmed cases; item 11 FALSIFIED is the whole score lower at 0 than at 0.001 on
both; item 12 FALSIFIED is S194's bad-world overrating not halved. INCONCLUSIVE is not a negative: an explanation that
reads INCONCLUSIVE stays a suspect. Item 1 FALSIFIED (no material harm at the product's settings) says the harm at 0.001 is
fragile to the settings, as P itself allows; the other items are read as they stand, and nothing about 7u changes on it.

## Fair-test table

Arm A and arm B as the batch script sets them: arm A the product (OFF/1e-3, the same case) or, for item 2, off at the
same margin, for item 4 the same arm at its better small margin, and for items 5 and 6 the run with the one thing removed;
arm B the run read against it. The pairs of item 7 are read across their two cases on the same paths. Item 13 compares
7v's OFF/0 with 7t's OFF/M0 (old records for a new question, checklist item 3: the rows it differs on are named below).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and bridge 4 (the reader's harm, 7e, 7r, 7t), S360 and share 0.95 (its largest gains), S194, and the family pairs S172 and S330 (O16, O21): chosen on purpose from the records, a diagnosis of those cases on the tuning seed; nothing here generalises beyond them (7u does that) | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (bridge 4, share 0.95); the pairs planned at Medium Risk on pension and ISA (M14's PLANTIER) | the same, case by case | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held - 7t's 0.0223606797749979 on the core cases; the landed 0.6503449126242364 (S172) and 0.9457416090031758 (S330) on the pairs | the same, case by case | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (the first 3,000 are 7r's; the first 1,000 ran S126 in the timing measurement at lambda 0.025), 1,000 a world on the harmed cases and S194 (each path's persistent shift set to the world's node); the gate checks the seed, the counts, the world lines and every trace's survival against its run line | the same paths, paired, for every run of every case | SAME (items 1, 2, 4 and 10 also printed on paths 1,001 to 8,000) |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself. The 'auto' rule's thin check (seed 7101) never runs on the core cases (no tier above) and is set explicitly on the pairs |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture, each world's own move at every cell, the forward chooser's fixed weights (the product) | one change a run: one move for every world (`jointWorlds`, +J); the learning chooser on one policy's tables at margin 0 (+L, learn.mjs); five worlds on S330 mix5 (item 7's pair, against S330 mix3) | TESTED - one policy in item 5 (READER+J/0 against READER/0), the learner in item 6 (against READER+J/0), five worlds in item 7's S330 pair; in item 3 one policy is carried with the margin against the product, and item 10 reads the reader without it |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule on the core cases (no tier above within reach: the joint line records "off: no tier above the plan", required by the gate); S172 down: none; S330: one tier above | the same on the core cases; S172 up: one tier above | SAME on every read but item 7's S172 pair, where it is TESTED (O16's own variable). Item 13: 7t set riskAbove true on the core cases, 'auto' here - the same menu (no tier above within reach on S126 and bridge 4: the ninetieth review) |
| 17 | The grid: points, shares, gain buckets | 30 points (the product's), the default shares and gain buckets | the same | SAME within 7v; TESTED in item 13 (7t's 16 points against 7v's 30, the same paths and lambda) |
| 19 | The switch margin and switching cost | the solved margin 0.001, the switching cost unchanged | the same tables run forward at 3e-4, 1e-4 and 0 (the cost unchanged) | TESTED - the switch margin, forward only (the tables do not depend on it): items 2, 3, 4, 8, 10, 11 and 13, and item 7 at 0.001 against 0; held at 0 in items 5 and 6 |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's 0.0223606797749979 on the core cases; S172's and S330's landed values on their pairs; exponent 2 | the same, case by case | SAME within every read (every read compares two runs of one case, or item 7's two cases, which share their lambda; item 13's 7t records ran the same lambda) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off (OFF and every OFF run); the final year exact (the product's default); no block trim | bridgeRead 'reader' (READER and every READER run); the rest the same | TESTED - the bridge read, in items 1 and 2 (READER against OFF), item 10 and item 9's reader candidates; carried with one policy and the margin in item 3; held within items 5, 6 and 8 |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan (the one-policy option refuses the ternary search) | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes every run and trace; the log's audit stamp covers audit-s126.mjs, swap.mjs and learn.mjs; item 7's pairs are two processes of the same code and stamp | the same | SAME within 7v. Item 13 reads 7t's figure (results-7t-deep.txt, from 7t's gated traces, code cd1026b8ff22): ACCEPTED - the solver code is the same (code-id's hash covers src/solver and the engine), the audit modes differ in how they log, not in how a run is simulated |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score (survival, the capped estate at 0.02 of opening wealth, the dislike of cuts, the raise credit, per path from the trace) read by items 9 and 11 on point figures, grade C | the same | SAME |
| 30 | The reducer and its version | reduce-7v.mjs: requireFairLogs over the logs' stamps, then its own gate on every case line, solve, gap, ran, joint, run and world line and the done count, and every trace's count, seed, arm, stamp and survival; INCOMPLETE unless all nine cases are done; 70 planted checks, 62 planted faults each caught (mutate-reduce-7v.py, results-reduce-7v-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the regimen's exact rule per item (stats.mjs outcome() for harm, the exact one-sided McNemar test for a gain), Holm within each item, the exact 95% interval against the case's margin (marginFor: 0.25 at 95% survival or more, 0.5 below); the unconditional interval printed beside every no-material read; the whole score's paired mean read on point figures, its standard error printed only | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival, switching and the whole score are simulated; the tables' readings appear only in the world lines (item 12), against the simulation | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read: nine processes share four cores, four at a time |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The families** (reduce-7v.mjs harmFamily and gainFamily, single look, level 0.05): a harm leg reads **harm** when it
  loses more than it saves, the exact one-sided p under Holm over the item's legs is below 0.05 and the point loss is at
  least the case's margin; **no material harm** when the exact 95% interval's lower end is above minus the margin;
  otherwise **inconclusive** (stats.mjs outcome()). A gain leg reads **gain** when it saves more than it loses and the exact
  one-sided p for a gain under Holm is below 0.05; **no material gain** when the interval's upper end is below the margin;
  otherwise **inconclusive**. The margin is the case's (stats.mjs marginFor() of the product's survival on that case).
- **Items 1-8 and 10-13** read HELD, FALSIFIED or INCONCLUSIVE as the Prediction and the Falsified-if section word them
  (item 7 also NOT REPRODUCED when neither pair differs at 0.001; a pair that does not reproduce is left out of item 7's
  reading). Item 3's step tolerance is 3 paths; item 11's is 0.05 points. Items 11, 12 and 13 read point figures (grade C).
- **The attribution** (reduce-7v.mjs attribution(), printed as the ATTRIBUTION line): P when items 2 and 3 HOLD, with
  item 10 read three ways - HELD, the reader alone is cured at margin 0; FALSIFIED, the cure there needs one policy for
  every world as well; INCONCLUSIVE, not settled; N when item 4 HOLDS or item 13 is FALSIFIED; C only when item 5 HOLDS;
  L when item 6 HOLDS. INCONCLUSIVE is never read as a negative.
- **The candidates** (item 9, reduce-7v.mjs candidates()): every arm but the product itself at every margin - the fix
  alone (OFF/m below 0.001, OFF+J/m) and the reader with or without one policy (READER/m, READER+J/m; on S194 read on off's
  runs). By survival: no material harm against the product on each case of its set (a harm family per arm) - the fix alone
  on S126, bridge 4 and S194 (its S360 and share 0.95 legs reported beside: off's flat misread there is what the fix alone
  unmasks), a reader arm on all five core cases and also a gain on S360 and share 0.95 (a gain family per arm). By the
  whole score (grade C): its realised whole score against the product at least 0 on each case of the same set.
- **NOT SETTLED:** the fair-test gate fails - something besides the things tested moved.
- **The registered reading decides; the unconditional one is printed beside it** (the regimen's item 1 waits for the
  maintainer): every no-material read where the two disagree is marked, and a candidate with such a leg is marked too.
  Items 1, 2 and 10 on paths 1,001 to 8,000 are printed beside; the registered reading is on all 8,000.
- **Declared choices, not derived:** Holm within each item (each item is its own claim, and the attribution names an
  explanation only from its own items); the tolerances of items 3 and 11; item 8's half and 0.8; item 12's half; item 13's
  30% and half; the margins 1e-4 and 3e-4 (the draft's, a tenth and three tenths of the product's); 1,000 paths a world.

## Decision fed

- **P alone HELD (items 2, 3 and 10), N FALSIFIED:** the margin's hold on a near-tie carries the reader's harm, and margin 0
  does no harm here. What goes to the maintainer: the candidates (item 9) by both readings, with their churn (item 8), the
  cheapest first, for 7u to test on 7e's panel and a broad one; the held tier as part of the solved state named as the
  principled fix if the churn at the candidate margin is not acceptable advice (the maintainer's open question 2).
- **P with item 10 FALSIFIED:** the reader alone still harms at margin 0, so the cure at 0 needs one policy for every
  world as well; the candidate for 7u is the reader with one policy at the margin item 9 lists, and the reader alone at
  that margin does not go forward. C is named only if item 5 HOLDS.
- **P with item 10 INCONCLUSIVE:** whether the reader alone is cured at 0 is not settled; item 9's candidates with and
  without one policy both go to the maintainer, with the unconditional reading beside, and 7u reads both.
- **N HELD beside P (item 4 or item 13):** the margin carries the harm and margin 0 follows noise somewhere; the candidate
  for 7u is the small positive margin that item 9 lists with the least churn, or, if none is listed, the solved held-tier
  state is proposed to the maintainer as the build.
- **P FALSIFIED:** the harm survives the margin's removal; the margin is dropped as its sole cause, and C or L (items 5,
  6), if HELD, goes to the maintainer as the next suspect with its fix (one policy for every world; a learner with a
  declared information set); if neither holds, the grid and a second seed are the options put to the maintainer.
- **INCONCLUSIVE on P:** the margin stays a suspect beside whatever else is HELD; no candidate goes to 7u without the
  maintainer's decision, and a second seed is proposed for the legs that did not settle.
- **Item 1 FALSIFIED:** the harm at 0.001 is fragile to the settings (P allows it); the other items are read as they stand
  and 7u's design is unchanged.
- **Item 7:** HELD adds O16 and O21 to the margin's family (their gates move to 7u); FALSIFIED leaves them open with their
  own gates; NOT REPRODUCED leaves them open and says so.
- **The family's name:** at 7v's read the register's family 1, "tables value extra risk too highly", is renamed to what
  7v supports (the third deep review).
- F2, 7q, 7n, 8b, any re-test of 'auto' and any default change wait for 7v's read and the maintainer's decision on it; no
  item 4 FALSIFIED and no survival-only candidate list is read as clearing margin 0 for 7u.

## Provenance

- The mode: audit-s126.mjs diag7v (39edb00, revised with this prediction: 7t's lambda on the core cases, S194's world lines,
  the year-0 gap line); measureV2's `lambda` and `forward` options default to today's behaviour. The batch batch-7v.sh; the
  preflight preflight-7v.sh with preflight-parse-7v.mjs (a measurement through the launcher, tiny, no figure read). The
  timing measurement of 27 Sep (runs.log 07:09 UK; its whole log in results-7v-timing.txt): the seconds only.
- The option `jointWorlds` and its tests: solve.js (70a8b55), research/tests/solver-joint.test.mjs. The learner:
  learn.mjs, research/tests/solver-learn.test.mjs.
- 7t's figures: results-7t.txt, results-7t-vs-product.txt, results-7t-deep.txt, results/diag7t/part0.txt and part1.txt.
  7e's: results-7e.txt. O16's: results-m14b.txt, results-m14b-why.txt, results-o19.txt. O21's: results-quadref-exact.txt.
  The landed lambdas: results/m14b-down/S172.json and S330.json ("lambda held").
- The second deep review (deep-review-log.md, 27 Sep 02:07 UK; drafts/after-7t-proposal.md) and the third (07:42 UK).

## Derivation script

- `derive: research/solver/derive-7v.mjs > research/solver/results-derive-7v.txt sha256 2668677a5306008c`
  (each item's legs drawn as Poisson counts under each story with a background of 1.33 and 13.3 paths each way, and 100
  on the pairs' margin-0 legs, read by reduce-7v.mjs's own families; the sizes from 7e's 30-point read, 7t, M14b, O19 and
  7h's records, each named in the script's header).

## Point and interval

80% intervals, the author's, in paths of 8,000 (saved less lost) or as named:
- Item 1: READER/1e-3 against the product, S126 -24 (-45 to -5), bridge 4 -15 (-35 to +2).
- Item 2: READER/0 against OFF/0, 0 (-4 to +4) on each.
- Item 3: READER+J against the product at 0.001, 3e-4, 1e-4, 0: S126 -10, -8, -5, -2 (-12 to +6 at 0); bridge 4 -2, -1,
  +2, +5 (-6 to +14 at 0) - one policy already recovers much of the reader's harm at 0.001 (7t: 14 and 15 net).
- Item 4: on S360 OFF/0 against OFF's better small margin -300 (-550 to -30); elsewhere within 10.
- Item 5: READER+J/0 against READER/0, S126 +10 (+3 to +18), bridge 4 +8 (0 to +16).
- Item 6: the learner at one policy and 0, +1 (-3 to +6) on each.
- Item 7: S172 up against down at 0.001 -50 (-75 to -20), at 0 -5 (-40 to +20); S330 mix5 against mix3 at 0.001 +18 (0 to
  +35), at 0 +3 (-20 to +25).
- Item 8: READER+J's switches a path at 1e-4, 2 (0.3 to 6); at 0, 9 (6 to 12).
- Item 10: READER/0 against the product, S126 -12 (-25 to 0), bridge 4 -3 (-12 to +6).
- Item 11: READER+J's whole score against the product at 0.001 and 0, points: S126 -0.10 and +0.35 (-0.1 to +0.6 at 0);
  bridge 4 +0.05 and +0.40 (0 to +0.7 at 0).
- Item 12: S194's bad-world gap, OFF/1e-3 +7 (+3 to +10), OFF+J/0 +3 (0 to +6).
- Item 13: OFF/0's switches a path, S126 8 (3 to 12), bridge 4 8 (3 to 12) (between 7t's 10.52 and Phase 6's S126 3.53; see the Derivation).

## Credence

The author's probability that each item reads as predicted: 1 (INCONCLUSIVE), 0.45; 2 (HELD), 0.85; 3 (HELD), 0.40; 4
(HELD), 0.70; 5 (HELD), 0.55; 6 (FALSIFIED), 0.70; 7 (HELD), 0.30; 8 (HELD), 0.50; 10 (HELD), 0.50; 11 (HELD), 0.50;
12 (HELD), 0.45; 13 (HELD), 0.40 (Phase 6's S126 and its 30-point sweep point the other way; see the Derivation). P named (alone or with C): about 0.35. At least one READER+J candidate by the whole score:
about 0.55. The cumulative scorecard stands at 0.223 against its 0.20 target (O29), and 7t's negatives were overconfident,
so no item is given above 0.85. Scored by scorecard.mjs.

## Power

From results-derive-7v.txt (20,000 draws a story; each item read by the reducer's own families with Holm over its legs;
backgrounds of 1.33 and 13.3 paths each way):
- **Item 1** at 7e's 30-point size on S126 (24 of 8,000) reads HELD 0.652 and 0.537 if bridge 4 is the same size, 0.165 and
  0.215 at 16, near 0 at 8 or none (mostly INCONCLUSIVE); at 7t's 16-point size (42, 29) 0.962 and 0.894; with no harm,
  FALSIFIED 1.000 and 0.960. Bridge 4 has no 30-point read, so item 1 is the weakest item: hence its INCONCLUSIVE point.
- **Item 2:** the reader identical to off at 0 reads HELD 1.000 and 0.963; but a harm of 24 and 16 kept at 0 reads
  FALSIFIED only 0.164 and 0.220 (mostly INCONCLUSIVE) - item 2 can confirm P far better than it can refute it, and on
  S126 it is near-identity (7t).
- **Item 3's leg at 0:** 7t's one-policy losses (2; 5 lost and 11 saved) read no material harm on both 1.000 and 0.918;
  none left, 1.000 and 0.964; the harm kept (24 and 16), harm on both only 0.166 and 0.219.
- **Item 10:** 7t's READER/M0 losses (14; 6 lost and 3 saved) read HELD 0.828 at the small background and 0.165 at the
  larger (INCONCLUSIVE 0.834): the registered interval reads a one-sided loss of 14 as no material harm when little else
  moves (O27's flaw; the unconditional reading is printed beside it).
- **Item 4** (fourteen legs): no noise reads FALSIFIED 1.000 and 0.762; 24 lost on one leg HELD 0.810 and 0.708; 40 lost
  HELD 1.000 and 0.990 (7t's S360 off lost 520: far past these, not drawn).
- **Item 5:** no gain, FALSIFIED 0.999 and 0.951; 7t's size at 0 (12 saved; 11 saved and 2 lost) HELD 0.633 and 0.183 -
  at the larger background C mostly reads INCONCLUSIVE.
- **Item 6:** nothing added, FALSIFIED 0.999 and 0.951; the learner saving 6 and 4, HELD only 0.141 and 0.026 (its ceiling,
  the third deep review: the deep bad world's survival is printed instead).
- **Item 7:** S172 reproduces O16's loss (61) and the exact-final-year loss (54) at 1.000; S330 reproduces O21's gain 0.997
  and 0.847. At 0, a pair that truly meets reads so 0.982 (S172) and 0.966 (S330) with 13.3 each way, but with 100 each way
  - margin 0's churn can move many paths (7t's S360: 526) - S172 reads no material harm only 0.272 (INCONCLUSIVE 0.685)
  and S330 0.793: item 7 can read INCONCLUSIVE because margin 0 churns, not because the pair stays apart.
- **Items 8, 11, 12 and 13** read point figures (grade C); no power is derived for them.
- **What it cannot see:** a harm below the margin (20 paths of 8,000 at 0.25) reads as none by the registered interval;
  whether 3e-4 and 1e-4 straddle the year-0 gap is known only from the gap lines.
- **Time:** from the timing measurement on S126 (results-7v-timing.txt, a quiet box): a 30-point solve 232 to 235 s with or
  without one policy, a traced forward run 61 to 64 s a thousand paths (about 500 s at 8,000); so S126 and bridge 4 about
  3 h each, S360 and share 0.95 about 2.7 h, S194 about 1.6 h (with its world lines), the S172 pair and S330 mix3 about
  1.4 h each, S330 mix5 about 2.1 h; nine processes four at a time, the longest first: about 5.5 hours on a quiet box, 6 to 7
  with the four sharing the cores, plus the smoke run and the launcher's re-run of derive-7v.mjs (about 5 minutes).

## Budget line

The bridge class's decision error: the reader cost S126 0.47 and bridge 4 0.31 points of survival in 7e at 16 points (at 30
points 7e read S126's as 0.30 on 1,000 paths, inconclusive). 7v removes no error itself; it says whether the forward
chooser's switch margin carries it, whether one policy for every world is needed with it, and which margin can go to 7u as
the candidate fix, at what churn.

## Pre-mortem

- **Most likely:** P, with C beside it - items 2, 3 and 10 hold (7t's READER/M0 loss of 14 reads no material harm by
  the registered interval, though the unconditional reading may disagree), and item 5 holds too; noise at 0 on S360 in
  off's tables (item 4); the candidates then are the reader, with and without one policy, at a small margin or at 0, with
  the unconditional reading marking the S126 legs.
- **Second:** item 1 INCONCLUSIVE - at 30 points the harm is too small to read on 8,000 paths (7e's S126 at 30 points, 3
  of 1,000); the margin's items still say what the margin does, but "the reader's harm" is then 7t's 16-point harm, and
  item 13 says whether the grid itself moved it.
- **Third:** the year-0 gaps sit outside 1e-4 to 1e-3 (the gap line shows it): 3e-4 and 1e-4 then behave as 0.001 or as 0,
  and items 3, 4 and 8 read a step, not a slope; the read then says the dose-response was not probed.
- **Fourth:** the family pairs do not reproduce at seed 7002 (O16 and O21 were read on seed 7011 at 3,000 paths); item 7
  reads NOT REPRODUCED.
- **Fifth:** the whole score and survival disagree at margin 0 (item 11 HELD, item 3 not): the objective's own trade, as
  7t's OFF/M0 on S126 showed; the maintainer's open question 3 then decides which reading the candidate is chosen by.
- **The smoke run:** smoke.sh (locked) does not run diag7v; the crash check of 27 Sep 07:06 UK and the preflight through the
  launcher (all nine cases, every line through the reducer's parse and gate, every trace's name) cover it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None. (After launch and before any result was read, the maintainer asked for item 4 to be re-read on paths 1,001 to 8,000 too, 27 Sep; the reducer prints it beside the registered reading, and no item, point, credence or rule changed.) (The revision above was made before any launch, for the two reviews; the timing log's lines were seen as disclosed in
the header, and the one setting they ran at that the revision changes, lambda, was changed for the third deep review's
point 6, not for anything in that log.)
