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
