Verdict: FAIL

# Review at the read, second look after one fix: the guard's own units, the dress rehearsal and its addendum (COUPLES-OPEN.md step 1 and amendment 1, D139; EXPLORATORY, seed 7002)

Subject: the fix to my first verdict (`reviews/2026-11-22-read-couples-open-rehearsal.md`: FAIL, one BLOCKING and five
MINOR). That covers `COUPLES-OPEN.md` amendment 1 and its machinery (ebfd2854, 3f9bd2d2), the corrected rehearsal
write-up (17ff9398), and the addendum's read and write-up (046eafb5). The registered read in two parts (75dc7015) comes in
only for what it means for the registered test. D140 (32db18ad, 39b5b445) is not part of this read.

Read (blobs).
- At 046eafb5:
  - the write-ups: `reports/2026-11-22-couples-open-rehearsal.md` c3f08e23f94e, `reports/2026-11-22-couples-open-addendum.md`
    e6f1afc9f766;
  - the results: `results-couples-open-addendum.txt` 0f8c68f51ab3, `results-couples-open-rehearsal-beside.txt`
    7fa45cad9574, `results-couples-open-rehearsal.txt` 09809867d079, `results-couples-open-panel.txt` ee38b84cc44a;
  - the plan and registration: `COUPLES-OPEN.md` a9da7da50ed5, `registrations/couples-open.md` 65e2dcd57ba1;
  - the panels: `couples-open-panel.json` 259df2fb182d, `couples-open-registered-panel.json` 4e755f2cad14;
  - STATE.md 5b7ac80b6122, `DECISIONS-PENDING.md` aac3c4861036;
  - the scripts: `audit-couples-open.mjs` 8e8f001db827, `reduce-couples-open.mjs` 71ecafa5dbed, `size-couples-open.mjs`
    b61f177c40f4.
- Today's route as measured before, at 046eafb5: `results-shapes-beside.txt` 916e4641b01d, `results-guard.txt`
  56df67561cdf, `results-guard-beside.txt` ffd8eb74b44d, `results-household-arm.txt`, and `HOUSEHOLD-ARM.md` (its K2).
- At 3f9bd2d2, the launch tree `/home/user/co-add-read`:
  - the scripts: `audit-couples-open.mjs` 554440cf20f1, `reduce-couples-open.mjs` 4befac733c03, `couples-open-panel.mjs`
    07a0afc6ff2c, `batch-couples-open.sh` c4f7c5df9c75, `couples-open-beside.mjs` 4b3c6f33042a;
  - the helpers: `shapes-panel.mjs` af92d5e2e71a, `share-rules-panel.mjs` 168dcae982f6, `reduce-share-rules.mjs`
    b46fa5187e99, `run-from-snapshot.sh` cf7ab99bb4ec, `code-id.mjs` f00aa5b3bd48;
  - the app's route: `src/solverStrategy.js` df881f8dd151 (`solvedContext`, l.45), `src/solverWorker.js` a60761ccc464
    ('household' and 'couple' l.163 to 182, 'simulate' and 'runs' l.184 to 192), `src/solverClient.js` bd27a8004521
    (l.243 to 346), `src/solverCouple.js` c85332888894, `src/solver/household.js` 06b69ec74e77, `src/couplesSwitch.js`
    b33f855de049.
- No file under `src/` differs between 3f9bd2d2 and 046eafb5.
- The run itself: the 20 records and logs in `results/couples-open-7002-add`; the landings' `added` records in
  `results/couples-open-land/`; the launch log `couples-open-addendum.log` and `land-addendum.log` in the session's
  scratchpad.
- Nothing of seed 7026 was opened. Of the pilot now running, I read only the stamp and title lines of
  `results/couples-open-pilot/case0.txt`.

Ran. Every script and probe ran from the session's scratchpad. Nothing in either tree was edited, and only seed 7002 was
used. Everything ran at nice 19 beside the pilot, from 17:32 to 17:42 UK; the two planted audits' solves took one core each
from 17:34:32 to 17:34:52 and from 17:34:57 to 17:37:18.
- `diff -rq` of the launcher's snapshot `/tmp/solver-snap-zAODED` against the launch tree (`research/` with its results
  aside, and `src/`): no difference. Its `research/engine.mjs` is also the main tree's, byte for byte.
- From the launch tree: `code-id.mjs` gives 36e4d2a860b2 and `stampFilesHash()` gives 3950db521eac. The main tree's stamp
  is now 30243f8b4a5e. `configOf` gives APP ef459a5c8ccb and ROUTE 35ee3a2dc6ad in both trees.
- `reduce-couples-open.mjs --addendum`, from the launch tree, on the main tree's `results/couples-open-7002-add`: exit 0.
  Its output is the committed results file, byte for byte.
- `couples-open-beside.mjs`, from the launch tree, on `results/couples-open-7002`: the committed beside file, byte for
  byte.
- The planted modes:
  - `reduce-couples-open.mjs --planted`: ALL PASS (11 in the launch tree, 12 in the main tree);
  - `couples-open-panel.mjs --planted`: 55, all as they should;
  - `audit-couples-open.mjs --planted`: 12 on the rehearsal panel, 12 with `REG=1`, 13 from the main tree.
- Three mutants of the launch tree's reducer, built in the scratchpad: part 2 read on the point; `SPEND_BAR` set to
  -0.5; the context refusal removed.
- The two panels at 3f9bd2d2, compared field by field with c4e86633's and 83827730's.
- Two read-only probes (no solve, no path):
  - the guard and the route of the six couples on which today's route was measured below the app's rules, as they stand
    and with the partner's pension one profile safer (finding 1);
  - each base couple's own incomes and pensions.

## What holds

1. **The addendum's read is sound, and was made from the tree it ran on.**
   - The launcher's log gives the snapshot "from 3f9bd2d2" with no uncommitted file. The snapshot is the launch tree
     (above).
   - All 20 logs carry the launch tree's code id and audit stamp.
   - The main tree's stamp differs, because 75dc7015 changed the audit and the reducer. So the read could pass its gate
     from the launch tree alone.
   - The gate is the rehearsal's, on the addendum's 20 units (`unitsOf(panel, 'addendum')`), with two refusals added:
     ROUTE on another context, and a class on another route.
   - The rule is applied to each class on its own (`rule`, `CLASSES`).
   - The read reproduces byte for byte. It was committed once, two minutes after the last unit finished. I cannot see
     whether it was opened more than once, but nothing prints before the gate.
2. **Every figure in the two write-ups is in its results file.**
   - The addendum's write-up: the table, the harm line (S025-RG8: 101 lost, 346 saved, a threshold of 46), G12P's
     survival ranges, M1's four units with their ranges, and the times.
   - The corrected rehearsal write-up: every figure it adds is in the beside file, which reproduces.
   - Its tax claim (on the eleven units where APP pays least, ROUTE spends less on five) is the beside file's last line.
     I counted it by hand.
3. **MINOR 2 is answered: ROUTE runs on the page's own context, on both routes.**
   - The page's worker runs a solved couple's paths on `solvedContext(E, solved)`: 'simulate', and 'runs' through
     `strategyRuns`.
   - There `solved` is what `householdSolved` or `assembleCouple` returns, from what the client asks (`src/solverClient.js`
     l.243 to 346): on the household route, the household at the even split with the top three, the tie-break and the
     hold; on today's route, `couplePlans` at 'pots' and `appJoint()`.
   - `solveRoute` builds the same two objects with the same arguments, and `routeContext` calls the same function. The
     record names the context (`routeCtx`), and the gate refuses any other.
   - Planted, the household route: S357F-Y90 carries 58/58 against arm A's 58/60.
   - Planted, today's route (`REG=1`): S279-RY75 carries 58/58 against 60/60.
   - The plant 'armages' is caught on each.
   - In the addendum itself, S357F-RS75 (today's route) ran on 58/58 where arm A's ages are 59/58 (`results-couples-open-addendum.txt` l.29).
4. **MINORs 3 and 4 are answered.**
   - The tax account is corrected.
   - Spending over all paths is printed, by unit and by class, and the units below APP beyond noise are named: in the
     beside file for the rehearsal, and in the reducer for the addendum and the registered read.
   - M1 names units by unit.
   - S025's pattern is stated in both write-ups. The figures match.
5. **MINOR 5 is answered.**
   - Part 2's plant is now a gain within noise, +0.45 points with the interval below nought.
   - Part 3's plant is at its bar: -0.06% stays, -0.04% opens.
   - The gate's refusals I listed are now planted, and each fires: another audit stamp, another count of points, another
     estate weight, another Node version, a unit not of the read, an arm missing, and a log's stamp.
   - Each of my three mutants fails exactly its planted check and no other.
6. **MINOR 6 is answered.**
   - The registration runs on 36e4d2a860b2, before step 4.
   - The registered mode refuses any other code id, and the code id covers `src/solver/household.js`, where
     `householdPlanFor` lives.
   - The panel's route check would refuse RWY75 as well.
7. **The added units are as amendment 1 says.**
   - The 20 landed on 36e4d2a860b2 (head ebfd2854; the panel script is unchanged to 3f9bd2d2), arm A from 84.0% to 86.0%.
   - Each is off by the guard for its reason and on its route.
   - In both panels, the original 44 units are the same field for field, except `cls` (R becomes RY).
8. **A class the addendum harmed would have been handled as amendment 1 says.** None was.
   - The reducer prints such a class as going to the maintainer with its units. In its planted case, harmed G and RG
     stay and the other classes open.
   - Amendment 1 keeps such a class out of the registration (`COUPLES-OPEN.md` l.105).

## Findings

1. **BLOCKING. BLOCKING 1 is answered only in part. On today's route the registered test can still pass while a measured
   harm is present. So the addendum's "Every class can be registered" (l.49) does not stand for RY, RE and RG, and nor
   does the rehearsal write-up's "so that today's route is read at each reason" (l.85 to 89).**
   - **Today's route has been measured below the app's rules on six couples of these classes' reasons.** The latest
     measurement is on 19 Nov's code (71fb4271c681, after the ISA fix: `results-household-arm.txt`, its K2 today's
     two-table route with the pots' share and LOOKHOLD, `HOUSEHOLD-ARM.md` l.31).
     - `gapincome`, class RG:
       - S147-db@gap8: K2 78.83% against APP 85.63% (l.61);
       - S147-db@gap12: 75.40% against 86.35% (l.62);
       - S061-dbpart@gap12: 66.40% against 86.65% (l.69);
       - S149@gap12 with `£15,000` a year of rent from now: -6.850 points (-7.622 to -5.984), 355 paths lost against 81
         saved (`results-guard.txt` l.12, code 603eeb595679).
     - The younger partner holding more than 60%, class RY: S061-dbpart@penB90, the first person holding 17.5%: 76.75%
       against 86.92% (l.72).
     - Either partner holding more than 90%, class RE: S061-dbpart@penA100, the first person holding 94%: 85.03% against
       87.88% (l.73).
     - Step 5 read the same five units at the same sizes (`results-shapes-beside.txt` l.41, 42, 49, 52, 53).
     - On the household route every one of them reads well above the app's rules: HS less APP from +9.250 to +12.950
       (the same lines), and HSPA from +14.825 to +31.625 points above K2 (`results-household-arm.txt` l.61 to 73). The
       household route's classes are not in question here.
   - **Each of the six couples is one that RG, RY or RE would open.** My probe ran on the code the panel was landed on,
     with no solve:
     - each is kept off by today's guard for that class's reason;
     - as it stands, each goes to the household route;
     - with the partner's pension one profile safer (the addendum's refused shape, `otherRisk`), each goes to today's
       route, and the guard keeps it off for the same reason.
   - **No unit reads them.** None of the six, nor its base couple (S147, S061, S149), is in the rehearsal, the addendum
     or the registered panel. The registered panel holds only untouched couples, by design.
   - **The addendum shows that units carrying the same features on other couples cannot stand in for them.**
     - RG12P carries S061-dbpart's own feature, the partner's `£15,000` DB pension from the state pension age
       (`share-rules-panel.mjs` `withFeature 'dbpart'`), at 12 years apart, on today's route.
     - On all four couples it is above the app's rules, losing 2, 1, 0 and 0 paths (`results-couples-open-addendum.txt`
       l.36, 38, 40, 42). On today's route S061-dbpart@gap12 loses 20.25 points.
     - The guard test found the same for the elder's DB pension (`DECISIONS-PENDING.md` l.466: "No key fits what has been
       seen").
     - The harm goes with the couple, not with the feature the panel adds. Four held-out couples given the feature can
       pass while it is present.
     - The addendum write-up's G bullet (l.35 to 37) gives the household route on S061-dbpart's case, and not today's.
   - **On the panel's own shapes, too, today's route is the weaker route.** The same plan at the same target: S025-G8 on
     the household route loses 0 paths and saves 558 (`results-couples-open-rehearsal.txt` l.43); S025-RG8, with the
     partner's pension one profile safer, on today's route loses 101 and saves 346 (`results-couples-open-addendum.txt`
     l.35).
   - **Rent.**
     - BLOCKING 1 named rent as one of the two incomes that showed harm (first review l.99 to 100). Amendment 1 answers
       the other, the partner's DB pension (G12P, RG12P), and does not mention rent.
     - Every unit's income is a DB pension from the state pension age (68). On S025, and on the registered panel's
       S037, the elder is 68 now, so the income runs from the plan's first year, as the state pension does.
       No unit has such an income before the state pension age. That is where the rent ran: S149 retired at 55 and
       the rent ran from 56 (`results-guard-beside.txt` section 1).
     - The app cannot tell rent from a DB pension (D128). So RG's opening reaches such an income on today's route,
       where it was measured harmful (S149@gap12).
     - The registration's list of what a pass reaches (l.93, "incomes other than a DB pension of the elder's") would
       leave that reach to inference.
   - **Needed before the registration's design review, one of:**
     - **The six couples with a refused shape.**
       - Take each with the partner's pension one profile safer, landed as the panel's units are (arm A `85 +/- 1%` on
         1,000 paths of seed 7005, code 36e4d2a860b2).
       - Run ROUTE against APP on 4,000 paths of seed 7002, read by step 2's rule. This is EXPLORATORY and, at the
         addendum's speed, under an hour on four cores.
       - A unit flagged by D34 keeps its class out of the registration, as amendment 1 does for a class the addendum
         harms.
       - RG should also carry, on each registered couple not yet at the state pension age, an income from now (the
         guard test's `£15,000` rent). Otherwise its D-line should say that this reach rests on S149's one unit.
     - **Or register the household route's classes alone.** Today's route's reasons would keep the app's rules until
       those couples have been read.
   - The figures of both reads stand, and so does each class's outcome by its rule. This finding is about what they are
     said to show for the registration.
