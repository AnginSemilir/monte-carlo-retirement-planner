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
│  (just me) (+ partner)  │   Can you afford it?              │
│  What you have          │   ┌─────────────────────────────┐ │
│  pension    [        ]  │   │                             │ │
│  ISA        [        ]  │   │      the one chart          │ │
│  GIA        [        ]  │   │                             │ │
│  cash       [        ]  │   └─────────────────────────────┘ │
│                         │   [ expected ] [ full range ]     │
│  Age        [  ] to [ ] │                                   │
│  Spend/yr   [        ]  │   Survives 94% of the time        │
│  Tax     [rUK      ▾]   │   Safe spend  £41,250             │
│  + one-off money        │   Retire from  59                 │
│    in or out            │   all at the 90% target           │
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
| The survival-rate selector | Fixed at 90% and stated in words - see Decisions |
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

**Three figures, always on screen.** All three are quoted at the fixed 90% target, stated in words rather
than offered as a control.

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

`src/Simple.jsx`, a sibling of `App.jsx`, sharing the engine by import rather than by copy. One entry
point mounts both, with `<AppSwitch />` at the top of each crossing to the other. Explicitly NOT a fork
of `App.jsx` - the moment the two diverge by copy-paste, every future fix has to be made twice and will
not be.

The separability constraint is a rule about imports: `Simple.jsx` may import from the engine and the
plan adapter, and from nothing else in `App.jsx`. Worth enforcing with a lint rule rather than a comment,
because it is the kind of boundary that erodes one convenient import at a time.

Plan state is its own small shape - about a dozen fields - normalised up into the engine's full plan
via one adapter function. That keeps the simple page from inheriting sixty fields it does not use, while
still handing the engine exactly what it expects.

## Decisions

These were the open questions. All four are settled.

**Couples are supported, behind a toggle.** One switch at the top of the input panel: *just me* /
*me and a partner*. On *just me* the partner fields are not rendered at all, so the default page is the
simple one; flipping the toggle adds a second age, a second retirement age and a second column of
wrappers, and every headline figure becomes the joint one. The engine already handles both - `isCouple`
is a plan field, not a code path - so this costs input layout rather than model work.

**The target survival rate is fixed, not exposed.** Both solved figures need *some* target, and offering
the slider invites tuning the number until the answer is the one you wanted, which is the failure mode
this page exists to avoid. It is fixed and stated in words beside the figures - "the most you could spend
and still come through 90% of futures" - so the reader knows what they are being shown without being
handed a dial. The full app keeps its four-way selector for anyone who wants to move it.

**One entrance, with a link between the two.** Both apps ship behind a single entry point, with a
prominent link at the top of each to cross over: *"Need the full model?"* one way, *"Just the answer"*
the other. That keeps testing to one URL while both are being worked on.

It is built so the two can be split later, which is a constraint on the code rather than a decision to
defer. Concretely: no shared component reaches across from one to the other, the crossing link is a
single `<AppSwitch />` with the destination as a prop, and the only shared imports are the engine and
the plan adapter. Separating them then means deleting that one component and pointing two builds at the
same engine, rather than untangling a page.

**Tax region: one select, defaulting to rUK.** Scotland's bands change the safe spend by thousands on a
typical plan, which is more than several of the inputs the page already asks for. Ignoring it would make
the page quietly wrong for a tenth of its users; a three-option select costs one row.

## Open questions

None outstanding. The shape above is the thing to build.

## What I would check before calling it done

- The three headline figures agree with the full app on the same inputs, to the pound and the tenth of a
  point. If the streamlined page disagrees with the app it was derived from, one of them is wrong.
- The chart flip keeps one scale, so the two views are comparable rather than merely adjacent.
- It holds at 400px wide, since a page this simple will be opened on a phone - with the partner toggle
  on, where the input panel is at its widest.
- Switching to Scotland moves the safe spend, rather than silently doing nothing.
- Typing in any field updates the expected view without a visible stall.
