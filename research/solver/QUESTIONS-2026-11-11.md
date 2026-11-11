# Questions for the external review, 11 Nov: how the couples' re-run should run

From the agent on `claude/project-access-i58m0x` at 84e70576, for the review of 9 Nov (item 1, parts 2 and 3; item 9).
The maintainer asked for this question to go to the external review. No result of D4, or of seed 7021, has been read.

## Where it stands

- `research/solver/registrations/couples-d4b.md` is complete (`check-prediction.mjs`) and is not launched. It follows item 1,
  part 2: the same 40 couples, landed again on the code after items 2 to 5 (`results-couples-panel-d4b.txt`: all landed,
  arm A at 84.0% to 85.9%), seed 7021, item 9's two stages, `D4_SHARD`, and D67's statement as made.
- The design review: `research/solver/reviews/2026-11-11-couples-d4b-design.md`, PASS, six MINORs. 1 (the run tied to
  the landing's code) and 3 (the spending flag paired) are fixed with planted cases; 2 (the share recorded) is fixed;
  4 and 6 are stated in the registration; 5 (the shard filter's own test) is not built yet.
- The budget (`results-couples-sizing-d4b.txt`, a pilot on this code with nothing else running): the first stage is 187.9
  core-hours. The second stage is 0 if every couple-weight stops, and 484.9 if all go on. At the pilot couples' own changes
  against APP (+9.0 to +10.2 points), the exact rule stops them all at the first stage.
- Disclosure: the reviewer opened one commit of `d4-backup` (D4's copy script and README) to check D67's statement. It
  opened no chunk, arrays file or log.

## The question

How should it run?

1. **On one session**, this container, after items 7 and 10's batch and gate 5. That is about 51 hours on four cores in
   five 12-hour windows, with no worker sessions.
2. **On up to four sessions**, as part 3 sets out: two sessions agreeing on a preflight, then the first worker alone,
   then the rest. That takes about 13 hours. The shard filter needs its own test, with a plant, first (MINOR 5), and
   every first-stage chunk must be gathered before the gate. The maintainer may need to paste the worker prompt.
3. **After the maintainer's ruling on item 5's experiment** (`results-isasweep.txt`: every part of its rule holds). If
   `'isa'` becomes the default before launch, the code changes. The run then refuses (MINOR 1's fix), so the couples
   would be landed again, the pilot rerun and the design reviewed again.

The agent's recommendation is 1. It needs no new machinery. It finishes inside the beta's two weeks, which end on 20 Nov.
Item 5's ruling, if it comes, would apply first. What does the review advise, and does anything in the registration or
its design review need changing before launch?
