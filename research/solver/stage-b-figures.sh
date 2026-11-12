#!/usr/bin/env bash
# EVERY PINNED FIGURE THAT WOULD MOVE WITH A STAGE B OPTION SWITCHED ON (D81 (D), D85, D86): a measurement, EXPLORATORY.
# Nothing is switched on by it: it is run in a scratch worktree, edits that tree's copy of the candidate, runs the tests
# and collects what fails. It refuses to run in the main checkout, and it never commits.
#
#   research/solver/stage-b-figures.sh T        tieAboveCap 1e-4 in candidate.json and in APP_CANDIDATE (item 13, D85)
#   research/solver/stage-b-figures.sh TO       T, and chooserShortlist 'order' in both (item 7 as it was read, D86)
#   research/solver/stage-b-figures.sh HEAD     no edit: the same tests on the tree as committed (to tell a failure the
#                                               option causes from one this machine causes)
#   research/solver/stage-b-figures.sh restore  the edited files back to HEAD's
#
#   OUT=<folder>    where the logs go (default /tmp/stage-b-figures); one folder a configuration
#   J=<n>           test files at a time (default 1; never more than 3 on the shared machine)
#   TESTS_EXTRA="a" test files run as well as the lists (those that reach the candidate through another script)
#   TESTS="a b"     only these test files (names as in research/tests), in place of the lists below
#   LIMIT=<secs>    a test file stopped after this long and listed as not run (default 2400: forty minutes)
#   NOPIN=1         the e3pcls pin this configuration's first pass took ($OUT/<configuration>/e3pcls-pin.json), not taken again
#
# THE EDITS (each a switch-on's own, made in this tree only):
#   1. research/solver/candidate.json gains the key or keys, after `coarse`;
#   2. src/solverSettings.js APP_CANDIDATE gains the same, in the same order (solver-app.test.mjs pins the two together);
#   3. research/solver/candidate.mjs: the earlier candidates (BEFORE_D73_OPTS, and through it PHASE4_OPTS, ASSEMBLED_OPTS and
#      FROZEN_OPTS) are candidate.json less the keys joined since, so without a change they would carry the new keys and
#      their four recorded hashes would move. A switch-on names the new keys there as D73's port named its own (D73_KEYS):
#      STAGE_B_KEYS is added and left out of BEFORE_D73_OPTS, so every earlier candidate means what it meant;
#   4. research/solver/e3pcls-pin.json: the pin's fingerprint covers candidate.json and candidate.mjs, so the edits make it
#      stale and solveCandidate refuses; the pin is taken again (solver-e3pcls.test.mjs 4 --pin) before any other test.
# THE TESTS: the fast tier (run-all.mjs --list) and every other test file that can see the candidate (the grep below), each
# file on its own in its default form (no --full, no 45-point solve), so one failure does not stop the rest. Left out by
# their recorded times (research/tests/shard-times.json, over forty minutes each): LONG below.
# WHAT IT WRITES, under $OUT/<configuration>/: <test>.log (the whole output), summary.tsv (test, exit code, seconds),
# collected.txt (for each test its exit, its failing lines and its last line), hashes.txt (the candidate's hashes as
# candidate.mjs gives them), pin.log (the e3pcls test's output).
set -u
cfg="${1:-}"
case "$cfg" in T|TO|HEAD|restore) ;; *) echo "usage: stage-b-figures.sh T|TO|HEAD|restore" >&2; exit 2;; esac
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
# the main checkout is the tree whose .git is a directory; a worktree's is a file (no path is named: hygiene.test.mjs check 1)
if [ -d "$root/.git" ]; then echo "stage-b-figures: refusing to run in the main checkout ($root): run it in a scratch worktree (git worktree add)" >&2; exit 2; fi
cd "$root" || exit 2
EDITED="research/solver/candidate.json research/solver/candidate.mjs src/solverSettings.js research/solver/e3pcls-pin.json"
LONG="library-sweep.test.mjs pr31-split.test.mjs"

git checkout -- $EDITED || exit 2
[ "$cfg" = restore ] && { git status --short; exit 0; }

OUT="${OUT:-/tmp/stage-b-figures}/$cfg"; J="${J:-1}"; LIMIT="${LIMIT:-2400}"
[ "$J" -le 3 ] || { echo "stage-b-figures: at most three test files at a time" >&2; exit 2; }
mkdir -p "$OUT"

if [ "$cfg" != HEAD ]; then
  CFG="$cfg" node --input-type=module -e '
    import { readFileSync, writeFileSync } from "node:fs";
    const order = process.env.CFG === "TO";
    const edit = (f, from, to) => { const s = readFileSync(f, "utf8"); if (s.split(from).length !== 2) throw new Error(`${f}: the text to edit is not there exactly once: ${from}`); writeFileSync(f, s.replace(from, to)); };
    // 1. candidate.json
    edit("research/solver/candidate.json", `"climb": 3 }\n}`, `"climb": 3 },\n  "tieAboveCap": 0.0001${order ? `,\n  "chooserShortlist": "order"` : ""}\n}`);
    // 2. APP_CANDIDATE
    edit("src/solverSettings.js", `sweepCashIsaTo: \x27isa\x27, coarse: APP_COARSE\n});`, `sweepCashIsaTo: \x27isa\x27, coarse: APP_COARSE,\n  tieAboveCap: 1e-4${order ? `, chooserShortlist: \x27order\x27` : ""}\n});`);
    // 3. the earlier candidates leave the new keys out
    edit("research/solver/candidate.mjs", `filter(([k]) => !D73_KEYS.includes(k)).map(`, `filter(([k]) => !D73_KEYS.includes(k) && !STAGE_B_KEYS.includes(k)).map(`);
    edit("research/solver/candidate.mjs", `export const PRE_D73_LATTICE =`, `export const STAGE_B_KEYS = Object.freeze([\x27tieAboveCap\x27, \x27chooserShortlist\x27]);\nexport const PRE_D73_LATTICE =`);
  ' || { echo "stage-b-figures: the edits did not apply" >&2; exit 2; }
fi
node --input-type=module -e '
  const C = await import(process.cwd() + "/research/solver/candidate.mjs"), S = await import(process.cwd() + "/src/solverSettings.js");
  console.log(`candidate ${C.CANDIDATE_HASH}; the app copy ${C.hashOf({ ...S.APP_CANDIDATE })}; before D73 ${C.BEFORE_D73_HASH}; Phase 4 ${C.PHASE4_HASH}; assembled ${C.ASSEMBLED_HASH}; frozen ${C.FROZEN_HASH}`);
  console.log(`tieAboveCap ${JSON.stringify(C.CANDIDATE_OPTS.tieAboveCap)} / ${JSON.stringify(S.APP_CANDIDATE.tieAboveCap)}; chooserShortlist ${JSON.stringify(C.CANDIDATE_OPTS.chooserShortlist)} / ${JSON.stringify(S.APP_CANDIDATE.chooserShortlist)}`);
' | tee "$OUT/hashes.txt" || exit 2
git diff --stat -- $EDITED | tee -a "$OUT/hashes.txt"

# 4. the e3pcls pin on the edited candidate (not under HEAD, whose pin is the committed one)
if [ "$cfg" != HEAD ]; then
  if [ -n "${NOPIN:-}" ] && [ -f "$OUT/e3pcls-pin.json" ]; then cat "$OUT/e3pcls-pin.json" > research/solver/e3pcls-pin.json; else
    echo "taking the e3pcls pin again (solver-e3pcls.test.mjs 4 --pin) ..."
    node research/tests/solver-e3pcls.test.mjs 4 --pin > "$OUT/pin.log" 2>&1; echo "  exit $? : $(tail -n 1 "$OUT/pin.log" | cut -c1-200)"
    cat research/solver/e3pcls-pin.json > "$OUT/e3pcls-pin.json"
  fi
  node research/solver/e3pcls-pin.mjs 2>&1 | tail -n 2 | tee -a "$OUT/pin.log"
fi

if [ -n "${TESTS:-}" ]; then
  list="$TESTS"; touch "$OUT/summary.tsv"
  for f in $TESTS; do grep -v "^$f	" "$OUT/summary.tsv" > "$OUT/summary.tmp"; cat "$OUT/summary.tmp" > "$OUT/summary.tsv"; done; rm -f "$OUT/summary.tmp"
else
  fast="$(node research/tests/run-all.mjs --list)"
  cand="$(grep -l "CANDIDATE_OPTS\|APP_CANDIDATE\|solveCandidate\|solveForApp\|candidate.mjs\|solverSettings" research/tests/*.test.mjs | xargs -n 1 basename)"
  list="$(printf '%s\n%s\n' "$fast" "$cand" | awk '!seen[$0]++')"
  for l in $LONG; do list="$(printf '%s\n' "$list" | grep -vx "$l")"; done
  [ -n "${TESTS_EXTRA:-}" ] && list="$(printf '%s\n%s\n' "$list" "$(printf '%s\n' $TESTS_EXTRA)" | awk '!seen[$0]++')"
  : > "$OUT/summary.tsv"
fi

run_one() {
  local f="$1" t0 code; t0=$(date +%s)
  timeout "$LIMIT" node "research/tests/$f" > "$OUT/$f.log" 2>&1; code=$?
  printf '%s\t%s\t%s\n' "$f" "$code" "$(( $(date +%s) - t0 ))" >> "$OUT/summary.tsv"
  echo "$( [ $code -eq 0 ] && echo 'ok  ' || { [ $code -eq 124 ] && echo 'LONG' || echo 'FAIL'; } ) $f ($(( $(date +%s) - t0 )) s)"
}
export -f run_one; export OUT LIMIT
printf '%s\n' $list | xargs -P "$J" -I{} bash -c 'run_one {}'

# the collection: each test's exit, its failing lines and its last line
{
  echo "stage-b-figures $cfg at $(git rev-parse --short=8 HEAD), $(date -u '+%d %b %H:%M UTC'); $(head -n 1 "$OUT/hashes.txt")"
  sort -u -k1,1 "$OUT/summary.tsv" | while IFS=$'\t' read -r f code secs; do
    echo "== $f: exit $code, $secs s$( [ "$code" = 124 ] && echo ' (stopped at the limit: not run)')"
    [ "$code" = 0 ] || grep -nE 'FAIL|WRONG|not ok|Error|refus|stale|threw' "$OUT/$f.log" | cut -c1-600 | head -n 60
    echo "   last: $(grep -v '^[[:space:]]*$' "$OUT/$f.log" | tail -n 1 | cut -c1-400)"
  done
} > "$OUT/collected.txt"
echo "passed $(awk -F'\t' '$2==0' "$OUT/summary.tsv" | wc -l), failed $(awk -F'\t' '$2!=0 && $2!=124' "$OUT/summary.tsv" | wc -l), stopped at the limit $(awk -F'\t' '$2==124' "$OUT/summary.tsv" | wc -l): $OUT/collected.txt"
echo "the tree is left edited for $cfg; research/solver/stage-b-figures.sh restore puts it back (the tests' own results files with git checkout)"
