# Design review: Part D's D4 run again (`registrations/couples-d4b.md`), before launch

Subject: `registrations/couples-d4b.md` and the audit, stage gate, batch, backup, sizing and read it names. Checked at
21159ae5 on claude/project-access-i58m0x (code-id 0b45e5f9f059; `stampFilesHash()` f8f77a133b7c), against the review of
9 Nov, item 1 part 2 and item 9 (review/external-2026-10-21 at f02e8741, EXPERIMENTS-AND-PORTS.md l.74-176 and l.614-637),
and STATE.md D34, D61, D63, D66, D67, D69 and D70.

## What I read

Blobs (git hash-object, first 12 characters): couples-d4b.md 1ed1f752711a; audit-couples.mjs 2e9ad4923c2e;
stage-couples.mjs a5d296dd5cd2; reduce-couples.mjs 623f7cb2f9f2; size-couples.mjs 9e04c81917bf; size-phase4.mjs
f66f13d055ed; batch-couples.sh 526b659f069e; backup-chunks.sh 6c525724ef66; couple-panel.mjs 9db4b1f6c4cf;
couples-panel-d4b.json b126653f84a6; couples-paths-d4b.json 9f904828dff4; results-couples-panel-d4b.txt 61b2aed8088f;
results-couples-sizing-d4b.txt dd5aab0b2c46; results-twostage.txt 71e7009923df; src/solver/couple.js 537d59d8e11d;
reduce-phase4.mjs ac319aad1f44. Also couples-d4.md, both of its design reviews (2026-11-07-couples-d4-design.md and
-design-2.md), fair-gate.mjs (requireFairLogs), fair-variables.mjs row 34, code-id.mjs, check-prediction.mjs's registry,
runs.log, SHARE-A.md and results-share-a.txt (to see which couples item 6 used), and the review branch's
prototype/d4-shard.diff and scripts/d4-shard-test.sh. Every file committed since 7 Nov 18:00 searched for the 40 panel
ids: they appear only in the re-run's own files and the pilot's sizing. The pilot's ten units (results/d4-pilot, seed 7002,
EXPLORATORY): their stamps (code 0b45e5f9f059, so the pilot ran on this code), and `reduce-couples.mjs --pilot`.

Nothing of seed 7021 was read: not `d4-backup`'s chunks, not /home/user/d4-launch, not any arrays file of D4. To check
D67's statement I listed `git log --all -S d4-backup` and opened one commit, ee2ff108, the copy script and README on
`d4-backup` (`git show ee2ff108 -- '*.sh'`). Its script prints nothing from a log: it matches the done line with
`grep -q`, uses `sed` to pull out the unit line (`<id> case | unit ...`, the third line), and tests the arrays files with
`gzip -t`. That agrees with the statement as made. I opened no other path on that branch.

What I ran (the only file written under research/ is this one; the scratch scripts are in the session scratchpad):
- `--planted` on all four scripts: stage-couples 6 of 6, reduce-couples 41 of 41, audit-couples 10 of 10, size-couples
  7 of 7. `node research/tests/twostage.test.mjs`: 5 passed. Then `--plants`: the plant 'bothways' fails checks 3, 4 and 5,
  as expected.
- `check-prediction.mjs registrations/couples-d4b.md`: NOT COMPLETE only because the Design review line is still empty.
- The shard filter, re-run on the batch's own lists: `--stage-units 1` gives 200 chunks; `--stage-units 2` with a planted
  stage2.json (S011 at 0.02, S301F at 0.01) gives 10 chunks: CANDC c1 to c3 and SHIPC c1 at the weight going on, and APP
  c1. For n = 1 to 5 and 7, the shards cover the union once, with no gap and no repeat (0 failures).
- size-couples.mjs's functions, imported, so no file was written (scratch budget.mjs). They reproduce the sizing file:
  stage 1 is 187.9 core-hours (solves 25.7, engine 150.4, beside 11.7), 5 windows, 51 hours; on 16 cores, 12.9 hours.
  Stage 2's ceiling is 484.9 core-hours, 129 hours. The longest chunk is 2.63 h (S259 SHIPC/0.02 c1). I also re-scaled
  the library couples at S301F's per-year rate, the old review's MINOR 4 worry. That gives stage 1 at 198.1 core-hours and
  stage 2 at 510.7, with a longest chunk of 2.27 h. Both are within a twentieth of the figures above.
- The SHIPC read under the stopping rule, simulated (scratch shipc-sel.mjs, 6,000 runs a case). APP discordance 10%,
  SHIPC discordance 2.5%, and thresholds by `thresholdFor` at the realised Clopper-Pearson bound. In the 'nested' case,
  every path CANDC loses or saves against SHIPC it also loses or saves against APP, the strongest plausible link. Results
  are in finding 4.

Verdict: PASS

The registration is couples-d4.md in its question, arms, couples, seed, primary metric, decision rule and outcomes. It
states each of the five differences item 1 part 2 lists: the code (l.30-36), the re-landing (l.41-45), the two stages
(l.50-63), the sessions (l.85-90) and D4's fate with D67's statement as made (l.91-97). The two-stage rule as built is item
9's. The read uses the same exact rates the sizing file prints. The stage gate and the read refuse a run that goes against
the first stage's decision. None of the findings below changes a figure the decision reads. Findings 1 and 3 should be
fixed before launch; both are small.

## What holds, on the six questions asked

1. The two-stage rule. The stop condition is the same in three places: stage-couples.mjs l.45-47 (d = 100(sc - sa)/n
   on the first 5,000 paths; a couple-weight goes on when d < 0.5 - 1e-12 and N > 5,000), reduce-couples.mjs stageOf
   l.111-121, and size-phase4.mjs twoStageRate l.112 (stops when -100 X1/n1 >= b1, with X1 = lost - saved). Exactly +0.5
   stops in all three, and that edge is planted. twoStageRate is exact: it reproduces the review's simulation to 0.0014
   at worst and harmRate to 4.3e-10 when it never stops (results-twostage.txt), and its plant fails. The read's
   harmTwoStage (l.213-217) calls `twoStageRate(dUp, N, thresholdFor(dUp, N), D, 5000, 0.5)`, and the sizing calls it
   with the same arguments (size-couples.mjs l.169). The read refuses a paths file whose n1 or bar differs from its own
   (l.415). The sizing's figures quoted in the registration (0.897 at S011 W0.02; 0.926 to 0.970 against SHIPC at 5,000;
   3.25%; 200 and 360 chunks; 187.9, 484.9 and 2.63 h) are the file's figures.
2. The read. The pooled items are read on the minimum length across every unit (l.231), which is 5,000 unless all 80
   couple-weights went on. A comparison against APP that went on is judged at N by the threshold from its own realised
   discordance, with two-stage rates, and the flag only where it went on. Stopping can only lower both the flag's
   chances, so the quarter-point rate stays at or below the one-stage 0.05. A stopped comparison is printed with its d1
   and "read as not harmed". On the pilot's own S1 (+1.3 and +1.4 points) and its se scaled to 5,000 paths (0.030 to
   0.133), S1 is decisive against its -0.1 bar. A true S1 of nought would pass only about a tenth of the time at the
   pessimistic se; that is the non-inferiority bar working, and stricter than at 19,000. Reading on all 19,000 paths only
   when every couple went on is a data-dependent choice. But that branch conditions on CANDC having been low on the first
   5,000 paths, so it can only cut A1's and S1's chance of passing, never raise it.
3. The gate. Each unit's chunk set must be exactly {0} where its couple-weight stopped, or {0 to J-1} where it went on.
   APP goes on where either weight does. This is checked against the read's own recomputation (l.141-146), and stage2.json
   must name the same couple-weights (l.130-133), all planted. The stage gate refuses a missing, duplicated or
   off-range stage-1 chunk, or more than one stamp or seed, before it decides (stage-couples.mjs l.22-51). It prints one
   line, "stage 2: k of 80 couple-weights go on" (l.90-92), or on refusal names only chunks and stamps.
4. Sessions and backup. batch-couples.sh keeps a chunk only on the whole stamp line, the Node version and a done line
   (l.25). backup-chunks.sh reads only `grep -q` for the done line and prints no log line (l.30-41). Its push goes only to
   a `d4b-backup*` branch (l.15).
5. D4's design reviews. The fixes still stand on the changed files. STAMP_FILES now names the re-landed panel, the new
   paths file and stage-couples.mjs (audit-couples.mjs l.87), and the batch uses the same `stampFilesHash`
   (batch-couples.sh l.20). The cost years, the configuration hashes, the person-by-person fair diff, the
   PREDICTION_SHA-and-Node keep rule and the launch from a worktree are all unchanged.
6. The budget. See above; the figures reproduce.

## Findings

1. MINOR (fix before launch). Nothing ties the run to the code the couples were re-landed on. couples-panel-d4b.json
   records `"code": "0b45e5f9f059"`, but the registered audit only stamps the code it runs on (audit-couples.mjs l.189),
   and the read only requires one stamp across the units (reduce-couples.mjs l.186-190, l.411-412). It never compares
   that stamp with the panel's code. The registration itself expects the code may move before launch: an item-5 ruling
   "is applied here first and this registration revised" (l.34-35). Such a change moves arm A's survival, which is why
   difference 2 exists, so a launch on that code would run on targets landed on other code. Arm A's label check
   (audit-couples.mjs l.201) would catch only a change of pick. The same gap covers any default flipped in
   src/solver/couple.js between this review and launch. Fix: the registered audit and the read refuse unless `codeId()`
   equals the panel's `code`. The registration then says plainly that any code change before launch means landing again,
   a new pilot and a new design review.

2. MINOR. The couples' spending share, a fair-test variable since D70 (fair-variables.mjs l.47, row 34: `share`,
   `shareRule`, "couple.js solveCouple meta"), is not in any unit's run record. solveCouple records it in `meta`
   (couple.js l.126-127, l.152), but the audit's run record (`settingsOf` l.125; `ran` l.216) and WANT/FAIR in the read
   (reduce-couples.mjs l.74-80) leave it out. The registration's "item 6's stage B in and off" (l.32-33) is therefore
   asserted, not checked. The same call path makes both arms 'half' and 0.5 today, so no figure moves. Fix: add
   `share ${cp.meta.share} shareRule ${cp.meta.shareRule}` to the run record's head, and want 0.5 and 'half' in both
   solver arms.

3. MINOR (fix before launch). The read's spending flag is not paired once stopping applies. reduce-couples.mjs l.255-258
   averages CANDC's `delivered` over its own length and APP's over its own. Take a couple whose 0.02 weight stops while
   its 0.01 weight goes on: APP then has 19,000 paths and CANDC/0.02 only 5,000. Its flag compares means over different
   paths, against CHECKLIST 3. The flag is reported and does not block. The planted fixture has no such mixed couple: C1
   stops at both weights and C2 goes on at both (l.317-325). Fix: average both over n = min of the two lengths, and plant
   one couple stopped at one weight and going on at the other.

4. MINOR. The registration says of the SHIPC read that "its stopping turns on the comparison against APP, not on it"
   (l.58-59). That is incomplete. Stopping depends on CANDC's own paths, which both comparisons share, so where a
   couple-weight sits near the bar, the paths a SHIPC comparison is read on are selected. The simulation above shows D34's
   rates still hold over the design as a whole:

   | true change vs APP | quarter-point loss read as harm | 1-point loss read as harm |
   |---|---|---|
   | +0.5 (nested) | 0.034 | 0.950 |
   | +0.8 (nested) | 0.026 | 0.947 |
   | +1.5 (nested) | 0.029 | 0.938 |
   | +0.5 (independent) | 0.041 | 0.970 |

   The rate printed per comparison is not its rate given that it stopped. At a true +0.5, a 1-point loss is flagged 0.902
   given a stop and 1.000 given going on. A quarter-point loss is flagged 0.008 given a stop and 0.060 given going on.
   Separately, reading SHIPC at 5,000 paths where a couple stops lowers the discordance up to which D34's 1-point rate
   holds from 12.45% to 3.25%. The registration states this only in its Budget paragraph (l.107-108), and item 9 does not
   address SHIPC. Fix: no change to the rule. Say in the Decision rule that both are consequences of stopping the whole
   couple-weight, give the joint rates, and let the maintainer see the 3.25% limit there.

5. MINOR. The shard filter is not the review's prototype and has no test of its own. batch-couples.sh moves it into
   `shard()` and applies it to each stage's list (l.32, l.36, l.44). The review's d4-shard-test.sh looks for the
   prototype's four lines, including `TODO=$(printf`, so it cannot run on this batch. The partition re-run above holds,
   but the check is not committed with a plant (CHECKLIST 5). Also, the batch runs stage 2 only when every first-stage
   chunk's log and arrays are in that session's own folder (l.39-40). A worker that receives only stage2.json, as l.88-90
   puts it ("its stage2.json goes to every session"), stops at "the first stage has N chunks not done here". That is
   safe, but it stalls. Fix: adapt d4-shard-test.sh to `shard()` over both stages' lists, with its plant. In the
   registration or the worker prompt, say each session copies every backup branch's chunks and logs, not only
   stage2.json, before relaunching for stage 2.

6. MINOR. Which couple-weights went on is a partial outcome of seed 7021. Beyond the count the gate prints, it is written
   in stage2.json, which backup-chunks.sh pushes to each `d4b-backup*` branch (l.42). The stage-2 heartbeat's chunk
   numbers (l.43) also map to couples through `--unit-files`. Nothing in the run opens either to print it. Fix: in
   "What became of D4"'s spirit, the read's statement should say stage2.json and the heartbeats were not opened, and the
   worker prompt should forbid them as it forbids results.
