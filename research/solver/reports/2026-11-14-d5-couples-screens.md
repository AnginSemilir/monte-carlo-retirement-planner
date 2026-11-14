# Part D's D5: the couples' screens in the new planner, built behind a switch that is off (14 Nov)

**What it is.** With couples switched on, a couple's plan in the new planner is solved by the couples' solver instead of
running on the app's rules: each person's table is solved with their partner's age, then the household's moves are chosen
year by year from the two. The household gets one answer ("your safe starting spend, for the two of you"), this year's
actions named for each person, the next ten years with both people's moves, the comparison with your current approach,
Details with the ledger, and the limits per person. A couple holding less than 40% or more than 60% of the pots with one
person is shown the couples card with that reason and keeps the app's rules until item 6's stage C reads (M4; stage C is
running). The switch, `COUPLES` in `src/couplesSwitch.js`, is off in the code. With it off, a couple's plan keeps the
couples card and the app's rules, and every screen a couple sees is as it was, You's limits card included (the reviewer
found that card had changed; it is now as before, and the browser harness checks it). Switching couples on (D6) is yours.

**One fix that reaches every visitor of the new planner, couples off.** A solve at the app's settings is kept again. This
container's browser (Chromium 153, since the restart of 13 Nov) refuses any single stored value over 127 MiB, and a solve's
record at the app's settings is about 200 to 290 MB. So since then no solve at 45 points was kept, a single's or a
couple's, and every return visit solved again, for minutes. On Chromium 141 (4 Nov) the same records were kept and
restored in about 2 s (`results-profile.txt`). The store said only "the store failed (null)". It now keeps a record in
chunks of 64 MB and names the browser's own reason when it cannot (`cache-chunks.test.mjs`: 15 checks, 12 of them failing
on the code before; `results-cache-chunks.txt`). Measured in the browser at the app's settings (`results-couple-timing.txt`:
S069, four workers, stage C's four runs beside it at the lowest priority): both of the couple's tables were kept, and after
a reload they were restored in 8.2 s, where the run before the fix solved them again in 176.4 s.

**How it was tested.** Each part has its own test, each shown failing on planted faults:
- the couple assembled from two ordinary solves is, bit for bit, the solve made whole (`couple-solve-client.test.mjs`, in
  Node, no worker); every single's solve key is as it was before D5 (a pinned digest of the library's 210 singles' keys);
- the client's handling of a couple (`couple-split.test.mjs`, the page's client with stand-in workers): both tables on the
  same parts, the paths and skips shared out, a stored couple restored split, a What if variant neither stored nor restored;
- the couple's figures, this year's actions per person, and the wording for a household (`couple-figures`,
  `couple-actions`, `couple-words`);
- the limits per person (`couple-limits.test.mjs`), including a single that carries a partner's ceiling (from a couple's
  plan made a single's), which now locks, keys and solves as without it;
- in the browser at the harness's light settings (`solver-planner-ui.cjs`): with couples on, the couple solves in the page
  with every figure equal to the reference worked out from the source, a reload restores both tables with the figures the
  same again, each person has their own limits, and a 90/10 couple is shown the card with its reason; with couples off,
  the card says so and You's limits card is as before; every planted fault fails its own check.

**Speed (D5.6).** A couple's path costs about 150 to 200 ms at the app's settings (`results-couples-sizing-d4b.txt`: 149.5 to
204.6 ms), against about 37 to 62 ms for a single's (`results-path-scaling.txt`, `results-perf-step.txt`). Its figures
were running in one worker. Now both people's tables are held by every worker the solve used, and the couple's paths and
this year's skips are shared out among them, as a single's are. A solve restored from the store is now shared out too
(before, a returning visitor's figures ran in one worker, a single's as well). Nothing a figure shows changes: the shared
runs are joined in path order and are the whole run's, bit for bit (`restore-split.test.mjs`, `couple-split.test.mjs`).
In the browser at the app's settings (`results-couple-timing.txt`, the same run): a couple's headline path took 48.7 ms with
the four workers sharing the paths, against 90.2 ms in one worker, so 1.85 times as fast; after a reload the headline's 2,000
paths took 97.9 s against 97.5 s fresh, so a restored couple shares its paths as a fresh one does; this year's five skips on
1,000 paths took about 210 s either way. A single's paths ran 3.82 times as fast on four threads in Node with nothing beside
them (`results-path-scaling.txt`); the couple's run had stage C beside it, and why the couple gains less is not shown.

**The limits per person.** Each person has their own ceiling on the riskiest tier for their pension and ISA, shown only
where the couple is solved. The pension age and the lump sum stay the household's, because the engine keeps one pension
access age and one lump-sum choice for a household; the card says so. Changing only the partner's ceiling leaves the first
person's table as it was, so it is restored rather than solved again (`couple-limits.test.mjs` check 4, the keys).

**The reviewer.** The first review failed D5 on three counts, each fixed once (D81 (F)) and now with the reviewer again
(`reviews/2026-11-14-d5.md`): with couples off a couple's limits card had changed; a single carrying a partner's ceiling had
the tier above (the riskier tier the solver may open) switched off; and the one measurement at the app's settings restored
neither table, which was the browser's limit above.

**Found on the way and fixed.** Under a split dial position, every worker carried the base's reference counts, so their
sum was the number of workers times the true count. It was a diagnostic only; no figure moved.

**Known limits, each said on the page where it shows, or in PART-D.md.**
- The age card and the limits card search the first person's retirement age.
- Above the dial's first position the store keeps two solves, so a couple restores in part and holds more memory than a
  single; a returning single at a dial position above the first now holds its base in every worker (more than before, not
  measured).
- A couple's joint move takes no tie rule above the estate cap (open for you in `DECISIONS-PENDING.md`).
- Some parts of the split restore are exercised only in the browser, and some by no test (PART-D.md lists them).

**Next.** The reviewer on these fixes; then B1's gate on the third batch, which carries D5 with the switch off and the
store's fix, then the merge under D92. Couples on (D6) is yours, after stage C reads.

The screenshots (light settings, so the figures are quick and coarse; they show the screens, not a plan's numbers): Your plan,
You's limits, What if, Details, and Your plan on a phone.
