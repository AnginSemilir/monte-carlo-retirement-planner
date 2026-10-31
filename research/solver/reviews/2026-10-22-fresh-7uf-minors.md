# Confirmation: the four MINORs of the 22 Oct re-review of fresh-7uf, fixed in ac5723d

Subject: commit ac5723d only (the diff), against research/solver/reviews/2026-10-22-fresh-7uf.md's findings 1 to 4.
Nothing has run on seed 7014: research/solver/results/diag7uf does not exist.

## What I read (HEAD ac5723d; the working tree clean)

`git show ac5723d`: batch-7uf.sh (blob b6df4a956ab8), reduce-7uf.mjs (17a562b41323), reread-7u-item4.mjs (7444fa9f164a),
registrations/fresh-7uf.md (1a5abf4e4bf4), results-reread-7u-item4.txt (281d3b40bd51), state.mjs (db6d3cdb995c),
STATE.md (634da1f5ae5c). The review file it commits is byte for byte the one I wrote.

What I ran (no seed 7014 anywhere):
- `node research/solver/reread-7u-item4.mjs`: reproduces results-reread-7u-item4.txt byte for byte. `check-state.mjs`:
  passes, so STATE.md's printed block (l.186 to 194) is what state.mjs prints from that file.
- `reduce-7uf.mjs --planted`: 22 cases as written, the provenance case now `0 1 1 1 1 1` (another code, another audit
  each refused). `reduce-7uf.test.mjs`: ALL PASS, 11. `hygiene.test.mjs`: ALL PASS, 10.
- `reduce-7uf.mjs --preflight research/solver/results/preflight-7uf`: identical to results-preflight-7uf.txt.
- A copy of the preflight in the scratchpad, with runPolicy's survival flipped on path 0 of S224 CAND: the read prints
  `the engine alone 1, runPolicy alone 0 ... (apart on some paths, below the gap's test)` and `the paths apart (index
  from 0): the engine alone 0; runPolicy alone -`.
- batch-7uf.sh copied unchanged into a scratch tree with a stub audit-7uf.mjs (5 units; units 1 and 3 exit 3 before their
  done line):
  - RESUME unset and diag7uf absent: exit 0; all 5 units run with `16000 part k/5 7014`; `unit 1 exited 3`, `unit 3
    exited 3`. No `set -u` error.
  - The same command again: `batch-7uf: ... is not empty; a launch needs an empty folder`, exit 2.
  - RESUME=0: the same refusal.
  - RESUME=1: exit 0, and only units 1 and 3 run.
- `bash -n research/solver/batch-7uf.sh`: clean.
- `check-prediction.mjs --seeds <reg> --text "bash research/solver/batch-7uf.sh" research/solver/batch-7uf.sh`: `seeds: 7014
  (held out: 7u-F)`. `check-prediction.mjs <reg>`: NOT COMPLETE, only for the Design review line.

Verdict: PASS

## The four MINORs

1. P2's power: fixed.
   - reread-7u-item4.mjs l.86: pHarm takes `d = Math.max(d0, L)`.
   - l.88 prints each household's in-band chance, by SHIP's sampling on 16,000 paths.
   - The four households without a record are named, at 5%, 10% and 15% discordance (results l.33 and its W0.01 twin:
     90% at 1.23, 1.32, 1.39).
   - l.113 adds the floor cases. The results file prints 0.795 against 0.805 and 0.902 against 0.887.
   - The in-band range is now 1.07 to 1.20 (80%) and 1.11 to 1.30 (90%), as I computed (1.068, 1.106).
   - S366 is in the band with chance 0.67 at W0.02 and 0.85 at W0.01.
   - The registration's Paths field (l.27 to 42) and STATE.md l.188 quote these figures, and the file prints each one.
2. P1's power: fixed.
   - reread l.99: seLo = (14/18)^2 times the recorded households' variance; seHi adds four independent copies of
     S370's per-path variance, all over 18^2. Both are what the read's average over 18 implies under those two cases.
   - It prints 0.0184 to 0.0317 (W0.01 0.0185 to 0.0317), HELD 1.000 to 0.883, 80% at -0.048 to -0.011. My independent
     estimate was 0.0318, 0.883, -0.011.
   - The cross-correlations of the 14 recorded floor households are printed: -0.06 to 0.05 at W0.02, -0.03 to 0.10 at
     W0.01. The registration quotes the union.
   - The registration (l.30 to 34) and STATE.md l.186 to 187 quote it.
3. The resume: fixed.
   - batch-7uf.sh refuses a non-empty diag7uf unless RESUME=1, and then runs only the units whose log lacks `^ +done `.
   - audit-7uf.mjs prints its done line (l.126) after it writes the unit's file (l.121), so a unit killed before or
     during the write runs again.
   - reduce-7uf.mjs l.84 to 90 and l.165 to 172 require every unit file's code and audit stamps to equal the logs' one
     version, and refuse when no log carries a stamp. Planted at l.253 to 254.
   - On a clean run each unit file and its log carry the same STAMP, written by one process, so this refuses nothing
     fair. Nothing in the launcher's smoke run or in any script but the audit writes into results/diag7uf.
     `audit-7uf.mjs --units` exits before its mkdir.
   - The registration's Budget field (l.73 to 78) says so.
4. The paths apart: fixed. reduce-7uf.mjs l.202 to 203 list, by index, every path where the engine and runPolicy differ,
   for SHIP, CAND and DECOMP where read. The registration's Decision rule field (l.55 to 56) says so.

Nothing in the diff changes what the read decides. gate, decompGate, pooledByPath, perHousehold and decide are
untouched. The only change on the decision path is the provenance check, which adds refusals that a clean run cannot
trigger. The fidelity output gains one line, printed only when a path is apart.

## Findings

1. MINOR, optional, no change needed before launch. The in-band chances (S366 0.67 and 0.85; reread l.88) take 7u's SHIP
   survival, measured on 8,000 paths on the code before Step 1, as the true value on 7014. Counting 7u's own sampling
   error alone, they are about 0.62 and 0.72. The Paths field's opening ("from 7u's own per-path records on the code
   before Step 1") states the basis, and no decision rests on the figure.

Before launch, as before: the Design review line must name `research/solver/reviews/2026-10-22-fresh-7uf.md` with no
angle brackets.
