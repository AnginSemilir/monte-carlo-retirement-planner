#!/bin/bash
# XAS-R's build check (PRED="none:..."; the test itself will run under its own prediction): audit-xasr.mjs's 3 households at
# 4 wealth points and 3 paths a world (seed 7002), PAR at a time (default 1, the light lane), into
# results/diagxasr-preflight. Every self-check in the audit (replica, nodes, cr, top, terms) refuses the run on its own; no
# figure is read.
set -u
OUT=research/solver/results/diagxasr-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGXASR_OUT=research/solver/results/diagxasr-preflight node research/solver/audit-xasr.mjs 4 3 part {}/3 7002 > research/solver/results/diagxasr-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "Error\|audit-xasr:" "$OUT"/case*.txt | head -5
grep -h "checks:\|ran \|xasr \|terms \|open " "$OUT"/case*.txt
