# Review at a read: the harvest ceiling's step 4 (EXPLORATORY, seed 7002)

Subject: the read of `HARVEST-CEILING.md`'s step 4 (the review's eight solved before and after the ceiling on the year's
whole taxable income, commit 0c988f63), as written in `results-harvest-ceiling-solved.txt` and the four claims put to
this review. Not a confirmatory run; no registration.

Verdict: PASS

## What was read and run

- At 09e2632a (the worktree `/home/user/wt-ceiling`), git blobs: `HARVEST-CEILING.md` 6c34aea710, `reduce-ceiling.mjs`
  d1dc19e094, `audit-ceiling.mjs` 48eecf4f57, `batch-ceiling.sh` 27df18194e, `reduce-isasweep.mjs` (`pairOf`)
  cf1146ad3a, `stats.mjs` (`survivalChangeU`, `zFor`) 7cf309da01, `results-harvest-ceiling.txt` 3d9e649d10,
  `src/App.jsx` 296f80421f (`pensionCeiling`, `drawPension`), `src/solver/fast.js` 7a32fde9ba, `src/solver/model.js`
  55b0bc0ac9, `src/solverStrategy.js` 0763dc15bf (`runPath`). `results-harvest-ceiling-solved.txt` (untracked in the
  main tree) b4df531d76. `results-tie-a.txt` for the eight's estate caps only.
- The eight unit files and logs in `/home/user/wt-ceiling/research/solver/results/ceiling-7002/`, the two launch logs,
  `runs.log`, the frozen snapshot `/tmp/solver-snap-Zc4lMw`, the BEFORE tree `/home/user/scratch-preceil`.
- Run: `node research/solver/reduce-ceiling.mjs --planted` (10 of 10 ok, exit 0); `node research/solver/reduce-ceiling.mjs`
  again in the worktree (its output byte for byte the results file); an independent recomputation of every figure from
  the decompressed unit files (written apart from the reducer); `gh run list` for the branch's CI.
- Not opened: anything of D4, seed 7021, `d4b-launch`'s results, `d4b-backup-wt`, either backup branch.

## What holds (the evidence)

- **Claim 1, the gate.** All eight units: code 9df7a2f23c75, audit de68816f06dd, seed 7002, 16000 paths, 45 points,
  `coarse on` in both arms, each arm's plan hash the same, BEFORE `0e3511ea` with `ceiling false`, AFTER `snapshot` with
  `ceiling true`. `git diff 0e3511ea 0c988f63 -- src` is three files, the ceiling alone (App.jsx +43/-4, fast.js +1,
  model.js +1); 0c988f63 to 09e2632a touches no source. The BEFORE tree is clean at 0e3511ea and its built engine
  differs from the snapshot's by exactly the source diff. The snapshot's `src` and stamp files are the worktree's at
  09e2632a; its "1 uncommitted file" is `runs.log`, the failed launch's own line. `runs.log` shows both launches through
  the launcher (05:29 on 0c988f63, 06:17 on 09e2632a). A cross-check the write-up does not use: BEFORE's capped mean pot
  on each of the eight equals arm 1 of `results-tie-a.txt` to the pound (S030 £1,101,253 ... S340F £1,292,839), so the
  BEFORE arm reproduces an earlier, separate run.
- **The rule was not changed after the run.** `HARVEST-CEILING.md`, `reduce-ceiling.mjs` and `batch-ceiling.sh` have one
  commit each, 0c988f63 (13 Nov 01:41 UTC); the run began 06:17. The stamp-file hash with the audit as at 0c988f63 is
  d780dad3c5ae (what the failed launch printed); with only the audit's one-line fix it is de68816f06dd (what the units
  carry): the rule, the reducer and `stats.mjs` are the ones committed before the run.
- **Claim 2, the rule.** Recomputed: pooled survival -0.0180, se 0.0087, -0.0349 to -0.0010; no household's
  `survivalChangeU` interval below -0.3 (the lowest upper end S090's +0.014); pooled spending -0.0046; pooled mean pot
  +1.540%. The reducer computes what the rule says: `pairOf`'s paired variance, the pooled se the root of the summed
  variances over 8, spending as delivered over target a household then averaged, the pot the ratio of the households'
  mean pots averaged. Parts 1 to 4 hold; by the rule as committed the ceiling stands.
- **Claim 3's figures** are the file's and reproduce (tax up on S030 and S090; S090's mean pot -0.87%, S368's -0.62%).

## Findings

1. **MINOR, but the report to the maintainer must carry it: the pot's and the tax's gains are on paths that end above
   the estate cap, where the solver values nothing; at or below the cap lifetime tax rises.** Splitting each
   household's paths at its cap (`results-tie-a.txt`'s: £3.8m, £720k, £1.8m), from the unit files:
   - S328F: of the mean pot's +£259,164, +£257,989 comes from paths above the cap; of the tax's -£85,775, -£86,855 from
     above and +£1,080 from below. S340F: +£173,682 of +£173,634 and -£71,192 of -£71,184 from above; below the cap
     nothing moves.
   - A path at or below the cap pays more tax: S090 £54,474 to £65,869 (+20.9%), S328F £34,730 to £37,177 (+7.0%), S030
     £64,263 to £65,481 (+1.9%); the other five within 0.1% (S050's figure is £15). Medians say the same: S090's median
     lifetime tax £52,251 to £65,902, higher on 70.8% of paths; S328F's £54,802 to £57,798.
   - The capped pot (item 13's measure): pooled +0.233%, all of it S090's (+1.93%); no household lower by more than
     0.011%. So S090's and S368's falls in the mean pot are above-cap too (S090: +£23,280 from below the cap, -£38,057
     from above), not a loss the solver weighs.
   "Pooled lifetime tax falls 12.05%" is true and decides nothing, but read alone it says the ceiling cuts a solved
   plan's tax. On this evidence it does not where the plan's money is scarce, and the above-cap gain sits in the region
   `tieAboveCap` is due to change (D90), so it may not survive that port. Without the two the pooled mean pot is
   -0.322% (inside the bar) and pooled tax +1.46%.
2. **MINOR: the three households where tax rises are the three with 45% of their money in the taxable account** (S030,
   S090, S328F: the panel's plans), the ones the ceiling moves most. A lead from the code, not verified (it needs each
   arm's decisions, which the units do not store): `pensionCeiling`'s branch (b) stops the allowance step where the
   year's bill would first rise, and `results-harvest-ceiling.txt` E6 shows what that does with interest and dividends
   present: the first year's harvest to the allowance £15,677.60 at a cost of £1,082.40 (6.9%) before, £619 after. The
   menu's next ceiling is the basic one, so the solver can no longer buy that slice at under the 20% the pension bears
   later. The test that would tell: the replay of decisions (as `TIE-A.md` part 7) on S090, counting each ceiling taken
   before and after, or an arm with the allowance's ceiling raw and the bands' adjusted. Until then the write-up should
   not offer a cause.
3. **MINOR: claim 4 is narrower than the rule document's words.** `audit-ceiling.mjs` line 69 compares `survived` and
   `lifetimeTax` only, not the pot or the spending ("outcome for outcome", HARVEST-CEILING.md line 22); and `runPath`
   is the engine's own `stepYear` loop, so this is the engine against the engine. No forward run (`fast.js`, the tables'
   model) stands beside the engine in this run, though the ceiling was added to both separately. Verify (the fast tier)
   is green on 0c988f63 and 09e2632a, which is what covers it.
4. **MINOR: beyond noise and not in the claims.** S328F's spending delivered -0.0264 points (paired se 0.0020), over
   half of part 3's bar on one household; S090's 5th-percentile pot £43,649 to £38,027 beside its 40 lost and 26 saved.
   The pooled survival loss is S090's and S030's mostly: without S090 it is -0.008.
5. **MINOR: "goes to main with its batch" waits on B1's gate.** Full failed on 0c988f63 (`optimality.test.mjs` D, re-set
   in b94a8685), was cancelled on 09e2632a and is pending on b94a8685; the full tier is not yet green on the ceiling.
6. **MINOR: the gate's settings check is thin.** An arm's `rest` is the points and whether `coarse` ran; the candidate's
   hash is not recorded. The source diff (three files) is what shows the settings equal, not the units.
