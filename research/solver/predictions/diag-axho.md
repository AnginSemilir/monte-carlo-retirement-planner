# Prediction: diag-axho

- **Run:** `research/solver/batch-axho.sh` - results/diagaxho/case0.txt to case4.txt and their files (audit-axho.mjs: J1 and J1X, S366 at 60 wealth points and six shares under `readerRef: 'adaptive', readerSplit: 'rs'`, J1X J1 re-solved for its own runs on paths 9,000 to 15,999 and D; J2, S366 under `readerRef: 'order'`; J3, S360 under A6RS's settings; J4, S360 under BO's; the candidate's own unit, 4,000 paths a world, seed 7004), read by `reduce-axho.mjs` in the real tree into results-axho.txt
- **Kind:** test
- **Written:** 17 Oct, before the run (its time is its registering commit's, git log); the deep review after AOR (deep-review-log.md 17 Oct 18:22 UK) and its adoption (PLAN.md's 17 Oct 18:22 row; the plan-auditor's PASS of 17 Oct 18:35 UK)
- **Seeds:** 7004, the second seed (replication; RULES.md section 8 item 9): its first 4,000 paths a world for every job's ledger and paired comparison, paths 4,000 to 15,999 for J1's and J1X's own runs (engine.mjs pathsForSeed: each path its own offset of the seed), the engine leg's states each on its own stream, the seed offset by pathsForSeed's path stride times (2^31 + 4,000 g), disjoint from the main paths and from each other (engTook checks the draws), the sampler's and the simulated column's draws from the seed scaled by a thousand plus 50 and 60 plus the world; 7002, the tuning seed, only through saved files: O160's pooled line reads AOR's A6RS and NODE-AX's BO (both run on it), and the preflight's copy check runs J3 on it against AOR's preflight A6RS
- **Unmasking:** J1 and J3 remove the order reference's known errors at the bridge (O154: ORDER's runs lose paths against BASE's on S360 in world 0; O155: ORDER may over-read the engine's fixed move in worlds 1 and 2) and the copied residual R at copied corners (O169, the RS split), which drive the order reference's over-read where corners are copied; removing them may unmask another error - the reference's pessimistic tail p (O164, O165), the six-share grid term (O172) - and item 1's or item 4's arm changes the reference and the split together. No arm pair in AX-HO splits a harm between them: a harm on item 1 (S366) or item 4 (S360) is NOT SETTLED as either part's until the registered decomposition reads it - the adaptive reference with the default split, seed 7004, on the household harmed, against the same J2 or J4 (RULES.md section 9 rule 1; the receipt's 'never a next fix'). J2 and J4 are the order reference with O154's and O155's errors in them, so a no-harm verdict here reads the arm against a control known to lose paths in S360's world 0 (section 9 rule 3): O154 cost BO 16 paths net against BASE in S360's world 0 (0.4 points), a handicap of the control that eases a no-harm verdict there, so item 4's HELD is evidence against the order reference only, never against BASE, while a harm verdict survives O154 (the error favours the arm); O155 shows in no item (the engine's fixed move is not read)
- **Mechanism:** src/solver/solve.js:671 "if (adaptiveRef) return adaptiveRef.chance(k, t, bills, ai0); if (opts.readerRef === 'order') {" (the bridge reader's reference: the adaptive reference's chance, else the order reference's); src/solver/grid.js:417 "if (g.reader.rs) { for (let k = 0; k < NC; k++) {" (the RS split: each copied corner's R scaled to the query's chance); the derive line prints how often it applies: every bridge-year read of every policy move (the ledger's path-years and the moves differing between arms, printed per world)
- **Plan section:** PLAN.md "AREF" (AX-HO), O154, O155, O160, O165, O172, O174, O175; the deep review after AOR (deep-review-log.md 17 Oct 18:22 UK); the maintainer's choice of S366 for S380 (17 Oct)

## Question

Held out - on a household the adaptive reference was not designed, tuned or tested on and whose bridge binds (S366) and on its design household at a fresh registry seed (S360, seed 7004) - does the adaptive reference with the RS split do no material harm against the order reference on the same paths where it changes the policy's moves, read S366 at its runs, and keep the bridge years' grid residual small?

## Derivation

- **What the records say:** S380, the receipt's held-out household, is one where the reference cannot act: at 4 and 30 points its two arms made the same move on every path-year (0 of 1,392, 1,698 and 1,819 at 30 points; results-axho-preflight.txt and the light-lane run of runs.log 17 Oct 20:44 UK), every path passing the bridge, its accessible money covering the bridge's floor bills 2.1 times; item 1 there would read no harm with nothing tested (O175's pattern). S366 replaces it (the maintainer's choice, 17 Oct): by an input rule it is the household, among the 60 single households with a bridge other than S360 (the design household) and S364 (tested), whose accessible money sits nearest the bridge's floor bills (0.768; S360 0.844, S364 0.570, S380 2.121; coverage-axho.mjs, results-axho-coverage.txt), and at 30 points its two arms move apart on 28, 22 and 14 of 40 paths by world (156, 107 and 51 path-years; results-axho-preflight-s366.txt), its own opening the de-risked ai 59 under both, every path alive at 30 points, the reference's world-0 table 99.85 against the order reference's 96.15. 7u read S366 under the candidate at 99.21 against 99.60 simulated, a reader change moving 14 of 8,000 paths (results-derive-axho.txt section 1). On S360 AOR's A6RS moved 55 and 38 of 4,000 paths against BO's in worlds 0 and 1 on seed 7002, its GB 0.0995, 0.2806 and 0.1103.
- **What AX-HO changes, and nothing else:** J1 and J3 against J2 and J4 on the same code, paths and settings: the reference and the split. J1X is J1 re-solved for more of its own runs (its tables and opening gated equal to J1's, its first 100 runs of world 0 J1's bit for bit). The ledger is AN's (J3 at seed 7002 equal to AOR's preflight A6RS to the bit, results-axho-preflight.txt).
- **Departures from the receipt, declared:** S366 for S380 (above); item 2 on 16,000 paths a world (at a gap of a point the receipt's 4,000 reads HELD 0.28, 16,000 reads 0.95: section 2); the engine leg runs on no state where no bridge record falls in the band (S380's and S366's at the preflights), so O165's read rests on S360's cells.
- **The stories:** derive-axho.mjs's JUDGED block (committed before its output): S366's read under the reference READ (the review's story, within about half a point, GB under half a point), OVER or UNDER; J1's runs against J2's near zero, a misread reference a little likelier to cost runs; the paths moved a multiple of S366's record; S360 at A6RS's seed-7002 figures moved by a seed's draw.

## Prediction

Item 1 HELD (0.74: no material harm on S366, few outcomes moving at its survival); item 2 HELD (0.60, INCONCLUSIVE 0.40); item 3 HELD (0.58); item 4 HELD (0.70). The decision table's likeliest row is 'else' (0.32: a harm item not shown either way), R1 next (0.27). The figures are the derivation's with the review's story at the record's rate (results-derive-axho.txt section 3b; as the receipt's start puts it, section 3: R1 0.32).

## Falsified if

Item 1 FALSIFIED: J1's runs worse than J2's on S366 by the relative margin in world 0 or 1 (harm, Holm-adjusted). Item 2 FALSIFIED: J1's table at its own opening wholly 3 points or more over (over) or under (under) its 16,000 runs in any world. Item 3 FALSIFIED: J1's GB wholly a point or more from zero in world 0 or 1. Item 4 FALSIFIED: J3's runs worse than J4's on S360 by the relative margin in world 0 or 1 (harm, Holm-adjusted), or J3's GB wholly a point or more from zero in any world.

## Fair-test table

J1 against J2 on S366 and J3 against J4 on S360, each pair on the same code, paths (seed 7004's first 4,000 a world) and settings; the reference and the split differ.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | J1's own runs on 16,000 paths a world (J1 on 0 to 8,999, J1X on 9,000 to 15,999) | J2's on 4,000 | ACCEPTED - the first 4,000 are the same paths and item 1 reads only them; the extra 12,000 serve item 2, which reads J1 against its own runs (the Power section prints the receipt's 4,000 beside); J2's table against its 4,000 is reported beside |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | readerRef 'adaptive' with readerSplit 'rs' (J1, J1X, J3) | readerRef 'order', the default split (J2, J4) | TESTED - the thing this test is about: the adaptive reference with the RS split as one candidate (a harm is not split between the two: the Unmasking field's decomposition) |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (d2a982e80436; audit-axho.mjs new, AN's ledger copied: J3 at seed 7002 equal to AOR's preflight A6RS to the bit, the preflight) | this code | SAME for items 1 to 4; ACCEPTED for O160's reported pooled line, which reads AOR's A6RS (this code) and NODE-AX's BO (code d297b820d217, BO on this code shown bit for bit at the preflight scale in AO's preflights, BO-off), each behind its own gate |
| 31 | Paired or not, and the standard error used | paired by path (items 1, 4); per arm (items 2, 3, 4's GB) | paired by path (items 1, 4) | ACCEPTED - items 1 and 4 the exact conditional McNemar on the same paths; item 2 J1's table against its own runs (an exact interval on the count); items 3 and 4's GB J1's and J3's own per-path means |
| 33 | For timings: what else the machine was running | the batch's other jobs, four cores | the same | ACCEPTED - the reference's build and the solves' seconds are reported against gate 5, not read by an item |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** items 1 and 4's harm by stats.mjs's exact conditional McNemar interval and outcome at the relative margin marginRel(the control's survival in that world: min(marginFor, a tenth of it)) with Holm across worlds 0 and 1; item 2, per world, table less runs in points with the exact (Clopper-Pearson) interval on the count at 1 - 0.05 / 3 (three worlds); item 3, per world, J1's mean GB with its standard error at Z for two worlds and two sides (2.2414); item 4's GB at Z for three worlds (2.3940); every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look):** no material harm to J1's runs against J2's on S366, worlds 0 and 1: HELD when both read no material harm, FALSIFIED when either reads harm, INCONCLUSIVE otherwise; the moves and paths differing between J1 and J2 printed beside, per world.
- **Item 2 (single look):** J1's table at its own opening against its runs on 16,000 paths a world: HELD when every world's interval sits inside [-1.5, +1.5]; FALSIFIED when any lies wholly at or beyond +3 (over) or -3 (under), the side printed; INCONCLUSIVE otherwise.
- **Item 3 (single look):** J1's GB in worlds 0 and 1: HELD when both intervals sit inside [-0.5, +0.5]; FALSIFIED when either lies wholly at or beyond one point either way; INCONCLUSIVE otherwise.
- **Item 4 (single look):** S360 held out: HELD when J3's runs read no material harm against J4's in worlds 0 and 1 and J3's GB sits inside [-0.5, +0.5] in every world; FALSIFIED on harm in either world or a GB interval wholly at or beyond one point either way; INCONCLUSIVE otherwise; the moves and paths differing between J3 and J4 printed beside.
- **No cause map is read by an item.** The receipt's ranked causes (O165's carrier, O160's, S364's world-0 deletion term) are read from reported lines (the engine leg, the luck-adjusted T), grade C, so the settle leaves them unscored, as AOR's O165-CASH; the reported reads are recorded in the register against each cause's predicted pattern (O165-DRAWS: the world sign gone with independent draws; O160-SEED: the pooled luck-adjusted T's interval wholly under zero puts SEED out, the receipt's line).
- **Reported, not items:** every job's tables against its runs by world; J1's P and D against their runs; the ledgers (OWN less runs = T + GB + GA) and GB by year; the engine leg by world and p-decade beside the reference's own rule (O165, O174); S360 world 0's luck-adjusted T under J3 and J4 on seed 7004 and under A6RS and BO on seed 7002, pooled by inverse variance (O160); the reference's build and the solves' seconds (gate 5).
- **Declared choices, not derived:** the deep review's lines for items 1 to 4 (the relative margin; 1.5 and 3 points; half a point and one point); item 2 on 16,000 paths a world, not the receipt's 4,000 (its departure, declared: the Power section prints both on the same draws); worlds 0 and 1 for the harm items (the receipt's).

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1 to 4 HELD (R1) | the adaptive reference with the RS split does no material harm where it changes moves on a held-out household (S366) and on a fresh seed (S360), reads S366 within 1.5 points and keeps the bridge residual under half a point: it goes to the steps before a default is put to the maintainer (the build time against gate 5, a design-reviewed test file, the panel under 7u-F) | 0.27 |
| item 1 or 4 FALSIFIED (R2) | harm: the decomposition (the adaptive reference with the default split, seed 7004, on the household harmed, against the same control), never a next fix; no default | 0.16 |
| items 1 and 4 HELD, item 2 or 3 FALSIFIED (R3) | no harm, but the reference misreads S366 by 3 points or its bridge residual is past a point: the deep review roots the read before any default | 0.09 |
| items 1 and 4 HELD, items 2 and 3 not FALSIFIED and not both HELD (R4) | no harm where the arm acts on both households, the read unsettled: the steps before a default go ahead with the unsettled read registered as a gate before the default | 0.17 |
| else | no material harm not shown on S366 or S360, nothing falsified: the deep review reads the differing moves and the discordant paths; nothing built; no default | 0.32 |

- **Waiver:** none needed: the chance the action changes is 0.68 (one less 0.32, the likeliest row), above a quarter
- **The rows' credences are the JUDGED stories' with the review's story at the record's rate (results-derive-axho.txt section 3b; at the receipt's start, section 3: R1 0.32, R2 0.15, R3 0.07, R4 0.14, else 0.32).**
- **The escalation rule (escalation.md, trigger 3):** the run is over 2 hours' wall (about 2.45 h, results-derive-axho.txt section 4) but its 'else' row is 0.32, under 0.6, so trigger 3 does not apply; trigger 1 is not met (AO HELD, AOR HELD)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD says the adaptive reference with the RS split loses no material survival against the order reference on a household it was neither designed, tuned nor tested on, where it changes the policy's moves (grade B, one household, one seed), with the count of moves it changes beside; FALSIFIED (harm) sends the decomposition (the Unmasking field); inconclusive names the world.
- **Item 2:** HELD says the reference reads S366 within 1.5 points of its runs in every world; FALSIFIED names the side; inconclusive names the world.
- **Item 3:** HELD says S366's bridge-years grid residual is under half a point under the reference; otherwise names the world and side.
- **Item 4:** HELD says the reference's S360 reads replicate on a fresh seed (no harm against BO's settings, GB under half a point in every world); FALSIFIED sends the decomposition on S360; inconclusive names the world.
- **In every branch:** no product change; the candidate's settings unchanged; no reference or split default chosen here (a default is the maintainer's decision, after the gates the decision table names); 7u-F held.

## Provenance

- **The design:** the deep review after AOR (deep-review-log.md 17 Oct 18:22 UK) proposed AX-HO's four jobs, its items and its reported lines; its adoption (PLAN.md's 17 Oct 18:22 row, the plan-auditor's PASS of 17 Oct 18:35 UK); the maintainer's 'Go ahead' to building, registering and running it; and the maintainer's choice of S366 for S380 (17 Oct, the session: "Swap S380 (Recommended)", after the preflight showed S380's arms moving alike).
- **The build:** audit-axho.mjs (AN's ledger copied with every year's move saved; P and D forced; J1X for 16,000 paths a world; the engine leg on each state's own draws with engTook; plants arm, rs, draws, own, layer, quad, held and nudge); reduce-axho.mjs (65 planted checks, each item to all three outcomes, six EDGES; the differing-moves count; the ledger's copy check); mutate-reduce-axho.py (42 of 42 caught, results-reduce-axho-mutations.txt); derive-axho.mjs; preflight-axho.sh, preflight-axho-nudge.sh, preflight-axho-s366.sh, batch-axho.sh (commits 295795a, 9640d7e, 7fa4206, 5b215ea, f5603d5, a7c740b, cf99fe3, b57aba8). No solver change; the code is d2a982e80436.
- **Seen before registration (declared):** the records named in the Derivation (grade C reads of them); every preflight line below, including S366's moves differing, its 30-point tables and its survival (40 of 40 a world), seen before the JUDGED block was rewritten for S366; the derivation's first draft for S366, whose output I saw before its inputs changed (the plan-auditor's BLOCKING 1 of 17 Oct 22:25 UK): its JUDGED block, committed in a7c740b, ran at 21:59 and again at 22:02 UK and printed its credences and rows - section 3b items 1 to 4 HELD 0.71, 0.57, 0.55 and 0.70, rows R1 0.23, R2 0.18, R3 0.08, R4 0.17, else 0.34 (kept byte for byte as derive-axho-a7c740b.mjs, its output results-derive-axho-a7c740b.txt); only then was its item 1 churn changed, from 0.05 to 1 times S360's paths moved to 0.5 to 8 times S366's own record (7u: 14 of 8,000), over about the same range of paths, with a cap at twice the control's dead paths, because S360's churn cannot occur in a world holding a few deaths and the draft's power read harm at no true change there; the registered figures moved by about 0.03 (items 1 to 3 HELD 0.74, 0.60 and 0.58, else 0.32), the rows' order unchanged. No figure at 60 points.
- **The preflights** (through the launcher, seed 7004): the first launch (runs.log 17 Oct 19:45 UK) stopped when J1 refused an engine leg on no state (S380 at 4 points), the check fixed to refuse shared draws only (5b215ea); the second (20:14 UK, a fifteenth of the points, 40 paths a world; results-axho-preflight.txt): SMOKE PASSED, the five jobs exit 0 and the gate passed (reduce-axho.mjs --preflight), the nine plants refused each on its own check (arm and rs on J1 at 4 and 30 points: armTook; draws on J3: engTook 40/5600; own and layer on J4: identity; quad: qfTook 456/807; held: layerTook 695/807), J3 at seed 7002 AOR's preflight A6RS to the bit and seed 7004's J3 not; the nudge plant changed no move (its sibling move absent from the menu), fixed in f5603d5 and shown in the third step (21:15 UK, results-axho-preflight-nudge.txt: 4 of 40 paths differing in world 0 alone, none on the clean job against itself); S380 at 30 points (20:44 UK, the light lane): J2's moves J1's on every path-year; the S366 step (21:33 UK, results-axho-preflight-s366.txt): J1 and J2 exit 0 with every check in full, the moves apart on 28, 22 and 14 of 40 paths.

## Derivation script

- `derive: research/solver/derive-axho.mjs > research/solver/results-derive-axho.txt sha256 250793c7bd073b70`
  (7u's S366 unit behind 7u's gate, AOR's A6RS and NODE-AX's BO behind theirs, the preflight steps; the power of items 1 to 4 through reduce-axho.mjs's own items(); the credences from the receipt's judged starts through the JUDGED stories, committed before the output, with the review's story at its item 3 start (section 3) and at the record's rate read from results-scorecard.txt (section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget)

## Point and interval

- **Item 1:** -0.0250, J1's runs less J2's in world 0, points (results-derive-axho.txt section 3b); 80% interval -0.2250 to 0.1250
- **Item 2:** 0.0313, J1's table less its runs in world 0, points (results-derive-axho.txt section 3b); 80% interval -1.6563 to 1.7188
- **Item 3:** 0.0023, J1's GB in world 0, points (results-derive-axho.txt section 3b); 80% interval -0.7835 to 0.7851
- **Item 4:** 0.0750, J3's runs less J4's in world 0, points (results-derive-axho.txt section 3b); 80% interval -0.3000 to 0.4250

## Power

From results-derive-axho.txt section 2 (40 draws a cell through reduce-axho.mjs's own items(); S366 at the judged survival 98, 99.85 and 100 by world, its paths moved as multiples of its record, 7 in 4,000; S360 at BO's bits with A6RS's GB):

```
  churn x1 item 1, J1's runs -0.3 points in worlds 0 and 1: HELD 0.25 INCONCLUSIVE 0.00 FALSIFIED 0.75
  churn x1 item 1, J1's runs 0 points in worlds 0 and 1: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  churn x3 item 1, J1's runs 0 points in worlds 0 and 1: HELD 0.68 INCONCLUSIVE 0.30 FALSIFIED 0.03
  churn x8 item 1, J1's runs 0 points in worlds 0 and 1: HELD 0.28 INCONCLUSIVE 0.55 FALSIFIED 0.17
  item 2, table less runs 1 points in every world: on 16000 paths HELD 0.95 INCONCLUSIVE 0.05 FALSIFIED 0.00; on 4000 (the review's) HELD 0.28 INCONCLUSIVE 0.72 FALSIFIED 0.00
  item 2, table less runs 2 points in every world: on 16000 paths HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00; on 4000 (the review's) HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  spread x1 item 3, J1's GB 0.45 in worlds 0 and 1: HELD 0.78 INCONCLUSIVE 0.23 FALSIFIED 0.00
  churn x0.75 item 4, J3's runs 0 points in worlds 0 and 1, its GB A6RS's: HELD 0.82 INCONCLUSIVE 0.17 FALSIFIED 0.00
  churn x1.5 item 4, J3's runs -0.3 points in worlds 0 and 1, its GB A6RS's: HELD 0.05 INCONCLUSIVE 0.63 FALSIFIED 0.33
```

Item 1 reads no material harm at S366's record churn unless J1 loses a quarter of a point; at eight times the record a chance loss of 10 paths in a world with few deaths can read harm at no true change (0.17). Item 2 holds a gap within about a point at 16,000 paths a world (the review's 4,000 to about 0.6). Item 3 holds a GB within about 0.45 points. Item 4 reads no material harm unless J3 loses a quarter of a point or the paths moved grow.

## Budget line

From results-derive-axho.txt section 4 (grade C: the S366 step's 30-point solves doubled, 7u's S366 runs, A6RS's and BO's logs): J1 about 2.45 h, J1X about 2.13 h, J2 about 1.17 h, J3 about 1.61 h, J4 about 1.15 h; on four cores, J4 when the first job ends, the wall about 2.45 h; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: S366's deaths.** Its survival is judged at 98, 99.85 and 100 by world from 7u's mixture (99.6); if world 0 holds fewer deaths, item 1 reads few discordant paths, a HELD there weak (the differing moves printed beside), and a chance loss of 10 paths in a world reads harm (the power section).
- **Second: the stories after the preflight.** The JUDGED block for S366 was written after its 30-point step was seen (its moves differing, its survival 40 of 40 a world); the credences lean on judged gaps for a reference never read on S366 at 60 points.
- **Third: the engine leg.** S366's bridge records will likely miss the band as S380's did, so the leg runs on S360 alone and O165's read stays on one household.
- **Fourth: the projection.** S366's 60-point solve is the 30-point one doubled and its runs 7u's at 30 points (grade C); the wall may pass 2.45 h.
- **Fifth: one seed (7004) and two households, S360 the design household.**

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.77 (43 of 55), EFFECT 0.71 (19 of 26), ATTRIB 0.46 (36 of 78), SIZE 0.53 (24 of 45), CTRL 0.79 (18 of 22), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.40 (13 of 33)); the priors state why they move from it, and an item resting on a deep review's ranked cause or story starts from that record's rate, not the review's own probability.

Items 1 and 4 are no-harm items (NOHARM, 0.77), derived at 0.74 and 0.70; items 2 and 3 rest on the deep review's story that the reference reads a held-out household at its runs with a small residual, so each starts from a deep review's story rate, 0.40; the derivation takes READ at that rate (section 3b; section 3 at the receipt's own start beside) through the JUDGED stories and section 2's power.

- **Base rate, item 1:** 0.77 (NOHARM)
- **Base rate, item 2:** 0.40 (a deep review's story: the reference reads the held-out household at its runs)
- **Base rate, item 3:** 0.40 (a deep review's story: the bridge residual small out of sample)
- **Base rate, item 4:** 0.77 (NOHARM)
- **Item 1:** HELD 0.74, INCONCLUSIVE 0.13, FALSIFIED 0.12 (derived, results-derive-axho.txt section 3b)
- **Item 2:** HELD 0.60, INCONCLUSIVE 0.40, FALSIFIED 0.00 (derived)
- **Item 3:** HELD 0.58, INCONCLUSIVE 0.23, FALSIFIED 0.18 (derived)
- **Item 4:** HELD 0.70, INCONCLUSIVE 0.26, FALSIFIED 0.04 (derived)
- **Judged:** none (the judged inputs are derive-axho.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 NOHARM, 2 ATTRIB, 3 ATTRIB, 4 NOHARM

## Changes after seeing results

None.
