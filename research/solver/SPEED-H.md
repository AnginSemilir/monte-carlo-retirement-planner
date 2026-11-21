# The speed mode on the household plan (D135's change of default, the reviewer's finding 5; EXPLORATORY, seed 7002)

Committed before launch. It decides nothing by itself. Its read goes to the maintainer as the trade it is: the time a path
saves against what it loses (D90 (2)), as SPEED-B's did.

## Why

Since D135 a couple the guard hands to the solver is solved as one household (`APP_COUPLE.household`, step 8's HSPA). The
speed mode ("Beta - speed mode", off by default; D97 (3)) hands every solve the chooser's shortlist, and since the change
the household's one table takes it, as a single's does.

The couples' warning ("usually only a little faster, it spent a little less, and for some couples it lowered the chance your
money lasts by about 5 in 1,000") was measured on today's two-table route (SPEED-B, `results-speed-b.txt`). On the household
nothing was measured. On S025-own at light settings, 185 of 200 paths end differently with it on (the agent's scratch,
confirmed by the reviewer on the change of default, `reviews/2026-11-20-default-household.md` finding 5). The agent and
the reviewer both put measuring it before the batch merges.

## Units

SPEED-B's twelve couples, at their landed targets in the couples' re-run panel (`couples-panel-d4b.json`):
- the library's cohort: S031, S047, S063, S097, S115, S133;
- the younger cohort: S301F, S305F, S307F, S319F, S321F, S325F.

Each is on the guard, and the household plan takes each at 'pensionsPA' (no refusal, k `1.667`, each setting its own
minimum pot). Reusing SPEED-B's units puts its couples' figures, on today's route, beside these, deciding nothing.

## The arms

Each couple is solved twice as the page solves it at the default: the plan cut at 'pensionsPA'
(`src/solverCouple.js` `householdCut`), its one table solved by `solveForApp` at the app's 45 points inside the cut's
bands (`bandsAt`), and the household assembled (`householdSolved`).
- **WHOLE:** the plan as it stands;
- **SPEED:** the plan with the speed mode on (`src/solverSettings.js` `withSpeed`: `chooserShortlist: 'order'` reaches the
  household's table as the page hands it).

The shortlist changes no table, so each unit records its table's digest in both arms, and the reducer refuses a unit
whose digests differ. Both arms run by the engine on the same 4,000 paths of seed 7002: the household's context as the page
builds it (`solverStrategy.js` `solvedContext`), stepped by `audit-phase4.mjs` `runPath`, as step 8's audit and the port's
identity ran it.

Stored for each path: survival, the spending delivered, the pot left and lifetime tax. Also stored: each arm's milliseconds a
path (the units run four at a time, so the times are a guide), and the unit's cap, the household table's estate cap.

**Cost.** About two core-hours: a unit's two solves and its two runs of 4,000 paths at about 55 ms a path, about ten minutes.
Under an hour on four free cores.

## How it is read

`reduce-speed-h.mjs`, once, after its gate. The gate requires:
- every unit in both arms;
- one code and one audit stamp;
- seed 7002, 4,000 paths and 45 points in every arm;
- each arm's speed mode as named, its one table's shortlist with it;
- the household's table the same in both arms;
- each unit a household at 'pensionsPA'.

SPEED against WHOLE, paired on the same paths, as SPEED-B's couples (`reduce-speed-b.mjs` `rule`):
- **survival:** the change by unit (`survivalChangeU`) and pooled (`pooledSummed`);
- **spending delivered:** the pooled mean over the paths, in percent;
- **the pot left:** each unit's mean, SPEED over WHOLE in percent, averaged; **the capped pot** the same on each path's pot
  held to the unit's cap;
- **the time:** each unit's milliseconds a path, SPEED over WHOLE.

## The rule

Item 7's rule (`TIE-A.md`), as SPEED-B's for each group. The speed mode holds on the household if all four hold:
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no unit's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05% either way;
4. the pooled mean pot left is not lower by more than 0.5%, and the capped pot not lower by more than 0.1%.

**The outcomes:**
- **HOLDS:** the speed mode loses nothing beyond item 7's bars on the household. To the maintainer with the time it saves;
  the couples' warning was measured on today's route, so its words are the maintainer's to keep or change.
- **LOSES** (naming the parts that fail): to the maintainer with the figures. The warning stays, and whether the speed mode
  stays offered to couples is the maintainer's.

**Beside the rule, deciding nothing:** each unit's figures in both arms; lifetime tax; the time saved by unit; the cohorts
apart; and SPEED-B's couples' figures for the same units on today's route (`results-speed-b.txt`, its run of 15 Nov,
before LOOKHOLD), quoted from that file.

## Launch

On frozen code, through the launcher, once the savings split's v2 has freed the cores and before B1's gate:
`PREDICTION="none:EXPLORATORY: the speed mode on the household plan (SPEED-H.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-speed-h.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.

Box: half a day to build, smoke, run and read. If it has not read by then, stop and report.
