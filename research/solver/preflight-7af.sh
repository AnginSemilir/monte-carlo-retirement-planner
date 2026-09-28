#!/bin/bash
# 7af's preflight (a measurement, launched with PREDICTION="none:..."): the diag7af mode on the final code, all 46 units at 4
# wealth points and 20 paths, four at a time as the batch runs them, into results/diag7af-preflight; preflight-parse-7af.mjs
# then runs reduce-7af.mjs's own parse(), gate() (at the preflight's sizes), loadTraces() and reading() over them against
# 7aa's preflight (results/diag7aa-preflight: 4 points, 20 paths, the same seed, its own code): every unit parses, the gate
# refuses nothing at these sizes, every unit 7aa's preflight also ran equals it (and its trace path by path), and the reading
# runs to its outcome line. Each unit's seconds are printed for the time estimate. No figure is read.
set -u
OUT=research/solver/results/diag7af-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 45 | xargs -P 4 -I{} sh -c \
  'DIAG7AF_OUT=research/solver/results/diag7af-preflight node research/solver/audit-s126.mjs diag7af 4 20 part {}/46 7002 > research/solver/results/diag7af-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|run " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7af.mjs "$OUT" research/solver/results/diag7aa-preflight
