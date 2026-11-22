Verdict: PASS

# Design review, second look after one fix: the guard's own units, the registered test (registrations/couples-open.md; COUPLES-OPEN.md amendment 3; D139, D140, D141)

This PASS covers one launch only: stamp `code 36e4d2a860b2 audit f9b56fb0b6a1`, the 44 household-route units at 25,000 paths
on seed 7026. A launch on any other stamp needs the reviewer again (finding 2).

Subject: the answers to my first verdict, `reviews/2026-11-22-couples-open-design.md` 25d7c8f4f783 (FAIL, one BLOCKING and
six MINOR). They are in 7412fe2f, fd2add83 and 5be7ea77. This look also covers anything those commits introduced. The tree
is at 14fadffb. Its two commits after 5be7ea77 touch no stamped file: bf8d6797 changes STATE.md and 14fadffb adds
`drafts/guard-open-d142.patch`.

Read (blobs at 14fadffb):
- The registration and the plan: `registrations/couples-open.md` 93a859d9e9c3 and `COUPLES-OPEN.md` 1006fb1d4f09
  (amendment 3).
- The scripts:
  - `couples-open-panel.mjs` d39c677d4f37;
  - `audit-couples-open.mjs` 8ccaa3118266;
  - `reduce-couples-open.mjs` 6a4a5735fe55;
  - `size-couples-open.mjs` e12e1c026a1c;
  - `batch-couples-open.sh` c4f7c5df9c75, unchanged.
- The data:
  - `couples-open-registered-panel.json` 2842b623a332 and `results-couples-open-registered-panel.txt` d2d3e7e33230;
  - `couples-open-orders.json` 145ac30ba44a, unchanged;
  - `couples-open-paths.json` 503a06846969 and `results-couples-open-sizing.txt` b851d4da1b5c.
- The run records:
  - the G12R landings, the `added` records of `results/couples-open-land-reg/S037.json`, `S119.json`, `S199.json` and
    `S279.json`;
  - the pilot in `results/couples-open-pilot`: 44 records and 44 logs. The 64-unit pilot was set aside as
    `couples-open-pilot-64`.
- For the rent's start: `research/engine.mjs` (built, not tracked), l.1789 to 1806 (`incomeFloor`), and
  `results-guard-beside.txt` ffd8eb74b44d, section 1.
- For information only, not reviewed: `drafts/guard-route.patch` 964243a4a00f and `drafts/guard-open-d142.patch`. Neither
  is applied: `src/` is unchanged since 07c35c7c, and `src/couplesSwitch.js` is still b33f855de049.

Ran (scripts in the session's scratchpad; nothing in the tree changed; no path of seed 7026 run, read or estimated):
- `check-prediction.mjs` on the registration: NOT COMPLETE, and the only problem is that "Design review" names no review
  file. The seed check with the batch gives 7002 and 7026, exit 0.
- `configOf`: APP ef459a5c8ccb and ROUTE 35ee3a2dc6ad.
- The planted modes:
  - the panel: 58 of 58, with and without REG=1;
  - the audit: 14 of 14, both ways;
  - the reducer: ALL PASS (12), both ways, all 21 of the gate's refusals firing;
  - the sizing: 3 of 3.
- The `TODO_ONLY` dry run prints stamp `code 36e4d2a860b2 audit f9b56fb0b6a1` and units 0 to 43. With `COUPLES_OPEN_PANEL`
  set it prints the same. The run's units would then be refused at audit l.193, before any path; I read that line and did
  not run it.
- The stamp by commit, on trees taken by `git archive` with the built engine added:
  - REG=1 audit 0b53dfe467a2 at 7412fe2f, fd2add83 and 73248c00. This is the pilot's stamp, and all 44 of its logs carry
    it.
  - f9b56fb0b6a1 at 5be7ea77 and on the working tree.
  - Between 73248c00 and 5be7ea77, the only stamped file that differs is `couples-open-paths.json`.
- The sizing, run from the 73248c00 tree on the pilot: it gives `results-couples-open-sizing.txt` byte for byte, and
  `couples-open-paths.json` as committed but for `built`.
- A probe of G12R:
  - each landing's arm A, rerun at the committed definition on seed 7005 (1,000 paths), gives the landing's label and
    survival on all four couples: 84.50%, 85.90%, 84.70% and 84.10%;
  - all four are kept off for 'gapincome' and take the household route;
  - S037-G12R is S037-G12's plan but for the income's id and name;
  - I recorded each rent's start as the engine counts it.
- D34's rates at 25,000, at each unit's pilot bound: the lowest 1-point rate is 0.903 (S037-G12) and the highest
  quarter-point rate 0.050. The limit is 16.30%.
- `touched()` with this study's own files left out: the four couples are still named nowhere else.

## What holds

1. **BLOCKING 1 is answered as asked.**
   - G12R is 12 years apart and carries £15,000 a year of the first person's rent, typed from now as other taxable income
     (`couples-open-panel.mjs` `withRentNow`).
   - On each of the four couples it is kept off for 'gapincome' and takes the household route. Its landings were made on
     36e4d2a860b2 and reproduce on the committed definition.
   - As the engine counts it, the rent runs 7 years before the state pension age on S119 (from 61, plan year 0). It runs 8
     years before it on S199 and S279 (from their retirement at 60, plan years 5 and 15).
   - S037-G12R is S037-G12's own plan, as the registration says (l.126 to 128).
   - The pilot (EXPLORATORY) reads those three at +9.00, +11.20 and +11.80 points. Their spending on the paths both keep is
     +4.28%, +2.68% and +5.95%.
   - Finding 1 has the part this leaves open.
2. **MINOR 2 is answered.**
   - Every unit runs at 25,000, the largest of the D34 sizes, which range from 17,000 to 25,000.
   - At its pilot bound every unit reads a 1-point loss as harm with chance 0.903 or more.
   - D61 is no longer cited. The budget, 14.8 core-hours and 3.9 hours on four cores, reproduces.
3. **MINOR 3 is answered.**
   - The flag chance is labelled as the chance at no true change: at most 0.004, and nil at the pilot's gains.
   - Each unit's spending on the paths both keep is printed, with M1's names.
   - M1 names 8 of S037's 11 units, so the read will most likely go to the maintainer first. The registration now says so.
4. **MINORs 4 and 5 are answered.** The inference list now names each of these:
   - the same age at other holdings;
   - G with the elder holding more than 60%;
   - Y at a wider gap without income;
   - a couple entered younger first;
   - a couple with no minimum pot;
   - retiring before the access age of 58, which 30 of the 83 held-out couples do.
5. **MINOR 6 is answered, for the reviewer on the change of default.** The Outcomes hold the guard's shape checks on the
   plan the page hands the solver, its mirror included, and have the client fail closed.
6. **MINOR 7 is answered.**
   - The registered run refuses `COUPLES_OPEN_PANEL`, `COUPLES_OPEN_LAND_OUT` and every smoke limit (audit l.73 to 74 and
     l.193; planted).
   - The gate holds each record's class and variant to the panel's (planted).
   - The read does not refuse `COUPLES_OPEN_PANEL`, but the variable cannot move it. The gate holds each record's id,
     route, class and variant to the panel's, and the stamp hashes the default panel file. So another panel can only cause
     records to be refused.
7. **The pilot ran on the final files.**
   - Its stamp is that of every tree from 7412fe2f to 73248c00.
   - The launch stamp differs from it only by the paths file, which the sizing wrote from the pilot.
   - The 40 units the first pilot ran give the same figures again.
   - The panel's only change is the four G12R entries.
8. **Unchanged from my first look:**
   - the panel is held out;
   - seed 7026 is the registration's;
   - the arms' hashes;
   - each unit is kept off for its class's reason and takes the household route;
   - the rule as coded;
   - nothing prints a held-out outcome before the read.

## Findings

1. **MINOR. G12R reads rent before the state pension age, but only after pension access, and the guard test's harm came in
   the years before access.**
   - Both of the guard test's rent units ran before the pension access age of 58 (`results-guard-beside.txt` section 1):
     - S149's ran from 56, plan year 0, with S149 retired at 55. That is the harm: S149@gap12+rent, -6.850.
     - S337F's ran from its retirement at 52. It read +3.525.
   - The registered G12R units all run after access (`research/engine.mjs` l.1789 to 1806: an income is counted from its
     owner's retirement at the earliest):
     - S119's from 61;
     - S199's and S279's from 60;
     - S037's is the DB pension's plan.
   - My first review called S119's unit "S149's shape". In this respect it is not.
   - So the shape of the one measured harm, rent paid while the household cannot yet draw a pension, still rests on
     inference. The two halves come from different runs: the bridge from the rehearsal's younger couples, which carry no
     income, and the rent from S149 on today's route. The inference list names the two parts separately; it should name
     them together.
   - Alternatively, add G12R on a held-out couple of S149's own ages. S123 to S179 in the frozen order (positions 23 to 39)
     are 56/53 and retired at 55.
   - The registration's "rent from plan year 0 to the plan's end" (l.54 to 55) is the start as typed. As the engine counts
     it, the rent starts in plan year 0 on S119 alone.

2. **MINOR. The launch line states the stamp, then lets it change without review.**
   - It says "a stamped file changed before launch changes it, and then this line with it" (l.132). The launch is one of
     the fields the registration lets change after the pilot without the reviewer. So a stamped file changed after this
     review would launch with only this line edited.
   - Two ready changes to a stamped file already sit in `drafts/`: `guard-route.patch` and `guard-open-d142.patch`, both to
     `src/couplesSwitch.js`.
   - The second, as drafted, sets every class open (`HOUSEHOLD_OPEN` all true). Applied with the first, it would put every
     unit inside the guard. The audit would refuse each unit before any path (`unitProblems`). But the point stands for any
     change that instead moved a unit's route or its solve.
   - The line should say that a launch on any other stamp comes back to the reviewer, as this PASS does.

3. **MINOR. One figure in "What the pilot shows" is wrong.** It says "ROUTE against APP from +9.00 to +13.80 points on
   every unit" (l.120). The pilot's smallest change is +8.90, on S119-S75 and S119-G8 (`results-couples-open-sizing.txt`).
