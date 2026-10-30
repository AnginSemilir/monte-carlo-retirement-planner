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

**Against the prediction:** 8 of the 14 checks held (a lever's prediction is checked once with spending fixed and once
flexible). The solver did better than predicted wherever spending was fixed:
- the draws alone gave +3.2 (predicted 0 to +1.5);
- the draws and the investments +7.5 (predicted +1 to +4);
- the investments in the solver's hands +7.6 (predicted +1 to +5);
- the first question +10.8 (predicted +1 to +5).

The app's single best tier also did better than predicted, +3.2 and +3.0 (predicted 0 to +2). The rest held: the two
flexible-spending rows, the solver's investments with spending flexible (+4.6), both spending levers, and Phase 4's figure.

**What it means:**
- **The solver is better at deciding, not only better equipped.** Given the app's levers, it survives more on every
  household, with as much spending or more. Its edge is acting on the state each year: which pot to draw, how much risk to
  hold, how much to spend. One lever came with it unnoticed, its cash sweep, but it is small: 0.36 of the draws' 3.20
  points (the next section).
- **With no flexibility in spending, it still adds 10.8 points,** as much as with flexibility. Without the spending lever,
  more of the work moves to the investments: they add 7.6 points in its hands with spending fixed, 4.6 with it flexible.
- **The app could close about 3 points by itself,** by choosing one investment tier for the whole plan. The rest needs
  decisions that follow the markets. In the draws, a fixed cash sweep and the best fixed move from the solver's own menu
  would close 0.36 points each; choosing each year is the other 2.45 (the next section).

**What this does not show:**
- Eight households and one seed, all single.
- "The app's rules" are its own policy search and one tier chosen in advance, not every fixed rule there could be. A
  de-risking glide path, say, was not tried.
- The static tier is chosen on 1,000 search paths, so its choice carries their noise; that is part of choosing a rule in
  advance.
- The draws were not the same levers on both sides (the next section).

## What the solver does with the draws

The maintainer's next question (30 Oct 09:08): what makes the solver better outside the tiers and spending, that is, in
the draws alone (+3.20 points)?

**The replay** (`levers/draws-read.mjs`, its output `levers/results-draws.txt`): FIXAPP and FIXHOLD year by year with the
engine's own stepYear, on 500 of the units' paths, the solver solved again as its unit was. Each household's detail lines
print above its own line.
- **The paths that decide survival.** The solver saves 11 to 42 paths a household that the fixed policy loses, and loses
  0 to 5 that it keeps. On seven households the fixed policy fails at or near the plan's end (median ages 94 to 97). A year
  before, it holds less than the solver on every one: 0.4 to 1.3 years of target against 2.1 to 4.9 on six, and 7.9
  against 16.2 on S304F.
- **S368 fails in the bridge.** Its 17 saved paths run out at 57 under the fixed policy, with 44.2 years of target locked
  in the pension. A year before, outside the pension it has the ISA's 0.9 years of target and nothing in the GIA or cash;
  the solver has 0.6 in the GIA and 0.5 in cash.
- **Not tax.** By then the solver has paid more tax on five households, none on S368 (as the fixed policy), about the same
  on S188 (3.90 against 3.94 years of target), and less only on S050 (0.00 against 0.46).
- **Cash.** The solver holds half a year of target in cash in every year shown, on every household (0.50 to 0.51). The
  fixed policy holds 0.20 (S304F) to 4.88 (S050, half its pots) at the first retired year. On S368 and S340F it holds 13.29
  and 4.61 at the 11th retired year, after the pension opens: the lump sum.

**Why, from the code.**
- Under the solver's table the engine sweeps the cash each year (`research/engine.mjs`, step 7d). It keeps half a year of
  target in cash (the plan's six-month buffer) and puts the rest in the GIA at cost; a shortfall is topped up from the GIA.
- Every move on the solver's menu carries the sweep (`src/solver/solve.js`, `sweepCash: true`). So the sweep is a fixed
  rule of the solver's arm, not a choice: a lever the app's rules lack, as the investment tier is.
- The app's policy has no sweep. Cash sits until its draw order reaches it, and a full lump sum lands in cash (step 3).
- Two more differences come with the arms:
  - the app's plan runs the cost lookahead (5 years), which the engine refuses under a table;
  - the app's pick takes the full lump sum on three households (S368, S050 and S340F, "lump sum" in their labels), where
    the solver solves the household's own plan.
- So the draws alone were not the same levers on both sides, and the levers result above needs this split.

**The split, declared before its run** (`levers/draws-split.mjs`, EXPLORATORY). The app's own fixed policy is given, in
turn, what the solver's arm has besides its choice of draw, on the units' 1,000 paths, paired by path:
- A1: the lookahead off;
- A2: A1 through the engine's table hook, with the policy's own move every year (it must equal A1 on every path);
- A3: A2 with the sweep;
- A4: A3 with the household's own drawdown (no full lump sum where the pick took it); A5, the same without the sweep, for
  the other order.

What is left, FIXHOLD less A4, is the solver's own choice of draw each year: which pot pays, how much pension to draw into
the tax bands, and when to sell the taxable account up to the CGT exemption.
- **Checks:** the replay of FIXAPP equals its unit on every path, and the hook equals A1; each check is shown failing on a
  plant (FIXHOLD's unit; the draw order reversed). The read also prints how the fixed policy fails on the paths the solver
  saves.
- **Acceptance:** the checks pass. **Time box:** 45 minutes.
- **The prediction:** the lookahead adds nothing or close to it; the sweep is most of the +3.20, between +1.5 and +3.0;
  the lump sum after the sweep is within half a point either way; the solver's own choices are the rest, 0 to +1.5. If the
  sweep is most of it, the levers result's "about seven tenths is better decisions" falls, since the sweep is a fixed rule
  the app could adopt.

**The split's results** (`levers/results-draws-split.txt`). Every check passes: the replay of FIXAPP is its unit on every
path of every household, and the hook is A1; both plants are caught on every household.

| Step (pooled, each household once) | Points | 95% | Share of +3.20 |
|---|---|---|---|
| The cost lookahead off | +0.00 | +0.00 to +0.00 | 0.0% |
| The cash sweep | +0.36 | +0.09 to +0.64 | 11.3% |
| No full lump sum, after the sweep | +0.03 | -0.07 to +0.12 | 0.8% |
| The solver's own choices of draw each year | +2.81 | +2.45 to +3.17 | 87.9% |
| FIXHOLD less FIXAPP | +3.20 | +2.79 to +3.61 | |

- **The prediction missed where it mattered.** The sweep is a small part (+0.36; predicted +1.5 to +3.0), and the solver's
  own choices are most of it (+2.81; predicted 0 to +1.5). The lookahead (no household has a one-off cost) and the lump sum
  held.
- **The sweep helps only where cash is large:** S050, with 4.50 years of target in cash at the start, +3.10. It costs the
  app's policy 0.70 and 0.60 points on S090 and S030, and is within half a point either way elsewhere.
- **The solver's own choices lose no path** against the app's order with the sweep, on any household: 18 to 40 saved each,
  none lost.
- **The paths the solver saves fail late under the fixed policy.** Of 272 saved, 151 fall short only in the plan's last
  year or end below the minimum pot (a year of target; on S304F the plan's own, 9.53 years); 121 fall short earlier, 37 of
  them in the bridge (all 30 of S368's and 7 of S304F's, at a median age of 57; the pension opens at 58).
- **So the levers result stands, a little smaller.** The sweep is a lever, but a small one: in the draws alone it is 0.36
  of the 3.20 points, and the rest is the solver's own choices.

**What the solver's own choices are: declared before its run** (`levers/draws-adapt.mjs`, EXPLORATORY). Are they a better
fixed rule than the app's, or choosing each year? FIXHOLD is solved again as its unit was, and its move recorded at each
decision on the units' paths. Two fixed rules from its own menu are then played every year:
- MODAL: the move it makes most often in the retired years;
- BESTFIX: the move with the best survival on 1,000 paths of seed 7001 (a search seed, never scored), chosen in advance as
  the app's rules are.

The read: BESTFIX less A4 (what a better fixed rule from the solver's menu adds) and FIXHOLD less BESTFIX (what choosing
each year adds), paired by path. Beside it: how the moves follow the markets (after the worst third of years and after the
best third: the share drawing the pension first, harvesting, selling for the CGT exemption).
- **Checks:** the re-solve, recorder on, reproduces FIXHOLD's unit on every path (planted: against FIXAPP's unit it must
  differ); the rebuilt A4 has the split's survival.
- **Acceptance:** the checks pass. **Time box:** 45 minutes.
- **The prediction:** BESTFIX less A4 between 0 and +1.5; FIXHOLD less BESTFIX between +1.3 and +2.8, so most of the
  solver's own choices is choosing each year, not a better fixed rule; MODAL no better than BESTFIX.

**Its results** (`levers/results-draws-adapt.txt`). Every check passes: the re-solve with its recorder is FIXHOLD's unit
on every path of every household (the plant caught on every one), and the rebuilt A4 has the split's survival on every
household.

| The solver's own choices (+2.81), split (pooled, each household once) | Points | 95% | Share |
|---|---|---|---|
| Its best fixed move, chosen in advance, against the app's order | +0.36 | +0.07 to +0.65 | 12.9% |
| Choosing each year, against that move | +2.45 | +2.11 to +2.79 | 87.1% |
| Beside: its most used move, against the app's order | -0.28 | -0.58 to +0.03 | |

- **The prediction held** on all three counts.
- **No single fixed move from the solver's own menu does much better than the app's order.** The best, chosen on the
  search seed, gains on five households (+0.40 to +1.70), ties on S340F and loses on S328F (-0.40) and S368 (-0.90): 85
  paths saved and 56 lost in all.
- **Choosing each year gains on every household** (+1.30 to +3.30): 197 paths saved and 1 lost in all.
- **How it chooses.** It uses 13 to 24 of its 40 moves, and changes its move from the year before on 18% to 43% of its
  decisions. Last year's market explains only part of the changes:
  - after a good year (the best third) it draws pension into the tax bands, to the basic-rate limit or above, more often
    than after a bad one (the worst third): on S090 29% of its decisions against 12%, on S030 32% against 15%;
  - elsewhere the gap is 3 to 12 points;
  - it never sells the taxable account for the CGT exemption.

  So it responds to more than the market: to where the plan stands each year, the position its tables are built on.

**The answer to the question.** Outside the tiers and spending, the solver gains 3.20 points from the draws:
- **0.36 is the cash sweep,** a fixed rule the app could adopt. The cost lookahead and the lump sum are nothing.
- **2.81 is the solver's own choice of draw each year.** A better fixed rule from its own menu would give the app 0.36 of
  that; the other 2.45 comes from choosing again each year.
- **Tax is not the reason.** On the paths where survival is decided, the solver has paid about as much tax by then, or
  more.
- **The paths it saves are mostly lost late, by a little,** under the fixed policy. The exception is the bridge before the
  pension opens, on S368 and S304F.

**Noted, not investigated.** Over all paths the solver pays far more income tax than the fixed policy: pooled 17.50
against 2.03 years of target, with income above the basic rate 17.97 against 0.46 (`results-draws.txt`). It also draws
far more pension in all (41.04 against 10.23). On the paths that decide survival the tax paid is about the same, so the gap
is on the paths both survive, where the pots grow large. It costs the estate there, not survival. Whether that is right
for the estate (the pension's death tax, the estate weight 0.02) is the maintainer's question.
