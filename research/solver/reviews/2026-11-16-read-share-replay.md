# Review at the read: the share replay (D110; `SHARE-REPLAY.md`; EXPLORATORY, seed 7023's read paths)

Subject: the read printed once by `reduce-share-replay.mjs` (`results-share-replay.txt`, outcome MIXED), and every claim
made of it in `reports/2026-11-16-share-replay-read.md`, in STATE.md section 6 action 3 (the sentence from "the share
replay (`SHARE-REPLAY.md`"), in the open item COUPLE-SHARE's row and in DECISIONS-PENDING.md's "OPEN (16 Nov, evening):
after the share replay's read" entry.

Read (blobs at 9d72ba94):
- The rule and its code: `SHARE-REPLAY.md` 889a7040adea, `share-replay.mjs` 7b837266b527, `reduce-share-replay.mjs`
  d5442db81992, `batch-share-replay.sh` 1f484ebaf42b. `git diff 4767cb74 HEAD` over the four: empty.
- The read and the write-up: `results-share-replay.txt` 73dbdd2b2723, `reports/2026-11-16-share-replay-read.md`
  5cb26325a492, `STATE.md` 5e5edf65ecb0, `DECISIONS-PENDING.md` d53d595d42ab, `state.mjs` 2f7ba963b8d9 (the COUPLE-SHARE
  row). Also `reviews/2026-11-16-deep-share-rules.md` ee0382259efa, `results-share-rules.txt` 88ee84958c9b and
  `results-share-rules-beside.txt` 98aa32c3e199 (section F).
- The code the replay runs, in the launch worktree at e1239959 (no edit under `src` or `research/solver/*.mjs`):
  - `src/solver/couple.js` 9fa640a0ceca: `singlePlanFor`, `solveCouple` (`topK`), `rankFor`, `topOf`, `chooseJoint`,
    `expectedValue`, `couplePolicy`, `withCouple`;
  - `src/solver/solve.js` b3c20b3e7f21 (`spendLevelsFor`);
  - `audit-share-rules.mjs` 6fb13445e91e (`solveArm`, the unit loop) and `audit-phase4.mjs` 5ace83959b96 (`runPath`);
  - `research/engine.mjs` (generated, untracked, sha256 0d4997449826a7e4): `stepYear`'s reading of a joint move (2116 to
    2127, 2413, 2714 to 2724), the couple's draw by `split` (2499 to 2517), the tier switch and its charge (2767 to 2791),
    `floorFrac` (1665), `preNmpaInsolvent` (2705) and `FAIL_TOLERANCE`.
- The run:
  - `results/share-replay/` (eleven files, nine logs), `results/share-replay-launch-1.log` and
    `results/share-replay-smoke/S023-45-flat.json.gz`;
  - `runs.log` line 375, and the commits aae12423, 4767cb74, 32a7389a, 35b68639 and 9d72ba94;
  - the registered arrays in `/home/user/sr-launch/research/solver/results/share-rules-run`.

Ran (each under `nice -n 19`; no solve, path, batch or rerun of the replay; my scripts in the session scratchpad's `rv/`):
- `node research/solver/reduce-share-replay.mjs`: `results-share-replay.txt` byte for byte (`cmp`).
- `--planted`: 18 of 18. `REDUCE_SHARE_REPLAY_PLANT=window` fails 2 of 18, and `unscaled` fails 1. `check-state.mjs`
  passes.
- `check1.mjs` to `check10.mjs`: the eleven files and the registered arrays decoded afresh, not through the reducer's
  `load`. The planted swap (`--plant swap`) needs solves and was not re-run.

Nothing of seed 7021, `d4-backup` or `d4b-backup` was opened.

Verdict: FAIL

## What holds

- **The order.** The deep review fixed the parts, the thresholds (half, a quarter), the readings' bounds and the five-year
  window, and was committed at 16:55:05 UTC (866c75f9). After it came:
  - D110 at 16:58:55;
  - the smoke's file, 17:07:56;
  - the rule with its code, 17:15:51 (4767cb74);
  - the launch, 17:16 UK (GMT; `runs.log` line 375 and the launch log);
  - the unit files, 17:28:04 to 17:53:39;
  - the read, 17:54:25, and the write-up, 17:56:20.
- **X and T to the bit.** I decoded the stored arrays myself. On every replayed path of all eleven comparisons, X and T
  match the rule's and TODAY's stored arrays on all seven fields: 0 values differ.
  - The populations recomputed from the stored arrays equal each file's (lost, saved, both keep, neither).
  - The replayed paths are the first in path order.
  - Both arms' stored runs are seed 7023, 16,000 paths, code c0dcfa9ef2f2.
  - The ten flags are the read's (`results-share-rules.txt` lines 4 to 38).
- **The parts.**
  - `mixMove` throws on any field outside a part. T checks every year that TODAY's four parts rebuild TODAY's move field
    for field, and T matches the stored TODAY run.
  - The engine reads only these fields: the level, the split, each person's tier index and name, and the draw fields. The
    switch is charged at the policy's `switchCost`, the same in both arms. The engine never reads `ia`, `ib`, `score`,
    the move's `switchCost` or `contrib`.
  - TK is `couplePolicy` on `{ ...cpX, topK: 6 }`. `chooseJoint` takes `cp.topK` into `rankFor` and `topOf`, and the flat
    memo is reset at each decision.
- **The record.**
  - The split is the first person's share of the year's net need (engine 2506).
  - Each reading is the arm's own table's survival at the start of year t, at the held pair's layer. `expectedValue`
    reads the same tables at t+1 after the year.
  - `TIER_ORDER` runs riskiest first, so the equity's sign is the rule's.
  - Every 'pot' lost path fails in the last year, and every 'short' one has a year over £1 unmet (0 exceptions).
- **The reducer computes the rule as written:** `gainOf`'s scaling, the window (fy-5 to fy-1), `outcomeOf`'s order, the
  gate, and `requireFairLogs` on the 88 registered logs.
- **MIXED is robust.** Sampling the categories replayed short of their whole count gives the pooled recoveries standard
  deviations of L `0.045`, R `0.053`, S `0.063` and TK `0.022`. No other branch is within reach:
  - THE CAUSE and THE LEVEL need L at `0.5`, 7.6 sd from `0.1555`;
  - THE RISK RIVAL needs TK under a quarter;
  - NO PART needs R and TK both under a quarter.
- **The smoke, weighed.** On its seven paths R kept 2 of 3 lost paths, and L, S and TK none. Every variant kept the two
  saved and the two control paths.
  - The parts, thresholds and window were fixed 12 minutes before the smoke ran.
  - What the rule added after it (the scaling, the order, THE LEVEL'S branch, MIXED) does not lean towards R.
  - Its seven paths are among the read's 2,368 lost and the controls. The effect is negligible; no finding.

## Findings

**1. BLOCKING. The "two failure modes" and the case for TK are claims beyond the data.**

Where they are made:
- the report's "What the units show" and "What it means";
- STATE.md: "those that run short mostly the tiers', those below the minimum pot mostly the level's";
- DECISIONS-PENDING: "The lost paths that run short are mostly the tiers'. Those that end below the minimum pot are
  mostly the level's. The top six moves help with both."

The pooled figures are one comparison for the tiers, two for the level, and other comparisons run the other way. Each
comparison's recovery over its own lost paths (`gainOf` / its lost count; my `check8.mjs`):

| comparison | lost | L | R | S | TK |
|---|---|---|---|---|---|
| FLAT S023-45 | 106 | 0.396 | 0.528 | 0.226 | 0.443 |
| FLAT S147-45 | 241 | 0.320 | 0.444 | -0.529 | 0.469 |
| FLAT S191-45 | 160 | 0.169 | 0.594 | -0.386 | 0.381 |
| FLAT S061-dbpart | 440 | 0.103 | -0.451 | 0.088 | 0.074 |
| MEANS S061-dbpart | 1985 | -0.089 | 0.824 | -0.047 | 0.540 |
| MEANS S023-90 | 451 | 0.825 | -0.130 | -0.714 | 0.961 |
| MEANS S147-90 | 274 | 0.839 | -0.294 | 0.073 | -0.180 |
| MEANS S227-90 | 169 | -0.124 | 0.533 | 0.059 | 0.923 |
| MEANS S191-45 | 117 | 0.171 | 0.598 | 0.214 | 0.359 |
| MEANS S377-dbpart | 101 | 0.129 | 0.485 | -0.691 | 0.475 |

(a) **"Running short is mostly the tiers" is S061-dbpart under MEANS.**
- R's pooled `+1765.8` paths are `+1636.6` from that one comparison. Without it, R recovers `0.063`; L `0.391`, TK
  `0.429` and S `-0.225` (`check2.mjs`, leave one out).
- 800 of the 1,170 replayed lost paths that run short are S061-dbpart's two comparisons. TODAY's tiers keep 330 of
  MEANS's 400, but 45 of FLAT's 400, and 204 of the other eight comparisons' 370.
- On FLAT S061-dbpart, the second-largest flagged loss (440 paths, every one running short), no part recovers: each
  variant keeps 34 to 46 of 400. The report never names this comparison.

(b) **The explanation offered ("At the same states the rule's tables take more equity than TODAY's") is S061-dbpart's
alone.**
- S061-dbpart gives `+0.505` (FLAT) and `+0.411` (MEANS) places a slot, over 16,000 of the 47,360 slot-years.
- On the other eight comparisons' lost paths the rule holds less equity than TODAY: `-0.078` a slot pooled, negative on
  six of eight. On their running-short paths it is `-0.032`, yet there TODAY's tiers keep 204 of 370.
- Under FLAT, S061-dbpart's rule holds the most equity of all (`+0.505`), and TODAY's tiers keep 45 of 400.
- The equity line therefore does not explain R's recoveries. It is printed pooled, as the rule needs it, and the write-up
  uses it as a cause.

(c) **"Ending below the minimum pot is mostly the level" is S023-90 and S147-90.**
- Those two units hold 660 of the 1,198 replayed pot paths, and L keeps 330 and 243 of them.
- On the other five comparisons with pot losses, TODAY's tiers keep more of them than TODAY's level: S023-45 54 against
  41, S147-45 84 against 75, S191-45 FLAT 37 against 27, S191-45 MEANS 45 against 23, S227-90 106 against 72.
- S227-90 is a 90/10 MEANS unit the report cites as "leaning the other way", yet there L is `-20.9` and R `+90.0`.
- At the same states on S227-90's pot paths, the rule's level is below TODAY's (mean `-0.0062` of target over 6,680
  years). That runs against "The rule spends more than TODAY would at the same state", a claim no file prints.

(d) **"It is the one change that helps with both kinds of loss" is contradicted by the report's own table.**
- R keeps 579 of 1,170 short paths and 621 of 1,198 pot paths; TK keeps 359 and 806. What separates them is R's losses
  among the saved and control paths, not "both kinds".
- "A material limit wherever the share moves": TK recovers `0.074` on FLAT S061-dbpart and `-0.180` on MEANS S147-90.

(e) **Single-part swaps are not a decomposition.**
- On the pot paths L keeps 68%, TK 67% and R 52%. The swaps overlap, so naming the loss "mostly" one part credits it with
  what other swaps also undo. No joint swap was run, and no interaction was measured.
- The mirror's "MEANS's gain there comes from its level and its tiers together" is the same kind of claim. L takes away
  166 of 400 saved paths and R 109; neither alone, nor both together, was decomposed.

What would answer it:
- Print the per-comparison picture by a script beside the read, deciding nothing.
- Restate "What it means", STATE.md's sentence and DECISIONS-PENDING's bullets to what holds:
  - no part carries half, pooled;
  - which part recovers differs by comparison: TODAY's tiers on MEANS S061-dbpart, TODAY's level on S023-90 and S147-90,
    the top six on S023-90 and S227-90, and nothing on FLAT S061-dbpart;
  - TK is the most consistent variant (0.359 or more on eight of ten, with few saved or control paths lost) and the only
    one that is a policy one could run, and it fails on two comparisons.
- The recommendation can stand on that, without "the one change that helps with both". It should name the two
  comparisons where TK fails, and say that TK's path time was not measured here (the deep review's estimate is up to nine
  times a path).

**2. BLOCKING. The mechanism's "more than half" comes from the floor's rounding.**

The cause:
- `mechanismOf` asks whether TODAY's level is below the rule's with an exact `<` (`reduce-share-replay.mjs` line 89).
- Each person's table puts its floor at `floorSpend / targetSpend` of its own plan (engine line 1665, `solve.js`
  `spendLevelsFor`), and `singlePlanFor`'s `scale` rounds both amounts to the pound after the share.
- At TODAY's shares (0.5, 0.9) and FLAT's (0.45, 0.6) the floor is 0.8 exactly. At MEANS's it is not. The rule's floors
  as recorded:

  | unit | the rule's two floor levels |
  |---|---|
  | S023-90 | 0.799995, 0.800031 |
  | S061-dbpart | 0.799954, 0.800073 |
  | S147-90 | 0.799991, 0.800028 |
  | S227-90 | 0.79999, 0.800002 |
  | S377-dbpart | 0.799967, 0.80003 |

  (`check5.mjs`.)
- So where both arms are at the floor, TODAY's 0.8 reads as "a lower level" whenever the rule's floor is the one above
  0.8. On these targets that is under £5 a year.

The corrected count, taking only a lower step of the menu (any tolerance from 1e-4 to 0.04 gives the same):
- the mechanism shows on **1,002 of 2,368 lost paths (42.3%), not more than half**;
- 225 paths show it only through the rounding: MEANS S061-dbpart 205 becomes 55, S227-90 154 becomes 109, S377-dbpart
  27 becomes 8, S023-90 307 becomes 300 and S147-90 255 becomes 251 (`check6.mjs`, `check8.mjs`).

What it changes:
- The outcome stands. L recovers `0.1555`, so neither THE CAUSE HOLDS nor THE LEVEL can hold however the mechanism reads.
- The report's sentence must not stand: "shows on 1,227 of the 2,368 lost paths replayed (51.8%): more than half ...
  while TODAY at the same state would spend less". Pooled, the deep review's cause shows neither of its two conditions.
- Had L recovered half, this defect would have decided between THE CAUSE HOLDS and THE LEVEL, ITS MECHANISM NOT SHOWN.
- The planted cases test a level of 0.9 against 1 and do not reach it.
- The first-apart beside line (line 194) compares levels in the same way.

What would answer it (CHECKLIST 7):
- the corrected count beside the read, deciding nothing, and the write-up corrected;
- `mechanismOf` and line 194 comparing a step of the menu, with a planted case of two floors at 0.8 and 0.800031.

The pattern search (`grep` over `research/solver/*.mjs`): no other script compares `spendLevel` across two arms' tables.
`audit-tie-c2.mjs` and `audit-tie-couple.mjs` compare moves within one solve.

Per comparison, with a lower step of the menu, both of the deep review's conditions hold on S023-90 (L `0.825`, the
mechanism 75%) and on S147-90 (L `0.839`, 92%). On S147-90 TK is `-0.180`, which the rule would name THE PRICING. This
is a post hoc lead for the maintainer's figures, not a result.

**3. MINOR. No interval, and comparison-level figures resting on one to six control paths.**
- Each lost control path counts 68 to 77 paths in `gainOf`.
- S's pooled `-557.4` is `+449.3` from the lost paths it keeps, less `112.0` from the saved paths and `894.7` from the
  controls. The controls' term is 12 control paths of the 2,000 replayed.
- Each of the five comparisons where "TODAY's split does worse" rests on one to six of them. S191-45 FLAT and S377-dbpart
  rest on one each, S023-90 on six (`-322.0`, sd 180) and S147-45 on two (`-127.5`, sd 107). On all ten, the lost-path
  term is positive.
- L's "loses more than it keeps" on MEANS S061-dbpart is six control paths (`-176.6`, sd 166).
- "The split is not the fault" stands: S's kept lost paths alone recover `0.111`.
- The write-up should give the pooled sds: L 182, R 214, S 255 and TK 87 paths.

**4. MINOR. "What the read cannot show" is incomplete.**
- It should add:
  - that the swaps overlap and are not a decomposition (finding 1 (e));
  - the per-comparison spread (finding 1);
  - the sampling error (finding 3);
  - that L, R, S and TK kept no record of each year, so why a variant keeps a path is not shown;
  - that the paths both arms lose (330 to 622 a comparison) were not replayed, which bears on TK as a change for today's
    split;
  - that the equity and the mechanism count tier places and readings per slot or person, not the money in them.
- The LOOKHOLD item is mis-stated. The read's code c0dcfa9ef2f2 holds the hold and the look (`holdMove`, `lookPick`), and
  TIE-C2 ran on the same code. What the read predates is D109's change of default, so its arms ran without them.
- The deep review (section 4) said the record answers two open items' questions, and the write-up does not read them.
  From X's record (`check9.mjs`; a lead, to be printed by a script if it is to move the items):
  - FD-RAISE: of the 1,170 lost paths that run short, 60 have a 110% year in the three years before the failing year,
    10 of them in the year just before;
  - CGT-BILL: 33 run short by under £1,000 in all, and 10 of those pay tax, income and gains together, in the failing
    year.

**5. MINOR. The beside line on when the arms part reads as more than it is.**
- On every lost path the rule's move parts from TODAY's in year 0: 2,368 of 2,368 as the reducer compares, and 2,267
  with the floor's rounding set aside, the rest by year 5 (`check3.mjs`, `check6.mjs`).
- So "a median of 27 years before the failure (a quarter at 9 years, three quarters at 39)" is simply the failure year's
  own distribution: median 27, quarter 9, three quarters 39.
- The informative reading is that the arms part at the start on every lost path. The deep review's signature for the
  minimum pot, "the lost paths' moves part only in the last years", is absent.

## The figures and claims that stand

- The run, its timing and the to-the-bit matches.
- The gate and the fair-test gate.
- The four pooled recoveries, and the outcome MIXED with its derivation.
- The equity line as the rule's pooled measure.
- The kinds table's counts, the mirror's counts and the funding check's 1,170 and 194. The first of these is a
  consistency check: the engine's failing year is the model's unfunded one.
- "That one comparison is about half of the pooled loss" (1,985 of 4,044).
- The 1,676 lost paths left unreplayed.
- The COUPLE-SHARE row: printed by `state.mjs` from the read's outcome line, and `check-state.mjs` passes.
