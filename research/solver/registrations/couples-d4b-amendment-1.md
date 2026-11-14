# Amendment 1 to `couples-d4b.md` (13 Nov 2026)

`couples-d4b.md` itself is not edited: the run's stamp names its blob, and the fair-test gate holds every chunk to it.
This page is the amendment, made by the maintainer's ruling D94 (1) ("Proceed with your recommendations", on
`reports/2026-11-13-d4b-stage-gate.md`, option 1), after the first stage and before any outcome of seed 7021 has been
read, printed or estimated.

## Why

The first stage's 200 chunks finished at 01:02 UK on 13 Nov. The registered stage gate (`stage-couples.mjs`) then
refused and decided nothing: for one couple of the 40, S293, the solver arms' units and APP's carry different inputs
hashes. The gate prints no survival and no difference when it refuses.

From the plans alone, with no file of the run and no path of seed 7021 read (`d4b-plan-check.mjs`,
`results-d4b-plan-check.txt`, EXPLORATORY):

- the one hashed input that differs is the second person's MPAA age: 58 in the solver arms' plan, 60 in arm A's. The
  engine derives it from the plan's own expected path (the first year a taxable pension draw is made), and that path
  follows the plan's policy: arm A's pick for this couple is Bracket Fill with the lump sum, and the solver arms' plan
  keeps the plan's own Bracket Fill Basic, phased (`audit-phase4.mjs` `solverPlanOf` changes the policy's name only
  where the deposit order differs). The guardrails and the lookahead move nothing: each plan resolves the same ages
  with both on and with both off. (Corrected 13 Nov after the review of this amendment, finding 1: this page and the
  report first gave the guardrails and the lookahead as the cause. The rule below does not rest on the cause.);
- with every owner's MPAA age left out, the three arms' plans hash the same;
- it moves no money on this couple: both people's pension contributions are below the MPAA's limit, and arm A's plan run
  on 2,000 paths of the tuning seed gives the same survival, estate, lifetime tax and unmet spending on every path under
  either age; and the solver arms' own plan was compared under either age (added after the review, finding 2): the
  household's engine context, every field and not only the hashed ones, differs in the age's two labels alone at both
  weights and in both arms, and each person's own plan, on which their table is solved, resolves its own age to 60
  either way. The engine's year and `src/solver` do not read the label; it acts only as the pension's room for dated
  deposits and staged transfers, of which S293 has none;
- the other 39 couples resolve the same ages in every arm.

## What changes

1. **One plan.** In the stage gate and in the read, a couple's units are on one plan when they carry one inputs hash,
   as registered, **or** are this one difference, whole (`couples-d4b-amendment.mjs`, `onePlan`): the couple is S293,
   APP's unit carries exactly the hash the plan check printed for arm A's plan (`59b230b4798b`) and every solver unit
   carries exactly the hash it printed for the solver arms' plan (`6080f4d27c15`). Any other couple, any other hash on
   S293, the two hashes the other way round, or S293 with only some of its solver units on the second hash, is refused
   as before. If S293's chunks do not carry exactly these hashes the amended gate refuses again, and that is a STOP.
2. **The stamp.** `stage-couples.mjs` and `reduce-couples.mjs` are among the files the run's audit stamp covers, and both
   change with this amendment. The launched code is not touched: the second stage runs from the launch tree
   (`/home/user/d4b-launch` at 4e4174b1) under `RESUME=1`, so its chunks carry the launch stamp (code 1d5d2421c9ab, audit
   29a4a6a71f76) as the first stage's do. The read holds every chunk to that stamp, computed as the files it takes with
   those two files as they were at the launch commit (`launchStampHash`), which must equal the launch's own; a stamped
   file other than those two that has moved since the launch is still refused.
3. **How the stage gate is run.** Once, from the working tree at the commit that carries this amendment, on the run's
   folder: `node research/solver/stage-couples.mjs /home/user/d4b-launch/research/solver/results/d4b-run`. It writes the
   run's `stage2.json`, which now also names the couples taken under this amendment, and prints the count of
   couple-weights going on and nothing else. The launch tree's batch, relaunched under `RESUME=1`, finds that file, does
   not run its own gate, and runs the second stage's chunks.
4. **What the read says.** The read prints, beside its figures, that amendment 1 was used and for which couple.
5. **What holds the amended files** (the review's finding 3). The three files are outside what the chunks' stamp can
   check, so the stage gate was run, and the read is made, with them at the blobs the review read at 9718568f:
   `couples-d4b-amendment.mjs` 172cf67f9524, `stage-couples.mjs` 0242929ca413, `reduce-couples.mjs` cae05c5a8e75. The
   reviewer at the read checks the three blobs first.
6. **The stage gate runs outside the launcher** (finding 5), from the working tree; its decision is held by the read,
   which recomputes it from the first stage's chunks and refuses if `stage2.json` says otherwise. Had the amended gate
   refused, nothing would have been written and a relaunch would have met the registered gate's refusal again: a STOP.

## Used (13 Nov)

The review passed the amendment for use (`reviews/2026-11-13-couples-d4b-amendment-1.md`: PASS, five MINORs, answered
above and in `d4b-plan-check.mjs`; its finding 4, two planted cases the read's own entry lacks, is not taken up before
the read, since it would move `reduce-couples.mjs` off the reviewed blob). The amended stage gate was then run once, at
9718568f with the tree clean, on the run's folder. It printed its one line: no couple and weight goes on to a second
stage. So the first stage's 200 chunks are the whole run.

## What does not change

The question, the arms and their configuration hashes, the 40 couples, seed 7021, the paths, the two stages and their
bar, the primary metric, the decision rule and what each outcome decides: all as `couples-d4b.md` has them. S293 stays
in the panel. No chunk is re-run; the first stage's 200 stay as they are, on `d4b-backup` byte for byte.

## Planted checks

Each amended file fails its planted cases when the amendment is wider or narrower than this page:
`node research/solver/couples-d4b-amendment.mjs --planted`, `node research/solver/stage-couples.mjs --planted`,
`node research/solver/reduce-couples.mjs --planted` (the known difference whole; on another couple; on another hash;
the other way round; a mix; the amendment naming no couple of the run, which is the registered gate).

## Review, and the fallback

The `reviewer` agent reviews this amendment and the three files before the amended gate is run on the run's folder; its
verdict is in `research/solver/reviews/`. If it fails the amendment and the failure stands after one fix, the fallback
is the report's option 2, by the same ruling: the cause is fixed in the audit (the solver arms take arm A's resolved
MPAA ages), the couples are landed again, the change goes to the design review, and the first stage is run again; the
present chunks then stay unread on `d4b-backup` and are deleted after the read.

For the next registered couples' test (item 6's stage C) the audit's solver arms take arm A's MPAA ages, so the class
cannot recur.
