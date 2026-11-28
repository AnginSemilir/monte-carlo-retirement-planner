# Review, second look: how an employee pays into their pension (D154 (3)), the fix round

Subject: D154 (3)'s fix round, 9d27c455 on claude/fervent-goodall-e2mrnf (the commit after b75232c2), against my first
verdict, `reviews/2026-11-27-pension-route.md` (FAIL: one BLOCKING, six MINOR): the one fix round after a FAIL (D81 (F)).
The commit's COUPLES-APART read and D155's record are not reviewed here. The main tree was being edited for D155 while I
read (`git status`: `src/App.jsx`, `PlannerCards.jsx`, `PlannerPlan.jsx`, `PlannerStart.jsx` and `Shell.jsx` modified,
uncommitted), so everything below ran on `git archive` copies of the commits named, never on the main tree.

## What I read

- **The ruling and the rules:** the brief (the agent's account of each answer); STATE.md fe43cbb7cc4e (D154, D155, and
  section 5's record of the fix round, l.292); CHECKLIST.md 45e387294c8d; `research/tests/run-all.mjs` (the tiers).
- **The fix round** (`git diff b75232c2 9d27c455`): `src/App.jsx` b402b36756da (the plants, `reliefTaxOnlyOf` and
  `strategyRelief`, l.170-196; the warning, l.1852; the engine's taxable pay, l.2417; `allocateBudget`, l.3776-3806;
  `accumulationOutlay`, l.3874; `accumulationEnv`, l.4073; Relief-First's words, l.4262; the strategy panel, l.8392; the
  select, l.13428-13431); `src/solver/household.js` aa0377cf3845 (l.255, l.295, the comment at l.336-340); `src/Docs.jsx`
  3883903b2679 (l.189-195); `src/simplePlan.js` e2ce0df17fbf (l.238-241); `research/tests/pension-route.test.mjs`
  2ffcd4cdf8e6 (whole); `research/solver/results-pension-route.txt` 556d4b582e3b; the hand copies in
  `research/tests/household.test.mjs` abbc010e6075 (l.140-141), `household-pricing.test.mjs` f8dc57a2ec0b (l.82-83) and
  `save-split.test.mjs` caec96d242d4 (l.164-165); `research/solver/household.mjs` b628976cfff4 (its note, l.42-45; its one
  price, l.172); `research/solver/e3pcls-pin.json` 451ed08e38db; `research/solver/save-k.mjs` 3494906dbca9.
- **What the answers rest on, unchanged by the fix round:** App.jsx's pricing functions (l.1447-1545), `taxParams`'
  `personTax` (l.1361-1376), `stepYear`'s taxable pay and working take-home (l.2410-2485), `saveSplitRoutes`
  (l.3669-3710); `src/solver/fast.js` aa1094431d2e (l.265-266); `src/solver/model.js` 67c0b09588e5 (l.58, 315, 343);
  `src/solverApp.js` a822d56e2e09 (l.57-60, a couple's solves keep the savings split off); `src/solverKey.js` a448cf257400.
- **The scripts the results file's pattern search came from**, in the session's scratchpad: `mut2-run.py`, `mut2-sites.py`,
  `capsweep.mjs`, `route-results.sh`.

## What I ran

On `git archive` copies of 9d27c455, 014ee7cf (the code before b75232c2) and 574cb57 (`save-split.test.mjs`'s base), each
engine rebuilt by `research/build-engine.py`; my scripts are in the session scratchpad's `rev-route2/tools/`.
- `pension-route.test.mjs` on 9d27c455: ALL PASS, 10 of 10, its output the results file's first block byte for byte.
  `--plants`: `PLANTS: all 8 fail exactly their own checks` ('ignored' 2, 3, 5, 6, 7, 8, 9, 10; 'unsure' 6, 7; 'allnet' 1,
  2, 3, 5, 7, 8, 9, 10; 'nowarn' 7; 'classic' 9; 'enginepay' 10; 'modelignored' 4, 10; 'houseroute' 8).
- Check 1's pin: the fix round's test file `--digest` on 014ee7cf gives
  `{"engine":"eff3f291c4944916","savers":"1ece139e903a41a2","saverCount":3,"households":"b799121b3014df54","householdCount":210}`,
  the test's `PINNED` exactly (`digests()` is unchanged by the fix round), and check 1 passes on 9d27c455.
- What check 1 does not digest, the classic strategies, on every library plan as entered, 014ee7cf against 9d27c455
  (`classic-identity.mjs --tournament`): `allocateBudget` at four budgets with and without a floor, `accumulationOutlay` at
  the plan's escalation and at 2%, `accumulationEnv`, and `buildTournament`'s budget, baseline outlay and every strategy's
  name, words, relief and transfer: `5040 figures compared, 0 differ` over 420 plans.
- The pattern search again, from my own grep of every read of the route in `src` (`mut.py`): each change alone on a copy of
  9d27c455, the engine rebuilt where App.jsx moves, the test run whole; the copy restored after each.

  | the change, alone | checks failing |
  |---|---|
  | the route's definition (App.jsx l.1831) put back to the NIC class | 2, 3, 5, 6, 7, 8, 9, 10 |
  | net pay read as salary sacrifice (l.191) | 2, 3, 5, 6, 7, 8, 9, 10 |
  | not sure read as salary sacrifice (l.192) | 6, 7 |
  | each read put back to the NIC class: the warning (l.1852) | 7 |
  | the engine's taxable pay (l.2417) | 10 |
  | the engine's working take-home (l.2478) | 3, 4, 8 |
  | `saveSplitRoutes` (l.3682) | 5 |
  | `strategyRelief`'s definition (l.196) | 9 |
  | `allocateBudget`'s earnings cap (l.3778) | none (equivalent: below) |
  | `allocateBudget`'s gross-up, net cost and floor (l.3788, 3791, 3802), `accumulationOutlay` (l.3874), `accumulationEnv` (l.4073), Relief-First's words (l.4262), the strategy panel (l.8392) | 9, each |
  | fast.js l.265, l.266 | 10, each |
  | model.js `reliefOf`'s definition (l.58) | 4, 10 |
  | model.js l.315 / l.343 | 10 / 4 |
  | household.js l.255, l.295 | 8, each |
  | the NIC on the pay charged by the route: App.jsx l.2478 / household.js l.255 / model.js l.343 | 3, 4, 8 / 8 / 4 |
  | the pass-through's warning given to every employee (l.1852) | 7 |
  | one way, every person priced as relief-tax-only (`true`): App.jsx l.2417 / l.2478 / l.3682 | 10 / 1, 3, 8 / 1, 5 |
  | the same: `strategyRelief` / household.js l.255 / l.295 | 9 / 1, 8 / 8 |
  | the same: model.js l.343 | none (`solver-model.test.mjs`, full tier: A1 and B1 fail) |
  | the same: fast.js l.265, l.266, model.js l.315 | none (finding 1) |

  The eighteen rows the results file lists agree with mine where they overlap.
- The earnings cap: the agent's `capsweep.mjs`, its first import repointed from the main tree to the copy of 9d27c455,
  against copies with the cap's read and (the control) the gross-up's put back: `4860 cases: 0 differ` and `345 differ`,
  the file's figures. Mine (`capsweep2.mjs`: 288 singles and 192 couples, the partner's answer varied too, the four
  answers, pass-through 0, 50 and 100%, the MPAA, six budgets, three ISA shares, a floor and both balances):
  `34560 cases, 0 differ`; the control `7518 differ`.
- MINOR 5 (iii) as stated (`house-employment.mjs`): on the library's 90 couples where both work and pay into a pension, six
  pairs of answers each, the household plan as built (the first person's answer) against the same plan carrying the
  partner's: at pass-through 0, `540 compared, 0 differ` through the engine (20 paths of seed 99001, as check 1) and
  `8 compared, 0 differ` in the solver's tables at the light settings; at 50%, `194` of `540` differ.
- `reduce-save-k.mjs` from 9d27c455 on `research/solver/results/save-k-7025`: exit 0, `results-save-k.txt` byte for byte.
- On 9d27c455: `household.test.mjs` ALL PASS, 48 checks, (7d) `d3d5295b01b1`; `household-pricing.test.mjs` ALL PASS, 4;
  `save-split.test.mjs --base` (574cb57's copy) ALL PASS, 23; `code-id.mjs` `d3d5295b01b1`; `e3pcls-pin.mjs` MATCHES
  `0648e94bd5312a2d`; `solver-e3pcls.test.mjs 4`: 27 passed.
- `reliefTaxOnlyOf` against b75232c2's inline expression, every answer (the four, an unknown one, blank, undefined, null)
  under no plant and each plant but 'allnet': `48 cases, 0 differ`.
- `simple-drop.mjs` (MINOR 7 (d)): self-employed with net pay, and not sure with self-employed, each give both lines.
- `sac-lockstep.mjs` and `ras.mjs` (findings 1 and 2).
- Not run: the fast and full tiers whole, the browser harnesses.

Verdict: PASS

## What holds

- **BLOCKING 1 is answered.** Every read of the route in `src`, put back to the NIC class alone, fails a check but the
  earnings cap, and the route's definition, both helpers' definitions, net pay and not sure each read as salary sacrifice,
  the NIC on the pay charged by the route in each of the three take-homes and the warning given to every employee are
  caught too (the table). The earnings cap is an equivalent change, as the file argues: `capOf` and its mutant differ only
  for a net-pay or not-sure employee, whose route factor is 1, so the mutant raises the cap from `min(allowance, salary)` to
  `min(allowance, salary x (1 + erNic x erPass))`; `grossUpNet` bounds the credit at `salary x 1` (its bisection runs on
  the sacrifice in [0, salary]) and `grossUpNetIncremental` bounds the total at `salary x 1`, so the raised cap never binds;
  `penGross` stays at or below `min(allowance, salary)` under both, and where the original returns early on `cap <= 0` the
  mutant reaches `maxTotal <= base` and returns 0 alike. Both sweeps agree. Checks 8, 9 and 10 do what their headers say:
  the household plan's take-home the engine's year by year under both routes (8 years, 8 apart) and the 'pensionsPAown'
  partner's own pay the self-employed's (25 years, 3 apart from the sacrificer's); the classic strategies for a net-pay
  employee the self-employed's and apart from the sacrificer's with the pass-through set; the engine's taxable pay by hand
  under both routes, and the exact model and the forward run (its savings split copies' too) on the net-pay plan.
- **The MINORs.** 2: 'allnet' fails check 1, and 'nowarn' check 7 alone. 3: `save-k.mjs` is the blob it was before
  b75232c2, and K's read reprints byte for byte. 4: the three hand copies price the contribution by the route and the pay's
  NIC by its class; the research arm's note says what it does. 5: (i) and (iii) are stated, and (iii) holds as stated (my
  run above); (ii) is stated, with a direction it does not have (finding 2). 6: the rule is in the record. 7: (a) to (d) as
  the brief says.
- **No plan as entered moves:** check 1 on the pin taken on the code before, and the classic strategies, which check 1 does
  not digest, the same on all 420 library plans. The refactored route answers as before for every answer; the new plants
  are read only where named and set by the test alone.
- **For D155 (context, not a finding):** check 9's last clause reads the strategy panel's line
  `const selfEmployedOnly = ctx.owners.length > 0 && ctx.owners.every(strategyRelief);` from App.jsx's source, and the
  classic planner's retirement removes that page, so the change that retires it must take the clause (and the pattern
  search's 'panel-words' row) with it, or `pension-route.test.mjs` fails in the full tier.

## Findings

1. **MINOR. The forward run's and the exact model's taxable pay are held to the route in one direction only.** Each site
   is caught when it prices a net-pay employee as a sacrificer, not when it prices a sacrificer as net pay: with
   `o.reliefTaxOnly` at fast.js l.265 and l.266, or `reliefOf(o)` at model.js l.315, replaced by `true`, the test is ALL
   PASS, 10 of 10 (the table's last row). At Config's pass-through of nought the two flags give the same taxable pay
   (`taxablePayOf` divides by `passThroughFactor`, 1 for both), so only a run with the pass-through set can see it, and none
   does: check 10 prepares the exact model and compiles the forward run on the net-pay plan alone (`pension-route.test.mjs`
   l.325 and 331; the sacrificer's plan, built at l.312, is checked in the engine by hand only), and no other file in
   `research/tests` sets `employerNicPassThrough` on a solve (`git grep`: only `pension-route` and `selfemp`'s unit prices).
   The same change at the exact model's take-home (model.js l.343) passes this test too, but `solver-model.test.mjs` fails
   on it (A1 and B1, `worst £9868.64 at S315`), so that site is held. The code is right as it stands (`sac-lockstep.mjs`
   on 9d27c455, the sacrificer's plan with the pass-through at 50%: the exact model `£0.00e+0` from the engine, the forward
   run's taxable pay `£0.00e+0` from the engine's over 5 working years); with fast.js l.265 and model.js l.315 set to
   `true`, the same comparisons part by `£785` and `£970`. Run check 10's exact-model and forward-run comparisons on the
   sacrificer's plan as well, each of the three changes shown failing.

2. **MINOR. "Cautious for a low earner" says more than the pricing does.** Docs.jsx l.189 ("the 20% that relief at source
   still adds is not counted, which leaves a low earner's plan cautious"), `reliefTaxOnlyOf`'s comment (App.jsx l.183-185)
   and STATE.md l.292 give approximation (ii) a direction. The contribution's own price is cautious where the pay less the
   contribution falls below the personal allowance. But pricing relief at source as net pay also takes the contribution
   off the pay that the personal allowance and the starting rate for savings are set against, where relief at source
   leaves that pay whole and widens the basic and higher rate limits instead; so a low earner's savings interest gets a 0%
   band relief at source would not give, and the plan can come out optimistic. By the app's own functions (`ras.mjs`:
   `personTax` on the pay less the contribution, against the pay whole with both limits widened by the contribution and
   20% added at source), the app less the law, a year, at salary, gross contribution and interest of: £15,000, £5,000,
   £8,000: the contribution's net cost `+£514.00`, the interest's tax `-£886.00`, together `-£372.00`; £17,000, £3,000,
   £4,000 (the pay less the contribution above the allowance): `£0.00`, `-£486.00`, `-£486.00`; £16,000, £4,000, £6,000:
   `+£114.00`, `-£686.00`, `-£572.00`; £13,000, £3,000, £5,000: `+£514.00`, `£0.00`, `+£514.00`; at £30,000 and £60,000,
   `£0.00`. The interest's part is not new at Config's default (an employee paying by relief at source was priced before
   D154 (3) on the same taxable pay, as a sacrificer, and the self-employed are priced so), so nothing is to be built; the
   words and the record should give both parts, or no direction.

3. **MINOR. The pattern search's figures cannot be reprinted from the repository (CHECKLIST 6).** The results file's block
   from "THE PATTERN SEARCH" on, which the test's header (l.41-44) and STATE.md l.292 cite, was written by scripts in the
   session's scratchpad (`route-results.sh` assembling `mut2-run.py` and `mut2-sites.py`'s output and `capsweep.mjs`'s two
   lines), and `capsweep.mjs` imports its reference engine from the main tree, which moves (it was being edited for D155 as
   I read). Every row and both sweep figures reproduce on a fixed copy of 9d27c455, so nothing moves on it. Commit the two
   scripts beside the results, the sweep reading the tree it runs in, or say in the file where the block came from.
