# Prediction: diag-xasr2

- **Run:** `research/solver/batch-xasr2.sh` - results/diagxasr2/case0-2.txt and the per-read files (audit-xasr2.mjs, one process a household: S370, bridge 4 and S126, each BASE and COV), read by reduce-xasr2.mjs into results-xasr2.txt
- **Kind:** test
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log); the design: the deep review after XAS-R (deep-review-log.md 5 Oct 23:18 UK) proposed XAS-R2 as the decisive next test - XAS-R re-read with its audit's node cache fixed (O109), and its three questions split: YB-TOPCELL against YB-REF and YB-NODEQ (item 1), VA-QUANT against VA-REF (item 2), S126-BLEND (item 3); the maintainer's standing go-ahead of 4 Oct covers it (non-locked research work)
- **Seeds:** 7002 tuning: XAS-R2 re-reads XAS's own reads (seed 7002, 2,000 paths a world) at the same states, and the reducer's gate holds BASE's and COV's reads and one-step values to XAS's saved files read for read. It chooses the next fix's design, which is tuning; no fix is read on it. Not 7005 (selection) and not 7004 (Phase 4's second seed).
- **Unmasking:** XAS-R2 removes no error from the product or the solve. It fixes an error in an audit (O109: XAS-R's node cache shared by the arms, which voided every COV reading) and re-reads at read time only; no arm changes. The known error its item 1 targets is the year-before read's sight of COV's correction only through the top cell's lower node (YB-TOPCELL; PR1's flat copy a year early). A fix there would leave S370's years 1-3 net pessimistic (O81's year-1 rep -1.28e-2 under BASE, -1.26e-2 under COV; results-derive-xas-review.txt): any fix's later prediction names that as unmasking, not harm. Item 3 reads which terms carry S126's step-year read errors; S126's survival loss is not read as COV's harm here (O105).
- **Mechanism:** reader.js:116 "c[i] = c[g.index(ip, lo, it, ig, ic)]" (the flat copy at an unsupported node, the top share node in every bridge year with a bill) against audit-xasr2.mjs's (v-b) node at the cell's midpoint, built on each arm's own tables (the O109 fix: the node cache keyed by arm and held tiers, every cached row checked against the solve that built it); grid.js:389 "resilience and shortfall reads, are unchanged." for item 3 (the bequest and shortfall reads with no reader construct, the dead node's b = 0 and h = failCost, solve.js l.1017-1024)
- **Plan section:** PLAN.md "XAS-R2", "O108", "O109", "O105", "PR1", "PR9", "PR10", "O80", "O99" and "7an"

## Question

XAS-R ended NOT SETTLED by its BASE guard (results-xasr.txt), and its COV half was void: its audit built COV's constructs on BASE's nodes (O109). The deep review after XAS-R asked three questions it could not answer:
1. Under COV, how much of the year-before representation error on S370 does a node at the top cell's midpoint, built on COV's own tables, remove? If most of it, the read sees COV's correction only through the cell's lower node (YB-TOPCELL); if little, the reference near the edge or the year-before nodes' own quadrature carries it (YB-REF, YB-NODEQ).
2. Why did (v-a), the supported node at the reference's half-way point, fail BASE's guard? Is it the edge node's 5-point quadrature at a state that straddles next year's step (VA-QUANT), or the reference mislocated at its edge (VA-REF)?
3. Under BASE, does S126's step-year read blend the dead top node's bequest and shortfall values into the read (bequest read low, shortfall high against their one-step values), and does COV's edge node remove that (S126-BLEND)?

## Derivation

- **The sizes and the power** (results-derive-xasr2.txt sections 1 and 2; XAS-R's files through every gate but its BASE guard, reading only the columns no node cache touched): COV's per-path representation error on S370 in the years before a step, and BASE's per-path movement of the midpoint node (built on BASE's own nodes, valid) as the noise proxy for item 1's D.
- **What each outcome would say.** Item 1: if the year-before read sees COV's step-year correction only through the top cell's lower node, a node at the cell's midpoint carrying the arm's own continuation removes most of the error (s 0.5 or more); if the error is the reference's or the nodes' own, the midpoint node removes little (s 0.2 or less). Item 2: if (v-a)'s failure is its 5-point quadrature at a straddling state, S* moves toward the copied value at 41 points by half or more of its departure; if the reference is mislocated, it barely moves. Item 3: if BASE blends the dead node's b = 0 and h = failCost into the top-cell read, the bequest read sits below its one-step value and the shortfall read above, and COV's edge node at the step removes half or more of each.
- **The constructs are exact where they are defined:** at a node, the read reproduces the solved survival (the node-reproduction check, per arm); the fine path at the solve's own 5 points reproduces S*5 (the fine check); every cached row is used only by the solve that built it (the cross check, O109's fault refused).
- **The checks, each failed on a planted fault first:** reduce-xasr2.mjs's 44 planted checks (every outcome of every item reached; EDGES: a cross-arm cache use, a check run on nothing in one arm only, the guard on vb at its margin, BASE's own rep not 0 with the guard's two terms each binding, the thresholds exactly, a share past its threshold the test does not show, item 3's reads outside the top cell), 34 of 34 mutations caught (results-reduce-xasr2-mutations.txt); the audit's cross check against the crossarm plant in the preflight.

## Prediction

- **Item 1:** stated as the registered direction only, HELD (YB-TOPCELL): on S370 under COV, the midpoint node removes at least 0.5 of rep in both years before a step.
- **Item 2 HELD (VA-QUANT):** over BASE's (v-a) nodes on S370, the 5-to-41-point change is at least half of the nodes' departure from the copied continuation.
- **Item 3 HELD (S126-BLEND):** BASE's top-cell step reads on S126 put the bequest below and the shortfall above their one-step values, and COV's error is at most half of BASE's on each.

## Falsified if

- **Item 1 FALSIFIED (YB-REF or YB-NODEQ):** both years read REF (s at most 0.2, the HI test shown after Holm). INCONCLUSIVE: either year MID or CONSTRUCT, or the years apart.
- **Item 2 FALSIFIED (VA-REF):** the ratio at most 0.25. INCONCLUSIVE: between 0.25 and 0.5.
- **Item 3 FALSIFIED:** COV's mean error at least BASE's on both the bequest and the shortfall read. INCONCLUSIVE: otherwise, unless HELD.

## Fair-test table

Arms: BASE and COV, XAS's, at the same states (BASE's paths and moves: a fixed-policy re-read); the constructs (the reader's read, (v-a), (v-a) on the fine points, (v-b)) are reads of the same tables at the same states, each built on its own arm's tables.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | XAS-R's: S370, bridge 4, S126 | the same | SAME (XAS-R's, chosen before it) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002, 2,000 a world | the same reads | SAME (both arms read at BASE's states on BASE's paths; the gate holds them to XAS's reads) |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points | 6, with the edge node a 7th slot in step years | TESTED (COV-B, as XAS) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader | the reader with readerTax | TESTED (XAS's COV arm); the read-time constructs are measurements at the same states, each on its own arm's nodes (O109's fix), not arms |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's read against the simulated) | the share of rep (read - ex5) vb removes; item 3's read - one-step | the same | SAME (one definition for both arms) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per read, from the per-read files: year, world, path, top cell, and per arm read, ex5, rr, plain, va, va41, vb, vaw, vbs; the (v-a) nodes (arm, world, year, S*5, S*41, p*, cL); S126's step-year reads per arm (bequest and shortfall, read and one-step) and top-cell class.
- **Item 1 (primary; single look):** COV's reads on S370 in each year before a step (years 2 and 6), per path D = the sum of (read - vb) and P = the sum of (read - ex5); s = sum D / sum P. Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000 sign flips from fixed seeds, one-sided) of mean(D - 0.2 P) above 0 (LO) and mean(0.5 P - D) above 0 (HI), Holm over the four. A year reads CONSTRUCT when s lies outside [-0.2, 1.2] (XAS-R's registered bounds), else TOPCELL when LO shows and s >= 0.5, REF when HI shows and s <= 0.2, else MID. HELD when both years read TOPCELL; FALSIFIED when both read REF; else INCONCLUSIVE.
- **Item 2:** over BASE's (v-a) nodes on S370 in the years before a step, the ratio mean |S*5 - S*41| / mean |S*5 - p* cL|. Exact arithmetic over the nodes the paths reach: HELD (VA-QUANT) at 0.5 or more, FALSIFIED (VA-REF) at 0.25 or less, else INCONCLUSIVE.
- **Item 3:** S126's reads in each reader step year (its year 1) along BASE's paths, in BASE's top share cell, per arm: eb = read - one-step of the bequest table, eh = the same of the shortfall table (one-step: scoreMoves' bq of BASE's move; h = surv + wB bq - the score with the resilience weight 0). BASE's signs: eb below 0 and eh above 0, each by a one-sided paired sign-flip test on per-path means (B 20,000), Holm over the two. HELD when both signs show and COV's mean error is at most half of BASE's on each; FALSIFIED when COV's mean error is at least BASE's on both; else INCONCLUSIVE.
- **Secondary (declared, decides nothing):** none.
- **Reported, not items:** every household, arm and year: rep and each construct's error and share removed (vb, va, va41); va41 against the guard's terms; the item 2 ratio on COV and on bridge 4; S126's opening terms (XAS-R's).
- **NOT SETTLED**, if any gate fails: the stamps; a plant line; a household missing, repeated or not done; an arm's settings not taking; a ran line off XAS's unit; a self-check failed or run on nothing - replica and top, and per arm nodes, cross, fine (cr on at least one arm); a per-read file missing, unstamped or short; XAS's files failing their own gate; a read or ex5 off XAS's at the same path, world and year; S126's openings off XAS's; item 3's reads missing, unclassed or with no top-cell read; THE BASE GUARD on vb (XAS-R's registered guard on the construct item 1 reads, S370 and bridge 4): under BASE, mean (vb - ex5) in a year above 5e-3, or more than 5e-3 further from the one-step value than the reader's own mean (read - ex5).
- **Declared choices, not derived:** the thresholds 0.5 and 0.2 for item 1 (the deep review's, deep-review-log.md 5 Oct 23:18 UK); 0.5 and 0.25 for item 2 (the review's 0.5; 0.25 the author's, so the band between them reads INCONCLUSIVE); a half for item 3's removal (the review's); the bounds -0.2 and 1.2 and the guard's 5e-3 (XAS-R's registered values); a path's reads summed.

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | the year-before error is the top cell's: 7an registers (its 11-point top cell is the midpoint node solved); the year-before edge node stays withdrawn unless item 2 reads QUANT | 0.40 |
| item 1 INCONCLUSIVE | no year-before fix registered on XAS-R2 alone; 7an waits; the next deep review weighs YB-REF and YB-NODEQ against the top cell on the reported reads | 0.35 |
| item 1 FALSIFIED | the error is the reference's or the nodes' own: a test of the spread reference's shape near its edge (O36, O81, O92) and of the year-before nodes' quadrature comes before 7an | 0.25 |

## Decision fed

- **Item 1 HELD:** 7an registers (O99, the 7an row); family 3's next fix is the table's resolution in the top cell.
- **Item 1 FALSIFIED:** 7an stays waiting; the next step is the reference's shape and the year-before nodes' quadrature.
- **Item 1 INCONCLUSIVE:** 7an stays waiting; the next deep review decides on the reported reads.
- **Item 2 HELD:** the year-before edge node may be re-proposed at the fine points, read against the guard on va41 first (O108, PR9).
- **Item 2 FALSIFIED or INCONCLUSIVE:** the year-before edge node stays withdrawn as a design (O108, PR9).
- **Item 3 HELD:** S126-BLEND supported for S126's flip; PR10 falls for S126; a reader construct for the bequest and shortfall reads may be designed; COV arms may enter a candidate with that construct named; S126's loss is still never COV's alone (O105).
- **Item 3 FALSIFIED or INCONCLUSIVE:** S126-BLEND stands as the flip's account only; no COV arm in a candidate on it.
- **In every branch:** coverage and readerTax stay off in the code; no product change; FORCE follows XAS-R2.

## Provenance

- **The design:** the deep review after XAS-R (deep-review-log.md 5 Oct 23:18 UK: FLAG 1 the cache fault, FLAG 2 the construct's placement, FLAG 3 S126; its DECISIVE TEST, XAS-R2).
- **The build:** audit-xasr2.mjs (audit-xasr.mjs with the O109 fix, the fine-point nodes and item 3); reduce-xasr2.mjs (planted checks 44; mutations 34 of 34: results-reduce-xasr2-mutations.txt); preflight-xasr2.sh; derive-xasr2.mjs; batch-xasr2.sh.
- **Seen before registration (declared):** XAS-R's results and observations (results-xasr.txt, results-xasr-observed.txt) and the deep review's scratch reads of them; their COV half is void (O109), and item 1's figures were never seen for a midpoint node on COV's own tables. Item 3's reads were never measured.

## Derivation script

- (the sizes, the power, the credences: written after the judged credences below are committed)

## Point and interval

- **Item 1:** the share s the midpoint node removes, about 0.45 (0.1 to 0.85).
- **Item 2:** the ratio about 0.5 (0.15 to 0.9).
- **Item 3:** COV's error about 0.3 of BASE's on each term (0 to 1).

## Credence

- **Base rate, items 1-3:** 0.10 each (each leans on a deep review's ranked cause: the deep-review record's rate, results-scorecard.txt KIND BASE RATES)
- **Judged, item 1:** HELD 0.40, INCONCLUSIVE 0.35, FALSIFIED 0.25 (the author's judgement, written before the derivation: the review puts YB-TOPCELL at 0.45 against YB-REF 0.15 and YB-NODEQ 0.12, and BASE's midpoint node stayed near the reader where there is little to remove, but its ranked causes have read as ranked in 1 of 19 items, and either year in the middle band reads INCONCLUSIVE)
- **Judged, item 2:** HELD 0.45, INCONCLUSIVE 0.25, FALSIFIED 0.30 (the author's judgement, written before the derivation: the review puts VA-QUANT at 0.50 against VA-REF 0.35; XAS's straddle slice had a quadrature error twenty times the average, which favours QUANT, but the nodes' departures from the copy were large, up to a clamp, which a quadrature change may not reach)
- **Judged, item 3:** HELD 0.35, INCONCLUSIVE 0.40, FALSIFIED 0.25 (the author's judgement, written before the derivation: the review puts S126-BLEND at 0.50 and says it explains the flip, not the loss; the step-year read errors were never measured, and both conditions - BASE's signs and COV's removal of half - must hold)
- **Kinds:** 1 ATTRIB; 2 ATTRIB; 3 ATTRIB

## Power

Item 1 from results-derive-xasr2.txt section 2 (to be committed after the judged credences). Item 2 is exact arithmetic over the nodes the paths reach. Item 3's sign tests run over S126's 6,000 paths' top-cell step reads; its removal condition is exact arithmetic.

## Budget line

3 jobs: XAS-R's measured 8,344 s (runs.log 5 Oct 22:09 to 23:00 UK, three at once) plus the fine points at each (v-a) node and S126's forward reads; about 2.8 core-hours by the review's estimate, revised from the preflight; three at once, about an hour.

## Pre-mortem

- **First:** the fix leaves another shared state - the held taxable tier was left out of XAS-R's key (O109, NOT CHECKED); XAS-R2's key carries all three held tiers, and the cross check refuses any reuse across solves, but a state the key does not name (the giaHold flag) could still be shared within one arm.
- **Second:** COV's midpoint node lands in the guard's band on BASE but moves COV's reads past the one-step value (CONSTRUCT), as (v-a) did on BASE: then item 1 tells nothing, and the review's YB-TOPCELL stays untested.
- **Third:** item 2's ratio is dominated by the clamped nodes (va at the clamp on most of S370's year-2 reads under BASE), where neither quadrature changes S* much: the ratio reads REF for a reason that is neither story.
- **Fourth:** S126's top-cell step reads are few (its one step is year 1, and its states may sit inside the cell), so item 3's sign tests lack power and it reads INCONCLUSIVE.

## Changes after seeing results

None.
