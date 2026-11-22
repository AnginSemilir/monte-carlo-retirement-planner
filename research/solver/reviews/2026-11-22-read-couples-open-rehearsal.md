Verdict: FAIL

# Review at the read: the guard's own units, the dress rehearsal (COUPLES-OPEN.md step 1, D139; EXPLORATORY, seed 7002)

Subject: the read `results-couples-open-rehearsal.txt` and its write-up `reports/2026-11-22-couples-open-rehearsal.md`
(both 9967787c); the run launched 22 Nov 11:40 UK through the launcher from c4e86633 (`runs.log`'s last line; 44 records
and 44 logs in `results/couples-open-7002`); the plan `COUPLES-OPEN.md` and D139 (STATE.md l.24).

Read (blobs). At 9967787c: the write-up 12050c3b399e, the read 09809867d079, `COUPLES-OPEN.md` bd838f533a20, STATE.md
7ab742e50d51. At c4e86633 (the launch tree, `/home/user/co-read`): `couples-open-panel.mjs` cd651b8899ae,
`audit-couples-open.mjs` e12d16ffb5e5, `reduce-couples-open.mjs` f9e071387b9e, `batch-couples-open.sh` 05dcde6fc2fb,
`couples-open-panel.json` 55ada2a3c0a5, `results-couples-open-panel.txt` ae5aad63f040, `shapes-panel.mjs` af92d5e2e71a,
`audit-couples.mjs` f50aa99da601, `audit-phase4.mjs` 5ace83959b96, `share-rules-panel.mjs` 168dcae982f6,
`reduce-household-hsp.mjs` 153cbfeebc48, `reduce-share-rules.mjs` b46fa5187e99, `reduce-couples.mjs` cae05c5a8e75,
`reduce-phase4.mjs` ac319aad1f44, `fair-gate.mjs` c6b3e87e1643, `code-id.mjs` f00aa5b3bd48,
`household-port-identity.mjs` 7dda22276ba2, `results-shapes-beside.txt` 916e4641b01d, `results-guard.txt` 56df67561cdf.
The app's route: `src/solverClient.js` bd27a8004521 (`startSolve`, l.243 to 346), `src/solverWorker.js` a60761ccc464
(l.92 to 182), `src/solverCouple.js` c85332888894, `src/solverApp.js` a822d56e2e09, `src/solverSettings.js` 9b833da7e794,
`src/solverStrategy.js` df881f8dd151 (`solvedContext`, l.45), `src/solver/household.js` 06b69ec74e77,
`src/couplesSwitch.js` b33f855de049, `src/useSolver.js` c9b94ff81c9f and `src/App.jsx` l.8750 to 8778 (`SOLVER_OPTS` is
null: the page hands `startSolve` no options). For what the write-up says of the registered test: the draft
`registrations/couples-open.md` 1686fc4641a6 and `DECISIONS-PENDING.md` d0118c7e55d4 (83827730). No file under `src/`
changed between c4e86633 and 83827730. Nothing of seed 7026 was opened.

Ran (scripts in the session's scratchpad; nothing in either tree edited; seed 7002 only):
- From the launch tree: `reduce-couples-open.mjs --planted` PLANTED: ALL PASS (7); `couples-open-panel.mjs --planted`
  planted (38): all read as they should; `audit-couples-open.mjs --planted` planted (9): all read as they should.
  `code-id.mjs` 36e4d2a860b2 and `stampFilesHash()` a4ef3698d92c: the run's.
- `reduce-couples-open.mjs` from the launch tree on the main tree's `results/couples-open-7002`: exit 0, every line from
  the second the committed file's byte for byte (the committed first line adds a parenthesis the script does not print).
- The main tree's stamp today is 1e8f1095a9fb. The stamped files that differ from the launch tree's are `held-out.mjs`
  (e54b3178) and, since 83827730, `audit-couples-open.mjs`, `batch-couples-open.sh` and `reduce-couples-open.mjs`.
- For each of the 44 units: arm A's MPAA ages (the ones the audit puts in ROUTE's engine context) against the household
  plan's own (the ones the page's `solvedContext` reads).
- S357F-Y90 solved again from the launch tree (its tables match the record's digests). Its 4,000 ROUTE paths were run on
  the page's own context and compared, array by array, with the record.
- From the 44 records: each unit's lifetime tax and mean pot in pounds, spending on the paths both keep with its interval,
  and spending over all paths.
- The registered panel (83827730, `REG=1`): the same MPAA comparison, for finding 2's reach. No path was run.

## What holds

1. **Every figure in the write-up is the read's.** This covers the class table, the harm line (S351F-RY75 16 lost, 225
   saved, threshold 37), S025's seven units with their survival and pot ranges, the pot's ranges, lifetime tax's range
   and the times. The read reproduces from the launch tree.
2. **The rule as coded is `COUPLES-OPEN.md`'s rule, applied per class.**
   - Part 1: `harmExact` flags a unit when lost less saved exceeds a whole-path threshold. The threshold comes from the
     upper bound on the realised discordance (D34).
   - Part 2: `survivalItem`, taken by path; the interval's lower end must be above 0 (`reduce-couples-open.mjs` l.94).
   - Part 3: `keptSpend`. Each unit's change is taken in percent of APP's mean on the paths both keep, the units are
     weighted equally, and the point must be at or above -0.05.
   - Each part fires on its plant (but see finding 5).
3. **ROUTE is the page's route on the plan as the library holds it.**
   - The household route: the cut, then the table at 45 points inside the cut's bands with the partner's age, then the
     assembly at the even split, with the top three, the tie-break and the hold passed as the page passes them.
   - The fallback, on a refusal matched by the page's own regex: `couplePlans` at 'pots', each table solved with the
     partner's age, then `assembleCouple` with `appJoint()`.
   - The page adds no other option (`useSolver.js` l.66; `solveForApp`'s default points are `APP_POINTS`).
   - ROUTE's plan carries the library's Bracket Fill Basic with phased drawdown on all 44 units. `solverPlanOf` changes
     the policy only where the deposit order differs, and here it never does. APP runs arm A's pick, which takes the lump
     sum on 18 units. That is the household line's convention (D36, D37): the solver on the plan as entered, against the
     app's rules at their best policy.
   - The one other difference from the page is finding 2's. It changes no path here.
4. **Every unit is one today's guard keeps off, for its class's reason and on its route.**
   - This is checked before any solve (audit l.149 to 151), recorded, and read again by the gate.
   - The logs of the 8 units on today's route give `householdPlanFor`'s refusal. Four say "Pensions hold different risks
     (High Risk, Medium/High Risk)" and four say "a later retiree paid or saving in plan year 0". All 8 are at the share
     0.25.
   - The first person is the elder in all four couples (68/65, 45/42, 37/34, 37/34), and S75's two are the same age
     (`elderOf` is null). So `swapOf` (`src/couplesSwitch.js` l.86) is false on every unit, and the page would hand none
     of them over on its mirror.
5. **Reading from the launch tree is sound.**
   - Its code id and audit stamp are the run's. The code id hashes `research/engine.mjs`, and the gate refuses an audit
     stamp that does not match its own tree's files.
   - The only stamped file that had changed at the time of the read, `held-out.mjs`, is read only by the panel's `freeze`,
     which the rehearsal never runs.
   - The reducer prints no figure before its gate (l.180 to 186), so the refused first read showed none.
   - Since 83827730 the main tree's audit, batch and reducer differ too, so any later re-read must also be from a tree at
     c4e86633.

## Findings

1. **BLOCKING. "Every class can be registered as it stands" (the write-up, l.63) does not follow from the read. As
   designed, the registered test can pass while a measured harm is present.**
   - **Today's route is read only in class R, and at one holding.** That holding is the younger partner holding 75%,
     with the first person's table on 0.25 of the spending. None of the R units has an age gap over three years or any
     other taxable income (`results-couples-open-panel.txt` l.12-13, 24-25, 36-37, 48-49; the logs' share 0.25). Y, E, S
     and G ran on the household route only (36 units).
   - **A class's pass lifts its reason in `src/couplesSwitch.js` on both routes.** See `COUPLES-OPEN.md` l.56 to 59,
     `DECISIONS-PENDING.md` OPEN item 2, and the draft's Outcomes ("G opens: `DB_GAP_UP_TO` lifts"). And every couple
     whose shape `householdPlanFor` refuses takes today's route (`src/solverClient.js` l.255 to 260 and 298 to 346).
   - **Today's route is where the `gapincome` guard's own evidence was measured.**
     - K2 less APP: -6.800 on S147-db@gap8, -10.950 on S147-db@gap12, -20.250 on S061-dbpart@gap12.
     - The household plan on the same units: +12.575, +10.900, +9.250 (`results-shapes-beside.txt` l.41, 42, 49).
     - Once G opens, a G couple 8 or 12 years apart with a DB pension would run on today's route if its shape is
       refused. That happens with the elder retired and the younger still paid in plan year 0, which `COUPLES-OPEN.md`
       l.39-40 calls a shape "real couples often have", or with the two pensions at different risks. No unit in the
       design reads that case.
     - Nor does G read the two incomes that showed harm: the partner's DB pension (S061-dbpart's) and rent
       (`results-guard.txt` l.12, S149@gap12+rent, -6.850). G reads only the elder's DB pension.
   - **The same gap applies to E95/E100, S75 and Y90/Y100.** No unit reads them on today's route. There, one person's
     table carries 5% to 25% of the spending under the pots' share (E100 runs at the share 0.95, by my check of
     `couplePlans`). Yet R's pass would put a refused couple at any of those holdings on today's route (the draft: "R
     opens: ... runs on today's route outside today's band too").
   - **Needed, before the registration's design review.** One of these two:
     - add today's-route units for each class whose opening reaches today's route: at least G8 and G12 with a refused
       shape (the partner's DB pension beside the elder's), and E95 or E100 and S75 with a refused shape; or
     - open each class on the household route alone. A couple the household plan refuses would then keep the app's
       rules unless class R reads its holding, gap and income. The draft already reads the refusal before the band lifts
       when R stays; extend that to G and to the holdings R does not read.
   - The write-up's "What it does not show" should also say which route each class read. The figures and each class's
     outcome by the rule stand.

2. **MINOR. ROUTE's engine context carries arm A's MPAA ages (`audit-couples-open.mjs` l.156, 163), not the household
   plan's own.** The page's `solvedContext` reads the household plan's own ages (`src/solverStrategy.js` l.45), which
   `prepareForSolve`'s `resolveMpaa` sets.
   - On 43 of the 44 units the two sets of ages agree. On S357F-Y90 arm A's are 58/60 and the page's 58/58: the
     solver's plan keeps the library's Bracket Fill Basic with phased drawdown, while arm A took Bracket Fill with the
     lump sum.
   - On the page's own context, with the record's own tables, 0 of S357F-Y90's 4,000 paths differ in any of the seven
     arrays. So the read stands, and "the guard alone bypassed" holds in effect here.
   - The registered test runs the same audit, and on its panel the ages differ on 13 of 44 units: S037-G8Y75,
     S037-RWY75, S119-RWY75, nine of S199's eleven, and S279-RY75. For example, on S279-RY75 arm A's ages are 60/60 and
     the page's 58/58. Its first person keeps working to 60 with a pension contribution of `£6,960` growing 3% a year,
     which passes `£10,000` near 58, so the cap may bind there under the page's ages and not under the audit's. This is
     unmeasured.
   - The fix: run ROUTE on the page's own context, or print the identity per unit as `household-port-identity.mjs` did.

3. **MINOR. "Where APP pays little tax it also spends far less" (l.55-56) is contradicted by the records.**
   - S351F-RWY75, the +2024.776%: APP pays £7,063 a path against ROUTE's £150,070, while delivering only 1.1% less on
     the paths both keep (£1,974,318 against £1,996,686).
   - S357F-RWY75: tax +271.849%, with spending +0.943%.
   - S025's units other than G8, G12 and G8Y75: APP pays £375 to £1,751 a path, and on the five of them among the
     seven below it delivers more than ROUTE on the paths both keep.
   - The percentage is large because APP's base is small. The reason the write-up gives is not shown.

4. **MINOR. The write-up does not say what S025's lower spending means.**
   - Over all paths, saved paths included, ROUTE delivers less lifetime spending than APP on nine of S025's eleven
     units: from -0.385% (Y100) to -2.871% (RY75). Only Y75 (+0.574%) and Y90 (+0.485%) are higher. These come from the
     run's own records; the read prints spending only on the paths both keep.
   - All seven of the write-up's units are below beyond noise on the paths both keep (for example E95 -0.1195%, -0.2076
     to -0.0313).
   - So for the panel's one couple already retired, the survival gain (+12 to +15 points) is paid for in lifetime
     spending, not only in spending on the paths both keep. The money stays in the pot (mean pot +28% to +105%).
   - The registered read should print spending over all paths beside the rule (the draft says it will) and name such a
     unit.

5. **MINOR. The planted checks cannot show three things the registered read will rely on (CHECKLIST 5).**
   - Part 2's plant (`same`, `reduce-couples-open.mjs` l.138) has a degenerate interval [0, 0]. It cannot show that the
     code reads the interval's lower end rather than its point.
   - Part 3's plant is a 1% drop, twenty times the bar. It would still pass with the bar set at -0.5%.
   - Several of the gate's refusals have no plant:
     - an audit stamp other than the read's own files (l.56, the refusal that stopped the first read);
     - another count of points, estate weight or Node version (l.55, 61-62);
     - a unit that is not part of the read (l.53);
     - an arm missing (l.67);
     - a log whose stamp is not its unit's (l.77).
   - Plant each of them before the registered read.

6. **MINOR. Class R's RWY75 depends on a refusal that `COUPLES-OPEN.md` step 4 plans to remove.** Step 4 (l.60-66) builds
   "a later retiree paid or saving in plan year 0" into the household plan. If that lands before the registered run,
   RWY75 takes the household route and the panel's route check refuses it (`couples-open-panel.mjs` l.147-156; audit
   l.95). If the panel is landed again, RWY75 leaves class R, and R reads one shape on today's route. The registration
   should fix which code it runs on relative to step 4.
