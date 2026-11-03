# The launch plan, reworked: from Phase 8 to the solver live in the app (1 Nov)

The external review, for the maintainer and the agent. It is on `review/external-2026-10-21` and is not for merging. It
changes no default. Every decision in it is the maintainer's (section 3).

**Where the figures come from.** Four scripts, each with its output committed beside it:
- `launch/facts.mjs` prints `launch/results-facts.txt` from three sources: the agent's files at 276ae09, the review's
  files, and GitHub's answers saved by `launch/fetch-ci.sh`.
- `launch/app-timing.mjs` prints `launch/results-app-timing.txt`. These are the app's own solve and simulation, timed
  the way the solver's worker runs them, on S126 and S370, with and without the floor.
- `launch/estimate.mjs` prints `launch/results-estimate.txt`: arithmetic on those timings, nothing else.

A fifth script, `launch/cache-key.sh`, builds the site twice to test F19. It could not run here, because this container
cannot reach the npm registry. It is for the agent.

Nothing here is a research result. The timings are this container's: two cores, one process on each.

An independent review of a draft (a separate agent, read-only) checked every claim against the code and the project's
documents. Its points that held are folded in, each verified against its source.

## 0. In one page

**Updated 3 Nov** (the maintainer: "draft the new design fully, enough to provide prescriptive details in the updated
plan"):
- step U, the new planner, goes between step P and Phase 11 (section 4; its spec `2026-11-03/LAYOUT.md`);
- Phase 11 and Phase 12 are recast for it;
- the calendar below is redone from the merges so far.

The rest of this section is as written on 1 Nov.

**Where it stands.**
- **The candidate.** It is d71f65ae871e: Phase 4's candidate (fcd8096217b7, which passed Phase 4), plus the failure year
  charged at what it can pay (D43). The maintainer kept that addition after its own held-out read missed its predictions
  (D46 (1)). It ships behind the switch (D40).
- **Part C.** Phase 7's plumbing is on `main`. Phase 8's Config tab is built on the branch, and its pull request is not
  yet open. Phases 9 to 12 do not exist.
- **Couples.** A pilot.

**The finding that changes the most: the app gives the solver no spending floor, so the app's candidate cannot cut
spending** (F1).
- No screen asks for a floor, and the solve's preparation sets none. None of the library's 210 singles carries one.
- With no floor, the menu's spending levels are the target and the 110% raise only: `[1, 1.1]` on S126 and S370.
- Every test of the candidate set the floor at 80% of the target: Phase 4's panel, gate 5, and the curve, dial, tier
  and lock runs built on that panel.
- So, as wired:
  - the dial has almost nothing to act on;
  - the safe starting spend is always the full target;
  - Part C's wording about starting below target never shows.
- **The cost, on S370 from the library:** the app's solve survives 20.3% of 300 paths as wired, and 84.3% of the same
  paths with the floor at 80%.
- **The fix comes first**, at the tested 80% (B2, step L1).

**What else this rework changes.** Each item comes from a finding in section 2.
1. **Every open decision with the review's best recommendation** (section 3), plus six rules (R1 to R6) that let the
   pending measurements decide without another stop. The unlocks the plan's test, CI and hook changes need are
   listed, so the agent can run to the beta without stopping.
2. **Step 0 goes first:** the CI and hook changes.
   - the full suite on every push instead of nightly, one run at a time per branch, since the agent works around the
     clock (B14);
   - cheaper commits;
   - a watchdog.
3. **The switch-on gate is built before Phase 8 merges.** The approved plan already requires it from Phase 8 (D41).
4. **A levers step (L) before Phase 9:**
   - the floor;
   - the dial's positions, measured in two variants, since one of them uses a chance of being alive;
   - a test of every pair of settings;
   - a probe of one-off costs, which no single household has ever been tested with.
5. **Cross-origin isolation moves from Phase 12 to Phase 10.** In one worker:
   - an edit takes 11 to 14 minutes to reach a solved and simulated plan (S126, S370);
   - a dial position from cold takes 21 to 25 minutes.
6. **The further performance step (P) goes after Phase 10 and before the phone**, so the phone is built on its results.
   - a profile first;
   - then the exact cuts;
   - then the inexact options, measured, for the maintainer.
7. **A runtime opt-in for the beta**, so two weeks of both paths, and a rollback, need no new build.
8. **Couples as Part D, built during the singles' beta.**
   - Its registered test is built as Phase 4's was: D36's arm A, the product's settings, A1, A2 and S1, with D34's
     flags.
   - A pilot sizes it.
9. **The research track cannot change the launch candidate.** A gain opens a v2 registration after the launch, and a
   harm goes to the maintainer at once.

**The calendar**, redone 3 Nov from the merges on `main` (an estimate; the time boxes rule):

| step | done by |
|---|---|
| Step 0 and Phase 8 | merged 2 Nov 15:01 UK (pull request 3, 8b54321) |
| Step L, with L4 and L5 read | merged 2 Nov 19:13 UK (pull request 4, 3370960) |
| Phase 9 | merged 3 Nov 04:14 UK (pull request 5, 725c661) |
| Phase 10 | 4 Nov (its gate on the release head) |
| Step P | 6 Nov (box two days) |
| Step U, the new planner | 10 Nov (box four days) |
| Phase 11, the phone on the new planner | 11 Nov (box one day) |
| Phase 12 ready | 13 Nov (box two days) |
| The singles' beta | 13 to 27 Nov, then on by default at the maintainer's word |
| Couples: D1 to D3 | 13 to 19 Nov |
| Couples: D4's pilot, registration and run | from 20 Nov; 2 to 4 days on four cores, 4 to 8 on two (the pilot sizes it) |
| Couples: D5 (the couples' screens in the new planner), then the couples' beta | after D4's read; the beta about early December, for two weeks |

## 1. Where it stands (the repo check, 1 Nov)

| | state | source |
|---|---|---|
| The candidate | d71f65ae871e (candidate.json): Phase 4's fcd8096217b7, which passed Phase 4 on both estate weights, plus D43's failure year at what it can pay, kept after its own held-out read MISSED (D46 (1)). Ships behind the switch (D40). | STATE.md sections 2 and 3 |
| The levers | Phase 8's dial maps "how much you dislike cuts" to lambda alone, at 1, 3, 6 and 10 times (D46). The review's mechanism (the age weights and the candidate's tiers, LOCK.md section 4) is ported but off and not wired (D48). | src/solverSettings.js `aimsOptions`; facts A |
| The floor | No line under `src/` sets the plan's spending floor, and none of the library's 210 singles carries one. With no floor, the candidate's menu is the target and the raises. Phase 4's panel and gate 5 set the floor at 0.8 of the target, and the curve, dial, tier and lock runs build their households from that panel. | facts E |
| Part C | Phase 7 is merged (899e5f0, pull request 2, 31 Oct 21:29 UK). Phase 8 is built on the branch (91cd38e): solver-aims ALL PASS 21; solver-config-ui 23 checks, recorded in the commit's message (there is no results file). No pull request yet; the branch is 7 commits ahead of `main`. Not built: `diff.js` (by design, PHASE-7.md 7b), `distil.js`, the Strategy tab, the projection under a solve, the phone, isolation on the live site. | facts A |
| The switch | `src/App.jsx` line 6925, below the engine slice, which ends at line 6897. | facts A |
| The page's solve | Whole in one worker unless the page is cross-origin isolated, which GitHub Pages cannot make it. The solved plan's simulation runs in the owner worker alone. | facts A |
| Its cost: the app's own (this container, one core) | With the floor at 80%: <ul><li>a solve takes 330 s (S126) and 456 s (S370);</li><li>a path takes 61.9 and 72.6 ms, so 5,000 paths take 5.2 and 6.0 minutes;</li><li>an edit to a solved and simulated plan takes 10.7 and 13.7 minutes;</li><li>the dial at ten from cold takes 21.1 and 25.4 minutes.</li></ul> Tables are 227 and 265 MB a solve, and a locked position holds two (454 and 530 MB). The locked solve takes 0.91 to 0.97 times the base's time; its simulation 1.80 to 1.99 times. | results-app-timing.txt, results-estimate.txt |
| Its cost: gate 5 (the agent's machine) | 428.8 to 569.2 s on one core, and 113.6 to 160.5 s split four ways (the split's speed-up x3.55). Chromium: 668 s for S370 in one worker. | facts C |
| The cache | Keeps one solve, the latest: each store replaces the one before. | facts G |
| Couples | `src/solver/couple.js`, the archive's pilot: 180 lines, tiers off, M4's three gaps open. `solver-couple.test.mjs` is in the full tier only. | facts A, G |
| One-off costs | None on Phase 4's 40 households or the library's 210 singles. All 210 of the library's couples have one. The archive (M12): "The solver's handling of one-off COSTS has never been tested on a single household." | facts G |
| The bridge safety margin | On the Config tab under the switch ("Tournament bridge safety margin (%)"). No solver file reads it. D18 says "the bridge safety margin stays as a lock". | facts G |
| The tests | 137 files, 52 in the fast tier. solver-aims, lock-tiers, solver-couple and the two splits' tests are in the full tier only, which so far has run by hand. | facts A, B |
| Protected files | The pre-tool hook refuses edits to: the fast tier's list (`run-all.mjs`) and every test in it, `.github/workflows/`, `.githooks/` and `.claude/hooks/`. | `.claude/hooks/pre-tool.mjs` |
| CI | The fast tier on a push takes 40 minutes (52 files, 1.11 CPU-hours; pay-where and speed-port are 42% of it). The full tier by hand took 3 h 47 min of the job's 300-minute limit (135 files, 7.54 CPU-hours). The schedule reached `main` on 31 Oct at 21:29. One scheduled time has passed since (1 Nov 02:17), and GitHub lists no scheduled run. A scheduled run tests `main` only. | facts B |
| The hooks | The pre-commit hook runs the fast tier, 2 at a time, on any commit that touches `src/`, including commits that change only the screens. | facts A |
| The harness gate | 17 REQUIRED harnesses, built with the switch off only. solver-config-ui builds its own switch-on preview. | facts A |
| The research | The windfall and savings splits are built, off and not run. GAIN-BUCKET is open and not run. HARVEST-SIZING.md sizes it two ways: the 40 households (about 16 core-hours), or the 20 whose taxable account is 10% of wealth or more (about 8). | DECISIONS-PENDING.md, HARVEST-SIZING.md |
| The live site | GitHub Pages, built from `main`, with no headers. Saved plans live in the visitor's browser, keyed to the origin. | facts A |

## 2. What the plan gets wrong or leaves open

Ranked, most important first. Each finding names its fix and where the fix sits in this plan.

**F1. The app's candidate has no floor, so it cannot cut** (facts E; results-estimate.txt).
- `prepareForSolve` leaves the plan's `floorSpend` at nothing, and no screen asks for it.
- So the menu's spending levels are `[1, 1.1]`, where every tested candidate had `[1, 1.1, 0.95, 0.9, 0.8]`.
- As wired:
  - the dial has nothing to act on but the failure year;
  - the safe starting spend is always the target;
  - Part C's wording never triggers.
- On S370, survival is 20.3% of 300 paths as wired, against 84.3% with the floor on the same paths.
- **Fix:** B2 and step L1, the floor at the tested 80% until another floor is measured.

**F2. The levers' mechanism has no decision, and the review's version brings in a chance of being alive** (facts C, D,
G).
- The review recommended the dial with the age weights, on the candidate's tiers (LOCK.md section 4). D48 ported both
  options, off. DECISIONS-PENDING.md lists them only as research options, and Phase 8 wires lambda alone.
- **Unlocked, the dial moves the risk.** The retirees' equity at retired year 1 goes from 24.7% (CANDD) to 34.7% (DIAL3
  and DIAL10 alike). Locked, D10MLK holds the candidate's 24.6%, and the lock costs -0.10 points of survival (-0.27 to
  +0.07).
- **The age weights** weigh a cut's cost "by a Gompertz chance of being alive"; "survival stays the currency". The
  archive records "Mortality: No death probabilities. The horizon is a fixed plan-to age. A maintainer constraint, not a
  gap."
  - That ruling lapsed with the 21 Oct reset (STATE.md section 3), but shipping the weights should be the maintainer's
    knowing choice.
  - The lock without the weights has not been measured.
- **Fix:** B3 offers both variants, and step L4 measures both on one code.

**F3. One-off costs have never been tested on a single household** (facts G).
- Phase 4's 40 households and the library's 210 singles have none.
- Under the switch, Phase 8 hides the cost lookahead, which the solver's choices replace.
- The archive's M12 named the risk: a large cost can push a year's pension draw through a band.
- **Fix:** step L5, M12's probe on singles, read before the beta.

**F4. The live site solves on one core** (facts A, C; results-estimate.txt).
- GitHub Pages cannot send the two headers the split needs, and the plan defers isolation to Phase 12 (DECISIONS-PENDING
  row 10).
- In one worker, an edit takes 10.7 to 13.7 minutes to reach a solved and simulated plan.
- These multiply that cost, and none has a time budget:
  - **the 'auto' rule on the tier above** solves a thin plan twice: without the tier, then with it when the first
    survives under 85% (`solvePlanAuto`). The plans that need the solver most are the thin ones;
  - **D18's age dial**, pre-solved three years either way after every edit: six solves;
  - **the Simple page's safe spend**, found by a search over solves;
  - **Phase 9's cost of skipping each action**, one simulation each;
  - **the rule of thumb's fidelity**, one more simulation.
- **Fix:** B5 (isolation in Phase 10), budgets in Phases 9 and 10, and step P.

**F5. A locked position doubles the memory and the simulation's cost** (results-estimate.txt).
- The lock reads the base's chooser at every decision. So the base's tables stay beside the position's (454 and 530 MB
  for the two solves), and a simulated path costs 1.80 to 1.99 times the base's.
- **Fix:** step P cuts what it can, and Phase 11, which now follows P, sets the phone's budget from the result.

**F6. The cache holds one solve** (facts G).
- Each store replaces the one before, by design, at about 260 MB a solve.
- These all need more than one solve:
  - a locked position, which needs its base;
  - the dial's live line;
  - the age dial;
  - the Simple page's search;
  - scenarios.
- **Fix:** step L2 stores the base and the latest position under a byte budget, with the oldest evicted and a full quota
  handled. Searches and scenarios keep their figures, not their tables.

**F7. The switch-on gate is already required, and not built.**
- PART-C-PLAN.md (approved, D41) requires ALL REQUIRED GREEN "with the switch off and, from Phase 8 on, with it on as
  well".
- PHASE-8.md and `run-all.sh` check it with the switch off only.
- **Fix:** Phase 8 builds `run-all.sh --solver` before it merges.

**F8. The plan's own changes touch protected files** (`.claude/hooks/pre-tool.mjs`).
- The protected files: the fast tier's list and every test in it, `.github/workflows/`, `.githooks/`, `.claude/hooks/`.
- Each earlier addition to the fast tier had its own unlock.
- **Fix:** B8 lists every unlock the plan needs, so the hook does not stop the agent part-way through a step.

**F9. The beta switch is a build constant.**
- Two weeks of both paths, and a rollback, each need a new build.
- Once `SOLVER` reads true, `vite.config.js`'s preview plugin stops every preview build.
- **Fix:** B6 and Phase 12.

**F10. Every code commit pays for the fast tier, including commits that change only screens** (facts A, B).
- It takes 40 minutes in CI, and about as long in the session at `-j 2`.
- **Fix:** B8 and step 0. pay-where comes out, and each fast test is skipped when the files it reads are unchanged.

**F11. A nightly run does not suit an agent that works around the clock** (facts B).
- A fixed hour is not a quiet time for the agent. A nightly run tests a day's pushes at once, up to a day late.
- A scheduled run tests `main` only, not the branch where the work is.
- The schedule has had one chance to fire and has not.
- The full tier has 24% headroom under the job's limit.
- **Fix:** B14 and step 0. The full tier runs on every push, in two shards, one run at a time per branch. A weekly run
  on `main` is the backstop.

**F12. Two "safe spends".**
- The Strategy headline's "safe starting spend" is the first year's spending.
- The Simple page's "safe spend" is the highest target the plan keeps at X%.
- **Fix:** Phase 10 renames the Simple page's figure.

**F13. The archive's phone grid (14 points) is far below V3's coarsest accepted rung (45)** (facts F).
- V3's ladder, in survival points on the panel mean:
  - from 20 to 30 points, +0.364 at the estate weight 0.02 and +0.336 at 0.01;
  - from 30 to 45 points, +0.212 and +0.271, up to +0.47 on a household (S380 at 0.01).
- **Fix:** B10.

**F14. The tournament, priorities and tradeoffs harnesses.**
- The archive retires them at Phase 12, but D42 keeps the tournament for couples.
- **Fix:** Phase 12 points them at a couple's plan.

**F15. Research results have no rule against the launch candidate.**
- A late gain could reopen the candidate mid-rollout.
- A harm has no stop at all.
- **Fix:** B7 and section 5's stops.

**F16. A failed solve has a line on the Config tab, but no rule elsewhere.**
- **Fix:** Phase 9. Every solver view falls back to the plan under the app's rules, with the line and "try again".

**F17. The beta has no definition of done, and the obvious diagnostic would leak amounts.**
- The app sends nothing back.
- The run record holds amounts: `meta.resilienceAt` is the opening wealth.
- The feedback link opens a public issue (DEPLOY.md).
- **Fix:** Phase 12.
  - a diagnostic built from a whitelist of fields, tested with a planted amount;
  - a readiness checklist printed by a script;
  - a go or no-go list for the maintainer.

**F18. The bridge safety margin shows under the switch, but nothing in the solver reads it** (facts G).
- D18 says it "stays as a lock".
- **Fix:** B13.

**F19. Every deploy would likely throw away every stored solve** (facts A; from the code, NOT MEASURED).
- The cache keys a stored solve on the worker's own URL (`CODE`).
- The worker imports the whole of `App.jsx` (`import * as App`), screens included. Its built file is named by a hash of
  its contents.
- So a change to any screen would move the key, and each merge to `main` deploys.
- `launch/cache-key.sh` tests it. It builds the site twice, the second time with one button's text changed below the
  engine slice. That is a code change, because the minifier strips comments.
- **Fix:** step P1 (g), after the script confirms it.

**F20. Couples have no start point, panel, cost or screens.**
- PART-C-PLAN.md says their build plan comes "when Part C's phases are under way". They are.
- **Fix:** Part D (section 6).

**F21. Smaller points.**
- **The rule of thumb's code.** PART-C-PLAN.md puts `distil.js` in `src/solver`, where every file moves the e3pcls pin.
  Phase 9 puts it beside the solver's app files instead, or retakes the pin.
- **What the archive and the wording note ask for, kept here:**
  - the printable sheet (`actionPlan.js`);
  - the coverage card in the docs;
  - the wording's "never back at target" case.

## 3. The decisions: the review's best recommendations (1 Nov)

**The maintainer, 1 Nov 08:04 UK:** "For your open questions for me, just give your best recommendations and then
update".
- Each row below is the review's best recommendation, with no option left open.
- They take effect when the maintainer sends section 7's prompt. The agent then records them as D51 onward.
- Two of them need the maintainer's own words, so the prompt carries each as a separate line to keep or strike:
  - B8's "unlock enforcement": CLAUDE.md lets only the maintainer's explicit say-so open a protected file;
  - B3's amendment of the standing "no mortality in the solver" rule.
- Some answers depend on a measurement still to run. For those, the rule that decides is fixed here first (R1 to R6),
  so the run decides without another stop. Once the prompt is sent, this section is the maintainer's ruling naming each
  of those runs (CHECKLIST 1).

| # | decision | recommendation | why |
|---|---|---|---|
| B1 | Leave to merge (DECISIONS-PENDING row 1, widened) | Each step's pull request (0, 8, L, 9, 10, P, 11) comes from a release branch cut at the commit the gate passed on, so its head stays still. It merges to `main` once three things are recorded in it: `run-all.sh` prints ALL REQUIRED GREEN in both modes; both CI tiers are green on its head (B14); each new test has been shown failing on its plant (CHECKLIST 5). The `reviewer` and `deep-reviewer` agents come in where CLAUDE.md says: each read's claims, each change of default, each confirmatory design, and the deep review after a confirmatory read. | The switch stays off on `main`, so no user sees a change. D50's leave covered Phase 7 only, and each wait costs a day. |
| B2 | The solver's spending floor | 80% of the target where the plan sets none. Fixed at launch and stated on the Config tab. Other floors are measured before they are offered. | Every test of the candidate set it at 80% (F1). |
| B3 | The dial's positions above the default | **B3a:** lambda times the position, the age weights { mode 90, dispersion 9 }, and the candidate's tiers locked. <ul><li>It needs the standing "no mortality in the solver" rule amended for this one use: a chance of being alive weighs a cut's cost.</li><li>Survival is still counted to the plan's fixed age, and the horizon does not move.</li><li>**B3b**, the lock alone with no mortality anywhere, is measured beside it in L4. It replaces B3a by rule R1 if the weights do not earn their place, or outright if the maintainer strikes the amendment.</li><li>Position 1, the default, is the candidate unchanged either way.</li></ul> | The review's recommendation (LOCK.md section 4). At ten, B3a starts the retirees at 93.8% of target, with 5% of years 1 to 5 at the floor, against the candidate's 80.0% and 76%. The lock costs nothing measurable (F2). |
| B4 | The wording (row 2) | The agent's recommendations: the length of the dip; three years; no second rate in the headline. Also the agent's proposal for a household still working (Phase 9). Built as a table of strings, so a later change is one line. | Phase 9 is not held up by it. |
| B5 | Isolation on the live site (row 10) | A service worker on GitHub Pages, built in Phase 10. The one-worker fallback is kept. | The origin stays the same, and with it every saved plan: they "would NOT survive a move to a different domain" (deploy.yml). |
| B6 | The beta switch | A per-browser opt-in ("Try the new planner, beta"), off by default during the beta. One deploy turns it off for everyone. `SOLVER` becomes true in Phase 12, with the gate's two modes becoming the opt-in's two states. The beta starts by rule R6. | Two weeks of both paths, and a rollback, without a rebuild (F9). |
| B7 | The research (rows 5, 6, 7) | <ul><li>The launch candidate is d71f65ae871e with B2 and B3.</li><li>Whenever cores are free, at low priority, EXPLORATORY and deciding nothing: GAIN-BUCKET first, at the 20 households whose taxable account is 10% of wealth or more (about 8 core-hours, D49's smaller sizing); then the windfall factorial; then the savings factorial, at 4,000 paths.</li><li>A gain opens a registered v2 test after the launch. A harm to the launch candidate goes to the maintainer at once.</li></ul> | A late result cannot reopen the candidate mid-rollout (F15). The 20 households are where the bucket's edge can bite. |
| B8 | The unlocks ("unlock enforcement", rows 8 and the plan's own) | One unlock for exactly these edits: <ul><li>the fast tier's list: pay-where out; in, the tests the plan names (L1's floor test, L2's split identity, L3's quick form, Phase 9's split simulation, D1's couples quick form);</li><li>`.githooks/pre-commit`: the per-test skip;</li><li>`.github/workflows/`: the full tier's own workflow and the weekly backstop (B14), and `verify.yml` without its nightly schedule;</li><li>`.claude/hooks/session-start.sh`: the watchdog.</li></ul> A later edit to a protected test asks again. | Otherwise the hook stops the agent in the middle of steps 0, L, 9 and D1 (F8). The commit's cost is F10. |
| B9 | Couples (row 9) | Part D as section 6, built during the singles' beta. Its registration comes to the maintainer before its run. The couples' beta follows the singles'. | The beta's two weeks are the agent's idle time. Building couples beside Phases 10 and 11 would bring them about a week sooner, and delay the singles by about five days. |
| B10 | The phone's grid | 45 points, with the solve on request. Rule R4 decides any coarser grid. | F13. Step P now comes before the phone. |
| B11 | The age dial (D18) | Pre-solved on request, not after every edit. | Six solves after each edit cost 11.4 to 16.1 minutes of four cores, even split (facts C). |
| B12 | Unchanged | <ul><li>Row 3: not now.</li><li>Row 4: the lock alone.</li><li>Row 11: set aside. Position 10 starts the retirees at 93.8% of target (D10MLK); the default stays at 80%.</li><li>Row 12: B14.</li></ul> | |
| B13 | The bridge safety margin (D18) | Hidden for singles under the switch. It is the tournament's setting, and the tested candidate has no such lock. D18's "stays as a lock" is recorded as superseded by the bridge reader. Building it as a lock would need measuring first. | F18. |
| B14 | The full suite (row 12: the nightly) | Not nightly, since the agent works around the clock. <ul><li>The full tier runs on every push to the working branch, a release branch or `main`, in two shards. It runs one at a time per branch: a newer push waits, and replaces any older one waiting. So it runs back to back on the latest code while the agent pushes, and stops when the pushes stop.</li><li>B1 needs both tiers green on the pull request's head.</li><li>A weekly run on `main` is the backstop for quiet weeks and runner-image changes.</li><li>The watchdog warns when the branch's latest full run is red, or more than 24 hours older than its head.</li></ul> | A push's full result comes in roughly 2 to 4 hours, instead of up to a day. It tests the branch where the work is. It does not depend on GitHub's scheduler, which has not fired yet. |

**The rules that decide on a measurement**, each fixed before its run:

| # | what it decides | the rule |
|---|---|---|
| R1 | B3's variant (L4) | B3a ships at positions 3, 6 and 10 if, at every one of them, two things hold, pooled over the eight households and paired: <ul><li>its years 1 to 5 spending is above B3b's (the paired 95% interval above 0);</li><li>its survival is not below B3b's by more than 0.25 points (the interval's lower end above -0.25).</li></ul> Otherwise B3b ships at all three. |
| R2 | The dial's positions (L4) | Where the direction check reverses on any household (an exact paired test, one-sided at 5%, Holm), the higher position of that step is left off the dial for the launch, and the positions that remain are checked again. Position 1 always stays. What was left off goes to the maintainer as a report, not a stop. |
| R3 | One-off costs (L5) | If any of the 32 cells loses survival beyond noise (an exact paired test, Holm, 5%), build M12's remedy: a separate cost order on the menu, in the cost year only. Then run L5 again on it. <ul><li>If the remedy clears every cell, it ships.</li><li>If not, a plan with a one-off cost keeps the app's rules under the switch, with a line saying so, until a remedy clears.</li></ul> |
| R4 | The phone's grid (Phase 11) | 45 points. 30 points on the phone only if the maintainer's phone cannot complete a 45-point solve, or takes over 15 minutes. If so, the docs state 30 points' measured cost (F13). |
| R5 | Step P's inexact options (P2) | <ul><li>**(a) The 30-point preview** ships for the dial's live line and the search's bracket only. It requires that its engine survival is within 0.5 points of the 45-point solve's on each of the eight households. Its figures are labelled "about", and the 45-point solve replaces them when the user chooses.</li><li>**(b) The phone** shows 2,000 paths first and refines to 5,000, so nothing inexact remains.</li><li>**(c) 32-bit tables** only if R4's phone cannot complete even at 30 points, and only if the paired measurement shows no survival change beyond noise (Holm, 5%).</li></ul> |
| R6 | The beta's start (Phase 12) | The agent puts the opt-in on `main`, off by default, when the readiness checklist prints all PASS. Only opted-in users see it. The switch to on by default, and the switch's removal, stay the maintainer's. |

## 4. The order

Every task has its acceptance test and time box (CHECKLIST 8). When a box runs out, the agent stops and reports. Each
step ends with its gate (B1).

**The agent's machine.** Gate 5 was measured on four cores, and this container has two. Each budget below is read on the
agent's machine, with its own core count printed beside it.

### Step 0: CI and the hooks (new; first, after B8's unlock)

Section 5 gives the detail.
- pay-where comes out of the fast tier.
- The per-test skip in the pre-commit hook.
- The full tier's own workflow: on every push, in two shards, one run at a time per branch. A weekly run on `main` as
  the backstop (B14).
- The watchdog.

**Acceptance:**
- each change's test fails on its plant;
- CI is green on the branch;
- one full run on a push to the branch is recorded, both shards green, with a second push shown waiting and not
  cancelling it.

**Box:** half a day.

### Phase 8: the switch-on gate, then the merge

1. **`run-all.sh 4173 --solver`.** It builds with `SOLVER_PREVIEW=1` at the harnesses' light settings and runs every
   REQUIRED harness against that build.
   - A harness that tests a screen hidden under the switch is listed as switch-off only, with the harness that replaces
     it named.
   - Both modes then form B1's gate (D41).
2. **The pull request**, the gate in both modes, and the merge (B1).

**Box:** one day.

### Step L: the levers (new; between Phase 8 and Phase 9)

**The levers at launch.** Every position has been measured; nothing unmeasured is offered.

| lever | positions | default | measured in |
|---|---|---|---|
| How much you dislike cuts | 1, 3, 6, 10. Positions 3, 6 and 10 are on the candidate's tiers, with the age weights under B3a. | 1 | the dial's reads (D44, D46), the lock (LOCK.md), and L4 |
| The lowest spending in a bad year (the floor) | 80% of the target, fixed (B2) | 80% | Phase 4 and every run since |
| The estate's priority | standard (0.02) or lower (0.01) | standard | Phase 4 |
| Raises | capped at 110% of target, or blocked | capped | the step-6 defaults (K3) |
| Consent to change risk | yes or no | yes | the tier test (D39) |
| The minimum pot | the plan's own, or one year of target where the plan has none | one year | the step-6 defaults (K2) |
| The locks | the pension not before an age; the riskiest tier for the pension and the ISA; the lump sum free, never or now | all free | Phase 7c's tests |

**L1. The floor (B2).**
- **What:** where a plan's floor is 0, `prepareForSolve` sets `spending.floorSpend` to 80% of the target, rounded as
  `phase4-panel.mjs` rounds it.
  - The engine that runs the solved plan reads the same prepared plan.
  - "Your plan", under the app's rules, is untouched.
  - The Config tab says: "In a bad year the plan may spend as little as 80% of your target; it never plans below that."
- **Test** (fast tier):
  - the library's 210 singles prepare with the floor set;
  - on S126 the run record's `spendLevels` include 0.8;
  - a plan that sets its own floor keeps it;
  - the plant (the floor left at 0) gives `[1, 1.1]`, and fails.
- **Review:** the `reviewer` checks it, since it is a change of default in the app's solve.

**L2. The dial's positions (B3), and the cache.**
- **What:** `aimsOptions` maps positions 3, 6 and 10 to lambda times the position, the lock (`tsOnce: false`,
  `lockTiers`) and, under B3a, `ageWeight: { mode: 90, disp: 9 }`.
- **The base first.** The solver's worker solves, or restores, the base: the same plan at position 1 with every other aim
  the same. It then solves the position, taking the tier-above decision from the base's run record, as `lock-check.mjs`
  does.
- **Where there is no tier state there is no lock.** That covers consent withdrawn, and a ceiling that leaves one pair.
  Lambda, and the weights under B3a, still apply.
- **A split solve needs the base in every part.** `lockTiers` takes the base's solved result, its model included, and a
  model cannot be posted to a worker (PHASE-7.md). So:
  - each part takes the base's tables from the shared buffer;
  - it rebuilds the base's model from the plan;
  - it restores the base as the cache restores a solve.
  - The same holds for the position's split simulation (Phase 9).
- **The cache (F6).**
  - It stores the base and the latest position, each under its key, within a byte budget set from the measured sizes
    (two solves of S370 are 530 MB).
  - The oldest entry goes first.
  - A full quota leaves the plan solved but not stored, and a line says so.
- **Tests:**
  - the locked tables split two and three ways equal the whole solve's, with a planted part that reads no base;
  - the cache holds both entries and evicts the oldest; a planted over-budget store is refused cleanly;
  - L3 below.

**L3. The lever matrix.**
- **What:** every pair of settings across the levers and locks, including the dial's four positions in both variants, on
  two households: one retired, one with a bridge.
  - It is an all-pairs design, about 16 combinations, at light settings.
  - Each combination solves without a throw.
- **On 100 engine paths, each holds:**
  - the lock at every decision, where there is a tier state;
  - consent withdrawn: the plan's own tiers every year;
  - raises blocked: no year above target;
  - each lock: the pension age, the tier ceiling, the lump sum.
- **Each run record holds:**
  - `ageWeight` as the variant and position set it, and absent at position 1;
  - `spendLevels` including 0.8;
  - the base's key equal to the position's key with the dial at 1.
- **Plants**, each of which must fail:
  - the lock dropped;
  - the age weights dropped;
  - the base solved with another estate weight;
  - the floor at 0.
- **Where it runs:** four combinations in the fast tier; the full set in the full tier.

**L4. The four positions, both variants** (EXPLORATORY, seed 7002, 45 points, the floor at 80%).
- **What:** positions 1, 3, 6 and 10 under B3a and under B3b, on the review's eight households, 4,000 paths, one code,
  one stamp.
- **Cost:** about 13.1 core-hours (results-estimate.txt).
- **Reported, deciding nothing:**
  - survival;
  - the retirees' first year;
  - years 1 to 5, and at the floor in years 1 to 5;
  - the equity at years 1, 5, 10 and 20;
  - the estate.
- **The direction check.** On each household, survival should not rise and years 1 to 5 spending should not fall as the
  position goes up.
  - It uses paired exact tests, one-sided at 5%, Holm across the households and steps.
  - A reversal is settled by rule R2.
- **What decides:** R1 picks B3's variant and R2 settles the positions. The read goes to the maintainer as a report, with
  the `reviewer` on its claims. The dial's live-line examples come from it.

**L5. One-off costs on singles** (EXPLORATORY; M12's probe, F3).
- **What:** the review's eight households, each with a cost of 10% and of 30% of opening wealth, at retired year 3 and
  at retired year 10. That makes 32 cells.
  - The candidate at position 1 against the app's rules, with the lookahead as the app ships it (arm A as D36 set it).
  - Paired, 3,000 paths.
- **Cost:** about 5.3 core-hours (results-estimate.txt).
- **Reported:** survival and the cost year's tax, paired.
- **What decides:** rule R3. A loss beyond noise brings M12's remedy and a second run. If the remedy does not clear,
  plans with a one-off cost keep the app's rules. The read goes to the maintainer as a report.

**Step L's acceptance and box.**
- **Acceptance:** L1 to L3 pass with their plants; L4 and L5 read FAIR; the fast tier and the gate are green.
- **Box:** one day's build. L4 and L5 then run at low priority as soon as L's code is green: about 13.1 and 5.3
  core-hours (results-estimate.txt).

### Phase 9: the Strategy tab (singles)

**What is on the tab:**
1. **The headline** (B4; PART-C-WORDING.md section 1):
   - the safe starting spend, which is the first year's move;
   - the year the median path is back at target, from the engine's simulation, not the table;
   - the chance the money lasts, with the spending delivered beside it.
   - **The "never back at target" case** keeps the wording note's own sentence.
   - **For a household still working**, the wording note was written for retirees. The agent's proposal: the starting
     spend is the first retired year's level on the median path, worded "when you retire". It goes in B4's table of
     strings.
2. **The explanation:** the short note or the full text, by the length of the dip on the median path.
3. **The comparison.** "Your plan" against the solved plan, on the same paths.
   - "Your plan" is D18's baseline: the plan as entered, with the policy it carries, else the plain draw order.
   - Shown: survival; the median and unlucky-tenth pot; lifetime tax; the estate net of death tax.
4. **This year's actions**, in the playbook's words. Each comes with the survival cost of skipping it: the next-best move
   this year, then the plan, paired on the same paths.
5. **The next ten years' actions** on the median path, and "come back next year".
6. **The late raise on the fan** (wording section 4). Never shown on a path heading for ruin (the presentation rule).
7. **The rule of thumb**: a depth-3 tree with its fidelity, in `src/solverDistil.js`. Outside `src/solver`, the e3pcls
   pin does not move; put it inside and the pin is retaken.
   - It is shown only where following it costs under 0.5 points of survival, paired.
   - The printable sheet (`actionPlan.js`) carries the actions, and the tree where it is shown.
   - It may slip to after the beta without holding anything up.
8. **A failed solve** (F16): every solver view shows the plan under the app's rules, the line, and "try again".

**The simulation, split.** The solved plan's simulation is split across the solve's parts when the page is isolated.
- A split solve's tables are already in one shared buffer (`src/solverPool.js`).
- A restored solve goes into the shared buffer too. A locked position's parts carry its base (L2).
- Each part runs its own paths, and the results are merged in path order, so the statistics match the whole run bit for
  bit.
- **Test:** the same statistics split and whole, on Node's worker threads, with a planted part that drops paths.

**Budgets** (on the agent's machine, with the floor at 80%):
- The headline comes from the solve's own simulation, 2,000 paths first, then 5,000.
- The skip costs use 1,000 paired paths each, computed after the headline, filled in as they arrive, and cached with the
  solve.
- The rule of thumb comes after the skip costs.
- Split four ways, the targets are:
  - the headline within 60 seconds of the solve;
  - the skip costs within 2 minutes more.
- In one worker: the same order, filled in as each part arrives.

**The harness:** `solver-strategy-ui.cjs`, REQUIRED. It checks:
- the headline's figures equal Node's, bit for bit, at light settings;
- the wording's four cases:
  - a long dip shows the full text;
  - a short dip shows the note;
  - never back at target;
  - starting at target;
- the skip costs, on a fixture with a known costly action (the pension drawn to the basic-rate limit in a bridge year):
  - that action's skip cost is above 0;
  - the costs are not all 0;
  - a planted dominated action costs at least 0;
- the failure path, with a planted throw;
- the rule of thumb is hidden at or above 0.5 points.

**Box:** three days.

### Phase 10: the projection, dials, Simple page, scenarios, audit and history; isolation

1. **Isolation (B5).**
   - A service worker adds COOP and COEP to the app's own responses. Every asset is the app's own, so `require-corp`
     blocks nothing (`vite.config.js`).
   - The page reloads once when the worker first takes control.
   - **The harness:** `solver-isolation-ui.cjs`, REQUIRED. It serves the built site with no headers, as Pages does, and
     checks:
     - the page is isolated after the first load;
     - the split solve's tables equal the whole solve's;
     - a plan saved before the worker existed still loads;
     - with service workers unavailable, the solve runs whole.
   - A switch file lets the service worker unregister itself if it misbehaves on the live site.
   - **Other browsers:** Phase 12's Safari and Firefox solves check whether isolation holds there. Where it does not,
     that browser solves whole, the fallback.
2. **The projection runs the solved plan.**
   - Your plan's survival sits beside it ("as you are now: 71%").
   - The spending delivered sits beside every survival figure.
3. **The quick dials re-solve.**
   - The base is cached, so a position costs one more solve.
   - The live line comes on request: "Show the four settings" solves the other positions in the background, nearest
     first.
   - A position not chosen keeps only its figures (F6).
4. **The retirement-age dial (B11):** on request, one solve an age, each keeping its figures.
5. **The Simple page's safe spend and safe age.**
   - A search over solves, on request, with its progress shown and its answers kept.
   - Renamed apart from the headline (F12), for example "the highest target this plan keeps at [X]%".
   - **Budget:** about six solves, so 11 to 16 minutes split four ways. Phase 11 offers it on the phone only if step P
     cuts it.
6. **Scenarios** each carry a solve, on request, and keep their figures.
7. **The audit table** gains the action column. **History** is labelled the out-of-model check.

**The harness:** `solver-projection-ui.cjs` covers the projection, the dials, the Simple page's request and the
scenarios.

**Box:** four days.

### Step P: the further solve-performance step (new; after Phase 10, before the phone)

Profile first, then the exact cuts, then the measured options. Nothing inexact ships without the maintainer.

**P0. The profile** (half a day). It is printed by a script into `results-profile.txt`.
- **Where:** in the container's Chromium, one worker and split.
- **On:** gate 5's four households and S090, with the floor at 80%, and one thin plan where the 'auto' rule solves
  twice.
- **What it times:**
  - the reference's build;
  - the backward pass year by year: the expectation, the bridge reader, the chooser;
  - the store and the restore;
  - the simulation per path and year: the chooser, the engine's step;
  - the workers' start-up.

**P1. The exact cuts.**
- **Each one must:**
  - leave the tables, the reference and the engine's paths the same bit for bit, at 45 points on S370 and S126 with the
    floor;
  - fail on its plant;
  - pass the e3pcls pin, retaken;
  - leave the fast tier green.
- **The candidates, by expected gain:**
  - **(g) The cache keyed on the solver's code, not the worker's URL** (F19). This goes first, once
    `launch/cache-key.sh` has confirmed F19; if a screen change does not move the URL, drop it.
    - The key hashes the worker bundle's module graph as the build records it, with `App.jsx` counted by its engine
      slice. It is not a typed list, so `solverWorker.js`, `solverPool.js`, the digest and the shims all count.
    - **Its test:** a screen change keeps the key; a planted change to the engine slice, and one to `solverPool.js`, each
      move it.
  - **(a) The locked position's simulation** runs the base's chooser at every decision, so each path costs 1.80 to 1.99
    times the base's (F5).
    - The two choosers step the same moves forward from the same state, and differ only in the tables they read.
    - So the exact cut is to step each move forward once and read both tables.
    - The profile says how much of a decision's cost the step is.
  - **(b) One adaptive reference for the base and its locked position**, if the reference does not depend on lambda or
    the age weights. An identity test decides; if it does depend on them, drop this.
  - **(c) A warm worker between solves**: the solver's chunk and the engine parsed once.
  - **(d) The store compressed losslessly** (CompressionStream), measured in bytes and in store and restore time.
  - **(e) The tier lock on E5's path**, as a mask on each layer's best move. Only if the profile shows the locked solve's
    layer loop is hot: today the locked solve takes 0.91 to 0.97 times the base's.
  - **(f) E10's faster gross-up**, only if the profile shows the gross-up hot in the engine's simulation.

**P2. The measured options.** These are inexact and EXPLORATORY. Rule R5 decides each one before it runs.
- **(a) A preview grid for live lines and searches:** 30 points, with the final solve at 45. V3 puts 30 points at -0.21
  to -0.27 on the panel mean, and -0.47 at worst (F13).
- **(b) Fewer paths for the phone's projection:** 2,000 against 5,000, with the survival's standard error printed.
- **(c) Tables stored as 32-bit floats:** half the memory and the store. Measured as a V3 rung is: paired paths at 45
  points on the eight households.

**Step P's acceptance and box.**
- **Acceptance:** `results-perf-step.txt`, printed by a script, gives the time from an edit to a solved and simulated
  plan, and the memory, before and after.
  - It covers the four households, one worker and split, and the locked position beside the base.
  - Every exact cut is bit for bit, and gate 5 is re-measured on the split candidate.
- **Box:** two days.

### Step U: the new planner (new, 3 Nov; after step P, before Phase 11)

The full spec is `research/reviews/2026-11-03/LAYOUT.md`, and where it and this section differ, it holds.

**Why.** Phases 8 to 10 put the solver's pieces into tabs built for the app's rules. The answer is on the fifth tab and
its levers on the third. Each view waits on the solve on its own, and a changed plan blanks the answer for the solve's
minutes (LAYOUT.md section 1).

**What.** A new planner in four places, the answer first:
- **Your plan:** the answer, why, the outlook, and the levers beside it; this year, the next ten years, and the
  comparison with your current approach;
- **You:** the inputs, then the limits on the solver, then your current approach;
- **What if:** the age and target dials, the solved plan's limits, scenarios;
- **Details:** year by year, the history check, assumptions, how the solver decides.

**Two planners.**
- The new planner is the solver's, for single households, behind B6's opt-in.
- The classic planner is today's tabs exactly as with the switch off. It is for couples (D42), and its rules are "your
  current approach".
- The Phase 8 to 10 components move into the new places, with the changes LAYOUT.md section 3 lists and the words in
  its section 8.

**The items** (LAYOUT.md section 12), each with its test:

| # | item |
|---|---|
| U1 | the two planners and the switch between them |
| U2 | Your plan, with the outlook's two charts from the headline's own runs |
| U3 | one status strip; the phone's request per version of the plan |
| U4 | You, with the limits and your current approach |
| U5 | What if, with the new target dial |
| U6 | Details |
| U7 | the quick start (the Simple page folded in), the couples card, the failure view |
| U8 | the phone: four places, Your plan as a deck, the levers in a sheet |
| U9 | the words, the headline's two back lines among them (L12), by the maintainer's word (section 7a) |
| U10 | the harnesses |

**The harness:** `solver-planner-ui.cjs`, REQUIRED, with its plants in one run.
- `rp_planner` is `'classic'` unless set, so the classic harnesses run against the classic planner in both modes.
- The solver's harnesses opt in to the new places; load-perf gains a run of the new planner's first load, its ceiling
  by section 7a's line.

**Acceptance:**
- B1's gate, with solver-planner-ui REQUIRED;
- each new check failing on its plant;
- screenshots in the pull request;
- a report to the maintainer when it merges, not a stop. The new planner stays behind `SOLVER` until Phase 12.

**Box:** four days.

### Phase 11: the phone (recast 3 Nov: on the new planner)

Step U builds the phone's layout: the four places, Your plan as a deck, the levers in a sheet, the status line and the
request per version. Phase 11 keeps what needs the solve itself on a phone:
1. **The grid (B10):** 45 points, the solve on request ("Solve my plan", with the expected time once item 2 has
   measured it). Rule R4 decides any coarser grid, from the real phone's solve (item 2).
2. **Memory.**
   - The phone holds the solve on show, and for a locked position its base (F5), after step P's cuts.
   - Throttling cannot model a phone's memory limit, so one solve runs on the maintainer's phone (PART-C-PLAN.md: "measured
     on a phone"). The diagnostic records whether it completed, and its time.
3. **The harness:** the phone harness at four times CPU throttle, with the bytes recorded, against the new planner.

**Box:** one day.

### Phase 12: the rollout (singles; recast 3 Nov for the two planners)

1. **The rename pass.**
   - The tournament's words never reach the new planner. The classic planner keeps them.
   - Docs gains "How the solver decides", shown in Details, and the coverage card lists the solver's approximations.
   - The glossary is LAYOUT.md section 8's: "the solved plan", "your current approach", "limits" and "a rule of thumb".
2. **The harnesses.**
   - Tournament, tradeoffs and priorities run on the classic planner, in both modes (F14). They are not retired.
3. **The opt-in (B6): it switches between the two planners** (LAYOUT.md section 2.1).
   - `SOLVER` and `PLANNER_BETA` become true. `rp_planner` defaults to `'classic'`.
   - "Try the new planner (beta)" in the classic planner's header, and "Classic planner" in the new one's.
   - The preview plugin retires.
   - The gate's two modes become `rp_planner` classic and new.
4. **The diagnostic (F17).**
   - A whitelist of fields: the code version, the key's hash, the levers' positions, the grid, the times, the error
     text.
   - Never the run record whole.
   - **Its test:** a planted amount in the run record must not appear.
5. **The readiness checklist.** `research/solver/launch-ready.mjs` prints each line PASS or FAIL from results files, on
   the release commit:
   - `run-all.sh` ALL REQUIRED GREEN in both modes;
   - both CI tiers green on the release commit;
   - **the full-scale browser solve:** 45 points, the real settings, the floor at 80%, one household. Its tables must be
     Node's bit for bit, and its time is recorded. The harnesses otherwise run at light settings;
   - **the library sweep:** every one of the 210 singles normalises, prepares and solves at light settings without a
     throw, and so does a sample with every lever off its default;
   - L4 and L5 read, R1 to R3 applied, and the reads sent to the maintainer;
   - **a solve in Safari and in Firefox**, on the maintainer's devices, or on Playwright's WebKit and Firefox where they
     can be installed.
     - Its figures must sit within the Chromium solve's sampling noise.
     - Bit for bit is not required across engines, whose `Math` functions may differ in the last bit;
   - old exports import;
   - the isolation, failure-path, phone and new-planner (`solver-planner-ui.cjs`) harnesses green;
   - the opt-in switched on and off without losing a plan.
6. **The beta.**
   - The opt-in goes on `main`, off by default, when the checklist prints all PASS (R6). The two weeks start then.
   - Go or no-go: no open defect that changes a figure, and the checklist green on the final commit.
   - Then the opt-in is on by default, at the maintainer's word. That is a change of default, with the `reviewer`.
   - Then the switch is removed for singles. The tournament's code stays for couples (D42).

**Box:** two days, plus the two weeks.

## 5. Running it by itself

**The loop**, each session:
1. Read STATE.md and CI, and fix a red run first.
2. Do the current step's next task.
3. At the step's end: the gate, the pull request, the merge (B1).
4. Whenever cores are free: the research queue, at low priority (`nice`). It pauses for the gate and for any timing
   measurement.

**The only stops.** L4, L5, P2 and the beta's start are not stops: R1 to R6 decide them, and each read goes to the
maintainer as a report.
- an unlock the plan needs that the maintainer's prompt did not give;
- the couples' registration (D4) and its read;
- the beta's switch to on by default, and the switch's removal;
- any default change not settled in section 3;
- **any result showing the launch candidate harming a household beyond D34's threshold, or a defect that changes a
  figure.** It goes to the maintainer at once;
- a time box running out;
- a red CI not fixed within a session.

**Batches and the gate.**
- Timing-sensitive harnesses (load-perf, phone-perf) cannot run beside a batch.
- So each batch checks for a pause file before starting a unit, and the gate writes that file and waits for the units in
  flight to finish. A gate then waits at most one unit, and a beta fix never waits for a whole batch.
- The launcher records each pause.

**CI (step 0; B14).** The full tier follows the pushes, not the clock.
- **The fast tier** runs on every push and pull request, as today.
- **The full tier** runs on every push to the working branch, a release branch or `main`. It has its own workflow
  file, so its queue never holds up the fast tier.
  - **One run at a time per branch.** The workflow's concurrency group is the branch, with cancel-in-progress off. A
    push that arrives during a run waits, and a later push replaces it in the wait. So while the agent pushes, the full
    tier runs back to back on the latest code, and it stops when the pushes stop.
  - **A push's result** arrives within about two runs, so roughly 2 to 4 hours.
  - **Two shards**, a matrix in one run, split by a fixed split of the files balanced on the last run's times. That is
    about 2 hours a shard at `-j 2` (7.54 CPU-hours over four parallel slots). The longest file, pr31-split at
    84 minutes, fits in one.
  - `-j 4` would halve that where the runner has four cores (print `nproc` first; the log does not say), once a run has
    shown the memory holds.
  - Each shard prints a warning past 4 hours.
- **A weekly run on `main`** (Sundays) is the backstop for quiet weeks, and for changes to GitHub's runner image.
- **The pull request's head stays still.** Each step's pull request comes from a release branch cut at the commit
  the gate passed on. The agent's later pushes then cannot move the head. That head gets its own full run, and B1
  merges it when both tiers are green on it.
- **A watchdog in `session-start.sh`** prints the working branch's latest full run. It warns when that run is red, or is
  more than 24 hours older than the branch's head. A red full run is fixed first, like any red CI (the loop's step 1).

**The commit's cost (B8).**
- pay-where leaves the fast tier: 871 of its 3,988 CPU seconds in CI. It stays in the full tier.
- **Each fast test is skipped when its inputs are unchanged.**
  - A test's inputs are every file it reads, traced by running it once under a file-read hook, so the list is not typed.
    That covers file reads, not just imports: hygiene.test.mjs walks all of `src/`, and settings.test.mjs reads the
    batch scripts.
  - The pre-commit hook runs the fast tests whose inputs changed since a recorded pass. A change to a screen then runs
    hygiene's test and not pay-where's or speed-port's.
  - CI still runs the whole fast tier on every push.
  - **Its test:** a planted change to one input re-runs its test; a planted read of a file outside the traced list
    fails the trace check.

**The research queue (B7)**, in this order:
1. GAIN-BUCKET's two-household pilot, then its run, at the maintainer's size.
2. The windfall factorial (about 10 core-hours).
3. The savings factorial (about 13 core-hours at 4,000 paths).

Each run:
- runs whenever cores are free, at low priority (`nice`), pausing for the gate and for any timing measurement;
- comes back first if it costs a quarter over its estimate;
- is read with the `reviewer` on its claims;
- decides nothing.

**The robustness checks this plan adds:**

| check | where |
|---|---|
| The per-test skip, with its trace check | step 0 |
| The switch-on gate | Phase 8 |
| The floor's test | L1 |
| The split locked solve and the cache's budget | L2 |
| The lever matrix | L3 |
| The direction check on the positions | L4 |
| The one-off cost probe | L5 |
| The split simulation's identity | Phase 9 |
| The failure path | Phase 9 |
| The isolation harness against a server with no headers | Phase 10 |
| The profile | P0 |
| The new planner's harness, its plants in one run; the classic planner fetching no solver code | step U |
| One solve on a real phone | Phase 11 |
| The diagnostic's whitelist | Phase 12 |
| The full-scale browser solve | Phase 12 |
| The library sweep | Phase 12 |
| Safari and Firefox | Phase 12 |
| The readiness checklist | Phase 12 |

## 6. Couples (Part D)

**What exists** is `couple.js`, the archive's pilot:
- two single tables, each with its own wrappers and half the spending;
- a yearly rollout over the funding split;
- tiers off.

It was measured once, under the old objective, on 19 couples.

**Two facts shape the steps:**
- Couples are half the library.
- Every library couple carries a one-off cost, and the solver's decisions around one are tested first on singles (L5).

**D1. M4's three gaps** (one day).
- **The cut term** goes into the rollout's one-step value, so the dial reaches couples.
- **The household's spending level** is valued by both tables. Today it comes from the first person's move.
- **The candidate's quadrature** (`quadNodes`) replaces the five fixed nodes.
- **Tests:**
  - each gap gets a check that fails on the old code;
  - `solver-couple.test.mjs`'s quick form goes into the fast tier (B8);
  - the singles' tables stay the same bit for bit.

**D2. The candidate's features on two tables** (three days).
- **The features:**
  - the tier state per person, three steps below;
  - HR;
  - the table without the dealing cost (E5);
  - the failure year at what it can pay;
  - the floor (B2) on the household's spending.
- **The bridge reader with the household's money.** The archive's O11: one partner's bridge can be funded from the
  other's money, and "60 of the library's 210 couples have a bridge for at least one partner".
- **The two tables solved side by side.**
- **Tests:**
  - the engine and the couple's forward model in step (the state check's lockstep, for couples);
  - O11's case, planted;
  - the singles' tables and the e3pcls pin unchanged.

**D3. The levers for couples** (one day).
- the dial, through D1's cut term;
- B3's variant, with the age weights, if chosen, on the chance that at least one partner is alive;
- the candidate's tiers locked per person;
- consent;
- the locks per person;
- the lever matrix (L3) for couples.

**D4. The registered held-out test**, built as Phase 4's was.
- **The arms** (PART-C-PLAN.md: "against the app's rules and against the product's settings"):
  - CANDC, the candidate for couples;
  - APP, the app's withdrawal-policy search on the couple's own plan, without the tournament, so every arm runs on the
    same accounts and contributions (D36);
  - SHIPC, the couples' solver at the product's settings.
- **The panel:** 40 couples, none used before, chosen by the held-out scan: 20 of the library's couples and 20 of a
  younger cohort.
  - Each is landed so the app's rules survive about 85%.
  - The floor is at 80%.
  - The one-off costs are kept, and the cost years are reported apart.
  - The seed comes from the held-out scan.
- **The decision rule:** Phase 4's, on both estate weights, each item against its registered margin:
  - A1, survival, CANDC less APP;
  - A2, spending delivered;
  - S1, survival, CANDC less SHIPC.
  - D34's harm flags sit beside them, for investigation; on their own they do not block.
- **The cost is not yet known.**
  - Phase 4's singles took 111.4 core-hours, about 28 hours on four cores, and 88.1 of those hours were the engine's
    paths (facts C).
  - A couple runs two tables and a rollout every year. So a two-couple pilot sizes the run (D21) before any date is
    promised.
  - The calendar assumes 2 to 4 days on four cores, or 4 to 8 on two. The gate pauses it at unit boundaries (section 5).
- **Before launch:**
  - the `reviewer` reviews the design;
  - the registration is committed and goes to the maintainer.
- **The run and its read:** launched through the launcher and read once. The `deep-reviewer` follows the read.

**D5. The couples' screens in the new planner** (two days; recast 3 Nov for step U).
- "What matters to you" and the limits per person;
- this year's actions per person, on Your plan;
- the wording for a household;
- the couples card (LAYOUT.md section 6) retired;
- `solver-planner-ui.cjs` with a couple.

**D6. The couples' beta.**
- The same opt-in, for two weeks.
- Then the tournament, the policy search and their harnesses retire, with the maintainer's word.

**Timing (B9).**
- D1 to D3 start when the singles' beta starts.
- They change solver files the singles' candidate runs, so:
  - the singles' tables must stay the same bit for bit, with an identity test on every commit;
  - the e3pcls pin is retaken;
  - nothing merges to `main` mid-beta that moves a single's number.
- D4 follows D3. D5 follows D4's read, and D6 follows D5.

## 7. The prompt for the agent

The maintainer sends it. The two lines under "The maintainer's answers" are the maintainer's own words: either can be
struck. Striking the second ships B3b.

```
Read research/reviews/2026-11-01/LAUNCH-PLAN.md on review/external-2026-10-21.

The maintainer's answers: section 3's recommendations B1 to B14, and its rules R1 to R6 (the maintainer's ruling
naming L4, L5, P2 and the beta's start).
- Unlock enforcement for exactly B8's edits.
- B3a: the "no mortality in the solver" rule is amended for this one use (the age weights on a cut's cost; survival
  still counted to the plan's fixed age).

1. Record these as D51 onward in STATE.md; close their rows in DECISIONS-PENDING.md.
2. Step 0: pay-where out of the fast tier; the per-test skip in the pre-commit hook, with its trace check; the full
   tier on every push in its own workflow, two shards, one run at a time per branch (a newer push waits), with a
   weekly run on main and the nightly schedule removed (B14); the session-start watchdog.
3. Phase 8: build run-all.sh --solver, then the pull request; merge on B1's gate.
4. Step L: L1 the floor at 80%; L2 the dial's positions and the two-entry cache; L3 the lever matrix; L4 (both of B3's
   variants) and L5 (one-off costs) as soon as L's code is green, at low priority, EXPLORATORY, seed 7002. R1 to R3
   decide on their reads; send me the reads as reports.
5. Then Phase 9, Phase 10, step P, Phase 11 and Phase 12, each by its acceptance tests and time box. Each pull
   request comes from a release branch cut at the gate's commit, and merges on B1's gate. Run launch/cache-key.sh on a
   clean checkout before P1 (g). R4 to R6 decide on their measurements.
6. Part D when the singles' beta starts. D4's registration comes to me before its run.
7. The research queue whenever cores are free, at low priority, in its order (B7), pausing for the gate and for timing
   runs. It decides nothing.

Stop only at section 5's stops.
```

### 7a. The prompt of 3 Nov: step U

The maintainer sends it, now or once Phase 10 has merged, and before step P ends: after P the agent would start Phase
11 as first planned. The lines under "The maintainer's answers" are the maintainer's own words:
- **The first** adopts the headline's two back lines (L12). Struck, B4's two lines stay as they are; the rest of
  LAYOUT.md section 8 applies either way.
- **The second** sets load-perf's ceilings for step U (LAYOUT.md section 11.2). Struck, every run is held at 228KB.
  The new planner's first load fetches Your plan's chunk, so it will likely be over that, and step U would stop at its
  gate.
- **The third** lets the agent move the pin in CLAUDE.md, a protected file. The pre-tool hook honours it only while it
  is the maintainer's latest message, so a message sent before step 2 means the agent asks again.

Step 1 holds every other push until Phase 10 merges. Full runs one at a time per branch, and a later push replaces the
run waiting on the gate's commit (`.github/workflows/full.yml`), which would put the merge back by hours.

```
Read research/reviews/2026-11-03/LAYOUT.md, and in research/reviews/2026-11-01/LAUNCH-PLAN.md step U, the recast
Phases 11 and 12 and Part D's D5, on review/external-2026-10-21 at its head.

The maintainer's answers:
- The headline's two back lines change to LAYOUT.md section 8's words (L12).
- load-perf on step U's build: a classic run over 228KB moves its ceiling to the measured figure plus one, up to
  232KB; the new planner's first load gets its own ceiling the same way, its measured figure plus one.
- Unlock enforcement for exactly the launch plan's pin in CLAUDE.md.

1. Finish Phase 10 on B1's gate as planned. Until it merges, push nothing to the branch but Phase 10's own fixes: a
   later push replaces the Full run waiting on the gate's commit (full.yml).
2. Then record as D58: the maintainer's answers above; step U, the new planner as LAYOUT.md specifies it, after step P
   and before Phase 11, with B4's two back lines and load-perf's ceilings changed only where an answer above says so;
   Phases 11 and 12 and Part D's D5 as recast. Move the launch plan's pin in STATE.md and CLAUDE.md to the review
   branch's head you read.
3. Then step P, as planned.
4. Then step U by LAYOUT.md section 12, U1 to U10, each with its test; solver-planner-ui.cjs REQUIRED, its plants in
   one run. Merge on B1's gate. When it merges, send me the preview link and the screenshots: a report, not a stop.
5. Then Phase 11 and Phase 12 as recast, each on B1's gate.
6. Where LAYOUT.md and the code disagree on a fact, the code holds: say so in the pull request and carry on. A change
   LAYOUT.md does not specify that would move a figure or a default is a stop.

Stop only at section 5's stops.
```

## Appendix: the independent review's points, and where each went

The review read a draft of this plan against the code at 276ae09 and the project's documents. Each point was checked
against its source before it was taken. All thirteen held, and all are in the plan.

| # | the point | where it went |
|---|---|---|
| 1 | The plan's test, CI and hook changes touch protected files, and the unlock named only two of them. | F8, B8 |
| 2 | Phase 11 depended on step P, which came after it. | Step P moved before Phase 11 |
| 3 | Four-core budgets on a two-core container, and D4's compute against the timing-sensitive gate. | Section 4's note on the agent's machine; D4's 2 to 4 or 4 to 8 days; section 5's pause rule |
| 4 | D4 reversed D36 (the tournament in arm A), dropped PART-C-PLAN.md's product-settings arm, and had no primary rule. | D4: APP as D36, SHIPC, Phase 4's A1, A2 and S1 |
| 5 | One-off costs had never been tested on a single household (M12). | F3, L5 |
| 6 | The switch-on gate was already required from Phase 8 (D41). | F7, Phase 8 |
| 7 | The cache holds one solve. | F6, L2 |
| 8 | Tests that could pass with their fault present: L3, the fingerprint skip, P1 (g)'s typed list, Phase 9's skip cost. | L3's record checks; section 5's traced inputs; P1 (g)'s module graph; Phase 9's harness |
| 9 | F19 had no evidence, and its plant was a comment the minifier strips. | F19 marked NOT MEASURED; the plant is now a button's text |
| 10 | B1 narrowed the reviewers' events below CLAUDE.md's. | B1 follows CLAUDE.md |
| 11 | D18's bridge safety margin was dropped silently. | F18, B13 |
| 12 | Smaller errors: the candidate's line, `distil.js` and the pin, B12's wording, an unprinted couples figure, GAIN-BUCKET's size. | Section 0 and 1; F21; B12; facts G; B7 |
| 13 | Other gaps: the age weights against the mortality constraint, a real phone, "your plan", the printable sheet, the coverage card, the never-back case, the preview plugin under `SOLVER` true, step 0's box, the diagnostic's privacy, a stop for harm. | B3's two variants; Phase 11; Phase 9; Phase 12; step 0; F17; section 5 |
