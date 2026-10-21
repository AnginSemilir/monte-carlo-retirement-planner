# The review's scripts (21 Oct 2026)

Run from the repository root after `python3 research/build-engine.py`. The scripts in this folder take an optional
solver-folder argument (default `src/solver`), so a patched copy can be compared with the repository's code on the same
paths. None of them uses a held-out seed: they use 99001 to 99005, the engine checks 424242 and 515151, and the
random-number check draws from the tuning seeds 7001 and 7002. All of their results are exploratory. Except
`engine-vs-fast.mjs` and the engine checks, every simulation here runs the solver's own forward model (`runPolicy`),
not the engine, as the project's runs do; anything that would change a default is confirmed in the engine through the
launcher.

| Script | What it does | Time on this machine (2 cores) |
|---|---|---|
| `table-census.mjs <household> <points> [solverDir]` | Solves under the product baseline with the withdrawal moves only and counts table cells where no move was chosen (O200's signature: survival -1, estate -Infinity). Exit code 1 when any exist. | 30 to 80 s at 30 points |
| `policy-probe.mjs <household> <points> <paths> <out.json> [solverDir]` | The same solve, then the table's opening forecast (three worlds at the mixture's weights) against the policy's simulated survival on seed 99001, with per-path outcomes saved for paired comparison. `EXTRA_OPTS='{"pclsInterp":true}'` adds solver options; `PRODUCT=1` solves through `solvePlan` instead (`LAMBDA`, default 0.3; `EXTRA_OPTS='{"raiseCap":1,"riskConsent":false}'` for the levers). | 1 to 2 min at 4,000 paths |
| `opening-move-check.mjs <household> <points> <paths> [seed] [solverDir]` | One step of policy iteration at the opening: every move, then the policy, on common paths, against the policy's own opening move, with a Bonferroni line over the moves compared. | about 8 min at 3,000 paths for 24 moves |
| `world-probe.mjs <household> <points> <paths> [solverDir]` | The policy simulated with the persistent shift held at each world's node, against that world's opening table value. | about 3 min at 4,000 paths |
| `rollout-demo.mjs <household> <points> <visits> <states> <continuations> <logitDir> <linearDir>` | At states where the log-odds and probability policies disagree, the other policy's move against the policy's own, both then following the log-odds policy. Needs two solver folders (see its header). | about 10 min at 200 / 60 / 300 |
| `engine-vs-fast.mjs <household> <points> <paths> [solverDir]` | The same solved policy executed by the engine (`withTable`, then `runTrial` path by path) and by the solver's model (`runPolicy`), on the same paths, paired. | 40 to 50 s at 2,000 paths |
| `engine-checks/carry.mjs`, `carry2.mjs` | Capital gains tax on the sweep: one household with a large untaxed gain, one move every year, in the engine, `fast.js` and `model.js`, at expected returns (`carry`) and on 3,000 paths (`carry2`). | seconds |
| `engine-checks/fee.mjs` | Survival of two library households with 0, 0.5% and 1% a year taken off every tier's real return. | seconds |
| `engine-checks/tax.mjs` | Savings tax for Scottish and rUK taxpayers, dividend tax at the engine's and 2026/27's rates, and the year fraction in the machine's time zone (run it again under `TZ=America/New_York`). | seconds |
| `engine-checks/prng.mjs` | The random streams' spacing on mulberry32's cycle, correlations and moments. Draws are generated only for the tuning seeds. | seconds |

The two patches beside this folder apply to the repository at 3771bb2 with `git apply`:
- `o200-clamp.diff`: the one-line clamp of `PhiInv`'s argument at solve.js line 222, as line 255 already does. The
  review's "clamped" code is this patch. Part B, Step 1 asks for the fuller fix (the clamp inside `PhiInv` itself, and
  the guards).
- `probit-option.diff`: adds `SOLVER_INTERP=probit` to grid.js (interpolation of survival in probit space), used for
  section 2's probit rows. Exploratory only; Part B, N2 recommends not adopting it.

How each section of `results-exploratory.txt` was produced (A = `src/solver` as is; B = a copy with both patches
applied, which is the review's "clamped" code, since the probit option is inert unless `SOLVER_INTERP=probit`; L = a
second copy of B, for the second module instance):

| Section | Commands |
|---|---|
| 1, census and paired change | `table-census.mjs <id> 30 A` per household; `policy-probe.mjs <id> 30 4000 <out> A` and the same with B, then compare the two `outcomes` arrays path by path (saved = 0 as is and 1 clamped) |
| 1, 60 points | `table-census.mjs <id> 60 A`, and with B for S070 |
| 1, through `solvePlan` | `PRODUCT=1 policy-probe.mjs S224 30 2000 <out> A` and B, with `EXTRA_OPTS` `{}`, `{"raiseCap":1}` and `{"raiseCap":1,"riskConsent":false}`; at 60 points, `PRODUCT=1 policy-probe.mjs <S224 or S380> 60 <paths> <out> A` and its `unchosen` field |
| 2, interpolation | `SOLVER_INTERP=logit`, `probit` and `linear` `policy-probe.mjs <id> <30 or 60> 4000 <out> B`, then the paired comparison |
| 3, other settings | `EXTRA_OPTS=<json> policy-probe.mjs <id> 30 4000 <out> B` against the same with no options |
| 3, the last row | `SOLVER_INTERP=linear EXTRA_OPTS='{"pclsInterp":true}' policy-probe.mjs S070 30 4000 <out> B` against the same with `SOLVER_INTERP=logit` |
| 4, opening move | `opening-move-check.mjs S070 30 3000 99002 A` |
| 5, worlds | `world-probe.mjs S070 30 4000 B` |
| 6, rollout | `rollout-demo.mjs S070 30 200 60 300 B L` |
| 7, engine against the solver's model | `engine-vs-fast.mjs <id> 30 2000 B` |
| 8, engine checks | each script in `engine-checks/` with no arguments; `tax.mjs` also under `TZ=America/New_York` and `TZ=UTC` |
| 9, solve times | `PRODUCT=1 policy-probe.mjs S224 30 200 <out> B` (its `solveMs`, with nothing else running); S092's from section 7's run |
