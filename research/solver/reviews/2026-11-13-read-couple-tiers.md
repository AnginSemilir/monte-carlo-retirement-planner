# Review at a read: the couples' tier test (EXPLORATORY, seed 7002)

Subject: `results-couple-tiers.txt` (8b555714) read by `COUPLE-TIERS.md`'s rule, and what STATE.md (section 5's
sentence in the couples' re-run bullet, the open item CGT-BILL), `reports/2026-11-13-couples-read.md` ("The couples'
tier test, read") and the entry at the top of `DECISIONS-PENDING.md` say of it: the gate fair; the pot BOTH (the four
younger couples' median pot 0.374 of APP's under the candidate, 0.794 with consent withdrawn); the tiers' share of the
survival gain 63.0%; the bill's replay THE BILL.

Verdict: PASS

No BLOCKING finding. Nine MINORs. 1 to 5 are things the maintainer should be told beside "both" and "the bill"; 1 and
2 ask for a sentence in `DECISIONS-PENDING.md` and one in the report to be reworded, because each says more than the
read shows.

## What was read

- The frozen worktree `/home/user/wt-ctread` at 8b555714 (nothing read or run from the main tree; the units reached
  through the worktree's link): `COUPLE-TIERS.md` 380c94d9, `audit-couple-tiers.mjs` b67c9dff,
  `batch-couple-tiers.sh` 96d91ffb, `reduce-couple-tiers.mjs` 4a75308b, `results-couple-tiers.txt` 89eb1448,
  `STATE.md` 07f290da, `reports/2026-11-13-couples-read.md` 5ef91753, `DECISIONS-PENDING.md` 9cbdf3b1, `state.mjs`
  330398b3 (the CGT-BILL row), `audit-couples.mjs` (`solverPlan`, `solveArm`, `CONFIG`), `audit-speed.mjs`
  (`settingsOf`), `phase4-panel.mjs`, `select-phase4.mjs` (`armA`), `candidate.mjs`, `src/solverApp.js` 9b354ce6,
  `src/solverSettings.js` 8f84992f, `src/solver/solve.js` (`solvePlan`, `solvePlanAuto`), `src/solver/couple.js`
  f66038d6, `src/solver/model.js` 21069e39, `src/App.jsx` 643958cf (the year's compounding, the bill's fix),
  `results-speed-a.txt` (item 10), `results-cgt-bill.txt`, `runs.log`, the commits 1e3ccbce, 73e671b1, e4cdc312,
  8b555714; `reviews/2026-11-13-deep-couples-d4b.md` f3fa43c1 and `-read-couples-d4b.md` a3e57847 for what they cite.
- The units `research/solver/results/couple-tiers-7002/`: eight `.json.gz` and case0..7.txt, each log whole. Their
  sha256 taken before and after my runs: the same on all eight.
- Not opened: `d4-backup`, `d4b-backup`, any file or path of seed 7021.
- My own read-only scripts (the scratchpad's `ctreview/`: `recompute.py`, `more.py`, `quant.py`, `app-rich.mjs`,
  `trace.mjs`, `decomp.py`), EXPLORATORY, seed 7002 only.

## What was checked, and held

- **The rule before the launch, unchanged since.** `COUPLE-TIERS.md`, the audit, the batch and the reducer were
  committed in 1e3ccbce (13 Nov 11:33 UTC); the rule, the audit and the reducer once more in e4cdc312 (15:00 UTC: the
  candidate recorded and required, no threshold touched: `git diff 1e3ccbce e4cdc312 -- COUPLE-TIERS.md` is the gate's
  sentence alone). The launch is `runs.log` line 360, 13 Nov 15:17 UK, from e4cdc312, code d85a2b451777; the last unit
  was written 17:28. `git diff e4cdc312 8b555714` is empty for all four files, for `src/` and for every file the audit
  stamps. In the worktree `code-id.mjs` prints d85a2b451777 and `stampFilesHash()` 44f50b4375a7: the units' stamps.
- **The read reproduces.** `node research/solver/reduce-couple-tiers.mjs` in the worktree: byte for byte the committed
  `results-couple-tiers.txt`. `--planted`: all ten pass.
- **Every headline figure recomputed from the units by a script of my own** (`recompute.py`, not the reducer's code):
  the gate (one code, audit, seed 7002, 4,000 paths, 45 points, W 0.02, the candidate af001697ce1b on all eight;
  every array 4,000 long; CANDC 4/4 tier pairs, CANDCNC 1/1); part 1, the four younger couples' ratios 0.3423,
  0.3300, 0.3978, 0.4250 and 0.8407, 0.8091, 0.7143, 0.8129, means 0.374 and 0.794: BOTH; the library four 0.667 and
  0.965; part 2, 63.01% (60.88 to 65.13 linearised; a bootstrap by path 60.8 to 65.0), CANDC less APP +9.900,
  CANDCNC less APP +3.663; part 3, S309F 11 and 0, S311F 115 and 0, all in plan year 23, the other six nought and
  nought; beside the rule, tax £282,305 / £511,064 / £1,090,310, above the cap £132,510 / £302,862 / £836,147,
  survival 85.43 / 95.33 / 89.10.
- **BOTH is not near either edge.** Paths resampled within each couple (2,000 draws): CANDCNC's mean 0.784 to 0.804,
  never at 0.85 or under 0.65. It does not turn on the conditioning either: the same two means are 0.451 and 0.818 on
  all paths and 0.323 and 0.724 on each arm's own survivors (finding 5 for what does move it).
- **CANDCNC holds one tier pair and no step, and the check is not empty.** Each person's table records `tierState
  null`, `switchCharge 0`, `riskAbove` "off: no consent to change risk" (my re-solve of S311F prints the meta); the
  engine's `tierHeld` is nought for both people in every one of the 1.56 million couple-years CANDCNC is alive
  (`tiers.alive` sums 110,062 to 237,466 a couple: the engine does keep `tierHeld` under a table with no tier state).
  No arm holds a tier above the plan's: CANDC's pairs are 0/0 to 3/3 on every unit ("off: no tier above the plan").
- **Every arm runs on the same returns.** The panel's plan carries O60's medians (High Risk 4.97) and APP's plan, the
  solver arms' plan and the landed plan print the same six figures and the same tier on each account (`app-rich.mjs`
  on S309F). The engine draws a year's growth from the plan's own figure, so this had to hold; it does.
- **The engine "before the fix" is this engine less the fix and nothing else.** The unit does not say which tree
  `CTIERS_BEFORE` named (finding 6), so I tested it: S311F's CANDC solved again in the worktree (pot, survival and tax
  the stored unit's bit for bit on the first 400 paths), then its 120 paths that differ between the stored arrays and
  the first 200 run on four engines. `wt-release` (e4275c7b) and `wt-ceiling` (09e2632a), whose `src/` is 73e671b1^'s
  and whose built engine differs from this one in exactly the fix's 14 lines: the stored "before" arrays on 313 of
  313. This worktree: the stored "this engine" arrays on 313 of 313. The registered run's engine (`d4b-launch`,
  4e4174b1, before the harvest ceiling too): the "before" arrays on only 276 of 313, so it was not that one.
  `results-cgt-bill.txt` names 09e2632a for its own sizing. On the six other couples no path's survival or failure
  year differs between the two engines; on S309F and S311F the fix saves 15 and 119 paths, all failing in year 23
  before, and loses none.
- **The other arms' paths that fail and end above their opening wealth are not the bill.** The units hold 38 such
  paths for APP on S309F (years 19 and 20) and 8 for CANDCNC, on this engine. Traced (`app-rich.mjs`): all 38 are
  the engine's pre-access failures, both pensions locked (ages 56/53 and 57/54); on the four printed every other pot
  is empty, the unmet spending £3,335 to £65,531, no tax or bill in the year. A real failure; nothing for CGT-BILL.
- **Plan year 23 is the registered read's year.** S309F: 37 and 34 today, both retiring at 52, pension access at 58:
  year 23 is the first person's ninth retired year, the first person 60 and the second 57 with a locked pension.

## Findings

1. **MINOR (a claim stronger than the read; reword it). "The rest is tax paid above the estate cap"
   (`DECISIONS-PENDING.md`) is not shown by anything the read prints, and on the one couple I traced it is about
   two-thirds to three-quarters of the rest, not all of it.** The results file gives lifetime sums; a pot gap needs
   the years. From the units alone the sums do not close: on the paths all three survive, CANDCNC's extra lifetime tax
   over APP is 5% to 14% of the mean pot gap before compounding on the six couples whose gap is over £1m (S309F: gap
   £12.6m mean and £8.0m at the median, extra tax £1.4m). So I traced S311F (`trace.mjs`, `decomp.py`: APP, CANDC and CANDCNC solved again as the audit solves
   them, each the stored unit's bit for bit, the first 400 paths, 340 surviving in all three; each year's wealth
   before growth rebuilt from every account's balance and its tier's draw, APP's own pot reconstructed to £4e-6) and
   split the gap by replacing one thing at a time:
   - CANDCNC against APP (median ratio 0.805 on these paths): tax, compounded at the path's own growth, 67% of the
     mean gap (75% over the middle half of paths by APP's pot; 64% and 71% taken in the other order); where the money
     is held, 41% (29%; 43% and 32%): the pension, at High Risk, drawn into the taxable account at Medium Risk, 3% of
     wealth above the cap where APP holds none there; spending delivered -7%. Of CANDCNC's tax 86% is paid in years
     above the cap. So "mostly tax above the cap" is fair for this couple; "the rest is tax" is not, and withdrawing
     consent does not hold the household's risk still: part of what is left is still lower-risk money, by wrapper.
   - One couple, 340 paths, an order-dependent split: a lead, not a measurement of the eight. The sentence should
     say "mostly" and that it rests on a reviewer's trace of one couple, or the trace should be made the agent's own
     script and printed (CHECKLIST 6).
   - Where the rest sits, from the units: on paths APP ends above the cap the younger couples' median path ratio under
     CANDCNC is 0.70 to 0.89; on paths APP ends at or below it, 0.85 to 0.94 (`quant.py`). Above the cap is where
     most of it is; S317F is 15% down below the cap too.

2. **MINOR (to be said to the maintainer before a tie rule is weighed). With consent given, which is how a couple
   runs unless it says otherwise, tax is a few percent of the pot's fall, and £836,000 is not what a tie rule would
   save.** (a) The same trace for CANDC against APP on S311F: the growth of the tiers held is 99% of the mean gap (96%
   over the middle half), tax 2% (4%). The two causes are not additive: with the tiers in, the pot is smaller, stands
   above the cap for 21 years a path where CANDCNC stands 30, and pays £1.0m there where CANDCNC pays £2.3m. All of
   CANDC's extra tax returned would lift its median pot on this couple by about a tenth of itself (0.32 of APP's to
   about 0.36). (b) The report's "with the tiers out of it the figures size it: pooled, a mean £836,000 of tax above
   the cap against the app's rules' £133,000" follows the rule document's wording, but it is the arm no couple runs
   by default; the candidate's own figure is £302,862 against £132,510, in the same results line. (c) Either is a
   ceiling: no arm here carries a tie rule, and item 13's on singles cut pooled lifetime tax by 22% (`results-tie-a.txt`),
   not to the app's level. "Above the estate cap it pays tax it need not" (the report's recommendation 2) is therefore
   not shown for a couple; "pays more tax, how much of it a tie rule would save is unmeasured" is what the read
   supports.

3. **MINOR (beside "the tax"). The tax sentences are true pooled and not of every couple.** "Lifetime tax is higher
   under the candidate than under the app's rules": pooled £511,064 against £282,305, but lower on two of the four
   library couples, beyond noise (S011 -£46,764, se £1,352; S083 -£82,520, se £1,098). "Most of it is paid in years
   above the cap": 59% pooled for CANDC, 77% for CANDCNC and 47% for APP; for CANDC it is 15%, 4% and 23% on S189,
   S011 and S083 and 50% on S309F. The pooled figures are the younger four's (their mean tax £808,494 against the
   library four's £213,634). "(more money left to be taxed)" is a reading, not a figure of the read; the trace agrees
   with it (finding 2 (a)).

4. **MINOR (beside "the bill"). The replay shows the mechanism on two of the three couples; its counts are not the
   registered run's.** (a) The audit solves CANDC on this tree and runs it on the old engine, as the rule document
   says. The joint move reads the year from `model.js` (`couple.js` 643, `M.step`), which the fix also changed, so in
   the replay the move expects the partner's money to pay the bill and the old engine refuses it. The registered run
   had the old model beside the old engine. That is the likely reason S311F loses 115 of 4,000 here (119 saved by the
   fix, 2.98 points) where the registered read's review counted 20 of 5,000 at W0.02 in that year. Like for like
   (CANDC failing in year 23 on the old engine where APP survives, from the units): S311F 118 of 4,000 and S309F 13,
   against the registered read's 20 and 0 of 5,000 at W0.02. So "the engine before the fix loses 115 paths" is true
   of this hybrid and is not the defect's size in the registered read; the survival the fix returns to a couple run
   as registered was not measured. (b) The third couple of the registered
   read's year 23, S307F, is not among the eight. (c) The count is of paths that fail and end the plan above their
   opening wealth, not above it in the failing year (`audit-couple-tiers.mjs` line 78); APP's 38 on S309F show the
   criterion also catches bridge failures, so "none on this engine" is CANDC's figure, which is what the rule reads.
   By the rule as committed: THE BILL. No change asked beyond saying (a) where the 115 is quoted.

5. **MINOR (scope of "both"). The verdict is the median's, on eight couples chosen from the read panel by their
   pots.** (a) The same ratios taken other ways on the paths all three survive (`more.py`): by the mean, 0.147 and
   0.891 (the rule's own bar would read THE TIERS there: the mean is APP's far tail); at the 10th percentile 0.94 and
   0.93, no fall worth the name with or without consent; at the 90th 0.14 and 0.84; the pot capped at the cap, 0.970
   and 0.987. The fall is in the upper half of outcomes, which the couples' screens should say with the median.
   (b) By couple CANDCNC's ratio is 0.81 to 0.84 on three of the younger four and 0.71 on S317F; the library four run
   0.80 to 1.17. (c) The eight were picked by the deep review for their pot shapes and S309F and S311F for their lost
   year, from outcomes already read: on another seed, so the figures are not the registered ones recycled, but they
   are these eight's, not the panel's, and S011's CANDC ratio (0.85) shows how far a library couple can sit from the
   younger ones. Part 2's share runs 50.5% (S293) to 70.0% (S323F) by couple. The eight are spent as held-out couples,
   which the rule document says.

6. **MINOR (the run's record). Two things the arms differ in, or rest on, are not recorded by the units.** (a) CANDC
   is solved on anchors and shortlists and CANDCNC on the whole menu (D74: `coarseWhereFits`; my re-solve prints
   `coarse` on for CANDC and "off: no joint tier state" for CANDCNC), and the audit's `ran` line is `audit-speed.mjs`'s
   `settingsOf`, which prints neither `coarse` nor the sweep, where `audit-couples.mjs`'s does. So "the same with
   consent withdrawn" is two differences, and the reducer's gate does not diff what each arm recorded. Its size on
   singles is known and small (item 10: pooled survival +0.005 points, the mean pot -0.022%, `results-speed-a.txt`),
   two orders below 0.42 of a pot or 6.2 points; it is unmeasured on couples. (b) The unit stores `before: 'run'`,
   not the tree `CTIERS_BEFORE` named, its commit or its engine's hash; `runs.log` does not carry it either. I could
   settle it only by running the engines (above). A later replay should record the tree's commit and a hash of the
   engine it imported.

7. **MINOR (what stands beside the engine). No forward run or rollout beside the engine in this test.** "The shared
   runner on the first 200 paths the same" is `audit-phase4.mjs`'s `runPath`, the engine's own `stepYear` again: it
   checks the audit's loop, not the model. STATE.md's "the rollout beside the engine agrees on survival on 80,000
   paths" belongs to the registered read and sits two sentences after the tier test's outcome; it should not be read
   as this test's.

8. **MINOR (part 2's comparison).** The singles' 47.5% beside the couples' 63.0% is D39's test of 28 Oct: Phase 4's
   candidate (before D43's failure year and D73's sweep and anchors) on the engine before items 3 to 5 and the harvest
   ceiling, on forty households; the couples' is af001697ce1b on eight. The two are not one experiment with singles and couples as
   arms; "63% against 47.5%" should not be read as couples leaning on the tiers more by sixteen points.

9. **MINOR (a figure rounded across a bar).** The report's "0.37 ... and 0.79" and "+3.7 points ... +9.9" are the
   file's 0.374, 0.794, +3.66 and +9.90; "the library four 0.67 and 0.97" are 0.667 and 0.965, means of four the
   reducer does not print (it prints the eight lines they come from). All correct; the library means are the only
   figures in the three write-ups that no script prints.

## What each write-up says, against the above

- **STATE.md, section 5's sentence and the CGT-BILL row:** every figure is the results file's; "the tiers held are
  most of the fall and not all of it" is what BOTH means ((0.794 - 0.374) / (1 - 0.374) is two-thirds); the replay's
  line is the file's. Nothing to change; finding 4 (a) belongs beside the row's "replayed".
- **The report's section:** figures correct; recommendation 2's "pays tax it need not" and the £836,000 sizing are
  findings 2 (b) and (c); "the lost paths were the capital gains bill" is finding 4.
- **`DECISIONS-PENDING.md`'s entry:** "The rest is tax paid above the estate cap" is finding 1. "which no tie rule
  reaches for a couple" is right of the rule as built (`tieAboveCap` sits in a single's chooser; the deep review).
  The recommendation that follows (a tie rule for the joint move, its rule committed first, read on couples outside
  the panel, off until ruled) is consistent with the rule's "both: to the maintainer, no build", and a rule that
  takes the least tax among near-ties above the cap would act on the wrapper part of finding 1 as well, since that
  part is the pension drawn when it need not be. What the maintainer should hold beside it is finding 2: for a couple
  that consents, such a rule is a tax saving and returns little of the pot.
