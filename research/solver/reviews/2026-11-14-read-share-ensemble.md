# Review at the read: the share ensemble (`SHARE-ENSEMBLE.md`; EXPLORATORY, seed 7002), read 14 Nov

Subject: the read of the share ensemble, the one test the deep review of item 6's stage C proposed
(`reviews/2026-11-14-deep-couples-share.md` section 4): its results file `results-share-ensemble.txt` (outcome THE SHARE'S
MEASURE) and the read's commit 62aa31ca, against the rule committed in ed29f25d, the code and the stored arrays. The agent's
write-up is not yet written; the findings say what a fair one must carry.

Read (blobs at HEAD 62aa31ca unless named): `SHARE-ENSEMBLE.md` f4f4e16d, `audit-share-ensemble.mjs` cc56ad64,
`reduce-share-ensemble.mjs` 311ad474, `batch-share-ensemble.sh` aada7214, `results-share-ensemble.txt` 7211cf7f,
`audit-couples-share.mjs` ac476126, `audit-couples.mjs` f50aa99d, `audit-phase4.mjs` 5ace8395 (`runPath`), `stats.mjs`
7cf309da (`survivalChangeU`), `fair-gate.mjs` 4d4a2040, `couples-share-panel.mjs` 2476bda6 and `.json` 16ec3d23,
`src/solver/couple.js` e1bb437b (`shareFor`, `singlePlanFor`, `solveCouple`, the joint score l.383 and l.515),
`src/solver/solve.js` fb875426 (l.597-608), `src/solverApp.js` 484d5c38, the deep review 08e8a100, `SHARE-A.md` 1a978f33 and
`results-share-a.txt` 1cfd424f, `runs.log`, `results/share-ensemble-launch-1.log`, the ten `case*.txt` logs and `*.json.gz`
units in `results/share-ensemble-7002/`, and the `ran` field alone of stage C's `results/share-c-run/*-cands.json.gz` (a run
already read). Nothing of seed 7021, `d4-backup` or `d4b-backup` was opened; no solve or path was run.

Ran (read-only scripts in the session scratchpad's `se/`): `node reduce-share-ensemble.mjs` again (its output `cmp`-identical
to the results file) and `--planted` (all eight pass); `r1.mjs` an independent decode of the arrays (every survival, paired
change, minimum-pot count and mean in the file reproduced; (c) 1.9778); `r2.mjs` each arm's two settings lines against
stage C's CANDS; `r3.mjs` each unit's means by person from `E.buildContext` (the deep review's `res.mjs` arithmetic); `r4.mjs`
failures by kind, every arm against APP, adjacent shares; `r5.mjs` the selection bias (a within-path permutation null and a
split-sample pick); `r6.mjs`, `r7.mjs` the S211-75pdb plan and the plans' `solver` fields.

Verdict: PASS

## What was checked and holds

- **Read once, by the rule as committed.** All thirteen `STAMP_FILES` have the same blob at ed29f25d, at the launch commit
  edb5f861, at the read 62aa31ca and in the working tree; `stampFilesHash()` recomputes to 9adb8c1e7fca; every unit's log
  stamp is `code b7cd77e5ebec audit 9adb8c1e7fca prediction none`, the launch log's (through `run-from-snapshot.sh`, smoke
  passed) and `code-id.mjs` now; nothing the audit imports changed between ed29f25d and edb5f861. Runs done 16:08 UK, the read
  committed 16:09:53. The reducer's gate, its `beats` (`d > 0.5 && lo > 0`, the Newcombe interval of `survivalChangeU`),
  (a), (b), (c) (the mean over the nine units of the best share's gain, ties to the rule's) and the verdict order are the
  document's. By hand: (a) S291-db and S211-db; (b) S019-90; (c) (2.350 + 4.200 + 0 + 1.200 + 6.150 + 0.125 + 0.825 + 1.725 +
  1.225) / 9 = 1.978. The outcome follows.
- **The units are what the document names.** S211-75pdb's plan differs from S211-75's in one field, `otherIncomes`: the
  panel's DB record (£15,000, `otherTaxable`, from 68) with owner `Partner`; the engine reads it from the partner's own age 68
  to the end. Each rule's-share arm's two settings lines are stage C's CANDS lines for the same unit field for field
  (S211-75pdb against S211-75's); the other shares differ only in each person's `minPot`, by the share. The engine runs each
  arm with arm A's MPAA ages, as stage C's audit does; every arm of a unit has the same T and floor and runs one `paths`
  array; S129-90 and S129-75 share T 39 and the floor, so the beside figure is paired (APP's re-holding: 13 lost, 0 saved).
- **The commit message's "every share of every unit above the app's rules"**: every solver arm beats APP beyond noise,
  from +4.575 (+3.898 to +5.252; S211-db at 0.5) to +14.350 (S015-db at 0.7).

## Findings

1. **MINOR. Group (a) cannot separate the DB's means from the 40%-to-60% band.** The four DB units hold 60/40, where
   `shareFor` returns 0.5 because of the band (couple.js l.74), not because of the pots: 0.6 is the plain pots' share. At
   0.6, S211-db takes all of its best gain (+6.150), S291-db +3.625 of +4.200, S129-db +0.925 of +1.200, S015-db +1.475 of
   +1.725. Stage A's six 60/40 couples without a DB also survived more at 0.6 than at 0.5, six of six (+1.0, +0.4, +2.0,
   +1.4, +1.6, +0.6: differences of the printed survivals in `results-share-a.txt`'s as-held rows, 500 paths, code of 10 Nov,
   not a paired test of their own). This run has no plain 60/40 unit. And S211-75pdb, at 98.40% under the rule's share with 64
   paths failing, had room for 1.6 points at most, so (a) rested on S211-db and S291-db. A fair write-up says group (a) shows
   the half share is not the best for these 60/40 couples, and that whether the DB income or the band is the cause is not
   measured.

2. **MINOR. The means predict the best share on 7 of 9 units, but so do the alternatives, and the two units that tell them
   apart split.** The first person's means (pots, contributions to come, state and DB pensions to the plan's end; `r3.mjs`) at
   2.5% real (undiscounted): S265-90 0.701 (0.652), S291-db 0.654 (0.680), S129-90 0.864 (0.837), S129-db 0.630 (0.646),
   S211-db 0.647 (0.668), S211-75pdb 0.609 (0.547), S237-90 0.837 (0.812), S015-db 0.692 (0.698), S019-90 0.805 (0.778).
   - At 2.5% real the tried share nearest the means is the best, or level with it, on 7 of 9. On S129-db it comes second
     (0.7 less 0.6 +0.275, +0.062 to +0.488). On S211-75pdb it is the worst: 0.65 less 0.75 is -0.450 (-0.770 to -0.156),
     and 0.55 less 0.65 is +0.575 (+0.277 to +0.873). Undiscounted, the two misses are S129-db and S129-90 instead. The
     measure is not pinned by the run.
   - A share for the first person of about 0.7 to 0.8, whatever the means, fits 8 of 9 (all but S129-90).
   - On S291-db, S129-db and S015-db survival is still rising at 0.7, the grid's edge, past each one's means, and beyond
     noise from 0.6 (+0.575, +0.275, +0.250). Their best share is not located.
   - S237-90 is not the counter-case the design named. Its second person's state pension matches their share at 0.9, but
     their contributions to come (£123k against £128k) put its means at 0.837, and the nearest share, 0.8, wins (+0.825).
   So the run shows the pots' share is not the best fixed share on 7 of 9 units, and it is consistent with the means. It does
   not single the means out. The write-up must not say a share from the means is shown best. Building it as an option is
   what the rule decides. Its registered test needs units where these readings part: plain 60/40 couples, shares above 0.7,
   and partner-DB couples landed near 85%. The means' discount rate must be fixed before the run.

3. **MINOR. The share moves each person's minimum pot too, which confounds (b) and the ninety group; and the document's
   premise fails on S129-90.** `singlePlanFor` scales the household's minimum pot by the share with the target (couple.js
   l.94, l.104). The settings lines show it. S129-90's second person must end with £108,000, £216,000 and £270,000 at 0.9,
   0.8 and 0.75, against £240,000 held today. S019-90's: £43,000, £86,000 and £107,500, against £95,000.
   - Where the floor is large, the changes sit at the minimum pot in the last year. The floors are 45% of the pots on S129
     and S019 and 20% on S237. S019-90 at 0.8 saved 49 paths, all in the last year (this is (b)'s beat). S129-90 at 0.75
     lost 134, none mid-plan. S237-90 at 0.8 saved 31 of 34 there, and S129-db at 0.7 saved 48 of 50.
   - Where the floor is small, the gains are mid-plan. S211-db at 0.6 saved 203 mid-plan and 49 in the last year; S291-db at
     0.7, 137 and 32; S265-90 at 0.75, 98 and 5.
   - Every last-year failure in every arm is a minimum-pot failure.
   - At 2.5% real both 0.8 and 0.75 lie further from S129-90's means (0.864) than 0.9 does. So for S129-90 the premise
     ("toward each person's means") does not hold, and S129-90 is no test of the means.
   The write-up must say the share here moved the spending and the floor together, and that (b)'s beat is both. Splitting
   the floor and splitting the spending are separate choices for the option's design.

4. **MINOR. The 90/10 holding costs the candidate 2.8 to 6 points at a fixed share; the app's rules do not lose it, and no
   share tried recovers it.** Recomputed, paired on the same paths:
   - S129-90 at 0.75 less S129-75 at 0.75: -5.950 (239 lost, 1 saved).
   - S129-90 at its best share (0.9) less S129-75 at 0.75: -2.775 (111 lost, 0 saved; 105 of the 111 at the minimum pot).
   - APP on the same re-holding: -0.325 (13 lost, 0 saved).
   So for S129, the largest shrink in the deep review's unexplained item 1 (-2.44), the share is not the cause: the rule's
   share is the best tried. On S265-90, S237-90 and S019-90 the best share recovers +2.350, +0.825 and +1.225 (with no 75/25
   anchor here to scale it). The condition SHARE-ENSEMBLE.md set for the joint estate weight as the next lead is met (311
   against 75 at the minimum pot), though the document sets it under NOT THE SHARE. The write-up should carry it as a lead,
   not a cause. The two units differ in the whole holding: each table's wealth, the joint weight (0.022 against 0.027 a pound
   of household wealth), each table's estate cap, and the second person's floor against what they hold. That is not a
   decomposition. S129-90 at 0.9 is still +9.625 over APP (+8.695 to +10.555): no harm against the app's rules.

5. **MINOR. The post hoc pick is small (`r5.mjs`).**
   - Under no share effect (each path's outcomes permuted across a unit's shares, 2,000 draws), the best of two or three
     shares gains 0.08 to 0.19 points a unit on average (95th percentile 0.25 to 0.55). (c) pools to 0.111 under it (95th
     percentile 0.189); it passes 0.2 in 3.2% of draws.
   - Choosing on half the paths and scoring on the other half gives (c) +1.933 (first and second halves) and +1.961 (even
     and odd), against +1.978 in sample. The halves pick the same share on 7 and 8 of 9 units.
   - The beats are 5.6 to 15.8 standard errors from nought.
   The outcome is not an artefact of the pick. The best shares are not optima, though: the grid's edge (finding 2) and one
   solve per share (finding 6).

6. **MINOR. A difference under about half a point between two shares may be the solve's own error, not the share.** Each
   share is one 45-point solve. S211-75pdb's survival is V-shaped in the share, beyond path noise (98.400, 97.950, 98.525),
   which no smooth effect of the share predicts. At that size the run cannot separate the share from the solve's
   approximation. The large gains (S211-db, S291-db, S265-90) are far beyond it.

7. **MINOR. What each arm records of its solve is built from names, not read back.** In fact the solve is stage C's.
   - Each unit's `candidate` is `hashOf(COUPLES_CANDIDATE)`, a constant (audit-share-ensemble.mjs l.86), so the gate's
     candidate check tests nothing about the solve.
   - The audit dropped stage C's `wantProblems`, `coupleProblems` and `d80Problems` checks (audit-couples-share.mjs l.183,
     l.187). Its `ran` line does not record COUPLE.flat, fast, the shortlist or the tie-break.
   - Checked instead: the settings lines, as above. Between stage C's launch (ce8ca278) and edb5f861 the code moved only in
     restored or split solves, the speed mode, and per-person locks (`tierCeilingPart`). Every unit's solver plan carries
     locks without `tierCeilingPart` and no `speed` field, so none of these reaches these solves.

8. **MINOR. The run cannot speak to the solver choosing the share, or to the joint estate weight.** The arms store the
   engine's outcomes alone, with no forecast from the model and no rollout beside the engine (stage C's CANDS had one). So
   whether the model ranks the shares as the engine does is unknown, and a solver choosing its own share would need exactly
   that. The joint weight (`A.wB`, from the first person's own opening wealth, solve.js l.604-606) does not change with the
   share within a unit, so the ensemble holds it fixed.

## What a fair write-up must say

- The outcome by the rule, THE SHARE'S MEASURE, with its figures. Another fixed share beats the rule's by more than 0.5
  points on 7 of 9 units. The rule's share is best on S129-90 and level-best on S211-75pdb. Every share of every unit is
  above the app's rules.
- Which share wins and why, each with its caveat:
  - (a) is two 60/40 DB units where the band, not the pots, set 0.5 (finding 1).
  - (b) is the minimum pot as much as the spending (finding 3).
  - The means fit 7 of 9, but a share of 0.7 to 0.8 for the first person fits 8 of 9. On the partner-DB unit the share
    nearest its means is the worst. On three DB units survival still rises past the means (finding 2).
- The holding's own effect on S129 (-2.775 at its best share, APP -0.325), which no share reaches, with the joint estate
  weight as a lead and no decomposition (finding 4).
- No claim that the means share is shown best, that the share explains the deep review's unexplained items beyond the DB
  units and three of the 90/10 couples, or that the best shares found are optima.
- For the maintainer's call on whether the guard should read incomes: no share tried on any unit fell below the app's rules.
  On the case D99's guard was least sure of (the partner's pension income, the partner holding fewer of the pots), the pots'
  share did best or level, and the share nearest the means did worse.
