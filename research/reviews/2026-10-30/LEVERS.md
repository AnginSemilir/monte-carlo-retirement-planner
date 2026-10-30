# Better decisions, or more levers? (EXPLORATORY), 30 Oct

The maintainer's questions (30 Oct 07:46 and 07:52): "Does the latest solver beat a fixed policy when there's no
flexibility in spending at all?", and, behind it, "is the solver really better at making decisions, or does it just have
more levers available?"

Phase 4 measured the candidate 10.7 points of survival above the app's rules (`research/solver/results-phase4.txt`). But
the two sides had different levers. The app follows fixed rules: a drawdown order, guardrails on spending, and the plan's
investments, which it never changes. The solver chooses each year's spending level, which pots to draw from and how much
to move the investments. A gain can come from deciding better with the same levers, or from having more of them. Nothing
in the project measured the solver against a fixed policy with spending fixed on both sides: the honouring checks (K1, 23
Sep) blocked cuts and raises on an older solver, with no tier changes and no comparison.

## The test

**Two decision-makers, given the same levers in turn** (`levers/levers-audit.mjs`):

| | The app's fixed rules | The solver |
|---|---|---|
| Fixed spending, the plan's investments | FIXAPP | FIXHOLD |
| Fixed spending, the investments a lever | FIXAPPT | FIXCAND |
| Flexible spending, the plan's investments | APP | FLEXHOLD |
| Flexible spending, the investments a lever | APPT | CAND |

**The levers:**
- **The draws (which pot pays):** every arm. The app follows the fixed order its own policy search picks (Phase 4's arm A,
  without the tournament), searched again with its guardrails off for the fixed-spending rows. The solver chooses each year.
- **The spending:**
  - Fixed: the app's guardrails off; the solver's `blockTrim` and `raiseCap: 1`, the product's own switches, so its menu
    has one level, the target.
  - Flexible: the app's guardrails as Phase 4's arm A; the solver's own menu, raises to 110%.
  - Every fixed-spending year is checked at the target; the harness exits otherwise.
- **The investments:**
  - The plan's own: the app cannot change them. The solver has the user's consent to change risk withdrawn
    (`riskConsent: false`, the product's switch), so its menu holds only the plan's own tier pair.
  - A lever: the solver's joint tier menu, the plan's own tier and up to three safer, pension and ISA together. The app
    uses it statically: the one joint tier, for the whole plan, with the best survival on 1,000 paths of seed 7001 (never
    scored), on its row's pick.
  - The app's policy is not searched again at each tier. A search at another tier can pick another policy, which moves
    where a windfall is staged (seen in the smoke run on S090), a second lever, and the tier alone is the one under test.
- **Each solver arm** runs on the app's pick from its row, as Phase 4's solver arms ran on arm A's.

**The code:** the agent's latest, 1b39400 (30 Oct; D45), code hash 88a2c9eee295; its candidate d71f65ae871e is Phase 4's
with the failure-year fix (D43). The solver is at 45 wealth points and the estate weight 0.02.

**Households and paths:** the eight of the spending-curve review (S090, S030, S328F, S188, S304F, S368, S050, S340F), all
single; seed 7002, 1,000 paths a unit. The engine scores every arm; runPath is held to E.runTrial on the first 100 paths,
and runPolicy runs beside the engine on the first 200.

**Declared before the runs:**
- a smoke run of all eight arms on S090 at 6 points and 60 paths, whose figures are not used;
- the solver's returns are the app's (both contexts' account returns printed the same on S090).

**The read** (`levers/levers-reduce.mjs`, fair test first: one code, candidate, seed and path count; each household's
arms on one inputs hash, the static tier's arms hashed with the plan's own tiers restored; one minimum pot):
- **the decisions on the same levers,** across each row: FIXHOLD less FIXAPP, FIXCAND less FIXAPPT, FLEXHOLD less APP,
  CAND less APPT;
- **what each lever adds** in each decision-maker's hands;
- **the first question,** FIXCAND less FIXAPP, and Phase 4's, CAND less APP;
- survival paired by path, always beside the spending delivered; and the equity share the solver holds.

## The prediction, written before the runs

- **The draws alone** (FIXHOLD less FIXAPP): 0 to +1.5 points. A year-by-year draw order mostly saves tax, which moves
  survival little.
- **The draws and the investments** (FIXCAND less FIXAPPT): +1 to +4 points. De-risking that follows the markets beats the
  best single tier.
- **The spending and the draws** (FLEXHOLD less APP): +3 to +8 points, with 2% to 6% more spending.
- **All three** (CAND less APPT): +5 to +10 points, with more spending.
- **The levers:**
  - the investments, used statically by the app: 0 to +2;
  - the investments, used by the solver: +1 to +5;
  - the spending, used by the app's guardrails: +8 to +15, with less spending;
  - the spending, used by the solver: +10 to +20, with no less spending.
- **The first question** (FIXCAND less FIXAPP): +1 to +5 points. **Phase 4's** (CAND less APP): +8 to +12.

## The rule, fixed before the runs

Each same-levers comparison reads one of four ways:
- **BETTER:** the pooled survival interval is above zero, the spending's 95% lower end is above -1%, and no household is
  behind by more than a point beyond 2 se;
- **MORE SURVIVAL, LESS SPENDING:** survival better, but spending lower;
- **WORSE:** the interval is below zero;
- **NOT SHOWN:** otherwise.

The solver decides better if the comparisons read BETTER. Where only the lever comparisons are large, it is the levers.

## The results

Every figure here is printed by `levers/levers-reduce.mjs` over the 64 units (`levers/results-levers.txt`). Each
household counts once; the intervals are 95%, by path.

**The checks:**
- **Fair:** one code (88a2c9eee295), candidate d71f65ae871e, seed 7002, 1,000 paths a unit, one minimum pot; every
  fixed-spending year at the target.
- **The engine and the policy agree:** runPolicy beside the engine differs on 0 of 6,400 paths.
- **One declared exception: S050.** Its fixed-policy pick ("Sequential, lump sum") hashes differently from its other arms,
  and the read refused it until the reason was shown (`levers/inputs-check.mjs`; `levers/results-inputs-check.txt`, ALL
  PASS):
  - the difference is the app's own lump sum and the MPAA age that follows from it: set back, the hash is every other arm's;
  - the MPAA cannot bind: the household's largest year's pension contribution is £3,600, under the £10,000 cap;
  - a planted £100 change in the target is seen.

**The decisions, on the same levers** (the solver less the app's rules, same row):

| Levers both sides have | Survival | 95% | Spending | Households ahead (beyond 2 se) | Verdict |
|---|---|---|---|---|---|
| The draws alone (fixed spending, the plan's investments) | +3.20 | +2.79 to +3.61 | +0.21% | 8 of 8 | BETTER |
| The draws and the investments (fixed spending) | +7.51 | +6.92 to +8.10 | +0.52% | 8 of 8 | BETTER |
| The spending and the draws (the plan's investments) | +6.20 | +5.66 to +6.74 | +4.07% | 8 of 8 | BETTER |
| All three | +7.80 | +7.22 to +8.38 | +5.90% | 8 of 8 | BETTER |

No household is behind in any row.

**What each lever adds** (survival, then spending):

| Lever | Used by the app's rules | Used by the solver |
|---|---|---|
| The investments, spending fixed | +3.24, +1.37% (one tier for the whole plan) | +7.55, +1.69% |
| The investments, spending flexible | +3.03, -0.02% | +4.63, +1.72% |
| The spending, the plan's investments | +12.15, -0.03% (the guardrails) | +15.15, +3.81% |
| The spending, investments a lever | +11.94, -1.39% | +12.23, +3.85% |

**The first question, and Phase 4's** (the solver with all its levers against the app as it is):
- **No flexibility in spending** (FIXCAND less FIXAPP): **+10.75 points** (+10.07 to +11.43), spending +1.90%, ahead on all
  eight (+8.7 to +13.3).
- **Flexible spending** (CAND less APP, Phase 4's comparison): +10.83 points (+10.15 to +11.50), spending +5.87%.

**Where the gain comes from.** Each total splits into two steps that add up exactly:
- No flexibility in spending: +10.75 = +3.24 (the investment lever, used as one tier for the whole plan) + 7.51 (the
  solver's better use of the same draws and investments).
- Phase 4's comparison: +10.83 = +3.03 (the investment lever, the same way) + 7.80 (the solver's better use of all three
  levers).

So about seven tenths of the solver's lead is better decisions. About three tenths is a lever the app lacks but could use
statically.

**Against the prediction:** 6 of the 13 checks held. The solver did better than predicted wherever spending was fixed:
- the draws alone gave +3.2 (predicted 0 to +1.5);
- the draws and the investments +7.5 (predicted +1 to +4);
- the investments in the solver's hands +7.6 (predicted +1 to +5);
- the first question +10.8 (predicted +1 to +5).

The app's single best tier also did better than predicted, +3.2 and +3.0 (predicted 0 to +2). The spending rows and
Phase 4's figure held.

**What it means:**
- **The solver is better at deciding, not only better equipped.** Given exactly the app's levers, it survives more on every
  household, with as much spending or more. Its edge is acting on the state each year: which pot to draw, how much risk to
  hold, how much to spend.
- **With no flexibility in spending, it still adds 10.8 points,** as much as with flexibility. Without the spending lever,
  more of the work moves to the investments: they add 7.6 points in its hands with spending fixed, 4.6 with it flexible.
- **The app could close about 3 points by itself,** by choosing one investment tier for the whole plan. The rest needs
  decisions that follow the markets.

**What this does not show:**
- Eight households and one seed, all single.
- "The app's rules" are its own policy search and one tier chosen in advance, not every fixed rule there could be. A
  de-risking glide path, say, was not tried.
- The static tier is chosen on 1,000 search paths, so its choice carries their noise; that is part of choosing a rule in
  advance.
