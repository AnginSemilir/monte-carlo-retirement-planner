# N1, assessed before any build (EXPLORATORY), 26 Oct

The maintainer, 26 Oct: "Begin planning out and testing n1", then "First assess if n1 is likely to be worth investigating,
and/or if there's a better solution, or the best solution is already there". Written, committed and pushed before the
test below is launched. One smoke run was made before writing; it is declared under the test.

## What N1 is, and why it was proposed

N1 (EXTERNAL-REVIEW.md, Part B, Step 6) replaces the pension-share axis with coverage in the bridge years. Coverage is
accessible money over the bridge's remaining need, with a fixed node at 1, so the cliff where the money runs out before the
pension opens sits on a grid line. N1 is judged against the reader package, and the reader is deleted if N1 matches or
beats it. The case for it was F8, complexity: the reader and its variants carried 23 of the 35 premises at risk. The
nearer option, COV-B (a node at the cliff), read inconclusive on 5 Oct. Coverage itself (option A) was never built.

## What is already known, with no new run

- **The package is already a bridge solver with fine resolution.** The adaptive reference values the bridge on its own
  lattice: 160 points of accessible money (a log axis from half the year's bill to three times the remaining need), 41
  of the ISA share, and each gain bucket (`adaptive.js`, `adaptiveLattice` in candidate.json). A coverage axis in the main
  grid would carry perhaps 8 to 12 nodes.
- **The main grid's resolution where the cliff runs is not binding with the package in.** V3, 24 Oct (`results-v3.txt`):
  a finer share axis moved the panel by -0.016 survival points at W0.02 and -0.014 at W0.01.
- **The package's own variants are interchangeable.** V4, 24 Oct (`results-v4.txt`): the plan reference (DECOMP) is
  within 0.16 points of the adaptive one on every household; the candidate without the RS split is identical. The best
  variant everywhere is the candidate at a finer resolution. Its gap on the panel's bridge households is 0.49 points
  (S370) and 0.41 (S380) at W0.02, and 0.00 on S362.
- **Without a reader, the table misreads the bridge badly.** 7ar, 3 Oct, S130 world 0 at 30 points (`results-7ar.txt`):
  the bridge stage's read term was -59.3 points a path with the reader off, against +2.7 with it.
- **The package's cost** is mostly the reference's build, about 75 to 83 s a solve (S362, S366, S370; S3's
  `results-adaptive-dup.txt`), in a solve of about 560 s at 45 points.

So the package already does what N1 would do, at a much finer resolution. On outcomes N1 could at best match it, and its
case would rest on a simpler, faster solve. That case stands only if the package no longer earns its place. No current
measurement shows either way: V4 never ran the candidate without the package.

## The one test before anything is built

- **Arms:** CAND (candidate.json as it stands, hash fcd8096217b7) and NOREADER, the same with the package removed: the
  reader off, and `bridgeStep`, `readerRef`, `adaptiveLattice` and `readerSplit` unset.
- **Households:** the panel's two tight bridges, S370 and S362, two more from the library, S366 and S368, and S380, a
  panel household with a bridge its accessible money covers. Accessible money covers 0.54, 0.47, 0.77, 0.42 and 2.12 of
  the bridge at the floor (`n1/bridge-scan.txt`). S364 is left out: it survives under 0.5% under either arm (O132), so
  it carries no signal.
- **Settings:** 45 wealth points, estate weight 0.02, the same 8,000 paths of the tuning seed 7002, paired. The solver's
  forward run scores the arms (7u-F found no fidelity gap between it and the engine). The code is the agent's 5b7684a,
  unmodified, with e3pcls pinned. The read also reports where the failures fall (before the pension opens or after) and
  the solve time.
- **Declared: the smoke run made before writing.** S370 at 6 wealth points on 200 paths: CAND 85.5%, NOREADER 76.0%,
  with failures before the pension opens 2 against 32.

## Prediction

NOREADER loses beyond noise on S370, S362, S366 and S368, with point guesses of -2, -1.5, -1 and -1.5 points of survival.
Most of each loss comes from failures before the pension opens. S380 is within noise. NOREADER solves about 15% faster.

## The rule: what each outcome decides

- **NOREADER within 0.25 points and within noise of CAND everywhere**, in survival and the whole score: the package no
  longer pays. Delete it, for a simpler and faster solve; N1 is not needed.
- **A loss beyond noise of at least 0.5 points anywhere:** the package does real work. N1 could at best match it, so do
  not build N1 now. Simplify by N5 instead: delete the reader's losing variants and keep the one package. Reopen N1 only
  if a measured failure of the package on simulated outcomes appears.
- **Anything else:** the package's value is marginal, and deleting it is the maintainer's call (simplicity and time
  against a fraction of a point).

## The result

Read by the rule above (`n1/results-n1-reader.txt`, printed by `reader-read.mjs` over `n1/probe/`). Every arm ran on one
code (d1f4a045aec5), 45 points, W0.02, the same 8,000 paths of seed 7002. The differences are NOREADER less CAND.

| Household | Survival, CAND to NOREADER | Change (95%) | Paths saved / lost | Failures before the pension opens | Solve |
|---|---|---|---|---|---|
| S362 | 49.13% to 36.55% | **-12.58** (-13.31 to -11.84) | 5 / 1,011 | 4,069 to 5,075 | x0.80 |
| S370 | 83.94% to 77.05% | **-6.89** (-7.60 to -6.17) | 168 / 719 | 44 to 874 | x0.80 |
| S366 | 99.81% to 99.74% | -0.08 (-0.14 to -0.02) | 0 / 6 | 0 to 0 | x0.76 |
| S380 | 73.15% to 73.15% | 0.00 (-0.40 to +0.40) | 133 / 133 | 0 to 0 | x0.82 |
| S368 | 0% to 0% | none: no path survives either way | 0 / 0 | 8,000 to 8,000 | x0.78 |

**Verdict, by the rule: the reader does real work.** Without the package the candidate loses 12.6 points of survival on
S362 and 6.9 on S370, almost all of it to failures before the pension opens. N1 could at best match it, so it is not
built now.

**Against the prediction:** the losses on the two tight panel bridges were far larger than guessed (-2 and -1.5). S366
lost less than guessed (-0.08 against -1), though beyond noise. S380 was within noise, as predicted. The package costs 18
to 24% of the solve, against the 15% guessed.

**Noted:** S368 carries no signal. It fails before the pension opens on every path under both arms, so it should have
been left out with S364 (an error in the choice of households, not in the test). On S370, failures after the pension
opens fell without the package (1,241 to 962), because more of the paths that would fail later fail in the bridge
instead.

## The recommendation

- **N1: do not build.** The package is a fine-grained bridge solver and is worth 7 to 13 points of survival on the tight
  bridges. A coverage axis of 8 to 12 nodes in the main grid would have to match a 160-point lattice just to break even.
- **The better route to N1's goals, a simpler and faster solve:** keep the reader but make it cheaper. The package's
  cost here is 87 to 133 s a solve, and the adaptive reference's build accounts for about 75 to 83 s of it. In V4 the
  plan reference (DECOMP) was within 0.16 points of the adaptive one on every panel household, and the RS split changed
  nothing. Those reads were on 7u-F's candidate, before HR, the third step and the table without the dealing cost, so
  check them on the latest candidate before deciding: CAND against the candidate on the plan reference without the RS
  split, on S370, S362, S366 and S380, by the D30 kind of rule.
- **Either way, N5:** delete the reader variants that lost or are unused, so the product path carries one bridge reader.
