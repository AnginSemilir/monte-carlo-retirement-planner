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
