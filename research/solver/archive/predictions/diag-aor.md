# Prediction: diag-aor

- **Run:** `research/solver/batch-aor.sh` - results/diagaor/case0.txt to case2.txt and their files (audit-aor.mjs: AOP and ARS, S364 at 60 wealth points and six shares under `readerRef: 'adaptive'`, the default split with the year-0 read at P decomposed node by node, and `readerSplit: 'rs'`; audit-an.mjs with AN_JOB=A6RS: S360 at NODE-AX's BO settings under the adaptive reference and the RS split; the candidate's own unit, 4,000 paths a world, seed 7002), read by `reduce-aor.mjs` in the real tree into results-aor.txt against AO's and A6's saved files behind AO's gate
- **Kind:** test
- **Written:** 16 Oct, before the run (its time is its registering commit's, git log); the deep review after AO (deep-review-log.md 16 Oct 05:36 UK) and its adoption (PLAN.md's 16 Oct 05:36 row; the plan-auditor's PASS of 16 Oct 06:10 UK)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world, AO's and A6's, so AOP's runs repeat AO's path by path, ARS's pair with AO's and A6RS's with A6's; the tail check's and the engine run's draws as AO's (the tuning seed scaled by a thousand plus 50, 60 and 70 plus the world), so no registry seed is used as a state
- **Unmasking:** AOR reads a known error, the copied residual R at S364's copied corners (O169, F1: by the deep review's bound most of world 0's over-read under the adaptive reference), and the fix it tests, the RS split under the adaptive reference (ARS, A6RS), removes most of R where the queried state's chance sits under the corners'. That error drives S364's world-0 table up; removing it may unmask the reference's pessimistic tail p in world 0 (O165: p under its own moves run in the engine there), which item 2 reads as FALSIFIED under; on S360 a harm in A6RS's runs (item 4 not HELD) is not the split's until a decomposition splits it (RULES.md section 9 rule 1), and A6RS against A6 is O151's decomposition under a reference free of ORDER's gap
- **Mechanism:** src/solver/grid.js:419 "const v = pr * cc + rr;" (the read: the queried state's own chance times the corners' c, plus their R); src/solver/grid.js:417 "if (g.reader.rs) { for (let k = 0; k < NC; k++) {" (ARS and A6RS: each corner's R scaled to the query's chance); src/solver/reader.js:97 "if (p[i] >= ((g.reader && g.reader.line) || 0.5)) { sup[i] = 1; c[i] = Math.min(1, Math.max(0, S[i] / p[i])); }" (a corner under the support line is copied); src/solver/solve.js:671 "if (adaptiveRef) return adaptiveRef.chance(k, t, bills, ai0);" (the adaptive reference); the derive line prints how often it applies: every year-1 read the year-0 score at P makes, node by node (AOP's and ARS's decomposition)
- **Plan section:** PLAN.md "AREF" (AOR), O151, O165, O169, O170, O171; the deep review after AO (deep-review-log.md 16 Oct 05:36 UK)

## Question

Does the copied residual R carry S364's world-0 over-read under the adaptive reference - is the read without it, the deletion term, near the runs (O169-COPY) or still far over them (the continuation, the post-access survival or the state's own chance) - and does the RS split under the adaptive reference read S364 at its runs in all three worlds (ARS) without harming S360's runs (A6RS)?

## Derivation

- **What the records say:** AO read S364's P in world 0 at ln 2.99 over its 37 runs of 40,000 and in worlds 1 and 2 at ln 0.48 and 0.02 (results-ao.txt; results-derive-aor.txt section 1); the deep review after AO bounded R from AO's printed probe lines (deep-review-log.md 16 Oct 05:36 UK, grade C): R at least 0.59, 0.12 and 0.010 of the equal-weighted read by world, and, if the state's own chance rises with the return node (judged 0.9), the read without R at most ln 2.31 over world 0's runs. The probe line AO printed as R's share does not measure R's part of the read (O170); AOP prints the read's own decomposition, refusing unless it sums to the table.
- **What AOR changes, and nothing else:** AOP is AO re-solved on the same code (its tables AO's to the printed digit and its P and D runs AO's first 4,000 bit for bit, both gated); ARS changes AO's split alone; A6RS changes A6's split alone (A6's saved files, behind AO's gate, on the same paths; A6's preflight job reruns on this code bit for bit, A6-off).
- **The causes' predictions, by the 05:36 receipt's map for O169's carrier:** O169-COPY, the deletion term within ln 2 of the runs (item 1 HELD), ARS's world 0 near its runs or between the lines; O169-CONT, POST and PTAIL, the deletion term still past ln 3 over (item 1 FALSIFIED over), ARS's world 0 too; O169-QUAD a part; O169-OTHER anywhere. The judged stories (derive-aor.mjs's JUDGED block, committed before its output) build ARS's tables from the deletion term plus the share of R the split keeps (about the state's chance over the copied corners' p, near 0.15 at world 0's year-1 reads by AO's probe lines), so ARS's world 0 reads within ln 2 only if the split removes nearly all of R.

## Prediction

Item 1 most likely FALSIFIED (0.44, over: the read without R still past ln 3), INCONCLUSIVE next (0.34), HELD 0.22; item 2 FALSIFIED (0.69, over: the split keeps enough of R to leave world 0 past ln 3); item 3 HELD (0.93: ARS's worlds 1 and 2 within ln 2); item 4 HELD (0.89: no material harm to A6RS's runs). The figures are the derivation's with the leading cause at the record's rate (results-derive-aor.txt section 3b); as the receipt states its credences, item 1 is HELD at 0.42 (section 3).

## Falsified if

Item 1 FALSIFIED: the deletion term at P in world 0 wholly at or beyond +ln 3 over AO's runs (the read without R still over-reads: O169-CONT, POST or PTAIL) or wholly at or beyond -ln 3 under them (the read needs part of R). Item 2 FALSIFIED: ARS's world-0 read wholly past ln 3 over its runs (the split leaves the over-read) or under them (O165's pessimistic tail unmasked). Item 3 FALSIFIED: ARS's world 1 or 2 wholly past ln 3 either way. Item 4 FALSIFIED: A6RS's runs worse than A6's by the margin in world 0 or 1 (harm, Holm-adjusted).

## Fair-test table

AOP against AO (the same code, paths and settings; AOP re-solved with the read decomposed, its tables and runs gated equal to AO's), ARS against AOP (the split differs), A6RS against A6 (AO's saved job, behind AO's gate; the split differs).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | P on 4,000 paths a world (AOP, ARS) | P on 40,000 (AO) | ACCEPTED - item 1 reads AO's 40,000 runs (AOP's first 4,000 gated equal to them); items 2 and 3 read AO's 40,000 only where ARS's first 4,000 are AO's bit for bit in that world, else ARS's own 4,000, printed |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | readerSplit 'rs' (ARS, A6RS) | the default split (AOP, A6) | TESTED - the thing items 2 to 4 are about; item 1 reads AOP's own decomposition |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (audit-an.mjs's AN_JOB=A6RS switch; audit-aor.mjs new) | this code (AO, A6: code d2a982e80436) | ACCEPTED - AOP's tables and runs are gated equal to AO's at 60 points; A6's preflight job reruns on this code bit for bit (A6-off) |
| 30 | The reducer and its version | reduce-aor.mjs | reduce-ao.mjs's gate over AO's files | ACCEPTED - each arm's files pass their own gate; the items read per-path arrays and bits saved the same way |
| 31 | Paired or not, and the standard error used | per read (items 1 to 3); paired by path (item 4) | paired by path (item 4) | ACCEPTED - items 1 to 3 read a table against its runs (an exact interval on the count); item 4 the exact conditional McNemar on the same paths |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** items 1 and 2, ln(read / runs) with the exact (Clopper-Pearson) interval on the run count at 1 - 0.05 (one world each); item 3, per world, at 1 - 0.05 / 2 (two worlds), a count of 0 with no upper end; item 4 by stats.mjs's exact conditional McNemar interval and outcome at the margin marginFor(A6's survival) with Holm across worlds 0 and 1; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look):** the deletion term at P in world 0 (AOP's sum q pr c, points) against AO's runs there (37 of 40,000): HELD when its interval sits inside [-ln 2, +ln 2]; FALSIFIED when it lies wholly at or beyond +ln 3 (over) or -ln 3 (under), the side printed; INCONCLUSIVE otherwise.
- **Item 2 (single look):** ARS's read at P in world 0 against its runs (AO's 40,000 where ARS's first 4,000 are AO's bit for bit, else ARS's own 4,000), as item 1.
- **Item 3 (single look):** ARS's read at P in worlds 1 and 2, the runs as item 2's: HELD when both intervals sit inside [-ln 2, +ln 2]; FALSIFIED when either lies wholly past ln 3 either way; INCONCLUSIVE otherwise.
- **Item 4 (single look):** no material harm to A6RS's runs against A6's, worlds 0 and 1: HELD when both read no material harm, FALSIFIED when either reads harm, INCONCLUSIVE otherwise.
- **The causes, by the registered map (O169's carrier):** O169-COPY held on item 1 HELD; not held on item 1 FALSIFIED over, where O169-CONT, POST and PTAIL stay open between them (AOP's reads node by node print c and the state's own chance beside the runs); item 1 FALSIFIED under reads R as partly real (COPY not held, the over-read's carrier open); open otherwise. The arm reaches the mechanism: the decomposition sums to the table in every world (decompTook), and ARS's reads print R scaled beside AOP's.
- **Reported, not items:** AOP's and ARS's reads node by node (q, pr, c, R, v) with their deletion and residual and R's part of the read; ARS's tables beside AOP's; the bit matches; AOP's tail check with the engine run at the record's and at the typical sheltered cash (O165: under O165-CASH the signed cells shrink at the typical cash); A6RS's GB beside A6's and BO's (O151), its ledger by year, luck-adjusted T and QF by year, its runs against BO's.
- **Declared choices, not derived:** the deep review's lines for items 1 to 3 (ln 2 and ln 3, AO's); item 4's margin, the regimen's; world 0 deciding items 1 and 2 (its over-read the question) and worlds 1 and 2 item 3; ARS's runs from AO's 40,000 when the first 4,000 match bit for bit (the deep review's design, declared).

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1 to 4 HELD (R1) | R carries S364's world-0 over-read and the RS split under the adaptive reference reads S364 within a factor 2 in every world without harm on S360: the split chosen for the steps before a reference default (S380 paired against the order reference, a held-out seed, the build time, a test file, the panel under 7u-F) | 0.01 |
| item 1 HELD, the rest not all HELD (R2) | R carries the over-read (O169-COPY held) but the RS split does not read S364 within a factor 2 in every world, or harms S360: the deep review designs the split (a scaled R, R removed at copied corners, or the copy rule) before any default | 0.21 |
| item 1 FALSIFIED over, item 4 not FALSIFIED (R3) | the read without R still over-reads S364's world 0 past a factor 3: O169-COPY not held; the deep review reads the carrier among the continuation, the post-access survival and the state's own chance (AOP's reads node by node) | 0.43 |
| item 4 FALSIFIED (R4) | the RS split harms S360's runs under the adaptive reference: a decomposition before anything is carried (RULES.md section 9 rule 1); no split chosen | 0.02 |
| else | the deletion term between the lines or under them: the deep review reads AOP's reads node by node and the engine run; nothing built | 0.33 |

- **Waiver:** none needed: the chance the action changes is 0.57 (one less 0.43, the likeliest row), above a quarter
- **The rows' credences are the JUDGED stories' at the record's lead rate (results-derive-aor.txt section 3b; as the receipt states them, section 3: R1 0.03, R2 0.38, R3 0.15, R4 0.02, else 0.43).**
- **The escalation rule (escalation.md, trigger 3):** the run is under 2 hours' wall (about 1.37 h, results-derive-aor.txt section 4), so trigger 3 does not apply; trigger 1 is not met (triggers.mjs --due: AN HELD, AO HELD)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD settles O169-COPY as held (grade B, one household, one seed); FALSIFIED over settles it as not; FALSIFIED under reads R as partly real; inconclusive names the side.
- **Item 2:** HELD says the RS split reads S364's world 0 within a factor 2 under the adaptive reference; FALSIFIED over says it leaves the over-read; FALSIFIED under records O165's tail unmasked; inconclusive names the side.
- **Item 3:** HELD says the split keeps worlds 1 and 2 within a factor 2; otherwise names the world.
- **Item 4:** HELD says the split costs S360 no material survival under the adaptive reference; FALSIFIED (harm) sends a decomposition; inconclusive names the world.
- **In every branch:** no product change; the candidate's settings unchanged; no reference default and no split chosen as one (the 05:36 row's STOP until AOR reads, and after it a decision of its own); 7u-F held.

## Provenance

- **The design:** the deep review after AO (deep-review-log.md 16 Oct 05:36 UK) proposed AOR's three jobs, its items and its reported lines; its adoption (PLAN.md's 16 Oct 05:36 row, the plan-auditor's PASS of 16 Oct 06:10 UK) and the maintainer's 'Go ahead' to building, registering and running AOR.
- **The build:** audit-aor.mjs (audit-ao.mjs copied: the decomposition of the year-0 read at P node by node with decompTook, the tail check with the engine run at the record's and the typical sheltered cash, plants arm, force, weights and rs); audit-an.mjs's AN_JOB=A6RS (in place, no line moved); reduce-aor.mjs (48 planted checks, each item to all three outcomes, four EDGES; the stamp split by audit run in its preflight mode too, AO's STAMPS line; AOP gated to AO's tables and runs; AO's files behind AO's gate); mutate-reduce-aor.py (30 of 30 caught, results-reduce-aor-mutations.txt and results-mutation-history.txt); derive-aor.mjs; preflight-aor.sh, preflight-aor-rs.sh, batch-aor.sh (commits be8e5be, ad9b289, 475d777). No solver change; the code is AO's (d2a982e80436).
- **Seen before registration (declared):** AO's results and files and the deep review after AO's reads of them (grade C). The preflights' lines: at 4 points every copied corner is dead (R about 0.00007 points of every world's read, AOP's and ARS's decompositions), so the first step's rs plant could not show (the CORNERS line); at 30 points ARS's decomposition reads world 0's table at 0.0651 points with R after the RS scaling 0.00034 points, where the rs plant's unscaled read puts R at 1.0213 points (results-aor-preflight-rs1.txt): the split removes nearly all of world 0's R at half the points, a preview of item 2's mechanism that the JUDGED stories (a kept share of 0.05 to 0.3, committed before it in be8e5be) did not have; the registered credences stay the derivation's, and item 2's FALSIFIED 0.69 rests on stories judged before this preview (the pre-mortem's first point). The same 30-point run prints ARS's world-0 deletion term at 0.064743293 points, item 1's quantity on the RS split's re-solved tables rather than AOP's: against AO's world-0 runs (37 of 40,000) about ln -0.36, inside ln 2, so item 1 too is expected to miss toward HELD (its registered FALSIFIED 0.44, HELD 0.22), unless AOP's default-split tables carry a larger deletion term than ARS's (the plan-auditor's MINOR 1 of 16 Oct 08:33 UK). No figure at 60 points.
- **The preflights** (through the launcher; seed 7002, 40 paths a world): the first step (runs.log 16 Oct 06:53 UK, on be8e5be; a fifteenth of the points; results-aor-preflight-aor.txt): SMOKE PASSED; "A. bn-off: file identical (593570 bytes of JSON), log identical (227 lines)" (compare-preflight.mjs's label; the file compared is A6's, S360-A6-P60S6Q5.json.gz, against AO's second preflight); AOP, ARS and A6RS exit 0; armTook, adaptTook, pairTook, forceIdentity 40/40 and decompTook 3/3 on AOP and ARS (each world's sum equal to its table to the printed nine places); A6RS's refTook 33/33, ownTook and identity 120/120, qfTook and layerTook 796/796; "B. GATE: passed" (reduce-aor.mjs --preflight, its stamp split by audit on these logs); the plants arm (AOP's armTook), weights (AOP's decompTook), force (ARS's forceIdentity) and A6RS's arm (armTook) each refused on its own check; rs passed, every copied corner dead at 4 points. The second step at 30 points (runs.log 16 Oct 07:16 UK on ad9b289, failing itself on an alive test that read R after the scaling, results-aor-preflight-rs1.txt; rerun 16 Oct 07:52 UK on 475d777): ARS exit 0 with decompTook 3/3, and the rs plant refused on decompTook with world 0's unscaled R at 1.0213 points.

## Derivation script

- `derive: research/solver/derive-aor.mjs > research/solver/results-derive-aor.txt sha256 b791a9b8723ccc3f`
  (AO's files behind AO's gate and NODE-AX's BO; the power of items 1 to 4 through reduce-aor.mjs's own items() at AO's runs; the credences from the 05:36 receipt's CAUSE CREDENCES for O169's carrier through the JUDGED stories, committed before the output in be8e5be, as stated (section 3) and with the leading cause at the record's rate read from results-scorecard.txt (section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget)

## Point and interval

- **Item 1:** 1.4000, ln(deletion / runs) at P in world 0 (results-derive-aor.txt section 3b); 80% interval -0.2000 to 2.3000
- **Item 2:** 1.8609, ARS's ln(table / runs) at P in world 0 (results-derive-aor.txt section 3b); 80% interval 0.8181 to 2.4753
- **Item 3:** 0.1915, ARS's ln(table / runs) at P in world 1 (results-derive-aor.txt section 3b); 80% interval -0.1266 to 0.4168
- **Item 4:** 0.0250, A6RS's runs less A6's in world 0, points (results-derive-aor.txt section 3b); 80% interval -0.2500 to 0.3500

## Power

From results-derive-aor.txt section 2 (40 draws a cell through reduce-aor.mjs's own items(), AO's runs, 37, 164 and 696 of 40,000; A6's churn against BO's):

```
  item 1, ln(deletion / runs) -0.7: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 1, ln(deletion / runs) 0: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 1, ln(deletion / runs) 0.7: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 1, ln(deletion / runs) 1.5: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 2, the deletion term at ln 0 and the kept share 0.05: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 2, the deletion term at ln 0 and the kept share 0.15: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 2, the deletion term at ln 0.5 and the kept share 0.15: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  churn x0.5 item 4, the runs -0.3 points in both worlds: HELD 0.38 INCONCLUSIVE 0.47 FALSIFIED 0.15
  churn x0.5 item 4, the runs 0 points in both worlds: HELD 0.95 INCONCLUSIVE 0.05 FALSIFIED 0.00
```

Item 1 holds a deletion term within about ln 0.35 of the runs (the interval on 37 runs is about ln 0.33 each way) and reads FALSIFIED from about ln 1.5; between, INCONCLUSIVE. Item 2 holds only when the split keeps under about a twentieth of R. Item 4 reads no material harm unless the runs lose a quarter of a point or more.

## Budget line

From results-derive-aor.txt section 4 (grade C, AO's and A6's case logs on this code): AOP about 1.37 h (AO's solve and build, 24,000 runs, the engine run twice), ARS about 1.30 h, A6RS about 1.3 h; on three cores the wall about 1.37 h; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: the kept share.** ARS's stories rest on a judged share of R the split keeps (0.05 to 0.3); the 30-point preflight, seen after the stories were committed, shows the split keeping a far smaller share of world 0's R (0.00034 of 1.0213 points), so item 2 is likely to read nearer HELD than the derivation says: the registered credence for item 2 is expected to miss on the side of HELD; and ARS's 30-point deletion term (0.064743293 points, about ln -0.36 against AO's world-0 runs) puts item 1 near HELD too, unless AOP's default-split tables read a larger deletion term than ARS's.
- **Second: the bound's premise.** The review's bound on the read without R assumes the state's own chance rises with the return node (judged 0.9); if it does not, the deletion term can sit higher, toward FALSIFIED over, without CONT being the carrier.
- **Third: O165 unmasked.** If the split removes R and the reference's p sits under the engine in world 0 (O165), ARS's world 0 can read under its runs, item 2 FALSIFIED under: a pessimistic tail p, not the split's fault until a decomposition splits it.
- **Fourth: ARS's runs.** Items 2 and 3 read AO's 40,000 runs only where ARS's first 4,000 match AO's bit for bit; a world that does not match reads ARS's own 4,000 and a wider interval.
- **Fifth: one seed (7002) and two households (S364, S360).**

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.77 (42 of 54), ATTRIB 0.47 (36 of 76), CTRL 0.78 (17 of 21), an item leaning on a deep review's cause or story 0.38 (12 of 32)); the priors state why they move from it, and an item resting on a deep review's ranked cause or story starts from that record's rate, not the review's own probability.

Items 1 and 2 rest on the deep review's ranked cause for O169 (O169-COPY) and its prediction for ARS, so each starts from a deep review's cause rate, 0.38; the derivation takes the receipt's leading cause at that rate, the others scaled in the receipt's proportions (section 3b, read from results-scorecard.txt; section 3 prints the receipt's own reading beside), through the JUDGED stories and section 2's power. Item 3 is a control on the split (CTRL, 0.78), derived at 0.93; item 4 starts from NOHARM's rate, 0.77, and is derived at 0.89.

- **Base rate, item 1:** 0.38 (a deep review's cause: the copied residual carries world 0's over-read)
- **Base rate, item 2:** 0.38 (a deep review's story: the RS split reads world 0 near its runs)
- **Base rate, item 3:** 0.78 (CTRL)
- **Base rate, item 4:** 0.77 (NOHARM)
- **Item 1:** FALSIFIED 0.44, INCONCLUSIVE 0.34, HELD 0.22 (derived, results-derive-aor.txt section 3b; FALSIFIED named first, the likeliest)
- **Item 2:** FALSIFIED 0.69, INCONCLUSIVE 0.29, HELD 0.02 (derived; FALSIFIED named first, the likeliest)
- **Item 3:** HELD 0.93, INCONCLUSIVE 0.07, FALSIFIED 0.00 (derived)
- **Item 4:** HELD 0.89, INCONCLUSIVE 0.09, FALSIFIED 0.02 (derived)
- **Judged:** none (the judged inputs are derive-aor.mjs's JUDGED block, committed before its output in be8e5be)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 CTRL, 4 NOHARM

## Changes after seeing results

None.
