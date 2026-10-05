# Prediction: diag-xasr

- **Run:** `research/solver/batch-xasr.sh` - results/diagxasr/case0-2.txt and the per-read files (audit-xasr.mjs, one process a household: S370, bridge 4 and S126, each BASE and COV), read by reduce-xasr.mjs into results-xasr.txt
- **Kind:** test
- **Written:** 5 Oct, 19:08 UK, before the run; the design: the deep review after XAS (deep-review-log.md 5 Oct 18:48 UK) proposed XAS-R as the decisive test of its ranked causes of the year-before optimism (YB-COPY, YB-GRID) and of S126-BLEND (O105), and revised its third read the same evening (asked to define it: a supported node at each corner row's own support edge, (v-a), never re-solved; the plain read reported only; thresholds on the share of rep removed; S370 the only deciding household); the maintainer's standing go-ahead of 4 Oct covers it (non-locked research work)
- **Seeds:** 7002 tuning: XAS-R re-reads XAS's own reads (seed 7002, 2,000 paths a world) at the same states, and the reducer's gate holds BASE's and COV's reads and one-step values to XAS's saved files read for read. It chooses the next fix's design, which is tuning; no fix is read on it. Not 7005 (selection) and not 7004 (Phase 4's second seed).
- **Unmasking:** XAS-R removes no error from the product or the solve; it adds, at read time only, one exact supported node per corner row of the top share cell and asks how much of the year-before representation error (XAS's item 1) that removes. The known error it targets is the reader's flat copy of the continuation across the dead top share node (PR1, a year early: YB-COPY). A full removal there would leave S370's years 1-3 net pessimistic (O81's year-1 rep -1.28e-2 under BASE, -1.26e-2 under COV; results-derive-xas-review.txt): any fix's later prediction names that as unmasking, not harm. Item 2 reads which term of S126's opening score COV moves; S126's survival loss is not read as COV's harm here (O105).
- **Mechanism:** reader.js:116 "c[i] = c[g.index(ip, lo, it, ig, ic)]" (the flat copy at an unsupported node, the top share node in every bridge year with a bill) against audit-xasr.mjs's (v-a) node at the row's support edge (its survival from the chooser's move scored against the t + 1 tables, scoreMoves at the solve's 5 points, the node builder held to the solved table at the real 0.8 and top nodes of every row it uses); grid.js:389 "resilience and shortfall reads, are unchanged." for item 2 (the three reads with no reader construct, the dead node's s = b = 0 and h = failCost, solve.js l.1017-1024)
- **Plan section:** PLAN.md "XAS-R", "O99", "O105", "PR1", "PR10", "O80" and "7an"

## Question

Under COV, S370's reads in the year before each step pass back about a quarter of the step-year correction (slopes 0.31 and 0.21; results-derive-xas-review.txt) and carry XAS's representation error. Is that error the reader's flat copy across the dead top share node (YB-COPY: an exact supported node at each row's own support edge removes most of it) or the grid's six share nodes missing the step-year feature (YB-GRID: the edge node removes little)? And does COV move S126's opening score through the non-survival reads (S126-BLEND) rather than survival?

## Derivation

- **The sizes** (results-derive-xasr.txt section 1, XAS's files through their own gate): COV's mean rep in S370's years before the steps 1.248e-2 (year 2, 6000 reads) and 2.565e-2 (year 6, 5859 reads); per path sd 2.241e-2 and 2.213e-2. bridge 4's year 2 -2.796e-4 (sd 6.227e-4): no power there, reported only. S130 has no year-before read (its one step is year 1) and is left out.
- **What each outcome would say.** If the copied continuation is the error, a node that carries the exact continuation at the row's own support edge replaces the copy on [0.8, a*] and most of rep goes (YB-COPY, item 1 HELD): the fix is the reader's, a supported node per row in the years before a step (or the edge node carried there). If the year-before grid misses a feature that sits elsewhere in share or wealth, one more exact node at a* moves little (YB-GRID, item 1 FALSIFIED): the fix is resolution (7an's 11 share points, PR4) or the chooser's exact one-step read there. Item 2: if the non-survival reads carry most of S126's score rise, the opening flip is the estate and shortfall pull unmasked (PR8, O97), not survival.
- **The construct is exact where it is defined:** at a node, the reader's read reproduces the solved survival (reader.js, the node-reproduction check); (v-a)'s node is built by the cell loop's rule from the t + 1 tables, so at a* it is the table that a node there would have held. The audit refuses its run unless the builder reproduces the solved survival at the real 0.8 and top nodes of every row it uses (to 1e-9), the reader's c and R at a supported 0.8 node, and the solver's own read on every read (the replica, to 1e-12).
- **The checks, each failed on a planted fault first:** reduce-xasr.mjs's 37 planted checks (every outcome of both items reached; EDGES: a node check run on nothing, a read 1e-6 off XAS's, the BASE guard at its margin and past it, the two years reading opposite ways, a share exactly at 0.6 and at 0.3, a share past its threshold the test does not show, the two opening moves split by different terms, the rise carried by a fall in the shortfall term, the two moves at different BASE scores, the rise carried by the resilience term alone); mutations 36 of 36 caught (results-reduce-xasr-mutations.txt); the build check preflight-xasr.sh (runs.log 5 Oct 19:16 UK, through the launcher after its smoke run passed; 4 points, 3 paths a world) passed every self-check: S370 replica 36/36, nodes 144/144, cr 36/36, top 18/18; bridge 4 replica 18/18, nodes 48/48, cr 12/12, top 9/9; S126 terms 4/4 - so the node builder (the chooser's move scored per world) reproduces the solved survival at every real node it was held to.

## Prediction

- **Item 1:** stated as the registered direction only, HELD (YB-COPY): on S370 under COV, (v-a) removes at least 0.6 of rep in both years before a step. The derived credence leans INCONCLUSIVE (point: share 0.50; results-derive-xasr.txt section 4).
- **Item 2 HELD (S126-BLEND):** the resilience, bequest and shortfall terms carry at least 0.8 of both opening moves' score rise under COV (point: q 0.64).

## Falsified if

- **Item 1 FALSIFIED (YB-GRID):** both years read GRID (s at most 0.3, the HI test shown after Holm). INCONCLUSIVE: either year MID, or the years apart.
- **Item 2 FALSIFIED:** q at most 0.5 on both moves (survival carries at least half the rise). INCONCLUSIVE: otherwise, unless both moves read q >= 0.8.

## Fair-test table

Arms: BASE and COV, XAS's, at the same states (BASE's paths and moves: a fixed-policy re-read); the constructs (reader, plain, (v-a), (v-b)) are reads of the same tables at the same states.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | XAS's panel less S130: S370, bridge 4, S126 | the same | SAME (XAS's, chosen before it; S130 has no year-before read) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002, 2,000 a world | the same reads | SAME (both arms read at BASE's states on BASE's paths; the gate holds them to XAS's reads) |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points | 6, with the edge node a 7th slot in step years | TESTED (COV-B, as XAS) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader | the reader with readerTax | TESTED (XAS's COV arm); the read-time constructs (v-a), (v-b) and the plain read are measurements at the same states, not arms |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's read against the simulated) | the share of rep (read - ex5) each construct removes | the same | SAME (one definition for both arms and every construct) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per read, from the per-read files: year, world, path, top cell, and per arm read, ex5, rr, plain, va, vb, vaw, vbs; S126's opening terms per arm and move from its log.
- **Item 1 (primary; single look):** COV's reads on S370 in each year before a step (years 2 and 6), per path D = the sum of (read - va) and P = the sum of (read - ex5); s = sum D / sum P. Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000 sign flips from fixed seeds, one-sided) of mean(D - 0.3 P) above 0 (LO) and mean(0.6 P - D) above 0 (HI), Holm over the four. A year reads COPY when LO shows and s >= 0.6, GRID when HI shows and s <= 0.3, else MID. HELD when both years read COPY, FALSIFIED when both read GRID, else INCONCLUSIVE.
- **Item 2:** S126's opening, each arm's mixture score of BASE's and COV's opening moves split as score = surv + resil + beq - short (audit-xasr.mjs, checked to add up); per move the rise COV less BASE and q = (resil rise + beq rise - short rise) / score rise. Exact arithmetic at one state, no sampling: HELD when q >= 0.8 on both moves, FALSIFIED when q <= 0.5 on both, else INCONCLUSIVE.
- **Secondary (declared, decides nothing):** none.
- **Reported, not items:** every household, arm and year: rep and each construct's error and share removed, and the share of the top reads' weight (v-a) applied to; (v-b) by the 0.9 node's support (the review's corroboration: under YB-GRID within 0.15 of (v-a)'s whatever the support, under YB-COPY mainly where supported); each read's pass-through slope and the share of the gap to 0.93 it closes; bridge 4 throughout; S126's terms.
- **NOT SETTLED**, if any gate fails: the stamps; a household missing, repeated or not done; an arm's settings not taking; a ran line off XAS's unit; a self-check (replica, nodes, cr, top, terms) failed or run on nothing; a per-read file missing, unstamped or short; a read unclassed for the top cell; XAS's files failing their own gate; a read or ex5 off XAS's at the same path, world and year, or a different count; S126's opening moves or BASE's opening score off XAS's; THE BASE GUARD: under BASE, (v-a)'s mean (va - ex5) in either year above 5e-3 (the construct adding optimism where there is none to remove).
- **Declared choices, not derived:** the thresholds 0.6 and 0.3 (the review's revision; between them neither cause carries the error alone) and 0.8 and 0.5 for item 2; 5e-3 for the guard (a fifth of COV's year-6 rep); a path's reads summed (reads within a path share its state); (v-a) only where a* lies inside the top cell (else the row is unchanged).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | the year-before error is the flat copy: family 3's next fix is the reader's, a supported node at each row's edge in the years before a step (or the edge node carried there), registered against COV on S370 with S130 an identity control, its prediction naming O81's year-1 pessimism as unmasking; 7an after it | 0.28 |
| item 1 INCONCLUSIVE | MID: both the copy and the grid carry it; the fix design takes both (the edge node in the year before and 7an's resolution), each tested apart, no year-before fix registered on XAS-R alone. Years apart: the same, and the year that reads GRID named in the fix's prediction | 0.50 |
| item 1 FALSIFIED | the year-before error is the grid's: 7an's resolution test (11 share points) comes first and no year-before node is registered; the chooser's exact one-step read in the year before is the fallback | 0.22 |

## Decision fed

- **Item 1 HELD:** family 3's next fix is the reader's supported node at each row's edge in the years before a step; O99's YB-COPY confirmed; PR1's harm graded B a year early; 7an waits on that fix's test.
- **Item 1 FALSIFIED:** family 3's next step is 7an (PR4's resolution test) before any year-before node; PR1's year-before harm withdrawn.
- **Item 1 INCONCLUSIVE:** no year-before fix registered on XAS-R alone; the fix design names both parts and 7an runs beside it.
- **Item 2 HELD:** O105's S126-BLEND confirmed: S126's loss under COV is the non-survival reads' pull unmasked, and PR10 falls (a reader construct for those reads, or the dead node's values, goes into the fix's design); any COV arm in a candidate waits on that.
- **Item 2 FALSIFIED:** S126-BLEND withdrawn; O100's sub-resolution tie becomes the leading account of S126's flip.
- **Item 2 INCONCLUSIVE:** both stand; S126's loss is still not quoted as COV's harm.
- **In every branch:** coverage and readerTax stay off in the code; no product change; FORCE follows XAS-R.

## Provenance

- **The design:** the deep review after XAS (deep-review-log.md 5 Oct 18:48 UK: XAS-R, the reader's own read, the plain read and a no-copy read, the pass-through slope, S126's opening split by term) and its revision the same evening on the third read (asked to define it: the four candidate constructs rejected, (v-a) and (v-b) proposed, the plain read reported only, thresholds on the share of rep removed, S130 left out, S370 alone deciding); PLAN.md XAS-R.
- **The build:** audit-xasr.mjs; reduce-xasr.mjs (planted checks 37; mutations 36 of 36: results-reduce-xasr-mutations.txt); preflight-xasr.sh; derive-xasr.mjs; batch-xasr.sh.
- **Seen before registration (declared):** the build check's summary lines at 4 points and 3 paths a world, a grid too coarse to read: among them S370's BASE and COV va - ex5 (-2.7481e-2, -2.6299e-2) and bridge 4's (6.4893e-2, 6.4921e-2), the latter optimistic under BASE. Nothing was changed after seeing them; the BASE guard reads S370 alone as designed (bridge 4 decides nothing), and bridge 4's guard figure is reported beside item 1.
- **Changed from the review's first proposal:** the pass-through slope is reported, not the statistic (the review's revision); item 2 counts all three reads without a reader construct (resilience, bequest, shortfall), as O105's account names them, where the review's first wording named bequest and shortfall.

## Derivation script

- `derive: research/solver/derive-xasr.mjs > research/solver/results-derive-xasr.txt sha256 8752ccbd743e0ad7`
  (the sizes, the power, the cost, the credences)

## Point and interval

- **Item 1:** the share s (v-a) removes, about 0.50 (0.15 to 0.85): the expectation over the three stories of section 4.
- **Item 2:** q about 0.64 (0.2 to 1.0).

## Credence

- **Base rate, item 1:** 0.10 (it leans on the deep review's ranked cause YB-COPY: the deep-review record's rate, results-scorecard.txt KIND BASE RATES)
- **Base rate, item 2:** 0.10 (it leans on the deep review's story S126-BLEND: the same record's rate)
- **Item 1:** HELD 0.28, INCONCLUSIVE 0.50, FALSIFIED 0.22 (derived, results-derive-xasr.txt section 4: three stories - YB-COPY, YB-GRID, neither - weighted by the review's ranking shaded halfway to the record's rate 0.10, through the decision bands at twice the assumed spread)
- **Item 2:** HELD 0.49, INCONCLUSIVE 0.15, FALSIFIED 0.36 (derived, section 4: S126-BLEND's weight moved up from 0.10 to 0.45 on the observed sizes, the two moves taken as one draw)
- **Judged, item 1:** HELD 0.25, INCONCLUSIVE 0.50, FALSIFIED 0.25 (the author's judgement, written before the derivation: the review ranks YB-COPY above YB-GRID, 0.45 against 0.30, but its ranked causes have read as ranked in 1 of 19 items, and a share between 0.3 and 0.6 in either year, or the two years apart, reads INCONCLUSIVE)
- **Judged, item 2:** HELD 0.45, INCONCLUSIVE 0.30, FALSIFIED 0.25 (the author's judgement, written before the derivation: both opening moves' scores rise about 0.04 under COV while the year-1 survival reads move -3.52e-4, results-derive-xas-review.txt, which leaves little room for the survival term; against it, the opening's survival term integrates the year-1 table over the year's draw, not the reads along BASE's paths)
- **Kinds:** 1 ATTRIB; 2 ATTRIB

## Power

From results-derive-xasr.txt section 2, at an ASSUMED spread (grade C): if D - c P has a per-path sd equal to P's, item 1's tests tell s from 0.3 or 0.6 at a distance of 0.0715 (year 2) and 0.0348 (year 6) at 80% power after Holm, and at twice that spread 0.1430 and 0.0695. bridge 4's rep is two orders smaller with an sd larger than its mean: it decides nothing. Item 2 is exact arithmetic at one state: no power question.

## Budget line

3 jobs, about 4.6 core-hours at most (results-derive-xasr.txt section 3: XAS's measured solves and its read taken three times over, an upper estimate, grade C); one process a household, three at once, about 1.7 hours. Revised from the first household to land.

## Pre-mortem

- **First:** the node builder does not reproduce the solved table (the chooser's move at a node differs from the cell loop's joint choice, for instance where a move fails in one world); the audit refuses the run (nodes), the build check shows it first, and the mismatch is itself a finding.
- **Second:** a* often lies outside the top cell (the 0.8 node unsupported, or the whole row supported), so (v-a) applies to little of the read weight and removes little for that reason, not YB-GRID's; the share of the top reads' weight it applied to is reported beside item 1, and a small share there is named before item 1 is read as YB-GRID.
- **Third:** the BASE guard fails - an exact supported node raises BASE's reads above the one-step value - and item 1 is NOT SETTLED: the construct, not the copy, would then be what moves the reads.
- **Fourth:** item 2's terms move together (a rise in the estate read with a fall in the shortfall cost on the same paths), so q is near 1 whichever is the cause; the four terms are printed per arm and move, and the plan names which carries the rise.

## Changes after seeing results

None.
