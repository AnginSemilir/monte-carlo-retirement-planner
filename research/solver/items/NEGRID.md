# NE-GRID (PLAN.md NE-GRID; the deep review after NE-BLEND stage A, deep-review-log.md 11 Oct 15:49 UK)

## The review's B1 items, as proposed

Items as the review proposed: (1) the BASE-LOR gap at each forced opening shrinks by at least half at 60 points in worlds 0 and 1 (INTERP against SPACE); (2) the weighted world line against simulation at 60 under each arm; (3) the risk price, each table's 2,2 less 0,0 by world against the simulated paired difference of the two forced openings (O142's step); (4) bridge 4 within three tenths of a point and S224 identical across arms (planted); reported: a capped-corner LOR read and the count of corners past the clamp. B2, only on B1's read: S364 at 6 and 12 shares (PR20) under BASE and LOR, ORDER at 6.

## As registered (predictions/diag-negrid-b1.md)

- **Item 1:** S380's gap LOR less BASE at P and D in worlds 0 and 1, a cell counted where its coarse gap is at least half a point; HELD when every counted cell's ratio of fine to coarse gap is at most 0.5, FALSIFIED when every one's is at least 0.8; deterministic. It does not split RB-INTERP from RB-SPACE (both close the gap); each read's own move between the grids, reported, does (the plan-auditor's BLOCKING 1 of 11 Oct 17:45 UK).
- **Item 2:** the review's weighted world line read as the weighted absolute error at stage A's openings (BASE at P, LOR at D) against half stage A's coarse error.
- **Item 3:** the risk price per world and arm against the paired runs, within a point.
- **Item 4:** bridge 4 under BASE, the candidate's read, within three tenths of a point; LOR's reported, its coarse over-read on record (BLOCKING 2 of 17:45); S224's identity across arms is in the gate (its LOR job not simulated: no bridge year).
- **Declared departures:** the capped-corner LOR read not run (budget; the clamp count reported); the decision rows restructured after the derivation's first output; item 2 read at stage A's openings, each arm's error at its own fine opening reported beside it (the chooser's selection, MINOR 3 of 17:45) (the prediction's Provenance).

## B1's read (the ledger's 11 Oct 22:48 row), item by item, from results-negrid-b1.txt

- **The gate:** passed - the twelve jobs once and done at 30 and 60 points, 4000 paths a world, seed 7002; every arm in its solve's meta; armTook, pairTook and forceIdentity passed; one action list a household; no LOR read counted under BASE or on S224, S224's arms the same; every file the log's; the coarse grid reproduced stage A's and NE-ROOT's records to the printed digits.
- **Item 1 HELD:** S380's gap LOR less BASE, coarse to fine: P world 0 -3.5053 to -0.9234 (ratio 0.2634), P world 1 5.5921 to 1.0716 (0.1916), D world 0 -3.8897 to -1.2304 (0.3163), D world 1 6.4021 to 1.0961 (0.1712).
- **Item 2 HELD:** BASE at P: A 1.1066 against half its coarse 1.2717 (by world 0.1454, -1.3917, -0.9274); LOR at D: A 0.4495 against half its coarse 1.6189 (by world -0.4707, -0.4918, 0.2591).
- **Item 3 HELD:** D less P, table against the paired runs, err by world: BASE 0.2393, -0.3462, 0.0868; LOR -0.0177, -0.2717, 0.2300, every one within a point.
- **Item 4 HELD:** bridge 4 under BASE at its own opening (D): 0.1160, -0.0102, -0.0042 by world. LOR's beside it (reported): 0.1678, -0.0097, -0.0042 - its world-0 over-read smaller at its point than the coarse 0.4731, its interval (-0.1701 to 0.6118) still reaching it; the read-space gap there (LOR less BASE at D, world 0) fell from 0.3512 to 0.0518.
- **Reported:**
  - Each read's own move between the grids at item 1's cells: BASE -1.8023, 1.1225, -1.9536, 1.2327; LOR 0.7795, -3.3981, 0.7057, -4.0733. LOR moved, most of all in world 1; under RB-SPACE it would have stayed.
  - Own openings: at 60 points both reads choose S380's plan-tier opening (ai 12); at 30 LOR chose the de-risked one (ai 14).
  - S380 at each arm's own fine opening: BASE 0.1454, -1.3917, -0.9274 (weighted 1.1066); LOR -0.4530, -0.2201, 0.0291 (weighted 0.2271).
  - S224 (no bridge year): its tables at one opening moved with the grid (at P in world 1, 76.7930 at 30 points and 73.7264 at 60), so the wealth axis's resolution moves tables outside the bridge too. Its errors at its own openings (fine ai 0: -1.6173, -0.8986, -0.0282; NE-ROOT's coarse ai 1: -0.1094, 1.3081, 0.8613) are at two openings and within noise, not compared (the plan-auditor's MINOR 4 of 11 Oct 23:00 UK).
  - The coarse tables' D less P: BASE -0.7095, 0.1686, 0.1533; LOR -1.0939, 0.9785, 0.4940. The fine runs': BASE -1.1000, 0.6250, 0.2750; LOR -1.1500, 0.5750, 0.2750.
  - LOR's clamp counts on S380 at 60 points: n 6854093160, lo 346660020, hi 10578300.

## What it settles and what it leaves

- **The decision table's row:** row 1 (item 1 HELD, item 4 not FALSIFIED).
- **Settled (grade B, one seed):** doubling the wealth axis closes most of the gap between the two bridge reads on S380, and brings both within half their coarse error of their runs; the fine tables price the de-risk within a point, and neither read chooses it - but forcing it still loses world-0 paths at 60 points (-1.1000, -1.1500), so O142's S380 member stands; bridge 4 holds under BASE.
- **Open, for the deep review after B1:**
  - RB-INTERP against RB-SPACE, from each read's own move: LOR moved.
  - Whether 60 points is enough: BASE still under-reads S380's good world, its interval below 0.
  - Whether a finer wealth axis changes outcomes on the panel, and at what cost.
  - The share axis, S364 and ORDER (B2).
  - S224's movement outside the bridge (the after-access family).

## NE-GRID C, as registered (predictions/diag-negrid-c.md; the 12 Oct 06:07 row)

- **Jobs (audit-negridc.mjs):** S380 under BASE (P on 16,000 paths a world) and LOR at 120 points; S224 under BASE at 120 points (P on 16,000); S224 under BASE at 60 points with 15 return nodes, and with 12 shares; S364 under BASE at 60 points with 6 and 12 shares, at 120 with 6, and under ORDER at 60 with 6; bridge 4 under BASE at 120 points.
- **Items:** (1) convergence: every counted cell's move from 60 to 120 points at most 0.35 of its move from 30 to 60 (deterministic; S380 and S224 under BASE, P and D, worlds 0 and 1; S380 LOR's cells reported); (2) S224's 120-point table against its own 16,000-path runs (O145; a table against its own policy's runs, since the score weighs the estate); (3, 4) 15 return nodes or 12 shares carrying S224's 60-point under-read; (5, 6, 7) 12 shares, 120 points or ORDER carrying S364's 60-point over-read (B2); (8) bridge 4 within 0.3 points at 120 points.
- **The causes:** a held/not/open line per cause by a registered map of the items' outcomes (RG-WSLOW, RG-PATHS, RG-UNMASK; S364-SHARE, S364-W, S364-REF), the review's process flag; amended on the plan-auditor's FAIL of 12 Oct 08:12 UK - RG-PATHS held only with the 120-point table more than half a point under the first 4,000 paths' runs (read at the point, about 0.6 to 0.8 points of sampling noise between the first 4,000 and the 16,000: the auditor's note for the deep review), S364-W 'not' only where the 60-point over-read keeps half the 30-point one, and items 3 and 4 naming a carrying part only with item 2 HELD.
- **Declared departures:** D's runs on 4,000 paths (P's on 16,000); S364's arms against C's own 60-point S364; the derivation's coupled S224 story fixed after its first output, its JUDGED unchanged (d06a3d6).
