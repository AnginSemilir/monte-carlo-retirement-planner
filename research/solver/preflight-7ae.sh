#!/bin/bash
# 7ae's preflight (a measurement, launched with PREDICTION="none:..."): the diag7ae mode on the final code, all three jobs at 4
# wealth points and 20 paths, 20 at the node (so the 1e-3 node runs' first paths are the 20 7ad's preflight node runs ran),
# three at a time as the batch runs them, into results/diag7ae-preflight; preflight-parse-7ae.mjs then runs reduce-7ae.mjs's
# own parse() and gate() over them against 7aa's and 7ad's preflights (the same sizes, their own code): every job parses, the
# gate refuses only the sizes, the 1e-3 solves reproduce 7aa's preflight tables, ran lines and gaps and the 1e-3 node runs'
# first paths 7ad's preflight node runs, path by path; every trace is named and stamped as the reducer reads it, and the
# decision log agrees with its trace; the reducer's reading runs over them to its outcome line. Each job's seconds are
# printed for the time estimate. No figure is read.
set -u
OUT=research/solver/results/diag7ae-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 0 1 2 | xargs -P 3 -I{} sh -c \
  'DIAG7AE_OUT=research/solver/results/diag7ae-preflight node research/solver/audit-s126.mjs diag7ae 4 20 part {}/3 7002 20 > research/solver/results/diag7ae-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "solve \|node " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ae.mjs "$OUT" research/solver/results/diag7aa-preflight research/solver/results/diag7ad-preflight
