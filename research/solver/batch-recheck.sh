#!/bin/bash
# STEP 2 OF THE EXTERNAL REVIEW'S PART B (research/reviews/2026-10-21/EXTERNAL-REVIEW.md): re-check what Step 1's fixes could
# have changed. 7u's comparison (audit-7u.mjs: CAND, the frozen candidate, against SHIP, the product's settings, on the
# candidate's plan, 30 points, 8,000 paths, estate weight 0.02), unchanged, on the code with all of Step 1, on the tuning
# seed 7002, for the households the next decisions rest on: 7u's three unsettled ones (S224, S380, S364), the largest taxable
# accounts (S214 and S394 at £1.08M, S150 and S212 at £427,500), and any whose candidate tables lost cells in Step 1's reach
# table (UNITS_EXTRA). A measurement, exploratory (the maintainer's go-ahead of 21 Oct): launched through the launcher as
#   PREDICTION="none:<why>" research/solver/run-from-snapshot.sh bash research/solver/batch-recheck.sh
# and read by research/solver/recheck-7u.mjs.
set -u
OUT=research/solver/results/recheck7u
mkdir -p "$OUT"
# the units at W0.02 (audit-7u.mjs's order: CAND/0.02 at the panel index, SHIP/0.02 at 110 + it)
UNITS="44 154 52 162 51 161 43 153 53 163 38 148 42 152 ${UNITS_EXTRA:-}"
echo "recheck: units $UNITS on seed 7002"
printf '%s\n' $UNITS | xargs -P 4 -I{} sh -c \
  'DIAG7U_OUT=research/solver/results/recheck7u timeout 21600 node research/solver/audit-7u.mjs 30 8000 part {}/220 7002 > research/solver/results/recheck7u/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "recheck runs done $(TZ=Europe/London date +%H:%M) UK"
