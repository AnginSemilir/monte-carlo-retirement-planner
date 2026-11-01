# Part C, Phase 8: the Config tab (the build note)

`PART-C-PLAN.md` item 3, after Phase 7 (merged, D50). Everything here sits behind `const SOLVER = false` in `src/App.jsx`.
With the switch off, the Config tab and everything the app computes are as today. One pull request to `main` at the end,
from a release branch cut at the gate's commit, merged by the agent on B1's gate (D51): `bash
research/ui-harnesses/run-all.sh 4173` and `bash research/ui-harnesses/run-all.sh 4173 --solver` (the switch-on gate,
below) both print ALL REQUIRED GREEN, both CI tiers are green on its head, and each new test has failed on its plant.

**Acceptance test.**
- `research/tests/solver-aims.test.mjs` passes, each check shown failing on its plant.
- The harness `research/ui-harnesses/solver-config-ui.cjs` (REQUIRED) passes.
- The fast suite and run-all.sh pass in both modes.

**Time box.** To 2 Nov 22:00 UK. When it runs out, stop and report.

## What the solver aims for: the levers and their defaults

The defaults are the candidate's, as Phase 4 and D43 left it. A plan that carries none of the levers solves exactly as
today, bit for bit. Each lever is a choice among positions that have been measured. None adds a setting nobody has run.

| lever | stored as (`plan.solver.aims`) | positions | solve option (`src/solverSettings.js` `aimsOptions`) | measured in |
|---|---|---|---|---|
| How much you dislike cuts | `cuts` | 1 (the default), 3, 6, 10 | `lambda`: that many times `APP_LAMBDA` (D46) | the dial's reads (D44, D46) |
| The estate's priority | `estate` | 'standard' (the default), 'lower' | `bequestWeight` 0.02 / 0.01 | Phase 4, both weights |
| Raises | `raises` | 'capped' (the default: up to 110% of target), 'blocked' | `raiseCap` unset (1.1) / 1 | the step-6 defaults (K3) |
| Consent to change risk | `riskConsent` | true (the default), false | `riskConsent` unset / false | the tier test (D39) |
| The minimum pot | `config.solvencyFloor`, the plan's own field | the plan's own, or one year of target when it is 0 | `solvePlan`'s rule, unchanged | the step-6 defaults (K2) |

- A higher estate priority than the default has not been measured, so it is not offered. Whether it should be is a
  question for the maintainer, and it would be measured first (D44 (1)'s rule).
- `aims` is normalised in `normalizePlan` (App.jsx `normalizeSolverAims`) and kept only where a plan carries it. A plan
  with locks and no aims normalises as before (`solver-locks.test.mjs`'s check 1 stands as written). Anything off the
  positions reads as the default.
- The aims travel inside the plan, so the solve's key (`src/solverKey.js`, the plan as the solver takes it) carries them.
  `solveForApp` and `solveKey` take their options from the plan. An explicit `lambda`, used by the research and the
  tests, still overrides the dial.

## The tab under the switch

Single households only (D42). For a couple the tab stays as today, with a line saying the solver plans for one person, and
nothing is solved: `useSolverState` is handed `SOLVER && !isCouple`.

- **Hidden** (the fields stay in the saved plan, for "your plan" and old exports):
  - the decumulation policy and its blurb;
  - the drawdown strategy;
  - the allowance harvest and its ceiling;
  - the one-off cost lookahead;
  - the policy search block: the button, the priorities, the results and trade-off cards;
  - the policy's playbook.
- **Kept:** the guardrails, relabelled "your plan only", since the solved plan's spending levels are its own rule (the
  archived plan's Phase 8). Everything in the other cards stays: the cash buffer, returns, tax and the number format.
- **"What the solver aims for"** at the top: the five levers above. The dial uses the wording of `PART-C-WORDING.md`
  section 3, and its live line waits on Phase 10. Under the levers a solve-state line reads idle, solving with its
  progress, solved, or out of date. It carries the solve's key (`data-solve-key`), so the harness can check that a lever
  re-solves.
- **"What the solver may change"**: the locks of Phase 7c (`plan.solver.locks`).
  - Do not draw the pension before an age.
  - The riskiest tier the pension and the ISA may hold, each beside the plan's own tier.
  - The tax-free lump sum: 'free' (named with the plan's own strategy), 'never' or 'now'.

## Turning the switch on for a harness, not for the site

`vite.config.js` gains a plugin, `solver-preview`, that does nothing unless the build runs with `SOLVER_PREVIEW=1`.
- With it, `src/App.jsx`'s `const SOLVER = false;` reads `true`, and `const SOLVER_OPTS = null;` reads the JSON in
  `SOLVER_PREVIEW_OPTS` (the harness's light settings), which `useSolver` hands to the key and the solve.
- If either line has moved, the plugin stops the build, so a harness can never pass on a build whose switch stayed off.
- The site's own build is untouched. The switch stays the one literal line that Phase 12 turns on.

## The switch-on gate (the launch plan's F7; D41, D51)

`PART-C-PLAN.md` asks for ALL REQUIRED GREEN "with the switch off and, from Phase 8 on, with it on as well".
`run-all.sh 4173 --solver` builds the site with the plugin above at the harnesses' light settings into `dist-solver`,
serves it, and runs every REQUIRED harness against it. A harness that tests what the switch replaces is listed in the
script's `SWITCH_OFF_ONLY` with what covers it with the switch on. The engine suites do not read the switch and run in the
default mode only.

### On a phone (the launch plan's B10)

The switch-on gate found the tab too long on a phone (3.0 to 3.8 screens against the phone harness's 2.0), the dial's
buttons under 44px, and the solver starting by itself on load, four workers beside the projection (phone-perf). So, on a
phone: each solver card folds under its heading (`PhoneCollapse`, as the other cards do), the solve line staying in view;
the choices' buttons are 44px; and the solve waits for "Solve my plan" (`data-solve-request`), then follows the plan for
the session. Phase 11 adds the expected time and the phone's own budget.

## The tests

**`solver-aims.test.mjs`** (Node, S126 at light settings):
1. The defaults.
   - A plan without aims, and one with every aim at its default, give `{ lambda: APP_LAMBDA }` and the same tables to the
     bit.
   - The library's 420 households normalise with no `solver` key.
   - App.jsx's copy of the dial's positions is `APP_DIAL`.
2. Each lever maps to its option, and the solve sees it:
   - `cuts` 3: lambda 3 times, and other tables;
   - `estate` 'lower': `bequestWeight` 0.01, and other tables;
   - `raises` 'blocked': no year above target on 200 engine paths, where the default has some;
   - `riskConsent` false: the plan's own tiers on every year of 200 paths, and the run record says no consent, where the
     default changes tier.
   - Plants: a copy of `aimsOptions` that drops each lever in turn fails its check.
3. Normalisation: values off the positions read as the defaults; locks without aims are kept as before.
4. The key: each lever another key; the same lever twice the same key.

**`solver-config-ui.cjs`** (REQUIRED, on the built site and on a preview build beside it):
1. With the switch off: the Config tab as today (the policy block present, neither solver card), and no solver code
   fetched.
2. The preview build, a single household:
   - the policy fields hidden and both cards shown;
   - each lever and lock writes `plan.solver` in the saved plan and moves the solve's key to Node's key for that plan;
   - a lever re-solves to solved;
   - the hidden policy fields are unchanged in the saved plan.
3. The preview build, a couple: the tab as today, with the solver's line, and nothing solved.
