# Prediction: adopt-pi

- **Run:** `research/solver/batch-adoptpi.sh` - results/diagadoptpi/case0-55.txt and the per-path files (audit-adoptpi.mjs, one process a unit: DP's 25 households in SNAP and PCLSI, and S130, S370 and S128 in both at a pension death tax of 40%), read by reduce-adoptpi.mjs into results-adoptpi.txt
- **Kind:** test
- **Written:** 4 Oct, 18:01 UK, before the run. The design is the deep review after DPC's (deep-review-log.md, 4 Oct 17:01 UK), adopted with the maintainer's go-ahead (PLAN.md, the 4 Oct 17:15 row) and confirmed by the maintainer after Claude's prediction on more points ('Agree, go ahead with ADOPT-PI as planned')
- **Seeds:** 7005 selection: ADOPT-PI selects the allowance axis's read for the shipping default, at a seed other than DPC's (7002), 6,000 paths a household, the same paths in every unit of a household (paired). Not 7004, which PLAN.md's 7u row holds for 7o and Phase 4's second held-out seed: had ADOPT-PI used it, Phase 4's second seed would not be fresh for a candidate PCLSI joins on this result (the plan-auditor's MINOR 3 of 4 Oct 18:08 UK). 7005 is also Phase 4's selection band seed (select-phase4.mjs BAND_SEED, PLAN.md's Phase 4 panel passage, 'used for nothing else'), whose first 1,000 paths are ADOPT-PI's first 1,000: the band measures arm A on households outside results/, and ADOPT-PI's 25 are all in results/, so the two never share a household; the passage is amended to say so (the plan-auditor's MINOR 2 of 4 Oct 18:21 UK). The product's 'auto' risk-above rule reads its own seed 7101 in the shared code, as in every solver run.
- **Unmasking:** the tested arm removes a known error, the snapped allowance axis (O71: a partly used allowance reads as never running out until 0.75, then drops a bucket). The baseline behaviour that error drives is the chooser's hold just below 0.75 (DPC: pausing paths 3440 under SNAP, 678 under PCLSI) and the tables' optimism after access (O66). Removing it can expose another error: 7ap saw the bridge stage's optimism rise under PCLSI in the bad world (O76). So a survival loss under PCLSI on a household with a bridge is not read as the axis's harm until it is decomposed - the gated follow-up is the forward-only hybrid (PCLSI's tables read through the snap) on that household (PLAN.md ADOPT-PI, optional arm), which splits the tables from the hold.
- **Plan section:** PLAN.md "ADOPT-PI" (the schedule), "O71", "O83", "O88", "O89" and "PR5"

## Question

Does the interpolated allowance axis (PCLSI), in the shipping default with the reader off, give advice that harms simulated survival on none of DP's 25 households, is no worse by more than 0.1 points pooled over the 23 households outside the gain pair, and is better on S130 and S370, at another seed? Beside it, declared and deciding nothing: does it change lifetime tax and the estate, and does the estate's reading keep its sign when a pension left at death is taxed at 40% (PR5)?

## Derivation

- **The mechanism.** Under SNAP the chooser reads next year's tables at the nearest of three allowance buckets, so any use from 0.25 to 0.75 reads as half used and crossing 0.75 drops a bucket (grid.js l.253). The chooser holds just below 0.75. Under PCLSI the read blends the two neighbouring buckets (grid.js l.252), so the value falls smoothly and there is no wall.
- **DPC's records at seed 7002** (results-derive-dpc-traces.txt, derive-dpc-traces.mjs over DPC's case files; results-derive-adoptpi.txt):
  - survivors of 2,000 under PCLSI less SNAP: S130 +68, S370 +13, wealth x0.5 +4; no household loses more than 1; the panel 46016 to 46103 of 50000;
  - the hold: pausing paths 3440 under SNAP and 678 under PCLSI; plateau paths 10263 and 6770 (results-dpc.txt TOTALS).
- **Why S130 and S370.** They are the two households whose paths cross the wall and run short: the hold defers taxable pension draws while the ISA is spent, so a bad sequence finds the ISA gone. Under PCLSI the draws keep their pace.
- **Why not 'no material harm on every household', and why 6,000 paths.** DPC printed survivors per arm, not per path, so how many paths change outcome each way (k pairs a 2,000 paths, capped per household at what its SNAP failures and survivors allow) is not on disk. Read through the reducer's own items() at DPC's net changes (derive-adoptpi.mjs, results-derive-adoptpi.txt): at 2,000 paths 14 of the 25 households read inconclusive at k = 5; at 6,000 and 8,000 paths all 25 read no material harm at k = 5 but 10 and 9 read inconclusive at k = 15. A rule needing every household to read no material harm decides only if k is small, which DPC's records cannot show. The rule below reads harm on every household and the pooled floor over the 23 households outside the gain pair (RULES.md section 8 item 4: the floor is over the cases expected unchanged, so S130's and S370's gains cannot pay for losses elsewhere), read by the unconditional interval (pooledSummed, the maintainer's decision of 29 Sep 22:12 UK). That floor's lower end is above -0.1 at 4,000 paths and more for every k tried, up to 40 (at k = 40: -0.080 at 4,000 paths, -0.063 at 6,000), and INCONCLUSIVE at 2,000 paths at k = 40 (-0.118). 6,000 paths is a declared choice: at 4,000 and k = 40 both readings sit near their lines (the floor -0.080 against -0.1, S370's adjusted p 0.033 against 0.05), at 6,000 they have room (-0.063, 0.011) for 5.2 core-hours more.

## Prediction

- **Item 1 HELD:** no household reads harm, and the floor over the 23 households outside the gain pair is above minus 0.1 points (point about 0: DPC's net over the 23 is +6 of 46,000 paths).
- **Item 2 HELD:** S130 gains (about +3.4 points) and S370 gains (about +0.65), both shown after Holm.

## Falsified if

- **Item 1 FALSIFIED:** any household reads harm (Holm-adjusted exact p under 0.05 and a point loss at least its margin), or the floor's unconditional interval lies wholly below minus 0.1 points.
- **Item 1 INCONCLUSIVE:** no household reads harm and the floor's interval straddles minus 0.1.
- **Item 2 FALSIFIED:** S130's or S370's change is 0 or below.
- **Item 2 INCONCLUSIVE:** both changes are positive and one or both gains are not shown after Holm.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | DP's panel (7e's 25: 7af's 16 and 7ag's 9) | the same | SAME (the panel DPC read; the tuning set, not the Phase 4 panel) |
| 2 | Changes the test makes to a household's inputs | DPC's (guardrails off, no lookahead, floor 0.8 of the target); in the DT units the pension death tax 40% | the same | SAME (the death tax is set in both arms of the DT pair and in neither arm of the main pair) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7005, 6,000 paths | the same paths | SAME (paired; the reducer's gate holds one pathsum across a household's units) |
| 17 | The grid: points, shares, gain buckets | 30 points; the allowance axis 0, 0.5, 1 snapped (nearest) | 30 points; 0, 0.5, 1 interpolated (pclsInterp) | TESTED (the read of the allowance axis, nothing else) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per household and arm, each path's survival (0 or 1), lifetime tax and terminal net, from the per-path files; b paths lost (SNAP survives, PCLSI fails) and c saved.
- **Item 1 (primary; single look):** per household, stats.mjs outcome() at the household's margin (0.25 points where SNAP survives 95% or more, else 0.5; marginFor), harm's exact one-sided McNemar p Holm-adjusted over the 25: no material harm, harm or inconclusive, printed for every household. The floor: the paired cells summed over the 23 households outside S130 and S370, read by the unconditional interval (stats.mjs pooledSummed) against the pooled margin, 0.1 points (MARGINS.pooled); the exact conditional interval printed beside it, not read. HELD when no household reads harm and the floor's lower end is above -0.1; FALSIFIED when any household reads harm or the floor's upper end is below -0.1; else INCONCLUSIVE.
- **Item 2 (primary; single look):** on S130 and S370, the exact one-sided McNemar p of c saved in b + c, Holm over the 2; GAIN when the adjusted p is under 0.05 with c > b. HELD when both read GAIN; FALSIFIED when either change (c - b) is 0 or below; else INCONCLUSIVE.
- **Secondary (declared, decides nothing):** per household the mean paired change in lifetime tax and in terminal net, each with its standard error over paths; the death-tax pair's survival, tax and net changes beside the same household's at death tax 0, and whether the net change keeps its sign (PR5). Tax and estate at death tax 0 are read with that declared.
- **Reported, not items:** per arm the paths reaching 0.6 of the allowance, crossing 0.75, and the mean years in the band of the reaching paths (the hold at another seed). O88's split of the State Pension's drop by entry year, in both arms, is a derive script over the saved files after the read, not a registered reading.
- **NOT SETTLED**, if any gate fails: the stamps; a unit missing, repeated or not done; a ran line off the shipping default, the arm's axis or the unit's death tax; a household's units on different paths or access lines; a per-path file missing, unstamped or off its sum line.
- **Declared choices, not derived:** the 0.1-point pooled margin and the 0.25 and 0.5 household margins are the regimen's (stats.mjs); 6,000 paths is the power below; the death tax of 40% is the inheritance tax rate unused pensions face from April 2027.

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD and item 2 HELD | put PCLSI in the shipping default to the maintainer, with the tax, estate and death-tax readings beside it | 0.45 |
| item 1 HELD, item 2 INCONCLUSIVE or FALSIFIED | keep SNAP; report PCLSI as harming no household and losing no 0.1 points pooled over the 23, its gain unshown; run the hybrid on S130 and S370 to split the tables from the hold | 0.30 |
| item 1 INCONCLUSIVE | keep SNAP; a second look at more paths on the 23 households of the floor | 0.15 |
| item 1 FALSIFIED | keep SNAP; decompose the harm with the hybrid on the harmed households (the unmasking above) | 0.10 |

## Decision fed

- **Item 1 HELD and item 2 HELD:** PCLSI goes to the maintainer as a change to the shipping default, with the secondary readings; the standing conditions for the Phase 4 candidate (the 4 Oct 08:17 row: the axis joins it only with a step-read fix that works) are the maintainer's to revisit. No default change without the maintainer's decision.
- **Item 1 HELD, item 2 not HELD:** PCLSI shows no harm on any household and no pooled loss of 0.1 points on the 23; its gain is unshown, so the hybrid runs before it goes to the maintainer.
- **Item 1 INCONCLUSIVE:** safety unshown; a second look, registered, at more paths.
- **Item 1 FALSIFIED:** SNAP stays; the harm is decomposed before it is called the axis's.
- **In every branch:** pclsInterp stays off in the code until the maintainer decides; no product change, no seed 7013; O89 is read against item 2; O88's split runs over the saved files.

## Provenance

- **The design:** the deep review after DPC (deep-review-log.md, 4 Oct 17:01 UK), its decisive test, adopted in PLAN.md's 4 Oct 17:15 row; DPC's records (results-dpc.txt, results-derive-dpc-traces.txt).
- **The build:** audit-adoptpi.mjs (DPC's unit, audit-dpc.mjs's panel copied; per-path survival, tax, net and traces; the death tax checked on the solved model); reduce-adoptpi.mjs (28 planted checks, 31 of 31 mutations caught, results-reduce-adoptpi-mutations.txt); preflight-adoptpi.sh with preflight-parse-adoptpi.mjs; derive-adoptpi.mjs.
- **The one change from the plan row's design:** the primary is no harm on any household plus the pooled floor over the 23 outside the gain pair, not 'a non-inferiority margin on every household', which decides only when few paths change outcome each way (the derivation).
- **Amended before launch** (the plan-auditor's FAIL of 4 Oct 18:08 UK on the first registration, 8bf8709): the floor taken over the 23 outside the gain pair, not all 25 (BLOCKING 1), and read by pooledSummed (BLOCKING 2); the paths raised from 2,000 to 6,000 on the redone power; the seed moved from 7004 to 7005 (MINOR 3). Amended again (its FAIL of 4 Oct 18:21 UK on 090c1fe): the power's pairs capped per household, the uncapped tables having had more saved paths than SNAP failures on up to 17 households (BLOCKING 1), the figures restated and 6,000 paths declared; 7005's use by Phase 4's band named (MINOR 2); the planted check's 200 saved paths (MINOR 3); stale wording (MINOR 4).

## Derivation script

- `derive: research/solver/derive-adoptpi.mjs > research/solver/results-derive-adoptpi.txt sha256 1a873552c3bce529`
  (DPC's survivors per household and arm; the items read at DPC's net changes with 0, 5, 15 and 40 lost-and-saved pairs a 2,000 paths, at 2,000, 4,000, 6,000 and 8,000 paths; the hold's incidence; the cost)

- **Mechanism:** grid.js:253 "nearest(g.pcls, pf)" (SNAP's read: the nearest bucket) against grid.js:252 "g.pclsInterp ? bracket(g.pcls, pf)" (PCLSI's blend); how often the hold applies per unit is derive-adoptpi.mjs's incidence line (DPC's pausing and plateau paths per arm).

## Point and interval

- **Item 1:** the floor's change about 0 points (-0.05 to +0.05); no household reads harm.
- **Item 2:** S130 +3.4 points (+1.5 to +5); S370 +0.65 (-0.3 to +1.5).

## Credence

- **Item 1:** HELD 0.75, INCONCLUSIVE 0.15, FALSIFIED 0.10.
- **Item 2:** HELD 0.60, INCONCLUSIVE 0.30, FALSIFIED 0.10.

## Power

From results-derive-adoptpi.txt, DPC's net changes read through the reducer's own items() with k lost-and-saved pairs on each side a 2,000 paths, every count scaled with the paths:

- **Item 1** at 6,000 paths reads HELD for k = 0, 5, 15 and 40 (the floor's lower end 0.004, -0.023, -0.044, -0.063); at 4,000 paths HELD at every k (-0.080 at k = 40); at 2,000 paths INCONCLUSIVE at k = 40 (-0.118). The pairs are capped on 3, 11 and 17 households at k = 5, 15 and 40 (named in the file).
- **Item 2** at 6,000 paths: S130's gain shown at every k; S370's at every k (adjusted p 0.011 at k = 40). At 2,000 paths S370's is not shown at k = 40 (0.107).

## Budget line

56 units at 6,000 paths: 26.6 core-hours from DPC's mean unit (solve 711 s, forward 333 s at 2,000 paths, the forward part tripled), about 6.7 hours on four cores (results-derive-adoptpi.txt). Launched when 7au leaves the cores.

## Pre-mortem

- **First:** discordance larger than k = 40 a 2,000 paths: the floor reads INCONCLUSIVE, or S370's gain is unshown - a power failure, not a falsification; a second look or the hybrid is then the next step.
- **Second:** PCLSI changes the tables wherever the allowance is part used, not only at the wall, so changes on households with no hold are possible; they are read per household under item 1, not explained by the hold.
- **Third:** the death tax set in the plan's config reaches the forward run's terminal net but not the solver's bequest value. The audit stops a unit whose solved model reads a death tax other than its own (m.ctx.pensionDeathTaxRate), which is the value solve.js l.223 uses.
- **Fourth:** seed 7005 ('selection') is also Phase 4's selection band seed; the band reads households outside results/ and ADOPT-PI's are all inside, so no household's paths are shared (the Seeds field); 7004 stays fresh for Phase 4's second seed.

## Changes after seeing results

None.
