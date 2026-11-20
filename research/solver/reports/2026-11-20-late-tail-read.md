# The late tail, read (20 Nov; EXPLORATORY; `LATE-TAIL.md`)

**Outcome, by the rule committed before any unit ran: THE GROWTH, with CEIL NEAR K2.** By `LATE-TAIL.md` that is the
case where the household table reads the couple as safer than it is. So step 8's build stops before `main` and comes
back to the maintainer (D134 (1)), with design B as the next step: the household table with each person's share of the
pension carried year by year (`HOUSEHOLD.md` section 2).

## The run

- Ten of step 8's units: the seven below nought on seed 7024, M1's unit S273-90, and two controls.
- Seed 7002 (the pilot's, not held out), `4,000` paths a unit, 45 points, estate weight 0.02.
- Arms: APP, K2, HSPA, L (HSPA's move with K2's spending level), R (HSPA's move with each person's tiers as K2's move
  holds them) and CEIL (the household table on its own plan, inside HSPA's bands).
- Through the launcher as an EXPLORATORY run on frozen code: code 71fb4271c681, audit 57cc9f06eafb. It ran 20 Nov 12:10
  to 15:28 UK; no unit exited with an error.
- Read once by `reduce-late-tail.mjs`; its output whole is `results-late-tail.txt`. The gate: fair, every unit's six arms
  at its paths, its checks passed (the pilot's arrays, the variants' wiring, what each variant takes, the engine).

## The rule's figures (`results-late-tail.txt`)

On the worst tenth of each unit's markets, ranked by APP's end pot:
- **D**, K2's mean end pot less HSPA's, the mean over the seven: `£52,873` a path.
- **L** restores `-£51,403` a path (`-97.2%` of D): it does not explain the loss. K2's spending level on HSPA's move
  makes the worst markets' end pot lower still.
- **R** restores `£72,326` a path (`136.8%` of D): it explains the loss. The smaller end pot comes from the risk the
  household table holds.
- **CEIL** restores `£46,214` a path (`87.4%` of D): it explains the loss too, so CEIL NEAR K2 is printed. The household
  table on its own plan ends the worst markets nearly where K2 does; run on the couple (HSPA), the same table ends
  lower.

## Beside the rule, deciding nothing (each figure printed in `results-late-tail.txt`)

- **Net whole paths lost against K2, pooled over the seven:** HSPA `28`, L `745`, R `351`, CEIL `-11`. K2's tiers on
  HSPA's move restore the late pot but lose many more paths than HSPA does. The household's tiers are not simply wrong:
  they buy survival with the late pot. CEIL keeps more paths than K2.
- **The controls lose their gain under R,** the variant that explains the seven:
  - S349F-own: HSPA `25` net paths kept against K2 (lost `-25`), R `25` lost;
  - S355F-own: HSPA `13` kept (lost `-13`), R `65` lost.

  By `LATE-TAIL.md`'s beside section the controls' gain and the seven's loss are then one trade. The reducer prints these
  figures, not that sentence.
- **M1's unit, S273-90:** HSPA keeps `11` more paths than K2 (lost `-11`), R `4` more (lost `-4`), CEIL loses `2`.
- **Survival by unit** is printed for every arm. Of the seven, HSPA's is furthest below K2's on S357F-own, `95.28%`
  against `95.63%`.
- **A path's CPU, the mean a unit:** HSPA `55.4` ms, K2 `186.7` ms.

## What comes back to the maintainer (D134 (1))

- **The build stops before `main`.** Built so far, in its worktree and kept on the remote as
  `drafts/hsp-port.patch` (7d5b1507): steps 1 to 3 with their tests (the household's route through the page's client, its
  stored key naming the bands, the page's couple views for a household). None of it goes to `main`, and nothing in the app
  changes.
- **The next step, by the rule: design B** (`HOUSEHOLD.md` section 2). Design A, which step 8 tested, prices the year
  as if the household could always split its taxable income by the pensions' split at the start. Design B carries each
  person's share of the pension year by year on the household's expected path, and works out each person's tax and access
  on their own part. Its cost in `HOUSEHOLD.md`: about two to three days for the household year in `fast.js`, held to
  `model.js`, with its tests; then a test of it against K2 and HSPA.
- **Other ways the maintainer may take it:** take HSPA as it stands, as the trade the controls show (its registered read
  passed with pooled survival `+0.762` points, and on these seven its net loss against K2 is `28` paths of `28,000`); or
  hold, today's couples' default (K2) staying.
