# The savings split, registered (v2): the design (D130 (7); DRAFT, 19 Nov)

DRAFT, written while step 8's arm read runs, and not run. D130 (7) places the test after step 8, on the fixed engine and
the whole menu, with each household's working-year choices recorded with their tiers, and has its registration drafted
while step 8 runs. The choices marked **for the maintainer** are open; everything else follows a design already used
(Phase 4, the couples' tests, step 8).

## Why

The savings factorial (`results-save.txt`; EXPLORATORY, seed 7002; Phase 4's 27 households that save into a pension or an
ISA, each on its candidate menu, anchors on all 27) read **A GAIN AND A HARM** (`reports/2026-11-19-save-read.md`):
- survival up on the panel, `+0.398` points (se `0.0270`), and on 14 households beyond noise, down on none;
- spending up on 23 households, down on S308F, `-0.250%` of its lifetime spending, one of the five younger households that
  save ISA first.

By B7 a gain is a proposal for a registered test, and D130 (7) rules it. The factorial left two things open:
- **The menu.** In the working years, on anchors, the split's shortlists are drawn from a menu three times as long as the
  candidate's (`2,400` moves against `800`). That approximation acts on the two arms differently, and is unmeasured.
- **The ISA defect**, now fixed (675090f5). It reached one household of that panel (S310F), in both arms.

## The question

Does the candidate with the savings split give working singles who save into a pension or an ISA better outcomes than the
candidate as it stands (survival first, then spending), with no harm to any household?

## Arms

Each scored by the engine on the same paths of the held-out seed, at 45 points and the estate weight `0.02`:
- **CANDD:** the candidate as it stands (17ff82379838), on the whole menu.
- **CANDS:** the same with `saveSplit: true` (`SAVINGS-SPLIT.md`), on the whole menu.
- **For the maintainer, beside or in the rule:** the same two on anchors, the menu the candidate ships with
  (`coarseWhereFits`).
  - On the whole menu the test measures the split itself.
  - What would ship is the split on anchors.
  - The agent's recommendation: the whole menu decides, as D130 (7) says. The pair on anchors runs beside on the first
    `4,000` paths, and a household harmed there by D34's rule comes back before any change of default.

## Households

- **Who:** single households who work and save into a pension or an ISA, none touched by any earlier run
  (`held-out.mjs` `touchedAll` on the day).
  - Half from the library, retiring at their plan's age.
  - Half from the younger cohort, retiring at 52 before their pensions open: where the factorial put the saving ISA first,
    and where S308F's harm lay.
- **Landing:** each landed so arm A survives 85 +/- 1% on `1,000` paths of seed 7005 (Phase 4's procedure, D35). The arms
  compare the candidate with itself, so the landing only places each household where survival can move both ways.
- **How many:** for the maintainer. Phase 4 took 40; the sizing below gives the cost.

## Recorded

- each arm's survival, lifetime spending delivered, the pot left and lifetime tax on every path;
- **each household's working-year choices** (D130 (7)), on `runPolicy`'s first `1,000` paths beside the engine: at each
  working-year decision, the save choice (the plan's, pension first, ISA first) and each wrapper's tier;
- the pots at the top of the first retired year;
- each arm held to `E.runTrial` on its first `200` paths, and `runPolicy` beside the engine.

## The rule (for the design review; its numbers for the maintainer)

CANDS against CANDD over the panel. It passes if all three hold:
1. **no harm:** no household flagged by D34's harm rule on survival, compared in whole paths (`harmExact`);
2. **a gain:** the pooled survival change, its 95% interval by path (`survivalItem`), lower end above 0;
3. **spending:** no household's lifetime spending delivered lower beyond noise (a seeded sign-flip test of the mean, Holm
   at 5%, as the factorial read it) by more than `0.1%`, and the pooled change's point estimate not below `-0.05%`.

S308F's harm in the factorial, `-0.250%`, would fail part 3. That is the point of part 3: a household whose spending the
split cuts is a harm, however the panel gains.

## Outcomes

- **PASS:** `saveSplit: true` joins the candidate for singles who work and save. That is a change of default: the
  reviewer on it before it is committed, and to `main` on B1's gate.
- **FAIL:** the split stays off and is closed as measured.
- A couple's plan does not take the split (`SAVINGS-SPLIT.md` scope). A test of it for couples would be its own.

## Seed, paths, budget

- **Seed:** a held-out seed reserved for `save-v2*.md` in `check-prediction.mjs`, by the maintainer's unlock named in its
  commit. The next free one is 7025 (7024 goes to step 8, D130 (4)).
- **Paths:** D34's sizing from a pilot on seed 7002 (two or three households, `1,000` paths).
- **Budget:** the factorial took `7.45` core-hours for 27 households at `4,000` paths on anchors. On the whole menu the
  split's solve costs about three times as much in its working years. The pilot measures it, and the budget is given before
  launch.

## Box

The design and the registration: half a day, while step 8 runs. The panel, the pilot and the sizing: half a day, when the
cores are free after step 8. Then the design review, then the maintainer before launch.
