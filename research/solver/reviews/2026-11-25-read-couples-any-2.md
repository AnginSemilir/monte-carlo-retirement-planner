Verdict: PASS

# Review at the read, second look: every couple on the solver, the registered test (`registrations/couples-any.md`, seed 7027)

**Subject.** The fix round to the write-up `reports/2026-11-25-couples-any-read.md`, committed in 2571ff26, which answers my
first look (`reviews/2026-11-25-read-couples-any.md`: FAIL, one BLOCKING and three MINOR). The read itself is unchanged.
`results-couples-any-registered.txt` and the three files beside it have the same blobs at 2571ff26 as at dc4814d8.

**What I read** (git blobs at 2571ff26, first 12):
- the write-up ce2d889d0609, `couples-any-beside.mjs` 7d5a0d17d3ce, STATE.md e2c1087dc74e (sections 5 and 6 action 2),
  `drafts/COUPLES-ANY-DEFAULT.md` 6478d67172ca and `research/tests/fast-inputs.json` 84014d02e82a;
- my first look b7bf14641d5f, which is the file I wrote byte for byte;
- the results files, unchanged: the read 041784d3ccc8, the beside file e49b5ce7011b and the MPAA file 29fdab5172a3;
- the code behind the new MPAA bullets, at 48522d79:
  - `src/solverSettings.js` `prepareForSolve` and `appPlan`;
  - `src/solverCouple.js` `householdPlan` and `householdCut`;
  - `research/solver/couples-any-panel.mjs` `anySolverPlanOf` (l.179 to 183);
  - `research/solver/audit-phase4.mjs` 5ace83959b96 `solverPlanOf` (l.137 to 141);
  - `research/solver/select-phase4.mjs` 0d54f6a47a8a `armA` (its pick and label, l.86 to 91);
  - `research/solver/phase4-panel.mjs` f5d8e7411e88 `appPlan`;
  - `research/engine.mjs` (built, not tracked): `resolveMpaa`, `DECUMULATION_POLICIES`, `mpaaAppliesAtYear` and
    `wrapperHeadroomAtYear` with their callers, `saveSplitRoutes` and `suggestOneOffDestination`.

**What I ran.** None of it runs a solve, a path or a batch.
- `couples-any-beside.mjs` on both reads and `couples-any-mpaa.mjs`: each committed file byte for byte. The beside script's
  `--planted` prints `PLANTED: ALL PASS (9)`.
- A tally from the 136 records' `label` (arm A's pick, as `armA` builds it) and the panel's plans, set against each unit's
  MPAA ages (scratch script `policy.mjs`; finding 1).

## Each finding of the first look

1. **BLOCKING, answered.** The M1 bullet (l.81 to 83) now says only that the two occur together: "The read does not show
   why, or that one is the price of the other."
   - Its example is the read's l.10: S041-W0-Y75, 0 lost and 3,679 saved, `+1.5096%` on the paths both keep.
   - No causal wording is left in the write-up. A search for pays, price, trade, because, cause and buy finds only l.82's
     "does not show ... the price".
   - Next and STATE.md action 2 now say "both units' shortfalls, as D143 accepted S037's and D134 S273-90's". The draft's
     "Not in it" carries the same into the D-line.
2. **MINOR, answered.**
   - The write-up (l.34 to 36) and the script's header (l.19 to 21) give 575998b5 at 22:04 UTC on 24 Nov, while the run was
     going and before the read, with the unit records partly written. That matches git and the records' times.
   - "No outcome of seed 7027 read in writing it" is the author's account. The files cannot show it, and the registered logs
     carry no outcome.
3. **MINOR, answered in part.**
   - **What the ages reach (l.154 to 161) is right on the code:**
     - nothing is levied past the MPAA (`engine.mjs` l.1777 to 1778);
     - `mpaaAppliesAtYear`'s callers are `wrapperHeadroomAtYear` (l.3653), `saveSplitRoutes` (l.3607, which moves money only
       on a move with `save > 0`, l.2278, never in a couple's solve) and `allocateBudget` (l.3694);
     - `wrapperHeadroomAtYear`'s callers in a run are `buildContext`'s routing alone. `suggestOneOffDestination` is called
       nowhere in the engine, and `optimizeInheritance` and `estateActionPlan` are not in a run;
     - only S207's units, of the 62, hold a one-off contribution: the first person's, dated 2033, at 62, past their MPAA age
       in both arms.
   - **Where the ages come from (l.145 to 153)** carries an error that was mine. See finding 1 below.
4. **MINOR, answered.** "The cost of L's limits" (l.179 to 181) gives the registration's caveat (its l.21 to 24) in its own
   terms.

The write-up's "The reviewer at the read" section reports my first look as it reads. Nothing else in the read or its figures
moved.

## Findings

1. **MINOR. The MPAA bullet says both arms' ages are resolved "on the plan as arm A's policy holds it" (l.146 to 148). For
   ROUTE that is not what the code does.** The words come from my first look (its l.173: "`prepareForSolve` resolves the MPAA
   on arm A's policy"), which was wrong there.
   - **The code.**
     - ROUTE's ages are resolved by `prepareForSolve` (`src/solverSettings.js` l.261 to 263) on the plan as handed to the
       solver. `householdPlan` resolves them again on the same policy (`src/solverCouple.js` l.48).
     - That plan is `routedOf(plan, aPol)` (`couples-any-panel.mjs` l.182; `audit-phase4.mjs` `solverPlanOf` l.137 to 141).
       It takes arm A's withdrawal policy only where its deposit order differs from the plan's own, and never takes arm A's
       drawdown strategy or harvest setting.
     - Of `E.DECUMULATION_POLICIES`, only 'Windfall to ISA' has a deposit order. Every unit's plan holds 'Bracket Fill
       Basic' and 'Phased Drawdown'.
     - So ROUTE's ages come from the expected path of the plan's own rules (or 'Windfall to ISA' where arm A picked it),
       with the guardrails off and no lookahead. APP's come from arm A's pick, its policy, drawdown and harvest
       (`select-phase4.mjs` l.86 to 91), with the guardrails on and the five-year lookahead.
     - The fix round's other bullets hold as written: neither arm's ages come from ROUTE's moves, and by the code the earlier
       ages move no money on the 62 units.
   - **The records** (each unit's `label` against its plan's policy, `routedOf`'s rule applied):

     | the two resolutions run | the ages agree | the ages differ |
     |---|---|---|
     | different withdrawal policies (arm A's pick against the plan's own) | 49 units | all 62 units with different ages |
     | the same policy | all 25 units | none |

     This is a co-occurrence and not shown as a cause. "Why the two settings reach different ages" (l.152 to 153) names the
     guardrails and the lookahead alone.
   - **Fix.** Say what each arm's ages are resolved on, as above. Make it "why the two resolutions reach different ages is
     not shown". If the tally goes into the write-up, have a script print it from the records (CHECKLIST 6) and say it is a
     co-occurrence.
