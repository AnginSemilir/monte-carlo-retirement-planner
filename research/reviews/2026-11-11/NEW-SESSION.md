# For the agent's new session, 11 Nov: where the last session stopped, and the order from here

The maintainer has paused the last session and is opening a new one. This is the external review's reading of where
the work stands, taken from the repository at 14:34 UK on 11 Nov. It adds to the agent's own handoff
(`research/solver/HANDOFF-2026-11-11.md` on `claude/project-access-i58m0x`) and replaces none of it. Where the two
differ, check the repository.

No result of D4 or of seed 7021 was read, and the branch `d4-backup` was not opened: only its name was listed.

## 1. What the repository shows

- **The working branch's head is 11bb254** (12:44 UK): "D73 recorded; item 10's port kept as a patch; the handoff".
  Nothing has been pushed to it since.
- **D73's port is not committed.** It is `research/solver/drafts/item10-d73.patch` (612 lines, eleven files), and
  the handoff says it applies cleanly to 11bb254. It holds item 10's ON and REF and item 5's default. The candidate
  becomes af001697ce1b (before: d71f65ae871e).
- **The fast suite on the patch: 49 of 60.** The handoff's five causes:

  | | What fails | What it needs |
  |---|---|---|
  | 1 | `state-check`: the engine and the forward run part by about £2,300 on S370, 1,751 moves mismatched | Investigated before anything else (the handoff's own words). The suspect is the ISA sweep in the forward run's path |
  | 2 | `coarse` throws where the candidate's options reach a solve off the tier-state path: `risk-consent` 4, `lever-matrix` 2, `solver-memo`, `speed-port`, `solver-cache` | A choice of where `coarse` is dropped (section 3 below) |
  | 3 | `couple-quick` 5, `windfall-relief` 6, `couple-share` 2: pinned table digests moved, as a new candidate's should | The maintainer's unlock, naming each test with its old figure, its new and the working (D66) |
  | 4 | `solver-app` 1: its lattice plant sets `nz: 64`, now the candidate's own value | Another value for the plant |
  | 5 | `check-state`: the printed block | `state.mjs --write` |

- **Still to do on the port after that** (the handoff): the option-off identity (step 6), the cache key (step 8),
  gate 5 again (step 9), the unlock of `fair-variables.mjs` for rows naming `coarse` and `sweepCashIsaTo`, the
  reviewer agent on the change of default. Then the couples landed again, the pilot, and the registration revised.
- **CI on 11bb254.** Verify passed. **Full is still running:** both shards started at 13:35 UK. The last Full to
  finish (on ab93f4e, before 5eaca5f's fixes and D72's re-pins) failed on both shards after 1 h 45 and 2 h 48, so
  this one should end between about 15:20 and 16:25 UK. It is the first that can show whether those fixes turned the
  full tier green. **A push cancels it.**
- **Held:** the couples' re-run (D71). **Waiting on the review, now answered:** item 7 and the estate cap
  (`ANSWERS.md` here), and the re-run's shape (`../2026-11-09/ANSWERS-2026-11-11.md`).
- **No batch is recorded as running.** `runs.log`'s last line is the re-run's pilot, 11 Nov 02:02 UK.
- **D4's fallback.** D63 copies D4's finished chunks to the branch `d4-backup`, and a branch of that name is on the
  remote. So it should not depend on the old container.

## 2. What the repository cannot show

- **Anything the last session did after 12:44 and did not push.** Its handoff says everything was committed and
  pushed at that point. If it can still answer, the maintainer asks it one thing before closing it: "Commit and push
  anything not yet pushed, or say there is nothing." If it pushes, this note's head is out of date: read the log.
- **Files that live only on the old container** (the handoff's section 4): SPEED-A's raw units (rebuilt with
  `audit-speed.mjs`; nothing below needs them) and the worktrees `d4-launch` and `d4-backup`. A new session on a
  new container has none of them.

## 3. The review's view on the port's open choice: where `coarse` is dropped

This corrects the review's own item 10. Its "not in this item" list said of the path without a tier state: "Under
the switch the app does not run it." That is wrong. A user who withdraws consent to risk above the default has one
tier pair and no tier state, and the app solves for them.

What I would do:
1. **`coarseSetup` keeps its refusal.** A direct call that names `coarse` on a path it cannot serve must fail, not
   run silently on the whole menu. That is the test's check 6.
2. **One predicate beside it** (outside `solve()`, so V8's limit is untouched) says whether a solve can take
   `coarse`, on the same conditions as the refusal.
3. **`solveForApp` asks it** in the line that already drops `coarse` for a locked position. Where the answer is no,
   the solve runs on the whole menu at today's speed and `meta.coarse` says so. So consent withdrawn is slower, not
   broken, and bringing the shortlist to that path is its own item, as the locked positions are.
4. **The tests that spread `APP_CANDIDATE` into `solvePlan`** (`lever-matrix`, `solver-memo`, `speed-port`,
   `solver-cache`) take the candidate's options through one helper that asks the same predicate. No test strips the
   key by hand.
5. **Step 8's cache key carries whether `coarse` was used,** so a whole-menu solve is never restored as a coarse
   one.
6. **Gate 5 is quoted for the path that takes `coarse`.** The page's time for a user without consent is the old
   one, and the D-line says so.

It is the maintainer's choice. Put it to them with the unlock request, in one message.

**On `state-check`, a pointer and not a finding.** The sweep's step is written three times (the engine's 7d,
`model.js`, `fast.js`), and the move carries it (`menuMove` in `solve.js`). Item 5's own test compares the engine
with the model. Check which of the three `state-check`'s forward run uses, and whether the moves it replays carry
the sweep.

## 4. The order from here

1. **Read Full's result on 11bb254 first. Do not push before it ends.** Work locally until then.
2. **D73's port, `state-check` first.** Time box: two hours. If the cause is not in the forward run's sweep, STOP and
   report what was found.
3. **One message to the maintainer, early,** so the answer can come while work goes on: the unlock for the three
   FAST tests' digests (each with its old figure, its new and the working) and for `fair-variables.mjs`'s rows; and
   where `coarse` is dropped (section 3).
4. **Item 11 while that waits** (`../2026-11-09/EXPERIMENTS-AND-PORTS.md`). It is exact, and it shares no file with
   the patch: the patch touches `solve.js`, `solverApp.js`, `solverSettings.js`, `PlannerCards.jsx`, the candidate's
   files and `solve-coarse.test.mjs`; item 11 touches `couple.js` and `grid.js`. Its own commit.
5. **The port committed** once `state-check` is green and the unlock has come; then its steps 6, 8 and 9 and the
   reviewer agent.
6. **Item 13's stage A** (`ANSWERS.md` section 2), which needs af001697ce1b's tables.
7. **The couples landed again,** the pilot, and `couples-d4b.md` revised
   (`../2026-11-09/ANSWERS-2026-11-11.md` sections 3 and 4). Sent to the design review. Not launched.
8. **Not started:** the basic harvest ceiling (after the beta) and item 12.

The prompt at the end of `ANSWERS.md` carries this order.
