#!/usr/bin/env bash
#
# EVERY BROWSER HARNESS, IN ONE COMMAND.
#
# There was no runner: each harness carried its own "run me like this" comment and was started by hand,
# which meant the full set was only ever run when somebody remembered all of them. This builds the site,
# serves it once, runs each harness against that one server, and prints a table.
#
# The build is deliberately part of it. Every harness tests the BUILT site, not the dev server: the two
# differ in ways that have bitten before (the dev server used to lean on a Tailwind CDN, and the workers
# are bundled differently), so testing dev and shipping prod would be testing the wrong thing.
#
# REQUIRED harnesses gate the exit code. OPTIONAL ones are reported but do not fail the run: they cover
# the Inheritance tab, which sits behind SHOW_INHERITANCE=false and so cannot pass today. Reporting them
# rather than deleting them keeps the fact visible.
#
#   Usage: research/ui-harnesses/run-all.sh [port] [--solver]
#
# --solver (the switch-on gate; PART-C-PLAN.md, D41: ALL REQUIRED GREEN "with the switch off and, from Phase 8 on, with
# it on as well"; the launch plan's F7 and B1): the site is built with the solver's switch on (vite.config.js
# solver-preview: SOLVER_PREVIEW=1, the harnesses' light settings) into dist-solver, served, and every REQUIRED harness
# runs against it, but those in SWITCH_OFF_ONLY, each named with what covers it with the switch on. The engine suites
# do not read the switch and run in the default mode only. B1's gate is both modes green.
#
set -uo pipefail
PORT=4173; MODE=off
for a in "$@"; do case "$a" in --solver) MODE=solver ;; *) PORT="$a" ;; esac; done
cd "$(dirname "$0")/../.."
# the light settings a switch-on build solves at (solver-config-ui.cjs's LIGHT)
LIGHT='{"points":4,"research":{"adaptiveLattice":{"na":48,"nb":9,"nz":32,"foot":true,"stepAll":true}}}'
# harnesses that test what the switch replaces, each with what covers it with the switch on (name:what covers it)
SWITCH_OFF_ONLY=("solver-config:itself, against the switch-on preview it builds"
  "solver-strategy:itself, against the switch-on preview it builds"
  "solver-isolation:itself, against the switch-on build it serves without headers, as GitHub Pages does"
  "solver-projection:itself, against the switch-on preview it builds"
  "tournament:solver-strategy (for a single household the Strategy tab is the solved plan under the switch; a couple's keeps the tournament, which solver-strategy checks)"
  "tradeoffs:solver-config (for a single household the policy search and its trade-offs are hidden under the switch; the solver's aims replace them)"
  "priorities:solver-config (for a single household the priority list is hidden under the switch; the solver's aims replace it)")

REQUIRED=(restyle-regression phone phone-perf desktop-reach numbers load-perf sandbox-step simple-extras mc-reveal crossover production-build tradeoffs priorities simple-closecall tournament solver-progress solver-config solver-strategy solver-isolation solver-projection)
# closecall-ui.cjs is not in either list: it takes a plans.json written by hand, not a port, and
# exists to investigate one household rather than to guard a behaviour.
OPTIONAL=(beneficiary-inputs estate-assets estate-deck estate-optimiser inheritance)

# batches pause for the gate (the launch plan, section 5): no new unit starts while the pause file is there
# (research/solver/run-unit.sh), and the gate waits for the units in flight, so a timing harness never runs beside one,
# nor do the engine suites' speed checks: the file stays until the gate exits
# (in the main working tree, where the batches' results are, whichever worktree the gate runs in)
MAIN="$(cd "$(git rev-parse --git-common-dir 2>/dev/null || echo .git)/.." 2>/dev/null && pwd || pwd)"
PAUSE="$MAIN/research/solver/results/.pause"; RUNNING="$MAIN/research/solver/results/.running"
mkdir -p "$MAIN/research/solver/results" && touch "$PAUSE"
trap 'rm -f "$PAUSE"' EXIT
for m in "$RUNNING"/*; do [ -e "$m" ] && ! kill -0 "${m##*/}" 2>/dev/null && rm -f "$m"; done
if [ -n "$(ls -A "$RUNNING" 2>/dev/null)" ]; then
  echo "== waiting for the batch units in flight ($(ls "$RUNNING" | wc -l)) =="
  while [ -n "$(ls -A "$RUNNING" 2>/dev/null)" ]; do sleep 30; for m in "$RUNNING"/*; do [ -e "$m" ] && ! kill -0 "${m##*/}" 2>/dev/null && rm -f "$m"; done; done
fi

OUT=dist
if [ "$MODE" = solver ]; then
  OUT=dist-solver
  echo "== build, the solver's switch on (SOLVER_PREVIEW=1, into $OUT) =="
  SOLVER_PREVIEW=1 SOLVER_PREVIEW_OPTS="$LIGHT" npx vite build --outDir "$OUT" --emptyOutDir >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; exit 1; }
else
  echo "== build =="
  npm run build >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; exit 1; }
fi
echo "   ok"

echo "== serve on :$PORT =="
# A server already on the port would answer for this build: a server npx started is a grandchild, which outlived its
# script's kill, and the next run then tested the last run's build (1 Nov: the switch-off harnesses ran on the switch-on
# build). So the port must be free, vite runs as this script's own child, and the page it serves must be this build's.
curl -s -o /dev/null "http://localhost:$PORT/" && { echo "PORT $PORT IN USE: another server answers there; stop it first"; exit 1; }
node node_modules/vite/bin/vite.js preview --outDir "$OUT" --port "$PORT" --strictPort >/tmp/run-all-preview.log 2>&1 &
PREVIEW=$!
# `kill 0` would take out this script too; target the one child, and tolerate it already being gone.
trap 'kill "$PREVIEW" 2>/dev/null || true; wait "$PREVIEW" 2>/dev/null; rm -f "$PAUSE"' EXIT
for _ in $(seq 1 40); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done
curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "PREVIEW FAILED"; tail -20 /tmp/run-all-preview.log; exit 1; }
curl -sf "http://localhost:$PORT/" | cmp -s - "$OUT/index.html" || { echo "THE SERVER ON :$PORT IS NOT SERVING $OUT"; exit 1; }
echo "   ok"

declare -a NAMES=() CODES=() KINDS=() COVER=()
run_one() {   # name kind
  local f="research/ui-harnesses/$1-ui.cjs"
  if [ ! -f "$f" ]; then NAMES+=("$1"); CODES+=("skip"); KINDS+=("$2"); return; fi
  local out; out=$(node "$f" "$PORT" 2>&1); local code=$?
  NAMES+=("$1"); CODES+=("$code"); KINDS+=("$2")
  # every failing line, then the tail: a harness with twelve failures used to show the last three
  if [ "$code" -ne 0 ]; then echo "--- $1 ---"; echo "$out" | grep -E '^\s*FAIL|^[A-Za-z].*@' | head -40; echo "   ..."; echo "$out" | tail -6; fi
}

offonly() { for e in "${SWITCH_OFF_ONLY[@]}"; do [ "${e%%:*}" = "$1" ] && { echo "${e#*:}"; return 0; }; done; return 1; }
echo "== harnesses${MODE:+ (switch $MODE)} =="
for n in "${REQUIRED[@]}"; do
  if [ "$MODE" = solver ] && cover="$(offonly "$n")"; then NAMES+=("$n"); CODES+=("offonly"); KINDS+=("required"); COVER+=("$cover"); continue; fi
  run_one "$n" required; COVER+=("")
done
# the optional harnesses cover a tab that is switched off in the source; running them is ten minutes of
# known red, so they run only once the switch is on
if grep -q '^const SHOW_INHERITANCE = true' src/App.jsx; then
  for n in "${OPTIONAL[@]}"; do run_one "$n" optional; done
else
  for n in "${OPTIONAL[@]}"; do NAMES+=("$n"); CODES+=("off"); KINDS+=("optional"); done
fi

echo
printf '%-22s %-9s %s\n' HARNESS KIND RESULT
FAILED=0
for i in "${!NAMES[@]}"; do
  c="${CODES[$i]}"
  if   [ "$c" = "skip" ]; then r="NOT PRESENT"; [ "${KINDS[$i]}" = required ] && FAILED=1
  elif [ "$c" = "offonly" ]; then r="switch-off only: covered by ${COVER[$i]}"
  elif [ "$c" = "off" ];  then r="not run: SHOW_INHERITANCE is off"
  elif [ "$c" -eq 0 ];   then r="pass"
  else r="FAIL ($c)"; [ "${KINDS[$i]}" = required ] && FAILED=1
  fi
  printf '%-22s %-9s %s\n' "${NAMES[$i]}" "${KINDS[$i]}" "$r"
done

# the pause holds through the engine suites too: they carry speed checks (solver-fast.test.mjs C1 and C2,
# solver-model.test.mjs G1) that time the thread's CPU, which a neighbour's cache and memory traffic still slows; on
# 2 Nov, with L4's four units beside them, C2 read up to about 930 ns against its 1,000 and failed once in the gate on
# 28ec7a9 (138 of 139 files passed). The batches go on when the gate exits (the trap above removes the file).
echo
echo "== engine suites =="
if [ "$MODE" = solver ]; then
  echo "   not run with the switch on: they do not read it (the default mode runs them)"
else
npm run test:engine >/tmp/run-all-engine.log 2>&1 \
  && echo "   $(grep -c '^PASS' /tmp/run-all-engine.log) assertions passed" \
  || { echo "   ENGINE FAILED"; grep '^FAIL' /tmp/run-all-engine.log | head -10; FAILED=1; }
fi

[ "$FAILED" -eq 0 ] && echo && echo "ALL REQUIRED GREEN" || { echo; echo "SOMETHING REQUIRED FAILED"; }
exit "$FAILED"
