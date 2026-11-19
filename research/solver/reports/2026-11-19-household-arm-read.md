# Step 8's arm, read (19 Nov): HSPA, the allowance priced at the pensions' split as well

EXPLORATORY, seed 7002, deciding which arm step 8's registration carries (D130 (2)) and nothing in the app. The rule,
`HOUSEHOLD-ARM.md`, and its audit, batch and reader were committed before any unit ran (32318730). The run: 19 Nov 08:37
to 13:55 UK through the launcher (task bm4u4jfjz; code 71fb4271c681, audit b5a75b884258), 56 units, no restart, no unit
exiting with an error. Read once by `reduce-household-arm.mjs`, its output whole in `results-household-arm.txt`; the
figures beside it in `results-household-arm-beside.txt` (`household-arm-beside.mjs`, written after the read).

## In plain words

The household plan solves one table for the couple. The remedy read took HSP: the income-tax bands above two personal
allowances, and the tax-free cash cap, priced at `k = 1 / s` times one person's, where `s` is the larger person's share
of the two pensions. Read by step 8's own rule, HSP failed there on S191-90 (the design review's BLOCKING 1). D130 (2)
held step 8 and had two arms read by step 8's rule on 56 units (the lead test's 28 and step 5's 28 shapes), on the code
with the ISA allowance fixed (D130 (1)):
- **HSP**, as the remedy read ran it;
- **HSPA**, HSP with the personal allowance priced at `k` as well, so every band limit is `k` times one person's.

Each against today's couples' default (K2) on the same 4,000 paths.

**What it found, by the rule:**
- **HSP FAILS part 1.** S191-90 is flagged by D34's rule in whole paths: `26` paths lost net (`36` lost, `10` saved)
  against its threshold of `23`. Its other two parts hold: pooled survival `+3.517` points (`+3.323` to `+3.710`), and
  spending on the paths both keep `+2.1349%`.
- **HSPA PASSES all three parts.**
  1. No unit flagged. No unit loses any path net; the nearest, S149@elder2nd, is even (`11` saved, `11` lost) against
     its threshold of `21` (beside, section B).
  2. Pooled survival `+3.746` points (`+3.542` to `+3.949`), its lower end above nought.
  3. Spending on the paths both keep `+1.7544%` (`+1.7346` to `+1.7741`), not below `-0.05%`.
- **The arm taken is HSPA.**

**Said beside the outcome, as the rule requires:** at these 4,000 paths a unit's threshold is `21` to `23` paths (about
half a point of survival). D34 sets it lower at step 8's 16,000, so it flags smaller losses there. A pass here is weaker
evidence than a pass there.

**Beside the rule, deciding nothing** (`results-household-arm.txt`; `results-household-arm-beside.txt`):
- **Against the app's rules (APP):** HSPA `+11.816` points (`+11.241` to `+12.390`), HSP `+11.587`, K2 `+8.070`.
- **Without its largest unit** (S061-dbpart@gap12), each against K2: HSPA `+3.239` (`+3.045` to `+3.433`), HSP `+3.044`.
- **HSPA against HSP, unit by unit** (section C): HSPA keeps more paths than HSP on 40 of the 56 units, fewer on 10, and as many on 6. The largest differences are on
  three of the units where K2 does worst (section E): S061-dbpart@gap12 `+2.125`, S147-db@gap12 `+1.850`, S147-db@gap8
  `+1.100` points. On S191-90 HSPA is `+0.700` over HSP, which turns HSP's `-0.650` into `+0.050` (`16` saved, `14` lost).
- **M1 by unit** (D116: where the household plan keeps more paths and delivers no less spending, a smaller pot is not a
  harm). HSPA keeps more paths but spends less on the paths both keep, beyond noise, on six units:
  - S167 `+18` paths, spending `-0.783%`; S023-90 `+61`, `-0.129%`; S227-90 `+23`, `-0.324%`;
  - S023-db `+122`, `-0.291%`; S191-dbpart `+64`, `-0.169%`; S149@gap12 `+83`, `-0.097%`.
  - HSP on three: S167, S023-db and S149@gap12.
  - Step 8's rule reads M1 unit by unit (`STEP8.md`). This read's rule does not, so these are recorded.
- **The tables' forecasts** (section D): the forecast at the start less what the engine delivers on the 4,000 paths.
  - HSP: the mean over the 56 `+0.129` points, above on 28 units and below on 28, from `-2.861` (S337F@even) to
    `+4.055` (S061-dbpart@gap12).
  - HSPA: the mean `-0.343`, above on 19 and below on 37, from `-2.790` (S337F@even) to `+1.928` (S061-dbpart@gap12).
  - Each is more than a point away on 9 and 10 units. On S191-90 HSP's forecast is `1.11` points above what it delivers,
    and HSPA's `0.47` below (`results-household-arm.txt`, by unit).
- **Where today's default is below the app's rules** (section E): K2 survives below APP on five units:
  - S061-dbpart@gap12 `-20.250`, S147-db@gap12 `-10.950` and S147-db@gap8 `-6.800`: the three step 5 found (D128);
  - S061-dbpart@penB90 `-10.175` and S061-dbpart@penA100 `-2.850`.
  - On all five the app's guard keeps the couple on the app's rules: the three by D128's guard (an age gap with other
    taxable income), the two as uneven, their holdings outside the shares of the pots the guard admits (D99). So the app
    runs none of them on K2.
  - HSPA is `+11.375` to `+13.675` points above APP on all five.

## The ISA fix on these units (beside, section A)

The code moved between the earlier runs and this one. D130 (1) counts a dated deposit or staged transfer into an ISA
against that year's allowance, and the code id went from 603eeb595679 to 71fb4271c681. So each arm here was compared,
path by path, with the same arm of the earlier runs on the same units and paths.
- **Step 5's 28 shapes:** APP and K2 are the same as step 5's in every stored figure on every path.
- **The lead test's 28:** K2 is the same as the lead test's and the remedy read's on 27. S227-90 differs on `7` paths in
  survival. Its arm A pick, Windfall to ISA, sends its windfall into the ISA, and every arm routes it so (D37).
- **HSP against the remedy read's,** on the lead test's 28: the same on 20; 8 differ, `7` paths in survival in all
  (S191-90 one, S227-90 four, S271-90 two). Each of the 8 is a unit whose household plan carries the later retiree's ISA
  contributions as dated deposits (`household.mjs` turns them into yearly deposits until that person retires).
  - 16 of the 28 household plans carry such deposits (section A2).
  - On the other 8 of those 16, S327F to S343F, nothing moved on these paths: the fix bites only in a year where the
    year's own flows into the ISA reach the room the deposits leave.
  - No arm moved on a unit the fix cannot reach.
- **On S191-90,** HSP loses one more path here than in the remedy read (path 825): `26` net against `25` there. It is
  flagged by step 8's rule either way, as the design review found.

## What it decides, by the rule

HSPA is taken (`HOUSEHOLD-ARM.md`, Outcomes): **step 8 is registered on HSPA.** Its registration's arm, the audit's plan
checks and the panel's refusals become HSPA's, and the design reviewer sees it again. By D130 (1) the panel is landed
again on the fixed code, and the pilot and the sizing are taken again on it. Seed 7024's reservation is asked of the
maintainer at the second design review (D130 (4)). Then the registration goes to the maintainer before launch. Nothing in
the app changes.

## The reviewer at the read

Called on this write-up (`reviews/2026-11-19-read-household-arm.md`); its verdict follows here.
