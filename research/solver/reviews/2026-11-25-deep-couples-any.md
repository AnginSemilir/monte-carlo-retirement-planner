# Deep review after a confirmatory read: every couple on the solver, the registered test (`registrations/couples-any.md`, seed 7027), read 25 Nov

Subject: what the registered read says together with the records beside it. The read is `results-couples-any-registered.txt`:
W, R, L and P pass, and M1 names S041-Rp1t-Y75 and S041-Ri1s-Y75. The write-up is `reports/2026-11-25-couples-any-read.md`
(dc4814d8). The reviewer at the read gave FAIL, one BLOCKING (the write-up's "pays for it with a little less spending") and
three MINOR (`reviews/2026-11-25-read-couples-any.md`), answered in one fix round (2571ff26), then PASS with one MINOR
answered (`-2.md`, 7c8ffb15). The write-up now says only that the two names spend less on the paths both keep, and that the
read does not show why. It recommends accepting "both units' shortfalls, as D143 accepted S037's and D134 S273-90's".

Read:
- STATE.md whole and CHECKLIST.md; `COUPLES-ANY.md` with amendments 1 and 2; `registrations/couples-any.md`.
- The registered read and its records: `results-couples-any-registered.txt`, `-registered-beside.txt`, `-registered-mpaa.txt`,
  `-registered-port-identity.txt`, `-registered-panel.txt`, `-sizing.txt`; the write-up before and after its fix round; both
  looks of the review at the read.
- The dress rehearsal: `results-couples-any.txt`, `-beside.txt`, `-tax-trace.txt`; its write-up and both reviews.
- The household line's earlier reads: `results-couples-open.txt` with `reviews/2026-11-22-deep-couples-open.md`;
  `results-household-hsp.txt` with `reviews/2026-11-20-deep-household-hsp.md`; `results-couples-trade.txt`;
  `results-pricing-fix.txt`; `results-household-remedy.txt`.
- The code: `audit-couples-any.mjs` (`solveRoute`, `mpaaOf`); `couples-any-panel.mjs` (`unitPlan`, `anySolverPlanOf`);
  `audit-phase4.mjs` `solverPlanOf`; `select-phase4.mjs` `armA`; `src/solver/household.js` (`householdPlanFor`, `tierMapOf`,
  `heldOf`, `perOwnerOf`, `chooseHouseholdSingle`, `pensionsShare`); `src/solverCouple.js` (`householdPlan`, `householdCut`,
  `householdSolved`); `src/solverStrategy.js` `solvedContext`; `src/solverSettings.js` (`prepareForSolve`, `lockedPlan`,
  `appPlan`); `src/App.jsx` (`buildContext`'s ladders, the year's draw for a couple, `resolveMpaa`, `mpaaAppliesAtYear`,
  `wrapperHeadroomAtYear`, `salaryAtYear`); `src/solver/solve.js` (`solvePlanAuto`, `solvePlan`).

Ran (no solve, path or batch; one node process at a time, under `nice`):
- the registered run's 136 stored unit files (seed 7027, read), the pilot's 136 (seed 7002, read) and the rehearsal's 144
  (seed 7002, read), each decoded with the reducer's own `loadDir`;
- the plans as `readAnyPanel` builds them, read only.

The scripts and their outputs are in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/deep-ca/`
(`dr-plans`, `dr-tenths`, `dr-pair`, `dr-acct`, `dr-kindacct`, `dr-worst`, `dr-rgrad`, `dr-lost`). Every figure below that is
not in a results file comes from them. **They are a post hoc look at runs already read: a lead, not a result.**
- **A tenth** or **the worst fifth** means a unit's paths ranked by APP's end pot, a fixed rule's outcome, so it ranks the
  markets.
- **25/75 against 60/40** means a kind's Y75 unit against its 'own' unit on the same paths. A couple's units share one seed and
  one horizon, so path i is the same market in each.
  - Spending is each arm's lifetime spending as a share of its own unit's target, on the paths all four (two arms, two
    holdings) keep.
  - Tax and the pot are over all paths.

## Summary

- **The passes stand.**
  - D34 now has its registered power, and no unit comes near its threshold.
  - The classes' gains are the pilot's. Kind by kind they keep the rehearsal's order.
- **M1's two names are not survival bought with spending.**
  - On the paths both arms keep, ROUTE spends more than APP in the 2nd to 5th tenths of markets, where every saved path
    lies. It spends less from the 6th or 7th tenth up.
  - In the worst fifth its end pot and spending together come to `8.7%` and `6.5%` of opening wealth more than APP's. On
    S037's names the figure was `-0.4%` to `+5.2%`, the pot being the spending given up.
- **Each name is two things.**
  - The app's rules do better at 25/75: arm A moves to ISA First, which pays `£123` and `£77` a year of tax.
  - ROUTE loses real money at 25/75. On every one of S041's 14 kinds it pays more tax at 25/75 than at 60/40 (`+£164` to
    `+£702` a year, mean `+£440`) and spends less (mean `-1.06` points of target). In each tenth of markets the two move by
    about the same amount.
  - Where arm A picks the same rule at both holdings, the app's rules pay `-£59` to `+£84` a year more. The pilot's seed
    gives ROUTE's figures again (`-1.08` points, `+£437`).
- **The leading cause:** the household table taxes the couple as one person who is not them at uneven holdings (k times one
  person's allowance and bands, k = 1.333 at 25/75). It chooses draws that cost the couple tax the app's rules do not pay.
- **The one test:** S041's 28 units on seed 7002, with APP, ROUTE, PA2 (the allowance two people's) and SPLIT (the pensions'
  split), and FIX beside.
- **Elsewhere:**
  - R's gain falls with the distance apart by design.
  - L's stricter limit binds both people, and its cost is unmeasured.
  - The MPAA ages come from two resolves of the app's rules, neither ROUTE's own. They move no money on these units.

## 1. What the result says, and what it does not

It says:
- **Each class beats the app's rules, with power.**
  - Pooled survival, by path:
    - W `+12.206` (`+11.927` to `+12.484`);
    - R `+10.600` (`+10.381` to `+10.818`);
    - L `+12.237`;
    - P `+11.963`.
  - Spending on the paths both keep is `+4.41%` to `+6.04%`.
  - D34's statistic is at least `1,459` paths below its threshold on every unit. At `26,000` paths it flags a true one-point
    loss `0.928` to `0.999` of the time (`results-couples-any-registered-beside.txt`).
  - W's identity is 24 of 24 IDENTICAL.
- **The gains are the pilot's.** On seed 7002 the pilot gave W `+11.97`, R `+10.31`, L `+11.97` and P `+11.90`. The held-out
  seed did not move them.
- **Kind by kind it agrees with the rehearsal (question 1).**
  - Every kind gains `0.3` to `2.2` points more than in the rehearsal, least on the ISA two and three apart, and spends `0.4`
    to `2.8` points less on the kept paths. Examples: W0 `+12.95` against `+11.79`; Rp1s `+12.19` against `+11.00`; Ri3t
    `+8.56` against `+8.10`; P `+11.96` against `+9.73`.
  - The order is the same: W0, L and Rp1 highest; the ISA apart below the pension apart; each falling with the distance.
  - The difference is the couples, as the pilot shows. The rehearsal had S273 (`£2.4m`, spending `+10%` to `+14%`) and the
    younger cohort; this read has S041 (`+0.1%` to `+4.7%`) and S123.
  - It differs in two places.
    - M1 names two S041 units and named none in the rehearsal. Section 2 takes this up.
    - On the ISA two and three profiles apart, more paths are lost: `24` to `30` a unit of `26,000`, against `0.6` to `2.5`
      of `4,000`, two to six times the rate. Most are S281's.
- **R by its parts (question 3).**
  - The gain falls with the distance, as in the rehearsal: one profile apart `+11.687`, two `+10.554`, three `+9.558`.
  - By kind, over the four couples:
    - the pension apart: Rp1 `+12.09`, Rp2 `+11.39`, Rp3 `+10.63`;
    - the ISA apart: Ri1 `+11.29`, Ri2 `+9.72`, Ri3 `+8.49`;
    - paths lost a unit: Ri2 `24.1`, Ri3 `28.8`; Rp `0.4` to `2.8`.
  - The design explains the sign.
    - The household plan holds the wrapper at the more cautious of the two risks (`householdPlanFor`, the shape 'risks').
    - Its table may go riskier only through D16's tier above, which is offered only to a thin plan (`solvePlanAuto`: below
      `85%` without it). ROUTE survives `90%` to `99.7%` here, so most likely none is offered.
    - So in plan year 0 the riskier person's wrapper is switched down by the whole distance, and it stays there
      (`COUPLES-ANY.md` amendment 1).
  - The ISA gives up more return each step than the pension (O60's blend medians):
    - the ISA from Medium/High: `-0.47`, `-1.10` and `-1.89` points a year at one, two and three apart;
    - the pension from High: `-0.32`, `-0.79` and `-1.42`.
  - Two ladder facts in the code add to it (`App.jsx` `buildContext`, the same rule as `fast.js` `tiersFor`).
    - With the ISA three apart, the household's ISA is held at Low Risk. Its ladder is Low Risk and Cash Equivalents only,
      with no tier above even under D16, because a ladder gains the riskier tiers only when all its steps below exist.
    - Wherever either cautious risk is Medium or safer, the household takes two steps down instead of D28's three, in both
      wrappers. That is every R kind but Rp1, and L. For singles D28's third step was worth `+0.554` points.
  - Post hoc, the gain falls mostly through fewer paths saved.
    - On S281's ISA at 60/40: `2,607` saved one apart (Ri1t-own) against `1,409` three apart (Ri3t-own).
    - Lost: `1` against `80`. All 80 lie in APP's 2nd and 3rd tenths and fail in plan year 50 or 51, the plan's last two; 77
      of them end below the minimum pot with no year short. That is step 8's late tail (D134's deep review).
  - The end pots cannot show tiers. In APP's best tenth ROUTE's pot relative to APP's even rises with the distance (Rp
    `0.38` to `0.63`; Ri `0.53` to `0.77`). There ROUTE ends far below APP whatever the distance, which D143's deep review
    read as growth not taken above the estate cap.

It does not say:
- **That M1's two units trade spending for survival (question 2).** Both are S041's (retired, 68 and 65), both at 25/75 and
  both one profile apart: the pension with the partner's the safer, and the ISA with the first person's the safer. The read
  does not show a trade, as the reviewer's BLOCKING found. The records, post hoc, go further: it is not what happens, and the
  shortfalls are not of the kind D143 and D134 accepted.
  - **Where the shortfall is.** On the paths both keep, ROUTE less APP, a year, by tenth (`dr-tenths-S041.txt`):
    - S041-Rp1t-Y75: `+£210`, `+£624`, `+£714`, `+£453` in the 2nd to 5th tenths, then `-£37`, `-£661`, `-£1,239`,
      `-£1,531` and `-£1,526`;
    - S041-Ri1s-Y75: `+£249`, `+£700`, `+£826`, `+£618`, `+£187`, then `-£348`, `-£883`, `-£1,210` and `-£1,222`.
    - Every path saved on either unit lies in the worst two tenths (`2,337` and `1,146`; `2,302` and `845`).
  - **The worst fifth.** ROUTE less APP, a path (`dr-worst-S041.txt`):
    - Rp1t-Y75: spending `+£5,120`, tax `+£13,357`, pot `+£34,115`;
    - Ri1s-Y75: spending `-£1,852`, tax `+£16,683`, pot `+£30,962`.
    - So the pot plus spending found is `8.7%` and `6.5%` of the `£450,000` opening wealth.
    - On S037 that figure was `-0.4%` to `+5.2%`, and the pot was the spending given up (D143's deep review).
  - **So it is not S037's cut, and not S273-90's late cushion.** The shortfall is spending in good markets, where no path is at
    risk.
  - **About half of each name is the app's rules doing better at 25/75** (25/75 against 60/40, points of target, on the paths
    all four keep; `dr-pair-S041.txt`).
    - Rp1t: APP `+1.50`, ROUTE `-1.65`. Arm A's pick moves from Bracket Fill Basic with the lump sum to ISA First, whose tax
      is `£123` a year.
    - Ri1s: APP `+2.14`, ROUTE `-0.15`. Arm A's pick moves to ISA First with the lump sum (tax `£77` a year), at a landed
      target `£800` lower, where APP's pounds spent hardly move (`+£11` a year).
  - **The rest is ROUTE's own loss at 25/75** (section 2). On the two names ROUTE pays `£468` and `£599` a year more tax than
    APP, more than their kept-spending shortfalls of `£361` and `£134` a year.
- **What the limits cost (question 4).** The registration says a pass does not show it, and the reviewer's MINOR 4 asks the
  write-up to say so.
  - Under L, ROUTE holds both pensions at Medium, the stricter of the first person's Medium/High and the partner's Medium,
    with no tier above (`householdPlanFor`, the shape 'limits'). So the first person's pension sits one profile below their
    own ceiling. A couple setting a limit for one person binds the other too, which the D-line should say.
  - Nothing measures ROUTE with the limits against ROUTE without them.
  - One confounded look: at the same landed target, L's ROUTE survival sits with the same couple's Wg and P units, whose
    pensions the household holds at High.
    - S207 at `£41,600`: `96.23%` against `96.21%` and `95.89%`.
    - S281 at `£51,800`: `95.80%` against `95.91%` and `95.72%`.
    - Wg and P change contributions or salaries, and R's own pension gradient points the other way, so this bounds nothing.
- **That the rehearsal's tax pattern recurs (question 5).**
  - The rehearsal's rise was its younger cohort's, the household route putting about `£1m` of cash into the taxable account
    (`results-couples-any-tax-trace.txt`). The registered couples hold little cash and none is of that cohort, so that
    mechanism has little to act on.
  - The rises here are an order smaller in pounds:
    - S185, a working couple whose money is mostly pensions: `+£19,724` to `+£31,855` a path;
    - S041 and S123 at 25/75: up to `+£27,181`.
  - The falls are where the app's rules pay most: S041 at 60/40, where arm A fills the basic band, and S207.
  - The objective has no tax term. It prices tax only as money gone: survival, the cut's cost and the estate term capped at
    four times opening wealth.
    - Where the household table's own tax model is wrong, the objective optimises against the wrong tax. The engine's figures
      carry the real cost, and the table never sees it. Section 2 is that case.
  - The pot falls most on S185 and S197, by `£112,437` to `£138,715` a path capped, while they spend `+3.3%` to `+4.8%` more.
    D116 holds that no harm.
- **Why ROUTE's MPAA ages are earlier (question 6).** Read from the code; the reviewer's MINOR 3 reads the same.
  - **Where the ages come from.** Neither arm's ages are ROUTE's own draws.
    - APP's are `resolveMpaa` on arm A's plan: its withdrawal policy, drawdown strategy and harvest; guardrails on; the
      five-year lookahead; the app's own tier returns.
    - ROUTE's are `resolveMpaa` inside `prepareForSolve`, re-run by `householdPlan` in the cut, on the plan the solver is
      handed, with guardrails off, no lookahead and the tables' blend-median tier returns. That plan keeps its own withdrawal
      policy (Bracket Fill Basic on every unit), drawdown strategy (Phased Drawdown) and harvest, taking arm A's policy name
      only where arm A picked Windfall to ISA, the one policy with a deposit order of its own (`audit-phase4.mjs`
      `solverPlanOf` l.137 to 141; the reviewer's second look).
    - Both are the first year of taxable pension income on one expected path of a fixed rule.
    - The second look's tally: the ages differ only where the two resolutions run different withdrawal policies (all 62;
      49 such units agree, and all 25 run on one policy agree). That is a co-occurrence.
    - Why the solver's plan reaches that year two years sooner on S207, S281 and the Wc units is not shown here. It needs
      the expected path, which this review did not run.
  - **What the ages cost here: nothing.**
    - The engine applies an MPAA age only to the room for a dated deposit, a staged tranche and the research splits
      (`wrapperHeadroomAtYear`, `saveSplitRoutes`). It does not cap a regular contribution; it only warns (`App.jsx`
      l.1816).
    - The only dated deposit on any of the 62 units is S207's `£81,000` Auto deposit in 2033, by the first person at 62,
      past both arms' ages.
    - Everyone whose ROUTE age is earlier pays under `£10,000` a year into a pension at those ages: `£4,514` to `£7,091`,
      each contribution grown at its own `3%` a year. So no charge would arise in law either.
  - **One age for every path.** It is the app's own approximation, resolved once on the expected path, and under a solved
    table it is one step further off: the age is a fixed rule's on the solver's plan, not the table's first taxable draw on
    the path lived.
    - It would matter for a couple with a dated pension deposit or tranche between the two ages, or for someone paying in
      more than `£10,000` a year after the table first draws their pension. The engine levies no charge in either case.
    - Neither is in this panel, so it is by inference only.
- **Anything that makes R's, L's or P's change of default premature (question 7).** Nothing in the records does. Three things
  belong in the D-line.
  - **M1's names, as section 2 finds them.** The loss at 25/75 is the household route's, not R's, L's or P's. It is already
    on by default for W (D146) and for Y, E, S and G (D144): S041-W0-Y75 shows it (`-1.17` points, `+£645` a year of tax
    against 60/40).
  - **R past three profiles apart.** That reach is by inference and extends a falling gain: about `-1.1` points a profile
    pooled, and about `-2.3` on S281's ISA, which stands at `+5.1` to `+5.3` three apart. It is the weakest of R's reaches.
  - **L.** The stricter limit binds both people, and its cost is unmeasured.

## 2. The leading cause: at uneven holdings the household table taxes the couple as one person who is not them

**What it accounts for.**
- ROUTE's loss at 25/75 on S041.
- Through it, M1's two names. The app's own gain at 25/75 is the other half, and it is explained: arm A's pick.

**The cause.**
- The household table chooses each year's spending and draw on one person's tax: k times one person's allowance and bands,
  with k = 1/s (`householdPlanFor` at 'pensionsPA'; k is `1.667` at 60/40 and `1.333` at 25/75).
  - The rule is exact only "when the two draw their pensions in proportion" (`household.js` l.87 to 94).
- The route then carries each move out at the even split (`householdSolved`), each person drawing their own pots, step by
  step, against their own allowance (`App.jsx` l.2610 to 2628).
- At 25/75 on S041 the two do not meet.
  - Its two state pensions are near equal, `£10,400` and `£9,800`. Together they pass the household's allowance (`£16,760`)
    from plan year 3, so the table charges about `£654` a year (the starter rate on `£3,440`) that the engine never does.
  - It sees no tax-free room for a pension draw where the engine leaves each person some.
- Its draws then cost the couple tax the app's rules do not pay, and the household spends less by about that much.

Evidence for:
1. **ROUTE's money at 25/75 against 60/40, the same couple on the same markets** (`dr-pair-S041.txt`, `dr-acct.txt`,
   `dr-kindacct-S041.txt`):
   - spending lower on all 14 kinds, `-0.15` to `-3.05` points of target, mean `-1.06`;
   - tax higher on all 14, `+£164` to `+£702` a year, mean `+£440`;
   - the end pot `-£19,524` a path (capped `-£15,199`).
   - Money is lost, not held back: a table that only over-priced tax would spend less and keep the money.
2. **The same on the pilot's seed** (`dr-pilot-S041.txt`): `-1.08` points, `+£437` a year, `-£19,114`. It is the plans and the
   route, not the seed.
3. **The tax and the spending move together in every market.** By tenth of the 60/40 APP's end pot, ROUTE's tax rises
   `£330` to `£504` a year and its spending falls `£221` to `£483`. In the 3rd to 9th tenths the two are within `£35` a year
   of each other.
4. **It is the route's, not the engine's.** The engine splits a year's need evenly under the app's rules too (`App.jsx`
   l.2629 to 2648). Yet where arm A picks the same rule at both holdings (eight kinds), the app's rules' tax moves only `-£59`
   to `+£84` a year at 25/75.
5. **The couple whose state pensions pass the allowance earliest drops most.**
   - S041's two state pensions pass it at plan year 3, and S041 drops `-1.06`.
   - The second state pension starts at plan year 16 on S207 (`-0.52`) and 26 on S281 (`-0.22`).
   - The rehearsal's S025 has S041's ages, but its state pensions (`£15,000`) stay under `£16,760`. It drops `-0.14`, with
     mixed signs (`dr-pair-rehearsal.txt`).
6. **ROUTE's tax rises at 25/75 on most of the couples:** S041 `+£440`, S123 `+£446`, S185 `+£362` and S281 `+£286` a year.
7. **It is the gap D143's deep review found on S037's four pricing names.** There it was a level drop in every tenth, and the
   pricing fix closed it (`results-pricing-fix.txt`: `£56` against `£369` a year).

Evidence against:
1. **Couple by couple, tax and spending do not line up.**
   - S123 pays as much more tax at 25/75 (`+£446`) without spending less (`+0.27` points). Its 25/75 units landed `£986`
     a year lower, so that comparison is loose.
   - S207 spends less (`-0.52`) with no more tax (`+£12`).
2. **On Ri1s ROUTE's own spending hardly moves** (`-0.15` points). That name is almost all the app's own gain at 25/75.
3. **The pensions' split read no differently from the even split before.** On the remedy's 28 units (HSPS against HSP,
   `results-household-remedy.txt`) it changed little. But those units held near 60/40, not 25/75.
4. **The arrays hold lifetime totals.** No year's draw, tax by person or tier is recorded, so where the tax arises, and
   whether the table's pricing or the even split is the active part, is inferred.

How far the records support it:
- Strongly, that ROUTE loses real money to tax at 25/75 on S041, on every kind and in every market.
- In part, that the household table's one-person tax is why. It fits the cross-couple order and the app's rules' contrast,
  and it leaves S123 and S207 unexplained.
- Not as a cause. Section 3 measures that.

## 3. The one test: S041 priced and drawn as two people

What it runs (EXPLORATORY, its rule committed before any unit runs):
- **Code and settings.**
  - The registered code (d91a642206b9) and configurations: APP `ef459a5c8ccb` and ROUTE `0fea0d25d803`.
  - Seed 7002, the pilot's, which is not held out. Not 7027, and no other held-out seed.
  - `4,000` paths a unit, 45 points, estate weight 0.02.
- **Units (28).** S041's registered units: its 14 kinds at 60/40 and at 25/75.
- **Arms.** Each exists in code.
  - APP and ROUTE, as registered.
  - **PA2:** ROUTE at the household plan's 'pensions' form (HSP, the couples trade's PA2). Its allowance is two people's at
    both holdings and its bands are at k, so at S041's incomes its allowance is the couple's own.
  - **SPLIT:** ROUTE's own table, its moves carried out at the pensions' split (`chooseHouseholdSingle` 'pensions', the
    remedy's part 2). Each year the first person funds their pension's share of the two.
  - **FIX** (beside, deciding nothing): ROUTE at 'pensionsPAown', the pricing fix D145 (2) left off.
- **Checks.** A STOP if any fails.
  - ROUTE's table carries the registered run's digest on all 28 units. Tables do not depend on the seed.
  - APP and ROUTE on the first `1,000` paths equal the pilot's arrays (`results/couples-any-pilot`), every key.
  - SPLIT with its split read as 'even' reproduces ROUTE bit for bit, and SPLIT as run parts from ROUTE on every 25/75 unit.
  - PA2's and FIX's household plans are ROUTE's but for the allowance and bands (PA2) or the partner's fixed income (FIX,
    PRICING-FIX's check 3).
  - Each arm's first 200 paths equal `E.runTrial`'s.

How it is read:
- **ROUTE's loss, D.** For each kind, the 25/75 unit's lifetime tax a year less the 60/40 unit's, on the same paths, pooled
  over the 14 kinds by path. It was `+£440` on 7027 and `+£437` on the pilot.
- **An arm explains the loss** if its own 25/75 rise is at most half of D, and its 95% interval's upper end lies below D's
  point.
- **Beside, deciding nothing:**
  - each arm's 25/75 spending against 60/40 and its end pot;
  - each arm against APP at 25/75: M1, and the tenths;
  - each arm against ROUTE: D34 in whole paths;
  - the worst fifth;
  - the app's same-pick kinds as the yardstick (`-£59` to `+£84`).

What each outcome changes:
- **PA2 explains it.**
  - The cause is the household table's allowance at k: it cannot see that two people's state pensions and draws each have
    their own allowance. This is D143's pricing gap, and it reaches the draws as well as a partner's state pension.
  - M1's two names are that gap's cost plus the app's better rule at 25/75, not a survival trade. The D-line says so, and
    the maintainer's word on them is a word on that gap, which D145 (2) left in the route.
  - The pricing becomes the household line's next build, EXPLORATORY, on these units and on the pricing fix's. Its
    survival is read by D34 first: on the pricing fix's thirteen units PA2 lost `98` paths against ROUTE and FIX `96`, almost
    all below the minimum pot in the plan's last year (`results-pricing-fix-beside.txt` E).
- **SPLIT explains it.**
  - The even split at uneven holdings is the cause, for every couple on the household route.
  - The split is the next build, EXPLORATORY, on these units and the remedy's 28, as its own change.
- **Both.** Both, the larger first.
- **Neither.** The household's tax is not the cause, and ROUTE's 25/75 loss stays unexplained. The D-line says the M1
  shortfall lies in good markets and its cause is not shown.
- **In every case:**
  - the read and its passes stand, and nothing of seed 7027 runs again;
  - M1's names go to the maintainer before any default changes, as registered;
  - R's, L's and P's build goes on beside, since the loss is the household route's and not theirs.

Cost and box:
- **Cost.** From the read's own timings (ROUTE's solve median `49` s, a path `35` ms) and S041's 28-year horizon:
  - three solves (ROUTE, PA2, FIX) and four table arms' paths a unit, about 12 minutes;
  - under 6 core-hours in all, about an hour and a half on four cores.
- **Box.** Half a day to build from `audit-couples-any.mjs`, an hour and a half to run, and half a day to read.
- **When.** Before the maintainer's word on M1's names, which it settles, and beside the change of default.

## 4. Open items the result moves

- **T-GAPS.** It still reads "none measured on simulated outcomes". The couples' line that the deep reviews of 20 and 22 Nov
  proposed is still not in the table.
- **A new line: the household route at uneven holdings.**
  - Its measured effect (post hoc, section 2): S041 at 25/75 against 60/40 on the same markets, ROUTE `+£440` a year of
    tax and `-1.06` points of target in spending on every kind, where the app's rules with the same pick pay `-£59` to
    `+£84`. M1's two names are part of it.
  - A decision rests on it: the maintainer's word on M1.
  - It closes by the test in section 3.
- **Not an item: the MPAA ages.** They have no measured effect and no decision rests on them, so by STATE.md's rule they are
  not carried. The D-line names them as an approximation.
- **Nothing else moves.** COUPLE-SHARE is closed, and the singles' items are untouched.
