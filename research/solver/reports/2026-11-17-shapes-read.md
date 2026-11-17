# The shapes the library lacks, read (17 Nov): A SHAPE TO PLACE (gap12)

## In plain words

All 210 of the library's couples are three years apart, retire at one age, and have the first person holding more. Step 5
(PRESCRIPTIVE-PLAN.md, D120; EXPLORATORY, seed 7002) built 28 couples of other shapes from four bases (S149, S337F,
S147-db and S061-dbpart). Each base was given seven changes:
- the two the same age;
- 8 and 12 years apart;
- the elder entered second;
- the first person holding 40%;
- the first person holding 10% of the pensions;
- the first person holding all of the pensions.

Each couple was run on the same 4,000 simulated markets under four arms:
- the app's rules (APP);
- today's couples' default (K2);
- the household plan at the even split (HS);
- the household table on its own single plan (CEIL), which is what the table believes it can do.

**What it found:**
- **The household plan does better than today's default on these shapes:** `+5.865`
  points of survival pooled (`+5.812` to `+5.913`). It spends more where both arms last: `+2.9081%` on the paths both
  keep.
  - No couple's interval lies wholly below the bar.
  - Without the unit that gains most, S061-dbpart@gap12 (`+29.500`), the pooled gain is `+4.990`.
  - Most of the gain is on the two bases with a DB pension: `+10.723` on their 14 units against `+1.007` on the 14
    without. By base: S149 `+0.925`, S337F `+1.089`, S147-db `+7.536`, S061-dbpart `+13.911`.
- **The 12-year gap is the shape to place.** On gap12 the household plan sits further below its own table's forecast,
  CEIL less HS, `+1.675` points on average, past the rule's bar of 1. That rests on two units:
  - S061-dbpart@gap12 `+4.050` and S147-db@gap12 `+2.350`;
  - without S061-dbpart@gap12 the shape's mean is `+0.883`, under the bar.

  No other shape's mean reaches `+0.4`.
- **Beside the rule, and it matters for the app as it stands: today's default does worse than the app's own rules on
  three couples the app hands to it.** The app's guard (`src/couplesSwitch.js`) sends a couple to the solver when its
  first person holds 40% to 60% of the pots, or its elder holds more than 60% and up to 90%. It reads no age gap.
  - On three such couples, all 60/40 with an 8- or 12-year age gap and a DB pension (whole or in part), K2 survives well
    below APP:

    | couple | K2 less APP | HS less APP |
    |---|---|---|
    | S147-db@gap8 | `-6.800` (`-7.222` to `-6.247`) | `+12.575` |
    | S147-db@gap12 | `-10.950` (`-11.140` to `-10.602`) | `+10.900` |
    | S061-dbpart@gap12 | `-20.250` (`-20.338` to `-19.990`) | `+9.250` |
  - Under the opt-in, those couples are given K2 today (D99). The household plan does far better than the app's rules on
    all three.
  - Over the 25 units the guard hands to the solver, K2 is `+7.217` points above APP pooled (`+8.361` without
    S061-dbpart@gap12). On these units and this seed, the harm is on these three.
  - The harm goes with an age gap and a DB pension together. On the gap8 and gap12 units K2 less APP is:
    - `+10.744` on the four without a DB pension;
    - `-7.950` on the four with one, S061-dbpart@gap8 among them gaining (`+6.200`);
    - `+1.397` on all eight.
  - Two other units lose under K2 (S061-dbpart@penB90 `-10.175`, S061-dbpart@penA100 `-2.850`), but the guard keeps
    those couples on the app's rules.
  - Why K2 loses there is not shown: no decomposition was run. It is a lead, on seed 7002 and 4,000 paths, EXPLORATORY.
- **Two units were run again.** S147-db@penA100 and S061-dbpart@penA100 were first refused by the audit's settings check,
  over a rounding of each person's floor. They were run again on the amended check (SHAPES.md amendment 1; D125 to D127,
  reviewed before use). The read takes both stamps as the amendment has it.

**The reviewer at the read: PASS, two MINORs, answered here** (`reviews/2026-11-17-read-shapes.md`: every figure
recomputed from the arrays; the stamps, the two units run again and the app's own route on the three couples checked).

**By the rule committed before the run: A SHAPE TO PLACE.** Step 6's AXIS.md is called for and carries gap12's units beside
the lead test's three. REFUSALS.md follows (step 7). Step 8 is not started.

## The read, by its rule

`reduce-shapes.mjs`, its output whole in `results-shapes.txt`, read once.
- **The launches:**
  - 26 units launched 17 Nov 17:19 UK from 7ba13e93 (audit 260916d007cd);
  - S147-db@penA100 and S061-dbpart@penA100 launched again 20:26 UK from 29091fa3 on the amended files (audit
    decd98612d68), their refused logs kept.
- **The gate:** fair on exactly those two stamps.
- **The split:** HS at the even split, the lead test having printed THE SEARCH GOES.

| part | HS less K2 | holds when | read |
|---|---|---|---|
| 1 | pooled survival `+5.865` (`+5.812` to `+5.913`) | the interval's lower end above 0 | HOLDS |
| 2 | units wholly below `-0.3` | none below the bar | none |
| 3 | spending delivered on the paths both keep `+2.9081%` (`+2.8931` to `+2.9230`) | not lower by more than `0.05%` | HOLDS |
| 6 | the household table's forecast less HS's survival, beyond 2 points: S337F@even `-2.84`, S147-db@gap12 `+2.47`, S061-dbpart@gap12 `+4.05` | named, the outcome unchanged | named |
| shapes | a shape's units averaging more than 1 point of CEIL less HS: gap12 `+1.675` | none | gap12 |

**OUTCOME: A SHAPE TO PLACE.** Parts 1 and 3 hold pooled. No unit lies below the bar. gap12 averages more than 1 point
of CEIL less HS.

## Each pooled figure with and without its largest unit

From `results-shapes.txt` and `results-shapes-beside.txt` (sections A to E):

| figure | all | without its largest unit |
|---|---|---|
| survival, HS less K2, pooled | `+5.865` (`+5.812` to `+5.913`) | without S061-dbpart@gap12 `+4.990` (`+4.943` to `+5.031`) |
| by shape: even | `+3.725` | without S061-dbpart@even `+1.767` |
| gap8 | `+6.856` | without S147-db@gap8 `+2.683` |
| gap12 | `+13.488` | without S061-dbpart@gap12 `+8.150` |
| elder2nd | `+3.925` | without S061-dbpart@elder2nd `+1.658` |
| part60 | `+1.150` | without S061-dbpart@part60 `+0.517` |
| penB90 | `+7.556` | without S061-dbpart@penB90 `+2.367` |
| penA100 | `+4.356` | without S061-dbpart@penA100 `+0.900` |
| CEIL less HS, gap12's mean | `+1.675` | without S061-dbpart@gap12 `+0.883` |
| spending on the paths both keep | `+2.9081%` | without S147-db@elder2nd `+2.7792%` |
| K2 less APP over the 25 units the guard hands to the solver | `+7.217` (`+7.067` to `+7.363`) | without S061-dbpart@gap12 `+8.361` |
| HS less K2, the 14 units with a DB pension against the 14 without | `+10.723` against `+1.007` | (by base, `results-shapes-beside.txt` section E) |
| K2 less APP on the gap8 and gap12 units | `+1.397` on all eight | `+10.744` on the four without a DB pension, `-7.950` on the four with one |

## Beside the rule, deciding nothing

- **The household plan against the app's rules:** above APP on every unit, from `+9.250` (S061-dbpart@gap12) to
  `+13.875` (S061-dbpart@elder2nd).
- **Today's default against the app's rules, unit by unit,** and which arm the app's guard gives the couple as entered
  (`results-shapes-beside.txt`, section D). K2 is above APP on 23 of the 28 units. It is below on five:
  - three the guard hands to the solver (above);
  - S061-dbpart@penB90 and S061-dbpart@penA100, which the guard keeps on the app's rules (their pots' share `0.175` and
    `0.940`).
- **The units run again** (S147-db@penA100, S061-dbpart@penA100) stand beside the others as any unit does:
  - their arms ran on the same code (603eeb595679), seed, paths, points, arm order and split;
  - the amended check differs from the old only in the lowest spending level: it is left out of the comparison, and the
    household table's is held to the couple's floor over its target and the first person's to their share's;
  - S147-db@penA100: HS less K2 `-0.100` (`-0.278` to `+0.117`);
  - S061-dbpart@penA100: `+14.725`.

## What follows, and what is the maintainer's

1. **Step 6 (D121).** AXIS.md is called for, by the lead test's A LEAD, WITH A UNIT TO PLACE and by this read's A SHAPE TO
   PLACE. It carries S333F, S335F and S191-90, and gap12's four units with their biases and CEIL less HS, each with the
   axis's window and size. Nothing is built.
2. **Step 7 (D122):** REFUSALS.md. Step 8 is not started (D123).
3. **For the maintainer: today's couples' default on couples with an 8- or 12-year age gap and a DB pension.**
   - On three such couples, which the app's guard hands to the solver under the opt-in, K2 survives `6.8` to `20.3` points
     below the app's own rules on this seed.
   - The K2 here is what the app gives such a couple. The reviewer at the read ran the page's own route for a couple on
     the three, and it matched the stored K2 path for path on the first 400 paths; `src/` and the engine are as on
     `main`.
   - Every couple tested before this was three years apart. The guard reads the pots' share and an age cap, not the age
     gap.
   - **The agent's recommendation, not made:** keep a couple whose age gap is beyond what has been tested (three years)
     and who hold a DB pension on the app's rules, as the guard does for holdings outside the tested band, until a test
     reads. That would be a change of default, so the reviewer would check it first.
   - **Its trade.** A guard on the age gap alone would also keep the four gap couples without a DB pension from their
     gain over the app's rules (`+10.744` on them here). A guard on the gap with a DB pension takes S061-dbpart@gap8's
     gain (`+6.200`) with the three losses.
   - The evidence is four bases on one seed, and the cause is not shown. The household plan does far better than the
     app's rules on all three.
