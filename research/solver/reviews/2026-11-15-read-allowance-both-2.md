# Review at the read, second round: the allowance's step at both places (`ALLOWANCE-BOTH.md`; D98; EXPLORATORY, seed 7002)

Subject: acc662a4, the answer in one fix to the first round (`reviews/2026-11-15-read-allowance-both.md`, FAIL: one
BLOCKING, five MINORs). This round decides (D81 (F)).

Read (blobs at acc662a4):
- The fix, `git show acc662a4` whole:
  - `reports/2026-11-15-allowance-both-read.md` 2dcf10c5;
  - `allowance-both-beside.mjs` dfdc30a6 and `results-allowance-both-beside.txt` 40c31aa1;
  - `DECISIONS-PENDING.md` 39becf52 (l.39-52) and `STATE.md` 1e262f72 (section 6 action 3's D98 clause);
  - the first round's file 0bba4a49, and `fast-inputs.json`'s one line.
- The read, unchanged:
  - `results-allowance-both.txt` 88650873, as at 905a2c7e;
  - `ALLOWANCE-BOTH.md` 01d1f09c, `audit-allowance-both.mjs` 005f2543, `reduce-allowance-both.mjs` 58325c9b and
    `batch-allowance-both.sh` 070aac5d, as at bb2c48dd.
- 13 Nov: `results-ceiling-lead.txt` 9bed5b1a (l.4-12, 47) and `audit-ceiling-lead.mjs` fc816b8d (`engineFor`,
  `probeOf`).
- The code. Each blob is the same at the launch (28a38c6a) and at HEAD:
  - `src/solver/solve.js` b3c20b3e: `buildActions` l.115-160; the anchors' groups, `restKey`, `orderOf` and `nbrO`,
    l.3039-3052;
  - `src/solver/fast.js` 0e962057: `drawPension` l.516-528 and `drawStep`;
  - `src/solver/model.js` 7cfc7fec;
  - `src/App.jsx` 6f9e21aa: `pensionCeiling` l.1621-1635; `N4_PEN` and `N4_RAW` l.2130-2132; `drawPension`
    l.2374-2401; the steps l.2563-2574; `stepYear`'s move l.2147-2165; `buildContext`'s incomes l.1812-1830;
  - `src/solverStrategy.js` a4bbb1c4 (`runPath`);
  - `research/tests/allowance-both.test.mjs` a740a2f7 (checks 2, 4 and 5).
- History: `git log bb2c48dd..28a38c6a` and its `src` diff (App.jsx and couple.js); `git diff 28a38c6a HEAD -- src`
  (couples' files only); `runs.log` l.369 and 371.
- The units: the eight in `results/allowance-both-7002` and the eight in `results/ceiling-lead-7002`. Nothing of seed
  7021, D4, `d4-backup` or `d4b-backup` was opened.

Ran, read-only on the repository. Every script ran at `nice -n 19` beside the browser gate, one process at a time. My
scripts are in the session scratchpad's `review-aboth-2/`.
- **The committed scripts:**
  - `allowance-both-beside.mjs` is byte-identical to `results-allowance-both-beside.txt` (`cmp`).
  - `reduce-allowance-both.mjs` is byte-identical to `results-allowance-both.txt`, and `--planted` passes.
  - `check-state.mjs`: STATE.md passes (300 lines).
- **My own checks on the arrays:**
  - `own.mjs`: the survival change by household, pooled and without S090, and the two pots, by my own arithmetic on
    the arrays.
  - `s188-rawpa.mjs`: S188's and S090's changes in pounds.
  - `keys.mjs`: the arrays each run's units store.
  - `plant-e.mjs`: section E run on a copy of the 13 Nov units, with S328F's RAWPA tax a pound higher on one path.
  - `menu.mjs`: `buildActions` with five levels and four tier pairs.
- **`ladder-probe.mjs`**, on each of the eight:
  - BOTH solved as the audit solves it (`solveForApp`, 45 points, `menuPlus` hr and paraw), its tables' digest the
    unit's on all eight;
  - the first 200 paths of seed 7002 replayed through `stepYear`;
  - at every decision-year, two clones of the state stepped: one under the chosen move, one under the chosen move with
    `penPAr` taken out of its steps and cost steps (NOW's move);
  - the first clone checked against the real step: the same in every year on all eight.
- **`corner-probe.mjs`**, on all but S050: BOTH's solve again (its digest the unit's), over the first 1,000 paths. It
  counts the decision-years where the engine's row gives the year's interest and dividends above the basic band's
  width, with money in the pension at the decision.
- **`now-choice.mjs`**, on S090, S328F, S340F and S030:
  - NOW and BOTH solved, both digests the units';
  - at BOTH's states in those years, NOW's tables asked for their move;
  - each band ladder NOW chose stepped beside its twin through `penPAr`.

What holds:
- **The read** is unchanged since 905a2c7e, and its rule's files since bb2c48dd. It reproduces, and its outcome,
  FAILS (4), stands.
- **Finding 1 (BLOCKING), answered.**
  - The report (l.29-38) now says what the draw count counts: 40 of the 60 base moves, 10 of them the new draw and 30
    the old ladders. Those are `buildActions`' figures (section D). At five levels and four tier pairs it is 800 of
    1,200, 200 of them the new draw.
  - It keeps the re-wrap counts as the take-up, and gives S188's line as it reads, the cause not shown.
  - **My replay reproduces every unit's counts** household by household (S188 1,510 and 73 of 8,200).
  - **It bears the account out on these runs.** The 3,660 years the units count split into 1,318 years of the new
    draw and 2,342 of an old ladder:
    - the new draw changes the year against `penPA` alone in 1,317 of its 1,318;
    - an old ladder changes it against NOW's ladder in none of its 2,342.
  - By household (new draw / old ladder):
    - S030 209 / 331, S090 335 / 193, S368 0 / 13, S188 42 / 1,468;
    - S304F 129 / 0, S328F 379 / 69, S340F 224 / 268, S050 0 / 0.
  - Moves with `penPAr` only after the other sources never change the year (63,781 years).
  - So S188 takes the new moves in 115 of its 8,200 decision-years: 42 draws and 73 re-wraps. "The cause is not
    shown" is right. "The units do not split them" is right of the units; a replay splits them.
- **Finding 2, answered.**
  - The report (l.20-26 and 47-50), DECISIONS-PENDING (l.44-48) and STATE's clause say that:
    - both effects are S090's;
    - without S090 the rule would read NO GAIN;
    - the FAIL is the capped-pot bar declining the trade, not the objective.
  - S090's whole score carries its interval in the report and "within noise" in DECISIONS-PENDING.
  - My own arithmetic gives the beside file's figures:
    - S090 +0.081 of the summed +0.150 (54.2%);
    - all eight: +0.019 (+0.002 to +0.035), the pot -0.155%, the capped pot -0.187%;
    - without S090: +0.010 (-0.004 to +0.023), -0.162%, -0.061%.
- **Finding 3, answered** in "What it does not show" (l.91-96).
  - The 'O' neighbours are as it says. They differ by one leading pension step or by the ISA/taxable order, within the
    same re-wrap, `restKey` (lump, windfall, save, sale), level and tier (solve.js l.3049-3052).
  - Finding 1 below adds a second way.
- **Finding 4, answered** (l.39-41 and 58-61).
  - The code ids: be2f925c8252 at bb2c48dd (runs.log l.369) and 6b2dc56b2f82 at the launch (l.371). The two commits
    between that touch `src` are 4ada22b4 and da4669d8.
  - For a single, `buildContext` keeps "Myself" incomes alone, and `planEndAge('Myself')` is `terminalAge` as
    before. `singlePlanFor` is a couple's.
  - Section E compares every array the 13 Nov units store (`survived, delivered, target, pot, tax`) and the digest. It
    is not vacuous: on the planted copy it prints `S328F NOW the same, RAWPA DIFFERENT (tax)` and the rest the same.
  - +0.020 and -0.244% are `results-ceiling-lead.txt` l.47's.
- **Finding 5, answered:** section B prints both halves, through the reducer's `part4`.
- **Finding 6, answered** (l.97-100). `allowance-both.test.mjs` checks 4 and 5 are seeded random moves: check 4 on a
  test household, S330 and S090; check 5 a couple against the exact model.
- **Since the launch**, `src` has moved in couples' files only. Every re-solve here reproduced its unit's digest.

Verdict: PASS

## Findings

1. **MINOR. "They draw exactly what they drew before" (report l.34) is true of every year these runs took an old
   ladder, but not of the menu.**
   - **Where it came from:** my first round's sentences, which were too wide. Finding 1 said "A ladder through penPAr
     draws what NOW's draws" and finding 3 said "holds in flow". I showed both at one dividend level, £8,000 a year.
   - **What the code does:**
     - Each pension step draws from the year's taxable income so far, up to its own ceiling (App.jsx l.2383-2384;
       fast.js l.521-522).
     - `penBasic`'s ceiling is `max(a, free)`, where `a = min(50,270, 50,270 - interest - dividends)` (App.jsx l.1626,
       l.1634).
     - Once the year's interest and dividends pass £37,700, `a` falls below the allowance. Then
       `penPA+penPAr+penBasic` draws to £12,570 where NOW's `penPA+penBasic` stops at `a`. Past £87,430 the same holds
       for the `penHR` ladder.
     - Every BOTH ladder passes `penPAr` (solve.js l.130-131, 147). So in such a year BOTH has no move that draws as
       NOW's band ladders do, and "NOW's moves are BOTH's less the new ones" (`ALLOWANCE-BOTH.md` l.56) is not a
       property of the option as built.
   - **Where these runs reach it.** Such a year (with money in the pension) occurs on BOTH's own paths for five of the
     eight, over the first 1,000 paths:

     | household | decision-years | paths |
     |---|---|---|
     | S328F | 4,092 | 204 |
     | S340F | 979 | 77 |
     | S090 | 217 | 34 |
     | S030 | 52 | 13 |
     | S304F | 4 | 3 |
     | S188, S368 | none | none |

   - **What NOW's tables would choose in those states:**
     - On S090 (217) and S030 (52), no pension draw first, every time.
     - On S328F, `penPA+penBasic` in 119 of the 4,092; on S340F, in 12 of the 979.
     - In each of those 131, the twin through `penPAr` draws otherwise. On average it draws £4,438 more gross a year
       and pays £686 more tax on S328F, and £1,509 and £230 on S340F.
   - **So the corner does not reach S090**, the household that decides the FAIL. Where it costs BOTH a move NOW's
     tables would take, that is 131 of 122,000 decision-years on two households: S328F, whose capped pot is 6.4% of
     the fall, and S340F, whose capped pot rises. The outcome stands, and no figure moves.
   - **The fix, a line each:**
     - add "on these runs" at l.34;
     - add this second way BOTH is not NOW with moves added to "What it does not show". It also reaches the tables:
       they are solved on cells where the band ladders are missing, which no replay of paths measures.
   - **For the record, should the offer be reopened:** offered as a branch of its own (`penPA+penPAr` alone) rather
     than a rung inside every ladder, BOTH would contain NOW's menu. The build's test has no case past £37,700 of
     interest and dividends (check 2 is at £8,000).
2. **MINOR. Two figures in the report are printed by no script, against its own l.5.**
   - "-£24" and "+£268" (l.37-38) are differences of the read's S188 lines: capped £1,830,308 / £1,830,284, tax
     £180,950 / £181,218. They are right to the pound; the arrays give -£23.65 and +£267.57.
   - The commit message's "every figure the reviewer gave reproduced" is wider than the beside file. The file prints
     the figures the write-up uses, not, for example, the first round's standard errors or S090's split at the cap.
   - The fix: print RAWPA less NOW by household in pounds in the beside file, or drop the two.
