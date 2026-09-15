# A streamlined, single-page version

Queued, not started. This is the plan, for review before anyone writes code.

## What it is

One page. You put in what you have, what you want to spend, and when you want to stop. It answers,
without being asked twice, and without a single configuration decision.

The existing app is eight tabs, a five-slide deck, a tournament, sixty-odd config fields and six ranked
priorities. All of it earns its place for somebody. None of it earns its place for somebody who wants to
know whether they can retire.

## The shape of the page

Everything visible at once, no tabs and no deck. Roughly:

```
┌─────────────────────────────────────────────────────────────┐
│  What you have          │   Can you afford it?              │
│  pension    [        ]  │   ┌─────────────────────────────┐ │
│  ISA        [        ]  │   │                             │ │
│  GIA        [        ]  │   │      the one chart          │ │
│  cash       [        ]  │   │                             │ │
│                         │   └─────────────────────────────┘ │
│  Age        [  ] to [ ] │   [ expected ] [ full range ]     │
│  Spend/yr   [        ]  │                                   │
│                         │   Survives 94% of the time        │
│  + one-off money        │   Safe spend  £41,250             │
│    in or out            │   Retire from  59                 │
└─────────────────────────────────────────────────────────────┘
```

Left is entry, right is answer, and the answer updates as you type. No Run button, no wizard.

## What gets cut

| Cut | Why it can go |
|---|---|
| Tabs and the slide deck | One page is the point |
| Advanced config | Every field defaults to the current tax year and cannot be edited here |
| Salary, contributions, employment, self-employment | "Doesn't check current income" - the pot is what it is today |
| The strategy tournament | Contribution-splitting is meaningless with no contributions |
| Ranked priorities and the balanced mode | Replaced by one automatic choice - see below |
| Scenario save/load, comparison overlays | A single page compares by being re-typed |
| The Inheritance tab | Its own job; out of scope unless asked |

## What stays, and how

**One chart that flips.** Same axes, same bands, same colours - what changes is where the bands come
from. The toggle is the only chart control.

- **Expected** - the deterministic path with the percentile bands drawn off the return assumptions
  (`quantileCurve`), which is instant and updates on every keystroke.
- **Full range** - the same picture drawn from the Monte Carlo fan (`monteCarlo` with `collectPaths`),
  which takes a second or two and is therefore debounced and explicitly asked for.

They already share a scale in the current app's side-by-side slide, which is what makes flipping between
them legible rather than confusing. Reuse that.

**The policy is chosen, not asked.** Run `buildPolicyCandidates` once on a short sweep and apply the
winner silently. The priority study measured what the ranking is worth: on 420 households the order
changes the recommendation for the large majority, but the *default* order is a perfectly respectable
answer everywhere. A streamlined page should take that answer and say which one it picked in a line of
text, with no control attached.

**Three figures, always on screen.**

- **Survival rate** at the spend entered
- **Safe spend** - the most that clears the target, from `optimizeSpend`
- **Safe retirement age** - the earliest stop that clears it, from `safeRetirementAge`

Each is one number and one line of plain English. The three answer "is this plan all right", "how much
could I spend", and "how soon could I go" - which is the whole of what most people came for.

## One-off money

The one input complexity worth keeping, because a house sale, an inheritance or a new roof genuinely
changes the answer and nothing else in the model can express it.

A single list. Each row: **date, amount, in or out**. That is all - no wrapper choice, no owner, no
category. Destination is decided by the same `suggestOneOffDestination` the full app uses, and withdrawals
come out through the chosen policy's cost order. One row type covers deposits, withdrawals, and a lump of
income, which is why it is one list rather than three.

## Engine reuse

Nothing new is needed. Everything here already exists and is tested:

| Need | Existing |
|---|---|
| The projection | `simulateDeterministic`, `buildContext` |
| Expected bands | `quantileCurve`, `BAND_QUANTILES` |
| Monte Carlo fan | `monteCarlo({ collectPaths: true })` |
| Safe spend | `optimizeSpend` |
| Safe retirement age | `safeRetirementAge` |
| Automatic policy | `buildPolicyCandidates`, `explainPick` |
| One-off routing | `suggestOneOffDestination`, `AUTO_DEPOSIT` |

So this is a new **front end over the same engine**, not a new model. That matters: it inherits 1,100-odd
assertions rather than needing its own, and any engine fix reaches both.

## Build shape

`src/Simple.jsx`, a sibling of `App.jsx`, sharing the engine by import rather than by copy. A route or a
build flag decides which mounts. Explicitly NOT a fork of `App.jsx` - the moment the two diverge by
copy-paste, every future fix has to be made twice and will not be.

Plan state is its own small shape - about a dozen fields - normalised up into the engine's full plan
via one adapter function. That keeps the simple page from inheriting sixty fields it does not use, while
still handing the engine exactly what it expects.

## Open questions

1. **Couples.** The simplest thing is single-person only. Supporting a couple roughly doubles the input
   panel and every figure becomes a joint one. My instinct is single-only for v1, with a line saying so.
2. **Target survival rate.** It has to be *some* number to compute safe spend and safe retirement age.
   Fix it at 90% and state it, or expose the one slider? Fixing it is more streamlined; exposing it is
   the single most consequential number on the page.
3. **Does it replace the full app or sit beside it?** Changes whether this is a route, a separate build,
   or the new front door with the current app behind an "advanced" link.
4. **Tax region.** rUK by default; Scotland changes the answer materially. One select, or ignore?

## What I would check before calling it done

- The three headline figures agree with the full app on the same inputs, to the pound and the tenth of a
  point. If the streamlined page disagrees with the app it was derived from, one of them is wrong.
- The chart flip keeps one scale, so the two views are comparable rather than merely adjacent.
- It holds at 400px wide, since a page this simple will be opened on a phone.
- Typing in any field updates the expected view without a visible stall.
