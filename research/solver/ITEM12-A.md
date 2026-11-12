# Item 12 on the port: approximate cuts on a couple's path, stage A (EXPLORATORY)

The review of 9 Nov, item 12 (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md`), its own run and the prompt the
maintainer sent (`research/reviews/2026-11-11/ITEM12-RUN.md`, review/external-2026-10-21 at a8fab383; D84). EXPLORATORY,
seed 7002. The rule below is committed before launch, with the audit, the batch and the reducer that read it. By D84 an
arm that passes is built as item 12's stage B, off in code, with its test, and the read goes to the maintainer; switching
it on is the maintainer's. If neither passes, item 12 is closed and nothing is built. No registered couples' arm takes
any of it (D80).

D84's condition is met: a width of item 7 passed and is built (`order` with the slice, D86; `chooserShortlist: 'order'`).

## The question

After item 11 a couple's path is mostly each person's own chooser. Does ranking each person's moves from the shortlist
that passed item 7, alone or with item 12's joint options on top, lose survival, spending or the pot against the flat
path on the whole menu, or hold a different weight of equity?

## The design

- **Code:** the working branch at the commit that carries this file (the candidate af001697ce1b, item 11's flat path,
  the two stage B options off in code), with the review's prototype of the joint options applied on a scratch tree, not
  committed to the branch: `2026-11-09/prototype/couple-approx.diff` (`COUPLE_APPROX`), which applies to the port's
  `couple.js` with offsets only. With every option off the port's own test of the flat path passes on that tree
  (`couple-flat.test.mjs`). Launched through `run-from-snapshot.sh` with `PREDICTION="none:..."`.
- **First, the review's check reproduced** (item 12's stage A): `scripts/couple-approx.mjs S303@52:land 45 3000` on a copy
  at 6331361 with the review's three patches prints the review's line for each arm it shares
  (`results/out-couple-approx-45-S303at52.txt`): `order` 3 saved, 6 lost; `order+one+thin4x3+nodraw+near` 4 saved, 8 lost
  (`results-item12-precheck.txt`).
- **Then, the switches:** an arm's switches are set on the solved tables after the solve. On one couple at light settings
  a solve handed the two options gives the paths of the plain solve with the switches set afterwards, bit for bit
  (`audit-item12.mjs --switch-check`; in the same file).
- **Couples:** eight, as the library enters them: S009, S079, S137, S153, S173, S253, S315, S415. The rule of choice,
  fixed before any solver ran on them: of the library's couples that are touched (`held-out.mjs` `touchedAll`), outside
  the panel and outside the review's eight (S007, S127, S209, S261, S303, S391, S303@52, S313@52), there are 34. Each was
  run under its plan's own rules (no solver) on 500 paths of seed 990, and those surviving between 70% and 95% were kept,
  so that each has paths to lose and to save. From those, in the library's order: the first of each stage that retires
  after pension access or is already drawing (in drawdown S009, just retired S079, mid S253, far S315), and four with
  years before pension access (the early bridge's first three, S137, S153 and S173, and the long bridge's one, S415).
  The stage `near` gives way to the fourth bridge couple. None of the review's is used, so none is a fill.
- **One solve a couple:** each person at 45 points as the app solves them (`solveCouple` over `solveForApp`, the candidate
  as ported). No arm changes a table: each unit records its tables' digests before the first arm and after the last.
- **The comparison:** the flat path on the whole menu (item 11 as committed), every switch off.
- **Arms, each scored by the engine on the same 16,000 paths of seed 7002 (paired), on those tables:**
  - **(a)** the shortlist that passed item 7, as its stage B built it, in each person's ranking: `chooserShortlist: 'order'`
    on each person's table, with the tie-break above the cap at `1e-4` on it. The slice is part of what passed and acts
    only with the tie-break; the tie-break alone changes no couple's path (identity 2 below), so the comparison is the
    whole menu either way.
  - **(b)** the same with item 12's joint options: one read (`oneRead`), the bridge search on 5 points and 3 steps
    (`shareN` 4, `shareIters` 3), `near`. `nodraw` (exact) and `screen` (dropped by the review) stay off.
- **Two identities in each unit, bit for bit, or the unit stops (a STOP):** (1) the path as it was (`COUPLE.flat` off)
  against the flat path on the first 20 paths; (2) the whole menu with the tie-break on each person's table against the
  comparison on the first 200 paths. The comparison is also held to `E.runTrial` on its first 200 paths.
- **Stored for each path:** survival, spending delivered, the pot left, lifetime tax. **Tallied at every decision of every
  path, for each arm:** each person's equity weight held in pension and in ISA coming into the decision (the weight of
  the tier the engine holds for that wrapper), summed plainly over the decisions, and beside it weighted by the wrapper's
  pot.
- **Recorded:** what each arm ran is read back from the tables and the modules at run time, not built from its name; the
  rankings made from a shortlist (nought on the comparison); a path's milliseconds.
- **Units:** one a couple, eight. **Size:** about 12 core-hours (the review's 14 for its two arms on the code before the
  solve on anchors).

## The read

For an arm X against the comparison, on the eight: d, each couple's survival under X less under the comparison, in
points, paired on its 16,000 paths.

- **Pooled survival:** the mean of the couples' d, its 95% interval from their paired variances (as `SPEED-A.md` and
  `TIE-A.md`).
- **A couple's interval:** `stats.mjs` `survivalChangeU`.
- **Spending delivered:** each couple's mean lifetime spending delivered as a share of its lifetime target, in points, X
  less the comparison; pooled, the mean of the eight.
- **The pot left:** each couple's mean pot left over its paths, X over the comparison, in percent; pooled, the mean of the
  eight couples' changes (as the review's read took it). The ratio of the summed pots is printed beside it.
- **The equity weight held:** for each person and each of pension and ISA, the mean over the decisions of the equity
  weight held, in points (a weight of 0.6 is 60 points); X less the comparison. A wrapper a person has not got is left
  out. The pot-weighted figure is printed beside it and does not decide.
- **Lifetime tax:** each couple's mean lifetime tax; pooled, the couples' means averaged, X over the comparison. Reported.

## The rule (D84: item 12's parts 1, 2 and 4 as written; part 3 at 0.1 points of target; part 5 on the equity weight)

An arm passes if all five hold:

1. pooled, the paired survival difference's 95% interval has its lower end above -0.1 points;
2. no couple's interval lies wholly below -0.3;
3. pooled spending delivered is not lower than the whole menu's by more than 0.1 points of target;
4. the pooled mean pot left is not lower by more than 0.5%, and no couple's by more than 1%;
5. each person's mean equity weight held in pension and in ISA over the decisions is within one point of the whole
   menu's, on every couple.

More pot than the comparison passes part 4 (one-sided, as item 12 wrote it).

**Outcomes (D84).**
- **(b) passes:** item 12's stage B is built for the shortlist in a couple's ranking with the joint options, off in code,
  with its test. The read goes to the maintainer; switching it on is the maintainer's.
- **Only (a) passes:** stage B is built for the shortlist in a couple's ranking alone, off in code, with its test.
- **Neither passes:** item 12 is closed. Nothing is built, and couples keep the whole menu in each person's ranking.
- **An identity fails, or the gate is not fair:** STOP and report.

A rule that fails is reported; it is not changed and the run is not made again to pass it (D81 (F)).

## Limits, said before the run

- One seed, eight couples chosen by the rule above from the touched ones; none is a panel couple and none is landed.
- The joint options are the review's prototype on the port, not a port.
- A path's milliseconds are taken with other work on the machine and are a guide only.
