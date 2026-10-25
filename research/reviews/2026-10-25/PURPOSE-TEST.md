# The purpose test on the latest candidate (EXPLORATORY), 25 Oct

The maintainer's question (25 Oct): does the solver choose very close to the best of the moves it has? The missing-moves
check (`../2026-10-24/MISSING-MOVES.md`) asked about moves the menu lacks. This asks about the moves it has.

## The test

- **The method:** the agent's own purpose test, `research/solver/audit-bestof-cand.mjs` (PLAN.md M18's method; D4's second
  measure). It had not yet run on the candidate.
- **The code:** the agent's at 52b0b6c, where the third step is ported (D28) and the e3pcls pin is current. Three changes
  (`scripts/audit-bestof-latest.diff`):
  - the latest candidate's settings: 45 wealth points (D26), HR (`menuPlus: ['hr']`, D27) and the third step
    (`tiersBelow: 3`, D28);
  - a plant, read from the same simulations at no extra cost: the last distinct rival stands in for the chooser's pick;
  - the output goes to a folder the caller names.
- **The run:** V3's seven households at weight 0.02 and the candidate's lambda, two at a time (`scripts/ptq.sh`):
  - 20 positions each household's policy reaches, half of them on the cliff;
  - at each, the top 6 distinct moves by the chooser's own scores;
  - each move simulated on 800 fresh paths: the best picked on 400, then measured on the other 400 against the
    chooser's pick.
- **D4's measure:** the rival best on the first half is ahead of the pick on the second half beyond 2 paired se, at no
  more than 5% of positions. If every move were equally good, about 2% of positions would show this by chance.
- **The read:** `scripts/purpose-read.mjs` reads the files. It throws unless every unit ran on the same settings.

## The prediction, written before the results

- **Survival:** beyond 2 se at no more than 3% of the 140 positions. The September run, on an older solver at 30 points,
  found 1 of 159.
- **The whole score:** beyond 2 se at 3% to 10%, nearly all by under 0.1 points. Where a household is near certain to
  last (S002), small differences in the estate are measured precisely. The September run found 7.5% on its objective.
- **The plant:** seen in at least one yardstick at over 10% of positions. If it is not, the test cannot tell a near-best
  pick from a sixth-best one, and a pass says little.
- **What would matter:** survival beyond 2 se at over 5% of positions, or whole-score advantages above 0.2 points (the
  tables' own error) at more than a few. Either would mean the chooser leaves gains on the table among its own moves.

## The results

Printed by `scripts/purpose-read.mjs` in `results-purpose-test.txt`. Five of the seven households ran: S362 and S002
were dropped at the maintainer's call (25 Oct 18:31) to start the speed work, and S330 ran in two halves.

| household | positions (on the cliff) | the best rival less the pick on the measuring half: survival, whole score (means) | beyond 2 se: survival, whole score | the plant beyond 2 se: survival, whole score |
|---|---|---|---|---|
| S224 | 20 (10) | -0.04, -0.003 | 0, 2 | 1, 4 |
| S248 | 20 (10) | -0.05, -0.034 | 0, 1 | 2, 5 |
| S330 | 20 (10) | +0.10, +0.108 | 1, 0 | 0, 3 |
| S370 | 20 (10) | -0.14, -0.235 | 0, 1 | 0, 2 |
| S380 | 20 (10) | -0.06, -0.140 | 0, 0 | 0, 2 |

- **Over the 100 positions:**
  - survival beyond 2 se at 1 (1%), the mean advantage -0.037 points (se 0.042);
  - the whole score beyond 2 se at 4 (4%), by +0.085, +0.054, +0.005 and +0.002 points;
  - both within D4's 5%.
- **The one survival flag** is S330 at the plan's start: the chooser's second choice ahead by +1.00 point on its 400
  paths (se 0.498, just over 2 se), where the chooser's own scores put the two 1.63e-4 apart. The same start was drawn
  twice more, on other paths: there the best rival was level with the pick (+0.00) and 0.25 points behind it. Noise
  at a near-tie.
- **The plant:**
  - the whole score sees it, at 16 positions (16%);
  - survival barely does, at 3. The top six distinct moves are usually within a point of each other in survival, so
    on 400 paths a half the test cannot tell them apart.
- **Against the prediction:** all three held. Survival at 1% (predicted no more than 3%); the whole score at 4%, every
  flag under 0.1 points (predicted 3% to 10%, nearly all under 0.1); the plant seen at 16% in the whole score (predicted
  over 10% in one yardstick).
- **What it means:**
  - Among its own moves, the chooser picks the best or one indistinguishable from it, at every position tested.
  - Where its choices differ, they differ by less than this test can see in survival, about a point at a position, so
    which of its top moves it takes matters little.
- **Not run:** S362, S002 and the weight 0.01.
