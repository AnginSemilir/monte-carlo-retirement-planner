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
#   Usage: research/ui-harnesses/run-all.sh [port]
#
set -uo pipefail
PORT="${1:-4173}"
cd "$(dirname "$0")/../.."

REQUIRED=(restyle-regression phone sandbox-step simple-extras mc-reveal crossover production-build tradeoffs priorities simple-closecall tournament)
# closecall-ui.cjs is not in either list: it takes a plans.json written by hand, not a port, and
# exists to investigate one household rather than to guard a behaviour.
OPTIONAL=(beneficiary-inputs estate-assets estate-deck estate-optimiser inheritance)

echo "== build =="
npm run build >/tmp/run-all-build.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/run-all-build.log; exit 1; }
echo "   ok"

echo "== serve on :$PORT =="
npx vite preview --port "$PORT" --strictPort >/tmp/run-all-preview.log 2>&1 &
PREVIEW=$!
# `kill 0` would take out this script too; target the one child, and tolerate it already being gone.
trap 'kill "$PREVIEW" 2>/dev/null || true' EXIT
for _ in $(seq 1 40); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done
curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "PREVIEW FAILED"; tail -20 /tmp/run-all-preview.log; exit 1; }
echo "   ok"

declare -a NAMES=() CODES=() KINDS=()
run_one() {   # name kind
  local f="research/ui-harnesses/$1-ui.cjs"
  if [ ! -f "$f" ]; then NAMES+=("$1"); CODES+=("skip"); KINDS+=("$2"); return; fi
  local out; out=$(node "$f" "$PORT" 2>&1); local code=$?
  NAMES+=("$1"); CODES+=("$code"); KINDS+=("$2")
  if [ "$code" -ne 0 ]; then echo "--- $1 ---"; echo "$out" | tail -15; fi
}

echo "== harnesses =="
for n in "${REQUIRED[@]}"; do run_one "$n" required; done
for n in "${OPTIONAL[@]}"; do run_one "$n" optional; done

echo
printf '%-22s %-9s %s\n' HARNESS KIND RESULT
FAILED=0
for i in "${!NAMES[@]}"; do
  c="${CODES[$i]}"
  if   [ "$c" = "skip" ]; then r="NOT PRESENT"; [ "${KINDS[$i]}" = required ] && FAILED=1
  elif [ "$c" -eq 0 ];   then r="pass"
  else r="FAIL ($c)"; [ "${KINDS[$i]}" = required ] && FAILED=1
  fi
  printf '%-22s %-9s %s\n' "${NAMES[$i]}" "${KINDS[$i]}" "$r"
done

echo
echo "== engine suites =="
npm run test:engine >/tmp/run-all-engine.log 2>&1 \
  && echo "   $(grep -c '^PASS' /tmp/run-all-engine.log) assertions passed" \
  || { echo "   ENGINE FAILED"; grep '^FAIL' /tmp/run-all-engine.log | head -10; FAILED=1; }

[ "$FAILED" -eq 0 ] && echo && echo "ALL REQUIRED GREEN" || { echo; echo "SOMETHING REQUIRED FAILED"; }
exit "$FAILED"
