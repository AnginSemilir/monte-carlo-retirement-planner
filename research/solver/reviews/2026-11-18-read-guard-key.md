# Review at the read: what keys the guard (GUARD-KEY.md; D129 (4); EXPLORATORY, seed 7002)

Subject: the read committed at 02b1e8e4: `results-guard.txt`, the reducer's output whole (+db NO HARM, so THE GUARD IS
KEYED ON THE WRONG THING; +rent HARM), and its write-up `reports/2026-11-18-guard-key-read.md`.

Read (blobs at 02b1e8e4, the branch's head; none of the rule's files changed after their commits):
- the rule: `GUARD-KEY.md` 45aaad76c751 (d92ccea9, 19:12:08 UTC); D129 (4) and (5) in STATE.md.
- its files: `guard-panel.mjs` caf71f51fb2a (d92ccea9); `guard-panel.json` 1afc5e827620, `audit-guard.mjs` 22b3db6ef178,
  `batch-guard.sh` 95a545a515e7, `reduce-guard.mjs` 95c2d8cf3086 (all 5262779f, 19:16:19 UTC); each has that one commit.
- what they import: `shapes-panel.mjs` af92d5e2e71a, `shapes-panel.json` 1aefb679e60b, `audit-shapes.mjs` 94180a00e4ae
  (step 5's K2 and APP, to compare), `share-rules-panel.mjs` 168dcae982f6 (`withFeature`), `audit-phase4.mjs`
  5ace83959b96 (`solverPlanOf`), `stats.mjs` a4095c8e339e, `src/couplesSwitch.js` b33f855de049, `src/App.jsx`
  e8d5c4220dd5 (`buildContext`'s income floor, lines 1798 to 1823; the generated `research/engine.mjs` 1761 to 1785 the same).
- the results: `results-guard.txt` 56df67561cdf, `results-guard-planted.txt` fdcd6d77c992,
  `results-guard-panel-planted.txt` a96f1cef6467; cited by the write-up, `results-shapes-beside.txt` 916e4641b01d and
  `results/shapes-7002/` (the four gap units without an income, and section D's 28).
- the run: `results/guard-land.log` and `results/guard-land/*.json`, `results/guard-launch-1.log`, `results/guard-7002/`
  (eight unit files, `case0.txt` to `case7.txt`, `parts/` empty), `runs.log`'s line for 18 Nov 19:37 UK, the reflog.
- the write-up: `reports/2026-11-18-guard-key-read.md` 72a4b34f7ad1. Every path read is seed 7002's or 7005's.

Ran (scripts in the session's scratchpad; nothing in the tree edited):
- `node research/solver/reduce-guard.mjs`: `results-guard.txt` byte for byte, the gate fair. `--planted`: 11 of 11.
  `node research/solver/guard-panel.mjs --planted`: 6 of 6. `code-id.mjs`: 603eeb595679; `stampFilesHash()`: 8086bcf05f68,
  the stamp on all eight logs.
- My own recomputation from the unit files, apart from the reducer: each unit's cells from its decoded `survived` arrays,
  the exact interval by `stats.mjs` `survivalChange` and by my own binomial-tail Clopper-Pearson. All eight match the read.
  +db pooled 1269 saved, 125 lost of 16,000: +7.150 (+6.867 to +7.402). +rent 517 saved, 597 lost: -0.500 (-0.912 to
  -0.085). Step 5's four without the income (438, 390, 430, 461 saved, none lost): +10.744 (+10.698 to +10.744). By path,
  since the units share seed 7002's paths and correlate: +db +7.150 (+6.571 to +7.729), +rent -0.500 (-0.974 to -0.026).
  Both outcomes hold either way.
- Each guard unit's plan against `shapes-panel.mjs` `unitOf(<step 5 unit>).planAt(<its target>)`, field by field: one
  difference on each, the added income (owner Myself, £15,000, otherTaxable, end blank; +db from 68, +rent from the first
  person's age now).
- `guard-panel.mjs land 3` and `land 2` into the scratchpad: S149@gap12+rent 36300, arm A 85.4, ISA First, lump sum;
  S149@gap12+db 29600, 84.6, ISA First; the same steps as the records.
- The engine's context for each unit (`E.buildContext`, as each arm builds it): the start of each income (finding 1).

What holds (no finding):
- **The order of events.** The rule and the panel's builder were committed at 19:12:08. The first landing file was
  written at 19:12:36.5 after 20.5 s, so it began about 19:12:16. The landings ran one after another, and each records
  head d92ccea911e7. The audit, batch and reducer were committed at 19:16:19, before any run on seed 7002. The smoke
  printed no figure.
- **The launch.** The log says "from 1d23910d + 1 uncommitted file(s)". HEAD was 1d23910d from 19:31:13 to 19:32:54. The
  only change from it to the next commit (8655093c) is one line of `runs.log`, the decomposition's launch line, which no
  script reads. `results/` is ignored.
- **The arms are step 5's.** `audit-guard.mjs` builds K2 and APP as `audit-shapes.mjs` does: the same `solveOne`, at
  `tieAboveCap: undefined`, `solveCouple` with JOINT, and the same two contexts. No unit is mirrored. Each arm was held
  to `E.runTrial` on its first 200 paths, and the settings check passed.
- **The write-up's figures.** Each one is the read's: +7.150, the four +db units, -6.850, +0.450, +0.875, +3.525, -0.500,
  +10.744, +0.92% to +2.66% on the paths both keep, the capped pot higher on seven and -3.828% on S149@gap12+rent, and
  `gapincome` on all eight. HS less APP +12.575, +10.900, +9.250 are step 5's section D.
- **The counts.** Each base couple is three years apart, so the gap couples are exactly the gap8 and gap12 units. Among
  those with an income, four are harmed (S147-db@gap8 -6.800, S147-db@gap12 -10.950, S061-dbpart@gap12 -20.250,
  S149@gap12+rent -6.850). The other eight gained or held level (S061-dbpart@gap8 +6.200 and the seven here).
- **What each harmed couple holds.** S147-db's income is the first person's (owner Myself, from 68). S061-dbpart's is the
  partner's (owner Partner, from 68). S149@gap12+rent's is the first person's rent from 56, which is now.
- **What it leads to.** It follows the rule and D129 (4): +db NO HARM sends the re-keying to the maintainer as a change
  of default, and nothing changes in the app. Item 5 waits, because D129 (5) applies only "if the guard stays". The
  write-up says the cause is not shown and does not put one in its place.

Verdict: FAIL

## Findings

1. **BLOCKING: on two of the four rent units the rent did not run "from now".** The engine counts no income before its
   owner retires (`src/App.jsx` 1806 to 1823: `startAge: Math.max(incomeFloor(i), ...)`, where `incomeFloor` is the
   owner's retirement age).
   - **What ran.** S337F's first person is 37 and retires at 52. On S337F@gap8+rent and S337F@gap12+rent the £15,000 runs
     from age 52, which is plan year 15, in both arms. My check of the contexts the audit builds gave "S337F@gap8+rent
     first person 37: APP's context self from age 52 (plan year 15); the plan K2 is handed self from age 52 (plan year
     15)", and the same for gap12. `buildContext` warns on both plans: "Rent (the guard test): income starting at 37 is
     counted from 52, the age you retire — nothing is drawn or saved before then." On S149 (first person 56, retired at
     55) the rent does run from plan year 0.
   - **What the write-up says.** "This test gave those four (S149 and S337F at gap8 and gap12) ... £15,000 a year of rent
     from now instead", and "With rent from now instead, the default does worse on one of the four ... The other three
     gain or are level". These claims cannot stand. Rent from now was tested on S149's two units alone: S149@gap8+rent
     +0.450 (-0.454 to +1.345), level, and S149@gap12+rent -6.850, harmed. Pooled, they are -3.200 (-3.834 to -2.541).
     The two units that gained beyond noise had the rent from fifteen years in: S337F's, +2.200 (+1.768 to +2.595)
     pooled.
   - **Why it matters.** The write-up names the income's start as the difference to decompose, and the rule's own lead
     contrasts "rent from now" with a DB pension from the state pension age. So the maintainer needs to know which start
     each unit had.
   - **Why nothing caught it.** The rule's "from plan year 0" (`GUARD-KEY.md` line 28) cannot be given to a working first
     person; the code's comment says the app's own input "will not take an earlier age now". The panel's planted check
     "+rent adds exactly one income ... from now to the end" reads the plan's field, and only on S149@gap8, whose first
     person is already retired, so it cannot fail on this. `audit-guard.mjs` checks the income's owner, amount and kind,
     not its start. The read prints no start.
   - **The outcome stands.** HARM rests on S149@gap12+rent, whose rent does start now, and the +rent consequence ("the
     reach holds on these couples") is unchanged.
   - **To answer it.** Say in the write-up which start each rent unit had (S149's two from now; S337F's two from the first
     person's retirement at 52, plan year 15, because the engine counts no income before its owner retires). Restate the
     rent result on that footing, here and in the lines to be written in STATE.md and DECISIONS-PENDING.md. Printing each
     unit's income start as the engine reads it beside the rule would keep it on the record.

2. **MINOR: the end pot is registered beside the rule but not printed, and it runs against the capped pot.**
   `GUARD-KEY.md` line 67 lists "the end pot and the capped pot". `reduce-guard.mjs` (lines 163 to 164) prints the capped
   pot only.
   - **The mean end pot.** K2's is below APP's on all eight units: S149's four by 29.4% to 39.8%, S337F's four by 88.1% to
     90.4%.
   - **The median end pot.** K2's is below APP's on six of eight: S337F's four by 39.3% to 53.6%, S149@gap8+db by 0.2%,
     S149@gap12+rent by 1.3%. It is above on S149@gap8+rent (+16.0%) and S149@gap12+db (+4.5%).
   - **What to change.** It decides nothing, and the capped pot is the project's measure (D116). But the write-up's "the
     capped pot is higher on seven" should stand beside the registered end pot.

3. **MINOR: "four couples" and "do no harm elsewhere" are true of the gap couples only.**
   - **The sentences.** "The default has now lost to the app's rules on four couples" and "the same incomes do no harm
     elsewhere".
   - **What step 5 also shows.** The default lost to the app's rules on S061-dbpart@penB90, -10.175 (-10.559 to -9.649),
     and on S061-dbpart@penA100, -2.850 (-3.106 to -2.459) (`results-shapes-beside.txt` section D). Both have the
     partner's DB pension, are three years apart, and are kept on the app's rules by the holdings guard ('uneven'). So
     the partner's DB pension couple lost on three of its seven shapes.
   - **What to change.** Scope both sentences to the gap couples, or name these two.

4. **MINOR: the comparisons offered under "Find the cause first" differ in more than the write-up says.**
   - **The first comparison.** S149@gap12+rent against S149@gap12+db also differ in arm A's pick (`guard-panel.json`):
     ISA First with the full 25% lump sum, against ISA First without. That pick is APP's own rules. `audit-phase4.mjs`
     `solverPlanOf` carries arm A's decumulation policy into K2's plan only where the deposit order differs, and never
     the lump sum, so the pick reaches APP alone.
   - **How it lines up with the harm.** Arm A takes the full 25% lump sum on every harmed gap couple: S147-db@gap8 and
     @gap12 (ISA First, lump sum), S061-dbpart@gap12 (Bracket Fill, lump sum) and S149@gap12+rent. It also takes it on six
     of the twelve gap couples that were not harmed. So it is neither a key nor a cause the read shows, but it is a
     difference a decomposition must hold or name.
   - **The second comparison.** S147-db@gap12 against S149@gap12+db differ in arm A's pick too, and in target (35,400
     against 29,600).
   - **What to change.** The write-up should not present the income's start and the targets as the only differences.
