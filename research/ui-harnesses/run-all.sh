#!/usr/bin/env bash
#
# EVERY BROWSER HARNESS, IN ONE COMMAND.
#
# There was no runner: each harness carried its own "run me like this" comment and was started by hand,
# which meant the full set was only ever run when somebody remembered all of them. This builds the site,
# serves it, runs each harness against that server, and prints a table.
#
# The build is deliberately part of it. Every harness tests the BUILT site, not the dev server: the two
# differ in ways that have bitten before (the dev server used to lean on a Tailwind CDN, and the workers
# are bundled differently), so testing dev and shipping prod would be testing the wrong thing.
#
#   Usage: research/ui-harnesses/run-all.sh [port] [--engine]
#
# THE GATE IS ONE RUN IN TWO PASSES (D155, 28 Nov 2026: the new planner is the app's only planner, and B1's gate runs it
# alone, amending D19 and B1 in D51; the classic planner's mode and the harnesses that tested only it retired with it):
#   1. the site exactly as it ships (`npm run build`), served: the harnesses of what that build carries and the light
#      settings would hide (SHIPPED below): its stylesheet, its first load and its ceiling, its solve's worker and plumbing;
#   2. the same source at the harnesses' light settings (vite.config.js solver-harness: SOLVER_HARNESS=1), served: the
#      planner's harnesses, and the checks the classic mode made of features the planner keeps, ported onto it (the look in
#      every theme, the number format, the phone's and the desktop's targets, the phone's solve) (LIGHT below).
# Every harness is REQUIRED. Each is listed with the pass that runs it. --new runs the second pass alone and --shipped the
# first, for a look in between; neither is the gate, and a run of either says so.
#
# The engine suites (research/tests, `npm run test:engine`) are not run here unless --engine asks (2 Nov, D55): CI runs
# every one of them on each push (Verify's fast tier, Full's two shards), and B1's gate reads them there, green on the
# commit it merges.
#
set -uo pipefail
PORT=4173; ONLY=""; ENGINE=0
for a in "$@"; do case "$a" in
  --new) ONLY=light ;; --shipped) ONLY=shipped ;; --engine) ENGINE=1 ;;
  --both) echo "--both retired with the classic planner (D155): the gate is one run in two passes, the default" ;;
  --solver) echo "--solver retired with Phase 12"; exit 2 ;;
  *) PORT="$a" ;;
esac; done
cd "$(dirname "$0")/../.."
# the light settings the second pass's build solves at (solver-config-ui.cjs's LIGHT)
LIGHT='{"points":4,"research":{"adaptiveLattice":{"na":48,"nb":9,"nz":32,"foot":true,"stepAll":true}}}'
# each harness and what it tests (name:what), in the pass that runs it
SHIPPED=("production-build:the site as it ships, its stylesheet, its four places and its solve's worker"
  "load-perf:the first load and its ceiling on the site's own build"
  "solver-progress:the solve's plumbing in the site's own build")
LIGHTPASS=("restyle-regression:every place in each theme, at a desktop's and a phone's width"
  "numbers:the number format and the State Pension's shortcut"
  "phone:the planner on emulated phones: targets, inputs, sections, a glossary term"
  "desktop-reach:the planner on a desktop: targets, glossary terms, the gain prompt"
  "phone-perf:the solve on a throttled phone, the main thread free"
  "solver-config:the levers and limits" "solver-strategy:Your plan"
  "solver-isolation:the isolation, served without headers as GitHub Pages does"
  "solver-projection:the outlook, the dials and Details" "solver-planner:the planner")

# batches pause for the gate (the launch plan, section 5): no new unit starts while the pause file is there
# (research/solver/run-unit.sh), and the gate waits for the units in flight, so a timing harness never runs beside one,
# nor do the engine suites' speed checks under --engine: the file stays until the gate exits
# (in the main working tree, where the batches' results are, whichever worktree the gate runs in). A pause already there
# (one set by hand to hold the batches) is left for whoever set it, and said so.
MAIN="$(cd "$(git rev-parse --git-common-dir 2>/dev/null || echo .git)/.." 2>/dev/null && pwd || pwd)"
PAUSE="$MAIN/research/solver/results/.pause"; RUNNING="$MAIN/research/solver/results/.running"
mkdir -p "$MAIN/research/solver/results"
OWNPAUSE=0
if [ -e "$PAUSE" ]; then echo "== the batches' pause was already set: left in place when this run exits =="; else touch "$PAUSE"; OWNPAUSE=1; fi
PREVIEW=""
cleanup() { [ -n "$PREVIEW" ] && { kill "$PREVIEW" 2>/dev/null || true; wait "$PREVIEW" 2>/dev/null; }; [ "$OWNPAUSE" = 1 ] && rm -f "$PAUSE"; return 0; }
trap cleanup EXIT
# the code this gate runs on (research/solver/launch-stamp.mjs), for the readiness checklist (launch-ready.mjs), which counts a gate
# only on the release's own code
echo "the code: $(node research/solver/launch-stamp.mjs); $([ -n "$ONLY" ] && echo "the $ONLY pass alone, not the gate" || echo 'the gate, both passes')"
for m in "$RUNNING"/*; do [ -e "$m" ] && ! kill -0 "${m##*/}" 2>/dev/null && rm -f "$m"; done
if [ -n "$(ls -A "$RUNNING" 2>/dev/null)" ]; then
  echo "== waiting for the batch units in flight ($(ls "$RUNNING" | wc -l)) =="
  while [ -n "$(ls -A "$RUNNING" 2>/dev/null)" ]; do sleep 30; for m in "$RUNNING"/*; do [ -e "$m" ] && ! kill -0 "${m##*/}" 2>/dev/null && rm -f "$m"; done; done
fi

declare -a NAMES=() CODES=() WHAT=() PASSOF=()
FAILED=0
run_one() {   # name what pass: the harness against the pass's server
  local f="research/ui-harnesses/$1-ui.cjs" n="$1"
  NAMES+=("$n"); WHAT+=("$2"); PASSOF+=("$3")
  if [ ! -f "$f" ]; then CODES+=("skip"); return; fi
  local out; out=$(node "$f" "$PORT" 2>&1); local code=$?
  CODES+=("$code")
  # every failing line, then the tail: a harness with twelve failures used to show the last three
  if [ "$code" -ne 0 ]; then echo "--- $n ---"; echo "$out" | grep -E '^\s*FAIL|^[A-Za-z].*@' | head -40; echo "   ..."; echo "$out" | tail -6; fi
}
# one pass: build, serve, run its harnesses, stop the server
pass() {   # shipped | light
  local which="$1" out
  if [ "$which" = light ]; then
    out=dist-new
    echo "== the light pass: build, the harnesses' light settings (SOLVER_HARNESS=1, into $out) =="
    SOLVER_HARNESS=1 SOLVER_HARNESS_OPTS="$LIGHT" npx vite build --outDir "$out" --emptyOutDir >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; FAILED=1; return; }
  else
    out=dist
    echo "== the shipped pass: build, the site as it ships =="
    env -u SOLVER_HARNESS -u SOLVER_HARNESS_OPTS -u PLANNER_PLANT npm run build >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; FAILED=1; return; }
  fi
  echo "   ok"
  echo "== serve on :$PORT =="
  # A server already on the port would answer for this build: a server npx started is a grandchild, which outlived its
  # script's kill, and the next run then tested the last run's build (1 Nov). So the port must be free, vite runs as this
  # script's own child, and the page it serves must be this build's.
  curl -s -o /dev/null "http://localhost:$PORT/" && { echo "PORT $PORT IN USE: another server answers there; stop it first"; FAILED=1; return; }
  node node_modules/vite/bin/vite.js preview --outDir "$out" --port "$PORT" --strictPort >/tmp/run-all-preview.log 2>&1 &
  PREVIEW=$!
  for _ in $(seq 1 40); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done
  curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "PREVIEW FAILED"; tail -20 /tmp/run-all-preview.log; FAILED=1; return; }
  curl -sf "http://localhost:$PORT/" | cmp -s - "$out/index.html" || { echo "THE SERVER ON :$PORT IS NOT SERVING $out"; FAILED=1; return; }
  echo "   ok"
  echo "== harnesses (the $which pass) =="
  local -n L=$([ "$which" = light ] && echo LIGHTPASS || echo SHIPPED)
  for e in "${L[@]}"; do run_one "${e%%:*}" "${e#*:}" "$which"; done
  kill "$PREVIEW" 2>/dev/null || true; wait "$PREVIEW" 2>/dev/null; PREVIEW=""
  # the port free again before the next pass serves on it
  for _ in $(seq 1 20); do curl -s -o /dev/null "http://localhost:$PORT/" || break; sleep 1; done
}
[ "$ONLY" != light ] && pass shipped
[ "$ONLY" != shipped ] && pass light

echo
printf '%-22s %-9s %-8s %s\n' HARNESS KIND PASS RESULT
for i in "${!NAMES[@]}"; do
  c="${CODES[$i]}"
  if   [ "$c" = "skip" ]; then r="NOT PRESENT"; FAILED=1
  elif [ "$c" -eq 0 ];   then r="pass"
  else r="FAIL ($c)"; FAILED=1
  fi
  printf '%-22s %-9s %-8s %s\n' "${NAMES[$i]}" required "${PASSOF[$i]}" "$r"
done
# a pass left out (--new, --shipped) is listed, so a partial run never reads as the gate
if [ -n "$ONLY" ]; then
  other=$([ "$ONLY" = light ] && echo SHIPPED || echo LIGHTPASS)
  declare -n O=$other
  for e in "${O[@]}"; do printf '%-22s %-9s %-8s %s\n' "${e%%:*}" required "-" "not run: the other pass"; done
fi

# the engine suites only under --engine (D55, the header). Under it the pause holds through them: they carry speed checks
# (solver-fast.test.mjs C1 and C2, solver-model.test.mjs G1) that time the thread's CPU, which a neighbour's cache and
# memory traffic still slows (2 Nov: C2 failed once in the gate on 28ec7a9 beside L4's four units).
echo
echo "== engine suites =="
if [ "$ENGINE" = 1 ]; then
npm run test:engine >/tmp/run-all-engine.log 2>&1 \
  && echo "   $(grep -c '^PASS' /tmp/run-all-engine.log) assertions passed" \
  || { echo "   ENGINE FAILED"; grep '^FAIL' /tmp/run-all-engine.log | head -10; FAILED=1; }
else
  echo "   not run here: CI runs every one of them on each push (Verify, Full); B1's gate reads them there, green on the"
  echo "   commit it merges (--engine runs them here too)"
fi

if [ "$FAILED" -ne 0 ]; then echo; echo "SOMETHING REQUIRED FAILED"; exit 1; fi
if [ -n "$ONLY" ]; then echo; echo "the $ONLY pass green: not the gate, which is both passes"; exit 0; fi
echo; echo "ALL REQUIRED GREEN"
exit 0
