# Review of a change of default, second look: D143's go, the household route's classes Y, E, S and G opened (D144)

Subject: the fix round D144 records for my first look (`reviews/2026-11-23-default-couples-open.md`: FAIL, one BLOCKING and
two MINOR), built and not committed in the worktree `/home/user/couples-open-build` (branch couples-open-build at b2f807b7,
its working tree's diff and untracked files): the limits card (`src/limitsCard.js`, `src/SolverConfig.jsx`), the client
closing for a plan kept off for its shape (`src/solverClient.js`), the age and target cards (`src/SolverFigures.jsx`), the
shape battery on couples entered the other way, the new `couple-limits-card.test.mjs`, and every claim of STATE.md's D144
line about them.

## What I read

- The fix (working-tree blobs): `src/limitsCard.js` 613f63906ff7 (new), `src/SolverConfig.jsx` 184193b3b208 (its diff
  against HEAD), `src/solverClient.js` 4073e0e37871, `src/SolverFigures.jsx` c766338b8222, `src/PlannerCards.jsx`
  7e3ebe39970c, `research/tests/couple-limits-card.test.mjs` b39f36357e69 (new), `research/tests/couple-default.test.mjs`
  5f11d9f14d98 (check 3's client runs, check 9), `research/tests/couple-shape.test.mjs` 5640190315de,
  `research/tests/run-all.mjs` 5107a35c5df2, `research/solver/STATE.md` 6a060cb9c066 (the D144 line).
  `src/couplesSwitch.js` dbd692827bde, `src/App.jsx` fe66270f95db, `solver-planner-ui.cjs` e80235d687aa and the identity's
  script and record are the blobs of my first look, unchanged.
- The records: `results-couple-limits-card.txt` b7c8ba33768f, `results-couple-default.txt` 9864a7c63c01,
  `results-couple-shape.txt` 57504371bdde, `results-planner-ui-d143.txt` dc82e986a8e4 (79 checks ok, 09:00 UTC); the
  agent's scratchpad outputs `client-household-client.txt`, `client-couple-split.txt`, `client-couple-solve-client.txt`,
  `client-couple-shown.txt` (each ALL PASS, written 08:56 to 09:05 UTC, after the last edit of the code at 08:40),
  `solver-config-ui-d143.txt` and `solver-strategy-ui-d143.txt` (each "all ok"; the strategy harness finished during this
  review, its refused-shape couple shown the couples card and nothing solved).
- What the fix reaches: `src/useSolver.js` (the page's own solve), `src/App.jsx` (`solverRules` l.8769; You's limits section
  l.14199 and `PLANNER_SECTIONS` l.7336; What if's `last` l.16595, `terminalAge` l.8904), `src/SolverSimple.jsx`
  (`SolverAnswers`, `SolverPlanAnswers`), `src/solverSearch.js` (`earliestAge`), `src/solverSettings.js` (`atAge`,
  `ageOptions`, `atDial`), `src/coupleOrder.js` (the limits' swap, l.68-69), `registrations/couples-open.md` (Outcomes).
- Run, on the worktree:
  - `couple-limits-card.test.mjs`: ALL PASS, 4 checks, the record's figures (2,464 edits); `--planted`: 'perperson' failing
    1 and 3, 'partleft' failing 1, as wanted.
  - `couple-default.test.mjs`: ALL PASS, 9 checks; `--planted`: 17 of 17 plants failing exactly their checks, 'openfallback'
    exactly 9 (exit 0), as the record. Check 9's client: Y90 on the household route; Y90 with no form refused; RY75 as held
    ('shape') refused, nothing asked after the cut; RY75 under 'noshape' refused.
  - `couple-shape.test.mjs`: ALL PASS, 3 checks, the record's figures (3,030 refusals as entered, 3,150 entered the other
    way with 4,620 plans on the mirror, none missed).
  - `couple-swap.test.mjs` (5 passed) and `store-note.test.mjs` (ALL PASS, 3): the two other tests that import the client
    and name couples, which the agent's list did not name.
  - `check-state.mjs` passes; `hygiene.test.mjs` ALL PASS, 10; `codeId()` 36e4d2a860b2, as D144 says.
- Reviewer's scratch scripts, EXPLORATORY, no outcome and no held-out seed read (session scratchpad `rev2/`):
  `card-bfs.mjs` (every lock state the card's own rows and writes reach, the guard read at each), `mirror-locks.mjs`,
  `mut/` (two mutants of the card); and my first look's `rev/variant-leak.mjs` run again.

Verdict: PASS

All three findings are answered; the fix brings nothing that blocks; two MINOR below. What holds:

1. **Finding 1 (the limits card) is answered.**
   - The card's modes (`src/limitsCard.js` l.36-53):
     - a single: one row, writing `tierCeiling` alone (check 4);
     - a couple on inside the guard before D143: per person, as D5;
     - a couple the household route alone opens: one row a wrapper, written for both wherever the plan carries
       `tierCeilingPart`;
     - any couple off with its two limits alike: one row, written alike;
     - any couple whose limits differ: per person, with the 'limits' line where that is the guard's reason.
   - `SolverLocks` takes its rows and writes from these (`src/SolverConfig.jsx` l.184-190, the value shown l.207).
     `patchSolver` merges a patch as `withLocks` does (`SolverConfig.jsx` l.27-30, `limitsCard.js` l.54).
   - The card is shown in You for every couple (`src/App.jsx` l.14199, `youOn && showSection('limits')`). So a couple off for
     'limits' does reach its per-person rows. The 'shape' card sends it to "Limits on the solver", which is You's section of
     that name (`App.jsx` l.7336, l.7358).
   - `card-bfs.mjs` explored every lock state the card reaches, from each start below. In no case was there a state from
     which the couple cannot be brought back on, and no edit switched an opened or in-guard couple off:
     - the 44 household-route units, normalised as the page holds them and as landed: 2,200 states each way;
     - the library's 210 couples held 25/75, 50/50, 75/25 and 95/5: 840 starts, 420 on the household route and 420 inside
       the guard per person, 1,029,840 states;
     - the 44 units given a partner's own ISA limit (off, 'limits', per person): 105,644 states, every one able to come back;
     - under 'noopen' (the rollback's guard): the 420 in-guard couples as above, and no other couple on;
     - with couples off (a copy of the two modules with `COUPLES` false): no couple on, the card one row except where
       the two limits differ, and per person there.
   - The only edits that switch an on couple off are on the 20 today's-route 'risks' units. There a household limit first
     aligns the two people's risks, which opens the couple, and taking the limit off parts them again. The same row brings
     the couple back.
2. **Finding 2 (a variant reaching today's route) is answered.**
   - The client now closes for `lifted` and for 'shape' (`src/solverClient.js` l.263-270). 'shape' is given only to a couple
     outside the guard before D143 (`src/couplesSwitch.js` l.222, l.225). An in-guard couple therefore has no `closedFor`,
     and D141's today's route for a refused shape inside the guard is unchanged (household-client check 7 and check 9 pass).
   - The page solves a couple only where the guard has it on (`App.jsx` l.8769). The age and target cards skip an option the
     guard keeps off (`SolverFigures.jsx` l.60-61); the scenario list already did.
   - `variant-leak.mjs` again, on S199-Y75 ended at 62 with the partner retiring at 120:
     - ages 57 to 61: the household route;
     - age 62: the guard 'shape' (its year-short reading of noretire), but the household plan takes it, so the household
       route;
     - age 63: refused, nothing asked after the cut.
     The age card no longer asks either of the last two.
   - One caller still solves a couple's variants without reading the guard: What if's limits search
     (`src/SolverSimple.jsx` l.40). It moves only the target and the first person's retirement age, from above today's age
     (`after`, `ctx.owners[0].age0`) to at most `ctx.terminalAge - 1`. So the first person works in year 0 and retires within
     the plan, and no refusal of the household plan is reachable that way. A variant the guard calls 'shape' by its year-short
     reading goes to the household route. Either way, none reaches today's route.
3. **Finding 3 (the mirror untested) is answered.**
   - The battery now runs on every couple entered the other way: 4,620 of 4,830 plans on the mirror, 3,150 refusals, none
     missed.
   - `mirror-locks.mjs` (47,040 mirrored plans, two pension risks against every pair of limits, with and without the mirror's
     own plant 'locksstay') shows that the mirror's swap of the limits changes which refusal is named first (on 3,780 plans).
     It never moves a plan between taken and refused (0). So the other-way battery is the check that can see a mirror fault
     that matters to the guard.
4. **D144's fix-round claims hold against the code and the records:** the card's two forms; the 'shape' words naming
   where the limits are set; the new test in FAST_JOINING with its two plants failing exactly their checks; the client
   closing for 'shape' with check 9's RY75 and 'openfallback'; the age and target cards; the other-way battery; 9 of 9 and
   17 plants. The code id is unchanged.

## Findings

1. **MINOR. D144's by-inference list does not name a limit set on the solver, and this round makes the riskiest tier's limit
   one setting for both people of an opened couple.**
   - No registered unit set any lock: 68 of 68 units of `couples-open-registered-panel.json` carry no `solver.locks` (read
     with `readOpenPanel`).
   - So a lock on an opened couple runs the household route by inference, as D136's list said of a partner's limits that
     equal the first person's. The lock can be a riskiest tier, now written for the two of them (`limitsCard.js` l.51-52), a
     pension age or the lump sum.
   - Fix: add one clause to D144's by-inference list. For example: "a limit on the solver (a riskiest tier set for the two of
     you, the pension age, the lump sum): no registered unit set one".
2. **MINOR. `couple-limits-card.test.mjs` checks 2 and 4 carry no plant (CHECKLIST 5).**
   - Each can fail. Two mutants in a scratch copy each failed exactly one check:
     - `limitsCard.js` l.40 returning 'household' for an in-guard couple failed check 2 alone;
     - l.51 writing the partner's limits for a single (`mode === 'single'` taken as household) failed check 4 alone.
   - Neither is shown failing in the test itself.
   - Fix: add the two as plants (`PLANT.rule` in `src/limitsCard.js`, the test's `--planted` list) and re-take
     `results-couple-limits-card.txt`.
