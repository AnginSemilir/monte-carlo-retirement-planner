# The savings split while working (D38 (4); AFTER-PHASE4.md section 3): the build

A research option, off by default (`saveSplit: true` in the solve's options). With the option unset nothing changes: no
default, no candidate hash, no number. EXPLORATORY.

**Acceptance test.** `research/tests/save-split.test.mjs` passes, and each check is shown failing on its plant. The fast
suite passes. **Time box.** To 2 Nov 22:00 UK. When the box runs out, stop and report.

## What it does

While the household works, the plan pays fixed contributions into each account every year. With the option on, the
year's move also chooses where the pension and ISA part of that saving goes. Both new choices keep the year's net cost
the same:

| save | the year's pension and ISA saving |
|---|---|
| 0 | as the plan has it (today's contributions, unchanged) |
| 1 | pension first: as much of the net budget as the pension's room takes, grossed up, then the ISA up to its room, the rest taxable |
| 2 | ISA first: the ISA up to its room, then the rest grossed up into the pension up to its room, the rest taxable |

**The net budget** is the net cost of the plan's pension contribution (`netCostOfPensionContrib`) plus the plan's ISA
contribution.
- The gross-up is the app's own `grossUpNet`, which `allocateBudget` already uses.
- For an employee this is salary sacrifice: relief at income tax and employee NIC, plus any employer NIC passed through.
- For the self-employed it is relief at source: income tax only, and no pass-through.
- With the salary blank it uses the app's assumed rate.

The plan's taxable-account and cash contributions are kept as they are. Money that fits neither wrapper goes to the
taxable account at its net amount, as `allocateBudget` cascades it.

**The rooms.**
- The pension's room is this year's annual allowance, without carry-forward:
  - tapered on relevant earnings, or the MPAA where it applies;
  - capped at relevant earnings, or £3,600 with none (as `wrapperHeadroomAtYear`, carry-forward aside);
  - less what the plan's dated deposits and staged transfers claim in that year (the claim ledger);
  - never below the plan's own contribution.
- The ISA's room is the allowance less those claims and less the plan's cash ISA subscription (so the cash ISA keeps
  its shelter), and never below the plan's own contribution.

**No memory needed.** The choice acts on the year's contributions only, so the table needs no memory of it. Carry-forward
is left out of the room for the same reason: an earlier year's choice may have used the unused allowance it counts.

**Scope.**
- In the engine each working owner gets the chosen variant.
- The solver is the single-person one; a couple's plan keeps the app's rules (D42).
- The option is refused together with the windfall split, since the two rooms would be counted twice.

## Where it lives

- The engine (`src/App.jsx`):
  - `buildContext` puts `ctx.saveSplitAt(t)` on the context. It is a memoised closure over the claim ledger, computed
    only when asked, so the app's own runs pay nothing.
  - `stepYear` step 2 takes the chosen variant's contributions when the year's move carries `save` above 0. The couple's
    working take-home reads the same amounts.
- The exact model (`model.js` step 2) and the forward run (`fast.js`) do the same.
  - `compile` reads each variant by pot and year, only when the menu has save copies.
  - In `flow`, a move's `save` swaps them in, in a working year only.
- The menu (`solve.js` `buildActions`): two save copies of every move, only for a household with a year to choose.
  - Outside such a year a copy flows exactly as its base move, and comes after it in the list.
  - The loops and the chooser skip the copies there, the windfall split's mechanism (`splitCounts`, `movesAt`).
- The bridge carries `save` to the engine. The audit code shows it (`s1`, `s2`).

## The tests (`save-split.test.mjs`)

1. **Off.** With the option unset, the tables, 40 runs and the run record are the same to the bit as on the code before
   it. This is checked on two saving households and one already retired.
2. **The gross-up against a hand calculation.**
   - An employee, a higher-rate employee whose pension room binds, a self-employed owner and a blank salary.
   - Each variant's net cost equals the plan's to a penny. Each amount is within its room.
   - Plant: the ISA's amount taken gross (the pension's net cost not used) fails the check.
3. **In step.** The engine and the forward run stay in step, slot by slot, every year, with each variant forced in the
   working years.
   - The variants must be live: the pots differ between save 1 and save 2.
   - Plant: the engine handed the move without its `save`. The two must part.
4. **On.** A household with no year to choose (retired, or saving nothing into either wrapper) gets the menu and tables as
   off. A saving household's menu is three times as long and its tables differ. `meta.saveSplit` records which.
5. **The skip.** The copies left out outside the working years change no table and no run.
6. **The refusals.** Asked together with the windfall split, or with a value other than `true`, the solve throws.

## The run, after the build (brought to the maintainer before it runs)

Phase 4's working households with pension or ISA contributions, CANDD against CANDS (the split on). Seed 7002, 8,000
paths, the estate weight 0.02, 45 points, EXPLORATORY. Reported, deciding nothing:
- survival paired by path;
- lifetime spending;
- the estate;
- the variant chosen by year;
- the pots at retirement.

The cost comes from the first pair's times, measured before it is brought.
