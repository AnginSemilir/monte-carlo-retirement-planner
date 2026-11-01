#!/usr/bin/env bash
# The CI and repository state the launch plan's facts read (LAUNCH-PLAN.md section 1), saved raw outside git:
#   bash fetch-ci.sh <out-dir> <fast-run-id> <all-run-id>
# Each file is GitHub's REST answer as fetched (gh api); facts.mjs reads them. The logs are the two runs' job logs whole.
set -euo pipefail
OUT="$1"; FAST="$2"; ALL="$3"; R=repos/AnginSemilir/monte-carlo-retirement-planner
mkdir -p "$OUT"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$OUT/fetched-at.txt"
gh api "$R" > "$OUT/repo.json"
gh api "$R/actions/runs?event=schedule&per_page=5" > "$OUT/schedule-runs.json"
gh api "$R/pulls/2" > "$OUT/pr2.json"
for k in fast all; do
  id=$([ "$k" = fast ] && echo "$FAST" || echo "$ALL")
  gh api "$R/actions/runs/$id" > "$OUT/run-$k.json"
  job=$(gh api "$R/actions/runs/$id/jobs" --jq '.jobs[0].id')
  gh api "$R/actions/runs/$id/jobs" > "$OUT/jobs-$k.json"
  gh api "$R/actions/jobs/$job/logs" > "$OUT/log-$k.txt"
done
echo "saved in $OUT"
