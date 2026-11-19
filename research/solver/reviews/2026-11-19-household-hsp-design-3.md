# Design review, third round: step 8's answers to the second round's four MINORs (`registrations/household-hsp.md`; D129 (3), D130 (2); before launch)

19 Nov 2026, about 19:58 to 20:15 UTC. The `reviewer` agent, third round, narrow: only the answers to the second round's four
MINOR findings (`reviews/2026-11-19-household-hsp-design-2.md`), which changed the registration's Decision rule, Outcomes and
gate after the pilot was read. Main tree at 76f3823c, clean, HEAD unmoved during the review. No unit was run, and nothing of
seed 7024 was run, read or estimated. The only outcomes touched are seed 7002's: the pilot's 15 records and the preflight's 25
(EXPLORATORY, already read for the sizing). The sizing script was run with `--planted` only; its arithmetic was recomputed by
importing its functions. Every probe ran at nice 19. Scripts and outputs:
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/hsp-design-3/`.
No repository file but this one was written.

## What I read (git blobs at 76f3823c)

- The answers: `STEP8.md` 4ffa6b703b93 (section "The design review's second round"); `registrations/household-hsp.md`
  5ed75f7886a5 and its diff from 90f0757b (the second round's subject, b1bcaa624477); commits 5ae244fb, 744eee1a, c8ff7ded,
  09542e02 and 76f3823c.
- The run and its read: `reduce-household-hsp.mjs` 153cbfeebc48, `audit-household-hsp.mjs` 4ac0e66a9daf,
  `batch-household-hsp.sh` b73605510373, `size-household-hsp.mjs` 1a555ce15e0d, each with its diff from 90f0757b;
  `household-hsp-paths.json` 24ecbaa24d0f; `results-household-hsp-sizing.txt` ce919316a04c;
  `results-household-hsp-preflight.txt` 57692fcadd90.
- The checks they rest on: `check-prediction.mjs` 818af86a4dbd (D131's diff at 744eee1a); `run-from-snapshot.sh`
  cf7ab99bb4ec (the seed check, line 78); `audit-shapes.mjs` 94180a00e4ae (`shapesLineProblems`); `audit-couples.mjs`
  f50aa99da601 (`wantProblems`); `fair-gate.mjs` c6b3e87e1643. The panel 78e4b83eb4d0 and orders 3d2c295ae95a are unchanged.
- The data: `results/household-hsp-preflight/` (25 records, 25 logs, `household-hsp-preflight.log`);
  `results/household-hsp-pilot/` (15 records and logs, `household-hsp-pilot-5.log`); `results/household-hsp-pilot-a11dd70ee278/`
  (the pilot before the edits, for comparison only).
- Also `STATE.md` 8645f092b8b5 (D131), `DECISIONS-PENDING.md` 7fea23061660, `CHECKLIST.md`.

## What I ran

1. The planted suites, as asked: `reduce-household-hsp.mjs --planted` ALL PASS (16); `audit-household-hsp.mjs --planted` 9,
   all read as they should; `size-household-hsp.mjs --planted` 7, all read as they should.
2. The pilot's gate, `reduce-household-hsp.mjs --pilot`: REFUSED, one line, `a unit's audit is not these files'
   (4cc4d37c0c19)`. `gate()` at the pilot's own stamp 7fa755346a65: fair (no refusal).
3. The audit's stamp recomputed from git at each commit (`stamp-at.mjs`, every stamped file read with `git show`):
   90f0757b 64b3f42b016c; 5ae244fb, 744eee1a, c8ff7ded and 09542e02 7fa755346a65; 76f3823c and the tree 4cc4d37c0c19. Between
   09542e02 and 76f3823c the only stamped file changed is `household-hsp-paths.json` (`built`, `coreHours`, `hours`,
   `hoursLongestFirst`; every unit still 16,000).
4. The re-run pilot against the run before the edits (`pilot-check.mjs`): 0 of 465 arrays and fields differ over the 15 units
   (each arm's seven arrays, the record, split, share, caps, digests, guard, target, pick, N, seed, and the rollout beside).
5. The planted `REAL` lines against S025-own's record in the re-run pilot: equal, settings and lines, key for key.
6. Mutants of the read, each a scratch copy at 76f3823c with one change, against its `--planted` (`mutate.mjs`,
   `mutate-gate.mjs`; 22 mutants, listed under the answers and the findings).
7. The preflight's 25 records through the read's `gate()` at their stamp 7fa755346a65, with their logs (`preflight-check.mjs`).
8. `m1ByUnit` and `report` on the pilot's 15 records (`m1-pilot.mjs`, `report-runs.mjs`).
9. The sizing recomputed without writing (`sizing-check.mjs`).
10. `check-prediction.mjs` on the registration; the launcher's seed check on the batch
    (`check-prediction.mjs --seeds <registration> --text "bash research/solver/batch-household-hsp.sh" <batch>`);
    `research/tests/check-prediction.test.mjs` (ALL PASS, 17); `git grep -lw 7024` at 76f3823c against 90f0757b.
11. A mechanical diff of the lines the read prints after its gate, 90f0757b's main block against 76f3823c's `report`.

## Verdict

Verdict: PASS

No BLOCKING finding, two MINOR.
- Each answer does what its finding asked:
  - the preflight puts the 25 unpiloted units through every check before any path on the launch's code;
  - a PASS with a unit M1 names now goes to the maintainer before the default changes, and each such unit's spending over all
    paths is printed;
  - the gate's two re-checks are pinned on a real record;
  - the launch stamp is to be filled by hand.
- Nothing else moved:
  - `rule`, `gate`, `compare` and `keptSpend` are unchanged;
  - what the read prints changes on two lines only;
  - the panel, the orders, `household.mjs`, the shared audits and `src/` are unchanged;
  - the code id is 71fb4271c681.
- Finding 1 is to be done at the launch commit, in a field that may change after the pilot. Finding 2 asks for no change.

## The four answers

1. **MINOR 1, the 25 units never through the audit's checks: answered.**
   - **What the mode does.** `preflight` (`audit-household-hsp.mjs` lines 159 to 175) takes the panel less the pilot. It sets
     `PILOT`, so the seed is 7002, never 7024, and it writes to its own folder. It runs the registered path's code: the same
     solves, `solveProblems` (line 187), the APP context check, the horizon check, then two paths each held to `E.runTrial`.
   - **The settings check ran.** It ran at 45 points, so `smoke` is false and the settings check ran in full.
   - **It cannot reach the registered run.** `REGISTERED` is `registered` alone. The launcher's seed check on the batch still
     reads 7024 alone, owned by `household-hsp*.md`.
   - **The record:**
     - the 25 ids are exactly the panel less the pilot;
     - every record is stamped code 71fb4271c681, audit 7fa755346a65, seed 7002, 2 paths, 45 points;
     - 25 done lines, none refused or exited;
     - every settings line is at `pts 45`, the household line at `tieAboveCap 0.0001` and the first person's at 0, the guard
       on, `k` from 1.1111 to 1.8182.
   - **It ran on committed files.** 7fa755346a65 reproduces from git at 5ae244fb to 09542e02.
   - **It ran on the launch's checks.** `audit-household-hsp.mjs` is unchanged since 5ae244fb, so the checks before any path
     are those the launch runs.
   - **The read's gate agrees.** On the 25 records at their stamp it is fair, with each table's settings line, the household
     line, HSPA's plan and the band re-checked from the record.
   - **So all 40 units have passed the checks before any path.** The pilot's 15 and the preflight's 25, on the launch's code.
     The checks that read paths can still end a unit on 7024 (`E.runTrial` on the first 200), as they must.

2. **MINOR 2, M1's units under a PASS: answered.**
   - **What changed.**
     - `m1ByUnit` gains `all`, the arm's mean delivered over every path against K2's (`reduce-household-hsp.mjs` line 151).
     - `report` (line 284) carries the old main block's printing.
     - Its OUTCOME line, under a PASS, adds "first, the N unit(s) M1 names below (ids) go to the maintainer with this read"
       (line 293).
   - **Nothing else in the output moved.** The mechanical diff of the printed lines shows only that clause and the M1 line's
     added "over all paths" figure.
   - **The registration.** The Decision rule (line 71) and the PASS outcome (line 77) send the named units to the maintainer
     before the default changes, "only on the maintainer's word".
     - That is a step stronger than the read's line, and the registration governs.
     - It changes no verdict (`rule` is unchanged) and only adds a maintainer's look where D116 does not reach.
   - **Pinned.** Three mutants of the clause fail the report's planted case:
     - the clause removed;
     - the clause only for two units or more;
     - the clause naming every unit.
   - **On real records.** `report` runs end to end on the pilot's 15 records: 30 lines, no NaN or undefined. It names S273-90
     with "spending on the paths both keep -0.1830% se 0.0327 and over all paths -0.0947%, the capped pot -0.872% -£54,151 a
     path". That is the second round's unit, now with both measures and its pot.
   - **Not pinned: the over-all figure.** Two mutants pass the planted suite:
     - `all` taken on the paths both keep;
     - the kept figure printed in its place.

     The planted case lowers spending equally on every path, where the two measures coincide. The code is right by inspection.
     On the 15 pilot records `all` equals a direct sum over every path to 0, and it differs from the kept figure on every unit
     (S351F-90 +1.2135 against +1.0241). The figure decides nothing, so this is recorded here and not as a finding.

3. **MINOR 3, the gate's re-checks with no planted case: answered.**
   - **What was added.** The new cases (lines 250 to 262) take S025-own's real settings and household lines. They are equal
     key for key to its record in the re-run pilot.
     - The real lines read fair with nothing filtered.
     - Six faults, three in the settings lines and three in the household line, are each refused by exactly one line, its own
       check's.
   - **Pinned against seven mutants.** Each fails "the gate on real lines" (one also fails "fair"):
     - the settings re-check removed;
     - the line re-check removed;
     - the partner's settings line skipped;
     - every settings line read from the first person's;
     - points always free;
     - the two floor fractions swapped;
     - the household line checked against itself.
   - **One equivalent mutant survives.** It drops the line's refusals where the settings re-check already refused the same
     unit, and the unit is refused either way.
   - **This is the class the second round probed by hand.** The planted checks now carry it.

4. **MINOR 4, the launch stamp: answered as asked.**
   - **The registration.** The launch line (135) says the stamp is filled by hand at the launch commit, and
     `check-prediction.mjs`'s fields still exclude it.
   - **Filling it does not move the stamp.** The registration is not among the stamp's 50 files.
   - **It must be filled in the launch commit itself.** `requireFairLogs` refuses a registration edited after the launch.
   - **Its value.** Were the launch commit to change no stamped file, the audit would be 4cc4d37c0c19 (not the pilot's
     7fa755346a65; item 2 under What holds).

## Findings

1. **MINOR. The Design review line names the second round's file, so the launcher reads the second round's PASS and not the
   review of the changes made after it.**
   - **How the check reads the line.** `check-prediction.mjs` takes the first `research/solver/reviews/*.md` path in the field
     (line 33) and requires its "Verdict: PASS". `run-from-snapshot.sh` runs that check before a launch.
   - **What the line names.** The registration's line 136 names `2026-11-19-household-hsp-design-2.md` first, and the check
     reads the registration complete now. The Decision rule, the Outcomes and the gate changed after that PASS, and the
     registration's own line 13 sends such changes to the reviewer.
   - **What that means.** A verdict here is not read by the launcher, whatever it says. With this round PASS nothing turns on
     it for this launch.
   - **Fix, at the launch commit.** Name `research/solver/reviews/2026-11-19-household-hsp-design-3.md` as the first review path
     in the Design review line, the earlier rounds after it. Design review is one of the fields that may change after the
     pilot.

2. **MINOR. "Each refusal has its planted case" (the registration's line 102) is still not so for eight of the gate's refusals.
   I missed these at the second round.**
   - **The eight.** Removed one at a time in a scratch copy, each leaves `--planted` at ALL PASS (16):
     - an extra unit not of the panel (line 77);
     - more than one prediction;
     - more than one Node version (line 85);
     - more than one seed;
     - a unit off the given seed, estate weight or points (lines 86 to 88);
     - a unit's audit not these files' (line 90).

     The planted "another seed", "another estate weight" and "another count of points" faults each fire two lines, and their
     patterns match either.
   - **Each is present and right by inspection.** The audit-stamp refusal fired live today on the pilot (item 2 of What I
     ran).
   - **In registered mode most cannot arise.** The audit fixes the seed, the weight and the points, and refuses limits.
   - **Nothing needs to change before the launch.** The read is frozen at the launch commit. Changing the sentence would
     reopen a field outside the allowed list for no effect on the run. If the read is edited again before the launch for any
     other reason, these eight could take their planted cases then.

## What holds (checked, no finding)

- **The pilot again, on the final files' code.**
  - It ran at 7fa755346a65, committed, with nothing else in its window (`household-hsp-pilot-5.log`, 19:10 to 19:53 UK).
  - Its 15 records equal the run before the edits in every array and field. The second round's edits moved no unit's run.
  - Its gate is fair at its own stamp.
- **`--pilot` now refuses, as at the second round.** It refuses on the audit stamp alone, because the sizing rewrote the
  stamped paths file after the pilot. The fields that moved are ones the pilot mode never reads, and every unit stays at
  16,000.
- **The sizing.**
  - Recomputed: 16,000 every unit (the pilot's upper bound at most 3.43%); 54.49 core-hours; 14.85 hours in the batch's own
    order and 13.84 longest first; the longest unit 3.48 hours (S349F-gap8).
  - These are the registration's figures.
  - `inOrderSpan` hands each unit to the first core free in the panel's order, as `xargs -P` does, and its planted case reads
    16.
  - The corrected audit header and sizing line describe what runs.
- **The seed.**
  - D131's edit to `check-prediction.mjs` is the registry entry and its owner pattern alone, and its test passes (17).
  - The registration reads complete. The launcher's seed check on the batch prints 7024 alone.
  - 7024 is new at 76f3823c only in `check-prediction.mjs`, the preflight's record (the batch's own line) and the second
    round's review.
  - All 40 preflight and pilot logs are on 7002, and no `household-hsp-run` folder exists.
- **Nothing else in the design moved since 90f0757b.** The Question, Arms, Households, Primary metric, the ISA defect and
  guard paragraphs, the panel, the orders, the configurations and the code are unchanged.
