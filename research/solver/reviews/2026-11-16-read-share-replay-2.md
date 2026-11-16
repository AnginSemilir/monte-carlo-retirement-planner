# Review at the read, second round: the share replay (D110; `SHARE-REPLAY.md`; EXPLORATORY), the fix fa08ea68

Subject: the one fix answering the first round (`reviews/2026-11-16-read-share-replay.md`: FAIL, two BLOCKING, three
MINORs). It covers:
- the read's correction: `reduce-share-replay.mjs`, `results-share-replay.txt` printed again, and the dated section in
  `SHARE-REPLAY.md`;
- the new beside, `share-replay-beside.mjs` and `results-share-replay-beside.txt`;
- the rewritten report, `reports/2026-11-16-share-replay-read.md`;
- STATE.md section 6 action 3's sentence and DECISIONS-PENDING.md's "OPEN (16 Nov, evening)" entry.

I checked every claim in the report against the two results files and, where named, the share rules' files.

Read (blobs at fa08ea68):
- `reduce-share-replay.mjs` 8c1743f8e6a8, `share-replay-beside.mjs` 31ed1b0071e6;
- `results-share-replay.txt` bcbd8857405a, `results-share-replay-beside.txt` 4e86a3431524;
- `reports/2026-11-16-share-replay-read.md` 68f963b87950, `SHARE-REPLAY.md` 0e42764d9f50, `STATE.md` c9b659292c99,
  `DECISIONS-PENDING.md` 1ac804bebd2d;
- `git diff 9d72ba94 fa08ea68` over all of these and over `research/tests/fast-inputs.json`;
- `share-replay.mjs` and `batch-share-replay.sh` unchanged (7b837266b527).

Ran (each under `nice -n 19`; no solve, path, batch or rerun of the replay):
- `node research/solver/reduce-share-replay.mjs`: `results-share-replay.txt` byte for byte. Against the first print, only
  the mechanism line and the parting line differ.
- `node research/solver/share-replay-beside.mjs`: `results-share-replay-beside.txt` byte for byte.
- The planted suite and its plants:
  - `--planted`: 21 of 21;
  - `REDUCE_SHARE_REPLAY_PLANT=exactlevel` fails exactly the two class cases (floors at 0.8 and 0.800031, in
    `mechanismOf` and in `firstApartOf`);
  - `window` fails 2 and `unscaled` fails 1, as before.
- `check-state.mjs`: passes.
- My round-1 scripts (the session scratchpad's `rv/`, the files decoded afresh): every figure in sections A to G agrees.
  The sds agree to the third place; the beside uses (N-n)/(N-1) where I used 1-n/N.
- Two new scripts:
  - `check11.mjs`: the year the arms first part, on the saved and control paths too;
  - `check12.mjs`: the comparison-level sds at each variant's pooled control-loss rate.

Nothing of seed 7021, `d4-backup` or `d4b-backup` was opened.

Verdict: FAIL

## The first round's findings, as answered

- **BLOCKING 2 (the mechanism and the floor's rounding): answered.**
  - `stepLower` and `stepApart` take two levels within `LEVEL_TOL` (0.01) as one step. The menu's steps are 0.05 or more,
    and the floors' rounding 1e-4 or less.
  - The mechanism now reads 1,002 of 2,368 (42.3%), and the parting line prints the year the arms part.
  - The class has its planted cases and its plant.
  - The report, STATE.md and DECISIONS-PENDING carry the corrected figure.
  - `SHARE-REPLAY.md`'s dated section adds to the rule and changes none of it.
- **BLOCKING 1 (the "two failure modes" and the case for TK): answered, but the restated "What it means" brings in one new
  false claim (finding 1 below).** The rest holds:
  - the per-comparison picture is printed (sections A to F), and its figures are right;
  - the two failure modes, "the one change that helps with both", "wherever the share moves", "the rule spends more than
    TODAY would" and the mirror's "comes from" are gone;
  - the recommendation rests on TK's pooled figure and its consistency, and names its two failures and its unmeasured
    time.
- **MINORs 3 and 4: answered.** The sds, the controls' weight and a completed list of what the read cannot show are in,
  and the LOOKHOLD item is corrected.
- **MINOR 5: answered as I asked, but my own suggested inference does not hold (finding 2).**

## Findings

**1. BLOCKING. "It shows on more than half only on the two units where TODAY's level recovers most (S023-90 and
S147-90)" is contradicted by section F.**

The sentence is in the report's "What it means", in the bullet "The deep review's single cause is not shown".

Section F prints the mechanism on more than half of the lost paths on three units, not two:
- S023-90: 300 of 400 (75.0%);
- S147-90: 251 of 274 (91.6%);
- S227-90: 109 of 169 (64.5%).

S227-90's figure is exact: all 169 of its lost paths were replayed. On S227-90 TODAY's level recovers nothing net
(`-0.124`; it keeps 73 of the 169), while the top six recover `+0.923`.

So the sentence asserts the very link the data break: the mechanism showing where, and only where, TODAY's level
recovers. Read as written, it supports the deep review's cause on the 90/10 units. The record shows the mechanism on most
of S227-90's lost paths with the level swap failing there.

The bullet's conclusion, that the deep review's single cause is not shown, stands and is stronger with S227-90 counted.

What would answer it: say that the mechanism shows on more than half of the lost paths on three units. On two of them
(S023-90 and S147-90) TODAY's level recovers most, so both of the deep review's conditions hold there. On the third
(S227-90) the level swap keeps 73 of 169 and recovers nothing net, while the top six recover 0.923.

**2. MINOR. "The arms part at the start ... The deep review's signature for the minimum pot ... is absent" cannot be
read as evidence. This was my own suggestion in round 1, and I correct it here.**

The arms part in year 0, by a step of the menu, the split or a tier, almost as often on the paths both keep and on the
saved paths as on the lost ones:
- the lost paths: 2,267 of 2,368 (95.7%);
- the saved paths: 280 of 307 (91.2%);
- the controls: 1,800 of 2,000 (90.0%) (`check11.mjs`).

Two tables solved on two shares part at once on nearly every path. The measure therefore cannot show a signature that is
specific to the lost paths, either way.

What would answer it: keep the printed count, and say that the arms part in year 0 on 90% of the controls too, so the
line says nothing about the deep review's signature. Or drop the inference.

**3. MINOR. The comparison-level figures are less precise than section A's sds read.**
- Section A's sd is nought wherever no control path of a comparison was lost, because the plug-in rate is then nought. The
  beside's note says it is a lower bound. That covers most of the table's cells.
- Each variant's pooled control-loss rate over the ten is L 7, R 8, S 12 and TK 1 of 2,000. At those rates, the seven
  comparisons with 101 to 274 lost paths have recovery sds of L 0.23 to 0.63, R 0.24 to 0.67, S 0.30 to 0.82 and TK 0.09
  to 0.24 (`check12.mjs`).
- So these are within noise:
  - the 45/55 ranges in "What the units show" (TODAY's tiers `+0.444` to `+0.598`, the top six `+0.359` to `+0.475`,
    TODAY's level `+0.129` to `+0.396`);
  - S227-90's `-0.124` for TODAY's level, which is one control path (`-75.9` paths) on a comparison of 169;
  - the count behind the recommendation, "0.35 or more on eight of ten": MEANS S191-45's TK of `0.359` has an sd of
    about 0.21, and an unobserved control loss can only lower it.
- The comparison-level points that stand rest on large comparisons or on the kept counts, which are exact:
  - MEANS S061-dbpart (sds 0.04 or less);
  - FLAT S061-dbpart: each variant keeps 46 of 400 or fewer, and control losses can only lower that;
  - TODAY's level on S023-90 (337 of 400 kept) and S147-90 (243 of 274);
  - the top six on S147-90, under a quarter even with no control lost: they keep 42 of 274 and lose 16 saved paths.
- Pooled, the recommendation's basis stands: TK's `+0.4835` has an sd of 0.021.
- What would answer it: state the small comparisons' points by their kept counts, or print sds at the pooled rate beside
  them.

**4. MINOR. The equity's two summary lines overstate it.**
- "By comparison this is S061-dbpart's alone": the pooled positive sign is S061-dbpart's, but S191-45 FLAT (`+0.018`) and
  S227-90 (`+0.069`) are positive too (section E).
- "The equity explains the tiers' recoveries nowhere but S061-dbpart": on S061-dbpart it is a co-occurrence under MEANS
  only. Under FLAT the same couple's rule holds more equity still (`+0.505`), and TODAY's tiers keep 45 of 400.
- "Coincides with" or "goes with" would hold; "explains" is a causal claim with no decomposition.

**5. MINOR. Figures not in either results file, against the report's "Every figure below is printed in one of those two
files" (CHECKLIST 6).** Each is from my round-1 review, a unit log or arithmetic on printed figures:
- 0.800031 and 0.799995, and "under £5 a year";
- "68 to 77" paths a control path: the counts printed give 68.3 to 77.6;
- "330 to 622" paths both arms lose: from the unit logs;
- "204 of those eight comparisons' 370" (section D summed);
- "more than seven standard deviations".

Printing them, or naming their source, would do.

## What stands

- The read and its correction: MIXED, the four pooled recoveries with their sds, and the mechanism at 42.3%.
- The beside's sections A to G as printed.
- "What the units show", apart from findings 3 and 4.
- "What the read cannot show", and the recommendation as now put.
- STATE.md's restated sentence and DECISIONS-PENDING's restated bullets. They do not carry finding 1's sentence.
