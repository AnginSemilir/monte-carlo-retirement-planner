# Speed groundwork for gate 5 (EXPLORATORY), 25 Oct

The maintainer, 25 Oct: a time-saving exercise before gate 5, the groundwork first. Every figure is printed in
`results-speed-groundwork.txt` by the scripts in `scripts/speed/`. Timings are from this machine: one core each, two
jobs sharing two cores. Gate 5 is measured on a quiet four-core machine, so read these as a guide.

## The gap

Gate 5 (D11, D26): on each household, the candidate split across four cores (E2) takes at most 1.25 times the product's
solve on one. Here, the candidate is the latest (HR and the third step) at 45 wealth points; the product is at 30. E2X
(6 Oct) measured the split at 3.7 to 4.3 times, so a one-core ratio is read over 4.3 (the best case) to 3.7.

| household | the product (s) | the candidate (s) | one core | four cores |
|---|---|---|---|---|
| S224 | 139.8 | 1403 | 10.03 | 2.33 to 2.71 |
| S248 | 151.3 | 1514 | 10.01 | 2.33 to 2.70 |
| S330 | 144.9 | 1650 | 11.39 | 2.65 to 3.08 |
| S370 | 146.7 | 1671 | 11.39 | 2.65 to 3.08 |
| S380 | 143.1 | 1676 | 11.71 | 2.72 to 3.16 |

The candidate needs to be about 1.9 to 2.5 times faster.

## Where the time goes

- **The profiles** (`node --cpu-prof`, the candidate on S126 and S370): reading next year's tables is 42% of the solve
  (`readValues`, `locInto`, `expit`), the tier state's loop itself 31% to 34%, and growth, flows and the bridge
  reader's reference the rest.
- **The count** (S370 at 6 points): the tier state's loop computes 80.3 million expectations, and 71.4% of them are
  at a switch's charged position.
  - A move that changes tier pays a dealing cost (0.25% of the slice traded, so 0.05% to 0.15% of the pot) before
    its expectation.
  - So it reaches a fractionally different position from each of the four layers it can be scored from, and each is
    integrated afresh. The memo, which merges positions only when they are equal bit for bit, cannot share them.

## The lever: the table without the dealing cost (the prototype)

- **What:** the tier state's table solved as tables were before the tier state: a switch's dealing cost is charged
  only when a move is taken, by the chooser, the forward run and the engine, as now. The switch charge (0.001 in the
  score) stays in the table. One flag, `tableDealing: false` (`scripts/speed/n1.patch`); off, nothing changes.
- **Speed, one core:** S370 1.93 times (1688 s to 872 s) and S248 1.94 times (1528 s to 786 s), each in one process;
  S126 670 s (no clean solve of the candidate to set it against).
- **Results**, on 2,000 paths of the tuning seed, paired:
  - S370: the policy differs at 0.99% of the table's cells; survival -0.050 points (se 0.087; 1 saved, 2 lost), the
    whole score -0.062 (se 0.087);
  - S248: the policy differs at 0.98%; survival -0.150 points (se 0.180; 5 saved, 8 lost), the whole score -0.140
    (se 0.181);
  - both within noise, both a shade down: the panel check below settles it.
- **Gate 5 with it:** S126 1.02 to 1.18, S248 1.21 to 1.40, S370 1.38 to 1.61. Not enough on S370 alone.
- **It is not exact.** It changes the tables, so it changes the candidate: it needs a paired check and the
  maintainer's decision.

## What is left, and the next cut

- **The prototype's profile on S370:**
  - the tier state's loop's own work, 44%;
  - the reads, 24%;
  - the bridge reader's reference, 8%;
  - the flows, 7.5%;
  - `realAt`, 4%.
- **With the dealing cost gone, the loop still works layer by layer.** It looks up every move's expectation once for
  each of the four layers (304.6 million lookups at 6 points, for 23.0 million computed), and checks every failing
  move four times (248.3 million).
- **The next cut, exact given the prototype:** compute each move's terms once a cell and world, then score it for each
  layer by adding the switch charge alone. That is the same arithmetic in the same order, so it gives the prototype's
  tables bit for bit. It should take out most of the loop's 44%: an estimate, not yet measured.
- **`realAt`:** cache its logs per rate vector (the 23 Oct review's idea), about half of its 4%.
- **Together, estimated:** S370 at about 620 s to 650 s on one core, so gate 5 at about 1.0 to 1.2.
- **Not taken:** skipping a switching move's charged expectation when its uncharged score cannot win. That is exact
  only if the tables never value a little less money more, which their log-odds reads in share coordinates do not
  guarantee.

## The second cut, built and measured (the maintainer, 25 Oct: "continue the test here")

`scripts/speed/e5.patch`, on the speed checkout: E5 (each move's terms once a cell and world, with the table without
the dealing cost) and the `realAt` cache.

- **E5 is exact.** Its tables are the same as the prototype loop's, bit for bit:
  - S370 at 4 points: 0 of 3,576,960 values differ; the plant (the switch charge dropped) parts 1,724,934;
  - S224 at 6 points: 0 of 4,782,240 values differ; the plant parts 2,566,024;
  - S370 at 45 points: the same hash (662f328764a48d2e), E5 in 629.4 s against the loop's 881.4 s.
- **The `realAt` cache is exact.** S248 at 6 points: the same hash with the cache and without, for the candidate as it
  stands and for E5.
- **Speed and gate 5,** on one core, against the candidate as it stands:

| household | with E5 (s) | against the candidate | gate 5 over four cores |
|---|---|---|---|
| S126 | 525.4 | (no clean solve to set against) | 0.80 to 0.93 |
| S248 | 500.3 | 3.05 times | 0.77 to 0.89 |
| S370 | 629.4 | 2.68 times | 1.00 to 1.16 |

All three are inside 1.25, S370 by the least.

## For the maintainer

1. **Whether the table may drop the dealing cost.** The check: the latest candidate against the same with
   `tableDealing: false`, on V3's seven households at both weights, 8,000 paths of the tuning seed. The factorial's
   HR+T3 units stand for the first arm if the flag, off, reproduces them bit for bit. The read: no household losing more
   than 0.5 points beyond noise, in survival or the whole score.
2. **Then the exact cuts:** the loop computed once per move, and the cached `realAt`. Each comes with its identity test,
   by the 23 Oct review's rules.
3. **Then gate 5,** measured on the candidate so settled.

`SPEED-PORT.md` turns these into the agent's instructions.
