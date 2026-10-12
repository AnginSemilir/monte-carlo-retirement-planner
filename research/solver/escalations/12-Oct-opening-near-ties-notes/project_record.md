# Opening risk tier near-ties: the project's own record (repository at ff13828)

Conventions:
- Paths are relative to `research/solver/` at ff13828bb82f7acecf5fce89b9b5cba4b23112d2 (link form: https://github.com/AnginSemilir/monte-carlo-retirement-planner/blob/ff13828bb82f7acecf5fce89b9b5cba4b23112d2/research/solver/FILE#Ln). Citations are `file:line`.
- "pts" means percentage points of survival. A gap of g score units is 100·g pts.
- "Realised" is the de-risk opening's saved/lost against the plan's-tier opening; positive means the de-risk did better.
- **[mine]** marks my arithmetic: pts = 100(s−l)/N, se ≈ 100√(s+l)/N. "Unpaired" is a difference of two printed survival lines.
- Seed 7002 unless marked; 7u uses 7013.
- The 7u-results branch was not needed: results-7u.txt is in ff13828.

## 1. Every recorded comparison of two year-0 openings: the table

### Takeaway
- **Bridge households the product misreads (no reader):** near-ties (gap < 1e-3) hide +2 to +13 pts on share 0.95, and −6.1 pts on S360 (the opposite sign to the tables).
- **Calibrated households (S126 and bridge 4 under the reader; S194):** all 11 near-tie swaps realised +0.39 to +0.64 pts, always with the table's sign, about 5 to 11 times the gap. That is consistent under-pricing of the de-risk, not noise and not flatness.
- **Tier in the state (TS+J, P):** mixture gaps sit just above 1e-3, with small realised differences (+0.03 to +0.34).
- **NE-GRID B1, S380 at 60 points:** forced openings agree in sign in every world and net about +0.28 pts [mine]: genuinely flat.

### Cited Findings

**Table A: pure opening swaps over all worlds.** The two arms share their tables and their rule after year 0; only the year-0 move differs. "Freed" means margin 0 in year 0 and 0.001 after. In every row the tables lead the de-risk (2/2).

A1-A7 are 7w's freed opening at weight 0.02, on 3,000 paths. A8-A13 are 7ab's freed opening on 8,000 paths. A14-A17 are 7ac's TS+J tables: TS+J's own opening against OPEN0 (the plan's tier forced), at margin 1e-3, 8,000 paths. All are 30x5 unless marked.

| # | Household (tables), weight | Gap | Saved/lost | pts ± se [mine] | Agrees? | Source |
|---|---|---|---|---|---|---|
| A1 | share 0.95 (OFF = product) | 4.3068e-5 | 392/0 | +13.07 ± 0.66 | yes | results-7w.txt:27,51-54 |
| A2 | share 0.95 (OFF), 30x15 | 2.0696e-5 | 392/0 (inferred: OFF@15/1e-3 = OFF@5/1e-3, 0/0) | +13.07 | yes | results-7w.txt:39-42,77 |
| A3 | share 0.95 (READER) | 2.2992e-4 | 72/0 | +2.40 ± 0.28 | yes | results-7w.txt:43-46 |
| A4 | share 0.95 (READER+J) | 1.1926e-4 | 72/0 | +2.40 ± 0.28 | yes | results-7w.txt:47-50 |
| A5 | S126 (READER) | 8.0241e-4 | 15/0 | +0.50 ± 0.13 | yes | results-7w.txt:60-63 |
| A6 | S126 (READER), 30x15 | 6.5248e-4 | 99.80 vs 99.30 (unpaired) | +0.50 | yes | results-7w.txt:56-59 |
| A7 | S194 (OFF) | 7.5604e-4 | 16/0 | +0.53 ± 0.13 | yes | results-7w.txt:65-68 |
| A8 | S126 (READER at 1e-3), W0 | 5.9469e-4 | 37/0 (whole +0.593) | +0.46 ± 0.08 | yes | results-7ab.txt:46; results-7aa-gaps.txt:31 |
| A9 | bridge 4 (READER), W0 | 8.0106e-4 | 31/0 (whole +0.501) | +0.39 ± 0.07 | yes | results-7ab.txt:48 |
| A10 | S126 (READER), W0.02 | 8.0241e-4 | 44/0 (whole +0.369) | +0.55 ± 0.08 | yes | results-7ab.txt:51 |
| A11 | S194 (OFF), W0.02 | 7.5604e-4 | 43/0 (whole +0.480) | +0.54 ± 0.08 | yes | results-7ab.txt:52 |
| A12 | S360 (OFF), W0 | 4.8212e-4 | 206/278 (whole −1.017) | −0.90 ± 0.28 | **no** | results-7ab.txt:50; gaps:39 |
| A13 | S360 (OFF), W0.02 | 5.5644e-4 | 9/497 (whole −7.002) | −6.10 ± 0.28 | **no** | results-7ab.txt:55,65 |
| A14 | S126 (READER, TS+J), W0 | 1.0649e-3 | 2/0 (whole +0.059) | +0.03 ± 0.02 | yes | results-7ac.txt:54 |
| A15 | bridge 4 (READER, TS+J), W0 | 1.3456e-3 | 22/1 (whole +0.333) | +0.26 ± 0.06 | yes | results-7ac.txt:55 |
| A16 | S126 (READER, TS+J), W0.02 | 1.0600e-3 | 5/0 (whole +0.070) | +0.06 ± 0.03 | yes | results-7ac.txt:56 |
| A17 | S194 (OFF, TS+J), W0.02 | 1.0525e-3 | 30/3 (whole +0.326) | +0.34 ± 0.07 | yes | results-7ac.txt:57 |

Units where the freed opening equals the product in year 0, so there is no comparison: S194 at W0 (gap 1.0510e-3), bridge 4 at W0.02 (1.0059e-3) and S360 under the reader (gap 0). See results-7aa-gaps.txt:33-38 and results-7ab.txt:47,49,53,54 (all 0/0).

**Table B: the margin as a dial (7v).** Here both the opening and the later margin change; 8,000 paths, 30x5, default weight 0.02. In 7v, "+J" means one policy for every world (results-7v.txt:279).

| # | Household | Arms (opening changes) | Gap | Realised | pts [mine] | Agrees? | Source |
|---|---|---|---|---|---|---|---|
| B1 | S194 OFF | 3e-4 against 1e-3 (0 → 2) | 7.5604e-4 | 42/2 | +0.50 ± 0.08 | yes | results-7v.txt:184,187 |
| B2 | S194 OFF+J | 3e-4 against 1e-3 | 5.7040e-4 | 98.838 vs 98.200 (unpaired) | +0.64 | yes | results-7v.txt:185,190-191 |
| B3 | S360 OFF | 3e-4 against 1e-3 | 5.5644e-4 | 9/497 | −6.10 ± 0.28 | **no** | results-7v.txt:140,145 |
| B4 | S360 OFF+J | 3e-4 against 1e-3 | 5.5098e-4 | 28.200 vs 34.313 (unpaired) | −6.11 | **no** | results-7v.txt:142,152-153 |
| B5 | share 0.95 OFF | 0 against 1e-4 (2 only at 0) | 4.3068e-5 | 962/4 | +11.98 ± 0.39 | yes | results-7v.txt:162,274 |
| B6 | share 0.95 OFF+J | 0 against 1e-4 | 4.5900e-5 | 964/5 | +11.99 ± 0.39 | yes | results-7v.txt:164,275 |
| B7, B8 | share 0.95 READER / READER+J | 1e-4 against 3e-4 | 2.2992e-4 / 1.1926e-4 | 95.513 vs 93.325; 95.600 vs 93.388 (unpaired) | +2.19 / +2.21 | yes | results-7v.txt:163-165,171-180 |
| B9, B10 | S126 READER / READER+J | 3e-4 against 1e-3 | 8.0241e-4 / 9.8301e-4 | 99.813 vs 99.263; 99.838 vs 99.300 | +0.55 / +0.54 | yes | results-7v.txt:79-81,86-95 |
| B11-B13 | S330 mix3 OFF / mix5 OFF (1e-4 vs 3e-4; to tier 3) / mix5 OFF+J (3e-4 vs 1e-3) | various | 2.9005e-4 / 2.9390e-4 / 3.0156e-4 | 77.900 vs 77.975; 77.925 vs 77.912; 77.862 vs 77.350 | −0.08 / +0.01 / +0.51 | ≈0, ≈0, yes | results-7v.txt:226-245 |

**Table C: the bad world only (runs at world 0's node).** These compare TS+J's de-risked opening with OPEN0. The table quantity here is world 0's like-for-like survival price, not the mixture gap.

| Unit | Mixture gap | World-0 price | Saved/lost | Realised [mine] | Price/realised | Source |
|---|---|---|---|---|---|---|
| bridge 4 R W0, 30x5, 1e-3, 4k paths | 1.3456e-3 | 0.482 | 48/4 | +1.10 ± 0.18 | 0.44 | results-7ad.txt:79,90 |
| S194 off W0.02, 30x5 | 1.0525e-3 | 0.849 | 55/10 | +1.13 ± 0.20 | 0.75 | results-7ad.txt:81,93 |
| S126 R W0, 30x5 | 1.0649e-3 | 0.318 | 19/0 | +0.48 ± 0.11 | 0.67 | results-7ad.txt:83,96 |
| bridge 4 60x5 / S194 30x15 | 1.2086e-3 / 1.2174e-3 | 0.454 / 0.960 | 38/0, 68/12 | +0.95, +1.40 | 0.48, 0.69 | results-7ad.txt:73-75,87-88 |
| 7ae at 1e-3, 8k: bridge 4 / S194 / S126 | as above | as above | 92/6, 111/21, 42/0 | +1.08, +1.13, +0.53 | 0.45, 0.75, 0.61 | results-7ae.txt:92,94,96 |
| 7ae at margin 0: bridge 4 / S194 / S126 | 9.3305e-4 / 6.8314e-4 / 7.7396e-4 | 0.351 / 0.561 / 0.230 | 49/13, 97/40, 34/3 | +0.45, +0.71, +0.39 | 0.78, 0.79, 0.59 | results-7ae.txt:93,95,97 |
| P (charge in both passes, margin 0), 16k paths: bridge 4 / S194 / S126 | 5.6751e-4 / 6.7057e-4 / 3.9851e-4 (on top of the charge) | 0.348 / 0.566 / 0.230 | 95/17, 202/78, 58/12 | +0.49, +0.78, +0.29 | 0.71, 0.73, 0.80 [mine] | results-P.txt:78,81,84,91,99,107 |

Worlds 1 and 2 at 30x5: prices 0.000 to 0.031, realised 0/0 except bridge 4's world 1 at 2/0 (results-7ad.txt:91-98). Node-weighted mixture realised: 0.217, 0.188, 0.079 against mixture prices 0.089, 0.162, 0.057 (results-7ad-beside.txt:4-6).

**Table D: held for life, not an opening (7x).** These are held tables (2/2 against 0/0 for life), comparing dT (the tables' difference) with dS (the realised difference):
- S126: 0.82 against +1.04 (83/0).
- S194: 3.37 against +3.48 (278/0).
- share 0.95: 0.615 against +2.99 (239/0).
- bridge 4: 1.21 against +1.43 (114/0).
- S360 off: +0.326 against −12.86 (0/1029), the **opposite sign** (results-7x.txt:81-90).

**Table E: arms whose tables differ and whose openings differ (confounded).**
- **7aa, TS+J against PRODUCT(-R).** S126 W0: product gap 5.9469e-4 keeps, TS+J 1.0649e-3 de-risks, 40/0. S126 W0.02 47/0; S194 W0.02 45/3; bridge 4 W0 38/1 (results-7aa.txt:69-95). On the reader units PRODUCT is the reader at 0.001, not the shipping default (deep-review-log.md:35).
- **7af/7ag, bundle (READER/TS+J at 1e-3) against SHIP** (gaps SHIP / bundle):
  - bundle de-risks, SHIP keeps: bridge 0 (2.0976e-4 / 1.0267e-3) 36/0; bridge 1 (2.7563e-4 / 1.0332e-3) 35/2; S194 (7.5604e-4 / 1.0525e-3) 45/3; S162 (4.8530e-4 / 1.0735e-3) 75/4 of 16,000; wealth x0.5 (3.7390e-5 / 4.5724e-3) 69/22;
  - bundle keeps, SHIP de-risks: wealth x2 0/5; S120 0/0.
  - Sources: results-7af.txt:79-109,147-162; results-7ag.txt:89-91,130.
- **7u, CAND (charge, margin 0) against SHIP (margin 0.001), seed 7013, 8,000 paths, W0.02.** Openings differ on 19 of 55 (18 of 55 at 0.01) [mine].
  - CAND de-risks where SHIP keeps (gaps SHIP / CAND): share 0.50 (1.6353e-4 / 2.4351e-4) 26/1; share 0.70 27/0; bridge 0 30/0; bridge 1 33/0; S194 (5.4317e-4 / 5.4648e-4) 33/4; S162 37/0; S066 18/0; S172 (9.7570e-4 / 1.1160e-3) 23/2.
  - S224: SHIP keeps on 8.0433e-4; CAND goes to tier 1 on **9.0786e-6**; 89/118, −0.36 ± 0.18 [mine].
  - S380: SHIP goes to tier 1 on 3.2695e-3; CAND keeps (gap 0); 150/163, −0.16 ± 0.22.
  - S364: CAND de-risks on 1.2931e-3; 0/31, −0.39 ± 0.07.
  - Misread by SHIP: share 0.95 1655/0; bridge 4+cost 312/0.
  - Sources: results-7u.txt:96-263. audit-7u.mjs:96-104 prints the tier at margin 0.001 then at margin 0 (charge applied), so SHIP's real opening is the first digit and CAND's the second. On S126 and bridge 4 both open 2/2.

**Table F: beyond the brief's file list (directly on point).**
- **NE-GRID B1, S380 under BASE at 60 points.** P (plan's tier) and D (de-risk) forced in year 0, 4,000 paths a world. D − P, table against realised: world 0 −0.861 vs −1.100 (81/125); world 1 +0.279 vs +0.625 (102/77); world 2 +0.362 vs +0.275 (26/15). The sign agrees in every world (results-negrid-b1.txt:88-91,154).
  - Mixture (weights 1/6, 2/3, 1/6) [mine]: table +0.10, realised +0.28 ± 0.23; under LOR +0.09 vs +0.24. S380's own 60-point opening is P (results-negrid-b1.txt:88).
  - S224 under BASE at 60, unpaired: table D−P −0.09, simulated +0.36 [mine] (results-negrid-b1.txt:118-121). Bridge 4 world 0: table +0.20, simulated +0.225 (:109).
- **XAS on S126, 6,000 paths (O100, PLAN.md:202).** BASE's gap 3.3623e-3; COV's −1.1808e-3 (prefers the other move). COV with BASE's opening survives 5971 against 5960 with its own, so COV's opening loses 11 paths (−0.18 pts), against its table's sign.
- **probe-tailm (tie tolerance, not an opening swap; 500 paths).** S130 at 1e-10: 6 saved / 8 lost (−0.4 ± 0.75 [mine]); share 0.90 1/0 (results-probe-tailm.txt:2-17).

Tables only (no swap): 7aa-gaps, o41 ("NOT BOUNDED" on S126 and S194: results-o41.txt:25,28), 7ai, 7am, o60, P-slices, 7t-deep, verdicts-whole.

**Summary by configuration** [mine; Tables A and B hold 26 rows with a gap below 1e-3]:
- **11 of 26 exceed 1 pt.** All are on bridge households whose product tables misread survival: share 0.95's SHIP table reads 0.0121 against 73.33 simulated, S360's 0.9429 against 34.30 (results-7af.txt:76,105).
  - Share 0.95 (A1-A4, B5-B8): 8 of 8 positive, same sign as the table, 100 to 6,300 times the gap.
  - S360 under off: 3 rows (A13, B3, B4) about −6.1, opposite sign; A12 is −0.90.
- **Calibrated households (S126 and bridge 4 under the reader; S194): 0 of 11 exceed 1 pt.** All 11 are +0.39 to +0.64, 4.8 to 11 times the gap (7.8 at most on paired rows). S330 (3 rows): about 0 twice, +0.51 once.
- **TS+J at the mixture:** no row below 1e-3. Gaps of 1.05e-3 to 1.35e-3 realised +0.03 to +0.34.
- **TS+J at margin 0, and P:** gaps below 1e-3 measured only at world 0's node, +0.29 to +0.78, same sign.

### Inferences
- Calibrated tables show consistent same-sign under-pricing, realised about 5 to 11 times the gap. That fits the "modelling inconsistency": the tables value staying as if switching were free next year, while the forward chooser holds the tier. The 28 Sep 13:56 review called it "the cleanest self-inconsistency measured so far" (deep-review-log.md:29). It is not flatness (realised ≈ gap ≈ 0), and not noise, since the signs never vary.
- Large differences of either sign come only from tables misread by tens of points: a table artefact. S380 at 60 points (Table F) and S330 look genuinely flat.
- The 7u rows agree: near-tie de-risks gain +0.2 to +0.4. The three unsettled households are within about 2 se of zero, except S364.

### Gaps
- No mixture-level opening swap exists for P, or for TS+J below 1e-3: node runs only.
- 7w used 3,000 paths. Several B rows are unpaired.
- No opening swap on S224 or S380 under the candidate at 30 points was found.

## 2. Verification of the brief's sections 2 and 3

### Takeaway
Most figures reproduce. Several are spliced from different measurements or quoted without the caveats the record attaches: item 1's 0.33 pts, item 5's attribution, item 6's materiality, section 3's "about 10 switches", the S126 40/0 and 47/0 gains, and "25 households".

### Cited Findings
- **Item 1.**
  - S126's 8.0e-4 is the **reader** arm's (8.0241e-4). The shipping product (OFF) has 9.9930e-3 on S126 and opens de-risked at every margin (results-7v.txt:78-79). The reader at 3e-4 removes the 0/44 harm (:86-87). S194, share 0.95 and S360's gaps are OFF figures (:140,162,184).
  - **Spliced:** "loses 497, saves 9" is the year-0 de-risk (7v OFF/3e-4 or 7ab freed at W0.02: results-7v.txt:145; results-7ab.txt:55), whose gap is 0.056 pts. "0.33 pts" is 7x's tables **held for life** (dT 0.3262), whose realised figure is 0/1029 (results-7x.txt:89). Off's S360 tables read 0.61 to 0.93% against 28 to 41% simulated (results-7x.txt:71-78; PLAN.md:157).
- **Item 2.**
  - "0.5% to 13%": the 0.55% is the tier state **alone** (S126, W0). TS+J runs 5.25% to 13.35% on S126 and S194, and 34.56% and 41.38% on bridge 4 (results-7aa-gaps.txt:6-13; PLAN.md:163). On the 25, TS+J's closest de-risks sit +2.67% to +7.35% above the margin [mine, results-7af.txt:80,83,101,109; results-7ag.txt:91].
  - "7 of 25 within 10%" is confirmed, but 2 of the 7 (share 0.50 and 0.90) sit **below** the margin and keep the plan's tier. "1 of 18 with the charge" is confirmed (results-P-slices.txt:30).
- **Item 3.** The bridge 4 and S194 flips are TS+J's at 1e-3: bridge 4 at 30x15 (9.9237e-4) and S194 at 60x5 (9.0137e-4) keep the plan's tier (results-7ad.txt:71,77). **Under P, bridge 4 and S194 open 2/2 at all three grids; only share 0.95 flips** (results-P.txt:145-147). The product's −14% and +28% are confirmed (results-7ad.txt:136-137).
- **Item 4.** 7am item 3 HELD (q 0.4 or more on 6 of 7: results-7am.txt:23). The **larger** sign-blind part is attributed to the margin or charge (the bundle's is several times P's, grade C); the B2/B1/C ranking covers only the smaller shared part, graded D in the 7aq review against C in the row (items/O67.md:5; PLAN.md:177).
- **Item 5.** 21.44% vs 6.41% confirmed (results-7ae.txt:139); by unit bridge 4 31.0/3.2, S194 18.1/15.1, S126 8.75/4.8 [mine, :140-142]. The 22:52 review: year 1 unselected nets 3.4 pts; "21.4% is bridge 4 plus selected years plus a grid-set parity" (deep-review-log.md:35); the margin-0 comparator is 0 by construction (PLAN.md:167). "Net 6.5" is P item 7 FALSIFIED (results-P.txt:148-149); the review after P found it **bridge 4's alone**, so the grid attribution is **grade C**, the reader's bridge read and the share axis co-equal (PLAN.md:167; results-P-slices.txt:4-15); 7ak: the share axis a's snap turns it (PLAN.md:163).
- **Item 6.** Measured: TS+J (de-risked) against OPEN0 (forced plan tier) on paths with the long-run shift fixed at the bad world's node, set against world 0's table price (its best move less its best plan's-tier move, survival, at the true year-0 position). Pooled over bridge 4 W0, S194 W0.02 and S126 W0 at 30x5: 1.648/2.725 = 0.60 at 1e-3; 1.142/1.550 = **0.737** at margin 0 (results-7ae.txt:100-101,133-134). Refinement 0.44 → 0.48, 0.75 → 0.69 (results-7ad-beside.txt:20-27); P 0.738 (results-P.txt:152). **Qualification:** "about 0.02 points a household: below materiality for a default" (deep-review-log.md:35); over the mixture, realised is 1.16 to 2.44 times the price (results-7ad-beside.txt:4-6).
- **Item 7.**
  - "36 of 220 (32 with the whole score beyond twice its standard error)" is confirmed (results-verdicts-whole.txt:232).
  - Direction [mine, :233-268]: 34 have survival down and whole up; 2 have survival up and whole down (7w, the freed opening against margin 0: :262-263).
  - The flipping term is the **estate**: +0.105 to +1.241, and −0.534 and −0.548 in the two.
  - 28 of 36 are margin comparisons. Openings differ only in S172 up's four OFF+J legs (tier 1 against OFF's tier 2: results-7v.txt:213-214). The S126, bridge 4 and S172-down legs open alike (:78-81,109,200). So item 7 is mostly not about openings.
- **Item 8.** 1.10 → 0.79 is confirmed (results-o60.txt:9). The 2 of 14 are bundle openings (bridge 0, S194); SHIP moved none; the reversed shift moved 3 (results-7ai.txt:24). The review: "not an opening lever" for the bundle (deep-review-log.md:51). Under P, the blend moved share 0.90 (results-7am.txt:22).
- **Item 9.** Source: O26, 7r at **16 points**, the reader's arm against off: S126 7/15, bridge 4 7/12, S366 16/24. The median shortfall is about a **third** on S126 and bridge 4 (9.7k, 9.4k) but a **fifth** on S366 (6.1k) (PLAN.md:244). At 30x5, OPEN0's lost paths ended under the pot on 30/30 (S194), 14/22 (bridge 4) and 5/5 (S126 W0.02), "inside one grid gap" (deep-review-log.md:31).
- **Item 10.** Two households, PCLSI arm, 30 points, 500 paths. Tax changed on 500/500 at every tolerance from 1e-10 to 1e-3, and S130's survival moved too (8 lost, 6 saved at 1e-10) (results-probe-tailm.txt:2-17). The tolerance is tieMargin ("WHEN THE TABLE CANNOT TELL, DO NOT PAY TAX NOW": solve.js:1415-1419), not the switch margin.
- **Section 3.**
  - "About 10 switches, half reversed" is 7t at **16 points** (10.52 and 10.02; 48% and 47%: results-7t-deep.txt:45-46). At 30 points: 5.00 and 4.76, 32% reversed (results-7v.txt:85,116); item 13 FALSIFIED (:303-305).
  - Freed opening: 9/497 confirmed (results-7ab.txt:65); the whole-score loss to TS+J holds on S126 (−0.335), S194's −0.234 is inconclusive (:61-63). Tier state alone: FALSIFIED (results-7y.txt:94).
  - **TS+J's 40/0 and 47/0 are against the reader at 0.001** (results-7aa.txt:156,166); against the shipping default the bundle on S126 is 3/0 (results-7af.txt:159; deep-review-log.md:35).
  - "21 of 25", grade B: confirmed (PLAN.md:160; results-7ac.txt:73). Charge size held, "flat from 0.0005 to 0.002" (items/7u.md:5). The reader's step: 7z shows S126 +0.000 (results-verdicts-whole.txt:228); grade B not found.
  - The panel: **55** households (7e's 25 plus a broad 30), not 25; "every one of 7e's 25 passes every item" (items/7u.md:172-173).
  - The grid: B1 read 11 Oct (PLAN.md:53); C launched 12 Oct 12:52 UK (runs.log); S380's 120-point solve 5046 s (PLAN.md:741). 60 points: "about 1.6-1.7 times today's product solve ..., outside gate 5's 25%; about 40 points fits ... (judged)" (deep-review-log.md:153). "1.5 times" not found.
  - "All grade C": roughly; O60 is grade A (computation), O41's premise D, O47's shares B.

### Inferences
- The brief understates two record-attached caveats that bear on the core question: the bad-node under-price is about 0.02 pts a household, and the bundle's S126 gain against the shipping default is 3/0, not 47/0.

### Gaps
- No source was located for "1.5 times a 60-point one", or for the grade B on the reader's step.
- Section 1's "0.03 to 0.04 switches" holds only for S126 and bridge 4. S194 switches 0.78 and share 0.95 0.18 (results-7v.txt:82,113,166,186).

## 3. The register rows and detail pages

### Takeaway
All 16 rows are open. Their causes are mostly grade C. The opening-rule gate lives in O67 and O44, and the proposed unifying family (O100) waits on the maintainer's answer to O97.

### Cited Findings (claim; grade; status; open question)
- **O17** (PLAN.md:147): F1 v2 costs survival where it reads accurately (narrowed to bridge 4); the reader's tiers reproduce its harm (grade B); tier lift grade D, NOT CHECKED. Open.
- **O24** (PLAN.md:150; items/O24.md:5): the reader's held tier buys the median estate; on S126 the estate offsets 70% of 0.500 pts lost, whole −0.347 ± 0.134 (grade C). At 30 points the harm is S126's alone (0/44), gone at 3e-4. Open: tail pricing (O97).
- **O26** (PLAN.md:244): 47% to 67% of lost paths end below the pot. Open; no grade seen.
- **O30** (PLAN.md:151): "The forward chooser's switch margin holds the opening tier for decades, and a near-tie decides that tier" (grade C, one seed). Open; the fix waits on 7ae and the maintainer.
- **O33** (PLAN.md:154): the product's own opening costs paths without the reader (S194 42/2; share 0.95 983; S360 −497). Open; the freed opening "stays out of any default under off".
- **O37** (PLAN.md:157): off's held tables favour S360's losing de-risk. Open.
- **O39** (PLAN.md:158): on S360 under off, the held plan's tier survives 565 to 24 with both in tier 0: the gap lies outside the tier (NOT CHECKED; grade C). Open.
- **O41** (PLAN.md:160): the tier state applies the rule per world, the chooser to the mixture. Premise grade D; the 21-of-25 decomposition grade B. Open.
- **O44** (PLAN.md:163): TS+J's opening rests on gaps just above the margin. Gate: "no opening rule is designed from P's item 6 until O67's own step and 7an read, and none from 30x5 solves with 6 share points". P's openings are no stable reference until O60 settles.
- **O46** (PLAN.md:164): the margin blocks a late re-risk (+0.305 to +0.317 of estate). Grade C; 7ac: the estate is the tables', not the opening's (grade B).
- **O47** (PLAN.md:165): de-risk bursts by year's parity; 21.44% against 6.41% (grade B shares, C mechanism); the grid sets the parity.
- **O48** (PLAN.md:166): node under-price 0.44 to 0.75 (pooled 0.61), grade C; at margin 0 0.74, item 1 FALSIFIED.
- **O49** (PLAN.md:167): the grid's own forward-against-cell disagreement is unmeasured by 7ae. P: net 6.52, "the grid's own" (grade B at one node), re-graded C by the review after P.
- **O60** (PLAN.md:171): tier returns against blend medians, 1.10 vs 0.79 (grade A as computation). Not an opening lever for the bundle; it moves P's openings where P's gap is small.
- **O67** (PLAN.md:177; items/O67.md): the bundle's year-0 gap is non-smooth. Open, PROVISIONAL (grade C); ranked B2 (interpolation and argmax kinks), B1 (snaps), C (reassembly). Gate: "its own step after 7an ... the reader on at 5 against 9 nested share points on the S126 members ..., and P with the interpolated allowance axis on S194, then S194 at 9 or 13 share points (nested with P's 5); **before any opening rule is written from a flip**; after 7u".
- **O100** (PLAN.md:202): proposed family "the chooser decides on score gaps below the tables' resolution" (grade C). Waits on the maintainer's O97 answer. XAS: BASE's best three moves are equal to four figures (1.0367e+0).
- **items/7u.md:** gate history; read 10 Oct; 7u-F re-scoped (:165-194).

### Inferences
- The "rule forbidding an opening rule designed from a flip" is a register gate (O67, O44) plus review STOPs, not a RULES.md rule.

### Gaps
- O26's grade was not seen. I read the heads and tails of the longest rows (O30, O41 and O44 run to 4 to 7 KB), not every middle sentence.

## 4. The deep reviews

### Takeaway
None of the eight entries gives numeric credences: no "credence" appears in any of them. Each gives an ordinal RANKED list. The ranking moved over time: from "the margin against free-switching tables" (27 Sep), to "the uncharged margin" (28 Sep), to "the tier state stores the margin's later holds" (30 Sep), to "decisions on gaps below resolution" (5 Oct).

### Cited Findings
- **27 Sep 02:07 (deep-review-log.md:9):** one mechanism, the 0.001 forward margin against free-switching tables: "every switch whose one-year gain is under 0.1 points is postponed for decades", and any small table change flips the tier held for life. "At margin 0 noise sets the tier wherever the table has no signal." RANKED: (1) procrastination; (2) per-world clairvoyance; (3) fixed world weights; (4) the score's trade; (5) grid and five worlds. "The margin harmless per decision": contradicted, grade B.
- **28 Sep 13:56 (:29):** the product's tables price their own opening at "a tenth to a fifth" of realised (whole +0.593, +0.501, +0.369, +0.480 against gaps 0.059 to 0.080; 4.6 to 10 times); the margin also blocks a late re-risk. RANKED for TS+J's opening: (1) the bad world's early years held in the plan's tier; (2) S194's end-pot cliff, numerical; (3) free switching with the margin; (4) clairvoyance; (5) no learning; (6) the reader's reference.
- **28 Sep 14:47 (:31):** TS+J's mixture price is right on S126 but 2.5 and 3.1 times low on bridge 4 and S194; the flips are end-pot near misses; at a node the table and run share the model. RANKED: (1) numerical error at the end-pot cliff; (2) three-world quadrature; (3) five return points; (4) off-grid choices against cells; (5) a tier-state bug.
- **28 Sep 19:09 (:33):** the grid is not the cause, but prices are "grid-noisy by more than the openings' distance to the margin (5-35%)". "At margin 0 every table here ... opens de-risked at every grid: the knife edge is the 1e-3 margin's alone." A hold can cost up to margin/w0 = 0.6 pts a year. RANKED: (1) the per-year margin's structure in the tier state; (2) the reader's reference; (3) axes; (4) quadrature; (5) a bug.
- **28 Sep 22:52 (:35):** at margin 0 every TS+J gap is under 0.001: "TS+J's de-risked opening therefore exists because its own tables charge STAY with the margin's later holds". Residual about 0.02 pts a household; RULE 3 FLAG. RANKED: (1) the uncharged margin; (2) the world-blind chooser; (3) axes; (4) the reader's reference; (5) a bug. Proposed P and 7af.
- **30 Sep 18:03 (:51):** the bundle's sign-blind part (7% to 34% of its gap) exceeds every knife edge's distance (2.6% to 9.6%); SHIP is smooth; clustering is TS+J's (7/25 vs PRODR 1/23, SHIP 0/25; grade C). RANKED: (A) the tier state stores the margin's later holds; (B) reassembly; (C) grid; (D) tier convention. STOP: "opening rules from single flips".
- **30 Sep 19:56 (:53):** (A) stays first; the grid rises "as a LEVEL cause" (−26% to +28%). STOP: "reading gap or opening differences inside the grid's own +-28% as findings; opening rules from 30x5 solves with 6 share points".
- **5 Oct 09:27 (:97):** S126's COV loss is one decision (the opening changed on 6000 of 6000; 13 of 14 lost in world 0; "O44's gap 6% above the margin"). Proposes the merged family "the chooser decides on score gaps below the tables' resolution". Premises: "ties go to menu order, not end pot (A)"; "switch margin 1e-3 against S126's 6e-5 headroom (C)"; bequest weight 0.02 never swept (D).

### Inferences
- From 28 Sep onward the reviews read the near-tie as **produced by** the margin's scale: the margin stored in TS+J's layers, and the free-switching tables against a holding chooser. They do not read it as a flat objective.

### Gaps
- There are no numeric credences to report for these eight entries.

## 5. The panel test (7u, read 10 Oct)

### Takeaway
- Outcome: 4 HELD (spending and the pooled floor at both weights) and 4 INCONCLUSIVE (survival and whole score at both weights).
- No harm was read. The inconclusive items rest on three broad households.
- Its follow-up, 7u-F, is held.

### Cited Findings
- **Setup:** 55 households, 8,000 paths, seed 7013, both arms on O60's blend-median tiers, CAND with e3pcls (results-7u.txt:93); candidate settings at PLAN.md:40.
- **Items** (results-7u.txt:208,264,320,377,501,557,613,670,711): survival (1, 5) INCONCLUSIVE; whole score (2, 6) INCONCLUSIVE; spending (3, 7) HELD; pooled floor over 47 (4, 8) HELD (at 0.02: 1937/854 of 376,000, +0.288, 0.261 to 0.316).
- **The three unsettled households** (results-7u.txt:253,260,261,546,553,554):
  - S224: 89/118, −0.362 (exact −0.717 to 0.002), margin 0.5; 87/103 at 0.01;
  - S364: 0/31, −0.388, "the unconditional interval does not pass"; SHIP survives 0.42%;
  - S380: 150/163, −0.163; 148/163 at 0.01.
  - Whole score: −0.412, −0.379, +0.272 (results-7u.txt:309,316,317).
- **Derived rows:** all eight HELD 0.57, any FALSIFIED 0.12, else 0.31; the outcome fell in "else" (items/7u.md:149-150,172-176).
- **7u-F** (PLAN.md:736): S224 and S380 at both weights, S364 reported only; 16,000 paths of seed 7014; power from 7u's counts under three stories, "never a carry".
  - Held by the maintainer on 11 Oct 11:03: "if the blend flattens S380, a fix changes the candidate the seed would test" (PLAN.md:56).
  - NE-GRID C keeps it held "in every branch": "the axis's size changes the candidate's policy" (predictions/diag-negrid-c.md:97).
  - S364 goes to NE-SPLIT (items/7u.md:188-194).

### Inferences
- S224's two arms open differently on a 9.1e-6 gap on top of the charge. S380's open differently because SHIP de-risks to tier 1 while CAND reads a gap of 0. Both are opening-decided comparisons with realised differences within about 2 se of zero.

### Gaps
- The deep review after 7u (10 Oct 04:17) was cited through items/7u.md, not read directly.

## 6. The rules any decisive test must meet

### Takeaway
A decisive test needs:
- a registered prediction with a derivation, exact tests against fixed margins with Holm, three outcomes, and a fair-test gate run twice;
- reserved seeds: tuning 7002, then held-out seed 7014, which is reserved for 7u-F;
- gate 5's 25% solve-time limit.

### Cited Findings
- **Settled** (RULES.md:268-294): the exact rule; produced by a script; checked against the author's error range; "the prediction and its falsifier were written before the run"; a fair test checked twice (section 3: RULES.md:295; gate lines such as results-7ab.txt:43).
- **The regimen:**
  - test (RULES.md:441-452): exact conditional McNemar, one-sided for harm; survival read by both the exact rule and the guarded unconditional interval;
  - margins (:453-456): 0.25 pts where the comparison arm survives 95% or more, 0.5 below, 0.1 pooled; from 11 Oct, a tenth of the arm's survival where smaller;
  - three outcomes (:457-459): no material harm, harm (Holm p below the error rate and a loss of at least the margin), inconclusive;
  - Holm and pooled summed cells (:460-472); one primary outcome (:473); power by simulation (:474); sequential looks (:476); replication on a second held-out seed or panel before a default changes (:478).
- **Seed registry** (RULES.md:480-484): 7001 search, 7002 tuning, 7003 Phase 4, 7004 second, 7005 selection, 7011 held out, 7012 K6, 7013 7u, **7014 7u-F**, 7101 'auto'. The launcher refuses a reserved seed elsewhere.
- **Carry rule** (RULES.md:600-608): a record carries only across the estate weight, "except where ... the setting moves a year-0 gap across the switch line (a flip)".
- **Gate 5** (PLAN.md:1377-1385): "a solve with the default as Phase 4 runs it takes at most 25% more time than today's product solve (the same household, settings and machine load)"; wall-clock, E2 on four cores counted; met on SIZE's four (×0.784).
- **Determinism:** no "bit for bit" rule found. Nearest: RULES.md:274 (bit-identity as a settling check); PLAN.md:1382 (E2 counts once "every table the same split and unsplit"); PLAN.md:653 (ternary dropped as not bit-identical).
- **The flip rule** is O67's gate (quoted in section 3; PLAN.md:177) plus O44's (PLAN.md:163).
- **escalation.md:** triggers (:11-26): repeated failure; a very difficult situation or the maintainer asks; a run over 2 hours with an 'else' row of 0.6 or more. Process (:28-56): brief, the maintainer's run, a fallback agent after an hour; the report is grade C "until a registered test repeats it", each claim checked, and it "replaces nothing". This brief is logged as pending (:63).
- **NE-GRID C:** registered 12 Oct on seed 7002, items 1-10 (predictions/diag-negrid-c.md:5-6,24-31); rows 0.03/0.06/0.21/0.07/0.21/0.41 (PLAN.md:741); P and D forced in year 0 (diag-negrid-c.md:19); launched 12 Oct 12:52 UK (runs.log). **No results-negrid-c.txt exists at ff13828: nothing has been read.**
- **Standing constraints** (noted, not judged): "No mortality, no annuities, no regime belief"; "The maintainer's own household is never a fixture" (PLAN.md:406-407,530).

### Inferences
- A decisive test runs on tuning seed 7002 first; seed 7014 is reserved for 7u-F. Any finer axis it recommends for a default must fit gate 5: 60 points already exceeds it, and about 40 fits (judged).

### Gaps
- No stated determinism rule was located.

## 7. Fixture households (for designing a test)

### Takeaway
- Five fixtures come from the generated library, research/policy-study/scenarios.mjs; the index sets the axes.
- Share 0.95 and bridge 4 are rebuilds of S126 (audit-7u.mjs:68-85).
- Every household is solved with a minimum end pot: its plan's own, else one year's target spend (results-negridc-floors.txt:1-5).

### Cited Findings
**The library:** index i maps to stage, mix, wealth, spend in nested loops (scenarios.mjs:196); household, flow, region, bequest and cash ISA cycle by i (:199-204). Plan tiers: pension "High Risk", ISA "Medium/High Risk" (:26). Pension access 58, state pension 68 (:157). Spend = rate × pot at retirement (:176-180). Solvency floor = wealth × bequest share (:167). 7u's audit sets floor spend 0.8 × target and guardrails off (audit-7u.mjs:117-122).

**Each fixture** (axes decoded from the index [mine]; values cited where printed):
- **S126:** early-bridge/pension-heavy/comfortable/light; single, rUK; age 56, retired at 55, 2-year bridge, plan to 95. £950k: pension 807.5k (85%), accessible 142.5k (ISA 76k, GIA 19k, cash 47.5k). Target 29,000; pot 29,000, one year (results-negridc-floors.txt:5; results-o41.txt:23). A £171k unassigned inheritance in 2030 [mine, scenarios.mjs:139-147].
- **share 0.95:** S126 with the pension at 95% (902.5k; liquid 47.5k pro rata); same age, spend and pot (29,000: results-o41.txt:29).
- **bridge 4:** S126 at age 54 (4-year bridge), pension 85% (audit-7u.mjs:85; floors:5).
- **S194:** near/ISA-heavy/lean/heavy; single, **Scotland**; age 55, salary £34,000 (12% pension, 6% ISA), retires at 60, so **no bridge**. £180k: pension 45k, ISA 108k, GIA 9k, cash 18k (cash ISA). Bequest floor **80,000** (results-o41.txt:26). A £32.4k inheritance in 2033. Spend 5.5% of the pot at 60; figure not printed.
- **S360:** long-bridge/pension-heavy/lean/light; single, rUK; age 50, retired, 8-year bridge. £180k: pension 153k, ISA 14.4k, GIA 3.6k, cash 9k. Spend about £5,500 [mine, not printed]; pot one year.
- **S380:** long-bridge/ISA-heavy/comfortable/heavy; single, Scotland; age 50, 8-year bridge. £950k: pension 237.5k, ISA 570k, GIA 47.5k, cash 95k (cash ISA). Target **52,500**; pot 52,500 (floors:2; results-7u-broad.txt:36).
- **S224:** near/balanced/comfortable/heavy; single, Scotland; age 55, salary £77,500, retires at 60, no bridge. £950k: pension 475k, ISA 285k, GIA 95k, cash 95k. Target **70,000**; pot **430,000 (6.14 years)** (floors:3; results-7u-broad.txt:27).
- **S364:** long-bridge/pension-heavy/modest/moderate; target 18,500; pot 205,000 (11.08 years) (floors:4).

S194 runs "off" (it has no bridge: items/O67.md:5). S126, bridge 4 and share 0.95 run as reader units; S360 has been run both ways.

### Inferences
- S224's pot of 6.14 years sits on a survival cliff. The external review and NE-GRID C item 9 test it (PLAN.md:51). Any decisive test on S224 inherits that confound.

### Gaps
- The target spends for S194 and S360 were not printed in the files read.
- The axes are decoded by my own arithmetic from scenarios.mjs. I did not execute the library.
