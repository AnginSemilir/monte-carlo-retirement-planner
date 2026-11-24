# Review at the read, second look: the pricing fix (`PRICING-FIX.md`, candidate A; EXPLORATORY, seed 7002), the fix round c506119e

**Subject:** the fix round c506119e. It answers `reviews/2026-11-23-read-pricing-fix.md` (FAIL, one BLOCKING and three
MINOR), and changes:
- the rewritten write-up `reports/2026-11-23-pricing-fix-read.md` 4307d55bb9d9;
- DECISIONS-PENDING.md's top OPEN entry (40dad2aa3bda);
- STATE.md section 5's pricing sentence (494e32538b60);
- PRICING-FIX.md's new "After the read" note (e52427386111);
- the beside, `pricing-fix-beside.mjs` 68588e6a04b7, with `results-pricing-fix-beside.txt` 173b485b0df5 (section B
  reworked, section E new);
- the pattern search, `household-timing.mjs` d9b19922a0aa, with `results-household-timing.txt` 9f8c634388d3.

**What I read** (git blobs at c506119e, first 12):
- the changed files above;
- the read, unchanged since it was made: `results-pricing-fix.txt` 983a2b46560c, `reduce-pricing-fix.mjs` abf424667893
  and `audit-pricing-fix.mjs` f4345b612930;
- `results-couples-trade.txt` e57aca61fb63 (l.72-86) and the trade's unit records in `results/couples-trade-7002`;
- for the write-up's "One reading":
  - `reviews/2026-11-20-deep-household-hsp.md` d42b0c541a7f (l.33-40, l.91-125);
  - `LATE-TAIL.md` b0c41dd700b9 (l.55-80);
  - `results-late-tail-2.txt` f94956ec671a (l.4-9);
  - `reports/2026-11-20-late-tail-read.md` c0dfad39ec12;
- `src/solver/household.js` 9ff9c73bd968 (`DOUBLED`, l.47-50; the scaled limits, l.224-225);
- the built `research/engine.mjs` ca1de90535c9:
  - l.1291-1294: one person's tax on savings and dividends, with the savings and dividend allowances inside it;
  - l.2507-2523: the surplus sweep, split between the two people;
  - l.2526-2541: a couple's draws;
  - l.2673 and l.2691: the CGT exempt amount, owner by owner.

**What I ran** (after the read; nothing solved, nothing decided). The new scripts are `sectionE.mjs`, `pa2-kind.mjs` and
`doubled.mjs`, in `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/`
beside the first round's.
- **The read at c506119e.** `node research/solver/reduce-pricing-fix.mjs` reproduces `results-pricing-fix.txt` byte for
  byte, and the gate passes. The audit stamp is still d9a390cb3558.
- **Nothing the read stands on moved.** PRICING-FIX.md's "The read" section equals 33d50fb1's but for the blank line before
  the appended note. The reducer, the audit, the batch and `src/` are unchanged since 838f7dfb.
- **The beside.** `REG=1 node research/solver/pricing-fix-beside.mjs` reproduces the new beside file byte for byte.
- **The pattern search.** `node research/solver/household-timing.mjs` reproduces the new results byte for byte: 876
  household plans, none apart before the fix or after.
- **Section E, recomputed (`sectionE.mjs`).**
  - The trade's ROUTE and this read's are 0 paths apart, on every key, on all 13 units.
  - PA2 loses 98 and saves 25, pooled −0.140 (−0.199 to −0.082). FIX loses 96 and saves 21, pooled −0.144 (−0.202 to
    −0.087).
  - The two arms' losses are at most 2 apart on any unit. 82 paths are lost by both.
  - Each unit's PA2 count matches the trade's own D34 line (results-couples-trade.txt l.74-86).
- **My first review in c506119e** is the file I wrote, unaltered.

Verdict: PASS

## The first round's findings, as answered

1. **BLOCKING (answered).** The rewrite:
   - drops "The figures fit it" and "smaller end pots";
   - says what drives the loss is not shown, and that the draws' under-pricing cannot be the whole cause;
   - names Y100, E100, S119-E100 and S199-E100 with their survival and tax figures and 37 of the 121 lost paths (beside A
     and D; 9 + 6 + 10 + 12);
   - no longer recommends C, and says C would price E100 and the controls as A does.

   The recommendation is now the route kept. That is the rule's outcome in any case (PRICING-FIX.md l.140; D143 accepted
   S037's shortfall), and it follows from the measured cost: FIX less ROUTE pooled −0.173 (−0.231 to −0.115), all but 10
   of its 121 lost paths at the minimum pot in the last plan year, and survival first in the product's order.
2. **MINOR (answered).** C's exactness is said not to be shown (`mergedState`), in the report, DECISIONS-PENDING and
   PRICING-FIX.md.
3. **MINOR (answered).** The search covers the dress rehearsal's panel: 876 plans, none apart.
4. **MINOR (answered).** Section B now reads each lost path against its unit's own minimum pot and last plan year: 111,
   10 and 0, unit by unit as my first-round check found. Its header says what it computes.

## Findings

1. **MINOR. "A prices these units' year as the engine does" claims too much. It holds for their draws and fixed incomes,
   not for their savings.**
   - **Where.** Report l.76; DECISIONS-PENDING l.31; PRICING-FIX.md l.155-156 ("prices E100 and the three controls as the
     engine does").
   - **What A gets right.** On these units the household's allowance and bands are one person's (`k` 1, household.js
     l.224-225), so A prices the draws and the fixed incomes as the engine does. The conclusion built on it stands (finding
     1 above).
   - **What it does not.** Both arms' household plans carry two people's personal savings allowances, starting-rate band,
     dividend allowance and CGT exempt amount on all four units (`doubled.mjs`: 2,000 / 1,000, 10,000, 1,000 and 6,000,
     against one person's 1,000 / 500, 5,000, 500 and 3,000). The engine taxes each person's interest, dividends and gains
     against their own (engine.mjs l.1291-1294, l.2673, l.2691), and on these units the partner holds nothing.
   - **Where it matters.** The controls hold £45,000 to £120,000 in a taxable account (S199-E100 and S279-E100 also £47,500
     and £45,000 in cash). So on them the table's year is not the engine's on the savings side, in either arm.
   - **The named test.** "On the units where A's price is already right (E100 and the three controls)" (report
     l.101-103; DECISIONS-PENDING l.42-43) holds cleanly on S037-E100 alone (£18,000 taxable, £9,000 cash), not on the
     controls.
   - **The fix.** Say "the draws and the fixed incomes", and name the doubled savings limits where the test's units are
     named.

2. **MINOR. The "One reading" cites the deep review's leading cause but not the read of its own test, which bears on the
   reading and on the named test.**
   - **Where.** Report l.91-93; DECISIONS-PENDING l.34-36.
   - **What the test read** (`results-late-tail-2.txt` l.4-9; LATE-TAIL.md l.66, l.74-75), on step 8's worst tenths:
     - K2's spending level did not restore HSPA's end-pot shortfall: L −97.2% of D.
     - K2's tiers did: R 136.8%.
     - By its rule, the table "makes the trade itself, on a right reading of the household" (CEIL −21.1%).
   - **Why it matters.** The write-up's reading is a spending margin, and in the precedent it was the spending level that
     did not explain the late tail. The table's reading was found right there.
   - **The named test's follow-on.** If the test finds the table's judgement of the minimum pot right, as there, the
     end-of-plan losses are the table's own trade. B or C, which reprice the year, would not remove them. "B or C would
     follow on what it finds" (report l.103; DECISIONS-PENDING l.43-44) covers only the other outcome.
   - **The fix.** Cite the late tail's read beside the deep review, and say what follows either way.

3. **MINOR. PA2's losses "at the plan's end" are not printed, and PA2 is not only a removal of the over-pricing.**
   - **Where.** The report (l.88, l.99) and DECISIONS-PENDING (l.34, l.40-41) say both ways come with "these end-of-plan
     losses" and cost survival "at the plan's end". Section E prints PA2's paths lost and saved and its pooled change, not
     where its lost paths fail.
   - **My check** (`pa2-kind.mjs`, against each unit's own context as section B reads FIX's), of PA2's 98 lost paths:
     - 96 end below the minimum pot in the last plan year;
     - one, S279-E100's, has spending unmet in its last plan year (51);
     - one, S037-G12P's, has spending unmet in plan year 11 of 27.

     So the words hold on 97 of 98. Print it in section E (CHECKLIST 6).
   - **What PA2 is.** "Removed ROUTE's over-pricing another way" (report l.85) is half of it. At the allowance two people's,
     a couple where one person draws has those draws priced against two allowances. On S037-E100 that leaves £25,140 less
     the £15,000 of state pensions, £10,140, against the engine's £4,370. So PA2 under-prices those draws too.
   - **What that adds.** PA2 lost about as many paths as FIX there (7 and 6, FIX's all among PA2's). That tells, if
     anything, against the draws' under-pricing as the driver; the write-up could say so beside "Which part of either
     drives them is not shown".

## Checked and found to hold

- **Every figure, count and "all"/"none" the fix round added** is in the results files or follows from them:
  - section E's totals, pooled changes and "within two of each other";
  - B's 111, 10 and 0, with S191-90's plan years 38, 39 and 40;
  - the four named units' survival and tax, and 37 of 121;
  - 876 plans.
- **No cause is claimed beyond the figures**, apart from findings 2 and 3's citation and printing points:
  - "That cannot be the whole cause" rests on A's price of the draws on the named units and their measured losses.
  - "Removing the over-pricing ... costs survival" is the paired arms' measured difference, the arms differing only in
    the form.
  - "Which part of either drives them is not shown" is said.
- **STATE.md's sentence** carries the figures and the recommendation and no explanation beyond "the draws' pricing not the
  whole cause".
