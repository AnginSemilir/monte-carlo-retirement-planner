#!/bin/bash
# D138, THE ENGINE AND THE FORWARD RUN IN STEP UNDER THE SAVINGS SPLIT (EXPLORATORY; the full tier on D138's build, the
# reviewer on its change of default finding 1). Two lockstep tests build the move they hand the engine by hand from the
# solver's action, and since D138 a working saver's move carries the split's `save`, which the engine's own policy hands it
# (src/solver/bridge.js withTable) and those builders left out, so the engine ran the plan's own saving where the forward run
# ran the move's. Printed here, each on this tree:
#   1. V2's state check in full (state-check-full.test.mjs; state-check.test.mjs is protected) as it stands: S224 parts;
#   2. the same test with its builder handing the engine `windfall` and `save` as bridge.js does (a copy made here, in a
#      folder of its own beside research/tests so its imports resolve alike, and removed after; the protected file is not
#      touched): every check;
#   3. the gaps sweep (gaps-sweep.test.mjs, not protected) with its builder so fixed, all 60 cases.
#   bash research/solver/d138-lockstep.sh > research/solver/results-d138-lockstep.txt
cd "$(dirname "$0")/../.." || exit 2
echo "D138: the engine and the forward run in step under the savings split (EXPLORATORY; d138-lockstep.sh), code $(node -e 'import("./research/solver/code-id.mjs").then(m => console.log(m.codeId().hash))'), $(TZ=Europe/London date '+%-d %b %H:%M UK')"
echo
echo "-- 1. node research/tests/state-check-full.test.mjs (state-check.test.mjs --full, as it stands)"
node research/tests/state-check-full.test.mjs 2>&1 | grep -E "^(PASS|FAIL)|ALL PASS|FAILED"
echo
echo "-- 2. the same, its move builder handing the engine windfall and save as bridge.js does (a copy, removed after)"
d=research/.d138-lockstep; rm -rf "$d"; mkdir -p "$d"
node -e '
const fs = require("fs"); let s = fs.readFileSync("research/tests/state-check.test.mjs", "utf8");
const old = "...(a.sweepIsa ? { sweepIsa: true } : {}), tierPen: ca.tierPen || 0,";
if (s.split(old).length !== 2) { console.error("the builder is not as expected"); process.exit(2); }
s = s.replace(old, "...(a.sweepIsa ? { sweepIsa: true } : {}), ...(a.windfall ? { windfall: a.windfall } : {}), ...(a.save ? { save: a.save } : {}), tierPen: ca.tierPen || 0,");
fs.writeFileSync(process.argv[1], s);' "$d/state-check-save.mjs" || exit 2
node "$d/state-check-save.mjs" --full 2>&1 | grep -E "^(PASS|FAIL)|ALL PASS|FAILED"
rm -rf "$d"
echo
echo "-- 3. node research/tests/gaps-sweep.test.mjs (its builder handing the engine windfall and save)"
node research/tests/gaps-sweep.test.mjs 2>&1 | grep -E "^(PASS|FAIL)|SWEEP"
