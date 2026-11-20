# Design review, second look: the savings split's v2 (`registrations/save-v2.md`), before launch

20 Nov 2026. This is the reviewer agent's final look before a confirmatory launch (CHECKLIST 2; D130 (7), D133, D134). My
first look PASSED with nine MINORs (`reviews/2026-11-20-save-v2-design.md`). This look checks three things:
- each answer against what its finding asked;
- D134 (2) and (3) against the rulings;
- the registration and the code it runs, as they would launch.

Nothing of seed 7025 was produced or estimated, and the registered batch was not run.

## What I read

At HEAD 180432fe (work-i58m0x). The commits since my first look (d958e8f1):
- e6a6dad3: the MINORs answered;
- 18dc0037: D134;
- 9039562a: D134 (2) in the read, and the preflight;
- 180432fe: the pilot again, and its sizing.

e55750f7, 95b1d2b0 and 1e205c2c touch none of this study's stamped files. The stamp is 627fc4a699d0 at e6a6dad3 and at
each of them.

HEAD moved to a1b70891 while I reviewed: dcf026d5, 9d334aad and a1b70891, step 8's port kept as a patch
(`drafts/hsp-port.patch`, not applied), with HSP-PORT.md, STATE.md, `runs.log` and `fast-inputs.json`. None of them is a
stamped file or the code. At a1b70891 the stamp is still a762a85e3a6d and the code id still 71fb4271c681.

- **The design:**
  - `registrations/save-v2.md` (blob 4c22066c17);
  - `SAVE-V2.md` (93034bb7e1), "The design review's answers";
  - STATE.md's D134 (dd772af449);
  - my first look (9e80821882).
- **The code, changed since my first look:** `audit-save-v2.mjs` (2e4e40bdb2), `reduce-save-v2.mjs` (f4b5916702) and
  `size-save-v2.mjs` (59714d6e52).
- **The code, unchanged since my first look:**
  - `save-v2-panel.mjs` (68a3f892aa), `batch-save-v2.sh` (e357485deb), `save-v2-panel.json` (40bc84062f) and
    `save-v2-orders.json` (0a0c7179ef);
  - `audit-phase4.mjs` `runPath` (5ace83959b), `reduce-phase4.mjs` `survivalItem` and `spendingItem` (ac319aad1f), and
    `reduce-gainbucket.mjs` `flipTest` (f7b4e88f1f);
  - `check-prediction.mjs` (818af86a4d);
  - `src/solver/solve.js` `researchFinish`, for the estate cap (b3c20b3e7f);
  - the engine's `calculateMarginalRelief` and its employment field (engine.mjs 779, 1370-1387).
- **The data:**
  - `save-v2-paths.json` (8b9dbc3e01) and `results-save-v2-sizing.txt` (cf12de4d7b);
  - `results-save-v2-preflight.txt` (f6519a60d9), its 36 logs (`results/save-v2-preflight/case0.txt` to `case35.txt`)
    and its launch log;
  - the final pilot (`results/save-v2-pilot/`: four units and their logs);
  - the first pilot (`results/save-v2-pilot-1/`, kept aside);
  - `runs.log`.

## What I ran

All of it was light and ran at nice 19, beside the late tail's run. The scripts are in the session's scratchpad.
- **The planted checks:**
  - `audit-save-v2.mjs --planted`: 13 of 13.
  - `reduce-save-v2.mjs --planted`: ALL PASS (16), and all 31 of the gate's refusals fire.
  - `size-save-v2.mjs --planted`: 5 of 5. `SIZE_SV2_PLANT=noholm` fails exactly the part 3 rate case, and `nofloor`
    exactly the `D_MIN` case.
- **Two plants of my own, each on a copy of the read:**
  - The sign-flip test at 100 flips, not 20,000. This is the fault my MINOR 4 named: part 3 blind among forty. Exactly
    the S308F-among-forty case fails (1 of 16).
  - The anchors' items never collected (`anchorsSpendFail = []`, `anchorsDown = false`). Exactly the two D134 (2) cases
    fail (2 of 16).
- **The stamp at each commit.** I computed it from git without a checkout, giving `stampFiles` a `read` and an `exists`
  that call `git show`:

  | commits | stamp |
  |---|---|
  | eef8c374, d958e8f1 | 17ca54eedf37 |
  | e6a6dad3 to 1e205c2c | 627fc4a699d0 |
  | 9039562a | f0a49255366e |
  | 180432fe | a762a85e3a6d |

  - `stampFilesHash()` on the working tree gives a762a85e3a6d.
  - `code-id.mjs` gives 71fb4271c681, the panel's.
  - `configOf` gives CANDD 3a344e9f7ec6, CANDS 3f7b0397f544, CANDDA 17ff82379838 (= `CANDIDATE_HASH`) and CANDSA
    bf1cac401c13, as registered.
  - `check-prediction.mjs` on the registration finds only Seed and Design review open. 7025 is not yet in the registry.
- **The final pilot's gate** (seed 7002, EXPLORATORY):
  - Through the read's `gate` at its own stamp, f0a49255366e: no refusal.
  - `reduce-save-v2.mjs --pilot` at HEAD: `THE GATE: REFUSED`, `a unit's audit is not these files' (a762a85e3a6d)`
    (finding 2).
- **The read's `report` on the final pilot's records.** I ran it to exercise its new lines on real records; no outcome
  of 7025 was involved.
  - Every line computes.
  - With a planted flag on S270 (40 of its CANDS paths lost), the levels-by-retired-year line runs: `CANDD 96.5 / 99.4 /
    104.7, CANDS 97.5 / 100.2 / 105.3`.
  - The 2029 share counts 38,000 decisions: S180's two years from 2029 and the other three households' twelve, on
    1,000 paths each.
- **A planted FAIL on part 2 alone.** I built the units as the read's own planted cases build them: survival the same
  on every path, and CANDS spending 1% more, with noise.
  - The rule gives `FAIL {"harm":true,"gain":false,"spend":true}`, with the pooled spending `+1.000 (+0.985 to +1.015)`.
  - The read prints `OUTCOME: FAIL: the split stays off and is closed as measured; to the maintainer` (finding 1).
- **The sizing, re-derived** from the final pilot's records with the sizer's own functions. I set its gate aside (see
  finding 2). Every figure is as printed:
  - N is 16,000, and each household's paired spending se and part 3's rates are as printed.
  - The scaling:
    - the library's sixteen households aged 55 (five working years) are scaled from S180;
    - its fourteen aged 45 (fifteen) from S270;
    - the younger cohort from S300F.
  - 46.49 core-hours; 12.27 hours on four cores in the batch's order; the longest household 1.280 hours.
- **The preflight's logs:**
  - There are 36 case files. Each has its done line, and none has an `audit-save-v2:` refusal line.
  - Units 0 to 7 are stamped 17ca54eedf37, and units 8 to 35 627fc4a699d0.
  - The launch log says the runs were done at 11:31 UK.

Verdict: PASS

## What holds

Each answer, against what its finding asked:

1. **The preflight (MINOR 1).**
   - It is a launch condition (registration lines 10-17), and it is met: 36 households, none refused, none exiting
     with an error. It is also to be run again if the checks change.
   - **The split across two stamps does not matter.** Between the two stamps' files (eef8c374 to e6a6dad3), the stamped
     files that change are `audit-save-v2.mjs`, `reduce-save-v2.mjs` and `size-save-v2.mjs`. The audit's changes are:
     - the pilot's places (65-67);
     - `baseYear` added to `seen` (211). `sameProblems` compares only inputs, T, retireT and the working years
       (126-131);
     - the records after the paths (217-241, 264-265, 269).
   - None of this touches the checks before any path (198-213, with `armProblems`, `settingsProblems` and `sameProblems`
     at 109-132) or anything they import. The code id did not move.
   - **Every household is covered once.** `notPilot` gives the same household for units 0 to 21 under either pilot list:
     the younger cohort's places 1-4 and 6-9, then the library's 1-14. Units 0-7 therefore name the same households on
     either stamp. So each of the 36 households outside the new pilot passed the checks once, on checks byte for byte
     the final ones, and the pilot's four passed them in the pilot.
   - **The eight units on the older files** did not run the new record lines (levels, estate cap, employment). Those
     lines ran on the other 28 and on the pilot's four, two of which are in the same cohort and of the same shape.
     Every panel plan carries `employmentSelf`.
2. **D134 (2) (MINOR 2): carried as ruled.**
   - **Under a PASS,** the outcome names each household failing part 3's household clause on anchors (Holm over the
     forty, the 0.1% bar), and the pair if its pooled survival interval on anchors lies wholly below nought. Each goes
     "to the maintainer with this read before any change of default (D134 (2))", and the rule is unchanged
     (reduce-save-v2.mjs 141-144, 155).
   - The directions are right: `compare(units, 'CANDDA', 'CANDSA')`.
   - Its planted cases pass, and fail on my plant.
   - The registration's Arms section says the same (lines 51-55).
   - For the maintainer: at S308F's own noise on 4,000 paths (se 0.0562%), an S308F-sized loss is named on anchors with
     chance at least 0.923, and a 0.12% loss with chance 0.187 (`part3Rate`, Holm's worst rank).
3. **D134 (3) (MINOR 3): carried as ruled.**
   - The registration states the limitation, which way it leans, and the ruling (lines 39-47).
   - **The read's share** (169-177) runs over the employees' runPolicy decisions, each dated `baseYear + t`:
     - `selfEmployed` comes from `employmentSelf === 'self-employed'`. The panel holds 30 'employed' and 10
       'self-employed', as the registration says;
     - the engine relieves every 'employed' saver's sacrifice of NIC, uncapped (engine.mjs 779, 1370-1387);
     - on the pilot it counts the right decisions (above).
   - The code id is unchanged, so the run is as is.
4. **Part 3's operating characteristic (MINOR 4).**
   - The rates are in the Decision rule (lines 99-105). I re-derived each one.
   - `part3Rate` takes the bar or Holm's worst-rank bound, whichever is larger. At these noises the bar binds.
   - The S308F-sized case among forty passes on the code and fails on the coarse sign-flip test (above).
5. **The pilot (MINOR 5).**
   - The library's place 23 (S270, fifteen working years) replaces place 15, and the sizing scales all fourteen
     fifteen-year library households from it.
   - The pilot ran after the preflight ended (11:31), and its chunks' load stayed between 1.38 and 4.37 with its own
     four units on four cores. The next launch in `runs.log` is the late tail's, at 12:10 UK.
   - The budget's 12.3 hours passes the 12-hour task limit. The registration counts the longest household once more for
     the relaunch under `RESUME=1`.
6. **A PASS's reach (MINOR 6).**
   - The PASS line commits the change of default to a guard keeping a couple's solves off the split, with its test and
     plant.
   - It lists the solves a PASS reaches untested (lines 109-113).
7. **Beside the rule (MINOR 7).**
   - **Spending levels:** every arm keeps each year's level on every path (audit 217-235). The gate holds each arm to
     `n x Y` levels (99). On the pilot the levels are nought in the working years and 80, 90, 95, 100 or 110 after.
   - **The estate cap:** each arm records its cap (gate 100). On the pilot it is equal across a household's arms:
     £720,000 or £3,800,000.
   - **The read prints:**
     - the cohorts apart (164-168);
     - the pot left by household, as its mean, its median and the mean capped at the estate cap, as earlier reads capped
       it (187-193);
     - the levels by retired year of a flagged or failing household (194-198).
8. **The Outcomes (MINOR 8).**
   - **(a)** A gate refusal gives no outcome (lines 117-118). The read exits 3 with the gate's lines.
   - **(c)** The clause on later edits is there (lines 7-9). The registration's edits since then are within it: the
     launch conditions' status, D134's words, Paths, Budget and part 3's rates (`git diff e6a6dad3 180432fe`).
   - **(b)** The exception is in the registration but not in the read: finding 1.
9. **The gate (MINOR 9).**
   - Each paired arm's settings line must equal its pair's, byte for byte (106). There are two planted refusals, on
     fields the wanted list leaves out.
   - Levels, the estate cap, employment and the base year are required, each with its planted refusal.
   - On the pilot the paired lines are equal.

**The rest of the design stands as at my first look.** Its arms, pairing, seed, panel, rule, gate, fencing of the
registered run and power are unchanged in code and data. The registered run reads `save-v2-paths.json`: 40 households
at 16,000 paths.

## Findings

1. **MINOR: in the one case where the registration says the split is not closed, the read prints that it is closed.**
   MINOR 8 (b)'s answer is in the registration, but not in the read.
   - **What the registration says** (lines 114-116): a FAIL on part 2 alone, with parts 1 and 3 holding and the pooled
     lifetime spending up beyond noise (its interval by path above nought), comes back to the maintainer as the trade it
     is. It is not closed.
   - **What the read prints.** Its OUTCOME line (reduce-save-v2.mjs 155) has no such branch: every FAIL prints "the split
     stays off and is closed as measured". On the planted units above it prints exactly that.
   - **Why it matters now.** The figures the exception needs are printed: parts 1 to 3, and the pooled spending interval
     by path (`spendingItem`). So the registration could still be applied by hand. But the read is in the audit stamp
     (`STAMP_ROOTS`, audit-save-v2.mjs 76), so after the launch it can change only by an amendment under an unlock, as
     D125 and D126 were.
   - **The ask:** before the launch commit, make the FAIL branch print the exception where `!parts.gain && parts.harm &&
     parts.spend && C.spend.pooled.lo > 0`: the trade, to the maintainer, not closed.
     - Name there the anchors' items the PASS line names. The maintainer would need them to take the trade (D133 (3):
       before any change of default).
     - Add a planted case each way: the case above, and the same case with the spending interval straddling nought,
       which is closed.
     - A change limited to that branch and its two cases is covered by this review. It needs no new pilot, since nothing
       the pilot or the sizing computes reads it. Anything wider comes back.
2. **MINOR: the audit stamp at HEAD is a762a85e3a6d, not f0a49255366e. The pilot's own gate and the sizing refuse there.**
   - **Why it moved.** The stamp holds `save-v2-paths.json` (`STAMP_DATA`, audit-save-v2.mjs 77). The sizing writes that
     file from the pilot after the pilot has run, with a time in it (`built`, size-save-v2.mjs 121). So the stamp moved
     from the pilot's f0a49255366e (9039562a's files) to a762a85e3a6d (180432fe's), and any later sizing moves it again.
   - **The pilot is still on the final files in substance.** The two stamps differ in that one file:
     `git diff --stat 9039562a 180432fe` lists the registration, the sizing's text and the paths file, and only the last
     is stamped. The pilot reads no paths file (`reg` is read only under REGISTERED, audit-save-v2.mjs 185). So the
     pilot is on the final files in substance, as the registration says.
   - **What refuses at HEAD.**
     - `reduce-save-v2.mjs --pilot` refuses the pilot (exit 3).
     - `size-save-v2.mjs` would refuse at its own gate (94) before printing anything.
     - So the sizing's figures reproduce only on 9039562a's files, or, as here, from its functions with the gate set
       aside.
   - **The ask:** wherever the launch's stamp is given (the launch commit, the report to the maintainer):
     - give the stamp the launch computes, not f0a49255366e;
     - name the stamped files that differ from the pilot's: the paths file, and the read if finding 1 is answered.
