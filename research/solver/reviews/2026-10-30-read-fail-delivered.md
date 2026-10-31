# Review at the read: the failure year at what it can pay (`failDelivered`), registrations/fail-delivered.md

Subject: the registered held-out read of 30 Oct (CAND `fcd8096217b7` against CANDD `d71f65ae871e`, eight households,
seed 7019, 4,000 paths a unit), run through the launcher from 5df83cd (29 Oct 23:23 to 30 Oct 00:47 UK), read once by
`reduce-curve.mjs --registered` into results-fail-delivered.txt; its write-up (STATE.md's block `faildelivered`, sections
5 and 6, and the commit message being committed now); and the dial's EXPLORATORY read (results-curve-dial.txt, block
`curvedial`, commit cecc4a8).

## What I read

Blobs (first 12 of git's hash): registrations/fail-delivered.md 2741af0cf7fc; reduce-curve.mjs 7449b60b98c7;
audit-curve.mjs b71813586a9c; batch-fail-delivered.sh 660ea8834d38; run-from-snapshot.sh cf7ab99bb4ec; fair-gate.mjs
4d4a20402b1c (checkLogStamps, requireFairLogs); audit-phase4.mjs 5ace83959b96 (runPath l.89-105); code-id.mjs f00aa5b3bd48;
candidate.mjs 8e17a0268f01; candidate.json 6ecabd1100ef; src/solver/solve.js 113e3da7d08b (l.954-989, the failure
price); results-curve-dial.txt 9df0a8b04327; results/curve-fd-launch-log.txt 9a020234fbef. Staged: STATE.md 8ed3ebc7e7b5,
state.mjs 9a57872ecf28, results-fail-delivered.txt 4f3ec1e844e7. The commit message (scratchpad msg-fdread.txt,
9b95bf8b3f74). The 16 unit logs and 16 units in results/curve-7019, the 24 units in results/curve-7002, the snapshot
/tmp/solver-snap-hr3kfK, runs.log, the design review and re-review of 29 Oct.

What I ran (scripts in the session scratchpad, rev/; nothing written to the repository but this file):
- `node research/solver/reduce-curve.mjs --registered research/solver/results/curve-7019`: exit 0, output byte for byte
  results-fail-delivered.txt. `--dial research/solver/results/curve-7002`: byte for byte results-curve-dial.txt.
- `node research/solver/state.mjs --check`: "STATE.md's 22 printed blocks match the files"; the staged STATE.md and
  state.mjs are the working tree's.
- rev/recompute.mjs: P1, the survival change, P2, P3 and the three-year count from the units, decoded on their own (no
  import of the reducer). rev/ran.mjs: every unit's stamp and `ran` record. rev/pattern.mjs, rev/same.mjs,
  rev/levels.mjs, rev/edge.mjs: the levels in the years before ruin, per arm and on the same paths. rev/dialcheck.mjs: the
  dial's figures and each dial arm's three-year count.
- The snapshot against 5df83cd: every tracked file's blob compared; code-id.mjs and the audit stamp computed in both trees.

Verdict: PASS

The figures are the results file's, recomputed from the units; the outcome is the registered rule's; the gate passed on
what it should; the uncommitted file was the dial's results text and touched nothing stamped. Two MINOR findings, both
about what the report to the maintainer should carry.

## Findings

1. MINOR (for the report to the maintainer; it does not change the outcome). The figure the design review asked for
   beside P3 (its finding 3: "so a raise moved one year earlier is seen") shows the raise moved, not removed, on about a
   fifth of CANDD's run-out paths. The write-up prints the count (results-fail-delivered.txt l.31: CANDD 164 of 832, CAND
   260 of 847) and does not say what it shows. From the units (rev/recompute.mjs, rev/pattern.mjs, rev/same.mjs,
   rev/levels.mjs):
   - CANDD: of the 164, the latest 110% year is two years before ruin on 159, the year before on 4 (P3's), three years
     before on 1. On all 159 the year before ruin is at the floor (80%). CAND: all 260 are in the year just before. No
     CAND run-out path has a 110% year followed by a lower one before ruin. The drop from two years before ruin to the
     year before is 30 points (110 to 80) on 159 CANDD paths and on no CAND path.
   - The same 159 paths under CAND: all run out under CAND too (the failure year the same on 143 of the 164, a year later
     under CAND on 20). In CANDD's 110% year, CAND paid 100% on 120, 95% on 36 and 80% on 3, never 110%. CAND raised in
     the next year (the year before ruin) on 72. On the other 87, CAND did not raise in either of the last two years. So
     on 72 paths the option moves CAND's last-year raise a year earlier, and on 87 it adds a 110% year two years before
     ruin where CAND had none.
   - The year before ruin is at the floor on 774 of CANDD's 832 run-out paths (93%), against 144 of CAND's 847 (17%).
   - The tuning seed shows the same (curve-7002, EXPLORATORY, rev/dialcheck.mjs). CANDD: 197 of 875 run-out paths have
     a 110% year in the three before ruin, 190 of them two years before; 2 the year before. The review counted only the
     year before, so it could not see this.
   - Mechanism: not decomposed. The pattern fits the design review's finding 3, which the registration records (l.41-44).
     With the option on, the backward pass prices a near-doomed cell one year before ruin at its fail-now cost
     (solve.js l.984-989). The chooser cannot take that move. Money carried into such a cell then earns little in the
     table, so a raise the year before is nearly free. In the engine, the chooser in the year before ruin has to pay,
     and pays the floor. If so, this is a residue of the mechanism the option addresses, one year removed. "Caused by"
     needs the deep review's test. On these 159 paths: the table's stored move at the engine's state in the year before
     ruin (failing or paying), and the score gap between the 1.1 and 1.0 moves two years before. Then the same paths
     under finding 3's second remedy, the backward pass kept to paying moves where one pays.
   - Scale: 159 of 32,000 paths, all lost under both arms. Survival and lifetime spending do not move (P1 3 paths, P2
     held). What changes is the shape of the fan just before ruin. That is what the maintainer is reviewing with the
     external reviewer (D40 (3), D41 (2), D44 (2)'s "the late raise in the fan"). P3's 0.5% against 30.7% reads as "the
     raise before ruin removed". Within three years the comparison is 19.7% against 30.7%, and on 159 paths the road
     into ruin is a raise to 110% followed by a cut to the floor. D43's predicted "to none" (STATE.md l.43) holds only
     for the year just before ruin. The report to the maintainer (STATE.md section 6 item 1) should carry these counts.

2. MINOR (the dial, EXPLORATORY). cecc4a8's message says "The raise before ruin stays near none (4 of 963, 1 of 1,199)".
   The same results lines (results-curve-dial.txt l.33-34) print 207 and 223 run-out paths with a 110% year in the three
   years before ruin. In those, the latest 110% year is two years before ruin on 198 (DIAL3) and 220 (DIAL10)
   (rev/dialcheck.mjs). The dial's read prints no three-year count for its comparator CANDD (197 of 875). Every figure
   in the `curvedial` block is the results file's. The message is committed; the report should give the three-year
   counts beside the one-year ones, CANDD's included.

## Checked and sound

- **The write-up's figures.** Each figure in the commit message is the results file's (l.24-41): the gate, runPolicy 0
  of 16,000, survival 96.772% / 96.775% and +0.003 (-0.007 to +0.014), P1 3 of 32,000 (2 saved, 1 lost, every one below
  the minimum pot), P2 -0.0072% (-0.0089 to -0.0056%) and while alive -0.0105%, P3 4 of 832 (0.2 to 1.2) and CAND 260 of
  847 (27.7 to 33.9), the beside counts, no household flagged, and the times (launch log). The block `faildelivered` is
  state.mjs's print of those lines; `--check` passes. Its flag regex would catch a FLAG line as the reducer prints it
  (reduce-curve.mjs l.196). The equity "the same" is within 0.1 point pooled (l.31).
- **The independent recomputation** (rev/recompute.mjs) gives the same figures. P1 3 of 32,000: saved S188 path 322
  and S304F path 3144, lost S304F path 3457. Each fails in the plan's last year (failYear = Y - 1) with unmet below
  £5e-13, and its end wealth is below the minimum pot (£44,362 < £44,800; £178,179 and £86,519 < £205,000). Survival
  +0.0031 (-0.0075 to +0.0137, se 0.0054). P2 -0.00723% (-0.00887 to -0.00559, se 0.000835); by household S030
  +0.0009, S050 +0.0010, S090 -0.0137, S368 -0.0005, S188 -0.0065, S304F -0.0072, S328F -0.0048, S340F -0.0272. P3 4 of
  832, CAND 260 of 847. Three years: 164 of 832 and 260 of 847. The edge cases, checked:
  - no run-out path has its year before ruin before retirement;
  - no run-out path's unmet is under £100;
  - no surviving path has unmet above £1;
  - every minimum-pot failure falls in the last year (rev/edge.mjs).
  Fifteen paths move from running out to ending below the pot (run out 847 to 832, pot 186 to 200), with survival
  unchanged. That explains P3's two denominators.
- **The rule** (registration l.45-52; reduce-curve.mjs l.180-188). P1: 3 paths, so MISSED. P2: -0.0072 is within ±0.1,
  so HELD. P3: 4 paths, so MISSED. HARM needs the interval's upper end below -0.1; it is +0.014, so not HARM. OUTCOME
  MISSED. "The default (D43) stands unless the maintainer reverses it" is the Outcomes field's MISSED clause (l.50-51).
- **The gate.** requireFairLogs: all 16 logs carry one stamp, code dc14b41369ef audit 5c9b63b20e97 prediction
  registrations/fail-delivered.md sha 2741af0cf7fc, and 2741af0cf7fc is the registration's blob now, unchanged since
  8a02258. The reducer's own gate, from every unit's record (rev/ran.mjs):
  - seed 7019 and 4,000 paths;
  - each household's two arms on one inputs hash, target, retirement year and Y;
  - failDelivered false on all 8 CAND units and true on all 8 CANDD units;
  - lambda 0.0223606797749979, 45 points, levels 0.8 to 1.1 and switch charge 0.001 on every unit;
  - raise weight 0.003, failure price "floor", tier state on and estate weight 0.02;
  - the minimum pot equal within each household.
  The audit stamp is stampFilesHash of the files now (5c9b63b20e97, the batch's own sum too). PHASE4_OPTS and
  CANDIDATE_OPTS differ in failDelivered alone (fcd8096217b7, d71f65ae871e). Seed 7019 appears in no results file or
  runs.log line before this run.
- **The uncommitted file** was research/solver/results-curve-dial.txt, untracked at launch. It was written at 23:22:51,
  the snapshot was copied at 23:23:16, and cecc4a8 committed it at 23:24:26, byte for byte the snapshot's copy. Every
  tracked file in the snapshot (1,974: src, research less results, package.json) has 5df83cd's blob. The file is not in
  audit-curve.mjs's STAMP_FILES (l.48), not in code-id.mjs's codeFiles, and not among its 197 smokeFiles; nothing in the
  run reads it. The snapshot's other extra files are gitignored, so git status does not count them:
  - research/engine.mjs is in the code hash and identical to the tree's now;
  - research/simplePlan.mjs is imported by nothing in the run;
  - the third is a __pycache__ file.
  code-id gives dc14b41369ef in both the snapshot and the tree, and the audit is 5c9b63b20e97 in both. The commit
  message's sentence on it is right.
- **The dial** (item 5). The `curvedial` block is the results file's (`--check`). The reducer re-run is identical.
  rev/dialcheck.mjs reproduces each arm's survival (96.63 / 96.21 / 95.17%), both comparisons with CANDD (-0.413
  (-0.503 to -0.322) and -1.453 (-1.592 to -1.314) points; +1.074% and +1.604% lifetime spending), and the raise before
  ruin (4 of 963, 1 of 1,199). It is labelled EXPLORATORY in STATE.md's heading, the results file and the unit logs
  ("prediction none"), and it was launched under PREDICTION=none (runs.log). cecc4a8 changes STATE.md,
  results-curve-dial.txt, runs.log and state.mjs only: no default, and candidate.json is untouched.
