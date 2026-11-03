# The new planner: a solver-first layout (3 Nov)

The external review, for the maintainer and the agent. It is on `review/external-2026-10-21` and is not for merging. It
changes no default and no figure: it moves what Phases 8 to 10 built into a layout made for the solver, and adds the few
pieces that layout needs. The launch plan's step U (`2026-11-01/LAUNCH-PLAN.md` section 4) builds it.

**The design** is the canvas "The new planner: solver-first layout", thirteen screens, desktop and phone, with their
states. Where the canvas and this document differ, this document holds.

**Where its figures come from.** Every figure and sentence on the canvas's screens is printed by a script:
- `layout/figures.mjs` prints `layout/results-figures-S116.txt`, `-S224.txt` and `-S090.txt`. It ran on the agent's
  code at c5370be (3 Nov 18:15 UK). Each file is the app's own solve, and the Strategy tab's own figures and words, for
  one single household of the library:
  - S116: 61, retired, the main example;
  - S224: 55, still working, for the age dial;
  - S090: 61, retired, at target.
- `layout/ahead-words.mjs` prints the next ten years in section 8's proposed words, from those files' ledger lines;
  `layout/headline-words.mjs` prints the headline's back line, today's and proposed.
- `layout/extra.mjs` prints S116's typical run, year by year, and its ledger on the expected returns
  (`layout/results-extra-S116.txt`).
- `layout/chart-paths.mjs` scales S116's bands and typical run into the canvas's chart paths
  (`layout/results-chart-paths-S116.txt`).
- Seed 7002; EXPLORATORY: a render of the screens' content, deciding nothing.
- S116's and S224's runs printed their household lines before figures.mjs added the current approach's rules to them
  (S090's has them). S116's rules, from the library's plan: the decumulation policy "Bracket Fill Basic" (shown as Tax
  Smoothing), phased drawdown, guardrails off.
- The canvas's buttons, labels and help texts are this document's words (section 8).

**The main example, S116** (`results-figures-S116.txt`, the lines "headline words (all 5000)" and "compare (all
5000)"):
- "Your safe starting spend: £41,600 a year. That is 80% of your £52,000 target. On a typical run of the markets you
  are back at your full target by 2043 (17 years in)."
- Chance your money lasts: 90%. Spending delivered over the plan: 92% of your target.
- Against its current approach on the same 5,000 markets: survival 89.5% against 41.4%.
- The canvas shows the back line in section 8's proposed words: "In half the markets you are back at your full target
  by 2043 (17 years in)." (`results-headline-words-S116.txt`). Those two lines of B4's wording change only when the
  maintainer adopts this document.

## 0. In one page

**Why the layout changes.** The full planner's tabs were built for the app's own rules: you enter a plan, then a
tournament, a policy search and a projection tell you how it fares. Phases 8 to 10 put the solver's pieces into those
tabs, each where it fitted (section 1):
- the answer on the fifth tab (Strategy), its levers on the third (Config);
- the dials, the searches and the scenarios on the Projection tab;
- the ledger on Audit, the check on Historical Backtest.

So the answer takes six tabs to read. A lever sits three tabs from the figure it moves. And every view waits on a solve
of minutes on its own, with its own line.

**The new planner: four places, the answer first.**

| place | what it holds | where it is today |
|---|---|---|
| **Your plan** | the answer; why; the outlook (spending and money); **what matters to you** (the levers) beside the answer; this year's steps; the next ten years; the solved plan against your current approach; print | Strategy; Config's aims; Projection's fan |
| **You** | the inputs; then the limits on the solver; then your current approach (the rules the comparison uses) | Plan Inputs; Config's locks, policy and guardrails |
| **What if** | retiring earlier or later; spending more or less; the solved plan's limits (the highest target, the earliest age); scenarios | Strategy's age dial; Projection's "Spend and date" and scenarios; the Simple page |
| **Details** | year by year; the history check; assumptions; how the solver decides; print and export | Audit; Historical Backtest; Config's assumptions; Documentation |

**Two planners.**
- **The new planner** is the solver's, for a single household, behind B6's opt-in.
- **The classic planner** is today's nine tabs, exactly as they are with the switch off: the app's rules, the
  tournament, the sandbox. It is for couples (D42), for anyone who prefers it, and it is the yardstick: "your current
  approach" is its rules.
- So the Phase 8 to 10 pieces leave the classic tabs and move into the new places. Every component stays: SolverAims,
  SolverLocks, SolverStrategy's parts, FiguresList, SolverAges, SolverAnswers, SolverScenarios, SolverHistory and the
  ledger's words. What changes is where each sits, and a few words.

**What is new**, beyond moving things:
1. **One status strip** for the whole planner, in place of each card's own line (section 4).
2. **The last answer kept** while a changed plan solves: dimmed, and labelled as the plan before the change (section
   4.2). Today the answer goes blank for the minutes of the solve.
3. **The outlook's two charts**, both from the headline's own paths, so no second simulation:
   - what you could spend, a year at a time (the late raise's fan: D44 (2), Phase 9 item 6);
   - what you would have.
4. **A target dial** on What if: the age dial's twin.
5. **The quick start:** the Simple page's few fields, as the new planner's first visit.
6. **The phone:** Your plan as a deck of six slides, the levers in a sheet, four places on the bottom bar and no More.
7. **The printable sheet of the solved plan** (Phase 9 item 7's; not yet built).
8. **The words** (section 8):
   - "your current approach" for the app's rules on the plan as entered (Phases 9 and 10 call it "your plan");
   - the comparison retitled;
   - Phase 9's full text pointing beside the answer, where the dial now is, not to "Settings";
   - three things that only show once the pieces sit side by side (L10 to L12): the dial's line and the headline on
     different path counts, rows waiting that read as working, and the headline's "typical run", which is not the
     ten-year table's. The last needs two lines of B4's wording changed, for the maintainer to adopt or strike;
   - the next ten years saying a held tier once, not every year (L9).

**Step U builds it.** It is new, and goes after step P and before Phase 11.
- Its harness, `solver-planner-ui.cjs`, is REQUIRED. The switch-on harnesses move to the new places.
- **Box:** four days.
- **Phase 11** becomes the phone's grid, memory and real-phone solve, on the new planner.
- **Phase 12's opt-in** switches between the two planners.

## 1. What the classic tabs get wrong for the solver

Each finding names its source in the agent's code at c5370be.

| # | finding | source |
|---|---|---|
| L1 | The answer is on the fifth tab and its levers on the third. A lever re-solves, and the figure it moves is two tabs away. On a phone the levers are behind More. | App.jsx `TABS`, `PHONE_PRIMARY` (Start, Inputs, Projection, Strategy); SolverConfig.jsx `SolverAims` |
| L2 | No one place says what the solver is doing. Config's line, Strategy's "Working out your plan (42%)…", the dial's "working it out…" and the scenarios' "solving it…" each wait on their own. | SolverConfig.jsx `SolveLine`; SolverStrategy.jsx; SolverFigures.jsx |
| L3 | A changed plan blanks the answer for the whole solve: the card shows "Working out your plan…" until the new solve's first 2,000 paths are in. In one worker an edit takes 10.7 to 13.7 minutes to reach a solved and simulated plan. | SolverStrategy.jsx (`view.key === solve.key ? view.strategy : null`); `2026-11-01/launch/results-estimate.txt` |
| L4 | The late raise was to be shown in the fan, not the headline (D44 (2); Phase 9 item 6). It is a line in the headline card, and the only fan is the money fan, on another tab. | SolverStrategy.jsx `data-strategy-raise` |
| L5 | "Your plan" names two things: the plan the person makes, and the app's rules on it, which is the comparison's column ("Your plan against the solved plan"). In a solver-first planner the place that holds the answer is "Your plan". | SolverStrategy.jsx (the compare title); SolverHistory |
| L6 | The full text sends the reader to a tab that does not exist: "turn up How much do you dislike cuts? in Settings". The tab is "Config & Assumptions". | solverWords.js `WORDS.full[1]` |
| L7 | Under the switch the classic tabs keep the app's machinery beside the solver's, so one screen gives two answers: the sandbox's instant survival under the app's rules, the guardrails "your plan only", the policy search hidden. | App.jsx `solverRules` branches (lines 13342 to 13612, 11124) |
| L8 | Two pages ask one question. Under the switch the Simple page's answers come from the solver only on request, and its own figures from the app's rules. | SolverSimple.jsx `SolverSimple` |
| L9 | The next ten years repeat a held tier as a move each year. On S116 every year from 2026 to 2034 reads "Move your pension 3 steps lower in risk; Move your ISA 3 steps lower in risk", one move made once and then held. In 2035, a step back up to two below the plan's own tier reads "Move your pension 2 steps lower in risk". A year with nothing to say reads "as the year before", even in the first year and in a working year. | solverWords.js `aheadWords` (it says `tierPen`, the year's tier against the plan's own, whenever it is not 0); `layout/results-figures-S116.txt` and `-S224.txt`, the "ahead:" lines |
| L10 | Side by side, the dial's line and the headline disagree. The dial's live line reads the first 2,000 paths, so that it compares exactly with the other settings, each run on 2,000; the headline reads 5,000. On S116 the line says "chance your money lasts 89%" beside the headline's 90%. On separate tabs nobody saw it. | SolverConfig.jsx `DialLive` (FiguresList, `upto` 2,000, `exact`); `layout/results-figures-S116.txt`, "dial line (first 2000)" and "headline words (all 5000)" |
| L11 | A setting waiting its turn reads like the one being worked out: every row not yet in says "working it out…", one at a time or not. | SolverFigures.jsx `FiguresList` (`mine.at[o.id] \|\| { working: true }`) |
| L12 | One page, three "typicals". The headline's back year is the median over the paths of each path's first year at target: 2043 on S116. The next ten years follow one path, the one at the median of the pot left at the end: that path is first back at target in 2038 (age 73), and back down at 80% from 77 to 80. Each year's median level is above 100% only from 2045 (age 80). Yet the headline calls its figure "a typical run of the markets", the ten-year table's words for its one path. | solverStrategy.js `headlineOf`, `aheadOf`; `layout/results-figures-S116.txt` (the headline, "spend solved all"); `layout/results-extra-S116.txt` ("typical run levels", "typical run back at target"); `layout/results-headline-words-S116.txt` |
| L13 | A plan that starts above its target repeats the headline in the raise line. S090's headline reads "£31,350 a year, above your £28,500 target", and under it "If markets do well, you could spend up to 10% above your target from about age 61", its first year. | solverWords.js `raiseWords`; `layout/results-figures-S090.txt`, "headline words (all 5000)" and "raise (all 5000)" |

## 2. The structure

### 2.1 Which planner a visitor sees

**The switches.**
- `SOLVER`, the build switch: false on `main` until Phase 12.
- `rp_planner`, a new localStorage key, B6's opt-in: `'new'` or `'classic'`. It is read only when `SOLVER` is true.
  - **Before Phase 12**, in the preview build only: `'new'` unless set.
  - **From Phase 12:** `'classic'` unless the visitor opts in (R6: off by default).
- `PLANNER_BETA`, a new constant: false hides the opt-in and gives everyone the classic planner. This is B6's "one
  deploy turns it off for everyone". The preview build sets it true, as it sets `SOLVER`; on `main` it is false until
  Phase 12.

**The rule, in App.jsx.**
```
const solverOn = SOLVER && PLANNER_BETA && planner === 'new';   // replaces SOLVER in every gate in App.jsx
const solverRules = solverOn && plan?.demographics?.planningMode === 'single';
const tabs = solverOn ? PLANNER_TABS : visibleTabs();
```

**The classic planner** is the app with the switch off, bit for bit, whatever `SOLVER` says:
- every `solverRules` branch in the classic tabs is false;
- none of the solver's chunks is fetched;
- load-perf's switch-off ceiling holds.

**A couple's plan in the new planner** shows the couples card on Your plan, What if and Details (section 6). You works as
for anyone.

**The Simple page.**
- In the new planner, the Shell's `rp_which_app` value `'simple'` opens the new planner. An empty plan lands on the
  quick start (section 5).
- In the classic planner it is unchanged.

**The crossover.**
- In the new planner: "Classic planner", which sets `rp_planner` to `'classic'`.
- In the classic planner, with `SOLVER` true: "Try the new planner (beta)", which sets it to `'new'`.
- Both stay in the same app and the same saved plan, so nothing is carried and nothing is lost.

### 2.2 The places and the navigation

```
const PLANNER_TABS = [
  { id: 'plan',    Icon: Target,    label: 'Your plan', short: 'Your plan' },
  { id: 'you',     Icon: User,      label: 'You',       short: 'You' },
  { id: 'whatif',  Icon: GitBranch, label: 'What if',   short: 'What if' },
  { id: 'details', Icon: BookOpen,  label: 'Details',   short: 'Details' },
];
```

**Desktop.**
- The header (56px): the name, the beta mark, "Classic planner", and the theme control.
- The tab strip (`data-tabbar`, 48px) with the four places, and the status strip at its right end (section 4.1).
- Both stay at the top as the page scrolls.

**Phone.**
- The top bar (44px, the Shell's `PhoneBar`): the name, the theme control in `extra`, and "Classic planner".
- The status line (32px) under it.
- The bottom bar with all four places (`PHONE_PRIMARY` = the four), and no More sheet.
  - Export and import move to Details' "Print and export".
  - The number format moves to Details' Assumptions, under Display.

**The landing place.**
- Your plan, when the plan has inputs.
- The quick start, when it has none (`planStarted` false).

**Classic ids.** A classic tab id read from the session in the new planner maps to its new place:

| classic id | new place |
|---|---|
| home, strategy, projection, config | plan |
| inputs | you |
| historical, audit, docs | details |

**`data-place`.** Each place's root carries `data-place="plan"`, `"you"`, `"whatif"` or `"details"`. The harnesses
check where they are by it.

### 2.3 Where each piece goes

| today | piece | the new planner | change |
|---|---|---|---|
| Strategy | the headline, the explanation | Your plan: the answer card, the explanation | the last answer kept (4.2); the raise moves to the outlook |
| Strategy | this year, the rule of thumb, the next ten years | Your plan | none |
| Strategy | "Your plan against the solved plan" | Your plan: "The solved plan against your current approach" | retitled; one line naming the rules (3.1) |
| Strategy | the age dial (`SolverAges`) | What if | none |
| Config | `SolverAims` | Your plan: "What matters to you", beside the answer | retitled; no `SolveLine` |
| Config | `SolverLocks` | You: "Limits on the solver", after the inputs | none |
| Config | decumulation policy, drawdown strategy, guardrails, the 0% harvest | You: "Your current approach" | labelled as the comparison's rules (3.2) |
| Config | CGT on the GIA; where you pay tax | Details: Assumptions; You, section 1 | the tax rule both plans run under; a fact about the person |
| Config | general assumptions, tax bands, returns and volatility, number format | Details: Assumptions | none; the bridge safety margin stays hidden (B13) |
| Config | the policy search | the classic planner only | — |
| Projection | the fan, under the solved plan | Your plan: "What you would have" | from the headline's runs (3.1) |
| Projection | "Spend and date" (`SolverPlanAnswers`) | What if: "The solved plan's limits" | `SolverAnswers` named `'whatif'` |
| Projection | the scenario comparison, `SolverScenarios` | What if: "Your scenarios" | none |
| Projection | the sandbox | the classic planner only | — (L7) |
| Audit | the ledger with the action column | Details: Year by year | the solved ledger first |
| Historical | the backtest, `SolverHistory` | Details: History check | none |
| Documentation | the docs | Details: How the solver decides | Phase 12's section and glossary land here |
| Start Here | the welcome and the tab cards | the quick start; a line on Your plan | the tab cards go |
| Simple page | its inputs and answers | the quick start; What if | folded in |

## 3. The places

### 3.1 Your plan

**The layout.**
- **Desktop:** the content at most 1,280px wide (`max-w-7xl`), 32px side padding.
  - At 1,100px and wider: two columns, the main one `minmax(0, 1fr)` and the side one 380px, 24px apart.
  - The side column stays in view as the page scrolls (sticky under the strips), scrolling on its own if taller than
    the window.
  - Below 1,100px the side column moves under the explanation, not to the page's end.
- **Phone:** a deck of six slides (section 9).

**The main column, in order.**

1. **The answer card** (`data-plan-answer`, its state as section 4.2).
   - The eyebrow: `headlineWords.title`, "Your safe starting spend" or "… when you retire".
   - The amount: `headlineWords.amount`, in the display face (section 7), with tabular figures.
   - The share and the back line, when the plan starts below target: `share` then `back`.
   - **The chance:** "Chance your money lasts" with its figure large.
   - **The spending delivered:** `headlineWords.delivered`, smaller.
     - These two only, as B4 decided: no second rate in the headline. Your current approach's figures are in the
       comparison.
   - The footnote: "On 5,000 simulated markets."
   - "Print this plan" (section 3.1's print sheet), once the actions are in.
2. **The explanation:** `explanationWords`, the short note or the full text, as today, with L6's fix (section 8).
3. **The outlook** (`data-outlook`): two charts, side by side from 900px, stacked below that.
   - **"What you could spend"** (`data-outlook="spend"`). Each year's spending as a share of that year's target, over
     the solved plan's paths still going:
     - the 10th to 90th percentile band and the 25th to 75th band;
     - **the line is the typical run**, the one path the next ten years follow (`aheadOf`'s), and not each year's median
       (L12). So the chart and the table under it agree;
     - **a mark at the headline's back year**, labelled "half the markets back at your target by 2043". So the chart and
       the headline agree;
     - the target at 100%, and the floor at its share ("the lowest it plans": 80% under B2, or the plan's own floor);
     - the x axis from the retirement age (today's age if retired) to the plan's end; the y axis in % of target, ticks
       at 80, 90, 100 and 110;
     - under it, the raise line (`raiseWords`) where the strategy has a raise, with a mark at the raise's age; not
       where it adds nothing to the headline, its level no higher than the start's, from the first retired year (L13);
     - beside it on request ("Show the figures"), the bands as a table.
   - **"What you would have"** (`data-outlook="wealth"`). The money, all wrappers, in today's money:
     - the solved plan's 10th to 90th band, 25th to 75th band and median;
     - your current approach's median, dashed and labelled;
     - the minimum pot as a line, where the plan sets one;
     - the x axis from today's age to the plan's end.
   - **Their figures come from the headline's own runs**, so they cost no second simulation and sit on the same paths
     as the headline and the comparison:
     - `spendBandsOf(runs)`: the levels runPath already records;
     - `typicalOf(runs, k)`: the typical run's levels, `runs.solved[k].level`, where k is `aheadOf`'s path;
     - `wealthBandsOf(runs)`: runPath records each year's `totalCombined` beside its level (a Float32Array a path; 5,000
       paths of 36 years is 0.7 MB);
     - each uses summarizeTrials's quantile;
     - each goes into `strategySummary`'s answer, so a split simulation joins them as it joins the rest (`joinRuns`).
     - **Why not the projection's fan:** the canvas draws S116's money from the engine's own `monteCarlo` on 2,000
       paths, as the projection would. There the typical pot at 96 is £274,378, against the comparison's £283,291 on
       the headline's 5,000 (`results-figures-S116.txt`, "fan solved" and "compare (all 5000)"). Drawn from the
       headline's runs, the chart and the table cannot disagree.
   - **States:** pending until the headline's first 2,000 paths are in; refined with the headline at 5,000.
   - **Accessibility:** each chart is `role="img"` with a short label made from its figures. The canvas's, for S116
     (from `results-extra-S116.txt` and `results-figures-S116.txt`): "On a typical run: 80% of your target to 69, up to
     110% at 73, down to 80% from 77 to 80, and 110% from 84. Half the markets are back at your target by 2043. In good
     markets, up to 110% from about 73."
4. **This year** (`data-strategy-actions`): "This year", or "This year, before you retire".
   - Each action is a numbered row: `actionWords.what` (14px, medium) and `actionWords.cost` (12px, muted).
   - The skip costs come in after the headline: "Working out what each of this year's steps is worth…".
   - With none: "Nothing to change this year: keep to your plan as it stands."
5. **A rule of thumb** (`data-strategy-rule`), where it is shown (its cost under 0.5 points, as today).
6. **The next ten years** (`data-strategy-ahead`): a table on a desktop, a list on a phone.
   - The columns: year (age), spending (level), the year's move.
   - Each of a year's moves on its own line in the cell, not joined with "; ".
   - Consecutive years with the same spending and the same words make one row: "2027 to 2034 (ages 62 to 69)", its
     words ending ", each year". On S116 the ten years are three rows.
   - Under it, `COME_BACK`.
7. **The solved plan against your current approach** (`data-strategy-compare`), on the same 5,000 markets.
   - The columns: "Your current approach", "Solved".
   - The rows: today's five.
   - Under it, one line: "Your current approach is your plan run by the app's own rules: [the decumulation policy's
     name], guardrails [on or off]. Change them in You, under Your current approach."

**The side column: "What matters to you"** (`data-solver-aims`). This is `SolverAims` as built:
- the dial;
- the estate, raises, investment risk and minimum pot;
- the floor's line.

With four changes:
- its title is "What matters to you" (it was "What the solver aims for"); its first line is unchanged;
- no `SolveLine` (a `solveLine={false}` prop): the status strip carries the state, `data-solve-state` with it;
- each choice is a segmented control the panel's full width, 36px tall (44px on a phone);
- **the dial's live line becomes a table, on request** (L10).
  - The answer card beside it already shows the plan's own setting, on 5,000 paths. So the panel does not repeat it.
  - "Compare the four settings" (it was "Show the four settings") runs the others as today, nearest first.
  - The result is a table: the setting, where it starts, when it is back at target, and the chance the money lasts.
    Every row is on the same first 2,000 paths, the plan's own setting included, marked "(yours)".
  - Under it: "Each on the same 2,000 simulated markets, so they compare fairly. The answer uses 5,000."
  - The row being solved says "working it out…"; the rows queued say "waiting its turn" (L11).
  - Under the button, before it is pressed, its cost: "Three more solves, about M minutes on this device" (section
    3.3's rule; on S116's 357-second solve, about 18 minutes).
  - `FiguresList` keeps its logic and gains a `table` presentation; the age and target cards keep the list.

**The print sheet.** `actionPlan.js` gains the solved plan's page, with the same print stylesheet. It holds:
- the answer and the explanation;
- this year's steps with their costs;
- the next ten years;
- the rule of thumb, where shown;
- the comparison;
- the levers' positions, the date and the code version.

### 3.2 You

**The layout.**
- **Desktop:** a section list on the left (sticky, 220px), the sections stacked on the right, the content at most
  1,280px wide. A section in the list scrolls to its card.
- **Phone:** the section tabs as today (`SectionTabs`, swipe between them), with the two new sections added.

**The sections, in order.**
1. **You:** today's section 1 (`showSection('you')`), the demographics, the target and the minimum pot. Also "Where you
   pay tax", moved from Config's tax card (App.jsx line 13864), since it is a fact about the person.
2. **Your money:** today's "Portfolio".
3. **Income.**
4. **One-off deposits.**
5. **One-off costs.**
6. **Limits on the solver** (`data-solver-locks`): `SolverLocks` as built. Its own title, "What the solver may
   change", becomes the first words of its line under the section's name.
7. **Advanced:** today's advanced inputs, then **"Your current approach"** (`data-current-approach`), a new card
   holding the controls that today sit in Config's "Spending & tax settings" and set the app's rules:
   - the decumulation policy, the pension drawdown strategy, the spending guardrails, and the unused 0% allowance's
     harvest;
   - not "Capital gains tax on the GIA": it is a tax rule both plans run under, so it goes to Details' Assumptions;
   - its line: "The app's own rules for your plan. The solved plan is compared with them (Your plan, the last card).
     The solver makes its own choices."

**Your current approach must not re-solve.**
- A change there re-runs the comparison, and nothing else.
- Today the solve's key is the plan as the solver takes it (`solverKey.js`, `prepareForSolve`). That already sets the
  guardrails and the lookahead off, so they cannot move the key. The policy's name and the 0% harvest may still move
  it.
- **The test,** per control: plant a change, read the key.
  - Where the key moves and the solve does not read the field (an identity test on the tables), the key drops the
    field.
  - Where the solve does read it, the control is an input of the solved plan too, and stays in section 2 or 7 with a
    line saying so. The drawdown strategy is one: the lump-sum lock's "Free" reads it.
- A control is moved only once its test is written.

**At the top of the page:**
- "Save as a scenario": it saves a copy of the plan, listed on What if;
- the plan's name, if it has one.

### 3.3 What if

**The layout.**
- **Desktop:** two columns of cards from 1,100px, one below that.
- **Phone:** the cards stacked.

**The cards.** Each solves only when asked, and says first what asking costs: "N solves, about M minutes on this
device". M is N times this device's last solve (`solveMeta.secs`). When the solve in hand was restored, so no time is
known, it says "several minutes each". Each list ends: "Nearest first. Each on the same 2,000 simulated markets; your
plan's answer uses 5,000." (L10).

1. **"Retiring earlier or later"** (`data-solver-ages`): `SolverAges` as built. The plan's own age comes first; up to
   three ages each way are offered. It is shown only for a household still working (`ageOptions` returns none
   otherwise).
2. **"Spending more or less"** (`data-solver-targets`), new.
   - It is `FiguresList` over the target: the target times 0.8, 0.9, 1.1 and 1.2, each rounded to £500, nearest first
     (0.9, 1.1, 0.8, 1.2).
   - Each is `atSpend(plan, x)`, one solve each, the headline on the first 2,000 paths.
   - The button: "Solve £41,500 to £62,500 a year".
   - Each line: "Spend £47,000 a year: " then `dialLineWords` (S116's options: £41,500, £47,000, £57,000, £62,500).
   - The figures belong to the plan with every other input as it is, as the age dial's do.
3. **"The solved plan's limits"** (`data-solver-answers="whatif"`): `SolverAnswers`.
   - The goal is an input, 90% by default (`SEARCH_GOAL`).
   - Its cost line counts the most it can take: "Up to 14 solves (8 for the target, 6 for the age)", from
     `SEARCH_MOST`.
   - Its two answers: the highest target it keeps at the goal, at your retirement age; the earliest retirement it
     keeps there, at your spending.
   - Named apart from the safe starting spend, as F12 requires.
4. **"Your scenarios"** (`data-solver-scenarios`): the saved scenarios, and the current plan first.
   - Each row: its name; what differs from the current plan, in a line; and its solved line, or "Solve this scenario"
     (`SolverScenarios` as built).
   - "Load", which makes it the current plan, and "Delete".
   - A couple's scenario keeps the app's rules, as today (D42).

There is no sandbox. Its instant figures are the app's rules' (L7), so it stays in the classic planner. A change to try
is a scenario: save, then edit in You.

### 3.4 Details

**The layout.** The title "Details", then a segmented control for its four sections: Year by year, History check,
Assumptions, How the solver decides. At the right: "Print this plan", "Export plan (JSON)" and "Import plan (JSON)".
- **Desktop:** the four sections stacked, as You's are; the control jumps to each and marks the one in view.
- **Phone:** `SectionTabs`, one section at a time.

1. **Year by year** (`data-audit-ledger`): today's audit table.
   - The solved ledger shows first, with its action column.
   - The toggle reads "The solved plan" and "Your current approach" (`data-audit-view`, as today).
   - "Export CSV spreadsheet" stays beside it.
2. **History check** (`data-history-solved`): `SolverHistory` at the top, then today's backtest: its start-year choice
   and its wealth path.
3. **Assumptions** (`data-assumptions`): today's Config cards, unchanged:
   - general assumptions (the valuation date, inflation, the access ages, the death-tax haircut, the seed);
   - the tax bands and rates (the region's select moves to You, section 1), and "Capital gains tax on the GIA" (from
     Config's spending and tax card);
   - the risk tiers' returns and volatility;
   - the cash buffer.

   Then two cards:
   - **Display** (`data-display`): the theme and the number format (today's "Decimal choice");
   - **The solver's settings** (`data-solver-settings`), read only: "45 wealth points. The floor at 80% of your target
     where you set none. The dislike of cuts at 1, 3, 6 or 10 times its lowest setting. The headline on 5,000 simulated
     markets. The candidate d71f65ae871e."

   The tournament bridge safety margin stays hidden (B13).
4. **How the solver decides** (`data-docs-solver`): Phase 12's new Docs section, the coverage card ("What this model
   will not tell you", from Start Here) and the glossary (section 8), each linking into the full Documentation
   (`Docs.jsx`, lazily).

## 4. The solve's states

### 4.1 The status strip

One component for the whole planner. It carries `data-solve-state` and `data-solve-key`, which move here from
`SolveLine`. Its words go in a small module of the page's entry (`src/solveStatus.js`, a few hundred bytes), since it
shows before any of the solver's chunks arrive.

| state | the desktop strip | the phone line |
|---|---|---|
| idle, phone, not asked | — | "Not worked out on this phone yet" and "Solve my plan" |
| solving | "Working out your plan: year by year, 42%", with a bar, and "about 3 minutes left" | "Working out: 42%", with the bar |
| solving, the bridge years | "Working out your plan: the years before your pension opens, 12%" | the same, shorter |
| solving a dial position's base | "… at the Low setting first, 30%" | the same |
| stale | "Your plan changed: working it out again" (a desktop solves at once) | "Your plan changed" and "Solve again" |
| simulating | "Worked out. Running it through 5,000 markets…" | "Running 5,000 markets…" |
| solved | "Worked out in 6 minutes", or "Worked out on this device before" when restored | "Worked out" |
| not kept | adds: "It is not kept on this device ([why]), so it solves again next visit." | the same, in the details |
| failed | "The solver could not finish this plan", and "Try again" | the same |

**The time left** comes from the progress (`done` of `total`) and the time since the stage began. It shows from 10%,
and only when over a minute.

**A solve's time** reads in seconds under 90 seconds and in whole minutes from there ("Worked out in 6 minutes"; today
`SolveLine` says "Solved in 357 seconds").

**Solves asked for on What if or by the dial's comparison** run beside the plan's own. The strip adds "· 1 more being
worked out" (on its place: "here"), so the person knows something is still running after the answer is in.

**On a phone the request is per version of the plan.**
- An edit after a solve makes it stale, and "Solve again" solves it.
- Today `solveAsked` stays true for the session after the first request (App.jsx line 8388), so every later edit
  starts a solve of minutes on the phone at once.
- B10's "on request" is kept for each version: `solveAsked` resets on an edit.

### 4.2 The answer card in each state

| state | what the card shows |
|---|---|
| **first solve** (no answer yet) | the eyebrow; "Working out your plan"; three lines: what the solver does, about how long, and that the other places can be read meanwhile |
| **filling** (the first 2,000 paths in) | the figures, with "On 2,000 simulated markets so far"; this year's "Working out…"; the outlook from the same paths |
| **done** | everything; "On 5,000 simulated markets." |
| **stale** | the last answer at 55% opacity, behind an amber band: "Before your last change. Working out the new plan: 42%". Print is hidden. The levers stay live. |
| **failed** | an amber card: "The solver could not finish this plan.", the error in small type, "Try again", and "Meanwhile the classic planner shows your plan under the app's own rules" with "Open the classic planner" (F16). Below it, your current approach's figures: the chance your money lasts and the money fan, from the projection's run of your plan. |
| **couple** | section 6's card |
| **phone, not asked** | "Solve my plan" (B10) with the expected time: "It can take several minutes on a phone" until Phase 11 measures it, then the measured time |

**Keeping the last answer.**
- The strategy view keeps the previous `{ key, strategy, more }` and shows it under the stale band until the new key's
  first figures arrive.
- It is never shown as current: the band, the opacity and `data-plan-answer="stale"` go together.
- What if's figures follow their own rule (`FiguresList`: any other edit drops them) and show their "working it out"
  lines.

## 5. The first visit: the quick start

The Simple page folded in. It is shown when the plan is empty (`planStarted` false), in place of the answer card, on
Your plan (`data-quick-start`).

- **The title:** "Let's work out your plan". The first line: "Tell us the basics and the solver works out how to run
  your money: how much to spend each year, which pot to draw from, and how to invest. You can add the details later in
  You."
- **The fields** are the Simple page's, as `simplePlan.js` names them:
  - your age; when you stop working; what you want to spend a year (today's money); where you pay tax;
  - pensions; ISAs; other savings and investments; cash;
  - your State Pension a year, its placeholder the full new State Pension as today.
- **"Work out my plan"** waits for `readiness(s)`: your age, when you stop working, what you want to spend, and what you
  have saved. It builds the plan with `toFullPlan`, then solves.
  - Under it: "It takes a few minutes. The other places fill in as it works."
- **"Or fill in everything now"** goes to You.
- **"Planning for two?"** says: "The new planner works out plans for one person for now. A couple's plan uses the classic
  planner." It links to the classic planner.
- **The Start Here page's honesty line** moves to the foot of Your plan: "Educational and illustrative only. This is not
  financial advice."

## 6. Couples, and the classic planner

**A couple's plan in the new planner** (`data-planner-couple`) shows, on Your plan, What if and Details:
- **The title:** "The new planner works out plans for one person for now".
- **The text:** "Your plan is for two people. Until the solver plans for couples, which is being built, a couple's plan
  follows the app's own rules in the classic planner. Your inputs are kept either way."
- **"Open the classic planner"**, and "Change to a plan for one person", which goes to You's planning mode.

**The classic planner is untouched.** Its harnesses run against it in both modes (section 11.2). Part D (D5) brings
couples into the new planner later.

## 7. The look

The app's own visual language, its tokens and its three themes: nothing is hard-coded. Colours come from the Tailwind
tokens (`slate-*`, `surface`, `accent`, `indigo-*`, `emerald-*`, `amber-*`), so the dark and warm themes follow.

**Type:**
- IBM Plex Sans for words, IBM Plex Mono for table figures;
- Newsreader (`font-display`) for the answer's amount and the quick start's title alone: the amount 52px on a desktop
  and 40px on a phone, weight 500, "a year" beside it at half the size;
- place titles 22px semibold; card titles 15px semibold;
- body 14px on a desktop (today's 12px is kept for secondary lines); secondary 12px in `slate-500`.

**Surfaces:**
- the page `slate-50`; cards `surface`, 1px `slate-200/90`, radius 12px;
- the answer card's border `indigo-200`, the solver's colour as today.

**Charts:**
- the solved plan in indigo: the 10–90 band `indigo-100`, the 25–75 band `indigo-200`, the line (the typical run on
  the spending chart, the median on the money chart) `indigo-700` at 2.5px;
- your current approach `slate-500`, dashed, 1.5px;
- the target `slate-400`, dashed; the floor `amber-700`, dotted, labelled;
- no colour carries meaning alone: each line is labelled at its end.

**States:**
- solving: `blue-600` on the bar;
- stale and failed: `amber-50` ground, `amber-800` text;
- solved: `emerald-600`'s dot beside `slate-600` text.

**Targets:** 44px on a phone (`min-h-11`), 36px on a desktop.

## 8. The words

All of them go in `solverWords.js`'s table (B4), except the status strip's, which go in `solveStatus.js` (section
4.1). Each change below is one line.

**Changed:**

| where | today | in the new planner |
|---|---|---|
| `WORDS.full[1]` | "… turn up How much do you dislike cuts? in Settings." | "… turn up How much do you dislike cuts? under What matters to you." |
| the comparison's title | "Your plan against the solved plan, on the same N markets" | "The solved plan against your current approach, on the same N markets" |
| the comparison's column | "Your plan" | "Your current approach" |
| SolverAims' title | "What the solver aims for" | "What matters to you" |
| SolverHistory | "Your plan as you are now, on the same history" | "Your current approach, on the same history" |
| the audit toggle | "The solved plan", "Your plan" | "The solved plan", "Your current approach" |
| the audit's action column | "Action" | "The year's move", as on Your plan |
| the audit's title, solved | "Year-by-Year Cash Flow & Wrapper Ledger" | "Year by year, on the expected returns", and its line "One steady market, not a forecast: every year's figures as raw numbers, so you can check the arithmetic." |
| `aheadWords`, a tier (L9) | the year's tier against the plan's own, every year it is not 0: "Move your pension 3 steps lower in risk" | only in the year it changes, against the year before. The first year: "Move your pension and ISA 3 steps lower in risk". A step back: "Move your pension and ISA 1 step back up in risk (2 below the risk you chose)". A step further: "… 1 step further down in risk (2 below the risk you chose)". Back to the plan's own tier: "Move your … back to the risk you chose". The pension and ISA are named together where they move alike. |
| `aheadWords`, an empty year | "as the year before" | "nothing to change" |
| `WORDS.back` (L12; B4's words) | "On a typical run of the markets you are back at your full target by 2043 (17 years in)." | "In half the markets you are back at your full target by 2043 (17 years in)." The figure is unchanged; the words now say what it is. |
| `WORDS.never` (L12; B4's words) | "On a typical run of the markets you stay below your target; see why below." | "In more than half the markets you stay below your target; see why below." |
| the dial's button (L10) | "Show the four settings" | "Compare the four settings" |
| `FiguresList`, a row queued (L11) | "working it out…" | "waiting its turn" (the row being solved keeps "working it out…") |

The proposed `aheadWords` on S116 and S224 is printed by `layout/ahead-words.mjs` from their ledger lines
(`layout/results-ahead-words-S116.txt`, `-S224.txt`). Its test: on S116 the tier is said in 2026 and 2035 only, and a
plant that says it every year fails. This year's actions keep today's words, since the first year's move is from the
plan's own tier.

**New** (the canvas has each in place):
- the place names;
- this year's line on a phone: "Each shows what skipping it, this year only, would cost.";
- the phone's first visit: "Your plan is ready to work out", "Keep this page open while it works.", and "What you
  will see" with its three lines;
- the phone's note while it works: "Keep this page open. You can read the other places, or change more on You;
  another change starts the work again when you ask.";
- the status strip's lines (section 4.1);
- the stale band;
- the quick start's lines (section 5);
- the couples card (section 6);
- "Spending more or less" and its button;
- the What if cards' cost line;
- "Your current approach" and its line;
- the comparison's line under the table;
- the outlook's titles: "What you could spend" and "What you would have";
- the charts' labels: "your target, £52,000", "the lowest it plans, 80%", "the typical run", "half the markets",
  "eight in ten", "the solved plan, typical", "your current approach, typical", and the mark "Half the markets back at
  your target by 2043";
- the dial's table footnote: "Each on the same 2,000 simulated markets, so they compare fairly. The answer uses 5,000."

**The glossary** (Phase 12's, defined here):
- **the solved plan:** what the solver works out for your money, year by year.
- **your current approach:** your plan run by the app's own rules; the yardstick.
- **limits:** what the solver may not change (the locks).
- **a rule of thumb:** the plan's own choices in three lines, shown where following it costs under half a point.

## 9. The phone

**The bottom bar:** the four places, each 44px or more, with labels. No More.

**The top bar's crossover** reads "Classic", with `aria-label="Open the classic planner"`: the full words do not fit
beside the name and the theme control at 390px.

**Your plan is a deck.** It uses the projection's deck (its slide state, the step bar, `useSwipe`, "See all" to
scroll). Six slides, each one screen with no scroll at 390 by 664, with "Back" and "Next: [the next slide]" at the foot:
1. **The answer**, then "Your choices": a one-line summary of the levers ("Dislike of cuts: Low · Estate: standard ·
   Raises: up to 10% · Risk: may change") and "Change", which opens the levers sheet. The explanation is a button under
   the figures ("Why your plan starts below your target"), opening it in a sheet, since its full text does not fit the
   slide.
2. **What you could spend.**
3. **What you would have.**
4. **This year**, then the rule of thumb where shown.
5. **The next ten years**, as a list.
6. **The solved plan against your current approach.**

**The levers sheet** is a full-screen dialog like `SolverSimpleSheet`: a title bar with "Close", Escape closes it, it
stays mounted once opened, and `SolverAims` sits inside. A change solves again only on "Solve again" (section 4.1).

**You and Details** use section tabs. What if stacks its cards.

**The rules:**
- no horizontal page scroll at 390px;
- the answer's amount on one line from 320px (the display size steps down from 40px to 30px below 360px);
- every target 44px or more.

## 10. Accessibility

- Each place is a `<main>` with an `<h1>`. Your plan's h1 is visually hidden ("Your plan"), since the answer card leads.
- The tab strip and the bottom bar are a `nav` with `aria-current` on the place.
- The status strip is a polite live region (`aria-live="polite"`) that announces the state's changes, not each percent.
- The charts are `role="img"` with a sentence each, and "Show the figures" gives each one's table.
- The stale band is announced with the answer: "Before your last change".
- Text is 4.5:1 against its ground in all three themes, the amber band's text included; the harness measures it.

## 11. Tests and harnesses

### 11.1 The new harness: `solver-planner-ui.cjs` (REQUIRED)

It runs against the switch-on preview at the light settings, on a desktop viewport (1,440 by 900) and an iPhone 13. Its
checks:
1. **The places.** Four places in order, each with its `data-place`. None of the classic labels shows (Strategy, Config
   & Assumptions, Audit Data Table, Historical Backtest).
2. **The first solve.** The strip goes idle, then solving with its percentage rising, then simulating, then solved.
   The answer card goes solving, then filling, then done. Its figures equal `data-strategy-figures` (the worker's).
3. **Beside the answer.** On a desktop the levers panel's left edge is right of the answer card's right edge, and its
   top within 40px of the card's top. No line under the dial repeats the answer's figures. "Compare the four settings"
   gives four rows, each on the first 2,000 paths, the plan's own marked, a queued row saying "waiting its turn".
4. **A lever.**
   - A dial change moves `data-solve-key`.
   - The card goes stale with the band and its percentage, the old figures still readable.
   - Then the new answer, with the band gone.
5. **The outlook.**
   - Both charts drawn.
   - Their bands equal `data-outlook-bands` (from the worker).
   - The spending chart's line is the typical run's levels (`data-outlook-typical`), and its first ten years are the
     ten-year table's spending.
   - The back mark sits at the headline's back year.
   - The raise line present when the strategy has a raise that adds to the headline, and absent otherwise: none on a
     plan like S090's, which starts at its raise (L13).
6. **This year, the rule, ten years, the comparison** read as solver-strategy-ui reads them today, with the
   comparison's new title and column.
7. **You.** Seven sections in order, Limits sixth, Your current approach in the seventh.
   - An input change makes the plan stale.
   - A change in Your current approach leaves `data-solve-key` the same, and re-runs the comparison.
8. **What if.**
   - The age card for a working household, and none for a retired one.
   - The target card's five options.
   - The limits card and the scenarios card.
   - Each says its cost before it is asked.
9. **Details.** The solved ledger with its action column; the history check; Assumptions with Display and the solver's
   settings; the docs section.
10. **A couple.** The couples card on three places. "Open the classic planner" shows the classic tabs, and a reload keeps
    them (`rp_planner`).
11. **A failure.** A planted throw shows the failure card with "Try again" and the classic link, and the levers stay
    usable.
12. **The phone.**
    - The bottom bar with four places, each target 44px or more.
    - No horizontal scroll on any place.
    - Nothing solves until "Solve my plan".
    - The six slides, reached by swipe and by the step bar.
    - The levers sheet opens and closes with Escape. A change in it makes the plan stale and waits for "Solve again".
13. **The quick start.**
    - An empty plan shows it.
    - "Work out my plan" waits for the four readiness fields.
    - Filled, it builds the plan (`toFullPlan`) and solves.
14. **The classic planner** under `SOLVER` true fetches none of the solver's chunks.

**Its plants**, each failing exactly its checks, in one run (`results-planner-ui-plants.txt`):
- the levers panel moved under the answer (check 3);
- a fifth place added (check 1);
- the stale band dropped (check 4);
- the outlook's bands a year out (check 5);
- Your current approach's policy moving the key (check 7);
- the couples card removed (check 10);
- the phone solving before the request (check 12);
- a 40px target on the bottom bar (check 12);
- the classic planner importing the solver's chunk (check 14).

### 11.2 The other harnesses

**The switch-on harnesses move to the new places.** Their checks and their `data-*` attributes stay; only how each
reaches its card changes. Each is shown failing on its own plants again.

| harness | in the new planner |
|---|---|
| solver-config | Your plan's levers panel; You's Limits |
| solver-strategy | Your plan |
| solver-projection | Your plan's outlook; What if's dials, limits and scenarios; Details' year by year and history check |
| solver-progress | the status strip |
| solver-isolation | unchanged: it reads the solve, not the layout |

**The classic harnesses in switch-on mode** run against the classic planner. `lib/probes.cjs` sets `rp_planner` to
`'classic'` for every harness that is not a `solver-*` one. In switch-off mode they are unchanged. So tournament,
tradeoffs and priorities can run in both modes, and leave `SWITCH_OFF_ONLY`.

**load-perf and phone-perf** in switch-on mode measure the new planner's first load. The four places' code is fetched
lazily, so the entry stays under D57's 228KB.

### 11.3 The Node tests

`planner-figures.test.mjs`, in the full tier. Joining FAST needs an unlock.
- **The money bands** from the strategy's runs equal the engine's `monteCarlo(…, { collectPaths: true }).bands` on the
  same seed and paths, bit for bit (S116 at the light settings).
- **The spending bands** use summarizeTrials's quantile, over the paths still going. Checked against a hand count on 20
  paths.
- **A split simulation's bands** equal the whole run's, bit for bit (`joinRuns`).
- **The typical run** is `aheadOf`'s path. Its first ten levels are the ten-year rows' spending over their targets.
- **Its plants:** the bands a year out; the arms swapped; a failed path counted after it fails; the typical run taken as
  each year's median.

## 12. Step U: the order, the acceptance and the box

**The order**, each item with its test:

| # | item | its test |
|---|---|---|
| U1 | The two planners: `rp_planner`, `PLANNER_BETA`, `solverOn`, `PLANNER_TABS`, the place map, the crossover; the solver's branches out of the classic tabs | checks 1, 10, 14; the classic harnesses green in both modes |
| U2 | Your plan: the answer card and its states; the explanation; the outlook (`spendBandsOf`, `typicalOf`, `wealthBandsOf`); this year; the rule; ten years; the comparison retitled; "What matters to you" beside it; the print sheet | checks 2 to 6; planner-figures.test.mjs |
| U3 | The status strip (`solveStatus.js`); the phone's request per version | checks 2, 4, 12 |
| U4 | You: the seven sections; Limits; Your current approach, with each control's key test | check 7 |
| U5 | What if: the age card; the target card (new); the limits card; the scenarios | check 8 |
| U6 | Details: year by year, history check, assumptions, how the solver decides, print and export | check 9 |
| U7 | The quick start; the couples card; the failure view | checks 10, 11, 13 |
| U8 | The phone: the bottom bar, the status line, the deck, the levers sheet, the section tabs | check 12 |
| U9 | The words (section 8), two lines of B4's headline among them (L12), once the maintainer adopts them | read by checks 2 to 13 |
| U10 | The harnesses: solver-planner-ui with its plants; the switch-on harnesses moved; the classic ones on the classic planner; load-perf and phone-perf | the gate |

**The acceptance:**
- `bash research/ui-harnesses/run-all.sh 4173 --both` prints ALL REQUIRED GREEN IN BOTH MODES, with solver-planner-ui
  REQUIRED;
- each new check fails on its plant;
- both CI tiers are green on the release head (B1);
- the pull request carries screenshots of the four places, desktop and phone, light and dark, and the states of
  section 4.2;
- a report to the maintainer when it merges: the preview's link and the screenshots. This is a report, not a stop. The
  new planner stays behind `SOLVER`, so no user sees it before Phase 12.

**The box:** four days. Past it, stop and report (CHECKLIST 8).

## 13. What it changes in the launch plan

The launch plan carries these, in section 4 (step U, Phase 11 and Phase 12) and section 0 (the calendar):

**Step U goes after step P and before Phase 11.** After P, because the outlook's paths and the status strip's time
left read P's speeds. Before Phase 11, because the phone is built on the new layout.

**Phase 11, the phone, now on the new planner:**
- the grid by R4;
- the memory, and the solve on the maintainer's phone;
- the phone harness at four times CPU throttle with the bytes recorded, against the new planner.

What it no longer builds: the progress bar (now the status line), the Strategy tab as the deck (now Your plan's deck),
and the locks folded (now You's Limits section).

**Box:** one day, down from two.

**Phase 12, the rollout:**
- **The rename pass:** the tournament's words never reach the new planner. Docs' "How the solver decides" and the
  glossary land in Details.
- **The harnesses:** tournament, tradeoffs and priorities run on the classic planner.
- **The opt-in (B6):**
  - `SOLVER` and `PLANNER_BETA` become true, and `rp_planner` defaults to `'classic'`;
  - "Try the new planner (beta)" in the classic planner's header, and "Classic planner" in the new one's;
  - the gate's two modes become `rp_planner` classic and new.
- **The readiness checklist:** its harness line gains solver-planner-ui. Its line on the opt-in switched both ways
  without losing a plan stands as it is.

**Couples (D5)** become the couples' screens in the new planner, in place of the classic tabs' cards.
