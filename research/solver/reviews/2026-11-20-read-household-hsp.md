# Review at the read: step 8, HSPA against today's couples' default (registered, seed 7024; D129 (3), D130 (2), D132)

Subject: the registered read committed in ec8cbea2 (`results-household-hsp.txt`, the reducer's output whole); its write-up
`reports/2026-11-20-household-hsp-read.md` and the figures beside it (`household-hsp-beside.mjs`,
`results-household-hsp-beside.txt`), committed in 7759de89; and the step 8 sentence in STATE.md section 6 ("read once at
08:20 UK from the launch worktree").

Read (blobs at HEAD bce1ce9b; "same at dc85dfaf" where the launch commit holds the same blob):
- the rule: `registrations/household-hsp.md` fb070defb6d3, the same at dc85dfaf and in every log's stamp (sha
  fb070defb6d3...); `STEP8.md` 7638ab0321ae; D116 and D129 to D133 in STATE.md 9b11f037ee88.
- the read and what it imports, each the same at dc85dfaf (`git diff --stat dc85dfaf HEAD` touches none):
  `reduce-household-hsp.mjs` 153cbfeebc48, `audit-household-hsp.mjs` 4ac0e66a9daf, `reduce-phase4.mjs` ac319aad1f44
  (`byPath`, `survivalItem`), `reduce-share-rules.mjs` b46fa5187e99 (`harmExact`), `reduce-couples.mjs` cae05c5a8e75
  (`harmOf`), `size-phase4.mjs` f66f13d055ed (`thresholdFor`, `harmRate`), `reduce-household.mjs` 2a762db28f98 (`cells`,
  `spendOn`), `stats.mjs` a4095c8e339e, `fair-gate.mjs` c6b3e87e1643, `audit-household.mjs` f40361acbe6c (`JOINT`),
  `audit-couples-share.mjs` ac476126024d (`COUPLES_CANDIDATE`), `src/solverSettings.js` 0684649ddee3 (`APP_COUPLE`).
- the panel: `household-hsp-panel.mjs` 35d848112b3f, `household-hsp-panel.json` 78e4b83eb4d0,
  `household-hsp-paths.json` 24ecbaa24d0f, `share-rules-panel.mjs` 168dcae982f6 (`reheldAt`, `withFeature`),
  `shapes-panel.mjs` af92d5e2e71a (`shapeOf`).
- the run: the worktree `/home/user/hsp-launch` (HEAD dc85dfaf; `git status`: `runs.log` with the launcher's four lines,
  `results-household-hsp.txt` untracked, nothing else); `results/household-hsp-launch-1.log` to `-4.log`;
  `results/household-hsp-run/` (40 unit files, `case0.txt` to `case39.txt`, `parts/` empty); the last relaunch's snapshot,
  `/tmp/solver-snap-hIO8k4`; the session's `hsp-read.meta` and `hsp-read.err`.
- the write-up: `results-household-hsp.txt` bcb7d4d65af4, `household-hsp-beside.mjs` 4d10301cbb26,
  `results-household-hsp-beside.txt` c0d4828d8ae2, `reports/2026-11-20-household-hsp-read.md` d6854f60b0da, and the
  messages of ec8cbea2 and 7759de89.

Ran (my scripts in the session's scratchpad, `review-hsp/`; no path run; nothing in either tree edited; only seed 7024's
stored arrays read):
- The gate alone, on the worktree's modules, with no rule and no outcome printed. `checkLogStamps` on the 40 logs gave 0
  problems and `gate` gave 0. `stampFilesHash()` in the worktree now is 4cc4d37c0c19. Every unit runs on Node v22.23.4,
  estate weight 0.02, 45 points and seed 7024. The units are the panel's 40.
- `node research/solver/reduce-household-hsp.mjs --planted` at dc85dfaf: PLANTED: ALL PASS (16). Its 27 gate refusals and
  6 real-line refusals each fire.
- My own recomputation from the 40 unit files, using `loadDir` only to decode them. In my own code: the pooled change by
  path, spending on the paths both keep, each unit's cells, its spending and that spending's standard error, the capped and
  uncapped pot, lifetime tax and the forecasts. D34 by `harmExact`. Each unit's interval also by `survivalChangeU`
  (Newcombe's method 10) and by path. Exact one-sided binomial p-values for the units that lose.
- Each shape's fields from the panel's plans (`readHspPanel`), and each unit's two caps against its household table's cap.
- `diff -rq` of the snapshot against the worktree.

What holds (no finding):
- **One read, by the registered reducer, on the launch commit's files.**
  - `hsp-read.meta` gives 08:20:13 to 08:20:18 UTC, exit 0, with nothing on stderr.
  - The worktree's output was written at 08:20:18.89. The last launch log closed at 08:19:42 ("runs done 20 Nov 08:19 UK").
  - The main tree's copy is the same bytes (`cmp`). It was committed at 08:21:36. The beside script and its output are
    timed 08:23:49 and 08:23:50, after the read.
  - I found no other output of the reducer on this run in the scratchpad or in either tree. That is a negative the
    record cannot prove.
  - Under the registration a unit's log prints no outcome (`audit-household-hsp.mjs` line 239), and none does.
- **The gate is the registered one, and fair.**
  - Each of the 40 logs has one stamp line, and all 40 are the same: code 71fb4271c681, audit 4cc4d37c0c19, the
    registration and its blob.
  - No launch log has a "unit k exited" line, which the batch writes on any non-zero exit. Log 4 ends "exit 0".
  - The logs carry 23 "resumed" lines. A saved part is taken up only under the same stamp, registration hash, Node
    version, seed, paths, points, table digests and options (lines 212 to 218).
  - A relaunch overwrites a unit's log, so the earlier windows' logs are not kept. By the audit's code (line 239) none
    of them could carry an outcome.
  - The relaunches' snapshot differs from the worktree in `runs.log` alone. That is the "1 uncommitted file" that logs 2
    to 4 warn of.
- **The rule, recomputed apart from the reducer.**
  - Part 1: no unit is flagged. The largest net losses are 45 (S357F-own), 36 (S357F-gap8) and 32 (S025-45), each against
    61. The smallest 1-point rate is 0.993 (S193-90), so none is below 0.90.
  - Part 2: `+0.762` (`+0.718` to `+0.807`) by path.
  - Part 3: `+1.7223%` (`+1.7106` to `+1.7340`).
  - So the outcome is PASS.
  - The three units wholly below nought have exact one-sided p-values of 9.2e-7, 9.4e-5 and 1.9e-5. Multiplied by 40,
    each is still under 0.05, so "beyond noise" holds across the 40 units.
- **The outcome's reading is right.** The registration (lines 76 to 78) says: "Where M1 names a unit, the read goes to the
  maintainer first, with those units, and the default changes only on the maintainer's word."
  - The read's outcome line names S273-90.
  - The write-up (lines 34 to 36), both commit messages and STATE.md say the same, and nothing is built.
  - S273-90 is the only unit that spends less on the paths both keep at all: `-0.1665%`, se `0.0074`, its upper end
    `-0.152`. It keeps 81 more paths net. No unit that keeps more paths and spends less goes unnamed.
- **Every figure in the write-up and in STATE.md's sentence is in the files and recomputes.** This covers:
  - the three parts;
  - S273-90's figures;
  - the three units and their thresholds;
  - 29 above nought, 8 across, 3 below;
  - the couples and shapes;
  - the pooled change without each couple and without S193-90;
  - tax lower on 26 units, with the 14 higher ones named and the nine's K2 tax running from `£920,041` to `£1,342,891`;
  - the capped pot lower on 35 units, `-3.630%`, `-£30,732`;
  - the forecasts, within a point on 40 of 40, with mean gaps `+0.099` and `-10.909`;
  - the times;
  - both arms against APP, neither flagged;
  - 0 of 20,000 rollout paths differing.

  The commit messages carry the same figures.
- **K2's forecast is the product, and the write-up reads it rightly.**
  - Line 193 computes `survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB)`. Each factor is a table's own survival at
    its person's start state. HSPA's (line 192) is its one table's survival at the merged start state.
  - The tables plan at the share K2 recorded: 0.5 on the 32 units at 45/55 or 60/40, and 0.9 on the eight at 90.
  - The product treats the two planned parts as independent and as the household. The household pools what the two
    tables plan apart, so the product is no forecast of the household. S025-db shows it: `4.09%` forecast against `99.38%`
    delivered.
- **K2's description holds.** `CONFIG.K2` is `COUPLES_CANDIDATE` (the candidate without its tie-break) with `JOINT`. `JOINT`
  is `shareRule: 'pots'`, `tieJoint` 1e-4, `tieLook` true and `holdPast` 2 (`src/solverSettings.js` line 107). It is solved
  with `tieAboveCap` undefined (line 183). The write-up's "each person's own table at the couples' candidate, the joint move
  on the pots' share with LOOKHOLD" names these.
- **Six of the seven shapes are as the write-up gives them.**
  - own, 45 and 90: the first person holds 0.600, 0.450 and 0.900 of every wrapper.
  - db and dbpart: a `£15,000` `otherTaxable` income from 68, the first person's or the partner's.
  - gap8: the partner is eight years younger, with no income added.
  - sppart is finding 1.
- **The beside's groupings and counts are right.**
  - Couples are grouped by `base`, five units each. Shapes are grouped by `variant`: 45, 90, gap8 and own have eight units
    each, db four, and dbpart and sppart two each. Each group is pooled by path, as the read pools.
  - "Units below nought" counts point estimates. Section C uses the read's per-unit intervals.
  - My own code reproduces every line.
- **The per-unit intervals.** The read prints `survivalChange`, which is conditional on the count of discordant paths and so
  narrow where the split is lopsided. For example, S025-90 reads `+1.481` (`+1.417` to `+1.503`), and Newcombe's method gives
  `+1.301` to `+1.681`. These intervals decide nothing. The 29 / 8 / 3 split is the same by Newcombe's method and by each
  unit's own by-path interval.
- **The capped pot's footing.** The household table's estate cap equals the sum of the two people's caps on all 40 units,
  so both arms are capped alike.
- **The times decide nothing.** The arms' order for the path times rotates by unit (`orderOf`). The solve times are
  wall-clock, with K2 always solved first in its process (lines 184 and 185) and four units running at a time. So the solve
  ratio carries an order effect that was not measured.

Verdict: PASS

## Findings

1. **MINOR: the write-up misdescribes the `sppart` shape.**
   - **What the write-up says.** Lines 21 and 22: "or the partner's state pension at 60 (`sppart`)".
   - **What was run.** The registration (line 45) says "the partner's state pension at 60%". The code sets the partner's
     state pension amount to 60% of the first person's: `share-rules-panel.mjs` line 49 (`SP_PART = 0.6`) and line 76
     (`statePensionPart: Math.round(SP_PART * ... statePensionSelf)`).
   - **In the panel.** S273-sppart and S355F-sppart carry `£7,186` a year (0.6 of `£11,976`). Their own units carry
     `£9,800`. The state pension age is 68 in both.
   - **What it means.** The shape lowers the partner's state pension. It does not start one at 60.
   - **Why it is MINOR.** No figure, outcome or inference in the write-up rests on it. But the panel goes to the maintainer
     as described.
   - **To answer it.** Write "the partner's state pension at 60% of the first person's (`£7,186` a year against `£9,800`)".

2. **MINOR: the units HSPA loses on are shown on survival alone, and M1 is cited for a pot its premise does not reach.**
   - **What the write-up says.** Lines 53 to 58 give S025-45, S357F-gap8 and S357F-own by survival and D34's threshold.
     Lines 71 and 72 say the capped pot is lower on 35 units and "By M1 it is recorded and is not a bar".
   - **What M1 covers.** M1 (D116; registration line 67) rules on a smaller pot only "where HSPA keeps more paths and
     delivers no less spending". On these three units HSPA keeps fewer paths, and at the point estimate it also keeps
     fewer on S273-own, S273-sppart and S357F-45. M1 says nothing of those units' pots.
   - **The rule stands.** The registration's own words, "It is recorded ... and is not a bar", make the pot no bar to the
     rule, so the rule and the outcome stand.
   - **What the files show beside each unit** (`results-household-hsp.txt` lines 19, 57 and 58; the beside's sections E
     and F; my recomputation):
     - S025-45: 32 paths lost net; the capped pot `-10.237%` (`-£30,069` a path); spending on the paths both keep
       `+3.8125%`; lifetime tax `£611` to `£196`.
     - S357F-gap8: 36 lost net; the capped pot `-0.702%` (`-£50,662`); lifetime tax `+17.952%` (`£1,172,873` to
       `£1,383,425`).
     - S357F-own: 45 lost net; the capped pot `+1.519%` (`+£107,136`); lifetime tax `+28.870%` (`£1,015,712` to
       `£1,308,946`).
     - S273-own, S273-sppart and S357F-45, below nought at their point: the capped pot `-1.071%`, `-0.999%` and
       `-0.519%`; lifetime tax `+5.342%`, `+7.148%` and `+4.602%`.
   - **Their survival intervals** (Newcombe's method 10, `stats.mjs` `survivalChangeU`; each by-path interval's ends lie
     within 0.01 of these):
     - S025-45: `-0.200` (`-0.292` to `-0.118`).
     - S357F-gap8: `-0.225` (`-0.345` to `-0.108`).
     - S357F-own: `-0.281` (`-0.417` to `-0.148`).
   - **What "under D34's threshold" means here.** Each interval reaches past a quarter point. That is the loss D34's
     threshold is set to call harm at most 5% of the time. S357F-own's point estimate is itself past it. "Under D34's
     threshold" (61 paths, `0.381` points) is what the rule reads. It is not a measure that the loss is under a quarter
     point.
   - **To answer it.** In that bullet, put each unit's capped pot and lifetime tax beside its survival, with the intervals
     above. Then cite the pot's "no bar" to the registration's words. M1 rules only where HSPA keeps more paths.

3. **MINOR: the pot left runs the other way from the capped pot, and the write-up gives the capped figure alone.**
   - **What the read prints.** Line 14: "the pot left, the mean a unit: ... K2 £7,519,884, HSPA £9,091,528". That puts
     HSPA `20.9%` above K2. The registration lists the pot left beside the rule (line 54).
   - **By unit** (my recomputation). HSPA's mean pot left is higher on 27 of the 40 units, for example S351F-gap8
     `+72.33%`, S357F-db `+57.07%` and S273-90 `+3.83%`. Its median pot is lower on 31 of the 40.
   - **What the write-up says.** It gives the capped pot alone (lines 71 and 72). On S273-90 it says "a pot about one
     percent smaller" (lines 47 and 48). There the mean pot left is `£16,705,385` under K2 and `£17,345,936` under HSPA,
     and the median is `3.03%` lower.
   - **What this shows.** HSPA leaves less at the median and up to the cap. On the wealthier couples it leaves more above
     the cap, which is where only its table carries the candidate's tie-break (registration line 28; D130 (3)). The capped
     pot stays the measure (D116).
   - **To answer it.** Say this beside the capped figure, and on S273-90 call the pot the capped pot.
