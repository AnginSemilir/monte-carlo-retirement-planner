# The windfall split on today's candidate, read (18 Nov): A GAIN AND A HARM, both small and in spending alone

EXPLORATORY, seed 7002, deciding nothing (B7 in D51; D129; `B7-FACTORIALS.md` and its two amendments, committed before it
ran; `WINDFALL-SPLIT.md`; the read whole in `results-windfall.txt`).

## In plain words

The windfall split lets the year's move choose where that year's one-off windfall lands:
- where the plan routes it;
- the pension up to its room, then the ISA;
- the ISA alone;
- all of it taxable.

Without the split, the plan's own routing decides. This run solved Phase 4's 17 households with a dated windfall twice,
with and without the split (CANDW, CANDD), on today's candidate, on the same 4,000 simulated markets. Every household took
the candidate's own menu, the solve on anchors.

**What it found:**
- **Survival does not move beyond noise:** `+0.012` points over the panel (se `0.0136`). No household's change is beyond
  noise after Holm.
- **Spending moves a little, both ways.** By the rule's verdict (`b7-verdict.mjs`), **A GAIN AND A HARM**:
  - the panel's lifetime spending is down `0.010%` (se `0.0013`);
  - S026 spends `0.306%` less (se `0.0131`), while its survival is `+0.200` (11 paths saved, 3 lost);
  - five households spend a little more: S050 `+0.047%`, S326F `+0.043%`, S314F `+0.011%`, S346F `+0.011%` and S358F
    `+0.008%`.
- **What the split chose** in the deposit year, on 1,000 paths each: the pension then the ISA on 85% to 100% of paths on
  twelve households. On the other five it mostly chose the ISA alone (S338F, S346F, S358F) or kept most of it taxable
  (S306F, S310F).
- **The estate** is lower on the panel by `£4,242` a path (se `1,519`).
- **The checks:** the gate fair (one code and audit stamp, every household in both arms on the same plan); `runPolicy`
  beside the engine on 34,000 paths, none differing.
- **The cost:** CANDW's solves `0.33` core-hours against CANDD's `0.36`, and the engine `3.88`.

## What it leads to (B7)

A harm goes to the maintainer at once, with every effect beside it; nothing changes in the candidate or the app on any
outcome.
- **The harm** is in spending: the panel's `-0.010%`, and S026's `-0.306%`, which it trades for `+0.200` points of
  survival.
- **The gains** are in spending on five households, each under a twentieth of a percent.
- **The agent's reading:** this is a trade on one household and noise-sized spending everywhere else. Nothing here asks
  for a registered test (v2). The agent recommends closing the windfall split as measured.
