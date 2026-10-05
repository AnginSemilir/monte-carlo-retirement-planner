# Prediction: diag-covb

- **Run:** `research/solver/batch-covb.sh` - results/diagcovb/case0-5.txt and the per-path files (audit-covb.mjs, one process a household: S130, S370, bridge 4, S126, bridge 0, S126 all-ISA), read by `reduce-covb.mjs` into results-covb.txt
- **Kind:** test
- **Written:** 5 Oct, before the run (its time is its registering commit's, git log). The design: COV-B-STEP as the deep review after PMAP set it (deep-review-log.md 4 Oct 18:35 UK; items/COV.md), with the reader's tax first on an arm of its own (the maintainer's decision, the 4 Oct 21:57 row: 'fix the tax in the reader first'; the deep review after 7au, 22:08 UK: RTAX-STEP alone can barely show the fault, so readerTax is folded into COV-B-STEP as its middle arm).
- **Seeds:** 7002 tuning (PMAP's seed and paths: 2,000 a world, the same paths for every arm of a household). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** both tested arms remove known errors in the bridge reader's step reads (family 3): TAX the reference's missing tax (O92: in a step year the reader calls a position supported where every floor move fails by the year's tax), COV the dead top share node's flat copy (O76's step-read optimism; PMAP's top-cell weight). The baseline behaviour those errors drive is optimism at the step reads: the year before a step year values its moves as if the step year could be paid more often than it can. Removing it can expose the spread reads' pessimism (O81: the aggregate bridge term turning pessimistic once the step optimism no longer offsets it). A survival fall under TAX or COV is read as that unmasking until decomposed: item 3's fixed-policy reads split the tables' change from the chooser's, and ORDER on S370 (readerRef 'order', O81's unit) reads the spread reference's part.
- **Plan section:** PLAN.md "COV" and "RTAX" (the schedule), "O92", "O76", "O81", "O80" (the register)

## Question

At the bridge's step years, does the step-year edge node (COV-B, with the reader's tax: COV) remove the step reads' optimism without harming survival, and does the reader's tax alone (TAX) do no harm?

1. COV against BASE: no material harm to survival on S130, S370, bridge 4 and S126?
2. TAX against BASE: no material harm on the same four?
3. Along BASE's paths, at every step read: is COV's step read lower than BASE's (the flat copy's optimism removed), with its error against the claim at t + 1 nearer 0?

## Derivation

All figures are from results-derive-covb.txt (derive-covb.mjs over PMAP's records and the reducer's own items()), except where another file is named.

- **Where the change acts.** PMAP's supported step reads (the same unit, households, seed and paths): S130 6000, S370 11718, bridge 4 6000, S126 6000. At 6 share points their mean weight on unsupported nodes is 0.3575 to 0.6488 (the top share node a = 1, whose c is the flat copy); with a node at each wealth row's edge it is 0.0000 to 0.0012. So COV changes nearly every step read, and the change removes weight from a copied node: the read falls where the copy overstated it.
- **The tax.** In a step year the reference ignores the year's tax: 846 of 5508 step-year edge cells fail every move by it (results-covflow.txt), and today's reader misreads 207 of 15000 edge-band states, all as supported (results-rtaxmis.txt). TAX decides support by the floor moves' flow inside the band (0 of 30000 misread); the band is narrow (results-pmap.txt: 0.0085 of the supported step reads within 10% of the threshold), so TAX's survival change should be small.
- **The node's placement** (items/RTAX.md, COV-B after RTAX): at d0 - tol/2 + tauMax_j on each wealth row, so it is paid at every ISA share, gain and allowance bucket (research/tests/cov-b.test.mjs check 5: 108 of 108 node states paid, 108 of 108 failing 2 below the reference's edge).
- **Why the claim at t + 1 is a fair yardstick for item 3.** The tables after the step year are the same in every arm (cov-b.test.mjs check 3: every table at every old node equal from the step year on), so at a step read BASE's and COV's errors against the claim at t + 1 differ only by the step read itself: d = BASE's read less COV's.

## Prediction

- **Item 1 HELD:** no household reads harm under COV; the survival changes are small (within 0.2 points).
- **Item 2 HELD:** no household reads harm under TAX.
- **Item 3 HELD:** on every household with step reads COV's step read is lower than BASE's on most reads, and its mean error against the claim at t + 1 is nearer 0.

## Falsified if

- **Item 1 FALSIFIED:** any household reads harm under COV (Holm-adjusted exact p under 0.05 and a point loss at least its margin). **INCONCLUSIVE:** no harm read, but an interval reaching below minus the margin.
- **Item 2 FALSIFIED / INCONCLUSIVE:** the same rule for TAX.
- **Item 3 FALSIFIED:** any household with step reads shows COV's read higher (the sign test, Holm, under 0.05). **INCONCLUSIVE:** neither direction shown on every household, or lower but not nearer 0 (an overshoot).

## Fair-test table

Arm A is BASE (PMAP's unit). Arm B is TAX or COV (and ORDER on S370, reported).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen | PMAP's four with a bridge step year, and the controls bridge 0 and S126 all-ISA | the same | SAME (PMAP's panel; the all-ISA control built by moving S126's taxable and cash money into its ISA, in every arm) |
| 2 | Changes the test makes to a household's inputs | PMAP's (guardrails off, no lookahead, floor 0.8 of the target); the all-ISA control's move | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002, 2,000 a world | the same paths | SAME (one process runs every arm of a household on the same paths; the reducer reads them paired) |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points | the same; COV adds the seventh share slot, the edge node in step years (a copy of a = 1 elsewhere) | TESTED for COV (the node; every old node kept: cov-b.test.mjs checks 2 and 3) |
| 24 | The read and edge handling: the bridge read | the reader (PCLSI, TS+J), support from the reference | TAX: support inside the step years' edge band from the floor moves' flow (readerTax); COV: the same; ORDER: readerRef 'order' | TESTED (the reader's support at step reads, and for ORDER the spread reference) |
| 28 | Every file of a comparison made by the same code | one process, one code | the same | SAME (the arms differ only in their options; readerTax and coverage default off, the off path unchanged: the golden and reader tests) |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | SAME (exact McNemar with Holm for items 1 and 2; the exact sign test with Holm for item 3) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per household and arm, each path's survival (0 or 1) under the arm's own policy; along BASE's own paths, at every step read, each arm's step-year survival read at BASE's state through the layer of BASE's previous move and that arm's read at BASE's next state (0 when the path fails in the year).
- **Item 1 (primary; single look):** COV against BASE per household (b lost: BASE survives, COV fails; c saved), stats.mjs outcome() at the household's margin (marginFor BASE's survival: 0.25 points at 95% or more, else 0.5), harm's exact one-sided McNemar p Holm-adjusted over the 4. HELD when every household reads no material harm; FALSIFIED when any reads harm; else INCONCLUSIVE.
- **Item 2 (primary; single look):** TAX against BASE, the same rule.
- **Item 3 (primary; single look):** per household with step reads, d = BASE's step read less COV's at the same state and layer; the exact sign test of d, Holm over those households. LOWER when d > 0 dominates with the adjusted p under 0.05, HIGHER when d < 0 does; mean D (a step read less the claim at t + 1) per arm. HELD when every such household reads LOWER and COV's |mean D| is below BASE's; FALSIFIED when any reads HIGHER; else INCONCLUSIVE.
- **Reported, not items:** TAX's mean d against BASE (its sign fixed by construction); the moves TAX's and COV's chooser would change at BASE's states in the step years and the years before them; ORDER against BASE on S370 (paired survival, and its mean D at BASE's step reads: O81).
- **NOT SETTLED**, if any gate fails: the stamps; a household missing, repeated or not done; an arm missing or its setting not taking (the solve line's readerTax, coverage and readerRef); a ran line off seed 7002, 30 points or 6,000 paths; a per-path file missing, unstamped or off its sum lines; the controls: bridge 0's arms not identical or carrying step reads, S126 all-ISA's BASE and TAX not identical.
- **Declared choices, not derived:** the 0.25 and 0.5 household margins are the regimen's (stats.mjs); 2,000 paths a world is PMAP's; the claim at t + 1 as item 3's yardstick (the derivation).

## Decision table

| outcomes | action | credence |
|---|---|---|
| items 1, 2 and 3 HELD | COV (the node with the reader's tax) becomes family 3's fix candidate: 7an runs on COV's arm (PR4's resolution test), and the candidate goes to the maintainer before any default | 0.40 |
| items 1 and 2 HELD, item 3 INCONCLUSIVE | the node's mechanism is unshown: a deep review of the step reads before 7an | 0.20 |
| item 3 FALSIFIED | the node raises step reads: a design error; no 7an on COV's arm until a deep review finds it | 0.10 |
| item 1 or 2 FALSIFIED | decompose before blame: item 3's fixed-policy reads split the tables from the chooser, ORDER on S370 the spread reference (O81) | 0.15 |
| item 1 or 2 INCONCLUSIVE, item 3 HELD | the node works as designed and safety is unshown: a second look at more paths on the households that read inconclusive | 0.15 |

## Decision fed

- **Items 1, 2 and 3 HELD:** COV becomes family 3's fix candidate; 7an registers on COV's arm; the candidate and any default go to the maintainer; readerTax and coverage stay off in the code until then.
- **Item 3 INCONCLUSIVE or FALSIFIED:** a deep review of the step reads before 7an; no family-3 fix enters any candidate.
- **Item 1 or 2 FALSIFIED:** the harm is decomposed (fixed-policy reads, ORDER) before it is called the arm's (RULES.md section 9).
- **In every branch:** no product change, no default change, no seed 7013; 7u waits on COV's read.

## Provenance

- **The design:** the deep review after PMAP (deep-review-log.md 4 Oct 18:35 UK; COV-B-STEP), the maintainer's decision of the 4 Oct 21:57 row, the deep reviews of COV-B's implementation (20:19 UK) and of RTAX's design (21:04 UK), and the deep review after 7au (22:08 UK: readerTax folded in as COV-B-STEP's middle arm).
- **The build:** readerTax (RTAX v2) and coverage (COV-B) in src/solver (solve.js, grid.js, reader.js), both default off, with research/tests/reader-tax.test.mjs (6 checks) and research/tests/cov-b.test.mjs (6 checks), each check with its planted fault; audit-covb.mjs; reduce-covb.mjs (23 planted checks, EDGES printed); preflight-covb.sh with preflight-parse-covb.mjs; derive-covb.mjs.

## Derivation script

- `derive: research/solver/derive-covb.mjs > research/solver/results-derive-covb.txt sha256 1bbb921e9b081e08`
  (PMAP's step reads and their weights; items 1 and 2 through items() at k = 0, 5, 15, 40 and 80 pairs of 6,000 at BASE survival 90% and 97%; item 3's sign test at PMAP's read counts; the cost)

- **Mechanism:** reader.js:116 "c[i] = c[g.index(ip, lo, it, ig, ic)]" (the flat copy an unsupported node takes along its share row) against grid.js:285 "function shareLoc(g, ip, a, yr)" and grid.js:341 "r = shareLoc(g, p0, a, yr)" (readValues' per-wealth-corner share locate; COV: the read between the edge node and the nodes below it, never on a copied node above the edge); grid.js:415 "tx && tx.inBand(acc) ? (tx.payable(s) ? 1 : 0) : RD.chance(acc)" (TAX: support from the floor moves' flow inside the edge band). How often each applies: PMAP's step-read counts and weights (derive-covb.mjs section 1).

## Point and interval

- **Item 1:** each household's survival change about 0 (-0.2 to +0.2 points); no harm read.
- **Item 2:** each household's change about 0 (-0.1 to +0.1).
- **Item 3:** COV's step read lower on most changed reads (a share q down of 0.7 to 0.95), its mean error nearer 0 on all four.

## Credence

- **Item 1:** HELD 0.70, INCONCLUSIVE 0.20, FALSIFIED 0.10.
- **Item 2:** HELD 0.80, INCONCLUSIVE 0.15, FALSIFIED 0.05.
- **Item 3:** HELD 0.65, INCONCLUSIVE 0.25, FALSIFIED 0.10.

## Power

From results-derive-covb.txt:

- **Items 1 and 2** at 6,000 paths with a net change of 0: HELD at k = 0, 5, 15, 40 and 80 lost-and-saved pairs where BASE survival is 90% (the 0.5 margin; the interval at k = 80 [-0.426, 0.426]); where it is 97% (the 0.25 margin) HELD to k = 15 and INCONCLUSIVE at k = 40 ([-0.304, 0.304]).
- **Item 3** at PMAP's read counts with every read changed: every household shown at a share down of 0.52 (Holm p 6.09e-3 on S130, bridge 4 and S126, 6.39e-5 on S370) and not at 0.51.

## Budget line

16.1 core-hours from PMAP's own seconds (three arms, four on S370, and the fixed-policy run), the longest job 3.50 hours, about 5.0 hours on four cores longest first (results-derive-covb.txt; readerTax's and coverage's own cost measured in the preflight). Launched when ADOPT-PI leaves the cores.

## Pre-mortem

- **First:** a household near 97% survival with more than about 30 lost-and-saved pairs reads item 1 or 2 INCONCLUSIVE: a power failure, not a falsification; a second look at more paths is the next step.
- **Second:** COV's reads fall but the chooser moves too, so the survival change mixes the tables' change with the chooser's; item 3 reads the tables at fixed policy, and the moves line shows how often the chooser would differ.
- **Third:** the claim at t + 1 is itself a table read, not a survival outcome: item 3 says COV's step reads agree better with the next year's table, not that they are calibrated to simulated survival; the survival items carry that.
- **Fourth:** S370's spread reads are pessimistic (O81); removing its step optimism can lower its survival through the chooser (the unmasking above); ORDER is reported beside it to read the spread reference's part.

## Changes after seeing results

None.
