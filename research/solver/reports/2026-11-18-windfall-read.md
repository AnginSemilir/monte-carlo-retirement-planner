# The windfall split on today's candidate, read (18 Nov): A GAIN AND A HARM in spending, and an engine defect found

EXPLORATORY, seed 7002, deciding nothing (B7 in D51; D129; `B7-FACTORIALS.md` and its two amendments, committed before it
ran; `WINDFALL-SPLIT.md`; the read whole in `results-windfall.txt`, the figures beside it in `results-windfall-beside.txt`).

## In plain words

The windfall split lets the year's move choose where that year's one-off windfall lands:
- where the plan routes it;
- the pension up to its room, then the ISA;
- the ISA alone;
- all of it taxable.

Without the split, the plan's own routing decides. This run solved Phase 4's 17 households with a dated windfall twice,
with and without the split (CANDW, CANDD), on today's candidate, on the same 4,000 simulated markets. Every household took
the candidate's own menu, the solve on anchors. On anchors the split's copies are not skipped exactly outside the deposit
year, so CANDW also differs a little from CANDD in other years (`B7-FACTORIALS.md`; measured on S026).

**What it found:**
- **Survival does not move beyond noise** on the panel (`+0.012` points, se `0.0136`) or on any household after Holm.
  - S026's `+0.200` (11 paths saved, 3 lost) is within noise: one-sided p `2.87e-2`, Holm `4.88e-1`.
- **Spending moves beyond noise both ways.** By the rule's verdict (`b7-verdict.mjs`), **A GAIN AND A HARM**:
  - **the harm:** S026 spends `0.306%` less over its lifetime (se `0.0131`; Holm `8.50e-4`). Its estate is `£5,882` a path higher. Nothing here shows why: no decomposition was run;
  - **the gains:** five households spend more, each beyond noise after Holm:
    - S050 `+0.047%` (Holm `8.50e-4`);
    - S326F `+0.043%` (`8.50e-4`);
    - S314F `+0.011%` (`2.25e-3`);
    - S346F `+0.011%` (`1.12e-2`);
    - S358F `+0.008%` (`3.70e-2`).
  - **The panel's spending,** each household counted once, is down `0.010%` (`-0.0129` to `-0.0076`). That is S026's
    alone: without S026 it is `+0.0083%` (`+0.0060` to `+0.0105`). Pooled in pounds (GAIN-BUCKET's form) it is `+0.0020%`
    (`-0.0000` to `+0.0039`), not beyond noise.
- **What the split chose** in the deposit year, on 1,000 paths each: the pension then the ISA on 85% to 100% of paths on
  twelve households. On the other five it mostly chose the ISA alone (S338F, S346F, S358F) or kept most of it taxable
  (S306F, S310F).
- **The estate** is lower on the panel by `£4,242` a path (se `1,519`).
- **The checks:** the gate fair (one code and audit stamp, every household's two arms on one plan, one arm A pick and one
  menu); `runPolicy` beside the engine on 34,000 paths, none differing.

## An engine defect the reviewer found: the ISA allowance counted twice in a deposit year

The reviewer at the read found that a deposit into the ISA in a year is not counted against that year's allowance when
the same year's own flows also fill the ISA. Those flows are the cash ISA's shelter, the surplus sweep and the re-wraps.
- **Where it is.** In the engine (`research/engine.mjs`, App.jsx `stepYear` steps 1 and 1.5), a dated deposit or a
  staged drip adds to the pot, but the year's ISA subscription (`isaContribThisYear`), which the later flows' rooms read,
  counts the regular contributions alone. Those flows are the cash ISA's subscription and shelter, the surplus sweep,
  the draw-first and harvest re-wraps, and N4's CGT move (not on the candidate's menu). The exact model and the forward
  run (`model.js`, `fast.js`) do the same.
- **What the reviewer measured** (its probe, an instrumented copy of the engine, not a committed result):
  - under the app's own rules, S090 puts more than `£20,000` into its ISA in the deposit year on 42 of 200 paths, by up
    to `£8,471`;
  - under the candidate's tables at a smoke's grid, S026's split arm goes over on 48 of 200 paths and the arm without
    the split on none.
- **What it means for this read.**
  - The reviewer found that on 15 households the plan's routing puts nothing into the ISA while the split's ISA routes
    put in `£20,000`, so the defect can favour the split arm.
  - Its size at the run's settings is not measured, so the five gains are not shown to be the split's own.
- **It is a defect in the app's engine on `main`.** By CHECKLIST 7 it is fixed together with a test of its class across
  the engine, the exact model and the forward run, and sized on the library. It goes to the maintainer first: the fix
  moves the solver's code stamp and may move pinned figures in protected tests.

## What it leads to (B7)

- **The harm** (S026's spending) goes to the maintainer at once, with every effect beside it.
- **The gains** (five households' spending) go to the maintainer as a proposal for a registered test (v2), with every
  effect beside it. Nothing changes in the candidate or the app on any outcome.
- **The agent's recommendation:**
  - no v2 test of the windfall split until the defect is fixed;
  - then this factorial run again on the fixed engine and on the whole menu, where the split's copies are skipped
    exactly outside the deposit year, or on anchors with the skip's part measured beside it. On anchors alone a re-run
    would remove the defect's part of the gains but not the skip's (the reviewer's second round, MINOR 2);
  - the savings factorial held until the fix too, since its ISA route may meet the same defect (since checked, below).
- **Since checked (19 Nov, plan inputs alone): the defect reaches the savings factorial on one household, in both arms
  alike, so it runs now, as D129 orders, with that said beside its read.**
  - The savings split's own ISA route goes through the year's regular contributions, which are counted.
  - Under arm A's own pick, none of its 27 households has a dated deposit or drip into an ISA in a year with a save
    choice (`save-isa-deposits.mjs`, `results-save-isa-deposits.txt`). Only S290 would, under Windfall to ISA, and arm A
    picks Bracket Fill for it on this code.
  - One household, S310F, puts its windfall into its ISA in a retired year (plan year 18) under its own pick, Windfall
    to ISA, in both arms. With the deposit uncounted, that year's cash ISA shelter can add more on top.
  - That acts on both arms alike, except where their moves that year leave different cash to shelter. So it can part the
    arms on S310F alone, by at most a year's shelter. Its size is not measured.
  - The first form of this check said the savings factorial was "not reached". It found arm A's pick only where a save
    choice year was reached, and so missed S310F (the reviewer's second round, MINOR 1).

## Beside, for the record

- **Amendment 2's premise was wrong** (the reviewer's MINOR 5).
  - It said the windfall factorial would cost "near 19" core-hours at 8,000 paths, from the smoke's per-path times. The
    run took `5.48` core-hours at 4,000 paths, so 8,000 would have been about `9.36`, inside the design's 10. The read has
    half its designed paths.
  - Its statement "Nothing has run, and no figure has been seen" was also untrue: the smoke had printed its figures at 4
    points on 100 paths before the amendment (S026 97.0 and 97.0, S090 88.0 and 87.0). The amendment rests on the smoke's
    timings, and those figures say nothing of the read at 45 points.
  - `B7-FACTORIALS.md` is not edited: the run's stamp and the savings factorial's hash it.
- **The solve's times are not the split's cost.** The units ran arm by arm, CANDD's first, so the two arms' solves were
  timed under different loads (CANDD `0.36`, CANDW `0.33` core-hours).
- **The audit stamp leaves out the verdict's library** (`reduce-gainbucket.mjs`, `stats.mjs`; the reviewer's MINOR 7).
  Both are unchanged since before the launch, so this read is unaffected. The savings factorial's audit gains both before
  it runs.

## The reviewer at the read

FAIL, four BLOCKING and three MINORs (`reviews/2026-11-18-read-windfall.md`), answered here in one fix:
1. the engine defect, above, to the maintainer with a fix proposed;
2. S026's survival within noise, stated so;
3. the five households' gains beyond noise, stated so, with the panel's spending without S026 and pooled in pounds;
4. B7's consequence for the gains, stated beside the harm's, the agent's recommendation apart;
5. to 7. amendment 2's premise, the times, and the stamp, above.

The read's figures and outcome stand: the reviewer reproduced them byte for byte and recomputed them independently. The
reviewer's probe beside the household plan's remedy run, which was running at the time, used too much memory, and the
kernel stopped one of its units (S329F). It ran again from its saved parts after that batch's window ended.

The reviewer again (`reviews/2026-11-18-read-windfall-2.md`): PASS, two MINORs, each answered above.
1. The savings factorial is reached by the defect on S310F, in both arms alike. The check now finds arm A's pick wherever
   a deposit or drip reaches an ISA, and names S310F.
2. A re-run on the fixed engine says whether the gains are the split's own only on the whole menu, or with the skip's
   part measured beside it.
The reviewer also noted that "Where it is" left out step 1.5's drips and N4's CGT move. Neither moves anything in this
read, and both are now named.
