#!/bin/sh
# ONE BATCH UNIT, AT LOW PRIORITY, AFTER ANY PAUSE THE GATE ASKS FOR (the launch plan of 1 Nov, section 5: timing-sensitive
# harnesses cannot run beside a batch, so the gate writes the pause file and waits for the units in flight; a unit waits
# while the file is there, then marks itself running until it ends). research/ui-harnesses/run-all.sh is the gate.
#   research/solver/run-unit.sh <command> [args...]
R=research/solver/results; P="$R/.pause"; M="$R/.running"
while [ -e "$P" ]; do sleep 20; done
mkdir -p "$M"; : > "$M/$$"
trap 'rm -f "$M/$$"' EXIT
nice -n 19 "$@"
