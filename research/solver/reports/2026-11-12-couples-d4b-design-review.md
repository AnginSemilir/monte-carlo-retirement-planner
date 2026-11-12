# 12 Nov: the couples' re-run, its revised registration's design review (D81 (E), (G))

`registrations/couples-d4b.md`, revised as `ANSWERS-2026-11-11.md` sections 3 and 4 say (D78), went to the `reviewer`
agent at ab5bc29d. Its verdict: `reviews/2026-11-12-couples-d4b-design-2.md`.

**Verdict: PASS, eight MINORs, none blocking.** Not launched (D78): the launch is the maintainer's word.

## What was reviewed

- The registration as revised: S1 reported, not deciding; SHIPC on the first 1,000 paths a unit, one chunk, its
  per-couple flags dropped; PASS is A1 and A2 at both estate weights; the candidate af001697ce1b (D73's port), item 11,
  a couple's joint move carrying the sweep, the two stage B options off and refused in any arm (D80); one session.
- The 40 couples landed again on the final code (`results-couples-panel-d4b.txt`, code 1d5d2421c9ab), the pilot again
  (`results-couples-pilot-d4b.txt`, EXPLORATORY, seed 7002) and the sizing from it (`results-couples-sizing-d4b.txt`).

## Commands and their output (run again here after the review)

```
node research/solver/check-prediction.mjs research/solver/registrations/couples-d4b.md
  research/solver/registrations/couples-d4b.md: complete
node research/solver/audit-couples.mjs --planted    planted (25): all read as they should
node research/solver/stage-couples.mjs --planted    all planted checks pass
node research/solver/reduce-couples.mjs --planted   planted (64): all read as they should
node research/solver/size-couples.mjs --planted     planted (11): all read as they should
node research/tests/d4b-shard.test.mjs              5 passed, 0 failed
node research/tests/twostage.test.mjs               5 passed, 0 failed
node research/tests/couple-sweep.test.mjs           4 passed, 0 failed
```

The budget, from `results-couples-sizing-d4b.txt` (its lines 19 to 21):

```
the first stage 47.8 core-hours (200 chunks; the solves 11.0, the engine 31.8, the rollout beside 4.9; by arm CANDC 28.7,
SHIPC 19.0, APP 0.1), on four cores 1 windows
the second stage: every couple and weight going on (the ceiling) 76.1 core-hours (280 chunks, about 19 hours on four
cores); none (the floor) 0; expected at the pilot couples' own changes against APP 0.0
in all: from 47.8 to 123.9 core-hours, expected 47.8; the longest chunk 0.47 hours, inside the 12-hour limit
```

## The reviewer's findings, and what was done with each

1. With S1 not deciding, a couples' path that is faithful but worse passes if it costs less than A1's slack; the S1 note
   is weak below a point of loss on SHIPC's 1,000 paths. D78's ruling; the registration now says the read does not treat
   "no note" as "no loss".
2. No unit records that the joint move carried the sweep; held by the code tie and `couple-sweep.test.mjs`. Recorded.
3. The registration said the code tie has a planted case; its two refusals are inline, not planted. The words are fixed
   (the only change to the text after the review, with the Design review line itself).
4. The gate would accept a CANDC person with no joint tier state; none of the panel's 80 people is one. Recorded.
5. **For the maintainer.** The open choice of reading for a couple's sweep (`DECISIONS-PENDING.md`) touches most of the
   panel, since most of its couples hold cash ISA money. Launching the registration as it stands is choosing the first
   reading (a couple's move carries the sweep its tables were solved with). The read has no split by cash ISA holding.
6. The code must not move between the review and the launch. The run is launched from a tree at the registration's
   commit; item 12's stage B, if one is built (D84), is committed only after that commit is fixed, and nothing under
   `src/solver` goes between.
7. The first stage nearly fills one 12-hour window; `RESUME=1` carries it into a second if it runs past.
8. `solver-model.test.mjs` section H reaches eight panel base plans by place (engine against model, no candidate, no
   seed 7021): recorded for the read's statement.

No result of D4 or of seed 7021 was read, printed or estimated; `d4-backup` was not opened.
