# Review before a change of default: D138, the savings split for singles who work and save

Subject: the change built and not committed in the worktree `/home/user/save-default` (branch save-default, from d60c485f;
`git diff HEAD` read whole). By D137 and the registered read it names (`registrations/save-v2.md`, `results-save-v2.txt`,
PASS), with test K's outcome (`results-save-k.txt`, THE CAUSE HOLDS IN SIZE): `saveSplit: true` and `saveIsaFirst:
'selfEmployed'` join the candidate and `APP_CANDIDATE` (06bc8f910b3f; before it 17ff82379838; the split alone, the registered
CANDSA's, bf1cac401c13); a couple's solves keep it off (`solveForApp`, a solve with the partner's age); the split's two routes
priced with the 2029 cap on salary sacrifice's NIC relief (`SAVE_NIC_CAP`); the worlds' moves a year (D137 (5)); the page's
words for a save; `save-default.test.mjs`; `candidate.test.mjs`'s pins; six tests re-based without the split.

## What I read

- The main tree at 7036b700 (blobs): STATE.md 27a86262bc7f (whole; D137 whole), CHECKLIST.md 45e387294c8d,
  `DECISIONS-PENDING.md` 24d06c2845e3 (lines 14-128); `registrations/save-v2.md` 31b8397a480a, `results-save-v2.txt`
  8d2cfbcf11f4, `results-save-v2-beside.txt` 47bbc8f06ba2 (A to C), `SAVINGS-SPLIT.md` 289229f414d4; the reviews at the read
  31e7f5058cc6 and the deep review 1a8fff55841e; `SAVE-K.md` 8d903defc206, `results-save-k.txt` 9c0203e987b1,
  `reports/2026-11-21-save-k-read.md` d9567197494c, `reviews/2026-11-21-read-save-k.md` 7c8c6b6c92af and `-2.md`
  65ee4811239d.
- The worktree, the files as they stand (blobs): `src/App.jsx` 27a1576e2746 (1393-1477, 1765-1775, 2255-2262, 2378,
  3555-3610, 3684-3767, 3966, the caption at 12665) and `research/engine.mjs` built from it; `src/solver/solve.js`
  a034c26fdc02 (115-190, 410, 1704-1746, 1782-1925, 2086-2331, 2905-3002); `src/solver/fast.js` e30880dcc519 (222-258, 434,
  471); `src/solver/model.js` (257-258, 339); `src/solverApp.js` a822d56e2e09; `src/solverSettings.js` 9b833da7e794;
  `src/solverStrategy.js` 143c7611a137; `src/solverWords.js` a38dc0cb06b4; `src/solverClient.js` bd27a8004521 (54-354);
  `src/solverWorker.js` 4acaebe7f9ca (90-176); `src/solverCouple.js` ecedc57eedbb; `src/solverKey.js` 95071059c291;
  `src/solverCache.js` (97-165); `src/useSolver.js` (60-66); `research/solver/candidate.json` e3c8dba38f47, `candidate.mjs`
  2b7223729303, `state.mjs` e555245f18bb, `e3pcls-pin.json` c6d9b0e548a0, `save-default-identity.mjs` d4590ef55e68,
  `audit-phase4.mjs` (188), `fair-variables.mjs`, `audit-household.mjs` (118), `audit-household-hsp.mjs` (183),
  `audit-late-tail.mjs` (226).
- The tests: `save-default.test.mjs` d1d1e5e505ee, `candidate.test.mjs` beb4de960703, the six re-based
  (`chooser-shortlist` caae011b30e2, `chooser-tie` 24f0f440503a, `isa-allowance` 757f0bd2204d, `save-split` 142aff26afee,
  `windfall-relief` b8929ca60f86, `windfall-split` f6b774986a1f), and four of the full tier the change reaches and does not
  name (`couple-tables` b3a62624b25a, `lock-tiers` 7cb7a34bd911, `shortlist-shown` ffbc58962a16, `chooser-once`
  2535c840727d); `run-all.mjs`, `.github/workflows/full.yml`.
- The results: `results-save-default.txt` 541c295b094a, `results-save-default-identity.txt` 47b6a8f2be3c,
  `results-d138-fast.txt` 0c5ac619b4e5.
- The registered code, the launch worktree `/home/user/sv2-launch` at a83cd90b: `src/solver/solve.js` 1728, 1871,
  2970-2976 (read only; nothing of seed 7025 opened).

## What I ran

On the worktree, read only, at nice 10, one process at a time except where said; my scripts are in the session scratchpad's
`rv/`. EXPLORATORY, light settings, no held-out seed.
- `save-default.test.mjs`: ALL PASS, 8 of 8 (70 s). `--planted`: each of the five plants fails exactly its check.
- `shortlist-shown.test.mjs` and `chooser-once.test.mjs`, whole, on the build (finding 1).
- `pins.mjs`: `couple-tables` check 6's S224 and `lock-tiers` check 1b's S328F e5, each solved as its test solves it, with
  the split and with it taken out (finding 1).
- `savers.mjs`, `savers2.mjs` (no solve): the library's and Phase 4 panel's plans the split reaches, and which of the 82
  tests that solve with the candidate name one.
- `holdonly.mjs` (no solve) and `pensiononly.mjs` (finding 2). `pensiononly.mjs` ran while `chooser-once` ran beside it, so
  its times are a guide.
- `lock-split.mjs`: the dial's lock with the split's copies on the menu (below, Checked).
- `candidate.test.mjs` on the build; the candidate's hashes from `candidate.mjs`; the e3pcls pin against the code.

Verdict: FAIL

## Findings

1. **BLOCKING. The full tier fails on the build in four tests the change does not name, so its account of what it moves
   does not stand.** The change re-bases six tests (D137 (2), (3)). It reports the fast tier (76 of 77, `check-state`
   alone) and `save-split` running. The full tier is every file in `research/tests` (`run-all.mjs` 51, CI's `full.yml` 49),
   and 26 of the 82 tests that solve with the candidate name a working single the split now reaches (`savers2.mjs`; not
   every one solves it with the candidate). Four of them fail, run or reproduced on the build:
   - **`couple-tables.test.mjs` check 6** (a single's tables pinned bit for bit, 343-382; S224 solved by `solveForApp` at
     its LIGHT settings). S224 is an employee with five working years, so it now takes the split: tables `6f9b367a1be2`
     against the pin `401e8096847f`. With `saveSplit` and `saveIsaFirst` taken out it gives the pin. Its runs and reads,
     pinned beside, follow the tables.
   - **`lock-tiers.test.mjs` check 1b** (the pins 81-101, the check 157-162; the solve on the candidate as it is). 'S328F
     e5' is self-employed with fifteen working years, 2,400 moves: `0070499cc265` against the pin `79d3eb8d19e0`. On
     `BEFORE_D138_OPTS` it gives the pin. 'S328F loop' was not computed; the cause is the same.
   - **`shortlist-shown.test.mjs`** (S328F, the app's solve): 3 passed, 3 failed.
     - Check 3: "the strategy's runs 0 decisions on a shortlist".
     - Checks 5 and 6, its plants: "differing: NONE"; "0 of 610 years' moves differ".
     - The split sets `r.nAt`, and the chooser takes no shortlist where `r.nAt` is set (solve.js 1857). The guard D90 asks
       for has nothing to guard on this household, and its plants catch nothing.
   - **`chooser-once.test.mjs`** (P1's memo): 8 passed, 2 failed.
     - Check 1 on S224 CAND: "the repeats found once a decision at 0 decisions, 820 falling back" (`decisionRepeats`
       returns null where `r.nAt` is set, 2246).
     - Check 4, its plant 'oncerep': "no throw".
     - So P1's test and its plant are disarmed on S224 CAND.

   Not run:
   - the rest of the full tier: the tests naming S188 (`solver-figures`, `solver-rows`, `solver-strategy`), S224
     (`planner-figures`, `gaps-sweep`) and S340F (`pay-where`), and the library-wide sweeps;
   - `windfall-split` and `isa-allowance`, re-based, whose "every figure the same" is not shown on the build;
   - `candidate.test.mjs`, which stops at its first failure, the decided-defaults block (line 33, which the commit
     writes). So none of its new pins (50-59) has run. The hashes they name are right (`candidate.mjs`: 06bc8f910b3f,
     17ff82379838, bf1cac401c13, af001697ce1b, d71f65ae871e, e65e5e99ba49, a61dba4ee1f5, fcd8096217b7).

   Why it bears on the change:
   - D137 (2) and (3) ruled on the list the agent put as the tests the split reaches. There are more.
   - Two of the four (shortlist-shown, chooser-once) test speed machinery that the default turns off on their households.
     It is the same `r.nAt` the read's reviewer found (MINOR 1). A pass after a re-base would say nothing about a working
     saver, and each test's header must say so.
   - Two (couple-tables, lock-tiers) pin a single's tables. Re-pinned on the new candidate, they keep the default under
     test: lock-tiers' 3d then tests the dial's lock with the split's copies, which holds on my replication (below).
     Taking the split out of them would hide the default from both.

   Fix:
   - Run the full tier on the build before the commit, locally or as CI's Full on a pushed branch of the build.
   - For each failure, either re-pin on the new candidate with its working (the old figure with the split taken out, as
     D73's `d73-fulltier.mjs` printed), or take its solves without the split where it tests machinery the split turns off.
   - Name each in the commit and the D-line. None of the four is in FAST or FAST_JOINING, so no unlock is needed.

2. **BLOCKING. Under the hold, an employee who saves into the pension alone pays the split's whole cost for no choice.**
   - **What the code does.**
     - `saveOn` (solve.js 2969-2982) asks whether some working year has a choice from `ctx.saveSplitAt(t)`.
       That is non-null wherever either route differs from the plan (App.jsx 3604: `if (s1 !== plan || s2 !== plan) any =
       true`).
     - Under the hold it then returns `[1]`, without asking whether the pension first differs from the plan in any year.
     - `fast.js` 252-253 marks each such year live (`yr.saveYear`) the same way, so `splitCounts` scores the copies there.
   - **Where the pension first is the plan's own.**
     - An employee who saves into the pension and nothing into the ISA: the budget is the pension's own net cost, grossed
       back up to the plan's figure (App.jsx 3597) and snapped to the plan (3600).
     - An employee whose pension saving already fills the pension's room in every working year (the annual allowance,
       tapered, or the MPAA): the room is never below the plan's own (App.jsx 3592).
     - In both, the ISA first is the one route that differs, and the hold removes it.
   - **Measured** (EXPLORATORY, light settings).
     - Of the library's 60 single employees with a year to choose, I set the ISA saving to nought. All 60 still have a
       year to choose, and none has a year where the pension first differs from the plan (`holdonly.mjs`).
     - S188 so, at `save-default`'s light settings, on 200 paths of seed 99001 (`pensiononly.mjs`):
       - the new default: 1,600 moves (800 pension-first copies), its record saveSplit 'on', saveIsaFirst 'held back (an
         employee)';
       - the candidate before D138: 800 moves;
       - their tables the same digest, `9a3d4f727657`;
       - 0 of 200 paths differ in survival, the pot, tax or spending;
       - the solve 9 to 12 s of CPU, and a path 49.0 to 76.8 ms (x1.57; a guide, with another test beside it).
     - With `r.nAt` set, P1's memo and the speed mode's shortlist are off in every year (finding 1).
   - **What it means.** For such an employee the hold leaves the split as its cost alone: the page's figures slower, the
     speed mode idle, and a record that says the split acts.
     - The registered panel held no such plan: every plan saves 12% into the pension and 6% into the ISA (the read's
       reviewer, MINOR 4 (a)). So no run measured it.
     - D137 (1) took the split's time for a saver it offers a choice to.
     - `save-default` check 3 holds a retired single to the bit, and no working plan without a choice.
   - **Fix** (CHECKLIST 7).
     - Read the year to choose over the routes offered: `saveSplitRoutes` says which routes differ from the plan each
       year, and `saveOn` and the live years read it.
     - Then a plan whose offered routes are the plan's own in every year gets no copies. Its record is 'no year to choose',
       and its tables and paths are the candidate before D138's to the bit.
     - Add a check of its class: an employee saving into the pension alone, and one whose pension saving fills its room.
       Its plant: the year read over both routes.

3. **MINOR. The defect fix could not have changed a decision, in the registered run or anywhere. The account says the
   chooser "could pick one".**
   - **The claims.** The comment at solve.js 2936-2940, `DECISIONS-PENDING.md` item 5 ("the chooser's argmax, over every
     move, could pick one on them"), and its "whether it changed any decision in the registered run cannot be read from
     its records".
   - **The code.**
     - The worlds are built `k === centre ? r : {...}` (solve.js 1730; 1728 at a83cd90b). So the centre world is the solve
       itself, which carried `r.nAt` before the fix.
     - Its scorer sets every left-out copy to -Infinity (`movesAt`, 2996-3001; 2970-2976 at a83cd90b).
     - The mixture fails a move that fails in any table (1873; 1871 at a83cd90b).
     - So a left-out copy's combined score was -Infinity at every decision, whatever the other worlds read. No copy could
       be picked.
   - **What the stale flows did reach:** the non-centre worlds' scores and tax for those copies, which the share check (a
     test mode) compares, and work wasted on them.
   - **What agrees with this:** the identity (4 of 4 path for path) and the probe (no copy picked at 8,200 decisions).
     Check 6 tests the share check's terms, and its plant fails that check. Its "a copy picked ... 0" cannot fail with the
     plant in.
   - **Fix:** the D-line and the comment say no decision could change, and item 5's question is answered from the code.

4. **MINOR. The cap prices the employee's NIC alone, on the whole pension figure.**
   - **(a) The employer's NIC with pass-through.**
     - From April 2029 a sacrifice above £2,000 bears employer NIC as well as employee NIC. So an employer's NIC saving
       passed into the pension exists on the first £2,000 alone.
     - The cap removes the employee's relief on the excess (App.jsx 1433-1435). It leaves `pensionCredit: g * passFactor`
       on the whole sacrifice (1436), and `netCostOfPensionContrib` (1442) and `grossUpNet` (1467, 1473) convert with the
       full factor.
     - So a plan with Config's "Employer NIC passed to pension (%)" set (default 0, App.jsx 482; the factor 1 + 0.15 x the
       share) is credited up to 15% more pension on each moved pound above £2,000 from 2029 than the law gives.
     - The panel, K and check 8 have none: `erPass` is 0 on all 40 (the K reviewer).
   - **(b) The cap counts the whole pension figure, the employer's part included, as the employee's sacrifice** (the K
     read's second look, MINOR 2). Where the employee's own sacrifice is under £2,000, the app's cap binds earlier than the
     law's.
   - **(c) A blank salary takes the assumed rate with no cap** (1425-1428, 1462-1463). Its NIC part is 2%, so this is small.
   - **Fix:** price (a), the pass-through on the first £2,000 alone from 2029, with a case in check 8, or say it in the
     D-line and in the caption beside the cap. Put (b) and (c) in the D-line.

5. **MINOR. What the D-line must carry as reached untested.** It is not written yet. By inference only unless named:
   - **The registration's list.**
     - Positions 3, 6 and 10. The lock holds with the split's copies on my check below; that is a mechanism, not an
       outcome.
     - Consent withdrawn: one tier pair, the whole menu. `risk-consent` runs S224 so and reads no outcome.
     - The 'lower' estate aim.
     - The years from 2029, now priced by the cap. K measured the pension first's price there, with the ISA first offered.
   - **The speed mode, not as inferred.** From the code it does nothing on a working saver's path (`r.nAt`; finding 1).
     D137 (1) keeps its words.
   - **The read's reviewer's MINOR 4 (a):** savers of 12% and 6% only; no salary growth, no pass-through, no MPAA;
     employees from £29,500 to £85,000; five or fifteen working years. Add a blank salary: the assumed higher rate, and the
     whole allowance as the pension's room (App.jsx 3589).
   - **The deep review's two:**
     - an employee who does not sacrifice salary, priced as a sacrificer ((B) in `DECISIONS-PENDING.md` until the
       maintainer rules);
     - a saver into one wrapper; for an employee into the pension alone, see finding 2.
   - **The employees' arm as it ships** (the ISA first held back, the routes priced with the cap from 2029): no run
     measured it.
     - CANDSA (the registered gain over the 30 employees, `+0.590` on anchors) and CANDSA-T (`+0.428`) both offer the ISA
       first.
     - The three that take it most rest on it, and so does S336F, the one household below nought at K's price
       (`-0.275`).
     - D137 (4) took the hold's cost unmeasured.
     - The self-employed's default is the registered CANDSA, path for path (the identity's S280 and S196).
   - **The cap's three gaps** (finding 4).
   - **The cost.** A working saver's path x2.10 on anchors and the solve x1.10 (D137 (1)). B1's browser harnesses, whose
     fixtures save (phone-perf's), have not yet run on the build.

6. **MINOR. The couples' exclusion is a decided default no protected test pins, and the new candidate keys have no
   fair-test row.**
   - **The block.** Its candidate entry will carry `saveSplit: true`, and its couples entry says nothing of the exclusion.
     - The exclusion is pinned by `save-default` check 4 alone (the full tier, unprotected).
     - Every other decided couples default is pinned against the block by `couple-default.test.mjs` (protected).
     - Fix: ask the unlock for the couples entry to record it (say, `"saveSplit": false`) and for `couple-default` to pin
       it. Or the D-line says why not.
   - **`fair-variables.mjs`** has no row for the savings split (`saveSplit`, `saveIsaFirst`), now candidate keys.
     - D73 (rows 35, 36), D81 (37, 38) and D93 (39 to 43) gave each new setting a row.
     - The settings line records the menu's size (`audit-phase4.mjs` 188, `actions N`), which catches the copies and the
       hold indirectly. A registration's fair-test table does not list them.
     - Fix: ask its unlock by name.

## Checked, and holding

- **Every route by which the page solves a couple goes through `solveForApp` with the partner's age, so the split stays off.**
  - The household route: `hOpts = { ...opts, ageWith: hh.ageWith }`, with its base and its parts on `hOpts` (solverClient.js
    262-296).
  - Today's route: `pOpts` with `cpl.ageWith[who]` (298-346).
  - The parts take `phaseOpts` (221). The worker hands `data.opts` to `solveForApp` for a part, a base, a solve and a
    restored base (solverWorker.js 98-151).
  - A couple is marked by `planningMode` (useSolver.js 62-66; startFigures, solverClient.js 75-78).
  - `solveForApp` drops both keys where `ageWith` is set (60), and its dial base solved in place carries the age (44).
  - `ageWith` is a number on both routes (solverCouple.js 62, 126).
  - The research couples' audits solve each table so too (audit-household.mjs 118, audit-household-hsp.mjs 183,
    audit-late-tail.mjs 226).
  - Check 4 and its plant 'couplesplit' hold this.
- **A single's route is the registered arm's.** The identity is 4 of 4 path for path on 1,000 paths of seed 7025: two
  employees at the registered configuration, two self-employed at the default. The fix to the worlds moves nothing there
  (finding 3).
- **The hold reads the owner's flag the price reads.** App.jsx 1771 (`employmentSelf` 'self-employed'; default
  'employed') and 3580.
- **No reader assumes two copies a move.**
  - The menu is built from `saveOn`'s routes (solve.js 410). With one route, each copy's `tierBase` stays inside its block.
  - `fast.js` and `model.js` read a variant by its save (fast.js 253, 434, 471; model.js 257-258).
  - The shortlist's grouping carries the save (solve.js 1788).
- **The cap's arithmetic.**
  - Past £2,000, the NIC relief is that on the top £2,000 of salary (1434). It is continuous at £2,000 and increasing in
    the sacrifice, so `grossUpNet`'s bisection holds.
  - Uncapped, it is the code before (1435): check 8's 25 cases agree to the bit, and no other caller passes a fifth or
    sixth argument (App.jsx 1483-1494, 2378, 3684-3767, 3966; model.js 339; household.js 160).
  - It applies from 2029 by the app's own year (`baseYear + t`, as the cash ISA cap's at 3591), held in real terms as every
    threshold is.
  - It acts in the split's routes alone (3582), as the caption says.
  - From 2029 the pension first under the cap is K's on the 30 employees (the identity's part 2; K's second look).
- **The words.**
  - `partsOf` names a save only on a copy (solverStrategy.js 249), and a save's skip is the best-ranked move that differs
    in it (289).
  - An employee's menu holds no save-2 copy, so no page names the ISA first for an employee.
- **The stored solve.** Its key names `APP_CANDIDATE` (solverKey.js 39), and the store keys each record by the worker's
  code as well (solverCache.js 99-128). So every solve stored before, a couple's too, is dropped once.
- **The dial's lock with the split's copies** (EXPLORATORY, light settings, a mechanism only).
  - lock-tiers' check 3d, replicated on S328F with the split (2,400 moves, on anchors): the locked table is on the base's
    pair at 316,224 of 316,224 cells, and the locked move on the base chooser's pair at 2,371 of 2,371 decisions of 40
    runs, 597 of them a save copy.
  - The app's own position 3 on S188 (its base solved in place, both 1,600 moves): 1,403 of 1,403 decisions, 200 of them a
    save copy.
- **The evidence.**
  - For the self-employed the default is the registered CANDSA, a confirmatory read.
  - For employees it rests on the registered read and on K (EXPLORATORY). D137 (4) names K and ruled its outcomes in
    advance, taking the hold's cost unmeasured, as CHECKLIST 1 allows.
- **Each new check fails on its plant** (my `--planted` run), and the test passes whole on the files as they stand.
- **The e3pcls pin is current** (`4edda66fb0f3f912`, the code's), and the results files' code id is the worktree's
  (`ae7ad547d29d`).
