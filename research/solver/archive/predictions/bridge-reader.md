# Prediction: bridge-reader

- **Run:** `research/solver/batch-7e.sh`: audit-s126.mjs's bridge7e mode.
  - Wave 1, four at a time: 24 cases, each with arms off, v1, v2 and the reader, 16 points, 1,000 held-out paths of seed 7011.
  - Look 1: `reduce-7e.mjs --look1` reads wave 1 by the exact rule (Decision rule, below) and names the cases it leaves
    open.
  - Look 2, beside wave 2: those cases on more paths of seed 7011 (their first 1,000 are wave 1's paths), off against the
    reader: 8,000 for bridge 4, wealth x0.5, S130 and S128, 3,000 for the rest (the maintainer, 25 Sep 22:45 UK), each
    group over two processes when it is large.
  - Wave 2:
    - the no-bridge controls, off against the reader;
    - S360 with the reader at 5 and 15 return points;
    - S126, bridge 6 and S366 at 30 points, off against the reader.
  - Last, alone on the machine: the time bar (`readertime 30 2`).
  - Output: result logs in `results/bridge7e/*.txt`; the reducer is `node research/solver/reduce-7e.mjs`.
- **Kind:** test
- **Status:** registered by its push (the pushed commit is the timestamp), and launched only after a plan review passes on
  this version (the forty-seventh failed, 21:56 UK, and the forty-eighth, 22:40 UK; their findings are fixed here, with
  the maintainer's two choices of 22:45 UK: look 2 at 8,000 paths on four cases, and a fixed-effect pooled floor) and CI is
  green. Its decision rule is the outside review's
  section 19 (exact McNemar, Holm across the cases, per-case margins, three outcomes, two looks), in the regimen the
  maintainer adopted 25 Sep 20:47 UK, with the margins that review proposed. The old "beyond two se" reading is retired
  for this test.
- **Written:** first draft 25 Sept 11:32 UK, committed 11:32 UK (fadea51), before the pause. Revised 25 Sept from 20:40 UK
  (the forty-sixth review's findings, the reader's return-convention fix, then the regimen's rule and fields; the
  last edit's time is in the commit); still before any 7e run. Seen before writing it, and declared here:
  - 7c's results for off and v2 on these cases (results-f1v2.txt, seed 7002, final year averaged);
  - the reader's own checks (results-reader-checks.txt);
  - a coarse trial on S126 at 6 points, not registered: the opening table read 27.3 with off and 97.6 with the reader, solve times 72.5 s and 73.9 s;
  - check 6, the reader's run time at 16 points (results-readertime.txt, landed 25 Sep 21:14 UK; its figures are below).
- **Plan section:** PLAN.md schedule row 7e; drafts/reader-design.md

## Question

The bridge reader rebuilds survival in a retired pre-access year as p x c + R. Here p is the reference chance that the
position's own accessible money pays the floor bills to access. Does it:
- read the bridge households within a few points of their simulated survival, as F1 v2 did;
- keep v2's survival gains where the old read was worst, share 0.95 and S360;
- lose survival nowhere, where v2 lost 0.8 on bridge 4;
- cost at most 20% more solve time at the product's 30 points?

All of this is asked with the tier above and the final year exact held identically in every arm, on held-out paths.

## Derivation

- **At a grid node** the reader returns the table's own value (node reproduction, largest miss 5.6e-17 over 7776 nodes,
  results-reader-checks.txt). Off the grid it differs from today's read only in a retired pre-access year, in two ways:
  it takes p from the position's own accessible money, and it blends c and R in PROBABILITY, where today's read blends
  log-odds (off reads expit(sum w logit S); with p = 1 the reader reads sum w S, which is not off's read):
  - Today's log-odds blend drags a covered position down whenever one of its corners sits at the dead end of the share
    axis. That is the misread, -43 to -98 points with off in 7c (results-f1v2.txt).
  - The reader takes p from the position's own accessible money. A position that can pay reads about p times the
    continuation, whatever the dead corner holds. The trap reads 0.40, not 0.85.
- **Covered cases** (in class, away from the edge: S126, share 0.90, bridge 1, bridge 4, wealth x0.5 and x2, S120, S122,
  S124): p is near one at the opening, so the read is about c, which is about the supported nodes' S. That puts the read
  near simulation, as v2's cap did (+0.0 to +1.4 in 7c).
- **The thin S128 and S130:** v2 read them +5.8 and +8.6 (optimistic, O9). The reader carries no cap, so its read is the
  table's own continuation. The table reads high there (O9), so it could be optimistic too. Hence +/-8.
- **Money arriving** (bridge 6, S366, S370): the reference counts it, as net bills with the least over the prefixes.
  v2's read was within +1.0 on bridge 6 and S366. Hence +/-5 on those two; S370 is reported.
- **The edge and the short** (share 0.95, coverage 1.02; S360, short even with inflows): p sits well below one at the
  opening. The read is p x c from the position's own money, where today's read is near zero:
  - v2 read these -21.7 and +1.3, and gained 22.2 and 11.5 points of survival in 7c.
  - The reader's p is exact for a two-bill bridge (share 0.95) and a lognormal fit for S360's 8 bills (checked within
    0.02 plus 4 se, reader.test.mjs). Hence +/-10.
  - The survival gain comes from reading these positions as alive, which changes the moves. The reader should keep the
    direction of v2's gain on both.
- **The cost case** (bridge 4 with a 30k cost in year 2): the reference's bills include the cost (needY).
  - v2 read it -7.0, cautious because its cap assumed an even spend.
  - The reader's p is the chance of paying the actual dated bills. Hence +/-8.
- **Out of class** (bridge 0, the no-bridge controls S194, S252 and S330): no retired pre-access year, so no reader table.
  The solve is bit for bit today's (pinned on S000, reader-solve.test.mjs). Share 0.50 and 0.70 are covered many times
  over, so p is 1 and the reader reads the corners' S blended in probability, where off blends log-odds. The two agree
  where the corners are near one another, as they are for a covered household near the opening (off read 0.6 above
  simulation on both in 7c). Hence within 0.5 of off.
- **No survival cost:**
  - v2 lost 0.8 +/- 0.32 on bridge 4 (7c), through a cap that read the position's own money as a crude chance and changed
    the tier moves (42 -> 14 years below tier).
  - The reader reads the table's own values in probability, so moves change only where the old read was wrong.
  - The prediction is no harm by the exact rule on any case. This is the claim most at risk: any change of moves can
    lose on some paths.
- **Run time:**
  - The reader adds, per retired pre-access year and world, one pass over the nodes to build p, c and R; per read in
    those years, a log and a Phi per prefix.
  - The coarse trial on S126 at 6 points took 73.9 s against 72.5 s, about 2%.
  - Check 6 at 16 points (results-readertime.txt, on the code before the growth-convention fix, which changes one
    formula per reference and not the work; a re-timing NOT CHECKED): ratios 1.028 on S126, 1.032 on bridge 6 and
    1.064 on S366, with 0 unsupported nodes.
  - At 30 points the pass per year grows with the nodes, as the solve does, so the ratio should hold. Hence at most 20%.
- **The reference's growth convention** (fixed 25 Sep evening, before any 7e run): the solver grows each pot by
  exp(ln(1 + R) + V z), so R is the median. The reference first took V^2/2 off 1 + R as if R were the mean, about half a
  point a year too pessimistic at Medium (the outside review's Finding 3). It now matches the mix's mean gross,
  checked against the solver's rule by numerical integration (reader-solve.test.mjs, with the old formula as the planted
  fault).
- **Known approximations, not predicted either way:**
  - one reference mix per world, from the opening balances, the ISA and taxable account moving together (drafts/reader-design.md);
  - the first owner only (couples are after Phase 4, O11).

## Prediction

1. **In class away from the edge** (S126, share 0.90, bridge 1, bridge 4, wealth x0.5, wealth x2, S120, S122, S124): the
   reader's table within +/-5 of its simulated survival. The thin S128 and S130 within +/-8.
2. **Money arriving:** bridge 6 and S366 within +/-5. S370's gap is reported, not predicted.
3. **The edge and the short:** share 0.95 and S360 within +/-10.
4. **The cost case:** bridge 4+cost within +/-8.
5. **No survival cost:** no case, in any wave, shows harm by the exact rule (Decision rule, below), the reader against
   off.
6. **Gains where v2 gained most:** the reader gains survival against off on share 0.95 and on S360, each with an exact
   one-sided p for a gain below 0.05.
7. **Out of class:** bridge 0 and the controls S194, S252 and S330 identical to off (table, simulation and years below
   tier). Share 0.50 and 0.70 within 0.5 of off on the table and the simulation.
8. **The product's 30 points:** S126, bridge 6 and S366 read within +/-5 with the reader.
9. **The time bar:** the reader's added solve time at 30 points at most 20% on each of S126, bridge 6 and S366. That is
   the ratio of median times over two alternated runs each way, alone on the machine.

**Reported, not predicted:**
- every arm's table, simulation, gap, years below tier and below target, and survival against off: v1 and v2 in the
  same setting (never measured together before, the 18:21 UK note in 7e);
- S162 and S172 (short bridges, the reviewer's comfortable and trade-off cases) and S168 (early bridge, cash-heavy: 81k of
  its 117k accessible money in cash - with a 27k ISA and 9k in a taxable account, beside a 63k pension, 180k in all - which
  the reference treats as having no spread): scored only under item 5;
- **O5 (the thin households' lower tier: a sound choice or a second misread?), read on S124, S128 and S130:** if with the
  reader their years below tier stay within 5 of off's and the exact rule finds no harm, the lower tier is a sound choice
  made with an accurate read; if the reader at least halves them and gains survival (an exact one-sided p for a gain
  below 0.05), it was a second misread; otherwise O5 stays open. Reported, not predicted;
- the reader's unsupported nodes over every solve (bridge7e prints them);
- S360 with the reader at 15 against 5 return points, 7l's first evidence (7j: +2.00 +/- 0.47 with no bridge read).
  If the gain stays significant with the reader (an exact one-sided p for a gain below 0.05), finer averaging stays a
  candidate. If not, the gap was the bridge misread.

## Decision rule (registered before launch)

Section 19 of the outside review, as reduce-7e.mjs implements it (50 planted checks; each of 31 mutations of its rule,
gate and completeness is caught: results-reduce-7e-mutations.txt), with the maintainer's two choices of 25 Sep 22:45 UK
(the forty-eighth review: look 2's path count put to them; the pooled floor's method).

- **Primary outcome:** simulated survival, paired per case, on held-out seed 7011.
- **Looks:** 1,000 paths; then, for the cases look 1 leaves inconclusive, 8,000 for bridge 4, wealth x0.5, S130 and S128
  (where 3,000 would leave the case open if nothing changed: 6,147 to 7,684 paths needed, results-derive-7e.txt) and
  3,000 for the rest (the same first 1,000 paths: pathsForSeed builds path i from seed + i x 7919). The error rate is
  split 0.005, then 0.045. The gate checks each look-2 case at its own count.
- **Comparisons:** the reader against off (primary). The reader against v1 and against v2 (secondary, reported: look 1,
  Holm across the 24, at 0.05).
- **Per case,** b paths lost and c saved of N:
  - Test: exact conditional McNemar on the discordant paths, one-sided for harm (not mid-p).
  - Interval: the exact interval for the survival change (Clopper-Pearson on the lost share, mapped to points), at 1
    minus the look's rate.
  - Margin: 0.25 points where off survives 95% or more; 0.5 points below.
  - No material harm: the interval's lower end is above minus the margin. A real loss smaller than the margin is reported
    as such and does not block.
  - Harm: the Holm-adjusted p, across the 24 wave-1 cases each at its latest look, below the look's rate, and a point loss
    of at least the margin.
  - Inconclusive: neither, after the second look; the bound is reported.
- **The 30-point cases and the no-bridge controls:** each its own family of 3, one look at 0.05.
- **Pooled over the 16 cases the prediction expects unchanged** (reduce-7e.mjs POOL: the nine in class away from the
  edge, the thin S128 and S130, bridge 6, S366, S162, S172 and S168): a fixed-effect (inverse-variance) mean change with
  its 95% interval, plus the sign test; the random-effects (DerSimonian-Laird) mean is reported beside it. Fixed effect,
  not the regimen's random effects, by the maintainer's choice (25 Sep 22:45 UK): a random-effects interval widens with
  any spread between cases, gains included. Simulated at the registered path counts (results-pooled-floor.txt,
  sim-pooled-floor.mjs, rebuilt 26 Sep with a sound generator after the forty-ninth review found the first version's
  cycled; grade C): with no change the whole falsifier fires in about 3% of runs either way; one pool case gaining 3
  points fires it in 7 to 13% of runs with random effects and about 2% with fixed effect; a 0.1-point loss on every
  pool case fires it in about 93% either way (Holm across all 24 wave-1 cases, as registered). The price, put to the
  maintainer 26 Sep 02:04 UK with these figures and accepted at 06:40 UK (an earlier "at most about 4 points", put at 01:49 UK, was
  wrong: it came from two-case scenarios and Holm across 16; the fiftieth review): a small loss spread over three to
  six covered cases is caught 8 to 10 points less often with fixed effect (S124, S122 and S366 each 0.3 lower: 57%
  against 67%; the four long cases each 0.3 lower: 67% against 76%; six covered cases each 0.2 lower: 76% against 84%),
  because the per-case tests alone catch only 28 to 53% there. A loss on one or two cases is caught well only when it is about twice
  the margin or more (S128 and S130 each 1 point lower: 99.1% against 99.3%); at about the margin the per-case tests
  alone catch it 43 to 46% of the time and the whole falsifier 48 to 60%, fixed effect 4 to 4.5 points below random
  effects (bridge 4 and wealth x0.5 each 0.3 lower: 55.9% against 60.3%; S128 and S130 each 0.5 lower: 47.9% against
  51.9%). A small spread loss that 7e misses still
  meets 7e's replication (7o) and the combined no-harm run (step 7, 8f) before any default. A fixed-effect interval answers "is the average change over these 16 cases below -0.1", which is the
  question; it does not generalise to other households, which 7e does not claim. Each case's variance is floored at one discordant path, so a case with none still
  carries weight (declared: a choice, not part of the method). Not the mode's class flag, which holds share 0.95 and
  bridge 4+cost, where gains are expected: one large gain there widens a random-effects interval, and a run with no path
  lost read FALSIFIED (the forty-seventh review; now a planted check). Those cases are read by items 3, 4 and 6. Under no
  change on any pool case the interval's lower end is expected at -0.061; a 0.2-point loss on every case puts it at -0.266;
  bridge 4 gaining 3 points leaves it at +0.021, where random effects would read -0.083 (results-derive-7e.txt).
- **Read gap** (table minus simulation): scored per case against items 1-4, 7 and 8; not tested.
- **Time:** the time bar at 30 points, at most 1.20 on each case.
- **Carried forward if** no case shows harm, the pooled (fixed-effect) interval lies above -0.1 points, the time bar holds,
  and neither misread condition below fires. Inconclusive cases are listed with their bounds for the maintainer.

## Decision fed

- **Held** (NOT FALSIFIED): the reader goes to the maintainer as the bridge read, "approved if positive and at most 20%
  more run time" (24 Sep). If approved, it is confirmed on a second held-out seed (7004, the regimen's replication rule:
  a single 7e run is grade B) before it becomes solvePlan's bridgeRead default, with the decided-defaults block and its pin
  in the same commit, unless the maintainer accepts the risk explicitly (grade B can support a default that way). F2 stays
  held. 8d and Phase 4 run with the reader once it is the default.
- **Falsified:** not carried forward. F2 (drafts/f2-design.md) is built and tested the same way (the maintainer, 25 Sep
  07:29 UK).
- **Inconclusive on some cases, nothing fired:** carried forward to the maintainer with those cases and their bounds. The
  maintainer decides whether that is enough, or a longer run is registered for them.

## Provenance

- The margins 0.25, 0.5 and 0.1 points: the review's section 16 item 3, adopted with the regimen (the maintainer, 25 Sep
  20:47 UK). Pinned to stats.mjs's MARGINS by plan-defaults.test.mjs since ebf2a5a (the maintainer's unlock, 21:54 UK).
- The look rates 0.005 and 0.045 and the path counts: the review's section 16 item 8.
- lambda 0.0223606797749979: S126's landed lambda, the value in every ran line of results-f1v2.txt; the gate checks it.
- The time bar, 20%: the maintainer, 24 Sep.
- 7c's gaps and survival changes quoted in the derivation: results-f1v2.txt.
- The discordance per case, the paths needed and the least harm look 2 can show: results-derive-7e.txt.
- Check 6: results-readertime.txt.
- The reader at the nodes, the reference's accuracy and the growth convention: results-reader-checks.txt, reader.test.mjs
  and reader-solve.test.mjs.

## Derivation script

- `derive: research/solver/derive-7e.mjs > research/solver/results-derive-7e.txt sha256 9ee90243f97a846b`
  (reads results-f1v2.txt; the launcher re-runs this line and refuses to launch if the output or its hash moved).
- The paired arithmetic: stats.mjs, checked by stats.test.mjs against the review's worked figures (Appendix A and
  section 19).

## Point and interval

The survival change, the reader against off, per case in points, with an 80% interval:
- The cases v2 left untouched (share 0.90, S120, share 0.50, share 0.70, bridge 0, bridge 1): 0.0 (-0.1 to +0.1).
- The no-bridge controls: exactly 0 (no reader table).
- The covered cases with a few changed paths (S126, bridge 4, wealth x0.5, wealth x2, S122, S124, bridge 6, S366,
  share 0.78) and S162, S172, S168: 0.0 (-0.4 to +0.3).
- The thin S128 and S130: 0.0 (-1.0 to +1.0).
- bridge 4+cost: +2 (-0.5 to +5.5). v2's +4.9 came from caution (years below tier 10.7 -> 41.7); the reader reads the
  dated bills, so it may gain less.
- share 0.95: +15 (+5 to +23). S360: +8 (+2 to +13). S370: +4 (0 to +7).
- The pooled (fixed-effect) mean over the 16 cases expected unchanged: 0.0 (-0.1 to +0.1); its 95% interval's lower end
  about -0.06 under no change (results-derive-7e.txt).
- The time ratio at 30 points: 1.03 (1.00 to 1.08), from check 6 at 16 points.
The read gaps: the items' own bands (1-4, 7, 8).

## Credence

The author's probability that each item holds: 1, 0.70 (eleven cases must all hold, and the thin two could read high);
2, 0.80; 3, 0.60; 4, 0.65; 5, 0.75; 6, 0.80; 7, 0.85; 8, 0.75; 9, 0.95. Carried forward (nothing in the falsifier
fires): 0.60. Scored by the scorecard once it is built; 7e is its first entry.

## Power

From results-derive-7e.txt (7c's v2 against off, the nearest earlier record for this comparison):
- Look 1 at 1,000 paths can show no material harm, if the true change is near zero, on 10 of the 21 cases with a record.
  It is expected to leave 11 open: S126, bridge 4, S130, bridge 4+cost, share 0.95, S360, wealth x0.5, S366, share 0.78,
  S128 and S370.
- Look 2, if the true change is near zero, is expected (by the exact interval) to decide S126, S366 and share 0.78 at
  3,000 paths and bridge 4, wealth x0.5 and S130 at 8,000 (exact lower ends -0.23, -0.23 and -0.38 against margins of
  0.25, 0.25 and 0.5). S128 at 8,000 sits at the edge: its exact lower end is -0.512 against a margin of 0.5, so it may
  still read inconclusive, by a hair, with its bound reported. At 3,000 paths all four would have stayed open (the
  forty-eighth review's BLOCKING 1; the maintainer chose 8,000, 25 Sep 22:45 UK). share 0.95, S360, S370 and bridge
  4+cost gained 22.2, 11.5, 5.7 and 4.9 points with v2, so they clear the harm margin through a gain unless the reader
  loses it.
- What it cannot detect: the least loss look 2 can call harm is 0.25 to 0.37 points on the covered cases at 3,000, 0.34 on
  bridge 4 and wealth x0.5, 0.54 on S130 and 0.74 on S128 at 8,000, and 1.20 on bridge 4+cost at 3,000. A smaller true
  loss on those reads inconclusive or no material harm, with its bound.
- The cost of the 8,000 paths: 92 s per 1,000 paths beside the solve (results-look2time.txt: S126 off, 274 s at 1,000
  paths and 458 s at 3,000, side by side), so about 920 s an arm at 8,000 against 460 s at 3,000 - about 30 minutes more
  over the four cases' two arms, run beside wave 2.
- S162, S172 and S168 have no record for this comparison: NOT KNOWN, left to look 2.

## Budget line

The table-simulation gap (the error budget's third line), in its largest bridge-class part: the bridge misread, -43 to
-98 points with off in 7c. With it, the solver's decision error on bridge households (v2 lost 0.8 on bridge 4). The test
reduces the bridge class's read gap from tens of points to within +/-5 (items 1-4) without a survival cost (item 5).

## Pre-mortem

- **Most likely:** harm or an inconclusive result on the thin or cost cases (S128, S130, bridge 4+cost). The reader reads
  the table's own continuation, which reads high there (O9), and moves may lean on it. It would mean the reader fixes the
  bridge misread but exposes the table's general optimism (the review's Finding 2). The next step would then be the
  table-gap decomposition, not F2.
- **Second:** the pooled (fixed-effect) interval reaches -0.1 because several covered cases each lose a few paths. With
  fixed effect a gain does not raise its fire rate above the no-change 2% (results-pooled-floor.txt), so a fire means a small systematic cost; the next step
  is to read which moves changed.
- **Third:** share 0.50 or 0.70 differs from off by more than 0.5, through the probability blend against off's log-odds
  blend. It is a miss on item 7, not a falsifier. The blend then changes reads for covered households too, to be checked
  against simulation.
- **Least likely:** the time bar (check 6 at 16 points is about 1.03).

## Falsified if

Any of these (reduce-7e.mjs prints FALSIFIED - NOT CARRIED FORWARD):
- the exact rule finds harm on any case: a wave-1 case after its looks, a 30-point case or a no-bridge control;
- the pooled (fixed-effect) interval's lower end, over the 16 cases expected unchanged, is at or below -0.1 points;
- an in-class case away from the edge misreads by more than 10 with the reader. "In class" is read as in 7c
  (read-f1v2.mjs): every class case except the edge (share 0.95) and the inflow cases (bridge 6, S366), so it includes
  the thin S128 and S130 and the cost case (bridge 4+cost), where the derivation says the read could be optimistic;
- bridge 6 or S366 misreads by more than 15;
- the time bar exceeds 20% at 30 points on any of the three.

**Then** the reader is not carried forward, and F2 (held, drafts/f2-design.md) is built and tested the same way (the
maintainer, 25 Sep 07:29 UK). If none of these fires, the reader is put to the maintainer as the bridge read:
"approved if positive and at most 20% more run time" (24 Sep), with any inconclusive case and its bound listed. A miss
on items 1-4, 6-8 that is not in the falsifier is recorded as a miss, never re-read.

## Fair-test table

Arm A is off, arm B the reader. v1 and v2 run on the same settings and are reported.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | 7c's 21 cases (its rule: the S126 variants, the library bridge class S120-S130, S360 S366 S370, the cost case), plus S162 and S172 (short bridges) and the controls S194, S252 and S330 (no bridge), which the outside reviewer named before any 7e run (outside-review-reply-2.md), and S168 (early bridge, cash-heavy; the forty-sixth review). The reviewer's low-risk bridge case is OMITTED: every library household is at the top tier (M21), so a low-risk case would be a constructed variant, and none is built. Both sides of pension access are covered (bridge 0 against the bridges); State Pension start is after access for every case | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (pension share, bridge length, wealth, a 30k cost in year 2) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.0223606797749979 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 1,000 held paths of seed 7011 (held out: the reader was built after misreads seen on seed 7002's paths; the gate checks the seed and the count, 1000, in every ran line); look 2's cases on 8,000 paths of the same seed for bridge 4, wealth x0.5, S130 and S128 and 3,000 for the rest, whose first 1,000 are wave 1's (the gate checks each look-2 case at its own count) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing, no rival |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan), each path's own world in the forward run | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 (S360's reader@15 arm: 15, against the reader at 5, reported only) | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process per part, one engine build | the same processes | SAME |
| 10 | The minimum pot | one year of target (solvePlan's default), or the plan's own | the same | SAME |
| 11 | The raise cap | 1.1 | 1.1 | SAME |
| 12 | The estate preference | today's estate term (no weight set) | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps, consent given; one tier above allowed, set explicitly (riskAbove true), so tier eligibility is identical in every arm | the same | SAME |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | off (the product refuses it) | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points (30 for the third wave-2 job), the default shares and gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | the product menu for a 0.8 floor, capped at 1.1 | the same | SAME |
| 19 | The switch margin and switching cost | the defaults | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.0223606797749979; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003, weighted by survival | the same | SAME |
| 22 | The price of a year with no money | the floor's price (the M17 fix) | the same | SAME |
| 23 | Resilience and drift | resilience 0; no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off; the final year exact (finalIntegral true, set explicitly); no block trim | bridgeRead 'reader'; the rest the same | TESTED - the bridge reader |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per part, every arm | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the table's read reported as the gap only | the same | SAME |
| 30 | The reducer and its version | reduce-7e.mjs (its own gate on every ran line; read-f1v2.mjs refuses exact-final-year arms; it stops at INCOMPLETE unless every file is there with its full count, look 2's file holding exactly the cases look 1 left open; the exact rule, with 50 planted checks and 31 caught mutations, results-reduce-7e-mutations.txt; the logs' stamps checked by fair-gate.mjs's requireFairLogs) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the exact rule (Decision rule): exact one-sided McNemar, Clopper-Pearson interval in points, Holm, margins, two looks (stats.mjs) | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the table read is reported only as the misread under test | the same | SAME |
| 33 | For timings: what else the machine was running | the time bar runs last, alone (readertime 30 2, alternated); the waves' solve seconds are reported, not judged | the same | SAME |

## Changes after seeing results

None yet.
