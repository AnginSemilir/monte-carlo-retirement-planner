# Review before use: amendment 1 to the couples' re-run (`couples-d4b.md`, seed 7021)

Subject: `registrations/couples-d4b-amendment-1.md` (D94 (1)) and the three files that carry it, at 9718568f, before the
amended stage gate is run on the run's folder. The run is confirmatory and in progress; its first stage is in.

Verdict: PASS

No finding is BLOCKING. Five MINORs; the first is a statement of cause that is wrong and has reached the maintainer.

## What was read and run

- Main tree at 9718568f, clean. Git blobs: `registrations/couples-d4b-amendment-1.md` db5d6326b6eb,
  `couples-d4b-amendment.mjs` 172cf67f9524, `stage-couples.mjs` 0242929ca413, `reduce-couples.mjs` cae05c5a8e75,
  `registrations/couples-d4b.md` 3b9d5fc8c91a (the same blob in the launch tree), `audit-couples.mjs` 1bc8fa2e72a3,
  `batch-couples.sh` ecc93d34a783, `fair-gate.mjs` 4d4a20402b1c, `audit-phase4.mjs` 5ace83959b96, `d4b-plan-check.mjs`
  a4e49b5f4b75, `results-d4b-plan-check.txt` ccb8ade2407c, `reports/2026-11-13-d4b-stage-gate.md` 70ec421369e4.
- `git diff 4e4174b1 9718568f` on the two amended files, whole; `git diff --stat 4e4174b1 9718568f` on every file of
  `STAMP_FILES` and the registration: only `stage-couples.mjs` and `reduce-couples.mjs` differ.
- The launch tree's code at 4e4174b1 (`src/App.jsx`, `src/solver/couple.js`, `src/solver/model.js`, `audit-couples.mjs`,
  `batch-couples.sh`, `backup-chunks.sh`, `run-from-snapshot.sh`), outside `research/solver/results/`.
- Run: the three `--planted` suites (12, 16 and 69 cases, all pass); `node research/solver/couples-d4b-amendment.mjs`
  (29a4a6a71f76, THE SAME); `stampFilesHash()` in the launch tree (29a4a6a71f76; its code 1d5d2421c9ab) and in the working
  tree (d167bcd64e0c); eighteen one-line mutations of a copy of the three files in a scratch folder, each run through the
  three suites; two scratch scripts on S293's plans alone, on the launch tree's code (below).
- Not opened, listed or read: anything under the launch tree's `research/solver/results/`, `/home/user/d4b-backup-wt`,
  the branches `d4b-backup` and `d4-backup`. Neither `stage-couples.mjs` nor `reduce-couples.mjs` was run on the run's
  folder. No path of seed 7021 was drawn; the scratch scripts build plans and contexts and run no path.

## The questions put

1. **As narrow as the page says: yes.** `onePlan` returns true only for one truthy hash across the units, or the couple
   `KNOWN.id` with every APP unit on `KNOWN.app` and every solver unit on `KNOWN.solver`, both groups non-empty. In
   `decideStage`, when `one` is true by a single hash the per-unit comparisons would have passed anyway; when it is false
   the per-unit messages are the launch's, unchanged; a missing unit is refused by its own line before any decision. Units
   with no inputs hash at all pass the stage gate's plan check exactly as they did at launch (`undefined !== undefined`),
   no wider. In the read's `gate`, the added `got.every(x => x.inputs)` only spares a second message where line 199
   (`no inputs hash`, there at launch) already refuses the unit. `known = undefined` takes `KNOWN`; neither CLI passes one.
2. **Nothing else changed: yes.** The diff is the header comments, the import, the plan check, `amended` in the return
   and in `stage2.json`, the planted cases, and in `read()` the stamp and the amendment line. `STAGE1`, `STAGE_BAR`,
   `SHIP_N`, the stage's `d`, `LAYOUT`, `stageOf`, `decide`, the bars and every item of `report` are byte for byte the
   launch's.
3. **The stamp: sound.** A chunk run on other files carries another audit hash and is refused unit by unit (`gate`,
   line 197) and by the logs' one-stamp check; a stamped file other than the two that drifts moves `launchStampHash`
   off `LAUNCH.audit` and the read refuses before reading. The second stage's chunks are written by the launch tree's
   audit from the launch tree's files, so the launch stamp is the true one for them, and `done_k` keeps the first stage
   on the same stamp line. The frozen audit reads only `.continue` of `stage2.json` (`audit-couples.mjs` line 267) and the
   frozen batch only whether the file exists; `backup-chunks.sh` copies it whole. The `amendment` field breaks nothing.
   If the amended gate refuses and writes nothing, a relaunch runs the registered gate, which refuses again (exit 3).
4. **The provenance check: holds.** The registration's blob is the launch's (3b9d5fc8c91a), `fair-gate.mjs` is unchanged
   since the launch, and `requireFairLogs` and the logs' stamp check are called as before.
5. **The evidence that it moves no money:** thin as committed, adequate with the check below (finding 2).
6. **The planted suites:** pass; sixteen of eighteen mutations fail a suite (finding 4).
7. **What the page lacks:** findings 1, 3 and 5.

## Findings

1. **MINOR (a claim that must not stand as written; it does not touch what the gate accepts).** The page (lines 17 to
   19) and the report to the maintainer (`reports/2026-11-13-d4b-stage-gate.md`, lines 21 to 24: "On S293 that moves the
   second person's first draw by two years") give the cause of the differing age as arm A's plan resolved with the
   guardrails on and the lookahead at 5 where the solver arms' has both off. It is not. On the launch tree's code, S293's
   plans alone:

   ```
   arm A's plan: policy Bracket Fill, lump true, guardrails true, lookahead 5: ages 60/60
   arm A's plan, guardrails and lookahead off: ages 60/60
   the panel's plan as entered: policy Bracket Fill Basic, lump false, guardrails false, lookahead 5: ages 60/58
   the panel's plan, guardrails and lookahead off: ages 60/58
   ```

   The guardrails and the lookahead move nothing. What differs is the policy: arm A's pick is Bracket Fill with the lump
   sum, and the solver arms' plan keeps the plan's own Bracket Fill Basic without it (`audit-phase4.mjs` `solverPlanOf`
   changes the policy name only where the deposit order differs), so the expected path's first taxable pension draw for
   the second person falls at 58 in one and 60 in the other. The age is derived from the policy, and `inputsHash` is meant
   to leave the policy's own fields out. The amendment's rule, the remedy named for the next test and the ruling's basis
   (one field, no money) stand; the sentence does not. Correct the page and the report, and say so to the maintainer.

2. **MINOR.** `results-d4b-plan-check.txt` supports "moves no money" by two things: contributions under the MPAA's
   limit, and arm A's plan run under either age. Neither covers the solver arms' own plan, and the first is not how the
   engine uses the age: `stepYear` never reads it (`src/App.jsx` lines 2100 to 2846 at 4e4174b1 hold no use), nothing in
   `src/solver` reads it (`couple.js` line 88 copies the label into a person's plan, line 132 resolves it afresh), and it
   acts only in `buildContext`, through `wrapperHeadroomAtYear`, as the pension's room for dated deposits, staged
   transfers and the Auto deposit. Checked here, from the plans alone, every field of the context and not only the hashed
   ones (a function by the length and opening of its source):

   ```
   SHIPC W0.02 plan's ages: self 60, part 58; inputs 6080f4d27c15; with part 60: 59b230b4798b
   SHIPC W0.02 household ctx as the engine runs it (guardrails, lookahead off), 58 against 60: 683 fields compared, 2 differ
       ctx.plan.demographics.mpaaAgePart: 58 | 60
       ctx.owners.1.mpaaAge: 58 | 60
     self's own plan resolves its MPAA age to 60 (household part 58) and 60 (household part 60)
     part's own plan resolves its MPAA age to 60 (household part 58) and 60 (household part 60)
     SHIPC W0.02 part's single-plan ctx, from the household plan at 58 against 60: 523 fields compared, 1 differ
       ctx.plan.demographics.mpaaAgePart: 58 | 60
   CANDC W0.02 household ctx as the engine runs it (guardrails, lookahead off), 58 against 60: 691 fields compared, 2 differ
   APP ctx, part 60 (its own) against part 58: 687 fields compared, 2 differ
   ```

   The same at W0.01 and for the first person. S293 has no dated deposit, staged transfer or staging at all, so the room
   has nothing to route. Each person's table is solved on a context that is the same under either age, and the household
   context the engine steps differs in the label alone, which the engine's year does not read. The one function in the
   context that holds the owners is `saveSplitAt` (the savings split, a research option, off, not in the candidate). With
   that, the solver arms' units and APP's are the same household under either age. Put this comparison into
   `d4b-plan-check.mjs` so the results file prints it; this review's scratch scripts are not in the repository.

3. **MINOR.** Before the amendment an edit to `reduce-couples.mjs` or `stage-couples.mjs` after the launch made the read
   refuse every chunk. Now `launchStampHash` takes the launch's bytes for both whatever the files hold, and `KNOWN`,
   `LAUNCH` and `AMENDED` sit in a file outside `STAMP_FILES`: the three files are held by nothing until the read, and a
   file added to `AMENDED` later would pass. The read must be made with the three at the blobs named above, or its
   reviewer shown the diff from them. Cheaper to hold it in code: the two amended files' hashes pinned in
   `couples-d4b-amendment.mjs`, the read refusing on another, and the page naming all three blobs.

4. **MINOR.** Sixteen of the eighteen mutations fail a suite: any couple; some solver units; APP's hash unchecked; the
   solver hash unchecked; either way round; the missing-hash guard out; the stage gate's `one` always true, true for the
   known couple whatever its hashes, or blind to SHIPC; the read's plan check dropped, opened for the known couple, or
   blind to SHIPC; the launch stamp taking every file from the launch commit, or skipping the amended two; the amendment
   never applying; `usedFor` naming no couple (caught by the stage gate's suite and the amendment's, not the read's). Two
   pass all three, both in `read()`, which no planted case reaches: the refusal `files !== LAUNCH.audit` removed (the
   per-unit check in `gate` still refuses a drifted file), and `gate` handed no audit hash (the same exposure as at
   launch, where `stampFilesHash()` was passed there untested). The read's amendment line has no planted case of its own.

5. **MINOR.** The page should also say: the stage gate is run outside the launcher, from the working tree, and its
   decision is held by the read recomputing it (`gate` compares `stage2.json`'s list with `stageOf`); the amended gate
   refusing is a STOP with nothing written, and a relaunch then meets the registered gate's refusal; and, with finding 2,
   that the solver arms' plan was compared under either age.
