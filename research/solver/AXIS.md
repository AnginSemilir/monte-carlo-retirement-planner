# Whether an axis is needed (step 6, D121; EXPLORATORY; nothing built)

Written because the lead test printed **A LEAD, WITH A UNIT TO PLACE** (`results-household.txt`) and step 5 printed **A
SHAPE TO PLACE** (`results-shapes.txt`). One page, as `PRESCRIPTIVE-PLAN.md` step 6 sets it out. Then stop.

## 1. The units and shapes, with their biases and CEIL less HS

| unit | biases (`biasesOf`) | HS less K2 | CEIL less HS |
|---|---|---|---|
| S333F (the lead test) | locked years 3 (21 to 23); pensions `0.600` with the first person; no one-off deposit | `-1.000` | `+1.550` (`+1.303` to `+1.638`) |
| S335F (the lead test) | locked years 3 (21 to 23); pensions `0.600`; a one-off deposit `£432,000` (Myself, 2044) | `-1.500` | `+1.700` (`+1.409` to `+1.845`) |
| S191-90 (the lead test) | locked year 1 (5); pensions `0.900`; a one-off deposit `£432,000` (Myself, 2033) | `-20.725` | `+21.700` (`+21.516` to `+21.700`) |
| S149@gap12 (step 5) | locked years 12; pensions `0.60` | `+2.100` | `+0.125` (`-0.060` to `+0.242`) |
| S337F@gap12 (step 5) | locked years 12; pensions `0.60` | `+0.500` | `+0.175` (`-0.010` to `+0.262`) |
| S147-db@gap12 (step 5) | locked years 12; pensions `0.60`; income tax left out `£554` a year; a one-off deposit | `+21.850` | `+2.350` (`+2.128` to `+2.399`) |
| S061-dbpart@gap12 (step 5) | locked years 9; pensions `0.60`; income tax left out `£874` a year | `+29.500` | `+4.050` (`+3.868` to `+4.050`) |

- **Sources.** The lead test's CEIL less HS is HS5's (`results-household-ceil.txt`); step 5's is HS1's
  (`results-shapes.txt`).
- **gap12 rests on one unit.** Its mean CEIL less HS is `+1.675`, and `+0.883` without S061-dbpart@gap12
  (`results-shapes-beside.txt`).
- **Where the loss lies.** On each unit the household table on its own plan (CEIL) does better than the household's move
  on the couple (HS). So what is lost lies between the household plan and the couple. Its cause is not shown
  (`reports/2026-11-17-household-read.md` and `-shapes-read.md`, as corrected after their reviewers).

## 2. The design (ANSWERS.md section 3)

- **The axis:** the smaller pension's share of the two people's pensions, carried as a state on three points (0, the
  plan's opening share, 0.5).
- **Where it is carried:** from the household's first retirement to the younger person's state pension age, dropped at
  both ends. Before the first retirement nothing is drawn. After the younger person's state pension age, section 3 holds
  that nothing depends on the share "for a household that stays in the basic rate".
- **Who draws:** inside the year, given what each person holds, as a sum, the cheaper band first.

## 3. How its year is held to the couple's exact year

- **Section 3's account:** in the window, "each person's pension is known, so the year can be held to the couple's exact
  year as a single's is". The state carries the household's pension and the smaller one's share, so each person's pension
  is fixed at every lattice point. Each such point can then be stepped by the couple's exact year (`model.js` `step` on
  the two people's states) and held to it to the pound, as a single's fast year is held to `model.js`.
- **Not settled by section 3:** how the merged ISA, taxable account and cash are given to the two people at a lattice
  point. They stay one pot each, as in design A.
- **Outside the window:** the year is design A's, the single's year on the household plan.

## 4. Its cost in table size

From `results-axis.txt` (`axis-size.mjs`; its reading of section 3 checked against section 3's own four units, the same to
the year):

| unit | the window | the household table, against a single's |
|---|---|---|
| S333F, S335F | plan years 15 to 33, 19 of 61 | `1.62` times |
| S191-90 | plan years 5 to 15, 11 of 41 | `1.54` times |
| S149@gap12, S147-db@gap12 | plan years 0 to 23, 24 of 40 | `2.20` times |
| S337F@gap12 | plan years 15 to 42, 28 of 61 | `1.92` times |
| S061-dbpart@gap12 | plan years 0 to 18, 19 of 36 | `2.06` times |

On gap12's units the younger person reaches the state pension age later, so the window is longer and the table would be
about twice a single's.

## Where the household plan's pricing departs from the couple's: sizes, not a cause

`results-axis.txt` (`axis-tax.mjs`) splits the bands' part by the window, on the lead test's three units. The bands' part
is the couple's income tax, each person on their own bands (held to the engine's row in every plan year), less the same
taxable incomes on the household plan's doubled bands. The split is the mean a path, on the paths HS5 loses and K2 keeps.

| unit | before the window | in it, the later retiree still working | in it, both retired | after it |
|---|---|---|---|---|
| S191-90 | `£184` | `-£21,900` | `£549` | `£207,883` |
| S333F | `£35,309` | `£2,109` | `£367` | `£34,852` |
| S335F | `£36,578` | `£1,609` | `£2,606` | `£37,243` |

- **On these three units the bands' part falls mostly outside section 3's window.**
  - On S191-90 it falls after the younger person's state pension age. There the first person draws `£88,659` of taxable
    pension a year, past one person's basic rate band, and the partner `£461`. Section 3 ends the window there on the
    premise that a household stays in the basic rate after it, and this one's first person does not.
  - On S333F and S335F it falls as much before the first retirement as after the younger person's state pension age.
  - The negative while S191-90's later retiree still works is the measure's own: there it stacks the draws over that
    person's pay, which the household plan carries as tax-free take-home.
- **It says nothing about why these paths are lost.** The bands' part is of the same order on the paths both arms keep
  as on those HS5 loses (`results-household-tax-why.txt`). It was not split on gap12's units.
- **The household plan also doubles the tax-free cash cap.**
  - The first person ends at their own cap on 50 of S333F's 51 lost paths and on 67 of S335F's 70. On the first 1,000
    paths both keep, it is 152 and 84.
  - That is an association, not a cause.
  - Section 3's axis carries the pensions' share, not each person's tax-free cash taken.
- **Whether an axis would mend these units is not shown.** The decomposition offered in the lead test's read would say
  which of the two doubled allowances, if either, S191-90's loss rests on: HS5 with the household table's income bands
  single, and again with its tax-free cash cap single.

**Nothing is built. The axis, and whether it is the remedy, are the maintainer's.**
