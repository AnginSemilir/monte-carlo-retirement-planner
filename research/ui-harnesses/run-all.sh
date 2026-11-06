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
#   Usage: research/ui-harnesses/run-all.sh [port] [--new | --both] [--engine]
#
# THE GATE'S TWO MODES ARE THE OPT-IN'S TWO STATES (Phase 12; the launch plan's B6 and Phase 12 item 3; research/solver/
# PHASE-12.md). Since Phase 12 the solver's switch and B6's beta are on in the source, so there is no switch-off build any
# more: every visitor sees the classic planner (rp_planner 'classic' unless set, the app with the switch off bit for bit) until
# they opt in to the new planner. B1's gate is both states green, each harness run in the state it tests:
#   classic (the default): the site exactly as it ships (`npm run build`), served; the harnesses of the classic planner and of
#     what every visitor loads (CLASSIC below), phone-perf's classic sections (PHONE_PERF_ONLY=classic), and load-perf, whose
#     one run measures the classic first load and the opted-in one on the site's own build;
#   new (--new): the same source at the harnesses' light settings (vite.config.js solver-harness: SOLVER_HARNESS=1), served;
#     the new planner's harnesses (NEW below), each opting in (rp_planner 'new') on the build it makes, and phone-perf's section
#     5, the new planner on a throttled phone (PHONE_PERF_ONLY=planner), against the served build.
# A harness not run in a mode is listed with the mode that runs it. --both runs the two, one after the other, under one batch
# pause (two runs leave a gap between them in which a waiting unit starts, and the second run then waits for it).
#
# The engine suites (research/tests, `npm run test:engine`) are not run here unless --engine asks (2 Nov, D55): CI runs
# every one of them on each push (Verify's fast tier, Full's two shards), and B1's gate reads them there, green on the
# commit it merges. Here they took about four and a half hours of the gate's five, held the batches paused all that time,
# and repeated what CI had already run on the same commit; their speed checks beside a batch failed the gate on 28ec7a9.
#
set -uo pipefail
PORT=4173; MODE=classic; BOTH=0; ENGINE=0
for a in "$@"; do case "$a" in --new) MODE=new ;; --both) BOTH=1 ;; --engine) ENGINE=1 ;; --solver) echo "--solver retired with Phase 12: the modes are classic (the default) and --new"; exit 2 ;; *) PORT="$a" ;; esac; done
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$0")/../.."
# the light settings the new mode's build solves at (solver-config-ui.cjs's LIGHT)
LIGHT='{"points":4,"research":{"adaptiveLattice":{"na":48,"nb":9,"nz":32,"foot":true,"stepAll":true}}}'
# each harness and the state it tests (name:what it tests): the classic planner and what every visitor loads, or the new planner;
# phone-perf tests both, its classic sections in the classic mode and its section 5 in the new
CLASSIC=("restyle-regression:the classic planner's look" "phone:the classic planner on a phone" "desktop-reach:the classic planner on a desktop"
  "numbers:the classic planner's figures" "load-perf:the first load, the classic planner's and the opted-in one, on the site's own build"
  "sandbox-step:the classic planner" "simple-extras:the Simple page" "mc-reveal:the classic planner" "crossover:the Simple page and the classic planner"
  "production-build:the site as it ships" "tradeoffs:the classic planner's tournament (D42 keeps it)" "priorities:the classic planner's tournament"
  "simple-closecall:the Simple page" "tournament:the classic planner's tournament" "solver-progress:the plumbing every visitor's page carries")
NEW=("solver-config:the new planner's levers and limits, opted in on the build it makes" "solver-strategy:the new planner's Your plan, opted in on the build it makes"
  "solver-isolation:the new planner's isolation, opted in on the build it serves without headers, as GitHub Pages does"
  "solver-projection:the new planner's outlook, dials and Details, opted in on the build it makes"
  "solver-planner:the new planner, opted in on the build it makes")
BOTHSTATES=(phone-perf)

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
  echo; bash "$SELF" "$PORT" --new; ONCODE=$?
  word() { [ "$1" -eq 0 ] && echo green || echo FAILED; }
  echo; echo "== both modes: the classic planner $(word "$OFFCODE"), the new planner $(word "$ONCODE") =="
  if [ "$OFFCODE" -eq 0 ] && [ "$ONCODE" -eq 0 ]; then echo "ALL REQUIRED GREEN IN BOTH MODES"; exit 0; fi
  echo "SOMETHING REQUIRED FAILED"; exit 1
fi
# the code this gate runs on (research/solver/launch-stamp.mjs), for the readiness checklist (launch-ready.mjs), which counts a gate
# only on the release's own code
echo "the code: $(node research/solver/launch-stamp.mjs); the $MODE planner's mode"
for m in "$RUNNING"/*; do [ -e "$m" ] && ! kill -0 "${m##*/}" 2>/dev/null && rm -f "$m"; done
if [ -n "$(ls -A "$RUNNING" 2>/dev/null)" ]; then
  echo "== waiting for the batch units in flight ($(ls "$RUNNING" | wc -l)) =="
  while [ -n "$(ls -A "$RUNNING" 2>/dev/null)" ]; do sleep 30; for m in "$RUNNING"/*; do [ -e "$m" ] && ! kill -0 "${m##*/}" 2>/dev/null && rm -f "$m"; done; done
fi

OUT=dist
if [ "$MODE" = new ]; then
  OUT=dist-new
  echo "== build, the harnesses' light settings (SOLVER_HARNESS=1, into $OUT) =="
  SOLVER_HARNESS=1 SOLVER_HARNESS_OPTS="$LIGHT" npx vite build --outDir "$OUT" --emptyOutDir >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; exit 1; }
else
  echo "== build, the site as it ships =="
  env -u SOLVER_HARNESS -u SOLVER_HARNESS_OPTS -u PLANNER_BETA_OFF -u PLANNER_PLANT npm run build >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; exit 1; }
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
run_one() {   # name kind [VAR=value ...]: the harness, with what its mode tells it
  local f="research/ui-harnesses/$1-ui.cjs" n="$1" k="$2"; shift 2
  if [ ! -f "$f" ]; then NAMES+=("$n"); CODES+=("skip"); KINDS+=("$k"); return; fi
  local out; out=$(env "$@" node "$f" "$PORT" 2>&1); local code=$?
  NAMES+=("$n"); CODES+=("$code"); KINDS+=("$k")
  # every failing line, then the tail: a harness with twelve failures used to show the last three
  if [ "$code" -ne 0 ]; then echo "--- $n ---"; echo "$out" | grep -E '^\s*FAIL|^[A-Za-z].*@' | head -40; echo "   ..."; echo "$out" | tail -6; fi
}

stateOf() { local -n L="$1"; for e in "${L[@]}"; do [ "${e%%:*}" = "$2" ] && { echo "${e#*:}"; return 0; }; done; return 1; }
echo "== harnesses (the $MODE planner) =="
for n in "${REQUIRED[@]}"; do
  if [[ " ${BOTHSTATES[*]} " == *" $n "* ]]; then
    run_one "$n" required PHONE_PERF_ONLY="$([ "$MODE" = new ] && echo planner || echo classic)"; COVER+=(""); continue
  fi
  if [ "$MODE" = new ] && what="$(stateOf CLASSIC "$n")"; then NAMES+=("$n"); CODES+=("other"); KINDS+=("required"); COVER+=("the classic mode: $what"); continue; fi
  if [ "$MODE" = classic ] && what="$(stateOf NEW "$n")"; then NAMES+=("$n"); CODES+=("other"); KINDS+=("required"); COVER+=("the new mode: $what"); continue; fi
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
  elif [ "$c" = "other" ]; then r="run in ${COVER[$i]}"
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
if [ "$MODE" = new ]; then
  echo "   not run in the new mode: they do not read the planner"
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
