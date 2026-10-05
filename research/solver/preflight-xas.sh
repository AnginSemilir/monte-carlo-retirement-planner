#!/bin/bash
# XAS's build check (PRED="none:..."; the test itself will run under its own prediction): audit-xas.mjs's 4 households at 4
# wealth points and 3 paths a world (seed 7002), PAR at a time (default 1, the light lane), into results/diagxas-preflight.
# Every self-check in the audit refuses the run on its own; no figure is read.
set -u
OUT=research/solver/results/diagxas-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 3 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGXAS_OUT=research/solver/results/diagxas-preflight node research/solver/audit-xas.mjs 4 3 part {}/4 7002 > research/solver/results/diagxas-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "Error\|audit-xas:" "$OUT"/case*.txt | head -5
grep -h "checks:\|xas \|open \|swap " "$OUT"/case*.txt
