# What the phone work suggests for the desktop design

Findings only. **Nothing here has been implemented.** Each item says what was measured, why the phone
work raised it, and what the options look like, so the call is yours.

Measurements were taken against the built site on 2026-09-16 with the same fixture plan every harness
uses (single, 45, retires at 62, £40,000 spend, £320k pension / £90k ISA / £40k GIA / £25k cash). Every
number below came from `getBoundingClientRect` on the live page, not from reading the source. The
scripts are throwaway; the screenshots beside this file are what they produced.

---

## 1. On a laptop, the sandbox has exactly the problem the phone sheet was built to fix

At 1366x768 on step 7, the chart ends at y=638 and the first sandbox control starts at y=1101. The
viewport is 768 tall. The chart and the control you are dragging can never be on screen together: scroll
down far enough to reach a contribution box and the chart it moves has gone off the top.

This is the same fault, at the same step, that the phone bottom sheet was built for - and 1366x768 is
still the commonest laptop screen. It is not a phone problem that happens to also affect laptops; it is
one layout problem that the phone happened to surface first.

Compare `laptop-step7.png` with `phone-step7.png`: the phone shows the chart and four working dials at
once, the laptop shows the chart alone.

Options, roughly in order of effort:

- **Sticky chart card.** Make step 7's chart card `sticky top-0` so it stays put while the controls
  scroll under it. Smallest change; the chart is already its own card.
- **Two columns above 1280px.** Chart left, sandbox controls right, which is what the simple page
  already does and what the deck's own width allows.
- **Quick dials on desktop too.** The phone's four-dial strip sits directly under the chart. Reusing it
  on desktop as a compact row would answer "what if I add £500" without scrolling at all, leaving the
  full panel below for everything else.

## 2. Documentation is a 7,143px scroll on desktop with no folds and no contents list

Phone: 1,790px, eleven headings visible in about two screens, each card folded.
Desktop: 7,143px, zero `<details>`, no way to see what sections exist without scrolling past all of them.

The phone fold was justified by screen size, but the thing it actually fixed - you cannot see the shape
of the reference - is worse on desktop, because the desktop page is four times longer.

Options: reuse `PhoneCollapse` with the cards **open** by default plus a sticky contents rail; or leave
the prose alone and add a plain table of contents at the top. The anchors already exist, since
`goToDoc()` deep-links to each card.

See `desktop-docs-top.png` against `phone-docs.png`.

## 3. The chart is 1,238px wide on a 1,366px laptop, a 1,440px desktop and a 1,920px monitor

The same 1,238px at all three, because `max-w-7xl` caps the container at 1280. On a 1920 monitor that
leaves 682px of empty page beside the thing people came to look at. The phone work went the other way
and gave the chart the whole screen, which measurably improved it - 410px of 412.

This is a deliberate choice worth re-examining rather than a bug: a wider text column would be worse,
but the chart is not text. A wider cap for the chart card alone, or a `2xl:` step up, would suit a
monitor without touching the reading width.

## 4. The deck's own navigation is below the fold on a 1366x768 laptop

Step 5's numbered pills sit at y=839 with a 768px viewport, so they are 71px off the bottom. Step 7's
are at y=757, right on the edge. After reading a step you have to scroll to find the way to the next one.

The bottom nav put navigation permanently within reach on a phone. The desktop equivalent would be
pinning the pill row to the bottom of the deck card, or repeating Next at the top.

## 5. One desktop control is 17px tall, under the WCAG 2.5.8 minimum of 24px

"Comparing wrapper strategies lives on the Strategy tab" is a block-level button measuring 361x17. On a
phone the `.touch-ui` rule lifts it to 44px, so the phone passes this and the desktop does not.

Worth being precise about the scope: 61 desktop controls are under 44px, but 44px is WCAG 2.5.5, which
is AAA and is about touch. The AA requirement is 24px and applies whatever the pointer. Everything else
on desktop clears it. This is one control to fix, not a sweep.

## 6. The simple page's desktop layout needs nothing - but its steppers could borrow from the phone

Form left, chart right, both visible at once: this is the layout the phone had to give up, and on
desktop it is right as it stands. See `desktop-simple.png`.

The one thing worth taking back is the shape of the controls. The portfolio grid's +/- steppers are
stacked 13px pairs on desktop; the phone got side-by-side 44px dials. The side-by-side arrangement is
easier to hit with a mouse too, and costs no extra height in a row that is already 40px tall.

---

## Not a finding, but worth recording

The projection worker was built for phones and helps desktop as well: the same run went from 7.5s to
6.7s unthrottled. That is already shipped for everyone.

Separately, and nothing to do with the phone work: on every chart above, the "Combined (Nominal)" series
drives the y-axis to £40m while every other line sits in the bottom tenth of the plot. It makes the
chart hard to read at any width. Raising it here because it was impossible not to notice while taking
these screenshots, not because the phone work implies anything about it.

---

# What was done, 2026-09-17

All six were implemented. `research/ui-harnesses/desktop-reach-ui.cjs` now guards every one of them at
1366x768, 1920x1080 and on the simple page, so a regression names itself rather than being re-discovered.

| # | Then | Now |
|---|---|---|
| 1 | chart ends y=638, first control y=1101, viewport 768 | chart ends y=530, first dial y=668, 12 dials on screen |
| 2 | 7,143px, no contents | a contents list read off the cards, one entry per card |
| 3 | 1,238px chart on a 1,920px monitor | 1,430px |
| 4 | step 5 pills at y=839, 71px below the fold | y=735, on screen |
| 5 | one control at 361x17 | nothing under 24px on any tab |
| 6 | steppers 13px, stacked | 24x24, side by side |

## One finding was wrong, and it was this write-up's fault

Finding 5 said "one control to fix, not a sweep". That was measured on the Projection tab alone, because
that is the tab the measuring script happened to be sitting on. Running the same probe across all eight
tabs found about a dozen: block-level "read the methodology" buttons at 16 to 18px, a `<details>` summary
at 16px, two range sliders at 16px, and the priority reorder arrows at 18px wide.

The correction changes the fix as well as the count. One control is a className edit; a dozen of the same
kind is a missing floor, so it is now one CSS rule - the same shape as the existing 44px touch rule, at
the 24px that AA asks of every pointer, written as an element selector so any Tailwind class still wins.
The arrows needed a width, which no height rule would have given them.

## How the fixes were built

- **1** The quick dials were already written for the phone sheet. They are the same component, laid out
  across the card rather than down it, with the "All controls" link dropped because on a desktop the full
  panel is the next thing down the page. The chart box also went from 960x420 to 1200x420: the SVG is a
  viewBox scaled to its container, so that is a proportion rather than a pixel count, and it took 108px
  off the rendered height of a plot that was mostly empty vertically.
- **2** The contents is read off the rendered cards rather than kept as a second hand-written list, so a
  new card joins it by itself. It is desktop-only: on a phone the folded headings already do this job.
- **3** One media query above 1536px, letting the chart card alone escape the 1280px cap by 6rem a side.
  6rem rather than the 8rem that would reach the edge, so a 1536px window keeps a 32px gutter.
- **4** `md:sticky md:bottom-0` on the deck's nav row. Desktop only: on a phone the bottom bar already
  owns that strip of screen.
- **6** Minus then plus, side by side, which also fixes the phone, where the 44px touch rule had been
  turning a stacked pair into an 88px block inside a 26px row.
