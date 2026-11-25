VERDICT: FAIL

# Review at the read: every couple on the solver, the dress rehearsal (`COUPLES-ANY.md` amendment 2; EXPLORATORY, seed 7002), read 24 Nov

**Subject:** the write-up `reports/2026-11-24-couples-any-rehearsal-read.md`, held against the read and the code that made it.
The read's files are uncommitted in `/home/user/couples-a` (HEAD 605524f0).

**What I read** (git blobs, first 12):
- the write-up 6b8957dc46cf;
- `results-couples-any.txt` be232e8c528b, `results-couples-any-beside.txt` 6081281fe653,
  `results-couples-any-port-identity.txt` 6d4cf7c530a6, `results-couples-any-panel.txt` 3451bda73641 and
  `couples-any-panel.json` 9bce6ce3a74e;
- the rule, `COUPLES-ANY.md` bb48b165d663 ("The test, by D141's rule"; amendment 2);
- the read's scripts: `reduce-couples-any.mjs` 4a83278d5873, `couples-any-beside.mjs` e961fee9420d,
  `audit-couples-any.mjs` 5d8e3a4027af, `couples-any-port-identity.mjs` d4c8e65bfe9d, `couples-any-panel.mjs` a0d6377b841b
  and `batch-couples-any.sh` 5a09b135f218;
- the helpers they call: `reduce-couples-open.mjs` 6a4a5735fe55, `reduce-share-rules.mjs` b46fa5187e99 (`harmExact`),
  `reduce-household-hsp.mjs` 153cbfeebc48 (`keptSpend`), `reduce-phase4.mjs` ac319aad1f44 (`byPath`) and `fair-gate.mjs`
  c6b3e87e1643;
- the app's route: `src/solverClient.js` 8c5b0c3828fb, `src/solverWorker.js` a60761ccc464, `src/solverCouple.js`
  cc5152b54a13, `src/solverSettings.js` 9f245314bb28, `src/couplesSwitch.js` 8cc9e5c65e0a and `src/solverApp.js` a822d56e2e09;
- `results-household-salaries.txt` a6525ae7365c;
- the launch log, `runs.log`, and the case logs 0 and 143.

**What I ran** (nothing that launches units):
- `node research/solver/reduce-couples-any.mjs | cmp - results-couples-any.txt`: the same, byte for byte.
- `couples-any-beside.mjs`: the same, byte for byte.
- `reduce-couples-any.mjs --planted`: ALL PASS (17).
- `couples-any-port-identity.mjs --planted`: all 14 read as they should.
- `codeId()` now d91a642206b9 and `stampFilesHash()` now 82b6d08fc60b: both the units' stamps.
- Scratch scripts over the results file and the units, for the figures below. The identity itself was not re-run (CPU).

## Findings

1. **BLOCKING: the lifetime tax sentence (write-up l.74 to 75).** The write-up says: "The largest rises are on small
   bases, for example S351F-Ri3s-Y75 from £17,386 to £240,604 a path." That holds only in percent. The results file's own
   APP and ROUTE figures, in pounds a path:
   - **S357F, the largest rises.** On its 34 W, R, L and P units the rise runs from `+£214,460` (S357F-W0-own) to
     `+£1,461,638` (S357F-Ri3t-own, `£374,650` to `£1,836,288`; l.132), on APP bases of `£230,555` to `£788,591`. Of the 34,
     16 rise by more than `£1,000,000` and 33 by more than `£500,000`. These bases are not small.
   - **S357F's N units:** `+£1,649,050` and `+£1,536,487` (l.177 to 178), beside a capped pot of only `+£120,226` and
     `+£121,897` a path.
   - **S351F, the couple the sentence cites:** `+£15,482` to `+£223,218`, on bases of `£7,063` to `£137,162`.
   - **The library's large-base couples fall:** S227 from `-£248,611` to `-£336,258`, and S273 from `-£232,464` to
     `+£114,002`.

   As written, the reader takes the rise for a small-base artefact. In fact it is the largest money movement in the read.
   On N it also sits next to C's question unsized (l.82 gives percent only). The maintainer decides that question on this
   read alone.

   *Fix:* give lifetime tax in pounds a path, by couple, for W, R, L and P and for N. Keep "small bases" to S351F's
   percentages. Put S357F's N figures beside C's question. "Not shown here" can stay, since no cause is needed.
2. **MINOR: D34's statistic (write-up l.48 to 49; beside l.3, 6, 9, 12; `couples-any-beside.mjs` l.31).** Each unit's
   gross paths lost is set beside its threshold ("10 of 4,000 (S273-Ri3t-own), against that unit's D34 threshold of 33").
   - **What D34 compares:** lost less saved (`reduce-share-rules.mjs` `harmExact` l.103 to 105: `k = lost - saved`, flagged
     when `k > j`).
   - **The margins:** on S273-Ri3t-own the statistic is `-152` against `33`. The smallest margin on any of the 136 read
     units is 185 paths, and every unit gains at least 152 paths net.
   - **The beside's ranking:** its "nearest its own" ranks by threshold less gross lost. In W it names S273-Wg-own, where
     by D34's statistic S273-Wg-Y75 is nearer (margin 355).
   - **What "No harm" rests on:** at 4,000 paths the thresholds are 33 to 52 paths (0.8 to 1.3 points). So "No harm" rests
     on the size of the gains, not on D34's power, which is the registered test's.

   *Fix:* state the net margin and that clause.
3. **MINOR: the pot without its pounds (write-up l.65 to 69).** D116 records the pot "counted up to the cap and in pounds a
   path". The write-up gives percent only. The file's capped pot, in pounds a path:

   | couple | from | to |
   |---|---|---|
   | S273 | `-£323,685` | `-£859,669` (S273-Rp1t-Y75) |
   | S227 | `-£328,172` | `-£529,093` |
   | S357F | `-£162,660` | `+£501,382` |
   | S351F | `-£40,493` | `+£39,506` |
   | S025 | `+£50,003` | `+£103,304` |
   | N | `+£3,871` | `+£226,042` |

   *Fix:* add them.
4. **MINOR: latent, `couples-any-beside.mjs` l.13.** Two cases make the regex lose lines silently:
   - a line ending "the threshold N paths FLAGGED" parses with its threshold null;
   - a unit with no estate cap is not matched at all, so it drops out of every range. The reducer omits ", capped ..."
     there (`reduce-couples-any.mjs` l.48, l.120).

   Neither occurs here: all 144 lines parse and all 136 thresholds read. Before the registered read reuses the script:
   - allow " FLAGGED";
   - make the capped clause optional;
   - refuse when the parsed count is not the class's.

## What holds

- **The figures.** Every figure and named unit in the write-up matches the three results files: the table; the losses and
  thresholds; each class's survival range; R's parts; the pot's and the tax's percent ranges; N's; M1; and the outcome.
- **The R trend.** "The gain is smaller the further apart" holds beyond noise. By path, 1 apart less 3 apart is `+1.911`
  (`+1.692` to `+2.130`), and each step and each couple is positive.
- **The reducer** reads amendment 2 as written:
  - D34 in whole paths;
  - pooled survival by path with its lower end above 0;
  - kept spending with the units weighted equally, not below `-0.05%`;
  - W read only on an identity file naming the units' stamp, each W unit IDENTICAL, 24 of 24;
  - N outside `READ_CLASSES`, printed.
- **The gate is fair:**
  - one code, which is the tree's now;
  - one audit, equal to `stampFilesHash()` now, so the launched audit, reducer, panel and batch;
  - the panel's 144 units, with class, variant, kind, holding and recorded shape checked;
  - both arms at `configOf`, every array one a path;
  - each case log stamped by the launcher (prediction none) with its done line, and no "unit N exited".
- **The identity** holds the page's route on the same input plan, as stated:
  - the worker cuts with no shapes named (`shapesOf` gives `APP_COUPLE.takeShapes`, in `householdSolved` too);
  - it solves in `bandsAt` (`bands.paK` is already a boolean);
  - it assembles at the even split, top three, tie-break and hold;
  - `solveForApp` defaults to `APP_POINTS`.
- **The guard:**
  - at 'own', `coupleSolverOn` gives on, no route and nothing lifted, so the client (`APP_COUPLE.household`, not closed)
    takes the household route where the cut takes the shape;
  - at Y75 it gives route 'household', lifting Y, so the client is held to the household route.
- **C's exactness.** `household-salaries.test.mjs` check 4 says what l.86 says.

Findings 1 to 3 concern the write-up only; the read and its outcome stand.
