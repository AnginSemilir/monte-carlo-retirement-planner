# Speed review, 23 Oct 2026

For the agent and the maintainer: where the solver's time goes, and the speed-ups that change no number. Measured on
`claude/project-access-i58m0x` at 2d7cce3 and again at its head, 0b403ac (V2's state check done, nothing running), in
scratch copies on a two-core machine. EXPLORATORY throughout: nothing here changes a default, a gate or the candidate.
The prototype is `speed-prototype.diff` beside this file (solve.js and adaptive.js are the same at both commits, and it
applies to both), the scripts are in `scripts/`, and every figure below is in `results-speed.txt` with its command (its
part E prints the ratios). An independent check of a first draft against the code and the runs found errors, one of them
in the prototype (finding 1); they are corrected here, and the checks it asked for were run.

## Verdict

Most of the solver's work is repeated work. Different moves leave a grid cell in the same position bit for bit, and a
move's expectation depends on nothing but that position, its tiers' rates and the table it reads: 72 to 84% of the
backward pass's expectations are duplicates. The forward chooser recomputes every move's year in every world (1,080
flows a decision for 120 distinct), and the adaptive reference values duplicate moves (76% of its work on S362).
Computing each distinct thing once is exact by construction, and measured exact: every table and layer, every move's
score and every simulated outcome the same bit for bit. On one core at 30 points the product's solve runs 2.4 to 3.0
times faster, the candidate's 4.1 times (S362), and the engine's run of a table 2.5 and 4.0 times (2.3 to 3.4 on the
small grids). Port it before V3 and V4, which are mostly solves and simulations. The speed-ups that change numbers (fewer
points or nodes, a smaller reference lattice, the ternary level search) wait for V3 and V4, the instruments that can
judge them. The maintainer has made the two calls this review raised (23 Oct): the product's path takes the changes
too, and D23's "the code it leaves" is the ported code. Gate 5 is not measured here, but on S362 its bound shows the
cause of the trouble: every E2 part builds the whole adaptive reference itself.

## Where the time goes (one core, 30 points, today's code)

| | SHIP, S224 | CAND, S362 |
|---|---|---|
| the solve | 268 s | 1,454 s |
| next year's reads (`readValues`) | 55% (expit 13%, locating 7%) | 51% |
| the adaptive reference's build | none | 264 s (16% of the profile); about the same at 6 and 8 points |
| the bridge step's split (`stepExpect`) | none | 11% |
| the flow, growth, the exact final year | 12%, 8%, 9% | 3%, 6%, 4% |
| the engine running the table, a path | 65 ms | 174 ms |

The shares are inclusive, from `--cpu-prof` profiles of the same settings (results-speed.txt, part C). The engine's
time is nearly all the chooser's, and of the chooser's the year's flows take 38% and the reads 37% (SHIP).

## The three changes

**S1, the cell's expectation memo** (solve.js: PASS 2, joint worlds, the tier state). The key is the post-decision
state's bits, the move's growth class (its tiers and every rate its growth reads, `act.real`, `sigma`, `volEffAt[t]` and
the node rates, bit for bit) and the layer and world read; a hash hit is confirmed word by word, so -0 and NaN never
merge. Each key is integrated once a cell (and world), and every move then adds its own terms (cut cost, raise, switch
charge) exactly as before. In the tier state one memo serves all of a cell's held pairs: a move that pays no charge is
integrated once, not once a pair.

**S2, the chooser's shared year** (`chooseAction`, a new `scoreMovesShared`). The flow and the switch charge once a
decision for every world and tier variant (the flow reads no world field, solve.js's E0 comment; a variant's flow is its
base move's), then S1's memo within each world. The chooser starts h at the move's cut cost, so h's node terms are stored
and added one by one in the original order: floating-point addition does not reassociate. It keeps its own scratch. The
old path still runs for a single table (no mixture), a taxable-account tier (`giaHoldCheck`), a state under seven slots
and Richardson's second table.

**S3, the reference's duplicate moves** (adaptive.js). At a lattice state, a floor move whose post-flow state and growth
in every world match an earlier move's takes that move's values. Before access the pension cannot be drawn, so draw
orders that differ only in where the pension sits pay the year the same.

| Check | Result |
|---|---|
| S1 and S3: each world's tables (`tableHash`) | the same, BASE against PROTO: S224 SHIP (10 and 30 points), S224 CAND (8), S224 joint worlds without the tier state (6), S362 SHIP (30), S362 CAND (6, 8 and 30) |
| S1: every layer of every world (`layerHash`) | the same, BASE against PROTO: S224 SHIP (10), CAND (8) and joint worlds alone (6), S362 CAND (6); the memos off against on, S224 SHIP and CAND (6) |
| S3: the reference's own arrays (`arefHash`) | the same with the memos off and on (S362, 8 points), at 6, 8 and 30 points, and at both estate weights |
| S2: every move's score against `scoreMoves`, at every decision of 10 or 20 paths | 885,600 scores on S224 SHIP, 885,600 on S224 CAND and 496,800 on S362 CAND (its reader years): all equal bit for bit |
| S2: the engine's outcomes on 50 to 200 paths (survival, fail age, end pots, tax, spend, cuts) | the same hash with the sharing off and on in every run, and as BASE's wherever BASE ran the engine too |
| planted: S1's key without the growth class; without the world (the tier state) | the tables' hash changes (S224 SHIP); the layers' hash changes (S224 CAND) |
| planted: S3's duplicate test without the growth class | the reference's hash changes (S362) |
| planted: S2 skipping the charge on tier variants; S2's key without the class | the score check throws (year 0; year 3) |

| One core, BASE beside PROTO | before | after | times |
|---|---|---|---|
| S224 SHIP, the solve, 30 points | 268.5 s | 111.8 s | 2.4 |
| S362 SHIP, the solve, 30 points | 363.8 s | 119.7 s | 3.0 |
| S362 CAND, the solve, 30 points (its reference build) | 1,454.2 s (263.7 s) | 353.3 s (62.3 s) | 4.1 (4.2) |
| S362 CAND, the solve, 6 points (its reference build) | 446.2 s (250.3 s) | 120.6 s (64.4 s) | 3.7 (3.9) |
| S224 SHIP, CAND and joint worlds alone, the solve, 10, 8 and 6 points | 90.9, 168.2, 41.8 s | 41.1, 69.7, 20.2 s | 2.2, 2.4, 2.1 |
| the engine, a path: S224 SHIP and S362 CAND, 30 points | 65.3, 173.8 ms | 26.1, 42.9 ms | 2.5, 4.0 |
| the engine: S224 SHIP, CAND, joint worlds and S362 CAND, small grids | 71.5, 74.9, 93.3, 156.1 ms | 26.3, 31.4, 40.5, 45.9 ms | 2.7, 2.4, 2.3, 3.4 |

The engine's "before" is BASE's own run beside PROTO. Within PROTO's process the same old path, run first, measured up
to a tenth apart from it (S362 CAND at 30 points: 173.8 ms in BASE, 157.0 in PROTO), so read the engine's times to about
a tenth; part E prints both. After S1 the product's solve is 30% reads and 23% the year's flows (S224 at 10 points, part
C): the backward pass's flows (PASS 1), which S1 leaves as they were, are the next thing to look at.

## Gate 5 (D11)

Gate 5 asks the candidate split across four cores (E2) to take at most 1.25 times the product's solve on one, on SIZE's
four households (bridge 4, S126, S370, share 0.50; results-e2x.txt, met on 6 Oct before the adaptive package). E2 splits
only the cell loop: every part runs the whole solve, so every part builds the reader's tables (solve.js's own E2 comment)
and the whole adaptive reference (`adaptiveFor` builds on the first read in each part's solve; e2.mjs shares only the
tables through its pool). On four cores the candidate therefore takes at least its reference build plus a quarter of the
rest. On S362, a bridge household but not one of the four:

| S362, 30 points | today's code | with S1 to S3 |
|---|---|---|
| CAND on one core (its reference build) | 1,454.2 s (263.7 s) | 353.3 s (62.3 s) |
| CAND on four cores at best: the build, then a quarter of the rest | 561.3 s | 135.1 s |
| SHIP on one core | 363.8 s | 119.7 s (the product takes S1 and S2) |
| the bound's ratio (the gate: 1.25 at most) | 1.54 | 1.13 against a ported product; 0.37 against today's |

On today's code no split of the rest brings S362 under the bar. With S1 to S3 the bound clears it by about 10%, inside
this machine's timing noise and before E2's barriers and uneven parts. The gate compares against the ported product,
the maintainer's call. The gate itself waits where STATE.md puts it, before Phase 4 registers, since N4's richer
menu (D22) changes every solve time; splitting the build across E2's parts (instruction 6) is the fix if it then fails.

## Smaller exact wins, not prototyped

- **Build the adaptive reference once a household.** It depends on neither the grid's points (the same arrays at 6, 8
  and 30 points, `arefHash` 6a6d738258739dc1) nor the estate weight (the same at 0.01 and 0.02), so a batch that solves
  one bridge household at several of them (V3's S362 and its deposit household, at both weights) can build it once,
  keyed by its inputs and the code.
- **`realAt` recomputes `log(1 + r)` on every call** (four logs and four exps; 9.9% of the candidate's profile).
  Caching the log per rate vector gives the same doubles and saves roughly half of it.
- **E2 for the product's own solve.** Shown exact on the product only at 4 points (`e2.test.mjs`); E2X measured the
  candidate's split at 3.7 to 4.3 times on four cores. Splitting the product too moves gate 5's denominator.

## What waits for V3 and V4

Everything that changes a number: the grid's points (the solve is linear in them), the quadrature's nodes, the
reference lattice (`na` 160 x `nb` 41 x `nz` 128 is what remains of the build after S3), the ternary level search
(refused with the tier state today) and a smaller tier menu. V3 says which resolution the policy has converged at and V4
whether a cheaper variant sits inside the ensemble's spread; until then each is a different solver, not a faster one.
N4's richer menu raises the number of moves, which the solve and the chooser scale with; S1 and S2 grow with the
duplicates a richer menu makes, so time N4 on the ported code.

## Found along the way

1. **The chooser's scratch is sized on its first call.** `scoreMoves` keeps `r._post` and `r._grown` at the length of
   the first state it scores. After a table has run forward paths (14 slots since 63fde6e), a seven-slot grid position
   is run as a forward state: the flow reads the last flow's slots 11 to 13, skips a grid cell's late-gain charge
   (fast.js line 585) and its zero clamp on the gain share (line 610), and growth takes its cash from slot 12 (line 665);
   the other way round it throws. So the scratch must be sized to the state; clearing slots is not enough.
   `scripts/stale-check.mjs` on S224 at 6 points, at both commits: 1 of 8 positions scored differently on a used table
   than on a fresh one (all 360 of its scores, by up to 5.8e-5) and its best move changed. The engine always passes the
   full state, so 7u-F is untouched; a probe that scores grid positions on a table it has simulated is not. The first
   prototype of S2 resized `r._grown` and made this worse (8 of 8 positions, and a `rankActions` that threw: the
   independent check's runs, part D). S2 now keeps its own scratch, and stale-check.mjs primes the scratch itself, so it
   fails on PROTO as on BASE (1 of 8) until `scoreMoves` sizes its scratch to the state.
2. **Counts of reads.** `READER_PROBE` (attached by audits) and `LOR_CLAMPS` (counted on every read under
   `readerBlend: 'logodds'`) see every read; with S1 and S2 a repeated position is read once. The memos should turn
   themselves off while a probe is attached or that blend is set.
3. **src/solver reads `process` at load.** grid.js (lines 38 and 39) and fast.js (line 76) read `process.env` without the
   `typeof process` guard solve.js uses, so N7's page will throw on import in a browser unless its build defines
   `process`.

## Instructions (in order; each with its acceptance test and time box)

After each of 1 to 4: the fast suite (CHECKLIST 4) and the e3pcls pin (D9). Adding a test to the fast suite edits
`run-all.mjs`, which needs the maintainer's unlock, and makes the test protected itself; a memo identity test there costs
about 3 CPU-minutes a household and arm with the reference lattice cut down (exactness does not depend on its size; S362
CAND at 4 points: 148 s with the memo off, 40 s on, part D).

How to port, for every step:

- **The defaults go in the code, not in the settings.** Make each switch default on inside the solver (`opts.expMemo !==
  false`, and the same for S2's and S3's), and add nothing to `PRODUCT_BASELINE`, `candidate.json` or
  `research-opts.mjs`. Then no configuration hash moves (the product's 07c069b6e330, the candidate's e65e5e99ba49, the
  frozen a61dba4ee1f5), no pinned default or registration changes, and "on in the product too" needs no edit to the
  decided defaults. The code's fingerprint does move, so the e3pcls pin is re-run after each step.
- **One commit per step, and identity is all or nothing.** The fix, S1, S3 and S2 go in separate commits, each with its
  test, so a fault can be traced to its step. One differing bit in an identity test is a bug in the port, not a
  tolerance: stop, fix or revert that step, and report; never loosen a test to make it pass.
- **Instruction 5's pass mark.** Every hash identical, and on S224 and S362 at 30 points, both arms, the solve and the
  engine each at least twice as fast as BASE run beside them. A ratio short of that is reported with a profile
  (`scripts/profile-run.mjs`), not tuned until it passes.
- **Old runs and the fair-test gate.** Every results file from before the port carries another code hash, and the gate
  wants one code for every file of a comparison (`fair-variables.mjs`, row 28). Run both arms on the ported code; never
  mix pre-port and post-port units, and never override the gate. Results already read (7u-F) stay as read: the port
  changes no number, so it gives no reason to reopen them.
- **The deposit household is S370**: it has a bridge and the adaptive reference, it pays money back into an emptied
  taxable account (the case V2's state check found, slot 13), and it is one of gate 5's four. If V3's own deposit
  household (D20 (8)) is another, test that one too.

1. **Fix finding 1 first** (an hour): `scoreMoves`' scratch sized to the state it is given, with `stale-check.mjs`
   extended to `chooseAction` and `rankActions` as its test, its plant the old sizing. The test primes the scratch
   itself with a forward-length state, as stale-check.mjs does, so it still sees the bug once S2 stops using it.
2. **Port S1** (half a day), with an option `expMemo` and no environment reads; off while a probe is attached or the
   log-odds blend is set. On by default in the research runs and the product's path alike (the maintainer, 23 Oct; it
   changes no number, so D12's decided defaults are not edited: the first rule above). Test (`solver-memo.test.mjs`):
   `layerHash` and `tableHash`, the memo off against on, at 6 points, on S224 (PASS 2 under SHIP, the tier state under
   CAND, joint worlds without the tier state), S362 (the reader, the adaptive reference, the step split) and S370, for
   SHIP, CAND, `FROZEN_OPTS`, DECOMP and joint worlds alone; its plants (the key without the growth class; without the
   world) each shown failing once.
3. **Port S3** (two hours), its switch an option, not adaptive.js's environment read. Test: the reference's arrays bit
   for bit off and on, on S362, S366 (the foot) and S370 at the candidate's lattice; its plant (the class left out)
   caught.
4. **Port S2** (half a day), with its own scratch and its switch an exported object, not the environment: one
   `process.env` read per move made the prototype's chooser 2.5 times slower (61 ms a path against 25 without it).
   `scoreMoves` stays as the reference that probes and `rankActions` use. Test: every move's score bit for bit against
   `scoreMoves` at every decision of 20 paths on S224, S362 (reader years) and S370, both arms, both plants caught, and
   the engine's outcomes the same on 200 paths.
5. **Re-time** (two hours on the agent's four-core machine, nothing else running): `speed-timing.mjs`, BASE beside the
   ported code, on S224 and S362 at 30 points, both arms; compare the ratios with this table, not the absolute times.
6. **Gate 5, when STATE.md calls for it** (before Phase 4 registers, after N4): as E2X measured it, SIZE's four
   households. If it fails, split the reference's build across E2's parts (a day): exact by the cell loop's own scheme,
   each lattice state claimed by one part, the arrays shared through the pool, a barrier at each bridge year, with
   `e2.test.mjs`'s identity check extended to the reference's arrays.
7. Then V3 and V4 as D20 orders them, on the ported code (D23, as the maintainer reads it). Both their solves and their
   simulations shrink by more than half, so the S224 ladder's estimate (about 11 core-hours, the deep review's one test
   within V3) should too.
