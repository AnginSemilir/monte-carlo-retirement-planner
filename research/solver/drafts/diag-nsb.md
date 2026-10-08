# Prediction: diag-nsb

- **Run:** `research/solver/batch-nsb.sh` - results/diagnsb/case0-4.txt and the per-household files (audit-nsb.mjs, one process a household: S370, bridge 4 and S126 deciding, S130 and S128 for incidence, each BASE and COV), read by reduce-nsb.mjs into results-nsb.txt
- **Kind:** test
- **Written:** 8 Oct, before the run (its time is its registering commit's, git log); the design: the deep review after XAS-R2 (deep-review-log.md 6 Oct 03:10 UK) proposed NSB as its DECISIVE TEST - the dead node's non-survival values in every bridge year, read-only, as XAS-R2 (items 1 and 2: F3-NSBLEND; item 3: YB2-REF against YB2-NODEQ); the maintainer's 6 Oct 15:45 decision put it before 7u registers; the standing go-ahead of 4 Oct covers it (non-locked research work)
- **Seeds:** 7002 tuning: NSB re-reads XAS's states (seed 7002, 2,000 paths a world) at XAS's unit, and its gate holds BASE's year-before reads, one-step values and midpoint construct to XAS-R2's saved files read for read. It chooses the next fix's design, which is tuning; no fix is read on it. Not 7005 (selection) and not 7004 (Phase 4's second seed).
- **Unmasking:** NSB removes no error from the product or the solve: every read is assembled at read time from the solved tables, and item 2's swap is undone before the path moves on (the restore check). The known error items 1 and 2 target is the bequest and shortfall reads' blend with the share axis's dead node (b = 0, h = the failure cost) in every bridge year (PR10; FLAG 1). A later fix that removes that blend would move S126's opening toward COV's (item 2 reads whether it does), and S126's survival loss under COV is not COV's alone (O105): a loss on S126 under such a fix is read as unmasking (the reader's survival misread showing once the non-survival blend no longer hides it), split by a fixed-policy re-read before any harm is quoted. Item 3's reference is a read-time reconstruction; it changes nothing.
- **Mechanism:** solve.js:1015 "if (failShort && fail) h = failCostAt[t];" (a state every move fails stores the failure cost as its shortfall, and its bequest 0); grid.js:389 "resilience and shortfall reads, are unchanged." (in a bridge year the bequest and shortfall reads blend their corners with no reader construct, the dead top share node among them); reader.js:116 "c[i] = c[g.index(ip, lo, it, ig, ic)]" (the survival read's copy rule at an unsupported node, which item 2's swap applies to the non-survival values). Incidence per unit: the audit prints each arm's share-axis dead nodes, their count and the copied count per layer-year, and each read's dead weight wd.
- **Plan section:** PLAN.md "NSB", "PR10", "PR1", "O105", "O113", "O115", "7an" and "7u"

## Question

XAS-R2's item 3 held (results-xasr2.txt): under BASE, S126's step-year bequest read sits low by a near-constant fraction and its shortfall read high, the signature of a corner weight on the dead top share node (b = 0, h = the failure cost); COV's edge node removes it in step years only. The deep review after XAS-R2 (FLAG 1) argued the same blend stands in every bridge year that is not a step year, under both arms, on every household with dead weight in its reads, and that it is about 4e-2 of score at S126's top-cell states, the size of O105's opening rise: NOT CHECKED, since no run has read the non-survival reads outside a step year. NSB asks:

1. In every bridge year, does the share-axis dead node's weight wd account for the bequest read's error (eb/bE near -wd), under BASE and in COV's non-step years, on the deciding households? (F3-NSBLEND)
2. Does it move decisions: how many chosen moves change when the next year's dead nodes take their nearest live node's non-survival values, and does S126's opening change?
3. BASE's year-before survival read is pessimistic and the midpoint node removes little of it (O113): does a reader table rebuilt on the menu-order reference (O36) remove half or more (YB2-REF), or does the node quadrature at 41 points carry it (YB2-NODEQ)?

## Derivation

- **The blend's signature and the live floor** (results-derive-nsb.txt section 2; XAS-R2's S126 file through its gate): BASE's top-cell step-year eb/bE on S126, 6,000 reads, 5% -0.378, median -0.354, 95% -0.327 (half the 5-95% range 0.025: near-constant, a weight); COV, which has no dead weight there, mean |eb/bE| 5.5093e-3: the live corners' own error, so r = |eb/bE + wd| under the blend is about that floor where the live corners read as well as on S126's year 1. Away from it (non-step years, other households) the floor is unread: grade D.
- **S126's opening** (section 3; XAS-R2's opening terms): under BASE's tables BASE's move (59) leads COV's (5) by 3.3623e-3, of which the non-survival terms carry 3.3033e-3; under COV's the non-survival difference is -1.2795e-3, so COV's correction to it is 4.5827e-3. The swap moves the non-survival terms alone (survival is the reader's, untouched), and flips the opening if it supplies at least f* = 0.734 of COV's correction. The copy rule gives the read near a = 0.87 the 0.8 node's bequest where COV's edge node gives its own edge's: the share it supplies is judged about 1 (sd 0.25, grade D).
- **Item 3's power** (section 4; XAS-R2's S370 BASE reads, years 2 and 6, 6,000 and 5,859 reads): with D = s P + e and e the midpoint node's per-path departure from its own mean share (vb removes 0.127 and 0.264, XAS-R2's), the registered tests show LO at s 0.6 and HI at s 0.1 in every one of 40 resamples in both years, at Holm's worst level.
- **What each outcome would say.** Item 1 HELD: the bequest read's error in a bridge year is the dead node's weight, everywhere it is large: PR10 falls in every bridge year, not S126's year 1 alone. FALSIFIED: in non-step years the error is far smaller than the weight (the blend absent or offset): FLAG 1's incidence claim falls. Item 2 HELD: the blend moves decisions (S126's opening, or a share of states): a dead-node rule for non-survival reads is decision-relevant. Item 3 HELD: the reference's shape carries BASE's year-before pessimism; FALSIFIED: it does not, and NODEQ or CURV remains.
- **The constructs are exact where they are defined:** the bequest and shortfall reads assembled from the corners equal the solver's (replicaNS); wd from the corners equals the solver's own read of the 0/1 dead indicator (wdRead); the reader table rebuilt at read time on the solve's own reference equals the stored one node for node (rebuild); the node builder reproduces the stored survival (nodes) and the 41-point path at 5 points the node's (fine); every swap is undone, each array the solve's own again (restore); every node with no accessible money in a reader year is dead (deadTop).
- **The checks, each failed on a planted fault first:** reduce-nsb.mjs's planted checks (every outcome of every item reached; EDGES: a mean dead weight of exactly 0.1, r exactly at 0.05, a failing move and a zero one-step bequest left out, a change share of exactly 0.01 and the same over too few states, a share of exactly 0.5, an optimistic rep, a year before a step at year 0 alone, the identity at half its tolerance); its mutation run (results-reduce-nsb-mutations.txt); the audit's deadshift, norestore and rebuild plants in the preflight, each refused by its own check.

## Prediction

- **Item 1 HELD (F3-NSBLEND):** on every counting cell (a deciding household's reads touching a share-axis dead node, BASE in every bridge year and COV in its non-step years, mean wd above 0.1), the mean of |eb/bE + wd| is below 0.05.
- **Item 2 HELD:** under BASE the swap changes S126's opening, or changes the move on at least 1% of the states (at least 100) in some year on a deciding household.
- **Item 3 FALSIFIED (the menu-order reference does not carry BASE's year-before pessimism):** on S370 under BASE, in both years before a step, the reference removes at most 0.2 of rep.

## Falsified if

- **Item 1 FALSIFIED:** on every counting BASE non-step cell the mean |eb/bE| is under a quarter of the mean wd (the QUART test shown after Holm). INCONCLUSIVE: neither, or no cell counts.
- **Item 2 FALSIFIED:** S126's opening stays and every deciding household's every year changes under 0.1% of its states. INCONCLUSIVE: otherwise, unless HELD.
- **Item 3 HELD (YB2-REF):** both years read REF (s at least 0.5, the LO test shown after Holm). INCONCLUSIVE: either year MID or CONSTRUCT, or the years apart.

## Fair-test table

Arms: BASE and COV, XAS's, at the same states (BASE's paths and moves: a fixed-policy re-read); the constructs (the bequest and shortfall reads with their dead weight, the swapped re-choice, the rebuilt reader table, vb and vb41) are reads of the same tables at the same states, each built on its own arm's tables.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | XAS-R2's three (S370, bridge 4, S126) and S130 and S128 for incidence (the review's) | the same | SAME (chosen by the review before NSB, on the reader family's record; the incidence two decide nothing) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002, 2,000 a world | the same reads | SAME (both arms read at BASE's states on BASE's paths; the gate holds item 3's to XAS-R2's) |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points | 6, with the edge node a 7th slot in step years | TESTED (COV-B, as XAS-R2) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader | the reader with readerTax and the coverage node | TESTED (XAS's COV arm); the read-time constructs are measurements at the same states, each on its own arm's tables, not arms |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | NSB's files: one code across the run (the gate) | XAS-R2's files (code 98fed13c0e83), the derivation's records | ACCEPTED (the solver's changes since - FORCE-X's research flag off by default, the code stamp's scope, E2 only when called, E3-PCLS behind its flag, off - leave XAS's unit untouched; THE IDENTITY in the gate holds every item-3 read, ex5 and vb on S370 and bridge 4 to XAS-R2's at the same path, world and year, so a change that moved the unit refuses the run) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's read against the simulated) | item 1 r, the absolute value of eb/bE + wd, and e, that of eb/bE; item 2 the share of states whose move changes; item 3 the share s of rep the reference removes | the same | SAME (one definition for both arms) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per read, from the per-household files: year, world, path, the step class, and per arm the class in the top share cell, wd, the bequest and shortfall reads and one-step values at the arm's own move, hD, whether the arm's move is BASE's; per state of item 2, the year and per arm the move before and after the swap; per read of item 3, year, world, path, class, rr, ex5, ro, vb, vb41; per arm and layer-year the dead, share-axis dead and copied counts.
- **Item 1 (single look):** a CELL is a deciding household's reads in one arm and class - BASE in every reader year, COV in its non-step years, and BASE's non-step years apart - over the reads touching a share-axis dead node (wd above 0) whose arm's own move has a one-step bequest above 0 (a failing move or a zero bequest is left out and counted); a cell COUNTS where its mean wd is above 0.1. Per path, r = the mean of |eb/bE + wd| over the path's reads, e = the mean of |eb/bE| and w = the mean of wd. Fisher's paired randomization tests (reduce-7ar.mjs flipP, B 20,000 from fixed seeds), one-sided: TOL on each counting BASE all-years and COV non-step cell, mean(0.05 - r) above 0; QUART on each counting BASE non-step cell, mean(0.25 w - e) above 0; Holm over all of them. HELD when every counting TOL cell shows; FALSIFIED when every counting QUART cell shows; else INCONCLUSIVE (INCONCLUSIVE when no cell counts).
- **Item 2 (census):** under BASE, per deciding household and year s (the year before a reader year), the share of states whose chosen move changes when year s + 1's share-axis dead nodes take the nearest live node's bequest, resilience and shortfall on their share row, in every world and layer. Exact arithmetic over the states the paths reach. HELD when S126's opening changes, or a share is at least 0.01 over at least 100 states; FALSIFIED when S126's opening stays and every share is under 0.001; else INCONCLUSIVE.
- **Item 3 (single look):** BASE on S370 in each year before a step (2 and 6): per path D = the sum of (rr - ro), P = the sum of (rr - ex5), each signed so the year's sum of P is above 0; s = sum D / sum P. Tests LO, mean(D - 0.2 P) above 0, and HI, mean(0.5 P - D) above 0, Holm over the four. A year reads CONSTRUCT when s lies outside [-0.2, 1.2] (XAS-R's registered bounds), REF when LO shows and s >= 0.5, NOTREF when HI shows and s <= 0.2, else MID. HELD when both years read REF; FALSIFIED when both read NOTREF; else INCONCLUSIVE.
- **Secondary (declared, decides nothing):** none.
- **Reported, not items:** every cell's counts, mean wd, mean eb/bE, mean r and e, its tests' Holm p; S130's and S128's incidence (reads touching a dead node, mean wd); COV's changed moves beside BASE's; item 3's NODEQ share ((vb - vb41) over P), vb's share (XAS-R2's) and vb41's, and bridge 4's years; the dead, share-axis dead and copied counts.
- **NOT SETTLED**, if any gate fails: the fair-test gate on the logs (requireFairLogs); the stamps (one code and audit across the run, the registered prediction, each file its log's); a plant line; a household missing, repeated or not done; an arm's settings not taking; a ran line off XAS's unit; a self-check failed, or run on nothing where it must run (replicaNS, wdRead, deadTop and restore on each arm; replica, rebuild, nodes and fine on BASE where a year before a step follows year 0); a file missing, short or off its log's counts; XAS-R2's files failing their own fair-test gate; THE IDENTITY: an item-3 read, ex5 or vb on S370 or bridge 4 off XAS-R2's BASE read, ex5 or vb at the same path, world and year by more than 2e-12.
- **Declared choices, not derived:** the thresholds 0.05 and a quarter for item 1 (the deep review's), the 0.1 counting weight (the review's 'where wd > 0.1'), the share-axis rule (a dead node counts when its share row holds a live node: a row dead throughout is the survival cliff along wealth, grid.js l.425-428); 0.01, 0.001 and 100 states for item 2 (the author's: the review asked for counts, not a line); 0.5 and 0.2 and XAS-R's bounds for item 3 (the review's 0.5; XAS-R2's item 1 lines); a path's reads averaged (items 1) or summed (item 3).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | PR10 falls in every bridge year: a dead-node rule for the non-survival reads is designed (the share-axis dead node's values from its live neighbour, or its weight dropped, as #106's 'drop' does for survival off the reader), and tested on S126 with simulation if item 2 also holds | 0.67 |
| item 1 INCONCLUSIVE | the blend's incidence is read cell by cell from the report; a rule is designed only for the cells where it held | 0.27 |
| item 1 FALSIFIED | FLAG 1's incidence claim falls: the blend is a step-year matter, COV's edge node already its fix; no rule beyond step years | 0.06 |

## Decision fed

- **Item 1 HELD and item 2 HELD:** a dead-node rule for the non-survival reads is designed and its test registered (S126 with simulation, BASE against the rule, a fixed-policy re-read splitting any loss per O105) after 7u, as the maintainer's 6 Oct order puts fixes; 7an becomes COV's complement in a 2x2 (BASE and COV at 6 and 11 points), not its resolution test alone.
- **Item 1 HELD, item 2 FALSIFIED or INCONCLUSIVE:** PR10 falls as a read defect; the rule is designed, but its test waits for a household where item 2's moves change.
- **Item 1 FALSIFIED:** FLAG 1's every-bridge-year claim falls; no non-survival construct beyond step years; 7an as designed is unblocked by NSB.
- **Item 3 HELD:** YB2-REF carries BASE's year-before pessimism: the menu-order reference (O36) re-enters as a candidate fix, tested with simulation before adoption; 7an's top-cell resolution is not BASE's fix for it.
- **Item 3 FALSIFIED or INCONCLUSIVE:** YB2-NODEQ and CURV remain; the reported NODEQ share says which; 7an's design names the year-before pessimism as untested on BASE.
- **In every branch:** NSB leaves 7u's gates; 7u's pre-mortem names the blend's incidence on the candidate's bridge households (the candidate reads BASE's share axis) and item 2's changed moves; no product or default change.

## Provenance

- **The design:** the deep review after XAS-R2 (deep-review-log.md 6 Oct 03:10 UK: FLAG 1 the blend, FLAG 3 7an's arm, its DECISIVE TEST NSB, its CAUSE CREDENCES F3- and YB2-).
- **The build:** audit-nsb.mjs (audit-xasr2.mjs's unit and read assembly, with the dead weight per read, the swapped re-choice and the read-time rebuild); reduce-nsb.mjs (planted checks; its mutation run); preflight-nsb.sh (the three audit plants); derive-nsb.mjs; batch-nsb.sh.
- **Seen before registration (declared):** XAS-R2's results and files, and the review's scratch reads of them (FLAG 1's -0.354). The author ran derive-nsb.mjs while writing it, before any judged credence was written, and saw its draft credences: so this prediction declines to judge ("Judged: none" below), and its credences are the derivation's alone. Two build checks of the audit (runs.log 8 Oct, PREDICTION none, 4 points and 3 paths a world, S370 alone) printed its item lines at 4 points; the first showed the dead weight counting the survival cliff along wealth (a mean eb/bE of +0.072 at a mean wd of 0.733), and the share-axis rule above was written after it and before registration; no figure at 30 points was seen.

## Derivation script

- `derive: research/solver/derive-nsb.mjs > research/solver/results-derive-nsb.txt sha256 e52f5dc6688b094b`

## Point and interval

- **Item 1:** the mean r on a counting cell about 0.0055 (80%: 0.0028 to 0.10; the upper end judged, grade D away from S126's year 1).
- **Item 2:** the share of COV's correction the swap must supply to flip S126's opening, f* 0.734 (the swap judged to supply about 1, so the opening 59 -> 5); other years' changed shares 80% 0 to 3% (judged).
- **Item 3:** the share s about 0.24 (80%: -0.10 to 0.75; judged).

## Credence

- **Base rate, item 1:** 0.13 (it leans on the deep review's ranked cause F3-NSBLEND: the deep-review lead rate, results-scorecard.txt KIND BASE RATES)
- **Base rate, item 2:** 0.68 (an effect on decisions: the EFFECT kind's rate)
- **Base rate, item 3:** 0.13 (it leans on the deep review's ranked cause YB2-REF: the deep-review lead rate)
- **Item 1:** HELD 0.67, INCONCLUSIVE 0.27, FALSIFIED 0.06 (derived, results-derive-nsb.txt section 2: F3-NSBLEND halfway from the review's 0.44 to the lead rate (0.285) carrying HELD with 0.85; under the other causes the blend's arithmetic holding with a judged 0.6 (the bequest stored 0 at a failing state in every year, code grade A; the live floor away from S126's year 1 grade D); FALSIFIED on the rest with a judged 0.08)
- **Item 2:** HELD 0.90, INCONCLUSIVE 0.06, FALSIFIED 0.04 (derived, section 3: the chance the swap reaches f* = 0.734 of COV's correction, 0.86, with its share judged about 1, sd 0.25; with no flip a 1% share elsewhere judged 0.3, no change anywhere 0.25)
- **Item 3:** HELD 0.29, INCONCLUSIVE 0.21, FALSIFIED 0.50 (derived, section 4: YB2-REF halfway from the review's 0.45 to the lead rate (0.290) times both years' LO power; the rest, with the review's unassigned 0.15, times a judged 0.7 times both years' HI power)
- **Judged:** none (the author saw the derivation's draft credences while writing it, before any judgement: declared under Provenance)
- **Kinds:** 1 ATTRIB; 2 EFFECT; 3 ATTRIB

## Power

Item 1's tests run over every path's reads in a counting cell (thousands of paths a cell at 2,000 a world); at the live floor S126's year 1 shows (5.5e-3 against 0.05), the power is near 1 where the floor holds, and a cell whose floor exceeds 0.05 reads against HELD by design. Item 2 is a census. Item 3 from results-derive-nsb.txt section 4, at an ASSUMED noise (grade C, the midpoint node's per-path departure from its own mean share as the noise): LO at s 0.6 and HI at s 0.1 show in 40 of 40 resamples in both years; at the thresholds themselves the rule mostly reads MID.

## Budget line

5 jobs, four at once: XAS-R2's measured 8,344 s for three households (runs.log 5 Oct 22:09 to 23:00 UK) plus, per household, a chooser call for COV and two for the swap at every state of a bridge year and the year before, and the rebuilt reader tables (the 4-point build check: two solves 140 s and 164 s, the reads 16 s); about 6 core-hours, under two hours at four at once, revised from the preflight.

## Pre-mortem

- **First:** the deadTop check's premise fails at full size - a node with no accessible money survives a year whose income covers its bill - so the run refuses on a check, not a fault (the 4-point build check refused on it; the check reads only the years the reader marks, where the floor's bill is not covered).
- **Second:** the live floor in non-step years is far above S126's year 1 (spread bills read through the reader's own year), so item 1's TOL fails on a cell for a reason that is not the blend: INCONCLUSIVE, the cell report saying which.
- **Third:** item 2's swap changes S126's opening for a reason other than the blend - the copied values above the live node's true value - so HELD overstates the blend's decision weight; the fixed-policy split before any fix test is the guard.
- **Fourth:** item 3's rebuilt reference at read time reads differently from a solve on readerRef 'order' (the table solved with it): the rebuild reads the reference's shape only, not its feedback on the solved survival, so YB2-REF FALSIFIED here does not clear the order reference as a fix.

## Changes after seeing results

None.
