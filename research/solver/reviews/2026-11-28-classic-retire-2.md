# Second look at the classic planner's retirement (D155): the fix round

Subject: the fix round on my first look's FAIL (`reviews/2026-11-28-classic-retire.md`: one BLOCKING, five MINOR), commit
1ce99382 on claude/fervent-goodall-e2mrnf against b612be65. Its account is `CLASSIC-RETIRE.md`'s "The fix round (28 Nov)"
(l.107-157), its records `results-d155-fixround.txt` and `results-first-load-d155.txt`, and it is restated in STATE.md's
section 5 Running line and DECISIONS-PENDING.md's two D155 entries. A change of default (CLAUDE.md), read while B1's gate ran
on this code in the main tree.

## What I read

- **The account and the records (at 1ce99382):** `CLASSIC-RETIRE.md` 7a7c272ff9c2; `results-d155-fixround.txt` 6edd5e09c441;
  `results-first-load-d155.txt` 2830f25a9ed0; STATE.md 55bcbe27c4b9 (section 5); DECISIONS-PENDING.md 994c46c02e36; my first
  look 480c169393a8; the commit message.
- **The code changed:** `src/PlannerMore.jsx` d282680e5a8a (TierStrip l.199-224, HistoryStrip l.409-470), `src/Docs.jsx`
  1affcd4254d3, `vite.config.js` 87530d47bb2e.
- **The code those changes rest on:**
  - `src/App.jsx` 04c235656903: runMonteCarloAsync l.7544-7566; the history view l.8558-8600, its expand button l.8352 and
    overlay l.9669-9678; assumptionCards l.8695-8830.
  - `src/PlannerPlan.jsx` c38faafd7163 (the answer card's states, the phone's deck l.467-510); `src/PlannerCards.jsx`
    dd9247bf6e9a (Details l.163-203); `src/viewport.js` 9c95b0473697.
  - `index.html` 3f9147d718ed and `tailwind.config.js` 3619478498e8 (the themes' tokens).
- **The checks:**
  - In `research/ui-harnesses`: `lib/probes.cjs` dd623213d404 (against b612be65's 4f0dfc67f92a), `phone-ui.cjs` 6d72d5472d14,
    `desktop-reach-ui.cjs` 56532a5bdcae, `restyle-regression-ui.cjs` 0e8fe51f6b24, `solver-strategy-ui.cjs` 399e3dc4b4a3,
    `solver-planner-ui.cjs` d4c390e19b2f, `run-all.sh` 1d1a4322af27.
  - In `research/tests`: `strip-contrast.test.mjs` 82ef1dc57db3, `fast-inputs.json` 9f8ddd4b973e.
  - `research/solver/d155-fixround/`: `strip-contrast.cjs` 9acdd7aed890, `words17.cjs` 8134d25b83e8, `you-heights.cjs`
    7f2f7883e196.
- **The classic checks they port, at 9d04859a:**
  - `phone-ui.cjs` 25d2f5e5f1ce, whole; `phone-perf-ui.cjs` d401d94f4e70, sections 1 to 3; `desktop-reach-ui.cjs` 57cb42181d6e;
    `restyle-regression-ui.cjs` 49129a7c8fc8; `run-all.sh` 6983b19cb8f3.
  - `src/App.jsx` there: the classic Config tab, l.14318-14520; the strip's condition, l.8843 and l.12609.

## What I ran

On `git archive` copies of 1ce99382 and b612be65 in my scratchpad, node_modules linked from the main tree. Nothing in the
main tree was touched. `load-perf-ui.cjs` and `phone-perf-ui.cjs` were not run.

- **Builds.**
  - Each tree's light build (run-all.sh's `LIGHT`, `SOLVER_HARNESS=1`): 1ce99382's on :4361, b612be65's on :4362.
  - 1ce99382's shipped build on :4363.
  - 1ce99382's code stamp (`launch-stamp.mjs`) is 35c9453c26dcce51, the stamp the records name.
- **The gate's harnesses on :4361, as committed:**
  - restyle-regression: all ok, Your plan measured on 'filling' in all six looks.
  - desktop-reach: all ok. Under `REACH_PLANT=noequivalent`: 1 FAILED, exactly Details' 24px check (`BUTTON "" 19x24`).
  - phone-ui under `PHONE_PLANT=noequivalent`: 4 FAILED, exactly the History check's 44px check on each phone and theme (48
    cells, 24x44 on the iPhone 13 and 27x44 on the Pixel 7).
  - phone-ui with its Pixel-7-light block run on every phone and theme: a scratch copy, l.179's condition alone changed. All ok.
- **The fix round's own tests and probes:**
  - `strip-contrast.test.mjs`: ALL PASS, the weakest share sepia 60% at 4.82:1. Under `STRIP_PLANT=nochip` check 2 fails, 55
    shares under.
  - `words17.cjs`: 5 found on :4362, 0 on :4361.
  - `strip-contrast.cjs` on :4361: the record's section 5, to the digit.
- **My probes** (`review-d155-2/probes/` in the scratchpad; each names what it does in its first lines):
  - `probe-diff.cjs`: b612be65's contrast probe against 1ce99382's, on every place, every You and Details section at 390 and
    the full documentation, in three themes at 1400 and at 390 with touch. Lists every text over a positioned layer.
  - `synth/layers.html` with `synth-run.cjs`: planted layers.
  - `worker-check.cjs`: solver-strategy section 4's two new checks against a planted failing projection worker.
  - `details-own.cjs` and `details-parts.cjs`: Details' sections' heights on both phones.
  - `phone-extra.cjs` and `slide4.cjs`: the history chart's full screen, and every slide of Your plan on both phones in three
    themes.
  - `first-load.cjs`: the first load's script bytes, counted as load-perf counts them.
  - `strip-clip.cjs`: the strip's labels against their blocks.
- **B1's gate**, the agent's run in the main tree on code-stamp:35c9453c26dcce51. When I wrote this, it had printed no
  failure through its shipped pass and its light pass up to solver-isolation, solver-strategy among them. It was on
  solver-projection, and solver-planner had not started.

Verdict: FAIL

## What holds

- **(a), the equivalent exception.** It is WCAG's own, in 2.5.5 and in 2.5.8.
  - A cell picks the start year that the Start year box and the slider pick: the same setter over the same range (App.jsx
    l.8577 and l.8590).
  - It is declared per cell (PlannerMore.jsx l.428 and l.456). It is honoured only while a control the selector matches is
    displayed and at the bar in both dimensions (probes.cjs l.142-152; desktop-reach l.69-78). So nothing in the strip but the
    cells is exempt, and a target that does not declare the exception cannot use it.
  - Each plant fails exactly its target check (reproduced, above).
- **(b), (c) and (f)** are the classic checks as they were (parent desktop-reach l.105-116, l.223-240, l.625-674 and
  l.686-730; parent phone-ui l.190-201), driven through the planner's real controls.
  - (c) on the classic planner's own household is sound. It is the fixture those checks were built and run on (parent l.25-32,
    the default seed of every `open`, l.55).
  - That household puts the cost past the liquid wrappers, so the lookahead has something to set aside. On the main fixture's
    household the column would stay empty (desktop-reach l.46-49).
- **(d)'s conversion is fair to the classic rule.**
  - The classic page drew 56px above a section and 84px below it: in the record's section 3, every classic page taller than the
    screen is its section plus 140px. So a 1,800px page is a 1,660px section, and the planner's own heading is left out.
  - The narrower check is said where (d)'s coverage is claimed (CLASSIC-RETIRE.md l.125-131, STATE.md, DECISIONS-PENDING.md) and
    is put to the maintainer: Your current approach's controls and Limits' drop-downs are reported, not gated.
  - `[data-current-approach]` is one section (App.jsx l.8523), so the subtraction does not count anything twice.
- **MINOR 2.** The five lines now name where the controls are: the haircut (App.jsx l.8697-8703), the pass-through and the CGT
  figures (l.8772-8805), all in assumptionCards, which Details' Assumptions renders (PlannerCards.jsx l.192).
  - The widened list finds the five on b612be65's build and none here.
  - It raises no false alarm today. The only `\bConfig\b` strings left in src are in code no page renders:
    `policyPlaybook` (App.jsx l.6869 and l.6965), and `fromFullPlan` (simplePlan.js l.245), which nothing in src now imports.
- **MINOR 3 and MINOR 6** are answered as said.
- **MINOR 5.** On 1ce99382's shipped build my own count is 175KB for a fresh visitor (179,185 bytes over three scripts) and
  172KB for a saved plan (175,648 bytes over two). 9d04859a's own load-perf gives 241KB and 238KB, which is what my first look
  measured there.
- **MINOR 4, the markers.** Each is an element the place's card draws: the answer card's states (PlannerPlan.jsx),
  `[data-whatif-scenarios]`, `[data-audit-ledger]`, and You's own form rows and section. Restyle-regression's "measured on its
  answer" check fails unless the card is 'filling' or 'done' (l.111-114).
- **MINOR 4, the probe change, on the strip: right.**
  - It composites the shade under a positioned label: indigo-700 at 0.745 over the white card, with a quarter of slate-900 on
    top, is rgb(104, 95, 159) and 5.63:1. That is the record's figure, and I get it by hand. The old walk read 1:1.
  - probe-diff.cjs covers every page, section and the full documentation in three themes, at 1400 and at 390. The change reads
    only the strip's four labels at 1400 differently, each over its own shade, which is painted under it. Nothing else is
    flagged or unflagged.
- **The strip's fix holds in each theme.**
  - `strip-contrast.test.mjs` reads the palette from index.html and pins the formula to the source (check 1). Its arithmetic is
    the browser's (`strip-contrast.cjs`, section 5).
  - Without the backing, 55 shares fall under the bar (my recomputation: light 60 to 78%, dark 46 to 63%, sepia 60 to 77%).
    With it, none: the weakest is sepia 60% at 4.82:1.
  - It tests the class for the strip: every share, every theme, the palette as shipped.
  - No label of this household runs past its block on either phone (strip-clip.cjs: 32px labels in blocks of 57px and up).
- **vite.config.js's comments** are true of the code: mcWorker.js l.12 imports from App.jsx; App.jsx l.37 imports
  EditMode.jsx, which imports `virtual:editable-copy`.

## Findings

1. **BLOCKING. (e)'s new checks cannot fail on the fault they say they catch: a projection worker that starts and then fails.**
   - **What the harness checks.** solver-strategy-ui.cjs records each worker the page constructs, by name, before constructing
     it (l.79-81). Its check "its chance worked out in the projection's worker" passes when a chance is shown and an mcWorker
     was started (l.225-229). Its comment says "a silent fall back to the main thread would leave the figure standing and this
     at nought".
   - **What the page does.** runMonteCarloAsync starts the worker. When the worker errors, the page logs "the projection worker
     failed, finishing on the main thread" and computes there; an answer without stats falls through to the same path without
     a word (src/App.jsx l.7545-7556). Either way the worker's name is already recorded.
   - **Planted** (worker-check.cjs, my light build of 1ce99382; S126, as section 4 uses it; the solver planted to fail as the
     harness plants it):

     | page | chance | workers started | the worker's own stats answers |
     |---|---|---|---|
     | as the harness opens it | 95% | solverWorker, mcWorker | 1 |
     | with `?forceMain=1` | 95% | solverWorker | - |
     | the mcWorker started, then failing | 95% | solverWorker, mcWorker | none (the page's warning logged) |

     Both of the harness's checks pass on the planted page.
   - **What rests on it.** CLASSIC-RETIRE.md l.132-133 ("it ran") and STATE.md ("the projection's worker against the main
     thread on the failure view") rest on these two checks.
   - **The classic gate.** The parent's sections 2 and 3 counted workers started too (phone-perf l.77, l.153). What failed
     there on a silent fallback was section 1, the main thread free during the run (l.85-89, l.152), and the port does not
     carry it.
   - **The agreement is coarser.** It is now one whole percentage, the card's `pct()` (PlannerPlan.jsx l.28 and l.167). Section
     3 compared four figures as shown: survival, the pot at retirement, the safe maximum, and what the plan survives (l.162-166).
   - **To answer:**
     - count the worker's own answers in the wrapper: a 'message' listener on the mcWorker it constructs reads 1 on the page as
       opened and nothing on the planted one. Failing on the page's warning alone would miss an answer without stats;
     - compare a figure finer than a whole percent.

2. **BLOCKING. (a) as ported drops the fourth thing the classic loop measured on the tabs whose content Details keeps: each
   tab's length on a phone. Nothing records that it was dropped.**
   - **The classic check.** The parent's per-tab loop ran on both phones in both themes (phone-ui l.138-139, l.161-204). Besides
     overflow, contrast and 44px, it held each tab to a screen cap (`SCREEN_CAP`, l.66-69; the check, l.179-182):

     | classic tab | cap |
     |---|---|
     | Config & Assumptions | 2.0 screens |
     | Historical Backtest | 2.6 screens |
     | Audit Data Table | 1.8 screens |
     | Documentation | 2.2 screens |

     My first look's (a) named the other three checks; this is the fourth, in the same lines it cited.
   - **The port.** No ported check measures a Details section's length: phone-ui's `measure` (l.87-95) is overflow, contrast
     and 44px. Neither CLASSIC-RETIRE.md nor STATE.md nor DECISIONS-PENDING.md says the caps are dropped.
   - **Measured** the way the fix round converts You's rule: each section's own height against the cap less the classic page's
     140px (details-own.cjs).

     | Details section | iPhone 13 (664px tall): own / allowed | Pixel 7 (839px tall): own / allowed |
     |---|---|---|
     | Year by year | 645 / 1,055 | 750 / 1,370 |
     | History check | **1,716 / 1,586, over** | 1,751 / 2,041 |
     | Assumptions | **1,555 / 1,188, over** | 1,535 / 1,538 |
     | the full documentation (contents to last card) | 1,104 / 1,321 | 1,100 / 1,706 |

     On the Pixel 7 all four are within.
   - **By parts** (details-parts.cjs, iPhone 13):
     - History check: the header 58px, the strip "Every start year in history" 553, the picker 450, the verdict 180, the wealth
       path 379. The strip is the planner's: at 9d04859a it rendered only under `solverOn`, which the classic planner never had
       (App.jsx there, l.8843 and l.12609).
     - Assumptions: Tax rules 386, the three reference cards 133, 133 and 309, Display 340, the solver's settings 174. Tax rules
       is the classic Config's, but sat inside its policy panel, which folded on a phone (App.jsx at 9d04859a, l.14344 and
       l.14515). Display is the number format card the classic Config carried (l.14329 there) plus the theme.
   - **So** two sections are over the classic caps on the narrower phone, through what the planner adds or unfolds. That is the
     same kind of thing the fix round measured for You's Advanced and put to the maintainer. Here the gate says nothing.
     - The claim "the classic mode's checks of kept features, ported. Each is now made on the planner" (CLASSIC-RETIRE.md
       l.112) does not hold for this check.
     - The maintainer's entry names two things over the classic rules where there are more.
   - **To answer:** port the caps to Details' sections as (d) was ported, or put their retirement to the maintainer and say so
     where the coverage is claimed.

3. **MINOR. (d)'s form checks run on the Pixel 7 in the light theme alone; the classic ran them on both phones in both
   themes.**
   - The parent's second phone pass (phone-ui l.647-1036) sits inside the device and theme loops (l.138-139). The port's sits
     under `if (devName === 'Pixel 7' && theme === 'light')` (phone-ui l.179).
   - Run on all four (my scratch copy, with that condition alone changed), every check passes.
   - On the iPhone 13 Advanced's report reads "Your current approach's controls add 1224px, the section 1974px, the page 2380px".
     DECISIONS-PENDING.md's entry gives only the Pixel 7's 1,112px and 2,252px.

4. **MINOR. At a phone's width Your plan is measured on its first slide alone. The strip and the outlook, which
   restyle-regression's header says it measures, are not.**
   - On a phone the deck mounts one slide (PlannerPlan.jsx l.503-504). At 390, restyle-regression measures what is mounted after
     the solve (l.103-115), which is slide 1.
   - The record's own section 4 shows the gap. On the code before the strip's fix, the 70% label fails at 1400, while Your plan
     passes at 390 in the same themes.
   - slide4.cjs on b612be65's build: the iPhone 13's slide 4 carries the strip's four labels and fails the new probe once in
     light and once in sepia. On 1ce99382 it fails none.
   - On this code every slide passes contrast, overflow and 44px, on both phones in three themes (phone-extra.cjs), so nothing is
     hidden today. But the header's "the solved plan's figures, strip and outlook on the card ... (on a phone the solve is asked
     for)" (l.21-23) claims more than the 390 run measures.
   - phone-ui's Your plan is the 'ask' card: its marker takes any state but 'loading' (l.58), and a phone solves only when
     asked. That card is a phone's first view.
   - Neither of these was a classic check.

5. **MINOR. The probe's new layer rule composites a layer that is not painted under the text.**
   - bgOf (probes.cjs l.36-47) takes every earlier sibling that is absolutely or fixed positioned and covers the text's centre,
     at its opacity. It does not ask whether the layer is painted beneath the text:
     - a positioned layer with z-index auto paints over a static text that follows it;
     - a layer with a higher z-index paints over a positioned text;
     - a layer with visibility hidden is not painted at all.
   - Planted (synth/layers.html):
     - a pale label under a 70% black overlay, once static and once positioned with the overlay at z-index 10. In both,
       elementFromPoint puts the overlay on top at the label's centre;
     - a pale label over a hidden black layer.
   - The old probe flags all three at 1.37:1. The new one passes all three.
   - None of these is on the planner's pages today (What holds, above), so the hole is latent.
   - To tighten: skip a sibling whose visibility is hidden, and composite a sibling only where the text's element at that level
     is positioned and the sibling's z-index is not above it.
   - Ancestor opacity is read by neither probe, before or after, so that gap is not new.

6. **MINOR. The full-screen chart on a phone, which the planner keeps, has lost its check.**
   - The classic phone-ui expanded the projection's Monte Carlo chart, held the dialog to the viewport's width and height, and
     held Escape to closing it (l.291-310). It also held a phone's charts to 92% of the screen's width (l.237-241).
   - The planner keeps the same overlay for the history chart on a phone (App.jsx l.8352 and l.9669-9678). No harness presses
     `[data-chart-expand]` now.
   - It works today (phone-extra.cjs):
     - the chart is 388px of 390 and 410px of 412;
     - full screen is 390x664 and 412x839;
     - Escape closes it.
