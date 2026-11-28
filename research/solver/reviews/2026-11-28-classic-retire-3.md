# Third look at the classic planner's retirement (D155): the second fix round

Subject: the second fix round on my second look's FAIL (`reviews/2026-11-28-classic-retire-2.md`: two BLOCKING, four MINOR),
which the maintainer ruled on as D156. It is commit 0649c387 on claude/fervent-goodall-e2mrnf against 0605d85a (the code of my
second look was 1ce99382). Its account is `CLASSIC-RETIRE.md`'s "The second fix round (28 Nov)" (l.161-225), its record
`results-d155-fixround-2.txt`, restated in STATE.md (D156 and section 5's Running line) and DECISIONS-PENDING.md's two D155
entries. A change of default (CLAUDE.md), read while B1's gate ran on this code in the main tree.

## What I read

- **The account and the records (at 0649c387):** `CLASSIC-RETIRE.md` 26042aed7844; `results-d155-fixround-2.txt`
  df6b8286ee7e; STATE.md a738de72b1ca (D156, section 5); DECISIONS-PENDING.md 981a94cb4ba9; my second look 7f61dd1df6ed; the
  commit message.
- **The code changed:** `src/PlannerPlan.jsx` 2cc870e781f3 (`data-failed-figures`, l.164-167) and `src/PlannerCards.jsx`
  74c30796f497 (Details, l.163-205: `data-tax-rules`, `data-display-theme`).
- **The code those rest on** (`src/App.jsx` 04c235656903, unchanged since 1ce99382):
  - the projection worker and `runMonteCarloAsync` (App.jsx l.7487-7566), the failure view's one run (l.8254-8269),
    `src/mcWorker.js` 24bf94b644a9;
  - the solved ledger's request (App.jsx l.7896-7919), `auditCard` (l.8624-8640), the places (l.9600-9645);
    `src/solverClient.js` 587a8bda30d0 (`ask`, l.114-130) and `src/solverWorker.js` a60761ccc464 (l.94, l.225-243);
    `src/PlannerPlan.jsx`'s questions (l.55-86) and its deck (l.463-510);
  - `src/PlannerMore.jsx` d282680e5a8a (TierStrip l.196-224, the invest card l.258-290, HistoryStrip l.413-494);
    `src/Docs.jsx` 1affcd4254d3 (l.38-56).
- **The checks:** in `research/ui-harnesses`, `solver-strategy-ui.cjs` 6a75819b885b, `phone-ui.cjs` 94bf64388a08,
  `restyle-regression-ui.cjs` aeb7cfe2b6fe, `lib/probes.cjs` e4ff6d145d79 (against 1ce99382's dd623213d404),
  `solver-projection-ui.cjs` 6f4c6d4872d5, `desktop-reach-ui.cjs` 56532a5bdcae (unchanged since 1ce99382),
  `run-all.sh` 1d1a4322af27;
  `research/solver/d155-fixround-2/strip-desktop.cjs` bae6655c47bf.
- **The classic checks they port, at 9d04859a:** `phone-ui.cjs` 25d2f5e5f1ce (SCREEN_CAP l.66-69, the device and theme
  loops l.138-139, the per-tab loop l.161-204, the charts l.225-310, the form's sections l.925-932);
  `restyle-regression-ui.cjs` 49129a7c8fc8; `src/App.jsx` b402b36756da (the phone page's padding, l.13495-13505).
- **The gate's log on 1ce99382** (the agent's task output): one harness failed, solver-projection.

## What I ran

On `git archive` copies of 0649c387, 1ce99382, b612be65 and 9d04859a in my scratchpad (`review-d155-3/`), node_modules
linked from the main tree. Nothing in the main tree was touched but this file. `load-perf-ui.cjs` and `phone-perf-ui.cjs`
were not run. I ran one browser at a time, and no solve while the gate's phone-perf or solver-projection ran.

- **Builds** (run-all.sh's `LIGHT`, `SOLVER_HARNESS=1`): 0649c387's light build on :4341, 9d04859a's on :4342.
- **phone-ui.cjs as committed, on :4341:** all ok. Every length and chart figure of the record's section 2 comes out to the
  pixel, on both phones in both themes.
- **phone-ui.cjs under `PHONE_PLANT=nolengthsub` alone:** 4 FAILED. Exactly the history check's and Assumptions' caps fail,
  on the iPhone 13 in both themes (1716 of 1586px and 1555 of 1188px).
- **solver-strategy-ui.cjs with `STRATEGY_CASES=none`** (sections 4 and 5; port 4350, its preview on 4358):
  - as built: all ok. The worker's own answers 1, the chance 94.69999999999999 on both pages, 40 years 0 apart.
  - `STRATEGY_PLANT=mcfail`: 1 FAILED, exactly the first check (answers 0, the chance still shown).
  - `STRATEGY_PLANT=mcseed`: 1 FAILED, exactly the second (95% on both pages; 94.96 against 94.69999999999999; 40 years
    apart).
  - My own plant: a scratch copy of the harness that patches the built `mcWorker` chunk to answer `{ key }` without stats,
    so the page finishes on the main thread without a word. 1 FAILED, exactly the first check (answers 0).
- **My probes** (`review-d155-3/probes/`; each names what it does in its first lines):
  - `classic-chrome.cjs` and `classic-inputs.cjs` on :4342: the classic tabs on both phones; the page, the tab's content and
    the chrome around it; the Config tab's cards; what sits above a Plan Inputs section.
  - `synth/layers2.html` with `synth-run.cjs`: layers painted beneath text in five ways the planted page lacks. Each probe's
    read is printed beside `elementFromPoint`.
  - `layer-diff.cjs` on :4341, in the light theme: 1ce99382's contrast probe against 0649c387's. It covers every place at
    1400, every section of You and Details at 390, the full documentation at both widths, and Your plan at 390 slide by
    slide. It lists every text with a positioned layer over it.
  - `reach-plan-run.cjs` on :4341: desktop-reach's Your plan at 1366x768, when its 24px check runs and once the typical
    run's cards are drawn.
- **B1's gate**, the agent's run in the main tree on code-stamp:0b2f7bb4ae0bae14. When I wrote this it had printed no failure
  through every harness up to and including solver-projection; solver-planner was running.

Verdict: PASS

## What holds

- **BLOCKING 1 is answered.**
  - The wrapper counts the messages the projection worker itself sends with a run's figures (solver-strategy l.90-104). The
    failure view asks it one question: `runStageTest` is `runMonteCarloAsync`'s only caller (App.jsx l.8254-8269).
  - The page shows the worker's stats when it sends them. On an error event, an error answer or an answer without stats it
    finishes on the main thread (l.7544-7556). So the count is 1 exactly when the figure shown is the worker's, and 0 on
    every fallback, warned or silent. My plant of an answer without stats, from the worker's own script, fails the first
    check alone.
  - The second check compares the unrounded chance and each year's five bands, as JSON, which round-trips a double exactly.
    One path is 0.02 points of 5,000.
  - It cannot fail where it should not. Both pages build the same plan's context and the seed's paths, and run the same
    engine functions in the same Chromium (mcWorker.js imports them from App.jsx). The seed is fixed (l.7674), S126 carries
    its valuation date (so the context reads no clock, l.1773-1775), and the run takes no random draw. A difference is the
    plumbing's.
- **BLOCKING 2 is answered, and the content it holds is the classic tab's own.** On 9d04859a's build (classic-chrome.txt):

  | classic tab: its content (iPhone 13 / Pixel 7) | the Details section's gated part on 0649c387 |
  |---|---|
  | Audit Data Table: 645 / 750px, the ledger card | Year by year: 645 / 750px, the same card |
  | Historical Backtest: 1139 / 1174px | 1163 / 1198px: the section less the strip (553), the strip's 24px gap left in |
  | Config & Assumptions: 905 / 885px. The number format card 180, the policy panel folded to 54, the three reference cards folded (133, 133, 309 / 289) | 843 / 823px: the same four cards, the policy panel gone (its controls are in You's Advanced, its Tax rules shown open here and subtracted), 16px gaps for 24 |

  - What is subtracted is only the planner's, or what it shows open:
    - the strip (at 9d04859a only under `solverOn`);
    - Tax rules, open;
    - the theme card (the classic Config had no theme);
    - the solver's settings.
  - Display's number format card stays in (PlannerCards.jsx l.193-198).
  - The narrower check is said where the coverage is claimed: CLASSIC-RETIRE.md l.176-186, STATE.md's Running line (2) and
    DECISIONS-PENDING.md's second D155 entry. Every figure there is the record's section 2, and mine.
- **MINOR 3 is answered.**
  - The form block runs in each device and theme block.
  - DECISIONS-PENDING.md's Advanced figures are section 2's (1224, 2380 and 750px; 1112, 2252 and 734px).
- **MINOR 4 is answered, and the desktop's gap the agent found is real.**
  - The typical run's cards come with the 'ahead' question after the first paths (PlannerPlan.jsx l.65-74). The card reads
    'filling' before that answer is in.
  - The strip is drawn only with its labels (PlannerMore.jsx l.279-282), so waiting for its mark waits for them.
  - On b612be65's build the harness fails exactly four checks: the desktop's and slide 4's, in light and in sepia (3a).
  - The header says plainly what is not measured: this year's actions and the rule of thumb (restyle-regression l.28-31).
    No classic check measured them: the parent's restyle-regression walked the classic tabs alone, the tournament under the
    switch. Acceptable.
- **MINOR 5 is answered as I set it out.**
  - My second look's three cases are now read as a reader sees them (the planted page).
  - The strip's labels are still composited: each label is positioned, with z-index auto, after its shade (PlannerMore.jsx
    l.211-218).
  - Nothing on the planner's pages changes between 1ce99382's probe and this one (layer-diff). The only texts with a
    positioned layer over them are the strip's four labels, at 1400 and on slide 4. Both rules composite each; no flag
    differs.
  - The layer test reads position, z-index and visibility, not colour, so the other themes have the same layers.
- **MINOR 6 is answered.** The port is the classic check (parent l.291-310) on the history check's chart, with the dialog's
  width added. 'halfchart' fails the height check on each phone and theme.
- **Item 7, the gate's failure on 1ce99382.**
  - The account holds:
    - the gate's log shows one harness failed, solver-projection;
    - 4a (the old harness and code, quiet) passes;
    - the owner worker runs each question to its end before the next: the actions, the rule of thumb and the ledger are
      synchronous jobs (solverWorker.js l.225-243). So a ledger asked behind Your plan's last two questions waits for them;
    - 4b's timing fits: the two answers in after 150s under load, the ledger at once after.
  - The new wait does not hide a ledger that never comes or comes wrong. It still gets its own two minutes, and every year's
    total and move are held to Node's.
- **The records' other figures are the results file's** (CHECKLIST 6):
  - section 1: the worker's answers 1 and 0, the chances 94.70 and 94.96, 40 years apart;
  - section 3a: four failures, at 3.85:1 and 3.93:1; 3p: one;
  - section 4b: 150s; MINOR 6's 388 of 390px, 410 of 412px, 390x664 and 412x839.

## Findings

1. **MINOR. The caps are converted with the chrome around a Plan Inputs section, not the chrome around the four tabs Details
   keeps. The gate is 40px stricter than the classic was; no outcome changes.**
   - **Measured (classic-chrome.txt).** On both phones each of the four tabs' content starts at 28px, and the page ends 72px
     below it: 100px of chrome. The page is `p-4`, with the phone's bottom padding of 4.5rem (App.jsx at 9d04859a,
     l.13495).
   - **Where 140px comes from.** A Plan Inputs section starts at 56px because its own section tabs (44px, sticky) and a 12px
     gap sit above it in its container (classic-inputs.txt; the first fix round's record, section 3). That is the 140px phone-ui uses for every tab (l.112-119,
     `CLASSIC_CHROME`), which CLASSIC-RETIRE.md l.177-178 says the classic page drew around a tab's content.
   - **The classic's caps** are 40px higher than the port's:

     | classic tab | iPhone 13: port / classic | Pixel 7: port / classic |
     |---|---|---|
     | Audit Data Table | 1055 / 1095px | 1370 / 1410px |
     | Historical Backtest | 1586 / 1626px | 2041 / 2081px |
     | Config & Assumptions | 1188 / 1228px | 1538 / 1578px |
     | Documentation | 1321 / 1361px | 1706 / 1746px |

   - **The effect.** Every check passes either way. Both sections over whole on the iPhone 13 stay over: 1716 of 1626px and
     1555 of 1228px.
   - The caps put to the maintainer are 40px under the classic's. DECISIONS-PENDING.md: "1716px against the Historical
     Backtest's 1586"; "1555px against Config & Assumptions' 1188".

2. **MINOR. The probe's new rule misses a layer painted beneath the text in cases the planted page lacks.**
   - **The rule** (probes.cjs l.55) composites a layer only where the text's element at that level is positioned and the
     layer's z-index is not above it. It is the rule my second look proposed. CSS also paints these layers beneath the text:
     - a negative z-index layer under static text, in a stacking context;
     - static text with opacity below 1, or a transform (painted as positioned at z-index 0);
     - a flex item's text with a z-index;
     - a layer above the text's positioned wrapper but under the positioned child that holds the text.
   - **Planted** (synth/layers2.html: dark text, rgb(40,40,40), over an indigo layer painted beneath it, 1.29:1).
     `elementFromPoint` puts the label on top in each case.
     - 0649c387's probe passes all five; 1ce99382's flags each at 1.29:1.
     - The rule's own case, a positioned label, is flagged by both.
   - **Latent.** None of these is on the planner's pages today: src has no negative z-index, and the strip's labels are the
     only layered texts (layer-diff). It is the other side of the hole my second look found.
   - **To tighten:**
     - count the text's level as positioned where it paints as one: opacity below 1, a transform or a filter, or a flex or
       grid item with a z-index;
     - take a layer with a negative z-index as beneath;
     - compare against the z-index of the text's own positioned element nearest that level;
     - plant those cases beside the six.

3. **MINOR. The Plan Inputs tab's own screen cap is not ported.**
   - The classic per-tab loop held Plan Inputs, on the section it opened at, to 2.0 screens (parent l.66-67 and l.179-182),
     on both phones in both themes, as it held the four tabs.
   - Its form block held each section to 1800px (l.931). The port carries the form block's rule (phone-ui's 1660px) but not
     the tab's cap.
   - It would pass today. You's first section's form is 840px. The cap converted with Plan Inputs' own 140px is 1188px on the
     iPhone 13 and 1538px on the Pixel 7. The classic page there was 847px, 1.28 screens on the iPhone 13.
   - CLASSIC-RETIRE.md l.112-114 says the classic tabs' screen caps were not ported and that the second fix round answers
     them. This one is not among those it answers.

4. **MINOR. Some new checks have no planted case (CHECKLIST 5).**
   - **docsLength** (phone-ui l.144-152) has its own measure, from the first card to the last, and nothing shows it failing.
     'nolengthsub' fails only the two sections with additions. The Year by year cap shares their arithmetic.
   - **restyle-regression's presence checks:** "the typical run's cards drawn" (l.166-169) and each slide's "shown, with its
     own content" (l.179-185). 3b shows the state they guard against, not the checks catching it.
   - **Planted cases that would show them:** every documentation card opened on a phone; the strip's mark hidden.

5. **MINOR. solver-projection's wait narrows what the ledger check covers, and the page's waiting line outlives a failed
   run.**
   - **The narrowing.** The check now asks for the ledger only once Your plan's last two answers are in (solver-projection
     l.157-161). A ledger asked behind them is now in no check: a question dropped or never answered behind them would pass.
     - It is the order a user meets by opening Details soon after the answer.
     - It is the order the harness exercised before: 4a passes it alone, on a quiet machine.
     - To keep it: a second check that opens Details before the two answers and gives the ledger their time plus two
       minutes.
   - **While it waits the page is honest.** The heading says whose ledger is shown, and the line under it says the solved
     plan's is being worked out (App.jsx l.8627).
   - **After a failure it is not.** If the solved plan's run fails, or answers without rows, the effect sets nothing
     (l.7914-7915). The line then keeps saying the ledger is being worked out until the plan or the place changes. This
     predates the change (the line dates from step U, cdcb9bd6).

6. **MINOR. desktop-reach measures Your plan's 24px targets on whatever the card shows when its marker is met.**
   - Its places' markers (l.60) are the kind my first look's finding 4 described: /Your plan/ is met by the place's own
     heading, drawn before the card. The first fix round moved restyle-regression's and phone-ui's markers to elements their
     cards draw; desktop-reach's stayed.
   - `place` waits 400ms after the marker (l.99-104), and the check runs then (l.174-181), whatever state the card is in.
   - reach-plan-run.cjs follows `place`'s steps straight after the page loads; the harness runs its glossary checks first,
     a few seconds. The card read 'solving' then, with 11 controls in Your plan. Once the typical run's cards were drawn it
     read 'filling', with 19.
   - Neither had a control under 24px, so nothing is hidden today. But on Your plan the header's "in every place of the
     planner" (l.5) can be measured on the progress card, not the answer. To answer it, wait as restyle-regression now
     does: the answer, then the typical run's cards by their marks.
