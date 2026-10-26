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

## The third sweep: the smaller cuts (the maintainer, 25 Oct: "do another sweep", "test all the best candidates")

Every figure here is printed in `results-speed-sweep.txt` by `scripts/speed/assemble-sweep.sh`, except the second cut's
own (its solve of 629.4 s, the product's 146.7 s and its reading of 1.00 to 1.16), which are in
`results-speed-groundwork.txt`.

With E5 and the cache in, the profile (S370, 45 points) left the reads at 34%, the tier state's loop at 27%, the flows at 17%
and the bridge reader's reference at 11%. Inside the loop: scoring each of the four layers took 9%, the memo's hashing and
probing 6%, and each move's lookups of next year's tables 3%. Six cuts, each the same arithmetic in the same order, each
behind its own switch with a planted fault (`scripts/speed/e11.patch`):

- **E6:** the four next-year tables packed side by side for the read.
- **E7:** each move's score across the worlds taken once a cell, for staying and for switching, not once for each layer.
- **E8:** each move's position hashed to an id once a cell, not once a world, and the memo keyed by the id.
- **E9:** next year's tables of each world and layer looked up once a year, not once a move.
- **E10:** the tax gross-up without the list, sort and closures it built on every call.
- **E11:** the bridge reader's split found once a year, not on every read.

### All exact

`bundle-identity.mjs` compares every table value with E5's, for each cut alone and for all five, then for each cut's
plant on top of all five:

| | S224, 6 points (4,782,240 values) | S370, 4 points (3,576,960 values) |
|---|---|---|
| each cut alone, and all five | 0 differ | 0 differ |
| E7's plant (the switching sum taken for staying) | 3,265,573 differ | 2,302,149 |
| E8's plant (ids from the pension alone) | 2,140,403 | 1,494,962 |
| E9's plant (every lookup at layer 0) | 2,194,588 | 1,511,618 |
| E11's plant (world 0's split for every world) | 0: S224's reader builds no table | 128,106 |
| E10, call by call on 200,000 inputs | 0 differ; its plant 52,370 | 0; its plant 54,149 |

- At full size the hashes agree too. E6's tables are E5's at 45 points (S126 and S370), and so are those of every timed
  solve below. E10's product tables are the same at 30 points (S126, S248 and S370). The split with the four in (S370, two
  parts, 45 points) gives the unsplit tables.
- The candidate as it stands is unchanged on this code: S248 at 6 points gives the same hash as before the cuts.
- The memo's own plant (the growth class dropped) changes nothing on either household. Under the tier state the layer
  read fixes the tiers, and neither household has tiers on its GIA. So a test of the memo under E5 needs its world plant,
  which bites: 1,956,322 values on S224 and 1,437,011 on S370, with the four cuts in or out (`memo-plant.mjs`).

### Speed

At 45 points, one process a core, two at a time:

| household | E5 (s) | the four in E5's path: E7, E8, E9, E11 (s) | all five (s) |
|---|---|---|---|
| S126 | 438.7 | 390.1 (11.1% less) | 362.8 (17.3% less) |
| S248 | 485.7 | 409.9 (15.6% less) | 402.2 (17.2% less) |
| S370 | 577.5 | 517.0 (10.5% less) | 509.9 (11.7% less; two solves) |

- **E6 is no faster:** 2.7% slower than E5 on S126 and 1.0% on S370. Dropped.
- **Each cut's share on S370** (all five, then each left out; as a share of E5's solve): E7 5.7%, E11 5.5%, E9 4.3%, E8
  1.9%, E10 1.2%. They overlap, and this machine's noise is a few seconds (the two solves of all five took 507.6 s and
  512.2 s), so read them as a ranking.
- **E10 speeds the product more than the candidate.** The product with and without it, started together on the two
  cores, ran 9.8% faster on S126, 10.0% on S248 and 6.9% on S370, with the same tables. In the candidate it saves about
  1%. So E10 is a gain for the app, but it makes gate 5's ratio worse.

### Gate 5

Each arm is set against the product timed on the same code in the same session. The first port puts the cache on the
product's path too. Over four cores, at E2X's 4.3 to 3.7:

| household | the first port alone (E5 and the cache) | with the four (E10 left out) | with all five, against the product with E10 |
|---|---|---|---|
| S126 | 0.68 to 0.79 | 0.60 to 0.70 | 0.64 to 0.74 |
| S248 | 0.78 to 0.90 | 0.66 to 0.76 | 0.73 to 0.85 |
| S370 | 0.92 to 1.07 | 0.82 to 0.96 | 0.88 to 1.02 |

- **The first port alone reads lower here than the second cut's estimate did** (S370 1.00 to 1.16). That estimate rested
  on one E5 solve of 629.4 s. E5's two later solves took 563.5 s and 577.5 s, while the product's timings agree (146.7 s
  then, 142.6 s and 149.9 s now). So that estimate was about 8% pessimistic.
- **The split keeps its speed-up.** S370 with the four, alone on the machine (e3pcls off in both arms, declared): one
  core 524.5 s, two parts 266.6 s, 1.97 times, with the same tables. If the serial share that implies (1.7%) holds at four
  parts, the four-way speed-up is 3.81, inside E2X's 3.69 to 4.29; at 3.81 S370 reads 0.93 with the four. A two-part check
  of a four-part split is a guide only: gate 5's own measurement decides.

### What is left

The profile with all five (S370, 45 points):
- the reads, 39%: the corner sums 13%, the log-odds 8%, the axis's log 5%;
- the bridge reader's reference, 13% (E2 splits it);
- the flows and growth, 16%;
- the loop, 23%: what the cuts left of their parts takes 1% to 3.4% each (the memo's probe 3.4%, E7's sums 2.7%, the
  layer scoring 2.5%), and copying a position before it grows 2.1%.

No cut of size that keeps the tables bit for bit is left. A further cut would change the numbers: fewer moves or
quadrature nodes, or a coarser grid.

## For the maintainer

1. **Whether the table may drop the dealing cost.** The check: the latest candidate against the same with
   `tableDealing: false`, on V3's seven households at both weights, 8,000 paths of the tuning seed. The factorial's
   HR+T3 units stand for the first arm if the flag, off, reproduces them bit for bit. The read: no household losing more
   than 0.5 points beyond noise, in survival or the whole score.
2. **Then the exact cuts:** the loop computed once per move, and the cached `realAt`. Each comes with its identity test,
   by the 23 Oct review's rules.
3. **Then the smaller cuts,** if wanted: E7, E8, E9 and E11, in E5's path only. They take 10.5% to 15.6% off the solve
   (S370 the least) and put S370's gate 5 at 0.82 to 0.96. E10 is a separate call: it is exact and makes the app's own
   solve 7% to 10% faster, but it speeds the product more than the candidate. With all five, S370's gate 5 reads 0.88 to
   1.02 against the faster product.
4. **Then gate 5,** measured on the candidate so settled.

`SPEED-PORT.md` turns items 1 and 2 into the agent's instructions, and `SPEED-PORT-2.md` item 3.
