# Step L: the levers (the build note)

The launch plan of 1 Nov, section 4 (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at
0e24e1b), adopted as D51 to D54. Between Phase 8 and Phase 9. Everything here sits behind `const SOLVER = false`; with the
switch off the app computes as before. One pull request to `main` at the end, from a release branch cut at the gate's
commit, merged on B1's gate.

**Acceptance.** L1 to L3 pass with their plants; L4 and L5 read FAIR; the fast tier and the gate are green in both modes.
**Time box.** The build: one day, to 2 Nov 18:00 UK. L4 and L5 then run at low priority (about 13.1 and 5.3 core-hours),
and their reads go to the maintainer as reports; R1 to R3 (D52) decide them.

## L1. The floor (B2)

`src/solverSettings.js` `prepareForSolve` sets `spending.floorSpend` to `APP_FLOOR` (80%) of the target, rounded as
`phase4-panel.mjs` rounds it, where the plan's floor is 0. The engine that runs the solved plan reads the same prepared
plan; "your plan" under the app's rules keeps its own. The Config tab states it (`data-solver-floor`): "In a bad year the
plan may spend as little as 80% of your target; it never plans below that." A change of default in the app's solve, so the
`reviewer` checks it.

**Test:** `research/tests/solver-floor.test.mjs` (the fast tier, `FAST_JOINING`): the library's 210 singles prepare with the
floor set; prepared twice is once; "your plan" keeps 0; a plan's own floor is kept; on S126 the run record's `spendLevels`
include 0.8; the key moves with the floor; targets of 20001 and 20004 prepare with 16001 and 16003 (the rounding: a
truncation gives 16000, `Math.ceil` 16004). Planted: the plan prepared as before L1 gives `[1, 1.1]` and fails.

**The review (1 Nov, `reviews/2026-11-01-L1-floor.md`): FAIL, one BLOCKING finding.** The floor code does what B2 says
(the prepared plan identical to `audit-7uf.mjs`'s on 210 of 210 singles; twice is once on all 420; position 1 the
candidate unchanged), but `solver-app.test.mjs` check 2, in FAST and so protected, compares `solveForApp` (now with the
floor) against `solvePlan(candidatePlan(plan))` on S126 without one: `[1, 1.1, 0.95, 0.9, 0.8]` against `[1, 1.1]`. The fix,
to the maintainer for an unlock (D53: a later edit to a protected test asks again): build check 2's reference on the plan
with the floor at `Math.round(0.8 x target)`, as `solver-progress.test.mjs` does, the app side on the plan without one, so
the check pins both the app's preparation and position 1 against the research's own solve. Step L is not committed until
then. MINORs: (2) the rounding untested, fixed above; (3) the harness's kept fields now include `spending.floorSpend`, so
the prepared floor written back into the saved plan fails it; (4) a plan's own floor is kept whatever its level, as B2
rules, so one at or above the target solves with the no-cut menu; no screen sets a floor, so only an imported plan can
carry one (recorded); (5) for Phase 9: Phase 4's arm A ran the app's rules with the floor at `80%` under its guardrails,
while "your plan" in the app keeps no floor, so the in-app comparison is not the one behind A1 (Phase 9 says so).

**The re-review (1 Nov, `reviews/2026-11-01-L1-floor-rereview.md`): PASS.** Check 2 fixed on the maintainer's unlock of
1 Nov: its reference on the plan with the floor at `Math.round(0.8 x target)` (JSON-identical to `audit-7uf.mjs`'s
preparation on 210 of 210 singles), its menu asserted to hold 0.8, and the app's side on the library's raw plan, so the
whole preparation is compared (the re-review's MINOR 3); the app before L1 differs from the reference in 1,678,878 values.
The re-review's MINORs 1 and 2 folded in: a target of 20004 prepares with 16003 (`Math.ceil` gives 16004), and the harness
compares the saved floor with the household's own, as a floor written back on load would be in both of its reads.

## L2. The dial's positions (B3, D54) and the two-entry store

- `aimsOptions` maps positions 3, 6 and 10 to lambda times the position, the layer loop (`tsOnce: false`) and, under B3a,
  `ageWeight: { mode: 90, disp: 9 }`. `APP_DIAL_VARIANT` is 'B3a' until R1 decides on L4's read.
- `solveForApp` solves a position on its base (`dialBase`: the same plan at position 1, every other aim the same):
  `lockTiers` on the base's solve with the base's own decision on the tier above. Where the base has no tier state (consent
  withdrawn, a ceiling that leaves one pair) there is no lock; lambda and the weights still apply.
- The key (`solveKey`) adds the variant and the lock above position 1; position 1's key is as before, and the base's key is
  the position's with the dial at 1.
- The worker (`src/solverWorker.js`) restores or solves the base first and holds it, then solves the position on it. A
  split position's parts each restore the base from one copy in shared memory (`shareRecord`).
- The store (`src/solverCache.js`) keeps two solves, the base and the latest position, within 600 MB (two solves of S370 are
  530 MB), the least recently used evicted first and never the base a position is stored beside. A solve that cannot fit
  is not stored, and the Config tab's solve line says so ("It is not kept on this device ...").

**Tests:** `lock-split.test.mjs` (the fast tier): the position solved whole is locked to its base and differs from the same
lambda unlocked; split two and three ways, each part restoring the base, every array the same bit for bit; planted, a part
without the base's tier state differs. `solve-store.test.mjs` (the full tier): the store's rule, then the store itself on an
in-memory IndexedDB: both entries kept, the oldest evicted, never the base; planted, a budget below the record and a full
quota each a clean miss with its reason, and a rule that forgets the base is seen. `solver-aims.test.mjs`: the dial at 3 is
the locked solve on its base, given explicitly.

## L3. The lever matrix

`research/tests/lever-matrix.mjs`: an all-pairs design over the household (S002 retired, S126 a bridge), the dial's four
positions, the variant, the estate, raises, consent, the minimum pot and the three locks: 14 combinations covering every
pair. Each solves without a throw; on 100 engine paths the lock holds at every decision where there is a tier state,
consent withdrawn keeps the plan's own tiers, raises blocked stay at or under target, and each lock holds; the run record
carries the variant's age weights (none at position 1), the floor's 0.8, and a base keyed as the position at the dial at 1
with the position's estate weight. `lever-matrix.test.mjs` (the fast tier): the design's coverage, four combinations (the
dial at 1, 3, 6 and 10), and the plants: the lock dropped, the age weights dropped, the base at the other estate weight, the
floor at 0. `lever-matrix-full.test.mjs` (the full tier): all 14.

## L4. The four positions, both variants (EXPLORATORY, seed 7002)

`audit-levers.mjs`, `batch-levers.sh`, `reduce-levers.mjs`: CANDD and the positions 3, 6, 10 under B3a and B3b on the
review's eight households, 45 points, the floor at 80%, 4,000 paths, one code, one stamp; a unit is a household and a
variant (the base solved once for its three positions). Reported: survival, the retirees' first year, years 1 to 5, years
1 to 5 at the floor, the equity at years 1, 5, 10 and 20, the estate. R1 picks the variant; R2's direction check settles the
positions. `reduce-levers.mjs --planted` reads five planted cases as planted.

## L5. One-off costs on singles (EXPLORATORY, seed 7002)

`audit-costs.mjs`, `batch-costs.sh`, `reduce-costs.mjs`: the eight households, a cost of 10% or 30% of the opening wealth in
the third or tenth retired year (32 cells), CANDD against arm A as D36 set it (the lookahead at 5 years as the app ships
it), paired on 3,000 paths; survival and the cost year's tax. R3: a cell losing survival beyond noise (exact, one-sided,
Holm over 32, 5%) brings M12's remedy and a second run. `reduce-costs.mjs --planted` reads five planted cases as planted.

The read (1 Nov, `results-costs.txt`): fair; by R3 no cell loses survival beyond noise, so plans with a one-off cost run the
candidate under the switch and M12's remedy is not built. The `reviewer` at the read: PASS (`reviews/2026-11-01-read-L5.md`),
its MINORs reported to the maintainer: the cost year's tax (a lead, not a cause: the audit records no draws by account),
S368's early cells uninformative (the cost before pension access sinks it under either policy), and no `runPolicy` check;
a second run of `audit-costs.mjs` records the cost year's draws by account and runs `runPolicy` beside the engine.

## Batches and the gate

Each unit runs through `research/solver/run-unit.sh`: at low priority (`nice -n 19`), waiting while the gate's pause file
is there, marked running until it ends. `research/ui-harnesses/run-all.sh` writes the pause file, waits for the units in
flight, and removes it when it ends.
