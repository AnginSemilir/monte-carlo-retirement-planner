# Review at the read: a couple's tie rule above the estate caps, stage A (`TIE-C.md`; D97 (2); EXPLORATORY, seed 7002)

Subject: the read made once on 15 Nov, `results-tie-couple.txt` (TIE-C OUTCOME: FAILS), and its write-up, all committed in
78c775fb:
- `reports/2026-11-15-tie-couple-read.md`;
- the top entry of `DECISIONS-PENDING.md` (l.14-23);
- STATE.md section 6 action 3's TIE-C clause.

Beside them, written after the read: `tie-couple-beside.mjs` and `results-tie-couple-beside.txt`.

Read (blobs at 78c775fb unless named):
- The rule's files, the same blob at af04f0f4, at the launch commit bb2c48dd and now: `TIE-C.md` 6628900c,
  `reduce-tie-couple.mjs` a7e2eb1a, `audit-tie-couple.mjs` 86b3a072, `batch-tie-couple.sh` 46f2eb07.
- The read and its write-up: `stats.mjs` 7cf309da, `tie-couple-beside.mjs` 5bfb88b4, `results-tie-couple.txt` ae71b79e,
  `results-tie-couple-beside.txt` aa4457b9, `reports/2026-11-15-tie-couple-read.md` b8e22c95, `DECISIONS-PENDING.md`
  aa3503af, `STATE.md` 478207ce.
- The code: `src/solver/couple.js` ad2f2a95 (`aboveCaps`, `tiePick`, `chooseJoint`, `expectedValueSlow`, `solveCouple`,
  `couplePolicy`; 0eb988c1 at bb2c48dd), `src/solver/solve.js` b3c20b3e (l.2909-2914, the estate cap),
  `research/tests/couple-tie.test.mjs` 8d5261e7 (its header).
- The audit's support: `audit-phase4.mjs` 5ace8395 (`runPath`), `fair-gate.mjs` 4d4a2040 (`checkLogStamps`),
  `audit-couples.mjs` f50aa99d (`solverPlan`), `couple-panel.mjs` 9db4b1f6, `couples-panel-d4b.json` 1d2a56c8.
- The launch: `code-id.mjs` f00aa5b3, `run-from-snapshot.sh` cf7ab99b, `runs.log` 733c6297.
- The two commits after the launch and before the read, 4ada22b4 and da4669d8.
- The eight unit logs and arrays in `results/tie-couple-7002`.

Ran (read-only on the repository; my scripts and their outputs are in the session scratchpad):
- `node research/solver/reduce-tie-couple.mjs`: byte-identical to `results-tie-couple.txt`, the gate fair. `--planted`: all
  ten checks pass.
- `node research/solver/tie-couple-beside.mjs`: byte-identical to its results file.
- The audit stamp on the working tree is `7b9df3fbbd4b`, the run's.
- bb2c48dd's tree, extracted with `git archive` into the scratchpad, its engine rebuilt by `build-engine.py`: `code-id.mjs`
  prints `be2f925c8252`, the run's code stamp.
- My own decoding of the eight units' arrays (not the reducer's functions): every per-couple figure of the read reproduced.
  Per path, by arm: the survival cells, the failure years, the spending delivered, the pot and the tax.
- A probe (EXPLORATORY, deciding nothing), on the working tree's code:
  - S311F solved as `audit-tie-couple.mjs` solves it, twice, at 45 points;
  - the engine re-run on paths 0, 1474, 4468 and 5461 of seed 7002 under all three arms, each year's joint move, tiers held
    and wrappers traced;
  - along TIE5's own path, CANDS's chooser handed TIE5's state;
  - the re-run's pot and lifetime tax equal the stored arrays to the penny on all twelve path-arms.
- The two fixes since the launch do not reach the eight couples. Their cut plans are the same on bb2c48dd's `couple.js` and on
  the working tree's, and none holds a band, a gift, another income or an older partner.

I opened nothing of seed 7021, D4, `d4-backup` or `d4b-backup`.

Verdict: FAIL

The read stands: it was made by the rule as committed, the gate is fair, and the outcome is FAILS as part 5 gives it. Nothing in
the code is wrong. The FAIL is the write-up's account of why S311F fails part 5 (finding 1) and the next step it offers on that
account (finding 2).

What holds:
- **The rule's files and stamps.**
  - The rule's four files are the blobs committed at af04f0f4, unchanged through the launch and the read. The reducer re-runs
    byte for byte.
  - All eight logs and units carry one stamp: `code be2f925c8252 audit 7b9df3fbbd4b prediction none`. The code stamp is
    bb2c48dd's tree, launched through the launcher (`runs.log`, 15 Nov 01:21 UK).
  - Each unit's two table digests are the same before the first arm and after the last.
  - Each arm's margin is read back from the field the chooser reads (`cp.tieJoint`, `audit-tie-couple.mjs` l.94) and from
    `cp.meta`, as named. The arms share one `pathsForSeed` call.
- **The outcome is the rule's.**
  - Both arms hold parts 1 to 4, 6 and 7 and fail part 5 on S311F alone: -0.6918% and -0.8035% by my decoding. With neither
    passing the outcome is FAILS, and with part 7 holding there is no STOP.
  - No figure sits where floating point could decide it.
- **Survival** is unchanged more strictly than the interval says: no path's survival or failure year differs on any couple at
  either margin (0 saved and 0 lost of 64,000 at each).
- **Read once.** Nothing in the record says otherwise: the last unit was written at 03:52 UK and the read committed at 03:55.
- **The beside script** reads the units through the reducer's own `armOf` and `rule`.
  - Sections A and B compute what their labels say.
  - So do three of section C's figures: the paths higher and lower (a change beyond 50p), the median change (`s[n >> 1]`, the
    upper middle value, £0) and the worst 1%'s share (the 80 lowest changes, summed over 8,000).
  - Its tax line does not (finding 1).

## Findings

1. **BLOCKING. The account of S311F's fall does not match the arrays, and the conclusion drawn from it does not follow.**

   Where it sits: the report l.25-33, l.35-37 and l.55-56; DECISIONS-PENDING l.19-21; STATE.md's clause ("S311F's fall carried
   by a few paths far above its cap"). Its first sentence holds: the fall does sit on paths with pots far above the £9.6M cap.
   The rest does not.

   **(a) The tax line is wrong.** Report l.31 says "Its lifetime tax is lower on 2,541 paths, by £77,735 on average". The figure
   comes from `tie-couple-beside.mjs` l.44-45, `gbp(-mean(taxD))`, which is the mean over all 8,000 paths.
   - TIE5: over the 2,541 paths the mean fall is £263,188. Tax is higher on 686 paths, by £68,334 on average, which nothing
     prints.
   - TIE4: tax is lower on 2,231 paths, by £398,794 on average, and higher on 1,222, by £68,397.

   **(b) On the paths that carry the fall, lifetime tax is higher, not lower.**
   - TIE5: the 686 paths with more tax carry -£605,572 of the -£426,962 mean change, and 547 of them leave less. The 2,541 paths
     with less tax carry +£178,609, and 2,482 of them leave more.
   - Of the 80 worst paths, 8 pay less tax; their mean tax change is +£268,269.
   - TIE4: -£608,218 from the paths with more tax and +£112,298 from those with less.
   - Where the rule pays less tax, S311F's pot rises.

   **(c) Two paths decide part 5, not "a few" or "the 80 worst".**

   | path | CANDS's pot | TIE5's pot | change | lifetime tax | share of the mean change |
   |---|---|---|---|---|---|
   | 4468 | £7,434.5M | £4,895.7M | -34.1% | +£764k | -£317,350 |
   | 5461 | £12,657.3M | £10,536.3M | -16.8% | +£420k | -£265,129 |

   - The two carry more than all of the mean change. Without them S311F's change is +0.263% at TIE5 and +0.146% at TIE4, and
     both would pass.
   - So "S311F's -0.692% and -0.804% are far past part 5's [bar]" (l.55-56) is true only in percentage points.
   - S311F's mean is that concentrated. Its largest path, p1474 at £44,917M, is 9.1% of the couple's mean pot, and its top ten
     are 30.4%.
   - The paired standard error of S311F's mean change is 0.671% and 0.720% of that mean, against 0.001% to 0.022% on the other
     seven couples.
   - A paired bootstrap of the percent change runs from -1.61% to -0.18% at TIE5. Its median, -1.09%, is 0.4 of a point from
     the estimate.
   - No interval from these paths says whether the rule lowers S311F's mean pot. On this couple, part 5's bar (a point bar of
     0.1%, with no allowance for noise) is decided by two paths.
   - S311F has two more large losses at TIE5: p658, -18.6% of £848.1M, and p1207, -11.7% of £10.9M. At TIE4 it has five more,
     p2900 among them (-32.2% of £3,996.6M). Against these, no path rises by more than 10% at TIE5 and two do at TIE4.
     Elsewhere only S293 has one such loss (TIE4, p1675, -10.9%). None of these is traced.

   **(d) What the two deciding paths show is traceable in minutes; the probe traced it.** Figures are TIE5's; TIE4 takes the
   same step in the same year on both paths.
   - The moves first differ in plan year 23 (plan year 12 for TIE4 on p4468).
   - The tiers stay CANDS's to plan year 52. By then the tie arm's pot is +0.072% and +0.018% above CANDS's, and its tax to
     then is lower: £704k against £716k, and £1,467k against £1,530k.
   - In plan year 53, the first person aged 90, the tie arm's path steps the first person's pension and ISA three tiers down,
     to the tiers the partner holds throughout (held 0/0 to 3/3). CANDS keeps 0/0 to the end.
   - The tie arm then ends 34.1% and 16.8% lower. After the step it pays £897k against £120k, and £1,346k against £863k.
   - Handed TIE5's state in plan year 53, CANDS's own chooser steps down too, on both paths, with both people above their caps
     in every year from 49 to 56.
   - So the step is the tables' choice at a state the rule's earlier picks led to, not the rule's own pick, which keeps the
     best move's tier pair. In plan year 52 that state has more in the taxable account (£7.08M against £1.44M, and £16.37M
     against £11.56M) and less in the ISA.
   - Why the tables step down there, with both people far above their caps, is a lead.

   **So the account and its conclusion misdescribe what the arrays show.**
   - The report's "Why paying less tax this year leaves less on those few paths is not traced" (l.33) and the "So:"
     paragraph's premise (l.35-36: "part 5 failed on a mean that a few far-above-the-cap paths carry") both read the fall as an
     effect of the year's tax.
   - It is a later choice of risk on the tie arm's own path, taken where the rule had moved money between wrappers, with more
     lifetime tax.
   - TIE-C.md (l.16-17) and `couple.js` (l.752-753) say the rule cannot change the risk held. It cannot at the decision it
     acts on, but on the arm's own path the risk held changes later, and the replay along CANDS's path cannot see it
     (finding 3).

   To answer: restate (a) to (d) from the arrays (and a trace, if the write-up is to give the mechanism), wherever the account
   appears.

2. **BLOCKING. The next step offered is not fairly put.**

   Where it sits: the report l.35-37 and DECISIONS-PENDING l.22-23. The rule closes the item: TIE-C.md l.4-5 says "A failure is
   reported, the rule is closed, and nothing is run again to pass it", and D97 (2) says "failing, closed and reported". The
   write-up offers a test "with a different measure of the pot" as "a new test with its own rule, decided before it runs, not
   a re-read of this one".

   **(i) On these couples and this seed it is a re-read.**
   - The per-path arrays are stored and the run is deterministic: the probe reproduced twelve path-arms to the penny.
   - The beside file already prints a measure that would pass, the median change of £0. The mean of each path's own change,
     which I computed, is +0.258% and +0.362%.
   - On other couples or another seed it is the same tie rule run again after failing, its measure chosen knowing which measure
     failed here and why.
   - Either way it reopens what the rule and D97 (2) close. Only the maintainer can do that, and the write-up should say that
     this is what it offers.

   **(ii) Its stated reason is finding 1's misreading.** A median or trimmed measure would pass by not seeing the two paths on
   which the rule leaves a third and a sixth less and pays more tax, through the tables' later choice of risk. That is the
   effect parts 5 and 6 are there to catch. Whether pots of billions far above the cap should count is a fair question for the
   maintainer, if it is put as that question.

3. **MINOR. "No decision at another spending level or risk" (DECISIONS-PENDING l.17-18) claims more than the replay shows.**
   - The replay follows CANDS's own path on the first 100 paths (`audit-tie-couple.mjs` l.97-117). It tests the rule's own
     pick at CANDS's states, and there it holds.
   - It cannot see a tie arm's later decisions at the states the arm reaches. The arrays show those decisions differ:
     - TIE4's spending delivered differs on 11 paths that survive in both arms, so on each of them a spending level differs in
       at least one year:

       | couple | paths | change in spending delivered |
       |---|---|---|
       | S309F | 330, 1958, 2900, 3314, 3981, 4089, 5064, 7058, 7449 | -£27,960 to +£18,640, in steps of £9,320 (a tenth of its target) |
       | S293 | 330, 1383 | +£10,300 each |

     - On S311F's two deciding paths the arm holds another tier pair later (finding 1 (d)).
   - Neither deciding path is among the replay's 100.
   - The report's "in the replay" is right as worded. Its "What it does not show" should add that the replay says nothing of
     what the tie arms' own paths hold.

4. **MINOR. The pooled tax cut is mostly S311F's, which is to be said beside it.**
   - S311F's share of the eight couples' summed change in mean lifetime tax: 68.7% at TIE5 (-£77,735 of -£113,205) and 72.6%
     at TIE4 (-£100,766 of -£138,795).
   - Without S311F, pooled lifetime tax falls 1.36% and 1.46%, not 2.76% and 3.39%.
   - So "Pooled it works" (DECISIONS-PENDING l.17) rests, for its tax, on the couple that fails part 5.
   - At TIE4, S293's tax change of -£342 is within its noise (paired standard error £220). So "six of the eight leave more and
     pay less" (report l.20) counts one couple whose tax change is not shown.
