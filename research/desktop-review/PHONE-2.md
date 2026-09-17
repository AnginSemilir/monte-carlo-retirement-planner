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

## The simple page, split into three tabs

Measured on the Pixel 7 profile (412×839) on 2026-09-17, on the fixture this page is checked against:
52, retiring at 60, spending £40,000, with £350k/£200k/£60k/£40k and the full State Pension.

| | Before | After |
|---|---|---|
| Shape | one column: chart, then form, then figures | three tabs across the foot: Inputs · Chart · Figures |
| Page height | 2,828px, 3.4 screens | 1,347 / 1,161 / 1,344px — one and a half screens each |
| Chart | 486px, pinned to the top of every scroll | 768px on its own tab, nothing pinned |
| First form field | 824px down, under the chart | 349px down, on the first screen |
| The six results | at the bottom of the third screen | a tab away, wherever you are |
| Quick dials | under the chart | above it, in the space the tab opens on |
| Portfolio | a five-column table: a 60px tier drop-down reading "Hig" | four rows, balance at full size, the rest behind a chevron |
| Tier control | `<select>` of six | the same six chips the full planner uses |
| Steppers on the form | on three fields, 24px | none; the chart tab's dials are where a figure is nudged |
| Figures | six cards, two across | six rows, label and meaning left, value right |
| Sideways scroll | 0px | 0px on all three |

Why tabs rather than the sticky card: pinning the chart bought back the feedback an edit needs, and spent
a third of every screen on it permanently to do so. A tab spends nothing between edits, and the four dials
moved into the space above the plot keep the loop — a tap on *Retire at* moves the band and the three
headline figures without scrolling or changing tab.

The default is not fixed: a plan complete enough to answer opens on the Chart, one that is not opens on
Inputs. The choice then lives in `sessionStorage`, so it survives a reload of this visit and not the week.

**Desktop is untouched.** Every branch is behind `isPhone`; at 1400px the page is still the two-column
layout with the chart, its legend and its footnote in the right-hand card, and `desktop-reach` and
`restyle-regression` prove it.
