# The third tier step: how to port it and test it (instructions for the agent, 25 Oct)

## The decision this carries out

The maintainer, 25 Oct, after `MISSING-MOVES.md` section 2: "Let's include it."

Record it in STATE.md as the next D-line:

> The third joint tier step down (`tiersBelow: 3`) joins the candidate, beside HR if HR joins (D27 as settled), once the
> factorial below confirms it; if it does not, it comes back to the maintainer.

## What it is

Each year the solver chooses the pension's and the ISA's tier together, on one joint step:
- the plan's tier, or one or two below it, today;
- with this step, three below.

On N4's panel every pension is at High Risk and every ISA at Medium/High Risk. So the new rung is the pension at
Medium/Low (30% equities) and the ISA at Low (10%). The GIA keeps its tier, as today.

What the exploratory runs measured (`MISSING-MOVES.md` section 2; `results-missing-moves.txt` part B: the tuning seed,
45 wealth points, weight 0.02, 3,000 paths, without HR):
- **The panel mean:** +0.548 survival points (se 0.081) and +0.264 in the whole score.
- **By household:** S370 +2.200, S248 +0.533, S330 +0.533; no household loses.
- **A fourth step adds nothing:** S370 +1.800 against +2.200.
- **The solve cost:** about 1.6 times the candidate's, like for like.

## Step 1. The option, off by default

`tiersBelow`: a research option, 2 when unset. Unset, every table and every outcome must stay the same bit for bit.
`scripts/third-step.diff` is the two-line core that the exploratory runs used. The port needs all of the following:

1. **`src/solver/fast.js` `tiersFor`:**
   - read `below` from `m.tiersBelow`, default 2;
   - for a step beyond the second, never step into Cash Equivalents (stop the list at Low Risk). Today's first two
     steps keep their current list, so the default menu is unchanged for plans already at Medium/Low or Low;
   - the third step applies only where both wrappers can take it. Where either cannot (it sits at Medium Risk or below,
     so the stop above cuts its list short), the household's ladder is exactly today's, two below and then the tiers
     above. It must not lose its tiers above, which a list one short of `1 + below` would do. The agent raised this on
     25 Oct, and the maintainer chose this reading. Test it on a household at Medium Risk under `tiersAbove`. The panel's
     households can all take the step.
2. **`src/solver/solve.js`:**
   - beside `tiersAbove`: `if (opts.tiersBelow) m.tiersBelow = opts.tiersBelow`;
   - refuse anything but 2 or 3;
   - add `tiersBelow` to `meta`, so every unit records it and the fair-test diff sees it.
3. **`src/solver/bridge.js` `tablePolicy`:** hand the engine the table's `tiersBelow` (`r.m.tiersBelow || 2`).
4. **`src/App.jsx` `buildContext`, the `tierProfiles` list:**
   - build it with the table's `tiersBelow` (2 with no table), with the same Cash Equivalents stop for a step beyond
     the second;
   - put the tiers above after `1 + below`;
   - rebuild `engine.mjs`.
   - Today a table that names index 3 as Medium/Low hits F2a's name check and throws, which is correct until this is
     done.
5. **No change, but check:**
   - `adaptive.js`: it takes the menu's tiers from the compiled moves;
   - `couple.js`: it builds no tiers;
   - `fair-variables.mjs`: confirm it carries the new key.
6. **The default lives in code (2), not in `PRODUCT_BASELINE`.** The product's own defaults do not move before Phase 4
   (D12).

## Step 2. Its tests

A new `research/tests/tier-steps.test.mjs`, quick and `--full`, joining the fast suite on the maintainer's unlock as
N4's did. Each check is shown failing on its plant (CHECKLIST 5).

1. **Identity, the option unset:**
   - every hash (table, layer, adaptive reference, run) the same as before the edit on S224 and S370, under SHIP and
     CAND;
   - N4's CAND+HR unchanged;
   - then `solver-e3pcls.test.mjs 4 --pin` (D9).
2. **The ladder, with `tiersBelow: 3`:**
   - a High Risk pension reads High, Medium/High, Medium, Medium/Low;
   - a Medium/High ISA reads Medium/High, Medium, Medium/Low, Low;
   - a wrapper at Medium Risk gets no third step (no Cash Equivalents), and its household keeps today's ladder, tiers
     above included (under `tiersAbove`);
   - the engine's `tierProfiles` names match the table's at every index.
3. **The engine and the forward run in step** (V2's state check) on S370 with `tiersBelow: 3`: every slot within a
   pound. Count the years at the new rung, which must be above zero, so the check is not vacuous.
4. **Plants:**
   - the engine's list built with two below while the table has three: must throw or part the state check;
   - the new rung grown at the second rung's rates in `fast.js` only: must part the state check;
   - the Cash Equivalents stop removed, on a Medium Risk wrapper: the ladder check fails;
   - the short list left without its tiers above, on that household under `tiersAbove`: the ladder check fails.
5. **The fast suite passes** before any batch (CHECKLIST 4).

**Acceptance:** all of the above. **Time box:** the build and its tests in four hours.

## Step 3. The factorial (EXPLORATORY, D6)

HR and the third step both help S370, so they are tested together before either joins.

**The run:** `n4-menu.mjs` extended to take an options field per arm, or a sibling script in its form:
- **arms:** CAND, CAND+HR, CAND+T3 (`tiersBelow: 3`), CAND+HR+T3. HR here is HR as D27 settles it.
- **scope:** V3's seven households, both weights, 8,000 paths of seed 7002, 45 wealth points: 56 units.
- **identity at full scale:** CAND and CAND+HR checked bit for bit against N4's units.

**The read** (by N4's bar):
- each arm against CAND;
- CAND+HR+T3 against CAND+HR (the step's own gain, HR in);
- the interaction (HR+T3 less HR less T3 plus CAND).

**The decision rule.** Commit it before launch, in this form. The step joins if CAND+HR+T3 beats CAND+HR beyond N4's
bar at some weight:
- beyond noise: its paired 95% interval above nothing;
- by more than 0.2 on the panel mean, or 0.5 on a household;
- in survival or the whole score;

and loses more than 0.5 beyond noise on no household at either weight. If HR does not join, read CAND+T3 against CAND
the same way.

**The prediction:**
- CAND+T3 against CAND at W0.02 near the exploratory panel mean (+0.55 survival);
- the step's gain with HR in may be smaller on S370, where the two overlap.

**Cost:**
- The T3 arms solve about 1.6 times CAND's. HR+T3 has 800 moves on four tier layers, perhaps 3 times CAND's; that is an
  estimate, so measure it on the first unit.
- Expect most of a day on four cores. Use `RESUME=1` after a stop.

## Step 4. If it passes

1. **`candidate.json`:** gains `"tiersBelow": 3` (and HR as settled). `CANDIDATE_HASH` is re-pinned in
   `candidate.test.mjs`, and STATE.md's candidate block is reprinted by `state.mjs`.
2. **Reviews and docs:**
   - the reviewer reviews the change of default;
   - `HOW-IT-WORKS.md` section 4 states the tier ladder (three steps down, never into cash past the second).
3. **Gate 5:** measured on the final candidate, at 45 points against the product at 30, E2 counted (`batch-gate5.sh`).
   If it fails the 1.25 times limit, it goes to the maintainer with the measured ratio and the E2 parts it would need.
4. **Phase 4** registers on the final candidate, with its no-harm item against SHIP.

## What to report back

- The identity hashes and the planted failures from step 2.
- The factorial's read whole.
- Gate 5's ratio.

Each figure goes in a results file printed by its script.
