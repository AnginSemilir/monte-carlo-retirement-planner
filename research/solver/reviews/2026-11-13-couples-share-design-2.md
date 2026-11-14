# Design review, second round: item 6's stage C, `registrations/couples-share.md` (before launch)

13 Nov 2026. The `reviewer` agent, on the one fix after the first round's FAIL (D81 (F)), on the main tree at 3cec591e:
code-id 7002a1fec94c (the panel's landing code), `stampFilesHash()` 992cd7d616f0. Nothing of seed 7021 or 7022 was run or
read; no solve was run (the merge gate was timing itself, `results/.pause` present at 22:32 UTC); `d4-backup` and
`d4b-backup` were not opened; no file but this one was written.

## What I read (git blobs at 3cec591e)

- `git show 3cec591e`; `git diff fdf994a9 3cec591e -- research/solver`; the first round,
  `reviews/2026-11-13-couples-share-design.md`.
- `registrations/couples-share.md` 44f5656efaed; `audit-couples-share.mjs` ac476126024d; `reduce-couples-share.mjs`
  c3f14e64dcf8; `batch-couples-share.sh` f534d0962720; `size-couples-share.mjs` ff194c268830; `couples-share-panel.mjs`
  2476bda6d1df; `couples-share-panel.json` 16ec3d233bfa; `couples-share-orders.json` 57270d174efc;
  `couples-share-paths.json` 5522a142c347; `results-couples-share-sizing.txt` 0ac06535def6;
  `results-couples-share-panel.txt` 737aa8fdf8dd.
- What they borrow: `audit-couples.mjs` f50aa99da601; `audit-phase4.mjs` 5ace83959b96 (`inputsHash`, `runPath`);
  `reduce-couples.mjs` cae05c5a8e75 (`harmOf`; its own read's code check, line 556); `reduce-phase4.mjs` ac319aad1f44;
  `size-phase4.mjs` f66f13d055ed; `fair-gate.mjs` 4d4a20402b1c (`checkLogStamps`); `candidate.mjs` 5484638a0a0f
  (`candidatePlan`, `hashOf`, `blendReals`); `code-id.mjs` f00aa5b3bd48; `check-prediction.mjs` 260436a43d48;
  `run-from-snapshot.sh` cf7ab99bb4ec; `run-unit.sh` 57c3654f9162; `src/solver/couple.js` f66038d648b3 (`shareFor`,
  `singlePlanFor`, `solveCouple`, `withCouple`); `src/solverApp.js` 9b354ce6f980; `src/solverSettings.js` 85fa071d7421;
  `research/engine.mjs` as generated (`resolveMpaa`, `buildContext`'s deposit routing, `wrapperHeadroomAtYear`,
  `mpaaAppliesAtYear`, every reader of an owner's `mpaaAge`); `research/build-engine.py`.
- The main tree's uncommitted files (`git status` at 22:14 and 22:35 UTC) and the untracked
  `reports/2026-11-13-stage-c-registration.md`; `reports/2026-11-13-d4b-stage-gate.md` line 57; the source design,
  `EXPERIMENTS-AND-PORTS.md` item 6 stage C on origin/review/external-2026-10-21.
- The smoke's six units and logs (scratchpad `sc-smoke2/`, seed 7002) and the pilot's 27 units (`results/share-c-pilot/`).

## What I ran

- The planted suites: the audit 9, the read 16, the panel 11, the sizing 5: all pass.
- `check-prediction.mjs` on the registration: incomplete only for this file. `--seeds` as the launcher calls it, on the
  batch: under `couples-share.md` "seeds: 7022"; under a measurement and under `couples-d4b.md`, refused.
- In `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/scdesign2/`:
  `closure-live.mjs` (a load hook recording every module Node loads when the audit, the read, the sizing, the panel's script
  and the read's dynamic `fair-gate.mjs` are imported; no main runs); `mpaa-take.mjs` (plan level, no solve, no path: for
  all 36 units, arm A searched as the audit searches it, APP's context, and the solver arms' household context with their
  own MPAA ages and with arm A's taken; its output in `mpaa-take.out`).
- The read's `--pilot` on the smoke's two units (`SC_ONLY=S015-90,S015-db SC_PTS=6`) and on the old pilot.
- `research/engine.mjs` rebuilt in memory (nothing written) from HEAD's and from the working tree's `src/App.jsx`.
- The library's 210 couples' age gaps and holdings (`couple-panel.mjs` `couplesOf`); `size-phase4.mjs`'s rates at 19,000
  (the first round's `power.mjs`).

## Verdict

Verdict: PASS

No BLOCKING finding; four MINOR. Both BLOCKING findings of the first round and its five MINORs are answered (the section
after the findings). Findings 1 and 2 should be done before launch: the read is stamped, so its text cannot change after
launch without refusing every unit, and the maintainer's choice of paths rests on the registration's account of the pilot.

## Findings

1. **MINOR. The read still prints the PASS without its scope.**
   - `reduce-couples-share.mjs` line 96, `decide()`'s PASS: "shareRule 'pots' becomes the couples' default and the guard
     comes off, in the same commit as the D-line naming this run": the source design's words, which the first round's
     BLOCKING 2 found too wide. The registration's Outcomes (lines 91-96) now lift the guard only for couples whose elder
     holds more than 60% and at most 90%; the read's OUTCOME line is what `results-couples-share.txt`, STATE.md's block and
     the D-line naming the run are written from.
   - The read is in the stamp, so this line can change only before launch.
   - The same kind, smaller: the registration's reported items name "the solve times and hosts" (line 100); the read prints
     neither (lines 174-181).
   - Fix: the PASS's `decides` carries the registration's scope, its planted PASS check reading it; print the solve times
     and hosts, or take them out of line 100.

2. **MINOR. The registration's account of the pilot's shortfall is not the sizing file's.**
   - Paths (lines 66-69): "in the pilot, the re-held units of the oldest couple (upper bounds 13% to 14.5%, rates 0.855 to
     0.883)".
   - `results-couples-share-sizing.txt` line 11: six of the nine pilot units are past 12.45%: S015-75 and S015-90 (14.50%,
     0.855), S015-db (13.21%, 0.883), S389-75 (14.18%, 0.862), S389-90 (13.53%, 0.876), S389-gain (13.43%, 0.877). That is
     two of the three pilot couples, every unit of theirs, both of their units with a feature (the units that decide a
     STOP); the 0.883 quoted is S015-db's, a feature unit. Each of the six gains 11.1 to 12.3 points (lines 2-10), so the
     reason the registration gives holds for all six; the account is short, not the reasoning.
   - The rates reproduce (`size-phase4.mjs` at 19,000): 0.901 at 12.45%, 0.888 at 13%, 0.855 at 14.5%, 0.782 at 18%,
     0.766 at 19%, 0.729 at 21%; the quarter-point rate 0.049 to 0.050 throughout.
   - Fix: name the six as the sizing prints them. The paragraph is what the maintainer is asked to decide the 19,000 on.

3. **MINOR. A PASS reaches past the panel in three ways the registration does not name, and the guard as built reads the
   first person, not the elder.**
   - Between 60% and 75%. The panel holds 75% and 90% (`results-couples-share-panel.txt`); the PASS (lines 92-94) reaches
     the whole of (60%, 90%] as "what the panel tested". The stretch from the band to 75% is interpolation (stage A,
     EXPLORATORY, held 65/35).
   - The elder. All 210 library couples have the first person three years older and hold 60/40 in every wrapper
     (`couplesOf`, checked). The guard as built (`src/couplesSwitch.js` `coupleSolverOn`, uncommitted, lines 16-21) reads the
     first person's share, as M4 is worded. A guard edited after a PASS to "the first person over 60% and at most 90%" would
     run the solver for a couple entered with the younger as "Myself" holding 75%: the direction the first round's
     BLOCKING 2 found untested. Equal ages have no elder. And a couple entered with the younger first is another plan, not
     a relabelling: the horizon is counted from the first person's age (engine `buildContext` line 1663, `terminalAge -
     ageSelf0`; `couple.js` line 83).
   - The wrappers. Every re-held unit holds the same share of every wrapper (`audit-share.mjs` `reheld`); a couple holding
     75% of the pots with the pension all one person's and the ISA the other's is not in the panel. (The couples' re-run
     reached such couples inside the band by the same inference.)
   - Fix: the Outcomes say which of these a PASS reaches by inference and which keep the app's rules, and that the guard
     after a PASS reads the elder by age (equal ages named either way), so the reviewer on the change of default has a
     written scope to hold the code to.

4. **MINOR. Nothing ties the launch to the files reviewed, and the read does not hold its own code to the units'.**
   - The registered run refuses only a code other than the panel's (audit line 153; code-id: `research/engine.mjs`,
     `src/solver/*.js` and three research files). The 33 stamped files (`src/solverApp.js`'s `solveForApp`,
     `select-phase4.mjs`'s `armA`, `audit-phase4.mjs`'s `runPath` and `inputsHash`, `audit-couples.mjs`'s `solverPlan` and
     `wantProblems`, the read) enter the stamp, but the batch, RESUME and the read require only one stamp across the run,
     the launch's. A commit between this review and the launch commit that touched one of them would run unrefused.
   - As it stands none is touched: every stamped file tracked and unmodified at 3cec591e and in the main tree,
     `stampFilesHash()` 992cd7d616f0 and code-id 7002a1fec94c in both. The main tree's Part D work grew during this review
     (7 modified files at 22:14 UTC, 18 at 22:35, `src/App.jsx` among them).
   - The couples' re-run's read refused a run on another code than the panel's (`reduce-couples.mjs` line 556); this read
     does not. The deciding arithmetic is all stamped; only the gate's share check (`couple.js` `shareFor`) and the panel's
     plans (`scenarios.mjs`) come from code-hash files, so what could be missed is a refusal, not a moved figure.
   - Fix: before launch, `TODO_ONLY=1` in the launch worktree prints `stamp: code 7002a1fec94c audit 992cd7d616f0`,
     recorded with the launch (or the registration names that stamp and the batch refuses another); the read refuses
     units whose code is not `couples-share-panel.json`'s `code`.

## The first round's findings against the fix

1. **BLOCKING 1 (the stamp): answered.**
   - `stampFiles` (audit lines 65-85) follows `from`, `import()`, a side-effect import, `require` and `new URL` from five
     roots (the audit, the read, the sizing, the panel's script, the batch) to the end, and the scripts the batch names, as
     `code-id.mjs` `smokeFiles` does; with the panel, its orders and the paths. Its 34 entries are 33 files and one path no
     tree holds (`research/solver/research/solver/audit-couples-share.mjs`, the batch's `node -e` import read from the
     batch's folder), hashed as "missing" in every tree alike: harmless.
   - Every module Node loads for the audit, the read (its dynamic `fair-gate.mjs` too), the sizing and the panel's script,
     39 in all, is in the stamp or code-id's files (`closure-live.mjs`). `reduce-phase4.mjs`, `fair-gate.mjs`,
     `size-phase4.mjs`, `stats.mjs`, `reduce-couples.mjs` and `couples-share-paths.json` are stamped, so the read's
     arithmetic, its provenance check and the registered paths cannot change after launch without the gate refusing every
     unit, and RESUME keys on the same stamp.
   - Data read outside the stamp: `candidate.json` (at `candidate.mjs`'s import; the run uses nothing of it beyond the
     module's own consistency check) and `results-o60.txt` (every arm's tier returns through `candidatePlan`), the latter
     pinned through the configuration hash, which takes `blendReals()` (`hashOf`) and which every unit checks before it runs
     (audit line 149). The read decides with neither.
   - The planted cases test the right thing: the list holds the read's deciding files and the data and none of the code's;
     a static and a dynamic import planted in the read both join; `src/solverSettings.js`, which no root imports directly,
     shows the following is transitive. No computed specifier, `createRequire` or worker is in the closure.
2. **BLOCKING 2 (the scope): answered in the registration** (Outcomes lines 91-96; Households lines 56-58). What is left:
   the read's printed PASS (finding 1) and the inferences and the guard's terms (finding 3).
3. **MINOR 3: answered.** The shortfall, stage A's S267, the 30,000-path and two-stage alternatives and that applying
   D61's form here is the maintainer's at launch are all stated; the account of the pilot is short (finding 2).
4. **MINOR 4: answered as D94's report committed, and checked.**
   - Audit lines 193-195: after `solveArm`, only the engine's context is built from a copy of `cp.plan` carrying arm A's
     two ages (`E.resolveMpaa(a.planState)`, the call APP's context is built from); `cp.plan`, `cp.m` and the tables are
     untouched; `mpaaOwn` records each solver arm's own; the gate compares the full inputs again (read line 65); the read
     names the units (lines 163-164).
   - The engine reads an owner's `mpaaAge` only in `wrapperHeadroomAtYear` (`buildContext`'s deposit and staging routes,
     lines 1796-1911, whose results `inputsHash` holds: `oneOffContribs`, `stagedTransfers`, `oneOffStaging`), in the
     windfall and savings splits (off in the couples' candidate) and in a warning; never in `stepYear`. The solver reads it
     only where `singlePlanFor` copies it into each person's plan.
   - `mpaa-take.mjs`, all 36 units: the ages differ on 7 (S015-db, S183-75, S265-75, S265-90, S265-spa67, S291-75,
     S291-90); after the take every unit's solver inputs equal APP's (the gate will not refuse on plans); between the
     solver's own ages and arm A's, every input but the ages is the same on all 36, so the take moves no money on any
     unit. The smoke records it on S015-db: CANDS's and CANDH's own ages 68/65, APP's none/65 taken, inputs 0b65efd20f41
     in all three arms.
   - Its planted case is on synthetic records (read check 10), not a real context; with the full inputs compared a moved
     deposit can only be refused, so that stands.
5. **MINOR 5: answered.** Under the registration the `run` and `beside` lines carry seconds and counts only (audit lines
   215 and 222); an error prints a count of disagreeing scorings, not survival.
6. **MINOR 6: answered.** One Node version in the gate; RESUME (batch line 24) keeps a unit only on its exact stamp line
   (code, audit, prediction and its sha) and a second line ending `node $(node -v)`, exactly what the audit prints first
   (lines 163-164), so a unit run under an older Node is run again and the run ends on one; `HELD_SEED=7022` on a
   non-comment line, which the launcher's seed check passes under `couples-share.md` and refuses under a measurement or
   another registration (so the pilot can no longer go through the launcher, as the batch says); the bound printed (read
   line 162); 16 planted read checks, each refusal the first round listed among them, each reading as it should.
7. **MINOR 7: answered** (registration lines 42-58 and 121-122).

## The uncommitted files

- None is in the stamp: from the five roots the closure reaches `src/` only at `src/solverApp.js` and
  `src/solverSettings.js`, both unmodified.
- None is in the code: `src/solver/*.js` is unmodified; `research/engine.mjs` is built from `src/App.jsx`'s engine slice,
  import lines dropped (`build-engine.py`), and App.jsx's one uncommitted hunk inside that slice is line 40, `import {
  coupleSolverOn } from './couplesSwitch.js'`, which the build drops. Rebuilt in memory, HEAD's and the working tree's
  App.jsx both give `research/engine.mjs` byte for byte (code-id 7002a1fec94c).
- A worktree at a committed launch commit sees none of them; committed first as they stand, they would move neither the
  stamp nor the code. The launcher copies whatever tree it runs from, uncommitted files included (`run-from-snapshot.sh`,
  `cp -r "$REAL/src" "$REAL/research"`), so launching from the main tree would bake them into the snapshot: the
  registration's worktree is what keeps them out. Finding 4 covers what could change before the launch commit.

## The smoke and the pilot

- The smoke's records (seed 7002, 60 paths, 6 points): stamp code 7002a1fec94c audit 992cd7d616f0, the files reviewed;
  Node v22.23.4. Through the fixed read (`--pilot`, `SC_ONLY`, `SC_PTS=6`): the gate fair, S015-db named among the units
  whose solver arms' own ages differed. Not run again here: the merge gate was timing itself, and the records are on the
  reviewed stamp and code.
- The pilot (the old audit 0332f08e77d4, no take): the sizing reads only its survival arrays (discordance, CANDS against
  APP) and its timings, and checks its code and seed, not its stamp (`size-couples-share.mjs` lines 70-72). The take moves
  no input on any of its nine units, so the discordance and the sizing stand; it adds one `resolveMpaa` and one
  `buildContext` to a solver unit, so the budget stands. The old pilot no longer reads fair through the fixed read
  (S015-db's CANDS and CANDH refused: inputs 5395f4f2d1c4, APP's 0b65efd20f41); nothing registered rests on that read.
- Twenty-seven units have never been through the solver, all four with a state pension age of 67 among them (the pilot
  solved S015, S211 and S389: features db, db and gain). At plan level all 36 pass what needs no solve (arm A's pick the
  landing's; the inputs one plan after the take). A unit that failed the audit's own checks at the solve would stop with
  nothing read and leave the read NOT FAIR; the audit's pilot mode can reach only the pilot's places, so a smoke of the
  others before launch needs a mode for it.

## What holds (checked, no finding)

- **The test sees the fault.** As the first round: CANDS off `shareFor`'s share is refused by the audit and the gate
  (planted); the pilot showed the half share below APP at 90/10 on all three pilot couples.
- **The arms differ only in what is tested**: 27d2a7c7ee9d and af001697ce1b (audit planted 1), each person's settings
  against the couples' re-run's, D80 none, the same plan in every arm (now with the MPAA ages), the same paths
  (`pathsForSeed`, path i the same whatever the count).
- **The rule decides** as the source design wrote it: any feature unit flagged STOP, any re-held unit flagged THE GUARD
  STAYS, else the pooled interval; each outcome planted. At 19,000 paths a true 1-point loss is flagged at least 90% of
  the time up to 12.45% discordance; above it the registration now says what is lost.
- **Nothing of 7022 can be read before the read**: no outcome in a registered log; no `share-c-run` folder; `runs.log`
  has no 7022 launch.
