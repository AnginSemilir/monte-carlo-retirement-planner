# Review at the read: the share rules' registered test (`registrations/share-rules.md`; D104 (5), D107; seed 7023)

Subject: the read printed once by `reduce-share-rules.mjs` from the launch worktree at e1239959 (`results-share-rules.txt`,
outcome NEITHER), and every claim made of it in `reports/2026-11-16-share-rules-read.md`, in STATE.md section 6 action 3
(the sentence from "launched as registered 16 Nov 00:37 UK") and in DECISIONS-PENDING.md (the "RULED (D107" entry); beside
it, `share-rules-beside.mjs` and its output `results-share-rules-beside.txt` (EXPLORATORY, written after the read).

Read (blobs at e63b25c1):
- `registrations/share-rules.md` 94878b497e36, the blob every launch log names (`sha 94878b49...`).
- The read and its beside: `results-share-rules.txt` 88ee84958c9b (the worktree's file byte for byte, `cmp`),
  `results-share-rules-beside.txt` c92ee76e66d5, `share-rules-beside.mjs` 2bc1f26d1e25.
- The write-up: `reports/2026-11-16-share-rules-read.md` d543c8e535c5, `STATE.md` b0411c500230, `DECISIONS-PENDING.md`
  3aeb6c0235f9.
- The code the read rests on: `reduce-share-rules.mjs` b46fa5187e99 (the worktree's blob too), `audit-share-rules.mjs`
  6fb13445e91e, `batch-share-rules.sh` 7b21acc995e5, `run-from-snapshot.sh` cf7ab99bb4ec, `fair-gate.mjs` 4d4a20402b1c,
  `reduce-couples.mjs` cae05c5a8e75 (`harmOf`), `reduce-phase4.mjs` ac319aad1f44 (`byPath`, `survivalItem`,
  `spendingItem`, `lossOf`), `size-phase4.mjs` f66f13d055ed (`thresholdFor`, `harmRate`), `stats.mjs` 7cf309da0151,
  `audit-couples.mjs` f50aa99da601 (`wantProblems`), `audit-phase4.mjs` 5ace83959b96 (`runPath`), `src/solver/couple.js` 7a12a4340749
  (`couplePolicy`), `research/engine.mjs` (generated, untracked; the couple's draw and the failure rule, the same text in
  the worktree). `git diff e1239959 HEAD` over the registration, the read, the audit, the batch, the panel's files,
  `fair-gate`, `reduce-phase4`, `reduce-couples`, `audit-couples` and `size-phase4`: empty.
- The run: `/home/user/sr-launch/research/solver/results/share-rules-run` (88 logs, 88 arrays), `share-rules-launch-0-refused.log`,
  `-1.log` and `-2.log`, `runs.log` lines 373 and 374, the two launch snapshots `/tmp/solver-snap-LI68dq` and
  `/tmp/solver-snap-HYZwsa`.

Ran (each under `nice -n 19`, one at a time, B1's gate running; no solve, batch or suite):
- `node research/solver/reduce-share-rules.mjs` in the worktree: `results-share-rules.txt` byte for byte (2 s); `--planted`:
  17 of 17.
- `node research/solver/share-rules-beside.mjs <the run folder>`: `results-share-rules-beside.txt` byte for byte.
- My own scripts, the arrays decoded afresh (not through `loadDir`): every unit line, the three pooled items, the beside
  block and section A's 480 figures; eight thresholds and 1-point rates in Python (`math.lgamma`, direct binomial sums,
  a bisection for Clopper-Pearson); the failure kinds of finding 1 and the counts of finding 2.

## What holds

1. **Once, by the rule, the gate first.** The read's call checks the logs' stamps (`reduce-share-rules.mjs` line 244,
   `requireFairLogs`) and the gate (lines 246 to 248) before it prints any outcome. The record fits one read: the
   worktree's `results-share-rules.txt` was written 14:58:11 UTC, 17 s after the last array (`S377-dbpart-flat.json.gz`,
   14:57:54), the reducer taking 2 s; no other output of it under `/home/user` or `/tmp`; under the registration the logs
   carry no outcome. That no earlier call printed one cannot be shown from the files; a call on an incomplete folder is
   refused at the gate before any outcome.
2. **One stamp across both windows.** All 88 logs open `stamp: code c0dcfa9ef2f2 audit 28712df5935f prediction
   research/solver/registrations/share-rules.md sha 94878b497e36...` and `node v22.23.4`; the 88 arrays carry one stamp
   object, seed 7023, 16,000 paths, W 0.02 and one CPU model.
3. **The relaunch kept only finished units.** Cases 0 to 76 finished in the first window (the last done line 12:17:00
   UTC), cases 77 to 87, all FLAT, in the second (13:27 to 14:57); `-2.log`: "11 to run". The batch keeps a unit only on
   its stamp, Node line and done line (`batch-share-rules.sh` lines 24 and 25). The eleven rerun logs are whole (seven
   lines, one done line, no stray bytes), their arrays written in the second window, and no unit process is left running.
   The second launch's "+ 1 uncommitted file(s)" warning is `runs.log` alone: `diff -rq /tmp/solver-snap-LI68dq
   /tmp/solver-snap-HYZwsa -x node_modules` lists only it.
4. **Paired and fair.** On every unit the arms' `inputs` (MPAA ages in) and the MPAA ages used are identical, so
   `E.pathsForSeed(7023, 16000, T)` gives each arm the same paths; the configurations are the registration's (TODAY
   27d2a7c7ee9d, FLAT d17e66b604a1, MEANS bd5c568d2f42); FLAT ran on exactly the 24 units outside 90/10. Each run held
   `runPath` to `E.runTrial` on its first 200 paths (a difference exits 3; none did) and ran the couples' rollout beside
   the engine on 500: nought and nought in every arm.
5. **Every figure of the read.** My recomputation gives every unit line (shares, survival, lost and saved, loss,
   discordance) and FLAT `+0.4206` (`0.3870` to `0.4542`, se `0.01715`), spending `-0.07460%` (`-0.08021` to `-0.06898`);
   MEANS `+0.2168` (`0.1777` to `0.2559`, se `0.01997`), spending `+0.37293%` (`0.36603` to `0.37984`); MEANS against FLAT
   with the stand-in `-0.0986` (`-0.1313` to `-0.0660`); the beside block's pots, tax, spending, fidelity and solve ranges;
   and all 480 figures of the beside's section A. Independently in Python, the upper discordance, the threshold in whole
   paths and the 1-point rate of S023-45 FLAT (61 paths, 1.000), S271-45 FLAT (63), S147-db FLAT (96, 0.970), S061-dbpart
   MEANS (115, 0.836), S377-dbpart MEANS (61), S191-45 MEANS (62), S147-db MEANS (106, 0.910) and S061-45 MEANS (61), each
   flag as read. NEITHER follows by the registered rule: each rule has a flagged unit, and FLAT fails part 3 besides.
6. **The beside script** reads what its header says. FLAT's figures are TODAY's exactly where FLAT did not run
   (`R.FLAT ? fig(R.FLAT) : { ...T, standing: true }`; FLAT absent on exactly the eight 90 units), so section B shows no
   FLAT move at 90/10, section C counts `24 + 32 = 56` and section D 24. The counts 25/8/8/15 recount from the read's own
   lines; B's means, D's (16 units at `+0.0776`, 8 at `-0.3791`, together `-0.0746`) and E's differences are right.
7. **The write-up's figures** are each as printed in the two files or the registration's pilot section; the counts the
   report makes by hand from the printed lists (six of eight at 45/55 and at 55/45, five and three at 90/10, seven of the
   sixteen exceptions, all three DB units) are right. STATE.md's sentence and the DECISIONS-PENDING entry match the read.

Verdict: PASS

## Findings

1. **MINOR. What the losses are: on three of MEANS's six flags the paths do not run out; they end the plan below the
   household's minimum pot.** The engine fails a path that runs short in any year (unmet spending over £1) and otherwise
   one that ends below the minimum pot (`research/engine.mjs` line 2959, `if (!failed && ctx.solvencyFloor > 0 &&
   terminalPot < ctx.solvencyFloor)`; `audit-phase4.mjs` `runPath` line 102 the same, its `failYear` then the last year).
   The panel's minimum pots are the plans' own: the target on S023, S061, S191 and S271, £80,000 on S109, £90,000 on S147
   and S377, £480,000 on S227. Split from the arrays (a failing path with unmet spending over £1 ran out, one with none
   failed the minimum pot; over the 88 runs all 12,405 of the latter fail in the last year and end below their minimum pot,
   and 2 of the 35,065 others hold under £10 of unmet spending):
   - the three 90/10 flags under MEANS are the minimum pot: S023-90 434 of its 451 lost paths, S147-90 272 of 274,
     S227-90 167 of 169. On S147-90 MEANS runs out on fewer paths than TODAY (562 to 386) and ends below £90,000 on more
     (102 to 471);
   - the flags that run out: S061-dbpart (FLAT 440 of 440, MEANS 1,985 of 1,985) and S377-dbpart (100 of 101); the 45/55
     flags are mixed (FLAT S023-45 29 run out and 77 below the minimum pot, S147-45 67 and 174, S191-45 104 and 56; MEANS
     S191-45 54 and 63);
   - over the 56 comparisons, 2,448 of the 5,646 lost paths and 2,983 of the 8,371 saved are the minimum pot's;
   - at 90/10 under MEANS the paths that run out fall on six couples of eight (S061 393 to 3, S271 1,255 to 910) and those
     below the minimum pot rise on seven (S023 272 to 615, S147 102 to 471), so the report's "survival rises on five
     couples and falls on three" nets two movements going opposite ways;
   - S061-dbpart's failing paths, in every arm, run out in plan years 4 to 9 (MEANS: year 6 635, 9 581, 8 506, 7 469,
     5 141, 4 2), before the partner's state pension and £15,000 DB pension start at 68 (plan year 10), and end the plan
     with a median pot of £276,404 under MEANS (TODAY £292,606, FLAT £305,171), those incomes refilling it (the engine runs
     a failed path to its end): a shortfall in the bridge years, a lead for the deep review, its cause not shown.
   The outcome stands: the registered survival counts both kinds, each rule keeps a flag that runs out (S061-dbpart), and
   FLAT fails part 3 besides. But "harm", "solvent" and "loses ... points" will be read as running out of money. The
   report should give the split beside its two tables of flags, printed by the beside script (CHECKLIST 6), and the deep
   review should take it with the ten flags.

2. **MINOR. Section C's direction counts 19 units twice.** On 19 units FLAT and MEANS move the elder's part the same way
   from the same TODAY run (on five, S147-55, S191-55, S227-55, S227-sppart and S377-55, their shares within 0.001), and
   all 19 pairs agree in sign. Counted once a unit and direction, 24 follow the pattern and 13 go against, of 37, where
   the report's 25/8/8/15 gives 40 and 16 of 56. Two facts the lead also needs:
   - 43 of the 56 changes are beyond noise (a two-sided exact McNemar test at 5% on the read's lost and saved counts,
     unadjusted: the part up, 20 up and 4 down; down, 13 down and 6 up), so the pattern is not noise;
   - four of the seven exceptions on S061 and S109 that the report gives as "each under 0.3 points", where survival is
     above 99%, are beyond noise too (S061-45 MEANS 57 lost, 11 saved, p 1.3e-8; S109-45 FLAT 18 and 44, 1.3e-3; S109-45
     MEANS 37 and 14, 1.8e-3; S109-55 FLAT 32 and 11, 1.9e-3): small in points near 100%, not a ceiling's noise.
   On running out alone the pattern holds (the part up: fewer paths run out on 24 of 33, more on 9; down: more on 16 of
   23), while the paths below the minimum pot rise on most moves either way (33 of 56). The report rightly calls it a
   lead; the counts it gives for it should be the de-duplicated ones, or name the pairs.

3. **MINOR. One sentence goes beyond the read, and "What the read cannot show" leaves out the holdings.** "So no single
   fixed share suits these couples" (the report, end of "What the units show"): the read tested two fixed rules beside
   today's. It shows that none of the three is best on every unit (S061-dbpart's half, S147-db's `0.681`), not that no
   fixed rule could pass. And the elder holds 45%, 55%, 60% (the three features) or 90% of every wrapper
   (`registrations/share-rules.md`, Households), never less than 45%: the direction says nothing of couples whose younger
   partner holds more than 55%. Both belong in the list.

4. **MINOR. The solve times are printed without their conditions.** "`69` to `147` s (TODAY), `77` to `206` s (FLAT),
   `66` to `337` s (MEANS)" stands bare where the registration says neither rule adds solve time. The arms ran in a fixed
   order (`audit-share-rules.mjs` `unitsOf`; the logs' times): every TODAY first (done by 04:49 UTC), every MEANS next
   (05:06 to 10:25), FLAT last (10:48 to 14:57), beside the session's other work (its commits from 06:45 to 14:12). The
   six MEANS solves over 280 s (S227-90 297, S227-sppart 285, S377-45 337, S377-55 334, S377-90 309, S377-dbpart 297)
   ran 08:22 to 10:25, when the same runs' engine took 161 to 215 ms a path against TODAY's 108 to 132 on those units;
   S023's MEANS solves, 66 to 69 s, are TODAY's 69 to 73 s. Say the times are a guide only, taken under load and in that
   order.
