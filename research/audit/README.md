# The property sweep

`invariants.mjs` checks things that must be true of **every** plan, on hundreds of randomly generated
households, rather than checking answers worked out by hand for a handful of them.

```
node research/audit/invariants.mjs [estateCases] [optimiserCases] [simulationCases] [safeSpendCases]
node research/audit/invariants.mjs 400 40 20 12      # the standard sweep
```

It is deterministic: a fixed seed, so "case 137" is the same household every time and a failure can be
reproduced by its number. Exit code 1 on any failure, so it can gate a build.

## Why it exists

Every modelling bug found in this engine so far has been of a shape the unit tests could not catch,
because each unit test asks "is this answer right?" and the bugs were in the *relationships between*
answers:

- a metric measured on two different bases (an effective rate dividing what the heirs receive by the
  taxable estate, which are different numbers whenever a pension sits outside the estate — it produced
  rates below zero);
- money that vanished between two totals (a gift counted as leaving the estate but never as reaching
  the heirs, which made every gift score as a loss and no candidate involving one could ever win);
- the same money relieved twice (a compensation award given away *and* still disregarded at death);
- a search that walked away from a better answer it had already priced (coordinate descent committing
  to the best withdrawal order, then ending below a solo candidate measured earlier).

None of those would fail a hand-worked example. All of them fail a property.

## What is checked

**The projection** — no wrapper goes negative, the wrappers add to the reported total, every year is
finite, tax is never negative.

**The estate** — tax, income tax and net are never negative; reliefs never exceed the bill; bands stay
inside their maxima; the effective rate is a rate; and *conservation*: what the heirs receive plus every
tax charged on it adds back to what was there.

**The search** — never returns something worse than it started with; the quoted gain is the difference
it quotes; no lever is worth less than nothing or more than all of them together; the ranking is ordered
and the winner tops it; rebuilding the winning plan exactly as the Apply button does reproduces the
figure quoted, to the pound; a plan that survived before still survives after; and the same input twice
gives the same answer.

**The tax engine** — income tax never falls as income rises, never exceeds the income, is zero inside
the personal allowance; grossing a contribution up inverts its net cost, including through the
personal-allowance taper where the marginal rate is 60%; an inherited pension is never taxed above its
own value, and a longer draw-down never costs more.

**The simulation** — percentiles in order, survival rate a rate, the same seed reproducing, spending more
never surviving better, and more money never surviving worse.

**The safe spend** — never negative, never below the rate it was solved for (with two points of slack for
sampling), and spending more than it says always doing worse.

**The backtest** — every start year in the record runs the whole plan without throwing, without a
negative wrapper, and a failure always names the year it failed.

# Timing

`timing.mjs` times the model's hot paths on a real 32-year plan with three heirs, and
`node research/audit/timing.mjs` reprints them. Measured in this container:

| | |
|---|---|
| `buildContext` | 0.45 ms |
| `simulateDeterministic` | 0.13 ms |
| `estateAtDeath` | 0.03 ms |
| `bestPensionSplit` (3 heirs, exhaustive in 5% steps) | 2.9 ms |
| `suggestGift` (runs inside the Inheritance memo) | 0.7 ms |
| `optimizeInheritance` (~60 projections) | 30 ms |
| `monteCarlo`, 5,000 trials — the app default | 461 ms |
| `optimizeSpend`, the safe-spend solver | 831 ms |

The two long ones are the two the app already runs asynchronously behind a progress bar. Everything a
keystroke can trigger is under 3 ms.

## In the browser, on the production build

| | |
|---|---|
| first paint of the tab bar | 273 ms |
| switching tabs | 66–77 ms |
| editing a field on the Inheritance tab (the heaviest memo) | 43–50 ms |
| editing a field on Plan Inputs (control) | 52 ms |
| the estate optimiser, click to result | 96 ms |

An edit on the Inheritance tab is no slower than one anywhere else, so the searching that tab does per
keystroke is not what a user waits for.

**One finding, fixed.** First paint was **12,754 ms** when the Google Fonts stylesheet did not answer:
a plain `<link rel="stylesheet">` is render-blocking, so the whole app stayed blank until the request
timed out. Loading it with `media="print"` and flipping to `all` on load drops that to **273 ms** with
the request stalled indefinitely, and the fonts still apply normally when the network is healthy
(verified: the link's media attribute flips and its rules reach the document). Anyone on hotel wifi was
watching a blank screen for twelve seconds.
