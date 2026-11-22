# The guard's own units, the dress rehearsal: every class passes (22 Nov; EXPLORATORY)

D139; `COUPLES-OPEN.md` step 1. The read whole: `results-couples-open-rehearsal.txt` (`reduce-couples-open.mjs`, read once
from a tree at the launch commit c4e86633). It decides nothing: no class opens on it, and the registered test reads by this
rule on couples no run has used and a held-out seed.

## What ran

- **The arms**, on the same 4,000 paths of the tuning seed 7002 a unit, 45 points, estate weight 0.02:
  - APP, arm A: the app's rules on the plan as entered.
  - ROUTE: the app's own route for the couple, the guard alone bypassed. It is the household plan where the household
    plan takes the plan's shape (36 units), and today's two-table route where the household plan refuses it (8 units).
- **The panel** (`couples-open-panel.json`, `results-couples-open-panel.txt`): S025, S273, S351F and S357F, eleven units
  each, every unit landed so arm A survives `85 +/- 1%` on 1,000 paths of seed 7005. Every unit is one today's guard keeps
  on the app's rules, for its class's reason:
  - Y: the younger partner holding 75%, 90% or 100%;
  - E: the elder holding 95% or 100%;
  - S: the two the same age, 75/25;
  - G: 8 or 12 years apart with the elder's DB pension of `£15,000` a year, or 8 apart with the younger holding 75%;
  - R: two shapes the household plan refuses, so today's route, the younger holding 75%: the partner's pension one risk
    profile safer (RY75), and one person retired with the other still paid in the plan's first year (RWY75).
- **The run:** launched 22 Nov 11:40 UK through the launcher from c4e86633 (`PREDICTION` none; code 36e4d2a860b2, audit
  a4ef3698d92c). The runs were done at 13:18 UK, and no unit exited with an error.
- **The gate:** fair. The first read, from the main tree, was refused: `held-out.mjs`, which the panel's script imports and so
  the stamp covers, changed after the launch (e54b3178). So the read was made from a tree at the launch commit, whose stamp is
  the launch's and whose engine is byte for byte the one the snapshot ran.

## What it found

Each class passes all three parts of the rule, ROUTE against APP. Every figure below is the read's own.

| class | units | 1. a unit flagged by D34 | 2. pooled survival, points, by path | 3. spending on the paths both keep |
|---|---|---|---|---|
| Y | 12 | none | `+11.058` (`+10.411` to `+11.706`) | `+7.1960%` (`+7.0371` to `+7.3548`) |
| E | 8 | none | `+10.787` (`+10.144` to `+11.431`) | `+7.4125%` (`+7.2551` to `+7.5699`) |
| S | 4 | none | `+10.262` (`+9.625` to `+10.900`) | `+6.6415%` (`+6.4911` to `+6.7920`) |
| G | 12 | none | `+11.119` (`+10.464` to `+11.773`) | `+6.5255%` (`+6.3788` to `+6.6722`) |
| R | 8 | none | `+10.178` (`+9.600` to `+10.756`) | `+3.4485%` (`+3.3322` to `+3.5649`) |

- **No harm.** On every unit ROUTE keeps hundreds of paths APP loses and loses few that APP keeps. The most it loses is
  S351F-RY75: 16 lost against 225 saved, under its threshold of 37 paths.
- **Spending, unit by unit.** Seven of S025's eleven units spend less on the paths both keep than APP:
  - E95 `-0.1195%`, E100 `-0.2341%`, S75 `-0.3243%`, G8 `-0.8892%`, G8Y75 `-1.3855%`, RY75 `-2.6662%`, RWY75 `-2.2993%`.
  - Each of them keeps far more paths, ROUTE surviving from `97.50%` to `100.00%` where APP survives from `84.10%` to
    `86.28%`.
  - Each leaves a larger mean pot (from `+28.124%` to `+105.069%`).
  - Every other couple's units spend more on the paths both keep, from `+0.9431%` to `+13.9112%`.
  - Part 3 is read pooled, and these units do not reach it.
- **The pot**, beside the rule:
  - S273's, S351F's and S357F's units leave a much smaller mean pot under ROUTE, from `-70.494%` to `-86.658%`, while
    spending more. Capped at the route's estate caps, the change is from `-8.908%` to `+4.595%`.
  - S025's units leave a larger pot.
  - A smaller pot is no harm where the route keeps more paths and spends no less (D116). The units where the route spends
    less on the paths both keep are S025's, whose pots are larger.
- **Lifetime tax** swings widely by unit, from `-56.850%` to `+2024.776%`. Where APP pays little tax it also spends far
  less, so a percentage of its tax is no guide.
- **The time:** a path's CPU, APP the median `0.7` ms and ROUTE `59.5` ms; ROUTE's solve the median `85` s.

## What it means for the registered test

- **Paths.** The rehearsal's discordance sizes the registered test's paths by D34. The registered panel's own pilot sizes
  them in the end.
- **The panel.** Every class can be registered as it stands: none of the five showed harm.
- **Unit by unit.** The registered read should name a unit that keeps more paths but spends less on the paths both keep
  (S025's pattern here), as step 8's M1 by unit did. It is not a bar.
- **The younger cohort** (S351F and S357F here) has no couple left untouched for the registered panel. It rests on this
  rehearsal, which the registration will say.

## What it does not show

- It is the tuning seed and four couples step 8 used, so it is not held out.
- Each class's pass reaches other splits, gaps, incomes and shapes by inference only.
- The R class reads two of the five shapes the household plan refuses, not all five.
