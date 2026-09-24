#!/usr/bin/env bash
#
# THE SMOKE RUN (RULES.md rule 3: after any code edit, re-test every caller before launching anything).
#
# run-from-snapshot.sh runs this inside the snapshot before any batch, once per version of the code (a stamp keyed by
# code-id.mjs's hash skips it next time). It runs, tiny: experiment.mjs flex in five configurations (the solver, the
# rival arms, both in the mixture, risk above with records, the F1 read), reduceFlex over the arms' files, and the S126
# audit's scan and ids modes; and it checks every result file for the code and prediction stamps. It does NOT run
# experiment.mjs's select/run/perturb/reduce modes, select-phase4.mjs or the other audit-*.mjs scripts: add a mode here
# before a batch that uses it runs on edited code (the plan-auditor, 24 Sep 11:05 UK). It exists because on 24 Sep an edit made for one mode (M15, the solver
# arm) broke another (the rival arms' runFixedPath) and nothing noticed for a day: a batch only exercises its own mode.
#
#   bash research/solver/smoke.sh        (from the repository root or a snapshot of it; ~1-2 minutes)
#
set -euo pipefail
T="zz-smoke-$$"
R=research/solver/results
trap 'rm -rf "$R/$T"-*' EXIT
export PREDICTION_FILE=none PREDICTION_REASON="smoke run"
COMMON=(ONLY=20 FLOOR=0.8 CONF=0.9 SEARCH=60 LEVELS=1.2,1.1,1,0.95,0.9,0.8 MINPOTYEARS=1)
run() {
  local name="$1"; shift
  local out
  if ! out="$(env "${COMMON[@]}" "$@" 2>&1)"; then echo "SMOKE FAILED: $name"; echo "$out" | tail -20; exit 1; fi
  echo "  ok  $name"
}
run "solver only, fold, step-6 flags"   SOLVERONLY=1 LAMBDA=0.02 MIX=0 TIERS=1 RAISECAP=1.1 RAISESURV=1 FAILSHORT=1 FINALEXACT=1 node research/solver/experiment.mjs flex "$T-a" 6 30 7001 7002
run "rival arms only, fold, cap"         SOLVERONLY=0 ARMSONLY=1 ARMS= MIX=0 GUARDCAP=1.1 node research/solver/experiment.mjs flex "$T-b" 6 30 7001 7002
run "solver and every arm, mixture"      SOLVERONLY=0 LAMBDA=0.02 MIX=3 TIERS=1 node research/solver/experiment.mjs flex "$T-c" 6 30 7001 7002
run "risk above, plan at Medium, record" SOLVERONLY=1 LAMBDA=0.02 MIX=0 TIERS=1 TIERSABOVE=1 "PLANTIER=Medium Risk" RECORD=1 node research/solver/experiment.mjs flex "$T-d" 6 30 7001 7002
run "F1 bridge read"                     SOLVERONLY=1 LAMBDA=0.02 MIX=0 TIERS=1 BRIDGEREAD=1 node research/solver/experiment.mjs flex "$T-e" 6 30 7001 7002
run "S126 audit scan (no solve)"         node research/solver/audit-s126.mjs scan
run "reduceFlex over the arms' files"     node research/solver/experiment.mjs reduceFlex "$T-c"
# a mode must use the settings it was given: the ids mode once read its id list as the grid size (24 Sep)
out="$(node research/solver/audit-s126.mjs ids S126 6 20 2>&1)" || { echo "SMOKE FAILED: S126 audit, ids mode"; echo "$out" | tail -5; exit 1; }
echo "$out" | grep -q "NAMED HOUSEHOLDS, 6 points, 20 held paths" || { echo "SMOKE FAILED: the ids mode did not run at the grid and paths it was given"; echo "$out" | head -3; exit 1; }
echo "  ok  S126 audit, ids mode, at the settings it was given"
# every file a batch writes must carry the code that made it and the prediction it was launched under
node -e '
  const fs = require("fs"), p = require("path"), R = process.argv[1], T = process.argv[2];
  let n = 0;
  for (const d of fs.readdirSync(R).filter(x => x.startsWith(T))) for (const f of fs.readdirSync(p.join(R, d)).filter(x => /^S\d+\.json$/.test(x))) {
    const j = JSON.parse(fs.readFileSync(p.join(R, d, f), "utf8")); n++;
    if (!j.code || !j.code.hash) { console.log(`SMOKE FAILED: ${d}/${f} has no code stamp`); process.exit(1); }
    if (!("prediction" in j) || !j.prediction || !j.prediction.none) { console.log(`SMOKE FAILED: ${d}/${f} has no prediction stamp`); process.exit(1); }
  }
  if (n < 5) { console.log(`SMOKE FAILED: expected 5 result files, found ${n}`); process.exit(1); }
  console.log(`  ok  ${n} result files carry the code and prediction stamps`);
' "$R" "$T"
echo "SMOKE PASSED"
