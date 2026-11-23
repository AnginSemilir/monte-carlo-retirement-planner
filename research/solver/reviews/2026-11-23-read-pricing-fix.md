# Review at the read: the pricing fix (`PRICING-FIX.md`, candidate A, the form 'pensionsPAown'; EXPLORATORY, seed 7002), read 23 Nov

**Subject:** the read and its write-ups, all in 838f7dfb.
- The read is `results-pricing-fix.txt` 983a2b46560c (FIX DOES NOT HOLD). `reduce-pricing-fix.mjs` wrote it over
  `results/pricing-fix-7002`.
- The write-ups are `reports/2026-11-23-pricing-fix-read.md` f77589e8c880, STATE.md section 5's pricing sentence
  (6ec7e44ec821) and DECISIONS-PENDING.md's new top entry (ccd97c21cead).
- The beside is `pricing-fix-beside.mjs` de6813d052e2, with `results-pricing-fix-beside.txt` a65f52d59566.

**What I read** (git blobs, first 12):
- The rule is `PRICING-FIX.md` 6f86a0a9404f at 5910b162 and 635a84437f66 at 33d50fb1, which is also HEAD's.
- The machinery:
  - `reduce-pricing-fix.mjs` abf424667893, unchanged since 5910b162;
  - `audit-pricing-fix.mjs` f4345b612930, 33d50fb1's;
  - `batch-pricing-fix.sh` 40937c4c9ff6.
- What they reuse:
  - `audit-couples-trade.mjs` 8f7086d175d5 (`solveHouseholdAt`, `runRec`);
  - `reduce-couples-trade.mjs` b529bddf4099 (`shortfallOf`, `keptGBP`);
  - `audit-couples-open.mjs` 8ccaa3118266 (`solveRoute`, `unitProblems`, `CONFIG`);
  - `reduce-share-rules.mjs` b46fa5187e99 (`harmExact`), `reduce-phase4.mjs` ac319aad1f44 (`survivalItem`, `byPath`) and
    `fair-gate.mjs` c6b3e87e1643;
  - `couples-open-panel.mjs` d39c677d4f37, `src/couplesSwitch.js` dbd692827bde and `src/solverCouple.js` c85332888894.
- The build, 61eed66d:
  - `src/solver/household.js` 9ff9c73bd968;
  - `research/tests/household-pricing.test.mjs` 0cf73d49dd3a and `results-household-pricing.txt` 2f8d67f9098f;
  - `household-timing.mjs` c9e366dd7758 and `results-household-timing.txt` 7c4dd4f2bf50.
- The built `research/engine.mjs` ca1de90535c9. It is gitignored; the kept launch snapshot holds the same file.
- `results-couples-trade.txt` e57aca61fb63.
- The launch:
  - the launch log `results/pricing-fix-launch-1.log` 1b8dc910a002;
  - the 14 unit logs and 14 records;
  - `run-from-snapshot.sh` cf7ab99bb4ec;
  - the kept snapshot `/tmp/solver-snap-YmIhIJ`.

**What I ran** (after the read; nothing solved, nothing decided). My scripts are in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/`: `lost-check.mjs`,
`pots.mjs`, `units-identity.mjs`, `s191-guard.mjs`, `timing-extra.mjs` and `wrappers.mjs`.
- **The read and the beside again.** `node research/solver/reduce-pricing-fix.mjs` reproduces the results file byte for
  byte. `--planted` gives ALL PASS, 7 checks. `node research/solver/pricing-fix-beside.mjs` reproduces the beside file byte
  for byte.
- **The test of the class.** `node research/tests/household-pricing.test.mjs` gives ALL PASS, 4 checks. With `--planted`,
  'partsp' fails checks 2 and 3 and 'incfloor' fails checks 2 and 4, as recorded.
- **The stamps.** At HEAD the code id is 7aee4099f6dc and the audit stamp d9a390cb3558, the launch's.
- **The snapshot.** Every tracked file in it is 33d50fb1's. The only extras are the two generated engine files, which equal
  the working tree's.
- **CI.** Verify (the fast tier) passed on 33d50fb1 (run 45207792772).

Verdict: FAIL

## Findings

1. **BLOCKING. "The figures fit it" does not hold on four of the read's own units, and C is recommended on that
   explanation.**
   - **The claim.** The report gives one leading explanation: A leaves the household's allowance and bands at `k` times one
     person's, "so the table would under-price the draws" (report l.64-68). It then says "The figures fit it" (l.70-71).
     DECISIONS-PENDING carries the same as "What it points to" (l.27-29), and the case for C rests on it ("prices the draws
     as well as the fixed incomes": report l.75-80; DECISIONS-PENDING l.31-34).
   - **S037-E100, and the controls S119-E100, S199-E100 and S279-E100: A prices the draws as the engine does.**
     - On these units `k` is 1.0000 (check 3's lines, results l.79 and l.85-87). The first person holds every pot: their
       share of the pots and of the pensions is 1.000 (`lost-check.mjs`, `wrappers.mjs`).
     - At `k` = 1 the household's allowance and every scaled band are one person's (household.js l.224-225:
       `paH = k x PA`, and a scaled limit is `paH + k x (L - PA)`).
     - The first person's state pension stays on that schedule. The partner's is handed over untaxed: their own tax is
       nought in every plan year on 13 of the 14 units (`units-identity.mjs`).
     - In the engine every draw on these units is the first person's, capped at their own allowance and bands
       (engine.mjs l.2526-2541).
     - So there is no under-pricing of the draws on these units. This fits PRICING-FIX.md's own note (l.45-47), which puts
       A's remaining error largest where the pensions are split evenly, not at `k` = 1.
   - **S037-Y100 (`k` 1.0000, the partner holding every pot): A prices the draws above the engine.** Once both state
     pensions are paid:
     - in the table a draw meets £12,570 less the first person's £8,200, so £4,370 of allowance;
     - in the engine every draw is the partner's and meets £12,570 less their own £6,800, so £5,770;
     - the basic band is short by the same £1,400.
   - **Yet FIX loses survival beyond noise on four of these units, and pays less tax on each.**

     | Unit | FIX less ROUTE, survival points (by path; beside A) | Lifetime tax a path (beside D) |
     |---|---|---|
     | S037-Y100 | −0.225 (−0.372 to −0.078) | −£67 |
     | S037-E100 | −0.150 (−0.270 to −0.030) | −£930 |
     | S119-E100 | −0.200 (−0.370 to −0.030) | −£4,394 |
     | S199-E100 | −0.200 (−0.396 to −0.004) | −£34 |

     These four hold 37 of the 121 lost paths (net 31 of 97).
   - **On Y100 and E100 only the draws' price differs between the arms.** Each holds £18,000 in a taxable account and
     £9,000 in cash (`wrappers.mjs`). So the savings and dividend allowances that both arms double (household.js `DOUBLED`,
     l.47-50) have little to act on there.
   - **The figures the sentence cites do not single the explanation out.**
     - More spending on the uneven units' kept paths is also what removing ROUTE's over-pricing gives. On E100 that removal
       is all FIX changes.
     - "Smaller end pots" holds by the median. It does not hold by the capped pot the read prints on Y90, one of the four
       uneven units: +1.142% (results l.46).
     - By the mean (not printed; `pots.mjs`), FIX ends higher on six units. On S191-90 it ends £137,938 a path higher.
   - **Why it blocks.** The maintainer is asked to choose C on this account. C as written prices the draws on two
     schedules. On E100 and the `k` = 1 controls that gives the price A already has.
   - **What must change.**
     - The report and the DECISIONS-PENDING entry say the read does not split what moves FIX's loss.
     - They name the units where A does not under-price the draws and still loses beyond noise, with the figures above.
     - They put C's case without the claim that the figures fit the under-pricing.
   - **What stands.** The figures and the outcome. No re-run is needed.

2. **MINOR. C's "exact for the even split" is asserted, not shown.** The claim is at report l.76, DECISIONS-PENDING l.32 and
   PRICING-FIX.md l.51-52.
   - The engine funds each person's half of the need from their own pots. Each pension draw is capped at its owner's own
     allowance and bands, and then each person covers the other's shortfall (engine.mjs l.2526-2541).
   - The household table's state sums each wrapper over the two people (household.js `mergedState`, l.247-261).
   - So once one person's wrapper runs down, the table's state does not say whose allowance a year's draw meets.
   - Exactness would need that state, or a split held fixed per wrapper. No test or run measures it.
   - State it as C's aim with that condition, or test it before offering it as a property.

3. **MINOR. The timing fix's pattern search leaves out one household-route panel; the claim still holds.**
   - `household-timing.mjs` `SETS` (l.46-53) does not include the dress rehearsal's panel (`couples-open-panel.json`), run
     on the household route on 22 Nov.
   - So "from every panel run on the household route" (PRICING-FIX.md l.62-64) and "It moves no figure of any read"
     (report l.87; DECISIONS-PENDING l.39) rest on a list one panel short.
   - I ran the same comparison over that panel (`timing-extra.mjs`): 68 units, 88 household plans built (both orders), 40
     with other incomes. None is apart before the fix, and none on it.
   - Add the panel to `SETS` so the printed record covers it.

4. **MINOR. The beside's section B infers two things it does not compute; both hold on these files.**
   - **The minimum pot.** B (pricing-fix-beside.mjs l.53-61) infers "the end pot below the minimum pot" from no spending
     unmet.
   - **The horizon.** B reads a unit's horizon as the last plan year any arm fails in. The header's "or the unit's years
     with a demand" (l.8) is not computed.
   - **My check** (`lost-check.mjs`):
     - Each unit's last failure year is its horizon `T`: 27, 35, 40, 51 and 40.
     - All 111 lost paths with no spending unmet end in plan year `T`, below their unit's minimum pot (£35,000 on S037's
       units; £1,080,000, £430,000, £205,000 and £112,900 on S119-E100, S199-E100, S279-E100 and S191-90).
     - The 10 lost paths with spending unmet are all S191-90's. One fails in plan year 38, one in 39 and eight in 40, so
       the two early failures are among them.
   - No figure moves.

## Checked and found to hold

- **The rule is the reducer's** (PRICING-FIX.md "The read", 5910b162 and 33d50fb1).
  - The shortfall: `shortfallOf`, the mean over Y90, Y100, E95 and E100 of Y75's figure less each unit's. It closes at no
    more than 0.5 of ROUTE's; ROUTE's not above nought is a STOP.
  - NO HARM: `harmExact(FIX, ROUTE)`, the net loss in whole paths against the threshold; and `survivalItem` over the 14
    units, weighted equally, by path, its lower end above −0.1.
  - FIX HOLDS only on both.
- **The gate**: every unit present, one stamp, seed 7002, 4,000 paths at 45 points, every check recorded, and the logs'
  stamps (all 14 read `code 7aee4099f6dc audit d9a390cb3558 prediction none`). Each arm's configuration is the hash
  PRICING-FIX.md names: APP ef459a5c8ccb, ROUTE 35ee3a2dc6ad, FIX 0f0c68c18ed3. FIX's configuration is ROUTE's but for the
  form.
- **The audit.**
  - APP, ROUTE and FIX run in one process on the same paths of seed 7002.
  - `solveHouseholdAt` is `solveRoute`'s household branch line for line, but for the form.
  - On all 14 units the three arms share one engine-inputs hash, the same MPAA ages and the same caps: one couple's plan,
    only the policy differing.
  - ROUTE's table is the registered read's and the pilot's. APP and ROUTE equal the trade's arrays on all 4,000 paths, so
    ROUTE's shortfall of +£369 is the trade's (results-couples-trade.txt l.9-13).
  - S191-90's APP and ROUTE equal the household arm read's APP and HSPA, 0 paths apart.
  - S191-90 is on the household route today: the guard is on, the elder holding 90% (`s191-guard.mjs`).
- **The premise fix (33d50fb1).**
  - The plant 'noopen' is set, and restored in a `finally`, around the one synchronous `guardOf` call.
  - The guard reads `PLANT` only when called (couplesSwitch.js l.82-83, l.214).
  - `route` and `today` are computed before that call, and nothing else in the run reads the guard.
- **The build: FIX is candidate A as PRICING-FIX.md describes it** (household.js l.186-207).
  - The partner's fixed income is their state pension from the state pension age and their taxable incomes not typed as
    earnings, in the engine's years. `ctx.otherIncomes` is already floored at each income's owner's retirement (engine.mjs
    l.1805).
  - It is taxed alone, stacked on their taxable pay and earnings, with plan year 0 on its fraction, and handed to the
    household person net and tax-free.
  - The form reaches only the household plan's incomes and the assembly's record (l.224, l.303, l.341; check 3).
  - On the read's own 14 units the test's identities hold, 0 years apart (`units-identity.mjs`): the cash as ROUTE's less
    the partner's own tax, the taxable part less their fixed income, and each income in the engine's years.
- **Every figure, count and "all"/"none"** in the report, STATE.md's sentence and the DECISIONS-PENDING entry is in the two
  results files or follows from them. This covers:
  - fewer paths kept on 12 of 14 units;
  - 121 lost paths: 111 at the minimum pot and 10 of S191-90's in its last three plan years, none earlier;
  - FIX's shortfall at 0.153 of ROUTE's;
  - S191-90: 25 lost and 3 saved, against a threshold of 21;
  - the tax lines, and under £1,000 either way on the other eleven units.

  The one exception is the explanatory sentence in finding 1.
- **The snapshot's "+ 2 uncommitted file(s)".**
  - Every tracked file in the kept snapshot equals 33d50fb1's, STATE.md and DECISIONS-PENDING.md included.
  - The launcher counts uncommitted files after its copy (run-from-snapshot.sh l.124-131), and runs.log was appended at
    15:46, after the count. The write-up's account fits.
