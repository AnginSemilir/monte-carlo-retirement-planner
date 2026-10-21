#!/bin/bash
# 7U-F'S PREFLIGHT, on the tuning seed 7002 (exploratory): audit-7uf.mjs as registered but on S224 (bridge years) and S002
# (none), estate weight 0.02, every arm with DECOMP on both, 400 paths (runPolicy beside on all 400, 400 a world); read by
#   node research/solver/reduce-7uf.mjs --preflight research/solver/results/preflight-7uf
# (the gate, every figure, and DECOMP equal to CAND path for path on S002). Its unit times size 7u-F's budget.
set -u
OUT=research/solver/results/preflight-7uf
mkdir -p "$OUT"
export AUDIT7UF_ONLY=S224,S002 AUDIT7UF_W=0.02 AUDIT7UF_DECOMP_ALL=1 DIAG7UF_OUT=$OUT
NU=$(node research/solver/audit-7uf.mjs --units | tail -1)
seq 0 $((NU - 1)) | xargs -P 3 -I{} sh -c "node research/solver/audit-7uf.mjs 400 part {}/$NU 7002 > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "7u-F preflight done $(TZ=Europe/London date '+%d %b %H:%M') UK"
