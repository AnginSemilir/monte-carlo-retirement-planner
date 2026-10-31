# Prediction: diag-ao

- **Run:** `research/solver/batch-ao.sh` - results/diagao/case0.txt to case3.txt and their files (audit-ao.mjs: AO, AOL and CO, S364 at 60 wealth points and six shares under `readerRef: 'adaptive'`, the same on a finer reference lattice (320 by 41 cells, 256 draws), and `readerRef: 'order'`, P on 40,000 paths a world on AO and AOL; audit-an.mjs with AN_JOB=A6: S360 at NODE-AX's BO settings, six shares, under `readerRef: 'adaptive'`; the candidate's own unit, 4,000 paths a world, seed 7002), read by `reduce-ao.mjs` in the real tree into results-ao.txt, A6 against NODE-AX's BO behind NODE-AX's gate
- **Kind:** test
- **Written:** 15 Oct, re-registered 16 Oct, before the run (its time is its registering commit's, git log; the first registration, 13bf57d, withdrawn in 9222f57 on the plan-auditor's FAIL of 16 Oct 00:22 UK); the deep review after AN (deep-review-log.md 15 Oct 21:05 UK) and its adoption (PLAN.md's 15 Oct 21:05 row; the plan-auditor's PASS of 15 Oct 21:27 UK)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world, NE-GRID C's and NODE-AX's, so CO's runs repeat NE-GRID C's S364 ORDER path by path and A6's pair with BO's; P on AO and AOL runs the same seed's paths 0 to 39,999 (engine.mjs pathsForSeed: each path its own offset of the seed); the tail check's draws from the tuning seed scaled by a thousand plus 60 plus the world, the engine run's paths from it plus 70 plus the world, the sampled records' choice from it plus 50 plus the world, so no registry seed is used as a state
- **Unmasking:** AO tests the adaptive reference where it was not designed (S364, near-dead: survival 0.05 to 1.55%, NE-GRID C) and at the share count S360's residual was not removed at (six, A6). The known error it removes is the order reference's shape (N2-REF, held on S360 at fifteen nodes, results-an.txt). On S364 the order reference over-read P at 4.9 and 1.7 times its runs in worlds 1 and 2 with a reference under its runs (NE-GRID C's ORDER), so a more accurate reference may unmask the copy rule's residual at the copied corners (AO-COPY): the probe's R share at the year-1 reads is the line that tells that from the reference's own error (the preflight: R about 0.00007 points of a 29-point read at 4 points). On S360 at six shares a harm in A6's runs (item 3 not HELD) is not the reference's until a decomposition splits it (RULES.md section 9 rule 1); its row sends it to the deep review before anything is carried. A6 repeats at six shares the fix that unmasked O160 at fifteen (world 0's under-read outside the grid and quadrature, the 21:05 row): A6's luck-adjusted T, beside BO's, is the line that reads whether it shows again
- **Mechanism:** src/solver/adaptive.js:83 "if (t === TL && plant !== 'step') return A >= astar(b, gf) ? 1 : 0;" (the last bridge year exact); src/solver/adaptive.js:127 "for (let mi = 0; mi < NM; mi++) { let v = 0; for (let k = 0; k < K; k++) v += weights[k] * Q[mi][k];" (one move for every world); src/solver/solve.js:671 "if (adaptiveRef) return adaptiveRef.chance(k, t, bills, ai0);" (the reader's reference swapped); src/solver/reader.js:97 "if (p[i] >= ((g.reader && g.reader.line) || 0.5)) { sup[i] = 1; c[i] = Math.min(1, Math.max(0, S[i] / p[i])); }" (a corner under the support line is copied: on S364 about seven in ten of the year-1 read's weight, the preflight's probe); the derive line prints how often it applies: S364's year-1 reads at P, every corner's status, the probe (REPORTED)
- **Plan section:** PLAN.md "AREF" (AO), O152, O158, O160, O161; the deep review after AN (deep-review-log.md 15 Oct 21:05 UK)

## Question

Does the adaptive reference read S364 - a household where survival sits near zero and most of the read is copied - at its runs within a factor of 2 at P in worlds 1 and 2 (AO), and does it remove S360's bridge-years grid residual at six shares (A6 against NODE-AX's BO: GB -4.1495 and -5.3151) without harm to its runs?

## Derivation

- **What the records say:** on S364 at six shares NE-GRID C's ORDER read P at ln 1.58 and 0.54 above its runs in worlds 1 and 2 (12 and 62 of 4,000) and NE-GRID C's BASE at ln 2.24 and -0.14; NE-EDGE's RZ and RS under the fixed-mix reference read it at ln -2.47 and -1.94 (results-derive-ao.txt section 1: the over-read removed and an under-read made); P's runs carry the same bits under all four in worlds 0 and 1 (section 1), so the reader barely moves them. On S360 the adaptive reference took BN's GB from -1.77 and -2.07 to 0.03 and -0.12 at fifteen nodes (results-an.txt); BO at six reads -4.15 and -5.32 under the order reference.
- **What AO changes, and nothing else:** AO and A6 change the reader's reference against controls on the same code (CO) or on the same paths (BO: NODE-AX's saved job; BO on this code is shown bit for bit at the preflight scale, BO-off); AOL changes AO's reference lattice only. The re-solve changes the tables, so the policy may move: item 3 reads A6's runs against BO's, and S364's runs are reported only (7u-F's STOP: no survival item on S364).
- **The reference's correctness is read in the run, in log terms on S364:** refTook's absolute floor (0.01 plus three standard errors) passes a tail p ten times wrong (the 21:05 receipt's premise 3), so AO and AOL print a tail check: per world and p-decade, 25 sampled records' mean p against the reference's own rule run forward at 100,000 runs a state, and the same records run in the engine under the reference's own moves (the engine run), each in log terms with an exact interval. Reported, not refusing: a TAIL cause shows as an under-read with the tail check off (and AOL's read nearer its runs); a MODEL cause as an under-read with the tail check on and the engine run off. The drift plant is flagged at the preflight (7 of 12 cells off, against none unplanted).
- **The causes' predictions, by the 21:05 receipt's map:** AO-REF, items 1 and 2 HELD; AO-COPY, item 1 FALSIFIED over with R's share material at the year-1 reads; AO-DENSITY, item 2 FALSIFIED under; AO-TAIL, item 1 under with the tail check off; AO-MODEL, item 1 under with the tail check on and the engine run off; AO-OTHER anywhere. The judged stories (derive-ao.mjs's JUDGED block, committed before its output) carry these into the credences through the reducer's own items(). The receipt's item 4 (the RS split, ARS) was dropped at the first preflight: under the adaptive reference the copied residual R is 0.00007 points of a 29-point year-1 read, so ARS's tables equalled AO's to 6e-6 points (an arm equal to its control, a design fault: results-ao-preflight1.txt); AOL took its core.

## Prediction

Item 1 most likely INCONCLUSIVE (0.38: AO's read at P between a factor 2 and 3 of its runs, or its interval across a line), HELD next (0.33), FALSIFIED 0.29 (over the likelier side); item 2 INCONCLUSIVE (0.55: A6's GB lifted toward zero with its interval not inside half a point), HELD 0.30; item 3 HELD (0.78: no material harm to A6's runs). The figures are the derivation's, with the leading cause at the record's rate (results-derive-ao.txt section 3b).

## Falsified if

Item 1 FALSIFIED: AO's ln(table / runs) at P wholly at or beyond +ln 3 in world 1 or 2 (the read over its runs: AO-COPY's side if R's share is material, otherwise the deletion term's) or wholly at or beyond -ln 3 (under: TAIL or MODEL, read by the tail check, AOL and the engine run). Item 2 FALSIFIED: A6's GB wholly at or beyond one point either way in world 0 or 1 (under: the matched reference's carry is not share-invariant, AO-DENSITY). Item 3 FALSIFIED: A6's runs worse than BO's by the margin in world 0 or 1 (harm, Holm-adjusted).

## Fair-test table

AO against CO on S364 (the same code, paths and settings; the reference differs), A6 against BO on S360 (NODE-AX's saved job, behind NODE-AX's gate; the reference differs). Item 1 reads AO against its own runs; CO, AOL and BO are reported beside.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | P on 40,000 paths a world (AO, AOL) | P on 4,000 (CO) | ACCEPTED - the first 4,000 are the same paths; the extra 36,000 narrow item 1's interval on S364's small survival; CO's runs are reported, not an item, and item 1 reads AO against its own runs |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | readerRef 'adaptive' (AO, A6; AOL on a lattice of 320 by 41 cells and 256 draws) | readerRef 'order' (CO, BO) | TESTED - the thing this test is about (AOL's lattice reported only) |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (moveAt and moveList added to the reference for the engine run; the AN_JOB switch in audit-an.mjs) | this code (CO); code d297b820d217 (BO, NODE-AX's) | ACCEPTED - BO's preflight job reruns on this code bit for bit, file and log (BO-off, compare-preflight.mjs, in both preflights), so BO on this code is NODE-AX's BO at the preflight scale; CO runs on this code beside AO, and its bits against NE-GRID C's S364 ORDER are reported |
| 30 | The reducer and its version | reduce-ao.mjs | reduce-ao.mjs (CO); reduce-nodeax.mjs's gate over NODE-AX's files (BO) | ACCEPTED - each arm's files pass their own gate; A6's ledger is NODE-AX's code (audit-an.mjs, copied from audit-nodeax.mjs), and the items read per-path arrays saved the same way |
| 31 | Paired or not, and the standard error used | per arm (items 1, 2); paired by path (item 3) | paired by path (item 3) | ACCEPTED - item 1 reads AO's table against its own runs (an exact interval on the count); item 2 A6's own per-path means; item 3 the exact conditional McNemar on the same paths |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** item 1, per world, ln(table / runs) with the exact (Clopper-Pearson) interval on P's count of 40,000 at 1 - 0.05 / 2 (two worlds), a count of 0 with no upper end; item 2, per world, a mean over the 4,000 paths with its interval normal at z = 2.2414 (the 1 - 0.05 / 4 quantile: two worlds, two sides); item 3 by stats.mjs's exact conditional McNemar interval and outcome at the margin marginFor(BO's survival) with Holm across worlds 0 and 1; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look):** AO's read at P against its runs in worlds 1 and 2: HELD when both intervals sit inside [-ln 2, +ln 2]; FALSIFIED when either lies wholly at or beyond +ln 3 (over) or -ln 3 (under), the side printed; INCONCLUSIVE otherwise.
- **Item 2 (single look):** A6's GB (the grid term summed over the bridge years, per path, points) in worlds 0 and 1: HELD when both intervals sit inside [-0.5, +0.5]; FALSIFIED when either lies wholly at or beyond one point either way; INCONCLUSIVE otherwise.
- **Item 3 (single look):** no material harm to A6's runs against BO's, worlds 0 and 1: HELD when both read no material harm, FALSIFIED when either reads harm, INCONCLUSIVE otherwise.
- **The causes, by the registered map:** AO-REF held on items 1 and 2 HELD; AO-COPY held on item 1 FALSIFIED over with R's share at the year-1 reads at a tenth or more in the world that fails, not held there with it under a hundredth; AO-DENSITY held on item 2 FALSIFIED under; AO-TAIL on item 1 FALSIFIED under with the tail check off in a decade P's records reach; AO-MODEL on item 1 FALSIFIED under with the tail check on and the engine run off there; open otherwise. The arm reaches the mechanism: the probe prints every corner's status and R's share at S364's year-1 reads for every job, and AO's tables are printed beside CO's (an arm equal to its control everywhere is a design fault).
- **Reported, not items:** AOL's read at P beside AO's (the lattice: the receipt's premise 2); each S364 job's tables and runs at P, D and its own opening by world, with ln(table / runs) (no survival item on S364: 7u-F's STOP); CO against NE-GRID C's S364 ORDER (bits and tables) and NE-GRID C's S364 BASE beside; the probe; the tail check and the engine run by world and p-decade on AO and AOL; the tier slice (O158: the realised bridge outcome less p by world, year, the move's tiers and band, clustered by path); A6's ledger beside BO's by world and year, its luck-adjusted T (O160: the deep review's control variate on years 0 to 7's shocks) and QF by year (O161); A6's refTook cells.
- **Declared choices, not derived:** the deep review's lines for items 1 and 2 (ln 2 and ln 3; half a point and one point); item 3's margin, the regimen's; worlds 1 and 2 deciding on S364 (world 0's runs are 2 of 4,000, NE-GRID C) and worlds 0 and 1 on S360 (NODE-AX's and AN's); R's share lines for COPY (a tenth and a hundredth, this prediction's); the tail check's flag at ln 1.5 (reported only); AOL's lattice (twice AO's in the accessible money and the draws, this prediction's).

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1 and 2 HELD, item 3 not FALSIFIED (R1) | the matched reference reads S364 within a factor 2 at P and its carry on S360 holds at six shares: N2-REF carried out of sample (grade B, two households, one seed); the deep review, then the maintainer's decision on a reference default (none changed here) | 0.10 |
| item 1 FALSIFIED over, item 2 not FALSIFIED (R2) | the matched reference over-reads S364 past a factor 3: AO-COPY if R's share is material at the year-1 reads, otherwise the deletion term (p or c at the copied corners); the deep review reads which before any reference work; no default | 0.20 |
| item 2 FALSIFIED (R3) | the reference's carry on S360 is not share-invariant (AO-DENSITY on the side under): the deep review; no default; S360's six-share read stays BO's | 0.15 |
| item 1 FALSIFIED under, item 2 not FALSIFIED (R4) | the matched reference under-reads S364 past a factor 3: AO-TAIL if the tail check is off where P's records reach (AOL the check of the lattice), AO-MODEL if it is on and the engine run off; the deep review; no default | 0.05 |
| else (item 1 or 2 INCONCLUSIVE) | a read between the lines: the deep review reads the sides, AOL and the tail check; nothing built | 0.50 |

- **Waiver:** none needed: the chance the action changes is 0.50 (one less 0.50, the likeliest row), above a quarter
- **The rows' credences are the JUDGED stories' at the record's lead rate (results-derive-ao.txt section 3b; as the receipt states them, section 3: R1 0.08, R2 0.21, R3 0.18, R4 0.06, else 0.47):** R2's 0.20 rests on the receipt's COPY credence (0.25, scaled to 0.23), judged before the first preflight's probe showed R near 0 under the adaptive reference at 4 points; the derivation does not shade it (a seen preflight figure is not a registered read), so R2 is likely overstated (the pre-mortem's first point).
- **The escalation rule (escalation.md, trigger 3):** the run is over 2 hours' wall (about 3.44 h, results-derive-ao.txt section 5) and its 'else' row is 0.50, under the 0.6 bar; trigger 1 is not met (triggers.mjs --due: NODE-AX HELD, AN HELD)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD carries N2-REF out of sample to S364 at P (grade B, one household, one seed); FALSIFIED over reads COPY by R's share; FALSIFIED under sends the tail check, AOL and the engine run to split TAIL from MODEL; inconclusive names the world and side.
- **Item 2:** HELD says the reference's carry is share-invariant on S360 (six against fifteen nodes); FALSIFIED under settles AO-DENSITY; inconclusive names the world.
- **Item 3:** HELD says A6's runs lose no material survival against BO's; FALSIFIED (harm) sends a decomposition (RULES.md section 9 rule 1); inconclusive names the world.
- **In every branch:** no product change; the candidate's settings unchanged; no reference default (the 21:05 row's STOP until AO reads, and after it a decision of its own); 7u-F held.

## Provenance

- **The design:** the deep review after AN (deep-review-log.md 15 Oct 21:05 UK) proposed AO's four jobs, its items and its reported lines; its adoption (PLAN.md's 15 Oct 21:05 row, the plan-auditor's PASS of 15 Oct 21:27 UK) and the maintainer's 'go ahead' to building, registering and running AO. One change from it, made at the first preflight: ARS and its item 4 dropped, AOL in its place (above, and results-ao-preflight1.txt). The first registration (13bf57d) was withdrawn before launch on the plan-auditor's FAIL of 16 Oct 00:22 UK (the stale lead rate; the engine run's pattern unregistered) and this one added after results-scorecard.txt's regeneration (9222f57), which check-prediction reads at a prediction's add.
- **The build:** audit-ao.mjs (NE-GRID C's S364 audit copied: the forced pair, the probe on every job, P on ten times the paths; the tail check, the engine run and the tier slice on the adaptive jobs; plants arm, pair, force and drift); src/solver/adaptive.js's moveAt and moveList (the rule's own move, for the engine run; written in place, no line a registered anchor cites moved); audit-an.mjs's AN_JOB=A6 (written in place); reduce-ao.mjs (65 planted checks, each item to all three outcomes, five EDGES; NODE-AX's BO behind NODE-AX's gate; NE-GRID C's files behind its gate for CO's reported comparison); mutate-reduce-ao.py (41 of 41 caught, results-reduce-ao-mutations.txt and results-mutation-history.txt); derive-ao.mjs; preflight-ao.sh, batch-ao.sh (commits f525445, 2ea43bb). The e3pcls pin re-taken on this code (solver-e3pcls.test.mjs, 27 passed; 345170f).
- **Seen before registration (declared):** NE-GRID C's, NE-EDGE's, NODE-AX's and AN's results and files; the 21:05 receipt's reads of them (grade C). The preflights' lines below, at 4 points and 400 P paths a world: AO's tables at P 0.0703, 0.3962 and 1.6838 against runs 0, 0 and 6 of 400 (AOL's 0.0727, 0.3972 and 1.6769), none an item figure; the probe's R near 0 at every world; the tail check's lowest decade, p under its own rule by ln -0.23 to -0.24 on AO and -0.16 to -0.21 on AOL in all three worlds, inside the ln 1.5 flag; the engine run's cells against p, signed by world: ln(p / engine) -0.6077, -0.3847 and -0.2420 in world 0's first three decades and -0.2464 in world 1's third (p under its engine), +1.0868, +0.7138 and +0.1813 in world 2's (p over it; the second flagged off), AOL's of the same signs (O165). No figure at 60 points.
- **The preflights** (through the launcher; a fifteenth of the points, 40 paths a world, seed 7002): the first (runs.log 15 Oct 22:48 UK, on 345170f) and the second (15 Oct 23:34 UK, on 07ed16a, AOL in ARS's place; results-ao-preflight-ao.txt): SMOKE PASSED; "A. bn-off: file identical (593570 bytes of JSON), log identical (191 lines)" (compare-preflight.mjs's label; the file compared is BO's, S360-BO-P60S6Q5.json.gz); AO, AOL, CO and A6 exit 0, armTook, adaptTook (AO and AOL each at its own lattice: 160x41x3 nz 128 in 202.7 s, 320x41x3 nz 256 in 733.4 s), pairTook and forceIdentity 40/40 on S364; A6's refTook 33/33, ownTook and identity 120/120, qfTook and layerTook 796/796; "B. GATE: passed" (reduce-ao.mjs --preflight). The seven plants each refused on its own check: arm (AO's armTook), pair (CO's pairTook), force (CO's forceIdentity), and on A6 arm (armTook), drift (refTook 11/33), choice (refTook 32/33), step (refTook 32/33); the drift plant on AO flagged by the tail check (7 of 12 cells off; the unplanted run none).

## Derivation script

- `derive: research/solver/derive-ao.mjs > research/solver/results-derive-ao.txt sha256 6283f74d760c9d1b`
  (NE-GRID C's, NE-EDGE's, NODE-AX's and AN's files behind their gates; the power of items 1-3 through reduce-ao.mjs's own items() at the records' survival and spread times 0.75, 1 and 1.5; the credences from the 21:05 receipt's CAUSE CREDENCES through the JUDGED stories, as stated (section 3) and with the leading cause at the record's rate read from results-scorecard.txt (section 3b, the registered ones; the plan-auditor's FAIL of 16 Oct 00:22 UK), committed before the output in f525445 and revised, item 4 out, in 2ea43bb; the decision rows; the points and 80% intervals; the reported lines' known answers; the budget)

## Point and interval

- **Item 1:** 0.2837, AO's ln(table / runs) at P in world 1 (results-derive-ao.txt section 3b); 80% interval -0.9824 to 1.7187
- **Item 2:** -0.1069, A6's bridge-years grid residual in world 0, points (results-derive-ao.txt section 3b); 80% interval -1.9757 to 0.4280
- **Item 3:** 0.0500, A6's runs less BO's in world 0, points (results-derive-ao.txt section 3b); 80% interval -0.3000 to 0.3500

## Power

From results-derive-ao.txt section 2 (40 draws a cell through reduce-ao.mjs's own items(); P on 40,000 paths a world at the record's survival, 12 and 62 of 4,000 in worlds 1 and 2; A6 on 4,000 paths at BO's spread, GB sd 8.0269 and 5.3156 in worlds 0 and 1; the rows at 0.75 and 1.5 times each are in the file):

```
  rate x1 item 1, ln -1.1 in both worlds: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  rate x1 item 1, ln -0.5 in both worlds: HELD 0.53 INCONCLUSIVE 0.47 FALSIFIED 0.00
  rate x1 item 1, ln 0 in both worlds: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  rate x1 item 1, ln 0.5 in both worlds: HELD 0.42 INCONCLUSIVE 0.57 FALSIFIED 0.00
  rate x1 item 1, ln 0.7 in both worlds: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  x1 item 2, GB -1.2 in both worlds: HELD 0.00 INCONCLUSIVE 0.42 FALSIFIED 0.57
  x1 item 2, GB -0.3 in both worlds: HELD 0.30 INCONCLUSIVE 0.70 FALSIFIED 0.00
  x1 item 2, GB 0 in both worlds: HELD 0.85 INCONCLUSIVE 0.15 FALSIFIED 0.00
  x1 item 2, GB 0.3 in both worlds: HELD 0.17 INCONCLUSIVE 0.82 FALSIFIED 0.00
  x1 item 2, GB 1.2 in both worlds: HELD 0.00 INCONCLUSIVE 0.28 FALSIFIED 0.72
  churn x1 item 3, the runs -0.3 points in both worlds: HELD 0.17 INCONCLUSIVE 0.55 FALSIFIED 0.28
  churn x1 item 3, the runs 0 points in both worlds: HELD 0.78 INCONCLUSIVE 0.23 FALSIFIED 0.00
```

Item 1 separates a read within about ln 0.4 of its runs (HELD) from one past ln 3 (FALSIFIED); between, INCONCLUSIVE, the else row's route. Item 2 at BO's spread holds a GB of zero at 0.85 and reads FALSIFIED from about 1.2 points either way. Item 3 reads no material harm unless the runs lose a quarter of a point or more.

## Budget line

From results-derive-ao.txt section 5 (grade C): AO about 3.26 h (NE-GRID C's S364 ORDER solve 3,447 s, the reference's build 247 s, 145,000 runs at 0.055 s, the tail check and engine run about 82 s); AOL about 3.44 h (its build 3.6 times AO's at the preflight); CO about 1.34 h; A6 about 1.23 h (BO's solve and ledger, the build and refTook); on four cores the wall about 3.44 h, O120's drift able to triple it; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: R2's COPY share overstated.** The receipt's COPY credence (0.25, 0.23 after the lead's move) carries most of R2's 0.20; the first preflight's probe put R near 0 under the adaptive reference at 4 points, so a COPY over-read is less likely than the derivation says, and an over-read past ln 3 would then point at the deletion term (p or c at the copied corners), a cause outside the receipt's map.
- **Second: the engine run's pattern (O165).** At the preflight the reference's p sits under its own moves run in the engine in worlds 0 and 1 and over it in world 2, by up to about ln 1.09 (a factor near 3): if the fixed context carries that at 60 points, world 2's table rides p over its runs (an over-read through the deletion term, R2's other route) and world 1's under them, which can read item 1 FALSIFIED on either side; the registered map reads it as it stands (COPY by R's share on the over side, an over-read with R under a hundredth left open; TAIL and MODEL by the tail check and the engine run on the under side), and the engine run and AOL are printed beside item 1 as reported lines.
- **Third: the reference's tail (O164).** The preflight's lowest p-decade reads p under its own rule by about a fifth (ln -0.23) on AO and a little less on AOL: how far a tail bias of that size moves item 1 is NOT CHECKED (if the table's deletion term carries it, about the same log amount); the lattice was never swept above AOL's.
- **Fourth: the runs barely move.** P's runs carry the same bits under four readers on the first 4,000 paths; item 1 is then read against near-fixed runs, so it tests the tables, as designed.
- **Fifth: the code.** BO on this code is shown bit for bit at the preflight scale only; CO's bits against NE-GRID C's are reported at 60 points.
- **Sixth: one seed (7002) and two households (S364, S360).**

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.76 (41 of 53), ATTRIB 0.49 (36 of 74), an item leaning on a deep review's cause or story 0.36 (11 of 31), the file regenerated for this registration (the plan-auditor's FAIL of 16 Oct 00:22 UK: it still read 0.32 after AN's settlement); check-prediction reads a prediction's base rates from the scorecard committed at its latest add, this file's re-add, 2332b9b, whose commit had to quote the first add's 0.32 (O166)); the priors state why they move from it, and an item resting on a deep review's ranked cause or story starts from that record's rate, not the review's own probability.

Items 1 and 2 rest on the deep review's ranked cause (AO-REF) and its share-invariance story, so each starts from a deep review's cause rate, 0.36; the derivation takes the receipt's leading cause (AO-REF, 0.30) at that rate, the other causes scaled in the receipt's proportions (section 3b, read from results-scorecard.txt; the JUDGED block's comment, written when the file read 0.32, takes the receipt's 0.30 as at the rate, and section 3 prints that reading beside), through the JUDGED stories and section 2's power. O162's settlements, the gate on quoting the rate: none to make (REF-2 and NODE-1 decided no cause, every id open in results-ref2.txt and results-node1.txt; NODE-AX decided N2-GRID, which no receipt's CAUSE CREDENCES states; grade A, the files' lines). Item 3 starts from NOHARM's rate, 0.76, and is derived at 0.78 from the judged runs' change and churn (AN against BN, the same swap at fifteen nodes).

- **Base rate, item 1:** 0.36 (a deep review's cause: the reference's shape, out of sample; the registered credences start the leading cause there, results-derive-ao.txt section 3b)
- **Base rate, item 2:** 0.36 (a deep review's story: the reference's carry share-invariant)
- **Base rate, item 3:** 0.76 (NOHARM)
- **Item 1:** INCONCLUSIVE 0.38, HELD 0.33, FALSIFIED 0.29 (derived, results-derive-ao.txt section 3b; INCONCLUSIVE named first, the likeliest)
- **Item 2:** INCONCLUSIVE 0.55, HELD 0.30, FALSIFIED 0.15 (derived; INCONCLUSIVE named first, the likeliest)
- **Item 3:** HELD 0.78, INCONCLUSIVE 0.19, FALSIFIED 0.03 (derived)
- **Judged:** none (the judged inputs are derive-ao.mjs's JUDGED block, committed before its output in f525445, item 4's stories taken out before any output in 2ea43bb)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 NOHARM

## Changes after seeing results

- **reduce-ao.mjs corrected after the run, before any figure was read:** the fair-test gate (fair-gate.mjs requireFairLogs) counts each audit script as a version of the code, and AO runs two by design (audit-ao.mjs for the S364 jobs, audit-an.mjs for A6, as the Run line registers), so at the read the gate refused on "more than one version of the code across the logs" (code d2a982e80436 in all four logs) and printed no figure. The reducer now calls the gate on each audit's logs, and its new stampGroups requires exactly two audits, one holding only the S364 jobs and the other only A6, under one code (five planted cases; mutate-reduce-ao.py 45 of 45 caught). The preflight could not see it: the reducer's preflight mode skips the gate (O168). Nothing else in the reducer, the items or this file changed.
