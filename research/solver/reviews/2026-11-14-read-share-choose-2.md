# Review at the read, again: the solver choosing a couple's share, stage A (`SHARE-CHOOSE.md`; D102; EXPLORATORY, seed 7002)

Subject: the write-up revised to answer the first review's FAIL (`reviews/2026-11-14-read-share-choose.md`, one BLOCKING
and four MINORs; one fix round, D81 (F)): the rewritten report `reports/2026-11-14-share-choose-read.md` and
`share-choose-beside.mjs`'s new sections C to G with their output, against the two results files, the stored arrays and the
code.

Read (blobs; the report, the beside script, both results files and the first review untracked): `reports/2026-11-14-share-choose-read.md` 06f24813,
`share-choose-beside.mjs` e782fdde, `results-share-choose-beside.txt` 4d863949, `results-share-choose.txt` f9f06203
(unchanged since the first review), the first review d32ccc42; `audit-share-choose.mjs` 7106e04f (`CHECK`, the engine's clock
l.105-121), `reduce-share-choose.mjs` 9d53ead2 (`pickOf`, `bestOn`, `SIM`), `stats.mjs` 7cf309da, `audit-share-ensemble.mjs`
cc56ad64 (`planOfUnit`), `src/solver/couple.js` 0eb988c1 (`SHARE_BAND`; at the launch e1bb437b, `singlePlanFor` l.104),
`runs.log` l.368; the 14 units in `results/share-choose-7002/`. Nothing of `results/other-order-7002/`, seed 7021,
`d4-backup` or `d4b-backup` was opened; no solve or path was run.

Ran (read-only, one process at low priority beside OTHER-ORDER; my scripts in the session scratchpad's `sc/`):
`node share-choose-beside.mjs` again (`cmp`-identical to its file) and `node reduce-share-choose.mjs` again
(`cmp`-identical); `verify2.mjs` (sections C, F and G, and the solve at the two fixed rules' shares), `verify3.mjs`
(section D's lines by failure kind), `eight.mjs`; and the first round's `recompute.mjs`, `kinds.mjs`, `times.mjs`,
`band.mjs`, `money.mjs` and `money2.mjs`, my own decode of the arrays, each agreeing with the new sections.

Verdict: PASS

## What was checked and holds

- **The BLOCKING finding is answered.** Section C counts each arm's 1,000 paths as its `engineSecs` over N + CHECK times
  1,000 (the audit's clock covers the arm's 4,000 `runPath` runs and its 200 `E.runTrial` checks, audit l.109-118), adds the
  grid's solves, and divides by the one full solve at today's share. My own computation gives the same to the last place:
  x11.42 (x7.92 to x18.43), x10.04 (x7.26 to x16.92) with the chosen share's paths credited, the paths alone x6.42 (x4.25
  to x10.39), the engine's 4,000 paths at today's share x5.12 (x4.45 to x7.34), and every unit's figure. The report states
  the option's cost as ten to eleven times and the cut D103 needs as about nine-tenths (x10.04 to x11.42 against x1.25: 88%
  to 89%), and carries the clocks' caveat (four at a time, the pre-commit hook beside part of the run).
- **The four MINORs are answered.**
  - The minimum pot: section D's counts are the arrays' (`verify3.mjs`, `kinds.mjs`), each failing arm's `minPot` flag
    deciding the kind. "Before" is mid-plan, since no other failure falls in the last year, which D counts (0 of 18,484). The
    cuts it prints are the settings lines' `minPot` (S211-75pdb at 0.61: £41,846 and £26,754; S129-90 at 0.86: £928,800 and
    £151,200). The report's table rows (118 and 113; 111, 17 and 4; 55 and 17; 11 and 2) and its 9,444 of 18,484 are D's.
  - The forecast's terms: as the code has them (couple.js e1bb437b l.383 and l.515, l.520, l.665), the lead kept as a lead,
    the stored total said; section E's 7 of 14 and 1.059400 are the units'.
  - The band: section F takes the first person's fraction from the plan's pots and `SHARE_BAND` from `couple.js`; inside the
    band the arm at the fraction (0.6 on all eight), outside it today's. Every figure reproduces: all 14 +1.114 (+1.016 to
    +1.215) and +0.334 (+0.253 to +0.416); the four plain couples +0.856 (+0.652 to +1.067) and +0.025 (-0.091 to +0.141);
    the ten +1.218 (+1.108 to +1.331) and +0.457 (+0.353 to +0.564).
  - The money: section G pairs by path, beyond noise at 1.96 standard errors, a design equal to today's on a unit counting as
    neither. Every count and mean reproduces on both path sets (`verify2.mjs`, `money.mjs`, `money2.mjs`).
  - The 6-point pass is now said to fail on both counts.
- **Every figure in the report is in one of the two files and matches it**, or is a run time (17:37, 21:51; OTHER-ORDER's
  launch now 21:57, `runs.log` l.368). The one row no script prints, "the means' split, or the band dropped: x1 (one
  solve, as today)", is fair: measured, the solve at the means' share is a median x0.95 of the solve at today's (x0.43 to
  x1.19) and at the band-dropped share x1.00 (x0.69 to x1.12).
- **The recommendation is fair.**
  - It follows the rule's MISSES outcome: to the maintainer, with the means' share as the other option, and nothing built.
  - Its two candidates are the two fixed rules the run measured, each one solve.
  - It names the means' two losses and their mechanism (every lost path at the minimum pot), and gives the simulation's
    pick its corrected cost.
  - It says that the means' gain beyond the band was found only on the ten chosen units, and that splitting the floor apart
    from the spending is untested.
  - The registration goes to the maintainer before launch.

## Findings

1. **MINOR. The band's removal was tried at one holding, and the first candidate's scope is wider.** All eight in-band units
   hold exactly 60/40, the first person the elder holding 60% (section F: the fraction 0.6000 on each; ages 45/42 to 68/65),
   so dropping the band was measured only as 0.6 against 0.5. Proposed "for every couple" (report l.174), it also sets shares
   between 0.5 and 0.6, and first-person shares below a half where the first person holds 40% to 50%. Neither was tried here.
   In the second case the joint move weighs the estate at the smaller holder's table's weight (D99: "a first person at 40%
   weighing the estate at 0.05 of a household pound", D100's lead, its stage A now running). The units the report names for
   the test (90/10 holdings, final-salary pensions, state pension ages; l.180-181) are where the two candidates differ, not
   where the first is untried. Its registration should take in-band holdings other than 60/40 and couples entered with the
   smaller holder first, or scope the rule to what it tests.
2. **MINOR. One figure is given the wrong base.** "Splitting them 60/40 by their savings gains 1.114 points over today's"
   (l.25): the +1.114 is pooled over all 14, six of which the band's removal leaves unchanged. On the eight 60/40 couples
   alone it is +1.950 (+1.780 to +2.126) (`eight.mjs`). The comparison beside it is like for like and right: "most of that
   gain", +1.114 of +1.448, both over the 14.
