# Prediction: diag-7y

- **Run:** `research/solver/batch-7y.sh` - results/diag7y/case0-13.txt and every run's trace (audit-s126.mjs diag7y); reduced by `reduce-7y.mjs` into results-7y.txt
- **Kind:** test
- **Written:** 27 Sept, 23:19 UK, before the run (new-prediction.mjs's stamp). Under the maintainer's overnight authority (PLAN.md ledger 27 Sep 21:22: on 7x's item 1 HELD with item 2 FALSIFIED, "build the held tier in the solved state as a research option with its tests and run 7y on the tuning seed against the product (7x's cases and 7e's bridge households)"; 7x read 22:17: 1 HELD, 2 FALSIFIED) and the deep review after 7x (deep-review-log.md 27 Sep 22:32 UK; PLAN.md ledger 22:32: the design is the tier state, not held-for-life; the arms PRODUCT, TS, TS-TIER, TS-REST and H0); O37's, O38's and O39's gates (PLAN.md register). REVISED before any launch for the plan-auditor's review of 7y's registration (28 Sep, FAIL: three BLOCKING, three MINOR): the Decision fed ties the opening claim to item 3; the per-world margin named as a design premise at grade D with its failure mode; the reader's plan-tier reference in every layer named in the Unmasking field, with its gate; the held endpoint's residual stated; the 20:17 review cited without a quotation; 7v's time ranges corrected; and again for its re-review (FAIL, one BLOCKING, four MINOR): the route taken from the tier state's opening at 1e-3, not from item 3's ratio; O41's gate beside O36's; the reviewer's scripts kept (research/solver/drafts/check-7y-*.mjs); the scorecard cited as it stood after 7x
- **Seen before registration:** 7x's results (results-7x.txt, results-7x-held.txt, results-7x-pair.txt, results-7x-o36.txt); the tier state's own test (research/tests/solver-tierstate.test.mjs, at 8 points on S126 and three worlds: the free endpoint to the bit, the held endpoint within 1e-8, the chooser agreeing with the table at 2,601 of 2,601 nodes, and forty forward runs with the pension below the plan's tier in 1,207 path-years). No 7y output: the preflight runs after this registration. 7z runs beside it and is read by its own rule
- **Seeds:** 7002 tuning (8,000 paths, 7v's, 7x's and 7z's; the same paths for every unit). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these cases it draws no path (7v's to 7z's gates; 7y's gate requires the same decision). The held-out seed reserved to 7u is not used
- **Unmasking:** the tier state removes free switching (FS) in the backward pass: the tables value every tier as if the next year's could be changed for nothing, while the chooser pays the switching cost and applies the margin, so the table's year-0 gap for a de-risk is a one-year gap the margin then holds against (O30, O33; 7x item 1 HELD for the held special case). The baseline behaviour it drives: the product keeps the plan's tier on a sub-margin gap (7w: S126 8.0241e-4, S194 7.5604e-4) and loses what the freed opening saves (7w: 15 and 16 of 3,000). What tells a harmful change from one that unmasks another error: (a) TS-TIER and TS-REST (7r's swap precedent, every year): whether the gain or harm is the tier choice or the other choices the tier state's tables change (O39); (b) H0, the plan's tier held for life, against which the product's later switching is measured (O38); (c) S360 under off (item 5, O37): off's tables misread S360 (0.61% against 41% simulated, results-7x.txt), and a tier state built on them is expected to take the de-risk and lose - a harm registered in advance as the misread's, not the tier state's; S360 with the reader beside it (item 4) says whether the tier state harms where the bridge is read. (d) NOT SEPARATED: in every layer the reader reads its bridge years at the PLAN's tiers (solve.js chanceOf uses the plan-tier move for every layer; O36's open part), so a de-risked layer's bridge read keeps the plan-tier reference; the tier state can unmask that on bridge 4 and S360 with the reader, and 7y has no arm that separates it there (the readerRef 'held' measurement the 22:32 row scheduled is not run tonight): a harm on those legs is attributed at grade C, and O36's open part is gated before any deep review judges the combination
- **Plan section:** PLAN.md "7y"

## Question

With the tier held on entering the year made part of the solved state (solve.js tierState: one table layer per tier pair,
each move scored as the chooser scores it - the switching cost charged, the next year's layer of the pair it moves to, the
margin with ties to staying - applied per world, where the chooser applies it to the mixture: the design premise in the
Derivation), does the solver recover what free switching loses on S126 and S194, is it the tier choice
that carries the gain, does the year-0 gap rise as FS says it should, and does it do no harm where the bridge is read?

## Derivation

- **What 7x says** (results-7x.txt; grade B, two cases): tables held at one tier for life price the de-risk at 0.790
  (S126) and 0.970 (S194) of what holding it realises, where the product's free tables see its year-0 gap at 8.0241e-4
  and 7.5604e-4 (results-7w.txt), below the 0.001 margin. The tier state makes each year's tier choice with the cost and
  margin the chooser uses, so a de-risk at year 0 is valued as a tier that will be held while switching back does not pay:
  its gap should rise toward what holding realises - five times or more (the deep review after 7w, 27 Sep 20:17 UK, put the ratio of realised value to the free tables' gap at 5 to 9 times on S126 and S194).
- **What the product loses** (results-7w.txt; results-derive-7y.txt): the freed opening saved 15 (S126, reader) and 16
  (S194, off) of 3,000 paths against the product at 0.001, none lost - about 40 and 43 of 8,000.
- **Why the rest may carry it instead** (O39, results-7x-pair.txt): on S360 under off the held plan tier differed from the
  product outside the tier; the tier state's tables also change the spending level and order they favour. TS-TIER and
  TS-REST split the two.
- **Where it could harm:** the product leaves tier 0 later in life on S126, S194 and share 0.95 (62,104, 209,138 and
  53,941 solvent path-years, results-7x-pair.txt), and that later switching is worth 3.4 points over the plan's tier held
  on S194 (results-7x-held.txt); a tier state whose margin makes later switches rarer could lose some of it. Share 0.95's
  second error (Q) is in the chooser (O35) and is not removed here. S360 under off: O37.
- **A design premise, grade D (RULES.md section 9 rule 6): the switch rule applied per world.** The backward pass solves
  each world on its own (as the product does), so the tier state applies the margin to each world's own score, where the
  forward chooser applies it to the mixture-weighted score. The plan-auditor's read-only check (the review of 7y's
  registration, 28 Sep; S194, 8 points, three worlds, year 1, holding 0/0, 864 nodes; grade C; its script kept as research/solver/drafts/check-7y-perworld.mjs, not re-run): the mixture
  chooser switches at 237 nodes; world 0's layer switches at 69 nodes where the chooser stays, and worlds 1 and 2 stay at 86
  and 195 nodes where it switches. So the tier state's tables still assume switches, world by world, that the chooser does
  not make - a residual of the free switching under test. The failure it can cause: items 1 and 3 can read FALSIFIED or
  INCONCLUSIVE without clearing FS in the tables; a negative read does not say FS is absent.
- **The held endpoint** (research/tests/solver-tierstate.test.mjs, check C): within 1e-8, not to the bit - 1,222 of
  1,244,160 cells differ, by at most 6.04e-10, where two moves tie within eps at survival clamped to the floor (the kept moves
  score within 1.5e-17 of each other, eps 1e-12: the plan-auditor's read-only check, grade C, its script kept as
  research/solver/drafts/check-7y-tie.mjs, not re-run).
- **The prior tests of the same mechanism** (RULES.md section 9 rule 7), each with its verdict:
  - **7x** (results-7x.txt): held-for-life tables: item 1 (FS) HELD, item 2 (W) FALSIFIED, item 3 HELD (fixed by design),
    item 4 FALSIFIED (off's misread).
  - **7w item 4** (results-7w.txt): the freed opening does no material harm against margin 0 on S126 and S194 with 0.03
    and 0.04 switches a path against 4.93 and 3.97 - the opening alone carries what margin 0 buys there. HELD.
  - **7v** (results-7v.txt): the margin sweep: P's mechanism seen on S126 (grade C); the registered attribution named N
    and L, not P (item 3 INCONCLUSIVE).
  - **7r** (results-7r.txt): the swap arms' precedent (RTIER/RREST) for splitting a table change into tier and the rest.
  - **Phase 6's switching cost** (PLAN-HISTORY.md; results-p6-tiers-cost.txt, results-p6-tiers-margin.txt): the cost and
    the margin were set with free-switching tables and applied forward only; never tested with the tier in the state.

## Prediction

1. **The gain:** on S126 (reader) and S194 (off), TS gains against PRODUCT (about 40 and 43 of 8,000).
2. **The tier carries it:** on both, TS-TIER gains against PRODUCT and TS-REST shows no material gain.
3. **Free switching at the opening:** on both, TS's year-0 gap is at least 5 times PRODUCT's.
4. **No harm with the reader:** on share 0.95, bridge 4 and S360 with the reader, TS shows no material harm against PRODUCT.
5. **O37's harm leg:** on S360 under off, TS harms against PRODUCT.

## Falsified if

Item 1: no material gain on both. Item 2: TS-REST gains and TS-TIER shows no material gain, on both. Item 3: TS's gap under
twice PRODUCT's on both. Item 4: material harm on any of the three. Item 5: no material harm on S360 under off.
INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Arm A is PRODUCT (today's free-switching tables); arm B is TS (the tier state), or a swap of the two (TS-TIER, TS-REST), or
H0 (the plan's tier held for life) - the same case, bridge read, solve settings, margin and paths.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 (reader) and S194 (off) - 7x's FS cases; share 0.95, bridge 4 and S360 with the reader - 7x's and 7e's bridge cases; S360 under off - O37's harm leg: chosen on purpose from the records, a diagnosis, nothing generalised | the same | SAME |
| 2 | Changes the test makes to a household's inputs | share 0.95 and bridge 4 are 7c's variants of S126 (audit-s126.mjs F1_VARIANTS) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule (no tier above within reach: the joint line's "off: no tier above the plan", required by the gate); the tier free each year | the same rule; H0 holds the plan's tier for life (holdTier 0/0) | ONE ARM ONLY for H0 (O39's arm: the product's later switching measured against holding), SAME for TS and the swaps |
| 17 | The grid: points, shares, gain buckets | 30 points (the product's), the default shares and gain buckets | the same | SAME |
| 19 | The switch margin and switching cost | the margin 0.001 and the cost 0.25% of the slice traded, applied by the chooser forward only; the tables solved as if switching were free | the same margin and cost, applied by the chooser forward AND in the backward pass (the tier state) | TESTED - the thing tested (TS); in the swap arms each move's tiers from one arm and its rest from the other |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's to 7z's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader on READER cases, off on OFF cases; the final year exact; no block trim; Q's fix off | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process a unit, every unit from the same snapshot and stamp (requireFairLogs); the swap unit re-solves PRODUCT and TS, and the gate requires its tables to equal the P and T units' | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the year-0 gap: the smallest margin at which the chooser keeps the plan's tier at runPolicy's opening state (item 3) | the same | SAME |
| 30 | The reducer and its version | reduce-7y.mjs: requireFairLogs over the logs' stamps, then its own gate on every unit, solve, ran, gap, joint, run, swap and done line, the re-solves reproducing, and every trace's count, seed, arm, stamp and survival (within 0.00005); INCOMPLETE unless all fourteen units are done; 44 planted checks, 38 planted faults each caught (mutate-reduce-7y.py, results-reduce-7y-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the regimen's exact rule (reduce-7v.mjs gainFamily and harmFamily), Holm within each item, the exact 95% interval against the case's margin; the unconditional interval printed beside | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival is simulated; the gap is the chooser's reading (item 3), never survival | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The families** (reduce-7v.mjs gainFamily and harmFamily, single look, level 0.05), as 7v to 7z; the margin is
  marginFor() of the case's PRODUCT survival (0.25 at 95% or more, else 0.5).
- **Item 1** HELD when both legs gain, FALSIFIED when both show no material gain, else INCONCLUSIVE. **Item 2** HELD when
  TS-TIER gains on both and TS-REST shows no material gain on both; FALSIFIED when TS-REST gains on both and TS-TIER shows
  no material gain on both; else INCONCLUSIVE. **Item 3** HELD when TS's gap is at least 5 times PRODUCT's on both (a
  PRODUCT gap of 0 with a TS gap above it counts as unbounded); FALSIFIED under 2 times on both; else INCONCLUSIVE.
  **Item 4** HELD when all three legs show no material harm (Holm over three), FALSIFIED when any reads harm, else
  INCONCLUSIVE. **Item 5** HELD on harm, FALSIFIED on no material harm, else INCONCLUSIVE.
- **NOT SETTLED:** the fair-test gate fails.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** survival as the primary outcome (the whole score is not read here: the regimen's
  exact rule reads paths); item 3's 5 and 2 (the low end of the 20:17 review's 5 to 9 times; twice as the flat line).

## Decision fed

- **Items 1, 2 and 4 HELD:** free switching costs paths through the tier on S126 and S194 at grade B, and the tier state
  recovers them with the reader. **The route** is read from the tier state's opening at the product's margin (the gap
  line's "opens N at 1e-3", printed by the reducer; the tier state opens away from the plan's tier as soon as its gap
  passes 1e-3, at a ratio of only 1.246 on S126 and 1.323 on S194): where the tier state opens de-risked and the product
  does not, the gain came at least partly through the opening, and **the opening claim** - that the product's opening
  undervaluing is FS - is grade B for that case; where the tier state opens in the plan's tier as the product does, the gain
  came through later tier choices and the opening claim stays grade C (the 22:32 row). Item 3 does not decide the route: it
  sizes FS at the opening. The tier state is a research option recorded in the ledger; nothing to a default tonight (the
  21:22 row's exclusions). Item 5 HELD then says it must never run under off (O37). It is one of the two fixes the 21:34 row
  may combine with Q's (7z) - only after a deep review on both reads judges it ready, with O36's open part (the reader's
  plan-tier reference in every layer) and O41 (the per-world switch rule) set before it, as their gates require, and
  tonight at most registered (the 22:32 row).
- **Item 3 on its own** (the size of FS at the opening, not its route): HELD - the tier state's gap rises at least five-fold,
  the size FS predicts; FALSIFIED - it rises less than twice on both: FS at the opening is smaller than predicted, or the
  per-world rule (the premise above) hides part of it; the route is still read from the opening, and the premise goes to
  the deep review; INCONCLUSIVE - between, sized.
- **Item 1 HELD, item 2 FALSIFIED:** the gain is the other choices', not the tier's: FS is not the mechanism at the product
  level; a register row for what the tier state's tables change in the rest (O39's family), to the maintainer.
- **Item 1 FALSIFIED:** the tier state does not recover the freed opening's paths. Because the tables still switch world
  by world where the chooser does not (the premise above), this does NOT clear FS: FS stays grade C at the product level,
  the per-world premise is registered as the next thing to test, and O30's and O33's fix goes back to the maintainer.
- **Item 4 FALSIFIED:** harm where the bridge is read: the tier state is not a candidate as it stands; a register row with
  an owner and a gate, attributed at grade C - the swap arms exist only on S126 and S194, and on bridge 4 and S360 the
  reader's plan-tier reference in every layer (the Unmasking field, (d)) may be the cause; it is not the build's fault
  until a decomposition splits the blame.
- **Item 5 FALSIFIED:** O37's expected harm absent: O37 is re-read.
- **Otherwise (INCONCLUSIVE):** a sized follow-up to the maintainer; nothing else rests on it.

## Provenance

- The build: solve.js tierState (the layers, the backward pass's per-layer choice with chargeSwitch and the margin,
  scoreMoves reading each move's next-year layer), with its test research/tests/solver-tierstate.test.mjs (15 checks:
  refusals, the free and held endpoints, the chooser against the table, the result, the swap chooser). The swap chooser:
  swap.mjs tsSwapChooser. The mode: audit-s126.mjs diag7y (measureV2 passes tierState and prints it on the ran line only
  when set). The batch batch-7y.sh; the preflight preflight-7y.sh with preflight-parse-7y.mjs. The reducer reduce-7y.mjs.
- 7w's and 7v's figures: results-7w.txt, results-7v.txt and their traces, each through its own stamp gate in
  derive-7y.mjs. 7x's: results-7x.txt, results-7x-held.txt, results-7x-pair.txt.

## Derivation script

- `derive: research/solver/derive-7y.mjs > research/solver/results-derive-7y.txt sha256 22dff38a79008a25`
  (7w's freed opening against the product on S126, S194 and share 0.95, scaled to 8,000 paths; 7v's OFF/3e-4 against
  OFF/1e-3 on S360; each case's margin from 7v's product run; items 1, 2, 4 and 5 drawn as Poisson counts under each story
  with a background of 0.5 and 5 paths each way, read by the reducer's families).

## Point and interval

80% intervals, the author's, of 8,000 paths (saved less lost) or as named:
- Item 1: S126 +30 (-20 to +60); S194 +35 (-30 to +70).
- Item 2: TS-TIER S126 +30 (-10 to +55), S194 +30 (-20 to +65); TS-REST each 0 (-25 to +25).
- Item 3: the gap ratio 8 (1 to unbounded) on each.
- Item 4: share 0.95 +20 (-40 to +190); bridge 4 0 (-40 to +40); S360 (reader) 0 (-120 to +80).
- Item 5: S360 under off -300 (-500 to 0).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.55; 2 (HELD), 0.45; 3 (HELD), 0.50; 4 (HELD),
0.55; 5 (HELD), 0.55. The build is new tonight and the regimen's scorecard stood at 0.221 over 63 items against its 0.20
target when this was registered (results-scorecard-7x.txt), so none is given above 0.55.

## Power

From results-derive-7y.txt (20,000 draws a story; backgrounds of 0.5 and 5 paths each way):
- **Item 1** at the freed opening's size: HELD 1.000 at both; at half, 1.000 and 0.970; at a quarter, 0.877 and 0.459;
  with no change, FALSIFIED 1.000 and 0.980.
- **Item 2**, the tier carrying it all: HELD 1.000 and 0.978; the rest carrying it all: FALSIFIED 1.000 and 0.977; half
  each: INCONCLUSIVE 1.000 and 0.999 - item 2 cannot split a shared gain, by design.
- **Item 4**, all level or share 0.95 gaining: HELD 1.000; bridge 4 losing 40 paths: FALSIFIED 1.000 and 0.999; S360
  losing 80: FALSIFIED 1.000.
- **Item 5**, at 7v's OFF/3e-4 size or a quarter of it: HELD 1.000; the tier state leaving S360 alone: FALSIFIED 1.000.
- **Item 3** is two solves' reading: no power is drawn.
- **Time: NOT MEASURED at 30 points.** From 7v's records a product solve on these cases takes 249 to 337 s and a traced
  forward run of 8,000 paths 208 to 613 s (results-7v.txt); the plan-auditor measured the tier state's solve at 2.68 and
  2.69 times the product's at 12 points on S126 and S194 (read-only, grade C; research/solver/drafts/check-7y-time-ts.mjs,
  not re-run). The tier state's backward pass scores every move once per layer (three pairs:
  about three times the product's pass 2), assumed 10 to 15 minutes a solve; a swap run calls both choosers, assumed about
  twice a forward run. The longest unit (a swap unit: two solves, two swap runs) about 45 to 70 minutes; fourteen units four
  at a time about 100 to 150 minutes, plus the smoke run and the launcher's re-run of derive-7y.mjs. Each process is
  stopped at 4 hours.

## Budget line

The product keeps the plan's tier where a de-risk would save paths (7w's freed opening: 15 and 16 of 3,000 on S126 and
S194), because its tables value every tier as if switching were free. 7y says whether solving the tier as part of the
state recovers them, and whether it is the tier that does it - the held tier's build tested alone (the 21:29 row, (d)).

## Pre-mortem

- **Most likely:** item 1 HELD or INCONCLUSIVE with TS gaining on S194 more than on S126; item 2 INCONCLUSIVE (both parts
  carry some); item 3 HELD on S194; item 4 HELD; item 5 HELD.
- **Second:** the tier state holds de-risked tiers longer than the product (the margin now in the table), and its later
  switching loses paths the product's free switching keeps - item 1 FALSIFIED or harm on share 0.95, with TS-REST showing it.
- **Third:** the gap line's opening state (one path's) is not the state most paths open in; the openings and item 1
  cross-check it.
- **Fourth:** the time estimate is wrong by a factor of two and the batch runs past 05:00 UK: the read and the deep review
  are then shortened, not skipped; a unit stopped at 4 hours makes the run INCOMPLETE and it is not read.
- **The smoke run:** smoke.sh (locked) does not run diag7y; the preflight through the launcher (all fourteen units, every
  line through the reducer's parse and gate, every trace's name) covers it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
