# The share ensemble (the deep review of item 6's stage C, 14 Nov, section 4; EXPLORATORY, seed 7002)

Committed before launch. It decides nothing in the code by itself: an outcome below reaches the code only by the rule's own
"what each outcome changes", and a new default only by a registered test.

## In plain words

When a couple holds its money unevenly, the solver now gives each partner a share of the household's spending in
proportion to the pots each holds today (`shareRule: 'pots'`, D99). The deep review of stage C asked whether "the pots held
today" is the right measure. It does not count each partner's state pension, a final-salary (DB) pension or the
contributions still to come.

This test tries a few other shares on ten of stage C's couples and sees whether any keeps the money lasting clearly more
often than the rule's share does. If shares nearer each partner's whole means win, a means-based share is worth building
and testing properly. If not, the pots' share stands.

## The question

On the couples stage C tested, does a share of the spending other than the pots' share keep a couple solvent more often,
beyond D4's targets (0.5 points a unit, 0.2 pooled)?

## Units and shares

The units are stage C's (`couples-share-panel.json`), each at its landed target; the pots' share comes first in each row.

| group | units | shares |
|---|---|---|
| db | S015-db, S129-db, S211-db, S291-db (60/40, a £15,000 DB pension the elder's) | 0.5, 0.6, 0.7 |
| ninety | S129-90 and S019-90 (the largest losses at 90/10, both at the minimum pot), S265-90 (still working), S237-90 (the counter-case: no state pension beyond its share) | 0.9, 0.8, 0.75 |
| anchor | S129-75 (the same couple at 75/25) | 0.75 |
| partnerdb | S211-75pdb: S211-75's plan with the panel's £15,000 DB pension the second person's, from the state pension age (built here, not landed: the reviewer at the read's least covered case) | 0.75, 0.65, 0.55 |

**The arms.** Every unit also runs APP beside it: the app's rules, arm A's pick on the unit's own plan, as stage C's APP.

**How each share is solved.**
- Each share is `solveCouple`'s own `share` option on the couples' candidate as stage C solved it. That is the app's
  candidate less the tie-break (`audit-couples-share.mjs` `COUPLES_CANDIDATE`), at 45 points and estate weight 0.02.
- Each person's plan is the one `audit-couples.mjs` `solverPlan` builds, and each table is solved with the partner's age
  (`solveForApp`).
- The engine runs the couple with arm A's MPAA ages, as stage C's audit does.
- The first share in each row is the one the pots give (`shareFor`). The audit refuses a unit where it is not.

**Seed and paths.** 7002, the first 4,000 paths. Every arm of a unit runs on the same paths.

**Cost.** From stage C's recorded times, about 5.4 core-hours for the 28 solver arms; allow 7, about two hours on four
free cores.

## How it is read

`reduce-share-ensemble.mjs`, once, after its gate. The gate requires:
- every unit in every arm;
- one code and one audit stamp;
- seed 7002 and 4,000 paths in every arm;
- each arm's share the one named above;
- the first share in each row the pots' share.

**On each unit:**
- survival at each share;
- each other share against the pots' share, paired on the same paths (`survivalChangeU`: the change in points and its
  95% interval);
- the best share, the one with the highest survival (a tie goes to the pots' share), and its gain over the pots' share.

"Beats the pots' share" means: the change is more than 0.5 points and its 95% interval lies above 0. A share other than
the pots' is, in each row, a share toward each person's means: each moves toward what each partner holds once incomes
are counted.

**The rule.**
- **THE SHARE'S MEASURE**, if all three hold:
  - (a) on at least two of S211-db, S291-db and S211-75pdb, some other share beats the pots' share;
  - (b) on S129-90 or S019-90, some other share beats the pots' share;
  - (c) pooled over the nine units that have other shares, the best share's mean gain over the pots' share is more than
    0.2 points.
- **NOT THE SHARE**, if on every unit the best share's gain over the pots' share is under 0.5 points, and pooled under
  0.2.
- **MIXED** otherwise, named by which of (a), (b) and (c) held.

**Beside the rule, deciding nothing:**
- S129-90 at 0.75 against S129-75 at 0.75, paired on the same paths. This is the holding's own effect at one share.
- Each arm's survival against APP.
- Each arm's paths failing in the last year with the pot below the minimum.
- Each arm's mean lifetime tax, mean pot left and mean spending delivered.

## What each outcome changes

**THE SHARE'S MEASURE.**
- A share from each person's means is built as an option, off in code: their pots, contributions to come, and state and
  DB pensions.
- It becomes the couples' default only after a registered test reads, as `'pots'` did.
- Meanwhile D99 stands for what stage C held, since no harm was found there.
- The D-line says the guard reads the pots alone. Whether the guard should read incomes until then is the maintainer's
  call.

**NOT THE SHARE.**
- The pots' share stands as tested.
- If S129-90 at 0.75 still loses to S129-75 at 0.75 at the minimum pot, the joint estate weight is the next lead. That is
  the weight the joint move takes from the first person's table, which D99's guard holds to the elder entered first.

**MIXED.** Each group's outcome decides its own half, as above.

## Launch

On frozen code, through the launcher, after the release gate has finished with the machine:
`PREDICTION="none:EXPLORATORY: the share ensemble (SHARE-ENSEMBLE.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-share-ensemble.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.
