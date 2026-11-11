# Item 7's extra pot, and the estate cap: findings for the external review, 11 Nov

From the agent on `claude/project-access-i58m0x`, for the review of 9 Nov (item 7, and what it turned up). EXPLORATORY
throughout: nothing here changes a default, a gate or the candidate. Every figure below is copied from a committed
results file, named beside it. No result of D4 or of seed 7021 has been read.

## 1. What item 7 tested and how it read

Item 7 (the review's `EXPERIMENTS-AND-PORTS.md`, item 7; `SPEED-A.md`, committed before launch at 82f66b9f): the chooser
scores only a shortlist of moves instead of the whole menu. Three widths against the whole menu (OFF) on the review's
eight households, 16,000 paths of seed 7002 each, paired, at 45 points, on the tables after item 3. A width passes if
the pooled survival, no household harmed, the pooled spending, and **the pooled mean pot left within 0.5%** all hold.

The read (`results-speed-a.txt`, 01825f29): `structure` and `cells-held@0.005` pass 1 to 3 and fail 4:

```
structure:        4. pooled mean pot left +1.973%; within 0.5%: FAILS   a path 48.58 ms to 12.93 ms pooled (3.76 times)
cells-held@0.005: 4. pooled mean pot left +3.445%; within 0.5%: FAILS   a path 48.58 ms to 5.57 ms pooled (8.72 times)
order:            4. pooled mean pot left +0.119%; within 0.5%: HOLDS  a path 48.58 ms to 23.32 ms pooled (2.08 times)
ITEM 7 OUTCOME: NEITHER PASSES: order read by the same rule (it passes), reported; the item stops
```

The pot is higher, not lower, and survival and spending are unchanged within noise, so the maintainer asked where the
extra pot comes from.

## 2. Where it comes from (`results-item7-pot.txt`, c754fa71; scripts `item7-potgap.mjs`, `-potcap.mjs`, `-potbelow.mjs`)

Read from the run's own per-path arrays (survival, spending, the pot at the end, a path each), nothing re-run.

- **It sits on the paths that end above the estate cap.** The solver's estate term (`solve.js`, `beqOf`, default shape
  `'cap'`) is `min(net, bequestCap)`, `bequestCap` 4 x opening wealth in today's money; a pound above it scores zero.
  The engine's pot is in today's money too (`model.js` grows at the real rate). Share of each width's extra pot on the
  paths whose OFF pot ends above the cap:

```
S304F  OFF's paths above it 10587 (66.2%); structure 105%, cells 106%
S328F  OFF's paths above it 8841 (55.3%);  structure 100%, cells 99%
S340F  OFF's paths above it 9399 (58.7%);  structure 100%, cells 100%
S368   OFF's paths above it 8971 (56.1%);  structure 99%,  cells 128%
```

- **It is not more risk.** The replay (the first 100 paths: at each decision of the whole menu's own path, each width's
  choice) counts the decisions that differ by kind. On S328F: structure draw 515, isaFirst 47, harvest 238, tier 0;
  cells draw 502, harvest 571, tier 5. On S340F: structure draw 558, isaFirst 92, harvest 319, tier 0; cells draw 593,
  isaFirst 388, harvest 717, tier 5. The differences are the draw order and the re-wraps, not the tiers.
- **The score cannot see it.** The replay's score given up is tiny (`results-speed-a.txt`: "structure: ... the score
  given up 0.00009 points a decision on average"; cells 0.00021): above the cap, with survival safe and spending at its ceiling, the moves tie, and the whole menu's
  argmax keeps one that leaves less money; the shortlist, drawn from the moves the tables store, lands on ones that leave
  more. The gain is broad, not one lucky tail: on S328F `structure` 8234 paths up, 1058 down; on S340F 9118 up, 2080 down.
- **Measured as the solver scores it, the gap nearly goes.** Pooled over the eight:

```
POOLED structure: the mean pot 1.97%; on OFF's paths below the cap 0.13%; the pot as the solver scores it (capped) 0.02%
POOLED cells-held@0.005: the mean pot 3.44%; on OFF's paths below the cap 0.98%; the pot as the solver scores it (capped) 0.22%
```

- **One exception.** S188 under `cells`: +3.71% on the paths below the cap, 1.30% capped, and 68 tier changes of each
  pair in the replay (`structure`: 0). There the narrowest shortlist chooses differently, risk included.

## 3. What it suggests

The whole-menu solver is indifferent to money above 4 x opening wealth, so where it ties it can leave a lot behind:
on S328F the mean pot is £4,805,261 and `structure` leaves £192,960 more, `cells` £343,000; on S340F (£4,727,245)
£286,414 and £429,890 (`results-item7-pot.txt`), survival and spending the same. With D64 (the largest pot, whatever its
wrapper), that looks like a gap in the objective, not in item 7. The cap binds most on households whose wealth grows a
long way past its opening value (the F households retire at 52, from £450,000).

What exists already: `bequestShape: 'soft'` (`solve.js`, phase 6c's note: the cap kept, the cliff removed, the marginal
value above the cap decaying as cap/net) and `'logfloor'` (K4, from the minimum pot, used by `solvePlan` only when an
`estateWeight` is passed). The app's solve uses `'cap'`: `solverSettings.js` `aimsOptions` passes `bequestWeight` 0.01
for "lower" and nothing for "standard", and no shape. Changing the shape changes the candidate (d71f65ae871e) and every
table: a confirmatory change of default (CHECKLIST 2), the maintainer's.

## 4. The questions

1. Is the reading right: the extra pot is tie-breaking above the cap, not a shortlist that is unfaithful where the
   objective has a view? What would you check that the stored arrays cannot show?
2. Should the objective change, and how: `'soft'`, `'logfloor'`, a higher cap, or a tie-break towards the larger pot
   among moves within the chooser's tolerance (no score changes below the cap)? What experiment and decision rule
   would you register, on which households, and what does it cost against gate 5?
3. Item 7: should its pot check be read on the pot as the solver scores it (capped), by a ruling naming this run, or
   stay as committed, with item 7 measured again on whatever tables the answer to 2 leaves? What of S188 under `cells`?
4. Order: the couples' re-run (`couples-d4b.md`) is held (D71) until items 5, 7 and 10 are ruled and ported, and the
   couples are landed again on that code. Does an estate-shape change belong before it, after it, or after the beta
   (which ends 20 Nov)?

The raw per-path files are outside git (D17): SPEED-A's units for the eight (the A units, about 6 MB) can be supplied
on request, or rebuilt with `audit-speed.mjs` (about 16 core-hours for the whole batch).
