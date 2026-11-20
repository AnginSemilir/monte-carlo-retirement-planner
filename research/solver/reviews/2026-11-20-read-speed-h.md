Verdict: PASS

# Review at the read: the speed mode on the household plan (`SPEED-H.md`; EXPLORATORY, seed 7002)

Subject: SPEED-H's read: `results-speed-h.txt` and the write-up `reports/2026-11-20-speed-h-read.md` (db35e4fa); STATE.md
section 6's SPEED-H line (l.299); `DECISIONS-PENDING.md` OPEN item 1's "Read (20 Nov, 22:04 UK)" (l.28 to 39); the run
launched from a41b90e8 (`results/speed-h-launch-1.log`, `results/speed-h-7002/`, `runs.log` l.397, 400f09d8); its rule
committed at 977d5fc5.

Read (blobs at HEAD 400f09d8, the tree clean): `SPEED-H.md` 09cde77322; `audit-speed-h.mjs` 8a2f444986;
`reduce-speed-h.mjs` a944356e5b; `batch-speed-h.sh` 5610756037; `reduce-speed-b.mjs` ef65ecd021; `results-speed-h.txt`
28038b6b72; the write-up 55168918d8; STATE.md 0c3a89fdec; `DECISIONS-PENDING.md` 02da5b3e98; `results-speed-b.txt`
9b0f1b21df; `results-speed-b-beside.txt` 05bf3b44f5 and `speed-b-beside.mjs` 0d28226853; `stats.mjs` a4095c8e33;
`fair-gate.mjs` c6b3e87e16; `audit-phase4.mjs` 5ace83959b; `run-from-snapshot.sh` cf7ab99bb4; `src/solverClient.js`
bd27a80045 (the household route, l.240 to 296); `src/solverCouple.js` ecedc57eed (`householdCut`, `householdSolved`,
l.118 to 136); `src/solverWorker.js` 4acaebe7f9 (`inBands`, 'household-plan', 'household', 'simulate', 'runs');
`src/solverSettings.js` 16344e2f5d; `src/solverApp.js` 484d5c38e1; `src/solverStrategy.js` a2b342de48;
`src/solver/household.js` 06b69ec74e; `src/solver/solve.js` b3c20b3e7f (`researchFinish`); `src/solverWords.js`
dff35b178e (l.159); `src/couplesSwitch.js` b33f855de0; the twelve unit logs and arrays. Nothing of seed 7025 and nothing
in `/home/user/sv2-launch` was opened; of `registrations/save-v2.md` only its measures, to see whether it times anything.

Ran (my scripts in the session's scratchpad; nothing in the tree edited; seed 7002 only; each a second or less):
- `node research/solver/reduce-speed-h.mjs`: the same as `results-speed-h.txt` byte for byte, exit 0 (the fair-test
  gate's stamp check passing). `--planted` on it and on `reduce-speed-b.mjs`: all pass (5 and 6).
- `node research/solver/code-id.mjs` at HEAD: 9f9857213b75; `stampFilesHash()` at HEAD: 23744283ca8d. Both the units'.
- A decode of the twelve unit files independent of `rule()`: every figure of the read (below, What holds 4).
- `rule()` per cohort, over the eleven without S047, and each unit's interval; the times with the solve and the
  identical solves' ratios; SPEED-B's couples on today's `stats.mjs` and by `speed-b-beside.mjs`'s time formula; the
  panel's twelve through `src/couplesSwitch.js`.

## What holds

1. **The rule's files are those committed before launch.** `SPEED-H.md`, `audit-speed-h.mjs`, `reduce-speed-h.mjs` and
   `batch-speed-h.sh` each have one commit, 977d5fc5 (20:08:44 UTC); `reduce-speed-b.mjs` one, a8a26e16 (14 Nov). Each
   blob is the same at 977d5fc5, a41b90e8, HEAD and in the tree. 977d5fc5 is an ancestor of a41b90e8, and between them no
   file under `src/` changed (`git diff --stat 977d5fc5 a41b90e8`: HSP-PORT.md, STATE.md, a results file, a review and
   three files under `research/tests/`).
2. **The launch and the stamps.**
   - The launch log: a snapshot of a41b90e8 with no uncommitted file; SMOKE PASSED; "12 units (code 9f9857213b75, audit
     23744283ca8d), 12 to run, 1 at a time, from 20 Nov 20:47 UK"; "runs done 20 Nov 22:04 UK"; exit 0; no "unit k exited"
     line. `runs.log` l.397: the light lane, `none: EXPLORATORY ...`.
   - All twelve logs and arrays: code 9f9857213b75, audit 23744283ca8d, prediction none; seed 7002, 4,000 paths, 45
     points; Node v22.23.4; one host.
   - The snapshot's code files (the audit, both reducers, the batch, the rule, `solverClient.js`, `solverCouple.js`,
     `solverSettings.js`, `solverStrategy.js`, `solverApp.js`, `solver/household.js`, `solver/solve.js`) are a41b90e8's
     blob for blob; its generated `research/engine.mjs` is the main tree's byte for byte.
   - The light lane is the launcher's own (`run-from-snapshot.sh` l.16, l.96 to 97). The registered run beside it times
     nothing, and its figures do not depend on the load.
3. **The gate is fair, and the arms are what the rule says.**
   - The route is the page's: `householdCut` at 'pensionsPA'; the table by `solveForApp` at 45 points with `ageWith`,
     inside `bandsAt(k, paOne, paK)` as the worker's `inBands` (the cut's `paK` already a boolean,
     `solverCouple.js` l.126); `householdSolved` with `topK` 3 and `appJoint`'s `tieJoint` and `holdPast`, as
     `startSolve` asks (`solverClient.js` l.280).
   - The page's counted paths (`strategyRuns`, 'simulate') run `solvedContext`'s policy without `wholeMenu`, as the
     audit does. So the read measures the figures the page shows under the speed mode.
   - The speed mode reaches the table from the plan (`withSpeed`, then `speedOptions` in `solveForApp` l.55).
     `chooserShortlist` is set in `researchFinish`, after the backward pass (`solve.js` l.2910, l.2921). So the digests
     are equal in both arms on all twelve (recomputed), and the speed mode acts on the paths alone: a path's time x0.38 to
     x0.80; the pot left differs on 66 (S301F) to 3,959 (S047) of 4,000 paths.
   - Each arm records its speed mode and its table's shortlist (`[null]`, `['order']`), 'pensionsPA', k 1.6667 and the
     even split. `householdSolved` sets the split and `chooseHouseholdSingle` reads it (`household.js` l.482). Both arms
     run the same `paths` on the same horizon.
   - All twelve are on the guard (`coupleSolverOn`: on, share 0.6, no swap), the elder first, three years apart, no other
     taxable income, each with its own minimum pot. The page would take each by this route.
4. **Every figure recomputes from the arrays.** 10 saved and 14 lost of 48,000, pooled `-0.008` (`-0.030` to `+0.013`);
   spending `-0.0082%`; the pot `-0.008%`, the capped pot `-0.034%`; each unit's cells, spending, pot, tax and time; the
   six units with no path parting; S047 and S115 at `-0.050`; S047's `-0.069%` and `+10.04%`. The outcome HOLDS follows by
   the rule, and the write-up, the STATE.md line and the pending item quote it correctly.
5. **SPEED-B is quoted as printed and framed fairly.** `results-speed-b.txt`'s couples: LOSES (3), `-0.0683%`, `-0.023`
   (`-0.084` to `+0.038`), x0.79. It is called not paired, on another route, code and date. On today's `stats.mjs` its
   pooled interval is `-0.085` to `+0.039`; the rule says to quote the file, and nothing turns on it.
6. **Nothing in the write-up claims more than the read.** Its outcome is the rule's words, its scope SPEED-B's twelve
   couples on seed 7002, and its times are called a guide. Findings 1 to 4 are what the maintainer's choice on the
   warning's words needs beside it.

## Findings (all MINOR; none moves the outcome)

1. **MINOR. "A half in 1,000" is the largest point loss. What the read supports, if the warning's words change, is
   both narrower and wider than that.**
   - Each unit's interval (`rule()`'s `survivalChangeU`): S047 `-0.050` (`-0.273` to `+0.170`), S115 `-0.050` (`-0.176`
     to `+0.070`), every other lower end from `-0.141` to `-0.083`. A loss of SPEED-B's size (S031 `-0.550`, S063
     `-0.500`: the warning's "about 5 in 1,000") lies outside every unit's interval. A loss up to about 2.7 in 1,000 on
     S047 does not. The pooled lower end is `-0.030`.
   - The twelve are one shape: 60/40 of the pots, three years apart, the elder entered first, no other taxable income,
     each with its own minimum pot; k is 1.6667 on all twelve (each log's "k 1.6667"). The household plan at another k,
     a couple with no minimum pot (one year of its target since D136 (1)) and a couple entered younger first are not
     measured.
   - A couple the household plan refuses keeps today's route, where SPEED-B's figures stand (S031 and S063 beyond noise
     after Holm, `results-speed-b-beside.txt` F). None of the library's 210 is refused (`results-household-port-floor.txt`
     item 2), but the warning reaches every couple.
   - The pending item's recommendation (keep the words) rests on none of this; a change of them would.

2. **MINOR. S047 carries nearly all of the pooled spending and capped-pot change, and the pending item quotes the pot but
   not the capped pot.**
   - S047: survival `-0.050`; spending `-0.0687%`; the pot `-0.214%`; the capped pot `-0.442%`; lifetime tax `£98,176`
     to `£108,031` a path (`+10.04%`); its pot different on 3,959 of 4,000 paths. Its capped pot is printed nowhere.
   - `rule()` over the other eleven: spending `+0.0006%`, the capped pot `+0.003%`, the pot `+0.010%`, survival
     `-0.0045`. S047 holds `12.80%` of WHOLE's pounds. Spending weighted equally over the twelve is `-0.0057%` (SPEED-B's
     couples `-0.1220%`, its beside G).
   - So on the household the speed mode's spending cost is not gone. It sits on one couple of twelve, at the size of
     SPEED-B's pooled `-0.0683%` that failed its part 3, and the warning's "it spent a little less" still describes it.
   - `DECISIONS-PENDING.md` l.32 gives "the pot `-0.008%`" (1.6% of its bar) and leaves out the capped pot `-0.034%`
     (a third of its bar), the part 4 figure nearest its bar. STATE.md and the write-up carry both.
   - Print S047's line and the eleven without it by script (CHECKLIST 6), and carry the capped pot in the pending item.

3. **MINOR. Two of the "beside" items the rule committed are not printed:** "each unit's figures in both arms" and "the
   cohorts apart" (`SPEED-H.md` l.78 to 79).
   - The results file prints each unit's change only; each arm's survival is in the logs alone.
   - The cohorts apart (`rule()` per cohort): the library's six `-0.021` (`-0.061` to `+0.018`), spending `-0.0246%`,
     the capped pot `-0.062%`; the younger six `+0.004` (`-0.021` to `+0.029`), spending `+0.0014%`, the capped pot
     `-0.007%`.
   - SPEED-B's harm was its library cohort's (`-0.150` (`-0.254` to `-0.048`), its beside B), where the warning's "for
     some couples" comes from. The like-for-like cohort is the comparison the maintainer needs, and both items print from
     the arrays as they stand.

4. **MINOR. The time, the trade's other half, is a path's alone, timed in one order and under another's load.**
   - WHOLE is always timed first (`audit-speed-h.mjs` l.63). The same table, digest for digest, solved second was faster
     on 11 of 12 units, the median x0.949 (x0.914 to x1.025): an order or drift effect of about 5% in SPEED's favour.
     SPEED-B's couples show x0.975 (10 of 12), also WHOLE first.
   - `SPEED-H.md` l.84 put the launch after the savings split's v2 had freed the cores. It ran beside that run instead,
     which the write-up says. That touches the times only.
   - The speed mode does not shorten the solve, about a quarter of WHOLE's time at 4,000 paths (the median `25.4%`).
     Counted with the solve (`speed-b-beside.mjs` l.117's measure, which printed SPEED-B's couples' x0.82 in its section I
     for the warning's speed; my formula reproduces it, x0.821, x0.579 to x0.915), SPEED-H's twelve give x0.72 (x0.49 to
     x0.86) at 4,000 paths, the seventh of twelve as SPEED-B's (the two middle units' mean x0.70); x0.77 at 2,000 and
     x0.70 at 5,000.
   - So on the household the speed mode saves more time than on today's route, but less than x0.63 reads as the wait.
     The write-up's "a guide" names the light lane only. The reducer's "median" is the seventh of twelve (x0.628; the
     two middle units' mean x0.613), as SPEED-B's was, so x0.63 against x0.79 is like for like.
