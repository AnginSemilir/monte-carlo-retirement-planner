# Design review: Part D's D4 run again, the revised registration (`registrations/couples-d4b.md`), before launch

Subject: `registrations/couples-d4b.md` as revised after D73, D78, D80 and D81 (E), and the audit, stage gate, batch, sizing
and read it names. Checked at ab5bc29d on claude/project-access-i58m0x: code-id 1d5d2421c9ab (the code the panel was landed
on), `stampFilesHash()` 29a4a6a71f76, the tree clean when the review began. The first form's review
(`2026-11-11-couples-d4b-design.md`) read the text before this revision; this one reads the revision whole.

## What I read

Blobs (git hash-object, first 12 characters): couples-d4b.md 82c1602e5cb6; audit-couples.mjs 1bc8fa2e72a3;
stage-couples.mjs 2e80808c97d9; reduce-couples.mjs 3c835d75ecc2; size-couples.mjs a03ac681b24f; batch-couples.sh
ecc93d34a783; couple-panel.mjs 9db4b1f6c4cf; fair-variables.mjs b516ca2b341c; src/solver/couple.js f66038d648b3;
src/solverApp.js 9b354ce6f980; src/solver/solve.js 9372e3c5acb2; src/solverSettings.js 8f84992f9b67;
couples-panel-d4b.json 1d2a56c83b7d; couples-paths-d4b.json 40a096da74b6; results-couples-panel-d4b.txt 4e6f49634f71;
results-couples-pilot-d4b.txt 6cabb0e3bd0c; results-couples-sizing-d4b.txt 63e4d224a863; d4b-shard.test.mjs dd1f567d89d5;
twostage.test.mjs 1b89d4ac73d7; couple-sweep.test.mjs 73f116c27c7e; size-phase4.mjs f66f13d055ed; reduce-phase4.mjs
ac319aad1f44; audit-phase4.mjs 5ace83959b96; check-prediction.mjs 5c6931697194; code-id.mjs f00aa5b3bd48;
research/engine.mjs 5c87a8006b0c. Also STATE.md whole (D61 to D86 and section 5), CHECKLIST.md, the first form's review,
`2026-11-12-default-d73-2.md` (its finding 1, on the sweep), DECISIONS-PENDING.md l.103-109, the external review's
`ANSWERS-2026-11-11.md` sections 2 to 4 (by `git show`), runs.log's last lines, the landings' records
(results/d4b-land: 40 files, each code 1d5d2421c9ab at head 21b58645) and the pilot's ten units (results/d4-pilot, seed
7002, EXPLORATORY: stamp code 1d5d2421c9ab).

Nothing of seed 7021 or of D4 was read, printed or estimated. `d4-backup` was not opened, fetched or listed.
`audit-couples.mjs registered` was not run; no batch was launched. research/solver/results holds no d4-run or d4b-run folder
and no `results-couples-d4*.txt` exists. The only file written under the repository is this one.

What I ran (scratch scripts in the session scratchpad's review-3 folder):
- `--planted`: audit-couples 25 of 25, stage-couples all, reduce-couples 64 of 64, size-couples 11 of 11.
- `d4b-shard.test.mjs`: 5 passed; its plants `offbyone` (checks 1 and 2 fail) and `noship` (check 5 fails).
  `twostage.test.mjs`: 5 passed; `--plants`: bothways fails 3, 4, 5, exact.
- `couple-sweep.test.mjs` (S059, 4 points, 3 paths of seed 99001): 4 passed; `--plants`: nosweepisa fails 1, 2, exact.
- `check-prediction.mjs registrations/couples-d4b.md`: NOT COMPLETE on the Design review line alone (its placeholder, and
  no review file named). Nothing else is incomplete.
- The registered gate (`reduce-couples.mjs` gate, not its pilot read) over the pilot's ten real units: 20 problems, ten
  "seed 7002" and ten "stamped under none"; no other. So real records as this audit writes them pass every check of the
  configuration, each person's settings, the sweep, the anchors, D80's three, flat and fast, the share, the fair diff, the
  chunk layout and the rollout beside.
- D80's guard on real solves (S059, each person by solveForApp at 4 points, no path drawn): both options off reads
  `shortlist none item12 none tieBreak off:tieMargin`, not refused; `tieAboveCap: 1e-4` reads `ON:tieAboveCap`, refused;
  `chooserShortlist: 'order'` reads `ON:chooserShortlist`, refused; `tieAboveCap: 0` reads off, not refused.
- Each person of the 40 couples as CANDC solves them (the audit's `solverPlan`, `tierPairsOf`, `coarseFits`; no solve, no
  path): 80 of 80 have four tier pairs and take the solve on anchors; arm A's pick is the landing's label on 40 of 40
  (the audit's l.304 stops no unit); no dial position above 1, no tier lock.
- The batch's lists: `--units` 480; `--stage-units 1` 200; `--unit-files` gives SHIPC chunks 80 to 159 and none past
  chunk 0; `--stage-units 2` on a planted stage file (S011 at 0.02, S301F at both) names 11 chunks, CANDC's and APP's
  only; on every couple-weight, 280.
- size-couples.mjs's functions, imported (nothing written): the first stage 47.78 core-hours (solves 11.0, engine 31.8,
  beside 4.9; CANDC 28.7, SHIPC 19.0, APP 0.1), the ceiling 76.1 over 280 chunks, the longest chunk 0.47 h: the file's
  figures and the registration's.
- research/engine.mjs rebuilt in a scratch copy from src/App.jsx as committed: byte for byte the committed file.
- The panel file against the registration and the landing's results: the 40 ids and their order are the registration's
  and D4's; every target, arm A survival (84.0 to 85.9) and label is the results file's; the paths file names the same
  40 at 19,000, n1 5,000, bar 0.5, shipN 1,000.

Verdict: PASS

No finding stops the launch. The eight below are MINOR. Findings 3 and 5 ask for words in the registration; findings 2 and 4
offer a small edit to the audit that the launch does not need. This PASS covers the blobs listed above: an edit to the
audit, the stage gate, the reducer, the sizing or the batch after it should come back as a diff, and a change under
src/solver or to research/engine.mjs moves the code hash, which by the registration's own words means landing, the pilot
and this review again.

## What holds, on the six questions asked

1. A fault and the gate. The audit refuses to start, and the read refuses a unit, on each of these, each with its planted
   case: COUPLE.flat or COUPLE.fast off (audit-couples.mjs l.128, l.275, l.319; reduce-couples.mjs l.201, three plants,
   one of them a unit that records nothing); the solve on anchors off, none or another setting where the person has the
   joint tier state (audit l.192-198; read l.212, three plants); a shortlist, an item 12 option or a tie-break on, or a
   record without all three (audit l.143-159, ten on-cases; read l.203, four plants; and on real solves, above); a CANDC
   person without the sweep to the ISA or a SHIPC person with it (audit l.187-188; read l.209, two plants); a SHIPC unit
   on any paths but its first 1,000 in one chunk (stage gate l.44-45, read l.175-185, batch l.51-55, each planted). The
   check against E.runTrial (first 200 paths) and the rollout beside (first 500) both sit inside SHIPC's 1,000 and the
   read refuses a unit without the rollout beside on min(N, its first paths, 500) (l.197). The joint move's own sweep and
   what S1 used to catch are findings 1 and 2.
2. What it measures. The stage gate reads CANDC and APP alone (stage-couples.mjs l.48-59); SHIPC's chunk must be there
   and on its own paths but its values enter nothing, planted with SHIPC surviving no path. A1 and A2 are read on the
   minimum length across APP and both CANDC weights (reduce-couples.mjs l.270), not cut to SHIPC's paths, planted. S1 is
   read on SHIPC's paths against CANDC's same paths and printed after the outcome line; `decide` (l.231-240) takes A1
   and A2 only, planted with S1 20 points down and the outcome PASS. Seed 7021: the audit refuses it to anything but the
   registered run (l.282) and the registered run to anything but the launcher under this registration (l.276-277); the
   landings read 7001 and 7005 and the pilots 7002 (phase4-panel.mjs l.54, select-phase4.mjs l.36, runs.log); path i of
   a seed draws from seed + 7919 i (engine.mjs l.2926). Power: on the pilot (seed 7002) A1 was +9.5 and +9.25 points and
   its se over 40 couples at 5,000 paths is 0.07 to 0.32, so A1 decides; A2 was +2.6% and +3.5% against a bar of -1%.
3. Fairness. The pilot's units record every variable that can differ: rows 34 (share 0.5 by half), 35 (sweepCashIsaTo isa
   on CANDC, unset on SHIPC), 36 (coarse on CANDC with its setting, none on SHIPC), 37 and 38 (tieBreak, shortlist), with
   flat and fast. CANDC and SHIPC agree person by person in mix, lambda, levels, minPot, raiseW, finalIntegral and the
   estate weight; each couple's five units carry one inputs hash.
4. Scoring. In the engine (audit-phase4.mjs runPath, held to E.runTrial), the rollout in the exact model beside it; the
   engine is the build of the app's source as committed. On the pilot the two differed on 0 of 4,000 paths.
5. The registration against the code. Every statement about the audit, the stage gate, the batch and the read is as the
   code has it, but for one clause of the Design review paragraph (finding 3). The budget paragraph is the sizing file's,
   figure for figure; the landing paragraph is the results file's and the panel's.
6. The open choice: finding 5.

## Findings

1. MINOR. What a PASS no longer covers, and how much the S1 line can see. With S1 out of the rule, a fault or a real
   shortfall in the candidate's path for couples that costs less survival than A1's slack passes. On the pilot that
   slack was about 9 points (A1 +9.500, 8.086 to 10.914, and +9.250 at W0.01; `results-couples-pilot-d4b.txt`). The
   three things that stay do not see it: the check against E.runTrial sees a fault in the audit's own loop; the rollout
   beside sees the engine and the exact model parting on a path; the records see a wrong configuration. A table that is
   worse for a couple than the product's, executed faithfully, shows in none of them. The first form's S1 at -0.1 would
   have stopped it. That is D78's ruling and the registration says it (l.110-112, l.122-127), so nothing is asked of the
   design. For the read: the S1 line's note fires only when the whole interval is below -0.25. By the sizing's own se
   range a true pooled loss is noted with these chances (the interval's half-width 1.96 se):

   | S1's se | a true loss of 0.5 | of 1.0 | of 1.5 |
   |---|---|---|---|
   | 0.065 (the couples independent) | 0.97 | 1.00 | 1.00 |
   | 0.10 | 0.71 | 1.00 | 1.00 |
   | 0.15 | 0.38 | 1.00 | 1.00 |
   | 0.289 (the couples moving together) | 0.14 | 0.74 | 0.99 |

   So the write-up should give S1's interval beside the outcome and not read "no note" as "no loss against the product's
   settings" below about a point.

2. MINOR. No unit records that the household's joint move carried the sweep. Each person's record says
   `sweepCashIsaTo isa`, read from the table's meta (audit-couples.mjs l.182). The joint move takes it from
   couple.js `sweepOf` (l.610-613, l.637, l.665), and nothing in the `ran` line (l.322) says it did. The rollout beside
   and E.runTrial cannot see a move without it: both run the same joint move, which is how the fault first passed
   unseen. What holds a unit to it is the code tie (the run only on 1d5d2421c9ab, which has 0b047efd) and
   `couple-sweep.test.mjs` in FAST_JOINING (4 passed, its plant exact, here). That is enough on this code. If the audit
   is edited for any other reason, one more word in the record (the joint moves of the rollout beside carrying
   `sweepIsa`, counted from `runCouplePolicy`'s trace) would let the gate refuse such a unit itself, as it does for flat
   and fast.

3. MINOR (words in the registration). The Design review paragraph says the first form's MINORs 1 to 3 "stay fixed, each
   with its planted case (the run tied to the landing's code, ...)" (l.172-174). The two refusals that tie the run to the
   landing's code are inline in the command paths (audit-couples.mjs l.280; reduce-couples.mjs l.527-529) and neither
   `--planted` mode exercises them; the planted case that exists is the sizing's `codeLine` (size-couples.mjs l.177),
   which is about the pilot's units, not the run's. By reading both refusals are right, and the registered one runs
   before any solve. Several faults in question 1 rest on this tie (finding 2), so either say in that paragraph what is
   planted and what is read, or move the comparison into one exported function used by both with its planted case
   (CHECKLIST 5) and bring the diff back.

4. MINOR. The gate accepts a CANDC person with no joint tier state, and none of the 80 can be one. `coarseWant` keys on
   the unit's own `tierState`: a person recording `tierState null` with the anchors off for that reason passes
   (audit-couples.mjs l.192; reduce-couples.mjs l.103, l.212, and its planted pass case l.486-490), and `tierState` is not
   in WANT.CANDC. Every person of the panel has four pairs (the probe above), so on this panel such a record would mean
   the candidate without its tier changes. STATE.md's tier test puts about half of the gain over the app's rules in them
   on singles (CANDNC less APP +5.541 against CAND's +10.547, EXPLORATORY), so A1 would still pass. It cannot arise on
   the stamped files (the audit's `solverPlan` sets consent, l.177; the pilot's four CANDC units record
   `0/0,1/1,2/2,3/3` for both people). If the audit is edited, hold CANDC to the tier state for this panel; if not, the
   read's write-up can say from the units' records that all 80 people at each weight recorded it.

5. MINOR (question 6). The open choice is stated, once, in a parenthesis inside the Arms paragraph (l.51-54): "the other
   reading, a couple's person-solves leaving the key out, is the maintainer's to choose before launch, and choosing it
   means landing, the pilot and this review again". The consequence is plain. What the registration does not give is
   what the choice touches: 32 of the 40 couples start with cash ISA money (from 4,500 to 1,080,000 pounds; the eight
   without: S063, S189, S387, S309F, S321F, S327F, S333F, S345F), so the reading decides where the sweep sends money on
   most of the panel, in CANDC alone: APP and SHIPC sweep it to the taxable account. DECISIONS-PENDING.md l.103-109 has
   the choice in full, with the fact that item 5's experiment was on singles. Three things follow. (a) Launching is
   choosing the first reading; the choice should be a D-line before the launch, not the launch itself. (b) The tie is
   mechanical only if the other reading is made under src/ (the code hash moves and the registered audit refuses,
   l.280); made in the audit's `solveArm` alone it would move the audit hash and not the code, and then only the
   registration's sentence holds it. (c) The read has no split of A1, A2 or S1 by whether the couple holds cash ISA
   money, so its write-up cannot say how much of a gain is the sweep and how much the solve; on singles the sweep moved
   survival by 0 to +0.6 points a household (`results-isasweep.txt`, EXPLORATORY), small beside A1 and not small beside
   S1. No claim of cause either way without that split.

6. MINOR. The code can move between this review and the launch. D84 lets item 12's stage A run now and its stage B be
   built "off in code" if an arm passes; its files are in the tree, untracked, as this was written
   (research/solver/ITEM12-A.md, audit-item12.mjs, reduce-item12.mjs; seed 7002, no panel couple). Stage A touches
   nothing here. A stage B commit under src/solver before the launch commit moves code-id off 1d5d2421c9ab: the
   registered audit then refuses, safely, and landing, the pilot and this review are due again. D78 ruled "never between"
   for item 13's port; the same should hold for item 12's until the re-run has read, or the launch commit (the one that
   fills the Design review line) should be made first and the launch be from a worktree at it.

7. MINOR. The first stage fills its window. At the pilot's times the sizing's own schedule gives 11.97 hours on four
   cores against the 12-hour limit; at a twentieth slower it is two windows, 12.8 hours, with 0.6 core-hours lost to
   chunks cut off and run again. The batch handles that under RESUME=1 and no chunk is near the limit (0.47 h), so
   nothing is at risk but the registration's "one 12-hour window" (l.160-161). Anything else on the four cores during
   the run (item 12's stage A is 16,000 paths a couple) makes it two.

8. MINOR, for the read's statement. `solver-model.test.mjs` takes households by place (l.63 `spread(40)`, l.257
   `spread(60)`), and section H's 60 reach eight of the panel's base plans: S063, S133, S189, S259, S371, and S301, S329
   and S343 (the younger cohort's S301F, S329F and S343F as the library has them, not retiring at 52). None is in the
   frozen scan (couples-orders.json), which counted couple-lockstep's by-place picks only. On 11 Nov the section's bound
   was re-pinned on S329's figure (D72, l.275). It is a check of the reduced model against the engine under a fixed
   action: no table, no candidate setting, no seed 7021, and nothing of the candidate was chosen on it. Recording is
   enough, as D38 did for S368; the read's statement should name it.
