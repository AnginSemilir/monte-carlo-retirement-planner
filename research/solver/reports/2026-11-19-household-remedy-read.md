# The household plan's remedy, read (19 Nov): HSP MENDS, on S191-90 by under half a path

EXPLORATORY, seed 7002, deciding nothing in the app (D129 (3); the rule `HOUSEHOLD-REMEDY-READ.md` and its amendment 1,
committed before any unit ran; the design `HOUSEHOLD-REMEDY.md` and its amendment 1; the read whole in
`results-household-remedy.txt`, the figures beside it in `results-household-remedy-beside.txt`).

## In plain words

The household plan solves one table for the couple, with one person's allowances doubled (design A). On three couples of
the lead test it lost to today's couples' default (K2): S191-90, S333F and S335F. The decomposition
(`results-household-decomp.txt`) found S333F's loss resting on the doubled income-tax bands. It read S191-90 and S335F as
EITHER: the bands single recovered most of their lost paths, and so did the cap single alone (`56.7%` and `64.8%`).

The remedy prices the household's allowances at what the two people can use, at `k = 1 / s` times one person's, where `s`
is the larger person's share of the two pensions. That gives `k` `1.667` on the 60/40 couples and `1.111` on the 90/10.
Three forms ran on the lead test's 28 units and its 4,000 paths:
- **HSPB:** the bands above two personal allowances priced at `k`, the tax-free cash cap still doubled, the even split;
- **HSP:** the bands and the cap priced at `k`, the even split;
- **HSPS:** HSP's table, with the year's need funded at the pensions' share.

**What it found, by the rule:**
- **HSP MENDS.** On the three, none lies wholly below `-0.3` points against K2:
  - S333F `+0.125` (`-0.169` to `+0.395`);
  - S335F `-0.150` (`-0.431` to `+0.158`);
  - S191-90 `-0.625` (`-0.873` to `-0.291`).
  - Over the 28 the gain is kept: pooled survival `+1.163` (`+1.110` to `+1.213`), no unit wholly below `-0.3`, and
    spending on the paths both keep `+0.6723%` of K2's.
- **HSPB DOES NOT MEND.** S191-90 stays at `-7.000` (`-7.119` to `-6.716`).
- **HSPS DOES NOT MEND.** S191-90 is `-0.650` (`-0.898` to `-0.314`), wholly below the bar.
- **The arm taken is HSP**, the smallest change that mends.

**How close S191-90 is** (`results-household-remedy-beside.txt`, section 1):
- Under HSP it recovers `97.0%` of the household plan's net loss there (`-832` paths to `-25`).
- But it still loses beyond noise: its interval lies wholly below nought.
- Its upper end, `-0.291`, clears the bar by `0.009` points, `0.38` of a path.
- HSPS loses one more path there (`36` against `35`) and misses the bar by `0.55` of a path.
- So the mend on S191-90 holds at the bar's edge. The rule decides on it as written.

**The bands alone (HSPB) against the decomposition's bands single (HSB) on S191-90** (sections 2 and 5, the same paths):
- HSB survived `98.13%`, above K2's `97.63%`. HSPB survives `90.63%`, and HSP, with the cap at `k` as well, `97.00%`.
- The two plans differ in more than one thing, each with the cap doubled in both (`536,550`):
  - the personal allowance, one person's in HSB and two in HSPB (`household.mjs` `SINGLE_GROUPS.bands` holds it, `SCALED`
    does not);
  - every band limit above it, one person's in HSB and `k` (1.111) times one person's above two allowances in HSPB (the
    basic limit `50,270` against `67,029`);
  - the taper threshold;
  - the band for gains (`37,700` against `41,889`).
- No run separates which of these matters, so this names the differences and gives no cause.
- The two reads do not conflict: the decomposition already found the cap alone recovering most of S191-90's lost paths
  (EITHER, above), and HSP prices the cap.
- Beside it, deciding nothing (section 3): under HSPB the household table's forecast on S191-90 is `7.676` points above
  what the engine delivers, the widest of the 56 remedy tables (HSP and HSPS share one). Under HSP the forecasts run from
  `1.864` points below what the engine delivers (S377-dbpart) to `1.492` above (S271-db), the mean over the 28 `+0.070`.
  No decomposition shows why HSPB's forecast misses on S191-90, so this is a lead, not a cause.

**Beside the rule, deciding nothing:**
- HSP against the household plan as built (HS): pooled survival `+0.871` (`+0.843` to `+0.895`); spending on the paths
  both keep `-0.1136%`.
- The pot capped at four times opening wealth: HSP `1.740%` below K2's (`-£43,975` a path) and `0.697%` above HS's. By
  M1 (D116) a smaller pot is not a harm where the plan keeps more paths and delivers no less spending: recorded.
- **M1 by unit** (section 4; the rule's "by unit", which the read printed pooled only): on two units HSP keeps more paths
  but spends less on the paths both keep, beyond noise, so M1's condition does not hold there.
  - S023-db: `+122` paths, spending `-0.174%` (se `0.042`), and the largest fall in the capped pot of the 28, `-13.055%`
    (`-£476,417` a path).
  - S167: `+20` paths, spending `-0.621%` (se `0.019`); its capped pot is higher, `+0.901%`.
  - The rule reads spending pooled, as written, so the outcome stands. Step 8's rule says how M1 is read unit by unit.
- Lifetime tax, the mean a unit: K2 `£272,343`, HS `£252,041`, HSP `£237,335`.
- Without its largest unit (S147-db), HSP's pooled survival against K2 is `+0.860` (`+0.806` to `+0.910`).
- The checks: the gate fair, with one code and audit stamp, seed 7002, 4,000 paths and 45 points on every unit. K2 and HS
  are the lead test's arrays, each unit's first 200 paths run again and equal. Each remedy plan is checked as part 1's
  in its form.

## What it decides, by the rule

HSP is taken. Step 8's registration is drafted on it, put to the design reviewer and brought to the maintainer before
launch (D129 (3)). Nothing in the app changes.

What step 8 is, from the external review's answers (`research/reviews/2026-11-17/ANSWERS.md`, its next step 6, at
f1f44727): a registered test on a held-out seed of what holds, against today's default and against the app's rules,
with the pot's ruling in its rule and its design to the reviewer first. Two things in it are the maintainer's before
launch:
- a held-out seed reserved for it in `check-prediction.mjs`, a protected file, so an unlock;
- the margin on S191-90 above, which the registration's own rule should weigh.

## Beside, for the record

- **One unit ran twice.** The kernel stopped unit 1 (S329F) when it ran out of memory during the windfall read's
  review on 18 Nov. Under `RESUME=1` the unit ran again on the same stamp from its saved part: its HSPB resumed at path
  3,000 of 4,000 (`results/household-remedy-7002/case1.txt`). The other 27 ran once.
- **The reader's header comment names the arms' order wrongly** ("HSP if it MENDS, else HSP, else HSPS"). Its code takes
  HSPB first (`reduce-household-remedy.mjs` line 105), as the amendment says, and its planted checks test that order.
  The file is in the audit's stamp, so it is not edited.

## The reviewer at the read

PASS, three MINORs (`reviews/2026-11-19-read-household-remedy.md`), each answered above or in step 8's draft:
- **The read reproduces.** The reducer and the beside script reproduce their files byte for byte, and `--planted` passes all 14.
- **The record checks out.** Every file was committed before any unit ran. Unit 1's resume is sound: the same stamp, its
  tables re-solved to the same digest, and its paths across the kill and the rerun matching on every key.
- **S191-90's margin rests on one path,** whichever interval is used: one more lost path, or one fewer saved, puts it
  below the bar.
1. **The planted checks cannot tell which end of the interval the bar reads.** The reviewer's mutants, reading the point
   or the lower end, passed all 14. The code reads the upper end, as the rule writes it, so the outcome stands. Step 8's
   reader plants a unit either side of its own bar (`reduce-household-hsp.mjs --planted`).
2. **This write-up gave one difference between HSB and HSPB as the cause.** It now names all of them and no cause. The
   decomposition's EITHER is now in the plain words, and "84 remedy tables" is corrected to 56.
3. **M1 was read pooled only.** It is now printed by unit, naming S023-db and S167 (above). Step 8's rule states how M1 is
   read unit by unit (`STEP8.md`).
