# Registration: Phase 4, the candidate against the app's rules (CHECKLIST.md item 2; STATE.md D33 to D37)

Read once, by `research/solver/reduce-phase4.mjs`, after its gate (which refuses a unit stamped on any other version of the
files it reads: the audit's, the panel, the paths and the reducer itself). Launched only as
`PREDICTION=research/solver/registrations/phase-4.md research/solver/run-from-snapshot.sh bash research/solver/batch-phase4.sh`.

- **Question:** Does the research candidate, its tables executed by the app's own engine, keep more held-out households solvent
  than the app's own rules, without delivering less spending, and with no harm against the shipping solver (STATE.md section 1;
  D33 to D37)? This is the head-to-head before anything changes in the app (D12).
- **Arms:** CAND, the candidate `fcd8096217b7` (candidate.json), and SHIP, the product's settings `07c069b6e330` (PRODUCT_BASELINE), each against APP.
  CAND at 45 wealth points (D26), SHIP at 30; both at the estate weights 0.02 and 0.01, lambda as 7u-F's. APP, the app's rules: its
  withdrawal-policy search on the household's own plan (`select-phase4.mjs` armA with `tournament: false`, searched on seed 7001;
  D36: no tournament, so no arm changes the accounts, the balances or the contributions), guardrails on with the floor at 80% of
  target, the cost lookahead at 5 years, raises capped at 110%. Every arm runs on the same plan: the household's inputs at its
  landed target, the candidate's return assumptions (O60's blend medians) and the same minimum pot, a windfall routed as arm A's
  policy routes it (D37: on S290, S314F and S358F arm A picks Windfall to ISA, and the solver arms solve the plan under that name,
  which reaches a solve only through the routed deposit, `results-phase4-routing.txt`); the gate holds a household's five units
  to one inputs hash (each engine context but the policy's own fields). The arms differ in the decumulation rule alone: arm A's
  search also picks the drawdown strategy (the lump sum) and the harvest, where the solver arms take the plan's drawdown strategy
  and choose their own draws, harvest and spending each year, as in 7u-F (every panel plan is phased; arm A takes the full lump
  sum on 16 of 40, so A1 and A2 are also reported apart for those 16, the design re-review's minor 1). Reported beside them, not deciding: FIXBR (7q, D35), the
  candidate's table with arm A's withdrawal policy at the household's own tiers in each retired year before pension access.
- **Households:** the 40 of `phase4-panel.json` (D35, D36), named before seed 7003 is read: single households no earlier run,
  document or test had touched (`phase4-panel.mjs` touched(): every id under results/ and in the results files, in the old
  results' manifest, in research/solver/archive/ and in research/tests/, taken once into `phase4-orders.json` before landing), 20
  from the library older than 44 (taken evenly in library order over the re-frozen pool, a household that does not land passed
  over for the next reserve) and 20 aged 44 or under retiring at 52; each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005.
  The library: S026, S030, S040, S050, S062, S074, S090, S096, S108, S132, S164, S188, S204, S228, S244, S260, S272, S290, S368, S384 (every one landed; 17 reserves unused). Retiring at 52: S304F, S306F, S308F, S310F, S314F, S316F, S320F, S322F, S326F, S328F, S332F, S334F, S338F, S340F, S344F, S346F, S350F, S352F, S356F, S358F. Landed 27 Oct 07:06 UK: arm A from 84.1% to 86.0%. The library 20 were re-spaced over the re-frozen pool rather than topped up:
  beyond the four the wider scan found touched (S140, S226 and S280, and S024, which D36's Bed & SIPP test now uses), six untouched
  households of the first panel became reserves (S080, S098, S110, S170, S200, S298); the rule is mechanical, fixed before any
  result on this panel, and the maintainer kept it so (27 Oct, D37); the reviewer read the discarded first pilot (seed 7002) to
  check it and found the six no worse for the candidate there. Used before on the app's side only (not by the solver research; it could only favour arm A): S030, S062 and S074 in research/policy-study/confirmed-results.json; the library plans behind S306F and S358F there too, and behind S308F in policy-study/lookahead-study.mjs; and every panel id in results-p4-select.txt, the old selection's arm A band (arm A alone, which the scan leaves out by design).
- **Seed:** 7003, reserved for Phase 4 and never read before, used once; 7018 (Phase 4's replication, registered with 7u-F) on
  4,000 paths a unit, its paths 200 to 4,199. A smoke run of the audit (26 Oct, about 20:43 to 21:08 UK, before 864b0f3; 8
  wealth points, arm A with the tournament) scored 7018's first 200 paths on all ten units of S024 and S304F; the
  replication leaves those paths out, and every run but the registered one now stands in for 7018 on 99001. The landing read
  7001 and 7005, the pilot 7002; none shares a path with 7003 or 7018 (path i of a seed draws from seed + 7919 i, and no two of
  these seeds differ by a multiple of 7919).
- **Paths:** per household, by D34 (the maintainer's harm rule), from the pilot's discordances (`results-phase4-sizing.txt`,
  `phase4-paths.json`): the smallest multiple of 1,000 from 16,000 at which every comparison of the household reads a true
  1-point loss as harm at least 90% of the time and a true quarter-point loss at most 5% of the time, at the upper 95% bound
  (Clopper-Pearson) of the pilot's discordance; the rates are exact binomial sums under the trinomial model, held to a
  convolution and checked by simulation (`size-phase4.mjs`, its check printed in the sizing file). The table: the last section below (753000 paths a unit summed over the households, 18825 on average, 27 of 40 above 16,000).
- **Primary metric:** survival scored by the engine (`runPath`: the engine's own year, path by path, held to `E.runTrial` on the
  first 200 paths of every run): a path survives when every year's spending at the floor is met and the minimum pot is held at the
  end. Paired on the same paths of 7003 across the arms. Spending delivered over every year (what was spent less what could not
  be met) beside it: no survival figure is reported without the spending delivered beside it. On the solver arms `runPolicy`
  runs beside the engine on the first 2,000 paths (7u-F's fidelity check); a path the two score differently is a fidelity gap,
  reported.
- **Decision rule:** at each estate weight, on the first 16,000 paths of every household, each path's change averaged over the 40
  households and its 95% interval taken from the spread across paths:
  A1, survival CAND less APP, passes when the lower end is above 0;
  A2, spending delivered over every year, CAND less APP as a share of the household's mean under APP, passes when the lower end
  is above -1%;
  S1, survival CAND less SHIP, passes when the lower end is above -0.1 points (the candidate changed after 7u-F, D29 and D30).
  D34's flags, per household and weight, on all its paths: harm against APP and against SHIP when the observed loss is above the
  household's registered threshold (no correction across households); spending when a household delivers more than 5% less
  than under APP (reported, not blocking: the maintainer's call of 27 Oct, D37).
- **Outcomes:** PASS (A1, A2 and S1 at both weights): the candidate goes to the maintainer, who decides whether it ships behind
  Part C's switch. NOT PASSED: the app's defaults stay (D12), the write-up names each failed item and by how much, and nothing
  is tuned until it passes. A harm or spending flag sends that household to investigation by V4's measures, as in 7u-F, whatever
  the outcome; on its own it does not block the release (D34 (3), D37). Reported, not deciding: the whole score on every path;
  A1 and A2 apart where arm A takes the full lump sum;
  spending delivered CAND less SHIP, pooled and per household; S1 over the library cohort, over the households whose reader
  reads no bridge year, and the count of households with an observed loss against SHIP; the estate, unmet spending, tax, the
  years below target, the end wealth's median and unlucky tenth; FIXBR less CAND (7q), survival and spending; the three
  perturbed worlds (returns a point lower, which carries D20 (9)'s sensitivity to the returns; shocks a quarter larger; a
  fatter left tail) and the historical sequences from 1928 (D35), survival and spending; the replication on 7018; each flag's
  discordance as realised and D34's rates at it; the fidelity gaps; the solve times and the hosts.
- **Budget:** 111.4 core-hours, about 27.9 hours on four cores (the solves 17.5, the engine 88.1; by arm CAND 83.4, SHIP 27.9, APP 0.1), the longest unit 1.72 hours (S356F CAND/0.02);
  measured (D21) from the pilot's own units on this machine (Intel(R) Xeon(R) Processor @ 2.80GHz), nothing else running, four at a time; with the harness's 12-hour
  limit on a task, two relaunches under `RESUME=1`. Approved by the maintainer on 27 Oct (D37), at 112.0 core-hours before the
  three re-routed households were re-piloted.
- **Design review:** research/solver/reviews/2026-10-27-phase4-design-2.md, PASS (after the FAIL of `reviews/2026-10-27-phase4-design.md`,
  D36); its five minor findings folded in before launch (`results-phase4-audit-test.txt` for its minor 4).

## The sizing (D34 (4))

Each household's paths and, per comparison, the threshold t in points (harm when the observed loss is above it) with the chance of a
harm reading at a true loss of 0.25 and of 1 point, exact (`results-phase4-sizing.txt`, `phase4-paths.json`):

| household | paths | vs APP at 0.02 | vs APP at 0.01 | vs SHIP at 0.02 | vs SHIP at 0.01 |
|---|---|---|---|---|---|
| S026 | 20000 | 0.655 (0.050, 0.917) | 0.660 (0.050, 0.911) | 0.380 (0.046, 1.000) | 0.375 (0.048, 1.000) |
| S030 | 16000 | 0.650 (0.049, 0.922) | 0.650 (0.048, 0.924) | 0.438 (0.045, 1.000) | 0.431 (0.045, 1.000) |
| S040 | 20000 | 0.670 (0.048, 0.901) | 0.665 (0.050, 0.905) | 0.420 (0.045, 1.000) | 0.415 (0.045, 1.000) |
| S050 | 25000 | 0.668 (0.049, 0.903) | 0.668 (0.050, 0.902) | 0.356 (0.048, 1.000) | 0.356 (0.045, 1.000) |
| S062 | 22000 | 0.664 (0.049, 0.908) | 0.664 (0.049, 0.909) | 0.368 (0.050, 1.000) | 0.368 (0.045, 1.000) |
| S074 | 22000 | 0.659 (0.049, 0.913) | 0.664 (0.048, 0.909) | 0.364 (0.044, 1.000) | 0.364 (0.044, 1.000) |
| S090 | 16000 | 0.637 (0.050, 0.935) | 0.637 (0.049, 0.936) | 0.406 (0.045, 1.000) | 0.412 (0.049, 1.000) |
| S096 | 24000 | 0.662 (0.049, 0.909) | 0.662 (0.050, 0.909) | 0.396 (0.048, 1.000) | 0.400 (0.046, 1.000) |
| S108 | 22000 | 0.664 (0.050, 0.908) | 0.664 (0.050, 0.907) | 0.391 (0.050, 1.000) | 0.386 (0.049, 1.000) |
| S132 | 21000 | 0.667 (0.049, 0.905) | 0.667 (0.049, 0.905) | 0.367 (0.043, 1.000) | 0.367 (0.043, 1.000) |
| S164 | 18000 | 0.656 (0.049, 0.917) | 0.661 (0.049, 0.911) | 0.411 (0.050, 1.000) | 0.433 (0.046, 1.000) |
| S188 | 25000 | 0.664 (0.049, 0.909) | 0.660 (0.050, 0.912) | 0.384 (0.048, 1.000) | 0.388 (0.049, 1.000) |
| S204 | 21000 | 0.662 (0.049, 0.910) | 0.662 (0.050, 0.909) | 0.371 (0.045, 1.000) | 0.367 (0.043, 1.000) |
| S228 | 21000 | 0.662 (0.049, 0.910) | 0.667 (0.048, 0.905) | 0.367 (0.043, 1.000) | 0.367 (0.043, 1.000) |
| S244 | 19000 | 0.663 (0.050, 0.908) | 0.663 (0.050, 0.907) | 0.405 (0.046, 1.000) | 0.411 (0.049, 1.000) |
| S260 | 16000 | 0.662 (0.050, 0.908) | 0.669 (0.049, 0.902) | 0.381 (0.046, 1.000) | 0.381 (0.046, 1.000) |
| S272 | 16000 | 0.644 (0.049, 0.929) | 0.650 (0.049, 0.923) | 0.419 (0.049, 1.000) | 0.425 (0.046, 1.000) |
| S290 | 19000 | 0.663 (0.049, 0.908) | 0.663 (0.050, 0.908) | 0.384 (0.045, 1.000) | 0.400 (0.045, 1.000) |
| S368 | 26000 | 0.669 (0.049, 0.903) | 0.669 (0.049, 0.903) | 0.365 (0.045, 1.000) | 0.365 (0.045, 1.000) |
| S384 | 23000 | 0.657 (0.050, 0.916) | 0.665 (0.049, 0.907) | 0.361 (0.044, 1.000) | 0.361 (0.044, 1.000) |
| S304F | 19000 | 0.658 (0.049, 0.914) | 0.658 (0.049, 0.915) | 0.495 (0.047, 1.000) | 0.489 (0.049, 1.000) |
| S306F | 16000 | 0.662 (0.048, 0.910) | 0.656 (0.048, 0.917) | 0.481 (0.046, 1.000) | 0.475 (0.048, 1.000) |
| S308F | 20000 | 0.665 (0.049, 0.906) | 0.665 (0.048, 0.907) | 0.480 (0.049, 1.000) | 0.475 (0.049, 1.000) |
| S310F | 17000 | 0.665 (0.049, 0.906) | 0.671 (0.048, 0.900) | 0.465 (0.049, 1.000) | 0.471 (0.046, 1.000) |
| S314F | 17000 | 0.665 (0.049, 0.907) | 0.659 (0.050, 0.912) | 0.382 (0.047, 1.000) | 0.382 (0.047, 1.000) |
| S316F | 16000 | 0.662 (0.049, 0.908) | 0.662 (0.048, 0.909) | 0.381 (0.046, 1.000) | 0.381 (0.046, 1.000) |
| S320F | 16000 | 0.662 (0.048, 0.910) | 0.662 (0.048, 0.909) | 0.381 (0.046, 1.000) | 0.388 (0.046, 1.000) |
| S322F | 16000 | 0.662 (0.048, 0.911) | 0.656 (0.049, 0.916) | 0.381 (0.046, 1.000) | 0.381 (0.046, 1.000) |
| S326F | 16000 | 0.644 (0.049, 0.929) | 0.650 (0.048, 0.925) | 0.412 (0.049, 1.000) | 0.431 (0.045, 1.000) |
| S328F | 16000 | 0.644 (0.049, 0.930) | 0.650 (0.048, 0.924) | 0.394 (0.048, 1.000) | 0.419 (0.046, 1.000) |
| S332F | 16000 | 0.625 (0.049, 0.948) | 0.625 (0.050, 0.948) | 0.419 (0.046, 1.000) | 0.419 (0.049, 1.000) |
| S334F | 16000 | 0.650 (0.048, 0.924) | 0.650 (0.049, 0.924) | 0.412 (0.046, 1.000) | 0.412 (0.049, 1.000) |
| S338F | 19000 | 0.658 (0.049, 0.914) | 0.658 (0.048, 0.915) | 0.411 (0.049, 1.000) | 0.411 (0.049, 1.000) |
| S340F | 17000 | 0.659 (0.049, 0.913) | 0.671 (0.048, 0.901) | 0.376 (0.047, 1.000) | 0.400 (0.047, 1.000) |
| S344F | 16000 | 0.662 (0.048, 0.909) | 0.669 (0.048, 0.902) | 0.388 (0.046, 1.000) | 0.400 (0.045, 1.000) |
| S346F | 17000 | 0.665 (0.048, 0.907) | 0.665 (0.049, 0.906) | 0.424 (0.048, 1.000) | 0.441 (0.048, 1.000) |
| S350F | 18000 | 0.650 (0.050, 0.922) | 0.656 (0.050, 0.916) | 0.394 (0.049, 1.000) | 0.400 (0.050, 1.000) |
| S352F | 18000 | 0.656 (0.048, 0.918) | 0.661 (0.049, 0.910) | 0.394 (0.045, 1.000) | 0.422 (0.047, 1.000) |
| S356F | 17000 | 0.659 (0.048, 0.914) | 0.671 (0.048, 0.901) | 0.400 (0.044, 1.000) | 0.406 (0.048, 1.000) |
| S358F | 18000 | 0.656 (0.050, 0.916) | 0.661 (0.050, 0.910) | 0.433 (0.046, 1.000) | 0.444 (0.047, 1.000) |
