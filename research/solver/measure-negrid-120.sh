#!/bin/bash
# NE-GRID C's budget measurement, not a test (PLAN.md NE-GRID-C: its solve time and memory at 120 points NOT CHECKED): one
# 120-point solve of S380 under BASE (audit-negrid.mjs's job 0 with its fine grid at 120 points, 40 paths a world, the tuning
# seed), its solve seconds and its peak memory (VmHWM sampled from /proc every 5 seconds). Launched through
# run-from-snapshot.sh with PREDICTION="none:...".
set -u
OUT=${TMPDIR:-/tmp}/negrid-measure.$$
mkdir -p "$OUT"
DIAGNEGRID_OUT=$OUT node research/solver/audit-negrid.mjs 30 120 40 part 0/12 7002 > "$OUT/case0.txt" 2>&1 &
pid=$!; peak=0
while kill -0 $pid 2>/dev/null; do
  h=$(awk '/VmHWM/{print $2}' /proc/$pid/status 2>/dev/null)
  [ -n "$h" ] && [ "$h" -gt "$peak" ] && peak=$h
  sleep 5
done
wait $pid; echo "exit $?"
grep -E "solve CAND|forceIdentity|done" "$OUT/case0.txt"
echo "peak memory (VmHWM) ${peak} kB"
echo "measured $(TZ=Europe/London date +%H:%M) UK"
