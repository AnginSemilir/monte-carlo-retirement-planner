# Where the sweep puts cash ISA money (EXPLORATORY)

The review of 9 Nov, item 5, part 2, step 2 (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md` on
review/external-2026-10-21 at c3fea94d; D66). EXPLORATORY, seed 7002: it decides nothing by itself (CHECKLIST 1). If the
rule below passes, the option becomes the default only by the maintainer's ruling naming this run; the read goes to the
maintainer. The rule is committed before launch, with the audit, the batch and the reducer that read it.

## The question

Under a solved table the engine keeps cash at its buffer (`stepYear` 7d) and moves the rest to the taxable account, whether
or not it is cash ISA money; a cash ISA can transfer to a stocks and shares ISA without using any allowance. Does solving
and running with the cash ISA money moved to the ISA instead (`sweepCashIsaTo: 'isa'`, a research option, off) cost
survival, or leave the household poorer?

## The design

- **Code:** the working branch after items 3, 4 and 5's option (engine, model and forward run in step: `gaps-sweep`'s case
  "the sweep's cash ISA money to the ISA"), launched on frozen code through `run-from-snapshot.sh` with
  `PREDICTION="none:..."`.
- **Households:** thirteen singles.
  - The review's eight (`audit-curve.mjs` HOUSEHOLDS: S030, S050, S090, S368, S188, S304F, S328F, S340F), as Phase 4's
    panel landed them (`phase4-panel.mjs` readPanel).
  - The four singles in `phase4-orders.json`'s `touched` list with the most money in a cash ISA, by the engine's sheltered
    cash at the start (`freshState`'s `cashIsa`). Five tie at £540,000 (S058, S118, S178, S238, S418); the four by library
    order: S058, S118, S178, S238, each as the library enters it.
  - S116, the review's own measurement (89.8% to 90.4% at 45 points on a plan not re-solved for it), as the library enters
    it. The review expected S116 among the four; it is seventh, at £427,500 (S056, S116 and S176 tie there), so it is named
    here as a thirteenth household rather than displacing one of the four.
- **Arms:** GIA, the candidate's settings as the app solves (`solveForApp` at 45 points), the sweep as now; ISA, the same
  with `sweepCashIsaTo: 'isa'`. Each household solved under each arm; each solved plan run by the engine.
- **Paths:** 4,000 of seed 7002 a household, the same paths for both arms (paired).
- **Read:** survival; spending delivered (lifetime, as a share of the lifetime target); the mean pot left at the end; the
  expected path's tax (the engine's expected returns, every year's income tax and CGT).
- **Size:** 26 solves at 45 points (about 8 minutes each on one core) and 104,000 engine paths: about 4.5 core-hours.

## The decision rule

Write d for a household's survival under ISA less under GIA, in points, paired on its 4,000 paths.

1. **Pooled survival:** the mean of the thirteen households' d, with its 95% interval from the households' paired variances
   (each household's variance of d from its discordant paths, summed, over thirteen squared; the normal interval). Its lower
   end above -0.2 points.
2. **No household harmed:** no household's paired 95% interval for d (`stats.mjs` `survivalChangeU`, Newcombe's method 10)
   lies wholly below -0.5 points (its upper end below -0.5).
3. **The pot left:** the thirteen households' mean pot left at the end under ISA, averaged over households, not lower than
   under GIA (the point estimate: ISA less GIA at or above 0).

The option passes if all three hold. Beside them, deciding nothing (D69): the same pooled figures without S116, the household
the effect was found on, so the read shows whether it hangs on it.

## The outcomes

- **Passes:** to the maintainer; a ruling naming this run makes `'isa'` the default, and the pages' sweep line names the ISA.
- **Fails on survival (1 or 2):** the default stays; the report names the households and checks the review's guess first:
  the ISA's money follows the tier the solver picked for the ISA, the taxable account's its fixed mix, so the move changes
  the household's risk as well as its tax (each household's ISA tier in year 1 under each arm is printed).
- **Fails on the pot only (3):** the default stays; reported with the figures.

## The files

- `audit-isasweep.mjs`: one household a process, both arms, its log stamped, its paths' outcomes in `results/isasweep-7002/`.
- `batch-isasweep.sh`: the thirteen, through the launcher.
- `reduce-isasweep.mjs`: the stamps (`requireFairLogs`), then its gate (every household in; one code, audit, seed and count
  of paths; within a household both arms on the same plan and paths, their settings the same but `sweepCashIsaTo`; the ISA
  arm's first-year move live where the household holds cash ISA money above its buffer), then the rule. `--planted` reads
  planted units: the gate's refusals and each part of the rule each way.
