# Review at the read: the couples trade (`COUPLES-TRADE.md`, EXPLORATORY, seed 7002), read 23 Nov

**Subject:** the read and its write-up.
- The read is `results-couples-trade.txt` (A CONTROL FAILS; THE PRICING HOLDS). `reduce-couples-trade.mjs` wrote it over
  `results/couples-trade-7002`.
- The write-up is `reports/2026-11-23-couples-trade-read.md` f32101246428. It was committed with the results file
  (e57aca61fb63) in ead863a1 while this review ran; the blobs are the ones reviewed.

**What I read** (git blobs, first 12):
- the rule `COUPLES-TRADE.md` 6ccd8df85535, committed in 2f827ee0 before the launch;
- its source, `reviews/2026-11-22-deep-couples-open.md` 2b2c268f6176, section 3;
- `audit-couples-trade.mjs` 8f7086d175d5, `reduce-couples-trade.mjs` b529bddf4099 and `batch-couples-trade.sh`
  74730f7e700f. None has changed since 2f827ee0: `git diff 2f827ee0 HEAD` is empty and the working tree has no change to
  them.
- what they reuse:
  - `audit-couples-open.mjs` 8ccaa3118266 (`solveRoute`, `routeContext`, `unitProblems`, `KEYS`);
  - the built `research/engine.mjs` ca1de90535c9 (`stepYear`, l.2130 to 2160 and 2427 to 2505);
  - `src/solver/household.js` 06b69ec74e77 (the forms, l.86 to 88; `bandsAt`, l.98 to 105; the scaled allowance, l.189
    to 192);
- `LATE-TAIL.md` b0c41dd700b9 (its L, l.32 to 33), `results-household-arm.txt` 0eef14d8b4e6 and `results-couples-open.txt`
  be3ee4820ba9 (M1, l.68);
- the results file e57aca61fb63, the launch log b71a10826807, and the 13 unit logs and 13 records.

**What I ran** (EXPLORATORY, after the read; it decides nothing and solves nothing). The scripts are in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/ct/`, a1 to a5.
- **The read again.** It is byte for byte the results file (`diff` empty).
- **`--planted`.** `ALL PASS: 6 planted checks`.
- **a1, a2 and a5** go over the stored arrays with the reducer's own `loadDir`.
- **a3 and a4** re-run APP alone (the app's fixed rules, no table) through the engine on seed 7002's paths. On every unit
  re-run, each path's survival, fail year and tax are as stored, on 4,000 of 4,000.

Verdict: FAIL

The read stands. The arms are built as the rule says, the checks are sound, the reducer applies the rule and the outcome
follows from the figures. The FAIL is one claim in the write-up: what the failed control means (finding 1).

## What holds

1. **The arms are the rule's.**
   - **APP and ROUTE.** Every log records check 1: ROUTE's table digest is the registered read's and the pilot's, and its
     `k` is the registered read's. Every log records check 2: APP and ROUTE equal the pilot's arrays on every key over the
     first 1,000 paths.
   - **L.**
     - `levelPolicy` keeps ROUTE's move and replaces only `spendLevel` (audit l.124 to 134).
     - `levelsFromDemand` sets the level to APP's demand over the scheduled target on ROUTE's context and over year 0's
       fraction (l.138 to 142, 201 to 203).
     - That inverts the engine's demand: `scheduled x spendLevel`, then `x frac` (engine l.2436 to 2439, 2503).
     - Where APP has no demand, ROUTE's own level stands (l.203).
     - Check 4 shows L's demand is APP's in every year of every path, the largest gap `1.22e-16` to `2.18e-16` across the
       13 units.
   - **PA2.** `solveHouseholdAt` is `solveRoute`'s household branch at the 'pensions' form (l.96 to 102). Check 5 holds:
     `k` is ROUTE's, the allowance is 25,140 (two people's), and ROUTE's is `k` times 12,570.
2. **The checks can fail.**
   - Check 3 compares every key twice: ROUTE through the recorder against ROUTE (l.216 to 217), and L on ROUTE's own levels
     against ROUTE (l.219 to 222).
   - Check 4 compares L's recorded demand with APP's in every year (l.226).
   - Under `CT_PLANT=nextpath` both take path k+1's donor, and the planted mode exits 0 only when both catch it (l.230).
     Finding 7 covers the record of that run.
   - Check 6 holds each arm to `E.runTrial`.
3. **The rule and its outcome.**
   - **The rule.** `rule` (reducer l.59 to 67) sums the trade's share in whole paths over the nine units and gives each
     control its own share. It fails a control with no gain or a share below `0.75`. `keptGBP` and `shortfallOf` (l.49 to
     58) are the rule's pricing figure and shortfall.
   - **The outcome follows from the figures** (arithmetic):
     - the pooled share is -1,149 / 4,986 = `-0.230`;
     - S279-E100's share is 298 / 429 = `0.695`, below `0.75`, so A CONTROL FAILS;
     - ROUTE's shortfall is (201 + 381 + 389 + 503) / 4 = 368.5 and PA2's is (42 + 40 + 62 + 76) / 4 = 55. 55 is at most
       184.5, so THE PRICING HOLDS.
   - **The gate is fair.**
     - All 13 logs carry one stamp, `code 36e4d2a860b2 audit 4f8d4cd86ede prediction none`.
     - The configurations are APP ef459a5c8ccb, ROUTE 35ee3a2dc6ad, L 0455e1460ee4 and PA2 7a79cb21d001.
     - Every check is recorded, and the launch log has no `exited` line.
   - **THE PRICING is far from its bar.** PA2's shortfall over ROUTE's is `0.149`. A path bootstrap (a5: 1,000 draws, the
     five units resampled together) gives `0.120` to `0.178`, above `0.5` in none.
4. **The write-up's figures are the results file's.** I checked each one:
   - the controls (l.33 to 35 against results l.4 to 6);
   - the pricing and its table (l.43 to 52 against l.9 to 13);
   - S037's shares (l.63 to 67 against l.3, 7 and 18 to 27);
   - PA2's spending (l.75 to 78 against l.32 to 44);
   - D34 (l.73 to 74 and 82 against l.74 to 86);
   - the worst fifth (l.84 to 85 against l.60 to 68);
   - the tax (l.87 to 90 against l.47 to 58).

   Three claims beyond the file also hold:
   - **S279 is the youngest control.** It is 45 and 42, against S119's 61 and 58 and S199's 55 and 52 (`readOpenPanel`).
   - **M1 names nine of S037's units** (`results-couples-open.txt` l.68).
   - **The note that PA2 is HSP, set aside for HSPA, is right.** Step 8's arm read flagged HSP on S191-90 (net 26 against
     23) and took HSPA (`results-household-arm.txt` l.4, 7 and 13). The code names the 'pensions' form HSP
     (household.js l.86 to 88).

## Findings

1. **BLOCKING. The write-up settles what the failed control puts in question, and the records point the other way.**
   - **The claims** (write-up):
     - l.22 to 23: "Arm L runs the household plan's own moves with the app's rules' spending put back, path by path and
       year by year."
     - l.37 to 39: "L's wiring held on every unit (checks 3 and 4). So what the failure puts in question is the controls'
       premise: that on them the household plan's gain owes almost nothing to spending. On S279, the youngest couple, it
       holds less than the rule asked."
     - l.112: "Why S279's gain owes about a third to spending".
   - **The rule decided less.** COUPLES-TRADE.md l.89: "A CONTROL FAILS. Either L's wiring or the controls' gains is in
     question. It is reported, and THE TRADE is not read."
     - The write-up picks one branch.
     - "Owes about a third to spending" is a cause read off L, the very measure the controls test.
     - Checks 3 and 4 hold L to its specification: the recorder is inert, L on ROUTE's own levels is ROUTE, and L's demand
       is APP's. They do not show that the specification puts the app's rules' spending on L's paths. On the paths that set
       the controls' shares, it does not.
   - **L takes APP's demand as APP's own run of the path had it** (COUPLES-TRADE.md l.28; audit l.203 and 213).
     - The engine's guardrails act only `if (baseDraw > 0 && potNow > 0)` (engine l.2460).
     - Once APP's pots are empty, its demand is the full scheduled target (l.2437 and 2503).
     - The deep review names the late tail's L as the model (l.235). That L asked the donor at L's own state (LATE-TAIL.md
       l.32 to 33). This one does not.
   - **The deciding paths are where APP runs out early.** These are the paths ROUTE saves and L loses (a2):
     - S279-E100: 132, with APP running out before the plan's end on 121;
     - S199-E100: 98, with 59;
     - S119-E100: 40, with 13;
     - G12P, beside: 222, with 220.

     On each of S279's 121, L fails later than APP did: L's mean fail year is 49.1, APP's 40.0, with T at 51.
   - **There, APP's demand jumps to the full target.** a3 re-ran APP alone on S279-E100. On the 121 paths, APP's level
     (its demand over the scheduled target) is:
     - `0.80` in the three years before its fail year (mean `0.801`, the floor);
     - `1.000` in each of the 1,325 years after it, with its whole pot at most £1 in all of them.

     The same holds on S199 (342 years after), S119 (36) and G12P (3,800).
   - **So on S279's deciding paths L spends more than APP ever did, and so does ROUTE.** A path (a2):
     - APP delivers £1,425,932 and leaves £341,900 unmet;
     - ROUTE delivers £1,619,497 with nothing unmet, and keeps every path;
     - L delivers £1,703,301 and leaves £64,531 unmet, against APP's demand of £1,767,832 (arithmetic: 1,425,932 +
       341,900).

     On these paths the household plan spends more than the app's rules delivered, and survives. That is the controls'
     premise as the deep review states it: it "finds money besides spending, and spends more" (l.43 and 130). It is not a
     third of the gain owed to spending.
   - **Set aside APP's early ruins, and each control clears its bar.** This is a2, a post hoc reading and not the rule's:
     S279 `0.945` (172 of 182 net), S199 `0.891` (318 of 357), S119 `0.934` (323 of 346).
   - **What must change.**
     - The write-up says what the rule decided: A CONTROL FAILS; either L or the controls' gains is in question; the read
       does not say which; and THE TRADE is not read.
     - It drops "the controls' premise" as the failure's meaning, and "owes about a third to spending".
     - It describes L as the rule built it: APP's spending demand as APP's own run of the path had it. After APP runs out,
       that is the full target APP leaves unmet.
     - If it cites why the control failed, a script prints those figures from the results files (CHECKLIST 6), labelled
       post hoc.
     - The S037 lines (l.63 to 71) can stay. There APP leaves little unmet on the deciding paths (S037-Y75 £3,700 a path,
       and L delivers within £1,125 of APP, a2), and the lines already say the read does not show why.
   - **For any later look at THE TRADE:** L needs a level after APP's fail year, such as the app's rules applied to L's own
     pot. It also needs a check that L delivers no more than those rules would on L's own path.

2. **MINOR. The pricing's size. PA2 changes the allowance for all the household table's income, not for the partner's
   state pension alone.**
   - **The claim** (l.94 to 96): "The household plan's tax on a partner's state pension at an allowance of `k` times one
     person's is measured now. It costs the four uneven S037 units about £369 a year of spending against Y75. PA2 takes
     all but about £55 of it away".
   - **What the figures attribute to PA2.** £369 is the rule's shortfall against Y75, and PA2 removes £314 of it
     (arithmetic: 369 less 55). On the four units' own spending against APP, PA2 less ROUTE is £128, £310, £296 and £396 a
     year, a mean of £283 (arithmetic on results l.33 to 36).
   - **What PA2 changes.** At 'pensions' the household table's allowance is two people's, and every threshold above it
     moves up with it (household.js l.104 and 191 to 192). So the table prices all its taxable income against two
     allowances: the draws, and both state pensions.
   - **Where that differs from the engine.** On Y100 and E100 one person holds every pot. The engine prices that person's
     draws against their own allowance only, and so would the fix the rule names.
   - **The engine's tax under PA2.** PA2's lifetime tax is above ROUTE's on all four units: £383, £970, £2,192 and £3,028
     against £24, £70, £685 and £935 (results l.47 to 50). So PA2's table draws income the engine taxes. How much of the
     £314 that accounts for is not measured.
   - **What to say.** The £314 is what two allowances recover, not the named fix's expected size. The write-up says PA2 is
     not the fix (l.79 to 81). Its "What it means" should say so of these figures too.

3. **MINOR. PA2's survival against ROUTE has one sign, which the write-up does not give.**
   - The write-up reports D34 alone (l.73 to 74, 96 and 114 to 115).
   - **The sign** (arithmetic on results l.18 to 30 and 74 to 86):
     - PA2 is below ROUTE on 11 of the 13 units, level on G12P and above on S279;
     - over the 13 it loses 98 paths and saves 25;
     - on the four pricing units it loses 28 and saves 1, which is 27 net of 16,000, about `-0.17` points.
   - D34's threshold at 4,000 paths (21 a unit) cannot read a change of this size.
   - **Why it matters.** This is the trade the deep review expected: "about a quarter of a point of survival in return"
     (l.271 to 272). Its "need not wait" rests on "it moves spending, not survival" (l.276).
   - **What to say.** Give the sign and these counts beside D34, so that "PA2 moves spending with D34 flagging no unit"
     is not read as no change in survival.

4. **MINOR. "Before any default moves" contradicts "Y and E need not wait for it".**
   - l.99 to 101 ends "and an EXPLORATORY read on these units before any default moves".
   - l.57 says "Y and E need not wait for it", as the rule does (COUPLES-TRADE.md l.86).
   - As written, the first would hold back Y and E's change of default too. It should say: before the fix enters the
     default.

5. **MINOR. A read of the fix on these units alone could not show HSP's harm.**
   - The note at l.79 to 81 is right. PA2 is HSP, and step 8's arm read set it aside because it flagged S191-90
     (`results-household-arm.txt` l.34: `k` 1.111, 10 saved and 36 lost, forecast `+1.11`).
   - That unit is not among these 13. So a read of the fix on these units alone could pass while doing what HSP did.
   - The fix's EXPLORATORY read should take S191-90, the arm read's flagged unit, beside them. This is for the fix's
     design, not this read.

6. **MINOR. The checks' scope as the write-up states it.**
   - **The first 200 paths.** "L given ROUTE's own levels is ROUTE, bit for bit" and "Every arm matches `E.runTrial`"
     (l.13 and 16) hold on the first 200 paths (audit l.216 to 222 and 245 to 255; every log says "on the first 200
     paths"). Check 4 covers every path.
   - **What check 4 does not exercise.**
     - On all 13 units the first year is whole (`yf` 1) and the plan has no spending bands (`buildContext` on each plan, as
       `readOpenPanel` and `solverPlanOf` build it). So check 4 cannot catch a fault in year 0's fraction or the band
       lookup.
     - The code's arithmetic is right by reading (audit l.140 against engine l.2436 to 2439 and 2503).
     - It matters only if L is reused on a plan with a part first year or bands.

7. **MINOR. The planted run's output is not kept.**
   - The only record that checks 3 and 4 caught `CT_PLANT=nextpath` on a smoke is the commit message of 2f827ee0.
   - The planted mode prints one line and writes nothing (audit l.227 to 231), and no results file holds that line.
   - By the code both checks fail under the plant, but CHECKLIST 5's showing is the run itself.
   - Keep its output, as the late tail kept its plant's (`results-late-tail-amend-smoke.txt`).
