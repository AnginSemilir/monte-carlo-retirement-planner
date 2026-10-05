# Prediction: diag-edge

- **Run:** `research/solver/batch-edge.sh` - results/diagedge/case0-2.txt and the per-path files (audit-edge.mjs, one process a household: S130, S128 and S370, each SNAP, S-LO, S-HI, S-INT, PCLSI, P-LO and P-HI), read by reduce-edge.mjs into results-edge.txt
- **Kind:** test
- **Written:** 5 Oct, before the run (its time is its registering commit's, git log). The design: O101's root-cause step, EDGE-SPLIT, proposed by the deep review after HYB (deep-review-log.md 5 Oct 11:50 UK) and named as O101's gate (PLAN.md O101)
- **Seeds:** 7005 selection: EDGE-SPLIT splits how HYB's and ADOPT-PI's survival gain is put to the maintainer with the axis decision, on their own seed and 6,000 paths, so the SNAP and PCLSI arms repeat HYB's runs and the reducer's gate holds them to HYB's per-path files path for path (the identity: grid.js's pclsSeg, default off, is inert on the unit), and HYB's own HYB arm joins the reading on the same paths. Not 7004 (Phase 4's second seed) and not 7002 (tuning). The product's 'auto' risk-above rule reads its own seed 7101 in the shared code, as in every solver run.
- **Unmasking:** EDGE-SPLIT removes no error; it removes the snap's cliff on one segment of the allowance axis at a time, on each table, to say which of the snapped read's two edges carries the pause each table makes steepest (O101: on PCLSI's tables HYB's pause sits at 0.25, on SNAP's at 0.75). The pairs: P-LO against P-HI on PCLSI's tables (item 1), S-HI against S-LO on SNAP's tables (item 2), each split arm against its table's full read (PCLSI, S-INT) and snapped read (HYB, SNAP) beside them. No arm is a candidate; a harm under a split arm is not read.
- **Mechanism:** grid.js:685 "return g.pclsSeg === 'lo' ? pf <= g.pcls[1]" (the segment on which the allowance read is interpolated) against grid.js:256 "const cb = !pclsOnSeg(g, pf)" (locateVec's read, snapped off the segment: the nearest of the three buckets, so the cliffs at 0.25 and 0.75); audit-edge.mjs sets pclsInterp and pclsSeg on every grid the forward run reads after the solve (gridsOf). How often each edge holds per household and arm is the reported flat-years line (reduce-edge.mjs flatYears; HYB's in results-derive-hyb-edges.txt section 1)
- **Plan section:** PLAN.md "O101", "O83", "O88", "O89" and the deep review after HYB

## Question

On PCLSI's tables, does interpolating the read below the middle bucket (removing the snap's 0.25 edge) carry more of PCLSI's survival gain over HYB than interpolating it above (removing the 0.75 edge) - and on SNAP's tables, the reverse?

## Derivation

- **The two edges.** The snapped read takes the nearest of the buckets 0, 0.5 and 1, so the value jumps at 0.25 and at 0.75 of the allowance used; a chooser below a jump holds there (O83). Under SNAP's tables the hold sits at 0.75 (S130's flat years with the pension live in [0.6, 0.75) 6.86, in [0.15, 0.25) 0.00); read through the snap, PCLSI's tables hold at 0.25 instead (HYB: 6.08 in [0.15, 0.25), 0.04 in [0.6, 0.75)) (results-derive-hyb-edges.txt section 1).
- **What each cause says** (the deep review's ranked causes for O101): EDGE - on PCLSI's tables the 0.25 edge binds, so P-LO recovers PCLSI's gain over HYB and P-HI does not (item 1 HELD), and on SNAP's tables the 0.75 edge binds, so S-HI recovers it and S-LO does not (item 2 HELD); WITHIN - no allowance cost inside a bucket, each split arm about halfway (SPLIT); TABLES - the gain is the tables' own, nothing ties it to an edge.
- **The checks, each failed on a planted fault first:** reduce-edge.mjs's 22 planted checks (every outcome of both items reached; EDGES named) and 22 of 22 mutations caught (results-reduce-edge-mutations.txt); grid.js pclsSeg's 7 checks (solver-gridfidelity.test.mjs section F) with 5 planted faults each caught, the four in-place ones in mutate-grid-pclsinterp.py; the preflight (preflight-edge.sh, preflight-parse-edge.mjs): the 3 jobs at 4 points and 20 paths through the reducer's gate and THE IDENTITY against HYB's own preflight files, with 6 planted faults refused - to pass through the launcher before launch.

## Prediction

- **Item 1 HELD:** on S130 P-LO saves more paths than P-HI - the low edge carries more of PCLSI's gain over HYB than the high edge (a direction; it does not by itself separate EDGE from WITHIN, which the low edge's share, reported, speaks to).
- **Item 2 HELD:** on S130 S-HI saves more paths than S-LO - the high edge carries more of the interpolated read's gain on SNAP's tables than the low edge.

## Falsified if

- **Item 1 FALSIFIED:** S130 reads HI (mean(P-LO - P-HI) below 0, shown after Holm). INCONCLUSIVE: SPLIT.
- **Item 2 FALSIFIED:** S130 reads LO (mean(S-HI - S-LO) below 0, shown after Holm). INCONCLUSIVE: SPLIT.

## Fair-test table

Arms: SNAP, S-LO, S-HI, S-INT, PCLSI, P-LO and P-HI on each household, with HYB's HYB arm by the identity, paired by path; every unit at the library's death tax 0 and tie margin 0.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S130, S128 (HYB's two households with the pause at the low edge under HYB) and S370 (reported) | the same | SAME (HYB's panel; declared in Seeds) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7005, 6,000 paths | the same paths | SAME (paired; the gate holds one pathsum across a household's units, and HYB's paths path for path through the identity) |
| 17 | The grid: points, shares, gain buckets | 30 points; the allowance axis 0, 0.5, 1; tables solved snapped (SNAP's) or interpolated (PCLSI's) | the forward read snapped, interpolated on the lower segment, on the upper segment, or throughout | TESTED (the read's segment, on each table) |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | grid.js with pclsSeg (fb408d9) | HYB's files, made before it | ACCEPTED (pclsSeg defaults to null, so the SNAP and PCLSI arms read as before; the reducer's identity holds them to HYB's per-path files path for path, and refuses otherwise) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per household and arm, each path's survival (0 or 1), lifetime tax and terminal net, from the per-path files.
- **Item 1 (primary; single look):** on S130 and S128, per path y = P-LO - P-HI in survival; Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000 sign flips from fixed seeds, one-sided) of mean(y) above 0 (LO) and below 0 (HI), Holm over the 4; SPLIT otherwise. HELD when S130 reads LO; FALSIFIED when S130 reads HI; else INCONCLUSIVE. S128 a scored leg (LEGS line); S370 reported at raw p.
- **Item 2:** the same on y = S-HI - S-LO with its own Holm over 4: HELD when S130 reads HI; FALSIFIED when S130 reads LO; else INCONCLUSIVE. S128 a leg; S370 reported.
- **Secondary (declared, decides nothing):** the low edge's share of PCLSI over HYB and the high edge's of S-INT over SNAP; S-INT against PCLSI (the tables' own part) and against SNAP; each pair's survival, tax and net change with its se.
- **Reported, not items:** flat years with the pension live by the used share's band, per arm.
- **NOT SETTLED**, if any gate fails: the stamps; a unit missing, repeated or not done; a ran line off HYB's settings or the arm's tables, read or segment, or at a tie margin or death tax other than 0; a household's units on different paths or access lines; a per-path file missing, unstamped or off its sum line; the SNAP or PCLSI arm off HYB's per-path file on any path, or HYB's files failing their own gate.
- **Declared choices, not derived:** S130 as the deciding household (the largest gain, HYB's pause at the low edge plainest); S128 as a leg (its gain smaller); the middle bucket as the segments' boundary (where both readings agree).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | the low edge carries more of PCLSI's gain on its own tables (grade A for the direction); O101-EDGE is settled held only if the low edge's share (secondary, reported) is 0.7 or more, and then at grade B; a share under 0.7 leaves EDGE and WITHIN unseparated and O101 open; PCLSI goes to the maintainer as ending the snap's pause at the edge its tables make steepest | 0.38 |
| item 1 INCONCLUSIVE | the gain is not shown to lean to either edge: O101 stays open, WITHIN (no allowance cost inside a bucket) read from the split arms' flat years; PCLSI goes with the read's attribution only (grade A from HYB) | 0.34 |
| item 1 FALSIFIED | the high edge carries more of the gain on PCLSI's tables, against HYB's traces: the trace measures (derive-hyb-edges.mjs) are re-checked against the split arms before any mechanism is put; review-causes.md settles O101-EDGE not held | 0.28 |

## Decision fed

- **Item 1 HELD:** the direction held; O101-EDGE held only with the low edge's share 0.7 or more (grade B), else O101 open with EDGE and WITHIN unseparated; PCLSI is put as ending the snap's pause.
- **Item 1 FALSIFIED or INCONCLUSIVE:** O101 open; PCLSI is put with the read's attribution alone.
- **Item 2 HELD:** on SNAP's tables the 0.75 edge carries more of the interpolated read's gain - the shipping default's survival cost is its pause at the 0.75 edge: O83 confirmed at grade A (the shipping default's own tables; the plan-auditor's BLOCKING 1 of 5 Oct 12:22 UK: O83's grade A rests on this item, not item 1), and O83's product finding goes to the maintainer.
- **Item 2 FALSIFIED:** on SNAP's tables the low edge carries more, against SNAP's 6.86 flat years at [0.6, 0.75) (results-derive-hyb-edges.txt): O83's hold is not the shipping default's survival cost; O83 is put back to grade C and its product finding withheld until the flat years per split arm say where the gain comes from.
- **Item 2 INCONCLUSIVE:** O83 stays at grade B; its product finding goes as a hold the traces show, with no survival cost settled; S-INT against SNAP (secondary) is O88's separating arm, reported.
- **In every branch:** pclsInterp and pclsSeg stay off in the code until the maintainer decides; no product change; PR5's caveat (a nonzero death tax unchecked beyond these households) stays with the axis decision.

## Provenance

- **The design:** the deep review after HYB (deep-review-log.md 5 Oct 11:50 UK: EDGE-SPLIT, its arms on both tables, S130 and S128, S370 reported, seed 7005, 6,000 paths, through HYB's identity gate); O101's gate (PLAN.md).
- **The build:** grid.js pclsSeg (fb408d9); audit-edge.mjs; reduce-edge.mjs (planted checks; mutations: results-reduce-edge-mutations.txt); preflight-edge.sh with preflight-parse-edge.mjs; derive-edge.mjs; batch-edge.sh.
- **Amended after registration, before launch (the plan-auditor's FAIL of 5 Oct 12:22 UK):** item 1's HELD restated as a direction, O101-EDGE settled only with the low edge's share 0.7 or more (BLOCKING 1), and O83's grade A moved to item 2; the derivation gives the split arms room outside their parents - the relocated pause in half of every story's draws (BLOCKING 2; the HYB close's lesson); item 2's FALSIFIED and INCONCLUSIVE branches registered (BLOCKING 3); the interval, the prior's wording and the cost from the script's output (MINORs 4-6). The credences re-derived.

## Derivation script

- `derive: research/solver/derive-edge.mjs > research/solver/results-derive-edge.txt sha256 562bf144dd1fe27e`
  (each item's outcomes under each of the review's stories, the relocated pause in half the draws; the priors, the review's and the sceptical one; the share's centiles; the credences; the cost)

## Point and interval

- **Item 1:** P-LO's share of PCLSI's gain over HYB on S130, about 0.41 (median under the registered prior, the relocated pause included; 80% interval 0.02 to 0.78, results-derive-edge.txt section 3).
- **Item 2:** S-HI's share of the interpolated read's gain over SNAP on S130, about 0.41 (0.00 to 0.78; the stand-in's gain, grade C).

## Credence

- **Item 1:** HELD 0.38, INCONCLUSIVE 0.34, FALSIFIED 0.28 (derived, results-derive-edge.txt section 4: the stories' outcomes mixed under prior B, a stated sceptical choice - EDGE at 0.095, Laplace on the record that 1 of 19 items leaning on a review's cause or story read as it said, the rest in the review's proportions; under the review's own priors, prior A, the first outcome would be 0.779).
- **Item 2:** HELD 0.33, INCONCLUSIVE 0.43, FALSIFIED 0.24 (derived, section 4, prior B; under prior A the first outcome would be 0.745).
- **Judged, item 1:** HELD 0.60, INCONCLUSIVE 0.25, FALSIFIED 0.15 (the author's judgement, written after the derivation had run - not blind; scored beside the derived credence).
- **Judged, item 2:** HELD 0.55, INCONCLUSIVE 0.30, FALSIFIED 0.15 (as item 1's judgement).
- **Kinds:** 1 ATTRIB; 2 ATTRIB.

## Power

From results-derive-edge.txt section 2 (each discordant path of the read's gain assigned to one edge, a noise floor of as many again as the gain's lost paths, and in half the draws the pause relocated - each split arm losing up to half the gain's saved paths again, so it can fall outside its parents; the reducer's test with Holm over 4 on S130 and S128): under the ranked cause (the edge's share uniform on 0.7 to 1) item 1 reads HELD on 0.979 of draws and item 2 on 0.951; under WITHIN (0.3 to 0.7) item 1 reads HELD 0.270, INCONCLUSIVE 0.458, FALSIFIED 0.272 - so HELD alone does not separate EDGE from WITHIN, and the decision table settles EDGE only with the share; with no gain at all (NOISE) INCONCLUSIVE 0.689. Item 2's input is PCLSI over SNAP as a stand-in for S-INT over SNAP, never run (grade C).

## Budget line

3 jobs of 2 solves and 7 forward arms each, 1.38 hours a household at HYB's slowest seconds, the three in parallel (results-derive-edge.txt section 5); launched after XAS frees the cores.

## Pre-mortem

- **First:** the identity fails - pclsSeg is not inert at its default; the preflight's identity against HYB's own preflight is the check before launch, and a failure there stops the launch.
- **Second:** the split arms are not clean: a segment's interpolation changes the read near the middle bucket too (the blend between 0.5 and its neighbour), so a share near a half may be the boundary's, not WITHIN's; the flat-years line per arm says where each split arm holds.
- **Third:** the gain moves to a third place - removing one edge's pause may make the chooser pause elsewhere (as HYB moved it), so neither split recovers PCLSI and item 1 reads SPLIT for a reason the stories do not name; the flat years per arm show it.
- **Fourth:** item 2's gain is smaller than its stand-in (S-INT over SNAP is unrun), so item 2 reads SPLIT on power, not mechanism.

## Changes after seeing results

None.
