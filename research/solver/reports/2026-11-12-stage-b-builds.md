# 12 Nov: items 13 and 7, stage B built, off in code

A report under D81 (G). By D85 and D86 (the read of `results-tie-a.txt` by `TIE-A.md`'s rule): `tieAboveCap` at the margin
the rule took (1e-4), and `chooserShortlist: 'order'` with the slice. Neither is in the candidate; switching either on is
the maintainer's. The commands and their output:

```
ITEMS 13 AND 7, STAGE B (D85, D86; D81 (B) and (C)): the two options as built, off in code and not in the candidate; 12 Nov

== node research/tests/chooser-tie.test.mjs      (tieAboveCap, the tie-break above the estate cap, at the margin the rule took: 1e-4)
chooser-tie: the chooser's tie-break above the estate cap (tieAboveCap 0.0001), seed 99004
  ok   1. the option unset: S328F's paths the code before the option's, bit for bit; the solve carries the cap and no margin   outcomes 03f2dad1043f20fd against 03f2dad1043f20fd; the cap £1800000, four times the opening £450000
  ok   2. the option set: every table the same; the record names the margin; a margin out of range refused; under the shape 'soft' no cap, and the paths the same with it as without   tables 74d98db1ba3acb69 against 74d98db1ba3acb69; refused: tieAboveCap 0.5: a margin in score units, from 0 to 0.01 (1e; under 'soft' the cap null, 0 of 60 paths differ
  ok   3. the paths that never reach the cap (S328F's, wealth at or below it at every decision): each the same with the option as without, bit for bit   94 of 200 paths never reach the cap (£1800000); 0 of them differ with the option; of the other 106, 93 differ
  ok   4. S328F, the option's choice at each decision of its own path: wherever it differs, at the best move's level and tier pair, with no more tax that year, and above the cap   6000 decisions (1634 above the cap), a different move at 1238: at another level 0, at another tier pair 0, at or below the cap 0, with more tax that year 0; over 200 paths the mean pot 10.5%, lifetime tax 16.6%, 0 paths' survival changed
  ok   5. a couple (S007): every path of the rollout the same with the option on each person's table as without   0 of 40 paths differ; each person's table carries the margin

chooser-tie: 5 passed, 0 failed

== node research/tests/chooser-tie.test.mjs --plants
  plant anylevel  fails 4 (expected 4): exact
  plant anywhere  fails 3, 4 (expected 3, 4): exact

all plants exact

== node research/tests/chooser-shortlist.test.mjs      (chooserShortlist 'order', with the slice; its plants inside checks 3, 4 and 5)
chooser-shortlist: the chooser's shortlist and its slice, seed 99004
  ok   1. the option unset: the paths the code before it's, bit for bit; set: every table the same, the record names it, another width refused   outcomes 03f2dad1043f20fd against 03f2dad1043f20fd; tables 74d98db1ba3acb69 against 74d98db1ba3acb69; refused: chooserShortlist structure: 'order' (the only widt
  ok   2. the list is a shortlist (shorter than the menu); where no listed move can be afforded the whole menu is scored, and the choice there is the whole menu's own   of 800 moves, 138.8 listed a decision; fell back at 274 of 3600 decisions; in the replay 277 of 277 fallbacks choose as the whole menu
  ok   3. planted, the list emptied: every decision falls back, and every path is the whole menu's, bit for bit   12000 of 12000 decisions fell back; 0 of 200 paths differ
  ok   4. the replay along the whole menu's path: planted, the cells' stored moves left out of the list, more decisions give up over 0.01 points of score than unplanted   3600 decisions: the shortlist differs at 62, giving up over 0.01 points at 36; planted, at 2731 and 108
  ok   5. the slice, with the tie-break above the cap on: the shortlist differs from the whole menu at no decision above the cap, and the slice acts; planted, the slice left out, it differs above the cap   3600 decisions, 989 above the cap, the slice at 989; differing above the cap 0 (in all 51); planted, 625 (in all 676)

chooser-shortlist: 5 passed, 0 failed

== the ports against the review's prototypes (the scratch tree stage A ran on): S328F as Phase 4 landed it, 4 points on the light lattice, 300 paths of seed 99004, every path's outcome hashed
S328F port  whole tie 1e-4: 525ba7ecb129fc28 (mean pot 5302797; decisions 0, listed 0, fell back 0, sliced 0)
S328F proto whole tie 1e-4: 525ba7ecb129fc28 (mean pot 5302797; decisions 0, listed 0, fell back 0, sliced 0)
S328F port  order tie 1e-4: 02115836ebe81f25 (mean pot 5301272; decisions 23241, listed 3507452, fell back 855, sliced 5241)
S328F proto order tie 1e-4: 02115836ebe81f25 (mean pot 5301272; decisions 23241, listed 3507452, fell back 855, sliced 5241)

== node research/tests/solve-size.test.mjs
PASS  1. solve()'s bytecode 61395 bytes against the limit 61440: 45 under
```
