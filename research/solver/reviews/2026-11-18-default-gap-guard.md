# Review before a change of default: D128 (2), the couples' guard on the age gap with other taxable income

Subject: the uncommitted change on 0a731587 (working tree, as it stood after the plant line moved into `App`'s body): a
couple more than `DB_GAP_UP_TO` (3) years apart with other taxable income keeps the app's rules (`'gapincome'`), with its
card, the coverage line, the decided-defaults block's `dbGapUpTo`, `couple-default.test.mjs` checks 1, 4 and 8 and
`solver-planner-ui.cjs` check 19 (f). D128 (1), (3) and (4) are not reviewed here.

## What I read

- The change (working-tree blobs): `src/couplesSwitch.js` 49b5e80677, `src/App.jsx` e8d5c4220d (the plant line inside
  `App`'s body, l.8689-8693), `src/PlannerCards.jsx` 6dd604a4e8, `src/solverApproximations.js` 2410ff8140,
  `research/tests/couple-default.test.mjs` c02245a1ad, `research/ui-harnesses/solver-planner-ui.cjs` fba018c118,
  `research/solver/STATE.md` 40613948c2.
- The guard's other readers: `src/SolverFigures.jsx` 2998466220, `src/SolverConfig.jsx` 00ca0e87e3, `src/solverClient.js`
  a57e8ba4b7, `src/solverWords.js` dff35b178e, `src/useSolver.js`, `src/Docs.jsx`; the engine's reading in `App.jsx`
  (`num`, `buildContext` l.1663-1700 and l.1805-1827, `normalizePlan` l.1124, `INCOME_TYPES` l.415-420, the income
  section's words l.13917-13922); `research/build-engine.py`, `research/solver/code-id.mjs`, `.githooks/pre-commit`,
  `.claude/hooks/pre-tool.mjs`.
- The evidence (HEAD blobs): `results-shapes-beside.txt` 916e4641b0, `results-shapes.txt` 191e20c963,
  `reports/2026-11-17-shapes-read.md` 4ffc685fa6, `shapes-beside.mjs` 1b167fc20c, `shapes-panel.mjs` af92d5e2e7,
  `shapes-panel.json` 1aefb679e6, `share-rules-panel.mjs` 168dcae982, `DECISIONS-PENDING.md` 7dfcc74102,
  `reviews/2026-11-17-read-shapes.md` 8f9f947f83.
- Not opened: `research/solver/results/joint-wide-7002-stopped/`; no held-out seed read.

Verdict: PASS

No finding is BLOCKING; four MINOR. The guard does what D128 (2) rules on every case I could build, its reading of ages
and incomes is the engine's, the test pins the code to the block and each new check fails on its plant, and nothing
outside the couples' guard moves (the engine slice, the code id and every solver path are HEAD's). The four MINORs: the
guard's reach is wider than what the maintainer was asked; the age cap's card now gives advice that leads to the new
card, and nothing pins the order; the evidence file D128 cites no longer reproduces from its script; one reader of the
reason falls through to the couples-off words.

## Findings

1. **MINOR. The guard reaches further than the maintainer was asked and further than step 5 tested, and the reach is
   recorded inside D128 as if ruled.**
   - Put to the maintainer (`DECISIONS-PENDING.md` l.89-90): "keep a couple whose age gap is beyond three years and who
     hold a DB pension on the app's rules". D128 (2) records, inside the ruling, "the guard reads any other taxable
     income above nought".
   - The page files rent, annuities, and dividends or interest entered as a stream under the same kind as a DB pension
     (`App.jsx` l.13917, l.13922: "Other taxable income (DB pensions, annuities, rent, dividends, interest)").
   - `otherTaxableOf` (`couplesSwitch.js` l.97-104) takes any such income with an amount above nought, whether or not the
     engine ever pays it. My probe, the guard against `buildContext`'s reading, 60 and 52, a £15,000 stream as named:
     - an amount of £0.0000001 gives `gapincome`;
     - an income ending at 50 that starts at 67, or one starting at 110 in a plan to 100, gives `gapincome`. The engine
       pays neither: its paying window is empty.
   - The evidence is one size, kind and start: £15,000 a year from the state pension age (`share-rules-panel.mjs`
     l.15-16, l.72-74), on two bases. The reach on real couples is unmeasured: every library couple is three years apart
     with no other income.
   - Reading by kind is right in mechanism. The engine and the solver treat every other taxable stream alike
     (`buildContext` l.1819-1827), so the stream the harm was seen with is the stream the guard reads, and it is the only
     reading the page's inputs allow. Its direction is the app's rules.
   - What is not said is the trade. Every couple more than three years apart with any such stream, however small,
     gives up K2's gain over the app's rules. That gain was `+10.744` on the four tested gap couples without one.
   - Remedy: say the reach to the maintainer with this change, as the trade, so that any floor is theirs to set (on the
     amount, or an income paying within the plan). At least the comment's "whenever it is paid" should match the code:
     an income the engine never pays trips the guard.

2. **MINOR. The age cap's card now gives advice that leads to the new card, and nothing pins the order of the two
   reasons.**
   - The guard reads 'ages' before 'gapincome' (`couplesSwitch.js` l.114, l.119, l.122). The 'ages' card says "Ending the
     plan at an earlier age brings it within reach" (`PlannerCards.jsx` l.39).
   - A couple past the cap is more than three years apart at any end age below 117 (past the cap means the partner older
     by more than 120 less the end age). So every such couple with other taxable income and holdings inside the guard is
     given advice the guard will not honour.
   - Probe: S001 re-held 40/60, ages 60 and 82, a £15,000 DB pension.
     - The plan to 100: `ages`. The plan to 98, as the card advises: `gapincome`.
     - Without the income, to 98: `on`.
     - The user changes a material input (the plan's end) and is still not solved.
   - Not pinned by any check:
     - Check 8's sweep reaches the cap on none of its 390 age arrangements. Check 6's plans carry no other income.
     - A mutant guard that skips the cap for a gap-income couple (l.114 with `&& !gapIncomeOf(plan)`) passes all eight
       checks ("ALL PASS: 8 checks"). It returns `gapincome` for 60 and 72 with the plan to 110.
     - So the docstring's claim that check 8 covers "'ages' past the age cap" (l.61-63) is not exercised. A mutant
       reading the gap before the holdings does fail check 8, so the 'uneven' order is pinned.
   - The same advice given to an uneven couple past the cap predates this change and is not its fault.
   - Remedy, the choice being the agent's or the maintainer's: either read 'gapincome' before 'ages' where both apply
     (neither the gap nor the income moves with the end age), or make the 'ages' sentence conditional. Then add a check-8
     case past the cap with such an income, so that the order chosen is pinned.

3. **MINOR. The evidence file D128 cites no longer reproduces from its script.**
   - `shapes-beside.mjs` reads the guard live (l.53, l.59). The reviewer at the read checked that it gives
     `results-shapes-beside.txt` byte for byte (`reviews/2026-11-17-read-shapes.md`, item 1).
   - Re-run on this tree, it differs at l.41-42, 48-49 and 54-55:
     - the four DB gap units read "the app's rules (gapincome; ...)";
     - "the guard hands to the solver and K2's interval against APP lies wholly below 0: none";
     - the pooled line is "+10.106 (+10.051 to +10.154) on 21 units".
   - Every K2 and HS figure is unchanged, but re-printing the file would overwrite the record D128 rests on: three
     couples the guard handed to the solver, below the app's rules.
   - Remedy, in this commit: the script reads the guard as it stood at the read (the switch's plant `nogapguard`, named
     in section D's header), with a line beside it for the guard as now if wanted. The committed file then still
     reproduces.

4. **MINOR. The scenario list gives a gap-income scenario the words for couples switched off.**
   - `SolverFigures.jsx` l.203 has its own words for 'uneven' and 'ages'. 'gapincome' falls through to "a couple's plan
     keeps the app's rules for now.", which is the couples-off line.
   - It is reachable: the rows are saved scenarios, whole plans (`PlannerCards.jsx` l.97), and the list shows only beside
     a solved current plan. A couple whose current plan is solved, with a saved scenario that adds a DB pension, more
     than three years apart, sees that line under its own solved couple's figures.
   - Remedy: its own words, for example "a couple more than three years apart with other taxable income keeps the app's
     rules for now."

## What I checked, and found sound

- **(a) The readers.**
  - `App.jsx` l.8721-8722, l.8824 and l.12389: the solve is gated on `.on`, and `why` and `share` are passed to the card.
  - `SolverConfig.jsx` l.163 and l.188 read `.on` only: the speed box and the per-person limits are withheld, right for a
    couple kept off. `solverWords.js` has no reader.
  - `solverClient.js` `swapOf` is reached only for couples the page solves. `useSolver` is enabled by `solverRules`
    alone. `startFigures`' variants keep the ages and incomes. A scenario's solve button is withheld when the guard says
    off (`SolverFigures.jsx` l.198-208).
  - `Docs.jsx` l.70, l.199 and `PlannerCards.jsx` l.133 read `solverApproximations`, so they carry the new line.
  - The plant line sits inside `App`'s body (l.8693), before `coupleState` (l.8721), with no module-level statement left.
    No guard reader runs outside the render.
  - The engine slice as `build-engine.py` cuts it hashes `03ca15b8cb15...` at HEAD and on this tree, and
    `research/engine.mjs` is unchanged. `code-id.mjs` gives 603eeb595679.
- **(b) The reading against the engine.**
  - `amountOf` is `num(v, 0)`; `ageOf` is `buildContext`'s `req`, with the same defaults and clamp.
  - I probed 22 plans. All agree with `buildContext`'s reading except an `incomeType` of `'constructor'`, which the
    engine reads as tax-free through the prototype and the guard as taxable. The page cannot make that input.
  - The cases: a blank partner's age (a gap of 0 both ways); a blank first age (40); ages as text; fractional ages (3.1
    apart is far, 60.1 and 57.1 are not); the partner's income; unknown kinds, with and without a tax-free
    `taxTreatment`; `taxTreatment` on a known kind (ignored by both); "15,000" (nought to both); entries that are not
    objects.
  - Check 8 covers the elder entered second (the partner older, re-held).
- **(c) The tests.**
  - `couple-default.test.mjs`: ALL PASS, 8 checks. `--planted`: all ten plants fail exactly their wanted checks
    (`nogapguard` 8, `nogapline` 4, `firstnotelder` 2 and 8).
  - couple-solve-client 6, couple-swap 5, couple-order 6, couple-horizon 4.
  - `check-state.mjs` passes; hooks 26, fair-gate 51, plan-defaults 26, check-state test 8.
  - Check 1 pins `dbGapUpTo` and `DB_GAP_UP_TO === 3`, and its planted block without the key fails.
  - Check 8's new reads are 24 more files, all tracked, with no program spawned. The pre-commit hook will refuse the
    commit until `research/tests/fast-inputs.json` is staged with the new trace.
  - None of the seven edited files is protected (`protectedAmong`: []).
- **(d) The words.** The card and the coverage line say what the code does. "Have not yet been shown to do better than
  the app's own rules" is true of the class. It says less than step 5 found (worse on three of the four such couples
  tested), and it claims nothing for the solver. How much more to say is the maintainer's.
- **(e) The evidence.**
  - D128's figures are `results-shapes-beside.txt`'s (`-6.800`, `-10.950`, `-20.250`; `+10.744`; `+6.200`). The four DB
    gap units are exactly the ones the guard now keeps off (check 8's step-5 part, and the re-run in finding 3).
  - The three losses are on the page's own route (the read's reviewer: 0 of 400 paths differ) and far beyond noise.
  - The DB pension is the only feature the two harmed bases share against the two others, but it is confounded:
    - S147-db's near-twin S149 (the same balances, ages and risks) also differs in tax region (rUK against Scotland), in
      minimum pot (£90,000 against £205,000) and in where its cash sits (a cash account against a cash ISA);
    - S061-dbpart is another household;
    - the gap shapes moved only the partner's age today, so on three bases a younger partner spends 3 to 11 years before
      their unchanged retirement age, with no salary.
  - So the guard closes the harm found; whether it holds the cause is not shown, as the report says.
  - The read is EXPLORATORY. A default changes on it here by a ruling naming the run (CHECKLIST 1, as D95 and D109). The
    change returns to the app's rules a slice that D99 opened by inference only (every couple tested then was three years
    apart), which is the guard's own posture. No confirmatory read is needed to stop doing what an exploratory read found
    harmful.
  - The stated trade, S061-dbpart@gap8's `+6.200`, is the in-sample trade; the rest is finding 1.
- **(f) What the change carries, and what I did not see.**
  - The code default, the block and the pinning test change together, and the change goes to `main` on B1's gate (D92).
  - I did not see the harness's check 19 (f). By the coordinator, its plant run with the line at module level failed
    exactly the new case, and it is being run again on the moved line. The unplanted run belongs to B1's gate.
  - For the record, from the coordinator's measurement, not mine:
    - the new planner's first load on an empty plan is 240KB against its 240KB ceiling, so the next batch has no
      headroom;
    - the solver worker's module graph changes, so every stored solve is worked out again once after the deploy.
