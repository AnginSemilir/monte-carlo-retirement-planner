# 12 Nov: switching on the two stage B options (D81 (D)): each one's read and every pinned figure it would move

A report under D81 (D) and (G). Both options are built, off in code and not in the candidate (D85, D86; `results-stage-b.txt`).
Switching either on is the maintainer's. Nothing here is switched on. The reads are `results-tie-a.txt` (EXPLORATORY,
seed 7002, 16,000 paths a household on twelve singles at 45 points); the pinned figures are
`results-stage-b-figures.txt`, measured on a scratch worktree by `stage-b-figures.sh` (EXPLORATORY; each test file in its
default form, the fast tier's 64 and 42 others that reach the candidate).

## 1. `tieAboveCap: 1e-4` (item 13: above the estate cap, among moves at the best move's level and tier pair within the margin, the least tax this year)

**The read (against the whole menu, the twelve; all seven parts of `TIE-A.md`'s rule hold):**

```
1. pooled survival +0.000 (95% +0.000 to +0.000, se 0.0000)                 no path's survival changes
3. pooled spending delivered -0.0000 points of target
4. the capped pot -0.004% pooled; a household lower by more than 0.5%: none
5. a household's mean pot left lower by more than 0.1%: none (pooled +8.294%)
6. pooled lifetime tax £238,376 to £185,729 (-22.09%)
7. the replay: 52900 decisions (6753 above the cap), a different move at 4022; at another level 0, at another tier pair 0, at or below the cap 0
```

**What moves with it on (the candidate af001697ce1b to 17ff82379838):**

- Pinned forward-run digests: 9 pins in 4 full-tier test files (`couple-tables` check 6, S224's runs and reads;
  `lock-tiers` check 1b, four; `save-split` check 1b, S188 and S244; `windfall-split` check 1b, S090). Old and new, each,
  in `results-stage-b-figures.txt`. No table digest moves.
- The candidate's own pins: `candidate.test.mjs` (the decided-defaults block gains the key; the hash and the key count),
  STATE.md's printed block, and the e3pcls pin, taken again.
- Tests that need a change, not a re-pin (4 checks in 3 files): `chooser-tie` check 1 and `chooser-shortlist` checks 1 and
  3 take "the option unset" as the app's solve with nothing passed, which would now carry the margin; `couple-tables`
  check 4, because a couple's ranking does not take the tie-break and a single's chooser does (a couple's path itself is
  the same with it as without).
- `candidate.mjs` must name the new key so the four earlier candidates' recorded hashes stand.
- No protected test needs an edit. A solve stored before the switch-on is not restored (the stored solves' key moves).
- The browser harnesses were not run. None pins a forward-run figure; the fixtures chosen because they "read so at these
  settings" may move.

## 2. `chooserShortlist: 'order'` with the slice (item 7; read with the tie-break on, so the configuration is both keys)

**The read (against the whole menu with the tie-break; all five parts of section 3's rule hold):**

```
1. pooled survival -0.019 (95% -0.034 to -0.005, se 0.0073); its lower end above -0.1: HOLDS
2. no household wholly below -0.3: none
3. pooled spending delivered -0.0018 points of target
4. pooled mean pot left +0.161%, the capped pot +0.008%
5. the replay: 52900 decisions, a different move at 1754, at another tier pair 3 (0.006%), at another level 13
beside the rule: pooled lifetime tax +0.84%; a path 95.6 ms to 50.7 ms pooled (1.89 times)
S030   d -0.050 (-0.099 to -0.003; 2 saved, 10 lost)
S370   d -0.175 (-0.310 to -0.040; 46 saved, 74 lost)
```

It passes its rule, and it loses a little survival beyond noise: pooled, and on S030 and S370. What it buys is a path
about 1.9 times as fast.

**What moves with both on (the candidate to 3892a04d98ad):**

- Pinned forward-run digests: 12 pins in the same 4 files (the tie-break's nine, with other values, and S026 and S040).
  No table digest moves.
- The same candidate pins as section 1.
- Tests that need a change: 14 checks in 7 files. Beyond section 1's four: `chooser-share` (4 checks), `chooser-once` (2),
  `couple-rank` (2), `couple-flat` (2). `chooser-share.test.mjs` is in FAST, so its edit needs an unlock.

**Three things the sweep found about the shortlist as built, each from the code, none fixed:**

1. **It reaches a couple's path.** With `COUPLE.fast` on, each person is ranked from the scores their own chooser leaves,
   and the chooser would score the shortlist alone: on S007, 1145 of 3360 rankings and 60 of 60 paths differ. Items 2 and
   11 are exact only on the whole menu. No run has read a couple's outcomes this way; it is item 12's arm (a) (D84), which
   runs after the registered couples' run. The tie-break alone leaves a couple's path as it is.
2. **The decisions the pages show would come from the shortlist.** `solve.js` says of it "for the paths that only count,
   never for a decision the pages show", and nothing in `src` keeps that: this year's actions and their skip costs, the
   next ten years, the ledger and the rule of thumb all take their moves from the same chooser.
3. **It needs the sharing of a year's flows.** With `CHOOSER.share` off the paths are the whole menu's, so the identity
   `chooser-share` tests between the two routes no longer holds.

## 3. Timing, for either

- **Not before the couples' re-run has read** (D78: "before the landing if I have ruled by then, otherwise after the
  re-run's read, never between"; D80). Its CANDC arm is the app's candidate, registered as af001697ce1b, and the audit
  refuses a table carrying either option.
- **Not to `main` before the beta's two weeks end:** each changes a figure a page shows (the tie-break the pot and the
  tax; the shortlist those and a little survival).

## 4. The agent's recommendation

- **`tieAboveCap`: switch on, after the re-run's read.** Survival and spending are unchanged on every path read, tax
  falls and the pot rises, and what it costs is re-pinning.
- **`chooserShortlist: 'order'`: not as built.** It should first keep the whole menu for the decisions the pages show
  (as its own note says) and its effect on a couple's path should be read (item 12's stage A does that). Then it is a
  choice between about half a path's time and about `0.02` points of survival pooled, up to `0.18` on one household.

## 5. Not measured

- `library-sweep`, `pr31-split`, `fast-skip`, every `--full` form, the couples' scripts' planted suites and the browser
  harnesses were not run; `pay-where` was stopped at forty minutes with its first ten checks passing.
- The failing tests were not run again on the unedited tree: each old figure is the pin as the test file holds it.
- New digests are given to 16 hex digits where the test prints 16.
