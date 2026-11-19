# Registration: the savings split against the candidate as it stands, for working singles who save (D130 (7); SAVE-V2.md)

DRAFT (19 Nov), written while step 8 runs, as D130 (7) orders. Not run. Its design is `SAVE-V2.md`. Three choices in it are
the maintainer's: the pair on anchors, the panel's size and the spending bar. Its fields in `<...>` wait on those choices,
on the panel, the pilot and the sizing (when the cores are free after step 8), on the seed's reservation and on its design
review. The launcher's check refuses it until each is filled. Then the design review, then the maintainer before launch.
Read once, by `research/solver/reduce-save-v2.mjs` (to be built), after its gate. Launched only as
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
- **Arms:** CANDD `<configOf hash>`, CANDS `<configOf hash>` (`audit-save-v2.mjs` `configOf`, to be built), each scored by the engine on the same paths of the held-out seed, at 45 points and the estate weight 0.02
  - **CANDD:** the candidate 17ff82379838 on the whole menu (its `coarse` key taken out).
  - **CANDS:** the same with `saveSplit: true`.
  - `<The maintainer's choice: the same pair on anchors (the menu that would ship), beside on the first 4,000 paths, a household harmed there by D34's rule coming back before any change of default; or not run.>`
- **Households:** `<the panel, save-v2-panel.json: N held-out single households who work and save into a pension or an ISA, half the library's retiring at their plan's age and half the younger cohort's retiring at 52; none touched (held-out.mjs touchedAll on the day); each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (Phase 4's procedure, D35); N the maintainer's choice, Phase 4 having taken 40>`
- **Seed:** 7025 `<reserved in check-prediction.mjs for save-v2*.md by the maintainer's unlock, named in its commit>`
- **Paths:** `<D34's size for each household's comparison from the pilot (seed 7002, 1,000 paths, two or three households): the floor 16,000, the cap D61's 19,000>`
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
     Holm at 5%, as the factorial read it) by more than `<0.1%: the maintainer's choice>`, and the pooled change's point
     estimate not below -0.05%.
  - S308F's harm in the factorial, `-0.250%`, would fail part 3: a household whose spending the split cuts is a harm,
    however the panel gains.
- **Outcomes:** PASS makes the split part of the candidate for singles who work and save, a change of default; FAIL closes it; a flagged household stops the change
  - **PASS:** `saveSplit: true` joins the candidate for singles who work and save, in the commit of the D-line naming
    this run, with the reviewer on the change of default before it is committed, to `main` on B1's gate.
  - **FAIL:** the split stays off and is closed as measured.
  - **A household flagged:** no change of default, whatever the pooled gain; the household goes to investigation (D34 (3)).
  - A couple's plan does not take the split (`SAVINGS-SPLIT.md` scope); a test of it for couples would be its own.
- **Budget:** `<core-hours and hours on four cores, from the pilot, measured on this machine with nothing else running (D21)>`
- **Design review:** `<research/solver/reviews/<date>-save-v2-design.md>`
