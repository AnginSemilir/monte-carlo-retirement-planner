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

## 9. The results

(to follow)
