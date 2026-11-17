# Review at the read, second round: a wider joint move for couples (JOINT-WIDE, D111 (2); EXPLORATORY), the fix 0b3519aa

Subject: the one fix that answers the first round (`reviews/2026-11-17-read-joint-wide.md`: FAIL, three BLOCKING, four
MINORs, all in the write-up's words). It covers:
- the new beside script, `joint-wide-beside.mjs`, and its output, `results-joint-wide-beside.txt`;
- the rewritten report, `reports/2026-11-17-joint-wide-read.md`;
- `QUESTIONS-2026-11-17.md` section 1, the handover to the external review.

I checked each first-round finding's answer, every new figure against the units, and every new sentence for overreach.

Read (blobs at 0b3519aa):
- changed: `joint-wide-beside.mjs` dd7f0008a3a1, `results-joint-wide-beside.txt` 58abb95945e4, the report 37da49d9098f,
  `QUESTIONS-2026-11-17.md` ef1b7a6e9bde;
- unchanged since a7aed0f6: `results-joint-wide.txt` 01a90917adfa, `reduce-joint-wide.mjs` 1a77cf6d8939, `stats.mjs`
  7cf309da0151, `STATE.md` 6d2fa7d5a2cc;
- the commit between the read and the fix, 6ec25d7c, touches only `src/App.jsx` and `src/Docs.jsx` (words). It changes no
  stamped file and nothing in `src/solver`, and the stamps at HEAD are still the units' (`603eeb595679`, `109137137d97`);
- `STATE.md` D112, for the interval fix that `joint-wide-beside.mjs` names in its header;
- `reviews/2026-11-12-read-couple-sweep.md` MINOR 4, the source of that fix;
- `results-share-rules.txt`, for the MEANS comparison. Not opened: `results/joint-wide-7002-stopped/`.

Ran (reads only):
- `node research/solver/joint-wide-beside.mjs`: `results-joint-wide-beside.txt` byte for byte.
- `node research/solver/reduce-joint-wide.mjs`: `results-joint-wide.txt` byte for byte, the gate fair.
- `check-state.mjs`: passes.
- My first round's independent scripts, for each new figure. A ranking of the share rules' 32 MEANS units.

Verdict: PASS

Every first-round finding is answered. Every new figure is printed by `joint-wide-beside.mjs` from the units, or was already
in `results-joint-wide.txt` or `results-share-rules.txt`, and each matches my own computation. The fix adds one new
overstatement and leaves one caveat unstated (findings 1 and 2, both MINOR). Each is a clause to change. Neither touches the
outcome, the handover's account of the pot, or any decision.

## The first round's findings, answered

1. **S061-90 is named** in the report (What it found) and the handover, with both intervals: -0.225 points (-0.465 to
   -0.001 by the rule's interval; -0.388 to +0.011 by the exact one; 14 lost, 5 saved), inside the -0.3 bar, none under K6.
   Section A of the beside prints it. See finding 2 below for the caveat it still needs.
2. **The account of why the pot falls is withdrawn.**
   - The report and the handover say the cause is not shown.
   - "Spends the pot", the "So ..." sentence and "spends the pot sooner" are gone.
   - For S109-sppart the report now states only the facts: spending +0.44%, tax lower, the capped pot 5% lower.
   - See finding 1 below for the one clause that now overreaches the other way.
3. **The misread claim is withdrawn** in the report and the handover.
   - S147-db is "the couple MEANS helped most in the share rules' test (+9.3 points)". That is right: its +9.338 is the
     largest of the 32 MEANS changes in `results-share-rules.txt` (next are S023-db +2.706 and S271-db +2.250).
   - Its part of the gain is stated, from section B of the beside: 40.6% of K6's net paths saved (206 of 508) and 20.5% of
     K4's (54 of 264). Without it, pooled survival is +0.280 (+0.232 to +0.327) under K6 and +0.194 (+0.150 to +0.239)
     under K4.
   - "What the read cannot show" calls the coincidence a lead, not a cause shown.
4. **The replays** (section D) match my figures: 32.4% and 41.9% pooled; 9.7% to 66.2% by unit; the split 45.7% and 48.2%;
   under half of a unit's differing picks on 15 of 28 units.
5. **The typical-path pot** (section E) matches my figures.
   - Without S147-db it is +3.215% (K4) and +3.946% (K6).
   - S147-db's own figure comes almost wholly from paths K2 fails: 60.215 of its 63.982 points, and 136.868 of 139.489.
   - Its median path is +2.773% and +2.798%. The beside takes the upper of the two middle paths, where I averaged them
     (+2.796%); both round to "+2.8%".
6. **The counts** (section C) now carry their bar: under K4 lower on 9, five past the bar; under K6 lower on 10, seven past
   it; K6 against K4 lower on 12, five past it.
7. **The time groups** (section F): the report now says the groups by first arm are different units and do not measure an
   order effect, and that the younger group's time is over its four units with all arms in one process.

The beside reads only the unit files in `results/joint-wide-7002` (not the set-aside folder, and not recursively). It takes
`armOf` and `cells` from the stamped reducer without running it, and uses `stats.mjs` unchanged since the read.

## Findings

1. **MINOR. A new overstatement, the mirror of the first round's finding 2: "the falls do not follow spending".**
   - Where: "What it found" ("Why the pot falls is not shown: no decomposition was run, and the falls do not follow spending
     (of K4's five, two spend less)") and "What the read cannot show" ("The falls do not follow spending: of K4's five,
     S109-90 and S061-dbpart spend less").
   - The K4 fact cited is true. The general claim is not. From the results file's lines by unit, the capped pot falls more
     often where spending rises, under both widths:
     - K4: of the 11 units that spend more, 6 have a lower capped pot; of the 17 that spend less, 3 do.
     - K6: of the 10 units that spend more, 7 have a lower capped pot; of the 18 that spend less, 3 do. Six of K6's seven
       units past the bar spend more. Only S061-dbpart spends less.
   - So the falls go with more spending on most of the units where they occur, but not on all. What drives them is not
     shown either way.
   - It should say, for example: "the falls go with more spending on some couples and not on others (of K4's five, three
     spend more and two less; of K6's seven, six spend more); how much of the fall the spending accounts for is not shown."
   - Not blocking: the sentence it sits in already says the cause is not shown, the handover says "for reasons not shown",
     and nothing rests on the clause. It should still change before the report goes to the maintainer.

2. **MINOR. S061-90's "lower beyond noise" rests on an interval that D112 is about to correct. My first round did not take
   that into account.**
   - D112 (17 Nov, the maintainer, "Stats helper - fix") rules that `survivalChangeU`'s paired correlation be corrected as
     Newcombe's method 10 has it, after this read. Until then, "the reads made before stand as printed, each checked for an
     interval end the fix would carry across its bar". `joint-wide-beside.mjs`'s own header names that fix.
   - The function is known to be a little narrow where nearly every path survives (`reviews/2026-11-12-read-couple-sweep.md`
     MINOR 4: up to about 0.01 points).
   - S061-90's upper end is -0.001. With the correlation corrected as that review reads the method (the numerator less half
     the paths where it is above that), my computation from the same cells (3,893 / 14 / 5 / 88) gives -0.470 to +0.004:
     not below nought. The pooled intervals barely move (K4 +0.190 to +0.282 either way), and no rule bar is crossed.
   - The report's lead, "One couple's survival is lower beyond noise under K4", is right only for the function as it stood
     at the read. It is not right by the exact interval, and not by the corrected one. The same holds for the handover's
     "one unit lower beyond noise by the rule's interval".
   - It should say, in the report and the handover: S061-90 under K4 ends just below nought by the rule's interval as it
     stood at the read (-0.465 to -0.001). It is not below nought by the exact paired interval (-0.388 to +0.011). D112's
     correction, due after this read, widens the rule's interval, and the claim is to be re-checked then.
   - D112's own re-check looks for an interval end crossing a rule's bar. This claim is about nought, so the re-check could
     miss it, and the report should say so itself.
   - If the corrected figure is quoted, it should be printed by a script. Section A of the beside imports the live
     `stats.mjs`, so once D112's fix lands it will print differently on a re-run. The committed output stands as the read's.
