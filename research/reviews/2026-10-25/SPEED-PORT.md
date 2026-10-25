# The speed port before gate 5: how to port it and test it (instructions for the agent, 25 Oct)

## The decision this carries out

The maintainer, 25 Oct, after `SPEED-GROUNDWORK.md`, asked whether it was ready to port. This is the port, to carry out
once the maintainer says so. Record the decision in their words in STATE.md, as the next D-line, in this form:

> The speed port (SPEED-PORT.md): the realAt cache and E5 as exact speed-ups; the table without the dealing cost
> (`tableDealing: false`) as a research option that joins the candidate only if step 3's check passes; if it does not,
> it comes back to the maintainer. Gate 5 is measured after.

## What it is

Three changes, in `src/solver/solve.js`. `scripts/speed/e5.patch` is the prototype that was measured, a diff to your
code at 52b0b6c.

1. **The table without the dealing cost** (`tableDealing: false`; research only, off by default):
   - the tier state's backward pass no longer charges a switch's dealing cost (`chargeSwitch`) on the move's position;
   - the chooser (`scoreMoves`, `scoreMovesShared`), the forward run and the engine still charge it when a move is
     taken, as now;
   - the switch charge (0.001 in the score) stays in the table;
   - **it changes the tables:** it joins the candidate only through step 3.
2. **E5, each move's terms once a cell** (exact given 1): with `tableDealing: false`, a move's expectation and terms no
   longer depend on the layer held, so the joint tier state's loop computes them once a cell and world. It then scores
   each layer by adding the switch charge alone: the same arithmetic in the same order, so the same tables bit for bit.
3. **`realAt` keeps each rate vector's logs** (exact): `log(1 + R)` was taken on every call. It is the same double
   taken once. It is on everywhere, the product's path included.

What was measured (`results-speed-groundwork.txt`; this machine, two jobs on two cores):
- the 71% of expectations at a switch's charged position;
- the prototype's results within noise on S370 and S248 (2,000 paths each);
- E5's tables the same as the prototype loop's bit for bit, and its plant caught;
- with all three, the solve 2.7 to 3.0 times as fast as the candidate's, and gate 5 read at about 0.8 to 1.2 on
  S126, S248 and S370.

## Step 1. The port

1. **`solve.js`:**
   - the option `tableDealing` beside `tiersBelow`, refused unless the tier state is on;
   - the backward pass's `chargeSwitch` skipped when it is false;
   - E5's block in the joint tier state's loop, on when the option is false, with `tsOnce: false` to turn it off for the
     test and a test-only plant that drops the switch charge;
   - the `realAt` cache. A `WeakMap` keyed by the rate vector is cleaner than the prototype's property on the move.
2. **`meta`** records `tableDealing` and `tsOnce`, so every unit carries them and the fair-test diff sees them. Check
   `fair-variables.mjs` takes the keys.
3. **The non-joint tier state path** (the tier state without `jointWorlds`): E5 is not built for it. With
   `tableDealing: false` it keeps the layer loop, which is still correct, only slower.
4. **The default lives in code, off**, not in `PRODUCT_BASELINE`; the product does not move before Phase 4 (D12).
5. **Re-pin e3pcls** after the solver change (D9).

## Step 2. Its tests

A new `research/tests/speed-port.test.mjs`, quick and `--full`, joining the fast suite on the maintainer's unlock as
N4's did. Each check is shown failing on its plant (CHECKLIST 5).

1. **Identity, the option unset** (the cache in):
   - every hash (table, layer, adaptive reference, run) the same as before on S224 and S370, under SHIP and CAND;
   - CAND with HR and the third step the same bit for bit as the factorial's units at full scale, so they stand as
     step 3's first arm.
2. **The `realAt` cache:** every table the same with the cache and without, through a test-only switch. Plant: a cache
   keyed on the wrong vector.
3. **E5:** with `tableDealing: false`, every table bit for bit the same with `tsOnce` on and off:
   - on S370, S248 and S224 at 6 points, and S370 at 45;
   - the plant (the switch charge dropped) must part them.
4. **The engine and the forward run in step** (V2's state check) on S370 with `tableDealing: false`: the decision-time
   charge still paid, every slot within a pound, and some years with a switch, so the check is not vacuous.
5. **The fast suite passes** before any batch (CHECKLIST 4).

**Time box:** the port and its tests in four hours.

## Step 3. The check (EXPLORATORY, D6)

**The run:**
- **arms:** CAND+HR+T3 (the factorial's units, if step 2.1 holds) against CAND+HR+T3 with `tableDealing: false`;
- **scope:** V3's seven households, both weights, 8,000 paths of seed 7002, 45 wealth points.

**The decision rule.** Commit it before launch, in this form. The option joins if, at both weights:
- no household loses more than 0.5 points beyond noise (its paired 95% interval below nothing) in survival or the
  whole score;
- and the panel mean's paired 95% interval has its lower end above -0.2 in both.

**The prediction:**
- every household within noise;
- the panel mean within 0.1 either way;
- the solve about a third of the first arm's.

## Step 4. If it passes

1. **`candidate.json`** gains `"tableDealing": false`, with HR and the third step as settled. `CANDIDATE_HASH` is
   re-pinned, the reviewer reviews the change of default, and `HOW-IT-WORKS.md` says the dealing cost is charged when a
   move is taken, not in the table.
2. **Gate 5** on the candidate so settled (`batch-gate5.sh`, 45 points against the product at 30, E2 counted).
3. **Phase 4** registers on the final candidate, with its no-harm item against SHIP.

## What to report back

- The identity hashes and the planted failures from step 2.
- Step 3's read whole.
- Gate 5's ratio on each household.

Each figure goes in a results file printed by its script.
