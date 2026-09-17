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

## One chain across the top, on both planners

The simple page's phone header — the planner you are in on the left, the way to the other one on the
right, 44px — is now the full planner's too.

| | Before | After |
|---|---|---|
| Crossover | a 60px blue banner: "Just want the answer? Open the simple version →" | the bar's right-hand link: "Simple planner →" |
| The app's name | a 79px card on Start Here, under the banner | the bar's left-hand label: "Full planner" |
| Start Here | 1,273px | 1,195px |

The banner said in a sentence what two words say, and the card under it said the app's name a second
time on the one tab that already opens with a paragraph describing the model. A desktop has the width
for the sentence and keeps the banner and the card exactly as they were.

The theme control rides in the bar on the simple page and stays in the More sheet on the full planner,
which is not an inconsistency: the simple page has no More sheet, and the full planner's bar scrolls away
with the page, so a setting parked in it would be unreachable from tab six.

## Long explanations cut to two lines, and a shortcut that moved inside its field

Three changes from one sitting, all phone-only.

**The tournament's "what this is" and each projection step's explanation now show two lines and an
ellipsis, with one button to open the rest.** Both are written for a desktop column and read once; at
390px they stand between the heading and the control on every visit. Nothing is removed — the whole
paragraph stays in the DOM, so find-in-page reaches it and a screen reader reads it in full — and the
desktop keeps the paragraph open, which `sandbox-step` now asserts.

| Paragraph (iPhone 13) | Open | Clamped |
|---|---|---|
| Tournament: "Six wrapper strategies…" | 112px | **32px** |
| Step 1: what the survival rate counts | 107px | **36px** |
| Step 5: what the Monte Carlo chart shows | 179px | **36px** |
| Projection tab, step 1 | page 1,536px | **1,465px** |
| Projection tab, step 5 | page 1,964px | **1,821px** |

Two things this got wrong first time round, both worth keeping written down:

- **The step's one-line subtitle is not the explanation.** The first attempt clamped `slideHead`'s `sub`
  — 30 to 77 characters, one or two lines — which saved nothing and made a whole sentence a button. The
  paragraph people actually re-read is the `text-[11px]` note above each step's Next button, 107 to
  179px of it. The clamp is there now and the subtitle is a plain span again.
- **`line-clamp-2` sets `display:-webkit-box`, so a `block` utility beside it silently turns the clamp
  off.** The markup looked right, the button appeared, and the text was never shortened; only measuring
  the span against its own `scrollHeight` caught it. `phone-ui` now measures exactly that, rather than
  asserting the button exists.

The clamp is spans rather than divs, because each of these is a `<p>`: the clamp has to sit on an
element whose children are text, and a `<div>` inside a `<p>` is invalid markup the browser closes the
paragraph around.

**The tournament's blocked line now says what it found.** "Enter ISA or pension contributions" was shown
to people who had entered contributions — into cash, or a GIA, neither of which the tournament
redistributes — and, since the phone rebuild, to people whose contribution field sits behind the chevron
on a portfolio card. Four cases were reproduced: contributions to a pension or ISA (not blocked, on both
phone and desktop), arriving by crossover from the simple page (not blocked), balances with no
contributions at all (blocked, correctly), and contributions to cash or a GIA only (blocked, and the old
wording was misleading). It now names the figure it found — "your plan pays in £10,000 a year, but none
of it into a pension or an ISA" — and carries a button that lands on Plan Inputs → Portfolio.

**The State Pension "Full" shortcut sits inside the field, against its right edge**, on both planners and
at every width. Beside the field it was a second box of the same size and weight, which made one number
look like two things to fill in, and it cost the phone's control column a quarter of its width.

| | Before | After |
|---|---|---|
| Full planner, phone: control column | 184px — the row's `wide` variant existed for this button | **152px, the same as every other row** |
| Full planner, phone: room to type | the field, less a 44px button and its gap | 98px inside the field; six digits need 55px |
| Simple planner, desktop: field | 148px column, chip beside the input | 148px column, 104px of typing room inside it |
| Chip | 44×44 on a phone, 36–40px wide on a desktop | unchanged, and now the full height of the field |

Two details the measurement forced. The field's right padding is set inline on the simple page, because
`inCls` carries a `sm:px-2` that a plain `pr-*` utility loses to inside the media query — the digits ran
under the chip at every width above 640px until that was found. And the placeholder is set to 13px while
the field itself stays at 16px: "e.g. 12,548" is eleven characters and did not fit the narrowed field,
while the 16px minimum exists to stop a phone browser zooming the page on focus, which a placeholder
never triggers.

`numbers-ui` now measures the field less the chip rather than the input's own width, which after this
change would have counted the pixels underneath the chip, and asserts the chip's right edge sits on the
field's.

## The deck as a numbered list, and a form of one column

**The steps say what they are.** Each step's name has existed since the deck was built, in a `title`
attribute: a tooltip nobody hovers on a desktop and nobody can see at all on a phone. Seven squares
reading 1 to 7 tell you where you are standing and nothing about where you could go.

| | Before | After |
|---|---|---|
| Desktop, 1366 wide | `1 2 3 4 5 6 7` | one row of named pills: `1 Topline · 2 Safe spend · 3 Safe retirement · …`, the sentence on hover |
| Phone, 390 wide | seven 28px squares | a **numbered list**: badge, name, and the first line of what the step does, with a chevron that opens the rest |
| Phone: the list | — | 51px a row, 446px for all seven plus "See all seven at once" |
| Phone: Projection tab, step 5 | 1,821px | 1,903px |
| Phone: step 7, chart bottom vs sheet top | 358 vs 377 | unchanged — the list is below the chart |

Two shapes rather than one because the space is not the same: a desktop already fits the whole deck
across the foot of the card in a single sticky row, where a stack of seven rows would push that row off
the screen. The row body goes to the step; the chevron opens the sentence in place, one at a time.

An intermediate version — the same seven steps as wrapping chips with two-word labels — was built and
rejected: it named the steps but had no room to say what any of them did, which was the point.

**The full planner's fields are the surface colour now, not a grey fill,** matching the simple page. An
outlined field on the page's own ground reads as a space to write in; a filled one reads as a value to
look at. It mattered most under the sepia theme, where `bg-slate-50` resolved to a beige panel a shade
off its own background and a column of them made the form look like a table of read-only figures.

**And the ages lost their steppers.** They were there on the argument that an age moves by one, which is
true, but they cost those rows their alignment: every other control on the tab is one 152px box, and the
two with steppers were a narrower box plus a pair of buttons, so the right edge of the form zig-zagged.
Measured on a Pixel 7, the You tab's controls now share **one right edge** — which is what `phone-ui`
asserts, rather than counting steppers, because a stray one would show up as a second edge.
