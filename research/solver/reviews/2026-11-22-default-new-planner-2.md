# Review before a change of default, second round: the new planner by default, the fix round (D137)

Subject: commit d614f497 on ccr-1a3c603e-9i4qgs, which answers the first round
(`reviews/2026-11-22-default-new-planner.md`: FAIL, one BLOCKING, eight MINOR) in the one fix D81 (F) allows. Commit 7fe3e098
adds only that review and the fast tier's traced inputs. The default itself (`readPlanner`: unset reads as 'new') did not move.

## What I read

- The fix (`git show d614f497`; blobs at d614f497):
  - `src/App.jsx` 3de8147dcabe: `rememberPlanner` and `readPlanner` (l.7215-7222); `setPlanner` (l.8721-8728); `planStarted`,
    `solveOn` and the hook's call (l.8762-8773); `solverRules`' remaining uses (l.8853, 9327, 10686, 13405);
  - `src/Shell.jsx` 13a5553b1f7b (the `onPlanner` handler, l.281-286); `src/solverDiagnostic.js` b0ee7bb7daa6;
  - `research/ui-harnesses/solver-planner-ui.cjs` 759a899fcb77 (check 13, the plant `blanksolve`);
  - `solver-fullscale-ui.cjs` 4ccf434717bf, `load-perf-ui.cjs` da570737e7b3, `research/solver/launch-ready.mjs` 82b64dea819c;
  - STATE.md 0869869c12ba (D137).
- Every path to the solver's client and to `ensureIsolation`:
  - `src/useSolver.js` (the client imported only inside the hook's effect, past `if (!enabled) return`; `ensureIsolation` called
    only there, l.55);
  - `src/SolverFigures.jsx` e0604270db28 (`FiguresList`, `SolverScenarios`: each import of `solverClient.js` sits behind
    `solved`, or in a handler rendered only when solved);
  - `src/SolverSimple.jsx` (only on the Simple page with the switch on, which Shell never shows);
  - `src/StatusStrip.jsx` d76ddc602f38 and `src/solveStatus.js` 6133b712ccad (no client import);
  - `src/couplesSwitch.js` (pure); `research/build-engine.py` (the engine ends at `export {` l.7167, above everything changed).
- Run: `node research/tests/launch-ready.test.mjs`: 7 passed, 0 failed, on the new closing line. No browser harness and no gate
  were run, as asked.

## Verdict

Verdict: PASS

## The first round's findings, as answered

- **BLOCKING 1: answered.** The hook now gets `solveOn = solverRules && (planStarted || plant)` as `enabled`, and in its hold.
  `planStarted` is the quick start's own condition (l.16528), so wherever the quick start shows, nothing is solved. With `enabled`
  false, `useSolver` returns before loading the client, so no chunk is fetched and `ensureIsolation` is never reached.
  Nothing else reaches the client before a plan exists:
  - the levers' dial line, What if's scenario figures and Details' figures all wait on a solved solve (`FiguresList`,
    `SolverScenarios`, `solvedInHand` l.9327), and no solve can exist without `solveOn`;
  - `SolverHistory` takes figures as props;
  - the couples guard is pure;
  - the strip imports nothing of the solver's.
  The quick start's hand-over still solves at once. `onStart` calls `setPlan(p); setAskedPlan(p)`, and `toFullPlan`'s plan carries
  the readiness fields, including what you want to spend (`targetSpend > 0`). So `planStarted` is true, `asked` is true on a phone
  as on a desktop, the hold is false, and the solve starts after the 800 ms debounce.
  Check 13 can fail on the fault:
  - it opens a fresh desktop visitor (`open(b, null)`, planner 'new') and waits 4 s past the debounce;
  - it then requires no `solverClient`/`solverWorker` request, no worker message (`window.__asks`), and a strip not solving or
    solved;
  - under `blanksolve` the client chunk is fetched and the worker asked, so it fails;
  - check 14's plant `classicfetch` already shows the URL pattern matching the built chunk names.
- **MINOR 2: answered.** "Classic planner", from the new planner's header, the couples card, the quick start or the failure card,
  goes through `setPlanner('classic')` and then `onPlanner('classic')`. Shell now sets `which` to 'full' there, so `shown` stays
  'full' and the classic planner shows. The Simple page is then one "Open the simple version" away, its plan untouched.
- **MINOR 3: answered.** `rememberPlanner` holds the choice for the visit, and `readPlanner` returns it where storage throws or holds
  no valid value. Shell's `solverSwitch()` and the page now agree. A reload still forgets it where storage throws, which is all such
  a browser allows.
- **MINOR 4: answered** for the readiness checklist's full-scale solve. The ungated scripts are left, as said.
- **MINOR 5: answered** by a comment naming which planner each figure is. The same-origin check still covers the classic planner
  only; see finding 3 below.
- **MINOR 6:** the plants are to be run alone after the gate; see finding 2 below.
- **MINOR 7:** D137 recorded. A fast-tier pin I do not consider required; see finding 3 below.
- **MINOR 8: answered.** `launch-ready.test.mjs` passes on the new closing line.
- **MINOR 9: answered.** No other test pins the heading's words (check 18 reads the diagnostic's fields, not its heading).

## Findings

1. MINOR. On a phone, a fresh visitor's strip offers a button that does nothing.
   - The phone bar still shows the strip under `solverRules`, not `solveOn` (App.jsx l.13405).
   - For the empty plan on a phone, `solveState` is idle and `asked` is false, so `statusOf` returns "Not worked out on this phone
     yet" with the action 'request' (solveStatus.js l.41). The strip draws that as "Solve my plan" (StatusStrip.jsx l.11, l.36-38).
   - A tap sets `askedPlan`. `solveOn` is still false, so nothing is solved, and the strip goes blank.
   - Before the fix that tap solved the empty plan. Now it is a "Solve my plan" button above the quick start that does nothing.
   - Fix: guard the phone strip on `solveOn` as the hook is guarded, or have `statusOf` offer no request while the plan is not
     started. Its check could sit in check 12 or 13 on the phone.
2. MINOR. The plants run cannot show `blanksolve` on its own.
   - `blanksolve` maps to 13, as `noquickcontrib` already does, and `classicdefault` and `optinloses` share 15.
   - The all-plants run compares only the union of failing checks (solver-planner-ui.cjs l.860-862), so it cannot show each plant
     biting alone.
   - The agent's undertaking is to run `blanksolve`, `classicdefault` and `optinloses` each alone after the gate and keep the
     outputs. That run is what shows CHECKLIST 5 for these three; until it is in, they are asserted, not shown.
   - Under `blanksolve` alone, no other check should move: only check 13 opens an empty plan, and every other fixture sets a target
     spend or a balance.
3. MINOR, for the maintainer, nothing owed before the merge.
   - The default is pinned only by check 15 at B1's gate. A Node pin would need `readPlanner` out of App.jsx into a small module
     (with `rememberPlanner` and the plant), tested for unset, 'classic', 'new', junk and a throw. I do not hold the merge on it:
     the maintainer's word decides the default, and check 15 fails on its plant.
   - load-perf's same-origin promise and its typing check still run on the classic planner chosen. A fresh visitor's new planner,
     now without the blank solve, fetches only its own chunks until a plan exists, so the unchecked gap is small. It is still a
     line to add when load-perf is next touched.
