# Prediction: diag-7ar

- **Run:** `research/solver/batch-7ar.sh` - results/diag7ar/case0-4.txt (audit-7ar.mjs, five S130 units, one process a unit), read beside 7ap's records (results/diag7ap); reduced by `reduce-7ar.mjs` in the real tree into results-7ar.txt
- **Kind:** test
- **Written:** 3 Oct, before the run (its time is its registering commit's, git log); designed by the deep review after 7ap (deep-review-log.md, 1 Oct 09:38 UK) as its decisive test for O76, kept by the deep review after 7aq (3 Oct 18:17 UK) with its no-reader control on S130 itself; run on the switch margin, held to 7ap's lines (the maintainer's decision for the charge, 3 Oct 18:51 UK)
- **Seeds:** 7002 tuning (2,000 paths a world at each of the three worlds' nodes, the same paths in every arm, as 7ap). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the interpolated allowance axis (PCLSI) removes a known error - the used-allowance axis's absorbing snap (O71) - and with it the bridge stage's optimism rose on S130 and S370 in the bad world (O76): a fix of a known error that makes a result worse, not the fix's fault until a decomposition splits the blame (RULES.md section 9). This run is that decomposition: item 1 splits the rise between the read of the next year's table (where the reader's flat copy of the continuation sits: unmasking) and the quadrature and policy terms (what the option does to the moves), item 2 holds the reader off (OFF on the same household), item 3 holds the flag blend off (PCLSF). Nothing here is adopted.
- **Plan section:** PLAN.md "7ar"

## Question

Under the interpolated allowance axis, S130's bridge-stage optimism in the bad world rose from 3.01 to 5.18 points a path (results-7ap.txt; O76). Where does the rise sit: in the read of the next year's table at the path's own position - the reader's flat copy of the continuation along the share row (reader.js l.110 and l.125), O76's ranked cause (1) - or in the quadrature over the year's return (2), or in the moves (3)? Does it need the reader at all (OFF on S130)? And is it the lump-taken flag blended between the allowance buckets 0 and 0.5, acting through the tables (4)?

## Derivation

- **The split** (grade A, the code): a path-year's residual, the claim at t less the claim at t + 1, equals (the claim at t less the read of world k's year-(t + 1) table at the path's position at t + 1, from the layer of the tier pair the move goes to) plus (that read less the claim at t + 1); a path-year with no claim at t + 1 (the path fails, or the plan ends) carries the claim less the outcome. So each path's bridge-stage residual - 7ap's stage line - is exactly quad + read + end, and arms on the same shocks pair path by path. The claim at t is scoreMoves's quadrature over five return nodes of the same read (solve.js l.1303-1311), and the forward run's year is the solve's step for step (runPolicy: the year's flow, the switch charge, then growth at the path's own return; solve.js l.1367-1379 against scoreMoves's l.1265-1305), so the quad term is that quadrature's error at the realised return.
- **What the records give** (derive-7ar.mjs, results-derive-7ar.txt): S130 (access at plan year 2 of 39) bridge stage, world 0: DEFAULT 3.0059 (sd 12.0129), PCLSI 5.1787 (sd 11.8583), all 2,000 paths through the bridge in both, so no end term enters world 0's bridge stage; the rise r 2.1728, r/3 0.7243, 2r/3 1.4485 points a path. World 1: 0.4810 to 1.3592; world 2: -0.0032 to 0.0529. The residual at year 0 carries the rise (world 0: 2.98 to 5.19; year 1: 0.03 to -0.01). With access at year 2, the bridge stage is years 0 and 1: its read terms are the reads of year 1's table (a reader year) and of year 2's (access, a plain table read).
- **The spike plan years (O69's gate)** (results-derive-7ar.txt, world 0): DEFAULT y0 2.98, y16 0.82, y17 2.66, y18 4.56, y19 3.71; PCLSI y0 5.19, y16 0.00, y17 0.23, y18 0.12, y19 -0.20. Named here: under the snap, plan years 17 to 19 (the used allowance crossing 0.75, O71) and year 0; under the interpolated axis, year 0 alone. The reducer prints the residual at years 0, 1 and 16 to 19 for every arm and world.
- **The flag** (grade A, the code): grid.js toVec sets the lump-taken flag (slot 5) to 1 on every allowance bucket above 0, so under PCLSI a use between 0 and 0.5 blends a flag-0 node with a flag-1 node; with the buckets 0, 0.01, 0.5 and 1 (PCLSF) a use from 0.01 to 0.5 blends two flag-1 nodes, and only uses under 0.01 blend the flag. Every bridge-year read is at used share 0 (the deep review after 7ap, grade A for that only), so the flag can act only through the tables the bridge reads (cause 4).
- **Claude's choices, before any run:** world 0 for the items (where the rise is: 2.17 against 0.88 and 0.06); a third and two thirds as the bands (7aq's); the READER rise's point r taken as known in items 2 and 3, as 7ap took h; the OFF control on S130 under TS+J with O70's gap declared (under TS+J the tables value the policy the paths run).

## Prediction

Item 1 HELD: the read term carries two thirds or more of the world-0 rise (cause 1). Item 2 HELD: with no reader, S130's bridge stage rises by a third of r or less under the interpolated axis. Item 3 HELD: holding the flag off the blend (PCLSF) removes a third of r or less.

## Falsified if

Item 1: the read term carries a third of the rise or less (the test of mean(R/3 - d) above 0 under 0.05 after Holm). Item 2: OFF rises by two thirds of r or more. Item 3: the flag carries two thirds of r or more.

## Fair-test table

Arm A is READER DEFAULT (the allowance axis snapped; 7ap's unit 2, held to its record line for line); arm B is READER PCLSI (interpolated; 7ap's unit 3, held to its record). The controls: READER PCLSF (interpolated on the buckets 0, 0.01, 0.5 and 1) and OFF DEFAULT and OFF PCLSI (no reader). Every arm runs the same 2,000 paths a world (seed 7002), so per-path terms pair.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 17 | The grid: points, shares, gain buckets | 30 points; the allowance axis 0, 0.5, 1 by nearest snap | the same axis interpolated (PCLSI); the control PCLSF on 0, 0.01, 0.5, 1 interpolated | TESTED - the allowance axis alone; the gate holds the axis line and every other line |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the bridge reader | the bridge reader; the OFF controls none | TESTED on the OFF controls only (item 2): the reader off, O70's policy gap declared |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this run (the code as it stands) | this run | SAME - every arm in this run; READER DEFAULT and PCLSI are also held line for line to 7ap's records (7ap's code id, the same solver code: the decomposition adds lines and changes none) |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated) | the bridge-stage residual per path, split into quad, read and end terms | the same | SAME - a new reading (audit-7ar.mjs's dec, dbin and pstage lines), the same definition in every arm; its three terms sum to 7ap's residual, which the gate checks by year, by bin and by path |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | SAME - Fisher's paired randomization test on per-path differences (no standard error enters a reading) |
| 32 | The table's number is never the result: survival is simulated | the claims and reads are the tables' | the same | ACCEPTED - this is a diagnostic of the tables' own consistency along simulated paths; no survival claim rests on it |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** each arm's world-0 per-path bridge-stage terms (quad, read, end; the pstage lines), paired by path. S_j = quad + read + end. R_j = S_j under READER PCLSI less under READER DEFAULT; r = mean R.
- **The test:** for a set of per-path values x, Fisher's paired randomization test of mean x above 0, one-sided (sign-flip, B = 20,000 flips from a fixed seed, p = (1 + flips at or above) / (1 + B)): exact under a null symmetric about 0, approximate for a mean under a skewed null (the stated limit; its size on an exponential null checked in the reducer's planted cases). ALPHA 0.05; Holm over each item's two directions.
- **The premise:** the rise is there when the test of mean R above 0 gives p under 0.05. Without it every item reads INCONCLUSIVE (NO RISE).
- **Item 1 (primary; single look):** d_j = read_j under PCLSI less under DEFAULT. HELD when the test of mean(d - 2R/3) above 0 is under 0.05 after Holm; FALSIFIED when the test of mean(R/3 - d) above 0 is under 0.05 after Holm; else INCONCLUSIVE.
- **Item 2 (single look):** O_j = S_j under OFF PCLSI less under OFF DEFAULT. HELD when the test of mean(r/3 - O) above 0 is under 0.05 after Holm; FALSIFIED when the test of mean(O - 2r/3) above 0 is; else INCONCLUSIVE.
- **Item 3 (single look):** F_j = S_j under READER PCLSI less under READER PCLSF. HELD when the test of mean(r/3 - F) above 0 is under 0.05 after Holm; FALSIFIED when the test of mean(F - 2r/3) above 0 is; else INCONCLUSIVE.
- **Reported, not items:** the three terms by world and arm with a descriptive paired 95% band (not a reading); the read term by year with the read's unsupported weight (the stencil's weight on nodes whose reader chance is under 0.5) and row-copy weight; the bridge stage by the unsupported weight (u0, under 0.25, 0.25 or more, and the end path-years) and the share of the read term's rise from 0.25 or more (the plan's prediction 1 names two thirds or more there; descriptive, the bins differ between arms); the moves to access (cause 3); the residual at plan years 0, 1 and 16 to 19 (O69); the tables and openings.
- **NOT SETTLED:** any gate fails (the stamps of 7ar and 7ap; a unit missing, twice, not done or unregistered; a setting not the registered one, the switch margin not 0.001; an axis not its arm's; READER DEFAULT or PCLSI not 7ap's unit line for line; a twin's ran, joint or access line differing; a missing line; 7ap's own consistency checks on any unit; the three terms not summing to the residual by year, by bin or by path; a row-copy weight above the unsupported weight, or either not 0 with no reader; a moves count off the paths).
- **Declared choices, not derived:** world 0; the third and two thirds; r taken as known in items 2 and 3; B = 20,000.

## Decision fed

- **Item 1 HELD and item 2 HELD:** the reader is named for O76 (grade B: one household, one seed): the rise is in the read of the next year's table and needs the reader. Next: a fix of the reader's flat copy that keeps the solve a backward induction (the ledger's 1 Oct 10:37 row), registered as its own test and run on the charge (P) before it joins the research candidate (the 3 Oct 18:51 row); pclsInterp with that fix becomes a Phase 4 candidate only if the fix works (the 1 Oct 10:37 decision); the default stays the maintainer's.
- **Item 1 HELD, item 2 FALSIFIED:** the read error is the interpolated table's own, not the reader's: O76 re-ranked to the read of the allowance axis, a deep review ranks before any fix; pclsInterp stays out.
- **Item 1 HELD, item 2 INCONCLUSIVE:** the read term named, the reader not separated: S370 added (the plan's row: about 1.2 core-hours more) before any fix.
- **Item 1 FALSIFIED:** the quadrature or the moves carry the rise (the reported quad term and moves say which): the reader's fix is not pursued for O76; pclsInterp stays out; the next deep review ranks.
- **Item 1 INCONCLUSIVE:** S370 added (the plan's row: S370 only if S130 is ambiguous).
- **Item 3 FALSIFIED:** the flag blend acting through the tables is a cause: any candidate built on the interpolated axis holds the flag off the blend (PCLSF's buckets), tested with it. **Item 3 HELD:** cause 4 is retired for S130 (grade B). **INCONCLUSIVE:** cause 4 stays NOT CHECKED.
- **In every branch:** no default change, no product change (O71: none before Phase 4), no 7u, no seed 7013; the draw-pause measurement (O71, O77) is not affected.

## Provenance

- The design: the deep review after 7ap (deep-review-log.md, 1 Oct 09:38 UK) and its plan-auditor findings (BLOCKING 1 of 1 Oct 10:06 and 10:08 UK: cause 4 separated or said why not; MINOR 3 of 10:08: O69's and O70's gates); the deep review after 7aq (3 Oct 18:17 UK: keep 7ar, its no-reader control OFF on S130); the maintainer's decisions of 1 Oct 10:37 UK and 3 Oct 18:51 UK; PLAN.md 7ar, O76, O69, O70, O71.
- The build: audit-7ar.mjs (7ap's audit with the decomposition added; its 7ap lines unchanged, so READER DEFAULT and PCLSI are held to 7ap's records); reduce-7ar.mjs (planted cases with OUTCOMES REACHED on all three items and an EDGES line; 7ap's own checks re-run on every unit; mutations, results-reduce-7ar-mutations.txt); preflight-7ar.sh and preflight-parse-7ar.mjs; derive-7ar.mjs; batch-7ar.sh. The four-bucket axis (pclsBuckets [0, 0.01, 0.5, 1] with pclsInterp) solved S130 at 4 points in the session's dev solve (3 Oct: table 50.0637 against 50.0638 on three buckets; not a registered record).
- The records: results-7ap.txt and its runs (results/diag7ap), read only through their stamps.

## Derivation script

- `derive: research/solver/derive-7ar.mjs > research/solver/results-derive-7ar.txt sha256 59d740976c493e41`
  (the bridge stage by world and the rise; the residual at the named plan years; the thresholds; power by the arms' correlation; the time).

## Point and interval

80% intervals, the author's:
- Item 1: the read term's share of the rise 0.65 (0.1 to 1.0).
- Item 2: OFF's rise 0.5 points a path (-0.5 to 2.0), against r 2.17.
- Item 3: the flag's part F 0.2 points a path (-0.5 to 1.0).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.45; 2 (HELD), 0.45; 3 (HELD), 0.6. Item 1: the rise sits at year 0, whose read term is the read of year 1's table - a reader year - so cause 1 has the location; but the year-0 claim is itself built on the same tables, and the interpolated axis moves both the claim and the read, so a quad term moving with it (cause 2) or the moves changing (cause 3) are live. Item 2: OFF reads year 1's table directly; if the rise is the interpolated axis's own read error, OFF rises too. Item 3: every bridge-year read is at used share 0, so the flag acts only through the values those tables carry from later years, a second-order route.

## Power

- **The rise and item 1** (results-derive-7ar.txt): 7ap printed each arm's per-path sd (12.01 and 11.86 in world 0) but not their pairing. At a correlation of 0 between the arms' per-path stage residuals, sd(R) 16.88 and the rise's z 5.76; item 1 at a read share of 1 or 0 has z 5.76 with no noise in the read term beyond R's, 3.19 with noise of sd(R)/2; at correlation 0.8, 12.87 and 7.14. One-sided at 0.05 after Holm over two needs z about 1.96; power 0.8 at about 2.8. So item 1 resolves a share of 1 or 0 at 2,000 paths even unpaired; a share near a band edge (a third or two thirds) reads INCONCLUSIVE.
- **Items 2 and 3:** the same paths and the same sd scale; the bands r/3 and 2r/3 are 0.72 and 1.45 points a path, so an OFF rise or a flag part near 1.1 points reads INCONCLUSIVE.
- **Time** (results-derive-7ar.txt): 7ap's measured S130 units times the current host's 0.89 (results-host.txt): 2,156 to 3,028 s a unit, 3.40 core-hours, 1.20 hours on four cores; the OFF units at READER's time and the decomposition's extra reads NOT CHECKED.

## Budget line

O76's decisive test (the deep review after 7ap), before any allowance-axis design: about 3.4 core-hours, about 1.2 hours on four cores.

## Pre-mortem

- **Most likely:** item 1 HELD or INCONCLUSIVE with the read term large, item 2 INCONCLUSIVE (OFF moves by about half of r: the interpolated axis's own read and the reader's copy both contributing), item 3 HELD.
- **Second:** item 1 FALSIFIED - the year-0 quad term carries the rise because the interpolated axis lowers the year-1 values the year-0 claim integrates unevenly across the return nodes (a kink between nodes), cause 2 at the level O76's ranking put it.
- **Third:** NOT SETTLED - READER DEFAULT or PCLSI is not 7ap's unit. Unlikely from code: audit-7ar.mjs prints 7ap's lines through the same code; the solver files are unchanged since 7ap ran (code id); a difference would point to state the code id does not cover.
- **Fourth:** the read's unsupported weight is 0 on nearly every bridge read (the reader's chance 0.5 or more wherever S130's paths sit in year 1), so the bins cannot place a read-term rise on the flat copy itself: item 1 still reads, and the reader is named only through item 2.
- **The smoke run:** smoke.sh (locked) does not run audit-7ar.mjs; the preflight through the launcher (preflight-7ar.sh: all five units at 4 points, read by preflight-parse-7ar.mjs through the reducer's own parse, gate and reading, with planted faults) stands in, and the launcher's smoke run covers the solver code every solve here calls.

## Changes after seeing results

None.
