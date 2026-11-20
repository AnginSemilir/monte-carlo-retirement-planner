# The household plan's late tail, taken apart (D134 (1); the deep review of step 8, `reviews/2026-11-20-deep-household-hsp.md` section 3)

EXPLORATORY. This rule is committed before any unit runs. It changes no default, gate or candidate. It decides one
thing: whether step 8's build may go to `main` (D134 (1)). If the household table reads the couple as safer than it is,
the build stops and comes back to the maintainer.

## The question

Step 8 read PASS (`results-household-hsp.txt`), but HSPA kept fewer paths than K2 on seven of its 40 units, three of them
beyond noise. All seven were under D34's threshold. The deep review's leading cause, a lead: the household table runs
the couple's money as one household, which it rightly reads as safe. So it cuts less early and holds more growth than
K2's two tables, each of which reads its own part as short. In the worst markets it then ends nearer its minimum pot, and
the paths it loses fail late. This test takes HSPA's move apart on those units to say which part of it, if any, makes
the loss.

## Units, seed and settings

- **Units (10),** from step 8's panel (`household-hsp-panel.json`):
  - the seven below nought on seed 7024: S025-45, S273-own, S273-sppart, S357F-45, S357F-db, S357F-gap8, S357F-own;
  - M1's unit, S273-90;
  - two controls, where HSPA gained in the same shape: S349F-own and S355F-own.
- **Seed and paths:** seed 7002 (the pilot's seed, not held out), `4,000` paths a unit; 45 points; estate weight 0.02.
- **Code:** the launch's, 71fb4271c681. K2 and HSPA at step 8's registered configurations (`audit-household-hsp.mjs`
  `configOf`), each unit built as step 8's audit built it.

## Arms

All arms run on the same paths of each unit, scored by the engine.
- **APP:** arm A, the app's rules. It ranks the markets.
- **K2:** today's couples' default, as in step 8.
- **HSPA:** the household plan, as in step 8.
- **L:** HSPA's move, but with K2's spending level. Each year K2's joint move is asked at HSPA's own couple state (the
  engine's state on L's path), and its spending level replaces HSPA's. Everything else is HSPA's.
- **R:** HSPA's move, but with each person's tiers as K2's move holds them at that state.
- **CEIL:** the household table on its own plan (`bridge.js` `withTable` on the household plan, built inside HSPA's
  priced bands), run beside as the decomposition ran it.

Each arm records, per path: survival, the year of failure, the end pot, lifetime tax and spending delivered. Every table
arm also records, at each decision, the spending level it takes and the risk it holds (the held tiers' expected real
return, `audit-household.mjs` `whyRecord`'s measure), and each year's tax.

## Checks, before the read decides anything

1. **The pilot.** On the four units step 8's pilot ran (S025-45, S273-own, S273-sppart, S273-90), K2 and HSPA must equal
   the pilot's arrays (`results/household-hsp-pilot`) on its first `1,000` paths: survival, the end pot, tax and spending
   delivered. A difference is a STOP.
2. **The variants' wiring.** On each unit's first 200 paths, a variant taking no part of K2's move must reproduce HSPA bit
   for bit, and one taking all of it must reproduce K2. Each variant calls both choosers every year, whatever it keeps,
   so these show that asking K2's chooser leaves HSPA's path alone, and the other way round.
3. **What each variant takes.** On those 200 paths, L's level must be K2's at each decision, and R's tiers K2's. The
   planted fault, L taking HSPA's own level (`LT_PLANT=wronglevel`), fails this check.
4. **The engine.** Each arm's first 200 paths are held to `E.runTrial`.

## The read

- **The worst tenth.** Rank each unit's paths by APP's end pot, lowest first, ties by path, and take the lowest tenth
  (`400` paths a unit).
- **The shortfall, D.** For each of the seven units below nought, K2's mean end pot on its worst tenth less HSPA's. D is
  the mean of the seven, in pounds a path.
- **What explains it.** For each variant V and for CEIL, its restoration is the mean over the seven units of V's
  worst-tenth mean end pot less HSPA's. V explains the loss if D is above nought and V's restoration is at least half of
  D.
- **The outcome**, printed once, by these lines in order:
  1. **NO SHORTFALL:** D at or below nought. The late tail is not in the end pot of the worst markets, and the build goes
     on.
  2. **THE GROWTH:** R explains it and L does not.
  3. **THE EARLY SPENDING:** L explains it and R does not.
  4. **BOTH:** L and R each explain it.
  5. **THE TRANSLATION:** neither L nor R explains it, and CEIL restores at least half of D. The table reads the couple
     as safer than it is.
  6. **THE DRAWS:** none of these. The cause is where the money sits.
  - A second line, **CEIL NEAR K2**, is printed under outcomes 2 to 4 where CEIL also restores at least half of D.
- **What each outcome does to step 8's build** (D134 (1)):
  - **1, or 2 to 4 without CEIL NEAR K2:** the table makes the trade itself, on a right reading of the household. The
    build goes on to `main` on B1's gate, with this read reported. A wish to hold couples to survival more strictly
    than singles would be the maintainer's to ask for, not a build.
  - **2 to 4 with CEIL NEAR K2, or 5:** the table reads the couple as safer than it is. The build stops before `main` and
    comes back to the maintainer, with design B (the household's pension split carried year by year, `HOUSEHOLD.md`
    section 2) as the next step.
  - **6:** the build stops before `main` and comes back to the maintainer, with a variant taking K2's draw order as the
    next test.

## Beside, deciding nothing

- Each variant's and CEIL's net whole paths lost against K2, by unit and pooled over the seven.
- The controls (S349F-own, S355F-own): each arm's survival and worst-tenth end pot against K2. If a control loses its gain
  under the variant that explains the seven, the gain and the loss are one trade, and the read says so.
- On the worst tenth, by unit and arm: the mean spending level and the mean risk held over the first ten retired years
  and from the eleventh on, and lifetime tax.
- M1's unit, S273-90, on the same lines.

## Cost and box

About 10 core-hours: each variant costs about K2's path and HSPA's path together, CEIL a single's path. That is under
three hours on four free cores, run after the savings split's preflight and pilot. Through the launcher as an
EXPLORATORY run on frozen code. Box: half a day to build with its checks, half a day to read.
