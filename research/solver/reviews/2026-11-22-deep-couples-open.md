# Deep review after a confirmatory read: the guard's own units, the household route's classes (`registrations/couples-open.md`, seed 7026), read 22 Nov

Subject: what the registered read says together with the reads beside it. The read is `results-couples-open.txt`: Y, E, S
and G each OPEN, and M1 names nine of S037's eleven units. The reviewer at the read gave FAIL, then PASS on the second look
(`reviews/2026-11-22-read-couples-open.md`, `-2.md`).

Read:
- STATE.md whole and CHECKLIST.md; `COUPLES-OPEN.md` with its amendments 1 to 3; `registrations/couples-open.md`.
- `results-couples-open.txt`, `-sizing.txt`, `-registered-panel.txt`, `-panel.txt`, `-rehearsal.txt` and `-addendum.txt`;
  `reports/2026-11-22-couples-open-read.md`, `-rehearsal.md` and `-addendum.md`; the reviews at the read and at the rehearsal.
- Step 8's read, its beside and its deep review (`results-household-hsp.txt`, `-beside.txt`,
  `reviews/2026-11-20-deep-household-hsp.md`); `results-late-tail-2.txt`; `results-guard.txt`.
- The code:
  - `audit-couples-open.mjs` (`solveRoute`, `routeContext`), `reduce-couples-open.mjs` and `couples-open-panel.mjs`;
  - `couple-panel.mjs` `planOf` and `audit-phase4.mjs` `runPath`;
  - `src/solver/household.js` `householdPlanFor` and `pensionsSplit`, and `src/solverCouple.js` `householdCut`;
  - `src/solver/solve.js`'s objective: the cut's cost, the raise's credit, `productLevels`, and the estate term at `0.02`
    of opening wealth, capped at four times it;
  - `src/solverSettings.js`.

Ran (EXPLORATORY, after the read, deciding nothing; no solve, path or batch):
- seed 7026's 44 stored unit files, decoded with the reducer's own `loadDir`;
- the pilot's 44, on seed 7002 and already read. They carry the same configurations, engine inputs and table digests as
  the registered run on 44 of 44.
- the rehearsal's and the addendum's files, on seed 7002 and already read;
- the plans as `readOpenPanel` builds them, read only.

Nothing of seed 7026 beyond its stored arrays was read. The scripts are in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/deep-co/` (a1 to
a11, plans, pilotstamp). Every figure below that is not in a results file comes from them: a post hoc look at runs already read, so a lead, not
a result.
- **A tenth** or **the worst fifth** means a unit's paths ranked by APP's end pot. That is a fixed rule's outcome, so it
  ranks the markets.
- **Spending x of the target** is the mean spending a year over the target.
- **S037's units but G12P** are its ten household-route units other than G12P; G12R is G12's own plan, with G12's figures.

## Summary

- **The OPENS stand.** Nothing here changes the read or its outcome.
- **S037's shortfall is mostly survival bought with spending.**
  - On S037's units but G12P, every path the household plan saves lies in the worst fifth. There, the pot that saves them is
    the spending it gave up, pound for pound: the two differ by `-0.4%` to `+5.2%` of opening wealth.
  - On the other three couples the household plan finds `+25%` to `+88%` of opening wealth there besides, and spends more.
- **Four of the nine names are a pricing gap, not that trade.**
  - The household table puts both state pensions on one person, with an allowance of `k` times one person's.
  - At `k` near 1 that charges `£207` to `£486` a year of tax the engine never charges.
  - Y90, Y100, E95 and E100 spend about that much less than Y75, which M1 does not name.
- **It is the same thing as S025's, and in kind as S273-90's.**
  - S025 in the rehearsal is S037's couple in ages, state pensions and pots, and shows both effects.
  - S273-90's lower spending bought survival in the late tail, and it sits at `k` 1.111.
- **The tax and the mean pot are mostly the estate cap.** On S119, S199 and S279:
  - `94%` to `115%` of the mean pot's fall lies above the cap;
  - on S119 and S279, `70%` to `89%` of the tax saved lies in the better half of markets.
- **The one test.** It runs S037's ten distinct units and three controls on seed 7002, in two variants of the household
  plan: one taking the app's rules' spending, one with the allowance doubled. It says whether the cut buys the survival,
  and whether the four names are the pricing. It runs beside the change of default.
- **Open items.** T-GAPS can no longer say "none measured" for couples: the household table's tax at `k` has a measured
  effect.

## 1. What the result says, and what it does not

It says:
- **On the guard's own couples the household route beats the app's rules in each class.**
  - Pooled survival, by path: `+11.538` (Y), `+11.686` (E), `+11.547` (S) and `+11.964` (G) points.
  - Every unit gains, from `+10.19` (S119-G12R) to `+15.08` (S037-G12).
  - D34 flags none. No unit loses more than 6 paths of 25,000, against thresholds of 147 to 165.
  - Pooled spending on the paths both keep is `+2.80%` to `+3.45%`.
- **The gain is the size the pilot and step 8 predicted.**
  - The pilot, on seed 7002, gave class means of `+10.53` to `+11.27`. The held-out seed gives `+11.54` to `+11.96`.
  - Inside the guard, step 8's household plan beat the app's rules by `+11.605` (`results-household-hsp.txt`).
  - So, on survival, the guard's reasons do not pick out couples the household route serves worse than the app's rules.
- **G holds on the household route for an income before the state pension age.**
  - G12R's rent, paid from retirement, gains `+10.19` on S119, `+11.78` on S199 and `+11.27` on S279.
  - The guard test's harm (`results-guard.txt`: S149@gap12 with rent, `-6.850`) was measured on today's route, which keeps
    its guard (D141).

It does not say:
- **That every couple spends no less.**
  - S037, one couple of four, spends less on the paths both keep on nine of its eleven units, and over all paths on ten.
  - Part 3 holds pooled because the units are weighted equally and three couples of four spend more.
  - The interval is taken over paths, not couples. A population with more couples like S037 would read lower.
- **Anything about the shapes the household plan refuses.** Those keep today's guard (D141). Nor does it settle the
  registration's inferences: the younger cohort, retiring before 58, the mirror, a blank minimum pot, and other splits,
  gaps and incomes.
- **Why S037 spends less.** The arrays hold lifetime totals only. Section 2 takes them as far as they go.

The records explain the two figures the brief names:
- **The mean pot.**
  - On S119, S199 and S279 the mean pot falls `27%` to `74%` while the capped pot moves `-7.6%` to `+7.2%`.
  - `94%` to `115%` of the mean's change lies above the estate cap of four times opening wealth. APP's pot passes that cap
    on `23%` to `63%` of paths, and the estate term counts nothing above it.
  - In the best tenth the household plan spends `0.4` to `5.3` points of the target a retired year more than APP, yet ends
    `£24m` to `£92m` a path lower. That is growth not taken, not money spent; it is inferred, since the arrays hold no tiers.
  - The cap is by design (D77), and D116 rules the smaller pot no harm.
  - On S037 APP's pot passes the cap on only `4%` to `13%` of paths, and the mean pot rises.
- **The tax.** APP's lifetime tax rises with the market; the household plan's does not.
  - On S119-Y75, APP pays `£35k` a path in the worst tenth and `£393k` in the best. The household plan pays `£3k` to `£10k`
    in every tenth.
  - On S119 and S279, `70%` to `89%` of the saving lies in the better half of markets. So most of it is tax on the growth
    APP carries above the cap.
  - What remains in the worst tenth (S119-Y75: `£35k` against `£10k`) is the order of drawing.
  - With no tax on a pension at death (D64), a table loses nothing by drawing the pension last. The arrays hold no wrapper
    at the end, so how much is left in the pension is not shown. If the app ever taxes a pension at death, this is the
    saving that would shrink first.

What else stays unexplained, besides section 2:
- where the household plan's money in the worst fifth comes from on S119, S199 and S279;
- it ends with `£221k` to `£586k` more pot a path there, and at most `£43k` of that is tax (`£121k` on S119-G8Y75);
- the arrays hold no tiers or wrappers to show more.

## 2. The leading cause: on S037 the household plan finds no other money to keep paths with, so it uses spending

What it accounts for:
- M1's nine S037 units keep far more paths, spend less on the paths both keep and leave a larger pot;
- the other three couples spend more and leave less.

The cause:
- **S037 lives mostly on income it already has.**
  - It is a retired couple of 68 and 65 with two state pensions, `£8,200` and `£6,800`; the second starts at the partner's
    68th birthday.
  - Those pay `64%` to `70%` of the target on the Y, E and S units, and `88%` to `90%` with the elder's DB pension on G8,
    G12, G12R and G8Y75.
  - It holds `£180,000` of pots and sets its own `£35,000` minimum pot.
  - Under the app's rules it pays almost no tax that could be avoided: `£10` to `£6,191` a path on the Y, E and S units.
    On the G units the tax is the DB pension's, and the household plan saves at most `£10,336` of it.
- **The app's rules fail it mostly at the plan's end, below its minimum pot.**
- **The household plan keeps those paths with spending.** It finds nothing else on S037 to keep them with, so it spends
  less in poor markets and ends there over the minimum pot.
- **The paths both keep pay part of the cut.** The cut is made before the market's course is known.
- **On the other three couples it finds money besides spending, and spends more.**

Evidence for:
1. **The worst fifth's accounting.**
   - On all of S037's units but G12P, every path the household plan saves lies in the worst fifth.
   - There, ROUTE less APP, a path:
     - the pot is `+£25k` to `+£64k`;
     - spending is `-£16k` to `-£64k`;
     - tax is `-£8k` to `+£1k`.
   - So the pot gained, less the spending given up, comes to `-0.4%` to `+5.2%` of opening wealth.
   - On the other couples' 33 units the pot is `+£221k` to `+£586k`, with `+£20k` to `+£137k` more spending: `+25%` to
     `+88%` of opening wealth found.
2. **Where the worst paths end, and how they get there.**
   - In the worst tenth the household plan ends over the minimum pot on every couple. The median end pots:
     - S037 `£43k` to `£61k`, against `£35k`;
     - S119 `£1.13m` to `£1.20m`, against `£1.08m`;
     - S199 `£485k` to `£525k`, against `£430k`;
     - S279 `£239k` to `£263k`, against `£205k`.
   - On S037 it spends `0.831` to `0.848` of the target there, against APP's `0.877` to `0.917`. APP's median pot there is
     `£5k` to `£10k`.
   - On S119 it spends what APP does (`0.822` to `0.834`, against `0.821` to `0.836`). On S199 and S279 it spends more.
   - APP's failures on S037's units but G12P are mostly at the minimum pot. Of `3,453` to `3,834` failures, `2,653` to
     `3,190` end below it with no year short.
3. **The paths both keep pay part of the cut.**
   - In the second tenth, APP keeps about half the paths and ROUTE saves the rest.
   - On the paths both keep there, ROUTE spends `1.42%` to `5.75%` less on all of S037's units except G12P and S75.
   - On the G units it still spends less up to the sixth tenth (`-0.58%` to `-5.75%`).
   - On the other couples it spends more in that tenth, by `+1.13%` to `+7.48%`.
4. **G12P is the exception that fits.**
   - Its APP failures are almost all a running out (`3,359` of `3,377`), while it waits twelve years for the partner's DB
     and state pension.
   - There the household plan finds money: `+17.1%` of opening wealth in the worst fifth.
   - It spends more than APP in every tenth, by `+0.06%` to `+2.99%` on the paths both keep.
5. **The same couple shows the same pattern.**
   - S025 in the rehearsal (seed 7002) has S037's ages, state pensions and pots; its minimum pot is one year's target.
   - In its worst tenth, on its household-route units but G12P, ROUTE spends `0.824` to `0.850` of the target, against
     APP's `0.860` to `0.913`.
   - Its median pot there is `£27k` to `£58k`, against `£0` to `£11k`.
6. **Step 8's M1 unit, S273-90, is of this kind.**
   - The late tail's L arm put K2's spending level into the household plan's move on S273-90, and lost `115` net paths
     (`results-late-tail-2.txt`). So the household plan's lower spending was buying survival.
   - S273-90 sits at `k` 1.111. There step 8's deep review found the table's forecast below the engine's survival on all
     eight units. That is the cautious side of the pricing that evidence against 1 reads here.

Evidence against:
1. **Four of the nine names are not the cut.**
   - On S037's Y90, Y100, E95 and E100, the household plan's spending against APP sits below Y75's by a near-constant
     amount in every tenth from the second to the eighth:
     - E100 `-2.3` to `-2.8` points;
     - Y100 and E95 `-1.7` to `-2.2`;
     - Y90 `-0.9` to `-1.2`.
   - The amount follows a tax the household table charges and the engine does not.
     - The household plan is one person who holds both people's state pensions: `householdPlanFor` makes the partner's the
       household person's taxable income.
     - That person's allowance is `k` times one person's (HSPA, D130 (2)).
     - At `k` 1.333 (Y75) the two pensions, `£15,000`, sit under that allowance.
     - At 1.111 (Y90), 1.053 (E95) and 1.0 (Y100, E100) they pass it by `£1,033`, `£1,768` and `£2,430`. That is a tax of
       `£207`, `£354` and `£486` a year from plan year 3.
     - The engine taxes each person against their own allowance, and both state pensions are under it.
   - Over all paths, ROUTE less APP, a year, sits below Y75's by: Y90 `£173`, E95 `£351`, Y100 `£324` and E100 `£445`.
   - That tax, spread over the plan, comes to `£185`, `£316`, `£434` and `£434`.
   - It buys little. ROUTE's own survival rises from `99.47%` on Y75 to `99.61%`-`99.74%` on the four.
   - Without the tax, the four would read like Y75: `+0.53%` on the paths both keep, and not named.
   - The order runs against the tax the couple really pays under APP: E100 `£10` a path, Y75 `£1,022`.
   - S025 shows the same order, smaller on its 4,000 paths: `-£19` to `-£306` a year against its Y75.
   - **This is what MINOR 1 saw.**
     - Across Y75 and the other Y and E units, spending does not follow the paths kept. The spread between them is this
       pricing, not a trade.
     - G12P faces a different survival problem, one where the household plan finds money.
     - Where the records show the trade, it lies inside each unit's worst fifth.
2. **S75's shortfall sits in the best markets**, where no path is at risk: `-1.28%` to `-2.92%` in the top three tenths,
   with its pot larger there. The cut does not explain it.
3. **The arrays hold lifetime totals only.**
   - The years the cut falls in, and the tiers held, are inferred.
   - That the cut saves the paths, rather than saved paths simply keeping money, rests on the worst fifth's arithmetic,
     not on a measurement.
   - Why the household plan finds nothing on S037 is not shown. It fits that S037 has no tax to save, no wait for an
     income to bridge, and little drawn from the pots. G12P's wait is the one place it finds money.

How far the records support it:
- **Strongly in the worst fifth.** On all of S037's units but G12P, the pot the paths are saved with is the spending given
  up.
- **In part on the paths both keep.**
  - The cut shows in the poorer markets: in the second tenth on all of S037's units but G12P and S75, and on the G units up
    to the sixth.
  - Four of the names are the pricing, and S75's comes from the best markets.
- **Not as a cause.** Section 3 measures that.

## 3. The one test: the cut put back, and the allowance doubled

What it runs (EXPLORATORY, its rule committed before any unit runs):
- **Code and settings.**
  - The read's code (36e4d2a860b2) and configurations: APP `ef459a5c8ccb` and ROUTE `35ee3a2dc6ad`.
  - It runs from a worktree at the launch commit 1632296f.
  - Seed 7002, the pilot's, which is not held out.
  - 4,000 paths a unit, 45 points, estate weight 0.02.
- **Units (13).**
  - S037's ten distinct household-route units: Y75, Y90, Y100, E95, E100, S75, G8, G12, G8Y75 and G12P. G12R is G12's own
    plan, so it is left out.
  - Three controls where the household plan finds money: S119-E100, S199-E100 and S279-E100.
- **Arms.**
  - **APP and ROUTE**, as in the read.
  - **L** is ROUTE's own move each year, with its spending level set to the level APP took that year on the same path.
    - APP runs first on the path, and its level is kept unrounded.
    - Everything else is ROUTE's: the order of drawing, the tiers, the lump sum and the sweep.
    - It is the late tail's L, with APP as the donor.
  - **PA2** is ROUTE solved and assembled at the household plan's 'pensions' form, everything else ROUTE's.
    - That is HSP: the allowance is two people's, and the bands are at `k`.
    - `householdCut` already takes that form.
- **Checks.**
  - Each unit's household table, solved again, carries the registered read's digest; the pilot's carries it too, on 44 of
    44. A difference is a STOP.
  - APP and ROUTE on the first 1,000 paths must equal the pilot's arrays (`results/couples-open-pilot`). A difference is a
    STOP.
  - L given ROUTE's own levels must reproduce ROUTE bit for bit, and L's spending must equal APP's in every year with
    nothing unmet.
  - A planted fault, L taking APP's level from the next path, must fail that check.
  - PA2's `k` must be the unit's own, and its allowance two people's.

How it is read:
- **THE TRADE** holds when both of these do:
  - pooled over S037's nine distinct units other than G12P, L keeps at most half of ROUTE's survival gain over APP, by
    path;
  - on each control, L keeps at least three-quarters of that gain.
  - G12P's figure is printed beside. The prediction is that L keeps most of its gain.
- **THE PRICING** holds when, on Y90, Y100, E95 and E100 pooled, PA2's shortfall below Y75's is at most half of ROUTE's.
  The shortfall is spending on the paths both keep, each unit against APP, in pounds a year.
- **Beside, deciding nothing:**
  - each arm's survival, its spending on the paths both keep and over all paths, the capped pot and lifetime tax;
  - the worst fifth's accounting;
  - D34 for L and for PA2, each against ROUTE.

What each outcome changes:
- **THE TRADE.**
  - S037's shortfall is the price of its survival.
  - The maintainer's word on the default is then a word on that trade: survival first, as the app's rules rank it.
  - Its terms: 13 to 15 points of survival, for `0.1%` to `2.6%` of spending on the paths both keep and `0.3%` to `3.3%`
    over all paths. That is on a retired couple living mostly on state pensions.
  - Nothing in the household plan is broken by it. The D-line names that kind of couple.
- **THE PRICING**, with or without the trade.
  - The household plan taxes a partner's state pension against the household's allowance. That is a defect.
  - It costs uneven couples on state pensions about that tax each year in spending, and gives them about a quarter of a
    point of survival in return.
  - The fix prices each person's state pension and other income against their own allowance.
    - It comes with its test of the class: the library's couples with `k` below 1.2 and a partner's state pension.
    - It comes with its plant, and runs EXPLORATORY first on these units.
  - On the Y and E units it moves spending, not survival, so they need not wait for it. The D-line says so.
- **Not the trade.**
  - S037's cut buys little of its survival. The maintainer hears that before the change is committed.
  - Next comes ROUTE at the lower estate aim (`bequestWeight` 0.01) on the G units, EXPLORATORY, since the estate term is
    what is left there.
- **A control failing.** Either L's wiring or the controls' gains is in question. That is reported, and THE TRADE is not
  read.
- **In every case:**
  - the read stands;
  - nothing of seed 7026 runs again;
  - the default changes only on the maintainer's word.

Cost and box:
- **Cost.** From the read's own timings, about 2 core-hours, or half an hour on four cores.
  - ROUTE runs `25` to `35` ms a path on S037 and `43` to `52` ms on the controls.
  - A solve takes `34` to `62` s.
- **Box.** Half a day to build L's wrapper and its checks, half an hour to run, and half a day to read.

Before the change of default, or beside it: beside it, as D134 (1) arranged for step 8.
- The change of default is built and reviewed while the test runs. Nothing goes to `main` before the test reads.
- No outcome turns the gain into a harm. D34 flags no unit, and ROUTE keeps 13 to 15 points more on every S037 unit. So
  the test does not stop the build.
- It settles what the D-line says of M1's units, and whether a pricing fix follows.
- It is cheap enough to read before the maintainer's word.

## 4. Open items the result moves

- **T-GAPS.** Its line reads "gaps between a table and simulation ... none measured on simulated outcomes".
  - The household table's tax at `k` is such a gap, and it now has a measured effect, post hoc. On S037's Y90, Y100, E95
    and E100, ROUTE less APP sits `£173` to `£445` a year below Y75's in spending. That buys `0.14` to `0.27` points of
    ROUTE's own survival.
  - So it should leave the known limitations and become an open item of its own. The test's PA2 arm closes it, with the
    fix if THE PRICING holds.
  - By the same arithmetic, though not measured, the gap can run the other way.
    - On S037-G8, at `k` 1.667, the table charges the elder's DB and state pension `£450` a year in plan years 0 to 7. The
      engine charges `£2,126`. That is on the guaranteed income alone; the table's draws err the other way.
    - That is the optimistic side D134 (1) guarded against. On S037-G8 it sits under `99.9%` survival.
  - Step 8's deep review proposed a couples' line for T-GAPS: the household table's forecast follows `k`, falling below
    the engine's survival on 8 of 8 units at 1.111. It is not in the table, and it belongs with this item.
- **Nothing else in the table moves.** COUPLE-SHARE is closed, and the singles' items are untouched.
- **The guard test's harm** is not an item in the table. It stays with today's route, which this read did not run.
