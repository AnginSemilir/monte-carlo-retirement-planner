# The record's catches and misses (external review, 21 Oct 2026)

The tally behind Part A, F9 of the review: every documented case, 24 Sep to 20 Oct, where a safeguard caught a false
result, a wrong figure or a test that could not measure what it claimed (the saves), and every error that got through
or was found late or by chance (the misses), each with its source in `research/solver/`. Compiled for the review by an
independent reader of the records; the counting rule is the tables' rows. Rows are as found, not re-litigated.

**Shorthand used below.**
- RL = review-log.md, DRL = deep-review-log.md, LS = lessons.md, PH = PLAN-HISTORY.md, P = PLAN.md, FFR = drafts/framework-feedback-review.md. All are under research/solver/. "l." is a line number, and times are UK time.
- Mechanisms: AUD = the plan-auditor LLM, DEEP = the deep-reviewer LLM, MECH = a code check (gate, launcher, preflight, smoke run or a check script), MAINT = the maintainer, OUT = an outside review, CHANCE = found while doing something else.

## 1. TRUE SAVES

| # | What was wrong | Caught by | Effect / size | Citation |
|---|---|---|---|---|
| S1 | A solver bug (`runPolicy`) dropped a failed path's below- and above-target totals, so every cut, depth and raise figure on households with failures was biased (since 21 Sep, commit bce958a) | AUD (code against claim, proved from per-path records) | K5 options had been put to the maintainer saying "S070 delivers 3.5–9.2% LESS spending". Corrected: −0.1% to +3.8%. S330 "cuts more at 20 of 24 points" became 0. The maintainer reconfirmed option A on the corrected figures | RL l.31 (24 Sep 15:06); PH l.2607–2608, l.2472 |
| S2 | K5's target was measured under 3 settings different from its cells (market mixture vs single table, uncapped, own pot) | MAINT ("so all the research configuration hasn't tested across three market worlds?") | Target median cut 2.14, not 2.38; raise total 1.07, not 3.18; "the solver now OUT-spends arm A"; M14b moved to the mixture | PH l.2626, l.2517 |
| S3 | M14b's households had been chosen by the solver's own simulated survival on the same seed (7002) it would report on: selection leakage in a test that decides a product default | AUD (first and third reviews) | The held-out seed moved to 7011 before the run. Size not measured | RL l.6 (24 Sep 09:45, finding 3), RL l.8; PH l.2150 |
| S4 | The default "risk above the user's tier ON in every plan" rested on M14 evidence gathered before the M17 objective fix | Plan discipline (marked PROVISIONAL, re-check required) | M14b FALSIFIED it: comfortable plans lose S172 −0.77, S194 −0.27, S162 −0.20 points beyond 2 se. Default changed to 'auto' at 85% | PH l.2629, l.2606; P l.778 |
| S5 | The regimen's exact survival interval was conditional on the number of differing paths, so "no material harm" read too kindly | AUD (84th review, BLOCKING 2) | A true loss exactly at the margin read "no harm" 52.5% of the time against 2.5% nominal. Re-reading: 20 of 7e's 25 "no material harm" reads became inconclusive; 7t's partial cure read as a cure 0.976 vs 0.532. Rule replaced (RULES §8.1) | RL l.165 (26 Sep 20:56); PH l.2726; P l.737 |
| S6 | Pooled fixed-effect floor held too often | AUD (85th review) | 7.1% / 6.1% against 2.5% nominal; replaced by summed cells (2.0–3.2%) | PH l.2659 (O28) |
| S7 | The pooled-floor simulation's random-number generator cycled every 10,466 draws, so "4,000 simulated runs" were a few dozen repeated | AUD (49th review) | Its figures (8–21% vs 0–3%, 92%) were artefacts, already cited in a prediction, in RULES and to the maintainer | RL l.95 (26 Sep 01:07); PH l.2431 |
| S8 | The bridge reader's reference treated the median return as the mean | OUT (Finding 3), before any 7e run | About half a point a year too pessimistic at Medium; fixed with a test | PH l.2437 |
| S9 | The final year was scored as a 5-node "staircase" that could price a tier up at nothing | OUT (24 Sep lead) | The exact final year roughly halved the tier-above cost on comfortable households (−0.21 → −0.09). Now a default (finalIntegral true) | PH l.2649; P l.39 |
| S10 | Three bridge fixes in a row (F1 v2, the reader in 7e, F2 by design) were each blamed for harm that came from another error they unmasked | MAINT ("diagnose first", 26 Sep 11:16), then a decomposition (7r), then DEEP | Stopped F2 being built as the third repeat. 7r: the tier, not the read, carries the harm (S126 lost 15, bridge 4 lost 12 of 3,000 paths). The basis of RULES §9 | PH l.2736, l.2735; DRL l.7 |
| S11 | 7r's first design (the tier-lift share of lost paths) could not separate the causes | AUD (66th review) | "Would have read this FALSIFIED", the opposite of the swap arms | RL l.129; PH l.2735 |
| S12 | reduce-7v took bridge 4's deep-bad paths from S126's 40-year horizon | AUD (94th review), before launch | Only 14 of the 277 selected were bridge 4's true deep-bad paths | RL l.185; P l.733 |
| S13 | 7aq's "smooth" band had no lower bound | AUD, before launch | Would have "sent the margin-against-charge fix up on a false reading". The read then found 3 of the S126 family's 5 in exactly that band | RL l.521 (1 Oct 07:22); LS l.187, l.193 |
| S14 | ADOPT-PI's close read the estate mean as "most households lose" | DEEP | The loss sat on paths ending above 4× opening wealth (94–98% of the change), where the score is flat; the capped estate moved −1,357 to +520. Bears on a shipping-default fix | DRL l.95; LS l.219 |
| S15 | DT-O97's item 2 read the uncapped mean net | DEEP | The shortfall sat entirely above the bequest cap; PCLSI was ahead on capped net, score and median on all 7 | LS l.140 |
| S16 | An unknown tier name silently became the top tier (PLANTIER=Medium ran High) | AUD (12:01), in stage 3b's draft | Stage 3b would have tested nothing; all unknown settings are now refused | PH l.2503; RL l.14 |
| S17 | audit-s126's `ids` mode read the grid size and path count from the wrong arguments | AUD | The replication's library rows ran at 12 points (S122 table 48.3 vs 33.9) | RL l.6 (finding 5); PH l.2521 |
| S18 | A figure written as "raise total 1.07, not 3.42": 3.42 was S354's value and the median is 3.18; another "median" was a mean | AUD | Wrong figures in an evidence cell | RL l.6 (finding 6) |
| S19 | experiment.mjs's default mode rewrote the household band | AUD re-review | Runs by index would have read other households (index 20 became S114, not S126); the band was restored | P l.725 |
| S20 | 7ak's item 4 compared households, not boundary states | AUD | The item could not measure what it claimed | LS l.170 |
| S21 | 7al's per-year spikes were read as years after access when they were plan years; one range was wrong | AUD | A wrong mechanism timing in a ledger row and 2 register rows | RL l.489; LS l.176 |
| S22 | NE-SPLIT's write-up misread item 4 and left out world 2, where most of the loss was | AUD | A misreported verdict | RL l.923; LS l.85 |
| S23 | NE-GRID-C's reducer printed item 8 from item 5's result | AUD | A wrong line, and a crash before the OUTCOME line | LS l.64 |
| S24 | STEP-S370 settled cause S370-COPY "held" when item 4 showed the over-read moved, not removed | AUD (BLOCKING carried over 3 receipts) | A wrong cause settlement, which feeds the calibration scores | RL l.1121; LS l.314 |
| S25 | COPY-X item 4 would have charged SN's known losses to the copy rule | AUD, before launch | A false attribution of harm; redesigned so each arm is read against its own control | RL l.1145; LS l.320 |
| S26 | COPY-W's derivation drew the slice apart from the whole it belongs to | AUD | Item 2 at HELD 1.00 where the coupled draw gives 0.71 | RL l.1157; LS l.328 |
| S27 | FORCE-X as first designed could only read INCONCLUSIVE | DEEP, before launch | Saved a wasted run; the amended test read HELD on S130 | LS l.145 |
| S28 | Code checks catching faults before or at the read: preflights (AN's plants, NE-EDGE's build twice, FORCE-X's carry check), the fair-test gate (NE-REF's post-read rewording, AO's two-audit design), the anchor check | MECH | Mainly runs not wasted: "the 2.75-hour run ran once". No false result traced to any of them | LS l.21, l.52, l.146, l.353; P l.305 (O168) |

Also worth noting: **mutation testing** shows the planted checks were often weak. 98 of 224 mutation runs had escapes, and 11,081 of 11,731 mutants were caught (`results-mutation-history.txt`, awk count). But I traced no false research result to an escaped mutant: O144 records "None changes stage A's read" (P l.290).

## 2. MISSES (got through, or found late or by accident)

| # | Defect | How and when found | Reach | Cheapest earliest check | Citation |
|---|---|---|---|---|---|
| M1 | A probability rounding to exactly 1 near 8 standard deviations gave PhiInv(1) = Infinity, then NaN (adaptive.js l.274 since 05395be; the product's solve.js:222) | CHANCE, 20 Oct, while extending reader-ru.test; it had passed a unit test with a plant, preflights, mutation runs and audits | 2,484 and 2,700 non-finite table values in REF-STEP's saved tables; NaN from product code on a planted call; REF-STEP's results now PROVISIONAL | An always-on finiteness check on solved tables, plus a unit test at z* = 7.8–8 against the closed form 1 − Φ(z) | P l.325–326; `results-nan-census.txt` |
| M1b | Related: the adaptive reference's lattice top goes NaN for large inflows (O178), and the gate test silently dropped the NaN cells | DEEP, 18 Oct (a gate design review: "CANNOT MEET THE GATE") | Latent; no library household reaches it | The same finiteness check | P l.308; DRL l.190 |
| M2 | S126 read 7.5% against 96.8% simulated (the #106 "dead corner" in the table's interpolation) | Logged 21–22 Sep as "an anomaly, not chased"; chased only on MAINT's instruction, 24 Sep | "Steering decisions for 40 years": S126 held its pension off-tier for life | An always-on check of table against simulation at year 0, per household, with a tolerance | P l.188 (O1); RULES l.365; PH l.2360–2395 |
| M3 | The runPolicy bug (S1) | Lived 3 days (21–24 Sep) and reached the maintainer before AUD caught it | Re-reading of every figure made before the fix (O14, retro audit 8e) still open | The per-path identity "level sum = below + above + at target" (the test added afterwards) | P l.198, l.819 |
| M4 | The stored policy was a byte (Uint8Array) while the menu has 360 moves | CHANCE, 23 Sep, while writing the ternary search: "not by a test" | No effect on simulations, but the E1 probe was corrupted | A round-trip unit test of every move index | PH l.2534–2558 |
| M5 | The final year read the nearest cell's stored move | Analysis of step-2 records, 23 Sep | After the fix, survival rose on 9 of 12 households | A check that the chooser's move equals the table's best move at the same state (later RULES §9.4) | P l.764 |
| M6 | The exact binomial tail returned 1 above about 1,075 tosses (2^-n underflow) | While building 7r, 26 Sep | None: all callers stayed below 1,075 | A unit test against exact integers at n = 3,000 | P l.743 |
| M7 | The cycling random-number generator (S7) | AUD, after the figures had gone to the maintainer; the same generator remains in solver-final.test.mjs and invariants.mjs (on the review backlog) | Figures retracted | A vetted PRNG plus a period test | PH l.2431; P review backlog (26 Sep 01:52 row) |
| M8 | GitHub CI red from 24 Sep 14:00 to 25 Sep 21:40, unseen; behind it, the smoke stamp missed stats.mjs | Reading CI by hand | Runs 91–130 all failed | Surface CI status in-session (the pre-commit hook now runs CI's tests) | PH l.2435 |
| M9 | `npm run test:engine` stopped at file 41 of 82 from 24 Sep to 5 Oct | Found 5 Oct (O96) | 41 test files never ran in a full suite for 11 days | Assert the number of test files run | PH l.2958 |
| M10 | e3pcls-guard.test failing since 9 Oct; it is in neither pre-commit nor CI | CHANCE, 19 Oct; failing again 20 Oct | Whether a stale pin biased 2 "inert" comparisons is NOT CHECKED | Add it to the pre-commit/CI set | P l.314 (O184) |
| M11 | XAS's top-cell slice never ran (`axes.a.length` undefined: 71,436 of 71,436 reads unclassified) | DEEP | No item read the slice | "A check that ran on nothing is an error", applied in code | P l.260 (O106) |
| M12 | Preflight plants checked by exit code alone; every plant was refused by an earlier check | Found at AN, 15 Oct | 10 older preflights unverified (NOT CHECKED) | Each plant asserts its own message (now adopted) | P l.298 (O159) |
| M13 | Audits printed minPot from a field the solve does not read | Only because an outside review misread it, 12 Oct | Metadata wrong; the reducers never used it | Gate the printed settings against the solve's meta | P l.293 (O147) |
| M14 | The reference comparisons used the order reference as a stand-in for the candidate's own reference | DEEP, 18 Oct, after AX-HO, FOOT-S366 and HO-DEP had run | 3 tests read against the wrong incumbent | A design-premise anchor (later PR24) | P l.172 |
| M15 | The product's first year is a part-year (it is valued from today), while every research household is valued 1 January | OUT (escalation FALLBACK, 12 Oct): "Missed by the record" | Measured: S194's shipping opening is (0,2) on 1 Jan and (0,0) on 1 Jul and 1 Oct. INFERENCE: `grep 'partyear\|part-year' PLAN.md` finds no register row; the deep review lists it "NOT CHECKED" | Valuation date as a fair-test variable | escalations/12-Oct-opening-near-ties-report.md l.39–45; `results-partyear.txt`; DRL l.155 |
| M16 | The household band file lives outside git and was lost in a container restart | 10 Oct; still open | Runs that pick households by index would read different ones | Commit the band | P l.283 (O135) |
| M17 | 8 scripts imported the live working tree by absolute path, 2 of them in batches | 24 Sep; open, NOT CHECKED whether the code changed during those runs | Phase V and the ranking check | A test that no research script imports by absolute path | P l.197 (O12) |

**What the misses have in common:**
- Several are numerical-hygiene failures: M1, M4, M6, M7.
- Several are silent "ran on nothing" or "check never ran" failures: M8–M12.
- Rule 5 ("after a bug, sweep for the same pattern") worked once a bug was recognised: O199's sweep found the product bug O200.
- Rule 6 (chase odd results) arose from M2, but M15 suggests it is not consistently applied (INFERENCE).
