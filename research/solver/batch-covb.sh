#!/bin/bash
# COV-B-STEP (PLAN.md COV and RTAX; predictions/diag-covb.md): audit-covb.mjs on S130, S370, bridge 4, S126, bridge 0 and
# S126 all-ISA at 30 wealth points and 6 share points, 2,000 paths a world (seed 7002), one process a household (its arms
# BASE, TAX, COV, and ORDER and CORD on S370, in the one process), four at once, longest first (results-derive-covb.txt section 4),
# into results/diagcovb; each stopped at 12 hours (raised from 6 before launch: the preflight's S370 ORDER and CORD solves took 198 and 286 s against COV's 108 s at 4 points, results/diagcovb-preflight/case1.txt, so S370's job could pass 6 hours). Read by reduce-covb.mjs into results-covb.txt.
set -u
OUT=research/solver/results/diagcovb
rm -rf "$OUT"; mkdir -p "$OUT"
printf '1\n2\n3\n5\n4\n0\n' | xargs -P 4 -I{} sh -c \
  'DIAGCOVB_OUT=research/solver/results/diagcovb timeout 43200 node research/solver/audit-covb.mjs 30 2000 part {}/6 7002 > research/solver/results/diagcovb/case{}.txt 2>&1 || echo "household {} exited $?"'
echo "COV-B-STEP runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-covb.mjs "$OUT" || echo "=== reduce-covb.mjs did not run to its reading inside the snapshot: reduce in the real tree"
