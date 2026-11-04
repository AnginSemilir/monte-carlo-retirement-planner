# Review at the read: GAIN-BUCKET (B7 in D51, D49; EXPLORATORY, seed 7002, deciding nothing)

Subject: the GAIN-BUCKET read committed at 64ad493 on claude/project-access-i58m0x: `results-gainbucket.txt`, STATE.md
section 4's GAIN-BUCKET row (printed by `state.mjs`), and section 5's sentence "no effect beyond noise on survival or
spending and no household harmed, so it is closed as measured and no v2 test opens".

What I read (blobs at 64ad493): `research/solver/STATE.md` 98b21ed1ffee, `research/solver/state.mjs` 1dc4727104ca,
`research/solver/results-gainbucket.txt` f010265f461c, `research/solver/reduce-gainbucket.mjs` 688f28b6cc30,
`research/solver/audit-gainbucket.mjs` 83805ae6d96f, `research/solver/batch-gainbucket.sh` d1b8d521f181,
`research/solver/HARVEST-SIZING.md` 5ccebd26e59e, `research/solver/fair-gate.mjs` 4d4a20402b1c (requireFairLogs,
checkLogStamps), `research/solver/audit-phase4.mjs` 5ace83959b96 (inputsHash), `src/solver/grid.js` 1ab51ec6e41a (the gain
axis, `nearest`, `gainInterp`), `research/engine.mjs` (generated, untracked; sha256 2ad87adc2344; code-id.mjs prints
9273130d7c86, the run's code): the year row's `harvested` and `realisedGains`; the launch plan's B7, F15 and research
queue (`git show 0e24e1b:research/reviews/2026-11-01/LAUNCH-PLAN.md`); the raw units `results/gainbucket-7002/` (17
`.json.gz`, 17 case logs) and `results/gainbucket-launch.log`.

What I ran:
- `node research/solver/reduce-gainbucket.mjs`: output byte for byte the committed `results-gainbucket.txt`.
- `node research/solver/reduce-gainbucket.mjs --planted`: ALL PASS: 10.
- `node research/solver/check-state.mjs`: passes (the row is what state.mjs prints from the results file).
- `node research/solver/audit-gainbucket.mjs --households`: 17 households "in" (12 at 45.0%, 5 at 10.0%), the same 17
  ids as the units in the folder.
- Two scratch scripts over the units with the reducer's own `read`/`armOf`: each household's spending z (the reducer's
  se), Holm each way over the 17, the pounds behind each figure, and on the households with the largest z an exact sign
  test and a 200,000-draw sign-flip test on the paths whose delivered spending differs.

Verdict: FAIL

## Findings

1. BLOCKING. "No effect beyond noise on ... spending", and the row's "a household beyond noise either way (Holm, 5%):
   none", do not follow from the results file; the spending effects are real on some households, both ways, and tiny.
   - The reducer's verdict never tests a household's spending. `reduce-gainbucket.mjs` line 84: `gains` and `harms` are
     `holmGain`/`holmHarm`, the exact McNemar tails of the survival line (lines 63, 66); `panelGain` reads the panel's
     spending, `panelHarm` reads survival only. `state.mjs`'s `beyond` filters the same survival Holm figures (its regex
     captures "Holm one-sided: harm ..., gain ..." from the survival clause), but the row prints it after the spending
     figures, where it reads as covering both. The planted set has no household with spending moved and survival not
     (P2 moves both), so the verdict rule passes its plants with this fault in it.
   - The file's own per-household lines, by the reducer's own se and the same Holm it applies to survival:
     S026 +0.0174% (se 0.0033), z +5.34, Holm (gain) 8.0e-7; S384 +0.0026% (se 0.0006), z +4.22, Holm 2.0e-4;
     S272 -0.0051% (se 0.0019), z -2.71, Holm (CANDGI worse) 0.057. Few paths differ (S384 38 of 4,000), so I checked
     with tests that do not lean on the normal approximation: S026 187 up / 79 down of 266 differing paths, sign test
     p 1.4e-11, sign-flip p below 5e-6; S384 33 / 5 of 38, sign test p 2.1e-6, sign-flip below 5e-6; S272 27 up / 59 down
     of 86, sign test p 3.7e-4, sign-flip p 5.8e-4 (times 17, about 0.01: beyond noise for CANDGI worse at Holm 5% by
     these tests). Three households are beyond noise on spending, two for CANDGI and one against it.
   - The panel: +0.00156% (-0.00017 to +0.00330%, se 0.00089), z 1.77. The file prints the lower end at three places as
     "-0.000". It is a pooled figure over effects of both signs and cannot stand for "no effect on any household".
   - How tiny: S026 +£86 a path over a lifetime's delivered spending of £495,368 (target £18,400 a year); S384 +£10.8
     on £420,869; S272 -£127.5 on £2,500,306. Every household's effect is under 0.02% of its lifetime spending and under
     £160 a path. The records set no materiality for spending in this measurement. The nearest anchors: D43 P2's "held
     within 0.1% either way", a prediction band and not a materiality, about six times the largest effect here; and
     FD-RAISE's row, which calls a -0.007% lifetime-spending change with an interval clear of zero "unchanged".
   - What the read may say: survival, no effect beyond noise (panel +0.003 points, -0.006 to +0.012; at most 2 paths of
     4,000 discordant on any household); spending, effects beyond noise on S026 and S384 (CANDGI higher) and S272
     (CANDGI lower), each under 0.02% of lifetime spending, the panel +0.0016% (-0.0002 to +0.0033%).
   - What follows under B7: HARVEST-SIZING.md lines 32-34 say "a gain beyond noise on the panel, or on a household,
     comes back to the maintainer as a proposal" and, with B7, "a gain opens a registered v2 test after the launch". The
     question (line 9) is survival or spending. So the read cannot itself say "closed as measured ... no v2 test opens".
     The status should be what state.mjs prints when the verdict is not NO EFFECT ("to the maintainer"), with the sizes
     above, so the maintainer can decline a v2 test as immaterial or set a materiality. Bringing an immaterial gain to
     the maintainer is cheap; closing on a statement the file contradicts is not.
   - Fixes needed before the claim can stand:
     - the reducer tests each household's spending each way, with Holm over the households as for survival, by a test
       fit for few differing paths (sign-flip or exact), and tests the panel's spending in the harm direction too;
     - a planted household with survival unchanged and spending moved, shown read as an effect;
     - the verdict lists gains and CANDGI-worse households together, where today a gain hides any harm;
     - the results file and the row reprinted;
     - section 5's sentence reworded.

2. MINOR. The gate refuses a missing household but not an extra one. `gate()` (lines 24-26) compares the folder's units
   against `want` in one direction only, and `read()` pools every `.json.gz` in the folder (line 130). A stale unit from
   another household would be read. On this read the units are exactly the 17 the batch selects. I checked
   `--households` against the folder listing, the launch log ("17 units ... 17 to run"), the 17 case logs (each with
   one stamp, `code 9273130d7c86 audit 691ff7c88659 prediction none`, and both `done` lines), and no "exited" or error
   line. Everything else in claim 3 holds as stated: one code, one audit equal to the files' (the stamped files include
   candidate.json and candidate.mjs, so the candidate is covered), one seed, one count of paths, both arms on one
   `inputsHash`, and `ran` the same except `arm` and `gainInterp` (false / true) on all 17. Every unit records
   d71f65ae871e, 45 points, 800 actions, levels 0.8 to 1.1, lambda 0.02236, raiseWeight 0.003, switchCharge 0.001 and
   W0.02.

3. MINOR. B7 (D51) and HARVEST-SIZING.md name 20 households; the panel has 17 at 10% or more (12 at 45%, 5 at 10%; 15 at
   5%, not the 12 that HARVEST-SIZING line 21 gives). The rule as worded ("10% of wealth or more") was applied, the
   selection is by plan inputs, and dab55c7's message says 17. STATE.md and the read do not record that D51's count was
   a miscount.

4. MINOR. HARVEST-SIZING line 28 lists "the taxable account's moves a path (sweeps, switches, re-wraps)". The audit
   counts two things and the read puts them under "the taxable account":
   - re-wraps as the engine's `harvested` (engine.mjs 7b: the pension drawn beyond need and re-wrapped into the ISA,
     then the GIA);
   - gain years as `realisedGains > 0`, which opens each year with last year's carried gains (engine.mjs:
     `realisedGains = { self: state.cgtCarry.self, ... }`).
   The taxable account's tier switches (what D47's look found the bucket reversing under giaTiers) and its sweeps into
   the ISA are not counted, though the row carries `action` and the tiers. So the read cannot say whether the bucket
   changes the candidate's switches on that account. It does not claim to.

5. MINOR. The cost was not reported against its estimate. The 17 units' recorded seconds sum to 17.6 hours (solves
   9.47, engine 6.61). The pilot said "about 9 core-hours" (STATE.md section 5 before 64ad493) and B7 said about 8. The
   launch plan's research queue says a run "comes back first if it costs a quarter over its estimate". Those seconds are
   wall time with three units at a time, possibly beside other work, so part of the excess may be contention. Neither
   the read nor STATE.md records the overrun.

Checked and sound (claim 4, and the rest of claims 1 and 3):
- The reducer reads the audit's fields as written:
  - `TYPES` matches the audit's arrays (Uint8 survived, cross, rewrap, dispose, giaYears; Float32 delivered, unmet;
    Int16 failYear), and `dec` copies each into its own buffer.
  - saved and lost are paired by path, and `tail` is the exact one-sided binomial; Holm is step-down and monotone.
  - spending is 100 sumE / sumD, its se that of the sum over the fixed denominator.
  - the crossings are per path, with the share of paths having at least one.
  - `nearest` on [0.05, 0.25, 0.55] changes at 0.15 and 0.40, as `EDGES` says (grid.js `nearest`, `vecOf` slot 3).
  - runPolicy is set beside the engine on survival over the first 1,000 paths of each arm: 17 x 2 x 1,000 = 34,000,
    0 / 0.
  - the solve's median is the 9th of 17 ratios.
- `gainInterp` reaches the engine's execution, not only the solve: the grid carries it, and readValues/locateVec bracket
  the gain axis under it.
- Every figure in the row matches the file.
- Survival levels run from 92.9% to 98.4%, so the survival null is not a ceiling. With discordance at most 2 of 4,000,
  a true quarter-point loss (10 paths lost, 0 saved) would give an exact p of 9.8e-4, times 17 = 0.017. A real
  survival loss of that size would have read.

## Re-review

Subject: the read redone at 59664c9 on claude/project-access-i58m0x, after the FAIL above. cd794b9 after it touches only
`research/ui-harnesses/solver-projection-ui.cjs` (`git diff 59664c9 HEAD --stat`).

What I read (blobs at 59664c9): `research/solver/reduce-gainbucket.mjs` f7b4e88f1fe9 (the diff from 688f28b6cc30 whole),
`research/solver/results-gainbucket.txt` daa8536937dd, `research/solver/state.mjs` 24355509bb11, `research/solver/STATE.md`
93de432c7c4a (the GAIN-BUCKET row, section 5), `research/solver/DECISIONS-PENDING.md` f9f2d0e4e87f;
`research/solver/audit-gainbucket.mjs` unchanged (83805ae6d96f).

What I ran:
- `LAUNCH_REV=dab55c7 node research/solver/reduce-gainbucket.mjs`: output byte for byte the committed results file.
  Without LAUNCH_REV it exits 2 with "the units' audit 691ff7c88659 is not the files' a139e1dc54b8", as strict as before.
- `node research/solver/reduce-gainbucket.mjs --planted`: ALL PASS: 17.
- `node research/solver/check-state.mjs`: passes.
- The launch reducer (`git show dab55c7:research/solver/reduce-gainbucket.mjs`) on the new plants: P1 with P3 (spending up
  on 40 paths) and P4 (down on 40) reads "VERDICT: NO EFFECT beyond noise", and its gate passes P3 outside a measured set
  of P1 alone (`[]`). So each new plant fails on the code before the fix.
- The reducer's own `flipTest` at 200,000 flips on three other seeds:
  - S272, loss: p 1.11e-3 to 1.18e-3 (the read's 20,000 flips: 1.0e-3, Holm 1.70e-2);
  - S326F, gain: p 4.34e-3 to 4.49e-3 (Holm about 0.065 to 0.067; the read 6.82e-2);
  - S164 and S096, gain: about 1.6e-2 and 2.0e-2;
  - S026 and S384: at the resolution floor.
  The households on each side of 0.05 do not depend on the flip seed.
- An exact sign test with Holm over the units, to check the reason given for not using it: see finding 1.

Verdict: PASS

Against the first review's findings:
- Finding 1 is fixed.
  - Each household's spending is tested each way, by a sign-flip test of the paired sum, the reported mean's own test.
    `flipTest` is mulberry32, seeded per household (FNV-1a of the id) and one-sided both ways; its p is (count + 1) /
    (B + 1), so 5.0e-5 at least, and Holm at least 8.5e-4.
  - Holm runs over the 17 households in each direction. The panel's spending is tested both ways.
  - `verdict()` names every effect, survival and spending, gains and losses together. A gain goes to the maintainer
    (B7), and state.mjs prints the status from the verdict.
  - The up / down tolerance (a millionth of the path's lifetime spending, above the Float32 grain of 1.2e-7) drops no
    differing path on the households I checked (kept = nonzero on all six).
  - The figures match my own: up on S026 and S384, down on S272.
  - The row, section 5 and DECISIONS-PENDING carry the sizes ("each under a fiftieth of a percent") and the choice (a v2
    test after the launch, or declined as immaterial), with the survival interval for the null.
- Finding 2 is fixed: the gate refuses a household outside the measured set, and a plant shows it.
- Finding 3 is fixed: STATE.md section 5 says "seventeen households, not D51's twenty".
- Finding 4 is fixed: the labels say what is counted, and that the tier switches and the ISA sweeps are not.
- Finding 5 is fixed: STATE.md section 5 and DECISIONS-PENDING report about twice the pilot's core-hours, past the quarter.
- The binomial tail is now taken in logs. tail(2000, 4000) is 0.5063, as it should be (0.5 + P(X = 2000)/2). The old
  tail was not wrong on this read, since n = saved + lost <= 2.

The LAUNCH_REV route is sound for this read. It does not weaken the gate in a way the rules forbid.
- What it checks: the hash is taken over STAMP_FILES, with the reducer at LAUNCH_REV and every other file as it is now.
  That hash equals the units' own audit (691ff7c88659). Under SHA-256, that proves the audit, the panel, the candidate and
  the other stamped files are byte for byte as launched. It also proves the reducer taken is the launch reducer: no other
  revision's reducer would match, so the revision cannot be chosen to suit.
- What changed: only the reader of the units. The reducer cannot change a unit, the pairing or the recorded settings, and
  the gate's checks on those all still run.
- What the route gives up: the read is no longer tied to the reducer as launched. That tie is what enforces "read once,
  by the registered rule" (CHECKLIST 2). This read is EXPLORATORY and decides nothing, so CHECKLIST 1 sets no rule here.
- Why it cannot reach a registered run: this reducer calls requireFairLogs with 'none' only, so logs from a registered
  launch are refused before the gate.
- Disclosure: the gate line names both reducer blobs (688f28b6cc30, f7b4e88f1fe9), and the STATE row says the reducer
  changed after the run. fair-gate.mjs's declared-correction route already accepts a declared change to the reducer for a
  registered prediction.
- What the change did to the verdict: made it stricter, from closed to "to the maintainer".
- The route should not be copied into a reducer that reads a registered run without the maintainer's ruling.

Findings:

1. MINOR. The count of households depends on which test reads them, and the test was chosen after the data was seen.
   - An exact sign test with Holm over the 17 flags seven:
     - S026 up (187 / 79), S096 up (118 / 66), S344F up (55 / 26), S384 up (33 / 5);
     - S030 down (62 / 109), S272 down (27 / 59), S334F down (67 / 107), with S334F's mean up (+0.0027%).
   - The sign-flip test of the mean flags three.
   - The mean's test is the right one for the figure reported, and P5 plants the reason. The choice cut the count rather
     than raising it, and the verdict class is the same under either test (a gain, to the maintainer).
   - But DECISIONS-PENDING says "spending up on two households and down on one", and nothing tells the maintainer that
     the typical path moves on seven. That matters to a judgement of materiality. One line beside the proposal would do
     (for example "the median path moves on seven households, each as tiny").

Correction to the first review: there I gave S272's sign-flip p as 5.8e-4 ("times 17, about 0.01"). It came from a scratch
generator whose products exceed 2^53 in floating point, a faulty generator. The reducer's figure is the right one: 1.0e-3
at 20,000 flips, and 1.11e-3 to 1.18e-3 at 200,000 on three seeds, Holm about 0.02. The conclusion, beyond noise with
CANDGI lower, stands.
