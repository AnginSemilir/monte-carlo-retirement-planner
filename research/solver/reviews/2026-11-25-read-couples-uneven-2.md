Verdict: PASS

# Review at the read, second look: the household route at uneven holdings (`COUPLES-UNEVEN.md`, EXPLORATORY, seed 7002)

**Subject.** The fix round to the write-up `reports/2026-11-25-couples-uneven-read.md`, in the working tree after c24c8ba4
and not yet committed. It answers my first look (`reviews/2026-11-25-read-couples-uneven.md`: FAIL, one BLOCKING and one
MINOR). The round also adds a post hoc script and its output, a new entry at the top of `DECISIONS-PENDING.md`'s "The order
from 12 Nov", and new words in STATE.md (section 5's first bullet, and the end of D148's line). The read itself has not
changed: `results-couples-uneven.txt` has the same blob (d42a26c1f4de) as at c24c8ba4, and `git diff c24c8ba4` on it is
empty. The other edits in the working tree (under `src/`, two tests and three harnesses) are D148's fix round and are not
reviewed here.

**What I read** (blobs of the working-tree files, first 12):
- the write-up 33913c66cef4;
- `couples-uneven-beside.mjs` 5b81c1f43657 and its output, `results-couples-uneven-beside.txt` 9ff61a0fa7cd;
- `DECISIONS-PENDING.md` a6bf09e008ec (the new OPEN entry and the DECIDED line for D148, l.14 to 53);
- STATE.md 23b6cbbcc956 (D148's line, l.19; section 5, l.296; section 6, l.298 and 299);
- my first look 7f2faac0d203, untracked, the file I wrote;
- unchanged since the first look:
  - the read `results-couples-uneven.txt` d42a26c1f4de and the rule `COUPLES-UNEVEN.md` 5799b2c5d20b;
  - `reduce-couples-uneven.mjs` 95b6b4d03876 (`loadDir`, `yearsOf`), `audit-couples-uneven.mjs` 551c116927e6 and
    `audit-phase4.mjs` 5ace83959b96 (`runPath`, its failure rules, l.89 to 104);
  - `reduce-couples-open.mjs` 6a4a5735fe55 (`m1ByUnit`, l.119 to 124), `reduce-household-hsp.mjs` 153cbfeebc48
    (`keptSpend`) and `reduce-phase4.mjs` ac319aad1f44 (`survivalItem`);
- `results-couples-any-registered.txt` 041784d3ccc8 (R's pooled survival, l.35);
- `reviews/2026-11-25-default-couples-any.md` 19f405148a8d (its MINOR 3, l.180 to 210, which the new entry quotes);
- `LATE-TAIL.md` b0c41dd700b9 (l.9 to 13).

**What I ran.** None of it solves, runs a path or runs a batch. My scripts are in
`/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/cu2/`.
- **The beside script.** `REG=1 nice -n 19 node research/solver/couples-uneven-beside.mjs` on the main tree. It runs in
  1.6 s, exits 0 and prints `results-couples-uneven-beside.txt` byte for byte. The script's file is 22 s newer than its
  output, but the script as it stands prints that output, so the later edit changed nothing printed.
- **My first look's r4, r6 and r9,** run again from the read's worktree at 03d91f0a. Each figure they print that the beside
  file carries is the same. That covers section A (M1 by arm, and each arm on the two units against APP), section B (each
  arm less ROUTE at each holding) and section C (where the lost paths fail).
- **The arrays.** The 28 unit files in `results/couples-uneven-7002` were last written at 09:48:04, at the run's end. The
  read and both post hoc scripts read those files.
- **`s1.mjs`, this look's.** It takes PA2's and FIX's lost paths that fail in the plan's last year, split by the spending
  left unmet on them. It also counts each household arm against ROUTE on the two named units.
- **`check-state.mjs`** on the working tree: it passes, at 300 lines.

## Each finding of the first look

1. **BLOCKING, answered.** The write-up now gives M1's two names, the clause that sends them on, and what the read says of
   them.
   - **The clause.** l.60 to 62 quote the rule's "In every outcome" clause whole, word for word against `COUPLES-UNEVEN.md`
     l.77 to 79.
   - **D148 came first.** l.67 to 69 say that D148 took the two names before the read. They add that the change of default
     was built and committed (84f0aac7) while the test was running. Git agrees: 84f0aac7 comes before the read's commit
     c24c8ba4.
   - **The two kinds' rises are the file's.** The write-up (l.70 to 71) gives ROUTE `+£525` and PA2 `-£11` on Rp1t, and
     ROUTE `+£539` and PA2 `-£20` on Ri1s. These are the read's l.20 and l.13.
   - **ROUTE's part of each name.** l.72 to 73 say it is D143's gap, which D145 (2) left in the route. The deep review's
     other part, arm A's pick moving to ISA First (l.73 to 74), matches the read's l.13 and l.20.
   - **No M1 by arm in the read.** l.75 says so. Every M1-by-arm figure the write-up quotes (l.76 to 80) is printed in the
     beside file (l.4 to 7, 10, 14, 19 and 22). The script applies `m1ByUnit` as the registered read does: a unit is named
     on net paths and the kept-spending interval's upper end, and the `caps: []` it passes reaches only the pot cap, which
     the script does not print.
   - **What goes before `main`.** The changes are:
     - "This read was its last condition before `main`" is gone.
     - "What follows" (l.147 to 150) says that the maintainer's word, with this read beside it, comes before `main`.
     - STATE.md section 5 (l.296) says the eighteenth batch goes to `main` only after that word.
     - D148's line ends with the read going to the maintainer "beside this line before `main`".
     - `DECISIONS-PENDING.md` now carries the read, D148 and M1's names as an OPEN entry for the maintainer's word.
2. **MINOR, answered.** l.129 to 130 now say plainly that the test can show neither D134's stop nor its absence. The two
   sentences that compared tables and policies are gone. The lost paths' years come back as a post hoc lead, marked so (l.131
   to 136), and are right:
   - 931 of PA2's 932 lost paths fail in plan year 27, the last (`runPath` runs years 0 to T, `audit-phase4.mjs` l.93, and T
     is 27 for S041).
   - The 932nd fails in year 25 with spending unmet. So the 910 with none unmet are all among the 931, as "910 of them"
     says.
   - The 910 fail only by `runPath`'s end check, the pot below the minimum pot (`audit-phase4.mjs` l.98 and l.102).
   - FIX's are 1,495 of 1,509 in the last year, with 1,445 with nothing unmet. The 14 that fail earlier all have spending
     unmet.

The write-up's "The reviewer at the read" (l.26 to 28) reports my first look as it reads. Every figure it now quotes is the
read's own or is printed in the beside file and marked post hoc (l.29 to 32). The rest of the write-up and its figures have
not moved.

## Findings

1. **MINOR. "The price is survival" (write-up l.79 to 80; `DECISIONS-PENDING.md` l.28 to 29) does not say where that price
   falls. On the two units M1 names, pricing the gap out costs no survival.**
   - **What the documents say.** The bullet comes straight after PA2's spending gain on the two named units (l.77 to 78). It
     gives PA2 less ROUTE as `-0.537` points at 60/40 and `-0.507` at 25/75. Those are means over each holding's 14 units
     (beside l.18, l.19 and l.22).
   - **What the arrays show on the two named units.** PA2 keeps more paths than ROUTE.
     - S041-Rp1t-Y75: PA2 loses 3 and saves 8 (the read's l.43).
     - S041-Ri1s-Y75: PA2 loses 3 and saves 17 (the read's l.53).
     - Against APP, PA2 keeps 524 and 486 net, where ROUTE keeps 519 and 472 (beside l.9, 10, 13 and 14).
   - **Where the half point is lost.** It comes from the units two or three profiles apart, where the read's ten flags fall
     (l.44, 48 to 51, 57, 59 and 61 to 63).
   - **Why it matters.** These counts are the evidence for the D-line's "not a survival trade". The trade the maintainer is
     asked to weigh beside D148 is between couples, not within the named two: the named couples spend less, and couples
     whose risks differ widely keep more paths. My first look said "The price is survival elsewhere"; the round dropped the
     last word.
   - **Fix.** Say so in the write-up and the entry. If the split by distance apart is given as a figure, print it by a
     script first (CHECKLIST 6).
2. **MINOR. The new `DECISIONS-PENDING.md` entry misquotes one figure (l.30 to 31).**
   - **What it says.** "Nearly all of those lost paths end in the plan's last year with every year's spending met but the
     pot below the minimum pot: 931 of PA2's 932."
   - **What the beside file says.** 931 is the count failing in the last year. The count with no spending unmet is 910
     (beside l.27).
   - **The other 21.** `s1.mjs` finds they fail in the last year with spending unmet: a median of £9,739 and up to £17,599.
   - **Where it is right.** The write-up (l.132 to 133) has both counts right, and STATE.md l.296 gives 931 as the count
     failing in the last year.
   - **A smaller point.** l.17 calls the change of default "built and gated". B1's gate has not run (STATE.md l.296: "then
     each reviewer again and B1's gate"), and the entry's own (a) says "once ... B1's gate is green".
   - **Fix.** Give 910 with "every year's spending met", or 931 with "in the plan's last year". Say the gate is still to run.
3. **MINOR. STATE.md's next actions do not carry the hold before `main` that section 5 and D148's line now carry.**
   - **What section 6 says.** Action 2 (l.299) still ends "the maintainer's go (D148), the change of default built and
     committed (84f0aac7), the reviewer on it next, then B1's gate". Action 1 (l.298) says "`main` takes each batch as it
     passes B1's gate (D92)".
   - **Why it matters.** A session working from the next actions alone could merge batch 18 on B1's gate before the
     maintainer's word that the rule and this round put first.
   - **Fix.** Add that word, with this read beside D148, to the end of action 2.
