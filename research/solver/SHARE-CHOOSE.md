# The solver choosing a couple's share, stage A (D102, option 2; EXPLORATORY, seed 7002)

Committed before launch. It decides nothing in the code by itself. Its outcome leads to D103's speed work and then a
registered test, or back to the maintainer, as below.

The read comes before the build. The audit works out the forecast itself, in the same way the rollout scores a joint move.
`shareRule: 'choose'` (D102: an option, off in code) is then built with D103's speed work, in the form this read supports:
which shares are tried, and whether a light first pass chooses. Its test of its class shows that its pick is the share whose
forecast this read rates best.

## In plain words

A couple's plan is worked out as two plans, one for each partner, with the household's spending split between them. The
share ensemble found better splits than today's rule on most couples, but no single rule that fits them all. The maintainer
chose to let the solver choose the split itself (D102).

Stage A asks whether the solver's own forecast can do that. Each couple is worked out at a handful of splits, and the
forecast picks one. Every split is also simulated, which shows how good the forecast's pick really is. It is compared
against:
- the split that simulated best;
- today's rule;
- a fixed split by each partner's full means, the other option the maintainer was offered.

Two quicker first passes are tried too. If a coarse, cheap version picks the same split, the speed work (D103) can use it.

## The question

Does the share the solver's own forecast prefers keep a couple solvent nearly as often as the best share tried, and at
least as often as today's rule (`shareRule: 'pots'`, D99), on the couples where the share matters?

## Units

Fourteen of stage C's units (`couples-share-panel.json`, at their landed targets):
- **the share ensemble's ten:** S265-90, S291-db, S129-90, S129-db, S211-db, S211-75pdb (S211-75's plan with the panel's DB
  pension the second person's, as the ensemble built it), S237-90, S015-db, S019-90 and S129-75;
- **four plain 60/40 couples without a DB** (the reviewer at the ensemble's read, finding 1): S043-gain (68 and 65),
  S183-spa67 (55 and 52), S389-gain (50 and 47) and S265-spa67 (45 and 42).

## The shares and the arms

**The grid.** Each unit is solved at the first-person shares 0.5, 0.6, 0.7, 0.8 and 0.9, and at its pots' share where that
is not among them (0.75 on the 75/25 units).

**Each solve** is `solveCouple`'s own `share` on the couples' candidate as stage C solved it:
- the app's candidate less the tie-break (`audit-couples-share.mjs` `COUPLES_CANDIDATE`), at 45 points and estate weight
  0.02;
- each person's table solved with the partner's age;
- the engine run with arm A's MPAA ages, as stage C's audit does.

**The arms, all run on the same first 4,000 paths of seed 7002:**
- **APP:** the app's rules, arm A's pick on the unit's plan.
- **Every share on the grid.** For each, the solver's own forecast at the start is kept: the score of the joint move
  `chooseJoint` picks at year 0 from the household's opening state. That is the value the rollout maximises. It is the
  chance, by each person's own table, that both halves last, plus the estate and cut terms; each table sees only its own
  person's money, so its level is not a household's survival and only its order across the shares is tested.
- **MEANS:** the share by each person's means, the first person's means over both. Each person's means are their pots, the
  contributions they still pay until they retire, their state pension from the state pension age and their other incomes,
  each discounted at 2.5% real over the plan's years, as the reviewers counted them. Rounded to two places, and the grid's
  arm reused where it falls on the grid.

**The light passes.** Each grid share is also solved at two lighter settings, and only their forecasts are kept, for
D103's first route (no engine run):
- `light15`: 15 wealth points;
- `light6`: 6 wealth points on the light lattice (`adaptiveLattice` 48 by 9 by 32).

**The picks:**
- **the full pick:** the grid share with the highest full forecast, a tie going to the pots' share, then to the lowest share;
- **the light picks:** the grid share with the highest forecast at each light setting, ties broken the same way;
- **the pots' share:** today's rule;
- **the best share:** the grid share with the highest simulated survival, a tie going to the full pick, then to the pots'
  share, then to the lowest share.

**Picked in sample, the best share flatters itself.** It is the highest of five or six noisy figures, so even when every
share is truly as good as the pick, it beats the pick by about a third of a point on 4,000 paths (the reducer's planted
check shows it). So the pooled part of (i) chooses the best share on one half of the paths and measures it on the other
half, both ways round. The in-sample figure is printed beside it.

**Cost.** About 16 core-hours, from the share ensemble's own times: about nine minutes a share, most of it the engine's
4,000 paths. Per unit that is five to seven shares in full with their engine runs, plus ten or twelve light solves. That
is about four and a half hours on four free cores.

## How it is read

`reduce-share-choose.mjs`, once, after its gate. The gate requires:
- every unit in every arm;
- one code and one audit stamp;
- seed 7002 and 4,000 paths in every arm;
- each arm on its share;
- the pots' share and the means share as defined;
- every forecast finite.

Each comparison is paired on the same paths (`survivalChangeU`: the change in points and its 95% interval). Each pooled
figure adds the units' paired cells into one table (`pooledSummed`, the pooled floor's method since 7u), so each unit
weighs by its paths.

**The rule:**
- **(i) The forecast's pick.**
  - On each unit, the best share's advantage over the full pick must not be beyond 0.5 points: it fails where the 95%
    interval's lower end lies above 0.5.
  - Pooled over the fourteen, the advantage must be under 0.2 points (D4's targets). Here the best share is chosen on one
    half of the paths (the first 2,000, then the last 2,000) and scored against the pick on the other half.
- **(ii) The pick against today's share.**
  - Pooled over the fourteen, the full pick's change against the pots' share must have its 95% interval's lower end above
    -0.1.
  - No unit's change may be below -0.5 points with its interval wholly below 0.
- **(iii) Beside the pick: the means share.** The full pick's change against MEANS, pooled and by unit. It decides between
  the options only as stated below.
- **(iv) The light passes, for D103.** For each light setting:
  - the full survival at the light pick, less that at the full pick, must not fall below -0.5 points beyond noise on any
    unit (its interval's upper end above -0.5);
  - pooled, the mean must be above -0.2.

**The outcomes:**
- **THE SOLVER CHOOSES** if (i) and (ii) hold. `shareRule: 'choose'` is built with D103's speed work, using a light pass
  where (iv) holds for it, then a registered test of the choice against today's rule. Its registration goes to the
  maintainer before launch.
- **THE FORECAST MISSES** if (i) fails: the forecast does not rank the shares as the simulation does. This goes to the
  maintainer with (iii)'s figures, the fixed means share being the other option offered, and nothing is built for the app.
- **BEHIND TODAY'S SHARE** if (i) holds and (ii) fails: the pick is near the best share tried but worse than today's
  beyond the bar, pooled or on a unit. To the maintainer.
- **Either way**, if MEANS beats the full pick pooled by more than 0.2 points with its interval's lower end above 0, that
  is said first in the read and goes to the maintainer.

**Beside the rule, deciding nothing:**
- each unit's survival at every share, the forecasts in order beside them, and the rank agreement between the forecast and
  the simulation (Kendall's tau);
- a pick by simulation instead of by the forecast: the share best on the first 1,000 paths, scored on the other 3,000
  against the pots' share and against the forecast's pick (the next design to try if the forecast misses);
- the pick's spending delivered, pot left and lifetime tax against the pots' share;
- the solve time of the full grid against one share, and of each light pass plus one full solve (the units run four at a
  time, so these are a guide);
- paths failing in the last year with the pot below the minimum;
- the share ensemble's arms that this run repeats on the same code (b7cd77e5ebec): the same path for path, in survival and
  estate, or not.

## Launch

On frozen code, through the launcher, while nothing else runs:
`PREDICTION="none:EXPLORATORY: the solver choosing a couple's share, stage A (SHARE-CHOOSE.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-share-choose.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.
