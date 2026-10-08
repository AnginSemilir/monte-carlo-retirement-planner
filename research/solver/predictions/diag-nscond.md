# Prediction: diag-nscond

- **Run:** `research/solver/batch-nscond.sh` - results/diagnscond/case0-4.txt and the per-household files (audit-nscond.mjs, one process a household: S370, bridge 4 and S126 deciding, S130 and S128 for incidence, each BASE and COV), read by reduce-nscond.mjs into results-nscond.txt
- **Kind:** test
- **Written:** 8 Oct, before the run (its time is its registering commit's, git log); the design: the deep review after NSB (deep-review-log.md 8 Oct 17:19 UK), its DECISIVE TEST, NSB re-scoped (items/NSB.md; drafts/ns-cond-design.md), after NSB ran and was NOT SETTLED (PLAN.md's 8 Oct 15:45 row; O127); the standing go-ahead of 4 Oct covers it (non-locked research work); its place before 7u, the maintainer's 6 Oct order, was replaced by the maintainer's decision of 8 Oct 19:56 UK (PLAN.md's ledger: 7u registers now, NS-COND beside or after it)
- **Seeds:** 7002 tuning: NS-COND re-reads XAS's states (seed 7002, 2,000 paths a world) at XAS's unit, and its gate holds BASE's year-before reads, one-step values and midpoint construct to XAS-R2's saved files read for read. It chooses the next non-survival read design, which is tuning; no fix is read on it. Not 7005 (selection) and not 7004 (Phase 4's second seed).
- **Unmasking:** NS-COND removes no error from the product or the solve: every read is assembled at read time from the solved tables, and item 2's swap is undone before the path moves on (the restore check). It measures what a dead-node rule for the non-survival reads would expose: the deep review's FLAG 1 says the share-axis dead node's zero bequest currently cancels a live over-read on S370 and bridge 4 (the 4-point previews' elive about +3.3 and +0.8), so a copy or drop rule would read those over-reads in full. A later fix that conditions the non-survival reads on the state's survival (NSL-UNCOND's fix) or drops the dead corner must be read with that in view: a loss on S370 or bridge 4 under such a fix is read as unmasking (the live over-read showing), split by a fixed-policy re-read before any harm is quoted.
- **Mechanism:** solve.js:1009 "b += QW[zi] * rd[1];" (the backward pass's bequest at a node is the plain expectation of the next year's bequest read; with solve.js l.1005 counting the estate only on surviving terminal states, a stored bequest is E[estate x alive], so it carries the node's survival); grid.js:389 "resilience and shortfall reads, are unchanged." (in a bridge year the bequest and shortfall reads blend their corners linearly, with no reader construct); grid.js:416 "const v = pr * cc + rr;" (the survival read is conditioned on the state's own accessible money; the bequest read is not, which is NSL-UNCOND's mechanism). Incidence per unit: the census prints the dead, share-axis dead, FAIL, NEXT, off-axis and KEPT counts per arm and year, and each read's weights wd, w0x, wL and wK.
- **Plan section:** PLAN.md "NS-COND", "NSB", "PR10", "O127", "O128", "O114", "O95", "7u"

## Question

NSB's item 1 read the live corners, not the blend (the deep review after NSB, FLAG 1): with the dead class requiring a stored bequest of 0, eb/bE + wd = wL elive - w0x by an identity. At BASE's reads touching a share-axis dead node, what carries the live corners' bequest error elive? NS-COND asks:

1. NSL-UNCOND: is 1 + elive the live corners' survival over the state's (rho = S_L / s1), so that dividing by rho brings the live read to the one-step bequest, and a read conditioned on the state's own survival read beats the copy rule's read, on every material cell (S370, bridge 4 and S126 under BASE in every bridge year and its non-step years, COV in its non-step years)?
2. NSB's item 2, unchanged: how many chosen moves change when the next year's share-axis dead nodes take their nearest live node's non-survival values (the copy rule), and does S126's opening change?
3. NSB's item 3, unchanged: does a reader table rebuilt on the menu-order reference remove half or more of BASE's year-before pessimism on S370 (YB2-REF)?

## Derivation

- **The identity** (the deep review after NSB, FLAG 1; audit-nscond.mjs's decomposition): with wd the weight on share-axis dead corners (bequest 0), w0x on dead corners off the share axis (bequest 0) and wL on every other corner, the plain bequest read is wL B_L, so eb/bE + wd = wL elive - w0x; elive is the drop rule's read where w0x = 0.
- **NSL-UNCOND's arithmetic** (solve.js l.1005, l.1009): a stored bequest is E[estate x alive], so the live corners' bequest over their survival is their estate given survival; where that is near the state's, B_L / S_L is about bE / s1, so 1 + elive is about rho, and (B_L / S_L) sR is about bE wherever the reader's survival read sR is near s1. The copy read fills the dead corners with live neighbours' bequests, which carry their own survival: it reads high wherever rho is above 1.
- **The rival causes** (the deep review's table): NSL-WEALTH (the estate given survival curves along wealth at the node spacing), NSL-SHARE (along the 6-point share axis), NSL-OTHER (a policy mismatch across wide cells, or the reader's own error). Under the first two, elive is not tracked by rho, so dividing by rho moves the read away from bE wherever rho differs from 1 + elive.
- **The previews** (declared under Provenance): NSB's preflight at 4 points gives eb/bE and wd per cell; the deep review read elive from them as about +3.3 on S370's BASE non-step reads, +0.8 on bridge 4's and about 0.01 on S126's (deep-review-log.md 8 Oct 17:19 UK). No preview of rho exists: NSB's audit printed no survival per corner, and NS-COND's own item lines have never been read.
- **The credences** (results-derive-nscond.txt): the review's cause credences (NSL-UNCOND 0.45, already shaded halfway to the lead rate), each carrying item 1's outcomes with judged conditional chances; items 2 and 3 are NSB's, their credences carried from results-derive-nsb.txt.
- **The checks, each failed on a planted fault first:** reduce-nscond.mjs's planted checks (every outcome of item 1 reached; EDGES: a mean |elive| at the materiality floor, a mean wd of exactly 0.1, the reads left out, a DEADSTEP tolerance exactly twice its clean error, a year before a step at year 0 alone); its mutation run (results-reduce-nscond-mutations.txt, 46 of 46); the audit's five plants (deadshift, norestore, rebuild, deadh, deadnext) in the preflight, each refused by its own check; the table checks at the registered 30 points on all five households before registration (the preflight's part A).

## Prediction

- **Item 1 INCONCLUSIVE:** NSL-UNCOND carries part of the live error but not every material cell shows both R and K: the conditioned read is held back where the reader's own survival read sR misses s1, and the step-year cells mix the reader's tax with the copy.
- **Item 2 HELD:** under BASE the copy rule changes S126's opening, or changes the move on at least 1% of the states (at least 100) in some year on a deciding household.
- **Item 3 FALSIFIED (the menu-order reference does not carry BASE's year-before pessimism):** on S370 under BASE, in both years before a step, the reference removes at most 0.2 of rep.

## Falsified if

- **Item 1 HELD** (every counting material cell shows R and K after Holm: the live error is the live corners' survival, and the conditioned read beats the copy read) **or FALSIFIED** (every counting material cell shows N after Holm: dividing by rho moves the live read away from bE, NSL-WEALTH or NSL-SHARE). INCONCLUSIVE: neither, or no cell counting and material.
- **Item 2 FALSIFIED:** S126's opening stays and every deciding household's every year changes under 0.1% of its states. INCONCLUSIVE: otherwise, unless HELD.
- **Item 3 HELD (YB2-REF):** both years read REF (s at least 0.5, the LO test shown after Holm). INCONCLUSIVE: either year MID or CONSTRUCT, or the years apart.

## Fair-test table

Arms: BASE and COV, XAS's, at the same states (BASE's paths and moves: a fixed-policy re-read); the constructs (the decomposed bequest read, the copy read, the conditioned read, the swapped re-choice, the rebuilt reader table, vb and vb41) are reads of the same tables at the same states, each built on its own arm's tables.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | NSB's five: S370, bridge 4 and S126 (XAS-R2's three) and S130 and S128 for incidence | the same | SAME (chosen before NSB, on the reader family's record; the incidence two decide nothing) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002, 2,000 a world | the same reads | SAME (both arms read at BASE's states on BASE's paths; the gate holds item 3's to XAS-R2's) |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points | 6, with the edge node a 7th slot in step years | TESTED (COV-B, as XAS-R2 and NSB) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader | the reader with readerTax and the coverage node | TESTED (XAS's COV arm); the read-time constructs are measurements at the same states, each on its own arm's tables, not arms |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | NS-COND's files: one code and audit across the run (the gate) | XAS-R2's files (code 98fed13c0e83), the derivation's records | ACCEPTED (the solver's changes since XAS-R2 - FORCE-X's research flag off by default, the code stamp's scope, E2 only when called, E3-PCLS behind its flag, off - leave XAS's unit untouched; THE IDENTITY in the gate holds every item-3 read, ex5 and vb on S370 and bridge 4 to XAS-R2's at the same path, world and year, so a change that moved the unit refuses the run) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's read against the simulated) | item 1 dR and dK per path from elive, rho, eC and eK; item 2 the share of states whose move changes; item 3 the share s of rep the reference removes | the same | SAME (one definition for both arms) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per read, from the per-household files: year, world, path, the step class, and per arm wd, w0x, wL, wK, B_L, S_L, s1, sR, bC, the plain bequest and shortfall reads, bE and hE at the arm's own move, whether the arm's move is BASE's; per state of item 2, the year and per arm the move before and after the swap; per read of item 3, year, world, path, class, rr, ex5, ro, vb, vb41; per arm and year the census.
- **Item 1 (single look):** a CELL is a deciding household's reads in one arm and class - BASE in every reader year, BASE's non-step years apart, COV in its non-step years - over the reads touching a share-axis dead node (wd above 0) whose arm's own move has a one-step bequest and survival above 0 and whose live corners carry weight and survival (wL above 0, S_L above 0); a failing move or such a read is left out and counted. A cell COUNTS where its mean wd is above 0.1 and is MATERIAL where its mean |elive| is above 0.05 (held to within 1e-12). Per read elive = B_L / bE - 1, rho = S_L / s1, eC = bC / bE - 1, eK = (B_L / S_L) sR / bE - 1; per path dR = the mean of |elive| - |(1 + elive) / rho - 1| and dK = the mean of |eC| - |eK|. Fisher's paired randomization tests (reduce-7ar.mjs flipP, B 20,000 from fixed seeds), one-sided, on each counting material cell: R, mean(dR) above 0; K, mean(dK) above 0; N, mean(-dR) above 0; Holm over all of them. HELD when some cell counts and is material and every such cell shows R and K; FALSIFIED when some does and every such cell shows N; else INCONCLUSIVE.
- **Item 2 (census):** NSB's: under BASE, per deciding household and year s (the year before a reader year), the share of states whose chosen move changes when year s + 1's share-axis dead nodes take the nearest live node's bequest, resilience and shortfall on their share row, in every world and layer. HELD when S126's opening changes, or a share is at least 0.01 over at least 100 states; FALSIFIED when S126's opening stays and every share is under 0.001; else INCONCLUSIVE.
- **Item 3 (single look):** NSB's: BASE on S370 in each year before a step (2 and 6): per path D = the sum of (rr - ro), P = the sum of (rr - ex5), each signed so the year's sum of P is above 0; s = sum D / sum P. Tests LO, mean(D - 0.2 P) above 0, and HI, mean(0.5 P - D) above 0, Holm over the four. A year reads CONSTRUCT when s lies outside [-0.2, 1.2], REF when LO shows and s >= 0.5, NOTREF when HI shows and s <= 0.2, else MID. HELD when both years read REF; FALSIFIED when both read NOTREF; else INCONCLUSIVE.
- **Secondary (declared, decides nothing):** none.
- **Reported, not items:** every cell's counts, mean wd, w0x, wK, elive, |elive|, rho, |(1 + elive) / rho - 1|, |eC|, |eK| and its tests' Holm p; S130's and S128's incidence; COV's changed moves beside BASE's; item 3's NODEQ share, vb's and vb41's, and bridge 4's years; the census (O128's KEPT ratio) and DEADSTEP's slices.
- **NOT SETTLED**, if any gate fails: the fair-test gate on the logs (requireFairLogs); the stamps (one code and audit across the run, the registered prediction, each file its log's); a plant, blind or tables line; a household missing, repeated or not done; an arm's settings not taking; a ran line off XAS's unit; THE TABLE CHECKS: DEADSTEP failed or ran on nothing on an arm, a slice's tolerance under twice its clean error, a plant's effect printed, a census line missing; a self-check failed, or run on nothing where it must run (replicaNS, wdRead and restore on each arm, some no-access node dead on each arm; replica, rebuild, nodes and fine on BASE where a year before a step follows year 0); a file missing, short or off its log's counts; XAS-R2's files failing their own fair-test gate; THE IDENTITY: an item-3 read, ex5 or vb on S370 or bridge 4 off XAS-R2's BASE read, ex5 or vb at the same path, world and year by more than 2e-12.
- **Declared choices, not derived:** the counting weight 0.1 (NSB's, the review's 'where wd > 0.1'); the materiality floor 0.05 (the author's: NSB's tolerance, below which the live error is not worth explaining); R, K and N on every material cell (the review's 'on most paths ... and the conditioned read beats the copy read', read as the paired mean tests the regimen uses); the copy rule as item 2's (NSB's); items 2 and 3's thresholds (NSB's).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | NSL-UNCOND carries the live error: the non-survival reads are to be conditioned on the state's survival (a conditioned read, B_L / S_L times the state's survival read, designed and tested with simulation as family 3's fix after 7u); no dead-node copy or drop rule is designed | 0.28 |
| item 1 INCONCLUSIVE | the cells are read one by one: a conditioned read is designed only for the cells where R and K showed, and the rest go to the resolution question (7an) | 0.57 |
| item 1 FALSIFIED | NSL-WEALTH or NSL-SHARE: the live error is resolution, not survival; 7an's resolution check of the share axis and wealth comes before any non-survival read rule | 0.15 |

## Decision fed

- **Item 1 HELD:** a survival-conditioned non-survival read (family 3's fix) is designed and its test registered after 7u (fixes follow 7u under the maintainer's 6 Oct order, and NS-COND runs beside or after 7u under the 8 Oct 19:56 UK decision), tested with simulation on S370, bridge 4 and S126 and split by a fixed-policy re-read; PR10 falls for the reason NSL-UNCOND names; no dead-node copy or drop rule.
- **Item 1 FALSIFIED:** the live error is resolution; 7an's design adds the wealth axis to its resolution question; no conditioned read is designed.
- **Item 1 INCONCLUSIVE:** a conditioned read is designed only for the cells where it held; the rest go to 7an's resolution question.
- **Item 2 HELD:** the copy rule moves decisions; since FLAG 1 makes it expose the live over-reads, it is not a fix candidate, and its count is the decision weight any non-survival read change must be read against.
- **Item 2 FALSIFIED or INCONCLUSIVE:** the copy rule's decision weight is small; no fix is ranked by it.
- **Item 3 HELD:** YB2-REF carries BASE's year-before pessimism: the menu-order reference (O36) re-enters as a candidate fix, tested with simulation before adoption.
- **Item 3 FALSIFIED or INCONCLUSIVE:** YB2-NODEQ and CURV remain; 7an's design names the year-before pessimism as untested on BASE.
- **In every branch:** NS-COND leaves 7u's gates (the deep review after NSB, FLAG 2); no product or default change; O128's census and the KEPT weight per read are reported for its root-cause step.

## Provenance

- **The design:** the deep review after NSB (deep-review-log.md 8 Oct 17:19 UK: FLAG 1, FLAG 3, its DECISIVE TEST NS-COND, its CAUSE CREDENCES NSL-); items/NSB.md; drafts/ns-cond-design.md.
- **The build:** audit-nscond.mjs (audit-nsb.mjs's unit, reads and items 2 and 3, with DEADSTEP and the census before any read, the decomposed read, and the blind and tables modes); reduce-nscond.mjs (planted checks; its mutation run); derive-nscond.mjs; batch-nscond.sh; preflight-nscond.sh.
- **Seen before registration (declared):**
  - NSB's records: its prediction and derivation, with the 4-point previews they declare (S370's, bridge 4's and S126's item 1 cells); the deep review's reading of elive from them (about +3.3, +0.8 and 0.01); NSB's census of S370 at 30 points (results-nsb-census.txt).
  - NSB's NOT SETTLED run (results/diagnsb): the item lines and files of bridge 4, S126, S130 and S128 exist and were never read (only their stamp and check lines); S370's process stopped before writing a file, and its log printed five item lines, never read. batch-nscond.sh writes to its own folder, and those files stay unread.
  - NS-COND's first build check (runs.log 8 Oct 18:43 UK, PREDICTION none, S370 at 4 points) was run before the blind mode existed and printed its item lines into a scratch file: they were filtered from display (grep -v), never read, and the file and its json deleted; only its census and check lines were read (DEADSTEP FAIL 8748/8748 and NEXT 18/18 on BASE, FAIL 12636/12636 on COV; every read-time check passed). Every later build check ran blind or on the tables alone.
  - The census at 4 points (the census build checks of NSB's audit, runs.log 16:02 and 16:22 UK) and NS-COND's census lines: the counts, and KEPT's ratio up to 1.57e+5 at 4 points.
  - The preflight (runs.log 8 Oct 19:45 UK, PREDICTION none, at 87be040; its output results-nscond-preflight.txt): A, the tables at the registered 30 points on all five households and both arms - DEADSTEP passed and ran on every arm, each slice's tolerance at least twice its clean error, a census line per arm, and a node with no accessible money classed dead ('TABLE CHECKS: passed'), with the census's FAIL, NEXT and KEPT counts by household and arm (S130's BASE NEXT slice is empty, its FAIL slice 9720); B, the read path blind at 4 points on all five, every check passing and no item line or file written; C, the five plants each refused by its own check (deadshift by wdReadBad, norestore by restoreBad, rebuild by rebuildBad, deadh by deadstepFailBad with effect 4.0249e-5 against the tolerance 1e-9, deadnext by deadstepNextBad with 1e-8). Only checks and counts: no item figure.
- **Judged before derived:** the author's judgement was committed in drafts/diag-nscond.md (59ff950) before derive-nscond.mjs was written or run; the registered credences are the derivation's (its judged conditional chances named in the script, written after that commit).

## Derivation script

- `derive: research/solver/derive-nscond.mjs > research/solver/results-derive-nscond.txt sha256 279c9c91bf6cbc12`

## Point and interval

- **Item 1:** no numeric point: the outcome turns on every material cell's R, K and N; the previews put S370's and bridge 4's cells material and S126's under the floor.
- **Item 2:** NSB's: the share of COV's correction the swap must supply to flip S126's opening, f* 0.734.
- **Item 3:** NSB's: the share s about 0.27 (80%: -0.10 to 0.75; judged).

## Credence

- **Base rate, item 1:** 0.23 (it leans on the deep review's ranked cause NSL-UNCOND: the deep-review lead rate, results-scorecard.txt KIND BASE RATES)
- **Base rate, item 2:** 0.68 (an effect on decisions: the EFFECT kind's rate)
- **Base rate, item 3:** 0.23 (it leans on the deep review's ranked cause YB2-REF: the deep-review lead rate)
- **Item 1:** HELD 0.28, INCONCLUSIVE 0.57, FALSIFIED 0.15 (derived, results-derive-nscond.txt section 2: the review's causes, NSL-UNCOND 0.45 already shaded halfway to the lead rate, each carrying the two decisive outcomes with judged chances - under NSL-UNCOND 0.51 for every material cell showing R and K (R 0.85, K beside it 0.6: the reader's survival read relative to a small s1) and 0.02 for N; under each resolution cause 0.15 and 0.40; under NSL-OTHER 0.20 and 0.20 - times 0.85, the judged chance some cell is still material at 30 points)
- **Item 2:** HELD 0.90, INCONCLUSIVE 0.06, FALSIFIED 0.04 (NSB's derivation, carried: results-derive-nsb.txt, sha256 0d215b1e56d741fa, checked by derive-nscond.mjs)
- **Item 3:** HELD 0.17, INCONCLUSIVE 0.37, FALSIFIED 0.46 (NSB's derivation, carried)
- **Judged:** none in the checked form: the pre-commit hook takes a prediction under predictions/ only once its derivation's output exists, so the author's judgement, written before derive-nscond.mjs existed, was committed in drafts/diag-nscond.md (59ff950): item 1 HELD 0.30, INCONCLUSIVE 0.45, FALSIFIED 0.25; item 2 0.85, 0.10, 0.05; item 3 0.20, 0.35, 0.45 (recorded for the close, not scored by the check)
- **Kinds:** 1 ATTRIB; 2 EFFECT; 3 ATTRIB

## Power

Item 1's tests run over every path's reads in a counting cell (thousands of paths a cell at 2,000 a world); where elive is material (the previews' +3.3 and +0.8 on S370 and bridge 4 at 4 points), dR's per-path means sit far from 0 under either reading, so the outcome turns on direction, not power; INCONCLUSIVE arises from cells that disagree, by design. Item 2 is a census. Item 3: NSB's power (results-derive-nsb.txt section 4).

## Budget line

5 jobs, four at once: NSB's measured run (runs.log 13:46 to 15:45 UK, about six core-hours) plus DEADSTEP over every share-axis dead node (minutes a household at 4 points; a few per cent of a solve at 30); about six core-hours, under two hours at four at once. The preflight's tables at 30 points: two solves a household, about an hour at four at once.

## Pre-mortem

- **First:** the conditioned read's survival sR is the reader's, which carries the reader's own errors (PR1, O113): where sR misses s1, K fails though NSL-UNCOND holds, and item 1 reads INCONCLUSIVE for a reason that is the reader, not the cause.
- **Second:** at 30 points elive shrinks under the floor on S370 and bridge 4 (the 4-point previews were a coarse grid's), leaving no material cell: INCONCLUSIVE with nothing to explain, and NSB's question answered by resolution alone.
- **Third:** KEPT corners (O128) sit in wL and carry bequests far above their survival times any estate: they push elive and rho apart, so R fails on cells heavy in KEPT weight for a reason that is O128's, not NSL-WEALTH's; the per-cell wK report is the guard.
- **Fourth:** item 2's copy rule changes S126's opening for a reason other than the blend - the copied values above the live node's true value - so HELD overstates the blend's decision weight; the fixed-policy split before any fix test is the guard.
- **Fifth:** item 3's rebuilt reference at read time reads differently from a solve on readerRef 'order'; and its year-6 preview (NSB's) moved almost nothing at 4 points.

## Changes after seeing results

None.
