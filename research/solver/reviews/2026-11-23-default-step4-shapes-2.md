# Review of a change of default, second look: step 4's three shapes taken in the app (D145 (1); D146 with its fix round)

Subject: the change and its fix round, built and not committed in the working tree on 3d7fafec (branch
claude/fervent-goodall-e2mrnf), against my first look (`reviews/2026-11-23-default-step4-shapes.md`: FAIL, one BLOCKING and
five MINOR). D81 (F): this is the look after the one fix round.

## What I read

- The first look, and each of its findings' answers below.
- The code (working-tree blobs, `git hash-object`):
  - `src/solver/household.js` d4e518ff583e: the mark l.230, the merge's first and later accounts l.148 and l.153, the
    dated-schedule rule l.185-190, the schedule l.196-201, the later retiree's take-home l.214-217, `maxPen` l.286-290;
  - `src/App.jsx` f6ecaca35426: `normalizePlan` l.1141; `buildContext`'s ledger l.1861-1988 (the mark l.1934-1935, the
    direct branch l.1942-1944); stepYear steps 1 to 2a l.2245-2295 and the working take-home l.2385-2398;
    `wrapperHeadroomAtYear` l.3635-3658; `resolveMpaa`; the plant list l.8748;
  - unchanged since the first look (same blobs): `src/solverSettings.js`, `src/solverCouple.js`, `src/couplesSwitch.js`
    (l.92, l.173), `src/solverApproximations.js`, `src/solverClient.js`, `couple-shape.test.mjs`, `couple-default.test.mjs`
    and their two records;
  - the solver's readers of the ledger: `src/solver/fast.js` l.248-256, `src/solver/model.js` l.224-237,
    `src/solver/solve.js` l.1099-1120; `src/solverApp.js` l.57-60.
- The tests: `research/tests/household-landing.test.mjs` 7380abab6f2d, `parse-all.test.mjs` c564492c74b7,
  `household-route.test.mjs` 7b2a8d637d22, `household-shapes.test.mjs` 559ce666b37a, `household.test.mjs` cf8a51bad24e,
  `run-all.mjs` 74be67a61ad5, `fast-inputs.json`, `fast-skip.mjs` (a test with no record runs);
  `research/ui-harnesses/solver-planner-ui.cjs` 33c87ea99d29 (check 19 (b3) and (b4), `solvedHere` l.822, `refHousehold`
  l.277, the plant lists).
- The research scripts: `research/solver/household.mjs` e16434c65610 (its header's note), `household-landing-scan.mjs`
  3e5d42991990, `household-landing-effect.mjs` 8781044a5c93 (its `HLE_PLANT` and `--assemble` modes).
- The records: `results-household-landing.txt` bcb3140ad9c6, `results-household-landing-scan.txt` ae2be34a1cbc,
  `results-household-landing-effect.txt` 4aa5bcbad383, `results-parse-all.txt` e80ade515590, `results-household-shapes.txt`
  bc8799c1ce47 (and its committed blob at HEAD), `results-household-port-identity.txt` (D136's identity).
- The words: `STATE.md` 02a2475b36e1 (D146, the block, section 5), `STEP4-SHAPES.md` 8c397b5f6284, `DECISIONS-PENDING.md`
  5e88bf9cb8e2, `COUPLES-ANY.md` e431c5660284 (class W).
- What I ran on the working tree:
  - `household-landing.test.mjs`: ALL PASS, 4 checks, its output the record's byte for byte (18 s).
  - `household-shapes.test.mjs --planted`: 'shapesched' fails 2 and 4, 'year0whole' 3, 'cashisasum' 4, each as wanted (24 s).
  - My first look's two constructed cases on S001:
    - the first person 76 and the partner paying £5,000: with the fix £20,000 of £20,000 into the pension;
    - the first person 66 drawing and the partner paying £35,000: £175,000 of £175,000, no drips.
    Under 'roomclaim' I get £0 and £21,250 (£127,000 dripped), as at the first look.
  - The agent's `b3b4-check.mjs` (Node, no browser): (b3) and (b4) each on the household route lifting Y, the cut taking
    them, every later-retiree deposit whole. (b3) carries the schedules isa_self 5000/5090 and cash_self 3000/3090 and a
    merged subscription of £3,000.
  - `codeId()` 6b2732dd0cb5, as (7d) pins. The e3pcls fingerprint bbe862bf7b13e869, the pin's. `check-state.mjs` passes
    (300 lines). The fast tier has 83 tests and holds the three joiners. Of the changed files only `run-all.mjs` is
    protected (`protectedAmong`).
- The agent's outputs, read (scratchpad `fixtests/`):
  - household-route before the amendment: FAIL on check 1 on S351F-90 alone, checks 2a and 2b equal;
  - household-route after it: ALL PASS, its plants 'nobands' and 'oddsplit' each failing it;
  - couple-default `--planted`: 20 of 20 plants each failing exactly its checks, as its record;
  - batch-shapes-units: ALL PASS; couple-split: ALL PASS 5.
- My scratch script, EXPLORATORY, no path run: `owndeps.mjs` (the plans' own one-off deposits, household against couple).
- Not run by me: the planner harness. B1's gate runs it, and the agent's local run was under way.

Verdict: PASS

No BLOCKING finding; three MINOR. Every finding of the first look is answered.

## What holds

1. **Finding 1, answered by fix (a).** A marked deposit lands as the couple's regular contribution does, in every flow the
   engine reads.
   - The ledger. A marked deposit that is not Auto takes its whole amount and claims nothing (App.jsx l.1934-1935). It
     lands direct (l.1942-1944).
   - stepYear. It is a step-1 deposit (l.2250-2256): its wrapper's pot, the GIA's basis, and, for an ISA, the year's
     subscriptions (l.2254), as step 2 counts a regular ISA contribution (l.2284). Between steps 1 and 2 only the drips run
     (l.2262-2271), and nothing in stepYear reads a pension's room.
   - The take-home. Step 2's own tally is read by one thing, a working person's take-home (l.2395). The household person
     never has one after the first retirement. The later retiree's take-home is the household plan's income, priced as the
     engine prices it (household.js l.214-217).
   - The relief. Both land the contribution's figure gross, which already holds any NIC pass-through (App.jsx l.1448). The
     cost is in the take-home.
   - The solver. The forward run, the exact model and the e3pcls inflow rule read the engine's ledger (fast.js l.248-256,
     model.js l.224, solve.js l.1104).
   - The mark reaches the table. `normalizePlan` keeps it only where true, `resolveMpaa` returns the normalised plan, and
     the test reads `householdCut(...).hplan`.
   - Nothing else moves.
     - The ledger's other readers are the windfall split (research only, not in the candidate) and the savings split,
       which a solve with a partner's age drops (solverApp.js l.60).
     - The plan's own deposits come first in each year's order. The scan compares their landing and staged tranches, the
       fix against the plant: 0 of 434 moved.
     - Where the fix lands nothing otherwise, the table is the same. On household-route's S351F-90 six deposits are marked
       and none was short: the same table digest, the same 200 paths.
   - The plan's own deposits keep design A's doubled room: on every panel each lands £7,200 in the household pension
     against the couple's £3,600 (`owndeps.mjs`: the registered panel 36 of 36, step 8's 15 of 15, the library 105 of 105).
     That holds in every tested unit, and the fix does not touch it.
   - The test catches the class. Under 'roomclaim' four of its five variants fail (136 deposits short), and check 3
     confines the plan's change to the mark. Its two plants cannot cross: no plan in check 1's battery carries a dated
     schedule, and check 2 reads no deposit.
   - The effect run. Its control (each unit under 'roomclaim', held to the pilot's ROUTE on every path, 10 of 10) makes
     "before" this code without the fix. The `--assemble` mode orders the parts by the panel, sums only the effect lines,
     and prints the control's conclusion only when every unit agrees. D146's effect figures are the file's.
2. **Finding 2, answered.** Check 4's breakdown is my reproduction's:
   - 900 years on the first person's own cash ISA cap, up to £3,000;
   - 335 on their ISA allowance left after their S&S ISA contributions, up to £7,297.19;
   - 150 on that and the household's own limit, up to £7,428.38.
   D146 and `STEP4-SHAPES.md` say it. `DECISIONS-PENDING.md` puts 485 (335 + 150), up to £7,428.38, which is the same.
3. **Finding 3, answered.** D146 (3) names step 8's registered read for couples inside the guard.
4. **Finding 4, answered.** D146 (4) says what holds the identity. Class W of `COUPLES-ANY.md` makes the path-for-path
   identity before its read.
5. **Finding 5, answered.**
   - (b3) gives the page a schedule and a merged subscription; (b4) is the year-0 couple.
   - `solvedHere` holds the page's figures to `refHousehold`, the source's cut and assembly at the app's settings.
   - 'notake' is wired through App.jsx to the guard (couplesSwitch.js l.173) and is in the harness's two lists.
   - Whether it passes is B1's gate's to show.
6. **Finding 6, answered** (household.js l.185-190).
   - It is wherever either account of a wrapper carries a schedule.
   - Check 2: 0 of 1,500 wrapper-years apart; under 'firstsched' 230 of 500 apart.
   - No plan on any panel or the library carries a schedule.
- **The parse fault.** The label is escaped, and `parse-all` compiles all 919 files of its set.
- **The figures.** D146's figures are the records', in backticks.

## Findings

1. **MINOR. The fix also moves the app's route off step 8's registered arm, on units D146 does not name.**
   - The scan's step 8 panel: "6 plans short in 26 years, £157348 not landed". They are S273-gap8, S351F-gap8 and
     S355F-gap8, each both ways round (`results-household-landing-scan.txt`).
   - Two of them are among D136's identity units, then the tested arm's to the bit: "S273-gap8: IDENTICAL", "S351F-gap8:
     IDENTICAL" (`results-household-port-identity.txt`, 15 of 15). That identity no longer holds on them.
   - D146 gives the effect on couples-open's ten units alone (`household-landing-effect.mjs` reads
     `results/couples-open-pilot`, l.59). It says `household-route.test.mjs` holds the app's route to step 8's arm. It does
     so only on S025-own and S351F-90, neither of them reached.
   - So for D136's class (inside the guard, on the household route since step 8's registered read), the shipped route now
     differs from the registered arm on 3 of its 40 units, and nothing measures what that does.
     - On couples-open's ten, shortfalls of the same order (S199-G8: £41,893 landed of £86,283) moved no path and moved
       spending by under `0.05%`, so a material effect is unlikely.
     - But it is not shown, and the arrays to show it exist: `results/household-hsp-pilot/S273-gap8.json.gz` and
       `S351F-gap8.json.gz`. S355F-gap8 is not a pilot unit.
   - Fix: D146 names the three units and the two identity units. Then either:
     - run the effect script's method on step 8's pilot for S273-gap8 and S351F-gap8, its control held to HSPA's arrays,
       with the figures in D146; or
     - say the effect there is unmeasured.
2. **MINOR. `results-household-shapes.txt` no longer carries the plants that section 5 cites it for.**
   - The committed record ended with the three plant lines (`git show HEAD:research/solver/results-household-shapes.txt`).
     The fix round's rewrite ends at "ALL PASS: 4 checks"; the diff deletes them.
   - STATE.md section 5 still reads: "`household-shapes.test.mjs` ALL PASS, its plants each failing exactly its checks,
     `results-household-shapes.txt`".
   - The claim holds on this code (my `--planted` run, above). The record does not show it.
   - Fix: write the record as before, the plain run followed by `--planted`.
3. **MINOR. `parse-all.test.mjs` compiles less than D146 says, and its check 1 is never shown failing.**
   - D146: "every test, research script and harness compiled". The test reads only the top level of research/tests and
     research/solver (.mjs) and of research/ui-harnesses and its lib (.cjs) (l.24-25).
   - Left out, among others: research/solver/n7 (7 scripts), research/qa, research/audit, the policy-study scripts other
     than `scenarios.mjs`, and the review folders' scripts.
   - The incident's own class is covered. Every test file sits at the top of research/tests, and every research file a
     test loads from elsewhere is loaded by a fast-tier test (`scenarios.mjs`; `research/oracle/one-pot.mjs` by
     `known-answer.test.mjs`). The files only full-tier tests load outside the set lie outside research/:
     `scripts/apply-edits.mjs`, `scripts/extract-copy.mjs` (`safety.test.mjs`) and `vite-plugin-solver-code.js`
     (`cache-key.test.mjs`).
   - Check 2's plant calls `parses` on a scratch file (l.34). Check 1 scans the folders through `parsesAsync`, so check 1
     itself never meets the planted fault (CHECKLIST 5). The command is the same, so the gap is small.
   - Fix: either compile what the words say (every tracked .mjs and .cjs outside the archive) or narrow the words. Plant
     the fault through check 1's own scan, for example the scan run over a scratch folder holding the planted file.
