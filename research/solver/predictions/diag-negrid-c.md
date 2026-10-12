# Prediction: NE-GRID C (has the wealth axis converged at 60 points, what is the under-read the finer axis leaves on S224, and what carries S364's over-read?)

- **Run:** `research/solver/batch-negrid-c.sh` - results/diagnegridc/case0-9.txt and the ten jobs' files (audit-negridc.mjs), reduced by reduce-negrid-c.mjs into results-negrid-c.txt
- **Kind:** test
- **Written:** 12 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world (each path built from the seed and its index, so B1's paths), and its first 16,000 for P's runs on S380 and S224 at 120 points; 7u's held-out seed refused by the audit
- **Unmasking:** a finer wealth axis moves every table the chooser reads, so it may move each household's own opening (printed) and unmask another error the coarse axis hid - S224's under-read below its runs (O145) is the case in point; 12 shares and 15 return nodes each change S224's tables beside the axis; any fix this leads to names bridge 4, S126, S224 and the 95% share household in its own Unmasking, and reports its solve time against gate 5
- **Mechanism:** grid.js:123 "axes.W = logAxis(n1, spend * 0.1, spend * top(open.pen + open.isa + open.tax));" (PR21: the wealth axis's points set each cell's width); grid.js:124 "axes.a = linAxis(COV ? n2 - 1 : n2);" (PR20: the share axis, item 4 and item 5); solve.js:449 "const QUAD = opts.quadNodes && opts.quadNodes !== 5 ? gaussHermite(opts.quadNodes) : { nodes: NODES, weights: WEIGHTS };" (the return quadrature, item 3)
- **Plan section:** PLAN.md "NE-GRID-C", O139, O141, O142, O143, O145, PR20, PR21, PR22; the deep review after NE-GRID B1 (deep-review-log.md 11 Oct 23:09 UK)

## Question

The deep review after NE-GRID B1's next step, NE-GRID C, given the maintainer's go-ahead (12 Oct): (1) does the wealth axis converge at second order - each table's move from 60 to 120 points a third of its move from 30 to 60, or less - on S380 under both reads and S224? (2) does S224's under-read below its runs stay at 120 points on 16,000 paths a world (O145)? (3, 4) do 15 return nodes, or 12 shares, carry S224's 60-point under-read? (5, 6, 7) do 12 shares, 120 points, or the order reference carry S364's 60-point over-read (NE-BLEND's stage B, moved inside)? (8) does bridge 4 stay within 0.3 points at 120 points?

## Derivation

- **The arms are research options or the candidate's own settings, inert by default:** `points` (120), `shares` (12), `quadNodes` (15, Gauss-Hermite) and `readerRef: 'order'` (NE-BLEND's ORDER arm); the candidate otherwise as B1's. No code change since B1 (the e3pcls pin b05309e7e0413eac).
- **Each table is read against its own policy's runs** (the plan-auditor's MINOR 2 of 12 Oct 06:15 UK: the score weighs the estate, so a better policy may survive less; only a table against its own runs reads its error): P and D forced in year 0, the job's own moves after, on the seed's first 4,000 paths a world, P on 16,000 where registered.
- **B1's records:** the 30- and 60-point tables (items 1, 3, 4) and S224's 60-point runs (items 3, 4) are B1's files read behind B1's own gate (reduce-negrid-b1.mjs), not re-run.

## Prediction

- **Item 1 HELD:** the wealth axis converges at about second order: every counted cell's move from 60 to 120 points is at most 0.35 of its move from 30 to 60 (RG-WSLOW not).
- **Item 2 HELD:** S224's table stays under its 16,000-path runs at 120 points by more than half a point in a world, shown (RG-UNMASK's or RG-OTHER's error, not the paths').
- **Item 3 FALSIFIED:** 15 return nodes carry under a fifth of S224's 60-point under-read.
- **Item 4 FALSIFIED:** 12 shares carry under a fifth of it.
- **Item 5 FALSIFIED, item 6 FALSIFIED, item 7 FALSIFIED:** none of 12 shares, 120 points or ORDER alone carries half of S364's 60-point over-read (the review's S364 causes split three ways and more).
- **Item 8 HELD:** bridge 4 stays within 0.3 points at 120 points.

## Falsified if

- **Item 1 FALSIFIED:** every counted cell's move from 60 to 120 is half its move from 30 to 60 or more: the axis converges at first order or slower (RG-WSLOW), and no size can be read off two grids.
- **Item 2 FALSIFIED:** S224's 120-point table lies within half a point of its 16,000-path runs in worlds 0 and 1 at the point: no under-read left at 120 points.
- **Item 3 HELD / item 4 HELD:** 15 return nodes (3) or 12 shares (4) raise S224's 60-point table by at least half its under-read in every counted world.
- **Item 5, 6 or 7 HELD:** 12 shares, 120 points or ORDER lower S364's 60-point table by at least half its over-read in every counted world.
- **Item 8 FALSIFIED:** a world's interval for bridge 4 lies wholly outside 0.3 points at 120 points.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | S380 and S224 (deciding), S364 (B2), bridge 4 (control) | the same | SAME: tuning-seed households |
| 5 | The paths | the seed's first 4,000 paths a world (B1's) | P's on the first 16,000 for S380 and S224 at 120 points | TESTED (item 2's path luck): the first 4,000 of the 16,000 are B1's, the rest reported beside them |
| 13 | The risk tier | P (0,0) | D (2,2) | SAME across jobs: one pair a household at one level and tier base (pairTook) |
| 17 | The grid: points, shares, gain buckets | B1's 30 and 60 points, 6 shares, 5 return nodes | 120 points; 12 shares; 15 return nodes (one change a job) | TESTED: each job changes one of the three against B1's 60-point job (items 3-7) or B1's two grids (item 1) |
| 24 | The read and edge handling: the bridge read | BASE | LOR (S380 at 120 points), ORDER (S364 at 60) | ONE ARM ONLY where named: LOR for item 1's read-space cells, ORDER for item 7 |
| 28 | Every file made by the same code | one launch, one stamp | B1's files, one launch of their own | ACCEPTED: B1's records read behind B1's gate, on code that differs by nothing the solve reads (no code change since B1) |
| 32 | The table's number is never the result | the gap between table and simulation is half the result, both printed | the same | ACCEPTED: items 1 and 3-7 read the tables' moves (deterministic); item 2 and 8 read a table against its own runs |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** each world's runs bounded by their exact (Clopper-Pearson) interval one-sided at ALPHA / 6 = 0.0083, ALPHA 0.05; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look; deterministic):** at P and D, worlds 0 and 1, for S380 under BASE and LOR and S224 under BASE: m1 = the table at 60 points less at 30 (B1's), m2 = at 120 less at 60; a cell counted where |m1| is at least half a point; HELD when every counted |m2| / |m1| is at most 0.35 (between second order's quarter and first order's half: the plan-auditor's 06:15 receipt); FALSIFIED when every one is at least 0.5; INCONCLUSIVE otherwise, or with none counted.
- **Item 2 (primary; single look):** S224 under BASE at 120 points, its table at P less P's runs on 16,000 paths a world, worlds 0 and 1: HELD when a world's interval lies wholly below -0.5; FALSIFIED when both worlds' points lie within 0.5 of 0; INCONCLUSIVE otherwise.
- **Items 3 and 4 (single look; deterministic):** S224's 60-point under-read (B1's table at P less its runs, worlds 0 and 1, counted where at least half a point under: -1.6173 and -0.8986, results-derive-negrid-c.txt section 1); the table at P's rise from B1's 60-point table under 15 return nodes (3) or 12 shares (4), each at 60 points: HELD when it rises by at least half the under-read in every counted world; FALSIFIED when by under a fifth in every one; INCONCLUSIVE otherwise, or with none counted.
- **Items 5, 6 and 7 (single look; deterministic):** S364's 60-point over-read (C's S364 at 60 points and 6 shares: its table at P less P's runs, worlds 0 and 1, counted where at least half a point over); the table at P's fall from that baseline under 12 shares (5), 120 points (6) or ORDER (7): HELD when it falls by at least half the over-read in every counted world; FALSIFIED when by under a fifth in every one; INCONCLUSIVE otherwise, or with none counted.
- **Item 8 (control; single look):** bridge 4 under BASE at 120 points, its own opening: HELD when every world's table less its runs is within 0.3 points at the point; FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise.
- **The causes, by the registered map (printed '=> <cause> held / not / open'):** RG-WSLOW held on item 1 FALSIFIED, not on HELD; RG-PATHS held on item 2 FALSIFIED with B1's 4,000-path under-read at least half a point in a world, not on item 2 HELD; RG-UNMASK held on item 2 HELD with item 3 or 4 HELD, not on item 2 FALSIFIED; S364-SHARE, S364-W and S364-REF held on items 5, 6 and 7 HELD, not on FALSIFIED; open otherwise. A cause the map leaves open is not settled by this test.
- **Reported, not items:** every job's tables, own opening, runs and reader copy counts; S380's and S224's 120-point P on the first 4,000 paths against the other 12,000; each household's 120-point policy against its 60-point one at P on B1's paths.
- **Declared choices, not derived:** 120 points (twice B1's fine grid: the review's design); 0.35 as the second-order line (the review's, between a quarter and a half); half a point as the smallest move, under-read or over-read read; half and a fifth as the carry lines; 16,000 paths for P on S380 and S224 (four times B1's); 15 return nodes and 12 shares (Phase V's sizes); the 0.3 control line (NE-ROOT's); S364's forced pair NE-ROOT's SS and SC (ai 12 and 14).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 8 FALSIFIED | the finer axis moves the candidate's read of bridge 4: no axis fix as it stands; the deep review weighs the control | 0.03 |
| item 1 FALSIFIED (item 8 not) | the axis converges slower than second order: no size is chosen from two or three grids; the deep review re-ranks (an adaptive axis, a household's own size) before any panel test | 0.06 |
| item 1 HELD, item 2 not HELD (item 8 not FALSIFIED) | the axis converges at second order and S224's under-read is not shown at 120 points: the panel test (B1's row 1) registers next, the candidate at the size C supports (40, 45 or 60 points, its solve time against gate 5) against 30 points on 7e's 25 households | 0.20 |
| items 1 and 2 HELD (item 8 not FALSIFIED) | the axis converges and S224's under-read stays: the panel test registers with O145 carried as a known under-read, its cause step beside it from items 3 and 4 | 0.29 |
| else | C's unsettled items named; the deep review after C designs the next step from these lines | 0.42 |

- **Waiver:** none needed: the chance the action changes is 0.58 (one less 0.42, the likeliest row), above a quarter

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1 HELD:** the wealth axis converges at about second order on S380 and S224 (grade B, one seed), so a converged value can be estimated from three grids; FALSIFIED: it does not, at these sizes. INCONCLUSIVE leaves it open.
- **Item 2 HELD:** S224's 120-point table lies under its own runs by more than half a point on 16,000 paths (grade B): O145 is a table error the axis does not remove; FALSIFIED: no under-read at 120 points. Which part carries it is items 3 and 4's (and others' if neither).
- **Items 3 and 4:** HELD names the part carrying S224's 60-point under-read at grade B (the table's move, deterministic; its runs reported); FALSIFIED rules that part out for most of it.
- **Items 5, 6 and 7:** HELD names the part carrying S364's 60-point over-read at grade B; FALSIFIED rules it out for most of it; with no over-read counted at 60 points, the finer axis already removed it (reported, the deep review's to grade). They feed the near-edge reading (O132, O137), no row.
- **Item 8:** the control; its FALSIFIED decides row 1.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F held (the maintainer: the axis's size changes the candidate's policy); NS-PROP waits; the panel test is a registered test of its own.

## Provenance

- **The design:** the deep review after NE-GRID B1 (deep-review-log.md 11 Oct 23:09 UK), its NE-GRID C; the maintainer's go-ahead (12 Oct, the session: 'Go ahead with C (Recommended)'; PLAN.md's 12 Oct 06:07 row; the plan-auditor's PASS of 06:15 UK).
- **Changed from the review's design (declared):** P's runs on 16,000 paths, D's on 4,000 (the review's 16,000 for both P and D: item 2 reads P, so D's extra paths would buy no item; budget); S364's three arms read as each one's fall from C's own 60-point, 6-share S364 rather than against NE-ROOT's 30-point tables (B2's question asked at 60 points, as the review set it); the items' thresholds declared above; the cause lines a registered map of the items' outcomes (the review's process flag).
- **The derivation, after its first output (declared):** its first run set S224's 120-point table by both item 1's and item 2's stories at once, so item 1's power was wrong (a ratio of 0.8 read INCONCLUSIVE); fixed in code with the JUDGED block unchanged (d06a3d6), then re-derived. The 120-point budget is measured (results-negrid-c-measure.txt: S380's 120-point solve 5046 s, 1.47 times its 60-point; peak memory 1093980 kB).
- **The build:** audit-negridc.mjs, reduce-negrid-c.mjs (100 planted checks, each of items 1-8 reaching all three outcomes from its own plants, EDGES, every boundary planted exactly), mutate-reduce-negrid-c.py (72 of 72 caught, results-reduce-negrid-c-mutations.txt), derive-negrid-c.mjs, batch-negrid-c.sh, preflight-negrid-c.sh, measure-negrid-120.sh.
- **The preflight:** to be run through the launcher before launch and quoted here.
- **Seen before registration (declared):** B1's results in full and its files; stage A's and NE-ROOT's; the deep review's figures and its scratch reads; the derivation's first output (item 1's power wrong, as above).

## Derivation script

- `derive: research/solver/derive-negrid-c.mjs > research/solver/results-derive-negrid-c.txt sha256 147bb29b316a8ab1`
  (B1's 30- and 60-point tables and S224's 60-point runs behind B1's gate, NE-ROOT's S364 timings behind its gate, the power of items 1-8 through reduce-negrid-c.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from the measurement and the logs)

## Point and interval

- **Item 1:** 0.4041, the largest counted cell's |move 60 to 120| / |move 30 to 60| (results-derive-negrid-c.txt section 3); 80% interval 0.2695 to 0.5779
- **Item 2:** -1.3390, points, S224's 120-point table less its 16,000-path runs in the lower world; 80% interval -2.7128 to 0.0101
- **Items 3-7:** none: read by the tables' moves
- **Item 8:** none: a control, read by its point and interval

## Power

From results-derive-negrid-c.txt section 2 (1,000 draws a cell through reduce-negrid-c.mjs's own items(); B1's records as they are):

```
  item 1, each cell's ratio about 0.25 (+-0.1): HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
  item 1, each cell's ratio about 0.35 (+-0.1): HELD 0.0010 INCONCLUSIVE 0.9990 FALSIFIED 0.0000
  item 1, each cell's ratio about 0.5 (+-0.1): HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  item 1, each cell's ratio about 0.8 (+-0.1): HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
  item 2, S224's 120-point table 0 points off its 16,000-path runs: HELD 0.0000 INCONCLUSIVE 0.2870 FALSIFIED 0.7130
  item 2, S224's 120-point table -1 points off its 16,000-path runs: HELD 0.3070 INCONCLUSIVE 0.6870 FALSIFIED 0.0060
  item 2, S224's 120-point table -2 points off its 16,000-path runs: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
```

Items 1 and 3-7 read deterministic table moves, so their outcomes follow the story with no sampling noise; item 1 needs every counted cell (eleven of twelve: S224's P world 0 moved 0.3969, under half a point) on one side, so a ratio near 0.35 reads INCONCLUSIVE. Item 2 separates no under-read (FALSIFIED 0.71) from two points of it (HELD 1.00); one point reads HELD 0.31.

## Budget line

From results-derive-negrid-c.txt section 4 (the measurement and B1's and NE-ROOT's logs; 12 shares taken as four times the 6-share solve, 15 return nodes as three times the 5, judged, NOT CHECKED until the preflight): in all about 27.18 core-hours, the ten jobs four at a time, about 6.80 h wall at the least; the 120-point solve 1.47 times the 60-point; peak memory at 120 points 1093980 kB. Each job may run 10 hours (the batch's timeout).

## Pre-mortem

- **First: the finer axis changes the policy.** Each 120-point table is read against its own policy's runs; item 1 reads tables alone, so a policy change between grids moves no item but is reported.
- **Second: item 1 needs every counted cell on one side.** A convergence that is second order on S380 but slower on S224 reads INCONCLUSIVE, and the cells are printed.
- **Third: the 12-share and 15-node solves are judged** at four and three times the 6-share, 5-node solve; the preflight times the small grids, and a job past 10 hours is cut off and refused by the gate.
- **Fourth: S364's over-read at 60 points may already be under half a point** (the finer axis removing most of it): items 5-7 then read INCONCLUSIVE with none counted, which is itself a reading for the deep review.
- **Fifth: B1's records are reused,** behind B1's gate; a defect in them reaches items 1, 3 and 4.

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories through the decision bands. No cap taken from the scorecard.

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.70 (18 of 25), ATTRIB 0.53 (28 of 53), SIZE 0.53 (24 of 45), CTRL 0.71 (11 of 15), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.29 (7 of 26).
Items 1-7 rest on the review's ranked causes, so each starts from 0.29; the derivation mixes the receipt's cause credences through the JUDGED stories and section 2's power, which puts item 1 at 0.51 (second order judged likely outside RG-WSLOW, as B1's own moves suggest), item 2 at 0.55 (RG-UNMASK's 0.50 keeping the under-read), items 3 and 4 at 0.24 each (RG-UNMASK split three ways), and items 5-7 at 0.29, 0.28 and 0.13 (the S364 causes, with a 0.15 chance no over-read is left to read). Item 8 starts from CTRL's 0.71 and moves to 0.85: bridge 4 held at 60 points under BASE.

- **Base rate, item 1:** 0.29 (a deep review's cause: RG-WSLOW against second order)
- **Base rate, item 2:** 0.29 (a deep review's cause: RG-UNMASK)
- **Base rate, item 3:** 0.29 (RG-UNMASK's quadrature part)
- **Base rate, item 4:** 0.29 (RG-UNMASK's share part)
- **Base rate, item 5:** 0.29 (S364-SHARE)
- **Base rate, item 6:** 0.29 (S364-W)
- **Base rate, item 7:** 0.29 (S364-REF)
- **Base rate, item 8:** 0.71 (CTRL)
- **Item 1:** HELD 0.51, INCONCLUSIVE 0.43, FALSIFIED 0.06 (derived, results-derive-negrid-c.txt section 3)
- **Item 2:** HELD 0.55, INCONCLUSIVE 0.30, FALSIFIED 0.15 (derived)
- **Item 3:** HELD 0.24, INCONCLUSIVE 0.18, FALSIFIED 0.58 (derived)
- **Item 4:** HELD 0.24, INCONCLUSIVE 0.19, FALSIFIED 0.57 (derived)
- **Item 5:** HELD 0.29, INCONCLUSIVE 0.29, FALSIFIED 0.42 (derived)
- **Item 6:** HELD 0.28, INCONCLUSIVE 0.30, FALSIFIED 0.42 (derived)
- **Item 7:** HELD 0.13, INCONCLUSIVE 0.31, FALSIFIED 0.56 (derived)
- **Item 8:** HELD 0.85, INCONCLUSIVE 0.12, FALSIFIED 0.03 (derived)
- **Judged:** none (the judged inputs are derive-negrid-c.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 ATTRIB, 5 ATTRIB, 6 ATTRIB, 7 ATTRIB, 8 CTRL

## Changes after seeing results

None.
