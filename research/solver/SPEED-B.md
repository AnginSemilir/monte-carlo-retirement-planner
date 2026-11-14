# The speed mode on more singles and couples (D97 (3); EXPLORATORY, seed 7002)

Committed before launch. It decides nothing by itself: its read goes to the maintainer as the trade it is, the time a path
saves against what it loses (D90 (2)), for singles and for couples apart, since the speed mode warns each differently.

## In plain words

The speed mode ("Beta - speed mode", off by default; D97 (3)) works a plan's figures out about twice as fast. In each
simulated year it scores only a shortlist of choices, the ones its tables already favour, instead of every choice. It was read
on twelve singles (item 7, `results-tie-a.txt`) and on eight couples (item 12's stage A, `results-item12-a.txt`), where it lost
a little survival and, for couples, a little spending. The maintainer asked for a wider read before it is more than a beta.
This one takes twenty more singles and twelve more couples, none of them in either earlier read, and runs each plan with and
without the speed mode on the same simulated paths.

## Units

- **20 singles** from Phase 4's panel (`phase4-panel.json`, at their landed targets), leaving out the review's eight that items
  7 and 13 used: the first ten of the library's cohort left (S026, S040, S062, S074, S096, S108, S132, S164, S204, S228) and the
  first ten of the younger cohort left (S306F, S308F, S310F, S314F, S316F, S320F, S322F, S326F, S332F, S334F).
- **12 couples** from the couples' re-run panel (`couples-panel-d4b.json`, at their landed targets), leaving out the eight of
  the couples' tier test and of `TIE-C.md`: the first six of the library's cohort left (S031, S047, S063, S097, S115, S133) and
  the first six of the younger cohort left (S301F, S305F, S307F, S319F, S321F, S325F).

## The arms

Each plan is solved twice by the app's own route (`solveForApp`; a couple by `solveCouple` with the pots' share, each person's
table as the page solves it):
- **WHOLE:** the plan as it stands;
- **SPEED:** the plan with the speed mode on (`src/solverSettings.js` `withSpeed`: `chooserShortlist: 'order'` reaches the
  solve as the page hands it, for a couple each person's table).

The shortlist changes no table, so each unit records its tables' digests in both arms, and the reducer refuses a unit whose
digests differ. Both arms run by the engine on the same 4,000 paths of seed 7002: a single by `solverStrategy.js` `runPath` on
its solved plan, as the Strategy tab runs it; a couple by the engine with its joint move.

Stored for each path: survival, the spending delivered, the pot left and lifetime tax; for each arm, the engine's milliseconds
a path (the units run four at a time, so the times are a guide); and each unit's cap, a single's estate cap and a couple's two
caps added.

**Cost.** About 9 core-hours: a single's two solves and two runs take about ten minutes, a couple's about eighteen. That is
about two and a half hours on four free cores.

## How it is read

`reduce-speed-b.mjs`, once, after its gate. The gate requires:
- every unit in both arms;
- one code and one audit stamp;
- seed 7002 and 4,000 paths in every arm;
- each arm's speed mode as named;
- each person's table the same in both arms.

For each group, singles and couples, SPEED against WHOLE, paired on the same paths:
- **survival:** the change by unit (`survivalChangeU`) and pooled (`pooledSummed`);
- **spending delivered:** the pooled mean over the group's paths, in percent;
- **the pot left:** each unit's mean, SPEED over WHOLE in percent, averaged; **the capped pot** the same on each path's pot
  held to the unit's cap;
- **the time:** each unit's milliseconds a path, SPEED over WHOLE.

## The rule

Item 7's rule (`TIE-A.md`), for each group. The speed mode holds for that group if all four hold:
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no unit's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05% either way;
4. the pooled mean pot left is not lower by more than 0.5%, and the capped pot not lower by more than 0.1%.

**The outcomes, for each group:**
- **HOLDS:** the speed mode loses nothing beyond item 7's bars there. To the maintainer, with the time it saves: whether it
  stays a beta, loses that group's warning, or becomes the default is the maintainer's.
- **LOSES** (naming the parts that fail): to the maintainer with the figures; the warning stays and nothing changes.

**Beside the rule, deciding nothing:** each unit's figures in both arms; lifetime tax; the time saved by unit; the groups'
cohorts apart.

## Launch

On frozen code, through the launcher, after `TIE-C.md`'s run frees the cores:
`PREDICTION="none:EXPLORATORY: the speed mode on more singles and couples (SPEED-B.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-speed-b.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.
