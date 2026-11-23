# Review before a change of default, second look: D138, the savings split for singles who work and save

Subject: the answer to my first look's FAIL (`reviews/2026-11-21-default-save-split.md`, 81082a73: two BLOCKING, four
MINOR), in one fix round (D81 (F)). The change is in the worktree `/home/user/save-default` (branch save-default, from
d60c485f, uncommitted; I read `git diff HEAD` whole).

Also covered: the coordinator's two additions since the brief:
- `state.mjs`'s `cand29` block;
- V1 and V2 on the new candidate 06bc8f910b3f.

## What I read

- **The main tree at 1b9268e1** (blobs):
  - `STATE.md` 27a86262bc7f, whole; `CHECKLIST.md` 45e387294c8d; my first look 5a281bb1e39b;
  - `DECISIONS-PENDING.md` 971b2ce37496, lines 14-47 and 160-182;
  - `reviews/2026-11-21-read-save-k-2.md` 65ee4811239d; the deep review 1a8fff55841e, section 3;
  - `results-save-k.txt` 9c0203e987b1; `results-save-k-beside.txt` dda91763b7fd, C; `results-save-v2-beside.txt`
    47bbc8f06ba2, A;
  - the two kept patches' commits, fefafe6d and 1b9268e1.
- **The worktree's source** (blobs):
  - `src/App.jsx` 13df872c24c5: 1405-1480, 2290-2409, 3575-3620 and the caption;
  - `research/engine.mjs`, git-ignored, built from that App.jsx: it carries `differs` and `SAVE_NIC_CAP`;
  - `src/solver/solve.js` a86716b79be9: 1136-1155, 1704-1747, 2005-2015, 2160-2170, 2246, 2310-2320, 2912-3010;
  - `src/solver/fast.js` d1826354ee4a: 222-262, 437, 474;
  - `src/solver/model.js` ed0897d3c30b: 257;
  - `src/solver/bridge.js` da9362efe86b: 26-45;
  - `src/solverKey.js` a448cf257400, `src/PlannerCards.jsx` cc9de38e1653, and the other src blobs as at my first look.
- **The worktree's research files** (blobs):
  - `research/solver/state.mjs` 8d74a0377e4f, its `cand29` block as edited at 03:20 UTC;
  - `d138-fulltier.mjs` 5223ad1047c6, `d138-lockstep.sh` 37defef6b8ab, `save-default-identity.mjs` d4590ef55e68,
    `v-candidate.mjs` b80231644bc5, `e3pcls-pin.json` e3dca08e2067;
  - `audit-e2x.mjs` cd3ecd5e85c3: 40, 55-74;
  - the results files: `results-d138-fulltier.txt` 3ea906e13b1e, `results-d138-lockstep.txt` 83ae2df712be,
    `results-save-default.txt` 44dc21eae8f1, `results-save-default-identity.txt` 7836b7c8471e, `results-d138-fast.txt`
    0c5ac619b4e5.
- **The tests:**
  - `save-default.test.mjs` 1c34f7f7333e, whole;
  - the diffs of `couple-tables` 6a73a66d6368, `lock-tiers` 958a936d044f (and its 60-175), `shortlist-shown`
    f9f63153fe56, `chooser-once` 9702e513f87a, `gaps-sweep` 365eaa74b619, `allowance-both` a31bfe000649,
    `couple-solve-client` f75eb345479f and `household` 394cdf268f7b;
  - the four protected builders' solves: `state-check` c739694cdb48 (38, 58, 117), `n4-menu` 79b828f3de1b (137, 162,
    229), `speed-port` a383281a1ec9 (32-53, 196), `tier-steps` ef2e0b2b198e (83, 100);
  - `research/ui-harnesses/phone-perf-ui.cjs` 9652a583925c (58-65);
  - how the full tier is run: `run-all.mjs` (51), `run-shard.mjs` (28, 50), `.github/workflows/full.yml` (49).
- **The agent's files in the session scratchpad:**
  - the runner and its record: `fulltier.mjs`, `fulltier-d138.log`, `fulltier-notes.md`, and the tier's logs of
    lock-tiers, couple-tables, shortlist-shown, chooser-once and gaps-sweep;
  - `candidate-test-d138.log`, `d138-line-draft.md`;
  - V1 and V2: `results-v-candidate-d138.txt` and `v-cand-d138/`.

## What I ran

Read only, at nice 10, one process at a time beside the coordinator's V1/V2 (at nice 5). My scripts are in the session
scratchpad's `rv2/`. Every run is EXPLORATORY; the only seed of the registry read is 7025, already read by its registered
read.
- `save-default.test.mjs`: ALL PASS, 9 of 9 (109 s).
  - `--planted`: each of the six plants fails exactly its wanted checks: 'couplesplit' 4, 'nosavepart' 5, 'nattables' 6,
    'noisahold' 7 and 9, 'nocap' 8, 'anyroute' 9.
- `save-default-identity.mjs /home/user/sv2-launch`: line for line `results-save-default-identity.txt`, the solve times
  aside.
  - 4 of 4 units IDENTICAL on 1,000 paths of seed 7025;
  - the 2029 route: 260 of 260.
- `couple-solve-client.test.mjs`: ALL PASS, 6 checks. Check 6 gives 9c3e304722255a5e, its new pin.
- `page-candidate.test.mjs`: ALL PASS, 1 check: the page, the app and the research candidate all 06bc8f910b3f.
- The e3pcls pin: 6310f87d90e86c00 (21 Nov, 23:00 UK).
  - The code's fingerprint now is the same.
  - The test's blob is c75f5d8ac501, as pinned.
  - The code id is 5eef43e81abe, which `household.test.mjs` (7d) now pins.
- Scans, no solve:
  - `differs-scan.mjs` and `differs-year.mjs`: the library singles' routes, year by year;
  - `self-scan.mjs`; `gate5-erpass.mjs`, with the pass-through counted on its own key;
  - `passthrough.mjs`.

Verdict: PASS

Each first-look finding is answered in the code and the results files. What remains is four MINORs, the first being the
second half of BLOCKING 2's fix, which no check can fail.

## Findings

1. **MINOR. fast.js's half of the BLOCKING 2 fix has no check that can fail.**
   - **The fix reads the year to choose over the routes offered in two places:**
     - `saveOn` (solve.js 2986), over the whole plan;
     - the forward run's live years (fast.js 231, 255), year by year.
   - **Check 9 cannot see the second.** Its last part (save-default.test.mjs 247-249) holds S188's live years to its
     pension-first years: "its copies live in 5 years, the pension first differing in 5".
     - In all five of S188's working years both routes differ: `differs[1]` and `differs[2]` are true at plan years 0
       to 4 (`differs-scan.mjs`).
     - So live years read over both routes would be the same five, and the check passes with fast.js's filter taken out.
     - The plant 'anyroute' acts in `saveOn` alone (2986). fast.js 255 reads `differs` whatever the plant.
   - **Where the filter does act.** Of the library's 60 employees with a year to choose, 20 take copies and have one
     working year where only the ISA first differs:
     - fifteen working years: S242, S246, S254, S258, S266, S270, S278, S282, S290, S294;
     - twenty-eight: S302, S306, S314, S318, S326, S330, S338, S342, S350, S354.
     - S242's year is plan year 12 (age 57), and S330's plan year 18 (age 55). There the pension's room is the plan's own
       contribution (£6,415.92 and £13,789.71), so the pension first is the plan's own (`differs-year.mjs`).
   - **Why MINOR.** Without the filter, such a year's copies would flow as their base, the plan's own amounts (App.jsx
     3584; fast.js 259-260). That costs work, not money.
   - **Fix.**
     - Add a case on one of the twenty: S242 under the hold, plan year 12 not live; at the registered configuration,
       live.
     - Add a plant in fast.js's read: the year read over both routes there.

2. **MINOR. The lockstep unlock is asked for four protected tests; the default reaches one of them.**
   - **What the ask says** (`DECISIONS-PENDING.md`):
     - 16-20: four tests "build the move they hand the engine by hand" ... "Since D138 a working saver's move carries
       `save`, so on a working saver under the new default the engine runs the plan's own saving where the forward run
       runs the move's";
     - 24-25: "The `--full` forms of the other three are not in the full tier; two of them name S224";
     - 29-30: "no figure any of them pins moves (each run before and after)".
   - **What the code does.**
     - Only `state-check` solves on the candidate (state-check.test.mjs 38, 117: `solveCandidate`).
     - The other three solve with fixed options that carry no split, in either form:
       - `n4-menu`: `solvePlan` with its own options (162, 229);
       - `tier-steps`: `solvePlan` (83, 100);
       - `speed-port`: `D29_OPTS`, taken from `BEFORE_D73_OPTS` (50, 53, 196).
     - No move of these three carries a save, so D138 cannot reach their builders. Their `--full` forms are in no tier
       and were not run, and need not be.
   - **Why it matters.** Unlocking a protected file is the maintainer's word. The ask should say that D138 needs
     `state-check.test.mjs` alone, and that the other three are the same class and preventive. The maintainer can then
     unlock what this change needs, or all four by choice.

3. **MINOR. Your MINOR 4 (a), the employer's NIC passed through. Stating it is enough for this commit, but it must go to
   the maintainer as a part of D137 (4)'s price the routes do not carry.**
   - **Why stating is enough here.**
     - No panel, no test and none of the library's 420 plans sets the pass-through (`employerNicPassThrough`, default 0:
       App.jsx 482, 1216).
     - Pricing it in the routes alone would part their sacrifice from the engine's taxable pay, as the comment says. The
       engine infers the sacrifice from the credit over the whole factor (`taxablePayOf`, 1456-1460). Mending that is the
       engine change D134 (3) queues.
     - The caption is accurate: the cap is not modelled "except on an employee's own National Insurance where the solver
       chooses where a year's saving goes".
   - **What it leaves.** From April 2029, by the app's own functions (`passthrough.mjs`: S180's rUK context, £30,000, a
     sacrifice already past £2,000), a further net pound buys this much pension:
     - with no pass-through: £1.25 under D138's cap, the law's price (income tax relief alone);
     - with 100% pass-through: £1.4375 under the cap, 15% over the law's £1.25; uncapped, £1.5972.
     - So for such a plan the cap removes 46% of the over-price.
   - **Why it goes to the maintainer.**
     - D137 (4)'s branch is "the law's price in the split's two routes". The deep review it follows set that price for
       "a working single with no pass-through (all 40)" (section 3).
     - The D-line draft (line 13 (a)) gives the size. It does not say that, for a plan that sets the pass-through, the
       change does not carry the ruling, and it does not put that to the maintainer.
   - **Fix.**
     - Say so in the D-line.
     - Put it in `DECISIONS-PENDING.md` with the options: stated, as now; or no pension first from April 2029 where the
       pass-through is set, until D134 (3).

4. **MINOR. Two of the change's records do not stand on the commit's code or in the repository.**
   - **The full tier's record.** The full tier on the final code is recorded only in the session scratchpad
     (`fulltier-d138.log` and 219 logs), which a reboot can clear. The D-line draft's line 11 rests on it ("211 of 219
     passed", and each of the eight). It is not in CI either, since the build is not pushed (CHECKLIST 6).
   - **`results-d138-fast.txt`, a new file in the change, is the first build's.**
     - Its header says "code ae7ad547d29d", and it was written at 22:08 UTC.
     - That is before the fix round's edits to fast.js (22:46) and to App.jsx and solve.js (22:56).
     - Nothing cites it.
   - **Fix.**
     - Commit the tier's summary as a results file with the change (its 219 lines and the notes on the eight), or cite
       CI's Full on the pushed commit.
     - Re-run `results-d138-fast.txt` on the final code, or leave it out.

## How the first look's findings were answered

1. **BLOCKING 1, the full tier: holds.**
   - **The tier ran whole on the final source.**
     - fast.js, App.jsx and solve.js were last edited at 22:46 to 22:56 UTC; the tier ran 23:00:52 to 02:58:34.
     - The e3pcls pin was re-taken at 23:00:12.
     - The runner is CI's: every `*.test.mjs`, spawned with no arguments (run-shard.mjs 28, 50).
   - **The re-pins.** In `results-d138-fulltier.txt`, with both keys out, each of the 11 figures is the one pinned
     before. As the candidate now is, 6 move: S224's three (1,600 moves), S328F's two (2,400 moves) and the keys' digest.
     S116's and S090's, with no year to choose, are the same (800 moves).
     - couple-tables check 6 solves as the script does. The script's "now" figures are the new pins, and the test passes
       on them, 8 of 8.
     - lock-tiers passes 36 of 36 on the new pins. Its 3d now runs on S328F with the split (2,371 decisions).
     - couple-solve-client passes 6 of 6 on my run.
   - **The re-bases.** shortlist-shown (6 of 6, 4,593 decisions on a shortlist) and chooser-once (10 of 10, none falling
     back) each carry the header the finding asked for.
   - **gaps-sweep** failed 12 of 60 in the tier: nine cases on S224, three on S330F. With its builder fixed, all 60 pass
     (`results-d138-lockstep.txt` part 3).
   - **The rest.** page-candidate is fixed, and household (7d) pins the code id it is now. candidate.test.mjs passes 59 of
     59 with the block's entry given both keys: the entry its log shows carries `"saveSplit":true,
     "saveIsaFirst":"selfEmployed"`.
2. **BLOCKING 2, copies for no choice under the hold: holds over the whole plan; the per-year half is finding 1.**
   - `saveSplitRoutes`' `differs` (App.jsx 3615-3619) and `saveOn` (2984-2989) give no copies to an employee whose
     pension first is never different from the plan.
   - Check 9 holds both of its cases to the candidate before D138 to the bit, and 'anyroute' fails it.
   - At the registered configuration nothing changes:
     - `offered` over [1, 2] is the old "any";
     - fast.js over [1, 2] gives the old live years;
     - the identity agrees.
3. **MINOR 3: holds.** The solve.js comment (2936-2944), check 6's header and `DECISIONS-PENDING.md` 173-181 each say no
   decision could change, and why.
4. **MINOR 4:** (b) and (c) are stated; (a) is finding 3.
5. **MINOR 5: holds.**
   - **The list.** The draft's "by inference only" list (line 14, with lines 2 and 12) holds every item of my MINOR 5:
     - the registration's list, the lock as a mechanism, and the years from 2029;
     - the panel's plans and a blank salary;
     - the deep review's two;
     - the employees' arm as it ships;
     - the cap's three gaps;
     - the cost, the speed mode idle.
   - **Every figure in it is its file's:**
     - `results-save-k.txt`: `+0.590` (`+0.518` to `+0.662`), `+0.428` (`+0.371` to `+0.486`), K `0.726`, S336F
       `-0.275`;
     - `results-save-k-beside.txt` C: D34 flags none, part 3 fails none;
     - the identity: 260 of 260;
     - `results-save-default.txt`: 9 of 9;
     - `results-d138-fulltier.txt`: every digest;
     - `results-d138-lockstep.txt`: 3 of 14, £1.9e-9;
     - `results-save-v2-beside.txt` A: `x2.10`, `x1.10`;
     - the tier's log: 12 of 60.
   - **Its claims hold in the code.**
     - Gate 5's four households have no year to choose. S126 and S370 have none, and 'bridge 4' and 'share 0.50' are
       built retired (audit-e2x.mjs 69-73).
     - phone-perf's fixture is an employee saving £12,000 into the pension and £6,000 into the ISA (phone-perf-ui.cjs
       59-62), so B1's gate measures the split's cost.
6. **MINOR 6: holds.** The asks are in `DECISIONS-PENDING.md` 34-46, and the draft says each is missing and why (line 5).

## The brief's question: may the change be committed with state-check-full red?

Yes, on the working branch, with batch 11 held until the unlock.
- **The red is the protected test's builder.** Its copy with the two fields passes 14 of 14, the pension in step to
  £1.9e-9 (`results-d138-lockstep.txt` part 2).
- **The product's own path is in step on working savers under the split.**
  - V2 runs the engine through `withTable`: S224 and S330 are 0 / 0 of 2,000 (`results-v-candidate-d138.txt`).
  - gaps-sweep, its builder fixed, holds the class in the full tier while the protected file is red: 60 of 60, with S224's
    and S330F's cases.
- **It is named and kept off `main`.** The commit and the D-line name it (draft line 11). B1's gate keeps it off `main`
  until Full is green (D92).

Until the unlock, read Full's red on that file by its count: 3 of 14, on S224.

## The coordinator's two additions

- **`state.mjs`'s `cand29` block** (8d74a0377e4f): its patterns match the lines of the candidate test's whole run.
  - The D138 line, "the candidate before D138 reproduces its hash 17ff82379838 (17ff82379838); the candidate 06bc8f910b3f
    adds saveSplit, saveIsaFirst; with the split alone, the registered CANDSA's bf1cac401c13 (bf1cac401c13)", gives
    17ff82379838, 06bc8f910b3f and bf1cac401c13.
  - The D90 line gives af001697ce1b, and the count line "59 passed, 0 failed".
  - `pick` throws on a line it cannot find, so a broken pattern fails at the commit.
  - A file not yet in the tree prints "pending" (state.mjs 20-26, and the block's first lines). So
    `research/solver/results-v-candidate-d138.txt` and `research/tests/results-candidate.txt` must be in the tree before
    `state.mjs --write`.
- **V1 and V2 on 06bc8f910b3f.**
  - V1: ALL PASS on 7 of 7 households.
  - V2: the controls' bar 1, and every household 0 / 0 of 2,000 on seed 99001.
  - The plan preparation keeps the contributions, and `solveCandidate` takes the candidate as it is (v-candidate.mjs
    50-51). So S224 and S330, both employees, ran with the split, the hold and the cap.
  - That is fidelity (the engine against `runPolicy`), not an outcome.

## Checked, and holding

- **Nothing in the fix round moves a figure that the registered read, K or the identity rests on.**
  - The registered read and K ran from the launch tree at a83cd90b (code 71fb4271c681). That tree is untouched: its
    status shows only the launcher's log and the read's output.
  - The fix round changes:
    - which years are live, for an employee under the hold alone;
    - the tax given to copies left out. Only the share check reads it: the tie-break reads tax among near-ties, and a
      copy left out scores minus infinity.
    - words, a key plant and tests.
  - The identity's units (employees at the registered configuration, the self-employed at the default) reproduce.
- **Every scorer that takes the scores passes the tax too** (solve.js 2014, 2169, 2317). The other two callers of
  `movesAt` read the count alone (2094, 2252).
- **A solve split across workers, or restored, carries the moves a year.**
  - It ends in `researchFinish` (1745).
  - The backward pass takes the moves a year from the compiled model itself (1144).
- **A copy whose route does not differ is never priced otherwise than its base.**
  - The engine and the exact model apply a copy's route whenever its move has a save (App.jsx 2267; model.js 257).
  - A route that does not differ carries the plan's own amounts.
- **The employee's cap, priced in the routes alone, is coherent with the engine for a single.**
  - A working single's take-home is not computed (App.jsx 2376-2389, under `anyRetired` alone).
  - Taxable pay takes the whole sacrifice (2319-2325), as income tax does in law after 2029.
- **The self-employed have no route that never differs from the plan.** If one had, its copies would duplicate their
  base in every year, unread by finding 1's fix. None of the library's 30 self-employed with a year to choose has one
  (`self-scan.mjs`).
