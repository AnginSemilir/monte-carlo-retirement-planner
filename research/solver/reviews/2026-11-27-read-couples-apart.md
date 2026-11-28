# Review at the read: couples four and five risk levels apart (`COUPLES-APART.md`; EXPLORATORY, seed 7002), read 27 Nov

**Subject.** The write-up `reports/2026-11-27-couples-apart-read.md`, and the read's line in STATE.md's working copy
(section 5, l.292), held against `results-couples-apart.txt`, the 64 unit files, and the code that made and read them at the
launch commit 014ee7cf. The read: `APART=1 node research/solver/reduce-couples-any.mjs` in `/home/user/couples-apart-read`
(detached at 014ee7cf), its `results/couples-apart-7002` a symlink to the main tree's.

**What I read** (git blobs, first 12; untracked files by `git hash-object`):
- the write-up 5162328e95da (untracked); STATE.md's working copy 460151ce4a47 (HEAD 8baf1d5dc4b1: D116, D148, D149, D154,
  section 5); CHECKLIST.md 45e387294c8d;
- `results-couples-apart.txt` 16fe5f2e12ab (untracked), `results-couples-apart-panel.txt` 27bd52fce035,
  `couples-apart-panel.json` a04b859b3762;
- the plan `COUPLES-APART.md` fde5e84b9e99 (014ee7cf; against eb82e0b0 only the batch script's name changed);
- at 014ee7cf: `reduce-couples-any.mjs` 299db737f0bc, `couples-any-panel.mjs` 640d62d44ec2, `audit-couples-any.mjs`
  2287e10c87a7, `batch-couples-apart.sh` c9afd61bc094;
- the helpers they call: `reduce-couples-open.mjs` 6a4a5735fe55 (`compareClass`, `m1ByUnit`, `allSpendOf`, `loadDir`),
  `reduce-share-rules.mjs` b46fa5187e99 (`harmExact`), `reduce-phase4.mjs` ac319aad1f44 (`byPath`),
  `reduce-household-hsp.mjs` 153cbfeebc48 (`keptSpend`), `reduce-household.mjs` 2a762db28f98 (`cells`), `fair-gate.mjs`
  c6b3e87e1643, `audit-phase4.mjs` 5ace83959b96 (`runPath`);
- the launch log `results/couples-apart-launch-1.log` 5d9145426a4f, `runs.log` 4b628a543682, the 64 case logs and unit files
  in `results/couples-apart-7002`, the four landing records in `results/couples-apart-land`;
- what the write-up cites: `reviews/2026-11-25-default-couples-any.md` 19f405148a8d (MINOR 3, the light look, l.181-208),
  `reviews/2026-11-24-read-couples-any-rehearsal.md` ca8292387285, `results-couples-any.txt` be232e8c528b (the rehearsal's R
  by its parts);
- the scratch script `apart-beside.mjs` 6666fb2d3dc9.

**What I ran** (nothing that launches units):
- In the checkout: `APART=1 node research/solver/reduce-couples-any.mjs`. Exit 0; its output `diff`-identical to
  `results-couples-apart.txt`.
- There:
  - `code-id.mjs` gives 3fb20e2156f8 and `stampFilesHash()` under APART gives ed5abea79d38, both the units' stamps.
  - `reduce-couples-any.mjs --planted`: ALL PASS (22). `APART=1 couples-any-panel.mjs --planted`: ALL 13 PASS.
- In the main tree:
  - The stamp is 3c8eb83180e3 and the code d3d5295b01b1.
  - Of the stamp's files, only `research/solver/household.mjs` differs from the checkout's (a staged edit not in HEAD).
  - The plan, the reducer, the panel module, the audit and the panel json have no diff from 014ee7cf to HEAD or to the
    working tree.
- `apart-beside.mjs` on the results file: the counts the write-up gives.
- Two scratch scripts over the unit files' arrays (scratchpad `review-apart/verify.mjs`, `verify2.mjs`):
  - every unit's target, arm A's label, variant, class, kind and holding are `couples-apart-panel.json`'s: no mismatch;
  - one stamp (prediction none, sha -, Node v22.23.4), seed 7002, 4,000 paths, 45 points, W 0.02;
  - recomputed from the arrays, each equal to the file's: the pooled survival change, R's eight parts by path, the pooled
    spending on the paths both keep and over all paths, the one unit below nought, M1, and every count and range in the
    write-up;
  - also lifetime tax by unit, and the capped pot and lifetime tax in pounds a path, by couple and wrapper (findings 2
    and 3).
- The landing records: each couple was landed on HEAD eb82e0b0, after the plan's commit (21:08 UTC). S025 took 244 s and the
  last finished at 21:16 UTC.

Verdict: FAIL

## Findings

1. **BLOCKING: the last bullet on the pot (write-up l.56-58) misstates both the light look and this read.** It says: "This
   is what the reviewer's light look on D148 (MINOR 3) found on one unit, now on 64."
   - **What the light look measured** (`reviews/2026-11-25-default-couples-any.md` l.192-204):
     - the household route against today's two-table route, not against the app's rules;
     - the median pot, not the mean;
     - one unit, S123-Rp3t-own, with the partner's pension moved, at 6 points and 2,000 paths.
     - At four apart the household route's median pot was higher (`£240,406` against `£208,692`). At five apart it was about
       30% lower (`£159,985` against `£229,591`).
   - **What this read measures:** ROUTE against APP.
     - The mean pot is lower on 48 of the 64 units. It is higher on all 16 of S025's (`+44.127%` to `+108.046%`, l.8-23).
     - Capped at the estate cap, it is lower on 31 units and higher on 33.
     - So the pattern is not "now on 64", and it is not the light look's finding.
   - **The reading offered next** ("the riskier holding is moved down. That fits a smaller pot and more paths kept"):
     - On S025 the same move down comes with a larger pot, mean and capped, on all 16 units.
     - On the 48 units with a smaller pot, ROUTE also spends `+4.3067%` to `+17.4335%` more on the paths both keep. That
       lowers the pot by itself, and this read cannot tell the two causes apart.
     - The paths kept: on the same four couples, holdings and paths, the rehearsal's R gained `+10.492`, `+9.404` and
       `+8.581` points at one, two and three apart (`results-couples-any.txt` l.137-139). Here the gain is `+9.216` at four
       apart and `+9.493` at five. So the gain over the app's rules is the household route's at every distance. Nothing shows
       that the move down at four and five apart brings it.
     - "This read does not trace it" is right. "That fits" is not, on a quarter of the units.
   - **Also:** `COUPLES-APART.md` l.12 says "This test measures it" of the light look's concern. The test measures the
     household route against the app's rules, as D154 (5) asked. The light look's own comparison, against today's route, is
     still not measured. The write-up should not carry the plan's sentence forward as a result.
   - **Fix:** say what each measured, using the file's figures:
     - the light look: against today's route, on one unit; the median pot higher at four apart and about 30% lower at five;
     - this read: against the app's rules; the mean pot lower on the 48 units of S273, S351F and S357F and higher on S025's 16;
       the capped pot lower on 31 of 64;
     - the cause of the smaller pot not traced, and more spending on the paths both keep beside it on those 48 units;
     - nothing here against today's route.

2. **BLOCKING: a wrong count in STATE.md's working copy, section 5 (l.292):** "lifetime tax higher on `48` of the `64`".
   - The file gives 51 of 64: all 48 units of S025, S351F and S357F, plus three of S273's:
     - S273-Rp5t-own `+5.613%` (l.30);
     - S273-Ri4t-own `+19.912%` (l.34);
     - S273-Ri4t-Y75 `+45.563%` (l.35).
   - The write-up has it right (l.59: higher "on all 48 units of S025, S351F and S357F, and lower on 13 of S273's 16").
   - `check-state.mjs` blanks backticked text before its figure check (l.32-37) and reads no backticked figure against a
     results file. So neither the hook nor CI will catch this.
   - **Fix:** `51` of the `64`, or the write-up's own words.

3. **MINOR: the pounds, and one sentence in "What it means" (write-up l.50-59, l.63-66).**
   - D116 records the pot "counted up to the cap and in pounds a path beside the spending". The write-up gives the capped pot
     in percent only and lifetime tax as counts only.
   - The rehearsal's write-up gave both in pounds a path, by couple, at its reviewer's word
     (`reviews/2026-11-24-read-couples-any-rehearsal.md`, findings 1 and 3).
   - The file's figures, ROUTE less APP, in pounds a path:

     | couple | the capped pot | lifetime tax |
     |---|---|---|
     | S025 | `+£71,760` to `+£114,010` | `+£150` to `+£1,104` |
     | S273 | `-£336,632` to `-£1,672,275` | `-£170,264` to `+£442,591` |
     | S351F | the pension `-£46,524` to `-£172,871`; the ISA `+£15,119` to `+£55,944` | `+£133,958` to `+£227,178` |
     | S357F | the pension `-£857,219` to `+£108,842`; the ISA `+£237,459` to `+£514,872` | `+£799,919` to `+£1,524,544` |

   - On each of S357F's 16 units the rise in lifetime tax (`+£799,919` to `+£1,524,544` a path) is larger than the change in
     its capped pot (S357F-Rp5s-Y75, the largest: `+£948,282` of tax against `-£857,219`). "What it means" weighs the pot
     against the paths and the spending, and leaves the tax out.
   - l.64-65 says "On the pension units, that smaller pot is below the estate cap too". That holds on 23 of those 24 units,
     not all: S357F-Rp4t-Y75 is `+1.700%` (`£108,842` a path, l.59). And S273's eight ISA units are lower up to the cap as
     well (l.32-39). The bullet on the pot (l.53-55) has both right.
   - **Fix:** add the pounds by couple, and say "23 of the 24 pension units, and S273's ISA units".

4. **MINOR: neither the stamp nor the gate pins the panel the units ran.**
   - Under APART the audit reads `couples-apart-panel.json` (`couples-any-panel.mjs` l.106). But its stamp's data file is the
     rehearsal's `couples-any-panel.json` (`audit-couples-any.mjs` l.79-81).
   - The stamp's roots name `batch-couples-any.sh`, not `batch-couples-apart.sh`, the script that set `APART=1` and the folder
     (l.78).
   - The gate compares each record's class, variant, kind, holding and shape (`reduce-couples-any.mjs` l.76-79). It does not
     compare the target or arm A's label.
   - So if the apart panel were landed again with new targets, the stamp and the gate would not change.
   - **It did not bite:**
     - all 64 targets and labels are the committed panel's (my script);
     - the panel has no diff from 28aa6f57 to the working tree;
     - the launch was from a snapshot at 014ee7cf (launch log l.3, `runs.log`).
   - **Fix, before any reuse:** under APART, put the apart panel in `STAMP_DATA` and `batch-couples-apart.sh` among the roots.
     Or have the gate compare each unit's target and label with the panel's, with a planted case.

5. **MINOR: the counts come from an uncommitted script (CHECKLIST 6).**
   - The counts in the bullets on the pot and on tax (48, 16, 7 of 8, 23 of 32, 8 of 32, 13 of 16) are made by
     `apart-beside.mjs`. It sits in the session's scratchpad, not the repository, and its output is no results file.
   - The counts are right: the script reproduces them, and so do the unit arrays.
   - Its capped-pot regex would throw on a unit line with no estate cap (the reducer leaves ", capped ..." out there), and a
     unit line its id pattern missed would drop out of every count unseen. Neither occurs here: all 64 lines parse.
   - **Fix:** commit the script beside the read, with its output (as the rehearsal's `couples-any-beside.mjs` and
     `results-couples-any-beside.txt`), and cite that file. It should refuse a parse count other than 64. Finding 3's pounds
     can come from it too.

## What holds

- **The figures.** Every figure and count in the write-up is the file's, or follows from its unit lines:
  - the three parts;
  - the table of R's eight parts, each recomputed by path from the arrays;
  - M1, none;
  - spending over all paths, `+7.2066%`, and the one unit below nought (S025-Rp4t-own, `84.60%` to `99.28%`);
  - the counts and ranges for the mean and capped pots;
  - the tax counts.
- **The rule, read as `COUPLES-APART.md` sets it.**
  - Under APART, `READ_CLASSES` is `['R']`, and `rule` takes all 64 units as one class.
  - Part 1: D34 in whole paths (`harmExact`, lost less saved against the threshold).
  - Part 2: pooled survival by path (`byPath`), its lower end above 0.
  - Part 3: spending on the paths both keep, the units weighted equally (`keptSpend`), not below `-0.05%`.
  - The write-up reads PASSES by the plan's outcomes (nothing changes) and sets aside the reducer's "goes to the registered
    test", as it says.
- **No harm, by margin.**
  - Every unit gains at least 179 paths net (S273-Rp4s-own: 3 lost, 182 saved). The closest unit is 213 paths from its
    flag.
  - At 4,000 paths the thresholds are 34 to 52 paths. Discordance runs from 4.6% to 14.8%, so D34's sizing (discordance
    times 152,000) would want about 7,000 to 22,500 paths. So the pass rests on the size of the gains, not on D34's power.
  - The write-up claims no more than "D34's rule flags no unit".
- **The parts are grouped correctly.**
  - Under APART, `R_KINDS` is `APART_KINDS`. The units are grouped by wrapper, by four or five apart (`kindOf(u).apart`), by
    who is the safer and by holding: 32 units each.
  - My regrouping from the unit ids gives the file's figures.
  - The first person is the elder in each couple (68/65, 45/42, 37/34). The first person holds 60% at 'own' and 25% at Y75
    (the panel file), so the parts' names hold.
  - Each kind sits where the plan puts it on the six levels (the panel's planted checks: Low/High, Cash/High,
    Cash/Medium-High, Cash/High).
- **The gate is fair.**
  - One code and one audit, 3fb20e2156f8 and ed5abea79d38, both equal to the checkout's.
  - Every case log stamped prediction none (`requireFairLogs`).
  - The panel's 64 units, none missing or extra, with class, variant, kind, holding and recorded shape the panel's. Each unit
    is refused by the household plan without 'risks' (for its different risks) and taken with every shape. The guard is on:
    no route at 'own', 'household' at Y75.
  - Both arms at `configOf`, and every array one value a path.
  - Each case log has its done line, and the launch log has no "unit N exited".
  - Each arm's first 200 paths are held to `E.runTrial` (`runPath` is the engine's `stepYear`).
  - The two arms run in one process on the same paths and one horizon.
- **The plan came first.**
  - `COUPLES-APART.md` was committed at eb82e0b0, and the landings ran on that HEAD after it.
  - The rule was unchanged up to 014ee7cf, apart from the batch script's name.
  - At the landed targets arm A survives 84.1% to 86.0% on 1,000 paths of seed 7005 (the panel file), inside `85 +/- 1%`.
- **Reading from the checkout is sound.**
  - The checkout's code and audit stamp are the units'. Its reducer, panel module and audit are the launch's, byte for byte
    (none has moved to HEAD), and the read reproduces byte for byte.
  - In the main tree the gate would refuse on the audit stamp. The cause is the staged edit to `research/solver/household.mjs`
    (a stamped file), not b75232c2, none of whose files is in the stamp. The gate does not compare the code id with the
    tree's.
  - Either way the figures depend on the arrays alone.
- **ROUTE is the app's route by construction:** the page's `householdCut`, `solveForApp` in `bandsAt`, `householdSolved` and
  `solvedContext`, every shape named, as for the rehearsal's R. No identity was run on these units, and the write-up claims
  none.
- **D116 is applied as it reads.**
  - Each of the 48 units with a smaller mean pot keeps more paths (net +179 to +426). Each delivers more spending on the
    paths both keep (`+4.3067%` to `+17.4335%`) and over all paths, with the lower end above nought on every one.
  - The one unit below on spending over all paths leaves a larger pot.

Findings 1 to 3 and 5 concern the write-up and STATE.md's line. Finding 4 concerns machinery that did not bite. The read,
its gate and its outcome (PASSES; nothing changes) stand.
