# Second review at the read: the speed mode on more singles and couples (`SPEED-B.md`; D97 (3); EXPLORATORY, seed 7002)

Subject: the answer in dac87fea to the first review at the read (`reviews/2026-11-15-read-speed-b.md`: FAIL, finding 1
BLOCKING, findings 2 to 7 MINOR). The answer is `speed-b-beside.mjs` sections E to H and their output, the rewritten report,
DECISIONS-PENDING's entry "the speed mode's wider read" and STATE.md section 6 action 3's SPEED-B clause.

Read (blobs at dac87fea):
- The answer: `speed-b-beside.mjs` f6f48524, `results-speed-b-beside.txt` f2c28014, `reports/2026-11-15-speed-b-read.md`
  c1bafc5f, `DECISIONS-PENDING.md` 4c966ca4 (l.14-29), `STATE.md` f926f534 (section 6 action 3).
- Unchanged since the first review (no diff from 59259d91; the rule's files none from a8a26e16): `results-speed-b.txt`
  9b0f1b21, `SPEED-B.md` eae02966, `reduce-speed-b.mjs` ef65ecd0 (`cells`, `rule`), `stats.mjs` 7cf309da
  (`survivalChangeU`, `holm`, `pooledSummed`).
- What the answer cites or rests on: `results-tie-a.txt` (l.88-107), `reduce-tie.mjs` (`readOf`: item 7's spending and pot
  measures), `results-item12-a.txt` (l.1, 24, 41), `audit-speed-b.mjs` (the timing, l.86-88), `audit-phase4.mjs` `runPath`,
  `src/solverWords.js` `SPEED_WORDS` (l.152-158), DECISIONS-PENDING's D98 (l.175-181), `results-speed-mode.txt`, and
  `results-tie-couple-trace.txt` at 2ccbada0 and 28a38c6a.
- The 32 units in `results/speed-b-7002`. Nothing of seed 7021, D4 or either backup branch was opened.

Ran (read-only on the repository, each under six seconds at `nice -n 19` beside ALLOWANCE-BOTH; my scripts in the session
scratchpad, `r2/`):
- `node research/solver/speed-b-beside.mjs`: byte-identical to `results-speed-b-beside.txt`. `reduce-speed-b.mjs`:
  byte-identical to `results-speed-b.txt`. `check-state.mjs`: passes.
- `check-e.mjs`: section E's two cases summed exactly over the multinomial. It enumerates the paths lost and saved, takes
  both-survive as binomial given them, and uses `survivalChangeU`'s arithmetic. At S370's rates the interval is wholly below
  nought in 23.29% of runs at 4,000 paths and 72.60% at 16,000, and wholly below -0.3 in 0.13% and 0.01%. For the half
  point, 97.06% and 27.32% at 4,000, 100.00% and 84.53% at 16,000. Section E's 2,000-run figures (22.8, 70.8; 97.0, 26.8;
  100.0, 83.2) are within their noise of these. The same construction on another seed (10,000 and 5,000 runs) gives 23.1,
  72.8; 97.2, 27.5; 100.0, 84.7.
- `check-e2.mjs`: a true -0.175 at 4,000 paths and 95% survival.
  - It reads wholly below nought in 70.0% of runs when carried by 7 paths parting (all lost), 51.7% by 10, 37.5% by 16,
    and 22.9% by 30 (S370's share).
  - Its interval's lower end lies above -0.175 in 2.2% to 3.0% of runs, whatever the discordance (2.4% at S370's rates).
  - With no true change and 2 paths of 4,000 parting, the lower end lies above -0.175 in 93.6% of runs.
- `check-g.mjs`: sections G and H from the arrays without the beside script's functions, and the spending weighting split
  (finding 2). `check-t.mjs`: each unit's solve and its 4,000 paths from the arm records (finding 3).
- By hand, section F's p-values from the binomial sums:
  - S031: sum over i <= 9 of C(40, i) / 2^40 = 3.40e-4, doubled 6.8e-4.
  - S063: 1.11e-3, doubled 2.2e-3.
  - S301F: 834 / 2^17, doubled 1.27e-2.
  - S325F: 145,499 / 2^23, doubled 3.47e-2.
  - Holm's steps on these (x12, x11, x10, x9) give the printed 8.2e-3, 2.4e-2, 1.3e-1 and 3.1e-1.

What holds. Round by round:
- Finding 1 (BLOCKING) is answered. The recommendation to drop the singles' warning is withdrawn. The report now says:
  - the warning's figures are item 7's pooled -0.019 and S370's -0.175 (l.20-21);
  - the panel's range is 92.58% to 99.20%, with 27 of 80,000 paths parting (l.22-23);
  - the read covers the dial's first position only (l.14, l.103).

  DECISIONS-PENDING (l.18-21) says the "at most" is item 7's S370 and gives the same range.

  The recommendation now keeps the warning as it stands. That rests on what is shown: 20 more households with no loss
  (pooled +0.001, -0.012 to +0.015), none of them like S370. One supporting sentence misreads section E (finding 1 below).
- Finding 2 is answered: section F computes what it says, and the report (l.36-39) calls the cohort pattern a lead resting on
  two couples a side. STATE.md's clause still has "the library's six `-0.150` beyond noise". That is true of the six's
  pooled interval, and the clause names S031 and S063 after Holm beside it.
- Finding 3 is answered in substance. The couples' recommendation (l.51-52) now puts the warning's silence on survival beside
  S031's and S063's losses, each beyond noise after Holm, and leaves the words to the maintainer (D98). It is fairly put: the
  losses' intervals sit beside them (l.33), pooled survival holding is said, and the younger couples' gains are said to be a
  lead. One point was not carried: part 2 holds for S031 and S063 at this read's 4,000 paths, where the same cells at item
  7's 16,000 would read wholly below -0.3 (first review, finding 3). With the losses' sizes and intervals in front of the
  maintainer, the ruling does not need it.
- Finding 4 is answered: section G computes what it says, and the report gives the equal-weight figure and S133 beside the
  pooled. One new sentence gives the wrong reason (finding 2 below).
- Finding 5 is answered. "How this read sits beside the earlier two" (l.92-99) checks out against `reduce-tie.mjs`: item 7's
  spending is in points of target averaged over households, and its pot is the ratio of the households' averaged mean pots,
  where this read averages each unit's percentage. It also checks out against `results-item12-a.txt` (code c2613a32f65e,
  -0.1089 points of target, one-sided at 0.1).
- Finding 6 is answered in part. The report (l.82-89) now says what the times measure:
  - each is the engine's time for a path, timed around the path loop alone (`audit-speed-b.mjs` l.86-88), and `runPath` is
    the solved plan only;
  - the solve, the plan as entered and the shown decisions are left out;
  - WHOLE was timed first, four units at a time at the lowest priority;
  - two traces ran during the read. They solved in 141 s and 140 s, committed at 04:35 and 05:00 UTC, inside the run's
    03:57 to 05:35.

  Not answered: the warning's speed claim (finding 3 below).
- Finding 7 is answered: section H computes what it says. S063's capped pot is +1.31%, its median tax +14.1%, and the
  couples' pot without S063 +0.336%.

Sections E to H compute what their labels say:
- E draws each path's cell at S370's item 7 rates (13,356, 74 and 46 of 16,000: both survive, lost, saved). It reads each
  run through `survivalChangeU`, with lost and saved in its b and c as the reducer's `cells` orders them. It counts the
  interval wholly below nought, and wholly below part 2's -0.3 as the reducer reads part 2. The half-point line keeps S370's
  0.75% discordance, five-sixths of it lost.
- F's p is the exact two-sided binomial test of lost against saved, doubled and capped at 1. Its Holm is `stats.mjs` `holm`'s
  step-down.
- G's equal weight is the mean of each couple's SPEED over WHOLE in pounds; its pooled figure is the reducer's part 3.
- H caps each path's pot at the unit's cap, as the reducer does.

The one exception is E's heading, in finding 1.

Verdict: PASS

## Findings

1. **MINOR. Section E's power at S370's rates is given as what this read's singles could show. On them, a loss of S370's
   size is ruled out unit by unit.**
   - Where it is said:
     - DECISIONS-PENDING l.20-21: "this read's singles (...) could hardly show a loss that size: at S370's rates it reads
       beyond noise in 22.8% of runs at 4,000 paths";
     - the report l.22, in bold: "This read could hardly have seen a loss like S370's";
     - STATE.md's clause: "a loss this read's singles could hardly show";
     - section E's heading: "What the singles can show".
   - The 22.8% is the power on a household at S370's survival and discordance (83.94%, 120 of 16,000 parting). This read's
     singles part on 27 of 80,000 paths, at most 6 on a unit (S306F). A loss of 0.175 points at 4,000 paths is 7 paths net.
   - Section A prints every single's interval, and every lower end is above -0.175; the lowest is S326F's -0.163. A
     household with a true loss of 0.175 has its lower end above -0.175 in about 2.5% of runs, whatever its discordance
     (`check-e2.mjs`: 2.2% to 3.0%; 2.4% at S370's rates). Where the loss is carried by the fewest paths, it reads wholly
     below nought in 70% of runs, not 23%.
   - So the read does rule out a loss of S370's size on each of its 20 singles. What it cannot show is a household like
     S370, and it holds none. The report's "What it does not show" says that rightly (l.104: "it cannot show a loss the size
     of S370's on households like S370").
   - The conclusion stands: "neither measures the warning's 'at most' again nor contradicts it" (l.25). So does the
     recommendation.
   - The fix: the sentences should say which households the 22.8% describes, and that on each of this read's own
     households a loss the size of the warning's "at most" is ruled out. My first review's lead phrase invited the same
     misreading ("At 4,000 paths a household loss of S370's size is seen beyond noise about a quarter of the time"). That
     figure holds only at S370's discordance.
   - The read the recommendation offers (l.49-50, "households like S370 at 16,000 paths") would, by section E's own figure,
     show a loss of S370's size beyond noise in about 71% of runs on one household (exact: 72.6%). Its size is for that
     design's review, if the maintainer asks for it.

2. **MINOR. The reason given for the equal-weight spending figure is not the reason.**
   - The claim, report l.30: "-0.122% with each couple weighted equally, since 62.8% of the pounds pooled are the younger
     couples'".
   - Why it is not the reason: section B has the library's six pooling to -0.0698% and the younger six to -0.0674%. The two
     cohorts lose nearly the same share, so their shares of the pounds cannot open the gap. Weighting the two cohorts
     equally, each pooled by pounds within, gives -0.0686% (`check-g.mjs`).
   - Where the gap is: inside the library cohort.
     - Its two largest losses, S133 (-0.620%) and S097 (-0.278%), carry 2.21% and 2.27% of all the pounds.
     - The library's six come to -0.169% weighted equally, against -0.070% pooled. The younger six come to -0.075% against
       -0.067%.
     - A couple's pounds and its change correlate +0.40: the couples that spend least lose most, in percent.
   - The figure stands; its "since" should name the small-spending library couples (S133, S097, S031). My first review put
     the younger couples' share (as 62.9%; it is 62.81%) beside the gap without saying it was not the cause.
   - A second sentence of the same kind, l.40: "+1.169% pooled and +0.521% capped, but most of that is S063's". That holds
     for the mean pot (+0.336% without S063, section H). It does not hold for the capped pot, which is +0.449% without S063
     (`check-g.mjs`; the beside script does not print it).

3. **MINOR, for the maintainer. The singles' warning is recommended kept "as it stands", and its "about twice as fast" is
   the ratio of a path's time, not the wait the report says is smaller.**
   - The words, `src/solverWords.js` l.157: "Speed mode works out your figures about twice as fast". They rest on the
     engine's time for a path: item 7's 1.89 times (`results-tie-a.txt` l.106), and this read's x0.54.
   - The report says the ratio leaves out the solve and the rest, and that "A user's wait falls by less than these ratios"
     (l.82-89). The recommendation (l.48) keeps the words as they stand without saying so.
   - No measurement of a user's wait exists in either mode: `results-speed-mode.txt` times nothing, and the planner
     harness's check 20 checks the figures, not the time.
   - On the read's own records, take a solve plus 4,000 paths, counting WHOLE's solve in both arms, since the mode leaves
     the tables the same. The median ratio is x0.65 for singles and x0.82 for couples (`check-t.mjs`; the solve is 24% and
     17% of WHOLE's total). That shows the direction only. It is not the app's wait, whose path counts and parts differ.
   - The maintainer should hear this with the recommendation: the warning's speed claim is the ratio of a path's time, and
     the wait is unmeasured. The same holds for the couples' "nearly twice as fast", which this read's couples reach at
     x0.52 at best.
