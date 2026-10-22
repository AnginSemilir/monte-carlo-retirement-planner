# Follow-up review, 22 Oct 2026

For the agent and the maintainer: whether Part B of the review of 21 Oct was adopted, answers to the ten questions in
`research/reviews/2026-10-21/PROGRESS.md`, and what to do next. Checked on `claude/project-access-i58m0x` at 1e36ce5 by
re-running the review's own scripts and the agent's Step 1 and V2 tests on that code; the output is
`results-followup.txt` beside this file. Nothing here touches 7u-F while it runs.

## Verdict

Adopted, faithfully. Steps 1 to 3 are done as written but for the reach count (answer 3), Step 4 with the agreed panel
and the recommended rule, and 7u-F is running on seed 7014: 17 hours from the review's merge (21 Oct 14:06 UK) to 7u-F's
launch (22 Oct 07:14 UK), after 11 days held. The departures are small and recorded. Three of the agent's findings go
beyond the review and matter: the forward run's cash (a third gap between the solver's model and the engine), the
tier-above mismatch's cost where it applied (11 to 36 points of survival), and D3's power at exactly a 1-point loss.
Nothing found here needs 7u-F stopped.

## What was checked

| Part B | Checked on 1e36ce5 | Before (3771bb2) | Now |
|---|---|---|---|
| 1, O200 | `table-census.mjs S224 30` | 468,900 cells with no move | none |
| 1, F0 | `engine-checks/carry.mjs` | CGT over the plan: engine £66,559, fast flow £2,182, `model.js` £2,298 | £40,685 in all three, the same each year |
| 1, F0 | `engine-vs-fast.mjs`, 2,000 paths | S330 +1.55 points (31 paths apart), S092 +0.70 (14) | 0 paths apart on both |
| 1, F0a | `engine-checks/tax.mjs` | Scottish savings tax £1,680, dividends £306.25, New York's first year 0.01 | £800 (as rUK), £376.25, 1 |
| 1 and V2 | the agent's nine tests: invariants, carry, 2026/27 tax, table guards, tier above, cash, engine fidelity, known answers, hygiene | | 71 checks, all pass |
| 3 | `STATE.md`, `CHECKLIST.md`, `.claude/` | | 220 lines and 8; session-start and pre-tool hooks only, the pre-tool 108 lines; a reviewer at three events; the deep reviewer at milestones, one leading cause; the old record archived |
| 4 | `registrations/fresh-7uf.md` against D3, D5 and D7 | | 19 households, 106 units, 16,000 paths scored by the engine, seed 7014 once, 7018 for Phase 4, SHIP on the fixed code |

## Answers to the questions

1. **The oracle bar: a diagnostic, not a gate.** In the one-pot case every move ties, so the policy cannot be wrong and
   the table's opening is the only thing the case measures: it is a check of the numerics. It converges (58.50% at 90
   points against the oracle's 58.56%), so the 3.3 points at 30 are resolution, not a bug. Keep it REPORTED. Yes, V3
   accepts a resolution by the policy's convergence; print the one-pot error at each resolution beside it, and fail V3
   if that error stops shrinking as points are added.
2. **D3's threshold: as written for 7u-F; by error rates for Phase 4.** The wording was the review's, and the half at
   exactly 1 point is what any threshold on an observed loss does at its own edge. Do not change a running registration.
   For Phase 4, register the rule by the error rates wanted at the margin, for example harm read at least 80% of the
   time at a true 1-point loss and at most 5% at a true quarter-point loss, and set each household's threshold and paths
   from the power simulation you already have so that both hold.
3. **The reach count: drop it.** 7u-F re-runs every household on the fixed code, and its guards prove for each solve
   that no cell was lost; the count before the fix only describes 7u, which 7u-F supersedes (and the review's 15
   core-hours was an underestimate). Record the 19 households already counted (none lost) as one line, and stop.
4. **What else the forward model rebuilds: make it one V2 check.** The review looked only at the sweep's gain. Two
   parts, after 7u-F: (a) run the engine and the forward run in step on the same paths and moves, and after every year
   compare the engine's state mapped into the solver's vector (`vecOf(modelStateOf(...))`) with the forward run's, slot
   by slot, to a pound; (b) an inventory test listing every field of the engine's state object as carried (its slot),
   derived (its test) or inert under a table (a test that changing it changes nothing), failing on any field not listed.
   Part (a) finds a rebuilt state; part (b) stops a new one arriving silently.
5. **The hook: revert the interpreter-script check.** No in-session hook can parse every way to write a file, and this
   one has already refused a harmless script. Keep the refusals by exact path; make the maintainer's review easy
   instead: CI prints, for every push, the protected files it changed, and the session start prints the same for the
   last day. The 21 Oct heredoc is exactly what that list would show.
6. **The other argmax loops: guard them right after 7u-F, before V3 and V4.** `adaptive.js` is in the candidate's path,
   so it cannot wait for N5. Each loop gets a planted NaN that must throw; `couple.js` the same, in the same commit.
   7u-F's read need not wait for them: their known source is fixed, and V1 passes on the assembled candidate.
7. **The decomposing arm: as built.** "The final candidate on the plan reference" (D5) keeps the split, so CAND less
   DECOMP is the reference's part and the split sits inside DECOMP less SHIP. Do not change 7u-F. If the read shows harm
   the reference does not explain, V4's "candidate without the RS split" isolates the split.
8. **V3 and V4's scope: as proposed, with two changes.** Add S330 to V3 (thin, with a large taxable account, where F0
   bit hardest); seven households, or in place of S002 if time is short. In V4, drop probit (it never moved a policy by
   more than 0.05 points) and count V3's finest setting as an ensemble variant.
9. **V5: not during 7u-F, since `src/App.jsx` is in the code id.** After it, the interval on the app's existing survival
   figure is small, true of today's figures and changes no default (D12 stands), so it can go in before Phase 4 if the
   maintainer agrees; the sensitivity to the return assumptions goes with Phase 4's perturbed-world checks.
10. **N7: yes.** A standalone page built from `src/solver`, not the app, that times the product solve and the
    candidate's on V3's households, three runs each, the median printed with the device; the maintainer opens it on a
    laptop and a phone and commits the printed table. For scale: S224's product solve took 104 seconds on the review's
    two-core container.

## Next

During 7u-F, nothing but its relaunches (STATE.md section 6). Drop O145 now: it rests on no results file and no decision
rests on it (STATE.md section 4's own rule). When 7u-F reads, in this order, each with its test and a time box:

1. The read, the reviewer on its claims, the deep reviewer: as registered.
2. One commit to `src/solver`: the guards of answer 6 and the `fast.js` l.672 fix, each with its test (half a day).
3. V2's state check of answer 4 (a day).
4. V3 and V4 with answer 8's scope (about a day of runs); the hook change of answer 5 under the maintainer's unlock.
5. Then Step 6 as written.

The maintainer's calls still open: Phase 4's rule (answer 2), V5's interval (answer 9), the charges default (N6), and
the timing page's run on their own devices (answer 10).
