# The whole-score rule: a proposal for the maintainer (26 Sep)

**Why this exists.** The maintainer answered 7r's question on 26 Sep at 20:30 UK: "we keep the default settings, which is
mostly survival but some other weights". So a change is judged by the solver's default objective, realised on simulated
futures (the "whole score"), not by survival alone. The eighty-first to eighty-third reviews found that the regimen
(RULES.md section 8) has no rule for that reading:
- its test is exact McNemar on the futures two arms disagree on, a count;
- its margins are fixed once, in survival points, pinned by plan-defaults.test.mjs;
- its power rule works from the discordance rate.

The whole score is a paired mean per future, not a count. Choosing its test and margin inside each prediction, after
7t's result, is exactly what fixing the margins once was adopted to stop. The rule below has to be decided once, before
7u registers, and then used by 7u, 7q, 7o and 8f alike.

## What needs deciding

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | The test | Paired mean difference per household, over the same futures; a normal 95% interval and a one-sided p for harm (N is 1,000 or more a household, so the mean is close to normal) | The same shape as the survival rule, for a mean instead of a count |
| 2 | The margins | The regimen's own margins, reused: 0.25 points a household where the comparison arm survives 95% or more, 0.5 below; 0.1 points for the pooled mean | No new number. The whole score is in points of survival already, so the margins mean the same thing |
| 3 | The outcomes | The regimen's three, in the same form: no material harm (the interval's lower end above minus the margin); harm (Holm-adjusted p below 0.05 and a point loss of at least the margin); otherwise not yet known | One way of reading every test |
| 4 | Holm and looks | Holm across the households; the regimen's two looks (0.005, then 0.045) | Unchanged |
| 5 | Survival's role | Reported beside the whole score by the exact rule. **Not a veto**, but a survival loss of more than twice the margin on any household goes to the maintainer before any default | The answer says survival weighs most but not alone; a large survival loss still deserves a human look |
| 6 | Scope | Every household, not only those at 99.5% and over | The default objective is what the product optimises for every household. For thin plans the whole score is mostly survival anyway |
| 7 | The score's definition | The solver's own objective, as it solved, scored on each realised future by the solver's own scoring code (not a hand re-implementation): a failure charged as the solver charges it, the estate term exactly as the solver's objective values it (its death-tax and cap treatment included; 7r's cases had no death charge, so the broad panel's first use of it is checked against the solver's code), the dislike of cuts and the raise credit at the weights it solved with | The thing being judged is the objective the solver claims to optimise |
| 8 | Which weights | The research reference (lambda 0.025, the dislike of cuts; estate weight as solvePlan sets it), the weights Phase 4 would run. If K6 moves the reference before a default is decided, results are re-read at the new weights | solvePlan has no default lambda; 7r and 7t held S126's landed 0.02236 for comparability only |
| 9 | Power | From the per-future spread 7r measured (whole-score standard errors of 0.134 and 0.119 points over 3,000 futures, results-7r-failures.txt: a spread of about 7.3 and 6.5 points a future). A 95% interval narrower than a 0.25 margin needs about (1.96 x 7.3 / 0.25)^2, roughly 3,300 futures a household; a 0.1 pooled floor, about 21,000 pooled | 7u's households need about 3,000 or more futures each |

**Where it goes once decided.** The rule and its planted checks go in stats.mjs. The decided-defaults block gets a
"wholeScore" entry (its margins reuse "margins"), and plan-defaults.test.mjs pins the two together, as it pins the
margins now. plan-defaults.test.mjs is locked, so that part needs the maintainer's unlock. RULES.md section 8 gets the
rule as a new item.

**What it touches.**
- 7u, 7q and 7o read by it.
- 8f reads the bridge handling 7u carries forward by it. 8f's other arms (the dislike-of-cuts setting, five worlds)
  change the objective itself, so their reading is settled in 8f's own registration.
- 7t is read as registered, since it is already running.
- Phase 4's gate 4 compares the solver with the app, and its survival headline is the maintainer's earlier decision.
  This proposal leaves it as it is; the maintainer may choose otherwise.

**What the maintainer is asked:** agree to rows 1-9 or change them, and, to build it, "unlock enforcement" for
plan-defaults.test.mjs alone.
