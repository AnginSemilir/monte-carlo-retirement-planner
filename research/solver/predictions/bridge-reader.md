# Prediction: bridge-reader

- **Run:** `research/solver/batch-7e.sh`: audit-s126.mjs's bridge7e mode.
  - Wave 1, four at a time: 23 cases, each with arms off, v1, v2 and the reader, 16 points, 1,000 held-out paths of seed 7011.
  - Wave 2, three at a time:
    - the no-bridge controls, off against the reader;
    - S360 with the reader at 5 and 15 return points;
    - S126, bridge 6 and S366 at 30 points, off against the reader.
  - Last, alone on the machine: the time bar (`readertime 30 2`).
  - Output: result logs in `results/bridge7e/*.txt`; the reducer is `node research/solver/reduce-7e.mjs`.
- **Kind:** test
- **Written:** 25 Sept, 11:28-11:50 UK, before the run. Seen before writing it, and declared here:
  - 7c's results for off and v2 on these cases (results-f1v2.txt, seed 7002, final year averaged);
  - the reader's own checks (results-reader-checks.txt);
  - a coarse trial on S126 at 6 points, not registered: the opening table read 27.3 with off and 97.6 with the reader, solve times 72.5 s and 73.9 s;
  - check 6, the reader's run time at 16 points (results-readertime.txt, filled in below when it lands, before registering).
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
  results-reader-checks.txt). Off the grid it differs from today's read only in a retired pre-access year, and only
  through p:
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
  over, so p is 1 and the read is c = S at every node near the opening. Hence within 0.5 of off.
- **No survival cost:**
  - v2 lost 0.8 +/- 0.32 on bridge 4 (7c), through a cap that read the position's own money as a crude chance and changed
    the tier moves (42 -> 14 years below tier).
  - The reader reads the table's own values in probability, so moves change only where the old read was wrong.
  - The prediction is no loss beyond two se anywhere. This is the claim most at risk: any change of moves can lose on
    some paths.
- **Run time:**
  - The reader adds, per retired pre-access year and world, one pass over the nodes to build p, c and R; per read in
    those years, a log and a Phi per prefix.
  - The coarse trial on S126 at 6 points took 73.9 s against 72.5 s, about 2%.
  - Check 6 at 16 points: [filled in from results-readertime.txt before registering].
  - At 30 points the pass per year grows with the nodes, as the solve does, so the ratio should hold. Hence at most 20%.
- **Known approximations, not predicted either way:**
  - one reference mix per world, from the opening balances, the ISA and taxable account moving together (drafts/reader-design.md);
  - the first owner only (couples are after Phase 4, O11).

## Prediction

1. **In class away from the edge** (S126, share 0.90, bridge 1, bridge 4, wealth x0.5, wealth x2, S120, S122, S124): the
   reader's table within +/-5 of its simulated survival. The thin S128 and S130 within +/-8.
2. **Money arriving:** bridge 6 and S366 within +/-5. S370's gap is reported, not predicted.
3. **The edge and the short:** share 0.95 and S360 within +/-10.
4. **The cost case:** bridge 4+cost within +/-8.
5. **No survival cost:** on no case, in any wave, does the reader lose simulated survival against off beyond two paired se
   (the whole-count rule; a tie exactly at the line is reported as at the line).
6. **Gains where v2 gained most:** the reader gains survival against off beyond two se on share 0.95 and on S360.
7. **Out of class:** bridge 0 and the controls S194, S252 and S330 identical to off (table, simulation and years below
   tier). Share 0.50 and 0.70 within 0.5 of off on the table and the simulation.
8. **The product's 30 points:** S126, bridge 6 and S366 read within +/-5 with the reader.
9. **The time bar:** the reader's added solve time at 30 points at most 20% on each of S126, bridge 6 and S366. That is
   the ratio of median times over two alternated runs each way, alone on the machine.

**Reported, not predicted:**
- every arm's table, simulation, gap, years below tier and below target, and survival against off: v1 and v2 in the
  same setting (never measured together before, the 18:21 UK note in 7e);
- S162 and S172 (short bridges, the reviewer's comfortable and trade-off cases): scored only under item 5;
- S360 with the reader at 15 against 5 return points, 7l's first evidence (7j: +2.00 +/- 0.47 with no bridge read).
  If the gain stays beyond two se with the reader, finer averaging stays a candidate. If it falls within, the gap was
  the bridge misread.

## Falsified if

Any of these:
- the reader loses survival beyond two se on any case;
- an in-class case away from the edge misreads by more than 10 with the reader;
- bridge 6 or S366 misreads by more than 15;
- the time bar exceeds 20% at 30 points on any of the three.

**Then** the reader is not carried forward, and F2 (held, drafts/f2-design.md) is built and tested the same way (the
maintainer, 25 Sep 07:29 UK). If none of these fires, the reader is put to the maintainer as the bridge read:
"approved if positive and at most 20% more run time" (24 Sep). A miss on items 1-4, 6-8 that is not in the falsifier is
recorded as a miss, never re-read.

## Fair-test table

Arm A is off, arm B the reader. v1 and v2 run on the same settings and are reported.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | 7c's 21 cases (its rule: the S126 variants, the library bridge class S120-S130, S360 S366 S370, the cost case), plus S162 and S172 (short bridges) and the controls S194, S252 and S330 (no bridge), which the outside reviewer named before any 7e run (outside-review-reply-2.md) | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (pension share, bridge length, wealth, a 30k cost in year 2) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.0223606797749979 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 1,000 held paths of seed 7011 (held out: the reader was built after misreads seen on seed 7002's paths; the gate checks the seed in every ran line) | the same paths, paired | SAME |
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
| 30 | The reducer and its version | reduce-7e.mjs (its own gate on every ran line; read-f1v2.mjs refuses exact-final-year arms) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 1,000 paths; se = sqrt(discordant) / N; beyond two se when net^2 > 4 x discordant | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the table read is reported only as the misread under test | the same | SAME |
| 33 | For timings: what else the machine was running | the time bar runs last, alone (readertime 30 2, alternated); the waves' solve seconds are reported, not judged | the same | SAME |

## Changes after seeing results

None yet.
