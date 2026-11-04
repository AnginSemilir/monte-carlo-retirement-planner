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
#   Usage: research/ui-harnesses/run-all.sh [port] [--solver | --both] [--engine]
#
# --solver (the switch-on gate; PART-C-PLAN.md, D41: ALL REQUIRED GREEN "with the switch off and, from Phase 8 on, with
# it on as well"; the launch plan's F7 and B1): the site is built with the solver's switch on (vite.config.js
# solver-preview: SOLVER_PREVIEW=1, the harnesses' light settings) into dist-solver, served, and every REQUIRED harness
# runs against it, but those in SWITCH_OFF_ONLY, each named with what covers it with the switch on. The engine suites
# do not read the switch. B1's gate is both modes green; --both runs the two, one after the other, under one batch pause
# (two runs leave a gap between them in which a waiting unit starts, and the second run then waits for it).
#
# The engine suites (research/tests, `npm run test:engine`) are not run here unless --engine asks (2 Nov, D55): CI runs
# every one of them on each push (Verify's fast tier, Full's two shards), and B1's gate reads them there, green on the
# commit it merges. Here they took about four and a half hours of the gate's five, held the batches paused all that time,
# and repeated what CI had already run on the same commit; their speed checks beside a batch failed the gate on 28ec7a9.
#
set -uo pipefail
PORT=4173; MODE=off; BOTH=0; ENGINE=0
for a in "$@"; do case "$a" in --solver) MODE=solver ;; --both) BOTH=1 ;; --engine) ENGINE=1 ;; *) PORT="$a" ;; esac; done
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$0")/../.."
# the light settings a switch-on build solves at (solver-config-ui.cjs's LIGHT)
LIGHT='{"points":4,"research":{"adaptiveLattice":{"na":48,"nb":9,"nz":32,"foot":true,"stepAll":true}}}'
# harnesses that test what the switch replaces, each with what covers it with the switch on (name:what covers it)
# step U (research/reviews/2026-11-03/LAYOUT.md section 11.2): rp_planner is 'classic' unless set, so with the switch on every
# harness that does not opt in runs against the classic planner, the app with the switch off; the solver's harnesses opt in to
# the new planner on the previews they build, and tournament, tradeoffs and priorities run in both modes again
SWITCH_OFF_ONLY=("solver-config:itself, against the switch-on preview it builds (opted in to the new planner)"
  "solver-strategy:itself, against the switch-on preview it builds (opted in to the new planner)"
  "solver-isolation:itself, against the switch-on build it serves without headers, as GitHub Pages does (opted in)"
  "solver-projection:itself, against the switch-on preview it builds (opted in to the new planner)"
  "solver-planner:itself, against the switch-on preview it builds (opted in to the new planner)")

REQUIRED=(restyle-regression phone phone-perf desktop-reach numbers load-perf sandbox-step simple-extras mc-reveal crossover production-build tradeoffs priorities simple-closecall tournament solver-progress solver-config solver-strategy solver-isolation solver-projection solver-planner)
# closecall-ui.cjs is not in either list: it takes a plans.json written by hand, not a port, and
# exists to investigate one household rather than to guard a behaviour.
OPTIONAL=(beneficiary-inputs estate-assets estate-deck estate-optimiser inheritance)

# batches pause for the gate (the launch plan, section 5): no new unit starts while the pause file is there
# (research/solver/run-unit.sh), and the gate waits for the units in flight, so a timing harness never runs beside one,
# nor do the engine suites' speed checks under --engine: the file stays until the gate exits
# (in the main working tree, where the batches' results are, whichever worktree the gate runs in). A pause already there
# (--both's, or one set by hand to hold the batches) is left for whoever set it, and said so.
MAIN="$(cd "$(git rev-parse --git-common-dir 2>/dev/null || echo .git)/.." 2>/dev/null && pwd || pwd)"
PAUSE="$MAIN/research/solver/results/.pause"; RUNNING="$MAIN/research/solver/results/.running"
mkdir -p "$MAIN/research/solver/results"
OWNPAUSE=0
if [ -e "$PAUSE" ]; then echo "== the batches' pause was already set: left in place when this run exits =="; else touch "$PAUSE"; OWNPAUSE=1; fi
unpause() { [ "$OWNPAUSE" = 1 ] && rm -f "$PAUSE"; return 0; }
trap unpause EXIT
if [ "$BOTH" = 1 ]; then
  ENG=(); [ "$ENGINE" = 1 ] && ENG=(--engine)
  bash "$SELF" "$PORT" "${ENG[@]}"; OFFCODE=$?
  echo; bash "$SELF" "$PORT" --solver; ONCODE=$?
  word() { [ "$1" -eq 0 ] && echo green || echo FAILED; }
  echo; echo "== both modes: the switch off $(word "$OFFCODE"), the switch on $(word "$ONCODE") =="
  if [ "$OFFCODE" -eq 0 ] && [ "$ONCODE" -eq 0 ]; then echo "ALL REQUIRED GREEN IN BOTH MODES"; exit 0; fi
  echo "SOMETHING REQUIRED FAILED"; exit 1
fi
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
trap 'kill "$PREVIEW" 2>/dev/null || true; wait "$PREVIEW" 2>/dev/null; unpause' EXIT
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

# the engine suites only under --engine (D55, the header). Under it the pause holds through them: they carry speed checks
# (solver-fast.test.mjs C1 and C2, solver-model.test.mjs G1) that time the thread's CPU, which a neighbour's cache and
# memory traffic still slows (2 Nov: C2 failed once in the gate on 28ec7a9 beside L4's four units).
echo
echo "== engine suites =="
if [ "$MODE" = solver ]; then
  echo "   not run with the switch on: they do not read it"
elif [ "$ENGINE" = 1 ]; then
npm run test:engine >/tmp/run-all-engine.log 2>&1 \
  && echo "   $(grep -c '^PASS' /tmp/run-all-engine.log) assertions passed" \
  || { echo "   ENGINE FAILED"; grep '^FAIL' /tmp/run-all-engine.log | head -10; FAILED=1; }
else
  echo "   not run here: CI runs every one of them on each push (Verify, Full); B1's gate reads them there, green on the"
  echo "   commit it merges (--engine runs them here too)"
fi

[ "$FAILED" -eq 0 ] && echo && echo "ALL REQUIRED GREEN" || { echo; echo "SOMETHING REQUIRED FAILED"; }
exit "$FAILED"
