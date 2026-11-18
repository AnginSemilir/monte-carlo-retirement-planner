# Review at the read, second round: what keys the guard (GUARD-KEY.md; D129 (4); EXPLORATORY, seed 7002)

Subject: the fix of 3a325b63 to the write-up `reports/2026-11-18-guard-key-read.md`, answering my first round
(`reviews/2026-11-18-read-guard-key.md`: FAIL, one BLOCKING, three MINORs, all in the write-up; the read's figures and
outcome standing). The fix adds `guard-beside.mjs` and its output `results-guard-beside.txt`, both EXPLORATORY and written
after the read.

Read (blobs at 3a325b63, the branch's head; the tree clean):
- the write-up 284b877c1a10 and its diff from 72a4b34f7ad1 (02b1e8e4). The commit's stat:
  - the write-up, `guard-beside.mjs` 2e6f1a912f25 and `results-guard-beside.txt` ffd8eb74b44d;
  - my first round, d12dc268bc8d;
  - `research/tests/fast-inputs.json` 4d387ff31278: four lines naming the new files, the fast tier's trace record that the
    pre-commit hook makes you stage (`fast-skip.mjs` b81fb272ec4f, `.githooks/pre-commit` lines 8 to 40).
- the read: `results-guard.txt` 56df67561cdf, and the rule and its files, each at the blob my first round recorded:
  - `GUARD-KEY.md` 45aaad76c751, `guard-panel.mjs` caf71f51fb2a (d92ccea9 only);
  - `guard-panel.json` 1afc5e827620, `audit-guard.mjs` 22b3db6ef178, `reduce-guard.mjs` 95c2d8cf3086 (5262779f only).
- what the beside rests on:
  - `reduce-household.mjs` 2a762db28f98 (`cells`, `armOf`), `stats.mjs` a4095c8e339e (`survivalChange`);
  - `shapes-panel.mjs` af92d5e2e71a and `shapes-panel.json` 1aefb679e60b, `audit-couples.mjs` f50aa99da601 (`solverPlan`),
    `audit-phase4.mjs` 5ace83959b96 (`solverPlanOf`), `select-phase4.mjs` 0d54f6a47a8a (`armA`'s label, lines 85 to 91);
  - `src/App.jsx` e8d5c4220dd5 (`incomeFloor`, lines 1806 to 1823; the generated `research/engine.mjs` the same at 1769
    and 1785), `src/solver/couple.js` 7a12a4340749 (`solveCouple`'s plan, lines 261 and 270; `withCouple`, 958 to 959),
    `src/couplesSwitch.js` b33f855de049.
- step 5's figures: `results-shapes-beside.txt` 916e4641b01d, sections D and E.
- `STATE.md` and `DECISIONS-PENDING.md` at the head, for the read's lines.

Ran (scripts in the session's scratchpad; nothing in the tree edited):
- **The two scripts.** `node research/solver/guard-beside.mjs`: `results-guard-beside.txt` byte for byte from its second
  line (the first is the command's heading). `node research/solver/reduce-guard.mjs`: `results-guard.txt` byte for byte,
  the gate fair.
- **The stamps.** `stampFilesHash()` 8086bcf05f68, the stamp on the units. `codeId()` 603eeb595679.
- **Each income's start, in each arm's context.** For each of the eight units: `shapes-panel.mjs` `solverPlanOf(U.plan,
  shape)`, then `E.buildContext` on the plan as entered, on arm A's plan (APP's context, as `audit-guard.mjs` line 93
  builds it) and on the plan K2 is handed. I printed every other income each context holds.
- **Step 5's eight gap couples.** Arm A at each one's landed target, its label against the panel's, and the plan K2 is
  handed.
- **The pair figures, recomputed apart from the script.** From the decoded `survived` arrays: my own counts, my own
  Clopper-Pearson interval, and an interval by path (the two units of a pair share seed 7002's paths). Also the +rent
  pooled figure with each unit left out in turn.
- **The holdings guard.** `coupleSolverOn` and the incomes on S061-dbpart@penB90 and @penA100.

Verdict: PASS

## The four findings of the first round

1. **BLOCKING (the rent's start): answered.**
   - **What the write-up now says** (lines 18 to 20 and 28 to 33):
     - the engine counts an income from its owner's retirement at the earliest (`buildContext`, `incomeFloor`);
     - S149's rent ran from plan year 0, its first person 56 and retired at 55;
     - S337F's rent ran from plan year 15, its first person 37 and retiring at 52;
     - each pair's pooled figure: S149's two `-3.200` (`-3.834` to `-2.541`), S337F's two `+2.200` (`+1.768` to `+2.595`);
     - "The outcome rests on S149@gap12, where the rent does start now."
   - **The code.** `App.jsx` 1822 gives every other income `startAge: Math.max(incomeFloor(i), num(i.startAge, 0))`, where
     `incomeFloor` is its owner's `retireAge` (1806 to 1809).
   - **The beside's starts.** Each plan carries exactly one other income, the added one, so the script's two lookups
     (lines 33 and 34) cannot take another. It reads the start from the plan as entered. I checked that against both arms:
     - In APP's context and in the plan K2 is handed, the start is the same on all eight: S149's +rent from 56 (plan year
       0), S337F's +rent from 52 (plan year 15), every +db from 68 (plan years 12 and 31).
     - The audit builds K2's engine context from `solveCouple`'s `k2.plan`. That is the plan handed in, at most with its
       minimum pot set (`couple.js` 261 and 270), and `withCouple` changes only its config and spending (958 to 959). So
       K2 ran the same start.
   - **The beside's pooled figures.** They use `cells(APP, K2)` and `survivalChange(lost, saved, N)`, as the reducer does
     (`reduce-guard.mjs` 70 and 75). My own counts match:
     - S149's two: 251 saved and 507 lost of 8,000;
     - S337F's two: 266 saved and 90 lost of 8,000.
     - By path, both still exclude nought: `-3.200` (`-4.034` to `-2.366`) and `+2.200` (`+1.687` to `+2.713`).
   - **"Rests on".** Without S149@gap12+rent, +rent pools `+1.617` (`+1.194` to `+2.025`). None of the other three is wholly
     below `-0.3`, so it would read NO HARM. With any other unit left out it stays HARM: `-0.817`, `-0.958` and `-1.842`,
     each interval wholly below nought.
   - **Not yet checkable.** The lines still to be written in STATE.md and DECISIONS-PENDING.md. Both still record the test
     as running (STATE.md line 293; DECISIONS-PENDING.md item 4, "UNDER WAY"), so nothing on the record there states the
     old footing. When written, they should take the write-up's split by start.

2. **MINOR (the end pot): answered.**
   - **Lines 39 to 40.** The mean end pot is below the app's on all eight: `29%` to `40%` on S149's four, `88%` to `90%`
     on S337F's. The median is below on six.
   - **Against the file.** Section 2 of the beside gives:
     - S149's four `-29.393%` to `-39.812%`;
     - S337F's four `-88.066%` to `-90.422%`;
     - the median below on S149@gap8+db, S149@gap12+rent and S337F's four, and above on S149@gap8+rent (`+16.017%`) and
       S149@gap12+db (`+4.512%`).
     These are the figures I computed in the first round.
   - **The same array.** The end pot is the `pot` array, each path's end wealth (`audit-guard.mjs` line 120), averaged over
     every path. The reducer's capped pot is the same array cut at the cap (`reduce-guard.mjs` 86 to 90). So the two figures
     printed side by side measure the same thing.

3. **MINOR (the counts are the gap couples'): answered.**
   - **Lines 41 to 47.** The counts are scoped to the gap couples. The two losses outside them are named: S061-dbpart@penB90
     `-10.175` and @penA100 `-2.850`.
   - **Against section D.** Those are the only units of step 5's 28 below nought other than the three gap couples. Each has
     the partner's DB pension, `£15,000` from 68, and its two people are 61 and 58.
   - **The holdings guard.** `coupleSolverOn` answers `{"on":false,"why":"uneven"}` on both: the pots' share 0.175 and 0.94,
     `couplesSwitch.js` line 127.
   - **"The same incomes do no harm elsewhere".** It now sits under "Among the gap couples", and there it holds:
     - the first person's DB pension gains on S149's and S337F's four;
     - the partner's gains on S061-dbpart@gap8 (`+6.200`);
     - rent is level or gains on the other three.

4. **MINOR (arm A's pick parts the comparisons): answered.**
   - **Lines 66 to 68.** Each pair also differs in arm A's pick, which moves the app's rules alone. Arm A takes the full lump
     sum on all four harmed couples and on six of the twelve unharmed gap couples.
   - **The counts.** From the beside's section 3:
     - harmed: S147-db@gap8 and @gap12, S061-dbpart@gap12, S149@gap12+rent;
     - unharmed with the lump sum: S337F@gap8, S061-dbpart@gap8, S149@gap8+db, S149@gap8+rent, S337F@gap8+rent and
       S337F@gap12+rent.
   - **The labels are the pick.** I recomputed arm A at each of the sixteen landed targets, and every label is the panel's.
     "Lump sum" in a label is `drawdownStrategy === 'Full 25% Lump Sum'` (`select-phase4.mjs` 90), so "the full lump sum"
     is right.
   - **"Alone".** On all sixteen, the plan K2 is handed keeps the plan's own Bracket Fill Basic and Phased Drawdown.
     `audit-phase4.mjs` `solverPlanOf` takes arm A's policy only where its deposit order differs, and neither the drawdown
     nor the harvest flag. So the pick reaches APP alone.
   - **The two pairs.** In both, the picks differ only in the lump sum (ISA First with it, against ISA First without).
   - **Not a finding.** The second pair also differs in target (35,400 against 29,600), which my first round named and the
     write-up leaves inside "the base couple". The target follows from each couple's own landing, which the write-up states
     (line 15).

## What else holds

- **Nothing else changed.** The fix touched only the lines the four findings named, and added the reviewer's paragraph
  (lines 73 to 83). That paragraph matches my first round.
  - Every figure the write-up kept is the read's: `+7.150`, the four +db units, `-0.500`, `+0.450`, `-6.850`, `+0.875`,
    `+3.525`, `+10.744`, `+0.92%` to `+2.66%`, `-3.828%`.
  - Step 5's figures are section D's: `+12.575`, `+10.900`, `+9.250`.
  - `results-guard.txt` and the rule's files are at the blobs of the first round. The units' stamp is the stamp now.
- **No claim beyond the files.**
  - Every new figure in the write-up is in `results-guard-beside.txt`.
  - Every count is one I recounted, from the beside or from section D.
  - The causal words are the rule's own ("brings the harm", "the reach holds"), and the write-up still says the cause is
    not shown.
- **The pair intervals.** They pool the cells as the rule pools them, which takes the two units' paths as independent. By
  path they are wider and still exclude nought (finding 1 above), so nothing rests on the difference.

## Findings

None.
