# Review at the read, second look: the couples trade (`COUPLES-TRADE.md`, EXPLORATORY, seed 7002)

**Subject:** the write-up `reports/2026-11-23-couples-trade-read.md` after its one fix round (df6cf013, D81 (F)). The
round answers the first look's FAIL (`reviews/2026-11-23-read-couples-trade.md`: one BLOCKING, six MINOR). The read itself
has not changed.

**What I read** (git blobs, first 12):
- the write-up as it now stands, 86337ab170c9;
- `couples-trade-beside.mjs` a13075c68cd4 and its output, `results-couples-trade-beside.txt` 69ca75a48b7c;
- `results-couples-trade-planted.txt` 0c112cbb5cfa;
- `results-couples-trade.txt` e57aca61fb63, the first look's blob, unchanged;
- `src/solver/household.js` 06b69ec74e77 (`SCALED`, l.89 to 90; `householdPlanFor`, l.122 to 213, with its scaled
  allowance at l.189 to 192);
- the first look, 122734d70151, committed in df6cf013 as written.

**What I ran** (none of it decides anything; no solve):
- **The read again, at HEAD.** It is byte for byte the results file, and its gate still takes the files (audit
  4f8d4cd86ede).
- **`REG=1 node research/solver/couples-trade-beside.mjs`** (APP re-runs only, 47 s). It is byte for byte
  `results-couples-trade-beside.txt`.
- **a6, over the stored arrays.** It takes the paths on S279-E100 that ROUTE keeps and both APP and L lose: all 132 of
  them, and the 121 of those on which APP ran out before the final year. The script is in
  `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/ct/`.

Verdict: PASS

## What holds

1. **BLOCKING 1 is answered.**
   - **The rule's words.** l.44 to 45 say what the rule decided: either L's wiring or the controls' gains is in question,
     THE TRADE is not read, and "The rule does not say which of the two it is."
   - **L as built.** l.29 to 30 describe L as the rule built it: each year's demand is the app's rules' demand on the same
     path, "as the app's rules' own run of that path had it".
   - **The mechanism, post hoc.** l.47 to 59 give it, from the beside file's section A, under "Post hoc, deciding nothing".
     The block ends "These figures do not decide it, and the rule's outcome stands". l.147 to 148 say the same.
   - **The withdrawn claims are gone.** "The controls' premise", "owes about a third to spending" and "the app's rules'
     spending put back" no longer appear (grep).
   - **No claim of THE TRADE.** The S037 lines (l.80 to 87) stay as beside figures, with "The read does not show why".
     The post hoc line there (l.84 to 85) adds that the mechanism does not explain S037: with APP's early ruins set aside,
     L's share stays below nought on the same eight units (beside l.8 to 16).
2. **The figures stand.** Each is the read's, the beside file's or the planted file's, or arithmetic marked as such:
   - the checks' scope (l.15 and 18, as every log has it);
   - the plant (l.22; planted l.5);
   - the controls (l.40 to 42; results l.4 to 6);
   - S279's deciding paths, APP's levels, the four means and the set-aside shares (l.50 to 57; beside l.5 to 7);
   - the pricing (l.62 to 70; results l.9 to 13);
   - S037's shares (l.80 to 83; results l.3, 7 and 18 to 27);
   - "from 72 to 105 a unit" (l.85; beside l.8 to 16, the nine units' early ruins);
   - D34 (l.91 to 92; results l.74 to 86);
   - PA2's sign and counts (l.93 to 95; beside l.33 to 34);
   - spending (l.97 to 100; results l.32 to 36);
   - the tax (l.101 to 102; beside l.35 to 38, as results l.47 to 50);
   - the worst fifth (l.110 to 111; results l.60 to 68);
   - S119's tax (l.114; results l.56);
   - £314 (l.121, marked arithmetic).

   **The code claim holds too.** At l.103 to 104, PA2 doubles the allowance and every threshold above it moves up with
   it. In `householdPlanFor`, each `SCALED` limit (the taper threshold and every band limit) is `paH + k x (L - PA)`,
   where `paH` is two allowances at 'pensions' and `k` allowances at 'pensionsPA'.
3. **The difference in the figures that the coordinator raised.** Both sets are right; they are over different paths (a6):
   - **Mine were over all 132.** APP delivered £1,425,932 and left £341,900 unmet; ROUTE delivered £1,619,497; L delivered
     £1,703,301.
   - **The beside file's are over the 121.** APP delivered £1,397,301 and left £372,645 unmet; ROUTE delivered £1,611,784;
     L delivered £1,699,548.
   - The write-up names the 121 and uses their figures (l.50 to 55), as the beside file prints them.
   - My first look called mine the deciding paths, which are the 132. My report's "Per path there", after the 121, was
     ambiguous.
4. **MINORs 2 to 7 are answered.**
   - **MINOR 2:** l.103 to 104 and 120 to 123 ("That £314 is PA2's size, not the fix's"; PA2's higher tax).
   - **MINOR 3:** l.93 to 95, the sign and the counts beside D34. Finding 2 below covers its opening words.
   - **MINOR 4:** l.132 to 133. The fix becomes a default only after its read, and opening Y and E need not wait.
   - **MINOR 5:** l.130 to 131, S191-90 in the fix's read.
   - **MINOR 6:** l.15, 18 and 19 to 20, attributed to the first look.
   - **MINOR 7:** the planted file.
     - It gives the plant's line as the audit prints it: check 3 on 40 L-own of 40 paths, and check 4 on 40 of 40.
     - It gives the exit code, 0, which the audit returns only when both checks catch the plant (audit l.230).
     - It also keeps the reducer's six cases.
     - It leaves out the audit's first line, its stamp. But the audit has not changed since 2f827ee0 (8f7086d175d5), so the
       record is the launched audit's.
5. **The beside script computes what it prints.**
   - It re-runs APP alone and holds each path to the stored APP on five keys: survival, fail year, tax, delivered and
     unmet. That holds on 4,000 of 4,000 paths on all 13 units.
   - It uses the first look's definition of an early ruin (a fail year below T).
   - It is EXPLORATORY, written after the read, and it solves nothing.

## Findings

1. **MINOR. The beside file's S037 lines undercount "ROUTE keeps and L loses".**
   - **What section A's set is.** It is the paths ROUTE keeps and both APP and L lose (`couples-trade-beside.mjs` l.38).
     The script's header says so ("APP losing them too", l.6), but the printed line says only "ROUTE keeps and L loses"
     (l.42).
   - **On the controls the two coincide.** L loses no path that APP keeps there, so S279's 132 is the read's D34 count
     (results l.86), and the write-up's use of it (l.50) stands.
   - **On S037 they do not.** Y75 prints 492 against the read's 859 (results l.74). The 367 paths APP keeps are left out,
     and every S037 unit differs in the same way (beside l.8 to 17 against results l.74 to 83).
   - **The fix.** The printed line should say that APP loses those paths too.
2. **MINOR. "The sign is one way" (l.93) overstates the beside file.**
   - PA2 is level with ROUTE on G12P and above it on S279: net 0 and +5 (beside l.29 and 32).
   - The clause after it gives 11 of the 13. The opening words should say the same.
