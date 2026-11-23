# The guard's own units, the registered read (22 Nov): Y, E, S and G open; M1 names nine of S037's units, so the read comes to the maintainer first

Registered (`registrations/couples-open.md`, held-out seed 7026; D139 to D141, `COUPLES-OPEN.md` step 2 and its amendments
1 to 3). The run: launched 22 Nov 19:57 UK through the launcher from the launch commit 1632296f (code 36e4d2a860b2, audit
f9b56fb0b6a1), its runs done 23:36 UK with no restart: 44 units, none exiting with an error. Read once at 23:37 UK by
`reduce-couples-open.mjs --registered` (with `REG=1`) from the main tree at the launch commit, its output whole in
`results-couples-open.txt`. Every figure below is the read's own.

The reviewer at the read (`reviews/2026-11-22-read-couples-open.md`, `-2.md`):
- first look: FAIL, one BLOCKING (the closing sentence's claim that S037 trades spending for survival) and three MINOR,
  answered in one fix round (D81 (F));
- second look: PASS, one MINOR, answered.
- The read reproduced byte for byte, and every figure was recomputed from the records' arrays.

## In plain words

Today's guard keeps some couples on the app's own rules for reasons that rested on the old two-table route, before the
household plan became the couples' default (D136). This test asks, for couples the household plan takes: does the app's
own route for a couple (the household plan, the guard alone bypassed; ROUTE) keep more couples solvent than the app's rules
(arm A; APP), spending no less on the paths both keep, with no harm to any couple? It asks it for each of the guard's
reasons on the household route (D141):
- **Y:** the younger partner holding most (75%, 90% or 100% of every wrapper);
- **E:** the elder holding more than 90% (95% or 100%);
- **S:** the two the same age, outside 40% to 60% (75/25);
- **G:** more than three years apart with other taxable income (8 or 12 years; the elder's `£15,000` a year DB pension from
  the state pension age, the partner's instead, or the first person's `£15,000` a year of rent entered from plan year 0; and
  8 years with the younger holding 75%). The engine counts an income from its owner's retirement at the earliest
  (`research/engine.mjs` `incomeFloor`), so G12R's rent runs from now on S037 and S119, whose first person has retired, and
  from the first person's retirement at 60 on S199 and S279.

The panel: four couples no run had used, S037, S119, S199 and S279 (68/65, 61/58, 55/52 and 45/42 as the library holds
them, `results-couples-open-registered-panel.txt`), eleven units each. The S units set the partner to the first person's age
and the G units the partner 8 or 12 years younger; every Y and E unit is at its couple's own three-year gap. Each unit was
landed so the app's rules survive `85 +/- 1%` on 1,000 paths of seed 7005. Both arms ran on the same 25,000 paths of seed
7026 a unit, at the app's 45 points and estate weight 0.02.

**What it found, by the rule:**

| class | units | 1. a unit flagged by D34 | 2. pooled survival, points, by path | 3. spending on the paths both keep | beside: over all paths |
|---|---|---|---|---|---|
| Y | 12 | none | `+11.538` (`+11.289` to `+11.787`) | `+3.4107%` | `+3.2107%` |
| E | 8 | none | `+11.686` (`+11.433` to `+11.939`) | `+3.0325%` | `+2.8829%` |
| S | 4 | none | `+11.547` (`+11.296` to `+11.798`) | `+2.7988%` | `+2.7202%` |
| G | 20 | none | `+11.964` (`+11.717` to `+12.211`) | `+3.4491%` | `+3.0414%` |

**OUTCOME: Y, E, S and G each OPEN.** By the registration, each lifts its part of the guard for couples the household plan
takes, by a change of default with the reviewer on it. But M1 names nine units, all S037's, so the read comes to the
maintainer first, and **the default changes only on the maintainer's word.** Nothing is committed before it.

## No harm

- On no unit does ROUTE lose more than 6 paths of 25,000 (S199-Y75, S037-G12P), against D34's thresholds of 147 to 165
  paths. It saves from 2,551 (S119-G12R) to 3,769 (S037-G12, S037-G12R) paths.
- ROUTE survives from `95.02%` (S279-E100) to `99.98%` (S037-G8Y75); APP from `83.90%` (S279-E100) to `86.70%`
  (S199-Y100).

## The units M1 names: nine of S037's eleven

M1 (D116): where ROUTE keeps more paths and delivers no less spending, a smaller pot left is not a harm. A unit where ROUTE
keeps more paths but spends less on the paths both keep, beyond noise, is named, and under an OPENS each named unit goes to
the maintainer with the read before the default changes.

It names S037's Y90, Y100, E95, E100, S75, G8, G12, G8Y75 and G12R. On each, ROUTE:
- keeps from 3,356 (Y90) to 3,769 (G12, G12R) more paths net of 25,000;
- spends less on the paths both keep, from `-0.1031%` (S75) to `-2.5633%` (G8Y75), and over all paths, from `-0.591%` (S75)
  to `-3.319%` (G8Y75);
- leaves a larger pot, capped from `+26.608%` (E100) to `+96.271%` (G8), from `£67,514` (Y90) to `£187,386` (G8) a path.

S037's other two units:
- **Y75** spends more on the paths both keep (`+0.5293%`) but less over all paths (`-0.2932%`, `-0.3391` to `-0.2474`), so
  the read's list of spending over all paths names it and M1 does not.
- **G12P** spends more by both measures (`+2.3500%` and `+2.2789%`).

So on nine of S037's eleven units (the panel's eldest couple), the household plan keeps far more paths than the app's rules
but spends less on the paths both keep, by a tenth of a percent to two and a half percent, and leaves more in the pot.
Across all eleven, APP survives from `84.66%` to `86.49%` and ROUTE from `99.32%` to `99.98%`.
- Across S037's eleven units the paths kept and the spending do not line up in one direction (the reviewer's second look,
  MINOR 1):
  - Y75 keeps more paths (0 lost, 3,695 saved) than five of the nine units M1 names, while spending `+0.5293%` more on the
    paths both keep;
  - G12P keeps the fewest of the eleven (6 lost, 3,213 saved) and spends the most (`+2.3500%`): fewer paths kept with more
    spending, the direction a trade between them would take.
- The read has no decomposition of where the spending goes. So it cannot tell spending given up for survival from money
  left in the pot, and it does not show why.
- The pilot named 8 of S037's 11 units by the same rule (`results-couples-open-sizing.txt`).
- In the dress rehearsal (EXPLORATORY, seed 7002, 4,000 paths), the pattern was weaker on S025's ten household-route units
  (`results-couples-open-rehearsal.txt`, `results-couples-open-addendum.txt`, no interval printed):
  - ROUTE spent less on the paths both keep on five, from `-0.1195%` (E95) to `-1.3855%` (G8Y75);
  - and more on the other five, from `+0.0262%` (G12) to `+2.5398%` (G12P).

## Beside, deciding nothing

- **The other three couples (33 units).** ROUTE spends more on every unit, on the paths both keep from `+1.8500%`
  (S119-S75) to `+7.5014%` (S279-G12P), and over all paths from `+1.7759%` (S119-S75) to `+7.3676%` (S279-G12P). Their mean
  pot is lower on every unit, from `-26.691%` (S119-G8Y75) to `-74.344%` (S279-Y100), while the pot capped at the route's
  estate caps moves much less, from `-7.648%` (S199-S75) to `+7.221%` (S119-G8Y75).
- **Lifetime tax.** It is lower under ROUTE on 40 of the 44 units. It is higher on four:
  - S037-E95 (APP `£19`, ROUTE `£689` a path) and S037-E100 (`£10` and `£953`);
  - S037-G8Y75 (`£59,626` and `£60,403`);
  - S199-G12R (`£97,059` and `£97,122`).
- **The MPAA ages.** Each arm's context sets an age for each person from which the money purchase annual allowance
  applies under that arm's plan, and the read records them. They are the same under both arms on 33 units and differ on 11:
  - nine of S199's, where the partner's is 58 under ROUTE and 60 under APP (on S199-G12R ROUTE also sets the first person's,
    at 60, where APP sets none);
  - S119-G12R and S037-G8Y75, where ROUTE sets the first person's (at 61 and 73) and APP sets none.
- **S037-G12R is S037-G12's plan,** as the registration said (its rent from now and the DB pension from the state pension
  age the same `£15,000` a year from 68), and its figures are the same. So an income before the state pension age is read
  on the other three couples' G12R alone.
- **The time.** A path's CPU, APP the median `0.4` ms and ROUTE `44.4` ms; ROUTE's solve the median `50` s.

## What it means

By the registration, each of Y, E, S and G opens its part of the guard for couples the household plan takes:
- **Y:** a couple whose younger partner holds more than 60% runs the solver whatever the split;
- **E:** the elder's ceiling `ELDER_UP_TO` lifts from 90% to all of it;
- **S:** two people the same age run the solver whatever the split;
- **G:** an age gap with other taxable income no longer keeps a couple off (`DB_GAP_UP_TO`).

The change of default is made in the commit of the D-line naming this run, with the reviewer on it:
- the guard reading the household plan's refusal before it lifts a reason, so a couple whose plan's shape the household
  plan refuses keeps today's guard in every outcome;
- the client failing closed beside it;
- the couples card's and the coverage line's words;
- the decided-defaults block and `couple-default.test.mjs` (protected: the maintainer's unlock, asked by name);
- the app's route held to the tested arm path for path;
- to `main` on B1's gate.

Because M1 names S037's nine units, the read comes to the maintainer first, after the reviewer at the read and the deep
review (CLAUDE.md), and nothing is committed before the maintainer's word.

## What it does not show

By inference only, as the registration lists:
- splits between those tested, and the same age at holdings other than 75%;
- gaps other than 8 and 12 years, and incomes other than those read; G with the elder holding more than 60%; Y at an age
  gap over three years without other income;
- a couple entered younger first, and a couple with no minimum pot set;
- other taxable income paid before the household can draw a pension, at 58: G12R's rent runs after it on every couple, and
  before the state pension age on S119, S199 and S279 alone;
- a couple retiring before the pension access age of 58: no registered couple does, and the dress rehearsal's younger
  cohort read it (EXPLORATORY);
- the younger cohort, read by the dress rehearsal and its addendum alone;
- a shape `COUPLES-OPEN.md` step 4 later moves onto the household route;
- the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.

And one item the registration's list misses (the reviewer at the read, MINOR 4), for the change of default's D-line:
- E at an age gap over three years without other income. Once E opens, such a couple with the elder holding more than 90%
  runs the solver, and every E unit is at its couple's own three-year gap.

Four couples ran. On nine of S037's eleven units more paths kept and less spent on the paths both keep occur together,
beside a larger pot. Whether they would on another couple like S037 is not shown.
