# Deep review after a confirmatory read: step 8, the household plan priced at the pensions' split (HSPA) against today's couples' default (K2), seed 7024, read 20 Nov

Subject: what step 8's read (`results-household-hsp.txt`: PASS, M1 naming S273-90; the reviewer at the read PASS, three
MINORs answered, `reviews/2026-11-20-read-household-hsp.md`) says together with the household line's reads before it.

Read: STATE.md whole and CHECKLIST.md; `registrations/household-hsp.md` and `STEP8.md`; `results-household-hsp.txt`,
`-beside.txt`, `-sizing.txt` and `-panel.txt`; `reports/2026-11-20-household-hsp-read.md`; the reviewer at the read; the
arm read (`results-household-arm.txt`, `-beside.txt`), the lead test (`results-household.txt`), the decomposition
(`results-household-decomp.txt`, `-beside.txt`), the remedy (`results-household-remedy.txt`, `-beside.txt`), the shapes'
beside; HOUSEHOLD.md sections 1 to 3. The code, in the launch worktree (dc85dfaf): `household.mjs` (`householdPlanFor`'s
pricing at `k`, `chooseHouseholdSingle`), `audit-household-hsp.mjs`, `model.js`'s couple year (the split),
`audit-phase4.mjs` `runPath`, `audit-household.mjs` `whyRecord`.

Ran (EXPLORATORY, after the read, deciding nothing; under `nice -n 19` beside the savings split's preflight; no solve,
path, batch or suite):
- seed 7024's 40 stored unit files, decoded with the reducer's own `loadDir` in the launch worktree;
- the stored arrays of the pilot, the arm read and the decomposition (seed 7002, each already read);
- the panel's 40 plans, read only (`solverPlanOf`, `pensionsSplit`).

Nothing of seed 7024 beyond its stored arrays, nothing of seed 7025. The scripts are in the session scratchpad's
`deep-hsp/`. Every figure below that is not in a results file comes from them: a post hoc look at runs already read, so
a lead, not a result.

## Summary

- **PASS stands.** Nothing here changes the read or its outcome.
- **The pooled gain's size comes from the panel, not the seed.**
  - The pilot's 15 units on seed 7002 averaged `+0.433`; the same 15 units on 7024 average `+0.450`.
  - The arm read's `+3.746` rested on the 16 units of its two DB bases (`+10.606`). Its other 40 units averaged
    `+1.001`, which comes to about `+0.87` in step 8's mix of shapes.
- **Where it wins and loses.** HSPA saves K2's mid-plan failures on the 90/10 and DB shapes. It loses at the plan's end,
  in the worst markets.
- **The leading cause of the losses.** The household table runs the couple's money as one household it rightly reads as
  safe.
  - It cuts less early and carries more growth than K2's two tables, each of which reads its part as short.
  - So in the worst markets it ends the plan nearer its minimum pot.
  - Where K2 has nothing else wrong (near-even shares, the two richest couples), that thinner cushion is all that is
    left.
- **The write-up's lead does not hold as worded.** The extra lifetime tax on S357F and S273 is the upside of the best
  markets, and the lost paths carry no tax shortfall.
- **The one test.** A replay on seed 7002 of the units that lose, EXPLORATORY, about 10 core-hours:
  - two variants of HSPA, one taking K2's spending level and one taking K2's tiers;
  - beside them, the household table on its own plan.

  It says whether the late tail is a trade the household table makes itself, or a gap between the table and the couple.
- **Open items.** T-GAPS gains a couples' line, and a new line opens for the household plan's late tail.

## 1. What the result says, and what it does not

It says:
- **HSPA beats K2 on held-out couples inside today's guard.**
  - It keeps more paths: `+0.762` (`+0.718` to `+0.807`). D34 flags no unit.
  - It spends more on the paths both keep: `+1.7223%` pooled, and more on 39 of 40 units (S273-90 is the exception).
  - Against the app's rules it gains more than K2 does: `+11.605` against `+10.842`.
- **Its one table forecasts the household.** The forecast is within a point of what the engine delivers on 40 of 40
  units (mean `+0.099`). K2's product of two tables is below what it delivers on 39 of 40 (mean `-10.909`). This is the
  household plan's second purpose (HOUSEHOLD.md section 3).
- **The gain's size is what the panel's make-up predicts.**
  - The registration's own pilot (seed 7002, 1,000 paths) gave `+0.433` on its 15 units. Step 8 gives `+0.450` on the
    same 15. The held-out seed did not shrink the gain.
  - In the arm read, the 16 units on S147-db and S061-dbpart averaged `+10.606`. On five of them K2 fell below the app's
    rules, and the guard now keeps all five on the app's rules.
  - The arm read's other 40 units averaged `+1.001`. Weighted to step 8's mix of shapes, that is about `+0.87`. The
    shapes used: own `+0.436`; even, standing for 45, `+0.450`; 90 `+1.347`; the six other feature units `+1.454`; gap8
    `+0.650`.
- **Where it wins and where it loses, by the paths.**
  - The 3,684 paths HSPA saves on the 90 and DB units are K2's earlier failures, a median 14 years before the plan's end.
    S193-90 is the clearest: 800 saved, K2 failing mostly in plan years 16 to 35, where K2's forecast read `67.55%`.
  - The 1,238 paths HSPA loses fail at the end: 894 in the plan's last year and nine in ten within five years of it, at
    the minimum pot or running out.

It does not say:
- **That no couple is worse off.** Seven units lie below nought at their point, and three lie beyond noise (S025-45,
  S357F-gap8, S357F-own). Each is under D34's threshold, but each interval reaches past a quarter point. As a couple,
  S357F gains nothing (`-0.043`).
- **That the result generalises beyond couples like these eight.** The pooled interval is taken over paths. The panel is
  eight couples, and one of them gains nothing.
- **Anything about couples outside the panel.** That means couples the guard keeps on the app's rules, and shapes the
  panel lacks:
  - an age gap of 12 years (gap12);
  - a DB pension together with an age gap;
  - the younger partner holding more;
  - the elder entered second;
  - pensions held unlike the pots.

  The same goes for the lower estate aim, consent withdrawn, the dial's positions and the speed mode. All of these are by
  inference only, as the registration says.
- **Why the losses happen.** The arrays hold lifetime totals only: no year's level, tier, wrapper or tax.
- **That the household plan misprices the two richest couples' tax.** See section 2.

## 2. The leading cause of what is unexplained

What section 1 leaves unexplained:
- **The late losses.** Seven units lie below nought and three beyond noise, and S357F gains nothing.
- **Where the gain is missing.** The near-even shape (45) gains nothing. The two richest couples gain least in every
  shape: S273 and S357F, `£2.4m` each, the panel's only spenders past the basic-rate band.
- **The pot.** It is capped lower on 35 units. Uncapped, its mean is higher on 27 and its median lower on 31.
- **The tax.** HSPA pays more lifetime tax on all of S357F's units and four of S273's, yet S025-45 loses with almost no
  tax at all.
- **M1's unit, S273-90.**

**The cause: the household table runs the couple's money as one household it reads, rightly, as safe.**
- It cuts less early and carries more growth than K2's two tables, each of which reads its part as short. So in the
  worst markets it ends the plan nearer its minimum pot.
- **Where K2's misreading also starves the household mid-plan** (90/10, the DB shapes), HSPA's gains swamp that cost.
- **Where the misreading does no other harm** (near-even shares, and the richest couples, whose parts are each nearly
  safe), K2's caution was a cushion at the plan's end. There the late tail is what is left.

Evidence for:
1. **The paths.** HSPA's losses fall at the plan's end (894 of 1,238 in the last year). Its gains fall mid-plan (a median
   14 years before the end).
2. **The cushion.**
   - On every unit, HSPA leaves more of its surviving paths within two years of target of the minimum pot (40 of 40).
   - On the paths both keep, the 5th percentile of the end pot over the floor is lower under HSPA on 37 of 40 units,
     including all seven below nought.
3. **The loss is not tax, and not more spending.**
   - **On the lost paths.** On the seven units' 430 lost paths, HSPA less K2, a path: tax `+£16,398`, spending
     `-£141,092`, the end pot `-£282,517`.
   - **In the worst markets.** Rank S357F-own's paths by APP's own outcome, a fixed policy's. In the worst tenth, HSPA
     pays less tax than K2 and spends about the same or less. From the 2nd to the 10th percentile it ends 0.3 to 0.7
     years of target lower.
   - **What is left** is what the money earned: growth held, or spending taken early, into falling markets.
   - **The contrast with doubled bands.** The decomposition showed the band mechanism. On S333F's and S335F's lost paths,
     design A paid `£90,089` and `£121,825` more tax than K2, with end pots `£106,075` and `£129,178` lower. That shortfall
     was tax; HSPA's is not.
4. **The spread.** On the paths both keep, the spread of the log end pot is wider under HSPA on 36 of 40 units (`x0.954`
   to `x1.397`). The bottom is thinner and the top far richer: in S357F-own's best tenth, K2 ends with 754 years of
   target and HSPA with 1,391. That is the pot's pattern: capped lower, uncapped mean higher, median lower.
5. **The extra tax is the upside.**
   - S357F, over its five units: `+£208,096` a path. The best fifth of markets carries `+£249,755` of it; on the other
     four-fifths HSPA pays `£41,659` less.
   - S273: `+£34,192` a path, of which `+£52,001` in the best fifth and `-£17,808` elsewhere.
6. **It was measured once directly**, in the lead test's record: design A with doubled bands, seed 7002, the first 300
   paths of 28 units.
   - The risk held was `4.132%` a year against K2's `4.018%`, higher in each third of the plan.
   - The spending level in the first third was `0.963` of target against `0.942`.
7. **HSPA gains least where K2 misreads least.**
   - The survival change falls with K2's forecast error: Spearman `-0.52` over the 40 units, `-0.52` within own and
     `-0.48` within 45.
   - At 45, K2 is nearly right on the old couples, and there S025-45 loses. HSPA spends `+3.81%` more on the paths both
     keep, and its 39 lost paths end a few thousand pounds under a floor of `£22,400`.
   - HSPA's own forecast on S357F is within `0.3` of what it delivers, so the table knows the survival it is taking.

Evidence against:
1. **Step 8 records no tier, wrapper or yearly level.** The growth and the early spending are inferred from end totals.
   The only direct measure is design A's, with doubled bands, not HSPA's.
2. **The spread is just as wide where HSPA gains** (S351F-own `x1.173`, S349F-db `x1.397`), so growth alone does not set
   the sign.
3. **The two richest couples rank lower than K2's errors explain.**
   - **Ranked within each shape**, S273 and S357F come:
     - last and next to last in own and 90;
     - sixth and eighth of eight in gap8;
     - third and seventh in 45.

     Their summed rank is 54 against 36 expected (permutation p `0.0002`, post hoc).
   - **At like K2 errors, S273 still gains less than S355F.**
     - At 45 the errors are `-4.12` and `-4.39`, and the gains `+0.075` against `+0.187`.
     - At 90 the errors are `-4.59` and `-4.77`, and the gains `+0.506` against `+1.169`.
   - **The bands act on these two couples.** At 90, `k` is 1.111, close to one person's bands.
     - HSPA's forecast there is below what it delivers on 8 of 8 units.
     - The two richest couples' spending gains are the smallest: S273-90 `-0.1665%` (M1's unit) and S357F-90
       `+0.4229%`, against `+0.6279%` to `+4.0694%` on the other six.
4. **HSPA's forecast is optimistic on S273.** On four of S273's units it is above what HSPA delivers, by `0.52` to `0.82`
   points. That is a gap between the table and the couple, which a trade the table chose would not produce. On S273, part
   of the shortfall may be that gap.

**The write-up's lead, tested.** The lead was "one pair of bands priced at `k` misplaces a higher-rate couple's draws". It
does not hold as worded:
- the extra tax is the upside of the best markets;
- the lost paths carry no tax shortfall, unlike design A's under doubled bands.

What the records leave to the bands is three things: M1's unit (their cautious side at `k` 1.111), the forecast's sign by
`k`, and S273's optimism. The test's CEIL arm measures that gap.

## 3. The one test: the late tail replayed and taken apart

What it runs (EXPLORATORY, its rule committed before it runs):
- **Seed and settings.** Seed 7002, the pilot's seed (not held out), 4,000 paths a unit, 45 points, estate weight 0.02.
- **Code and configurations.** The launch's code, 71fb4271c681, with the registered configurations: K2 `21ca0ea6a7f0`,
  HSPA `e7913cca6fcd`. The fair-test gate as the arm read's.
- **Units (10).**
  - The seven below nought on 7024: S025-45, S273-own, S273-sppart, S357F-45, S357F-db, S357F-gap8, S357F-own.
  - M1's unit, S273-90.
  - Two controls where HSPA gained in the same shape: S349F-own and S355F-own.
- **Arms.**
  - APP, used to rank the markets; K2; HSPA.
  - **L:** HSPA's move with K2's spending level. **R:** HSPA's move with each person's tiers as K2 holds them. Each year,
    each variant asks K2's joint move at HSPA's own couple state, as the share replay's variants did, and takes that one
    part from it.
  - **CEIL:** the household table on its own plan, run beside: the decomposition's arm, built inside HSPA's band for
    gains.
  - Every arm records, at each decision, the spending level and the risk held (`whyRecord`'s measure), and each year's
    tax.
- **Checks.**
  - On the S025 and S273 units, K2 and HSPA must equal the pilot's arrays on its first 1,000 paths. A difference is a
    STOP.
  - A variant taking no part of K2's move reproduces HSPA bit for bit. A variant taking every part reproduces K2.
  - A planted fault, the spending level taken from the wrong arm, fails.

How it is read:
- **The shortfall, D.** Rank each unit's paths by APP's outcome and take the worst tenth. D is K2's mean end pot there
  less HSPA's, pooled over the seven units.
- **What explains it.** A variant explains the loss if it restores at least half of D. Its net whole paths lost against
  K2 are printed beside.
- **The outcomes:**
  - **R** restores half: the cause is the growth.
  - **L** restores half: the cause is the early spending.
  - Both restore half: both.
  - Neither, but CEIL's worst-tenth pot lies at least half way from HSPA's to K2's: the cause is the translation, the
    table reading the couple as safer than it is.
  - None of these: the cause is the draws, that is, where the money sits.

What each outcome changes:
- **The growth or the early spending, with CEIL no nearer K2 than HSPA is.**
  - The table makes the trade itself, on a right reading of the household. Nothing in the household plan is broken.
  - The maintainer's word on the default is then a word on that trade. That covers the three units below nought beyond
    noise, S357F as a couple, and M1's S273-90, the same trade's mirror at `k` 1.111.
  - Holding couples to survival more strictly than singles would be the maintainer's to ask for, not a build.
  - If the controls lose their gain under the same variant, the gain and the loss are one trade, and the report says so.
- **The same, but with CEIL near K2; or the translation.** The table reads the couple as safer than it is. The next build
  is the household's pension split carried year by year (design B, HOUSEHOLD.md section 2), EXPLORATORY on these units,
  before the default changes.
- **The draws.** The bands reach the richest couples through where the money sits. A variant taking K2's draw order comes
  next.
- **In every case** the read stands, nothing of seed 7024 runs, and the default changes only on the maintainer's word.

Cost:
- **Per path.** Each variant costs about K2's and HSPA's paths together, at the pilot's per-path costs. CEIL costs a
  single's path.
- **In all.** About 10 core-hours: under three hours on four free cores, once the savings split's preflight has
  finished.
- **Time.** Half a day to build L and R with their checks, and half a day to read.

## 4. Open items the result moves

- **T-GAPS: a couples' line, now measured.**
  - HSPA's forecast is within a point on 40 of 40 units (mean `+0.099`), and its sign follows `k`:
    - at `k` 1.111: mean `-0.368`, below what it delivers on 8 of 8;
    - at `k` 1.667: `+0.206`, above on 19 of 24;
    - at `k` 1.818: `+0.244`, above on 7 of 8.
  - K2's product of two tables is no forecast (mean `-10.909`).
  - This is a known limitation, not a gate. The test's CEIL arm measures it.
- **A new line: the household plan's late tail.**
  - Its measured effect: seven units below nought, from `-0.019` to `-0.281`. Three are beyond noise and under D34's
    threshold. S357F pooled is `-0.043` (`-0.104` to `+0.019`).
  - A decision rests on it: the change of default.
  - It closes by the test in section 3.
- **COUPLE-SHARE (closed).** Its closing entry names the household plan's restart, and step 8 is that restart's
  registered PASS. Nothing else in it moves.
- **Not moved: the guard (D128, D129 (4)).** Every unit was inside today's guard, so step 8 says nothing about the
  couples it keeps on the app's rules. The arm read's figures on those couples are in sample, on seed 7002.
