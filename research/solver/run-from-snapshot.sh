#!/usr/bin/env bash
#
# RUN AN EXPERIMENT FROM A FROZEN COPY OF THE TREE.
#
# A batch spawns a fresh Node per household, and each one loads the solver at the moment it starts. So
# editing src/solver while a 41-household run is in flight does not restart it - it silently splits the
# run across versions. That happened on 2026-09-21: solve.js was edited three times during the flex-mix
# pilot, 35 households got one solver and 6 got another, and the run was not reportable.
#
# This copies the code to a snapshot and runs the command there, so edits in the working tree cannot
# reach a run already going. Results are symlinked back to the real tree, so output still lands in the
# repository while the code that produced it stays frozen.
#
#   research/solver/run-from-snapshot.sh <command...>
#   research/solver/run-from-snapshot.sh bash my-batch.sh
#
set -euo pipefail
REAL="$(cd "$(dirname "$0")/../.." && pwd)"
#
# ONE EXPERIMENT AT A TIME, ENFORCED RATHER THAN REMEMBERED.
#
# The box has four cores and a batch takes all of them. Two batches at once do not take two hours each
# instead of one - they thrash, and if they share a tag they race on the same result files and the
# output is not trustworthy.
#
# That happened on 2026-09-22 and it did not look like a mistake at the time. The launch was written
# as `A && B && nohup ... & sleep 20; head ...`, and bash applies the `&` to the WHOLE `&&` list, so
# the variable assignment happened inside the background subshell and the foreground `head` failed on
# an empty path. The launch had worked; only the confirmation had not. A second batch went on top of
# the first, and eight jobs ran on four cores for six minutes before anyone noticed.
#
# A discipline that depends on reading a launch command correctly is not a discipline. This is a lock.
#
LOCK="${TMPDIR:-/tmp}/solver-experiment.lock"
#
# THE LOCK CLEARS ITSELF WHEN STALE. DO NOT rm IT FROM A CALLER.
#
# The first version told the caller to `rm -rf` a stale lock, and that advice destroyed the lock. Every
# chain script I wrote then began with a blind `rm -rf`, so the mkdir below ALWAYS succeeded and nothing
# was ever refused. On 2026-09-23 two convergence runs started 59 seconds apart and both held what they
# thought was the lock, because the second had deleted the first's. A guard whose documented usage is to
# delete it first is not a guard.
#
# So staleness is now decided here, from the recorded pid, and never by the caller.
#
if ! mkdir "$LOCK" 2>/dev/null; then
  HOLDER="$(cat "$LOCK/pid" 2>/dev/null || echo 0)"
  if [ "$HOLDER" -gt 0 ] 2>/dev/null && kill -0 "$HOLDER" 2>/dev/null; then
    echo "=== REFUSED: an experiment is already running (lock $LOCK, pid $HOLDER)" >&2
    echo "=== $(cat "$LOCK/what" 2>/dev/null || echo 'unknown command')" >&2
    exit 1
  fi
  echo "=== stale lock from pid ${HOLDER:-?} (no such process); taking it over" >&2
  rm -rf "$LOCK"
  mkdir "$LOCK" || { echo "=== REFUSED: could not take the lock" >&2; exit 1; }
fi
echo "$$" > "$LOCK/pid"
echo "$* (pid $$, started $(date -u +%Y-%m-%dT%H:%M:%SZ))" > "$LOCK/what"
trap 'rm -rf "$LOCK"' EXIT INT TERM
SNAP="$(mktemp -d "${TMPDIR:-/tmp}/solver-snap-XXXXXX")"
cp -r "$REAL/src" "$REAL/research" "$REAL/package.json" "$SNAP"/
# results go back to the real tree; node_modules is large, unchanging and shared
rm -rf "$SNAP/research/solver/results"
ln -s "$REAL/research/solver/results" "$SNAP/research/solver/results"
ln -s "$REAL/node_modules" "$SNAP/node_modules"
REV="$(cd "$REAL" && git rev-parse --short HEAD 2>/dev/null || echo unknown)"
DIRTY="$(cd "$REAL" && git status --porcelain 2>/dev/null | wc -l)"
echo "=== snapshot $SNAP   from $REV$([ "$DIRTY" -gt 0 ] && echo " + $DIRTY uncommitted file(s)")"
[ "$DIRTY" -gt 0 ] && echo "=== WARNING: uncommitted changes are baked into this snapshot and cannot be traced from the commit alone"
cd "$SNAP"
"$@"
echo "=== snapshot kept at $SNAP for provenance; remove it when the results are written up"
