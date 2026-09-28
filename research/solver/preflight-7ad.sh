#!/bin/bash
# 7ad's preflight (a measurement, launched with PREDICTION="none:..."): the diag7ad mode on the final code, all seven jobs at 4
# wealth points (DIAG7AD_GRID=4x5; each job keeps its return points) and 20 paths, 20 a node (so the node runs' first 1000
# are the 20 7ac's preflight world lines ran), four at a time as the batch runs them, into results/diag7ad-preflight;
# preflight-parse-7ad.mjs then runs reduce-7ad.mjs's own parse() and gate() over them against 7aa's and 7ac's preflight units
# (the same sizes, their own code): every job parses, the gate refuses only the sizes, the 30x5-named jobs reproduce 7aa's
# preflight tables, ran lines and gaps and 7ac's preflight world lines, the prices sum, and every trace is named and stamped
# as the reducer reads it. Each job's seconds are printed for the time estimate. No figure is read.
set -u
OUT=research/solver/results/diag7ad-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 0 1 2 3 4 5 6 | xargs -P 4 -I{} sh -c \
  'DIAG7AD_GRID=4x5 DIAG7AD_OUT=research/solver/results/diag7ad-preflight node research/solver/audit-s126.mjs diag7ad 4 20 part {}/7 7002 20 > research/solver/results/diag7ad-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "solve \|node " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ad.mjs "$OUT" research/solver/results/diag7aa-preflight research/solver/results/diag7ac-preflight
