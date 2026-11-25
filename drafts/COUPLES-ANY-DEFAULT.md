# COUPLES-ANY's change of default: a draft (24 Nov, night)

This is a draft, written while the registered test runs on seed 7027. It is not applied to the branch and decides nothing. No
outcome of seed 7027 was read to write it. `couples-any-default.patch` beside this note holds it, made from the scratch tree
`/home/user/couples-default-draft` (local branch `draft/couples-any-default`, from 5ca1495c).

It opens a class only by its own change of default, after that class's registered read, the reviewer on the change, and the
maintainer's unlock of the tests that pin it (COUPLES-ANY.md, "Outcomes"). L opens only with R. C (`noretire`) is the
maintainer's to decide. As drafted it takes R, L and P (`risks`, `limits`, `salaries`). A class that fails is dropped from
the patch's lists before it is built.

## What it changes

- **The shapes.** `src/solverSettings.js` `APP_COUPLE.takeShapes` gains `risks`, `limits` and `salaries`, which the page's
  cut and assembly take (`src/solverCouple.js`). The guard reads the same as taken (`src/couplesSwitch.js` `HOUSEHOLD_TAKES`;
  `householdShapeOf`).
  - `limits` counts as taken only with `risks` (`limitsTaken`), since L's units carry R's way.
  - So a couple with one of these shapes goes on the household route: inside the guard before D143, where today's two-table
    route took it, and outside it where its class is open, where the app's rules took it.
- **The rollback.** The plant `beforeany` puts back the guard before this change, with only step 4's three shapes taken.
  - The page sets it from a harness build's `PLANNER_PLANT` (`src/App.jsx`).
  - `cutbeforeany` does the same for the cut; the coverage line's `beforeany` and the limits card's `beforeanycard` for the
    words and the card.
- **The words.** These are the agent's drafts and the maintainer's to change.
  - The coverage line names only the shapes still refused (as drafted, nobody retiring within the plan).
  - The household sentence's example becomes a shape still refused. With none left, the clause goes.
  - Under `beforeany` both lines are today's, byte for byte, on either swap setting.
- **The limits card.** With `limits` taken, every couple the solver runs gets a row per person. A per-person edit no longer
  switches an opened couple off (`src/limitsCard.js`).

## What it was checked on, light, during the run

All of this ran at the lowest priority, so the registered run kept its cores.

- **`couple-shape.test.mjs`: ALL PASS, 4 checks.**
  - The guard and the page's cut agree on every library couple and planted shape, the new ones included. No refusal was
    missed and none over-reached.
  - Check 3 now covers only `noretire`.
- **`household-client.test.mjs`: ALL PASS, 9 checks**, after its checks 7 and 9 were adapted (it is not protected).
  - Check 7's refused example is now nobody retiring within the plan.
  - Check 9: a partner's own differing pension limit now solves as one household.
- **Other tests:** `household-landing.test.mjs` ALL PASS; `couple-swap.test.mjs` 5 of 5. The solver's code id is unchanged
  (d91a642206b9), so no pin of the solver's moves.
- **The coverage line:** under `beforeany` it is today's on both swap settings and with couples off.
- **The registered panel's plans** (`couples-any-registered-panel.json`, plans only, no outcome):
  - Every R, L, P and W unit is on: inside the guard, or on the household route lifting Y.
  - The card shows a row per person on each. Setting the partner's pension limit keeps each one on.
  - Under `beforeany`, R, L and P at Y75 are kept off for their shape, as today.
- **The draft's identity** (`research/solver/couples-any-default-identity.mjs`, new, EXPLORATORY): the app's route at the
  draft's defaults against the registered pilot's ROUTE arrays (seed 7002, 1,000 paths, already read for the sizing).
  - 3 of 3 units IDENTICAL: S041-Ri1s-own, S041-L-Y75 and S185-P-own. Guard, table digest and every path all match.
  - Under each plant every unit DIFFERS. With `cutbeforeany`, the household plan refuses them. With `beforeany`, the guard
    is off for `limits`.

## What fails, and the unlock it needs (asked by name when the read has passed)

- **`couple-default.test.mjs`** (protected, FAST_JOINING): checks 1, 2, 6 and 9 fail on the draft, as expected.
  - Check 1: its pinned `takeShapes` list is step 4's three. The block in STATE.md takes the six in the same commit.
  - Checks 2 and 6: they use the partner's pension at another risk as the refused shape. That becomes nobody retiring within
    the plan, and the risks case is taken.
  - Check 9: COUPLES-OPEN's twenty today's-route units, each kept off for `risks`, are now on the household route.
  - Add the plants `beforeany` and `cutbeforeany`, each failing its checks.
- **`couple-limits-card.test.mjs`** (protected, FAST_JOINING): checks 1 and 3 fail.
  - Both encode one row for an opened couple and a couple off for its limits.
  - Both are rewritten: a row per person on every couple the solver runs, no couple off for its limits, and the plant
    `beforeanycard` failing them.
- **`couple-shape.test.mjs`** (protected, FAST_JOINING): passes. Its check 4 is extended to name the three new shapes, taken
  alike by the cut and the guard, and to fail under `beforeany` and `cutbeforeany`.

## What runs once the cores are free (after the registered run and W's identity)

- **The draft's identity** on all 112 R, L and P units of the pilot, in four parts. It takes about 25 minutes on four cores.
- **The planner harness's check 19** with its new couples, each solved on the household route against the reference:
  - (b5): the partner's ISA at another risk;
  - (b6): the partner's own pension limit differing;
  - (b7): salaries growing apart.

  The shape card moves to nobody retiring within the plan. The plant `beforeany`, alone, must fail exactly check 19.
- **The fast tier**, then the full tier's tests that read the couples settings: `couple-shown`, `couple-solve-client`,
  `household-views`, `household`, `household-risks` and `save-default`.
- **Then the reviewer on the change of default, and B1's gate.**

## Not in it

- **C:** whether `noretire` opens is the maintainer's.
  - If it opens, `takeShapes` gains it, the coverage line has no exception left, and the household sentence loses its last
    clause.
  - The shape card's check 19 and the checks that use a refused shape then have no shape left to use.
- **E:** today's route leaving the app comes after A to C's classes have read and C is decided.
- **The D-line, the inference list and STATE.md's records** are written with the change itself. The D-line carries, beside
  the registration's inference list, two things the reviewer at the read asked for (`reviews/2026-11-25-read-couples-any.md`,
  findings 1 and 4):
  - the two units M1 names (S041-Rp1t-Y75 and S041-Ri1s-Y75) as shortfalls the maintainer accepted, the read not showing that
    the lower spending is the price of the paths kept;
  - L's pass not showing that the limits cost nothing, since APP reads no solver limits (the registration; its design review,
    item 9).
