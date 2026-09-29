#!/bin/bash
# P's preflight (a measurement, launched with PREDICTION="none:..."): the diagP mode on the final code, all 29 jobs at 4
# wealth points and 20 paths, 20 at the node (the sizes of 7ae's, 7ad's and 7af's preflights), four at a time as the batch
# runs them, into results/diagP-preflight; preflight-parse-P.mjs then runs reduce-P.mjs's own parse(), gate() (told the
# preflight's points), loadTraces() and reading() over them against those preflights: every job parses, the gate refuses
# nothing, settings 0 and 1e-3 reproduce 7ae's preflight lines and node traces path by path, and the reading runs to its
# outcome line. Each job's seconds are printed for the time estimate. No figure is read.
set -u
OUT=research/solver/results/diagP-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 28 | xargs -P 4 -I{} sh -c \
  'DIAGP_GRID=4 DIAGP_OUT=research/solver/results/diagP-preflight node research/solver/audit-s126.mjs diagP 4 20 part {}/29 7002 20 > research/solver/results/diagP-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "solve \|node " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-P.mjs "$OUT"
