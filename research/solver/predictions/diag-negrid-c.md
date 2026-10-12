# Prediction: NE-GRID C (has the wealth axis converged at 60 points, what is the under-read the finer axis leaves on S224, and what carries S364's over-read?)

- **Run:** `research/solver/batch-negrid-c.sh` - results/diagnegridc/case0-11.txt and the twelve jobs' files (audit-negridc.mjs), reduced by reduce-negrid-c.mjs into results-negrid-c.txt
- **Kind:** test
- **Written:** 12 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world (each path built from the seed and its index, so B1's paths), and its first 16,000 for P's runs on S380 and S224 at 120 points; 7u's held-out seed refused by the audit
- **Unmasking:** a finer wealth axis moves every table the chooser reads, so it may move each household's own opening (printed) and unmask another error the coarse axis hid - S224's under-read below its runs (O145) is the case in point; 12 shares and 15 return nodes each change S224's tables beside the axis; any fix this leads to names bridge 4, S126, S224 and the 95% share household in its own Unmasking, and reports its solve time against gate 5; item 9 removes S224's minimum end pot, which changes what survival counts (an end total of 0, not 430,000), so its table is read only against its own runs; item 10's support line changes every bridge-year read S364's reader makes and may move its own opening (printed)
- **Mechanism:** grid.js:123 "axes.W = logAxis(n1, spend * 0.1, spend * top(open.pen + open.isa + open.tax));" (PR21: the wealth axis's points set each cell's width); grid.js:124 "axes.a = linAxis(COV ? n2 - 1 : n2);" (PR20: the share axis, item 4 and item 5); solve.js:449 "const QUAD = opts.quadNodes && opts.quadNodes !== 5 ? gaussHermite(opts.quadNodes) : { nodes: NODES, weights: WEIGHTS };" (the return quadrature, item 3); solve.js:1595 "if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false," (the minimum end pot's cliff, item 9); reader.js:97 "if (p[i] >= ((g.reader && g.reader.line) || 0.5)) { sup[i] = 1;" (the support line, item 10)
- **Plan section:** PLAN.md "NE-GRID-C", O139, O141, O142, O143, O145, O146, O147, PR20, PR21, PR22; the deep review after NE-GRID B1 (deep-review-log.md 11 Oct 23:09 UK)

## Question

The deep review after NE-GRID B1's next step, NE-GRID C, given the maintainer's go-ahead (12 Oct): (1) does the wealth axis converge at second order - each table's move from 60 to 120 points a third of its move from 30 to 60, or less - on S380 and S224 under the candidate's read (S380 under LOR reported)? (2) does S224's under-read below its runs stay at 120 points on 16,000 paths a world (O145)? (3, 4) do 15 return nodes, or 12 shares, carry S224's 60-point under-read? (5, 6, 7) do 12 shares, 120 points, or the order reference carry S364's 60-point over-read (NE-BLEND's stage B, moved inside)? (8) does bridge 4 stay within 0.3 points at 120 points? Amended before launch on an external review (the maintainer, 12 Oct): (9) does S224's under-read go when its minimum end pot is removed (the review's cliff)? (10) does the reader's support line at 0.25 carry S364's 60-point over-read (its copy switch)?

## Derivation

- **The arms are research options or the candidate's own settings, inert by default:** `points` (120), `shares` (12), `quadNodes` (15, Gauss-Hermite) and `readerRef: 'order'` (NE-BLEND's ORDER arm); the candidate otherwise as B1's. One code change since B1, the amendment's two research options, inert by default: `readerSupportLine` (reader.js:97, 0.5 unless set) and READER_PROBE (grid.js, null unless the audit sets it); evidence: results-negridc-inert.txt (grade A: S364's tables at 4 points bit for bit the code before's at defaults and with 0.5 set, different at 0.25 with more reader nodes supported); the e3pcls identity test re-run and re-pinned on this code. S224's floor-free job by `minPotYears: 0` (solve.js:1949-1954, the product's way to none).
- **The minimum end pot:** every household is solved with one, its plan's own or else one year's target spend (solvePlan): S380 52500, bridge 4 29000, S224 430000 (6.14 years of spend), S364 205000 (11.08) (results-negridc-floors.txt); a path survives only with its end total at or above it, in the table and the runs alike (solve.js:1595); the audit checks each job's model context against these. B1's and NE-ROOT's runs carried the same: the same plans through solvePlan's rule, unchanged since 24 Sep (d7c5ed3, git log -L on solve.js's lines).
- **Each table is read against its own policy's runs** (the plan-auditor's MINOR 2 of 12 Oct 06:15 UK: the score weighs the estate, so a better policy may survive less; only a table against its own runs reads its error): P and D forced in year 0, the job's own moves after, on the seed's first 4,000 paths a world, P on 16,000 where registered.
- **B1's records:** the 30- and 60-point tables (items 1, 3, 4) and S224's 60-point runs (items 3, 4) are B1's files read behind B1's own gate (reduce-negrid-b1.mjs), not re-run.

## Prediction

- **Item 1 HELD:** the wealth axis converges at about second order: every counted cell's move from 60 to 120 points is at most 0.35 of its move from 30 to 60 (RG-WSLOW not).
- **Item 2 HELD:** S224's table stays under its 16,000-path runs at 120 points by more than half a point in a world, shown (RG-UNMASK's or RG-OTHER's error, not the paths').
- **Item 3 FALSIFIED:** 15 return nodes carry under a fifth of S224's 60-point under-read.
- **Item 4 FALSIFIED:** 12 shares carry under a fifth of it.
- **Item 5 FALSIFIED, item 6 FALSIFIED, item 7 FALSIFIED:** none of 12 shares, 120 points or ORDER alone carries half of S364's 60-point over-read (the review's S364 causes split three ways and more).
- **Item 8 HELD:** bridge 4 stays within 0.3 points at 120 points.
- **Item 9 HELD:** with no minimum end pot, S224's 120-point table lies within half a point of its 16,000-path runs in both worlds (the likeliest outcome by a hair: HELD 0.35 against FALSIFIED 0.34, results-derive-negrid-c.txt section 3).
- **Item 10 FALSIFIED:** the support line at 0.25 carries under a fifth of S364's 60-point over-read.

## Falsified if

- **Item 1 FALSIFIED:** every counted cell's move from 60 to 120 is half its move from 30 to 60 or more: the axis converges at first order or slower (RG-WSLOW), and no size can be read off two grids.
- **Item 2 FALSIFIED:** S224's 120-point table lies within half a point of its 16,000-path runs in worlds 0 and 1 at the point: no under-read left at 120 points.
- **Item 3 HELD / item 4 HELD:** 15 return nodes (3) or 12 shares (4) raise S224's 60-point table by at least half its under-read in every counted world.
- **Item 5, 6 or 7 HELD:** 12 shares, 120 points or ORDER lower S364's 60-point table by at least half its over-read in every counted world.
- **Item 8 FALSIFIED:** a world's interval for bridge 4 lies wholly outside 0.3 points at 120 points.
- **Item 9 FALSIFIED:** a world's interval for S224's floor-free table less its runs lies wholly below -0.5: the under-read stays without the cliff.
- **Item 10 HELD:** the line at 0.25 lowers S364's 60-point table by at least half its over-read in every counted world.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | S380 and S224 (deciding), S364 (B2), bridge 4 (control) | the same | SAME: tuning-seed households |
| 5 | The paths | the seed's first 4,000 paths a world (B1's) | P's on the first 16,000 for S380 and S224 at 120 points | TESTED (item 2's path luck): the first 4,000 of the 16,000 are B1's, the rest reported beside them |
| 10 | The minimum pot | each household's own (S224 430000) | S224's floor-free job: none (minPotYears 0) | TESTED (item 9): one job, read against its own runs |
| 13 | The risk tier | P (0,0) | D (2,2) | SAME across jobs: one pair a household at one level and tier base (pairTook) |
| 17 | The grid: points, shares, gain buckets | B1's 30 and 60 points, 6 shares, 5 return nodes | 120 points; 12 shares; 15 return nodes (one change a job) | TESTED: each job changes one of the three against B1's 60-point job (items 3-7) or B1's two grids (item 1) |
| 24 | The read and edge handling: the bridge read | BASE | LOR (S380 at 120 points), ORDER (S364 at 60), the support line at 0.25 (S364 at 60) | ONE ARM ONLY where named: LOR for item 1's read-space cells, ORDER for item 7, the line for item 10 |
| 28 | Every file made by the same code | one launch, one stamp | B1's files, one launch of their own | ACCEPTED: B1's records read behind B1's gate, on code that differs from C's by two research options inert by default, by construction (reader.js:97's literal 0.5 now the reader's line, 0.5 unless set; READER_PROBE a null-guarded read-only call the audit sets only around the year-0 score at P and resets) and by results-negridc-inert.txt (grade A with the construction) |
| 29 | The statistic | survival: the end total at or above the household's minimum end pot | item 9's job: at or above 0 | ONE ARM ONLY (item 9): its table and runs both count survival without the floor, read only against each other |
| 32 | The table's number is never the result | the gap between table and simulation is half the result, both printed | the same | ACCEPTED: items 1, 3-7 and 10 read the tables' moves (deterministic); items 2, 8 and 9 read a table against its own runs |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** each world's runs bounded by their exact (Clopper-Pearson) interval one-sided at ALPHA / 6 = 0.0083, ALPHA 0.05; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look; deterministic):** at P and D, worlds 0 and 1, for S380 and S224 under BASE, the candidate's read (S380 under LOR computed alike and reported: the plan-auditor's MINOR 3 of 12 Oct 08:12 UK): m1 = the table at 60 points less at 30 (B1's), m2 = at 120 less at 60; a cell counted where |m1| is at least half a point; HELD when every counted |m2| / |m1| is at most 0.35 (between second order's quarter and first order's half: the plan-auditor's 06:15 receipt); FALSIFIED when every one is at least 0.5; INCONCLUSIVE otherwise, or with none counted.
- **Item 2 (primary; single look):** S224 under BASE at 120 points, its table at P less P's runs on 16,000 paths a world, worlds 0 and 1: HELD when a world's interval lies wholly below -0.5; FALSIFIED when both worlds' points lie within 0.5 of 0; INCONCLUSIVE otherwise.
- **Items 3 and 4 (single look; deterministic):** S224's 60-point under-read (B1's table at P less its runs, worlds 0 and 1, counted where at least half a point under: -1.6173 and -0.8986, results-derive-negrid-c.txt section 1); the table at P's rise from B1's 60-point table under 15 return nodes (3) or 12 shares (4), each at 60 points: HELD when it rises by at least half the under-read in every counted world; FALSIFIED when by under a fifth in every one; INCONCLUSIVE otherwise, or with none counted.
- **Items 5, 6 and 7 (single look; deterministic):** S364's 60-point over-read (C's S364 at 60 points and 6 shares: its table at P less P's runs, worlds 0 and 1, counted where at least half a point over); the table at P's fall from that baseline under 12 shares (5), 120 points (6) or ORDER (7): HELD when it falls by at least half the over-read in every counted world; FALSIFIED when by under a fifth in every one; INCONCLUSIVE otherwise, or with none counted.
- **Item 8 (control; single look):** bridge 4 under BASE at 120 points, its own opening: HELD when every world's table less its runs is within 0.3 points at the point; FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise.
- **Item 9 (single look):** S224 under BASE at 120 points with no minimum end pot, its table at P less P's runs on 16,000 paths a world, worlds 0 and 1: HELD when both worlds' points lie within 0.5 of 0; FALSIFIED when a world's interval lies wholly below -0.5; INCONCLUSIVE otherwise.
- **Item 10 (single look; deterministic):** S364's 60-point over-read as items 5-7; the table at P's fall from that baseline under the support line 0.25, read as items 5-7.
- **The causes, by the registered map (printed '=> <cause> held / not / open'):** RG-WSLOW held on item 1 FALSIFIED, not on HELD; RG-PATHS held on item 2 FALSIFIED with the 120-point table more than half a point under the runs of the first 4,000 paths (B1's) in a world - the paths that showed the under-read - not on item 2 HELD; RG-UNMASK held on item 2 HELD with item 3 or 4 HELD, not on item 2 FALSIFIED; S364-SHARE and S364-REF held on items 5 and 7 HELD, not on FALSIFIED; S364-W held on item 6 HELD, not on item 6 FALSIFIED only where S364's 60-point over-read keeps at least half its 30-point one (NE-ROOT's, 3.6185 and 2.9066 in worlds 0 and 1, results-derive-negrid-c.txt section 1) in every counted world, since the axis may have carried most of it between 30 and 60 points (the plan-auditor's BLOCKING 2 of 12 Oct 08:12 UK); RG-FLOOR held on items 2 and 9 HELD (the under-read shown with the floor and gone at the point without it; its mechanism row 4's own test's), not on item 9 FALSIFIED; S364-COPY held on item 10 HELD, not on item 10 FALSIFIED only where the line at 0.25 moved at least half the 0.5 job's copied-corner weight at P out of copying in every counted world (the probe: the line's reach; the plan-auditor's BLOCKING 1 of 12 Oct 10:33 UK), since a line that does not reach S364's copied corners tests nothing of them; open otherwise. A cause the map leaves open is not settled by this test.
- **Reported, not items:** every job's tables, own opening, runs and reader copy counts; S380's and S224's 120-point P on the first 4,000 paths against the other 12,000; each household's 120-point policy against its 60-point one at P on B1's paths; every job's minimum end pot and support line; the probe's per-corner year-0 reads at P (S364's two 60-point jobs and S380's 120-point job: weight, chance, survival, c and R by supported, clipped and copied).
- **Declared choices, not derived:** 120 points (twice B1's fine grid: the review's design); 0.35 as the second-order line (the review's, between a quarter and a half); half a point as the smallest move, under-read or over-read read; half and a fifth as the carry lines; 16,000 paths for P on S380 and S224 (four times B1's); 15 return nodes and 12 shares (Phase V's sizes); the 0.3 control line (NE-ROOT's); S364's forced pair NE-ROOT's SS and SC (ai 12 and 14); 0.25 as the support line (the external review's); the floor removed by minPotYears 0; item 9's half-point line item 2's; half as the line's reach for S364-COPY's 'not'.

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 8 FALSIFIED | the finer axis moves the candidate's read of bridge 4: no axis fix as it stands; the deep review weighs the control | 0.03 |
| item 1 FALSIFIED (item 8 not) | the axis converges slower than second order: no size is chosen from two or three grids; the deep review re-ranks (an adaptive axis, a household's own size) before any panel test | 0.06 |
| item 1 HELD, item 2 not HELD (item 8 not FALSIFIED) | the axis converges at second order and S224's under-read is not shown at 120 points: the panel test (B1's row 1) registers next, the candidate at the size C supports (40, 45 or 60 points, its solve time against gate 5) against 30 points on 7e's 25 households | 0.21 |
| items 1, 2 and 9 HELD (item 8 not FALSIFIED) | the axis converges, and S224's under-read stays at 120 points but is gone at the point with its minimum end pot removed (O146): the end pot is where it sits, not yet why; before the panel test, the deep review after C designs the end pot's own test (whether its cliff on the wealth axis carries it: a wealth point on the floor, or the end pot read off the grid); the panel test then registers with that fix, or with O145 carried as the end pot's | 0.07 |
| items 1 and 2 HELD, item 9 not HELD (item 8 not FALSIFIED) | the axis converges and S224's under-read stays, not shown carried by its end pot: the panel test registers with O145 carried as a known under-read, its cause step beside it from items 3 and 4 | 0.21 |
| else | C's unsettled items named; the deep review after C designs the next step from these lines | 0.41 |

- **Waiver:** none needed: the chance the action changes is 0.59 (one less 0.41, the likeliest row), above a quarter

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1 HELD:** the wealth axis converges at about second order on S380 and S224 (grade B, one seed), so a converged value can be estimated from three grids; FALSIFIED: it does not, at these sizes. INCONCLUSIVE leaves it open.
- **Item 2 HELD:** S224's 120-point table lies under its own runs by more than half a point on 16,000 paths (grade B): O145 is a table error the axis does not remove; FALSIFIED: no under-read at 120 points. Which part carries it is items 3 and 4's (and others' if neither).
- **Items 3 and 4:** read with item 2 HELD, HELD names the part carrying S224's under-read (the table's move, deterministic; grade B) and FALSIFIED rules that part out for most of it; without item 2 HELD they read only how far each part moves the 60-point table, since B1's 60-point under-read is within noise in both worlds (-1.6173 and -0.8986, each interval reaching 0), and name no carrying part (the plan-auditor's BLOCKING 2 of 12 Oct 08:12 UK).
- **Items 5, 6 and 7:** HELD names the part carrying S364's 60-point over-read at grade B; FALSIFIED rules it out for most of it at 60 points - for item 6, the axis, only where the 60-point over-read keeps half the 30-point one; with no over-read counted at 60 points, the finer axis already removed it (reported, the deep review's to grade). They feed the near-edge reading (O132, O137), no row.
- **Item 8:** the control; its FALSIFIED decides row 1.
- **Item 9:** read with items 1 and 2 HELD, it decides row 4 against row 5: HELD shows S224's 120-point under-read gone at the point with the minimum end pot removed (grade B, one household; its survival counted at 0, not 430000: fair-test row 29), which a remaining half point can still read, so the cliff as the mechanism is row 4's own test's, not this item's (the plan-auditor's MINOR 2 of 12 Oct 10:33 UK); FALSIFIED rules the end pot out for most of it; without item 2 HELD it reads only whether the floor-free table matches its runs.
- **Item 10:** HELD names the support line (the copy switch) as carrying S364's 60-point over-read at grade B; FALSIFIED rules it out for most of it only where the line reached S364's copied corners (S364-COPY's map), and otherwise says only that the line at 0.25 does not move S364's table; it feeds the near-edge reading (O132, O137), no row.
- **In every branch:** no product change (the minimum end pot and the support line as they are); the candidate's settings unchanged; 7u-F held (the maintainer: the axis's size changes the candidate's policy); NS-PROP waits; the panel test is a registered test of its own.

## Provenance

- **The design:** the deep review after NE-GRID B1 (deep-review-log.md 11 Oct 23:09 UK), its NE-GRID C; the maintainer's go-ahead (12 Oct, the session: 'Go ahead with C (Recommended)'; PLAN.md's 12 Oct 06:07 row; the plan-auditor's PASS of 06:15 UK).
- **Amended before launch** on the plan-auditor's FAIL of 12 Oct 08:12 UK (review-log.md): item 8's print read item 5's result and would have crashed the read before the causes and the OUTCOME line - fixed, and the read moved into report() and run end to end by a planted check (BLOCKING 1); RG-PATHS on the first 4,000 paths against the 16,000, S364-W's 'not' only where the 60-point over-read keeps half the 30-point one, items 3 and 4 naming a part only with item 2 HELD (BLOCKING 2); item 1 on the candidate's read, LOR's cells reported (MINOR 3); a plant's label (MINOR 4); 107 planted checks, 79 of 79 mutants caught; re-derived (sha256 005327bdef7551fb).
- **Amended before launch a second time,** on an external review the maintainer shared (12 Oct; the maintainer's choice 'Amend C first (Recommended)', recorded in commit 0d38fe8, 09:22 UK): S224 at 120 points with no minimum end pot (item 9, RG-FLOOR), S364 at 60 points with the support line at 0.25 (item 10, S364-COPY), and the probe; the review's cliff-aligned share arm and three-grid C1 not added: item 5's 12 shares halve the share cell the cliff spans, and item 1 already reads three grids deterministically. Found while building it (declared): every household carries a minimum end pot in the solve, so the review's 'none' for S380 and bridge 4 read the plan's own setting, as did NE-ROOT's and NE-BLEND's printed minPot (O146, O147); setting the plan's floor to 0 alone would have left S224 one year's spend (solve.js:1953) - caught by the audit's floor check before any run, the job now by minPotYears 0; the inertness check's first run expected fewer copied nodes at 0.25 and failed on that expectation (the meter counts unsupported nodes only in rows with support; the check now reads supported nodes, inert-negridc.mjs); the derivation's first run after the amendment stopped on its own range check before printing a figure (items 5-7's draws left the line job's share unset; fixed, 5958613, the JUDGED block unchanged); the new draws move items 1-8's credences by at most 0.01 and every row by 0.01 or less (the old row 4's 0.29 now rows 4 and 5, 0.07 and 0.21).
- **Amended before launch a third time,** on the plan-auditor's FAIL of 12 Oct 10:33 UK (review-log.md): S364-COPY's 'not' needs the line's reach on the copied corners (BLOCKING 1; the reducer reads it from the probe); item 9's attribution reworded to what it shows (MINOR 2); fair-test row 28's grade names the construction. Seen before this amendment (declared): the third preflight's output, its probe lines included (the Eighth pre-mortem). The reducer: 137 planted checks, 111 of 111 mutants caught; the derivation unchanged (the map reads no new judged figure).
- **Changed from the review's design (declared):** P's runs on 16,000 paths, D's on 4,000 (the review's 16,000 for both P and D: item 2 reads P, so D's extra paths would buy no item; budget); S364's three arms read as each one's fall from C's own 60-point, 6-share S364 rather than against NE-ROOT's 30-point tables (B2's question asked at 60 points, as the review set it); the items' thresholds declared above; the cause lines a registered map of the items' outcomes (the review's process flag).
- **The derivation, after its first output (declared):** its first run set S224's 120-point table by both item 1's and item 2's stories at once, so item 1's power was wrong (a ratio of 0.8 read INCONCLUSIVE); fixed in code with the JUDGED block unchanged (d06a3d6), then re-derived. The 120-point budget is measured (results-negrid-c-measure.txt: S380's 120-point solve 5046 s, 1.47 times its 60-point; peak memory 1093980 kB).
- **The build:** audit-negridc.mjs, reduce-negrid-c.mjs (137 planted checks, each of items 1-10 reaching all three outcomes from its own plants, checked by the planted run itself, EDGES, every boundary planted exactly), mutate-reduce-negrid-c.py (111 of 111 caught, results-reduce-negrid-c-mutations.txt), derive-negrid-c.mjs, batch-negrid-c.sh, preflight-negrid-c.sh (with the audit's floor and line plants), measure-negrid-120.sh, inert-negridc.mjs, floors-negridc.mjs.
- **The preflight:** the fourth, through the launcher on 6236c12's build (runs.log 12 Oct 12:00 UK; the third, on the build before the 10:33 fix, passed alike at 10:48), passed; its lines, the figures not read:

```
SMOKE PASSED
A. planted (137): all read as they should
B. GATE: passed - the twelve jobs once and done at the registered settings (40 paths a world, P at four times where registered, scale 30, seed 7002); every job's settings in its solve's meta; every self-check passed (armTook, pairTook, forceIdentity on world 0's first 1,000 paths); no LOR read counted off the LOR job; every file the log's
B. solve seconds by job: BASE/P120S6Q5 191;BASE/P120S6Q5 143;BASE/P60S6Q5L25 174;ORDER/P60S6Q5 420;BASE/P120S6Q5F0 141;BASE/P60S12Q5 881;BASE/P60S12Q5 685;LOR/P120S6Q5 209;BASE/P120S6Q5 151;BASE/P120S6Q5 180;BASE/P60S6Q15 367;BASE/P60S6Q5 175;
C. the plant arm: refused (exit 3; audit-negridc: S364 ORDER/P60S6Q5: the job's settings did not take)
C. the plant pair: refused (exit 3; audit-negridc: S364 ORDER/P60S6Q5: the forced pair is not the registered tiers at one level and tier base)
C. the plant force: refused (exit 3; audit-negridc: S364 ORDER/P60S6Q5: forcing CAND's own opening did not reproduce its run)
C. the plant floor: refused (exit 3; audit-negridc: S224 BASE/P120S6Q5F0: the job's settings did not take)
C. the plant line: refused (exit 3; audit-negridc: S364 BASE/P60S6Q5L25: the job's settings did not take)
preflight done 12:44 UK
```

  The small grids (every job at 4 wealth points) put 12 shares at 4.79 (S224, 685 s against 143) and 5.03 (S364, 881 against 175) times the 6-share solve, judged four; 15 return nodes at 2.57 times (367 against 143), judged three; and ORDER at 2.40 times BASE on S364 (420 against 175), judged the same. At those ratios the budget rises by about two and a half core-hours and no job nears its 10 hours, the longest (S364 at 12 shares) about 5 h: judged from the small grids, NOT CHECKED at the registered ones.
- **Seen before registration (declared):** the external review's text; results-negridc-floors.txt and results-negridc-inert.txt; B1's results in full and its files; stage A's and NE-ROOT's; the deep review's figures and its scratch reads; the derivation's first output (item 1's power wrong, as above).

## Derivation script

- `derive: research/solver/derive-negrid-c.mjs > research/solver/results-derive-negrid-c.txt sha256 2653843becde8a43`
  (B1's 30- and 60-point tables and S224's 60-point runs behind B1's gate, NE-ROOT's S364 timings behind its gate, the power of items 1-10 through reduce-negrid-c.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from the measurement and the logs)

## Point and interval

- **Item 1:** 0.4043, the largest counted cell's |move 60 to 120| / |move 30 to 60| (results-derive-negrid-c.txt section 3); 80% interval 0.2693 to 0.5785
- **Item 2:** -1.3301, points, S224's 120-point table less its 16,000-path runs in the lower world; 80% interval -2.7040 to 0.0120
- **Items 3-7 and 10:** none: read by the tables' moves
- **Item 8:** none: a control, read by its point and interval
- **Item 9:** -0.8383, points, S224's floor-free 120-point table less its 16,000-path runs in the lower world; 80% interval -2.1895 to 0.1802

## Power

From results-derive-negrid-c.txt section 2 (1,000 draws a cell through reduce-negrid-c.mjs's own items(); B1's records as they are):

```
  item 1, each cell's ratio about 0.25 (+-0.1): HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
  item 1, each cell's ratio about 0.35 (+-0.1): HELD 0.0090 INCONCLUSIVE 0.9910 FALSIFIED 0.0000
  item 1, each cell's ratio about 0.5 (+-0.1): HELD 0.0000 INCONCLUSIVE 0.9870 FALSIFIED 0.0130
  item 1, each cell's ratio about 0.8 (+-0.1): HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
  item 2, S224's 120-point table 0 points off its 16,000-path runs: HELD 0.0000 INCONCLUSIVE 0.3040 FALSIFIED 0.6960
  item 2, S224's 120-point table -1 points off its 16,000-path runs: HELD 0.2980 INCONCLUSIVE 0.6970 FALSIFIED 0.0050
  item 2, S224's 120-point table -2 points off its 16,000-path runs: HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
  item 9, S224's floor-free 120-point table 0 points off its 16,000-path runs: HELD 0.7000 INCONCLUSIVE 0.3000 FALSIFIED 0.0000
  item 9, S224's floor-free 120-point table -1 points off its 16,000-path runs: HELD 0.0080 INCONCLUSIVE 0.6850 FALSIFIED 0.3070
  item 9, S224's floor-free 120-point table -2 points off its 16,000-path runs: HELD 0.0000 INCONCLUSIVE 0.0010 FALSIFIED 0.9990
```

Items 1 and 3-7 read deterministic table moves, so their outcomes follow the story with no sampling noise; item 1 needs every counted cell (seven of eight under BASE: S224's P world 0 moved 0.3969, under half a point) on one side, so a ratio near 0.35 reads INCONCLUSIVE. Item 2 separates no under-read (FALSIFIED 0.70) from two points of it (HELD 1.00); one point reads HELD 0.30. Item 9 reads no under-read HELD 0.70 (its HELD needs both points within half a point, so noise alone leaves 0.30 INCONCLUSIVE) and two points FALSIFIED 1.00; one point reads FALSIFIED 0.31. Item 10 reads as items 5-7 (the same rule on the line's job).

## Budget line

From results-derive-negrid-c.txt section 4 (the measurement and B1's and NE-ROOT's logs; 12 shares taken as four times the 6-share solve, 15 return nodes as three times the 5, judged, NOT CHECKED until the preflight): in all about 31.50 core-hours, the twelve jobs four at a time, about 7.88 h wall at the least; the 120-point solve 1.47 times the 60-point; peak memory at 120 points 1093980 kB. Each job may run 10 hours (the batch's timeout).

## Pre-mortem

- **First: the finer axis changes the policy.** Each 120-point table is read against its own policy's runs; item 1 reads tables alone, so a policy change between grids moves no item but is reported.
- **Second: item 1 needs every counted cell on one side.** A convergence that is second order on S380 but slower on S224 reads INCONCLUSIVE, and the cells are printed; LOR's cells are reported only.
- **Third: the 12-share and 15-node solves are judged** at four and three times the 6-share, 5-node solve; the preflight times the small grids, and a job past 10 hours is cut off and refused by the gate.
- **Fourth: S364's over-read at 60 points may already be under half a point** (the finer axis removing most of it): items 5-7 then read INCONCLUSIVE with none counted, which is itself a reading for the deep review.
- **Fifth: B1's records are reused,** behind B1's gate; a defect in them reaches items 1, 3 and 4.
- **Sixth: the floor-free and line jobs may move their households' own openings;** item 9 reads its table against its own runs and item 10 a table move, the openings printed.
- **Seventh: item 9 HELD without item 2 HELD names nothing** (no under-read shown to carry): the map leaves RG-FLOOR open, and item 9's HELD needs both worlds within half a point at the point, so noise alone reads a third of true nulls INCONCLUSIVE.
- **Eighth: the line at 0.25 may not reach S364's copied corners.** The third preflight's probe lines (a thirtieth of the wealth points; not figures) put S364's corners at P at chance 1 or 0 to six places, and the line at 0.25 moved none of the copied weight there; if the registered grid reads alike, the line's reach is under half and S364-COPY stays open whatever item 10 reads, and a test of the copy rule itself (a copied corner's c from its own survival, or none) is the deep review's to design.

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories through the decision bands. No cap taken from the scorecard.

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.70 (18 of 25), ATTRIB 0.53 (28 of 53), SIZE 0.53 (24 of 45), CTRL 0.71 (11 of 15), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.29 (7 of 26).
Items 1-7 rest on the review's ranked causes, so each starts from 0.29; the derivation mixes the receipt's cause credences through the JUDGED stories and section 2's power, which puts item 1 at 0.51 (second order judged likely outside RG-WSLOW, as B1's own moves suggest), item 2 at 0.55 (RG-UNMASK's 0.50 keeping the under-read), items 3 and 4 at 0.24 each (RG-UNMASK split three ways), and items 5-7 at 0.29, 0.29 and 0.13 (the S364 causes, with a 0.15 chance no over-read is left to read). Item 8 starts from CTRL's 0.71 and moves to 0.83: bridge 4 held at 60 points under BASE. Items 9 and 10 (the amendment) start from 0.29 too, item 9 on the external review's cause and item 10 on S364-COPY; the derivation puts item 9 at 0.35 (the floor judged to carry the under-read with a chance of 0.3 to 0.4 under every cause but RG-PATHS) and item 10 at 0.19.

- **Base rate, item 1:** 0.29 (a deep review's cause: RG-WSLOW against second order)
- **Base rate, item 2:** 0.29 (a deep review's cause: RG-UNMASK)
- **Base rate, item 3:** 0.29 (RG-UNMASK's quadrature part)
- **Base rate, item 4:** 0.29 (RG-UNMASK's share part)
- **Base rate, item 5:** 0.29 (S364-SHARE)
- **Base rate, item 6:** 0.29 (S364-W)
- **Base rate, item 7:** 0.29 (S364-REF)
- **Base rate, item 8:** 0.71 (CTRL)
- **Base rate, item 9:** 0.29 (a review's cause: RG-FLOOR, the external review's)
- **Base rate, item 10:** 0.29 (S364-COPY)
- **Item 1:** HELD 0.51, INCONCLUSIVE 0.43, FALSIFIED 0.06 (derived, results-derive-negrid-c.txt section 3)
- **Item 2:** HELD 0.54, INCONCLUSIVE 0.31, FALSIFIED 0.15 (derived)
- **Item 3:** HELD 0.24, INCONCLUSIVE 0.18, FALSIFIED 0.57 (derived)
- **Item 4:** HELD 0.24, INCONCLUSIVE 0.19, FALSIFIED 0.58 (derived)
- **Item 5:** HELD 0.29, INCONCLUSIVE 0.29, FALSIFIED 0.42 (derived)
- **Item 6:** HELD 0.29, INCONCLUSIVE 0.29, FALSIFIED 0.42 (derived)
- **Item 7:** HELD 0.13, INCONCLUSIVE 0.31, FALSIFIED 0.56 (derived)
- **Item 8:** HELD 0.83, INCONCLUSIVE 0.14, FALSIFIED 0.03 (derived)
- **Item 9:** HELD 0.35, INCONCLUSIVE 0.31, FALSIFIED 0.34 (derived)
- **Item 10:** HELD 0.19, INCONCLUSIVE 0.30, FALSIFIED 0.50 (derived)
- **Judged:** none (the judged inputs are derive-negrid-c.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 ATTRIB, 5 ATTRIB, 6 ATTRIB, 7 ATTRIB, 8 CTRL, 9 ATTRIB, 10 ATTRIB

## Changes after seeing results

None.
