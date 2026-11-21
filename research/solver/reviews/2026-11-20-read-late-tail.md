Verdict: FAIL

# Review at the read: the late tail (`LATE-TAIL.md`; EXPLORATORY, seed 7002; D134 (1))

Subject: the read committed in c2299a50: `results-late-tail.txt` (cb2cb81af600, the reducer's output whole), the write-up
`reports/2026-11-20-late-tail-read.md` (9868f49b1df6), its entry in `DECISIONS-PENDING.md` (lines 14 to 26) and its words
in STATE.md section 6 (line 299).

Read (blobs at HEAD f5ff70cf):
- The rule and its machinery, each last changed in 95b1d2b0 (20 Nov 10:24 UK) and unchanged since: `LATE-TAIL.md`
  075821c31021, `audit-late-tail.mjs` b3c2555c1143, `reduce-late-tail.mjs` af25cab60476, `batch-late-tail.sh`
  de9c9975aa25; the panel `household-hsp-panel.json` 78e4b83eb4d0.
- The run: `results/late-tail-launch-1.log` (snapshot of 180432fe, 12:05 UK; units 12:10 to 15:28 UK; no unit exiting
  with an error); `results/late-tail-7002/` (ten unit files, `case0.txt` to `case9.txt`, `parts/` empty).
- The code the arms rest on: `research/engine.mjs` (generated, 75ad6ebac110) line 2116; `src/solver/bridge.js`
  da9362efe86b lines 33 to 37 (`tablePolicy`); `src/solver/solve.js` b3c20b3e7f21 lines 1905 and 2019;
  `src/solver/couple.js` line 944 (`couplePolicy`); `household.mjs` line 496 (`householdSinglePolicy`);
  `audit-household-decomp.mjs` 01333c239c85 line 146; the deep review `reviews/2026-11-20-deep-household-hsp.md`
  d42b0c541a7f section 3; `HOUSEHOLD.md` section 2.

Ran (at nice 19; my scripts in the session's scratchpad; nothing in the tree edited; seed 7002 only):
- `node research/solver/reduce-late-tail.mjs research/solver/results/late-tail-7002`: the same as `results-late-tail.txt`
  byte for byte. Its `--planted`: ALL PASS (12). The audit's `--planted`: all 7 read as they should. The stamp of the files
  now is 57cc9f06eafb, every unit's.
- A recount from the unit files, independent of the reducer (`lt-check.mjs`): D `£52,873`; L `-97.2%`, R `136.8%`, CEIL
  `87.4%` of D; net paths lost pooled HSPA 28, L 745, R 351, CEIL -11. The paired per-path se of D is about `£5,100`. R's
  margin over half of D is `£45,900` (se `£7,100`), L's `-£77,800` (se `£3,700`). Leaving any one unit out, R reads `108%`
  to `152%` and L `-53%` to `-116%`. So R's and L's verdicts are not path noise.
- A probe of CEIL's wiring (`ceil-held.mjs`, `ceil-held-wt.mjs`): finding 1.

What holds:
- The gate is fair as printed: one code, audit, seed, count of points and Node; each unit's checks recorded; the files the
  read takes committed before the launch and unchanged since.
- On these unit files the outcome follows from the rule as written.
- Every figure in the write-up is printed in `results-late-tail.txt`, except `+0.762` (`results-household-hsp.txt` line 6).

## Findings

1. **BLOCKING. CEIL is not the arm the rule names. The outcome's CEIL NEAR K2, and so the stop, rests on it.**
   - The rule: CEIL is "`bridge.js` `withTable` on the household plan ... run beside as the decomposition ran it"
     (`LATE-TAIL.md` lines 35 to 36). The decomposition ran it unwrapped (`audit-household-decomp.mjs` line 146).
   - As built, CEIL's policy goes through `recorded` (`audit-late-tail.mjs` lines 124 to 126, used at line 233). Its
     `choose(es, t)` calls `pol.choose(es, t)`. The engine calls a table with a third argument, the tiers held
     (`engine.mjs` line 2116). A single's table uses it (`bridge.js` lines 35 to 37). Without it the chooser charges no
     tier switch (`solve.js` lines 1905 and 2019). So CEIL as run is the household table's chooser blind to the tiers it
     holds.
   - K2, HSPA, L and R are not touched. `couplePolicy` and `householdSinglePolicy` take two arguments, and K2 and HSPA
     equal step 8's pilot. None of the rule's four checks can see CEIL's fault: check 4 holds CEIL to `E.runTrial` on its
     own wrapped context.
   - My probe: each of the seven units' household table solved again at 45 points, as the audit solves it.
     - With `recorded` kept, CEIL equals the stored arrays: 400 of 400 of S273-own's first paths, and 20 of 20 worst-tenth
       paths on each of the seven.
     - With the tiers held passed, as the engine and the decomposition run a table: on S273-own's first 400 paths the end
       pot differs on 385 and survival on 2 (the mean end pot `£12.51m` as run, `£16.07m` wired).
     - On the worst tenth, CEIL's mean end pot as run and wired: S025-45 `£27,108` and `£27,895`; S273-own `£244,553` and
       `£190,707`; S273-sppart `£262,894` and `£197,472`; S357F-45 `£680,859` and `£589,926`; S357F-db `£615,347` and
       `£560,572`; S357F-gap8 `£701,084` and `£622,185`; S357F-own `£635,665` and `£577,010`.
     - CEIL's restoration over the seven: `£46,214` (`87.4%` of D) as run, `-£11,178` (`-21.1%`) wired. On the worst
       tenths it keeps 36 paths fewer than K2, net; as run, 7.
   - So with CEIL as the rule names it, CEIL does not restore half of D and CEIL NEAR K2 is not printed. By `LATE-TAIL.md`
     lines 74 to 76 the read would be THE GROWTH alone: "The build goes on to `main` on B1's gate". The write-up's CEIL
     sentences ("ends the worst markets nearly where K2 does"; "CEIL keeps more paths than K2") and the beside's CEIL
     figures are the miswired arm's too. My probe's figures show the fault's size; they are not the read.
   - The outcome as printed is already with the maintainer: `DECISIONS-PENDING.md` lines 14 to 26 (committed in c2299a50
     and on the remote) and STATE.md line 299.
   - What answers it:
     - `recorded` passing every argument (`choose(es, t, ...rest)`), with a check of its class: each recorded table arm
       equal bit for bit to its context without the recorder on the first 200 paths, its plant the recorder dropping the
       tiers held.
     - The pattern search. By my grep, `whyRecord` (`audit-household.mjs` line 87) has the same two-argument wrapper but
       wraps only K2 and HS5 (line 278), couple policies; `share-replay.mjs` line 116 wraps couple policies.
     - CEIL run again on the fixed audit (the ten units whole, or CEIL alone by a dated amendment) and read again by the
       same rule.
     - The `DECISIONS-PENDING.md` entry corrected now. The fault and both reads go to the maintainer before the build
       moves either way.

2. **BLOCKING. The write-up claims a cause for R that the figures do not show, and in part contradict.**
   - The claims: "The smaller end pot comes from the risk the household table holds" (write-up line 25); "The household's
     tiers are not simply wrong: they buy survival with the late pot" (lines 34 to 35).
   - The rule's outcome is a lead: R, HSPA's move with K2's tiers asked at HSPA's states, restores at least half of D. It
     does not split the cause.
   - The risk the read prints does not show R holding less growth. On the worst tenth (results lines 15, 16 and 19) R
     holds HSPA's early risk on S273-own (`4.04%` against `4.05%`), S273-sppart (`4.05%` and `4.05%`) and S357F-gap8
     (`4.00%` against `4.01%`). From year 10 on it holds more (`3.18%` against `3.09%`, `3.18%` against `3.09%`, `3.53%`
     against `3.48%`). Yet R restores the whole shortfall on those three (R `£264,610`, `£267,858`, `£691,654`; K2
     `£243,217`, `£246,417`, `£688,729`). From year 10 on R's risk is above HSPA's on five of the seven.
   - R keeps fewer paths than HSPA on every one of the ten units (results line 24). By my recount (not printed), 259 of
     R's 351 net paths lost against K2 are on the seven's worst tenths themselves, 234 more than HSPA loses there. So R
     lifts the worst tenth's mean pot by ending richer on the paths it keeps while losing more of them. That is not a
     protected late tail.
   - Against K2, HSPA's tiers buy no survival on the seven: HSPA keeps 28 paths fewer and ends the worst tenth `£52,873`
     lower. "They buy survival with the late pot" holds only against R, a hybrid.
   - What answers it: R's result in the rule's words, as a lead; the two causal sentences dropped; and beside it, the
     worst tenth's survivors by arm, printed by a script, with the risk figures above.

3. **BLOCKING. "The gain and the loss are one trade" does not follow, and an option to the maintainer rests on it.**
   - The claims: the write-up's "the controls' gain and the seven's loss are then one trade" (line 40) and "take HSPA as
     it stands, as the trade the controls show" (line 58). `DECISIONS-PENDING.md` says it flatly (line 22: "so the gain
     and the loss are one trade") and offers (b), "take HSPA as it stands, as that trade" (lines 24 to 25).
   - R keeps fewer paths than HSPA on all ten units and fewer than K2 on nine (results lines 14 to 24). So a control loses
     its gain under R whatever the cause. The check cannot tell one trade from a hybrid that loses paths everywhere.
   - On the seven, R makes the loss the test set out to explain (paths kept) twelve times larger, 351 against 28. One
     trade would have R take that loss away.
   - As printed the outcome is CEIL NEAR K2, which `LATE-TAIL.md` (lines 77 to 79) reads as the table reading the couple as
     safer than it is. The deep review puts the "one trade" sentence under the other branch, CEIL no nearer K2 than HSPA
     (section 3, lines 214 to 219). So the option contradicts the outcome it is offered beside.
   - What answers it: the beside's condition said to be met in its own terms, with the fact that R keeps fewer paths than
     HSPA on every unit, so the controls do not show one trade. Taking HSPA as it stands stays the maintainer's to choose,
     on step 8's read, not on this check.

4. **MINOR. What L is.**
   - On the worst tenth, L's level in years 0 to 9 is above K2's own on six of the seven (S357F-db `87.7%` against
     `83.5%`; S357F-own `85.9%` against `83.0%`; and on M1's unit `95.7%` against `83.1%`). L is K2's chooser at HSPA's
     states, not K2's spending. "K2's spending level on HSPA's move makes the worst markets' end pot lower still" reads as
     if K2's caution hurt.
   - HSPA's own early level there is within `1.1` points of K2's: higher on three units, lower on three, the same on one.
     So the read does not show HSPA cutting less early in these markets, the first half of the deep review's lead.
   - What answers it: those two points beside L's result.

5. **MINOR. "The worst tenth" is not the worst tenth of the markets on most units.**
   - APP ends at nought on 490 to 566 paths on eight of the ten units (my count; S025-45 171, S349F-own 369). There the
     400 taken are the lowest-numbered of those paths, ties by path as the rule says (the highest taken 2,840 to 3,338).
   - That is fair between arms, since a path's number carries nothing of its market. But it is 400 of the paths on which
     the app's rules run out, picked by number.
   - What answers it: the write-up says so, with the count printed.

6. **MINOR. M1's unit is given on one of the beside's lines.**
   - `LATE-TAIL.md` line 90 asks for S273-90 "on the same lines"; the write-up gives its paths lost alone.
   - Results line 21: on its worst tenth HSPA spends less early than K2 (`80.9%` against `83.1%`), the opposite of the
     lead. HSPA's pot there is `£219,994` against K2's `£238,837`, and R restores all of it (`£240,018`) while keeping 4
     paths more than K2: the one unit where R does not lose paths against K2.
   - What answers it: those lines in the write-up.
