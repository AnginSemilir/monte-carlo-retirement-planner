# The shapes the library lacks (EXPLORATORY; PRESCRIPTIVE-PLAN.md step 5, D120; its rule below, committed before any build)

The external review of 17 Nov (`research/reviews/2026-11-17/ANSWERS.md` section 7, on review/external-2026-10-21 at
f1f44727): all 210 of the library's couples are three years apart, retire at one age, and have the first person holding
more (`results-coverage.txt` there), and so are all 28 of the lead test's units. Nothing read so far, for today's default
or for the household plan, says anything about a couple of another shape. This test runs the household plan's arm, as the
lead test left it, on couples of the shapes the library lacks. It follows the lead test (D120: without waiting, if the lead
test printed A LEAD or A LEAD, WITH A UNIT TO PLACE), as `PRESCRIPTIVE-PLAN.md` step 5 words it; nothing in it changes a
default, a gate or the candidate.

## Units: 28

Four bases, each as its panel holds it: S149, S337F (the couples' re-run panel, `couples-panel-d4b.json`), S147-db and
S061-dbpart (the share rules' panel, `share-rules-panel.json`). Seven shapes of each, named `<base>@<shape>`:

| shape | the one change to the base's plan |
|---|---|
| `even` | `currentAgePart` set to `currentAgeSelf` |
| `gap8` | `currentAgePart` set to `currentAgeSelf - 8` |
| `gap12` | `currentAgePart` set to `currentAgeSelf - 12` |
| `elder2nd` | `currentAgeSelf` and `currentAgePart` exchanged, so the first person is the younger |
| `part60` | every wrapper re-held so the first person holds 40% of its total (`share-rules-panel.mjs` `reheldAt`) |
| `penB90` | the two pensions' balances and contributions re-held so the first person holds 10% of each total; the other wrappers as they are |
| `penA100` | the partner's pension balance and contribution added to the first person's and set to nil |

- **Landed:** each unit's target by `phase4-panel.mjs` `landTarget`, as the share rules' panel landed its variants (arm A,
  searched anew at each target, 85% within a point on 1,000 paths of seed 7005). A unit that does not land is printed and
  left out.
- **A unit `householdPlanFor` refuses** is printed with its message and left out. The plan is not changed to take it.
- **`elder2nd`:** the couple is handed to both solvers as its mirror, `src/coupleOrder.js` `otherOrder(E, plan)`, as the
  app hands such a couple to the solver (D104). Every figure the rule reads is the household's (survival, spending, the
  pot, tax), so nothing is mirrored back.

## Arms, on the same 4,000 paths of seed 7002

| arm | what |
|---|---|
| `APP` | arm A, the app's rules |
| `K2` | the couples' default, solved by `solveCouple` whatever the guard says of the couple |
| `HS` | `HS5` if the lead test printed `THE SEARCH STAYS`, `HS1` if it printed `THE SEARCH GOES` |
| `CEIL` | the household table on the household's own single plan: `E.buildContext(withTable(cp.hplan, cp.H))` inside `twoBands` |

## The rule

`HS` less `K2`: the lead test's parts 1, 2, 3 and 6 (`HOUSEHOLD.md` section 5 as amended for step 4), pooled over the units
that ran and by shape. Beside them, for every unit: `CEIL` less `HS` in survival, paired by path; and `HS` less `APP`.

| outcome | when |
|---|---|
| `HOLDS ON EVERY SHAPE` | parts 1 and 3 hold pooled; no unit's interval lies wholly below `-0.3`; no shape's units average more than 1 point of `CEIL` less `HS` |
| `A SHAPE TO PLACE` | parts 1 and 3 hold pooled; a unit lies below the bar, or a shape averages more than 1 point of `CEIL` less `HS` |
| `DOES NOT HOLD` | part 1 or part 3 fails pooled |

## Files

`SHAPES.md` (this), `shapes-panel.mjs` (the units and their landing), `audit-shapes.mjs`, `reduce-shapes.mjs` with its
planted checks, `batch-shapes.sh`, `results-shapes.txt` (the reducer's output whole, sent to the maintainer with the report,
D120).

**Time box:** a day to build and land; 4 hours to run; half a day to read. If the box runs out, stop and report.

## Amendment 1 (17 Nov, evening; D125, D126): the settings check, one unit run again, the read on two stamps

Made after the launch (17 Nov 17:19 UK, from 7ba13e93, audit `260916d007cd`), when unit 20, S147-db@penA100, exited before
any arm ran: the audit's settings check refused it. The first person's table's lowest spending level is `0.799985`; the
household table's is `0.8`. Each table's lowest level is its own plan's floor over its own target, rounded to six places.
On this shape the pots' share (`0.72`) makes the first person's `0.7999849` and the partner's `0.8000387`. That is the
class D124 (1) ruled on for the minimum pot: a person's table is solved on its share of the household's figures. No
outcome of any unit has been read. The rule above is unchanged; the amendment is to how the units are checked and read:

1. **The settings check** (`audit-shapes.mjs` `shapesLineProblems`, used in place of `audit-household.mjs`'s check; the
   lead test's files are not touched, so its reducer still reproduces its read):
   - the household table's line is held to the first person's, the tie-break the one difference, as before;
   - the minimum pot is left out and held to the household's own, as before (D124 (1));
   - the spending levels are compared with the lowest left out, and the household table's lowest is held to the
     household's own floor over its target, rounded as the levels are.
   Its planted cases: `node research/solver/audit-shapes.mjs --planted`.
2. **The unit run again:** unit 20 alone, through the launcher on the amended files (`batch-shapes.sh` with
   `UNITS_ONLY=20` and `RESUME=1`), its refused log kept beside it as `case20-refused.txt`. Any other unit the check
   refused for the same reason would be run again the same way, and named here before it runs.
3. **The read on two stamps:** `reduce-shapes.mjs`'s gate takes exactly two audit stamps: the launch's (`260916d007cd`)
   for every unit not run again, and the amended files' for the unit run again. A unit on the other stamp, or a third
   stamp, is refused. The fair-test gate is asked to take exactly those two versions on one code (`fair-gate.mjs`'s
   allowed versions, D126). Its planted cases: `node research/solver/reduce-shapes.mjs --planted`, and
   `research/tests/fair-gate-allowed.test.mjs` for the fair-test gate.
4. **The reviewer** on this amendment before it is used (D125, in D94 (1)'s form).
