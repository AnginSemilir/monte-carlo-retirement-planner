# Prediction: diag-dto97

- **Run:** `research/solver/batch-dto97.sh` - results/diagdto97/case0-13.txt and the per-path files (audit-dto97.mjs, 14 units: O97's seven loss households x SNAP and PCLSI at a pension death tax of 40%), read by `reduce-dto97.mjs` into results-dto97.txt
- **Kind:** test
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log). The design is the deep review after FORCE-X's (deep-review-log.md 6 Oct 08:08 UK, DT-O97). It reopens the maintainer's decision of 5 Oct 08:00 UK ('Yes, drop the death tax item and go ahead') with their go-ahead: 'yes, run DT-O97' and, after the buffer check (O97), 'yes make the fix the default - and run dt-097' (6 Oct, the session). The judged credences were committed first as drafts/diag-dto97.md (206e26d), the build after (f882307), the derivation's output after this file.
- **Seeds:** 7005 selection: ADOPT-PI's paths (6,000 a household), so every path pairs with ADOPT-PI's death-tax-0 files; no held-out seed is touched.
- **Unmasking:** O97 is an undecomposed unmasking case (the deep review after FORCE-X): PCLSI removes the snapped allowance read (O71), and with it SNAP's hold below the allowance wall, which at a pension death tax of 0 leaves a pension untouched that passes untaxed, so the error's removal read as a net loss on the lucky tail. This run holds the arms and changes one thing, the death tax, to see whether the loss is that tax setting's (DT) or survives it (TAIL); item 1 checks that the fix does no material harm to survival at 40% on seven households where PR5 left survival NOT CHECKED.
- **Mechanism:** src/solver/solve.js:223 "const net = Math.max(0, total - grown[0] * deathTax);" (the pension death tax in the bequest value and the terminal net); audit-dto97.mjs (audit-adoptpi.mjs's unit, the death tax 40 on every unit)
- **Plan section:** PLAN.md "DT-O97", "O97", "PR5", "PR7", "O116"

## Question

At a pension death tax of 40%, does PCLSI still do no material harm to survival on O97's seven loss households (item 1), and does the net loss PCLSI showed there at 0 (ADOPT-PI) fall to a quarter of its size or less (DT, the loss is death tax 0's), or keep half of it or more (TAIL)?

## Derivation

- **The loss at 0 and the deep review's revaluation** (results-derive-dto97.txt sections 1 and 2; ADOPT-PI's files through their own gate, their pension traces decoded): the seven households' net change PCLSI less SNAP at 0 runs from -23594.37 (S366) to -198639.63 (bridge 4+cost) a path. Revalued at 0.4 with the policy held (each surviving path's net less 0.4 times its last pension), the kept share is 0.165 or less on all seven, and negative (a gain) on three. On the three households ADOPT-PI re-solved at 0.4, the re-solved shift of the net change is larger than the revalued one: rho 1.250 (S128), 1.781 (S370), 2.899 (S130). The first registration read that rho as a multiplier on the revaluation and carried it to the loss households; the deep review of 6 Oct 10:37 UK withdrew that reading (the per-arm split below: S130's rho is PCLSI's own re-solve, of the opposite sign for the loss households), so no kept share is predicted from rho.
- **The per-arm split and the power** (sections 2b and 3; amended before launch on the deep review of 6 Oct 10:37 UK): the first registration carried the check's rho over to the loss households as a multiplier on the revaluation. Split by arm, the re-solve at 0.4 adds its own drift to the net change: PCLSI's re-solved net less its own revaluation trails SNAP's by -121278.72 a path on S130 (-2.653% of SNAP's mean net), -196751.08 on S370 (se 237660.15, noise), and leads by +2555.48 on S128 (+0.244%) - so S130's rho is PCLSI's re-solve lowering its own tail net, and carried over to the loss households (whose net changes at 0 are a small share of their nets) it would swamp the loss and read TAIL. The stories now carry a drift: DT (rho 1 with S128's drift: the kept shares -0.852 to 0.014) reads HELD on every draw; DT-DRIFT (rho 1 with S130's drift: 1.814 to 6.576) reads FALSIFIED on every draw, as TAIL (k 1) does; PHOLD (k 0.4) and OTHER (k 0.5) INCONCLUSIVE on every draw. Reported beside them: a rho sweep with no drift (INCONCLUSIVE on every draw from 0.5 to 0.8, HELD 0.95 at 0.9, 1.00 at 1.0) and DT with the per-path noise tripled (HELD on every draw). Item 1: as at 0 (SAME) HELD on every draw, a tenth of a point lost on every household (SMALL) INCONCLUSIVE, a quarter point (SHIFT) FALSIFIED.
- **The checks, each failed on a planted fault first:** reduce-dto97.mjs's 35 planted checks (every outcome of both items reached; EDGES; the per-arm split of a pure revaluation is 0 and a drift reads as itself), mutate-reduce-dto97.py over the amended reducer (results-reduce-dto97-mutations.txt); the preflight's plant (one unit's death tax set to 0 in a copy of the logs), which the gate must refuse. Same pattern searched: the pension traces ADOPT-PI's loader leaves as base64 (the EDGE-SPLIT pattern) are decoded and an undecoded one refused (a planted case).

## Prediction

- **Item 1 HELD:** no household reads harm at 40%, and the floor's lower end is above minus 0.1 points.
- **Item 2 FALSIFIED by the registered rule (the TAIL read) is the likeliest outcome** (derived 0.71): five or more of the seven keep half or more of their death-tax-0 net loss at 40%, re-solved - most likely by DT-DRIFT, PCLSI's own re-solve at 40% lowering its tail net (S130's pattern), not by a loss surviving the revaluation; which of the two carries it is read from the per-arm split, not from item 2.

## Falsified if

- **Item 1 FALSIFIED:** any household reads harm, or the floor's upper end is below minus 0.1. INCONCLUSIVE otherwise.
- **Item 2 FALSIFIED (TAIL read):** five or more keep half or more (the TAIL test shown after Holm); it means PCLSI trails SNAP in terminal net at 40% re-solved, not that O97's loss survives the death tax (the deep review of 6 Oct 10:37 UK: that attribution waits on the per-arm split). HELD (DT read) when five or more keep a quarter or less. INCONCLUSIVE otherwise.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 2 | Changes the test makes to a household's inputs | ADOPT-PI's files: pension death tax 0 | this run: pensionDeathTaxRate 40 on every unit | TESTED - item 2's thing tested (the 0 files against the 0.4 run, both arms) |
| 15 | The tax-free lump sum rule | SNAP (the snapped allowance axis, set explicitly) | PCLSI (interpolated) | TESTED - item 1's thing tested, and the pair whose net change item 2 compares |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | ADOPT-PI's files, code 5e1edac08e4b | this run, code aefe1e31fe04 | ACCEPTED - the solver changes since (pclsSeg, default null; the forced draw, default 0; research options off) are inert at their defaults: EDGE-SPLIT (code 98fed13c0e83) reproduced ADOPT-PI's SNAP and PCLSI sum lines on S130, S128 and S370 to the cent (results/diagedge against results/diagadoptpi), and PAUSE-S128 and FORCE-X held code aefe1e31fe04 to EDGE-SPLIT's files year for year (results-pause128.txt, results-forcex.txt); the run is launched before the interpolated axis becomes the candidate's default, and its SNAP arm sets the snap explicitly |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 26 | Which rivals, and each one's rule and parameters | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | paired by path | the same | SAME - McNemar (item 1) and sign-flip tests on per-path differences (item 2); the pairing with ADOPT-PI checked by pathsum, access line and file shape |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (primary; single look):** ADOPT-PI's rule over the seven at 0.4: per household the paired survival change PCLSI less SNAP, stats.mjs outcome() at its margin (marginFor), harm's exact McNemar p Holm over 7; the floor, the cells summed over the 7, by the unconditional interval (pooledSummed) against 0.1 points. HELD when no household reads harm and the floor's lower end is above -0.1; FALSIFIED when any household reads harm or the floor's upper end is below -0.1; else INCONCLUSIVE.
- **Item 2 (primary; single look):** per household and path d0 = PCLSI - SNAP in terminal net at 0 (ADOPT-PI's files), d4 the same at 0.4; NO LOSS when mean(d0) >= 0; DT test mean(d4 - 0.25 d0) above 0, TAIL test mean(0.5 d0 - d4) above 0, sign-flip (flipP, B 20,000, fixed seeds), Holm over 14; a household DT when its DT test shows, TAIL when its TAIL test shows, else UNCLEAR. HELD when 5 or more read DT; FALSIFIED when 5 or more read TAIL; else INCONCLUSIVE.
- **Reported, not items:** per household the tax change at 0 and 0.4 and at 0.4 with the death charge; the revaluation of the 0 files against the re-solved change; the per-arm split (each arm's re-solved net at 0.4 less its own revaluation, and PCLSI's less SNAP's: near 0 is DT, negative is DT-DRIFT; added before launch on the deep review of 6 Oct 10:37 UK); the hold in both arms at both rates. Item 2 is attributed only through the per-arm split.
- **NOT SETTLED**, if any gate fails: the stamps; a unit missing, repeated or not done; a ran line off ADOPT-PI's unit, the arm's interpolation or the death tax 0.4; a household's units on different paths; a file off its sum line or with an undecoded pension trace; ADOPT-PI's files failing their own gate; the pairing with ADOPT-PI (pathsum, access line, file shapes).
- **Declared choices, not derived:** the thresholds a quarter and a half and 5 of 7 (the deep review's, deep-review-log.md 6 Oct 08:08 UK); the 40% rate (the inheritance tax unused pensions face from April 2027, ADOPT-PI's); the margins (stats.mjs, decided).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD, item 2 HELD | the fix does no material harm at 40% on the seven, and PCLSI's net loss does not survive the death tax re-solved: with the per-arm split near 0, O97's loss is recorded as the death-tax-0 setting's, and the app's death-tax default goes to the maintainer as its own question | 0.08 |
| item 1 HELD, item 2 INCONCLUSIVE or FALSIFIED | the fix holds at 40% for survival; PCLSI trails in net at 40% re-solved: the per-arm split says whether that is PCLSI's own re-solve (DT-DRIFT: a register item on the solver's response to a death tax, family 4) or a loss surviving the revaluation (O97-TAIL); nothing goes to the maintainer as O97's cost before that split is read | 0.72 |
| item 1 FALSIFIED or INCONCLUSIVE | the fix costs survival at a nonzero death tax somewhere: the default's survival at 40% goes to the maintainer before Phase 4 | 0.20 |

## Decision fed

- **Item 1 HELD:** PR5's caveat narrows: the candidate default's survival checked at 40% on ten households (ADOPT-PI's three and these seven).
- **Item 1 FALSIFIED or INCONCLUSIVE:** the default change already made (the maintainer, 6 Oct) is put back to them with the households where it harms survival at 40%.
- **Item 2 HELD:** O97's net loss is recorded as death tax 0's (with the per-arm split near 0); the end pot's valuation (buffer or estate) stays the maintainer's design question (PR7).
- **Item 2 FALSIFIED or INCONCLUSIVE:** PCLSI trails SNAP in net at 40% re-solved in part or whole; the per-arm split attributes it - to PCLSI's re-solve (DT-DRIFT, a solver-response question opened in the register) or to the loss itself (O97-TAIL, the buffer check's reading beside it); not quoted as O97's cost until it does.
- **In every branch:** no product change; the app's death-tax default is not changed here.

## Provenance

- **The design:** the deep review after FORCE-X (deep-review-log.md 6 Oct 08:08 UK), DT-O97.
- **The build:** f882307 (audit-dto97.mjs, reduce-dto97.mjs, derive-dto97.mjs, mutate-reduce-dto97.py, batch and preflight); the SNAP arm's snap set explicitly before registration (this commit's).
- **Amended before launch (declared):** the deep review of 6 Oct 10:37 UK (deep-review-log.md) found the derivation's carried rho unsound (S130's rho is PCLSI's own re-solve, opposite in sign for the loss households) and its 08:08 likelihood ratio withdrawn; the reducer gained the per-arm split (reported, no item changed, no threshold or rule changed), the derivation gained the split on the check households, drift stories, a rho sweep, a noisier variant and a third item-1 story, and the derived credences, points, decision table and Decision fed changed with it. The judged credences are unchanged (committed in drafts/diag-dto97.md, 206e26d, before any derivation). No DT-O97 unit has run.
- **Seen before registration (declared):** ADOPT-PI's results (the seven loss households' net changes at 0; the three death-tax arms at 0.4); the deep review's revaluation figures; the buffer check (results-derive-o97-buffer.txt); two earlier runs of derive-dto97.mjs before its output's commit: one with the pension traces undecoded (every revalued figure NaN, every story's power 1.00, no information), one with them decoded, whose figures this one's repeats line for line except item 1's point, which that run printed as the HELD probability (0.80) and which check-prediction refused as no point; the derive now prints the floor's change (-0.04 points) and nothing else in its output changed (diff of the two outputs).

## Derivation script

- `derive: research/solver/derive-dto97.mjs > research/solver/results-derive-dto97.txt sha256 1e84f5a764abfd1e`
  (the loss, the revaluation and its check, the per-arm split on the check households, the power, the credences; the amended run after the deep review of 6 Oct 10:37 UK - the first registration's output was 606037674fadfe6c (c282517); run after the judged credences were committed in drafts/diag-dto97.md, 206e26d; its output committed after this file)

## Point and interval

- **Item 1:** -0.03 points, the floor's change PCLSI less SNAP over the seven, weighted as the credence (results-derive-dto97.txt section 4: the death-tax-0 pairs' own +0.010 under SAME, -0.090 under SMALL, -0.240 under SHIFT); interval -0.24 to +0.01, the stories' points.
- **Item 2:** 2.24, the kept share (net change at 0.4 over net change at 0) weighted as the credence over the seven (DT and DT-DRIFT at rho 1 with S128's and S130's drifts, TAIL 1, PHOLD 0.4, OTHER 0.5; sections 2b and 4); interval from about -0.85 (DT) to 6.58 (DT-DRIFT on share 0.70), the stories' per-household shares; DT-DRIFT's size rests on S130's drift carried as a share of each household's net, NOT CHECKED off S130.

## Credence

- **Base rate, item 1:** 0.80 (NOHARM, results-scorecard.txt KIND BASE RATES: 27 of 33)
- **Base rate, item 2:** 0.10 (it rests on the deep review's ranked cause O97-DT: results-scorecard.txt, the deep-review rate frozen since 5 Oct, O115); applied with no likelihood ratio: the ratio the first registration used came from the 08:08 receipt's 'the revaluation overstated twofold', which the 10:37 review withdrew (it compared levels; on the shift the re-solve went further)
- **Item 1:** HELD 0.80, INCONCLUSIVE 0.10, FALSIFIED 0.10 (derived, results-derive-dto97.txt section 4: SAME at the NOHARM base rate, SMALL and SHIFT sharing the rest evenly - a declared split - through section 3's power)
- **Judged, item 1:** HELD 0.75, INCONCLUSIVE 0.20, FALSIFIED 0.05 (survival at a pension death tax of 40%, no material harm by ADOPT-PI's rule over the seven: ADOPT-PI read no material harm on all 25 at death tax 0 and kept its survival change on S130, S370 and S128 at 40% (results-adoptpi.txt); a death tax lowers the estate's pull, which can only make the solver spend the pension sooner, the direction PCLSI already takes; the floor over seven households is narrower than ADOPT-PI's, so an inconclusive read stays possible)
- **Item 2:** HELD 0.10, INCONCLUSIVE 0.19, FALSIFIED 0.71 (derived, results-derive-dto97.txt section 4: O97-DT 0.100 at the base rate, the rest in the 10:37 review's proportions - DT-DRIFT 0.553, TAIL 0.158, PHOLD 0.111, OTHER 0.079 - each through section 3's power; the review's own weights, normalised, give 0.41, 0.12 and 0.46)
- **Judged, item 2:** HELD 0.45, INCONCLUSIVE 0.40, FALSIFIED 0.15 (the deep review after FORCE-X puts O97-DT at 0.60 and O97-TAIL at 0.20; its revaluation with the policy held removes most of the loss, but it overstates the change about twofold on the households re-solved at 40%, so a re-solved kept share of a quarter or less on five of seven is likely but not sure; PCLSI's own remaining holds and the solver's own response to the death tax can keep part of the loss on some households, which reads UNCLEAR, so the middle outcome carries real weight). Declared: before writing these the author saw the deep review's receipt (its revaluation's figures for share 0.90, bridge 1, bridge 4+cost and S366, and its S128/S130/S370 check) and ADOPT-PI's results; no part of the DT-O97 derivation has been written or run.
- **Kinds:** 1 NOHARM, 2 ATTRIB

## Power

From results-derive-dto97.txt section 3: item 2 separates the stories - HELD on every draw under DT (rho 1 with S128's drift) and with the per-path noise tripled, FALSIFIED on every draw under DT-DRIFT (S130's drift) and TAIL, INCONCLUSIVE under PHOLD and OTHER - but its FALSIFIED does not separate DT-DRIFT from TAIL: the per-arm split does that. Without drift the rule needs the re-solve to move the net change by about 0.9 of the revaluation's shift or more to read HELD (rho 0.9: 0.95; 0.8 and below: INCONCLUSIVE). The drifts are carried as constants a path, a share of each household's net, from one check household each (S128, S130) - NOT CHECKED off them. Item 1 reads HELD on every draw at the death-tax-0 survival changes, INCONCLUSIVE with a tenth of a point lost on every household, FALSIFIED with a quarter point.

## Budget line

From ADOPT-PI's logs (results/diagadoptpi/case*.txt): its death-tax units' solves 225 to 282 s and forward runs 370 to 419 s; its panel units' solves 408 s and forward runs 635 s on average. Fourteen units, four at once: about 2.5 to 4 core-hours, about 45 to 70 minutes; each unit stopped at 3 hours.

## Pre-mortem

- **First:** the solver re-solved at 40% changes both arms' policies, and PCLSI's re-solve lowers its own tail net as on S130 (DT-DRIFT, the derived favourite): item 2 reads FALSIFIED on a cause that is not O97's loss, and the reading is quoted as 'the loss survives the death tax'. Guard: the Decision rule and Decision fed attribute item 2 only through the per-arm split.
- **Second:** on bridge 4+cost (the largest loss, and the one household whose median path loses at 20% in the buffer check) part of the loss is not the pension's tax, so it reads UNCLEAR or TAIL and item 2 lands INCONCLUSIVE with 4 DT.
- **Third:** a death tax raises the value of drawing the pension early on households near the floor, so PCLSI's survival edge changes sign on one of the seven and item 1 reads harm on it, a finding about the default at 40%, not about O97.
- **Fourth:** the pairing with ADOPT-PI fails because a solver change since ADOPT-PI is not inert at its default (row 28's chain broken): the gate's pathsum check would pass but the arms' survival at 0.4 would not be ADOPT-PI's unit; only the preflight's smoke and the audit's settings checks guard it.

## Changes after seeing results

None.
