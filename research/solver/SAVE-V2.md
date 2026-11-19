# The savings split, registered (v2): the design (D130 (7); DRAFT, 19 Nov)

DRAFT, written while step 8's arm read runs, and not run. D130 (7) places the test after step 8, on the fixed engine and
the whole menu, with each household's working-year choices recorded with their tiers, and has its registration drafted
while step 8 runs. Its three open choices, and the panel's source, were ruled on 19 Nov (D133), each as the agent
recommended; everything else follows a design already used (Phase 4, the couples' tests, step 8).

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
- **Beside, deciding nothing in the rule (D133 (3)):** the same two on anchors, the menu the candidate ships with
  (`coarseWhereFits`), CANDDA and CANDSA, on each household's first `4,000` paths.
  - On the whole menu the test measures the split itself; what would ship is the split on anchors.
  - A household flagged on anchors by D34's rule (at its `4,000` paths) comes back to the maintainer before any change of
    default.

## Households

- **The pool, as it stands** (`results-save-v2-pool.txt`, EXPLORATORY, no path run; the scan frozen for step 8 on 19 Nov):
  the library holds 90 single households who work and save into a pension or an ISA. 27 were the factorial's panel, 58
  were touched by other runs, and 5 are untouched: S216 (aged 55) and S254, S266, S274 and S298 (aged 45). None of the
  younger cohort is untouched. So a panel held out from every run, half of it younger, cannot be drawn.
- **Who (D133 (1)):** the 63 single savers no run has taken the split on: the factorial's 27 left out, and
  `save-split.test.mjs`'s households (S026, S090, S188, S204, S244, S260; the four that save are among the 27).
  - Held out for this question: no run has measured the split on any of them.
  - Not held out from every run: 58 of them were touched by other runs, and S224, S248 and S330 among them helped tune
    the candidate itself, which both arms share.
  - The younger cohort (44 or under, retiring at 52 before their pensions open, where the factorial put the saving ISA
    first and where S308F's harm lay): its 10 in the pool.
  - The library cohort (older than 44, retiring at their plan's age): 53 in the pool.
- **How many (D133 (2)):** 40. The younger cohort's 10, and 30 of the 53 older taken evenly in library order, the rest in
  library order as reserves. The younger cohort is walked first; an older household fills any younger place that does not
  land (Phase 4's rule).
- **Landing:** each landed so arm A survives 85 +/- 1% on `1,000` paths of seed 7005 (Phase 4's procedure, D35). The arms
  compare the candidate with itself, so the landing only places each household where survival can move both ways.

## Recorded

- each arm's survival, lifetime spending delivered, the pot left and lifetime tax on every path;
- **each household's working-year choices** (D130 (7)), on `runPolicy`'s first `1,000` paths beside the engine: at each
  working-year decision, the save choice (the plan's, pension first, ISA first) and each wrapper's tier;
- the pots at the top of the first retired year;
- each arm held to `E.runTrial` on its first `200` paths, and `runPolicy` beside the engine.

## The rule (its bar ruled, D133 (4))

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
