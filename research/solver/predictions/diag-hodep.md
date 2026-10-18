# Prediction: diag-hodep

- **Run:** `research/solver/batch-hodep.sh` - results/diaghodep/case0.txt to case3.txt and their files (audit-hodep.mjs, all at 30 wealth points, six shares, five return nodes, the candidate's own unit: K1F, S362 under `readerRef: 'adaptive', readerSplit: 'rs'` with the fix `adaptiveLattice: { foot: true }`; K2, S362 under `readerRef: 'order'`; A and O, the same pair on S370, the deposit household the reach step chose), read by reduce-hodep.mjs into results-hodep.txt, its gate holding K1F to FOOT-S366's saved K1F (results/diagfoot, sha 222b731b04d0ae54)
- **Kind:** test
- **Written:** 18 Oct, before the run (its time is its registering commit's, git log); the deep review after FOOT-S366 (deep-review-log.md 18 Oct 09:43 UK), its adoption (PLAN.md's 18 Oct 09:43 row), the deep-reviewer's design consults on the slimmed design (18 Oct 11:27 UK) and on the derivation's first output (18 Oct 15:09 UK)
- **Seeds:** 7004, the second seed (replication; RULES.md section 8 item 9): its first 4,000 paths a world for every job's ledger, runs and whole score and every paired comparison (engine.mjs pathsForSeed); the reach step ran on paths 4,000 to 4,399 of the same seed, disjoint from the batch's; the screen on paths 0 to 399 under O at 15 points (declared below)
- **Unmasking:** A and K1F carry FOOT-S366's fix of O177's known error, the adaptive reference's p 0 at no accessible money in a year whose inflow pays its bill, which drove S366's world-0 year-4 over-read; on a deposit household the fixed reference may unmask another error at the same corners (the reader's copy and split rules, O179-SECOND, where the corner test cannot see) or move the policy's moves at the inflow year. The arm pair that splits a harm under A or K1F against the order reference: none in this batch (K1, the unfixed reference, is dropped: R1 runs every later test with the fix, the consult of 11:27 UK, Q1), so a harm of item 1 or 2 is NOT SETTLED as the fix's or the reference's until a decomposing run reads it (the unfixed reference against the fixed on the household harmed; on S362 FOOT-S366's saved K1 is the existing half, K1F against K1 reported from FOOT-S366's files behind its gate), and R2 sends it to a diagnosis with the order reference's own cliff error named (J4's GB -3.1 to -5.5 on S360); the corner test (the gate) reads the fix's own values at S362's corners against the reference's own rule run forward, and K1F's GB by year and world beside K2's is reported for the reader's copy and split (O179-SECOND).
- **Mechanism:** src/solver/solve.js:653 "adaptiveRef = opts.readerRef === 'adaptive' ? adaptiveFor(" (the adaptive reference built in place of the order reference's draw orders); src/solver/solve.js:671 "if (adaptiveRef) return adaptiveRef.chance(k, t, bills, ai0); if (opts.readerRef === 'order') {" (the reader's chance taken from one or the other: the thing tested); src/solver/adaptive.js:86 "return footRead(k, t, A, b, gf)" (with the fix, readV reads the A = 0 node at no accessible money and below the lattice's floor); src/solver/adaptive.js:172 "function footRead(k, t, A, b, gf)"; src/solver/solve.js:277 "const MIX3 = { z: [-Math.sqrt(3), 0, Math.sqrt(3)], w: [1 / 6, 2 / 3, 1 / 6] };" (the chooser's world weights, the mixture's); the derive line prints how often the two references move differently per path on S370 at the reach (results-derive-hodep.txt section 1: 23, 12 and 7 of 400 paths by world)
- **Plan section:** PLAN.md "AREF" (HO-DEP, items/HO-DEP.md), O179, O180, O177; the deep review after FOOT-S366 (deep-review-log.md 18 Oct 09:43 UK)

## Question

On deposit households whose bridge is at risk, does the fixed adaptive reference lose no material survival or whole score against the order reference by the mixture the chooser itself weighs, and does it read S362 truer than the order reference?

## Derivation

- **What the records say:** FOOT-S366's K1F on S362 (behind FOOT-S366's gate; HO-DEP's K1F reproduces it): tables 30.5208, 48.5742 and 67.3889 by world against runs 1167, 1996 and 2728 of 4,000, discordant against K1 on 31, 23 and 28 paths (results-derive-hodep.txt section 1). The reach on S370 (30 points, 400 paths a world from path 4,000): A's tables 51.3448, 89.5148 and 98.6865, O's 50.3079, 89.1297 and 98.6252, O's runs 151, 342 and 394 of 400, A's 152, 342 and 394 (results-hodep-reach.txt), the paths whose moves differ 23, 12 and 7 of 400.
- **Where the references can differ:** among the 13 deposit-mid candidates only S370 has a bridge failure under O at 15 points (12, 3 and 1 of 400 by world; results-hodep-screen.txt and its case logs); on S394, S382 and S406 at 30 points A and O are identical to the bit in every world (moves, runs and whole score; results-hodep-reach.txt), every path bridging. So the adaptive reference can move a deposit household's policy only where its bridge is at risk: S362, S366 and S370 of the 15 (S366 identical under both after the fix, FOOT-S366). HO-DEP's finding is scoped to those (the consult of 15:09 UK, Q2).
- **What HO-DEP changes, and nothing else:** on each household the arms differ only in the research reference (the adaptive reference with the RS split and the fix against the order reference); K1F is FOOT-S366's K1F on the same code, settings and paths, and reproduces its saved file on every array both carry (the gate; the preflight, step B, at a fifteenth of the points).
- **Departures from the receipts, declared:** the slim design (the consult of 11:27 UK): K1 dropped, so O179's whole-score leg stays unread and O179 open; both households at 30 points, the product's grid. The consult of 15:09 UK, after the derivation's first output: the first draft's item 3 (A's table within 1.5 points of its runs on HOUSE2) dropped with its row R4, decided by the reach's records (both references over-read S370's world 0 by about 13.6 points on runs that agree but for a few paths: FALSIFIED 1.00 in the first output) and blaming the adaptive reference for an error the order reference shares (O180); the accuracy contrast (now item 3) read on S362 alone, S370's reported (S370's tables 1.04 apart in world 0 with neither within a point of its runs, so its leg could never read truer, worse or alike, and the first draft's FALSIFIED branch was unreachable); item 2's power draw paired (the first draft drew K2's count apart, an unpaired noise of about 0.5 points that inflated item 2's FALSIFIED); the receipt's DEP credences moved (ADVCAL 0.45, NONE 0.30, WORSE 0.17, OTHER 0.08). The first output is kept in git (afeec2c's derive-hodep.mjs and the commit that ran it), as AX-HO's was.
- **The stories:** derive-hodep.mjs's JUDGED block (committed in afeec2c before any of its output and before the reach step's output): per DEP cause A against O on S370 and K2's table error on S362; per O179 cause K1F against K2 on S362. They were written before the consult of 15:09 UK and are read as committed.
- **Power:** through reduce-hodep.mjs's own items() on synthetic reads drawn at each story's values with the reach's and FOOT-S366's counts (section 2).
- **Preflight:** it prints each job's world-0 whole score, the fix's live nodes and every self-check at a fifteenth of the points, K1F against FOOT-S366's preflight K1F, and each plant refused on its own check.

## Prediction

Item 1 HELD (0.88: no material harm on S370 by the mixture, where A changes the moves on about 3% of the paths); item 2 HELD (0.52: no material harm on S362, O179's control; FALSIFIED 0.26); item 3 INCONCLUSIVE (0.67: K2's table error on S362 not wholly beyond a point; HELD 0.33). The decision table's likeliest row is 'else' (0.54), R2 next (0.29). The figures are the derivation's with each cause set's leading cause at the record's rate (results-derive-hodep.txt section 3b; at the receipt's own credences, section 3: items HELD 0.89, 0.59 and 0.34, R1 0.20, R2 0.26, else 0.54).

## Falsified if

Item 1 FALSIFIED: A's survival or whole score against O on S370 reads harm by the mixture (the interval wholly below zero and the point loss at least the margin). Item 2 FALSIFIED: the same, K1F against K2 on S362. Item 3 FALSIFIED: K1F's and K2's tables on S362 within 0.5 points of each other in every world and the fixed not reading truer.

## Fair-test table

A against O on S370 and K1F against K2 on S362, each pair on the same paths (seed 7004's first 4,000 a world), settings, code and points; the arms differ only in the reader's reference.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S362 and S370 | S362 and S370 | ACCEPTED - S362 is FOOT-S366's held-out deposit household; S370 was chosen among the 13 deposit-mid households (not S362 or S366) by the screen (the order reference's own world-0 survival in [20, 80], nearest 50, read on paths 0 to 399, inside the batch's first 4,000: declared in Seeds and in Seen before registration) and the reach (the most MIX3-weighted path-years where A and O move differently, on paths 4,000 to 4,399, disjoint from the batch's); no A-against-O outcome was used to choose; the same households for both arms; S370 is in 7e's 25 and 7u's 55 (a tuning household, not held out), declared |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | K1F, A: readerRef 'adaptive', readerSplit 'rs', the fix | K2, O: readerRef 'order' | TESTED - the reference as one candidate (the adaptive reference with the RS split and the fix) against the order reference; a harm is not split by this batch (the Unmasking field) |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (01abacb478e9, the batch's) | the same; FOOT-S366's saved K1F (sha 222b731b04d0ae54) for the gate | SAME for every compared pair (all four jobs in this batch); FOOT-S366's file is read only by the gate, which K1F must reproduce on every array both carry |
| 29 | The statistic and its definition | survival (the floor rate) and the whole score by path | the same | ACCEPTED - the whole score is reduce-7t.mjs's arithmetic (survival, the capped estate at the run's estate weight, the dislike of cuts, the raise credit) from each run's own trace, held to scorePaths and to runPolicy's own counters on every path (scoreTook's two legs); no resilience term, as the product (PRODUCT_BASELINE resilienceWeight 0) |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | ACCEPTED - items 1 and 2 by the mixture (RULES.md section 8 item 1 as amended for a reference change: each world's guarded unconditional interval combined at MIX3W, and the whole score's paired means combined, both at 98%); item 3 the exact interval on each world's count and the mixture's by variance estimates recovery, for both references |
| 33 | For timings: what else the machine was running | the batch's other jobs, four cores | the same | ACCEPTED - the solves' seconds are reported, not read by an item |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** items 1 and 2, stats.mjs mixtureChange (survival: each world's guarded unconditional interval, held at least as far out as the exact conditional bound at each end, combined at MIX3W [1/6, 2/3, 1/6]) and the whole score's mixture (each world's paired mean with its normal interval, combined at the same weights, stats.mjs mixtureMean's arithmetic), both at MIX_LEVEL 98%, the margin marginRel(the control's mixture survival) in points for both; item 3, each reference's table less its runs on S362, per world the exact (Clopper-Pearson) interval on the count, the mixture's at 95% by variance estimates recovery.
- **Item 1 (primary; single look):** no material harm, A against O on S370: HELD when the survival and the whole score both read no material harm by the mixture; FALSIFIED when either reads harm; INCONCLUSIVE otherwise; each world's survival and whole-score change printed beside, none binding.
- **Item 2 (single look):** the same, K1F against K2 on S362 (O179's control), K1F's GB by year and world beside K2's.
- **Item 3 (single look):** the accuracy contrast on S362 at the mixture: the fixed reads truer when K2's interval lies wholly beyond 1 point either way and K1F's point within 1; worse when K1F's interval lies wholly beyond 1 point and K2's point within 1; HELD when it reads truer; FALSIFIED when the two tables lie within 0.5 points of each other in every world and it does not read truer; INCONCLUSIVE otherwise, the pattern 'worse' its own row. S370's contrast is printed beside, not read.
- **A cause is read only as the items bear on it:** item 3 HELD credits DEP-ADVCAL on S362 over NONE and WORSE; item 3 FALSIFIED reads DEP-NONE; the pattern 'worse' cannot read here (it needs K1F's mixture interval wholly beyond a point, and K1F is seen: reduce-hodep.mjs's accMix over FOOT-S366's K1F tables and runs gives -0.7947, -1.8897 to 0.3000, the plan-auditor's MINOR 1 of 18 Oct 16:53 UK), so DEP-WORSE reaches only 'else' through an INCONCLUSIVE item 3 and R4 cannot fire; item 2 HELD with the corner test's PASS settles O179-FIXOWN 'not' at S362's cells; O179-TRADE and O179-SECOND stay open whatever these items read (the consult of 11:27 UK, Q1); S370's world-0 over-read (O180) is shared by both references and read by no item; OTHER is never credited.
- **Reported, not items:** every world's survival and whole-score change beside the mixture's; every job's tables against its runs by world (S370's both references); K1F's and K2's GB by year and world; the moves and paths differing; the fix's live nodes; the solves; the reach step's A and O tables against the batch's; S370's contrast.
- **Declared choices, not derived:** the mixture's weights (the chooser's own), its level (98%, from the simulation), the margin (marginRel at the control's mixture survival); item 3's lines (1 point and 0.5 point: the consult of 11:27 UK, Q5a); item 3 on S362 alone (the consult of 15:09 UK).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 or 2 FALSIFIED (R2) | harm under the fixed reference against the order reference on a deposit household by the mixture: not the fix's or the reference's until split (the Unmasking field); a diagnosis reads it first - the moves at years 1 to 3 and the GB by year beside, with the order reference's own cliff error named (J4's GB -3.1 to -5.5 on S360) - and the deep review reads it, never a next fix; no default | 0.29 |
| items 1 to 3 HELD (R1) | no material harm on both deposit households at bridge risk by the mixture, and the fixed reference reads S362 truer than the order reference: DEP-ADVCAL credited on S362 (grade B, one household for the contrast, one seed); the steps before a reference default go ahead (7u-F with the adaptive reference, the maintainer's; gate 5, deferred by the maintainer); no default chosen here | 0.17 |
| items 1 and 2 HELD, item 3 FALSIFIED (R3) | no harm, and no accuracy gained on S362 (DEP-NONE): on deposit households the reference changes nothing the user sees; the reference question there closes on the order reference unless the maintainer asks otherwise | 0.00 |
| item 3's pattern 'worse', neither item 1 nor 2 FALSIFIED (R4) | the fixed reference reads S362 worse than the order reference (DEP-WORSE): the deep review reads K1F's GB by year and world before any default; the adaptive reference not put forward on this evidence. This row cannot fire: K1F's mixture interval, seen, spans -1 (the Decision rule's cause line) | 0.00 |
| else | nothing a row above names (item 3 INCONCLUSIVE without 'worse', or an item 1 or 2 INCONCLUSIVE): the deep review reads the unsettled items with the reported lines before the next step; nothing built; no default | 0.54 |

- **The rows' credences are the JUDGED stories' with each set's leading cause at the record's rate (results-derive-hodep.txt section 3b; at the receipt's own credences, section 3: R1 0.20, R2 0.26, R3 0.00, R4 0.00, else 0.54).** R3 reads 0.00 because the judged stories shift K2's table error alike in every world while K1F's own error differs by world (+1.35, -1.33 and -0.81 points), so the tables never sit within 0.5 in every world: a limit of the stories as committed, so DEP-NONE's chance is understated (the Pre-mortem). R4 reads 0.00 for a reason in the test itself, not the stories: it cannot fire (K1F's mixture interval, seen, spans -1; the plan-auditor's MINOR 1 of 18 Oct 16:53 UK).
- **The escalation rule (escalation.md, trigger 3):** the run is under 2 hours' wall (about 1.10 h, results-derive-hodep.txt section 4) and 'else' is 0.54, under 0.6, so trigger 3 does not apply; trigger 1 is not met (AX-HO and FOOT-S366 HELD; triggers.mjs --due)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD says the fixed reference loses no material survival or whole score against the order reference on S370 by the chooser's own weights, where it changes the moves on about 3% of the paths (a weak read: HELD 0.35 at a true -0.5); FALSIFIED names the leg (survival or whole score) and the worlds' lines; inconclusive names the interval.
- **Item 2:** the same on S362 (O179's control); HELD with the corner test's PASS settles O179-FIXOWN 'not'.
- **Item 3:** HELD says the fixed reference reads S362 truer than the order reference; FALSIFIED says it adds no accuracy there; 'worse' says it reads worse.
- **In every branch:** no product change; the candidate's settings unchanged; the fix stays an option of the research reference, off by default (no reference or split default chosen here: a default is the maintainer's decision); 7u-F held (the maintainer's hold of 11 Oct 11:03); O180 open whatever HO-DEP reads.

## Provenance

- **The design:** the deep review after FOOT-S366 (deep-review-log.md 18 Oct 09:43 UK) proposed HO-DEP; its adoption (PLAN.md's 18 Oct 09:43 row) with the maintainer's decision of 18 Oct (a reference change's harm read by the mixture only); slimmed at the maintainer's question and design-consulted by the deep-reviewer (18 Oct 11:27 UK), built with its fixes at the maintainer's go-ahead; revised after the derivation's first output by the deep-reviewer's consult of 18 Oct 15:09 UK (item 3 and R4 dropped; the contrast on S362 alone; item 2's draw paired), under the standing go-ahead (4 Oct) and hand-over (17 Oct).
- **The build:** audit-hodep.mjs (AN's ledger copied, the whole score from each run's own trace with scoreTook's two legs counted and refused apart, R1's guard, floors by the product's rule; plants arm, guard, own, layer, quad, held, score, trace; HOUSE2 S370); select-hodep.mjs, screen-hodep.sh, reach-hodep.sh; reduce-hodep.mjs (58 planted checks, each item to all three outcomes, four EDGES; `--same`); mutate-reduce-hodep.py (43 of 43 caught on the reducer's blob as launched, results-reduce-hodep-mutations.txt); derive-hodep.mjs; preflight-hodep.sh and batch-hodep.sh; stats.mjs mixtureChange, mixtureOutcome and mixtureMean with sim-mixture.mjs (results-sim-mixture.txt); RULES.md section 8 item 1 amended (41980c4).
- **The gate:** the corner test research/tests/adaptive-corner.test.mjs at blob 12f8d78e97dd (design review: 18 Oct 12:06 UK, deep-review-log.md, GATE-READY) printed every verdict PASS (results-adaptive-corner.txt, run 12:19 to 13:09 UK at afeec2c): the base fixture within half its tolerance in every bound slice (A0 0.000, CLIFF 0.294, Y4 0.144 of tolerance), the top fixture reaching O178's case with p finite everywhere, the plants caught each in its own slice (foot 19.92 times its tolerance in A0, drift 4.72 times in CLIFF and Y4, top 54 of 54 year-4 cells non-finite); reported by design, not bound: SMOOTH at most 0.299 of tolerance, INCELL 0.4445 inside the cliff's step cell (the lattice's smear of a step, the design review of 11:52 UK).
- **Seen before registration (declared):** FOOT-S366's saved files and results (K1F's data is seen: HO-DEP's K1F reproduces it, so item 2 is half seen and item 3's K1F side wholly); the screen (O at 15 points on paths 0 to 399 of the 13 candidates, results-hodep-screen.txt: the batch's first 400 paths under a different arm, a preview of the control's survival level only); the reach (A and O at 30 points on paths 4,000 to 4,399, results-hodep-reach.txt: the batch's own tables, A's and O's runs on other paths, the moves differing), read by the derivation; the derivation's first output (item 3 FALSIFIED 1.00 as first designed); every preflight line below. Their bearing: S370's runs agree between the references on all but a few paths, pointing item 1 to HELD; S370's tables say nothing of S362.
- **The screen and the reach** (through the launcher, PREDICTION="none:..."): the screen (runs.log 18 Oct 12:34 UK, done 13:51 UK): five of 13 in [20, 80] (S394 43.50, S382 57.25, S406 59.00, S370 39.75, S418 62.75), REACH: S394,S382,S406,S370; the reach (runs.log 13:52 UK, done 14:59 UK): every self-check in full on the eight jobs; A and O identical to the bit on S394, S382 and S406; S370 42 paths and 148 path-years differing over three worlds (MIX3-weighted 47.67), CHOSEN: S370.
- **The preflight** (through the launcher, seed 7004, 40 paths a world; results-hodep-preflight.txt): the second launch (runs.log 18 Oct 16:14 UK, on the audit and reducer as registered): SMOKE PASSED; the four jobs exit 0 with every self-check in full, scoreTook's two legs 120 of 120 on each; (A) the gate passed at a fifteenth of the points (reduce-hodep.mjs --preflight), the fix on K1F and A with 369 A = 0 nodes alive and off on K2 and O; (B) this code's K1F identical to FOOT-S366's preflight K1F on the 132 arrays both carry; (C) the eight plants refused, each on its own check (arm: footTook; guard: armTook, R1's guard; own: ownTook 0/120; layer: identity 48/120; quad: qfTook 409/640; held: layerTook 444/640; score: scorePaths 67/120; trace: counters 53/120). The first launch (runs.log 18 Oct 15:28 UK) passed all but the arm plant, refused by R1's guard ahead of footTook, so footTook was never shown failing; the audit's arm plant now declares K1F unfixed (08aa600; same pattern searched there: audit-foot.mjs has no such guard).

## Derivation script

- `derive: research/solver/derive-hodep.mjs > research/solver/results-derive-hodep.txt sha256 8cedf9a901c55aa6`
  (FOOT-S366's saved K1F behind FOOT-S366's gate and the reach step's S370 behind select-hodep.mjs's choice; the power of items 1 to 3 through reduce-hodep.mjs's own items(); the credences from the CAUSE CREDENCES of the receipt of 18 Oct 15:09 UK, read from the log, through the JUDGED stories committed before the output, as stated (section 3) and with each set's leading cause at the record's rate read from results-scorecard.txt (section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget)

## Point and interval

- **Item 1:** 0.0125, A's survival less O's on S370 by the mixture, points (results-derive-hodep.txt section 3b); 80% interval -0.3208 to 0.2333
- **Item 2:** -0.1042, K1F's survival less K2's on S362 by the mixture, points (results-derive-hodep.txt section 3b); 80% interval -0.4333 to 0.1542
- **Item 3:** 0.4053, K2's table error less K1F's on S362 by the mixture, each in absolute points (above zero: the fixed reads truer) (results-derive-hodep.txt section 3b); 80% interval -0.7947 to 4.2053

## Power

From results-derive-hodep.txt section 2 (40 draws a cell through reduce-hodep.mjs's own items(); S370's O at the reach's survival, 4,000 paths a world; S362's K1F at FOOT-S366's runs):

```
  item 1, A's survival less O's by the mixture -0.7: HELD 0.10 INCONCLUSIVE 0.60 FALSIFIED 0.30
  item 1, A's survival less O's by the mixture -0.5: HELD 0.35 INCONCLUSIVE 0.63 FALSIFIED 0.03
  item 1, A's survival less O's by the mixture -0.3: HELD 0.95 INCONCLUSIVE 0.05 FALSIFIED 0.00
  item 1, A's survival less O's by the mixture 0: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 2, K1F's survival less K2's by the mixture -0.5: HELD 0.05 INCONCLUSIVE 0.47 FALSIFIED 0.47
  item 2, K1F's survival less K2's by the mixture -0.3: HELD 0.23 INCONCLUSIVE 0.75 FALSIFIED 0.03
  item 2, K1F's survival less K2's by the mixture 0: HELD 0.95 INCONCLUSIVE 0.05 FALSIFIED 0.00
  item 2 at no survival change, the whole score -0.4 beside: HELD 0.07 INCONCLUSIVE 0.63 FALSIFIED 0.30
  item 3, K2's table less runs on S362 -5 (K1F's as FOOT-S366 read it): HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, K2's table less runs on S362 -3.5 (K1F's as FOOT-S366 read it): HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, K2's table less runs on S362 -2 (K1F's as FOOT-S366 read it): HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, K2's table less runs on S362 -0.3 (K1F's as FOOT-S366 read it): HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
```

Item 1 reads no material harm at no change and down to a third of a point lost; at half a point it is mostly inconclusive (A moves about 3% of S370's paths). Item 2 holds a true zero (0.95) and falsifies at half a point lost half the time, or at a whole score 0.4 points down a third of the time. Item 3 holds when K2 under-reads S362 by 3.5 points or more at the mixture and is otherwise inconclusive: K1F's own error differs by world, so the tables never sit alike in every world under these stories.

## Budget line

From results-derive-hodep.txt section 4 (grade C: FOOT-S366's K1F on S362 at 30 points, solve 2313 s and its ledger on 12,000 paths 1638 s; the reach's O solve on S370 1441 s): K1F and A about 1.10 h each, K2 and O about 0.86 h each; four jobs on four cores, the wall about 1.10 h; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: R3's zero credence is the stories', not the world's.** The JUDGED stories shift K2's table error alike in every world while K1F's own error differs by world, so item 3 cannot read FALSIFIED under them; DEP-NONE may read where the registered credence says 0.00, and a miss toward it is expected to be large. R4 cannot fire at all (K1F's interval spans -1), so DEP-WORSE shows only as an INCONCLUSIVE item 3 with K2 the truer.
- **Second: item 1 is weak.** A changes S370's moves on about 3% of the paths, so a HELD there caps the harm it could show (HELD 0.35 at a true -0.5) and speaks for S370's at-risk paths only.
- **Third: K1F's data is seen.** HO-DEP's K1F reproduces FOOT-S366's; item 2's control K2 is new, and item 3's K1F side is wholly seen.
- **Fourth: the stories after the records.** The JUDGED block was written after FOOT-S366's read and the deep review, before the reach; the consult of 15:09 UK moved the DEP credences after the reach and the first output (grade D).
- **Fifth: S370's shared over-read.** Both references over-read S370's world 0 by about 13.6 points (O180); a reference's accuracy on S370 is not read, and a later fix of O180's carrier may move both references' S370 tables.
- **Sixth: one seed (7004), two households, one of them a tuning household (S370, in 7e's 25).**

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.78 (46 of 58), EFFECT 0.71 (19 of 26), ATTRIB 0.47 (39 of 83), SIZE 0.53 (24 of 45), CTRL 0.79 (18 of 22), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.42 (14 of 34), with FOOT-S366's lead, O177-FOOT, settled held before this was written (the plan-auditor's MINOR 3 of 18 Oct 16:53 UK)).

Items 1 and 2 are no-harm items (NOHARM, 0.78): item 1 derived at 0.88 (A moves few of S370's paths), item 2 at 0.52 (the O179 stories' SECOND and OTHER carry a loss); item 3 rests on the deep review's leading DEP cause (ADVCAL: the fixed reference reads truer), so it starts from a deep review's cause rate, 0.42, and the derivation takes ADVCAL at that rate (section 3b), derived 0.33.

- **Base rate, item 1:** 0.78 (NOHARM)
- **Base rate, item 2:** 0.78 (NOHARM)
- **Base rate, item 3:** 0.42 (a deep review's cause: the fixed reference reads S362 truer)
- **Item 1:** HELD 0.88, INCONCLUSIVE 0.07, FALSIFIED 0.05 (derived, results-derive-hodep.txt section 3b)
- **Item 2:** HELD 0.52, INCONCLUSIVE 0.22, FALSIFIED 0.26 (derived)
- **Item 3:** HELD 0.33, INCONCLUSIVE 0.67, FALSIFIED 0.00 (derived)
- **Judged:** none (the judged inputs are derive-hodep.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 NOHARM, 2 NOHARM, 3 ATTRIB

## Changes after seeing results

None.
