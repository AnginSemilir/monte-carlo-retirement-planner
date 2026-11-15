# Review at the read: the allowance's step at both places (`ALLOWANCE-BOTH.md`; D98; EXPLORATORY, seed 7002)

Subject: the read committed in 905a2c7e:
- `results-allowance-both.txt`, the reducer's output whole (OUTCOME FAILS (4));
- `allowance-both-beside.mjs` and `results-allowance-both-beside.txt`, written after the read;
- the report `reports/2026-11-15-allowance-both-read.md`;
- DECISIONS-PENDING.md's top entry (15 Nov, morning; l.14-20);
- STATE.md section 6 action 3's D98 clause.

Read (blobs at 905a2c7e):
- The write-up: `results-allowance-both.txt` 88650873, `results-allowance-both-beside.txt` fd21b0fd,
  `allowance-both-beside.mjs` 6aa789d1, `reports/2026-11-15-allowance-both-read.md` 0cda2f4a, `DECISIONS-PENDING.md`
  e29764a4, `STATE.md` d5f09a53.
- The rule's files, the same blob at bb2c48dd (the rule's commit), at 28a38c6a (the launch), at 905a2c7e and in the working
  tree: `ALLOWANCE-BOTH.md` 01d1f09c, `audit-allowance-both.mjs` 005f2543, `reduce-allowance-both.mjs` 58325c9b,
  `batch-allowance-both.sh` 070aac5d. The audit stamp's other files are likewise unchanged: `audit-ceiling.mjs` 48eecf4f,
  `audit-ceiling-lead.mjs` fc816b8d (`engineFor`, `probeOf`), `reduce-ceiling.mjs` d1dc19e0, `reduce-isasweep.mjs` cf1146ad
  (`pairOf`), `reduce-phase4.mjs` ac319aad (`wholeScore`, `byPath`), `stats.mjs` 7cf309da (`survivalChangeU`, `wilson`,
  `zFor`). Also unchanged: `fair-gate.mjs` 4d4a2040 (`requireFairLogs`), `code-id.mjs` f00aa5b3, `run-from-snapshot.sh`
  cf7ab99b.
- The code, the same blob at 28a38c6a and 905a2c7e: `src/solver/solve.js` b3c20b3e (`buildActions`, the chooser's ties,
  `coarseSetup`), `src/solver/fast.js` 0e962057 (`drawPension`, `drawStep`), `src/solver/model.js` 7cfc7fec, `src/App.jsx`
  6f9e21aa (`N4_PEN`, `N4_RAW`, `drawPension`, the steps, the harvest, `buildContext`), `src/solverStrategy.js` a4bbb1c4
  (`runPath`), `research/tests/allowance-both.test.mjs` a740a2f7.
- `git diff bb2c48dd 28a38c6a -- src` (App.jsx and couple.js only), and 4ada22b4 and da4669d8 whole. `runs.log` l.361, 369
  and 371. The launcher's log `aboth-launch.log` in the session's scratchpad.
- The eight units in `results/allowance-both-7002` (`case<k>.txt` and arrays), and for comparison CEILING-LEAD's eight in
  `results/ceiling-lead-7002`. Nothing of seed 7021, D4 or either backup branch was opened.

Ran (read-only on the repository, each a few seconds at `nice -n 19` beside the browser gate; my scripts are in the session
scratchpad, `check-aboth.mjs` and `check-score.mjs` at its top and the rest in `review-aboth-1115/`):
- `reduce-allowance-both.mjs --planted`: all 11 planted checks pass.
- `reduce-allowance-both.mjs` on the units: byte-identical to `results-allowance-both.txt`. `allowance-both-beside.mjs`:
  byte-identical to `results-allowance-both-beside.txt`. `stampFilesHash()`: 07b1ad74d638, the units' audit stamp.
- `check-aboth.mjs` does the following:
  - recomputes the rule's block and RAWPA's from the arrays, with its own arithmetic (the paired cells, Wilson and
    `survivalChangeU`'s interval, the capped means);
  - prints each unit's stamp, cap, score inputs, plan hash and settings;
  - compares NOW's and RAWPA's tables' digests and every stored array with CEILING-LEAD's units.
- `check-score.mjs`: the whole score by household and by term (survival, the capped estate, the cut cost, the raise).
- `without.mjs` (each household left out, through the reducer's `compare`), `bypath.mjs` (pooled survival by path),
  `s090.mjs` and `tax.mjs` (the pot below and above the cap, tax and the pot with their paired se's), `last.mjs` (the
  estate against the pot in every arm, and the summed capped change).
- `menu.mjs`: BOTH's base menu sorted by leading pension run, as the audit's `leadsRaw` and `wrapsRaw` count it.
- `waypoint.mjs`: one year by hand, in the engine and the forward run (`allowance-both.test.mjs`'s taxable household,
  dividends at 2%). It compares `penPA+penBasic` with `penPA+penPAr+penBasic`, and the new draw beside them.

What holds, by the brief's four points:
- **1. Once, by the rule as committed.**
  - **The rule's files:** unchanged since bb2c48dd (the blobs above).
  - **The launch:** through the launcher, 15 Nov 05:35 UK (runs.log l.371). The snapshot was from 28a38c6a with no
    uncommitted file, the seed 7002 the tuning seed's. Runs done 07:21 UK, no unit exiting.
  - **One stamp:** every log and array says `code 6b2dc56b2f82 audit 07b1ad74d638 prediction none sha -`, with one Node
    and one CPU model. All are seed 7002, 16,000 paths, 45 points, W 0.02, the candidate 17ff82379838.
  - **The gate:**
    - The menus are 800, 1,200 and 800 moves, read back from each solve.
    - NOW's and BOTH's `pensionCeiling` read 7070 at the allowance (with £3,000 of interest and £3,000 of dividends);
      RAWPA's reads 12570, the allowance as given.
    - Each household has one plan hash across its arms, and it is CEILING-LEAD's. The settings line is the same in every
      arm (`pts 45 | coarse on | tieAboveCap 0.0001`), and so are the horizons and the score's inputs.
    - Each unit's cap (four times its opening wealth) equals every arm's score cap. The estate equals the pot on every
      path.
    - The gate is fair by these fields and by construction (one process; the arms' solves differ in `menuPlus` and
      RAWPA's engine alone), as CEILING-LEAD's was.
  - **Every figure** of the rule's block and of RAWPA's is reproduced by my own arithmetic, the households' lines with
    them. The outcome is the parts' outcome: part 4 fails, so FAILS.
  - **No figure sits at a bar.**
    - The capped pot's -0.187% has a paired se of about 0.011% (households independent). It is at most 0.021% if every
      household's path changes moved together, so -0.1% is far off either way.
    - Part 1's lower end is +0.002 against -0.1. The lowest upper end in part 2 is +0.024 (S050, S368). Part 3's +0.0059
      is against -0.05.
    - Part 5's survival lower end, +0.002, is a quarter of an se above nought. It cannot decide: part 4 gives FAILS
      whatever part 5 reads.
    - By path (`byPath`), pooled survival is +0.019 (+0.002 to +0.035), as the rule's summed variance gives it.
  - **The engine's changes between the rule and the launch reach none of these runs.**
    - From the code:
      - `git diff bb2c48dd 28a38c6a -- src` is App.jsx `buildContext` and couple.js `singlePlanFor` only.
      - `planEndAge` (App.jsx l.1819) changes only a partner's income. A single keeps only "Myself" incomes (l.1820),
        and these eight have none at all (`phase4-panel.mjs`: planning mode single, no other incomes).
      - `singlePlanFor` is a couple's cut, called only from couple.js's and solverCouple.js's couple paths.
    - From the data: NOW's and RAWPA's tables' digests, and every stored array (survived, delivered, target, pot, tax),
      are CEILING-LEAD's (code 7002a1fec94c, 13 Nov) byte for byte, on all eight households and both arms
      (`check-aboth.mjs`).
    - So nothing in the code since 13 Nov moved NOW or RAWPA, the option's own build off in code included. "Without the
      option nothing changes" holds at 45 points on all eight.
- **2. The beside script** reads the same eight files through the reducer's `armOf`, `compare` and `RULE`. Its lines
  compute what they say:
  - each household's capped pot, BOTH against NOW, in pounds and percent;
  - the share of the summed change (-£21,565);
  - the pooled capped pot without each household (-0.061% without S090).

  Its last line's label is wider than what it computes (finding 5).
- **3. The account.**
  - **S090's capped fall beside its lower tax is shown, both beyond noise:**
    - the capped pot -£15,369 (se £1,000);
    - lifetime tax -£6,089 a path (se £73);
    - the mean pot unmoved within noise (-£758, se £2,755).

    So the pot moves from paths below the cap to paths above it. On the 13,250 paths at or below the cap in both arms,
    the mean pot is £18,282 lower and the tax £7,597 lower; above the cap the pot is £14,611 a path higher. Why is a
    lead, as the report says.
  - **The re-wrap counts show the step taken.** `paraw` sits after `pa` in the menu, and a tie keeps the earlier move
    (solve.js l.1895, l.1909, l.1950), so a re-wrap to `paraw` is chosen only where it differs from `pa`. S030's 2,028 and S090's
    1,820 stand.
  - **The draw count does not show it** (finding 1).
  - **RAWPA's figures are right.** They are 13 Nov's again (finding 4).
- **4. What it should say beside the outcome:** findings 2, 3, 4 and 6.

The read's outcome, FAILS (4), stands by the rule: the offer is closed and nothing changes. The FAIL below is the
write-up's, on finding 1.

Verdict: FAIL

## Findings

1. **BLOCKING. The draw count is not the new step's take-up, and the report's account of S188 rests on it.**
   - **Where:** the report l.24-25: "The solver takes the new step where it bites: ... and S188 draws through it 1,510
     times".
   - **What the count is:** `audit-allowance-both.mjs` l.44, `leadsRaw`: a move whose pension steps before the first other
     source include `penPAr`.
     - BOTH's ladder is `penPA, penPAr, penBasic, penHR, penAny`, with every leading run of it a move (solve.js
       l.130-131). So the count takes 40 of BOTH's 60 base moves (`menu.mjs`).
     - Ten of those 40 are the new draw, `penPA+penPAr`.
     - Thirty are NOW's own ladders `penPA+penBasic`, `+penHR` and `+penAny` with `penPAr` between. BOTH has no move
       without it.
     - It is not the rule's "how often BOTH takes each new move" (`ALLOWANCE-BOTH.md` l.85) for the draw.
   - **A ladder through `penPAr` draws what NOW's draws.** Each pension step is a ceiling on the year's taxable draw, and
     `penBasic` carries on from where `penPAr` stops (App.jsx `drawPension` l.2374-2401 and the steps l.2563-2574;
     fast.js l.516-545).
   - **By hand** (`waypoint.mjs`), at targets of £8,000, £14,000, £30,000 and £60,000:
     - the engine's year under `penPA+penBasic` and under `penPA+penPAr+penBasic` differs by at most £9.1e-13;
     - the forward run's state does not differ at all;
     - the new draw stops at the allowance (£16,760 drawn, where both ladders draw £33,285 at £30,000).
   - So S188's 1,510 mixes two kinds of year: those whose move is one of NOW's ladders through `penPAr`, doing exactly what
     NOW's menu would, and those in which it draws to the allowance as given. The units record no split, and "where it
     bites" is not shown for a draw.
   - **S188's part of the fall is not the old allowance's, as RAWPA measures it:**
     - BOTH: the capped pot -£4,624 (-0.253%), the mean pot -£6,263 (se £1,868), lifetime tax £180,950 to £189,190
       (se £193), survival unchanged (4 paths saved, 4 lost), `paraw` re-wraps in 73 of 8,200 decision-years;
     - RAWPA, the allowance as given everywhere: the capped pot -£24, tax +£268.

     The read does not show what S188's fall is (finding 3 names one candidate). Read beside "S188 pays more" (l.22-23),
     the sentence gives the maintainer a mechanism the data do not show.
   - **The fix:**
     - say what the draw count is: moves whose leading pension run passes `penPAr`, three in four of the menu's such
       moves NOW's ladders through it;
     - keep the re-wrap counts as the evidence of take-up, on S030 and S090;
     - give S188's line as it reads, its cause not shown.

     A replay of S188's BOTH on its first 200 paths, counting the leading run `penPA+penPAr` alone, would split the
     count. The read does not need it.
2. **MINOR. Both of the read's effects are S090's, and on S090 the FAIL is the rule's guard declining a trade the solver's
   own score takes.**
   - **S090 carries the survival gain as well as the fall:** +0.081 of the summed +0.150 points (54%), beside 71.3% of
     the capped fall.
   - **Without S090** (`without.mjs`, through the reducer's `compare`):
     - pooled survival +0.010 (-0.004 to +0.023), the whole score +0.009 (-0.005 to +0.023);
     - the pot -0.162%, the capped pot -0.061%.

     Parts 1 to 4 hold and part 5 fails: the rule would read NO GAIN. "Without S090, part 4 would hold" (report l.21,
     DECISIONS-PENDING l.19) is true, and the gain goes with S090 too.
   - **On S090 the engine's whole score is +0.047 (se 0.047):** survival +0.081 (se 0.046) against the capped estate's
     -0.032 (se 0.002) (`check-score.mjs`).
   - **BOTH sits between NOW and RAWPA there:**
     - survival +0.081 under both (BOTH against RAWPA, 27 paths saved and 27 lost);
     - the capped pot -£15,369 against RAWPA's -£26,501;
     - tax -£6,089 against -£8,689.

     Offered both places, the solver takes part of the trade CEILING-LEAD found.
   - **"The external review's question is answered for this panel: no"** (report l.31) is the rule's capped-pot bar
     (`ALLOWANCE-BOTH.md` l.64-65, set there because "the pot above the cap is where the step's trade showed", l.72)
     declining that trade, not the solver's objective. The report, DECISIONS-PENDING's entry and STATE's clause should say
     so beside the outcome.
3. **MINOR. BOTH is not NOW with the new moves added: the solve on anchors walks a longer ladder.**
   - `coarse` is on in every arm (the candidate's `expand` 'LRVOH', `climb` 3). Between anchors a cell's shortlist is
     widened by 'O', one step along the leading pension run (solve.js l.3049-3052, `orderOf` and `nbrO`).
   - In NOW, `penPA`'s neighbour is `penPA+penBasic`. In BOTH it is `penPA+penPAr`, and NOW's `penPA+penBasic` (as
     `penPA+penPAr+penBasic`) is two steps away. So BOTH's approximate solve over the old moves differs from NOW's, as well
     as offering the new ones.
   - The gate's "NOW's moves are BOTH's less the new ones" (`ALLOWANCE-BOTH.md` l.56) holds in flow (finding 1). It does
     not hold in the menu the shortlist walks; `reduce-allowance-both.mjs` l.66 checks the sizes alone.
   - The read is of the option as the candidate's route solves it, which is what the rule asks, so the outcome stands. But
     how much of BOTH less NOW is this, and not the old allowance's value, is not shown. S188, which loses with nothing
     gained and which RAWPA leaves alone, is where it could be. "What it does not show" should say so.
4. **MINOR. NOW and RAWPA are 13 Nov's units byte for byte, and the write-up says neither that nor that the code moved.**
   - The code at the rule's commit was be2f925c8252 (TIE-C's launch from bb2c48dd, runs.log l.369). At the launch it was
     6b2dc56b2f82: 4ada22b4 and da4669d8, a couple's cut and a partner's blank income end age. The write-up gives the
     launch's code alone.
   - The identity above is the evidence that the change reaches neither arm, and the code shows it reaches no single's
     run, BOTH's included. Both are worth a line.
   - RAWPA against NOW is CEILING-LEAD's comparison again on the same arrays, not a new measurement. Its +0.020 (+0.002 to
     +0.037) is that read's (STATE.md section 5), and S090's capped -£26,501 is the figure CEILING-LEAD's reviewer gave.
     The report (l.26-27) gives it as this run's finding.
5. **MINOR. The beside script's last line computes half of part 4.**
   - `allowance-both-beside.mjs` l.25 tests `.capped >= RULE.capped` under "the households without whom part 4 would
     hold". Part 4 is both halves (`reduce-allowance-both.mjs` l.43).
   - Here the other half holds without S090 (the pot -0.162%, within 0.5%), so the line is right. But no script prints
     it, where the report says every figure is printed.
   - Use `.part4`, or print the pot beside.
6. **MINOR. No forward run beside the engine.**
   - The audit holds `runPath` to `E.runTrial` on the first 200 paths, on survival and lifetime tax (l.76). Both are the
     engine's own year.
   - No `runPolicy` rollout of the solved tables runs beside it. That the forward run and the engine agree under the new
     moves rests on `allowance-both.test.mjs` checks 4 and 5: seeded random moves on the test's households, not these
     eight's solved policies.
   - "What it does not show" should say which check was run.
