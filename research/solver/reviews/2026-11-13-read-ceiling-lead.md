# Review at a read: the harvest ceiling's allowance step (CEILING-LEAD, EXPLORATORY, seed 7002)

Subject: the read of `CEILING-LEAD.md` (three arms on the review's eight, differing in `pensionCeiling` alone, the
tie-break in every arm), as written in `results-ceiling-lead.txt`; the gate's amendment after the run; and the write-up
in STATE.md section 5 and the top entry of `DECISIONS-PENDING.md`, at 13f979e9. Not a confirmatory run; no
registration.

Verdict: PASS

## What was read and run

- Git blobs at d6a10c1d (the launch) and 13f979e9 (the read): `CEILING-LEAD.md` 4149729d9c / 6f906d6790,
  `audit-ceiling-lead.mjs` fc816b8d5a (both), `batch-ceiling-lead.sh` 128aab1e42 (both), `reduce-ceiling-lead.mjs`
  77dd50c04a / 573836d9ce, `reduce-ceiling.mjs` d1dc19e094, `reduce-isasweep.mjs` cf1146ad3a, `stats.mjs` 7cf309da01,
  `results-ceiling-lead.txt` 9bed5b1a17, `DECISIONS-PENDING.md` 154c368b40, `STATE.md` 55920b7b5c; `src/App.jsx`
  643958cfe6 (`pensionCeiling`, `taxParams`, the engine's `drawPension` and its callers), `src/solver/fast.js` 7a32fde9ba,
  `src/solver/model.js` 21069e3978, `src/solverStrategy.js` 0763dc15bf (`runPath`), `src/solverApp.js` 9b354ce6f9; no
  file under `src` differs between the two commits. HEAD has since moved to 133a2520 (item 6's stage C), touching none
  of these.
- The eight units and logs in `results/ceiling-lead-7002/` (read only; their sha256 taken before and unchanged);
  `runs.log`; the session scratchpad's `clead-launch.log`, `clead-smoke/` and `clead-first.txt`; step 4's units in
  `/home/user/wt-ceiling/research/solver/results/ceiling-7002/`; `results-harvest-ceiling-solved.txt`,
  `reviews/2026-11-13-read-harvest-ceiling.md`, `reviews/2026-11-13-default-d95.md` finding 6.
- Run (scripts in the scratchpad's `cleadreview/`, written apart from the reducer): `node
  research/solver/reduce-ceiling-lead.mjs` (its output byte for byte the committed file) and `--planted` (10 of 10 ok);
  d6a10c1d's tree extracted by `git archive` and its engine built by `research/build-engine.py`; the reducer as launched
  run on the units from that tree; the three arms' engines built by `engineFor` from that tree and probed; RAWPA re-solved
  in fresh processes for S050 and S090 (`resolve.mjs`); an independent recomputation of every figure in the file
  (`recompute.py`), the pot beside the tax and other conditionings (`more.py`), the share's bootstrap (`share_ci.py`),
  part 4's noise (`potse.py`), this run against step 4's units (`vsstep4.py`); the amended stamp check on a scratch copy
  at 13f979e9 with planted edits.
- Not opened: anything of D4, seed 7021, `d4b-launch`'s results or either backup branch.

## What holds (the evidence)

- **Nothing ran at the registered settings before the rule's commit.** d6a10c1d was committed 18:19:24 UTC; `runs.log`
  line 361 has the one launch, 18:25 UK through the launcher from d6a10c1d; `clead-launch.log` shows the snapshot taken
  from d6a10c1d with no uncommitted file flagged, the launcher's smoke passed, 8 units at code 7002a1fec94c, audit
  ffc1d7fd23c0, runs done 20:06 UK. Both stamps reproduce from d6a10c1d's own tree (code-id with its engine built:
  7002a1fec94c; `stampFilesHash`: ffc1d7fd23c0). The only earlier execution is the one-unit smoke (`clead-smoke/case2.txt`:
  S090, 300 paths, 6 points, "prediction NOT-LAUNCHED", finished 18:18:57), stamped with the committed files' audit hash,
  so the rule's files did not change after it.
- **The account of the refusal is right.** The reducer as launched, run on the units, exits 1 printing six refusals
  only, S050, S188 and S368's RAWPA and NOW probe checks; no outcome. Those three plans are `region: 'scotland'`,
  `higherRateStartsAt` 43,662, `basicLimit` 50,270; `pensionCeiling`'s (a) is `min(ceiling, U - i - d)` with `U` the UK
  limit for the band, so at the probe's £6,000 it leaves 43,662 as given (44,270 is above it) in every arm. The engines
  are what the arms say: built by `engineFor` at d6a10c1d and probed on each household's own params, at £5,000 of
  interest and £5,000 of dividends the Scottish band is 43,662 in OFF and 40,270 in RAWPA and NOW, and the allowance
  12,570, 12,570 and 3,070; over 10,080 inputs (six ceilings, seven incomes, six interest and five dividend amounts on
  each of the eight), OFF returns the ceiling and RAWPA the ceiling at the allowance and NOW's value elsewhere, with no
  exception. Every allowance ceiling the engine, `model.js` and `fast.js` pass is `P.pa` on the `__isParams` object, so
  the patch's `ceiling === p.pa` is exact; neither solver file holds a copy of the ceiling's logic. RAWPA re-solved in a
  fresh process gives the stored tables (S050 0efa01c495c5, S090 23e380f2ef7d) and its first 300 paths bit for bit
  (survival, pot, tax, spending), so no arm's tables leak into another's and the solve is deterministic.
- **The amendment cannot have moved the verdict.** The rule reads S030, S090 and S328F only, which the gate as launched
  passed. The reducer's diff is the gate, its planted cases, the stamp check and the header line; `leadOf`, `leadRule`,
  `pairedMean` and the four parts are unchanged. The first outcome printed (`clead-first.txt`, written by 20:12:44) already had the
  amended gate and differs from the committed file in its second line's description of the gate alone. The stamp check
  is live: a scratch copy at 13f979e9 reproduces the file, and with a line added to `stats.mjs`, or to
  `audit-ceiling-lead.mjs`, it refuses ("stamped files changed since the launch beyond the amendment's").
- **The read reproduces.** Recomputed from the units: every household's line; the rule's paths 14,452, 13,222 and 7,060;
  the rises +£1,214 (+£1,165 to +£1,262), +£11,348 (+£11,134 to +£11,561), +£2,398 (+£2,289 to +£2,507) and the parts
  +£1,101, +£11,062, +£2,100 with their intervals; the share 95.35%, THE ALLOWANCE STEP IS THE COST; NOW against OFF
  survival -0.0180 (-0.0349 to -0.0010), spending -0.0046, pot -0.403%, capped +0.234%, tax +0.68%; RAWPA against NOW
  survival +0.0195 (+0.0024 to +0.0366), capped -0.244%; no household's interval wholly below -0.3 in any comparison.
  The share's path bootstrap is 94.8% to 95.9%; the band step's own part on the rule's paths is +£112, +£285, +£298.
- **The conditioning does not bias the rise.** The paths are kept on all three arms' outcomes together and every arm
  is compared on the same kept paths, so no arm's outcome selects against another's; the rise is that of paths ending
  below the cap whatever the arm. Kept on one arm alone the share over the three is 95.2% (OFF below) and 95.1% (NOW
  below), S090's rise +£11,031 to +£11,260. Over all paths the share is 71.9%: on S328F's 8,785 paths above the cap in
  all three arms the allowance step's part is -£2,877 a path, so the verdict is a statement about below the cap, as the
  rule and the write-up word it.
- **OFF is step 4's BEFORE with the tie-break added.** Against step 4's units: OFF's tables' digest is BEFORE's and
  NOW's is AFTER's on all eight; survival is the same on 16,000 of 16,000 paths of every household; the targets are the
  same; spending delivered is the same but on S188's 18 or 19 paths (rounding, 1e-16 of target) and S328F's 4 (the tie-break);
  pot and tax differ only where the tie-break acts (S090: 96 of 13,485 paths below the cap in both). The source between
  the trees adds `tieAboveCap` (forward only) and the couples' capital gains bill (`x === o` skips a single). So the
  test answers the D95 review's finding 6: with the tie-break in both arms the ceiling's survival loss is unchanged
  (-0.018, wholly below nought, inside the bar) and its pooled tax cut is gone; part 4's -0.403% has a standard error of
  0.029 points by path (-0.460 to -0.345), so "PASSES 1 to 4" is clear of the bar beyond noise. Above the cap the
  ceiling still lowers tax on S304F (about £5,070 a path, nearly all on paths above the cap) and S340F (about £2,600),
  neither of which the first read showed; the
  write-up's "the ceiling's tax saving above the cap that its first read showed is gone" is right as worded.

## Findings

1. **MINOR, but the entry to the maintainer and the external review must carry it: the pot beside the tax, which runs
   the other way.** `CEILING-LEAD.md` (lines 60-62) sends the question "with the figures: ... what RAWPA does to
   survival, spending and the pot beside NOW". `DECISIONS-PENDING.md` and STATE.md give survival alone, so "costs tax
   below the cap ... S090: about £11,000 more over a lifetime" reads as a loss to the household. On the same paths it
   is not (`more.py`, NOW less RAWPA, paired by path):
   - S090, its 13,222 rule paths: tax +£11,062 (+£10,847 to +£11,278), mean pot left +£28,957 (+£25,849 to +£32,065),
     spending delivered -£82 (-£355 to +£192), 12,353 surviving against 12,366. The pot is higher at the 75th and 90th
     percentiles (£1,354k against £1,311k, £2,519k against £2,374k) and a shade lower at the median (£344k against
     £351k).
   - S328F, 7,060 paths: tax +£2,100, pot +£3,379 (+£2,147 to +£4,611), spending -£832 (-£963 to -£701). S030, 14,452
     paths: tax +£1,101, pot +£827 (+£114 to +£1,540), spending -£253 (-£338 to -£167).
   - Over all paths, the capped pot (what the solver values) NOW less RAWPA: S090 +£26,501 (+£23,780 to +£29,223);
     pooled, the file's "the capped pot -0.244%" for RAWPA against NOW.
   So with the allowance's step as before the trade is survival +0.020 and spending +0.005 points pooled and less tax
   below the cap, against a smaller capped pot (S090 about 2% less). The units store no moves or tiers, so the
   mechanism is not shown: the lead's slice priced dearer and a policy holding or drawing differently (more tax, more
   pot, a little less survival) fit the figures alike. "So the solver can price that slice itself" offers that mechanism;
   the question should go with the trade and without it.

2. **MINOR: the amended gate catches the two engines asked about, but tests less than it could.** RAWPA as NOW's engine
   fails the allowance probe; RAWPA as OFF's would give OFF's tables, which the digest test refuses (deterministic, as
   the fresh-process re-solves show). But `bandEdge` is read from NOW's own probe, so the gate now asserts no band's
   adjustment on any household, English ones included where the old probe reached it; and differing digests show that
   the arms differ, not how. A second probe point (£10,000 of interest and dividends reaches every band) would have
   tested each arm's definition on all eight; run here (above), the engines hold. Also: the stamp check added with the
   amendment has no case in `--planted` (CHECKLIST 5; shown failing here on two plants); the rule page's amendment does
   not name it (the commit message and the file's first line do); and the refusal surfaced after the run because the
   smoke covered one household, S090, where step 4 smoke-ran all eight and the read.

3. **MINOR: no forward run beside the engine in any arm, as at step 4 (its finding 3).** Each arm's `runPath` is held
   to `E.runTrial` on 200 paths, survival and tax only: the engine against the engine. RAWPA (the allowance as before,
   the bands as now) is a combination no fast-tier lockstep test runs. From the code the risk is small: `model.js` and
   `fast.js` call the same patched `E.pensionCeiling`, and with no interest or dividends every arm returns the ceiling
   before the patched line.
