# Review at the read: item 6's stage C (`registrations/couples-share.md`, seed 7022), read once 14 Nov

Subject: the registered read and its write-up at c20e9f09: `reports/2026-11-14-stage-c-read.md` (whole, its plain words
included), `STATE.md` section 5's line "- Item 6's stage C (D96; ..." and section 6's actions 2 and 3, and
`DECISIONS-PENDING.md`'s entry "Read (14 Nov): item 6's stage C, PASS".

What I read (git blobs at c20e9f09 unless named):
- the write-up: `reports/2026-11-14-stage-c-read.md` 27ce3828d65b; `STATE.md` 1689f96125c4 (lines 287, 297, 298);
  `DECISIONS-PENDING.md` f375003f70d0 (lines 159 to 163); `results-couples-share.txt` 5633bcb8bbdf.
- the rule and its code: `registrations/couples-share.md` 94548edcce1b (the same blob at 9eb62aa3, ce8ca278 and c20e9f09,
  and the sha on every unit's stamp); `reduce-couples-share.mjs` 7f694a1d419f; `audit-couples-share.mjs` ac476126024d;
  `reduce-couples.mjs` cae05c5a8e75 (harmOf); `reduce-phase4.mjs` ac319aad1f44 (survivalItem, spendingItem, lossOf);
  `size-phase4.mjs` f66f13d055ed (thresholdFor, harmRate); `fair-gate.mjs` 4d4a20402b1c (requireFairLogs);
  `audit-couples.mjs` f50aa99da601 (wantProblems, solverPlan); `couples-share-panel.mjs` 2476bda6d1df;
  `batch-couples-share.sh` f534d0962720; `run-from-snapshot.sh`; `src/solver/couple.js` f66038d648b3 at ce8ca278 (shareFor);
  `results-couples-share-panel.txt` 737aa8fdf8dd; `reviews/2026-11-13-couples-share-design.md` and `-design-2.md`.
- the run: `results/share-c-run/` (108 `case*.txt`, 108 `*.json.gz`), `results/share-c-launch-1.log` to `-3.log`, `runs.log`
  lines 363 to 365, the launcher's three snapshots (`/tmp/solver-snap-Ps9kUY`, `-epOiWv`, `-dYm6Og`). Nothing of seed 7021,
  `d4-backup` or `d4b-backup` opened.

What holds, checked:
- Read once, by the rule as registered. The worktree `/home/user/sc-launch` is at ce8ca278 and clean; there
  `stampFilesHash()` prints 327661b4d2fc over its 34 files and `code-id.mjs` 7002a1fec94c. Every stamped file, the reducer, the
  audit and the registration have one blob at 9eb62aa3, ce8ca278 and c20e9f09, but `src/solverApp.js` and `src/solverSettings.js`.
  Those changed on the working branch after ce8ca278, not in the worktree the read ran from. Each of the 108 logs has one stamp
  line, `stamp: code 7002a1fec94c audit 327661b4d2fc prediction research/solver/registrations/couples-share.md sha 94548edc...`,
  plus Node v22.23.4 and one done line. No log line carries an outcome. Snapshots 1 and 3 match the worktree under `research/`
  and `src/` (`diff -rq`). Snapshot 2 differs only in `runs.log`, by the first launch's line. No launch log has a "unit k
  exited" line. I re-ran `node research/solver/reduce-couples-share.mjs` in the worktree: it reproduces
  `results-couples-share.txt` byte for byte (`diff` empty, exit 0). The file was written at 10:57:50 UTC, after the last unit
  (10:56:19), and its only commit is c20e9f09. The planted checks pass in the worktree: the reducer's 16 and the audit's 9.
- The outcome follows. No unit is flagged: every loss is negative, from -4.595 to -14.258, against thresholds of 0.526 to
  0.711. The pooled lower end is +10.442 > 0, so `decide()` gives PASS. What the report, STATE.md and DECISIONS-PENDING.md say
  the PASS decides is the registration's Outcomes and D97 (1), neither more nor less:
  - `shareRule: 'pots'` becomes the couples' default.
  - The guard comes off for an elder holding more than 60% and at most 90%.
  - Equal ages keep the band.
  - A younger partner holding more, or either partner over 90%, keeps the app's rules.
  - 60% to 75%, and a couple uneven in some wrappers only, are covered by inference.
  - The change goes in the D-line's commit, with the reviewer on the change of default.
- Recomputed from the arrays (the reducer's own `loadDir`; my scripts are in the scratchpad named below):
  - Every printed per-unit and pooled figure matches.
  - Every unit's CANDS less APP 95% interval is above +4.28 (S211-db +4.283 to +4.907), so "on every one of the 36 cases" stands
    unit by unit.
  - The seven MPAA units and their ages are the design review's seven from the plans (`-design.md` finding 4).
  - S265 and S291 are 45/42, retiring at 60.
  - CANDS less CANDH on those two couples runs from -0.9 to +2.6.
  - The eight named comparisons save 11.97% (S389-75) to 14.27% (S015-90) of their paths: "12 to 14 points" to the whole point.
  - 49 lost on S155-75; 18,000 paths beside the engine; the speed figures; the pot and tax means; "+10.7 (+10.4 to +10.9)".

Verdict: PASS

The read stands and its outcome follows by the registered rule. The findings below are corrections and additions to the
write-up, none changing the outcome or what it decides.

1. **MINOR. Half shares are compared with the app's rules unpaired. Paired, they are below on 9 of the 12 couples at 90/10,
   not 10.** Report lines 27-28: "That is below the app's own rules on 10 of the 12 couples, by up to 27 points". That count
   sets CANDH's first 1,000 paths against APP's 19,000 (for example `results-couples-share.txt`, S183-90: "85.06% / 95.44% /
   83.20%"). On CANDH's own 1,000 paths (`rv/a1.mjs`):
   - S183-90: APP 83.00%, CANDH less APP +0.20 (95% -1.49 to +1.89). Level, not below.
   - Below beyond noise on 9: S389-90 -2.50 (-3.81 to -1.19), S237-90 -3.30, S129-90 -6.60, S211-90 -12.60, S019-90 -12.70,
     S043-90 -20.20, S015-90 -23.20, S103-90 -26.30, S155-90 -26.70 (-29.44 to -23.96).
   - Above on 2: S265-90 +8.10 and S291-90 +6.50.
   - Pooled over the twelve: -9.94 (-10.76 to -9.12).

   "By up to 27" holds (26.7). Line 69's "half shares fail badly on most couples" is more than 10 points below on 6 of the 12.
   CHECKLIST 3 asks for the paired figure: 9 of 12, level on S183.
2. **MINOR. "Between 89.5 and 99.2 in 100" (report line 23): the top is 99.1.** S015-75's CANDS keeps 18,838 of 19,000 paths,
   99.147%. The file's 99.15% was rounded a second time.
3. **MINOR. Three plain-words statements say more than the files.**
   - Line 11, "12 couples held out from all earlier work": by the registration (lines 54-56) and the panel record's last lines,
     six of the twelve are named in the app's own policy-study files: S043, S103, S183, S211 and S019 in
     `confirmed-results.json`, S265 in `coupling.mjs`. They are held out from all earlier solver work.
   - Line 10, the share "in proportion to what they hold": `shareFor` gives half inside 40% to 60% and holds the share to 5% to
     95% (`src/solver/couple.js` lines 67-75 at ce8ca278).
   - Line 63, "agrees with the engine on all 18,000 paths checked": the check counts paths whose survival differs
     (`audit-couples-share.mjs` line 220). So it agrees on survival; no money is compared.
4. **MINOR. The pot, tax and spending are given as pooled means; by unit they run differently.** The plain words' "does better
   on every case, and never worse" holds for survival alone. By unit (`rv/a3.mjs`, `rv/a4.mjs`):
   - Pot left. The median is lower under CANDS on 20 of the 24 re-held units; the median of their ratios is 0.88. Lowest:
     S129-75 0.59 (£8,337,855 to £4,878,827), S265-90 0.60, S129-90 0.62, S291-90 0.63. The fall is not only on the paths that
     end rich (line 78).
   - Capped at four times the opening pots (the couples' deep review's measure), it is about level: lower on 16 of 24, median
     ratio 0.99, lowest S129-75 at 0.86. The lowest tenth is higher under CANDS on all 36.
   - Lifetime tax is higher under CANDS on 10 of the 36 units: every unit of S265, S291 and S129, plus S183-75. For example
     S291-75 goes from £32,572 to £209,812 and S129-db from £219,733 to £310,562. The pooled fall is the older and richer
     units' (for example S155-75, £473,599 to £181,230).
   - Spending delivered is lower on 5 of the 36 units, each beyond noise and all on the three 68/65 couples: S015-db -2.905%
     (-2.947 to -2.864), S015-90 -1.274%, S019-75 -0.857%, S015-75 -0.315%, S043-gain -0.131% (-0.188 to -0.075).

   These deserve a line beside the outcome, as the couples' read's review asked for its shape. They bear on the tie rule for a
   couple's joint move (D97 (2)). Not decomposed.
5. **MINOR. What a PASS reaches by inference has a third part the write-up leaves out (so does the registration's list).**
   - All twelve units with a feature hold 60/40, where `shareFor` gives 0.5 (the file: "share 0.5" on each). So the share rule
     never acted on a couple with a DB pension, a gain or a state pension from 67.
   - `shareFor` weighs pots only, not incomes, and every panel DB pension is the elder's (registration line 50). So the least
     covered case is an uneven couple whose pension income sits with the partner who holds fewer of the pots.
   - The registration says the D-line names what a PASS reaches by inference, so name this beside the registration's two. The
     working tree's uncommitted D99 draft names those two only.
6. **MINOR. The PASS was measured on code 7002a1fec94c, but the working branch's code now stamps b7cd77e5ebec (`code-id.mjs`).**
   - f1b2b457 (D5) changed `src/solver/couple.js` (`singlePlanFor` now adds `personLocks`), and changed `solve.js` and
     `adaptive.js` (a restored solve split).
   - e4b94914 and 11293476 changed `src/solverApp.js` and `src/solverSettings.js`.
   - These look confined to the locks per person, the restore path and the speed mode, which is off. The report's "Next" does
     not say any of this. The change of default should show a couple's solve and path at the new defaults the same as on
     7002a1fec94c, for example an identity on a few of the panel's units, or say what moved.

The recomputations: `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/rv/a1.mjs`
(survival by unit, paired), `rv/a3.mjs` (pot and tax), `rv/a4.mjs` (spending), and `reread.txt` (the read re-run) beside them.
