# One plan for the whole household, the lead test, read (17 Nov): A LEAD, WITH A UNIT TO PLACE; THE SEARCH GOES

## In plain words

Today a couple's year is chosen from two tables, one for each person, each solved on that person's share of the
household. The household plan solves one table for the two of them together, as if they were one person holding both
people's money with two people's allowances and bands. Each year the couple takes that one table's move. This test is
PRESCRIPTIVE-PLAN.md step 4 (D118; EXPLORATORY, seed 7002). It ran on JOINT-WIDE's 28 couples' units, with the same
4,000 simulated markets for every arm:

- **K2** is today's default for couples.
- **HOUSE** is the household plan as first built (design A).
- **HS5** is the household's move taken from the single solver's own chooser, at the best of five ways of splitting the
  year's drawing between the two people. HS5 decides the outcome.
- **HS1** is the same move at the even split.

**What it found:**
- **The household plan keeps the money lasting a little more often overall,** `+0.291` points of survival pooled
  (`+0.200` to `+0.381`). It spends more where both arms last: `+0.7838%` on the paths both keep.
- **One couple carries the gain, and one couple pulls it down.**
  - S147-db gains `+9.325` points. Without it the pooled change is `-0.044` (`-0.131` to `+0.044`), no gain beyond
    noise.
  - S191-90 loses `-20.725` points (829 paths lost, none saved). Without it the pooled gain is `+1.069` (`+1.007` to
    `+1.129`). Without both, it is `+0.752` (`+0.689` to `+0.812`).
  - By group: the feature units `+2.313`, the library `+0.650`, the younger units `-0.069`, and the 90/10 units `-1.550`.
- **Three couples lose beyond the bar, all with biases on record:** S333F (`-1.000`), S335F (`-1.500`) and S191-90.
  Each has a year when only one person's pension is open, or a one-off deposit owned by one person, or both. S191-90
  also holds 90% of its pensions in the first person's name. So by the rule they are units to place, not a failure.
- **Why they lose, as far as the decomposition shows:**
  - *The table is not the cause.* On its own plan (CEIL) the household table survives about as often as it forecast:
    S191-90 `98.60%` against its forecast `98.66%`. The loss comes from carrying its moves out on the couple.
  - *Most lost paths do not run short.* Most of them meet every year's spending and end the plan below the household's
    minimum pot.
  - *The table cannot see part of the couple's income tax.* It prices each year's pension draw as one person with two
    people's allowances and bands. The couple pays each person's own rates on the same draws.
  - *On S191-90 that hidden tax is about four times the shortfall.* The first person draws most of the pension
    (`£70,464` of taxable pension a spending year against the partner's `£7,549`). On those paths the tax the household
    plan's bands leave out averages `£186,717` a path over the plan. That is about four times the `£47,513` a path by
    which those paths end below the minimum pot.
  - *S333F and S335F show the same mechanism on a smaller scale.* What makes their draws uneven is not shown.
- **The even split does as well as the best of five** (`+0.001` points), and costs less time: `x0.357` of K2's CPU a
  path against HS5's `x0.538`. By the rule, the split's search goes.
- **The pot left, counted up to the estate cap, is lower:** `-2.410%` pooled (`-£60,880` a path). Spending is
  `+£22,523` a path. This is recorded, not a bar (D116).
  - The pot is lower on 20 of the 28 units, by 1.5% or more on 13 of them.
  - On the paths that end at or below the cap and that both arms keep, the household plan pays more lifetime tax than
    K2 (`£135,202` against `£115,547` a path) and leaves less (`£1,448,738` against `£1,549,860`).

**By the rule committed before the run: A LEAD, WITH A UNIT TO PLACE; THE SEARCH GOES.**
- Step 5 follows without waiting (D120), its household arm the even split (HS1). Its landing has begun.
- AXIS.md is called for (step 6, D121) and is written after step 5 reads, carrying both reads' units.
- REFUSALS.md follows step 5 (D122).
- D119's hold on the speed work for LOOKHOLD has met its condition, so the speed work is the maintainer's question below.

## The read, by its rule

`reduce-household.mjs`, its output whole in `results-household.txt`, read once.
- **The run:** launched 17 Nov 12:57 UK through the launcher from 95ecaeb0 (task bvc4kmjpt; code 603eeb595679, audit
  930d7e4ac75a). Its runs were done at 16:47 UK with no restart.
- **The rule's files:** the audit, the reducer, the batch, household.mjs and HOUSEHOLD.md are unchanged since that
  commit. HOUSEHOLD.md's amendment for step 4 was committed in ba40be02, before any unit ran.
- **The gate:** fair.
- **The identity:** each unit's K2 equals JOINT-WIDE's K2, all seven arrays byte for byte, on all 28 units.

| part | HS5 less K2 | holds when | read |
|---|---|---|---|
| 1 | pooled survival `+0.291` (`+0.200` to `+0.381`) | the interval's lower end above 0 | HOLDS |
| 2 | wholly below `-0.3`: S333F `-1.000` (`-1.265` to `-0.635`; 11 saved, 51 lost), S335F `-1.500` (`-1.754` to `-1.128`; 10, 70), S191-90 `-20.725` (`-20.725` to `-20.541`; 0, 829); the biases of each not nil | no unit wholly below | FAILS, on units whose biases are not nil alone |
| 3 | spending delivered on the paths both keep `+0.7838%` (`+0.7720` to `+0.7956`) | not lower by more than `0.05%` | HOLDS |
| 4 | the pot counted up to the cap `-2.410%` (`-£60,880` a path), beside spending `+£22,523` a path over every path | recorded, not a bar (D116) | recorded |
| 5 | lifetime tax, HS5 against HOUSE, `-16.577%` | HS5's lower | HOLDS |
| 6 | the household table's forecast less HS5's survival, beyond 2 points: S191-90 `+21.76` (`98.66` against `76.90`) | a unit outside named, the outcome unchanged | named |

**OUTCOME: A LEAD, WITH A UNIT TO PLACE.** Parts 1 and 3 hold. Part 2 fails only on units whose biases are not nil. Each
unit to place, with its biases and its failing years, as the reducer prints them:

| unit | locked years | the first person's share of the pensions | income tax left out | one-off deposits | its lost paths fail in plan year |
|---|---|---|---|---|---|
| S333F | 3 (21, 22, 23) | `0.600` | `£0` a year | none | 60, the plan's last (45 of 51) |
| S335F | 3 (21, 22, 23) | `0.600` | `£0` a year | `£432,000` (Myself, 2044) | 60, the plan's last (61 of 70) |
| S191-90 | 1 (5) | `0.900` | `£0` a year | `£432,000` (Myself, 2033) | 40, the plan's last (790 of 829) |

**THE SPLIT'S SEARCH, HS1 less HS5: THE SEARCH GOES.** All four of its parts hold:
- pooled survival `+0.001` (`-0.018` to `+0.020`) reaches 0;
- no unit lies wholly below `-0.3`;
- pooled spending on the paths both keep is `-0.0022%`, inside `0.05%`;
- pooled lifetime tax is `+0.224%`, inside `1%`.

Step 5's household arm is therefore HS1 (SHAPES.md).

## Each pooled figure with and without its largest unit

From `results-household.txt` and, beside it, `results-household-beside.txt` (sections A and F). The reducer's "without
its largest unit" for survival leaves out the unit saving the most paths, the pilot's convention. Section A also leaves
out the unit losing the most.

| figure | all 28 | without its largest unit |
|---|---|---|
| survival, HS5 less K2 | `+0.291` (`+0.200` to `+0.381`) | without S147-db `-0.044` (`-0.131` to `+0.044`); without S191-90 `+1.069` (`+1.007` to `+1.129`); without both `+0.752` (`+0.689` to `+0.812`) |
| spending on the paths both keep | `+0.7838%` | without S191-90 `+0.6920%` (`+0.6801` to `+0.7038`) |
| spending over every path | `+0.8422%` (`+0.8278` to `+0.8566`) | without S191-90 `+0.7555%` (`+0.7410` to `+0.7700`) |
| the pot counted up to the cap | `-2.410%` (`-£60,880` a path) | without S191-90 `-1.856%` (`-£44,994` a path) |
| spending in pounds a path, beside the pot | `+£22,523` | without S191-90 `+£19,797` |
| lifetime tax, HS5 against HOUSE (part 5) | `-16.577%` | without S341F `-13.932%` |
| lifetime tax, HS5 against K2 | `-7.662%` | without S191-90 `-13.143%` |
| the split's search: survival, HS1 less HS5 | `+0.001` (`-0.018` to `+0.020`) | without S191-90 `+0.004` (`-0.016` to `+0.023`) |
| the split's search: spending on the paths both keep | `-0.0022%` | without S023-db `-0.0016%` |
| the split's search: lifetime tax | `+0.224%` | without S333F `+0.687%` |
| HOUSE less K2: survival | `+0.257` (`+0.166` to `+0.348`) | without S191-90 `+1.050` (`+0.985` to `+1.111`) |
| HOUSE less K2: spending on the paths both keep | `+0.7849%` | without S191-90 `+0.6940%` |
| HOUSE less K2: the pot counted up to the cap | `-2.473%` (`-£62,481` a path) | without S191-90 `-1.921%` (`-£46,557` a path) |

## Far from the pilot, so checked for a fault before this was written

The plan says a read far from what the review's pilot led us to expect is checked for a fault before it is written up. The
pilot ran on other seeds, twelve units and 1,500 paths. Its expectations, against this read
(`results-household-beside.txt`, sections B and E):

| expectation from the pilot | this read |
|---|---|
| pooled survival about `+1.7` | `+0.291`: far from it |
| about `+1.0` without S147-db | `-0.044`: far from it |
| the capped pot lower by 1.5% to 13% on about two units in three | lower on 20 of 28; by 1.5% or more on 13 (`1.709%` to `11.372%`) |
| HS1's path at `x0.29` to `x0.44` of K2's | `x0.357` |
| HS5's path at `x0.42` to `x0.60` of K2's | `x0.538` |

Survival is the one figure far from the pilot. The check:

1. **On the units the pilot ran, the read reproduces it.**
   - On the pilot's twelve units, HS5 less K2 is `+1.635` (`+1.550` to `+1.711`) and HOUSE less K2 is `+1.640`, where
     the pilot gave `+1.72`.
   - Without S147-db, `+0.936`, where the pilot gave about `+1.0`.
   - On the sixteen units the pilot did not run, the read gives `-0.717` (`-0.837` to `-0.594`); without S191-90,
     `+0.617`.
   - So the distance from the pilot is in units it did not run, most of all S191-90.
2. **The table and the arm are the run's** (`results-household-ceil.txt`). On each unit to place, the household table
   solved again equals the run's by its digest. HS5 run again equals the unit file's arrays on its first 200 paths.
3. **The table reads its own plan right.** CEIL is SHAPES.md's arm: the household table run on the household's own single
   plan, inside `twoBands`, on the same 4,000 paths.

   | unit | the table's forecast | CEIL | HS5 | K2 | CEIL less HS5 |
   |---|---|---|---|---|---|
   | S191-90 | `98.66%` | `98.60%` | `76.90%` | `97.63%` | `+21.700` (`+21.516` to `+21.700`; 868 paths, none the other way) |
   | S333F | `93.10%` | `93.27%` | `91.72%` | `92.73%` | `+1.550` (`+1.303` to `+1.638`) |
   | S335F | `94.30%` | `94.65%` | `92.95%` | `94.45%` | `+1.700` (`+1.409` to `+1.845`) |

   - On each unit, CEIL is within half a point of the table's forecast. So part 6's gap on S191-90 is not in the table,
     its solve or its forecast; it is in carrying the household plan's moves out on the couple.
   - Of the paths HS5 loses and K2 keeps, CEIL keeps 821 of 829 on S191-90, 47 of 51 on S333F and 60 of 70 on S335F.
4. **How the paths are lost** (`results-household-beside.txt`, section D).
   - *On the units to place, most lost paths end below the minimum pot.* Of the paths HS5 loses and K2 keeps, 669 of 829
     on S191-90 fail that way, 42 of 51 on S333F and 56 of 70 on S335F. These paths meet every year's spending, then end
     the plan below the household's minimum pot. On S191-90 the median end pot on such paths is `£85,828`, against a
     minimum pot of `£112,900`.
   - *Over the 28 units, the household plan trades one kind of failure for the other.*
     - HS5 loses 1,628 paths at the minimum pot, against K2's 989.
     - HS5 loses 2,976 paths short of a year's spending, against K2's 3,941.
5. **Where the money goes** (`results-household-tax-why.txt`). The decomposition stays on the couple's own path under
   HS5, so it does not compare paths that have already parted.
   - *How it works.* Each plan year's incomes are taxed twice:
     - each person on their own bands, as the engine taxes them. This was recomputed and found equal to the engine's row
       to a pound in every plan year;
     - the two people's incomes added together and taxed on the household plan's doubled allowance and bands. This is
       how the household table's model prices the year.

   | unit | the couple's income tax over the plan, a path | the same incomes on the household plan's bands | left out by the household plan's model | short of the minimum pot at the end, a path | taxable pension drawn a spending year, the first person and the partner |
   |---|---|---|---|---|---|
   | S191-90 | `£952,704` | `£765,987` | `£186,717` | `£47,513` | `£70,464` and `£7,549` |
   | S333F | `£553,061` | `£480,423` | `£72,638` | `£34,778` | `£26,024` and `£14,301` |
   | S335F | `£514,715` | `£436,680` | `£78,036` | `£41,620` | `£23,911` and `£13,193` |

   - Capital gains tax on those paths is small beside it: `£2,006`, `£6,382` and `£4,816` a path.

**What the check finds.** No fault in the build.
- The household table forecasts its own plan right.
- The arm is the one the plan wrote, and the run reproduces it.
- The decomposition puts the units' loss in income tax the household table cannot see:
  - it prices each year's pension draw as one person holding two people's allowances and bands;
  - when one person draws most of the pension, the couple pays that person's higher rates;
  - the table plans the household's spending against the lower bill, and the couple ends below its minimum pot.

On S191-90 the draws are as uneven as the pensions. Its first person holds 90% of them (biasesOf's `penShareSelf`
`0.900`), and that is the bias step 6's axis is about. On S333F and S335F the pensions are held 60/40, and the draws are
still uneven. What makes them uneven is not shown. Their biases are on record for other reasons: three years with one pension open,
and on S335F a one-off deposit. `incomeTaxLeftOut`, as step 3 defined it, counts the guaranteed incomes only, not the
draws, and is `£0` on all three.

## Beside the rule, deciding nothing

- **Above and below the cap** (results-household.txt), HS5 against K2:

  | paths | lifetime tax, HS5 against K2 | pot left, HS5 against K2 |
  |---|---|---|
  | both end above the cap (38,455 paths) | `£459,060` against `£560,466` | `£15,961,806` against `£13,992,024` |
  | both end at or below it, both kept (62,709 paths) | `£135,202` against `£115,547` | `£1,448,738` against `£1,549,860` |

  HOUSE against K2 above the cap pays more tax than K2: `£604,386` against `£561,059`. HS5 pays less, which is the
  tie-break above the cap's work. Part 5 reads it as HS5's tax 16.6% below HOUSE's.
- **Step 1's counts:**
  - HS5 decided 5,160,000 times. It was past twice the table's wealth top at 145,501 of them.
  - At none of those did it take a wrapper to a less risky tier. So the hold, which design A carried, has nothing to do
    on the household's move.
- **The spending level and the risk held,** on each unit's first 300 paths (the review's why-pot measures):
  - In every spending year, HS5 raises at `73.9%` of decisions against K2's `68.6%`, and cuts at `25.6%` against
    `28.6%`.
  - In the first third of the spending years, its level is `0.9634` against `0.9420`.
  - It holds a little more risk: `4.132%` a year against `4.018%`.
- **The time,** median over the units: the solve `x0.49` of K2's for every household arm (one table). CPU a path:
  HOUSE `x0.831`, HS5 `x0.538`, HS1 `x0.357`.

## What follows, and what is the maintainer's

1. **Step 5 (D120)** follows without waiting, on SHAPES.md's rule, committed first (2fe8aa32), with HS = HS1. Its 28
   units began landing on seed 7005 at 17:07 UTC (`results/shapes-land.log`). The smoke and the launch come next;
   `results-shapes.txt` comes to the maintainer whole with its report.
2. **Step 6 (D121).** AXIS.md is called for, because this read printed A LEAD, WITH A UNIT TO PLACE. It is written after
   step 5 reads, so it carries S333F, S335F and S191-90 with their biases and CEIL less HS5 (above), and any shape step 5
   places. Nothing is built.
3. **Step 7 (D122):** REFUSALS.md after step 5. Step 8 is not started (D123).
4. **For the maintainer:** D119 held D111 (3)'s speed work on LOOKHOLD until this read, and this read is in. The review
   held it because LOOKHOLD's tie rule, look and hold would leave a couple's path if the household's move holds. The
   household's move does hold here, as a lead. The agent recommends it stays held until the maintainer rules on step 8's
   registered test. It is not started.
