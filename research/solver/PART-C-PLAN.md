# Part C: the solver in the app, behind a switch (the build plan, approved: D41, D42)

D40 (1): the candidate ships behind Part C's switch. This page turns the archived plan's Part C (archive/PLAN.md, "Part C.
The app (phases 7 to 12), behind a switch") into a build order, updated for what has happened since it was written. Nothing
of Part C exists in the code yet: no `SOLVER` switch, no solver worker, no `diff.js` or `distil.js`. The maintainer approved
the order on 29 Oct (D41) and settled couples the same day (D42); their answers are at the end.

## The ground rules (unchanged from the archive)

- One constant, `const SOLVER = false`, beside `SHOW_INHERITANCE` in `src/App.jsx`. Everything below is gated on it, so
  `main` stays shippable at every step and beta users can be switched to compare.
- Each phase lands on `main` only after `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED GREEN (CLAUDE.md),
  with the switch off and, from Phase 8 on, with it on as well.
- The app's defaults stay as they are (D12) until the switch is turned on for beta (Phase 12).

## What has changed since the archived plan

- **The engine behind the switch** is the candidate (fcd8096217b7) through `solveCandidate`, at 45 wealth points split
  across the worker's cores (gate 5 met on four cores; on one core about three times the product's solve).
- **The candidate's settings may still move.** The spending curve (the first year's cut to the floor, the raise before
  ruin, the smaller estate) is with the external reviewer (D40 (3)). The plumbing does not depend on the settings; the
  levers' defaults and their wording do.
- **Consent to change risk** now works for the candidate (D39): with it withdrawn the solve keeps the plan's own tiers.
  The tier test shows the tier moves carry just under half of the gain over the app's rules, so the consent lever's
  wording and default matter.
- **Couples (D42).** Part C ships for single households only. Under the switch a couple's plan keeps the app's rules (its
  withdrawal policy and tournament, as today), with a line on the Strategy tab saying so. Couples in the solver are the work
  after Part C (below).
- **No measurement on real devices yet.** N7 (a standalone page built from `src/solver`, run by the maintainer on a laptop
  and a phone, D20 (10)) has not run. The worker's design and the phone's coarser grid wait on it.

## The order

1. **N7 first** (small): the standalone timing page, so the maintainer measures a solve on a laptop and a phone before the
   worker is designed around a guess.
2. **Phase 7, plumbing** (does not depend on the settings): `src/solverWorker.js` (the `mcWorker.js` pattern) with the solve
   split across cores, progress per year and the tables back as transferable buffers; `solveState` (idle, solving,
   solved, stale); `firstAffectedYear` in a new `src/solver/diff.js`, so an edit re-solves only from the year it touches
   and a balance-only edit re-solves nothing; the locks (`plan.solver.locks`: the pension not before an age, a tier ceiling
   per wrapper, the lump sum free, never or now), normalised in `normalizePlan` and shrinking the move menu; the solver
   chunk loaded lazily, within the 220 KB ceiling; tables cached in IndexedDB under the plan's hash. Harness:
   `solver-progress-ui.cjs`.
3. **Phase 8, the Config tab** (its defaults wait on the spending-curve review): the policy fields hidden under the switch
   (kept in the saved plan for "your plan" and old exports); "What the solver aims for" at the top (dislike of spending
   cuts, the estate's priority, the minimum pot, raises, consent to change risk); "What the solver may change" (the locks).
   Harness: `solver-config-ui.cjs`.
4. **Phase 9, the Strategy tab**: your plan against the solved plan (survival with the spending delivered beside it, the
   median and unlucky-tenth pot, lifetime tax, the estate net of death tax); this year's actions per person, each with the
   survival cost of skipping it measured by simulation; the rule of thumb (`src/solver/distil.js`, a depth-3 tree with its
   fidelity); the next ten years' actions; "come back next year". Harness: `solver-strategy-ui.cjs`.
5. **Phase 10**: the projection runs the solved plan (your plan's survival beside it); the quick dials and the
   retirement-age dial re-solve (the age pre-solved three years either way, D18); the Simple page's safe spend and safe age
   by search over solves, on request; scenarios carry a solve; the audit table gains an action column; history labelled
   the out-of-model check.
6. **Phase 11, the phone**: the coarser grid N7 supports, the progress bar, the Strategy tab as the deck's slides.
7. **Phase 12, rollout**: the rename pass, "How the solver decides" in the docs, the tests and harnesses the archive names
   retired and replaced; `SOLVER = true` for beta once the full suite is green with it on and off; two weeks of both paths;
   then the switch removed for single households; the tournament code stays for couples (D42) until they run in
   the solver.

## After Part C: couples in the solver (D42)

What exists: `src/solver/couple.js`, the archived plan's Phase 5 pilot (two single tables, each with its own wrappers and
half the spending, and a yearly rollout over the funding split between the partners; tiers off; `solver-couple.test.mjs`).
It was measured once, under the old objective, against the best fixed rule on 19 couples (archive/PLAN.md), and never
with the candidate's settings. What it needs before couples run under the switch:
1. The archive's three known gaps (M4): its value leaves out the cut term, the year's spending level comes from the first
   person's move alone, and its expectation fixes five quadrature nodes.
2. The candidate's features: the tier state and its steps, the bridge reader (O11: one partner's bridge funded from the
   other's money, which neither single table sees), HR, and the solve split across cores (gate 5's timing for two tables).
3. A test like Phase 4's on a held-out couples panel: the candidate for couples against the app's rules and against the
   product's settings, with its harm rule, registered before it runs.
Its build plan comes to the maintainer when Part C's phases are under way.

## The maintainer's answers (29 Oct)

1. **The order**, N7 then Phase 7, with Phases 8 to 12 after: approved (D41 (1)).
2. **Phase 8's defaults wait** on the spending curve: agreed; the maintainer takes it to the external reviewer first, since
   it may change the settings (D41 (2)).
3. **Couples**: Part C ships without couples in the solver; couples in the solver come after (D42).
4. **Pull requests**: the agent's call (D41 (4)): one pull request to `main` per phase, each with the harnesses green and
   the switch off.
