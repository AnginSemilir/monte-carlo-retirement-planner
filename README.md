# d4-backup: D4's finished chunks, kept off the container

A backup of the registered couples run D4 (`research/solver/registrations/couples-d4.md` at e09ac60; seed 7021,
520 chunks, code a8d0e9568319, audit 3b700ddd7940). On 9 Nov a reprovisioned container wiped 76 finished chunks;
the maintainer agreed (9 Nov) to keep a copy of each finished chunk here.

- Never merged, nothing reads it but a restore; deleted after D4's read. Raw results otherwise stay out of git (D17).
- `d4-run/` holds each finished chunk's log (`case<k>.txt`, its done line in) and its arrays (`<id>-<arm>-w<w>-c<j>.json.gz`),
  byte for byte as the run wrote them. Nothing here is read before all 520 are in (the read is once, by its rule).
- `backup.sh` copies the chunks finished since the last copy and pushes; it runs as a tracked task beside each window.

## Restore after a wipe
1. Rebuild the worktree at e09ac60 (`git worktree add --detach /home/user/d4-launch e09ac60`, the full history fetched,
   `git remote set-head origin claude/project-access-i58m0x`), build its engine (`python3 research/build-engine.py`) and
   `mkdir -p research/solver/results/d4-run`.
2. `git clone -b d4-backup <origin> /home/user/d4-backup` and copy `d4-run/*` into the worktree's `research/solver/results/d4-run/`.
3. Relaunch under `RESUME=1` through the launcher. batch-couples.sh keeps a chunk only when its stamp line and Node
   (v22.23.4) match and its done line is in; every other chunk runs again from the start.
