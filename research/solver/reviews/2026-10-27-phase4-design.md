# Design review: Phase 4 (registrations/phase-4.md, draft), before its registration is committed and launched

Subject: the design of Phase 4 (STATE.md D33 to D35, D34 the harm rule), as built in 864b0f3, d514a36 and e2f0c2f, with
the draft registration and the uncommitted budget change to size-phase4.mjs.

## What I read (HEAD e2f0c2fca61b, branch claude/project-access-i58m0x; working tree clean but for the stashed diff)

Blobs (git hash-object, first 12): phase4-panel.mjs 2458ec947006; phase4-orders.json 2a9369f885ba; phase4-panel.json
c044fa088f33; select-phase4.mjs 18b52c1397b4; audit-phase4.mjs a981e68a9500; size-phase4.mjs 316e241e46de;
reduce-phase4.mjs 11b64a986307; batch-phase4.sh fdabbc696f51; batch-p4-pilot.sh 23a774fb09af; batch-p4-land.sh
ca78bd2ec9a3; stats.mjs 7cf309da0151; audit-7uf-checks.mjs e3ec596d819b; STATE.md b3dacd2f0182; CHECKLIST.md
b06443537a60; research/engine.mjs 3084b099b5ed; results-archive/MANIFEST-solver-results.sha256 d6f3248d9dff.
The draft registration (scratchpad phase-4.md, sha256 1681f633886cfa9e...) and the budget diff (size-phase4-stash.diff,
sha256 4f0d95097f657050...). Also: reviews/2026-10-23-deep-7uf.md section 5, reviews/2026-10-23-read-7uf.md finding 4,
FOLLOW-UP.md answers 2 and 9 (origin/review/external-2026-10-21), the archived PLAN.md Phase 4 section (background),
archive/PLAN-HISTORY.md l.120-190, results-2c3-tuning.txt, research/tests/solver.test.mjs, check-prediction.mjs,
run-from-snapshot.sh, fair-gate.mjs (checkLogStamps), code-id.mjs, reduce-7uf.mjs l.40-79, engine.mjs (buildTournament
l.3617-3826, bedAndSippFor l.3478-3490, stepYear l.2191-2268, runTrial, pathsForSeed), src/App.jsx l.8274, the pilot's
case logs so far (results/p4-pilot, 44 of 200 units).

What I ran (no solve, no audit, no batch; each a second or less, nothing written to results/):
- `node research/solver/phase4-panel.mjs --planted`: 11 of 11; `size-phase4.mjs --planted`: 8 of 8;
  `reduce-phase4.mjs --planted`: 13 of 13.
- Scratch scripts (in my scratchpad) importing phase4-panel.mjs and engine.mjs: each panel household's plan as every arm
  builds it, and `E.buildTournament(appPlan(plan), { scope: 'full' })` (no Monte Carlo) for the player arm A's landing
  label names; `sizeFor([NaN])`, `sizeFor([0.1034])`, `harmRate` at four discordances; `clopperPearson(180, 2000)`.
- Text searches for the 40 panel ids across the repository outside results/, and in the archived results manifest.

Verdict: FAIL

Three BLOCKING findings. The decision rule's bars were committed in reduce-phase4.mjs (864b0f3, 21:10 UTC) before the
pilot started (21:56 UTC), and the pilot, the landing and the scan never generate a path of 7003 or 7018 (pathsForSeed
builds path i from seed + 7919 i; the seeds in use differ by less than 7919, so no path is shared). Keep both true
through the fixes: the bars do not move, and any household replaced is replaced by the frozen order's rule, not by
looking at the pilot's seed-7002 figures.

## Findings

1. **BLOCKING. The arms do not run on the same plan: arm A runs on its tournament winner's accumulation, and on 11 retired
   households that includes up to £24,000 of pension tax relief a non-earner cannot get.**
   - The registration says "Every arm runs on the same plan" (draft l.12-14). The code does not do that. APP runs on
     `armA(appPlan(base)).planState` (audit-phase4.mjs l.158, l.162). armA runs the app's tournament with
     `scope: 'full'` (select-phase4.mjs l.88). CAND and SHIP solve `prep(base)`, the household's own plan (l.168-169).
   - The tournament replaces the contributions and, with `scope: 'full'`, moves capital. For the player each household's
     landing label names (phase4-panel.json), 38 of 40 candidate plans differ from the plan CAND and SHIP solve. Only
     S062 and S340F ("Current Plan") match. Where the player has one candidate, the balance at year 0 rises by: S024
     +£13,500; S030, S040, S080, S090, S098 +£24,000; S050, S110, S026 +£13,500; S200 +£16,084; S204 +£5,417;
     S226 +£10,370; S260 +£17,391. S140's six candidates all add £24,000. On the FIRE households the contributions are
     re-split, and some candidates add £4,700 to £16,672. (Scratch script over `E.buildTournament`.)
   - The source is a Bed & SIPP move that the engine gets wrong for anyone without earnings. bedAndSippFor (engine.mjs
     l.3483-3488) sets the room at `min(P.aaAt(0), P.pensionAllowance)`, which is £60,000 gross. It gives relief at
     `gross * P.higherRate` when `o.salary` is 0. S024 (68, retired, no salary) moves its £27,000 ISA into the pension as
     £33,750 gross and gets £6,750 back in cash. The engine applies the £3,600 no-earnings limit elsewhere (l.451,
     l.3207), but not here.
   - The app ships the tournament at `scope: 'contributions'` (src/App.jsx l.8274), with no capital move. `full` is an
     option the user has to choose.
   - Consequences:
     - A1, A2 and every harm flag against APP measure the decumulation rule plus a contribution choice plus a free
       transfer.
     - The landing at 85% was made with the transfer in arm A, so CAND starts from a plan the targets were not landed on.
     - The bias runs against the candidate, so a PASS is not at risk. But a NOT PASSED, which stops the candidate
       ("nothing is tuned until it passes"), could not be told apart from this confound.
     - The gate cannot see any of it. APP's checks cover the returns, the guardrails, the raise cap and the minimum pot
       only (l.163-165). Neither the audit nor the reducer compares accounts or contributions across arms.
   - Fix, the maintainer's call, written into the registration:
     - (a) CAND, SHIP and FIXBR solve arm A's accumulation: its accounts, balances after the transfer, contributions,
       schedules and escalation, with guardrails and the lookahead off. The arms then differ only in the decumulation
       rule. The landing and the pilot's APP units stand; the pilot's 160 CAND and SHIP units must be re-run for D34's
       discordances. The solver reads contributions through `E.contribAtYear` (fast.js l.228, model.js l.236). Run V2's
       state check on one phased household (S272 or S358F) and on S024 before launch.
     - (b) Arm A at the shipped scope `contributions`, the solver arms on its winner's contributions. This needs a fresh
       landing.
     - (c) Arm A without the tournament, every arm on the household's own contributions. This also needs a fresh landing.
   - In every case:
     - Record each arm's accounts (balances, contributions, schedule) as a hash in its `ran` line.
     - Have the gate refuse a household whose arms differ in it, with a planted case: APP's balances differing from
       CAND's must be refused.
     - Report the Bed & SIPP relief for non-earners to the maintainer as an app defect. It reaches users who pick
       "full reallocation".
     - Until the maintainer chooses, the pilot's CAND and SHIP units are not usable for sizing under (a), and no unit is
       usable under (b) or (c).

2. **BLOCKING. Three panel households have been used before: S226 was in the 2c.3 tuning set, and S140 and S280 are Phase
   1's convergence households and the solver's test fixtures.**
   - D35 says "none used before", and the registration says "no earlier run had touched" (draft l.16-17).
   - S226: results-archive/MANIFEST-solver-results.sha256 l.2814 (and eight more lines) lists `results/tune-<wR>-<wB>/S226.json`
     in all nine directories of the 41-household sweep. That sweep is phase 2c.3, "weights tuned on the ODD households"
     (results-2c3-tuning.txt l.1). It tuned the estate weight, and the candidate uses 0.02 from it.
   - S140 and S280: the solver's first convergence and fair-comparison runs, the evidence for building the fast flow
     (archive/PLAN-HISTORY.md l.134-188). They are also research/tests/solver.test.mjs's fixtures (l.99, 131, 153, 173,
     192).
   - Why the freeze missed them: `touched()` (phase4-panel.mjs l.54-71) scans only results/ as it stands and the
     results-*.txt files. The 24 Sep archive moved those runs' files out of results/ (results-archive/README.md), and the
     scan does not read the archive or the tests.
   - Fix:
     - Add to the touched set every id named in MANIFEST-solver-results.sha256 (the p4-select lines excepted, as now), in
       research/solver/archive/ and in research/tests/.
     - Drop the households this adds and take the next untouched reserves in phase4-orders.json's frozen library order
       (S036, S048, ... in order, each checked against the extended set). Land them on 7005 as before, and give them
       pilot units. Or the maintainer keeps them, and the registration says so.
     - Re-check the FIRE bases the same way. Today none of the 20 is in the manifest, the archive or the tests.

3. **BLOCKING. size-phase4.mjs cannot produce the sizing table: the main path reads `.hi` from an array, gets undefined,
   and throws on the first household.**
   - l.146 takes `clopperPearson(v.k, v.n).hi`, but stats.mjs l.74-79 returns `[lo, hi]`.
   - `clopperPearson(180, 2000)` returns `[0.0778, 0.1034]`, its `.hi` is undefined, and `Math.max(undefined, 0.0101)` is
     NaN. harmRate then returns 0 for any NaN discordance (l.37-49: the loop over K never runs), so `thresholdFor(NaN, N)`
     is exactly 0.25 and no N reaches 90%.
   - Run: `sizeFor([NaN])` throws "no N up to 200000 meets both rates at discordances NaN".
   - The planted cases never reach discordances() or this line, so the main path has not run end to end.
   - Fix:
     - Use `clopperPearson(v.k, v.n)[1]`.
     - Make harmRate throw on a non-finite or out-of-range d.
     - Add a planted case that writes synthetic unit files, runs discordances() and the sizing through them, and checks a
       known d+ and N (CHECKLIST 5).
   - With the bound read correctly the method is sound: `sizeFor([0.1034])` gives 16,000 paths, t 0.669, rates 0.049 and
     0.902.

4. MINOR. The gate does not run the fair-test diff across arms that CHECKLIST 3 asks for, and one of its checks never
   checks anything.
   - reduce-7uf.mjs had the diff: `pairProblems`, l.55-61, comparing every `ran` key but the arm's own. reduce-phase4.mjs
     `gate()` (l.56-83) checks a few required substrings per arm only. Nothing compares CAND's and SHIP's `plan` hash,
     `minPot`, `levels`, `grid` or `mix` within a household.
   - `x.target !== h.target` (l.68) cannot fail: the audit writes the panel's target into the unit, not the context's
     (audit-phase4.mjs l.214, `target: h.target`).
   - Fix:
     - Diff the `ran` lines of a household's four solver units, allowing only the arm's own keys.
     - Write `ctx.targetSpend` and the accounts hash (finding 1) into every unit.
     - Hold each unit's stamp to `prediction === REGISTRATION` and to the logs' sha. Today only the logs are held to it,
       and the units only to one another.
     - Add a planted case for each.

5. MINOR. Seed 7003 can be read outside the launcher, and 7018 by any direct call.
   - `audit-phase4.mjs registered` does not require PREDICTION_FILE (l.106-110). It stamps NOT-LAUNCHED and the read
     would refuse the units, but the seed is spent.
   - A non-registered run refuses only 7003, so `node audit-phase4.mjs 2000 part 0/1 7018` reads the replication seed.
   - Fix: `registered` refuses unless PREDICTION_FILE is research/solver/registrations/phase-4.md, and a non-registered
     run refuses 7018 too.

6. MINOR. The audit's stamp and batch-phase4.sh's AUDIT hash cover audit-phase4.mjs, phase4-panel.mjs and the two json
   files only (audit-phase4.mjs l.121, batch-phase4.sh l.18).
   - Not covered: select-phase4.mjs (arm A's pipeline), candidate.mjs, audit-7uf-checks.mjs, and size-phase4.mjs (which
     the reducer imports for harmRate). code-id.mjs does not cover them either.
   - Across RESUME relaunches (Phase 4 needs more than the harness's 12 hours), a change to arm A's search would be kept
     unseen. The label check (l.159) catches only a changed pick.
   - Fix: add them to both hashes.

7. MINOR. S1 is pooled over all 40 households, so large gains on a few bridge households can mask a small loss on many.
   - In 7u-F the no-harm item was over the households outside the gain set (D3; results-7uf.txt: five households carried
     +11.98 of +11.89).
   - Example: +5 points on 5 households and -0.3 on 35 gives S1 = +0.36, and it passes. Each -0.3 is flagged about 7% of
     the time at D34's thresholds (harmRate at a true 0.3: 0.046 to 0.083 across discordances 7.8% to 11.5%).
   - This is inside D34's choice (no harm at 0.25, harm at 1, flags not blocking), so it is not blocking.
   - Fix: report beside S1 the same item over the library cohort and over the households where the reader reads no
     bridge year, plus the count of households with an observed loss vs SHIP. Add a planted case.

8. MINOR. Spending is not reported beside every survival figure.
   - The reducer computes spending against APP only (reduce-phase4.mjs l.149, l.179). CAND vs SHIP spending delivered
     appears nowhere, so S1 and the SHIP flags stand without it. The deep review's (c) was about exactly this pair: the
     bridge gains came with 0.2% to 1.5% less spending than SHIP.
   - FIXBR (l.185), the worlds and history (l.189-191; audit l.205, l.209 record survival bits only) carry no spending.
   - Fix:
     - Add CAND less SHIP spending delivered, pooled by path and per household.
     - Record FIXBR's spending, and the worlds' delivered spending (a Float32Array per world).
     - State the rule in the registration: no survival figure without the spending delivered beside it.

9. MINOR. runPolicy is not run beside the engine (draft l.28-29). The engine is the right scorer, but the fidelity check
   7u-F reported (0 gaps) has no counterpart here.
   - Phase 4's FIRE households have 15 working years and 6 bridge years, and after finding 1 (a) the plans will carry
     re-split contributions and phased schedules. None of V2's five households (results-v-candidate-d30.txt) is like them.
   - Fix: run V2's state check on two FIRE households and on one phased or transfer household before launch, or run
     runPolicy on the first 2,000 paths of each solver unit and report the gaps.

10. MINOR. The budget mixes hosts.
    - The pilot was not launched through run-from-snapshot.sh: there is no runs.log line and no host recorded, and it
      resumed after a container restart with 40 units kept (e2f0c2f).
    - The host is now "Intel Xeon @ 2.30GHz" (/proc/cpuinfo). runs.log's last three lines were on 2.10GHz. budgetOf
      averages the units of both.
    - Fix: write the CPU model into each unit file (not into the stamp, which must stay one across the run), and name the
      hosts in the budget line.

11. MINOR. The registration says the rates were "checked by simulation" (size-phase4.mjs `--check`), but no results file
    holds that output: the main path runs only `planted()`.
    - Fix: print `--check`'s lines into results-phase4-sizing.txt.
    - For the record, sizing at the upper bound is a faithful reading of D34 (2): both rates hold for any true discordance
      up to d+. At t 0.669 and 16,000 paths: 0.028 / 0.932 at 7.8%, 0.049 / 0.902 at 10.3%, and 0.058 / 0.890 at 11.5%,
      above d+. The reducer prints the rates at the realised discordance.
    - Exact binomial sums under the same trinomial model, held to a convolution, are an acceptable form of "your power
      simulation".

12. MINOR. Other prior use on the app's side, which could only favour arm A. Record it in the registration's Households
    line:
    - S080 is in the external review's charge check under the plan's own rules (research/reviews/2026-10-21/
      results-exploratory.txt l.119).
    - S030, S298, S306 and S358 are in research/policy-study/confirmed-results.json.
    - S308 is named in policy-study/lookahead-study.mjs l.24.

13. MINOR. D35 asks for "D20 (9)'s sensitivity to the returns" with the robustness items.
    - The registration lists the three worlds (draft l.43-45) but does not say which item carries D20 (9).
    - Fix: say that the returns-a-point-lower world carries it, or add the item the maintainer meant. FOLLOW-UP.md answer
      9 says "the sensitivity to the return assumptions goes with Phase 4's perturbed-world checks".

14. MINOR. The spending flag (a household more than 5% below APP) is made non-blocking by citing D34 (3) (draft l.37-42).
    D34 (3) speaks of a harm flag on survival. The lapsed gate 4 made the spending condition blocking. Put this one line
    to the maintainer, or say in the registration that it is this design's choice.

## D34, part by part (as built, after finding 3's fix)

- (1) A threshold per household, estate weight and comparison (APP and SHIP), with harm when the observed loss is above
  it: size-phase4.mjs thresholdFor; reduce-phase4.mjs l.98-99, l.161-164. Implemented.
- (2) Sized from the pilot's discordances for both comparisons, at the Clopper-Pearson upper bound, with a floor of
  16,000 paths and more where needed, and the normal cross-check printed beside. Faithful; finding 11 covers the rest.
- (3) No correction across households, and no flag in decide() (l.122-132). Implemented.
- (4) The registration's table (paths, threshold, and the rates at 0.25 and 1 per comparison) and the budget line are
  printed by size-phase4.mjs (l.161-165). Implemented, but blocked by finding 3. Under finding 1 (a), (b) or (c) the
  pilot must be re-run for the units the fix changes.
- The deep review's (a) to (f) and the read review's finding 4 are carried:
  - S1, D34's rule, A2 over every retired year, and the whole score on the first 16,000 paths, the same paths as
    survival.
  - Gate 5 (results-gate5.txt: MET).
  - `node` in the unit stamp, held equal by the one-stamp check (reduce-phase4.mjs l.81), and the budget from the pilot.
