VERDICT: PASS

# Review at the read, second look: every couple on the solver, the dress rehearsal (`COUPLES-ANY.md` amendment 2; EXPLORATORY, seed 7002)

**Subject:** the fix round on the first look's four findings (`reviews/2026-11-24-read-couples-any-rehearsal.md`: one
BLOCKING, three MINOR), uncommitted in `/home/user/couples-a`.

**What I read** (git blobs, first 12):
- the write-up 28b3fca51659 (was 6b8957dc46cf);
- `couples-any-beside.mjs` f40ec7f6b700 (was e961fee9420d) and its output `results-couples-any-beside.txt` 19883578d5c6;
- the read's own files, unchanged since the first look: `results-couples-any.txt` be232e8c528b,
  `results-couples-any-port-identity.txt` 6d4cf7c530a6 and `reduce-couples-any.mjs` 4a83278d5873.

**What I ran:**
- **Reproduction.** The beside reproduces its file byte for byte, and so does the reducer.
- **The beside's `--planted`.** ALL PASS (5).
- **A doctored copy of the results file**, with one W line FLAGGED, one R line and one N line without a cap, run through the
  beside: the flag is counted, and the R line is still read and left out of the capped ranges.
- **D34's own rates** (`reduce-couples.mjs` `harmOf`) on the 136 read units.

## The first look's findings

- **1 (BLOCKING, the tax): answered.** The write-up now gives lifetime tax, ROUTE less APP, in pounds a path by couple
  (l.79 to 87), each range the beside's (l.12 to 16):
  - S025 `-£265` to `+£1,160`;
  - S227 lower on every unit, by `£248,611` to `£336,258`;
  - S273 `-£232,464` to `+£114,002`;
  - S351F `+£15,482` to `+£223,218`, and "small bases" is kept to its percentages;
  - S357F `+£214,460` to `+£1,461,638`, named the largest in pounds.

  N's four pairs are given in pounds (l.94 to 100), each the beside's l.18 to 25 and the results file's l.171 to 178, with
  S357F's beside C's question and the cause said not to be shown.
- **2 (MINOR, D34's statistic): answered.** l.48 to 51 state lost less saved against the threshold, `-599` (S025-L-Y75) to
  `-152`, against thresholds of 33 to 52. The nearest is S273-Ri3t-own, margin 185; W's 355, L's 347, P's 339. These are
  the beside's l.3, 5, 7 and 9, and my own count. Gross losses stay as a beside.
- **3 (MINOR, the pot in pounds): answered.** l.70 to 77 give each couple's capped pot in pounds a path, with its percent.
  Each pair's two ends are the same unit's.
- **4 (MINOR, the regex): answered** for parsing. `unitOf` reads each part on its own: the cap optional, the threshold
  with an optional FLAGGED. All 144 lines parse, and the class counts printed (24, 96, 8, 8, 8) are the reducer's.

## New findings

1. **MINOR: the reason given for "no harm" (write-up l.52).** The write-up says "At 4,000 paths D34's thresholds are
   small, so this read's 'no harm' rests on the size of the gains". The conclusion holds; the reason inverts the fact.
   - At 4,000 paths the thresholds sit at `0.825` to `1.300` points (33 to 52 paths). That is about the one-point loss D34
     is meant to catch.
   - So, by D34's own rates, a true one-point loss would be flagged only `0.311` (S025-Rp3t-own) to `0.677`
     (S273-Ri3t-own) of the time, median `0.414`.
   - A quarter-point loss would be flagged `0.044` to `0.050` of the time.

   *Fix:* state those figures in place of "small". They also bear on the registered test's paths. Discordance here runs
   from `4.30%` to `14.97%`.
2. **MINOR, latent: the N unit lines' printing (`couples-any-beside.mjs` l.78).** An N unit with no cap prints
   `the capped pot null% (+£0 a path)`, a figure for an absent cap. `--planted` tests the parse only.
   - This happens nowhere here: every unit has a cap.
   - *Fix:* print "no cap" where `capped` is null.

Nothing else the fix touched moved. The read's figures, its gate, its identity and its outcome stand as the first look found
them.
