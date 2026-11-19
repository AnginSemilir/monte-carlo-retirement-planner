# Review at the read: step 8's arm (HOUSEHOLD-ARM.md; D130 (2); EXPLORATORY, seed 7002)

Subject: the read committed at e93fed62, `results-household-arm.txt`, the reader's output whole (HSP FAIL, HSPA PASS, the
arm taken HSPA); the figures beside it, `results-household-arm-beside.txt`; and the write-up
`reports/2026-11-19-household-arm-read.md` (c31ae095). Also checked: whether the read was made by its rule as committed
before any unit ran.

Read at c31ae095. One commit landed while I read: 6b5d11b1, the full tier's two S090 pins and `results-isa-allowance-pins.txt`.
It touches no file below.

Read (blobs at HEAD):
- the rule and the design: `HOUSEHOLD-ARM.md` 517cac71823a, `STEP8.md` 07658a054523, `registrations/household-hsp.md`
  831f041ab226, D130 in STATE.md, `runs.log` 5f7dd419c96f (line 390).
- the code: `audit-household-arm.mjs` 585f5b62e32e, `reduce-household-arm.mjs` 34db98933b90, `batch-household-arm.sh`
  db535d0e08cb, `household-arm-beside.mjs` 18bee07865d2.
- what they import: `reduce-household-hsp.mjs` 32bf518b5c1b (`compare`, `keptSpend`, `m1ByUnit`, `rule`),
  `reduce-share-rules.mjs` b46fa5187e99 (`harmExact`), `reduce-couples.mjs` cae05c5a8e75 (`harmOf`), `reduce-phase4.mjs`
  ac319aad1f44 (`byPath`, `survivalItem`, `lossOf`), `reduce-household.mjs` 2a762db28f98 (`cells`, `spendOn`, `armOf`),
  `household.mjs` 5d316e011b3b (`householdPlanFor`, `pensionsSplit`, `bandsAt`, `solveHousehold`), `audit-household.mjs`
  f40361acbe6c, `fair-gate.mjs` c6b3e87e1643, `household-hsp-panel.mjs` 24ea1b926fe5 (`guardOf`), `src/couplesSwitch.js`
  b33f855de049.
- the ISA fix 675090f5, its commit message, and `src/App.jsx` 4f649bd7bbd9 `stepYear`: lines 2176 to 2265, 2525 to 2540,
  2628 to 2700 and 2790 to 2800, and the staging of a deposit, 1880 to 1950.
- the results: `results-household-arm.txt` 0eef14d8b4e6, `results-household-arm-beside.txt` 50d8b4294ad1,
  `results-shapes-beside.txt` 916e4641b01d.
- the run: `results/household-arm-launch-1.log` (08997e114f9a); `results/household-arm-7002/`, with 56 unit files, `case0.txt`
  to `case55.txt` and `parts/` empty (`S191-90.json.gz` c2a7a0919b35, `S061-dbpart_gap12.json.gz` 8a877507916c, `case0.txt`
  20e6875f4211).
- the earlier runs' unit files in `results/household-7002`, `household-remedy-7002` and `shapes-7002`.

Every path read is seed 7002's. Nothing of seed 7024 was read, printed or estimated.

Ran:
- `node research/solver/reduce-household-arm.mjs`: `results-household-arm.txt` byte for byte, the gate fair.
  `stampFilesHash()` prints b5a75b884258, the units' audit stamp. `--planted`: ALL PASS (8).
  `audit-household-arm.mjs --planted`: 6 of 6.
- `node research/solver/household-arm-beside.mjs`: `results-household-arm-beside.txt` byte for byte.
- Scripts of my own in the scratchpad, deciding nothing:
  - every unit's saved and lost paths under each arm, its D34 threshold (`harmExact`) and its 1-point rate;
  - the pooled survival by path and the kept spending, recomputed without the reader's helpers, and the forecasts' counts;
  - each unit's table digests read whole against the earlier runs';
  - S191-90's flag in the remedy read's own arrays;
  - each arm's chunk processes;
  - the ISA deposit years in the household plans of the 16 lead units that have them, and their pension access age.

Verdict: PASS

## What I checked

1. **The rule was committed before any unit ran.**
   - 32318730 (19 Nov 08:30:41 UTC) commits `HOUSEHOLD-ARM.md`, the audit, the batch, the reader and `household.mjs`'s
     'pensionsPA'.
   - The launch (`runs.log` line 390, 08:37 UK, which is UTC in November) ran from a snapshot of 899bf7bd (08:30:54). Its
     one change after 32318730 is `src/PlannerCards.jsx`, which is outside the code id.
   - All fifteen stamped files have the same blob at 32318730, at 899bf7bd, at HEAD and in the tree. `code-id.mjs` prints
     71fb4271c681.
   - Every one of the 56 logs has one stamp line (`code 71fb4271c681 audit b5a75b884258 prediction none sha -`) and a done
     line, and none has an "exited" line. Every arm of every unit was run by one process, so there was no restart. Every
     unit is at estate weight 0.02.
   - The read (e93fed62, 14:10:40 UTC) came after the run ended (13:55 UK).
2. **The rule is applied as written.**
   - `armRule` (reader lines 60 to 64) is `reduce-household-hsp.mjs` `rule` (lines 154 to 158) with the arm named.
     - Part 1 holds when no unit has a `harmExact` flag, that is net paths lost above j in whole paths.
     - Part 2 holds when the by-path interval's lower end is above 0.
     - Part 3 holds when `keptSpend`'s point is at least -0.05.
   - `armTaken` picks HSP if it passes, else HSPA if it passes, else NEITHER. That matches the rule's Outcomes.
   - The outcome does not turn on which end of an interval a part reads:
     - HSPA's lower ends are +3.542 (part 2) and +1.7346 (part 3);
     - HSP's flag on S191-90 is 26 net against 23, and it would still hold at the floor threshold of 21.
   - The planted case one path each side of D34's bar pins part 1's comparison.
3. **Every figure, recomputed.** All of these agree with the file and the write-up:
   - S191-90 under HSP: 36 lost, 10 saved, j 23, flagged. In the remedy read's arrays: 35 lost, 10 saved, 25 net, j 23.
     Path 825 is the one that moved.
   - HSPA: no unit with a net loss. The nearest is S149@elder2nd, 11 saved and 11 lost.
   - Pooled survival by path: HSP +3.517 (+3.323 to +3.710), HSPA +3.746 (+3.542 to +3.949), K2 against APP +8.070.
   - Spending on the paths both keep: +2.1349% and +1.7544%.
   - HSPA against HSP: above on 40 units, below on 10, level on 6.
   - The forecasts: above the survival on 28 and below on 28 for HSP, 19 and 37 for HSPA; more than a point away on 9
     and 10.
   - M1's units: six under HSPA, three under HSP.
   - Section E's five units and the guard's reasons. Step 5's own beside (`results-shapes-beside.txt` lines 41 to 53)
     printed the same five below APP, and named three of them as handed to the solver at the time.
4. **Section A's comparisons hold as printed.**
   - K2 is the lead test's on 27 of 28 units (S227-90 apart) and step 5's on all 28 shapes.
   - APP is step 5's on all 28 shapes.
   - HSP is the remedy read's on 20 of 28 units.
   - Every arm that moved is on a unit whose plans carry a deposit the fix counts. A staged transfer into an ISA comes
     only from such a deposit (`App.jsx` 1880 to 1950), so A2's reach misses nothing.
   - Findings 3 and 4 cover what the section's evidence and coverage do and do not show.

## Findings

1. **MINOR. The caveat's figure, "a unit's threshold is 21 to 23 paths (about half a point of survival)", holds only on
   the units near the bar.**
   - Over the 56 units, D34's threshold (`harmExact`'s j at the realised discordance) runs from 21 to 70 paths under HSPA
     and from 21 to 71 under HSP.
   - 32 of HSPA's 56 comparisons fall outside 21 to 23 (33 of HSP's). Examples: S061-dbpart@gap12 70 paths (1.75 points;
     discordance 32.2%), S147-db@gap12 62, S061-dbpart@penB90 61, S147-db@gap8 59.
   - Section B, which the sentence cites, lists only the twelve units nearest the bar, and all twelve are at 21 to 23.
   - D34 (4)'s 1-point rate at the realised discordance is below 0.90 on 21 of HSPA's 56 comparisons. It runs from 0.203
     (S061-dbpart@gap12) to 0.894 (S147-90). On those units a true 1-point loss would often go unflagged at 4,000 paths.
   - Every one of the 21 is a unit where HSPA gains 1.8 points or more (the least is S271-db at +1.800), so no outcome
     turns on it. On the units near K2 the threshold is 21 to 23 and the rate is high (S191-90 under HSPA: 0.999).
   - The caveat also leaves out that S191-90's +0.050 under HSPA is in sample:
     - it is read on the same 4,000 paths of seed 7002 that showed HSP's flag;
     - HSPA was proposed from those same paths (`STEP8.md`, "The maintainer's", 1 (a): the decomposition's bands single on
       S191-90);
     - so it is not out-of-sample evidence for that couple. Step 8's "90" units, on held-out couples and a held-out seed,
       will be.
   - Fix:
     - give the range, and where it is 21 to 23;
     - say that the comparisons with a weak 1-point rate are all large gains;
     - say that S191-90 is in sample.
2. **MINOR. "Step 8's rule reads M1 unit by unit (STEP8.md). This read's rule does not, so these are recorded." Both rules
   read M1 by unit beside the outcome, and neither blocks on it.**
   - `HOUSEHOLD-ARM.md` line 66 lists "M1 by unit (`m1ByUnit`)" under "Beside, deciding nothing".
   - `STEP8.md` lines 78 to 83 and line 110 say of it: "It is printed and its exceptions named, not a bar".
     `registrations/household-hsp.md` lines 63 to 66 say: "It is not a bar".
   - As written, the sentence tells the maintainer that step 8 will judge HSPA unit by unit on M1 where this read did not.
     Step 8 will only name the units.
   - With HSPA the named units go from HSP's three to six. S023-90, S227-90 and S191-dbpart are new, and S167, at
     -0.783%, is the deepest.
   - That is the trade `STEP8.md`'s item 4 for the design reviewer asks about: whether a named unit should block. The
     write-up should say so in place of the sentence.
3. **MINOR. Section A's account of where the fix moved the arms holds, but two things are missing:**
   - the evidence that shows it, which is the tables' digests, and the beside cuts them off;
   - that on the units that moved, the fix moved the household table's solve as well as the engine's year.
   - The stamps line (`household-arm-beside.mjs` line 102) cuts each digest object at 160 characters, so it never reaches
     the remedy read's HSP digest, which is stored under "pensions".
   - Compared whole:
     - HSP's household table differs from the remedy read's on exactly the eight units where HSP moved, and is the same to
       the bit on the other twenty;
     - K2's first table differs from the lead test's on S227-90 alone;
     - both of K2's tables are step 5's on all 28 shapes.
   - So on those eight the fix changed the table the household plans with, not only how the engine runs it. On S327F to
     S343F it changed nothing in the table either.
   - The account of those eight is right about the code. It reads: "the fix bites only in a year where the year's own
     flows into the ISA reach the room the deposits leave".
     - 675090f5 adds the dated deposits and staged transfers to `isaContribThisYear` (`App.jsx` 2225, 2241).
     - It changes only what reads that room (2263, 2534, 2635, 2670, 2693, 2798).
   - It also fits the plans:
     - On S327F to S343F the household plan's ISA deposits fall in plan years 15 to 17, with the first person aged 52 to
       54. That is before pension access at 58, so no draw-first or harvest re-wrap goes into the ISA in those years.
     - On the eight that moved, the deposits fall at ages 60 to 62, with access: plan years 5 to 7, or 15 to 17 for S271.
   - But no flow was traced on any unit, so the "because" is an inference. It need not say less. It should rest on what
     shows it: the tables and paths, identical to the bit, show the fix never acted where it would change a value. Which
     flows fell short of the room is not measured.
4. **MINOR. "K2 and APP (compared on all 56)" (beside A2, line 45) claims more coverage for APP than was compared. The
   write-up's "No arm moved on a unit the fix cannot reach" rests on that line.**
   - APP was compared on step 5's 28 shapes only. The lead test stored K2, HOUSE, HS5 and HS1, and the remedy read stored
     K2, HS, HSPB, HSP and HSPS: neither stored APP. `household-arm-beside.mjs` line 43 loads only K2 from the lead test.
   - So APP on the lead test's 28 has no earlier run beside it. That includes S227-90, which the fix reaches: arm A's
     Windfall to ISA puts its Auto deposit in the ISA, and K2 moved there on 7 paths.
   - The write-up's own lines limit APP's comparison to the shapes, and APP decides nothing here.
   - The sentence should name what was compared: K2 on all 56 units, APP on the 28 shapes, HSP on the lead test's 28.
     HSPA has no earlier run.

No finding moves the outcome. HSP fails part 1 on S191-90, HSPA passes all three parts, and by `HOUSEHOLD-ARM.md`'s
Outcomes step 8 is registered on HSPA.
