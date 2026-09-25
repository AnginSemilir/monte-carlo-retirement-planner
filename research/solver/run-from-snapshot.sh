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
#   PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh bash research/solver/batch-x.sh
#   PREDICTION="none:<why this is a measurement, not a test>" research/solver/run-from-snapshot.sh <command...>
#   LANE=light ...   one single-process job beside the main batch (its own lock; it costs the batch about a core)
#
set -euo pipefail
REAL="$(cd "$(dirname "$0")/../.." && pwd)"
#
# THE PREDICTION GATE (RULES.md, maintainer 24 Sep: "maths it, test it" with the prediction written first).
#
# Nothing runs without a registered prediction. PREDICTION names a file that passes check-prediction.mjs (its
# falsifier and the full fair-test table filled in), is committed with no local edits, and has been PUSHED: the
# commit that last touched it must be on origin/<branch>, because a pushed commit cannot be quietly backdated and a
# local one can. PREDICTION=none:<reason> runs a measurement (a target, a timing, a census); the reason is stamped in
# every result file, and fair-gate.mjs refuses those files as evidence for a test unless the reason is accepted.
#
PRED="${PREDICTION:-}"
if [ -z "$PRED" ]; then
  echo "=== REFUSED: no prediction. Set PREDICTION=research/solver/predictions/<name>.md (a registered test)" >&2
  echo "=== or PREDICTION=\"none:<why this is a measurement, not a test>\". See research/solver/RULES.md." >&2
  exit 1
fi
if [ "${PRED#none:}" != "$PRED" ]; then
  REASON="${PRED#none:}"
  [ -n "${REASON// /}" ] || { echo "=== REFUSED: PREDICTION=none: needs a reason after the colon" >&2; exit 1; }
  export PREDICTION_FILE=none PREDICTION_REASON="$REASON"
  echo "=== a MEASUREMENT, not a test: $REASON (its results cannot settle a test)"
else
  case "$PRED" in /*) PRED="$(realpath --relative-to="$REAL" "$PRED")";; esac
  cd "$REAL"
  [ -f "$PRED" ] || { echo "=== REFUSED: no prediction file $PRED" >&2; exit 1; }
  node research/solver/check-prediction.mjs "$PRED" >&2 || { echo "=== REFUSED: the prediction file is not complete" >&2; exit 1; }
  git ls-files --error-unmatch "$PRED" >/dev/null 2>&1 || { echo "=== REFUSED: $PRED is not committed" >&2; exit 1; }
  git diff --quiet HEAD -- "$PRED" || { echo "=== REFUSED: $PRED has uncommitted edits" >&2; exit 1; }
  BR="$(git rev-parse --abbrev-ref HEAD)"
  LAST="$(git log -1 --format=%H -- "$PRED")"
  git merge-base --is-ancestor "$LAST" "refs/remotes/origin/$BR" 2>/dev/null || {
    echo "=== REFUSED: $PRED is not pushed to origin/$BR. Push it first: the push is the timestamp." >&2; exit 1; }
  # THE DERIVATION'S HASH (RULES.md section 8; the maintainer adopted the regimen 25 Sep 20:47 UK): each "derive: <script>
  # > <output> sha256 <16 hex>" line in the prediction is re-run on the tree as it stands; the committed output must hash
  # as recorded and the script must still print it, byte for byte, or the arithmetic moved after the prediction took it.
  while read -r DS DO DH; do
    [ -f "$DS" ] && [ -f "$DO" ] || { echo "=== REFUSED: derive: $DS or $DO does not exist" >&2; exit 1; }
    [ "$(sha256sum < "$DO" | cut -c1-16)" = "$DH" ] || { echo "=== REFUSED: $DO does not hash $DH, as the prediction records" >&2; exit 1; }
    node "$DS" | cmp -s - "$DO" || { echo "=== REFUSED: $DS no longer prints $DO: the derivation moved after the prediction recorded it" >&2; exit 1; }
    echo "=== derivation $DS reproduced (sha256 $DH)"
  done < <(sed -n 's/^[[:space:]]*-\{0,1\}[[:space:]]*`\{0,1\}derive: \([^ ]*\) > \([^ ]*\) sha256 \([0-9a-f]\{16\}\)`\{0,1\}.*$/\1 \2 \3/p' "$PRED")
  export PREDICTION_FILE="$PRED" PREDICTION_SHA="$(git hash-object "$PRED")"
  echo "=== prediction $PRED, registered in $(git log -1 --format='%h' -- "$PRED") at $(TZ=Europe/London git log -1 --format='%cd' --date=format-local:'%d %b %H:%M UK' -- "$PRED")"
fi
#
# THE SEED REGISTRY (RULES.md section 8 item 9; built under the maintainer's unlock of 25 Sep 22:14 UK): the seeds in
# the command and in the scripts it names (their lines that are not comments) must be the prediction's to use - a
# reserved seed only under a prediction it names, never under a measurement, and every seed declared in the
# prediction's Seeds field when it has one (check-prediction.mjs --seeds). The command's paths are the repository's.
#
cd "$REAL"
SEEDARGS=()
for a in "$@"; do [ -f "$a" ] && case "$a" in *.sh|*.mjs|*.js) SEEDARGS+=("$a");; esac; done
node research/solver/check-prediction.mjs --seeds "${PREDICTION_FILE}" --text "$*" ${SEEDARGS[@]+"${SEEDARGS[@]}"} >&2 || {
  echo "=== REFUSED: the seed registry (RULES.md section 8 item 9)" >&2; exit 1; }
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
# the light lane: one single-process job beside the main batch, under a lock of its own
[ "${LANE:-}" = light ] && LOCK="${TMPDIR:-/tmp}/solver-experiment-light.lock"
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
#
# THE SMOKE GATE (RULES.md rule 3: after any code edit, re-test every caller). The modes in smoke.sh run once, tiny, on
# the snapshot's own code before the batch starts (smoke.sh's header lists them; it is not every mode). The stamp is
# keyed by code-id.mjs --smoke: the code hash plus every script a batch runs and smoke.sh itself, so an edit to an
# audit script or select-phase4.mjs re-runs it too; the same code skips it.
#
HASH="$(node research/solver/code-id.mjs)"
SMOKEID="$(node research/solver/code-id.mjs --smoke)"
STAMP="$REAL/research/solver/results/.smoke/$SMOKEID"
if [ ! -f "$STAMP" ]; then
  echo "=== smoke run on code $HASH (smoke stamp $SMOKEID): the modes in smoke.sh once, tiny (about 2-3 minutes)"
  bash research/solver/smoke.sh || { echo "=== REFUSED: the smoke run failed on this code. Fix it before any batch." >&2; exit 1; }
  mkdir -p "$(dirname "$STAMP")"; date -u +%FT%TZ > "$STAMP"
fi
# the run log (committed with the results): when, which lane, under which prediction, on which code, and how busy the box was
echo "$(TZ=Europe/London date '+%d %b %H:%M UK') | ${LANE:-main} | ${PREDICTION_FILE}${PREDICTION_REASON:+: $PREDICTION_REASON} | code $HASH | $REV | load $(cut -d' ' -f1-3 /proc/loadavg) | $*" >> "$REAL/research/solver/runs.log"
"$@"
echo "=== snapshot kept at $SNAP for provenance; remove it when the results are written up"
