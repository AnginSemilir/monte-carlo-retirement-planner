# Review of an engine change that adds a user input: how an employee pays into their pension (D154 (3))

Subject: D154 (3), way (A) of the entry DECISIONS-PENDING.md decided by D154 ("does the app ask how an employee pays into
their pension"), read as the working tree against 014ee7cf on claude/fervent-goodall-e2mrnf (`git diff HEAD` and the new
`research/tests/pension-route.test.mjs`). The agent was committing this tree while I read (`git commit -F
.../scratchpad/route-msg.txt`, its pre-commit hook running the fast tier); every blob of the change below is the one I read
and ran. The employment type's four answers ('employed', salary sacrifice, the default; 'employed-net'; 'employed-unsure',
priced as net pay; 'self-employed'), each owner's `reliefTaxOnly`, read by every price of a pension contribution in the engine,
the solver's exact model, the forward run, the household plan and the classic strategies; the warning, the select and its
lines, the Docs bullet, the Simple page's dropped line; the test and its plants. The working tree's STATE.md is not
reviewed, as asked: the ruling is HEAD's.

## What I read

- **The ruling and the rules:** STATE.md at HEAD d30879c91b4c (D154 (1) and (3); D137 (4), D138 for the hold and the cap;
  section 6, action 3); DECISIONS-PENDING.md 65c37e92318d (the top block; the entry decided by D154, way (A), l.396-420; the
  pass-through entry of 22 Nov, l.335-355); CHECKLIST.md 45e387294c8d.
- **The change (working tree, against HEAD):** `src/App.jsx` 6eeba8887fe5 (503071f15217); `src/solver/model.js` 67c0b09588e5
  (ed0897d3c30b); `src/solver/fast.js` aa1094431d2e (a5db9f0d30f6); `src/solver/household.js` 1fb47089a2f7 (94aca9051d20);
  `src/simplePlan.js` 23eed862017b (f97a1b7c94bd); `src/Docs.jsx` 390c0c44ffe1 (0e6a42d43440);
  `research/tests/pension-route.test.mjs` be74ecc3c96c (new); `research/tests/household.test.mjs` fb42491832ae
  (07667e078ed4); `research/solver/save-k.mjs` bfce022568b3 (3494906dbca9); `research/solver/e3pcls-pin.json` d2d6419b1ff1;
  `research/solver/results-pension-route.txt` b974cce7478a; the commit message (`route-msg.txt` in the session's scratchpad).
- **What the claims rest on:** in `src/App.jsx`, `nicFor`, `passThroughFactor`, `calculateMarginalRelief`,
  `netCostOfPensionContrib`, `taxablePayOf`, `grossUpNet`, `grossUpNetIncremental` (l.1390-1525), `pensionRelief`
  (l.4010-4024), `buildContext`'s owners and warnings (l.1800-1832), `stepYear` step 4 and the working take-home
  (l.2385-2460), `saveSplitRoutes` (l.3648-3705), `allocateBudget` (l.3730-3800), `accumulationOutlay` (l.3853),
  `accumulationEnv` (l.4052), Relief-First's words (l.4241), the strategy card's words (l.8370, l.8597, l.8740), the Config
  pass-through hint (l.12827), the employment select (l.13396-13415); `src/solver/solve.js` a428ab8146d8 (`saveOn`, the ISA
  first held back, l.2969-2995); `src/solver/couple.js` (l.132); `src/coupleOrder.js` 3cbbb912a4c8 (`PAIRED`);
  `src/solverKey.js` a448cf257400; `research/solver/audit-phase4.mjs` 5ace83959b96 (`inputsHash`, l.74-82);
  `research/solver/reduce-save-k.mjs` 158c7c191c12 (its gate); `research/solver/household.mjs` e16434c65610 (l.168);
  `research/tests/household.test.mjs` (l.139), `household-pricing.test.mjs` 0cf73d49dd3a (l.82), `save-split.test.mjs`
  142aff26afee (l.164), `selfemp.test.mjs` ed7d5d8bc3d8; `research/policy-study/scenarios.mjs` (l.85, l.155-156).
- **Greps:** `selfEmployed|reliefTaxOnly|employment` over `src`, `research/solver` and `research/tests`; every call of the
  pricing functions in `src`; every hand-built owner (`selfEmployed\s*:`); every serialisation of an owner or the context.

## What I ran

On a copy of the working tree taken at review time (the blobs above) and on `git archive HEAD` with its engine rebuilt
(`research/build-engine.py`):
- `pension-route.test.mjs`: ALL PASS, 7 of 7; `--plants`: 'ignored' 2, 3, 5, 6; 'unsure' 6; 'modelignored' 4, each its own.
- `pension-route.test.mjs --digest` on HEAD's tree: `{"engine":"eff3f291c4944916","savers":"1ece139e903a41a2","saverCount":3,
  "households":"b799121b3014df54","householdCount":210}`, the test's `PINNED` exactly.
- `code-id.mjs`: 2721e4bb5022 on the change (household.test.mjs (7d)'s new pin), 3fb20e2156f8 on HEAD; `e3pcls-pin.mjs`:
  MATCHES (4bd4e6aef61abf12, 27 Nov 21:34 UK).
- On the change: `selfemp` 26 passed, `salarygrowth` 13, `savings-tax` 28, `engine-hmrc` 33, `bed-sipp` 4, `parse-all` 2, each
  with none failed (`hygiene`'s git-fixture check cannot run outside a git tree; its other nine pass).
- A mutation run (scratchpad `tools/mutate.sh`): each of thirteen places the route is read put back to `selfEmployed`, alone,
  and the test run whole (finding 1); one mutation pricing salary sacrifice as net pay (finding 2).
- `reduce-save-k.mjs` on K's units (`results/save-k-7025`) from both trees (finding 3).
- Not run: the fast tier (the agent's pre-commit hook was running it), the full tier, the browser harnesses.

Verdict: FAIL

## What holds

- **Item 1, the call sites.** Every price of a pension contribution in `src` reads the route: App.jsx l.2396, 2457, 3661,
  3757, 3767, 3770, 3781, 3853, 4052 and the words at l.4241 and 8370; fast.js l.265 and 266; model.js l.315 and 343
  (`reliefOf`); household.js l.253 and 293. No call of a pricing function in `src` is left on its `selfEmployed = false`
  default. The NIC class stays `selfEmployed` at every `calculateUKTaxAndNIC` (App.jsx l.2457, model.js l.343, household.js
  l.253), and the self-employed's labels and warning are unchanged. `solve.js` l.2990's ISA first held back still reads
  `selfEmployed`, which is right: D137 (4)'s reason (the pension figure includes the employer's part, which an ISA first would
  move) holds for a net-pay employee as for a sacrificer. No owner is built by hand outside `buildContext` (the only
  `selfEmployed:` writes outside it are records of a unit, and save-k.mjs's copy for a hash, finding 3); `couple.js` l.132
  passes each person's string to their own plan; the mirror swaps 'employment' (`coupleOrder.js` `PAIRED`).
- **Item 2, the identity.** By construction: `reliefTaxOnly` is `selfEmployed` for every stored value but 'employed-net' and
  'employed-unsure' (App.jsx l.1810; a value the app does not know reads as sacrifice in both, as the select shows it), every
  changed call passes the same boolean for such a plan, nothing serialises an owner or the `E` namespace whole, and the cache
  key reads the plan and the settings (`solverKey.js`), so a plan as entered keys as before but for the build's code part,
  which moves with any code by design. Check 1's digests reproduce on HEAD's tree.
- **Item 3, the price, as the app models a contribution.** Net pay: the take-home cost of a gross contribution c is
  c - (IT(s) - IT(s - c)), Class 1 NIC on the whole pay, the pass-through factor 1; check 2's hand figures are right. Relief at
  source by the same rule is the law's at any pay where s - c stays above the personal allowance (the band extension and the
  basic-rate relief at source together are the deduction's income tax relief). The exceptions are finding 5.
- **Item 4, not sure.** Net pay's net cost of a gross contribution is at least sacrifice's at every pay, with the
  pass-through or without (x - IT(s) + IT(s - x) rises with x, and sacrifice gives up c / (1 + erNic x erPass) and adds the
  NIC relief), so not sure never prices a contribution cheaper than either answer would; its line and the Docs bullet say it
  is priced as net pay, the more cautious.
- **Item 6.** The plants fail exactly their own checks. Speed: the change adds a boolean read where a boolean was read; there
  is no new loop to measure.
- **Item 7.** Nothing in D154 or DECISIONS-PENDING.md is contradicted but the "test of the class" condition (finding 1);
  D154 (1)'s pass-through, stated as it is, is consistent with the new warning, which reads as intended for each answer with
  the pass-through at 0 and 50% (my run).

## Findings

1. **BLOCKING. The test is not a test of the class.** D154 (3) has the change "built with its test of the class", and the
   test's header says every price of a contribution reads the route, the classic strategies, the forward run and the household
   plan among them. Put back to `selfEmployed` one at a time, ten of the thirteen places leave the test ALL PASS; three are
   caught (mutation run, the test run whole each time):

   | the place the route is read | checks failing |
   |---|---|
   | App.jsx l.2396 `stepYear`'s taxable pay | none |
   | App.jsx l.2457 a working partner's take-home | 3, 4 |
   | App.jsx l.3661 `saveSplitRoutes` | 5 |
   | App.jsx l.3757 `allocateBudget`'s earnings cap | none |
   | App.jsx l.3767 `allocateBudget`'s credit | none |
   | App.jsx l.3770 `allocateBudget`'s net cost | none |
   | App.jsx l.3853 `accumulationOutlay` | none |
   | App.jsx l.4052 `accumulationEnv` | none |
   | fast.js l.265 the forward run's pay | none |
   | model.js l.315 the exact model's taxable pay | none |
   | model.js l.343 the exact model's take-home | 4 |
   | household.js l.253 the household plan's later retiree's take-home | none |
   | household.js l.293 the 'pensionsPAown' form's pay | none |

   By reading, App.jsx l.3781 (the pension floor), fast.js l.266 and the words at l.4241 and 8370 are reached by no check
   either: the test calls none of `buildTournament`, `allocateBudget`, `accumulationOutlay` or `accumulationEnv`, and no
   household plan with a net-pay person. Five of the ten move a net-pay employee's figures at the default settings:
   - household.js l.253, the take-home the household plan gives the later retiree, which the household table is solved on for
     every couple the new planner solves in which one person still works after the other retires (D136, D146, D152): on
     S181, check 3's couple with the partner on net pay, `£195.84` to `£240.86` a year less than the sacrificer's in each of
     its 8 years, and equal to the engine's working take-home (`£16,177.20`, `£16,081.73`, `£15,983.39` in its first
     three). Put back, the table is solved on the sacrificer's take-home while the engine runs net pay's, and no check fails.
   - `allocateBudget` (l.3767, 3770), `accumulationOutlay` (l.3853), `accumulationEnv` (l.4052), the classic planner's
     strategies (kept, D150 (3)): on S180, check 2's single (`£34,000`), `£10,000` net at 30% to the ISA buys `£8,750.00` of
     gross pension for a net-pay employee, the self-employed's figure, against `£9,722.22` for a sacrificer;
     `accumulationOutlay` `£28,159.66` against `£26,426.75`.
   The other five (l.2396, 3757, fast.js l.265/266, model.js l.315, household.js l.293) move figures only where Config's
   pass-through is set; check 2 sets it but prices by hand with the flag passed in, and checks 3 to 6 run with it at nought,
   so check 4's "the working single £0.00e+0" holds whatever the route (at nought a working single's engine run does not depend
   on it). Wanted before the claim stands, each with a plant failing exactly its check, then the table above run again:
   (a) the household plan's later retiree's take-home for a net-pay partner equal to the engine's working take-home, year by
   year (household.test.mjs's take-home check, run on such a partner with its mirror reading the route, is one way);
   (b) the classic strategies for a net-pay employee the same plan's with the person self-employed and apart from salary
   sacrifice's (`allocateBudget`, `accumulationOutlay`, `accumulationEnv`, Relief-First's relief and words), as check 5 does
   for the split and `selfemp.test.mjs` OUT-1 and TOUR-1 to TOUR-3 do for the self-employed;
   (c) with the pass-through set, the engine, the exact model and the forward run in step for a net-pay employee (the taxable
   pay the salary less the whole contribution).

2. **MINOR. Check 1 has no plant (CHECKLIST 5).** None of the three plants can fail it. It can fail: salary sacrifice priced
   as net pay (App.jsx l.1810 with `|| emp === 'employed'`) moves all three digests
   (`{"engine":"6ce1e59cd71a4b96","savers":"e50b2ba3eaa12a33","households":"0beaa2ed4270bdf3"}`; FAILED: 3 passed, 4 failed).
   Make it a plant. The new warning (App.jsx l.1831) is read by no check either.

3. **MINOR. The edit to `save-k.mjs` changes nothing it hashes and stops K's read from reproducing.** `inputsHash`
   (audit-phase4.mjs l.78-82) reads `o.selfEmployed` and not `reliefTaxOnly`, and `save-k.mjs` runs on a83cd90b's tree, whose
   owners carry no `reliefTaxOnly`, so its set-back hash is the same with or without the field. But `kStamp()` hashes
   `save-k.mjs` (`K_FILES`), so the stamp moves from 1f8c8545bc80 (every unit's) to bf99639919f7, and
   `node research/solver/reduce-save-k.mjs research/solver/results/save-k-7025` now exits 3: "THE GATE: REFUSED ... S180: run
   on this test's files at 1f8c8545bc80, not on them as they are (bf99639919f7)", for each of the 31 units. On HEAD's tree the
   same command exits 0 and reprints `results-save-k.txt` byte for byte, the read D138 rests on. The commit message's "no
   figure moves" is true; the read's reproduction is what is lost. Revert the edit.

4. **MINOR. Hand copies of the engine's pricing still price by the NIC class.** `household.test.mjs` l.139 ("the engine's
   own sum": `netCostOfPensionContrib(pc, pay, ctx.P, o.selfEmployed)`), `household-pricing.test.mjs` l.82 (`taxablePayOf(...,
   o.selfEmployed)`, "as the engine takes it") and `save-split.test.mjs` l.164 (`handNet`'s `se = !!o.selfEmployed`) pass only
   because no library plan is on net pay (`scenarios.mjs` l.85, 155-156); each would read a correct net-pay plan as a fault.
   The research arm `research/solver/household.mjs` l.168 is the same (left as read, D146 (1)): the app's household route and
   it would part on a net-pay later retiree. Bring the copies to the route (asking by name for any protected file) and give
   `household.mjs` a dated note, as D146 did.

5. **MINOR. The approximations named for this change are not stated in it.** I found none of the three in the words, Docs,
   the code's comments or the test. (i) The pension figure, the employer's part included, is priced as the employee's own
   net-pay contribution: deducted whole from the taxable pay, relieved at their marginal rate, and its whole net cost taken
   from a working partner's take-home. (ii) Relief at source's basic-rate relief is not given where the salary less the
   contribution falls below the personal allowance, while the app's own `pensionRelief` (App.jsx l.4010-4024) gives it on every
   one-off personal contribution: by the app's functions, `£12,000` salary and `£3,000` gross, relief `£0.00` as priced
   against the `£600` at source that rule gives; `£15,000` and `£5,000`, `£486.00` against `£1,000`. It reaches more than a
   non-taxpayer. (iii) The household plan's one person carries the first person's employment (household.js l.334); by reading,
   it reaches the household's figures only through the pass-through factor in `taxablePayOf` in the years both work, so only
   where Config's pass-through is set and the two people's answers differ. Say each in the D-line, (ii) in Docs beside the new
   bullet, (iii) in a comment at household.js l.334.

6. **MINOR. The fair test's inputs hash does not see the route.** `inputsHash` (audit-phase4.mjs l.81), which the audits
   import to hold a unit's arms to one plan, hashes `o.selfEmployed` and not the answer, so two arms on one plan that differ
   only in 'employed' against 'employed-net' share an inputs hash. No run is affected now (every library plan and panel unit
   is 'employed' or 'self-employed'). A run that puts a unit on net pay or not sure must record the answer (its settings line,
   or its own inputs), or the hash take it: audit-phase4.mjs is a registered audit, and moving it moves every stamp that
   imports it, the class of finding 3.

7. **MINOR. Words a user sees.** (a) Docs.jsx l.190: "That is 40% relief for a higher-rate trader against 42% for an employee,
   and 20% against 28% in the basic band" is now true of a sacrificer only (a net-pay employee gets 40% and 20%, check 2), and
   l.195's list ("salary-sacrifice relief including any employer NIC pass-through, and relief at source for the
   self-employed") leaves an employee's net pay or relief at source out. (b) The new bullet's "salary sacrifice, the default,
   saves both": sacrifice saves the employee's NIC; the employer's NIC reaches the pension only where Config's pass-through is
   set (default nought; its own hint at l.12827 calls it a share of the employer's NIC saving added to a salary-sacrifice
   contribution). (c) The partner's select reads "paying into my pension" and "how I
   pay in" under "Employment type (Partner)". (d) simplePlan.js l.240's line is an `else if` after the self-employed line, so
   where one person is self-employed and the other on net pay or not sure, that answer is lost on the round trip
   (`toFullPlan` writes no employment, `normalizePlan`'s default 'employed') with no line saying so.
