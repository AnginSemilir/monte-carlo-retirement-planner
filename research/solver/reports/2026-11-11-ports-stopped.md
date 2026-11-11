# 11 Nov, evening: D73's port and item 11, both stopped for the maintainer; item 13's stage A prepared

A report under D81 (G). Neither port is committed. Each is on the branch as a patch that applies to d0f293bb
(`drafts/item10-d73.patch`, `drafts/item11.patch`). No result of D4 or of seed 7021 was read; `d4-backup` was not opened.

## 1. D73's port: A's condition is not met as worded

A's unlock covers three pinned digests and `fair-variables.mjs`'s two rows, on the condition that `state-check` is green
and step 6 prints nought. Step 6 does. `state-check` is green only once the test's own replayed move carries the sweep,
and that file is protected and not in A's list. Two more protected tests need an edit that is not a figure. By D81 (F)
these are the maintainer's, so the unlock was not used and the port is not committed.

What the port still needs unlocked, beyond A's list:

| File | The edit | Shown on a scratch copy |
|---|---|---|
| `research/tests/state-check.test.mjs` | `moveOf` carries `cgtSale` and `sweepIsa`, as `tablePolicy` (`bridge.js`) does | ALL PASS: 14 checks |
| `research/tests/speed-port.test.mjs` | its "candidate as D29 left it" built from `BEFORE_D73_OPTS`, not `CANDIDATE_OPTS` | ALL PASS: 20 checks, no pinned digest changed |
| `research/tests/solver-app.test.mjs` | check 1's lattice plant `nz: 64` becomes `nz: 32` (64 is the candidate's own since D73) | ALL PASS: 12 checks |

The commands and their output, on the working tree at d0f293bb with `drafts/item10-d73.patch` applied:

```
$ node research/tests/state-check.test.mjs            (the committed test)
FAIL  1. lockstep, 1047 household-years: ... worst gaps: pension £2317.9735 (S370 path 8 year 44); ISA £2274.6081 (S370 path 2 year 3); taxable and cash £2316.3911 (S370 path 2 year 3) ...
FAIL  the move handed to the engine is tablePolicy's own whenever both pick the same index (mismatches 1751)
FAILED: 2 of 14 checks

$ node <a scratch copy of it whose moveOf carries cgtSale and sweepIsa>
PASS  1. lockstep, 1047 household-years: ... worst gaps: pension 0.0e+0; ISA 8.1e-10 (S370 path 4 year 45); taxable and cash 9.3e-10 (carry path 6 year 19) ...
PASS  the move handed to the engine is tablePolicy's own whenever both pick the same index (mismatches 0)
ALL PASS: 14 checks

$ node step6.mjs <a tree at 11bb254> <the port> S116 ; ... S370      (the port solved with sweepCashIsaTo and coarse left out)
S116 at 4 points: the tree before the port against the port with sweepCashIsaTo and coarse left out: 0 of 3919104 table values differ
S370 at 4 points: the tree before the port against the port with sweepCashIsaTo and coarse left out: 0 of 5007744 table values differ

$ node research/tests/solve-coarse.test.mjs
PASS  6. refused outside E5's path (tsOnce false): coarse needs the joint tier state's E5 path with its smaller cuts, the full level scan, and neither a coverage axis nor payWhereOnePays
PASS  7. at the dial's position 3 the locked solve keeps the whole menu (meta.coarse {"off":"a locked dial position keeps the whole menu"})
PASS  8. consent withdrawn on S116: the app's solve runs on the whole menu (its 699840 table values' digest d70ea0834d133ac1, the solve's with the setting taken out d70ea0834d133ac1; meta.coarse {"off":"no joint tier state on this solve: th
PASS  8. where the solve can take it (S116, consent as the plan's), the app's solve is on the shortlist: 25524 cells
PASS  9. the predicate against the refusal on 8 option sets: fits as the candidate; refused tsOnce false, tsLean false, payWhereOnePays, countFailPicks, consent withdrawn, a tsOnce plant, without joint worlds
ALL PASS: 16 checks

$ SOLVE_COARSE_PLANT=lockcoarse node research/tests/solve-coarse.test.mjs
FAIL  7. at the dial's position 3 the locked solve keeps the whole menu (meta.coarse none): coarse needs the joint tier state's E5 path with its smaller cuts, the full level scan, and neither a covera
$ SOLVE_COARSE_PLANT=fitsall node research/tests/solve-coarse.test.mjs
FAIL  8. consent withdrawn on S116: the app's solve runs on the whole menu (no solve; meta.coarse none): coarse needs the joint tier state's E5 path with its smaller cuts, the full level scan, and nei

$ node research/tests/solve-size.test.mjs
PASS  1. solve()'s bytecode 61395 bytes against the limit 61440: 45 under

$ node research/tests/run-all.mjs fast -j 4
run-all fast: 60 files found, 60 run, 52 passed, FAILED: check-state.test.mjs (1), e3pcls-guard.test.mjs (1), state-check.test.mjs (1), speed-port.test.mjs (1), solver-app.test.mjs (1), couple-quick.test.mjs (1), windfall-relief.test.mjs (1), couple-share.test.mjs (1)
```

Of those eight: `check-state` is the printed block; `e3pcls-guard` failed on a shallow clone and passes on the whole
history; `state-check`, `speed-port` and `solver-app` are the three edits above; `couple-quick`, `windfall-relief` and
`couple-share` are A's three digests. Their working is `d73-digests.mjs`'s output, in the patch:

```
couple-quick.test.mjs check 5 (BEFORE); windfall-relief.test.mjs check 6 (ITEM3.S116)
  S116; pinned today: b954f145878ff4604101cff2c8513547430df0e9a0835547f3b5471982b65eb4
    both keys out                      b954f145878ff4604101cff2c8513547430df0e9a0835547f3b5471982b65eb4   = the pinned figure
    the sweep to the ISA alone         5ccf2d4f54d1ebb770c39dc99a5685bc0779700aac63c624e79fba6e1e620089
    the anchors and shortlists alone   746bfc934cd9cb38593fb4c08443fc49cf5b30cc92beedaced4c8c3455376cfd
    both, the candidate                81e774a399c6b29e6d39151ece157e6ad48c6fc407606f782b83d8c96ce32b13   <- the new figure

windfall-relief.test.mjs check 6 (ITEM3, S210 its deposit removed)
  S210, its deposit removed; pinned today: f9a4e63e00f6958e4145dd577416bb9e6930ea8a46d391a19fbe5e0f83661653
    both keys out                      f9a4e63e00f6958e4145dd577416bb9e6930ea8a46d391a19fbe5e0f83661653   = the pinned figure
    the sweep to the ISA alone         f382fafad598609050e3238a05b9435450fd24785b7261a57b2d5755d2585ff3
    the anchors and shortlists alone   978d895136d70193ce70fd8d320a4b18d2547cd8eb6aee09fe817fce9d7d66a6
    both, the candidate                1daa7851917f000a97479b09485392689113801c740c484dc157fc4e825e9574   <- the new figure

windfall-relief.test.mjs check 6 (ITEM3, S210 its deposit typed into the taxable account)
  S210, its deposit typed into the taxable account; pinned today: c7785c6fc3ecdcb402f3dbf8a1cf9109a4fa6600e755776e785b998b907085e7
    both keys out                      c7785c6fc3ecdcb402f3dbf8a1cf9109a4fa6600e755776e785b998b907085e7   = the pinned figure
    the sweep to the ISA alone         80a7e422c38cb00e7d3349f33060dd69aadca364bd0fef2de8fd1e3b9c0a0460
    the anchors and shortlists alone   ce168571e076f904231bfe6b475437c1f071b4a6c763d71e8ae51195444b89f5
    both, the candidate                bb84262fb4db77b4e24c0c57252471064c73c2c16dc7b9b273cec9c3012f274e   <- the new figure

couple-share.test.mjs check 2 (BEFORE)
  S007, each person's tables; pinned today: ee4875424b94acb82da47dff0f30a7fddf17613dad59e49b5dd329f91af58609
    both keys out                      ee4875424b94acb82da47dff0f30a7fddf17613dad59e49b5dd329f91af58609   = the pinned figure
```

## 2. Item 11: stopped on a value that differs

Every identity count is nought and both 45-point timings pass, but the fast suite's `solver-guards` fails on the
review's patch as written: what the flat path keeps on a couple's solve (`cp._flat`) is not checked against that solve's
tables, so a copy of the solve holding another table is valued on the tables it was copied from. The patch on the
branch adds a guard (`flatOf` builds afresh when the tables or the model are not the ones it was built on) with a third
case in check 5 and its plant `flatstale`. The outputs whole: `drafts/results-couple-flat.txt`. The ruling asked for:
commit it with the guard, or send it back.

## 3. Item 13's stage A: prepared, its batch waiting for the port's commit

`TIE-A.md` (item 13's rule and item 7's, as D81 reads them), `audit-tie.mjs`, `batch-tie.sh`, `reduce-tie.mjs`.

```
$ node research/solver/reduce-tie.mjs --planted
all planted checks pass
```

The review's check on S328F, reproduced (`results-tie-precheck.txt`):

```
the same, every figure but the timings: the household and its cap
the same, every figure but the timings: the whole menu
the same, every figure but the timings: whole+tieC@1e-4
the same, every figure but the timings: structure+slice+tieC@1e-4
VERDICT: REPRODUCED (whole+tieC@1e-4: mean pot 23.19%, lifetime tax -48.38%, 0 saved, 0 lost; structure+slice+tieC@1e-4: mean pot 23.54%, 0 saved, 1 lost).
```

A light smoke of the batch and the reducer ran end to end on a scratch tree (the port with the three prototypes; 4
points, 100 paths): no figure of it is a result.
