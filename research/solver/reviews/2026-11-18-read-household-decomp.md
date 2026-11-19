# Review at the read: the decomposition of the household plan's three losses (HOUSEHOLD-DECOMP.md; D129 (1); EXPLORATORY, seed 7002)

Subject: the read committed at 981122be: `results-household-decomp.txt`, the reducer's output whole (S191-90 EITHER, S333F
RESTS ON THE BANDS, S335F EITHER), and its write-up `reports/2026-11-18-household-decomp-read.md`.

Read (blobs at f0d009b3, the branch's head when this was written; none of these changed after 981122be):
- the rule: `HOUSEHOLD-DECOMP.md` 68c1fccd18c9; D129 in STATE.md.
- its files: `audit-household-decomp.mjs` 01333c239c85, `reduce-household-decomp.mjs` 691a17e0b52e,
  `batch-household-decomp.sh` 97af5faa5266, `household.mjs` 09e83e472532 (`householdPlanFor`'s `opts.single`,
  `SINGLE_GROUPS`, `singleKeys`, `inBands`, `solveHousehold`, `chooseHouseholdSingle`), `research/tests/household.test.mjs`
  14d479d1c2d5 (group 9).
- what they import: `audit-household.mjs` f40361acbe6c, `reduce-household.mjs` 2a762db28f98 (`armOf`, `cells`, `spendOn`),
  `stats.mjs` a4095c8e339e (`survivalChange`, `survivalChangeU`), `fair-gate.mjs` c6b3e87e1643; `research/engine.mjs`
  `taxParams` (lines 1167 and 1252).
- the results: `results-household-decomp.txt` 275a35a60e13, `results-household-decomp-planted.txt` 1e72b5972e2c,
  `results-household-test.txt` c5d477a3fac6; cited by the write-up, `results-axis.txt` 52a690b2b4c9 and `AXIS.md`
  0f15b9e94541.
- the write-up: `reports/2026-11-18-household-decomp-read.md` 7602bb81ea08.
- the run: `results/household-decomp-launch-1.log`, `results/household-decomp-7002/` (`S191-90.json.gz` 489be02ea52a,
  `S333F.json.gz` 8452ac56ebc0, `S335F.json.gz` d993cfd941ca, `case0.txt` to `case2.txt`; `parts/` empty), `runs.log`'s
  line for 18 Nov 19:16 UK, the launch's snapshot `/tmp/solver-snap-BeuPbX`; the lead test's unit files
  `results/household-7002/S191-90.json.gz`, `S333F.json.gz`, `S335F.json.gz`. Every path read is seed 7002's.

Ran:
- `node research/solver/reduce-household-decomp.mjs`: `results-household-decomp.txt` byte for byte, the gate fair.
  `--planted`: 19 of 19 pass.
- `node research/solver/code-id.mjs`: `603eeb595679`. `stampFilesHash()`: `8f3c434a5f55`, the units' stamp.
- My own recomputation from the unit files, written apart from the reducer, with my own Clopper-Pearson (not `stats.mjs`):
  L, each variant's paths of L kept and of HS's lost, its recovery and share, the variant less HS's exact interval, each
  outcome, the pooled recoveries; and the identity of K2 and HS with the lead test's arrays.
- Then, from the same files, figures the read does not print: `stats.mjs` `survivalChange` and `survivalChangeU` for HSBC
  less HSB and for the variants against K2; each arm's spending, lifetime tax and end pot on the lost paths.
- These scripts are in this session's scratchpad, not committed. Their figures are in What holds 4 and findings 1, 3 and 4.

Verdict: PASS

The read stands: the gate, every figure of the results file and each unit's outcome are right by the rule as committed,
and the write-up's next step is the rule's. The four findings are the write-up's, each a change of words with any new
figure printed by a script beside the rule; none moves an outcome or the next step.

## What holds

1. **The rule's files and the run's account.**
   - `HOUSEHOLD-DECOMP.md`, the audit, the reducer and the batch have one commit each, 2b03a19a (18 Nov 19:08:46 UTC).
     `household.mjs` and `household.test.mjs` last changed there too. No later commit, up to f0d009b3, touches any of them,
     and the working tree holds them as committed.
   - The launch was 19:16 UK (UTC in November), through the launcher, from 2b03a19a, after the rule. The snapshot holds the
     four files, `household.mjs`, `audit-household.mjs` and `research/engine.mjs` byte for byte as the tree does.
   - One window, no resume: three logs, each stamped `code 603eeb595679 audit 8f3c434a5f55` with its done line; each arm's
     four chunks from one process; `parts/` empty; one line in `runs.log`.
2. **The gate.**
   - K2 and HS: all seven arrays equal the lead test's K2 and HS1 byte for byte on all three units, in my own comparison
     of the stored strings. K2's two tables and HS's household table carry the lead test's digests. HS is not HS5, as
     designed.
   - The plans: 25 doubled entries recorded for each arm. HSB's nine band entries, HSC's `pclsMaxCap` and HSBC's ten are
     each exactly half HS's, and every other entry is HS's (S191-90: `personalAllowance` 25,140 to 12,570, `pclsMaxCap`
     536,550 to 268,275).
   - The band for gains: 75,400 on HS and HSC, 37,700 on HSB and HSBC, a person's 37,700. The variants' tables are not HS's.
3. **The code does what the rule says.**
   - `opts.single` changes only the config entries of its groups (`householdPlanFor` line 151). Nothing else that function
     returns depends on it.
   - With the bands single the table is solved outside `twoBands` (`solveHousehold` line 232). The engine reads its default
     basic band only for the band for gains (`engine.mjs` 1252; 1167 reads the plan's own). So a variant's table differs
     from HS's in its named entries and, with the bands single, the band for gains alone.
   - Each household arm runs the couple's own plan under `householdSinglePolicy` at the even split (the audit's `ctxOf`).
     Every arm runs on the same paths (`E.pathsForSeed(7002, 4000, T)`) and is held to `E.runTrial` on its first 200.
   - `household.test.mjs` group 9 passes (ALL PASS, 38), each plant failing its check.
4. **Every figure of the rule reproduces from the unit files, in my own code.**
   - L: 832, 52, 71.
   - Kept of L and lost of HS's: HSB 824/0, 43/8, 57/4; HSC 477/5, 35/17, 50/4; HSBC 821/0, 45/8, 57/6.
   - Every share, and every variant-less-HS interval to the third decimal.
   - The outcomes: EITHER, RESTS ON THE BANDS, EITHER. Pooled: 912, 536 and 909 of 955.
   - Every figure the write-up quotes matches the read or `results-axis.txt` (829 paths; `£32,532`, `£29,268`, `£88,659`,
     `£461`).
   - The lead test's HS5 counts (829, 51, 70) and the rule's HS1 and HS5 survival pairs match the lead test's unit files.
5. **The next step is the rule's.**
   - One remedy for both: EITHER on S191-90 and S335F, with S333F's bands inside it. It is designed first with its form
     and test, built in research code alone, and read EXPLORATORY on all 28 units at seed 7002 by a rule committed first.
   - Design B is not built (D129 (2)). On these couples the bands' part falls mostly outside the axis's window, as
     `AXIS.md` and `results-axis.txt` give it.
   - Step 8 stays held (D129 (3)).

## Findings

1. **MINOR. "With the bands single, the household plan survives as well as today's default on all three" is a no-effect
   claim on S333F (`+0.025`) and S335F (`+0.100`), given without its interval.** (Report lines 24 to 27.)
   - The read prints HSB less K2 as S333F `+0.025` (`-0.234` to `+0.278`) and S335F `+0.100` (`-0.222` to `+0.406`). That
     is the conditional exact interval, and `stats.mjs` itself warns about its no-harm end.
   - Newcombe's method 10 (`survivalChangeU`), in my run, gives `-0.237` to `+0.288` and `-0.216` to `+0.419`.
   - Both lie above the lead test's unit bar of `-0.3` either way. So the claim holds as "not below the lead test's bar of
     `-0.3`". Say that, with the interval beside it.
   - "Recovers almost all of each loss" (line 21) is true of survival: HSB less K2 is at or above nought on all three. It
     is not true of the rule's measure, which is 67.3% on S333F and 74.6% on S335F.
   - The pooled 95.5% is S191-90's: 824 of the 912 paths recovered. Without it, 88 of 123 (71.5%), and HSC 64 of 123
     (52.0%). Say which measure each phrase uses.
2. **MINOR. "What it costs" gives spending alone. On two units the pot and the tax go against the variant.** (Report lines
   46 to 49.)
   - The rule says "The spending and the pot beside each variant show the price". D116 records the pot "beside the
     spending".
   - From the read (lines 35, 39, 45, 49), HSB's capped pot:
     - S333F: `-0.697%` against HS (`-£45,716` a path) and `-1.797%` against K2 (`-£119,140`);
     - S335F: `-0.582%` (`-£39,722`) and `-1.452%` (`-£99,989`).
   - HSB's lifetime tax, against HS and K2:
     - S333F: `£1,512,509`, against `£1,466,928` and `£1,334,911`;
     - S335F: `£1,484,542`, against `£1,457,341` and `£1,353,244`.
   - So on S335F, against today's default, the bands-single plan is level on survival (`+0.100`, inside noise), spends
     less (`-0.27%`) and leaves less (`-1.452%`).
   - On S191-90 both go its way: the capped pot `+9.855%` against HS and `-0.305%` against K2; tax `£518,641` against
     `£939,164` and `£600,613`.
   - The fix: the pot and the tax beside the spending, unit by unit.
3. **MINOR. The causal sentence rests on no figure this run prints, and the account it closes is S191-90's.**
   - The sentence is "Run on the couple, the plan pays more tax than its table expected, so it ends with less"
     (lines 44 and 45).
   - The read prints lifetime tax over all paths only. There, HSB pays more than HS on S333F and S335F. It prints nothing
     on the lost paths.
   - The unit files support the sentence on all three units, in my script:
     - on L, mean lifetime tax:
       - HS: `£955,054`, `£561,826`, `£521,835`;
       - CEIL, the table on its own plan: `£436,732`, `£420,272`, `£363,033`;
       - HSB: `£675,901`, `£427,191`, `£366,660`.
     - on L's paths that HS loses at the minimum pot and HSB keeps (667 of 670, 41 of 44, 52 of 56), HSB less HS:
       - spending delivered `+0.025%`, `+1.147%`, `+0.395%`;
       - lifetime tax `-£302,151`, `-£148,423`, `-£151,391` a path;
       - end pot `+£356,750`, `+£113,511`, `+£101,469`.
   - That also answers the rule's caveat on the paths that decide: where HSB recovers, it does not spend less. Print these
     figures by a script beside the rule and cite them.
   - Say also two things these figures show.
     - **(a) L's paths sit just under the floor.**
       - On the ones lost at the minimum pot, HS's shortfall has a mean of `£31,293`, `£14,655` and `£17,213`, and a
         median of `£25,567`, `£8,102` and `£15,206`.
       - A variant that adds tens of thousands to the end pot keeps them, through tax or otherwise. The cap single keeps
         461 of S191-90's 670 with `£13,693` less tax and `£67,453` more pot on them.
       - So the tax account covers the bands, not the cap.
     - **(b) "Why the doubled bands overstate what these couples can use" gives S191-90's draws alone.**
       - On S333F and S335F, `results-axis.txt` puts as much of the bands' part before the first retirement, with no
         pension drawn (`£35,309` and `£36,578` a path), as after the younger person's state pension age (`£34,852` and
         `£37,243`).
       - The lead test's reviewer read the first as tax on the savings income while both work
         (`reviews/2026-11-17-read-household.md`, finding 1 (c)).
       - The read shows the bands-single table keeping those two couples' paths. It does not show which part of the
         overstatement does it.
       - The design committed after the read (5b1eeed4) prices the allowances by the pensions' share, so its read is
         where that gets tested. The write-up should say the account is S191-90's.
4. **MINOR. With the bands single, leaving the cap single as well adds nothing on the two units the rule reads EITHER. So
   the read does not show a part of the loss resting on the cap beyond the bands.**
   - HSBC less HSB, from the unit files (`survivalChange`):
     - S191-90: `-0.325` (`-0.540` to `-0.040`; 8 saved, 21 lost), a loss beyond noise;
     - S335F: `-0.125` (`-0.212` to `+0.045`);
     - S333F: `+0.275` (`+0.091` to `+0.324`), on the unit where the cap alone does not recover.
   - Recoveries, HSBC against HSB: S191-90 98.7% against 99.0%; S335F 71.8% against 74.6%; S333F 71.2% against 67.3%.
   - "The doubled cap on two" (the title) and "(and, on two of them, the doubled cap)" (line 51) are EITHER's reading:
     each alone keeps half or more. That reading is the rule's, and "one remedy for both" follows it.
   - But the design that follows prices the cap too. So the write-up should say, beside the outcome, that on those two
     units the cap adds nothing once the bands are single, and on S191-90 costs a third of a point.
   - The rule's caveat on the two small units is not carried either. S333F reads RESTS ON THE BANDS, not EITHER, because
     HSC recovers 18 where half is 26. On S335F's EITHER, HSC recovers 46 against the 36 needed.
   - Nothing turns on it, since the next step is one remedy either way. But the rule says these outcomes can turn on a few
     paths, and the write-up separates the units on them ("S333F calls for the bands, S191-90 and S335F for one remedy
     covering both").
