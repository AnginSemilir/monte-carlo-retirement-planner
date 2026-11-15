# A couple's tie rule above the estate caps, stage A's read (D97 (2); EXPLORATORY, seed 7002)

Committed before launch. By D97 (2) and D98, a pass of the rule as written here is the maintainer's ruling naming this run:
the tie rule joins the couples' candidate at the margin the rule takes, with the reviewer on the change of default. A failure
is reported, the rule is closed, and nothing is run again to pass it.

## In plain words

The solver values what a household leaves only up to a cap: four times what each partner opened with. Above it, an extra
pound left is worth nothing to the solver's score, so between two choices that are otherwise equal it has no reason to
prefer the one that pays less tax. For a single, a tie-break has handled this since D95: above the cap, among choices that
score almost the same and spend the same at the same risk, take the one that pays the least tax this year. It cannot reach a
couple, whose year is a joint move of the two partners.

This read tests the same tie-break for couples (`couple.js` `tieJoint`, built off in code; `couple-tie.test.mjs`). It acts
only where both partners are above their caps, and it changes only where the money is drawn from and moved to, never the
spending or the risk held. The questions: does it leave more in the pot and pay no more tax, with survival, spending and the
capped pot unchanged?

## Units

The eight couples the couples' tier test used (`COUPLE-TIERS.md`), from the couples' re-run panel (`couples-panel-d4b.json`)
at their landed targets:
- four of the younger cohort, retiring at 52, whose pots end far above their caps: S309F, S311F, S317F, S323F;
- four of the library's: S189, S293, S011, S083.

## The arms

Each couple is solved once:
- the couples' candidate as the app solves a couple since D99 (`audit-couples-share.mjs` `COUPLES_CANDIDATE`, `shareRule:
  'pots'`, 45 points, estate weight 0.02, each person's table with the partner's age, arm A's MPAA ages).

All three arms take those same tables. Each unit records each person's table digest before the first arm and after the
last, and the reducer refuses a unit whose digests differ. Every arm is run by the engine on the same 8,000 paths of seed
7002:
1. **CANDS:** the candidate as it stands;
2. **TIE5:** with the tie rule within 0.001 points of score (`tieJoint` 1e-5);
3. **TIE4:** with it within 0.01 points (`tieJoint` 1e-4), the singles' margin (D85).

Stored for each path: survival, the year it failed, the pot left, lifetime tax and the spending delivered. Beside them, each
unit records the household's cap: the two people's own caps added.

**The replay** (the first 100 paths). Along CANDS's own path in the exact model, at each decision before the plan's last
year, the choices of TIE5 and TIE4 against CANDS's. Counted: the decisions that differ, and of those the ones at another
spending level, at another tier pair for either person, or where either person is at or below their cap. Beside the rule:
those paying more tax that year.

**Cost.** About 6 core-hours: one couple solve and three runs of 8,000 paths a couple. That is about an hour and a half on
four free cores.

## How it is read

`reduce-tie-couple.mjs`, once, after its gate. The gate requires:
- every unit in every arm;
- one code and one audit stamp;
- seed 7002 and 8,000 paths in every arm;
- the couples' candidate stage C ran;
- each arm's margin as named;
- each person's table the same before the first arm and after the last.

For arm X against CANDS, on the eight, each comparison paired on the same paths:
- **survival:** the paired change (`survivalChangeU` by couple; `pooledSummed` pooled);
- **spending delivered:** the pooled mean over every couple's paths, X against CANDS, in percent;
- **the pot left:** each couple's mean pot left, X over CANDS, in percent; pooled, the couples' figures averaged;
- **the capped pot**, as the solver scores it: the same, on each path's pot held to the household's cap;
- **lifetime tax:** each couple's mean; pooled, the couples' means averaged.

## The rule

An arm passes if all seven hold, against CANDS (item 13's rule, `TIE-A.md`, for a couple):
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no couple's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05% either way;
4. the capped pot is not lower by more than 0.1% pooled, nor by more than 0.5% on any couple;
5. no couple's mean pot left is lower by more than 0.1%;
6. pooled lifetime tax is not higher;
7. in the replay, no differing decision is at another level, at another tier pair for either person, or with either person
   at or below their cap. One is a bug in the rule or the audit: STOP.

If both pass, TIE4 is taken, unless the two pooled mean pots are within 0.5% of each other: then TIE5, the smaller margin.
If one passes, that one.

**The outcomes:**
- **PASSES:** by D97 (2) and D98, the ruling naming this run. `tieJoint` joins the couples' candidate at the margin the rule
  takes (`src/solverSettings.js` `APP_COUPLE` with the decided-defaults block and the test that pins them), with the
  reviewer on the change of default before it is committed.
- **FAILS:** the rule is closed and reported; nothing changes. Part 7 failing is a STOP, reported as a bug.

**Beside the rule, deciding nothing:** each couple's figures in each arm; the replay's decisions paying more tax that year;
the years above both caps on each couple's paths; the pot and the tax by cohort.

## Launch

On frozen code, through the launcher, after D100's stage A (`OTHER-ORDER.md`) frees the cores:
`PREDICTION="none:EXPLORATORY: a couple's tie rule above the estate caps, stage A (TIE-C.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-tie-couple.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.
