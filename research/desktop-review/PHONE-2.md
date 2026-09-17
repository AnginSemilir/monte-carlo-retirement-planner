# The second phone pass, measured

Both measurements are on the Pixel 7 profile (412×839) unless stated. The "before" figures were taken
on 2026-09-17 before any of this work; the "after" figures on the same day at the end of it. The
screenshots beside this file (`phone2-*.png`) are what the numbers describe.

## The Inputs tab

| | Before | After |
|---|---|---|
| Tab height | 4,379px, one column of everything | 1,029–1,578px per section, six sections as tabs |
| First plan field, top | 1,015px | 431px, on the first screen of both profiles (664px iPhone 13 included) |
| Title card | 366px | 79px |
| Scenario bar | 186px, three rows | 54px, one row |
| Crossover button | ~170px, two lines | 44px |
| Money banner | four lines | one sentence |
| "Your figures came with you" | shown after every crossing | removed |
| Portfolio | a sideways-scrolling table, risk tier a 410px select off the right edge | one card per wrapper, tier as a row that opens six chips |
| Native selects with 6 options | 4 | 0 |
| Labels on You | above a half-width field | left of the control, seven of seven |
| Steppers | none | on every age |
| Long helpers visible on You | 7, 1,305 characters | behind seven "?" buttons |
| Band / income / deposit / cost items | a card of open fields each | one 46px line each until tapped |
| Controls under 44px | 0 | 0 |
| Swipe between sections | none | both directions; not from a select, a slider, a sideways scroller or the tab row |

## The projection deck

| | Before | After |
|---|---|---|
| Swipe between steps | none | left is next, right is back, only once there is a run and not in See-all |
| Position | the pills at the foot of the card | plus a dot strip under the step head |
| A swipe from the horizon slider | — | leaves the step alone |
| A drag on the sandbox sheet | — | leaves the step alone |
| The band animation on step 5 | — | not restarted by a swipe (currentTime monotonic across it) |

## Two browser behaviours worth knowing about

1. **Chrome on Android turns a rightward drag into "go back".** The first right-swipe on the deck left
   the site: the document became `about:blank` and the next assertion found no page. `touch-action:
   pan-y` stops a pan; it does not stop a navigation. `overscroll-behavior-x: none` on the document does,
   and leaves vertical pull-to-refresh alone. The harness now asserts the page is still there after a
   right-swipe, which is the assertion that would have caught this.
2. **A scroll container is where `touch-action` stops being inherited.** The chart wrapper was
   `overflow-x: auto`, so the deck's `pan-y` never reached the chart and Chromium cancelled a horizontal
   drag across it as a scroll attempt, delivering `pointercancel` instead of `pointerup`. On a phone the
   chart bleeds to the full width and has nothing to scroll, so the scroll container is desktop-only.

## Not done, and why

- **Advanced** still shows its per-field helper text, about 760 characters. Each is one or two lines
  under an unusual field, and folding each behind a 44px "?" would add more height than it saves. It is
  the one section whose fields need their explanations beside them.
- The **simple page** reports 7px of horizontal overflow on the Pixel 7 profile. No element measures
  wider than the viewport, which points at the bleed chart's negative margins. It predates this pass and
  is not asserted anywhere yet; worth a look on its own.
- The desktop is untouched apart from the two copy cuts you asked for, on purpose. Whether the row form
  belongs there too is a separate, measured decision.


## The simple page: three tabs, and nothing below the fold

Measured on 2026-09-17 on both profiles, on the fixture this page is checked against: 52, retiring at 60,
spending £40,000, with £350k/£200k/£60k/£40k and the full State Pension.

| | Before | After |
|---|---|---|
| Shape | one scrolling column: chart, form, figures | an app screen: bar, one tab, tab bar |
| Document scroll | 2,828px of page, 3.4 screens | **0px** — nothing scrolls, on either profile |
| Pane overflow | — | 0px on all three tabs at 390×664 and 412×839 |
| Chart | 486px, pinned to the top of every scroll | 215px on its own tab, nothing pinned |
| First form field | 824px down, under the chart | on the first screen |
| The six results | at the bottom of the third screen | a tab away, wherever you are |
| Page header | "Can I retire?" plus a three-button theme group, 100px | one 44px bar: the page's name, the theme, the way across |
| Form | one column of everything | three sections — You · Portfolio · One-offs & income |
| Portfolio | a five-column table, the tier a 60px drop-down reading "Hig" | four rows, balance at full size, the rest behind a chevron |
| Figures | six cards, two across | six rows; the prose behind one fold, the export still on the page |
| Sideways scroll | 0px | 0px |

### How it fits

664px is the number everything is built against — the iPhone 13 profile, the smaller of the two. Minus the
44px bar and the 56px tab bar, a pane has **563px**, and each one is composed to land inside it:

- **Chart**: four dials (96), the verdict (44), the two toggles on one row (44), the plot (215), a legend
  on one row, and the footnote folded behind "What the band shows".
- **Inputs**: the scenario row and the section strip, then one section — You is six fields and the taper,
  Portfolio is four rows, One-offs & income is the two lists.
- **Figures**: the two toggles, six rows at 52px, the export button, and one fold holding the lifetime
  tax, how the money is drawn, the target paragraph and the beta notice.

The pane is still `overflow-y-auto`, as a safety net for a plan with eight portfolio rows or a dozen
one-offs. It is not the plan: `phone-ui` asserts `scrollHeight === clientHeight` for every pane on both
profiles, so a pane that outgrows its screen fails the suite rather than quietly starting to scroll.

### What moved, and where it went

- The **page title** is gone. "Simple planner" beside "Full planner" in the bar says the same thing in
  the space of a line.
- The **theme** is one button that cycles light → dark → sepia, in the bar. Three 44px buttons was a
  tenth of the screen spent on a setting most people change once.
- The **footer's beta notice** moved into the Figures fold, beside the numbers it qualifies: a page that
  is one fixed screen has no foot to put it at.
- The **quick dials** sit above the plot, so the feedback loop the sticky card existed for survives
  without the sticky card: a tap on *Retire at* moves the band and the three headline figures.

**Desktop is untouched.** Every branch is behind `isPhone`; at 1400px the page is still the two-column
layout with the chart, its legend and its footnote in the right-hand card, the full theme group in the
header and the footer where it was. `desktop-reach` and `restyle-regression` prove it.

## The full planner: less scroll, and the small print said once

Measured on the iPhone 13 profile (390×664), which is the smaller of the two and what everything here is
sized against. Screens = the tab's `scrollHeight` over the viewport.

| Tab | Before | After |
|---|---|---|
| Start Here | 2,386px · 3.6 screens | 1,273px · **1.9** |
| Plan Inputs | 1,240px · 1.9 | 1,111px · **1.7** |
| Config & Assumptions | 3,506px · 5.3 | 1,114px · **1.7** |
| Projection | 904px · 1.4 | 774px · **1.2** |
| Strategy | 1,128px · 1.7 | 998px · **1.5** |
| Historical Backtest | 2,000px · 3.0 | 1,533px · **2.3** |
| Audit Data Table | 2,843px · 4.3 | 951px · **1.4** |
| Documentation | 1,410px · 2.1 | 1,280px · **1.9** |
| **All eight** | **15,417px** | **8,034px** |

`phone-ui` now carries a ceiling per tab, with about 15% of headroom over what each measures today, so a
tab that grows past its screen budget fails the suite rather than quietly getting longer.

### What did it

- **The footer is gone from the phone build.** One line of small print repeating under all eight tabs on
  the screen with the least room. The full planner says it once, on Start Here, where the sentence now
  carries what the footer carried; the simple page says it beside its figures. The desktop keeps it.
- **Config folds.** Three of its four cards already folded on the grounds that they are reference data; the
  fourth stayed open because it is the tab's one real decision. On a phone that reasoning inverts — open,
  it was 1,290px sitting on top of the three folded ones, so the decision was no easier to find for being
  first. Now Config is four headings and the decision is one tap in, like the rest of them. The playbook
  inside it (ten numbered steps, 1,015px) starts shut on a phone and open on a desktop.
- **The audit table scrolls in its own box.** Fifty years of ledger was 2,160px of *page*: the tab's head
  scrolled away and the column names with it. Capped at 60% of the screen with its own scroll and a stuck
  header, the tab is one screen and the table is still all there.
- **Start Here is a contents page, not a prospectus.** Each of the eight tab cards had a paragraph — 925px
  of reading before the first tab was reached. One line each on a phone, the paragraph kept for the
  desktop; the wheel shrinks from 176px to 96px; the coverage note folds behind its heading.
- **Backtest**: the three figure tiles go three across rather than stacked.

### Where scrolling stayed

Backtest at 2.3 screens holds a chart, an era picker and a verdict; Documentation at 1.9 is a directory of
eleven folded sections; Start Here at 1.9 explains the other seven tabs. Each is a page whose content is
the length, not chrome around it. The rest are between 1.2 and 1.7.
