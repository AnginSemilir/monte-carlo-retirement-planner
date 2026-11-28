#!/usr/bin/env bash
# Prints research/solver/results-pension-route.txt (CHECKLIST 6; D154 (3), how an employee pays into their pension): the
# test whole, its plants, the pattern search over every read of the route (research/solver/pension-route-mutations.py, on
# copies of this tree) and the earnings cap's sweep (its --capsweep, research/solver/pension-route-capsweep.mjs). About an
# hour on four cores.
#   bash research/solver/pension-route-results.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
python3 research/build-engine.py > /dev/null
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
node research/tests/pension-route.test.mjs > "$T/test.txt"
node research/tests/pension-route.test.mjs --plants > "$T/plants.txt"
python3 research/solver/pension-route-mutations.py -j 3 > "$T/mut.txt"
python3 research/solver/pension-route-mutations.py --capsweep > "$T/cap.txt"
OUT=research/solver/results-pension-route.txt
{
  cat "$T/test.txt"
  echo
  cat "$T/plants.txt"
  echo
  echo "THE PATTERN SEARCH (the reviewer on D154 (3), finding 1, and its second look, MINOR 1; research/solver/pension-route-mutations.py): each place the route is read changed alone, one at a time, on a copy of the tree, the engine rebuilt, the test run whole: put back to the NIC class (selfEmployed), and, at the forward run's and the exact model's taxable pay, everyone priced as net pay (true, the rows ending -allnet)"
  cat "$T/mut.txt"
  echo "the one not caught, allocateBudget's earnings cap, an equivalent change: grossUpNet and grossUpNetIncremental cap the credit at the salary times their own pass-through factor, so the cap's factor moves no figure under any route; allocateBudget against the engine over salaries (blank to £260,000), budgets, ISA shares, pass-through at 0, 50% and 100%, the MPAA, a pension floor, and the three routes (research/solver/pension-route-capsweep.mjs):"
  sed 's/^/  /' "$T/cap.txt"
} > "$OUT"
echo "written $OUT"
