# Prediction: diag-7r

- **Run:** `research/solver/batch-7r.sh` - results/diag7r/part0-4.txt and the fourteen arms' traces; reduced by `reduce-7r.mjs` into results-7r.txt
- **Kind:** test
- **Written:** 26 Sept, 11:45 UK (begun 11:31 UK), before the run; rewritten 12:28 UK, before the run, after the sixty-sixth review (FAIL: the tier-lift share could not tell the tier from the reader's method; O23's closing rule) - the first launch was stopped in its smoke run, before any 7r log existed
- **Seeds:** 7002 tuning (3,000 paths, the same paths for both arms of every case); 7e's held-out seed is not used (it is reserved to 7e's tests)
- **Plan section:** PLAN.md "7r"

## Question

7e found the bridge reader harms S126 (14 lost, 0 saved of 3,000; -0.47 points) and bridge 4 (26 lost, 1 saved of
8,000; -0.31) on held-out seed 7011 (results-7e.txt). Before F2 is built (the maintainer, 26 Sep 11:16 UK: "diagnose
first"), which part of the reader's moves carries that harm? The hypothesis (PLAN.md's 10:55 row, grade D, NOT CHECKED):
the tier - an accurate read lifts the household off the low tier the misread left it on, and the riskier tier costs
survival. Its rival: the rest of the reader's moves in the bridge years (the withdrawal order, harvesting and spending
level), where its own method decides. The answer sends 7r one of three ways, each to the maintainer: the rest (F2 is
built), the tier with the trade buying estate (whether survival alone judges households at 99.5% and over), or the tier
with the trade buying nothing (the solver's risk weighing is examined first).

## Derivation

What the code and the records say before any run:
- **Where the reader acts.** solve.js l.501-505 marks reader years (retired, before access, a need to pay); the reader's
  split changes how those years' tables are read (grid.js readValues), and a decision in year t reads year t+1's table
  (chooseAction). So off's and the reader's choosers can differ only in years up to two before access; from the last bridge
  year on they read the same tables and, from the same state and tiers held, pick the same move.
  research/tests/solver-choose-hook.test.mjs checks this on S126 at 8 points: along off's own runs on 40 paths the two
  choosers differ in 40 path-years, all in year 0, and in none from the last bridge year on (at 4 points they never
  differ). So on S126 (access at year 2) the reader changes only the year-0 move; on bridge 4 (access at year 4), years
  0 to 2. After that the arms differ only through the state each carries: the tiers held (sticky: a move changes them,
  and chooseAction takes the held tiers, so the switch cost and margin hold them) and the money.
- **Why a split of the move, not of the paths (the sixty-sixth review, BLOCKING 1).** The lift is on almost every path:
  off holds the pension below its tier in 40.0 of S126's 40 years and the reader in 7.9 (results-7e.txt), so a lost path
  held a riskier tier than off whatever caused the loss. The swap arms split the move instead. A move is a base (the
  withdrawal order, harvesting and spending level) and a tier pair, and the move list holds every tier pair under every
  base (the hook test checks the layout: 120 bases of 3 pairs on S126). RTIER takes the reader's tier pair on off's base in
  each year the two choosers differ; RREST takes off's tier pair on the reader's base. Both run forward from off's solve on
  the same paths, with no new solve (swap.mjs; runPolicy's `choose` hook, off unless a caller passes it). If the tier
  carries the harm, RTIER reproduces it and RREST does not; if the rest does, the reverse.
- **The bridge does not bind on S126.** Its variant (audit-s126.mjs variant(), from the library's S126) is 56 with access
  at 58; its accessible money is 142,500 (ISA 76,000, taxable 19,000, cash 47,500), about 4.9 years of its 29,000 target.
  bridge 4 is the same household at 54: 4 years against the same 142,500.
- **What 7e's tier column counts.** reduce-7e.mjs's "tier-below" is runPolicy's tierPenYears, the years with the
  pension's tier index above 0; with the tier above allowed index 3 is the tier above (fast.js tiersFor), so the column
  counts years off the plan's tier either way. Every panel pension is at the top tier (High Risk), which has none above, so
  in 7e it is years below.
- **The contrasts.** S120 and wealth x2 were lifted as far and lost nothing, but both arms survive 100.0% there: a lift
  with nothing at risk. S366 under v1 (O23) was lifted (45.8 to 24.2 years below tier) while still misreading (gap -95.4)
  and lost 7, saving none, of 1,000 (p 0.0078 unadjusted, one of 48 comparisons: a lead). F1's own test had v1 at +0.30 on
  S366, under other settings on seed 7002, so the two do not compare (checklist 3).
- **Why seed 7002.** 7011 is reserved to 7e's tests; 7r diagnoses, on tuning paths, and item 1 checks the harm is there.

## Prediction

Each case solved off and with the second arm (the reader; v1 on S366), 7e's settings otherwise, run forward on the same
3,000 paths of seed 7002 with the per-year trace kept; on S126 and bridge 4 also the two swap arms, RTIER and RREST:
1. **The harm is there on these paths:** the reader loses more paths than it saves on S126 and on bridge 4, each with the
   exact one-sided p for harm below 0.05 after Holm over the two.
2. **The contrasts risk nothing:** on S120 and wealth x2 the reader loses and saves no path.
3. **O23 replicates:** on S366, v1 loses more paths than it saves, the exact one-sided p below 0.05. Read three ways: it
   replicates (it then counts for the lift, not the accuracy, carrying the harm); it closes as no material harm only when
   the exact 95% interval's lower end is above -0.25 points (RULES section 8, stop rule 6; the sixty-sixth review,
   BLOCKING 2); otherwise it stays open with its bound. Either of the last two drops it from the hypothesis's evidence.
4. **The tier carries the harm:** on a case where the reader's harm shows (item 1), RTIER reproduces it and RREST shows no
   material harm; and on no such case the reverse, or both.
5. **The trade buys estate:** on S126 and on bridge 4, over the paths both arms survive, the paired end-wealth difference
   (the reader's minus off's; the trace's last-year wealth, a stand-in for estate, which it does not carry) has its median
   at least 5% of off's median end wealth, with the exact 97.5% interval above 0.

Reported, not items: RTIER against the reader (how far the tiers alone reproduce its arm); each arm's end wealth (median
and unlucky tenth), years below target, the pension's and the ISA's years below and above the plan's tier, lifetime tax,
lifetime spending paired; for the lost paths their failure years, the first year and kind of the arms' first different
move, and the tier-lift paths (at or after the bridge's end, a riskier pension tier in half their years or more) - no
longer a decision figure, since the lift is on almost every path.

## Falsified if

On a case where the reader's harm shows, RREST reproduces it and RTIER shows no material harm, and on no such case the
tier or both: the rest of the reader's bridge-year moves carries the harm, not the tier. The hypothesis is wrong for this
harm and it goes to the reader's method: F2 is built, after the early 8h read is put to the maintainer (the 08:17 row's
revisit trigger).

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and its bridge-4 and wealth-x2 variants (audit-s126.mjs variant(), as 7c and 7e built them), S120 and S366 from the library: chosen from 7e's result on purpose, the two cases the reader harmed, the two it lifted as far with nothing lost, and O23's case. A diagnosis of those cases: nothing here generalises beyond them. Tuning seed 7002, not 7e's held-out paths | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (bridge length 2 and 4, wealth x2; pension share 0.85) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.0223606797749979 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 paths of seed 7002 (tuning: 7r diagnoses, and 7011 is reserved to 7e's tests; the gate checks the seed and the count, 3000, in every ran line and every trace) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan), each path's own world in the forward run | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process per case, one engine build | the same process | SAME |
| 10 | The minimum pot | one year of target (solvePlan's default), or the plan's own | the same | SAME |
| 11 | The raise cap | 1.1 | 1.1 | SAME |
| 12 | The estate preference | today's estate term (no weight set) | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps, consent given; one tier above allowed, set explicitly (riskAbove true), so tier eligibility is identical in both arms | the same | SAME |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | off (the product refuses it) | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points, the default shares and gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | the product menu for a 0.8 floor, capped at 1.1 | the same | SAME |
| 19 | The switch margin and switching cost | the defaults | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.0223606797749979; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003, weighted by survival | the same | SAME |
| 22 | The price of a year with no money | the floor's price (the M17 fix) | the same | SAME |
| 23 | Resilience and drift | resilience 0; no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off; the final year exact (finalIntegral true, set explicitly); no block trim | bridgeRead 'reader' (S126, bridge 4, S120, wealth x2) or F1 v1 (S366: bridgeRead true); on S126 and bridge 4 also RTIER and RREST, off's solve run forward with a chooser mixing the two tables' moves in the bridge years (bridgeRead swap-tier, swap-rest); the rest the same | TESTED - the bridge read, off against the reader (v1 on S366), and which part of the reader's move carries its effect |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes every arm's log lines and traces; the swap arms reuse that process's two solves | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; end wealth: the trace's last-year wealth, 0 on a failed path; the per-year trace (runPolicy's own, record.mjs makeTrace) | the same | SAME |
| 30 | The reducer and its version | reduce-7r.mjs: requireFairLogs over the logs' stamps, then its own gate on every ran line (each case's arms the same but the bridge read, at the registered settings), every swap line (no difference from the last bridge year on; the access year the case's bridge) and every trace's count, seed, arm and stamp; INCOMPLETE unless all fourteen traces are there; 38 planted checks, 22 planted faults each caught (mutate-reduce-7r.py, results-reduce-7r-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; exact one-sided McNemar with Holm (items 1, 3, and the four swap comparisons), the exact interval against the 0.25 margin (the swap arms' "carries none", item 3's close); the paired end-wealth median's exact order-statistic interval (item 5); no standard error is read | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival and end wealth are simulated; the table's read is printed in the log only | the same | SAME |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read: five processes share four cores, so the seconds are not comparable |

## Decision rule (registered before launch)

- **Primary:** the swap arms against off on S126 and bridge 4 (reduce-7r.mjs decide()).
  - Per swap arm against off, paired on the same 3,000 paths: it **carries the harm** when it loses more than it saves and
    its exact one-sided p for harm, Holm-adjusted over the four swap comparisons, is below 0.05; it **carries none** when
    the exact 95% interval for its survival change has its lower end above -0.25 points (the regimen's margin where off
    survives 95% or more: S126 100.0, bridge 4 99.7 in 7e). A harm below the margin can read both; the case rule below
    reads "both" first.
  - Per case: **tier** (RTIER carries it, RREST carries none), **method** (the reverse), **both** (each carries it),
    **neither** (each carries none: an interaction), or unresolved.
  - A case is read only where the reader's harm shows (item 1: more lost than saved, Holm over the two at 0.05).
  - **HELD:** a read case reads tier, and none reads method or both. **FALSIFIED:** a read case reads method, and none
    reads tier or both. **INCONCLUSIVE:** otherwise - no case read; or both, neither, unresolved, or the two cases split.
- **Survival, the other items:** exact one-sided McNemar for harm (stats.mjs); item 1 Holm over S126 and bridge 4 at
  0.05; item 3 alone at 0.05, with its interval for the close; item 2 by its counts. No margin in item 1: it asks whether
  the harm is there to split, not its size, which 7e read.
- **The trade (item 5; it sets which question HELD takes to the maintainer):** per case, over the paths both arms survive,
  the paired end-wealth difference's median with its exact 97.5% order-statistic interval (Bonferroni over the two
  cases). The margin: 5% of off's median end wealth. It buys estate when the interval lies above 0 and the median is at
  least the margin; it buys nothing when the interval's upper end is below the margin; otherwise it is inconclusive.
- **The gate adds:** each swap arm's log line counts the path-years where the two choosers differ in the last bridge year
  or after; the gate refuses any but 0, and an access year other than the case's bridge (S126 2, bridge 4 4).
- **Declared choices, not derived:** the margin 0.25 (the regimen's); the 5% estate margin (a twentieth of the estate; no
  record fixes it); 97.5% (two cases); Holm over four swap comparisons (two arms on two cases).
- **Reported, not tested:** as the Prediction lists.

## Decision fed

- **Held:** the tier carries the harm, not the reader's bridge-year method. F2 is not built as the cure for it (F2 also
  reads accurately, so it would likely choose the same tier; grade C, an inference from this result). What goes to the
  maintainer depends on item 5: the trade buys estate on both cases -> whether survival alone judges households at 99.5%
  and over; it buys nothing on at least one case -> the solver's risk weighing (the switch margin, the tier menu's
  pricing) is examined before any bridge fix; otherwise -> the intervals go to the maintainer as they are.
- **Falsified:** the rest of the reader's bridge-year moves carries the harm. F2 is built and tested as 7e was (the
  maintainer, 25 Sep 07:29 UK), after the 08:17 row's revisit trigger (the early 8h read) is put to the maintainer.
- **Inconclusive:** nothing is decided about the mechanism. The per-case reads and counts go to the maintainer with the
  options then open (a second tuning seed, 7004 as replication, or F2 on the design's own merits).
- **Item 3, either way:** it resolves or keeps O23 as the Prediction says; it does not change the outcome.

## Provenance

- The panel, the bridge lengths and the balances: audit-s126.mjs (variant() and diag7r's PANEL) and the library
  (research/policy-study/scenarios.mjs), printed in the Derivation.
- The reader's scope and the swap: solve.js l.501-505 and chooseAction; grid.js readValues; swap.mjs;
  research/tests/solver-choose-hook.test.mjs (8 checks, 3 of them planted). The tier coding: solve.js runPolicy
  (tierPen x 4 + tierIsa) and fast.js tiersFor. The trace: record.mjs makeTrace.
- 7e's figures: results-7e.txt. O23's: results-o17-7e.txt. F1's S366 figure: results-f1.txt l.26.
- lambda 0.0223606797749979: S126's landed lambda, 7e's; the gate checks it.
- The margin 0.25: stats.mjs MARGINS, the regimen's (the maintainer, 25 Sep 20:47 UK).
- The arm time: results-look2time.txt (S126 off at 3,000 paths, 458 s beside one other process) and 7e's look 2 (3,000-path
  arms 426 to 576 s, results/bridge7e/look2.txt).
- The exact tail at 3,000 tosses: stats.mjs binomUpperHalf, fixed 26 Sep; stats.test.mjs against Python's exact integers.

## Derivation script

- `derive: research/solver/derive-7r.mjs > research/solver/results-derive-7r.txt sha256 7ff0d8930134e467`
  (7e's rates scaled to 3,000 paths, Poisson draws from a fixed seed, read by 7r's rule restated; the launcher re-runs it
  and refuses to launch if the output or its hash moved).

## Point and interval

80% intervals, the author's:
- S126, the reader against off on seed 7002: -0.45 points (-0.8 to -0.15). bridge 4: -0.3 (-0.6 to 0.0).
- RTIER against off: S126 -0.45 (-0.8 to -0.1), bridge 4 -0.25 (-0.6 to 0.0). RREST against off: 0.0 (-0.1 to +0.05) on
  each (S126's year-0 moves may differ in the tier alone, making RREST off itself).
- S120 and wealth x2: 0 (0 to 0). S366, v1 against off: -0.1 (-0.5 to +0.3).
- The paired end-wealth median over the paths both survive, as a share of off's median: S126 +15% (+3% to +40%), bridge 4
  +12% (0 to +35%).

## Credence

The author's probability that each item holds: 1, 0.60 (S126 0.80, bridge 4 0.75: 7e's harm was on other paths); 2,
0.90; 3, 0.30 (one of 48 unadjusted comparisons); 4, 0.55; 5, 0.65. The outcome: HELD 0.55, FALSIFIED 0.15,
INCONCLUSIVE 0.30. Scored by scorecard.mjs.

## Power

From results-derive-7r.txt (7e's rates at 3,000 paths: S126 14 lost, 0 saved; bridge 4 9.75 lost, 0.375 saved; 20,000
draws a scenario):
- **Item 1:** the harm shows on S126 with chance 0.997, on bridge 4 0.916, on both 0.914, if 7e's rates hold here.
- **The primary read, by the true story:** the tier carries it all -> HELD 0.997 (INCONCLUSIVE 0.003); the rest carries
  it all -> FALSIFIED 0.997. Each carries half, independently -> INCONCLUSIVE 0.739, but HELD 0.130 and FALSIFIED 0.132:
  a split truth reads one-sided about a quarter of the time, because half of S126's loss is about 7 paths, at the edge of
  what a swap arm must lose to carry it (7 lost with none saved, after Holm over the four). The tier on S126 and the rest
  on bridge 4 -> INCONCLUSIVE 0.819, HELD 0.177 (bridge 4's share missed). No harm on these paths -> INCONCLUSIVE 1.000.
- **What it cannot see:** a loss a swap arm carries below 7 paths of 3,000 (about 0.23 points) reads as carrying none,
  since up to 7 lost with none saved keeps the interval's lower end above -0.25.
- **Item 3 (O23):** real at 7e's rate -> replicated 1.000; noise at 7e's discordance -> replicated 0.034, closes 0.339,
  stays open 0.627; no change -> closes 0.999.
- **Item 5:** about 2,985 pairs; the 97.5% interval runs 62 order statistics either side of the median. Its width in money
  is NOT KNOWN before the run: no record gives the spread of the paired differences.
- **Time:** ten arms of 3,000 paths at 16 points, 426 to 576 s each measured (Provenance), plus four swap arms, each a
  forward run only (about 92 s per 1,000 paths beside the solve, results-look2time.txt, and two choosers in the bridge
  years). S126's and bridge 4's processes run four arms, two solves: about 25 to 35 minutes in all on four cores, plus the
  smoke run.

## Budget line

The bridge class's decision error: 7e's reader, reading the bridge accurately, cost S126 0.47 and bridge 4 0.31 points
of survival. 7r removes no error itself. It says which line that cost belongs to: the bridge read's method (F2's line),
or the solver's decision error when it reads right (the risk weighing, or the objective, which the maintainer owns).

## Pre-mortem

- **Most likely:** a mixed truth - the tier and the rest each carry part - which reads INCONCLUSIVE, or one-sided about a
  quarter of the time (Power). The per-case counts go to the maintainer either way; RTIER against the reader shows how
  much the tiers alone reproduce.
- **Second:** bridge 4's harm does not show on these paths, so the read rests on S126, where the reader changes only the
  year-0 move.
- **Third:** item 5 is inconclusive on one case, so HELD takes the intervals to the maintainer rather than one question.
- **Least likely:** the gate fails - the settings are 7e's, the smoke run exercises the mode and its swap arms, and the
  hook test pins the swap and the reader's reach.

## Changes after seeing results

None.
