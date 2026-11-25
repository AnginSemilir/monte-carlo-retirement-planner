Verdict: FAIL

# Design review: every couple on the solver, the rest of the way, the registered test (`registrations/couples-any.md`; `COUPLES-ANY.md` the test, amendments 1 and 2; D141, D144 to D147)

**Subject:** the registration and the batch, audit, reducer, panel, sizing and identity it names, before its launch on seed
7027. The tree is at f8f6925a (claude/fervent-goodall-e2mrnf), clean. Nothing of seed 7027 was run, read, printed or
estimated.

**Read** (git blobs at f8f6925a):
- the registration c1c482b2de21, `COUPLES-ANY.md` bb48b165d663, STATE.md 8ebe605e2ad3 (D141, D144 to D147, section 6
  action 2), CHECKLIST.md 45e387294c8d, `DECISIONS-PENDING.md` 833431100507;
- the machinery: `couples-any-panel.mjs` 08edadc2eaef, `audit-couples-any.mjs` 718cd778b67b, `reduce-couples-any.mjs`
  fe03cee98ab8, `batch-couples-any.sh` 9d7ff8d915f1, `size-couples-any.mjs` 40059fc7819f, `couples-any-port-identity.mjs`
  6e0c7e3bcf47;
- the data: `couples-any-orders.json` 9a10920afaed, `couples-any-registered-panel.json` ee8b47fa0f5b,
  `results-couples-any-registered-panel.txt` 27a820b7b853, `couples-any-paths.json` 519dab8b1360,
  `results-couples-any-sizing.txt` 3a08845c3a75, the six landings in `results/couples-any-land-reg`, the pilot's 136 records
  and logs in `results/couples-any-pilot`;
- the helpers: `reduce-couples-open.mjs` 6a4a5735fe55, `reduce-share-rules.mjs` b46fa5187e99, `reduce-couples.mjs`
  cae05c5a8e75, `size-household-hsp.mjs` 1a555ce15e0d, `size-phase4.mjs` f66f13d055ed, `held-out.mjs` fe5111ee6129,
  `check-prediction.mjs` a4eae9ee99e1, `run-from-snapshot.sh` cf7ab99bb4ec, `fair-gate.mjs` c6b3e87e1643;
- for comparison: `audit-couples-open.mjs` 8ccaa3118266, `registrations/couples-open.md` and its two design reviews;
- the code a pass reaches: `src/solver/household.js` 94aca9051d20, `src/couplesSwitch.js` 8cc9e5c65e0a;
- the rehearsal: `results-couples-any.txt` be232e8c528b, `results-couples-any-port-identity.txt` 6d4cf7c530a6, its write-up
  and its two reviews.

**Ran** (scripts in the session's scratchpad; nothing in the tree changed):
- `check-prediction.mjs` on the registration: NOT COMPLETE, its one problem this file. The seed check with the batch under the
  registration gives 7002 and 7027, exit 0. Under a measurement and under `couples-open.md` it is refused.
- `MODE=registered TODO_ONLY=1 PREDICTION_FILE=research/solver/registrations/couples-any.md bash research/solver/batch-couples-any.sh`:
  `stamp: code d91a642206b9 audit dce06b2581ae`, todo 0 to 135. Its `mkdir -p` leaves `results/couples-any-run` empty, as
  the agent's own print had made it at 17:26.
- `configOf`: APP ef459a5c8ccb, ROUTE 0fea0d25d803, with and without REG=1.
- The planted modes, each with and without REG=1 where it has one:
  - the panel: ALL 28 PASS;
  - the audit: 16 and 15, all read as they should;
  - the reducer: ALL PASS (18), the gate's 21 refusals firing;
  - the sizing: 4;
  - the identity: 14.
- The registered mode's refusals. Each was run with `part 0/1`, so a refusal that failed to fire would still stop at the part
  check, before any solve or path. REG unset, `CA_N`, `CA_OUT`, `COUPLES_ANY_PANEL` (the rehearsal's panel), `PREDICTION_FILE`
  unset and `PREDICTION_FILE` `couples-open.md` were each refused in their own words. A clean setting reached `part k/136`,
  so the code check (audit l.163) passed on d91a642206b9.
- The held-out scan. `touchedAll`, with `byIndex`, `householdLineBases` and step 8's bases as `freeze` adds them, gives 349
  ids now. With this study's registered files left out (`results/couples-any-land-reg`, `-pilot`, `-run`,
  `results-couples-any-registered-panel.txt`, `results-couples-any-sizing.txt`) it gives 343 ids, hash `545c600658c3`: the
  frozen set, id for id. The pool is 77, the frozen order's.
- Six landings, re-run at the committed definition on seed 7005, 1,000 paths: S041-W0-Y75, S123-L-own, S207-Rp3s-own,
  S281-Ri2s-Y75, S185-Wc-own and S197-P-Y75. Each gave the landing's label and survival.
- The pilot's stamp. The stamped files, hashed with the paths file missing, give `371b8bcacf45`, the stamp on all 136 pilot
  logs. So the launch stamp differs from the pilot's by the paths file alone.
- The sizing, recomputed from the pilot's records without writing anything. Every unit's size is the file's: N 26000, limit
  17.04%. At 26,000 paths, at each unit's pilot bound, the lowest 1-point rate is 0.902 (S123-Rp2t-Y75, 16.84%) and the
  highest quarter-point rate is 0.050. The budget is 39.7 core-hours and 10.2 hours, and the identity 8.1 and 2.2, as the file
  says.
- The reducer's registered `report`, on planted units and on the pilot's own records (seed 7002, EXPLORATORY; the sizing
  already prints its figures): finding 2.
- S041-L-own's pensions under each arm: APP High and High, ROUTE Medium/High and Medium.

## Findings

1. **BLOCKING. The registered run prints each arm's survival on seed 7027 in every unit's log, before the gate, W's
   identity and the read.**
   - `audit-couples-any.mjs` l.230 prints `done ${arm}: config ...; engine ${survival}% on ${n}; CPU ...` in every mode. The
     batch writes each unit's output to `results/couples-any-run/case<k>.txt` (`batch-couples-any.sh` l.38 to 39).
   - The pilot's logs show it: `results/couples-any-pilot/case0.txt` l.5 to 6 print "done APP: config ef459a5c8ccb; engine
     85.90% on 1000" and "done ROUTE: config 0fea0d25d803; engine 99.20% on 1000".
   - So, as each of the 136 units finished, its log would hold APP's and ROUTE's survival on 26,000 paths of the held-out
     seed. Every unit's outcome would be printed hours before the read. Every launch ruling forbids this: no outcome of the
     held-out seed is read, printed or estimated before the registered read (D132, D135 (2); this brief).
   - The earlier registered audits print it only outside the registered mode: `audit-couples-open.mjs` l.265,
     `audit-household-hsp.mjs` l.239 and `audit-save-v2.mjs` l.267. The couples-open design review held "A registered log
     prints no survival" (`reviews/2026-11-22-couples-open-design.md` l.102).
   - No planted case reads the registered done line, so `--planted` cannot see this.
   - *Fix:* print the engine's survival only when not REGISTERED, as `audit-couples-open.mjs` l.265 does. Add a planted
     case: build the done line in one function, and check that its registered form holds no survival. Nothing computed
     changes, so the pilot and its sizing stand.

2. **BLOCKING. The registered OUTCOME line (`reduce-couples-any.mjs` l.176 to 182) contradicts the registration in two
   reachable cases and leaves out two of its steps. The agent reported (a) and (b) after the brief; I confirmed both. The
   reducer is stamped, so it cannot be put right after the launch.**
   - **(a) L passes and R fails.** The line says L opens; the registration (l.89 to 92) sends L back to the maintainer with
     both classes' units. A planted W pass, R harmed and L pass prints: "OUTCOME: L passes, opening by its own change of
     default (the reviewer and B1's gate); W passes and stays on by default (D146); R does not, keeps today's handling ...".
   - **(b) W fails.** The line prints "W does not, keeps today's handling (today's route inside the guard before D143, the
     app's rules outside it) and goes to the maintainer with its units, W at once". W's handling today is the household
     route (D146). The registration (l.99) has W only come back to the maintainer at once. The planted check at l.227
     (`ok2`) asserts these words, so `--planted` passes with the defect in place.
   - **(c) A pass with units that M1 names.** The line says each class opens by its own change of default and nothing of the
     maintainer. The registration (l.81 to 84) says "under a pass each unit named goes to the maintainer with the read
     before the default changes". `reduce-couples-open.mjs` l.148 carried this (", the read going to the maintainer first
     with the units M1 names").
     - On the pilot's own records, the registered report prints "OUTCOME: R, L and P pass, each opening by its own change
       of default (the reviewer and B1's gate); W passes and stays on by default (D146)". The M1 line beside it names
       S041-Rp1t-Y75 and S041-Ri1s-Y75.
     - So this is the outcome line the read is most likely to print.
   - **(d) W not read.** The line prints "W not read (its identity not shown)" and does not say that W goes to the
     maintainer (registration l.79 to 80).
   - **Why it must be fixed before the launch.** The reducer is a stamp root (`audit-couples-any.mjs` l.72). The read holds
     every unit's audit stamp to `stampFilesHash()` (`reduce-couples-any.mjs` l.303; gate l.69). A reducer changed after
     the launch would therefore refuse every unit.
   - *Fix,* in the registered branch:
     - L counts as opening only where R passes. Otherwise print that L passes but R does not, so both classes go to the
       maintainer with their units.
     - W failing comes back to the maintainer at once with its units, with no words on today's handling.
     - W not read goes to the maintainer.
     - Any opening with units M1 names prints that the read goes to the maintainer first with those units.
     - Add a planted case for each, and correct l.227.

3. **MINOR. The inference list (l.102 to 113) leaves out two reaches that a pass takes.**
   - **Holdings, ages and other income.** Every registered couple is three years apart and has no other taxable income:
     S041 is 68/65, S123 56/53, S185, S197 and S207 55/52, and S281 45/42 (the library's plans). Each unit is held at the
     elder's 60% or the younger's 75%. A pass of R, L or P puts those shapes on the household route for every couple of the
     classes D144 opened, by inference: Y at wider gaps, E over 90%, S at the same age, and G with other income.
     `registrations/couples-open.md` l.94 to 97 named its own such reaches.
   - **R on the other accounts.** R's shape is any account the two hold at different risks.
     - The guard reads it on the pension, the ISA, the taxable account, cash and the cash ISA (`src/couplesSwitch.js` l.164,
       l.181). The household plan takes it on all of them (`src/solver/household.js` l.173).
     - On the taxable account, cash and the cash ISA it holds the merged account at the larger holding's risk, not the more
       cautious one (l.185 to 197). That is a different approximation.
     - R's units vary only the pension and the S&S ISA (`couples-any-panel.mjs` l.77 to 78, l.164 to 168).
   - *Fix:* name both reaches in the list. For R, the change of default could instead keep R's opening to the pension and
     the ISA.

4. **MINOR. W's identity is not under the stamp, and its file does not show which tree it ran on.**
   - `STAMP_ROOTS` (`audit-couples-any.mjs` l.72) holds the audit, the reducer, the panel and the batch. None of them imports
     `couples-any-port-identity.mjs`, so it can change after the launch without moving the stamp.
   - Its header names the run's stamp and "this code" (l.128). The code id covers `src/solver` and the engine, not
     `src/solverCouple.js`, `src/solverSettings.js` or `src/couplesSwitch.js`.
   - `identityOf` (`reduce-couples-any.mjs` l.100 to 110) checks only the run's stamp, yet the read reads W only on the
     identity's word.
   - *Fix,* while the stamp is moving anyway:
     - add the identity script to `STAMP_ROOTS`;
     - have its header name its own tree's `stampFilesHash()` under REG=1;
     - have `identityOf` hold that hash to the units' audit stamp.
     The identity then runs on the launch tree, as the registration says (l.9).

## What holds, by the brief's items

1. **The question, arms, rule and outcomes are `COUPLES-ANY.md`'s.**
   - D141's three parts are coded as registered (`rule`, l.112 to 118), and each fails on its plant.
   - W is read only with its identity. A class passing opens by its own change of default, W passing stays on, and a class
     failing goes to the maintainer.
   - The outcome line is wrong: finding 2.
   - **L opens only with R is right.**
     - All four couples' L units are refused at the app's shapes for "different risks (Medium/High Risk, Medium Risk)" (the
       landings).
     - With 'risks' taken and 'limits' not, they are refused for the partner's own limits (`src/solver/household.js` l.242).
       So ROUTE on L's units takes both shapes.
     - The guard reads such a couple as 'limits' whatever its risks (`src/couplesSwitch.js` l.181, l.191). So R opening
       without L keeps it off, as the registration says.
   - **N's absence is right.** Both arms survive every path by construction (amendment 2; the rehearsal's N lines), so no rule
     can read N. C's choice is with the maintainer (`DECISIONS-PENDING.md`, 24 Nov evening).
2. **The panel.**
   - It is held out: my scan reproduces the frozen 343 ids and the 77-couple pool. Outside this study's own files, the six
     couples appear only in four earlier orders' reserve lists and in one review line that names "S123 to S179" as positions.
   - The four (S041, S123, S207 and S281) are `evenly`'s picks.
   - The walk is as stated and as coded (`walkAny` l.111 to 136; its three planted walks pass). S185 and S197 are the
     reserves' first two couples where both work. They were chosen on plan inputs and the order, before any ROUTE outcome
     existed, and none was passed over. S185 and S197 were landed at 6143e718 and 8e74a47f, after `walkAny` was committed.
   - There are 136 units (W 24, R 96, L 8, P 8), and arm A runs from 84.0% to 86.0%. Each unit's recorded shape is the
     panel's:
     - taken with every shape, and refused at the app's shapes in its own shape's words;
     - W on the household route, its Y75 units on it alone;
     - R, L and P at 'own' inside the guard with no route (today's route), and at Y75 off for 'shape'.
   - S123 retires before pension access, so this time the bridge is read on a held-out couple.
3. **The seed.**
   - 7027 is reserved for `/^couples-any[\w.-]*\.md$/` (`check-prediction.mjs` l.45, l.47).
   - The batch names it on a line that is not a comment (l.18).
   - The audit takes 7027 only in the registered mode (l.168). The pilot's 136 records are on 7002.
4. **The paths.**
   - Each unit is sized by D34 at its pilot bound and the largest size is taken uncapped: 26,000. Every unit reaches a 1-point
     rate of 0.902 or more and a quarter-point rate of 0.050 or less.
   - Beside it, deciding nothing: a unit whose realised discordance reached 18% would read a 1-point loss 0.883 of the time
     (my check).
   - Every pilot unit gains, from `+5.30` to `+14.50` points (the sizing). M1 names the two S041 units the registration
     names.
5. **The budget** is measured from the pilot on this machine and reproduces: 39.7 core-hours and 10.2 hours, then W's
   identity at 8.1 core-hours and 2.2 hours.
6. **The gate.**
   - The launch logs are checked against the registration's blob first (`requireFairLogs`).
   - Then the gate checks one code, audit, seed and Node version; the paths, points and estate weight; each record's class,
     variant, kind, holding and shape; the configurations; one array a path; and each unit's own log with its done line.
     Each refusal fires on its plant.
   - The registered run is held to the panel's code d91a642206b9. Every refusal I could reach fired.
7. **W's identity.**
   - Under REG=1 it solves each W unit again at the app's own shapes: the cut, the table in its bands, the assembly (top
     three, tie-break and hold) and the page's context.
   - It holds the table digest and every key of every path to the run's ROUTE arrays, and checks the guard on both plans.
   - Its combine refuses a missing, doubled or foreign unit, and a part whose count disagrees.
   - Without 24 of 24 IDENTICAL under the run's stamp, W is NOT READ and goes to the maintainer. The outcome line does not
     say so: finding 2 (d).
   - `src/` is unchanged since 2a6593a6. The client, worker, `solverCouple`, `solverSettings`, `couplesSwitch` and
     `solverApp` are the blobs the rehearsal's reviewer held the identity's emulation to.
   - Finding 4 has the gap.
8. **The inference list:** finding 3. The rest of it is right: the younger cohort, the mirror, no minimum pot set (`planOf`
   sets one on every unit), shapes two at a time, the estate aim, consent, the dial and the speed mode, and C.
9. **Fairness.**
   - Both arms run one path set on ROUTE's horizon, which APP is held to (l.196, l.202). The arms' order alternates by unit,
     and each arm's first 200 paths are held to `E.runTrial`.
   - L's APP runs the pensions at High, as entered, because arm A reads no solver locks. ROUTE runs them at each person's
     limit. So L's comparison is the route with the user's limits against the app's rules without them, as the user would
     see it. A pass does not show that the limits cost nothing.
   - What would leave the read unfair to the seed, or wrong in its outcome: findings 1 and 2.

## Before the launch

Yes, bring the fixed stamp back to me. The registration's launch line already requires it (l.139). The second look will
check:
- that the stamped files differing from `dce06b2581ae` are only the fixes to findings 1 and 2, and finding 4's if taken;
- that no unit's computation changes, so the pilot and its sizing stand without a new pilot;
- the planted modes, and the `TODO_ONLY` print of the new stamp;
- the registration's launch line naming that stamp, and its Design review line naming the second look's file.
