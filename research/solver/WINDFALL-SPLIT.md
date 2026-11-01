# The windfall split (D37; AFTER-PHASE4.md section 1): the build

A research option, off by default (`windfallSplit: true` in the solve's options). It changes no default, no candidate
hash and no number with the option unset. EXPLORATORY.

**Acceptance test.** `research/tests/windfall-split.test.mjs` passes, each check shown failing on its plant. The fast
suite passes. **Time box.** One day's build, to 1 Nov 22:00 UK. When the box runs out, stop and report.

## What it does

The plan today routes each Auto deposit once, in `buildContext`, by the policy's deposit order. The first wrapper with
room takes what fits, the rest goes to the taxable account, and later transfers move it on where the plan names a staged
wrapper. With the option on, the year's move also chooses where that year's Auto money lands:

| split | the year's Auto money goes |
|---|---|
| 0 | as the plan routes it (today's routing, unchanged) |
| 1 | the pension up to its room this year, then the ISA up to its allowance, the rest taxable |
| 2 | the ISA up to its allowance, the rest taxable |
| 3 | all taxable |

"Room" is what the plan's claim ledger leaves this year once every other deposit, transfer and scheduled contribution
has claimed. The Auto deposits' own claims for that year do not count. The pension's room is this year's own, with no
carry-forward beyond what the ledger already gives.

**Later years are as the plan has them.** Transfers the plan scheduled out of the taxable account in later years still
run, whatever the split. They are capped by what the account holds, as they are today. So the split acts in the deposit
year only, and the table needs no memory of it. All 17 windfall households on Phase 4's panel park their overflow in the
taxable account (`stagedTargetWrapper` "Other Investments"), so they have no later transfers at all.

## Where it lives

- The engine (`src/App.jsx`):
  - `buildContext` marks the plan's entries for Auto deposits (`auto: true`) and computes `ctx.autoSplit`: by year, the
    entries for splits 1 to 3.
  - `stepYear` step 1 skips the marked entries and applies the chosen split's when the year's move carries `windfall` above 0.
  - Unchanged when the move carries no split.
- The forward run (`fast.js`) and the exact model (`model.js`) do the same.
  - `compile` reads the plan's Auto amounts and the split entries by pot and year.
  - A move's `windfall` swaps them in, in the deposit year only.
- The menu (`solve.js` `buildActions`): with the option on, and only for a household with an Auto deposit, every move
  gets three split copies.
  - In a year with no Auto deposit, the copies flow exactly as their base move. They come after it in the list, so a tie
    goes to the base.
  - The loops skip the copies in those years, so the solve costs more only in deposit years.
- The bridge: the move handed to the engine carries `windfall`.
- The audit row: the split's code.

## The tests (`windfall-split.test.mjs`)

1. Option unset, the tables the same to the bit as before (two windfall households and one without a deposit).
2. Each split's routing against a hand calculation: pension room, ISA allowance, a deposit larger than both, and one
   smaller than the room.
3. The engine and the forward run in step through every split (the state check's lockstep, each split forced in the
   deposit year).
   - Plant: the engine ignoring the split. The two must part.
4. The option on: a household with no Auto deposit gets the product's menu, move for move.
   - A windfall household's tables differ from the option off.
   - `meta` records the option.
5. The copies are skipped outside deposit years: the same tables with the skip on and off.

## The run, after the build (brought to the maintainer before it runs)

The panel's 17 windfall households, the candidate without the split (CANDD) and with it (CANDW). Seed 7002, 8,000 paths,
the estate weight 0.02, 45 points, EXPLORATORY.
- Scripts: `audit-windfall.mjs`, `reduce-windfall.mjs` (its gate and read, checked on synthetic units by `--planted`) and
  `batch-windfall.sh`, launched through `run-from-snapshot.sh` with `PREDICTION="none:..."`.
- Reported, deciding nothing, per household and over the panel:
  - survival, paired by path;
  - lifetime spending delivered;
  - the estate;
  - the split CANDW chose in the deposit year;
  - the pots the year after.

**Cost.** Taken from the tier test's CAND units (`results/tiers`: 40 households at 8,000 paths, 0.115 core-hours of solve
and 0.163 of engine a household), with CANDW's solve 1.26 times CANDD's (the smoke on S026 and S090 at 4 points):
- 34 units, about 10 core-hours;
- 2.5 to 3 hours on four cores.

The first pair's times are checked against this, and a cost more than a quarter over comes back first.

**The smoke** (4 points, 200 paths, S026 and S090; not a record):
- CANDW chose the pension, then the ISA, on all 200 of S026's paths and 193 of S090's.
- runPolicy and the engine agreed on all 800 paths.
