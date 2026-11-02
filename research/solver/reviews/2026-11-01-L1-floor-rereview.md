# Re-review before a change of default: step L1, the solver's floor at 80% (B2, D51), after the fix of finding 1

Subject: the fix of the BLOCKING finding in `reviews/2026-11-01-L1-floor.md` (solver-app.test.mjs check 2), and the
fixes stated for MINORs 2 and 3. The rest of the staged step L code is the code that review read. Its blobs are unchanged:
src/solverSettings.js b2189c288939, src/solverApp.js f417d53c03f9, src/solver/solve.js 635f03336302, src/App.jsx
975c469b1d15.

## What I read

- research/tests/solver-app.test.mjs in the working tree, 20bd7dcea274 (index and HEAD 9e8138f7ec22; `git diff`: l.6-8
  the header, l.58-64 check 2).
- research/tests/solver-floor.test.mjs staged 3a461cee79dd. The first review read ba4153d8bad0; the diff is the 20001
  case, l.41-44.
- research/ui-harnesses/solver-config-ui.cjs staged fd6d8eb4501a (l.99 `before`, l.100 KEEP, l.131 `after`, l.141).
- research/solver/STEP-L.md staged d833dfd0e46a (l.20-37).
- The research preparations: research/solver/audit-7uf.mjs ed866e786e5b l.43, research/tests/solver-progress.test.mjs
  72e0f66b2d1a l.30, research/solver/phase4-panel.mjs f5d8e7411e88 l.92-99.
- research/solver/candidate.mjs 8e17a0268f01 (candidatePlan l.87-91); src/solver/bridge.js 0e7df8bd33d3 l.55.
- The engine: src/App.jsx, which builds research/engine.mjs (git-ignored, 33e904ba7beb). The lines: num l.50-54,
  BLANK_PLAN's `targetSpend: ''` l.833, normalizePlan's scrub l.1140-1147, buildContext's floor l.1597-1598, the guardrails
  block from l.2295 with the floor at l.2334-2337, resolveMpaa l.2682.
- research/tests/run-all.mjs 8c150b8a4f30 (FAST l.31-39 includes solver-app; FAST_JOINING l.42-43 runs solver-floor in
  the fast tier) and .claude/hooks/pre-tool.mjs 63d837fc9014.
- The maintainer's unlock is not something I can see. I took it from the request.

## What I ran

Scripts are in the session scratchpad, rr/. Nothing in the repository was written except this file.

- `node research/tests/solver-app.test.mjs` on the staged code plus the edit: ALL PASS, 12 checks, in 3 min 17 s. Check 2:
  "S126: solveForApp's 2410 arrays (3115746 values, the reference's among them) the same bit for bit as the candidate's
  solve with the floor at 80% (61.44 s)".
- rr/plant2.mjs, check 2's plant run directly. The app as before L1 (solver-floor.test.mjs check 4's path: the plan
  prepared without the floor, APP_CANDIDATE and aimsOptions) against check 2's new reference, compared with check 2's
  own `arrays()` and `differ()`. Result: "the app as before L1: spendLevels [1,1.1], 2410 arrays; the new reference:
  spendLevels [1,1.1,0.95,0.9,0.8], 2410 arrays; differ() = 1678878: check 2 FAILS (plant caught)".
- rr/plans.mjs, no solves. It builds three plans for each of the 210 library singles:
  - A, check 2's reference plan: `candidatePlan(floored(planOf))`, built as l.30 and l.61 build it;
  - B, audit-7uf l.43's (the same as solver-progress l.30's), through candidatePlan;
  - C, the app side: `appPlan(prepareForSolve(planOf))`.

  Output: "test reference == audit-7uf/solver-progress plan (JSON) 210; == app side 210; normalised equal 210; ctx
  floor/target/mpaa equal 210". On S126: target 29000; the floor 23200 in all three plans; the menus the same; mpaaAgeSelf
  58 in all three. resolveMpaa's mpaaAgeSelf is the same with and without the floor on 210 of 210 singles with the
  guardrails off, and on 210 of 210 with them on.
- rr/raw.mjs. Raw S126 has lookahead 5 and mpaaAgeSelf '', which resolveMpaa sets to 58. `prepareForSolve(raw)` ==
  `prepareForSolve(planOf)` on S126 (JSON). All 210 singles have a lookahead above 0, and resolveMpaa moves mpaaAgeSelf
  on all 210.
- `node research/tests/solver-floor.test.mjs`: ALL PASS, 9 checks, in 77 s. The new check: "2. a target of 20001 prepares
  with the floor at 16001".

## The questions

1. **Finding 1 is closed, and check 2 is not weakened.**
   - **The fix.** The app side still gets S126 without a floor (l.48, l.57). The reference is solved on the same plan with
     `floorSpend = Math.round(0.8 x target)` (l.61-62). The check passes.
   - **The plant fails it.** The app as before L1 differs from the new reference in 1,678,878 of 3,115,746 values
     (rr/plant2.mjs).
   - **The added `spendLevels` assertion (l.64)** stops the reference from losing its floor without the check noticing.
   - **The options side is unchanged.** The app side spreads APP_CANDIDATE, aimsOptions at position 1 and `research`, and
     sets the explicit lambda. The reference spreads CANDIDATE_OPTS and SMALL, with the same lambda and points. Check 3
     still compares the split against the same `A`.
   - **The reference's floor is an independent pin.** It uses its own literal 0.8 and Math.round, not APP_FLOOR. A
     change to APP_FLOOR therefore fails check 2 as well as solver-floor check 1.
   - **The comparison now covers more of the solve.** The reference's menu carries the cut levels 0.95, 0.9 and 0.8. The
     floorless reference had the menu `[1,1.1]`, so the cut part of the solve was outside the comparison before.
2. **The floored reference is built exactly as the research builds its plans, and the order cannot matter here.**
   - **The same plan.** On 210 of 210 singles, the reference plan is JSON-identical to audit-7uf l.43's and
     solver-progress l.30's, and to the app side's. The rounding expression is the one phase4-panel.mjs l.98 uses.
   - **Order route (a), the floor's value.** It is `Math.round(0.8 x E.num(targetSpend, 0))` in both orders. normalizePlan
     leaves a number alone. Its scrub turns null, undefined and objects into '' (App.jsx l.1140-1147). num reads '' as 0,
     just as it reads null and undefined (l.50-54). BLANK_PLAN's target is '' (l.833), so normalising first fills in no
     default target. A numeric floor set after normalisation is also what normalisation would have left in place.
   - **Order route (b), whether resolveMpaa sees the floor.** Its deterministic run reads the floor only through
     `ctx.floorFrac` in the guardrails' floor (App.jsx l.2334-2337, inside `if (ctx.guardrails)` from l.2295). Nothing
     else in the engine reads floorSpend or floorFrac (l.1597-1598 and l.1938 build the context). Both preparations turn
     the guardrails off before resolveMpaa runs.
   - **Where it could matter.** The order could change the MPAA age only through a guardrails-on deterministic run.
     Neither path has one.
   - **Measured.** The MPAA age is unchanged by the floor on 210 of 210 singles, with the guardrails off and also with
     them on.
3. **MINOR 2 is half fixed (finding 1 below).** The 20001 case catches Math.floor and a truncation, but not Math.ceil.
   That is a gap in the case I proposed, not in how it was carried out.
4. **MINOR 3 is fixed only for a write-back after the page has loaded (finding 2 below).**
5. **MINORs 4 and 5 are recorded in STEP-L.md (l.32-37).** The record matches what the first review found.

No decided-defaults line is needed, for the reasons in the first review (question 5). APP_FLOOR is now pinned twice: by
solver-floor check 1, and bit for bit against the research's own preparation by solver-app check 2.

Verdict: PASS

## Findings

1. MINOR. The rounding case does not catch Math.ceil. `0.8 x 20001` is 16000.800000000001: Math.round and Math.ceil both
   give 16001, and Math.floor and Math.trunc give 16000 (rr/plans.mjs). So a `Math.ceil` in prepareForSolve still passes
   solver-floor.test.mjs (l.43-44 and check 1 at l.28, which compares against Math.round on whole-pound library floors).
   The case I proposed in the first review (finding 2) had this gap. Fix: add a target such as 20004. Its 80% is 16003.2:
   Math.round gives 16003 and Math.ceil gives 16004. The difference is under a pound, and the code's expression is
   phase4-panel.mjs l.98's.
2. MINOR. The harness's floor check is relative. solver-config-ui.cjs l.141 compares `KEEP(after)` with `KEEP(before)`.
   `before` is read at l.99, after the page has loaded and prepared the plan for its key, but before the first solve
   completes. So a write-back made when the page first prepares the plan would be in both `before` and `after`, and the
   check would pass. A write-back at a solve's end or on a lever change would be caught. Fix: also compare
   `E.num(after.spending.floorSpend, 0)` with the fixture's own (S126: 0).
3. MINOR. This gap predates L1 and does not come from the fix; it can wait for the next unlock of the file. Check 2 passes
   a plan that is already normalised with the lookahead at 0 and the MPAA resolved (solver-app.test.mjs l.30, l.48).
   prepareForSolve's own lookahead and resolveMpaa steps (unchanged by L1: HEAD's prepareForSolve had both) are therefore
   not compared with the research's preparation.
   - **Dropping the lookahead step** fails loudly: the engine refuses a table with the lookahead on (bridge.js l.55).
   - **Dropping resolveMpaa** would not be caught by any test I found: no test compares prepareForSolve with a research
     preparation on a raw plan. I did not measure whether S126's solve moves with the MPAA age.
   - **Fix.** prepareForSolve on raw S126 is JSON-identical to prepareForSolve on `planOf('S126')` (rr/raw.mjs). Passing
     the raw plan to solveForApp in check 2, with the reference unchanged, would therefore leave the solve and its time as
     they are, and the check would pin the whole preparation in audit-7uf's order.
