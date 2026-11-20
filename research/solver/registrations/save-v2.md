# Registration: the savings split against the candidate as it stands, for working singles who save (D130 (7); SAVE-V2.md)

DRAFT (19 Nov, filled 20 Nov), written while step 8 ran, as D130 (7) orders. Not run. Its design is `SAVE-V2.md`. Its
panel's source and the three choices in it were ruled on 19 Nov (D133). The panel is landed and the pilot and its sizing
are in (20 Nov). Its fields in `<...>` wait on the seed's reservation and on its design review; the launcher's check
refuses it until each is filled. The pilot and the sizing are taken again on the final files after the design review, as
step 8's were. Then the maintainer before launch.
Read once, by `research/solver/reduce-save-v2.mjs`, after its gate. Its machinery (the panel `save-v2-panel.mjs`, the audit
`audit-save-v2.mjs`, the read, the sizing `size-save-v2.mjs` and the batch `batch-save-v2.sh`) is built, each script's
`--planted` passing. Run so far, all EXPLORATORY: the landing (seed 7005), the pilot (seed 7002) and the preflight.
Launched only as
`PREDICTION=research/solver/registrations/save-v2.md research/solver/run-from-snapshot.sh bash research/solver/batch-save-v2.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run.

- **Question:** Does the candidate with the savings split give working singles who save into a pension or an ISA better outcomes than the candidate as it stands (survival first, then spending), with no harm to any household?
  - The savings split (`SAVINGS-SPLIT.md`; `saveSplit: true`, a research option, off): in each working year the solver
    puts the year's saving pension first, ISA first, or as the plan has it.
  - The factorial behind it (`results-save.txt`; EXPLORATORY, seed 7002; `reports/2026-11-19-save-read.md`) read A GAIN
    AND A HARM:
    - survival `+0.398` points (se `0.0270`, by path `0.0345`), up on 14 households beyond noise and down on none;
    - spending up on 23 households and down on S308F (`-0.250%` of its lifetime spending).
  - Two things it left open, which this test closes:
    - It ran on anchors, where the split's shortlists are drawn from a menu three times as long as the candidate's. That
      approximation is unmeasured.
    - The engine's ISA defect, fixed since (675090f5, D130 (1)), reached one household of it (S310F), in both arms.
- **Arms:** CANDD 3a344e9f7ec6, CANDS 3f7b0397f544 (`audit-save-v2.mjs` `configOf`, as `candidate.mjs` `hashOf` hashes the candidate), each scored by the engine on the same paths of the held-out seed, at 45 points and the estate weight 0.02
  - **CANDD:** the candidate 17ff82379838 on the whole menu (its `coarse` key taken out).
  - **CANDS:** the same with `saveSplit: true`.
  - **Beside, deciding nothing in the rule (D133 (3)):** CANDDA 17ff82379838 (the candidate itself) and CANDSA bf1cac401c13, the same two on
    anchors, the menu the candidate ships with (`coarseWhereFits`), on each household's first `4,000` paths. A household
    flagged there by D34's rule comes back to the maintainer before any change of default.
- **Households:** the panel `save-v2-panel.json` (`results-save-v2-panel.txt`): 40 single households who work and save into a pension or an ISA, from the 63 no run has taken the split on (D133 (1) and (2); `results-save-v2-pool.txt`)
  - Landed 20 Nov on code 71fb4271c681, none passed over: the younger cohort's 10 (S300F, S302F, S312F, S318F, S324F,
    S330F, S336F, S342F, S348F, S354F) and the library's first 30 (S180, S182, S186, S192, S196, S198, S202, S208, S212,
    S214, S218, S222, S226, S230, S234, S238, S242, S248, S250, S254, S258, S264, S266, S270, S276, S280, S282, S286,
    S292, S296). Arm A from 84.0% to 86.0%. Every household has working years to choose: 15 for the younger cohort, 5 or
    15 for the library's.
  - Untouched: 2 (S254 and S266). The scan of the day was taken with this study's own records left out
    (`save-v2-orders.json`: 330 ids, hash 6df97f992c27; the whole scan 335, hash 1037d4931dbc).
  - The pool leaves out the factorial's 27 and `save-split.test.mjs`'s households. It is held out for this question, not
    from every run: 58 of the 63 were touched by other runs (S224, S248 and S330 helped tune the candidate both arms share),
    and only 5 are untouched. A panel held out from every run cannot be drawn from the library (`SAVE-V2.md`).
  - The younger cohort's 10 (44 or under, retiring at 52), walked first; 30 of the library cohort's 53 (older than 44,
    retiring at their plan's age) taken evenly in library order, the rest as reserves, an older household filling any
    younger place that does not land.
  - Each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (Phase 4's procedure, D35). Each household's status
    (untouched, or touched by another run) is recorded in the panel.
- **Seed:** 7025 `<reserved in check-prediction.mjs for save-v2*.md by the maintainer's unlock, named in its commit>`
- **Paths:** 16,000 for every household on the whole menu, and the anchors pair on each household's first 4,000 (`save-v2-paths.json`; `results-save-v2-sizing.txt`)
  - D34's size for each household's comparison at the pilot's discordance (its upper 95% bound, never below `D_MIN`) is
    the floor of 16,000 on all four pilot households. The pilot is seed 7002, 1,000 paths, the younger cohort's places 0
    and 5 and the library's 0 and 15 (`audit-save-v2.mjs` `PILOT_PLACES`); that bound is at most 2.59%.
  - At 16,000 a true 1-point loss reads as harm at least 90% of the time up to a discordance of 10.50%. The cap is D61's
    19,000. A comparison whose 1-point rate at its realised discordance falls below 0.90 is read there and named with its
    rate (D34 (4)).
  - Provisional until the pilot runs again on the final files.
- **Primary metric:** survival scored by the engine (`runPath`, held to `E.runTrial` on the first 200 paths of each arm), paired on the same paths of the held-out seed.
  - Recorded beside it on every path: lifetime spending delivered, the pot left and lifetime tax.
  - Each household's working-year choices (D130 (7)), on `runPolicy`'s first 1,000 paths beside the engine: at each
    working-year decision, the save choice (the plan's, pension first, ISA first) and each wrapper's tier.
  - The pots at the top of the first retired year.
- **Decision rule:** CANDS against CANDD over the panel; it passes if all three hold
  1. **no harm:** no household flagged by D34's harm rule, compared in whole paths (`reduce-share-rules.mjs harmExact`);
  2. **a gain:** the pooled survival change, its 95% interval by path (`reduce-phase4.mjs survivalItem`), lower end
     above 0;
  3. **spending:** no household's lifetime spending delivered lower beyond noise (a seeded sign-flip test of the mean,
     Holm at 5%, as the factorial read it) by more than `0.1%` (D133 (4)), and the pooled change's point
     estimate (the households weighted equally, each in percent of its own CANDD mean) not below -0.05%.
  - S308F's harm in the factorial, `-0.250%`, would fail part 3: a household whose spending the split cuts is a harm,
    however the panel gains.
- **Outcomes:** PASS makes the split part of the candidate for singles who work and save, a change of default; FAIL closes it; a flagged household stops the change
  - **PASS:** `saveSplit: true` joins the candidate for singles who work and save, in the commit of the D-line naming
    this run, with the reviewer on the change of default before it is committed, to `main` on B1's gate.
  - **FAIL:** the split stays off and is closed as measured.
  - **A household flagged:** no change of default, whatever the pooled gain; the household goes to investigation (D34 (3)).
  - A couple's plan does not take the split (`SAVINGS-SPLIT.md` scope); a test of it for couples would be its own.
- **Budget:** 45.9 core-hours over the 40 households and the longest once more for a relaunch; 12.1 hours on four cores in the batch's order; the longest household 1.28 hours (`results-save-v2-sizing.txt`)
  - Measured from the pilot on this machine, 20 Nov 08:24 to 08:55 UK, with nothing else running but one commit's
    fast-tier check (17 s) (D21).
  - Provisional: taken again from the pilot on the final files.
- **Design review:** `<research/solver/reviews/<date>-save-v2-design.md>`
