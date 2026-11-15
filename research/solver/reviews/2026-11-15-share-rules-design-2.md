# Design review, second round: the share rules' test, `registrations/share-rules.md` (before launch)

15 Nov 2026, 19:58 to 20:15 UTC. The `reviewer` agent, at the registration's design (CHECKLIST 2), second round, on the
main tree at 16e49fcc (the fix of the first round's FAIL, `reviews/2026-11-15-share-rules-design.md` on 26d78e02): code-id
c0dcfa9ef2f2 (the panel's), `stampFilesHash()` ba4f53953da5, the registration's blob 246cb6b3f9fb. Nothing of seed 7023 or
7021 was run or read; `d4-backup` and `d4b-backup` were not opened; nothing under `results/share-rules-run` was opened (the
folder does not exist); `results/tie-c2-7001` was not touched. Every run at nice 19, its scripts and outputs in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/review-share-design-2/`.
No repository file but this one was written.

## What I read (git blobs at 16e49fcc)

- The fix: `git show 16e49fcc` (its message and the whole diff); `registrations/share-rules.md` 246cb6b3f9fb;
  `reduce-share-rules.mjs` 0b163022274c; `share-rules-pilot-power.mjs` 55721952a826 and
  `results-share-rules-pilot-power.txt` 3692189cccf3.
- Unchanged since the first round (the same blobs): `audit-share-rules.mjs` 7bb8052cbef3, `batch-share-rules.sh`
  7b21acc995e5, `size-share-rules.mjs` 159f021c806d, `share-rules-panel.mjs` 168dcae982f6, `share-rules-panel.json`
  9349aa206f9c, `share-rules-paths.json` bc7091df6ac5, `results-share-rules-sizing.txt` 4c649bde9fbb; and what they
  borrow: `fair-gate.mjs` 4d4a20402b1c (`checkLogStamps`, `requireFairLogs`, `blobOf`, `declaredCorrection`),
  `reduce-couples.mjs` cae05c5a8e75 (`harmOf`), `reduce-phase4.mjs` ac319aad1f44 (`lossOf`, `harmFlag`, `survivalItem`,
  `spendingItem`), `size-phase4.mjs` f66f13d055ed (`thresholdFor`), `paired-exact.mjs` ab68627187ab,
  `run-from-snapshot.sh` cf7ab99bb4ec, `run-unit.sh`, `check-prediction.mjs` (`verdictOf`), `src/solver/couple.js`
  9fa640a0ceca (`shareFor`, `shareBy`, `solveCouple`), `src/solverCouple.js` c3a002068ca4, and every use of `shareRule`
  in `src/`; `reduce-couples-share.mjs` (stage C's stamp gate and its beside figures, for comparison).
- The pilot's records and logs (`results/share-rules-pilot/`, seed 7002).

## What I ran

- The planted suites: the read 16 of 16; the audit 7 of 8 (finding 1); the sizing 5 of 5; the panel 16 of 16;
  `couple-share-rules.test.mjs` 5 passed. `check-prediction.mjs` on the registration: NOT COMPLETE only for the Design
  review. `code-id.mjs` c0dcfa9ef2f2; `stampFilesHash()` ba4f53953da5; `configOf` TODAY 27d2a7c7ee9d, FLAT d17e66b604a1,
  MEANS bd5c568d2f42, as registered.
- The read's own stamp gate, the real `reduce-share-rules.mjs` on scratch folders of logs and no records: a log stamped as
  the launcher stamps it (`prediction research/solver/registrations/share-rules.md sha 246cb6b3...`) passes the stamps and
  the read goes on to its gate (REFUSED: units missing); the first round's blob (6be605f1) `PREDICTION EDITED - 6be605f1 at
  launch, 246cb6b3 now`; `NOT-LAUNCHED` `launched outside run-from-snapshot.sh`; `none` `launched under none`; a log under
  the registration with `sha -` (run by hand, the first round's inverted case) `PREDICTION EDITED - - at launch`.
- `probe-standin.mjs`: S023-90 (a 90/10 unit) solved as the audit solves an arm (`solveArm`, 45 points), under TODAY and
  under FLAT, each in its own process; then the engine's first 100 paths of seed 7002 and the rollout on them.
- `probe-mainpath.mjs`: the read's main path (gate, `withStandIn`, three `compare`s, `decide`) on built records for all 88
  runs, each person's settings line the pilot's real one, synthetic arrays (no seed; the gate given seed 1 as a label).
- `probe-threshold.mjs`: `harmExact` against `harmOf` on losses at the threshold's j - 2 to j + 2, N 16,000 to 19,000.
  `probe-oldharm.mjs`: the new planted threshold case on `harmExact` as it was at 26d78e02. `probe-power.mjs`: the pilot's
  flag chances with the read's own threshold.
- `share-rules-pilot-power.mjs`: byte for byte `results-share-rules-pilot-power.txt`. `reduce-share-rules.mjs --pilot`:
  the gate fair on the pilot's 33 records, on their own stamp.
- In a `git archive` copy of 16e49fcc: the read's log call put back as the first round found it (`{ blob: () => '-' }`),
  then `--planted` and the read on a launcher-stamped log (finding 3).

## Verdict

Verdict: PASS

Both of the first round's BLOCKING findings are answered in the code and the registration, and so are its five MINORs (the
table below). The stand-in is exact. No BLOCKING finding. Three MINOR findings. Findings 1 and 2 are in stamped files
(the audit, the read). They are best fixed before launch, because any change after launch makes the gate refuse every unit
on its audit stamp. Either fix changes the stamp, so the registration's "The launch" line must name the new one.

## The first round's findings, as answered

| first round | answered | the evidence |
|---|---|---|
| 1. BLOCKING, the stamp gate refused every launched log | yes | `reduce-share-rules.mjs` line 224 calls `requireFairLogs(..., REGISTRATION)` with the default blob. The real read passes a launcher-stamped log and refuses an edited registration, a hand run (both forms), a measurement (What I ran) |
| 2. BLOCKING, MEANS against FLAT on 24 units | yes | `withStandIn` (lines 105-113), used at line 229. `probe-mainpath`: MEANS against FLAT on 32 units, the eight 90/10 among them. A MEANS loss of 2 points at 90/10 reads `-0.500 (-0.554 to -0.446)` there; without the stand-in it is `0.000` on 24. The stand-in is exact (below) |
| 3. MINOR, the spending bar's unit | yes | Registration lines 71-72 state `spendingItem`'s measure; the read holds its point estimate at -0.05 (lines 129, 236) |
| 4. MINOR, what the read prints | partly | It now prints the pot, tax, spending, the rollout's gaps and the solve times, and the PASS line names the inference. But the by-rule figures are over different units (finding 2) |
| 5. MINOR, planted coverage; the throw at 17,000 to 19,000 | partly | 16 more faults are planted, and the old `harmExact` throws on 15 of the 20 new threshold cases (`probe-oldharm`). The rest is finding 3 |
| 6. MINOR, the reach of a PASS | yes | Registration lines 81-90 |
| 7. MINOR, what the pilot shows | yes | Registration lines 113-121. Every figure is printed by `share-rules-pilot-power.mjs` (reproduced byte for byte). The "0.93 to 1.00" holds with the read's own threshold too (S191-45 under FLAT 0.962, the rest 1.000; `probe-power`) |

## The stand-in's exactness (checked, no finding)

- **By the code.** `shareRule` reaches a couple's solve in two ways only (`couple.js` lines 242-243 and 270): the share
  itself and `meta.shareRule`.
  - The audit passes its own `solveOne`, so the rule never reaches a person's solve (`audit-share-rules.mjs` line 93).
  - No rollout, engine or model code reads `meta.shareRule`. In `src/` only `solverCouple.js` line 86 reads it, for the
    page's record, and the audit does not call that.
  - At 90/10, `shareFor` and `shareBy('potsflat')` both return `Math.min(0.95, Math.max(0.05, a / (a + b)))` on the same
    sums, so the two shares are the same double.
- **By a run.** `probe-standin`, S023-90 under TODAY and under FLAT, each in its own process (as the batch runs one unit a
  process). Every field but the arm, the rule's name, the time and the pid is the same:
  - the share `0x3feccccccccccccd`;
  - both people's plans;
  - both tables (every array, number and string reachable, digested): self `79688a80b193c591`, part `ecb7b981da25dd14`;
  - the inputs hash `13afa0f851a5`;
  - the engine's survived, wealth, estate, delivered, unmet, tax and failure year on 100 paths;
  - the rollout's survival.

  The probe follows the audit's path: its survived digest on the first 100 paths, `6f7735f7f39006a6`, is the pilot's own
  TODAY record of S023-90.

## Findings

1. **MINOR. The fix leaves the audit's planted suite failing, and the registration's pointer for the whole-path
   comparison stale. Fix before launch (the audit is stamped).**
   - The fix took `import { cmpBar } from './paired-exact.mjs'` out of the read (26d78e02's line 29). Nothing in the stamp
     imports `paired-exact.mjs` any more, so it left the stamp: of the audit check's `need` list, it alone is missing.
   - The audit's planted check still requires it (`audit-share-rules.mjs` line 108):
     `node research/solver/audit-share-rules.mjs --planted` gives `FAIL the stamp holds every file the read decides with
     ...: false false (want true false)` / `PLANTED CHECK FAILED: 1 of 8`. The first round read 8 of 8 on 26d78e02, and the
     commit reports only the read's 16.
   - The stamp itself is complete (it follows the imports), so nothing about the run is unfair. The check is out of date.
     No CI test, `smoke.sh` or `check-prediction.mjs` runs this suite, so nothing would have shown it.
   - The registration still names `paired-exact.mjs` for the comparison in whole paths (line 69). The read now does it in
     `harmExact` (lines 94-101): j taken back by `thresholdFor`'s own expression, flag `k > j`.
   - Fix: drop `paired-exact.mjs` from line 108's list, point line 69 at `reduce-share-rules.mjs harmExact`, then take the
     audit stamp again and name it in the registration.

2. **MINOR. The new "beside" block prints each rule's pot, tax and spending over different units, and on the pilot that
   reverses the sign of spending. Fix before launch (the read is stamped), or say in the registration that these figures
   are not comparable.**
   - `reduce-share-rules.mjs` lines 247-253 average each arm over the records it ran (`U`, not `V`): FLAT over its 24
     units, TODAY and MEANS over all 32.
   - The registration lists "spending, the mean pot left and lifetime tax by rule" among what the read reports (line 98).
     STATE.md and the report to the maintainer are written from the read's printed lines (CHECKLIST 6).
   - On the pilot (`reduce-share-rules.mjs --pilot`, seed 7002; FLAT ran 9 of the 12 units there):
     - As printed, spending delivered is FLAT £3,999,593 against TODAY £3,941,961 (FLAT about 1.5% higher). On the same 9
       units, TODAY is £4,002,350, so FLAT is 0.07% lower.
     - The pot is FLAT £6,030,026 against TODAY £6,087,344 as printed (-0.9%), and £6,197,481 on the same 9 units (-2.7%).
   - The deciding spending item (`spendingItem`, paired) is not affected.
   - Fix: take each rule over the same units, for example all three over `V` (FLAT's stand-in at 90/10), or each
     comparison's own units with the paired difference.

3. **MINOR. The new planted cases test the functions, not the read's own calls, and three claims of coverage are wider
   than the cases.**
   - **The log case.** It calls `logProblems` with a blob it injects (lines 197-203). It does not reach line 224's call,
     which is what the first round's BLOCKING 1 was about. In a `git archive` copy with line 224 put back to
     `{ blob: () => '-' }`, `--planted` still reads `planted (16): all read as they should`, while the read refuses a
     launcher-stamped log: `FAIR-TEST GATE: FAILED (stamps)` / `case0.txt: PREDICTION EDITED - 246cb6b3 at launch, - now`.
   - **The stand-in case.** It calls `compare(withStandIn(...))` itself (lines 193-195), not line 229.
   - **What this means.** The read as committed is right: the real read on launcher-like logs (What I ran) and
     `probe-mainpath`, making line 229's calls on all 32 units, show it. The read is frozen at launch. So this is a gap for any later edit
     before launch, not a fault now. A `read(U, units, opts)` that the main block calls and the planted cases test would
     close it.
   - **The 16,000 to 19,000 threshold case.** It plants gains, not losses (lines 207-208 give the base `o` the lost
     paths), so its "every flag harmOf's" compares two `false`s. Its no-throw part is the real check. `probe-threshold`
     covers the losses: 100 at j - 2 to j + 2 over N 16,000 to 19,000 and discordances 0.4% to 8%, 40 flagged, 8 exactly
     on the threshold, none differing from `harmOf`, none throwing.
   - **"Each refusal has its planted case."** The registration says so (lines 101-105). Two refusals still have none: a
     person's settings line (line 86; the planted gate drops every self/part line, line 162) and a unit with no
     registered paths (line 74). Both fire on a built record (`probe-mainpath`): `S023-45 MEANS self: pts 30 (want 45)`,
     `S023-45 MEANS part: no settings line`, `S023-45: no paths for it`.
   - **With no log at all.** The stamp gate passes vacuously: `checkLogStamps({})` is `[]`, and the read on an empty
     folder goes straight to its gate. The gate never checks a record's own `stamp.sha`. Stage C's read has the same
     form. Phase 4's read ties each record's stamp to the logs' (`reduce-phase4.mjs` line 92). The batch always writes a
     log per unit, so this matters only if logs are lost.

## What holds (checked, no finding)

- **The read on a complete, correct run.**
  - On built records for all 88 runs, with the registered paths, code, audit, prediction and the pilot's real settings
    lines, the gate is fair (`probe-mainpath`).
  - FLAT against TODAY reads 24 units, MEANS against TODAY 32 and MEANS against FLAT 32. Every unit's MEANS share
    differs from FLAT's and from TODAY's by more than `1e-12`, so the registration's "all 32" is right.
  - `decide` takes the registered branches. With MEANS 0.5 up everywhere and FLAT 0.5 up where it runs, MEANS is taken on
    its 90/10 gains: +0.125 (+0.098 to +0.152).
  - On the pilot's 33 real records, on their own stamp, the gate is fair.
- **`harmExact`.**
  - `thresholdFor` returns `100 * j / N` for a whole j (`size-phase4.mjs` line 57). `harmExact` takes j back by that
    expression, so it never throws on a real threshold at any N.
  - Its flag is `harmOf`'s on every loss tried (finding 3), and `harmFlag`'s `1e-12` keeps the two the same at k = j.
- **The registration's figures.** Each is the file's:
  - from `results-share-rules-sizing.txt`: the pilot's discordances 0.3% to 3.0%, upper bounds 0.87% to 4.26%; 16,000
    paths on all 21 comparisons; 10.50%; 58.1 core-hours, 88 runs, 14.5 hours, 0.82 hours; the solves 75 to 102 s, the
    engine 107 to 164 ms;
  - from `results-share-rules-pilot-power.txt`: the losses 0.70, 0.50, 0.80, 0.70 and 2.40; the chances 0.93 to 1.00;
    MEANS against FLAT +0.167 (-0.032 to +0.365) on 12 units; the shares -0.215 to +0.081;
  - the stamp `code c0dcfa9ef2f2 audit ba4f53953da5`; the arms' hashes.
- **The launch path, unchanged since the first round.**
  - The stamp is line 1 of every pilot log, and its line 2 ends in the Node version (as `RESUME=1` reads them).
  - The registered audit refuses limits, a prediction other than this one, and code other than the panel's.
  - The arms differ only in `shareRule` (the hashes). Every unit is scored in the engine, held to `E.runTrial` on 200
    paths, with the rollout beside on 500, now printed.
