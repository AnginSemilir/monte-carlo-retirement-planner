# QA findings — 18 September 2026

Phase 2 of the QA pass: measurements only, nothing changed on `main`. Every probe is under
`research/qa/` and reruns with one command; every number below came out of one of them.

**Severity:** *high* = a user can lose their work or see a blank page · *medium* = wrong or misleading
in a way people will hit · *low* = worth fixing, nobody is blocked · *pass* = checked and fine.
**Size:** S = under an hour · M = a morning · L = a day or more.

## Status after phase 3 (same day)

Implemented on `main` in the order below; every number re-measured with the same probe that found it.

| # | Done | Measured after |
|---|---|---|
| R1 | Error boundary (`src/boundary.jsx`) around the app shell, each planner and the active tab; four unguarded result reads guarded | The fuzz's crash mechanism cannot blank the page: the fallback names the error and offers *Try again* / *Reload* |
| R2 | `sanitiseSimple` keeps only fields of the saved shape; scenario list must be an array | The corrupt simple save loads; storage probe 10/10 |
| A2 | Caption token `--slate-400` darkened per theme; `--amber-700` darkened (light, sepia); harness bar raised to WCAG's 4.5:1 for small text | axe colour-contrast: 0 nodes in light, dark and sepia (was 393) |
| A1 | `FieldRow` associates label and control (`useId`); 19 selects and 2 inputs carry `aria-label` | axe `label` / `select-name`: 0 (was 63) |
| A3 | Glossary terms render plain inside phone summaries (`TermPlain` context) | axe `nested-interactive`: 0 (was 6) |
| A4 | Every `overflow-x-auto` region is focusable | axe `scrollable-region-focusable`: 0; **axe reports 0 violations on all 33 screen/theme/device combinations** |
| P1 | The simple page's five curves run in a second instance of `simWorker.js` (latest-wins coalescing); two duplicate calls and an unused context build removed; first draw stays synchronous | Spending-field keystroke: desktop **125ms → 29ms**, phone at 4× CPU **349ms to paint + 565ms of long tasks → 23ms, 0 long tasks**; first line on screen 165ms after navigation |
| C4 | Simple page figures use the full planner's `formatGBP` | Both planners follow the Config number-format setting |
| E1 | `src/ui.js`: one field class, one tier short-name list, one tier-label parser; 14 ad-hoc field strings in App.jsx replaced | The five duplicated helpers are three fewer; steppers and tiles were already gone |
| R4 | The run records the plan it ran against; the deck head says *Your inputs changed since this run* when they differ | Probe: absent after a run, shown after an edit, gone once re-run |
| C5 | Documentation tab's tournament paragraph describes the swept budget | — |
| E4 | `run-all.sh` prints every failing line; the five inheritance harnesses are skipped (not "failed") while `SHOW_INHERITANCE` is off | Suite output names the failing assertion rather than the last fifteen lines |
| P2 | Documentation tab is a `React.lazy` chunk (`src/Docs.jsx`); the copy editor's manifest, hot reload and apply script scan both files | First chunk **724,883 → 673,390 bytes raw (215.2KB → 200.5KB gzipped, −7%)**; docs chunk 74.9KB fetched only when the tab opens; worker chunks byte-identical |

**Left as found:** C2/C3 (engine answers on inverted ages; a year-one failure is permanent) and E2 (42
cosmetic lint warnings). Both are low and neither was in the order above; C2/C3 is an engine-behaviour
decision worth its own conversation rather than a QA fix. The Inheritance tab's 1,336 lines still ship
switched off: making them lazy means moving a tab with 60 handlers into its own module, which is a
refactor, not a QA fix.

## Summary

| # | Area | Finding | Severity | Size |
|---|---|---|---|---|
| R1 | Robustness | No error boundary: one null in a render blanks the whole app. Fuzz hit it once (`null.trials`) | high | S |
| R2 | Robustness | A corrupted simple-page save crashes the simple planner on load, blank, no recovery | high | S |
| A1 | Accessibility | 36 selects and 27 inputs with no accessible name (labels not associated) | high | M |
| A2 | Accessibility | 393 contrast failures, one root cause: `text-slate-400` on captions at 10–12px | medium | S |
| P1 | Performance | Simple page: 125ms long task per keystroke on desktop, 565ms at 4× phone — seven projections on the main thread | medium | M |
| C4 | Correctness | Simple page figures ignore the number-format setting its own inputs follow | medium | S |
| R4 | Robustness | Editing inputs after a run leaves the old projection on screen with no "out of date" mark | medium | S |
| A3 | Accessibility | Glossary `?` buttons inside `<summary>` headings: nested interactive controls ×6 | medium | S |
| A4 | Accessibility | Three horizontally scrolling tables unreachable by keyboard | low | S |
| P2 | Performance | 699KB single chunk; App.jsx is 62% of it; inheritance code ships switched off; docs tab eager | low | M |
| E1 | Code health | Five duplicated presentational helpers between the two planners, two of which caused bugs this week | low | M |
| E4 | Harnesses | Five optional harnesses permanently red; copy-coupled selectors; runner-drift thresholds; failure output truncated | low | S |
| C5 | Docs | Documentation tab still describes the pre-sweep tournament budget | low | S |
| C2/C3 | Correctness | Engine answers confidently on inverted ages; a year-one failure is permanent even if the pot recovers | low | S |
| E2 | Code health | 42 lint warnings, all cosmetic | low | S |

Passed outright: engine properties (70/70), tax against HMRC 2025/26, worker/main-thread equivalence,
storage corruption on the full planner (10/10), quota exhaustion, JSON import validation and injection,
scenario-name injection, concurrency (leave mid-run, Stop, double start), memory across 320 tab
switches, lint errors (0), dead exports (0).

---

## 1. Engine correctness — `research/qa/engine-props.mjs`

**70 of 70 pass.** What was checked, because it had not been before:

- **Tournament budget parity** across eleven households — single and couple, employed and
  self-employed, blank salary, phased pension schedule, GIA-only saver, a 52-year-old with a ten-year
  bridge, a £70,000 contribution over the annual allowance, a £300,000 earner with a tapered allowance,
  proportional and balanced splits. Every entrant's take-home outlay is within 1% of Current Plan's on
  all eleven. This is the property yesterday's GIA/cash sweep could have broken and had only been checked
  on one plan.
- **Monotonicity** on 1,500 paths: spending £20k→£80k gives 98.9 > 92.5 > 82.5 > 73.3 > 65.1 > 49.8;
  retiring 55→68 gives 63.9 < 72.8 < 82.5 < 88.9 < 92.8; a bigger pension never lowers survival.
- **Determinism**: same seed, same survival to the digit (82.125 / 82.125); different seed, different
  draw; a 400-path run is a prefix of the 800-path run, which is what the safe-spend solver's contract
  depends on.
- **Tax against HMRC 2025/26**: rUK income tax at nine incomes from £12,570 to £200,000 including the
  personal-allowance taper, all within £1; Class 1 and Class 4 NIC at four incomes; Scotland's six-band
  ladder at four incomes; relief rates 42% (employee, £70k), 40% (self-employed, £70k), 28% (£30k).
- **Hostile input**: blanks, strings, negatives, 1e12, unknown risk tiers, negative tax rates, junk
  shapes to `normalizePlan` — nothing throws, every rate is finite and in range.

Two things that pass the probe and are still worth a look:

- **C2 (low, S).** Inverted ages get a confident answer rather than a refusal: terminal age 55 with
  retirement at 62 reports 100% survival (the plan never reaches retirement); retirement at 50 with a
  current age of 60 is treated as already retired. The warnings banner covers blanks; check it covers
  these, and if not, add two lines.
- **C3 (low, S).** Age 17, retiring at 18, to 120: survival 0% with a median pot of £23.6m. A path that
  cannot meet spending in year one is failed for good even though the pot recovers. That is
  `FAIL_TOLERANCE`'s documented semantics, but the pairing of 0% and £23.6m reads as a bug to anyone who
  sees it. Worth a sentence in the docs, or a warning when the first year fails on the expected path.

## 2. Robustness — `fuzz-ui.cjs`, `storage-ui.cjs`

**R1 — no error boundary (high, S).** 2,400 random actions over two seeds, four configurations. Seed
20260918, full planner on the phone, action 246: `Cannot read properties of null (reading 'trials')`
as an uncaught render error, after which every check for the rest of the run found an empty `#root`. The
exact sequence does not replay (the DOM the fuzz sees depends on which asynchronous run had finished),
but the code has exactly four reads of `.trials` on something that can be null — `simResult.trials` at
App.jsx 11573 and 11777, `safeMaxResult.stats.trials` at 11457, `safeRetireResult.stats.trials` at
11517 — and every cancelled worker question resolves `null` by design. Two fixes, both wanted: an error
boundary per tab so a render error shows a message and a "reset this tab" button instead of white, and
`?.` on those four reads. Seed 7 ran 1,200 actions clean, which says how rare it is, not that it is fine.

**R2 — corrupted simple-page save (high, S).** `rp_simple_v1` holding `{"oneOffs":5,...}` crashes the
simple planner on load with `f.oneOffs.map is not a function`: blank page, and reloading does not help
because the bad save is still there. `Simple.jsx` `load()` spreads the parsed JSON straight over the
blank state with no shape check. The full planner's `normalizePlan` survived all ten corruption cases
(non-JSON, a number, an array, accounts as a string, a 2MB scenario name, scenarios as an object, garbage
theme / number format / app selector, a stale key); the simple page needs the same five lines.

**R4 — stale results after an edit (medium, S).** Run the projection, change a balance on Plan Inputs,
return to Projection: the deck still shows the old figures and nothing says so. The safe-spend and
retirement-age answers there now describe a plan that no longer exists. The sandbox's "Rerun
projections" card is the mechanism; what is missing is the flag — a line at the top of the deck reading
"Inputs changed since this ran" with the rerun button beside it.

Passed: import refuses a text file, a JSON array and a plan-less object (via `alert`, which Playwright
auto-dismisses — a non-modal message would be friendlier, low); a plan carrying `<img onerror>` in a
field is applied and rendered as text; a scenario named `<b>bold</b><img onerror>` shows as its literal
text; worker and main thread (`?forceMain=1`) give 81.4% both ways; leaving mid-run, Stop, and a double
start all settle cleanly; a full localStorage does not crash typing. Heap: 4.5MB → 5.0MB over 320 tab
switches with GC forced, so nothing leaks per switch. There is no versioned migration — the key is fixed
at `rp_plan_full_v28` and `normalizePlan` handles shape — which is fine as long as it stays fixed.

## 3. Accessibility — `axe-ui.cjs`, `contrast-ui.cjs`

Sixty axe runs: eight tabs × two widths × three themes on the full planner, three tabs on the simple
page. Five rules fail; four of them are one fix each.

**A1 — controls with no accessible name (high, M).** 36 `<select>` and 27 `<input>` nodes.
The selects: the scenario picker, the four risk-tier selects in the desktop portfolio table, and Config's
decumulation policy, drawdown strategy and harvest selects — none has a `<label for>` or `aria-label`.
The inputs: the phone's `FieldRow` renders a `<label>` beside each input without `htmlFor`/`id`, so the
association is visual only; the desktop grids do the same. A screen reader announces "edit text" with no
name for every one of them. Fix: `useId()` in `FieldRow` and an `aria-label` on each select — mechanical,
but there are 63 of them.

**A2 — contrast (medium, S).** 393 nodes across 45 screens, and grouping them by colour pair shows one
cause: `text-slate-400` used for caption text at 10–12px. Light #7C8695 on white is 3.68:1, on the
slate-50 ground 3.4:1; sepia #8C795D is 3.82 / 3.4; dark #76808E on #171B21 is 4.31. All need 4.5:1 at
those sizes. The existing harness checks 3:1, which is the large-text bar, so it passed. The fix is one
token: captions to `text-slate-500` (#646D7D light, 4.49 on slate-100 — take it one step darker still on
the slate-100 ground), or lift caption sizes to 14px+ where the layout allows. One more pair: the
`text-onaccent/80` "based on my priorities" caption on the accent button, 4.28:1.

**A3 — nested interactive (medium, S).** `PhoneCollapse` folds a card behind `<summary>` whose first
child is the heading; since Wednesday the heading's glossary term carries a `?` button, so there is a
button inside a summary — six screens. Either render the term without its `?` inside a summary (a prop
on `Term`) or move the `?` out of the heading.

**A4 — scrollable regions (low, S).** Three `overflow-x-auto` tables (audit, comparison, portfolio) have
no `tabindex="0"`, so a keyboard user cannot scroll them.

## 4. Performance — `latency-ui.cjs`, bundle map

**P1 — the simple page's keystroke cost (medium, M).**

| | Full planner, money field | Simple planner, spending field |
|---|---|---|
| Desktop 1× | 13ms to paint, no long task | 125ms to paint, one 118ms long task |
| Phone at 4× CPU | 20ms, no long task | **349ms to paint, 565ms of long tasks (worst 288ms)** |

The engine timings explain it: `quantileCurve` is 20.8ms a call, and every edit on the simple page runs
seven of them on the main thread — three for the chart's band and four I added on Wednesday so the
Figures tab could quote both bands at once. That is 88ms of arithmetic before React renders, at 1×.
`simulateDeterministic` itself is 0.2ms; the cost is inside `quantileCurve` (it rebuilds a context and
solves per quantile). Fixes in order of payoff: run the seven in `simWorker.js` like the Monte Carlo
already is; only compute the four figure-curves when the Figures tab is showing; memo them on the plan
hash rather than on every keystroke. The full planner's 13ms is the target.

**P2 — the bundle (low, M).** 699KB decoded, 214KB gzipped, one chunk. By source: App.jsx 433KB (62%),
react-dom 174KB (25%), lucide icons 14KB, d3 pieces 18KB, everything else under 10KB each. Inside App.jsx
the inheritance/estate engine and the Inheritance tab ship while `SHOW_INHERITANCE = false`, and the
Documentation tab (400 lines of prose from line 13236) and Historical Backtest load eagerly. A
`React.lazy` per tab would take Documentation, Backtest, Audit and the estate code off the first load —
the load-perf harness's byte count is the assertion that would show the gain. Monte Carlo at 5,000 paths
is 779ms in the worker and the tournament preview 24ms: fine.

## 5. Efficiency and code health

**E1 — duplication between the planners (low, M).** Each pair below is the same idea written twice, and
the first two produced bugs this week (grey fields under sepia; tiers without equity ranges):

| Helper | Full planner | Simple planner |
|---|---|---|
| Input field classes | `inputCls`, `smallInputCls`, plus 14 ad-hoc `bg-slate-50 border border-slate-300` strings the "clear fields" change did not reach (desktop portfolio table, scenario bar, Config) | `inCls`, `subCls` |
| Risk-tier labels | matrix `label` split on `:` | `RISK_SHORT` + `RISK_EQUITY` regex over the same labels |
| Money formatting | `formatGBP` via `fmtNum` (honours the Config convention) | `GBP` via `Intl` (**ignores it** — C4) |
| Steppers | deleted Wednesday | its own `stepper()` |
| Figure tiles | inline tile markup ×5 | `figure()` |

One `src/ui.js` holding the field class, the tier label, and a money formatter that takes the convention
would remove all five. **C4 (medium, S)** falls out of it: under the European format the simple page's
inputs show `40.000` and its figures `£40,000`.

**E2 — lint (low, S).** `oxlint`: 0 errors, 42 warnings — 14 unused catch parameters, 25
`no-useless-fallback-in-spread`, one `new Array(n)`, one unused `play`.

**E3 — dead code.** 133 exports on `E`; every one is used by another source file, a worker, a test or a
research script. Nothing to remove.

**E4 — harness health (low, S).**
- Five optional harnesses (beneficiary-inputs, estate-assets, estate-deck, estate-optimiser, inheritance)
  fail on every run behind `SHOW_INHERITANCE=false`. Either gate them on the flag so they are skipped
  rather than red, or delete them until the tab returns.
- Selectors coupled to visible copy: phone-ui 17, sandbox-step 7, tradeoffs 7, priorities 12. Two broke
  on Wednesday when a `?` landed inside a heading. `data-*` hooks are the fix, as the deck's pills now have.
- `load-perf`'s time ceiling drifts with the runner (raised to 2,600 with both measurements recorded);
  the byte count is the reliable assertion.
- `run-all.sh` prints only the last 15 lines of a failing harness, which hid the real failure twice this
  week and cost a rerun each time. Print every `FAIL` line, then the tail.

**C5 — docs drift (low, S).** The Documentation tab's tournament card says "the same annual take-home
budget between S&S ISAs and pensions" and "1. Equal net budget … each strategy costs the same take-home
pay"; since Thursday the budget also sweeps GIA and cash contributions and the strategies stop those
flows. One sentence to add.

## 6. Security and privacy (light)

No `innerHTML` or `dangerouslySetInnerHTML` anywhere; imported and saved strings render as text (tested
with `<img onerror>` in a plan field and a scenario name); the load-perf harness sees two script/style
requests plus fonts and nothing else. Not checked: a Content-Security-Policy header (the site is static
hosting; worth adding at the host if it allows).

## What I would do first

1. **R1 + R2** — error boundary per tab, `?.` on the four reads, shape-check the simple page's save. Two
   hours, and they are the two ways a user currently loses the page.
2. **A2** — the caption token. One change, 393 nodes.
3. **A1** — labels. Mechanical, a morning.
4. **P1** — move the simple page's seven curves off the main thread and stop computing four of them when
   the Figures tab is not showing. The phone number is the one to fix.
5. **C4 + E1** — one shared formatter and field class, which also fixes the number-format inconsistency.
6. **R4, A3, A4, C5, E4** — an afternoon between them.
7. **P2** — lazy tabs, when the rest is in.
