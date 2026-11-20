# The late tail, read (20 Nov; EXPLORATORY; `LATE-TAIL.md` and its amendment 1)

**Outcome, on the second read, by the rule committed before any unit ran: THE GROWTH.** By `LATE-TAIL.md` that is the
case where the household table makes the trade itself, on a right reading of the household. Step 8's build goes on to
`main` on B1's gate, with this read reported (D134 (1)). Before it moves, the fault and both reads are with the maintainer.

The first read printed THE GROWTH with CEIL NEAR K2, which would have stopped the build. Its CEIL arm was miswired; the
second read replaces it.

## The two reads

- **The run:** ten of step 8's units: the seven below nought on seed 7024, M1's unit S273-90, and two controls. Seed 7002
  (the pilot's, not held out), `4,000` paths a unit, 45 points, estate weight 0.02. Through the launcher on frozen code:
  code 71fb4271c681, audit 57cc9f06eafb, 20 Nov 12:10 to 15:28 UK, no unit exiting with an error.
- **The first read** (`results-late-tail.txt`) printed CEIL restoring `87.4%` of D, and so CEIL NEAR K2.
- **The fault** (the reviewer at the read, `reviews/2026-11-20-read-late-tail.md`, finding 1; confirmed in the code):
  - The audit's recorder called each arm's chooser with two arguments. The engine passes three; the third is the tiers held,
    which a single's table reads for the switch charge.
  - Of the six arms only CEIL is a single's table, so only CEIL ran wrong: it charged nothing for a switch of risk.
  - The pattern search over every wrapper of a policy's chooser, in the research and in the app, found no other wrapper
    that drops it.
- **The fix** (amendment 1, committed before CEIL was run again: be0ac7e9, f3094f1b):
  - the recorder passes every argument;
  - check 5, a check of that class: each recorded arm equal bit for bit to the same arm without the recorder on its first
    `200` paths. Its plant, the recorder dropping the tiers held again, failed it on both units tried in the smoke.
- **The run again:** CEIL alone on the amended audit (5bbb8c62b042), 16:29 to 16:57 UK, no unit exiting with an error.
  Each unit was held to the first run: the same household table by digest, and the first run's K2, HSPA, L and R each
  equal to the same arm without the recorder on its first `200` paths. So the fault touched CEIL alone.
- **The second read** (`results-late-tail-2.txt`): the first run's APP, K2, HSPA, L and R with the re-run's CEIL, by the
  same rule. The gate is fair on exactly the two audit stamps.

## The rule's figures (`results-late-tail-2.txt`)

On the worst tenth of each unit's markets, ranked by APP's end pot:
- **D**, K2's mean end pot less HSPA's, the mean over the seven: `£52,873` a path.
- **L** restores `-£51,403` a path (`-97.2%` of D): it does not explain the loss.
- **R** restores `£72,326` a path (`136.8%` of D): it explains the loss.
- **CEIL** restores `-£11,178` a path (`-21.1%` of D): it does not explain the loss, so CEIL NEAR K2 is not printed. The
  first read's `£46,214` (`87.4%`) was the miswired arm's.

**What the outcome shows, and what it does not.**
- R is HSPA's move with each person's tiers as K2's move holds them at that state. It restores the worst tenth's mean end
  pot, the rule's measure. That is a lead about the tiers held, not a shown cause:
  - On S273-own, S273-sppart and S357F-gap8, R holds about HSPA's early risk and more from the eleventh retired year on, yet
    restores the whole shortfall (the by-unit lines).
  - R keeps fewer paths than HSPA on the worst tenth: survivors pooled over the seven, of `2,800`, K2 `1,877`, HSPA
    `1,852`, R `1,618`. So R lifts the worst tenth's mean pot by ending richer on the paths it keeps while losing more of
    them.
- CEIL, the household table on its own plan, ends the worst tenth below HSPA on average over the seven (on S025-45 and
  S273-sppart a little above it). By the rule, the table does not read the couple as safer than it is.

## Beside the rule, deciding nothing (`results-late-tail-2.txt`)

- **Net whole paths lost against K2, pooled over the seven:** HSPA `28`, L `745`, R `351`, CEIL `46`.
- **What L is** (the reviewer's finding 4): L is HSPA's move with the spending level K2's chooser would take at L's own
  state each year. It is not K2's own spending.
  - On the worst tenth, L's level over the first ten retired years is above K2's own on six of the seven units.
  - HSPA's own early level there is within about a point of K2's: higher on three units, lower on three, the same on one.
  - So the read does not show HSPA cutting less early in these markets, the first half of the deep review's lead.
- **The worst tenth** (finding 5): APP's end pot is nought on `490` to `566` of the `4,000` paths on eight of the ten units
  (S025-45 `171`, S349F-own `369`). There the worst tenth is the `400` lowest-numbered of the paths on which the app's rules
  run out (the highest taken `2,840` to `3,338`). That is fair between arms, since a path's number carries nothing of its
  market, but it is not the worst tenth of the markets.
- **The controls** (finding 3): under R, S349F-own goes from `25` net paths kept against K2 (HSPA) to `25` lost, and
  S355F-own from `13` kept to `65` lost. The beside's condition is met in its own terms. But R keeps fewer paths than HSPA
  on every one of the ten units, so a control would lose its gain under R whatever the cause. The controls do not show
  that the gain and the loss are one trade.
- **M1's unit, S273-90** (finding 6):
  - On its worst tenth HSPA spends less early than K2 (`80.9%` against `83.1%`), and ends at `£219,994` against K2's
    `£238,837`.
  - R restores all of it (`£240,018`) and keeps `4` more paths than K2 over the unit: the one unit where R loses no paths
    against K2.
  - CEIL ends at `£194,389` and loses `7` paths against K2.
- **Survival by unit** is printed for every arm. Of the seven, HSPA's is furthest below K2's on S357F-own, `95.28%`
  against `95.63%`.
- **A path's CPU, the mean a unit:** HSPA `55.4` ms, K2 `186.7` ms, CEIL `49.6` ms.

## What it means for step 8's build (D134 (1))

- By the rule on the second read, the build goes on to `main` on B1's gate, with this read reported. The maintainer sees
  the fault and both reads before it moves.
- The trade the read leaves, said plainly: on these seven units HSPA keeps `28` paths fewer than K2 in `28,000`, and ends
  the worst tenth `£52,873` a path lower. Step 8's registered read (`results-household-hsp.txt`) has HSPA ahead of K2 on
  survival over the 40 held-out units, pooled `+0.762` points, no unit flagged.
- Left to do on the build: the words, the default and its pin (`couple-default.test.mjs`, which needs the maintainer's
  unlock), the identity at 45 points against step 8's pilot, the reviewer on the change of default, and B1's gate.
