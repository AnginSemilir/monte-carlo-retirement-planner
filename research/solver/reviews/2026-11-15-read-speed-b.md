# Review at the read: the speed mode on more singles and couples (`SPEED-B.md`; D97 (3); EXPLORATORY, seed 7002)

Subject: the read made once on 15 Nov, `results-speed-b.txt` (SPEED-B OUTCOME: singles HOLDS; couples LOSES), and its
write-up, all committed in 59259d91:
- `reports/2026-11-15-speed-b-read.md`;
- the top entry of `DECISIONS-PENDING.md` (l.14-25);
- STATE.md section 6 action 3's SPEED-B clause.

Beside them, written after the read: `speed-b-beside.mjs` and `results-speed-b-beside.txt`. The write-up also cites item 7's
read (`results-tie-a.txt`) and item 12's (`results-item12-a.txt`).

Read (blobs at 59259d91):
- The rule's files, unchanged since a8a26e16 (`git diff a8a26e16 HEAD` on them is empty, and the same at the launch commit
  e860c984): `SPEED-B.md` eae02966, `reduce-speed-b.mjs` ef65ecd0, `audit-speed-b.mjs` 53495c4f, `batch-speed-b.sh`
  757c77d4, `stats.mjs` 7cf309da. The audit stamp's other files (`phase4-panel.mjs`, `couple-panel.mjs`, `audit-couples.mjs`,
  `audit-phase4.mjs` 5ace8395, both panel files) are unchanged since a8a26e16 too.
- The read and its write-up: `results-speed-b.txt` 9b0f1b21, `speed-b-beside.mjs` 25ddb8b6, `results-speed-b-beside.txt`
  827860e7, `reports/2026-11-15-speed-b-read.md` 605ac2a8, `DECISIONS-PENDING.md` dea2b2d4, `STATE.md` 029bdd06.
- The code: `src/solverSettings.js` fb3004da (`withSpeed`, `speedOptions`), `src/solverApp.js` 484d5c38 (`solveForApp`
  l.53-64), `src/solverStrategy.js` a4bbb1c4 (`runPath`, `strategyRuns` l.189-194, `shownPolicy` l.258-266),
  `src/solverWords.js` e746f172 (the two warnings, l.152-158), `src/solver/couple.js` ad2f2a95 (`solveCouple`),
  `fair-gate.mjs` 4d4a2040 (`checkLogStamps`), `code-id.mjs`, `run-unit.sh` (each unit at `nice -n 19`).
- Item 7's and item 12's designs and reads: `TIE-A.md` 5e7890ec, `results-tie-a.txt` 0a0aeb16 (l.88-107),
  `results-item12-a.txt` 88d0f118; the warnings' ruling (DECISIONS-PENDING D98, l.171-177).
- The launch: `runs.log` (15 Nov 03:57 UK, code 6b2dc56b2f82, from e860c984), the launcher's log `speedb-launch.log` in the
  session scratchpad (32 units, 32 to run, runs done 05:35 UK, no "unit k exited" line); the 32 unit logs and arrays in
  `results/speed-b-7002`. Nothing of seed 7021, D4 or either backup branch was opened.

Ran (read-only on the repository; my scripts and their outputs in the session scratchpad):
- `node research/solver/reduce-speed-b.mjs`: byte-identical to `results-speed-b.txt`, the gate fair. `--planted`: all six
  checks pass.
- `node research/solver/speed-b-beside.mjs`: byte-identical to `results-speed-b-beside.txt`.
- `check1.mjs`: every unit's cells, interval, spending, pot, capped pot, tax and times recomputed from the arrays without the
  reducer's functions (stats.mjs's `survivalChangeU` for the intervals). Every figure of both results files reproduced. All
  32 logs carry one stamp line, `code 6b2dc56b2f82 audit 7a7989082a7a prediction none sha -`; `code-id.mjs` on the tree now
  prints 6b2dc56b2f82 (no file it hashes changed since e860c984).
- `check2.mjs` (where S063's, S031's, S133's and four other couples' pot, tax and spending changes sit, by path) and
  `power.mjs` (a unit's interval and part 2 at 4,000 and 16,000 paths, by simulating paired cells through `survivalChangeU`:
  4,000 replicates a row, a seeded generator, so its figures print again the same; and S031's and S063's own cells four
  times over).

What holds. The read was made by the rule as committed: the rule's files are those of a8a26e16; the gate is fair as the
reducer reads it (every unit in both arms; one code, audit, seed 7002, 4,000 paths and 45 points; each arm's speed mode read
back from the solve's meta, `order` on both of a couple's tables in SPEED and on neither in WHOLE; every unit's table
digests the same in both arms); both arms of a unit run on one array of paths, so every comparison is paired; the outcome is
the rule's four parts as written. No figure sits at a bar where floating point could decide it: the nearest are the couples'
part 1 lower end, -0.0844 against -0.1, and S031's upper end, -0.2376 against -0.3; part 3's -0.0683% is clear of 0.05.
The beside script reads the same 32 units through the reducer's `armOf` and `rule`, and each of its sections computes what
its label says (A the units' `survivalChangeU` intervals; B each cohort through `rule`; C each arm's mean lifetime tax and
milliseconds a path; D part 3's pounds ratio without each couple, and the couples' pooled cells again). Its "median" and
the reducer's, for an even count, are the upper of the two middle values (the couples' x0.79 is x0.78 as a median; the
library singles' x0.52 is x0.50): immaterial. Every figure the write-up quotes is in one of the files it names.

Verdict: FAIL

## Findings

1. **BLOCKING. The singles' recommendation, "drop the singles' warning", rests on what this read cannot show, and the
   write-up does not say so.** The report (l.40-42) and DECISIONS-PENDING (l.24) give as its ground "On 32 singles across two
   reads it stays inside every bar while halving a path's time". The warning it would drop (`src/solverWords.js` l.157, the
   maintainer's words, D98) states two measured figures: "about 2 in 10,000 on average, and at most about 2 in 1,000". They
   are item 7's: the pooled -0.019 points and S370's -0.175 (-0.310 to -0.040; 46 saved, 74 lost of 16,000), its interval
   wholly below nought (`results-tie-a.txt` l.100-101; S030 too, -0.050, -0.099 to -0.003, l.89). Item 7's order arm was
   already inside every bar of its rule when that warning was written (l.101-107), so "inside every bar" is not new evidence
   against it. The new evidence is that 20 other singles show no loss, and on the warning's household-level figure it is
   weak:
   - The 20 are Phase 4's landed singles. Under WHOLE they survive 92.58% (S334F) to 99.20% (S132) (the unit logs' "engine
     ...% on 4000"), and 27 of their 80,000 paths are discordant (13 lost, 14 saved; at most 6 on one unit, S306F). S370 ran
     at 83.94%, with 120 of 16,000 discordant. None of the 20 is a plan like S370 as the library enters it.
   - At 4,000 paths a household loss of S370's size is seen beyond noise about a quarter of the time. `power.mjs`, at
     S370's survival and discordance (83.9%, 0.75%) and a true -0.175: the unit's interval lies wholly below nought in 23.5%
     of replicates at 4,000 paths and 73.1% at 16,000, and wholly below part 2's -0.3 in 0.1%. Part 2 at this size passes a
     true loss of half a point (S031's 94.8% and 1% discordance) in 77.5% of replicates; at item 7's 16,000 paths, 27.7%. So
     "no unit wholly below -0.3" and "no single's interval comes near the bar" (report l.15-16) bound a household's loss only
     well above the warning's "at most".
   - The read covers dial position 1 with consent given and no lock. The speed mode reaches every solve the app makes for a
     single, the locked positions 3, 6 and 10 among them (`results-speed-mode.txt` check 5), and the warning covers them all.

   What is shown: on these 20 households the pooled change is +0.001 (-0.012 to +0.015), which sits about three of its
   standard errors above item 7's -0.019. What is not shown: that a single's loss stays under the warning's "at most about
   2 in 1,000" on plans like S370, or at the other positions. For the claim to stand, the write-up must say the warning's
   "at most" is S370's measured loss, which this read neither measures again nor contradicts, and give the read's
   household-level resolution, its panel's range and the positions it covers. With those in front of the maintainer, the
   trade is theirs to rule on (SPEED-B.md lists "loses that group's warning" as one of the choices under HOLDS).

2. **MINOR. The couples' cohort account: each cohort's direction rests on two couples, and only one pair holds after
   allowing for twelve.** The report (l.27-31) and DECISIONS-PENDING (l.20-21) have survival netting "two cohorts going
   opposite ways". The library cohort's -0.150 (96 lost, 60 saved) is S031's and S063's (31/9 and 30/10). Its other four lose
   35 and save 41, +0.038. The younger cohort's +0.104 (21 lost, 46 saved) is mostly S301F's and S325F's (3/14 and 6/17); its
   other four lose 12 and save 15, +0.019 (`check1.mjs`). An exact two-sided McNemar test on each couple, Holm over the
   twelve (`check1.mjs`): S031 8.2e-3 and S063 2.4e-2 hold, S301F 0.13 and S325F 0.31 do not. Shown: S031 and S063 lose. A lead only:
   that the cohorts differ, and that the younger couples gain (l.74's "two younger couples gain survival beyond noise" is
   unadjusted for the twelve, and l.31's cohort gain is theirs). The recommendation's "loses survival beyond noise on the
   library's couples" (l.44) is two of the six. The "What it does not show" line (l.80-81) assumes the cohort effect it
   says it cannot explain.

3. **MINOR, for the maintainer. Keeping the couples' warning "as it is" keeps words that say nothing about survival, and
   part 2 holds on the path count alone.** The couples' warning (`src/solverWords.js` l.158) mentions time, spending and
   shares. This read finds S031 and S063 lower by 0.550 and 0.500 points, beyond noise after Holm (finding 2). That is more
   than twice the singles' warning's "at most about 2 in 1,000". Part 2 holds for them only because the run used 4,000
   paths: with their cells taken four times over, item 7's 16,000 paths, they read -0.550 (-0.708 to -0.396) and -0.500
   (-0.659 to -0.346), wholly below -0.3 (`power.mjs`). "Both intervals ... their upper ends are above the rule's -0.3, so
   part 2 holds" (report l.29-30) is right by the rule. The recommendation (l.43-44) should still say that losses of that size
   would fail item 7's own bar at its own size, and that the warning it keeps does not mention them.

4. **MINOR. The couples' spending loss is larger, couple by couple, than the pooled figure suggests.** Part 3 pools pounds
   (as SPEED-B.md says). 62.9% of the couples' pounds are the younger six's, and S321F alone carries 25.3%. Each couple equally
   weighted, the change is -0.122%, nearly twice the pooled -0.0683%. S133 loses 0.620% (lower on 2,716 of its 4,000 paths,
   -£3,557 a path on average), S097 0.278% and S031 0.216% (`results-speed-b.txt` by unit; `check1.mjs`, `check2.mjs`). The
   write-up gives only the pooled figure and "no one couple carrying it". The trade is the maintainer's to weigh, so the
   per-couple sizes belong beside it.

5. **MINOR. The cited reads differ from this one in what they ran, and "32 singles across two reads" mixes them.**
   - Item 7 (`TIE-A.md`; `results-tie-a.txt`) ran on 11 Nov's code with the review's prototypes on a scratch tree, before
     the harvest ceiling changed the menu and the engine's year. It used 16,000 paths. Four of its twelve households were
     taken as the library enters them (S224 71%, S362 51%, S366, S370 84%). Its part 1 used the households' paired variances,
     its part 3 was in points of target averaged over households, and it had a fifth part (the replay).
   - This read ran on 15 Nov's code (6b2dc56b2f82, after the commits of 15 Nov to a couple's plan) with 4,000 paths and landed
     households only. Its part 3 is a percentage of pooled pounds.

   Each read passed its own rule. They are not one panel of 32 under one bar, and "inside the same bar" (report l.20) is
   true of part 1's -0.1 only. Item 12 (`results-item12-a.txt`) ran on 12 Nov's code (c2613a32f65e, before the harvest
   ceiling and the capital gains bill's fix) on eight couples outside the panel, 16,000 paths. Its part 3 was a couple mean
   in points of target, one-sided at 0.1. "Also failed on spending" (l.35, l.43) is fair: pooled item 12's way, a mean over
   couples, this read's change is -0.122% (finding 4; a percentage of spending, as the arrays store no target), about item
   12's -0.109. But the two bars are not the same bar, and against item 12's bar of 0.1 the pooled -0.0683% would have
   held.

6. **MINOR. What the times measure.** The ratio, x0.54 for singles and x0.79 for couples, is the engine's wall-clock
   milliseconds a path for the solved policy alone, in Node. WHOLE was always timed first. Each unit ran at `nice -n 19`
   beside three others. The session's own work shared the same four cores at normal priority: `tie-couple-trace.mjs`
   solved S311F at 45 points, "solved in 140 s", and wrote its file at 04:59:37 UTC, during the run. The two units that
   finished at 05:00 UTC, S062 and S074, took 59 s for their SPEED solves against 45 and 43 s for WHOLE. The ratio leaves
   out three things:
   - the solve, which the mode leaves the same table for (each arm's solve is in the logs; the second took 0.85 to 1.36 times
     the first for singles and 0.85 to 1.01 for couples, the order fixed, so it measures nothing of the mode);
   - the run of the plan as entered, which the Strategy tab makes beside every solved path (`strategyRuns`,
     `solverStrategy.js` l.193);
   - the decisions the pages show, made on the whole menu in either mode (`shownPolicy`).

   So the wait for a plan's figures falls by less than a path's time. The write-up's caveat (l.75, l.82) names the four at
   a time and not the rest. It should say the ratio is the solved run's alone, and that the singles' warning's "about twice
   as fast", if it is kept, is that ratio and not the wait.

7. **MINOR. S063's pot and tax: most of the change is above its cap.** The report (l.32-33) gives S063's pot +10.33% and its
   mean tax doubling, £11,390 to £22,666. Its capped pot rises 1.31%. Its median pot rises from £567,557 to £584,686, and
   its 90th percentile from £2,585,616 to £2,874,667 against a cap of £1,800,000. Its median tax rises 14%, from £8,079 to
   £9,219 (`check2.mjs`). The couples' pooled pot of +1.169% is +0.336% without S063. So the "pot is higher" line is mostly
   one couple's paths above its cap. There a couple's joint move takes no tie rule (D95; TIE-C closed), so which near-tie it
   picks is arbitrary under either menu. That is a lead for "why S063's tax doubles" (l.80-81), not shown, and the line
   should carry the capped figure beside the mean.
